/**
 * Adversarial Clinical Formulas & Edge-Case Stress Test Harness
 * 
 * Challenger 1: Labryo LIMS All-in-One Console
 * Verification Target:
 * 1. Friedewald lipid calculations at TG=399 mg/dL vs TG=400 mg/dL ("Not calculated (TG >= 400)")
 * 2. Manual direct LDL override priority over calculated values
 * 3. 2021 CKD-EPI eGFR equation pediatric invalidation for age < 18
 * 4. Tube badge derivation under complex combinations of tests (Production lib)
 * 5. Dynamic edge cases, fuzzing, and adversarial parameter combinations
 */

import assert from 'node:assert';
import {
  calculateLipidPanel,
  calculateLdlUnitAware,
  calculateVldlUnitAware,
  calculateNonHdlUnitAware,
  calculateTcHdlRatio,
  calculateLdlHdlRatio,
  calculateEgfr,
  calculateIndirectBilirubin,
  LIPID_NOT_CALCULATED_MSG,
  LIPID_TG_CUTOFF_MGDL,
  LIPID_TG_CUTOFF_MMOLL,
  LIPID_CATALOG_IDS,
} from '../../packages/domain/src/clinicalIntelligence';

import { deriveTubeBadges } from '../../apps/web/src/widgets/unified-workspace/lib/tubeBadges';
import { UnifiedCartItem } from '../../apps/web/src/widgets/unified-workspace/model/types';

let totalAssertions = 0;
let passedSuites = 0;

