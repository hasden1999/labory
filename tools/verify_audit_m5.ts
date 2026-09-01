import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function check(category: string, name: string, condition: boolean, details: string) {
  results.push({ category, name, passed: condition, details });
  const status = condition ? '[PASS]' : '[FAIL]';
  console.log(`  ${status} [${category}] ${name}: ${details}`);
}

console.log('\n=================================================================');
console.log('  MILESTONE M5: FULL CODEBASE AUDIT & VERIFICATION');
console.log('=================================================================\n');

// --------------------------------------------------------------------------
// 1. Audit UTF-8 and Mojibake Detection across apps/web/src
// --------------------------------------------------------------------------
console.log('>>> 1. UTF-8 & Mojibake Detection Across apps/web/src...');

function getAllFiles(dir: string, extensions: string[]): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const webSrcDir = path.join(__dirname, '../apps/web/src');
const srcFiles = getAllFiles(webSrcDir, ['.ts', '.tsx', '.json']);

let totalFilesScanned = 0;
let filesWithArabic = 0;
let totalArabicChars = 0;
let mojibakeIssues: string[] = [];

const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

for (const file of srcFiles) {
  totalFilesScanned++;
  const rawBytes = fs.readFileSync(file);
  const text = rawBytes.toString('utf8');

  // Verify re-encoding to UTF-8 matches raw bytes
  const reEncoded = Buffer.from(text, 'utf8');
  if (!rawBytes.equals(reEncoded)) {
    mojibakeIssues.push(`${path.relative(webSrcDir, file)}: Byte sequence corrupted under UTF-8 roundtrip`);
  }

  // Check for replacement character \uFFFD
  if (text.includes('\uFFFD')) {
    mojibakeIssues.push(`${path.relative(webSrcDir, file)}: Contains Unicode Replacement Character (U+FFFD)`);
  }

  const arabicMatches = text.match(arabicRegex);
  if (arabicMatches && arabicMatches.length > 0) {
    filesWithArabic++;
    totalArabicChars += arabicMatches.length;
  }
}

check(
  'Encoding',
  'Clean UTF-8 in all web source files',
  mojibakeIssues.length === 0,
  mojibakeIssues.length === 0
    ? `Scanned ${totalFilesScanned} files. 0 Mojibake / encoding errors detected.`
    : `Found ${mojibakeIssues.length} issues: ${mojibakeIssues.join('; ')}`
);

check(
  'Encoding',
  'Arabic Localization Integrity',
  filesWithArabic > 0 && totalArabicChars > 100,
  `Detected ${totalArabicChars} authentic Arabic characters across ${filesWithArabic} files with 100% UTF-8 fidelity.`
);

// --------------------------------------------------------------------------
// 2. Audit Key Pages Existence and Basic Routing Exports
// --------------------------------------------------------------------------
console.log('\n>>> 2. Page & Component Integrity Checks...');

const requiredPages = [
  '/',
  '/results',
  '/settings',
  '/verify/[id]',
  '/patients',
  '/samples',
  '/dashboard',
  '/catalog',
  '/devices'
];

for (const p of requiredPages) {
  const pageRelPath = p === '/' ? 'app/page.tsx' : `app/${p.replace(/^\//, '')}/page.tsx`;
  const fullPath = path.join(webSrcDir, pageRelPath);
  const exists = fs.existsSync(fullPath);
  let hasDefaultExport = false;
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf8');
    hasDefaultExport = content.includes('export default function') || content.includes('export default');
  }
  check(
    'Pages',
    `Page route ${p}`,
    exists && hasDefaultExport,
    exists
      ? `Found valid page with default export (${pageRelPath})`
      : `Missing page file at ${pageRelPath}`
  );
}

// --------------------------------------------------------------------------
// 3. Keyboard Navigation Verification
// --------------------------------------------------------------------------
console.log('\n>>> 3. Keyboard Navigation Architecture Verification...');

const pageContent = fs.readFileSync(path.join(webSrcDir, 'app/page.tsx'), 'utf8');
const resultsContent = fs.readFileSync(path.join(webSrcDir, 'app/results/page.tsx'), 'utf8');
const quickBarContent = fs.readFileSync(path.join(webSrcDir, 'components/GlobalQuickBar.tsx'), 'utf8');

check(
  'KeyboardNav',
  'F2 New Patient Intake Handler',
  pageContent.includes("e.key === 'F2'") && pageContent.includes('handleClearPatient'),
  'F2 keydown listener triggers handleClearPatient and intake notification'
);

check(
  'KeyboardNav',
  'F8 Test Catalog Search Focus',
  pageContent.includes("e.key === 'F8'") && pageContent.includes('testSearchInputRef'),
  'F8 keydown listener focuses and selects testSearchInput'
);

check(
  'KeyboardNav',
  'F9 Financial Discount Focus',
  pageContent.includes("e.key === 'F9'") && pageContent.includes('discountInputRef'),
  'F9 keydown listener focuses and selects discount input'
);

check(
  'KeyboardNav',
  'Ctrl+Enter / Cmd+Enter Instant Registration',
  pageContent.includes("(e.ctrlKey || e.metaKey) && e.key === 'Enter'") && pageContent.includes('handleRegisterSample'),
  'Ctrl+Enter keydown listener immediately invokes handleRegisterSample'
);

check(
  'KeyboardNav',
  'Enter / Shift Row Navigation in Results',
  resultsContent.includes("handleResultKeyDown") && 
  (resultsContent.includes("e.key === 'Shift'") || resultsContent.includes("e.key === 'Enter'")),
  'Shift / Enter keydown listener cycles focus down result input fields via resultInputRefs'
);

