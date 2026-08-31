import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function financialRoutes(fastify: FastifyInstance) {
  // Get Financial Summary (الواردات والصادرات والنواتج المالية)
  fastify.get('/financials/summary', async (request, reply) => {
    // 1. Calculate Auto Revenues (الواردات التلقائية)
    const samples = await prisma.sample.findMany({
      select: {
        paidAmount: true,
        remainingAmount: true,
        priceTotal: true,
        createdAt: true,
      },
    });

    const samplePaidTotal = samples.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const sampleRemainingDebts = samples.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    // B. Debt Ledger Payments (استلام الدفعات من قائمة الديون)
    const debtPayments = await prisma.debtRecord.findMany({
      where: { type: 'PAYMENT' },
      select: { amount: true, createdAt: true },
    });

    const debtPaymentsTotal = debtPayments.reduce((sum, d) => sum + d.amount, 0);
    const totalRevenues = samplePaidTotal + debtPaymentsTotal;

    // 2. Calculate Costs & Expenses (الصادرات والتكاليف)
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Inventory Purchases & Stock Cost
    const inventoryItems = await prisma.inventoryItem.findMany({
      select: { quantity: true, costPerUnit: true },
    });
    const inventoryStockCost = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

    // Doctor Commissions
    const doctors = await prisma.referringDoctor.findMany({
      include: {
        samples: { select: { priceTotal: true } },
      },
    });

    let totalDoctorCommissions = 0;
    doctors.forEach((doc) => {
      const docSampleRevenue = doc.samples.reduce((sum, s) => sum + (s.priceTotal || 0), 0);
      totalDoctorCommissions += (docSampleRevenue * (doc.commissionPercent || 0)) / 100;
    });

    // Total actual cost of executed tests
    const allExecutedTests = await prisma.sampleTest.findMany({
      select: { priceAtTime: true, costAtTime: true },
    });
    const totalTestCosts = allExecutedTests.reduce((sum, t) => sum + (t.costAtTime || 0), 0);

    const totalOutgoings = totalExpenses + totalDoctorCommissions + totalTestCosts;
    const netProfit = totalRevenues - totalOutgoings;

    return {
      autoRevenues: {
        samplePaidTotal,
        debtPaymentsTotal,
        totalRevenues,
        sampleRemainingDebts,
      },
      outgoings: {
        operationalExpenses: totalExpenses,
        doctorCommissions: totalDoctorCommissions,
        inventoryStockCost,
        totalTestCosts,
        totalOutgoings,
      },
      netProfit,
      expensesList: expenses,
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
        name: ct.name,
        category: ct.category,
        unitPrice,
        unitCost,
        unitProfit,
        profitMargin,
        count: stats.count,
        totalRevenue: stats.totalRevenue,
        totalCost: stats.totalCost,
        totalProfit,
      };
    });

    // Sort by count descending so most conducted tests appear first
    breakdown.sort((a, b) => b.count - a.count);

    const overallTotalCount = breakdown.reduce((sum, b) => sum + b.count, 0);
    const overallTotalRevenue = breakdown.reduce((sum, b) => sum + b.totalRevenue, 0);
    const overallTotalCost = breakdown.reduce((sum, b) => sum + b.totalCost, 0);
    const overallTotalProfit = overallTotalRevenue - overallTotalCost;

    return {
      timeframe: timeframe || 'all',
      overallSummary: {
        totalExecutedTests: overallTotalCount,
        totalRevenue: overallTotalRevenue,
        totalCost: overallTotalCost,
        totalProfit: overallTotalProfit,
      },
      breakdown,
    };
  });

  // Create new operating expense
  fastify.post('/financials/expenses', async (request, reply) => {
    const { description, amount, category } = request.body as {
      description: string;
      amount: number;
      category?: string;
    };

    if (!description || !amount || amount <= 0) {
      return reply.code(400).send({ error: 'الرجاء إدخال تفاصيل ومبلغ المصروف بشكل صحيح' });
    }

    const expense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amount: Number(amount),
        category: category || 'مصاريف تشغيلية',
      },
    });

    return expense;
  });

  // Delete expense record
  fastify.delete('/financials/expenses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.expense.delete({ where: { id } });
    return { success: true };
  });
}
