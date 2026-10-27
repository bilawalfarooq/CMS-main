import prisma from '../../config/prisma.js';
import { generateStudentId, generateStudentEmail, allocateRollNumber } from '../../utils/idGenerator.js';

export async function getStudents({
  search,
  grade,
  section,
  status,
  academicYear,
  sortField = 'name',
  sortOrder = 'asc',
  page = 1,
  pageSize = 10,
}) {
  const where = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { id: { contains: q, mode: 'insensitive' } },
      { rollNo: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { guardian: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (grade && grade !== 'All') {
    where.classGrade = { name: grade };
  }

  if (section && section !== 'All') {
    where.section = { name: section };
  }

  if (status && status !== 'All') {
    where.status = status.toUpperCase();
  }

  if (academicYear && academicYear !== 'All') {
    where.academicYearId = academicYear.startsWith('ay-') ? academicYear : undefined;
  }

  const orderBy = {};
  if (sortField === 'rollNo' || sortField === 'name' || sortField === 'status' || sortField === 'admissionDate') {
    orderBy[sortField] = sortOrder;
  } else {
    orderBy.name = sortOrder;
  }

  const [total, rawStudents] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        classGrade: true,
        section: true,
        academicYear: true,
        guardian: true,
        academicHistory: true,
      },
    }),
  ]);

  const students = rawStudents.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    grade: s.classGrade.name,
    section: s.section.name,
    rollNo: s.rollNo,
    admissionDate: s.admissionDate.toISOString().slice(0, 10),
    academicYear: s.academicYearId,
    dob: s.dob.toISOString().slice(0, 10),
    gender: s.gender,
    bloodGroup: s.bloodGroup,
    previousSchool: s.previousSchool,
    address: s.address,
    avatar: s.avatar,
    status: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
    attendanceRate: s.attendanceRate,
    gpa: s.gpa,
    anomalyAlert: s.anomalyAlert,
    guardianName: s.guardian?.name || '',
    guardianPhone: s.guardian?.phone || '',
    guardianEmail: s.guardian?.email || '',
    secondaryGuardianName: s.guardian?.secondaryName || '',
    secondaryGuardianPhone: s.guardian?.secondaryPhone || '',
    secondaryGuardianRelation: s.guardian?.secondaryRelation || '',
    emergencyContact: s.guardian?.emergencyContact || '',
    academicHistory: s.academicHistory.map((h) => ({
      academicYear: h.academicYearId,
      grade: h.gradeName,
      section: h.sectionName,
      rollNo: h.rollNo,
      gpa: h.gpa,
      attendanceRate: h.attendanceRate,
      status: h.status,
      promotedAt: h.promotedAt.toISOString().slice(0, 10),
    })),
  }));

  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    students,
  };
}

