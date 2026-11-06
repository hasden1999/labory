/**
 * Clinical Intelligence Helper for Qualitative / Text-Based Test Results
 * Identifies tests requiring categorical choices (e.g. Positive / Negative, Non-Reactive / Reactive, Blood Groups, Titers)
 * and generates appropriate quick-selection options and clinical visual tokens.
 */

export type QualitativeTestKind =
  | 'blood_group'       // Phenotype variants: ABO, Rh, Du, Kell (Both pos & neg are normal)
  | 'pregnancy'         // Physiological status: Urine hCG, Serum qualitative hCG (Positive = Pregnant, Negative = Non-pregnant)
  | 'immunity'          // Protective antibodies / vaccination: Anti-HBs, Rubella IgG, Toxo IgG, CMV IgG (Positive = Immune/Protected)
  | 'compatibility'     // Cross-matching: Compatible / Incompatible
  | 'infectious_screen' // HBsAg, HCV, HIV, Syphilis, FOBT, Widal, Brucella, Drugs (Negative = Normal, Positive = Abnormal)
  | 'physical_exam'     // Appearance, Color, Consistency
  | 'general_qualitative';

export interface QualitativeOptionConfig {
  options: string[];
  defaultOption?: string;
  isBloodGroup?: boolean;
}

export interface QualitativeVisualTokens {
  color: string;
  borderColor: string;
  backgroundColor: string;
  statusLabel?: string;
  isAbnormal?: boolean;
}

const BLOOD_GROUP_OPTIONS = [
  'O Positive (O+)',
  'O Negative (O-)',
  'A Positive (A+)',
  'A Negative (A-)',
  'B Positive (B+)',
  'B Negative (B-)',
  'AB Positive (AB+)',
  'AB Negative (AB-)',
];

const RH_TYPING_OPTIONS = [
  'Positive (+ve)',
  'Negative (-ve)',
];

const PREGNANCY_OPTIONS = [
  'Positive',
  'Negative',
  'Weakly Positive',
  'Borderline',
];

const COMPATIBILITY_OPTIONS = [
  'Compatible',
  'Incompatible',
  'Compatible (متوافق)',
  'Incompatible (غير متوافق)',
];

const IMMUNITY_OPTIONS = [
  'Positive (Immune)',
  'Negative (Non-immune)',
  'Reactive',
  'Non-Reactive',
  'Positive',
  'Negative',
  'Borderline',
];

const TITER_OPTIONS = [
  'Negative',
  'Positive (1:80)',
  'Positive (1:160)',
  'Positive (1:320)',
  'Positive (1:640)',
  'Positive',
];

const STANDARD_SEROLOGY_OPTIONS = [
  'Negative',
  'Positive',
  'Weakly Positive',
  'Borderline',
  'Non-Reactive',
  'Reactive',
];

const NON_REACTIVE_OPTIONS = [
  'Non-Reactive',
  'Reactive',
  'Borderline',
  'Negative',
  'Positive',
];

const STRIP_SEVERITY_OPTIONS = [
  'Negative',
  'Trace',
  '+ (1+)',
  '++ (2+)',
  '+++ (3+)',
  '++++ (4+)',
  'Positive',
];

/**
 * Categorizes a test into its clinical qualitative kind.
 */
