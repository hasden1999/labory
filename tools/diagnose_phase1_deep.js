const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('=== DEEP DIAGNOSTIC PHASE 1 ===\n');

  // 1. Check catalogData.ts
  const catalogDataContent = fs.readFileSync('D:/lab/apps/web/src/lib/catalogData.ts', 'utf8');
  const testMatches = catalogDataContent.match(/"id":\s*"t-[^"]+"/g) || [];
  console.log('1. Tests in catalogData.ts (INITIAL_TESTS_CATALOG):', testMatches.length);

  // 2. Check catalogCache.ts
  if (fs.existsSync('D:/lab/apps/web/src/lib/catalogCache.ts')) {
    console.log('\n2. catalogCache.ts exists. Let us inspect its content:');
    console.log(fs.readFileSync('D:/lab/apps/web/src/lib/catalogCache.ts', 'utf8'));
  }

  // 3. Check SQLite Databases: Active vs Backups
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } }
  });

  const activeTests = await prisma.testCatalog.findMany({
    select: { id: true, code: true, name: true, arabicName: true, category: true, active: true }
  });
  console.log(`\n3. Active Server DB TestCatalog total count: ${activeTests.length}`);

  // Check backup DB pre_recovery_20260930
  const prismaBackup = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/backups/pre_recovery_20260930/lab_server.db' } }
  });
  const backupTests = await prismaBackup.testCatalog.findMany({
    select: { id: true, code: true, name: true, arabicName: true, category: true, active: true }
  });
  console.log(`Backup pre_recovery_20260930 TestCatalog total count: ${backupTests.length}`);

  // Compare activeTests vs backupTests
  const activeIds = new Set(activeTests.map(t => t.id));
  const activeNames = new Set(activeTests.map(t => t.name.toLowerCase().trim()));
  const missingFromActive = backupTests.filter(t => !activeIds.has(t.id) && !activeNames.has(t.name.toLowerCase().trim()));

  console.log(`\nTests present in Backup (221) but missing in Active (144): ${missingFromActive.length}`);
  
  // Also check if any backup DB had 142 tests!
  // Let's check lab_clinical_20260920_082942.db or other backups
  const backupFiles = fs.readdirSync('D:/lab/backups', { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.db'))
    .map(f => path.join('D:/lab/backups', f));

  for (const bf of backupFiles) {
    try {
      const p = new PrismaClient({ datasources: { db: { url: `file:${bf}` } } });
      const c = await p.testCatalog.count();
      console.log(`Backup file: ${bf} -> TestCatalog count = ${c}`);
      await p.$disconnect();
    } catch (e) {
      // not a full prisma db or error
    }
  }

  // 4. Where does 72 come from?
  // Let's check how many tests have specific categories or if there is a category filter, or if 144 / 2 = 72!
  // Wait! Look at 144 / 2 = 72!
  console.log('\n--- Checking 144 vs 72 ---');
  console.log('Is 144 exactly 2 * 72?', 144 / 2 === 72);

  // Check if tests in active DB are duplicated or if there is a filter:
  const uniqueNames = new Set();
  const duplicateNames = [];
  for (const t of activeTests) {
    const key = t.name.toLowerCase().trim();
    if (uniqueNames.has(key)) {
      duplicateNames.push(t);
    } else {
      uniqueNames.add(key);
    }
  }
  console.log('Unique test names in active DB:', uniqueNames.size);
  console.log('Duplicate test names count:', duplicateNames.length);

  await prisma.$disconnect();
  await prismaBackup.$disconnect();
}

main().catch(console.error);
