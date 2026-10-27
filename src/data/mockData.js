export const ACADEMIC_YEARS = [
  { id: 'ay-2026', name: '2026 - 2027', status: 'Active', startDate: '2026-08-15', endDate: '2027-06-20' },
  { id: 'ay-2025', name: '2025 - 2026', status: 'Archived', startDate: '2025-08-15', endDate: '2026-06-20' },
  { id: 'ay-2024', name: '2024 - 2025', status: 'Archived', startDate: '2024-08-15', endDate: '2025-06-20' },
];

export const ROLES = [
  { id: 'super_admin', label: 'Super Admin', description: 'Full system infrastructure & security control', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'principal', label: 'Principal / Dean', description: 'Executive academic overview & staffing reports', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'teacher', label: 'Senior Faculty', description: 'Section attendance, gradebook, and course delivery', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'admin_staff', label: 'Registrar Staff', description: 'Admissions, student records, and documentation', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'guardian', label: 'Guardian / Parent', description: 'Child attendance alerts, report cards, fee status', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
];

export const INITIAL_CLASSES = [
  { id: 'c-10', name: 'Grade 10', level: 'Secondary', sections: ['10-A (Science)', '10-B (Commerce)', '10-C (General)'], studentCount: 88, headTeacher: 'Dr. Evelyn Reed' },
  { id: 'c-11', name: 'Grade 11', level: 'Higher Secondary', sections: ['11-PreMed', '11-PreEng', '11-ComputerScience'], studentCount: 104, headTeacher: 'Prof. Marcus Vance' },
  { id: 'c-12', name: 'Grade 12', level: 'Higher Secondary', sections: ['12-PreMed', '12-PreEng', '12-Arts'], studentCount: 96, headTeacher: 'Sarah Jenkins' },
  { id: 'c-9', name: 'Grade 9', level: 'Secondary', sections: ['9-A', '9-B'], studentCount: 65, headTeacher: 'Ahmed Tariq' },
];

export const INITIAL_STUDENTS = [
  {
    id: 'STU-2026-0101',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@student.educore.edu',
    grade: 'Grade 10',
    section: '10-A (Science)',
    rollNo: '10A-01',
    admissionDate: '2024-08-15',
    academicYear: 'ay-2026',
    previousSchool: 'Westbrook Junior Academy',
    dob: '2010-04-12',
    gender: 'Female',
    guardianName: 'Tariq Al-Mansoor',
    guardianPhone: '+1 (555) 234-9081',
    guardianEmail: 'tariq.mansoor@gmail.com',
    secondaryGuardianName: 'Farah Al-Mansoor',
    secondaryGuardianPhone: '+1 (555) 234-9085',
    secondaryGuardianRelation: 'Mother',
    emergencyContact: '+1 (555) 234-9082',
    bloodGroup: 'A+',
    status: 'Active',
    attendanceRate: 98.4,
    gpa: '3.92',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    address: '742 Evergreen Terrace, Sector 4',
    academicHistory: [
      {
        academicYear: '2025 - 2026',
        grade: 'Grade 9',
        section: '9-A',
        rollNo: '9A-02',
        gpa: '3.90',
        attendanceRate: 98.9,
        status: 'Promoted',
        promotedAt: '2026-06-20'
      }
    ]
  },
  {
    id: 'STU-2026-0102',
    name: 'Liam Alexander Vance',
    email: 'liam.v@student.educore.edu',
    grade: 'Grade 11',
    section: '11-ComputerScience',
    rollNo: '11CS-01',
    admissionDate: '2023-08-18',
    academicYear: 'ay-2026',
    previousSchool: 'Apex STEM Preparatory',
    dob: '2009-09-21',
    gender: 'Male',
    guardianName: 'Helena Vance',
    guardianPhone: '+1 (555) 871-3342',
    guardianEmail: 'helena.vance@techcorp.io',
    secondaryGuardianName: 'Marcus Vance',
    secondaryGuardianPhone: '+1 (555) 871-3348',
    secondaryGuardianRelation: 'Father',
    emergencyContact: '+1 (555) 871-3343',
    bloodGroup: 'O+',
    status: 'Active',
    attendanceRate: 94.2,
    gpa: '3.85',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    address: '108 Beacon Hill Way, Suite 12',
    academicHistory: [
      {
        academicYear: '2025 - 2026',
        grade: 'Grade 10',
        section: '10-A (Science)',
        rollNo: '10A-03',
        gpa: '3.82',
        attendanceRate: 95.0,
        status: 'Promoted',
        promotedAt: '2026-06-20'
      }
    ]
  },
  {
    id: 'STU-2026-0103',
    name: 'Chloe Isabella Chen',
    email: 'chloe.c@student.educore.edu',
    grade: 'Grade 10',
    section: '10-A (Science)',
    rollNo: '10A-02',
    admissionDate: '2024-08-15',
    academicYear: 'ay-2026',
    previousSchool: 'Lincoln Middle Magnet',
    dob: '2010-11-03',
    gender: 'Female',
    guardianName: 'David Chen',
    guardianPhone: '+1 (555) 441-9921',
    guardianEmail: 'david.chen@enterprise.org',
    secondaryGuardianName: 'Grace Chen',
    secondaryGuardianPhone: '+1 (555) 441-9928',
    secondaryGuardianRelation: 'Mother',
    emergencyContact: '+1 (555) 441-9922',
    bloodGroup: 'B+',
    status: 'Active',
    attendanceRate: 78.5,
    gpa: '3.40',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    address: '42 Orchard Lane, West End',
    anomalyAlert: '3 consecutive unexplained absences this week',
    academicHistory: []
  },
  {
    id: 'STU-2026-0104',
    name: 'Zackary Ethan Morales',
    email: 'zack.m@student.educore.edu',
    grade: 'Grade 12',
    section: '12-PreEng',
    rollNo: '12PE-01',
    admissionDate: '2022-08-14',
    academicYear: 'ay-2026',
    previousSchool: 'Horizon High School',
    dob: '2008-01-19',
    gender: 'Male',
    guardianName: 'Maria Morales',
    guardianPhone: '+1 (555) 609-1284',
    guardianEmail: 'm.morales@family.net',
    secondaryGuardianName: 'Carlos Morales',
    secondaryGuardianPhone: '+1 (555) 609-1289',
    secondaryGuardianRelation: 'Father',
    emergencyContact: '+1 (555) 609-1285',
    bloodGroup: 'AB+',
    status: 'Active',
    attendanceRate: 96.0,
    gpa: '3.98',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    address: '88 Meadowbrook Road',
    academicHistory: [
      {
        academicYear: '2025 - 2026',
        grade: 'Grade 11',
        section: '11-PreEng',
        rollNo: '11PE-01',
        gpa: '3.96',
        attendanceRate: 96.5,
        status: 'Promoted',
        promotedAt: '2026-06-20'
      }
    ]
  },
  {
    id: 'STU-2026-0105',
    name: 'Sofia Noor Rahman',
    email: 'sofia.r@student.educore.edu',
    grade: 'Grade 11',
    section: '11-PreMed',
    rollNo: '11PM-01',
    admissionDate: '2023-08-18',
    academicYear: 'ay-2026',
    previousSchool: 'Cedar Valley Collegiate',
    dob: '2009-06-30',
    gender: 'Female',
    guardianName: 'Dr. Faisal Rahman',
    guardianPhone: '+1 (555) 312-7788',
    guardianEmail: 'faisal.r@hospital.care',
    secondaryGuardianName: 'Dr. Samina Rahman',
    secondaryGuardianPhone: '+1 (555) 312-7790',
    secondaryGuardianRelation: 'Mother',
    emergencyContact: '+1 (555) 312-7789',
    bloodGroup: 'O-',
    status: 'On-Leave',
    attendanceRate: 88.0,
    gpa: '3.75',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    address: '15 Crescent Boulevard, Apt 4B',
    academicHistory: []
  },
  {
    id: 'STU-2026-0106',
    name: 'Lucas Gabriel Becker',
    email: 'lucas.b@student.educore.edu',
    grade: 'Grade 9',
    section: '9-A',
    rollNo: '9A-01',
    admissionDate: '2025-08-20',
    academicYear: 'ay-2026',
    previousSchool: 'Berlin International Prep',
    dob: '2011-08-14',
    gender: 'Male',
    guardianName: 'Klaus Becker',
    guardianPhone: '+1 (555) 902-1144',
    guardianEmail: 'klaus.becker@becker.de',
    secondaryGuardianName: 'Ingrid Becker',
    secondaryGuardianPhone: '+1 (555) 902-1149',
    secondaryGuardianRelation: 'Mother',
    emergencyContact: '+1 (555) 902-1145',
    bloodGroup: 'A-',
    status: 'Active',
    attendanceRate: 99.1,
    gpa: '4.00',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    address: '210 Riverbend Trail',
    academicHistory: []
  }
];

export const INITIAL_STAFF = [
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
    status: 'Active',
    phone: '+1 (555) 782-9912',
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
    status: 'Active',
    phone: '+1 (555) 782-9913',
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
    status: 'Active',
    phone: '+1 (555) 782-9914',
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
    status: 'Active',
    phone: '+1 (555) 782-9915',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
  }
];

