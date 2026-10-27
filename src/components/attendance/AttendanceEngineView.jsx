import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Send, 
  Save, 
  Calendar, 
  Filter, 
  CheckCheck,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export default function AttendanceEngineView({ onQueueJob }) {
  const { 
    attendance: roster, 
    classes,
    students,
    fetchAttendanceRoster,
    updateAttendanceStatus, 
    updateAttendanceRemark, 
    markAllAttendance, 
    submitAttendanceBatch,
    queueJob
  } = useCMS();

  const [selectedSection, setSelectedSection] = useState('10-A (Science)');
  const [selectedPeriod, setSelectedPeriod] = useState('Daily Morning Roster');
  const [attendanceDate, setAttendanceDate] = useState('2026-10-24');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch roster whenever section, date, or period changes
  useEffect(() => {
    let active = true;
    if (fetchAttendanceRoster && selectedSection) {
      setLoadingRoster(true);
      fetchAttendanceRoster({
        section: selectedSection,
        date: attendanceDate,
        period: selectedPeriod,
      }).finally(() => {
        if (active) setLoadingRoster(false);
      });
    }
    return () => {
      active = false;
    };
  }, [selectedSection, attendanceDate, selectedPeriod]);

  // Dynamically resolve all section options across grades
  const availableSections = classes && classes.length > 0
    ? Array.from(new Set(classes.flatMap((c) => c.sections || [])))
    : ['10-A (Science)', '10-B (Commerce)', '10-C (General)', '11-ComputerScience', '11-PreMed', '11-PreEng', '12-PreMed', '12-PreEng', '12-Arts', '9-A', '9-B'];

  const handleMarkAll = (status) => {
    markAllAttendance(status);
  };

  const handleUpdateStudentStatus = (studentId, newStatus) => {
    updateAttendanceStatus(studentId, newStatus);
  };

  const handleRemarkChange = (studentId, remark) => {
    updateAttendanceRemark(studentId, remark);
  };

  const handleSubmitBatch = async () => {
    setSubmitting(true);
    setNotification(null);

    try {
      const result = await submitAttendanceBatch(selectedSection, attendanceDate, selectedPeriod);
      if (!result.success) {
        setNotification({
          type: 'error',
          title: 'Batch Attendance Submission Failed',
          details: result.error || 'Unable to persist attendance records to server.',
        });
        setSubmitting(false);
        return;
      }

      if (onQueueJob && result.absentCount > 0) {
        onQueueJob({
          id: `q-${Date.now()}-batch`,
          type: 'SMS_ALERT',
          target: '+1 (555) 441-9921',
          recipient: 'Guardians Batch Roster',
          status: 'Queued',
          time: 'Just now',
          description: `Dispatched ${result.absentCount} SMS absence alerts for ${selectedSection}`,
        });
      }

      setNotification({
        type: 'success',
        title: 'Batch Attendance Committed Successfully',
        details: `Saved ${result.total} student records via indexed batch transaction. ${result.absentCount} guardian SMS alerts queued to Redis.`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Submission Error',
        details: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = roster.filter(r => r.status === 'Present').length;
  const absentCount = roster.filter(r => r.status === 'Absent').length;
  const lateCount = roster.filter(r => r.status === 'Late').length;
  const excusedCount = roster.filter(r => r.status === 'Excused').length;

  return (
    <div className="space-y-6">
      {/* Title & Section Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-brand-600" />
            Section Attendance Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rapid single-grid period marking with automatic anomaly detection and background Redis SMS dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSubmitBatch}
            disabled={submitting || loadingRoster || roster.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/30 transition disabled:opacity-50 active:scale-95"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Committing Batch...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save & Dispatch Alerts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Criteria Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Target Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
          >
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Session / Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
          >
            <option value="Daily Morning Roster">Daily Morning Roll Call</option>
            <option value="Period 1: Physics Lab">Period 1: Physics Lab</option>
            <option value="Period 3: Computer Architecture">Period 3: Computer Architecture</option>
            <option value="Period 5: Advanced Calculus">Period 5: Advanced Calculus</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Attendance Date</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`border rounded-2xl p-4 flex items-start gap-3 animate-in fade-in ${
          notification.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
          }`}>
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className={`font-bold text-xs ${
              notification.type === 'error' ? 'text-rose-900 dark:text-rose-200' : 'text-emerald-900 dark:text-emerald-200'
            }`}>{notification.title}</h4>
            <p className={`text-[11px] mt-0.5 ${
              notification.type === 'error' ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'
            }`}>{notification.details}</p>
          </div>
        </div>
      )}

      {/* Stat Bar & Bulk Toggles */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Count indicators */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Present: {presentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Absent: {absentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Late: {lateCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Excused: {excusedCount}</span>
          </div>
        </div>

        {/* Quick Batch Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">Quick Action:</span>
          <button
            onClick={() => handleMarkAll('Present')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-800 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('Absent')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-800 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-20">Roll #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Notes / Remarks</th>
                <th className="py-3 px-4 text-right">Guardian Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loadingRoster ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="font-semibold text-xs">Loading section roster...</span>
                    </div>
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Info className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-xs">No students currently enrolled in {selectedSection}.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                roster.map(item => (
                  <tr key={item.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-750 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {item.rollNo}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                      <span className="block font-mono text-[10px] text-slate-400 dark:text-slate-500">{item.studentId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['Present', 'Absent', 'Late', 'Excused'].map(status => {
                          const isSelected = item.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() => handleUpdateStudentStatus(item.studentId, status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                isSelected
                                  ? status === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : status === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : status === 'Late'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleRemarkChange(item.studentId, e.target.value)}
                        placeholder="Add teacher remarks..."
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-brand-500 transition"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'Absent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                          <Send className="w-3 h-3" /> SMS Dispatched
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Regular Session</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Architecture Note Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-3.5 h-3.5 text-brand-600" />
            Composite Index: <code>(student_id, date, section_id)</code> enforces zero lock contention.
          </span>
          <span>Last synchronized: Real-Time Stream</span>
        </div>
      </div>
    </div>
  );
}
