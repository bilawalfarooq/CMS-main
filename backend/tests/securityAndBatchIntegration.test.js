import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('Security & Batch Persistence Regression Tests', () => {
  let server;
  let baseUrl;
  let adminToken;
  let guardianToken;
  let testStudentId;
  let testGuardianId;
  let testGradeRecordId;

  before(async () => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    try {
      if (testGradeRecordId) {
        await prisma.gradeRecord.deleteMany({ where: { id: testGradeRecordId } });
      }
      if (testStudentId) {
        await prisma.student.deleteMany({ where: { id: testStudentId } });
      }
      if (testGuardianId) {
        await prisma.guardian.deleteMany({ where: { id: testGuardianId } });
      }
    } catch {
      // non-blocking cleanup
    }

    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('1. Auth Security: Masked placeholder "••••••••••••" is rejected as invalid password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@educore.edu',
        password: '••••••••••••',
      }),
    });

    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.error, /invalid email or password/i);
  });

  it('2. Auth Setup: Super admin logs in and acquires valid token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@educore.edu',
        password: 'Admin#2026!',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    adminToken = json.data.token;
  });

  it('3. Auth Setup: Guardian user logs in and acquires guardian token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tariq.mansoor@gmail.com',
        password: 'Admin#2026!',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    guardianToken = json.data.token;
  });

  it('4. Authorization IDOR: Guardian cannot submit excuse note for unlinked student', async () => {
    // STU-2026-0104 belongs to Ahmed Tariq / family, not Tariq Al-Mansoor
    const targetStudent = await prisma.student.findFirst({
      where: {
        guardian: {
          email: { not: 'tariq.mansoor@gmail.com' },
        },
      },
    });

    assert.ok(targetStudent, 'Target unlinked student must exist');

    const res = await fetch(`${baseUrl}/api/v1/portal/students/${targetStudent.id}/excuse-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guardianToken}`,
      },
      body: JSON.stringify({
        excuseNote: 'Unauthorized excuse note submission attempt',
      }),
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.error, /access denied|not authorized/i);
  });

  it('5. Authorization: Guardian can submit excuse note for their own linked student', async () => {
    const ownStudent = await prisma.student.findFirst({
      where: {
        guardian: {
          email: 'tariq.mansoor@gmail.com',
        },
      },
    });

    assert.ok(ownStudent, 'Guardian own student must exist');

    const res = await fetch(`${baseUrl}/api/v1/portal/students/${ownStudent.id}/excuse-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guardianToken}`,
      },
      body: JSON.stringify({
        excuseNote: 'Authorized doctor appointment excuse note',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
  });

  it('6. Gradebook: POST /api/v1/gradebook/batch-save persists scores and computes weighted grades', async () => {
    // Find a student and subject
    const existingGrade = await prisma.gradeRecord.findFirst({
      include: { student: true, section: true, subject: true },
    });

    assert.ok(existingGrade, 'A grade record must exist to test batch save');

    // Batch save updated scores for this record
    const updatedQuiz = 92;
    const updatedMidterm = 88;
    const updatedProject = 95;
    const updatedFinal = 90;

    const res = await fetch(`${baseUrl}/api/v1/gradebook/batch-save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sectionName: existingGrade.section.name,
        subjectName: existingGrade.subject.name,
        grades: [
          {
            id: existingGrade.id,
            quiz1: updatedQuiz,
            midterm: updatedMidterm,
            project: updatedProject,
            finalExam: updatedFinal,
          },
        ],
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.count, 1);

    // Verify directly from PostgreSQL
    const verified = await prisma.gradeRecord.findUnique({
      where: { id: existingGrade.id },
    });

    assert.equal(verified.quiz1, updatedQuiz);
    assert.equal(verified.midterm, updatedMidterm);
    assert.equal(verified.project, updatedProject);
    assert.equal(verified.finalExam, updatedFinal);

    // 92*0.15 + 88*0.35 + 95*0.20 + 90*0.30 = 13.8 + 30.8 + 19.0 + 27.0 = 90.6 -> A
    assert.equal(verified.weightedScore, 90.6);
    assert.equal(verified.letterGrade, 'A');
  });

  it('7. Security: Disabled user active session token is immediately blocked (403)', async () => {
    // Create a temporary test user
    const testEmail = `temp.tester.${Date.now()}@educore.edu`;
    const createRes = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Temporary Tester',
        email: testEmail,
        role: 'teacher',
        password: 'Admin#2026!',
      }),
    });
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    const tempUserId = createJson.data.id;

    // Log in as this user to get active token
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Admin#2026!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    const tempUserToken = loginJson.data.token;

    // Verify token works
    const check1 = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tempUserToken}` },
    });
    assert.equal(check1.status, 200);

    // Disable the user
    const toggleRes = await fetch(`${baseUrl}/api/v1/users/${tempUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(toggleRes.status, 200);

    // Existing active JWT token must now be rejected immediately
    const check2 = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tempUserToken}` },
    });
    assert.equal(check2.status, 403);
    const check2Json = await check2.json();
    assert.match(check2Json.error, /disabled|terminated/i);

    // Clean up temporary user
    await prisma.user.deleteMany({ where: { id: tempUserId } });
  });
});
