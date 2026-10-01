/**
 * Pure Clinical Test Grouping Functions
 * Supports:
 * - 'category': Standard lab workstation/category grouping (Hematology, Clinical Chemistry, etc.)
 * - 'specialty': Hierarchical specialty-driven grouping (Specialty -> Group? -> Test)
 */

export type GroupingStyle = 'category' | 'specialty';

export interface GroupableTest {
  id: string;
  name?: string;
  code?: string;
  category?: string | null;
  specialtyId?: string | null;
  groupId?: string | null;
  sortOrder?: number | null;
  test?: {
    id?: string;
    name?: string;
    code?: string;
    category?: string | null;
    specialtyId?: string | null;
    groupId?: string | null;
    sortOrder?: number | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export interface SpecialtyContext {
  id: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder?: number;
}

export interface TestGroupContext {
  id: string;
  specialtyId: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder?: number;
}

export interface SubGroupBucket<T> {
  id: string;
  specialtyId: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
  tests: T[];
}

export interface GroupBucket<T> {
  id: string | null;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
  isOther?: boolean;
  groups: SubGroupBucket<T>[];
  directTests: T[];
  allTests: T[];
}

export interface GroupedTestsResult<T> {
  style: GroupingStyle;
  sections: GroupBucket<T>[];
}

function resolveTestField<T extends GroupableTest>(test: T, field: 'specialtyId' | 'groupId' | 'sortOrder' | 'category'): any {
  if (test[field] !== undefined && test[field] !== null) {
    return test[field];
  }
  if (test.test && test.test[field] !== undefined && test.test[field] !== null) {
    return test.test[field];
  }
  return null;
}

/**
 * Pure function to group tests either by Category or by Specialty hierarchy.
 */
export function groupTests<T extends GroupableTest>(
  tests: T[],
  style: GroupingStyle = 'category',
  options?: {
    specialties?: SpecialtyContext[];
    groups?: TestGroupContext[];
  }
): GroupedTestsResult<T> {
  if (!Array.isArray(tests) || tests.length === 0) {
    return { style, sections: [] };
  }

  // -------------------------------------------------------------
  // Mode 1: Group By Category (Traditional / Backward-Compatible)
  // -------------------------------------------------------------
  if (style === 'category') {
    const categoryMap = new Map<string, T[]>();

    for (const t of tests) {
      const cat = resolveTestField(t, 'category') || 'General Laboratory Tests';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(t);
    }

    const sections: GroupBucket<T>[] = [];
    let order = 1;
    categoryMap.forEach((catTests, catName) => {
      sections.push({
        id: null,
        nameEn: catName,
        nameAr: null,
        sortOrder: order++,
        groups: [],
        directTests: [...catTests],
        allTests: [...catTests],
      });
    });

    return { style: 'category', sections };
  }

  // -------------------------------------------------------------
  // Mode 2: Group By Clinical Specialty (Specialty -> Group? -> Test)
  // -------------------------------------------------------------
  const specialties = options?.specialties || [];
  const groups = options?.groups || [];

  const specMap = new Map<string, SpecialtyContext>(specialties.map(s => [s.id, s]));
  const groupMap = new Map<string, TestGroupContext>(groups.map(g => [g.id, g]));

  // Specialty ID -> { direct: T[], groups: Map<groupId, T[]> }
  const specialtyBuckets = new Map<string, { direct: T[]; groups: Map<string, T[]> }>();
  for (const s of specialties) {
    specialtyBuckets.set(s.id, {
      direct: [],
      groups: new Map<string, T[]>(),
    });
  }

  const otherTests: T[] = [];

  for (const t of tests) {
    const sId = resolveTestField(t, 'specialtyId');
    const gId = resolveTestField(t, 'groupId');

    if (sId && specMap.has(sId)) {
      let bucket = specialtyBuckets.get(sId);
      if (!bucket) {
        bucket = { direct: [], groups: new Map<string, T[]>() };
        specialtyBuckets.set(sId, bucket);
      }

      if (gId && groupMap.has(gId)) {
        if (!bucket.groups.has(gId)) {
          bucket.groups.set(gId, []);
        }
        bucket.groups.get(gId)!.push(t);
      } else {
        bucket.direct.push(t);
      }
    } else {
      otherTests.push(t);
    }
  }

  const sections: GroupBucket<T>[] = [];

  // Sort specialties by sortOrder
  const sortedSpecs = [...specialties].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const spec of sortedSpecs) {
    const bucket = specialtyBuckets.get(spec.id);
    if (!bucket) continue;

    // Subgroups under this specialty
    const specGroups = groups
      .filter(g => g.specialtyId === spec.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const subGroupBuckets: SubGroupBucket<T>[] = [];
    const allSpecTests: T[] = [];

    for (const grp of specGroups) {
      const gTests = bucket.groups.get(grp.id) || [];
      if (gTests.length === 0) continue; // Omit empty groups

      // Sort tests inside group by sortOrder, preserving original order as tie-breaker
      const sortedGroupTests = [...gTests].sort((a, b) => {
        const orderA = resolveTestField(a, 'sortOrder');
        const orderB = resolveTestField(b, 'sortOrder');
        if (orderA !== null && orderB !== null) return orderA - orderB;
        if (orderA !== null) return -1;
        if (orderB !== null) return 1;
        return 0;
      });

      subGroupBuckets.push({
        id: grp.id,
        specialtyId: spec.id,
        nameEn: grp.nameEn,
        nameAr: grp.nameAr,
        sortOrder: grp.sortOrder ?? 0,
        tests: sortedGroupTests,
      });

      allSpecTests.push(...sortedGroupTests);
    }

    // Direct tests inside specialty
    const sortedDirectTests = [...bucket.direct].sort((a, b) => {
      const orderA = resolveTestField(a, 'sortOrder');
      const orderB = resolveTestField(b, 'sortOrder');
      if (orderA !== null && orderB !== null) return orderA - orderB;
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;
      return 0;
    });

    allSpecTests.push(...sortedDirectTests);

    // Omit empty specialty section
    if (subGroupBuckets.length === 0 && sortedDirectTests.length === 0) {
      continue;
    }

    sections.push({
      id: spec.id,
      nameEn: spec.nameEn,
      nameAr: spec.nameAr,
      sortOrder: spec.sortOrder ?? 0,
      groups: subGroupBuckets,
      directTests: sortedDirectTests,
      allTests: allSpecTests,
    });
  }

  // Append Other Tests section at the end if any tests are ungrouped
  if (otherTests.length > 0) {
    sections.push({
      id: null,
      nameEn: 'Other Tests',
      nameAr: 'فحوصات أخرى',
      sortOrder: 9999,
      isOther: true,
      groups: [],
      directTests: [...otherTests],
      allTests: [...otherTests],
    });
  }

  return { style: 'specialty', sections };
}
