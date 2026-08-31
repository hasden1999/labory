import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function reportRoutes(fastify: FastifyInstance) {
  // Main Financial & Operations Dashboard Summary
  fastify.get('/reports/dashboard', async (request, reply) => {
    const samples = await prisma.sample.findMany({
      include: {
        patient: true,
        doctor: true,
        tests: { include: { test: true } },
      },
    });

    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
    const doctors = await prisma.referringDoctor.findMany({
      include: { samples: true },
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todaySamples = samples.filter((s) => new Date(s.createdAt) >= startOfToday);
    const todayRevenue = todaySamples.reduce((acc, s) => acc + s.priceTotal, 0);
    const todayPaidCash = todaySamples.reduce((acc, s) => acc + s.paidAmount, 0);

    // Totals
    const totalSamplesCount = samples.length;
    const totalRevenue = samples.reduce((acc, s) => acc + s.priceTotal, 0);
    const totalPaidCash = samples.reduce((acc, s) => acc + s.paidAmount, 0);
    const totalRemainingDebts = samples.reduce((acc, s) => acc + s.remainingAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // STAT Urgent Samples
    const urgentPendingCount = samples.filter((s) => s.isUrgent && s.status !== 'DELIVERED').length;

    // Critical results
    let criticalCount = 0;
    const departmentCounts: Record<string, number> = {};

    samples.forEach((s) => {
      s.tests.forEach((st) => {
        if (st.isCritical) criticalCount++;
        const cat = st.test.category || 'عام';
        departmentCounts[cat] = (departmentCounts[cat] || 0) + 1;
      });
    });

    // Calculate Doctor Commissions
    let totalDoctorCommissions = 0;
    const doctorCommissionsSummary = doctors.map((doc) => {
      const docSamples = samples.filter((s) => s.doctorId === doc.id);
      const docRevenue = docSamples.reduce((acc, s) => acc + s.priceTotal, 0);
      const commissionAmount = (docRevenue * doc.commissionPercent) / 100;
      totalDoctorCommissions += commissionAmount;
      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        commissionPercent: doc.commissionPercent,
        samplesCount: docSamples.length,
        totalRevenue: docRevenue,
        commissionAmount,
      };
    });

    const netProfit = totalPaidCash - totalExpenses - totalDoctorCommissions;

    // Status Breakdown
    const statusBreakdown = {
      RECEIVED: samples.filter((s) => s.status === 'RECEIVED').length,
      IN_PROGRESS: samples.filter((s) => s.status === 'IN_PROGRESS').length,
      READY: samples.filter((s) => s.status === 'READY').length,
      DELIVERED: samples.filter((s) => s.status === 'DELIVERED').length,
    };

    // Inventory status overview
    const inventoryItems = await prisma.inventoryItem.findMany();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiredCount = inventoryItems.filter((i) => i.expiryDate && new Date(i.expiryDate) < now).length;
    const expiringCount = inventoryItems.filter((i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= thirtyDaysFromNow).length;
    const lowStockCount = inventoryItems.filter((i) => i.quantity <= i.reorderThreshold).length;

    return reply.send({
      summary: {
        totalSamplesCount,
        todaySamplesCount: todaySamples.length,
        totalRevenue,
        todayRevenue,
        totalPaidCash,
        todayPaidCash,
        totalRemainingDebts,
        totalExpenses,
        totalDoctorCommissions,
        netProfit,
        urgentPendingCount,
        criticalCount,
      },
      statusBreakdown,
      departmentCounts,
      doctorCommissionsSummary,
      inventoryAlerts: {
        expiredCount,
        expiringCount,
        lowStockCount,
      },
      recentExpenses: expenses.slice(0, 8),
    });
  });
}
