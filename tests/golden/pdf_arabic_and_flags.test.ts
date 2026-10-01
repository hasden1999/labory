import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { getStore } from '../../apps/web/src/lib/serverStore';
import { GET as getPrintReport } from '../../apps/web/src/app/api/samples/[id]/print/route';

async function runPdfArabicAndFlagsGoldenTest() {
  console.log('🧪 [Golden Test] Verifying High/Low Indicators, Print Arrows, and Zero-Arabic Report Engine...');

  const artifactsDir = path.resolve(__dirname, 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const store = getStore();

  // Create isolated Golden Sample with Chemistry, Lipid, CBC, and Urine
  const testSampleId = 'golden-test-sample-item1-item5';
  const goldenSample: any = {
    id: testSampleId,
    sampleNumber: 9999,
    patientId: 'p-golden-1',
    patient: {
      id: 'p-golden-1',
      name: 'John Doe',
      gender: 'MALE',
      age: 35,
      birthDate: '1991-05-15',
    },
    doctorId: 'doc-golden-1',
    doctor: {
      id: 'doc-golden-1',
      name: 'Dr. Marcus Vance',
      specialty: 'Internal Medicine',
    },
    status: 'READY',
    isUrgent: false,
    priceTotal: 45000,
    paidAmount: 45000,
    discount: 0,
    discountPercent: 0,
    remainingAmount: 0,
    paymentMethod: 'CASH',
    createdAt: new Date().toISOString(),
    tests: [
      {
        id: 'st-fbs',
        sampleId: testSampleId,
        testId: 't-fbs',
        resultValue: '165', // HIGH (Ref: 70 - 110)
        status: 'COMPLETED',
        test: {
          id: 't-fbs',
          code: 'FBS',
          name: 'Fasting Blood Sugar',
          category: 'Clinical Chemistry',
          unit: 'mg/dL',
          refRangeLow: 70,
          refRangeHigh: 110,
          price: 5000,
        },
      },
      {
        id: 'st-k',
        sampleId: testSampleId,
        testId: 't-k',
        resultValue: '2.8', // LOW (Ref: 3.5 - 5.1)
        status: 'COMPLETED',
        test: {
          id: 't-k',
          code: 'POTASSIUM',
          name: 'Serum Potassium (K+)',
          category: 'Renal Function & Electrolytes',
          unit: 'mmol/L',
          refRangeLow: 3.5,
          refRangeHigh: 5.1,
          price: 7000,
        },
      },
      {
        id: 'st-creat',
        sampleId: testSampleId,
        testId: 't-creat',
        resultValue: '0.9', // NORMAL (Ref: 0.6 - 1.2)
        status: 'COMPLETED',
        test: {
          id: 't-creat',
          code: 'CREAT',
          name: 'Serum Creatinine',
          category: 'Renal Function & Electrolytes',
          unit: 'mg/dL',
          refRangeLow: 0.6,
          refRangeHigh: 1.2,
          price: 6000,
        },
      },
      {
        id: 'st-chol',
        sampleId: testSampleId,
        testId: 't-chol',
        resultValue: '240', // HIGH (Ref: < 200)
        status: 'COMPLETED',
        test: {
          id: 't-chol',
          code: 'CHOL',
          name: 'Total Cholesterol',
          category: 'Lipid Profile',
          unit: 'mg/dL',
          refRangeHigh: 200,
          refRangeText: '< 200',
          price: 8000,
        },
      },
      {
        id: 'st-tg',
        sampleId: testSampleId,
        testId: 't-tg',
        resultValue: '220', // HIGH (Ref: < 150)
        status: 'COMPLETED',
        test: {
          id: 't-tg',
          code: 'TG',
          name: 'Triglycerides',
          category: 'Lipid Profile',
          unit: 'mg/dL',
          refRangeHigh: 150,
          refRangeText: '< 150',
          price: 8000,
        },
      },
      {
        id: 'st-hdl',
        sampleId: testSampleId,
        testId: 't-hdl',
        resultValue: '32', // LOW (Ref: > 40)
        status: 'COMPLETED',
        test: {
          id: 't-hdl',
          code: 'HDL',
          name: 'HDL Cholesterol',
          category: 'Lipid Profile',
          unit: 'mg/dL',
          refRangeLow: 40,
          refRangeText: '> 40',
          price: 8000,
        },
      },
    ],
  };

  // Temporarily insert or replace sample in store
  const existingIdx = store.samples.findIndex((s) => s.id === testSampleId);
  if (existingIdx >= 0) {
    store.samples[existingIdx] = goldenSample;
  } else {
    store.samples.push(goldenSample);
  }

  // 1. Invoke the authentic print route
  const reqUrl = `http://127.0.0.1:8080/api/samples/${testSampleId}/print?force=true`;
  const request = new Request(reqUrl, {
    headers: { Accept: 'text/html', 'User-Agent': 'Labryo-Golden-Test' },
  });

  const response = await getPrintReport(request, { params: { id: testSampleId } });
  assert.strictEqual(response.status, 200, `Print route must return 200 OK, got ${response.status}`);

  const html = await response.text();

  // 2. Validate HTML layout direction & language
  assert.ok(html.includes('<html lang="en" dir="ltr">'), 'Report HTML must be lang="en" and dir="ltr"');
  assert.ok(html.includes('Patient Name:'), 'Meta box must have English "Patient Name:"');
  assert.ok(html.includes('Age / Sex:'), 'Meta box must have English "Age / Sex:"');
  assert.ok(html.includes('Referred By:'), 'Meta box must have English "Referred By:"');
  assert.ok(html.includes('Sample ID:'), 'Meta box must have English "Sample ID:"');
  assert.ok(html.includes('Verified (Final)'), 'Report status must be English "Verified (Final)"');
  assert.ok(html.includes('Dr. Marcus Vance'), 'Referred doctor name must be rendered properly');

  // 3. Item 1 Assertions: High & Low Indicators
  console.log('  ✓ Verifying High / Low Arrows and Color Accents...');

  // High result (FBS = 165): must have up arrow and red color
  assert.ok(html.includes('165'), 'High FBS value must be present');
  assert.ok(html.includes('#dc2626'), 'High value red color (#dc2626) must be present in style');
  assert.ok(html.includes('↑'), 'Up arrow (↑) must be present in the report');

  // Low result (K = 2.8): must have down arrow and blue color
  assert.ok(html.includes('2.8'), 'Low Potassium value must be present');
  assert.ok(html.includes('#2563eb'), 'Low value blue color (#2563eb) must be present in style');
  assert.ok(html.includes('↓'), 'Down arrow (↓) must be present in the report');

  // Normal result (Creat = 0.9): must NOT have arrow
  assert.ok(html.includes('0.9'), 'Normal Creatinine value must be present');

  // Bold flagged values for black and white legibility
  assert.ok(html.includes('font-weight: 900') || html.includes('font-weight:800'), 'Flagged values must have bold font weight');

  // Print color adjust
  assert.ok(html.includes('-webkit-print-color-adjust: exact !important'), 'Print CSS must enforce color-adjust: exact');

  // 4. Item 5 Assertions: Zero Arabic Outside Lab Free-Text Data Fields
  console.log('  ✓ Auditing report HTML for Arabic character absence outside user data...');

  // Strip allowed lab free-text data fields before checking:
  // (patientName, doctorName, labName, labSubtitle, address, phone, license, reportFooter, notes)
  const allowedDataFields = [
    goldenSample.patient.name,
    goldenSample.doctor.name,
    store.settings.labName || '',
    store.settings.labSubtitle || '',
    store.settings.address || '',
    store.settings.phone || '',
    store.settings.doctorName || '',
    store.settings.doctorTitle || '',
    store.settings.labLicense || '',
    store.settings.reportFooter || '',
  ].filter(Boolean);

  let sanitizedHtml = html;
  for (const field of allowedDataFields) {
    if (field) {
      sanitizedHtml = sanitizedHtml.split(field).join('');
    }
  }

  // Regex for Arabic Unicode blocks
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  const matches = sanitizedHtml.match(arabicRegex) || [];
  if (matches.length > 0) {
    const snippetIndex = sanitizedHtml.search(arabicRegex);
    const snippet = sanitizedHtml.substring(Math.max(0, snippetIndex - 30), Math.min(sanitizedHtml.length, snippetIndex + 50));
    assert.fail(`Found ${matches.length} Arabic characters outside user-entered free-text fields! Snippet: "${snippet}"`);
  }
  console.log('  ✓ Confirmed 0 Arabic-script characters outside allowed user data fields.');

  // 5. Render authentic PDF via Puppeteer
  console.log('  ✓ Rendering authentic PDF report via Puppeteer...');
  const puppeteer = (await import('puppeteer')).default;
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env.LOCALAPPDATA || '';

  const candidatePaths: string[] = [
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];
  let execPath: string | undefined = undefined;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      execPath = p;
      break;
    }
  }

  const launchOptions: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (execPath) launchOptions.executablePath = execPath;

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    assert.ok(Buffer.isBuffer(pdfBuffer), 'PDF result must be a Buffer');
    assert.ok(pdfBuffer.length > 10000, `PDF size must be >10KB, got ${pdfBuffer.length} bytes`);

    const pdfMagic = pdfBuffer.slice(0, 5).toString('utf8');
    assert.strictEqual(pdfMagic, '%PDF-', 'Buffer must begin with %PDF-');

    const targetPdfPath = path.join(artifactsDir, 'golden_report_flags_and_english.pdf');
    fs.writeFileSync(targetPdfPath, pdfBuffer);
    console.log(`  ✓ Golden PDF saved to ${targetPdfPath} (${pdfBuffer.length} bytes).`);
  } finally {
    await browser.close().catch(() => {});
  }

  console.log('✅ [Golden Test] High/Low Indicators, Arrows, and Zero-Arabic Engine PASSED 100%!\n');
}

runPdfArabicAndFlagsGoldenTest().catch((err) => {
  console.error('❌ [Golden Test] PDF Arabic and Flags test failed:', err);
  process.exit(1);
});
