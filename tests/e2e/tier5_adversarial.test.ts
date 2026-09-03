/**
 * Labryo Clinical LIS - Tier 5 Adversarial & Stress Testing Suite
 * Milestone M5: Robustness, Security Injections, Extreme Value Defense & Fault Resilience
 * 
 * Verifies 6 critical adversarial domains:
 * 1. XSS & SQL-like injections in patient intake fields
 * 2. Extreme clinical numeric values & boundary defense (negative glucose, infinite creatinine, zero/negative RBC/HGB/HCT, NaN inputs, TG = 10,000 mg/dL)
 * 3. Differential white blood cell fuzzing (over 100%, under 100%, 0%, decimal jitter, negative percentages)
 * 4. Delta check edge cases (prior = 0, negative prior, undefined/null, identical 0% change)
 * 5. Pre-printed margin safety (clamping negative, overly large, NaN millimeter margins)
 * 6. Corruption resilience in /api/samples/[id]/results (empty objects, missing test IDs, malformed serialized strings)
 */

import { describe, test } from './harness/testRunner';
import { expect } from './harness/assertions';

// Clinical Domain Engines
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
  evaluatePanicFlag,
  calculateAll,
} from '../../apps/web/src/lib/clinicalIntelligence';

import {
  evaluateDeltaCheck,
  evaluateMultiAnalyteDeltaChecks,
  compareSampleWithHistory,
} from '../../apps/web/src/lib/deltaCheck';

import {
  getStore,
  addPatient,
  addSample,
  searchPatients,
  findSample,
  clampMargin,
  updateSettings,
} from '../../apps/web/src/lib/serverStore';

// Next.js Route Handlers
import { handleSaveResults, PUT as putResults } from '../../apps/web/src/app/api/samples/[id]/results/route';
import { GET as getPrintRoute } from '../../apps/web/src/app/api/samples/[id]/print/route';

// Helper to construct mock Request objects for Route Handlers
function makeRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string>; rawBody?: string } = {}): Request {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  let bodyContent: string | undefined = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    if (options.rawBody !== undefined) {
      bodyContent = options.rawBody;
    } else if (options.body !== undefined) {
      bodyContent = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
  }

  return new Request(url, {
    method,
    headers,
    body: bodyContent,
  });
}

