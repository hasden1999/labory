const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function runMerge(targetDbPath, targetJsonPath, isDryRun = true) {
  console.log(`\n--------------------------------------------------`);
  console.log(`Running Catalog Merge [${isDryRun ? 'DRY-RUN' : 'LIVE'}]:`);
  console.log(`DB: ${targetDbPath}`);
  console.log(`JSON: ${targetJsonPath}`);
  console.log(`--------------------------------------------------`);

  // 1. Load source tests (142 from cefd3a0 + 221 from pre_recovery)
  const old142Raw = execSync('git show cefd3a0:apps/web/data/lab_store.json', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  const source142Tests = JSON.parse(old142Raw).tests || [];

  const preRecoveryDb = 'D:/lab/backups/pre_recovery_20260930/lab_server.db';
  const prismaPre = new PrismaClient({ datasources: { db: { url: `file:${preRecoveryDb}` } } });
  const source221Tests = await prismaPre.testCatalog.findMany();
  const sourcePanelItems = await prismaPre.testPanelItem.findMany();
  await prismaPre.$disconnect();

  console.log(`Source 142 tests: ${source142Tests.length}`);
  console.log(`Source 221 tests: ${source221Tests.length}`);
  console.log(`Source panel items: ${sourcePanelItems.length}`);

  // Combine source tests (142 takes priority for base data, 221 fills in the rest)
  const masterSourceMap = new Map();
  for (const t of source221Tests) {
    const key = (t.code || t.name).trim().toLowerCase();
    masterSourceMap.set(key, {
      code: t.code,
      name: t.name,
      arabicName: t.arabicName || t.name,
      category: t.category || 'عام',
      price: Number(t.price) || 0,
      costEstimate: Number(t.costEstimate) || 0,
      refRangeLow: t.refRangeLow,
      refRangeHigh: t.refRangeHigh,
      normalMaleLow: t.normalMaleLow,
      normalMaleHigh: t.normalMaleHigh,
      normalFemaleLow: t.normalFemaleLow,
      normalFemaleHigh: t.normalFemaleHigh,
      criticalLow: t.criticalLow,
      criticalHigh: t.criticalHigh,
      refRangeText: t.refRangeText,
      unit: t.unit,
      sampleType: t.sampleType || 'مصل الدم (Serum)',
      active: true,
    });
  }

  for (const t of source142Tests) {
    const key = (t.code || t.name).trim().toLowerCase();
    masterSourceMap.set(key, {
      code: t.code,
      name: t.name,
      arabicName: t.arabicName || t.name,
      category: t.category || 'عام',
      price: Number(t.price) || 0,
      costEstimate: Number(t.costEstimate || t.cost) || 0,
      refRangeLow: t.refRangeLow,
      refRangeHigh: t.refRangeHigh,
      normalMaleLow: t.normalMaleLow,
      normalMaleHigh: t.normalMaleHigh,
      normalFemaleLow: t.normalFemaleLow,
      normalFemaleHigh: t.normalFemaleHigh,
      criticalLow: t.criticalLow,
      criticalHigh: t.criticalHigh,
      refRangeText: t.refRangeText || t.normalRange,
      unit: t.unit,
      sampleType: t.sampleType || 'مصل الدم (Serum)',
      active: t.active !== false,
    });
  }

  console.log(`Total unique master tests to ensure: ${masterSourceMap.size}`);

  // 2. Inspect Target DB
  const prismaTarget = new PrismaClient({ datasources: { db: { url: `file:${targetDbPath}` } } });
  const existingDbTests = await prismaTarget.testCatalog.findMany();
  console.log(`Existing tests in target DB before merge: ${existingDbTests.length}`);

  const existingDbKeys = new Set(existingDbTests.map(t => (t.code || t.name).trim().toLowerCase()));
  const existingDbNames = new Set(existingDbTests.map(t => t.name.trim().toLowerCase()));

  const toInsertDb = [];
  for (const [key, testData] of masterSourceMap.entries()) {
    const nameKey = testData.name.trim().toLowerCase();
    if (!existingDbKeys.has(key) && !existingDbNames.has(nameKey)) {
      toInsertDb.push(testData);
    }
  }

  console.log(`Tests to insert into Target DB: ${toInsertDb.length}`);

  if (!isDryRun) {
    for (const t of toInsertDb) {
      await prismaTarget.testCatalog.create({
        data: {
          code: t.code || null,
          name: t.name,
          arabicName: t.arabicName || null,
          category: t.category,
          price: t.price,
          costEstimate: t.costEstimate,
          refRangeLow: t.refRangeLow,
          refRangeHigh: t.refRangeHigh,
          normalMaleLow: t.normalMaleLow,
          normalMaleHigh: t.normalMaleHigh,
          normalFemaleLow: t.normalFemaleLow,
          normalFemaleHigh: t.normalFemaleHigh,
          criticalLow: t.criticalLow,
          criticalHigh: t.criticalHigh,
          refRangeText: t.refRangeText,
          unit: t.unit,
          sampleType: t.sampleType,
          active: t.active,
        }
      });
    }

    // Also check and restore Panel Items if missing
    const existingPanelItemsCount = await prismaTarget.testPanelItem.count();
    if (existingPanelItemsCount === 0 && sourcePanelItems.length > 0) {
      console.log(`Restoring ${sourcePanelItems.length} Panel Items in DB...`);
      for (const pi of sourcePanelItems) {
        try {
          await prismaTarget.testPanelItem.create({
            data: {
              panelId: pi.panelId,
              testId: pi.testId,
            }
          });
        } catch (e) {
          // ignore duplicate or foreign key mismatch
        }
      }
    }
  }

  const finalDbCount = await prismaTarget.testCatalog.count();
  const finalPanelItemsCount = await prismaTarget.testPanelItem.count();
  console.log(`Target DB final tests count: ${finalDbCount}, panel items count: ${finalPanelItemsCount}`);
  await prismaTarget.$disconnect();

  // 3. Inspect and Update Target JSON
  if (fs.existsSync(targetJsonPath)) {
    const store = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));
    if (!Array.isArray(store.tests)) store.tests = [];
    console.log(`Existing tests in target JSON before merge: ${store.tests.length}`);

    const existingJsonKeys = new Set(store.tests.map(t => (t.code || t.name).trim().toLowerCase()));
    const existingJsonNames = new Set(store.tests.map(t => (t.name || '').trim().toLowerCase()));

    const toInsertJson = [];
    for (const [key, testData] of masterSourceMap.entries()) {
      const nameKey = testData.name.trim().toLowerCase();
      if (!existingJsonKeys.has(key) && !existingJsonNames.has(nameKey)) {
        toInsertJson.push({
          id: `t-${testData.code ? testData.code.toLowerCase().replace(/[^a-z0-9]/g, '-') : Date.now() + Math.random().toString(36).slice(2, 6)}`,
          ...testData,
          cost: testData.costEstimate,
          normalRange: testData.refRangeText,
        });
      }
    }

    console.log(`Tests to append into Target JSON: ${toInsertJson.length}`);

    if (!isDryRun && toInsertJson.length > 0) {
      store.tests.push(...toInsertJson);
      fs.writeFileSync(targetJsonPath, JSON.stringify(store, null, 2), 'utf8');
      console.log(`Target JSON final tests count: ${store.tests.length}`);
    }
  }

  return { insertedDb: toInsertDb.length, finalDbCount };
}

