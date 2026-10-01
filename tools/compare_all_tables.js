const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function getCounts(dbUrl) {
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    const tables = [
      'TestCatalog', 'TestPanel', 'TestPanelItem',
      'Patient', 'Sample', 'SampleTest',
      'FinancialTransaction', 'DebtRecord', 'Debtor',
      'Expense', 'ReferringDoctor', 'Settings',
      'Staff', 'LabDevice', 'IncomingResult', 'DeviceRawLog', 'License'
    ];
    const res = {};
    for (const t of tables) {
      try {
        const c = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${t}"`);
        res[t] = Number(c[0]?.c || 0);
      } catch (e) {
        res[t] = 'N/A';
      }
    }
    return res;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dbs = [
    { name: '1. AppData Running SQLite (Actual User)', url: 'file:C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab.db' },
    { name: '2. Pre-Recovery Backup (30-09-2026)', url: 'file:D:/lab/backups/pre_recovery_20260930/lab_server.db' },
    { name: '3. Web Data DB (21-09-2026)', url: 'file:D:/lab/apps/web/data/lab.db' },
    { name: '4. Active Repo Server DB (30-09-2026)', url: 'file:D:/lab/apps/server/prisma/lab.db' },
  ];

  const results = {};
  for (const d of dbs) {
    results[d.name] = await getCounts(d.url);
  }

  // Also check AppData JSON store counts
  const appDataJson = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab_store.json';
  if (fs.existsSync(appDataJson)) {
    const s = JSON.parse(fs.readFileSync(appDataJson, 'utf8'));
    results['5. AppData Running JSON Store'] = {
      TestCatalog: s.tests?.length || 0,
      TestPanel: s.panels?.length || 0,
      TestPanelItem: 'N/A',
      Patient: s.patients?.length || 0,
      Sample: s.samples?.length || 0,
      SampleTest: s.samples?.reduce((acc, smp) => acc + (smp.tests?.length || 0), 0) || 0,
      FinancialTransaction: 'N/A',
      DebtRecord: s.debtTransactions?.length || 0,
      Debtor: s.debtors?.length || 0,
      Expense: s.expenses?.length || 0,
      ReferringDoctor: s.doctors?.length || 0,
      Settings: s.settings ? 1 : 0,
      Staff: 'N/A',
      LabDevice: s.devices?.length || 0,
      IncomingResult: s.incomingResults?.length || 0,
      DeviceRawLog: s.deviceRawLogs?.length || 0,
      License: s.license ? 1 : 0
    };
  }

  console.log('TABLE AUDIT COMPARISON MATRIX:');
  console.table(results);
}

main().catch(console.error);
