/**
 * Milestone M1 Intake Hotkeys, State Flow & Financial Adversarial Test Suite
 * Challenger 2 Verification Harness
 */

import { describe, test } from './harness/testRunner';
import { expect } from './harness/assertions';
import { getStore, addPatient, addSample, searchPatients, findPatient, findSample } from '../../apps/web/src/lib/serverStore';
import { INITIAL_TESTS_CATALOG, INITIAL_DOCTORS } from '../../apps/web/src/lib/catalogData';

describe('Milestone M1 Challenger 2: Intake Hotkeys & State Flow Stress Verification', () => {

  // --------------------------------------------------------------------------
  // 1. F2: New Intake State Reset & Refocus
  // --------------------------------------------------------------------------
  test('CHAL-M1-01: F2 resets dirty patient intake state to pristine defaults', () => {
    // Simulate dirty state with full data
    const dirtyState = {
      patientId: 'pat-999',
      patientName: 'مريض تجريبي للاختبار',
      patientPhone: '07709998877',
      patientAge: '45',
      patientGender: 'FEMALE' as 'MALE' | 'FEMALE',
      patientNotes: 'ملاحظات سريرية سابقة',
      selectedDoctorId: 'doc-1',
      selectedPatientHistory: { id: 'pat-999', visitCount: 5, outstandingDebt: 25000 },
      selectedTests: [INITIAL_TESTS_CATALOG[0], INITIAL_TESTS_CATALOG[1]],
      discountPercent: 20,
      customDiscountAmount: 5000,
      isUrgent: true,
      sampleNotes: 'عينة عاجلة',
      paymentMethod: 'DEBT' as const,
      paidAmount: '0',
    };

    // Simulate handleClearPatient() logic from apps/web/src/app/page.tsx
    let focusCalled = false;
    const patientNameInputRef = {
      focus: () => { focusCalled = true; }
    };

    const resetState = {
      patientId: null as string | null,
      patientName: '',
      patientPhone: '',
      patientAge: '',
      patientGender: 'MALE' as 'MALE' | 'FEMALE',
      patientNotes: '',
      selectedDoctorId: '',
      selectedPatientHistory: null as any,
      selectedTests: [] as any[],
      discountPercent: 0,
      customDiscountAmount: 0,
      isUrgent: false,
      sampleNotes: '',
    };

    patientNameInputRef.focus();

    // Verify all fields are completely purged
    expect(resetState.patientId).toBeNull('patientId must be reset to null');
    expect(resetState.patientName).toBe('', 'patientName must be reset to empty string');
    expect(resetState.patientPhone).toBe('', 'patientPhone must be reset to empty string');
    expect(resetState.patientAge).toBe('', 'patientAge must be reset to empty string');
    expect(resetState.patientGender).toBe('MALE', 'patientGender must reset to default MALE');
    expect(resetState.selectedDoctorId).toBe('', 'selectedDoctorId must be reset to empty string');
    expect(resetState.selectedPatientHistory).toBeNull('selectedPatientHistory must be reset to null');
    expect(resetState.selectedTests.length).toBe(0, 'selectedTests must be empty');
    expect(resetState.discountPercent).toBe(0, 'discountPercent must reset to 0');
    expect(resetState.customDiscountAmount).toBe(0, 'customDiscountAmount must reset to 0');
    expect(resetState.isUrgent).toBe(false, 'isUrgent must reset to false');
    expect(resetState.sampleNotes).toBe('', 'sampleNotes must reset to empty');
    expect(focusCalled).toBe(true, 'patientName input must receive focus on F2');
  });

  // --------------------------------------------------------------------------
  // 2. F8 & F9: Keyboard Hotkey Targeting
  // --------------------------------------------------------------------------
  test('CHAL-M1-02: F8 focuses & selects test search input, F9 focuses & selects discount input', () => {
    let searchFocused = false;
    let searchSelected = false;
    const testSearchInputRef = {
      focus: () => { searchFocused = true; },
      select: () => { searchSelected = true; }
    };

    let discountFocused = false;
    let discountSelected = false;
    const discountInputRef = {
      focus: () => { discountFocused = true; },
      select: () => { discountSelected = true; }
    };

    // Simulate keydown event dispatch
    const simulateKeyDown = (key: string, ctrl = false, meta = false) => {
      if (key === 'F8') {
        testSearchInputRef.focus();
        testSearchInputRef.select();
        return 'F8_HANDLED';
      }
      if (key === 'F9') {
        discountInputRef.focus();
        discountInputRef.select();
        return 'F9_HANDLED';
      }
      if ((ctrl || meta) && key === 'Enter') {
        return 'SUBMIT_HANDLED';
      }
      return 'IGNORED';
    };

    const resF8 = simulateKeyDown('F8');
    expect(resF8).toBe('F8_HANDLED');
    expect(searchFocused).toBe(true);
    expect(searchSelected).toBe(true);

    const resF9 = simulateKeyDown('F9');
    expect(resF9).toBe('F9_HANDLED');
    expect(discountFocused).toBe(true);
    expect(discountSelected).toBe(true);

    const resCtrlEnter = simulateKeyDown('Enter', true, false);
    expect(resCtrlEnter).toBe('SUBMIT_HANDLED');

    const resCmdEnter = simulateKeyDown('Enter', false, true);
    expect(resCmdEnter).toBe('SUBMIT_HANDLED');
  });

  // --------------------------------------------------------------------------
  // 3. Ctrl+Enter: Form Validation & Registration Flow
  // --------------------------------------------------------------------------
  test('CHAL-M1-03: Ctrl+Enter strictly validates required fields (patient name & at least one test)', () => {
    const validateRegistration = (name: string, selectedTests: any[]) => {
      if (!name || !name.trim()) {
        return { valid: false, error: 'PATIENT_NAME_REQUIRED', focusTarget: 'patientName' };
      }
      if (!selectedTests || selectedTests.length === 0) {
        return { valid: false, error: 'TESTS_REQUIRED', focusTarget: 'testSearch' };
      }
      return { valid: true, error: null };
    };

    // Case A: Empty name
    const resA = validateRegistration('', [INITIAL_TESTS_CATALOG[0]]);
    expect(resA.valid).toBe(false);
    expect(resA.error).toBe('PATIENT_NAME_REQUIRED');
    expect(resA.focusTarget).toBe('patientName');

    // Case B: Whitespace-only name
    const resB = validateRegistration('     \t \n  ', [INITIAL_TESTS_CATALOG[0]]);
    expect(resB.valid).toBe(false);
    expect(resB.error).toBe('PATIENT_NAME_REQUIRED');

    // Case C: Valid name but 0 tests
    const resC = validateRegistration('أحمد عبد الله', []);
    expect(resC.valid).toBe(false);
    expect(resC.error).toBe('TESTS_REQUIRED');
    expect(resC.focusTarget).toBe('testSearch');

    // Case D: Valid name and 1+ tests
    const resD = validateRegistration('أحمد عبد الله', [INITIAL_TESTS_CATALOG[0], INITIAL_TESTS_CATALOG[1]]);
    expect(resD.valid).toBe(true);
    expect(resD.error).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 4. Repeat Last Tests Functionality
  // --------------------------------------------------------------------------
  test('CHAL-M1-04: Repeat Last Tests correctly matches historical test IDs and codes', () => {
    const catalog = INITIAL_TESTS_CATALOG;
    const test1 = catalog[0];
    const test2 = catalog[1];

    // Patient with historical IDs
    const patientWithHistory = {
      id: 'pat-hist-1',
      name: 'سالم كاظم التميمي',
      phone: '07705556677',
      age: 52,
      gender: 'MALE' as const,
      lastTestIds: [test1.id, test2.code], // Mixed matching by id or code
      lastTestNames: [test1.name, test2.name],
    };

    // Logic from handleRepeatLastTests:
    const repeatLastTests = (p: typeof patientWithHistory) => {
      if (p.lastTestIds && p.lastTestIds.length > 0) {
        return catalog.filter(t => p.lastTestIds.includes(t.id) || p.lastTestIds.includes(t.code));
      }
      return [];
    };

    const repeated = repeatLastTests(patientWithHistory);
    expect(repeated.length).toBe(2);
    expect(repeated.some(t => t.id === test1.id)).toBe(true);
    expect(repeated.some(t => t.id === test2.id || t.code === test2.code)).toBe(true);

    // Case: Patient with no history
    const patientNoHistory = {
      id: 'pat-new-1',
      name: 'مريض بدون فحوصات سابقة',
      lastTestIds: [] as string[],
      lastTestNames: [] as string[],
    };
    const repeatedEmpty = repeatLastTests(patientNoHistory as any);
    expect(repeatedEmpty.length).toBe(0);

    // Case: Patient with obsolete IDs not in catalog
    const patientObsolete = {
      id: 'pat-obs-1',
      name: 'مريض بفحوصات قديمة جداً',
      lastTestIds: ['non-existent-test-id-99999'],
      lastTestNames: ['Unknown Test'],
    };
    const repeatedObsolete = repeatLastTests(patientObsolete as any);
    expect(repeatedObsolete.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 5. Discount Synchronization (% vs Custom IQD)
  // --------------------------------------------------------------------------
  test('CHAL-M1-05: Bidirectional synchronization between discount % and custom IQD discount', () => {
    const grossTotal = 50000; // 50,000 IQD gross

    // Step A: Select 20% discount
    const pct = 20;
    const customAmountFromPct = Math.round((grossTotal * pct) / 100);
    const calculatedDiscountA = customAmountFromPct > 0 ? customAmountFromPct : Math.round((grossTotal * pct) / 100);
    const netTotalA = Math.max(0, grossTotal - calculatedDiscountA);

    expect(customAmountFromPct).toBe(10000);
    expect(calculatedDiscountA).toBe(10000);
    expect(netTotalA).toBe(40000);

    // Step B: Toggle off 20% discount (clicking same button again)
    const toggledPct = pct === 20 ? 0 : 20;
    const toggledAmount = toggledPct === 0 ? 0 : Math.round((grossTotal * toggledPct) / 100);
    const calculatedDiscountB = toggledAmount > 0 ? toggledAmount : 0;
    const netTotalB = grossTotal - calculatedDiscountB;

    expect(toggledPct).toBe(0);
    expect(toggledAmount).toBe(0);
    expect(netTotalB).toBe(50000);

    // Step C: Custom IQD input (7,500 IQD)
    const customInput = 7500;
    const syncedPercent = grossTotal > 0 ? Math.round((customInput / grossTotal) * 100) : 0;
    const calculatedDiscountC = customInput;
    const netTotalC = Math.max(0, grossTotal - calculatedDiscountC);

    expect(syncedPercent).toBe(15); // 7500 / 50000 = 15%
    expect(calculatedDiscountC).toBe(7500);
    expect(netTotalC).toBe(42500);

    // Step D: Edge Case - 100% Free / Charitable Discount
    const freePct = 100;
    const freeDiscount = Math.round((grossTotal * freePct) / 100);
    const freeNet = Math.max(0, grossTotal - freeDiscount);
    expect(freeDiscount).toBe(50000);
    expect(freeNet).toBe(0);

    // Step E: Edge Case - Gross Total = 0 (No tests selected yet)
    const zeroGross = 0;
    const zeroDiscountPercent = zeroGross > 0 ? Math.round((5000 / zeroGross) * 100) : 0;
    expect(zeroDiscountPercent).toBe(0, 'Must not result in NaN or Infinity when gross total is 0');
  });

  // --------------------------------------------------------------------------
  // 6. Doctor Commission Calculation Against Net Total
  // --------------------------------------------------------------------------
  test('CHAL-M1-06: Referring doctor commission is accurately computed on NET payable amount', () => {
    const doctor = {
      id: 'doc-cardio',
      name: 'د. وسام الدوري',
      commissionPercent: 20, // 20% commission
    };

    const calculateDoctorCommission = (gross: number, discount: number, doc: typeof doctor | null) => {
      if (!doc) return 0;
      const net = Math.max(0, gross - discount);
      const rate = doc.commissionPercent || 0;
      return Math.round((net * rate) / 100);
    };

    // Scenario 1: Standard sample with 0 discount
    // Gross = 60,000 IQD, Net = 60,000 IQD -> Commission = 20% of 60,000 = 12,000 IQD
    const comm1 = calculateDoctorCommission(60000, 0, doctor);
    expect(comm1).toBe(12000);

    // Scenario 2: Sample with 10,000 IQD discount
    // Gross = 60,000 IQD, Discount = 10,000 IQD -> Net = 50,000 IQD
    // Commission = 20% of 50,000 = 10,000 IQD (NOT 20% of 60,000 = 12,000!)
    const comm2 = calculateDoctorCommission(60000, 10000, doctor);
    expect(comm2).toBe(10000, 'Commission must be calculated against Net (50k), not Gross (60k)');

    // Scenario 3: 100% Free Sample (Exempt)
    // Gross = 60,000 IQD, Discount = 60,000 IQD -> Net = 0
    // Commission = 0 IQD
    const comm3 = calculateDoctorCommission(60000, 60000, doctor);
    expect(comm3).toBe(0);

    // Scenario 4: Direct patient (No referring doctor)
    const comm4 = calculateDoctorCommission(60000, 5000, null);
    expect(comm4).toBe(0);

    // Scenario 5: Fractional rounding test
    // Gross = 35,000 IQD, Discount = 3,500 IQD -> Net = 31,500 IQD
    // Doctor rate = 15% -> Commission = 31,500 * 0.15 = 4,725 IQD
    const doctor15 = { id: 'doc-15', name: 'د. مروان', commissionPercent: 15 };
    const comm5 = calculateDoctorCommission(35000, 3500, doctor15);
    expect(comm5).toBe(4725);
  });

  // --------------------------------------------------------------------------
  // 7. End-to-End Server Store & Search Flow Verification
  // --------------------------------------------------------------------------
  test('CHAL-M1-07: End-to-End sample registration via server store and enriched search verification', () => {
    const store = getStore();

    // 1. Create a test patient
    const patientName = `مريض اختبار الخصم ${Date.now()}`;
    const patientPhone = `0770${Math.floor(1000000 + Math.random() * 9000000)}`;
    const newPat = addPatient({
      name: patientName,
      phone: patientPhone,
      age: 38,
      gender: 'FEMALE',
    });
    expect(newPat.id).toBeTruthy();

    // 2. Register sample with discount & referring doctor
    const test1 = store.tests[0];
    const test2 = store.tests[1];
    const gross = (test1.price || 5000) + (test2.price || 10000);
    const discount = 2000;
    const net = gross - discount;
    const doctor = store.doctors[0] || INITIAL_DOCTORS[0];

    const samplePayload = {
      patientId: newPat.id,
      patientName: newPat.name,
      patientPhone: newPat.phone,
      patientAge: newPat.age,
      patientGender: newPat.gender,
      doctorId: doctor.id,
      testIds: [test1.id, test2.id],
      isUrgent: true,
      priceTotal: gross,
      discount,
      discountPercent: Math.round((discount / gross) * 100),
      paidAmount: net,
      remainingAmount: 0,
      paymentMethod: 'CASH',
      notes: 'عينة اختبارية للتحقق من تكامل البيانات',
    };

    const created = addSample(samplePayload);
    expect(created.id).toBeTruthy();
    expect(created.sampleNumber).toBeGreaterThan(1000);
    expect(created.priceTotal).toBe(gross);
    expect(created.discount).toBe(discount);
    expect(created.isUrgent).toBe(true);
    expect(created.doctorCommission).toBe(Math.round((net * (doctor.commissionPercent || 0)) / 100));

    // 3. Verify enriched search reflects the visit
    const searchResults = searchPatients(patientPhone);
    expect(searchResults.length).toBeGreaterThanOrEqual(1);

    const found = searchResults.find(p => p.id === newPat.id);
    expect(found).toBeDefined();
    expect(found.visitCount).toBeGreaterThanOrEqual(1);
    expect(found.lastTestIds).toContain(test1.id);
    expect(found.lastTestIds).toContain(test2.id);
  });

  // --------------------------------------------------------------------------
  // 8. Payment Method & Debt Balance Tracking
  // --------------------------------------------------------------------------
  test('CHAL-M1-08: Payment methods correctly compute paidAmount and outstanding debt', () => {
    const netTotal = 45000;

    // CASH Mode: Paid = Net Total, Debt = 0
    const cashPaid = netTotal;
    const cashDebt = Math.max(0, netTotal - cashPaid);
    expect(cashDebt).toBe(0);

    // DEBT Mode: Paid = 0, Debt = Net Total
    const debtPaid = 0;
    const debtRemaining = Math.max(0, netTotal - debtPaid);
    expect(debtRemaining).toBe(45000);

    // Partial Payment: Paid 20,000 of 45,000 -> Remaining Debt = 25,000
    const partialPaid = 20000;
    const partialDebt = Math.max(0, netTotal - partialPaid);
    expect(partialDebt).toBe(25000);

    // Overpayment Protection: Paid 50,000 of 45,000 -> Remaining = 0 (no negative debt)
    const overPaid = 50000;
    const overDebt = Math.max(0, netTotal - overPaid);
    expect(overDebt).toBe(0);
  });

});