async function main() {
  const isLive = process.argv.includes('--live');
  console.log(`Mode: ${isLive ? 'LIVE EXECUTION' : 'DRY-RUN SAFETY CHECK'}`);

  // Test first on sandbox copy
  const testDb = 'D:/lab/backups/emergency_backup_20260930_phase1/D__lab_apps_server_prisma/lab.db';
  const testJson = 'D:/lab/backups/emergency_backup_20260930_phase1/AppData_Roaming_lab_manager/lab_store.json';

  await runMerge(testDb, testJson, !isLive);

  if (isLive) {
    // Apply live to active targets
    console.log('\n================ APPLYING TO ACTIVE SYSTEMS ================');
    const targets = [
      {
        db: 'D:/lab/apps/server/prisma/lab.db',
        json: 'D:/lab/apps/web/data/lab_store.json',
      },
      {
        db: 'D:/lab/apps/web/data/lab.db',
        json: 'D:/lab/apps/desktop/engine/data/lab_store.json',
      },
      {
        db: 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab.db',
        json: 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab_store.json',
      }
    ];

    for (const t of targets) {
      if (fs.existsSync(t.db) || fs.existsSync(t.json)) {
        await runMerge(t.db, t.json, false);
      }
    }
  }
}

main().catch(console.error);
