const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/backups/pre_recovery_20260930/lab_server.db' } } });
  const source221 = await p.testCatalog.findMany();
  await p.$disconnect();

  const countsByName = {};
  for (const t of source221) {
    const k = t.name.trim();
    countsByName[k] = (countsByName[k] || 0) + 1;
  }

  const duplicates = Object.entries(countsByName).filter(([_, c]) => c > 1);
  console.log('Total duplicates count:', duplicates.length);
  console.log('Duplicates sample:', duplicates.slice(0, 10));
}

main().catch(console.error);
