import React from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Layers, 
  CheckCircle2, 
  Award, 
  HardDrive, 
  Calendar,
  UserCheck,
  UserCog,
  CreditCard,
  FolderArchive,
  ShieldCheck,
  ShieldAlert,
  LifeBuoy
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentRole, 
  studentCount = 6, 
  hasAttendanceAnomaly = true 
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'principal', 'teacher', 'admin_staff', 'guardian'],
    },
    {
      id: 'portal',
      label: 'Guardian & Student Portal',
      icon: UserCheck,
      badge: 'Portal',
      roles: ['guardian', 'super_admin'],
    },
    {
      id: 'students',
      label: 'Student Information (SIS)',
      icon: GraduationCap,
      badge: `${studentCount} Active`,
      roles: ['super_admin', 'principal', 'teacher', 'admin_staff'],
    },
    {
      id: 'staff',
      label: 'Staff & Faculty',
      icon: Users,
      roles: ['super_admin', 'principal', 'admin_staff'],
    },
    {
      id: 'academics',
      label: 'Academic Hierarchy',
      icon: Layers,
      roles: ['super_admin', 'principal', 'teacher', 'admin_staff'],
    },
    {
      id: 'timetable',
      label: 'Class Timetables',
      icon: Calendar,
      roles: ['super_admin', 'principal', 'teacher', 'admin_staff', 'guardian'],
    },
    {
      id: 'attendance',
      label: 'Attendance Engine',
      icon: CheckCircle2,
      badge: hasAttendanceAnomaly ? '1 Anomaly' : null,
      badgeType: 'warning',
      roles: ['super_admin', 'principal', 'teacher', 'admin_staff'],
    },
    {
      id: 'gradebook',
      label: 'Gradebook & Reports',
      icon: Award,
      roles: ['super_admin', 'principal', 'teacher'],
    },
    {
      id: 'exams',
      label: 'Exam Sessions & Halls',
      icon: Calendar,
      roles: ['super_admin', 'principal', 'teacher', 'admin_staff'],
    },
    {
      id: 'fees',
      label: 'Fee & Billing Governance',
      icon: CreditCard,
      roles: ['super_admin', 'principal', 'admin_staff'],
    },
    {
      id: 'documents',
      label: 'Student Document Vault',
      icon: FolderArchive,
      roles: ['super_admin', 'principal', 'admin_staff'],
    },
    {
      id: 'users',
      label: 'User Accounts & Logins',
      icon: UserCog,
      badge: 'Auth',
      roles: ['super_admin', 'principal', 'admin_staff'],
    },
    {
      id: 'rbac',
      label: 'RBAC Policy Matrix',
      icon: ShieldCheck,
      roles: ['super_admin', 'principal'],
    },
    {
      id: 'audit',
      label: 'Security Audit Trail',
      icon: ShieldAlert,
      roles: ['super_admin', 'principal'],
    },
    {
      id: 'system_health',
      label: 'System & Redis Health',
      icon: HardDrive,
      roles: ['super_admin', 'principal'],
    },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-57px)] border-r border-slate-800 transition-all">
      {/* Role Notice Banner */}
      <div className="p-3 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-start gap-2.5">
        <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0"></div>
        <div>
          <p className="text-[11px] font-semibold text-slate-200">Active Access Context</p>
          <p className="text-[10px] text-slate-400">
            {currentRole === 'guardian' ? 'Guardian Portal & Transcripts' : 
             currentRole === 'teacher' ? 'Faculty Section & Grade Permissions' : 
             'Full Administrative Matrix'}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 space-y-0.5 py-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Management Modules
        </p>
        {filteredItems.map(item => {
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
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
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

      {/* Storage & Infrastructure Quick Card */}
      <div className="p-3 mx-3 mb-3 bg-gradient-to-b from-slate-800/90 to-slate-800/40 rounded-xl border border-slate-700/60 mt-auto">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-brand-400" />
            S3 Document Store
          </span>
          <span className="text-slate-300 font-semibold">14.2 / 100 GB</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 rounded-full w-[14.2%]"></div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">
          Strict 2MB upload ceiling & presigned URLs active.
        </p>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>EduCore v1.0.0</span>
        <span className="flex items-center gap-1 text-slate-400 hover:text-slate-300 cursor-pointer">
          <LifeBuoy className="w-3 h-3" /> Docs & Support
        </span>
      </div>
    </aside>
  );
}
