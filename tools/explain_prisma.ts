import { prisma } from '../apps/server/src/prisma';

async function main() {
  console.log('=== EXPLAIN QUERY PLAN Patient search by name ===');
  const p1 = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM Patient WHERE name = "احمد"');
  console.log(p1);

  console.log('=== EXPLAIN QUERY PLAN Patient search by phone ===');
  const p2 = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM Patient WHERE phone = "07701234567"');
  console.log(p2);

  console.log('=== EXPLAIN QUERY PLAN TestCatalog search by code ===');
  const p3 = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM TestCatalog WHERE code = "CBC"');
  console.log(p3);

  console.log('=== EXPLAIN QUERY PLAN TestCatalog search by name ===');
  const p4 = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM TestCatalog WHERE name = "Glucose"');
  console.log(p4);

  console.log('=== EXPLAIN QUERY PLAN TestCatalog search by category and active ===');
  const p5 = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM TestCatalog WHERE category = "عام" AND active = 1');
  console.log(p5);

  console.log('=== EXPLAIN QUERY PLAN Sample filter by isDeleted, status, createdAt ===');
  const p6 = await prisma.$queryRawUnsafe('EXPLAIN QUERY PLAN SELECT * FROM Sample WHERE isDeleted = 0 AND status = "RECEIVED" ORDER BY createdAt DESC');
  console.log(p6);

  await prisma.$disconnect();
}

main().catch(console.error);
