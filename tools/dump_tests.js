const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function run() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const tests = await p.testCatalog.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
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

  const lines = [`Total tests: ${tests.length}\n`];
  for (const t of tests) {
    const code = (t.code || '-').padEnd(10);
    const cat = (t.category || '-').padEnd(25);
    const name = t.name.padEnd(40);
    const ar = (t.arabicName || '-').padEnd(35);
    const usage = `(samples:${t._count.sampleTests}, panels:${t._count.panelItems}, dev:${t._count.deviceMappings})`;
    lines.push(`${cat} | ${code} | ${name} | ${ar} | price: ${t.price} | ${usage} | ID: ${t.id}`);
  }

  fs.writeFileSync('D:/lab/tools/all_catalog_tests.txt', lines.join('\n'), 'utf8');
  console.log(`Successfully wrote ${tests.length} tests to D:/lab/tools/all_catalog_tests.txt`);
  await p.$disconnect();
}

run().catch(console.error);
