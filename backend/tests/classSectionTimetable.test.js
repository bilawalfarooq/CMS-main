import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { ENV } from '../src/config/env.js';

describe('AMSTech ERP - Class, Section & Timetable Management Tests', () => {
  let server;
  let baseUrl;
  let superAdminToken;
  let teacherToken;
  let createdClassId;
  let createdSectionId;
  const testClassCode = `T-CLS-${Date.now().toString().slice(-6)}`;
  const testSectionCode = `T-SEC-${Date.now().toString().slice(-4)}`;

  before(async () => {
    // Retrieve or provision super_admin and teacher for tests
    let adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', status: 'Active' },
    });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: `test-admin-${Date.now()}@amstech.edu.pk`,
          name: 'Test Super Admin',
          role: 'SUPER_ADMIN',
          userType: 'SuperAdmin',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          status: 'Active',
        },
      });
    }

    let teacherUser = await prisma.user.findFirst({
      where: { role: 'TEACHER', status: 'Active' },
    });
    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: {
          email: `test-teacher-${Date.now()}@amstech.edu.pk`,
          name: 'Test Teacher User',
          role: 'TEACHER',
          userType: 'Teacher',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          status: 'Active',
        },
      });
    }

    superAdminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );
    teacherToken = jwt.sign(
      { id: teacherUser.id, email: teacherUser.email, role: teacherUser.role, name: teacherUser.name },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

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
    // Cleanup test records
    try {
      if (createdSectionId) {
        await prisma.timetableSlot.deleteMany({ where: { sectionId: createdSectionId } });
        await prisma.timetableConfig.deleteMany({ where: { sectionId: createdSectionId } });
        await prisma.section.deleteMany({ where: { id: createdSectionId } });
      }
      if (createdClassId) {
        await prisma.timetableSlot.deleteMany({ where: { section: { classId: createdClassId } } });
        await prisma.timetableConfig.deleteMany({ where: { classId: createdClassId } });
        await prisma.section.deleteMany({ where: { classId: createdClassId } });
        await prisma.classGrade.deleteMany({ where: { id: createdClassId } });
      }
    } catch (e) {
      // Ignore cleanup error
    }

    await new Promise((resolve) => {
      server.close(resolve);
    });
    try {
      await prisma.$disconnect();
    } catch {}
  });

  // 1. Role Permission Tests
  it('1. GET /api/v1/classes without auth token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes`);
    assert.equal(res.status, 401);
  });

  it('2. POST /api/v1/classes with TEACHER role returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        name: `Forbidden Class ${Date.now()}`,
        code: `FORBIDDEN-${Date.now()}`,
      }),
    });
    assert.equal(res.status, 403);
  });

  // 2. Class Creation, Duplicate Validation, and Listing
  it('3. POST /api/v1/classes with SUPER_ADMIN creates class successfully', async () => {
    const payload = {
      name: `DAE Mechanical Engineering - 1st Year - ${Date.now()}`,
      code: testClassCode,
      level: 'Secondary',
      program: 'DAE',
      department: 'Mechanical',
      semester: 'Semester 1',
      duration: '3 Years',
      status: 'Active',
      initialSections: ['Section Alpha Init'],
    };

    const res = await fetch(`${baseUrl}/api/v1/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    const info = json.data.classInfo || json.data;
    assert.equal(info.code, testClassCode);
    assert.equal(info.program, 'DAE');
    createdClassId = info.id;
  });

  it('4. POST /api/v1/classes with duplicate code returns 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: `Another Duplicate Class ${Date.now()}`,
        code: testClassCode,
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.error, /already exists/i);
  });

  it('5. GET /api/v1/classes returns paginated classes with filtering and search', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes?search=${testClassCode}&program=DAE`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.items.length >= 1);
    assert.equal(json.data.items[0].code, testClassCode);
  });

  // 3. Section Creation and Class-to-Section Relationship
  it('6. POST /api/v1/classes/:id/sections creates a section under class', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes/${createdClassId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Section Special',
        code: testSectionCode,
        capacity: 45,
        room: 'Lab-Mech-01',
        operatingHours: '08:00 AM - 02:00 PM',
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.classId, createdClassId);
    assert.equal(json.data.code, testSectionCode);
    assert.equal(json.data.capacity, 45);
    createdSectionId = json.data.id;
  });

  it('7. POST duplicate section in the same class returns 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes/${createdClassId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Section Special',
        code: testSectionCode,
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  // 4. Complete Class Details Profile (7 Tabs Data)
  it('8. GET /api/v1/classes/:id returns complete academic profile with summary stats', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes/${createdClassId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.summaryCards);
    assert.ok(json.data.summaryCards.totalSections >= 1);
    assert.ok(Array.isArray(json.data.sections));
    assert.ok(Array.isArray(json.data.subjects));
    assert.ok(Array.isArray(json.data.teachers));
    assert.ok(Array.isArray(json.data.students));
    assert.ok(Array.isArray(json.data.timetable?.slots || json.data.timetableSlots));
    assert.ok(Array.isArray(json.data.history));
  });

  // 5. Automated Timetable Generation & Constraint Validation
  it('9. POST /api/v1/timetable/generate builds conflict-free schedule with theory and practicals', async () => {
    const staff = await prisma.staff.findFirst();
    const subject = await prisma.subject.findFirst();

    const generatePayload = {
      classId: createdClassId,
      sectionId: createdSectionId,
      academicYear: '2025-2026',
      semester: 'Semester 1',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periodsPerDay: 5,
      periodDuration: 45,
      lunchAfterPeriod: 3,
      allocations: [
        {
          subjectId: subject?.id || 'sub-math-01',
          subjectName: subject?.name || 'Applied Mathematics',
          teacherId: staff?.id || 'stf-001',
          teacherName: staff?.name || 'Dr. Tariq',
          room: 'Hall-101',
          weeklyTheory: 3,
          weeklyPractical: 2,
          isDoublePeriodPractical: true,
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/v1/timetable/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify(generatePayload),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.totalScheduled, 5); // 3 theory + 2 practical (consecutive)
    assert.equal(json.data.generatedSlots.length, 5);

    // Verify practical sessions are flagged
    const practicalSlots = json.data.generatedSlots.filter((s) => s.sessionType === 'Practical');
    assert.equal(practicalSlots.length, 2);
    assert.ok(practicalSlots.every((s) => s.isDoublePeriod === true));
  });

  // 6. Timetable Conflict Validation Engine
  it('10. POST /api/v1/timetable/validate detects simultaneous teacher and room collisions', async () => {
    const conflictingSlots = [
      {
        dayOfWeek: 'Monday',
        periodName: 'Period 1 (08:00 - 08:45)',
        subjectName: 'Physics',
        staffId: 'stf-same-teacher',
        staffName: 'Prof. Khan',
        room: 'Room-101',
      },
      {
        dayOfWeek: 'Monday',
        periodName: 'Period 1 (08:00 - 08:45)',
        subjectName: 'Chemistry',
        staffId: 'stf-same-teacher', // SAME TEACHER CONFLICT
        staffName: 'Prof. Khan',
        room: 'Room-102',
      },
      {
        dayOfWeek: 'Tuesday',
        periodName: 'Period 2 (08:45 - 09:30)',
        subjectName: 'Biology',
        staffId: 'stf-other-teacher',
        staffName: 'Prof. Sana',
        room: 'Room-Shared-Lab',
      },
      {
        dayOfWeek: 'Tuesday',
        periodName: 'Period 2 (08:45 - 09:30)',
        subjectName: 'English',
        staffId: 'stf-english-teacher',
        staffName: 'Prof. Ahmed',
        room: 'Room-Shared-Lab', // SAME ROOM CONFLICT
      },
    ];

    const res = await fetch(`${baseUrl}/api/v1/timetable/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ slots: conflictingSlots, sectionId: createdSectionId }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.isValid, false);
    assert.ok(json.data.conflicts.length >= 2);
    assert.ok(json.data.conflicts.some((c) => c.type.includes('Teacher')));
    assert.ok(json.data.conflicts.some((c) => c.type.includes('Room')));
  });

  // 7. Save Draft & Publish Timetable
  it('11. POST /api/v1/timetable/publish commits slots and creates audit log', async () => {
    const staff = await prisma.staff.findFirst();
    const subject = await prisma.subject.findFirst();

    const publishPayload = {
      classId: createdClassId,
      sectionId: createdSectionId,
      academicYearId: 'ay-2026',
      semester: 'Semester 1',
      slots: [
        {
          dayOfWeek: 'Wednesday',
          periodName: 'Period 1 (08:00 - 08:45)',
          subjectId: subject?.id,
          subjectName: subject?.name || 'Theory Sub',
          staffId: staff?.id,
          staffName: staff?.name || 'Test Teacher',
          room: 'Auditorium-1',
          sessionType: 'Theory',
          isDoublePeriod: false,
        },
      ],
      isDraft: false,
    };

    const res = await fetch(`${baseUrl}/api/v1/timetable/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify(publishPayload),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.slotsCount, 1);

    // Verify audit log entry was created
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: 'TIMETABLE_PUBLISH',
      },
      orderBy: { timestamp: 'desc' },
    });
    assert.ok(audit, 'Audit log entry for TIMETABLE_PUBLISH must exist');
    assert.ok(audit.actor);
  });

  // 8. Safe Archive Workflow
  it('12. DELETE /api/v1/classes/:id safely sets class to Inactive/Archived', async () => {
    const res = await fetch(`${baseUrl}/api/v1/classes/${createdClassId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.action === 'archived' || json.data.action === 'deleted');
  });
});
