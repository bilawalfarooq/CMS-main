import prisma from '../../config/prisma.js';

/**
 * List classes with search, filters, and pagination
 */
export async function listClasses({
  search = '',
  program = 'All',
  department = 'All',
  status = 'All',
  page = 1,
  limit = 20,
}) {
  const where = {};

  if (status && status !== 'All') {
    where.status = status;
  }
  if (program && program !== 'All') {
    where.program = program;
  }
  if (department && department !== 'All') {
    where.department = department;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { headTeacher: { contains: q, mode: 'insensitive' } },
      { department: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [total, classes] = await Promise.all([
    prisma.classGrade.count({ where }),
    prisma.classGrade.findMany({
      where,
      skip,
      take,
      include: {
        sections: {
          select: {
            id: true,
            name: true,
            code: true,
            capacity: true,
            room: true,
            status: true,
            _count: { select: { students: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const items = classes.map((c) => {
    const totalCapacity = c.sections.reduce((sum, s) => sum + (s.capacity || 40), 0);
    return {
      id: c.id,
      name: c.name,
      code: c.code || `CLS-${c.id.replace('c-', '')}`,
      level: c.level,
      program: c.program || 'General',
      department: c.department || 'General Academics',
      duration: c.duration || '1 Year',
      semester: c.semester || (c.level === 'Higher Secondary' ? 'Semester 1' : 'Year Level 1'),
      status: c.status || 'Active',
      headTeacher: c.headTeacher || 'Unassigned',
      sectionsCount: c.sections.length,
      sections: c.sections.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code || s.name,
        capacity: s.capacity || 40,
        enrolledCount: s._count.students,
        room: s.room || 'General Classroom',
        status: s.status || 'Active',
      })),
      enrolledCount: c._count.students,
      totalCapacity,
      utilizationRate: totalCapacity > 0 ? Math.round((c._count.students / totalCapacity) * 100) : 0,
      createdAt: c.createdAt,
    };
  });

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

/**
 * Get complete Class profile & detail view with 7 tabs data
 */
export async function getClassProfile(classId) {
  const cls = await prisma.classGrade.findUnique({
    where: { id: classId },
    include: {
      sections: {
        include: {
          _count: { select: { students: true, timetables: true } },
        },
        orderBy: { name: 'asc' },
      },
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          rollNo: true,
          status: true,
          attendanceRate: true,
          gpa: true,
          avatar: true,
          section: { select: { id: true, name: true } },
        },
        orderBy: { rollNo: 'asc' },
      },
      timetableConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!cls) {
    throw new Error(`Class with ID "${classId}" not found`);
  }

  // Fetch timetable slots for all sections of this class
  const sectionIds = cls.sections.map((s) => s.id);
  const timetableSlots = await prisma.timetableSlot.findMany({
    where: { sectionId: { in: sectionIds } },
    include: {
      subject: true,
      staff: true,
      section: true,
    },
    orderBy: { periodName: 'asc' },
  });

  // Extract distinct subjects
  const subjectMap = new Map();
  for (const slot of timetableSlots) {
    if (slot.subject && !subjectMap.has(slot.subject.id)) {
      subjectMap.set(slot.subject.id, {
        id: slot.subject.id,
        code: slot.subject.code,
        name: slot.subject.name,
        department: slot.subject.department,
        theoryHours: 3,
        practicalHours: slot.sessionType === 'Practical' ? 2 : 0,
        requiredRoomType: slot.sessionType === 'Practical' ? 'Specialized Laboratory' : 'Standard Lecture Hall',
        primaryTeacher: slot.staff?.name || 'TBD',
      });
    }
  }

  // If no slots exist yet, fetch default subjects
  let subjects = Array.from(subjectMap.values());
  if (subjects.length === 0) {
    const allSubs = await prisma.subject.findMany({ take: 6 });
    subjects = allSubs.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      department: s.department,
      theoryHours: 4,
      practicalHours: s.name.toLowerCase().includes('lab') || s.name.toLowerCase().includes('computer') ? 2 : 0,
      requiredRoomType: s.name.toLowerCase().includes('lab') ? 'Laboratory' : 'Lecture Hall',
      primaryTeacher: cls.headTeacher || 'Assigned Faculty',
    }));
  }

  // Extract distinct teachers & workload in this class
  const teacherMap = new Map();
  for (const slot of timetableSlots) {
    if (slot.staff) {
      const existing = teacherMap.get(slot.staff.id) || {
        id: slot.staff.id,
        name: slot.staff.name,
        email: slot.staff.email,
        department: slot.staff.department,
        role: slot.staff.role,
        assignedSections: new Set(),
        assignedSubjects: new Set(),
        weeklyHours: 0,
      };
      existing.assignedSections.add(slot.section.name);
      existing.assignedSubjects.add(slot.subject.name);
      existing.weeklyHours += 1;
      teacherMap.set(slot.staff.id, existing);
    }
  }

  const teachers = Array.from(teacherMap.values()).map((t) => ({
    ...t,
    assignedSections: Array.from(t.assignedSections),
    assignedSubjects: Array.from(t.assignedSubjects),
  }));

  // Fetch relevant audit logs for this class
  const historyLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: { contains: cls.name, mode: 'insensitive' } },
        { entity: { contains: cls.id, mode: 'insensitive' } },
        { action: { in: ['CLASS_CREATE', 'CLASS_UPDATE', 'SECTION_CREATE', 'SECTION_UPDATE', 'TIMETABLE_GENERATE'] } },
      ],
    },
    orderBy: { timestamp: 'desc' },
    take: 15,
  });

  // Calculate Summary metrics
  const totalEnrolled = cls.students.length;
  const totalCapacity = cls.sections.reduce((sum, s) => sum + (s.capacity || 40), 0);
  const totalWeeklyTeachingHours = timetableSlots.length;
  const uniqueRooms = Array.from(new Set(timetableSlots.map((s) => s.room).filter(Boolean)));

  // Detect potential scheduling conflicts in timetable
  const conflicts = [];
  const teacherSlotSeen = new Map();
  const roomSlotSeen = new Map();

  for (const slot of timetableSlots) {
    const tKey = `${slot.staffId}__${slot.dayOfWeek}__${slot.periodName}`;
    if (teacherSlotSeen.has(tKey)) {
      const prior = teacherSlotSeen.get(tKey);
      conflicts.push({
        type: 'Teacher Double-Booking',
        severity: 'High',
        message: `${slot.staff.name} is scheduled concurrently in ${prior.section.name} and ${slot.section.name} on ${slot.dayOfWeek} (${slot.periodName})`,
      });
    } else {
      teacherSlotSeen.set(tKey, slot);
    }

    const rKey = `${slot.room}__${slot.dayOfWeek}__${slot.periodName}`;
    if (roomSlotSeen.has(rKey)) {
      const prior = roomSlotSeen.get(rKey);
      conflicts.push({
        type: 'Room Double-Booking',
        severity: 'High',
        message: `Room "${slot.room}" is booked for both ${prior.section.name} and ${slot.section.name} on ${slot.dayOfWeek} (${slot.periodName})`,
      });
    } else {
      roomSlotSeen.set(rKey, slot);
    }
  }

  return {
    classInfo: {
      id: cls.id,
      name: cls.name,
      code: cls.code || `CLS-${cls.id.replace('c-', '')}`,
      level: cls.level,
      program: cls.program || 'General',
      department: cls.department || 'General Academics',
      duration: cls.duration || '1 Year',
      semester: cls.semester || (cls.level === 'Higher Secondary' ? 'Semester 1' : 'Year Level 1'),
      status: cls.status || 'Active',
      headTeacher: cls.headTeacher || 'Unassigned',
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
    },
    summaryCards: {
      totalSections: cls.sections.length,
      enrolledStudents: totalEnrolled,
      totalCapacity,
      utilizationPercentage: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
      totalSubjects: subjects.length,
      assignedTeachersCount: teachers.length > 0 ? teachers.length : (cls.headTeacher ? 1 : 0),
      weeklyTeachingHours: totalWeeklyTeachingHours,
      allocatedRoomsCount: uniqueRooms.length,
      allocatedRooms: uniqueRooms,
      conflictsCount: conflicts.length,
    },
    sections: cls.sections.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || s.name,
      capacity: s.capacity || 40,
      enrolledCount: s._count.students,
      scheduledSlotsCount: s._count.timetables,
      room: s.room || 'General Classroom',
      operatingHours: s.operatingHours || '08:30 - 14:00',
      status: s.status || 'Active',
    })),
    subjects,
    teachers,
    students: cls.students.map((st) => ({
      id: st.id,
      name: st.name,
      email: st.email,
      rollNo: st.rollNo,
      sectionName: st.section?.name || 'Unallocated',
      status: st.status,
      attendanceRate: st.attendanceRate ?? 95,
      gpa: st.gpa || 'N/A',
      avatar: st.avatar,
    })),
    timetable: {
      slotsCount: timetableSlots.length,
      conflicts,
      slots: timetableSlots.map((sl) => ({
        id: sl.id,
        sectionId: sl.sectionId,
        sectionName: sl.section.name,
        dayOfWeek: sl.dayOfWeek,
        periodName: sl.periodName,
        subjectName: sl.subject.name,
        subjectCode: sl.subject.code,
        teacherName: sl.staff.name,
        room: sl.room,
        colorTag: sl.colorTag,
        sessionType: sl.sessionType || 'Theory',
        isDoublePeriod: sl.isDoublePeriod,
      })),
      activeConfig: cls.timetableConfigs[0] || null,
    },
    history: historyLogs.map((h) => ({
      id: h.id,
      timestamp: h.timestamp,
      actor: h.actor,
      action: h.action,
      entity: h.entity,
      status: h.status,
    })),
  };
}

