const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function check() {
  console.log('=== AUDITING DUPLICATE TESTS ACROSS DATABASES ===\n');

  // Check server db
  const pServer = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const serverTests = await pServer.testCatalog.findMany({
    include: {
      _count: {
        select: {
          sampleTests: true,
          panelItems: true,
          deviceMappings: true,
          referenceRanges: true
        }
      }
    }
  });

  console.log('1. Server DB (apps/server/prisma/lab.db): Total tests =', serverTests.length);
  const byNameServer = {};
  for (const t of serverTests) {
    const k = t.name.trim().toLowerCase();
    if (!byNameServer[k]) byNameServer[k] = [];
    byNameServer[k].push(t);
  }
  const dupesServer = Object.entries(byNameServer).filter(([_, list]) => list.length > 1);
  console.log('Server DB duplicate name groups:', dupesServer.length);
  for (const [k, list] of dupesServer) {
    console.log('  GROUP:', k);
    for (const t of list) {
      console.log(`    - ID: ${t.id} | Code: ${t.code} | Cat: ${t.category} | Specimen: ${t.sampleType} | Unit: ${t.unit} | Price: ${t.price} | Usage:`, t._count);
    }
  }

  // Check web db
  const pWeb = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/web/data/lab.db' } } });
  let webTests = [];
  try {
    webTests = await pWeb.testCatalog.findMany({
      include: {
        _count: {
          select: {
            sampleTests: true,
            panelItems: true,
            deviceMappings: true
          }
        }
      }
    });
  } catch (e) {
    webTests = await pWeb.testCatalog.findMany();
  }

  console.log('\n2. Web DB (apps/web/data/lab.db): Total tests =', webTests.length);
  const byNameWeb = {};
  for (const t of webTests) {
    const k = t.name.trim().toLowerCase();
    if (!byNameWeb[k]) byNameWeb[k] = [];
    byNameWeb[k].push(t);
  }
  const dupesWeb = Object.entries(byNameWeb).filter(([_, list]) => list.length > 1);
  console.log('Web DB duplicate name groups:', dupesWeb.length);
  for (const [k, list] of dupesWeb.slice(0, 15)) {
    console.log('  GROUP:', k);
    for (const t of list) {
      console.log(`    - ID: ${t.id} | Code: ${t.code} | Cat: ${t.category} | Specimen: ${t.sampleType} | Unit: ${t.unit} | Price: ${t.price} | Usage:`, t._count);
    }
  }

  // Check lab_store.json
  const storeRaw = fs.readFileSync('D:/lab/apps/desktop/engine/data/lab_store.json', 'utf8');
  const store = JSON.parse(storeRaw);
  const storeTests = store.tests || [];
  console.log('\n3. lab_store.json: Total tests =', storeTests.length);
  const byNameStore = {};
  for (const t of storeTests) {
    const k = (t.name || '').trim().toLowerCase();
    if (!byNameStore[k]) byNameStore[k] = [];
    byNameStore[k].push(t);
  }
  const dupesStore = Object.entries(byNameStore).filter(([_, list]) => list.length > 1);
  console.log('lab_store.json duplicate name groups:', dupesStore.length);
  for (const [k, list] of dupesStore.slice(0, 15)) {
    console.log('  GROUP:', k);
    for (const t of list) {
      console.log(`    - ID: ${t.id} | Code: ${t.code} | Cat: ${t.category} | Specimen: ${t.sampleType} | Unit: ${t.unit} | Price: ${t.price}`);
    }
  }

  await pServer.$disconnect();
  await pWeb.$disconnect();
}

check().catch(console.error);
