/**
 * Labryo Clinical LIS - Opaque-Box E2E Test Assertions
 * Comprehensive matcher library with detailed error reporting
 */

export class AssertionError extends Error {
  public actual: any;
  public expected: any;

  constructor(message: string, actual?: any, expected?: any) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function expect(actual: any) {
  return {
    toBe(expected: any, customMsg?: string) {
      if (actual !== expected) {
        throw new AssertionError(
          customMsg || `Expected ${JSON.stringify(actual)} to strictly equal (===) ${JSON.stringify(expected)}`,
          actual,
          expected
        );
      }
    },

    toEqual(expected: any, customMsg?: string) {
      const actStr = JSON.stringify(actual);
      const expStr = JSON.stringify(expected);
      if (actStr !== expStr) {
        throw new AssertionError(
          customMsg || `Expected deep equality:\nActual:   ${actStr}\nExpected: ${expStr}`,
          actual,
          expected
        );
      }
    },

    toBeCloseTo(expected: number, precision: number = 2, customMsg?: string) {
      if (typeof actual !== 'number' || typeof expected !== 'number') {
        throw new AssertionError(`Expected both actual and expected to be numbers`, actual, expected);
      }
      const tolerance = Math.pow(10, -precision) / 2;
      const diff = Math.abs(actual - expected);
      if (diff > tolerance) {
        throw new AssertionError(
          customMsg || `Expected ${actual} to be close to ${expected} (diff: ${diff}, max allowed: ${tolerance})`,
          actual,
          expected
        );
      }
    },

    toBeTruthy(customMsg?: string) {
      if (!actual) {
        throw new AssertionError(customMsg || `Expected ${JSON.stringify(actual)} to be truthy`, actual, true);
      }
    },

    toBeFalsy(customMsg?: string) {
      if (actual) {
        throw new AssertionError(customMsg || `Expected ${JSON.stringify(actual)} to be falsy`, actual, false);
      }
    },

    toBeNull(customMsg?: string) {
      if (actual !== null) {
        throw new AssertionError(customMsg || `Expected ${JSON.stringify(actual)} to be null`, actual, null);
      }
    },

    toBeDefined(customMsg?: string) {
      if (actual === undefined) {
        throw new AssertionError(customMsg || `Expected value to be defined`, actual, 'defined');
      }
    },

    toBeUndefined(customMsg?: string) {
      if (actual !== undefined) {
        throw new AssertionError(customMsg || `Expected ${JSON.stringify(actual)} to be undefined`, actual, undefined);
      }
    },

    toBeGreaterThan(expected: number, customMsg?: string) {
      if (!(actual > expected)) {
        throw new AssertionError(customMsg || `Expected ${actual} > ${expected}`, actual, expected);
      }
    },

    toBeGreaterThanOrEqual(expected: number, customMsg?: string) {
      if (!(actual >= expected)) {
        throw new AssertionError(customMsg || `Expected ${actual} >= ${expected}`, actual, expected);
      }
    },

    toBeLessThan(expected: number, customMsg?: string) {
      if (!(actual < expected)) {
        throw new AssertionError(customMsg || `Expected ${actual} < ${expected}`, actual, expected);
      }
    },

    toBeLessThanOrEqual(expected: number, customMsg?: string) {
      if (!(actual <= expected)) {
        throw new AssertionError(customMsg || `Expected ${actual} <= ${expected}`, actual, expected);
      }
    },

    toBeWithinRange(min: number, max: number, customMsg?: string) {
      if (typeof actual !== 'number' || actual < min || actual > max) {
        throw new AssertionError(
          customMsg || `Expected ${actual} to be within range [${min}, ${max}]`,
          actual,
          `[${min}, ${max}]`
        );
      }
    },

    toContain(item: any, customMsg?: string) {
      if (typeof actual === 'string') {
        if (!actual.includes(item)) {
          throw new AssertionError(
            customMsg || `Expected string "${actual.length > 80 ? actual.substring(0, 80) + '...' : actual}" to contain "${item}"`,
            actual,
            item
          );
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new AssertionError(
            customMsg || `Expected array ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`,
            actual,
            item
          );
        }
      } else {
        throw new AssertionError(`Expected string or array for toContain matcher`, actual, item);
      }
    },

    toMatch(pattern: RegExp | string, customMsg?: string) {
      const reg = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      if (typeof actual !== 'string' || !reg.test(actual)) {
        throw new AssertionError(
          customMsg || `Expected "${actual}" to match regex pattern ${reg}`,
          actual,
          pattern.toString()
        );
      }
    },

    toThrow(expectedErrorPattern?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new AssertionError(`Expected a function to test for throws, received ${typeof actual}`);
      }
      let didThrow = false;
      let thrownError: any = null;
      try {
        actual();
      } catch (err: any) {
        didThrow = true;
        thrownError = err;
      }
      if (!didThrow) {
        throw new AssertionError(`Expected function to throw an error, but it returned normally.`);
      }
      if (expectedErrorPattern) {
        const msg = thrownError?.message || String(thrownError);
        const reg = typeof expectedErrorPattern === 'string' ? new RegExp(expectedErrorPattern, 'i') : expectedErrorPattern;
        if (!reg.test(msg)) {
          throw new AssertionError(
            `Expected thrown error message "${msg}" to match pattern ${expectedErrorPattern}`,
            msg,
            expectedErrorPattern.toString()
          );
        }
      }
    },

    toHaveProperty(prop: string, expectedVal?: any) {
      if (actual === null || typeof actual !== 'object' || !(prop in actual)) {
        throw new AssertionError(`Expected object to have property "${prop}"`, actual, prop);
      }
      if (expectedVal !== undefined) {
        const val = actual[prop];
        if (JSON.stringify(val) !== JSON.stringify(expectedVal)) {
          throw new AssertionError(
            `Expected property "${prop}" to equal ${JSON.stringify(expectedVal)}, but got ${JSON.stringify(val)}`,
            val,
            expectedVal
          );
        }
      }
    },

    toHaveLength(len: number) {
      const actualLen = actual?.length;
      if (actualLen !== len) {
        throw new AssertionError(`Expected length of ${len}, but got ${actualLen}`, actualLen, len);
      }
    }
  };
}
