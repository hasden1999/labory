import { globalContext, printSummary } from '../e2e/harness/testRunner';
import './m2_chal2_delta_empirical.test';

async function main() {
  console.log('\n======================================================================');
  console.log('   CHALLENGER 2: HISTORICAL DELTA CHECK EMPIRICAL TEST HARNESS       ');
  console.log('======================================================================\n');

  try {
    const summary = await globalContext.run();
    printSummary(summary);

    if (summary.failedTests > 0) {
      console.error(`\nFAILED: ${summary.failedTests} test(s) failed.`);
      process.exit(1);
    } else {
      console.log(`\nSUCCESS: All ${summary.totalTests} empirical delta check challenger tests passed with 0 errors!`);
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Challenger 2 Execution Error:', err);
    process.exit(1);
  }
}

main();
