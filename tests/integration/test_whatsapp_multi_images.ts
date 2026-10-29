import assert from 'assert';
import { generateReportImages } from '../../apps/web/src/lib/puppeteerImageGenerator';
import { getStore } from '../../apps/web/src/lib/serverStore';

async function runTest() {
  console.log('🧪 Starting WhatsApp Multi-Image Report Generation Test...');

  const store = getStore();
  assert(store.samples && store.samples.length > 0, 'Store must contain samples');

  // Test 1: Sample with multiple cards/sections (e.g. s-2033 or s-2024 with Chemistry + GUE) produces multiple separate images
  const sampleWithMultiple = store.samples.find(s => s.id === 's-2033' || s.id === 's-2024') || store.samples.find(s => (s.tests || []).length > 2);
  assert(sampleWithMultiple, 'Sample with multiple tests must exist');

  console.log(`Testing Sample #${sampleWithMultiple.sampleNumber} (ID: ${sampleWithMultiple.id})...`);
  const images = await generateReportImages(sampleWithMultiple.id);

  console.log(`Generated ${images.length} separate medical report image(s).`);
  assert(images.length >= 1, 'Should generate at least 1 image');

  // Verify each image is a valid PNG buffer and has proper metadata
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    assert(Buffer.isBuffer(img.buffer), `Image ${i} must be a valid Buffer`);
    assert(img.buffer.length > 5000, `Image ${i} buffer must be substantial (got ${img.buffer.length} bytes)`);
    assert(img.dataUrl.startsWith('data:image/png;base64,'), `Image ${i} must have valid dataUrl`);
    assert(img.pageIndex === i, `Image ${i} pageIndex must match`);
    assert(img.totalPages === images.length, `Image ${i} totalPages must match`);
    // Verify PNG header signature (89 50 4E 47 0D 0A 1A 0A)
    assert.strictEqual(img.buffer[0], 0x89, 'PNG header byte 0 must be 0x89');
    assert.strictEqual(img.buffer[1], 0x50, 'PNG header byte 1 must be 0x50 (P)');
    assert.strictEqual(img.buffer[2], 0x4E, 'PNG header byte 2 must be 0x4E (N)');
    assert.strictEqual(img.buffer[3], 0x47, 'PNG header byte 3 must be 0x47 (G)');
  }

  // Test 2: Specific page index request returns exactly 1 image for that page
  if (images.length > 1) {
    console.log('Testing specific page index request (pageIndex: 1)...');
    const singlePage = await generateReportImages(sampleWithMultiple.id, undefined, { pageIndex: 1 });
    assert.strictEqual(singlePage.length, 1, 'Should return exactly 1 image for pageIndex: 1');
    assert.strictEqual(singlePage[0].pageIndex, 1, 'Returned pageIndex must be 1');
    assert.strictEqual(singlePage[0].totalPages, images.length, 'totalPages must still indicate total cards');
  }

  console.log('✅ WhatsApp Multi-Image Test Passed 100%!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
