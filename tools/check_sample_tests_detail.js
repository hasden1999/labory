const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const ids = [
    'cmu8t1int0002ggs4qmmcozcv',
    'test_1790828697869_kkwr6',
    'test_1790828764556_h7w3m',
    'test_1790829605686_p4j7e',
    'test_1790835687268_62rni'
  ];
  const stList = await p.sampleTest.findMany({
    where: { testId: { in: ids } },
    include: { sample: true }
  });
  console.log(`Found ${stList.length} SampleTests:`);
  for (const st of stList) {
    console.log(`ST ID: ${st.id} | Sample: ${st.sample.sampleNumber} | TestId: ${st.testId} | Result: ${st.resultValue} | Price: ${st.priceAtTime}`);
  }
  await p.$disconnect();
}

main().catch(console.error);
