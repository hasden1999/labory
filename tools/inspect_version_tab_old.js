const { execSync } = require('child_process');

try {
  const oldContent = execSync('git show c85daec~1:apps/web/src/app/settings/page.tsx').toString('utf8');
  const lines = oldContent.split('\n');
  const versionStart = lines.findIndex(l => l.includes("activeTab === 'VERSION'"));
  console.log('Version tab start in c85daec~1 line:', versionStart);
  console.log(lines.slice(versionStart, versionStart + 120).join('\n'));
} catch (e) {
  console.error(e.message);
}
