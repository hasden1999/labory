/**
 * Labryo Clinical Intelligence & Auto-Calculations Engine
 * 
 * Pure TypeScript Domain Module for Clinical Laboratory Information System (LIS).
 * Compliant with IFCC, CLSI, KDIGO, ADA, and WHO clinical diagnostic standards.
 * 
 * Includes:
 * 1. 2021 CKD-EPI Race-Free eGFR (NEJM 2021) with KDIGO G1-G5 Staging
 * 2. Friedewald LDL Calculation with TG >= 400 mg/dL Invalidation Rule
 * 3. VLDL, Non-HDL Cholesterol, and Cardiac Risk Ratio (Total Chol / HDL)
 * 4. Indirect Bilirubin with Direct > Total Error Invalidation
 * 5. Serum Anion Gap with HAGMA / MUDPILES Interpretation
 * 6. Corrected Calcium for Hypoalbuminemia
 * 7. A/G Ratio (Albumin / Globulin)
 * 8. De Ritis Ratio (AST / ALT) with Clinical Interpretation
 * 9. Estimated Average Glucose (eAG) from HbA1c (ADAG study)
 * 10. HOMA-IR (Insulin Resistance Index)
 * 11. Mentzer Index for Microcytic Anemia Differential Screening
 * 12. Complete Blood Count (CBC) Auto-Indices (MCV, MCH, MCHC)
 * 13. 5-Part Differential Sum Balance Checker (sum = 100%)
 * 14. Dynamic Age- & Gender-Stratified Reference Range Evaluator
 * 15. 3-Tier Alert System (NORMAL, ABNORMAL, CRITICAL PANIC)
 */

export type Gender = 'MALE' | 'FEMALE' | string;

export interface CalculationInputs {
  age?: number;
  gender?: 'MALE' | 'FEMALE' | string;
  creatinine?: number; // mg/dL
  totalCholesterol?: number; // mg/dL
  hdl?: number; // mg/dL
  triglycerides?: number; // mg/dL
  totalBilirubin?: number; // mg/dL
  directBilirubin?: number; // mg/dL
  sodium?: number; // mmol/L
  potassium?: number; // mmol/L
  chloride?: number; // mmol/L
  bicarbonate?: number; // mmol/L
  calcium?: number; // mg/dL
  albumin?: number; // g/dL
  totalProtein?: number; // g/dL
  ast?: number; // U/L
  alt?: number; // U/L
  hba1c?: number; // %
  fbs?: number; // mg/dL
  fastingInsulin?: number; // uIU/mL
  rbc?: number; // 10^6/uL
  mcv?: number; // fL
  hgb?: number; // g/dL
  hct?: number; // %
  neutrophils?: number; // %
  lymphocytes?: number; // %
  monocytes?: number; // %
  eosinophils?: number; // %
  basophils?: number; // %
}

export interface EgfrResult {
  value: number;
  stage: string;
  note: string;
}

export interface LdlResult {
  value: number | null;
  invalidReason?: string;
}

export interface BilirubinResult {
  value: number | null;
  invalidReason?: string;
}

export interface AnionGapResult {
  value: number;
  interpretation: string;
}

export interface DeRitisResult {
  value: number;
  interpretation: string;
}

export interface HomaIrResult {
  value: number;
  interpretation: string;
}

export interface MentzerIndexResult {
  value: number;
  interpretation: string;
}

export interface CbcIndicesResult {
  mcv?: number;
  mch?: number;
  mchc?: number;
}

export interface DifferentialSumResult {
  sum: number;
  isValid: boolean;
  error?: string;
}

export interface ReferenceRange {
  min: number;
  max: number;
  unit: string;
  category?: string;
}

export interface PanicEvaluationResult {
  isPanic: boolean;
  isAbnormal: boolean;
  badgeLevel: 'NORMAL' | 'ABNORMAL' | 'CRITICAL_PANIC';
  panicReason?: string;
}

export interface CalculationResults {
  egfr?: EgfrResult;
  ldl?: LdlResult;
  vldl?: { value: number | null; invalidReason?: string };
  nonHdl?: { value: number };
  cardiacRiskRatio?: { value: number };
  indirectBilirubin?: BilirubinResult;
  anionGap?: AnionGapResult;
  correctedCalcium?: { value: number };
  agRatio?: { value: number | null };
  deRitisRatio?: DeRitisResult;
  eag?: { value: number };
  homaIr?: HomaIrResult;
  mentzerIndex?: MentzerIndexResult;
  calculatedMcv?: number;
  calculatedMch?: number;
  calculatedMchc?: number;
  differentialValidation?: DifferentialSumResult;
}

