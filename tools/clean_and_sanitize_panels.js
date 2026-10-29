const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const CANONICAL_PANELS = [
  {
    id: 'p-5',
    name: 'باقة دهون الدم وصحة القلب (Lipid & Cardiovascular Panel)',
    description: 'الكوليسترول الكلي، الدهون الثلاثية، الكوليسترول النافع HDL، والكوليسترول الضار LDL',
    price: 25000,
    testCodes: ['CHOL', 'TG', 'HDL', 'LDL'],
    testIds: ['t-chol', 't-tg', 't-hdl', 't-ldl'],
  },
  {
    id: 'p-3',
    name: 'باقة وظائف الكلى والأملاح الشاملة (KFT & Electrolytes Panel)',
    description: 'الكرياتينين، اليوريا، وحمض اليوريك',
    price: 20000,
    testCodes: ['UREA', 'CREAT', 'URIC'],
    testIds: ['t-urea', 't-creat', 't-uric'],
  },
  {
    id: 'p-4',
    name: 'باقة وظائف الكبد والمرارة الكاملة (Complete LFT Panel)',
    description: 'إنزيمات الكبد AST و ALT، الفوسفاتاز القلوي، والبيليروبين الكلي',
    price: 25000,
    testCodes: ['GPT', 'GOT', 'TSB', 'ALP'],
    testIds: ['t-gpt', 't-got', 't-tsb', 't-alp'],
  },
  {
    id: 'p-2',
    name: 'باقة متابعة مرضى السكري المتكاملة (Diabetic Care Panel)',
    description: 'يشمل السكر الصائم والسكر التراكمي',
    price: 20000,
    testCodes: ['FBS', 'HBA1C'],
    testIds: ['t-fbs', 't-hba1c'],
  },
  {
    id: 'p-6',
    name: 'باقة الغدة الدرقية الكاملة (Thyroid Health Panel)',
    description: 'هرمون المحفز للدرقية TSH، الثايروكسين الحر Free T4، وثلاثي اليود الحر Free T3',
    price: 50000,
    testCodes: ['TSH', 'FT4', 'FT3'],
    testIds: ['t-tsh', 't-ft4', 't-ft3'],
  },
];

async function cleanSqliteDb(dbFilePath) {
  if (!fs.existsSync(dbFilePath)) {
    console.log('Skipping non-existent SQLite db:', dbFilePath);
    return;
  }
  console.log('\n--- Cleaning SQLite Database:', dbFilePath, '---');
  const normalizedUrl = 'file:' + dbFilePath.replace(/\\/g, '/');
  const prisma = new PrismaClient({
    datasources: { db: { url: normalizedUrl } },
  });

  try {
    const existingPanels = await prisma.testPanel.findMany();
    const canonicalIds = new Set(CANONICAL_PANELS.map((p) => p.id));

    // Delete obsolete non-canonical, non-user panels
    for (const ep of existingPanels) {
      const isCanonical = canonicalIds.has(ep.id);
      const isUserCustom = String(ep.id).startsWith('panel_');
      if (!isCanonical && !isUserCustom) {
        console.log(`  Deleting obsolete panel: [${ep.id}] ${ep.name}`);
        await prisma.testPanelItem.deleteMany({ where: { panelId: ep.id } });
        await prisma.testPanel.delete({ where: { id: ep.id } });
      }
    }

    // Upsert canonical panels with EXACT test items
    for (const cp of CANONICAL_PANELS) {
      console.log(`  Upserting canonical panel: [${cp.id}] ${cp.name}`);
      await prisma.testPanel.upsert({
        where: { id: cp.id },
        update: {
          name: cp.name,
          description: cp.description,
          price: cp.price,
        },
        create: {
          id: cp.id,
          name: cp.name,
          description: cp.description,
          price: cp.price,
        },
      });

      // Clear existing items and insert canonical test items cleanly
      await prisma.testPanelItem.deleteMany({ where: { panelId: cp.id } });
      for (const tId of cp.testIds) {
        // Verify test exists in testCatalog
        const tExists = await prisma.testCatalog.findUnique({ where: { id: tId } });
        if (tExists) {
          await prisma.testPanelItem.create({
            data: {
              panelId: cp.id,
              testId: tId,
            },
          });
        }
      }
    }

    const afterPanels = await prisma.testPanel.findMany({ include: { items: true } });
    console.log(`  Finished cleaning SQLite db. Total active panels: ${afterPanels.length}`);
    afterPanels.forEach((p) => console.log(`   - [${p.id}] ${p.name} (${p.items.length} items)`));
  } catch (err) {
    console.error('Error cleaning SQLite db:', err);
  } finally {
    await prisma.$disconnect();
  }
}

function cleanJsonStore(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    console.log('Skipping non-existent JSON store:', jsonPath);
    return;
  }
  console.log('\n--- Cleaning JSON Store:', jsonPath, '---');
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const store = JSON.parse(raw);
    const canonicalIds = new Set(CANONICAL_PANELS.map((p) => p.id));

    // Preserve user custom panels
    const customPanels = (store.panels || []).filter((p) => {
      if (!p || !p.id) return false;
      return String(p.id).startsWith('panel_');
    });

    // Clean user custom panels of duplicate testIds
    customPanels.forEach((p) => {
      p.testIds = Array.from(new Set(p.testIds || []));
      p.items = (p.testIds || []).map((tId) => ({
        panelId: p.id,
        testId: tId,
        test: (store.tests || []).find((t) => t.id === tId),
      }));
    });

    // Build the clean canonical list
    const cleanCanonical = CANONICAL_PANELS.map((cp) => ({
      ...cp,
      isActive: true,
      items: cp.testIds.map((tId) => ({
        panelId: cp.id,
        testId: tId,
        test: (store.tests || []).find((t) => t.id === tId),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    store.panels = [...cleanCanonical, ...customPanels];
    fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), 'utf8');
    console.log(`  Finished cleaning JSON store. Total panels: ${store.panels.length} (5 canonical + ${customPanels.length} custom)`);
  } catch (err) {
    console.error('Error cleaning JSON store:', err);
  }
}

async function run() {
  const sqlitePaths = [
    'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab.db',
    path.resolve(__dirname, '../apps/server/prisma/lab.db'),
  ];

  for (const sp of sqlitePaths) {
    await cleanSqliteDb(sp);
  }

  const jsonPaths = [
    'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/lab_store.json',
    path.resolve(__dirname, '../apps/web/data/lab_store.json'),
    path.resolve(__dirname, '../apps/desktop/engine/standalone/data/lab_store.json'),
    path.resolve(__dirname, '../apps/desktop/engine/standalone/apps/web/data/lab_store.json'),
  ];

  for (const jp of jsonPaths) {
    cleanJsonStore(jp);
  }

  console.log('\nAll databases and stores successfully cleaned and sanitized!');
}

run().catch(console.error);