export async function getStudentById(id) {
  const s = await prisma.student.findUnique({
    where: { id },
    include: {
      classGrade: true,
      section: true,
      academicYear: true,
      guardian: true,
      academicHistory: true,
      attendances: { orderBy: { date: 'desc' } },
      grades: { include: { subject: true } },
      invoices: { orderBy: { dueDate: 'desc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  });

  if (!s) return null;

  return {
    id: s.id,
    name: s.name,
    email: s.email,
    grade: s.classGrade.name,
    section: s.section.name,
    rollNo: s.rollNo,
    admissionDate: s.admissionDate.toISOString().slice(0, 10),
    academicYear: s.academicYearId,
    dob: s.dob.toISOString().slice(0, 10),
    gender: s.gender,
    bloodGroup: s.bloodGroup,
    previousSchool: s.previousSchool,
    address: s.address,
    avatar: s.avatar,
    status: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
    attendanceRate: s.attendanceRate,
    gpa: s.gpa,
    anomalyAlert: s.anomalyAlert,
    guardianName: s.guardian?.name || '',
    guardianPhone: s.guardian?.phone || '',
    guardianEmail: s.guardian?.email || '',
    secondaryGuardianName: s.guardian?.secondaryName || '',
    secondaryGuardianPhone: s.guardian?.secondaryPhone || '',
    secondaryGuardianRelation: s.guardian?.secondaryRelation || '',
    emergencyContact: s.guardian?.emergencyContact || '',
    academicHistory: s.academicHistory.map((h) => ({
      academicYear: h.academicYearId,
      grade: h.gradeName,
      section: h.sectionName,
      rollNo: h.rollNo,
      gpa: h.gpa,
      attendanceRate: h.attendanceRate,
      status: h.status,
      promotedAt: h.promotedAt.toISOString().slice(0, 10),
    })),
    attendances: s.attendances.map((a) => ({
      id: a.id,
      date: a.date.toISOString().slice(0, 10),
      period: a.periodName,
      status: a.status.charAt(0) + a.status.slice(1).toLowerCase(),
      remarks: a.remarks,
      rollNo: a.rollNo,
    })),
    grades: s.grades.map((g) => ({
      id: g.id,
      subject: g.subject?.name || 'Continuous Assessment',
      quiz1: g.quiz1,
      midterm: g.midterm,
      project: g.project,
      finalExam: g.finalExam,
      weightedScore: g.weightedScore,
      letterGrade: g.letterGrade,
      status: g.status,
    })),
    invoices: s.invoices.map((inv) => ({
      id: inv.id,
      studentId: inv.studentId,
      term: inv.term,
      amount: inv.amount,
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      status: inv.status.charAt(0) + inv.status.slice(1).toLowerCase(),
      paymentDate: inv.paymentDate ? inv.paymentDate.toISOString().slice(0, 10) : null,
      receipt: inv.receipt,
    })),
    documents: s.documents.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category.charAt(0) + d.category.slice(1).toLowerCase(),
      size: d.size,
      mimeType: d.mimeType,
      uploadedAt: d.uploadedAt.toISOString().slice(0, 10),
      status: d.status,
    })),
  };
}

export async function createStudentAdmission(data, actor = 'Registrar Staff') {
  // Resolve Class and Section
  const classGrade = await prisma.classGrade.findUnique({
    where: { name: data.grade },
  });
  if (!classGrade) throw new Error(`Grade '${data.grade}' does not exist.`);

  let section = await prisma.section.findUnique({
    where: {
      classId_name: {
        classId: classGrade.id,
        name: data.section,
      },
    },
  });
  if (!section) {
    section = await prisma.section.create({
      data: {
        name: data.section,
        classId: classGrade.id,
      },
    });
  }

  // Academic Year
  const academicYearId = data.academicYear || 'ay-2026';

  // Get existing cohort students for roll number allocation & validation
  const cohortStudents = await prisma.student.findMany({
    where: {
      academicYearId,
      classId: classGrade.id,
      sectionId: section.id,
    },
  });

  // Roll Number Validation / Allocation
  let rollNo = (data.customRoll || data.rollNo || '').trim();
  if (rollNo) {
    const collision = cohortStudents.some((s) => s.rollNo.toLowerCase() === rollNo.toLowerCase());
    if (collision) {
      throw new Error(`Roll number '${rollNo}' is already assigned in ${data.grade} (${data.section}).`);
    }
  } else {
    rollNo = allocateRollNumber(data.grade, data.section, cohortStudents);
  }

  // Student ID Validation / Allocation
  const existingAllStudents = await prisma.student.findMany({
    select: { id: true, email: true },
  });

  let studentId = (data.customId || data.id || '').trim();
  if (studentId) {
    const idCollision = existingAllStudents.some((s) => s.id.toLowerCase() === studentId.toLowerCase());
    if (idCollision) {
      throw new Error(`Student ID '${studentId}' is already registered in the system.`);
    }
  } else {
    studentId = generateStudentId(existingAllStudents, new Date().getFullYear());
  }

  // Email generation
  const email = generateStudentEmail(data.name, existingAllStudents);

  // Upsert Guardian
  let guardian = await prisma.guardian.findFirst({
    where: { email: data.guardianEmail.toLowerCase().trim() },
  });

  if (!guardian) {
    guardian = await prisma.guardian.create({
      data: {
        name: data.guardianName.trim(),
        email: data.guardianEmail.toLowerCase().trim(),
        phone: data.guardianPhone.trim(),
        secondaryName: data.secondaryGuardianName?.trim() || null,
        secondaryPhone: data.secondaryGuardianPhone?.trim() || null,
        secondaryRelation: data.secondaryGuardianRelation?.trim() || null,
        emergencyContact: data.emergencyContact?.trim() || null,
      },
    });
  }

  const createdStudent = await prisma.student.create({
    data: {
      id: studentId,
      name: data.name.trim(),
      email,
      rollNo,
      admissionDate: new Date(data.admissionDate),
      dob: new Date(data.dob),
      gender: data.gender,
      bloodGroup: data.bloodGroup || null,
      previousSchool: data.previousSchool || null,
      address: data.address || null,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      status: (data.status || 'Active').toUpperCase().replace('-', '_'),
      academicYearId,
      classId: classGrade.id,
      sectionId: section.id,
      guardianId: guardian.id,
      attendanceRate: null,
      gpa: null,
    },
    include: {
      classGrade: true,
      section: true,
      guardian: true,
    },
  });

  // Record Audit Log
  await prisma.auditLog.create({
    data: {
      actor,
      action: 'STUDENT_ADMISSION',
      entity: `${createdStudent.name} (${createdStudent.id}, Roll: ${createdStudent.rollNo}) admitted to ${data.section}`,
      ipAddress: '127.0.0.1',
      status: 'Success',
    },
  });

  // Record Queue job
  await prisma.queueJobRecord.create({
    data: {
      jobType: 'EMAIL_DISPATCH',
      target: guardian.email,
      recipient: guardian.name,
      status: 'Completed',
      description: `Welcome credentials & portal access dispatched to ${guardian.name}`,
    },
  });

  return getStudentById(createdStudent.id);
}

export async function bulkImportStudents(studentsList, actor = 'Registrar Staff') {
  let count = 0;
  for (const s of studentsList) {
    try {
      await createStudentAdmission(s, actor);
      count++;
    } catch {
      // Continue importing remaining valid students
    }
  }

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'BATCH_CSV_IMPORT',
      entity: `Ingested ${count} student records via CSV batch pipeline`,
      ipAddress: '127.0.0.1',
      status: 'Success',
    },
  });

  return { success: true, count };
}

