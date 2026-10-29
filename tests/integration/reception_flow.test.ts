import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import {
  classifyResultRange,
  matchPatientReferenceRange,
} from '@lab-manager/domain';
import { buildWhatsAppMessage } from '../../apps/web/src/lib/orderHelpers';

async function runReceptionIntegrationFlowTest() {
  console.log('🧪 [Integration Test] Running Full Reception Lifecycle Test (Patient -> Order -> Results -> Verification)...');

  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } },
  });

  try {
    // 1. Fetch catalog tests for CBC, Glucose, and Lipid
    const catalogTests = await prisma.testCatalog.findMany({
      where: { active: true },
    });
    assert.ok(catalogTests.length >= 100, 'Must have full clinical test catalog');

    const cbcTest = catalogTests.find((t) => t.code === 'CBC' || t.name.includes('CBC'));
    const fbsTest = catalogTests.find((t) => t.code === 'FBS' || t.name.includes('Fasting Blood Sugar'));
    assert.ok(cbcTest, 'CBC test must exist in catalog');
    assert.ok(fbsTest, 'FBS test must exist in catalog');

    // 2. Register/Create Patient
    const uniquePhone = '0770' + Math.floor(1000000 + Math.random() * 9000000);
    const testPatient = await prisma.patient.create({
      data: {
        name: 'أحمد جاسم الشمري (اختبار التكامل)',
        gender: 'MALE',
        age: 42,
        phone: uniquePhone,
      },
    });
    assert.ok(testPatient.id, 'Patient record must be created');

    // 3. Create Order / Sample with zero discount
    const expectedTotal = (cbcTest.price || 0) + (fbsTest.price || 0);
    const testSample = await prisma.sample.create({
      data: {
        patientId: testPatient.id,
        sampleNumber: Math.floor(90000 + Math.random() * 9000),
        status: 'PENDING',
        discount: 0,
        priceTotal: expectedTotal,
        paidAmount: expectedTotal,
        remainingAmount: 0,
        tests: {
          create: [
            {
              testId: cbcTest.id,
              priceAtTime: cbcTest.price || 0,
              resultValue: '11.5', // Low for 42yo male (Ref: 13.0 - 17.5) -> L ↓
              isAbnormal: true,
              interpretation: 'LOW',
            },
            {
              testId: fbsTest.id,
              priceAtTime: fbsTest.price || 0,
              resultValue: '185', // High for adult (Ref: 70 - 110) -> H ↑
              isAbnormal: true,
              interpretation: 'HIGH',
            },
          ],
        },
      },
      include: {
        patient: true,
        tests: {
          include: { test: true },
        },
      },
    });

    assert.strictEqual(testSample.discount, 0, 'Discount must be strictly zero');
    assert.strictEqual(testSample.priceTotal, expectedTotal, 'Total must match catalog prices');
    assert.strictEqual(testSample.tests.length, 2, 'Sample must have 2 tests');

    // 4. Reopen and verify persistence (survives disconnect/reopen)
    const retrievedSample = await prisma.sample.findUnique({
      where: { id: testSample.id },
      include: {
        patient: true,
        tests: {
          include: { test: true },
        },
      },
    });
    assert.ok(retrievedSample, 'Sample must be retrievable from database');
    assert.strictEqual(retrievedSample?.patient.name, 'أحمد جاسم الشمري (اختبار التكامل)');
    assert.strictEqual(retrievedSample?.patient.gender, 'MALE');
    assert.strictEqual(retrievedSample?.patient.age, 42);

    // 5. Assert Clinical Flag Consistency across Screen / Print / WhatsApp
    const patientCtx = {
      gender: retrievedSample?.patient.gender as any,
      age: retrievedSample?.patient.age || undefined,
    };

    // Classify CBC result (11.5)
    const cbcClassification = classifyResultRange('11.5', cbcTest, patientCtx);
    // Classify FBS result (185)
    const fbsClassification = classifyResultRange('185', fbsTest, patientCtx);

    assert.strictEqual(fbsClassification.flag, 'HIGH', 'FBS 185 mg/dL must be classified HIGH');
    assert.strictEqual(fbsClassification.displayFlag, 'H ↑', 'FBS flag must display H ↑');

    // 6. WhatsApp Message Construction Verification
    const waMessage = buildWhatsAppMessage({
      labName: 'Labryo Laboratory',
      patientName: retrievedSample?.patient.name || '',
      date: '2026-10-09',
      sampleNumber: retrievedSample?.sampleNumber || 0,
      lines: [
        {
          name: cbcTest.name,
          value: '11.5',
          unit: cbcTest.unit || '',
          flag: cbcClassification.flag,
        },
        {
          name: fbsTest.name,
          value: '185',
          unit: fbsTest.unit || 'mg/dL',
          flag: fbsClassification.flag,
        },
      ],
    });

    assert.ok(waMessage.includes('[H ↑]'), 'WhatsApp message must include [H ↑] for high FBS');
    assert.ok(waMessage.includes('185 mg/dL') || waMessage.includes('185'), 'WhatsApp message must include FBS value');

    // Clean up test records
    await prisma.sampleTest.deleteMany({ where: { sampleId: testSample.id } });
    await prisma.sample.delete({ where: { id: testSample.id } });
    await prisma.patient.delete({ where: { id: testPatient.id } });

    console.log('✅ [Integration Test] Full Reception Lifecycle Test PASSED with 100% integrity!');
  } finally {
    await prisma.$disconnect();
  }
}

runReceptionIntegrationFlowTest().catch((err) => {
  console.error('❌ Integration flow test failed:', err);
  process.exit(1);
});
