/**
 * Labryo Clinical Intelligence & Range Classification Engine
 *
 * Central Pure Domain Logic for classifying clinical lab results as LOW, NORMAL, HIGH.
 * Compliant with CLSI C28-A3, IFCC, and ISO 15189 standards.
 *
 * Guarantees:
 * 1. ONE pure function classifies results across Screen, Print, and Quality Audits.
 * 2. Multi-range stratification by patient sex, age, and newborn precision.
 * 3. Applies to standard tests, calculated lipid panels (LDL, VLDL, Non-HDL, Ratios), and Previous results.
 * 4. Suppresses flags on qualitative/non-numeric results and tests without reference ranges.
 * 5. Returns standard Unicode arrows (↑ / ↓), inline vector SVGs, and clinical alert colors.
 */

import { isAgeWithinRange } from './ageUtils';

export type RangeFlag = 'NORMAL' | 'HIGH' | 'LOW' | 'NONE';

export interface PatientRangeContext {
  gender?: string | null;
  age?: number | string | null;
  birthDate?: string | Date | null;
  targetDate?: string | Date | null;
}

export interface RangeClassificationResult {
  flag: RangeFlag;
  status: 'NORMAL' | 'HIGH' | 'LOW'; // Backward-compatible with evaluateClinicalResult
  arrow: '↑' | '↓' | '';
  arrowSymbol: '↑' | '↓' | '';
  arrowSvg: string;
  color: string; // '#dc2626' for HIGH, '#2563eb' for LOW, '' for NORMAL
  isHigh: boolean;
  isLow: boolean;
  isAbnormal: boolean;
  lowBound: number | null;
  highBound: number | null;
  matchedRangeText?: string;
}

/**
 * Standard SVG arrows for inline print rendering with 100% vector fidelity across all fonts & drivers.
 */
export const ARROW_SVG_HIGH = `<svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-left:3px;"><path d="M5 1L1 5.5H4V11H6V5.5H9L5 1Z" fill="#dc2626"/></svg>`;
export const ARROW_SVG_LOW = `<svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-left:3px;"><path d="M5 11L9 6.5H6V1H4V6.5H1L5 11Z" fill="#2563eb"/></svg>`;

/**
 * Converts any Arabic-Indic digits to Latin digits and normalizes decimal separators.
 */
export function normalizeLatinDigits(val: any): string {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  const eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = s;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(eastern[i], String(i)).replaceAll(persian[i], String(i));
  }
  return res.replace(/،/g, '.').trim();
}

/**
 * Parses numeric reference bounds (low, high) from explicit numbers or text representations.
 * Handles formats like:
 * - "70 - 110"
 * - "13.0 - 17.5"
 * - "< 100", "<= 200"
 * - "> 40", ">= 50"
 */
