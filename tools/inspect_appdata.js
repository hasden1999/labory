const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const appDataDb = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab.db';
  const appDataJson = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab_store.json';

  console.log('=== INSPECTING ACTUAL RUNNING USER APPDATA DATA ===\n');

  // Check JSON
  if (fs.existsSync(appDataJson)) {
    const store = JSON.parse(fs.readFileSync(appDataJson, 'utf8'));
    console.log('JSON Store tests count:', store.tests ? store.tests.length : 'none');
    console.log('JSON Store panels count:', store.panels ? store.panels.length : 'none');
    console.log('JSON Store patients count:', store.patients ? store.patients.length : 'none');
    console.log('JSON Store samples count:', store.samples ? store.samples.length : 'none');
    console.log('JSON Store doctors count:', store.doctors ? store.doctors.length : 'none');
    console.log('JSON Store expenses count:', store.expenses ? store.expenses.length : 'none');
    console.log('JSON Store settings:', store.settings?.labName || 'No lab name');
    
    // Check if active tests filter gives 72!
    if (store.tests) {
      const active = store.tests.filter(t => t.active !== false);
      const inactive = store.tests.filter(t => t.active === false);
      console.log('JSON Store active tests:', active.length, 'inactive tests:', inactive.length);

      // Check unique test names
      const names = store.tests.map(t => t.name);
      console.log('First 5 tests:', names.slice(0, 5));
    }
  }

  // Check SQLite
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${appDataDb}?connection_limit=1` } }
  });

  try {
    const integrity = await prisma.$queryRawUnsafe('PRAGMA integrity_check;');
    console.log('\nSQLite integrity_check:', integrity);

    const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    const counts = {};
    for (const t of tables) {
      if (t.name.startsWith('sqlite_') || t.name === '_prisma_migrations') continue;
      try {
        const c = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${t.name}"`);
        counts[t.name] = Number(c[0]?.c || 0);
      } catch (e) {
        counts[t.name] = e.message;
      }
    }
    console.log('SQLite Table record counts:', JSON.stringify(counts, null, 2));

    const totalTests = await prisma.testCatalog.count();
    const activeTests = await prisma.testCatalog.count({ where: { active: true } });
    const inactiveTests = await prisma.testCatalog.count({ where: { active: false } });
    console.log(`SQLite TestCatalog: total = ${totalTests}, active = ${activeTests}, inactive = ${inactiveTests}`);

    // Check tests in SQLite
    const tests = await prisma.testCatalog.findMany({ select: { id: true, code: true, name: true, active: true } });
    console.log('SQLite tests count:', tests.length);

    // Check backups folder in AppData
    const backupsDir = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/backups';
    if (fs.existsSync(backupsDir)) {
      const bFiles = fs.readdirSync(backupsDir);
      console.log('\nBackups found in AppData backups dir:', bFiles);
      for (const bf of bFiles) {
        if (bf.endsWith('.json')) {
          try {
            const bJson = JSON.parse(fs.readFileSync(path.join(backupsDir, bf), 'utf8'));
            console.log(`Snapshot ${bf}: tests = ${bJson.tests?.length}, samples = ${bJson.samples?.length}, patients = ${bJson.patients?.length}`);
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error('Error inspecting AppData SQLite:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
