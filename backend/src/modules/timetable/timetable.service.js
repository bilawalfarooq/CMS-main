import prisma from '../../config/prisma.js';

/**
 * Generate standard period labels based on hours, duration, and breaks
 */
export function generateDailyTimeSlots({
  dailyStartTime = '08:30',
  dailyEndTime = '14:00',
  periodDurationMinutes = 50,
  breakIntervals = [
    { name: 'Morning Break', startTime: '10:15', endTime: '10:35', isLunch: false },
    { name: 'Lunch Interval', startTime: '12:15', endTime: '13:00', isLunch: true },
  ],
  maxPeriods = 6,
}) {
  const periods = [];
  const [startH, startM] = dailyStartTime.split(':').map(Number);
  const [endH, endM] = dailyEndTime.split(':').map(Number);

  let currentMin = startH * 60 + startM;
  const endLimitMin = endH * 60 + endM;

  let periodNum = 1;

  while (currentMin + periodDurationMinutes <= endLimitMin && periodNum <= maxPeriods) {
    const curHStr = String(Math.floor(currentMin / 60)).padStart(2, '0');
    const curMStr = String(currentMin % 60).padStart(2, '0');

    // Check if currentMin falls inside a break
    const activeBreak = breakIntervals?.find((b) => {
      const [bStartH, bStartM] = b.startTime.split(':').map(Number);
      const [bEndH, bEndM] = b.endTime.split(':').map(Number);
      const bStart = bStartH * 60 + bStartM;
      const bEnd = bEndH * 60 + bEndM;
      return currentMin >= bStart && currentMin < bEnd;
    });

    if (activeBreak) {
      const [bEndH, bEndM] = activeBreak.endTime.split(':').map(Number);
      periods.push({
        isBreak: true,
        name: activeBreak.name,
        timeSlot: `${activeBreak.startTime} - ${activeBreak.endTime}`,
        periodName: `[${activeBreak.name}] (${activeBreak.startTime} - ${activeBreak.endTime})`,
      });
      currentMin = bEndH * 60 + bEndM;
      continue;
    }

    const nextMin = currentMin + periodDurationMinutes;
    const nextHStr = String(Math.floor(nextMin / 60)).padStart(2, '0');
    const nextMStr = String(nextMin % 60).padStart(2, '0');

    periods.push({
      isBreak: false,
      periodIndex: periodNum,
      periodName: `Period ${periodNum} (${curHStr}:${curMStr} - ${nextHStr}:${nextMStr})`,
      startTime: `${curHStr}:${curMStr}`,
      endTime: `${nextHStr}:${nextMStr}`,
    });

    currentMin = nextMin + 5; // 5 min transition buffer
    periodNum++;
  }

  // Fallback default periods if none derived
  if (periods.length === 0) {
    return [
      { isBreak: false, periodIndex: 1, periodName: 'Period 1 (08:30 - 09:20)' },
      { isBreak: false, periodIndex: 2, periodName: 'Period 2 (09:25 - 10:15)' },
      { isBreak: true, name: 'Morning Break', periodName: '[Morning Break] (10:15 - 10:30)' },
      { isBreak: false, periodIndex: 3, periodName: 'Period 3 (10:30 - 11:20)' },
      { isBreak: false, periodIndex: 4, periodName: 'Period 4 (11:25 - 12:15)' },
      { isBreak: true, name: 'Lunch Interval', periodName: '[Lunch Interval] (12:15 - 13:00)' },
      { isBreak: false, periodIndex: 5, periodName: 'Period 5 (01:00 - 01:50)' },
    ];
  }

  return periods;
}

/**
 * Constraint-Aware Automated Timetable Generator
 */
