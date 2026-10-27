import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAcademicYearId,
  getAcademicYearName,
  areAcademicYearsEqual,
  validateStudentAdmission,
  updateStudentProfile,
  executeBatchPromotion,
  submitSectionAttendance,
  updateGradeRecord,
  settleInvoice,
} from '../services/studentService';
import { api, setStoredToken, getStoredToken } from '../services/apiClient';

const CMSContext = createContext(null);

export function CMSProvider({ children }) {
  // Authentication & Navigation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('super_admin');
  const [academicYear, setAcademicYear] = useState('ay-2026');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Student Profile Deep Navigation State
  const [viewingStudentProfileId, setViewingStudentProfileId] = useState(null);

  // Core Synchronized Entities (Directly from PostgreSQL Database)
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [queueJobs, setQueueJobs] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);
  const [rbacMatrix, setRbacMatrix] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals & Drawers
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [selectedStudentForIdCard, setSelectedStudentForIdCard] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Synchronize Dark Mode to HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global Ctrl/Cmd + K listener for Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Fetch initial/synchronized data directly from PostgreSQL backend API
  const loadBackendData = async (roleOverride) => {
    setIsDataLoading(true);
    const role = (roleOverride || currentRole || currentUser?.role || '').toLowerCase();
    const canAccessAdmin = ['super_admin', 'principal'].includes(role);

    try {
      const [
        studentsRes,
        staffRes,
        invoicesRes,
        attendanceRes,
        gradesRes,
        documentsRes,
        examsRes,
        usersRes,
        auditRes,
        queueRes,
        rbacRes,
        classesRes,
        academicYearsRes,
      ] = await Promise.allSettled([
        api.students.list({ pageSize: 100 }),
        api.staff.list(),
        api.finance.getInvoices(),
        api.attendance.getRoster(),
        api.gradebook.getGrades(),
        api.documents.list(),
        api.exams.list(),
        canAccessAdmin ? api.users.list({ pageSize: 50 }) : Promise.resolve({ data: [] }),
        canAccessAdmin ? api.audit.list() : Promise.resolve({ data: [] }),
        api.notifications.getQueueJobs(),
        canAccessAdmin ? api.rbac.getMatrix() : Promise.resolve({ data: [] }),
        api.academics.getClasses(),
        api.academics.getYears(),
      ]);

      if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value?.data)) {
        setStudents(studentsRes.value.data);
      }
      if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.data)) {
        setStaff(staffRes.value.data);
      }
      if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value?.data)) {
        setInvoices(invoicesRes.value.data);
      }
      if (attendanceRes.status === 'fulfilled' && Array.isArray(attendanceRes.value?.data)) {
        setAttendance(attendanceRes.value.data);
      }
      if (gradesRes.status === 'fulfilled' && Array.isArray(gradesRes.value?.data)) {
        setGrades(gradesRes.value.data);
      }
      if (documentsRes.status === 'fulfilled' && Array.isArray(documentsRes.value?.data)) {
        setDocuments(documentsRes.value.data);
      }
      if (examsRes.status === 'fulfilled' && Array.isArray(examsRes.value?.data)) {
        setExamSchedules(examsRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data)) {
        setSystemUsers(usersRes.value.data);
      }
      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value?.data)) {
        setAuditLogs(auditRes.value.data);
      }
      if (queueRes.status === 'fulfilled' && Array.isArray(queueRes.value?.data)) {
        setQueueJobs(queueRes.value.data);
      }
      if (rbacRes.status === 'fulfilled' && Array.isArray(rbacRes.value?.data)) {
        setRbacMatrix(rbacRes.value.data);
      }
      if (classesRes.status === 'fulfilled' && Array.isArray(classesRes.value?.data)) {
        setClasses(classesRes.value.data);
      }
      if (academicYearsRes.status === 'fulfilled' && Array.isArray(academicYearsRes.value?.data)) {
        setAcademicYears(academicYearsRes.value.data);
      }
    } catch (err) {
      console.warn('Backend synchronization notice:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Initial Auth Lifecycle Verification — connects directly to PostgreSQL
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      setIsAuthLoading(true);
      const token = getStoredToken();

      // If no valid JWT token exists or if an old mock token is stored, log in with DB admin credentials
      if (!token || token === 'mock-amstech-jwt-session') {
        try {
          const res = await api.auth.login({
            email: 'admin@amstech.edu.pk',
            password: 'Admin#2026!',
            role: 'super_admin',
          });
          if (res?.data?.token && isMounted) {
            setStoredToken(res.data.token);
            setCurrentUser(res.data.user);
            setCurrentRole('super_admin');
            setIsAuthenticated(true);
            await loadBackendData('super_admin');
            return;
          }
        } catch (e) {
          console.warn('Auto-login against DB error:', e.message);
        }
        if (isMounted) {
          setStoredToken(null);
          setIsAuthenticated(false);
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const res = await api.auth.me();
        if (!isMounted) return;

        if (res?.data?.id) {
          setCurrentUser(res.data);
          const effectiveRole = res.data.role ? res.data.role.toLowerCase() : 'super_admin';
          setCurrentRole(effectiveRole);
          setIsAuthenticated(true);
          await loadBackendData(effectiveRole);
        } else {
          setStoredToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Auth token verification notice:', err.message);
          // Try auto-login with default DB admin user
          try {
            const loginRes = await api.auth.login({
              email: 'admin@amstech.edu.pk',
              password: 'Admin#2026!',
              role: 'super_admin',
            });
            if (loginRes?.data?.token && isMounted) {
              setStoredToken(loginRes.data.token);
              setCurrentUser(loginRes.data.user);
              setCurrentRole('super_admin');
              setIsAuthenticated(true);
              await loadBackendData('super_admin');
              return;
            }
          } catch {
            setStoredToken(null);
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'guardian' || newRole === 'student') {
      setActiveTab('portal');
    } else if (activeTab === 'portal') {
      setActiveTab('dashboard');
    }
  };

  // Pure DB Login — No mock fallbacks
  const login = async ({ email, password, role }) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.auth.login({ email, password, role });
      if (res?.data?.token) {
        setStoredToken(res.data.token);
        setCurrentUser(res.data.user);
        const effectiveRole = role || res.data.user.role?.toLowerCase() || 'super_admin';
        setCurrentRole(effectiveRole);
        setIsAuthenticated(true);
        if (effectiveRole === 'guardian' || effectiveRole === 'student') {
          setActiveTab('portal');
        } else {
          setActiveTab('dashboard');
        }
        await loadBackendData(effectiveRole);
        return { success: true, user: res.data.user };
      }
      throw new Error(res?.error || 'Authentication failed');
    } catch (err) {
      const msg = err.message || 'Invalid institutional credentials';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // non-blocking
    }
    setStoredToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setViewingStudentProfileId(null);
    setIsAdmissionModalOpen(false);
    setIsBulkImportOpen(false);
    setIsPromotionModalOpen(false);
    setIsIdCardModalOpen(false);
    setSelectedStudentForIdCard(null);
    setIsNotificationOpen(false);
    setIsCommandPaletteOpen(false);
    addAuditLog('USER_LOGOUT', `User terminated session (${currentRole})`, 'Active User', 'Success');
  };

  // Helper to add audit logs
  const addAuditLog = (action, entity, actor = 'System Administrator', status = 'Success') => {
    const newLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor,
      action,
      entity,
      ip: '192.168.1.12',
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Dispatch Queue Job (Horizon simulation)
  const queueJob = (job) => {
    setQueueJobs((prev) => [job, ...prev]);
  };

  // Navigation to Student Profile
  const navigateToStudentProfile = (studentId) => {
    setViewingStudentProfileId(studentId);
    setActiveTab('students');
  };

  const closeStudentProfile = () => {
    setViewingStudentProfileId(null);
  };

  const openStudentIdCard = (student) => {
    setSelectedStudentForIdCard(student);
    setIsIdCardModalOpen(true);
  };

  // 1. Student Actions
  const addStudent = async (newStudent) => {
    const validation = validateStudentAdmission({
      studentData: {
        ...newStudent,
        academicYear: newStudent.academicYear || academicYear,
      },
      existingStudents: students,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const normalizedStudent = validation.normalizedStudent;

    try {
      const res = await api.students.admit(normalizedStudent);
      const savedStudent = res?.data || normalizedStudent;

      setStudents((prev) => [savedStudent, ...prev]);

      setSystemUsers((prev) => [
        {
          id: `usr-${Date.now()}`,
          name: savedStudent.name,
          email: savedStudent.email,
          role: 'student',
          userType: 'Enrolled Student',
          status: 'Active',
          twoFactor: false,
          lastLogin: 'Never',
          avatar: savedStudent.avatar,
        },
        ...prev,
      ]);

      queueJob({
        id: `q-${Date.now()}-adm`,
        type: 'EMAIL_DISPATCH',
        target: savedStudent.guardianEmail || 'guardian@family.net',
        recipient: savedStudent.guardianName,
        status: 'Completed',
        time: 'Just now',
        description: `Welcome credentials & portal access dispatched to ${savedStudent.guardianName}`,
      });

      addAuditLog('STUDENT_ADMISSION', `${savedStudent.name} (${savedStudent.id}, Roll: ${savedStudent.rollNo}) registered to ${savedStudent.section}`, 'Registrar Admissions Staff');

      return { success: true, student: savedStudent };
    } catch (err) {
      return { success: false, error: err.message, errors: err.errors || { general: err.message } };
    }
  };

  const bulkImportStudents = async (importedStudents) => {
    const validStudents = [];
    let currentWorkingList = [...students];

    for (const raw of importedStudents) {
      const validation = validateStudentAdmission({
        studentData: {
          ...raw,
          academicYear: raw.academicYear || academicYear,
        },
        existingStudents: currentWorkingList,
      });

      if (validation.isValid) {
        validStudents.push(validation.normalizedStudent);
        currentWorkingList.push(validation.normalizedStudent);
      }
    }

    if (validStudents.length > 0) {
      try {
        const res = await api.students.bulkImport(validStudents);
        setStudents((prev) => [...validStudents, ...prev]);

        queueJob({
          id: `q-${Date.now()}-bulk`,
          type: 'EMAIL_DISPATCH',
          target: 'Batch Enrollment Pipeline',
          recipient: `${validStudents.length} Guardian Records`,
          status: 'Processing',
          time: 'Just now',
          description: `Ingested ${validStudents.length} students via CSV batch. Dispatched portal credentials.`,
        });

        addAuditLog('BATCH_CSV_IMPORT', `Ingested ${validStudents.length} student records into academic year ${getAcademicYearName(academicYear)}`, 'Registrar Admissions Staff');
        return { success: true, count: res.data?.count || validStudents.length };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, count: 0 };
  };

  const deleteStudent = async (studentId) => {
    try {
      await api.students.delete(studentId);
      const studentToDelete = students.find((s) => s.id === studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setAttendance((prev) => prev.filter((a) => a.studentId !== studentId));
      setGrades((prev) => prev.filter((g) => g.studentId !== studentId));
      setDocuments((prev) => prev.filter((d) => d.studentId !== studentId));

      if (viewingStudentProfileId === studentId) {
        setViewingStudentProfileId(null);
      }

      addAuditLog('STUDENT_REMOVAL', `Student record ${studentToDelete?.name || studentId} removed from active enrollment`, 'Super Admin');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateStudent = async (studentId, updatedFields) => {
    const result = updateStudentProfile({
      studentId,
      updatedFields,
      currentStudents: students,
    });

    if (!result.success) {
      return result;
    }

    try {
      await api.students.update(studentId, updatedFields);
      setStudents(result.updatedStudents);

      if (updatedFields.name) {
        setAttendance((prev) =>
          prev.map((a) => (a.studentId === studentId ? { ...a, name: updatedFields.name } : a))
        );
        setGrades((prev) =>
          prev.map((g) => (g.studentId === studentId ? { ...g, name: updatedFields.name } : g))
        );
        setDocuments((prev) =>
          prev.map((d) => (d.studentId === studentId ? { ...d, studentName: updatedFields.name } : d))
        );
      }

      addAuditLog('STUDENT_RECORD_UPDATE', `Updated student profile information for ID ${studentId}`, 'Registrar Admissions Staff');
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateStudentStatus = async (studentId, newStatus, reason = '') => {
    try {
      await api.students.updateStatus(studentId, newStatus, reason);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      );
      addAuditLog('STUDENT_STATUS_CHANGE', `Student ${studentId} status changed to ${newStatus}${reason ? ` (${reason})` : ''}`, 'Super Admin');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const promoteStudents = async ({ studentIds, targetAcademicYear, targetGrade, targetSection, sourceGrade, sourceSection, sourceAcademicYear }) => {
    const result = executeBatchPromotion({
      studentIds,
      sourceGrade,
      sourceSection,
      sourceAcademicYear,
      targetAcademicYear,
      targetGrade,
      targetSection,
      students,
      currentAcademicYear: academicYear,
    });

    if (!result.success) {
      return result;
    }

    try {
      await api.students.promote({
        studentIds,
        sourceGrade,
        sourceSection,
        sourceAcademicYear,
        targetAcademicYear,
        targetGrade,
        targetSection,
      });

      setStudents(result.updatedStudents);

      addAuditLog(
        'BATCH_STUDENT_PROMOTION',
        `Promoted ${result.count} students to ${targetGrade} (${targetSection}) for cycle ${getAcademicYearName(targetAcademicYear)}`,
        'Dean Vance (Principal)'
      );

      queueJob({
        id: `q-${Date.now()}-promo`,
        type: 'EMAIL_DISPATCH',
        target: 'Academic Council Registry',
        recipient: `${result.count} Students & Guardians`,
        status: 'Completed',
        time: 'Just now',
        description: `Class promotion transcripts dispatched for ${result.count} students advancing to ${targetGrade}`
      });

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 2. Staff Actions
  const addStaff = async (newStaffMember) => {
    const staffWithDefaults = {
      ...newStaffMember,
      id: newStaffMember.id,
      status: newStaffMember.status || 'Active',
    };

    try {
      const res = await api.staff.create(staffWithDefaults);
      const created = res.data || staffWithDefaults;

      setStaff((prev) => [created, ...prev]);

      setSystemUsers((prev) => [
        {
          id: `usr-${Date.now()}`,
          name: created.name,
          email: created.email,
          role: 'teacher',
          userType: 'Faculty / Staff',
          status: 'Active',
          twoFactor: true,
          lastLogin: 'Never',
          avatar: created.avatar,
        },
        ...prev,
      ]);

      addAuditLog('STAFF_APPOINTMENT', `${created.name} appointed to ${created.department}`, 'Dean Vance (Principal)');
      return { success: true, staff: created };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteStaff = async (staffId) => {
    try {
      await api.staff.delete(staffId);
      const staffToDelete = staff.find((s) => s.id === staffId);
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      addAuditLog('STAFF_RESIGNATION', `Staff contract concluded for ${staffToDelete?.name || staffId}`, 'Super Admin');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 3. Attendance Actions
  const updateAttendanceStatus = (studentId, newStatus, customRemark) => {
    setAttendance((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const updatedRemark = customRemark !== undefined
            ? customRemark
            : newStatus === 'Absent'
            ? 'Absence recorded - alert required'
            : item.remarks;
          return { ...item, status: newStatus, remarks: updatedRemark };
        }
        return item;
      })
    );
  };

  const updateAttendanceRemark = (studentId, remark) => {
    setAttendance((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, remarks: remark } : item
      )
    );
  };

  const markAllAttendance = (status) => {
    setAttendance((prev) =>
      prev.map((item) => ({
        ...item,
        status,
        remarks: status === 'Present' ? 'On time' : status === 'Absent' ? 'Unexcused' : item.remarks,
      }))
    );
  };

  const fetchAttendanceRoster = async (params = {}) => {
    try {
      const res = await api.attendance.getRoster(params);
      if (res?.data && Array.isArray(res.data)) {
        setAttendance(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to load attendance roster:', err);
    }
  };

  const submitAttendanceBatch = async (section, date, period) => {
    const targetDate = date || '2026-10-24';
    const targetPeriod = period || 'Daily Morning Roster';
    const result = submitSectionAttendance({ section, attendanceRecords: attendance, students });
    if (!result.success) {
      return result;
    }

    try {
      const res = await api.attendance.submitBatch({
        section,
        date: targetDate,
        period: targetPeriod,
        records: attendance,
      });

      if (result.absentRecords.length > 0) {
        result.absentRecords.forEach((a) => {
          const studentInfo = students.find((s) => s.id === a.studentId);
          queueJob({
            id: `q-${Date.now()}-${a.studentId}`,
            type: 'SMS_ALERT',
            target: studentInfo?.guardianPhone || '+1 (555) 441-9921',
            recipient: `${a.name}'s Guardian (${studentInfo?.guardianName || 'Parent'})`,
            status: 'Queued',
            time: 'Just now',
            description: `Automated absence notification for ${a.name} (${section || 'Section'})`,
          });
        });
      }

      const totalCount = res?.data?.total !== undefined ? res.data.total : result.total;
      const absentCount = res?.data?.absentCount !== undefined ? res.data.absentCount : result.absentCount;

      addAuditLog(
        'ATTENDANCE_BATCH_SAVE',
        `Submitted ${totalCount} attendance records for ${section} on ${targetDate}. ${absentCount} absence alerts dispatched.`,
        currentUser?.name || 'Dr. Evelyn Reed (Teacher)'
      );

      return { success: true, total: totalCount, absentCount, absentRecords: result.absentRecords };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 4. Invoice & Fee Actions
  const addInvoice = async (newInvoice) => {
    const created = {
      ...newInvoice,
      id: newInvoice.id,
      paymentDate: null,
      receipt: null,
    };

    try {
      const res = await api.finance.createInvoice(created);
      const saved = res.data || created;
      setInvoices((prev) => [saved, ...prev]);
      addAuditLog('INVOICE_GENERATED', `Generated invoice ${saved.id} for ${saved.term} ($${saved.amount})`, 'Super Admin');
      return { success: true, invoice: saved };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateInvoiceStatus = async (invoiceId, nextStatus, receiptNo) => {
    if (nextStatus === 'Paid') {
      const res = settleInvoice({ invoiceId, invoices, receiptNo });
      if (!res.success) return res;

      try {
        const payRes = await api.finance.payInvoice(invoiceId, res.settledInvoice.receipt);
        const actualReceipt = payRes.data?.receipt || res.settledInvoice.receipt;
        const updatedInvoice = { ...res.settledInvoice, receipt: actualReceipt };

        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv))
        );

        if (res.isNewPayment) {
          queueJob({
            id: `q-${Date.now()}-receipt`,
            type: 'EMAIL_DISPATCH',
            target: 'billing@family.net',
            recipient: `Payment Confirmation: ${updatedInvoice.id}`,
            status: 'Completed',
            time: 'Just now',
            description: `Receipt ${actualReceipt} for $${updatedInvoice.amount} sent to account holder`,
          });
          addAuditLog('PAYMENT_SETTLED', `Invoice ${invoiceId} marked as Paid. Receipt ${actualReceipt} generated.`, 'Registrar Admissions Staff');
        }
        return { success: true, settledInvoice: updatedInvoice, isNewPayment: res.isNewPayment };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: nextStatus } : inv))
    );
    return { success: true };
  };

  const bulkGenerateInvoices = async (data) => {
    try {
      const res = await api.finance.bulkGenerate(data);
      // Reload invoices from backend to capture new batch
      const updatedList = await api.finance.getInvoices();
      if (Array.isArray(updatedList?.data)) {
        setInvoices(updatedList.data);
      }
      addAuditLog('BULK_INVOICES_ISSUED', `Issued ${res.data?.invoicesCreated || 0} batch invoices for ${data.term}`, currentUser?.name || 'Accountant');
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const cancelInvoice = async (invoiceId, reason) => {
    try {
      await api.finance.cancelInvoice(invoiceId, reason);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'Cancelled' } : inv))
      );
      addAuditLog('INVOICE_CANCELLED', `Voided invoice ${invoiceId}. Reason: ${reason || 'Administrative waiver'}`, currentUser?.name || 'Finance Officer');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 5. Gradebook Actions
  const updateGrade = (studentId, field, rawValue, subject = null) => {
    const updatedGrades = updateGradeRecord({
      grades,
      studentId,
      field,
      rawValue,
      subject,
    });
    setGrades(updatedGrades);
  };

  // 6. User Management Actions
  const toggleUserStatus = (userId) => {
    api.users.toggleStatus(userId).catch((err) => {
      console.warn('Backend user status toggle sync notice:', err.message);
    });

    setSystemUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
          if (nextStatus === 'Disabled') {
            queueJob({
              id: `q-${Date.now()}-usr`,
              type: 'SECURITY_AUTH',
              target: u.email,
              recipient: u.name,
              status: 'Completed',
              time: 'Just now',
              description: `Account credentials revoked and active JWT session terminated for ${u.name}`,
            });
          }
          addAuditLog('USER_STATUS_CHANGE', `Account status for ${u.name} toggled to ${nextStatus}`, 'Super Admin');
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const addUser = async (userData) => {
    try {
      const res = await api.users.create(userData);
      const created = res.data || userData;
      setSystemUsers((prev) => [created, ...prev]);
      addAuditLog('USER_ACCOUNT_CREATION', `Account created for ${created.name} (${created.email})`, 'Super Admin');
      return { success: true, user: created };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 7. Document Vault Actions
  const addDocument = async (newDoc) => {
    const created = {
      ...newDoc,
      id: newDoc.id,
      uploadedAt: new Date().toISOString().slice(0, 10),
      status: 'Verified',
    };

    try {
      const res = await api.documents.upload(created);
      const saved = res.data || created;
      setDocuments((prev) => [saved, ...prev]);
      addAuditLog('DOCUMENT_UPLOAD', `Vault ingested ${saved.title} for ${saved.studentName}`, 'Registrar Admissions Staff');
      return { success: true, document: saved };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 8. Exam Scheduler Actions
  const addExam = async (newExam) => {
    const created = {
      ...newExam,
      id: newExam.id,
      status: 'Scheduled',
    };

    try {
      const res = await api.exams.create(created);
      const saved = res.data || created;
      setExamSchedules((prev) => [saved, ...prev]);
      addAuditLog('EXAM_SESSION_SCHEDULED', `Session scheduled: ${saved.title} (${saved.classLevel}) in ${saved.hall}`, 'Dean Vance (Principal)');
      return { success: true, exam: saved };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 9. RBAC Policy Actions
  const saveRbacMatrix = async (newMatrix) => {
    setRbacMatrix(newMatrix);
    try {
      await api.rbac.updateMatrix(newMatrix);
      addAuditLog('RBAC_POLICY_UPDATE', 'Policy matrix synchronized to institutional RBAC engine', 'Super Admin');
    } catch (err) {
      console.warn('Backend RBAC policy sync error:', err.message);
    }
  };

  const resetRbacMatrix = async () => {
    try {
      const res = await api.rbac.resetMatrix();
      if (res?.data) {
        setRbacMatrix(res.data);
      }
      addAuditLog('RBAC_POLICY_RESET', 'Permissions restored to institutional baseline', 'Super Admin');
    } catch (err) {
      console.warn('Backend RBAC policy reset error:', err.message);
    }
  };

  // 10. Academic Rollover Action
  const simulateAcademicRollover = async () => {
    try {
      const res = await api.academics.simulateRollover();
      addAuditLog('ACADEMIC_ROLLOVER_SIMULATION', 'Multi-year isolation rollover executed successfully', 'Dean Vance (Principal)');
      return res;
    } catch (err) {
      console.warn('Backend rollover simulation error:', err.message);
    }
  };

  // Context value object
  const value = {
    // Auth & Navigation
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    isAuthLoading,
    isDataLoading,
    authError,
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole: handleRoleChange,
    academicYear,
    setAcademicYear,
    isDarkMode,
    toggleDarkMode,
    login,
    logout,
    refreshData: loadBackendData,

    // Student Profile Navigation
    viewingStudentProfileId,
    setViewingStudentProfileId,
    navigateToStudentProfile,
    closeStudentProfile,

    // Core Entities
    students,
    staff,
    attendance,
    invoices,
    grades,
    classes,
    academicYears,
    queueJobs,
    systemUsers,
    documents,
    examSchedules,
    rbacMatrix,
    setRbacMatrix,
    auditLogs,

    // Student operations
    addStudent,
    bulkImportStudents,
    deleteStudent,
    updateStudent,
    updateStudentStatus,
    promoteStudents,
    openStudentIdCard,

    // Staff operations
    addStaff,
    deleteStaff,

    // Attendance operations
    fetchAttendanceRoster,
    updateAttendanceStatus,
    updateAttendanceRemark,
    markAllAttendance,
    submitAttendanceBatch,

    // Invoices operations
    addInvoice,
    bulkGenerateInvoices,
    updateInvoiceStatus,
    cancelInvoice,

    // Gradebook operations
    updateGrade,

    // User operations
    addUser,
    toggleUserStatus,

    // Document operations
    addDocument,

    // Exam operations
    addExam,

    // RBAC & Academics
    saveRbacMatrix,
    resetRbacMatrix,
    simulateAcademicRollover,

    // Queue & Audit operations
    queueJob,
    addAuditLog,

    // Modals & Drawers
    isAdmissionModalOpen,
    setIsAdmissionModalOpen,
    isBulkImportOpen,
    setIsBulkImportOpen,
    isPromotionModalOpen,
    setIsPromotionModalOpen,
    isIdCardModalOpen,
    setIsIdCardModalOpen,
    selectedStudentForIdCard,
    setSelectedStudentForIdCard,
    isNotificationOpen,
    setIsNotificationOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}
