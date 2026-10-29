/**
 * Catalog Frequency & Clinical Ordering Utility (Pure & Deterministic)
 * FSD Layer: widgets/unified-workspace/lib/catalogOrdering.ts
 *
 * Implements:
 * 1. Primary ordering: By actual database/usage request frequency (auto-learned).
 * 2. Clinical Priority ordering: WHO Model List of Essential In Vitro Diagnostics (EDL)
 *    and Iraqi routine laboratory practice standards (e.g., FBS, Urea, HbA1c, Creatinine
 *    at the top of Biochemistry; CBC, ESR, BG at the top of Hematology, etc.).
 * 3. Robust alias resolution: (GPT/ALT, GOT/AST, CALC/CA, URIC/UA, PT-INR/PT).
 * 4. Puts essential prioritized tests at the head of each category without duplicates.
 */

export interface TestCatalogItem {
  id: string;
  name: string;
  code?: string;
  arabicName?: string;
  category?: string;
  price?: number;
  [key: string]: any;
}

/** Seeded fallback list for Most Used category when lab has no order history */
export const MOST_USED_FALLBACK_CODES = [
  'CBC',
  'FBS',
  'HBA1C',
  'UREA',
  'CREAT',
  'CA',
  'CHOL',
  'TG',
  'ALT',
  'AST',
  'TSH',
  'VITD',
];

export const RECEPTION_CATEGORIES = [
  { id: 'MOST_USED', label: 'Most used', isStar: true },
  { id: 'BIOCHEMISTRY', label: 'Biochemistry' },
  { id: 'HEMATOLOGY', label: 'Hematology' },
  { id: 'HORMONES', label: 'Hormones' },
  { id: 'VIROLOGY', label: 'Virology' },
  { id: 'IMMUNOLOGY', label: 'Immunology' },
  { id: 'MOLECULAR_PCR', label: 'Molecular (PCR)' },
  { id: 'URINE_STOOL', label: 'GUE & GSE' },
  { id: 'TUMOR_MARKERS', label: 'Tumor Markers' },
  { id: 'MICROBIOLOGY', label: 'Microbiology' },
  { id: 'TOXICOLOGY', label: 'Toxicology' },
  { id: 'BLOOD_BANK', label: 'Blood Bank' },
  { id: 'PATHOLOGY', label: 'Histopathology' },
  { id: 'WELLNESS_PANELS', label: 'Wellness Panels' },
];

/** Standard laboratory aliases mapping for test codes */
export const CODE_ALIASES: Record<string, string[]> = {
  ALT: ['ALT', 'GPT', 'SGPT'],
  GPT: ['ALT', 'GPT', 'SGPT'],
  AST: ['AST', 'GOT', 'SGOT'],
  GOT: ['AST', 'GOT', 'SGOT'],
  CA: ['CA', 'CALC'],
  CALC: ['CA', 'CALC'],
  PT: ['PT', 'PT-INR', 'INR'],
  'PT-INR': ['PT', 'PT-INR', 'INR'],
  PTT: ['PTT', 'APTT'],
  APTT: ['PTT', 'APTT'],
  UA: ['UA', 'URIC'],
  URIC: ['UA', 'URIC'],
  FBS: ['FBS', 'GLU', 'GLUCOSE', 'GLU-F'],
  RBS: ['RBS', 'GLU-R'],
  HBA1C: ['HBA1C', 'A1C', 'HBA1-C'],
  UREA: ['UREA', 'BUN'],
  CREAT: ['CREAT', 'CREATININE', 'CR'],
  CHOL: ['CHOL', 'CHO', 'T-CHOL'],
  TG: ['TG', 'TRIG'],
  TSB: ['TSB', 'BIL-T', 'TBIL'],
  'DIR-BIL': ['DIR-BIL', 'DBIL', 'BIL-D'],
  ALP: ['ALP', 'ALK-P'],
  GUE: ['GUE', 'URINE', 'URINALYSIS'],
  GSE: ['GSE', 'STOOL'],
  SFA: ['SFA', 'SEMEN'],
  VITD: ['VITD', 'VIT-D', 'D3'],
  VITB12: ['VITB12', 'B12'],
  FER: ['FER', 'FERRITIN'],
  BHCG: ['BHCG', 'B-HCG', 'HCG'],
  PSA: ['PSA', 'T-PSA'],
  'F-PSA': ['F-PSA', 'FPSA'],
  CA125: ['CA125', 'CA-125'],
  'CA15-3': ['CA15-3', 'CA153'],
  'CA19-9': ['CA19-9', 'CA199'],
  'HPYLORI-AB': ['HPYLORI-AB', 'HPYLORI'],
  'HPYLORI-STOOL': ['HPYLORI-STOOL', 'HPYLORI-AG'],
  HBSAG: ['HBSAG', 'HBS'],
  HCV: ['HCV', 'HCV-AB'],
  HIV: ['HIV', 'HIV-AB'],
  VDRL: ['VDRL', 'RPR'],
  BG: ['BG', 'BLOOD-GROUP', 'ABO'],
};

