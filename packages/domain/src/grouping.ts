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
  { id: 'grp-diabetes', specialtyId: 'spec-chemistry', nameEn: 'Diabetic Profile (Diabetes & Glucose)', nameAr: 'قسم السكري وسكر الدم (Diabetic Profile)', sortOrder: 1 },
  { id: 'grp-lipid', specialtyId: 'spec-chemistry', nameEn: 'Lipid Profile', nameAr: 'قسم دهون الدم (Lipid Profile)', sortOrder: 2 },
  { id: 'grp-renal', specialtyId: 'spec-chemistry', nameEn: 'Renal Function Profile (RFT)', nameAr: 'قسم وظائف الكلى (RFT)', sortOrder: 3 },
  { id: 'grp-electrolytes', specialtyId: 'spec-chemistry', nameEn: 'Electrolytes & Minerals Profile', nameAr: 'قسم الأملاح والشوارد والمعادن (Electrolytes)', sortOrder: 4 },
  { id: 'grp-liver', specialtyId: 'spec-chemistry', nameEn: 'Liver Function Profile (LFT)', nameAr: 'قسم وظائف الكبد والمرارة (LFT)', sortOrder: 5 },
  { id: 'grp-cardiac', specialtyId: 'spec-chemistry', nameEn: 'Cardiac Markers & Enzymes Profile', nameAr: 'قسم إنزيمات ودلالات القلب (Cardiac Profile)', sortOrder: 6 },
  { id: 'grp-pancreatic', specialtyId: 'spec-chemistry', nameEn: 'Pancreatic & GI Enzymes', nameAr: 'قسم إنزيمات البنكرياس والجهاز الهضمي', sortOrder: 7 },
  { id: 'grp-vitamins', specialtyId: 'spec-chemistry', nameEn: 'Vitamins, Iron & Trace Elements', nameAr: 'قسم الفيتامينات والحديد والمعادن', sortOrder: 8 },
  { id: 'grp-biochem', specialtyId: 'spec-chemistry', nameEn: 'General Biochemistry & Enzymes', nameAr: 'الكيمياء السريرية العامة والإنزيمات', sortOrder: 9 },

  // Hematology Subgroups
  { id: 'grp-cbc', specialtyId: 'spec-hematology', nameEn: 'Complete Blood Count & Indices (CBC)', nameAr: 'صورة الدم الكاملة ومؤشراتها (CBC)', sortOrder: 1 },
  { id: 'grp-coag', specialtyId: 'spec-hematology', nameEn: 'Coagulation & Hemostasis Profile', nameAr: 'فحوصات التخثر والسيولة (Coagulation)', sortOrder: 2 },
  { id: 'grp-esr', specialtyId: 'spec-hematology', nameEn: 'ESR & Immunohematology', nameAr: 'ترسب الدم وفصائل الدم', sortOrder: 3 },

  // Hormones Subgroups
  { id: 'grp-thyroid', specialtyId: 'spec-hormones', nameEn: 'Thyroid Function Profile', nameAr: 'فحوصات الغدة الدرقية (Thyroid Profile)', sortOrder: 1 },
  { id: 'grp-fertility', specialtyId: 'spec-hormones', nameEn: 'Fertility & Reproductive Hormones', nameAr: 'هرمونات الخصوبة والحمل والتناسل', sortOrder: 2 },
  { id: 'grp-adrenal', specialtyId: 'spec-hormones', nameEn: 'Pituitary, Adrenal & Parathyroid Hormones', nameAr: 'هرمونات الغدة النخامية والكظرية والجار درقية', sortOrder: 3 },

  // Immunology Subgroups
  { id: 'grp-rheuma', specialtyId: 'spec-immunology', nameEn: 'Inflammatory & Rheumatic Markers', nameAr: 'دلالات الالتهاب والروماتيزم والمناعة الذاتية', sortOrder: 1 },
  { id: 'grp-infectious', specialtyId: 'spec-immunology', nameEn: 'Infectious Serology & Virology Screen', nameAr: 'الأمصال والفيروسات والحميات (Serology)', sortOrder: 2 },

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
  { id: 'grp-micro-general', specialtyId: 'spec-microbiology', nameEn: 'Routine Clinical Microscopy', nameAr: 'الفحص المجهري العام والإدرار والخروج', sortOrder: 1 },
  { id: 'grp-culture', specialtyId: 'spec-microbiology', nameEn: 'Cultures & Sensitivity', nameAr: 'المزارع والحساسية الجرثومية', sortOrder: 2 },

  // Tumor Markers
  { id: 'grp-tumor-all', specialtyId: 'spec-tumor', nameEn: 'Tumor Markers Profile', nameAr: 'دلالات الأورام التخصصية', sortOrder: 1 },
];

