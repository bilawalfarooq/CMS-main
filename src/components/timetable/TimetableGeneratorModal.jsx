import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  X, 
  Play, 
  Save, 
  Check, 
  Printer, 
  BookOpen, 
  Users, 
  Building,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/apiClient';

export default function TimetableGeneratorModal({
  isOpen,
  onClose,
  initialClassId,
  initialSectionId,
  availableClasses = [],
  availableSubjects = [],
  availableStaff = [],
  onTimetablePublished,
}) {
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId || '');
  const [academicYear, setAcademicYear] = useState('ay-2026');

  // Timetable Configuration Settings
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [dailyStartTime, setDailyStartTime] = useState('08:30');
  const [dailyEndTime, setDailyEndTime] = useState('14:00');
  const [periodDuration, setPeriodDuration] = useState(50);
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(5);

  // Subject Allocations
  const [allocations, setAllocations] = useState([]);

  // Generation & Validation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'preview'
  const [errorMessage, setErrorMessage] = useState(null);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Resolve active class and its sections
  const activeClass = availableClasses.find((c) => c.id === selectedClassId) || availableClasses[0];
  const activeSections = activeClass?.sections || [];

  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    if (initialSectionId) setSelectedSectionId(initialSectionId);
  }, [initialClassId, initialSectionId]);

  useEffect(() => {
    if (activeSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(activeSections[0].id);
    }
  }, [activeClass, activeSections, selectedSectionId]);

  // Seed default subject allocation rows if empty
  useEffect(() => {
    if (allocations.length === 0 && availableSubjects.length > 0) {
      const initial = availableSubjects.slice(0, 5).map((sub, idx) => {
        const teacher = availableStaff[idx % (availableStaff.length || 1)];
        const isLab = sub.name.toLowerCase().includes('computer') || sub.name.toLowerCase().includes('physics') || sub.name.toLowerCase().includes('chemistry');
        return {
          id: `alloc-${idx + 1}`,
          subjectId: sub.id,
          subjectName: sub.name,
          staffId: teacher?.id || availableStaff[0]?.id || '',
          staffName: teacher?.name || 'Assigned Faculty',
          room: isLab ? 'Advanced Science Lab' : 'Lecture Room 204',
          weeklyTheory: 3,
          weeklyPractical: isLab ? 2 : 0,
          isDoublePeriod: isLab,
          colorTag: [
            'bg-indigo-50 text-indigo-700 border-indigo-200',
            'bg-blue-50 text-blue-700 border-blue-200',
            'bg-purple-50 text-purple-700 border-purple-200',
            'bg-teal-50 text-teal-700 border-teal-200',
            'bg-amber-50 text-amber-700 border-amber-200',
          ][idx % 5],
        };
      });
      setAllocations(initial);
    }
  }, [availableSubjects, availableStaff, allocations.length]);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddAllocationRow = () => {
    const firstSub = availableSubjects[0];
    const firstTeacher = availableStaff[0];
    setAllocations((prev) => [
      ...prev,
      {
        id: `alloc-${Date.now()}`,
        subjectId: firstSub?.id || '',
        subjectName: firstSub?.name || 'Subject',
        staffId: firstTeacher?.id || '',
        staffName: firstTeacher?.name || 'Faculty',
        room: 'General Classroom',
        weeklyTheory: 3,
        weeklyPractical: 0,
        isDoublePeriod: false,
        colorTag: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
    ]);
  };

  const handleUpdateAllocation = (index, field, value) => {
    setAllocations((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      if (field === 'subjectId') {
        const found = availableSubjects.find((s) => s.id === value);
        if (found) row.subjectName = found.name;
      }
      if (field === 'staffId') {
        const found = availableStaff.find((st) => st.id === value);
        if (found) row.staffName = found.name;
      }
      next[index] = row;
      return next;
    });
  };

  const handleRemoveAllocation = (index) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  // Run automated generation algorithm
  const handleGenerateTimetable = async () => {
    if (!selectedSectionId) {
      setErrorMessage('Please select a target Section before generating.');
      return;
    }
    if (allocations.length === 0) {
      setErrorMessage('Please configure at least one subject allocation.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const payload = {
        academicYearId: academicYear,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        workingDays,
        dailyStartTime,
        dailyEndTime,
        periodDurationMinutes: Number(periodDuration),
        maxPeriodsPerDay: Number(maxPeriodsPerDay),
        breakIntervals: [
          { name: 'Morning Break', startTime: '10:15', endTime: '10:35', isLunch: false },
          { name: 'Lunch Interval', startTime: '12:15', endTime: '13:00', isLunch: true },
        ],
        subjectAllocations: allocations,
      };

      const res = await api.timetable.generate(payload);
      if (res?.data) {
        setGenerationResult(res.data);
        setActiveTab('preview');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Automated generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish to production DB
  const handlePublishTimetable = async () => {
    if (!generationResult || !generationResult.generatedSlots) return;

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const payload = {
        academicYearId: academicYear,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        slots: generationResult.generatedSlots,
        configData: {
          workingDays,
          dailyStartTime,
          dailyEndTime,
          periodDurationMinutes: Number(periodDuration),
          maxPeriodsPerDay: Number(maxPeriodsPerDay),
          breakIntervals: [
            { name: 'Morning Break', startTime: '10:15', endTime: '10:35', isLunch: false },
            { name: 'Lunch Interval', startTime: '12:15', endTime: '13:00', isLunch: true },
          ],
          subjectAllocations: allocations,
        },
      };

      await api.timetable.publish(payload);
      if (onTimetablePublished) {
        onTimetablePublished();
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Publishing timetable failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Automated Timetable Generation Engine
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Constraint-Aware
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatic schedule formulation, double-period lab placement, and teacher/room collision protection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                1. Configuration & Rules
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={!generationResult}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>2. Schedule Matrix</span>
                {generationResult && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Generation / Constraint Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Target Class & Section Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Target Class</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      const cls = availableClasses.find((c) => c.id === e.target.value);
                      if (cls && cls.sections.length > 0) {
                        setSelectedSectionId(cls.sections[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.program || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Target Section</label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    {activeSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.capacity || 40} capacity)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Academic Cycle</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="ay-2026">2026 - 2027 (Current)</option>
                    <option value="ay-2025">2025 - 2026</option>
                  </select>
                </div>
              </div>

              {/* Working Hours & Daily Periods Grid */}
              <div className="bg-white dark:bg-slate-800/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Working Schedule & Period Constraints
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Daily Start Time</label>
                    <input
                      type="time"
                      value={dailyStartTime}
                      onChange={(e) => setDailyStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Daily End Time</label>
                    <input
                      type="time"
                      value={dailyEndTime}
                      onChange={(e) => setDailyEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Period Length (Mins)</label>
                    <input
                      type="number"
                      value={periodDuration}
                      onChange={(e) => setPeriodDuration(e.target.value)}
                      min="30"
                      max="90"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Max Periods / Day</label>
                    <input
                      type="number"
                      value={maxPeriodsPerDay}
                      onChange={(e) => setMaxPeriodsPerDay(e.target.value)}
                      min="3"
                      max="8"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Working Days Checkboxes */}
                <div>
                  <label className="block text-slate-500 text-xs font-medium mb-1.5">Operating Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysList.map((d) => {
                      const active = workingDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Fixed Breaks Notice */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Enforced Intervals: <strong>Morning Recess (10:15 - 10:35)</strong> and <strong>Lunch Break (12:15 - 13:00)</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Locked from Teaching
                  </span>
                </div>
              </div>

              {/* Subject Allocations & Workload Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Subject Workload Allocations
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Configure weekly theory & practical hours. Lab practicals automatically reserve consecutive double periods.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAllocationRow}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Allocation Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Assigned Teacher</th>
                        <th className="py-2.5 px-3">Classroom / Lab</th>
                        <th className="py-2.5 px-2 text-center">Theory / Wk</th>
                        <th className="py-2.5 px-2 text-center">Practical / Wk</th>
                        <th className="py-2.5 px-3 text-center">Double Period</th>
                        <th className="py-2.5 px-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allocations.map((alloc, idx) => (
                        <tr key={alloc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          {/* Subject Selector */}
                          <td className="py-2.5 px-3">
                            <select
                              value={alloc.subjectId}
                              onChange={(e) => handleUpdateAllocation(idx, 'subjectId', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-800 dark:text-white"
                            >
                              {availableSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.code})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Teacher Selector */}
                          <td className="py-2.5 px-3">
                            <select
                              value={alloc.staffId}
                              onChange={(e) => handleUpdateAllocation(idx, 'staffId', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            >
                              {availableStaff.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.name} ({st.department})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Room */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={alloc.room}
                              onChange={(e) => handleUpdateAllocation(idx, 'room', e.target.value)}
                              placeholder="e.g. IT Lab Beta"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </td>

                          {/* Theory Hours */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="6"
                              value={alloc.weeklyTheory}
                              onChange={(e) => handleUpdateAllocation(idx, 'weeklyTheory', e.target.value)}
                              className="w-14 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:text-white"
                            />
                          </td>

                          {/* Practical Hours */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="6"
                              value={alloc.weeklyPractical}
                              onChange={(e) => handleUpdateAllocation(idx, 'weeklyPractical', e.target.value)}
                              className="w-14 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:text-white"
                            />
                          </td>

                          {/* Double Period Checkbox */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={alloc.isDoublePeriod}
                              onChange={(e) => handleUpdateAllocation(idx, 'isDoublePeriod', e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Delete */}
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveAllocation(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Generated Matrix Preview */}
          {activeTab === 'preview' && generationResult && (
            <div className="space-y-5">
              {/* Outcome Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                generationResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    generationResult.success ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {generationResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {generationResult.success
                        ? 'Optimal Zero-Conflict Schedule Generated'
                        : `${generationResult.totalUnscheduled} Sessions Could Not Fit Concurrently`}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Total Slots: <strong>{generationResult.totalScheduled} periods</strong> scheduled across {workingDays.length} working days.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Warnings List if any */}
              {generationResult.warnings && generationResult.warnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 text-xs text-amber-900 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Automated Scheduler Warnings:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {generationResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weekly Grid */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 w-44">Time / Period</th>
                      {workingDays.map((d) => (
                        <th key={d} className="py-3 px-3 min-w-[150px]">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {generationResult.dailyTimeSlots.map((timeSlot, pIdx) => {
                      if (timeSlot.isBreak) {
                        return (
                          <tr key={`break-${pIdx}`} className="bg-slate-100/80 dark:bg-slate-800/60 font-semibold">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                              {timeSlot.periodName}
                            </td>
                            <td colSpan={workingDays.length} className="py-2.5 px-4 text-center text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                              ☕ {timeSlot.name} ({timeSlot.timeSlot})
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={`period-${pIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 font-semibold border-r border-slate-100 dark:border-slate-800">
                            {timeSlot.periodName}
                          </td>
                          {workingDays.map((d) => {
                            const daySlots = generationResult.scheduleMatrix[d] || [];
                            const slot = daySlots.find((s) => s.periodName === timeSlot.periodName);

                            if (!slot || slot.isVacant) {
                              return (
                                <td key={`${d}-${pIdx}`} className="py-2 px-2 border-r border-slate-100 dark:border-slate-800">
                                  <div className="h-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                                    Vacant Slot
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td key={`${d}-${pIdx}`} className="py-2 px-2 border-r border-slate-100 dark:border-slate-800">
                                <div className={`p-2 rounded-xl border ${slot.colorTag || 'bg-indigo-50 text-indigo-700 border-indigo-200'} space-y-1 shadow-sm`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px] truncate">{slot.subjectName}</span>
                                    {slot.isDoublePeriod && (
                                      <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-white/70 dark:bg-black/30">
                                        2x Lab
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] opacity-90 truncate flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5 shrink-0" />
                                    {slot.staffName}
                                  </p>
                                  <p className="text-[9px] opacity-75 truncate flex items-center gap-1 font-mono">
                                    <Building className="w-2.5 h-2.5 shrink-0" />
                                    {slot.room}
                                  </p>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'config' ? (
              <button
                type="button"
                onClick={handleGenerateTimetable}
                disabled={isGenerating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Generate Automated Timetable</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Back to Config
                </button>
                <button
                  type="button"
                  onClick={handlePublishTimetable}
                  disabled={isPublishing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Publish to Production Schedule</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
