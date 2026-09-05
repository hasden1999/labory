import { INITIAL_TESTS_CATALOG, INITIAL_PANELS, INITIAL_DOCTORS } from './catalogData';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps', 'web'), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lab_store.json');

export interface LabSettings {
  labName: string;
  labSubtitle?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  headerMode: 'DIGITAL' | 'PREPRINTED';
  reportTemplate: 'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED';
  topMarginMm: number; // e.g. 35 for pre-printed letterhead
  bottomMarginMm: number; // e.g. 25
  leftMarginMm: number;
  rightMarginMm: number;
  primaryColor?: string;
  doctorLicense?: string;
  doctorName?: string;
  doctorTitle?: string;
  labLicense?: string;
  whatsappNumber?: string;
  currency?: string;
  reportHeader?: string;
  reportFooter?: string;
  accreditationBadge?: string;
  enableQrCode: boolean;
  qrCodePosition?: 'HEADER' | 'FOOTER';
  defaultDiscountPercent?: number;
}

export interface PatientRecord {
  id: string;
  name: string;
  phone?: string;
  age?: number | null;
  gender: 'MALE' | 'FEMALE';
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorRecord {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  commissionPercent: number;
  clinicAddress?: string;
  notes?: string;
  createdAt?: string;
}

export interface SampleTestRecord {
  id: string;
  sampleId: string;
  testId: string;
  test: any;
  resultValue?: string | null;
  isAbnormal?: boolean;
  interpretation?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  completedAt?: string;
  [key: string]: any;
}

export interface SampleRecord {
  id: string;
  sampleNumber: number;
  patientId: string;
  patient: PatientRecord;
  doctorId?: string | null;
  doctor?: DoctorRecord | null;
  doctorCommission?: number;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
  isUrgent: boolean;
  priceTotal: number;
  discount: number;
  discountPercent: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'CASH' | 'DEBT' | 'CARD';
  notes?: string;
  createdAt: string;
  tests: SampleTestRecord[];
}

export interface ServerStore {
  tests: any[];
  panels: any[];
  doctors: DoctorRecord[];
  patients: PatientRecord[];
  samples: SampleRecord[];
  settings: LabSettings;
}

declare global {
  var __labStore: ServerStore | undefined;
}

function initStore(): ServerStore {
  const patient1: PatientRecord = { id: 'pat-1', name: 'حيدر عبد الحسين الخفاجي', phone: '07701239988', age: 48, gender: 'MALE', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() };
  const patient2: PatientRecord = { id: 'pat-2', name: 'زينب جاسم محمد الجبوري', phone: '07804445566', age: 29, gender: 'FEMALE', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() };
  const patient3: PatientRecord = { id: 'pat-3', name: 'عمر طارق السامرائي', phone: '07707778899', age: 62, gender: 'MALE', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() };

  const gueTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'GUE') || INITIAL_TESTS_CATALOG[0];
  const cbcTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'CBC') || INITIAL_TESTS_CATALOG[0];
  const fbsTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'FBS') || INITIAL_TESTS_CATALOG[1];
  const lipidTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'LIPID' || t.code === 'CHO') || INITIAL_TESTS_CATALOG[2];

  const sample1: SampleRecord = {
    id: 's-1001',
    sampleNumber: 1001,
    patientId: patient1.id,
    patient: patient1,
    doctorId: 'doc-1',
    doctor: INITIAL_DOCTORS[0],
    doctorCommission: 3000,
    status: 'READY',
    isUrgent: false,
    priceTotal: 25000,
    discount: 5000,
    discountPercent: 20,
    paidAmount: 20000,
    remainingAmount: 0,
    paymentMethod: 'CASH',
    notes: 'فحص دوري - يعاني من حرقان في البول',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    tests: [
      {
        id: 'st-1',
        sampleId: 's-1001',
        testId: gueTest.id,
        test: gueTest,
        resultValue: 'Color: Yellow, Clarity: Turbid, Pus: 15-20, RBCs: 4-6, Ca. Oxalate: ++, Bacteria: Moderate (++)',
        isAbnormal: true,
        status: 'COMPLETED',
        notes: 'G.U.E Result Recorded',
      },
      {
        id: 'st-2',
        sampleId: 's-1001',
        testId: cbcTest.id,
        test: cbcTest,
        resultValue: '13.8',
        isAbnormal: false,
        status: 'COMPLETED',
      }
    ],
  };

  const sample2: SampleRecord = {
    id: 's-1002',
    sampleNumber: 1002,
    patientId: patient2.id,
    patient: patient2,
    doctorId: 'doc-2',
    doctor: INITIAL_DOCTORS[1],
    doctorCommission: 1500,
    status: 'IN_PROGRESS',
    isUrgent: true,
    priceTotal: 15000,
    discount: 0,
    discountPercent: 0,
    paidAmount: 15000,
    remainingAmount: 0,
    paymentMethod: 'CASH',
    notes: 'متابعة الحمل وسكر الدم',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    tests: [
      {
        id: 'st-3',
        sampleId: 's-1002',
        testId: fbsTest.id,
        test: fbsTest,
        resultValue: null,
        isAbnormal: false,
        status: 'PENDING',
      },
      {
        id: 'st-4',
        sampleId: 's-1002',
        testId: gueTest.id,
        test: gueTest,
        resultValue: null,
        isAbnormal: false,
        status: 'PENDING',
      }
    ],
  };

  const sample3: SampleRecord = {
    id: 's-1003',
    sampleNumber: 1003,
    patientId: patient3.id,
    patient: patient3,
    doctorId: 'doc-3',
    doctor: INITIAL_DOCTORS[2],
    doctorCommission: 3000,
    status: 'READY',
    isUrgent: false,
    priceTotal: 30000,
    discount: 0,
    discountPercent: 0,
    paidAmount: 15000,
    remainingAmount: 15000, // Outstanding debt
    paymentMethod: 'DEBT',
    notes: 'مريض سكري وضغط - متبقي دين 15,000 د.ع',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    tests: [
      {
        id: 'st-5',
        sampleId: 's-1003',
        testId: fbsTest.id,
        test: fbsTest,
        resultValue: '215',
        isAbnormal: true,
        status: 'COMPLETED',
        notes: 'سكر صائم مرتفع',
      },
      {
        id: 'st-6',
        sampleId: 's-1003',
        testId: lipidTest.id,
        test: lipidTest,
        resultValue: '240',
        isAbnormal: true,
        status: 'COMPLETED',
      }
    ],
  };

  return {
    tests: INITIAL_TESTS_CATALOG,
    panels: INITIAL_PANELS,
    doctors: [...INITIAL_DOCTORS],
    patients: [patient1, patient2, patient3],
    samples: [sample1, sample2, sample3],
    settings: {
      labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
      labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل ومعتمد',
      doctorName: 'د. أحمد الرضا',
      doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
      doctorLicense: 'MOH-IQ-2026-8842',
      labLicense: 'MOH-IQ-2026-8842',
      whatsappNumber: '07701234567',
      currency: 'د.ع',
      address: 'بغداد - شارع الأطباء - مقابل المجمع الطبي المركزي',
      phone: '07701234567 / 07801234567',
      reportHeader: 'مختبر الرضا للتحليلات الطبية التخصصية',
      reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).',
      headerMode: 'DIGITAL',
      reportTemplate: 'CLASSIC',
      topMarginMm: 35,
      bottomMarginMm: 25,
      leftMarginMm: 15,
      rightMarginMm: 15,
      primaryColor: '#0284c7',
      accreditationBadge: 'ISO 15189 CERTIFIED',
      enableQrCode: true,
      qrCodePosition: 'FOOTER',
      defaultDiscountPercent: 0,
    }
  };
}

