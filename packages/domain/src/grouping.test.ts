import { describe, it, expect } from 'vitest';
import { groupTests, SpecialtyContext, TestGroupContext } from './grouping';

describe('groupTests - Pure clinical grouping engine', () => {
  const sampleSpecialties: SpecialtyContext[] = [
    { id: 'spec-bio', nameEn: 'Biochemistry', nameAr: 'الكيمياء الحيوية', sortOrder: 1 },
    { id: 'spec-hem', nameEn: 'Hematology', nameAr: 'أمراض الدم', sortOrder: 2 },
    { id: 'spec-empty', nameEn: 'Empty Specialty', nameAr: 'فارغ', sortOrder: 3 },
  ];

  const sampleGroups: TestGroupContext[] = [
    { id: 'grp-rft', specialtyId: 'spec-bio', nameEn: 'Renal function test (RFT)', nameAr: 'وظائف الكلى', sortOrder: 1 },
    { id: 'grp-lft', specialtyId: 'spec-bio', nameEn: 'Liver function test (LFT)', nameAr: 'وظائف الكبد', sortOrder: 2 },
    { id: 'grp-empty', specialtyId: 'spec-bio', nameEn: 'Empty Group', nameAr: 'مجموعة فارغة', sortOrder: 3 },
  ];

  const catalogTests = [
    { id: 't1', name: 'Creatinine', category: 'وظائف الكلى', specialtyId: 'spec-bio', groupId: 'grp-rft', sortOrder: 2 },
    { id: 't2', name: 'Blood Urea', category: 'وظائف الكلى', specialtyId: 'spec-bio', groupId: 'grp-rft', sortOrder: 1 },
    { id: 't3', name: 'ALT', category: 'وظائف الكبد', specialtyId: 'spec-bio', groupId: 'grp-lft', sortOrder: 1 },
    { id: 't4', name: 'Hemoglobin', category: 'أمراض الدم', specialtyId: 'spec-hem', groupId: null, sortOrder: 1 },
    { id: 't5', name: 'ESR', category: 'أمراض الدم', specialtyId: 'spec-hem', groupId: null, sortOrder: 2 },
    { id: 't6', name: 'Vitamin D', category: 'الفيتامينات', specialtyId: null, groupId: null, sortOrder: null },
  ];

  it('correctly groups by category style (backward compatible)', () => {
    const res = groupTests(catalogTests, 'category');
    expect(res.style).toBe('category');
    expect(res.sections.length).toBe(4);

    const categories = res.sections.map(s => s.nameEn);
    expect(categories).toEqual(['وظائف الكلى', 'وظائف الكبد', 'أمراض الدم', 'الفيتامينات']);
    expect(res.sections[0].directTests.map(t => t.name)).toEqual(['Creatinine', 'Blood Urea']);
    expect(res.sections[0].groups).toHaveLength(0);
  });

  it('correctly groups by specialty style with hierarchy', () => {
    const res = groupTests(catalogTests, 'specialty', {
      specialties: sampleSpecialties,
      groups: sampleGroups,
    });

    expect(res.style).toBe('specialty');
    // spec-bio, spec-hem, and Other Tests (spec-empty omitted because it has no tests)
    expect(res.sections.length).toBe(3);

    // 1. Biochemistry
    const bioSec = res.sections[0];
    expect(bioSec.nameEn).toBe('Biochemistry');
    expect(bioSec.groups).toHaveLength(2); // grp-rft, grp-lft (grp-empty omitted)

    // RFT group tests sorted by sortOrder (Blood Urea: 1, Creatinine: 2)
    expect(bioSec.groups[0].nameEn).toBe('Renal function test (RFT)');
    expect(bioSec.groups[0].tests.map(t => t.name)).toEqual(['Blood Urea', 'Creatinine']);

    // LFT group tests
    expect(bioSec.groups[1].nameEn).toBe('Liver function test (LFT)');
    expect(bioSec.groups[1].tests.map(t => t.name)).toEqual(['ALT']);

    // 2. Hematology (direct tests, no subgroup)
    const hemSec = res.sections[1];
    expect(hemSec.nameEn).toBe('Hematology');
    expect(hemSec.groups).toHaveLength(0);
    expect(hemSec.directTests.map(t => t.name)).toEqual(['Hemoglobin', 'ESR']);

    // 3. Other Tests at the end
    const otherSec = res.sections[2];
    expect(otherSec.isOther).toBe(true);
    expect(otherSec.nameEn).toBe('Other Tests');
    expect(otherSec.directTests.map(t => t.name)).toEqual(['Vitamin D']);
  });

  it('handles sample test records where fields are inside nested test object', () => {
    const sampleTests = [
      {
        id: 'st-1',
        testId: 't1',
        resultValue: '1.1',
        test: { id: 't1', name: 'Creatinine', specialtyId: 'spec-bio', groupId: 'grp-rft', sortOrder: 1 }
      },
      {
        id: 'st-2',
        testId: 't4',
        resultValue: '14.2',
        test: { id: 't4', name: 'Hemoglobin', specialtyId: 'spec-hem', groupId: null, sortOrder: 1 }
      }
    ];

    const res = groupTests(sampleTests, 'specialty', {
      specialties: sampleSpecialties,
      groups: sampleGroups,
    });

    expect(res.sections.length).toBe(2);
    expect(res.sections[0].nameEn).toBe('Biochemistry');
    expect(res.sections[0].groups[0].tests[0].id).toBe('st-1');
    expect(res.sections[1].nameEn).toBe('Hematology');
    expect(res.sections[1].directTests[0].id).toBe('st-2');
  });

  it('omits Other Tests bucket when all tests are assigned to specialties', () => {
    const assignedOnly = catalogTests.filter(t => t.specialtyId !== null);
    const res = groupTests(assignedOnly, 'specialty', {
      specialties: sampleSpecialties,
      groups: sampleGroups,
    });

    expect(res.sections.some(s => s.isOther)).toBe(false);
  });
});