export function getQualitativeTestKind(test?: any): QualitativeTestKind {
  if (!test) return 'general_qualitative';

  const code = String(test.code || test.testCode || test.id || '').toUpperCase().trim();
  const name = String(test.name || test.testName || '').toLowerCase().trim();
  const arName = String(test.arabicName || '').toLowerCase().trim();

  // 1. Blood Group & Rh (Phenotypes)
  if (
    code === 'ABO' ||
    code === 'BG' ||
    code === 'RH' ||
    code === 'WEAKD' ||
    code.includes('BLOOD_GROUP') ||
    code.includes('BLOOD GROUP') ||
    name.includes('blood group') ||
    name.includes('abo') ||
    name.includes('rhesus') ||
    name.includes('rh factor') ||
    name.includes('weak d') ||
    name.includes('du test') ||
    name.includes('cord blood group') ||
    arName.includes('فصيلة الدم') ||
    arName.includes('زمرة الدم') ||
    arName.includes('عامل ريس')
  ) {
    return 'blood_group';
  }

  // 2. Pregnancy Tests (Physiological state)
  if (
    code === 'PT' ||
    code === 'PREG' ||
    code === 'PREGNANCY' ||
    code === 'HCG-U' ||
    code === 'HCG-S' ||
    code === 'URINE-PREG' ||
    code === 'HCG_QUAL' ||
    name.includes('pregnancy test') ||
    name.includes('urine hcg') ||
    name.includes('gravindex') ||
    name.includes('upt') ||
    (name.includes('pregnancy') && !name.includes('panel')) ||
    arName.includes('فحص الحمل') ||
    arName.includes('اختبار الحمل')
  ) {
    return 'pregnancy';
  }

  // 3. Immunity / Vaccination protective antibodies
  if (
    code === 'HBSAB' ||
    code.includes('ANTI-HBS') ||
    code === 'RUBIGG' ||
    code.includes('RUB-G') ||
    code === 'TOXIGG' ||
    code.includes('TOXO-G') ||
    code === 'CMVIGG' ||
    code.includes('CMV-G') ||
    code === 'VZVIGG' ||
    code === 'MEAS-IGG' ||
    code === 'MUMP-IGG' ||
    code === 'TETANUS' ||
    name.includes('anti-hbs') ||
    name.includes('rubella igg') ||
    name.includes('toxoplasma igg') ||
    name.includes('cmv igg') ||
    name.includes('tetanus antibody') ||
    name.includes('protective antibody') ||
    arName.includes('الأضداد السطحية لالتهاب الكبد') ||
    (name.includes('igg') && (name.includes('rubella') || name.includes('toxo') || name.includes('cmv')))
  ) {
    return 'immunity';
  }

  // 4. Compatibility / Crossmatch
  if (
    code.includes('CROSSMATCH') ||
    name.includes('crossmatch') ||
    name.includes('compatibility') ||
    arName.includes('مطابقة الدم') ||
    arName.includes('توافق')
  ) {
    return 'compatibility';
  }

  return 'infectious_screen';
}

/**
 * Returns clinical visual styling (color, border, bg) for qualitative result values.
 * Prevents non-pathological results (e.g. O Positive blood, Positive pregnancy) from showing alarm red.
 */
