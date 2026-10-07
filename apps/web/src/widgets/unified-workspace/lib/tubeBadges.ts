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

  for (const test of tests) {
    const rawCode = (test.code || test.id || '').toUpperCase().trim();
    const name = test.name || rawCode;
    const sampleType = (test.sampleType || '').toLowerCase();
    const category = (test.category || '').toLowerCase();
    const combinedText = `${rawCode} ${name} ${sampleType} ${category}`.toLowerCase();

    // 1. Citrate (Blue #0284c7)
    if (
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
      continue;
    }

    // 2. Sterile Container (Emerald #059669)
    if (
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
      continue;
    }

    // 3. EDTA (Purple #7c3aed)
    const isEdtaCode = edtaCodes.has(rawCode);
    const hasEdtaText = combinedText.includes('edta') || combinedText.includes('دم كامل');
    const isHematologyCat = category.includes('أمراض الدم') || category.includes('hematology');

    if (
      (isEdtaCode || hasEdtaText || isHematologyCat) &&
      !serumSpecificCodes.has(rawCode) &&
      !combinedText.includes('iron') &&
      !combinedText.includes('ferritin')
    ) {
      edtaTests.push(name);
      continue;
    }

    // 4. Default: SST / Serum Gel (Yellow #d97706)
    sstTests.push(name);
  }

  const badges: UnifiedTubeBadge[] = [];

  if (edtaTests.length > 0) {
    badges.push({
      id: 'edta',
      name: 'EDTA (بنفسجي)',
      tubeType: 'EDTA دم كامل',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.12)',
      dotColor: '#7c3aed',
      count: edtaTests.length,
      testNames: edtaTests,
    });
  }

  if (citrateTests.length > 0) {
    badges.push({
      id: 'citrate',
      name: 'Citrate (أزرق)',
      tubeType: 'سترات Citrate',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.12)',
      dotColor: '#0284c7',
      count: citrateTests.length,
      testNames: citrateTests,
    });
  }

  if (sstTests.length > 0) {
    badges.push({
      id: 'sst',
      name: 'SST (أصفر)',
      tubeType: 'سيروم جل SST',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.12)',
      dotColor: '#d97706',
      count: sstTests.length,
      testNames: sstTests,
    });
  }

  if (containerTests.length > 0) {
    badges.push({
      id: 'container',
      name: 'عبوة معقمة (إدرار/خروج)',
      tubeType: 'عبوة فحص معقمة',
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.12)',
      dotColor: '#059669',
      count: containerTests.length,
      testNames: containerTests,
    });
  }

  return badges;
}
