import assert from 'assert';
import {
  normalizeAgeToBirthDate,
  computeAgeBreakdown,
  formatClinicalAge,
  isAgeWithinRange,
} from '../../packages/domain/src/ageUtils';

console.log('🧪 [Unit Test] Testing Age Normalization, Formatting & Boundaries...');

const mockRefDate = new Date('2026-10-01T12:00:00Z');

// 1. Normalization Tests
{
  // 40 days
  const res40Days = normalizeAgeToBirthDate({ days: 40 }, mockRefDate);
  assert.strictEqual(res40Days.birthDateEstimated, true, '40 days should have estimated flag');
  const breakdown40 = computeAgeBreakdown(res40Days.birthDate, mockRefDate);
  assert.strictEqual(breakdown40.totalDays, 40, 'Should normalize to exactly 40 days');

  // 14 months
  const res14Months = normalizeAgeToBirthDate({ months: 14 }, mockRefDate);
  assert.strictEqual(res14Months.birthDateEstimated, true, '14 months should have estimated flag');
  const breakdown14 = computeAgeBreakdown(res14Months.birthDate, mockRefDate);
  assert.strictEqual(breakdown14.totalMonths, 14, 'Should normalize to 14 months');

  // Exact DOB
  const resDob = normalizeAgeToBirthDate({ birthDate: '2020-05-15' }, mockRefDate);
  assert.strictEqual(resDob.birthDateEstimated, false, 'Exact DOB should not be estimated');
  assert.strictEqual(resDob.legacyAgeYears, 6, 'Legacy age should match 6 years');
  console.log('  ✓ Normalization tests passed.');
}

// 2. Display Formatting Tests (Clinical Convention)
{
  // < 1 month -> "12 D"
  const b12D = new Date('2026-09-19T12:00:00Z');
  const fmt12D = formatClinicalAge({ birthDate: b12D }, mockRefDate);
  assert.strictEqual(fmt12D, '12 D', `< 1 month should display "12 D", got "${fmt12D}"`);

  // < 2 years -> "5 M"
  const b5M = new Date('2026-05-01T12:00:00Z');
  const fmt5M = formatClinicalAge({ birthDate: b5M }, mockRefDate);
  assert.strictEqual(fmt5M, '5 M', `< 2 years should display "5 M", got "${fmt5M}"`);

  // < 18 years -> "3 Y 2 M"
  const b3Y2M = new Date('2023-08-01T12:00:00Z');
  const fmt3Y2M = formatClinicalAge({ birthDate: b3Y2M }, mockRefDate);
  assert.strictEqual(fmt3Y2M, '3 Y 2 M', `< 18 years should display "3 Y 2 M", got "${fmt3Y2M}"`);

  // Adults -> "45 Y"
  const b45Y = new Date('1981-10-01T12:00:00Z');
  const fmt45Y = formatClinicalAge({ birthDate: b45Y }, mockRefDate);
  assert.strictEqual(fmt45Y, '45 Y', `Adult should display "45 Y", got "${fmt45Y}"`);

  // Legacy patient (no birthDate, only stored age)
  const legacyPatient = { age: 52, birthDate: null };
  const fmtLegacy = formatClinicalAge(legacyPatient, mockRefDate);
  assert.strictEqual(fmtLegacy, '52 Y', `Legacy patient should preserve stored age "52 Y", got "${fmtLegacy}"`);

  console.log('  ✓ Display formatting tests passed.');
}

// 3. Boundary Range Selection Tests (28 days, 12 months, 18 years)
{
  const newbornRange = { ageMin: 0, ageMax: 28, ageUnit: 'days' };
  const infantRange = { ageMin: 29, ageMax: 365, ageUnit: 'days' };
  const pediatricRange = { ageMin: 1, ageMax: 17, ageUnit: 'years' };
  const adultRange = { ageMin: 18, ageMax: null, ageUnit: 'years' };

  // 28 Days Boundary
  const day28Birth = new Date(mockRefDate.getTime() - 28 * 24 * 3600 * 1000);
  const day29Birth = new Date(mockRefDate.getTime() - 29 * 24 * 3600 * 1000);

  assert.strictEqual(isAgeWithinRange(newbornRange, { birthDate: day28Birth }, mockRefDate), true, 'Day 28 must match newborn range');
  assert.strictEqual(isAgeWithinRange(newbornRange, { birthDate: day29Birth }, mockRefDate), false, 'Day 29 must NOT match newborn range');
  assert.strictEqual(isAgeWithinRange(infantRange, { birthDate: day29Birth }, mockRefDate), true, 'Day 29 must match infant range');

  // 12 Months Boundary
  const month12Range = { ageMin: 0, ageMax: 12, ageUnit: 'months' };
  const month13Range = { ageMin: 13, ageMax: 24, ageUnit: 'months' };

  const baby12MBirth = normalizeAgeToBirthDate({ months: 12 }, mockRefDate).birthDate;
  const baby13MBirth = normalizeAgeToBirthDate({ months: 13 }, mockRefDate).birthDate;

  assert.strictEqual(isAgeWithinRange(month12Range, { birthDate: baby12MBirth }, mockRefDate), true, '12 months must match [0, 12] range');
  assert.strictEqual(isAgeWithinRange(month12Range, { birthDate: baby13MBirth }, mockRefDate), false, '13 months must NOT match [0, 12] range');
  assert.strictEqual(isAgeWithinRange(month13Range, { birthDate: baby13MBirth }, mockRefDate), true, '13 months must match [13, 24] range');

  // 18 Years Boundary
  const teenBirth = normalizeAgeToBirthDate({ years: 17, months: 11 }, mockRefDate).birthDate;
  const adult18Birth = normalizeAgeToBirthDate({ years: 18 }, mockRefDate).birthDate;

  assert.strictEqual(isAgeWithinRange(pediatricRange, { birthDate: teenBirth }, mockRefDate), true, '17y 11m must match pediatric range');
  assert.strictEqual(isAgeWithinRange(adultRange, { birthDate: teenBirth }, mockRefDate), false, '17y 11m must NOT match adult range');
  assert.strictEqual(isAgeWithinRange(adultRange, { birthDate: adult18Birth }, mockRefDate), true, '18y must match adult range');

  console.log('  ✓ Boundary range tests passed.');
}

console.log('✅ All age normalization, formatting, and boundary tests passed!');
