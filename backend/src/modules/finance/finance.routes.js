import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Standard institutional fee structures reference data
const INSTITUTIONAL_FEE_STRUCTURES = [
  {
    id: 'fs-dae-ai',
    classId: 'c-dae-1',
    className: 'DAE Artificial Intelligence & Robotics',
    academicYear: '2026 - 2027',
    termType: 'Semester',
    tuitionFee: 22000,
    labCharges: 4500,
    examFee: 2000,
    libraryAndSports: 1500,
    totalPerTerm: 30000,
    installmentsAllowed: true,
    dueDayOfMonth: 10,
  },
  {
    id: 'fs-dae-cs',
    classId: 'c-11',
    className: '11-ComputerScience (HSSC-I)',
    academicYear: '2026 - 2027',
    termType: 'Semester',
    tuitionFee: 19000,
    labCharges: 3500,
    examFee: 2000,
    libraryAndSports: 1500,
    totalPerTerm: 26000,
    installmentsAllowed: true,
    dueDayOfMonth: 15,
  },
  {
    id: 'fs-g10-sci',
    classId: 'c-10',
    className: 'Grade 10 (SSC-II Science)',
    academicYear: '2026 - 2027',
    termType: 'Semester',
    tuitionFee: 18000,
    labCharges: 3000,
    examFee: 1800,
    libraryAndSports: 1200,
    totalPerTerm: 24000,
    installmentsAllowed: true,
    dueDayOfMonth: 15,
  },
  {
    id: 'fs-g9-sci',
    classId: 'c-9',
    className: 'Grade 9 (SSC-I Technical Division)',
    academicYear: '2026 - 2027',
    termType: 'Semester',
    tuitionFee: 16500,
    labCharges: 2500,
    examFee: 1800,
    libraryAndSports: 1200,
    totalPerTerm: 22000,
    installmentsAllowed: true,
    dueDayOfMonth: 15,
  },
  {
    id: 'fs-hssc-preeng',
    classId: 'c-12',
    className: '12-PreEng (HSSC-II Engineering)',
    academicYear: '2026 - 2027',
    termType: 'Semester',
    tuitionFee: 20000,
    labCharges: 4000,
    examFee: 2200,
    libraryAndSports: 1800,
    totalPerTerm: 28000,
    installmentsAllowed: true,
    dueDayOfMonth: 10,
  },
];

// Institutional scholarship waivers data
const SCHOLARSHIP_WAIVERS = [
  {
    id: 'wvr-101',
    studentId: 'STU-2026-0101',
    studentName: 'Aisha Siddiqui',
    rollNo: '10A-01',
    className: 'Grade 10 (Science)',
    category: 'Merit Academic Distinction',
    discountPercent: 100,
    discountAmount: 24000,
    status: 'Approved & Active',
    academicYear: '2026 - 2027',
    awardedBy: 'Academic Senate & Principal',
    criteria: 'Board Examination 1st Position Holder (98.4%)',
  },
  {
    id: 'wvr-102',
    studentId: 'STU-2026-0104',
    studentName: 'Hamza Siddiqui',
    rollNo: '11CS-02',
    className: '11-ComputerScience',
    category: 'Sibling Concession',
    discountPercent: 25,
    discountAmount: 6500,
    status: 'Approved & Active',
    academicYear: '2026 - 2027',
    awardedBy: 'Registrar Admissions Desk',
    criteria: 'Multiple Wards Enrolled (Elder Sibling of Aisha & Bilal)',
  },
  {
    id: 'wvr-103',
    studentId: 'STU-2026-0106',
    studentName: 'Bilal Siddiqui',
    rollNo: '9A-03',
    className: 'Grade 9-A',
    category: 'Sibling Concession',
    discountPercent: 25,
    discountAmount: 5500,
    status: 'Approved & Active',
    academicYear: '2026 - 2027',
    awardedBy: 'Registrar Admissions Desk',
    criteria: 'Multiple Wards Enrolled (Youngest Sibling)',
  },
  {
    id: 'wvr-104',
    studentId: 'STU-2026-0102',
    studentName: 'Zainab Fatima',
    rollNo: '11CS-01',
    className: '11-ComputerScience',
    category: 'STEM Innovation & Robotics Fellowship',
    discountPercent: 50,
    discountAmount: 13000,
    status: 'Approved & Active',
    academicYear: '2026 - 2027',
    awardedBy: 'Department of Computer Science',
    criteria: 'National AI Competition Silver Medalist',
  },
  {
    id: 'wvr-105',
    studentId: 'STU-2026-0103',
    studentName: 'Mustafa Kamal',
    rollNo: '10A-04',
    className: 'Grade 10-A',
    category: 'Need-Based Educational Aid',
    discountPercent: 40,
    discountAmount: 9600,
    status: 'Approved & Active',
    academicYear: '2026 - 2027',
    awardedBy: 'Institutional Zakat & Financial Aid Board',
    criteria: 'Household income assessment verified',
  },
];