export async function updateStudentProfile(id, fields, actor = 'Registrar Staff') {
  const existing = await prisma.student.findUnique({
    where: { id },
    include: { guardian: true },
  });
  if (!existing) throw new Error('Student record not found.');

  const updateData = {};
  if (fields.name) updateData.name = fields.name.trim();
  if (fields.dob) updateData.dob = new Date(fields.dob);
  if (fields.gender) updateData.gender = fields.gender;
  if (fields.bloodGroup !== undefined) updateData.bloodGroup = fields.bloodGroup;
  if (fields.previousSchool !== undefined) updateData.previousSchool = fields.previousSchool;
  if (fields.address !== undefined) updateData.address = fields.address;
  if (fields.avatar !== undefined) updateData.avatar = fields.avatar;

  // Update guardian details if provided
  if (existing.guardianId && (fields.guardianName || fields.guardianPhone || fields.guardianEmail)) {
    await prisma.guardian.update({
      where: { id: existing.guardianId },
      data: {
        name: fields.guardianName ? fields.guardianName.trim() : undefined,
        phone: fields.guardianPhone ? fields.guardianPhone.trim() : undefined,
        email: fields.guardianEmail ? fields.guardianEmail.trim().toLowerCase() : undefined,
        secondaryName: fields.secondaryGuardianName !== undefined ? fields.secondaryGuardianName : undefined,
        secondaryPhone: fields.secondaryGuardianPhone !== undefined ? fields.secondaryGuardianPhone : undefined,
        secondaryRelation: fields.secondaryGuardianRelation !== undefined ? fields.secondaryGuardianRelation : undefined,
        emergencyContact: fields.emergencyContact !== undefined ? fields.emergencyContact : undefined,
      },
    });
  }

  await prisma.student.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'STUDENT_RECORD_UPDATE',
      entity: `Updated profile details for student ID ${id}`,
      ipAddress: '127.0.0.1',
      status: 'Success',
    },
  });

  return getStudentById(id);
}

export async function updateStudentStatus(id, newStatus, reason = '', actor = 'Super Admin') {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new Error('Student not found.');

  const updated = await prisma.student.update({
    where: { id },
    data: { status: newStatus.toUpperCase().replace('-', '_') },
  });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'STUDENT_STATUS_CHANGE',
      entity: `Student ${id} status changed to ${newStatus}${reason ? ` (${reason})` : ''}`,
      ipAddress: '127.0.0.1',
      status: 'Success',
    },
  });

  return { id: updated.id, status: newStatus };
}

