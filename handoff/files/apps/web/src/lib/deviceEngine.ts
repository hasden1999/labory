export interface ParsedItem {
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  flags?: string; // H, L, N, A, HH, LL, CRIT
  isAbnormal?: boolean;
  isCritical?: boolean;
  timestamp?: string;
}

export interface ParsedAnalyzerMessage {
  protocol: 'ASTM_1394' | 'HL7_V2' | 'CSV_DELIMITED' | 'CUSTOM_TEXT';
  sampleNumber?: number;
  sampleBarcode?: string;
  patientName?: string;
  patientId?: string;
  messageType?: string;
  timestamp?: Date;
  items: ParsedItem[];
  rawMessage: string;
}

export type ClinicalProfileKey = 
  | 'NORMAL_ADULT' 
  | 'ANEMIA_THROMBOCYTOPENIA' 
  | 'SEVERE_INFECTION_LEUKOCYTOSIS' 
  | 'DIABETIC_KETO_RENAL';

export interface ClinicalProfile {
  key: ClinicalProfileKey;
  labelAr: string;
  labelEn: string;
  badgeColor: string;
  descriptionAr: string;
  results: Record<string, { value: string; unit?: string; flag?: string }>;
}

export const CLINICAL_PROFILES: Record<ClinicalProfileKey, ClinicalProfile> = {
  NORMAL_ADULT: {
    key: 'NORMAL_ADULT',
    labelAr: 'عينة بالغة طبيعية (Normal Reference)',
    labelEn: 'Normal Adult Profile',
    badgeColor: '#10b981',
    descriptionAr: 'كافة المؤشرات الدموية والكيميائية ضمن المستويات المرجعية الطبيعية للبالغين.',
    results: {
      // CBC
      'WBC': { value: '7.2', unit: '10^3/uL', flag: 'N' },
      'RBC': { value: '4.85', unit: '10^6/uL', flag: 'N' },
      'HGB': { value: '14.6', unit: 'g/dL', flag: 'N' },
      'HCT': { value: '43.8', unit: '%', flag: 'N' },
      'MCV': { value: '90.3', unit: 'fL', flag: 'N' },
      'MCH': { value: '30.1', unit: 'pg', flag: 'N' },
      'MCHC': { value: '33.3', unit: 'g/dL', flag: 'N' },
      'PLT': { value: '245', unit: '10^3/uL', flag: 'N' },
      'NEU%': { value: '58.5', unit: '%', flag: 'N' },
      'LYM%': { value: '31.2', unit: '%', flag: 'N' },
      'MON%': { value: '6.2', unit: '%', flag: 'N' },
      'EOS%': { value: '3.1', unit: '%', flag: 'N' },
      'BAS%': { value: '1.0', unit: '%', flag: 'N' },
      'RDW-CV': { value: '12.4', unit: '%', flag: 'N' },
      // Chemistry
      'GLU': { value: '92', unit: 'mg/dL', flag: 'N' },
      'GLUC': { value: '92', unit: 'mg/dL', flag: 'N' },
      'UREA': { value: '28', unit: 'mg/dL', flag: 'N' },
      'CREA': { value: '0.9', unit: 'mg/dL', flag: 'N' },
      'CREJ': { value: '0.9', unit: 'mg/dL', flag: 'N' },
      'UA': { value: '5.1', unit: 'mg/dL', flag: 'N' },
      'ALT': { value: '24', unit: 'U/L', flag: 'N' },
      'ALTL': { value: '24', unit: 'U/L', flag: 'N' },
      'AST': { value: '22', unit: 'U/L', flag: 'N' },
      'ASTL': { value: '22', unit: 'U/L', flag: 'N' },
      'ALP': { value: '75', unit: 'U/L', flag: 'N' },
      'TBIL': { value: '0.7', unit: 'mg/dL', flag: 'N' },
      'DBIL': { value: '0.2', unit: 'mg/dL', flag: 'N' },
      'CHOL': { value: '175', unit: 'mg/dL', flag: 'N' },
      'TRIG': { value: '120', unit: 'mg/dL', flag: 'N' },
      'HDL': { value: '52', unit: 'mg/dL', flag: 'N' },
      'LDL': { value: '99', unit: 'mg/dL', flag: 'N' },
      // Electrolytes
      'Na': { value: '140', unit: 'mmol/L', flag: 'N' },
      'K': { value: '4.2', unit: 'mmol/L', flag: 'N' },
      'Cl': { value: '102', unit: 'mmol/L', flag: 'N' },
      // Hormones
      'TSH': { value: '2.4', unit: 'uIU/mL', flag: 'N' },
      'FT4': { value: '1.25', unit: 'ng/dL', flag: 'N' },
      'VITD': { value: '38.5', unit: 'ng/mL', flag: 'N' },
      'VIT-D': { value: '38.5', unit: 'ng/mL', flag: 'N' },
    },
  },

  ANEMIA_THROMBOCYTOPENIA: {
    key: 'ANEMIA_THROMBOCYTOPENIA',
    labelAr: 'فقر دم دقيق الخلايا ونقص صفائح (Microcytic Anemia & Low PLT)',
    labelEn: 'Severe Anemia & Thrombocytopenia',
    badgeColor: '#f59e0b',
    descriptionAr: 'هبوط حاد في الهيموغلوبين (Hb 7.8) مع صغر حجم الكريات (MCV 68) وهبوط الصفائح (PLT 65).',
    results: {
      // CBC
      'WBC': { value: '5.8', unit: '10^3/uL', flag: 'N' },
      'RBC': { value: '3.12', unit: '10^6/uL', flag: 'L' },
      'HGB': { value: '7.8', unit: 'g/dL', flag: 'L' },
      'HCT': { value: '24.5', unit: '%', flag: 'L' },
      'MCV': { value: '68.2', unit: 'fL', flag: 'L' },
      'MCH': { value: '22.1', unit: 'pg', flag: 'L' },
      'MCHC': { value: '28.5', unit: 'g/dL', flag: 'L' },
      'PLT': { value: '65', unit: '10^3/uL', flag: 'LL' },
      'NEU%': { value: '62.0', unit: '%', flag: 'N' },
      'LYM%': { value: '28.0', unit: '%', flag: 'N' },
      'MON%': { value: '7.0', unit: '%', flag: 'N' },
      'EOS%': { value: '2.0', unit: '%', flag: 'N' },
      'BAS%': { value: '1.0', unit: '%', flag: 'N' },
      'RDW-CV': { value: '18.4', unit: '%', flag: 'H' },
      // Chemistry
      'GLU': { value: '105', unit: 'mg/dL', flag: 'N' },
      'GLUC': { value: '105', unit: 'mg/dL', flag: 'N' },
      'UREA': { value: '36', unit: 'mg/dL', flag: 'N' },
      'CREA': { value: '1.0', unit: 'mg/dL', flag: 'N' },
      'CREJ': { value: '1.0', unit: 'mg/dL', flag: 'N' },
      'UA': { value: '4.8', unit: 'mg/dL', flag: 'N' },
      'ALT': { value: '19', unit: 'U/L', flag: 'N' },
      'ALTL': { value: '19', unit: 'U/L', flag: 'N' },
      'AST': { value: '21', unit: 'U/L', flag: 'N' },
      'ASTL': { value: '21', unit: 'U/L', flag: 'N' },
      'ALP': { value: '68', unit: 'U/L', flag: 'N' },
      'TBIL': { value: '1.1', unit: 'mg/dL', flag: 'N' },
      'DBIL': { value: '0.3', unit: 'mg/dL', flag: 'N' },
      'CHOL': { value: '142', unit: 'mg/dL', flag: 'N' },
      'TRIG': { value: '95', unit: 'mg/dL', flag: 'N' },
      // Electrolytes
      'Na': { value: '138', unit: 'mmol/L', flag: 'N' },
      'K': { value: '4.0', unit: 'mmol/L', flag: 'N' },
      'Cl': { value: '101', unit: 'mmol/L', flag: 'N' },
      // Hormones / Vitamins
      'FERR': { value: '6.4', unit: 'ng/mL', flag: 'L' },
      'VITD': { value: '14.2', unit: 'ng/mL', flag: 'L' },
      'VIT-D': { value: '14.2', unit: 'ng/mL', flag: 'L' },
    },
  },

  SEVERE_INFECTION_LEUKOCYTOSIS: {
    key: 'SEVERE_INFECTION_LEUKOCYTOSIS',
    labelAr: 'عدوى حادة والتهاب دموي (Severe Leukocytosis / Infection)',
    labelEn: 'Acute Infection & Left Shift',
    badgeColor: '#ef4444',
    descriptionAr: 'ارتفاع حاد بالكريات البيض (WBC 26.4) مع انزياح يساري للعدلات (Neutrophils 88.5%) وتفاعل التهابي حاد.',
    results: {
      // CBC
      'WBC': { value: '26.4', unit: '10^3/uL', flag: 'HH' },
      'RBC': { value: '4.20', unit: '10^6/uL', flag: 'N' },
      'HGB': { value: '12.8', unit: 'g/dL', flag: 'N' },
      'HCT': { value: '38.4', unit: '%', flag: 'N' },
      'MCV': { value: '88.0', unit: 'fL', flag: 'N' },
      'MCH': { value: '29.5', unit: 'pg', flag: 'N' },
      'MCHC': { value: '33.1', unit: 'g/dL', flag: 'N' },
      'PLT': { value: '380', unit: '10^3/uL', flag: 'N' },
      'NEU%': { value: '88.5', unit: '%', flag: 'H' },
      'LYM%': { value: '6.2', unit: '%', flag: 'L' },
      'MON%': { value: '4.1', unit: '%', flag: 'N' },
      'EOS%': { value: '0.8', unit: '%', flag: 'L' },
      'BAS%': { value: '0.4', unit: '%', flag: 'N' },
      'RDW-CV': { value: '13.9', unit: '%', flag: 'N' },
      // Chemistry
      'GLU': { value: '145', unit: 'mg/dL', flag: 'H' },
      'GLUC': { value: '145', unit: 'mg/dL', flag: 'H' },
      'UREA': { value: '54', unit: 'mg/dL', flag: 'H' },
      'CREA': { value: '1.4', unit: 'mg/dL', flag: 'H' },
      'CREJ': { value: '1.4', unit: 'mg/dL', flag: 'H' },
      'UA': { value: '6.8', unit: 'mg/dL', flag: 'N' },
      'ALT': { value: '38', unit: 'U/L', flag: 'N' },
      'ALTL': { value: '38', unit: 'U/L', flag: 'N' },
      'AST': { value: '35', unit: 'U/L', flag: 'N' },
      'ASTL': { value: '35', unit: 'U/L', flag: 'N' },
      'ALP': { value: '115', unit: 'U/L', flag: 'N' },
      'TBIL': { value: '1.2', unit: 'mg/dL', flag: 'N' },
      'DBIL': { value: '0.4', unit: 'mg/dL', flag: 'N' },
      // Electrolytes
      'Na': { value: '134', unit: 'mmol/L', flag: 'L' },
      'K': { value: '4.9', unit: 'mmol/L', flag: 'N' },
      'Cl': { value: '97', unit: 'mmol/L', flag: 'L' },
      // Inflammatory
      'CRP': { value: '84.0', unit: 'mg/L', flag: 'HH' },
    },
  },

  DIABETIC_KETO_RENAL: {
    key: 'DIABETIC_KETO_RENAL',
    labelAr: 'قصور كلوي وسكر غير منضبط (Diabetic Nephropathy & Renal)',
    labelEn: 'Severe Hyperglycemia & Renal Impairment',
    badgeColor: '#8b5cf6',
    descriptionAr: 'سكر مرتفع جداً (385 mg/dL) مع فشل كلوي حاد (Urea 98, Creatinine 3.8) واضطراب الشوارد (K+ 5.9).',
    results: {
      // CBC
      'WBC': { value: '11.2', unit: '10^3/uL', flag: 'H' },
      'RBC': { value: '3.80', unit: '10^6/uL', flag: 'L' },
      'HGB': { value: '11.0', unit: 'g/dL', flag: 'L' },
      'HCT': { value: '33.0', unit: '%', flag: 'L' },
      'MCV': { value: '86.8', unit: 'fL', flag: 'N' },
      'MCH': { value: '28.9', unit: 'pg', flag: 'N' },
      'MCHC': { value: '33.3', unit: 'g/dL', flag: 'N' },
      'PLT': { value: '190', unit: '10^3/uL', flag: 'N' },
      'NEU%': { value: '70.0', unit: '%', flag: 'N' },
      'LYM%': { value: '22.0', unit: '%', flag: 'N' },
      'MON%': { value: '6.0', unit: '%', flag: 'N' },
      'EOS%': { value: '1.5', unit: '%', flag: 'N' },
      'BAS%': { value: '0.5', unit: '%', flag: 'N' },
      'RDW-CV': { value: '14.2', unit: '%', flag: 'N' },
      // Chemistry
      'GLU': { value: '385', unit: 'mg/dL', flag: 'HH' },
      'GLUC': { value: '385', unit: 'mg/dL', flag: 'HH' },
      'UREA': { value: '98', unit: 'mg/dL', flag: 'HH' },
      'CREA': { value: '3.8', unit: 'mg/dL', flag: 'HH' },
      'CREJ': { value: '3.8', unit: 'mg/dL', flag: 'HH' },
      'UA': { value: '9.4', unit: 'mg/dL', flag: 'H' },
      'ALT': { value: '54', unit: 'U/L', flag: 'H' },
      'ALTL': { value: '54', unit: 'U/L', flag: 'H' },
      'AST': { value: '48', unit: 'U/L', flag: 'H' },
      'ASTL': { value: '48', unit: 'U/L', flag: 'H' },
      'ALP': { value: '145', unit: 'U/L', flag: 'H' },
      'TBIL': { value: '1.0', unit: 'mg/dL', flag: 'N' },
      'CHOL': { value: '265', unit: 'mg/dL', flag: 'H' },
      'TRIG': { value: '320', unit: 'mg/dL', flag: 'HH' },
      // Electrolytes
      'Na': { value: '131', unit: 'mmol/L', flag: 'L' },
      'K': { value: '5.9', unit: 'mmol/L', flag: 'HH' },
      'Cl': { value: '94', unit: 'mmol/L', flag: 'L' },
    },
  },
};

