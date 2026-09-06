import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function financialRoutes(fastify: FastifyInstance) {
  // Get Financial Summary (الواردات والصادرات والنواتج المالية)
  fastify.get('/financials/summary', async (request, reply) => {
    // 1. Calculate Auto Revenues (الواردات التلقائية)
    const samples = await prisma.sample.findMany({
      where: { isDeleted: false },
      select: {
        paidAmount: true,
        remainingAmount: true,
        priceTotal: true,
        discount: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const samplePaidTotal = samples.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const sampleRemainingDebts = samples.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);
    const totalGrossRevenue = samples.reduce((sum, s) => sum + (s.priceTotal || 0), 0);
    const totalDiscounts = samples.reduce((sum, s) => sum + (s.discount || 0), 0);

    const todaySamplePaid = samples
      .filter(s => new Date(s.createdAt).getTime() >= todayStart)
      .reduce((sum, s) => sum + (s.paidAmount || 0), 0);

    // B. Debt Ledger Payments (استلام الدفعات من قائمة الديون)
    const debtPayments = await prisma.debtRecord.findMany({
      where: { type: 'PAYMENT' },
      select: { amount: true, createdAt: true },
    });

    const debtPaymentsTotal = debtPayments.reduce((sum, d) => sum + d.amount, 0);
    const todayDebtPaid = debtPayments
      .filter(d => new Date(d.createdAt).getTime() >= todayStart)
      .reduce((sum, d) => sum + d.amount, 0);

    const totalRevenues = samplePaidTotal + debtPaymentsTotal;
    const todayRevenue = todaySamplePaid + todayDebtPaid;

    // 2. Calculate Costs & Expenses (الصادرات والتكاليف)
    const rawExpenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });

    const expenses = rawExpenses.map(e => ({
      ...e,
      createdAt: e.date.toISOString(),
    }));

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Doctor Commissions
    const doctors = await prisma.referringDoctor.findMany({
      include: {
        samples: {
          where: { isDeleted: false },
          select: { priceTotal: true },
        },
      },
    });

    let totalDoctorCommissions = 0;
    doctors.forEach((doc) => {
      const docSampleRevenue = doc.samples.reduce((sum, s) => sum + (s.priceTotal || 0), 0);
      totalDoctorCommissions += (docSampleRevenue * (doc.commissionPercent || 0)) / 100;
    });

    const netProfit = totalRevenues - (totalExpenses + totalDoctorCommissions);

    return {
      totalRevenue: totalGrossRevenue,
      totalPaid: totalRevenues,
      totalExpenses,
      totalDoctorCommissions,
      netProfit,
      todayRevenue,
      totalDiscounts,
      totalRemainingDebts: sampleRemainingDebts,
      recentExpenses: expenses.slice(0, 8),
      expensesList: expenses,
      autoRevenues: {
        samplePaidTotal,
        debtPaymentsTotal,
        totalRevenues,
        sampleRemainingDebts,
      },
      outgoings: {
        operationalExpenses: totalExpenses,
        doctorCommissions: totalDoctorCommissions,
        inventoryStockCost: 0,
        totalTestCosts: 0,
        totalOutgoings: totalExpenses + totalDoctorCommissions,
      },
    };
  });

  // Get Test Profitability Analytics (تحليل ربحية الفحوصات والكلفة الفعلية حسب الفترة: يوم / أسبوع / شهر)
  fastify.get('/financials/test-profitability', async (request, reply) => {
    const { timeframe } = request.query as { timeframe?: string }; // 'today', 'week', 'month', 'all'

    const now = new Date();
    let startDate: Date | null = null;

    if (timeframe === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const whereClause: any = {};
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }

    // Get executed sample tests with test catalog info
    const sampleTests = await prisma.sampleTest.findMany({
      where: whereClause,
      include: {
        test: true,
      },
    });

    // Also get all catalog tests so even unexecuted tests can be listed or analyzed
    const catalogTests = await prisma.testCatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    // Group executions by testId
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

    // Sort by count descending so most conducted tests appear first
    breakdown.sort((a, b) => b.count - a.count);

    return breakdown;
  });

  // Create new operating expense
  fastify.post('/financials/expenses', async (request, reply) => {
    const { description, amount, category } = request.body as {
      description: string;
      amount: number;
      category?: string;
    };

    if (!description || !amount || Number(amount) <= 0) {
      return reply.code(400).send({ error: 'الرجاء إدخال تفاصيل ومبلغ المصروف بشكل صحيح' });
    }

    const expense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amount: Number(amount),
        category: category || 'مصاريف تشغيلية',
      },
    });

    return {
      ...expense,
      createdAt: expense.date.toISOString(),
    };
  });

  // Delete expense record
  fastify.delete('/financials/expenses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.expense.delete({ where: { id } });
    return { success: true };
  });
}
