const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function checkDb(dbPath, label) {
  console.log(`\n========================================`);
  console.log(`Checking Database [${label}]: ${dbPath}`);
  console.log(`========================================`);
  
  if (!fs.existsSync(dbPath)) {
    console.log(`File does not exist: ${dbPath}`);
    return null;
  }

  const stat = fs.statSync(dbPath);
  console.log(`File size: ${stat.size} bytes, modified: ${stat.mtime}`);

  const prisma = new PrismaClient({
    datasources: {
      db: { url: `file:${dbPath}?connection_limit=1` }
    }
  });

  try {
    const integrity = await prisma.$queryRawUnsafe('PRAGMA integrity_check;');
    console.log('PRAGMA integrity_check:', integrity);

    const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    console.log('Tables found:', tables.map(t => t.name).join(', '));

    const counts = {};
    for (const t of tables) {
      if (t.name.startsWith('sqlite_') || t.name === '_prisma_migrations') continue;
      try {
        const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${t.name}"`);
        counts[t.name] = Number(countRes[0]?.c || 0);
      } catch (e) {
        counts[t.name] = `Error: ${e.message}`;
      }
    }
    console.log('Record counts:', JSON.stringify(counts, null, 2));

    // Specifically check Test / LabTest / Catalog tables
    let testRows = [];
    if (counts['Test'] !== undefined) {
      testRows = await prisma.$queryRawUnsafe('SELECT id, name, code, categoryId, isDeleted, status FROM "Test"');
      console.log(`Test table records: ${testRows.length}`);
    } else if (counts['LabTest'] !== undefined) {
      testRows = await prisma.$queryRawUnsafe('SELECT * FROM "LabTest"');
      console.log(`LabTest table records: ${testRows.length}`);
    }

    return { counts, testRows };
  } catch (err) {
    console.error('Error querying DB:', err);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dbs = [
    { label: 'Active Server DB', path: 'D:/lab/apps/server/prisma/lab.db' },
    { label: 'Emergency Backup Server DB', path: 'D:/lab/backups/emergency_backup_20260930_phase1/D__lab_apps_server_prisma/lab.db' },
    { label: 'Active Web Data DB', path: 'D:/lab/apps/web/data/lab.db' },
    { label: 'Backup 20260920', path: 'D:/lab/backups/20260920_082942/lab_clinical_20260920_082942.db' },
    { label: 'Backup pre_recovery_20260930', path: 'D:/lab/backups/pre_recovery_20260930/lab_server.db' },
    { label: 'Backup migration_1790776694800', path: 'D:/lab/backups/migration_1790776694800/lab.db' }
  ];

  for (const d of dbs) {
    await checkDb(d.path, d.label);
  }
}

main().catch(console.error);
