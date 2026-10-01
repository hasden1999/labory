import assert from 'node:assert';
import {
  classifyResultRange,
  formatFlaggedResultHtml,
  parseNumericBounds,
  matchPatientReferenceRange,
} from '../../packages/domain/src/rangeClassification';

console.log('🧪 Starting Range Classification & Clinical Alert Unit Tests...');

// 1. Numeric Range Evaluation - Normal, High, Low
{
  const fbsTest = {
    id: 'fbs-1',
    code: 'FBS',
    name: 'Fasting Blood Sugar',
    refRangeLow: 70,
    refRangeHigh: 110,
    unit: 'mg/dL',
  };

  const normalRes = classifyResultRange(85, fbsTest);
  assert.strictEqual(normalRes.flag, 'NORMAL');
  assert.strictEqual(normalRes.status, 'NORMAL');
  assert.strictEqual(normalRes.arrow, '');
  assert.strictEqual(normalRes.color, '');
  assert.strictEqual(normalRes.isAbnormal, false);
  assert.strictEqual(normalRes.isHigh, false);
  assert.strictEqual(normalRes.isLow, false);

  const highRes = classifyResultRange(145, fbsTest);
  assert.strictEqual(highRes.flag, 'HIGH');
  assert.strictEqual(highRes.status, 'HIGH');
  assert.strictEqual(highRes.arrow, '↑');
  assert.strictEqual(highRes.color, '#dc2626');
  assert.strictEqual(highRes.isAbnormal, true);
  assert.strictEqual(highRes.isHigh, true);
  assert.strictEqual(highRes.isLow, false);

  const lowRes = classifyResultRange(55, fbsTest);
  assert.strictEqual(lowRes.flag, 'LOW');
  assert.strictEqual(lowRes.status, 'LOW');
  assert.strictEqual(lowRes.arrow, '↓');
  assert.strictEqual(lowRes.color, '#2563eb');
  assert.strictEqual(lowRes.isAbnormal, true);
  assert.strictEqual(lowRes.isLow, true);
  assert.strictEqual(lowRes.isHigh, false);

  console.log('✅ 1. Basic numeric range checks (Normal, High, Low) passed.');
}

// 2. Qualitative / Non-numeric results -> No flag
{
  const urineProtein = {
    id: 'urine-prot',
    code: 'URINE_PROT',
    name: 'Urine Protein',
    refRangeText: 'Negative',
  };

  const negRes = classifyResultRange('Negative', urineProtein);
  assert.strictEqual(negRes.flag, 'NONE');
  assert.strictEqual(negRes.status, 'NORMAL');
  assert.strictEqual(negRes.arrow, '');
  assert.strictEqual(negRes.isAbnormal, false);

  const posRes = classifyResultRange('Positive', urineProtein);
  assert.strictEqual(posRes.flag, 'NONE');
  assert.strictEqual(posRes.status, 'NORMAL');
  assert.strictEqual(posRes.arrow, '');
  assert.strictEqual(posRes.isAbnormal, false);

  const bloodGroup = { id: 'bg', code: 'ABO', name: 'Blood Group' };
  const bgRes = classifyResultRange('O Positive', bloodGroup);
  assert.strictEqual(bgRes.flag, 'NONE');
  assert.strictEqual(bgRes.status, 'NORMAL');
  assert.strictEqual(bgRes.arrow, '');

  console.log('✅ 2. Qualitative / Non-numeric results suppression passed.');
}

// 3. Tests with no reference range -> No flag
{
  const arbitraryTest = { id: 'arb', code: 'ARB', name: 'Experimental Assay' };
  const arbRes = classifyResultRange(120, arbitraryTest);
  assert.strictEqual(arbRes.flag, 'NONE');
  assert.strictEqual(arbRes.status, 'NORMAL');
  assert.strictEqual(arbRes.arrow, '');
  assert.strictEqual(arbRes.isAbnormal, false);

  console.log('✅ 3. Tests with no reference range suppression passed.');
}

