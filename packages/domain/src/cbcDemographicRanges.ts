/**
 * cbcDemographicRanges.ts
 *
 * Age- & Gender-Specific CBC Reference Intervals based on Authoritative Medical References:
 * - Dacie and Lewis Practical Haematology (12th Edition)
 * - WHO Haemoglobin Concentrations for the Diagnosis of Anaemia
 * - Mindray & Sysmex Reference Guidelines (Iraqi Clinical Laboratory Practice)
 *
 * Provides:
 * 1. 6 Demographic Brackets (Newborn, Infant, Child 2-5y, Child 6-12y, Adult Female, Adult Male)
 * 2. Automatic patient demographic resolution
 * 3. Default accredited reference matrix
 * 4. Extensibility for user customizations and lab-specific kit overrides
 */

import { computeAgeBreakdown } from './ageUtils';

export type CbcDemographicBracketId =
  | 'NEWBORN'      // حديثو الولادة: 1-28 يوماً
  | 'INFANT'       // الرضع: شهر - 23 شهراً
  | 'CHILD_2_5'    // أطفال صغار: 2 - 5 سنوات
  | 'CHILD_6_12'   // أطفال: 6 - 12 سنة
  | 'ADULT_FEMALE' // بالغات - إناث: ≥ 13 سنة
  | 'ADULT_MALE';  // بالغون - ذكور: ≥ 13 سنة

export interface CbcDemographicBracketMeta {
  id: CbcDemographicBracketId;
  labelAr: string;
  labelEn: string;
  nameAr: string;
  nameEn: string;
  ageDescriptionAr: string;
  ageDescriptionEn: string;
  ageRange: string;
  badge: string;
}

export const CBC_DEMOGRAPHIC_BRACKETS: CbcDemographicBracketMeta[] = [
  {
    id: 'NEWBORN',
    labelAr: 'حديثو الولادة (1 - 28 يوماً)',
    labelEn: 'Newborns (1 - 28 Days)',
    nameAr: 'حديثو الولادة (1 - 28 يوماً)',
    nameEn: 'Newborns (1 - 28 Days)',
    ageDescriptionAr: 'من اليوم الأول حتى 28 يوماً',
    ageDescriptionEn: '1 to 28 Days',
    ageRange: '1 - 28 يوم',
    badge: '👶 حديث ولادة',
  },
  {
    id: 'INFANT',
    labelAr: 'الرضع (شهر - 23 شهراً)',
    labelEn: 'Infants (1 - 23 Months)',
    nameAr: 'الرضع (شهر - 23 شهراً)',
    nameEn: 'Infants (1 - 23 Months)',
    ageDescriptionAr: 'من عمر شهر حتى سنتين غير مكتملتين',
    ageDescriptionEn: '1 to 23 Months',
    ageRange: '1 - 23 شهر',
    badge: '🍼 رضيع',
  },
  {
    id: 'CHILD_2_5',
    labelAr: 'أطفال صغار (2 - 5 سنوات)',
    labelEn: 'Young Children (2 - 5 Years)',
    nameAr: 'أطفال صغار (2 - 5 سنوات)',
    nameEn: 'Young Children (2 - 5 Years)',
    ageDescriptionAr: 'من عمر سنتين حتى 5 سنوات',
    ageDescriptionEn: '2 to 5 Years',
    ageRange: '2 - 5 سنوات',
    badge: '🧒 طفل (2-5)',
  },
  {
    id: 'CHILD_6_12',
    labelAr: 'أطفال (6 - 12 سنة)',
    labelEn: 'Children (6 - 12 Years)',
    nameAr: 'أطفال (6 - 12 سنة)',
    nameEn: 'Children (6 - 12 Years)',
    ageDescriptionAr: 'من عمر 6 سنوات حتى 12 سنة',
    ageDescriptionEn: '6 to 12 Years',
    ageRange: '6 - 12 سنة',
    badge: '🧒 طفل (6-12)',
  },
  {
    id: 'ADULT_FEMALE',
    labelAr: 'بالغات - إناث (≥ 13 سنة)',
    labelEn: 'Adult Females (≥ 13 Years)',
    nameAr: 'بالغات - إناث (≥ 13 سنة)',
    nameEn: 'Adult Females (≥ 13 Years)',
    ageDescriptionAr: 'الإناث البالغات من عمر 13 سنة فما فوق',
    ageDescriptionEn: 'Females 13+ Years',
    ageRange: '≥ 13 سنة',
    badge: '👩 أنثى بالغة',
  },
  {
    id: 'ADULT_MALE',
    labelAr: 'بالغون - ذكور (≥ 13 سنة)',
    labelEn: 'Adult Males (≥ 13 Years)',
    nameAr: 'بالغون - ذكور (≥ 13 سنة)',
    nameEn: 'Adult Males (≥ 13 Years)',
    ageDescriptionAr: 'الذكور البالغون من عمر 13 سنة فما فوق',
    ageDescriptionEn: 'Males 13+ Years',
    ageRange: '≥ 13 سنة',
    badge: '👨 ذكر بالغ',
  },
];