export const INITIAL_ATTENDANCE = [
  { studentId: 'STU-2026-0101', name: 'Aisha Al-Mansoor', rollNo: '10A-01', status: 'Present', remarks: 'On time' },
  { studentId: 'STU-2026-0103', name: 'Chloe Isabella Chen', rollNo: '10A-02', status: 'Absent', remarks: 'Unexplained absence (Alert Queued)' },
  { studentId: 'STU-2026-0102', name: 'Liam Alexander Vance', rollNo: '11CS-01', status: 'Present', remarks: 'On time' },
  { studentId: 'STU-2026-0104', name: 'Zackary Ethan Morales', rollNo: '12PE-01', status: 'Late', remarks: 'Arrived 15m late - transport delay' },
  { studentId: 'STU-2026-0105', name: 'Sofia Noor Rahman', rollNo: '11PM-01', status: 'Excused', remarks: 'Medical leave certificate verified' },
];

export const INITIAL_GRADES = [
  {
    studentId: 'STU-2026-0101',
    name: 'Aisha Al-Mansoor',
    quiz1: 94,
    midterm: 92,
    project: 98,
    finalExam: 95,
    weightedScore: 94.6,
    letterGrade: 'A+',
    status: 'Verified',
  },
  {
    studentId: 'STU-2026-0102',
    name: 'Liam Alexander Vance',
    quiz1: 88,
    midterm: 85,
    project: 95,
    finalExam: 89,
    weightedScore: 88.4,
    letterGrade: 'A',
    status: 'Verified',
  },
  {
    studentId: 'STU-2026-0103',
    name: 'Chloe Isabella Chen',
    quiz1: 72,
    midterm: 70,
    project: 82,
    finalExam: 74,
    weightedScore: 73.8,
    letterGrade: 'B',
    status: 'Pending Review',
  },
  {
    studentId: 'STU-2026-0104',
    name: 'Zackary Ethan Morales',
    quiz1: 98,
    midterm: 96,
    project: 100,
    finalExam: 97,
    weightedScore: 97.4,
    letterGrade: 'A+',
    status: 'Verified',
  },
  {
    studentId: 'STU-2026-0106',
    name: 'Lucas Gabriel Becker',
    quiz1: 100,
    midterm: 98,
    project: 99,
    finalExam: 99,
    weightedScore: 98.9,
    letterGrade: 'A+',
    status: 'Verified',
  }
];

