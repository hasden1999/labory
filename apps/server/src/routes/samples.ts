import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export const SampleStatus = {
  RECEIVED: 'RECEIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
} as const;

export async function sampleRoutes(fastify: FastifyInstance) {
  // Get Samples with search query and filters
  fastify.get('/samples', async (request: any, reply: any) => {
    const { status, unpaidOnly, query, urgentOnly, dateFilter, customDate } = request.query as any;

    const whereClause: any = { isDeleted: false };
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (unpaidOnly === 'true') {
      whereClause.remainingAmount = { gt: 0 };
    }
    if (urgentOnly === 'true') {
      whereClause.isUrgent = true;
    }
    if (query) {
      const numQuery = parseInt(query, 10);
      whereClause.OR = [
        ...(!isNaN(numQuery) ? [{ sampleNumber: numQuery }] : []),
        { patient: { name: { contains: query } } },
        { patient: { phone: { contains: query } } },
      ];
    }

    // Date Range Filtering
    if (customDate) {
      const start = new Date(customDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    } else if (dateFilter && dateFilter !== 'ALL') {
      const now = new Date();
      if (dateFilter === 'TODAY') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        whereClause.createdAt = { gte: start, lte: end };
      } else if (dateFilter === 'YESTERDAY') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
        const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
        whereClause.createdAt = { gte: start, lte: end };
      } else if (dateFilter === 'WEEK') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        whereClause.createdAt = { gte: start };
      } else if (dateFilter === 'MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        whereClause.createdAt = { gte: start };
      }
    }

    const samples = await prisma.sample.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        tests: {
          include: { test: true },
        },
      },
      orderBy: [
        { isUrgent: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });

    return reply.send(samples);
  });

  // Get single Sample
  fastify.get('/samples/:id', async (request: any, reply: any) => {
    const { id } = request.params as any;
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        tests: {
          include: { test: true },
        },
      },
    });

    if (!sample) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }

    return reply.send(sample);
  });

  // Create Patient & Sample Handler
  const createSampleHandler = async (request: any, reply: any) => {
    const user = request.user as { id: string };
    const body = request.body || {};
    const {
      name,
      phone,
      age,
      gender,
      newPatient,
      patientId,
      doctorId,
      testIds,
      discount,
      discountPercent,
      paidAmount,
      paymentMethod,
      isUrgent,
      notes,
    } = body;

    let targetPatientId = patientId;

    // Flexible patient name/phone/age resolution
    const patientName = (body.patientName || name || newPatient?.name || '').trim();
    const patientPhone = body.patientPhone || phone || newPatient?.phone || null;
    const patientAge = body.patientAge !== undefined && body.patientAge !== '' ? Number(body.patientAge) : (age !== undefined && age !== '' ? Number(age) : (newPatient?.age !== undefined ? Number(newPatient.age) : null));
    const patientGender = body.patientGender || gender || newPatient?.gender || 'غير محدد';

    if (!targetPatientId && patientName) {
      const createdPatient = await prisma.patient.create({
        data: {
          name: patientName,
          phone: patientPhone,
          age: patientAge,
          gender: patientGender,
        },
      });
      targetPatientId = createdPatient.id;
    }

    if (!targetPatientId) {
      return reply.status(400).send({ message: 'يجب اختيار مريض أو إدخال اسم مريض جديد' });
    }

    if (!testIds || testIds.length === 0) {
      return reply.status(400).send({ message: 'يجب اختيار فحص واحد على الأقل' });
    }

    // Fetch catalog tests for price & ref ranges
    const catalogTests = await prisma.testCatalog.findMany({
      where: { id: { in: testIds } },
    });

    const subtotal = catalogTests.reduce((sum, t) => sum + t.price, 0);
    let finalDiscount = discount !== undefined ? Number(discount) : 0;
    const discPct = discountPercent !== undefined ? Number(discountPercent) : 0;
    if (discPct > 0 && finalDiscount === 0) {
      finalDiscount = (subtotal * discPct) / 100;
    }
    const priceTotal = Math.max(0, subtotal - finalDiscount);
    const paid = paidAmount !== undefined ? Number(paidAmount) : priceTotal;
    const remaining = Math.max(0, priceTotal - paid);

    // Atomic creation with automatic collision retry
    let sample: any = null;
    let attempts = 0;
    while (!sample && attempts < 5) {
      attempts++;
      try {
        sample = await prisma.$transaction(async (tx) => {
          const last = await tx.sample.findFirst({
            orderBy: { sampleNumber: 'desc' },
            select: { sampleNumber: true },
          });
          const nextNum = (last?.sampleNumber || 1000) + 1;

          const createdSample = await tx.sample.create({
            data: {
              sampleNumber: nextNum,
              patientId: targetPatientId,
              doctorId: doctorId || null,
              createdById: user?.id || 'single_operator',
              status: SampleStatus.RECEIVED,
              isUrgent: !!isUrgent,
              priceTotal,
              discount: finalDiscount,
              discountPercent: discPct,
              paidAmount: paid,
              remainingAmount: remaining,
              paymentMethod: paymentMethod || 'نقداً',
              notes: notes || null,
              collectionTime: new Date(),
              tests: {
                create: catalogTests.map((t) => ({
                  testId: t.id,
                  priceAtTime: t.price,
                  costAtTime: t.costEstimate,
                  refRangeLow: t.refRangeLow,
                  refRangeHigh: t.refRangeHigh,
                  refRangeText: t.refRangeText,
                  unit: t.unit,
                })),
              },
            },
            include: {
              patient: true,
              doctor: true,
              tests: {
                include: { test: true },
              },
            },
          });

          // 1. Record FinancialTransaction if any cash/card payment was made now
          if (paid > 0) {
            const lastTx = await tx.financialTransaction.findFirst({
              orderBy: { voucherNumber: 'desc' },
              select: { voucherNumber: true },
            });
            const voucherNum = (lastTx?.voucherNumber || 1000) + 1;

            await tx.financialTransaction.create({
              data: {
                voucherNumber: voucherNum,
                type: 'INCOME_SAMPLE',
                category: 'رسوم فحص عينة',
                amount: paid,
                paymentMethod: paymentMethod || 'نقداً',
                patientId: targetPatientId,
                sampleId: createdSample.id,
                doctorId: doctorId || null,
                notes: `استلام رسوم فحص عينة #${nextNum} (${patientName})`,
                createdById: user?.id || 'single_operator',
              },
            });
          }

          // 2. Automatically link/update Debtor & DebtRecord if remaining > 0
          if (remaining > 0) {
            let debtor = await tx.debtor.findFirst({
              where: { patientId: targetPatientId },
            });

            if (!debtor) {
              debtor = await tx.debtor.create({
                data: {
                  name: patientName,
                  phone: patientPhone || null,
                  type: 'PATIENT',
                  patientId: targetPatientId,
                  notes: `حساب مدين مريض: ${patientName}`,
                },
              });
            }

            await tx.debtRecord.create({
              data: {
                debtorId: debtor.id,
                sampleId: createdSample.id,
                type: 'DEBT',
                amount: remaining,
                paymentMethod: paymentMethod || 'نقداً',
                notes: `متبقي دين لعينة #${nextNum}`,
              },
            });
          }

          return createdSample;
        });
      } catch (err: any) {
        if (err.code === 'P2002' && attempts < 5) {
          continue;
        }
        throw err;
      }
    }

    return reply.status(201).send({ sample, success: true, ...sample });
  };

  fastify.post('/samples', createSampleHandler);
  fastify.post('/samples/intake', createSampleHandler);

  // Fast Update Sample Status (e.g. RECEIVED -> IN_PROGRESS -> READY -> DELIVERED)
  fastify.patch('/samples/:id/status', async (request: any, reply: any) => {
    const { id } = request.params as any;
    const { status } = request.body as any;

    const updateData: any = { status };
    if (status === SampleStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.sample.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        tests: { include: { test: true } },
      },
    });

    return reply.send(updated);
  });

  // Settle or Pay Remaining Sample Debt with Official Voucher Generation
  fastify.post('/samples/:id/pay', async (request: any, reply: any) => {
    const { id } = request.params as any;
    const { payAmount, paymentMethod, notes } = request.body as any;

    const sample = await prisma.sample.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!sample) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }

    const amount = Number(payAmount) || 0;
    if (amount <= 0) {
      return reply.status(400).send({ message: 'الرجاء إدخال مبلغ دفع صالح أكبر من صفر' });
    }

    const newPaid = sample.paidAmount + amount;
    const newRemaining = Math.max(0, sample.priceTotal - newPaid);

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Update Sample
      const updatedSample = await tx.sample.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
        },
        include: {
          patient: true,
          doctor: true,
          tests: { include: { test: true } },
        },
      });

      // 2. Next Voucher Number
      const lastTx = await tx.financialTransaction.findFirst({
        orderBy: { voucherNumber: 'desc' },
        select: { voucherNumber: true },
      });
      const voucherNum = (lastTx?.voucherNumber || 1000) + 1;

      // 3. Create Financial Transaction
      const finTx = await tx.financialTransaction.create({
        data: {
          voucherNumber: voucherNum,
          type: 'DEBT_PAYMENT',
          category: 'سداد دين عينة',
          amount,
          paymentMethod: paymentMethod || 'نقداً',
          patientId: sample.patientId,
          sampleId: sample.id,
          doctorId: sample.doctorId,
          notes: notes || `سداد دفعة دين لعينة #${sample.sampleNumber} (${sample.patient?.name})`,
          createdById: request.user?.id || 'single_operator',
        },
      });

      // 4. Record Debt Payment in Debtor Ledger if exists or create
      let debtor = await tx.debtor.findFirst({
        where: { patientId: sample.patientId },
      });

      if (!debtor) {
        debtor = await tx.debtor.create({
          data: {
            name: sample.patient?.name || 'مريض',
            phone: sample.patient?.phone || null,
            type: 'PATIENT',
            patientId: sample.patientId,
          },
        });
      }

      const debtRec = await tx.debtRecord.create({
        data: {
          debtorId: debtor.id,
          sampleId: sample.id,
          type: 'PAYMENT',
          amount,
          paymentMethod: paymentMethod || 'نقداً',
          voucherNumber: voucherNum,
          notes: notes || `سداد دفعة دين لعينة #${sample.sampleNumber}`,
        },
      });

      return {
        sample: updatedSample,
        financialTransaction: finTx,
        debtRecord: debtRec,
        voucherNumber: voucherNum,
        amount,
        remainingAmount: newRemaining,
        paidTotal: newPaid,
      };
    });

    return reply.send(transactionResult);
  });

  // Append Additional Tests to an Existing Patient Sample
  fastify.post('/samples/:id/tests', async (request: any, reply: any) => {
    const { id } = request.params as any;
    const { testIds, additionalPaidAmount } = (request.body || {}) as any;

    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return reply.status(400).send({ message: 'يرجى اختيار فحص واحد على الأقل لإضافته' });
    }

    const sample = await prisma.sample.findUnique({
      where: { id },
      include: {
        tests: true,
      },
    });

    if (!sample) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }

    // Filter out already existing test IDs
    const existingTestIds = new Set(sample.tests.map((st) => st.testId));
    const newTestIds = testIds.filter((tid: string) => !existingTestIds.has(tid));

    if (newTestIds.length === 0) {
      return reply.status(400).send({ message: 'جميع الفحوصات المختارة مضافة بالفعل لهذه العينة' });
    }

    // Fetch details for the new tests
    const catalogTests = await prisma.testCatalog.findMany({
      where: { id: { in: newTestIds } },
    });

    let addedTotal = 0;
    const sampleTestsToCreate = catalogTests.map((t) => {
      addedTotal += t.price;
      return {
        sampleId: sample.id,
        testId: t.id,
        priceAtTime: t.price,
        costAtTime: t.costEstimate,
        refRangeLow: t.refRangeLow,
        refRangeHigh: t.refRangeHigh,
        refRangeText: t.refRangeText,
        unit: t.unit,
      };
    });

    // Create the new sample tests
    await prisma.sampleTest.createMany({
      data: sampleTestsToCreate,
    });

    const newPriceTotal = sample.priceTotal + addedTotal;
    const addedPaid = Number(additionalPaidAmount) || 0;
    const newPaidAmount = sample.paidAmount + addedPaid;
    const newRemainingAmount = Math.max(0, newPriceTotal - newPaidAmount);

    // Update sample price and revert status to IN_PROGRESS so new tests can be filled
    const updated = await prisma.sample.update({
      where: { id },
      data: {
        priceTotal: newPriceTotal,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: SampleStatus.IN_PROGRESS,
      },
      include: {
        patient: true,
        doctor: true,
        tests: {
          include: { test: true },
        },
      },
    });

    return reply.send({
      message: `تمت إضافة ${newTestIds.length} فحص بنجاح إلى العينة الحالية`,
      sample: updated,
    });
  });

  // Soft Delete Sample with Audit Trail
  fastify.delete('/samples/:id', async (request: any, reply: any) => {
    const { id } = request.params as any;
    const existing = await prisma.sample.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }
    await prisma.sample.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'SAMPLE',
        entityId: id,
        details: `حذف ناعم للعينة #${existing.sampleNumber}`,
        userName: request.user?.name || 'المشغل',
      },
    });
    return reply.send({ success: true, message: 'تم أرشفة وحذف العينة بنجاح مع الحفاظ على السجلات السريرية' });
  });

  // Restore Soft-Deleted Sample
  fastify.post('/samples/:id/restore', async (request: any, reply: any) => {
    const { id } = request.params as any;
    const existing = await prisma.sample.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }
    const restored = await prisma.sample.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });
    await prisma.auditLog.create({
      data: {
        action: 'RESTORE',
        entity: 'SAMPLE',
        entityId: id,
        details: `استعادة العينة المؤرشفة #${existing.sampleNumber}`,
        userName: request.user?.name || 'المشغل',
      },
    });
    return reply.send({ success: true, sample: restored, message: 'تمت استعادة العينة بنجاح' });
  });
}