export interface CbcRangeBounds {
  min: number;
  max: number;
  text?: string;
  formatted?: string;
}

/**
 * Standard Default Reference Matrix per demographic bracket.
 * Formatted to match standard laboratory units (10^9/L or 10^3/µL, g/dL, %, fL, pg).
 */
export const DEFAULT_CBC_DEMOGRAPHIC_MATRIX: Record<CbcDemographicBracketId, Record<string, CbcRangeBounds>> = {
  NEWBORN: {
    wbc: { min: 9.0, max: 30.0 },
    rbc: { min: 4.0, max: 6.5 },
    hgb: { min: 14.5, max: 22.5 },
    hct: { min: 45.0, max: 67.0 },
    mcv: { min: 95.0, max: 120.0 },
    mch: { min: 31.0, max: 37.0 },
    mchc: { min: 30.0, max: 36.0 },
    plt: { min: 150, max: 450 },
    rdw: { min: 14.0, max: 19.0 },
    rdwSd: { min: 40.0, max: 65.0 },
    mpv: { min: 6.5, max: 11.5 },
    pdw: { min: 9.0, max: 17.0 },
    pct: { min: 0.15, max: 0.45 },
    graPct: { min: 45.0, max: 75.0 },
    graAbs: { min: 4.5, max: 20.0 },
    lymPct: { min: 20.0, max: 45.0 },
    lymAbs: { min: 2.0, max: 11.0 },
    midPct: { min: 3.0, max: 12.0 },
    midAbs: { min: 0.3, max: 2.5 },
    neutrophils: { min: 45.0, max: 75.0 },
    neutrophilsAbs: { min: 4.5, max: 20.0 },
    lymphocytes: { min: 20.0, max: 45.0 },
    lymphocytesAbs: { min: 2.0, max: 11.0 },
    monocytes: { min: 3.0, max: 12.0 },
    monocytesAbs: { min: 0.3, max: 2.5 },
    eosinophils: { min: 1.0, max: 6.0 },
    eosinophilsAbs: { min: 0.1, max: 1.5 },
    basophils: { min: 0.0, max: 2.0 },
    basophilsAbs: { min: 0.0, max: 0.4 },
  },

  INFANT: {
    wbc: { min: 6.0, max: 17.5 },
    rbc: { min: 3.7, max: 5.3 },
    hgb: { min: 10.5, max: 13.5 },
    hct: { min: 33.0, max: 42.0 },
    mcv: { min: 70.0, max: 86.0 },
    mch: { min: 23.0, max: 31.0 },
    mchc: { min: 30.0, max: 36.0 },
    plt: { min: 150, max: 450 },
    rdw: { min: 11.5, max: 15.5 },
    rdwSd: { min: 35.0, max: 52.0 },
    mpv: { min: 6.5, max: 11.0 },
    pdw: { min: 9.0, max: 17.0 },
    pct: { min: 0.15, max: 0.45 },
    graPct: { min: 20.0, max: 45.0 },
    graAbs: { min: 1.5, max: 7.0 },
    lymPct: { min: 45.0, max: 70.0 },
    lymAbs: { min: 3.0, max: 11.5 },
    midPct: { min: 2.0, max: 10.0 },
    midAbs: { min: 0.1, max: 1.5 },
    neutrophils: { min: 20.0, max: 45.0 },
    neutrophilsAbs: { min: 1.5, max: 7.0 },
    lymphocytes: { min: 45.0, max: 70.0 },
    lymphocytesAbs: { min: 3.0, max: 11.5 },
    monocytes: { min: 2.0, max: 10.0 },
    monocytesAbs: { min: 0.1, max: 1.5 },
    eosinophils: { min: 1.0, max: 5.0 },
    eosinophilsAbs: { min: 0.05, max: 0.8 },
    basophils: { min: 0.0, max: 1.5 },
    basophilsAbs: { min: 0.0, max: 0.2 },
  },

  CHILD_2_5: {
    wbc: { min: 5.5, max: 15.5 },
    rbc: { min: 3.9, max: 5.3 },
    hgb: { min: 11.0, max: 14.0 },
    hct: { min: 34.0, max: 42.0 },
    mcv: { min: 75.0, max: 87.0 },
    mch: { min: 24.0, max: 30.0 },
    mchc: { min: 31.0, max: 36.0 },
    plt: { min: 150, max: 450 },
    rdw: { min: 11.5, max: 15.0 },
    rdwSd: { min: 35.0, max: 52.0 },
    mpv: { min: 6.5, max: 11.0 },
    pdw: { min: 9.0, max: 17.0 },
    pct: { min: 0.15, max: 0.45 },
    graPct: { min: 30.0, max: 55.0 },
    graAbs: { min: 1.8, max: 8.0 },
    lymPct: { min: 35.0, max: 60.0 },
    lymAbs: { min: 2.0, max: 8.5 },
    midPct: { min: 2.0, max: 9.0 },
    midAbs: { min: 0.1, max: 1.2 },
    neutrophils: { min: 30.0, max: 55.0 },
    neutrophilsAbs: { min: 1.8, max: 8.0 },
    lymphocytes: { min: 35.0, max: 60.0 },
    lymphocytesAbs: { min: 2.0, max: 8.5 },
    monocytes: { min: 2.0, max: 9.0 },
    monocytesAbs: { min: 0.1, max: 1.2 },
    eosinophils: { min: 1.0, max: 5.0 },
    eosinophilsAbs: { min: 0.05, max: 0.7 },
    basophils: { min: 0.0, max: 1.5 },
    basophilsAbs: { min: 0.0, max: 0.2 },
  },

  CHILD_6_12: {
    wbc: { min: 4.5, max: 13.5 },
    rbc: { min: 4.0, max: 5.2 },
    hgb: { min: 11.5, max: 15.5 },
    hct: { min: 35.0, max: 45.0 },
    mcv: { min: 77.0, max: 95.0 },
    mch: { min: 25.0, max: 33.0 },
    mchc: { min: 32.0, max: 36.0 },
    plt: { min: 150, max: 450 },
    rdw: { min: 11.5, max: 14.5 },
    rdwSd: { min: 36.0, max: 54.0 },
    mpv: { min: 6.5, max: 11.0 },
    pdw: { min: 9.0, max: 17.0 },
    pct: { min: 0.15, max: 0.45 },
    graPct: { min: 40.0, max: 65.0 },
    graAbs: { min: 2.0, max: 8.0 },
    lymPct: { min: 25.0, max: 50.0 },
    lymAbs: { min: 1.5, max: 6.5 },
    midPct: { min: 2.0, max: 9.0 },
    midAbs: { min: 0.1, max: 1.1 },
    neutrophils: { min: 40.0, max: 65.0 },
    neutrophilsAbs: { min: 2.0, max: 8.0 },
    lymphocytes: { min: 25.0, max: 50.0 },
    lymphocytesAbs: { min: 1.5, max: 6.5 },
    monocytes: { min: 2.0, max: 9.0 },
    monocytesAbs: { min: 0.1, max: 1.1 },
    eosinophils: { min: 1.0, max: 5.0 },
    eosinophilsAbs: { min: 0.05, max: 0.6 },
    basophils: { min: 0.0, max: 1.5 },
    basophilsAbs: { min: 0.0, max: 0.2 },
  },

  ADULT_FEMALE: {
    wbc: { min: 4.0, max: 11.0 },
    rbc: { min: 3.8, max: 5.2 },
    hgb: { min: 12.0, max: 15.5 },
    hct: { min: 36.0, max: 46.0 },
    mcv: { min: 80.0, max: 100.0 },
    mch: { min: 27.0, max: 34.0 },
    mchc: { min: 32.0, max: 36.0 },
    plt: { min: 150, max: 450 },
    rdw: { min: 11.5, max: 14.5 },
    rdwSd: { min: 37.0, max: 54.0 },
    mpv: { min: 7.0, max: 11.5 },
    pdw: { min: 9.0, max: 17.0 },
    pct: { min: 0.15, max: 0.35 },
    graPct: { min: 40.0, max: 75.0 },
    graAbs: { min: 2.0, max: 7.5 },
    lymPct: { min: 20.0, max: 45.0 },
    lymAbs: { min: 1.0, max: 4.0 },
    midPct: { min: 2.0, max: 10.0 },
    midAbs: { min: 0.1, max: 1.2 },
    neutrophils: { min: 40.0, max: 75.0 },
    neutrophilsAbs: { min: 2.0, max: 7.5 },
    lymphocytes: { min: 20.0, max: 45.0 },
    lymphocytesAbs: { min: 1.0, max: 4.0 },
    monocytes: { min: 2.0, max: 10.0 },
    monocytesAbs: { min: 0.1, max: 1.2 },
    eosinophils: { min: 1.0, max: 6.0 },
    eosinophilsAbs: { min: 0.02, max: 0.5 },
    basophils: { min: 0.0, max: 1.5 },
    basophilsAbs: { min: 0.0, max: 0.1 },
  },

  ADULT_MALE: {
    wbc: { min: 4.0, max: 11.0 },
    rbc: { min: 4.5, max: 5.9 },
    hgb: { min: 13.0, max: 17.5 },
    hct: { min: 40.0, max: 52.0 },
    mcv: { min: 80.0, max: 100.0 },
    mch: { min: 27.0, max: 34.0 },
    mchc: { min: 32.0, max: 36.0 },
    plt: { min: 150, max: 450 },
    rdw: { min: 11.5, max: 14.5 },
    rdwSd: { min: 37.0, max: 54.0 },
    mpv: { min: 7.0, max: 11.5 },
    pdw: { min: 9.0, max: 17.0 },
    pct: { min: 0.15, max: 0.35 },
    graPct: { min: 40.0, max: 75.0 },
    graAbs: { min: 2.0, max: 7.5 },
    lymPct: { min: 20.0, max: 45.0 },
    lymAbs: { min: 1.0, max: 4.0 },
    midPct: { min: 2.0, max: 10.0 },
    midAbs: { min: 0.1, max: 1.2 },
    neutrophils: { min: 40.0, max: 75.0 },
    neutrophilsAbs: { min: 2.0, max: 7.5 },
    lymphocytes: { min: 20.0, max: 45.0 },
    lymphocytesAbs: { min: 1.0, max: 4.0 },
    monocytes: { min: 2.0, max: 10.0 },
    monocytesAbs: { min: 0.1, max: 1.2 },
    eosinophils: { min: 1.0, max: 6.0 },
    eosinophilsAbs: { min: 0.02, max: 0.5 },
    basophils: { min: 0.0, max: 1.5 },
    basophilsAbs: { min: 0.0, max: 0.1 },
  },
};

