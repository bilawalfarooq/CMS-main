import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building,
  Users,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Layers,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { api } from '../../services/apiClient';
import TimetableGeneratorModal from '../timetable/TimetableGeneratorModal';

export default function ClassDetailsView({
  classId,
  onBack,
  onEditClass,
  currentRole,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sections' | 'subjects' | 'teachers' | 'students' | 'timetable' | 'history'
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Section Create/Edit modal state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    name: '',
    code: '',
    capacity: 40,
    room: 'Room 204',
    operatingHours: '08:30 - 14:00',
    status: 'Active',
  });

  // Timetable Generator Modal
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Available metadata for generator
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [res, subsRes, staffRes] = await Promise.all([
        api.classes.get(classId),
        api.academics.getSubjects().catch(() => ({ data: [] })),
        api.staff.list({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      if (res?.data) {
        setProfile(res.data);
      }
      if (subsRes?.data) setAvailableSubjects(subsRes.data);
      if (staffRes?.data) setAvailableStaff(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data?.items || []);
    } catch (err) {
      console.error('Failed to load class profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [classId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Class profile could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Class List
        </button>
      </div>
    );
  }

  const { classInfo, summaryCards, sections, subjects, teachers, students, timetable, history } = profile;

  // Filter students based on search and section
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesSec = selectedSectionFilter === 'All' || s.sectionName === selectedSectionFilter;
    return matchesSearch && matchesSec;
  });

  // Section modal handlers
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setSectionForm({
      name: '',
      code: '',
      capacity: 40,
      room: 'Lecture Room 204',
      operatingHours: '08:30 - 14:00',
      status: 'Active',
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec) => {
    setEditingSection(sec);
    setSectionForm({
      name: sec.name,
      code: sec.code,
      capacity: sec.capacity,
      room: sec.room,
      operatingHours: sec.operatingHours,
      status: sec.status,
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.classes.updateSection(editingSection.id, sectionForm);
        setActionNotice(`Section "${sectionForm.name}" updated successfully.`);
      } else {
        await api.classes.createSection(classId, sectionForm);
        setActionNotice(`Section "${sectionForm.name}" added successfully.`);
      }
      setIsSectionModalOpen(false);
      loadProfile();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteSection = async (sec) => {
    if (!confirm(`Are you sure you want to remove section "${sec.name}"?`)) return;
    try {
      const res = await api.classes.deleteSection(sec.id);
      setActionNotice(res?.message || 'Section updated.');
      loadProfile();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to remove section');
    }
  };

  const tabs = [
    { id: 'overview', label: '1. Overview', count: null },
    { id: 'sections', label: '2. Sections', count: sections.length },
    { id: 'subjects', label: '3. Subjects', count: subjects.length },
    { id: 'teachers', label: '4. Faculty & Workload', count: teachers.length },
    { id: 'students', label: '5. Enrolled Students', count: students.length },
    { id: 'timetable', label: '6. Master Timetable', count: timetable.slotsCount },
    { id: 'history', label: '7. Audit History', count: history.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition"
              title="Return to Classes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {classInfo.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {classInfo.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  classInfo.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {classInfo.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Program: <strong>{classInfo.program}</strong> • Department: <strong>{classInfo.department}</strong> • Coordinator: <strong>{classInfo.headTeacher}</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAddSection}
              className="px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Section</span>
            </button>

            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Timetable</span>
            </button>

            <button
              onClick={() => onEditClass && onEditClass(classInfo)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Edit Class Specifications"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sections</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryCards.totalSections}</p>
          <span className="text-[10px] text-slate-500">Allocated cohorts</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Students</span>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{summaryCards.enrolledStudents}</p>
          <span className="text-[10px] text-slate-500">Cap: {summaryCards.totalCapacity} ({summaryCards.utilizationPercentage}% full)</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Subjects</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryCards.totalSubjects}</p>
          <span className="text-[10px] text-slate-500">Course modules</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Faculty</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryCards.assignedTeachersCount}</p>
          <span className="text-[10px] text-slate-500">Teaching staff</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teaching Hours</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryCards.weeklyTeachingHours} hrs</p>
          <span className="text-[10px] text-slate-500">Weekly contact load</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rooms & Labs</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryCards.allocatedRoomsCount}</p>
          <span className="text-[10px] text-slate-500">
            {summaryCards.conflictsCount === 0 ? 'Zero collisions' : `${summaryCards.conflictsCount} conflicts`}
          </span>
        </div>
      </div>

      {/* 7 Tabs Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1.5 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Academic Class Specifications
            </h3>
            <div className="grid grid-cols-2 gap-3 divide-y sm:divide-y-0">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Class Name</span>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{classInfo.name}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Official Code</span>
                <p className="font-bold text-slate-800 dark:text-white font-mono text-sm">{classInfo.code}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Program Domain</span>
                <p className="font-bold text-slate-800 dark:text-white">{classInfo.program}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                <p className="font-bold text-slate-800 dark:text-white">{classInfo.department}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Academic Duration</span>
                <p className="font-bold text-slate-800 dark:text-white">{classInfo.duration}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Semester / Level</span>
                <p className="font-bold text-slate-800 dark:text-white">{classInfo.semester}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Leadership & Section Allocation
            </h3>
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {classInfo.headTeacher?.charAt(0) || 'C'}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Class Coordinator / Head Teacher</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{classInfo.headTeacher}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Responsible for terminal syllabus completion, attendance verifications, and section timetable synchronization.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500">Section Distribution Breakdown:</span>
              <div className="space-y-2">
                {sections.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{s.name}</span>
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">({s.code})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{s.enrolledCount} / {s.capacity} students</span>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((s.enrolledCount / s.capacity) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sections */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Sections Directory</h3>
              <p className="text-xs text-slate-500">Manage cohorts, student capacity quotas, and assigned facilities.</p>
            </div>
            <button
              onClick={handleOpenAddSection}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{sec.name}</h4>
                    <span className="font-mono text-[10px] text-slate-400">{sec.code}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sec.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {sec.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Capacity: <strong>{sec.enrolledCount} / {sec.capacity} Students</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Default Room: <strong>{sec.room}</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Operating Hours: <strong>{sec.operatingHours}</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Scheduled Slots: <strong>{sec.scheduledSlotsCount || 0} periods</strong></span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenEditSection(sec)}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Edit Section
                  </button>
                  <button
                    onClick={() => handleDeleteSection(sec)}
                    className="text-rose-600 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Subjects */}
      {activeTab === 'subjects' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-3 text-center">Theory Hrs</th>
                  <th className="py-3 px-3 text-center">Practical Hrs</th>
                  <th className="py-3 px-4">Facility Requirement</th>
                  <th className="py-3 px-4">Allocated Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-white">
                      {sub.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {sub.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {sub.department}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-indigo-600">
                      {sub.theoryHours}h
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-purple-600">
                      {sub.practicalHours}h
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {sub.requiredRoomType}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-white">
                      {sub.primaryTeacher}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Faculty & Workload */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{t.name}</h4>
                  <p className="text-xs text-slate-500">{t.role} • {t.department}</p>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {t.weeklyHours} Hrs/Wk
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p>Assigned Sections: <strong>{t.assignedSections.join(', ') || 'Class Wide'}</strong></p>
                <p>Courses: <strong>{t.assignedSubjects.join(', ')}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Enrolled Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name or roll..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Filter Section:</span>
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="All">All Sections ({students.length})</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.name}>{sec.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Allocated Section</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">GPA</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-white">
                        {st.id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {st.rollNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {st.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {st.sectionName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        {st.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {st.gpa}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Master Timetable */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled Class Matrix</h3>
              <p className="text-xs text-slate-500">Live operational timetable with period allocations across sections.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Timetable</span>
              </button>
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-Generate</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {timetable.slots.map((sl) => (
                <div
                  key={sl.id}
                  className={`p-3.5 rounded-xl border ${sl.colorTag || 'bg-indigo-50 text-indigo-700 border-indigo-200'} space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{sl.subjectName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 dark:bg-black/40">
                      {sl.sectionName}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{sl.dayOfWeek} — {sl.periodName}</span>
                  </p>
                  <p className="text-[10px] opacity-85 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{sl.teacherName} ({sl.room})</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: History / Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">Class Modification Trail</h3>
            <p className="text-[11px] text-slate-500">Immutable change log tracking class edits, section creations, and timetable publications.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {history.map((h) => (
              <div key={h.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 dark:text-white">{h.action}</span>
                  <p className="text-slate-600 dark:text-slate-300">{h.entity}</p>
                </div>
                <div className="text-right space-y-0.5 font-mono text-[11px] text-slate-400">
                  <p>{h.actor}</p>
                  <p>{new Date(h.timestamp).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} (PKT)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Create/Edit Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {editingSection ? `Edit Section: ${editingSection.name}` : `Create New Section for ${classInfo.name}`}
              </h3>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10-D (Commerce)"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Section Code</label>
                <input
                  type="text"
                  placeholder="e.g. SEC-10D"
                  value={sectionForm.code}
                  onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Student Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Classroom / Lab</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={sectionForm.room}
                    onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={sectionForm.operatingHours}
                    onChange={(e) => setSectionForm({ ...sectionForm, operatingHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Status</label>
                  <select
                    value={sectionForm.status}
                    onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-3 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable Generator Modal */}
      {isGeneratorOpen && (
        <TimetableGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          initialClassId={classId}
          initialSectionId={sections[0]?.id}
          availableClasses={[classInfo]}
          availableSubjects={availableSubjects}
          availableStaff={availableStaff}
          onTimetablePublished={() => {
            loadProfile();
            setActiveTab('timetable');
            setActionNotice('Timetable successfully generated and published!');
            setTimeout(() => setActionNotice(null), 4000);
          }}
        />
      )}
    </div>
  );
}
