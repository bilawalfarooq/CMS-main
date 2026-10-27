import React from 'react';
import { X, Printer, School, ShieldCheck, Phone, MapPin, Heart } from 'lucide-react';

export default function StudentIdCardModal({ isOpen, onClose, student }) {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate simulated barcode bars based on student ID string
  const generateBarcodeBars = (str) => {
    const bars = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      bars.push(code % 2 === 0 ? 3 : 1.5);
      bars.push(2);
      bars.push(code % 3 === 0 ? 4 : 2);
      bars.push(1.5);
    }
    return bars;
  };

  const barcodeBars = generateBarcodeBars(student.id || 'STU-2026-0001');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-id-card-container, #printable-id-card-container * {
            visibility: visible !important;
          }
          #printable-id-card-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (No print) */}
        <div className="no-print px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Student Identity Credential</h3>
              <p className="text-xs text-slate-300">Official EduCore SIS Institutional ID Card</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / ID Card Preview Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-900/50">
          <div id="printable-id-card-container" className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl">
            
            {/* FRONT OF ID CARD */}
            <div className="w-full aspect-[1/1.58] max-w-[280px] mx-auto bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden flex flex-col text-slate-900 relative">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-brand-700 via-indigo-800 to-brand-900 text-white p-3.5 text-center relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-sm" />
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-white">
                    <School className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-black text-xs tracking-wider uppercase">EDUCORE ACADEMY</h4>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-brand-200 font-semibold">
                  Official Student Identity Card
                </p>
              </div>

              {/* Card Main Body */}
              <div className="p-4 flex-1 flex flex-col items-center justify-between text-center">
                {/* Photo */}
                <div className="relative mt-1">
                  <img 
                    src={student.avatar} 
                    alt={student.name}
                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-brand-600 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full ring-2 ring-white shadow">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Name & Academic Class */}
                <div className="space-y-0.5 my-2">
                  <h5 className="font-black text-sm text-slate-900 leading-tight">
                    {student.name}
                  </h5>
                  <p className="text-[11px] font-bold text-brand-700">
                    {student.grade} &bull; {student.section}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Roll #{' '}
                    <span className="font-mono font-bold text-slate-800">
                      {student.rollNo || 'N/A'}
                    </span>
                  </p>
                </div>

                {/* Details Badges */}
                <div className="w-full grid grid-cols-2 gap-1.5 py-1.5 px-2 bg-slate-50 rounded-xl border border-slate-200/80 text-[10px]">
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">SIS ID</span>
                    <span className="font-mono font-bold text-slate-800">{student.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">Blood Group</span>
                    <span className="font-bold text-rose-600">{student.bloodGroup || 'O+'}</span>
                  </div>
                </div>

                {/* Barcode Strip */}
                <div className="w-full pt-2 flex flex-col items-center">
                  <svg className="h-7 w-36" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <rect width="100" height="24" fill="#ffffff" />
                    {barcodeBars.map((w, idx) => {
                      const x = idx * 3.2;
                      if (x > 96) return null;
                      return (
                        <rect
                          key={idx}
                          x={x}
                          y="0"
                          width={w}
                          height="20"
                          fill="#0f172a"
                        />
                      );
                    })}
                  </svg>
                  <span className="text-[8px] font-mono tracking-widest text-slate-500 mt-0.5">
                    *{student.id}*
                  </span>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-800" />
            </div>

            {/* BACK OF ID CARD */}
            <div className="w-full aspect-[1/1.58] max-w-[280px] mx-auto bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden flex flex-col justify-between text-slate-800 p-4 relative">
              <div className="space-y-3">
                <div className="border-b border-slate-200 pb-2 text-center">
                  <h6 className="font-bold text-[11px] text-slate-900 uppercase tracking-wide">
                    Institutional Policies &amp; Contact
                  </h6>
                  <p className="text-[9px] text-slate-500">
                    Valid for Academic Year {student.academicYear || '2026 - 2027'}
                  </p>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-900">Guardian Contact:</span>
                      <span className="text-slate-600">{student.guardianName} ({student.guardianPhone})</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-900">Emergency Line:</span>
                      <span className="text-slate-600">{student.emergencyContact || '+1 (555) 911-0000'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-900">Campus Address:</span>
                      <span className="text-slate-600">EduCore Academy, 742 Evergreen Terrace</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Policy & Authorized Signature */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-[8px] text-slate-500 text-center leading-tight">
                  This card is non-transferable and remains the property of EduCore International Academy.
                  If found, please deposit in any postal mailbox or return to the Registrar Office.
                </p>

                <div className="flex items-end justify-between px-2 pt-1">
                  <div className="text-left">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold block">Issued</span>
                    <span className="text-[9px] font-mono font-bold text-slate-700">
                      {student.admissionDate || '2026-08-15'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-serif italic text-xs text-brand-900 block leading-none">Evelyn Reed</span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold block border-t border-slate-300 mt-0.5 pt-0.5">
                      Registrar Seal
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions (No Print) */}
        <div className="no-print p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Complies with ISO/IEC 7810 ID-1 standard dimensions (CR80)
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 font-bold text-white rounded-xl shadow-md shadow-brand-600/30 transition flex items-center gap-1.5 text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Credential Card</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
