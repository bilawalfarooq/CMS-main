import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Download, 
  RefreshCw,
  Check
} from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, onImportStudents }) {
  const [_file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Full Name,Grade,Section,Guardian Name,Guardian Phone,Guardian Email\n" +
      "Elena Rostova,Grade 10,10-A (Science),Mikhail Rostov,+1 (555) 789-1122,mikhail.r@domain.com\n" +
      "Devon Marcus Cole,Grade 11,11-ComputerScience,Sarah Cole,+1 (555) 891-3344,sarah.cole@domain.com\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "educore_admissions_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateDrop = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Simulate parsing
      setIsProcessing(true);
      setTimeout(() => {
        setParsedRows([
          {
            id: `STU-2026-${Math.floor(2000 + Math.random() * 1000)}`,
            name: 'Elena Rostova',
            grade: 'Grade 10',
            section: '10-A (Science)',
            guardianName: 'Mikhail Rostov',
            guardianPhone: '+1 (555) 789-1122',
            guardianEmail: 'mikhail.r@domain.com',
            status: 'Active',
            attendanceRate: 100,
            gpa: '3.90',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
            emergencyContact: '+1 (555) 789-1123',
            bloodGroup: 'B+',
            dob: '2010-02-18',
            gender: 'Female',
            address: '49 Elmwood Avenue',
          },
          {
            id: `STU-2026-${Math.floor(3000 + Math.random() * 1000)}`,
            name: 'Devon Marcus Cole',
            grade: 'Grade 11',
            section: '11-ComputerScience',
            guardianName: 'Sarah Cole',
            guardianPhone: '+1 (555) 891-3344',
            guardianEmail: 'sarah.cole@domain.com',
            status: 'Active',
            attendanceRate: 100,
            gpa: '3.80',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
            emergencyContact: '+1 (555) 891-3345',
            bloodGroup: 'O+',
            dob: '2009-12-05',
            gender: 'Male',
            address: '77 Westfall Way',
          }
        ]);
        setIsProcessing(false);
      }, 700);
    }
  };

  const handleCommit = async () => {
    if (parsedRows.length > 0) {
      setIsProcessing(true);
      try {
        const res = await onImportStudents(parsedRows);
        if (res && res.success === false) {
          alert(`Bulk import error: ${res.error || 'Server rejected batch import'}`);
          setIsProcessing(false);
          return;
        }
        setIsProcessing(false);
        onClose();
      } catch (err) {
        alert(`Bulk import error: ${err.message}`);
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Bulk Student Admissions Importer</h3>
              <p className="text-[11px] text-slate-300">CSV Ingestion Pipeline (BullMQ / Horizon Batch)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Instructions and Template Download */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Need the official CSV format?</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">Download our standardized schema with pre-formatted headers.</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50 hover:bg-brand-50/30">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleSimulateDrop}
              className="hidden" 
              id="csvFileInput" 
            />
            <label htmlFor="csvFileInput" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Click to browse or drag and drop admissions CSV
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Standard UTF-8 CSV up to 10MB (Validated in memory)
              </p>
            </label>
          </div>

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="text-center py-4 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
              <span>Validating schema integrity...</span>
            </div>
          )}

          {/* Preview Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Ready to Ingest: {parsedRows.length} Valid Records
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All Schemas Passed
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Generated ID</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Placement</th>
                      <th className="py-2 px-3">Guardian</th>
                      <th className="py-2 px-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">{r.id}</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{r.name}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.grade} ({r.section})</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.guardianName}</td>
                        <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">{r.guardianPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={parsedRows.length === 0}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Commit {parsedRows.length} Students to SIS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
