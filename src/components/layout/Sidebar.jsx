import React from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Layers, 
  CheckCircle2, 
  Award, 
  Calendar,
  UserCheck,
  UserCog,
  CreditCard,
  FolderArchive,
  ShieldCheck,
  ShieldAlert,
  LifeBuoy,
  BookOpen,
  ClipboardList,
  FileText,
  BarChart3
} from 'lucide-react';



// Section definitions with role-aware headers
const getSidebarSections = (currentRole, studentCount, hasAttendanceAnomaly) => {
  // All possible menu items
  const allItems = {
    dashboard: {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff', 'accountant'],
    },
    portal: {
      id: 'portal',
      label: 'Student & Ward Portal',
      icon: UserCheck,
      badge: 'Portal',
      roles: ['guardian', 'student'],
    },
    students: {
      id: 'students',
      label: 'Student Information (SIS)',
      icon: GraduationCap,
      badge: `${studentCount} Active`,
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff'],
    },
    staff: {
      id: 'staff',
      label: 'Staff & Faculty',
      icon: Users,
      roles: ['super_admin', 'principal', 'hod', 'admin_staff'],
    },
    classes: {
      id: 'classes',
      label: 'Class & Section ERP',
      icon: Layers,
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff'],
    },
    academics: {
      id: 'academics',
      label: 'Multi-Year Pipeline',
      icon: BookOpen,
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff'],
    },
    timetable: {
      id: 'timetable',
      label: 'Class Timetables',
      icon: Calendar,
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff', 'student', 'guardian'],
    },
    attendance: {
      id: 'attendance',
      label: 'Attendance Engine',
      icon: CheckCircle2,
      badge: hasAttendanceAnomaly ? '1 Anomaly' : null,
      badgeType: 'warning',
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff'],
    },
    gradebook: {
      id: 'gradebook',
      label: 'Gradebook & Reports',
      icon: Award,
      roles: ['super_admin', 'principal', 'hod', 'teacher'],
    },
    exams: {
      id: 'exams',
      label: 'Exam Sessions & Halls',
      icon: ClipboardList,
      roles: ['super_admin', 'principal', 'hod', 'teacher', 'admin_staff'],
    },
    fees: {
      id: 'fees',
      label: 'Fee & Billing',
      icon: CreditCard,
      roles: ['super_admin', 'principal', 'admin_staff', 'accountant'],
    },
    documents: {
      id: 'documents',
      label: 'Student Document Vault',
      icon: FolderArchive,
      roles: ['super_admin', 'principal', 'admin_staff'],
    },
    users: {
      id: 'users',
      label: 'User Accounts & Logins',
      icon: UserCog,
      badge: 'Auth',
      roles: ['super_admin', 'principal', 'admin_staff'],
    },
    rbac: {
      id: 'rbac',
      label: 'RBAC Policy Matrix',
      icon: ShieldCheck,
      roles: ['super_admin', 'principal'],
    },
    audit: {
      id: 'audit',
      label: 'Security Audit Trail',
      icon: ShieldAlert,
      roles: ['super_admin', 'principal'],
    },
  };

  // Role-specific section layouts
  const sectionsByRole = {
    super_admin: [
      { header: 'Overview', items: ['dashboard'] },
      { header: 'Academic Management', items: ['students', 'classes', 'staff', 'academics', 'timetable'] },
      { header: 'Evaluation & Exams', items: ['attendance', 'gradebook', 'exams'] },
      { header: 'Finance & Documents', items: ['fees', 'documents'] },
      { header: 'Administration', items: ['users', 'rbac', 'audit'] },
    ],
    principal: [
      { header: 'Overview', items: ['dashboard'] },
      { header: 'Academic Management', items: ['students', 'classes', 'staff', 'academics', 'timetable'] },
      { header: 'Evaluation & Exams', items: ['attendance', 'gradebook', 'exams'] },
      { header: 'Finance & Documents', items: ['fees', 'documents'] },
      { header: 'Administration', items: ['users', 'rbac', 'audit'] },
    ],
    hod: [
      { header: 'Overview', items: ['dashboard'] },
      { header: 'Department Academics', items: ['students', 'classes', 'staff', 'academics', 'timetable'] },
      { header: 'Evaluation & Exams', items: ['attendance', 'gradebook', 'exams'] },
    ],
    teacher: [
      { header: 'Overview', items: ['dashboard'] },
      { header: 'My Classes', items: ['students', 'classes', 'academics', 'timetable'] },
      { header: 'Teaching & Grades', items: ['attendance', 'gradebook', 'exams'] },
    ],
    admin_staff: [
      { header: 'Overview', items: ['dashboard'] },
      { header: 'Enrollment & Records', items: ['students', 'classes', 'staff', 'academics', 'timetable'] },
      { header: 'Operations', items: ['attendance', 'exams', 'fees', 'documents'] },
      { header: 'Administration', items: ['users'] },
    ],
    accountant: [
      { header: 'Overview', items: ['dashboard'] },
      { header: 'Finance & Billing', items: ['fees'] },
    ],
    student: [
      { header: 'Student Portal', items: ['portal', 'timetable'] },
    ],
    guardian: [
      { header: 'Guardian Portal', items: ['portal', 'timetable'] },
    ],
  };

  const sections = sectionsByRole[currentRole] || sectionsByRole.guardian;

  // Filter items by role availability and build sections
  return sections
    .map(section => ({
      header: section.header,
      items: section.items
        .map(itemId => allItems[itemId])
        .filter(item => item && item.roles.includes(currentRole)),
    }))
    .filter(section => section.items.length > 0);
};

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentRole, 
  studentCount = 6, 
  hasAttendanceAnomaly = true 
}) {
  const sections = getSidebarSections(currentRole, studentCount, hasAttendanceAnomaly);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-[calc(100vh-57px)] sticky top-[57px] border-r border-slate-800 transition-all overflow-hidden select-none">
      {/* Navigation Sections (Scrollable without visible scrollbars) */}
      <div className="flex-1 px-3 space-y-3.5 pt-3 pb-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {/* Section Header */}
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {section.header}
            </p>

            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                      <span className="truncate text-left">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1.5 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : item.badgeType === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>AMSTech CMS • SBTE</span>
        <a 
          href="https://amstech.edu.pk" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer"
        >
          <LifeBuoy className="w-3 h-3" /> amstech.edu.pk
        </a>
      </div>
    </aside>
  );
}
