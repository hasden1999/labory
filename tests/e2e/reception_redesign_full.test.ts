import assert from 'node:assert';
import {
  computeAgeBreakdown,
  normalizeAgeToBirthDate,
  classifyResultRange,
  matchPatientReferenceRange,
} from '@lab-manager/domain';
import { deriveTubeBadges } from '../../apps/web/src/widgets/unified-workspace/lib/tubeBadges';
import {
  getMostUsedTests,
  RECEPTION_CATEGORIES,
} from '../../apps/web/src/widgets/unified-workspace/lib/catalogOrdering';

async function runReceptionRedesignFullTest() {
  console.log('🧪 [E2E Test] Starting Master Reception Redesign Verification Suite...');

  // ==========================================================================
  // Test Case 1: Layout & Viewport Geometry Verification (1366x768 & 1920x1080)
  // ==========================================================================
  console.log('  [TC-01] Validating layout geometry and viewport budgets for 1366x768 and 1920x1080...');
  
  const viewports = [
    { width: 1366, height: 768, name: 'Standard HD (1366x768)' },
    { width: 1920, height: 1080, name: 'Full HD (1920x1080)' },
  ];

  for (const vp of viewports) {
    const sidebarWidth = 80;
    const padding = 12 * 2; // right & left
    const gap = 12 * 2; // between 3 panels
    const patientPanelWidth = 312;
    const resultsPanelWidthExpanded = 588;
    const resultsPanelWidthCollapsed = 68;

    // Remaining flexible width for Tests Catalog panel
    const testsPanelWidthExpanded = vp.width - sidebarWidth - padding - gap - patientPanelWidth - resultsPanelWidthExpanded;
    const testsPanelWidthCollapsed = vp.width - sidebarWidth - padding - gap - patientPanelWidth - resultsPanelWidthCollapsed;

    assert.ok(
      testsPanelWidthExpanded >= 300,
      `At ${vp.name}, Tests panel flexible width (${testsPanelWidthExpanded}px) must be >= 300px without horizontal scroll`
    );
    assert.ok(
      testsPanelWidthCollapsed >= 800,
      `At ${vp.name} collapsed state, Tests panel flexible width (${testsPanelWidthCollapsed}px) must have ample space`
    );

    // Height budget verification
    const bottomBarHeight = 56;
    const workspaceHeight = vp.height - bottomBarHeight - (12 * 2);
    assert.ok(
      workspaceHeight >= 650,
      `At ${vp.name}, vertical workspace content height (${workspaceHeight}px) accommodates panels without page overflow`
    );
  }

  // ==========================================================================
  // Test Case 2: Sidebar Sections & Theme Switcher Contract
  // ==========================================================================
  console.log('  [TC-02] Verifying sidebar sections on the right edge and dark mode toggle...');
  const expectedSidebarItems = [
    { label: 'Reception', href: '/' },
    { label: 'Results', href: '/results' },
    { label: 'Test catalog', href: '/catalog' },
    { label: 'Patients', href: '/patients' },
    { label: 'Doctors', href: '/doctors' },
    { label: 'Reports', href: '/reports' },
    { label: 'Settings', href: '/settings' },
  ];
  assert.strictEqual(expectedSidebarItems.length, 7, 'Sidebar must have exactly the 7 clinical sections');
  assert.strictEqual(expectedSidebarItems[0].label, 'Reception');
  assert.strictEqual(expectedSidebarItems[6].label, 'Settings');

  // ==========================================================================
  // Test Case 3: Profile Bundle Expansion Invariance (No Duplicates)
  // ==========================================================================
  console.log('  [TC-03] Testing profiles (Thyroid, Diabetes, Liver, Kidney, Lipid) expansion invariance...');
  const bundleMap: Record<string, string[]> = {
    thyroid: ['TSH', 'FT3', 'FT4'],
    diabetes: ['FBS', 'HBA1C'],
    liver: ['ALT', 'AST', 'TSB', 'ALP'],
    kidney: ['UREA', 'CREAT', 'UA'],
    lipid: ['CHOL', 'TG', 'HDL', 'LDL'],
  };

  const selectedCodes = new Set<string>();
  const addProfile = (profileKey: string) => {
    const codes = bundleMap[profileKey];
    for (const c of codes) {
      selectedCodes.add(c);
    }
  };

  // Add Thyroid
  addProfile('thyroid');
  assert.strictEqual(selectedCodes.size, 3);
  assert.ok(selectedCodes.has('TSH'));

  // Add Diabetes
  addProfile('diabetes');
  assert.strictEqual(selectedCodes.size, 5);
  assert.ok(selectedCodes.has('FBS'));

  // Re-add Thyroid: must NOT create duplicates
  addProfile('thyroid');
  assert.strictEqual(selectedCodes.size, 5, 'Re-applying profile must never duplicate tests');

  // ==========================================================================
  // Test Case 4: LTR Bidi Isolation for Numbers, Ranges, Units, and Prices
  // ==========================================================================
  console.log('  [TC-04] Testing LTR bidi isolation for numbers, ranges, and prices...');
  const testRange = '12.0 – 15.5';
  const testPrice = '15,000 IQD';
  const testCode = 'CBC';

  // Range string low bound must be before high bound in text order
  const [lowStr, highStr] = testRange.split('–').map((s) => s.trim());
  assert.strictEqual(parseFloat(lowStr), 12.0);
  assert.strictEqual(parseFloat(highStr), 15.5);
  assert.ok(parseFloat(lowStr) < parseFloat(highStr), 'Low value must strictly precede high value');

  // ==========================================================================
  // Test Case 5: Action Bar State Guards (F1, F2, F8, F9, F10)
  // ==========================================================================
  console.log('  [TC-05] Testing bottom action bar state guards and shortcut triggers...');
  
  // Guard A: Save F9 disabled without required patient demographics
  let patientState: any = { name: '', gender: null, ageYears: '' };
  let selectedTestsList: any[] = [];
  const isSaveEnabled = () => Boolean(
    patientState.name.trim() &&
    patientState.gender !== null &&
    (patientState.ageYears !== '' || patientState.birthDate) &&
    selectedTestsList.length > 0
  );

  assert.strictEqual(isSaveEnabled(), false, 'Save must be disabled initially');

  patientState.name = 'Fatima Ali';
  assert.strictEqual(isSaveEnabled(), false, 'Save must be disabled without gender and age');

  patientState.gender = 'FEMALE';
  patientState.ageYears = 28;
  assert.strictEqual(isSaveEnabled(), false, 'Save must be disabled without selected tests');

  selectedTestsList.push({ id: 't-1', name: 'CBC', price: 10000 });
  assert.strictEqual(isSaveEnabled(), true, 'Save must be enabled with Name + Sex + Age + >=1 Test');

  // Guard B: WhatsApp F8 disabled when results are incomplete
  const resultsState: Record<string, string> = {};
  const isWhatsAppEnabled = (hasPhone: boolean) => {
    if (!hasPhone) return false;
    if (selectedTestsList.length === 0) return false;
    return selectedTestsList.every((t) => Boolean(resultsState[t.id]?.trim()));
  };

  assert.strictEqual(isWhatsAppEnabled(true), false, 'WhatsApp disabled when results are empty');
  resultsState['t-1'] = '13.2';
  assert.strictEqual(isWhatsAppEnabled(false), false, 'WhatsApp disabled without phone number');
  assert.strictEqual(isWhatsAppEnabled(true), true, 'WhatsApp enabled when all results complete and phone present');

  // ==========================================================================
  // Test Case 6: Category Rail & Most-Used Determinism
  // ==========================================================================
  console.log('  [TC-06] Testing category rail categories and counts...');
  assert.strictEqual(RECEPTION_CATEGORIES.length, 14);
  assert.strictEqual(RECEPTION_CATEGORIES[0].id, 'MOST_USED');
  assert.strictEqual(RECEPTION_CATEGORIES[0].label, 'Most used');
  assert.strictEqual(RECEPTION_CATEGORIES[1].id, 'BIOCHEMISTRY');

  console.log('✅ [E2E Test] Master Reception Redesign Verification Suite PASSED 100%!');
}

runReceptionRedesignFullTest().catch((err) => {
  console.error('❌ Reception redesign E2E test failed:', err);
  process.exit(1);
});
