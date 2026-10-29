/**
 * Integration Test: Debt Settlement & Payment Flow Verification
 * Tests paying sample debt via both /pay and PATCH /samples/:id endpoints.
 */

import assert from 'node:assert';
import { getStore, paySampleRemaining, updateSample } from '../../apps/web/src/lib/serverStore';

async function runDebtPaymentTest() {
  console.log('🧪 [Integration Test] Verifying Debt Settlement Flow...');

  const store = getStore();
  
  // 1. Create a mock sample with remaining debt
  const testSampleId = `sample-debt-test-${Date.now()}`;
  const uniqueSampleNum = Math.floor(500000 + Math.random() * 400000);
  const sampleData: any = {
    id: testSampleId,
    sampleNumber: uniqueSampleNum,
    patientId: 'patient-test-1',
    patient: { id: 'patient-test-1', name: 'مريض تجربة تسديد الدين', phone: '07701234567' },
    priceTotal: 30000,
    discount: 0,
    finalAmount: 30000,
    paidAmount: 10000,
    remainingAmount: 20000,
    paymentStatus: 'PARTIAL',
    status: 'COMPLETED',
    tests: [],
    createdAt: new Date().toISOString(),
  };

  store.samples.push(sampleData);

  // 2. Test Step A: Pay partial debt of 10,000 IQD via paySampleRemaining
  console.log('  ▶️ Testing partial debt payment of 10,000 IQD via paySampleRemaining...');
  const payResult = paySampleRemaining(testSampleId, {
    paidAmount: 10000,
    paymentMethod: 'CASH',
    notes: 'تسديد دفعة أولى',
  });

  assert.strictEqual(payResult.success, true, 'payResult.success should be true');
  assert.strictEqual(payResult.sample.paidAmount, 20000, 'paidAmount should now be 20,000');
  assert.strictEqual(payResult.sample.remainingAmount, 10000, 'remainingAmount should now be 10,000');
  assert.ok(payResult.voucherNumber > 0, 'A valid financial voucher number should be generated');

  // Verify financial transaction was logged
  const tx = store.financialTransactions?.find((t) => t.sampleId === testSampleId);
  assert.ok(tx, 'Financial transaction should be recorded');
  assert.strictEqual(tx.amount, 10000, 'Transaction amount should match payment');

  // 3. Test Step B: Settle final debt of 10,000 IQD via updateSample (simulating UI PATCH fallback)
  console.log('  ▶️ Testing final debt settlement of 10,000 IQD via updateSample...');
  const patchResult = updateSample(testSampleId, {
    paidAmount: 30000,
    remainingAmount: 0,
    paymentStatus: 'PAID',
  });

  assert.ok(patchResult, 'patchResult should be returned');
  assert.strictEqual(patchResult.paidAmount, 30000, 'paidAmount should now be 30,000 (fully paid)');
  assert.strictEqual(patchResult.remainingAmount, 0, 'remainingAmount should now be 0');
  assert.strictEqual(patchResult.paymentStatus, 'PAID', 'paymentStatus should be PAID');

  // Cleanup test sample
  const idx = store.samples.findIndex((s) => s.id === testSampleId);
  if (idx !== -1) store.samples.splice(idx, 1);

  console.log('✅ [Integration Test] Debt Settlement & Voucher Generation Passed 100%!');
}

runDebtPaymentTest().catch((err) => {
  console.error('❌ Debt payment test failed:', err);
  process.exit(1);
});
