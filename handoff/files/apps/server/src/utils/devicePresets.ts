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
      { deviceTestCode: 'WBC', deviceTestName: 'White Blood Cells', testCatalogCode: 'CBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'Red Blood Cells', testCatalogCode: 'CBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'Hemoglobin', testCatalogCode: 'HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'Hematocrit (PCV)', testCatalogCode: 'CBC', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'MCV', deviceTestName: 'Mean Corpuscular Volume', testCatalogCode: 'CBC', testCatalogName: 'MCV', unit: 'fL' },
      { deviceTestCode: 'MCH', deviceTestName: 'Mean Corpuscular Hemoglobin', testCatalogCode: 'CBC', testCatalogName: 'MCH', unit: 'pg' },
      { deviceTestCode: 'MCHC', deviceTestName: 'MCHC', testCatalogCode: 'CBC', testCatalogName: 'MCHC', unit: 'g/dL' },
      { deviceTestCode: 'PLT', deviceTestName: 'Platelets', testCatalogCode: 'PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'NEU%', deviceTestName: 'Neutrophils %', testCatalogCode: 'CBC', testCatalogName: 'Neutrophils %', unit: '%' },
      { deviceTestCode: 'LYM%', deviceTestName: 'Lymphocytes %', testCatalogCode: 'CBC', testCatalogName: 'Lymphocytes %', unit: '%' },
      { deviceTestCode: 'MON%', deviceTestName: 'Monocytes %', testCatalogCode: 'CBC', testCatalogName: 'Monocytes %', unit: '%' },
      { deviceTestCode: 'EOS%', deviceTestName: 'Eosinophils %', testCatalogCode: 'CBC', testCatalogName: 'Eosinophils %', unit: '%' },
      { deviceTestCode: 'BAS%', deviceTestName: 'Basophils %', testCatalogCode: 'CBC', testCatalogName: 'Basophils %', unit: '%' },
      { deviceTestCode: 'RDW-CV', deviceTestName: 'RDW-CV', testCatalogCode: 'CBC', testCatalogName: 'RDW-CV', unit: '%' },
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
      { deviceTestCode: 'WBC', deviceTestName: 'White Blood Cells', testCatalogCode: 'CBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'Red Blood Cells', testCatalogCode: 'CBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'Hemoglobin', testCatalogCode: 'HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'Hematocrit (PCV)', testCatalogCode: 'CBC', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'MCV', deviceTestName: 'Mean Corpuscular Volume', testCatalogCode: 'CBC', testCatalogName: 'MCV', unit: 'fL' },
      { deviceTestCode: 'MCH', deviceTestName: 'Mean Corpuscular Hemoglobin', testCatalogCode: 'CBC', testCatalogName: 'MCH', unit: 'pg' },
      { deviceTestCode: 'MCHC', deviceTestName: 'MCHC', testCatalogCode: 'CBC', testCatalogName: 'MCHC', unit: 'g/dL' },
      { deviceTestCode: 'PLT', deviceTestName: 'Platelets', testCatalogCode: 'PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'LYM%', deviceTestName: 'Lymphocytes %', testCatalogCode: 'CBC', testCatalogName: 'Lymphocytes %', unit: '%' },
      { deviceTestCode: 'MID%', deviceTestName: 'Mixed cells %', testCatalogCode: 'CBC', testCatalogName: 'MID / Monocytes %', unit: '%' },
      { deviceTestCode: 'GRAN%', deviceTestName: 'Granulocytes %', testCatalogCode: 'CBC', testCatalogName: 'Granulocytes (Neutrophils) %', unit: '%' },
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
      { deviceTestCode: 'WBC', deviceTestName: 'WBC', testCatalogCode: 'CBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'RBC', testCatalogCode: 'CBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'HGB', testCatalogCode: 'HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'HCT', testCatalogCode: 'CBC', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'MCV', deviceTestName: 'MCV', testCatalogCode: 'CBC', testCatalogName: 'MCV', unit: 'fL' },
      { deviceTestCode: 'MCH', deviceTestName: 'MCH', testCatalogCode: 'CBC', testCatalogName: 'MCH', unit: 'pg' },
      { deviceTestCode: 'MCHC', deviceTestName: 'MCHC', testCatalogCode: 'CBC', testCatalogName: 'MCHC', unit: 'g/dL' },
      { deviceTestCode: 'PLT', deviceTestName: 'PLT', testCatalogCode: 'PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'LYM%', deviceTestName: 'LYM%', testCatalogCode: 'CBC', testCatalogName: 'Lymphocytes %', unit: '%' },
      { deviceTestCode: 'MXD%', deviceTestName: 'MXD%', testCatalogCode: 'CBC', testCatalogName: 'Mixed cells %', unit: '%' },
      { deviceTestCode: 'NEUT%', deviceTestName: 'NEUT%', testCatalogCode: 'CBC', testCatalogName: 'Neutrophils %', unit: '%' },
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
      { deviceTestCode: 'WBC', deviceTestName: 'WBC', testCatalogCode: 'CBC', testCatalogName: 'WBC - White Blood Cells', unit: '10^3/uL' },
      { deviceTestCode: 'RBC', deviceTestName: 'RBC', testCatalogCode: 'CBC', testCatalogName: 'RBC - Red Blood Cells', unit: '10^6/uL' },
      { deviceTestCode: 'HGB', deviceTestName: 'HGB', testCatalogCode: 'HB', testCatalogName: 'Hb - Hemoglobin', unit: 'g/dL' },
      { deviceTestCode: 'HCT', deviceTestName: 'HCT', testCatalogCode: 'CBC', testCatalogName: 'PCV / HCT', unit: '%' },
      { deviceTestCode: 'PLT', deviceTestName: 'PLT', testCatalogCode: 'PLT', testCatalogName: 'Platelets Count', unit: '10^3/uL' },
      { deviceTestCode: 'NEUT#', deviceTestName: 'Neutrophils Count', testCatalogCode: 'CBC', testCatalogName: 'Absolute Neutrophils', unit: '10^3/uL' },
      { deviceTestCode: 'LYMPH#', deviceTestName: 'Lymphocytes Count', testCatalogCode: 'CBC', testCatalogName: 'Absolute Lymphocytes', unit: '10^3/uL' },
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
      { deviceTestCode: 'GLU', deviceTestName: 'Glucose', testCatalogCode: 'FBS', testCatalogName: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL' },
      { deviceTestCode: 'UREA', deviceTestName: 'Urea', testCatalogCode: 'UREA', testCatalogName: 'Blood Urea', unit: 'mg/dL' },
      { deviceTestCode: 'CREA', deviceTestName: 'Creatinine', testCatalogCode: 'CREAT', testCatalogName: 'Serum Creatinine', unit: 'mg/dL' },
      { deviceTestCode: 'UA', deviceTestName: 'Uric Acid', testCatalogCode: 'URIC', testCatalogName: 'Uric Acid', unit: 'mg/dL' },
      { deviceTestCode: 'ALT', deviceTestName: 'ALT / SGPT', testCatalogCode: 'GPT', testCatalogName: 'ALT (SGPT)', unit: 'U/L' },
      { deviceTestCode: 'AST', deviceTestName: 'AST / SGOT', testCatalogCode: 'GOT', testCatalogName: 'AST (SGOT)', unit: 'U/L' },
      { deviceTestCode: 'ALP', deviceTestName: 'Alkaline Phosphatase', testCatalogCode: 'ALP', testCatalogName: 'Alkaline Phosphatase (ALP)', unit: 'U/L' },
      { deviceTestCode: 'TBIL', deviceTestName: 'Total Bilirubin', testCatalogCode: 'TSB', testCatalogName: 'Total Bilirubin (TSB)', unit: 'mg/dL' },
      { deviceTestCode: 'DBIL', deviceTestName: 'Direct Bilirubin', testCatalogCode: 'DIR-BIL', testCatalogName: 'Direct Bilirubin', unit: 'mg/dL' },
      { deviceTestCode: 'CHOL', deviceTestName: 'Total Cholesterol', testCatalogCode: 'CHOL', testCatalogName: 'Total Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'TRIG', deviceTestName: 'Triglycerides', testCatalogCode: 'TG', testCatalogName: 'Triglycerides (TG)', unit: 'mg/dL' },
      { deviceTestCode: 'HDL', deviceTestName: 'HDL Cholesterol', testCatalogCode: 'HDL', testCatalogName: 'HDL - Good Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'LDL', deviceTestName: 'LDL Cholesterol', testCatalogCode: 'LDL', testCatalogName: 'LDL - Bad Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'ALB', deviceTestName: 'Albumin', testCatalogCode: 'ALB', testCatalogName: 'Serum Albumin', unit: 'g/dL' },
      { deviceTestCode: 'TP', deviceTestName: 'Total Protein', testCatalogCode: 'TP', testCatalogName: 'Total Protein', unit: 'g/dL' },
    ],
  },
  {
    id: 'roche_cobas_c111',
    brand: 'Roche',
    model: 'Cobas c111 / c311',
    category: 'CHEMISTRY',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    defaultBaudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    description: 'Roche Cobas Clinical Chemistry Analyzer (ASTM 1394 Serial/LAN)',
    arabicDescription: 'جهاز الكيمياء السريرية روش كوباس c311 عبر منفذ السيريال',
    defaultMappings: [
      { deviceTestCode: 'GLUC', deviceTestName: 'Glucose', testCatalogCode: 'FBS', testCatalogName: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL' },
      { deviceTestCode: 'UREA', deviceTestName: 'Urea', testCatalogCode: 'UREA', testCatalogName: 'Blood Urea', unit: 'mg/dL' },
      { deviceTestCode: 'CREJ', deviceTestName: 'Creatinine Jaffe', testCatalogCode: 'CREAT', testCatalogName: 'Serum Creatinine', unit: 'mg/dL' },
      { deviceTestCode: 'ALTL', deviceTestName: 'ALT', testCatalogCode: 'GPT', testCatalogName: 'ALT (SGPT)', unit: 'U/L' },
      { deviceTestCode: 'ASTL', deviceTestName: 'AST', testCatalogCode: 'GOT', testCatalogName: 'AST (SGOT)', unit: 'U/L' },
      { deviceTestCode: 'CHOL', deviceTestName: 'Cholesterol', testCatalogCode: 'CHOL', testCatalogName: 'Cholesterol', unit: 'mg/dL' },
      { deviceTestCode: 'TRIG', deviceTestName: 'Triglycerides', testCatalogCode: 'TG', testCatalogName: 'Triglycerides', unit: 'mg/dL' },
      { deviceTestCode: 'ALB', deviceTestName: 'Albumin', testCatalogCode: 'ALB', testCatalogName: 'Serum Albumin', unit: 'g/dL' },
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
      { deviceTestCode: 'TSH', deviceTestName: 'TSH (Thyroid)', testCatalogCode: 'TSH', testCatalogName: 'TSH - Thyroid Stimulating Hormone', unit: 'uIU/mL' },
      { deviceTestCode: 'FT3', deviceTestName: 'Free T3', testCatalogCode: 'FT3', testCatalogName: 'Free T3 (FT3)', unit: 'pg/mL' },
      { deviceTestCode: 'FT4', deviceTestName: 'Free T4', testCatalogCode: 'FT4', testCatalogName: 'Free T4 (FT4)', unit: 'ng/dL' },
      { deviceTestCode: 'PRL', deviceTestName: 'Prolactin', testCatalogCode: 'PRL', testCatalogName: 'Prolactin (PRL)', unit: 'ng/mL' },
      { deviceTestCode: 'FSH', deviceTestName: 'FSH', testCatalogCode: 'FSH', testCatalogName: 'FSH', unit: 'mIU/mL' },
      { deviceTestCode: 'LH', deviceTestName: 'LH', testCatalogCode: 'LH', testCatalogName: 'LH', unit: 'mIU/mL' },
      { deviceTestCode: 'TESTO', deviceTestName: 'Testosterone', testCatalogCode: 'TESTO', testCatalogName: 'Total Testosterone', unit: 'ng/dL' },
      { deviceTestCode: 'VITD', deviceTestName: 'Vitamin D3 Total', testCatalogCode: 'VITD', testCatalogName: 'Vitamin D (25-OH)', unit: 'ng/mL' },
      { deviceTestCode: 'B12', deviceTestName: 'Vitamin B12', testCatalogCode: 'VITB12', testCatalogName: 'Vitamin B12', unit: 'pg/mL' },
      { deviceTestCode: 'FERR', deviceTestName: 'Ferritin', testCatalogCode: 'FER', testCatalogName: 'Serum Ferritin', unit: 'ng/mL' },
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
      { deviceTestCode: 'TSH', deviceTestName: 'TSH', testCatalogCode: 'TSH', testCatalogName: 'TSH', unit: 'uIU/mL' },
      { deviceTestCode: 'FT4', deviceTestName: 'FT4', testCatalogCode: 'FT4', testCatalogName: 'FT4', unit: 'ng/dL' },
      { deviceTestCode: 'VIT-D', deviceTestName: '25-OH Vit D', testCatalogCode: 'VITD', testCatalogName: 'Vitamin D (25-OH)', unit: 'ng/mL' },
      { deviceTestCode: 'PSA', deviceTestName: 'Total PSA', testCatalogCode: 'PSA-TOT', testCatalogName: 'Total PSA', unit: 'ng/mL' },
      { deviceTestCode: 'BHCG', deviceTestName: 'Beta HCG', testCatalogCode: 'BHCG', testCatalogName: 'Beta HCG (Quantitative)', unit: 'mIU/mL' },
    ],
  },

  // Electrolytes
  {
    id: 'biolyte_2000',
    brand: 'Biolyte / Cornley',
    model: 'Biolyte 2000 / GE300 Electrolytes',
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
      { deviceTestCode: 'Na', deviceTestName: 'Sodium', testCatalogCode: 'NA', testCatalogName: 'Sodium (Na+)', unit: 'mmol/L' },
      { deviceTestCode: 'K', deviceTestName: 'Potassium', testCatalogCode: 'K', testCatalogName: 'Potassium (K+)', unit: 'mmol/L' },
      { deviceTestCode: 'Cl', deviceTestName: 'Chloride', testCatalogCode: 'CL', testCatalogName: 'Chloride (Cl-)', unit: 'mmol/L' },
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
