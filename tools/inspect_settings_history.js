const { execSync } = require('child_process');

const commits = ['d233ea1', 'c981e21', '024a217', '48146a9', '2082196', 'cefd3a0', 'c85daec', 'HEAD'];

for (const commit of commits) {
  try {
    const content = execSync(`git show ${commit}:apps/web/src/app/settings/page.tsx`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    const tabsMatches = content.match(/setActiveTab\(['"]([^'"]+)['"]\)/g) || [];
    const uniqueTabs = [...new Set(tabsMatches.map(m => m.replace(/setActiveTab\(['"]|['"]\)/g, '')))];
    const hasUpdates = content.includes('VERSION') || content.includes('التحديثات') || content.includes('تحديث');
    console.log(`Commit ${commit}: tabs = [${uniqueTabs.join(', ')}], hasUpdates = ${hasUpdates}, length = ${content.length}`);
  } catch (e) {
    console.log(`Commit ${commit}: error ${e.message}`);
  }
}
