import React from 'react';
import { 
  Bell, 
  Search, 
  ShieldCheck, 
  Calendar, 
  Cpu, 
  Sparkles,
  School,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { ROLES, ACADEMIC_YEARS } from '../../data/mockData';

export default function Navbar({ 
  currentRole, 
  setCurrentRole, 
  academicYear, 
  setAcademicYear, 
  onOpenQuickAdmission,
  onOpenNotifications,
  onOpenCommandPalette,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  queueCount = 4
}) {
  const activeRoleObj = ROLES.find(r => r.id === currentRole) || ROLES[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Academic Year Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">EduCore</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                  CMS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Apex Institute of Science & Technology</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center ml-6 pl-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Year:</span>
              <select 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 dark:text-white cursor-pointer outline-none focus:ring-0"
              >
                {ACADEMIC_YEARS.map(ay => (
                  <option key={ay.id} value={ay.id} className="dark:bg-slate-800">
                    {ay.name} ({ay.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Triggers Command Palette) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div 
            onClick={onOpenCommandPalette}
            className="relative w-full cursor-pointer group"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-hover:text-brand-600 transition" />
            <div className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between">
              <span>Quick jump or search students...</span>
              <kbd className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded shadow-sm">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </div>

        {/* Actions & Role Switcher */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Queue & Job Status Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Redis Worker</span>
            <span className="bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-semibold px-1 rounded text-[10px]">
              {queueCount} in queue
            </span>
          </div>

          {/* Quick Admission Button */}
          {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
            <button 
              onClick={onOpenQuickAdmission}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admit Student</span>
            </button>
          )}

          {/* Role Switcher Sandbox */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hidden md:inline">Role:</span>
              <select 
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="bg-white dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 outline-none cursor-pointer shadow-sm"
              >
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications Button */}
          <button 
            onClick={onOpenNotifications}
            title="Inspect Queue & Dispatches"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">Dr. A. Vance</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight capitalize">{activeRoleObj.label}</p>
            </div>
            
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out / Switch Account"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
