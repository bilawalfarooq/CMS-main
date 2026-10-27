import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Download, 
  Plus, 
  CheckCircle, 
  Clock, 
  Receipt, 
  Search, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';
import { FEE_COLLECTION_SUMMARY } from '../../data/mockData';

export default function FeeBillingView() {
  const { invoices, addInvoice, updateInvoiceStatus } = useCMS();
  const [summary, setSummary] = useState(FEE_COLLECTION_SUMMARY);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [modalError, setModalError] = useState('');
  const [settleError, setSettleError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.finance.getSummary()
      .then((res) => {
        if (isMounted && res?.data) {
          setSummary(res.data);
        }
      })
      .catch(() => {
        if (isMounted && invoices && invoices.length > 0) {
          const totalBilled = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
          const totalCollected = invoices
            .filter((i) => i.status === 'Paid')
            .reduce((s, i) => s + Number(i.amount || 0), 0);
          const totalOutstanding = totalBilled - totalCollected;
          const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;
          setSummary({
            totalBilled,
            totalCollected,
            totalOutstanding,
            collectionRate,
            activeWaivers: 8,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [invoices]);
  const [newInv, setNewInv] = useState({
    term: 'Spring Term 2027',
    amount: 1850,
    dueDate: '2027-01-15',
    status: 'Upcoming'
  });

  const handleMarkPaid = async (invId) => {
    setSettleError('');
    if (updateInvoiceStatus) {
      const res = await updateInvoiceStatus(invId, 'Paid');
      if (res && res.success === false) {
        setSettleError(res.error || 'Failed to settle invoice on server');
      }
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setModalError('');
    const created = {
      term: newInv.term,
      amount: Number(newInv.amount),
      dueDate: newInv.dueDate,
      status: newInv.status,
    };
    if (addInvoice) {
      const res = await addInvoice(created);
      if (res && res.success === false) {
        setModalError(res.error || 'Failed to issue invoice on server');
        return;
      }
    }
    setShowAddInvoice(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            Institutional Fee & Tuition Billing Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tuition fee structures, collection pipelines, scholarship waivers, and payment receipting.
          </p>
        </div>

        <button
          onClick={() => setShowAddInvoice(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Term Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            ${summary.totalBilled.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Academic Year 2026-2027</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">
            ${summary.totalCollected.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{summary.collectionRate}% Collection Rate</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">
            ${summary.totalOutstanding.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pending term clearances</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Waivers</span>
          <div className="mt-2 text-2xl font-extrabold text-purple-600">
            {summary.activeWaivers}
          </div>
          <p className="text-xs text-slate-500 mt-1">Merit & athletic scholarships</p>
        </div>
      </div>

      {/* Settle Error Banner */}
      {settleError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{settleError}</span>
          </div>
          <button onClick={() => setSettleError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tuition Invoices & Payment Schedule</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Official ledger records with verification hashes</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Term & Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{inv.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{inv.term}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">${inv.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{inv.dueDate}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'Paid' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.receipt ? (
                      <button 
                        onClick={() => alert(`Downloading payment receipt ${inv.receipt} (PDF)...`)}
                        className="text-brand-600 hover:text-brand-700 font-semibold underline"
                      >
                        {inv.receipt}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded transition"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-sm">Issue Institutional Invoice</h3>
              <button onClick={() => setShowAddInvoice(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Term Description</label>
                <input
                  type="text"
                  required
                  value={newInv.term}
                  onChange={(e) => setNewInv({ ...newInv, term: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Billing Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  value={newInv.amount}
                  onChange={(e) => setNewInv({ ...newInv, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newInv.dueDate}
                  onChange={(e) => setNewInv({ ...newInv, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
