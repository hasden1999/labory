/**
 * @lab-manager/domain - Age Utilities & Normalization
 * Clinical age calculations, multi-unit input normalization,
 * boundary matching for neonatal/pediatric reference ranges,
 * and clinical convention display formatting.
 */

export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
  totalYears: number;
}

export interface AgeInput {
  years?: number | string | null;
  months?: number | string | null;
  days?: number | string | null;
  birthDate?: string | Date | null;
}

export interface NormalizedBirthDateResult {
  birthDate: Date;
  birthDateEstimated: boolean;
  legacyAgeYears: number;
}

/**
 * Normalizes user age input (either exact DOB or combination of Years/Months/Days)
 * into a standardized birthDate and estimated flag.
 * Handles inputs like "40 days", "14 months", "2 years 3 months".
 */
export function normalizeAgeToBirthDate(
  input: AgeInput,
  referenceDate: Date = new Date()
): NormalizedBirthDateResult {
  // If exact birthDate is provided (e.g. from DOB picker)
  if (input.birthDate) {
    const parsed = new Date(input.birthDate);
    if (!isNaN(parsed.getTime())) {
      const breakdown = computeAgeBreakdown(parsed, referenceDate);
      return {
        birthDate: parsed,
        birthDateEstimated: false,
        legacyAgeYears: breakdown.years,
      };
    }
  }

  // Parse years, months, days
  const y = Math.max(0, parseInt(String(input.years || 0), 10) || 0);
  const m = Math.max(0, parseInt(String(input.months || 0), 10) || 0);
  const d = Math.max(0, parseInt(String(input.days || 0), 10) || 0);

  const ref = new Date(referenceDate);
  const calculatedBirthDate = new Date(ref);

  // Subtract years, months, days in order
  calculatedBirthDate.setFullYear(calculatedBirthDate.getFullYear() - y);
  calculatedBirthDate.setMonth(calculatedBirthDate.getMonth() - m);
  calculatedBirthDate.setDate(calculatedBirthDate.getDate() - d);

  // Determine legacy age in integer years
  const breakdown = computeAgeBreakdown(calculatedBirthDate, ref);
  const legacyAgeYears = breakdown.years;

  return {
    birthDate: calculatedBirthDate,
    birthDateEstimated: true,
    legacyAgeYears,
  };
}

/**
 * Computes calendar and total age breakdown (years, months, days)
 * between a birthDate and target date (defaults to current time).
 */
export function computeAgeBreakdown(
  birthDate: string | Date,
  atDate: string | Date = new Date()
): AgeBreakdown {
  const b = new Date(birthDate);
  const t = new Date(atDate);

  if (isNaN(b.getTime()) || isNaN(t.getTime()) || t < b) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalMonths: 0,
      totalYears: 0,
    };
  }

  const diffMs = t.getTime() - b.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let years = t.getFullYear() - b.getFullYear();
  let months = t.getMonth() - b.getMonth();
  let days = t.getDate() - b.getDate();

  if (days < 0) {
    months -= 1;
    // Last day of previous month relative to target date
    const prevMonthLastDay = new Date(t.getFullYear(), t.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays: Math.max(0, totalDays),
    totalMonths: Math.max(0, totalMonths),
    totalYears: Math.max(0, years),
  };
}

/**
 * Formats patient age following clinical convention:
 * - < 1 month  -> "12 D"
 * - < 2 years  -> "5 M" (or "14 M")
 * - < 18 years -> "3 Y 2 M" (or "3 Y")
 * - adults     -> "45 Y"
 * - Legacy patients (no birthDate): exact stored age e.g. "45 Y"
 */
export function formatClinicalAge(
  patient?: {
    birthDate?: string | Date | null;
    age?: number | string | null;
    birthDateEstimated?: boolean | null;
  } | null,
  atDate: string | Date = new Date()
): string {
  if (!patient) return '-';

  // Legacy patient without birthDate: preserve stored age exactly
  if (!patient.birthDate) {
    if (patient.age !== undefined && patient.age !== null && String(patient.age).trim() !== '') {
      const clean = String(patient.age).trim();
      return clean.endsWith('Y') || clean.endsWith('y') ? clean.toUpperCase() : `${clean} Y`;
    }
    return '-';
  }

  const breakdown = computeAgeBreakdown(patient.birthDate, atDate);

  // < 1 month: show in days
  if (breakdown.totalMonths < 1) {
    return `${breakdown.days || breakdown.totalDays} D`;
  }

  // < 2 years (1 to 23 months): show in months
  if (breakdown.years < 2) {
    return `${breakdown.totalMonths} M`;
  }

  // < 18 years: show years and months (e.g. "3 Y 2 M")
  if (breakdown.years < 18) {
    return breakdown.months > 0 ? `${breakdown.years} Y ${breakdown.months} M` : `${breakdown.years} Y`;
  }

  // Adults: show years only (e.g. "45 Y")
  return `${breakdown.years} Y`;
}

/**
 * Checks whether a patient matches a reference range age boundary
 * with day-level precision for newborns/infants.
 */
export function isAgeWithinRange(
  range: { ageMin?: number | null; ageMax?: number | null; ageUnit?: string | null },
  patient: { birthDate?: string | Date | null; age?: number | string | null },
  atDate: string | Date = new Date()
): boolean {
  if (range.ageMin == null && range.ageMax == null) {
    return true;
  }

  const unit = (range.ageUnit || 'years').toLowerCase();

  // If patient has birthDate, compute exact age in the requested unit
  if (patient.birthDate) {
    const breakdown = computeAgeBreakdown(patient.birthDate, atDate);
    let patientVal: number;

    if (unit === 'days') {
      patientVal = breakdown.totalDays;
    } else if (unit === 'months') {
      patientVal = breakdown.totalMonths;
    } else {
      // years: if bounds are integers, compare completed calendar years (e.g. 17 years 11 months is 17 years old)
      // otherwise use continuous fractional years
      const hasFraction = (range.ageMin != null && !Number.isInteger(range.ageMin)) ||
                          (range.ageMax != null && !Number.isInteger(range.ageMax));
      patientVal = hasFraction
        ? breakdown.years + (breakdown.months / 12) + (breakdown.days / 365.25)
        : breakdown.years;
    }

    if (range.ageMin != null && patientVal < range.ageMin) return false;
    if (range.ageMax != null && patientVal > range.ageMax) return false;
    return true;
  }

  // Legacy patient with only age in years
  if (patient.age != null && patient.age !== '') {
    const legacyYears = parseFloat(String(patient.age));
    if (isNaN(legacyYears)) return true;

    let patientVal: number;
    if (unit === 'days') {
      patientVal = legacyYears * 365.25;
    } else if (unit === 'months') {
      patientVal = legacyYears * 12;
    } else {
      patientVal = legacyYears;
    }

    if (range.ageMin != null && patientVal < range.ageMin) return false;
    if (range.ageMax != null && patientVal > range.ageMax) return false;
    return true;
  }

  return true;
}
