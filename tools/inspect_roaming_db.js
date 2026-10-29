const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = 'file:C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab.db';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Roaming lab.db ===');
  const tests = await prisma.testCatalog.findMany({
    select: { id: true, code: true, name: true, arabicName: true }
  });
  console.log('Total tests in roaming lab.db:', tests.length);

  const ureas = tests.filter(t => /urea|يوريا/i.test(t.name) || /urea|يوريا/i.test(t.arabicName || '') || /urea/i.test(t.code || ''));
  console.log('Urea-related tests in lab.db:');
  ureas.forEach(u => console.log(' -', u.id, u.code, u.name, `(${u.arabicName})`));

  console.log('\nAll Panels in roaming lab.db:');
  const panels = await prisma.testPanel.findMany({
    include: { items: { include: { test: true } } }
  });
  panels.forEach(p => {
    console.log(`[${p.id}] ${p.name} (${p.items.length} items)`);
    p.items.forEach(item => {
      console.log(`    -> ${item.test?.id || item.testId} : ${item.test?.code} : ${item.test?.name}`);
    });
  });

  console.log('\n=== Checking Roaming lab_store.json ===');
  const jsonPath = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab_store.json';
  if (fs.existsSync(jsonPath)) {
    const store = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('Panels in lab_store.json:', store.panels?.length);
    store.panels?.forEach(p => {
      console.log(`[${p.id}] ${p.name} - testIds:`, p.testIds);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
