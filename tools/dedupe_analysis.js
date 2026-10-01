const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

function cleanString(str) {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF\u00A0]/g, '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/[()_.\-\/\\:;,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractTokens(str) {
  const cleaned = cleanString(str);
  return cleaned ? cleaned.split(' ').filter(w => w.length > 1) : [];
}

async function deepAudit() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const allTests = await p.testCatalog.findMany({
    include: {
      _count: {
        select: {
          sampleTests: true,
          panelItems: true,
          deviceMappings: true,
          referenceRanges: true
        }
      },
      referenceRanges: true,
      panelItems: {
        include: {
          panel: true
        }
      }
    }
  });

  console.log(`Auditing ${allTests.length} tests in server DB...`);

  const groups = [];
  const processed = new Set();

  for (let i = 0; i < allTests.length; i++) {
    const t1 = allTests[i];
    if (processed.has(t1.id)) continue;

    const groupMembers = [t1];
    const n1 = cleanString(t1.name);
    const a1 = cleanString(t1.arabicName);
    const c1 = (t1.code || '').trim().toUpperCase();
    const tokens1 = new Set(extractTokens(t1.name));

    for (let j = i + 1; j < allTests.length; j++) {
      const t2 = allTests[j];
      if (processed.has(t2.id)) continue;

      const n2 = cleanString(t2.name);
      const a2 = cleanString(t2.arabicName);
      const c2 = (t2.code || '').trim().toUpperCase();
      const tokens2 = new Set(extractTokens(t2.name));

      let matchType = null;
      let matchConfidence = 0;

      // 1. Exact normalized English name
      if (n1 && n2 && n1 === n2) {
        matchType = 'EXACT_NORMALIZED_NAME';
        matchConfidence = 1.0;
      }
      // 2. Exact code match
      else if (c1 && c2 && c1 === c2) {
        matchType = 'EXACT_CODE';
        matchConfidence = 0.95;
      }
      // 3. Exact normalized Arabic name
      else if (a1 && a2 && a1 === a2) {
        matchType = 'EXACT_ARABIC_NAME';
        matchConfidence = 0.95;
      }
      // 4. Token subset / inclusion (e.g. "serum magnesium test" vs "magnesium")
      else if (tokens1.size > 0 && tokens2.size > 0) {
        const intersection = [...tokens1].filter(x => tokens2.has(x));
        const union = new Set([...tokens1, ...tokens2]);
        const jaccard = intersection.length / union.size;
        
        // If one is "magnesium" and the other is "serum magnesium test"
        const coreWords1 = [...tokens1].filter(w => !['serum', 'test', 'blood', 'total', 'fahs', 'tahlil'].includes(w));
        const coreWords2 = [...tokens2].filter(w => !['serum', 'test', 'blood', 'total', 'fahs', 'tahlil'].includes(w));
        
        if (coreWords1.length > 0 && coreWords2.length > 0 && coreWords1.every(w => coreWords2.includes(w)) && coreWords2.every(w => coreWords1.includes(w))) {
          matchType = 'CORE_TOKEN_MATCH';
          matchConfidence = 0.85;
        }
      }

      if (matchType) {
        groupMembers.push({ ...t2, matchType, matchConfidence });
        processed.add(t2.id);
      }
    }

    if (groupMembers.length > 1) {
      processed.add(t1.id);
      groups.push({
        primary: t1,
        members: groupMembers
      });
    }
  }

  console.log(`\nFound ${groups.length} matching groups across the catalog:`);
  
  for (const g of groups) {
    console.log(`\n======================================================`);
    console.log(`GROUP: "${g.primary.name}" (Count: ${g.members.length})`);
    for (const m of g.members) {
      const pCount = m.panelItems ? m.panelItems.length : 0;
      console.log(`  ID: ${m.id}`);
      console.log(`     Code: ${m.code} | Arabic: ${m.arabicName}`);
      console.log(`     Cat: ${m.category} | Specimen: ${m.sampleType} | Unit: ${m.unit} | Price: ${m.price}`);
      console.log(`     Usage -> SampleTests: ${m._count.sampleTests}, Panels: ${pCount}, Devices: ${m._count.deviceMappings}`);
      if (m.panelItems && m.panelItems.length > 0) {
        console.log(`     Panels:`, m.panelItems.map(pi => pi.panel.name).join(', '));
      }
    }
  }

  await p.$disconnect();
}

deepAudit().catch(console.error);