function check(desc: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('======================================================================');
console.log('   CHALLENGER 1: ADVERSARIAL CLINICAL FORMULAS STRESS TEST HARNESS    ');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: FRIEDEWALD LIPID PANEL & TG BOUNDARY (399 vs 400 mg/dL)
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: Friedewald TG=399 vs TG=400 Boundaries & Extreme Ranges ---');

check('TG=399 mg/dL calculates LDL, VLDL, Non-HDL, and Ratios accurately', () => {
  // TC=210, HDL=45, TG=399 mg/dL
  // LDL = 210 - 45 - (399/5) = 210 - 45 - 79.8 = 85.2 -> 85 mg/dL
  // VLDL = 399 / 5 = 79.8 -> 80 mg/dL
  // Non-HDL = 210 - 45 = 165 mg/dL
  // TC/HDL = 210 / 45 = 4.666 -> 4.7
  // LDL/HDL = 85 / 45 = 1.888 -> 1.9
  const res = calculateLipidPanel(210, 45, 399, 'mg/dL');
  assert.strictEqual(res.ldl.value, 85, 'LDL at TG=399 must calculate and round to 85');
  assert.strictEqual(res.ldl.isCalculated, true, 'isCalculated must be true');
  assert.strictEqual(res.ldl.invalidReason, undefined, 'No invalid reason when TG=399');
  assert.strictEqual(res.vldl.value, 80, 'VLDL at TG=399 must round to 80');
  assert.strictEqual(res.nonHdl.value, 165, 'Non-HDL must be 165');
  assert.strictEqual(res.tcHdlRatio.value, 4.7, 'TC/HDL must be 4.7');
  assert.strictEqual(res.ldlHdlRatio.value, 1.9, 'LDL/HDL must be 1.9');
  totalAssertions += 7;
});

check('TG=400 mg/dL strictly suppresses LDL & VLDL with standard invalidation message', () => {
  // TC=210, HDL=45, TG=400 mg/dL
  const res = calculateLipidPanel(210, 45, 400, 'mg/dL');
  assert.strictEqual(res.ldl.value, null, 'LDL at TG=400 must be null');
  assert.strictEqual(res.vldl.value, null, 'VLDL at TG=400 must be null');
  assert.ok(res.ldl.invalidReason?.includes('Not calculated (TG ≥ 400)'), 'LDL reason must include "Not calculated (TG ≥ 400)"');
  assert.ok(res.vldl.invalidReason?.includes('Not calculated (TG ≥ 400)'), 'VLDL reason must include "Not calculated (TG ≥ 400)"');
  // Non-HDL and TC/HDL MUST remain valid!
  assert.strictEqual(res.nonHdl.value, 165, 'Non-HDL remains valid at TG=400');
  assert.strictEqual(res.tcHdlRatio.value, 4.7, 'TC/HDL remains valid at TG=400');
  // LDL/HDL ratio MUST be null since LDL is unmeasured
  assert.strictEqual(res.ldlHdlRatio.value, null, 'LDL/HDL must be null without LDL measurement');
  totalAssertions += 7;
});

check('Sub-integer boundary fuzzing: TG=399.9 vs TG=400.0 vs TG=400.1', () => {
  // TG = 399.9 mg/dL (< 400) -> valid
  const r399_9 = calculateLipidPanel(200, 50, 399.9, 'mg/dL');
  assert.ok(r399_9.ldl.value !== null, 'TG=399.9 must compute LDL');
  assert.ok(r399_9.vldl.value !== null, 'TG=399.9 must compute VLDL');

  // TG = 400.0 mg/dL (>= 400) -> invalid
  const r400_0 = calculateLipidPanel(200, 50, 400.0, 'mg/dL');
  assert.strictEqual(r400_0.ldl.value, null, 'TG=400.0 must suppress LDL');
  assert.strictEqual(r400_0.vldl.value, null, 'TG=400.0 must suppress VLDL');

  // TG = 400.1 mg/dL (>= 400) -> invalid
  const r400_1 = calculateLipidPanel(200, 50, 400.1, 'mg/dL');
  assert.strictEqual(r400_1.ldl.value, null, 'TG=400.1 must suppress LDL');
  assert.strictEqual(r400_1.vldl.value, null, 'TG=400.1 must suppress VLDL');
  totalAssertions += 6;
});

check('mmol/L boundary fuzzing: TG=4.49 vs TG=4.50 vs TG=4.51 mmol/L', () => {
  // Threshold in mmol/L is 4.5 mmol/L
  // TG = 4.49 mmol/L -> valid
  const r4_49 = calculateLipidPanel(5.2, 1.2, 4.49, 'mmol/L');
  assert.ok(r4_49.ldl.value !== null, 'TG=4.49 mmol/L must calculate LDL');
  assert.ok(r4_49.vldl.value !== null, 'TG=4.49 mmol/L must calculate VLDL');

  // TG = 4.50 mmol/L -> suppressed
  const r4_50 = calculateLipidPanel(5.2, 1.2, 4.50, 'mmol/L');
  assert.strictEqual(r4_50.ldl.value, null, 'TG=4.50 mmol/L must suppress LDL');
  assert.strictEqual(r4_50.vldl.value, null, 'TG=4.50 mmol/L must suppress VLDL');
  assert.ok(r4_50.ldl.invalidReason?.includes('4.5 mmol/L'), 'Invalid reason mentions 4.5 mmol/L');

  // TG = 4.51 mmol/L -> suppressed
  const r4_51 = calculateLipidPanel(5.2, 1.2, 4.51, 'mmol/L');
  assert.strictEqual(r4_51.ldl.value, null, 'TG=4.51 mmol/L must suppress LDL');
  assert.strictEqual(r4_51.vldl.value, null, 'TG=4.51 mmol/L must suppress VLDL');
  totalAssertions += 7;
});

check('Severe hypertriglyceridemia (TG = 800, 1500, 3000 mg/dL)', () => {
  for (const tg of [800, 1500, 3000]) {
    const res = calculateLipidPanel(350, 30, tg, 'mg/dL');
    assert.strictEqual(res.ldl.value, null, `TG=${tg} suppresses LDL`);
    assert.strictEqual(res.vldl.value, null, `TG=${tg} suppresses VLDL`);
    assert.strictEqual(res.nonHdl.value, 320, `Non-HDL remains 350-30 = 320 at TG=${tg}`);
    assert.strictEqual(res.tcHdlRatio.value, 11.7, `TC/HDL ratio remains 350/30 = 11.7 at TG=${tg}`);
  }
  totalAssertions += 12;
});

check('CLSI C56-A Plausibility Cut-off: Calculated LDL < 10 mg/dL suppression', () => {
  // Case where calculated LDL drops below 10 mg/dL:
  // TC = 120, HDL = 60, TG = 270 mg/dL -> LDL = 120 - 60 - 54 = 6 mg/dL (< 10)
  const lowLdl = calculateLipidPanel(120, 60, 270, 'mg/dL');
  assert.strictEqual(lowLdl.ldl.value, null, 'Calculated LDL < 10 mg/dL must be suppressed');
  assert.ok(lowLdl.ldl.invalidReason?.includes('Calculated LDL < 10 mg/dL'), 'Mentions < 10 mg/dL plausibility cut-off');
  // VLDL should still be calculated
  assert.strictEqual(lowLdl.vldl.value, 54, 'VLDL 270/5 = 54');
  totalAssertions += 3;
});

passedSuites++;

// ----------------------------------------------------------------------------
// SUITE 2: MANUAL DIRECT LDL OVERRIDE PRIORITY OVER CALCULATED VALUES
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Manual Direct LDL Override Priority & Invalidation Bypassing ---');

check('Direct LDL override takes priority when TG >= 400 mg/dL', () => {
  // Patient with TG = 550 mg/dL. Direct LDL entered = 142 mg/dL. HDL = 38 mg/dL.
  const res = calculateLipidPanel(260, 38, 550, 'mg/dL', 142);
  assert.strictEqual(res.ldl.value, 142, 'LDL value must equal direct override 142');
  assert.strictEqual(res.ldl.isCalculated, false, 'isCalculated must be false on override');
  assert.strictEqual(res.ldl.invalidReason, undefined, 'invalidReason must be cleared');
  // VLDL is still invalid because Friedewald VLDL cannot be measured
  assert.strictEqual(res.vldl.value, null, 'VLDL remains null');
  assert.ok(res.vldl.invalidReason?.includes('Not calculated'), 'VLDL keeps invalid message');
  // Castelli II (LDL/HDL) now computes using direct LDL: 142 / 38 = 3.736 -> 3.7
  assert.strictEqual(res.ldlHdlRatio.value, 3.7, 'LDL/HDL ratio uses direct LDL 142 / 38 = 3.7');
  totalAssertions += 6;
});

check('Direct LDL override takes priority even when TG < 400 mg/dL (overwriting calculated value)', () => {
  // TC = 220, HDL = 50, TG = 150 -> Friedewald LDL would be 220 - 50 - 30 = 140 mg/dL.
  // Direct LDL measurement = 128 mg/dL.
  const res = calculateLipidPanel(220, 50, 150, 'mg/dL', 128);
  assert.strictEqual(res.ldl.value, 128, 'Direct LDL 128 must override calculated 140');
  assert.strictEqual(res.ldl.isCalculated, false, 'isCalculated must be false');
  // Castelli II must use 128: 128 / 50 = 2.56 -> 2.6 (instead of 140 / 50 = 2.8)
  assert.strictEqual(res.ldlHdlRatio.value, 2.6, 'LDL/HDL must use overridden LDL: 128 / 50 = 2.6');
  // VLDL should still be calculated from TG: 150 / 5 = 30
  assert.strictEqual(res.vldl.value, 30, 'VLDL remains calculated');
  totalAssertions += 4;
});

check('Direct LDL override in mmol/L with decimal precision', () => {
  // TG = 6.0 mmol/L (> 4.5). Direct LDL = 3.45 mmol/L. HDL = 1.10 mmol/L.
  const res = calculateLipidPanel(6.5, 1.1, 6.0, 'mmol/L', 3.45);
  assert.strictEqual(res.ldl.value, 3.45, 'Direct LDL mmol/L preserved');
  assert.strictEqual(res.ldl.isCalculated, false, 'isCalculated is false');
  // Castelli II: 3.45 / 1.1 = 3.136 -> 3.1
  assert.strictEqual(res.ldlHdlRatio.value, 3.1, 'LDL/HDL ratio in mmol/L uses direct LDL');
  totalAssertions += 3;
});

check('Direct LDL override cleared (reverting to calculated value)', () => {
  // When direct override is null or undefined, standard Friedewald formula resumes
  const withOverride = calculateLipidPanel(200, 50, 100, 'mg/dL', 110);
  assert.strictEqual(withOverride.ldl.value, 110, 'With override: 110');
  assert.strictEqual(withOverride.ldl.isCalculated, false);

  const reverted = calculateLipidPanel(200, 50, 100, 'mg/dL', null);
  assert.strictEqual(reverted.ldl.value, 130, 'Reverted to Friedewald: 200 - 50 - 20 = 130');
  assert.strictEqual(reverted.ldl.isCalculated, true, 'isCalculated returns to true');
  totalAssertions += 4;
});

check('Direct LDL override with invalid/edge direct values', () => {
  // directLdlOverride is NaN
  const resNan = calculateLipidPanel(200, 50, 100, 'mg/dL', NaN);
  assert.strictEqual(resNan.ldl.value, 130, 'NaN override falls back to calculated');
  assert.strictEqual(resNan.ldl.isCalculated, true);

  // directLdlOverride is undefined
  const resUndef = calculateLipidPanel(200, 50, 100, 'mg/dL', undefined);
  assert.strictEqual(resUndef.ldl.value, 130, 'undefined override falls back to calculated');
  totalAssertions += 3;
});

passedSuites++;

// ----------------------------------------------------------------------------
// SUITE 3: 2021 CKD-EPI eGFR EQUATION & PEDIATRIC INVALIDATION (AGE < 18)
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: 2021 CKD-EPI Race-Free eGFR & Pediatric Boundary Stress ---');

check('Pediatric invalidation for ages strictly < 18 years (0 to 17.9 years)', () => {
  const pediatricAges = [0.01, 0.5, 1, 2, 5, 8, 11, 12, 15, 17, 17.5, 17.9, 17.99];

  for (const age of pediatricAges) {
    const maleRes = calculateEgfr(0.8, age, 'MALE');
    assert.strictEqual(maleRes.value, null, `Age ${age} male must return null`);
    assert.strictEqual(maleRes.stage, 'N/A', `Age ${age} male stage must be N/A`);
    assert.ok(maleRes.note.includes('Pediatric patient (age < 18)'), `Age ${age} note mentions pediatric`);
    assert.ok(maleRes.note.includes('Schwartz'), `Age ${age} note mentions Schwartz`);

    const femaleRes = calculateEgfr(0.7, age, 'FEMALE');
    assert.strictEqual(femaleRes.value, null, `Age ${age} female must return null`);
    assert.strictEqual(femaleRes.stage, 'N/A', `Age ${age} female stage must be N/A`);
    assert.ok(femaleRes.note.includes('Schwartz'), `Age ${age} female note mentions Schwartz`);
  }
  totalAssertions += pediatricAges.length * 7;
});

check('Adult threshold activation at age = 18.0 years', () => {
  // Adult Male: Age = 18.0, Scr = 0.9 mg/dL (Scr/kappa = 1.0)
  // formula: 142 * 1.0 * 1.0 * (0.9938^18) * 1.0 = 142 * 0.894082 = 126.96 -> rounds to 127.0 mL/min/1.73m²
  const m18 = calculateEgfr(0.9, 18.0, 'MALE');
  assert.ok(m18.value !== null, 'Age 18.0 male must calculate eGFR');
  assert.strictEqual(m18.value, 127, 'Age 18.0 male eGFR must round to 127');
  assert.strictEqual(m18.stage, 'G1', 'Stage must be G1');

  // Adult Female: Age = 18.0, Scr = 0.7 mg/dL (Scr/kappa = 1.0)
  // formula: 142 * 1.0 * 1.0 * (0.9938^18) * 1.012 = 126.96 * 1.012 = 128.48 -> rounds to 128.5 mL/min/1.73m²
  const f18 = calculateEgfr(0.7, 18.0, 'FEMALE');
  assert.ok(f18.value !== null, 'Age 18.0 female must calculate eGFR');
  assert.strictEqual(f18.value, 128.5, 'Age 18.0 female eGFR must round to 128.5');
  assert.strictEqual(f18.stage, 'G1', 'Stage must be G1');
  totalAssertions += 6;
});

check('KDIGO Stages G1 through G5 mapping across clinical spectrum', () => {
  // Stage G1 (>= 90): Scr 0.8, Age 25, Male
  const g1 = calculateEgfr(0.8, 25, 'MALE');
  assert.ok(g1.value! >= 90, `G1 value: ${g1.value}`);
  assert.strictEqual(g1.stage, 'G1');

  // Stage G2 (60-89): Scr 1.3, Age 55, Male -> ~66.3
  const g2 = calculateEgfr(1.3, 55, 'MALE');
  assert.ok(g2.value! >= 60 && g2.value! < 90, `G2 value: ${g2.value}`);
  assert.strictEqual(g2.stage, 'G2');

  // Stage G3a (45-59): Scr 1.6, Age 65, Male -> ~46.9
  const g3a = calculateEgfr(1.6, 65, 'MALE');
  assert.ok(g3a.value! >= 45 && g3a.value! < 60, `G3a value: ${g3a.value}`);
  assert.strictEqual(g3a.stage, 'G3a');

  // Stage G3b (30-44): Scr 1.6, Age 65, Female -> ~35.4
  const g3b = calculateEgfr(1.6, 65, 'FEMALE');
  assert.ok(g3b.value! >= 30 && g3b.value! < 45, `G3b value: ${g3b.value}`);
  assert.strictEqual(g3b.stage, 'G3b');

  // Stage G4 (15-29): Scr 3.2, Age 70, Male -> ~20.0
  const g4 = calculateEgfr(3.2, 70, 'MALE');
  assert.ok(g4.value! >= 15 && g4.value! < 30, `G4 value: ${g4.value}`);
  assert.strictEqual(g4.stage, 'G4');

  // Stage G5 (< 15): Scr 6.5, Age 60, Male -> ~9.4
  const g5 = calculateEgfr(6.5, 60, 'MALE');
  assert.ok(g5.value! < 15, `G5 value: ${g5.value}`);
  assert.strictEqual(g5.stage, 'G5');
  assert.ok(g5.note.includes('Kidney failure'), 'G5 note mentions kidney failure');
  totalAssertions += 13;
});

check('Invalid eGFR inputs (Scr <= 0, Age <= 0, NaN)', () => {
  // Scr = 0
  assert.strictEqual(calculateEgfr(0, 40, 'MALE').value, 0);
  // Scr < 0
  assert.strictEqual(calculateEgfr(-1.2, 40, 'MALE').value, 0);
  // Age = 0
  assert.strictEqual(calculateEgfr(1.0, 0, 'MALE').value, 0);
  // Age < 0
  assert.strictEqual(calculateEgfr(1.0, -5, 'MALE').value, 0);
  // NaN inputs
  assert.strictEqual(calculateEgfr(NaN, 40, 'MALE').value, 0);
  assert.strictEqual(calculateEgfr(1.0, NaN, 'MALE').value, 0);
  totalAssertions += 6;
});

passedSuites++;

// ----------------------------------------------------------------------------
// SUITE 4: TUBE BADGE DERIVATION UNDER COMPLEX TEST COMBINATIONS
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Specimen Tube Badge Derivations (Production Library) ---');

check('Combo A: All 4 Tube Types Concurrently (EDTA, Citrate, SST, Sterile Container)', () => {
  const tests: UnifiedCartItem[] = [
    { id: '1', code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', price: 10000 },
    { id: '2', code: 'PT-INR', name: 'Prothrombin Time', category: 'Coagulation', price: 8000 },
    { id: '3', code: 'CHOL', name: 'Total Cholesterol', category: 'Chemistry', price: 5000 },
    { id: '4', code: 'GUE', name: 'General Urine Examination', category: 'Urine', price: 4000 },
  ];

  const badges = deriveTubeBadges(tests);
  assert.strictEqual(badges.length, 4, 'Must derive exactly 4 distinct tube badges');

  const badgeMap = new Map(badges.map(b => [b.id, b]));
  assert.ok(badgeMap.has('edta'), 'Must contain EDTA badge');
  assert.ok(badgeMap.has('citrate'), 'Must contain Citrate badge');
  assert.ok(badgeMap.has('sst'), 'Must contain SST badge');
  assert.ok(badgeMap.has('container'), 'Must contain Container badge');

  assert.strictEqual(badgeMap.get('edta')!.color, '#7c3aed', 'EDTA color #7c3aed');
  assert.strictEqual(badgeMap.get('citrate')!.color, '#0284c7', 'Citrate color #0284c7');
  assert.strictEqual(badgeMap.get('sst')!.color, '#d97706', 'SST color #d97706');
  assert.strictEqual(badgeMap.get('container')!.color, '#059669', 'Container color #059669');

  assert.strictEqual(badgeMap.get('edta')!.count, 1);
  assert.strictEqual(badgeMap.get('citrate')!.count, 1);
  assert.strictEqual(badgeMap.get('sst')!.count, 1);
  assert.strictEqual(badgeMap.get('container')!.count, 1);
  totalAssertions += 13;
});

check('Combo B: Serum Iron, Ferritin & TIBC must route to SST (NOT EDTA) alongside CBC', () => {
  // Clinical safety rule: Iron and Ferritin MUST NOT be collected in EDTA tubes
  const tests: UnifiedCartItem[] = [
    { id: '1', code: 'CBC', name: 'CBC', category: 'Hematology', price: 10000 },
    { id: '2', code: 'FER', name: 'Serum Ferritin', category: 'Hematology', price: 15000 },
    { id: '3', code: 'IRON', name: 'Serum Iron', category: 'Biochemistry', price: 10000 },
    { id: '4', code: 'TIBC', name: 'Total Iron Binding Capacity', category: 'Hematology', price: 10000 },
  ];

  const badges = deriveTubeBadges(tests);
  assert.strictEqual(badges.length, 2, 'Must yield exactly 2 badges: EDTA and SST');

  const edta = badges.find(b => b.id === 'edta')!;
  const sst = badges.find(b => b.id === 'sst')!;
  assert.ok(edta, 'Must have EDTA');
  assert.ok(sst, 'Must have SST');

  assert.strictEqual(edta.count, 1, 'Only CBC in EDTA');
  assert.deepStrictEqual(edta.testNames, ['CBC']);

  assert.strictEqual(sst.count, 3, 'Ferritin, Iron, and TIBC must be in SST');
  assert.ok(sst.testNames.includes('Serum Ferritin'));
  assert.ok(sst.testNames.includes('Serum Iron'));
  assert.ok(sst.testNames.includes('Total Iron Binding Capacity'));
  totalAssertions += 8;
});

check('Combo C: Comprehensive Coagulation Panel routes to Citrate (Light Blue)', () => {
  const tests: UnifiedCartItem[] = [
    { id: '1', code: 'PT', name: 'Prothrombin Time', category: 'Coagulation', price: 7000 },
    { id: '2', code: 'INR', name: 'INR', category: 'Coagulation', price: 0 },
    { id: '3', code: 'PTT', name: 'Partial Thromboplastin Time', category: 'Coagulation', price: 8000 },
    { id: '4', code: 'D-DIMER', name: 'D-Dimer Quantitative', category: 'Coagulation', price: 25000 },
    { id: '5', code: 'FIBRINOGEN', name: 'Fibrinogen Activity', category: 'Coagulation', price: 15000 },
  ];

  const badges = deriveTubeBadges(tests);
  assert.strictEqual(badges.length, 1, 'Coagulation panel yields only 1 tube badge');
  assert.strictEqual(badges[0].id, 'citrate');
  assert.strictEqual(badges[0].count, 5);
  totalAssertions += 3;
});

check('Combo D: Multi-specimen Containers (Urine, Stool, Semen, Micro)', () => {
  const tests: UnifiedCartItem[] = [
    { id: '1', code: 'GUE', name: 'Urine Analysis', category: 'Urinalysis', price: 4000 },
    { id: '2', code: 'MALB', name: 'Microalbuminuria', category: 'Urine', price: 12000 },
    { id: '3', code: 'GSE', name: 'Stool Examination', category: 'Parasitology', price: 4000 },
    { id: '4', code: 'HP-AG', name: 'H. Pylori Stool Antigen', category: 'Stool', price: 10000 },
    { id: '5', code: 'SFA', name: 'Seminal Fluid Analysis', category: 'Fertility', price: 15000 },
  ];

  const badges = deriveTubeBadges(tests);
  assert.strictEqual(badges.length, 1, 'Yields 1 sterile container badge');
  assert.strictEqual(badges[0].id, 'container');
  assert.strictEqual(badges[0].count, 5);
  totalAssertions += 3;
});

check('Combo E: Arabic sampleType and category detection', () => {
  const tests: UnifiedCartItem[] = [
    { id: '1', code: 'T1', name: 'فحص مخصص', category: 'عام', sampleType: 'دم كامل', price: 5000 },
    { id: '2', code: 'T2', name: 'فحص سيولة', category: 'عام', sampleType: 'سترات', price: 5000 },
    { id: '3', code: 'T3', name: 'فحص إدرار ميكروسكوبي', category: 'إدرار', sampleType: 'إدرار', price: 5000 },
    { id: '4', code: 'T4', name: 'فحص هرموني', category: 'هرمونات', sampleType: 'سيروم', price: 5000 },
  ];

  const badges = deriveTubeBadges(tests);
  assert.strictEqual(badges.length, 4, 'Arabic sampleType correctly partitions into 4 tubes');
  const ids = badges.map(b => b.id);
  assert.ok(ids.includes('edta'));
  assert.ok(ids.includes('citrate'));
  assert.ok(ids.includes('container'));
  assert.ok(ids.includes('sst'));
  totalAssertions += 5;
});

check('Combo F: Empty and Malformed Inputs Robustness', () => {
  assert.deepStrictEqual(deriveTubeBadges([]), []);
  assert.deepStrictEqual(deriveTubeBadges(null as any), []);
  assert.deepStrictEqual(deriveTubeBadges(undefined as any), []);
  assert.deepStrictEqual(deriveTubeBadges('not an array' as any), []);
  totalAssertions += 4;
});

passedSuites++;

// ----------------------------------------------------------------------------
// SUITE 6: WORKSPACE STATE CASCADE SIMULATION (LIPID + eGFR REAL-TIME REACTIVITY)
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Workspace State Cascade Simulation (Reactivity & Invalidation) ---');

check('Dynamic TG update: TG 390 -> 420 -> Direct LDL Override 112 -> Clear Override', () => {
  // Step 1: Initial Lipid Entry with TG = 390 mg/dL (< 400)
  let p1 = calculateLipidPanel(220, 45, 390, 'mg/dL', null);
  assert.strictEqual(p1.ldl.value, 97, 'LDL: 220 - 45 - 78 = 97');
  assert.strictEqual(p1.vldl.value, 78, 'VLDL: 390 / 5 = 78');
  assert.strictEqual(p1.nonHdl.value, 175, 'Non-HDL: 220 - 45 = 175');
  assert.strictEqual(p1.tcHdlRatio.value, 4.9, 'TC/HDL: 220 / 45 = 4.9');
  assert.strictEqual(p1.ldlHdlRatio.value, 2.2, 'LDL/HDL: 97 / 45 = 2.2');
  assert.strictEqual(p1.ldl.isCalculated, true);

  // Step 2: Laboratory repeats and enters TG = 420 mg/dL (>= 400)
  let p2 = calculateLipidPanel(220, 45, 420, 'mg/dL', null);
  assert.strictEqual(p2.ldl.value, null, 'LDL must be suppressed at TG=420');
  assert.ok(p2.ldl.invalidReason?.includes('Not calculated (TG ≥ 400)'));
  assert.strictEqual(p2.vldl.value, null, 'VLDL must be suppressed at TG=420');
  assert.strictEqual(p2.nonHdl.value, 175, 'Non-HDL remains valid 175');
  assert.strictEqual(p2.tcHdlRatio.value, 4.9, 'TC/HDL remains valid 4.9');
  assert.strictEqual(p2.ldlHdlRatio.value, null, 'LDL/HDL suppressed');

  // Step 3: Laboratory measures direct LDL = 112 mg/dL
  let p3 = calculateLipidPanel(220, 45, 420, 'mg/dL', 112);
  assert.strictEqual(p3.ldl.value, 112, 'Direct LDL overrides to 112');
  assert.strictEqual(p3.ldl.isCalculated, false, 'isCalculated must be false');
  assert.strictEqual(p3.vldl.value, null, 'VLDL remains suppressed at TG=420');
  assert.strictEqual(p3.ldlHdlRatio.value, 2.5, 'LDL/HDL now computes: 112 / 45 = 2.488 -> 2.5');

  // Step 4: Technician clears direct LDL override
  let p4 = calculateLipidPanel(220, 45, 420, 'mg/dL', null);
  assert.strictEqual(p4.ldl.value, null, 'LDL returns to suppressed state');
  assert.strictEqual(p4.ldlHdlRatio.value, null, 'LDL/HDL returns to null');
  totalAssertions += 16;
});

check('Dynamic Age Transition: Adult 45yo -> Pediatric Correction 9yo', () => {
  // Step 1: Patient entered as 45-year-old male, Creatinine = 1.2 mg/dL
  const adultEgfr = calculateEgfr(1.2, 45, 'MALE');
  assert.ok(adultEgfr.value !== null);
  assert.ok(adultEgfr.value! >= 60 && adultEgfr.value! < 90, 'Adult eGFR is Stage G2');
  assert.strictEqual(adultEgfr.stage, 'G2');

  // Step 2: Patient DOB corrected: patient is actually 9 years old (< 18)
  const pedEgfr = calculateEgfr(1.2, 9, 'MALE');
  assert.strictEqual(pedEgfr.value, null, 'Pediatric eGFR value must be null');
  assert.strictEqual(pedEgfr.stage, 'N/A', 'Stage must be N/A');
  assert.ok(pedEgfr.note.includes('Schwartz'), 'Must refer to Bedside Schwartz formula');
  totalAssertions += 6;
});

passedSuites++;

// ----------------------------------------------------------------------------
// SUITE 7: MULTI-WORKSTATION CLINICAL ORDER TUBE AUDIT
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 7: Multi-Workstation Real-World Tube Partition Audit ---');

check('16-Test Multi-Workstation Order tube partition & integrity verification', () => {
  const multiOrder: UnifiedCartItem[] = [
    // Whole Blood (EDTA)
    { id: 't-cbc', code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', price: 10000 },
    { id: 't-esr', code: 'ESR', name: 'Erythrocyte Sedimentation Rate', category: 'Hematology', price: 4000 },
    { id: 't-bg', code: 'BG', name: 'Blood Group & Rh', category: 'Hematology', price: 5000 },
    { id: 't-hba1c', code: 'HBA1C', name: 'Hemoglobin A1c', category: 'Diabetes', price: 15000 },

    // Coagulation (Citrate)
    { id: 't-pt', code: 'PT-INR', name: 'Prothrombin Time', category: 'Coagulation', price: 8000 },
    { id: 't-ddimer', code: 'D-DIMER', name: 'D-Dimer', category: 'Coagulation', price: 25000 },

    // Sterile Container
    { id: 't-gue', code: 'GUE', name: 'General Urine Examination', category: 'Urine', price: 4000 },
    { id: 't-gse', code: 'GSE', name: 'General Stool Examination', category: 'Stool', price: 4000 },

    // Serum (SST) - Chemistry, Lipids, Hormones, Specific Minerals
    { id: 't-fbs', code: 'FBS', name: 'Fasting Blood Sugar', category: 'Chemistry', price: 5000 },
    { id: 't-chol', code: 'CHOL', name: 'Cholesterol Total', category: 'Lipids', price: 5000 },
    { id: 't-tg', code: 'TG', name: 'Triglycerides', category: 'Lipids', price: 5000 },
    { id: 't-hdl', code: 'HDL', name: 'HDL Cholesterol', category: 'Lipids', price: 6000 },
    { id: 't-creat', code: 'CREAT', name: 'Creatinine', category: 'Renal', price: 6000 },
    { id: 't-tsh', code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Hormones', price: 15000 },
    { id: 't-fer', code: 'FER', name: 'Ferritin', category: 'Hematology', price: 15000 },
    { id: 't-iron', code: 'IRON', name: 'Serum Iron', category: 'Biochemistry', price: 10000 },
  ];

  const badges = deriveTubeBadges(multiOrder);
  assert.strictEqual(badges.length, 4, 'Must yield all 4 tubes');

  const edta = badges.find(b => b.id === 'edta')!;
  const citrate = badges.find(b => b.id === 'citrate')!;
  const container = badges.find(b => b.id === 'container')!;
  const sst = badges.find(b => b.id === 'sst')!;

  assert.strictEqual(edta.count, 4, 'EDTA has 4 tests (CBC, ESR, BG, HBA1C)');
  assert.strictEqual(citrate.count, 2, 'Citrate has 2 tests (PT-INR, D-DIMER)');
  assert.strictEqual(container.count, 2, 'Container has 2 tests (GUE, GSE)');
  assert.strictEqual(sst.count, 8, 'SST has 8 tests (FBS, CHOL, TG, HDL, CREAT, TSH, FER, IRON)');

  // Verify that Ferritin and Iron are strictly in SST, NOT in EDTA
  assert.ok(sst.testNames.includes('Ferritin'));
  assert.ok(sst.testNames.includes('Serum Iron'));
  assert.ok(!edta.testNames.includes('Ferritin'));
  assert.ok(!edta.testNames.includes('Serum Iron'));

  totalAssertions += 10;
});

passedSuites++;

// ----------------------------------------------------------------------------
// SUITE 5: CROSS-FORMULA INTERACTION & CASCADE VALIDATION
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Cross-Formula Interaction & Clinical Cascade Validation ---');

check('Indirect Bilirubin Direct > Total Invalidation Rule', () => {
  // Valid: TB 2.4, DB 0.8 -> Indirect = 1.6
  const valid = calculateIndirectBilirubin(2.4, 0.8);
  assert.strictEqual(valid.value, 1.6);
  assert.strictEqual(valid.invalidReason, undefined);

  // Invalid Direct > Total: TB 1.0, DB 1.5 -> null + warning
  const invalid = calculateIndirectBilirubin(1.0, 1.5);
  assert.strictEqual(invalid.value, null);
  assert.ok(invalid.invalidReason?.includes('Direct Bilirubin cannot exceed Total Bilirubin'));

  // Equal values: TB 1.0, DB 1.0 -> Indirect = 0.0
  const equal = calculateIndirectBilirubin(1.0, 1.0);
  assert.strictEqual(equal.value, 0.0);

  // Negative / NaN inputs
  assert.strictEqual(calculateIndirectBilirubin(-1, 0.5).value, null);
  assert.strictEqual(calculateIndirectBilirubin(1.0, -0.5).value, null);
  assert.strictEqual(calculateIndirectBilirubin(NaN, 0.5).value, null);
  totalAssertions += 7;
});

passedSuites++;

console.log('\n======================================================================');
console.log(`   ALL 7 ADVERSARIAL SUITES PASSED! (${passedSuites}/7)`);
console.log(`   Total Assertions Verified: ${totalAssertions}`);
console.log('======================================================================');
