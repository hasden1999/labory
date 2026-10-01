import { execSync } from 'child_process';
import path from 'path';

async function runAllGoldenTests() {
  console.log('======================================================');
  console.log('🌟 EXECUTING SUITE OF ALL GOLDEN REGRESSION TESTS');
  console.log('======================================================\n');

  const tests = [
    'tests/golden/catalog_count.test.ts',
    'tests/golden/api_snapshots.test.ts',
    'tests/golden/pdf_render.test.ts',
    'tests/golden/updater.test.ts',
    'tests/golden/smoke_inventory.test.ts'
  ];

  let passed = 0;
  for (const t of tests) {
    console.log(`\n▶️ Running: ${t}...`);
    try {
      execSync(`npx tsx ${t}`, { cwd: 'D:/lab', stdio: 'inherit' });
      passed++;
      console.log(`✅ ${t} PASSED`);
    } catch (err: any) {
      console.error(`❌ ${t} FAILED`);
      process.exit(1);
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passed}/${tests.length} GOLDEN TESTS PASSED WITH ZERO REGRESSIONS!`);
  console.log('======================================================');
}

runAllGoldenTests().catch(console.error);
