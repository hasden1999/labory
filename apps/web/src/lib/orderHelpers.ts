import { LIPID_CATALOG_IDS, LIPID_CATALOG_CODES } from './clinicalIntelligence';

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
    // No H/L flags per spec — plain value + unit
    let row = `${l.name}: ${l.value}${l.unit && l.unit !== '-' ? ` ${l.unit}` : ''}`;
    if (l.previous) {
      row += ` (Previous: ${l.previous.value} on ${l.previous.date})`;
    }
    parts.push(`- ${row}`);
  }
  parts.push(``, `Wishing you good health!`);
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
  rangeText: string;
  isSpecificMatch: boolean;
  matchedRange?: any;
}

/**
 * Item 5: Auto-select reference range matching patient's sex and age on result date.
 * If nothing matches, returns all ranges or fallback.
 */
export function resolveReferenceRange(
  test: any,
  patientGender?: string | null,
  patientAge?: number | string | null
): MatchedRefRangeResult {
  const fallback = test?.refRangeText || 
    (test?.refRangeLow != null && test?.refRangeHigh != null 
      ? `${test.refRangeLow} - ${test.refRangeHigh}` 
      : (test?.refRangeLow != null ? `>= ${test.refRangeLow}` : test?.refRangeHigh != null ? `<= ${test.refRangeHigh}` : '-'));

  const ranges: any[] = test?.referenceRanges || [];
  if (!ranges || ranges.length === 0) {
    return { rangeText: fallback, isSpecificMatch: false };
  }

  // Normalize patient gender to 'M' or 'F'
  let pSex: 'M' | 'F' | null = null;
  if (patientGender) {
    const g = String(patientGender).trim().toUpperCase();
    if (g === 'MALE' || g === 'M' || g === 'ذكر') pSex = 'M';
    else if (g === 'FEMALE' || g === 'F' || g === 'أنثى') pSex = 'F';
  }

  // Normalize patient age in years
  let pAgeYears: number | null = null;
  if (patientAge !== undefined && patientAge !== null && patientAge !== '') {
    const parsed = parseFloat(String(patientAge));
    if (!isNaN(parsed) && parsed >= 0) pAgeYears = parsed;
  }

  // Filter matching ranges
  const matching = ranges.filter((r) => {
    // Check Sex
    if (r.sex && r.sex !== 'any') {
      if (!pSex || r.sex.toUpperCase() !== pSex) return false;
    }

    // Check Age if patient age is known and range has age limits
    if (pAgeYears !== null) {
      const unit = r.ageUnit || 'years';
      const toYears = (val: number | null | undefined) => {
        if (val == null) return null;
        if (unit === 'days') return val / 365.25;
        if (unit === 'months') return val / 12;
        return val;
      };
      const minYears = toYears(r.ageMin);
      const maxYears = toYears(r.ageMax);

      if (minYears !== null && pAgeYears < minYears) return false;
      if (maxYears !== null && pAgeYears > maxYears) return false;
    }
    return true;
  });

  // If match found
  if (matching.length > 0) {
    // Sort to pick the most specific match (prioritize matching sex != 'any', then matching age bounds)
    const sorted = [...matching].sort((a, b) => {
      const aSpecificSex = a.sex && a.sex !== 'any' ? 1 : 0;
      const bSpecificSex = b.sex && b.sex !== 'any' ? 1 : 0;
      if (bSpecificSex !== aSpecificSex) return bSpecificSex - aSpecificSex;
      const aHasAge = (a.ageMin != null || a.ageMax != null) ? 1 : 0;
      const bHasAge = (b.ageMin != null || b.ageMax != null) ? 1 : 0;
      return bHasAge - aHasAge;
    });

    const chosen = sorted[0];
    const text = chosen.text || (chosen.low != null && chosen.high != null 
      ? `${chosen.low} - ${chosen.high}` 
      : (chosen.low != null ? `>= ${chosen.low}` : chosen.high != null ? `<= ${chosen.high}` : ''));
    const displayText = chosen.label ? `${chosen.label}: ${text}` : text;
    return { rangeText: displayText || fallback, isSpecificMatch: true, matchedRange: chosen };
  }

  // If nothing matched, format all ranges
  const allText = ranges
    .map((r) => {
      const t = r.text || (r.low != null && r.high != null 
        ? `${r.low} - ${r.high}` 
        : (r.low != null ? `>= ${r.low}` : r.high != null ? `<= ${r.high}` : ''));
      return r.label ? `${r.label}: ${t}` : t;
    })
    .filter(Boolean)
    .join(' | ');

  return { rangeText: allText || fallback, isSpecificMatch: false };
}

