import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('Live PostgreSQL REST API Integration Tests', () => {
  let server;
  let baseUrl;
  let authToken;
  let testStudentId;
  let testInvId;

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
      if (testStudentId) {
        await prisma.student.deleteMany({ where: { id: testStudentId } });
      }
      if (testInvId) {
        await prisma.payment.deleteMany({ where: { invoiceId: testInvId } });
        await prisma.invoice.deleteMany({ where: { id: testInvId } });
      }
    } catch {
      // non-blocking test cleanup
    }
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('1. GET /api/v1/health reports database: connected', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.database, 'connected');
  });

  it('2. POST /api/v1/auth/login logs in as super_admin and returns JWT token', async () => {
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
    assert.ok(json.data.token);
    assert.equal(json.data.user.email, 'admin@educore.edu');
    authToken = json.data.token;
  });

  it('3. GET /api/v1/students returns seeded students from PostgreSQL', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.length >= 6);
    assert.ok(json.pagination.total >= 6);
  });

  it('4. GET /api/v1/students/:id returns full student profile with grades and attendance', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students/STU-2026-0101`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.name, 'Aisha Al-Mansoor');
    assert.ok(Array.isArray(json.data.attendances));
    assert.ok(Array.isArray(json.data.grades));
  });

  it('5. POST /api/v1/students registers new student with unique collision-free ID & roll', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Tariq Test Student',
        dob: '2010-06-15',
        gender: 'Male',
        grade: 'Grade 10',
        section: '10-B (Commerce)',
        admissionDate: '2026-08-15',
        guardianName: 'Salma Test',
        guardianPhone: '+1 (555) 999-0011',
        guardianEmail: 'salma.test@family.net',
      }),
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.id.startsWith('STU-'));
    assert.ok(json.data.rollNo);
    assert.equal(json.data.gpa, null);
    assert.equal(json.data.attendanceRate, null);
    testStudentId = json.data.id;
  });

  it('6. POST /api/v1/students rejects duplicate roll number in same cohort', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Roll Student',
        dob: '2010-07-20',
        gender: 'Female',
        grade: 'Grade 10',
        section: '10-A (Science)',
        customRoll: '10A-01', // Already taken by Aisha
        admissionDate: '2026-08-15',
        guardianName: 'Guardian Parent',
        guardianPhone: '+1 (555) 888-0022',
        guardianEmail: 'guardian.parent@family.net',
      }),
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.error, /already assigned/i);
  });

  it('7. POST /api/v1/finance/invoices/:id/pay is idempotent', async () => {
    testInvId = `INV-TEST-${Date.now().toString().slice(-4)}`;
    const createRes = await fetch(`${baseUrl}/api/v1/finance/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: testInvId,
        studentId: 'STU-2026-0101',
        term: 'Spring Term 2027',
        amount: 1500,
        dueDate: '2027-02-01',
        status: 'Pending',
      }),
    });
    assert.equal(createRes.status, 201);

    // Settle invoice for the first time
    const res1 = await fetch(`${baseUrl}/api/v1/finance/invoices/${testInvId}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res1.status, 200);
    const json1 = await res1.json();
    assert.equal(json1.data.status, 'Paid');
    assert.equal(json1.data.isNewPayment, true);
    assert.ok(json1.data.receipt);

    // Call pay again -> idempotent, returns existing settled state without duplicate payment
    const res2 = await fetch(`${baseUrl}/api/v1/finance/invoices/${testInvId}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res2.status, 200);
    const json2 = await res2.json();
    assert.equal(json2.data.status, 'Paid');
    assert.equal(json2.data.isNewPayment, false);
    assert.equal(json2.data.receipt, json1.data.receipt);
  });
});
