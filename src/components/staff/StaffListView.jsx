import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Briefcase, 
  Mail, 
  Phone, 
  BookOpen, 
  Clock, 
  Plus, 
  CheckCircle,
  Award,
  MoreVertical
} from 'lucide-react';

export default function StaffListView({ staff, onAddStaff, currentRole }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    department: 'Computer Science & Robotics',
    role: 'Lecturer',
    contract: 'Full-Time',
    phone: '',
    teachingHours: 16,
    maxHours: 22,
  });

  const departments = ['All', 'Physics & Applied Sciences', 'Computer Science & Robotics', 'Pure Mathematics', 'Languages & Literature'];

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === 'All' || member.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;

    const created = {
      name: newStaff.name,
      email: `${newStaff.name.toLowerCase().replace(/\s+/g, '.')}@educore.edu`,
      department: newStaff.department,
      role: newStaff.role,
      contract: newStaff.contract,
      teachingHours: Number(newStaff.teachingHours),
      maxHours: Number(newStaff.maxHours),
      assignedClasses: ['Grade 10-B', 'Grade 11-A'],
      status: 'Active',
      phone: newStaff.phone || '+1 (555) 782-9900',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    };

    if (onAddStaff) {
      const res = await onAddStaff(created);
      if (res && res.success === false) {
        alert(`Failed to add staff member: ${res.error || 'Server error'}`);
        return;
      }
    }

    setShowAddModal(false);
    setNewStaff({
      name: '',
      department: 'Computer Science & Robotics',
      role: 'Lecturer',
      contract: 'Full-Time',
      phone: '',
      teachingHours: 16,
      maxHours: 22,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Staff & Faculty Administration
          </h2>
          <p className="text-xs text-slate-500">
            Employment records, departmental governance, teaching load distribution, and schedule matrices.
          </p>
        </div>

        {(currentRole === 'super_admin' || currentRole === 'principal') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search faculty by name, department, or staff ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStaff.map(member => {
          const loadPercentage = Math.round((member.teachingHours / member.maxHours) * 100);
          return (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      <p className="text-xs text-brand-600 font-semibold">{member.role}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{member.id} • {member.contract}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {member.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Department:
                    </span>
                    <span className="font-semibold text-slate-800">{member.department}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                    </span>
                    <span className="font-semibold text-slate-800">{member.email}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Assigned Classes:
                    </span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {member.assignedClasses.map(cls => (
                        <span key={cls} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching Load bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-600" /> Weekly Teaching Load:
                  </span>
                  <span className="font-bold text-slate-800">
                    {member.teachingHours} / {member.maxHours} hrs ({loadPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      loadPercentage > 90 ? 'bg-amber-500' : 'bg-brand-600'
                    }`}
                    style={{ width: `${loadPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Add Academic Faculty Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Dr. Julian Vance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newStaff.department}
                  onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                >
                  <option value="Physics & Applied Sciences">Physics & Applied Sciences</option>
                  <option value="Computer Science & Robotics">Computer Science & Robotics</option>
                  <option value="Pure Mathematics">Pure Mathematics</option>
                  <option value="Languages & Literature">Languages & Literature</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  placeholder="e.g. Associate Professor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teaching Hours</label>
                  <input
                    type="number"
                    value={newStaff.teachingHours}
                    onChange={(e) => setNewStaff({ ...newStaff, teachingHours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Ceiling</label>
                  <input
                    type="number"
                    value={newStaff.maxHours}
                    onChange={(e) => setNewStaff({ ...newStaff, maxHours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold"
                >
                  Save Faculty Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
