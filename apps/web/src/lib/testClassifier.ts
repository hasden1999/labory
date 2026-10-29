/**
 * Test Classification Utility
 * Decouples specialized test type detection from route handlers (Print & WhatsApp)
 * and workstation modals.
 */

export type SpecializedClinicalFormType =
  | 'BLOOD_FILM'
  | 'BODY_FLUID'
  | 'STONE_ANALYSIS'
  | 'COAG_PROFILE'
  | 'OGTT_CURVE';

export interface TestLike {
  code?: string | null;
  testCode?: string | null;
  name?: string | null;
  testName?: string | null;
  arabicName?: string | null;
  resultValue?: string | null;
  test?: {
    code?: string | null;
    name?: string | null;
    arabicName?: string | null;
  } | null;
  [key: string]: any;
}

function extractTestFields(t: TestLike | null | undefined) {
  if (!t) return { code: '', name: '', val: '' };
  const code = String(t.test?.code || t.testCode || t.code || '').trim().toUpperCase();
  const rawName = [
    t.test?.name,
    t.test?.arabicName,
    t.testName,
    t.name,
    t.arabicName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return { code, name: rawName, val };
}

const GUE_ROUTINE_CODES = new Set(['GUE', 'URINE-ROUTINE', 'URINE', 'CUE']);
const GUE_ROUTINE_NAME_KEYWORDS = [
  'general urine',
  'urine routine',
  'urine analysis',
  'urinalysis',
  'complete urine',
  'فحص الإدرار العام',
  'فحص الادرار العام',
  'تحليل البول العام',
  'تحليل الإدرار العام',
  'فحص بول عام',
];
const GUE_EXCLUSION_KEYWORDS = [
  '24h',
  '24-hour',
  '24 hour',
  '24 ساعة',
  'protein',
  'creatinine',
  'calcium',
  'uric',
  'amylase',
  'microalbumin',
  'acr',
  'upcr',
  'ratio',
  'culture',
  'مزرعة',
  'pregnancy',
  'حمل',
  'tox',
  'drug',
  'screen',
  'مخدرات',
  'سموم',
  'sodium',
  'potassium',
  'chloride',
  'osmolality',
  'bence',
  'catecholamine',
  'vma',
  'metanephrine',
  'cortisol',
  'copper',
  'lead',
  'legionella',
  'pneumophila',
  'schistosoma',
  'reducing',
];

const GSE_ROUTINE_CODES = new Set(['GSE', 'STOOL-ROUTINE', 'STOOL', 'CSE']);
const GSE_ROUTINE_NAME_KEYWORDS = [
  'general stool',
  'stool routine',
  'stool analysis',
  'complete stool',
  'فحص الخروج العام',
  'فحص البراز العام',
  'تحليل البراز العام',
  'تحليل الخروج العام',
  'فحص براز عام',
];
const GSE_EXCLUSION_KEYWORDS = [
  'antigen',
  'pylori',
  'h.pylori',
  'h pylori',
  'جرثومة',
  'occult',
  'fobt',
  'دم خفي',
  'calprotectin',
  'كالبروتكتين',
  'rota',
  'adeno',
  'giardia',
  'amoeba',
  'cryptosporidium',
  'clostridium',
  'difficile',
  'toxin',
  'culture',
  'مزرعة',
  'reducing',
  'elastase',
  'fat',
  'ph',
  'trypsin',
];

const SFA_EXCLUSION_KEYWORDS = [
  'culture',
  'مزرعة',
  'fructose',
  'antibodies',
  'mar test',
];

export const isCbcTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    code === 'CBC' ||
    code === 'FBC' ||
    name.includes('complete blood count') ||
    (name.includes('صورة الدم') && !name.includes('المحيطية')) ||
    val.includes('ERYTHROID:') ||
    val.includes('DIFFERENTIAL:')
  );
};

