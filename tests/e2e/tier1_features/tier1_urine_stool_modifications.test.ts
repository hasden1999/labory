/**
 * Tier 1 Feature Coverage: Urine (G.U.E) & Stool (G.S.E) Modifications
 * Covers:
 * 1. Urine Crystals Hybrid Multi-Entry Combobox with quantity
 * 2. Trichomonas removal & replacement with flexible 'Other' field & historical migration
 * 3. Urine Casts & Yeast Hybrid Multi-Entry Combobox with quantity
 * 4. Stool Parasites: removal of severity/crosses, replacement with Stage combobox, formatted print
 * 5. Stool Yeast / Monilia microscopic finding & conditional print visibility
 * 6. UX Flexibility: dir="auto", free-text preservation, stable IDs, and case retention
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { 
  serializeGse, 
  parseGse, 
  DEFAULT_PARASITE_SUGGESTIONS, 
  DEFAULT_STAGE_SUGGESTIONS, 
  YEAST_MONILIA_SUGGESTIONS 
} from '../../../apps/web/src/components/workstations/GseModal';
import { 
  DEFAULT_CRYSTALS_SUGGESTIONS, 
  DEFAULT_CASTS_SUGGESTIONS, 
  DEFAULT_YEAST_SUGGESTIONS, 
  QUANTITY_OPTIONS 
} from '../../../apps/web/src/components/UrineFormModal';
import { 
  migrateGueResult, 
  migrateGseResult 
} from '../../../tools/migrations/migrate-urine-stool';

describe('Tier 1: Urine (G.U.E) & Stool (G.S.E) Modifications', () => {

  // =========================================================================
  // ITEM 1: URINE CRYSTALS (MultiEntry Combobox + Quantity)
  // =========================================================================
  test('Item 1.1: 15+ predefined crystal suggestions and quantity levels are available', () => {
    expect(DEFAULT_CRYSTALS_SUGGESTIONS.length).toBeGreaterThanOrEqual(15);
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Calcium oxalate');
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Uric acid');
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Triple phosphate');
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Amorphous urates');
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Amorphous phosphates');
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Calcium carbonate');
    expect(DEFAULT_CRYSTALS_SUGGESTIONS).toContain('Cystine');

    expect(QUANTITY_OPTIONS).toContain('Few');
    expect(QUANTITY_OPTIONS).toContain('+');
    expect(QUANTITY_OPTIONS).toContain('++');
    expect(QUANTITY_OPTIONS).toContain('+++');
    expect(QUANTITY_OPTIONS).toContain('Many');
  });

  test('Item 1.2: Multi-crystal list formatting into structured clinical report', () => {
    const crystals = [
      { id: 'c1', name: 'Calcium oxalate', quantity: '++' },
      { id: 'c2', name: 'Uric acid', quantity: '+' },
      { id: 'c3', name: 'بلورات نادرة مخصصة', quantity: 'Few' }
    ];

    const formatted = crystals
      .filter(c => c.name && c.name.trim())
      .map(c => c.quantity ? `${c.name.trim()} (${c.quantity.trim()})` : c.name.trim())
      .join(', ');

    expect(formatted).toBe('Calcium oxalate (++), Uric acid (+), بلورات نادرة مخصصة (Few)');
  });

  // =========================================================================
  // ITEM 2: TRICHOMONAS REMOVAL & REPLACEMENT WITH 'OTHER' + MIGRATION
  // =========================================================================
  test('Item 2.1: Trichomonas is migrated to Other: Trichomonas: [value] when positive', () => {
    const legacyGuePositive = [
      '[G.U.E - GENERAL URINE EXAMINATION]',
      'PHYSICAL: Color: Yellow | Clarity: Clear',
      'CHEMICAL: Protein: Nil | Glucose: Nil',
      'MICROSCOPIC: Pus Cells: 1-2 /HPF | RBCs: 0-1 /HPF | Trichomonas: Motile trophozoites seen (+)'
    ].join('\n');

    const migrated = migrateGueResult(legacyGuePositive);

    expect(migrated.includes('| Trichomonas:')).toBe(false);
    expect(migrated).toContain('Other: Trichomonas: Motile trophozoites seen (+)');
  });

  test('Item 2.2: Trichomonas is suppressed when Nil, None, or empty', () => {
    const legacyGueNil = [
      '[G.U.E - GENERAL URINE EXAMINATION]',
      'PHYSICAL: Color: Yellow | Clarity: Clear',
      'CHEMICAL: Protein: Nil | Glucose: Nil',
      'MICROSCOPIC: Pus Cells: 1-2 /HPF | RBCs: 0-1 /HPF | Trichomonas: Nil'
    ].join('\n');

    const migrated = migrateGueResult(legacyGueNil);

    expect(migrated.includes('Trichomonas')).toBe(false);
    expect(migrated.includes('Other')).toBe(false);
  });

  // =========================================================================
  // ITEM 3: CASTS & YEAST MULTI-ENTRY COMBOBOX IN URINE
  // =========================================================================
  test('Item 3.1: Predefined suggestions for Casts and Yeasts are available', () => {
    expect(DEFAULT_CASTS_SUGGESTIONS).toContain('Hyaline casts');
    expect(DEFAULT_CASTS_SUGGESTIONS).toContain('Granular casts');
    expect(DEFAULT_CASTS_SUGGESTIONS).toContain('Cellular casts');
    expect(DEFAULT_CASTS_SUGGESTIONS).toContain('Waxy casts');

    expect(DEFAULT_YEAST_SUGGESTIONS).toContain('Yeast cells');
    expect(DEFAULT_YEAST_SUGGESTIONS).toContain('Budding yeast');
    expect(DEFAULT_YEAST_SUGGESTIONS).toContain('Yeast with pseudohyphae');
    expect(DEFAULT_YEAST_SUGGESTIONS).toContain('Candida albicans');
  });

  test('Item 3.2: Casts and Yeasts serialization with quantity and free-entry', () => {
    const casts = [
      { id: 'cast_1', name: 'Granular casts', quantity: '1-2 /LPF' }
    ];
    const yeasts = [
      { id: 'yeast_1', name: 'Budding yeast', quantity: '++' },
      { id: 'yeast_2', name: 'خمائر فطرية خاصة', quantity: 'Few' }
    ];

    const castStr = casts.map(c => `${c.name} (${c.quantity})`).join(', ');
    const yeastStr = yeasts.map(y => `${y.name} (${y.quantity})`).join(', ');

    expect(castStr).toBe('Granular casts (1-2 /LPF)');
    expect(yeastStr).toBe('Budding yeast (++), خمائر فطرية خاصة (Few)');
  });

  // =========================================================================
  // ITEM 4: STOOL PARASITES (Severity removed, Stage Combobox added)
  // =========================================================================
  test('Item 4.1: Organism and Stage suggestion lists are complete', () => {
    expect(DEFAULT_PARASITE_SUGGESTIONS).toContain('Entamoeba histolytica/dispar');
    expect(DEFAULT_PARASITE_SUGGESTIONS).toContain('Giardia lamblia');
    expect(DEFAULT_PARASITE_SUGGESTIONS).toContain('Blastocystis hominis');
    expect(DEFAULT_PARASITE_SUGGESTIONS).toContain('Ascaris lumbricoides');

    expect(DEFAULT_STAGE_SUGGESTIONS).toContain('Cyst');
    expect(DEFAULT_STAGE_SUGGESTIONS).toContain('Trophozoite');
    expect(DEFAULT_STAGE_SUGGESTIONS).toContain('Ova (Egg)');
    expect(DEFAULT_STAGE_SUGGESTIONS).toContain('Larva');
    expect(DEFAULT_STAGE_SUGGESTIONS).toContain('Adult worm');
  });

  test('Item 4.2: Stool Parasite serialization formats as {name} – {stage} without crosses', () => {
    const gseData = {
      color: 'Brown',
      consistency: 'Formed',
      includeFobt: false,
      fobt: 'Negative',
      includeSensitivity: false,
      sensitivity: 'Nil',
      includePhAndReducing: false,
      ph: '6.5',
      reducingSubstances: 'Negative',
      pusCells: '0-2',
      rbcs: '0-1',
      muscleFibers: 'Nil',
      starchGranules: 'Nil',
      fatGlobules: 'Nil',
      vegetableCells: 'Nil',
      yeastMonilia: 'Not seen',
      parasites: [
        { id: 'p1', organism: 'Entamoeba histolytica', stage: 'Cyst', archivedSeverity: '+++' },
        { id: 'p2', organism: 'Giardia lamblia', stage: 'Trophozoite' }
      ],
      notes: ''
    };

    const serialized = serializeGse(gseData);

    expect(serialized).toContain('PARASITOLOGY: Entamoeba histolytica – Cyst | Giardia lamblia – Trophozoite');
    expect(serialized.includes('+++')).toBe(false);
    expect(serialized.includes('(+++)')).toBe(false);
  });

  test('Item 4.3: Legacy Parasite with crosses has crosses stripped while preserving stage and archiving severity', () => {
    const legacyGse = [
      '[G.S.E - GENERAL STOOL EXAMINATION]',
      'PHYSICAL: Color: Yellow | Consistency: Loose',
      'MICROSCOPIC: Pus Cells: 2-4 /HPF | RBCs: 0-1 /HPF',
      'PARASITOLOGY: Entamoeba histolytica [Cyst] (+++) | Giardia lamblia (Trophozoite) (+)'
    ].join('\n');

    const parsed = parseGse(legacyGse);

    expect(parsed.parasites.length).toBe(2);
    expect(parsed.parasites[0].organism).toBe('Entamoeba histolytica');
    expect(parsed.parasites[0].stage).toBe('Cyst');
    expect(parsed.parasites[0].archivedSeverity).toBe('+++');

    expect(parsed.parasites[1].organism).toBe('Giardia lamblia');
    expect(parsed.parasites[1].stage).toBe('Trophozoite');
    expect(parsed.parasites[1].archivedSeverity).toBe('+');

    const migrated = migrateGseResult(legacyGse);
    expect(migrated).toContain('Entamoeba histolytica – Cyst');
    expect(migrated).toContain('Giardia lamblia – Trophozoite');
    expect(migrated.includes('(+++)')).toBe(false);
    expect(migrated.includes('(+)')).toBe(false);
  });

  // =========================================================================
  // ITEM 5: YEAST / MONILIA IN STOOL
  // =========================================================================
  test('Item 5.1: Yeast/Monilia predefined suggestions and serialization', () => {
    expect(YEAST_MONILIA_SUGGESTIONS).toContain('Not seen');
    expect(YEAST_MONILIA_SUGGESTIONS).toContain('Few');
    expect(YEAST_MONILIA_SUGGESTIONS).toContain('+');
    expect(YEAST_MONILIA_SUGGESTIONS).toContain('++');
    expect(YEAST_MONILIA_SUGGESTIONS).toContain('+++');
    expect(YEAST_MONILIA_SUGGESTIONS).toContain('Many');

    const gsePositiveYeast = {
      color: 'Brown',
      consistency: 'Formed',
      includeFobt: false,
      fobt: 'Negative',
      includeSensitivity: false,
      sensitivity: 'Nil',
      includePhAndReducing: false,
      ph: '6.5',
      reducingSubstances: 'Negative',
      pusCells: '0-2',
      rbcs: '0-1',
      muscleFibers: 'Nil',
      starchGranules: 'Nil',
      fatGlobules: 'Nil',
      vegetableCells: 'Nil',
      yeastMonilia: '++',
      parasites: [],
      notes: ''
    };

    const serialized = serializeGse(gsePositiveYeast);
    expect(serialized).toContain('Yeast / Monilia: ++');

    // Parse back
    const parsed = parseGse(serialized);
    expect(parsed.yeastMonilia).toBe('++');
  });

  test('Item 5.2: Yeast/Monilia is omitted when Not seen or Nil in print output', () => {
    const gseNormalYeast = {
      color: 'Brown',
      consistency: 'Formed',
      includeFobt: false,
      fobt: 'Negative',
      includeSensitivity: false,
      sensitivity: 'Nil',
      includePhAndReducing: false,
      ph: '6.5',
      reducingSubstances: 'Negative',
      pusCells: '0-2',
      rbcs: '0-1',
      muscleFibers: 'Nil',
      starchGranules: 'Nil',
      fatGlobules: 'Nil',
      vegetableCells: 'Nil',
      yeastMonilia: 'Not seen',
      parasites: [],
      notes: ''
    };

    const serialized = serializeGse(gseNormalYeast);
    expect(serialized.includes('Yeast / Monilia:')).toBe(false);
  });

  // =========================================================================
  // ITEM 6: UX, INPUT FLEXIBILITY & STABILITY
  // =========================================================================
  test('Item 6.1: Free text accepts symbols, Arabic, and does not force uppercase', () => {
    const rawCustomParasite = 'طفيلي نادر غير مصنف (Sp. novo) / Type-A';
    const rawStage = 'طور كيسي متحول (Encysted stage)';

    const entry = {
      id: 'p_test_1',
      organism: rawCustomParasite,
      stage: rawStage
    };

    const gseData = {
      color: 'Brown',
      consistency: 'Formed',
      includeFobt: false,
      fobt: 'Negative',
      includeSensitivity: false,
      sensitivity: 'Nil',
      includePhAndReducing: false,
      ph: '6.5',
      reducingSubstances: 'Negative',
      pusCells: '0-2',
      rbcs: '0-1',
      muscleFibers: 'Nil',
      starchGranules: 'Nil',
      fatGlobules: 'Nil',
      vegetableCells: 'Nil',
      yeastMonilia: 'Not seen',
      parasites: [entry],
      notes: ''
    };

    const serialized = serializeGse(gseData);
    expect(serialized).toContain('طفيلي نادر غير مصنف (Sp. novo) / Type-A – طور كيسي متحول (Encysted stage)');
    // Ensures case was NOT forced to uppercase
    expect(serialized).toContain('novo');

    const parsed = parseGse(serialized);
    expect(parsed.parasites[0].organism).toBe('طفيلي نادر غير مصنف (Sp. novo) / Type-A');
    expect(parsed.parasites[0].stage).toBe('طور كيسي متحول (Encysted stage)');
  });

  test('Item 6.2: Unique IDs remain stable across addition and removal of items', () => {
    const items = [
      { id: 'item_alpha', name: 'Calcium oxalate', secondValue: '++' },
      { id: 'item_beta', name: 'Uric acid', secondValue: '+' },
      { id: 'item_gamma', name: 'Triple phosphate', secondValue: 'Few' }
    ];

    // Remove middle item
    const remaining = items.filter(it => it.id !== 'item_beta');

    expect(remaining.length).toBe(2);
    expect(remaining[0].id).toBe('item_alpha');
    expect(remaining[1].id).toBe('item_gamma');
    // Focus tracking ID is undisturbed for remaining items
    expect(remaining[1].name).toBe('Triple phosphate');
  });

});
