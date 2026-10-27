import React, { useState } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Download, 
  CreditCard, 
  Send, 
  Phone
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';

export default function GuardianPortalView({ student: propStudent, onQueueJob: propOnQueueJob }) {
  const { invoices, grades, students, queueJob } = useCMS();
  const [excuseNote, setExcuseNote] = useState('');
  const [excuseSent, setExcuseSent] = useState(false);

  // Fallback student if none selected
  const activeStudent = propStudent || students[0] || {
    id: 'STU-2026-0101',
    name: 'Aisha Al-Mansoor',
    grade: 'Grade 10',
    section: '10-A (Science)',
    attendanceRate: 98.4,
    gpa: '3.92',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    guardianName: 'Tariq Al-Mansoor',
    guardianPhone: '+1 (555) 234-9081',
  };

  const handleSendExcuse = (e) => {
    e.preventDefault();
    if (!excuseNote.trim()) return;

    api.portal.sendExcuseNote(activeStudent.id, excuseNote).catch((err) => {
      console.warn('Backend excuse note dispatch notice:', err.message);
    });

    const job = {
      id: `q-${Date.now()}-excuse`,
      type: 'SMS_ALERT',
      target: 'Dean / Head Teacher',
      recipient: `Dr. Evelyn Reed (${activeStudent.section})`,
      status: 'Completed',
      time: 'Just now',
      description: `Medical excuse note submitted by ${activeStudent.guardianName}: "${excuseNote.slice(0, 30)}..."`,
    };

    queueJob(job);
    if (propOnQueueJob) propOnQueueJob(job);

    setExcuseSent(true);
    setExcuseNote('');
    setTimeout(() => setExcuseSent(false), 5000);
  };

  const outstandingInvoices = invoices.filter(inv => inv.status !== 'Paid');
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Guardian Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img 
            src={activeStudent.avatar} 
            alt={activeStudent.name} 
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/30 text-brand-300 px-2 py-0.5 rounded border border-brand-400/30">
                Guardian Portal View
              </span>
              <span className="text-xs text-slate-300">ID: {activeStudent.id}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">{activeStudent.name}</h2>
            <p className="text-xs text-slate-300">
              Enrolled in <strong>{activeStudent.grade}</strong> • {activeStudent.section}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert(`Downloading official PDF transcript for ${activeStudent.name}...`)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Term Report</span>
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Attendance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeStudent.attendanceRate}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Above 90% threshold</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Status: Regular Attendance</p>
        </div>

        {/* GPA */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Cumulative GPA</span>
            <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{activeStudent.gpa}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Top Honor Roll</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Scale: 4.0 weighted system</p>
        </div>

        {/* Fees */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Financial Balance</span>
            <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${outstandingTotal}.00</span>
            <span className={`text-xs font-bold ${outstandingTotal === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {outstandingTotal === 0 ? 'All Cleared' : 'Payment Due'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoices.length} total invoice ledger items</p>
        </div>
      </div>

      {/* Main Grid: Course Performance & Submit Excuse Note */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Course Grades & Billing Statements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grades overview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Course Performance & Term Assessments</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live verified marks signed by faculty</p>
              </div>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Term 1 Active</span>
            </div>

            <div className="p-4 space-y-3">
              {grades.slice(0, 4).map((g, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {idx === 0 ? 'Physics & Mechanics' : idx === 1 ? 'Pure Mathematics' : idx === 2 ? 'Computer Science Algorithms' : 'Chemistry Lab'}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Quiz: {g.quiz1} • Midterm: {g.midterm} • Project: {g.project} • Final: {g.finalExam}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{g.letterGrade}</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">{g.weightedScore}% Total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Billing History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Fee Statements & Invoices</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Official institutional payment receipts</p>

            <div className="space-y-3 text-xs">
              {invoices.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{inv.term}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Invoice: {inv.id} • Due: {inv.dueDate}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white">${inv.amount}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'Paid' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 col: Submit Medical / Absence Note */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Submit Excuse Note to School
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Instantly notifies the Head Teacher and section coordinator via the Redis communication pipeline.
            </p>

            {excuseSent && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Excuse note dispatched to Dean & Section Teacher.</span>
              </div>
            )}

            <form onSubmit={handleSendExcuse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Absence / Medical Leave</label>
                <textarea
                  rows="4"
                  required
                  value={excuseNote}
                  onChange={(e) => setExcuseNote(e.target.value)}
                  placeholder="e.g. Aisha has a scheduled dental appointment on Monday morning from 09:00 - 11:30 AM..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-brand-500 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Academic Office</span>
              </button>
            </form>
          </div>

          {/* Emergency contacts card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Institute Emergency Desk
            </h4>
            <p className="text-slate-600 dark:text-slate-400">Health Clinic: +1 (555) 782-9999</p>
            <p className="text-slate-600 dark:text-slate-400">Dean's Hotline: +1 (555) 782-9900</p>
          </div>
        </div>
      </div>
    </div>
  );
}
