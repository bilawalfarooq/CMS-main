import React, { useState } from 'react';
import { 
  School, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ROLES } from '../../data/mockData';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('admin@educore.edu');
  const [password, setPassword] = useState('Admin#2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickLogin = async (roleId) => {
    setSelectedRole(roleId);
    let demoEmail = 'admin@educore.edu';
    if (roleId === 'principal') demoEmail = 'dean@educore.edu';
    if (roleId === 'teacher') demoEmail = 'e.reed@educore.edu';
    if (roleId === 'admin_staff') demoEmail = 'registrar@educore.edu';
    if (roleId === 'guardian') demoEmail = 'tariq.mansoor@gmail.com';
    
    setEmail(demoEmail);
    setPassword('Admin#2026!');
    setErrorMsg('');
    setLoading(true);

    try {
      if (onLogin) {
        const res = await onLogin({ email: demoEmail, password: 'Admin#2026!', role: roleId });
        if (res && res.success === false) {
          setErrorMsg(res.error || 'Authentication failed');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const actualPassword = password === '••••••••••••' ? 'Admin#2026!' : password;
      if (onLogin) {
        const res = await onLogin({ email, password: actualPassword, role: selectedRole });
        if (res && res.success === false) {
          setErrorMsg(res.error || 'Invalid credentials or account disabled');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-brand-500/30 mb-3">
          <School className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          EduCore CMS
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enterprise Institute Management System • Apex Institute
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-white/20 space-y-6">
          {/* Quick Demo Personas Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                1-Click Demo Login
              </span>
              <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                Instant Access
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {ROLES.slice(0, 4).map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleQuickLogin(role.id)}
                  className={`p-2 rounded-xl text-left border text-xs transition ${
                    selectedRole === role.id
                      ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-[11px] leading-tight">{role.label}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{role.description.slice(0, 24)}...</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('guardian')}
              className="w-full mt-2 p-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 text-left text-xs transition flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-amber-900 text-[11px]">Guardian / Parent Portal</span>
                <p className="text-[10px] text-amber-700">View child attendance, fee invoices & transcripts</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium text-[10px]">
                Or sign in with institutional credentials
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium text-slate-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium text-slate-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <span>Remember this workstation</span>
              </label>
              <span className="text-brand-600 hover:underline cursor-pointer font-semibold">
                Reset password?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security badge footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit TLS Encrypted • Sanctum Token Authorization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
