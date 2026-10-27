import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Building,
  Users,
  Printer,
  FileText,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  X,
  Sparkles,
  Send,
  Calendar,
  Check,
  Landmark,
  RefreshCw,
  AlertTriangle,
  Layers,
  Percent,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../services/apiClient';

export default function FeeBillingView() {
  const { 
    invoices, 
    students, 
    classes, 
    addInvoice, 
    bulkGenerateInvoices, 
    updateInvoiceStatus, 
    cancelInvoice, 
    queueJob,
    currentRole 
  } = useCMS();

  // Active top navigation tab
  // 'invoices' | 'transactions' | 'structures' | 'waivers' | 'defaulters'
  const [activeTab, setActiveTab] = useState('invoices');

  // Executive summary state
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    collectionRate: 0,
    invoiceCount: 0,
    paidCount: 0,
    upcomingCount: 0,
    overdueCount: 0,
    activeWaivers: 5,
    totalWaiversAmount: 58600,
    totalPaymentsRecorded: 0,
  });

  // Secondary data fetched from backend
  const [paymentsList, setPaymentsList] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [waiversList, setWaiversList] = useState([]);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);

  // Filters for Tab 1 (Invoices)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All');

  // Modals state
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);
  const [settlingInvoice, setSettlingInvoice] = useState(null);
  const [viewingChallanInvoice, setViewingChallanInvoice] = useState(null);
  const [viewingReceiptInvoice, setViewingReceiptInvoice] = useState(null);

  // Form states
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single Invoice Form
  const [singleInvForm, setSingleInvForm] = useState({
    studentId: '',
    term: 'Spring Semester 2027',
    tuitionFee: 24000,
    labCharges: 3000,
    examFee: 2000,
    libraryAndSports: 1000,
    discountAmount: 0,
    dueDate: '2027-02-15',
    notes: 'Official institutional semester voucher',
  });

  // Bulk Invoice Form
  const [bulkForm, setBulkForm] = useState({
    classId: 'c-10',
    sectionId: 'All',
    term: 'Spring Semester 2027',
    amount: 24000,
    dueDate: '2027-02-15',
  });

  // Settlement Form
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'Bank Transfer / 1Link',
    transactionRef: '',
    receiptNo: '',
    notes: 'Paid via verified institutional branch challan',
  });

  // Reminder alert status toast
  const [reminderToast, setReminderToast] = useState(null);

  // Load Executive Summary and Extra datasets
  const loadFinanceData = async () => {
    setIsLoadingExtra(true);
    try {
      const [sumRes, payRes, structRes, wvrRes] = await Promise.allSettled([
        api.finance.getSummary(),
        api.finance.getPayments(),
        api.finance.getFeeStructures(),
        api.finance.getWaivers(),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      } else if (invoices && invoices.length > 0) {
        calculateLocalSummary();
      }

      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value?.data)) {
        setPaymentsList(payRes.value.data);
      }

      if (structRes.status === 'fulfilled' && Array.isArray(structRes.value?.data)) {
        setFeeStructures(structRes.value.data);
      }

      if (wvrRes.status === 'fulfilled' && Array.isArray(wvrRes.value?.data)) {
        setWaiversList(wvrRes.value.data);
      }
    } catch (err) {
      console.warn('Finance data load warning:', err.message);
      calculateLocalSummary();
    } finally {
      setIsLoadingExtra(false);
    }
  };

  const calculateLocalSummary = () => {
    if (!invoices) return;
    const totalBilled = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    const paidInvoices = invoices.filter((i) => i.status === 'Paid');
    const totalCollected = paidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
    const totalOverdue = overdueInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    const upcomingInvoices = invoices.filter((i) => i.status === 'Upcoming');
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

    setSummary({
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionRate,
      invoiceCount: invoices.length,
      paidCount: paidInvoices.length,
      upcomingCount: upcomingInvoices.length,
      overdueCount: overdueInvoices.length,
      activeWaivers: 5,
      totalWaiversAmount: 58600,
      totalPaymentsRecorded: paidInvoices.length,
    });
  };

  useEffect(() => {
    loadFinanceData();
  }, [invoices]);

  // Derived available terms list
  const availableTerms = useMemo(() => {
    const set = new Set(invoices.map((i) => i.term).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        (inv.studentName || '').toLowerCase().includes(q) ||
        (inv.studentRollNo || '').toLowerCase().includes(q) ||
        (inv.term || '').toLowerCase().includes(q) ||
        (inv.receipt || '').toLowerCase().includes(q);

      // Status
      const matchesStatus =
        selectedStatus === 'All' || inv.status.toLowerCase() === selectedStatus.toLowerCase();

      // Class
      const matchesClass =
        selectedClass === 'All' ||
        (inv.className && inv.className.toLowerCase().includes(selectedClass.toLowerCase()));

      // Term
      const matchesTerm = selectedTerm === 'All' || inv.term === selectedTerm;

      return matchesSearch && matchesStatus && matchesClass && matchesTerm;
    });
  }, [invoices, searchQuery, selectedStatus, selectedClass, selectedTerm]);

  // Overdue Defaulters list
  const defaultersList = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'Overdue');
  }, [invoices]);

  // Handlers
  const handleOpenAddModal = () => {
    setModalError('');
    setModalSuccess('');
    const defaultStudent = students[0];
    setSingleInvForm({
      studentId: defaultStudent ? defaultStudent.id : 'STU-2026-0101',
      term: 'Spring Semester 2027',
      tuitionFee: 22000,
      labCharges: 3500,
      examFee: 2000,
      libraryAndSports: 1500,
      discountAmount: 0,
      dueDate: '2027-02-15',
      notes: 'Institutional Term Fee Voucher',
    });
    setShowAddInvoiceModal(true);
  };

  const handleOpenBulkModal = () => {
    setModalError('');
    setModalSuccess('');
    setBulkForm({
      classId: classes[0]?.id || 'c-10',
      sectionId: 'All',
      term: 'Spring Semester 2027',
      amount: 24000,
      dueDate: '2027-02-15',
    });
    setShowBulkInvoiceModal(true);
  };

  const handleCreateSingleInvoice = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    const netAmount = Math.max(
      0,
      Number(singleInvForm.tuitionFee) +
        Number(singleInvForm.labCharges) +
        Number(singleInvForm.examFee) +
        Number(singleInvForm.libraryAndSports) -
        Number(singleInvForm.discountAmount)
    );

    const payload = {
      studentId: singleInvForm.studentId,
      term: singleInvForm.term,
      amount: netAmount,
      dueDate: singleInvForm.dueDate,
      status: 'Upcoming',
      notes: singleInvForm.notes,
    };

    const res = await addInvoice(payload);
    setIsSubmitting(false);

    if (res && res.success === false) {
      setModalError(res.error || 'Failed to issue invoice on server');
    } else {
      setShowAddInvoiceModal(false);
      loadFinanceData();
    }
  };

  const handleCreateBulkInvoices = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    const res = await bulkGenerateInvoices({
      classId: bulkForm.classId,
      sectionId: bulkForm.sectionId,
      term: bulkForm.term,
      amount: Number(bulkForm.amount),
      dueDate: bulkForm.dueDate,
    });

    setIsSubmitting(false);

    if (res && res.success === false) {
      setModalError(res.error || 'Failed to generate bulk class invoices');
    } else {
      setShowBulkInvoiceModal(false);
      loadFinanceData();
    }
  };

  const handleOpenSettleModal = (inv) => {
    setSettlingInvoice(inv);
    setPaymentForm({
      paymentMethod: 'Bank Transfer / 1Link',
      transactionRef: '',
      receiptNo: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Institutional settlement for ${inv.studentName || 'Student'}`,
    });
    setModalError('');
  };

  const handleConfirmSettlement = async (e) => {
    e.preventDefault();
    if (!settlingInvoice) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await updateInvoiceStatus(settlingInvoice.id, 'Paid', {
        receiptNo: paymentForm.receiptNo,
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef,
        notes: paymentForm.notes,
      });

      if (res && res.success === false) {
        setModalError(res.error || 'Failed to settle invoice on server');
      } else {
        setSettlingInvoice(null);
        loadFinanceData();
      }
    } catch (err) {
      setModalError(err.message || 'Settlement error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidInvoice = async (inv) => {
    if (inv.status === 'Paid') {
      alert('Paid invoices cannot be voided.');
      return;
    }
    const confirm = window.confirm(`Are you sure you want to void invoice #${inv.id} for ${inv.studentName}?`);
    if (!confirm) return;

    const res = await cancelInvoice(inv.id, 'Voided via Finance Governance Interface');
    if (res && res.success === false) {
      alert(res.error || 'Could not void invoice');
    } else {
      loadFinanceData();
    }
  };

  const handleSendReminder = (inv) => {
    queueJob({
      id: `q-${Date.now()}-remind`,
      type: 'SMS_NOTIFICATION',
      target: inv.guardianPhone || '+92 333 2189041',
      recipient: `Urgent Fee Reminder: ${inv.studentName} (${inv.id})`,
      status: 'Completed',
      time: 'Just now',
      description: `Dispatched SMS reminder for overdue balance of ₨ ${inv.amount.toLocaleString()} due on ${inv.dueDate}.`,
    });

    setReminderToast(`Dispatched payment notice to guardian of ${inv.studentName}!`);
    setTimeout(() => setReminderToast(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Student Name', 'Roll Number', 'Class', 'Term', 'Amount (PKR)', 'Due Date', 'Status', 'Receipt Number', 'Payment Date'];
    const rows = filteredInvoices.map((i) => [
      i.id,
      `"${i.studentName || ''}"`,
      i.studentRollNo || '',
      `"${i.className || ''}"`,
      `"${i.term || ''}"`,
      i.amount,
      i.dueDate,
      i.status,
      i.receipt || '',
      i.paymentDate || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Institutional_Fee_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Institutional Treasury &amp; Bursar
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Session 2026 - 2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Fee Billing &amp; Institutional Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-0.5">
            Automated tuition fee schedules, computerized 3-copy bank challans, transaction reconciliation, scholarship waivers, and defaulter tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenBulkModal}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>Bulk Class Invoicing</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Term Invoice</span>
          </button>
        </div>
      </div>

      {/* Reminder Alert Notification Toast */}
      {reminderToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-emerald-600 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* 2. Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Billed</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₨ {summary.totalBilled.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{summary.invoiceCount} generated statements</span>
            <span className="font-semibold text-brand-600">FY 2026-27</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Realized Collections</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₨ {summary.totalCollected.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {summary.collectionRate}% Collection Rate
            </span>
            <span className="text-slate-400 font-semibold">{summary.paidCount} Cleared</span>
          </div>
        </div>

        {/* Outstanding & Overdue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Outstanding &amp; Overdue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            ₨ {summary.totalOutstanding.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              ₨ {summary.totalOverdue.toLocaleString()} Overdue
            </span>
            <span className="text-amber-600 font-bold">{summary.overdueCount} Defaulters</span>
          </div>
        </div>

        {/* Scholarships & Waivers */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Scholarships &amp; Waivers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            ₨ {summary.totalWaiversAmount.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{summary.activeWaivers} Active Beneficiaries</span>
            <span className="font-semibold text-purple-600">Merit &amp; Aid</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 font-extrabold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'invoices'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>1. Invoices &amp; Challans ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 font-extrabold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'transactions'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>2. Settlement Stream &amp; Receipts ({paymentsList.length || summary.paidCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2.5 font-extrabold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'structures'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>3. Institutional Fee Schedules ({feeStructures.length || 5})</span>
        </button>

        <button
          onClick={() => setActiveTab('waivers')}
          className={`px-4 py-2.5 font-extrabold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'waivers'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>4. Scholarships &amp; Concessions ({waiversList.length || 5})</span>
        </button>

        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2.5 font-extrabold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'defaulters'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>5. Defaulters &amp; Overdue ({defaultersList.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: INVOICES & CHALLAN MANAGEMENT (PRIMARY LEDGER) */}
      {/* ============================================================== */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll #, invoice #, receipt..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Term Filter */}
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                {availableTerms.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All Terms' : t}
                  </option>
                ))}
              </select>

              <button
                onClick={loadFinanceData}
                title="Refresh Ledger"
                className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-slate-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Student &amp; Roll No</th>
                  <th className="py-3.5 px-4">Class &amp; Section</th>
                  <th className="py-3.5 px-4">Billing Term</th>
                  <th className="py-3.5 px-4">Net Amount</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                      {/* Invoice ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.id}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {inv.studentName || 'Student'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Roll: {inv.studentRollNo || inv.studentId}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {inv.className || 'Technical Division'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {inv.sectionName || 'Section A'}
                        </span>
                      </td>

                      {/* Term */}
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {inv.term}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        ₨ {inv.amount.toLocaleString()}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 dark:text-slate-400 block">{inv.dueDate}</span>
                        {inv.status === 'Overdue' && (
                          <span className="text-[9px] font-extrabold uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                            Action Needed
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : inv.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Challan Voucher */}
                          <button
                            onClick={() => setViewingChallanInvoice(inv)}
                            title="Generate 3-Copy Bank Challan"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-lg transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Challan</span>
                          </button>

                          {/* Settle / Receipt */}
                          {inv.status === 'Paid' ? (
                            <button
                              onClick={() => setViewingReceiptInvoice(inv)}
                              title="View Payment Confirmation Receipt"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-lg transition flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>{inv.receipt || 'Receipt'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSettleModal(inv)}
                              title="Settle Payment"
                              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] rounded-lg transition shadow-xs"
                            >
                              Settle
                            </button>
                          )}

                          {/* Send Reminder (if overdue) */}
                          {inv.status === 'Overdue' && (
                            <button
                              onClick={() => handleSendReminder(inv)}
                              title="Dispatch SMS / Email reminder to guardian"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg transition border border-rose-200 dark:border-rose-800"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          )}

                          {/* Void Invoice (if unpaid) */}
                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleVoidInvoice(inv)}
                              title="Void / Cancel Invoice"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold">No tuition invoices match the current filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SETTLEMENT STREAM & RECONCILIATION */}
      {/* ============================================================== */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>Audited Payment Receipts &amp; Realized Cashflow</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every settled transaction verified by the institutional bursar with deposit references.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Total Realized: ₨ {summary.totalCollected.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Student &amp; Roll No</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Term Description</th>
                  <th className="py-3.5 px-4">Payment Channel</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Settlement Date</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {paymentsList.length > 0 ? (
                  paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {p.studentName}
                        <span className="block text-[10px] text-slate-400 font-normal">Roll: {p.studentRollNo}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                        {p.className}
                      </td>
                      <td className="py-3.5 px-4">{p.term}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₨ {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{p.dateFormatted}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Fallback to filtering paid invoices
                  invoices
                    .filter((i) => i.status === 'Paid')
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {inv.receipt || `REC-${inv.id.slice(-4)}`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {inv.studentName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                          {inv.className || 'Science Division'}
                        </td>
                        <td className="py-3.5 px-4">{inv.term}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {inv.lastPaymentMethod || 'Bank Transfer / 1Link'}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₨ {inv.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{inv.paymentDate || inv.dueDate}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Verified &amp; Reconciled
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: INSTITUTIONAL FEE SCHEDULES */}
      {/* ============================================================== */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                Institutional Fee Structure Catalog
              </h4>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                Official approved tuition rates, laboratory charges, and examination funds approved by the Governing Council.
              </p>
            </div>
            <button
              onClick={() => alert('New fee head structure modal - Approved rates are pre-configured for AY 2026-27.')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Define Class Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStructures.map((fs) => (
              <div
                key={fs.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      {fs.termType} Fee
                    </span>
                    <span className="text-xs font-bold text-slate-400">Due {fs.dueDayOfMonth}th of month</span>
                  </div>

                  <h3 className="font-black text-base text-slate-900 dark:text-white mt-2">{fs.className}</h3>
                  <p className="text-xs text-slate-400">Academic Session {fs.academicYear}</p>

                  <div className="mt-4 space-y-2 border-t border-b border-slate-100 dark:border-slate-700/60 py-3 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Tuition Fee:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₨ {fs.tuitionFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Lab &amp; Applied Mechanics:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₨ {fs.labCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Assessment &amp; Exam Fund:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₨ {fs.examFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Sports &amp; Digital Library:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₨ {fs.libraryAndSports.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Per Term</span>
                    <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                      ₨ {fs.totalPerTerm.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setBulkForm({
                        classId: fs.classId,
                        sectionId: 'All',
                        term: 'Spring Semester 2027',
                        amount: fs.totalPerTerm,
                        dueDate: '2027-02-15',
                      });
                      setShowBulkInvoiceModal(true);
                    }}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-xl border border-brand-200 dark:border-brand-800 transition"
                  >
                    Apply to Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SCHOLARSHIPS & WAIVERS */}
      {/* ============================================================== */}
      {activeTab === 'waivers' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-600" />
                <span>Scholarships, Need-Based Aid &amp; Sibling Concessions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official waiver register approved under institutional financial aid statutes.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Total Aid Granted: ₨ {summary.totalWaiversAmount.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Beneficiary Scholar</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Scholarship Category</th>
                  <th className="py-3.5 px-4">Eligibility Basis</th>
                  <th className="py-3.5 px-4 text-center">Concession</th>
                  <th className="py-3.5 px-4">Amount Waived</th>
                  <th className="py-3.5 px-4 text-right">Awarding Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {waiversList.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {w.studentName}
                      <span className="block text-[10px] text-slate-400 font-normal">Roll: {w.rollNo}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">{w.className}</td>
                    <td className="py-3.5 px-4 font-semibold text-purple-700 dark:text-purple-300">{w.category}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs">{w.criteria}</td>
                    <td className="py-3.5 px-4 text-center font-black text-purple-600 dark:text-purple-400">
                      {w.discountPercent}%
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      ₨ {w.discountAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-medium">{w.awardedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: DEFAULTERS & OVERDUE RECOVERY */}
      {/* ============================================================== */}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Overdue Recovery &amp; Surcharge Notice Board
              </h4>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                Total Overdue Exposure: <strong>₨ {summary.totalOverdue.toLocaleString()}</strong> across {defaultersList.length} delinquent accounts.
              </p>
            </div>
            <button
              onClick={() => {
                defaultersList.forEach((inv) => handleSendReminder(inv));
                alert(`Queued broadcast SMS alerts for all ${defaultersList.length} accounts!`);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Reminders to All</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Student &amp; Roll #</th>
                    <th className="py-3.5 px-4">Class &amp; Section</th>
                    <th className="py-3.5 px-4">Overdue Balance</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Guardian Contact</th>
                    <th className="py-3.5 px-4 text-right">Recovery Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                  {defaultersList.length > 0 ? (
                    defaultersList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">{inv.id}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                          {inv.studentName}
                          <span className="block text-[10px] text-slate-400 font-normal">Roll: {inv.studentRollNo}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {inv.className} ({inv.sectionName || 'Main'})
                        </td>
                        <td className="py-3.5 px-4 font-black text-rose-600 dark:text-rose-400 text-sm">
                          ₨ {inv.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{inv.dueDate}</td>
                        <td className="py-3.5 px-4">
                          <span className="block font-semibold text-slate-800 dark:text-slate-200">{inv.guardianName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{inv.guardianPhone || '+92 333 2189041'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSendReminder(inv)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Dispatch Alert</span>
                            </button>
                            <button
                              onClick={() => handleOpenSettleModal(inv)}
                              className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition shadow-xs"
                            >
                              Settle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        <p className="font-bold text-slate-700 dark:text-slate-200">Zero Critical Overdue Defaulters</p>
                        <p className="text-xs text-slate-400 mt-0.5">All accounts are currently in good standing or fully cleared.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ISSUE INDIVIDUAL TERM INVOICE */}
      {/* ============================================================== */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-400" />
                <h3 className="font-black text-sm">Issue Institutional Tuition Voucher</h3>
              </div>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-white transition">✕</button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSingleInvoice} className="p-6 space-y-4 text-xs">
              {/* Target Student Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target Scholar / Student</label>
                <select
                  required
                  value={singleInvForm.studentId}
                  onChange={(e) => setSingleInvForm({ ...singleInvForm, studentId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Choose Enrolled Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNo || s.id}) • {s.grade || s.classGrade?.name || 'Class'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Academic Term</label>
                  <input
                    type="text"
                    required
                    value={singleInvForm.term}
                    onChange={(e) => setSingleInvForm({ ...singleInvForm, term: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={singleInvForm.dueDate}
                    onChange={(e) => setSingleInvForm({ ...singleInvForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Itemized Fee Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Itemized Fee Heads (PKR)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Tuition Fee</label>
                    <input
                      type="number"
                      value={singleInvForm.tuitionFee}
                      onChange={(e) => setSingleInvForm({ ...singleInvForm, tuitionFee: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Lab Charges</label>
                    <input
                      type="number"
                      value={singleInvForm.labCharges}
                      onChange={(e) => setSingleInvForm({ ...singleInvForm, labCharges: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Exam &amp; Assessment</label>
                    <input
                      type="number"
                      value={singleInvForm.examFee}
                      onChange={(e) => setSingleInvForm({ ...singleInvForm, examFee: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Scholarship / Waiver Discount (-)</label>
                    <input
                      type="number"
                      value={singleInvForm.discountAmount}
                      onChange={(e) => setSingleInvForm({ ...singleInvForm, discountAmount: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold text-purple-600"
                    />
                  </div>
                </div>

                {/* Net Total Preview */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">Net Payable Amount:</span>
                  <span className="text-base font-black text-brand-600 dark:text-brand-400">
                    ₨{' '}
                    {Math.max(
                      0,
                      Number(singleInvForm.tuitionFee) +
                        Number(singleInvForm.labCharges) +
                        Number(singleInvForm.examFee) +
                        Number(singleInvForm.libraryAndSports) -
                        Number(singleInvForm.discountAmount)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Term Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: BULK CLASS INVOICING */}
      {/* ============================================================== */}
      {showBulkInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="font-black text-sm">Batch Class Invoicing &amp; Challan Generation</h3>
              </div>
              <button onClick={() => setShowBulkInvoiceModal(false)} className="text-slate-400 hover:text-white transition">✕</button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBulkInvoices} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target Academic Class</label>
                <select
                  required
                  value={bulkForm.classId}
                  onChange={(e) => setBulkForm({ ...bulkForm, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="All">All Active Enrolled Students (Entire Institute)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level || 'Class'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Billing Term Description</label>
                <input
                  type="text"
                  required
                  value={bulkForm.term}
                  onChange={(e) => setBulkForm({ ...bulkForm, term: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Standard Term Fee (₨)</label>
                  <input
                    type="number"
                    required
                    value={bulkForm.amount}
                    onChange={(e) => setBulkForm({ ...bulkForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={bulkForm.dueDate}
                    onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-[11px] text-indigo-800 dark:text-indigo-300">
                ⚡ Automatically skips students who already possess an issued invoice for this term.
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBulkInvoiceModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition"
                >
                  {isSubmitting ? 'Generating Batch...' : 'Generate Batch Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SETTLE INVOICE & RECEIVE PAYMENT */}
      {/* ============================================================== */}
      {settlingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-black text-sm">Settle Institutional Payment &amp; Issue Receipt</h3>
              </div>
              <button onClick={() => setSettlingInvoice(null)} className="text-slate-400 hover:text-white transition">✕</button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Invoice Brief */}
            <div className="m-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block">INVOICE #{settlingInvoice.id}</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block mt-0.5">
                  {settlingInvoice.studentName}
                </span>
                <span className="text-xs text-slate-500">{settlingInvoice.term}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Due</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ₨ {settlingInvoice.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettlement} className="px-6 pb-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Payment Method / Channel</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="Bank Transfer / 1Link">Bank Transfer / 1Link (Direct Clearing)</option>
                  <option value="Cash Counter Deposit">Cash Counter Deposit (Campus Bursar Office)</option>
                  <option value="Online Portal Gateway">Online Student Portal Gateway (Card / Mobile Wallet)</option>
                  <option value="Cheque / Pay Order">Cheque / Pay Order (Demand Draft)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Bank Reference / Slip #</label>
                  <input
                    type="text"
                    placeholder="e.g. MEZN-948102"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.receiptNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSettlingInvoice(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition"
                >
                  {isSubmitting ? 'Recording Settlement...' : 'Confirm Payment & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: AUTHENTIC 3-COPY BANK FEE CHALLAN VOUCHER */}
      {/* ============================================================== */}
      {viewingChallanInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 my-6">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-600" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Triplicate Bank Fee Challan Voucher
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setViewingChallanInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Triplicate Grid: Bank Copy | Institute Copy | Student Copy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-800 dark:text-slate-200 font-sans">
              {['1. BANK COPY', '2. INSTITUTE COPY', '3. STUDENT / GUARDIAN COPY'].map((copyTitle, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-3.5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="font-extrabold uppercase text-[10px] tracking-wider text-brand-700 dark:text-brand-300 block">
                        {copyTitle}
                      </span>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white mt-0.5">
                        Al-Mustafa Institute of Science &amp; Technology
                      </h4>
                      <p className="text-[10px] text-slate-500">Meezan Bank Ltd • A/C: 0102-094182-01</p>
                    </div>

                    {/* Meta info */}
                    <div className="mt-2.5 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Challan #:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{viewingChallanInvoice.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Due Date:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{viewingChallanInvoice.dueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Student Name:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{viewingChallanInvoice.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Roll No:</span>
                        <span className="font-mono">{viewingChallanInvoice.studentRollNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Class / Section:</span>
                        <span>{viewingChallanInvoice.className}</span>
                      </div>
                    </div>

                    {/* Charges breakdown */}
                    <div className="mt-3 border-t border-b border-slate-200 dark:border-slate-700 py-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Tuition &amp; Instruction:</span>
                        <span className="font-semibold">₨ {Math.round(viewingChallanInvoice.amount * 0.75).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Laboratory &amp; Practical:</span>
                        <span className="font-semibold">₨ {Math.round(viewingChallanInvoice.amount * 0.15).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Examination &amp; Senate:</span>
                        <span className="font-semibold">₨ {Math.round(viewingChallanInvoice.amount * 0.10).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-black text-xs text-brand-700 dark:text-brand-300">
                        <span>Total Payable:</span>
                        <span>₨ {viewingChallanInvoice.amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-400 mt-2 leading-tight">
                      * Late fee surcharge of ₨ 500 applicable post due date. Valid at any online 1Link participating branch.
                    </p>
                  </div>

                  {/* Stamp box */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end text-[10px] text-slate-400">
                    <div className="text-center">
                      <div className="w-20 border-b border-slate-400 mb-1"></div>
                      <span>Bank Cashier Stamp</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 border-b border-slate-400 mb-1"></div>
                      <span>Depositor Sign</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: PAYMENT RECEIPT VOUCHER */}
      {/* ============================================================== */}
      {viewingReceiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Official Payment Receipt
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Al-Mustafa Institute</h3>
              <p className="text-xs text-slate-400">Verification Hash: {viewingReceiptInvoice.receipt || 'REC-VERIFIED'}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice ID:</span>
                <span className="font-mono font-bold">{viewingReceiptInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold">{viewingReceiptInvoice.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Term:</span>
                <span>{viewingReceiptInvoice.term}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Date:</span>
                <span>{viewingReceiptInvoice.paymentDate || viewingReceiptInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-black text-sm text-emerald-600">
                <span>Amount Paid:</span>
                <span>₨ {viewingReceiptInvoice.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setViewingReceiptInvoice(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
