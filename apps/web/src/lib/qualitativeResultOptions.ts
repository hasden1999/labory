/**
 * Clinical Intelligence Helper for Qualitative / Text-Based Test Results
 * Identifies tests requiring categorical choices (e.g. Positive / Negative, Non-Reactive / Reactive, Blood Groups, Titers)
 * and generates appropriate quick-selection options.
 */

export interface QualitativeOptionConfig {
  options: string[];
  defaultOption?: string;
  isBloodGroup?: boolean;
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
 * Returns an array of selectable options if the test is qualitative/text-based, or null if quantitative/numeric.
 */
export function getQualitativeOptionsForTest(test?: any): string[] | null {
  if (!test) return null;

  const code = String(test.code || test.testCode || test.id || '').toUpperCase().trim();
  const name = String(test.name || test.testName || '').toLowerCase().trim();
  const category = String(test.category || '').toLowerCase().trim();
  const unit = String(test.unit || '').trim();
  const refText = String(test.refRangeText || test.refDisplay || test.rangeText || test.text || '').toLowerCase().trim();

  // 1. Definite Blood Group / ABO / Rh
  if (
    code === 'ABO' ||
    code === 'BG' ||
    code === 'RH' ||
    code.includes('BLOOD_GROUP') ||
    code.includes('BLOOD GROUP') ||
    name.includes('blood group') ||
    name.includes('abo') ||
    name.includes('فصيلة الدم') ||
    name.includes('زمرة الدم')
  ) {
    if (code === 'RH' || name.includes('rhesus') || name.includes('rh factor') || name.includes('عامل ريسوس')) {
      return ['Positive (+ve)', 'Negative (-ve)'];
    }
    return BLOOD_GROUP_OPTIONS;
  }

  // 2. Titer / Agglutination Tests (Widal, Brucella, Rose Bengal, Wright)
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

  // 3. Inspect structured reference ranges for explicit valueType === 'text'
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

  // 4. If test has explicit numeric boundaries, it is quantitative (e.g. Glucose 70-110, Creatinine 0.7-1.2)
  const hasNumericLow = test.refRangeLow !== null && test.refRangeLow !== undefined && test.refRangeLow !== '';
  const hasNumericHigh = test.refRangeHigh !== null && test.refRangeHigh !== undefined && test.refRangeHigh !== '';
  if (hasNumericLow || hasNumericHigh) {
    // If unit is numeric or reference range is like "70 - 110", it is NOT qualitative
    return null;
  }

  // 5. Check refRangeText keywords
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

  // 6. Match well-known rapid serology / screening / immunology tests
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
    code === 'PT' ||
    code === 'PREG' ||
    code === 'PREGNANCY' ||
    code === 'HCG_QUAL' ||
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
    name.includes('pregnancy test') ||
    name.includes('فحص الحمل') ||
    name.includes('occult blood') ||
    name.includes('troponin i rapid');

  if (isQualitativeSerology) {
    return STANDARD_SEROLOGY_OPTIONS;
  }

  // 7. Urine / Stool strip tests without numeric bounds
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
