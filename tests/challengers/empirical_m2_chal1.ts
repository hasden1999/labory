/**
 * Empirical Verification Harness for Challenger 1 (Milestone M2)
 * Tests all required clinical formula invalidation scenarios:
 * 1. Friedewald LDL Invalidation: TG=399 (valid) vs TG=400 (invalid) vs TG=1200 (invalid)
 * 2. Direct Bilirubin > Total Bilirubin Invalidation: DB=1.5, TB=1.0 (invalid) vs valid fractions
 * 3. 5-Part Differential Sum Balance: Sum=99% (invalid) vs 100% (valid) vs 101% (invalid)
 * 4. 2021 CKD-EPI Equation: Extreme ages (18, 95) and extreme creatinine values (0.2, 12.0)
 * 5. Mentzer Index: MCV 68 / RBC 6.2 (<13 Beta-Thal) vs MCV 68 / RBC 3.8 (>13 Iron Def)
 */

import {
  calculateEgfr,
  calculateLdl,
  calculateVldl,
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
  compareSampleWithHistory
} from '../../apps/web/src/lib/deltaCheck';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  error?: string;
}

const results: TestResult[] = [];

function assert(suite: string, name: string, condition: boolean, actual: any, expected: any, errorMsg?: string) {
  if (condition) {
    results.push({ suite, name, passed: true, actual, expected });
    console.log(`  [PASS] ${name}`);
  } else {
    results.push({ suite, name, passed: false, actual, expected, error: errorMsg || 'Assertion failed' });
    console.error(`  [FAIL] ${name} -> Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
  }
}

console.log('======================================================================');
console.log('       EMPIRICAL CHALLENGE SUITE: CLINICAL FORMULA INVALIDATION       ');
console.log('======================================================================\n');

// ----------------------------------------------------------------------
// 1. Friedewald LDL Invalidation Rules
// ----------------------------------------------------------------------
console.log('--- 1. Friedewald LDL Invalidation Rules ---');
{
  const suite = 'Friedewald LDL';

  // Case 1A: TG = 399 mg/dL (Valid boundary)
  const ldl399 = calculateLdl(200, 50, 399);
  assert(
    suite,
    'TG = 399 mg/dL (Boundary below 400) -> Valid LDL calculation (70.2 mg/dL)',
    ldl399.value === 70.2 && ldl399.invalidReason === undefined,
    ldl399,
    { value: 70.2, invalidReason: undefined }
  );

  // Case 1B: TG = 400 mg/dL (Exact invalidation threshold)
  const ldl400 = calculateLdl(200, 50, 400);
  assert(
    suite,
    'TG = 400 mg/dL (Exact threshold) -> Invalidated (null value, explicit invalidReason)',
    ldl400.value === null && typeof ldl400.invalidReason === 'string' && ldl400.invalidReason.includes('Triglycerides >= 400 mg/dL'),
    ldl400,
    { value: null, invalidReason: 'Triglycerides >= 400 mg/dL (chylomicronemia invalidates Friedewald equation; direct LDL measurement required)' }
  );

  // Case 1C: TG = 1200 mg/dL (Severe hypertriglyceridemia)
  const ldl1200 = calculateLdl(300, 35, 1200);
  assert(
    suite,
    'TG = 1200 mg/dL (Severe hypertriglyceridemia) -> Invalidated (null value, direct LDL measurement required)',
    ldl1200.value === null && typeof ldl1200.invalidReason === 'string' && ldl1200.invalidReason.includes('direct LDL measurement required'),
    ldl1200,
    { value: null, invalidReason: 'Triglycerides >= 400 mg/dL (chylomicronemia invalidates Friedewald equation; direct LDL measurement required)' }
  );

  // Case 1D: VLDL Invalidation at TG >= 400
  const vldl399 = calculateVldl(399);
  const vldl400 = calculateVldl(400);
  const vldl1200 = calculateVldl(1200);
  assert(
    suite,
    'VLDL: Valid at TG=399 (79.8), Invalidated at TG=400 & TG=1200',
    vldl399.value === 79.8 && vldl400.value === null && vldl1200.value === null,
    { vldl399: vldl399.value, vldl400: vldl400.value, vldl1200: vldl1200.value },
    { vldl399: 79.8, vldl400: null, vldl1200: null }
  );
}

// ----------------------------------------------------------------------
// 2. Direct Bilirubin vs Total Bilirubin Invalidation
// ----------------------------------------------------------------------
console.log('\n--- 2. Bilirubin Fractions Invalidation Rules ---');
{
  const suite = 'Bilirubin Fractions';

  // Case 2A: Direct Bilirubin = 1.5, Total Bilirubin = 1.0 (Invalid Direct > Total)
  const bilInvalid = calculateIndirectBilirubin(1.0, 1.5);
  assert(
    suite,
    'DB = 1.5, TB = 1.0 (Direct > Total) -> Invalidated (null value, explicit invalidReason)',
    bilInvalid.value === null && typeof bilInvalid.invalidReason === 'string' && bilInvalid.invalidReason.includes('Direct Bilirubin cannot exceed Total Bilirubin'),
    bilInvalid,
    { value: null, invalidReason: 'Direct Bilirubin cannot exceed Total Bilirubin' }
  );

  // Case 2B: Normal valid fraction TB = 2.4, DB = 0.8 -> Indirect = 1.6
  const bilValid = calculateIndirectBilirubin(2.4, 0.8);
  assert(
    suite,
    'TB = 2.4, DB = 0.8 -> Valid Indirect Bilirubin (1.6 mg/dL)',
    bilValid.value === 1.6 && bilValid.invalidReason === undefined,
    bilValid,
    { value: 1.6, invalidReason: undefined }
  );

  // Case 2C: 100% Direct fraction TB = 3.0, DB = 3.0 -> Indirect = 0.0
  const bilEqual = calculateIndirectBilirubin(3.0, 3.0);
  assert(
    suite,
    'TB = 3.0, DB = 3.0 (100% Direct) -> Indirect = 0.0 mg/dL (Valid)',
    bilEqual.value === 0.0 && bilEqual.invalidReason === undefined,
    bilEqual,
    { value: 0.0, invalidReason: undefined }
  );
}

// ----------------------------------------------------------------------
// 3. 5-Part Differential Sum Balance Checker (99% vs 100% vs 101%)
// ----------------------------------------------------------------------
console.log('\n--- 3. 5-Part Differential Sum Balance ---');
{
  const suite = 'CBC Differential Sum';

  // Case 3A: Differential Sum = 99% (Under 100%)
  // Neut 59, Lymph 30, Mono 6, Eos 3, Baso 1 = 99%
  const diff99 = validateDifferentialSum(59, 30, 6, 3, 1);
  assert(
    suite,
    'Differential Sum = 99% -> isValid: false, sum: 99.0, error message',
    diff99.isValid === false && diff99.sum === 99.0 && typeof diff99.error === 'string' && diff99.error.includes('Differential sum must equal 100%'),
    diff99,
    { sum: 99.0, isValid: false, error: 'Differential sum must equal 100% (currently 99%)' }
  );

  // Case 3B: Differential Sum = 100% (Valid)
  // Neut 60, Lymph 30, Mono 6, Eos 3, Baso 1 = 100%
  const diff100 = validateDifferentialSum(60, 30, 6, 3, 1);
  assert(
    suite,
    'Differential Sum = 100% -> isValid: true, sum: 100.0, error: undefined',
    diff100.isValid === true && diff100.sum === 100.0 && diff100.error === undefined,
    diff100,
    { sum: 100.0, isValid: true, error: undefined }
  );

  // Case 3C: Differential Sum = 101% (Over 100%)
  // Neut 61, Lymph 30, Mono 6, Eos 3, Baso 1 = 101%
  const diff101 = validateDifferentialSum(61, 30, 6, 3, 1);
  assert(
    suite,
    'Differential Sum = 101% -> isValid: false, sum: 101.0, error message',
    diff101.isValid === false && diff101.sum === 101.0 && typeof diff101.error === 'string' && diff101.error.includes('Differential sum must equal 100%'),
    diff101,
    { sum: 101.0, isValid: false, error: 'Differential sum must equal 100% (currently 101%)' }
  );
}

// ----------------------------------------------------------------------
// 4. 2021 CKD-EPI Equation: Extreme Ages (18, 95) & Creatinine (0.2, 12.0)
// ----------------------------------------------------------------------
console.log('\n--- 4. 2021 CKD-EPI Extreme Boundary Stress Testing ---');
{
  const suite = '2021 CKD-EPI Boundary';

  // Case 4A: Young Adult (Age 18), Very Low Creatinine (0.2 mg/dL) - Male
  // Formula: 142 * (0.2/0.9)^-0.302 * 1.0 * 0.9938^18 = 199.96 -> rounded 200.0 mL/min/1.73m2
  const egfrYoungLowM = calculateEgfr(0.2, 18, 'MALE');
  assert(
    suite,
    'Age 18, Creatinine 0.2 mg/dL (MALE) -> eGFR 200 mL/min/1.73m2 (Stage G1)',
    egfrYoungLowM.value === 200 && egfrYoungLowM.stage === 'G1',
    egfrYoungLowM,
    { value: 200, stage: 'G1' }
  );

  // Case 4B: Young Adult (Age 18), Very Low Creatinine (0.2 mg/dL) - Female
  // Formula: 142 * (0.2/0.7)^-0.241 * 1.0 * 0.9938^18 * 1.012 = 173.81 -> rounded 173.8 mL/min/1.73m2
  const egfrYoungLowF = calculateEgfr(0.2, 18, 'FEMALE');
  assert(
    suite,
    'Age 18, Creatinine 0.2 mg/dL (FEMALE) -> eGFR 173.8 mL/min/1.73m2 (Stage G1)',
    egfrYoungLowF.value === 173.8 && egfrYoungLowF.stage === 'G1',
    egfrYoungLowF,
    { value: 173.8, stage: 'G1' }
  );

  // Case 4C: Geriatric (Age 95), Extreme ESRD Creatinine (12.0 mg/dL) - Male
  // Formula: 142 * 1.0 * (12/0.9)^-1.200 * 0.9938^95 = 3.53 -> rounded 3.5 mL/min/1.73m2
  const egfrOldHighM = calculateEgfr(12.0, 95, 'MALE');
  assert(
    suite,
    'Age 95, Creatinine 12.0 mg/dL (MALE) -> eGFR 3.5 mL/min/1.73m2 (Stage G5)',
    egfrOldHighM.value === 3.5 && egfrOldHighM.stage === 'G5' && egfrOldHighM.note.includes('Kidney failure'),
    egfrOldHighM,
    { value: 3.5, stage: 'G5' }
  );

  // Case 4D: Geriatric (Age 95), Extreme ESRD Creatinine (12.0 mg/dL) - Female
  // Formula: 142 * 1.0 * (12/0.7)^-1.200 * 0.9938^95 * 1.012 = 2.63 -> rounded 2.6 mL/min/1.73m2
  const egfrOldHighF = calculateEgfr(12.0, 95, 'FEMALE');
  assert(
    suite,
    'Age 95, Creatinine 12.0 mg/dL (FEMALE) -> eGFR 2.6 mL/min/1.73m2 (Stage G5)',
    egfrOldHighF.value === 2.6 && egfrOldHighF.stage === 'G5' && egfrOldHighF.note.includes('Kidney failure'),
    egfrOldHighF,
    { value: 2.6, stage: 'G5' }
  );

  // Case 4E: Young Adult (Age 18), Severe Acute Kidney Injury (Creatinine 12.0 mg/dL) - Male
  // Formula: 142 * 1.0 * (12/0.9)^-1.200 * 0.9938^18 = 5.70 -> rounded 5.7 mL/min/1.73m2
  const egfrYoungHighM = calculateEgfr(12.0, 18, 'MALE');
  assert(
    suite,
    'Age 18, Creatinine 12.0 mg/dL (MALE) -> eGFR 5.7 mL/min/1.73m2 (Stage G5)',
    egfrYoungHighM.value === 5.7 && egfrYoungHighM.stage === 'G5',
    egfrYoungHighM,
    { value: 5.7, stage: 'G5' }
  );

  // Case 4F: Geriatric (Age 95), Normal Low Creatinine (0.2 mg/dL) - Male
  // Formula: 142 * (0.2/0.9)^-0.302 * 1.0 * 0.9938^95 = 123.869 -> rounded 123.9 mL/min/1.73m2
  const egfrOldLowM = calculateEgfr(0.2, 95, 'MALE');
  assert(
    suite,
    'Age 95, Creatinine 0.2 mg/dL (MALE) -> eGFR 123.9 mL/min/1.73m2 (Stage G1)',
    egfrOldLowM.value === 123.9 && egfrOldLowM.stage === 'G1',
    egfrOldLowM,
    { value: 123.9, stage: 'G1' }
  );
}

// ----------------------------------------------------------------------
// 5. Mentzer Index: MCV 68 / RBC 6.2 vs MCV 68 / RBC 3.8
// ----------------------------------------------------------------------
console.log('\n--- 5. Mentzer Index Microcytic Anemia Differential ---');
{
  const suite = 'Mentzer Index';

  // Case 5A: MCV = 68 fL, RBC = 6.2 x 10^6/uL
  // Mentzer Index = 68 / 6.2 = 10.9677... -> 11.0 (< 13 -> Beta-Thalassemia Trait)
  const thal = calculateMentzerIndex(68, 6.2);
  assert(
    suite,
    'MCV 68 / RBC 6.2 -> Mentzer Index 11.0 (< 13 Suggests Beta-Thalassemia Trait)',
    thal.value === 11.0 && thal.interpretation.includes('Beta-Thalassemia Trait'),
    thal,
    { value: 11.0, interpretation: 'Suggests Beta-Thalassemia Trait (< 13)' }
  );

  // Case 5B: MCV = 68 fL, RBC = 3.8 x 10^6/uL
  // Mentzer Index = 68 / 3.8 = 17.8947... -> 17.9 (>= 13 -> Iron Deficiency Anemia)
  const ida = calculateMentzerIndex(68, 3.8);
  assert(
    suite,
    'MCV 68 / RBC 3.8 -> Mentzer Index 17.9 (>= 13 Suggests Iron Deficiency Anemia)',
    ida.value === 17.9 && ida.interpretation.includes('Iron Deficiency Anemia'),
    ida,
    { value: 17.9, interpretation: 'Suggests Iron Deficiency Anemia (>= 13)' }
  );

  // Case 5C: Boundary at exactly 13.0
  // MCV = 65, RBC = 5.0 -> Mentzer Index = 13.0 (>= 13 -> Iron Deficiency Anemia)
  const boundary = calculateMentzerIndex(65, 5.0);
  assert(
    suite,
    'MCV 65 / RBC 5.0 -> Mentzer Index 13.0 (>= 13 boundary -> Iron Deficiency Anemia)',
    boundary.value === 13.0 && boundary.interpretation.includes('Iron Deficiency Anemia'),
    boundary,
    { value: 13.0, interpretation: 'Suggests Iron Deficiency Anemia (>= 13)' }
  );
}

// ----------------------------------------------------------------------
// 6. Additional Stress Checks: Batch Calculation with Mixed Edge Cases
// ----------------------------------------------------------------------
console.log('\n--- 6. Batch Calculation with Mixed Edge Cases ---');
{
  const suite = 'Batch Calculator Edge Cases';

  const mixedEdgeInputs = {
    age: 95,
    gender: 'FEMALE',
    creatinine: 12.0,
    totalCholesterol: 250,
    hdl: 40,
    triglycerides: 500, // Invalidates Friedewald LDL and VLDL
    totalBilirubin: 1.0,
    directBilirubin: 1.5, // Invalid Direct > Total
    sodium: 140,
    chloride: 100,
    bicarbonate: 20,
    calcium: 7.2,
    albumin: 2.0,
    totalProtein: 5.5,
    ast: 80,
    alt: 40,
    hba1c: 9.0,
    fbs: 180,
    fastingInsulin: 25,
    mcv: 68,
    rbc: 6.2,
    hgb: 8.5,
    hct: 28.0,
    neutrophils: 55,
    lymphocytes: 35,
    monocytes: 5,
    eosinophils: 3,
    basophils: 1 // Sum = 99% (invalid)
  };

  const res = calculateAll(mixedEdgeInputs as any);

  assert(
    suite,
    'Batch eGFR: 2.6 Stage G5 for 95yo F Cr 12.0',
    res.egfr?.value === 2.6 && res.egfr?.stage === 'G5',
    res.egfr,
    { value: 2.6, stage: 'G5' }
  );

  assert(
    suite,
    'Batch LDL: Null with invalidReason when TG=500',
    res.ldl?.value === null && typeof res.ldl?.invalidReason === 'string',
    res.ldl,
    { value: null }
  );

  assert(
    suite,
    'Batch Indirect Bilirubin: Null with invalidReason when DB=1.5 > TB=1.0',
    res.indirectBilirubin?.value === null && typeof res.indirectBilirubin?.invalidReason === 'string',
    res.indirectBilirubin,
    { value: null }
  );

  assert(
    suite,
    'Batch Mentzer: 11.0 Beta-Thal for MCV 68 / RBC 6.2',
    res.mentzerIndex?.value === 11.0 && res.mentzerIndex?.interpretation.includes('Beta-Thalassemia Trait'),
    res.mentzerIndex,
    { value: 11.0 }
  );

  assert(
    suite,
    'Batch Diff Sum: Invalidated with sum=99%',
    res.differentialValidation?.isValid === false && res.differentialValidation?.sum === 99.0,
    res.differentialValidation,
    { sum: 99.0, isValid: false }
  );
}

// ----------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------
console.log('\n======================================================================');
const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
if (failedCount === 0) {
  console.log('VERDICT: ALL CLINICAL FORMULA INVALIDATION TESTS EMPIRICALLY VERIFIED!');
} else {
  console.log('VERDICT: FAILURES DETECTED!');
}
console.log('======================================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
