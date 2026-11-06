import { LIPID_CATALOG_IDS, LIPID_CATALOG_CODES } from './clinicalIntelligence';
import { isAgeWithinRange, formatClinicalAge, resolveDynamicReferenceRange } from '@lab-manager/domain';

/** Normalize Iraqi phone to wa.me format: 07xxxxxxxxx -> 9647xxxxxxxxx */
export function normalizeIraqiPhone(raw?: string | null): string {
  if (!raw) return '';
  let d = String(raw).replace(/[^0-9]/g, '');
  // strip international prefixes
  if (d.startsWith('00964')) d = d.substring(2); // 00964... -> 964...
  if (d.startsWith('00')) d = d.replace(/^00/, '');
  if (d.startsWith('+')) d = d.replace(/^\+/, '');
  // already 964... (12 digits, starts 9647)
  if (d.startsWith('964') && d.length >= 12 && d.length <= 13) return d;
  // 07xxxxxxxxx (11 digits)
  if (d.startsWith('07') && d.length === 11) return '964' + d.substring(1);
  // 7xxxxxxxxx (10 digits starting 7)
  if (d.startsWith('7') && d.length === 10) return '964' + d;
  // 01... landline? keep as-is if starts 964 else return digits
  if (d.startsWith('964')) return d;
  return d;
}

export function isCalculatedCatalogTest(test: any): boolean {
  if (!test) return false;
  if ((test as any).isCalculated === true) return true;
  const code = String(test.code || test.testCode || '').toUpperCase().trim();
  const id = String(test.id || test.testId || '');
  const calcCodes = [
    ...(LIPID_CATALOG_CODES.NON_HDL as readonly string[]),
    ...(LIPID_CATALOG_CODES.TC_HDL_RATIO as readonly string[]),
    ...(LIPID_CATALOG_CODES.LDL_HDL_RATIO as readonly string[]),
  ];
  if ((Object.values(LIPID_CATALOG_IDS) as string[]).includes(id)) {
    // LDL/VLDL are orderable (have price) — only treat as non-blocking when price is 0
    if (code === 'NON-HDL' || code === 'NONHDL' || code === 'NON_HDL' || code.includes('/')) return true;
    return Number(test.price || 0) === 0;
  }
  if (calcCodes.includes(code)) return true;
  if (test.sampleType === 'محسوب' && Number(test.price || 0) === 0) return true;
  return false;
}

/** Tests that block order-complete check (excludes free calculated rows) */
export function isBlockingOrderTest(st: any): boolean {
  const t = st.test || st;
  if (isCalculatedCatalogTest(t)) return false;
  return true;
}

const PLACEHOLDER_MISSING = ['not calculated', 'direct ldl required', 'غير صالح'];
export function isPlaceholderMissing(v: any): boolean {
  const s = String(v || '').trim().toLowerCase();
  if (s === '') return true;
  return PLACEHOLDER_MISSING.some((k) => s.includes(k));
}

export function getMissingTests(
  sampleTests: any[],
  testResults: Record<string, { resultValue: string }>
): any[] {
  return (sampleTests || []).filter((st: any) => {
    if (!isBlockingOrderTest(st)) return false;
    const cur = testResults[st.id]?.resultValue ?? st.resultValue;
    if (!cur || String(cur).trim() === '') return true;
    // Calculated placeholders ("Not calculated (TG ≥ 400)") still require a direct measurement
    if (isPlaceholderMissing(cur)) return true;
    return false;
  });
}

export function isOrderComplete(
  sampleTests: any[],
  testResults: Record<string, { resultValue: string }>
): boolean {
  return getMissingTests(sampleTests, testResults).length === 0;
}

