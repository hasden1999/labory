const { execSync } = require('child_process');

try {
  const oldContent = execSync('git show c85daec~1:apps/web/src/app/settings/page.tsx').toString('utf8');
  const lines = oldContent.split('\n');
  const versionJsxStart = lines.findIndex(l => l.includes("{activeTab === 'VERSION' && ("));
  console.log('Version tab JSX in c85daec~1 line:', versionJsxStart);
  console.log(lines.slice(versionJsxStart, versionJsxStart + 150).join('\n'));
} catch (e) {
  console.error(e.message);
}
