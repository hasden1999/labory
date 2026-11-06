import { UnifiedCartItem, UnifiedTubeBadge } from '../model/types';

/**
 * Derives required specimen collection tubes and containers from the selected cart items.
 * Pure function matching tube colors and department partition rules from `/api/samples/[id]/barcode`.
 * 
 * - EDTA (Lavender/Purple #7c3aed): Whole blood hematology (CBC, ESR, HbA1c, Blood Group)
 * - Citrate (Light Blue #0284c7): Coagulation (PT, INR, PTT, D-Dimer, Fibrinogen)
 * - SST / Serum Gel (Yellow #d97706): Chemistry, Lipids, Liver, Renal, Hormones, Serology, Vitamins
 * - Sterile Container (Emerald #059669): Urinalysis (GUE), Stool (GSE), Seminal Fluid (SFA)
 */
export function deriveTubeBadges(tests: UnifiedCartItem[]): UnifiedTubeBadge[] {
  if (!tests || !Array.isArray(tests) || tests.length === 0) {
    return [];
  }

  const edtaTests: string[] = [];
  const citrateTests: string[] = [];
  const sstTests: string[] = [];
  const containerTests: string[] = [];

  const citrateCodes = new Set(['PT-INR', 'PT', 'PTT', 'DDIMER', 'D-DIMER', 'INR', 'FIBRINOGEN']);
  const edtaCodes = new Set(['CBC', 'HB', 'PLT', 'ESR', 'BG', 'HBA1C', 'WBC', 'RBC', 'PCV', 'BLOOD GROUP']);
  const containerCodes = new Set(['GUE', 'MALB', 'URINE-PROT', 'BENCE-JONES', 'GSE', 'FOBT', 'HP-AG', 'STOOL-CULTURE', 'SFA', 'SEMEN']);
  const serumSpecificCodes = new Set(['FER', 'IRON', 'TIBC']);

  const edtaCodesList: string[] = [];
  const citrateCodesList: string[] = [];
  const sstCodesList: string[] = [];
  const containerCodesList: string[] = [];

  for (const test of tests) {
    const rawCode = (test.code || test.id || '').toUpperCase().trim();
    const name = test.name || rawCode;
    const sampleType = (test.sampleType || '').toLowerCase();
    const tubeType = (test.tubeType || '').toLowerCase();
    const category = (test.category || '').toLowerCase();
    const combinedText = `${rawCode} ${name} ${sampleType} ${tubeType} ${category}`.toLowerCase();
    const displayCode = test.code || name;

    // 1. Citrate (Blue #0284c7)
    if (
      tubeType.includes('citrate') ||
      citrateCodes.has(rawCode) ||
      sampleType.includes('citrate') ||
      sampleType.includes('سترات') ||
      combinedText.includes('citrate') ||
      combinedText.includes('سترات') ||
      combinedText.includes('d-dimer') ||
      combinedText.includes('ddimer') ||
      combinedText.includes('inr') ||
      combinedText.includes('ptt')
    ) {
      citrateTests.push(name);
      citrateCodesList.push(displayCode);
      continue;
    }

    // 2. Sterile Container (Urine cup / Stool cup)
    if (
      tubeType.includes('urine') ||
      tubeType.includes('container') ||
      containerCodes.has(rawCode) ||
      sampleType.includes('إدرار') ||
      sampleType.includes('ادرار') ||
      sampleType.includes('بول') ||
      sampleType.includes('urine') ||
      sampleType.includes('خروج') ||
      sampleType.includes('براز') ||
      sampleType.includes('stool') ||
      sampleType.includes('سائل منوي') ||
      sampleType.includes('semen') ||
      category.includes('إدرار') ||
      category.includes('خروج') ||
      category.includes('مجهري') ||
      combinedText.includes('gue') ||
      combinedText.includes('gse') ||
      combinedText.includes('sfa')
    ) {
      containerTests.push(name);
      containerCodesList.push(displayCode);
      continue;
    }

    // 3. EDTA (Purple #7c3aed)
    const isEdtaCode = edtaCodes.has(rawCode);
    const hasEdtaText = combinedText.includes('edta') || combinedText.includes('دم كامل');
    const isHematologyCat = category.includes('أمراض الدم') || category.includes('hematology');

    if (
      (tubeType.includes('edta') || isEdtaCode || hasEdtaText || isHematologyCat) &&
      !serumSpecificCodes.has(rawCode) &&
      !combinedText.includes('iron') &&
      !combinedText.includes('ferritin')
    ) {
      edtaTests.push(name);
      edtaCodesList.push(displayCode);
      continue;
    }

    // 4. Default: SST / Serum Gel (Yellow / Gold #d28a00)
    sstTests.push(name);
    sstCodesList.push(displayCode);
  }

  const badges: UnifiedTubeBadge[] = [];

  if (edtaTests.length > 0) {
    badges.push({
      id: 'edta',
      name: 'EDTA',
      tubeType: 'EDTA',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.12)',
      dotColor: '#7c3aed',
      count: 1,
      testNames: edtaTests,
      testCodes: edtaCodesList,
    });
  }

  if (sstTests.length > 0) {
    badges.push({
      id: 'serum',
      name: 'SST',
      tubeType: 'SST',
      color: '#d28a00',
      bg: 'rgba(210, 138, 0, 0.12)',
      dotColor: '#d28a00',
      count: 1,
      testNames: sstTests,
      testCodes: sstCodesList,
    });
  }

  if (citrateTests.length > 0) {
    badges.push({
      id: 'citrate',
      name: 'Citrate',
      tubeType: 'Citrate',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.12)',
      dotColor: '#0284c7',
      count: 1,
      testNames: citrateTests,
      testCodes: citrateCodesList,
    });
  }

  if (containerTests.length > 0) {
    badges.push({
      id: 'urine',
      name: 'Urine cup',
      tubeType: 'Urine cup',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      dotColor: '#f59e0b',
      count: 1,
      testNames: containerTests,
      testCodes: containerCodesList,
    });
  }

  return badges;
}