const CANONICAL_SPECIALTIES_MAP = new Map<string, SpecialtyContext>(
  CANONICAL_SPECIALTIES.map((s) => [s.id, s])
);

const CANONICAL_TEST_GROUPS_MAP = new Map<string, TestGroupContext>(
  CANONICAL_TEST_GROUPS.map((g) => [g.id, g])
);

const MAX_CLASSIFICATION_CACHE_SIZE = 5000;
const CANONICAL_CLASSIFICATION_CACHE = new Map<string, { specialtyId: string; groupId: string }>();

function isAlphaNumCharCode(ch: number): boolean {
  return (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122);
}

function matchCode(testCode: string, target: string): boolean {
  if (!testCode || !target) return false;
  if (testCode === target) return true;
  const targetLen = target.length;
  if (testCode.length <= targetLen || !testCode.startsWith(target)) return false;
  return !isAlphaNumCharCode(testCode.charCodeAt(targetLen));
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
    keywords: ['diabetes', 'diabetic', 'glucose', 'sugar', 'سكري', 'سكر'],
  },
  'grp-lipid': {
    specialtyKey: 'spec-chemistry',
    keywords: ['lipid', 'cholesterol', 'triglyceride', 'دهون', 'شحوم'],
  },
  'grp-renal': {
    specialtyKey: 'spec-chemistry',
    keywords: ['renal', 'rft', 'kidney', 'كلى', 'كلوية'],
  },
  'grp-electrolytes': {
    specialtyKey: 'spec-chemistry',
    keywords: ['electrolyte', 'mineral', 'أملاح', 'شوارد'],
  },
  'grp-liver': {
    specialtyKey: 'spec-chemistry',
    keywords: ['liver', 'lft', 'كبد', 'مرارة'],
  },
  'grp-cardiac': {
    specialtyKey: 'spec-chemistry',
    keywords: ['cardiac', 'troponin', 'heart', 'قلب', 'جلطة'],
  },
  'grp-pancreatic': {
    specialtyKey: 'spec-chemistry',
    keywords: ['pancrea', 'amylase', 'lipase', 'بنكرياس'],
  },
  'grp-vitamins': {
    specialtyKey: 'spec-chemistry',
    keywords: ['vitamin', 'trace', 'iron', 'فيتامين', 'معادن', 'حديد'],
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
    keywords: ['adrenal', 'pituitary', 'parathyroid', 'غدد', 'كظرية', 'نخامية'],
  },
  'grp-rheuma': {
    specialtyKey: 'spec-immunology',
    keywords: ['rheuma', 'inflammatory', 'روماتيزم', 'التهاب'],
  },
  'grp-infectious': {
    specialtyKey: 'spec-immunology',
    keywords: ['infectious', 'serology', 'معدية', 'فيروس', 'أمصال'],
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

function classifyTestCanonicalUncached(
  code: string,
  name: string,
  cat: string
): { specialtyId: string; groupId: string } {
  // 1. Tumor Markers (checked before Renal/Electrolytes to avoid CA125 / CA19-9 matching Calcium 'CA')
  if (
    [
      'PSA', 'FPSA', 'F-PSA', 'FREE-PSA', 'CEA', 'CA125', 'CA-125', 'CA15-3', 'CA153',
      'CA19-9', 'CA199', 'CA242', 'CA72-4', 'AFP', 'CGA', 'B2M', 'CYFRA-21',
      'CYFRA', 'HE4', 'ROMA', 'NSE', 'S100', 'CALCITONIN'
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
      'HPYLORI-AB', 'HPYLORI-AG', 'HPYLORI-STOOL', 'TOXO', 'RUBELLA', 'CMV', 'HSV', 'VDRL', 'TPHA', 'RPR',
      'CHLAM-IGG', 'CHLAM-IGM', 'DENGUE', 'EBV', 'MONOSPOT', 'HAV', 'HEV', 'ROTAVIRUS', 'ADENOVIRUS'
    ].some(c => matchCode(code, c)) ||
    name.includes('hepatitis') || name.includes('التهاب الكبد') || name.includes('widal') ||
    name.includes('rose bengal') || name.includes('brucella') || name.includes('typhoid') ||
    name.includes('syphilis') || name.includes('h. pylori') || name.includes('hpylori') || name.includes('جرثومة المعدة')
  ) {
    return { specialtyId: 'spec-immunology', groupId: 'grp-infectious' };
  }

  // 3. Diabetic Profile (comprehensive clinical glucose / HbA1c / insulin profile)
  if (
    [
      'FBS', 'RBS', 'PPBS', 'GLU-F', 'GLU-R', 'GLU-PP', 'HBA1C', 'A1C', 'GLU', 'GLUCOSE',
      'OGTT', 'OGTT-75G', 'GCT', 'GCT-50G', 'INSULIN', 'INS-F', 'INS-PP', 'C-PEP', 'CPEPTIDE',
      'HOMAIR', 'HOMA-IR', 'OGTT-CURVE', 'FRUCT', 'FRUCTOSAMINE', 'GAD65-AB', 'IA2-AB',
      'INSULIN-AB', 'ADIPONECT', 'ISLET-AB'
    ].some(c => matchCode(code, c)) ||
    name.includes('hba1c') || name.includes('تراكمي') || name.includes('سكري') ||
    name.includes('glucose') || name.includes('insulin') || name.includes('c-peptide') ||
    name.includes('cpeptide') || name.includes('homa') || name.includes('sugar') ||
    name.includes('صائم') || name.includes('عشوائي') || name.includes('تحمل السكر') ||
    name.includes('diabetic')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-diabetes' };
  }

  // 4. Lipid Profile (Pure lipids & lipoproteins — separated from Cardiac markers)
  if (
    [
      'CHOL', 'TC', 'CHOL-TOTAL', 'T-CHOL', 'TG', 'TRIG', 'HDL', 'HDL-C', 'HDLC',
      'LDL', 'LDL-C', 'LDLC', 'VLDL', 'VLDL-C', 'NON-HDL', 'TC/HDL', 'LDL/HDL',
      'APO-A1', 'APO-B', 'APO-RATIO', 'LPA', 'LIPID'
    ].some(c => matchCode(code, c)) ||
    name.includes('lipid') || name.includes('دهون') || name.includes('شحوم') ||
    name.includes('cholesterol') || name.includes('triglyceride') ||
    name.includes('كوليسترول') || name.includes('ثلاثية') || name.includes('lipoprotein')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-lipid' };
  }

  // 5. Cardiac Markers & Enzymes Profile (Troponin, CK-MB, CK, Myoglobin, NT-proBNP, Homocysteine, hs-CRP)
  if (
    [
      'TROP', 'TROP-I', 'TROP-T', 'TROPONIN', 'HS-TROP', 'CKMB', 'CK-MB', 'CK', 'CPK',
      'MYO', 'MYOGLOBIN', 'HCY', 'HOMOCYSTEINE', 'HS-CRP', 'HSCRP', 'NT-PROBNP', 'BNP', 'ANP'
    ].some(c => matchCode(code, c)) ||
    name.includes('troponin') || name.includes('تروبونين') || name.includes('ck-mb') ||
    name.includes('myoglobin') || name.includes('nt-probnp') || name.includes('homocysteine') ||
    name.includes('hs-crp') || name.includes('إنزيمات القلب') || name.includes('جلطة القلب')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-cardiac' };
  }

  // 6. Pancreatic & GI Enzymes (Amylase, Lipase, Elastase)
  if (
    ['AMYLASE', 'AMY', 'U-AMY', 'LIPASE', 'LIP', 'ELASTASE', 'GASTRIN', 'PEPSINOGEN'].some(c => matchCode(code, c)) ||
    name.includes('amylase') || name.includes('lipase') || name.includes('أميليز') ||
    name.includes('ليبيز') || name.includes('بنكرياس') || name.includes('pancrea')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-pancreatic' };
  }

  // 7. Liver Function & Enzymes (LFT)
  if (
    [
      'GPT', 'ALT', 'SGPT', 'GOT', 'AST', 'SGOT', 'ALP', 'ALK-P', 'GGT', 'TSB', 'TBIL', 'BIL-T',
      'DBIL', 'IBIL', 'DIR-BIL', 'BIL-D', 'INDIR-BIL', 'ALB', 'ALBUMIN', 'TP', 'TOTAL-PROTEIN',
      'GLOB', 'GLOBULIN', 'LDH', 'AMMONIA', 'NH3', 'CHE-PSEUDO', 'AG-RATIO', 'FIB-4', 'BILE-ACIDS'
    ].some(c => matchCode(code, c)) ||
    name.includes('liver') || name.includes('كبد') || name.includes('bilirubin') ||
    name.includes('بيليروبين') || name.includes('أبو صفار') ||
    name.includes('transaminase') || name.includes('albumin') || name.includes('ألبومين') ||
    name.includes('مرارة')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-liver' };
  }

  // 8. Electrolytes & Minerals Profile (Na, K, Cl, Ca, Ionized Ca, Phos, Mg, Bicarbonate, Osmolality)
  if (
    [
      'NA', 'SODIUM', 'K', 'POTASSIUM', 'CL', 'CHLORIDE', 'CA', 'CALC', 'CALCIUM', 'CA-ION',
      'ION-CA', 'PHOS', 'PHOSPHORUS', 'PO4', 'MG', 'MAGNESIUM', 'BICARB', 'HCO3', 'CO2',
      'ANION-GAP', 'OSM', 'OSM-URINE', 'U-PHOS-24H', 'U-CA-24H', 'U-NA-24H', 'U-K-24H'
    ].some(c => matchCode(code, c)) ||
    name.includes('electrolyte') || name.includes('sodium') || name.includes('potassium') ||
    name.includes('chloride') || name.includes('calcium') || name.includes('magnesium') ||
    name.includes('phosphorus') || name.includes('صوديوم') || name.includes('بوتاسيوم') ||
    name.includes('كلورايد') || name.includes('كالسيوم') || name.includes('مغنيسيوم') ||
    name.includes('فسفور') || name.includes('شوارد')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-electrolytes' };
  }

  // 9. Renal Function Profile (RFT: Urea, Creatinine, Uric Acid, eGFR, Microalbumin, 24h Urine Protein)
  if (
    [
      'UREA', 'CREAT', 'CREA', 'CR', 'CREATININE', 'URIC', 'UA', 'BUN', 'EGFR', 'CR-CLEAR',
      'UPCR', 'UACR', 'MALB', 'MICROALB', 'U-PROT-24H', 'CYSTATIN', 'CYST-C', 'B2M-URINE'
    ].some(c => matchCode(code, c)) ||
    name.includes('renal') || name.includes('كلى') || name.includes('kidney') ||
    name.includes('creatinine') || name.includes('كرياتينين') || name.includes('urea') ||
    name.includes('uric') || name.includes('يوريا') || name.includes('نقرس')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-renal' };
  }

  // 10. Vitamins, Iron & Trace Elements
  if (
    [
      'VIT-D', 'VITD', 'D3', 'VIT-B12', 'VITB12', 'B12', 'FOLATE', 'FOLIC', 'RBC-FOLATE',
      'IRON', 'FE', 'FERRITIN', 'FER', 'TIBC', 'UIBC', 'TSAT', 'ZINC', 'ZN', 'COPPER', 'CU',
      'SELENIUM', 'CERULOPLAS', 'LEAD-BLOOD', 'VIT-A', 'VIT-B1', 'VIT-B6', 'VIT-C', 'VIT-E'
    ].some(c => matchCode(code, c)) ||
    name.includes('vitamin') || name.includes('فيتامين') || name.includes('iron') ||
    name.includes('حديد') || name.includes('ferritin') || name.includes('فيريتين') ||
    name.includes('مخزون الحديد') || name.includes('فوليك') || name.includes('زنك')
  ) {
    return { specialtyId: 'spec-chemistry', groupId: 'grp-vitamins' };
  }

  // 11. Coagulation & Hemostasis (including D-Dimer)
  if (
    [
      'PT', 'PT-INR', 'INR', 'PTT', 'APTT', 'FIB', 'FIBRINOGEN', 'D-DIMER', 'DDIMER',
      'BT', 'CT', 'FACT-VIII', 'FACT-IX', 'AT-III', 'ANTI-XA', 'APCR', 'PROT-C', 'PROT-S', 'LUPUS-AC'
    ].some(c => matchCode(code, c)) ||
    name.includes('coagulation') || name.includes('تخثر') || name.includes('prothrombin') ||
    name.includes('d-dimer') || name.includes('سيولة') || name.includes('نزف')
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

export function classifyTestCanonical(test: GroupableTest): { specialtyId: string; groupId: string } {
  const code = String(test.code || test.test?.code || '').toUpperCase().trim();
  const name = `${test.name || ''} ${test.test?.name || ''} ${(test as any).arabicName || ''} ${test.test?.arabicName || ''}`.toLowerCase();
  const cat = String(test.category || test.test?.category || '').toLowerCase();
  const cacheKey = `${code}|${name}|${cat}`;

  const cached = CANONICAL_CLASSIFICATION_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = classifyTestCanonicalUncached(code, name, cat);
  if (CANONICAL_CLASSIFICATION_CACHE.size >= MAX_CLASSIFICATION_CACHE_SIZE) {
    CANONICAL_CLASSIFICATION_CACHE.clear();
  }
  CANONICAL_CLASSIFICATION_CACHE.set(cacheKey, result);
  return result;
}

export function getCanonicalGroupMeta(test: GroupableTest): TestGroupContext & { specialtyNameEn: string; specialtyNameAr: string } {
  const { specialtyId, groupId } = classifyTestCanonical(test);
  const grp = CANONICAL_TEST_GROUPS_MAP.get(groupId) || CANONICAL_TEST_GROUPS[8];
  const spec = CANONICAL_SPECIALTIES_MAP.get(specialtyId) || CANONICAL_SPECIALTIES[0];
  return {
    ...grp,
    specialtyNameEn: spec.nameEn,
    specialtyNameAr: spec.nameAr || spec.nameEn,
  };
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