/**
 * Resolves patient age & gender into one of the 6 canonical CBC demographic brackets.
 */
export function resolveCbcDemographicBracket(patient: {
  age?: number | string | null;
  ageYears?: number | string | null;
  ageMonths?: number | string | null;
  ageDays?: number | string | null;
  birthDate?: string | Date | null;
  gender?: string | null;
}): CbcDemographicBracketId {
  const g = String(patient?.gender || '').toUpperCase();
  const isFemale = g === 'FEMALE' || g === 'أنثى' || g === 'F';

  let years = patient?.ageYears !== undefined && patient?.ageYears !== null
    ? Number(patient.ageYears)
    : (patient?.age !== undefined && patient?.age !== null ? Number(patient.age) : NaN);

  let months = patient?.ageMonths !== undefined && patient?.ageMonths !== null ? Number(patient.ageMonths) : NaN;
  let days = patient?.ageDays !== undefined && patient?.ageDays !== null ? Number(patient.ageDays) : NaN;

  if (patient?.birthDate) {
    try {
      const breakdown = computeAgeBreakdown(patient.birthDate);
      years = breakdown.years;
      months = breakdown.months;
      days = breakdown.days;
    } catch {}
  }

  // 1. Neonatal check (Days 1 - 28)
  if (!isNaN(days) && days > 0 && days <= 28 && (isNaN(years) || years === 0) && (isNaN(months) || months === 0)) {
    return 'NEWBORN';
  }

  // 2. Infancy check (1 Month to 23 Months)
  if (!isNaN(months) && months > 0 && months <= 23 && (isNaN(years) || years === 0)) {
    return 'INFANT';
  }
  if (!isNaN(years) && years === 1) {
    return 'INFANT';
  }
  if (!isNaN(years) && years === 0 && !isNaN(months) && months > 0) {
    return 'INFANT';
  }
  if (!isNaN(years) && years === 0 && !isNaN(days) && days > 28) {
    return 'INFANT';
  }

  // 3. Young Children (2 - 5 Years)
  if (!isNaN(years) && years >= 2 && years <= 5) {
    return 'CHILD_2_5';
  }

  // 4. Children (6 - 12 Years)
  if (!isNaN(years) && years >= 6 && years <= 12) {
    return 'CHILD_6_12';
  }

  // 5. Adults (≥ 13 Years)
  if (isFemale) {
    return 'ADULT_FEMALE';
  }
  return 'ADULT_MALE';
}

