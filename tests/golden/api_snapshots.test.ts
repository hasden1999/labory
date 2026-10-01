import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

async function runApiSnapshotsGoldenTest() {
  console.log('🧪 [Golden Test] Verifying API Contract & Schema Snapshots...');
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } }
  });

  try {
    // 1. Verify Settings Singleton
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    assert.ok(settings, 'Settings singleton must exist');
    assert.ok(settings.labName, 'Settings must have labName');
    assert.ok(settings.installedVersion, 'Settings must have installedVersion');
    console.log(`  ✓ Settings snapshot verified (Lab: "${settings.labName}", Version: "${settings.installedVersion}")`);

    // 2. Verify TestCatalog Contract
    const testSample = await prisma.testCatalog.findFirst({ where: { active: true } });
    assert.ok(testSample, 'At least one active test must exist');
    const requiredTestKeys = ['id', 'name', 'category', 'price', 'active'];
    for (const key of requiredTestKeys) {
      assert.ok(key in testSample, `TestCatalog must contain key '${key}'`);
    }
    console.log(`  ✓ TestCatalog contract verified (Sample test: "${testSample.name}", Price: ${testSample.price})`);

    // 3. Verify Patient Contract
    const patientSample = await prisma.patient.findFirst({ where: { isDeleted: false } });
    if (patientSample) {
      assert.ok(patientSample.id, 'Patient must have id');
      assert.ok(patientSample.name, 'Patient must have name');
      console.log(`  ✓ Patient contract verified (Sample patient: "${patientSample.name}")`);
    }

    // 4. Verify Sample & SampleTest Contract
    const sampleRecord = await prisma.sample.findFirst({
      where: { isDeleted: false },
      include: { tests: true, patient: true }
    });
    if (sampleRecord) {
      assert.ok(sampleRecord.sampleNumber, 'Sample must have a valid sampleNumber');
      assert.ok(sampleRecord.patientId, 'Sample must link to patientId');
      console.log(`  ✓ Sample contract verified (Sample #${sampleRecord.sampleNumber}, Tests: ${sampleRecord.tests.length})`);
    }

    console.log('✅ [Golden Test] All API & Database Contract Snapshots Passed.');
  } finally {
    await prisma.$disconnect();
  }
}

runApiSnapshotsGoldenTest().catch((err) => {
  console.error('❌ [Golden Test] API snapshot test failed:', err);
  process.exit(1);
});
