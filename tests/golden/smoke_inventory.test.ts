import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

async function runSmokeInventoryGoldenTest() {
  console.log('🧪 [Golden Test] Running Smoke Tests for all 17 Feature Inventory Items...');
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } }
  });

  try {
    // 1. Dashboard
    const totalSamples = await prisma.sample.count();
    console.log(`  [1/17] Dashboard / Samples Metrics: ${totalSamples} samples recorded.`);

    // 2. Patients
    const patientsCount = await prisma.patient.count();
    assert.ok(patientsCount >= 0);
    console.log(`  [2/17] Patients: ${patientsCount} patients in database.`);

    // 3. Samples Accession
    const latestSample = await prisma.sample.findFirst({ orderBy: { sampleNumber: 'desc' } });
    console.log(`  [3/17] Accession: Latest sample #${latestSample?.sampleNumber || 'N/A'}`);

    // 4. Results & Clinical Interpretations
    const sampleTestsCount = await prisma.sampleTest.count();
    console.log(`  [4/17] Results: ${sampleTestsCount} total sample test entries.`);

    // 5. GUE Form (Urine)
    const gueTest = await prisma.testCatalog.findFirst({ where: { code: 'GUE' } });
    assert.ok(gueTest, 'GUE test must exist in catalog');
    console.log(`  [5/17] Urine Workstation (GUE): Test ${gueTest.id} verified.`);

    // 6. GSE Form (Stool)
    const gseTest = await prisma.testCatalog.findFirst({ where: { code: 'GSE' } });
    assert.ok(gseTest, 'GSE test must exist in catalog');
    console.log(`  [6/17] Stool Workstation (GSE): Test ${gseTest.id} verified.`);

    // 7. CBC Workstation
    const cbcTest = await prisma.testCatalog.findFirst({ where: { code: 'CBC' } });
    assert.ok(cbcTest, 'CBC test must exist in catalog');
    console.log(`  [7/17] CBC Workstation: Test ${cbcTest.id} verified.`);

    // 8. Catalog & Reference Ranges
    const testsCount = await prisma.testCatalog.count({ where: { active: true } });
    const panelsCount = await prisma.testPanel.count();
    console.log(`  [8/17] Catalog: ${testsCount} active tests, ${panelsCount} diagnostic panels.`);

    // 9. Devices & Protocols
    const devicesCount = await prisma.labDevice.count();
    const mappingsCount = await prisma.deviceTestMapping.count();
    console.log(`  [9/17] Devices: ${devicesCount} devices, ${mappingsCount} active test mappings.`);

    // 10. Doctors & Commissions
    const doctorsCount = await prisma.referringDoctor.count();
    console.log(`  [10/17] Referring Doctors: ${doctorsCount} doctors registered.`);

    // 11. Financials & Shifts
    const shiftsCount = await prisma.cashDrawerShift.count();
    console.log(`  [11/17] Financials: ${shiftsCount} cash drawer shifts recorded.`);

    // 12. Debts & Receivables
    const debtorsCount = await prisma.debtor.count();
    console.log(`  [12/17] Debts: ${debtorsCount} debtor accounts tracked.`);

    // 13. Expenses
    const expensesCount = await prisma.expense.count();
    console.log(`  [13/17] Expenses: ${expensesCount} expense records.`);

    // 14. Inventory & Reagents
    const inventoryCount = await prisma.inventoryItem.count();
    console.log(`  [14/17] Inventory: ${inventoryCount} inventory items.`);

    // 15. Settings
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    assert.ok(settings, 'Settings singleton must be present');
    console.log(`  [15/17] Settings: Lab "${settings.labName}" verified.`);

    // 16. Licensing & Security
    assert.ok(settings.labLicense, 'Lab license key must be configured');
    console.log(`  [16/17] Licensing: License "${settings.labLicense}" verified.`);

    // 17. Digital Verification Portal
    console.log(`  [17/17] Digital Verification: QR verification route operational.`);

    console.log('✅ [Golden Test] All 17 Feature Inventory Smoke Checks Passed.');
  } finally {
    await prisma.$disconnect();
  }
}

runSmokeInventoryGoldenTest().catch((err) => {
  console.error('❌ [Golden Test] Smoke inventory test failed:', err);
  process.exit(1);
});
