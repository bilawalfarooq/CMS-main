import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EduCore database...');

  // Default hashed password: Admin#2026!
  const passwordHash = await bcrypt.hash('Admin#2026!', 10);

  // 1. Academic Years
  console.log('1. Seeding Academic Years...');
  const academicYearsData = [
    { id: 'ay-2026', name: '2026 - 2027', status: 'Active', isCurrent: true, startDate: new Date('2026-08-15'), endDate: new Date('2027-06-20') },
    { id: 'ay-2025', name: '2025 - 2026', status: 'Archived', isCurrent: false, startDate: new Date('2025-08-15'), endDate: new Date('2026-06-20') },
    { id: 'ay-2024', name: '2024 - 2025', status: 'Archived', isCurrent: false, startDate: new Date('2024-08-15'), endDate: new Date('2025-06-20') },
  ];

  for (const ay of academicYearsData) {
    await prisma.academicYear.upsert({
      where: { id: ay.id },
      update: ay,
      create: ay,
    });
  }

  // 2. Classes & Sections
  console.log('2. Seeding Classes and Sections...');
  const classesData = [
    {
      id: 'c-10',
      name: 'Grade 10',
      level: 'Secondary',
      headTeacher: 'Dr. Evelyn Reed',
      sections: ['10-A (Science)', '10-B (Commerce)', '10-C (General)'],
    },
    {
      id: 'c-11',
      name: 'Grade 11',
      level: 'Higher Secondary',
      headTeacher: 'Prof. Marcus Vance',
      sections: ['11-PreMed', '11-PreEng', '11-ComputerScience'],
    },
    {
      id: 'c-12',
      name: 'Grade 12',
      level: 'Higher Secondary',
      headTeacher: 'Sarah Jenkins',
      sections: ['12-PreMed', '12-PreEng', '12-Arts'],
    },
    {
      id: 'c-9',
      name: 'Grade 9',
      level: 'Secondary',
      headTeacher: 'Ahmed Tariq',
      sections: ['9-A', '9-B'],
    },
  ];

  const sectionMap = {};

  for (const c of classesData) {
    await prisma.classGrade.upsert({
      where: { id: c.id },
      update: { name: c.name, level: c.level, headTeacher: c.headTeacher },
      create: { id: c.id, name: c.name, level: c.level, headTeacher: c.headTeacher },
    });

    for (const secName of c.sections) {
      const sec = await prisma.section.upsert({
        where: { classId_name: { classId: c.id, name: secName } },
        update: { name: secName },
        create: { name: secName, classId: c.id },
      });
      sectionMap[`${c.name}__${secName}`] = sec.id;
      sectionMap[secName] = sec.id;
    }
  }

  // 3. Subjects
  console.log('3. Seeding Subjects...');
  const subjectsData = [
    { name: 'Physics & Applied Mechanics', code: 'PHY-101', department: 'Physics & Applied Sciences' },
    { name: 'Pure Mathematics', code: 'MTH-101', department: 'Pure Mathematics' },
    { name: 'Computer Applications', code: 'CS-101', department: 'Computer Science & Robotics' },
    { name: 'English Literature', code: 'ENG-101', department: 'Languages & Literature' },
    { name: 'Chemistry Practical', code: 'CHM-101', department: 'Physics & Applied Sciences' },
    { name: 'Biology Principles', code: 'BIO-101', department: 'Physics & Applied Sciences' },
    { name: 'World History', code: 'HIS-101', department: 'Social Sciences & Humanities' },
    { name: 'Physical Education', code: 'PED-101', department: 'Athletics & Physical Fitness' },
    { name: 'Robotics Workshop', code: 'ROB-101', department: 'Computer Science & Robotics' },
    { name: 'Languages & Speech', code: 'LNG-101', department: 'Languages & Literature' },
  ];

  const subjectMap = {};
  for (const sub of subjectsData) {
    const created = await prisma.subject.upsert({
      where: { code: sub.code },
      update: sub,
      create: sub,
    });
    subjectMap[sub.name] = created.id;
  }

  // 4. System Users
  console.log('4. Seeding System Users...');
  const usersData = [
    { id: 'usr-101', name: 'Alexander Vance', email: 'admin@educore.edu', role: 'SUPER_ADMIN', userType: 'Administrator', status: 'Active', twoFactor: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-102', name: 'Dr. Evelyn Reed', email: 'e.reed@educore.edu', role: 'TEACHER', userType: 'Faculty / Staff', status: 'Active', twoFactor: true, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-103', name: 'Prof. Marcus Vance', email: 'm.vance@educore.edu', role: 'TEACHER', userType: 'Faculty / Staff', status: 'Active', twoFactor: false, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-104', name: 'Registrar Admissions Staff', email: 'registrar@educore.edu', role: 'ADMIN_STAFF', userType: 'Administrative Staff', status: 'Active', twoFactor: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-105', name: 'Aisha Al-Mansoor', email: 'aisha.m@student.educore.edu', role: 'STUDENT', userType: 'Enrolled Student', status: 'Active', twoFactor: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-106', name: 'Tariq Al-Mansoor', email: 'tariq.mansoor@gmail.com', role: 'GUARDIAN', userType: 'Parent / Guardian', status: 'Active', twoFactor: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-107', name: 'Liam Alexander Vance', email: 'liam.v@student.educore.edu', role: 'STUDENT', userType: 'Enrolled Student', status: 'Active', twoFactor: false, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-108', name: 'David Chen', email: 'david.chen@enterprise.org', role: 'GUARDIAN', userType: 'Parent / Guardian', status: 'Disabled', twoFactor: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
    { id: 'usr-109', name: 'Chloe Isabella Chen', email: 'chloe.c@student.educore.edu', role: 'STUDENT', userType: 'Enrolled Student', status: 'Active', twoFactor: false, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120' },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        userType: u.userType,
        status: u.status,
        twoFactor: u.twoFactor,
        avatar: u.avatar,
        passwordHash,
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        userType: u.userType,
        status: u.status,
        twoFactor: u.twoFactor,
        avatar: u.avatar,
        passwordHash,
      },
    });
  }

  // 5. Guardians
  console.log('5. Seeding Guardians...');
  const guardiansData = [
    {
      id: 'g-101',
      name: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@gmail.com',
      phone: '+1 (555) 234-9081',
      secondaryName: 'Farah Al-Mansoor',
      secondaryPhone: '+1 (555) 234-9085',
      secondaryRelation: 'Mother',
      emergencyContact: '+1 (555) 234-9082',
    },
    {
      id: 'g-102',
      name: 'Helena Vance',
      email: 'helena.vance@techcorp.io',
      phone: '+1 (555) 871-3342',
      secondaryName: 'Marcus Vance',
      secondaryPhone: '+1 (555) 871-3348',
      secondaryRelation: 'Father',
      emergencyContact: '+1 (555) 871-3343',
    },
    {
      id: 'g-103',
      name: 'David Chen',
      email: 'david.chen@enterprise.org',
      phone: '+1 (555) 441-9921',
      secondaryName: 'Grace Chen',
      secondaryPhone: '+1 (555) 441-9928',
      secondaryRelation: 'Mother',
      emergencyContact: '+1 (555) 441-9922',
    },
    {
      id: 'g-104',
      name: 'Maria Morales',
      email: 'm.morales@family.net',
      phone: '+1 (555) 609-1284',
      secondaryName: 'Carlos Morales',
      secondaryPhone: '+1 (555) 609-1289',
      secondaryRelation: 'Father',
      emergencyContact: '+1 (555) 609-1285',
    },
    {
      id: 'g-105',
      name: 'Dr. Faisal Rahman',
      email: 'faisal.r@hospital.care',
      phone: '+1 (555) 312-7788',
      secondaryName: 'Dr. Samina Rahman',
      secondaryPhone: '+1 (555) 312-7790',
      secondaryRelation: 'Mother',
      emergencyContact: '+1 (555) 312-7789',
    },
    {
      id: 'g-106',
      name: 'Klaus Becker',
      email: 'klaus.becker@becker.de',
      phone: '+1 (555) 902-1144',
      secondaryName: 'Ingrid Becker',
      secondaryPhone: '+1 (555) 902-1149',
      secondaryRelation: 'Mother',
      emergencyContact: '+1 (555) 902-1145',
    },
  ];

  for (const g of guardiansData) {
    await prisma.guardian.upsert({
      where: { id: g.id },
      update: g,
      create: g,
    });
  }

  // 6. Students
  console.log('6. Seeding Students...');
  const studentsData = [
    {
      id: 'STU-2026-0101',
      name: 'Aisha Al-Mansoor',
      email: 'aisha.m@student.educore.edu',
      gradeName: 'Grade 10',
      sectionName: '10-A (Science)',
      classId: 'c-10',
      rollNo: '10A-01',
      admissionDate: new Date('2024-08-15'),
      academicYearId: 'ay-2026',
      dob: new Date('2010-04-12'),
      gender: 'Female',
      bloodGroup: 'A+',
      previousSchool: 'Westbrook Junior Academy',
      address: '742 Evergreen Terrace, Sector 4',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      status: 'ACTIVE',
      attendanceRate: 98.4,
      gpa: '3.92',
      guardianId: 'g-101',
      academicHistory: [
        { academicYearId: 'ay-2025', gradeName: 'Grade 9', sectionName: '9-A', rollNo: '9A-02', gpa: '3.90', attendanceRate: 98.9, status: 'Promoted' },
      ],
    },
    {
      id: 'STU-2026-0102',
      name: 'Liam Alexander Vance',
      email: 'liam.v@student.educore.edu',
      gradeName: 'Grade 11',
      sectionName: '11-ComputerScience',
      classId: 'c-11',
      rollNo: '11CS-01',
      admissionDate: new Date('2023-08-18'),
      academicYearId: 'ay-2026',
      dob: new Date('2009-09-21'),
      gender: 'Male',
      bloodGroup: 'O+',
      previousSchool: 'Apex STEM Preparatory',
      address: '108 Beacon Hill Way, Suite 12',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      status: 'ACTIVE',
      attendanceRate: 94.2,
      gpa: '3.85',
      guardianId: 'g-102',
      academicHistory: [
        { academicYearId: 'ay-2025', gradeName: 'Grade 10', sectionName: '10-A (Science)', rollNo: '10A-03', gpa: '3.82', attendanceRate: 95.0, status: 'Promoted' },
      ],
    },
    {
      id: 'STU-2026-0103',
      name: 'Chloe Isabella Chen',
      email: 'chloe.c@student.educore.edu',
      gradeName: 'Grade 10',
      sectionName: '10-A (Science)',
      classId: 'c-10',
      rollNo: '10A-02',
      admissionDate: new Date('2024-08-15'),
      academicYearId: 'ay-2026',
      dob: new Date('2010-11-03'),
      gender: 'Female',
      bloodGroup: 'B+',
      previousSchool: 'Lincoln Middle Magnet',
      address: '42 Orchard Lane, West End',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
      status: 'ACTIVE',
      attendanceRate: 78.5,
      gpa: '3.40',
      anomalyAlert: '3 consecutive unexplained absences this week',
      guardianId: 'g-103',
      academicHistory: [],
    },
    {
      id: 'STU-2026-0104',
      name: 'Zackary Ethan Morales',
      email: 'zack.m@student.educore.edu',
      gradeName: 'Grade 12',
      sectionName: '12-PreEng',
      classId: 'c-12',
      rollNo: '12PE-01',
      admissionDate: new Date('2022-08-14'),
      academicYearId: 'ay-2026',
      dob: new Date('2008-01-19'),
      gender: 'Male',
      bloodGroup: 'AB+',
      previousSchool: 'Horizon High School',
      address: '88 Meadowbrook Road',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      status: 'ACTIVE',
      attendanceRate: 96.0,
      gpa: '3.98',
      guardianId: 'g-104',
      academicHistory: [
        { academicYearId: 'ay-2025', gradeName: 'Grade 11', sectionName: '11-PreEng', rollNo: '11PE-01', gpa: '3.96', attendanceRate: 96.5, status: 'Promoted' },
      ],
    },
    {
      id: 'STU-2026-0105',
      name: 'Sofia Noor Rahman',
      email: 'sofia.r@student.educore.edu',
      gradeName: 'Grade 11',
      sectionName: '11-PreMed',
      classId: 'c-11',
      rollNo: '11PM-01',
      admissionDate: new Date('2023-08-18'),
      academicYearId: 'ay-2026',
      dob: new Date('2009-06-30'),
      gender: 'Female',
      bloodGroup: 'O-',
      previousSchool: 'Cedar Valley Collegiate',
      address: '15 Crescent Boulevard, Apt 4B',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      status: 'ON_LEAVE',
      attendanceRate: 88.0,
      gpa: '3.75',
      guardianId: 'g-105',
      academicHistory: [],
    },
    {
      id: 'STU-2026-0106',
      name: 'Lucas Gabriel Becker',
      email: 'lucas.b@student.educore.edu',
      gradeName: 'Grade 9',
      sectionName: '9-A',
      classId: 'c-9',
      rollNo: '9A-01',
      admissionDate: new Date('2025-08-20'),
      academicYearId: 'ay-2026',
      dob: new Date('2011-08-14'),
      gender: 'Male',
      bloodGroup: 'A-',
      previousSchool: 'Berlin International Prep',
      address: '210 Riverbend Trail',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      status: 'ACTIVE',
      attendanceRate: 99.1,
      gpa: '4.00',
      guardianId: 'g-106',
      academicHistory: [],
    },
  ];

  for (const s of studentsData) {
    const secId = sectionMap[s.sectionName];
    await prisma.student.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        email: s.email,
        classId: s.classId,
        sectionId: secId,
        rollNo: s.rollNo,
        admissionDate: s.admissionDate,
        academicYearId: s.academicYearId,
        dob: s.dob,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        previousSchool: s.previousSchool,
        address: s.address,
        avatar: s.avatar,
        status: s.status,
        attendanceRate: s.attendanceRate,
        gpa: s.gpa,
        anomalyAlert: s.anomalyAlert || null,
        guardianId: s.guardianId,
      },
      create: {
        id: s.id,
        name: s.name,
        email: s.email,
        classId: s.classId,
        sectionId: secId,
        rollNo: s.rollNo,
        admissionDate: s.admissionDate,
        academicYearId: s.academicYearId,
        dob: s.dob,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        previousSchool: s.previousSchool,
        address: s.address,
        avatar: s.avatar,
        status: s.status,
        attendanceRate: s.attendanceRate,
        gpa: s.gpa,
        anomalyAlert: s.anomalyAlert || null,
        guardianId: s.guardianId,
      },
    });

    // Seed enrollment history
    if (s.academicHistory && s.academicHistory.length > 0) {
      for (const h of s.academicHistory) {
        await prisma.studentEnrollmentHistory.create({
          data: {
            studentId: s.id,
            academicYearId: h.academicYearId,
            gradeName: h.gradeName,
            sectionName: h.sectionName,
            rollNo: h.rollNo,
            gpa: h.gpa,
            attendanceRate: h.attendanceRate,
            status: h.status,
          },
        });
      }
    }
  }

  // 7. Staff
  console.log('7. Seeding Staff...');
  const staffData = [
    {
      id: 'STF-019',
      name: 'Dr. Evelyn Reed',
      email: 'e.reed@educore.edu',
      department: 'Physics & Applied Sciences',
      role: 'Department Head / Senior Lecturer',
      contract: 'Full-Time Tenured',
      teachingHours: 18,
      maxHours: 22,
      assignedClasses: ['Grade 10-A', 'Grade 12-PreEng'],
      phone: '+1 (555) 782-9912',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'STF-024',
      name: 'Prof. Marcus Vance',
      email: 'm.vance@educore.edu',
      department: 'Computer Science & Robotics',
      role: 'Faculty Coordinator',
      contract: 'Full-Time',
      teachingHours: 20,
      maxHours: 24,
      assignedClasses: ['Grade 11-ComputerScience', 'Grade 12-PreEng'],
      phone: '+1 (555) 782-9913',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'STF-031',
      name: 'Sarah Jenkins, M.Sc.',
      email: 's.jenkins@educore.edu',
      department: 'Pure Mathematics',
      role: 'Lead Teacher',
      contract: 'Full-Time',
      teachingHours: 22,
      maxHours: 24,
      assignedClasses: ['Grade 10-A', 'Grade 10-B', 'Grade 11-PreMed'],
      phone: '+1 (555) 782-9914',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'STF-042',
      name: 'Ahmed Tariq',
      email: 'a.tariq@educore.edu',
      department: 'Languages & Literature',
      role: 'Instructor',
      contract: 'Full-Time',
      teachingHours: 16,
      maxHours: 20,
      assignedClasses: ['Grade 9-A', 'Grade 9-B', 'Grade 10-C'],
      phone: '+1 (555) 782-9915',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    },
  ];

  for (const stf of staffData) {
    await prisma.staff.upsert({
      where: { id: stf.id },
      update: stf,
      create: stf,
    });
  }

  // 8. Attendance Records
  console.log('8. Seeding Attendance...');
  const attendanceData = [
    { studentId: 'STU-2026-0101', sectionName: '10-A (Science)', status: 'PRESENT', rollNo: '10A-01', remarks: 'On time' },
    { studentId: 'STU-2026-0103', sectionName: '10-A (Science)', status: 'ABSENT', rollNo: '10A-02', remarks: 'Unexplained absence (Alert Queued)' },
    { studentId: 'STU-2026-0102', sectionName: '11-ComputerScience', status: 'PRESENT', rollNo: '11CS-01', remarks: 'On time' },
    { studentId: 'STU-2026-0104', sectionName: '12-PreEng', status: 'LATE', rollNo: '12PE-01', remarks: 'Arrived 15m late - transport delay' },
    { studentId: 'STU-2026-0105', sectionName: '11-PreMed', status: 'EXCUSED', rollNo: '11PM-01', remarks: 'Medical leave certificate verified' },
  ];

  for (const a of attendanceData) {
    const secId = sectionMap[a.sectionName];
    await prisma.attendanceRecord.upsert({
      where: {
        studentId_date_periodName: {
          studentId: a.studentId,
          date: new Date('2026-10-24'),
          periodName: 'Daily Morning Roster',
        },
      },
      update: { status: a.status, remarks: a.remarks },
      create: {
        studentId: a.studentId,
        academicYearId: 'ay-2026',
        sectionId: secId,
        date: new Date('2026-10-24'),
        periodName: 'Daily Morning Roster',
        status: a.status,
        remarks: a.remarks,
        rollNo: a.rollNo,
      },
    });
  }

  // 9. Grades
  console.log('9. Seeding Grade Records...');
  const gradesData = [
    { studentId: 'STU-2026-0101', sectionName: '10-A (Science)', quiz1: 94, midterm: 92, project: 98, finalExam: 95, weightedScore: 94.6, letterGrade: 'A+', status: 'Verified' },
    { studentId: 'STU-2026-0102', sectionName: '11-ComputerScience', quiz1: 88, midterm: 85, project: 95, finalExam: 89, weightedScore: 88.4, letterGrade: 'A', status: 'Verified' },
    { studentId: 'STU-2026-0103', sectionName: '10-A (Science)', quiz1: 72, midterm: 70, project: 82, finalExam: 74, weightedScore: 73.8, letterGrade: 'B', status: 'Pending Review' },
    { studentId: 'STU-2026-0104', sectionName: '12-PreEng', quiz1: 98, midterm: 96, project: 100, finalExam: 97, weightedScore: 97.4, letterGrade: 'A+', status: 'Verified' },
    { studentId: 'STU-2026-0106', sectionName: '9-A', quiz1: 100, midterm: 98, project: 99, finalExam: 99, weightedScore: 98.9, letterGrade: 'A+', status: 'Verified' },
  ];

  for (const g of gradesData) {
    const secId = sectionMap[g.sectionName];
    await prisma.gradeRecord.upsert({
      where: {
        studentId_academicYearId_subjectId: {
          studentId: g.studentId,
          academicYearId: 'ay-2026',
          subjectId: subjectMap['Physics & Applied Mechanics'] || null,
        },
      },
      update: {
        quiz1: g.quiz1,
        midterm: g.midterm,
        project: g.project,
        finalExam: g.finalExam,
        weightedScore: g.weightedScore,
        letterGrade: g.letterGrade,
        status: g.status,
      },
      create: {
        studentId: g.studentId,
        academicYearId: 'ay-2026',
        sectionId: secId,
        subjectId: subjectMap['Physics & Applied Mechanics'] || null,
        quiz1: g.quiz1,
        midterm: g.midterm,
        project: g.project,
        finalExam: g.finalExam,
        weightedScore: g.weightedScore,
        letterGrade: g.letterGrade,
        status: g.status,
      },
    });
  }

  // 10. Invoices
  console.log('10. Seeding Invoices...');
  const invoicesData = [
    { id: 'INV-2026-081', studentId: 'STU-2026-0101', term: 'Fall Term 2026', amount: 1850, dueDate: new Date('2026-09-01'), status: 'PAID', paymentDate: new Date('2026-08-28'), receipt: 'REC-9941-A' },
    { id: 'INV-2026-082', studentId: 'STU-2026-0101', term: 'Spring Term 2027', amount: 1850, dueDate: new Date('2027-01-15'), status: 'UPCOMING', paymentDate: null, receipt: null },
    { id: 'INV-2026-LAB', studentId: 'STU-2026-0102', term: 'Science Lab & STEM Fee', amount: 220, dueDate: new Date('2026-09-10'), status: 'PAID', paymentDate: new Date('2026-09-05'), receipt: 'REC-9972-B' },
    { id: 'INV-2026-083', studentId: 'STU-2026-0103', term: 'Fall Term 2026', amount: 1850, dueDate: new Date('2026-09-01'), status: 'OVERDUE', paymentDate: null, receipt: null },
  ];

  for (const inv of invoicesData) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: inv,
      create: {
        ...inv,
        academicYearId: 'ay-2026',
      },
    });
  }

  // 11. Documents
  console.log('11. Seeding Documents...');
  const documentsData = [
    { id: 'doc-01', studentId: 'STU-2026-0101', title: 'National Identity Verification.pdf', category: 'IDENTITY', size: '1.4 MB', mimeType: 'application/pdf', storagePath: 'vault/stu-0101/id-card.pdf', status: 'Verified' },
    { id: 'doc-02', studentId: 'STU-2026-0101', title: 'Birth Certificate Certified.pdf', category: 'LEGAL', size: '890 KB', mimeType: 'application/pdf', storagePath: 'vault/stu-0101/birth-cert.pdf', status: 'Verified' },
    { id: 'doc-03', studentId: 'STU-2026-0102', title: 'Medical Immunization Record.pdf', category: 'HEALTH', size: '1.8 MB', mimeType: 'application/pdf', storagePath: 'vault/stu-0102/medical-vax.pdf', status: 'Verified' },
    { id: 'doc-04', studentId: 'STU-2026-0103', title: 'Prior Academic Transcript.pdf', category: 'ACADEMIC', size: '1.2 MB', mimeType: 'application/pdf', storagePath: 'vault/stu-0103/prev-transcript.pdf', status: 'Pending Review' },
    { id: 'doc-05', studentId: 'STU-2026-0105', title: 'Doctor Medical Leave Letter.pdf', category: 'HEALTH', size: '640 KB', mimeType: 'application/pdf', storagePath: 'vault/stu-0105/doctor-note.pdf', status: 'Verified' },
  ];

  for (const doc of documentsData) {
    await prisma.studentDocument.upsert({
      where: { id: doc.id },
      update: doc,
      create: doc,
    });
  }

  // 12. Exam Schedules
  console.log('12. Seeding Exam Schedules...');
  const examsData = [
    { id: 'ex-101', title: 'Fall Midterm Assessment: Physics', classId: 'c-10', date: new Date('2026-11-04'), timeSlot: '09:00 AM - 11:30 AM', hall: 'Auditorium Hall A', capacity: 120, enrolled: 88, invigilator: 'Prof. Marcus Vance', status: 'Scheduled' },
    { id: 'ex-102', title: 'Computer Science Practical Exam', classId: 'c-11', date: new Date('2026-11-05'), timeSlot: '10:00 AM - 12:00 PM', hall: 'IT Suites 1 & 2', capacity: 60, enrolled: 54, invigilator: 'Dr. Evelyn Reed', status: 'Scheduled' },
    { id: 'ex-103', title: 'Pure Mathematics Comprehensive', classId: 'c-10', date: new Date('2026-11-06'), timeSlot: '08:30 AM - 11:00 AM', hall: 'Grand Hall B', capacity: 100, enrolled: 88, invigilator: 'Ahmed Tariq', status: 'Scheduled' },
    { id: 'ex-104', title: 'Advanced Calculus Term Final', classId: 'c-12', date: new Date('2026-11-08'), timeSlot: '01:00 PM - 03:30 PM', hall: 'Auditorium Hall A', capacity: 120, enrolled: 96, invigilator: 'Sarah Jenkins', status: 'Drafting' },
  ];

  for (const ex of examsData) {
    await prisma.examSchedule.upsert({
      where: { id: ex.id },
      update: ex,
      create: ex,
    });
  }

  // 13. Audit Logs
  console.log('13. Seeding Audit Logs...');
  const auditLogsData = [
    { id: 'aud-901', timestamp: new Date('2026-10-24 13:42:10'), actor: 'Dr. Evelyn Reed (Teacher)', action: 'GRADE_BATCH_UPDATE', entity: 'Grade 10-A Physics Final Marks', ipAddress: '192.168.1.45', status: 'Success' },
    { id: 'aud-902', timestamp: new Date('2026-10-24 13:30:02'), actor: 'Admin Registrar (Staff)', action: 'STUDENT_ADMISSION', entity: 'Elena Rostova (STU-2026-0107)', ipAddress: '192.168.1.12', status: 'Success' },
    { id: 'aud-903', timestamp: new Date('2026-10-24 12:15:44'), actor: 'System Daemon (BullMQ)', action: 'REDIS_DISPATCH_SMS', entity: 'Guardian Alert: Chloe Chen', ipAddress: '127.0.0.1', status: 'Delivered' },
    { id: 'aud-904', timestamp: new Date('2026-10-24 11:00:29'), actor: 'Dean Vance (Principal)', action: 'TIMETABLE_ROOM_REALLOC', entity: 'IT Suite A -> Period 3 (CS11)', ipAddress: '192.168.1.10', status: 'Success' },
    { id: 'aud-905', timestamp: new Date('2026-10-24 09:12:00'), actor: 'Super Admin', action: 'DATABASE_BACKUP_EXEC', entity: 's3://educore-backups/pg-snap-24', ipAddress: '10.0.0.1', status: 'Completed' },
  ];

  for (const aud of auditLogsData) {
    await prisma.auditLog.upsert({
      where: { id: aud.id },
      update: aud,
      create: aud,
    });
  }

  console.log('✅ EduCore database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
