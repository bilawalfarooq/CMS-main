import React, { lazy, Suspense } from 'react';
import './index.css';
import { CMSProvider, useCMS } from './context/CMSContext';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoginView from './components/auth/LoginView';

// Code-split dynamic views
const DashboardView = lazy(() => import('./components/dashboard/DashboardView'));
const StudentListView = lazy(() => import('./components/students/StudentListView'));
const StudentProfileView = lazy(() => import('./components/students/StudentProfileView'));
const StudentModal = lazy(() => import('./components/students/StudentModal'));
const BulkImportModal = lazy(() => import('./components/students/BulkImportModal'));
const StudentPromotionModal = lazy(() => import('./components/students/StudentPromotionModal'));
const StudentIdCardModal = lazy(() => import('./components/students/StudentIdCardModal'));
const StaffListView = lazy(() => import('./components/staff/StaffListView'));
const ClassManagementView = lazy(() => import('./components/academics/ClassManagementView'));
const AcademicHierarchyView = lazy(() => import('./components/academics/AcademicHierarchyView'));
const TimetableView = lazy(() => import('./components/timetable/TimetableView'));
const AttendanceEngineView = lazy(() => import('./components/attendance/AttendanceEngineView'));
const GradebookView = lazy(() => import('./components/gradebook/GradebookView'));
const GuardianPortalView = lazy(() => import('./components/portal/GuardianPortalView'));

const NotificationDrawer = lazy(() => import('./components/notifications/NotificationDrawer'));
const RbacMatrixView = lazy(() => import('./components/security/RbacMatrixView'));
const AuditLogsView = lazy(() => import('./components/security/AuditLogsView'));
const FeeBillingView = lazy(() => import('./components/finance/FeeBillingView'));
const DocumentVaultView = lazy(() => import('./components/documents/DocumentVaultView'));
const ExamSchedulerView = lazy(() => import('./components/exams/ExamSchedulerView'));
const CommandPaletteModal = lazy(() => import('./components/layout/CommandPaletteModal'));
const UserManagementView = lazy(() => import('./components/users/UserManagementView'));

import { School } from 'lucide-react';

function ViewLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-3 w-80 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded"></div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-600 rounded"></div>
            <div className="h-2 w-36 bg-slate-100 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
      <div className="h-72 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-50 dark:bg-slate-700/40 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const {
    isAuthenticated,
    isAuthLoading,
    isDataLoading,
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    academicYear,
    setAcademicYear,
    academicYears,
    students,
    staff,
    queueJobs,
    isDarkMode,
    toggleDarkMode,
    isAdmissionModalOpen,
    setIsAdmissionModalOpen,
    isBulkImportOpen,
    setIsBulkImportOpen,
    viewingStudentProfileId,
    closeStudentProfile,
    navigateToStudentProfile,
    isPromotionModalOpen,
    setIsPromotionModalOpen,
    isIdCardModalOpen,
    setIsIdCardModalOpen,
    selectedStudentForIdCard,
    isNotificationOpen,
    setIsNotificationOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    addStudent,
    bulkImportStudents,
    deleteStudent,
    addStaff,
    queueJob,
    login,
    logout,
  } = useCMS();

  // If role is guardian or student and activeTab is dashboard, redirect to portal
  React.useEffect(() => {
    if ((currentRole === 'guardian' || currentRole === 'student') && activeTab === 'dashboard') {
      setActiveTab('portal');
    }
  }, [currentRole, activeTab, setActiveTab]);

  // If checking existing stored token, show loading splash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0d1933] flex flex-col items-center justify-center text-white">
        <div className="p-3 rounded-2xl bg-white shadow-xl shadow-black/30 mb-3 animate-pulse">
          <img src="/logo.webp" alt="AMSTech" className="w-10 h-10 object-contain" />
        </div>
        <p className="text-xs text-amber-300 font-semibold tracking-wide">AMSTech Session Authorization...</p>
        <p className="text-[10px] text-slate-400 mt-1">Al-Mustafa Institute of Science &amp; Technology</p>
      </div>
    );
  }

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return <LoginView onLogin={login} />;
  }

  const activeQueueCount = queueJobs.filter(
    (j) => j.status === 'Queued' || j.status === 'Processing'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole}
        academicYears={academicYears}
        academicYear={academicYear}
        setAcademicYear={setAcademicYear}
        onOpenQuickAdmission={() => setIsAdmissionModalOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={logout}
        queueCount={activeQueueCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentRole={currentRole}
          studentCount={students.length}
          hasAttendanceAnomaly={students.some((s) => s.anomalyAlert)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {isDataLoading && students.length === 0 ? (
            <ViewLoadingSkeleton />
          ) : (
            <Suspense fallback={<ViewLoadingSkeleton />}>
              {activeTab === 'dashboard' && (
                (currentRole === 'guardian' || currentRole === 'student') ? (
                  <GuardianPortalView 
                    onQueueJob={queueJob}
                  />
                ) : (
                  <DashboardView 
                    students={students} 
                    staff={staff}
                    setActiveTab={setActiveTab}
                    onOpenQuickAdmission={() => setIsAdmissionModalOpen(true)}
                    currentRole={currentRole}
                  />
                )
              )}

              {activeTab === 'portal' && (
                <GuardianPortalView 
                  onQueueJob={queueJob}
                />
              )}

              {activeTab === 'students' && (
                viewingStudentProfileId ? (
                  <StudentProfileView 
                    studentId={viewingStudentProfileId}
                    onBack={closeStudentProfile}
                  />
                ) : (
                  <StudentListView 
                    students={students}
                    onDeleteStudent={deleteStudent}
                    onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
                    onOpenBulkImport={() => setIsBulkImportOpen(true)}
                    currentRole={currentRole}
                  />
                )
              )}

              {activeTab === 'staff' && (
                <StaffListView 
                  staff={staff}
                  onAddStaff={addStaff}
                  currentRole={currentRole}
                />
              )}

              {activeTab === 'classes' && (
                <ClassManagementView currentRole={currentRole} />
              )}

              {activeTab === 'academics' && (
                <AcademicHierarchyView 
                  currentRole={currentRole}
                />
              )}

              {activeTab === 'timetable' && (
                <TimetableView />
              )}

              {activeTab === 'attendance' && (
                <AttendanceEngineView 
                  onQueueJob={queueJob}
                />
              )}

              {activeTab === 'gradebook' && (
                <GradebookView 
                  onQueueJob={queueJob}
                />
              )}

              {activeTab === 'exams' && (
                <ExamSchedulerView />
              )}

              {activeTab === 'fees' && (
                <FeeBillingView />
              )}

              {activeTab === 'documents' && (
                <DocumentVaultView />
              )}

              {activeTab === 'users' && (
                <UserManagementView 
                  onQueueJob={queueJob}
                />
              )}

              {activeTab === 'rbac' && (
                <RbacMatrixView />
              )}

              {activeTab === 'audit' && (
                <AuditLogsView />
              )}


            </Suspense>
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        {/* Student Admission Modal */}
        {isAdmissionModalOpen && (
          <StudentModal 
            isOpen={isAdmissionModalOpen}
            onClose={() => setIsAdmissionModalOpen(false)}
            onAddStudent={addStudent}
          />
        )}

        {/* Bulk CSV Import Modal */}
        {isBulkImportOpen && (
          <BulkImportModal 
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            onImportStudents={bulkImportStudents}
          />
        )}

        {/* Student Promotion Modal */}
        {isPromotionModalOpen && (
          <StudentPromotionModal 
            isOpen={isPromotionModalOpen}
            onClose={() => setIsPromotionModalOpen(false)}
          />
        )}

        {/* Student ID Card Modal */}
        {isIdCardModalOpen && (
          <StudentIdCardModal 
            isOpen={isIdCardModalOpen}
            onClose={() => setIsIdCardModalOpen(false)}
            student={selectedStudentForIdCard}
          />
        )}

        {/* Notification Drawer */}
        <NotificationDrawer 
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          queueJobs={queueJobs}
        />

        {/* Global Command Palette (Ctrl + K) */}
        <CommandPaletteModal 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            if (tab === 'students') closeStudentProfile();
          }}
          onSelectStudent={(studentId) => {
            navigateToStudentProfile(studentId);
          }}
          onOpenAdmission={() => setIsAdmissionModalOpen(true)}
          students={students}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <CMSProvider>
      <AppContent />
    </CMSProvider>
  );
}