/**
 * Create a new class
 */
export async function createClass({
  id,
  name,
  code,
  level = 'Secondary',
  program = 'General',
  department = 'General Academics',
  duration = '1 Year',
  semester = 'Year Level 1',
  headTeacher,
  status = 'Active',
  initialSections = ['Section A'],
}, actor = 'Super Admin') {
  if (!name || !name.trim()) {
    throw new Error('Class name is required');
  }

  const existingName = await prisma.classGrade.findUnique({
    where: { name: name.trim() },
  });
  if (existingName) {
    throw new Error(`A class with the name "${name}" already exists`);
  }

  const generatedCode = code?.trim() || `CLS-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (code && code.trim()) {
    const existingCode = await prisma.classGrade.findFirst({
      where: { code: code.trim() },
    });
    if (existingCode) {
      throw new Error(`A class with code "${code}" already exists`);
    }
  }

  const classId = id?.trim() || `c-${Date.now().toString().slice(-6)}`;

  const created = await prisma.$transaction(async (tx) => {
    const newClass = await tx.classGrade.create({
      data: {
        id: classId,
        name: name.trim(),
        code: generatedCode,
        level,
        program,
        department,
        duration,
        semester,
        headTeacher,
        status,
      },
    });

    if (Array.isArray(initialSections) && initialSections.length > 0) {
      for (const secName of initialSections) {
        if (secName && secName.trim()) {
          await tx.section.create({
            data: {
              name: secName.trim(),
              code: `${generatedCode}-${secName.trim().replace(/\s+/g, '')}`,
              classId: newClass.id,
              capacity: 40,
            },
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        actor,
        action: 'CLASS_CREATE',
        entity: `Created class ${newClass.name} (${newClass.code})`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    });

    return newClass;
  });

  return getClassProfile(created.id);
}

/**
 * Update an existing class
 */
export async function updateClass(classId, updateData, actor = 'Super Admin') {
  const existing = await prisma.classGrade.findUnique({ where: { id: classId } });
  if (!existing) {
    throw new Error(`Class with ID "${classId}" not found`);
  }

  if (updateData.name && updateData.name.trim() !== existing.name) {
    const nameClash = await prisma.classGrade.findUnique({ where: { name: updateData.name.trim() } });
    if (nameClash && nameClash.id !== classId) {
      throw new Error(`Class name "${updateData.name}" is already taken`);
    }
  }

  if (updateData.code && updateData.code.trim() !== existing.code) {
    const codeClash = await prisma.classGrade.findFirst({ where: { code: updateData.code.trim() } });
    if (codeClash && codeClash.id !== classId) {
      throw new Error(`Class code "${updateData.code}" is already taken`);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.classGrade.update({
      where: { id: classId },
      data: {
        name: updateData.name !== undefined ? updateData.name.trim() : undefined,
        code: updateData.code !== undefined ? updateData.code.trim() : undefined,
        level: updateData.level !== undefined ? updateData.level : undefined,
        program: updateData.program !== undefined ? updateData.program : undefined,
        department: updateData.department !== undefined ? updateData.department : undefined,
        duration: updateData.duration !== undefined ? updateData.duration : undefined,
        semester: updateData.semester !== undefined ? updateData.semester : undefined,
        headTeacher: updateData.headTeacher !== undefined ? updateData.headTeacher : undefined,
        status: updateData.status !== undefined ? updateData.status : undefined,
      },
    });

    await tx.auditLog.create({
      data: {
        actor,
        action: 'CLASS_UPDATE',
        entity: `Updated class specifications for ${res.name} (${res.code})`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    });

    return res;
  });

  return getClassProfile(updated.id);
}

/**
 * Safe archive or delete class
 */
export async function deleteClass(classId, force = false, actor = 'Super Admin') {
  const cls = await prisma.classGrade.findUnique({
    where: { id: classId },
    include: {
      _count: { select: { students: true, sections: true } },
    },
  });

  if (!cls) {
    throw new Error(`Class with ID "${classId}" not found`);
  }

  if ((cls._count.students > 0 || cls._count.sections > 0) && !force) {
    // Soft-archive to preserve relational integrity & student/section records
    await prisma.classGrade.update({
      where: { id: classId },
      data: { status: 'Archived' },
    });
    await prisma.auditLog.create({
      data: {
        actor,
        action: 'CLASS_ARCHIVE',
        entity: `Archived class ${cls.name} (Protected relational data)`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    });
    return {
      success: true,
      action: 'archived',
      status: 'Archived',
      message: `Class "${cls.name}" was safely archived to preserve relational data.`,
    };
  }

  // Hard delete if forced or completely empty
  await prisma.$transaction([
    prisma.timetableSlot.deleteMany({ where: { section: { classId } } }),
    prisma.timetableConfig.deleteMany({ where: { classId } }),
    prisma.section.deleteMany({ where: { classId } }),
    prisma.classGrade.delete({ where: { id: classId } }),
    prisma.auditLog.create({
      data: {
        actor,
        action: 'CLASS_DELETE',
        entity: `Deleted class ${cls.name}`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    }),
  ]);

  return {
    success: true,
    action: 'deleted',
    status: 'Deleted',
    message: `Class "${cls.name}" was permanently removed.`,
  };
}

/**
 * Section CRUD Operations
 */
export async function createSection(classId, {
  name,
  code,
  capacity = 40,
  room,
  operatingHours = '08:30 - 14:00',
  status = 'Active',
}, actor = 'Super Admin') {
  if (!name || !name.trim()) {
    throw new Error('Section name is required');
  }

  const cls = await prisma.classGrade.findUnique({ where: { id: classId } });
  if (!cls) {
    throw new Error(`Parent class "${classId}" not found`);
  }

  const existing = await prisma.section.findUnique({
    where: { classId_name: { classId, name: name.trim() } },
  });
  if (existing) {
    throw new Error(`Section "${name}" already exists in class "${cls.name}"`);
  }

  const secCode = code?.trim() || `${cls.code || 'SEC'}-${name.trim().replace(/\s+/g, '')}`;

  const created = await prisma.section.create({
    data: {
      name: name.trim(),
      code: secCode,
      classId,
      capacity: Number(capacity) || 40,
      room: room?.trim() || null,
      operatingHours,
      status,
    },
    include: {
      classGrade: true,
      _count: { select: { students: true, timetables: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'SECTION_CREATE',
      entity: `Created section ${created.name} in ${cls.name}`,
      ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
      status: 'Success',
    },
  });

  return created;
}

export async function updateSection(sectionId, updateData, actor = 'Super Admin') {
  const existing = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { classGrade: true },
  });
  if (!existing) {
    throw new Error(`Section with ID "${sectionId}" not found`);
  }

  if (updateData.name && updateData.name.trim() !== existing.name) {
    const clash = await prisma.section.findUnique({
      where: { classId_name: { classId: existing.classId, name: updateData.name.trim() } },
    });
    if (clash && clash.id !== sectionId) {
      throw new Error(`Section name "${updateData.name}" already exists in this class`);
    }
  }

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: {
      name: updateData.name !== undefined ? updateData.name.trim() : undefined,
      code: updateData.code !== undefined ? updateData.code.trim() : undefined,
      capacity: updateData.capacity !== undefined ? Number(updateData.capacity) : undefined,
      room: updateData.room !== undefined ? updateData.room.trim() : undefined,
      operatingHours: updateData.operatingHours !== undefined ? updateData.operatingHours : undefined,
      status: updateData.status !== undefined ? updateData.status : undefined,
    },
    include: {
      classGrade: true,
      _count: { select: { students: true, timetables: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'SECTION_UPDATE',
      entity: `Updated section ${updated.name} in ${existing.classGrade.name}`,
      ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
      status: 'Success',
    },
  });

  return updated;
}

export async function deleteSection(sectionId, force = false, actor = 'Super Admin') {
  const sec = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      classGrade: true,
      _count: { select: { students: true } },
    },
  });

  if (!sec) {
    throw new Error(`Section with ID "${sectionId}" not found`);
  }

  if (sec._count.students > 0 && !force) {
    await prisma.section.update({
      where: { id: sectionId },
      data: { status: 'Inactive' },
    });
    await prisma.auditLog.create({
      data: {
        actor,
        action: 'SECTION_DEACTIVATE',
        entity: `Set section ${sec.name} inactive (Preserved ${sec._count.students} students)`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    });
    return {
      success: true,
      action: 'deactivated',
      message: `Section "${sec.name}" has ${sec._count.students} enrolled students and was set to Inactive to protect data integrity.`,
    };
  }

  await prisma.$transaction([
    prisma.section.delete({ where: { id: sectionId } }),
    prisma.auditLog.create({
      data: {
        actor,
        action: 'SECTION_DELETE',
        entity: `Deleted section ${sec.name} from ${sec.classGrade.name}`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    }),
  ]);

  return {
    success: true,
    action: 'deleted',
    message: `Section "${sec.name}" was permanently removed.`,
  };
}
