/**
 * Challenger 2: Comprehensive Empirical Delta Check Test Suite
 * Milestone M2: Historical Delta Threshold Challenger
 * 
 * Verifies:
 * 1. Required Clinical Challenge Cases:
 *    - Hemoglobin drop 14.0 -> 10.5 (25.0% -> SIGNIFICANT)
 *    - Hemoglobin drop 14.0 -> 6.5 (53.6% -> CRITICAL)
 *    - Potassium jump 4.0 -> 5.2 (30.0% -> SIGNIFICANT)
 *    - Platelet drop 300 -> 100 (66.7% -> SIGNIFICANT)
 *    - First visit (no prior samples -> hasPrevious=false, NORMAL)
 * 2. Standard Analyte Threshold Accuracy (Renal, Liver, Electrolytes, Glycemic, Hematology)
 * 3. Exact Mathematical & Boundary Edge Testing (Threshold boundaries 19.9% vs 20.0%, 34.9% vs 35.0%)
 * 4. Division by Zero, Negative, Corrupted & Non-Numeric Inputs
 * 5. String Numeric Parsing (commas, whitespace, decimal representations)
 * 6. Batch Multi-Analyte Evaluation & Custom Threshold Overrides
 * 7. Multi-Visit Historical Chronological Traversal & ID/Code Matching
 */

import { describe, test } from '../e2e/harness/testRunner';
import { expect } from '../e2e/harness/assertions';
import {
  evaluateDeltaCheck,
  evaluateMultiAnalyteDeltaChecks,
  compareSampleWithHistory,
  getDeltaThresholdConfig,
  normalizeAnalyteCode,
  DEFAULT_DELTA_THRESHOLDS
} from '../../apps/web/src/lib/deltaCheck';

describe('Challenger 2 - Suite 1: Core Required Clinical Delta Scenarios', () => {

  test('Case 1: Hemoglobin acute drop 14.0 -> 10.5 (25.0% drop -> SIGNIFICANT)', () => {
    const res = evaluateDeltaCheck('HGB', 10.5, 14.0, '2026-08-01', 'sample-prev-1');
    expect(res.hasPrevious).toBe(true);
    expect(res.previousValue).toBe(14.0);
    expect(res.currentValue).toBe(10.5);
    expect(res.deltaPercent).toBe(25.0);
    expect(res.thresholdPercent).toBe(20);
    expect(res.criticalThresholdPercent).toBe(35);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('SIGNIFICANT');
    expect(res.direction).toBe('decreased');
    expect(res.message).toContain('decreased by 25%');
    expect(res.previousSampleId).toBe('sample-prev-1');
    expect(res.previousDate).toBe('2026-08-01');
  });

  test('Case 2: Hemoglobin severe acute drop 14.0 -> 6.5 (53.6% drop -> CRITICAL)', () => {
    const res = evaluateDeltaCheck('HGB', 6.5, 14.0, '2026-08-05');
    expect(res.hasPrevious).toBe(true);
    expect(res.previousValue).toBe(14.0);
    expect(res.currentValue).toBe(6.5);
    expect(res.deltaPercent).toBe(53.6);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('CRITICAL');
    expect(res.direction).toBe('decreased');
    expect(res.message).toContain('decreased by 53.6%');
  });

  test('Case 3: Potassium acute spike 4.0 -> 5.2 (30.0% increase -> SIGNIFICANT)', () => {
    const res = evaluateDeltaCheck('POTASSIUM', 5.2, 4.0);
    expect(res.hasPrevious).toBe(true);
    expect(res.previousValue).toBe(4.0);
    expect(res.currentValue).toBe(5.2);
    expect(res.deltaPercent).toBe(30.0);
    expect(res.thresholdPercent).toBe(25);
    expect(res.criticalThresholdPercent).toBe(40);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('SIGNIFICANT');
    expect(res.direction).toBe('increased');
    expect(res.message).toContain('increased by 30%');
  });

  test('Case 4: Platelet acute drop 300 -> 100 (66.7% drop -> SIGNIFICANT)', () => {
    const res = evaluateDeltaCheck('PLT', 100, 300);
    expect(res.hasPrevious).toBe(true);
    expect(res.previousValue).toBe(300);
    expect(res.currentValue).toBe(100);
    expect(res.deltaPercent).toBe(66.7);
    expect(res.thresholdPercent).toBe(50);
    expect(res.criticalThresholdPercent).toBe(75);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('SIGNIFICANT');
    expect(res.direction).toBe('decreased');
  });

  test('Case 5: First visit (no prior sample -> hasPrevious=false, badgeLevel=NORMAL)', () => {
    // When previousVal is undefined / null / ''
    const res1 = evaluateDeltaCheck('HGB', 14.0, undefined as unknown as number);
    expect(res1.hasPrevious).toBe(false);
    expect(res1.isBreached).toBe(false);
    expect(res1.badgeLevel).toBe('NORMAL');
    expect(res1.message).toBe('No previous record found');

    const res2 = evaluateDeltaCheck('HGB', 14.0, null as unknown as number);
    expect(res2.hasPrevious).toBe(false);
    expect(res2.isBreached).toBe(false);
    expect(res2.badgeLevel).toBe('NORMAL');

    const res3 = evaluateDeltaCheck('HGB', 14.0, '');
    expect(res3.hasPrevious).toBe(false);
    expect(res3.isBreached).toBe(false);
    expect(res3.badgeLevel).toBe('NORMAL');
  });

});