// --------------------------------------------------------------------------
// Helper: Normalizes gender input
// --------------------------------------------------------------------------
export function isFemaleGender(gender?: Gender): boolean {
  if (!gender) return false;
  const g = String(gender).trim().toUpperCase();
  return g === 'FEMALE' || g === 'F' || g === 'أنثى' || g === 'انثى';
}

// --------------------------------------------------------------------------
// 1. 2021 CKD-EPI Race-Free eGFR
// Ref: Inker LA et al. NEJM 2021; 385:1737-1749
// eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^(-1.200) * 0.9938^Age * (1.012 if female)
// --------------------------------------------------------------------------
export function calculateEgfr(
  scr: number,
  age: number,
  gender: 'MALE' | 'FEMALE' | string
): EgfrResult {
  if (isNaN(scr) || isNaN(age) || scr <= 0 || age <= 0) {
    return { value: 0, stage: 'N/A', note: 'Invalid creatinine or age input' };
  }

  const isFemale = isFemaleGender(gender);
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const genderFactor = isFemale ? 1.012 : 1.0;

  const scrRatio = scr / kappa;
  const minTerm = Math.pow(Math.min(scrRatio, 1.0), alpha);
  const maxTerm = Math.pow(Math.max(scrRatio, 1.0), -1.200);
  const ageTerm = Math.pow(0.9938, age);

  const egfr = 142 * minTerm * maxTerm * ageTerm * genderFactor;
  const rounded = Math.round(egfr * 10) / 10;

  let stage = '';
  let note = '';
  if (rounded >= 90) {
    stage = 'G1';
    note = 'Normal or high kidney function';
  } else if (rounded >= 60) {
    stage = 'G2';
    note = 'Mildly decreased kidney function';
  } else if (rounded >= 45) {
    stage = 'G3a';
    note = 'Mildly to moderately decreased kidney function';
  } else if (rounded >= 30) {
    stage = 'G3b';
    note = 'Moderately to severely decreased kidney function';
  } else if (rounded >= 15) {
    stage = 'G4';
    note = 'Severely decreased kidney function';
  } else {
    stage = 'G5';
    note = 'Kidney failure (End-stage renal disease)';
  }

  return { value: rounded, stage, note };
}

// --------------------------------------------------------------------------
// 2. Friedewald Equation for LDL-C & Invalidation Rule
// LDL = Total Chol - HDL - (TG / 5)
// Invalidation: TG >= 400 mg/dL (chylomicronemia invalidates assumption)
// --------------------------------------------------------------------------
export function calculateLdl(
  tc: number,
  hdl: number,
  tg: number
): LdlResult {
  if (isNaN(tc) || isNaN(hdl) || isNaN(tg) || tc < 0 || hdl < 0 || tg < 0) {
    return {
      value: null,
      invalidReason: 'Invalid lipid panel values (negative or NaN input)',
    };
  }
  if (tg >= 400) {
    return {
      value: null,
      invalidReason:
        'Triglycerides >= 400 mg/dL (chylomicronemia invalidates Friedewald equation; direct LDL measurement required)',
    };
  }
  const ldl = tc - hdl - tg / 5;
  return { value: Math.round(ldl * 10) / 10 };
}

// --------------------------------------------------------------------------
// 3. Lipid Fractions: VLDL, Non-HDL, Cardiac Risk Ratio
// --------------------------------------------------------------------------
export function calculateVldl(tg: number): { value: number | null; invalidReason?: string } {
  if (isNaN(tg) || tg < 0) {
    return {
      value: null,
      invalidReason: 'Invalid triglycerides value (negative or NaN input)',
    };
  }
  if (tg >= 400) {
    return {
      value: null,
      invalidReason: 'Triglycerides >= 400 mg/dL: VLDL approximation invalid due to chylomicrons',
    };
  }
  return { value: Math.round((tg / 5) * 10) / 10 };
}

export function calculateNonHdl(tc: number, hdl: number): { value: number } {
  if (isNaN(tc) || isNaN(hdl)) return { value: 0 };
  return { value: Math.round((tc - hdl) * 10) / 10 };
}

