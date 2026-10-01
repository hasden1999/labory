const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// 1. Get 142 tests from commit cefd3a0:apps/web/data/lab_store.json
const old142Raw = execSync('git show cefd3a0:apps/web/data/lab_store.json', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const old142 = JSON.parse(old142Raw).tests;
console.log('Old tests count (v1.1.3):', old142.length);

// 2. Get 72 tests from auto_snapshot_2026-09-19.json
const backupsDir = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/backups';
const snap72 = JSON.parse(fs.readFileSync(path.join(backupsDir, 'auto_snapshot_2026-09-19.json'), 'utf8')).tests;
console.log('Snap72 tests count:', snap72.length);

// 3. Compare them
const set72Names = new Set(snap72.map(t => (t.name || '').trim().toLowerCase()));
const set72Codes = new Set(snap72.map(t => (t.code || '').trim().toLowerCase()));

const missing70 = old142.filter(t => {
  const nameMatch = set72Names.has((t.name || '').trim().toLowerCase());
  const codeMatch = t.code && set72Codes.has((t.code || '').trim().toLowerCase());
  return !nameMatch && !codeMatch;
});

console.log(`\nExact missing tests count: ${missing70.length}`);
console.log('\nList of missing tests (Name, Arabic Name, Category):');
missing70.forEach((t, i) => {
  console.log(`${i + 1}. [${t.code || 'NO_CODE'}] ${t.name} | ${t.arabicName || '---'} (${t.category})`);
});
