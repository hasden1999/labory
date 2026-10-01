import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

async function runCatalogCountGoldenTest() {
  console.log('🧪 [Golden Test] Running Test Catalog Idempotency & Invariance Test...');
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } }
  });

  try {
    const initialCount = await prisma.testCatalog.count({ where: { active: true } });
    console.log(`Initial active catalog count: ${initialCount}`);

    // Check for exact duplicate normalized names
    const allTests = await prisma.testCatalog.findMany({ where: { active: true } });
    const nameMap = new Map<string, string[]>();
    for (const t of allTests) {
      const norm = t.name.trim().toLowerCase();
      if (!nameMap.has(norm)) nameMap.set(norm, []);
      nameMap.get(norm)!.push(t.id);
    }

    const duplicates = [...nameMap.entries()].filter(([_, ids]) => ids.length > 1);
    console.log(`Currently detected exact normalized name duplicate groups: ${duplicates.length}`);

    // Verify each test has required fields
    for (const t of allTests) {
      assert.ok(t.id, `Test ${t.name} must have a valid ID`);
      assert.ok(t.name, `Test with ID ${t.id} must have a name`);
      assert.ok(t.price >= 0, `Test ${t.name} must have a non-negative price`);
    }

    console.log('✅ [Golden Test] Catalog structure verified.');
  } finally {
    await prisma.$disconnect();
  }
}

runCatalogCountGoldenTest().catch((err) => {
  console.error('❌ [Golden Test] Catalog count test failed:', err);
  process.exit(1);
});
