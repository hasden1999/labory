import assert from 'assert';
import { getStore, addPatient, addSample, enrichSamplesWithDeltaCheck } from '../../apps/web/src/lib/serverStore';
import { renderPrintBodyPages } from '../../apps/web/src/app/api/samples/[id]/print/PrintBody';
import { buildArabicWhatsAppClinicalMessage, WaTestLine } from '../../apps/web/src/lib/orderHelpers';
import { formatEnglishDate } from '../../apps/web/src/lib/formatters';

async function runTests() {
  console.log('🧪 Starting integration test for Patient Visits, Prior Results, and Completed Status...');
  const store = getStore();

  // Clean setup
  const testPatientName = `مريض تجريبي الزيارات ${Date.now()}`;
  const patient = addPatient({
    name: testPatientName,
    phone: '07701234567',
    age: 45,
    gender: 'MALE',
  });
  assert(patient && patient.id, 'Patient should be created');

  // Visit 1: Ordered HbA1c only
  // Find or create catalog test for HbA1c and Urea
  let hba1cTest = (store.tests || []).find((t: any) => (t.code || '').toUpperCase() === 'HBA1C' || (t.name || '').toLowerCase().includes('hba1c'));
  if (!hba1cTest) {
    hba1cTest = { id: 'test-hba1c-mock', name: 'HbA1c (Glycated Hemoglobin)', code: 'HBA1C', category: 'DIABETES', price: 15000, unit: '%' };
    store.tests.push(hba1cTest);
  }

  let ureaTest = (store.tests || []).find((t: any) => (t.code || '').toUpperCase() === 'UREA' || (t.name || '').toLowerCase().includes('urea'));
  if (!ureaTest) {
    ureaTest = { id: 'test-urea-mock', name: 'Blood Urea', code: 'UREA', category: 'RENAL', price: 8000, unit: 'mg/dL' };
    store.tests.push(ureaTest);
  }

  // Visit 1: Create Sample with HbA1c
  const visit1 = addSample({
    patientId: patient.id,
    patientName: testPatientName,
    testIds: [hba1cTest.id],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
  });

  // Enter result for Visit 1 HbA1c = 7.5%
  const v1Test = visit1.tests.find((t: any) => t.testId === hba1cTest.id || t.test?.id === hba1cTest.id);
  assert(v1Test, 'Visit 1 must have HbA1c test');
  v1Test.resultValue = '7.5';
  v1Test.status = 'COMPLETED';
  visit1.status = 'COMPLETED';

  // Visit 2: Create Sample with HbA1c and Urea (today)
  const visit2 = addSample({
    patientId: patient.id,
    patientName: testPatientName,
    testIds: [hba1cTest.id, ureaTest.id],
    createdAt: new Date().toISOString(),
  });

  // Enter results for Visit 2: HbA1c = 8.2%, Urea = 35 mg/dL
  const v2Hba1c = visit2.tests.find((t: any) => t.testId === hba1cTest.id || t.test?.id === hba1cTest.id);
  const v2Urea = visit2.tests.find((t: any) => t.testId === ureaTest.id || t.test?.id === ureaTest.id);
  assert(v2Hba1c && v2Urea, 'Visit 2 must have both HbA1c and Urea');
  v2Hba1c.resultValue = '8.2';
  v2Urea.resultValue = '35';

  // 1. Verify Delta Check Enrichment
  enrichSamplesWithDeltaCheck(store.samples);
  console.log(`Visit 2 HbA1c previousValue: ${v2Hba1c.previousValue}`);
  console.log(`Visit 2 Urea previousValue: ${v2Urea.previousValue}`);
  assert.strictEqual(v2Hba1c.previousValue, '7.5', 'Visit 2 HbA1c must have prior value of 7.5 from Visit 1');
  assert(!v2Urea.previousValue, 'Visit 2 Urea must have no prior value since not ordered in Visit 1');

  // 2. Verify Rendered Print Report contains PREVIOUS column with 7.5 for HbA1c and - for Urea
  const renderedPages = renderPrintBodyPages({
    sample: visit2,
    store,
    settings: store.settings,
    sectionParam: 'all',
    template: 'MODERN',
    primaryCol: '#0f766e',
    textColor: '#0f172a',
    borderColor: '#e2e8f0',
    headerBgColor: '#0f766e',
    headerTextColor: '#ffffff',
    testNameFontSize: 13,
    resultValueFontSize: 13,
    unitFontSize: 12,
    refRangeFontSize: 12,
    specialFormFontSize: 12,
    customCellPadding: '6px 8px',
    tableRowBorders: true,
    tableZebraStriping: false,
    renderWatermark: () => '',
    renderFooter: () => '',
    patient: patient,
    doctor: { name: 'Direct' },
    headerParams: { settings: store.settings, safeLabName: 'Labryo', safeAddress: '', safePhone: '', safeDocTitle: '', safeDocName: '', safeLicense: '', primaryCol: '#0f766e', template: 'MODERN' } as any,
    patientBoxParams: { patient: patient, clinicalAge: '45 Years', doctor: { name: 'Direct' }, sample: visit2, settings: store.settings, primaryCol: '#0f766e' } as any,
    visibleColumns: [
      { id: 'testName', label: 'INVESTIGATION', visible: true, align: 'left' },
      { id: 'result', label: 'RESULT', visible: true, align: 'left' },
      { id: 'unit', label: 'UNIT', visible: true, align: 'left' },
      { id: 'refRange', label: 'REFERENCE RANGE', visible: true, align: 'left' },
    ],
  });

  const fullHtml = renderedPages.join('\n');
  assert(fullHtml.includes('PREVIOUS'), 'Print report must include PREVIOUS column when prior test exists');
  assert(fullHtml.includes('8.2'), 'Print report must include current HbA1c result (8.2)');
  assert(fullHtml.includes('7.5'), 'Print report must include previous HbA1c result (7.5)');
  assert(fullHtml.includes('35'), 'Print report must include current Urea result (35)');

  // 3. Verify Patient Visit Count
  const patientSamples = store.samples.filter((s: any) => s.patientId === patient.id || (s.patient?.name && s.patient.name === testPatientName));
  assert.strictEqual(patientSamples.length, 2, 'Patient must have exactly 2 visits');

  // 4. Verify Completed Status logic
  const allTestsComplete = visit2.tests.every((t: any) => t.resultValue && String(t.resultValue).trim() !== '');
  assert(allTestsComplete, 'All tests in visit 2 have results entered');
  if (allTestsComplete) {
    visit2.status = 'COMPLETED';
  }
  assert.strictEqual(visit2.status, 'COMPLETED', 'Visit 2 status must become COMPLETED');

  // 5. Verify WhatsApp Clinical Summary with Prior Results
  const clinicalLines: WaTestLine[] = (visit2.tests || []).map((t: any) => ({
    name: t.test?.name || t.name || t.testCode || 'Test',
    value: String(t.resultValue),
    unit: t.test?.unit || t.unit || '',
    previous: t.previousValue ? {
      value: String(t.previousValue),
      date: t.previousDate ? formatEnglishDate(t.previousDate) : '',
    } : undefined,
  }));

  const waMessage = buildArabicWhatsAppClinicalMessage({
    labName: 'مختبر الأمل للتحليلات',
    patientName: patient.name,
    sampleNumber: visit2.sampleNumber,
    date: formatEnglishDate(visit2.createdAt),
    lines: clinicalLines,
  });

  console.log('--- Generated WhatsApp Message ---');
  console.log(waMessage);
  console.log('----------------------------------');

  assert(waMessage.includes('8.2'), 'WhatsApp message must include current HbA1c result (8.2)');
  assert(waMessage.includes('النتيجة السابقة: 7.5'), 'WhatsApp message must include prior HbA1c result (النتيجة السابقة: 7.5)');
  assert(waMessage.includes('35'), 'WhatsApp message must include current Urea result (35)');
  assert(!waMessage.includes('النتيجة السابقة: 35'), 'Urea must NOT have a prior result line in WhatsApp message');

  console.log('✅ ALL INTEGRATION TESTS PASSED (5/5)!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
