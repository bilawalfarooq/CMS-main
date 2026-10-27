import React from 'react';
import { 
  Bell, 
  Search, 
  Calendar, 
  Cpu, 
  School,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { ROLES } from '../../data/mockData';

export default function Navbar({ 
  currentRole, 
  setCurrentRole, 
  academicYear, 
  setAcademicYear, 
  academicYears = [],
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
          <div className="flex items-center gap-3">
            <a href="https://amstech.edu.pk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
              <img 
                src="/logo.webp" 
                alt="AMSTech Logo" 
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#1c3b73] dark:text-white tracking-tight text-lg">AMSTech</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100/80 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300/80 dark:border-amber-700">
                    CMS
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-[#1c3b73] dark:bg-slate-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-slate-700">
                    SBTE
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block leading-tight">Al-Mustafa Institute of Science & Technology</p>
              </div>
            </a>
          </div>

          {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
            <div className="hidden lg:flex items-center ml-6 pl-6 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Year:</span>
                <select 
                  value={academicYear} 
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 dark:text-white cursor-pointer outline-none focus:ring-0"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id} className="dark:bg-slate-800">
                      {ay.name} ({ay.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
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
