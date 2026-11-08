import assert from 'node:assert';
import { groupTests, getCanonicalGroupMeta } from '../grouping';

function runGroupingTests() {
  console.log('🧪 Testing Clinical Grouping Engine (Diabetic, Lipid, Renal, Liver, Cardiac, Electrolytes)...');

  const clinicalPanel = [
    { id: 't-fbs', code: 'GLU-F', name: 'Fasting Blood Sugar (FBS)' },
    { id: 't-rbs', code: 'GLU-R', name: 'Random Blood Sugar (RBS)' },
    { id: 't-hba1c', code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)' },
    { id: 't-chol', code: 'CHOL', name: 'Total Cholesterol' },
    { id: 't-tg', code: 'TG', name: 'Triglycerides' },
    { id: 't-hdl', code: 'HDL', name: 'HDL Cholesterol' },
    { id: 't-ldl', code: 'LDL', name: 'LDL Cholesterol' },
    { id: 't-vldl', code: 'VLDL', name: 'VLDL Cholesterol' },
    { id: 't-urea', code: 'UREA', name: 'Blood Urea' },
    { id: 't-creat', code: 'CREAT', name: 'Serum Creatinine' },
    { id: 't-na', code: 'NA', name: 'Serum Sodium (Na+)' },
    { id: 't-k', code: 'K', name: 'Serum Potassium (K+)' },
    { id: 't-alt', code: 'ALT', name: 'ALT (GPT)' },
    { id: 't-trop', code: 'TROP-I', name: 'Troponin I' },
  ];

  const res = groupTests(clinicalPanel, 'specialty');
  const chemSec = res.sections.find(s => s.id === 'spec-chemistry');
  assert.ok(chemSec, 'Chemistry section must be present');

  // 1. Diabetic Profile
  const diabGrp = chemSec.groups.find(g => g.id === 'grp-diabetes');
  assert.ok(diabGrp, 'grp-diabetes must exist');
  assert.deepStrictEqual(diabGrp.tests.map((t: any) => t.code), ['GLU-F', 'GLU-R', 'HBA1C']);
  console.log('  ✓ Diabetic Profile grouping verified: FBS, RBS, HbA1c separated cleanly under grp-diabetes');

  // 2. Lipid Profile
  const lipidGrp = chemSec.groups.find(g => g.id === 'grp-lipid');
  assert.ok(lipidGrp, 'grp-lipid must exist');
  assert.deepStrictEqual(lipidGrp.tests.map((t: any) => t.code), ['CHOL', 'TG', 'HDL', 'LDL', 'VLDL']);
  console.log('  ✓ Lipid Profile grouping verified: Cholesterol, TG, HDL, LDL, VLDL grouped together');

  // 3. Renal Function Test (RFT)
  const renalGrp = chemSec.groups.find(g => g.id === 'grp-renal');
  assert.ok(renalGrp, 'grp-renal must exist');
  assert.deepStrictEqual(renalGrp.tests.map((t: any) => t.code), ['UREA', 'CREAT']);
  console.log('  ✓ Renal Function (RFT) grouping verified: Urea, Creatinine grouped together');

  // 4. Electrolytes & Minerals
  const elecGrp = chemSec.groups.find(g => g.id === 'grp-electrolytes');
  assert.ok(elecGrp, 'grp-electrolytes must exist');
  assert.deepStrictEqual(elecGrp.tests.map((t: any) => t.code), ['NA', 'K']);
  console.log('  ✓ Electrolytes grouping verified: Na+, K+ separated under Electrolytes & Minerals');

  // 5. Liver Function Test (LFT)
  const liverGrp = chemSec.groups.find(g => g.id === 'grp-liver');
  assert.ok(liverGrp, 'grp-liver must exist');
  assert.deepStrictEqual(liverGrp.tests.map((t: any) => t.code), ['ALT']);
  console.log('  ✓ Liver Function (LFT) grouping verified: ALT under Liver function');

  // 6. Cardiac Markers
  const cardiacGrp = chemSec.groups.find(g => g.id === 'grp-cardiac');
  assert.ok(cardiacGrp, 'grp-cardiac must exist');
  assert.deepStrictEqual(cardiacGrp.tests.map((t: any) => t.code), ['TROP-I']);
  console.log('  ✓ Cardiac Markers grouping verified: Troponin I under Cardiac Markers');

  // Helper metadata
  const metaFbs = getCanonicalGroupMeta({ code: 'FBS', name: 'Fasting Blood Sugar' });
  assert.strictEqual(metaFbs?.id, 'grp-diabetes');
  assert.strictEqual(metaFbs?.specialtyId, 'spec-chemistry');

  const metaChol = getCanonicalGroupMeta({ code: 'CHOL', name: 'Cholesterol' });
  assert.strictEqual(metaChol?.id, 'grp-lipid');

  console.log('✅ ALL CLINICAL GROUPING TESTS PASSED 100%!');
}

runGroupingTests();