export function calculateCardiacRisk(tc: number, hdl: number): { value: number } {
  if (isNaN(tc) || isNaN(hdl) || hdl <= 0 || tc < 0) return { value: 0 };
  return { value: Math.round((tc / hdl) * 100) / 100 };
}

// --------------------------------------------------------------------------
// 4. Indirect Bilirubin & Error Invalidation
// Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
// Invalidation: Direct Bilirubin > Total Bilirubin
// --------------------------------------------------------------------------
export function calculateIndirectBilirubin(tb: number, db: number): BilirubinResult {
  if (isNaN(tb) || isNaN(db) || tb < 0 || db < 0) {
    return {
      value: null,
      invalidReason: 'Invalid bilirubin values (negative or NaN input)',
    };
  }
  if (db > tb) {
    return {
      value: null,
      invalidReason: 'Direct Bilirubin cannot exceed Total Bilirubin',
    };
  }
  return { value: Math.round((tb - db) * 100) / 100 };
}

// --------------------------------------------------------------------------
// 5. Serum Anion Gap & Acid-Base Evaluation
// Anion Gap = Na - (Cl + HCO3)
// --------------------------------------------------------------------------
export function calculateAnionGap(na: number, cl: number, hco3: number): AnionGapResult {
  if (isNaN(na) || isNaN(cl) || isNaN(hco3)) {
    return { value: 0, interpretation: 'Indeterminate (NaN input)' };
  }
  const ag = na - (cl + hco3);
  const rounded = Math.round(ag * 10) / 10;
  let interpretation = 'Normal Anion Gap (8-16 mmol/L)';
  if (rounded > 16) {
    interpretation = 'High Anion Gap Metabolic Acidosis (HAGMA)';
  } else if (rounded < 8) {
    interpretation = 'Low Anion Gap (hypoalbuminemia, paraproteinemia)';
  }
  return { value: rounded, interpretation };
}

// --------------------------------------------------------------------------
// 6. Corrected Calcium for Hypoalbuminemia
// Corrected Ca = Measured Ca + 0.8 * (4.0 - Serum Albumin)
// --------------------------------------------------------------------------
export function calculateCorrectedCalcium(ca: number, alb: number): { value: number } {
  if (isNaN(ca) || isNaN(alb)) return { value: 0 };
  const corrected = ca + 0.8 * (4.0 - alb);
  return { value: Math.round(corrected * 100) / 100 };
}

// --------------------------------------------------------------------------
// 7. A/G Ratio (Albumin / Globulin)
// Globulin = Total Protein - Albumin
// A/G Ratio = Albumin / Globulin
// --------------------------------------------------------------------------
export function calculateAgRatio(tp: number, alb: number): { value: number | null } {
  if (isNaN(tp) || isNaN(alb) || alb < 0 || tp < 0) return { value: null };
  const globulin = tp - alb;
  if (globulin <= 0) return { value: null };
  return { value: Math.round((alb / globulin) * 100) / 100 };
}

// --------------------------------------------------------------------------
// 8. De Ritis Ratio (AST / ALT)
// --------------------------------------------------------------------------
export function calculateDeRitis(ast: number, alt: number): DeRitisResult {
  if (isNaN(ast) || isNaN(alt) || ast < 0 || alt <= 0) {
    return { value: 0, interpretation: 'Indeterminate' };
  }
  const ratio = Math.round((ast / alt) * 100) / 100;
  let interpretation = 'Normal / Low (< 1.0)';
  if (ratio >= 2.0) {
    interpretation = 'Significantly Elevated (>= 2.0, suggestive of alcoholic hepatitis or toxic necrosis)';
  } else if (ratio >= 1.0) {
    interpretation = 'Elevated (>= 1.0, suggestive of cirrhosis, chronic hepatitis, or myocardial damage)';
  }
  return { value: ratio, interpretation };
}

// --------------------------------------------------------------------------
// 9. Estimated Average Glucose (eAG) from HbA1c
// eAG (mg/dL) = 28.7 * HbA1c - 46.7
// --------------------------------------------------------------------------
export function calculateEag(hba1c: number): { value: number } {
  if (isNaN(hba1c) || hba1c <= 0) return { value: 0 };
  const eag = 28.7 * hba1c - 46.7;
  const clean = Math.round(eag * 1000) / 1000;
  return { value: Math.max(0, Math.round(clean)) };
}

