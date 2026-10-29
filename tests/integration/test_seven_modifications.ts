/**
 * Comprehensive Automated Verification Suite for 7 Clinical & Technical Modifications
 * Tests all 7 requirements with real modules, pure domain engines, and print engines.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import {
  formatClinicalAge,
  formatClinicalAgeArabic,
  normalizeAgeToBirthDate,
  classifyResultRange,
  formatRangeLineBidi,
  formatStructuredRangesText,
} from '../../packages/domain/src/index';
import { getQualitativeOptionsForTest } from '../../apps/web/src/lib/qualitativeResultOptions';
import { renderPrintBodyPages } from '../../apps/web/src/app/api/samples/[id]/print/PrintBody';

console.log('======================================================================');
console.log('   LABRYO LIMS - 7 CLINICAL MODIFICATIONS VERIFICATION SUITE         ');
console.log('======================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

async function main() {
  // -----------------------------------------------------------------------------
  // Requirement 4: Patient Age Formatting (Months & Days)
  // -----------------------------------------------------------------------------
  console.log('Testing Requirement 4: Patient Age Months & Days Formatting...');

  await runTest('R4.1: Formats infant age in days only (English & Arabic)', () => {
    const en = formatClinicalAge({ age: 0, ageMonths: 0, ageDays: 14 });
    assert.strictEqual(en, '14 D');
    const ar = formatClinicalAgeArabic({ age: 0, ageMonths: 0, ageDays: 14 });
    assert.strictEqual(ar, '14 يوماً');
  });

  await runTest('R4.2: Formats infant age in months only (English & Arabic)', () => {
    const en = formatClinicalAge({ age: 0, ageMonths: 5, ageDays: 0 });
    assert.strictEqual(en, '5 M');
    const ar = formatClinicalAgeArabic({ age: 0, ageMonths: 5, ageDays: 0 });
    assert.strictEqual(ar, '5 أشهر');
  });

  await runTest('R4.3: Formats infant age in months and days (English & Arabic)', () => {
    const en = formatClinicalAge({ age: 0, ageMonths: 3, ageDays: 12 });
    assert.strictEqual(en, '3 M 12 D');
    const ar = formatClinicalAgeArabic({ age: 0, ageMonths: 3, ageDays: 12 });
    assert.strictEqual(ar, '3 أشهر و 12 يوم');
  });

  await runTest('R4.4: Formats toddler age in years and months', () => {
    const en = formatClinicalAge({ age: 2, ageMonths: 6, ageDays: 0 });
    assert.strictEqual(en, '2 Y 6 M');
    const ar = formatClinicalAgeArabic({ age: 2, ageMonths: 6, ageDays: 0 });
    assert.strictEqual(ar, 'سنتان و 6 أشهر');
  });

  await runTest('R4.5: Formats child age under 18 with years and months if provided', () => {
    const en = formatClinicalAge({ age: 8, ageMonths: 3, ageDays: 10 });
    assert.strictEqual(en, '8 Y 3 M');
  });

  await runTest('R4.6: Normalizes age with months and days into estimated birthDate', () => {
    const refDate = new Date('2026-10-15T12:00:00Z');
    const norm = normalizeAgeToBirthDate({ years: 0, months: 4, days: 10 }, refDate);
    assert.ok(norm.birthDate);
    assert.strictEqual(norm.birthDateEstimated, true);
    const reCalculated = formatClinicalAge({ birthDate: norm.birthDate }, refDate);
    assert.ok(reCalculated.includes('4 M'));
  });

  // -----------------------------------------------------------------------------
  // Requirement 5: Custom Category & Patient State Sensing + Bidi Isolation
  // -----------------------------------------------------------------------------
  console.log('\nTesting Requirement 5: Custom Category Sensing & Bidi Isolation...');

  await runTest('R5.1: Senses high value for a single custom category (e.g. طبيعي: 70 - 140)', () => {
    const test = {
      name: 'Random Blood Sugar (RBS)',
      referenceRanges: [
        { id: 'r1', label: 'طبيعي', min: 70, max: 140, sex: 'any' },
      ],
    };

    const highEval = classifyResultRange(200, test, { gender: 'MALE', age: 35 });
    assert.strictEqual(highEval.status, 'HIGH');
    assert.strictEqual(highEval.matchedCategoryLabel, 'طبيعي');
    assert.strictEqual(highEval.patientStateSummary, 'مرتفع عن (طبيعي)');

    const normalEval = classifyResultRange(110, test, { gender: 'MALE', age: 35 });
    assert.strictEqual(normalEval.status, 'NORMAL');
    assert.strictEqual(normalEval.matchedCategoryLabel, 'طبيعي');
    assert.strictEqual(normalEval.patientStateSummary, 'ضمن (طبيعي)');

    const lowEval = classifyResultRange(55, test, { gender: 'MALE', age: 35 });
    assert.strictEqual(lowEval.status, 'LOW');
    assert.strictEqual(lowEval.matchedCategoryLabel, 'طبيعي');
    assert.strictEqual(lowEval.patientStateSummary, 'منخفض عن (طبيعي)');
  });

  await runTest('R5.2: Senses multi-stage diagnostic brackets (Normal / Prediabetes / Diabetes)', () => {
    const test = {
      name: 'Fasting Blood Sugar (FBS)',
      referenceRanges: [
        { id: 'r1', label: 'طبيعي', min: 70, max: 99, sex: 'any' },
        { id: 'r2', label: 'ما قبل السكري', min: 100, max: 125, sex: 'any' },
        { id: 'r3', label: 'سكري', min: 126, max: 500, sex: 'any' },
      ],
    };

    const preEval = classifyResultRange(112, test, { gender: 'FEMALE', age: 40 });
    assert.strictEqual(preEval.status, 'HIGH');
    assert.strictEqual(preEval.matchedCategoryLabel, 'ما قبل السكري');
    assert.strictEqual(preEval.patientStateSummary, 'ما قبل السكري');

    const diabEval = classifyResultRange(220, test, { gender: 'FEMALE', age: 40 });
    assert.strictEqual(diabEval.status, 'HIGH');
    assert.strictEqual(diabEval.matchedCategoryLabel, 'سكري');
    assert.strictEqual(diabEval.patientStateSummary, 'سكري');
  });

  await runTest('R5.3: Parses legacy range bounds typed inside label/text', () => {
    const test = {
      name: 'Serum Uric Acid',
      referenceRanges: [
        { id: 'r1', label: 'طبيعي : 3.5 - 7.2', sex: 'any' },
      ],
    };
    const res = classifyResultRange(8.5, test, { gender: 'MALE', age: 40 });
    assert.strictEqual(res.status, 'HIGH');
    assert.strictEqual(res.lowBound, 3.5);
    assert.strictEqual(res.highBound, 7.2);
  });

  await runTest('R5.4: Bidi isolation prevents reversal of Arabic labels with numbers', () => {
    const bidiLine = formatRangeLineBidi('طبيعي', '70 - 140');
    assert.ok(bidiLine.includes('\u206670 - 140\u2069'), 'Range must be wrapped in Left-to-Right isolate');
    assert.ok(bidiLine.startsWith('طبيعي:'));
  });

  // -----------------------------------------------------------------------------
  // Requirement 2: Qualitative Results as Options (Engine)
  // -----------------------------------------------------------------------------
  console.log('\nTesting Requirement 2: Qualitative Test Options Engine...');

  await runTest('R2.1: Identifies blood group tests and returns 8 ABO/Rh options', () => {
    const bgOpts = getQualitativeOptionsForTest({ code: 'ABO', name: 'Blood Group & Rh' });
    assert.ok(bgOpts && bgOpts.length === 8);
    assert.ok(bgOpts.includes('O Positive (O+)'));
    assert.ok(bgOpts.includes('AB Negative (AB-)'));
  });

  await runTest('R2.2: Identifies viral serology tests and returns Non-Reactive / Reactive options', () => {
    const hcvOpts = getQualitativeOptionsForTest({ code: 'HCV', name: 'Hepatitis C Virus Ab', refRangeText: 'Non-Reactive' });
    assert.ok(hcvOpts && hcvOpts.length >= 2);
    assert.ok(hcvOpts.includes('Non-Reactive'));
    assert.ok(hcvOpts.includes('Reactive'));
  });

  await runTest('R2.3: Identifies agglutination titer tests and returns Widal/Brucella titer options', () => {
    const widalOpts = getQualitativeOptionsForTest({ code: 'WIDAL', name: 'Widal Agglutination Test' });
    assert.ok(widalOpts && widalOpts.length >= 4);
    assert.ok(widalOpts.includes('Positive (1:160)'));
    assert.ok(widalOpts.includes('Negative'));
  });

  await runTest('R2.4: Returns null for numeric quantitative tests (e.g. Glucose, Creatinine)', () => {
    const gluOpts = getQualitativeOptionsForTest({ code: 'GLU', name: 'Fasting Blood Glucose', refRangeLow: 70, refRangeHigh: 110 });
    assert.strictEqual(gluOpts, null);
  });

  // -----------------------------------------------------------------------------
  // Requirement 1: Multi-Page A4 Pagination for Large Test Counts
  // -----------------------------------------------------------------------------
  console.log('\nTesting Requirement 1: Multi-Page A4 Pagination...');

  await runTest('R1.1: Splits large test counts into multiple self-contained A4 pages', () => {
    // Create sample with 28 general tests
    const tests: any[] = [];
    for (let i = 1; i <= 28; i++) {
      tests.push({
        testId: `t-${i}`,
        test: {
          id: `t-${i}`,
          code: `TEST_${i}`,
          name: `Clinical Investigation Number ${i}`,
          category: i <= 14 ? 'Clinical Chemistry' : 'Hematology',
          refRangeLow: 10,
          refRangeHigh: 50,
          unit: 'mg/dL',
        },
        resultValue: `${20 + i}`,
        status: 'Normal',
        unit: 'mg/dL',
      });
    }

    const sample = {
      id: 's-large',
      sampleNumber: '99001',
      createdAt: new Date().toISOString(),
      patient: { id: 'p-1', name: 'Zaid Ali', age: 38, gender: 'MALE' },
      doctor: { id: 'd-1', name: 'Dr. Diagnostic' },
      tests,
    };

    const store = {
      settings: {
        reportTemplate: 'ROYAL_CLASSIC',
        tableRowSpacing: 'COMFORTABLE',
        primaryColor: '#0284c7',
      },
      catalog: tests.map(t => t.test),
    };

    const renderedPages = renderPrintBodyPages({
      sample: sample as any,
      store: store as any,
      settings: store.settings,
      sectionParam: 'all',
      template: 'ROYAL_CLASSIC',
      primaryCol: '#0284c7',
      textColor: '#0f172a',
      borderColor: '#cbd5e1',
      headerBgColor: '#0284c7',
      headerTextColor: '#ffffff',
      testNameFontSize: 13,
      resultValueFontSize: 13,
      unitFontSize: 11,
      refRangeFontSize: 11,
      specialFormFontSize: 13,
      resultValueFontWeight: '800',
      customCellPadding: '8px 10px',
      tableRowBorders: true,
      tableZebraStriping: true,
      visibleColumns: [
        { id: 'testName', label: 'INVESTIGATION', visible: true, align: 'left' },
        { id: 'result', label: 'RESULT', visible: true, align: 'left' },
        { id: 'unit', label: 'UNIT', visible: true, align: 'left' },
        { id: 'refRange', label: 'REFERENCE RANGE', visible: true, align: 'left' },
      ],
      groupByCategory: true,
      containerClass: 'report-card',
      renderWatermark: () => '',
      renderFooter: () => '<div class="footer">Footer</div>',
      safePatientName: 'Zaid Ali',
      safeDoctorName: 'Dr. Diagnostic',
      safeLabName: 'Labryo Central Lab',
      safeFooter: 'Electronically verified',
      clinicalAge: '38 Years',
      patient: sample.patient as any,
      doctor: sample.doctor as any,
      headerParams: {
        settings: store.settings,
        safeLabName: 'Labryo Central Lab',
        safeLabSubtitle: 'Pathology Diagnostics',
        safeAddress: 'Medical City',
        safePhone: '0770000000',
        safeDocName: 'Dr. Diagnostic',
        safeDocTitle: 'Consultant',
        safeLicense: 'MOH-123',
        isPreprinted: false,
        showLabName: true,
        labNameFontSize: 22,
        labNameColor: '#0284c7',
        labNameAlignment: 'RIGHT',
        labNameStyle: 'DEFAULT',
        showLabSubtitle: true,
        showContactInfo: true,
        showDoctorInfo: true,
        qrEnabled: false,
        qrPosition: 'HEADER',
        template: 'ROYAL_CLASSIC',
        primaryCol: '#0284c7',
        verifyUrl: 'http://localhost/verify',
      },
      patientBoxParams: {
        showPatientBox: true,
        safePatientName: 'Zaid Ali',
        safeDoctorName: 'Dr. Diagnostic',
        clinicalAge: '38 Years',
        gender: 'MALE',
        sampleNumber: '99001',
        primaryCol: '#0284c7',
        createdAt: sample.createdAt,
        settings: store.settings,
      },
    });

    // Verify multiple pages are generated
    assert.ok(renderedPages.length >= 2, `Expected at least 2 pages for 28 tests, got ${renderedPages.length}`);

    // Verify each page contains the report card container
    renderedPages.forEach((pageHtml, idx) => {
      assert.ok(pageHtml.includes('report-card'), `Page ${idx + 1} must include .report-card`);
      if (idx > 0) {
        assert.ok(pageHtml.includes('page-break'), `Subsequent page ${idx + 1} must have .page-break`);
      }
    });

    // Verify page counter badge is present
    const combined = renderedPages.join('\n');
    assert.ok(combined.includes('Page 1 of') || combined.includes('صفحة 1 من'), 'Page pagination counter must be displayed');
  });

  // -----------------------------------------------------------------------------
  // Requirement 3: Ready Forms Font Size Control
  // -----------------------------------------------------------------------------
  console.log('\nTesting Requirement 3: Ready-Made Forms Font Size Control...');

  await runTest('R3.1: Applies specialFormFontSize dynamically to GUE/Urine and CBC templates', () => {
    const gueSample = {
      id: 's-gue',
      sampleNumber: '77001',
      createdAt: new Date().toISOString(),
      patient: { id: 'p-1', name: 'Sara', age: 25, gender: 'FEMALE' },
      doctor: { id: 'd-1', name: 'Dr. Specialist' },
      tests: [
        {
          testId: 't-gue',
          test: { id: 't-gue', code: 'GUE', name: 'General Urine Examination (GUE)', category: 'Urine' },
          resultValue: JSON.stringify({
            color: 'Pale Yellow',
            aspect: 'Clear',
            reaction: 'Acidic',
            spGravity: '1.020',
            protein: 'Nil',
            sugar: 'Nil',
            pusCells: '1 - 2',
            rbc: '0 - 1',
          }),
        },
      ],
    };

    const store = {
      settings: { reportTemplate: 'ROYAL_CLASSIC' },
      catalog: gueSample.tests.map(t => t.test),
    };

    const pagesWith16px = renderPrintBodyPages({
      sample: gueSample as any,
      store: store as any,
      settings: store.settings,
      sectionParam: 'all',
      template: 'ROYAL_CLASSIC',
      primaryCol: '#0284c7',
      textColor: '#0f172a',
      borderColor: '#cbd5e1',
      headerBgColor: '#0284c7',
      headerTextColor: '#ffffff',
      testNameFontSize: 13,
      resultValueFontSize: 13,
      unitFontSize: 11,
      refRangeFontSize: 11,
      specialFormFontSize: 16, // Enlarge font size to 16px!
      resultValueFontWeight: '800',
      customCellPadding: '8px 10px',
      tableRowBorders: true,
      tableZebraStriping: true,
      visibleColumns: [
        { id: 'testName', label: 'INVESTIGATION', visible: true, align: 'left' },
        { id: 'result', label: 'RESULT', visible: true, align: 'left' },
        { id: 'unit', label: 'UNIT', visible: true, align: 'left' },
        { id: 'refRange', label: 'REFERENCE RANGE', visible: true, align: 'left' },
      ],
      groupByCategory: false,
      containerClass: 'report-card',
      renderWatermark: () => '',
      renderFooter: () => '',
      safePatientName: 'Sara',
      safeDoctorName: 'Dr. Specialist',
      safeLabName: 'Labryo',
      safeFooter: '',
      clinicalAge: '25 Years',
      patient: gueSample.patient as any,
      doctor: gueSample.doctor as any,
      headerParams: {
        settings: store.settings,
        safeLabName: 'Labryo',
        safeLabSubtitle: 'Pathology Diagnostics',
        safeAddress: 'Medical City',
        safePhone: '0770000000',
        safeDocName: 'Dr. Specialist',
        safeDocTitle: 'Consultant',
        safeLicense: 'MOH-123',
        isPreprinted: false,
        showLabName: true,
        labNameFontSize: 22,
        labNameColor: '#0284c7',
        labNameAlignment: 'RIGHT',
        labNameStyle: 'DEFAULT',
        showLabSubtitle: true,
        showContactInfo: true,
        showDoctorInfo: true,
        qrEnabled: false,
        qrPosition: 'HEADER',
        template: 'ROYAL_CLASSIC',
        primaryCol: '#0284c7',
        verifyUrl: 'http://localhost/verify',
      },
      patientBoxParams: {
        showPatientBox: true,
        safePatientName: 'Sara',
        safeDoctorName: 'Dr. Specialist',
        clinicalAge: '25 Years',
        gender: 'FEMALE',
        sampleNumber: '77001',
        primaryCol: '#0284c7',
        createdAt: gueSample.createdAt,
        settings: store.settings,
      },
    });

    const gueHtml = pagesWith16px.join('\n');
    assert.ok(gueHtml.includes('font-size: 16px') || gueHtml.includes('font-size: 16.5px') || gueHtml.includes('font-size: 17px'),
      'GUE form elements must scale up to the configured specialFormFontSize (16px)');
  });

  // -----------------------------------------------------------------------------
  // Requirement 6: Blank Form Printing with Adopted Lab Header & Template
  // -----------------------------------------------------------------------------
  console.log('\nTesting Requirement 6: Blank Form Printing with Adopted Template...');

  await runTest('R6.1: Blank form route renders with adopted lab template, header, and official table', async () => {
    const { GET } = await import('../../apps/web/src/app/api/templates/blank/print/route');
    const req = {
      url: 'http://localhost:3000/api/templates/blank/print?mode=blank&template=ROYAL_CLASSIC',
    } as any;

    const res = await GET(req);
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('template-royal_classic'), 'Blank form must contain adopted template class');
    assert.ok(html.includes('report-card'), 'Blank form must be wrapped in .report-card container');
    assert.ok(html.includes('INVESTIGATION / TEST NAME'), 'Blank form must contain official table columns');
    assert.ok(html.includes('table-header'), 'Blank form table must use adopted table header styling');
    assert.ok(html.includes('report-footer-pinned'), 'Blank form must contain official lab footer');
  });

  // -----------------------------------------------------------------------------
  // Requirement 7: Auto-Save on Print Report Without Warning Toast
  // -----------------------------------------------------------------------------
  console.log('\nTesting Requirement 7: Auto-Save on Print Report Logic...');

  await runTest('R7.1: UnifiedActionBar allows printing immediately and auto-saves silently', () => {
    const actionPath = 'apps/web/src/widgets/unified-workspace/ui/UnifiedActionBar.tsx';
    const content = fs.readFileSync(actionPath, 'utf8');

    // Verify canPrint condition allows printing when canSave is true even if savedSample.id is not yet set
    assert.ok(content.includes('const canPrint = (Boolean(savedSample?.id) || canSave) && !isProcessing;'),
      'canPrint must allow printing when patient and tests are entered without requiring manual pre-save');

    // Verify warning toast is removed from handlePrint
    assert.ok(!content.includes("toast.warning('Please save the order before printing report')"),
      'Warning toast about unsaved order must be removed from handlePrint');

    // Verify handlePrint calls handleSave automatically
    assert.ok(content.includes('target = await handleSave();') || content.includes('await handleSave()'),
      'handlePrint must auto-save the patient/order silently before printing');

    // Verify result sync before printing if savedSample exists and has updated results
    assert.ok(content.includes('/api/samples/${target.id}/results') || content.includes('/api/samples/${savedSample.id}/results') || content.includes('/results'),
      'handlePrint must sync latest entered test results before opening print preview');
  });

  console.log('\n======================================================================');
  console.log(`   ALL TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests} tests)`);
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\nTest Suite Execution Failed:', err);
  process.exit(1);
});
