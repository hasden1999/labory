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

  it('unifies all diabetes tests (FBS, HbA1c, Insulin, C-Peptide, HOMA-IR) into a single Diabetes profile group in canonical mode', () => {
    const diabetesTests = [
      { id: 't-fbs', code: 'FBS', name: 'Fasting Blood Sugar', specialtyId: 'db-spec-chem', groupId: 'db-grp-diabetes' },
      { id: 't-hba1c', code: 'HBA1C', name: 'Glycated Hemoglobin', specialtyId: 'db-spec-chem', groupId: 'db-grp-diabetes' },
      { id: 't-rbs', code: 'RBS', name: 'Random Blood Sugar', specialtyId: 'db-spec-chem', groupId: 'db-grp-diabetes' },
      { id: 't-ins', code: 'INSULIN', name: 'Fasting Insulin', specialtyId: null, groupId: null },
      { id: 't-cpep', code: 'CPEPTIDE', name: 'C-Peptide', specialtyId: null, groupId: null },
      { id: 't-homair', code: 'HOMA-IR', name: 'HOMA-IR Index', specialtyId: null, groupId: null },
    ];

    const res = groupTests(diabetesTests, 'specialty');
    expect(res.style).toBe('specialty');

    const chemSection = res.sections.find(s => s.id === 'spec-chemistry');
    expect(chemSection).toBeDefined();

    const diabetesGroup = chemSection!.groups.find(g => g.id === 'grp-diabetes');
    expect(diabetesGroup).toBeDefined();
    expect(diabetesGroup!.nameEn).toContain('Diabetes');

    // All 6 tests must be unified inside grp-diabetes!
    const groupTestCodes = diabetesGroup!.tests.map((t: any) => t.code);
    expect(groupTestCodes).toEqual(['FBS', 'HBA1C', 'RBS', 'INSULIN', 'CPEPTIDE', 'HOMA-IR']);

    // None should fall into directTests or Other Tests
    expect(chemSection!.directTests.length).toBe(0);
    expect(res.sections.some(s => s.isOther)).toBe(false);
  });

  it('unifies diabetes tests under database custom specialties and groups', () => {
    const dbSpecialties = [
      { id: 'cmupz-chem', nameEn: 'Biochemistry', nameAr: 'الكيمياء الحيوية', sortOrder: 1 },
    ];
    const dbGroups = [
      { id: 'cmupz-diab', specialtyId: 'cmupz-chem', nameEn: 'Diabetes profile', nameAr: 'فحوصات السكري', sortOrder: 1 },
      { id: 'cmupz-rft', specialtyId: 'cmupz-chem', nameEn: 'Renal function test (RFT)', nameAr: 'وظائف الكلى', sortOrder: 2 },
    ];

    const mixedTests = [
      { id: 't1', code: 'FBS', name: 'Fasting Blood Sugar', specialtyId: 'cmupz-chem', groupId: 'cmupz-diab' },
      { id: 't2', code: 'HBA1C', name: 'HbA1c', specialtyId: 'cmupz-chem', groupId: 'cmupz-diab' },
      // Tests with no custom IDs:
      { id: 't3', code: 'INSULIN', name: 'Insulin', specialtyId: null, groupId: null },
      { id: 't4', code: 'CPEPTIDE', name: 'C-Peptide', specialtyId: null, groupId: null },
    ];

    const res = groupTests(mixedTests, 'specialty', {
      specialties: dbSpecialties,
      groups: dbGroups,
    });

    const chemSec = res.sections.find(s => s.id === 'cmupz-chem');
    expect(chemSec).toBeDefined();

    const diabGrp = chemSec!.groups.find(g => g.id === 'cmupz-diab');
    expect(diabGrp).toBeDefined();
    expect(diabGrp!.tests.map((t: any) => t.code)).toEqual(['FBS', 'HBA1C', 'INSULIN', 'CPEPTIDE']);
    expect(res.sections.some(s => s.isOther)).toBe(false);
  });

  it('avoids prefix collision false positives for CA125, HBSAG, TPHA, KARYOTYPE', () => {
    const collisionTests = [
      { id: 't-ca125', code: 'CA125', name: 'Cancer Antigen 125' },
      { id: 't-ca199', code: 'CA19-9', name: 'Carbohydrate Antigen 19-9' },
      { id: 't-hbsag', code: 'HBSAG', name: 'Hepatitis B Surface Antigen' },
      { id: 't-tpha', code: 'TPHA', name: 'Treponema Pallidum Hemagglutination' },
      { id: 't-calc', code: 'CA', name: 'Calcium' },
      { id: 't-hb', code: 'HB', name: 'Hemoglobin' },
      { id: 't-tp', code: 'TP', name: 'Total Protein' },
    ];

    const res = groupTests(collisionTests, 'specialty');

    const tumorSec = res.sections.find(s => s.id === 'spec-tumor');
    expect(tumorSec).toBeDefined();
    const tumorCodes = tumorSec!.allTests.map((t: any) => t.code);
    expect(tumorCodes).toContain('CA125');
    expect(tumorCodes).toContain('CA19-9');

    const immunoSec = res.sections.find(s => s.id === 'spec-immunology');
    expect(immunoSec).toBeDefined();
    const immunoCodes = immunoSec!.allTests.map((t: any) => t.code);
    expect(immunoCodes).toContain('HBSAG');
    expect(immunoCodes).toContain('TPHA');

    const chemSec = res.sections.find(s => s.id === 'spec-chemistry');
    expect(chemSec).toBeDefined();
    const chemCodes = chemSec!.allTests.map((t: any) => t.code);
    expect(chemCodes).toContain('CA');
    expect(chemCodes).toContain('TP');

    const hemSec = res.sections.find(s => s.id === 'spec-hematology');
    expect(hemSec).toBeDefined();
    const hemCodes = hemSec!.allTests.map((t: any) => t.code);
    expect(hemCodes).toContain('HB');
  });

  it('precisely separates Diabetic Profile, Lipid Profile, Renal (RFT), Electrolytes, Liver (LFT), and Cardiac Markers', () => {
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
    expect(chemSec).toBeDefined();

    const diabGrp = chemSec!.groups.find(g => g.id === 'grp-diabetes');
    expect(diabGrp?.tests.map((t: any) => t.code)).toEqual(['GLU-F', 'GLU-R', 'HBA1C']);

    const lipidGrp = chemSec!.groups.find(g => g.id === 'grp-lipid');
    expect(lipidGrp?.tests.map((t: any) => t.code)).toEqual(['CHOL', 'TG', 'HDL', 'LDL', 'VLDL']);

    const renalGrp = chemSec!.groups.find(g => g.id === 'grp-renal');
    expect(renalGrp?.tests.map((t: any) => t.code)).toEqual(['UREA', 'CREAT']);

    const elecGrp = chemSec!.groups.find(g => g.id === 'grp-electrolytes');
    expect(elecGrp?.tests.map((t: any) => t.code)).toEqual(['NA', 'K']);

    const liverGrp = chemSec!.groups.find(g => g.id === 'grp-liver');
    expect(liverGrp?.tests.map((t: any) => t.code)).toEqual(['ALT']);

    const cardiacGrp = chemSec!.groups.find(g => g.id === 'grp-cardiac');
    expect(cardiacGrp?.tests.map((t: any) => t.code)).toEqual(['TROP-I']);
  });
});
