import React, { useState } from 'react';
import { 
  FolderArchive, 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  HardDrive, 
  Eye, 
  Sparkles,
  X
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { STUDENT_DOCUMENTS } from '../../data/mockData';

export default function DocumentVaultView() {
  const { documents: contextDocs, addDocument } = useCMS();
  const documents = contextDocs && contextDocs.length > 0 ? contextDocs : STUDENT_DOCUMENTS;
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // New doc state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Identity');
  const [newStudentName, setNewStudentName] = useState('Aisha Al-Mansoor');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const filtered = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError(`File rejected: Size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the architectural 2.0 MB maximum ceiling (Limitation 7.4).`);
      return;
    }

    setUploadError('');
    setUploading(true);

    const created = {
      studentId: 'STU-2026-0101',
      studentName: newStudentName,
      title: newTitle || file.name,
      category: newCategory,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      sizeBytes: file.size,
      mimeType: file.type || 'application/pdf',
      status: 'Verified'
    };

    if (addDocument) {
      const res = await addDocument(created);
      if (res && res.success === false) {
        setUploadError(`Upload failed: ${res.error || 'Server rejected file'}`);
        setUploading(false);
        return;
      }
    }
    setUploading(false);
    setShowUploadModal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-brand-600" />
            Student Document & Media Vault (S3 Compliance)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Encrypted object repository enforcing strict 2.0 MB upload ceilings and presigned access endpoints.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* S3 Compliance Card */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold">AWS S3 / MinIO Direct Presigned Streaming</h4>
            <p className="text-[11px] text-slate-300">
              Web server filesystem remains stateless; files are streamed with signed expiration tokens.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
          Max Ceiling: 2.0 MB Enforced
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by student name, ID, or title..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Identity">Identity</option>
              <option value="Legal">Legal</option>
              <option value="Health">Health</option>
              <option value="Academic">Academic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doc => (
          <div 
            key={doc.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {doc.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{doc.size}</span>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                {doc.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Student: <strong>{doc.studentName}</strong> ({doc.studentId})
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-slate-400">
                Uploaded: {doc.uploadedAt}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-50"
                  title="View Metadata"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert(`Streaming presigned download token for ${doc.title}...`)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Upload Student Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Student Record</label>
                <select
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                >
                  <option value="Aisha Al-Mansoor">Aisha Al-Mansoor (STU-2026-0101)</option>
                  <option value="Liam Alexander Vance">Liam Alexander Vance (STU-2026-0102)</option>
                  <option value="Chloe Isabella Chen">Chloe Isabella Chen (STU-2026-0103)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Document Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none"
                >
                  <option value="Identity">Identity (National ID / Passport)</option>
                  <option value="Legal">Legal (Birth Certificate)</option>
                  <option value="Health">Health (Medical & Vaccination)</option>
                  <option value="Academic">Academic (Past Transcripts)</option>
                </select>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center">
                <input
                  type="file"
                  id="vaultUploadInput"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="vaultUploadInput" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-brand-600 mx-auto mb-1.5" />
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">Select PDF or Scanned Document</span>
                  <span className="text-[10px] text-slate-400">Strict max: 2.0 MB (Auto-validated)</span>
                </label>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploading && (
                <p className="text-center text-brand-600 font-bold">Streaming to S3 presigned endpoint...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{previewDoc.title}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <p><strong>Student:</strong> {previewDoc.studentName} ({previewDoc.studentId})</p>
              <p><strong>Category:</strong> {previewDoc.category}</p>
              <p><strong>Filesize:</strong> {previewDoc.size}</p>
              <p><strong>S3 URI:</strong> <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">{previewDoc.s3Key}</code></p>
              <p><strong>Status:</strong> <span className="text-emerald-600 font-bold">{previewDoc.status}</span></p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 font-semibold rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
