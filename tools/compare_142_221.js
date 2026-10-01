const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const old142Raw = execSync('git show cefd3a0:apps/web/data/lab_store.json', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  const source142 = JSON.parse(old142Raw).tests || [];

  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/backups/pre_recovery_20260930/lab_server.db' } } });
  const source221 = await p.testCatalog.findMany();
  await p.$disconnect();

  console.log('source142 count:', source142.length);
  console.log('source221 count:', source221.length);

  const set142Names = new Set(source142.map(t => t.name.trim().toLowerCase()));
  const set142Codes = new Set(source142.map(t => (t.code || '').trim().toLowerCase()).filter(Boolean));

  const in221NotIn142 = source221.filter(t => !set142Names.has(t.name.trim().toLowerCase()) && (!t.code || !set142Codes.has(t.code.trim().toLowerCase())));
  console.log('Tests in 221 but not in 142:', in221NotIn142.length);

  const in142NotIn221 = source142.filter(t => !source221.some(t2 => t2.name.trim().toLowerCase() === t.name.trim().toLowerCase() || (t.code && t2.code && t.code.trim().toLowerCase() === t2.code.trim().toLowerCase())));
  console.log('Tests in 142 but not in 221:', in142NotIn221.length);
}

main().catch(console.error);
