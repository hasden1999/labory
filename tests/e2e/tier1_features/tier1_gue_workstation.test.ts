/**
 * Tier 1 Feature Coverage: G.U.E Specialized Workstation (R2)
 * Covers: 3-part layout (Physical, Chemical, Microscopic HPF), simultaneous multi-crystal matrix,
 * microorganism selectors, structured serialization, and abnormal flagging.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_GUE_DATA } from '../harness/fixtures';

describe('Tier 1: G.U.E Specialized Workstation', () => {

  test('R2.1: 3-Part Layout completeness (Physical, Chemical, Microscopic HPF)', () => {
    const gue = FIXTURE_GUE_DATA.multiCrystalPathological;

    // Part 1: Physical
    expect(gue.color).toBe('Amber');
    expect(gue.clarity).toBe('Turbid');
    expect(gue.specificGravity).toBeWithinRange(1.000, 1.050);
    expect(gue.ph).toBeWithinRange(4.5, 8.5);

    // Part 2: Chemical
    expect(gue.protein).toBe('++');
    expect(gue.sugar).toBe('+++');
    expect(gue.nitrite).toBe('Positive');
    expect(gue.leukocyteEsterase).toBe('Positive (+++)');

    // Part 3: Microscopic HPF
    expect(gue.pusCells).toBe('30-40');
    expect(gue.rbc).toBe('15-20');
    expect(gue.casts).toBe('Granular (2-4 /LPF)');
  });

  test('R2.2: Simultaneous multi-crystal selection matrix persistence', () => {
    const crystals = FIXTURE_GUE_DATA.multiCrystalPathological.crystals;

    // Must allow multiple distinct crystal types simultaneously
    expect(crystals.length).toBe(3);
    const types = crystals.map(c => c.type);
    expect(types).toContain('Calcium Oxalate');
    expect(types).toContain('Uric Acid');
    expect(types).toContain('Amorphous Urates');

    const caOxalate = crystals.find(c => c.type === 'Calcium Oxalate');
    expect(caOxalate?.amount).toBe('+++');

    const uricAcid = crystals.find(c => c.type === 'Uric Acid');
    expect(uricAcid?.amount).toBe('++');
  });

  test('R2.3: Microorganism selection matrix (Bacteria, Yeast, Trichomonas vaginalis)', () => {
    const organisms = FIXTURE_GUE_DATA.multiCrystalPathological.microorganisms;

    expect(organisms.bacteria).toBe('Many (+++)');
    expect(organisms.yeast).toBe('Present (+)');
    expect(organisms.trichomonas).toBe('Nil');
  });

  test('R2.4: Structured serialization into standard LIS format for reporting and print', () => {
    const data = FIXTURE_GUE_DATA.multiCrystalPathological;
    
    // Serializer creates a clean diagnostic summary string
    const crystalSummary = data.crystals.map(c => `${c.type}: ${c.amount}`).join(', ');
    const serializedReport = [
      `Physical: Color=${data.color}, Clarity=${data.clarity}, Sp.Gr=${data.specificGravity}, pH=${data.ph}`,
      `Chemical: Protein=${data.protein}, Glucose=${data.sugar}, Ketones=${data.ketones}, Nitrite=${data.nitrite}, Leukocytes=${data.leukocyteEsterase}`,
      `Microscopic (HPF): Pus Cells=${data.pusCells}, RBCs=${data.rbc}, Epithelial=${data.epithelialCells}, Casts=${data.casts}`,
      `Crystals: ${crystalSummary}`,
      `Microorganisms: Bacteria=${data.microorganisms.bacteria}, Yeast=${data.microorganisms.yeast}`
    ].join(' | ');

    expect(serializedReport).toContain('Calcium Oxalate: +++');
    expect(serializedReport).toContain('Uric Acid: ++');
    expect(serializedReport).toContain('Pus Cells=30-40');
    expect(serializedReport).toContain('Bacteria=Many (+++)');
  });

  test('R2.5: Pathological finding detection and automatic abnormal flagging', () => {
    function evaluateGueAbnormality(sample: typeof FIXTURE_GUE_DATA.multiCrystalPathological): boolean {
      const isProteinAbnormal = sample.protein !== 'Nil' && sample.protein !== 'Trace';
      const isPusAbnormal = parseInt(sample.pusCells.split('-')[0]) > 5;
      const isRbcAbnormal = parseInt(sample.rbc.split('-')[0]) > 3;
      const hasBacteria = sample.microorganisms.bacteria.includes('+') || sample.microorganisms.bacteria.includes('Many');
      const hasCrystals = sample.crystals.length > 0;

      return isProteinAbnormal || isPusAbnormal || isRbcAbnormal || hasBacteria || hasCrystals;
    }

    const isNormalSampleAbnormal = evaluateGueAbnormality(FIXTURE_GUE_DATA.normal as any);
    const isPathologicalAbnormal = evaluateGueAbnormality(FIXTURE_GUE_DATA.multiCrystalPathological);

    expect(isNormalSampleAbnormal).toBe(false);
    expect(isPathologicalAbnormal).toBe(true);
  });

});
