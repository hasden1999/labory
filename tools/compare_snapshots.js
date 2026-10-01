const fs = require('fs');
const path = require('path');

const backupsDir = 'C:/Users/azzez/AppData/Roaming/@lab-manager/desktop/data/backups';

const snap72 = JSON.parse(fs.readFileSync(path.join(backupsDir, 'auto_snapshot_2026-09-19.json'), 'utf8'));
const snap135 = JSON.parse(fs.readFileSync(path.join(backupsDir, 'auto_snapshot_2026-09-20.json'), 'utf8'));
const snap221 = JSON.parse(fs.readFileSync(path.join(backupsDir, 'auto_snapshot_2026-09-30.json'), 'utf8'));

console.log('snap72 tests count:', snap72.tests.length);
console.log('snap135 tests count:', snap135.tests.length);
console.log('snap221 tests count:', snap221.tests.length);

// Compare snap72 vs snap135 vs snap221
const ids72 = new Set(snap72.tests.map(t => t.id || t.code));
const ids135 = new Set(snap135.tests.map(t => t.id || t.code));
const ids221 = new Set(snap221.tests.map(t => t.id || t.code));

console.log('Tests in 72 that are in 135:', snap72.tests.filter(t => ids135.has(t.id || t.code)).length);
console.log('Tests in 135 not in 72:', snap135.tests.filter(t => !ids72.has(t.id || t.code)).length);

// What about the 142 in cefd3a0?
const gitStore142 = JSON.parse(fs.readFileSync('D:/lab/apps/web/data/lab_store.json', 'utf8'));
console.log('Current git lab_store.json tests:', gitStore142.tests.length);
