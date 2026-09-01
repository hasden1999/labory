export interface Patient {
  id: string;
  name: string;
  phone?: string;
  age?: number | string | null;
  gender: 'MALE' | 'FEMALE';
  visitCount?: number;
  visitsCount?: number;
  outstandingDebt?: number;
  lastTestIds?: string[];
  lastTestNames?: string[];
  abnormalFlags?: string[];
  createdAt?: string;
  samples?: Sample[];
  totalBilled?: number;
  totalPaid?: number;
  address?: string;
  notes?: string;
}

export interface Test {
  id: string;
  code: string;
  name: string;
  price: number;
  category: string;
  unit?: string;
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  refRangeText?: string;
  panicLow?: number | null;
  panicHigh?: number | null;
}

export interface SampleTest {
  id: string;
  testId: string;
  test: Test;
  resultValue?: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
  interpretation?: string;
}

export interface Doctor {
  id: string;
  name: string;
  phone?: string;
  clinic?: string;
  commissionPercent: number;
}

export interface Sample {
  id: string;
  sampleNumber: number | string;
  patientId?: string;
  patient?: Patient;
  doctorId?: string;
  doctor?: Doctor;
  tests: SampleTest[];
  status: 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
  isUrgent: boolean;
  priceTotal: number;
  discount?: number;
  discountPercent?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod?: 'CASH' | 'DEBT' | 'CARD';
  notes?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalSamplesToday: number;
  urgentCount: number;
  readyCount: number;
  pendingCount: number;
  revenueToday: number;
  debtToday: number;
  totalSamplesCount?: number;
  todaySamplesCount?: number;
  totalRevenue?: number;
  todayRevenue?: number;
  totalPaidCash?: number;
  todayPaidCash?: number;
  totalRemainingDebts?: number;
  totalExpenses?: number;
  totalDoctorCommissions?: number;
  netProfit?: number;
  urgentPendingCount?: number;
  criticalCount?: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  statusBreakdown?: Record<string, number>;
  departmentCounts?: Record<string, number>;
  doctorCommissionsSummary?: any[];
  inventoryAlerts?: { expiredCount: number; expiringCount: number; lowStockCount: number };
  recentExpenses?: any[];
}