export function getQualitativeVisualTokens(
  value: string,
  kind: QualitativeTestKind
): QualitativeVisualTokens {
  const val = String(value || '').trim();
  if (!val) {
    return {
      color: 'var(--text-main)',
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-input)',
      isAbnormal: false,
    };
  }

  const lower = val.toLowerCase();
  const isPos =
    lower.includes('pos') ||
    lower.includes('react') ||
    lower.includes('+') ||
    lower.includes('موجب') ||
    lower.includes('إيجابي') ||
    lower.includes('حامل');
  const isNeg =
    lower.includes('neg') ||
    lower.includes('non') ||
    lower.includes('-') ||
    lower.includes('سلبي') ||
    lower.includes('غير حامل');

  // Category 1: Blood Group / Phenotype
  // Normal phenotype variant: both Positive (+ve) and Negative (-ve) are completely normal!
  if (kind === 'blood_group') {
    return {
      color: 'var(--text-main)',
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-input)',
      isAbnormal: false,
    };
  }

  // Category 2: Pregnancy
  // Physiological state: Positive = Pregnant, Negative = Non-pregnant.
  // Never alarm red. Shows clear status.
  if (kind === 'pregnancy') {
    if (isPos) {
      return {
        color: '#6d28d9', // Deep violet - distinct physiological state, never red alert
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(109, 40, 217, 0.08)',
        statusLabel: 'حامل (Positive)',
        isAbnormal: false,
      };
    }
    if (isNeg) {
      return {
        color: '#0f766e',
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-input)',
        statusLabel: 'غير حامل (Negative)',
        isAbnormal: false,
      };
    }
    return {
      color: 'var(--text-main)',
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-input)',
      isAbnormal: false,
    };
  }

  // Category 3: Immunity / Vaccination Protective Antibodies (Anti-HBs, Rubella IgG)
  // Positive/Reactive = Protected/Immune (Good! Green #10b981)
  // Negative/Non-reactive = Non-immune (Amber warning #d97706, NOT green)
  if (kind === 'immunity') {
    if (isPos) {
      return {
        color: '#10b981',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        statusLabel: 'محصن (Immune)',
        isAbnormal: false,
      };
    }
    if (isNeg) {
      return {
        color: '#d97706',
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        statusLabel: 'غير محصن (Non-immune)',
        isAbnormal: false,
      };
    }
    return {
      color: 'var(--text-main)',
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-input)',
      isAbnormal: false,
    };
  }

  // Category 4: Compatibility
  if (kind === 'compatibility') {
    const isCompat = lower.includes('compat') || lower.includes('متوافق');
    if (isCompat && !lower.includes('incompat') && !lower.includes('غير')) {
      return {
        color: '#10b981',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        isAbnormal: false,
      };
    }
    return {
      color: '#ef4444',
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      isAbnormal: true,
    };
  }

  // Category 5: True Infectious / Pathological screen (HBsAg, HCV, HIV, Syphilis, Widal, Brucella, FOBT, Drugs)
  // Negative = Normal (Green/Neutral), Positive = Abnormal (Red alert)
  if (isPos) {
    return {
      color: '#ef4444',
      borderColor: '#ef4444',
      backgroundColor: 'var(--bg-input)',
      isAbnormal: true,
    };
  }
  if (isNeg) {
    return {
      color: '#10b981',
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-input)',
      isAbnormal: false,
    };
  }

  return {
    color: 'var(--text-main)',
    borderColor: 'var(--border-color)',
    backgroundColor: 'var(--bg-input)',
    isAbnormal: false,
  };
}

/**
 * Returns an array of selectable options if the test is qualitative/text-based, or null if quantitative/numeric.
 */
