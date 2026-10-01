const fs = require('fs');
const content = fs.readFileSync('D:/lab/apps/web/src/app/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('filteredTests') || l.includes('matchSearch') || l.includes('testSearch') || l.includes('categoryFilter')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
