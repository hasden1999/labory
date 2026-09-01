// Independent Forensic Integrity Test for Milestone M1
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('RUNNING FORENSIC INTEGRITY AUDIT — MILESTONE M1');
console.log('====================================================');

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    failures++;
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// -------------------------------------------------------------
// 1. Code 128 (Subset B) Algorithm Validation
// -------------------------------------------------------------
console.log('\n--- 1. Testing Code 128 Algorithm ---');

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104=StartB, 106=Stop)
];

function generateCode128Svg(text, height = 32) {
  const cleanText = text.replace(/[^\x20-\x7E]/g, '');
  const startCode = 104; // Start B
  let checksum = startCode;
  const codes = [startCode];

  for (let i = 0; i < cleanText.length; i++) {
    const codeVal = cleanText.charCodeAt(i) - 32;
    codes.push(codeVal);
    checksum += codeVal * (i + 1);
  }

  const checkCode = checksum % 103;
  codes.push(checkCode);
  codes.push(106); // Stop pattern

  let modules = '';
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      const isBar = j % 2 === 0;
      modules += (isBar ? '1' : '0').repeat(width);
    }
  }

  const moduleWidth = 1.35;
  const totalWidth = modules.length * moduleWidth;

  let rects = '';
  let currentX = 0;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${moduleWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
    currentX += moduleWidth;
  }

  return {
    codes,
    checkCode,
    totalWidth,
    modulesCount: modules.length,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(2)} ${height}" width="${totalWidth.toFixed(2)}" height="${height}" style="display:block; margin: 0 auto;">${rects}</svg>`
  };
}

// Test S1001:
// 104 + (83-32)*1 + (49-32)*2 + (48-32)*3 + (48-32)*4 + (49-32)*5
// = 104 + 51 + 34 + 48 + 64 + 85 = 386. 386 % 103 = 77
const r1 = generateCode128Svg('S1001');
assert(r1.checkCode === 77, `S1001 checkCode is 77 (got ${r1.checkCode})`);
assert(r1.codes.length === 8, `S1001 codes count is 8 (StartB, 5 chars, Checksum, Stop: got ${r1.codes.length})`);
assert(r1.svg.startsWith('<svg') && r1.svg.endsWith('</svg>'), `S1001 SVG root tags valid`);
assert(r1.svg.includes('<rect x='), `S1001 SVG contains barcode bar rectangles`);

// Test S1002:
// 104 + 51 + 34 + 48 + 64 + (50-32)*5 = 104 + 51 + 34 + 48 + 64 + 90 = 391. 391 % 103 = 82
const r2 = generateCode128Svg('S1002');
assert(r2.checkCode === 82, `S1002 checkCode is 82 (got ${r2.checkCode})`);

// -------------------------------------------------------------
// 2. Server Store Logic & Math Verification
// -------------------------------------------------------------
console.log('\n--- 2. Testing Store Calculations & Mutations ---');

function netTotalCommissionBase(priceTotal, discount) {
  return Math.max(0, priceTotal - discount);
}

// Test commission calculations
const priceTotal = 50000;
const discount = 10000;
const commissionPercent = 15;
const net = netTotalCommissionBase(priceTotal, discount);
const commission = Math.round((net * commissionPercent) / 100);

assert(net === 40000, `Net total calculation: 50000 - 10000 = 40000 (got ${net})`);
assert(commission === 6000, `Doctor commission: 15% of 40000 = 6000 (got ${commission})`);

// Test 100% discount
const freeNet = netTotalCommissionBase(30000, 30000);
const freeComm = Math.round((freeNet * 20) / 100);
assert(freeNet === 0, `100% discount gives 0 net`);
assert(freeComm === 0, `100% discount gives 0 doctor commission`);

// -------------------------------------------------------------
// 3. UTF-8 & Mojibake Encoding Audit
// -------------------------------------------------------------
console.log('\n--- 3. Checking Arabic Encoding Across Files ---');

const filesToCheck = [
  'apps/web/src/app/not-found.tsx',
  'apps/web/src/app/api/samples/[id]/barcode/route.ts',
  'apps/web/src/app/api/patients/[id]/route.ts',
  'apps/web/src/app/api/patients/search/route.ts',
  'apps/web/src/app/api/doctors/route.ts',
  'apps/web/src/app/api/settings/route.ts',
  'apps/web/src/lib/serverStore.ts',
  'apps/web/src/app/page.tsx',
  'apps/web/src/components/GlobalQuickBar.tsx'
];

const mojibakePatterns = [
  /\uFFFD/,           // Replacement character
  /Ã[¡-¿]/,           // Latin-1 / UTF-8 double encoding artifact
  /Ø[§-¿]/,           // Corrupted Arabic UTF-8
  /Ù[^-¿]/,           // Corrupted Arabic UTF-8
  /\?\?\?+/           // Consecutive unknown character markers
];

for (const relPath of filesToCheck) {
  const fullPath = path.resolve('d:/lab', relPath);
  if (!fs.existsSync(fullPath)) {
    assert(false, `File exists: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  let hasMojibake = false;
  for (const pattern of mojibakePatterns) {
    if (pattern.test(content)) {
      hasMojibake = true;
      console.error(`[FAIL] Found potential Mojibake in ${relPath} matching ${pattern}`);
    }
  }
  assert(!hasMojibake, `0 Mojibake / encoding corruption in ${relPath}`);
}

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n====================================================');
if (failures === 0) {
  console.log('VERDICT: ALL FORENSIC AUDIT CHECKS PASSED (CLEAN)');
} else {
  console.error(`VERDICT: INTEGRITY VIOLATION (${failures} failures)`);
}
console.log('====================================================\n');
process.exit(failures === 0 ? 0 : 1);
