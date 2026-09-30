/**
 * Verification of Print Report HTML for GUE and GSE
 */

const assert = require('assert');

// Simulate the print logic from apps/web/src/app/api/samples/[id]/print/route.ts
function simulatePrintGue(microParts) {
  const printableMicro = microParts
    .map(p => {
      const trimmed = p.trim();
      if (/^trichomonas:/i.test(trimmed)) {
        const val = trimmed.replace(/^trichomonas:\s*/i, '').trim();
        if (val && !['nil', 'none', 'not seen', '-', 'not detected'].includes(val.toLowerCase())) {
          return `Other: Trichomonas: ${val}`;
        }
        return '';
      }
      return trimmed;
    })
    .filter(p => {
      if (!p) return false;
      const up = p.toUpperCase().trim();
      if (up === 'CRYSTALS: NIL' || up === 'CRYSTALS: NONE' || up === 'CRYSTALS: NOT SEEN' || up === 'CRYSTALS:') return false;
      if (up === 'CASTS: NIL' || up === 'CASTS: NONE' || up === 'CASTS: NOT SEEN' || up === 'CASTS:') return false;
      if (up === 'YEAST: NIL' || up === 'YEAST: NONE' || up === 'YEAST: NOT SEEN' || up === 'YEAST:') return false;
      if (up === 'OTHER: NIL' || up === 'OTHER: NONE' || up === 'OTHER: NOT SEEN' || up === 'OTHER:') return false;
      if (up.startsWith('TRICHOMONAS:')) return false;
      return true;
    });

  return printableMicro;
}

function simulatePrintGse(microParts, rawParasitology) {
  // Microscopic filtering (Item 5)
  const printableMicro = microParts.filter(p => {
    const colonIdx = p.indexOf(':');
    const val = colonIdx >= 0 ? p.substring(colonIdx + 1).trim().toLowerCase() : '';
    const key = colonIdx >= 0 ? p.substring(0, colonIdx).trim().toLowerCase() : p.toLowerCase();
    if (key.includes('yeast') || key.includes('monilia')) {
      return Boolean(val) && !['not seen', 'nil', 'none', '-', 'negative'].includes(val);
    }
    return true;
  });

  // Parasitology filtering (Item 4)
  const paraParts = [];
  if (rawParasitology) {
    const items = rawParasitology.split('|').map(p => p.trim()).filter(Boolean);
    items.forEach(item => {
      let cleaned = item
        .replace(/\s*\(\s*\+{1,4}\s*\)/g, '')
        .replace(/\s*:\s*\+{1,4}(?=\s|$)/g, '')
        .replace(/\s+\+{1,4}(?=\s|$)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned && !cleaned.toLowerCase().startsWith('nil') && !cleaned.includes('–') && !cleaned.includes(' - ')) {
        cleaned = cleaned
          .replace(/\s*\[([^\]]+)\]/g, ' – $1')
          .replace(/\s*\(([^)]+)\)/g, ' – $1');
      }
      if (cleaned) paraParts.push(cleaned);
    });
  }

  return { printableMicro, paraParts };
}

console.log('=== VERIFYING PRINT ROUTE LOGIC ===');

// 1. GUE Test
const gueSampleMicro = [
  'Pus Cells: 2-4 /HPF',
  'R.B.Cs: 0-1 /HPF',
  'Crystals: Calcium oxalate (dihydrate) (++), Uric acid (+)',
  'Casts: Hyaline cast (1-2 /LPF), Granular cast (coarse) (Few)',
  'Yeast: Budding yeast (++)',
  'Other: Moderate epithelial cells and mucus observed',
  'Trichomonas: Nil' // Legacy leftover should be completely removed
];

const printedGue = simulatePrintGue(gueSampleMicro);
console.log('Printed GUE Items:', printedGue);
assert(printedGue.some(i => i.includes('Calcium oxalate (dihydrate) (++)')), 'Crystals printed');
assert(printedGue.some(i => i.includes('Hyaline cast (1-2 /LPF)')), 'Casts printed');
assert(printedGue.some(i => i.includes('Budding yeast (++)')), 'Yeast printed');
assert(printedGue.some(i => i.includes('Other: Moderate epithelial cells')), 'Other printed');
assert(!printedGue.some(i => i.toLowerCase().includes('trichomonas')), 'Trichomonas eliminated');

// 2. GSE Test Positive Yeast & Parasites with stages
const gseMicro = [
  'Pus Cells: 0-2 /HPF',
  'RBCs: 0-1 /HPF',
  'Yeast / Monilia: Few'
];
const gseParasitology = 'Entamoeba histolytica/dispar – Cyst | Giardia lamblia – Trophozoite';

const printedGse = simulatePrintGse(gseMicro, gseParasitology);
console.log('Printed GSE Micro:', printedGse.printableMicro);
console.log('Printed GSE Parasitology:', printedGse.paraParts);

assert(printedGse.printableMicro.some(i => i.includes('Yeast / Monilia: Few')), 'Yeast/Monilia shown when Few');
assert.strictEqual(printedGse.paraParts[0], 'Entamoeba histolytica/dispar – Cyst');
assert.strictEqual(printedGse.paraParts[1], 'Giardia lamblia – Trophozoite');
assert(!printedGse.paraParts.some(i => i.includes('+')), 'No severity crosses in parasitology');

// 3. GSE Test Negative / Not seen Yeast
const gseMicroNotSeen = [
  'Pus Cells: 0-2 /HPF',
  'RBCs: 0-1 /HPF',
  'Yeast / Monilia: Not seen'
];
const printedGseNotSeen = simulatePrintGse(gseMicroNotSeen, 'Nil (No ova, cysts, or parasites seen)');
assert(!printedGseNotSeen.printableMicro.some(i => i.includes('Yeast')), 'Not seen Yeast/Monilia omitted from report');
assert.strictEqual(printedGseNotSeen.paraParts[0], 'Nil (No ova, cysts, or parasites seen)');

console.log('✓ ALL PRINT ROUTE VERIFICATIONS PASSED 100%!');