// --------------------------------------------------------------------------
// 10. HOMA-IR (Homeostatic Model Assessment of Insulin Resistance)
// HOMA-IR = (FBS [mg/dL] * Fasting Insulin [uIU/mL]) / 405
// --------------------------------------------------------------------------
export function calculateHomaIr(fbs: number, insulin: number): HomaIrResult {
  if (isNaN(fbs) || isNaN(insulin) || fbs <= 0 || insulin <= 0) {
    return { value: 0, interpretation: 'Indeterminate (Invalid input)' };
  }
  const homa = (fbs * insulin) / 405;
  const rounded = Math.round(homa * 100) / 100;
  let interpretation = 'Normal Insulin Sensitivity (< 2.0)';
  if (rounded >= 2.5) {
    interpretation = 'Significant Insulin Resistance (>= 2.5)';
  } else if (rounded >= 2.0) {
    interpretation = 'Borderline Insulin Resistance (2.0 - 2.4)';
  }
  return { value: rounded, interpretation };
}

// --------------------------------------------------------------------------
// 11. Mentzer Index
// Mentzer Index = MCV / RBC
// < 13: suggests Beta-Thalassemia Trait
// >= 13: suggests Iron Deficiency Anemia
// --------------------------------------------------------------------------
export function calculateMentzerIndex(mcv: number, rbc: number): MentzerIndexResult {
  if (isNaN(mcv) || isNaN(rbc) || rbc <= 0 || mcv <= 0) {
    return { value: 0, interpretation: 'Indeterminate' };
  }
  const index = Math.round((mcv / rbc) * 10) / 10;
  const interpretation =
    index < 13
      ? 'Suggests Beta-Thalassemia Trait (< 13)'
      : 'Suggests Iron Deficiency Anemia (>= 13)';
  return { value: index, interpretation };
}

// --------------------------------------------------------------------------
// 12. CBC Red Blood Cell Indices
// MCV = (HCT * 10) / RBC
// MCH = (HGB * 10) / RBC
// MCHC = (HGB * 100) / HCT
// --------------------------------------------------------------------------
export function calculateCbcIndices(rbc: number, hgb: number, hct: number): CbcIndicesResult {
  if (
    isNaN(rbc) || isNaN(hgb) || isNaN(hct) ||
    rbc <= 0 || hct <= 0 || hgb <= 0
  ) {
    return {};
  }
  const mcv = Math.round(((hct * 10) / rbc) * 10) / 10;
  const mch = Math.round(((hgb * 10) / rbc) * 10) / 10;
  const mchc = Math.round(((hgb * 100) / hct) * 10) / 10;
  return { mcv, mch, mchc };
}

// --------------------------------------------------------------------------
// 13. 5-Part Differential Sum Balance Checker
// Sum = Neut% + Lymph% + Mono% + Eos% + Baso% == 100.0%
// --------------------------------------------------------------------------
export function validateDifferentialSum(
  neut: number,
  lymph: number,
  mono: number,
  eos: number,
  baso: number
): DifferentialSumResult {
  const values = [neut, lymph, mono, eos, baso];
  if (values.some(v => typeof v !== 'number' || isNaN(v) || v < 0)) {
    return {
      sum: 0,
      isValid: false,
      error: 'Differential percentages cannot be negative or invalid',
    };
  }
  const sum = Math.round((neut + lymph + mono + eos + baso) * 10) / 10;
  const isValid = Math.abs(sum - 100.0) < 0.1;
  return {
    sum,
    isValid,
    error: isValid ? undefined : `Differential sum must equal 100% (currently ${sum}%)`,
  };
}

