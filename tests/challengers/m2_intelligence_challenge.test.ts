/**
 * Milestone M2 Challenger: Clinical Intelligence & Delta Check Empirical Verification Suite
 * Thoroughly exercises pure TypeScript modules:
 * - apps/web/src/lib/clinicalIntelligence.ts
 * - apps/web/src/lib/deltaCheck.ts
 */

import { describe, test } from '../e2e/harness/testRunner';
import { expect } from '../e2e/harness/assertions';
import {
  calculateEgfr,
  calculateLdl,
  calculateVldl,
  calculateNonHdl,
  calculateCardiacRisk,
  calculateIndirectBilirubin,
  calculateAnionGap,
  calculateCorrectedCalcium,
  calculateAgRatio,
  calculateDeRitis,
  calculateEag,
  calculateHomaIr,
  calculateMentzerIndex,
  calculateCbcIndices,
  validateDifferentialSum,
  getAgeGenderReferenceRange,
  evaluatePanicFlag,
  calculateAll
} from '../../apps/web/src/lib/clinicalIntelligence';

import {
  evaluateDeltaCheck,
  evaluateMultiAnalyteDeltaChecks,
  compareSampleWithHistory,
  getDeltaThresholdConfig,
  DEFAULT_DELTA_THRESHOLDS
} from '../../apps/web/src/lib/deltaCheck';

describe('M2 Challenger: 2021 CKD-EPI eGFR Calculation & KDIGO Staging', () => {
  test('2021 CKD-EPI Male eGFR across KDIGO Stages (G1 to G5)', () => {
    // 50yo Male, Creatinine 0.9 mg/dL -> G1/G2
    const g1 = calculateEgfr(0.9, 50, 'MALE');
    expect(g1.value).toBeGreaterThanOrEqual(90);
    expect(g1.stage).toBe('G1');

    // 55yo Male, Creatinine 1.3 mg/dL -> G2
    const g2 = calculateEgfr(1.3, 55, 'MALE');
    expect(g2.value).toBeWithinRange(60, 89);
    expect(g2.stage).toBe('G2');

    // 60yo Male, Creatinine 1.5 mg/dL -> G3a (45-59)
    const g3a = calculateEgfr(1.5, 60, 'MALE');
    expect(g3a.value).toBeWithinRange(45, 59);
    expect(g3a.stage).toBe('G3a');

    // 65yo Male, Creatinine 2.0 mg/dL -> G3b (30-44)
    const g3b = calculateEgfr(2.0, 65, 'MALE');
    expect(g3b.value).toBeWithinRange(30, 44);
    expect(g3b.stage).toBe('G3b');

    // 70yo Male, Creatinine 3.5 mg/dL -> G4
    const g4 = calculateEgfr(3.5, 70, 'MALE');
    expect(g4.value).toBeWithinRange(15, 29);
    expect(g4.stage).toBe('G4');

    // 75yo Male, Creatinine 6.5 mg/dL -> G5 (Kidney Failure)
    const g5 = calculateEgfr(6.5, 75, 'MALE');
    expect(g5.value).toBeLessThan(15);
    expect(g5.stage).toBe('G5');
    expect(g5.note).toContain('Kidney failure');
  });

  test('2021 CKD-EPI Female eGFR with gender coefficient (1.012, kappa 0.7, alpha -0.241)', () => {
    // 30yo Female, Creatinine 0.7 mg/dL
    const femaleG1 = calculateEgfr(0.7, 30, 'FEMALE');
    expect(femaleG1.value).toBeGreaterThanOrEqual(90);
    expect(femaleG1.stage).toBe('G1');

    // 65yo Female, Creatinine 2.5 mg/dL -> G4
    const femaleG4 = calculateEgfr(2.5, 65, 'FEMALE');
    expect(femaleG4.value).toBeWithinRange(15, 25);
    expect(femaleG4.stage).toBe('G4');
  });

  test('CKD-EPI Boundary & Extreme Inputs (Geriatric 105yo, Creatinine 0.1, 15.0)', () => {
    const extremeAge = calculateEgfr(1.1, 105, 'FEMALE');
    expect(extremeAge.value).toBeGreaterThan(0);
    expect(extremeAge.value).toBeLessThan(60);

    const extremeLowScr = calculateEgfr(0.1, 20, 'MALE');
    expect(extremeLowScr.value).toBeGreaterThan(120);
    expect(extremeLowScr.stage).toBe('G1');

    const extremeHighScr = calculateEgfr(15.0, 50, 'MALE');
    expect(extremeHighScr.value).toBeLessThan(5);
    expect(extremeHighScr.stage).toBe('G5');

    const invalid = calculateEgfr(0, 50, 'MALE');
    expect(invalid.stage).toBe('N/A');
  });
});

