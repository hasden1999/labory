import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const dbPaths = [
  'D:/lab/apps/server/prisma/lab.db',
  'D:/lab/apps/web/prisma/lab.db',
  'D:/lab/apps/web/data/lab.db',
  'D:/lab/apps/desktop/engine/data/lab.db',
];

async function migrate() {
  for (const dbPath of dbPaths) {
    if (!fs.existsSync(dbPath)) continue;
    console.log(`Processing SQLite DB: ${dbPath}`);
    const prisma = new PrismaClient({
      datasources: { db: { url: `file:${dbPath.replace(/\\/g, '/')}` } },
    });

    try {
      const cols: any = await prisma.$queryRawUnsafe('PRAGMA table_info(TestCatalog);');
      const colNames = Array.isArray(cols) ? cols.map((c: any) => c.name) : [];
      if (!colNames.includes('tubeType')) {
        console.log(`Adding tubeType column to ${dbPath}...`);
        await prisma.$queryRawUnsafe('ALTER TABLE "TestCatalog" ADD COLUMN "tubeType" TEXT;');
      }

      // Seed defaults for known key tests
      await prisma.$queryRawUnsafe(`
        UPDATE "TestCatalog" SET "tubeType" = 'EDTA' WHERE ("code" = 'CBC' OR "name" LIKE '%CBC%' OR "name" LIKE '%Complete Blood Count%') AND "tubeType" IS NULL;
      `);
      await prisma.$queryRawUnsafe(`
        UPDATE "TestCatalog" SET "tubeType" = 'Citrate' WHERE ("code" = 'ESR' OR "code" = 'PT' OR "code" = 'PTT') AND "tubeType" IS NULL;
      `);
      await prisma.$queryRawUnsafe(`
        UPDATE "TestCatalog" SET "tubeType" = 'Urine cup' WHERE ("code" = 'GUE' OR "name" LIKE '%Urine%') AND "tubeType" IS NULL;
      `);
      await prisma.$queryRawUnsafe(`
        UPDATE "TestCatalog" SET "tubeType" = 'Stool cup' WHERE ("code" = 'GSE' OR "name" LIKE '%Stool%') AND "tubeType" IS NULL;
      `);
      await prisma.$queryRawUnsafe(`
        UPDATE "TestCatalog" SET "tubeType" = 'SST' WHERE "tubeType" IS NULL;
      `);

      console.log(`✅ DB migrated successfully: ${dbPath}`);
    } catch (err) {
      console.error(`Error migrating ${dbPath}:`, err);
    } finally {
      await prisma.$disconnect();
    }
  }
}

migrate();
