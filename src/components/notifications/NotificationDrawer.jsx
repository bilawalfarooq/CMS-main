import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Smartphone, 
  Mail, 
  FileText,
  Trash2
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { NOTIFICATIONS_LOG } from '../../data/mockData';

export default function NotificationDrawer({ isOpen, onClose, queueJobs }) {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_LOG);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    api.notifications.list()
      .then((res) => {
        if (isMounted && res?.data?.length > 0) {
          setNotifications(res.data);
        }
      })
      .catch((err) => {
        console.warn('Backend notification fetch notice:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    api.notifications.markAllRead().catch((err) => {
      console.warn('Backend markAllRead notice:', err.message);
    });
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    api.notifications.clearAll().catch((err) => {
      console.warn('Backend clearAll notifications notice:', err.message);
    });
    setNotifications([]);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'SMS') return n.channel.includes('SMS');
    if (filter === 'PDF') return n.channel.includes('PDF');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Communication & Alert Dispatch Log</h3>
                <p className="text-[11px] text-slate-300">Redis 7.x Queue Stream Telemetry</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions & Filters */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {['All', 'SMS', 'PDF'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] ${
                    filter === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
              <button
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 p-1"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Live Queue Jobs from user activity */}
            {queueJobs && queueJobs.length > 0 && (
              <div className="space-y-2 mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Live Redis In-Flight Queue ({queueJobs.length})
                </span>
                {queueJobs.map(job => (
                  <div key={job.id} className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-brand-700">{job.type}</span>
                      <span className="text-[10px] font-bold bg-brand-200 text-brand-900 px-1.5 py-0.5 rounded">
                        {job.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{job.description}</p>
                    <p className="text-[10px] text-slate-500">Recipient: {job.recipient}</p>
                  </div>
                ))}
              </div>
            )}

            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Recent Dispatches
            </span>

            {filtered.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No communication logs found.</p>
            ) : (
              filtered.map(item => (
                <div 
                  key={item.id}
                  className={`p-3 rounded-xl border transition text-xs space-y-1 ${
                    item.unread ? 'bg-white border-brand-300 shadow-sm' : 'bg-slate-50/80 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.channel.includes('SMS') ? (
                        <Smartphone className="w-3.5 h-3.5 text-brand-600" />
                      ) : item.channel.includes('PDF') ? (
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="font-bold text-slate-900">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium">{item.recipient}</p>
                  
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-400 font-mono">Via {item.channel}</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Outward API Timeout Protected • Max 3 Retries
          </div>
        </div>
      </div>
    </div>
  );
}
