import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Fee Collection Summary
router.get('/summary', async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany();
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCollected = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

    return successResponse(res, {
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate,
      activeWaivers: 8,
    });
  } catch (err) {
    next(err);
  }
});

// List Invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (status && status !== 'All') where.status = status.toUpperCase();

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      studentId: inv.studentId,
      studentName: inv.student.name,
      term: inv.term,
      amount: inv.amount,
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      status: inv.status.charAt(0) + inv.status.slice(1).toLowerCase(),
      paymentDate: inv.paymentDate ? inv.paymentDate.toISOString().slice(0, 10) : null,
      receipt: inv.receipt,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

// Create Invoice
router.post('/invoices', authorize(['super_admin', 'admin_staff']), async (req, res, next) => {
  try {
    const {
      term,
      amount,
      dueDate,
      status = 'Upcoming',
      studentId,
      academicYearId = 'ay-2026',
    } = req.body;

    // If no student specified, assign to first active student or general student
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const first = await prisma.student.findFirst();
      targetStudentId = first ? first.id : 'STU-2026-0101';
    }

    const id = req.body.id || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await prisma.invoice.create({
      data: {
        id,
        studentId: targetStudentId,
        academicYearId,
        term,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        status:
          status?.toUpperCase() === 'PAID'
            ? 'PAID'
            : status?.toUpperCase() === 'OVERDUE'
            ? 'OVERDUE'
            : status?.toUpperCase() === 'CANCELLED'
            ? 'CANCELLED'
            : 'UPCOMING',
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Super Admin',
        action: 'INVOICE_GENERATED',
        entity: `Generated invoice ${created.id} for ${created.term} ($${created.amount})`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(res, created, 'Invoice generated successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Settle Invoice (Idempotent Payment)
router.post('/invoices/:id/pay', authorize(['super_admin', 'admin_staff']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { receiptNo } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!invoice) return errorResponse(res, 'Invoice not found', 404);

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
        'Invoice is already settled'
      );
    }

    const generatedReceipt = receiptNo || `REC-${Math.floor(1000 + Math.random() * 9000)}-${invoice.id.slice(-1)}`;
    const now = new Date();

    const [updatedInvoice] = await prisma.$transaction([
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
          paymentMethod: 'Institutional Terminal Settlement',
          paidAt: now,
          recordedBy: req.user?.name || 'Registrar Staff',
        },
      }),
      prisma.auditLog.create({
        data: {
          actor: req.user?.name || 'Registrar Admissions Staff',
          action: 'PAYMENT_SETTLED',
          entity: `Invoice ${invoice.id} marked as Paid. Receipt ${generatedReceipt} generated.`,
          ipAddress: '127.0.0.1',
          status: 'Success',
        },
      }),
      prisma.queueJobRecord.create({
        data: {
          jobType: 'EMAIL_DISPATCH',
          target: 'billing@family.net',
          recipient: `Payment Confirmation: ${invoice.id}`,
          status: 'Completed',
          description: `Receipt ${generatedReceipt} for $${invoice.amount} sent to account holder`,
        },
      }),
    ]);

    return successResponse(res, {
      id: updatedInvoice.id,
      status: 'Paid',
      receipt: updatedInvoice.receipt,
      isNewPayment: true,
    }, `Invoice ${id} settled successfully`);
  } catch (err) {
    next(err);
  }
});

export default router;