describe('Challenger 2 - Suite 2: Multi-Analyte Standard Threshold Verification', () => {

  test('Creatinine AKI spike: 0.9 -> 1.4 (55.6% -> SIGNIFICANT) vs 0.9 -> 2.0 (122.2% -> CRITICAL)', () => {
    const sig = evaluateDeltaCheck('CREATININE', 1.4, 0.9);
    expect(sig.deltaPercent).toBe(55.6);
    expect(sig.badgeLevel).toBe('SIGNIFICANT');

    const crit = evaluateDeltaCheck('CREATININE', 2.0, 0.9);
    expect(crit.deltaPercent).toBe(122.2);
    expect(crit.badgeLevel).toBe('CRITICAL');
  });

  test('Sodium Osmolar shift (threshold 10%, critical 15%): 140 -> 124 (11.4% -> SIGNIFICANT) vs 140 -> 118 (15.7% -> CRITICAL)', () => {
    const sigNa = evaluateDeltaCheck('NA', 124, 140);
    expect(sigNa.deltaPercent).toBe(11.4);
    expect(sigNa.badgeLevel).toBe('SIGNIFICANT');

    const critNa = evaluateDeltaCheck('SODIUM', 118, 140);
    expect(critNa.deltaPercent).toBe(15.7);
    expect(critNa.badgeLevel).toBe('CRITICAL');
  });

  test('Calcium shift (threshold 15%, critical 30%): 9.5 -> 11.0 (15.8% -> SIGNIFICANT) vs 9.5 -> 6.5 (31.6% -> CRITICAL)', () => {
    const sigCa = evaluateDeltaCheck('CALCIUM', 11.0, 9.5);
    expect(sigCa.deltaPercent).toBe(15.8);
    expect(sigCa.badgeLevel).toBe('SIGNIFICANT');

    const critCa = evaluateDeltaCheck('CA', 6.5, 9.5);
    expect(critCa.deltaPercent).toBe(31.6);
    expect(critCa.badgeLevel).toBe('CRITICAL');
  });

  test('Liver Enzymes AST/ALT (threshold 50%, critical 100%): 35 -> 60 (71.4% -> SIGNIFICANT) vs 35 -> 90 (157.1% -> CRITICAL)', () => {
    const sigAst = evaluateDeltaCheck('AST', 60, 35);
    expect(sigAst.deltaPercent).toBe(71.4);
    expect(sigAst.badgeLevel).toBe('SIGNIFICANT');

    const critAlt = evaluateDeltaCheck('ALT', 90, 35);
    expect(critAlt.deltaPercent).toBe(157.1);
    expect(critAlt.badgeLevel).toBe('CRITICAL');
  });

  test('Fasting Blood Glucose (threshold 50%, critical 100%): 90 -> 140 (55.6% -> SIGNIFICANT) vs 90 -> 210 (133.3% -> CRITICAL)', () => {
    const sigFbs = evaluateDeltaCheck('FBS', 140, 90);
    expect(sigFbs.deltaPercent).toBe(55.6);
    expect(sigFbs.badgeLevel).toBe('SIGNIFICANT');

    const critGlucose = evaluateDeltaCheck('GLUCOSE', 210, 90);
    expect(critGlucose.deltaPercent).toBe(133.3);
    expect(critGlucose.badgeLevel).toBe('CRITICAL');
  });

  test('WBC acute change (threshold 50%, critical 100%): 7.0 -> 11.0 (57.1% -> SIGNIFICANT) vs 7.0 -> 18.0 (157.1% -> CRITICAL)', () => {
    const sigWbc = evaluateDeltaCheck('WBC', 11.0, 7.0);
    expect(sigWbc.deltaPercent).toBe(57.1);
    expect(sigWbc.badgeLevel).toBe('SIGNIFICANT');

    const critWbc = evaluateDeltaCheck('CBC_WBC', 18.0, 7.0);
    expect(critWbc.deltaPercent).toBe(157.1);
    expect(critWbc.badgeLevel).toBe('CRITICAL');
  });

  test('Total Bilirubin / TSB (threshold 50%, critical 80%): 1.0 -> 1.6 (60.0% -> SIGNIFICANT) vs 1.0 -> 2.0 (100.0% -> CRITICAL)', () => {
    const sigTsb = evaluateDeltaCheck('TSB', 1.6, 1.0);
    expect(sigTsb.deltaPercent).toBe(60.0);
    expect(sigTsb.badgeLevel).toBe('SIGNIFICANT');

    const critTsb = evaluateDeltaCheck('TOTAL_BILIRUBIN', 2.0, 1.0);
    expect(critTsb.deltaPercent).toBe(100.0);
    expect(critTsb.badgeLevel).toBe('CRITICAL');
  });

});

