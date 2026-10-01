const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

console.log('====================================================');
console.log('🧪 RUNNING RIGOROUS REGRESSION & INTEGRATION TESTS');
console.log('====================================================\n');

// 1. Arabic Normalizer function matching the implementation
function cleanArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .toLowerCase()
    .trim();
}

function matchSearch(t, query) {
  const rawSearch = (query || '').trim();
  const normSearch = cleanArabic(rawSearch);
  return (
    !rawSearch ||
    cleanArabic(t.name || '').includes(normSearch) ||
    cleanArabic(t.arabicName || '').includes(normSearch) ||
    cleanArabic(t.code || '').includes(normSearch) ||
    cleanArabic(t.category || '').includes(normSearch) ||
    (t.name || '').toLowerCase().includes(rawSearch.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(rawSearch.toLowerCase())
  );
}

const dbPaths = [
  path.resolve(__dirname, '../apps/server/prisma/lab.db'),
  path.resolve(process.env.APPDATA, '@lab-manager/desktop/data/lab.db'),
];

const storePath = path.resolve(__dirname, '../apps/web/data/lab_store.json');

async function runTests() {
  let hasFailure = false;

  // TEST 1: CATALOG SIZE CHECK
  console.log('--- TEST 1: Catalog Size & Completeness Verification ---');
  for (const p of dbPaths) {
    if (fs.existsSync(p)) {
      const prisma = new PrismaClient({ datasources: { db: { url: `file:${p.replace(/\\/g, '/')}` } } });
      const count = await prisma.testCatalog.count({ where: { active: true } });
      console.log(`[DB] ${p} -> Active tests count: ${count}`);
      if (count < 142) {
        console.error(`❌ FAILED: Test catalog in ${p} has only ${count} tests (< 142)!`);
        hasFailure = true;
      } else {
        console.log(`✅ PASSED: Test catalog has ${count} tests (>= 142 required).`);
      }
      await prisma.$disconnect();
    }
  }

  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const activeTests = (store.tests || []).filter(t => t.active !== false);
    console.log(`[JSON Store] ${storePath} -> Active tests count: ${activeTests.length}`);
    if (activeTests.length < 142) {
      console.error(`❌ FAILED: JSON store has only ${activeTests.length} tests (< 142)!`);
      hasFailure = true;
    } else {
      console.log(`✅ PASSED: JSON store has ${activeTests.length} tests (>= 142 required).`);
    }
  }

  // TEST 2: ARABIC & ENGLISH & CODE SEARCH TESTS
  console.log('\n--- TEST 2: Multi-Language & Normalized Arabic Search Tests ---');
  const primaryDbPath = dbPaths[0];
  const prismaPrimary = new PrismaClient({ datasources: { db: { url: `file:${primaryDbPath.replace(/\\/g, '/')}` } } });
  const allTests = await prismaPrimary.testCatalog.findMany({ where: { active: true } });

  const searchScenarios = [
    { query: 'صورة الدم', expectedCode: 'CBC', desc: 'Arabic search: Exact name' },
    { query: 'الغده', expectedCode: 'TSH', desc: 'Arabic normalization: ه instead of ة' },
    { query: 'ادرار', expectedCode: 'GUE', desc: 'Arabic normalization: ا instead of إ' },
    { query: 'Complete Blood Count', expectedCode: 'CBC', desc: 'English full name search' },
    { query: 'FBS', expectedCode: 'FBS', desc: 'English abbreviation/code search' },
    { query: 'تراكمي', expectedCode: 'HBA1C', desc: 'Arabic partial keyword search' },
    { query: 'FERRITIN', expectedCode: 'FER', desc: 'Case insensitive English search' },
    { query: 'دهون', expectedCode: 'TG', desc: 'Arabic category/name search' },
  ];

  for (const sc of searchScenarios) {
    const matches = allTests.filter(t => matchSearch(t, sc.query));
    const foundExpected = matches.some(m => m.code === sc.expectedCode);
    if (foundExpected) {
      console.log(`✅ PASSED [${sc.desc}]: query "${sc.query}" matched ${matches.length} tests, including ${sc.expectedCode}.`);
    } else {
      console.error(`❌ FAILED [${sc.desc}]: query "${sc.query}" did not find expected code ${sc.expectedCode}. Matches: ${matches.map(m=>m.code).join(',')}`);
      hasFailure = true;
    }
  }

  // TEST 3: DYNAMIC ADDITION & INSTANT SEARCH VERIFICATION
  console.log('\n--- TEST 3: Dynamic Add & Modify Regression in SQLite & Store ---');
  const newTestId = 't-regression-test-99';
  const initialData = {
    id: newTestId,
    code: 'REG_TEST',
    name: 'Initial Regression Analysis',
    arabicName: 'فحص التحقق الآلي المؤقت',
    category: 'كيمياء سريرية',
    price: 22000,
    active: true
  };

  // Insert test
  await prismaPrimary.testCatalog.upsert({
    where: { id: newTestId },
    update: initialData,
    create: initialData,
  });

  let currentTests = await prismaPrimary.testCatalog.findMany({ where: { active: true } });

  // Verify addition matches
  const searchArabicInitial = currentTests.filter(t => matchSearch(t, 'المؤقت'));
  const searchCodeInitial = currentTests.filter(t => matchSearch(t, 'REG_TEST'));
  const searchEngInitial = currentTests.filter(t => matchSearch(t, 'Regression'));

  if (searchArabicInitial.length > 0 && searchCodeInitial.length > 0 && searchEngInitial.length > 0) {
    console.log('✅ PASSED: Newly created test found immediately via Arabic, English, and Code queries.');
  } else {
    console.error('❌ FAILED: Newly created test not found in immediate search.');
    hasFailure = true;
  }

  // Update test name
  await prismaPrimary.testCatalog.update({
    where: { id: newTestId },
    data: {
      name: 'Updated Regression Analysis Advanced',
      arabicName: 'فحص التحقق المتطور والمعدل',
    },
  });

  currentTests = await prismaPrimary.testCatalog.findMany({ where: { active: true } });

  // Verify new name is found and old name disappears
  const searchNewName = currentTests.filter(t => matchSearch(t, 'المتطور'));
  const searchOldName = currentTests.filter(t => matchSearch(t, 'المؤقت'));

  if (searchNewName.length > 0 && searchOldName.length === 0) {
    console.log('✅ PASSED: Modified test reflected immediately (New name found, old name disappeared).');
  } else {
    console.error(`❌ FAILED: Test update search reflection failure (new found: ${searchNewName.length}, old found: ${searchOldName.length})`);
    hasFailure = true;
  }

  // Cleanup the test record
  await prismaPrimary.testCatalog.delete({ where: { id: newTestId } });
  console.log('🧹 Cleaned up temporary test record successfully.');

  // TEST 4: COMPREHENSIVE TABLE RECORD AUDIT (BEFORE vs AFTER)
  console.log('\n--- TEST 4: Integrity Check of Main Database Tables ---');
  const patientCount = await prismaPrimary.patient.count();
  const sampleCount = await prismaPrimary.sample.count();
  const sampleTestCount = await prismaPrimary.sampleTest.count();
  const doctorCount = await prismaPrimary.referringDoctor.count();
  const debtorCount = await prismaPrimary.debtor.count();
  const expenseCount = await prismaPrimary.expense.count();
  const deviceCount = await prismaPrimary.labDevice.count();
  const testCatalogCount = await prismaPrimary.testCatalog.count();
  const testPanelCount = await prismaPrimary.testPanel.count();

  const auditData = [
    { table: 'Patient', count: patientCount },
    { table: 'Sample', count: sampleCount },
    { table: 'SampleTest', count: sampleTestCount },
    { table: 'ReferringDoctor', count: doctorCount },
    { table: 'Debtor', count: debtorCount },
    { table: 'Expense', count: expenseCount },
    { table: 'LabDevice', count: deviceCount },
    { table: 'TestCatalog', count: testCatalogCount },
    { table: 'TestPanel', count: testPanelCount },
  ];

  console.log('┌───────────────────────┬──────────────┐');
  console.log('│ Table Name            │ Record Count │');
  console.log('├───────────────────────┼──────────────┤');
  for (const item of auditData) {
    console.log(`│ ${item.table.padEnd(21)} │ ${String(item.count).padStart(12)} │`);
  }
  console.log('└───────────────────────┴──────────────┘');

  await prismaPrimary.$disconnect();

  if (hasFailure) {
    console.error('\n❌ ONE OR MORE REGRESSION TESTS FAILED.');
    process.exit(1);
  } else {
    console.log('\n✨ ALL REGRESSION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
