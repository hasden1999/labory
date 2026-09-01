/**
 * Tier 1 Feature Coverage: Historical Delta Check Engine (R3)
 * Covers: Cross-visit comparator, analyte threshold alerts (Hb >=20%, Plt >=50%, Creat >=50%, K >=25%),
 * acute change direction, and visual alert badges (NORMAL, SIGNIFICANT, CRITICAL).
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 1: Historical Delta Check Engine', () => {

  test('R3.1: Hemoglobin (Hb) >= 20% Delta Breach Alert (Acute internal hemorrhage)', () => {
    // Prior visit: Hb = 14.0 g/dL -> Current visit: Hb = 10.5 g/dL (25.0% drop)
    const deltaRes = ClinicalOracles.evaluateDeltaCheck('HGB', 10.5, 14.0, '2026-08-01');

    expect(deltaRes.hasPrevious).toBe(true);
    expect(deltaRes.previousValue).toBe(14.0);
    expect(deltaRes.currentValue).toBe(10.5);
    expect(deltaRes.deltaPercent).toBe(25.0);
    expect(deltaRes.isBreached).toBe(true);
    expect(deltaRes.thresholdPercent).toBe(20);
    expect(deltaRes.badgeLevel).toBe('SIGNIFICANT');
    expect(deltaRes.message).toContain('decreased by 25%');
  });

  test('R3.2: Platelet Count (Plt) >= 50% Delta Breach Alert (Acute Thrombocytopenia)', () => {
    // Prior visit: Plt = 280 -> Current: Plt = 110 (60.7% drop)
    const deltaPlt = ClinicalOracles.evaluateDeltaCheck('PLT', 110, 280);

    expect(deltaPlt.deltaPercent).toBeCloseTo(60.7, 1);
    expect(deltaPlt.isBreached).toBe(true);
    expect(deltaPlt.badgeLevel).toBe('SIGNIFICANT');
    expect(deltaPlt.message).toContain('PLT decreased');
  });

  test('R3.3: Serum Creatinine >= 50% Delta Breach Alert (Acute Kidney Injury)', () => {
    // Prior: Creat = 1.0 mg/dL -> Current: Creat = 2.4 mg/dL (140% spike)
    const deltaCreat = ClinicalOracles.evaluateDeltaCheck('CREATININE', 2.4, 1.0);

    expect(deltaCreat.deltaPercent).toBe(140.0);
    expect(deltaCreat.isBreached).toBe(true);
    expect(deltaCreat.badgeLevel).toBe('CRITICAL');
    expect(deltaCreat.message).toContain('CREATININE increased by 140%');
  });

  test('R3.4: Serum Potassium (K+) >= 25% Delta Breach Alert (Arrhythmia risk)', () => {
    // Prior: K = 4.0 mmol/L -> Current: K = 5.2 mmol/L (30.0% increase)
    const deltaK = ClinicalOracles.evaluateDeltaCheck('K', 5.2, 4.0);

    expect(deltaK.deltaPercent).toBe(30.0);
    expect(deltaK.isBreached).toBe(true);
    expect(deltaK.thresholdPercent).toBe(25);
    expect(deltaK.badgeLevel).toBe('SIGNIFICANT');
  });

  test('R3.5: Within-threshold normal physiological change produces NORMAL badge', () => {
    // Prior: Hb = 14.0 -> Current: Hb = 13.5 (3.6% minor variation)
    const deltaNormal = ClinicalOracles.evaluateDeltaCheck('HGB', 13.5, 14.0);

    expect(deltaNormal.deltaPercent).toBeCloseTo(3.6, 1);
    expect(deltaNormal.isBreached).toBe(false);
    expect(deltaNormal.badgeLevel).toBe('NORMAL');
    expect(deltaNormal.message).toContain('within safe limit');
  });

  test('R3.6: Multi-analyte batch delta evaluation across visit history', () => {
    const priorVisitResults: Record<string, number> = {
      HGB: 14.2,
      WBC: 6.8,
      PLT: 260,
      CREATININE: 0.9,
      FBS: 95
    };

    const currentVisitResults: Record<string, number> = {
      HGB: 14.0,
      WBC: 14.5, // 113% spike -> Breached
      PLT: 250,
      CREATININE: 1.0,
      FBS: 180  // 89% spike -> Breached
    };

    const deltaReports: Record<string, ReturnType<typeof ClinicalOracles.evaluateDeltaCheck>> = {};
    for (const [analyte, currVal] of Object.entries(currentVisitResults)) {
      if (priorVisitResults[analyte] !== undefined) {
        deltaReports[analyte] = ClinicalOracles.evaluateDeltaCheck(analyte, currVal, priorVisitResults[analyte]);
      }
    }

    expect(deltaReports.HGB.isBreached).toBe(false);
    expect(deltaReports.WBC.isBreached).toBe(true);
    expect(deltaReports.WBC.badgeLevel).toBe('CRITICAL');
    expect(deltaReports.PLT.isBreached).toBe(false);
    expect(deltaReports.CREATININE.isBreached).toBe(false);
    expect(deltaReports.FBS.isBreached).toBe(true);
  });

});