describe('M2 Challenger: Friedewald Equation & Lipid Fractions', () => {
  test('Valid Friedewald LDL-C calculation when TG < 400 mg/dL', () => {
    // TC = 220, HDL = 45, TG = 150 -> LDL = 220 - 45 - 30 = 145
    const res = calculateLdl(220, 45, 150);
    expect(res.value).toBe(145);
    expect(res.invalidReason).toBeUndefined();

    // Exact boundary: TG = 399 mg/dL
    const b399 = calculateLdl(200, 50, 399);
    expect(b399.value).toBe(70.2);
    expect(b399.invalidReason).toBeUndefined();

    // Negative values
    const neg = calculateLdl(-10, 50, 150);
    expect(neg.value).toBeNull();
    expect(neg.invalidReason).toContain('Invalid lipid panel values');
  });

  test('Automatic Invalidation when TG >= 400 mg/dL (Chylomicronemia safety rule)', () => {
    // Exact threshold TG = 400 mg/dL
    const b400 = calculateLdl(200, 50, 400);
    expect(b400.value).toBeNull();
    expect(b400.invalidReason).toContain('Triglycerides >= 400 mg/dL');

    // Severe Hypertriglyceridemia TG = 1,250 mg/dL
    const severe = calculateLdl(300, 35, 1250);
    expect(severe.value).toBeNull();
    expect(severe.invalidReason).toContain('direct LDL measurement required');
  });

  test('VLDL, Non-HDL Cholesterol, and Cardiac Risk Ratio', () => {
    const vldl = calculateVldl(150);
    expect(vldl.value).toBe(30);

    const vldlInvalid = calculateVldl(450);
    expect(vldlInvalid.value).toBeNull();

    const nonHdl = calculateNonHdl(220, 45);
    expect(nonHdl.value).toBe(175);

    const risk = calculateCardiacRisk(220, 45);
    expect(risk.value).toBeCloseTo(4.89, 2);

    const zeroHdl = calculateCardiacRisk(200, 0);
    expect(zeroHdl.value).toBe(0);
  });
});

describe('M2 Challenger: Bilirubin Fractions, Serum Anion Gap & Corrected Calcium', () => {
  test('Indirect Bilirubin calculation and Direct > Total error checking', () => {
    // Valid: TB = 2.4, DB = 0.8 -> 1.6
    const valid = calculateIndirectBilirubin(2.4, 0.8);
    expect(valid.value).toBe(1.6);
    expect(valid.invalidReason).toBeUndefined();

    // 100% Direct: TB = 5.0, DB = 5.0 -> 0.0
    const equal = calculateIndirectBilirubin(5.0, 5.0);
    expect(equal.value).toBe(0.0);

    // Impossible Error: DB > TB -> null with error reason
    const impossible = calculateIndirectBilirubin(1.5, 3.0);
    expect(impossible.value).toBeNull();
    expect(impossible.invalidReason).toContain('Direct Bilirubin cannot exceed Total Bilirubin');
  });

  test('Serum Anion Gap & HAGMA Classification', () => {
    // Normal: Na = 140, Cl = 104, HCO3 = 24 -> AG = 12
    const normal = calculateAnionGap(140, 104, 24);
    expect(normal.value).toBe(12);
    expect(normal.interpretation).toContain('Normal');

    // High Anion Gap (HAGMA): Na = 136, Cl = 98, HCO3 = 10 -> AG = 28
    const high = calculateAnionGap(136, 98, 10);
    expect(high.value).toBe(28);
    expect(high.interpretation).toContain('High Anion Gap Metabolic Acidosis');

    // Low Anion Gap: Na = 130, Cl = 105, HCO3 = 22 -> AG = 3
    const low = calculateAnionGap(130, 105, 22);
    expect(low.value).toBe(3);
    expect(low.interpretation).toContain('Low Anion Gap');
  });

  test('Corrected Calcium for Hypoalbuminemia & A/G Ratio', () => {
    // Ca = 7.8, Alb = 2.5 -> Corrected Ca = 7.8 + 0.8 * (4.0 - 2.5) = 9.0
    const corrCa = calculateCorrectedCalcium(7.8, 2.5);
    expect(corrCa.value).toBe(9.0);

    // Normal Albumin: Ca = 9.5, Alb = 4.0 -> Corrected Ca = 9.5
    const normalCa = calculateCorrectedCalcium(9.5, 4.0);
    expect(normalCa.value).toBe(9.5);

    // A/G Ratio: TP = 7.5, Alb = 4.5 -> Glob = 3.0 -> Ratio = 1.5
    const agRatio = calculateAgRatio(7.5, 4.5);
    expect(agRatio.value).toBe(1.5);

    // A/G Invalid when Alb >= TP
    const invalidAg = calculateAgRatio(4.0, 4.5);
    expect(invalidAg.value).toBeNull();
  });
});

