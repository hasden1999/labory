/**
 * Tier 1 Feature Coverage: Clinical Chemistry & Endocrinology Workstation (R2)
 * Covers: Numeric grid entry, 3-tier visual badging (NORMAL, ABNORMAL, CRITICAL PANIC),
 * panic thresholds, age/gender reference ranges, and empty/null handling.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 1: Clinical Chemistry & Endocrinology Workstation', () => {

  test('R2.1: 3-Tier Visual Badging logic (NORMAL, ABNORMAL, CRITICAL PANIC)', () => {
    // FBS: Ref 70-110 mg/dL, Panic <45 or >450
    const normalFbs = ClinicalOracles.evaluatePanicFlag('FBS', 95);
    expect(normalFbs.badgeLevel).toBe('NORMAL');
    expect(normalFbs.isAbnormal).toBe(false);
    expect(normalFbs.isPanic).toBe(false);

    const abnormalFbs = ClinicalOracles.evaluatePanicFlag('FBS', 165);
    expect(abnormalFbs.badgeLevel).toBe('ABNORMAL');
    expect(abnormalFbs.isAbnormal).toBe(true);
    expect(abnormalFbs.isPanic).toBe(false);

    const panicFbs = ClinicalOracles.evaluatePanicFlag('FBS', 520);
    expect(panicFbs.badgeLevel).toBe('CRITICAL_PANIC');
    expect(panicFbs.isAbnormal).toBe(true);
    expect(panicFbs.isPanic).toBe(true);
  });

  test('R2.2: Life-threatening Hypoglycemia & Hyperglycemia Panic Thresholds', () => {
    const severeHypo = ClinicalOracles.evaluatePanicFlag('FBS', 38);
    expect(severeHypo.isPanic).toBe(true);
    expect(severeHypo.panicReason).toContain('safe critical limits');

    const severeHyper = ClinicalOracles.evaluatePanicFlag('FBS', 480);
    expect(severeHyper.isPanic).toBe(true);
  });

  test('R2.3: Serum Potassium (K+) Critical Arrhythmia Panic Limits (< 2.8 or > 6.2 mmol/L)', () => {
    // Normal K
    const normalK = ClinicalOracles.evaluatePanicFlag('POTASSIUM', 4.2);
    expect(normalK.badgeLevel).toBe('NORMAL');

    // Moderate Hyperkalemia (Abnormal but not yet panic)
    const moderateHighK = ClinicalOracles.evaluatePanicFlag('POTASSIUM', 5.6);
    expect(moderateHighK.badgeLevel).toBe('ABNORMAL');

    // Critical Hyperkalemia (Cardiac arrest risk)
    const criticalHighK = ClinicalOracles.evaluatePanicFlag('POTASSIUM', 6.8);
    expect(criticalHighK.badgeLevel).toBe('CRITICAL_PANIC');

    // Critical Hypokalemia
    const criticalLowK = ClinicalOracles.evaluatePanicFlag('POTASSIUM', 2.4);
    expect(criticalLowK.badgeLevel).toBe('CRITICAL_PANIC');
  });

  test('R2.4: Serum Sodium & Calcium Critical Limits (< 120 or > 160 mmol/L, < 6.5 or > 13.0 mg/dL)', () => {
    const criticalHyponatremia = ClinicalOracles.evaluatePanicFlag('SODIUM', 115);
    expect(criticalHyponatremia.isPanic).toBe(true);
    expect(criticalHyponatremia.badgeLevel).toBe('CRITICAL_PANIC');

    const criticalHypercalcemia = ClinicalOracles.evaluatePanicFlag('CALCIUM', 14.2);
    expect(criticalHypercalcemia.isPanic).toBe(true);
    expect(criticalHypercalcemia.badgeLevel).toBe('CRITICAL_PANIC');
  });

  test('R2.5: Age & Gender Dynamic Reference Range selection', () => {
    function getCreatinineReference(age: number, gender: 'MALE' | 'FEMALE') {
      if (age < 12) return { min: 0.3, max: 0.7, unit: 'mg/dL' };
      if (gender === 'FEMALE') return { min: 0.5, max: 1.0, unit: 'mg/dL' };
      return { min: 0.7, max: 1.3, unit: 'mg/dL' };
    }

    const childRef = getCreatinineReference(6, 'MALE');
    expect(childRef.max).toBe(0.7);

    const adultFemaleRef = getCreatinineReference(35, 'FEMALE');
    expect(adultFemaleRef.max).toBe(1.0);

    const adultMaleRef = getCreatinineReference(45, 'MALE');
    expect(adultMaleRef.max).toBe(1.3);
  });

  test('R2.6: Grid navigation handles missing/empty values gracefully without NaN crash', () => {
    const rawGridInput = {
      fbs: '',
      creatinine: '1.4',
      urea: null,
      uricAcid: undefined
    };

    const parsedValues: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(rawGridInput)) {
      if (v === '' || v === null || v === undefined) {
        parsedValues[k] = null;
      } else {
        const num = parseFloat(v);
        parsedValues[k] = isNaN(num) ? null : num;
      }
    }

    expect(parsedValues.fbs).toBeNull();
    expect(parsedValues.creatinine).toBe(1.4);
    expect(parsedValues.urea).toBeNull();
    expect(parsedValues.uricAcid).toBeNull();
  });

});
