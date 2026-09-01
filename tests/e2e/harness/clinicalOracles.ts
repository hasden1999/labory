/**
 * Labryo Clinical LIS - Authoritative Reference Oracles & Standards
 * Grounded in Clinical Laboratory Standards (IFCC, CLSI, KDIGO, ADA, WHO)
 */

export interface OracleCalcInputs {
  age?: number;
  gender?: 'MALE' | 'FEMALE';
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
}

export interface OracleCalcOutputs {
  egfr?: { value: number; stage: string; note: string };
  ldl?: { value: number | null; invalidReason?: string };
  vldl?: { value: number | null };
  nonHdl?: { value: number };
  cardiacRiskRatio?: { value: number };
  indirectBilirubin?: { value: number | null; invalidReason?: string };
  anionGap?: { value: number; interpretation: string };
  correctedCalcium?: { value: number };
  agRatio?: { value: number | null };
  deRitisRatio?: { value: number; interpretation: string };
  eag?: { value: number };
  homaIr?: { value: number; interpretation: string };
  mentzerIndex?: { value: number; interpretation: string };
  calculatedMcv?: number;
  calculatedMch?: number;
  calculatedMchc?: number;
}

export class ClinicalOracles {
  /**
   * 2021 CKD-EPI Creatinine Equation (Race-Free)
   * Ref: Inker LA et al. NEJM 2021; 385:1737-1749.
   * eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^(-1.200) * 0.9938^Age * (1.012 if female)
   */
  static calculateEgfr(scr: number, age: number, gender: 'MALE' | 'FEMALE'): { value: number; stage: string; note: string } {
    const isFemale = gender === 'FEMALE';
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

  /**
   * Friedewald Equation for LDL-C & Invalidation Rule
   * LDL = Total Chol - HDL - (TG / 5)
   * Invalidation: TG >= 400 mg/dL (chylomicronemia invalidates assumption of fixed VLDL/TG ratio)
   */
  static calculateLdl(tc: number, hdl: number, tg: number): { value: number | null; invalidReason?: string } {
    if (tg >= 400) {
      return {
        value: null,
        invalidReason: 'Triglycerides >= 400 mg/dL (chylomicronemia invalidates Friedewald equation; direct LDL measurement required)'
      };
    }
    const ldl = tc - hdl - (tg / 5);
    return { value: Math.round(ldl * 10) / 10 };
  }

  static calculateVldl(tg: number): { value: number | null } {
    return { value: Math.round((tg / 5) * 10) / 10 };
  }

  static calculateNonHdl(tc: number, hdl: number): { value: number } {
    return { value: Math.round((tc - hdl) * 10) / 10 };
  }

  static calculateCardiacRisk(tc: number, hdl: number): { value: number } {
    if (hdl <= 0) return { value: 0 };
    return { value: Math.round((tc / hdl) * 100) / 100 };
  }

  /**
   * Bilirubin fractions & Direct > Total validation
   */
  static calculateIndirectBilirubin(tb: number, db: number): { value: number | null; invalidReason?: string } {
    if (db > tb) {
      return {
        value: null,
        invalidReason: 'Direct Bilirubin cannot exceed Total Bilirubin'
      };
    }
    return { value: Math.round((tb - db) * 100) / 100 };
  }

  /**
   * Serum Anion Gap = Na - (Cl + HCO3)
   */
  static calculateAnionGap(na: number, cl: number, hco3: number): { value: number; interpretation: string } {
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

  /**
   * Corrected Calcium for Albumin: Corrected Ca = Serum Ca + 0.8 * (4.0 - Albumin)
   */
  static calculateCorrectedCalcium(ca: number, alb: number): { value: number } {
    const corrected = ca + 0.8 * (4.0 - alb);
    return { value: Math.round(corrected * 100) / 100 };
  }

  /**
   * A/G Ratio: Albumin / (Total Protein - Albumin)
   */
  static calculateAgRatio(tp: number, alb: number): { value: number | null } {
    const globulin = tp - alb;
    if (globulin <= 0) return { value: null };
    return { value: Math.round((alb / globulin) * 100) / 100 };
  }

  /**
   * De Ritis Ratio: AST / ALT
   */
  static calculateDeRitis(ast: number, alt: number): { value: number; interpretation: string } {
    if (alt <= 0) return { value: 0, interpretation: 'Indeterminate' };
    const ratio = Math.round((ast / alt) * 100) / 100;
    let interpretation = 'Normal / Low (< 1.0)';
    if (ratio >= 2.0) {
      interpretation = 'Significantly Elevated (>= 2.0, suggestive of alcoholic hepatitis or toxic necrosis)';
    } else if (ratio >= 1.0) {
      interpretation = 'Elevated (>= 1.0, suggestive of cirrhosis, chronic hepatitis, or myocardial damage)';
    }
    return { value: ratio, interpretation };
  }

  /**
   * Estimated Average Glucose (eAG) from HbA1c: eAG = 28.7 * HbA1c - 46.7
   */
  static calculateEag(hba1c: number): { value: number } {
    const eag = 28.7 * hba1c - 46.7;
    return { value: Math.round(eag) };
  }

  /**
   * HOMA-IR: (Fasting Glucose mg/dL * Fasting Insulin uIU/mL) / 405
   */
  static calculateHomaIr(fbs: number, insulin: number): { value: number; interpretation: string } {
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

  /**
   * Mentzer Index: MCV / RBC
   * < 13: suggests Beta-Thalassemia Trait
   * > 13: suggests Iron Deficiency Anemia
   */
  static calculateMentzerIndex(mcv: number, rbc: number): { value: number; interpretation: string } {
    if (rbc <= 0) return { value: 0, interpretation: 'Indeterminate' };
    const index = Math.round((mcv / rbc) * 10) / 10;
    const interpretation = index < 13
      ? 'Suggests Beta-Thalassemia Trait (< 13)'
      : 'Suggests Iron Deficiency Anemia (>= 13)';
    return { value: index, interpretation };
  }

  /**
   * CBC Red Cell Indices
   */
  static calculateCbcIndices(rbc: number, hgb: number, hct: number) {
    if (rbc <= 0 || hct <= 0) return {};
    const mcv = Math.round(((hct * 10) / rbc) * 10) / 10;
    const mch = Math.round(((hgb * 10) / rbc) * 10) / 10;
    const mchc = Math.round(((hgb * 100) / hct) * 10) / 10;
    return { mcv, mch, mchc };
  }

  /**
   * 5-Part Differential Sum Validator
   */
  static validateDifferentialSum(neut: number, lymph: number, mono: number, eos: number, baso: number): {
    sum: number;
    isValid: boolean;
    error?: string;
  } {
    const sum = Math.round((neut + lymph + mono + eos + baso) * 10) / 10;
    const isValid = Math.abs(sum - 100.0) < 0.1;
    return {
      sum,
      isValid,
      error: isValid ? undefined : `Differential sum must equal 100% (currently ${sum}%)`
    };
  }

  /**
   * Historical Delta Check Comparator
   */
  static evaluateDeltaCheck(
    analyte: string,
    currentVal: number,
    previousVal: number,
    previousDate?: string
  ): {
    hasPrevious: boolean;
    previousValue: number;
    currentValue: number;
    deltaPercent: number;
    isBreached: boolean;
    thresholdPercent: number;
    badgeLevel: 'NORMAL' | 'SIGNIFICANT' | 'CRITICAL';
    message: string;
  } {
    const delta = Math.abs(currentVal - previousVal);
    const deltaPercent = Math.round((delta / previousVal) * 1000) / 10;

    // Standard LIS Delta Check Thresholds
    const thresholds: Record<string, { threshold: number; criticalThreshold: number }> = {
      HGB: { threshold: 20, criticalThreshold: 35 },
      CBC_HGB: { threshold: 20, criticalThreshold: 35 },
      PLT: { threshold: 50, criticalThreshold: 75 },
      CBC_PLT: { threshold: 50, criticalThreshold: 75 },
      CREATININE: { threshold: 50, criticalThreshold: 100 },
      K: { threshold: 25, criticalThreshold: 40 },
      POTASSIUM: { threshold: 25, criticalThreshold: 40 },
      WBC: { threshold: 50, criticalThreshold: 100 },
      FBS: { threshold: 50, criticalThreshold: 100 },
      SODIUM: { threshold: 10, criticalThreshold: 15 },
    };

    const config = thresholds[analyte.toUpperCase()] || { threshold: 50, criticalThreshold: 80 };
    const isCritical = deltaPercent >= config.criticalThreshold;
    const isSignificant = deltaPercent >= config.threshold;
    const isBreached = isSignificant;

    let badgeLevel: 'NORMAL' | 'SIGNIFICANT' | 'CRITICAL' = 'NORMAL';
    if (isCritical) badgeLevel = 'CRITICAL';
    else if (isSignificant) badgeLevel = 'SIGNIFICANT';

    const direction = currentVal > previousVal ? 'increased' : 'decreased';
    const message = isBreached
      ? `Delta Alert: ${analyte} ${direction} by ${deltaPercent}% (prior: ${previousVal}, current: ${currentVal})`
      : `Delta Normal: ${analyte} change of ${deltaPercent}% is within safe limit (${config.threshold}%)`;

    return {
      hasPrevious: true,
      previousValue: previousVal,
      currentValue: currentVal,
      deltaPercent,
      isBreached,
      thresholdPercent: config.threshold,
      badgeLevel,
      message
    };
  }

  /**
   * Critical / Panic Value Alerts
   */
  static evaluatePanicFlag(analyte: string, value: number): {
    isPanic: boolean;
    isAbnormal: boolean;
    badgeLevel: 'NORMAL' | 'ABNORMAL' | 'CRITICAL_PANIC';
    panicReason?: string;
  } {
    const limits: Record<string, { minRef: number; maxRef: number; minPanic: number; maxPanic: number; unit: string }> = {
      FBS: { minRef: 70, maxRef: 110, minPanic: 45, maxPanic: 450, unit: 'mg/dL' },
      GLUCOSE: { minRef: 70, maxRef: 110, minPanic: 45, maxPanic: 450, unit: 'mg/dL' },
      POTASSIUM: { minRef: 3.5, maxRef: 5.1, minPanic: 2.8, maxPanic: 6.2, unit: 'mmol/L' },
      K: { minRef: 3.5, maxRef: 5.1, minPanic: 2.8, maxPanic: 6.2, unit: 'mmol/L' },
      SODIUM: { minRef: 135, maxRef: 145, minPanic: 120, maxPanic: 160, unit: 'mmol/L' },
      NA: { minRef: 135, maxRef: 145, minPanic: 120, maxPanic: 160, unit: 'mmol/L' },
      CALCIUM: { minRef: 8.5, maxRef: 10.5, minPanic: 6.5, maxPanic: 13.0, unit: 'mg/dL' },
      CA: { minRef: 8.5, maxRef: 10.5, minPanic: 6.5, maxPanic: 13.0, unit: 'mg/dL' },
      HGB: { minRef: 12.0, maxRef: 17.5, minPanic: 6.0, maxPanic: 20.0, unit: 'g/dL' },
      PLT: { minRef: 150, maxRef: 450, minPanic: 20, maxPanic: 1000, unit: '10^3/uL' },
      CREATININE: { minRef: 0.6, maxRef: 1.2, minPanic: 0.1, maxPanic: 5.0, unit: 'mg/dL' },
      TOTAL_BILIRUBIN: { minRef: 0.2, maxRef: 1.2, minPanic: 0.0, maxPanic: 12.0, unit: 'mg/dL' },
    };

    const lim = limits[analyte.toUpperCase()];
    if (!lim) {
      return { isPanic: false, isAbnormal: false, badgeLevel: 'NORMAL' };
    }

    if (value < lim.minPanic || value > lim.maxPanic) {
      return {
        isPanic: true,
        isAbnormal: true,
        badgeLevel: 'CRITICAL_PANIC',
        panicReason: `CRITICAL PANIC: Value ${value} ${lim.unit} is outside safe critical limits (${lim.minPanic} - ${lim.maxPanic} ${lim.unit})`
      };
    }

    if (value < lim.minRef || value > lim.maxRef) {
      return {
        isPanic: false,
        isAbnormal: true,
        badgeLevel: 'ABNORMAL'
      };
    }

    return {
      isPanic: false,
      isAbnormal: false,
      badgeLevel: 'NORMAL'
    };
  }
}
