const { execSync } = require('child_process');

const commits = execSync('git log --format="%h" -n 30 apps/web/data/lab_store.json').toString('utf8').trim().split('\n');

for (const c of commits) {
  try {
    const content = execSync(`git show ${c}:apps/web/data/lab_store.json`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    const j = JSON.parse(content);
    console.log(`Commit ${c}: lab_store.json has ${j.tests ? j.tests.length : 'none'} tests`);
  } catch (e) {
    console.log(`Commit ${c}: error ${e.message}`);
  }
}
