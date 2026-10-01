const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } }
});

async function main() {
  const total = await prisma.testCatalog.count();
  const activeCount = await prisma.testCatalog.count({ where: { active: true } });
  const inactiveCount = await prisma.testCatalog.count({ where: { active: false } });
  console.log('Total TestCatalog:', total);
  console.log('Active (true):', activeCount);
  console.log('Inactive (false):', inactiveCount);

  const categories = await prisma.testCatalog.groupBy({
    by: ['category', 'active'],
    _count: { id: true }
  });
  console.log('Categories breakdown:');
  console.table(categories);

  const allTests = await prisma.testCatalog.findMany({
    select: { id: true, code: true, name: true, arabicName: true, category: true, active: true }
  });

  const inactiveTests = allTests.filter(t => !t.active);
  console.log(`Inactive tests count: ${inactiveTests.length}`);
  if (inactiveTests.length > 0) {
    console.log('Sample of inactive tests:');
    console.table(inactiveTests.slice(0, 15));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
