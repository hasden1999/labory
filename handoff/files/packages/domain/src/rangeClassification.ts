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
  selectedCategoryLabel?: string | null;
}

export interface StructuredReferenceRangeRow {
  id?: string;
  sex?: 'M' | 'F' | 'any' | string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  ageUnit?: 'days' | 'months' | 'years' | string | null;
  min?: number | string | null;
  max?: number | string | null;
  low?: number | string | null;
  high?: number | string | null;
  text?: string | null;
  label?: string | null;
  unit?: string | null;
  [key: string]: any;
}

export interface EvaluableTestRangeInput {
  id?: string | null;
  code?: string | null;
  testCode?: string | null;
  refRangeLow?: number | string | null;
  refRangeHigh?: number | string | null;
  low?: number | string | null;
  high?: number | string | null;
  normalMaleLow?: number | string | null;
  normalMaleHigh?: number | string | null;
  normalFemaleLow?: number | string | null;
  normalFemaleHigh?: number | string | null;
  refRangeText?: string | null;
  refDisplay?: string | null;
  rangeText?: string | null;
  text?: string | null;
  referenceRanges?: StructuredReferenceRangeRow[] | null;
  [key: string]: any;
}

export interface RangeClassificationResult {
  flag: RangeFlag;
  status: 'NORMAL' | 'HIGH' | 'LOW'; // Backward-compatible with evaluateClinicalResult
  displayFlag: 'H ↑' | 'L ↓' | '';
  badgeText: 'H ↑' | 'L ↓' | 'Normal' | '';
  arrow: '↑' | '↓' | '';
  arrowSymbol: '↑' | '↓' | '';
  arrowSvg: string;
  color: string; // '#dc2626' for HIGH, '#2563eb' for LOW, '' for NORMAL
  uiColor: string; // Clinical tokens: '#c62828' for HIGH, '#1d4ed8' for LOW
  bgColor: string; // Clinical tokens: '#fdecec' for HIGH, '#e8effe' for LOW
  isHigh: boolean;
  isLow: boolean;
  isAbnormal: boolean;
  lowBound: number | null;
  highBound: number | null;
  matchedRangeText?: string | null;
  matchedCategoryLabel?: string | null;
  patientStateSummary?: string | null;
  availableCategories?: string[];
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
  textInput?: string | null,
  labelInput?: string | null
): { low: number | null; high: number | null } {
  let low: number | null = null;
  let high: number | null = null;

  if (lowInput !== null && lowInput !== undefined && String(lowInput).trim() !== '' && !isNaN(Number(normalizeLatinDigits(lowInput)))) {
    low = Number(normalizeLatinDigits(lowInput));
  }
  if (highInput !== null && highInput !== undefined && String(highInput).trim() !== '' && !isNaN(Number(normalizeLatinDigits(highInput)))) {
    high = Number(normalizeLatinDigits(highInput));
  }

  const parseFromStr = (str?: string | null) => {
    if (!str || (low !== null && high !== null)) return;
    const cleanText = normalizeLatinDigits(str);
    // e.g. "70 - 110" or "70 to 110" or "70 – 110"
    const mRange = cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|to)\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (mRange) {
      if (low === null) low = parseFloat(mRange[1]);
      if (high === null) high = parseFloat(mRange[2]);
    } else {
      // e.g. "< 100", "<= 100", "Less than 100"
      const mLess = cleanText.match(/(?:<=|≤|<|less than)\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (mLess && high === null) {
        high = parseFloat(mLess[1]);
      }
      // e.g. "> 40", ">= 40", "More than 40"
      const mGreater = cleanText.match(/(?:>=|≥|>|greater than|more than)\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (mGreater && low === null) {
        low = parseFloat(mGreater[1]);
      }
    }
  };

  if (low === null || high === null) {
    parseFromStr(textInput);
  }
  if (low === null || high === null) {
    parseFromStr(labelInput);
  }

  return { low, high };
}

/**
 * Parses numeric bounds and clean display representation for a single diagnostic bracket row.
 */
export function parseBracketRangeBounds(r: StructuredReferenceRangeRow): {
  min: number | null;
  max: number | null;
  isOpenHigh?: boolean;
  isOpenLow?: boolean;
  displayBounds: string;
} {
  let min: number | null = null;
  let max: number | null = null;
  let isOpenHigh: boolean | undefined = undefined;
  let isOpenLow: boolean | undefined = undefined;

  const rawMin = r?.min !== undefined && r?.min !== null && r?.min !== '' ? r.min : r?.low;
  const rawMax = r?.max !== undefined && r?.max !== null && r?.max !== '' ? r.max : r?.high;

  if (rawMin !== undefined && rawMin !== null && String(rawMin).trim() !== '') {
    const parsedMin = Number(normalizeLatinDigits(rawMin));
    if (!isNaN(parsedMin)) min = parsedMin;
  }
  if (rawMax !== undefined && rawMax !== null && String(rawMax).trim() !== '') {
    const parsedMax = Number(normalizeLatinDigits(rawMax));
    if (!isNaN(parsedMax)) max = parsedMax;
  }

  const rawText = r?.text ? normalizeLatinDigits(r.text).trim() : '';
  const rawLabel = r?.label ? normalizeLatinDigits(r.label).trim() : '';

  if (min === null && max === null) {
    const inspectStr = rawText || rawLabel;
    if (inspectStr) {
      const mRange = inspectStr.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|to)\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (mRange) {
        min = parseFloat(mRange[1]);
        max = parseFloat(mRange[2]);
      } else {
        const mLess = inspectStr.match(/(?:<=|≤|<|less than)\s*([0-9]+(?:\.[0-9]+)?)/i);
        if (mLess) {
          max = parseFloat(mLess[1]);
          isOpenLow = true;
        }
        const mGreater = inspectStr.match(/(?:>=|≥|>|greater than|more than)\s*([0-9]+(?:\.[0-9]+)?)/i);
        if (mGreater) {
          min = parseFloat(mGreater[1]);
          isOpenHigh = true;
        }
      }
    }
  }

  if (min !== null && max === null) isOpenHigh = true;
  if (min === null && max !== null) isOpenLow = true;

  // Format displayBounds cleanly
  let cleanText = rawText;
  if (cleanText && rawLabel && cleanText.toLowerCase() === rawLabel.toLowerCase()) {
    cleanText = '';
  } else if (cleanText && rawLabel && cleanText.toLowerCase().startsWith(rawLabel.toLowerCase())) {
    const stripped = cleanText.slice(rawLabel.length).replace(/^[\s:：\-–—]+/, '').trim();
    if (stripped) cleanText = stripped;
  }

  let displayBounds = '';
  const isDiabeticOpenHigh =
    min !== null &&
    max !== null &&
    max >= 20 &&
    (rawLabel.toLowerCase().includes('diabet') || rawLabel.includes('سكري')) &&
    (cleanText.includes('>=') || cleanText.includes('≥') || cleanText.includes('>'));

  if (isDiabeticOpenHigh) {
    displayBounds = cleanText;
  } else if (cleanText) {
    // Check if user updated explicit min/max in catalog while text still holds stale A - B numbers
    const mTextRange = cleanText.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|to)\s*([0-9]+(?:\.[0-9]+)?)$/i);
    if (mTextRange && min !== null && max !== null) {
      const tLow = parseFloat(mTextRange[1]);
      const tHigh = parseFloat(mTextRange[2]);
      if (tLow !== min || tHigh !== max) {
        displayBounds = `${min} - ${max}`;
      } else {
        displayBounds = cleanText;
      }
    } else {
      displayBounds = cleanText;
    }
  } else if (min !== null && max !== null) {
    displayBounds = `${min} - ${max}`;
  } else if (min !== null && max === null) {
    displayBounds = `>= ${min}`;
  } else if (min === null && max !== null) {
    displayBounds = `< ${max}`;
  }

  return {
    min,
    max,
    ...(isOpenHigh ? { isOpenHigh: true } : {}),
    ...(isOpenLow ? { isOpenLow: true } : {}),
    displayBounds,
  };
}