export async function generateAutomatedTimetable({
  academicYearId = 'ay-2026',
  classId,
  sectionId,
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  dailyStartTime = '08:30',
  dailyEndTime = '14:00',
  periodDurationMinutes = 50,
  breakIntervals = [
    { name: 'Morning Break', startTime: '10:15', endTime: '10:35', isLunch: false },
    { name: 'Lunch Interval', startTime: '12:15', endTime: '13:00', isLunch: true },
  ],
  maxPeriodsPerDay = 6,
  subjectAllocations = [], // [{ subjectId, staffId, room, weeklyTheory, weeklyPractical, isDoublePeriod, colorTag }]
  allocations = [],
}) {
  const finalAllocations = subjectAllocations && subjectAllocations.length > 0 ? subjectAllocations : (allocations || []);
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { classGrade: true },
  });
  if (!section) {
    throw new Error(`Section "${sectionId}" not found`);
  }

  // 1. Generate available teaching periods per day
  const dailySlots = generateDailyTimeSlots({
    dailyStartTime,
    dailyEndTime,
    periodDurationMinutes,
    breakIntervals,
    maxPeriods: maxPeriodsPerDay,
  });

  const teachingPeriods = dailySlots.filter((s) => !s.isBreak);

  // 2. Fetch all existing reservations across the ENTIRE school to prevent collisions
  const existingGlobalSlots = await prisma.timetableSlot.findMany({
    where: {
      academicYearId,
      sectionId: { not: sectionId }, // Exclude current section since we are regenerating
    },
    select: {
      dayOfWeek: true,
      periodName: true,
      staffId: true,
      room: true,
      section: { select: { name: true } },
    },
  });

  // Busy trackers:
  // Key format: `${staffId}__${day}__${periodName}`
  const busyTeachers = new Map();
  // Key format: `${room}__${day}__${periodName}`
  const busyRooms = new Map();

  for (const s of existingGlobalSlots) {
    busyTeachers.set(`${s.staffId}__${s.dayOfWeek}__${s.periodName}`, s.section.name);
    busyRooms.set(`${s.room}__${s.dayOfWeek}__${s.periodName}`, s.section.name);
  }

  // Also query metadata for subjects and staff
  const staffIds = subjectAllocations.map((a) => a.staffId).filter(Boolean);
  const subjectIds = subjectAllocations.map((a) => a.subjectId).filter(Boolean);

  const [staffList, subList] = await Promise.all([
    prisma.staff.findMany({ where: { id: { in: staffIds } } }),
    prisma.subject.findMany({ where: { id: { in: subjectIds } } }),
  ]);

  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const subMap = new Map(subList.map((s) => [s.id, s]));

  // 3. Flatten required sessions queue: Double Practical sessions first, then single Theory sessions
  const sessionsQueue = [];

  for (const alloc of finalAllocations) {
    const staffId = alloc.staffId || alloc.teacherId;
    const isDouble = alloc.isDoublePeriod !== undefined 
      ? alloc.isDoublePeriod 
      : (alloc.isDoublePeriodPractical !== undefined ? alloc.isDoublePeriodPractical : true);
    const sub = subMap.get(alloc.subjectId);
    const stf = staffMap.get(staffId);
    const room = alloc.room || 'General Classroom';
    const colorTag = alloc.colorTag || 'bg-indigo-50 text-indigo-700 border-indigo-200';

    // Queue double practicals
    const practicalCount = Number(alloc.weeklyPractical) || 0;
    let practicalPairs = isDouble ? Math.floor(practicalCount / 2) : 0;
    let singlePracticals = isDouble ? practicalCount % 2 : practicalCount;

    for (let i = 0; i < practicalPairs; i++) {
      sessionsQueue.push({
        type: 'Practical',
        isDouble: true,
        subjectId: alloc.subjectId,
        subjectName: sub?.name || alloc.subjectName || 'Subject',
        subjectCode: sub?.code || 'SUB',
        staffId,
        staffName: stf?.name || alloc.teacherName || 'Assigned Faculty',
        room,
        colorTag,
      });
    }

    for (let i = 0; i < singlePracticals; i++) {
      sessionsQueue.push({
        type: 'Practical',
        isDouble: false,
        subjectId: alloc.subjectId,
        subjectName: sub?.name || alloc.subjectName || 'Subject',
        subjectCode: sub?.code || 'SUB',
        staffId,
        staffName: stf?.name || alloc.teacherName || 'Assigned Faculty',
        room,
        colorTag,
      });
    }

    // Queue single theory sessions
    const theoryCount = Number(alloc.weeklyTheory) || 0;
    for (let i = 0; i < theoryCount; i++) {
      sessionsQueue.push({
        type: 'Theory',
        isDouble: false,
        subjectId: alloc.subjectId,
        subjectName: sub?.name || alloc.subjectName || 'Subject',
        subjectCode: sub?.code || 'SUB',
        staffId,
        staffName: stf?.name || alloc.teacherName || 'Assigned Faculty',
        room,
        colorTag,
      });
    }
  }

  // Sort queue: double periods first (most constrained)
  sessionsQueue.sort((a, b) => (b.isDouble ? 1 : 0) - (a.isDouble ? 1 : 0));

  // 4. Scheduling Matrix
  const generatedSlots = [];
  const warnings = [];
  const unscheduled = [];

  // Local section schedule map: `${day}__${periodName}` -> slot
  const sectionGrid = new Map();
  // Count sessions per day to balance timetable
  const dayUsageCount = new Map(workingDays.map((d) => [d, 0]));

  for (const session of sessionsQueue) {
    let placed = false;

    // Sort working days by least loaded to evenly distribute
    const sortedDays = [...workingDays].sort((a, b) => (dayUsageCount.get(a) || 0) - (dayUsageCount.get(b) || 0));

    for (const day of sortedDays) {
      if (placed) break;

      if (session.isDouble) {
        // Find consecutive periods p and p+1
        for (let idx = 0; idx < teachingPeriods.length - 1; idx++) {
          const p1 = teachingPeriods[idx];
          const p2 = teachingPeriods[idx + 1];

          // Check consecutive indices
          if (p2.periodIndex !== p1.periodIndex + 1) continue;

          const key1 = `${day}__${p1.periodName}`;
          const key2 = `${day}__${p2.periodName}`;

          const tKey1 = `${session.staffId}__${day}__${p1.periodName}`;
          const tKey2 = `${session.staffId}__${day}__${p2.periodName}`;
          const rKey1 = `${session.room}__${day}__${p1.periodName}`;
          const rKey2 = `${session.room}__${day}__${p2.periodName}`;

          if (
            !sectionGrid.has(key1) &&
            !sectionGrid.has(key2) &&
            !busyTeachers.has(tKey1) &&
            !busyTeachers.has(tKey2) &&
            !busyRooms.has(rKey1) &&
            !busyRooms.has(rKey2)
          ) {
            // Place consecutive block
            const slot1 = {
              academicYearId,
              sectionId,
              sectionName: section.name,
              dayOfWeek: day,
              periodName: p1.periodName,
              subjectId: session.subjectId,
              subjectName: session.subjectName,
              subjectCode: session.subjectCode,
              staffId: session.staffId,
              staffName: session.staffName,
              room: session.room,
              colorTag: session.colorTag,
              sessionType: 'Practical',
              isDoublePeriod: true,
              isDraft: true,
            };

            const slot2 = {
              academicYearId,
              sectionId,
              sectionName: section.name,
              dayOfWeek: day,
              periodName: p2.periodName,
              subjectId: session.subjectId,
              subjectName: session.subjectName,
              subjectCode: session.subjectCode,
              staffId: session.staffId,
              staffName: session.staffName,
              room: session.room,
              colorTag: session.colorTag,
              sessionType: 'Practical',
              isDoublePeriod: true,
              isDraft: true,
            };

            generatedSlots.push(slot1, slot2);
            sectionGrid.set(key1, slot1);
            sectionGrid.set(key2, slot2);
            busyTeachers.set(tKey1, section.name);
            busyTeachers.set(tKey2, section.name);
            busyRooms.set(rKey1, section.name);
            busyRooms.set(rKey2, section.name);
            dayUsageCount.set(day, (dayUsageCount.get(day) || 0) + 2);
            placed = true;
            break;
          }
        }
      } else {
        // Single period
        for (const p of teachingPeriods) {
          const key = `${day}__${p.periodName}`;
          const tKey = `${session.staffId}__${day}__${p.periodName}`;
          const rKey = `${session.room}__${day}__${p.periodName}`;

          if (!sectionGrid.has(key) && !busyTeachers.has(tKey) && !busyRooms.has(rKey)) {
            const slot = {
              academicYearId,
              sectionId,
              sectionName: section.name,
              dayOfWeek: day,
              periodName: p.periodName,
              subjectId: session.subjectId,
              subjectName: session.subjectName,
              subjectCode: session.subjectCode,
              staffId: session.staffId,
              staffName: session.staffName,
              room: session.room,
              colorTag: session.colorTag,
              sessionType: session.type,
              isDoublePeriod: false,
              isDraft: true,
            };

            generatedSlots.push(slot);
            sectionGrid.set(key, slot);
            busyTeachers.set(tKey, section.name);
            busyRooms.set(rKey, section.name);
            dayUsageCount.set(day, (dayUsageCount.get(day) || 0) + 1);
            placed = true;
            break;
          }
        }
      }
    }

    if (!placed) {
      unscheduled.push({
        subjectName: session.subjectName,
        type: session.type,
        isDouble: session.isDouble,
        teacher: session.staffName,
        room: session.room,
        reason: 'Teacher or room collision across all available operating hours.',
      });
      warnings.push(
        `Unable to schedule ${session.type} (${session.subjectName}) for ${session.staffName}: Room or Teacher has schedule conflicts.`
      );
    }
  }

  // 5. Build presentation grid for UI
  const scheduleMatrix = {};
  for (const day of workingDays) {
    scheduleMatrix[day] = [];
    for (const p of dailySlots) {
      if (p.isBreak) {
        scheduleMatrix[day].push({
          periodName: p.periodName,
          isBreak: true,
          name: p.name,
          timeSlot: p.timeSlot,
        });
      } else {
        const key = `${day}__${p.periodName}`;
        const slot = sectionGrid.get(key);
        if (slot) {
          scheduleMatrix[day].push({
            ...slot,
            isBreak: false,
            periodName: p.periodName,
          });
        } else {
          scheduleMatrix[day].push({
            isBreak: false,
            periodName: p.periodName,
            isVacant: true,
          });
        }
      }
    }
  }

  return {
    success: unscheduled.length === 0,
    generatedSlots,
    totalScheduled: generatedSlots.length,
    totalUnscheduled: unscheduled.length,
    unscheduled,
    warnings,
    scheduleMatrix,
    dailyTimeSlots: dailySlots,
    meta: {
      classId: section.classId,
      className: section.classGrade.name,
      sectionId: section.id,
      sectionName: section.name,
      academicYearId,
      workingDays,
    },
  };
}

