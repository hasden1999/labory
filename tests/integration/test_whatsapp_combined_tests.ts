import assert from 'assert';
import { generateReportImages } from '../../apps/web/src/lib/puppeteerImageGenerator';
import { getStore } from '../../apps/web/src/lib/serverStore';

async function runTest() {
  console.log('🧪 Starting HbA1c + Lipid Combined Image Test...');

  const store = getStore();
  assert(store.samples && store.samples.length > 0, 'Store must contain samples');

  // Find HbA1c test and Lipid test in catalog
  const hba1cCatalog = store.tests.find(t => /hba1c|تراكمي/i.test(t.name) || t.code === 'HBA1C');
  const cholCatalog = store.tests.find(t => /cholesterol/i.test(t.name) || t.code === 'CHOL');
  const tgCatalog = store.tests.find(t => /triglyceride/i.test(t.name) || t.code === 'TG');

  assert(hba1cCatalog, 'HbA1c test must exist in catalog');
  assert(cholCatalog, 'Cholesterol test must exist in catalog');

  // Create a synthetic sample with HbA1c + Lipid Profile in memory
  const testSampleId = 'test-hba1c-lipid-combined';
  const syntheticSample: any = {
    id: testSampleId,
    sampleNumber: 99901,
    patientId: 'p-synthetic-1',
    patient: {
      id: 'p-synthetic-1',
      name: 'فحص مجمع تجريبي',
      gender: 'MALE',
      age: 45,
      phone: '07700000000',
    },
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    tests: [
      {
        id: 'st-hba1c',
        testId: hba1cCatalog.id,
        test: hba1cCatalog,
        resultValue: '6.8',
      },
      {
        id: 'st-chol',
        testId: cholCatalog.id,
        test: cholCatalog,
        resultValue: '210',
      },
      ...(tgCatalog ? [{
        id: 'st-tg',
        testId: tgCatalog.id,
        test: tgCatalog,
        resultValue: '180',
      }] : []),
    ],
  };

  // Temporarily push to store for test
  store.samples.push(syntheticSample);

  try {
    console.log('Generating images for sample with HbA1c + Lipid tests...');
    const images = await generateReportImages(testSampleId);

    console.log(`Generated ${images.length} image(s) for HbA1c + Lipid Profile.`);

    // Critical assertion: MUST be exactly 1 image!
    assert.strictEqual(
      images.length,
      1,
      `Expected exactly 1 combined image for HbA1c + Lipid, but got ${images.length}!`
    );

    assert(Buffer.isBuffer(images[0].buffer), 'Result must have valid buffer');
    assert(images[0].dataUrl.startsWith('data:image/png;base64,'), 'Result must have valid dataUrl');
    assert.strictEqual(images[0].pageIndex, 0, 'PageIndex must be 0');
    assert.strictEqual(images[0].totalPages, 1, 'TotalPages must be 1');

    console.log('✅ HbA1c + Lipid Combined Image Test Passed 100%! Exactly 1 combined image generated.');
  } finally {
    // Clean up synthetic sample
    const idx = store.samples.findIndex(s => s.id === testSampleId);
    if (idx !== -1) {
      store.samples.splice(idx, 1);
    }
  }
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
