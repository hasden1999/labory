import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function debtRoutes(fastify: FastifyInstance) {
  // Helper: auto-sync any unpaid patient samples into Debtor ledger if not already tracked
  async function syncPatientUnpaidSamples() {
    const unpaidSamples = await prisma.sample.findMany({
      where: {
        isDeleted: false,
        remainingAmount: { gt: 0 },
      },
      include: {
        patient: true,
        debtRecords: true,
      },
    });

    for (const sample of unpaidSamples) {
      if (!sample.patient) continue;

      let debtor = await prisma.debtor.findFirst({
        where: { patientId: sample.patientId },
      });

      if (!debtor) {
        debtor = await prisma.debtor.create({
          data: {
            name: sample.patient.name,
            phone: sample.patient.phone || null,
            type: 'PATIENT',
            patientId: sample.patientId,
            notes: `سجل مدين تلقائي للمريض #${sample.patient.name}`,
          },
        });
      }

      // Check if this sample has a debt record
      const hasDebtRecord = sample.debtRecords.some((r) => r.type === 'DEBT');
      if (!hasDebtRecord) {
        await prisma.debtRecord.create({
          data: {
            debtorId: debtor.id,
            sampleId: sample.id,
            type: 'DEBT',
            amount: sample.remainingAmount,
            paymentMethod: sample.paymentMethod || 'آجل',
            notes: `متبقي فحص عينة #${sample.sampleNumber}`,
            createdAt: sample.createdAt,
          },
        });
      }
    }
  }

  // Get all debtors with aggregated balance and category breakdowns
  fastify.get('/debts', async (request, reply) => {
    const { type, status, query } = request.query as {
      type?: string;
      status?: string;
      query?: string;
    };

    // Auto-sync samples to ensure 100% accuracy
    await syncPatientUnpaidSamples();

    const whereClause: any = {};
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    if (query && query.trim()) {
      whereClause.OR = [
        { name: { contains: query.trim() } },
        { phone: { contains: query.trim() } },
        { notes: { contains: query.trim() } },
      ];
    }

    const debtors = await prisma.debtor.findMany({
      where: whereClause,
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    let totalReceivables = 0; // ديون لنا (مرضى، عيادات)
    let totalPayables = 0;    // ديون علينا (موردين)
    let patientDebtsTotal = 0;
    let supplierDebtsTotal = 0;

    const debtorSummaries = debtors.map((d) => {
      let totalDebt = 0;
      let totalPaid = 0;

      d.transactions.forEach((tx) => {
        if (tx.type === 'DEBT') totalDebt += tx.amount;
        if (tx.type === 'PAYMENT') totalPaid += tx.amount;
      });

      const remainingBalance = Math.max(0, totalDebt - totalPaid);
      const isSupplier = d.type === 'SUPPLIER';

      if (isSupplier) {
        totalPayables += remainingBalance;
        supplierDebtsTotal += remainingBalance;
      } else {
        totalReceivables += remainingBalance;
        if (d.type === 'PATIENT') {
          patientDebtsTotal += remainingBalance;
        }
      }

      // Calculate aging in days from last transaction or creation
      const lastDate = d.transactions[0]?.createdAt || d.createdAt;
      const agingDays = Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: d.id,
        name: d.name,
        phone: d.phone,
        type: d.type || 'PATIENT',
        patientId: d.patientId,
        notes: d.notes,
        createdAt: d.createdAt,
        totalDebt,
        totalPaid,
        remainingBalance,
        lastTransaction: d.transactions[0] || null,
        transactionCount: d.transactions.length,
        agingDays,
        isSettled: remainingBalance <= 0,
      };
    });

    const filtered = debtorSummaries.filter((d) => {
      if (status === 'ACTIVE') return d.remainingBalance > 0;
      if (status === 'SETTLED') return d.remainingBalance <= 0;
      return true;
    });

    return {
      debtors: filtered,
      totals: {
        totalReceivables,
        totalPayables,
        patientDebtsTotal,
        supplierDebtsTotal,
        totalAccounts: debtors.length,
        activeAccounts: debtorSummaries.filter((d) => d.remainingBalance > 0).length,
      },
    };
  });

  // Create a new debtor (Patient, Supplier, Corporate/Clinic)
  fastify.post('/debts', async (request, reply) => {
    const { name, phone, notes, type, patientId, initialDebt, paymentMethod } = request.body as {
      name: string;
      phone?: string;
      notes?: string;
      type?: string;
      patientId?: string;
      initialDebt?: number;
      paymentMethod?: string;
    };

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'اسم الشخص أو الجهة مطلوب' });
    }

    const debtorType = type || 'PATIENT';
    const initDebtNum = Number(initialDebt) || 0;

    const debtor = await prisma.$transaction(async (tx) => {
      const createdDebtor = await tx.debtor.create({
        data: {
          name: name.trim(),
          phone: phone || null,
          notes: notes || null,
          type: debtorType,
          patientId: patientId || null,
        },
      });

      if (initDebtNum > 0) {
        await tx.debtRecord.create({
          data: {
            debtorId: createdDebtor.id,
            type: 'DEBT',
            amount: initDebtNum,
            paymentMethod: paymentMethod || 'آجل',
            notes: 'رصيد دَيْن افتتاحي عند فتح الحساب',
          },
        });
      }

      return createdDebtor;
    });

    return debtor;
  });

  // Record a transaction (DEBT or PAYMENT) for a debtor with Voucher & Financial Integration
  fastify.post('/debts/:id/transaction', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { type, amount, notes, sampleId, paymentMethod } = request.body as {
      type: 'DEBT' | 'PAYMENT';
      amount: number;
      notes?: string;
      sampleId?: string;
      paymentMethod?: string;
    };

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return reply.code(400).send({ error: 'مبلغ العملية يجب أن يكون أكبر من صفر' });
    }

    if (type !== 'DEBT' && type !== 'PAYMENT') {
      return reply.code(400).send({ error: 'نوع العملية غير صالح' });
    }

    const debtor = await prisma.debtor.findUnique({
      where: { id },
      include: { transactions: true },
    });
    if (!debtor) {
      return reply.code(404).send({ error: 'الحساب غير موجود' });
    }

    const payMethod = paymentMethod || 'نقداً';

    const result = await prisma.$transaction(async (tx) => {
      let voucherNum: number | null = null;

      // When PAYMENT is received or paid out, generate sequential voucher & FinancialTransaction
      if (type === 'PAYMENT') {
        const lastTx = await tx.financialTransaction.findFirst({
          orderBy: { voucherNumber: 'desc' },
          select: { voucherNumber: true },
        });
        voucherNum = (lastTx?.voucherNumber || 1000) + 1;

        const isSupplier = debtor.type === 'SUPPLIER';
        const finType = isSupplier ? 'SUPPLIER_PAYMENT' : 'DEBT_PAYMENT';
        const finCategory = isSupplier ? 'سداد مستحقات مورد' : 'سداد دين مريض/جهة';

        await tx.financialTransaction.create({
          data: {
            voucherNumber: voucherNum,
            type: finType,
            category: finCategory,
            amount: numAmount,
            paymentMethod: payMethod,
            debtorId: debtor.id,
            patientId: debtor.patientId || null,
            sampleId: sampleId || null,
            notes: notes || (isSupplier ? `دفعة سداد للمورد: ${debtor.name}` : `استلام دفعة سداد من: ${debtor.name}`),
            createdById: (request.user as any)?.id || 'single_operator',
          },
        });
      }

      // Create DebtRecord
      const debtTx = await tx.debtRecord.create({
        data: {
          debtorId: id,
          sampleId: sampleId || null,
          type,
          amount: numAmount,
          paymentMethod: payMethod,
          voucherNumber: voucherNum,
          notes: notes || (type === 'PAYMENT' ? 'استلام دفعة مالية' : 'إضافة دَيْن مالي'),
        },
      });

      // If tied to a specific sample and is payment, update the sample's paid/remaining
      if (sampleId && type === 'PAYMENT') {
        const targetSample = await tx.sample.findUnique({ where: { id: sampleId } });
        if (targetSample) {
          const updatedPaid = targetSample.paidAmount + numAmount;
          const updatedRemaining = Math.max(0, targetSample.priceTotal - updatedPaid);
          await tx.sample.update({
            where: { id: sampleId },
            data: {
              paidAmount: updatedPaid,
              remainingAmount: updatedRemaining,
            },
          });
        }
      }

      return {
        transaction: debtTx,
        voucherNumber: voucherNum,
        amount: numAmount,
      };
    });

    return reply.send(result);
  });

  // Quick Full Settlement: Settle debtor balance automatically distributing across their samples
  fastify.post('/debts/:id/settle-all', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { amount, paymentMethod, notes } = request.body as {
      amount?: number;
      paymentMethod?: string;
      notes?: string;
    };

    const debtor = await prisma.debtor.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!debtor) {
      return reply.code(404).send({ error: 'الحساب غير موجود' });
    }

    let totalDebt = 0;
    let totalPaid = 0;
    debtor.transactions.forEach((tx) => {
      if (tx.type === 'DEBT') totalDebt += tx.amount;
      if (tx.type === 'PAYMENT') totalPaid += tx.amount;
    });
    const currentRemaining = Math.max(0, totalDebt - totalPaid);

    if (currentRemaining <= 0) {
      return reply.code(400).send({ error: 'هذا الحساب مسدد بالكامل ولا يوجد عليه رصيد متبقي' });
    }

    const payAmount = amount && Number(amount) > 0 ? Math.min(Number(amount), currentRemaining) : currentRemaining;
    const payMethod = paymentMethod || 'نقداً';

    const result = await prisma.$transaction(async (tx) => {
      const lastTx = await tx.financialTransaction.findFirst({
        orderBy: { voucherNumber: 'desc' },
        select: { voucherNumber: true },
      });
      const voucherNum = (lastTx?.voucherNumber || 1000) + 1;

      const isSupplier = debtor.type === 'SUPPLIER';
      const finType = isSupplier ? 'SUPPLIER_PAYMENT' : 'DEBT_PAYMENT';
      const finCategory = isSupplier ? 'سداد مستحقات مورد' : 'سداد دين مريض/جهة';

      // 1. Create FinancialTransaction
      const finTx = await tx.financialTransaction.create({
        data: {
          voucherNumber: voucherNum,
          type: finType,
          category: finCategory,
          amount: payAmount,
          paymentMethod: payMethod,
          debtorId: debtor.id,
          patientId: debtor.patientId || null,
          notes: notes || `تسوية رصيد حساب ${debtor.name} بمبلغ ${payAmount} د.ع`,
          createdById: (request.user as any)?.id || 'single_operator',
        },
      });

      // 2. Create DebtRecord
      await tx.debtRecord.create({
        data: {
          debtorId: id,
          type: 'PAYMENT',
          amount: payAmount,
          paymentMethod: payMethod,
          voucherNumber: voucherNum,
          notes: notes || `دفعة سداد حساب (${debtor.name})`,
        },
      });

      // 3. If debtor is linked to a patient, settle their unpaid samples sequentially
      if (debtor.patientId) {
        const unpaidSamples = await tx.sample.findMany({
          where: {
            patientId: debtor.patientId,
            remainingAmount: { gt: 0 },
            isDeleted: false,
          },
          orderBy: { createdAt: 'asc' },
        });

        let remainingToDistribute = payAmount;
        for (const s of unpaidSamples) {
          if (remainingToDistribute <= 0) break;
          const toPay = Math.min(s.remainingAmount, remainingToDistribute);
          const newPaid = s.paidAmount + toPay;
          const newRem = Math.max(0, s.priceTotal - newPaid);

          await tx.sample.update({
            where: { id: s.id },
            data: {
              paidAmount: newPaid,
              remainingAmount: newRem,
            },
          });

          remainingToDistribute -= toPay;
        }
      }

      return {
        success: true,
        voucherNumber: voucherNum,
        paidAmount: payAmount,
        newBalance: Math.max(0, currentRemaining - payAmount),
      };
    });

    return reply.send(result);
  });

  // Get detailed statement for a specific debtor including patient samples
  fastify.get('/debts/:id/statement', async (request, reply) => {
    const { id } = request.params as { id: string };

    const debtor = await prisma.debtor.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            sample: {
              include: { patient: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!debtor) {
      return reply.code(404).send({ error: 'الحساب غير موجود' });
    }

    let patientSamples: any[] = [];
    if (debtor.patientId) {
      patientSamples = await prisma.sample.findMany({
        where: { patientId: debtor.patientId, isDeleted: false },
        include: { tests: { include: { test: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    let totalDebt = 0;
    let totalPaid = 0;
    debtor.transactions.forEach((tx) => {
      if (tx.type === 'DEBT') totalDebt += tx.amount;
      if (tx.type === 'PAYMENT') totalPaid += tx.amount;
    });

    return {
      debtor,
      patientSamples,
      summary: {
        totalDebt,
        totalPaid,
        remainingBalance: Math.max(0, totalDebt - totalPaid),
        transactionCount: debtor.transactions.length,
      },
    };
  });
}
