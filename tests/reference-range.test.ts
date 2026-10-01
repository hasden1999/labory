import assert from 'node:assert';
import { createTestInStore, updateTestInStore, getStore, addSample } from '../apps/web/src/lib/serverStore';

function run() {
  console.log('=== Item 4: Reference Range & Synchronization Tests ===');

  // Test 1: Auto-generate refRangeText on test creation when low and high are provided
  const test1 = createTestInStore({
    name: 'Serum Magnesium Test',
    price: 8000,
    refRangeLow: 1.7,
    refRangeHigh: 2.2,
    unit: 'mg/dL'
  });

  assert.strictEqual(test1.refRangeText, '1.7 - 2.2', 'refRangeText should auto-generate as "1.7 - 2.2"');
  assert.strictEqual(test1.refRangeLow, 1.7);
  assert.strictEqual(test1.refRangeHigh, 2.2);
  console.log('✔ Test 1 Passed: Auto-generated refRangeText on create');

  // Test 2: Create a sample with this test and ensure in-memory sample reference matches
  const store = getStore();
  const sample = addSample({
    patient: { id: 'p-test-ref', name: 'Test Patient Ref', age: 35, gender: 'MALE', createdAt: new Date().toISOString() },
    testIds: [test1.id],
    forceDuplicate: true
  });

  const sampleTest = sample.tests.find((st: any) => st.testId === test1.id);
  assert.ok(sampleTest, 'Sample test should exist');
  assert.strictEqual(sampleTest.refRangeText, '1.7 - 2.2', 'Sample test has initial refRangeText');

  // Test 3: Update the test's range and verify that in-memory sample is immediately updated (no stale state)
  const updatedTest = updateTestInStore(test1.id, {
    refRangeLow: 1.8,
    refRangeHigh: 2.4,
    refRangeText: '1.8 - 2.4'
  });

  assert.strictEqual(updatedTest.refRangeLow, 1.8);
  assert.strictEqual(updatedTest.refRangeHigh, 2.4);
  assert.strictEqual(updatedTest.refRangeText, '1.8 - 2.4');

  const refreshedSample = store.samples.find((s: any) => s.id === sample.id);
  const refreshedSampleTest = refreshedSample.tests.find((st: any) => st.testId === test1.id);
  assert.strictEqual(refreshedSampleTest.refRangeText, '1.8 - 2.4', 'Sample in memory should reflect updated refRangeText');
  assert.strictEqual(refreshedSampleTest.refRangeLow, 1.8, 'Sample in memory should reflect updated refRangeLow');
  assert.strictEqual(refreshedSampleTest.refRangeHigh, 2.4, 'Sample in memory should reflect updated refRangeHigh');
  console.log('✔ Test 2 & 3 Passed: Live in-memory sample reference synchronization (no stale state)');

  // Test 4: Clearing ranges by passing null or empty string sets null (not keeping stale state)
  const clearedTest = updateTestInStore(test1.id, {
    refRangeLow: null,
    refRangeHigh: null,
    refRangeText: null
  });

  assert.strictEqual(clearedTest.refRangeLow, null, 'refRangeLow should be null when cleared');
  assert.strictEqual(clearedTest.refRangeHigh, null, 'refRangeHigh should be null when cleared');
  assert.strictEqual(clearedTest.refRangeText, null, 'refRangeText should be null when cleared');
  console.log('✔ Test 4 Passed: Clearing range fields removes old values cleanly');

  // Clean up test entities so catalog and sample count remain pristine
  const idx = store.tests.findIndex((t: any) => t.id === test1.id);
  if (idx !== -1) store.tests.splice(idx, 1);
  const sIdx = store.samples.findIndex((s: any) => s.id === sample.id);
  if (sIdx !== -1) store.samples.splice(sIdx, 1);
  const { saveStoreToFile } = require('../apps/web/src/lib/serverStore');
  saveStoreToFile();

  console.log('ALL ITEM 4 REFERENCE RANGE TESTS PASSED SUCCESSFULLY!');
}

run();
