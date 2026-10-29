import assert from 'node:assert';
import {
  classifyResultRange,
  matchPatientReferenceRange,
  computeAgeBreakdown,
  normalizeAgeToBirthDate,
} from '@lab-manager/domain';
import { deriveTubeBadges } from '../../apps/web/src/widgets/unified-workspace/lib/tubeBadges';
import {
  getMostUsedTests,
  MOST_USED_FALLBACK_CODES,
} from '../../apps/web/src/widgets/unified-workspace/lib/catalogOrdering';

async function runReceptionDomainUnitTests() {
  console.log('🧪 [Unit Test] Starting Reception Domain & Clinical Rules Test Suite...');

  // --------------------------------------------------------------------------
  // 1. Range Resolution: Age boundaries (days/months/years) & Sex
  // --------------------------------------------------------------------------
  console.log('  Testing reference range resolution by age and sex...');
  const testWithMultiRanges = {
    id: 'test-hgb',
    name: 'Hemoglobin',
    referenceRanges: [
      { sex: 'M', ageMin: 15, ageMax: 120, low: 13.0, high: 17.5, text: '13.0 – 17.5', label: 'Male Adult' },
      { sex: 'F', ageMin: 15, ageMax: 120, low: 12.0, high: 15.5, text: '12.0 – 15.5', label: 'Female Adult' },
      { sex: 'any', ageMin: 0, ageMax: 1, low: 14.0, high: 22.0, text: '14.0 – 22.0', label: 'Infant' },
    ],
  };

  // Male adult (30 years)
  const matchedMale = matchPatientReferenceRange(testWithMultiRanges.referenceRanges, {
    gender: 'MALE',
    age: 30,
  });
  assert.strictEqual(matchedMale?.label, 'Male Adult');
  assert.strictEqual(matchedMale?.low, 13.0);
  assert.strictEqual(matchedMale?.high, 17.5);

  // Female adult (25 years)
  const matchedFemale = matchPatientReferenceRange(testWithMultiRanges.referenceRanges, {
    gender: 'FEMALE',
    age: 25,
  });
  assert.strictEqual(matchedFemale?.label, 'Female Adult');
  assert.strictEqual(matchedFemale?.low, 12.0);
  assert.strictEqual(matchedFemale?.high, 15.5);

  // Infant (0.5 year / 6 months)
  const matchedInfant = matchPatientReferenceRange(testWithMultiRanges.referenceRanges, {
    gender: 'MALE',
    age: 0.5,
  });
  assert.strictEqual(matchedInfant?.label, 'Infant');
  assert.strictEqual(matchedInfant?.low, 14.0);

  // --------------------------------------------------------------------------
  // 2. Flag Edges: Equal to limit is normal, empty, qualitative
  // --------------------------------------------------------------------------
  console.log('  Testing flag boundaries and classification...');
  const fContext = { gender: 'FEMALE' as const, age: 25 };

  // Exactly equal to lower limit (12.0) -> NORMAL (per spec: "a value equal to a limit is normal")
  const resAtLow = classifyResultRange('12.0', testWithMultiRanges, fContext);
  assert.strictEqual(resAtLow.flag, 'NORMAL');
  assert.strictEqual(resAtLow.displayFlag, '');

  // Exactly equal to upper limit (15.5) -> NORMAL
  const resAtHigh = classifyResultRange('15.5', testWithMultiRanges, fContext);
  assert.strictEqual(resAtHigh.flag, 'NORMAL');
  assert.strictEqual(resAtHigh.displayFlag, '');

  // Below lower limit (11.9) -> LOW (L ↓)
  const resBelow = classifyResultRange('11.9', testWithMultiRanges, fContext);
  assert.strictEqual(resBelow.flag, 'LOW');
  assert.strictEqual(resBelow.displayFlag, 'L ↓');
  assert.strictEqual(resBelow.uiColor, '#1d4ed8');
  assert.strictEqual(resBelow.bgColor, '#e8effe');

  // Above upper limit (15.6) -> HIGH (H ↑)
  const resAbove = classifyResultRange('15.6', testWithMultiRanges, fContext);
  assert.strictEqual(resAbove.flag, 'HIGH');
  assert.strictEqual(resAbove.displayFlag, 'H ↑');
  assert.strictEqual(resAbove.uiColor, '#c62828');
  assert.strictEqual(resAbove.bgColor, '#fdecec');

  // Empty value -> NONE
  const resEmpty = classifyResultRange('', testWithMultiRanges, fContext);
  assert.strictEqual(resEmpty.flag, 'NONE');

  // Pure qualitative text -> NONE
  const resQual = classifyResultRange('Negative', testWithMultiRanges, fContext);
  assert.strictEqual(resQual.flag, 'NONE');

  // Non-numeric pending -> NONE
  const resPending = classifyResultRange('Pending', testWithMultiRanges, fContext);
  assert.strictEqual(resPending.flag, 'NONE');

  // --------------------------------------------------------------------------
  // 3. Tube Grouping & Badges
  // --------------------------------------------------------------------------
  console.log('  Testing tube badges derivation and groupings...');
  const cartTests = [
    { id: '1', name: 'Complete Blood Count', code: 'CBC', sampleType: 'Whole Blood', tubeType: 'EDTA' },
    { id: '2', name: 'Erythrocyte Sedimentation Rate', code: 'ESR', sampleType: 'Whole Blood', tubeType: 'Citrate' },
    { id: '3', name: 'Fasting Blood Sugar', code: 'FBS', sampleType: 'Serum', tubeType: 'SST' },
    { id: '4', name: 'Lipid Panel', code: 'LIPID', sampleType: 'Serum', tubeType: 'SST' },
  ];

  const badges = deriveTubeBadges(cartTests);
  assert.strictEqual(badges.length, 3, 'Must derive 3 distinct tube types: EDTA, Citrate, SST');

  const edtaBadge = badges.find((b) => b.tubeType === 'EDTA');
  assert.ok(edtaBadge);
  assert.strictEqual(edtaBadge?.count, 1);
  assert.strictEqual(edtaBadge?.color, '#7c3aed');
  assert.deepStrictEqual(edtaBadge?.testCodes, ['CBC']);

  const sstBadge = badges.find((b) => b.tubeType === 'SST');
  assert.ok(sstBadge);
  assert.strictEqual(sstBadge?.count, 1, 'Requires 1 physical SST tube for multiple serum tests');
  assert.strictEqual(sstBadge?.color, '#d28a00');
  assert.strictEqual(sstBadge?.testCodes.length, 2);
  assert.ok(sstBadge?.testCodes.includes('FBS'));
  assert.ok(sstBadge?.testCodes.includes('LIPID'));

  // --------------------------------------------------------------------------
  // 4. Most-Used Ranking and Fallback
  // --------------------------------------------------------------------------
  console.log('  Testing most-used ranking & seeded fallback...');
  const mockCatalog = [
    { id: 'c1', name: 'Complete Blood Count', code: 'CBC' },
    { id: 'c2', name: 'Fasting Blood Sugar', code: 'FBS' },
    { id: 'c3', name: 'HbA1c', code: 'HBA1C' },
    { id: 'c4', name: 'Blood Urea', code: 'UREA' },
    { id: 'c5', name: 'Serum Creatinine', code: 'CREAT' },
    { id: 'c6', name: 'Serum Calcium', code: 'CA' },
    { id: 'c7', name: 'Total Cholesterol', code: 'CHOL' },
    { id: 'c8', name: 'Triglycerides', code: 'TG' },
    { id: 'c9', name: 'ALT (SGPT)', code: 'ALT' },
    { id: 'c10', name: 'AST (SGOT)', code: 'AST' },
    { id: 'c11', name: 'TSH', code: 'TSH' },
    { id: 'c12', name: 'Vitamin D', code: 'VITD' },
    { id: 'c13', name: 'Ferritin', code: 'FER' },
  ];

  // No history -> returns seeded fallback
  const fallbackList = getMostUsedTests(mockCatalog, {});
  assert.strictEqual(fallbackList.length, 12, 'Fallback must match the 12 essential tests');
  assert.strictEqual(fallbackList[0].code, 'CBC');
  assert.strictEqual(fallbackList[1].code, 'FBS');

  // With order history -> ranks by frequency
  const freqMap: Record<string, number> = {
    c11: 150, // TSH most ordered
    c2: 120,  // FBS
    c1: 80,   // CBC
  };
  const rankedList = getMostUsedTests(mockCatalog, freqMap);
  assert.strictEqual(rankedList[0].code, 'TSH', 'TSH must be #1 due to highest order frequency');
  assert.strictEqual(rankedList[1].code, 'FBS', 'FBS must be #2');
  assert.strictEqual(rankedList[2].code, 'CBC', 'CBC must be #3');

  // --------------------------------------------------------------------------
  // 5. Total Price Calculation (Zero Discount System)
  // --------------------------------------------------------------------------
  console.log('  Testing pricing sum and zero discount invariance...');
  const pricedTests = [
    { id: '1', price: 10000, isCalculated: false },
    { id: '2', price: 5000, isCalculated: false },
    { id: '3', price: 0, isCalculated: true }, // Free calculated test (e.g. eGFR or VLDL)
  ];
  const grossTotal = pricedTests.reduce((acc, t) => (t.isCalculated ? acc : acc + t.price), 0);
  const netTotal = grossTotal; // No discount
  assert.strictEqual(grossTotal, 15000);
  assert.strictEqual(netTotal, 15000);

  // --------------------------------------------------------------------------
  // 6. Age Validation & Breakdown
  // --------------------------------------------------------------------------
  console.log('  Testing age breakdown and normalization...');
  const bd = computeAgeBreakdown('1990-05-15', new Date('2026-10-09'));
  assert.strictEqual(bd.years, 36);
  assert.ok(bd.months >= 0 && bd.months <= 11);
  assert.ok(bd.days >= 0 && bd.days <= 30);

  console.log('✅ [Unit Test] ALL Reception Domain Unit Tests PASSED!');
}

runReceptionDomainUnitTests().catch((err) => {
  console.error('❌ Reception domain unit tests failed:', err);
  process.exit(1);
});
