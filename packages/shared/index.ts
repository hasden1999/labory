export enum Role {
  OWNER = 'OWNER',
  TECHNICIAN = 'TECHNICIAN'
}

export enum SampleStatus {
  RECEIVED = 'RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export interface UserSession {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface PatientDTO {
  id: string;
  name: string;
  phone?: string | null;
  age?: number | null;
  gender?: string | null;
  referringDoctorId?: string | null;
  createdAt: string;
}

export interface SampleDTO {
  id: string;
  sampleNumber: number;
  patientId: string;
  patient?: PatientDTO;
  status: SampleStatus;
  createdById: string;
  createdAt: string;
  tests?: SampleTestDTO[];
}

export interface TestCatalogDTO {
  id: string;
  name: string;
  category: string;
  price: number;
  costEstimate: number;
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  unit?: string | null;
  active: boolean;
}

export interface TestPanelDTO {
  id: string;
  name: string;
  price: number;
  items?: {
    id: string;
    testId: string;
    test: TestCatalogDTO;
  }[];
}

export interface SampleTestDTO {
  id: string;
  sampleId: string;
  testId: string;
  test?: TestCatalogDTO;
  resultValue?: string | null;
  isAbnormal?: boolean | null;
  priceAtTime: number;
  costAtTime: number;
  enteredById?: string | null;
  enteredAt?: string | null;
  createdAt: string;
}

export interface InventoryItemDTO {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderThreshold: number;
  expiryDate?: string | null;
  supplier?: string | null;
  costPerUnit: number;
  linkedTestId?: string | null;
}

export interface ReferringDoctorDTO {
  id: string;
  name: string;
  phone?: string | null;
  commissionPercent: number;
}

export interface ExpenseDTO {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface ProfitReportDTO {
  totalRevenue: number;
  directCosts: number;
  fixedExpenses: number;
  doctorCommissions: number;
  netProfit: number;
  totalCompletedTests: number;
}
