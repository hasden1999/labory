import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function financialRoutes(fastify: FastifyInstance) {
  // Helper: compute date bounds based on timeframe or custom date range
  function getDateBounds(timeframe?: string, startDateStr?: string, endDateStr?: string): { start?: Date; end?: Date } {
    const now = new Date();

    if (timeframe === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    } else if (timeframe === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      return { start, end };
    } else if (timeframe === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    } else if (timeframe === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start, end: now };
    } else if (startDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    return {};
  }

  // 1. Get Financial Summary (الموجز المالي الشامل وقائمة الأرباح والخسائر)
  fastify.get('/financials/summary', async (request, reply) => {
    const { timeframe, startDate, endDate } = request.query as {
      timeframe?: string;
      startDate?: string;
      endDate?: string;
    };

    const dateBounds = getDateBounds(timeframe || 'month', startDate, endDate);
    const txWhere: any = {};
    if (dateBounds.start && dateBounds.end) {
      txWhere.createdAt = { gte: dateBounds.start, lte: dateBounds.end };
    } else if (dateBounds.start) {
      txWhere.createdAt = { gte: dateBounds.start };
    }

    // A. Fetch All Financial Transactions for this period
    const transactions = await prisma.financialTransaction.findMany({
      where: txWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        debtor: { select: { id: true, name: true, phone: true, type: true } },
        doctor: { select: { id: true, name: true } },
        sample: { select: { id: true, sampleNumber: true, priceTotal: true } },
      },
    });

    // Calculate Incomes and Outgoings from actual transactions
    let totalPaid = 0; // إجمالي النقد المقبوض فعلياً
    let sampleIncome = 0;
    let debtPaymentIncome = 0;

    let cashTotal = 0;
    let zainCashTotal = 0;
    let cardTotal = 0;

    let totalExpenses = 0;
    let supplierPayments = 0;
    let doctorCommissionsPaid = 0;

    const expenseCategoryMap: { [key: string]: number } = {};

    transactions.forEach((tx) => {
      const isIncome = tx.type === 'INCOME_SAMPLE' || tx.type === 'DEBT_PAYMENT';
      const isExpense = tx.type === 'EXPENSE' || tx.type === 'SUPPLIER_PAYMENT' || tx.type === 'DOCTOR_COMMISSION';

      if (isIncome) {
        totalPaid += tx.amount;
        if (tx.type === 'INCOME_SAMPLE') sampleIncome += tx.amount;
        if (tx.type === 'DEBT_PAYMENT') debtPaymentIncome += tx.amount;

        const m = (tx.paymentMethod || 'نقداً').trim();
        if (m === 'زين كاش' || m.toLowerCase().includes('zain')) {
          zainCashTotal += tx.amount;
        } else if (m === 'بطاقة' || m.toLowerCase().includes('card') || m.toLowerCase().includes('pos')) {
          cardTotal += tx.amount;
        } else {
          cashTotal += tx.amount;
        }
      }

      if (isExpense) {
        if (tx.type === 'EXPENSE') {
          totalExpenses += tx.amount;
          const cat = tx.category || 'مصاريف تشغيلية';
          expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + tx.amount;
        } else if (tx.type === 'SUPPLIER_PAYMENT') {
          supplierPayments += tx.amount;
        } else if (tx.type === 'DOCTOR_COMMISSION') {
          doctorCommissionsPaid += tx.amount;
        }
      }
    });

    // Fallback if legacy samples exist without FinancialTransaction:
    // Check if transactions is empty but samples exist, to ensure backward compatibility
    if (transactions.length === 0) {
      const sampleWhere: any = { isDeleted: false };
      if (dateBounds.start && dateBounds.end) {
        sampleWhere.createdAt = { gte: dateBounds.start, lte: dateBounds.end };
      }
      const legacySamples = await prisma.sample.findMany({ where: sampleWhere });
      sampleIncome = legacySamples.reduce((s, x) => s + (x.paidAmount || 0), 0);
      totalPaid = sampleIncome;
      cashTotal = sampleIncome;

      const legacyExpenses = await prisma.expense.findMany({
        where: dateBounds.start ? { date: { gte: dateBounds.start, lte: dateBounds.end } } : {},
      });
      totalExpenses = legacyExpenses.reduce((s, x) => s + x.amount, 0);
    }

    // B. Calculate Gross Sales & Direct Reagent Costs (COGS) from Samples created in this period
    const sampleWhere: any = { isDeleted: false };
    if (dateBounds.start && dateBounds.end) {
      sampleWhere.createdAt = { gte: dateBounds.start, lte: dateBounds.end };
    }
    const samplesInPeriod = await prisma.sample.findMany({
      where: sampleWhere,
      select: {
        priceTotal: true,
        discount: true,
        paidAmount: true,
        remainingAmount: true,
      },
    });

    const totalGrossRevenue = samplesInPeriod.reduce((sum, s) => sum + (s.priceTotal || 0), 0);
    const totalDiscounts = samplesInPeriod.reduce((sum, s) => sum + (s.discount || 0), 0);
    const newDebtsInPeriod = samplesInPeriod.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    // Direct Reagent / Test Cost (COGS)
    const testCostAgg = await prisma.sampleTest.aggregate({
      _sum: { costAtTime: true },
      where: { sample: sampleWhere },
    });
    const directReagentCost = testCostAgg._sum.costAtTime || 0;
    const netSalesRevenue = Math.max(0, totalGrossRevenue - totalDiscounts);

    // C. Calculate Global Outstanding Receivables & Payables + Aging Buckets
    const allDebtors = await prisma.debtor.findMany({
      include: { transactions: true },
    });

    let totalRemainingDebts = 0;  // ديون المرضى والجهات (Receivables)
    let totalSupplierDebts = 0;   // ديون الموردين (Payables)
    let agingCurrent = 0;         // 0 - 15 days
    let agingMedium = 0;          // 16 - 30 days
    let agingCritical = 0;        // 30+ days
    const nowTime = Date.now();

    allDebtors.forEach((d) => {
      let dTotal = 0;
      let pTotal = 0;
      let earliestDebtDate: Date | null = null;
      d.transactions.forEach((t) => {
        if (t.type === 'DEBT') {
          dTotal += t.amount;
          if (!earliestDebtDate || new Date(t.createdAt) < earliestDebtDate) {
            earliestDebtDate = new Date(t.createdAt);
          }
        }
        if (t.type === 'PAYMENT') pTotal += t.amount;
      });
      const bal = Math.max(0, dTotal - pTotal);
      if (d.type === 'SUPPLIER') {
        totalSupplierDebts += bal;
      } else {
        totalRemainingDebts += bal;
        if (bal > 0 && earliestDebtDate) {
          const ageDays = Math.floor((nowTime - (earliestDebtDate as Date).getTime()) / (1000 * 60 * 60 * 24));
          if (ageDays <= 15) {
            agingCurrent += bal;
          } else if (ageDays <= 30) {
            agingMedium += bal;
          } else {
            agingCritical += bal;
          }
        }
      }
    });

    // D. Doctor Commissions earned in this period
    const doctors = await prisma.referringDoctor.findMany({
      include: {
        samples: {
          where: sampleWhere,
          select: { priceTotal: true },
        },
      },
    });

    let totalDoctorCommissions = 0;
    doctors.forEach((doc) => {
      const docRev = doc.samples.reduce((sum, s) => sum + (s.priceTotal || 0), 0);
      totalDoctorCommissions += (docRev * (doc.commissionPercent || 0)) / 100;
    });

    // Clinical P&L Calculation
    const grossOperatingProfit = Math.max(0, netSalesRevenue - directReagentCost - totalDoctorCommissions);
    const totalOutgoings = totalExpenses + supplierPayments + Math.max(totalDoctorCommissions, doctorCommissionsPaid);
    const netProfit = totalPaid - totalOutgoings;
    const clinicalNetProfit = grossOperatingProfit - totalExpenses;
    const operatingMarginPct = netSalesRevenue > 0 ? Math.round((clinicalNetProfit / netSalesRevenue) * 100) : 0;

    // Today specific quick stat
    const nowStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayTransactions = await prisma.financialTransaction.findMany({
      where: {
        createdAt: { gte: nowStart },
        type: { in: ['INCOME_SAMPLE', 'DEBT_PAYMENT'] },
      },
    });
    const todayRevenue = todayTransactions.reduce((s, tx) => s + tx.amount, 0);

    // Recent 10 expenses
    const recentExpenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    });

    return {
      timeframe: timeframe || 'month',
      dateRange: { start: dateBounds.start, end: dateBounds.end },
      totalRevenue: totalGrossRevenue,
      totalPaid,
      totalExpenses,
      totalDoctorCommissions,
      supplierPayments,
      totalSupplierDebts,
      netProfit,
      todayRevenue,
      totalDiscounts,
      totalRemainingDebts,
      newDebtsInPeriod,
      paymentMethodBreakdown: {
        cash: cashTotal,
        zainCash: zainCashTotal,
        card: cardTotal,
      },
      expenseCategories: Object.entries(expenseCategoryMap).map(([category, amount]) => ({
        category,
        amount,
      })),
      recentExpenses: recentExpenses.map((e) => ({ ...e, createdAt: e.date.toISOString() })),
      recentTransactions: transactions.slice(0, 15),
      outgoings: {
        operationalExpenses: totalExpenses,
        doctorCommissions: totalDoctorCommissions,
        supplierPayments,
        totalOutgoings,
      },
      pnl: {
        grossRevenue: totalGrossRevenue,
        discounts: totalDiscounts,
        netSalesRevenue,
        directReagentCost,
        doctorCommissions: totalDoctorCommissions,
        grossOperatingProfit,
        operatingExpenses: totalExpenses,
        netProfit: clinicalNetProfit,
        operatingMarginPct,
      },
      debtAging: {
        current: agingCurrent,
        medium: agingMedium,
        critical: agingCritical,
        total: totalRemainingDebts,
      },
    };
  });

  // 2. Get Central Financial Transactions Ledger (سجل العمليات المالية الشامل مع فلاتر)
  fastify.get('/financials/transactions', async (request, reply) => {
    const { type, paymentMethod, startDate, endDate, query, page, limit } = request.query as {
      type?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
      query?: string;
      page?: string;
      limit?: string;
    };

    const whereClause: any = {};
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      whereClause.paymentMethod = paymentMethod;
    }

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = endDate ? new Date(endDate) : new Date(startDate);
      e.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: s, lte: e };
    }

    if (query && query.trim()) {
      whereClause.OR = [
        { notes: { contains: query.trim() } },
        { category: { contains: query.trim() } },
        { patient: { name: { contains: query.trim() } } },
        { debtor: { name: { contains: query.trim() } } },
      ];
    }

    const take = limit ? Number(limit) : 50;
    const skip = page ? (Number(page) - 1) * take : 0;

    const [transactions, totalCount] = await prisma.$transaction([
      prisma.financialTransaction.findMany({
        where: whereClause,
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          debtor: { select: { id: true, name: true, phone: true, type: true } },
          doctor: { select: { id: true, name: true } },
          sample: { select: { id: true, sampleNumber: true, priceTotal: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.financialTransaction.count({ where: whereClause }),
    ]);

    return {
      transactions,
      totalCount,
      page: page ? Number(page) : 1,
      totalPages: Math.ceil(totalCount / take),
    };
  });

  // 3. Cash Drawer Shifts (جلسات الصندوق والورديات اليومية)
  fastify.get('/financials/shifts/current', async (request, reply) => {
    const currentShift = await prisma.cashDrawerShift.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    if (!currentShift) {
      return { activeShift: null };
    }

    // Calculate cash in and cash out since shift was opened
    const shiftTransactions = await prisma.financialTransaction.findMany({
      where: {
        createdAt: { gte: currentShift.openedAt },
      },
    });

    let cashCollected = 0;
    let cashExpenses = 0;
    let electronicCollected = 0;

    shiftTransactions.forEach((tx) => {
      const isCash = (tx.paymentMethod || 'نقداً') === 'نقداً';
      if (tx.type === 'INCOME_SAMPLE' || tx.type === 'DEBT_PAYMENT') {
        if (isCash) cashCollected += tx.amount;
        else electronicCollected += tx.amount;
      } else if (tx.type === 'EXPENSE' || tx.type === 'SUPPLIER_PAYMENT') {
        if (isCash) cashExpenses += tx.amount;
      }
    });

    const expectedCashInDrawer = currentShift.startingCash + cashCollected - cashExpenses;

    return {
      activeShift: {
        ...currentShift,
        cashCollected,
        cashExpenses,
        electronicCollected,
        expectedCashInDrawer,
        transactionCount: shiftTransactions.length,
      },
    };
  });

  // Open New Cash Drawer Shift
  fastify.post('/financials/shifts/open', async (request, reply) => {
    const { startingCash, notes } = request.body as { startingCash?: number; notes?: string };

    const activeShift = await prisma.cashDrawerShift.findFirst({
      where: { status: 'OPEN' },
    });

    if (activeShift) {
      return reply.code(400).send({ error: 'توجد وردية مفتوحة بالفعل، يجب إغلاقها أولاً قبل فتح وردية جديدة' });
    }

    const lastShift = await prisma.cashDrawerShift.findFirst({
      orderBy: { shiftNumber: 'desc' },
      select: { shiftNumber: true },
    });
    const nextShiftNum = (lastShift?.shiftNumber || 0) + 1;

    const newShift = await prisma.cashDrawerShift.create({
      data: {
        shiftNumber: nextShiftNum,
        startingCash: Number(startingCash) || 0,
        openedById: (request.user as any)?.name || 'المشغل',
        notes: notes || null,
        status: 'OPEN',
      },
    });

    return reply.send(newShift);
  });

  // Close Cash Drawer Shift (تقفيل الصندوق والوردية وحساب الفارق Z-Report)
  fastify.post('/financials/shifts/close', async (request, reply) => {
    const { actualCash, notes } = request.body as { actualCash: number; notes?: string };

    const activeShift = await prisma.cashDrawerShift.findFirst({
      where: { status: 'OPEN' },
    });

    if (!activeShift) {
      return reply.code(400).send({ error: 'لا توجد وردية مفتوحة لإغلاقها' });
    }

    // Calculate accurate expected cash from transactions
    const shiftTransactions = await prisma.financialTransaction.findMany({
      where: { createdAt: { gte: activeShift.openedAt } },
    });

    let cashCollected = 0;
    let cashExpenses = 0;
    let electronicCollected = 0;

    shiftTransactions.forEach((tx) => {
      const isCash = (tx.paymentMethod || 'نقداً') === 'نقداً';
      if (tx.type === 'INCOME_SAMPLE' || tx.type === 'DEBT_PAYMENT') {
        if (isCash) cashCollected += tx.amount;
        else electronicCollected += tx.amount;
      } else if (tx.type === 'EXPENSE' || tx.type === 'SUPPLIER_PAYMENT') {
        if (isCash) cashExpenses += tx.amount;
      }
    });

    const numActual = Number(actualCash) || 0;
    const expectedCash = activeShift.startingCash + cashCollected - cashExpenses;
    const discrepancy = numActual - expectedCash; // 0 = مطابق, >0 = زيادة, <0 = عجز

    const closedShift = await prisma.cashDrawerShift.update({
      where: { id: activeShift.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: (request.user as any)?.name || 'المشغل',
        expectedCash,
        actualCash: numActual,
        discrepancy,
        notes: notes || activeShift.notes,
      },
    });

    return reply.send({
      shift: closedShift,
      stats: {
        startingCash: activeShift.startingCash,
        cashCollected,
        cashExpenses,
        electronicCollected,
        expectedCash,
        actualCash: numActual,
        discrepancy,
        discrepancyStatus: discrepancy === 0 ? 'MATCHED' : discrepancy > 0 ? 'SURPLUS' : 'DEFICIT',
      },
    });
  });

  // Shift History
  fastify.get('/financials/shifts/history', async (request, reply) => {
    const shifts = await prisma.cashDrawerShift.findMany({
      orderBy: { openedAt: 'desc' },
      take: 30,
    });
    return reply.send(shifts);
  });

  // 4. Get Voucher Details for Thermal / A4 Print
  fastify.get('/financials/vouchers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const transaction = await prisma.financialTransaction.findFirst({
      where: {
        OR: [{ id }, { voucherNumber: !isNaN(Number(id)) ? Number(id) : -1 }],
      },
      include: {
        patient: true,
        debtor: true,
        doctor: true,
        sample: {
          include: { tests: { include: { test: true } } },
        },
      },
    });

    if (!transaction) {
      return reply.code(404).send({ error: 'السند غير موجود' });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });

    return {
      voucher: transaction,
      settings: settings || {
        labName: 'مختبر التحليلات الطبية',
        phone: '07700000000',
        currency: 'د.ع',
      },
    };
  });

  // 5. Test Profitability Analytics (تحليل ربحية الفحوصات والكلفة الفعلية)
  fastify.get('/financials/test-profitability', async (request, reply) => {
    const { timeframe } = request.query as { timeframe?: string };

    const dateBounds = getDateBounds(timeframe || 'month');
    const whereClause: any = {};
    if (dateBounds.start) {
      whereClause.createdAt = { gte: dateBounds.start };
    }

    const sampleTests = await prisma.sampleTest.findMany({
      where: whereClause,
      include: { test: true },
    });

    const catalogTests = await prisma.testCatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    const testMap: { [testId: string]: { count: number; totalRevenue: number; totalCost: number } } = {};

    sampleTests.forEach((st) => {
      if (!testMap[st.testId]) {
        testMap[st.testId] = { count: 0, totalRevenue: 0, totalCost: 0 };
      }
      testMap[st.testId].count += 1;
      testMap[st.testId].totalRevenue += st.priceAtTime;
      testMap[st.testId].totalCost += st.costAtTime || st.test.costEstimate || 0;
    });

    const breakdown = catalogTests.map((ct) => {
      const stats = testMap[ct.id] || { count: 0, totalRevenue: 0, totalCost: 0 };
      const unitPrice = ct.price;
      const unitCost = ct.costEstimate || 0;
      const unitProfit = unitPrice - unitCost;
      const profitMargin = unitPrice > 0 ? Math.round((unitProfit / unitPrice) * 100) : 0;
      const totalProfit = stats.totalRevenue - stats.totalCost;

      return {
        testId: ct.id,
        testName: ct.name,
        name: ct.name,
        category: ct.category,
        price: unitPrice,
        unitPrice,
        costEstimate: unitCost,
        unitCost,
        unitProfit,
        profitMargin,
        count: stats.count,
        totalRevenue: stats.totalRevenue,
        totalCost: stats.totalCost,
        netProfit: totalProfit,
        totalProfit,
      };
    });

    breakdown.sort((a, b) => b.count - a.count);
    return breakdown;
  });

  // Create new operating expense (mirrored on financials)
  fastify.post('/financials/expenses', async (request, reply) => {
    const { description, amount, category, paymentMethod } = request.body as {
      description: string;
      amount: number;
      category?: string;
      paymentMethod?: string;
    };

    if (!description || !amount || Number(amount) <= 0) {
      return reply.code(400).send({ error: 'الرجاء إدخال تفاصيل ومبلغ المصروف بشكل صحيح' });
    }

    const numAmount = Number(amount);
    const cat = category || 'مصاريف تشغيلية';
    const method = paymentMethod || 'نقداً';

    const result = await prisma.$transaction(async (tx) => {
      const lastTx = await tx.financialTransaction.findFirst({
        orderBy: { voucherNumber: 'desc' },
        select: { voucherNumber: true },
      });
      const voucherNum = (lastTx?.voucherNumber || 1000) + 1;

      const expense = await tx.expense.create({
        data: {
          voucherNumber: voucherNum,
          description: description.trim(),
          amount: numAmount,
          category: cat,
          paymentMethod: method,
        },
      });

      await tx.financialTransaction.create({
        data: {
          voucherNumber: voucherNum,
          type: 'EXPENSE',
          category: cat,
          amount: numAmount,
          paymentMethod: method,
          notes: description.trim(),
          createdById: (request.user as any)?.id || 'single_operator',
        },
      });

      return {
        ...expense,
        createdAt: expense.date.toISOString(),
      };
    });

    return reply.send(result);
  });

  // Delete expense record
  fastify.delete('/financials/expenses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (existing) {
      await prisma.$transaction([
        prisma.expense.delete({ where: { id } }),
        ...(existing.voucherNumber
          ? [prisma.financialTransaction.deleteMany({ where: { voucherNumber: existing.voucherNumber, type: 'EXPENSE' } })]
          : []),
      ]);
    }
    return reply.send({ success: true });
  });

  // Create Cash In (سند قبض)
  fastify.post('/financials/income', async (request, reply) => {
    const { amount, description, paymentMethod, patientId, debtorId, doctorId, category } = request.body as any;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return reply.code(400).send({ error: 'المبلغ غير صالح' });
    }

    const method = paymentMethod || 'نقداً';
    const cat = category || 'سند قبض';

    const result = await prisma.$transaction(async (tx) => {
      const highestVoucher = await tx.financialTransaction.findFirst({
        orderBy: { voucherNumber: 'desc' },
        select: { voucherNumber: true },
      });
      const voucherNum = (highestVoucher?.voucherNumber || 1000) + 1;

      const transaction = await tx.financialTransaction.create({
        data: {
          voucherNumber: voucherNum,
          type: debtorId ? 'DEBT_PAYMENT' : 'INCOME_SAMPLE',
          category: cat,
          amount: numAmount,
          paymentMethod: method,
          notes: description?.trim() || 'سند قبض',
          patientId: patientId || null,
          debtorId: debtorId || null,
          doctorId: doctorId || null,
          createdById: (request.user as any)?.id || 'single_operator',
        },
      });

      if (debtorId) {
        await tx.debtRecord.create({
          data: {
            debtorId,
            type: 'PAYMENT',
            amount: numAmount,
            paymentMethod: method,
            voucherNumber: voucherNum,
            notes: description?.trim() || 'سداد دفعة من الدين',
          },
        });
      }

      return transaction;
    });

    return reply.status(201).send(result);
  });

  // Get Debtors & Receivables
  fastify.get('/financials/debts', async (request, reply) => {
    const debtors = await prisma.debtor.findMany({
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = debtors.map((d) => {
      let totalDebt = 0;
      let totalPaid = 0;
      d.transactions.forEach((t) => {
        if (t.type === 'DEBT') totalDebt += t.amount;
        if (t.type === 'PAYMENT') totalPaid += t.amount;
      });
      const balance = Math.max(0, totalDebt - totalPaid);
      return {
        ...d,
        totalDebt,
        totalPaid,
        balance,
      };
    });

    return reply.send(result);
  });
}
