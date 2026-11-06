import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function reportRoutes(fastify: FastifyInstance) {
  // Main Financial & Operations Dashboard Summary
  fastify.get('/reports/dashboard', async (request, reply) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Parallel Database-level Aggregations
    const [
      totalSampleAgg,
      todaySampleAgg,
      totalExpensesAgg,
      urgentPendingCount,
      criticalCount,
      statusGroups,
      recentExpenses,
      doctors,
      inventoryItems,
      todaySamplesForMetrics,
      criticalTestsList,
      devicesList,
      todayIncomingTotal,
      todayIncomingApplied,
      rejectedSamplesCount,
    ] = await Promise.all([
      // Total samples and financials
      prisma.sample.aggregate({
        _count: { id: true },
        _sum: { priceTotal: true, paidAmount: true, remainingAmount: true },
        where: { isDeleted: false },
      }),
      // Today samples and financials
      prisma.sample.aggregate({
        _count: { id: true },
        _sum: { priceTotal: true, paidAmount: true },
        where: { isDeleted: false, createdAt: { gte: startOfToday } },
      }),
      // Expenses aggregate
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      // STAT Urgent pending count
      prisma.sample.count({
        where: { isUrgent: true, status: { not: 'DELIVERED' }, isDeleted: false },
      }),
      // Critical count
      prisma.sampleTest.count({
        where: { isCritical: true },
      }),
      // Status breakdown
      prisma.sample.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { isDeleted: false },
      }),
      // Recent expenses
      prisma.expense.findMany({
        orderBy: { date: 'desc' },
        take: 8,
      }),
      // Doctors with their samples totals
      prisma.referringDoctor.findMany({
        include: {
          samples: {
            where: { isDeleted: false },
            select: { priceTotal: true },
          },
        },
      }),
      // Inventory summary
      prisma.inventoryItem.findMany({
        select: { quantity: true, reorderThreshold: true, expiryDate: true },
      }),
      // Today samples for TAT & Hourly Heatmap
      prisma.sample.findMany({
        where: { isDeleted: false, createdAt: { gte: startOfToday } },
        select: { id: true, sampleNumber: true, createdAt: true, collectionTime: true, deliveredAt: true, status: true, isUrgent: true },
      }),
      // Critical/Panic Tests list
      prisma.sampleTest.findMany({
        where: { isCritical: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          sample: {
            select: { id: true, sampleNumber: true, isUrgent: true, patient: { select: { id: true, name: true, phone: true } } },
          },
          test: { select: { id: true, name: true, code: true, unit: true, refRangeText: true } },
        },
      }),
      // Lab Devices
      prisma.labDevice.findMany({
        select: { id: true, name: true, brand: true, model: true, status: true, protocol: true, isActive: true },
      }),
      // Incoming device results today
      prisma.incomingResult.count({
        where: { receivedAt: { gte: startOfToday } },
      }),
      prisma.incomingResult.count({
        where: { receivedAt: { gte: startOfToday }, status: 'APPLIED' },
      }),
      // Rejected samples count
      prisma.sample.count({
        where: { isDeleted: false, status: 'REJECTED' },
      }),
    ]);

    const totalSamplesCount = totalSampleAgg._count.id || 0;
    const totalRevenue = totalSampleAgg._sum.priceTotal || 0;
    const totalPaidCash = totalSampleAgg._sum.paidAmount || 0;
    const totalRemainingDebts = totalSampleAgg._sum.remainingAmount || 0;

    const todaySamplesCount = todaySampleAgg._count.id || 0;
    const todayRevenue = todaySampleAgg._sum.priceTotal || 0;
    const todayPaidCash = todaySampleAgg._sum.paidAmount || 0;

    const totalExpenses = totalExpensesAgg._sum.amount || 0;

    // Doctor Commissions
    let totalDoctorCommissions = 0;
    const doctorCommissionsSummary = doctors.map((doc) => {
      const docRevenue = doc.samples.reduce((acc, s) => acc + (s.priceTotal || 0), 0);
      const commissionAmount = (docRevenue * (doc.commissionPercent || 0)) / 100;
      totalDoctorCommissions += commissionAmount;
      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        commissionPercent: doc.commissionPercent,
        samplesCount: doc.samples.length,
        totalRevenue: docRevenue,
        commissionAmount,
      };
    });

    const netProfit = totalPaidCash - totalExpenses - totalDoctorCommissions;

    // Status Map
    const statusBreakdown: Record<string, number> = {
      RECEIVED: 0,
      IN_PROGRESS: 0,
      READY: 0,
      DELIVERED: 0,
      REJECTED: 0,
    };
    for (const sg of statusGroups) {
      statusBreakdown[sg.status] = sg._count.id;
    }

    // TAT & Delayed Analysis
    let tatMinutesSum = 0;
    let completedCount = 0;
    let delayedCount = 0;
    const hourlyArrivals: number[] = new Array(24).fill(0);

    const nowMs = now.getTime();
    for (const s of todaySamplesForMetrics) {
      // Hourly heatmap
      const hr = new Date(s.createdAt).getHours();
      if (hr >= 0 && hr < 24) hourlyArrivals[hr]++;

      // TAT calculation for finished samples
      if (s.status === 'READY' || s.status === 'DELIVERED') {
        const finishTime = s.deliveredAt ? new Date(s.deliveredAt).getTime() : nowMs;
        const startTime = s.collectionTime ? new Date(s.collectionTime).getTime() : new Date(s.createdAt).getTime();
        const durationMins = Math.round((finishTime - startTime) / 60000);
        if (durationMins > 0) {
          tatMinutesSum += durationMins;
          completedCount++;
        }
      } else {
        // Active sample: check if delayed (standard > 90m, urgent > 45m)
        const elapsedMins = Math.round((nowMs - new Date(s.createdAt).getTime()) / 60000);
        const threshold = s.isUrgent ? 45 : 90;
        if (elapsedMins > threshold) {
          delayedCount++;
        }
      }
    }

    const averageTatMinutes = completedCount > 0 ? Math.round(tatMinutesSum / completedCount) : 35;

    // Inventory status overview
    const expiredCount = inventoryItems.filter((i) => i.expiryDate && new Date(i.expiryDate) < now).length;
    const expiringCount = inventoryItems.filter((i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= thirtyDaysFromNow).length;
    const lowStockCount = inventoryItems.filter((i) => i.quantity <= i.reorderThreshold).length;

    return reply.send({
      summary: {
        totalSamplesCount,
        todaySamplesCount,
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
        averageTatMinutes,
        delayedCount,
        rejectedSamplesCount,
      },
      statusBreakdown,
      departmentCounts: {},
      doctorCommissionsSummary,
      inventoryAlerts: {
        expiredCount,
        expiringCount,
        lowStockCount,
      },
      recentExpenses,
      operationalCockpit: {
        averageTatMinutes,
        delayedCount,
        hourlyArrivals,
        criticalAlerts: criticalTestsList.map((ct) => ({
          id: ct.id,
          testName: ct.test.name,
          testCode: ct.test.code,
          resultValue: ct.resultValue,
          unit: ct.unit,
          refRange: ct.refRangeText,
          sampleNumber: ct.sample.sampleNumber,
          sampleId: ct.sample.id,
          patientName: ct.sample.patient?.name || 'مريض غير معروف',
          patientPhone: ct.sample.patient?.phone || '',
          isUrgent: ct.sample.isUrgent,
          createdAt: ct.createdAt,
        })),
        deviceStatus: {
          totalDevices: devicesList.length,
          activeDevices: devicesList.filter((d) => d.isActive).length,
          devices: devicesList,
          todayIncomingTotal,
          todayIncomingApplied,
          automationRate: todayIncomingTotal > 0 ? Math.round((todayIncomingApplied / todayIncomingTotal) * 100) : 100,
        },
      },
    });
  });
}
