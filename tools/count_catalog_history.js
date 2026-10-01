const { execSync } = require('child_process');

const commits = ['024a217', '48146a9', '2082196', 'cefd3a0', 'c85daec', 'HEAD'];

for (const c of commits) {
  try {
    const content = execSync(`git show ${c}:apps/web/src/lib/catalogData.ts`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    const matches = content.match(/"id":\s*"t-[^"]+"/g) || [];
    console.log(`Commit ${c}: catalogData.ts has ${matches.length} tests`);
  } catch (e) {
    console.log(`Commit ${c}: error ${e.message}`);
  }
}
