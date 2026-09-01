/**
 * Labryo Clinical LIS - Standalone E2E Test Runner Engine
 */

export interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface TestSuiteResult {
  name: string;
  passed: boolean;
  durationMs: number;
  tests: TestCaseResult[];
}

export interface RunSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  suiteResults: TestSuiteResult[];
}

type TestFn = () => void | Promise<void>;
type HookFn = () => void | Promise<void>;

interface TestDef {
  name: string;
  fn: TestFn;
}

interface SuiteDef {
  name: string;
  tests: TestDef[];
  beforeAllHooks: HookFn[];
  afterAllHooks: HookFn[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
}

class TestContext {
  private currentSuite: SuiteDef | null = null;
  private suites: SuiteDef[] = [];

  public describe(name: string, fn: () => void) {
    const parentSuite = this.currentSuite;
    const newSuite: SuiteDef = {
      name: parentSuite ? `${parentSuite.name} > ${name}` : name,
      tests: [],
      beforeAllHooks: [],
      afterAllHooks: [],
      beforeEachHooks: [],
      afterEachHooks: []
    };

    this.currentSuite = newSuite;
    this.suites.push(newSuite);

    try {
      fn();
    } finally {
      this.currentSuite = parentSuite;
    }
  }

  public test(name: string, fn: TestFn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {
        this.currentSuite!.tests.push({ name, fn });
      });
    } else {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  public beforeAll(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.beforeAllHooks.push(fn);
  }

  public afterAll(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.afterAllHooks.push(fn);
  }

  public beforeEach(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.beforeEachHooks.push(fn);
  }

  public afterEach(fn: HookFn) {
    if (this.currentSuite) this.currentSuite.afterEachHooks.push(fn);
  }

  public async run(): Promise<RunSummary> {
    const startTime = Date.now();
    const suiteResults: TestSuiteResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const suite of this.suites) {
      if (suite.tests.length === 0) continue;
      const suiteStartTime = Date.now();
      const testResults: TestCaseResult[] = [];
      let suitePassed = true;

      // Run beforeAll
      for (const hook of suite.beforeAllHooks) {
        try {
          await hook();
        } catch (err: any) {
          console.error(`  [!] Error in beforeAll hook for "${suite.name}":`, err);
        }
      }

      for (const t of suite.tests) {
        totalTests++;
        const testStartTime = Date.now();

        // Run beforeEach
        for (const hook of suite.beforeEachHooks) {
          try {
            await hook();
          } catch (err: any) {
            console.error(`  [!] Error in beforeEach hook for "${t.name}":`, err);
          }
        }

        let passed = true;
        let testError: Error | undefined = undefined;

        try {
          await t.fn();
        } catch (err: any) {
          passed = false;
          suitePassed = false;
          testError = err;
        }

        // Run afterEach
        for (const hook of suite.afterEachHooks) {
          try {
            await hook();
          } catch (err: any) {
            console.error(`  [!] Error in afterEach hook for "${t.name}":`, err);
          }
        }

        const durationMs = Date.now() - testStartTime;
        if (passed) {
          passedTests++;
        } else {
          failedTests++;
        }

        testResults.push({
          suite: suite.name,
          name: t.name,
          passed,
          durationMs,
          error: testError
        });
      }

      // Run afterAll
      for (const hook of suite.afterAllHooks) {
        try {
          await hook();
        } catch (err: any) {
          console.error(`  [!] Error in afterAll hook for "${suite.name}":`, err);
        }
      }

      const suiteDurationMs = Date.now() - suiteStartTime;
      suiteResults.push({
        name: suite.name,
        passed: suitePassed,
        durationMs: suiteDurationMs,
        tests: testResults
      });
    }

    const durationMs = Date.now() - startTime;
    const totalSuites = suiteResults.length;
    const passedSuites = suiteResults.filter(s => s.passed).length;
    const failedSuites = totalSuites - passedSuites;

    return {
      totalSuites,
      passedSuites,
      failedSuites,
      totalTests,
      passedTests,
      failedTests,
      durationMs,
      suiteResults
    };
  }

  public clear() {
    this.suites = [];
    this.currentSuite = null;
  }
}

// Global default instance
export const globalContext = new TestContext();

export const describe = (name: string, fn: () => void) => globalContext.describe(name, fn);
export const test = (name: string, fn: TestFn) => globalContext.test(name, fn);
export const it = test;
export const beforeAll = (fn: HookFn) => globalContext.beforeAll(fn);
export const afterAll = (fn: HookFn) => globalContext.afterAll(fn);
export const beforeEach = (fn: HookFn) => globalContext.beforeEach(fn);
export const afterEach = (fn: HookFn) => globalContext.afterEach(fn);

export function printSummary(summary: RunSummary) {
  console.log('\n======================================================================');
  console.log('                 LABRYO E2E TEST EXECUTION REPORT                    ');
  console.log('======================================================================\n');

  for (const s of summary.suiteResults) {
    const statusIcon = s.passed ? '✓' : '✗';
    const statusColor = s.passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`${statusColor}${statusIcon} ${s.name}\x1b[0m (${s.durationMs}ms)`);

    for (const t of s.tests) {
      const tIcon = t.passed ? '  ✓' : '  ✗';
      const tColor = t.passed ? '\x1b[32m' : '\x1b[31m';
      console.log(`${tColor}${tIcon} ${t.name} (${t.durationMs}ms)\x1b[0m`);
      if (!t.passed && t.error) {
        console.log(`    \x1b[31mError: ${t.error.message}\x1b[0m`);
        if (t.error.stack) {
          const stackLines = t.error.stack.split('\n').slice(1, 4).join('\n');
          console.log(`    \x1b[90m${stackLines}\x1b[0m`);
        }
      }
    }
    console.log('');
  }

  console.log('----------------------------------------------------------------------');
  console.log(`Suites:  ${summary.passedSuites} passed, ${summary.failedSuites} failed, ${summary.totalSuites} total`);
  console.log(`Tests:   ${summary.passedTests} passed, ${summary.failedTests} failed, ${summary.totalTests} total`);
  console.log(`Time:    ${(summary.durationMs / 1000).toFixed(2)}s`);
  console.log('======================================================================\n');
}
