import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  getAcademicYearName,
  areAcademicYearsEqual,
  validateBatchPromotion,
} from '../../services/studentService';

const GRADE_SECTIONS = {
  'Grade 9': ['9-A', '9-B'],
  'Grade 10': ['10-A (Science)', '10-B (Commerce)', '10-C (General)'],
  'Grade 11': ['11-PreMed', '11-PreEng', '11-ComputerScience'],
  'Grade 12': ['12-PreMed', '12-PreEng', '12-Arts'],
};

export default function StudentPromotionModal({ isOpen, onClose }) {
  const cms = useCMS();
  const academicYearsList = cms?.academicYears || [];
  const students = cms?.students || [];

  // Filter Source Cohort
  const [sourceAcademicYear, setSourceAcademicYear] = useState('All');
  const [sourceGrade, setSourceGrade] = useState('Grade 10');
  const [sourceSection, setSourceSection] = useState('10-A (Science)');

  // Selected Student IDs
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Target Cohort
  const [targetAcademicYear, setTargetAcademicYear] = useState('ay-2026');
  const [targetGrade, setTargetGrade] = useState('Grade 11');
  const [targetSection, setTargetSection] = useState('11-ComputerScience');

  // Step state: 1 = Selection, 2 = Review & Confirm
  const [step, setStep] = useState(1);
  const [validationError, setValidationError] = useState('');

  // Eligible students in source cohort
  const eligibleStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.grade === sourceGrade &&
        (sourceSection === 'All' || s.section === sourceSection) &&
        (sourceAcademicYear === 'All' || areAcademicYearsEqual(s.academicYear, sourceAcademicYear)) &&
        s.status !== 'Withdrawn' &&
        s.status !== 'Graduated'
    );
  }, [students, sourceGrade, sourceSection, sourceAcademicYear]);

  // Clean up stale selections when eligible students change
  useEffect(() => {
    const eligibleIdSet = new Set(eligibleStudents.map((s) => s.id));
    setSelectedStudentIds((prev) => prev.filter((id) => eligibleIdSet.has(id)));
  }, [eligibleStudents]);

  // Handle grade change for target
  const handleTargetGradeChange = (grade) => {
    setTargetGrade(grade);
    const validSections = GRADE_SECTIONS[grade] || [];
    setTargetSection(validSections[0] || '');
  };

  // Toggle single selection
  const handleToggleSelect = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all eligible
  const handleSelectAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length && eligibleStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map((s) => s.id));
    }
  };

  // Validation before review step
  const handleProceedToReview = () => {
    setValidationError('');

    const validation = validateBatchPromotion({
      studentIds: selectedStudentIds,
      sourceGrade,
      sourceSection,
      sourceAcademicYear: sourceAcademicYear !== 'All' ? sourceAcademicYear : null,
      targetAcademicYear,
      targetGrade,
      targetSection,
      students,
    });

    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setStep(2);
  };

  // Confirmation
  const handleConfirmPromotion = async () => {
    setValidationError('');
    const result = await cms.promoteStudents({
      studentIds: selectedStudentIds,
      sourceGrade,
      sourceSection,
      sourceAcademicYear: sourceAcademicYear !== 'All' ? sourceAcademicYear : null,
      targetAcademicYear,
      targetGrade,
      targetSection,
    });

    if (!result || !result.success) {
      setValidationError(result?.error || 'Promotion failed to execute.');
      setStep(1);
      return;
    }

    // Reset and close only on explicit success
    setStep(1);
    setSelectedStudentIds([]);
    onClose();
  };

  if (!isOpen) return null;

  const targetSections = GRADE_SECTIONS[targetGrade] || [];
  const selectedStudentsData = students.filter((s) => selectedStudentIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Batch Academic Promotion Engine</h3>
              <p className="text-xs text-slate-300">
                {step === 1 ? 'Step 1: Select Cohort & Target Enrollment' : 'Step 2: Review & Validate Batch Promotion'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-5">
              {/* Filter & Target Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Selection Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold uppercase tracking-wider text-[11px]">
                    <Users className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>1. Source Cohort Filter</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Session</label>
                      <select
                        value={sourceAcademicYear}
                        onChange={(e) => {
                          setSourceAcademicYear(e.target.value);
                          setSelectedStudentIds([]);
                        }}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                      >
                        <option value="All">All Sessions</option>
                        {academicYearsList.map((ay) => (
                          <option key={ay.id} value={ay.id}>{ay.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Grade</label>
                      <select
                        value={sourceGrade}
                        onChange={(e) => {
                          setSourceGrade(e.target.value);
                          setSelectedStudentIds([]);
                        }}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                      >
                        {Object.keys(GRADE_SECTIONS).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Section</label>
                      <select
                        value={sourceSection}
                        onChange={(e) => {
                          setSourceSection(e.target.value);
                          setSelectedStudentIds([]);
                        }}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                      >
                        <option value="All">All Sections</option>
                        {(GRADE_SECTIONS[sourceGrade] || []).map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Target Destination Card */}
                <div className="p-4 bg-brand-50/40 dark:bg-brand-950/20 rounded-xl border border-brand-200/80 dark:border-brand-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-brand-900 dark:text-brand-300 font-bold uppercase tracking-wider text-[11px]">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>2. Target Academic Destination</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Session</label>
                      <select
                        value={targetAcademicYear}
                        onChange={(e) => setTargetAcademicYear(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                      >
                        {academicYearsList.map((ay) => (
                          <option key={ay.id} value={ay.id}>{ay.name} ({ay.status})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Grade</label>
                      <select
                        value={targetGrade}
                        onChange={(e) => handleTargetGradeChange(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                      >
                        {Object.keys(GRADE_SECTIONS).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Section</label>
                      <select
                        value={targetSection}
                        onChange={(e) => setTargetSection(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                      >
                        {targetSections.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Candidate List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                    >
                      {selectedStudentIds.length === eligibleStudents.length && eligibleStudents.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {selectedStudentIds.length === eligibleStudents.length && eligibleStudents.length > 0
                          ? 'Deselect All'
                          : 'Select All Eligible'}
                      </span>
                    </button>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {selectedStudentIds.length} of {eligibleStudents.length} candidate(s) selected
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 italic">
                    Historical enrollment records will be preserved in student profile
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 max-h-64 overflow-y-auto">
                  {eligibleStudents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No eligible active students found in {sourceGrade} ({sourceSection}).
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 w-10">Select</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Student ID</th>
                          <th className="py-2.5 px-3">Current Section</th>
                          <th className="py-2.5 px-3">Roll #</th>
                          <th className="py-2.5 px-3">GPA</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {eligibleStudents.map((st) => {
                          const isSelected = selectedStudentIds.includes(st.id);
                          return (
                            <tr
                              key={st.id}
                              onClick={() => handleToggleSelect(st.id)}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  handleToggleSelect(st.id);
                                }
                              }}
                              className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                isSelected ? 'bg-brand-50/50 dark:bg-brand-950/30' : ''
                              }`}
                            >
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(st.id);
                                  }}
                                  aria-label={`Select ${st.name}`}
                                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={st.avatar}
                                    alt={st.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    {st.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px]">{st.id}</td>
                              <td className="py-2 px-3">{st.section}</td>
                              <td className="py-2 px-3 font-mono">{st.rollNo || 'N/A'}</td>
                              <td className="py-2 px-3 font-semibold text-brand-600 dark:text-brand-400">
                                {st.gpa !== null && st.gpa !== undefined ? st.gpa : 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {st.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW & CONFIRMATION */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
                <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs">Review Batch Promotion Summary</h4>
                  <p className="text-[11px] leading-relaxed">
                    You are about to promote <strong className="underline">{selectedStudentIds.length} students</strong> from{' '}
                    <strong>{sourceGrade} ({sourceSection})</strong> into{' '}
                    <strong>{targetGrade} &bull; {targetSection}</strong> for Academic Session <strong>{getAcademicYearName(targetAcademicYear)}</strong>.
                  </p>
                </div>
              </div>

              {/* Transition Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">From Origin</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {sourceGrade} ({sourceSection})
                  </p>
                  <p className="text-xs text-slate-500">Current active academic placement</p>
                </div>

                <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-800 space-y-1">
                  <p className="text-[10px] font-bold text-brand-600 uppercase">To Destination</p>
                  <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                    {targetGrade} &bull; {targetSection} ({getAcademicYearName(targetAcademicYear)})
                  </p>
                  <p className="text-xs text-brand-600 dark:text-brand-400">New primary enrollment</p>
                </div>
              </div>

              {/* Roster of Students Being Promoted */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Promotion Manifest ({selectedStudentsData.length} records)
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Student</th>
                        <th className="py-2 px-3">SIS ID</th>
                        <th className="py-2 px-3">Prior Placement</th>
                        <th className="py-2 px-3">Target Placement</th>
                        <th className="py-2 px-3">History Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedStudentsData.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                            {st.name}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px]">{st.id}</td>
                          <td className="py-2 px-3">{st.grade} - {st.section}</td>
                          <td className="py-2 px-3 text-brand-600 dark:text-brand-400 font-medium">
                            {targetGrade} - {targetSection}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                              Archive &amp; Append
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  All previous grades, attendance entries, and documents will remain linked via immutable Student ID ({selectedStudentsData[0]?.id || 'STU'}).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition"
              >
                &larr; Back to Selection
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={handleProceedToReview}
                disabled={selectedStudentIds.length === 0}
                className={`px-5 py-2 font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 ${
                  selectedStudentIds.length === 0
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30'
                }`}
              >
                <span>Review Promotion ({selectedStudentIds.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmPromotion}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Execute Batch Promotion</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
