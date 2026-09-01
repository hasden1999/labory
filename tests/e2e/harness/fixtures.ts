/**
 * Labryo Clinical LIS - Comprehensive Test Fixtures & Mock Datasets
 */

export interface TestPatient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  notes?: string;
  createdAt: string;
}

export interface TestDoctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  clinic: string;
  commissionRate: number; // percentage e.g. 15
}

export interface TestCatalogItem {
  id: string;
  code: string;
  name: string;
  category: 'URINE' | 'STOOL' | 'HEMATOLOGY' | 'CHEMISTRY' | 'MICROBIOLOGY' | 'ENDOCRINE';
  price: number;
  unit?: string;
  normalRange?: string;
}

export interface TestSettings {
  labName: string;
  labSubtitle?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  headerMode: 'DIGITAL' | 'PREPRINTED';
  reportTemplate: 'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED';
  topMarginMm: number;
  bottomMarginMm: number;
  leftMarginMm: number;
  rightMarginMm: number;
  primaryColor?: string;
  doctorLicense?: string;
  accreditationBadge?: string;
  enableQrCode: boolean;
  qrCodePosition?: 'HEADER' | 'FOOTER';
  defaultDiscountPercent?: number;
}

export const FIXTURE_PATIENTS: TestPatient[] = [
  {
    id: 'pat-diabetic-1',
    name: 'حيدر عبد الحسين الخفاجي',
    phone: '07701239988',
    age: 48,
    gender: 'MALE',
    notes: 'Diabetic nephropathy follow-up, hypertension',
    createdAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'pat-female-young',
    name: 'زينب جاسم محمد الجبوري',
    phone: '07804445566',
    age: 29,
    gender: 'FEMALE',
    notes: 'Gestational screening & urinary tract burning',
    createdAt: '2026-08-10T11:30:00.000Z'
  },
  {
    id: 'pat-elderly-male',
    name: 'عمر طارق السامرائي',
    phone: '07707778899',
    age: 62,
    gender: 'MALE',
    notes: 'Chronic kidney disease Stage 3b & hyperlipidemia',
    createdAt: '2026-08-15T09:15:00.000Z'
  },
  {
    id: 'pat-pediatric',
    name: 'أحمد علي حسن الكرخي',
    phone: '07501112233',
    age: 6,
    gender: 'MALE',
    notes: 'Severe acute diarrhea, abdominal colic & fever',
    createdAt: '2026-08-20T14:00:00.000Z'
  },
  {
    id: 'pat-icu-critical',
    name: 'فاطمة كريم العزاوي',
    phone: '07908887766',
    age: 74,
    gender: 'FEMALE',
    notes: 'ICU Admission - Urosepsis, hyperkalemia, acute pancytopenia',
    createdAt: '2026-08-25T08:00:00.000Z'
  }
];

export const FIXTURE_DOCTORS: TestDoctor[] = [
  {
    id: 'doc-1',
    name: 'د. علي حسين التميمي',
    specialty: 'استشاري الأمراض الباطنية والكلى',
    phone: '07701112222',
    clinic: 'مجمع بغداد الطبي التخصصي',
    commissionRate: 15
  },
  {
    id: 'doc-2',
    name: 'د. سارة عمار العامري',
    specialty: 'أخصائية أمراض الدم والأورام',
    phone: '07803334444',
    clinic: 'العيادات الاستشارية الحديثة',
    commissionRate: 20
  },
  {
    id: 'doc-3',
    name: 'د. محمد جاسم الزبيدي',
    specialty: 'استشاري الأطفال وحديثي الولادة',
    phone: '07705556666',
    clinic: 'مستشفى الطفل المركزي',
    commissionRate: 10
  }
];

