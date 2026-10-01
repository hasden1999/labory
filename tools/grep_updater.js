const { execSync } = require('child_process');

try {
  const res = execSync('git grep -n "قسم التحديثات"').toString('utf8');
  console.log('grep "قسم التحديثات":', res);
} catch (e) {
  console.log('No exact match for "قسم التحديثات"');
}

try {
  const res = execSync('git grep -i -n "updater" apps/web/src/').toString('utf8');
  console.log('grep "updater":\n', res);
} catch (e) {
  console.log('Error grep updater:', e.message);
}
