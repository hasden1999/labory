const fs = require('fs');
const path = require('path');

const storePath = path.resolve(__dirname, '../apps/web/data/lab_store.json');
if (!fs.existsSync(storePath)) {
  console.error('lab_store.json not found at:', storePath);
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const tests = store.tests || [];

// Exact map by standardized test code
const exactCodeUnits = {
  // Qualitative & Rapid Screening
  'BG': 'Qualitative',
  'HIV': 'Qualitative',
  'HBSAG': 'Qualitative',
  'HCV': 'Qualitative',
  'ROSE': 'Qualitative',
  'HP-AG': 'Qualitative',
  'FOBT': 'Qualitative',
  'VDRL': 'Qualitative',
  'DOA': 'Qualitative',
  'ANA': 'Index',
  'WIDAL': 'Titer',

  // Microscopy & Reports
  'GUE': 'Microscopic',
  'GSE': 'Microscopic',
  'SFA': 'Report',

  // Hematology standard notation
  'WBC': 'x10^3/uL',
  'PLT': 'x10^3/uL',
  'RBC': 'x10^6/uL',
  'HGB': 'g/dL',
  'HB': 'g/dL',
  'HCT': '%',
  'PCV': '%',
  'MCV': 'fL',
  'MCH': 'pg',
  'MCHC': 'g/dL',
  'RDW': '%',
  'ESR': 'mm/1st hr',
  'PT': 'Seconds',
  'INR': 'Ratio',
  'PTT': 'Seconds',
  'APTT': 'Seconds',
  'FIB': 'mg/dL',
  'DDIMER': 'ug/mL',
  'CT': 'min',
  'BT': 'min',

  // Clinical Chemistry & Diabetes
  'FBS': 'mg/dL',
  'RBS': 'mg/dL',
  '2HR-PP': 'mg/dL',
  'OGTT': 'mg/dL',
  'HBA1C': '%',
  'AMY': 'U/L',
  'LIP': 'U/L',
  'LDH': 'U/L',
  'CK': 'U/L',
  'CPK': 'U/L',
  'INSULIN': 'uIU/mL',
  'CPEPTIDE': 'ng/mL',
  'IGF-1': 'ng/mL',
  'IGF1': 'ng/mL',

  // Lipid Profile
  'CHOL': 'mg/dL',
  'TG': 'mg/dL',
  'HDL': 'mg/dL',
  'LDL': 'mg/dL',
  'VLDL': 'mg/dL',

  // Renal & Electrolytes
  'CREAT': 'mg/dL',
  'UREA': 'mg/dL',
  'BUN': 'mg/dL',
  'URIC': 'mg/dL',
  'NA': 'mmol/L',
  'K': 'mmol/L',
  'CL': 'mmol/L',
  'CALC': 'mg/dL',
  'ICAL': 'mmol/L',
  'PHOS': 'mg/dL',
  'MG': 'mg/dL',
  'EGFR': 'mL/min/1.73m²',

  // Liver
  'TSB': 'mg/dL',
  'DIR-BIL': 'mg/dL',
  'INDIR-BIL': 'mg/dL',
  'TBIL': 'mg/dL',
  'DBIL': 'mg/dL',
  'IBIL': 'mg/dL',
  'ALT': 'U/L',
  'AST': 'U/L',
  'ALP': 'U/L',
  'GGT': 'U/L',
  'TP': 'g/dL',
  'ALB': 'g/dL',
  'GLOB': 'g/dL',
  'AG-RATIO': 'Ratio',

  // Thyroid & Hormones
  'TSH': 'uIU/mL',
  'FT3': 'pg/mL',
  'FT4': 'ng/dL',
  'TT3': 'ng/mL',
  'TT4': 'ug/dL',
  'PRL': 'ng/mL',
  'FSH': 'mIU/mL',
  'LH': 'mIU/mL',
  'E2': 'pg/mL',
  'PROG': 'ng/mL',
  'TEST-T': 'ng/dL',
  'TEST-F': 'pg/mL',
  'AMH': 'ng/mL',
  'HCG': 'mIU/mL',
  'BHCG': 'mIU/mL',
  'CORT': 'ug/dL',
  'PTH': 'pg/mL',

  // Vitamins & Minerals
  'VITD': 'ng/mL',
  'VITB12': 'pg/mL',
  'FOLATE': 'ng/mL',
  'IRON': 'ug/dL',
  'FERR': 'ng/mL',
  'TIBC': 'ug/dL',
  'ZINC': 'ug/dL',
  'COPPER': 'ug/dL',

  // Tumor Markers
  'PSA': 'ng/mL',
  'PSA-T': 'ng/mL',
  'PSA-F': 'ng/mL',
  'CEA': 'ng/mL',
  'AFP': 'ng/mL',
  'CA125': 'U/mL',
  'CA153': 'U/mL',
  'CA199': 'U/mL',
  'CA-125': 'U/mL',
  'CA-15-3': 'U/mL',
  'CA-19-9': 'U/mL',

  // Cardiac
  'CKMB': 'U/L',
  'CK-MB': 'U/L',
  'TROP-I': 'ng/mL',
  'TROPI': 'ng/mL',
  'NT-PROBNP': 'pg/mL',
  'MYO': 'ng/mL',
  'HS-CRP': 'mg/L',
  'HSCRP': 'mg/L',
  'HCY': 'umol/L',

  // Inflammation
  'CRP': 'mg/L',
  'ASO': 'IU/mL',
  'RF': 'IU/mL',
};

let changes = 0;
tests.forEach(test => {
  const code = (test.code || '').trim().toUpperCase();
  const targetUnit = exactCodeUnits[code];

  const isMissing = !test.unit || test.unit.trim() === '' || test.unit === 'null' || test.unit === 'undefined';

  if (isMissing && targetUnit) {
    test.unit = targetUnit;
    changes++;
    console.log(`[Set Missing Unit] [${test.code}] ${test.name} -> "${targetUnit}"`);
  } else if (!isMissing && targetUnit && test.unit !== targetUnit) {
    // Only update notation if different (e.g. 10*3/uL -> x10^3/uL or sec -> Seconds or mL/min/1.73m2 -> mL/min/1.73m²)
    const old = test.unit;
    test.unit = targetUnit;
    changes++;
    console.log(`[Normalized Unit] [${test.code}] ${test.name}: "${old}" -> "${targetUnit}"`);
  }
});

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log(`\nDone: ${changes} tests normalized to Iraqi standard units.`);

// Verification: Check if any test still has missing unit
const stillMissing = tests.filter(t => !t.unit || t.unit.trim() === '' || t.unit === 'null' || t.unit === 'undefined');
console.log(`Remaining tests with missing units: ${stillMissing.length}`);
if (stillMissing.length > 0) {
  stillMissing.forEach(t => console.log('  Still missing:', t.code, t.name));
}