describe('M2 Challenger: De Ritis, eAG, HOMA-IR, Mentzer Index & CBC Auto-Indices', () => {
  test('De Ritis Ratio (AST/ALT) clinical stratification', () => {
    const highRatio = calculateDeRitis(120, 40); // 3.0
    expect(highRatio.value).toBe(3.0);
    expect(highRatio.interpretation).toContain('Significantly Elevated');

    const moderateRatio = calculateDeRitis(55, 45); // 1.22
    expect(moderateRatio.value).toBe(1.22);
    expect(moderateRatio.interpretation).toContain('Elevated');

    const normalRatio = calculateDeRitis(25, 50); // 0.5
    expect(normalRatio.value).toBe(0.5);
    expect(normalRatio.interpretation).toContain('Normal');

    const zeroAlt = calculateDeRitis(40, 0);
    expect(zeroAlt.interpretation).toBe('Indeterminate');
  });

  test('Estimated Average Glucose (eAG) from HbA1c', () => {
    const eag8 = calculateEag(8.0);
    expect(eag8.value).toBe(183);

    const eag6 = calculateEag(6.0);
    expect(eag6.value).toBe(126);
  });

  test('HOMA-IR Insulin Resistance Index', () => {
    const homaSevere = calculateHomaIr(110, 15); // 4.07
    expect(homaSevere.value).toBeCloseTo(4.07, 2);
    expect(homaSevere.interpretation).toContain('Significant Insulin Resistance');

    const homaBorderline = calculateHomaIr(95, 10); // 2.35
    expect(homaBorderline.value).toBeCloseTo(2.35, 2);
    expect(homaBorderline.interpretation).toContain('Borderline');

    const homaNormal = calculateHomaIr(80, 5); // 0.99
    expect(homaNormal.value).toBeCloseTo(0.99, 2);
    expect(homaNormal.interpretation).toContain('Normal');
  });

  test('Mentzer Index for Microcytic Anemia Differential Screening', () => {
    // Thalassemia Trait (< 13): MCV = 65, RBC = 5.8 -> 11.2
    const thal = calculateMentzerIndex(65, 5.8);
    expect(thal.value).toBeCloseTo(11.2, 1);
    expect(thal.interpretation).toContain('Beta-Thalassemia Trait');

    // Iron Deficiency Anemia (>= 13): MCV = 68, RBC = 3.2 -> 21.3
    const ida = calculateMentzerIndex(68, 3.2);
    expect(ida.value).toBeCloseTo(21.3, 1);
    expect(ida.interpretation).toContain('Iron Deficiency Anemia');

    // Not applicable (MCV >= 80)
    const normalMcv = calculateMentzerIndex(85, 4.5);
    expect(normalMcv.interpretation).toContain('Not applicable');
  });

  test('CBC Red Cell Indices & 5-Part Differential Sum Validator', () => {
    const indices = calculateCbcIndices(4.5, 13.5, 40.5);
    expect(indices.mcv).toBeCloseTo(90.0, 1);
    expect(indices.mch).toBeCloseTo(30.0, 1);
    expect(indices.mchc).toBeCloseTo(33.3, 1);

    const validDiff = validateDifferentialSum(60.0, 30.0, 6.0, 3.0, 1.0);
    expect(validDiff.isValid).toBe(true);
    expect(validDiff.sum).toBe(100.0);

    const invalidDiff = validateDifferentialSum(50.0, 30.0, 5.0, 3.0, 1.0); // 89.0%
    expect(invalidDiff.isValid).toBe(false);
    expect(invalidDiff.error).toContain('Differential sum must equal 100%');
  });
});

