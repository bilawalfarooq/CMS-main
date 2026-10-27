import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Check, Sparkles, AlertCircle, User, BookOpen, Users, ShieldAlert } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  validateStudentAdmission,
  getAcademicYearName,
} from '../../services/studentService';

const GRADE_SECTIONS = {
  'Grade 9': ['9-A', '9-B'],
  'Grade 10': ['10-A (Science)', '10-B (Commerce)', '10-C (General)'],
  'Grade 11': ['11-PreMed', '11-PreEng', '11-ComputerScience'],
  'Grade 12': ['12-PreMed', '12-PreEng', '12-Arts'],
};

export default function StudentModal({ isOpen, onClose, onAddStudent }) {
  const cms = useCMS();
  const students = cms?.students || [];

  const getInitialFormState = () => ({
    // Identity
    name: '',
    dob: '2010-05-15',
    gender: 'Female',
    bloodGroup: 'O+',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    
    // Enrollment
    academicYear: cms?.academicYear || 'ay-2026',
    admissionDate: new Date().toISOString().slice(0, 10),
    grade: 'Grade 10',
    section: '10-A (Science)',
    rollNo: '',
    customId: '',
    previousSchool: '',

    // Primary Guardian
    guardianName: '',
    guardianRelation: 'Father',
    guardianPhone: '',
    guardianEmail: '',

    // Secondary Guardian
    secondaryGuardianName: '',
    secondaryGuardianRelation: 'Mother',
    secondaryGuardianPhone: '',

    // Emergency & Contact
    emergencyContact: '',
    address: '',
    status: 'Active',
  });

  const [formData, setFormData] = useState(getInitialFormState);
  const [errors, setErrors] = useState({});
  const [uploadNote, setUploadNote] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('identity'); // 'identity', 'academic', 'guardians'
  const createdObjectUrlsRef = useRef([]);

  const cleanupObjectUrls = useCallback(() => {
    createdObjectUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    createdObjectUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanupObjectUrls();
    };
  }, [cleanupObjectUrls]);

  const handleClose = () => {
    cleanupObjectUrls();
    setFormData(getInitialFormState());
    setErrors({});
    setUploadNote('');
    setActiveFormTab('identity');
    onClose();
  };

  if (!isOpen) return null;

  // Sync section list when grade changes
  const handleGradeChange = (newGrade) => {
    const validSections = GRADE_SECTIONS[newGrade] || ['A'];
    setFormData((prev) => ({
      ...prev,
      grade: newGrade,
      section: validSections[0] || '',
    }));
  };

  const validateStep = (tab) => {
    const errs = {};
    if (tab === 'identity') {
      const name = (formData.name || '').trim();
      if (!name) {
        errs.name = 'Full legal name is required';
      } else if (name.length < 2) {
        errs.name = 'Name must be at least 2 characters';
      }
      if (!formData.dob) {
        errs.dob = 'Date of birth is required';
      } else {
        const dobDate = new Date(formData.dob);
        if (isNaN(dobDate.getTime())) {
          errs.dob = 'Invalid date of birth format';
        } else if (dobDate > new Date()) {
          errs.dob = 'Date of birth cannot be in the future';
        }
      }
    } else if (tab === 'academic') {
      if (!formData.admissionDate) {
        errs.admissionDate = 'Admission date is required';
      } else {
        const admDate = new Date(formData.admissionDate);
        if (isNaN(admDate.getTime())) {
          errs.admissionDate = 'Invalid admission date format';
        }
      }
      if (!formData.grade) errs.grade = 'Academic grade is required';
      if (!formData.section) errs.section = 'Section assignment is required';

      if (formData.customId && formData.customId.trim()) {
        const cleanId = formData.customId.trim().toUpperCase();
        if (students.some((s) => String(s.id || '').toUpperCase() === cleanId)) {
          errs.customId = `Student ID '${formData.customId.trim()}' already exists in system`;
        }
      }
      if (formData.rollNo && formData.rollNo.trim()) {
        const cleanRoll = formData.rollNo.trim().toUpperCase();
        if (
          students.some(
            (s) =>
              s.grade === formData.grade &&
              s.section === formData.section &&
              s.status !== 'Withdrawn' &&
              String(s.rollNo || '').toUpperCase() === cleanRoll
          )
        ) {
          errs.rollNo = `Roll number '${formData.rollNo.trim()}' is already taken in ${formData.section}`;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (activeFormTab === 'identity') {
      if (validateStep('identity')) {
        setActiveFormTab('academic');
      }
    } else if (activeFormTab === 'academic') {
      if (validateStep('academic')) {
        setActiveFormTab('guardians');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateStudentAdmission({
      studentData: formData,
      existingStudents: students,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.errors.name || validation.errors.dob) {
        setActiveFormTab('identity');
      } else if (
        validation.errors.rollNo ||
        validation.errors.customId ||
        validation.errors.admissionDate ||
        validation.errors.grade ||
        validation.errors.section
      ) {
        setActiveFormTab('academic');
      } else if (validation.errors.guardianName || validation.errors.guardianPhone) {
        setActiveFormTab('guardians');
      }
      return;
    }

    const res = onAddStudent
      ? await onAddStudent(validation.normalizedStudent)
      : await cms?.addStudent(validation.normalizedStudent);

    if (res && res.success === false) {
      setErrors(res.errors || { general: res.error });
      return;
    }

    handleClose();
  };

  const handleSimulateUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadNote('Error: File exceeds system 2MB upload constraint (Architecture Policy 7.4).');
        return;
      }
      const newUrl = URL.createObjectURL(file);
      createdObjectUrlsRef.current.push(newUrl);
      setUploadNote(`Local preview selected (${(file.size / 1024).toFixed(1)} KB). Ready for save.`);
      setFormData((prev) => ({
        ...prev,
        avatar: newUrl,
      }));
    }
  };

  const availableSections = GRADE_SECTIONS[formData.grade] || ['Default Section'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Student Admission Registration</h3>
              <p className="text-xs text-slate-300">SIS Primary Record • Academic Year {getAcademicYearName(formData.academicYear)}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.general && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Tab Stepper */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveFormTab('identity')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeFormTab === 'identity'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Identity & Bio</span>
            {errors.name && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('academic')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeFormTab === 'academic'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Academic & Enrollment</span>
            {(errors.rollNo || errors.customId) && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('guardians')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeFormTab === 'guardians'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Guardians & Emergency</span>
            {(errors.guardianName || errors.guardianPhone) && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: IDENTITY & BIO */}
          {activeFormTab === 'identity' && (
            <div className="space-y-4">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <img 
                  src={formData.avatar} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-500/30 shadow-sm"
                />
                <div className="flex-1 text-center sm:text-left">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm transition">
                    <Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Upload Student Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSimulateUpload} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Local photo preview. Max file size: 2MB.
                  </p>
                  {uploadNote && (
                    <p className={`text-[11px] mt-0.5 font-medium ${uploadNote.includes('Error') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {uploadNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maya Elizabeth Lin"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                  {errors.dob && <p className="text-rose-500 text-[10px] mt-1">{errors.dob}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                  <select 
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Enrollment Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Probationary">Probationary</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Permanent Residential Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 124 Blossom Hill, District 4"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC & ENROLLMENT */}
          {activeFormTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Session *</label>
                  <select 
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition font-medium"
                  >
                    {(cms?.academicYears || []).map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name} ({ay.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Admission Date *</label>
                  <input 
                    type="date" 
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                  {errors.admissionDate && <p className="text-rose-500 text-[10px] mt-1">{errors.admissionDate}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Grade *</label>
                  <select 
                    value={formData.grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  >
                    {Object.keys(GRADE_SECTIONS).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Section *</label>
                  <select 
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  >
                    {availableSections.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Explicit Roll Number
                    <span className="text-[10px] font-normal text-slate-500 ml-1">(Optional - auto-assigned if empty)</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. 10A-05"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                  {errors.rollNo ? (
                    <p className="text-rose-500 text-[10px] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.rollNo}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Must be unique within {formData.section}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Student SIS ID
                    <span className="text-[10px] font-normal text-slate-500 ml-1">(Optional - auto-generated if empty)</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.customId}
                    onChange={(e) => setFormData({ ...formData, customId: e.target.value })}
                    placeholder="e.g. STU-2026-9021"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition font-mono"
                  />
                  {errors.customId && (
                    <p className="text-rose-500 text-[10px] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.customId}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Previous School Attended
                    <span className="text-[10px] font-normal text-slate-500 ml-1">(Transfer students only)</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    placeholder="e.g. Horizon High School / St. Mary Academy"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUARDIANS & EMERGENCY */}
          {activeFormTab === 'guardians' && (
            <div className="space-y-4">
              {/* Primary Guardian Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    Primary Guardian Contact (Required)
                  </h4>
                  <span className="text-[10px] bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded font-semibold border border-brand-200 dark:border-brand-800">
                    SMS Alert Target
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Guardian Full Name *</label>
                    <input 
                      type="text" 
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      placeholder="e.g. Richard Lin"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                    {errors.guardianName && <p className="text-rose-500 text-[10px] mt-1">{errors.guardianName}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
                    <select 
                      value={formData.guardianRelation}
                      onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone *</label>
                    <input 
                      type="tel" 
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                    {errors.guardianPhone && <p className="text-rose-500 text-[10px] mt-1">{errors.guardianPhone}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Guardian Email Address</label>
                    <input 
                      type="email" 
                      value={formData.guardianEmail}
                      onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                      placeholder="richard.lin@example.com"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Guardian Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Secondary Guardian Contact (Optional)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Secondary Name</label>
                    <input 
                      type="text" 
                      value={formData.secondaryGuardianName}
                      onChange={(e) => setFormData({ ...formData, secondaryGuardianName: e.target.value })}
                      placeholder="e.g. Susan Lin"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
                    <select 
                      value={formData.secondaryGuardianRelation}
                      onChange={(e) => setFormData({ ...formData, secondaryGuardianRelation: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone</label>
                    <input 
                      type="tel" 
                      value={formData.secondaryGuardianPhone}
                      onChange={(e) => setFormData({ ...formData, secondaryGuardianPhone: e.target.value })}
                      placeholder="+1 (555) 441-2290"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Hospital / Dispatch Contact */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-900/40">
                <div className="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-xs">Emergency & Medical Hotline</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Number / Hospital Line
                  </label>
                  <input 
                    type="tel" 
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="+1 (555) 911-3322 (Hospital / Doctor hotline)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              {activeFormTab === 'identity' && <span>Step 1 of 3: Student Details</span>}
              {activeFormTab === 'academic' && <span>Step 2 of 3: Academic Assignment</span>}
              {activeFormTab === 'guardians' && <span>Step 3 of 3: Guardian Network</span>}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition"
              >
                Cancel
              </button>

              {activeFormTab !== 'guardians' ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 font-semibold text-white rounded-xl transition shadow-sm"
                >
                  Continue &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 font-bold text-white rounded-xl shadow-md shadow-brand-600/30 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Complete SIS Admission</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