/**
 * Returns metadata description for a bracket.
 */
export function getCbcDemographicBracketMeta(bracketId: CbcDemographicBracketId): CbcDemographicBracketMeta {
  return CBC_DEMOGRAPHIC_BRACKETS.find((b) => b.id === bracketId) || CBC_DEMOGRAPHIC_BRACKETS[5];
}

/**
 * Normalizes a CBC parameter key (e.g. 'HGB', 'HB', 'hgb' -> 'hgb').
 */
export function normalizeCbcParamKey(key: string): string {
  const k = String(key || '').toLowerCase().trim();
  if (k === 'hb' || k === 'hgb' || k === 'hemoglobin') return 'hgb';
  if (k === 'pcv' || k === 'hct') return 'hct';
  if (k === 'wbc' || k === 'wbc_count') return 'wbc';
  if (k === 'rbc' || k === 'rbc_count') return 'rbc';
  if (k === 'plt' || k === 'platelets') return 'plt';
  if (k === 'mcv') return 'mcv';
  if (k === 'mch') return 'mch';
  if (k === 'mchc') return 'mchc';
  if (k === 'rdw' || k === 'rdw_cv' || k === 'rdw-cv') return 'rdw';
  if (k === 'rdwa' || k === 'rdwsd' || k === 'rdw-sd' || k === 'rdw_sd') return 'rdwSd';
  if (k === 'mpv') return 'mpv';
  if (k === 'pdw' || k === 'pdw_cv' || k === 'pdw-cv') return 'pdw';
  if (k === 'pct') return 'pct';
  if (k === 'grapct' || k === 'gra%' || k === 'gran%' || k === 'neu%' || k === 'neutrophils') return 'graPct';
  if (k === 'graabs' || k === 'gra#' || k === 'gran#' || k === 'neu#' || k === 'neutrophilsabs') return 'graAbs';
  if (k === 'lympct' || k === 'lym%' || k === 'lymph%' || k === 'lymphocytes') return 'lymPct';
  if (k === 'lymabs' || k === 'lym#' || k === 'lymph#' || k === 'lymphocytesabs') return 'lymAbs';
  if (k === 'midpct' || k === 'mid%' || k === 'mxd%' || k === 'mono%' || k === 'monocytes') return 'midPct';
  if (k === 'midabs' || k === 'mid#' || k === 'mxd#' || k === 'mono#' || k === 'monocytesabs') return 'midAbs';
  if (k === 'eospct' || k === 'eos%' || k === 'eosinophils') return 'eosinophils';
  if (k === 'eosabs' || k === 'eos#' || k === 'eosinophilsabs') return 'eosinophilsAbs';
  if (k === 'basopct' || k === 'bas%' || k === 'baso%' || k === 'basophils') return 'basophils';
  if (k === 'basoabs' || k === 'bas#' || k === 'baso#' || k === 'basophilsabs') return 'basophilsAbs';
  return k;
}

