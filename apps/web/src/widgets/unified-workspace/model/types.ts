/**
 * Types & Contracts for Labryo LIMS All-in-One Console (Unified Workspace)
 * FSD Layer: widgets/unified-workspace/model/types.ts
 */

export type UnifiedViewMode = 'unified' | 'classic';

export interface UnifiedPatientState {
  id: string | null;
  name: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  ageYears: number | '';
  ageMonths: number | '';
  ageDays: number | '';
  birthDate: string; // ISO string or YYYY-MM-DD
  birthDateEstimated: boolean;
  doctorId: string | null;
  isUrgent: boolean;
  notes: string;
  visitCount?: number;
  outstandingDebt?: number;
  lastTestIds?: string[];
  lastTestNames?: string[];
}

export interface UnifiedCartItem {
  id: string;
  name: string;
  code?: string;
  arabicName?: string | null;
  category: string;
  price: number;
  sampleType?: string;
  gender?: string;
  unit?: string;
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  refRangeText?: string | null;
  referenceRanges?: any[];
  isCalculated?: boolean;
}

export type UnifiedResultStatus = 'NORMAL' | 'HIGH' | 'LOW' | 'PANIC' | 'NONE';

export interface UnifiedResultItem {
  testId: string;
  testName: string;
  testCode?: string;
  category?: string;
  value: string;
  unit: string;
  refRangeText: string;
  status: UnifiedResultStatus;
  arrow?: '↑' | '↓' | '';
  isCalculated: boolean;
  isDirectOverride: boolean;
  sampleTestId?: string;
  formulaKey?: 'LDL' | 'VLDL' | 'NON_HDL' | 'TC_HDL' | 'LDL_HDL' | 'EGFR' | null;
  invalidReason?: string;
}

export interface UnifiedInvoiceState {
  grossTotal: number;
  netTotal: number;
  doctorCommission: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: 'CASH' | 'DEBT' | 'CARD';
  canSeePrices: boolean;
}

export interface UnifiedTubeBadge {
  id: 'edta' | 'citrate' | 'sst' | 'container' | string;
  name: string;
  tubeType: string;
  color: string;
  bg: string;
  dotColor: string;
  count: number;
  testNames: string[];
}

export interface UnifiedWorkspaceReturn {
  // Patient
  patient: UnifiedPatientState;
  setPatient: React.Dispatch<React.SetStateAction<UnifiedPatientState>>;
  updatePatientField: <K extends keyof UnifiedPatientState>(field: K, value: UnifiedPatientState[K]) => void;
  setAgeYears: (years: number | '') => void;
  setAgeMonths: (months: number | '') => void;
  setAgeDays: (days: number | '') => void;
  setBirthDate: (birthDate: string) => void;
  selectExistingPatient: (patient: any) => void;
  resetPatient: () => void;

  // Catalog & Cart
  catalogTests: any[];
  selectedTests: UnifiedCartItem[];
  addTestToCart: (test: any) => boolean;
  removeTestFromCart: (testId: string) => void;
  clearCart: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredCatalog: any[];
  applyBundle: (bundleKey: string) => void;

  // Results & Formulas
  results: Record<string, UnifiedResultItem>;
  updateResultValue: (testId: string, value: string, isDirectOverride?: boolean) => void;
  directLdlOverride: number | null;
  setDirectLdlOverride: (override: number | null) => void;

  // Invoice & Pricing (Discount Removed)
  invoice: UnifiedInvoiceState;
  setPaidAmount: (amount: number) => void;
  setPaymentMethod: (method: 'CASH' | 'DEBT' | 'CARD') => void;

  // Tube Badges
  tubeBadges: UnifiedTubeBadge[];

  // General Helpers
  doctors: any[];
  userRole: string;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}
