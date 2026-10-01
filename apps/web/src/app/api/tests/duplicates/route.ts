import { NextResponse } from 'next/server';
import { getStore, saveStoreToFile } from '../../../../lib/serverStore';
import { prisma } from '../../../../lib/prisma';

function normalizeTestName(s?: string | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '')
    .trim();
}

interface DuplicateGroup {
  normalizedKey: string;
  primaryTest: any;
  duplicateTests: any[];
}

function scanDuplicates(tests: any[], samples: any[]): { exactGroups: DuplicateGroup[]; fuzzyGroups: any[] } {
  // Count usage per test in samples
  const usageCount: Record<string, number> = {};
  (samples || []).forEach(s => {
    (s.tests || []).forEach((st: any) => {
      const tid = st.testId || st.test?.id;
      if (tid) usageCount[tid] = (usageCount[tid] || 0) + 1;
    });
  });

  const exactMap = new Map<string, any[]>();
  tests.filter(t => t.active !== false).forEach(t => {
    const norm = normalizeTestName(t.name);
    if (!norm) return;
    if (!exactMap.has(norm)) exactMap.set(norm, []);
    exactMap.get(norm)!.push(t);
  });

  const exactGroups: DuplicateGroup[] = [];
  exactMap.forEach((group, norm) => {
    if (group.length > 1) {
      // Pick the most complete / most used entry as primary
      group.sort((a, b) => {
        const useA = usageCount[a.id] || 0;
        const useB = usageCount[b.id] || 0;
        if (useB !== useA) return useB - useA;
        // completeness score
        const scoreA = (a.arabicName ? 2 : 0) + (a.refRangeText ? 2 : 0) + (a.unit ? 1 : 0) + (a.code ? 1 : 0);
        const scoreB = (b.arabicName ? 2 : 0) + (b.refRangeText ? 2 : 0) + (b.unit ? 1 : 0) + (b.code ? 1 : 0);
        return scoreB - scoreA;
      });

      exactGroups.push({
        normalizedKey: norm,
        primaryTest: group[0],
        duplicateTests: group.slice(1)
      });
    }
  });

  // Known clinical abbreviation/synonym fuzzy clusters for review
  const KNOWN_CLINICAL_SYNONYMS = [
    { label: 'Hemoglobin / Hb / HGB', keywords: ['hb', 'hgb', 'hemoglobin', 'خضاب الدم', 'الهيموغلوبين'] },
    { label: 'Hematocrit / PCV / HCT', keywords: ['hct', 'pcv', 'hematocrit', 'مكداس الدم'] },
    { label: 'CK-MB / Creatine Kinase-MB', keywords: ['ckmb', 'ck-mb', 'creatine kinase-mb'] },
    { label: 'Blood Urea / BUN', keywords: ['urea', 'bun', 'يوريا الدم'] },
    { label: 'Blood Sugar / Glucose / FBS', keywords: ['fbs', 'fasting blood sugar', 'fasting glucose', 'سكر الدم الصائم'] },
  ];

  const fuzzyGroups: any[] = [];
  KNOWN_CLINICAL_SYNONYMS.forEach(cluster => {
    const matched = tests.filter(t => {
      const combined = `${t.name || ''} ${t.code || ''} ${t.arabicName || ''}`.toLowerCase();
      return cluster.keywords.some(k => combined.includes(k.toLowerCase()));
    });

    if (matched.length > 1) {
      fuzzyGroups.push({
        clusterLabel: cluster.label,
        tests: matched.map(m => ({
          id: m.id,
          code: m.code,
          name: m.name,
          arabicName: m.arabicName,
          price: m.price,
          usageCount: usageCount[m.id] || 0
        }))
      });
    }
  });

  return { exactGroups, fuzzyGroups };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action'); // 'dry-run' (default) or 'merge'
  const store = getStore();
  const tests = (store.tests || []).filter((t: any) => t.active !== false);
  const countBefore = tests.length;

  const { exactGroups, fuzzyGroups } = scanDuplicates(tests, store.samples || []);

  if (action !== 'merge') {
    return NextResponse.json({
      success: true,
      mode: 'dry-run',
      countBefore,
      exactDuplicateGroupsCount: exactGroups.length,
      exactDuplicateGroups: exactGroups,
      fuzzyMatchesForReview: fuzzyGroups,
    });
  }

  // Action: MERGE EXACT DUPLICATES SAFELY
  let removedCount = 0;
  const mergedDetails: any[] = [];

  for (const group of exactGroups) {
    const primary = group.primaryTest;
    for (const dup of group.duplicateTests) {
      // 1. Re-point all sample test references to primary
      if (Array.isArray(store.samples)) {
        store.samples.forEach(s => {
          if (Array.isArray(s.tests)) {
            s.tests.forEach((st: any) => {
              if (st.testId === dup.id || st.test?.id === dup.id) {
                st.testId = primary.id;
                st.test = { ...primary };
              }
            });
          }
        });
      }

      // 2. Re-point panel items
      if (Array.isArray(store.panels)) {
        store.panels.forEach(p => {
          if (Array.isArray(p.testIds)) {
            p.testIds = p.testIds.map(tid => (tid === dup.id ? primary.id : tid));
          }
        });
      }

      // 3. Mark duplicate test as inactive/archived
      dup.active = false;
      removedCount++;
      mergedDetails.push({
        mergedId: dup.id,
        mergedName: dup.name,
        targetId: primary.id,
        targetName: primary.name
      });
    }
  }

  saveStoreToFile();

  const countAfter = (store.tests || []).filter((t: any) => t.active !== false).length;

  return NextResponse.json({
    success: true,
    mode: 'merge',
    countBefore,
    removedCount,
    countAfter,
    mergedDetails,
    fuzzyMatchesForReview: fuzzyGroups,
  });
}