/**
 * Clean control characters & ASTM E1381 frame checksums
 */
export function cleanAstmControlChars(raw: string): string {
  return raw
    .replace(/[\x03\x17][0-9A-Fa-f]{2}/g, '')
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Parses ASTM E1381 / E1394 records
 */
export function parseAstm1394(raw: string): ParsedAnalyzerMessage {
  const cleaned = cleanAstmControlChars(raw);
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);

  let sampleNumber: number | undefined = undefined;
  let sampleBarcode: string | undefined = undefined;
  let patientName: string | undefined = undefined;
  let patientId: string | undefined = undefined;
  const items: ParsedItem[] = [];

  for (const line of lines) {
    const matchFrame = line.match(/^(\d?)([HPORCL])\|(.*)$/i);
    if (!matchFrame) continue;

    const recordType = matchFrame[2].toUpperCase();
    const rest = matchFrame[3];
    const fields = rest.split('|');

    switch (recordType) {
      case 'P': {
        if (fields.length > 2 && fields[2]) patientId = fields[2].trim();
        if (fields.length > 3 && fields[3] && !patientId) patientId = fields[3].trim();
        if (fields.length > 4 && fields[4]) {
          const nameParts = fields[4].split('^').filter(Boolean);
          patientName = nameParts.join(' ').trim();
        }
        break;
      }
      case 'O': {
        const rawSampleId = fields[1]?.trim() || fields[2]?.trim() || '';
        if (rawSampleId) {
          sampleBarcode = rawSampleId;
          const numericMatch = rawSampleId.match(/\d+/);
          if (numericMatch) {
            sampleNumber = parseInt(numericMatch[0], 10);
          }
        }
        break;
      }
      case 'R': {
        const rawTestId = fields[1]?.trim() || '';
        let testCode = '';
        let testName: string | undefined = undefined;

        if (rawTestId.includes('^')) {
          const parts = rawTestId.split('^');
          if (parts.length >= 4 && parts[3]) {
            testCode = parts[3].trim();
            testName = parts[4]?.trim() || undefined;
          } else {
            const nonEmpties = parts.map((p) => p.trim()).filter(Boolean);
            testCode = nonEmpties[0] || rawTestId;
            testName = nonEmpties[1] || undefined;
          }
        } else {
          testCode = rawTestId;
        }

        const value = fields[2]?.trim() || '';
        const unit = fields[3]?.trim() || '';
        let flag = fields[5]?.trim() || '';
        flag = flag.replace(/^[0-9A-Fa-f]{2}$/, '');

        if (testCode && value) {
          const cleanFlag = flag.toUpperCase();
          const isAbnormal = ['H', 'L', 'A', 'AA', 'HH', 'LL', '+', '-', 'POS', 'POSITIVE'].includes(cleanFlag);
          const isCritical = ['HH', 'LL', 'CRIT', 'PANIC', 'C'].includes(cleanFlag);

          items.push({
            testCode: testCode.toUpperCase(),
            testName,
            value,
            unit,
            flags: flag || undefined,
            isAbnormal,
            isCritical,
          });
        }
        break;
      }
    }
  }

  return {
    protocol: 'ASTM_1394',
    sampleNumber,
    sampleBarcode,
    patientName,
    patientId,
    timestamp: new Date(),
    items,
    rawMessage: raw,
  };
}