export function parseNumericBounds(
  lowInput?: number | string | null,
  highInput?: number | string | null,
  textInput?: string | null
): { low: number | null; high: number | null } {
  let low: number | null = null;
  let high: number | null = null;

  if (lowInput !== null && lowInput !== undefined && !isNaN(Number(lowInput))) {
    low = Number(lowInput);
  }
  if (highInput !== null && highInput !== undefined && !isNaN(Number(highInput))) {
    high = Number(highInput);
  }

  if ((low === null || high === null) && textInput) {
    const cleanText = normalizeLatinDigits(textInput);
    // e.g. "70 - 110" or "70 to 110" or "70 – 110"
    const mRange = cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|to)\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (mRange) {
      if (low === null) low = parseFloat(mRange[1]);
      if (high === null) high = parseFloat(mRange[2]);
    } else {
      // e.g. "< 100", "<= 100", "Less than 100"
      const mLess = cleanText.match(/(?:<|<=|less than)\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (mLess && high === null) {
        high = parseFloat(mLess[1]);
      }
      // e.g. "> 40", ">= 40", "More than 40"
      const mGreater = cleanText.match(/(?:>|>=|greater than|more than)\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (mGreater && low === null) {
        low = parseFloat(mGreater[1]);
      }
    }
  }

  return { low, high };
}

/**
 * Matches applicable reference range row from multiple reference ranges for a given patient.
 */
export function matchPatientReferenceRange(
  ranges: any[],
  patient?: PatientRangeContext
): any | null {
  if (!ranges || !Array.isArray(ranges) || ranges.length === 0) return null;

  let pSex: 'M' | 'F' | null = null;
  if (patient?.gender) {
    const g = String(patient.gender).trim().toUpperCase();
    if (g === 'MALE' || g === 'M' || g === 'ذكر') pSex = 'M';
    else if (g === 'FEMALE' || g === 'F' || g === 'أنثى') pSex = 'F';
  }

  const matching = ranges.filter((r) => {
    // Check Sex
    if (r.sex && r.sex !== 'any') {
      if (!pSex || r.sex.toUpperCase() !== pSex) return false;
    }

    // Check Age
    const hasBirthDate = patient?.birthDate != null;
    const hasAge = patient?.age !== undefined && patient?.age !== null && patient?.age !== '';
    if (hasBirthDate || hasAge) {
      const match = isAgeWithinRange(
        r,
        { birthDate: patient?.birthDate, age: patient?.age },
        patient?.targetDate ? new Date(patient.targetDate) : undefined
      );
      if (!match) return false;
    }
    return true;
  });

  if (matching.length === 0) return null;

  // Prioritize most specific match: specific sex over 'any', then age limits defined
  const sorted = [...matching].sort((a, b) => {
    const aSex = a.sex && a.sex !== 'any' ? 1 : 0;
    const bSex = b.sex && b.sex !== 'any' ? 1 : 0;
    if (bSex !== aSex) return bSex - aSex;
    const aAge = (a.ageMin != null || a.ageMax != null) ? 1 : 0;
    const bAge = (b.ageMin != null || b.ageMax != null) ? 1 : 0;
    return bAge - aAge;
  });

  return sorted[0];
}

/**
 * Known clinical cut-offs for calculated lipid panels when not explicitly stored in catalog row.
 */
const CALCULATED_LIPID_CUTOFFS: Record<string, { low: number | null; high: number | null; display: string }> = {
  LDL: { low: null, high: 100, display: '< 100 mg/dL (Optimal)' },
  VLDL: { low: null, high: 30, display: '< 30 mg/dL' },
  'NON-HDL': { low: null, high: 130, display: '< 130 mg/dL' },
  'TC/HDL': { low: null, high: 5.0, display: '< 5.0 (Optimal: < 4.0)' },
  'LDL/HDL': { low: null, high: 3.5, display: '< 3.5 (Optimal: < 3.0)' },
};

/**
 * Central pure function to classify a test result against its reference ranges.
 *
 * @param val The measured or calculated test value (e.g. 145, "145", "< 50", "Positive")
 * @param testOrRange Test entity, reference range object, or bounds definition
 * @param patient Optional patient demographic context (sex, age, birthDate) for multi-range selection
 */
export function classifyResultRange(
  val: any,
  testOrRange?: any,
  patient?: PatientRangeContext
): RangeClassificationResult {
  const normalResult: RangeClassificationResult = {
    flag: 'NORMAL',
    status: 'NORMAL',
    arrow: '',
    arrowSymbol: '',
    arrowSvg: '',
    color: '',
    isHigh: false,
    isLow: false,
    isAbnormal: false,
    lowBound: null,
    highBound: null,
  };

  if (val === null || val === undefined) {
    return { ...normalResult, flag: 'NONE' };
  }

  const cleanStr = normalizeLatinDigits(String(val)).trim();
  if (
    !cleanStr ||
    cleanStr === '-' ||
    cleanStr.toLowerCase() === 'pending' ||
    cleanStr.toLowerCase().includes('not calculated') ||
    cleanStr.toLowerCase().includes('غير صالح')
  ) {
    return { ...normalResult, flag: 'NONE' };
  }

  // Pure Qualitative Check: if completely non-numeric without numeric comparison operator (<, >)
  // Per spec: "No flag for qualitative/non-numeric results or tests with no reference range."
  const hasOperator = cleanStr.startsWith('<') || cleanStr.startsWith('>');
  const numericCand = hasOperator ? cleanStr.replace(/^[<>=\s]+/, '').trim() : cleanStr;
  const num = parseFloat(numericCand);

  if (isNaN(num)) {
    // Pure text or qualitative result -> never flagged as HIGH/LOW
    return { ...normalResult, flag: 'NONE' };
  }

  // 1. Resolve applicable bounds from test or range definition
  let low: number | null = null;
  let high: number | null = null;
  let matchedRangeText: string | undefined = undefined;

  // Case A: Direct bounds passed in testOrRange (e.g. { low: 70, high: 110 })
  if (testOrRange && typeof testOrRange === 'object') {
    // Check multiple reference ranges first with patient context
    const refRanges = testOrRange.referenceRanges;
    if (Array.isArray(refRanges) && refRanges.length > 0) {
      const matched = matchPatientReferenceRange(refRanges, patient);
      if (matched) {
        const parsed = parseNumericBounds(matched.low, matched.high, matched.text);
        low = parsed.low;
        high = parsed.high;
        matchedRangeText = matched.text || (matched.label ? `${matched.label}: ${low ?? ''} - ${high ?? ''}` : undefined);
      }
    }

    // Fallback to explicit fields on test object
    if (low === null && high === null) {
      const lowField = testOrRange.refRangeLow ?? testOrRange.low ?? (patient?.gender === 'FEMALE' ? testOrRange.normalFemaleLow : testOrRange.normalMaleLow);
      const highField = testOrRange.refRangeHigh ?? testOrRange.high ?? (patient?.gender === 'FEMALE' ? testOrRange.normalFemaleHigh : testOrRange.normalMaleHigh);
      const textField = testOrRange.refRangeText ?? testOrRange.refDisplay ?? testOrRange.rangeText ?? testOrRange.text;
      const parsed = parseNumericBounds(lowField, highField, textField);
      low = parsed.low;
      high = parsed.high;
      matchedRangeText = textField || undefined;
    }

    // Special check for calculated lipid panel aliases by code or catalog ID
    if (low === null && high === null) {
      const code = String(testOrRange.code || testOrRange.testCode || testOrRange.id || '').toUpperCase().trim();
      if (code === 'VLDL' || code.includes('VLDL')) {
        low = CALCULATED_LIPID_CUTOFFS['VLDL'].low;
        high = CALCULATED_LIPID_CUTOFFS['VLDL'].high;
        matchedRangeText = CALCULATED_LIPID_CUTOFFS['VLDL'].display;
      } else if (code.includes('LDL/HDL')) {
        low = CALCULATED_LIPID_CUTOFFS['LDL/HDL'].low;
        high = CALCULATED_LIPID_CUTOFFS['LDL/HDL'].high;
        matchedRangeText = CALCULATED_LIPID_CUTOFFS['LDL/HDL'].display;
      } else if (code.includes('TC/HDL') || code.includes('CHOL/HDL')) {
        low = CALCULATED_LIPID_CUTOFFS['TC/HDL'].low;
        high = CALCULATED_LIPID_CUTOFFS['TC/HDL'].high;
        matchedRangeText = CALCULATED_LIPID_CUTOFFS['TC/HDL'].display;
      } else if (code.includes('NON-HDL') || code.includes('NONHDL')) {
        low = CALCULATED_LIPID_CUTOFFS['NON-HDL'].low;
        high = CALCULATED_LIPID_CUTOFFS['NON-HDL'].high;
        matchedRangeText = CALCULATED_LIPID_CUTOFFS['NON-HDL'].display;
      } else if (code === 'LDL' || code === 'LDL-C' || code === 'CALC-LDL' || code.includes('LDL_CHOLESTEROL')) {
        low = CALCULATED_LIPID_CUTOFFS['LDL'].low;
        high = CALCULATED_LIPID_CUTOFFS['LDL'].high;
        matchedRangeText = CALCULATED_LIPID_CUTOFFS['LDL'].display;
      }
    }
  }

  // If no reference bounds exist anywhere, per spec: "No flag for tests with no reference range"
  if (low === null && high === null) {
    return { ...normalResult, flag: 'NONE' };
  }

  // 2. Classify numeric value against resolved bounds
  let isHigh = false;
  let isLow = false;

  if (hasOperator) {
    // E.g. "> 200" or "< 50"
    if (cleanStr.startsWith('>') && high !== null && num >= high) {
      isHigh = true;
    } else if (cleanStr.startsWith('<') && low !== null && num <= low) {
      isLow = true;
    }
  } else {
    // Standard direct numeric comparison
    if (high !== null && !isNaN(high) && num > high) {
      isHigh = true;
    } else if (low !== null && !isNaN(low) && num < low) {
      isLow = true;
    }
  }

  if (isHigh) {
    return {
      flag: 'HIGH',
      status: 'HIGH',
      arrow: '↑',
      arrowSymbol: '↑',
      arrowSvg: ARROW_SVG_HIGH,
      color: '#dc2626',
      isHigh: true,
      isLow: false,
      isAbnormal: true,
      lowBound: low,
      highBound: high,
      matchedRangeText,
    };
  }

  if (isLow) {
    return {
      flag: 'LOW',
      status: 'LOW',
      arrow: '↓',
      arrowSymbol: '↓',
      arrowSvg: ARROW_SVG_LOW,
      color: '#2563eb',
      isHigh: false,
      isLow: true,
      isAbnormal: true,
      lowBound: low,
      highBound: high,
      matchedRangeText,
    };
  }

  return {
    ...normalResult,
    flag: 'NORMAL',
    status: 'NORMAL',
    lowBound: low,
    highBound: high,
    matchedRangeText,
  };
}

/**
 * Helper to render flagged values with arrow symbol, colors, and bold styling.
 * Guaranteed to be visible on color displays, black-and-white printouts, and rasterized PDFs.
 */
export function formatFlaggedResultHtml(
  value: string | number,
  evaluation: RangeClassificationResult,
  options?: { showSvg?: boolean; customColor?: string }
): string {
  const cleanVal = normalizeLatinDigits(value);
  if (!evaluation.isAbnormal) {
    return `<span class="val-normal">${cleanVal}</span>`;
  }

  const color = options?.customColor || evaluation.color;
  const arrowHtml = options?.showSvg
    ? evaluation.arrowSvg
    : `<span class="flag-arrow" style="font-family: Arial, -apple-system, sans-serif; font-weight: 900; margin-left: 3px; font-size: 1.05em; line-height: 1;">${evaluation.arrow}</span>`;

  return `<strong class="val-abnormal val-${evaluation.flag.toLowerCase()}" style="color: ${color}; font-weight: 800; display: inline-flex; align-items: center; white-space: nowrap;"><span>${cleanVal}</span>${arrowHtml}</strong>`;
}