// 1. Fee Collection Summary & Executive KPI Metrics
router.get('/summary', async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { payments: true },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
    const totalCollected = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = invoices
      .filter((inv) => inv.status === 'UPCOMING' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueInvoices = invoices.filter((inv) => inv.status === 'OVERDUE');
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const upcomingInvoices = invoices.filter((inv) => inv.status === 'UPCOMING');

    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;
    const paymentCount = await prisma.payment.count();

    const totalWaiversAmount = SCHOLARSHIP_WAIVERS.reduce((sum, w) => sum + w.discountAmount, 0);

    return successResponse(res, {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionRate,
      invoiceCount: invoices.length,
      paidCount: paidInvoices.length,
      upcomingCount: upcomingInvoices.length,
      overdueCount: overdueInvoices.length,
      activeWaivers: SCHOLARSHIP_WAIVERS.length,
      totalWaiversAmount,
      totalPaymentsRecorded: paymentCount,
    });
  } catch (err) {
    next(err);
  }
});

// 2. List Invoices with search, filters, pagination and rich relationships
router.get('/invoices', async (req, res, next) => {
  try {
    const { studentId, status, search, classId, term } = req.query;
    const where = {};

    if (studentId) where.studentId = studentId;

    if (status && status !== 'All') {
      where.status = status.toUpperCase();
    }

    if (term && term !== 'All') {
      where.term = { contains: term, mode: 'insensitive' };
    }

    if (classId && classId !== 'All') {
      where.student = { ...(where.student || {}), classId };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { term: { contains: q, mode: 'insensitive' } },
        { receipt: { contains: q, mode: 'insensitive' } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
        { student: { rollNo: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            classId: true,
            classGrade: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            guardian: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      studentId: inv.studentId,
      studentName: inv.student?.name || 'Institutional Scholar',
      studentRollNo: inv.student?.rollNo || inv.studentId,
      className: inv.student?.classGrade?.name || 'Technical Division',
      sectionName: inv.student?.section?.name || 'Section A',
      guardianName: inv.student?.guardian?.name || 'Parent / Guardian',
      guardianPhone: inv.student?.guardian?.phone || '',
      guardianEmail: inv.student?.guardian?.email || '',
      term: inv.term,
      amount: inv.amount,
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      status: inv.status.charAt(0) + inv.status.slice(1).toLowerCase(),
      paymentDate: inv.paymentDate ? inv.paymentDate.toISOString().slice(0, 10) : null,
      receipt: inv.receipt,
      paymentsCount: (inv.payments || []).length,
      lastPaymentMethod: inv.payments?.[0]?.paymentMethod || null,
      createdAt: inv.createdAt.toISOString(),
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

// 3. Issue Individual Term Invoice
router.post('/invoices', authorize(['super_admin', 'admin_staff', 'accountant', 'principal']), async (req, res, next) => {
  try {
    const {
      term,
      amount,
      dueDate,
      status = 'Upcoming',
      studentId,
      academicYearId = 'ay-2026',
      feeCategory = 'Tuition & Semester Fee',
      notes,
    } = req.body;

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const first = await prisma.student.findFirst();
      targetStudentId = first ? first.id : 'STU-2026-0101';
    }

    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      include: { classGrade: true, section: true, guardian: true },
    });

    if (!student) {
      return errorResponse(res, `Student ID '${targetStudentId}' was not found in institutional records`, 404);
    }

    const id = req.body.id || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const normalizedStatus =
      status?.toUpperCase() === 'PAID'
        ? 'PAID'
        : status?.toUpperCase() === 'OVERDUE'
        ? 'OVERDUE'
        : status?.toUpperCase() === 'CANCELLED'
        ? 'CANCELLED'
        : 'UPCOMING';

    const created = await prisma.invoice.create({
      data: {
        id,
        studentId: student.id,
        academicYearId,
        term: term || 'Spring Semester 2027',
        amount: Number(amount) || 24000,
        dueDate: new Date(dueDate || '2027-02-15'),
        status: normalizedStatus,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            classGrade: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Finance Officer',
        action: 'INVOICE_GENERATED',
        entity: `Generated invoice ${created.id} for ${student.name} (${created.term} - ₨ ${created.amount.toLocaleString()})`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(
      res,
      {
        id: created.id,
        studentId: created.studentId,
        studentName: created.student.name,
        studentRollNo: created.student.rollNo,
        className: created.student.classGrade?.name,
        sectionName: created.student.section?.name,
        term: created.term,
        amount: created.amount,
        dueDate: created.dueDate.toISOString().slice(0, 10),
        status: created.status.charAt(0) + created.status.slice(1).toLowerCase(),
        receipt: null,
      },
      'Institutional invoice issued successfully',
      201
    );
  } catch (err) {
    next(err);
  }
});

// 4. Batch Invoicing: Bulk Generate Term Challans for an entire Class or Section
router.post('/invoices/bulk-generate', authorize(['super_admin', 'admin_staff', 'accountant', 'principal']), async (req, res, next) => {
  try {
    const {
      classId,
      sectionId,
      term = 'Spring Semester 2027',
      amount = 24000,
      dueDate = '2027-02-15',
      academicYearId = 'ay-2026',
    } = req.body;

    const where = {};
    if (classId && classId !== 'All') where.classId = classId;
    if (sectionId && sectionId !== 'All') where.sectionId = sectionId;

    const students = await prisma.student.findMany({
      where,
      select: { id: true, name: true, rollNo: true },
    });

    if (students.length === 0) {
      return errorResponse(res, 'No students found matching the selected class/section filter', 400);
    }

    const createdInvoices = [];
    const parsedAmount = Number(amount);
    const parsedDueDate = new Date(dueDate);

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const invId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`;

      // Check if student already has an invoice for this exact term
      const existing = await prisma.invoice.findFirst({
        where: { studentId: s.id, term, academicYearId },
      });

      if (!existing) {
        const inv = await prisma.invoice.create({
          data: {
            id: invId,
            studentId: s.id,
            academicYearId,
            term,
            amount: parsedAmount,
            dueDate: parsedDueDate,
            status: 'UPCOMING',
          },
        });
        createdInvoices.push(inv);
      }
    }

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Accountant / Finance Officer',
        action: 'BULK_INVOICES_ISSUED',
        entity: `Bulk generated ${createdInvoices.length} invoices for term '${term}' (Class: ${classId || 'All'})`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(
      res,
      {
        totalTargetStudents: students.length,
        invoicesCreated: createdInvoices.length,
        skippedExisting: students.length - createdInvoices.length,
        term,
        amount: parsedAmount,
      },
      `Successfully generated ${createdInvoices.length} institutional term invoices`,
      201
    );
  } catch (err) {
    next(err);
  }
});

// 5. Settle Invoice & Register Payment Transaction
router.post('/invoices/:id/pay', authorize(['super_admin', 'admin_staff', 'accountant', 'principal']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      receiptNo,
      paymentMethod = 'Bank Transfer / 1Link',
      transactionRef = '',
      notes = '',
    } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!invoice) return errorResponse(res, `Invoice #${id} was not found`, 404);

    // Idempotent check
    if (invoice.status === 'PAID') {
      return successResponse(
        res,
        {
          id: invoice.id,
          status: 'Paid',
          receipt: invoice.receipt,
          isNewPayment: false,
        },
        'Invoice is already fully settled'
      );
    }

    const generatedReceipt = receiptNo || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    const [updatedInvoice, createdPayment] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paymentDate: now,
          receipt: generatedReceipt,
        },
      }),
      prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: invoice.amount,
          receiptNumber: generatedReceipt,
          paymentMethod: `${paymentMethod}${transactionRef ? ` (Ref: ${transactionRef})` : ''}`,
          paidAt: now,
          recordedBy: req.user?.name || 'Accountant / Cashier',
        },
      }),
      prisma.auditLog.create({
        data: {
          actor: req.user?.name || 'Finance Department Cashier',
          action: 'PAYMENT_SETTLED',
          entity: `Invoice ${invoice.id} settled (₨ ${invoice.amount.toLocaleString()}) via ${paymentMethod}. Official Receipt ${generatedReceipt} issued for ${invoice.student?.name}.`,
          ipAddress: '127.0.0.1',
          status: 'Success',
        },
      }),
      prisma.queueJobRecord.create({
        data: {
          jobType: 'EMAIL_DISPATCH',
          target: invoice.student?.guardian?.email || 'billing@ams-institute.edu.pk',
          recipient: `Fee Payment Receipt: ${invoice.id} (${invoice.student?.name})`,
          status: 'Completed',
          description: `Official Receipt ${generatedReceipt} for ₨ ${invoice.amount.toLocaleString()} dispatched to guardian.`,
        },
      }),
    ]);

    return successResponse(
      res,
      {
        id: updatedInvoice.id,
        status: 'Paid',
        receipt: updatedInvoice.receipt,
        paymentDate: updatedInvoice.paymentDate.toISOString().slice(0, 10),
        amount: updatedInvoice.amount,
        paymentMethod: createdPayment.paymentMethod,
        isNewPayment: true,
      },
      `Invoice #${id} settled successfully. Official Receipt ${generatedReceipt} generated.`
    );
  } catch (err) {
    next(err);
  }
});