/**
 * Parses legacy multi-bracket reference range text (separated by \n, |, or ;)
 * into structured reference range rows.
 * Supports patterns like:
 * - "Non-diabetic: 4.0 - 5.6 | Pre-diabetic: 5.7 - 6.4 | Diabetic: >= 6.5"
 * - "4.0 - 5.6 % (Non-diabetic)\n5.7 - 6.4 % (Pre-diabetic)\n>= 6.5 % (Diabetic)"
 * - "Non-diabetic (4.0 - 5.6) | Pre-diabetic (5.7 - 6.4) | Diabetic (>= 6.5)"
 */
export function parseMultiBracketLegacyText(refRangeText?: string | null): StructuredReferenceRangeRow[] {
  if (!refRangeText || typeof refRangeText !== 'string') return [];
  let segments = refRangeText
    .split(/\r?\n|\||;/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length < 2) {
    if (/\s+\/\s+/.test(refRangeText)) {
      const slashParts = refRangeText
        .split(/\s+\/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (slashParts.length >= 2) {
        segments = slashParts;
      }
    }
  }

  if (segments.length < 2) return [];

  const rows: StructuredReferenceRangeRow[] = [];
  for (const seg of segments) {
    let label = '';
    let rangePart = '';

    const colonIdx = seg.indexOf(':');
    if (colonIdx > 0) {
      label = seg.slice(0, colonIdx).trim();
      rangePart = seg.slice(colonIdx + 1).trim();
    } else {
      const parenMatch = seg.match(/^([^()]+)\(([^()]+)\)\s*$/);
      if (parenMatch) {
        const part1 = parenMatch[1].trim();
        const part2 = parenMatch[2].trim();
        const b1 = parseNumericBounds(null, null, part1);
        const b2 = parseNumericBounds(null, null, part2);
        if ((b2.low !== null || b2.high !== null) && b1.low === null && b1.high === null) {
          label = part1;
          rangePart = part2;
        } else if (b1.low !== null || b1.high !== null) {
          rangePart = part1;
          label = part2;
        }
      }
    }

    if (label && rangePart) {
      const bounds = parseNumericBounds(null, null, rangePart);
      if (bounds.low !== null || bounds.high !== null) {
        let cleanText = rangePart;
        if (bounds.low !== null && bounds.high !== null) {
          cleanText = `${bounds.low} - ${bounds.high}`;
        } else if (bounds.low !== null) {
          cleanText = `>= ${bounds.low}`;
        } else if (bounds.high !== null) {
          cleanText = `< ${bounds.high}`;
        }

        let sex: 'M' | 'F' | 'any' = 'any';
        const normLabel = label.toLowerCase();
        const normSeg = seg.toLowerCase();
        if (
          normLabel === 'male' ||
          normLabel === 'm' ||
          normLabel.includes('ذكر') ||
          normLabel.includes('رجال') ||
          normLabel.startsWith('m:') ||
          normLabel.startsWith('m ') ||
          normSeg.includes('(male)') ||
          normSeg.startsWith('m:')
        ) {
          sex = 'M';
        } else if (
          normLabel === 'female' ||
          normLabel === 'f' ||
          normLabel.includes('أنثى') ||
          normLabel.includes('نساء') ||
          normLabel.startsWith('f:') ||
          normLabel.startsWith('f ') ||
          normSeg.includes('(female)') ||
          normSeg.startsWith('f:')
        ) {
          sex = 'F';
        }

        rows.push({
          sex,
          label,
          min: bounds.low,
          max: bounds.high,
          low: bounds.low,
          high: bounds.high,
          text: cleanText,
        });
      }
    }
  }

  return rows.length >= 2 ? rows : [];
}

function isGenericPlaceholderLabel(label?: string | null): boolean {
  if (!label) return true;
  const clean = label.trim();
  if (!clean) return true;
  const lower = clean.toLowerCase();
  return (
    clean === 'المعدل العام' ||
    clean === 'المعدل العام (General)' ||
    clean === 'عام' ||
    clean.includes('جميع الأعمار') ||
    clean.includes('جميع الاعمار') ||
    lower === 'general' ||
    lower === 'all' ||
    lower === 'all ages' ||
    lower === 'default'
  );
}

function formatBracketDisplay(
  bracket: StructuredReferenceRangeRow,
  totalApplicableCount = 1
): string {
  const lbl = (bracket.label || '').trim();
  const bBounds = parseBracketRangeBounds(bracket).displayBounds;

  if (lbl && (!isGenericPlaceholderLabel(lbl) || totalApplicableCount > 1)) {
    if (bBounds && !lbl.includes(bBounds)) {
      const hasArabic = /[\u0600-\u06FF]/.test(lbl);
      return hasArabic ? `${lbl} (\u2066${bBounds}\u2069)` : `${lbl} (${bBounds})`;
    }
    return lbl;
  }

  return bBounds || lbl || '';
}

/**
 * Helper to format reference range label and numeric text with strict Bidi isolation.
 * Prevents Arabic labels from flipping numbers like "70 - 140" into "140 - 70 : طبيعي".
 */
export function formatRangeLineBidi(label?: string | null, rangeText?: string | null): string {
  const cleanLabel = (label || '').trim();
  const cleanRange = (rangeText || '').trim();
  if (!cleanLabel) return cleanRange;
  if (!cleanRange) return cleanLabel;
  // Use Left-To-Right Isolate (\u2066) and Pop Directional Isolate (\u2069) around the numeric range
  return `${cleanLabel}: \u2066${cleanRange}\u2069`;
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
 * Checks whether a bracket label represents a standard baseline / normalcy state.
 */
export function isNormalcyLabel(label?: string | null): boolean {
  if (!label) return false;
  const lower = label.trim().toLowerCase();
  if (
    lower.includes('pre-') ||
    lower.includes('pre ') ||
    lower.includes('ما قبل') ||
    lower.includes('ماقبل') ||
    lower.includes('insufficient') ||
    lower.includes('deficient') ||
    lower.includes('نقص') ||
    lower.includes('قصور') ||
    lower.includes('borderline') ||
    lower.includes('حدي') ||
    lower.includes('abnormal') ||
    lower.includes('غير طبيعي') ||
    lower.includes('غير سليم')
  ) {
    return false;
  }
  return (
    lower.includes('normal') ||
    lower.includes('non-diabetic') ||
    lower.includes('non diabetic') ||
    lower.includes('nondiabetic') ||
    lower.includes('طبيعي') ||
    lower.includes('سليم') ||
    lower.includes('optimal') ||
    lower.includes('مثالي') ||
    lower.includes('desirable') ||
    lower.includes('sufficient') ||
    lower.includes('كافي') ||
    lower.includes('negative') ||
    lower.includes('سلبي') ||
    lower.includes('غير مصاب') ||
    lower.includes('غير سكري')
  );
}

/**
 * Dynamically resolves the baseline normal reference bounds AND the matching diagnostic bracket
 * for a given test, patient demographic context, and entered result value.
 */
export function resolveDynamicReferenceRange(
  test: EvaluableTestRangeInput | null | undefined,
  patient?: PatientRangeContext,
  resultValue?: string | number | null
): {
  low: number | null;
  high: number | null;
  text: string | null;
  matchedLabel: string | null;
  baselineRange: StructuredReferenceRangeRow | null;
  matchedBracket: StructuredReferenceRangeRow | null;
} {
  if (!test || typeof test !== 'object') {
    return {
      low: null,
      high: null,
      text: null,
      matchedLabel: null,
      baselineRange: null,
      matchedBracket: null,
    };
  }

  let pSex: 'M' | 'F' | null = null;
  if (patient?.gender) {
    const g = String(patient.gender).trim().toUpperCase();
    if (g === 'MALE' || g === 'M' || g === 'ذكر') pSex = 'M';
    else if (g === 'FEMALE' || g === 'F' || g === 'أنثى') pSex = 'F';
  }

  const rawRanges: StructuredReferenceRangeRow[] = Array.isArray(test.referenceRanges)
    ? test.referenceRanges
    : [];

  let applicable = rawRanges.filter((r) => {
    if (r.sex && r.sex !== 'any') {
      if (!pSex || r.sex.toUpperCase() !== pSex) return false;
    }
    const hasBirthDate = patient?.birthDate != null;
    const hasAge = patient?.age !== undefined && patient?.age !== null && patient?.age !== '';
    if (hasBirthDate || hasAge) {
      const match = isAgeWithinRange(
        r as any,
        { birthDate: patient?.birthDate, age: patient?.age },
        patient?.targetDate ? new Date(patient.targetDate) : undefined
      );
      if (!match) return false;
    }
    return true;
  });

  // Keep the most specific demographic group (sex/age) while preserving all brackets within that same demographic tier
  if (applicable.length > 1) {
    const specificityOf = (r: StructuredReferenceRangeRow) => {
      const sexSpec = r.sex && r.sex !== 'any' ? 2 : 0;
      const ageSpec = r.ageMin != null || r.ageMax != null ? 1 : 0;
      return sexSpec + ageSpec;
    };
    const maxSpec = Math.max(...applicable.map(specificityOf));
    if (maxSpec > 0) {
      applicable = applicable.filter((r) => specificityOf(r) === maxSpec);
    }
  }

  if (applicable.length === 0 && rawRanges.length > 0) {
    applicable = [...rawRanges];
  }

  const legacyTextField =
    test.refRangeText ?? test.refDisplay ?? test.rangeText ?? test.text ?? null;

  if (applicable.length <= 1 && legacyTextField) {
    const parsedLegacy = parseMultiBracketLegacyText(legacyTextField);
    if (parsedLegacy.length >= 2) {
      if (applicable.length === 0 || isGenericPlaceholderLabel(applicable[0]?.label)) {
        let filteredLegacy = parsedLegacy.filter((r) => {
          if (r.sex && r.sex !== 'any') {
            if (!pSex || r.sex.toUpperCase() !== pSex) return false;
          }
          return true;
        });
        applicable = filteredLegacy.length > 0 ? filteredLegacy : parsedLegacy;
      }
    }
  }

  let baselineRange: StructuredReferenceRangeRow | null = null;
  if (applicable.length >= 1) {
    if (patient?.selectedCategoryLabel) {
      const sel = patient.selectedCategoryLabel.trim().toLowerCase();
      baselineRange =
        applicable.find((r) => (r.label || '').trim().toLowerCase() === sel) || null;
    }
    if (!baselineRange) {
      baselineRange = applicable.find((r) => isNormalcyLabel(r.label)) || applicable[0];
    }
  }

  // Parse numeric value from resultValue
  let num: number | null = null;
  if (resultValue !== undefined && resultValue !== null && String(resultValue).trim() !== '') {
    const cleanVal = normalizeLatinDigits(String(resultValue)).trim();
    const lowerVal = cleanVal.toLowerCase();
    if (
      cleanVal &&
      cleanVal !== '-' &&
      lowerVal !== 'pending' &&
      !lowerVal.includes('not calculated') &&
      !lowerVal.includes('غير صالح')
    ) {
      const hasOp = cleanVal.startsWith('<') || cleanVal.startsWith('>');
      const numCand = hasOp ? cleanVal.replace(/^[<>=\s]+/, '').trim() : cleanVal;
      const parsed = parseFloat(numCand);
      if (!isNaN(parsed)) {
        num = parsed;
      }
    }
  }

  if (applicable.length >= 1) {
    let matchedBracket: StructuredReferenceRangeRow | null = null;

    if (patient?.selectedCategoryLabel) {
      const sel = patient.selectedCategoryLabel.trim().toLowerCase();
      matchedBracket =
        applicable.find((r) => (r.label || '').trim().toLowerCase() === sel) || null;
    }

    if (!matchedBracket && num !== null) {
      const items = applicable.map((row) => ({
        row,
        bounds: parseBracketRangeBounds(row),
      }));

      // 1. Direct inclusion in bracket bounds
      for (const item of items) {
        const { min, max } = item.bounds;
        if (min !== null && max !== null) {
          if (num >= min && num <= max) {
            matchedBracket = item.row;
            break;
          }
        } else if (min !== null && max === null) {
          if (num >= min) {
            matchedBracket = item.row;
            break;
          }
        } else if (min === null && max !== null) {
          if (num <= max) {
            matchedBracket = item.row;
            break;
          }
        }
      }

      // 2. Handle minor gaps between adjacent brackets or out-of-range extremes across multiple brackets
      if (!matchedBracket && items.length > 1) {
        const boundedItems = items.filter(
          (it) => it.bounds.min !== null || it.bounds.max !== null
        );
        if (boundedItems.length > 0) {
          const sorted = [...boundedItems].sort((a, b) => {
            const aMin = a.bounds.min ?? -Infinity;
            const bMin = b.bounds.min ?? -Infinity;
            if (aMin !== bMin) return aMin - bMin;
            const aMax = a.bounds.max ?? Infinity;
            const bMax = b.bounds.max ?? Infinity;
            return aMax - bMax;
          });

          const first = sorted[0];
          const last = sorted[sorted.length - 1];

          if (first.bounds.min !== null && num < first.bounds.min) {
            matchedBracket = first.row;
          } else if (last.bounds.max !== null && num > last.bounds.max) {
            matchedBracket = last.row;
          } else {
            for (let i = 0; i < sorted.length - 1; i++) {
              const prev = sorted[i];
              const curr = sorted[i + 1];
              if (
                prev.bounds.max !== null &&
                curr.bounds.min !== null &&
                num > prev.bounds.max &&
                num < curr.bounds.min
              ) {
                const distPrev = Math.abs(num - prev.bounds.max);
                const distCurr = Math.abs(curr.bounds.min - num);
                matchedBracket = distCurr <= distPrev ? curr.row : prev.row;
                break;
              }
            }
          }
        }
      }
    }

    const activeBracket = matchedBracket || baselineRange || applicable[0];
    const baseBounds = baselineRange
      ? parseBracketRangeBounds(baselineRange)
      : parseBracketRangeBounds(activeBracket);

    const formattedText =
      formatBracketDisplay(activeBracket, applicable.length) ||
      (legacyTextField ? String(legacyTextField).trim() : null);

    const rawLabel = activeBracket?.label ? activeBracket.label.trim() : null;
    const matchedLabel =
      rawLabel && (!isGenericPlaceholderLabel(rawLabel) || applicable.length > 1)
        ? rawLabel
        : null;

    return {
      low: baseBounds.min,
      high: baseBounds.max,
      text: formattedText,
      matchedLabel,
      baselineRange,
      matchedBracket: activeBracket,
    };
  }

  // Fallback to explicit legacy fields on test object
  const isFemale = pSex === 'F';
  const isMale = pSex === 'M';
  const genderSpecificLow = isFemale
    ? (test.normalFemaleLow ?? test.normalMaleLow)
    : isMale
      ? (test.normalMaleLow ?? test.normalFemaleLow)
      : null;
  const genderSpecificHigh = isFemale
    ? (test.normalFemaleHigh ?? test.normalMaleHigh)
    : isMale
      ? (test.normalMaleHigh ?? test.normalFemaleHigh)
      : null;

  const lowField =
    (pSex ? genderSpecificLow : null) ??
    test.refRangeLow ??
    test.low ??
    genderSpecificLow ??
    test.normalMaleLow ??
    test.normalFemaleLow;
  const highField =
    (pSex ? genderSpecificHigh : null) ??
    test.refRangeHigh ??
    test.high ??
    genderSpecificHigh ??
    test.normalMaleHigh ??
    test.normalFemaleHigh;
  const textField = legacyTextField ? String(legacyTextField).trim() : null;

  const parsed = parseNumericBounds(lowField, highField, textField);
  let low = parsed.low;
  let high = parsed.high;
  let text =
    textField ||
    (low !== null && high !== null
      ? `${low} - ${high}`
      : low !== null
        ? `>= ${low}`
        : high !== null
          ? `< ${high}`
          : null);

  // Special check for calculated lipid panel aliases by code or catalog ID
  if (low === null && high === null) {
    const code = String(test.code || test.testCode || test.id || '')
      .toUpperCase()
      .trim();
    if (code === 'VLDL' || code.includes('VLDL')) {
      low = CALCULATED_LIPID_CUTOFFS['VLDL'].low;
      high = CALCULATED_LIPID_CUTOFFS['VLDL'].high;
      text = text || CALCULATED_LIPID_CUTOFFS['VLDL'].display;
    } else if (code.includes('LDL/HDL')) {
      low = CALCULATED_LIPID_CUTOFFS['LDL/HDL'].low;
      high = CALCULATED_LIPID_CUTOFFS['LDL/HDL'].high;
      text = text || CALCULATED_LIPID_CUTOFFS['LDL/HDL'].display;
    } else if (code.includes('TC/HDL') || code.includes('CHOL/HDL')) {
      low = CALCULATED_LIPID_CUTOFFS['TC/HDL'].low;
      high = CALCULATED_LIPID_CUTOFFS['TC/HDL'].high;
      text = text || CALCULATED_LIPID_CUTOFFS['TC/HDL'].display;
    } else if (code.includes('NON-HDL') || code.includes('NONHDL')) {
      low = CALCULATED_LIPID_CUTOFFS['NON-HDL'].low;
      high = CALCULATED_LIPID_CUTOFFS['NON-HDL'].high;
      text = text || CALCULATED_LIPID_CUTOFFS['NON-HDL'].display;
    } else if (
      code === 'LDL' ||
      code === 'LDL-C' ||
      code === 'CALC-LDL' ||
      code.includes('LDL_CHOLESTEROL')
    ) {
      low = CALCULATED_LIPID_CUTOFFS['LDL'].low;
      high = CALCULATED_LIPID_CUTOFFS['LDL'].high;
      text = text || CALCULATED_LIPID_CUTOFFS['LDL'].display;
    }
  }

  return {
    low,
    high,
    text,
    matchedLabel: null,
    baselineRange: null,
    matchedBracket: null,
  };
}

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
  const dynamicResolved = resolveDynamicReferenceRange(testOrRange, patient, val);

  const normalResult: RangeClassificationResult = {
    flag: 'NORMAL',
    status: 'NORMAL',
    displayFlag: '',
    badgeText: 'Normal',
    arrow: '',
    arrowSymbol: '',
    arrowSvg: '',
    color: '',
    uiColor: '',
    bgColor: '',
    isHigh: false,
    isLow: false,
    isAbnormal: false,
    lowBound: dynamicResolved.low,
    highBound: dynamicResolved.high,
    matchedRangeText: dynamicResolved.text,
    matchedCategoryLabel: dynamicResolved.matchedBracket?.label
      ? dynamicResolved.matchedBracket.label.trim()
      : dynamicResolved.matchedLabel,
    patientStateSummary: null,
  };

  if (val === null || val === undefined) {
    return { ...normalResult, flag: 'NONE', badgeText: '', patientStateSummary: null };
  }

  const cleanStr = normalizeLatinDigits(String(val)).trim();
  if (
    !cleanStr ||
    cleanStr === '-' ||
    cleanStr.toLowerCase() === 'pending' ||
    cleanStr.toLowerCase().includes('not calculated') ||
    cleanStr.toLowerCase().includes('غير صالح')
  ) {
    return { ...normalResult, flag: 'NONE', patientStateSummary: null };
  }

  // Pure Qualitative Check: if completely non-numeric without numeric comparison operator (<, >)
  // Per spec: "No flag for qualitative/non-numeric results or tests with no reference range."
  const hasOperator = cleanStr.startsWith('<') || cleanStr.startsWith('>');
  const numericCand = hasOperator ? cleanStr.replace(/^[<>=\s]+/, '').trim() : cleanStr;
  const num = parseFloat(numericCand);

  if (isNaN(num)) {
    // Pure text or qualitative result -> never flagged as HIGH/LOW
    return { ...normalResult, flag: 'NONE', patientStateSummary: null };
  }

  const low = dynamicResolved.low;
  const high = dynamicResolved.high;
  const matchedRangeText = dynamicResolved.text;
  const matchedCategoryLabel = dynamicResolved.matchedBracket?.label
    ? dynamicResolved.matchedBracket.label.trim()
    : dynamicResolved.matchedLabel;

  let availableCategories: string[] = [];
  if (testOrRange && Array.isArray(testOrRange.referenceRanges)) {
    availableCategories = Array.from(
      new Set(
        testOrRange.referenceRanges
          .map((r: any) => (r?.label || '').trim())
          .filter(Boolean)
      )
    );
  }

  // If no reference bounds exist anywhere, per spec: "No flag for tests with no reference range"
  if (low === null && high === null) {
    return {
      ...normalResult,
      flag: 'NONE',
      matchedRangeText,
      matchedCategoryLabel,
      patientStateSummary: null,
      availableCategories,
    };
  }

  // Classify numeric value against resolved baseline bounds
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

  const rawMatchedLabel = dynamicResolved.matchedBracket?.label
    ? dynamicResolved.matchedBracket.label.trim()
    : matchedCategoryLabel;

  let patientStateSummary: string | null = null;
  if (rawMatchedLabel) {
    if (isNormalcyLabel(rawMatchedLabel)) {
      if (isHigh) {
        patientStateSummary = `مرتفع عن (${rawMatchedLabel})`;
      } else if (isLow) {
        patientStateSummary = `منخفض عن (${rawMatchedLabel})`;
      } else {
        patientStateSummary = `ضمن (${rawMatchedLabel})`;
      }
    } else {
      patientStateSummary = rawMatchedLabel;
    }
  }

  if (isHigh) {
    return {
      flag: 'HIGH',
      status: 'HIGH',
      displayFlag: 'H ↑',
      badgeText: 'H ↑',
      arrow: '↑',
      arrowSymbol: '↑',
      arrowSvg: ARROW_SVG_HIGH,
      color: '#dc2626',
      uiColor: '#c62828',
      bgColor: '#fdecec',
      isHigh: true,
      isLow: false,
      isAbnormal: true,
      lowBound: low,
      highBound: high,
      matchedRangeText,
      matchedCategoryLabel,
      patientStateSummary,
      availableCategories,
    };
  }

  if (isLow) {
    return {
      flag: 'LOW',
      status: 'LOW',
      displayFlag: 'L ↓',
      badgeText: 'L ↓',
      arrow: '↓',
      arrowSymbol: '↓',
      arrowSvg: ARROW_SVG_LOW,
      color: '#2563eb',
      uiColor: '#1d4ed8',
      bgColor: '#e8effe',
      isHigh: false,
      isLow: true,
      isAbnormal: true,
      lowBound: low,
      highBound: high,
      matchedRangeText,
      matchedCategoryLabel,
      patientStateSummary,
      availableCategories,
    };
  }

  return {
    ...normalResult,
    flag: 'NORMAL',
    status: 'NORMAL',
    displayFlag: '',
    badgeText: 'Normal',
    lowBound: low,
    highBound: high,
    matchedRangeText,
    matchedCategoryLabel,
    patientStateSummary,
    availableCategories,
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