// --------------------------------------------------------------------------
// 14. Dynamic Age- & Gender-Stratified Reference Ranges
// --------------------------------------------------------------------------
export function getAgeGenderReferenceRange(
  testCode: string,
  age?: number,
  gender?: Gender
): ReferenceRange | null {
  const code = (testCode || '').toUpperCase().trim();
  const isFemale = isFemaleGender(gender);
  const isPediatric = typeof age === 'number' && age < 12;

  switch (code) {
    case 'CREAT':
    case 'CREATININE':
      if (isPediatric) return { min: 0.3, max: 0.7, unit: 'mg/dL', category: 'Pediatric (<12y)' };
      if (isFemale) return { min: 0.5, max: 1.0, unit: 'mg/dL', category: 'Adult Female' };
      return { min: 0.7, max: 1.3, unit: 'mg/dL', category: 'Adult Male' };

    case 'HGB':
    case 'HB':
    case 'CBC_HGB':
      if (isPediatric) return { min: 11.0, max: 14.5, unit: 'g/dL', category: 'Pediatric' };
      if (isFemale) return { min: 12.0, max: 15.5, unit: 'g/dL', category: 'Adult Female' };
      return { min: 13.5, max: 17.5, unit: 'g/dL', category: 'Adult Male' };

    case 'RBC':
    case 'CBC_RBC':
      if (isPediatric) return { min: 4.0, max: 5.2, unit: '10^6/uL', category: 'Pediatric' };
      if (isFemale) return { min: 4.0, max: 5.2, unit: '10^6/uL', category: 'Adult Female' };
      return { min: 4.5, max: 5.9, unit: '10^6/uL', category: 'Adult Male' };

    case 'HCT':
    case 'PCV':
      if (isFemale) return { min: 36.0, max: 48.0, unit: '%', category: 'Adult Female' };
      return { min: 40.0, max: 52.0, unit: '%', category: 'Adult Male' };

    case 'FERRITIN':
      if (isFemale) return { min: 10, max: 150, unit: 'ng/mL', category: 'Adult Female' };
      return { min: 30, max: 400, unit: 'ng/mL', category: 'Adult Male' };

    case 'URIC_ACID':
    case 'UA':
      if (isFemale) return { min: 2.4, max: 6.0, unit: 'mg/dL', category: 'Adult Female' };
      return { min: 3.4, max: 7.0, unit: 'mg/dL', category: 'Adult Male' };

    case 'AST':
    case 'GOT':
    case 'SGOT':
      if (isFemale) return { min: 5, max: 32, unit: 'U/L', category: 'Adult Female' };
      return { min: 5, max: 40, unit: 'U/L', category: 'Adult Male' };

    case 'ALT':
    case 'GPT':
    case 'SGPT':
      if (isFemale) return { min: 5, max: 33, unit: 'U/L', category: 'Adult Female' };
      return { min: 5, max: 45, unit: 'U/L', category: 'Adult Male' };

    case 'FBS':
    case 'GLUCOSE':
      return { min: 70, max: 110, unit: 'mg/dL' };

    case 'POTASSIUM':
    case 'K':
      return { min: 3.5, max: 5.1, unit: 'mmol/L' };

    case 'SODIUM':
    case 'NA':
      return { min: 135, max: 145, unit: 'mmol/L' };

    case 'CALCIUM':
    case 'CA':
      return { min: 8.5, max: 10.5, unit: 'mg/dL' };

    case 'PLT':
    case 'CBC_PLT':
    case 'PLATELETS':
      return { min: 150, max: 450, unit: '10^3/uL' };

    case 'WBC':
    case 'CBC_WBC':
      return { min: 4.0, max: 10.0, unit: '10^3/uL' };

    case 'TSB':
    case 'TOTAL_BILIRUBIN':
      return { min: 0.2, max: 1.2, unit: 'mg/dL' };

    case 'TOTAL_PROTEIN':
    case 'TP':
      return { min: 6.0, max: 8.3, unit: 'g/dL' };

    case 'ALBUMIN':
    case 'ALB':
      return { min: 3.5, max: 5.0, unit: 'g/dL' };

    default:
      return null;
  }
}