describe('Challenger 2 - Suite 3: Boundary Precision & Mathematical Rigor', () => {

  test('Exact Boundary at SIGNIFICANT threshold (HGB: 20.0% vs 19.9%)', () => {
    // 10.0 -> 12.0 = exact 20.0%
    const exactSig = evaluateDeltaCheck('HGB', 12.0, 10.0);
    expect(exactSig.deltaPercent).toBe(20.0);
    expect(exactSig.isBreached).toBe(true);
    expect(exactSig.badgeLevel).toBe('SIGNIFICANT');

    // 10.0 -> 11.99 = 19.9%
    const justBelow = evaluateDeltaCheck('HGB', 11.99, 10.0);
    expect(justBelow.deltaPercent).toBe(19.9);
    expect(justBelow.isBreached).toBe(false);
    expect(justBelow.badgeLevel).toBe('NORMAL');
  });

  test('Exact Boundary at CRITICAL threshold (HGB: 35.0% vs 34.9%)', () => {
    // 10.0 -> 13.5 = exact 35.0%
    const exactCrit = evaluateDeltaCheck('HGB', 13.5, 10.0);
    expect(exactCrit.deltaPercent).toBe(35.0);
    expect(exactCrit.isBreached).toBe(true);
    expect(exactCrit.badgeLevel).toBe('CRITICAL');

    // 10.0 -> 13.49 = 34.9%
    const justBelowCrit = evaluateDeltaCheck('HGB', 13.49, 10.0);
    expect(justBelowCrit.deltaPercent).toBe(34.9);
    expect(justBelowCrit.isBreached).toBe(true);
    expect(justBelowCrit.badgeLevel).toBe('SIGNIFICANT');
  });

  test('Zero change / Identical values produce unchanged direction and NORMAL badge', () => {
    const same = evaluateDeltaCheck('HGB', 14.5, 14.5);
    expect(same.deltaPercent).toBe(0.0);
    expect(same.isBreached).toBe(false);
    expect(same.badgeLevel).toBe('NORMAL');
    expect(same.direction).toBe('unchanged');
  });

  test('Small neonatal values and micro-deltas (Creatinine 0.35 -> 0.60)', () => {
    const neo = evaluateDeltaCheck('CREATININE', 0.60, 0.35);
    expect(neo.deltaPercent).toBe(71.4);
    expect(neo.isBreached).toBe(true);
    expect(neo.badgeLevel).toBe('SIGNIFICANT');
  });

  test('Custom threshold override mechanism', () => {
    // Standard HGB threshold is 20% / 35%. Override to strict 10% / 18%.
    const overridden = evaluateDeltaCheck('HGB', 12.5, 14.0, undefined, undefined, 10, 18);
    // 14.0 -> 12.5 is 10.7% drop -> With default, 10.7% < 20% (NORMAL). With custom (10%), it is SIGNIFICANT.
    expect(overridden.deltaPercent).toBe(10.7);
    expect(overridden.thresholdPercent).toBe(10);
    expect(overridden.criticalThresholdPercent).toBe(18);
    expect(overridden.isBreached).toBe(true);
    expect(overridden.badgeLevel).toBe('SIGNIFICANT');
  });

});

