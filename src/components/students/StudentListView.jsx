import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Download,
  GraduationCap,
  Phone,
  AlertTriangle,
  Eye,
  Trash2,
  X,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  IdCard,
  UserCheck,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  filterStudents,
  sortStudents,
  paginateStudents,
  exportStudentsToCSV,
} from '../../services/studentService';

export default function StudentListView({
  students: propStudents,
  onDeleteStudent: propOnDeleteStudent,
  onOpenAdmissionModal: propOnOpenAdmissionModal,
  onOpenBulkImport: propOnOpenBulkImport,
  currentRole: propCurrentRole
}) {
  const cms = useCMS();
  const students = propStudents || cms.students;
  const currentRole = propCurrentRole || cms.currentRole;
  const onDeleteStudent = propOnDeleteStudent || cms.deleteStudent;
  const onOpenAdmissionModal = propOnOpenAdmissionModal || (() => cms.setIsAdmissionModalOpen(true));
  const onOpenBulkImport = propOnOpenBulkImport || (() => cms.setIsBulkImportOpen(true));

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Sorting State
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick Profile Modal
  const [viewingStudent, setViewingStudent] = useState(null);

  // Available Grades & Sections dynamically
  const availableGrades = useMemo(() => {
    const grades = new Set(students.map(s => s.grade).filter(Boolean));
    return ['All', ...Array.from(grades)];
  }, [students]);

  const availableSections = useMemo(() => {
    let list = students;
    if (selectedGrade !== 'All') {
      list = list.filter(s => s.grade === selectedGrade);
    }
    const sections = new Set(list.map(s => s.section).filter(Boolean));
    return ['All', ...Array.from(sections)];
  }, [students, selectedGrade]);

  // Ensure selectedSection remains valid when selectedGrade changes
  useEffect(() => {
    if (selectedSection !== 'All' && !availableSections.includes(selectedSection)) {
      setSelectedSection('All');
    }
  }, [availableSections, selectedSection]);

  // Reset pagination when search, filters, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGrade, selectedSection, selectedStatus, pageSize]);

  // Filter & Sort Logic using studentService
  const filteredAndSortedStudents = useMemo(() => {
    const filtered = filterStudents({
      students,
      searchTerm,
      grade: selectedGrade,
      section: selectedSection,
      status: selectedStatus,
      academicYear: 'All',
    });
    return sortStudents({
      students: filtered,
      sortColumn,
      sortDirection,
    });
  }, [students, searchTerm, selectedGrade, selectedSection, selectedStatus, sortColumn, sortDirection]);

  // Client-Side Pagination using studentService
  const paginationResult = useMemo(() => {
    return paginateStudents({
      students: filteredAndSortedStudents,
      page: currentPage,
      pageSize,
    });
  }, [filteredAndSortedStudents, currentPage, pageSize]);

  const {
    paginatedList: paginatedStudents,
    totalPages,
    totalRecords,
    startIndex,
    endIndex,
  } = paginationResult;

  // Sorting Toggle Handler
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedGrade('All');
    setSelectedSection('All');
    setSelectedStatus('All');
    setSortColumn('name');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-600 dark:text-brand-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-600 dark:text-brand-400 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            Student Information System (SIS)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise student repository, academic lifecycle, verified guardians, and enrollment administration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* CSV Export */}
          <button
            onClick={() => {
              const csvData = exportStudentsToCSV(filteredAndSortedStudents);
              const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `amstech_students_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Bulk Import */}
          {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
            <button
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV</span>
            </button>
          )}

          {/* Batch Promotion */}
          {(currentRole === 'super_admin' || currentRole === 'principal') && (
            <button
              onClick={() => cms.setIsPromotionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Promote Students</span>
            </button>
          )}

          {/* Admit Student */}
          {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
            <button
              onClick={onOpenAdmissionModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Admit Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Multi-Filter Control Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, admission ID, roll #, guardian, or email..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Grade Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {availableGrades.map(grade => (
                  <option key={grade} value={grade} className="dark:bg-slate-800">{grade}</option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {availableSections.map(sec => (
                  <option key={sec} value={sec} className="dark:bg-slate-800">{sec}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-800">All Status</option>
                <option value="Active" className="dark:bg-slate-800">Active</option>
                <option value="On-Leave" className="dark:bg-slate-800">On-Leave</option>
                <option value="Suspended" className="dark:bg-slate-800">Suspended</option>
                <option value="Alumni/Graduated" className="dark:bg-slate-800">Alumni</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(searchTerm || selectedGrade !== 'All' || selectedSection !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={resetAllFilters}
                title="Reset all filters"
                className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Result Counter Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> matching student records
            {selectedGrade !== 'All' && <span> in <strong>{selectedGrade}</strong></span>}
            {selectedSection !== 'All' && <span> ({selectedSection})</span>}
          </div>

          <div className="flex items-center gap-2">
            <span>Per page:</span>
            {[10, 25, 50].map(size => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  pageSize === size
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Student & Profile</span>
                  {getSortIcon('name')}
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Admission ID</span>
                  {getSortIcon('id')}
                </th>
                <th
                  onClick={() => handleSort('rollNo')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Roll #</span>
                  {getSortIcon('rollNo')}
                </th>
                <th
                  onClick={() => handleSort('grade')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Class & Section</span>
                  {getSortIcon('grade')}
                </th>
                <th className="py-3.5 px-4">Guardian Contacts</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </th>
                <th
                  onClick={() => handleSort('attendanceRate')}
                  className="py-3.5 px-4 text-center cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Attendance</span>
                  {getSortIcon('attendanceRate')}
                </th>
                <th
                  onClick={() => handleSort('gpa')}
                  className="py-3.5 px-4 text-center cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
                >
                  <span>GPA</span>
                  {getSortIcon('gpa')}
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-14 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No students match your criteria</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Try clearing search terms or resetting the grade/section filters.
                      </p>
                      <button
                        onClick={resetAllFilters}
                        className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition group">
                    {/* Student Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          onClick={() => cms.navigateToStudentProfile(student.id)}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700 shadow-sm cursor-pointer hover:ring-brand-500 transition"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => cms.navigateToStudentProfile(student.id)}
                              className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition text-left"
                            >
                              {student.name}
                            </button>
                            {student.anomalyAlert && (
                              <span title={student.anomalyAlert} className="text-amber-500 cursor-help">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{student.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Admission ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {student.id}
                    </td>

                    {/* Roll # */}
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {student.rollNo || '—'}
                    </td>

                    {/* Class & Section */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{student.grade}</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">{student.section}</span>
                    </td>

                    {/* Guardian Contacts */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{student.guardianName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {student.guardianPhone}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        student.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : student.status === 'On-Leave'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : student.status === 'Suspended'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                      }`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Attendance Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold">
                        <span className={student.attendanceRate !== null && student.attendanceRate !== undefined && student.attendanceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                          {student.attendanceRate !== null && student.attendanceRate !== undefined ? `${student.attendanceRate}%` : '—'}
                        </span>
                      </div>
                      {student.attendanceRate !== null && student.attendanceRate !== undefined && (
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${student.attendanceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, student.attendanceRate))}%` }}
                          ></div>
                        </div>
                      )}
                    </td>

                    {/* GPA */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {student.gpa !== null && student.gpa !== undefined ? student.gpa : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* 360 Profile */}
                        <button
                          onClick={() => cms.navigateToStudentProfile(student.id)}
                          title="Open 360° Profile"
                          className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        {/* ID Card Badge */}
                        <button
                          onClick={() => cms.openStudentIdCard(student)}
                          title="Print Student ID Card"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>

                        {/* Quick Peek Drawer */}
                        <button
                          onClick={() => setViewingStudent(student)}
                          title="Quick Peek Profile"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Remove */}
                        {(currentRole === 'super_admin' || currentRole === 'admin_staff') && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove active enrollment record for ${student.name} (${student.id})?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            title="Remove Student Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Controls */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{totalRecords > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> students
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                  currentPage === page
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Peek Profile Modal */}
      {(() => {
        const activeViewingStudent = viewingStudent ? students.find(s => s.id === viewingStudent.id) || viewingStudent : null;
        if (!activeViewingStudent) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="relative bg-gradient-to-r from-brand-600 to-indigo-700 text-white p-6 pb-12">
                <button
                  onClick={() => setViewingStudent(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <img
                    src={activeViewingStudent.avatar}
                    alt={activeViewingStudent.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                  />
                  <div>
                    <h3 className="text-lg font-bold">{activeViewingStudent.name}</h3>
                    <p className="text-xs text-white/80 font-mono">{activeViewingStudent.id} • Roll: {activeViewingStudent.rollNo || 'N/A'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/20">
                      {activeViewingStudent.grade} • {activeViewingStudent.section}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 -mt-6 bg-white dark:bg-slate-800 rounded-t-2xl space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Current GPA</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">{activeViewingStudent.gpa !== null && activeViewingStudent.gpa !== undefined ? `${activeViewingStudent.gpa} / 4.0` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Attendance</span>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{activeViewingStudent.attendanceRate !== null && activeViewingStudent.attendanceRate !== undefined ? `${activeViewingStudent.attendanceRate}%` : '—'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">Guardian & Emergency</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Guardian Name:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activeViewingStudent.guardianName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activeViewingStudent.guardianPhone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Email:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activeViewingStudent.guardianEmail || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Emergency Hospital Contact:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{activeViewingStudent.emergencyContact || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">Placement Details</h4>
                  <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                    <span>Blood Group: <strong className="text-slate-900 dark:text-white">{activeViewingStudent.bloodGroup || '—'}</strong></span>
                    <span>DOB: <strong className="text-slate-900 dark:text-white">{activeViewingStudent.dob || '—'}</strong></span>
                    <span>Gender: <strong className="text-slate-900 dark:text-white">{activeViewingStudent.gender || '—'}</strong></span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Address: {activeViewingStudent.address || '—'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <button
                    onClick={() => {
                      const targetId = activeViewingStudent.id;
                      setViewingStudent(null);
                      cms.navigateToStudentProfile(targetId);
                    }}
                    className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>Open Full 360° Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewingStudent(null)}
                    className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