describe('M2 Challenger: Dynamic Reference Ranges & 3-Tier Alert Badging', () => {
  test('Dynamic age- and gender-stratified reference intervals', () => {
    const childCreat = getAgeGenderReferenceRange('CREATININE', 6, 'MALE');
    expect(childCreat?.max).toBe(0.7);

    const femaleCreat = getAgeGenderReferenceRange('CREATININE', 35, 'FEMALE');
    expect(femaleCreat?.max).toBe(1.0);

    const maleCreat = getAgeGenderReferenceRange('CREATININE', 40, 'MALE');
    expect(maleCreat?.max).toBe(1.3);

    const femaleHgb = getAgeGenderReferenceRange('HGB', 30, 'FEMALE');
    expect(femaleHgb?.min).toBe(12.0);
    expect(femaleHgb?.max).toBe(15.5);

    const maleHgb = getAgeGenderReferenceRange('HGB', 30, 'MALE');
    expect(maleHgb?.min).toBe(13.5);
    expect(maleHgb?.max).toBe(17.5);
  });

  test('3-Tier Badging: NORMAL, ABNORMAL, CRITICAL PANIC', () => {
    // Normal K (4.2)
    const kNorm = evaluatePanicFlag('POTASSIUM', 4.2);
    expect(kNorm.badgeLevel).toBe('NORMAL');

    // Abnormal K (5.6)
    const kAbn = evaluatePanicFlag('POTASSIUM', 5.6);
    expect(kAbn.badgeLevel).toBe('ABNORMAL');

    // Critical Panic K (6.8)
    const kCrit = evaluatePanicFlag('POTASSIUM', 6.8);
    expect(kCrit.badgeLevel).toBe('CRITICAL_PANIC');
    expect(kCrit.panicReason).toContain('safe critical limits');

    // Critical Hypoglycemia (38)
    const fbsLow = evaluatePanicFlag('FBS', 38);
    expect(fbsLow.badgeLevel).toBe('CRITICAL_PANIC');

    // Critical Hyperglycemia (500)
    const fbsHigh = evaluatePanicFlag('FBS', 500);
    expect(fbsHigh.badgeLevel).toBe('CRITICAL_PANIC');
  });

  test('Comprehensive calculateAll() batch calculator', () => {
    const inputs = {
      age: 52,
      gender: 'MALE' as const,
      creatinine: 1.2,
      totalCholesterol: 230,
      hdl: 42,
      triglycerides: 160,
      totalBilirubin: 1.8,
      directBilirubin: 0.5,
      sodium: 142,
      chloride: 102,
      bicarbonate: 25,
      calcium: 8.2,
      albumin: 3.0,
      totalProtein: 7.0,
      ast: 48,
      alt: 24,
      hba1c: 7.5,
      fbs: 140,
      fastingInsulin: 18,
      rbc: 4.8,
      mcv: 88,
      hgb: 14.2,
      hct: 42.6,
      neutrophils: 62.0,
      lymphocytes: 28.0,
      monocytes: 6.0,
      eosinophils: 3.0,
      basophils: 1.0
    };

    const results = calculateAll(inputs);

    expect(results.egfr?.stage).toBeTruthy();
    expect(results.ldl?.value).toBe(156);
    expect(results.vldl?.value).toBe(32);
    expect(results.nonHdl?.value).toBe(188);
    expect(results.indirectBilirubin?.value).toBe(1.3);
    expect(results.anionGap?.value).toBe(15);
    expect(results.correctedCalcium?.value).toBe(9.0);
    expect(results.agRatio?.value).toBe(0.75);
    expect(results.deRitisRatio?.value).toBe(2.0);
    expect(results.eag?.value).toBe(169);
    expect(results.homaIr?.value).toBeCloseTo(6.22, 2);
    expect(results.differentialValidation?.isValid).toBe(true);
  });
});