export function orderTotalPrice(sampleTests: any[]): number {
  return (sampleTests || []).reduce((sum, st: any) => {
    const p = Number(st.test?.price ?? st.price ?? 0);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);
}

export function formatIqd(n: any): string {
  const v = Number(n || 0);
  return `${v.toLocaleString('en-US')} IQD`;
}

export interface WaTestLine {
  name: string;
  value: string;
  unit: string;
  refRange?: string;
  flag?: string;
  previous?: { value: string; date: string };
}

export function buildWhatsAppMessage(opts: {
  labName: string;
  patientName: string;
  date: string;
  sampleNumber: number | string;
  lines: WaTestLine[];
}): string {
  const { labName, patientName, date, sampleNumber, lines } = opts;
  const parts = [
    labName,
    `Patient: ${patientName}`,
    `Sample #${sampleNumber} • Date: ${date}`,
    ``,
  ];
  for (const l of lines) {
    let flagSuffix = '';
    if (l.flag === 'HIGH' || l.flag === 'H') {
      flagSuffix = ' [H ↑]';
    } else if (l.flag === 'LOW' || l.flag === 'L') {
      flagSuffix = ' [L ↓]';
    }
    let row = `${l.name}: ${l.value}${l.unit && l.unit !== '-' ? ` ${l.unit}` : ''}${flagSuffix}`;
    if (l.previous) {
      row += ` (Previous: ${l.previous.value} on ${l.previous.date})`;
    }
    parts.push(`- ${row}`);
  }
  parts.push(``, `Wishing you good health!`);
  return parts.join('\n');
}

export function buildArabicWhatsAppClinicalMessage(opts: {
  labName: string;
  patientName: string;
  date?: string;
  sampleNumber: number | string;
  lines: WaTestLine[];
}): string {
  const { labName, patientName, sampleNumber, lines } = opts;
  const parts = [
    `السلام عليكم ورحمة الله وبركاته`,
    `الأخ/الأخت الفاضل(ة): ${patientName}`,
    `يسر (${labName}) إعلامكم بصدور نتائج تحاليلكم الطبية المعتمدة للعينة رقم (#${sampleNumber}).`,
    ``,
  ];

  if (lines.length > 0) {
    parts.push(`📋 ملخص النتائج والتحاليل:`);
    for (const l of lines) {
      let flagSuffix = '';
      if (l.flag === 'HIGH' || l.flag === 'H' || l.flag === 'PANIC_HIGH') {
        flagSuffix = ' [مرتفع H ↑]';
      } else if (l.flag === 'LOW' || l.flag === 'L' || l.flag === 'PANIC_LOW') {
        flagSuffix = ' [منخفض L ↓]';
      }

      const unitStr = l.unit && l.unit !== '-' ? ` ${l.unit}` : '';
      let row = `• ${l.name}: ${l.value}${unitStr}${flagSuffix}`;
      if (l.previous && l.previous.value && String(l.previous.value).trim() !== '') {
        const prevDateStr = l.previous.date ? ` بتاريخ ${l.previous.date}` : '';
        row += `\n  (النتيجة السابقة: ${l.previous.value}${unitStr}${prevDateStr})`;
      }
      parts.push(row);
    }
    parts.push(``);
  }

  parts.push(`مرفق لكم طياً التقرير الطبي المعتمد 📄.`);
  parts.push(`نتمنى لكم دوام الصحة والعافية!`);
  return parts.join('\n');
}

export function buildWaLink(phoneRaw: string | undefined | null, message: string): string | null {
  const clean = normalizeIraqiPhone(phoneRaw);
  if (!clean) return null;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/** Match a sample-test row to a canonical lipid slot by catalog ID first, then code. */
export function matchLipidSlot(
  st: any,
  slot: 'TC' | 'HDL' | 'TG' | 'LDL' | 'VLDL' | 'NON_HDL' | 'TC_HDL_RATIO' | 'LDL_HDL_RATIO'
): boolean {
  const t = st.test || st;
  const id = String(t.id || st.testId || '');
  const code = String(t.code || t.testCode || '').toUpperCase().trim();
  const idMap: Record<string, string> = {
    TC: LIPID_CATALOG_IDS.TC,
    HDL: LIPID_CATALOG_IDS.HDL,
    TG: LIPID_CATALOG_IDS.TG,
    LDL: LIPID_CATALOG_IDS.LDL,
    VLDL: LIPID_CATALOG_IDS.VLDL,
    NON_HDL: LIPID_CATALOG_IDS.NON_HDL,
    TC_HDL_RATIO: LIPID_CATALOG_IDS.TC_HDL_RATIO,
    LDL_HDL_RATIO: LIPID_CATALOG_IDS.LDL_HDL_RATIO,
  };
  if (id && id === idMap[slot]) return true;
  const codeMap: Record<string, readonly string[]> = {
    TC: LIPID_CATALOG_CODES.TC,
    HDL: LIPID_CATALOG_CODES.HDL,
    TG: LIPID_CATALOG_CODES.TG,
    LDL: LIPID_CATALOG_CODES.LDL,
    VLDL: LIPID_CATALOG_CODES.VLDL,
    NON_HDL: LIPID_CATALOG_CODES.NON_HDL,
    TC_HDL_RATIO: LIPID_CATALOG_CODES.TC_HDL_RATIO,
    LDL_HDL_RATIO: LIPID_CATALOG_CODES.LDL_HDL_RATIO,
  };
  return (codeMap[slot] || []).includes(code);
}

export function getLipidUnit(sampleTests: any[]): string {
  const order = ['TG', 'TC', 'HDL'] as const;
  const slotOf = (st: any) => {
    if (matchLipidSlot(st, 'TG')) return 'TG';
    if (matchLipidSlot(st, 'TC')) return 'TC';
    if (matchLipidSlot(st, 'HDL')) return 'HDL';
    return null;
  };
  // Prefer TG unit, then TC, then HDL
  for (const want of order) {
    const found = (sampleTests || []).find((st: any) => slotOf(st) === want);
    const u = found?.test?.unit || found?.unit;
    if (u && String(u).trim() !== '' && String(u).trim() !== '-') return String(u);
  }
  return 'mg/dL';
}

export interface MatchedRefRangeResult {
  low: number | null;
  high: number | null;
  text: string | null;
  matchedLabel?: string | null;
  rangeText: string;
  isSpecificMatch: boolean;
  matchedRange?: any;
}

/**
 * Item 5: Auto-select reference range matching patient's sex, age on result date, and dynamic diagnostic bracket for resultValue.
 * Supports both positional parameters:
 *   resolveReferenceRange(test, gender, age, birthDate, referenceDate, resultValue)
 * and options object as 4th argument:
 *   resolveReferenceRange(test, gender, age, { birthDate, targetDate, resultValue }, resultValue)
 */
export function resolveReferenceRange(
  test: any,
  gender?: string | null,
  age?: number | string | null,
  birthDate?:
    | string
    | Date
    | null
    | {
        birthDate?: string | Date | null;
        targetDate?: string | Date | null;
        referenceDate?: string | Date | null;
        resultValue?: string | number | null;
      },
  referenceDate?: string | Date | null,
  resultValue?: string | number | null
): MatchedRefRangeResult {
  let actualBirthDate: string | Date | null | undefined = undefined;
  let actualTargetDate: string | Date | null | undefined = referenceDate;
  let actualResultValue: string | number | null | undefined = resultValue;

  if (birthDate && typeof birthDate === 'object' && !(birthDate instanceof Date)) {
    actualBirthDate = birthDate.birthDate;
    actualTargetDate = birthDate.targetDate ?? birthDate.referenceDate ?? referenceDate;
    actualResultValue =
      birthDate.resultValue !== undefined ? birthDate.resultValue : resultValue;
  } else {
    actualBirthDate = birthDate as string | Date | null | undefined;
  }

  const resolved = resolveDynamicReferenceRange(
    test,
    {
      gender,
      age,
      birthDate: actualBirthDate,
      targetDate: actualTargetDate,
    },
    actualResultValue
  );

  const fallbackText =
    resolved.text ||
    test?.refRangeText ||
    (resolved.low != null && resolved.high != null
      ? `${resolved.low} - ${resolved.high}`
      : resolved.low != null
        ? `>= ${resolved.low}`
        : resolved.high != null
          ? `< ${resolved.high}`
          : '-');

  return {
    low: resolved.low,
    high: resolved.high,
    text: resolved.text ?? (fallbackText !== '-' ? fallbackText : null),
    matchedLabel: resolved.matchedLabel,
    rangeText: fallbackText,
    isSpecificMatch: Boolean(resolved.matchedBracket),
    matchedRange: resolved.matchedBracket ?? undefined,
  };
}


