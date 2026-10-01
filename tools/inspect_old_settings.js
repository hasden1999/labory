const { execSync } = require('child_process');

try {
  const content = execSync('git show c981e21~1:apps/web/src/app/settings/page.tsx', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  console.log('File length before c981e21:', content.length);
  const tabs = content.match(/setActiveTab\(['"]([^'"]+)['"]\)/g) || [];
  console.log('Tabs before c981e21:', [...new Set(tabs)]);

  // Let's find headings or tab labels:
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('setActiveTab(') || lines[i].includes('activeTab ===')) {
      console.log(`${i+1}: ${lines[i].trim()}`);
    }
  }
} catch (e) {
  console.error(e.message);
}
