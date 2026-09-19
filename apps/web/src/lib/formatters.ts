/**
 * Labryo Clinical Formatters & International Numeric Standards
 * 
 * Enforces Western/English numerals (0-9) across the entire system:
 * - Patient Age
 * - Diagnostic Results
 * - Dates and Timestamps
 * - Financial amounts and currency
 * - Blood Group validation & options
 */

/**
 * Converts Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to standard English numerals (0-9)
 */
export function toEnglishDigits(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

/**
 * Formats any Date or timestamp using strict Western/English digits (YYYY-MM-DD or DD/MM/YYYY)
 */
export function formatEnglishDate(date: any, format: 'ISO' | 'DMY' = 'DMY'): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (format === 'ISO') {
    return `${year}-${month}-${day}`;
  }
  return `${day}/${month}/${year}`;
}

/**
 * Formats any Date or timestamp to English Date + Time (DD/MM/YYYY hh:mm AM/PM)
 */
export function formatEnglishDateTime(date: any): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const datePart = formatEnglishDate(d, 'DMY');
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${datePart} ${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Formats any Date or timestamp to English Time (hh:mm AM/PM or hh:mm:ss AM/PM)
 */
export function formatEnglishTime(date: any, includeSeconds = false): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return includeSeconds ? `${hoursStr}:${minutes}:${seconds} ${ampm}` : `${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Formats numeric currency with thousands separators using strict English digits
 */
export function formatEnglishCurrency(amount: any, currency = 'د.ع'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `0 ${currency}`;
  }
  const cleanNum = Number(toEnglishDigits(amount));
  return `${cleanNum.toLocaleString('en-US')} ${currency}`;
}

/**
 * Complete standard Blood Group Options for clinical selection
 */
export const BLOOD_GROUP_OPTIONS = [
  { value: 'A+ (A Positive)', label: 'A+ (A Positive)', short: 'A+' },
  { value: 'A- (A Negative)', label: 'A- (A Negative)', short: 'A-' },
  { value: 'B+ (B Positive)', label: 'B+ (B Positive)', short: 'B+' },
  { value: 'B- (B Negative)', label: 'B- (B Negative)', short: 'B-' },
  { value: 'O+ (O Positive)', label: 'O+ (O Positive)', short: 'O+' },
  { value: 'O- (O Negative)', label: 'O- (O Negative)', short: 'O-' },
  { value: 'AB+ (AB Positive)', label: 'AB+ (AB Positive)', short: 'AB+' },
  { value: 'AB- (AB Negative)', label: 'AB- (AB Negative)', short: 'AB-' },
] as const;

/**
 * Determines whether a given test is a Blood Group / Rh test
 */
export function isBloodGroupTest(test: any): boolean {
  if (!test) return false;
  const code = (test.code || test.testCode || '').toUpperCase().trim();
  const name = (test.name || '').toLowerCase();
  const arabic = (test.arabicName || '');

  return (
    code === 'BG' ||
    code === 'BLOOD_GROUP' ||
    code === 'RH' ||
    code === 'ABO' ||
    code === 'ABO-RH' ||
    code === 'T-BG' ||
    name.includes('blood group') ||
    name.includes('rh factor') ||
    name.includes('blood typing') ||
    arabic.includes('فصيلة') ||
    arabic.includes('زمرة')
  );
}

/**
 * Evaluates whether a qualitative or non-numeric result is truly abnormal,
 * protecting physiological normal values like Blood Groups and negative screenings.
 */
export function evaluateQualitativeAbnormality(val: string, test: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const cleanVal = toEnglishDigits(val).trim();
  if (cleanVal === '') return false;

  // 1. Blood Group is a normal physiological trait, NEVER abnormal
  if (isBloodGroupTest(test)) {
    return false;
  }

  // 2. Normal physiological strings
  const lower = cleanVal.toLowerCase();
  const normalKeywords = [
    'negative',
    'non-reactive',
    'non reactive',
    'normal',
    'nil',
    'none',
    'clear',
    'yellow',
    'pale yellow',
    'straw',
    'not seen',
    'absent',
    'سالب',
    'طبيعي',
    'غير موجود',
    'لا يوجد'
  ];

  if (normalKeywords.some(kw => lower === kw || lower.startsWith(kw))) {
    return false;
  }

  // 3. Tests where Positive is disease/pathological
  const positiveKeywords = ['positive', 'reactive', 'pos', 'موجب', 'إيجابي', 'abnormal'];
  if (positiveKeywords.some(kw => lower.includes(kw))) {
    return true;
  }

  // 4. Semiquantitative pathological findings (1+, 2+, 3+, 4+, +++, ++)
  if (/^[1-4]\+$/.test(cleanVal) || cleanVal === '+++' || cleanVal === '++') {
    return true;
  }

  return false;
}
