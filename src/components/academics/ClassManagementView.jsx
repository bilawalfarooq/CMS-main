import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Building,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/apiClient';
import ClassDetailsView from './ClassDetailsView';
import TimetableGeneratorModal from '../timetable/TimetableGeneratorModal';

export default function ClassManagementView({ currentRole }) {
  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Deep View Navigation
  const [viewingClassId, setViewingClassId] = useState(null);

  // Class Modal (Create / Edit)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    level: 'Secondary',
    program: 'General',
    department: 'General Academics',
    duration: '1 Year',
    semester: 'Year Level 1',
    headTeacher: '',
    status: 'Active',
    initialSectionsText: 'Section A, Section B',
  });

  // Timetable Generator Launcher
  const [generatorClass, setGeneratorClass] = useState(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);

  // Toast / Action notification
  const [notification, setNotification] = useState(null);

  const fetchClasses = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.classes.list({
        search: searchTerm,
        program: selectedProgram,
        department: selectedDepartment,
        status: selectedStatus,
        page,
        limit: 10,
      });

      if (res?.data) {
        setClasses(res.data.items || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses(1);
  }, [searchTerm, selectedProgram, selectedDepartment, selectedStatus]);

  // Load staff & subjects for generator
  useEffect(() => {
    Promise.all([
      api.academics.getSubjects().catch(() => ({ data: [] })),
      api.staff.list({ limit: 50 }).catch(() => ({ data: [] })),
    ]).then(([subRes, staffRes]) => {
      if (subRes?.data) setAvailableSubjects(subRes.data);
      if (staffRes?.data) setAvailableStaff(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data?.items || []);
    });
  }, []);

  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassForm({
      name: '',
      code: '',
      level: 'Secondary',
      program: 'General',
      department: 'General Academics',
      duration: '1 Year',
      semester: 'Year Level 1',
      headTeacher: '',
      status: 'Active',
      initialSectionsText: 'Section A, Section B',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c) => {
    setEditingClass(c);
    setClassForm({
      name: c.name,
      code: c.code,
      level: c.level,
      program: c.program,
      department: c.department,
      duration: c.duration,
      semester: c.semester,
      headTeacher: c.headTeacher,
      status: c.status,
      initialSectionsText: '',
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.classes.update(editingClass.id, classForm);
        setNotification(`Class "${classForm.name}" updated successfully.`);
      } else {
        const initialSections = classForm.initialSectionsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        await api.classes.create({
          ...classForm,
          initialSections,
        });
        setNotification(`Class "${classForm.name}" created successfully.`);
      }
      setIsClassModalOpen(false);
      fetchClasses(pagination.page);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteClass = async (cls) => {
    if (!confirm(`Are you sure you want to remove or archive "${cls.name}"?`)) return;
    try {
      const res = await api.classes.delete(cls.id);
      setNotification(res?.message || 'Class removed.');
      fetchClasses(pagination.page);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to remove class');
    }
  };

  const handleLaunchGenerator = (cls) => {
    setGeneratorClass(cls);
    setIsGeneratorOpen(true);
  };

  // If a specific class is being inspected in deep profile view
  if (viewingClassId) {
    return (
      <ClassDetailsView
        classId={viewingClassId}
        onBack={() => {
          setViewingClassId(null);
          fetchClasses(pagination.page);
        }}
        onEditClass={(c) => handleOpenEditClass(c)}
        currentRole={currentRole}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Class, Section & Academic Hierarchy Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define institutional classes, cohort sections, capacity limits, coordinator allocations, and automated timetable generation.
          </p>
        </div>

        {(currentRole === 'super_admin' || currentRole === 'principal') && (
          <button
            onClick={handleOpenCreateClass}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search classes by name, code, or coordinator..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Program Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
            <span className="text-slate-500 font-semibold text-[11px]">Program:</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Programs</option>
              <option value="General">General</option>
              <option value="DAE">DAE (Diploma of Associate Engineering)</option>
              <option value="DIT">DIT (Information Tech)</option>
              <option value="Secondary">Secondary (Grades 9-10)</option>
              <option value="Higher Secondary">Higher Secondary (Grades 11-12)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
            <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes Responsive Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Class ID / Code</th>
                <th className="py-3.5 px-4">Class Name</th>
                <th className="py-3.5 px-4">Program & Level</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-3 text-center">Sections</th>
                <th className="py-3.5 px-4">Enrolled / Cap</th>
                <th className="py-3.5 px-4">Coordinator</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading classes directory...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No classes found matching search criteria.
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    {/* ID & Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-white">
                      <div>
                        <span>{c.code}</span>
                        <p className="text-[10px] text-slate-400 font-normal">{c.id}</p>
                      </div>
                    </td>

                    {/* Class Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <button
                        onClick={() => setViewingClassId(c.id)}
                        className="hover:text-indigo-600 transition text-left"
                      >
                        {c.name}
                      </button>
                    </td>

                    {/* Program & Level */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="font-semibold">{c.program}</span>
                        <p className="text-[10px] text-slate-400">{c.level} ({c.semester})</p>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {c.department}
                    </td>

                    {/* Number of Sections */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {c.sectionsCount}
                      </span>
                    </td>

                    {/* Enrolled Students / Capacity */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {c.enrolledCount} / {c.totalCapacity}
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.min(100, c.utilizationRate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Coordinator */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {c.headTeacher}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingClassId(c.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition"
                          title="View Class Details & 7 Tabs"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleLaunchGenerator(c)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                          title="Generate Weekly Timetable"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {(currentRole === 'super_admin' || currentRole === 'principal') && (
                          <>
                            <button
                              onClick={() => handleOpenEditClass(c)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Edit Class"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteClass(c)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                              title="Safe Delete / Archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{classes.length}</strong> of <strong>{pagination.total}</strong> classes
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchClasses(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchClasses(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Class Create / Edit Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingClass ? `Edit Class: ${editingClass.name}` : 'Create Academic Class'}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Class Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DAE Civil 1st Year"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Class Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DAE-CIVIL-1"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Program Type</label>
                  <select
                    value={classForm.program}
                    onChange={(e) => setClassForm({ ...classForm, program: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="General">General</option>
                    <option value="DAE">DAE (Diploma of Associate Engineering)</option>
                    <option value="DIT">DIT (Information Tech)</option>
                    <option value="Diploma">Professional Diploma</option>
                    <option value="Secondary">Secondary (Grades 9-10)</option>
                    <option value="Higher Secondary">Higher Secondary (Grades 11-12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Academic Level</label>
                  <select
                    value={classForm.level}
                    onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Secondary">Secondary</option>
                    <option value="Higher Secondary">Higher Secondary</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Vocational">Vocational & Technical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Engineering"
                    value={classForm.department}
                    onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Semester / Level</label>
                  <input
                    type="text"
                    placeholder="e.g. Semester 1 or Year 1"
                    value={classForm.semester}
                    onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Class Coordinator</label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Syed Rehan Ali"
                    value={classForm.headTeacher}
                    onChange={(e) => setClassForm({ ...classForm, headTeacher: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Status</label>
                  <select
                    value={classForm.status}
                    onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {!editingClass && (
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Initial Sections (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Section A, Section B, Section C"
                    value={classForm.initialSectionsText}
                    onChange={(e) => setClassForm({ ...classForm, initialSectionsText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-3 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  {editingClass ? 'Save Specifications' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable Generator Modal */}
      {isGeneratorOpen && generatorClass && (
        <TimetableGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          initialClassId={generatorClass.id}
          initialSectionId={generatorClass.sections?.[0]?.id}
          availableClasses={classes}
          availableSubjects={availableSubjects}
          availableStaff={availableStaff}
          onTimetablePublished={() => {
            fetchClasses(pagination.page);
            setNotification(`Timetable published for ${generatorClass.name}!`);
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}
    </div>
  );
}