export const isSfaTest = (t: TestLike | null | undefined): boolean => {
  if (!t || isCbcTest(t)) return false;
  const { code, name, val } = extractTestFields(t);
  if (SFA_EXCLUSION_KEYWORDS.some((kw) => name.includes(kw))) {
    return false;
  }
  return (
    code === 'SFA' ||
    val.includes('S.F.A') ||
    val.includes('SEMINAL') ||
    name.includes('semen') ||
    name.includes('سائل منوي') ||
    name.includes('نطف') ||
    (val.includes('PHYSICAL:') && (val.includes('MOTILITY:') || val.includes('MORPHOLOGY:')))
  );
};

export const isGueTest = (t: TestLike | null | undefined): boolean => {
  if (!t || isCbcTest(t) || isSfaTest(t)) return false;
  const { code, name, val } = extractTestFields(t);

  if (GUE_ROUTINE_CODES.has(code)) return true;

  if (GUE_EXCLUSION_KEYWORDS.some((kw) => name.includes(kw))) {
    return false;
  }

  if (GUE_ROUTINE_NAME_KEYWORDS.some((kw) => name.includes(kw))) {
    return true;
  }

  return (
    val.includes('G.U.E') ||
    (val.includes('PHYSICAL:') &&
      !val.includes('G.S.E') &&
      !val.includes('PARASITOLOGY:') &&
      !val.includes('MOTILITY:'))
  );
};

export const isGseTest = (t: TestLike | null | undefined): boolean => {
  if (!t || isCbcTest(t) || isSfaTest(t)) return false;
  const { code, name, val } = extractTestFields(t);

  if (GSE_ROUTINE_CODES.has(code)) return true;

  if (GSE_EXCLUSION_KEYWORDS.some((kw) => name.includes(kw))) {
    return false;
  }

  if (GSE_ROUTINE_NAME_KEYWORDS.some((kw) => name.includes(kw))) {
    return true;
  }

  return val.includes('G.S.E') || val.includes('PARASITOLOGY:');
};

export const isAmhTest = (t: TestLike | null | undefined): boolean => {
  if (!t || isCbcTest(t) || isSfaTest(t) || isGueTest(t) || isGseTest(t)) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    code === 'AMH' ||
    val.includes('ANTI-MULLERIAN') ||
    val.includes('AMH') ||
    name.includes('anti-mullerian') ||
    name.includes('mullerian') ||
    name.includes('amh') ||
    name.includes('مخزون المبيض') ||
    name.includes('مخزون مبيض')
  );
};

export const isBhcgTest = (t: TestLike | null | undefined): boolean => {
  if (!t || isCbcTest(t) || isSfaTest(t) || isGueTest(t) || isGseTest(t) || isAmhTest(t)) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    code === 'BHCG' ||
    code === 'B-HCG' ||
    code === 'HCG' ||
    val.includes('BETA-HCG') ||
    val.includes('Β-HCG') ||
    name.includes('beta-hcg') ||
    name.includes('b-hcg') ||
    name.includes('beta hcg') ||
    name.includes('β-hcg') ||
    name.includes('حمل رقمي') ||
    name.includes('pregnancy quantitative') ||
    (name.includes('hcg') && !name.includes('rapid') && !name.includes('strip'))
  );
};

export const isCultureTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    code.includes('CULTURE') ||
    code.includes('SENSITIVITY') ||
    name.includes('culture') ||
    name.includes('مزرعة') ||
    name.includes('زرع') ||
    name.includes('sensitivity') ||
    val.includes('ORGANISM') ||
    val.includes('ANTIBIOTIC')
  );
};

const BLOOD_FILM_CODES = new Set(['BLOOD-FILM', 'PBF', 'PBS', 'BLOOD-SMEAR']);
const BLOOD_FILM_KEYWORDS = [
  'blood film',
  'peripheral smear',
  'peripheral blood smear',
  'blood picture',
  'مسحة الدم',
  'فلم الدم',
  'صورة الدم المحيطية',
];

