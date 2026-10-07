/**
 * Catalog Frequency Ordering Utility (Pure & Deterministic)
 * FSD Layer: widgets/unified-workspace/lib/catalogOrdering.ts
 *
 * Implements:
 * 1. Primary ordering: By actual database request frequency (last 90 days).
 * 2. Fallback ordering: WHO Model List of Essential In Vitro Diagnostics (EDL)
 *    and routine laboratory practice clinical standards.
 * 3. Matching strictly by ID or test code (never loose name matching).
 * 4. Puts the top 6-8 most important tests at the top of each category without duplicates.
 */

export interface TestCatalogItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  price?: number;
  [key: string]: any;
}

/** Fallback Top Tests list per category (matching by normalized test code) */
export const CLINICAL_FALLBACK_TOP_CODES: Record<string, string[]> = {
  HEMATOLOGY: ['CBC', 'ESR', 'PT-INR', 'PTT', 'BG', 'BT', 'CT', 'RETIC'],
  CHEMISTRY: ['FBS', 'HBA1C', 'UREA', 'CREAT', 'CHOL', 'TG', 'HDL', 'LDL', 'ALT', 'AST', 'ALP', 'TSB', 'UA', 'CA'],
  HORMONES: ['TSH', 'FT4', 'FT3', 'PSA', 'PRL', 'TESTO', 'LH', 'FSH', 'BHCG'],
  IMMUNOLOGY: ['CRP', 'RF', 'ASO', 'WIDAL', 'ROSE', 'HBSAG', 'HCV', 'HIV', 'VDRL'],
  URINE_STOOL: ['GUE', 'GSE', 'FOBT', 'HPYLORI_STOOL'],
  VITAMINS_MARKERS: ['VITD', 'VITB12', 'FER', 'IRON', 'CEA', 'CA125', 'AFP'],
};

/**
 * Re-orders a catalog array placing the most important tests first.
 * @param tests The catalog tests array
 * @param frequencyMap Optional map of testId -> count (from local offline 90-day stats)
 * @param topLimit Maximum number of top tests prioritized at the head (default 7)
 */
export function orderCatalogByImportance(
  tests: TestCatalogItem[],
  frequencyMap: Record<string, number> = {},
  topLimit: number = 7
): TestCatalogItem[] {
  if (!tests || tests.length === 0) return [];

  // 1. Group tests by category
  const categorized: Record<string, TestCatalogItem[]> = {};
  const otherTests: TestCatalogItem[] = [];

  tests.forEach((t) => {
    const cat = (t.category || '').toUpperCase().trim();
    if (cat) {
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(t);
    } else {
      otherTests.push(t);
    }
  });

  const orderedResult: TestCatalogItem[] = [];

  // Helper to score a test
  const getTestScore = (t: TestCatalogItem, category: string): number => {
    // A. Real historical database frequency takes highest precedence
    const idCount = frequencyMap[String(t.id)] || 0;
    if (idCount > 0) return 100000 + idCount;

    // B. Fallback WHO/EDL priority matching by code
    const topCodes = CLINICAL_FALLBACK_TOP_CODES[category] || [];
    const code = (t.code || '').toUpperCase().trim();
    const fallbackIdx = topCodes.findIndex((c) => c === code);
    if (fallbackIdx >= 0) {
      return 50000 - fallbackIdx; // Earlier in fallback list = higher score
    }

    return 0;
  };

  // Process each category
  Object.keys(categorized).forEach((cat) => {
    const catTests = categorized[cat];

    // Partition into high priority vs standard
    const scored = catTests.map((t) => ({ test: t, score: getTestScore(t, cat) }));

    const topTier = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topLimit)
      .map((s) => s.test);

    const topIds = new Set(topTier.map((t) => t.id));

    // Remainder preserves current stable catalog order
    const remainder = catTests.filter((t) => !topIds.has(t.id));

    orderedResult.push(...topTier, ...remainder);
  });

  orderedResult.push(...otherTests);

  // Return deduplicated array
  const seen = new Set<string>();
  return orderedResult.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}