export const QUEUE_ACTIVITIES = [
  { id: 'q-101', type: 'SMS_ALERT', target: '+1 (555) 441-9921', recipient: 'David Chen', status: 'Queued', time: 'Just now', description: 'Immediate absence alert for Chloe Chen' },
  { id: 'q-102', type: 'PDF_REPORT', target: 'Grade 10-A', recipient: 'Batch (28 records)', status: 'Processing', time: '1m ago', description: 'Generating Midterm Report Cards batch PDF' },
  { id: 'q-103', type: 'EMAIL_DISPATCH', target: 'all-faculty@educore.edu', recipient: '42 Faculty Members', status: 'Completed', time: '14m ago', description: 'Academic Council semester review reminder' },
  { id: 'q-104', type: 'DB_BACKUP_SNAPSHOT', target: 's3://educore-backups/pg-snap', recipient: 'System Daemon', status: 'Completed', time: '1h ago', description: 'Nightly incremental database snapshot' },
];

export const TIMETABLE_DATA = {
  '10-A (Science)': {
    'Monday': [
      { period: 'Period 1 (08:30 - 09:20)', subject: 'Physics & Mechanics', teacher: 'Dr. Evelyn Reed', room: 'Lab 3', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { period: 'Period 2 (09:25 - 10:15)', subject: 'Pure Mathematics', teacher: 'Sarah Jenkins', room: 'Room 204', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      { period: 'Period 3 (10:30 - 11:20)', subject: 'Chemistry Lab', teacher: 'Dr. Evelyn Reed', room: 'Lab 1', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { period: 'Period 4 (11:25 - 12:15)', subject: 'English Literature', teacher: 'Ahmed Tariq', room: 'Room 102', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { period: 'Period 5 (01:00 - 01:50)', subject: 'Computer Applications', teacher: 'Prof. Marcus Vance', room: 'IT Suite A', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ],
    'Tuesday': [
      { period: 'Period 1 (08:30 - 09:20)', subject: 'Pure Mathematics', teacher: 'Sarah Jenkins', room: 'Room 204', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      { period: 'Period 2 (09:25 - 10:15)', subject: 'Physics Lecture', teacher: 'Dr. Evelyn Reed', room: 'Room 204', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { period: 'Period 3 (10:30 - 11:20)', subject: 'Biology Principles', teacher: 'Dr. Robert Hall', room: 'Bio Lab 2', color: 'bg-teal-50 text-teal-700 border-teal-200' },
      { period: 'Period 4 (11:25 - 12:15)', subject: 'World History', teacher: 'Elena Gomez', room: 'Room 105', color: 'bg-rose-50 text-rose-700 border-rose-200' },
      { period: 'Period 5 (01:00 - 01:50)', subject: 'Physical Education', teacher: 'Coach Peterson', room: 'Sports Complex', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ],
    'Wednesday': [
      { period: 'Period 1 (08:30 - 09:20)', subject: 'Chemistry Theory', teacher: 'Dr. Evelyn Reed', room: 'Room 204', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { period: 'Period 2 (09:25 - 10:15)', subject: 'English Composition', teacher: 'Ahmed Tariq', room: 'Room 102', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { period: 'Period 3 (10:30 - 11:20)', subject: 'Pure Mathematics', teacher: 'Sarah Jenkins', room: 'Room 204', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      { period: 'Period 4 (11:25 - 12:15)', subject: 'Physics Problem Lab', teacher: 'Dr. Evelyn Reed', room: 'Lab 3', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { period: 'Period 5 (01:00 - 01:50)', subject: 'Robotics Workshop', teacher: 'Prof. Marcus Vance', room: 'Robotics Wing', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ],
    'Thursday': [
      { period: 'Period 1 (08:30 - 09:20)', subject: 'Computer Applications', teacher: 'Prof. Marcus Vance', room: 'IT Suite A', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { period: 'Period 2 (09:25 - 10:15)', subject: 'Pure Mathematics', teacher: 'Sarah Jenkins', room: 'Room 204', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      { period: 'Period 3 (10:30 - 11:20)', subject: 'English Literature', teacher: 'Ahmed Tariq', room: 'Room 102', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { period: 'Period 4 (11:25 - 12:15)', subject: 'Physics Seminar', teacher: 'Dr. Evelyn Reed', room: 'Room 204', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { period: 'Period 5 (01:00 - 01:50)', subject: 'Library Research', teacher: 'Ahmed Tariq', room: 'Central Library', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ],
    'Friday': [
      { period: 'Period 1 (08:30 - 09:20)', subject: 'Mathematics Quiz', teacher: 'Sarah Jenkins', room: 'Room 204', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      { period: 'Period 2 (09:25 - 10:15)', subject: 'Chemistry Practical', teacher: 'Dr. Evelyn Reed', room: 'Lab 1', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { period: 'Period 3 (10:30 - 11:20)', subject: 'Applied Physics Project', teacher: 'Dr. Evelyn Reed', room: 'Lab 3', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { period: 'Period 4 (11:25 - 12:15)', subject: 'Languages & Speech', teacher: 'Ahmed Tariq', room: 'Auditorium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { period: 'Period 5 (01:00 - 01:50)', subject: 'Weekly Assembly / Club', teacher: 'Staff Council', room: 'Grand Hall', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ]
  }
};

export const MOCK_INVOICES = [
  { id: 'INV-2026-081', studentId: 'STU-2026-0101', term: 'Fall Term 2026', amount: 1850, dueDate: '2026-09-01', status: 'Paid', paymentDate: '2026-08-28', receipt: 'REC-9941-A' },
  { id: 'INV-2026-082', studentId: 'STU-2026-0101', term: 'Spring Term 2027', amount: 1850, dueDate: '2027-01-15', status: 'Upcoming', paymentDate: null, receipt: null },
  { id: 'INV-2026-LAB', studentId: 'STU-2026-0102', term: 'Science Lab & STEM Fee', amount: 220, dueDate: '2026-09-10', status: 'Paid', paymentDate: '2026-09-05', receipt: 'REC-9972-B' },
  { id: 'INV-2026-083', studentId: 'STU-2026-0103', term: 'Fall Term 2026', amount: 1850, dueDate: '2026-09-01', status: 'Overdue', paymentDate: null, receipt: null },
];

export const NOTIFICATIONS_LOG = [
  { id: 'notif-1', title: 'Absence Alert Dispatched', time: '2m ago', channel: 'SMS & WhatsApp', recipient: 'David Chen (+1 555-441-9921)', status: 'Delivered', unread: true },
  { id: 'notif-2', title: 'Midterm Report Batch Generated', time: '12m ago', channel: 'PDF Compiler', recipient: 'Grade 10-A (28 Students)', status: 'Success', unread: true },
  { id: 'notif-3', title: 'Faculty Schedule Sync Complete', time: '1h ago', channel: 'System Daemon', recipient: 'All Academic Staff', status: 'Delivered', unread: false },
  { id: 'notif-4', title: 'Term Fee Payment Received', time: '3h ago', channel: 'Stripe Gateway', recipient: 'Tariq Al-Mansoor ($1,850)', status: 'Settled', unread: false },
];

export const RBAC_PERMISSIONS_MATRIX = [
  { module: 'Student Records (SIS)', view: ['super_admin', 'principal', 'teacher', 'admin_staff'], create: ['super_admin', 'admin_staff'], edit: ['super_admin', 'admin_staff'], delete: ['super_admin'], export: ['super_admin', 'principal', 'admin_staff'] },
  { module: 'Staff & Faculty Management', view: ['super_admin', 'principal', 'admin_staff'], create: ['super_admin'], edit: ['super_admin', 'principal'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Section Attendance Engine', view: ['super_admin', 'principal', 'teacher', 'admin_staff', 'guardian'], create: ['super_admin', 'teacher'], edit: ['super_admin', 'teacher'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Gradebook & Transcripts', view: ['super_admin', 'principal', 'teacher', 'guardian'], create: ['super_admin', 'teacher'], edit: ['super_admin', 'teacher'], delete: ['super_admin'], export: ['super_admin', 'principal', 'teacher', 'guardian'] },
  { module: 'Fee & Billing Governance', view: ['super_admin', 'principal', 'admin_staff', 'guardian'], create: ['super_admin', 'admin_staff'], edit: ['super_admin', 'admin_staff'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Exam & Invigilation Schedules', view: ['super_admin', 'principal', 'teacher', 'admin_staff'], create: ['super_admin', 'principal'], edit: ['super_admin', 'principal'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Redis Queue & Infra Telemetry', view: ['super_admin', 'principal'], create: ['super_admin'], edit: ['super_admin'], delete: ['super_admin'], export: ['super_admin'] }
];

export const AUDIT_LOGS = [
  { id: 'aud-901', timestamp: '2026-10-24 13:42:10', actor: 'Dr. Evelyn Reed (Teacher)', action: 'GRADE_BATCH_UPDATE', entity: 'Grade 10-A Physics Final Marks', ip: '192.168.1.45', status: 'Success' },
  { id: 'aud-902', timestamp: '2026-10-24 13:30:02', actor: 'Admin Registrar (Staff)', action: 'STUDENT_ADMISSION', entity: 'Elena Rostova (STU-2026-0107)', ip: '192.168.1.12', status: 'Success' },
  { id: 'aud-903', timestamp: '2026-10-24 12:15:44', actor: 'System Daemon (BullMQ)', action: 'REDIS_DISPATCH_SMS', entity: 'Guardian Alert: Chloe Chen', ip: '127.0.0.1', status: 'Delivered' },
  { id: 'aud-904', timestamp: '2026-10-24 11:00:29', actor: 'Dean Vance (Principal)', action: 'TIMETABLE_ROOM_REALLOC', entity: 'IT Suite A -> Period 3 (CS11)', ip: '192.168.1.10', status: 'Success' },
  { id: 'aud-905', timestamp: '2026-10-24 09:12:00', actor: 'Super Admin', action: 'DATABASE_BACKUP_EXEC', entity: 's3://educore-backups/pg-snap-24', ip: '10.0.0.1', status: 'Completed' },
];

export const STUDENT_DOCUMENTS = [
  { id: 'doc-01', studentId: 'STU-2026-0101', studentName: 'Aisha Al-Mansoor', title: 'National Identity Verification.pdf', category: 'Identity', size: '1.4 MB', mimeType: 'application/pdf', uploadedAt: '2026-08-14', s3Key: 's3://educore-vault/stu-0101/id-card.pdf', status: 'Verified' },
  { id: 'doc-02', studentId: 'STU-2026-0101', studentName: 'Aisha Al-Mansoor', title: 'Birth Certificate Certified.pdf', category: 'Legal', size: '890 KB', mimeType: 'application/pdf', uploadedAt: '2026-08-14', s3Key: 's3://educore-vault/stu-0101/birth-cert.pdf', status: 'Verified' },
  { id: 'doc-03', studentId: 'STU-2026-0102', studentName: 'Liam Alexander Vance', title: 'Medical Immunization Record.pdf', category: 'Health', size: '1.8 MB', mimeType: 'application/pdf', uploadedAt: '2026-08-16', s3Key: 's3://educore-vault/stu-0102/medical-vax.pdf', status: 'Verified' },
  { id: 'doc-04', studentId: 'STU-2026-0103', studentName: 'Chloe Isabella Chen', title: 'Prior Academic Transcript.pdf', category: 'Academic', size: '1.2 MB', mimeType: 'application/pdf', uploadedAt: '2026-08-18', s3Key: 's3://educore-vault/stu-0103/prev-transcript.pdf', status: 'Pending Review' },
  { id: 'doc-05', studentId: 'STU-2026-0105', studentName: 'Sofia Noor Rahman', title: 'Doctor Medical Leave Letter.pdf', category: 'Health', size: '640 KB', mimeType: 'application/pdf', uploadedAt: '2026-10-20', s3Key: 's3://educore-vault/stu-0105/doctor-note.pdf', status: 'Verified' },
];

export const EXAM_SCHEDULES = [
  { id: 'ex-101', title: 'Fall Midterm Assessment: Physics', classLevel: 'Grade 10', date: '2026-11-04', time: '09:00 AM - 11:30 AM', hall: 'Auditorium Hall A', capacity: 120, enrolled: 88, invigilator: 'Prof. Marcus Vance', status: 'Scheduled' },
  { id: 'ex-102', title: 'Computer Science Practical Exam', classLevel: 'Grade 11', date: '2026-11-05', time: '10:00 AM - 12:00 PM', hall: 'IT Suites 1 & 2', capacity: 60, enrolled: 54, invigilator: 'Dr. Evelyn Reed', status: 'Scheduled' },
  { id: 'ex-103', title: 'Pure Mathematics Comprehensive', classLevel: 'Grade 10', date: '2026-11-06', time: '08:30 AM - 11:00 AM', hall: 'Grand Hall B', capacity: 100, enrolled: 88, invigilator: 'Ahmed Tariq', status: 'Scheduled' },
  { id: 'ex-104', title: 'Advanced Calculus Term Final', classLevel: 'Grade 12', date: '2026-11-08', time: '01:00 PM - 03:30 PM', hall: 'Auditorium Hall A', capacity: 120, enrolled: 96, invigilator: 'Sarah Jenkins', status: 'Drafting' },
];

export const FEE_COLLECTION_SUMMARY = {
  totalBilled: 384000,
  totalCollected: 342500,
  totalOutstanding: 41500,
  collectionRate: 89.2,
  activeWaivers: 8,
};

export const INITIAL_SYSTEM_USERS = [
  { id: 'usr-101', name: 'Alexander Vance', email: 'admin@educore.edu', role: 'super_admin', userType: 'Administrator', status: 'Active', twoFactor: true, lastLogin: '10 mins ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-102', name: 'Dr. Evelyn Reed', email: 'e.reed@educore.edu', role: 'teacher', userType: 'Faculty / Staff', status: 'Active', twoFactor: true, lastLogin: '35 mins ago', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-103', name: 'Prof. Marcus Vance', email: 'm.vance@educore.edu', role: 'teacher', userType: 'Faculty / Staff', status: 'Active', twoFactor: false, lastLogin: '2 hours ago', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-104', name: 'Registrar Admissions Staff', email: 'registrar@educore.edu', role: 'admin_staff', userType: 'Administrative Staff', status: 'Active', twoFactor: true, lastLogin: '1 hour ago', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-105', name: 'Aisha Al-Mansoor', email: 'aisha.m@student.educore.edu', role: 'student', userType: 'Enrolled Student', status: 'Active', twoFactor: false, lastLogin: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-106', name: 'Tariq Al-Mansoor', email: 'tariq.mansoor@gmail.com', role: 'guardian', userType: 'Parent / Guardian', status: 'Active', twoFactor: false, lastLogin: '3 days ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-107', name: 'Liam Alexander Vance', email: 'liam.v@student.educore.edu', role: 'student', userType: 'Enrolled Student', status: 'Active', twoFactor: false, lastLogin: '4 hours ago', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-108', name: 'David Chen', email: 'david.chen@enterprise.org', role: 'guardian', userType: 'Parent / Guardian', status: 'Disabled', twoFactor: false, lastLogin: '2 weeks ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
  { id: 'usr-109', name: 'Chloe Isabella Chen', email: 'chloe.c@student.educore.edu', role: 'student', userType: 'Enrolled Student', status: 'Active', twoFactor: false, lastLogin: '5 days ago', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120' },
];
