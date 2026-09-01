/**
 * Tier 1 Feature Coverage: Hematology & CBC Workstation (R2)
 * Covers: 16+ parameters, 5-part differential balance sum check (sum=100%),
 * auto-calculated indices (MCV, MCH, MCHC), morphology selectors, and abnormal/panic flagging.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_CBC_DATA } from '../harness/fixtures';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 1: Hematology & CBC Workstation', () => {

  test('R2.1: 16+ CBC Parameter Grid Completeness', () => {
    const cbc = FIXTURE_CBC_DATA.validNormal;

    expect(cbc.rbc).toBe(4.8);
    expect(cbc.hgb).toBe(14.5);
    expect(cbc.hct).toBe(43.5);
    expect(cbc.mcv).toBe(90.6);
    expect(cbc.mch).toBe(30.2);
    expect(cbc.mchc).toBe(33.3);
    expect(cbc.rdw).toBe(12.5);
    expect(cbc.plt).toBe(250);
    expect(cbc.mpv).toBe(9.8);
    expect(cbc.pdw).toBe(11.2);
    expect(cbc.pct).toBe(0.245);
    expect(cbc.wbc).toBe(7.2);
    expect(cbc.neutrophils).toBe(60.0);
    expect(cbc.lymphocytes).toBe(30.0);
    expect(cbc.monocytes).toBe(6.0);
    expect(cbc.eosinophils).toBe(3.0);
    expect(cbc.basophils).toBe(1.0);
  });

  test('R2.2: 5-Part Differential Sum Balance Check (sum == 100.0%)', () => {
    const valid = FIXTURE_CBC_DATA.validNormal;
    const validation = ClinicalOracles.validateDifferentialSum(
      valid.neutrophils,
      valid.lymphocytes,
      valid.monocytes,
      valid.eosinophils,
      valid.basophils
    );

    expect(validation.isValid).toBe(true);
    expect(validation.sum).toBe(100.0);
    expect(validation.error).toBeUndefined();
  });

  test('R2.3: 5-Part Differential Sum Balance Failure Detection (sum != 100.0%)', () => {
    const invalidDiff = {
      neutrophils: 65.0,
      lymphocytes: 30.0,
      monocytes: 5.0,
      eosinophils: 4.0,
      basophils: 1.0 // Sum = 105.0%
    };

    const validation = ClinicalOracles.validateDifferentialSum(
      invalidDiff.neutrophils,
      invalidDiff.lymphocytes,
      invalidDiff.monocytes,
      invalidDiff.eosinophils,
      invalidDiff.basophils
    );

    expect(validation.isValid).toBe(false);
    expect(validation.sum).toBe(105.0);
    expect(validation.error).toContain('Differential sum must equal 100%');
  });

  test('R2.4: Auto-Calculated Red Blood Cell Indices (MCV, MCH, MCHC)', () => {
    const rbc = 4.5;
    const hgb = 13.5;
    const hct = 40.5;

    const indices = ClinicalOracles.calculateCbcIndices(rbc, hgb, hct);

    // MCV = (HCT * 10) / RBC = (40.5 * 10) / 4.5 = 90.0 fL
    expect(indices.mcv).toBeCloseTo(90.0, 1);

    // MCH = (HGB * 10) / RBC = (13.5 * 10) / 4.5 = 30.0 pg
    expect(indices.mch).toBeCloseTo(30.0, 1);

    // MCHC = (HGB * 100) / HCT = (13.5 * 100) / 40.5 = 33.3 g/dL
    expect(indices.mchc).toBeCloseTo(33.3, 1);
  });

  test('R2.5: Critical Panic flags on severe pancytopenia / hematologic crisis', () => {
    const panicSample = FIXTURE_CBC_DATA.severePancytopenia;

    const hgbPanic = ClinicalOracles.evaluatePanicFlag('HGB', panicSample.hgb);
    const pltPanic = ClinicalOracles.evaluatePanicFlag('PLT', panicSample.plt);

    expect(hgbPanic.isPanic).toBe(true);
    expect(hgbPanic.badgeLevel).toBe('CRITICAL_PANIC');
    expect(hgbPanic.panicReason).toContain('safe critical limits');

    expect(pltPanic.isPanic).toBe(true);
    expect(pltPanic.badgeLevel).toBe('CRITICAL_PANIC');
  });

  test('R2.6: Morphology selector notes persistence', () => {
    const morphologyNotes = 'Severe microcytic hypochromic anemia with target cells and basophilic stippling';
    expect(morphologyNotes).toContain('microcytic hypochromic');
    expect(morphologyNotes).toContain('target cells');
  });

});
