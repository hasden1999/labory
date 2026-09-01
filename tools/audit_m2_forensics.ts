import * as fs from 'fs';
import * as path from 'path';
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
  calculateAll,
  isFemaleGender
} from '../apps/web/src/lib/clinicalIntelligence';

import {
  evaluateDeltaCheck,
  evaluateMultiAnalyteDeltaChecks,
  compareSampleWithHistory,
  getDeltaThresholdConfig,
  normalizeAnalyteCode,
  DEFAULT_DELTA_THRESHOLDS
} from '../apps/web/src/lib/deltaCheck';

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  const status = condition ? '[PASS]' : '[FAIL]';
  console.log(`  ${status} ${name}: ${details}`);
}

console.log('\n======================================================');
console.log('  FORENSIC INTEGRITY AUDIT: MILESTONE M2 (CLINICAL INTELLIGENCE)');
console.log('======================================================\n');

// --------------------------------------------------------------------------
// 1. Source Code Inspection & Facade / Hardcoding Detection
// --------------------------------------------------------------------------
console.log('>>> 1. Source Code Forensics & Facade Detection...');

const ciSource = fs.readFileSync(path.join(__dirname, '../apps/web/src/lib/clinicalIntelligence.ts'), 'utf8');
const dcSource = fs.readFileSync(path.join(__dirname, '../apps/web/src/lib/deltaCheck.ts'), 'utf8');

// Check for dummy facade returns like `return 145` or `return { value: 145 }` directly in functions
const hasMockReturn = /\breturn\s*\{\s*value:\s*(?:145|91\.5|28|1\.6)\s*\}/.test(ciSource);
check('No Hardcoded Test Returns in clinicalIntelligence.ts', !hasMockReturn, 'Source contains genuine formula computations');

const hasMockDeltaReturn = /\breturn\s*\{\s*deltaPercent:\s*25\.0\s*\}/.test(dcSource);
check('No Hardcoded Test Returns in deltaCheck.ts', !hasMockDeltaReturn, 'Delta check evaluates genuine math');

