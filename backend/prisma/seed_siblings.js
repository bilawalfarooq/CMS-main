import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Seeding Tariq Siddiqui and multiple siblings...');

  // 1. Ensure Guardian record for Tariq Siddiqui
  const guardian = await prisma.guardian.upsert({
    where: { id: 'g-ams-106' },
    update: {
      userId: 'usr-ams-106',
      name: 'Tariq Siddiqui',
      email: 'tariq.siddiqui@gmail.com',
      phone: '+92 333 2189041',
      secondaryName: 'Sadia Siddiqui',
      secondaryPhone: '+92 333 2189042',
      secondaryRelation: 'Mother',
      emergencyContact: '+92 333 2189040',
    },
    create: {
      id: 'g-ams-106',
      userId: 'usr-ams-106',
      name: 'Tariq Siddiqui',
      email: 'tariq.siddiqui@gmail.com',
      phone: '+92 333 2189041',
      secondaryName: 'Sadia Siddiqui',
      secondaryPhone: '+92 333 2189042',
      secondaryRelation: 'Mother',
      emergencyContact: '+92 333 2189040',
    },
  });

  // Get subjects
  const mathSub = await prisma.subject.findFirst({ where: { code: 'MTH-101' } });
  const phySub = await prisma.subject.findFirst({ where: { code: 'PHY-101' } });
  const csSub = await prisma.subject.findFirst({ where: { code: 'CS-101' } });
  const engSub = await prisma.subject.findFirst({ where: { code: 'ENG-101' } });
  const robSub = await prisma.subject.findFirst({ where: { code: 'ROB-101' } });
  const bioSub = await prisma.subject.findFirst({ where: { code: 'BIO-101' } });
  const chmSub = await prisma.subject.findFirst({ where: { code: 'CHM-101' } });
  const hisSub = await prisma.subject.findFirst({ where: { code: 'HIS-101' } });

  // Get sections
  const sec10A = await prisma.section.findFirst({ where: { name: '10-A (Science)' } });
  const sec11CS = await prisma.section.findFirst({ where: { name: '11-ComputerScience' } });
  const sec9A = await prisma.section.findFirst({ where: { name: '9-A' } });

  // Sibling 1: Aisha Siddiqui (Grade 10)
  const aisha = await prisma.student.upsert({
    where: { id: 'STU-2026-0101' },
    update: {
      name: 'Aisha Siddiqui',
      email: 'aisha.s@student.amstech.edu.pk',
      rollNo: '10A-01',
      classId: sec10A.classId,
      sectionId: sec10A.id,
      guardianId: guardian.id,
      attendanceRate: 98.4,
      gpa: '3.92',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
    create: {
      id: 'STU-2026-0101',
      name: 'Aisha Siddiqui',
      email: 'aisha.s@student.amstech.edu.pk',
      rollNo: '10A-01',
      classId: sec10A.classId,
      sectionId: sec10A.id,
      academicYearId: 'ay-2026',
      admissionDate: new Date('2024-08-15'),
      dob: new Date('2010-04-12'),
      gender: 'Female',
      guardianId: guardian.id,
      attendanceRate: 98.4,
      gpa: '3.92',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
  });

  // Sibling 2: Hamza Siddiqui (Grade 11 - Brother)
  const hamza = await prisma.student.upsert({
    where: { id: 'STU-2026-0104' },
    update: {
      name: 'Hamza Siddiqui',
      email: 'hamza.s@student.amstech.edu.pk',
      rollNo: '11CS-02',
      classId: sec11CS.classId,
      sectionId: sec11CS.id,
      guardianId: guardian.id,
      attendanceRate: 94.6,
      gpa: '3.85',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    },
    create: {
      id: 'STU-2026-0104',
      name: 'Hamza Siddiqui',
      email: 'hamza.s@student.amstech.edu.pk',
      rollNo: '11CS-02',
      classId: sec11CS.classId,
      sectionId: sec11CS.id,
      academicYearId: 'ay-2026',
      admissionDate: new Date('2023-08-18'),
      dob: new Date('2009-02-14'),
      gender: 'Male',
      guardianId: guardian.id,
      attendanceRate: 94.6,
      gpa: '3.85',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    },
  });

  // Sibling 3: Bilal Siddiqui (Grade 9 - Younger Brother)
  const bilal = await prisma.student.upsert({
    where: { id: 'STU-2026-0106' },
    update: {
      name: 'Bilal Siddiqui',
      email: 'bilal.s@student.amstech.edu.pk',
      rollNo: '9A-03',
      classId: sec9A.classId,
      sectionId: sec9A.id,
      guardianId: guardian.id,
      attendanceRate: 97.8,
      gpa: '3.95',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    },
    create: {
      id: 'STU-2026-0106',
      name: 'Bilal Siddiqui',
      email: 'bilal.s@student.amstech.edu.pk',
      rollNo: '9A-03',
      classId: sec9A.classId,
      sectionId: sec9A.id,
      academicYearId: 'ay-2026',
      admissionDate: new Date('2025-08-20'),
      dob: new Date('2011-06-19'),
      gender: 'Male',
      guardianId: guardian.id,
      attendanceRate: 97.8,
      gpa: '3.95',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    },
  });

  // Seed Invoices for Hamza
  await prisma.invoice.upsert({
    where: { id: 'INV-2026-104-A' },
    update: { studentId: hamza.id, status: 'PAID', amount: 26000, term: 'Fall Term 2026', dueDate: new Date('2026-09-01'), receipt: 'REC-HAMZA-01' },
    create: { id: 'INV-2026-104-A', studentId: hamza.id, academicYearId: 'ay-2026', term: 'Fall Term 2026', amount: 26000, dueDate: new Date('2026-09-01'), status: 'PAID', paymentDate: new Date('2026-08-27'), receipt: 'REC-HAMZA-01' },
  });
  await prisma.invoice.upsert({
    where: { id: 'INV-2026-104-B' },
    update: { studentId: hamza.id, status: 'OVERDUE', amount: 14000, term: 'Spring Term 2027', dueDate: new Date('2027-01-10') },
    create: { id: 'INV-2026-104-B', studentId: hamza.id, academicYearId: 'ay-2026', term: 'Spring Term 2027', amount: 14000, dueDate: new Date('2027-01-10'), status: 'OVERDUE' },
  });

  // Seed Invoices for Bilal
  await prisma.invoice.upsert({
    where: { id: 'INV-2026-106-A' },
    update: { studentId: bilal.id, status: 'PAID', amount: 20000, term: 'Annual Tuition 2026-27', dueDate: new Date('2026-08-15'), receipt: 'REC-BILAL-01' },
    create: { id: 'INV-2026-106-A', studentId: bilal.id, academicYearId: 'ay-2026', term: 'Annual Tuition 2026-27', amount: 20000, dueDate: new Date('2026-08-15'), status: 'PAID', paymentDate: new Date('2026-08-14'), receipt: 'REC-BILAL-01' },
  });

  // Seed Grade Records for Aisha
  const aishaGrades = [
    { subjectId: mathSub.id, quiz1: 95, midterm: 92, project: 96, finalExam: 94, weightedScore: 94.2, letterGrade: 'A+' },
    { subjectId: phySub.id, quiz1: 90, midterm: 91, project: 93, finalExam: 92, weightedScore: 91.5, letterGrade: 'A' },
    { subjectId: csSub.id, quiz1: 98, midterm: 97, project: 100, finalExam: 99, weightedScore: 98.6, letterGrade: 'A+' },
    { subjectId: engSub.id, quiz1: 88, midterm: 85, project: 92, finalExam: 90, weightedScore: 89.1, letterGrade: 'A' },
  ];
  for (const g of aishaGrades) {
    await prisma.gradeRecord.upsert({
      where: {
        studentId_academicYearId_subjectId: {
          studentId: aisha.id,
          academicYearId: 'ay-2026',
          subjectId: g.subjectId,
        },
      },
      update: { ...g, sectionId: sec10A.id, status: 'Verified' },
      create: { ...g, studentId: aisha.id, sectionId: sec10A.id, academicYearId: 'ay-2026', status: 'Verified' },
    });
  }

  // Seed Grade Records for Hamza
  const hamzaGrades = [
    { subjectId: csSub.id, quiz1: 96, midterm: 95, project: 98, finalExam: 96, weightedScore: 96.2, letterGrade: 'A+' },
    { subjectId: robSub.id, quiz1: 95, midterm: 94, project: 97, finalExam: 95, weightedScore: 95.3, letterGrade: 'A+' },
    { subjectId: mathSub.id, quiz1: 88, midterm: 89, project: 90, finalExam: 91, weightedScore: 89.8, letterGrade: 'A' },
    { subjectId: phySub.id, quiz1: 84, midterm: 86, project: 85, finalExam: 88, weightedScore: 86.1, letterGrade: 'B+' },
  ];
  for (const g of hamzaGrades) {
    await prisma.gradeRecord.upsert({
      where: {
        studentId_academicYearId_subjectId: {
          studentId: hamza.id,
          academicYearId: 'ay-2026',
          subjectId: g.subjectId,
        },
      },
      update: { ...g, sectionId: sec11CS.id, status: 'Verified' },
      create: { ...g, studentId: hamza.id, sectionId: sec11CS.id, academicYearId: 'ay-2026', status: 'Verified' },
    });
  }

  // Seed Grade Records for Bilal
  const bilalGrades = [
    { subjectId: chmSub.id, quiz1: 96, midterm: 98, project: 99, finalExam: 97, weightedScore: 97.4, letterGrade: 'A+' },
    { subjectId: bioSub.id, quiz1: 94, midterm: 95, project: 96, finalExam: 95, weightedScore: 95.1, letterGrade: 'A+' },
    { subjectId: mathSub.id, quiz1: 92, midterm: 93, project: 95, finalExam: 94, weightedScore: 93.6, letterGrade: 'A+' },
    { subjectId: hisSub.id, quiz1: 91, midterm: 90, project: 94, finalExam: 92, weightedScore: 91.8, letterGrade: 'A' },
  ];
  for (const g of bilalGrades) {
    await prisma.gradeRecord.upsert({
      where: {
        studentId_academicYearId_subjectId: {
          studentId: bilal.id,
          academicYearId: 'ay-2026',
          subjectId: g.subjectId,
        },
      },
      update: { ...g, sectionId: sec9A.id, status: 'Verified' },
      create: { ...g, studentId: bilal.id, sectionId: sec9A.id, academicYearId: 'ay-2026', status: 'Verified' },
    });
  }

  console.log('✅ Successfully seeded Tariq Siddiqui with 3 siblings (Aisha, Hamza, Bilal)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
