import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  const totalSamplesCount = store.samples.length;
  const readyCount = store.samples.filter(s => s.status === 'READY').length;
  const receivedCount = store.samples.filter(s => s.status === 'RECEIVED').length;
  const inProgressCount = store.samples.filter(s => s.status === 'IN_PROGRESS').length;

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
      urgentPendingCount: 1,
      criticalCount: 0,
    },
    statusBreakdown: { RECEIVED: receivedCount, IN_PROGRESS: inProgressCount, READY: readyCount, DELIVERED: 2 },
    departmentCounts: { 'أمراض الدم': 5, 'الكيمياء السريرية': 8, 'الفحص المجهري': 3 },
    doctorCommissionsSummary: [],
    inventoryAlerts: { expiredCount: 0, expiringCount: 1, lowStockCount: 2 },
    recentExpenses: [],
  });
}