// 4. Calculated Lipid Panel Values
{
  const ldlCalc = { id: 'calc-ldl', code: 'LDL', isCalculated: true };
  const ldlHigh = classifyResultRange(142, ldlCalc);
  assert.strictEqual(ldlHigh.flag, 'HIGH');
  assert.strictEqual(ldlHigh.arrow, '↑');
  assert.strictEqual(ldlHigh.color, '#dc2626');
  assert.strictEqual(ldlHigh.isAbnormal, true);

  const ldlNormal = classifyResultRange(85, ldlCalc);
  assert.strictEqual(ldlNormal.flag, 'NORMAL');
  assert.strictEqual(ldlNormal.arrow, '');

  const vldlCalc = { id: 'calc-vldl', code: 'VLDL', isCalculated: true };
  const vldlHigh = classifyResultRange(44, vldlCalc);
  assert.strictEqual(vldlHigh.flag, 'HIGH');
  assert.strictEqual(vldlHigh.arrow, '↑');

  const nonHdlCalc = { id: 'calc-non-hdl', code: 'NON-HDL', isCalculated: true };
  const nonHdlHigh = classifyResultRange(165, nonHdlCalc);
  assert.strictEqual(nonHdlHigh.flag, 'HIGH');
  assert.strictEqual(nonHdlHigh.arrow, '↑');

  const tcHdlCalc = { id: 'calc-tc-hdl', code: 'TC/HDL', isCalculated: true };
  const tcHdlHigh = classifyResultRange(5.8, tcHdlCalc);
  assert.strictEqual(tcHdlHigh.flag, 'HIGH');
  assert.strictEqual(tcHdlHigh.arrow, '↑');

  console.log('✅ 4. Calculated lipid rows (LDL, VLDL, Non-HDL, Ratios) passed.');
}

// 5. Multi-range auto-selection by sex and age
{
  const uricAcidTest = {
    id: 'uric-acid',
    code: 'UA',
    name: 'Uric Acid',
    referenceRanges: [
      { id: 'r-child', ageMin: 0, ageMax: 12, ageUnit: 'years', sex: 'any', low: 2.0, high: 5.5, text: '2.0 - 5.5' },
      { id: 'r-male', ageMin: 13, ageMax: 120, ageUnit: 'years', sex: 'M', low: 3.5, high: 7.2, text: '3.5 - 7.2' },
      { id: 'r-female', ageMin: 13, ageMax: 120, ageUnit: 'years', sex: 'F', low: 2.6, high: 6.0, text: '2.6 - 6.0' },
    ],
  };

  // Male adult with value 6.8 -> Normal (max 7.2)
  const maleAdult = classifyResultRange(6.8, uricAcidTest, { gender: 'MALE', age: 40 });
  assert.strictEqual(maleAdult.flag, 'NORMAL');
  assert.strictEqual(maleAdult.isAbnormal, false);

  // Female adult with value 6.8 -> High (max 6.0)
  const femaleAdult = classifyResultRange(6.8, uricAcidTest, { gender: 'FEMALE', age: 40 });
  assert.strictEqual(femaleAdult.flag, 'HIGH');
  assert.strictEqual(femaleAdult.arrow, '↑');
  assert.strictEqual(femaleAdult.isAbnormal, true);

  // Child with value 6.0 -> High (child max 5.5)
  const child = classifyResultRange(6.0, uricAcidTest, { gender: 'MALE', age: 8 });
  assert.strictEqual(child.flag, 'HIGH');
  assert.strictEqual(child.arrow, '↑');

  console.log('✅ 5. Multi-range age & sex stratification passed.');
}

// 6. Previous result column evaluation
{
  const hbTest = { id: 'hb', code: 'HGB', refRangeLow: 12.0, refRangeHigh: 17.5 };
  const priorAbnormal = classifyResultRange('10.2', hbTest);
  assert.strictEqual(priorAbnormal.flag, 'LOW');
  assert.strictEqual(priorAbnormal.arrow, '↓');
  assert.strictEqual(priorAbnormal.color, '#2563eb');

  const priorNormal = classifyResultRange('13.5', hbTest);
  assert.strictEqual(priorNormal.flag, 'NORMAL');
  assert.strictEqual(priorNormal.arrow, '');

  console.log('✅ 6. Previous result column evaluation passed.');
}

// 7. HTML Output Formatting (Bold + Color + Arrow)
{
  const highEval = classifyResultRange(145, { refRangeLow: 70, refRangeHigh: 110 });
  const htmlHigh = formatFlaggedResultHtml(145, highEval);
  assert.ok(htmlHigh.includes('145'));
  assert.ok(htmlHigh.includes('↑'));
  assert.ok(htmlHigh.includes('#dc2626'));
  assert.ok(htmlHigh.includes('font-weight: 800'));

  const normalEval = classifyResultRange(85, { refRangeLow: 70, refRangeHigh: 110 });
  const htmlNormal = formatFlaggedResultHtml(85, normalEval);
  assert.ok(htmlNormal.includes('85'));
  assert.ok(!htmlNormal.includes('↑'));
  assert.ok(!htmlNormal.includes('↓'));
  assert.ok(!htmlNormal.includes('#dc2626'));

  console.log('✅ 7. HTML flagged output formatting passed.');
}

console.log('🎉 ALL Range Classification Unit Tests PASSED Successfully!\n');
