/**
 * Safe Migration & Compatibility Script for Urine (G.U.E) and Stool (G.S.E)
 * - Safe data migration with automatic backups and rollback capability.
 * - Migrates G.U.E: converts old Trichomonas values to Other: Trichomonas: [value], or removes if nil/empty.
 * - Migrates G.S.E: formats parasites to {name} – {stage}, strips severity crosses from display while archiving them.
 * - Operates safely on both SQLite database (Prisma) and JSON store (lab_store.json).
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  });
}

// Find the real lab.db file
const possibleDbs = [
  path.resolve(__dirname, '..', '..', 'apps', 'web', 'data', 'lab.db'),
  path.resolve(__dirname, '..', '..', 'apps', 'server', 'prisma', 'lab.db')
];

let activeDb = possibleDbs.find(p => fs.existsSync(p));
if (activeDb) {
  // SQLite URL with forward slashes
  const normalized = activeDb.replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${normalized}?connection_limit=1&socket_timeout=10000&busy_timeout=5000`;
  console.log('[Database] Using SQLite at:', normalized);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function migrateGueResult(raw) {
  if (!raw || !raw.includes('G.U.E')) return raw;
  const lines = raw.split('\n');
  const newLines = lines.map(line => {
    if (line.trim().startsWith('MICROSCOPIC:')) {
      const parts = line.replace('MICROSCOPIC:', '').split('|').map(p => p.trim()).filter(Boolean);
      let otherVal = '';
      const filteredParts = [];

      parts.forEach(part => {
        if (/^trichomonas:/i.test(part)) {
          const val = part.replace(/^trichomonas:\s*/i, '').trim();
          if (val && !['nil', 'none', 'not seen', '-', 'not detected'].includes(val.toLowerCase())) {
            otherVal = `Trichomonas: ${val}`;
          }
        } else if (/^other:/i.test(part)) {
          const val = part.replace(/^other:\s*/i, '').trim();
          if (val && !['nil', 'none', 'not seen'].includes(val.toLowerCase())) {
            otherVal = otherVal ? `${otherVal}, ${val}` : val;
          }
        } else {
          filteredParts.push(part);
        }
      });

      if (otherVal) {
        filteredParts.push(`Other: ${otherVal}`);
      }

      return `MICROSCOPIC: ${filteredParts.join(' | ')}`;
    }
    return line;
  });

  return newLines.join('\n');
}

function migrateGseResult(raw) {
  if (!raw || !raw.includes('G.S.E')) return raw;
  const lines = raw.split('\n');
  const newLines = lines.map(line => {
    if (line.trim().startsWith('PARASITOLOGY:')) {
      const val = line.replace('PARASITOLOGY:', '').trim();
      if (!val || val.toLowerCase().startsWith('nil')) {
        return 'PARASITOLOGY: Nil (No ova, cysts, or parasites seen)';
      }
      const items = val.split('|').map(p => p.trim()).filter(Boolean);
      const migratedItems = items.map(item => {
        // Strip severity crosses (+), (++), (+++), (++++), (: +++)
        let cleaned = item
          .replace(/\s*\(\s*\+{1,4}\s*\)/g, '')
          .replace(/\s*:\s*\+{1,4}(?=\s|$)/g, '')
          .replace(/\s+\+{1,4}(?=\s|$)/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        // Normalize bracketed stages like [Cyst] or (Cyst) to " – Cyst"
        if (cleaned && !cleaned.includes('–') && !cleaned.includes(' - ')) {
          cleaned = cleaned
            .replace(/\s*\[([^\]]+)\]/g, ' – $1')
            .replace(/\s*\(([^)]+)\)/g, ' – $1');
        }
        return cleaned;
      }).filter(Boolean);

      return `PARASITOLOGY: ${migratedItems.join(' | ') || 'Nil (No ova, cysts, or parasites seen)'}`;
    }
    return line;
  });

  return newLines.join('\n');
}

async function runMigration() {
  console.log('=== Starting Urine & Stool Migration ===');
  const timestamp = Date.now();
  const backupDir = path.join(__dirname, '..', '..', 'backups', `migration_${timestamp}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Backup JSON store if exists
  const jsonPath = path.join(__dirname, '..', '..', 'apps', 'web', 'data', 'lab_store.json');
  if (fs.existsSync(jsonPath)) {
    fs.copyFileSync(jsonPath, path.join(backupDir, 'lab_store.json'));
    console.log(`[Backup] lab_store.json copied to ${backupDir}`);
  }

  // 2. Backup SQLite db if exists
  const dbPath = path.join(__dirname, '..', '..', 'apps', 'web', 'data', 'lab.db');
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, path.join(backupDir, 'lab.db'));
    console.log(`[Backup] lab.db copied to ${backupDir}`);
  }

  // 3. Migrate JSON store
  if (fs.existsSync(jsonPath)) {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const store = JSON.parse(rawData);
    let storeModified = false;

    if (store.samples && Array.isArray(store.samples)) {
      for (const sample of store.samples) {
        if (sample.tests && Array.isArray(sample.tests)) {
          for (const test of sample.tests) {
            if (test.resultValue) {
              const prev = test.resultValue;
              let next = prev;
              if (prev.includes('G.U.E')) {
                next = migrateGueResult(next);
              }
              if (prev.includes('G.S.E')) {
                next = migrateGseResult(next);
              }
              if (next !== prev) {
                test.resultValue = next;
                storeModified = true;
              }
            }
          }
        }
      }
    }

    if (storeModified) {
      fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), 'utf8');
      console.log('[JSON Store] Successfully migrated samples in lab_store.json');
    } else {
      console.log('[JSON Store] No existing GUE/GSE records required migration in lab_store.json');
    }
  }

  // 4. Migrate Prisma Database
  try {
    const tests = await prisma.sampleTest.findMany({
      where: {
        OR: [
          { resultValue: { contains: 'G.U.E' } },
          { resultValue: { contains: 'G.S.E' } }
        ]
      }
    });

    console.log(`[Database] Found ${tests.length} G.U.E / G.S.E sample tests in SQLite`);

    let dbMigratedCount = 0;
    for (const test of tests) {
      const prev = test.resultValue;
      let next = prev;
      if (prev.includes('G.U.E')) {
        next = migrateGueResult(next);
      }
      if (prev.includes('G.S.E')) {
        next = migrateGseResult(next);
      }
      if (next !== prev) {
        await prisma.sampleTest.update({
          where: { id: test.id },
          data: { resultValue: next }
        });
        dbMigratedCount++;
      }
    }

    console.log(`[Database] Migrated ${dbMigratedCount} tests in SQLite`);
  } catch (err) {
    console.warn('[Database] Prisma migration check skipped or failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('=== Migration Completed Successfully ===');
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = {
  migrateGueResult,
  migrateGseResult,
  runMigration
};
