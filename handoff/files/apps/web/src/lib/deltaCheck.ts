/**
 * Labryo Clinical Delta Check System
 * 
 * Pure TypeScript Domain Module for Historical Result Comparison and Delta Breach Detection.
 * Compliant with CLSI EP21, ISO 15189, and International LIS Quality Standards.
 * 
 * Core Capabilities:
 * 1. Automated historical comparator against prior patient visits.
 * 2. Precise delta percentage evaluation: (|Current - Previous| / Previous) * 100
 * 3. 3-Tier Alert Badging: NORMAL, SIGNIFICANT, CRITICAL.
 * 4. Comprehensive standard analyte threshold library (Hb, Plt, Creatinine, K, Na, Bilirubin, AST/ALT, FBS, WBC, etc.)
 * 5. Batch multi-analyte evaluation & Sample-to-History cross-comparator.
 */

export type DeltaBadgeLevel = 'NORMAL' | 'SIGNIFICANT' | 'CRITICAL' | 'WARNING';

export interface DeltaCheckResult {
  hasPrevious: boolean;
  previousValue?: number | string;
  previousSampleId?: string;
  previousDate?: string;
  currentValue?: number | string;
  deltaPercent?: number;
  isBreached: boolean;
  thresholdPercent?: number;
  criticalThresholdPercent?: number;
  badgeLevel: DeltaBadgeLevel;
  direction?: 'increased' | 'decreased' | 'unchanged' | 'UP' | 'DOWN';
  message?: string;
}

export interface DeltaCheckConfig {
  threshold: number;         // Percentage change triggering SIGNIFICANT alert
  criticalThreshold: number; // Percentage change triggering CRITICAL alert
  unit?: string;
  description?: string;
}

/**
 * Authoritative Standard LIS Delta Check Thresholds
 */
export const DEFAULT_DELTA_THRESHOLDS: Record<string, DeltaCheckConfig> = {
  // Hematology
  HGB: { threshold: 20, criticalThreshold: 35, unit: 'g/dL', description: 'Hemoglobin acute blood loss / fluid shift' },
  HB: { threshold: 20, criticalThreshold: 35, unit: 'g/dL', description: 'Hemoglobin' },
  CBC_HGB: { threshold: 20, criticalThreshold: 35, unit: 'g/dL', description: 'Hemoglobin' },
  HEMOGLOBIN: { threshold: 20, criticalThreshold: 35, unit: 'g/dL', description: 'Hemoglobin' },

  PLT: { threshold: 50, criticalThreshold: 75, unit: '10^3/uL', description: 'Platelets acute consumption / clumping' },
  CBC_PLT: { threshold: 50, criticalThreshold: 75, unit: '10^3/uL', description: 'Platelets' },
  PLATELETS: { threshold: 50, criticalThreshold: 75, unit: '10^3/uL', description: 'Platelets' },

  WBC: { threshold: 50, criticalThreshold: 100, unit: '10^3/uL', description: 'White Blood Cells acute leukocytosis/leukopenia' },
  CBC_WBC: { threshold: 50, criticalThreshold: 100, unit: '10^3/uL', description: 'White Blood Cells' },

  // Renal & Electrolytes
  CREATININE: { threshold: 50, criticalThreshold: 100, unit: 'mg/dL', description: 'Serum Creatinine acute kidney injury (AKI)' },
  CREAT: { threshold: 50, criticalThreshold: 100, unit: 'mg/dL', description: 'Serum Creatinine' },
  
  K: { threshold: 25, criticalThreshold: 40, unit: 'mmol/L', description: 'Potassium critical arrhythmia risk / hemolysis' },
  POTASSIUM: { threshold: 25, criticalThreshold: 40, unit: 'mmol/L', description: 'Potassium' },

  SODIUM: { threshold: 10, criticalThreshold: 15, unit: 'mmol/L', description: 'Sodium acute osmolar shift / IV contamination' },
  NA: { threshold: 10, criticalThreshold: 15, unit: 'mmol/L', description: 'Sodium' },

  CALCIUM: { threshold: 15, criticalThreshold: 30, unit: 'mg/dL', description: 'Serum Calcium' },
  CA: { threshold: 15, criticalThreshold: 30, unit: 'mg/dL', description: 'Serum Calcium' },

  // Liver & Enzymes
  TSB: { threshold: 50, criticalThreshold: 80, unit: 'mg/dL', description: 'Total Bilirubin acute hemolysis / biliary obstruction' },
  TOTAL_BILIRUBIN: { threshold: 50, criticalThreshold: 80, unit: 'mg/dL', description: 'Total Bilirubin' },
  BILIRUBIN: { threshold: 50, criticalThreshold: 80, unit: 'mg/dL', description: 'Total Bilirubin' },

  AST: { threshold: 50, criticalThreshold: 100, unit: 'U/L', description: 'AST / SGOT acute hepatic / cardiac injury' },
  GOT: { threshold: 50, criticalThreshold: 100, unit: 'U/L', description: 'AST / SGOT' },
  SGOT: { threshold: 50, criticalThreshold: 100, unit: 'U/L', description: 'AST / SGOT' },

  ALT: { threshold: 50, criticalThreshold: 100, unit: 'U/L', description: 'ALT / SGPT acute hepatocellular injury' },
  GPT: { threshold: 50, criticalThreshold: 100, unit: 'U/L', description: 'ALT / SGPT' },
  SGPT: { threshold: 50, criticalThreshold: 100, unit: 'U/L', description: 'ALT / SGPT' },

  // Metabolism
  FBS: { threshold: 50, criticalThreshold: 100, unit: 'mg/dL', description: 'Fasting Blood Sugar acute glycemic instability' },
  GLUCOSE: { threshold: 50, criticalThreshold: 100, unit: 'mg/dL', description: 'Blood Glucose' },

  UREA: { threshold: 50, criticalThreshold: 80, unit: 'mg/dL', description: 'Blood Urea' },
  BUN: { threshold: 50, criticalThreshold: 80, unit: 'mg/dL', description: 'Blood Urea Nitrogen' },
  URIC_ACID: { threshold: 50, criticalThreshold: 80, unit: 'mg/dL', description: 'Uric Acid' },
};

