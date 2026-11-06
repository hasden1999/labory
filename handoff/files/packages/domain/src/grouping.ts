/**
 * Pure Clinical Test Grouping Functions
 * Supports:
 * - 'category': Standard lab workstation/category grouping (Hematology, Clinical Chemistry, etc.)
 * - 'specialty': Hierarchical specialty-driven grouping (Specialty -> Group? -> Test)
 */

export type GroupingStyle = 'category' | 'specialty';

export interface GroupableTest {
  id: string;
  name?: string;
  code?: string;
  category?: string | null;
  specialtyId?: string | null;
  groupId?: string | null;
  sortOrder?: number | null;
  test?: {
    id?: string;
    name?: string;
    code?: string;
    category?: string | null;
    specialtyId?: string | null;
    groupId?: string | null;
    sortOrder?: number | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export interface SpecialtyContext {
  id: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder?: number;
}

export interface TestGroupContext {
  id: string;
  specialtyId: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder?: number;
}

export interface SubGroupBucket<T> {
  id: string;
  specialtyId: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
  tests: T[];
}

export interface GroupBucket<T> {
  id: string | null;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
  isOther?: boolean;
  groups: SubGroupBucket<T>[];
  directTests: T[];
  allTests: T[];
}

export interface GroupedTestsResult<T> {
  style: GroupingStyle;
  sections: GroupBucket<T>[];
}

export const CANONICAL_SPECIALTIES: SpecialtyContext[] = [
  { id: 'spec-chemistry', nameEn: 'Clinical Chemistry', nameAr: 'الكيمياء السريرية', sortOrder: 1 },
  { id: 'spec-hematology', nameEn: 'Hematology & Coagulation', nameAr: 'أمراض الدم والتخثر (الهيماتولوجي)', sortOrder: 2 },
  { id: 'spec-hormones', nameEn: 'Hormones & Endocrinology', nameAr: 'الهرمونات والغدد الصماء', sortOrder: 3 },
  { id: 'spec-virology', nameEn: 'Virology & Infectious Diseases', nameAr: 'الفيروسات والأمراض المعدية', sortOrder: 4 },
  { id: 'spec-immunology', nameEn: 'Immunology & Serology', nameAr: 'المناعة والأمصال والروماتيزم', sortOrder: 5 },
  { id: 'spec-molecular', nameEn: 'Molecular Biology & Genetics', nameAr: 'الوراثة والبيولوجيا الجزيئية', sortOrder: 6 },
  { id: 'spec-microbiology', nameEn: 'Microbiology & Clinical Microscopy', nameAr: 'الأحياء المجهرية والفحص العام', sortOrder: 7 },
  { id: 'spec-tumor', nameEn: 'Tumor Markers', nameAr: 'دلالات الأورام', sortOrder: 8 },
  { id: 'spec-toxicology', nameEn: 'Toxicology & TDM', nameAr: 'السموم ومراقبة الأدوية', sortOrder: 9 },
  { id: 'spec-bloodbank', nameEn: 'Blood Bank & Transfusion', nameAr: 'بنك الدم ومطابقة الفصائل', sortOrder: 10 },
  { id: 'spec-pathology', nameEn: 'Histopathology & Cytology', nameAr: 'الأنسجة والخلايا المرضية', sortOrder: 11 },
  { id: 'spec-wellness', nameEn: 'Health & Wellness Panels', nameAr: 'باقات الفحص الشامل والصحي', sortOrder: 12 },
];

export const CANONICAL_TEST_GROUPS: TestGroupContext[] = [
  // Chemistry Subgroups
  { id: 'grp-diabetes', specialtyId: 'spec-chemistry', nameEn: 'Diabetes & Glucose Profile', nameAr: 'تحاليل السكري وسكر الدم', sortOrder: 1 },
  { id: 'grp-liver', specialtyId: 'spec-chemistry', nameEn: 'Liver Function Profile (LFT)', nameAr: 'وظائف الكبد والمرارة', sortOrder: 2 },
  { id: 'grp-renal', specialtyId: 'spec-chemistry', nameEn: 'Renal Function & Electrolytes (RFT)', nameAr: 'وظائف الكلى والأملاح', sortOrder: 3 },
  { id: 'grp-lipid', specialtyId: 'spec-chemistry', nameEn: 'Lipid Profile & Cardiac Markers', nameAr: 'دهون الدم وإنزيمات القلب', sortOrder: 4 },
  { id: 'grp-vitamins', specialtyId: 'spec-chemistry', nameEn: 'Vitamins & Trace Elements', nameAr: 'المعادن والفيتامينات', sortOrder: 5 },
  { id: 'grp-biochem', specialtyId: 'spec-chemistry', nameEn: 'General Biochemistry & Enzymes', nameAr: 'الكيمياء العامة والإنزيمات', sortOrder: 6 },

  // Hematology Subgroups
  { id: 'grp-cbc', specialtyId: 'spec-hematology', nameEn: 'Complete Blood Count & Indices', nameAr: 'صورة الدم الكاملة ومؤشراتها', sortOrder: 1 },
  { id: 'grp-coag', specialtyId: 'spec-hematology', nameEn: 'Coagulation & Hemostasis Profile', nameAr: 'فحوصات التخثر والسيولة', sortOrder: 2 },
  { id: 'grp-esr', specialtyId: 'spec-hematology', nameEn: 'ESR & Immunohematology', nameAr: 'ترسب الدم وفصائل الدم', sortOrder: 3 },

  // Hormones Subgroups
  { id: 'grp-thyroid', specialtyId: 'spec-hormones', nameEn: 'Thyroid Function Profile', nameAr: 'هرمونات الغدة الدرقية', sortOrder: 1 },
  { id: 'grp-fertility', specialtyId: 'spec-hormones', nameEn: 'Fertility & Reproductive Hormones', nameAr: 'هرمونات الخصوبة والتناسل', sortOrder: 2 },
  { id: 'grp-adrenal', specialtyId: 'spec-hormones', nameEn: 'Adrenal & Other Endocrine', nameAr: 'هرمونات الغدد الأخرى', sortOrder: 3 },

  // Immunology Subgroups
  { id: 'grp-rheuma', specialtyId: 'spec-immunology', nameEn: 'Inflammatory & Rheumatic Markers', nameAr: 'دلالات الالتهاب والروماتيزم', sortOrder: 1 },
  { id: 'grp-infectious', specialtyId: 'spec-immunology', nameEn: 'General Autoimmune & Serology', nameAr: 'المناعة الذاتية العامة', sortOrder: 2 },

  // Virology Subgroups
  { id: 'grp-virology-serology', specialtyId: 'spec-virology', nameEn: 'Viral Serology & Rapid Screens', nameAr: 'الأمصال الفيروسية والمسحات السريعة', sortOrder: 1 },
  { id: 'grp-virology-pcr', specialtyId: 'spec-virology', nameEn: 'Viral Load & Molecular Virology', nameAr: 'الحمل الفيروسي وPCR الفيروسي', sortOrder: 2 },

  // Molecular & Genetics
  { id: 'grp-molecular-genetics', specialtyId: 'spec-molecular', nameEn: 'Genetic & Molecular Testing', nameAr: 'الفحوصات الجينية والجزيئية', sortOrder: 1 },

  // Blood Bank
  { id: 'grp-bloodbank-all', specialtyId: 'spec-bloodbank', nameEn: 'Blood Banking & Transfusion', nameAr: 'فصائل الدم واختبارات التوافق', sortOrder: 1 },

  // Toxicology
  { id: 'grp-toxicology-all', specialtyId: 'spec-toxicology', nameEn: 'Therapeutic Drugs & Toxicology', nameAr: 'مراقبة الأدوية والسموم', sortOrder: 1 },

  // Pathology & Cytology
  { id: 'grp-pathology-all', specialtyId: 'spec-pathology', nameEn: 'Histopathology & Cytopathology', nameAr: 'الأنسجة والخلايا المرضية', sortOrder: 1 },

  // Wellness & Checkups
  { id: 'grp-wellness-all', specialtyId: 'spec-wellness', nameEn: 'Comprehensive Health Panels', nameAr: 'باقات الفحص الشامل والصحي', sortOrder: 1 },

  // Microbiology Subgroups
  { id: 'grp-micro-general', specialtyId: 'spec-microbiology', nameEn: 'Routine Clinical Microscopy', nameAr: 'الفحص المجهري العام والإدرار', sortOrder: 1 },
  { id: 'grp-culture', specialtyId: 'spec-microbiology', nameEn: 'Cultures & Sensitivity', nameAr: 'المزارع والحساسية الجرثومية', sortOrder: 2 },

  // Tumor Markers
  { id: 'grp-tumor-all', specialtyId: 'spec-tumor', nameEn: 'Tumor Markers Profile', nameAr: 'دلالات الأورام التخصصية', sortOrder: 1 },
];

function matchCode(code: string, pattern: string): boolean {
  if (!code || !pattern) return false;
  if (code === pattern) return true;
  if (code.startsWith(`${pattern}-`) || code.startsWith(`${pattern}_`) || code.startsWith(`${pattern}.`)) return true;
  return false;
}

export const CANONICAL_SPECIALTY_KEYWORDS: Record<string, string[]> = {
  'spec-chemistry': ['chemistry', 'biochemistry', 'كيمياء', 'حيوية'],
  'spec-hematology': ['hematology', 'coagulation', 'دم', 'تخثر', 'هيماتولوجي'],
  'spec-hormones': ['hormone', 'endocrin', 'هرمون', 'غدد'],
  'spec-virology': ['virology', 'virus', 'فايروس', 'فيروس', 'التهاب الكبد', 'hepatitis', 'عدوى'],
  'spec-immunology': ['immunology', 'serology', 'مناعة', 'أمصال', 'روماتيزم'],
  'spec-molecular': ['molecular', 'genetics', 'pcr', 'dna', 'rna', 'وراثة', 'جزيئية', 'جينات'],
  'spec-microbiology': ['microbiology', 'microscopy', 'أحياء مجهرية', 'مجهري'],
  'spec-tumor': ['tumor', 'أورام'],
  'spec-toxicology': ['toxicology', 'tdm', 'drugs', 'سموم', 'مخدرات', 'أدوية'],
  'spec-bloodbank': ['blood bank', 'transfusion', 'بنك الدم', 'توافق', 'فصائل'],
  'spec-pathology': ['pathology', 'histology', 'cytology', 'أنسجة', 'خلايا', 'خزعة'],
  'spec-wellness': ['wellness', 'checkup', 'package', 'panel', 'فحص شامل', 'باقة', 'باقات'],
};

export const CANONICAL_GROUP_KEYWORDS: Record<string, { specialtyKey: string; keywords: string[] }> = {
  'grp-diabetes': {
    specialtyKey: 'spec-chemistry',
    keywords: ['diabetes', 'glucose', 'sugar', 'سكري', 'سكر'],
  },
  'grp-liver': {
    specialtyKey: 'spec-chemistry',
    keywords: ['liver', 'lft', 'كبد', 'مرارة'],
  },
  'grp-renal': {
    specialtyKey: 'spec-chemistry',
    keywords: ['renal', 'rft', 'kidney', 'electrolyte', 'كلى', 'أملاح', 'كلوية'],
  },
  'grp-lipid': {
    specialtyKey: 'spec-chemistry',
    keywords: ['lipid', 'cardiac', 'دهون', 'قلب'],
  },
  'grp-vitamins': {
    specialtyKey: 'spec-chemistry',
    keywords: ['vitamin', 'trace', 'فيتامين', 'معادن'],
  },
  'grp-biochem': {
    specialtyKey: 'spec-chemistry',
    keywords: ['biochem', 'general', 'كيمياء', 'إنزيم'],
  },
  'grp-cbc': {
    specialtyKey: 'spec-hematology',
    keywords: ['cbc', 'blood count', 'صورة الدم', 'تعداد الدم'],
  },
  'grp-coag': {
    specialtyKey: 'spec-hematology',
    keywords: ['coag', 'hemostasis', 'تخثر', 'سيولة'],
  },
  'grp-esr': {
    specialtyKey: 'spec-hematology',
    keywords: ['esr', 'immunohematology', 'ترسب', 'فصائل'],
  },
  'grp-thyroid': {
    specialtyKey: 'spec-hormones',
    keywords: ['thyroid', 'درقية'],
  },
  'grp-fertility': {
    specialtyKey: 'spec-hormones',
    keywords: ['fertility', 'reproductive', 'خصوبة', 'تناسل'],
  },
  'grp-adrenal': {
    specialtyKey: 'spec-hormones',
    keywords: ['adrenal', 'غدد'],
  },
  'grp-rheuma': {
    specialtyKey: 'spec-immunology',
    keywords: ['rheuma', 'inflammatory', 'روماتيزم', 'التهاب'],
  },
  'grp-infectious': {
    specialtyKey: 'spec-immunology',
    keywords: ['infectious', 'serology', 'معدية', 'فيروس'],
  },
  'grp-micro-general': {
    specialtyKey: 'spec-microbiology',
    keywords: ['microscopy', 'routine', 'مجهري', 'إدرار', 'خروج', 'براز'],
  },
  'grp-culture': {
    specialtyKey: 'spec-microbiology',
    keywords: ['culture', 'sensitivity', 'مزرعة', 'مزارع'],
  },
  'grp-tumor-all': {
    specialtyKey: 'spec-tumor',
    keywords: ['tumor', 'أورام'],
  },
};

export function classifyTestCanonical(test: GroupableTest): { specialtyId: string; groupId: string } {
  const code = String(test.code || test.test?.code || '').toUpperCase().trim();
  const name = `${test.name || ''} ${test.test?.name || ''} ${(test as any).arabicName || ''} ${test.test?.arabicName || ''}`.toLowerCase();
  const cat = String(test.category || test.test?.category || '').toLowerCase();

  // 1. Tumor Markers (checked before Renal to avoid CA125 / CA19-9 matching Calcium 'CA')
  if (
    [
      'PSA', 'FPSA', 'FREE-PSA', 'CEA', 'CA125', 'CA-125', 'CA15-3', 'CA153',
      'CA19-9', 'CA199', 'CA242', 'CA72-4', 'AFP', 'CGA', 'B2M', 'CYFRA-21',
      'CYFRA', 'HE4', 'ROMA'
    ].some(c => matchCode(code, c)) ||
    name.includes('أورام') || name.includes('tumor') || cat.includes('أورام')
  ) {
    return { specialtyId: 'spec-tumor', groupId: 'grp-tumor-all' };
  }

  // 2. Infectious Disease Serology & Virology
  if (
    [
      'HBSAG', 'HBS', 'HCV', 'HCV-AB', 'HCVAB', 'HIV', 'HIV-AB', 'WIDAL', 'ROSE',
      'ROSE-BENGAL', 'BRUCELLA', 'BRUC-STA', 'TYPHOID', 'HPYLORI', 'H-PYLORI',
      'HPYLORI-AB', 'TOXO', 'RUBELLA', 'CMV', 'VDRL', 'TPHA', 'RPR',
      'CHLAM-IGG', 'CHLAM-IGM', 'DENGUE', 'EBV'
    ].some(c => matchCode(code, c)) ||
    name.includes('hepatitis') || name.includes('التهاب الكبد') || name.includes('widal') ||
    name.includes('rose bengal') || name.includes('brucella') || name.includes('typhoid') ||
    name.includes('syphilis') || name.includes('h. pylori') || name.includes('hpylori')
  ) {
    return { specialtyId: 'spec-immunology', groupId: 'grp-infectious' };
  }

  // 3. Diabetes Profile (comprehensive clinical glucose / insulin profile)
  if (
    [
      'FBS', 'RBS', 'PPBS', 'HBA1C', 'GLU', 'GLUCOSE', 'OGTT', 'GCT',
      'INSULIN', 'C-PEP', 'CPEPTIDE', 'HOMAIR', 'HOMA-IR', 'OGTT-CURVE',
      'FRUCT', 'FRUCTOSAMINE', 'GAD65-AB', 'IA2-AB', 'INSULIN-AB',
      'ADIPONECT', 'ISLET-AB'
    ].some(c => matchCode(code, c)) ||
    name.includes('hba1c') || name.includes('تراكمي') || name.includes('سكري') ||
    name.includes('glucose') || name.includes('insulin') || name.includes('c-peptide') ||
    name.includes('cpeptide') || name.includes('homa') || name.includes('sugar') ||
    name.includes('صائم') || name.includes('عشوائي') || name.includes('تحمل السكر')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-diabetes' };
  }

  // 4. Liver Function & Enzymes
  if (
    [
      'GPT', 'ALT', 'GOT', 'AST', 'ALP', 'GGT', 'TSB', 'TBIL', 'DBIL', 'IBIL',
      'DIR-BIL', 'INDIR-BIL', 'ALB', 'TP', 'TOTAL-PROTEIN', 'LDH', 'AMMONIA',
      'CHE-PSEUDO', 'AG-RATIO', 'FIB-4'
    ].some(c => matchCode(code, c)) ||
    name.includes('liver') || name.includes('كبد') || name.includes('bilirubin') ||
    name.includes('transaminase') || name.includes('albumin') || name.includes('مرارة')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-liver' };
  }

  // 5. Renal Function & Electrolytes
  if (
    [
      'UREA', 'CREAT', 'CREA', 'CREATININE', 'URIC', 'UA', 'BUN', 'NA', 'K',
      'CL', 'CA', 'CA-ION', 'PHOS', 'MG', 'EGFR', 'CR-CLEAR', 'UPCR', 'MALB',
      'U-PROT-24H', 'U-PHOS-24H', 'OSM', 'OSM-URINE'
    ].some(c => matchCode(code, c)) ||
    name.includes('renal') || name.includes('كلى') || name.includes('kidney') ||
    name.includes('creatinine') || name.includes('urea') || name.includes('uric') ||
    name.includes('أملاح') || name.includes('يوريا')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-renal' };
  }

  // 6. Lipid Profile & Cardiac Markers
  if (
    [
      'CHOL', 'TG', 'HDL', 'LDL', 'VLDL', 'NON-HDL', 'TC/HDL', 'LDL/HDL',
      'APO-A1', 'APO-B', 'APO-RATIO', 'LPA', 'TROP', 'TROPONIN', 'CKMB',
      'CK-MB', 'CK', 'MYO', 'HCY', 'HS-CRP', 'NT-PROBNP', 'D-DIMER', 'DDIMER'
    ].some(c => matchCode(code, c)) ||
    name.includes('lipid') || name.includes('دهون') || name.includes('cholesterol') ||
    name.includes('troponin') || name.includes('قلب') || name.includes('triglyceride')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-lipid' };
  }

  // 7. Vitamins & Minerals
  if (
    [
      'VIT-D', 'VITD', 'VIT-B12', 'VITB12', 'B12', 'FOLATE', 'RBC-FOLATE',
      'IRON', 'FERRITIN', 'TIBC', 'ZINC', 'COPPER', 'CERULOPLAS', 'LEAD-BLOOD',
      'VIT-A', 'VIT-B1', 'CALC'
    ].some(c => matchCode(code, c)) ||
    name.includes('vitamin') || name.includes('فيتامين') || name.includes('iron') ||
    name.includes('حديد') || name.includes('ferritin')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-vitamins' };
  }

  // 8. Coagulation & Hemostasis
  if (
    [
      'PT', 'INR', 'PTT', 'APTT', 'FIB', 'FIBRINOGEN', 'BT', 'CT', 'FACT-VIII',
      'FACT-IX', 'AT-III', 'ANTI-XA', 'APCR'
    ].some(c => matchCode(code, c)) ||
    name.includes('coagulation') || name.includes('تخثر') || name.includes('prothrombin') ||
    name.includes('سيولة')
  ) {
    return { specialtyId: 'spec-hematology', groupId: 'grp-coag' };
  }

  // 9. ESR & Immunohematology
  if (
    [
      'ESR', 'ABO', 'BG', 'RH', 'COOMBS', 'DAT', 'IAT', 'COOMBS-D', 'COOMBS-I',
      'DAT-COOMBS'
    ].some(c => matchCode(code, c)) ||
    name.includes('esr') || name.includes('ترسب') || name.includes('فصيلة') ||
    name.includes('coombs')
  ) {
    return { specialtyId: 'spec-hematology', groupId: 'grp-esr' };
  }

  // 10. Complete Blood Count (CBC)
  if (
    [
      'CBC', 'HB', 'HGB', 'PCV', 'HCT', 'WBC', 'PLT', 'PLATELET', 'RBC',
      'MCV', 'MCH', 'MCHC', 'RDW', 'RETIC', 'DIFF', 'G6PD', 'HB-ELECTRO',
      'BLOOD-FILM'
    ].some(c => matchCode(code, c)) ||
    name.includes('cbc') || name.includes('هيموغلوبين') || name.includes('صورة الدم') ||
    name.includes('دم') || cat.includes('hematology')
  ) {
    return { specialtyId: 'spec-hematology', groupId: 'grp-cbc' };
  }

  // 11. Thyroid Hormones
  if (
    ['TSH', 'T3', 'T4', 'FT3', 'FT4', 'ANTI-TPO', 'ANTI-TG', 'THYRO'].some(c => matchCode(code, c)) ||
    name.includes('thyroid') || name.includes('درقية') || name.includes('tsh')
  ) {
    return { specialtyId: 'spec-hormones', groupId: 'grp-thyroid' };
  }

  // 12. Fertility & Reproductive Hormones
  if (
    [
      'FSH', 'LH', 'PRL', 'PROLACTIN', 'TESTO', 'TESTOSTERONE', 'E2',
      'ESTRADIOL', 'PROGESTERONE', 'AMH', 'BHCG', 'B-HCG', 'HCG', 'FREE-BHCG',
      'ANDROST', 'DHT'
    ].some(c => matchCode(code, c)) ||
    name.includes('fertility') || name.includes('خصوبة') || name.includes('حمل') ||
    name.includes('prolactin') || name.includes('testosterone')
  ) {
    return { specialtyId: 'spec-hormones', groupId: 'grp-fertility' };
  }

  // 13. Adrenal & Other Endocrine Hormones
  if (
    [
      'CORTISOL', 'ACTH', 'PTH', 'GH', 'DHEA', 'DHEA-S', '17-OHP', 'RENIN-DIR',
      'ARR', 'U-CORT-24'
    ].some(c => matchCode(code, c)) ||
    cat.includes('hormone') || cat.includes('هرمون')
  ) {
    return { specialtyId: 'spec-hormones', groupId: 'grp-adrenal' };
  }

  // 14. Rheumatic & Inflammatory Markers
  if (
    [
      'CRP', 'ASO', 'RF', 'ANTI-CCP', 'CCP', 'ANA', 'ANA-PROFILE', 'C3', 'C4',
      'DSDNA', 'ACL-IGG', 'ACL-IGM', 'B2GP1-G', 'B2GP1-M'
    ].some(c => matchCode(code, c)) ||
    name.includes('crp') || name.includes('روماتيزم') || name.includes('rheuma')
  ) {
    return { specialtyId: 'spec-immunology', groupId: 'grp-rheuma' };
  }

  // 15. Microbiology & Microscopy
  if (
    ['GUE', 'GSE', 'SFA', 'URINE', 'STOOL', 'SEMEN', 'FOBT', 'CALPRO-STOOL', 'BENCE-JONES'].some(c => matchCode(code, c)) ||
    cat.includes('مجهري') || cat.includes('microscop')
  ) {
    return { specialtyId: 'spec-microbiology', groupId: 'grp-micro-general' };
  }
  if (code.includes('CULT') || name.includes('مزرعة') || name.includes('culture') || cat.includes('microbiology')) {
    return { specialtyId: 'spec-microbiology', groupId: 'grp-culture' };
  }

  // 16. Blood Bank & Transfusion
  if (
    ['ABO', 'RH', 'WEAKD', 'RHPHENO', 'KELL', 'XM-MAJ', 'XM-MIN', 'AB-SCR', 'AB-ID'].some(c => matchCode(code, c)) ||
    name.includes('blood group') || name.includes('فصيلة الدم') || name.includes('cross-match') || cat.includes('بنك الدم')
  ) {
    return { specialtyId: 'spec-bloodbank', groupId: 'grp-bloodbank-all' };
  }

  // 17. Toxicology & Drug Monitoring
  if (
    ['DIGOX', 'LITH', 'VPA', 'CBZ', 'PHT', 'PHB', 'THEO', 'VANCO', 'CYCLO', 'TACRO', 'MTX', 'UDS', 'HEAVY-PANEL'].some(c => matchCode(code, c)) ||
    code.startsWith('UDS-') || name.includes('toxicology') || name.includes('سموم') || name.includes('مخدرات') || cat.includes('السموم')
  ) {
    return { specialtyId: 'spec-toxicology', groupId: 'grp-toxicology-all' };
  }

  // 18. Molecular Biology & Genetics
  if (
    ['KARYO', 'FISH', 'CMA', 'MLPA', 'WES', 'WGS', 'NIPT', 'PGT', 'BRCA', 'EGFR', 'KRAS', 'CFTR'].some(c => matchCode(code, c)) ||
    code.startsWith('KARYO') || code.startsWith('FISH') || name.includes('mutation') || name.includes('وراثة') || name.includes('جين') || cat.includes('الوراثة')
  ) {
    return { specialtyId: 'spec-molecular', groupId: 'grp-molecular-genetics' };
  }

  // 19. Histopathology & Cytology
  if (
    ['HISTO-PATH', 'FROZEN', 'IHC', 'PAP', 'LBC', 'FNA', 'BIOPSY'].some(c => matchCode(code, c)) ||
    code.startsWith('FNA-') || code.endsWith('-BX') || name.includes('biopsy') || name.includes('خزعة') || name.includes('أنسجة') || cat.includes('الأنسجة')
  ) {
    return { specialtyId: 'spec-pathology', groupId: 'grp-pathology-all' };
  }

  // 20. Comprehensive Health & Wellness Panels
  if (
    code.startsWith('CHECKUP-') || code.startsWith('PANEL-') ||
    name.includes('checkup') || name.includes('باقة') || cat.includes('باقات')
  ) {
    return { specialtyId: 'spec-wellness', groupId: 'grp-wellness-all' };
  }

  // Default fallback for general biochemistry
  return { specialtyId: 'spec-chemistry', groupId: 'grp-biochem' };
}

function resolveTestField<T extends GroupableTest>(test: T, field: 'specialtyId' | 'groupId' | 'sortOrder' | 'category'): any {
  if (test[field] !== undefined && test[field] !== null) {
    return test[field];
  }
  if (test.test && test.test[field] !== undefined && test.test[field] !== null) {
    return test.test[field];
  }
  return null;
}

/**
 * Pure function to group tests either by Category or by Specialty hierarchy.
 */
export function groupTests<T extends GroupableTest>(
  tests: T[],
  style: GroupingStyle = 'specialty',
  options?: {
    specialties?: SpecialtyContext[];
    groups?: TestGroupContext[];
  }
): GroupedTestsResult<T> {
  if (!Array.isArray(tests) || tests.length === 0) {
    return { style, sections: [] };
  }

  // -------------------------------------------------------------
  // Mode 1: Group By Category (Traditional / Backward-Compatible)
  // -------------------------------------------------------------
  if (style === 'category') {
    const categoryMap = new Map<string, T[]>();

    for (const t of tests) {
      const cat = resolveTestField(t, 'category') || 'General Laboratory Tests';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(t);
    }

    const sections: GroupBucket<T>[] = [];
    let order = 1;
    categoryMap.forEach((catTests, catName) => {
      sections.push({
        id: null,
        nameEn: catName,
        nameAr: null,
        sortOrder: order++,
        groups: [],
        directTests: [...catTests],
        allTests: [...catTests],
      });
    });

    return { style: 'category', sections };
  }

  // -------------------------------------------------------------
  // Mode 2: Group By Clinical Specialty (Specialty -> Group? -> Test)
  // -------------------------------------------------------------
  // Flatten groups if specialties contain nested groups
  let effectiveGroups: TestGroupContext[] = [];
  if (Array.isArray(options?.groups) && options!.groups.length > 0) {
    effectiveGroups = [...options!.groups];
  } else if (Array.isArray(options?.specialties)) {
    for (const s of options!.specialties) {
      if (Array.isArray((s as any).groups)) {
        for (const g of (s as any).groups) {
          effectiveGroups.push(g);
        }
      }
    }
  }

  const specialties = (options?.specialties && options.specialties.length > 0) ? options.specialties : CANONICAL_SPECIALTIES;
  const groups = effectiveGroups.length > 0 ? effectiveGroups : CANONICAL_TEST_GROUPS;

  const specMap = new Map<string, SpecialtyContext>(specialties.map(s => [s.id, s]));
  const groupMap = new Map<string, TestGroupContext>(groups.map(g => [g.id, g]));

  // Specialty ID -> { direct: T[]; groups: Map<groupId, T[]> }
  const specialtyBuckets = new Map<string, { direct: T[]; groups: Map<string, T[]> }>();
  for (const s of specialties) {
    specialtyBuckets.set(s.id, {
      direct: [],
      groups: new Map<string, T[]>(),
    });
  }

  const otherTests: T[] = [];

  for (const t of tests) {
    let sId = resolveTestField(t, 'specialtyId');
    let gId = resolveTestField(t, 'groupId');
    const canonical = classifyTestCanonical(t);

    // 1. Resolve group & specialty
    const grpMeta = CANONICAL_GROUP_KEYWORDS[canonical.groupId];
    const isGIdValid = gId && groupMap.has(gId) && (!sId || groupMap.get(gId)?.specialtyId === sId);

    if (!isGIdValid) {
      // Look for exact canonical group match first, then matching keywords
      const matchedGrp = groups.find(g => (sId ? g.specialtyId === sId : true) && g.id === canonical.groupId) ||
        groups.find(g => {
          if (sId && g.specialtyId !== sId) return false;
          const gName = `${g.nameEn} ${g.nameAr || ''}`.toLowerCase();
          return grpMeta?.keywords.some(kw => gName.includes(kw));
        });

      if (matchedGrp) {
        gId = matchedGrp.id;
        if (!sId) sId = matchedGrp.specialtyId;
      } else if (!options?.specialties || options.specialties.length === 0) {
        gId = canonical.groupId;
      } else {
        gId = null;
      }
    }

    // 2. Resolve specialty
    if (!sId || !specMap.has(sId)) {
      if (!options?.specialties || options.specialties.length === 0) {
        sId = canonical.specialtyId;
      } else {
        sId = null;
      }
    }

    // 3. Place into bucket
    if (sId && specialtyBuckets.has(sId)) {
      const bucket = specialtyBuckets.get(sId)!;
      if (gId && groupMap.has(gId)) {
        if (!bucket.groups.has(gId)) {
          bucket.groups.set(gId, []);
        }
        bucket.groups.get(gId)!.push(t);
      } else {
        bucket.direct.push(t);
      }
    } else {
      otherTests.push(t);
    }
  }

  const sections: GroupBucket<T>[] = [];

  // Sort specialties by sortOrder
  const sortedSpecs = [...specialties].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const spec of sortedSpecs) {
    const bucket = specialtyBuckets.get(spec.id);
    if (!bucket) continue;

    // Subgroups under this specialty
    const specGroups = groups
      .filter(g => g.specialtyId === spec.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const subGroupBuckets: SubGroupBucket<T>[] = [];
    const allSpecTests: T[] = [];

    for (const grp of specGroups) {
      const gTests = bucket.groups.get(grp.id) || [];
      if (gTests.length === 0) continue; // Omit empty groups

      // Sort tests inside group by sortOrder, preserving original order as tie-breaker
      const sortedGroupTests = [...gTests].sort((a, b) => {
        const orderA = resolveTestField(a, 'sortOrder');
        const orderB = resolveTestField(b, 'sortOrder');
        if (orderA !== null && orderB !== null) return orderA - orderB;
        if (orderA !== null) return -1;
        if (orderB !== null) return 1;
        return 0;
      });

      subGroupBuckets.push({
        id: grp.id,
        specialtyId: spec.id,
        nameEn: grp.nameEn,
        nameAr: grp.nameAr,
        sortOrder: grp.sortOrder ?? 0,
        tests: sortedGroupTests,
      });

      allSpecTests.push(...sortedGroupTests);
    }

    // Direct tests inside specialty
    const sortedDirectTests = [...bucket.direct].sort((a, b) => {
      const orderA = resolveTestField(a, 'sortOrder');
      const orderB = resolveTestField(b, 'sortOrder');
      if (orderA !== null && orderB !== null) return orderA - orderB;
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;
      return 0;
    });

    allSpecTests.push(...sortedDirectTests);

    // Omit empty specialty section
    if (subGroupBuckets.length === 0 && sortedDirectTests.length === 0) {
      continue;
    }

    sections.push({
      id: spec.id,
      nameEn: spec.nameEn,
      nameAr: spec.nameAr,
      sortOrder: spec.sortOrder ?? 0,
      groups: subGroupBuckets,
      directTests: sortedDirectTests,
      allTests: allSpecTests,
    });
  }

  // Append Other Tests section at the end if any tests are ungrouped
  if (otherTests.length > 0) {
    sections.push({
      id: null,
      nameEn: 'Other Tests',
      nameAr: 'فحوصات أخرى',
      sortOrder: 9999,
      isOther: true,
      groups: [],
      directTests: [...otherTests],
      allTests: [...otherTests],
    });
  }

  return { style: 'specialty', sections };
}