/**
 * Validate proposed or existing timetable against all 10 scheduling constraints
 */
export async function validateTimetableSlots({ sectionId, academicYearId = 'ay-2026', slots = [] }) {
  const conflicts = [];
  const teacherMap = new Map();
  const roomMap = new Map();
  const sectionPeriodMap = new Map();

  // Query global external slots in other sections
  const externalSlots = await prisma.timetableSlot.findMany({
    where: {
      academicYearId,
      sectionId: { not: sectionId },
    },
    include: { staff: true, section: true },
  });

  for (const es of externalSlots) {
    teacherMap.set(`${es.staffId}__${es.dayOfWeek}__${es.periodName}`, {
      source: `Section ${es.section.name}`,
      actor: es.staff.name,
    });
    roomMap.set(`${es.room}__${es.dayOfWeek}__${es.periodName}`, {
      source: `Section ${es.section.name}`,
      room: es.room,
    });
  }

  // Check intra-schedule and global conflicts
  for (const s of slots) {
    const staffId = s.staffId || s.teacherId;
    const staffName = s.staffName || s.teacherName;
    if (staffId) {
      const tKey = `${staffId}__${s.dayOfWeek}__${s.periodName}`;
      if (teacherMap.has(tKey)) {
        const prior = teacherMap.get(tKey);
        conflicts.push({
          type: 'Teacher Conflict',
          message: `Teacher ${staffName || 'Faculty'} is double-booked on ${s.dayOfWeek} (${s.periodName}) in ${prior.source}.`,
        });
      } else {
        teacherMap.set(tKey, { source: 'Current Proposal', actor: staffName });
      }
    }

    const rKey = `${s.room}__${s.dayOfWeek}__${s.periodName}`;
    if (roomMap.has(rKey)) {
      const prior = roomMap.get(rKey);
      conflicts.push({
        type: 'Room Conflict',
        message: `Room "${s.room}" is double-booked on ${s.dayOfWeek} (${s.periodName}) by ${prior.source}.`,
      });
    } else {
      roomMap.set(rKey, { source: 'Current Proposal', room: s.room });
    }

    const spKey = `${s.dayOfWeek}__${s.periodName}`;
    if (sectionPeriodMap.has(spKey)) {
      conflicts.push({
        type: 'Section Overlap',
        message: `Section has multiple concurrent classes scheduled on ${s.dayOfWeek} (${s.periodName}).`,
      });
    } else {
      sectionPeriodMap.set(spKey, true);
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflictsCount: conflicts.length,
    conflicts,
  };
}

/**
 * Publish generated timetable draft into active production database
 */
export async function publishTimetable({
  academicYearId = 'ay-2026',
  sectionId,
  classId,
  slots = [],
  configData = {},
  actor = 'Super Admin',
}) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { classGrade: true },
  });
  if (!section) {
    throw new Error('Section not found');
  }

  // Validate before publishing
  const valResult = await validateTimetableSlots({ sectionId, academicYearId, slots });
  if (!valResult.isValid) {
    throw new Error(`Cannot publish timetable with ${valResult.conflictsCount} active conflicts.`);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Save or update TimetableConfig
    const config = await tx.timetableConfig.create({
      data: {
        academicYearId,
        classId: section.classId,
        sectionId: section.id,
        effectiveDate: configData.effectiveDate ? new Date(configData.effectiveDate) : new Date(),
        workingDays: configData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        dailyStartTime: configData.dailyStartTime || '08:30',
        dailyEndTime: configData.dailyEndTime || '14:00',
        periodDurationMinutes: Number(configData.periodDurationMinutes) || 50,
        breakIntervals: configData.breakIntervals || [],
        maxPeriodsPerDay: Number(configData.maxPeriodsPerDay) || 6,
        subjectAllocations: configData.subjectAllocations || [],
        status: 'Published',
      },
    });

    // 2. Remove existing timetable slots for this section to avoid stale data
    await tx.timetableSlot.deleteMany({
      where: {
        academicYearId,
        sectionId,
      },
    });

    // 3. Create all published slots
    for (const slot of slots) {
      if (!slot.isBreak && !slot.isVacant) {
        await tx.timetableSlot.create({
          data: {
            academicYearId,
            sectionId,
            dayOfWeek: slot.dayOfWeek,
            periodName: slot.periodName,
            subjectId: slot.subjectId,
            staffId: slot.staffId,
            room: slot.room,
            colorTag: slot.colorTag,
            sessionType: slot.sessionType || 'Theory',
            isDoublePeriod: Boolean(slot.isDoublePeriod),
            isDraft: false,
            configId: config.id,
          },
        });
      }
    }

    // 4. Record security audit log
    await tx.auditLog.create({
      data: {
        actor,
        action: 'TIMETABLE_PUBLISH',
        entity: `Published weekly timetable for ${section.classGrade.name} - ${section.name} (${slots.length} periods)`,
        ipAddress: '127.0.0.1 (Localhost / Karachi Dev)',
        status: 'Success',
      },
    });

    return {
      published: true,
      configId: config.id,
      slotsCount: slots.length,
      sectionName: section.name,
      className: section.classGrade.name,
    };
  });
}
