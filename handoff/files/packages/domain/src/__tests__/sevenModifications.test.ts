import { describe, it, expect } from 'vitest';
import {
  formatClinicalAge,
  formatClinicalAgeArabic,
  normalizeAgeToBirthDate,
} from '../ageUtils';
import {
  classifyResultRange,
  formatRangeLineBidi,
  formatStructuredRangesText,
  matchPatientReferenceRange,
} from '../rangeClassification';

describe('Clinical Requirements Verification (7 Modifications)', () => {
  describe('Requirement 4: Patient Age Formatting in Months and Days', () => {
    it('formats infant age given in days only', () => {
      const formatted = formatClinicalAge({ age: 0, ageMonths: 0, ageDays: 14 });
      expect(formatted).toBe('14 Days');

      const arabic = formatClinicalAgeArabic({ age: 0, ageMonths: 0, ageDays: 14 });
      expect(arabic).toBe('14 يوم');
    });

    it('formats infant age given in months only', () => {
      const formatted = formatClinicalAge({ age: 0, ageMonths: 5, ageDays: 0 });
      expect(formatted).toBe('5 Months');

      const arabic = formatClinicalAgeArabic({ age: 0, ageMonths: 5, ageDays: 0 });
      expect(arabic).toBe('5 شهر');
    });

    it('formats infant age given in months and days', () => {
      const formatted = formatClinicalAge({ age: 0, ageMonths: 3, ageDays: 12 });
      expect(formatted).toBe('3M 12D');

      const arabic = formatClinicalAgeArabic({ age: 0, ageMonths: 3, ageDays: 12 });
      expect(arabic).toBe('3 شهر و 12 يوم');
    });

    it('formats toddler age given in years and months', () => {
      const formatted = formatClinicalAge({ age: 2, ageMonths: 4, ageDays: 0 });
      expect(formatted).toBe('2Y 4M');

      const arabic = formatClinicalAgeArabic({ age: 2, ageMonths: 4, ageDays: 0 });
      expect(arabic).toBe('2 سنة و 4 شهر');
    });

    it('formats child age over 5 years in years only', () => {
      const formatted = formatClinicalAge({ age: 7, ageMonths: 2, ageDays: 5 });
      expect(formatted).toBe('7 Years');

      const arabic = formatClinicalAgeArabic({ age: 7, ageMonths: 2, ageDays: 5 });
      expect(arabic).toBe('7 سنة');
    });

    it('normalizes age with months and days into estimated birthDate', () => {
      const now = new Date('2026-10-15T12:00:00Z');
      const normalized = normalizeAgeToBirthDate({ years: 0, months: 6, days: 10 }, now);
      expect(normalized.birthDate).toBeDefined();
      expect(normalized.birthDateEstimated).toBe(true);

      // Re-evaluating the estimated birthDate should give back approximately 6 months
      const formatted = formatClinicalAge({ birthDate: normalized.birthDate }, now);
      expect(formatted).toContain('6M');
    });
  });

  describe('Requirement 5: Custom Category Sensing & Bidi Isolation', () => {
    it('senses high value for a single custom labeled category (e.g. طبيعي: 70 - 140)', () => {
      const test = {
        name: 'Random Blood Sugar (RBS)',
        referenceRanges: [
          {
            id: 'r1',
            label: 'طبيعي',
            min: 70,
            max: 140,
            unit: 'mg/dL',
            sex: 'any',
          },
        ],
      };

      // Normal value
      const resNormal = classifyResultRange(100, test, { gender: 'MALE', age: 30 });
      expect(resNormal.status).toBe('NORMAL');
      expect(resNormal.matchedCategoryLabel).toBe('طبيعي');
      expect(resNormal.patientStateSummary).toBe('ضمن (طبيعي)');

      // High value (user screenshot scenario: RBS = 200 with range طبيعي 70 - 140)
      const resHigh = classifyResultRange(200, test, { gender: 'MALE', age: 30 });
      expect(resHigh.status).toBe('HIGH');
      expect(resHigh.matchedCategoryLabel).toBe('طبيعي');
      expect(resHigh.patientStateSummary).toBe('مرتفع عن (طبيعي)');

      // Low value
      const resLow = classifyResultRange(50, test, { gender: 'MALE', age: 30 });
      expect(resLow.status).toBe('LOW');
      expect(resLow.matchedCategoryLabel).toBe('طبيعي');
      expect(resLow.patientStateSummary).toBe('منخفض عن (طبيعي)');
    });

    it('senses specific diagnostic state brackets when multiple custom categories exist', () => {
      const test = {
        name: 'Fasting Blood Sugar (FBS)',
        referenceRanges: [
          { id: 'r1', label: 'طبيعي', min: 70, max: 99, sex: 'any' },
          { id: 'r2', label: 'ما قبل السكري', min: 100, max: 125, sex: 'any' },
          { id: 'r3', label: 'سكري', min: 126, max: 500, sex: 'any' },
        ],
      };

      // Value in prediabetes bracket
      const resPrediabetes = classifyResultRange(115, test, { gender: 'FEMALE', age: 45 });
      expect(resPrediabetes.status).toBe('HIGH');
      expect(resPrediabetes.matchedCategoryLabel).toBe('ما قبل السكري');
      expect(resPrediabetes.patientStateSummary).toBe('ما قبل السكري');

      // Value in diabetes bracket
      const resDiabetes = classifyResultRange(180, test, { gender: 'FEMALE', age: 45 });
      expect(resDiabetes.status).toBe('HIGH');
      expect(resDiabetes.matchedCategoryLabel).toBe('سكري');
      expect(resDiabetes.patientStateSummary).toBe('سكري');
    });

    it('parses legacy string range when user writes "طبيعي : 70 - 140" inside label or text', () => {
      const test = {
        name: 'Serum Uric Acid',
        referenceRanges: [
          { id: 'r1', label: 'طبيعي : 3.5 - 7.2', sex: 'any' },
        ],
      };

      const resHigh = classifyResultRange(9.0, test, { gender: 'MALE', age: 35 });
      expect(resHigh.status).toBe('HIGH');
      expect(resHigh.low).toBe(3.5);
      expect(resHigh.high).toBe(7.2);
    });

    it('protects Bidi directional ordering to prevent reversal like 140 - 70 : طبيعي', () => {
      const formatted = formatRangeLineBidi('طبيعي', '70 - 140');
      // Must contain Unicode Left-to-Right isolate \u206670 - 140\u2069
      expect(formatted).toContain('\u206670 - 140\u2069');
      expect(formatted).toBe('طبيعي: \u206670 - 140\u2069');
    });

    it('formats structured reference range with Bidi isolation', () => {
      const structured = [
        { label: 'طبيعي', min: 70, max: 140, text: '70 - 140' },
      ];
      const text = formatStructuredRangesText(structured);
      expect(text).toContain('\u206670 - 140\u2069');
    });
  });
});
