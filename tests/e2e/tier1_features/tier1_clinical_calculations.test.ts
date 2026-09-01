/**
 * Tier 1 Feature Coverage: Clinical Calculations Engine (R3)
 * Covers: 2021 CKD-EPI eGFR, Friedewald LDL, Indirect Bilirubin, Anion Gap,
 * Corrected Calcium, A/G Ratio, De Ritis, eAG, HOMA-IR, and Mentzer Index.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 1: Clinical Calculations Engine', () => {

  test('R3.1: 2021 CKD-EPI eGFR Calculation (Male and Female across Stages)', () => {
    // 50yo Male, Creatinine 1.0 mg/dL -> Normal (G1/G2)
    const maleRes = ClinicalOracles.calculateEgfr(1.0, 50, 'MALE');
    expect(maleRes.value).toBeWithinRange(85, 95);
    expect(['G1', 'G2']).toContain(maleRes.stage);

    // 65yo Female, Creatinine 2.5 mg/dL -> Severe CKD (G4)
    const femaleSevere = ClinicalOracles.calculateEgfr(2.5, 65, 'FEMALE');
    expect(femaleSevere.value).toBeWithinRange(15, 25);
    expect(femaleSevere.stage).toBe('G4');

    // 70yo Male, Creatinine 6.0 mg/dL -> Kidney Failure (G5)
    const maleFailure = ClinicalOracles.calculateEgfr(6.0, 70, 'MALE');
    expect(maleFailure.value).toBeLessThan(15);
    expect(maleFailure.stage).toBe('G5');
  });

  test('R3.2: Friedewald Equation for LDL-C & Non-HDL & Cardiac Risk', () => {
    // TC = 220, HDL = 45, TG = 150
    // LDL = 220 - 45 - (150 / 5) = 220 - 45 - 30 = 145 mg/dL
    const ldlRes = ClinicalOracles.calculateLdl(220, 45, 150);
    expect(ldlRes.value).toBe(145);
    expect(ldlRes.invalidReason).toBeUndefined();

    // VLDL = 150 / 5 = 30
    const vldlRes = ClinicalOracles.calculateVldl(150);
    expect(vldlRes.value).toBe(30);

    // Non-HDL = 220 - 45 = 175
    const nonHdlRes = ClinicalOracles.calculateNonHdl(220, 45);
    expect(nonHdlRes.value).toBe(175);

    // Cardiac Risk = 220 / 45 = 4.89
    const riskRes = ClinicalOracles.calculateCardiacRisk(220, 45);
    expect(riskRes.value).toBeCloseTo(4.89, 2);
  });

  test('R3.3: Bilirubin Fractions (Indirect Bilirubin = Total - Direct)', () => {
    // TB = 2.4 mg/dL, DB = 0.8 mg/dL -> Indir = 1.6 mg/dL
    const indir = ClinicalOracles.calculateIndirectBilirubin(2.4, 0.8);
    expect(indir.value).toBe(1.6);
    expect(indir.invalidReason).toBeUndefined();
  });

  test('R3.4: Serum Anion Gap = Na - (Cl + HCO3) & HAGMA Classification', () => {
    // Normal Anion Gap: Na = 140, Cl = 104, HCO3 = 24 -> AG = 140 - 128 = 12 mmol/L
    const normalAg = ClinicalOracles.calculateAnionGap(140, 104, 24);
    expect(normalAg.value).toBe(12);
    expect(normalAg.interpretation).toContain('Normal');

    // High Anion Gap (Diabetic Ketoacidosis / Lactic Acidosis): Na = 136, Cl = 98, HCO3 = 10 -> AG = 136 - 108 = 28 mmol/L
    const highAg = ClinicalOracles.calculateAnionGap(136, 98, 10);
    expect(highAg.value).toBe(28);
    expect(highAg.interpretation).toContain('High Anion Gap Metabolic Acidosis');
  });

  test('R3.5: Corrected Calcium for Albumin & A/G Ratio Calculation', () => {
    // Serum Ca = 7.8 mg/dL (low), Albumin = 2.5 g/dL (hypoalbuminemia)
    // Corrected Ca = 7.8 + 0.8 * (4.0 - 2.5) = 7.8 + 1.2 = 9.0 mg/dL (Normal in reality!)
    const correctedCa = ClinicalOracles.calculateCorrectedCalcium(7.8, 2.5);
    expect(correctedCa.value).toBe(9.0);

    // Total Protein = 7.5 g/dL, Albumin = 4.5 g/dL -> Globulin = 3.0 -> A/G Ratio = 4.5 / 3.0 = 1.5
    const agRatio = ClinicalOracles.calculateAgRatio(7.5, 4.5);
    expect(agRatio.value).toBe(1.5);
  });

  test('R3.6: De Ritis Ratio, eAG (from HbA1c), HOMA-IR, and Mentzer Index', () => {
    // De Ritis: AST = 120, ALT = 40 -> 3.0 (Suggests alcoholic hepatitis / toxic damage)
    const deRitis = ClinicalOracles.calculateDeRitis(120, 40);
    expect(deRitis.value).toBe(3.0);
    expect(deRitis.interpretation).toContain('Significantly Elevated');

    // eAG: HbA1c = 8.0% -> 28.7 * 8.0 - 46.7 = 182.9 -> 183 mg/dL
    const eag = ClinicalOracles.calculateEag(8.0);
    expect(eag.value).toBe(183);

    // HOMA-IR: FBS = 110, Insulin = 15 -> (110 * 15) / 405 = 4.07 (Insulin Resistance)
    const homa = ClinicalOracles.calculateHomaIr(110, 15);
    expect(homa.value).toBeCloseTo(4.07, 2);
    expect(homa.interpretation).toContain('Significant Insulin Resistance');

    // Mentzer Index: MCV = 65 fL, RBC = 5.8 10^6/uL -> 65 / 5.8 = 11.2 (< 13 -> Beta-Thal Trait)
    const mentzerThal = ClinicalOracles.calculateMentzerIndex(65, 5.8);
    expect(mentzerThal.value).toBeCloseTo(11.2, 1);
    expect(mentzerThal.interpretation).toContain('Beta-Thalassemia Trait');

    // Mentzer Index: MCV = 68 fL, RBC = 3.2 10^6/uL -> 68 / 3.2 = 21.25 (>= 13 -> Iron Deficiency Anemia)
    const mentzerIda = ClinicalOracles.calculateMentzerIndex(68, 3.2);
    expect(mentzerIda.value).toBeCloseTo(21.3, 1);
    expect(mentzerIda.interpretation).toContain('Iron Deficiency Anemia');
  });

});