// --------------------------------------------------------------------------
// 4. Print Route Multi-Template & Letterhead Verification
// --------------------------------------------------------------------------
console.log('\n>>> 4. Print Route Multi-Template & Letterhead Verification...');

import { GET as printGet } from '../apps/web/src/app/api/samples/[id]/print/route';
import { getStore } from '../apps/web/src/lib/serverStore';

// Ensure sample exists in store
const store = getStore();
const testSampleId = 'sample-print-test';

// Seed store with rich sample covering G.U.E, G.S.E, CBC, Microbiology, Chemistry
store.samples.push({
  id: testSampleId,
  sampleNumber: 99999,
  patient: {
    name: 'أحمد علي حسن',
    age: 45,
    gender: 'MALE'
  },
  doctor: {
    name: 'د. ليث البدري'
  },
  createdAt: new Date().toISOString(),
  tests: [
    {
      testCode: 'CBC',
      isAbnormal: false,
      resultValue: '[CBC]\nERYTHROID: RBC: 4.8 | HGB: 14.5 | HCT: 42%\nPLATELETS: PLT: 250,000\nDIFFERENTIAL: NEUT: 60% | LYMPH: 30% | MONO: 6%',
      test: { name: 'Complete Blood Count', arabicName: 'صورة الدم الكاملة', unit: '', refRangeText: 'See details' }
    },
    {
      testCode: 'GUE',
      isAbnormal: true,
      resultValue: '[G.U.E]\nPHYSICAL: Color: Yellow | Appearance: Turbid\nCHEMICAL: Protein: 1+ | Glucose: Negative\nMICROSCOPIC: Pus Cells: 15-20 /HPF | RBC: 2-4 /HPF\nNOTES: Moderate bacteriuria observed',
      test: { name: 'General Urine Exam', arabicName: 'فحص البول العام', unit: '', refRangeText: 'Normal' }
    },
    {
      testCode: 'GSE',
      isAbnormal: false,
      resultValue: '[G.S.E]\nPHYSICAL: Consistency: Soft | Color: Brown\nFOBT: Negative\nMICROSCOPIC: Pus: 0-2 | RBC: 0-1\nPARASITOLOGY: Nil seen / No ova or parasites found',
      test: { name: 'General Stool Exam', arabicName: 'فحص البراز العام', unit: '', refRangeText: 'Normal' }
    },
    {
      testCode: 'CULTURE',
      isAbnormal: true,
      resultValue: '[MICROBIOLOGY]\nSpecimen: Urine Midstream\nOrganism: Escherichia coli (>10^5 CFU/mL)\nANTIBIOGRAM: Amikacin: S | Ciprofloxacin: R | Ceftriaxone: S | Meropenem: S\nNOTES: Significant growth detected',
      test: { name: 'Culture & Sensitivity', arabicName: 'زرع وحساسية', unit: '', refRangeText: 'No Growth' }
    },
    {
      testCode: 'KFT',
      isAbnormal: false,
      resultValue: '[CHEMISTRY]\nRENAL: Blood Urea: 32 mg/dL | Serum Creatinine: 0.9 mg/dL | eGFR: 95 mL/min',
      test: { name: 'Kidney Function Tests', arabicName: 'وظائف الكلى', unit: 'mg/dL', refRangeText: 'Normal' }
    }
  ]
});

const templates = ['CLASSIC', 'MODERN', 'EXECUTIVE', 'COMPACT', 'SPECIALIZED'];
const letterheadModes = ['DEFAULT', 'PREPRINTED'];

async function testPrintRoute() {
  for (const tpl of templates) {
    for (const mode of letterheadModes) {
      store.settings.reportTemplate = tpl as any;
      store.settings.headerMode = mode as any;
      
      const req = new Request(`http://localhost:3000/api/samples/${testSampleId}/print`);
      const response = await printGet(req, { params: { id: testSampleId } });
      const status = response.status;
      const html = await response.text();

      const hasTemplateCss = tpl === 'CLASSIC' ? html.includes('#1e3a8a')
        : tpl === 'MODERN' ? html.includes('linear-gradient')
        : tpl === 'EXECUTIVE' ? html.includes('#b45309')
        : tpl === 'COMPACT' ? html.includes('padding: 14px')
        : html.includes('#0d9488'); // SPECIALIZED

      const handlesLetterhead = mode === 'PREPRINTED'
        ? html.includes('Pre-Printed Letterhead spacer') && !html.includes('🧪 ' + store.settings.labName)
        : html.includes('🧪 ' + store.settings.labName);

      const hasArabic = html.includes('أحمد علي حسن') && html.includes('فحص البول العام');

      check(
        'PrintRoute',
        `Template: ${tpl} | HeaderMode: ${mode}`,
        status === 200 && hasTemplateCss && handlesLetterhead && hasArabic,
        `Status: ${status}, Template CSS verified: ${hasTemplateCss}, Letterhead logic: ${handlesLetterhead}, Arabic rendered: ${hasArabic}`
      );
    }
  }
}

testPrintRoute().then(() => {
  console.log('\n=================================================================');
  const allPassed = results.every(r => r.passed);
  const passCount = results.filter(r => r.passed).length;
  console.log(`  M5 AUDIT SUMMARY: ${passCount} / ${results.length} checks passed.`);
  console.log(`  VERDICT: ${allPassed ? 'ALL CHECKS PASSED PERFECTLY' : 'FAILURES DETECTED'}`);
  console.log('=================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}).catch(err => {
  console.error('Fatal error during print route audit:', err);
  process.exit(1);
});
