const { prisma, initDbWAL } = require('../apps/web/src/lib/prisma');
const {
  addPatient,
  findPatient,
  addSample,
  findSample,
  updateSample,
  getStore,
} = require('../apps/web/src/lib/serverStore');

async function run() {
  console.log('🧪 Starting SQLite Integration Verification...');

  // 1. Check current counts in SQLite
  await initDbWAL();
  const initialPatientCount = await prisma.patient.count();
  const initialSampleCount = await prisma.sample.count();
  console.log(`📊 Initial SQLite records: ${initialPatientCount} patients, ${initialSampleCount} samples`);

  // 2. Add a new test patient via serverStore
  const testPatId = `pat-test-${Date.now()}`;
  const newPat = addPatient({
    id: testPatId,
    name: 'مريض اختبار الربط البرمجي',
    phone: '07709998877',
    age: 32,
    gender: 'MALE',
  });
  console.log(`✅ Created patient in store: ${newPat.name} (ID: ${newPat.id})`);

  // Wait 500ms for async SQLite sync
  await new Promise((r) => setTimeout(r, 500));

  // Verify in SQLite directly via Prisma
  const dbPat = await prisma.patient.findUnique({ where: { id: testPatId } });
  if (!dbPat) {
    throw new Error('❌ Patient was NOT found in SQLite lab.db!');
  }
  console.log(`🎯 Verified Patient in lab.db: ${dbPat.name}, Age: ${dbPat.age}, Gender: ${dbPat.gender}`);

  // 3. Add a sample for this patient
  const newSample = addSample({
    patientId: testPatId,
    patientName: dbPat.name,
    patientPhone: dbPat.phone,
    testIds: ['t-cbc', 't-fbs'],
    priceTotal: 25000,
    paidAmount: 20000,
    remainingAmount: 5000,
    paymentMethod: 'CASH',
  });
  console.log(`✅ Created sample in store: #${newSample.sampleNumber} (ID: ${newSample.id})`);

  // Wait 500ms for async SQLite sync
  await new Promise((r) => setTimeout(r, 500));

  // Verify sample and sampleTests in SQLite
  const dbSample = await prisma.sample.findUnique({
    where: { sampleNumber: newSample.sampleNumber },
    include: { tests: true, patient: true },
  });
  if (!dbSample) {
    throw new Error(`❌ Sample #${newSample.sampleNumber} was NOT found in SQLite lab.db!`);
  }
  console.log(`🎯 Verified Sample in lab.db: #${dbSample.sampleNumber}, Status: ${dbSample.status}, Price: ${dbSample.priceTotal}, Tests Count: ${dbSample.tests.length}`);

  // 4. Update sample results and status
  const updated = updateSample(newSample.id, {
    status: 'READY',
    notes: 'تم تأكيد الفحص مخبرياً بنجاح',
  });
  console.log(`✅ Updated sample in store to READY`);

  // Wait 500ms for async SQLite sync
  await new Promise((r) => setTimeout(r, 500));

  const dbSampleUpdated = await prisma.sample.findUnique({
    where: { sampleNumber: newSample.sampleNumber },
  });
  if (dbSampleUpdated.status !== 'READY') {
    throw new Error(`❌ Sample status update did not reflect in SQLite! Current: ${dbSampleUpdated.status}`);
  }
  console.log(`🎯 Verified Updated Sample in lab.db: Status: ${dbSampleUpdated.status}, Notes: ${dbSampleUpdated.notes}`);

  // 5. Cleanup test records from SQLite
  await prisma.sampleTest.deleteMany({ where: { sampleId: dbSample.id } });
  await prisma.sample.delete({ where: { id: dbSample.id } });
  await prisma.patient.delete({ where: { id: testPatId } });
  console.log('🧹 Cleaned up temporary test records from SQLite lab.db.');

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED! Next.js ServerStore is 100% synchronized with SQLite lab.db!');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