export const FIXTURE_CATALOG: TestCatalogItem[] = [
  { id: 't-gue', code: 'GUE', name: 'General Urine Examination (G.U.E)', category: 'URINE', price: 5000 },
  { id: 't-gse', code: 'GSE', name: 'General Stool Examination (G.S.E)', category: 'STOOL', price: 5000 },
  { id: 't-cbc', code: 'CBC', name: 'Complete Blood Count (CBC + 5-Part Diff)', category: 'HEMATOLOGY', price: 10000 },
  { id: 't-fbs', code: 'FBS', name: 'Fasting Blood Sugar', category: 'CHEMISTRY', price: 4000, unit: 'mg/dL', normalRange: '70 - 110' },
  { id: 't-hba1c', code: 'HBA1C', name: 'Hemoglobin A1c (Glycated Hb)', category: 'CHEMISTRY', price: 15000, unit: '%', normalRange: '4.5 - 5.7' },
  { id: 't-creat', code: 'CREAT', name: 'Serum Creatinine', category: 'CHEMISTRY', price: 6000, unit: 'mg/dL', normalRange: '0.6 - 1.2' },
  { id: 't-urea', code: 'UREA', name: 'Blood Urea', category: 'CHEMISTRY', price: 6000, unit: 'mg/dL', normalRange: '15 - 45' },
  { id: 't-lipid', code: 'LIPID', name: 'Lipid Profile Panel (TC, HDL, LDL, TG)', category: 'CHEMISTRY', price: 18000 },
  { id: 't-lft', code: 'LFT', name: 'Liver Function Panel (TB, DB, AST, ALT, ALP, Alb)', category: 'CHEMISTRY', price: 20000 },
  { id: 't-lytes', code: 'ELECTROLYTES', name: 'Electrolytes Panel (Na, K, Cl, HCO3)', category: 'CHEMISTRY', price: 16000 },
  { id: 't-culture', code: 'CULTURE_URINE', name: 'Urine Culture & Antibiogram Sensitivity', category: 'MICROBIOLOGY', price: 25000 },
  { id: 't-tsh', code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', category: 'ENDOCRINE', price: 12000, unit: 'uIU/mL', normalRange: '0.4 - 4.2' },
];

export const FIXTURE_GUE_DATA = {
  normal: {
    color: 'Yellow',
    clarity: 'Clear',
    specificGravity: 1.020,
    ph: 6.0,
    protein: 'Nil',
    sugar: 'Nil',
    ketones: 'Nil',
    bilirubin: 'Nil',
    urobilinogen: 'Normal',
    blood: 'Nil',
    nitrite: 'Negative',
    leukocyteEsterase: 'Negative',
    pusCells: '1-2',
    rbc: '0-1',
    epithelialCells: 'Few',
    casts: 'None',
    crystals: [],
    microorganisms: { bacteria: 'Nil', yeast: 'Nil', trichomonas: 'Nil' },
    mucus: 'Nil'
  },
  multiCrystalPathological: {
    color: 'Amber',
    clarity: 'Turbid',
    specificGravity: 1.028,
    ph: 5.5,
    protein: '++',
    sugar: '+++',
    ketones: '+',
    bilirubin: 'Nil',
    urobilinogen: 'Normal',
    blood: '++',
    nitrite: 'Positive',
    leukocyteEsterase: 'Positive (+++)',
    pusCells: '30-40',
    rbc: '15-20',
    epithelialCells: 'Moderate',
    casts: 'Granular (2-4 /LPF)',
    crystals: [
      { type: 'Calcium Oxalate', amount: '+++' },
      { type: 'Uric Acid', amount: '++' },
      { type: 'Amorphous Urates', amount: '+' }
    ],
    microorganisms: {
      bacteria: 'Many (+++)',
      yeast: 'Present (+)',
      trichomonas: 'Nil'
    },
    mucus: 'Moderate'
  }
};

export const FIXTURE_GSE_DATA = {
  amoebicDysentery: {
    color: 'Reddish Brown',
    consistency: 'Mucoid / Loose',
    fobt: 'Positive',
    microscopic: {
      pusCells: '25-30',
      rbc: '35-40',
      muscleFibers: 'Present',
      starchGranules: 'Few',
      fatGlobules: 'Nil',
      vegetableCells: 'Few'
    },
    parasitology: [
      { organism: 'Entamoeba histolytica', stage: 'Trophozoite (Hematophagous)', severity: '+++' },
      { organism: 'Giardia lamblia', stage: 'Cyst', severity: '+' }
    ],
    notes: 'Active amoebic dysentery with ingested RBCs in trophozoites'
  }
};

export const FIXTURE_CBC_DATA = {
  validNormal: {
    rbc: 4.8,
    hgb: 14.5,
    hct: 43.5,
    mcv: 90.6,
    mch: 30.2,
    mchc: 33.3,
    rdw: 12.5,
    plt: 250,
    mpv: 9.8,
    pdw: 11.2,
    pct: 0.245,
    wbc: 7.2,
    neutrophils: 60.0,
    lymphocytes: 30.0,
    monocytes: 6.0,
    eosinophils: 3.0,
    basophils: 1.0,
    morphology: 'Normocytic Normochromic'
  },
  severePancytopenia: {
    rbc: 1.8,
    hgb: 5.2, // CRITICAL PANIC (< 6.0)
    hct: 16.0,
    mcv: 88.9,
    mch: 28.9,
    mchc: 32.5,
    rdw: 18.2,
    plt: 12, // CRITICAL PANIC (< 20)
    mpv: 11.5,
    pdw: 16.0,
    pct: 0.014,
    wbc: 1.4, // CRITICAL LEUKOPENIA
    neutrophils: 20.0,
    lymphocytes: 72.0,
    monocytes: 6.0,
    eosinophils: 1.5,
    basophils: 0.5,
    morphology: 'Severe anisopoikilocytosis, blast cells present (12%)'
  }
};

export const FIXTURE_SETTINGS: Record<string, TestSettings> = {
  classicDigital: {
    labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
    labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني معتمد',
    phone: '07701234567',
    address: 'بغداد - شارع الأطباء',
    headerMode: 'DIGITAL',
    reportTemplate: 'CLASSIC',
    topMarginMm: 10,
    bottomMarginMm: 10,
    leftMarginMm: 10,
    rightMarginMm: 10,
    primaryColor: '#1e3a8a',
    doctorLicense: 'MOH-IQ-2026-8842',
    accreditationBadge: 'ISO 15189 Accredited',
    enableQrCode: true,
    qrCodePosition: 'HEADER',
    defaultDiscountPercent: 0
  },
  modernGradient: {
    labName: 'Modern BioLab Diagnostic Center',
    headerMode: 'DIGITAL',
    reportTemplate: 'MODERN',
    topMarginMm: 12,
    bottomMarginMm: 12,
    leftMarginMm: 10,
    rightMarginMm: 10,
    primaryColor: '#0ea5e9',
    enableQrCode: true,
    qrCodePosition: 'FOOTER',
    defaultDiscountPercent: 10
  },
  preprintedLetterhead: {
    labName: 'Al-Mustansiriya Specialized Lab',
    headerMode: 'PREPRINTED',
    reportTemplate: 'EXECUTIVE',
    topMarginMm: 45, // Pre-printed lab letterhead space
    bottomMarginMm: 30, // Pre-printed footer space
    leftMarginMm: 15,
    rightMarginMm: 15,
    enableQrCode: true,
    qrCodePosition: 'FOOTER',
    defaultDiscountPercent: 0
  },
  compactDualColumn: {
    labName: 'Central High-Volume Pathology Core',
    headerMode: 'DIGITAL',
    reportTemplate: 'COMPACT',
    topMarginMm: 8,
    bottomMarginMm: 8,
    leftMarginMm: 8,
    rightMarginMm: 8,
    enableQrCode: true,
    qrCodePosition: 'HEADER'
  },
  specializedMultiPart: {
    labName: 'Specialized Microbiology & Histopathology Institute',
    headerMode: 'DIGITAL',
    reportTemplate: 'SPECIALIZED',
    topMarginMm: 10,
    bottomMarginMm: 10,
    leftMarginMm: 10,
    rightMarginMm: 10,
    enableQrCode: true,
    qrCodePosition: 'HEADER'
  }
};