/**
 * Gets the effective CBC parameter range for a given demographic bracket,
 * with priority given to custom user matrix overrides.
 * Accepts arguments in either order (paramKey, bracketId) or (bracketId, paramKey) for robust ergonomics.
 */
export function getCbcParamDemographicRange(
  a: string,
  b: string,
  customDemographicMatrix?: Record<string, Record<string, { min?: number; max?: number }>> | null
): CbcRangeBounds {
  const isBBracket = ['NEWBORN', 'INFANT', 'CHILD_2_5', 'CHILD_6_12', 'ADULT_FEMALE', 'ADULT_MALE'].includes(b);
  const bracketId = (isBBracket ? b : a) as CbcDemographicBracketId;
  const paramKey = isBBracket ? a : b;

  const normKey = normalizeCbcParamKey(paramKey);
  const defBracket = DEFAULT_CBC_DEMOGRAPHIC_MATRIX[bracketId] || DEFAULT_CBC_DEMOGRAPHIC_MATRIX.ADULT_MALE;
  const def = defBracket[normKey] || { min: 0, max: 0 };

  const customBracket = customDemographicMatrix?.[bracketId];
  const customParam = customBracket?.[normKey] || customBracket?.[paramKey];

  const min = typeof customParam?.min === 'number' && !isNaN(customParam.min) ? customParam.min : def.min;
  const max = typeof customParam?.max === 'number' && !isNaN(customParam.max) ? customParam.max : def.max;

  const minDec = min % 1 === 0 ? 0 : (normKey === 'rbc' ? 2 : 1);
  const maxDec = max % 1 === 0 ? 0 : (normKey === 'rbc' ? 2 : 1);
  const text = `${min.toFixed(minDec)} - ${max.toFixed(maxDec)}`;

  return { min, max, text, formatted: text };
}

/**
 * Resolves all CBC reference ranges for a patient, returning their demographic bracket
 * and the parameter range lookup table.
 */
export function getPatientCbcDemographicRanges(
  patient: {
    age?: number | string | null;
    ageYears?: number | string | null;
    ageMonths?: number | string | null;
    ageDays?: number | string | null;
    birthDate?: string | Date | null;
    gender?: string | null;
  },
  customDemographicMatrix?: Record<string, Record<string, { min?: number; max?: number }>> | null
): {
  bracketId: CbcDemographicBracketId;
  bracketMeta: CbcDemographicBracketMeta;
  bracket: CbcDemographicBracketMeta;
  getRange: (paramKey: string) => CbcRangeBounds;
} {
  const bracketId = resolveCbcDemographicBracket(patient);
  const bracketMeta = getCbcDemographicBracketMeta(bracketId);

  return {
    bracketId,
    bracketMeta,
    bracket: bracketMeta,
    getRange: (paramKey: string) => getCbcParamDemographicRange(paramKey, bracketId, customDemographicMatrix),
  };
}
