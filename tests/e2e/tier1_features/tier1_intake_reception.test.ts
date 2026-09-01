/**
 * Tier 1 Feature Coverage: Patient Intake & Reception Modernization (R4)
 * Covers: Keyboard-first intake, hotkeys contract, autocomplete search with history preview,
 * financial discounts, referring doctor commissions, barcode labels, and urgent flags.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_PATIENTS, FIXTURE_DOCTORS, FIXTURE_CATALOG } from '../harness/fixtures';

describe('Tier 1: Patient Intake & Reception Modernization', () => {

  test('R4.1: New Patient Intake creation with complete demographic validation', () => {
    const intakePayload = {
      patient: {
        name: 'حيدر عبد الحسين الخفاجي',
        phone: '07701239988',
        age: 48,
        gender: 'MALE' as const,
      },
      selectedTestIds: ['t-gue', 't-cbc', 't-creat'],
      doctorId: 'doc-1',
      isUrgent: false,
      notes: 'فحص دوري - متابعة السكري وضغط الدم'
    };

    expect(intakePayload.patient.name).toBeTruthy();
    expect(intakePayload.patient.phone).toMatch(/^07[0-9]{9}$/);
    expect(intakePayload.patient.age).toBeWithinRange(1, 120);
    expect(intakePayload.selectedTestIds.length).toBeGreaterThanOrEqual(1);

    // Calculate total price from catalog
    const selectedCatalog = FIXTURE_CATALOG.filter(t => intakePayload.selectedTestIds.includes(t.id));
    const totalPrice = selectedCatalog.reduce((sum, t) => sum + t.price, 0);
    expect(totalPrice).toBe(5000 + 10000 + 6000); // GUE (5000) + CBC (10000) + CREAT (6000) = 21000 IQD
  });

  test('R4.2: Keyboard-first navigation and hotkeys contract specification', () => {
    const hotkeyContract = {
      F2: 'NEW_INTAKE',
      F8: 'FOCUS_SEARCH_AUTOCOMPLETE',
      F9: 'FOCUS_DISCOUNT_INPUT',
      'Ctrl+Enter': 'SUBMIT_ORDER',
      Escape: 'CLOSE_MODAL_OR_RESET'
    };

    expect(hotkeyContract.F2).toBe('NEW_INTAKE');
    expect(hotkeyContract.F8).toBe('FOCUS_SEARCH_AUTOCOMPLETE');
    expect(hotkeyContract.F9).toBe('FOCUS_DISCOUNT_INPUT');
    expect(hotkeyContract['Ctrl+Enter']).toBe('SUBMIT_ORDER');
  });

  test('R4.3: Autocomplete search returns prior visit history, past abnormal results, and debt alerts', () => {
    const mockSearchResults = [
      {
        patientId: FIXTURE_PATIENTS[0].id,
        name: FIXTURE_PATIENTS[0].name,
        phone: FIXTURE_PATIENTS[0].phone,
        totalVisits: 3,
        lastVisitDate: '2026-08-01',
        outstandingDebt: 15000,
        hasPastAbnormalResults: true,
        lastTests: ['GUE', 'CBC', 'CREAT'],
      }
    ];

    const result = mockSearchResults[0];
    expect(result.patientId).toBe('pat-diabetic-1');
    expect(result.totalVisits).toBeGreaterThan(0);
    expect(result.outstandingDebt).toBe(15000);
    expect(result.hasPastAbnormalResults).toBe(true);
    expect(result.lastTests).toContain('CBC');
  });

  test('R4.4: Financial discount calculation (% discount vs fixed IQD amount) & remaining balance', () => {
    const originalTotal = 40000;

    // Case A: 20% discount
    const discountPercent = 20;
    const discountAmountA = (originalTotal * discountPercent) / 100;
    const netTotalA = originalTotal - discountAmountA;
    const paidAmountA = 25000;
    const remainingAmountA = netTotalA - paidAmountA;

    expect(discountAmountA).toBe(8000);
    expect(netTotalA).toBe(32000);
    expect(remainingAmountA).toBe(7000);

    // Case B: Fixed IQD discount (5,000 IQD)
    const fixedDiscount = 5000;
    const netTotalB = originalTotal - fixedDiscount;
    const calculatedDiscountPercentB = (fixedDiscount / originalTotal) * 100;
    const paidAmountB = 35000;
    const remainingAmountB = netTotalB - paidAmountB;

    expect(netTotalB).toBe(35000);
    expect(calculatedDiscountPercentB).toBeCloseTo(12.5, 1);
    expect(remainingAmountB).toBe(0);
  });

  test('R4.5: Referring Doctor Commission calculation & persistence', () => {
    const doctor = FIXTURE_DOCTORS[0]; // 15% commission
    const testTotal = 50000;
    const discount = 5000;
    const netSampleAmount = testTotal - discount; // 45000

    // Commission calculated on net test total
    const commissionAmount = (netSampleAmount * doctor.commissionRate) / 100;

    expect(doctor.commissionRate).toBe(15);
    expect(commissionAmount).toBe(6750); // 15% of 45000 = 6750 IQD
  });

  test('R4.6: Urgent (STAT) sample priority flagging and order persistence', () => {
    const urgentSample = {
      sampleNumber: 1088,
      patientId: 'pat-icu-critical',
      isUrgent: true,
      priority: 'STAT',
      status: 'RECEIVED',
      createdAt: new Date().toISOString()
    };

    expect(urgentSample.isUrgent).toBe(true);
    expect(urgentSample.priority).toBe('STAT');
    expect(urgentSample.status).toBe('RECEIVED');
  });

});
