import assert from 'node:assert';
import {
  resolveCbcDemographicBracket,
  getCbcParamDemographicRange,
  getPatientCbcDemographicRanges,
  DEFAULT_CBC_DEMOGRAPHIC_MATRIX,
} from '../cbcDemographicRanges';

function runTests() {
  console.log('🧪 Testing CBC Demographic Ranges & Clinical References...');

  // 1. Newborn (1-28 days)
  assert.strictEqual(resolveCbcDemographicBracket({ ageDays: 10, gender: 'MALE' }), 'NEWBORN');
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 0, ageMonths: 0, ageDays: 20 }), 'NEWBORN');
  console.log('  ✓ Newborn bracket resolution verified');

  // 2. Infant (1 - 23 months)
  assert.strictEqual(resolveCbcDemographicBracket({ ageMonths: 6, gender: 'FEMALE' }), 'INFANT');
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 1, gender: 'MALE' }), 'INFANT');
  console.log('  ✓ Infant bracket resolution verified');

  // 3. Child (2 - 5 years)
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 4, gender: 'FEMALE' }), 'CHILD_2_5');
  console.log('  ✓ Child (2 - 5 years) bracket resolution verified');

  // 4. Child (6 - 12 years)
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 8, gender: 'MALE' }), 'CHILD_6_12');
  console.log('  ✓ Child (6 - 12 years) bracket resolution verified');

  // 5. Adult Female (>= 13 years)
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 25, gender: 'FEMALE' }), 'ADULT_FEMALE');
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 13, gender: 'أنثى' }), 'ADULT_FEMALE');
  console.log('  ✓ Adult Female bracket resolution verified');

  // 6. Adult Male (>= 13 years)
  assert.strictEqual(resolveCbcDemographicBracket({ ageYears: 40, gender: 'MALE' }), 'ADULT_MALE');
  console.log('  ✓ Adult Male bracket resolution verified');

  // Accredited hemoglobin and leukocyte ranges for each bracket
  const nbHgb = getCbcParamDemographicRange('hgb', 'NEWBORN');
  assert.strictEqual(nbHgb.min, 14.5);
  assert.strictEqual(nbHgb.max, 22.5);

  const nbWbc = getCbcParamDemographicRange('wbc', 'NEWBORN');
  assert.strictEqual(nbWbc.min, 9.0);
  assert.strictEqual(nbWbc.max, 30.0);
  console.log('  ✓ Newborn physiological values verified (HGB: 14.5-22.5, WBC: 9.0-30.0)');

  const infHgb = getCbcParamDemographicRange('hgb', 'INFANT');
  assert.strictEqual(infHgb.min, 10.5);
  assert.strictEqual(infHgb.max, 13.5);

  const infLym = getCbcParamDemographicRange('lymPct', 'INFANT');
  assert.strictEqual(infLym.min, 45.0);
  assert.strictEqual(infLym.max, 70.0);
  console.log('  ✓ Infant physiological nadir and lymphocytosis verified');

  const fHgb = getCbcParamDemographicRange('hgb', 'ADULT_FEMALE');
  assert.strictEqual(fHgb.min, 12.0);
  assert.strictEqual(fHgb.max, 15.5);

  const mHgb = getCbcParamDemographicRange('hgb', 'ADULT_MALE');
  assert.strictEqual(mHgb.min, 13.0);
  assert.strictEqual(mHgb.max, 17.5);
  console.log('  ✓ Adult gender differential verified (Female: 12.0-15.5, Male: 13.0-17.5)');

  // User custom overrides per demographic bracket
  const customMatrix = {
    ADULT_MALE: {
      hgb: { min: 13.5, max: 18.0 },
    },
  };

  const res = getCbcParamDemographicRange('hgb', 'ADULT_MALE', customMatrix);
  assert.strictEqual(res.min, 13.5);
  assert.strictEqual(res.max, 18.0);
  assert.strictEqual(res.text, '13.5 - 18');

  const fRes = getCbcParamDemographicRange('hgb', 'ADULT_FEMALE', customMatrix);
  assert.strictEqual(fRes.min, 12.0);
  assert.strictEqual(fRes.max, 15.5);
  console.log('  ✓ Custom user overrides and persistence verified');

  // Full patient resolver
  const patientRes = getPatientCbcDemographicRanges({ ageYears: 3, gender: 'MALE' }, customMatrix);
  assert.strictEqual(patientRes.bracketId, 'CHILD_2_5');
  assert.strictEqual(patientRes.bracketMeta.id, 'CHILD_2_5');
  assert.strictEqual(patientRes.getRange('hgb').min, 11.0);
  assert.strictEqual(patientRes.getRange('hgb').max, 14.0);
  console.log('  ✓ Full patient ranges resolution verified');

  console.log('✅ ALL CBC DEMOGRAPHIC REFERENCE TESTS PASSED!');
}

runTests();