export const isBloodFilmTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    BLOOD_FILM_CODES.has(code) ||
    BLOOD_FILM_KEYWORDS.some((kw) => name.includes(kw)) ||
    val.includes('"_formType":"BLOOD_FILM"')
  );
};

const BODY_FLUID_CODES = new Set([
  'CSF-FLUID',
  'CSF-ANALYSIS',
  'PLEURAL-FLUID',
  'ASCITIC-FLUID',
  'PERITONEAL-FL',
  'SYNOVIAL-FLUID',
  'PERICARDIAL-FLUID',
  'BODY-FLUID',
]);
const BODY_FLUID_KEYWORDS = [
  'csf analysis',
  'cerebrospinal fluid',
  'pleural fluid',
  'ascitic fluid',
  'synovial fluid',
  'peritoneal fluid',
  'سائل النخاع',
  'السائل الشوكي',
  'السائل الجنبي',
  'سائل الاستسقاء',
  'السائل المفصلي',
  'تحليل سوائل الجسم',
];

export const isBodyFluidTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    BODY_FLUID_CODES.has(code) ||
    BODY_FLUID_KEYWORDS.some((kw) => name.includes(kw)) ||
    val.includes('"_formType":"BODY_FLUID"')
  );
};

const STONE_ANALYSIS_CODES = new Set(['STONE-ANALYSIS', 'RENAL-STONE', 'KIDNEY-STONE']);
const STONE_ANALYSIS_KEYWORDS = [
  'stone analysis',
  'calculi analysis',
  'renal stone',
  'urinary stone',
  'تحليل الحصى',
  'تحليل حصى الكلى',
];

export const isStoneAnalysisTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    STONE_ANALYSIS_CODES.has(code) ||
    STONE_ANALYSIS_KEYWORDS.some((kw) => name.includes(kw)) ||
    val.includes('"_formType":"STONE_ANALYSIS"')
  );
};

const COAG_PROFILE_CODES = new Set(['COAG-PROFILE', 'COAG-PANEL']);
const COAG_PROFILE_KEYWORDS = [
  'coagulation profile',
  'coagulation screen',
  'ملف التخثر الشامل',
  'فورمة تخثر الدم',
];

export const isCoagProfileTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    COAG_PROFILE_CODES.has(code) ||
    COAG_PROFILE_KEYWORDS.some((kw) => name.includes(kw)) ||
    val.includes('"_formType":"COAG_PROFILE"')
  );
};

const OGTT_CURVE_CODES = new Set(['OGTT-CURVE', 'GTT-CURVE', 'OGTT-PANEL']);
const OGTT_CURVE_KEYWORDS = [
  'ogtt curve',
  'glucose tolerance curve',
  'منحنى تحمل السكر',
];

export const isOgttCurveTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  const { code, name, val } = extractTestFields(t);
  return (
    OGTT_CURVE_CODES.has(code) ||
    OGTT_CURVE_KEYWORDS.some((kw) => name.includes(kw)) ||
    val.includes('"_formType":"OGTT_CURVE"')
  );
};

export const detectSpecializedClinicalForm = (
  t: TestLike | null | undefined
): SpecializedClinicalFormType | null => {
  if (!t) return null;
  if (isBloodFilmTest(t)) return 'BLOOD_FILM';
  if (isBodyFluidTest(t)) return 'BODY_FLUID';
  if (isStoneAnalysisTest(t)) return 'STONE_ANALYSIS';
  if (isCoagProfileTest(t)) return 'COAG_PROFILE';
  if (isOgttCurveTest(t)) return 'OGTT_CURVE';
  return null;
};

export const isSpecializedTest = (t: TestLike | null | undefined): boolean => {
  if (!t) return false;
  return (
    isCbcTest(t) ||
    isSfaTest(t) ||
    isGueTest(t) ||
    isGseTest(t) ||
    isAmhTest(t) ||
    isBhcgTest(t) ||
    detectSpecializedClinicalForm(t) !== null
  );
};

export const isGeneralTest = (t: TestLike | null | undefined): boolean =>
  !isSpecializedTest(t);

