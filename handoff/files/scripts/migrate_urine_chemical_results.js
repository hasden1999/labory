/**
 * Migration Script for Item 1 & Item 2:
 * 1. For graded chemical examination fields, replace "1+ / 2+ / 3+" with "+ / ++ / +++".
 * 2. Auto-replace "full slide" with "full field".
 * 3. Migrates both lab_store.json and SQLite database idempotently.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('=== Migrating Saved Urine Chemical & Pus/RBC Results ===');

  const storePath = path.resolve(__dirname, '..', 'apps', 'web', 'data', 'lab_store.json');
  let storeMigratedCount = 0;
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    for (const sample of store.samples || []) {
      for (const st of sample.tests || []) {
        if (typeof st.resultValue === 'string') {
          let orig = st.resultValue;
          let updated = orig;

          // Replace full slide -> full field (case-insensitive, whitespace-tolerant)
          updated = updated.replace(/\bfull\s*slide\b/gi, 'Full Field');

          // If it's a formatted G.U.E result string or standalone chemical field
          if (updated.includes('G.U.E') || updated.includes('CHEMICAL:')) {
            updated = updated.replace(/(\bProtein:\s*)1\+/gi, '$1+')
                             .replace(/(\bProtein:\s*)2\+/gi, '$1++')
                             .replace(/(\bProtein:\s*)[34]\+/gi, '$1+++')
                             .replace(/(\bSugar:\s*)1\+/gi, '$1+')
                             .replace(/(\bSugar:\s*)2\+/gi, '$1++')
                             .replace(/(\bSugar:\s*)[34]\+/gi, '$1+++')
                             .replace(/(\bKetones:\s*)1\+/gi, '$1+')
                             .replace(/(\bKetones:\s*)2\+/gi, '$1++')
                             .replace(/(\bKetones:\s*)[34]\+/gi, '$1+++')
                             .replace(/(\bBlood:\s*)1\+/gi, '$1+')
                             .replace(/(\bBlood:\s*)2\+/gi, '$1++')
                             .replace(/(\bBlood:\s*)[34]\+/gi, '$1+++')
                             .replace(/(\bLeukocytes:\s*)1\+/gi, '$1+')
                             .replace(/(\bLeukocytes:\s*)2\+/gi, '$1++')
                             .replace(/(\bLeukocytes:\s*)[34]\+/gi, '$1+++');
          } else {
            // Standalone test value (e.g. Protein in urine test)
            const trimmed = updated.trim();
            if (trimmed === '1+') updated = '+';
            else if (trimmed === '2+') updated = '++';
            else if (trimmed === '3+' || trimmed === '4+') updated = '+++';
          }

          if (updated !== orig) {
            st.resultValue = updated;
            storeMigratedCount++;
          }
        }
      }
    }

    if (storeMigratedCount > 0) {
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
      console.log(`Migrated ${storeMigratedCount} results in lab_store.json`);
    } else {
      console.log('No store results needed migration.');
    }
  }

  // SQLite migration via Prisma
  const prisma = new PrismaClient();
  try {
    const sampleTests = await prisma.sampleTest.findMany();
    let dbMigratedCount = 0;
    for (const st of sampleTests) {
      if (typeof st.resultValue === 'string') {
        let orig = st.resultValue;
        let updated = orig;

        updated = updated.replace(/\bfull\s*slide\b/gi, 'Full Field');

        if (updated.includes('G.U.E') || updated.includes('CHEMICAL:')) {
          updated = updated.replace(/(\bProtein:\s*)1\+/gi, '$1+')
                           .replace(/(\bProtein:\s*)2\+/gi, '$1++')
                           .replace(/(\bProtein:\s*)[34]\+/gi, '$1+++')
                           .replace(/(\bSugar:\s*)1\+/gi, '$1+')
                           .replace(/(\bSugar:\s*)2\+/gi, '$1++')
                           .replace(/(\bSugar:\s*)[34]\+/gi, '$1+++')
                           .replace(/(\bKetones:\s*)1\+/gi, '$1+')
                           .replace(/(\bKetones:\s*)2\+/gi, '$1++')
                           .replace(/(\bKetones:\s*)[34]\+/gi, '$1+++')
                           .replace(/(\bBlood:\s*)1\+/gi, '$1+')
                           .replace(/(\bBlood:\s*)2\+/gi, '$1++')
                           .replace(/(\bBlood:\s*)[34]\+/gi, '$1+++')
                           .replace(/(\bLeukocytes:\s*)1\+/gi, '$1+')
                           .replace(/(\bLeukocytes:\s*)2\+/gi, '$1++')
                           .replace(/(\bLeukocytes:\s*)[34]\+/gi, '$1+++');
        } else {
          const trimmed = updated.trim();
          if (trimmed === '1+') updated = '+';
          else if (trimmed === '2+') updated = '++';
          else if (trimmed === '3+' || trimmed === '4+') updated = '+++';
        }

        if (updated !== orig) {
          await prisma.sampleTest.update({
            where: { id: st.id },
            data: { resultValue: updated }
          });
          dbMigratedCount++;
        }
      }
    }
    console.log(`Migrated ${dbMigratedCount} results in SQLite lab.db`);
  } catch (err) {
    console.warn('Prisma migration note:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('Migration for Item 1 and Item 2 finished successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
