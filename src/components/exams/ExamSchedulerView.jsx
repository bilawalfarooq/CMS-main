import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  Clock, 
  Plus, 
  CheckCircle2, 
  FileText,
  Users
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export default function ExamSchedulerView() {
  const { examSchedules, addExam } = useCMS();
  const exams = examSchedules || [];
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    classLevel: 'Grade 10',
    date: '2026-11-10',
    time: '09:00 AM - 11:30 AM',
    hall: 'Auditorium Hall A',
    capacity: 120,
    enrolled: 88,
    invigilator: 'Dr. Evelyn Reed'
  });

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExam.title.trim()) return;

    const created = {
      title: newExam.title,
      classLevel: newExam.classLevel,
      date: newExam.date,
      time: newExam.time,
      hall: newExam.hall,
      capacity: Number(newExam.capacity),
      enrolled: Number(newExam.enrolled),
      invigilator: newExam.invigilator,
      status: 'Scheduled'
    };

    if (addExam) {
      const res = await addExam(created);
      if (res && res.success === false) {
        alert(`Failed to schedule exam: ${res.error || 'Server error'}`);
        return;
      }
    }
    setShowAddExam(false);
    setNewExam({
      title: '',
      classLevel: 'Grade 10',
      date: '2026-11-10',
      time: '09:00 AM - 11:30 AM',
      hall: 'Auditorium Hall A',
      capacity: 120,
      enrolled: 88,
      invigilator: 'Dr. Evelyn Reed'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-600" />
            Term Examination & Invigilation Scheduler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exam session timetable, examination hall allocations, seat quotas, and proctor assignments.
          </p>
        </div>

        <button
          onClick={() => setShowAddExam(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Exam Session</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map(exam => {
          const fillRate = Math.round((exam.enrolled / exam.capacity) * 100);
          return (
            <div 
              key={exam.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-xs text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-300 px-2.5 py-0.5 rounded-lg">
                    {exam.classLevel}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    exam.status === 'Scheduled'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {exam.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {exam.title}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.date} • {exam.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: <strong>{exam.hall}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Chief Invigilator: <strong>{exam.invigilator}</strong></span>
                  </div>
                </div>
              </div>

              {/* Seating Progress */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Hall Seating Fill Rate:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {exam.enrolled} / {exam.capacity} Students ({fillRate}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${fillRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exam Modal */}
      {showAddExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Schedule Term Examination</h3>
              <button onClick={() => setShowAddExam(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateExam} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="e.g. Organic Chemistry Final"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Class Level</label>
                  <select
                    value={newExam.classLevel}
                    onChange={(e) => setNewExam({ ...newExam, classLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                  >
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={newExam.date}
                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Examination Hall</label>
                <select
                  value={newExam.hall}
                  onChange={(e) => setNewExam({ ...newExam, hall: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                >
                  <option value="Auditorium Hall A">Auditorium Hall A (120 Seats)</option>
                  <option value="Grand Hall B">Grand Hall B (100 Seats)</option>
                  <option value="IT Suites 1 & 2">IT Suites 1 & 2 (60 Seats)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Assigned Invigilator</label>
                <input
                  type="text"
                  required
                  value={newExam.invigilator}
                  onChange={(e) => setNewExam({ ...newExam, invigilator: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExam(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