/** Normalizes category names (Arabic or English) to standard category keys */
export function normalizeCategory(categoryName?: string): string {
  if (!categoryName) return 'BIOCHEMISTRY';
  const c = categoryName.toLowerCase().trim();

  // 1. Virology & Infectious Disease
  if (
    c.includes('فايروس') ||
    c.includes('فيروس') ||
    c.includes('virology') ||
    c.includes('infectious') ||
    c.includes('معدية') ||
    c.includes('hepatitis')
  ) {
    return 'VIROLOGY';
  }

  // 2. Molecular Biology & Genetics / PCR
  if (
    c.includes('وراثة') ||
    c.includes('جزيئية') ||
    c.includes('molecular') ||
    c.includes('genetics') ||
    c.includes('pcr') ||
    c.includes('استقلابية')
  ) {
    return 'MOLECULAR_PCR';
  }

  // 3. Toxicology & Drug Monitoring
  if (
    c.includes('سموم') ||
    c.includes('toxicology') ||
    c.includes('مخدرات') ||
    c.includes('drugs') ||
    c.includes('tdm')
  ) {
    return 'TOXICOLOGY';
  }

  // 4. Blood Bank & Transfusion
  if (
    c.includes('بنك الدم') ||
    c.includes('blood bank') ||
    c.includes('transfusion') ||
    c.includes('توافق')
  ) {
    return 'BLOOD_BANK';
  }

  // 5. Histopathology & Cytology
  if (
    c.includes('أنسجة') ||
    c.includes('خلايا') ||
    c.includes('pathology') ||
    c.includes('histology') ||
    c.includes('cytology')
  ) {
    return 'PATHOLOGY';
  }

  // 6. Wellness & Health Checkup Panels
  if (
    c.includes('باقات') ||
    c.includes('فحص شامل') ||
    c.includes('wellness') ||
    c.includes('checkup') ||
    c.includes('تغذية وصحة')
  ) {
    return 'WELLNESS_PANELS';
  }

  // 7. Microbiology & Cultures
  if (
    c.includes('أحياء مجهرية') ||
    c.includes('مزارع') ||
    c.includes('microbiology') ||
    c.includes('culture')
  ) {
    return 'MICROBIOLOGY';
  }

  // 8. Tumor Markers
  if (
    c.includes('أورام') ||
    c.includes('tumor') ||
    c.includes('marker')
  ) {
    return 'TUMOR_MARKERS';
  }

  // 9. Hematology & Coagulation
  if (
    c.includes('أمراض الدم') ||
    c.includes('دم') ||
    c.includes('hematology') ||
    c.includes('تخثر') ||
    c.includes('coagulation') ||
    c.includes('نزف')
  ) {
    return 'HEMATOLOGY';
  }

  // 10. Hormones & Thyroid & Endocrinology
  if (
    c.includes('هرمون') ||
    c.includes('hormone') ||
    c.includes('غدة') ||
    c.includes('غدد') ||
    c.includes('endocrin')
  ) {
    return 'HORMONES';
  }

  // 11. Immunology & Serology & Autoimmune
  if (
    c.includes('مناعة') ||
    c.includes('immunology') ||
    c.includes('أمصال') ||
    c.includes('serology') ||
    c.includes('روماتيزم')
  ) {
    return 'IMMUNOLOGY';
  }

  // 12. Urine & Stool & Microscopy & Semen
  if (
    c.includes('إدرار') ||
    c.includes('خروج') ||
    c.includes('urine') ||
    c.includes('stool') ||
    c.includes('مجهري') ||
    c.includes('بول') ||
    c.includes('براز') ||
    c.includes('طفيليات') ||
    c.includes('parasit') ||
    c.includes('سائل منوي') ||
    c.includes('semen') ||
    c.includes('سوائل الجسم')
  ) {
    return 'URINE_STOOL';
  }

  // 13. Biochemistry & Lipids & Liver & Kidneys & Diabetes & Electrolytes & Cardiac
  return 'BIOCHEMISTRY';
}

