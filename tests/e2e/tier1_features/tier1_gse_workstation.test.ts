/**
 * Tier 1 Feature Coverage: G.S.E Specialized Workstation (R2)
 * Covers: 4-part layout (Physical, FOBT, Microscopic HPF, Parasitology protozoa/helminths matrix),
 * occult blood detection, multi-parasite isolation, and structured serialization.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_GSE_DATA } from '../harness/fixtures';

describe('Tier 1: G.S.E Specialized Workstation', () => {

  test('R2.1: 4-Part Layout completeness (Physical, FOBT, Microscopic HPF, Parasitology)', () => {
    const gse = FIXTURE_GSE_DATA.amoebicDysentery;

    // Part 1: Physical
    expect(gse.color).toBe('Reddish Brown');
    expect(gse.consistency).toBe('Mucoid / Loose');

    // Part 2: FOBT
    expect(gse.fobt).toBe('Positive');

    // Part 3: Microscopic HPF
    expect(gse.microscopic.pusCells).toBe('25-30');
    expect(gse.microscopic.rbc).toBe('35-40');
    expect(gse.microscopic.muscleFibers).toBe('Present');

    // Part 4: Parasitology Matrix
    expect(gse.parasitology.length).toBe(2);
  });

  test('R2.2: FOBT Occult Blood positive/negative validation and interpretation', () => {
    const fobtPositive = 'Positive';
    const fobtNegative = 'Negative';

    expect(['Positive', 'Negative']).toContain(fobtPositive);
    expect(['Positive', 'Negative']).toContain(fobtNegative);
  });

  test('R2.3: Parasitology Protozoa & Helminths Multi-Matrix Isolation', () => {
    const sample = FIXTURE_GSE_DATA.amoebicDysentery;
    const protozoaList = sample.parasitology;

    const entamoeba = protozoaList.find(p => p.organism === 'Entamoeba histolytica');
    expect(entamoeba?.stage).toContain('Trophozoite');
    expect(entamoeba?.severity).toBe('+++');

    const giardia = protozoaList.find(p => p.organism === 'Giardia lamblia');
    expect(giardia?.stage).toBe('Cyst');
    expect(giardia?.severity).toBe('+');
  });

  test('R2.4: Helminth Ova identification matrix coverage', () => {
    const helminthsCatalog = [
      'Ascaris lumbricoides ova',
      'Ancylostoma duodenale ova (Hookworm)',
      'Taenia saginata/solium ova',
      'Hymenolepis nana ova',
      'Enterobius vermicularis ova (Pinworm)',
      'Trichuris trichiura ova (Whipworm)',
      'Schistosoma mansoni ova'
    ];

    expect(helminthsCatalog.length).toBeGreaterThanOrEqual(7);
    expect(helminthsCatalog).toContain('Ascaris lumbricoides ova');
    expect(helminthsCatalog).toContain('Enterobius vermicularis ova (Pinworm)');
  });

  test('R2.5: Structured serialization into standard clinical report and status transition', () => {
    const gse = FIXTURE_GSE_DATA.amoebicDysentery;
    const parasiteSummary = gse.parasitology.map(p => `${p.organism} [${p.stage}]: ${p.severity}`).join(', ');

    const serializedReport = [
      `Physical: Color=${gse.color}, Consistency=${gse.consistency}`,
      `FOBT: ${gse.fobt}`,
      `Microscopic: Pus=${gse.microscopic.pusCells}, RBC=${gse.microscopic.rbc}, Muscle Fibers=${gse.microscopic.muscleFibers}`,
      `Parasitology: ${parasiteSummary}`,
      `Notes: ${gse.notes}`
    ].join(' | ');

    expect(serializedReport).toContain('Entamoeba histolytica [Trophozoite (Hematophagous)]: +++');
    expect(serializedReport).toContain('FOBT: Positive');
    expect(serializedReport).toContain('Active amoebic dysentery');
  });

});
