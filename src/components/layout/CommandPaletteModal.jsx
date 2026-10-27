import React, { useState, useEffect } from 'react';
import { 
  Search, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  Award, 
  CreditCard, 
  FolderArchive, 
  ShieldCheck, 
  Server, 
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

export default function CommandPaletteModal({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onSelectStudent,
  onOpenAdmission,
  students = []
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Student Admissions Directory', tab: 'students', icon: GraduationCap },
    { label: 'User & Login Accounts Management', tab: 'users', icon: ShieldCheck },
    { label: 'Mark Section Attendance', tab: 'attendance', icon: CheckCircle2 },
    { label: 'Class Weekly Timetable', tab: 'timetable', icon: Calendar },
    { label: 'Gradebook & Transcripts', tab: 'gradebook', icon: Award },
    { label: 'Tuition Fee & Billing Ledger', tab: 'fees', icon: CreditCard },
    { label: 'S3 Document & Media Vault', tab: 'documents', icon: FolderArchive },
    { label: 'Granular RBAC Policy Matrix', tab: 'rbac', icon: ShieldCheck },
    { label: 'Security Audit Trail Logs', tab: 'audit', icon: ShieldCheck },
    { label: 'Exam Session Scheduler', tab: 'exams', icon: Calendar },
    { label: 'System & Redis Queue Telemetry', tab: 'system_health', icon: Server },
  ];

  const matchedStudents = students.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.id.toLowerCase().includes(query.toLowerCase())
  );

  const matchedActions = quickActions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a student name, admission ID, or jump to a module..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Nav Actions */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider block mb-1">
              Navigation Shortcuts
            </span>
            <div className="space-y-0.5">
              {matchedActions.slice(0, 5).map(act => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.tab}
                    onClick={() => {
                      onNavigate(act.tab);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-brand-600 group-hover:scale-110 transition" />
                      <span className="font-semibold">{act.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Matches */}
          {matchedStudents.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider block mb-1">
                Student Directory Matches
              </span>
              <div className="space-y-0.5">
                {matchedStudents.slice(0, 4).map(st => (
                  <button
                    key={st.id}
                    onClick={() => {
                      if (onSelectStudent) {
                        onSelectStudent(st.id);
                      } else {
                        onNavigate('students');
                      }
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={st.avatar} alt={st.name} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <span className="font-bold">{st.name}</span>
                        <span className="text-[11px] text-slate-400 ml-2 font-mono">{st.id}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-600">{st.grade}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex items-center justify-between px-3">
          <span>Tip: Press <code>Ctrl + K</code> anytime to open the Command Palette.</span>
          <button 
            onClick={() => {
              onClose();
              onOpenAdmission();
            }}
            className="text-brand-600 font-bold hover:underline"
          >
            + Quick Admit Student
          </button>
        </div>
      </div>
    </div>
  );
}
