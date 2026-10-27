import React, { useState } from 'react';
import { 
  Layers, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Archive, 
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { INITIAL_CLASSES, ACADEMIC_YEARS } from '../../data/mockData';

export default function AcademicHierarchyView({ currentRole }) {
  const { classes: contextClasses, simulateAcademicRollover } = useCMS();
  const classes = contextClasses && contextClasses.length > 0 ? contextClasses : INITIAL_CLASSES;
  const [selectedYear, setSelectedYear] = useState('ay-2026');
  const [showRolloverNotice, setShowRolloverNotice] = useState(false);

  const handleSimulateRollover = () => {
    if (simulateAcademicRollover) {
      simulateAcademicRollover();
    }
    setShowRolloverNotice(true);
    setTimeout(() => {
      setShowRolloverNotice(false);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            Academic Hierarchy & Multi-Year Isolation
          </h2>
          <p className="text-xs text-slate-500">
            Multi-tiered grade levels, section distributions, and historical cycle retention architecture.
          </p>
        </div>

        {(currentRole === 'super_admin' || currentRole === 'principal') && (
          <button
            onClick={handleSimulateRollover}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
          >
            <Archive className="w-4 h-4 text-brand-400" />
            <span>Simulate End-of-Year Rollover</span>
          </button>
        )}
      </div>

      {/* Rollover Architecture Notice Banner */}
      {showRolloverNotice && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs text-indigo-950">
            <h4 className="font-bold">Append-Only Promotion Pipeline Executed</h4>
            <p className="mt-0.5 text-indigo-900">
              Active enrollments in <code>2026 - 2027</code> promoted to next grade level. Historical semester marks archived under immutable foreign key <code>academic_year_id: 'ay-2026'</code>. Zero historical data overwritten (Architecture Policy 7.2).
            </p>
          </div>
        </div>
      )}

      {/* Academic Year Isolations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ACADEMIC_YEARS.map(year => (
          <div 
            key={year.id}
            onClick={() => setSelectedYear(year.id)}
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              selectedYear === year.id
                ? 'bg-brand-50/70 border-brand-500 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" />
                {year.name}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                year.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {year.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Timeline: {year.startDate} to {year.endDate}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">UUID: {year.id}</p>
          </div>
        ))}
      </div>

      {/* Grade and Section Matrix */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Class Tiers & Section Allocations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(item => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {item.name.replace('Grade ', 'G')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                    <span className="text-[11px] text-slate-500 font-medium">{item.level}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{item.studentCount} Students</span>
                  <span className="block text-[10px] text-slate-400">Head: {item.headTeacher}</span>
                </div>
              </div>

              {/* Sections list */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Configured Section Streams
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.sections.map(sec => (
                    <div 
                      key={sec}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Core Curriculum: STEM & Humanities</span>
                <span className="font-semibold text-brand-600">8 Subjects Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