/** Matches a test against a priority code using code, aliases, ID, and canonical names */
export function matchTestToPriorityCode(t: TestCatalogItem, priorityCode: string): boolean {
  if (!t) return false;
  const p = priorityCode.toUpperCase().trim();
  const code = (t.code || '').toUpperCase().trim();
  const id = (t.id || '').toLowerCase().trim();
  const name = (t.name || '').toLowerCase();

  // 1. Exact code match
  if (code === p) return true;

  // 2. Alias match
  const aliases = CODE_ALIASES[p] || [];
  if (aliases.includes(code)) return true;

  // 3. ID match: 't-' + code or 't-' + alias
  if (id === `t-${p.toLowerCase()}` || id === p.toLowerCase()) return true;
  if (aliases.some((a) => id === `t-${a.toLowerCase()}` || id === a.toLowerCase())) return true;

  // 4. Targeted specific name checks for standard tests
  if (p === 'CREAT' && name.includes('creatinine')) return true;
  if (p === 'CHOL' && (name.includes('cholesterol') || name.includes('lipid profile'))) return true;
  if (p === 'TG' && name.includes('triglycerides')) return true;
  if (p === 'ALT' && (name.includes('sgpt') || name.includes('alanine aminotransferase') || name.includes('alt'))) return true;
  if (p === 'AST' && (name.includes('sgot') || name.includes('aspartate aminotransferase') || name.includes('ast'))) return true;
  if (p === 'VITD' && (name.includes('vitamin d') || name.includes('25-oh'))) return true;
  if (p === 'FBS' && (name.includes('fasting blood sugar') || name.includes('fasting glucose'))) return true;
  if (p === 'RBS' && (name.includes('random blood sugar') || name.includes('random glucose'))) return true;
  if (p === 'HBA1C' && (name.includes('glycated hemoglobin') || name.includes('hba1c'))) return true;
  if (p === 'UREA' && (name.includes('blood urea') || name.includes('urea'))) return true;
  if (p === 'URIC' && name.includes('uric acid')) return true;
  if (p === 'CBC' && (name.includes('complete blood count') || name.includes('cbc'))) return true;
  if (p === 'GUE' && (name.includes('general urine') || name.includes('gue'))) return true;
  if (p === 'GSE' && (name.includes('general stool') || name.includes('gse'))) return true;

  return false;
}

