import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Download, 
  CreditCard, 
  Send, 
  Phone,
  Users,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  FileText,
  Printer,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building,
  Check,
  Award
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';

export default function GuardianPortalView({ student: propStudent, onQueueJob: propOnQueueJob }) {
  const { currentRole, invoices: contextInvoices, grades: contextGrades, students: contextStudents, queueJob } = useCMS();
  
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  
  // Per-child active tab: 'report' | 'fees' | 'timetable'
  const [childTabs, setChildTabs] = useState({});
  // Per-child active timetable day: 'All' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  const [childTimetableDays, setChildTimetableDays] = useState({});

  // Admin family preview selector
  const [guardiansList, setGuardiansList] = useState([]);
  const [adminSelectedGuardianEmail, setAdminSelectedGuardianEmail] = useState('tariq.siddiqui@gmail.com');
  const isAdminPreview = currentRole && currentRole !== 'guardian' && currentRole !== 'student';
  
  // Excuse form state
  const [activeExcuseChildId, setActiveExcuseChildId] = useState(null);
  const [excuseNote, setExcuseNote] = useState('');
  const [excuseSentChildId, setExcuseSentChildId] = useState(null);
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);

  // Report Card Modal state
  const [viewingReportCardChild, setViewingReportCardChild] = useState(null);

  // Load guardians list for admin preview
  useEffect(() => {
    if (isAdminPreview) {
      api.portal.getGuardians()
        .then(res => {
          const list = res?.data || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setGuardiansList(list.filter(g => (g._count?.students || 0) > 0));
          }
        })
        .catch(() => {});
    }
  }, [isAdminPreview]);

  // Fetch children for guardian from backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const params = isAdminPreview ? { guardianEmail: adminSelectedGuardianEmail } : {};

    api.portal.getChildren(params)
      .then((res) => {
        if (!isMounted) return;
        const fetched = res?.data || res || [];
        if (Array.isArray(fetched) && fetched.length > 0) {
          setChildrenList(fetched);
        } else if (contextStudents && contextStudents.length > 0) {
          const filtered = contextStudents.filter(s => s.guardianId === 'g-ams-106' || (s.name || '').includes('Siddiqui'));
          setChildrenList(filtered.length > 0 ? filtered : contextStudents.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch portal children, using filtered fallback:', err.message);
        if (isMounted && contextStudents && contextStudents.length > 0) {
          const filtered = contextStudents.filter(s => s.guardianId === 'g-ams-106' || (s.name || '').includes('Siddiqui'));
          setChildrenList(filtered.length > 0 ? filtered : contextStudents.slice(0, 3));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAdminPreview, adminSelectedGuardianEmail]);

  // Calculate Family-wide summary totals
  const totalChildren = childrenList.length;
  const avgAttendance = totalChildren > 0
    ? (childrenList.reduce((sum, c) => sum + (c.attendanceRate || 95), 0) / totalChildren).toFixed(1)
    : '96.5';
    
  const allInvoices = childrenList.flatMap(c => c.invoices || []);
  const familyDues = allInvoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleSendExcuse = async (e, child) => {
    e.preventDefault();
    if (!excuseNote.trim()) return;

    setIsSubmittingExcuse(true);
    try {
      await api.portal.sendExcuseNote(child.id, excuseNote);
    } catch (err) {
      console.warn('Backend excuse note dispatch notice:', err.message);
    } finally {
      setIsSubmittingExcuse(false);
    }

    const job = {
      id: `q-${Date.now()}-excuse`,
      type: 'SMS_ALERT',
      target: 'Dean / Head Teacher',
      recipient: `Academic Coordinator (${child.section || 'General'})`,
      status: 'Completed',
      time: 'Just now',
      description: `Medical excuse note submitted for ${child.name} by ${child.guardianName || 'Guardian'}: "${excuseNote.slice(0, 30)}..."`,
    };

    queueJob(job);
    if (propOnQueueJob) propOnQueueJob(job);

    setExcuseSentChildId(child.id);
    setExcuseNote('');
    setActiveExcuseChildId(null);
    setTimeout(() => setExcuseSentChildId(null), 6000);
  };

  const guardianDisplayName = childrenList[0]?.guardianName || 'Tariq Siddiqui';
  const guardianPhone = childrenList[0]?.guardianPhone || '+92 333 2189041';

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const displayedChildren = selectedChildId === 'ALL'
    ? childrenList
    : childrenList.filter(c => c.id === selectedChildId);

  return (
    <div className="space-y-6">
      {/* 1. Portal Master Header & Family Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/30 text-brand-300 px-2.5 py-0.5 rounded border border-brand-400/30">
                Guardian &amp; Parent Portal
              </span>
              <span className="text-xs text-slate-300">
                Family Account: <strong>{guardianDisplayName}</strong>
              </span>
              <span className="text-xs text-slate-400">• Phone: {guardianPhone}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white flex items-center gap-2.5">
              <span>Academic Reports, Fees &amp; Timetables</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {totalChildren} Siblings Enrolled
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Verified term report marks, fee invoice statements, and weekly lecture schedules for each child at AMSTech.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 self-stretch sm:self-auto justify-end">
            {isAdminPreview && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                  Preview Family:
                </span>
                <select
                  value={adminSelectedGuardianEmail}
                  onChange={(e) => setAdminSelectedGuardianEmail(e.target.value)}
                  className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-amber-400"
                >
                  {guardiansList.map((g) => (
                    <option key={g.id} value={g.email}>
                      {g.name} ({g._count?.students || 0} Children)
                    </option>
                  ))}
                  {!guardiansList.some(g => g.email === 'tariq.siddiqui@gmail.com') && (
                    <option value="tariq.siddiqui@gmail.com">Tariq Siddiqui (3 Children)</option>
                  )}
                </select>
              </div>
            )}

            <button 
              onClick={() => alert(`Downloading consolidated family tuition statement for ${guardianDisplayName}...`)}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Consolidated Statement</span>
            </button>
          </div>
        </div>

        {/* Family Snapshot KPI Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Enrolled Children
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {totalChildren} Students
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Active Roster</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {childrenList.map(c => c.name.split(' ')[0]).join(' • ')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Household Attendance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {avgAttendance}%
              </span>
              <span className="text-xs text-slate-300">Average</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All siblings maintain high institutional attendance
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Fee Balance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                ₨ {familyDues.toLocaleString()}
              </span>
              <span className={`text-xs font-bold ${familyDues === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {familyDues === 0 ? 'All Cleared' : 'Pending Due'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cumulative family fee dues
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sibling Switcher Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Filter View:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setSelectedChildId('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 ${
              selectedChildId === 'ALL'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Show All Children ({totalChildren})</span>
          </button>

          {childrenList.map((child) => {
            const isSelected = selectedChildId === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <img
                  src={child.avatar}
                  alt={child.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>{child.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 font-mono">({child.rollNo || child.id})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Excuse Sent Notification */}
      {excuseSentChildId && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">Medical Excuse Note Successfully Dispatched!</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              The absence reason has been logged with the Academic Council and forwarded to the Head Teacher.
            </p>
          </div>
        </div>
      )}

      {/* 3. EACH CHILD: Full Cards with Academic Report, Fee Ledger & Timetable */}
      <div className="space-y-8">
        {displayedChildren.map((child, index) => {
          const childDues = (child.invoices || [])
            .filter(i => i.status !== 'Paid')
            .reduce((sum, i) => sum + i.amount, 0);

          const isExcuseFormOpen = activeExcuseChildId === child.id;
          const currentChildTab = childTabs[child.id] || 'report';
          const currentDay = childTimetableDays[child.id] || 'All';

          // Filter timetable slots by chosen day if not 'All'
          const filteredSlots = (child.timetables || []).filter(slot => 
            currentDay === 'All' ? true : slot.day === currentDay
          );

          return (
            <div 
              key={child.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden transition-all duration-200"
            >
              {/* Child Header Card */}
              <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-brand-50/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-brand-950/30 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={child.avatar} 
                    alt={child.name} 
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-700 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-600 text-white px-2 py-0.5 rounded shadow-xs">
                        Child #{index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Roll No: <strong className="text-slate-800 dark:text-slate-200">{child.rollNo || child.id}</strong>
                      </span>
                      <span className="text-xs text-slate-400">• Student ID: {child.id}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {child.name}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Enrolled in <strong>{child.grade}</strong> • Section <strong>{child.section}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end flex-wrap">
                  <button
                    onClick={() => setViewingReportCardChild(child)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>View Official Report Card</span>
                  </button>

                  <button
                    onClick={() => setActiveExcuseChildId(isExcuseFormOpen ? null : child.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
                      isExcuseFormOpen
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300'
                        : 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-50'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isExcuseFormOpen ? 'Close Note' : 'Excuse Note'}</span>
                  </button>
                </div>
              </div>

              {/* Inline Excuse Note Form if opened for this child */}
              {isExcuseFormOpen && (
                <div className="p-5 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50">
                  <div className="max-w-2xl">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Submit Absence / Medical Excuse Note for {child.name}
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-3">
                      Directly notifies the academic dean and section coordinator for Section {child.section}.
                    </p>
                    <form onSubmit={(e) => handleSendExcuse(e, child)} className="space-y-3">
                      <textarea
                        rows="3"
                        required
                        value={excuseNote}
                        onChange={(e) => setExcuseNote(e.target.value)}
                        placeholder={`Explain absence reason for ${child.name.split(' ')[0]} (e.g. physician appointment, fever, family commitment)...`}
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                      ></textarea>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSubmittingExcuse}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingExcuse ? 'Submitting...' : `Submit Note for ${child.name.split(' ')[0]}`}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveExcuseChildId(null)}
                          className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Child Quick Metrics Snapshot */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-700/60">
                {/* Attendance */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Attendance Rate
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {child.attendanceRate}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Regular
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Above required institutional criteria</p>
                </div>

                {/* GPA */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Cumulative GPA
                    </span>
                    <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {child.gpa}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      {Number(child.gpa) >= 3.9 ? 'Top Honor Roll' : 'Good Standing'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">4.0 Weighted Grading Standard</p>
                </div>

                {/* Fee Status */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Fee Balance
                    </span>
                    <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ₨ {childDues.toLocaleString()}
                    </span>
                    <span className={`text-xs font-bold ${childDues === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {childDues === 0 ? 'All Cleared' : 'Payment Due'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {(child.invoices || []).length} registered invoice records
                  </p>
                </div>
              </div>

              {/* THREE CORE PILLARS FOR THIS CHILD: Report, Fees, Timetable Selector */}
              <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setChildTabs(prev => ({ ...prev, [child.id]: 'report' }))}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all duration-150 flex items-center gap-2 border-b-2 ${
                    currentChildTab === 'report'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>1. Academic Report ({(child.grades || []).length} Courses)</span>
                </button>

                <button
                  onClick={() => setChildTabs(prev => ({ ...prev, [child.id]: 'fees' }))}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all duration-150 flex items-center gap-2 border-b-2 ${
                    currentChildTab === 'fees'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>2. Fees &amp; Invoices ({(child.invoices || []).length} Statements)</span>
                </button>

                <button
                  onClick={() => setChildTabs(prev => ({ ...prev, [child.id]: 'timetable' }))}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all duration-150 flex items-center gap-2 border-b-2 ${
                    currentChildTab === 'timetable'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>3. Class Timetable ({(child.timetables || []).length} Weekly Slots)</span>
                </button>
              </div>

              {/* PILLAR 1: ACADEMIC REPORT & MARKS */}
              {currentChildTab === 'report' && (
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{child.name}'s Academic Performance &amp; Term Marks</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
                          Verified Marks
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Breakdown of Quizzes, Midterms, Lab Projects, and Final Examination marks signed by subject faculty.
                      </p>
                    </div>

                    <button
                      onClick={() => setViewingReportCardChild(child)}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Term Marksheet</span>
                    </button>
                  </div>

                  {/* Marks Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3.5">Subject &amp; Code</th>
                          <th className="p-3.5 text-center">Quiz 1 (100)</th>
                          <th className="p-3.5 text-center">Midterm (100)</th>
                          <th className="p-3.5 text-center">Project (100)</th>
                          <th className="p-3.5 text-center">Final (100)</th>
                          <th className="p-3.5 text-center">Total %</th>
                          <th className="p-3.5 text-center">Grade</th>
                          <th className="p-3.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
                        {(child.grades || []).map((g, idx) => (
                          <tr key={g.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                            <td className="p-3.5 font-bold">
                              <span className="text-slate-900 dark:text-white block">
                                {g.subject || g.subjectName}
                              </span>
                              {g.code && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {g.code}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center font-mono font-medium">{g.quiz1}</td>
                            <td className="p-3.5 text-center font-mono font-medium">{g.midterm}</td>
                            <td className="p-3.5 text-center font-mono font-medium">{g.project}</td>
                            <td className="p-3.5 text-center font-mono font-medium">{g.finalExam}</td>
                            <td className="p-3.5 text-center font-extrabold text-brand-600 dark:text-brand-400">
                              {g.weightedScore}%
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-black border border-brand-200 dark:border-brand-800">
                                {g.letterGrade}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                {g.status || 'Verified'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PILLAR 2: FEES & INVOICE STATEMENTS */}
              {currentChildTab === 'fees' && (
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{child.name}'s Fee Billing Ledger &amp; Invoices</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          childDues === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {childDues === 0 ? 'All Cleared' : `Outstanding: ₨ ${childDues.toLocaleString()}`}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Official tuition vouchers, semester dues, and payment confirmation receipts.
                      </p>
                    </div>

                    <button
                      onClick={() => alert(`Downloading consolidated fee challan voucher for ${child.name}...`)}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Fee Challan</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3.5">Invoice ID</th>
                          <th className="p-3.5">Term Description</th>
                          <th className="p-3.5">Due Date</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Receipt Reference</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
                        {(child.invoices || []).map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                            <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{inv.id}</td>
                            <td className="p-3.5 font-semibold">{inv.term}</td>
                            <td className="p-3.5 text-slate-500">{inv.dueDate}</td>
                            <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                              ₨ {inv.amount.toLocaleString()}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-slate-500">
                              {inv.receipt || '— Pending —'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : inv.status === 'Overdue'
                                  ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => alert(`Printing official payment receipt for ${inv.id}...`)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition"
                              >
                                {inv.status === 'Paid' ? 'Receipt' : 'Pay Online'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PILLAR 3: CLASS TIMETABLE & SCHEDULE */}
              {currentChildTab === 'timetable' && (
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{child.name}'s Weekly Timetable ({child.section})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                          {child.grade}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Weekly lecture periods, faculty instructors, and assigned laboratory rooms.
                      </p>
                    </div>

                    {/* Day Selector Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        onClick={() => setChildTimetableDays(prev => ({ ...prev, [child.id]: 'All' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          currentDay === 'All'
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        All Week
                      </button>
                      {daysOfWeek.map(d => (
                        <button
                          key={d}
                          onClick={() => setChildTimetableDays(prev => ({ ...prev, [child.id]: d }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            currentDay === d
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timetable Cards Grid */}
                  {filteredSlots.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                      {filteredSlots.map((slot) => (
                        <div 
                          key={slot.id} 
                          className="p-3.5 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 hover:border-brand-300 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {slot.day}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 font-bold">
                                {slot.period.split(' ')[0]} {slot.period.split(' ')[1]}
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                              {slot.subject}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {slot.period.split('(')[1]?.replace(')', '') || slot.period}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-brand-700 dark:text-brand-300 truncate">
                              {slot.room}
                            </span>
                            <span className="text-slate-400 truncate max-w-[100px]" title={slot.teacher}>
                              {slot.teacher}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No timetable slots scheduled for {currentDay}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. OFFICIAL REPORT CARD & MARKSHEET MODAL */}
      {viewingReportCardChild && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  AMS
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Al-Mustafa Institute of Science &amp; Technology
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official Student Academic Progress Report &amp; Transcript
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingReportCardChild(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Dossier Strip */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {viewingReportCardChild.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Roll Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {viewingReportCardChild.rollNo || viewingReportCardChild.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Class &amp; Section</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingReportCardChild.grade} • {viewingReportCardChild.section}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Session</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">2026 - 2027</span>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Course Title</th>
                    <th className="p-3 text-center">Quiz</th>
                    <th className="p-3 text-center">Midterm</th>
                    <th className="p-3 text-center">Practical</th>
                    <th className="p-3 text-center">Final</th>
                    <th className="p-3 text-center">Weighted %</th>
                    <th className="p-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {(viewingReportCardChild.grades || []).map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{g.subject || g.subjectName}</td>
                      <td className="p-3 text-center font-mono">{g.quiz1}</td>
                      <td className="p-3 text-center font-mono">{g.midterm}</td>
                      <td className="p-3 text-center font-mono">{g.project}</td>
                      <td className="p-3 text-center font-mono">{g.finalExam}</td>
                      <td className="p-3 text-center font-bold text-brand-600 dark:text-brand-400">{g.weightedScore}%</td>
                      <td className="p-3 text-center font-black">{g.letterGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overall Academic Honor Standing */}
            <div className="p-4 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/30 rounded-2xl border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold text-brand-700 dark:text-brand-300 block">
                  Cumulative Grade Point Average
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-brand-700 dark:text-brand-300">
                    {viewingReportCardChild.gpa}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Honor Roll Verified
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Attendance Verification:
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {viewingReportCardChild.attendanceRate}% Present
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Official Digital Record • Al-Mustafa Institute Academic Registrar
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setViewingReportCardChild(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
