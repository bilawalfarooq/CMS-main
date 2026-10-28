import 'dotenv/config';
import prisma from '../src/config/prisma.js';

async function seedTimetables() {
  console.log('Seeding timetables for 11-ComputerScience and 9-A...');

  const sec11CS = await prisma.section.findFirst({ where: { name: '11-ComputerScience' } });
  const sec9A = await prisma.section.findFirst({ where: { name: '9-A' } });

  const csSub = await prisma.subject.findFirst({ where: { code: 'CS-101' } });
  const robSub = await prisma.subject.findFirst({ where: { code: 'ROB-101' } });
  const mathSub = await prisma.subject.findFirst({ where: { code: 'MTH-101' } });
  const phySub = await prisma.subject.findFirst({ where: { code: 'PHY-101' } });
  const engSub = await prisma.subject.findFirst({ where: { code: 'ENG-101' } });
  const chmSub = await prisma.subject.findFirst({ where: { code: 'CHM-101' } });
  const bioSub = await prisma.subject.findFirst({ where: { code: 'BIO-101' } });
  const hisSub = await prisma.subject.findFirst({ where: { code: 'HIS-101' } });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    'Period 1 (08:30 - 09:20)',
    'Period 2 (09:25 - 10:15)',
    'Period 3 (10:30 - 11:20)',
    'Period 4 (11:25 - 12:15)',
    'Period 5 (01:00 - 01:50)',
  ];

  // 11-ComputerScience Slots (Hamza)
  const csPlan = [
    { subject: csSub, staffId: 'STF-024', room: 'IT Lab Beta', colorTag: 'bg-blue-50 text-blue-700 border-blue-200' },
    { subject: robSub, staffId: 'STF-024', room: 'Mechatronics Suite', colorTag: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { subject: mathSub, staffId: 'STF-031', room: 'Lecture Hall C', colorTag: 'bg-purple-50 text-purple-700 border-purple-200' },
    { subject: phySub, staffId: 'STF-019', room: 'Advanced Physics Lab', colorTag: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { subject: engSub, staffId: 'STF-042', room: 'Room 312', colorTag: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    for (let p = 0; p < periods.length; p++) {
      const period = periods[p];
      const item = csPlan[(d + p) % csPlan.length];

      await prisma.timetableSlot.upsert({
        where: {
          sectionId_dayOfWeek_periodName: {
            sectionId: sec11CS.id,
            dayOfWeek: day,
            periodName: period,
          },
        },
        update: {
          subjectId: item.subject.id,
          staffId: item.staffId,
          room: `CS-${item.room}-${d}`,
          colorTag: item.colorTag,
        },
        create: {
          academicYearId: 'ay-2026',
          sectionId: sec11CS.id,
          dayOfWeek: day,
          periodName: period,
          subjectId: item.subject.id,
          staffId: item.staffId,
          room: `CS-${item.room}-${d}`,
          colorTag: item.colorTag,
        },
      });
    }
  }

  // 9-A Slots (Bilal)
  const bioPlan = [
    { subject: chmSub, staffId: 'STF-019', room: 'Chem Lab Annex', colorTag: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { subject: bioSub, staffId: 'STF-019', room: 'Bio Discovery Lab', colorTag: 'bg-teal-50 text-teal-700 border-teal-200' },
    { subject: mathSub, staffId: 'STF-031', room: 'Math Studio 1', colorTag: 'bg-purple-50 text-purple-700 border-purple-200' },
    { subject: hisSub, staffId: 'STF-042', room: 'Humanities Wing A', colorTag: 'bg-rose-50 text-rose-700 border-rose-200' },
    { subject: csSub, staffId: 'STF-024', room: 'Coding Lab 2', colorTag: 'bg-blue-50 text-blue-700 border-blue-200' },
  ];

  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    for (let p = 0; p < periods.length; p++) {
      const period = periods[p];
      const item = bioPlan[(d + p) % bioPlan.length];

      await prisma.timetableSlot.upsert({
        where: {
          sectionId_dayOfWeek_periodName: {
            sectionId: sec9A.id,
            dayOfWeek: day,
            periodName: period,
          },
        },
        update: {
          subjectId: item.subject.id,
          staffId: item.staffId,
          room: `9A-${item.room}-${d}`,
          colorTag: item.colorTag,
        },
        create: {
          academicYearId: 'ay-2026',
          sectionId: sec9A.id,
          dayOfWeek: day,
          periodName: period,
          subjectId: item.subject.id,
          staffId: item.staffId,
          room: `9A-${item.room}-${d}`,
          colorTag: item.colorTag,
        },
      });
    }
  }

  console.log('✅ Successfully seeded 25 slots each for 11-ComputerScience and 9-A!');
}

seedTimetables()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