describe('Tier 5: Adversarial & Stress Testing', () => {

  // ==========================================================================
  // Domain 1: XSS & SQL-Like Injections in Patient Intake Fields
  // ==========================================================================

  test('T5.1.1: XSS payload in patient name (<script>alert(1)</script>) handles safely without crashing or corrupting store', () => {
    const xssName = '<script>alert("XSS_EXPLOIT")</script>';
    const patient = addPatient({
      name: xssName,
      phone: '07701112233',
      gender: 'MALE',
      notes: '<img src=x onerror=alert("img_xss")>',
    });

    expect(patient.id).toBeTruthy();
    expect(patient.name).toBe(xssName);

    // Verify search works safely with query containing HTML/script tags
    const searchRes = searchPatients('<script>');
    expect(searchRes.length).toBeGreaterThanOrEqual(1);
    expect(searchRes.some(p => p.id === patient.id)).toBe(true);

    // Register a sample with this patient and verify sample creation
    const sample = addSample({
      patientId: patient.id,
      patientName: patient.name,
      testIds: ['t-fbs'],
      notes: '<svg/onload=alert(1)>',
    });

    expect(sample.id).toBeTruthy();
    expect(sample.patient.name).toBe(xssName);
  });

  test('T5.1.2: SQL-like injection in patient name and notes does not corrupt store or alter sample records', () => {
    const store = getStore();
    const initialSampleCount = store.samples.length;

    const sqlPayloadName = "'; DROP TABLE samples; DROP TABLE patients; --";
    const sqlNotes = "' UNION SELECT * FROM users WHERE '1'='1";

    const patient = addPatient({
      name: sqlPayloadName,
      phone: '07702223344',
      gender: 'FEMALE',
      notes: sqlNotes,
    });

    const sample = addSample({
      patientId: patient.id,
      testIds: ['t-cbc'],
      notes: sqlNotes,
    });

    expect(sample.id).toBeTruthy();
    // Database / In-memory store must not lose existing records
    expect(store.samples.length).toBe(initialSampleCount + 1);

    // Verify search with SQL wildcards and comments does not crash
    const searchSql = searchPatients("'; DROP TABLE");
    expect(searchSql.length).toBeGreaterThanOrEqual(1);
    expect(searchSql.some(p => p.id === patient.id)).toBe(true);

    const searchInjection = searchPatients("' OR '1'='1");
    // Should safely treat as literal query without throwing
    expect(Array.isArray(searchInjection)).toBe(true);
  });

  test('T5.1.3: HTML/XSS special characters are sanitized in A4 Print Route template', async () => {
    const xssPatient = addPatient({
      name: 'Adversarial <script>alert("HACK")</script> & "Quotes"',
      phone: '07703334455',
      gender: 'MALE',
    });

    const sample = addSample({
      patientId: xssPatient.id,
      testIds: ['t-fbs'],
      notes: '<b>Bold Note</b> & <script>document.cookie</script>',
    });

    const req = makeRequest(`http://localhost:3000/api/samples/${sample.id}/print`);
    const res = await getPrintRoute(req, { params: { id: sample.id } });
    expect(res.status).toBe(200);

    const html = await res.text();
    // Verify that the title and patient box do NOT render raw executable script tags
    expect(html.includes('<script>alert("HACK")</script>')).toBe(false);
    expect(html).toContain('&lt;script&gt;alert(&quot;HACK&quot;)&lt;/script&gt;');
    expect(html).toContain('&amp; &quot;Quotes&quot;');
  });

  // ==========================================================================
  // Domain 2: Extreme Clinical Numeric Values & Boundary Defense
  // ==========================================================================

  test('T5.2.1: Profound negative glucose (-50 mg/dL) triggers CRITICAL PANIC alert gracefully', () => {
    const panicRes = evaluatePanicFlag('GLUCOSE', -50);
    expect(panicRes.isPanic).toBe(true);
    expect(panicRes.isAbnormal).toBe(true);
    expect(panicRes.badgeLevel).toBe('CRITICAL_PANIC');
    expect(panicRes.panicReason).toContain('CRITICAL PANIC');

    // Also check FBS code
    const fbsPanic = evaluatePanicFlag('FBS', -10);
    expect(fbsPanic.isPanic).toBe(true);
    expect(fbsPanic.badgeLevel).toBe('CRITICAL_PANIC');
  });

  test('T5.2.2: Negative glucose or zero insulin in HOMA-IR returns indeterminate without misleading sensitivity diagnosis', () => {
    const homaNeg = calculateHomaIr(-50, 10);
    expect(homaNeg.value).toBe(0);
    expect(homaNeg.interpretation).toContain('Indeterminate');

    const homaZero = calculateHomaIr(90, 0);
    expect(homaZero.value).toBe(0);
    expect(homaZero.interpretation).toContain('Indeterminate');
  });

  test('T5.2.3: Infinite creatinine (Infinity) in 2021 CKD-EPI computes to eGFR = 0.0 and Stage G5 without NaN', () => {
    const egfrInf = calculateEgfr(Infinity, 45, 'MALE');
    expect(egfrInf.value).toBe(0);
    expect(egfrInf.stage).toBe('G5');
    expect(egfrInf.note).toContain('Kidney failure');

    // Evaluate in panic evaluator
    const panicCreat = evaluatePanicFlag('CREATININE', Infinity);
    expect(panicCreat.isPanic).toBe(true);
    expect(panicCreat.badgeLevel).toBe('CRITICAL_PANIC');
  });

  test('T5.2.4: Zero and negative RBC, HGB, and HCT in CBC auto-indices gracefully return empty object', () => {
    // Zero RBC (division by zero hazard)
    const cbcZeroRbc = calculateCbcIndices(0, 14, 42);
    expect(cbcZeroRbc).toEqual({});

    // Negative RBC
    const cbcNegRbc = calculateCbcIndices(-4.5, 14, 42);
    expect(cbcNegRbc).toEqual({});

    // Zero HCT (division by zero in MCHC)
    const cbcZeroHct = calculateCbcIndices(4.5, 14, 0);
    expect(cbcZeroHct).toEqual({});

    // Negative HGB
    const cbcNegHgb = calculateCbcIndices(4.5, -12, 42);
    expect(cbcNegHgb).toEqual({});
  });

  test('T5.2.5: NaN inputs across all clinical intelligence calculators handle safely without throwing', () => {
    // CKD-EPI with NaN
    const egfrNan = calculateEgfr(NaN, 50, 'MALE');
    expect(egfrNan.value).toBe(0);
    expect(egfrNan.stage).toBe('N/A');

    // Lipid panel with NaN
    const ldlNan = calculateLdl(NaN, 40, 150);
    expect(ldlNan.value).toBeNull();
    expect(ldlNan.invalidReason).toContain('Invalid');

    const vldlNan = calculateVldl(NaN);
    expect(vldlNan.value).toBeNull();

    const nonHdlNan = calculateNonHdl(NaN, 40);
    expect(nonHdlNan.value).toBe(0);

    const cardiacNan = calculateCardiacRisk(NaN, 40);
    expect(cardiacNan.value).toBe(0);

    // Bilirubin with NaN
    const bilNan = calculateIndirectBilirubin(NaN, 0.5);
    expect(bilNan.value).toBeNull();

    // Anion gap with NaN
    const agNan = calculateAnionGap(NaN, 100, 24);
    expect(agNan.value).toBe(0);
    expect(agNan.interpretation).toContain('Indeterminate');

    // Corrected Calcium with NaN
    const caNan = calculateCorrectedCalcium(NaN, 4.0);
    expect(caNan.value).toBe(0);

    // A/G Ratio with NaN
    const agRatioNan = calculateAgRatio(NaN, 3.5);
    expect(agRatioNan.value).toBeNull();

    // De Ritis with NaN
    const deRitisNan = calculateDeRitis(NaN, 30);
    expect(deRitisNan.value).toBe(0);
    expect(deRitisNan.interpretation).toBe('Indeterminate');

    // eAG with NaN
    const eagNan = calculateEag(NaN);
    expect(eagNan.value).toBe(0);

    // Mentzer Index with NaN
    const mentzerNan = calculateMentzerIndex(NaN, 4.5);
    expect(mentzerNan.value).toBe(0);
    expect(mentzerNan.interpretation).toBe('Indeterminate');

    // CBC Indices with NaN
    const cbcNan = calculateCbcIndices(NaN, 14, 42);
    expect(cbcNan).toEqual({});

    // Differential with NaN
    const diffNan = validateDifferentialSum(NaN, 30, 6, 3, 1);
    expect(diffNan.isValid).toBe(false);

    // Panic evaluation with NaN
    const panicNan = evaluatePanicFlag('CREATININE', NaN);
    expect(panicNan.badgeLevel).toBe('NORMAL');

    // Batch calculateAll with NaN inputs
    const batchRes = calculateAll({
      creatinine: NaN,
      age: 50,
      gender: 'MALE',
      totalCholesterol: NaN,
      hdl: NaN,
      triglycerides: NaN,
      totalBilirubin: NaN,
      directBilirubin: NaN,
      sodium: NaN,
      fbs: NaN,
      hba1c: NaN,
      rbc: NaN,
    });
    expect(batchRes.egfr?.stage).toBe('N/A');
    expect(batchRes.ldl?.value).toBeNull();
  });

  test('T5.2.6: Extreme hypertriglyceridemia (TG = 10,000 mg/dL) invalidates Friedewald LDL and VLDL with clinical advisory', () => {
    const ldlRes = calculateLdl(240, 35, 10000);
    expect(ldlRes.value).toBeNull();
    expect(ldlRes.invalidReason).toContain('chylomicronemia invalidates Friedewald equation');
    expect(ldlRes.invalidReason).toContain('direct LDL measurement required');

    const vldlRes = calculateVldl(10000);
    expect(vldlRes.value).toBeNull();
    expect(vldlRes.invalidReason).toContain('VLDL approximation invalid');

    // Full panel calculation
    const allRes = calculateAll({
      totalCholesterol: 300,
      hdl: 25,
      triglycerides: 10000,
    });
    expect(allRes.ldl?.value).toBeNull();
    expect(allRes.vldl?.value).toBeNull();
    // Non-HDL is still valid: TC - HDL = 300 - 25 = 275
    expect(allRes.nonHdl?.value).toBe(275);
  });

  // ==========================================================================
  // Domain 3: Differential White Blood Cell Fuzzing
  // ==========================================================================

  test('T5.3.1: Differential over-count (> 100%, sum = 115.0%) is rejected with explicit balance error', () => {
    // 70 + 25 + 10 + 7 + 3 = 115.0%
    const res = validateDifferentialSum(70, 25, 10, 7, 3);
    expect(res.sum).toBe(115.0);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Differential sum must equal 100%');
    expect(res.error).toContain('115%');
  });

  test('T5.3.2: Differential under-count (< 100%, sum = 80.0%) is rejected with explicit balance error', () => {
    // 50 + 20 + 5 + 3 + 2 = 80.0%
    const res = validateDifferentialSum(50, 20, 5, 3, 2);
    expect(res.sum).toBe(80.0);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Differential sum must equal 100%');
    expect(res.error).toContain('80%');
  });

  test('T5.3.3: Total zero differential (all 0.0%) is rejected with sum = 0.0%', () => {
    const res = validateDifferentialSum(0, 0, 0, 0, 0);
    expect(res.sum).toBe(0.0);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('currently 0%');
  });

  test('T5.3.4: Decimal precision jitter (99.999% and 100.001%) is accepted via 1-decimal rounding tolerance', () => {
    // Sum = 55.444 + 30.555 + 8.0 + 4.0 + 2.0 = 99.999%
    const jitterUnder = validateDifferentialSum(55.444, 30.555, 8.0, 4.0, 2.0);
    expect(jitterUnder.sum).toBe(100.0);
    expect(jitterUnder.isValid).toBe(true);
    expect(jitterUnder.error).toBeUndefined();

    // Sum = 55.445 + 30.556 + 8.0 + 4.0 + 2.0 = 100.001%
    const jitterOver = validateDifferentialSum(55.445, 30.556, 8.0, 4.0, 2.0);
    expect(jitterOver.sum).toBe(100.0);
    expect(jitterOver.isValid).toBe(true);
    expect(jitterOver.error).toBeUndefined();
  });

  test('T5.3.5: Negative differential percentages fuzzing is strictly rejected', () => {
    // Neutrophils = -20%, Lymphocytes = 120% (mathematical sum = 100%, but biologically impossible)
    const res = validateDifferentialSum(-20, 120, 0, 0, 0);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('cannot be negative');
  });

  // ==========================================================================
  // Domain 4: Delta Check Edge Cases & Numerical Stability
  // ==========================================================================

  test('T5.4.1: Delta check when prior value is 0 returns WARNING with division-by-zero protection', () => {
    const deltaRes = evaluateDeltaCheck('HGB', 14.5, 0);
    expect(deltaRes.hasPrevious).toBe(true);
    expect(deltaRes.isBreached).toBe(true);
    expect(deltaRes.badgeLevel).toBe('WARNING');
    expect(deltaRes.message).toContain('New appearance from zero baseline - clinical review recommended');
  });

  test('T5.4.2: Delta check when prior value is negative evaluates safely with non-negative delta percentage', () => {
    const deltaRes = evaluateDeltaCheck('HGB', 14.0, -10.0);
    expect(deltaRes.hasPrevious).toBe(true);
    // Delta percent must be positive: |14 - (-10)| / |-10| = 24 / 10 = 240%
    expect(deltaRes.deltaPercent).toBe(240);
    expect(deltaRes.badgeLevel).toBe('CRITICAL');
  });

  test('T5.4.3: Delta check when prior value is undefined or null returns hasPrevious: false without throwing', () => {
    const deltaUndef = evaluateDeltaCheck('CREAT', 1.2, undefined as any);
    expect(deltaUndef.hasPrevious).toBe(false);
    expect(deltaUndef.isBreached).toBe(false);
    expect(deltaUndef.badgeLevel).toBe('NORMAL');
    expect(deltaUndef.message).toContain('No previous record found');

    const deltaNull = evaluateDeltaCheck('CREAT', 1.2, null as any);
    expect(deltaNull.hasPrevious).toBe(false);
    expect(deltaNull.isBreached).toBe(false);
  });

  test('T5.4.4: Identical current and prior values (0% change) returns unbreached NORMAL with unchanged direction', () => {
    const deltaRes = evaluateDeltaCheck('POTASSIUM', 4.2, 4.2);
    expect(deltaRes.hasPrevious).toBe(true);
    expect(deltaRes.deltaPercent).toBe(0);
    expect(deltaRes.isBreached).toBe(false);
    expect(deltaRes.badgeLevel).toBe('NORMAL');
    expect(deltaRes.direction).toBe('unchanged');
    expect(deltaRes.message).toContain('0% is within safe limit');
  });

  test('T5.4.5: Batch delta comparator handles corrupted history (empty tests, missing codes) without crashing', () => {
    const currentSample = {
      id: 's-curr-1',
      tests: [
        { testId: 't-hgb', code: 'HGB', resultValue: '13.5' },
        { testId: 't-corrupt', code: undefined, resultValue: null },
      ]
    };

    const historicalSamples = [
      {
        id: 's-hist-1',
        createdAt: '2026-08-01T10:00:00Z',
        tests: [] // Empty tests array
      },
      {
        id: 's-hist-2',
        createdAt: '2026-07-15T10:00:00Z',
        tests: [
          { testId: 't-hgb', code: 'HGB', resultValue: '14.0' }
        ]
      }
    ];

    const results = compareSampleWithHistory(currentSample, historicalSamples);
    expect(results['HGB']).toBeDefined();
    expect(results['HGB'].hasPrevious).toBe(true);
    expect(results['HGB'].previousValue).toBe(14.0);
    expect(results['HGB'].currentValue).toBe(13.5);
    expect(results['HGB'].isBreached).toBe(false);
  });

  // ==========================================================================
  // Domain 5: Pre-Printed Letterhead Margin Safety Clamping
  // ==========================================================================

  test('T5.5.1: Negative millimeter margins are clamped safely to non-negative bounds (>= 0)', () => {
    expect(clampMargin(-25, 0, 100, 35)).toBe(0);
    expect(clampMargin(-100, 0, 50, 15)).toBe(0);

    const updated = updateSettings({
      topMarginMm: -45,
      bottomMarginMm: -30,
      leftMarginMm: -15,
      rightMarginMm: -15,
    });

    expect(updated.topMarginMm).toBe(0);
    expect(updated.bottomMarginMm).toBe(0);
    expect(updated.leftMarginMm).toBe(0);
    expect(updated.rightMarginMm).toBe(0);
  });

  test('T5.5.2: Overly large millimeter margins are clamped to maximum allowable physical limits', () => {
    // 350mm top margin on 297mm A4 page is clamped to 100mm
    expect(clampMargin(350, 0, 100, 35)).toBe(100);
    // 200mm side margin on 210mm A4 page is clamped to 50mm
    expect(clampMargin(200, 0, 50, 15)).toBe(50);

    const updated = updateSettings({
      topMarginMm: 350,
      bottomMarginMm: 250,
      leftMarginMm: 120,
      rightMarginMm: 120,
    });

    expect(updated.topMarginMm).toBe(100);
    expect(updated.bottomMarginMm).toBe(100);
    expect(updated.leftMarginMm).toBe(50);
    expect(updated.rightMarginMm).toBe(50);
  });

  test('T5.5.3: Non-numeric and NaN margins fallback gracefully to clinical defaults', () => {
    expect(clampMargin(NaN, 0, 100, 35)).toBe(35);
    expect(clampMargin('invalid_mm', 0, 100, 25)).toBe(25);
    expect(clampMargin(null, 0, 50, 15)).toBe(15);
    expect(clampMargin(undefined, 0, 50, 15)).toBe(15);
  });

  test('T5.5.4: Print Route HTML output generates valid clamped CSS @page margins when settings contain extreme values', async () => {
    // Inject extreme margins directly into store
    const store = getStore();
    store.settings.topMarginMm = -80 as any;
    store.settings.bottomMarginMm = 500 as any;
    store.settings.leftMarginMm = -20 as any;
    store.settings.rightMarginMm = 300 as any;

    const sample = store.samples[0];
    const req = makeRequest(`http://localhost:3000/api/samples/${sample.id}/print`);
    const res = await getPrintRoute(req, { params: { id: sample.id } });
    expect(res.status).toBe(200);

    const html = await res.text();
    // Clamped bounds: topMm (0mm), bottomMm (100mm), leftMm (0mm), rightMm (50mm)
    // CSS order: margin: top right bottom left;
    expect(html).toContain('margin: 0mm 50mm 100mm 0mm;');
  });

  // ==========================================================================
  // Domain 6: Corruption Resilience in /api/samples/[id]/results
  // ==========================================================================

  test('T5.6.1: Empty JSON object ({}) payload completes successfully without crashing or corrupting sample', async () => {
    const store = getStore();
    const targetSample = store.samples[0];

    const req = makeRequest(`http://localhost:3000/api/samples/${targetSample.id}/results`, {
      method: 'PUT',
      body: {},
    });

    const res = await putResults(req, { params: { id: targetSample.id } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe(targetSample.id);
    expect(json.tests.length).toBeGreaterThan(0);
  });

  test('T5.6.2: Payload with missing test IDs and orphan items is handled safely without throwing or mutating tests', async () => {
    const store = getStore();
    const targetSample = store.samples[0];
    const firstTest = targetSample.tests[0];
    const initialVal = firstTest.resultValue;

    const corruptPayload = {
      results: [
        { resultValue: 'Orphan value without any test ID' },
        { notes: 'Missing test identifiers completely' },
        null,
        undefined,
        {},
      ]
    };

    const req = makeRequest(`http://localhost:3000/api/samples/${targetSample.id}/results`, {
      method: 'PUT',
      body: corruptPayload,
    });

    const res = await putResults(req, { params: { id: targetSample.id } });
    expect(res.status).toBe(200);

    // Initial valid test value should remain untouched
    expect(firstTest.resultValue).toBe(initialVal);
  });

  test('T5.6.3: Malformed serialized string (invalid JSON syntax) returns HTTP 400 with clean error response', async () => {
    const store = getStore();
    const targetSample = store.samples[0];

    const req = makeRequest(`http://localhost:3000/api/samples/${targetSample.id}/results`, {
      method: 'PUT',
      rawBody: '{"unclosed_json: true, broken...',
    });

    const res = await putResults(req, { params: { id: targetSample.id } });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.message).toContain('Malformed serialized string');
  });

  test('T5.6.4: Heterogeneous payload with null/corrupt entries updates valid test while discarding invalid ones', async () => {
    const store = getStore();
    const targetSample = store.samples[0];
    const validTest = targetSample.tests[0];

    const mixedPayload = {
      results: [
        null,
        { nonExistentKey: 123 },
        { sampleTestId: validTest.id, resultValue: '77.5', isAbnormal: true, interpretation: 'Verified via Tier 5 Stress' },
        undefined,
        { testId: 'non-existent-test-id-999', resultValue: 'discard me' }
      ]
    };

    const req = makeRequest(`http://localhost:3000/api/samples/${targetSample.id}/results`, {
      method: 'PUT',
      body: mixedPayload,
    });

    const res = await putResults(req, { params: { id: targetSample.id } });
    expect(res.status).toBe(200);

    const json = await res.json();
    const updatedTest = json.tests.find((t: any) => t.id === validTest.id);
    expect(updatedTest.resultValue).toBe('77.5');
    expect(updatedTest.isAbnormal).toBe(true);
    expect(updatedTest.interpretation).toBe('Verified via Tier 5 Stress');
  });

});