export function saveStoreToFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (global.__labStore) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(global.__labStore, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to save store to file:', err);
  }
}

export function loadStoreFromFile(): ServerStore | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.patients) && Array.isArray(parsed.samples)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load store from file:', err);
  }
  return null;
}

export function getStore(): ServerStore {
  if (!global.__labStore) {
    const fromFile = loadStoreFromFile();
    if (fromFile) {
      global.__labStore = fromFile;
    } else {
      global.__labStore = initStore();
      saveStoreToFile();
    }
  }
  return global.__labStore;
}

// -------------------------------------------------------------
// Patients CRUD Helpers
// -------------------------------------------------------------

export function findPatient(idOrPhone: string): PatientRecord | undefined {
  const store = getStore();
  return store.patients.find(p => p.id === idOrPhone || p.phone === idOrPhone);
}

export function addPatient(data: Partial<PatientRecord> & { name: string; gender?: 'MALE' | 'FEMALE' }): PatientRecord {
  const store = getStore();
  const newPatient: PatientRecord = {
    id: data.id || `pat-${Date.now()}`,
    name: data.name.trim(),
    phone: data.phone?.trim() || '',
    age: data.age !== undefined && data.age !== null ? Number(data.age) : null,
    gender: data.gender || 'MALE',
    address: data.address || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.patients.unshift(newPatient);
  saveStoreToFile();
  return newPatient;
}

export function updatePatient(id: string, data: Partial<PatientRecord>): PatientRecord | null {
  const store = getStore();
  const index = store.patients.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updated: PatientRecord = {
    ...store.patients[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  store.patients[index] = updated;

  // Also sync in-memory patient in existing samples
  store.samples.forEach(s => {
    if (s.patientId === id) {
      s.patient = { ...s.patient, ...updated };
    }
  });

  saveStoreToFile();
  return updated;
}

export function deletePatient(id: string): boolean {
  const store = getStore();
  const index = store.patients.findIndex(p => p.id === id);
  if (index === -1) return false;
  store.patients.splice(index, 1);
  saveStoreToFile();
  return true;
}

export function searchPatients(q: string) {
  const store = getStore();
  const query = q.trim().toLowerCase();

  const matched = !query
    ? store.patients.slice(0, 15)
    : store.patients.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(query);
        const phoneMatch = p.phone && p.phone.includes(query);
        const idMatch = p.id?.toLowerCase().includes(query);
        return nameMatch || phoneMatch || idMatch;
      });

  return matched.map(p => {
    // Find all samples for this patient
    const patientSamples = store.samples
      .filter(s => s.patientId === p.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalBilled = patientSamples.reduce((sum, s) => sum + (s.priceTotal - (s.discount || 0)), 0);
    const totalPaid = patientSamples.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const outstandingDebt = patientSamples.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    const lastVisit = patientSamples[0] || null;
    const lastTestIds = lastVisit ? lastVisit.tests.map(t => t.testId) : [];
    const lastTestNames = lastVisit ? lastVisit.tests.map(t => t.test?.name || t.test?.code || t.testId) : [];

    // Extract abnormal flags across past tests
    const abnormalList: string[] = [];
    patientSamples.forEach(s => {
      s.tests.forEach(t => {
        if (t.isAbnormal) {
          const testName = t.test?.name || t.test?.code || 'Test';
          abnormalList.push(`${testName} (${t.resultValue || 'Abnormal'})`);
        }
      });
    });

    return {
      ...p,
      visitCount: patientSamples.length,
      priorVisits: patientSamples.slice(0, 5).map(s => ({
        id: s.id,
        sampleNumber: s.sampleNumber,
        status: s.status,
        createdAt: s.createdAt,
        priceTotal: s.priceTotal,
        discount: s.discount,
        paidAmount: s.paidAmount,
        remainingAmount: s.remainingAmount,
        isUrgent: s.isUrgent,
        testsCount: s.tests.length,
        testsSummary: s.tests.map(t => t.test?.code || t.test?.name).join(', '),
      })),
      lastVisit: lastVisit ? {
        id: lastVisit.id,
        sampleNumber: lastVisit.sampleNumber,
        createdAt: lastVisit.createdAt,
        status: lastVisit.status,
      } : null,
      lastTestIds,
      lastTestNames,
      abnormalFlags: Array.from(new Set(abnormalList)),
      outstandingDebt: Math.max(0, outstandingDebt),
      totalBilled,
      totalPaid,
    };
  });
}

// -------------------------------------------------------------
// Doctors CRUD Helpers
// -------------------------------------------------------------

export function getDoctors(): DoctorRecord[] {
  return getStore().doctors;
}

export function findDoctor(id: string): DoctorRecord | undefined {
  return getStore().doctors.find(d => d.id === id);
}

export function addDoctor(data: Partial<DoctorRecord> & { name: string }): DoctorRecord {
  const store = getStore();
  const newDoctor: DoctorRecord = {
    id: data.id || `doc-${Date.now()}`,
    name: data.name.trim(),
    phone: data.phone?.trim() || '',
    specialty: data.specialty?.trim() || 'General Medicine',
    commissionPercent: typeof data.commissionPercent === 'number' ? data.commissionPercent : 10,
    clinicAddress: data.clinicAddress?.trim() || '',
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  store.doctors.push(newDoctor);
  saveStoreToFile();
  return newDoctor;
}

export function updateDoctor(id: string, data: Partial<DoctorRecord>): DoctorRecord | null {
  const store = getStore();
  const index = store.doctors.findIndex(d => d.id === id);
  if (index === -1) return null;
  const updated: DoctorRecord = {
    ...store.doctors[index],
    ...data,
  };
  store.doctors[index] = updated;

  // Also update in-memory samples referencing this doctor
  store.samples.forEach(s => {
    if (s.doctorId === id) {
      s.doctor = updated;
    }
  });

  saveStoreToFile();
  return updated;
}

export function deleteDoctor(id: string): boolean {
  const store = getStore();
  const index = store.doctors.findIndex(d => d.id === id);
  if (index === -1) return false;
  store.doctors.splice(index, 1);
  saveStoreToFile();
  return true;
}

// -------------------------------------------------------------
// Samples CRUD Helpers
// -------------------------------------------------------------

export function getSamples(): SampleRecord[] {
  return getStore().samples;
}

export function findSample(idOrNumber: string): SampleRecord | undefined {
  const store = getStore();
  return store.samples.find(s => s.id === idOrNumber || String(s.sampleNumber) === idOrNumber);
}

export function addSample(data: any): SampleRecord {
  const store = getStore();

  let patient = store.patients.find(p => p.id === data.patientId);
  if (!patient) {
    patient = addPatient({
      name: data.patientName || data.name || 'مريض جديد',
      phone: data.patientPhone || data.phone || '',
      age: data.patientAge ? Number(data.patientAge) : (data.age ? Number(data.age) : null),
      gender: data.patientGender || data.gender || 'MALE',
    });
  }

  const sampleNum = store.samples.length > 0
    ? Math.max(...store.samples.map(s => s.sampleNumber || 1000)) + 1
    : 1001;

  const testIds: string[] = data.testIds || (data.tests ? data.tests.map((t: any) => t.id || t.testId) : []);
  const sampleTests: SampleTestRecord[] = testIds.map((tId, idx) => {
    const catalogTest = store.tests.find(t => t.id === tId || t.code === tId) || store.tests[0];
    return {
      id: `st-${Date.now()}-${idx}`,
      sampleId: `s-${sampleNum}`,
      testId: catalogTest.id,
      test: catalogTest,
      resultValue: null,
      isAbnormal: false,
      status: 'PENDING',
    };
  });

  const doctor = data.doctorId ? store.doctors.find(d => d.id === data.doctorId) || null : null;
  const priceTotal = Number(data.priceTotal || data.totalPrice || 0);
  const discount = Number(data.discount || 0);
  const discountPercent = Number(data.discountPercent || 0);
  const paidAmount = Number(data.paidAmount || 0);
  const netPayable = Math.max(0, priceTotal - discount);
  const remainingAmount = data.remainingAmount !== undefined ? Number(data.remainingAmount) : Math.max(0, netPayable - paidAmount);

  // Commission calculation
  const commissionPercent = doctor ? (doctor.commissionPercent || 0) : 0;
  const doctorCommission = doctor ? Math.round((netTotalCommissionBase(priceTotal, discount) * commissionPercent) / 100) : 0;

  const newSample: SampleRecord = {
    id: `s-${sampleNum}`,
    sampleNumber: sampleNum,
    patientId: patient.id,
    patient,
    doctorId: data.doctorId || null,
    doctor,
    doctorCommission,
    status: 'RECEIVED',
    isUrgent: !!data.isUrgent,
    priceTotal,
    discount,
    discountPercent,
    paidAmount,
    remainingAmount,
    paymentMethod: data.paymentMethod || 'CASH',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    tests: sampleTests,
  };

  store.samples.unshift(newSample);
  saveStoreToFile();
  return newSample;
}

function netTotalCommissionBase(priceTotal: number, discount: number): number {
  return Math.max(0, priceTotal - discount);
}

export function updateSample(id: string, data: Partial<SampleRecord>): SampleRecord | null {
  const store = getStore();
  const index = store.samples.findIndex(s => s.id === id || String(s.sampleNumber) === id);
  if (index === -1) return null;

  const updated: SampleRecord = {
    ...store.samples[index],
    ...data,
  };
  store.samples[index] = updated;
  saveStoreToFile();
  return updated;
}

export function deleteSample(id: string): boolean {
  const store = getStore();
  const index = store.samples.findIndex(s => s.id === id || String(s.sampleNumber) === id);
  if (index === -1) return false;
  store.samples.splice(index, 1);
  saveStoreToFile();
  return true;
}

// -------------------------------------------------------------
// Settings Helper & Margin Safety Clamping
// -------------------------------------------------------------

export function clampMargin(val: any, min = 0, max = 100, defaultVal = 10): number {
  if (val === null || val === undefined) return defaultVal;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num)) return defaultVal;
  return Math.min(max, Math.max(min, num));
}

export function getSettings(): LabSettings {
  return getStore().settings;
}

export function updateSettings(data: Partial<LabSettings>): LabSettings {
  const store = getStore();
  const sanitized = { ...data };
  if (sanitized.topMarginMm !== undefined) {
    sanitized.topMarginMm = clampMargin(sanitized.topMarginMm, 0, 100, 35);
  }
  if (sanitized.bottomMarginMm !== undefined) {
    sanitized.bottomMarginMm = clampMargin(sanitized.bottomMarginMm, 0, 100, 25);
  }
  if (sanitized.leftMarginMm !== undefined) {
    sanitized.leftMarginMm = clampMargin(sanitized.leftMarginMm, 0, 50, 15);
  }
  if (sanitized.rightMarginMm !== undefined) {
    sanitized.rightMarginMm = clampMargin(sanitized.rightMarginMm, 0, 50, 15);
  }
  store.settings = {
    ...store.settings,
    ...sanitized,
  };
  saveStoreToFile();
  return store.settings;
}
