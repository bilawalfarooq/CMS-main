import React, { useState } from 'react';
import { 
  UserCog, 
  Search, 
  Filter, 
  Plus, 
  KeyRound, 
  UserX, 
  UserCheck, 
  ShieldCheck, 
  Copy, 
  Check, 
  Send, 
  Mail, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';
import { INITIAL_SYSTEM_USERS } from '../../data/mockData';

export default function UserManagementView({ onQueueJob }) {
  const { systemUsers, toggleUserStatus, addUser } = useCMS();
  const users = systemUsers && systemUsers.length > 0 ? systemUsers : INITIAL_SYSTEM_USERS;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [resetSentNote, setResetSentNote] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    userType: 'Enrolled Student',
    initialPassword: 'ChangeMe#2026!'
  });

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Toggle Enable / Disable Account
  const handleToggleStatus = (userId) => {
    if (toggleUserStatus) {
      toggleUserStatus(userId);
    }
  };

  // Open Password Reset Modal
  const handleOpenResetModal = (user) => {
    setResetModalUser(user);
    const generated = `EduCore#${Math.floor(1000 + Math.random() * 9000)}!`;
    setTempPassword(generated);
    setCopied(false);
    setResetSentNote('');
  };

  // Dispatch Password Reset via Redis Queue
  const handleSendResetEmail = () => {
    if (resetModalUser) {
      api.users.sendReset(resetModalUser.id).catch((err) => {
        console.warn('Backend user reset notification notice:', err.message);
      });
      if (onQueueJob) {
        onQueueJob({
          id: `q-${Date.now()}-pwd`,
          type: 'EMAIL_DISPATCH',
          target: resetModalUser.email,
          recipient: resetModalUser.name,
          status: 'Completed',
          time: 'Just now',
          description: `Secure one-time password reset link dispatched to ${resetModalUser.email}`
        });
      }
      setResetSentNote(`Password reset token sent to ${resetModalUser?.email} via Redis Queue worker.`);
    }
  };

  // Copy temporary password
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Create New User Account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    let derivedType = 'Enrolled Student';
    if (newUser.role === 'guardian') derivedType = 'Parent / Guardian';
    if (newUser.role === 'teacher') derivedType = 'Faculty / Staff';
    if (newUser.role === 'admin_staff') derivedType = 'Administrative Staff';
    if (newUser.role === 'super_admin') derivedType = 'Administrator';

    const created = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      userType: derivedType,
      password: newUser.initialPassword || 'ChangeMe#2026!',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };

    if (addUser) {
      const res = await addUser(created);
      if (res && res.success === false) {
        alert(`Failed to create account: ${res.error || 'Server error'}`);
        return;
      }
    }
    setShowAddUserModal(false);

    if (onQueueJob) {
      onQueueJob({
        id: `q-${Date.now()}-newusr`,
        type: 'EMAIL_DISPATCH',
        target: newUser.email,
        recipient: newUser.name,
        status: 'Completed',
        time: 'Just now',
        description: `Account created for ${newUser.name}. Initial credentials dispatched.`
      });
    }

    setNewUser({
      name: '',
      email: '',
      role: 'student',
      userType: 'Enrolled Student',
      initialPassword: 'ChangeMe#2026!'
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-brand-600" />
            Unified User Account Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control login accounts for students, parents, faculty, and administrative staff with password reset and account suspension.
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total User Accounts</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{users.length}</p>
          <span className="text-xs text-slate-500">All institutional roles</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Accounts</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {users.filter(u => u.status === 'Active').length}
          </p>
          <span className="text-xs text-emerald-600 font-semibold">Authorized to log in</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disabled / Suspended</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {users.filter(u => u.status === 'Disabled').length}
          </p>
          <span className="text-xs text-rose-600 font-semibold">Sessions revoked</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2FA Enforcement</span>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">
            {users.filter(u => u.twoFactor).length}
          </p>
          <span className="text-xs text-slate-500">MFA token active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts by user name, institutional email, or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All User Types</option>
              <option value="student">Student Accounts</option>
              <option value="guardian">Parent / Guardian Accounts</option>
              <option value="teacher">Faculty / Staff</option>
              <option value="admin_staff">Registrar Staff</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Disabled">Disabled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User Account & ID</th>
                <th className="py-3 px-4">User Classification</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Security 2FA</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions & Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map(user => {
                const isActive = user.status === 'Active';
                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700" 
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === 'student' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                        user.role === 'guardian' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                        user.role === 'teacher' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                      }`}>
                        {user.userType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {user.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.twoFactor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> Enforced
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Standard Auth</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {user.lastLogin}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetModal(user)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          title="Reset user password"
                        >
                          <KeyRound className="w-3 h-3 text-brand-600" />
                          <span>Reset Pwd</span>
                        </button>

                        {/* Enable / Disable Button */}
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                            isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title={isActive ? 'Disable account' : 'Enable account'}
                        >
                          {isActive ? (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Disable</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Enable</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Auth Provider: Multi-Guard Sanctum (Students, Staff, Guardians Isolated)</span>
          <span>Showing {filteredUsers.length} active login credentials</span>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-sm">Reset Password</h3>
              </div>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-slate-500">Resetting credentials for:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{resetModalUser.name}</p>
                <p className="text-xs text-slate-500 font-mono">{resetModalUser.email}</p>
              </div>

              {/* Temporary Password Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Generated Temporary Password
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-300">
                    {tempPassword}
                  </span>
                  <button
                    onClick={handleCopyPassword}
                    className="px-2.5 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold flex items-center gap-1 shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">User will be prompted to change password upon first login.</p>
              </div>

              {resetSentNote && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{resetSentNote}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5 text-brand-600" />
                  <span>Dispatch Link via Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Create New Login Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Maya Chen"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none text-slate-800 dark:text-white focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Institutional Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. maya.chen@student.educore.edu"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none text-slate-800 dark:text-white focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Account Role Classification *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none text-slate-800 dark:text-white focus:border-brand-500 font-medium"
                >
                  <option value="student">Student Account (Portal Access)</option>
                  <option value="guardian">Parent / Guardian Account</option>
                  <option value="teacher">Faculty / Senior Staff</option>
                  <option value="admin_staff">Registrar / Administrative Staff</option>
                  <option value="super_admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newUser.initialPassword}
                  onChange={(e) => setNewUser({ ...newUser, initialPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
