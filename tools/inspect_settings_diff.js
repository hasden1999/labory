const { execSync } = require('child_process');

try {
  const diff = execSync('git diff c85daec~1 c85daec -- apps/web/src/app/settings/page.tsx', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  console.log('Diff size:', diff.length);
  // print the diff chunks
  console.log(diff.slice(0, 3000));
} catch (e) {
  console.error(e.message);
}
