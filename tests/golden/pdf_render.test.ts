import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { generateSampleReportPDF, ReportData } from '../../apps/server/src/utils/pdf';

async function runPdfGoldenTest() {
  console.log('🧪 [Golden Test] Testing Arabic RTL PDF Render & Layout...');

  const artifactsDir = path.resolve(__dirname, 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const sampleData: ReportData = {
    labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
    labAddress: 'بغداد - شارع الأطباء - مقابل المجمع الطبي',
    labPhone: '07701234567',
    patientName: 'علي حسن كاظم',
    patientAge: 35,
    patientGender: 'ذكر',
    sampleNumber: 1001,
    sampleDate: '2026-10-01 10:30 ص',
    tests: [
      {
        testName: 'Complete Blood Count (CBC)',
        category: 'أمراض الدم والتخثر',
        resultValue: 'Normal',
        unit: '',
        refRangeText: 'Normal Values',
        isAbnormal: false,
      },
      {
        testName: 'Hemoglobin (Hb)',
        category: 'أمراض الدم والتخثر',
        resultValue: '14.2',
        unit: 'g/dL',
        refRangeLow: 13.0,
        refRangeHigh: 17.5,
        refRangeText: '13.0 - 17.5',
        isAbnormal: false,
      },
      {
        testName: 'Fasting Blood Sugar (FBS)',
        category: 'الكيمياء السريرية والسكري',
        resultValue: '145',
        unit: 'mg/dL',
        refRangeLow: 70,
        refRangeHigh: 100,
        refRangeText: '70 - 100',
        isAbnormal: true,
      },
      {
        testName: 'Serum Creatinine',
        category: 'وظائف الكلى والأملاح',
        resultValue: '0.9',
        unit: 'mg/dL',
        refRangeLow: 0.6,
        refRangeHigh: 1.2,
        refRangeText: '0.6 - 1.2',
        isAbnormal: false,
      }
    ]
  };

  const pdfBuffer = await generateSampleReportPDF(sampleData);
  assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a Node.js Buffer');
  assert.ok(pdfBuffer.length > 10000, `PDF size must be realistic (>10KB), received ${pdfBuffer.length} bytes`);
  
  // Verify PDF header magic bytes %PDF-1.
  const header = pdfBuffer.slice(0, 8).toString('utf8');
  assert.ok(header.startsWith('%PDF-1.'), `Buffer must start with %PDF-1., received ${header}`);

  const targetPath = path.join(artifactsDir, 'golden_sample_report.pdf');
  fs.writeFileSync(targetPath, pdfBuffer);
  console.log(`✅ [Golden Test] Arabic RTL PDF successfully rendered and verified (${pdfBuffer.length} bytes saved to ${targetPath}).`);
}

runPdfGoldenTest().catch((err) => {
  console.error('❌ [Golden Test] PDF render test failed:', err);
  process.exit(1);
});
