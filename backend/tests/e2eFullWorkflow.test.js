import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('End-to-End Workflow & Server Authorization Verification Tests', () => {
  let server;
  let baseUrl;
  let adminToken;
  let teacherToken;
  let admittedStudentId;
  let createdStaffId;

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
      if (admittedStudentId) {
        await prisma.studentEnrollmentHistory.deleteMany({ where: { studentId: admittedStudentId } });
        await prisma.student.deleteMany({ where: { id: admittedStudentId } });
      }
      if (createdStaffId) {
        await prisma.staff.deleteMany({ where: { id: createdStaffId } });
      }
    } catch {
      // non-blocking test cleanup
    }
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('1. Authentication: Super Admin logs in and receives valid JWT token', async () => {
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
    assert.equal(json.data.user.role, 'super_admin');
    adminToken = json.data.token;
  });

  it('2. Authentication: Teacher logs in with credentials and receives teacher JWT', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e.reed@educore.edu',
        password: 'Admin#2026!',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.token);
    assert.equal(json.data.user.role, 'teacher');
    teacherToken = json.data.token;
  });

  it('3. Authentication: Invalid password returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@educore.edu',
        password: 'WrongPassword#999',
      }),
    });
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  it('4. Authorization: Teacher is denied access to admin-only user creation (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized User',
        email: 'unauth@educore.edu',
        role: 'student',
        userType: 'Enrolled Student',
      }),
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.error, /denied|forbidden/i);
  });

  it('5. Authorization: Unauthenticated request to protected endpoint returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students`);
    assert.equal(res.status, 401);
  });

  it('6. Profile: GET /api/v1/auth/me returns current authenticated user profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.email, 'admin@educore.edu');
  });

  it('7. Student Admission: POST /api/v1/students creates new student', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Nadia El-Sayed',
        dob: '2010-04-12',
        admissionDate: '2026-08-15',
        grade: 'Grade 10',
        section: '10-B (Commerce)',
        gender: 'Female',
        academicYear: 'ay-2026',
        guardianName: 'Omar El-Sayed',
        guardianEmail: 'omar.elsayed@family.net',
        guardianPhone: '+1 (555) 777-8899',
      }),
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    assert.ok(json.data.rollNo);
    admittedStudentId = json.data.id;
  });

  it('8. Student Editing: PATCH /api/v1/students/:id updates student profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students/${admittedStudentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        address: '450 Innovation Parkway, Suite 12',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.address, '450 Innovation Parkway, Suite 12');
  });

  it('9. Student Status Change: PATCH /api/v1/students/:id/status updates status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students/${admittedStudentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'On-Leave',
        reason: 'Administrative academic review',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'On-Leave');
  });

  it('10. Student Promotion: POST /api/v1/students/promotion/execute promotes student cohort', async () => {
    const res = await fetch(`${baseUrl}/api/v1/students/promotion/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        studentIds: [admittedStudentId],
        sourceGrade: 'Grade 10',
        sourceSection: '10-B (Commerce)',
        sourceAcademicYear: 'ay-2026',
        targetGrade: 'Grade 11',
        targetSection: '11-PreEng',
        targetAcademicYear: 'ay-2026',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.count, 1);
  });

  it('11. Staff Management: POST /api/v1/staff creates staff member', async () => {
    const staffEmail = `a.pendelton.${Date.now().toString().slice(-4)}@educore.edu`;
    const res = await fetch(`${baseUrl}/api/v1/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Dr. Arthur Pendelton',
        department: 'Pure Mathematics',
        role: 'Professor',
        contract: 'Full-Time',
        email: staffEmail,
        phone: '+1 (555) 443-8811',
      }),
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    createdStaffId = json.data.id;
  });

  it('12. Staff Listing: GET /api/v1/staff lists staff members', async () => {
    const res = await fetch(`${baseUrl}/api/v1/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.length > 0);
  });

  it('13. Attendance: POST /api/v1/attendance/batch submits section attendance', async () => {
    const res = await fetch(`${baseUrl}/api/v1/attendance/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        section: '10-A (Science)',
        date: '2026-10-25',
        period: 'Daily Morning Roster',
        records: [
          {
            studentId: 'STU-2026-0101',
            status: 'Present',
            remarks: 'On time and prepared',
          },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.total, 1);
  });

  it('14. Gradebook: PATCH /api/v1/gradebook/:id updates score and derives weighted letter grade', async () => {
    // Find a grade record first
    const listRes = await fetch(`${baseUrl}/api/v1/gradebook?section=10-A (Science)`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const listJson = await listRes.json();
    const targetGrade = listJson.data[0];

    if (targetGrade) {
      const updateRes = await fetch(`${baseUrl}/api/v1/gradebook/${targetGrade.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          field: 'finalExam',
          value: 95,
        }),
      });
      assert.equal(updateRes.status, 200);
      const updateJson = await updateRes.json();
      assert.equal(updateJson.success, true);
      assert.equal(updateJson.data.finalExam, 95);
      assert.ok(updateJson.data.weightedScore > 0);
      assert.ok(updateJson.data.letterGrade);
    }
  });

  it('15. Gradebook: POST /api/v1/gradebook/batch-save commits batch grades', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gradebook/batch-save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        sectionName: '10-A (Science)',
        subjectName: 'Physics & Applied Mechanics',
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
  });

  it('16. Finance: GET /api/v1/finance/summary returns collection metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/finance/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.totalBilled >= 0);
    assert.ok(json.data.collectionRate >= 0);
  });

  it('17. Timetable: GET /api/v1/timetable returns timetable schedule matrix', async () => {
    const res = await fetch(`${baseUrl}/api/v1/timetable?section=10-A (Science)`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(typeof json.data === 'object');
  });

  it('18. Notifications: POST /api/v1/notifications/mark-all-read marks notifications read', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notifications/mark-all-read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
  });

  it('19. Queue: GET /api/v1/notifications/queue-jobs returns background worker activities', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notifications/queue-jobs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
  });

  it('20. RBAC Matrix: GET and PUT /api/v1/rbac/matrix synchronizes policy rules', async () => {
    const getRes = await fetch(`${baseUrl}/api/v1/rbac/matrix`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(Array.isArray(getJson.data));

    const putRes = await fetch(`${baseUrl}/api/v1/rbac/matrix`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ matrix: getJson.data }),
    });
    assert.equal(putRes.status, 200);
    const putJson = await putRes.json();
    assert.equal(putJson.success, true);
  });

  it('21. Audit Logs: GET /api/v1/audit-logs returns verifiable audit trail', async () => {
    const res = await fetch(`${baseUrl}/api/v1/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.length > 0);
  });
});