export async function deleteStudent(id, actor = 'Super Admin') {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new Error('Student not found.');

  await prisma.student.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'STUDENT_REMOVAL',
      entity: `Student record ${student.name} (${id}) removed from enrollment`,
      ipAddress: '127.0.0.1',
      status: 'Success',
    },
  });

  return { success: true, id };
}

export async function executeBatchPromotion({
  studentIds,
  sourceGrade,
  sourceSection,
  sourceAcademicYear,
  targetGrade,
  targetSection,
  targetAcademicYear,
  actor = 'Dean Vance (Principal)',
}) {
  if (!studentIds || studentIds.length === 0) {
    throw new Error('At least one student must be selected for promotion');
  }

  // Pre-validate candidates
  const candidates = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { classGrade: true, section: true },
  });

  if (candidates.length !== studentIds.length) {
    throw new Error('One or more selected student IDs do not exist.');
  }

  // Verify candidate statuses
  for (const c of candidates) {
    if (c.status === 'WITHDRAWN' || c.status === 'GRADUATED') {
      throw new Error(`Student ${c.name} (${c.id}) is ${c.status} and ineligible for promotion.`);
    }
  }

  // Resolve target class and section
  const targetClassGrade = await prisma.classGrade.findUnique({
    where: { name: targetGrade },
  });
  if (!targetClassGrade) throw new Error(`Target grade '${targetGrade}' does not exist.`);

  let targetSec = await prisma.section.findUnique({
    where: {
      classId_name: {
        classId: targetClassGrade.id,
        name: targetSection,
      },
    },
  });

  if (!targetSec) {
    targetSec = await prisma.section.create({
      data: {
        name: targetSection,
        classId: targetClassGrade.id,
      },
    });
  }

  // Target academic year
  const targetAyId = targetAcademicYear.startsWith('ay-') ? targetAcademicYear : 'ay-2026';

  // Get existing destination enrollments
  const destinationStudents = await prisma.student.findMany({
    where: {
      academicYearId: targetAyId,
      classId: targetClassGrade.id,
      sectionId: targetSec.id,
    },
  });

  // Check duplicate active enrollments
  const destStudentIdSet = new Set(destinationStudents.map((s) => s.id));
  for (const id of studentIds) {
    if (destStudentIdSet.has(id)) {
      throw new Error(`Student ID ${id} is already actively enrolled in destination cohort.`);
    }
  }

  // Execute atomic promotion in a transaction
  await prisma.$transaction(async (tx) => {
    let workingCohort = [...destinationStudents];

    for (const student of candidates) {
      // 1. Archive current placement into StudentEnrollmentHistory
      await tx.studentEnrollmentHistory.create({
        data: {
          studentId: student.id,
          academicYearId: student.academicYearId,
          gradeName: student.classGrade.name,
          sectionName: student.section.name,
          rollNo: student.rollNo,
          gpa: student.gpa,
          attendanceRate: student.attendanceRate,
          status: 'Promoted',
          promotedAt: new Date(),
        },
      });

      // 2. Allocate new roll number in destination
      const newRoll = allocateRollNumber(targetGrade, targetSection, workingCohort);

      // 3. Update student record
      const updated = await tx.student.update({
        where: { id: student.id },
        data: {
          academicYearId: targetAyId,
          classId: targetClassGrade.id,
          sectionId: targetSec.id,
          rollNo: newRoll,
        },
      });

      workingCohort.push(updated);
    }

    // 4. Record single audit log
    await tx.auditLog.create({
      data: {
        actor,
        action: 'BATCH_STUDENT_PROMOTION',
        entity: `Promoted ${candidates.length} students to ${targetGrade} (${targetSection}) for cycle ${targetAyId}`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    // 5. Record queue job
    await tx.queueJobRecord.create({
      data: {
        jobType: 'EMAIL_DISPATCH',
        target: 'Academic Council Registry',
        recipient: `${candidates.length} Students & Guardians`,
        status: 'Completed',
        description: `Class promotion transcripts dispatched for ${candidates.length} students advancing to ${targetGrade}`,
      },
    });
  });

  return { success: true, count: candidates.length };
}
