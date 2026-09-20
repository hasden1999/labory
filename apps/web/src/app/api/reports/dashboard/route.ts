import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  const totalSamplesCount = store.samples.length;
  const readyCount = store.samples.filter(s => s.status === 'READY').length;
  const receivedCount = store.samples.filter(s => s.status === 'RECEIVED').length;
  const inProgressCount = store.samples.filter(s => s.status === 'IN_PROGRESS').length;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

  // Hourly distribution for today
  const hourlyArrivals = new Array(24).fill(0);
  let tatMinutesSum = 0;
  let completedCount = 0;
  let delayedCount = 0;

  store.samples.forEach((s) => {
    const t = new Date(s.createdAt).getTime();
    if (t >= startOfToday) {
      const hr = new Date(s.createdAt).getHours();
      if (hr >= 0 && hr < 24) hourlyArrivals[hr]++;

      if (s.status === 'READY' || s.status === 'DELIVERED') {
        const duration = Math.round((new Date((s as any).updatedAt || s.createdAt).getTime() - t) / 60000);
        if (duration > 0) {
          tatMinutesSum += duration;
          completedCount++;
        }
      } else {
        const elapsed = Math.round((Date.now() - t) / 60000);
        if (elapsed > (s.isUrgent ? 45 : 90)) delayedCount++;
      }
    }
  });

  const averageTatMinutes = completedCount > 0 ? Math.round(tatMinutesSum / completedCount) : 32;

  // Extract critical tests from samples
  const criticalAlerts: any[] = [];
  store.samples.forEach((s) => {
    (s.tests || []).forEach((st: any) => {
      if (st.isCritical) {
        criticalAlerts.push({
          id: st.id || `${s.id}-${st.testId}`,
          testName: st.test?.name || 'فحص حرج',
          testCode: st.test?.code || '',
          resultValue: st.resultValue || '',
          unit: st.unit || '',
          refRange: st.refRangeText || '',
          sampleNumber: s.sampleNumber,
          sampleId: s.id,
          patientName: s.patient?.name || 'مريض غير معروف',
          patientPhone: s.patient?.phone || '',
          isUrgent: !!s.isUrgent,
          createdAt: s.createdAt,
        });
      }
    });
  });

  const devices = store.devices || [];

  return NextResponse.json({
    summary: {
      totalSamplesCount,
      todaySamplesCount: totalSamplesCount,
      totalRevenue: 285000,
      todayRevenue: 95000,
      totalPaidCash: 250000,
      todayPaidCash: 85000,
      totalRemainingDebts: 35000,
      totalExpenses: 40000,
      totalDoctorCommissions: 25000,
      netProfit: 185000,
      urgentPendingCount: store.samples.filter((s) => s.isUrgent && s.status !== 'DELIVERED').length,
      criticalCount: criticalAlerts.length,
      averageTatMinutes,
      delayedCount,
      rejectedSamplesCount: store.samples.filter((s) => s.status === 'REJECTED').length,
    },
    statusBreakdown: {
      RECEIVED: receivedCount,
      IN_PROGRESS: inProgressCount,
      READY: readyCount,
      DELIVERED: 2,
      REJECTED: store.samples.filter((s) => s.status === 'REJECTED').length,
    },
    departmentCounts: { 'أمراض الدم': 5, 'الكيمياء السريرية': 8, 'الفحص المجهري': 3 },
    doctorCommissionsSummary: [],
    inventoryAlerts: { expiredCount: 0, expiringCount: 1, lowStockCount: 2 },
    recentExpenses: [],
    operationalCockpit: {
      averageTatMinutes,
      delayedCount,
      hourlyArrivals,
      criticalAlerts: criticalAlerts.slice(0, 6),
      deviceStatus: {
        totalDevices: devices.length,
        activeDevices: devices.filter((d: any) => d.isActive !== false).length,
        devices,
        todayIncomingTotal: 18,
        todayIncomingApplied: 18,
        automationRate: 100,
      },
    },
  });
}