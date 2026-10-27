import React from 'react';
import { 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Layers, 
  FileText, 
  Send, 
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { QUEUE_ACTIVITIES } from '../../data/mockData';

export default function DashboardView({ 
  students, 
  staff, 
  setActiveTab, 
  onOpenQuickAdmission,
  currentRole 
}) {
  const { queueJobs } = useCMS();
  const activeStudents = students.filter(s => s.status === 'Active');
  const anomalies = students.filter(s => s.anomalyAlert);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Cycle 2026-2027 • Term 1 Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institute Operational Overview
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Centralized portal monitoring real-time enrollments, asynchronous guardian notification pipelines, faculty allocations, and section attendance records.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('attendance')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-brand-600/30 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Today's Attendance</span>
            </button>

            {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
              <button
                onClick={onOpenQuickAdmission}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition backdrop-blur-sm active:scale-95"
              >
                <GraduationCap className="w-4 h-4" />
                <span>New Student Admission</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('gradebook')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition backdrop-blur-sm active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Gradebook & Weightings</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{students.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +8.4%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{activeStudents.length} actively attending classes</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Faculty</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{staff.length}</span>
            <span className="text-xs font-semibold text-purple-600">100% Tenured</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Avg. 19 teaching hrs / week load</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">95.2%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Above target
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Daily sections submitted: 18 / 18</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anomaly Radar</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{anomalies.length}</span>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Action Req.
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Consecutive unverified absences</p>
        </div>
      </div>

      {/* Grid: Queue Worker Live Activity & Attendance Alert Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Anomaly Alert Banner + Recent Admissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Anomaly banner */}
          {anomalies.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    High-Priority Attendance Anomaly Flagged
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    <strong>{anomalies[0].name}</strong> ({anomalies[0].section}): {anomalies[0].anomalyAlert}. Guardian notified via automated SMS.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('attendance')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
              >
                Inspect Section
              </button>
            </div>
          )}

          {/* Recent Student Admissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Student Directory Records</h3>
                <p className="text-xs text-slate-500">Live SIS repository with automated admission identifiers</p>
              </div>
              <button 
                onClick={() => setActiveTab('students')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student & ID</th>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.slice(0, 4).map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={student.avatar} 
                            alt={student.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" 
                          />
                          <div>
                            <p className="font-bold text-slate-800">{student.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">{student.grade}</span>
                        <span className="block text-[11px] text-slate-400">{student.section}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-medium text-slate-700">{student.guardianName}</p>
                        <p className="text-[10px] text-slate-400">{student.guardianPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${
                          student.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {student.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Redis Asynchronous Queue & Horizon Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-600" />
                  Background Queue Stream
                </h3>
                <p className="text-xs text-slate-500">Redis 7.x asynchronous worker log</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 font-bold">
                Port 6379
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {(queueJobs && queueJobs.length > 0 ? queueJobs : QUEUE_ACTIVITIES).slice(0, 5).map(job => (
                <div 
                  key={job.id} 
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[10px] text-slate-500">{job.type}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      job.status === 'Processing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium text-xs">{job.description}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Target: {job.target}</span>
                    <span>{job.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Zero unhandled exceptions
              </span>
              <button 
                onClick={() => setActiveTab('system_health')}
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Inspect Metrics
              </button>
            </div>
          </div>

          {/* Department Workloads Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Faculty Teaching Load</h3>
            <p className="text-xs text-slate-500 mb-4">Class-Subject allocations balance</p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700">Applied Physics</span>
                  <span className="text-slate-500 font-bold">18 / 22 hrs (82%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full w-[82%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700">Computer Science</span>
                  <span className="text-slate-500 font-bold">20 / 24 hrs (83%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[83%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700">Pure Mathematics</span>
                  <span className="text-slate-500 font-bold">22 / 24 hrs (91%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[91%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
