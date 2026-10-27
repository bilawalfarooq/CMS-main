import React, { useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Phone,
  MapPin,
  Heart,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  CreditCard,
  Download,
  IdCard,
  History,
  UserCheck,
  X
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export default function StudentProfileView({ studentId, onBack }) {
  const {
    students,
    attendance,
    grades,
    documents,
    invoices,
    updateStudentStatus,
    openStudentIdCard,
    closeStudentProfile,
    currentRole
  } = useCMS();

  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Active');
  const [statusReason, setStatusReason] = useState('');

  // Find the target student
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Student record not found for ID '{studentId}'.</p>
        <button
          onClick={onBack || closeStudentProfile}
          className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  // Linked records
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentGrades = grades.filter(g => g.studentId === student.id);
  const studentDocuments = documents.filter(d => d.studentId === student.id);
  const studentInvoices = invoices.filter(inv => inv.studentId === student.id);

  const handleStatusChange = (e) => {
    e.preventDefault();
    updateStudentStatus(student.id, newStatus, statusReason);
    setShowStatusModal(false);
    setStatusReason('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Bio', icon: GraduationCap },
    { id: 'guardians', label: 'Guardians & Contacts', icon: Phone },
    { id: 'academics', label: 'Enrollment & History', icon: History, count: student.academicHistory?.length },
    { id: 'attendance', label: 'Attendance Telemetry', icon: CheckCircle2 },
    { id: 'grades', label: 'Grades & Report Card', icon: Award, count: studentGrades.length },
    { id: 'documents', label: 'Document Vault', icon: FolderArchive, count: studentDocuments.length },
    { id: 'fees', label: 'Tuition & Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBack || closeStudentProfile}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Directory</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Print ID Card Badge */}
          <button
            onClick={() => openStudentIdCard(student)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <IdCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Print Student ID</span>
          </button>

          {/* Download Transcript */}
          <button
            onClick={() => alert(`Generating official term transcript PDF for ${student.name} (${student.id})...`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download Transcript</span>
          </button>

          {/* Status Changer */}
          {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
            <button
              onClick={() => {
                setNewStatus(student.status);
                setShowStatusModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/30 transition active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Update Status</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-2xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/30 text-brand-300 px-2.5 py-0.5 rounded-md border border-brand-400/30">
                  {student.grade} • {student.section}
                </span>
                <span className="font-mono text-xs text-slate-300">Roll: {student.rollNo || 'N/A'}</span>
                <span className="text-xs text-slate-400">• ID: {student.id}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">{student.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">{student.email}</p>

              <div className="mt-2.5 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  student.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : student.status === 'On-Leave'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {student.status}
                </span>

                {student.anomalyAlert && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Attendance Anomaly</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick KPI stats in Hero */}
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full md:w-auto justify-around">
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cumulative GPA</span>
              <p className="text-2xl font-black text-white">{student.gpa !== null && student.gpa !== undefined ? student.gpa : '—'}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Scale 4.0</span>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Attendance</span>
              <p className="text-2xl font-black text-emerald-400">{student.attendanceRate !== null && student.attendanceRate !== undefined ? `${student.attendanceRate}%` : '—'}</p>
              <span className="text-[10px] text-slate-300">Term 1 Active</span>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Documents</span>
              <p className="text-2xl font-black text-indigo-300">{studentDocuments.length}</p>
              <span className="text-[10px] text-slate-300">Verified</span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1 overflow-x-auto text-xs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Bio */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Details Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                Student Identity & Placement Records
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Official Legal Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.name}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Unique System Identifier</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{student.id}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Section Roll Number</span>
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">{student.rollNo || 'Not Assigned'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Active Academic Year</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.academicYear || '2026 - 2027'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date of Birth & Gender</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{student.dob} ({student.gender})</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Blood Group</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{student.bloodGroup || 'Not Recorded'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Admission Enrollment Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{student.admissionDate || '2024-08-15'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Previous School Attended</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{student.previousSchool || 'Apex Junior Academy'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Permanent Residential Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {student.address}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Guardian & Contact Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600" />
                Primary Emergency Channel
              </h3>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Primary Guardian:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{student.guardianName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">SMS Alert Route:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{student.guardianPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{student.guardianEmail}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span className="font-bold">Hospital Emergency:</span>
                  <span className="font-mono font-bold">{student.emergencyContact}</span>
                </div>
              </div>

              <div className="p-4 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800/60 text-xs text-brand-900 dark:text-brand-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  SMS & Email Broadcast Ready
                </p>
                <p className="text-[11px] text-brand-800 dark:text-brand-300">
                  Absent alerts and official notifications are dispatched to this guardian contact channel.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guardians & Contacts */}
      {activeTab === 'guardians' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Guardian Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600" />
                Primary Legal Guardian
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Authorized Pickup
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Guardian Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.guardianName}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile Contact (SMS Notifications)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{student.guardianPhone}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Email Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.guardianEmail}</span>
              </div>
            </div>
          </div>

          {/* Secondary Guardian & Emergency Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Secondary Guardian & Emergency Hospital
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                Secondary Contact
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Secondary Guardian Name & Relation</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {student.secondaryGuardianName ? `${student.secondaryGuardianName} (${student.secondaryGuardianRelation || 'Relation'})` : 'Not recorded'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Secondary Phone</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {student.secondaryGuardianPhone || 'Not recorded'}
                </span>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs">
                <span className="text-rose-600 dark:text-rose-400 text-[10px] uppercase font-bold block">Hospital / Emergency Hotline</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 text-sm">{student.emergencyContact}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Academics & History */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-600" />
                  Academic Enrollment Lifecycle & Promotion History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Multi-year progression records preserved across institutional rollover cycles.
                </p>
              </div>

              {(currentRole === 'super_admin' || currentRole === 'principal') && (
                <button
                  onClick={() => cms.setIsPromotionModalOpen(true)}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Promote Student
                </button>
              )}
            </div>

            {/* Current Active Placement */}
            <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-700 dark:text-brand-300">Current Active Cycle</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {student.grade} • Section {student.section}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Roll #: <strong>{student.rollNo || 'N/A'}</strong> • Cycle: {student.academicYear || '2026 - 2027'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                  Active Enrollment
                </span>
              </div>
            </div>

            {/* Historical Promotions Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Archived Cycle Records ({student.academicHistory?.length || 0})
              </h4>

              {(!student.academicHistory || student.academicHistory.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                  Student is currently enrolled in their baseline academic year. No archived previous cycles found.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Academic Cycle</th>
                        <th className="py-2.5 px-3">Grade & Section</th>
                        <th className="py-2.5 px-3">Roll #</th>
                        <th className="py-2.5 px-3 text-center">Final GPA</th>
                        <th className="py-2.5 px-3 text-center">Attendance</th>
                        <th className="py-2.5 px-3 text-right">Promotion Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {student.academicHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{h.academicYear}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{h.grade} • {h.section}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">{h.rollNo}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">{h.gpa}</td>
                          <td className="py-3 px-3 text-center text-emerald-600 font-bold">{h.attendanceRate}%</td>
                          <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400">{h.promotedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance Telemetry */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              Verified Section Roll Call Log
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total sessions tracked: {studentAttendance.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Attendance Rate</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {student.attendanceRate !== null && student.attendanceRate !== undefined ? `${student.attendanceRate}%` : '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Recorded Absences</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {studentAttendance.filter(a => a.status === 'Absent').length}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Status Clearance</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {studentAttendance.filter(a => a.status === 'Absent').length > 2 ? 'Review Required' : 'Good Standing'}
              </p>
            </div>
          </div>

          {studentAttendance.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No individual session records loaded.</p>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Session Description</th>
                    <th className="py-2.5 px-3">Roll #</th>
                    <th className="py-2.5 px-3">Attendance Status</th>
                    <th className="py-2.5 px-3">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {studentAttendance.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Daily Morning Roll Call</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">{a.rollNo}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{a.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Grades & Report Card */}
      {activeTab === 'grades' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-600" />
              Continuous Assessment Grades & Exam Transcripts
            </h3>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Term 1 Active</span>
          </div>

          {studentGrades.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No gradebook entries recorded for this student.</p>
          ) : (
            <div className="space-y-4">
              {studentGrades.map((g, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{g.subject || 'Continuous Assessment'}</span>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {g.studentId} • Section {student.section}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-brand-600 dark:text-brand-400">{g.letterGrade}</span>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">{g.weightedScore}% Total</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Quiz 1 (15%)</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{g.quiz1} / 100</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Midterm (35%)</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{g.midterm} / 100</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Lab Project (20%)</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{g.project} / 100</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Final Exam (30%)</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{g.finalExam} / 100</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Document Vault */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-brand-600" />
              S3 Verified Student Documents
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Strict 2.0MB file limit</span>
          </div>

          {studentDocuments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
              No documents currently attached to this student record. Upload national ID or medical clearance in the Document Vault.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">File Size</th>
                    <th className="py-2.5 px-3">Uploaded</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {studentDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{doc.title}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{doc.size}</td>
                      <td className="py-3 px-3 text-slate-500">{doc.uploadedAt}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => alert(`Downloading verified document ${doc.title}...`)}
                          className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Tuition & Billing */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Tuition Invoices & Payment Receipts
            </h3>
            <span className="text-xs font-bold text-emerald-600">Institutional Ledger</span>
          </div>

          {studentInvoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
              No billing records or tuition invoices found for this student.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Billing Term</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Payment Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {studentInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{inv.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{inv.term}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">${inv.amount}</td>
                      <td className="py-3 px-3 text-slate-500">{inv.dueDate}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {inv.receipt ? (
                          <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{inv.receipt}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Update Student Enrollment Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleStatusChange} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="Active">Active (Attending classes)</option>
                  <option value="On-Leave">On-Leave (Medical or approved absence)</option>
                  <option value="Suspended">Suspended (Disciplinary action)</option>
                  <option value="Alumni/Graduated">Alumni / Graduated</option>
                  <option value="Transferred">Transferred to another institution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Reason / Notes for Audit Trail</label>
                <textarea
                  rows="3"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Medical leave certificate verified through end of term..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Commit Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