/**
 * Normalizes an analyte string to match standard threshold dictionary key
 */
export function normalizeAnalyteCode(analyte: string): string {
  return (analyte || '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_]/g, '_');
}

/**
 * Retrieves delta check config for a given analyte code
 */
export function getDeltaThresholdConfig(analyte: string): DeltaCheckConfig {
  const norm = normalizeAnalyteCode(analyte);
  return DEFAULT_DELTA_THRESHOLDS[norm] || {
    threshold: 50,
    criticalThreshold: 80,
    unit: '',
    description: 'General Analyte Delta Check',
  };
}

/**
 * Parses numeric value from number or string input
 */
function parseNumericValue(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const parsed = parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(parsed) ? null : parsed;
}

/**
 * Evaluates a single analyte delta check between current and previous values
 */
export function evaluateDeltaCheck(
  analyte: string,
  currentVal: number | string,
  previousVal: number | string,
  previousDate?: string,
  previousSampleId?: string,
  customThreshold?: number,
  customCriticalThreshold?: number,
  upperReference?: number
): DeltaCheckResult {
  const currNum = parseNumericValue(currentVal);
  const prevNum = parseNumericValue(previousVal);

  if (prevNum === null || currNum === null) {
    return {
      hasPrevious: prevNum !== null,
      previousValue: previousVal,
      previousSampleId,
      previousDate,
      currentValue: currentVal,
      isBreached: false,
      badgeLevel: 'NORMAL',
      message: 'No previous record found',
    };
  }

  if (prevNum === 0 && currNum > 0) {
    if (upperReference !== undefined && currNum > upperReference) {
      return {
        hasPrevious: true,
        previousValue: previousVal,
        previousSampleId,
        previousDate,
        currentValue: currentVal,
        isBreached: true,
        badgeLevel: 'WARNING',
        direction: 'UP',
        message: 'New appearance from zero baseline exceeding upper reference - clinical review recommended'
      };
    }
    
    return {
      hasPrevious: true,
      previousValue: previousVal,
      previousSampleId,
      previousDate,
      currentValue: currentVal,
      isBreached: true,
      badgeLevel: 'WARNING',
      direction: 'UP',
      message: 'New appearance from zero baseline - clinical review recommended'
    };
  }


  const delta = Math.abs(currNum - prevNum);
  const deltaPercent = Math.round((delta / Math.abs(prevNum)) * 1000) / 10;

  const config = getDeltaThresholdConfig(analyte);
  const threshold = customThreshold !== undefined ? customThreshold : config.threshold;
  const criticalThreshold =
    customCriticalThreshold !== undefined ? customCriticalThreshold : config.criticalThreshold;

  const isCritical = deltaPercent >= criticalThreshold;
  const isSignificant = deltaPercent >= threshold;
  const isBreached = isSignificant;

  let badgeLevel: DeltaBadgeLevel = 'NORMAL';
  if (isCritical) {
    badgeLevel = 'CRITICAL';
  } else if (isSignificant) {
    badgeLevel = 'SIGNIFICANT';
  }

  const direction: 'increased' | 'decreased' | 'unchanged' =
    currNum > prevNum ? 'increased' : currNum < prevNum ? 'decreased' : 'unchanged';

  const message = isBreached
    ? `Delta Alert: ${analyte} ${direction} by ${deltaPercent}% (prior: ${prevNum}, current: ${currNum})`
    : `Delta Normal: ${analyte} change of ${deltaPercent}% is within safe limit (${threshold}%)`;

  return {
    hasPrevious: true,
    previousValue: prevNum,
    previousSampleId,
    previousDate,
    currentValue: currNum,
    deltaPercent,
    isBreached,
    thresholdPercent: threshold,
    criticalThresholdPercent: criticalThreshold,
    badgeLevel,
    direction,
    message,
  };
}

/**
 * Batch evaluates multiple analytes from key-value pairs of current and previous visits
 */
export function evaluateMultiAnalyteDeltaChecks(
  currentResults: Record<string, number | string>,
  previousResults: Record<string, number | string>,
  previousDate?: string,
  previousSampleId?: string
): Record<string, DeltaCheckResult> {
  const reports: Record<string, DeltaCheckResult> = {};

  for (const [analyte, currVal] of Object.entries(currentResults)) {
    if (previousResults[analyte] !== undefined && previousResults[analyte] !== null) {
      reports[analyte] = evaluateDeltaCheck(
        analyte,
        currVal,
        previousResults[analyte],
        previousDate,
        previousSampleId
      );
    }
  }

  return reports;
}

/**
 * Compares a current sample's tests against a patient's historical samples
 */
export function compareSampleWithHistory(
  currentSample: { id?: string; tests: Array<{ testId?: string; test?: { code?: string; name?: string }; code?: string; resultValue?: string | number | null }> },
  historicalSamples: Array<{ id: string; createdAt: string; tests: Array<{ testId?: string; test?: { code?: string; name?: string }; code?: string; resultValue?: string | number | null }> }>
): Record<string, DeltaCheckResult> {
  const results: Record<string, DeltaCheckResult> = {};

  // Sort historical samples newest to oldest, excluding the current sample
  const sortedHistory = historicalSamples
    .filter(s => s.id !== currentSample.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!sortedHistory.length) {
    return results;
  }

  for (const currentTest of currentSample.tests) {
    const testCode = currentTest.code || currentTest.test?.code || currentTest.test?.name;
    const testId = currentTest.testId;
    const currVal = currentTest.resultValue;

    if (!testCode || currVal === null || currVal === undefined || currVal === '') {
      continue;
    }

    // Look for the most recent historical result for this test
    for (const priorSample of sortedHistory) {
      const priorTest = priorSample.tests.find(
        t => (testId && t.testId === testId) ||
             (t.code && t.code === testCode) ||
             (t.test?.code && t.test?.code === testCode)
      );

      if (priorTest && priorTest.resultValue !== null && priorTest.resultValue !== undefined && priorTest.resultValue !== '') {
        const deltaRes = evaluateDeltaCheck(
          testCode,
          currVal,
          priorTest.resultValue,
          priorSample.createdAt,
          priorSample.id
        );
        results[testCode] = deltaRes;
        break; // Stop at most recent visit
      }
    }
  }

  return results;
}