/**
 * Parses HL7 v2.x (ORU^R01)
 */
export function parseHl7V2(raw: string): ParsedAnalyzerMessage {
  const cleaned = raw
    .replace(/^[\x0B\x00-\x09]+/, '')
    .replace(/[\x1C\x0D\x0B]+$/, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  const lines = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let sampleNumber: number | undefined = undefined;
  let sampleBarcode: string | undefined = undefined;
  let patientName: string | undefined = undefined;
  let patientId: string | undefined = undefined;
  let messageType = 'ORU^R01';
  const items: ParsedItem[] = [];

  for (const line of lines) {
    if (!line.includes('|')) continue;
    const segment = line.substring(0, 3).toUpperCase();
    const fields = line.split('|');

    switch (segment) {
      case 'MSH': {
        if (fields.length > 8 && fields[8]) {
          messageType = fields[8].trim();
        }
        break;
      }
      case 'PID': {
        if (fields.length > 3 && fields[3]) patientId = fields[3].trim();
        if (fields.length > 5 && fields[5]) {
          const parts = fields[5].split('^').filter(Boolean);
          patientName = parts.join(' ').trim();
        }
        break;
      }
      case 'OBR': {
        const rawOrder = fields[2]?.trim() || fields[3]?.trim() || '';
        if (rawOrder && !sampleBarcode) {
          sampleBarcode = rawOrder;
          const num = rawOrder.match(/\d+/);
          if (num) sampleNumber = parseInt(num[0], 10);
        }
        break;
      }
      case 'OBX': {
        const resultStatus = fields[11]?.trim()?.toUpperCase() || '';
        if (resultStatus === 'X' || resultStatus === 'D') continue;

        const testIdentifier = fields[3]?.trim() || '';
        const testParts = testIdentifier.split('^').map((p) => p.trim());
        
        let testCode = testParts[0] || '';
        if (testParts.length >= 4 && testParts[3] && !testParts[0].match(/^[A-Za-z]/)) {
          testCode = testParts[3];
        }
        const testName = testParts[1] || testCode;

        const value = fields[5]?.trim() || '';
        const unit = fields[6]?.trim() || '';
        const flag = fields[8]?.trim() || '';

        if (testCode && value) {
          const cleanFlag = flag.toUpperCase();
          const isAbnormal = ['H', 'L', 'A', 'AA', 'HH', 'LL', 'POS', 'POSITIVE', '+', '-'].includes(cleanFlag);
          const isCritical = ['HH', 'LL', 'CRIT', 'PANIC', 'C'].includes(cleanFlag);

          items.push({
            testCode: testCode.toUpperCase(),
            testName,
            value,
            unit,
            flags: flag || undefined,
            isAbnormal,
            isCritical,
          });
        }
        break;
      }
    }
  }

  return {
    protocol: 'HL7_V2',
    sampleNumber,
    sampleBarcode,
    patientName,
    patientId,
    messageType,
    timestamp: new Date(),
    items,
    rawMessage: raw,
  };
}

/**
 * Universal dispatcher
 */
export function parseDeviceMessage(protocol: string, raw: string): ParsedAnalyzerMessage {
  if (protocol === 'HL7_V2' || raw.includes('MSH|^~\\&') || raw.startsWith('\x0BMSH')) {
    return parseHl7V2(raw);
  }
  return parseAstm1394(raw);
}

/**
 * Helper to compute ASTM E1381 checksum (sum of ASCII mod 256, hex 2-digit uppercase)
 */
export function calculateAstmChecksum(frameContent: string): string {
  let sum = 0;
  for (let i = 0; i < frameContent.length; i++) {
    sum = (sum + frameContent.charCodeAt(i)) % 256;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

export interface SimulationFrame {
  id: string;
  timeOffsetMs: number;
  timestamp: string;
  direction: 'TX' | 'RX';
  type: 'ENQ' | 'ACK' | 'STX' | 'DATA' | 'EOT' | 'MLLP';
  content: string;
  hexDisplay: string;
  description: string;
}

export interface GeneratedSimulation {
  rawMessage: string;
  protocol: 'ASTM_1394' | 'HL7_V2';
  profileKey: ClinicalProfileKey;
  profileName: string;
  sampleNumber: number;
  sampleBarcode: string;
  patientName: string;
  frames: SimulationFrame[];
  parsed: ParsedAnalyzerMessage;
}

/**
 * Generates realistic quasi-real simulation frames and raw packets
 */
export function generateAnalyzerSimulation(params: {
  device: {
    name: string;
    brand: string;
    model: string;
    category: string;
    protocol: 'ASTM_1394' | 'HL7_V2' | string;
    mappings?: Array<{ deviceTestCode: string; deviceTestName: string; unit?: string }>;
  };
  sampleNumber: number;
  sampleBarcode?: string;
  patientName?: string;
  profileKey?: ClinicalProfileKey;
}): GeneratedSimulation {
  const profileKey = params.profileKey || 'NORMAL_ADULT';
  const profile = CLINICAL_PROFILES[profileKey] || CLINICAL_PROFILES.NORMAL_ADULT;
  const sampleNum = params.sampleNumber || 1001;
  const sampleBarcode = params.sampleBarcode || `SMP-${sampleNum}`;
  const patName = params.patientName || 'عينة فحص تجريبية';
  const protocol = (params.device.protocol === 'HL7_V2' ? 'HL7_V2' : 'ASTM_1394') as 'ASTM_1394' | 'HL7_V2';

  const dateNow = new Date();
  const dateStrAstm = dateNow.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const dateStrHl7 = dateNow.toISOString().replace(/[-:T]/g, '').slice(0, 14);

  // Extract items from profile relevant to device category/mappings
  const targetItems: ParsedItem[] = [];
  const mappings = params.device.mappings && params.device.mappings.length > 0 
    ? params.device.mappings 
    : Object.keys(profile.results).map(k => ({ deviceTestCode: k, deviceTestName: k, unit: profile.results[k].unit }));

  for (const map of mappings) {
    const code = map.deviceTestCode.toUpperCase();
    const found = profile.results[code] || profile.results[map.deviceTestCode];
    if (found) {
      const cleanFlag = (found.flag || 'N').toUpperCase();
      const isAbnormal = ['H', 'L', 'A', 'AA', 'HH', 'LL'].includes(cleanFlag);
      const isCritical = ['HH', 'LL', 'CRIT'].includes(cleanFlag);
      targetItems.push({
        testCode: code,
        testName: map.deviceTestName || code,
        value: found.value,
        unit: map.unit || found.unit || '',
        flags: found.flag !== 'N' ? found.flag : undefined,
        isAbnormal,
        isCritical,
      });
    }
  }

  // If no mapped items found, fallback to top 6 profile results
  if (targetItems.length === 0) {
    const keys = Object.keys(profile.results).slice(0, 6);
    for (const k of keys) {
      const found = profile.results[k];
      targetItems.push({
        testCode: k,
        testName: k,
        value: found.value,
        unit: found.unit || '',
        flags: found.flag !== 'N' ? found.flag : undefined,
        isAbnormal: found.flag !== 'N',
        isCritical: ['HH', 'LL'].includes(found.flag || ''),
      });
    }
  }

  const frames: SimulationFrame[] = [];
  let rawAccumulator = '';
  let timeMs = 0;

  if (protocol === 'ASTM_1394') {
    // 1. Handshake ENQ -> ACK
    frames.push({
      id: `f-${Date.now()}-1`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'ENQ',
      content: '<ENQ>',
      hexDisplay: '05',
      description: `طلب فتح جلسة إرسال من جهاز ${params.device.brand} ${params.device.model} (Enquiry)`,
    });
    timeMs += 120;

    frames.push({
      id: `f-${Date.now()}-2`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'RX',
      type: 'ACK',
      content: '<ACK>',
      hexDisplay: '06',
      description: 'نظام LIS يؤكد استعداده لاستقبال البيانات (Acknowledge)',
    });
    timeMs += 180;

    // 2. Header frame
    const headerPayload = `1H|\\^&|||${params.device.brand}^${params.device.model}^1.0|||||||P|1394-97|${dateStrAstm}\r\x03`;
    const csH = calculateAstmChecksum(headerPayload);
    const fullHeader = `\x02${headerPayload}${csH}\r\n`;
    rawAccumulator += `H|\\^&|||${params.device.brand}^${params.device.model}|||||||P|1394-97|${dateStrAstm}\n`;

    frames.push({
      id: `f-${Date.now()}-3`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'STX',
      content: `<STX>1H|\\^&|||${params.device.brand}^${params.device.model}|||||||P|1394-97|${dateStrAstm}<CR><ETX>${csH}<CR><LF>`,
      hexDisplay: Buffer.from(fullHeader).toString('hex').toUpperCase().slice(0, 48) + '...',
      description: 'إرسال سجل ترويسة الجهاز ASTM Header Frame (H)',
    });
    timeMs += 90;

    frames.push({
      id: `f-${Date.now()}-4`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'RX',
      type: 'ACK',
      content: '<ACK>',
      hexDisplay: '06',
      description: 'تأكيد استلام ترويسة الجهاز من قبل LIS',
    });
    timeMs += 110;

    // 3. Patient frame
    const patPayload = `2P|1|||pat-${sampleNum}|${patName}^^|||U||||||||||||||||||||||||\r\x03`;
    const csP = calculateAstmChecksum(patPayload);
    const fullPat = `\x02${patPayload}${csP}\r\n`;
    rawAccumulator += `P|1|||pat-${sampleNum}|${patName}^^|\n`;

    frames.push({
      id: `f-${Date.now()}-5`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'DATA',
      content: `<STX>2P|1|||pat-${sampleNum}|${patName}^^<CR><ETX>${csP}<CR><LF>`,
      hexDisplay: Buffer.from(fullPat).toString('hex').toUpperCase().slice(0, 48) + '...',
      description: `إرسال بيانات المريض ASTM Patient Frame (P: ${patName})`,
    });
    timeMs += 80;

    frames.push({
      id: `f-${Date.now()}-6`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'RX',
      type: 'ACK',
      content: '<ACK>',
      hexDisplay: '06',
      description: 'تأكيد استلام سجل المريض',
    });
    timeMs += 100;

    // 4. Order frame
    const orderPayload = `3O|1|${sampleBarcode}||^^^Routine|||${dateStrAstm}||||N||||Serum||||||||||O\r\x03`;
    const csO = calculateAstmChecksum(orderPayload);
    const fullOrder = `\x02${orderPayload}${csO}\r\n`;
    rawAccumulator += `O|1|${sampleBarcode}||^^^Routine|||${dateStrAstm}\n`;

    frames.push({
      id: `f-${Date.now()}-7`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'DATA',
      content: `<STX>3O|1|${sampleBarcode}||^^^Routine<CR><ETX>${csO}<CR><LF>`,
      hexDisplay: Buffer.from(fullOrder).toString('hex').toUpperCase().slice(0, 48) + '...',
      description: `إرسال أمر الفحص ورقم العينة ASTM Order Frame (O: #${sampleNum} / ${sampleBarcode})`,
    });
    timeMs += 80;

    frames.push({
      id: `f-${Date.now()}-8`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'RX',
      type: 'ACK',
      content: '<ACK>',
      hexDisplay: '06',
      description: 'تأكيد استلام رقم العينة',
    });
    timeMs += 110;

    // 5. Result frames
    let seq = 4;
    targetItems.forEach((item, idx) => {
      const frameNum = (seq % 8);
      const flagStr = item.flags || 'N';
      const rPayload = `${frameNum}R|${idx + 1}|^^^${item.testCode}^${item.testName}|${item.value}|${item.unit}||${flagStr}||F||||${dateStrAstm}\r\x03`;
      const csR = calculateAstmChecksum(rPayload);
      const fullR = `\x02${rPayload}${csR}\r\n`;
      rawAccumulator += `R|${idx + 1}|^^^${item.testCode}^${item.testName}|${item.value}|${item.unit}||${flagStr}||F||||${dateStrAstm}\n`;

      frames.push({
        id: `f-${Date.now()}-r-${idx}`,
        timeOffsetMs: timeMs,
        timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
        direction: 'TX',
        type: 'DATA',
        content: `<STX>${frameNum}R|${idx + 1}|^^^${item.testCode}|${item.value}|${item.unit}||${flagStr}<CR><ETX>${csR}<CR><LF>`,
        hexDisplay: Buffer.from(fullR).toString('hex').toUpperCase().slice(0, 48) + '...',
        description: `إرسال نتيجة [${item.testCode}: ${item.value} ${item.unit}] (العلامة: ${flagStr})`,
      });
      timeMs += 60;

      frames.push({
        id: `f-${Date.now()}-rack-${idx}`,
        timeOffsetMs: timeMs,
        timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
        direction: 'RX',
        type: 'ACK',
        content: '<ACK>',
        hexDisplay: '06',
        description: `تأكيد قيد نتيجة ${item.testCode}`,
      });
      timeMs += 70;
      seq++;
    });

    // 6. Terminator frame
    const termPayload = `${seq % 8}L|1|N\r\x03`;
    const csL = calculateAstmChecksum(termPayload);
    rawAccumulator += `L|1|N\n`;

    frames.push({
      id: `f-${Date.now()}-term`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'DATA',
      content: `<STX>${seq % 8}L|1|N<CR><ETX>${csL}<CR><LF>`,
      hexDisplay: '02314C7C317C4E0D0330330D0A',
      description: 'إرسال سجل نهاية الرسالة ASTM Terminator Frame (L)',
    });
    timeMs += 70;

    frames.push({
      id: `f-${Date.now()}-term-ack`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'RX',
      type: 'ACK',
      content: '<ACK>',
      hexDisplay: '06',
      description: 'تأكيد استلام نهاية الرسالة',
    });
    timeMs += 90;

    // 7. EOT
    frames.push({
      id: `f-${Date.now()}-eot`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'EOT',
      content: '<EOT>',
      hexDisplay: '04',
      description: 'إنهاء جلسة الإرسال بنجاح وإغلاق المنفذ (End of Transmission)',
    });

  } else {
    // HL7 v2.3.1
    const msgControlId = `MSG${Date.now().toString().slice(-6)}`;
    const mshSegment = `MSH|^~\\&|${params.device.brand}_${params.device.model}|LAB|LIS_HOST|HOSPITAL|${dateStrHl7}||ORU^R01|${msgControlId}|P|2.3.1||||||UNICODE`;
    const pidSegment = `PID|1||pat-${sampleNum}||${patName}|||||||||||||`;
    const obrSegment = `OBR|1|${sampleBarcode}|${sampleBarcode}|ANALYZER_RUN^Routine|||${dateStrHl7}||||||||||||||||F`;
    
    const obxSegments: string[] = [];
    targetItems.forEach((item, idx) => {
      const flagStr = item.flags || 'N';
      obxSegments.push(`OBX|${idx + 1}|NM|${item.testCode}^${item.testName}^LN|1|${item.value}|${item.unit}|RefRange|${flagStr}|||F`);
    });

    const hl7Body = [mshSegment, pidSegment, obrSegment, ...obxSegments].join('\r');
    rawAccumulator = [mshSegment, pidSegment, obrSegment, ...obxSegments].join('\n');
    const fullMllp = `\x0B${hl7Body}\x1C\x0D`;

    // 1. Socket Connect & MLLP Start
    frames.push({
      id: `f-${Date.now()}-mllp-start`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'MLLP',
      content: '<VT> MLLP Block Start (0x0B)',
      hexDisplay: '0B',
      description: `اتصال سوكت TCP ناجح من ${params.device.brand} وبدء حزمة MLLP`,
    });
    timeMs += 120;

    // 2. Transmit HL7 Message
    frames.push({
      id: `f-${Date.now()}-hl7-data`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'DATA',
      content: `${mshSegment}\n${pidSegment}\n${obrSegment}\n[+${obxSegments.length} OBX Results]`,
      hexDisplay: Buffer.from(fullMllp).toString('hex').toUpperCase().slice(0, 64) + '...',
      description: `إرسال رسالة HL7 v2.3.1 كاملة لعينة #${sampleNum} (${obxSegments.length} فحوصات)`,
    });
    timeMs += 250;

    // 3. MLLP End
    frames.push({
      id: `f-${Date.now()}-mllp-end`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'TX',
      type: 'MLLP',
      content: '<FS><CR> MLLP Block End (0x1C 0x0D)',
      hexDisplay: '1C0D',
      description: 'إغلاق حزمة بروتوكول MLLP',
    });
    timeMs += 100;

    // 4. LIS ACK Response
    const ackHl7 = `MSH|^~\\&|LIS_HOST|HOSPITAL|${params.device.brand}_${params.device.model}|LAB|${dateStrHl7}||ACK^R01|ACK${Date.now().toString().slice(-6)}|P|2.3.1\rMSA|AA|${msgControlId}|Message accepted successfully`;
    frames.push({
      id: `f-${Date.now()}-hl7-ack`,
      timeOffsetMs: timeMs,
      timestamp: new Date(Date.now() + timeMs).toLocaleTimeString(),
      direction: 'RX',
      type: 'ACK',
      content: `<VT>${ackHl7}<FS><CR>`,
      hexDisplay: Buffer.from(`\x0B${ackHl7}\x1C\x0D`).toString('hex').toUpperCase().slice(0, 48) + '...',
      description: 'نظام LIS يرسل رد التأكيد HL7 ACK^R01 (MSA|AA - تمت المعالجة بنجاح)',
    });
  }

  const parsed = protocol === 'HL7_V2' ? parseHl7V2(rawAccumulator) : parseAstm1394(rawAccumulator);
  parsed.sampleNumber = sampleNum;
  parsed.sampleBarcode = sampleBarcode;
  parsed.patientName = patName;
  parsed.items = targetItems;

  return {
    rawMessage: rawAccumulator,
    protocol,
    profileKey,
    profileName: profile.labelAr,
    sampleNumber: sampleNum,
    sampleBarcode,
    patientName: patName,
    frames,
    parsed,
  };
}
