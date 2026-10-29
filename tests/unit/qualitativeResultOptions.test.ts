import assert from 'node:assert';
import {
  getQualitativeTestKind,
  getQualitativeOptionsForTest,
  getQualitativeVisualTokens,
} from '../../apps/web/src/lib/qualitativeResultOptions';

console.log('🧪 Starting Qualitative Result Options & Clinical Tokens Unit Tests...');

// 1. Blood Group Tests (Phenotypic - Both Pos & Neg are normal)
{
  const aboTest = { id: 't-abo', code: 'ABO', name: 'ABO Blood Group', arabicName: 'فصيلة الدم ABO' };
  assert.strictEqual(getQualitativeTestKind(aboTest), 'blood_group');

  const rhTest = { id: 't-rh', code: 'RH', name: 'Rh (D) Typing', arabicName: 'عامل ريسس Rh' };
  assert.strictEqual(getQualitativeTestKind(rhTest), 'blood_group');

  const bgTest = { id: 't-bg', code: 'BG', name: 'Blood Group & Rh Factor' };
  assert.strictEqual(getQualitativeTestKind(bgTest), 'blood_group');

  const tokensOPos = getQualitativeVisualTokens('O Positive (O+)', 'blood_group');
  assert.strictEqual(tokensOPos.isAbnormal, false);
  assert.strictEqual(tokensOPos.color, 'var(--text-main)');
  assert.strictEqual(tokensOPos.borderColor, 'var(--border-color)');

  const tokensANeg = getQualitativeVisualTokens('A Negative (A-)', 'blood_group');
  assert.strictEqual(tokensANeg.isAbnormal, false);
  assert.strictEqual(tokensANeg.color, 'var(--text-main)');

  const opts = getQualitativeOptionsForTest(bgTest);
  assert.ok(Array.isArray(opts) && opts.includes('O Positive (O+)'));

  console.log('✅ 1. Blood Group & Rh phenotype classification passed.');
}

// 2. Pregnancy Tests (Physiological status - Not pathology/disease)
{
  const pregTest = { id: 't-hcg-u', code: 'HCG-U', name: 'Pregnancy Test (Urine hCG)', arabicName: 'فحص الحمل في البول' };
  assert.strictEqual(getQualitativeTestKind(pregTest), 'pregnancy');

  const tokensPos = getQualitativeVisualTokens('Positive', 'pregnancy');
  assert.strictEqual(tokensPos.isAbnormal, false);
  assert.notStrictEqual(tokensPos.color, '#ef4444'); // NEVER alarm red!
  assert.ok(tokensPos.statusLabel?.includes('حامل'));

  const tokensNeg = getQualitativeVisualTokens('Negative', 'pregnancy');
  assert.strictEqual(tokensNeg.isAbnormal, false);
  assert.notStrictEqual(tokensNeg.color, '#ef4444');
  assert.ok(tokensNeg.statusLabel?.includes('غير حامل'));

  const pregOpts = getQualitativeOptionsForTest(pregTest);
  assert.ok(Array.isArray(pregOpts) && pregOpts.includes('Positive') && pregOpts.includes('Negative'));

  console.log('✅ 2. Pregnancy physiological state classification passed.');
}

// 3. Immunity / Protective Antibody Tests (Positive = Protected/Immune)
{
  const hbsabTest = { id: 't-hbsab', code: 'HBSAB', name: 'Anti-HBs (Total)', arabicName: 'الأضداد السطحية لالتهاب الكبد B' };
  assert.strictEqual(getQualitativeTestKind(hbsabTest), 'immunity');

  const rubTest = { id: 't-rubigg', code: 'RUBIGG', name: 'Rubella IgG', arabicName: 'الحصبة الألمانية IgG' };
  assert.strictEqual(getQualitativeTestKind(rubTest), 'immunity');

  const tokensImmune = getQualitativeVisualTokens('Positive', 'immunity');
  assert.strictEqual(tokensImmune.isAbnormal, false);
  assert.strictEqual(tokensImmune.color, '#10b981'); // Green = Immune!
  assert.ok(tokensImmune.statusLabel?.includes('محصن'));

  const tokensNonImmune = getQualitativeVisualTokens('Negative', 'immunity');
  assert.strictEqual(tokensNonImmune.isAbnormal, false);
  assert.strictEqual(tokensNonImmune.color, '#d97706'); // Warning amber = Non-immune
  assert.ok(tokensNonImmune.statusLabel?.includes('غير محصن'));

  console.log('✅ 3. Immunity & protective antibody classification passed.');
}

// 4. Infectious & Pathological Screening (Negative = Normal, Positive = Infection alert)
{
  const hbsagTest = { id: 't-hbsag', code: 'HBSAG', name: 'Hepatitis B Surface Antigen (HBsAg)' };
  assert.strictEqual(getQualitativeTestKind(hbsagTest), 'infectious_screen');

  const tokensInfected = getQualitativeVisualTokens('Positive', 'infectious_screen');
  assert.strictEqual(tokensInfected.isAbnormal, true);
  assert.strictEqual(tokensInfected.color, '#ef4444'); // Red alert for hepatitis!

  const tokensHealthy = getQualitativeVisualTokens('Negative', 'infectious_screen');
  assert.strictEqual(tokensHealthy.isAbnormal, false);
  assert.strictEqual(tokensHealthy.color, '#10b981'); // Green for negative hepatitis!

  console.log('✅ 4. Infectious & pathological screening passed.');
}

console.log('🎉 ALL Qualitative Result Options & Tokens Unit Tests PASSED Successfully!\n');
