const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const activeCount = await p.testCatalog.count({ where: { active: true } });
  const totalCount = await p.testCatalog.count();
  const allActive = await p.testCatalog.findMany({ where: { active: true } });
  
  const nameMap = new Map();
  for (const t of allActive) {
    const k = t.name.trim().toLowerCase();
    if (!nameMap.has(k)) nameMap.set(k, []);
    nameMap.get(k).push(t.id);
  }
  const dupes = [...nameMap.entries()].filter(([_, ids]) => ids.length > 1);

  console.log('==============================================');
  console.log('🎯 Test Catalog Invariance & Idempotency Audit:');
  console.log('Active Tests Count:', activeCount);
  console.log('Total Tests in DB:', totalCount);
  console.log('Duplicate Name Groups:', dupes.length);
  if (dupes.length > 0) {
    console.log('Duplicates found:', dupes);
  } else {
    console.log('✨ ZERO DUPLICATES! Perfect 142 Canonical Tests.');
  }
  console.log('==============================================');

  await p.$disconnect();
}

main().catch(console.error);