// 6. Cancel / Void an unpaid invoice
router.post('/invoices/:id/cancel', authorize(['super_admin', 'admin_staff', 'accountant']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Administrative waiver / Voided by Finance Officer' } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!invoice) return errorResponse(res, `Invoice #${id} was not found`, 404);

    if (invoice.status === 'PAID') {
      return errorResponse(res, 'Cannot void an invoice that has already been settled and paid. Issue a refund record instead.', 400);
    }

    const cancelled = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Finance Officer',
        action: 'INVOICE_CANCELLED',
        entity: `Voided Invoice ${id} (${invoice.student?.name} - ${invoice.term}). Reason: ${reason}`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(res, { id: cancelled.id, status: 'Cancelled' }, `Invoice #${id} has been voided`);
  } catch (err) {
    next(err);
  }
});

// 7. Transaction Stream & Payment Ledger
router.get('/payments', async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          select: {
            id: true,
            term: true,
            dueDate: true,
            student: {
              select: {
                id: true,
                name: true,
                rollNo: true,
                classGrade: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 100,
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      invoiceId: p.invoiceId,
      term: p.invoice?.term || 'Tuition Term',
      studentName: p.invoice?.student?.name || 'Institutional Scholar',
      studentRollNo: p.invoice?.student?.rollNo || '',
      className: p.invoice?.student?.classGrade?.name || 'General Division',
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paidAt: p.paidAt.toISOString(),
      dateFormatted: p.paidAt.toISOString().slice(0, 10),
      recordedBy: p.recordedBy || 'Official Registrar',
      status: 'Verified & Reconciled',
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

// 8. Institutional Fee Structures Reference
router.get('/fee-structures', async (req, res) => {
  return successResponse(res, INSTITUTIONAL_FEE_STRUCTURES);
});

// 9. Scholarships, Concessions & Waivers Reference
router.get('/waivers', async (req, res) => {
  return successResponse(res, SCHOLARSHIP_WAIVERS);
});

export default router;