// --------------------------------------------------------------------------
// 15. 3-Tier Alert System (NORMAL, ABNORMAL, CRITICAL PANIC)
// --------------------------------------------------------------------------
export function evaluatePanicFlag(
  analyte: string,
  value: number,
  age?: number,
  gender?: Gender
): PanicEvaluationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return { isPanic: false, isAbnormal: false, badgeLevel: 'NORMAL' };
  }

  const code = (analyte || '').toUpperCase().trim();

  const limits: Record<
    string,
    { minRef: number; maxRef: number; minPanic: number; maxPanic: number; unit: string }
  > = {
    FBS: { minRef: 70, maxRef: 110, minPanic: 45, maxPanic: 450, unit: 'mg/dL' },
    GLUCOSE: { minRef: 70, maxRef: 110, minPanic: 45, maxPanic: 450, unit: 'mg/dL' },
    POTASSIUM: { minRef: 3.5, maxRef: 5.1, minPanic: 2.8, maxPanic: 6.2, unit: 'mmol/L' },
    K: { minRef: 3.5, maxRef: 5.1, minPanic: 2.8, maxPanic: 6.2, unit: 'mmol/L' },
    SODIUM: { minRef: 135, maxRef: 145, minPanic: 120, maxPanic: 160, unit: 'mmol/L' },
    NA: { minRef: 135, maxRef: 145, minPanic: 120, maxPanic: 160, unit: 'mmol/L' },
    CALCIUM: { minRef: 8.5, maxRef: 10.5, minPanic: 6.5, maxPanic: 13.0, unit: 'mg/dL' },
    CA: { minRef: 8.5, maxRef: 10.5, minPanic: 6.5, maxPanic: 13.0, unit: 'mg/dL' },
    HGB: { minRef: 12.0, maxRef: 17.5, minPanic: 6.0, maxPanic: 20.0, unit: 'g/dL' },
    HB: { minRef: 12.0, maxRef: 17.5, minPanic: 6.0, maxPanic: 20.0, unit: 'g/dL' },
    CBC_HGB: { minRef: 12.0, maxRef: 17.5, minPanic: 6.0, maxPanic: 20.0, unit: 'g/dL' },
    PLT: { minRef: 150, maxRef: 450, minPanic: 20, maxPanic: 1000, unit: '10^3/uL' },
    CBC_PLT: { minRef: 150, maxRef: 450, minPanic: 20, maxPanic: 1000, unit: '10^3/uL' },
    PLATELETS: { minRef: 150, maxRef: 450, minPanic: 20, maxPanic: 1000, unit: '10^3/uL' },
    WBC: { minRef: 4.0, maxRef: 10.0, minPanic: 2.0, maxPanic: 30.0, unit: '10^3/uL' },
    CBC_WBC: { minRef: 4.0, maxRef: 10.0, minPanic: 2.0, maxPanic: 30.0, unit: '10^3/uL' },
    CREATININE: { minRef: 0.6, maxRef: 1.2, minPanic: 0.1, maxPanic: 5.0, unit: 'mg/dL' },
    CREAT: { minRef: 0.6, maxRef: 1.2, minPanic: 0.1, maxPanic: 5.0, unit: 'mg/dL' },
    TOTAL_BILIRUBIN: { minRef: 0.2, maxRef: 1.2, minPanic: 0.0, maxPanic: 12.0, unit: 'mg/dL' },
    TSB: { minRef: 0.2, maxRef: 1.2, minPanic: 0.0, maxPanic: 12.0, unit: 'mg/dL' },
    CHLORIDE: { minRef: 98, maxRef: 107, minPanic: 80, maxPanic: 125, unit: 'mmol/L' },
    CL: { minRef: 98, maxRef: 107, minPanic: 80, maxPanic: 125, unit: 'mmol/L' },
    BICARBONATE: { minRef: 22, maxRef: 29, minPanic: 10, maxPanic: 40, unit: 'mmol/L' },
    HCO3: { minRef: 22, maxRef: 29, minPanic: 10, maxPanic: 40, unit: 'mmol/L' },
    MAGNESIUM: { minRef: 1.7, maxRef: 2.4, minPanic: 1.0, maxPanic: 4.5, unit: 'mg/dL' },
    MG: { minRef: 1.7, maxRef: 2.4, minPanic: 1.0, maxPanic: 4.5, unit: 'mg/dL' },
    PHOSPHORUS: { minRef: 2.5, maxRef: 4.5, minPanic: 1.0, maxPanic: 8.0, unit: 'mg/dL' },
    PHOS: { minRef: 2.5, maxRef: 4.5, minPanic: 1.0, maxPanic: 8.0, unit: 'mg/dL' },
  };

  // Adjust normal range if dynamic reference range is available
  const dynamicRef = getAgeGenderReferenceRange(code, age, gender);

  const lim = limits[code];
  if (!lim && !dynamicRef) {
    return { isPanic: false, isAbnormal: false, badgeLevel: 'NORMAL' };
  }

  const minRef = dynamicRef ? dynamicRef.min : lim!.minRef;
  const maxRef = dynamicRef ? dynamicRef.max : lim!.maxRef;
  const minPanic = lim ? lim.minPanic : -Infinity;
  const maxPanic = lim ? lim.maxPanic : Infinity;
  const unit = dynamicRef?.unit || lim?.unit || '';

  if (value < minPanic || value > maxPanic) {
    return {
      isPanic: true,
      isAbnormal: true,
      badgeLevel: 'CRITICAL_PANIC',
      panicReason: `CRITICAL PANIC: Value ${value} ${unit} is outside safe critical limits (${minPanic} - ${maxPanic} ${unit})`,
    };
  }

  if (value < minRef || value > maxRef) {
    return {
      isPanic: false,
      isAbnormal: true,
      badgeLevel: 'ABNORMAL',
    };
  }

  return {
    isPanic: false,
    isAbnormal: false,
    badgeLevel: 'NORMAL',
  };
}

