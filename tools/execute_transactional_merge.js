const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 [PART 1] Executing Transactional Deduplication & Catalog Unification...');

  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } }
  });

  // 1. Backup current records for Undo Script
  const allTestsBefore = await prisma.testCatalog.findMany({
    include: {
      referenceRanges: true,
      sampleTests: true,
      panelItems: true,
      deviceMappings: true
    }
  });

  const undoData = {
    timestamp: new Date().toISOString(),
    testsBackup: allTestsBefore,
    actions: []
  };

  const MERGE_OPERATIONS = [
    // 1. Hemoglobin: cmu8t1int0002ggs4qmmcozcv -> t-hb
    {
      targetId: 't-hb',
      sourceIds: ['cmu8t1int0002ggs4qmmcozcv'],
      name: 'Hemoglobin',
      unionData: {
        code: 'HB',
        arabicName: 'خضاب الدم (الهيموغلوبين)',
        category: 'أمراض الدم والتخثر',
        sampleType: 'دم كامل (EDTA)',
        unit: 'g/dL',
        price: 5000,
        costEstimate: 800
      }
    },
    // 2. Serum Magnesium: test_179082... -> t-mg
    {
      targetId: 't-mg',
      sourceIds: [
        'test_1790828697869_kkwr6',
        'test_1790828764556_h7w3m',
        'test_1790829605686_p4j7e',
        'test_1790835687268_62rni'
      ],
      name: 'Serum Magnesium',
      unionData: {
        code: 'MG',
        arabicName: 'المغنيسيوم في الدم',
        category: 'المعادن والفيتامينات',
        sampleType: 'مصل الدم (Serum)',
        unit: 'mg/dL',
        price: 8000,
        costEstimate: 1500
      }
    },
    // 3. CK-MB: cmuoj16fr003pq8spqzyyssic -> t-ckmb
    {
      targetId: 't-ckmb',
      sourceIds: ['cmuoj16fr003pq8spqzyyssic'],
      name: 'Creatine Kinase-MB (CK-MB)',
      unionData: {
        code: 'CK-MB',
        arabicName: 'إنزيم كرياتين كيناز القلبي (CK-MB)',
        category: 'دهون الدم وصحة القلب',
        price: 20000,
        costEstimate: 4000
      }
    },
    // 4. Progesterone: cmt8fowuf001jijmd4sy80buo -> t-prg
    {
      targetId: 't-prg',
      sourceIds: ['cmt8fowuf001jijmd4sy80buo'],
      name: 'Progesterone',
      unionData: {
        code: 'PRG',
        arabicName: 'هرمون البروجسترون (هرمون التبويض والحمل)',
        category: 'الغدة الدرقية والهرمونات',
        price: 25000,
        costEstimate: 5000
      }
    },
    // 5. Free PSA: cmt8fowwt0029ijmdb0ib3hd5 -> t-fpsa
    {
      targetId: 't-fpsa',
      sourceIds: ['cmt8fowwt0029ijmdb0ib3hd5'],
      name: 'Free PSA',
      unionData: {
        code: 'FPSA',
        arabicName: 'دلالات البروستات النوعية الحرة (Free PSA)',
        category: 'دلالات الأورام',
        price: 30000,
        costEstimate: 6000
      }
    },
    // 6. Test artifacts with zero usage
    {
      targetId: null,
      sourceIds: [
        'test_1790788415091_im6y5',
        'test_1790788540254_0p64a',
        'test_1790804509333_jgfbv',
        'test_1790801986417_pyd4b'
      ],
      name: 'E2E & Test Debris'
    }
  ];

  await prisma.$transaction(async (tx) => {
    for (const op of MERGE_OPERATIONS) {
      console.log(`Processing group: ${op.name}...`);

      if (op.targetId) {
        // Union data into survivor
        await tx.testCatalog.update({
          where: { id: op.targetId },
          data: op.unionData
        });
        undoData.actions.push({ action: 'UPDATE_TARGET', targetId: op.targetId });

        for (const srcId of op.sourceIds) {
          // Re-point SampleTest
          const stUpdated = await tx.sampleTest.updateMany({
            where: { testId: srcId },
            data: { testId: op.targetId }
          });
          console.log(`  - Re-pointed ${stUpdated.count} SampleTests from ${srcId} to ${op.targetId}`);
          undoData.actions.push({ action: 'REPOINT_SAMPLE_TEST', from: srcId, to: op.targetId, count: stUpdated.count });

          // Re-point TestPanelItem
          const piUpdated = await tx.testPanelItem.updateMany({
            where: { testId: srcId },
            data: { testId: op.targetId }
          });
          if (piUpdated.count > 0) {
            console.log(`  - Re-pointed ${piUpdated.count} PanelItems from ${srcId} to ${op.targetId}`);
          }

          // Re-point DeviceTestMapping
          const dmUpdated = await tx.deviceTestMapping.updateMany({
            where: { testCatalogId: srcId },
            data: { testCatalogId: op.targetId }
          });
          if (dmUpdated.count > 0) {
            console.log(`  - Re-pointed ${dmUpdated.count} DeviceMappings from ${srcId} to ${op.targetId}`);
          }

          // Re-point ReferenceRange
          const rrUpdated = await tx.referenceRange.updateMany({
            where: { testId: srcId },
            data: { testId: op.targetId }
          });
          if (rrUpdated.count > 0) {
            console.log(`  - Re-pointed ${rrUpdated.count} ReferenceRanges from ${srcId} to ${op.targetId}`);
          }
        }
      }

      // Delete doomed source IDs only when references reach zero
      for (const srcId of op.sourceIds) {
        const remainingSamples = await tx.sampleTest.count({ where: { testId: srcId } });
        const remainingPanels = await tx.testPanelItem.count({ where: { testId: srcId } });
        const remainingDevices = await tx.deviceTestMapping.count({ where: { testCatalogId: srcId } });

        if (remainingSamples === 0 && remainingPanels === 0 && remainingDevices === 0) {
          await tx.testCatalog.delete({ where: { id: srcId } });
          console.log(`  - Safely deleted duplicate test ${srcId} (0 references).`);
          undoData.actions.push({ action: 'DELETE_SOURCE', id: srcId });
        } else {
          throw new Error(`Safety violation: Cannot delete ${srcId} because references remain (samples: ${remainingSamples}, panels: ${remainingPanels}, devices: ${remainingDevices})`);
        }
      }
    }
  });

  // Save Undo Script
  const undoPath = path.join('D:/lab/tools', 'undo_merge_20261001.json');
  fs.writeFileSync(undoPath, JSON.stringify(undoData, null, 2), 'utf8');
  console.log(`\n💾 Undo script saved to: ${undoPath}`);

  // Count after merge
  const finalCount = await prisma.testCatalog.count({ where: { active: true } });
  const totalCount = await prisma.testCatalog.count();
  console.log(`\n======================================================`);
  console.log(`Catalog Count Before: ${allTestsBefore.length}`);
  console.log(`Catalog Count After (Active): ${finalCount}`);
  console.log(`Total Records in DB: ${totalCount}`);
  console.log(`======================================================`);

  // Sync to lab_store.json to guarantee 100% store alignment
  const updatedDbTests = await prisma.testCatalog.findMany({
    include: { referenceRanges: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });

  const storePath = 'D:/lab/apps/desktop/engine/data/lab_store.json';
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, 'utf8');
    const store = JSON.parse(raw);
    store.tests = updatedDbTests.map(t => ({
      id: t.id,
      code: t.code,
      name: t.name,
      arabicName: t.arabicName,
      category: t.category,
      price: t.price,
      cost: t.costEstimate,
      costEstimate: t.costEstimate,
      refRangeLow: t.refRangeLow,
      refRangeHigh: t.refRangeHigh,
      normalMaleLow: t.normalMaleLow,
      normalMaleHigh: t.normalMaleHigh,
      normalFemaleLow: t.normalFemaleLow,
      normalFemaleHigh: t.normalFemaleHigh,
      criticalLow: t.criticalLow,
      criticalHigh: t.criticalHigh,
      refRangeText: t.refRangeText,
      unit: t.unit,
      sampleType: t.sampleType,
      active: t.active,
      referenceRanges: t.referenceRanges || []
    }));
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log(`Updated lab_store.json with exactly ${store.tests.length} canonical tests.`);

    // Copy to apps/web/data/lab_store.json
    const webStorePath = 'D:/lab/apps/web/data/lab_store.json';
    fs.writeFileSync(webStorePath, JSON.stringify(store, null, 2), 'utf8');
  }

  // Also sync apps/web/data/lab.db if it exists by copying the clean server lab.db
  if (fs.existsSync('D:/lab/apps/web/data/lab.db')) {
    fs.copyFileSync('D:/lab/apps/server/prisma/lab.db', 'D:/lab/apps/web/data/lab.db');
    console.log('Synchronized apps/web/data/lab.db with clean server database.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
