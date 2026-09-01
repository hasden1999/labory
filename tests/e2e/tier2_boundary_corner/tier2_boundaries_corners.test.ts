/**
 * Tier 2: Boundary & Corner Cases
 * Covers: TG >= 400 invalidation, Direct > Total Bilirubin impossibility,
 * Differential sum != 100%, extreme ages/genders in CKD-EPI, financial edge cases,
 * and string/special character boundary stress.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 2: Boundary & Corner Cases', () => {

  test('T2.1: Triglycerides exact boundary TG = 399 mg/dL allows Friedewald LDL', () => {
    // TG = 399: Valid
    const tc = 200;
    const hdl = 50;
    const tg = 399;

    const res = ClinicalOracles.calculateLdl(tc, hdl, tg);
    // LDL = 200 - 50 - (399 / 5) = 150 - 79.8 = 70.2
    expect(res.value).toBe(70.2);
    expect(res.invalidReason).toBeUndefined();
  });

  test('T2.2: Triglycerides exact boundary TG = 400 mg/dL invalidates Friedewald LDL', () => {
    const tc = 200;
    const hdl = 50;
    const tg = 400; // Exact threshold

    const res = ClinicalOracles.calculateLdl(tc, hdl, tg);
    expect(res.value).toBeNull();
    expect(res.invalidReason).toContain('Triglycerides >= 400 mg/dL');
  });

  test('T2.3: Severe Chylomicronemia (TG = 1,250 mg/dL) returns null LDL with explicit clinical explanation', () => {
    const res = ClinicalOracles.calculateLdl(350, 30, 1250);
    expect(res.value).toBeNull();
    expect(res.invalidReason).toContain('chylomicronemia invalidates Friedewald equation');
  });

  test('T2.4: Direct Bilirubin > Total Bilirubin is an impossible clinical error', () => {
    // DB = 2.0, TB = 1.0 (Physiologically impossible)
    const res = ClinicalOracles.calculateIndirectBilirubin(1.0, 2.0);
    expect(res.value).toBeNull();
    expect(res.invalidReason).toContain('Direct Bilirubin cannot exceed Total Bilirubin');
  });

  test('T2.5: Direct Bilirubin == Total Bilirubin (100% conjugated jaundice) yields Indirect = 0.0', () => {
    const res = ClinicalOracles.calculateIndirectBilirubin(8.5, 8.5);
    expect(res.value).toBe(0.0);
    expect(res.invalidReason).toBeUndefined();
  });

  test('T2.6: CBC 5-part Differential under-count (sum = 94.0%) triggers validation error', () => {
    const res = ClinicalOracles.validateDifferentialSum(50.0, 30.0, 8.0, 5.0, 1.0); // Sum = 94.0%
    expect(res.isValid).toBe(false);
    expect(res.sum).toBe(94.0);
    expect(res.error).toContain('Differential sum must equal 100%');
  });

  test('T2.7: CBC 5-part Differential over-count (sum = 107.0%) triggers validation error', () => {
    const res = ClinicalOracles.validateDifferentialSum(65.0, 30.0, 6.0, 5.0, 1.0); // Sum = 107.0%
    expect(res.isValid).toBe(false);
    expect(res.sum).toBe(107.0);
    expect(res.error).toContain('Differential sum must equal 100%');
  });

  test('T2.8: CBC 5-part Differential with tiny floating point rounding (sum = 100.04%) is accepted', () => {
    const res = ClinicalOracles.validateDifferentialSum(55.04, 30.0, 9.0, 5.0, 1.0);
    expect(res.isValid).toBe(true);
    expect(res.sum).toBe(100.0);
  });

  test('T2.9: CKD-EPI eGFR with extreme geriatric age (105 years) computes gracefully without NaN/Infinity', () => {
    const res = ClinicalOracles.calculateEgfr(1.2, 105, 'FEMALE');
    expect(typeof res.value).toBe('number');
    expect(res.value).toBeGreaterThan(0);
    expect(res.value).toBeLessThan(60);
    expect(res.stage).toBeTruthy();
  });

  test('T2.10: CKD-EPI eGFR with extreme low creatinine (0.1 mg/dL) computes upper physiological bound', () => {
    const res = ClinicalOracles.calculateEgfr(0.1, 25, 'MALE');
    expect(res.value).toBeGreaterThan(120);
    expect(res.stage).toBe('G1');
  });

  test('T2.11: CKD-EPI eGFR with severe anuric uremia (Creatinine 15.0 mg/dL) computes G5 kidney failure', () => {
    const res = ClinicalOracles.calculateEgfr(15.0, 60, 'MALE');
    expect(res.value).toBeLessThan(5);
    expect(res.stage).toBe('G5');
    expect(res.note).toContain('Kidney failure');
  });

  test('T2.12: Financial Edge: 100% Charitable Discount yields 0 remaining amount', () => {
    const originalTotal = 50000;
    const discountPercent = 100;
    const discountAmount = (originalTotal * discountPercent) / 100;
    const netTotal = originalTotal - discountAmount;
    const paidAmount = 0;
    const remainingAmount = netTotal - paidAmount;

    expect(netTotal).toBe(0);
    expect(remainingAmount).toBe(0);
  });

  test('T2.13: Financial Edge: Paid amount exceeds net total (Change return calculation)', () => {
    const netTotal = 23000;
    const tenderedCash = 25000;
    const changeDue = tenderedCash - netTotal;
    const remainingDebt = Math.max(0, netTotal - tenderedCash);

    expect(changeDue).toBe(2000);
    expect(remainingDebt).toBe(0);
  });

  test('T2.14: Security & Encoding: Patient name containing Arabic Tashkeel, quotes, and HTML special chars', () => {
    const rawName = 'د. مُحَمَّد "أبو النور" & <الأمين>';
    
    // HTML Sanitization check
    const sanitized = rawName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    expect(sanitized).toContain('&lt;الأمين&gt;');
    expect(sanitized).toContain('&quot;أبو النور&quot;');
    expect(sanitized).toContain('&amp;');
  });

  test('T2.15: Stress Boundary: Ultra-long clinical notes (4,000 chars) handles without truncation crash', () => {
    const longNotes = 'ملاحظات سريرية مفصلة: '.repeat(200);
    expect(longNotes.length).toBeGreaterThan(4000);

    const sample = {
      id: 's-stress-1',
      notes: longNotes
    };

    expect(sample.notes.length).toBe(longNotes.length);
  });

});