/** Fallback Clinical Priority Tests list per category (WHO EDL & Iraqi routine laboratory practice) */
export const CLINICAL_FALLBACK_TOP_CODES: Record<string, string[]> = {
  BIOCHEMISTRY: [
    'FBS',
    'UREA',
    'HBA1C',
    'CREAT',
    'RBS',
    'URIC',
    'CHOL',
    'TG',
    'HDL',
    'LDL',
    'GPT',
    'ALT',
    'GOT',
    'AST',
    'TSB',
    'DIR-BIL',
    'ALP',
    'CALC',
    'CA',
    'NA',
    'K',
    'CL',
    'TP',
    'ALB',
    'AMYLASE',
    'LIPASE',
    'CK',
    'CKMB',
    'LDH',
    'PHOS',
    'MG',
  ],
  CHEMISTRY: [
    'FBS',
    'UREA',
    'HBA1C',
    'CREAT',
    'RBS',
    'URIC',
    'CHOL',
    'TG',
    'HDL',
    'LDL',
    'GPT',
    'ALT',
    'GOT',
    'AST',
    'TSB',
    'DIR-BIL',
    'ALP',
    'CALC',
    'CA',
    'NA',
    'K',
    'CL',
    'TP',
    'ALB',
    'AMYLASE',
    'LIPASE',
    'CK',
    'CKMB',
    'LDH',
    'PHOS',
    'MG',
  ],
  HEMATOLOGY: [
    'CBC',
    'ESR',
    'BG',
    'PT-INR',
    'PT',
    'PTT',
    'APTT',
    'BT',
    'CT',
    'HB',
    'PCV',
    'PLT',
    'FER',
    'FERRITIN',
    'IRON',
    'TIBC',
    'RETIC',
    'B-FILM',
    'BLOOD-FILM',
    'G6PD',
    'HB-ELEC',
    'COOMBS-D',
    'COOMBS-IND',
    'SICKLING',
  ],
  HORMONES: [
    'TSH',
    'FT4',
    'FT3',
    'T4',
    'T3',
    'PRL',
    'TESTO',
    'F-TESTO',
    'LH',
    'FSH',
    'E2',
    'PROG',
    'BHCG',
    'B-HCG',
    'AMH',
    'CORTISOL',
    'DHEA-S',
    '17-OHP',
    'PTH',
    'ACTH',
    'GH',
    'INSULIN',
  ],
  IMMUNOLOGY: [
    'CRP',
    'RF',
    'ASO',
    'WIDAL',
    'ROSE',
    'HPYLORI-AB',
    'HPYLORI',
    'HBSAG',
    'HCV',
    'HIV',
    'VDRL',
    'RPR',
    'ANA',
    'ANTI-CCP',
    'DS-DNA',
    'TOXO-IGG',
    'TOXO-IGM',
    'RUBELLA-IGG',
    'RUBELLA-IGM',
  ],
  URINE_STOOL: [
    'GUE',
    'GSE',
    'SFA',
    'SEMEN',
    'FOBT',
    'HPYLORI-STOOL',
    'HPYLORI-AG',
    'PREG-TEST',
    'MALB',
    'ROTA-ADENO',
    'AFB-SMEAR',
  ],
  TUMOR_MARKERS: [
    'PSA',
    'FPSA',
    'F-PSA',
    'CEA',
    'CA125',
    'CA15-3',
    'CA19-9',
    'AFP',
    'B2M',
    'HE4',
    'ROMA',
    'NSE',
    'CYFRA',
    'CA72-4',
  ],
  VIROLOGY: [
    'HBSAG',
    'HCVAB',
    'HCV',
    'HIV',
    'VDRL',
    'TPHA',
    'TORCH',
    'COVID-PCR',
    'HBV-DNA',
    'HCV-RNA',
    'WIDAL',
    'BRUC-ROSE',
    'TOXIGG',
    'TOXIGM',
    'RUBIGG',
    'RUBIGM',
    'CMVIGG',
    'CMVIGM',
  ],
  MOLECULAR_PCR: [
    'HBV-DNA',
    'HCV-RNA',
    'HPV-DNA',
    'TB-PCR',
    'KARYO',
    'NIPT',
    'FMF',
    'WES',
    'FISH',
    'JAK2',
    'BCRABL',
  ],
  BLOOD_BANK: [
    'ABO',
    'RH',
    'WEAKD',
    'XM-MAJ',
    'XM-MIN',
    'AB-SCR',
    'COOMBS-D',
    'COOMBS-I',
  ],
  TOXICOLOGY: [
    'UDS',
    'HEAVY-PANEL',
    'DIGOX',
    'LITH',
    'VPA',
    'CBZ',
    'VANCO',
    'TACRO',
  ],
  PATHOLOGY: [
    'PAP',
    'FNA',
    'HISTO-PATH',
    'FROZEN',
    'IHC',
    'BIOPSY',
  ],
  WELLNESS_PANELS: [
    'CHECKUP-B',
    'CHECKUP-C',
    'CHECKUP-PREOP',
    'CHECKUP-PCOS',
    'CHECKUP-W',
    'CHECKUP-M',
    'CHECKUP-FERT-F',
    'CHECKUP-HAIR',
  ],
  MICROBIOLOGY: [
    'UCULT',
    'SCULT',
    'SPUT-CULT',
    'WOUND',
    'HVS',
    'BCULT',
    'KOH',
    'GRAM',
  ],
  VITAMINS_MARKERS: [
    'VITD',
    'VITB12',
    'FER',
    'FERRITIN',
    'FOLIC',
    'PSA',
    'F-PSA',
    'CEA',
    'CA125',
    'CA15-3',
    'CA19-9',
    'AFP',
    'B2M',
    'CA242',
    'CA72-4',
  ],
};