// --------------------------------------------------------------------------
// 16. Comprehensive Batch Calculator
// --------------------------------------------------------------------------
export function calculateAll(inputs: CalculationInputs): CalculationResults {
  const results: CalculationResults = {};

  // eGFR
  if (inputs.creatinine !== undefined && inputs.age !== undefined && inputs.gender) {
    results.egfr = calculateEgfr(inputs.creatinine, inputs.age, inputs.gender);
  }

  // Lipid Panel
  if (
    inputs.totalCholesterol !== undefined &&
    inputs.hdl !== undefined &&
    inputs.triglycerides !== undefined
  ) {
    results.ldl = calculateLdl(inputs.totalCholesterol, inputs.hdl, inputs.triglycerides);
    results.vldl = calculateVldl(inputs.triglycerides);
    results.nonHdl = calculateNonHdl(inputs.totalCholesterol, inputs.hdl);
    results.cardiacRiskRatio = calculateCardiacRisk(inputs.totalCholesterol, inputs.hdl);
  } else if (inputs.totalCholesterol !== undefined && inputs.hdl !== undefined) {
    results.nonHdl = calculateNonHdl(inputs.totalCholesterol, inputs.hdl);
    results.cardiacRiskRatio = calculateCardiacRisk(inputs.totalCholesterol, inputs.hdl);
  } else if (inputs.triglycerides !== undefined) {
    results.vldl = calculateVldl(inputs.triglycerides);
  }

  // Bilirubin Fractions
  if (inputs.totalBilirubin !== undefined && inputs.directBilirubin !== undefined) {
    results.indirectBilirubin = calculateIndirectBilirubin(
      inputs.totalBilirubin,
      inputs.directBilirubin
    );
  }

  // Serum Anion Gap
  if (
    inputs.sodium !== undefined &&
    inputs.chloride !== undefined &&
    inputs.bicarbonate !== undefined
  ) {
    results.anionGap = calculateAnionGap(inputs.sodium, inputs.chloride, inputs.bicarbonate);
  }

  // Corrected Calcium
  if (inputs.calcium !== undefined && inputs.albumin !== undefined) {
    results.correctedCalcium = calculateCorrectedCalcium(inputs.calcium, inputs.albumin);
  }

  // A/G Ratio
  if (inputs.totalProtein !== undefined && inputs.albumin !== undefined) {
    results.agRatio = calculateAgRatio(inputs.totalProtein, inputs.albumin);
  }

  // De Ritis Ratio
  if (inputs.ast !== undefined && inputs.alt !== undefined) {
    results.deRitisRatio = calculateDeRitis(inputs.ast, inputs.alt);
  }

  // eAG from HbA1c
  if (inputs.hba1c !== undefined) {
    results.eag = calculateEag(inputs.hba1c);
  }

  // HOMA-IR
  if (inputs.fbs !== undefined && inputs.fastingInsulin !== undefined) {
    results.homaIr = calculateHomaIr(inputs.fbs, inputs.fastingInsulin);
  }

  // Mentzer Index
  if (inputs.mcv !== undefined && inputs.rbc !== undefined) {
    results.mentzerIndex = calculateMentzerIndex(inputs.mcv, inputs.rbc);
  }

  // CBC Auto-Indices
  if (inputs.rbc !== undefined && inputs.hgb !== undefined && inputs.hct !== undefined) {
    const indices = calculateCbcIndices(inputs.rbc, inputs.hgb, inputs.hct);
    results.calculatedMcv = indices.mcv;
    results.calculatedMch = indices.mch;
    results.calculatedMchc = indices.mchc;
  }

  // 5-Part Differential Sum
  if (
    inputs.neutrophils !== undefined &&
    inputs.lymphocytes !== undefined &&
    inputs.monocytes !== undefined &&
    inputs.eosinophils !== undefined &&
    inputs.basophils !== undefined
  ) {
    results.differentialValidation = validateDifferentialSum(
      inputs.neutrophils,
      inputs.lymphocytes,
      inputs.monocytes,
      inputs.eosinophils,
      inputs.basophils
    );
  }

  return results;
}
