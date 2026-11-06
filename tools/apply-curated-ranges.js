const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../packages/data/src/catalog/catalogData.ts');
const curatedFilePath = path.resolve(__dirname, '../packages/data/src/catalog/curatedRanges.json');

let curated = {};
if (fs.existsSync(curatedFilePath)) {
  curated = JSON.parse(fs.readFileSync(curatedFilePath, 'utf8'));
}

let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'export const INITIAL_TESTS_CATALOG: TestItem[] = ';
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf('export const INITIAL_PANELS');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate markers in catalogData.ts');
  process.exit(1);
}

// Find semicolon before INITIAL_PANELS
const semiIdx = content.lastIndexOf(';', endIdx);

const jsonStr = content.substring(startIdx + startMarker.length, semiIdx).trim();
const tests = JSON.parse(jsonStr);
console.log('Original tests count:', tests.length);

let updatedCount = 0;
for (const t of tests) {
  if (curated[t.code]) {
    const c = curated[t.code];
    if (c.unit !== undefined) t.unit = c.unit;
    if (c.refRangeLow !== undefined) t.refRangeLow = c.refRangeLow;
    if (c.refRangeHigh !== undefined) t.refRangeHigh = c.refRangeHigh;
    if (c.refRangeText !== undefined) t.refRangeText = c.refRangeText;
    if (c.normalRange !== undefined) t.normalRange = c.normalRange;
    updatedCount++;
  } else if (t.normalRange === 'Normal') {
    const nameLower = (t.name || '').toLowerCase();
    const catLower = (t.category || '').toLowerCase();
    if (nameLower.includes('mutation') || nameLower.includes('gene') || nameLower.includes('pcr') || nameLower.includes('dna') || nameLower.includes('rna')) {
      t.normalRange = 'Not detected';
      t.refRangeText = 'Not detected';
      updatedCount++;
    } else if (
      nameLower.includes('antibody') ||
      nameLower.includes('screen') ||
      nameLower.includes('stain') ||
      nameLower.includes('parasite') ||
      nameLower.includes('smear') ||
      nameLower.includes('antigen') ||
      nameLower.includes('test') ||
      nameLower.includes('rapid') ||
      nameLower.includes('agglutin') ||
      nameLower.includes('strip') ||
      catLower.includes('مناعة') ||
      catLower.includes('فيروسات')
    ) {
      t.normalRange = 'Negative';
      t.refRangeText = 'Negative';
      updatedCount++;
    } else {
      t.normalRange = '—';
      t.refRangeText = t.refRangeText && t.refRangeText !== 'Normal' ? t.refRangeText : '—';
      updatedCount++;
    }
  }
}

console.log('Updated tests count:', updatedCount);
const newJsonStr = JSON.stringify(tests, null, 2);
content = content.substring(0, startIdx + startMarker.length) + newJsonStr + content.substring(semiIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated catalogData.ts from curatedRanges.json!');
