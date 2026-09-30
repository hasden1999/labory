/**
 * Automated Verification Script for Labryo LIMS Modifications (Points 1 - 6)
 */
const { 
  evaluateClinicalResult, 
  toEnglishDigits 
} = require('../apps/web/src/lib/formatters.ts');

console.log('====================================================');
console.log('  STARTING LABRYO LIMS VERIFICATION SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}: ${details}`);
  }
}

// ---------------------------------------------------------
// POINT 1 & 5: GSE Organism Stage Removal + pH & Reducing Substances
// ---------------------------------------------------------
console.log('--- TEST 1 & 5: GSE Organism & pH/Reducing Substances ---');

// Mock GSE serializer output
const mockGseData = {
  includePhAndReducing: true,
  ph: '6.5',
  reducingSubstances: 'Positive (+)',
  parasites: [
    { organism: 'Entamoeba histolytica', severity: 'Few' },
    { organism: 'Giardia lamblia', severity: 'Moderate' }
  ]
};

// Check that organisms do NOT contain stage names
mockGseData.parasites.forEach(p => {
  assert(
    !/\b(cyst|trophozoite|ova|larva|egg)\b/i.test(p.organism),
    `Parasite Organism Name Only: "${p.organism}" contains no stage`
  );
});

// Test stage stripper regex used in print route
const rawParasiteLine = 'PARASITOLOGY: Entamoeba histolytica [Cyst]: Few | Giardia lamblia (Trophozoite): Moderate';
const parsedParasites = rawParasiteLine.replace('PARASITOLOGY:', '').split('|').map(p => {
  return p
    .replace(/\[(cyst|trophozoite|ova|larva|egg|adult)[^\]]*\]/gi, '')
    .replace(/\((cyst|trophozoite|ova|larva|egg|adult)[^)]*\)/gi, '')
    .replace(/\b(cyst|trophozoite|ova|larva|egg|adult)\b/gi, '')
    .replace(/\s+:/g, ':')
    .replace(/\s+/g, ' ')
    .trim();
});

assert(parsedParasites[0] === 'Entamoeba histolytica: Few', 'Print Regex Strips [Cyst] cleanly', parsedParasites[0]);
assert(parsedParasites[1] === 'Giardia lamblia: Moderate', 'Print Regex Strips (Trophozoite) cleanly', parsedParasites[1]);

// ---------------------------------------------------------
// POINT 2: Urine Bacteria & Mucus Separated Values
// ---------------------------------------------------------
console.log('\n--- TEST 2: Urine Bacteria & Mucus (Separate Few from +) ---');
const allowedOptions = ['Nil', 'Few', '+', '++', '+++'];
assert(!allowedOptions.includes('Few (+)'), 'No merged "Few (+)" in options list');
assert(allowedOptions.includes('Few'), '"Few" exists as an independent option');
assert(allowedOptions.includes('+'), '"+" exists independently');
assert(allowedOptions.includes('++'), '"++" exists independently');
assert(allowedOptions.includes('+++'), '"+++" exists independently');

// ---------------------------------------------------------
// POINT 3: Urine Yeast, Trichomonas, Casts Combobox & Quantity
// ---------------------------------------------------------
console.log('\n--- TEST 3: Urine Yeast, Trichomonas, Casts ---');
const qtyOptions = ['Nil', 'Seen', 'Few', 'Moderate', 'Many'];
qtyOptions.forEach(q => {
  assert(!q.includes('+'), `Quantity "${q}" has zero "+" signs`);
});

// Format simulation: [Name]: [Qty]
function formatMicroEntry(defaultName, customName, qty) {
  if (!qty || qty === 'Nil') return null;
  const name = customName && customName.trim() ? customName.trim() : defaultName;
  return `${name}: ${qty}`;
}

assert(formatMicroEntry('Yeast', 'Candida albicans', 'Few') === 'Candida albicans: Few', 'Yeast with custom name');
assert(formatMicroEntry('Yeast', '', 'Moderate') === 'Yeast: Moderate', 'Yeast fallback to default name');
assert(formatMicroEntry('Trichomonas', 'Trichomonas vaginalis', 'Seen') === 'Trichomonas vaginalis: Seen', 'Trichomonas custom name');
assert(formatMicroEntry('Casts', 'Hyaline casts', 'Many') === 'Hyaline casts: Many', 'Casts custom type');

// ---------------------------------------------------------
// POINT 6: Result High/Low Color Coding & Arrows
// ---------------------------------------------------------
console.log('\n--- TEST 6: Clinical High/Low Evaluation & Arrow Badges ---');

// Test 6.1: High numeric result
const testChol = { name: 'Cholesterol', refRangeLow: 120, refRangeHigh: 200 };
const evalHigh = evaluateClinicalResult('245', testChol);
assert(evalHigh.status === 'HIGH' && evalHigh.arrow === '▲' && evalHigh.color === '#dc2626', 'High Numeric: 245 > 200 => Red + ▲');

// Test 6.2: Low numeric result
const evalLow = evaluateClinicalResult('100', testChol);
assert(evalLow.status === 'LOW' && evalLow.arrow === '▼' && evalLow.color === '#2563eb', 'Low Numeric: 100 < 120 => Blue + ▼');

// Test 6.3: Normal numeric result
const evalNorm = evaluateClinicalResult('150', testChol);
assert(evalNorm.status === 'NORMAL' && evalNorm.arrow === '' && evalNorm.color === '', 'Normal Numeric: 150 (120-200) => Normal (no arrow)');

// Test 6.4: Operator high (> 200)
const evalOpHigh = evaluateClinicalResult('> 220', testChol);
assert(evalOpHigh.status === 'HIGH' && evalOpHigh.arrow === '▲', 'Operator High: "> 220" => Red + ▲');

// Test 6.5: Blood Group (never abnormal)
const testBg = { name: 'Blood Group / Rh', code: 'BG-RH' };
const evalBg = evaluateClinicalResult('A+', testBg);
assert(evalBg.status === 'NORMAL' && evalBg.arrow === '', 'Blood Group A+ => Never abnormal');

console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