describe('M2 Challenger: Historical Delta Check Engine', () => {
  test('Hemoglobin acute drop (Hb >= 20% threshold)', () => {
    const res = evaluateDeltaCheck('HGB', 10.5, 14.0, '2026-08-01', 's-prior-1');
    expect(res.hasPrevious).toBe(true);
    expect(res.previousValue).toBe(14.0);
    expect(res.currentValue).toBe(10.5);
    expect(res.deltaPercent).toBe(25.0);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('SIGNIFICANT');
    expect(res.direction).toBe('decreased');
    expect(res.message).toContain('decreased by 25%');
  });

  test('Platelets acute drop (PLT >= 50% threshold)', () => {
    const res = evaluateDeltaCheck('PLT', 110, 280);
    expect(res.deltaPercent).toBeCloseTo(60.7, 1);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('SIGNIFICANT');
  });

  test('Creatinine acute spike (Creat >= 50% threshold, >= 100% CRITICAL)', () => {
    const res = evaluateDeltaCheck('CREATININE', 2.4, 1.0);
    expect(res.deltaPercent).toBe(140.0);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('CRITICAL');
    expect(res.direction).toBe('increased');
    expect(res.message).toContain('increased by 140%');
  });

  test('Potassium acute rise (K >= 25% threshold)', () => {
    const res = evaluateDeltaCheck('K', 5.2, 4.0);
    expect(res.deltaPercent).toBe(30.0);
    expect(res.isBreached).toBe(true);
    expect(res.badgeLevel).toBe('SIGNIFICANT');
  });

  test('Normal physiological variation produces NORMAL badge', () => {
    const res = evaluateDeltaCheck('HGB', 13.5, 14.0);
    expect(res.deltaPercent).toBeCloseTo(3.6, 1);
    expect(res.isBreached).toBe(false);
    expect(res.badgeLevel).toBe('NORMAL');
    expect(res.message).toContain('within safe limit');
  });

  test('Batch evaluateMultiAnalyteDeltaChecks()', () => {
    const prior = { HGB: 14.0, PLT: 260, CREATININE: 1.0, FBS: 95 };
    const current = { HGB: 10.0, PLT: 250, CREATININE: 2.2, FBS: 100 };

    const batch = evaluateMultiAnalyteDeltaChecks(current, prior, '2026-08-10', 's-1001');

    expect(batch.HGB.isBreached).toBe(true);
    expect(batch.HGB.badgeLevel).toBe('SIGNIFICANT');
    expect(batch.PLT.isBreached).toBe(false);
    expect(batch.PLT.badgeLevel).toBe('NORMAL');
    expect(batch.CREATININE.isBreached).toBe(true);
    expect(batch.CREATININE.badgeLevel).toBe('CRITICAL');
    expect(batch.FBS.isBreached).toBe(false);
  });

  test('compareSampleWithHistory() traverses patient samples newest to oldest', () => {
    const currentSample = {
      id: 's-curr-1',
      tests: [
        { code: 'HGB', resultValue: '10.2' },
        { code: 'CREATININE', resultValue: '2.1' },
        { code: 'WBC', resultValue: '7.5' }
      ]
    };

    const history = [
      {
        id: 's-hist-old',
        createdAt: '2026-07-01T10:00:00Z',
        tests: [
          { code: 'HGB', resultValue: '15.0' },
          { code: 'CREATININE', resultValue: '0.8' }
        ]
      },
      {
        id: 's-hist-recent',
        createdAt: '2026-08-15T10:00:00Z',
        tests: [
          { code: 'HGB', resultValue: '13.8' },
          { code: 'CREATININE', resultValue: '1.0' }
        ]
      }
    ];

    const deltas = compareSampleWithHistory(currentSample, history);

    // Should match s-hist-recent (13.8, not 15.0)
    expect(deltas.HGB.hasPrevious).toBe(true);
    expect(deltas.HGB.previousValue).toBe(13.8);
    expect(deltas.HGB.deltaPercent).toBeCloseTo(26.1, 1);
    expect(deltas.HGB.isBreached).toBe(true);

    // Creatinine should match 1.0 -> 2.1 (110% spike)
    expect(deltas.CREATININE.previousValue).toBe(1.0);
    expect(deltas.CREATININE.deltaPercent).toBe(110.0);
    expect(deltas.CREATININE.badgeLevel).toBe('CRITICAL');

    // WBC was not in history
    expect(deltas.WBC).toBeUndefined();
  });

  test('Robust edge handling: zero previous value, empty strings, null inputs', () => {
    const zeroPrev = evaluateDeltaCheck('HGB', 12.0, 0);
    expect(zeroPrev.isBreached).toBe(true);
    expect(zeroPrev.badgeLevel).toBe('WARNING');
    expect(zeroPrev.message).toContain('New appearance from zero baseline - clinical review recommended');

    const emptyPrev = evaluateDeltaCheck('HGB', 12.0, '');
    expect(emptyPrev.hasPrevious).toBe(false);

    const nullCurr = evaluateDeltaCheck('HGB', '', 14.0);
    expect(nullCurr.isBreached).toBe(false);
  });
});
