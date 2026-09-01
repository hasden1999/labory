import { globalContext, printSummary } from '../e2e/harness/testRunner';
import './m1_api_challenge.test';

async function main() {
  console.log('\n======================================================================');
  console.log('      CHALLENGER 1: MILESTONE M1 API & ROUTE EMPIRICAL SUITE          ');
  console.log('======================================================================\n');

  try {
    const summary = await globalContext.run();
    printSummary(summary);

    if (summary.failedTests > 0) {
      console.error(`FAILED: ${summary.failedTests} test(s) failed.`);
      process.exit(1);
    } else {
      console.log(`SUCCESS: All ${summary.totalTests} M1 API challenge tests passed with 0 errors!`);
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Challenger 1 Execution Error:', err);
    process.exit(1);
  }
}

main();
