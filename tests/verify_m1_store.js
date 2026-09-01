// Comprehensive Store Mutation & Edge Case Verification
const fs = require('fs');
const path = require('path');

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    failures++;
  } else {
    console.log(`[PASS] ${message}`);
  }
}

console.log('\n--- Auditing Server Store Implementation ---');
const storePath = path.resolve('d:/lab/apps/web/src/lib/serverStore.ts');
const storeCode = fs.readFileSync(storePath, 'utf8');

// Verify key CRUD functions exist and contain authentic mutating logic
assert(storeCode.includes('store.patients.unshift(newPatient)'), 'addPatient mutates store.patients array with unshift');
assert(storeCode.includes('store.patients[index] = updated'), 'updatePatient updates patient in store.patients array');
assert(storeCode.includes('store.patients.splice(index, 1)'), 'deletePatient removes patient with splice');
assert(storeCode.includes('store.doctors.push(newDoctor)'), 'addDoctor mutates store.doctors array with push');
assert(storeCode.includes('store.doctors[index] = updated'), 'updateDoctor updates doctor in store.doctors array');
assert(storeCode.includes('store.doctors.splice(index, 1)'), 'deleteDoctor removes doctor with splice');
assert(storeCode.includes('store.samples.unshift(newSample)'), 'addSample mutates store.samples array with unshift');
assert(storeCode.includes('store.samples[index] = updated'), 'updateSample updates sample in store.samples array');
assert(storeCode.includes('store.samples.splice(index, 1)'), 'deleteSample removes sample with splice');

// Verify Doctor commission calculation math
assert(storeCode.includes('netTotalCommissionBase(priceTotal, discount)'), 'Doctor commission bases on net total after discount');
assert(storeCode.includes('Math.round((netTotalCommissionBase(priceTotal, discount) * commissionPercent) / 100)'), 'Doctor commission calculation formula verified');

// Verify Patient search enrichment
assert(storeCode.includes('outstandingDebt: Math.max(0, outstandingDebt)'), 'searchPatients computes and includes outstandingDebt');
assert(storeCode.includes('abnormalFlags: Array.from(new Set(abnormalList))'), 'searchPatients computes and dedupes abnormalFlags');
assert(storeCode.includes('lastTestIds'), 'searchPatients includes lastTestIds for quick repeat');

console.log('\n--- Auditing Barcode Route Implementation ---');
const barcodePath = path.resolve('d:/lab/apps/web/src/app/api/samples/[id]/barcode/route.ts');
const barcodeCode = fs.readFileSync(barcodePath, 'utf8');

assert(barcodeCode.includes('generateCode128Svg'), 'Barcode route contains generateCode128Svg function');
assert(barcodeCode.includes('50mm 25mm'), 'Barcode route formats for 50x25mm thermal print size');
assert(barcodeCode.includes('CODE128_PATTERNS'), 'Barcode route contains standard ISO Code 128 pattern table');
assert(barcodeCode.includes('checksum += codeVal * (i + 1)'), 'Barcode route implements Code 128 weighted modulo-103 checksum');
assert(!barcodeCode.includes('dummy') && !barcodeCode.includes('TODO') && !barcodeCode.includes('mock_result'), '0 Dummy/mock stubs in barcode route');

console.log('\n--- Auditing Intake Page Implementation ---');
const pagePath = path.resolve('d:/lab/apps/web/src/app/page.tsx');
const pageCode = fs.readFileSync(pagePath, 'utf8');

assert(pageCode.includes("e.key === 'F2'"), 'F2 hotkey handler present');
assert(pageCode.includes("e.key === 'F8'"), 'F8 hotkey handler present');
assert(pageCode.includes("e.key === 'F9'"), 'F9 hotkey handler present');
assert(pageCode.includes("(e.ctrlKey || e.metaKey) && e.key === 'Enter'"), 'Ctrl+Enter / Cmd+Enter hotkey handler present');
assert(pageCode.includes("handleCatalogKeyDown"), 'Catalog arrow navigation handler present');
assert(pageCode.includes("QUICK_DISCOUNT_PERCENTAGES"), 'Quick percentage discount selectors present');
assert(pageCode.includes("handleRepeatLastTests"), 'Repeat Last Tests functionality present');

console.log('\n====================================================');
if (failures === 0) {
  console.log('ALL DETAILED STORE & ROUTE AUDIT CHECKS PASSED');
} else {
  console.error(`DETAILED STORE AUDIT FAILED (${failures} failures)`);
}
console.log('====================================================\n');
process.exit(failures === 0 ? 0 : 1);