describe('Challenger 2 - Suite 4: Adversarial Inputs & Error Resiliency', () => {

  test('Previous value is zero (division by zero safeguard)', () => {
    const zeroPrev = evaluateDeltaCheck('HGB', 10.0, 0);
    expect(zeroPrev.hasPrevious).toBe(true);
    expect(zeroPrev.isBreached).toBe(false);
    expect(zeroPrev.badgeLevel).toBe('NORMAL');
    expect(zeroPrev.message).toContain('Previous value is zero; delta cannot be calculated');
  });

  test('Current value is empty string / null (missing current measurement)', () => {
    const emptyCurr = evaluateDeltaCheck('HGB', '', 14.0);
    expect(emptyCurr.hasPrevious).toBe(true);
    expect(emptyCurr.isBreached).toBe(false);
    expect(emptyCurr.badgeLevel).toBe('NORMAL');

    const nullCurr = evaluateDeltaCheck('HGB', null as unknown as string, 14.0);
    expect(nullCurr.hasPrevious).toBe(true);
    expect(nullCurr.isBreached).toBe(false);
    expect(nullCurr.badgeLevel).toBe('NORMAL');
  });

  test('Non-numeric corrupted strings ("Pending", "QNS", "Hemolyzed")', () => {
    const qns = evaluateDeltaCheck('HGB', 'QNS', 14.0);
    expect(qns.isBreached).toBe(false);
    expect(qns.badgeLevel).toBe('NORMAL');

    const prevQns = evaluateDeltaCheck('HGB', 12.0, 'Hemolyzed');
    expect(prevQns.hasPrevious).toBe(false);
    expect(prevQns.isBreached).toBe(false);
    expect(prevQns.badgeLevel).toBe('NORMAL');
  });

  test('Numeric strings with formatted commas ("1,250" -> 1250)', () => {
    const commaRes = evaluateDeltaCheck('PLT', '150', '350');
    expect(commaRes.deltaPercent).toBe(57.1);
    expect(commaRes.isBreached).toBe(true);
    expect(commaRes.badgeLevel).toBe('SIGNIFICANT');

    const formattedPrev = evaluateDeltaCheck('PLT', '100', '1,000');
    expect(formattedPrev.deltaPercent).toBe(90.0);
    expect(formattedPrev.badgeLevel).toBe('CRITICAL');
  });

  test('Unknown analyte code falls back to sensible default thresholds (50% / 80%)', () => {
    const unknownConfig = getDeltaThresholdConfig('SOME_OBSCURE_TEST_XYZ');
    expect(unknownConfig.threshold).toBe(50);
    expect(unknownConfig.criticalThreshold).toBe(80);

    const unknownSig = evaluateDeltaCheck('SOME_OBSCURE_TEST_XYZ', 160, 100); // 60%
    expect(unknownSig.badgeLevel).toBe('SIGNIFICANT');

    const unknownCrit = evaluateDeltaCheck('SOME_OBSCURE_TEST_XYZ', 190, 100); // 90%
    expect(unknownCrit.badgeLevel).toBe('CRITICAL');
  });

});

