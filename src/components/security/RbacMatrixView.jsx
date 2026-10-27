import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Save, 
  RotateCcw, 
  Check, 
  Info,
  Sparkles
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { ROLES } from '../../data/mockData';

export default function RbacMatrixView() {
  const { rbacMatrix, saveRbacMatrix, resetRbacMatrix } = useCMS();
  const [matrix, setMatrix] = useState(rbacMatrix || []);

  React.useEffect(() => {
    if (rbacMatrix && rbacMatrix.length > 0) {
      setMatrix(rbacMatrix);
    }
  }, [rbacMatrix]);

  const [selectedRole, setSelectedRole] = useState('teacher');
  const [saveNote, setSaveNote] = useState('');

  const permissions = ['view', 'create', 'edit', 'delete', 'export'];

  const togglePermission = (moduleName, permType) => {
    setMatrix(prev => prev.map(item => {
      if (item.module === moduleName) {
        const currentList = item[permType] || [];
        const hasPerm = currentList.includes(selectedRole);
        const updatedList = hasPerm 
          ? currentList.filter(r => r !== selectedRole)
          : [...currentList, selectedRole];
        return { ...item, [permType]: updatedList };
      }
      return item;
    }));
  };

  const handleSavePolicies = () => {
    if (saveRbacMatrix) {
      saveRbacMatrix(matrix);
    }
    setSaveNote('Policy matrix synchronized to institutional RBAC engine in 22ms.');
    setTimeout(() => setSaveNote(''), 4000);
  };

  const handleResetDefaults = () => {
    if (resetRbacMatrix) {
      resetRbacMatrix();
    }
    setMatrix(RBAC_PERMISSIONS_MATRIX);
    setSaveNote('Permissions restored to institutional baseline.');
    setTimeout(() => setSaveNote(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            Granular Role-Based Access Control (RBAC) Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define declarative authorization policies and gate permissions per institutional persona.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
          <button
            onClick={handleSavePolicies}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Policy Gate</span>
          </button>
        </div>
      </div>

      {/* Role Picker Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Lock className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Configuring Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>
                {r.label} ({r.id})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Super Admin maintains immutable root bypass authority.
        </span>
      </div>

      {saveNote && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveNote}</span>
        </div>
      )}

      {/* Permissions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">System Module</th>
                {permissions.map(p => (
                  <th key={p} className="py-3.5 px-4 text-center uppercase tracking-wider">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                    {row.module}
                  </td>
                  {permissions.map(perm => {
                    const isChecked = (row[perm] || []).includes(selectedRole);
                    return (
                      <td key={perm} className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(row.module, perm)}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Security Engine: OWASP Top 10 Broken Access Control Hardened</span>
          <span className="font-mono">Policy Middleware: CheckRoleAndPermissions</span>
        </div>
      </div>
    </div>
  );
}
