import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Phone, 
  MapPin, 
  ExternalLink,
  GraduationCap,
  Users,
  Award,
  CreditCard,
  UserCheck,
  Building2,
  BookOpen
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'super_admin',
    title: 'Super Admin',
    name: 'Alexander Vance',
    email: 'admin@amstech.edu.pk',
    icon: ShieldCheck,
    badge: 'Full Access',
    color: 'border-rose-200 hover:border-rose-400 bg-rose-50/60 hover:bg-rose-50 text-rose-950',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    role: 'principal',
    title: 'Principal / Dean',
    name: 'Jamal Uddin Rajput',
    email: 'dean@amstech.edu.pk',
    icon: Building2,
    badge: 'Dean Office',
    color: 'border-purple-200 hover:border-purple-400 bg-purple-50/60 hover:bg-purple-50 text-purple-950',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    role: 'hod',
    title: 'Head of Dept (HOD)',
    name: 'Engr. M. Zubair Ashrafi',
    email: 'hod@amstech.edu.pk',
    icon: BookOpen,
    badge: 'IT Dept',
    color: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-950',
    tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    role: 'teacher',
    title: 'Technical Faculty',
    name: 'Engr. Syed Rehan Ali',
    email: 'faculty@amstech.edu.pk',
    icon: Users,
    badge: 'Teacher',
    color: 'border-blue-200 hover:border-blue-400 bg-blue-50/60 hover:bg-blue-50 text-blue-950',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    role: 'admin_staff',
    title: 'Admissions Officer',
    name: 'Admissions Desk',
    email: 'registrar@amstech.edu.pk',
    icon: Award,
    badge: 'Admissions',
    color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-950',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    role: 'accountant',
    title: 'Accountant / Finance',
    name: 'Muhammad Bilal',
    email: 'accountant@amstech.edu.pk',
    icon: CreditCard,
    badge: 'Billing & Ledger',
    color: 'border-teal-200 hover:border-teal-400 bg-teal-50/60 hover:bg-teal-50 text-teal-950',
    tagColor: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    role: 'student',
    title: 'Enrolled Student',
    name: 'Aisha Siddiqui',
    email: 'aisha.s@student.amstech.edu.pk',
    icon: GraduationCap,
    badge: 'DAE AI-1',
    color: 'border-sky-200 hover:border-sky-400 bg-sky-50/60 hover:bg-sky-50 text-sky-950',
    tagColor: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    role: 'guardian',
    title: 'Parent / Guardian',
    name: 'Tariq Siddiqui',
    email: 'tariq.siddiqui@gmail.com',
    icon: UserCheck,
    badge: 'Ward Portal',
    color: 'border-amber-200 hover:border-amber-400 bg-amber-50/60 hover:bg-amber-50 text-amber-950',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
];

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('admin@amstech.edu.pk');
  const [password, setPassword] = useState('Admin#2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickLogin = async (account) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword('Admin#2026!');
    setErrorMsg('');
    setLoading(true);

    try {
      if (onLogin) {
        const res = await onLogin({ email: account.email, password: 'Admin#2026!', role: account.role });
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
    <div className="min-h-screen bg-[#0d1933] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background campus photo with ambient navy gradients */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-[1px] scale-105"
        style={{ backgroundImage: `url('/institute-building_bg.webp')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#162e5a]/95 via-[#1c3b73]/90 to-[#0d1933]/95" />

      {/* Header with AMSTech Logo and SBTE Affiliation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="bg-white/95 p-2 rounded-2xl shadow-xl shadow-black/20 border border-white/30 backdrop-blur-md">
            <img 
              src="/logo.webp" 
              alt="AMSTech Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>
          <div className="bg-white/95 p-2 rounded-2xl shadow-xl shadow-black/20 border border-white/30 backdrop-blur-md">
            <img 
              src="/sbte.svg" 
              alt="SBTE Affiliated" 
              className="h-12 w-auto object-contain" 
            />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <span>AMSTech</span>
          <span className="text-xs font-bold uppercase tracking-wider bg-[#ebb51d] text-[#1c3b73] px-2 py-0.5 rounded-full shadow-sm">
            CMS
          </span>
        </h1>
        <p className="mt-1 text-xs text-white/80 font-medium">
          Al-Mustafa Institute of Science & Technology • Karachi, Pakistan
        </p>
        <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-white/60">
          <span>Affiliated with Sindh Board of Technical Education (SBTE)</span>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-6 px-5 sm:px-8 shadow-2xl rounded-3xl border border-white/40 space-y-5">
          {/* 1-Click Demo Personas Switcher - ALL 8 ACCOUNTS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Select Demo Account (1-Click Test Login)
              </span>
              <span className="text-[10px] text-[#1c3b73] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                8 Roles Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                const isSelected = selectedRole === account.role;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleQuickLogin(account)}
                    disabled={loading}
                    className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer flex items-start gap-2.5 ${account.color} ${
                      isSelected
                        ? 'ring-2 ring-[#1c3b73] shadow-md font-semibold'
                        : 'shadow-sm'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white/80 shrink-0 mt-0.5 shadow-xs">
                      <Icon className="w-4 h-4 text-slate-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] leading-tight text-slate-900 truncate">
                          {account.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${account.tagColor}`}>
                          {account.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-700 font-medium truncate mt-0.5">
                        {account.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono truncate">
                        {account.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Click any role card above to instantly log in and test its custom sidebar and permissions.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium text-[10px]">
                Or enter credentials manually
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
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
                  placeholder="e.g. admin@amstech.edu.pk"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#1c3b73] focus:ring-2 focus:ring-[#1c3b73]/20 font-medium text-slate-800 transition"
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
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#1c3b73] focus:ring-2 focus:ring-[#1c3b73]/20 font-medium text-slate-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 text-[11px]">
                Default password for all accounts: <strong className="text-slate-700 font-mono">Admin#2026!</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1c3b73] hover:bg-[#162e5a] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#1c3b73]/30 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to AMSTech CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Campus Helpline & Web Links */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[10px] text-slate-500 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3 h-3 text-[#ebb51d]" /> +92 335 5662 266
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3 h-3 text-[#ebb51d]" /> Muslimabad, Karachi
              </span>
            </div>
            <a 
              href="https://amstech.edu.pk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1c3b73] hover:underline font-semibold flex items-center justify-center gap-1"
            >
              Visit amstech.edu.pk <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
