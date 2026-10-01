const fs = require('fs');
const path = require('path');

function checkFile(p) {
  if (fs.existsSync(p)) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (j.tests) {
        console.log(`${p}: ${j.tests.length} tests`);
      }
    } catch (e) {}
  }
}

const candidates = [
  'D:/lab/apps/desktop/engine/data/lab_store.json',
  'D:/lab/apps/desktop/engine/standalone/data/lab_store.json',
  'D:/lab/apps/desktop/engine/standalone/apps/web/data/lab_store.json',
  'D:/lab/apps/desktop/dist/win-unpacked/resources/engine/data/lab_store.json',
  'D:/lab/apps/desktop/dist/win-unpacked/resources/engine/standalone/data/lab_store.json',
  'D:/lab/apps/desktop/dist/win-unpacked/resources/engine/standalone/apps/web/data/lab_store.json',
  'D:/lab/apps/web/.next/standalone/apps/web/data/lab_store.json',
  'D:/lab/apps/web/.next/standalone/data/lab_store.json',
];

for (const c of candidates) {
  checkFile(c);
}