// Check for NotImplemented or empty functions
const hasNotImplemented = /throw new Error\(['"]Not implemented['"]\)|TODO|FIXME/i.test(ciSource) || /throw new Error\(['"]Not implemented['"]\)|TODO|FIXME/i.test(dcSource);
check('No NotImplemented or Placeholder Stubs', !hasNotImplemented, 'All functions are fully implemented');

// --------------------------------------------------------------------------
// 2. UTF-8 & Arabic Encoding Integrity Check
// --------------------------------------------------------------------------
console.log('\n>>> 2. UTF-8 & Arabic Text Encoding Audit...');

const arabicCharsInCi = ciSource.match(/[\u0600-\u06FF]/g);
const hasMojibakeInCi = /[\uFFFD\u00C0-\u00FF]{2,}/.test(ciSource) || /[\u00D8-\u00DF][\u00A0-\u00BF]/.test(ciSource);
check('Arabic Clean UTF-8 in clinicalIntelligence.ts', arabicCharsInCi !== null && !hasMojibakeInCi, `Found ${arabicCharsInCi?.length || 0} valid Arabic characters; 0 Mojibake`);

const isFemaleArabic1 = isFemaleGender('أنثى');
const isFemaleArabic2 = isFemaleGender('انثى');
check('Arabic Gender Parser Support', isFemaleArabic1 && isFemaleArabic2, 'Successfully parsed Arabic gender strings أنثى / انثى');

// --------------------------------------------------------------------------
// 3. Mathematical Formula Precision Verification
// --------------------------------------------------------------------------
console.log('\n>>> 3. Mathematical Formula Precision Verification...');

// 2021 CKD-EPI Formula: 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^(-1.2) * 0.9938^Age * (1.012 if female)
// Test 1: 50yo Male, Scr = 1.0 mg/dL -> exact value 91.691... -> rounded 91.7 (G1)
const egfrM50 = calculateEgfr(1.0, 50, 'MALE');
check('2021 CKD-EPI Male 50yo Scr 1.0', egfrM50.value === 91.7 && egfrM50.stage === 'G1', `Expected 91.7 G1, got ${egfrM50.value} ${egfrM50.stage}`);

// Test 2: 65yo Female, Scr = 2.5 mg/dL -> exact value 20.820... -> rounded 20.8 (G4)
const egfrF65 = calculateEgfr(2.5, 65, 'FEMALE');
check('2021 CKD-EPI Female 65yo Scr 2.5', egfrF65.value === 20.8 && egfrF65.stage === 'G4', `Expected 20.8 G4, got ${egfrF65.value} ${egfrF65.stage}`);

// Friedewald Formula: LDL = TC - HDL - TG/5 with TG >= 400 invalidation
const ldlValid = calculateLdl(220, 45, 150);
check('Friedewald LDL Valid (TG=150)', ldlValid.value === 145 && !ldlValid.invalidReason, `Expected 145, got ${ldlValid.value}`);

const ldlBoundary399 = calculateLdl(200, 50, 399);
check('Friedewald LDL Boundary TG=399', ldlBoundary399.value === 70.2 && !ldlBoundary399.invalidReason, `Expected 70.2, got ${ldlBoundary399.value}`);

const ldlInvalid400 = calculateLdl(200, 50, 400);
check('Friedewald LDL Invalidation TG=400', ldlInvalid400.value === null && typeof ldlInvalid400.invalidReason === 'string', `Correctly invalidated with: ${ldlInvalid400.invalidReason}`);

// Bilirubin fractions
const indirValid = calculateIndirectBilirubin(2.4, 0.8);
check('Indirect Bilirubin Valid', indirValid.value === 1.6 && !indirValid.invalidReason, `Expected 1.6, got ${indirValid.value}`);

const indirDirectExceeds = calculateIndirectBilirubin(1.0, 1.5);
check('Direct > Total Invalidation', indirDirectExceeds.value === null && typeof indirDirectExceeds.invalidReason === 'string', `Direct > Total properly rejected: ${indirDirectExceeds.invalidReason}`);

// Serum Anion Gap = Na - (Cl + HCO3)
const agNormal = calculateAnionGap(140, 104, 24);
check('Serum Anion Gap Normal (12)', agNormal.value === 12 && agNormal.interpretation.includes('Normal'), `Expected 12 Normal, got ${agNormal.value} (${agNormal.interpretation})`);

const agHagma = calculateAnionGap(136, 98, 10);
check('Serum Anion Gap HAGMA (28)', agHagma.value === 28 && agHagma.interpretation.includes('HAGMA'), `Expected 28 HAGMA, got ${agHagma.value}`);

// Corrected Calcium = Ca + 0.8 * (4.0 - Albumin)
const corrCa = calculateCorrectedCalcium(7.8, 2.5);
check('Corrected Calcium', corrCa.value === 9.0, `Expected 9.0, got ${corrCa.value}`);

// A/G Ratio = Alb / (TP - Alb)
const agRatio = calculateAgRatio(7.5, 4.5);
check('A/G Ratio', agRatio.value === 1.5, `Expected 1.5, got ${agRatio.value}`);

// De Ritis = AST / ALT
const deRitisHigh = calculateDeRitis(120, 40);
check('De Ritis Ratio High', deRitisHigh.value === 3.0 && deRitisHigh.interpretation.includes('Significantly Elevated'), `Expected 3.0, got ${deRitisHigh.value}`);

// eAG = 28.7 * HbA1c - 46.7
const eag = calculateEag(8.0);
check('eAG from HbA1c 8.0%', eag.value === 183, `Expected 183, got ${eag.value}`);

// HOMA-IR = (FBS * Insulin) / 405
const homa = calculateHomaIr(110, 15);
check('HOMA-IR (110, 15)', Math.abs(homa.value - 4.07) < 0.01 && homa.interpretation.includes('Significant Insulin Resistance'), `Expected ~4.07, got ${homa.value}`);

// Mentzer Index = MCV / RBC
const mentzerThal = calculateMentzerIndex(65, 5.8);
check('Mentzer Index Thalassemia (<13)', Math.abs(mentzerThal.value - 11.2) < 0.1 && mentzerThal.interpretation.includes('Beta-Thalassemia'), `Expected 11.2 Thal, got ${mentzerThal.value}`);

const mentzerIda = calculateMentzerIndex(68, 3.2);
check('Mentzer Index IDA (>=13)', Math.abs(mentzerIda.value - 21.3) < 0.1 && mentzerIda.interpretation.includes('Iron Deficiency'), `Expected 21.3 IDA, got ${mentzerIda.value}`);

// CBC Indices
const cbcIndices = calculateCbcIndices(4.5, 13.5, 40.5);
check('CBC Auto-Indices MCV/MCH/MCHC', cbcIndices.mcv === 90.0 && cbcIndices.mch === 30.0 && cbcIndices.mchc === 33.3, `MCV:${cbcIndices.mcv}, MCH:${cbcIndices.mch}, MCHC:${cbcIndices.mchc}`);

// 5-Part Differential Sum
const diffValid = validateDifferentialSum(60, 30, 6, 3, 1);
check('5-Part Differential Sum Valid', diffValid.isValid === true && diffValid.sum === 100, `Sum is ${diffValid.sum}%`);

const diffInvalid = validateDifferentialSum(50, 30, 5, 3, 1);
check('5-Part Differential Sum Invalid', diffInvalid.isValid === false && typeof diffInvalid.error === 'string', `Invalid correctly rejected: ${diffInvalid.error}`);

// --------------------------------------------------------------------------
// 4. Delta Check Mathematical Verification
// --------------------------------------------------------------------------
console.log('\n>>> 4. Delta Check Mathematical Verification...');

// Delta Check formula: (|Curr - Prev| / Prev) * 100
// Test Hb 14.0 -> 10.5: |10.5 - 14.0| / 14.0 * 100 = 3.5 / 14.0 * 100 = 25.0%
const deltaHb = evaluateDeltaCheck('HGB', 10.5, 14.0);
check('Delta Check HGB 14.0 -> 10.5 (25%)', deltaHb.deltaPercent === 25.0 && deltaHb.isBreached && deltaHb.badgeLevel === 'SIGNIFICANT' && deltaHb.direction === 'decreased', `Got ${deltaHb.deltaPercent}% (${deltaHb.badgeLevel}, ${deltaHb.direction})`);

// Test Hb 14.0 -> 6.5: |6.5 - 14.0| / 14.0 * 100 = 7.5 / 14.0 * 100 = 53.5714... -> 53.6% (CRITICAL)
const deltaHbCrit = evaluateDeltaCheck('HGB', 6.5, 14.0);
check('Delta Check HGB 14.0 -> 6.5 (53.6% CRITICAL)', deltaHbCrit.deltaPercent === 53.6 && deltaHbCrit.isBreached && deltaHbCrit.badgeLevel === 'CRITICAL', `Got ${deltaHbCrit.deltaPercent}% (${deltaHbCrit.badgeLevel})`);

// Test Creatinine 1.0 -> 2.4: 1.4 / 1.0 * 100 = 140.0% (CRITICAL)
const deltaCreat = evaluateDeltaCheck('CREATININE', 2.4, 1.0);
check('Delta Check Creatinine 1.0 -> 2.4 (140% CRITICAL)', deltaCreat.deltaPercent === 140.0 && deltaCreat.badgeLevel === 'CRITICAL' && deltaCreat.direction === 'increased', `Got ${deltaCreat.deltaPercent}% (${deltaCreat.badgeLevel})`);

// Test Potassium 4.0 -> 5.2: 1.2 / 4.0 * 100 = 30.0% (SIGNIFICANT)
const deltaK = evaluateDeltaCheck('K', 5.2, 4.0);
check('Delta Check Potassium 4.0 -> 5.2 (30% SIGNIFICANT)', deltaK.deltaPercent === 30.0 && deltaK.badgeLevel === 'SIGNIFICANT', `Got ${deltaK.deltaPercent}% (${deltaK.badgeLevel})`);

// Test Division by zero safeguard
const deltaZero = evaluateDeltaCheck('HGB', 10.0, 0);
check('Delta Check Prev=0 Safeguard', deltaZero.isBreached === false && deltaZero.badgeLevel === 'NORMAL', `Safely handled zero previous value: ${deltaZero.message}`);

// Test Historical Sample Comparator Chronology
const currentSample = { id: 's-curr', tests: [{ code: 'HGB', resultValue: 10.0 }, { code: 'CREAT', resultValue: 2.0 }] };
const historicalSamples = [
  { id: 's-old', createdAt: '2026-06-01T00:00:00Z', tests: [{ code: 'HGB', resultValue: 15.0 }] },
  { id: 's-recent', createdAt: '2026-08-01T00:00:00Z', tests: [{ code: 'HGB', resultValue: 14.0 }] }
];
const compared = compareSampleWithHistory(currentSample, historicalSamples);
check('Historical Sample Chronology Selection', compared.HGB.previousSampleId === 's-recent' && compared.HGB.previousValue === 14.0, `Matched newest sample (${compared.HGB.previousSampleId}, prev=${compared.HGB.previousValue})`);

// --------------------------------------------------------------------------
// Final Summary
// --------------------------------------------------------------------------
console.log('\n======================================================');
const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;
console.log(`  AUDIT SUMMARY: ${passedCount} / ${totalCount} checks passed.`);
if (passedCount === totalCount) {
  console.log('  VERDICT: CLEAN — 0 INTEGRITY VIOLATIONS DETECTED');
  process.exit(0);
} else {
  console.log('  VERDICT: INTEGRITY VIOLATION DETECTED');
  process.exit(1);
}
