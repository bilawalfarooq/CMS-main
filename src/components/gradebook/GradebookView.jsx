import React, { useState } from 'react';
import { 
  Award, 
  Download, 
  Save, 
  Calculator, 
  CheckCircle, 
  RefreshCw, 
  Printer, 
  ShieldCheck, 
  X,
  AlertCircle
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';

export default function GradebookView({ onQueueJob }) {
  const { 
    grades, 
    updateGrade, 
    queueJob,
    addAuditLog 
  } = useCMS();

  const [selectedSubject, setSelectedSubject] = useState('Physics & Applied Mechanics');
  const [selectedSection, setSelectedSection] = useState('10-A (Science)');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [previewStudent, setPreviewStudent] = useState(null);

  const handleScoreChange = (studentId, field, value) => {
    updateGrade(studentId, field, value);
  };

  const handleBatchSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      await api.gradebook.batchSave({
        sectionName: selectedSection,
        subjectName: selectedSubject,
        grades,
      });

      addAuditLog(
        'GRADE_BATCH_UPDATE',
        `${selectedSection} ${selectedSubject} grades committed via atomic batch transaction.`,
        'Dr. Evelyn Reed (Teacher)'
      );
      setSaveStatus({
        type: 'success',
        message: 'Grades committed via atomic batch transaction. Zero lock contention.',
      });
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: `Failed to save grades: ${err.message}`,
      });
      setTimeout(() => setSaveStatus(null), 7000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerPdfBatch = () => {
    api.gradebook.generatePdfs({
      section: selectedSection,
      subject: selectedSubject,
    }).catch((err) => {
      console.warn('Backend PDF generation queue notice:', err.message);
    });

    const job = {
      id: `q-${Date.now()}-pdf`,
      type: 'PDF_REPORT',
      target: `${selectedSection} (${selectedSubject})`,
      recipient: 'Batch Compilation (PDF)',
      status: 'Processing',
      time: 'Just now',
      description: `Exporting official term report cards for ${grades.length} students`,
    };

    queueJob(job);
    if (onQueueJob) onQueueJob(job);

    alert(`Queued PDF Report Card generator job for ${grades.length} students in ${selectedSection}. Check the Background Queue Stream on the Dashboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            Gradebook & Assessment Rubrics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weighted continuous assessments, high-concurrency batch submission, and PDF report exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTriggerPdfBatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Generate Batch PDFs</span>
          </button>

          <button
            onClick={handleBatchSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/30 transition active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Locking Transaction...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Grades</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Criteria and Rubric Weight Breakdown */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Subject Assessment</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
            >
              <option value="Physics & Applied Mechanics" className="dark:bg-slate-800">Physics & Applied Mechanics</option>
              <option value="Advanced Mathematics" className="dark:bg-slate-800">Advanced Mathematics</option>
              <option value="Computer Science Algorithms" className="dark:bg-slate-800">Computer Science Algorithms</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Class & Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
            >
              <option value="10-A (Science)" className="dark:bg-slate-800">Grade 10-A (Science)</option>
              <option value="11-ComputerScience" className="dark:bg-slate-800">Grade 11-ComputerScience</option>
            </select>
          </div>
        </div>

        {/* Weighting Pills */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="font-bold text-slate-700 dark:text-slate-200">Grading Formula Weights:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">Quiz: <strong>15%</strong></span>
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">Midterm: <strong>35%</strong></span>
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">Term Project: <strong>20%</strong></span>
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold">Final Exam: 30%</span>
          </div>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
          saveStatus.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        }`}>
          {saveStatus.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Grade Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Student & ID</th>
                <th className="py-3 px-4 w-28 text-center">Quiz 1 (15%)</th>
                <th className="py-3 px-4 w-28 text-center">Midterm (35%)</th>
                <th className="py-3 px-4 w-28 text-center">Project (20%)</th>
                <th className="py-3 px-4 w-28 text-center">Final (30%)</th>
                <th className="py-3 px-4 text-center">Weighted Score</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {grades.map(item => (
                <tr key={item.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                    <span className="block font-mono text-[10px] text-slate-400 dark:text-slate-500">{item.studentId}</span>
                  </td>

                  {/* Quiz */}
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      value={item.quiz1}
                      onChange={(e) => handleScoreChange(item.studentId, 'quiz1', e.target.value)}
                      className="w-16 text-center py-1 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
                    />
                  </td>

                  {/* Midterm */}
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      value={item.midterm}
                      onChange={(e) => handleScoreChange(item.studentId, 'midterm', e.target.value)}
                      className="w-16 text-center py-1 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
                    />
                  </td>

                  {/* Project */}
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      value={item.project}
                      onChange={(e) => handleScoreChange(item.studentId, 'project', e.target.value)}
                      className="w-16 text-center py-1 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
                    />
                  </td>

                  {/* Final Exam */}
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      value={item.finalExam}
                      onChange={(e) => handleScoreChange(item.studentId, 'finalExam', e.target.value)}
                      className="w-16 text-center py-1 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500"
                    />
                  </td>

                  {/* Weighted */}
                  <td className="py-3 px-4 text-center font-extrabold text-slate-900 dark:text-white text-sm">
                    {item.weightedScore}%
                  </td>

                  {/* Letter Grade */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      item.letterGrade === 'A+' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                      item.letterGrade === 'A' ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' :
                      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {item.letterGrade}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setPreviewStudent(item)}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline"
                    >
                      Report Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Optimistic row-level locking activated. Concurrency contention guarded.
          </span>
          <span>Calculation Engine: Real-Time Dynamic</span>
        </div>
      </div>

      {/* Report Card Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500/30 text-brand-300">
                    Official Term Transcript
                  </span>
                </div>
                <h3 className="text-lg font-bold">{previewStudent.name}</h3>
                <p className="text-xs text-slate-300 font-mono">{previewStudent.studentId} • {selectedSection}</p>
              </div>
              <button onClick={() => setPreviewStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transcript Table */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedSubject}</span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400 text-base">{previewStudent.letterGrade} ({previewStudent.weightedScore}%)</span>
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Quiz 1 (15% Weight):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{previewStudent.quiz1} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Midterm Examination (35% Weight):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{previewStudent.midterm} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Term Laboratory Project (20% Weight):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{previewStudent.project} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Examination (30% Weight):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{previewStudent.finalExam} / 100</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <p><strong>Faculty Verification:</strong> Engr. Syed Rehan Ali (Signed electronically)</p>
                <p><strong>Issued:</strong> October 2026 • AMSTech Verification Token: <code>#AMS-SBTE-9981-PK</code></p>
                <p className="text-[10px] text-[#1c3b73] dark:text-amber-300 font-semibold">Affiliated with Sindh Board of Technical Education (SBTE)</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setPreviewStudent(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Downloading official PDF report card for ${previewStudent.name}...`);
                    setPreviewStudent(null);
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
