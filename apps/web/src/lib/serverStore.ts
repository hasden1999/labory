import { INITIAL_TESTS_CATALOG, INITIAL_PANELS, INITIAL_DOCTORS } from './catalogData';

export interface ServerStore {
  tests: any[];
  panels: any[];
  doctors: any[];
  patients: any[];
  samples: any[];
  settings: any;
}

// Global in-memory store for serverless execution
declare global {
  var __labStore: ServerStore | undefined;
}

function initStore(): ServerStore {
  const patient1 = { id: 'pat-1', name: 'ط­ظٹط¯ط± ط¹ط¨ط¯ ط§ظ„ط­ط³ظٹظ† ط§ظ„ط®ظپط§ط¬ظٹ', phone: '07701239988', age: 48, gender: 'MALE', createdAt: new Date().toISOString() };
  const patient2 = { id: 'pat-2', name: 'ط²ظٹظ†ط¨ ط¬ط§ط³ظ… ظ…ط­ظ…ط¯ ط§ظ„ط¬ط¨ظˆط±ظٹ', phone: '07804445566', age: 29, gender: 'FEMALE', createdAt: new Date().toISOString() };
  const patient3 = { id: 'pat-3', name: 'ط¹ظ…ط± ط·ط§ط±ظ‚ ط§ظ„ط³ط§ظ…ط±ط§ط¦ظٹ', phone: '07707778899', age: 62, gender: 'MALE', createdAt: new Date().toISOString() };

  const gueTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'GUE') || INITIAL_TESTS_CATALOG[0];
  const cbcTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'CBC') || INITIAL_TESTS_CATALOG[0];
  const fbsTest = INITIAL_TESTS_CATALOG.find(t => t.code === 'FBS') || INITIAL_TESTS_CATALOG[1];

  const sample1 = {
    id: 's-1001',
    sampleNumber: 1001,
    patientId: patient1.id,
    patient: patient1,
    doctorId: 'doc-1',
    doctor: INITIAL_DOCTORS[0],
    status: 'READY',
    isUrgent: false,
    priceTotal: 25000,
    discount: 5000,
    discountPercent: 20,
    paidAmount: 20000,
    remainingAmount: 0,
    paymentMethod: 'CASH',
    notes: 'ظپط­طµ ط¯ظˆط±ظٹ - ظٹط¹ط§ظ†ظٹ ظ…ظ† ط­ط±ظ‚ط§ظ† ظپظٹ ط§ظ„ط¨ظˆظ„',
    createdAt: new Date().toISOString(),
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

  const sample2 = {
    id: 's-1002',
    sampleNumber: 1002,
    patientId: patient2.id,
    patient: patient2,
    doctorId: 'doc-2',
    doctor: INITIAL_DOCTORS[1],
    status: 'IN_PROGRESS',
    isUrgent: true,
    priceTotal: 15000,
    discount: 0,
    discountPercent: 0,
    paidAmount: 15000,
    remainingAmount: 0,
    paymentMethod: 'CASH',
    notes: 'ظ…طھط§ط¨ط¹ط© ط§ظ„ط­ظ…ظ„ ظˆط³ظƒط± ط§ظ„ط¯ظ…',
    createdAt: new Date().toISOString(),
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

  return {
    tests: INITIAL_TESTS_CATALOG,
    panels: INITIAL_PANELS,
    doctors: INITIAL_DOCTORS,
    patients: [patient1, patient2, patient3],
    samples: [sample1, sample2],
    settings: {
      labName: 'ظ…ط®طھط¨ط± ط§ظ„ط±ط¶ط§ ظ„ظ„طھط­ظ„ظٹظ„ط§طھ ط§ظ„ط·ط¨ظٹط© ط§ظ„طھط®طµطµظٹط©',
      labSubtitle: 'ظپط­ظˆطµط§طھ ظ…ط±ط¶ظٹط© ظˆطھط·ط¨ظٹظ‚ظٹط© ط¯ظ‚ظٹظ‚ط© - طھط´ط®ظٹطµ ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ…طھظƒط§ظ…ظ„ ظˆظ…ط¹طھظ…ط¯',
      doctorName: 'ط¯. ط£ط­ظ…ط¯ ط§ظ„ط±ط¶ط§',
      doctorTitle: 'ط§ط³طھط´ط§ط±ظٹ ط§ظ„طھط­ظ„ظٹظ„ط§طھ ط§ظ„ظ…ط±ط¶ظٹط© ظˆط§ظ„ظ…ظ†ط§ط¹ط© ط§ظ„ط³ط±ظٹط±ظٹط©',
      labLicense: 'MOH-IQ-2026-8842',
      whatsappNumber: '07701234567',
      currency: 'ط¯.ط¹',
      address: 'ط¨ط؛ط¯ط§ط¯ - ط´ط§ط±ط¹ ط§ظ„ط£ط·ط¨ط§ط، - ظ…ظ‚ط§ط¨ظ„ ط§ظ„ظ…ط¬ظ…ط¹ ط§ظ„ط·ط¨ظٹ ط§ظ„ظ…ط±ظƒط²ظٹ',
      phone: '07701234567 / 07801234567',
      reportHeader: 'ظ…ط®طھط¨ط± ط§ظ„ط±ط¶ط§ ظ„ظ„طھط­ظ„ظٹظ„ط§طھ ط§ظ„ط·ط¨ظٹط© ط§ظ„طھط®طµطµظٹط©',
      reportFooter: 'ظ‡ط°ط§ ط§ظ„طھظ‚ط±ظٹط± طھظ… ط¥ط®ط±ط§ط¬ظ‡ ظˆطھط¯ظ‚ظٹظ‚ظ‡ ط¥ظ„ظƒطھط±ظˆظ†ظٹط§ظ‹طŒ ظˆظٹط¹طھط¨ط± ظ…ط¹طھظ…ط¯ط§ظ‹ ط±ط³ظ…ظٹط§ظ‹ ظˆظ…ط·ط§ط¨ظ‚ط§ظ‹ ظ„ظ…ظˆط§طµظپط§طھ ط§ظ„ط¬ظˆط¯ط© ط§ظ„ظ…ط®ط¨ط±ظٹط© ط§ظ„ط¯ظˆظ„ظٹط© (ISO 15189).',
    }
  };
}

export function getStore(): ServerStore {
  if (!global.__labStore) {
    global.__labStore = initStore();
  }
  return global.__labStore;
}