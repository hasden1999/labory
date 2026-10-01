const { PrismaClient } = require('@prisma/client');

async function checkRefs() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const ids = [
    'cmu8t1int0002ggs4qmmcozcv', 't-hb',
    'test_1790828697869_kkwr6', 'test_1790828764556_h7w3m', 'test_1790829605686_p4j7e', 'test_1790835687268_62rni', 't-mg',
    'cmuoj16fr003pq8spqzyyssic', 't-ckmb',
    'cmt8fowuf001jijmd4sy80buo', 't-prg',
    'cmt8fowwt0029ijmdb0ib3hd5', 't-fpsa',
    'test_1790788415091_im6y5', 'test_1790788540254_0p64a', 'test_1790804509333_jgfbv', 'test_1790801986417_pyd4b'
  ];

  console.log('ID                             | Samples | Panels | Devices | RefRanges');
  console.log('----------------------------------------------------------------------');
  for (const id of ids) {
    const st = await p.sampleTest.count({ where: { testId: id } });
    const pi = await p.testPanelItem.count({ where: { testId: id } });
    const dm = await p.deviceTestMapping.count({ where: { testCatalogId: id } });
    const rr = await p.referenceRange.count({ where: { testId: id } });
    console.log(`${id.padEnd(30)} | ${String(st).padStart(7)} | ${String(pi).padStart(6)} | ${String(dm).padStart(7)} | ${String(rr).padStart(9)}`);
  }
  await p.$disconnect();
}

checkRefs().catch(console.error);
