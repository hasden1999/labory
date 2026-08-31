export interface PresetMapping {
  deviceTestCode: string;
  deviceTestName: string;
  testCatalogCode: string;
  testCatalogName: string;
  unit?: string;
  multiplier?: number;
}

export interface DevicePreset {
  id: string;
  brand: string;
  model: string;
  category: 'CBC' | 'CHEMISTRY' | 'IMMUNOLOGY' | 'URINE' | 'ELECTROLYTES' | 'OTHER';
  connectionType: 'TCP_IP' | 'SERIAL_PORT' | 'FILE_WATCHER';
  protocol: 'ASTM_1394' | 'HL7_V2' | 'CSV_DELIMITED' | 'CUSTOM_TEXT';
  defaultPort?: number;
  defaultBaudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: string;
  description: string;
  arabicDescription: string;
  defaultMappings: PresetMapping[];
}

export const DEVICE_PRESETS: DevicePreset[] = [
  // Mindray CBC Analyzers
  {
    id: 'mindray_bc5000',
    brand: 'Mindray',
    model: 'BC-5000 / BC-5150 / BC-5180',
    category: 'CBC',
    connectionType: 'TCP_IP',
    protocol: 'HL7_V2',
    defaultPort: 5100,
    description: 'Mindray 5-Part Auto Hematology Analyzer (HL7 over LAN TCP/IP)',
    arabicDescription: 'جهاز صورة الدم الكاملة ميندراي خماسي الفئات عبر شبكة LAN',
    defaultMappings: [
      { deviceTestCode: 'WBC', deviceTestName: 'White Blood Cells', testCatalogCode: 'CBC-WBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'Red Blood Cells', testCatalogCode: 'CBC-RBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'Hemoglobin', testCatalogCode: 'CBC-HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'Hematocrit (PCV)', testCatalogCode: 'CBC-PCV', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'MCV', deviceTestName: 'Mean Corpuscular Volume', testCatalogCode: 'CBC-MCV', testCatalogName: 'MCV', unit: 'fL' },
      { deviceTestCode: 'MCH', deviceTestName: 'Mean Corpuscular Hemoglobin', testCatalogCode: 'CBC-MCH', testCatalogName: 'MCH', unit: 'pg' },
      { deviceTestCode: 'MCHC', deviceTestName: 'MCHC', testCatalogCode: 'CBC-MCHC', testCatalogName: 'MCHC', unit: 'g/dL' },
      { deviceTestCode: 'PLT', deviceTestName: 'Platelets', testCatalogCode: 'CBC-PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'NEU%', deviceTestName: 'Neutrophils %', testCatalogCode: 'CBC-NEUT', testCatalogName: 'Neutrophils %', unit: '%' },
      { deviceTestCode: 'LYM%', deviceTestName: 'Lymphocytes %', testCatalogCode: 'CBC-LYMPH', testCatalogName: 'Lymphocytes %', unit: '%' },
      { deviceTestCode: 'MON%', deviceTestName: 'Monocytes %', testCatalogCode: 'CBC-MONO', testCatalogName: 'Monocytes %', unit: '%' },
      { deviceTestCode: 'EOS%', deviceTestName: 'Eosinophils %', testCatalogCode: 'CBC-EOS', testCatalogName: 'Eosinophils %', unit: '%' },
      { deviceTestCode: 'BAS%', deviceTestName: 'Basophils %', testCatalogCode: 'CBC-BASO', testCatalogName: 'Basophils %', unit: '%' },
      { deviceTestCode: 'RDW-CV', deviceTestName: 'RDW-CV', testCatalogCode: 'CBC-RDW', testCatalogName: 'RDW-CV', unit: '%' },
    ],
  },
  {
    id: 'mindray_bc3000',
    brand: 'Mindray',
    model: 'BC-3000 Plus / BC-2800 / BC-20s',
    category: 'CBC',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    defaultBaudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    description: 'Mindray 3-Part Auto Hematology Analyzer (ASTM over RS-232 / USB COM)',
    arabicDescription: 'جهاز صورة الدم الكاملة ميندراي ثلاثي الفئات عبر منفذ السيريال',
    defaultMappings: [
      { deviceTestCode: 'WBC', deviceTestName: 'White Blood Cells', testCatalogCode: 'CBC-WBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'Red Blood Cells', testCatalogCode: 'CBC-RBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'Hemoglobin', testCatalogCode: 'CBC-HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'Hematocrit (PCV)', testCatalogCode: 'CBC-PCV', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'MCV', deviceTestName: 'Mean Corpuscular Volume', testCatalogCode: 'CBC-MCV', testCatalogName: 'MCV', unit: 'fL' },
      { deviceTestCode: 'MCH', deviceTestName: 'Mean Corpuscular Hemoglobin', testCatalogCode: 'CBC-MCH', testCatalogName: 'MCH', unit: 'pg' },
      { deviceTestCode: 'MCHC', deviceTestName: 'MCHC', testCatalogCode: 'CBC-MCHC', testCatalogName: 'MCHC', unit: 'g/dL' },
      { deviceTestCode: 'PLT', deviceTestName: 'Platelets', testCatalogCode: 'CBC-PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'LYM%', deviceTestName: 'Lymphocytes %', testCatalogCode: 'CBC-LYMPH', testCatalogName: 'Lymphocytes %', unit: '%' },
      { deviceTestCode: 'MID%', deviceTestName: 'Mixed cells %', testCatalogCode: 'CBC-MID', testCatalogName: 'MID / Monocytes %', unit: '%' },
      { deviceTestCode: 'GRAN%', deviceTestName: 'Granulocytes %', testCatalogCode: 'CBC-NEUT', testCatalogName: 'Granulocytes (Neutrophils) %', unit: '%' },
    ],
  },

  // Sysmex CBC Analyzers
  {
    id: 'sysmex_xp300',
    brand: 'Sysmex',
    model: 'XP-300 / XP-100 / KX-21N',
    category: 'CBC',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    defaultBaudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    description: 'Sysmex 3-Part Automated Hematology Analyzer (ASTM 1394 Serial)',
    arabicDescription: 'جهاز صورة الدم الكاملة سيسمكس ثلاثي الفئات عبر كابل السيريال',
    defaultMappings: [
      { deviceTestCode: 'WBC', deviceTestName: 'WBC', testCatalogCode: 'CBC-WBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'RBC', testCatalogCode: 'CBC-RBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'HGB', testCatalogCode: 'CBC-HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'HCT', testCatalogCode: 'CBC-PCV', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'MCV', deviceTestName: 'MCV', testCatalogCode: 'CBC-MCV', testCatalogName: 'MCV', unit: 'fL' },
      { deviceTestCode: 'MCH', deviceTestName: 'MCH', testCatalogCode: 'CBC-MCH', testCatalogName: 'MCH', unit: 'pg' },
      { deviceTestCode: 'MCHC', deviceTestName: 'MCHC', testCatalogCode: 'CBC-MCHC', testCatalogName: 'MCHC', unit: 'g/dL' },
      { deviceTestCode: 'PLT', deviceTestName: 'PLT', testCatalogCode: 'CBC-PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'LYM%', deviceTestName: 'LYM%', testCatalogCode: 'CBC-LYMPH', testCatalogName: 'Lymphocytes %', unit: '%' },
      { deviceTestCode: 'MXD%', deviceTestName: 'MXD%', testCatalogCode: 'CBC-MID', testCatalogName: 'Mixed cells %', unit: '%' },
      { deviceTestCode: 'NEUT%', deviceTestName: 'NEUT%', testCatalogCode: 'CBC-NEUT', testCatalogName: 'Neutrophils %', unit: '%' },
    ],
  },
  {
    id: 'sysmex_xn',
    brand: 'Sysmex',
    model: 'XN-350 / XN-550 / XN-L Series',
    category: 'CBC',
    connectionType: 'TCP_IP',
    protocol: 'HL7_V2',
    defaultPort: 5000,
    description: 'Sysmex XN-L Series 5-Part Hematology Analyzer (HL7 over TCP/IP)',
    arabicDescription: 'جهاز صورة الدم الكاملة سيسمكس XN خماسي الفئات عبر شبكة LAN',
    defaultMappings: [
      { deviceTestCode: 'WBC', deviceTestName: 'WBC', testCatalogCode: 'CBC-WBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'RBC', testCatalogCode: 'CBC-RBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'HGB', testCatalogCode: 'CBC-HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'HCT', testCatalogCode: 'CBC-PCV', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'PLT', deviceTestName: 'PLT', testCatalogCode: 'CBC-PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'NEUT#', deviceTestName: 'Neutrophils Count', testCatalogCode: 'CBC-NEUT-ABS', testCatalogName: 'Absolute Neutrophils', unit: '10^3/uL' },
      { deviceTestCode: 'LYMPH#', deviceTestName: 'Lymphocytes Count', testCatalogCode: 'CBC-LYMPH-ABS', testCatalogName: 'Absolute Lymphocytes', unit: '10^3/uL' },
    ],
  },

  // Chemistry Analyzers
  {
    id: 'mindray_bs200',
    brand: 'Mindray',
    model: 'BS-120 / BS-200 / BS-240 / BS-380',
    category: 'CHEMISTRY',
    connectionType: 'TCP_IP',
    protocol: 'HL7_V2',
    defaultPort: 5100,
    description: 'Mindray Auto Chemistry Analyzer (HL7 / ASTM over LAN)',
    arabicDescription: 'جهاز الكيمياء السريرية الآلي ميندراي عبر الشبكة المحلية',
    defaultMappings: [
      { deviceTestCode: 'GLU', deviceTestName: 'Glucose', testCatalogCode: 'GLU-FBS', testCatalogName: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL' },
      { deviceTestCode: 'UREA', deviceTestName: 'Urea', testCatalogCode: 'KFT-UREA', testCatalogName: 'Blood Urea', unit: 'mg/dL' },
      { deviceTestCode: 'CREA', deviceTestName: 'Creatinine', testCatalogCode: 'KFT-CREAT', testCatalogName: 'Serum Creatinine', unit: 'mg/dL' },
      { deviceTestCode: 'UA', deviceTestName: 'Uric Acid', testCatalogCode: 'KFT-UA', testCatalogName: 'Uric Acid', unit: 'mg/dL' },
      { deviceTestCode: 'ALT', deviceTestName: 'ALT / SGPT', testCatalogCode: 'LFT-ALT', testCatalogName: 'ALT (SGPT)', unit: 'U/L' },
      { deviceTestCode: 'AST', deviceTestName: 'AST / SGOT', testCatalogCode: 'LFT-AST', testCatalogName: 'AST (SGOT)', unit: 'U/L' },
      { deviceTestCode: 'ALP', deviceTestName: 'Alkaline Phosphatase', testCatalogCode: 'LFT-ALP', testCatalogName: 'Alkaline Phosphatase (ALP)', unit: 'U/L' },
      { deviceTestCode: 'TBIL', deviceTestName: 'Total Bilirubin', testCatalogCode: 'LFT-TBIL', testCatalogName: 'Total Bilirubin (TSB)', unit: 'mg/dL' },
      { deviceTestCode: 'DBIL', deviceTestName: 'Direct Bilirubin', testCatalogCode: 'LFT-DBIL', testCatalogName: 'Direct Bilirubin', unit: 'mg/dL' },
      { deviceTestCode: 'CHOL', deviceTestName: 'Total Cholesterol', testCatalogCode: 'LIPID-CHOL', testCatalogName: 'Total Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'TRIG', deviceTestName: 'Triglycerides', testCatalogCode: 'LIPID-TG', testCatalogName: 'Triglycerides (TG)', unit: 'mg/dL' },
      { deviceTestCode: 'HDL', deviceTestName: 'HDL Cholesterol', testCatalogCode: 'LIPID-HDL', testCatalogName: 'HDL - Good Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'LDL', deviceTestName: 'LDL Cholesterol', testCatalogCode: 'LIPID-LDL', testCatalogName: 'LDL - Bad Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'ALB', deviceTestName: 'Albumin', testCatalogCode: 'LFT-ALB', testCatalogName: 'Serum Albumin', unit: 'g/dL' },
      { deviceTestCode: 'TP', deviceTestName: 'Total Protein', testCatalogCode: 'LFT-TP', testCatalogName: 'Total Protein', unit: 'g/dL' },
    ],
  },
  {
    id: 'roche_cobas_c111',
    brand: 'Roche',
    model: 'Cobas c111 / c311',
    category: 'CHEMISTRY',
    connectionType: 'TCP_IP',
    protocol: 'ASTM_1394',
    defaultPort: 5000,
    description: 'Roche Cobas Clinical Chemistry Analyzer (ASTM 1394 over TCP/IP)',
    arabicDescription: 'جهاز الكيمياء السريرية روش كوباس عبر شبكة LAN',
    defaultMappings: [
      { deviceTestCode: 'GLUC', deviceTestName: 'Glucose', testCatalogCode: 'GLU-FBS', testCatalogName: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL' },
      { deviceTestCode: 'UREA', deviceTestName: 'Urea', testCatalogCode: 'KFT-UREA', testCatalogName: 'Blood Urea', unit: 'mg/dL' },
      { deviceTestCode: 'CREJ', deviceTestName: 'Creatinine Jaffe', testCatalogCode: 'KFT-CREAT', testCatalogName: 'Serum Creatinine', unit: 'mg/dL' },
      { deviceTestCode: 'ALTL', deviceTestName: 'ALT', testCatalogCode: 'LFT-ALT', testCatalogName: 'ALT (SGPT)', unit: 'U/L' },
      { deviceTestCode: 'ASTL', deviceTestName: 'AST', testCatalogCode: 'LFT-AST', testCatalogName: 'AST (SGOT)', unit: 'U/L' },
    ],
  },

  // Immunology & Hormones
  {
    id: 'roche_e411',
    brand: 'Roche',
    model: 'Cobas e411 / Elecsys',
    category: 'IMMUNOLOGY',
    connectionType: 'TCP_IP',
    protocol: 'ASTM_1394',
    defaultPort: 5000,
    description: 'Roche Cobas e411 Immunoassay & Hormones Analyzer (ASTM 1394 TCP)',
    arabicDescription: 'جهاز تحاليل الهرمونات والمناعة روش كوباس e411',
    defaultMappings: [
      { deviceTestCode: 'TSH', deviceTestName: 'TSH (Thyroid)', testCatalogCode: 'THY-TSH', testCatalogName: 'TSH - Thyroid Stimulating Hormone', unit: 'uIU/mL' },
      { deviceTestCode: 'FT3', deviceTestName: 'Free T3', testCatalogCode: 'THY-FT3', testCatalogName: 'Free T3 (FT3)', unit: 'pg/mL' },
      { deviceTestCode: 'FT4', deviceTestName: 'Free T4', testCatalogCode: 'THY-FT4', testCatalogName: 'Free T4 (FT4)', unit: 'ng/dL' },
      { deviceTestCode: 'PRL', deviceTestName: 'Prolactin', testCatalogCode: 'HORM-PRL', testCatalogName: 'Prolactin (PRL)', unit: 'ng/mL' },
      { deviceTestCode: 'FSH', deviceTestName: 'FSH', testCatalogCode: 'HORM-FSH', testCatalogName: 'FSH', unit: 'mIU/mL' },
      { deviceTestCode: 'LH', deviceTestName: 'LH', testCatalogCode: 'HORM-LH', testCatalogName: 'LH', unit: 'mIU/mL' },
      { deviceTestCode: 'TESTO', deviceTestName: 'Testosterone', testCatalogCode: 'HORM-TEST', testCatalogName: 'Total Testosterone', unit: 'ng/dL' },
      { deviceTestCode: 'VITD', deviceTestName: 'Vitamin D3 Total', testCatalogCode: 'VIT-VITD', testCatalogName: 'Vitamin D (25-OH)', unit: 'ng/mL' },
      { deviceTestCode: 'B12', deviceTestName: 'Vitamin B12', testCatalogCode: 'VIT-B12', testCatalogName: 'Vitamin B12', unit: 'pg/mL' },
      { deviceTestCode: 'FERR', deviceTestName: 'Ferritin', testCatalogCode: 'IRON-FERR', testCatalogName: 'Serum Ferritin', unit: 'ng/mL' },
    ],
  },
  {
    id: 'snibe_maglumi',
    brand: 'Snibe',
    model: 'Maglumi 600 / 800 / 1000 / 2000',
    category: 'IMMUNOLOGY',
    connectionType: 'TCP_IP',
    protocol: 'HL7_V2',
    defaultPort: 5100,
    description: 'Snibe Maglumi CLIA Chemiluminescence Analyzer (HL7 v2 / ASTM)',
    arabicDescription: 'جهاز الهرمونات والمناعة الآلي سنيب ماجلومي عبر شبكة LAN',
    defaultMappings: [
      { deviceTestCode: 'TSH', deviceTestName: 'TSH', testCatalogCode: 'THY-TSH', testCatalogName: 'TSH', unit: 'uIU/mL' },
      { deviceTestCode: 'FT4', deviceTestName: 'FT4', testCatalogCode: 'THY-FT4', testCatalogName: 'FT4', unit: 'ng/dL' },
      { deviceTestCode: 'VIT-D', deviceTestName: '25-OH Vit D', testCatalogCode: 'VIT-VITD', testCatalogName: 'Vitamin D (25-OH)', unit: 'ng/mL' },
      { deviceTestCode: 'PSA', deviceTestName: 'Total PSA', testCatalogCode: 'TUMOR-PSA', testCatalogName: 'Total PSA', unit: 'ng/mL' },
      { deviceTestCode: 'BHCG', deviceTestName: 'Beta HCG', testCatalogCode: 'HORM-HCG', testCatalogName: 'Beta HCG (Quantitative)', unit: 'mIU/mL' },
    ],
  },

  // Electrolytes
  {
    id: 'genrui_ge300',
    brand: 'Genrui',
    model: 'GE300 / Cornley / Biorex Electrolytes',
    category: 'ELECTROLYTES',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    defaultBaudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    description: 'Electrolytes Analyzer (Na+, K+, Cl-, Ca2+, pH)',
    arabicDescription: 'جهاز تحليل أملاح الدم والشوارد (Na, K, Cl, Ca)',
    defaultMappings: [
      { deviceTestCode: 'Na', deviceTestName: 'Sodium', testCatalogCode: 'ELEC-NA', testCatalogName: 'Sodium (Na+)', unit: 'mmol/L' },
      { deviceTestCode: 'K', deviceTestName: 'Potassium', testCatalogCode: 'ELEC-K', testCatalogName: 'Potassium (K+)', unit: 'mmol/L' },
      { deviceTestCode: 'Cl', deviceTestName: 'Chloride', testCatalogCode: 'ELEC-CL', testCatalogName: 'Chloride (Cl-)', unit: 'mmol/L' },
      { deviceTestCode: 'iCa', deviceTestName: 'Ionized Calcium', testCatalogCode: 'ELEC-ICA', testCatalogName: 'Ionized Calcium (iCa)', unit: 'mmol/L' },
    ],
  },

  // Generic Standard Drivers
  {
    id: 'generic_hl7_tcp',
    brand: 'Generic / Universal',
    model: 'Standard HL7 v2.x (TCP/IP)',
    category: 'OTHER',
    connectionType: 'TCP_IP',
    protocol: 'HL7_V2',
    defaultPort: 5100,
    description: 'Universal HL7 v2.3 / v2.5 Receiver over LAN TCP/IP Socket',
    arabicDescription: 'المستقبل العالمي الموحد لبروتوكول HL7 عبر شبكة LAN',
    defaultMappings: [],
  },
  {
    id: 'generic_astm_serial',
    brand: 'Generic / Universal',
    model: 'Standard ASTM 1381/1394 (RS-232 COM)',
    category: 'OTHER',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    defaultBaudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    description: 'Universal ASTM 1381/1394 Receiver over RS-232 / USB Serial COM',
    arabicDescription: 'المستقبل العالمي الموحد لبروتوكول ASTM عبر كابل السيريال COM',
    defaultMappings: [],
  },
  {
    id: 'generic_file_watcher',
    brand: 'Generic / Universal',
    model: 'CSV / Text File Watcher',
    category: 'OTHER',
    connectionType: 'FILE_WATCHER',
    protocol: 'CSV_DELIMITED',
    description: 'Watches a local shared folder and parses incoming CSV or text result files',
    arabicDescription: 'مراقب المجلدات المشتركة لملفات CSV والنتائج النصية تلقائياً',
    defaultMappings: [],
  },
];
