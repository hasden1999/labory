const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const mappings = await p.deviceTestMapping.findMany({
    where: { testCatalogId: { in: ['cmu8t1int0002ggs4qmmcozcv', 't-hb'] } },
    include: { device: true }
  });
  console.log('Hemoglobin device mappings:', JSON.stringify(mappings, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