describe('Challenger 2 - Suite 5: Batch Multi-Analyte & Historical Sample Traversal', () => {

  test('Batch evaluation with mixed analytes, breaches, and missing prior results', () => {
    const prior = {
      HGB: 14.0,
      K: 4.0,
      PLT: 300,
      CREATININE: 1.0,
      AST: 30
      // WBC missing in prior
    };

    const current = {
      HGB: 10.5,        // 25% drop -> SIGNIFICANT
      K: 5.2,           // 30% jump -> SIGNIFICANT
      PLT: 100,         // 66.7% drop -> SIGNIFICANT
      CREATININE: 2.2,  // 120% spike -> CRITICAL
      AST: 32,          // 6.7% change -> NORMAL
      WBC: 12.0         // No prior -> should not be in batch output
    };

    const batch = evaluateMultiAnalyteDeltaChecks(current, prior, '2026-08-15', 'sample-batch-01');

    expect(batch.HGB.badgeLevel).toBe('SIGNIFICANT');
    expect(batch.HGB.deltaPercent).toBe(25.0);

    expect(batch.K.badgeLevel).toBe('SIGNIFICANT');
    expect(batch.K.deltaPercent).toBe(30.0);

    expect(batch.PLT.badgeLevel).toBe('SIGNIFICANT');
    expect(batch.PLT.deltaPercent).toBe(66.7);

    expect(batch.CREATININE.badgeLevel).toBe('CRITICAL');
    expect(batch.CREATININE.deltaPercent).toBe(120.0);

    expect(batch.AST.badgeLevel).toBe('NORMAL');
    expect(batch.AST.isBreached).toBe(false);

    expect(batch.WBC).toBeUndefined();
  });

  test('compareSampleWithHistory: Chronological ordering & multi-sample lookup', () => {
    const currentSample = {
      id: 'sample-current',
      tests: [
        { code: 'HGB', resultValue: 9.5 },
        { code: 'CREATININE', resultValue: 2.5 },
        { code: 'SODIUM', resultValue: 138 },
        { code: 'NEW_TEST', resultValue: 50 }
      ]
    };

    const historicalSamples = [
      {
        id: 'sample-v1-oldest',
        createdAt: '2026-06-01T08:00:00Z',
        tests: [
          { code: 'HGB', resultValue: '15.0' },
          { code: 'CREATININE', resultValue: '0.8' },
          { code: 'SODIUM', resultValue: '142' }
        ]
      },
      {
        id: 'sample-v3-newest',
        createdAt: '2026-08-20T10:00:00Z',
        tests: [
          { code: 'HGB', resultValue: '13.0' }, // 13.0 -> 9.5 = 26.9% drop
          { code: 'CREATININE', resultValue: '1.2' } // 1.2 -> 2.5 = 108.3% spike
          // SODIUM omitted in v3
        ]
      },
      {
        id: 'sample-v2-middle',
        createdAt: '2026-07-15T09:00:00Z',
        tests: [
          { code: 'HGB', resultValue: '14.0' },
          { code: 'SODIUM', resultValue: '140' } // Should match this for SODIUM (140 -> 138)
        ]
      }
    ];

    const deltas = compareSampleWithHistory(currentSample, historicalSamples);

    // HGB should match newest sample (sample-v3-newest: 13.0)
    expect(deltas.HGB.previousSampleId).toBe('sample-v3-newest');
    expect(deltas.HGB.previousValue).toBe(13.0);
    expect(deltas.HGB.deltaPercent).toBe(26.9);
    expect(deltas.HGB.badgeLevel).toBe('SIGNIFICANT');

    // CREATININE should match sample-v3-newest (1.2) -> 108.3% spike
    expect(deltas.CREATININE.previousSampleId).toBe('sample-v3-newest');
    expect(deltas.CREATININE.previousValue).toBe(1.2);
    expect(deltas.CREATININE.deltaPercent).toBe(108.3);
    expect(deltas.CREATININE.badgeLevel).toBe('CRITICAL');

    // SODIUM was missing in v3, so it should match sample-v2-middle (140)
    expect(deltas.SODIUM.previousSampleId).toBe('sample-v2-middle');
    expect(deltas.SODIUM.previousValue).toBe(140);
    expect(deltas.SODIUM.deltaPercent).toBe(1.4);
    expect(deltas.SODIUM.badgeLevel).toBe('NORMAL');

    // NEW_TEST has no history
    expect(deltas.NEW_TEST).toBeUndefined();
  });

  test('compareSampleWithHistory: Excludes current sample if included in history array', () => {
    const currentSample = {
      id: 'sample-active',
      createdAt: '2026-08-31T12:00:00Z',
      tests: [{ code: 'HGB', resultValue: 11.0 }]
    };

    const historyWithSelf = [
      currentSample,
      {
        id: 'sample-prior',
        createdAt: '2026-08-10T12:00:00Z',
        tests: [{ code: 'HGB', resultValue: 14.0 }]
      }
    ];

    const deltas = compareSampleWithHistory(currentSample, historyWithSelf);
    expect(deltas.HGB.previousSampleId).toBe('sample-prior');
    expect(deltas.HGB.previousValue).toBe(14.0);
    expect(deltas.HGB.deltaPercent).toBe(21.4);
    expect(deltas.HGB.badgeLevel).toBe('SIGNIFICANT');
  });

  test('compareSampleWithHistory: Empty history returns empty record', () => {
    const currentSample = {
      id: 'sample-first-visit',
      tests: [{ code: 'HGB', resultValue: 14.0 }]
    };

    const deltas = compareSampleWithHistory(currentSample, []);
    expect(Object.keys(deltas).length).toBe(0);
  });

});
