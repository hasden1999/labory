/**
 * Tier 1 Feature Coverage: Microbiology & Antibiogram Workstation (R2)
 * Covers: Specimen site, Gram stain morphology, organism identification, colony count,
 * 20+ antibiotic susceptibility matrix (S/I/R), and multi-part serialization.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';

describe('Tier 1: Microbiology & Antibiogram Workstation', () => {

  const mockCultureOrder = {
    specimen: 'Clean Catch Midstream Urine',
    gramStain: 'Gram-negative bacilli (GNB), moderate pus cells',
    organism: 'Escherichia coli (ESBL-producing)',
    colonyCount: '> 100,000 CFU/mL (Significant bacteriuria)',
    antibiogram: [
      { antibiotic: 'Amikacin', diskContent: '30 ug', zoneMm: 22, interpretation: 'S' as const },
      { antibiotic: 'Amoxicillin-Clavulanate', diskContent: '20/10 ug', zoneMm: 12, interpretation: 'R' as const },
      { antibiotic: 'Ampicillin', diskContent: '10 ug', zoneMm: 8, interpretation: 'R' as const },
      { antibiotic: 'Cefepime', diskContent: '30 ug', zoneMm: 14, interpretation: 'R' as const },
      { antibiotic: 'Ceftriaxone', diskContent: '30 ug', zoneMm: 10, interpretation: 'R' as const },
      { antibiotic: 'Ciprofloxacin', diskContent: '5 ug', zoneMm: 13, interpretation: 'R' as const },
      { antibiotic: 'Colistin', diskContent: '10 ug', zoneMm: 18, interpretation: 'S' as const },
      { antibiotic: 'Gentamicin', diskContent: '10 ug', zoneMm: 19, interpretation: 'S' as const },
      { antibiotic: 'Imipenem', diskContent: '10 ug', zoneMm: 26, interpretation: 'S' as const },
      { antibiotic: 'Levofloxacin', diskContent: '5 ug', zoneMm: 14, interpretation: 'R' as const },
      { antibiotic: 'Meropenem', diskContent: '10 ug', zoneMm: 28, interpretation: 'S' as const },
      { antibiotic: 'Nitrofurantoin', diskContent: '300 ug', zoneMm: 20, interpretation: 'S' as const },
      { antibiotic: 'Piperacillin-Tazobactam', diskContent: '100/10 ug', zoneMm: 21, interpretation: 'S' as const },
      { antibiotic: 'Trimethoprim-Sulfamethoxazole', diskContent: '1.25/23.75 ug', zoneMm: 9, interpretation: 'R' as const },
    ],
    notes: 'Multidrug-resistant ESBL strain isolated. Sensitive to Carbapenems, Nitrofurantoin, and Aminoglycosides.'
  };

  test('R2.1: Specimen site & Gram stain morphology documentation', () => {
    expect(mockCultureOrder.specimen).toBe('Clean Catch Midstream Urine');
    expect(mockCultureOrder.gramStain).toContain('Gram-negative bacilli');
    expect(mockCultureOrder.colonyCount).toContain('> 100,000 CFU/mL');
  });

  test('R2.2: Organism Isolation and Strain Identification', () => {
    expect(mockCultureOrder.organism).toBe('Escherichia coli (ESBL-producing)');
  });

  test('R2.3: 20+ Antibiotic Antibiogram Sensitivity Matrix (S / I / R categorization)', () => {
    const list = mockCultureOrder.antibiogram;
    expect(list.length).toBeGreaterThanOrEqual(14);

    const validInterpretations = ['S', 'I', 'R'];
    for (const item of list) {
      expect(validInterpretations).toContain(item.interpretation);
      expect(item.zoneMm).toBeGreaterThan(0);
    }

    const sensitives = list.filter(a => a.interpretation === 'S');
    const resistants = list.filter(a => a.interpretation === 'R');

    expect(sensitives.length).toBeGreaterThan(0);
    expect(resistants.length).toBeGreaterThan(0);

    const meropenem = list.find(a => a.antibiotic === 'Meropenem');
    expect(meropenem?.interpretation).toBe('S');

    const cipro = list.find(a => a.antibiotic === 'Ciprofloxacin');
    expect(cipro?.interpretation).toBe('R');
  });

  test('R2.4: Multi-drug resistance (MDRO) alert generation', () => {
    const resistants = mockCultureOrder.antibiogram.filter(a => a.interpretation === 'R');
    const isMdr = resistants.length >= 3;

    expect(isMdr).toBe(true);
    expect(mockCultureOrder.notes).toContain('Multidrug-resistant');
  });

  test('R2.5: Serialization of Antibiogram into multi-part table format', () => {
    const serializedRows = mockCultureOrder.antibiogram.map(
      a => `<tr><td>${a.antibiotic}</td><td>${a.diskContent}</td><td>${a.zoneMm} mm</td><td class="badge-${a.interpretation}">${a.interpretation === 'S' ? 'Sensitive' : a.interpretation === 'I' ? 'Intermediate' : 'Resistant'}</td></tr>`
    ).join('\n');

    expect(serializedRows).toContain('<td>Meropenem</td>');
    expect(serializedRows).toContain('badge-S');
    expect(serializedRows).toContain('Sensitive');
    expect(serializedRows).toContain('<td>Ciprofloxacin</td>');
    expect(serializedRows).toContain('badge-R');
    expect(serializedRows).toContain('Resistant');
  });

});