export function getQualitativeOptionsForTest(test?: any): string[] | null {
  if (!test) return null;

  const kind = getQualitativeTestKind(test);
  const code = String(test.code || test.testCode || test.id || '').toUpperCase().trim();
  const name = String(test.name || test.testName || '').toLowerCase().trim();
  const category = String(test.category || '').toLowerCase().trim();
  const unit = String(test.unit || '').trim();
  const refText = String(test.refRangeText || test.refDisplay || test.rangeText || test.text || '').toLowerCase().trim();

  // 1. Blood Group / ABO / Rh
  if (kind === 'blood_group') {
    const isRhAlone =
      code === 'RH' ||
      ((name.includes('rhesus') || name.includes('rh factor') || name.includes('عامل ريس')) &&
        !name.includes('blood group') &&
        !name.includes('abo') &&
        !name.includes('فصيلة') &&
        code !== 'BG');
    if (isRhAlone) {
      return RH_TYPING_OPTIONS;
    }
    return BLOOD_GROUP_OPTIONS;
  }

  // 2. Pregnancy Tests
  if (kind === 'pregnancy') {
    return PREGNANCY_OPTIONS;
  }

  // 3. Compatibility / Crossmatch
  if (kind === 'compatibility') {
    return COMPATIBILITY_OPTIONS;
  }

  // 4. Protective Immunity Antibodies
  if (kind === 'immunity') {
    return IMMUNITY_OPTIONS;
  }

  // 5. Titer / Agglutination Tests (Widal, Brucella, Rose Bengal, Wright)
  if (
    code.includes('WIDAL') ||
    code.includes('BRUCELLA') ||
    code.includes('WRIGHT') ||
    code.includes('ROSE_BENGAL') ||
    name.includes('widal') ||
    name.includes('brucella') ||
    name.includes('wright') ||
    name.includes('rose bengal')
  ) {
    return TITER_OPTIONS;
  }

  // 6. Inspect structured reference ranges for explicit valueType === 'text'
  if (Array.isArray(test.referenceRanges) && test.referenceRanges.length > 0) {
    const textRange = test.referenceRanges.find((r: any) => r.valueType === 'text' || r.type === 'text');
    if (textRange) {
      if (textRange.options && Array.isArray(textRange.options) && textRange.options.length > 0) {
        return textRange.options;
      }
      const rawText = String(textRange.text || textRange.label || '').trim();
      if (rawText.toLowerCase().includes('non-reactive') || rawText.toLowerCase().includes('non reactive')) {
        return NON_REACTIVE_OPTIONS;
      }
      if (rawText.toLowerCase().includes('negative') || rawText.toLowerCase().includes('positive') || rawText.includes('سلبي') || rawText.includes('موجب')) {
        return STANDARD_SEROLOGY_OPTIONS;
      }
      return ['Negative', 'Positive', 'Normal', 'Nil', 'Borderline'];
    }
  }

  // 7. If test has explicit numeric boundaries, it is quantitative (e.g. Glucose 70-110, Creatinine 0.7-1.2)
  const hasNumericLow = test.refRangeLow !== null && test.refRangeLow !== undefined && test.refRangeLow !== '';
  const hasNumericHigh = test.refRangeHigh !== null && test.refRangeHigh !== undefined && test.refRangeHigh !== '';
  if (hasNumericLow || hasNumericHigh) {
    // If unit is numeric or reference range is like "70 - 110", it is NOT qualitative
    return null;
  }

  // 8. Check refRangeText keywords
  if (refText) {
    if (refText.includes('non-reactive') || refText.includes('non reactive') || refText.includes('غير تفاعلي')) {
      return NON_REACTIVE_OPTIONS;
    }
    if (
      refText.includes('negative') ||
      refText.includes('positive') ||
      refText.includes('سلبي') ||
      refText.includes('موجب') ||
      refText.includes('nil') ||
      refText.includes('absent')
    ) {
      return STANDARD_SEROLOGY_OPTIONS;
    }
  }

  // 9. Match well-known rapid serology / screening / immunology tests
  const isQualitativeSerology =
    code === 'HBSAG' ||
    code === 'HCV' ||
    code === 'HIV' ||
    code === 'VDRL' ||
    code === 'TPHA' ||
    code === 'TOXO' ||
    code === 'CMV' ||
    code === 'RUBELLA' ||
    code === 'CRP' ||
    code === 'ASO' ||
    code === 'RF' ||
    code === 'LATEX' ||
    code === 'DENGUE' ||
    code === 'MALARIA' ||
    code === 'FOB' ||
    code === 'FOBT' ||
    code.includes('H.PYLORI') ||
    code.includes('HP_AG') ||
    code.includes('HP_AB') ||
    name.includes('hbsag') ||
    name.includes('hcv') ||
    name.includes('hiv') ||
    name.includes('vdrl') ||
    name.includes('tpha') ||
    name.includes('pylori') ||
    name.includes('crp (latex)') ||
    name.includes('aso (latex)') ||
    name.includes('rf (latex)') ||
    name.includes('occult blood') ||
    name.includes('troponin i rapid');

  if (isQualitativeSerology) {
    return STANDARD_SEROLOGY_OPTIONS;
  }

  // 10. Urine / Stool strip tests without numeric bounds
  if (
    category.includes('urine') ||
    category.includes('stool') ||
    category.includes('serology') ||
    category.includes('immunology') ||
    category.includes('rapid')
  ) {
    if (!unit || unit === '-' || unit.toLowerCase() === 'qualitative') {
      return STANDARD_SEROLOGY_OPTIONS;
    }
  }

  return null;
}
