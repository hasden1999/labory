/**
 * Labryo Clinical LIS - Master E2E Test Suite Runner
 * Executes all 4 tiers of opaque-box requirement tests:
 * - Tier 1: Feature Coverage (R1-R4)
 * - Tier 2: Boundary & Corner Cases
 * - Tier 3: Cross-Feature Combinations
 * - Tier 4: Real-World Clinical Scenarios
 */

import { globalContext, printSummary } from './harness/testRunner';

// Tier 1: Feature Coverage Suites
import './tier1_features/tier1_intake_reception.test';
import './tier1_features/tier1_gue_workstation.test';
import './tier1_features/tier1_gse_workstation.test';
import './tier1_features/tier1_cbc_workstation.test';
import './tier1_features/tier1_chemistry_workstation.test';
import './tier1_features/tier1_microbiology_workstation.test';
import './tier1_features/tier1_clinical_calculations.test';
import './tier1_features/tier1_delta_checks.test';
import './tier1_features/tier1_print_templates.test';
import './tier1_features/tier1_letterhead_margins.test';
import './tier1_features/tier1_qr_validation.test';
import './tier1_features/tier1_barcode_labels.test';

// Tier 2: Boundary & Corner Cases
import './tier2_boundary_corner/tier2_boundaries_corners.test';

// Tier 3: Cross-Feature Combinations
import './tier3_combinations/tier3_cross_feature.test';

// Tier 4: Real-World Clinical Scenarios
import './tier4_clinical_scenarios/tier4_clinical_scenarios.test';

// Tier 5: Adversarial & Stress Testing
import './tier5_adversarial.test';

// Challenger 2: Adversarial Intake & Hotkeys Stress Suite
import './m1_intake_hotkeys_adversarial.test';

// Challenger 3: M2 Clinical Intelligence & Delta Check Suite
import '../challengers/m2_intelligence_challenge.test';

async function main() {
  console.log('\n======================================================================');
  console.log('   LABRYO CLINICAL LIS - COMPREHENSIVE E2E TEST SUITE RUNNER         ');
  console.log('   Opaque-Box Requirement-Driven Multi-Tier Verification Track       ');
  console.log('======================================================================\n');

  try {
    const summary = await globalContext.run();
    printSummary(summary);

    // Tier Breakdown Summary
    console.log('======================================================================');
    console.log('                      TIER BREAKDOWN SUMMARY                          ');
    console.log('======================================================================');
    
    const tier1Suites = summary.suiteResults.filter(s => s.name.startsWith('Tier 1'));
    const tier2Suites = summary.suiteResults.filter(s => s.name.startsWith('Tier 2'));
    const tier3Suites = summary.suiteResults.filter(s => s.name.startsWith('Tier 3'));
    const tier4Suites = summary.suiteResults.filter(s => s.name.startsWith('Tier 4'));
    const tier5Suites = summary.suiteResults.filter(s => s.name.startsWith('Tier 5'));

    const tier1Tests = tier1Suites.reduce((sum, s) => sum + s.tests.length, 0);
    const tier2Tests = tier2Suites.reduce((sum, s) => sum + s.tests.length, 0);
    const tier3Tests = tier3Suites.reduce((sum, s) => sum + s.tests.length, 0);
    const tier4Tests = tier4Suites.reduce((sum, s) => sum + s.tests.length, 0);
    const tier5Tests = tier5Suites.reduce((sum, s) => sum + s.tests.length, 0);

    console.log(` Tier 1: Feature Coverage (R1-R4)           -> ${tier1Suites.length} suites, ${tier1Tests} test cases [${tier1Suites.every(s => s.passed) ? 'PASSED' : 'FAILED'}]`);
    console.log(` Tier 2: Boundary & Corner Cases            -> ${tier2Suites.length} suites, ${tier2Tests} test cases [${tier2Suites.every(s => s.passed) ? 'PASSED' : 'FAILED'}]`);
    console.log(` Tier 3: Cross-Feature Combinations         -> ${tier3Suites.length} suites, ${tier3Tests} test cases [${tier3Suites.every(s => s.passed) ? 'PASSED' : 'FAILED'}]`);
    console.log(` Tier 4: Real-World Clinical Scenarios      -> ${tier4Suites.length} suites, ${tier4Tests} test cases [${tier4Suites.every(s => s.passed) ? 'PASSED' : 'FAILED'}]`);
    console.log(` Tier 5: Adversarial & Stress Testing       -> ${tier5Suites.length} suites, ${tier5Tests} test cases [${tier5Suites.every(s => s.passed) ? 'PASSED' : 'FAILED'}]`);
    console.log('======================================================================');
    console.log(` TOTAL VERIFIED E2E TEST CASES: ${summary.totalTests} | PASSED: ${summary.passedTests} | FAILED: ${summary.failedTests}`);
    console.log('======================================================================\n');

    if (summary.failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Fatal Test Runner Exception:', err);
    process.exit(1);
  }
}

main();
