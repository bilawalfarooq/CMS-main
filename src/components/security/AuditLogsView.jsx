import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  Server, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';

function formatLogTimestamp(ts) {
  if (!ts) return '-';
  if (typeof ts === 'string' && ts.includes('(PKT)')) return ts;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
    return formatted.replace(',', '') + ' (PKT)';
  } catch {
    return String(ts);
  }
}

function formatLogIp(ip) {
  if (!ip) return '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
    return '127.0.0.1 (Localhost / Karachi Dev)';
  }
  return ip.replace(/^::ffff:/, '');
}

export default function AuditLogsView() {
  const { auditLogs } = useCMS();
  const logs = auditLogs || [];
  const [filterAction, setFilterAction] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = logs.map(l => ({
    ...l,
    displayTimestamp: formatLogTimestamp(l.timestamp),
    displayIp: formatLogIp(l.ip),
  })).filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.displayIp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'All' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-600" />
            Security Audit Trail & Governance Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable system execution record. Displaying in <span className="font-semibold text-brand-600 dark:text-brand-400">Asia/Karachi (PKT, UTC+5)</span> time.
          </p>
        </div>

        <button
          onClick={() => {
            const csv = 'Timestamp (PKT),Actor,Action,Entity,IP Address,Status\n' + 
              filtered.map(l => `"${l.displayTimestamp}","${l.actor}","${l.action}","${l.entity}","${l.displayIp}","${l.status}"`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `amstech_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
          className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by actor, IP, or affected entity..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Events</option>
              <option value="USER_AUTHENTICATION">User Logins</option>
              <option value="USER_LOGOUT">User Logouts</option>
              <option value="GRADE_BATCH_UPDATE">Grade Updates</option>
              <option value="STUDENT_ADMISSION">Student Admissions</option>
              <option value="SMS_DISPATCH">SMS Dispatches</option>
              <option value="DATABASE_BACKUP_EXEC">Database Snapshots</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp (PKT / Karachi)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity / Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    {log.displayTimestamp}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                    {log.actor}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {log.entity}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      log.displayIp.includes('Localhost') 
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {log.displayIp}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Log Retention Policy: 365 Days (Archived to S3 Glacier)</span>
          <span className="font-mono">Log Driver: Monolog Structured JSON</span>
        </div>
      </div>
    </div>
  );
}