/**
 * Returns tests for the 'Most used' category, sorted by actual lab order frequency,
 * with fallback to the standard clinical essential tests list.
 */
export function getMostUsedTests(
  tests: TestCatalogItem[],
  frequencyMap: Record<string, number> = {},
  limit: number = 24
): TestCatalogItem[] {
  if (!tests || tests.length === 0) return [];

  const hasHistory = Object.values(frequencyMap).some((count) => count > 0);

  if (hasHistory) {
    // 1. Rank tests by frequency
    const scored = tests
      .map((t) => {
        const idCount = frequencyMap[String(t.id)] || 0;
        const codeCount = t.code ? (frequencyMap[String(t.code).toUpperCase().trim()] || 0) : 0;
        return { test: t, count: Math.max(idCount, codeCount) };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((item) => item.test);

    // 2. Backfill with fallback essential codes if needed
    const existingIds = new Set(scored.map((t) => String(t.id)));
    for (const code of MOST_USED_FALLBACK_CODES) {
      if (scored.length >= limit && existingIds.size >= limit) break;
      const match = tests.find(
        (t) => !existingIds.has(String(t.id)) && matchTestToPriorityCode(t, code)
      );
      if (match) {
        scored.push(match);
        existingIds.add(String(match.id));
      }
    }
    return scored;
  }

  // Pure fallback: matching by code or name in fallback order
  const result: TestCatalogItem[] = [];
  const seenIds = new Set<string>();

  for (const code of MOST_USED_FALLBACK_CODES) {
    const match = tests.find(
      (t) => !seenIds.has(String(t.id)) && matchTestToPriorityCode(t, code)
    );
    if (match) {
      result.push(match);
      seenIds.add(String(match.id));
    }
  }

  return result;
}

/**
 * Re-orders a catalog array placing the most important tests first.
 * @param tests The catalog tests array
 * @param frequencyMap Optional map of testId/code -> count (from local offline stats & samples)
 * @param topLimit Maximum number of top tests prioritized at the head (default 30)
 * @param selectedCategory Optional category identifier to narrow prioritization
 */
export function orderCatalogByImportance(
  tests: TestCatalogItem[],
  frequencyMap: Record<string, number> = {},
  topLimit: number = 30,
  selectedCategory?: string
): TestCatalogItem[] {
  if (!tests || tests.length === 0) return [];

  const targetCategory = selectedCategory ? normalizeCategory(selectedCategory) : null;

  // Scoring function for a test
  const getTestScore = (t: TestCatalogItem): number => {
    let score = 0;

    // A. Real frequency (from samples / local usage)
    const idCount = frequencyMap[String(t.id)] || 0;
    const codeCount = t.code ? (frequencyMap[String(t.code).toUpperCase().trim()] || 0) : 0;
    const freq = Math.max(idCount, codeCount);
    if (freq > 0) {
      score += 100000 + freq * 100;
    }

    // B. Clinical essential priority in its category
    const cat = targetCategory || normalizeCategory(t.category);
    const priorityList = CLINICAL_FALLBACK_TOP_CODES[cat] || CLINICAL_FALLBACK_TOP_CODES.BIOCHEMISTRY;

    for (let idx = 0; idx < priorityList.length; idx++) {
      if (matchTestToPriorityCode(t, priorityList[idx])) {
        // Earlier in priority list = higher score
        score += 50000 - idx * 100;
        break;
      }
    }

    return score;
  };

  const scored = tests.map((t) => ({ test: t, score: getTestScore(t) }));

  // Tests with positive scores (frequent or clinical essentials) sorted descending by score
  const prioritized = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topLimit)
    .map((s) => s.test);

  const seenIds = new Set(prioritized.map((t) => String(t.id)));

  // Remainder preserves current stable catalog order
  const remainder = tests.filter((t) => !seenIds.has(String(t.id)));

  return [...prioritized, ...remainder];
}
