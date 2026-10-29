/**
 * PrintBody: Handles the clinical report body generation, test grouping (Category or Specialty),
 * and workstation rendering (General Tests, CBC, GUE, GSE, SFA). Owned by Agent B.
 */

import {
  calculateLipidPanel,
  LIPID_REFERENCE_SOURCES,
  LIPID_CATALOG_IDS,
  normalizeLipidUnit,
  classifyResultRange,
  formatClinicalAge,
  groupTests,
} from '@lab-manager/domain';
import { resolveReferenceRange } from '../../../../../lib/orderHelpers';
import {
  isCbcTest,
  isSfaTest,
  isGueTest,
  isGseTest,
  isAmhTest,
  isBhcgTest,
  isGeneralTest,
  detectSpecializedClinicalForm,
  SpecializedClinicalFormType,
} from '../../../../../lib/testClassifier';
import {
  renderPrintHeader,
  renderPatientMetaBox,
  escapeHtml,
  toEnglishDigits,
  formatEnglishDate,
  PrintHeaderParams,
  PatientMetaBoxParams,
} from './PrintHeader';

export {
  isCbcTest,
  isSfaTest,
  isGueTest,
  isGseTest,
  isAmhTest,
  isBhcgTest,
  isGeneralTest,
  LIPID_CATALOG_IDS,
  normalizeLipidUnit,
};

export function getReportEnglishTestName(test: any): string {
  if (!test) return 'Unknown Test';
  const rawName = String(test.name || '').trim();
  const rawCode = String(test.code || test.testCode || '').trim();

  // If no Arabic characters, use name
  if (rawName && !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(rawName)) {
    return rawName;
  }

  // If name has English in parentheses e.g. "باقة دهون الدم (Lipid Panel)"
  const parenMatch = rawName.match(/\(([A-Za-z0-9\s&,.'\/\-+]+)\)/);
  if (parenMatch && parenMatch[1].trim().length > 1) {
    return parenMatch[1].trim();
  }

  // Fallback to code if name contains Arabic
  if (rawCode) {
    return rawCode;
  }

  return rawName || 'Test';
}

export function getReportEnglishCategory(cat: string): string {
  if (!cat) return 'General Laboratory Tests';
  const trimmed = String(cat).trim();

  const parenMatch = trimmed.match(/\(([A-Za-z0-9\s&,.'\/\-+]+)\)/);
  if (parenMatch && parenMatch[1].trim().length > 1) {
    return parenMatch[1].trim();
  }

  const map: Record<string, string> = {
    'وظائف الكبد والمرارة': 'Liver & Biliary Function',
    'وظائف الكبد': 'Liver Function Tests',
    'أمراض الدم والتخثر': 'Hematology & Coagulation',
    'الكيمياء السريرية والسكري': 'Clinical Chemistry & Diabetes',
    'الكيمياء السريرية': 'Clinical Chemistry',
    'وظائف الكلى والأملاح': 'Renal Function & Electrolytes',
    'وظائف الكلى': 'Renal Function Tests',
    'دهون الدم وصحة القلب': 'Lipid Profile & Cardiac Markers',
    'دهون الدم': 'Lipid Profile',
    'الغدة الدرقية والهرمونات': 'Thyroid & Hormones',
    'الغدة الدرقية': 'Thyroid Profile',
    'المعادن والفيتامينات': 'Minerals & Vitamins',
    'المناعة والأمصال': 'Immunology & Serology',
    'الفحص المجهري العام': 'General Microscopy',
    'دلالات الأورام': 'Tumor Markers',
    'أمراض المناعة الذاتية والروماتيزم': 'Autoimmune & Rheumatology',
    'السموم والمخدرات': 'Toxicology & Drug Screening',
    'تحاليل عامة': 'General Laboratory Tests',
    'عام': 'General',
    'CHEMISTRY': 'Clinical Chemistry',
  };

  if (map[trimmed]) return map[trimmed];
  for (const [k, v] of Object.entries(map)) {
    if (trimmed.includes(k)) return v;
  }
  if (!/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(trimmed)) {
    return trimmed;
  }
  return 'General Laboratory Tests';
}

export function getReportEnglishSampleType(sampleType: string): string {
  if (!sampleType) return 'Serum';
  const trimmed = String(sampleType).trim();

  const map: Record<string, string> = {
    'محسوب': 'Calculated',
    'دم كامل (EDTA)': 'Whole Blood (EDTA)',
    'دم كامل (Citrate)': 'Whole Blood (Citrate)',
    'دم كامل': 'Whole Blood',
    'بلازما (Sodium Citrate)': 'Plasma (Sodium Citrate)',
    'بلازما (EDTA مفصولة فوراً)': 'Plasma (EDTA Immediate)',
    'بلازما (EDTA مبردة)': 'Chilled Plasma (EDTA)',
    'بلازما': 'Plasma',
    'مصل الدم (Serum)': 'Serum',
    'مصل': 'Serum',
    'إدرار عشوائي': 'Random Urine',
    'إدرار صباحي': 'Morning Urine',
    'إدرار 24 ساعة': '24-Hour Urine',
    'إدرار طازج': 'Fresh Urine',
    'إدرار': 'Urine',
    'عينة خروج': 'Stool Sample',
    'خروج': 'Stool',
    'سائل منوي (Semen)': 'Seminal Fluid',
    'دم شعيري (Capillary)': 'Capillary Blood',
    'دم كامل (أنابيب زجاجية)': 'Whole Blood (Glass Tubes)',
    'مسحة': 'Swab',
  };

  if (map[trimmed]) return map[trimmed];
  for (const [k, v] of Object.entries(map)) {
    if (trimmed.includes(k)) return v;
  }
  if (!/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(trimmed)) {
    return trimmed;
  }
  return 'Specimen';
}

export function translateQualitativeResult(val: string): string {
  if (!val) return val;
  const str = String(val).trim();

  const map: Record<string, string> = {
    'موجب': 'Positive',
    'إيجابي': 'Positive',
    'سلبي': 'Negative',
    'سالب': 'Negative',
    'طبيعي': 'Normal',
    'غير طبيعي': 'Abnormal',
    'أثر': 'Trace',
    'اثر': 'Trace',
    'نادر': 'Rare',
    'قليل': 'Few',
    'معتدل': 'Moderate',
    'متوسط': 'Moderate',
    'كثير': 'Many',
    'عديد': 'Many',
    'صافي': 'Clear',
    'عكر': 'Turbid',
    'عكر خفيف': 'Slightly Turbid',
    'أصفر': 'Yellow',
    'اصفر': 'Yellow',
    'أصفر شاحب': 'Pale Yellow',
    'أصفر فاتح': 'Light Yellow',
    'أصفر غامق': 'Dark Yellow',
    'كهرماني': 'Amber',
    'أحمر': 'Red / Bloody',
    'احمر': 'Red / Bloody',
    'دموي': 'Bloody',
    'بني': 'Brown',
    'أخضر': 'Green',
    'حامضي': 'Acidic',
    'قاعدي': 'Alkaline',
    'قلوي': 'Alkaline',
    'غير موجود': 'Nil',
    'لا يوجد': 'Nil',
    'معدوم': 'Nil',
    'ممتلئ': 'Full Field',
    'مليء': 'Full Field',
    'شديد العكورة': 'Very Turbid',
    'متماسك': 'Formed',
    'شبه متماسك': 'Semi-Formed',
    'مائي': 'Watery',
    'مخاطي': 'Mucoid',
    'راسب': 'Precipitate',
    'أكثر من': 'More than',
    'أقل من': 'Less than',
    'موجب ضعيف': 'Weakly Positive',
    'موجب قوي': 'Strongly Positive',
    'تفاعل إيجابي': 'Positive Reaction',
    'تفاعل سلبي': 'Negative Reaction',
    'ملاحظة': 'Note',
    'معتمد نهائي': 'Verified (Final)',
    'قيد الانتظار': 'Pending',
  };

  if (map[str]) return map[str];

  let res = str;
  for (const [ar, en] of Object.entries(map)) {
    res = res.replace(new RegExp(`\\b${ar}\\b`, 'g'), en);
  }
  return res;
}

export function translateRefRangeToEnglish(input: string): string {
  if (!input) return '';
  let str = toEnglishDigits(String(input).trim());
  if (!/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str)) {
    return str;
  }

  // Exact match for generic labels that should become empty
  const genericExact = new Set([
    'للجميع',
    'عام',
    'المعدل العام',
    'المعدل الطبيعي',
    'الطبيعي للجميع',
    'كلا الجنسين',
    'جميع الأعمار',
    'الكل',
  ]);
  if (genericExact.has(str)) {
    return '';
  }

  const replacements: Array<[RegExp, string]> = [
    [/مرحلة ما قبل السكري|ما قبل السكري|ماقبل السكري|معرض للسكري/g, 'Pre-diabetic'],
    [/غير مصاب بالسكري|غير سكري/g, 'Non-diabetic'],
    [/مصاب بالسكري|مرضى السكري|السكري|سكري/g, 'Diabetic'],
    [/حديثي الولادة|حديثو الولادة|المواليد|مواليد|خدج/g, 'Newborn'],
    [/الأطفال الرضع|الرضع|رضع|رضيع/g, 'Infants'],
    [/الأطفال|اطفال|أطفال|طفل/g, 'Children'],
    [/كبار السن|المسنين/g, 'Elderly'],
    [/البالغين|بالغين|البالغون|بالغ|كبار/g, 'Adults'],
    [/الرجال|رجال|الذكور|ذكور|ذكر/g, 'Male'],
    [/النساء|نساء|الإناث|إناث|اناث|أنثى|انثى/g, 'Female'],
    [/غير الحوامل|غير حامل/g, 'Non-pregnant'],
    [/الحوامل|حوامل|حامل/g, 'Pregnant'],
    [/الثلث الأول من الحمل|الثلث الأول|ثلث أول|الثلث الاول/g, '1st Trimester'],
    [/الثلث الثاني من الحمل|الثلث الثاني|ثلث ثاني/g, '2nd Trimester'],
    [/الثلث الثالث من الحمل|الثلث الثالث|ثلث ثالث/g, '3rd Trimester'],
    [/بعد سن اليأس|سن اليأس|انقطاع الطمث/g, 'Post-menopausal'],
    [/الطور الجريبي|المرحلة الجريبية/g, 'Follicular Phase'],
    [/طور الإباضة|مرحلة التبويض|التبويض|الإباضة|الاباضة/g, 'Ovulation Phase'],
    [/الطور الأصفري|المرحلة اللوتينية|الطور اللوتيني/g, 'Luteal Phase'],
    [/نقص حاد|نقص شديد/g, 'Severe Deficiency'],
    [/نقص|قصور/g, 'Deficient'],
    [/غير كافٍ|غير كافي|غير كاف/g, 'Insufficient'],
    [/كافٍ|كافي|كاف|مثالي/g, 'Sufficient'],
    [/سمية|تسمم/g, 'Toxicity'],
    [/مرتفع جداً|مرتفع جدا/g, 'Very High'],
    [/منخفض جداً|منخفض جدا/g, 'Very Low'],
    [/مرتفع|عالي/g, 'High'],
    [/منخفض|واطئ/g, 'Low'],
    [/الحد الفاصل|حدي/g, 'Borderline'],
    [/غير طبيعي/g, 'Abnormal'],
    [/المعدل الطبيعي|طبيعي|سليم/g, 'Normal'],
    [/سلبي|سالب/g, 'Negative'],
    [/إيجابي|ايجابي|موجب/g, 'Positive'],
    [/مشكوك فيه|مشبه/g, 'Equivocal'],
    [/للجميع|المعدل العام|عام/g, ''],
    [/أقل أو يساوي|اقل او يساوي/g, '<='],
    [/أكبر أو يساوي|اكبر او يساوي|أكثر أو يساوي/g, '>='],
    [/أقل من|اقل من/g, '<'],
    [/أكثر من|اكثر من|أكبر من|اكبر من/g, '>'],
    [/إلى|الى/g, '-'],
    [/سنوات|سنة|سنين/g, 'Years'],
    [/أشهر|اشهر|شهور|شهر/g, 'Months'],
    [/أسابيع|اسابيع|أسبوع|اسبوع/g, 'Weeks'],
    [/أيام|ايام|يوم/g, 'Days'],
    [/صباحاً|صباحا/g, 'AM'],
    [/مساءً|مساءا|مساء/g, 'PM'],
    [/صائم/g, 'Fasting'],
    [/عشوائي/g, 'Random'],
    [/بعد الأكل|بعد الطعام/g, 'Postprandial'],
  ];

  for (const [regex, replacement] of replacements) {
    str = str.replace(regex, replacement);
  }

  // Strip any residual Arabic letters so patient report remains 100% English
  str = str
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/^[\s:：\-–—]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return str;
}

export function generateHistogramSvg(type: 'WBC' | 'RBC' | 'PLT', points?: number[], width = 200, height = 65): string {
  let pathD = '';
  let color = '#2563eb';
  let title = 'WBC Histogram';
  let unit = '50 - 450 fL';

  if (type === 'WBC') {
    color = '#16a34a';
    title = 'WBC Histogram';
    unit = '30 - 300 fL';
    pathD = 'M 0,60 Q 20,58 35,22 Q 50,60 70,48 Q 85,42 100,52 Q 120,55 140,12 Q 165,15 185,58 L 200,60';
  } else if (type === 'RBC') {
    color = '#dc2626';
    title = 'RBC Histogram';
    unit = '25 - 250 fL';
    pathD = 'M 0,60 Q 30,60 60,55 Q 85,38 100,8 Q 115,38 140,55 Q 170,60 200,60';
  } else {
    color = '#d97706';
    title = 'PLT Histogram';
    unit = '2 - 30 fL';
    pathD = 'M 0,60 Q 15,58 30,10 Q 50,26 75,48 Q 120,58 200,60';
  }

  if (points && points.length > 5) {
    const maxVal = Math.max(...points, 1);
    const step = width / (points.length - 1);
    const coords = points.map((p, idx) => {
      const x = (idx * step).toFixed(1);
      const y = (height - 5 - (p / maxVal) * (height - 12)).toFixed(1);
      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
    });
    pathD = coords.join(' ');
  }

  return `
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #ffffff; text-align: center; flex: 1;">
      <div style="font-size: 9.5px; font-weight: 800; color: #475569; margin-bottom: 2px; display: flex; justify-content: space-between;" dir="ltr">
        <span>${title}</span>
        <span style="color: #94a3b8; font-size: 8px;">${unit}</span>
      </div>
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; width: 100%; height: auto; max-height: ${height}px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
        <line x1="0" y1="${height * 0.33}" x2="${width}" y2="${height * 0.33}" stroke="#e2e8f0" stroke-dasharray="2,2" />
        <line x1="0" y1="${height * 0.66}" x2="${width}" y2="${height * 0.66}" stroke="#e2e8f0" stroke-dasharray="2,2" />
        <path d="${pathD} L ${width},${height} L 0,${height} Z" fill="${color}" fill-opacity="0.15" />
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    </div>
  `;
}

export function renderClinicalFindingBadge(p: string, isPositive?: boolean, textColor = '#0f172a', badgeFontSize = 11.5): string {
  const colonIdx = p.indexOf(':');
  let innerHtml = '';
  if (colonIdx > 0) {
    const key = p.substring(0, colonIdx).trim();
    const val = p.substring(colonIdx + 1).trim();
    innerHtml = `<span style="color: #64748b; font-weight: 700; white-space: nowrap;">${escapeHtml(key)}:</span> <span style="color: ${isPositive ? '#dc2626' : textColor}; font-weight: 800; unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(toEnglishDigits(val))}</span>`;
  } else {
    innerHtml = `<span style="color: ${isPositive ? '#dc2626' : textColor}; font-weight: 800; unicode-bidi: isolate;">${escapeHtml(toEnglishDigits(p))}</span>`;
  }

  const borderCol = isPositive ? '#fecaca' : '#e2e8f0';
  const bgCol = isPositive ? '#fef2f2' : '#f8fafc';
  return `<div style="background: ${bgCol}; border: 1px solid ${borderCol}; padding: 6px 10px; border-radius: 4px; font-size: ${badgeFontSize}px; text-align: left; direction: ltr; unicode-bidi: isolate; display: flex; align-items: center; justify-content: flex-start;">${innerHtml}</div>`;
}

export interface PrintBodyParams {
  sample: any;
  store: any;
  settings: any;
  sectionParam: string;
  template: string;
  primaryCol: string;
  textColor: string;
  borderColor: string;
  headerBgColor: string;
  headerTextColor: string;
  testNameFontSize: number;
  resultValueFontSize: number;
  unitFontSize: number;
  refRangeFontSize: number;
  specialFormFontSize?: number;
  testNameFontWeight?: string;
  resultValueFontWeight: string;
  customCellPadding: string;
  tableRowBorders: boolean;
  tableZebraStriping: boolean;
  visibleColumns: any[];
  groupByCategory: boolean;
  isSingleMode?: boolean;
  containerClass: string;
  renderWatermark: () => string;
  renderFooter: (safeFooter: string, safeLabName: string) => string;
  safePatientName: string;
  safeDoctorName: string;
  safeLabName: string;
  safeFooter: string;
  clinicalAge: string;
  patient: any;
  doctor: any;
  headerParams: PrintHeaderParams;
  patientBoxParams: PatientMetaBoxParams;
}

export function renderPrintBodyPages(params: PrintBodyParams): string[] {
  const {
    sample,
    store,
    settings,
    sectionParam,
    primaryCol,
    textColor,
    borderColor,
    headerBgColor,
    headerTextColor,
    testNameFontSize,
    resultValueFontSize,
    refRangeFontSize,
    unitFontSize,
    testNameFontWeight = 'bold',
    resultValueFontWeight,
    customCellPadding,
    tableRowBorders,
    tableZebraStriping,
    visibleColumns,
    groupByCategory,
    isSingleMode = false,
    containerClass,
    renderWatermark,
    renderFooter,
    safePatientName,
    safeDoctorName,
    safeLabName,
    safeFooter,
    clinicalAge,
    patient,
    headerParams,
    patientBoxParams,
    specialFormFontSize: rawSpecialFormFontSize,
  } = params;

  const specialFormFontSize = rawSpecialFormFontSize || Number(settings?.print_special_form_font_size) || Number(settings?.specialFormFontSize) || 13;

  const renderedPages: string[] = [];

  // Tests Categorization
  const allTests = sample.tests || [];
  const cbcTests = allTests.filter(isCbcTest);
  const sfaTests = allTests.filter(isSfaTest);
  const gueTests = allTests.filter(isGueTest);
  const gseTests = allTests.filter(isGseTest);
  const amhTests = allTests.filter(isAmhTest);
  const bhcgTests = allTests.filter(isBhcgTest);
  const detectFormType = (t: any): SpecializedClinicalFormType | null => {
    const detected = detectSpecializedClinicalForm(t);
    if (detected) return detected;
    if (t?.resultValue && typeof t.resultValue === 'string' && t.resultValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(t.resultValue);
        if (
          parsed &&
          ['BLOOD_FILM', 'BODY_FLUID', 'STONE_ANALYSIS', 'COAG_PROFILE', 'OGTT_CURVE'].includes(parsed._formType)
        ) {
          return parsed._formType as SpecializedClinicalFormType;
        }
      } catch {}
    }
    return null;
  };
  const specializedClinicalTests = allTests.filter((t: any) => detectFormType(t) !== null);
  const generalTests = allTests.filter((t: any) => isGeneralTest(t) && detectFormType(t) === null);

  // Section visibility flags based on ?section= query param (defaults to 'all')
  const sec = sectionParam || 'all';
  const shouldRenderGeneral = generalTests.length > 0 && (sec === 'all' || sec === 'general' || sec === 'chemistry');
  const shouldRenderCbc = cbcTests.length > 0 && (sec === 'all' || sec === 'cbc' || sec === 'fbc');
  const shouldRenderGue = gueTests.length > 0 && (sec === 'all' || sec === 'gue' || sec === 'urine');
  const shouldRenderGse = gseTests.length > 0 && (sec === 'all' || sec === 'gse' || sec === 'stool');
  const shouldRenderSfa = sfaTests.length > 0 && (sec === 'all' || sec === 'sfa' || sec === 'semen');
  const shouldRenderAmh = amhTests.length > 0 && (sec === 'all' || sec === 'amh');
  const shouldRenderBhcg = bhcgTests.length > 0 && (sec === 'all' || sec === 'bhcg' || sec === 'hcg');
  const shouldRenderSpecializedClinical =
    specializedClinicalTests.length > 0 &&
    (sec === 'all' ||
      sec === 'specialized' ||
      ['blood_film', 'body_fluid', 'stone_analysis', 'coag_profile', 'ogtt_curve'].includes(sec));

  // Patient prior visits for Historical Delta display on report
  const patId = sample.patientId || sample.patient?.id;
  const patName = sample.patient?.name ? String(sample.patient.name).trim() : '';
  const sampleTime = sample.createdAt ? new Date(sample.createdAt).getTime() : Date.now();
  const priorSamples = (store.samples || [])
    .filter((s: any) => s.id !== sample.id &&
      ((patId && (s.patientId === patId || s.patient?.id === patId)) || (patName && String(s.patient?.name || '').trim().toLowerCase() === patName.toLowerCase())) &&
      (new Date(s.createdAt).getTime() < sampleTime || (!sample.createdAt && s.id !== sample.id))
    )
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Prior lookup helper
  const findPriorForTest = (st: any): { value: string; date: string; sampleId: string } | null => {
    if (st.includePrevious === false) return null;
    if (st.previousValue && String(st.previousValue).trim() !== '') {
      return { value: String(st.previousValue), date: st.previousDate ? formatEnglishDate(st.previousDate) : '', sampleId: st.previousSampleId || '' };
    }
    const tid = st.testId || st.test?.id;
    const code = (st.test?.code || st.code || '').toUpperCase().trim();
    const name = (st.test?.name || st.name || '').toLowerCase().trim();
    for (const ps of priorSamples) {
      const pt = (ps.tests || []).find((x: any) =>
        (tid && (x.testId === tid || x.test?.id === tid)) ||
        (code && (String(x.test?.code || x.code || '').toUpperCase().trim() === code)) ||
        (name && (String(x.test?.name || x.name || '').toLowerCase().trim() === name))
      );
      if (pt && pt.resultValue && String(pt.resultValue).trim() !== '') {
        return { value: String(pt.resultValue), date: formatEnglishDate(ps.createdAt), sampleId: ps.id };
      }
    }
    return null;
  };

  // Lipid calculations (only used to fill missing values for ordered LDL / VLDL tests)
  const matchCode = (st: any, codes: readonly string[]) => codes.includes(String(st.test?.code || st.code || '').toUpperCase().trim());
  const matchId = (st: any, id: string) => (st.testId === id || st.test?.id === id);
  const findLipid = (ids: string, codes: readonly string[]) => (allTests as any[]).find((st: any) => matchId(st, ids) || matchCode(st, codes));
  const numOf = (st: any) => {
    if (!st || st.resultValue === undefined || st.resultValue === null) return NaN;
    const s = toEnglishDigits(String(st.resultValue)).trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  };

  const lipidTcSt = findLipid(LIPID_CATALOG_IDS.TC, ['CHOL', 'TC', 'CHOL-TOTAL'] as unknown as readonly string[]);
  const lipidHdlSt = findLipid(LIPID_CATALOG_IDS.HDL, ['HDL', 'HDL-C'] as unknown as readonly string[]);
  const lipidTgSt = findLipid(LIPID_CATALOG_IDS.TG, ['TG', 'TRIG'] as unknown as readonly string[]);
  const lipidLdlSt = findLipid(LIPID_CATALOG_IDS.LDL, ['LDL', 'LDL-C'] as unknown as readonly string[]);
  const lipidVldlSt = findLipid(LIPID_CATALOG_IDS.VLDL, ['VLDL', 'VLDL-C'] as unknown as readonly string[]);
  const lipidUnit = normalizeLipidUnit(lipidTgSt?.test?.unit || lipidTcSt?.test?.unit || lipidHdlSt?.test?.unit || 'mg/dL');
  const lipidDirectLdl = (() => {
    const v = lipidLdlSt ? numOf(lipidLdlSt) : NaN;
    return isNaN(v) ? undefined : v;
  })();
  const lipidPanel = (() => {
    const tc = lipidTcSt ? numOf(lipidTcSt) : NaN;
    const hdl = lipidHdlSt ? numOf(lipidHdlSt) : NaN;
    const tg = lipidTgSt ? numOf(lipidTgSt) : NaN;
    try {
      return calculateLipidPanel(isNaN(tc) ? undefined : tc, isNaN(hdl) ? undefined : hdl, isNaN(tg) ? undefined : tg, lipidUnit, undefined);
    } catch { return null; }
  })();
  const lipidEffectiveLdl = (() => {
    if (lipidDirectLdl !== undefined && lipidLdlSt && String(lipidLdlSt.resultValue || '').trim() !== '') {
      return { value: lipidDirectLdl, isCalculated: false as boolean, invalidReason: undefined as string | undefined };
    }
    if (!lipidPanel) return null;
    return lipidPanel.ldl.value !== null || lipidPanel.ldl.invalidReason
      ? { value: lipidPanel.ldl.value, isCalculated: true as boolean, invalidReason: lipidPanel.ldl.invalidReason }
      : null;
  })();

  // 1. General Laboratory Tests (Blood, Chemistry, Hormones, etc.)
  if (shouldRenderGeneral) {
    // Only render actually ordered general tests (never inject unrequested virtual calculated rows)
    const generalWithLipid: any[] = [...generalTests];

    const colsArray = Array.isArray(visibleColumns)
      ? visibleColumns
      : [
          { id: 'testName', label: 'INVESTIGATION', visible: true, align: 'left' },
          { id: 'result', label: 'RESULT', visible: true, align: 'left' },
          { id: 'unit', label: 'UNIT', visible: true, align: 'left' },
          { id: 'refRange', label: 'REFERENCE RANGE', visible: true, align: 'left' },
        ];
    const showPrevCol = generalWithLipid.some((st: any) => !!findPriorForTest(st));
    const effectiveColumns: any[] = showPrevCol
      ? (!colsArray.some((c: any) => c.id === 'previous')
          ? [...colsArray.slice(0, 2), { id: 'previous', label: 'PREVIOUS', visible: true, align: 'left' }, ...colsArray.slice(2)]
          : colsArray)
      : colsArray.filter((c: any) => c.id !== 'previous');

    const renderGeneralTestRow = (t: any, rowIdx: number) => {
      let effectiveValue: any = t.resultValue;
      const tid = String(t.testId || t.test?.id || '');
      const tcode = String(t.test?.code || t.code || '').toUpperCase();
      const isLdlRow = tid === LIPID_CATALOG_IDS.LDL || tcode === 'LDL' || tcode === 'LDL-C';
      const isVldlRow = tid === LIPID_CATALOG_IDS.VLDL || tcode === 'VLDL' || tcode === 'VLDL-C';
      if (!effectiveValue || String(effectiveValue).trim() === '') {
        if (isLdlRow && lipidEffectiveLdl) {
          if (lipidEffectiveLdl.value !== null) {
            effectiveValue = String(lipidEffectiveLdl.value);
          } else if (lipidEffectiveLdl.invalidReason) {
            effectiveValue = lipidEffectiveLdl.invalidReason;
          }
        } else if (isVldlRow && lipidPanel) {
          if (lipidPanel.vldl.value !== null) {
            effectiveValue = String(lipidPanel.vldl.value);
          } else if (lipidPanel.vldl.invalidReason && lipidTgSt) {
            effectiveValue = lipidPanel.vldl.invalidReason;
          }
        }
      }

      const patientContext = {
        gender: sample.patient?.gender,
        age: sample.patient?.age,
        birthDate: sample.patient?.birthDate,
        targetDate: sample.createdAt,
      };

      const evalResult = classifyResultRange(effectiveValue, t.test || t, patientContext);
      const isAbnormal = evalResult.isAbnormal;
      const resColor = isAbnormal ? evalResult.color : textColor;
      const arrowHtml = isAbnormal
        ? ` <strong style="color: ${evalResult.color}; font-weight: 900; margin-left: 4px; font-family: Arial, sans-serif;">${evalResult.arrow}</strong>`
        : '';

      const baseName = getReportEnglishTestName(t.test || t);
      const testName = escapeHtml(baseName);
      const testUnit = escapeHtml(t.test?.unit || t.unit || '-');
      let testRef: string;
      const printScope = (settings as any).printRangeScope || 'ALL';
      const rRanges = t.test?.referenceRanges || [];

      const formatSingleRangeRowHtml = (r: any, isMatchedRow = false): string => {
        const rawTxt =
          r.text ||
          (r.low != null && r.high != null
            ? `${r.low} - ${r.high}`
            : r.min != null && r.max != null
              ? `${r.min} - ${r.max}`
              : r.low != null || r.min != null
                ? `>= ${r.low ?? r.min}`
                : r.high != null || r.max != null
                  ? `<= ${r.high ?? r.max}`
                  : '');
        const rawLbl = r.label ? String(r.label).trim() : '';
        const isGeneralRaw =
          !rawLbl ||
          rawLbl.includes('جميع') ||
          rawLbl.includes('عام') ||
          rawLbl === 'المعدل العام' ||
          rawLbl.toLowerCase() === 'general' ||
          rawLbl.toLowerCase() === 'all' ||
          rawLbl.toLowerCase() === 'both';

        let engLbl = isGeneralRaw ? '' : translateRefRangeToEnglish(rawLbl);
        if (!engLbl && rRanges.length > 1) {
          const sx = String(r.sex || '').toUpperCase();
          if (sx === 'M' || sx === 'MALE') engLbl = 'Male';
          else if (sx === 'F' || sx === 'FEMALE') engLbl = 'Female';
        }

        let cleanVal = translateRefRangeToEnglish(rawTxt);
        if (engLbl && cleanVal.toLowerCase().startsWith(engLbl.toLowerCase())) {
          const stripped = cleanVal.slice(engLbl.length).replace(/^[\s:：\-–—]+/, '').trim();
          if (stripped) cleanVal = stripped;
        }
        // Also strip if cleanVal still has an inline "Label: Value" structure
        if (!engLbl && cleanVal.includes(':')) {
          const colonIdx = cleanVal.indexOf(':');
          const prefix = cleanVal.slice(0, colonIdx).trim();
          const rest = cleanVal.slice(colonIdx + 1).trim();
          if (prefix && rest) {
            engLbl = prefix;
            cleanVal = rest;
          }
        }

        const rowHighlight = isMatchedRow && rRanges.length > 1
          ? 'background:rgba(2,132,199,0.08);border-radius:3px;padding:1px 4px;color:#0f172a;'
          : '';
        const matchDot = isMatchedRow && rRanges.length > 1
          ? '<span style="color:#0284c7;font-weight:900;margin-right:3px;">&#9656;</span>'
          : '';

        if (!engLbl) {
          return `<div dir="ltr" style="white-space:nowrap;direction:ltr;unicode-bidi:isolate;${rowHighlight}">${matchDot}<span style="font-weight:${isMatchedRow ? 800 : 600};">${escapeHtml(cleanVal || '-')}</span></div>`;
        }
        return `<div style="white-space:nowrap;direction:ltr;unicode-bidi:isolate;${rowHighlight}" dir="ltr">${matchDot}<span style="font-weight:${isMatchedRow ? 800 : 700};">${escapeHtml(engLbl)}:</span> <span dir="ltr" style="unicode-bidi:isolate;display:inline-block;font-weight:${isMatchedRow ? 800 : 700};">${escapeHtml(cleanVal || '-')}</span></div>`;
      };

      const resolved = resolveReferenceRange(
        t.test || t,
        sample.patient?.gender,
        sample.patient?.age,
        {
          birthDate: sample.patient?.birthDate,
          targetDate: sample.createdAt,
          resultValue: effectiveValue,
        },
        sample.createdAt,
        effectiveValue
      );

      const formatFreeRangeLineHtml = (lineStr: string, isMatchedLine = false): string => {
        const engLine = translateRefRangeToEnglish(lineStr);
        if (!engLine) return '';
        const colonIdx = engLine.indexOf(':');
        const hl = isMatchedLine
          ? 'background:rgba(2,132,199,0.08);border-radius:3px;padding:1px 4px;color:#0f172a;'
          : '';
        const dot = isMatchedLine
          ? '<span style="color:#0284c7;font-weight:900;margin-right:3px;">&#9656;</span>'
          : '';
        if (colonIdx > 0) {
          const lbl = engLine.substring(0, colonIdx).trim();
          const val = engLine.substring(colonIdx + 1).trim();
          return `<div style="white-space:nowrap;direction:ltr;unicode-bidi:isolate;${hl}" dir="ltr">${dot}<span style="font-weight:${isMatchedLine ? 800 : 700};">${escapeHtml(lbl)}:</span> <span dir="ltr" style="unicode-bidi:isolate;display:inline-block;font-weight:${isMatchedLine ? 800 : 700};">${escapeHtml(val)}</span></div>`;
        }
        return `<div dir="ltr" style="white-space:nowrap;direction:ltr;unicode-bidi:isolate;${hl}">${dot}<span style="font-weight:${isMatchedLine ? 800 : 600};">${escapeHtml(engLine)}</span></div>`;
      };

      if (printScope === 'APPLICABLE_ONLY') {
        if (resolved.matchedRange) {
          testRef = formatSingleRangeRowHtml(resolved.matchedRange, false);
        } else {
          const raw = resolved.rangeText || '-';
          testRef = formatFreeRangeLineHtml(raw, false) || `<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate;">-</span>`;
        }
      } else {
        // printScope === 'ALL': ALWAYS show ALL reference range categories/brackets (e.g. all 3 HbA1c brackets)
        if (rRanges.length > 0) {
          if (rRanges.length === 1) {
            testRef = formatSingleRangeRowHtml(rRanges[0], false);
          } else {
            const hasEnteredVal = effectiveValue !== undefined && effectiveValue !== null && String(effectiveValue).trim() !== '';
            testRef = rRanges
              .map((r: any) => {
                const isMatched =
                  hasEnteredVal &&
                  resolved.matchedRange &&
                  (resolved.matchedRange === r ||
                    (resolved.matchedRange.label === r.label &&
                      resolved.matchedRange.text === r.text &&
                      resolved.matchedRange.low === r.low &&
                      resolved.matchedRange.high === r.high));
                return formatSingleRangeRowHtml(r, Boolean(isMatched));
              })
              .join('');
          }
        } else {
          const raw =
            t.test?.refRangeText ||
            (t.test?.refRangeLow != null && t.test?.refRangeHigh != null
              ? `${t.test.refRangeLow} - ${t.test.refRangeHigh}`
              : t.refRangeText ||
                (t.refRangeLow != null && t.refRangeHigh != null
                  ? `${t.refRangeLow} - ${t.refRangeHigh}`
                  : '-'));
          const segments = String(raw)
            .split(/\r?\n|\||;/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (segments.length > 1) {
            const hasEnteredVal = effectiveValue !== undefined && effectiveValue !== null && String(effectiveValue).trim() !== '';
            const matchedNorm = translateRefRangeToEnglish(resolved.rangeText || '').toLowerCase();
            testRef = segments
              .map((seg) => {
                const segNorm = translateRefRangeToEnglish(seg).toLowerCase();
                const isMatched = hasEnteredVal && Boolean(matchedNorm) && (segNorm === matchedNorm || segNorm.endsWith(matchedNorm));
                return formatFreeRangeLineHtml(seg, isMatched);
              })
              .join('');
          } else {
            testRef = formatFreeRangeLineHtml(raw, false) || `<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate;">-</span>`;
          }
        }
      }

      let displayValue = effectiveValue
        ? `<span style="font-weight:${isAbnormal ? 900 : (resultValueFontWeight === 'bold' ? 800 : 500)};color:${resColor};">${escapeHtml(toEnglishDigits(effectiveValue))}${arrowHtml}</span>`
        : '<span style="color:#94a3b8;">Pending</span>';

      if (typeof t.resultValue === 'string' && (t.resultValue.includes('MICROBIOLOGY') || t.resultValue.includes('ANTIBIOGRAM:'))) {
        const clean = t.resultValue.replace(/\[.*?MICROBIOLOGY.*?\]/gi, '').trim();
        const lines = clean.split('\n').filter(Boolean);
        let metaHtml = '';
        let antiHtml = '';
        let notesHtml = '';
        lines.forEach((line: string) => {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('ANTIBIOGRAM:')) {
            const itemsStr = cleanLine.replace('ANTIBIOGRAM:', '').trim();
            if (!itemsStr.includes('No active')) {
              const items = itemsStr.split('|').map(p => p.trim());
              antiHtml = `
                <div style="margin-top: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #0d9488; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">ANTIBIOTIC SENSITIVITY PROFILE</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                    ${items.map(item => {
                      return `<div style="background: #f8fafc; color: ${textColor}; font-weight: 700; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${escapeHtml(item)}</div>`;
                    }).join('')}
                  </div>
                </div>`;
            } else {
              antiHtml = `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">${escapeHtml(itemsStr)}</div>`;
            }
          } else if (cleanLine.startsWith('NOTES:')) {
            notesHtml = `<div style="background: #f8fafc; border-left: 3px solid #0d9488; padding: 4px 8px; font-size: 11px; color: #334155; margin-top: 6px; border-radius: 0 4px 4px 0;"><strong>Note:</strong> ${escapeHtml(cleanLine.replace('NOTES:', '').trim())}</div>`;
          } else {
            metaHtml += `<div style="background: #ffffff; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 3px;">${escapeHtml(cleanLine)}</div>`;
          }
        });
        displayValue = `<div style="text-align: left; background: #f0fdfa; padding: 8px 12px; border-radius: 8px; border: 1px solid #99f6e4; max-width: 520px; margin: 4px 0;">${metaHtml}${antiHtml}${notesHtml}</div>`;
      }

      const rowBg = tableZebraStriping && rowIdx % 2 === 1 ? 'rgba(0,0,0,0.025)' : 'transparent';
      const borderStyle = tableRowBorders ? `border-bottom: 1px solid ${borderColor};` : '';

      const prior = findPriorForTest(t);
      let priorHtml = '-';
      if (prior) {
        const priorEval = classifyResultRange(prior.value, t.test || t, patientContext);
        const priorArrow = priorEval.isAbnormal
          ? ` <strong style="color: ${priorEval.color}; font-weight: 900; margin-left: 2px; font-family: Arial, sans-serif;">${priorEval.arrow}</strong>`
          : '';
        priorHtml = `<span style="color:${priorEval.isAbnormal ? priorEval.color : '#475569'};font-weight:${priorEval.isAbnormal ? 800 : 500};">${escapeHtml(toEnglishDigits(prior.value))}${priorArrow}</span>`;
        if (prior.date) {
          priorHtml += `<br/><span style="font-size: 8.5px; color: #94a3b8; font-weight: 500; direction: ltr; display: inline-block;">${escapeHtml(prior.date)}</span>`;
        }
      }

      return `
        <tr style="background: ${rowBg}; ${borderStyle} page-break-inside: avoid;">
          ${effectiveColumns.map((col: any) => {
            const alignStyle = `text-align: ${col.align};`;
            if (col.id === 'testName') {
              return `<td style="padding: ${customCellPadding}; font-size: ${testNameFontSize}px; font-weight: ${testNameFontWeight === 'bold' ? 800 : 500}; color: ${textColor}; ${alignStyle}">${testName}</td>`;
            }
            if (col.id === 'result') {
              return `<td style="padding: ${customCellPadding}; font-size: ${resultValueFontSize}px; ${alignStyle}">${displayValue}</td>`;
            }
            if (col.id === 'previous') {
              return `<td style="padding: ${customCellPadding}; ${alignStyle}">${priorHtml}</td>`;
            }
            if (col.id === 'unit') {
              return `<td style="padding: ${customCellPadding}; font-size: ${unitFontSize}px; color: ${textColor}; opacity: 0.85; ${alignStyle}">${testUnit}</td>`;
            }
            if (col.id === 'refRange') {
              return `<td style="padding: ${customCellPadding}; font-size: ${refRangeFontSize}px; color: ${textColor}; opacity: 0.85; ${alignStyle}">${testRef}</td>`;
            }
            if (col.id === 'notes') {
              return `<td style="padding: ${customCellPadding}; font-size: ${unitFontSize}px; color: ${textColor}; opacity: 0.85; ${alignStyle}">${escapeHtml(t.notes || '-')}</td>`;
            }
            return '';
          }).join('')}
        </tr>`;
    };

    let maxWeightPerPage = 17;
    const paddingStr = customCellPadding || '';
    if (paddingStr.includes('4px') || paddingStr.includes('3px')) {
      maxWeightPerPage = 22;
    } else if (paddingStr.includes('11px') || paddingStr.includes('9px') || paddingStr.includes('10px')) {
      maxWeightPerPage = 13;
    }
    if (testNameFontSize >= 14 || resultValueFontSize >= 14) {
      maxWeightPerPage -= 2;
    }

    interface RenderItem {
      type: 'header' | 'row';
      html: string;
      weight: number;
      categoryName?: string;
    }
    const renderItems: RenderItem[] = [];

    if (groupByCategory) {
      const groupingStyle = settings?.groupingStyle || 'specialty';
      if (groupingStyle === 'specialty') {
        const specialties = store.specialties || [];
        const groups = store.testGroups || [];
        const grouped = groupTests(generalWithLipid, 'specialty', { specialties, groups });
        let globalRowIdx = 0;

        grouped.sections.forEach((sec) => {
          renderItems.push({
            type: 'header',
            weight: 1.5,
            categoryName: sec.nameEn,
            html: `
              <tr style="background: ${headerBgColor}15; page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid;">
                <td colspan="${effectiveColumns.length}" style="padding: 7px 12px; font-weight: 900; font-size: ${testNameFontSize + 1}px; color: ${headerBgColor}; border-top: 2px solid ${headerBgColor}; border-bottom: 1.5px solid ${borderColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                  🏥 ${escapeHtml(sec.nameEn)}
                </td>
              </tr>
            `,
          });

          sec.groups.forEach((grp) => {
            renderItems.push({
              type: 'header',
              weight: 1.0,
              categoryName: grp.nameEn,
              html: `
                <tr style="background: rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid;">
                  <td colspan="${effectiveColumns.length}" style="padding: 5px 16px; font-weight: 800; font-size: ${testNameFontSize}px; color: #334155; border-bottom: 1px solid ${borderColor};">
                    📁 ${escapeHtml(grp.nameEn)}
                  </td>
                </tr>
              `,
            });
            grp.tests.forEach((t) => {
              const rRanges = t.test?.referenceRanges || [];
              const w = rRanges.length > 2 ? 1.5 : 1.0;
              renderItems.push({
                type: 'row',
                weight: w,
                categoryName: grp.nameEn,
                html: renderGeneralTestRow(t, globalRowIdx++),
              });
            });
          });

          sec.directTests.forEach((t) => {
            const rRanges = t.test?.referenceRanges || [];
            const w = rRanges.length > 2 ? 1.5 : 1.0;
            renderItems.push({
              type: 'row',
              weight: w,
              categoryName: sec.nameEn,
              html: renderGeneralTestRow(t, globalRowIdx++),
            });
          });
        });
      } else {
        const categories: { [key: string]: any[] } = {};
        generalWithLipid.forEach((t: any) => {
          const cat = getReportEnglishCategory(t.test?.category || 'General Laboratory Tests');
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(t);
        });

        let globalRowIdx = 0;
        Object.keys(categories).forEach((catName) => {
          renderItems.push({
            type: 'header',
            weight: 1.25,
            categoryName: catName,
            html: `
              <tr style="background: rgba(0,0,0,0.04); page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid;">
                <td colspan="${effectiveColumns.length}" style="padding: 6px 12px; font-weight: 800; font-size: ${testNameFontSize}px; color: ${headerBgColor}; border-bottom: 2px solid ${borderColor};">
                  📂 ${escapeHtml(catName)}
                </td>
              </tr>
            `,
          });
          categories[catName].forEach((t) => {
            const rRanges = t.test?.referenceRanges || [];
            const w = rRanges.length > 2 ? 1.5 : 1.0;
            renderItems.push({
              type: 'row',
              weight: w,
              categoryName: catName,
              html: renderGeneralTestRow(t, globalRowIdx++),
            });
          });
        });
      }
    } else {
      generalWithLipid.forEach((t: any, idx: number) => {
        const rRanges = t.test?.referenceRanges || [];
        const w = rRanges.length > 2 ? 1.5 : 1.0;
        renderItems.push({
          type: 'row',
          weight: w,
          html: renderGeneralTestRow(t, idx),
        });
      });
    }

    const generalPages: string[] = [];

    let currentPageRows: string[] = [];
    let currentWeight = 0;
    let activeCategoryName: string | undefined = undefined;

    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];
      if (item.categoryName) {
        activeCategoryName = item.categoryName;
      }

      // Check if this item would overflow the current page
      if (currentWeight + item.weight > maxWeightPerPage && currentPageRows.length > 0) {
        generalPages.push(currentPageRows.join(''));
        currentPageRows = [];
        currentWeight = 0;

        // If breaking inside a category, prepend continuation banner
        if (item.type === 'row' && activeCategoryName && groupByCategory) {
          const contHeader = `
            <tr style="background: rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid;">
              <td colspan="${effectiveColumns.length}" style="padding: 4px 12px; font-weight: 700; font-size: ${testNameFontSize - 1}px; color: ${headerBgColor}; border-bottom: 1px dashed ${borderColor};">
                📂 ${escapeHtml(activeCategoryName)} <span style="font-size: 10px; font-weight: 500; color: #64748b;">(Continued)</span>
              </td>
            </tr>
          `;
          currentPageRows.push(contHeader);
          currentWeight += 0.8;
        }
      }

      currentPageRows.push(item.html);
      currentWeight += item.weight;
    }

    if (currentPageRows.length > 0) {
      generalPages.push(currentPageRows.join(''));
    }

    const totalGeneralPages = generalPages.length;
    generalPages.forEach((pageRowsHtml, pageIdx) => {
      const pageBadge = totalGeneralPages > 1
        ? `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 6px; padding: 0 4px;" dir="ltr">
             <span>LABORATORY DIAGNOSTIC REPORT</span>
             <span>Page ${pageIdx + 1} of ${totalGeneralPages}</span>
           </div>`
        : '';

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}
            ${pageBadge}
            <table dir="ltr" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: left;">
              <thead>
                <tr class="table-header" style="background: ${headerBgColor}; color: ${headerTextColor};">
                  ${effectiveColumns.map((col: any, idx: number) => `
                    <th style="padding: ${customCellPadding}; text-align: ${col.align}; font-size: ${testNameFontSize}px; ${idx === 0 ? 'border-radius: 6px 0 0 0;' : ''} ${idx === effectiveColumns.length - 1 ? 'border-radius: 0 6px 0 0;' : ''}">
                      ${escapeHtml(col.label)}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${pageRowsHtml}
              </tbody>
            </table>
          </div>
          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    });
  }

  // 2. Dedicated Complete Blood Count (CBC) & 5-Part Differential Pages
  interface ParsedCbc {
    rbc: string;
    hgb: string;
    hct: string;
    mcv: string;
    mch: string;
    mchc: string;
    rdw: string;
    plt: string;
    mpv: string;
    pdw: string;
    pct: string;
    wbc: string;
    neutrophils: string;
    lymphocytes: string;
    monocytes: string;
    eosinophils: string;
    basophils: string;
    morphology: string;
    comments: string;
  }

  const parseCbcData = (rawVal: string): ParsedCbc => {
    const res: ParsedCbc = {
      rbc: '-', hgb: '-', hct: '-', mcv: '-', mch: '-', mchc: '-', rdw: '-',
      plt: '-', mpv: '-', pdw: '-', pct: '-',
      wbc: '-', neutrophils: '-', lymphocytes: '-', monocytes: '-', eosinophils: '-', basophils: '-',
      morphology: '', comments: ''
    };
    if (!rawVal) return res;

    const cleanVal = toEnglishDigits(rawVal);
    const lines = cleanVal.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().startsWith('ERYTHROID:')) {
        const rbcM = trimmed.match(/RBC:\s*([^\s|]+)/i);
        if (rbcM) res.rbc = rbcM[1];
        const hgbM = trimmed.match(/HGB:\s*([^\s|]+)/i);
        if (hgbM) res.hgb = hgbM[1];
        const hctM = trimmed.match(/HCT:\s*([^\s|]+)/i);
        if (hctM) res.hct = hctM[1];
        const mcvM = trimmed.match(/MCV:\s*([^\s|]+)/i);
        if (mcvM) res.mcv = mcvM[1];
        const mchM = trimmed.match(/MCH:\s*([^\s|]+)/i);
        if (mchM) res.mch = mchM[1];
        const mchcM = trimmed.match(/MCHC:\s*([^\s|]+)/i);
        if (mchcM) res.mchc = mchcM[1];
        const rdwM = trimmed.match(/RDW:\s*([^\s|]+)/i);
        if (rdwM) res.rdw = rdwM[1];
      } else if (trimmed.toUpperCase().startsWith('PLATELETS:')) {
        const pltM = trimmed.match(/PLT:\s*([^\s|]+)/i);
        if (pltM) res.plt = pltM[1];
        const mpvM = trimmed.match(/MPV:\s*([^\s|]+)/i);
        if (mpvM) res.mpv = mpvM[1];
        const pdwM = trimmed.match(/PDW:\s*([^\s|]+)/i);
        if (pdwM) res.pdw = pdwM[1];
        const pctM = trimmed.match(/PCT:\s*([^\s|]+)/i);
        if (pctM) res.pct = pctM[1];
      } else if (trimmed.toUpperCase().startsWith('LEUKOCYTES:')) {
        const wbcM = trimmed.match(/WBC:\s*([^\s|]+)/i);
        if (wbcM) res.wbc = wbcM[1];
      } else if (trimmed.toUpperCase().startsWith('DIFFERENTIAL:')) {
        const neutM = trimmed.match(/Neut:\s*([^\s%|]+)/i);
        if (neutM) res.neutrophils = neutM[1];
        const lymphM = trimmed.match(/Lymph:\s*([^\s%|]+)/i);
        if (lymphM) res.lymphocytes = lymphM[1];
        const monoM = trimmed.match(/Mono:\s*([^\s%|]+)/i);
        if (monoM) res.monocytes = monoM[1];
        const eosM = trimmed.match(/Eos:\s*([^\s%|]+)/i);
        if (eosM) res.eosinophils = eosM[1];
        const basoM = trimmed.match(/Baso:\s*([^\s%|]+)/i);
        if (basoM) res.basophils = basoM[1];
      } else if (trimmed.toUpperCase().startsWith('MORPHOLOGY:')) {
        res.morphology = trimmed.replace(/MORPHOLOGY:/i, '').trim();
      } else if (trimmed.toUpperCase().startsWith('COMMENTS:') || trimmed.toUpperCase().startsWith('COMMENT:')) {
        res.comments = trimmed.replace(/COMMENTS?:/i, '').trim();
      } else {
        const rbcM = trimmed.match(/\bRBC\b[:\s=]+([0-9.]+)/i);
        if (rbcM && res.rbc === '-') res.rbc = rbcM[1];
        const hgbM = trimmed.match(/\b(HGB|HB)\b[:\s=]+([0-9.]+)/i);
        if (hgbM && res.hgb === '-') res.hgb = hgbM[2];
        const hctM = trimmed.match(/\b(HCT|PCV)\b[:\s=]+([0-9.]+)/i);
        if (hctM && res.hct === '-') res.hct = hctM[2];
        const mcvM = trimmed.match(/\bMCV\b[:\s=]+([0-9.]+)/i);
        if (mcvM && res.mcv === '-') res.mcv = mcvM[1];
        const mchM = trimmed.match(/\bMCH\b[:\s=]+([0-9.]+)/i);
        if (mchM && res.mch === '-') res.mch = mchM[1];
        const mchcM = trimmed.match(/\bMCHC\b[:\s=]+([0-9.]+)/i);
        if (mchcM && res.mchc === '-') res.mchc = mchcM[1];
        const rdwM = trimmed.match(/\bRDW\b[:\s=]+([0-9.]+)/i);
        if (rdwM && res.rdw === '-') res.rdw = rdwM[1];
        const pltM = trimmed.match(/\bPLT\b[:\s=]+([0-9.]+)/i);
        if (pltM && res.plt === '-') res.plt = pltM[1];
        const mpvM = trimmed.match(/\bMPV\b[:\s=]+([0-9.]+)/i);
        if (mpvM && res.mpv === '-') res.mpv = mpvM[1];
        const pdwM = trimmed.match(/\bPDW\b[:\s=]+([0-9.]+)/i);
        if (pdwM && res.pdw === '-') res.pdw = pdwM[1];
        const pctM = trimmed.match(/\bPCT\b[:\s=]+([0-9.]+)/i);
        if (pctM && res.pct === '-') res.pct = pctM[1];
        const wbcM = trimmed.match(/\bWBC\b[:\s=]+([0-9.]+)/i);
        if (wbcM && res.wbc === '-') res.wbc = wbcM[1];
      }
    }
    return res;
  };

  const isFemale = patient.gender === 'FEMALE';
  const rbcRef = isFemale ? '4.00 - 5.20' : '4.50 - 5.90';
  const rbcLow = isFemale ? 4.0 : 4.5;
  const rbcHigh = isFemale ? 5.2 : 5.9;
  const hgbRef = isFemale ? '12.0 - 15.5' : '13.0 - 17.5';
  const hgbLow = isFemale ? 12.0 : 13.0;
  const hgbHigh = isFemale ? 15.5 : 17.5;
  const hctRef = isFemale ? '36.0 - 48.0' : '40.0 - 52.0';
  const hctLow = isFemale ? 36.0 : 40.0;
  const hctHigh = isFemale ? 48.0 : 52.0;

  let priorCbcParsed: ParsedCbc | null = null;
  let priorCbcDate = '';
  const cbcToggle = cbcTests.find((t: any) => (t as any).includePrevious);
  if (cbcToggle) {
    if ((cbcToggle as any).previousValue && String((cbcToggle as any).previousValue).trim() !== '') {
      priorCbcParsed = parseCbcData(String((cbcToggle as any).previousValue));
      priorCbcDate = (cbcToggle as any).previousDate ? formatEnglishDate((cbcToggle as any).previousDate) : '';
    } else {
      const tid = (cbcToggle as any).testId || (cbcToggle as any).test?.id;
      const wantId = (cbcToggle as any).previousSampleId;
      const ordered = [...priorSamples].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const pick = wantId ? ordered.find((s) => s.id === wantId) : ordered.find((ps) => (ps.tests || []).some((x: any) => isCbcTest(x.test || x) && x.resultValue && String(x.resultValue).trim() !== ''));
      if (pick) {
        const pCbc: any = (pick.tests || []).find((x: any) => {
          if (tid && (x.testId === tid || x.test?.id === tid)) return true;
          return isCbcTest(x.test || x);
        }) || (pick.tests || []).find((x: any) => isCbcTest(x.test || x));
        if (pCbc && pCbc.resultValue && String(pCbc.resultValue).trim() !== '') {
          priorCbcParsed = parseCbcData(String(pCbc.resultValue));
          priorCbcDate = formatEnglishDate(pick.createdAt);
        }
      }
      if (!priorCbcParsed) {
        for (const ps of priorSamples) {
          const pCbc = (ps.tests || []).find((t: any) => isCbcTest(t.test || t));
          if (pCbc && pCbc.resultValue && String(pCbc.resultValue).trim() !== '') {
            priorCbcParsed = parseCbcData(String(pCbc.resultValue));
            priorCbcDate = formatEnglishDate(ps.createdAt);
            break;
          }
        }
      }
    }
  } else if (!cbcTests.some((t: any) => (t as any).includePrevious === false)) {
    for (const ps of priorSamples) {
      const pCbc = (ps.tests || []).find((t: any) => isCbcTest(t.test || t));
      if (pCbc && pCbc.resultValue && String(pCbc.resultValue).trim() !== '') {
        priorCbcParsed = parseCbcData(String(pCbc.resultValue));
        priorCbcDate = formatEnglishDate(ps.createdAt);
        break;
      }
    }
  }

  const renderCbcRow = (name: string, val: string, unit: string, ref: string, _low: number, _high: number, priorVal?: string) => {
    const hasVal = val && val !== '-';
    const hasPrior = priorVal && priorVal !== '-';
    const evalResult = hasVal ? classifyResultRange(val, { low: _low, high: _high }) : null;
    const isAbnormal = evalResult?.isAbnormal || false;
    const rowColor = isAbnormal ? evalResult!.color : textColor;
    const arrowHtml = isAbnormal
      ? ` <strong style="color: ${evalResult!.color}; font-weight: 900; margin-left: 4px; font-family: Arial, sans-serif;">${evalResult!.arrow}</strong>`
      : '';

    let priorHtml = '-';
    if (hasPrior) {
      const priorEval = classifyResultRange(priorVal!, { low: _low, high: _high });
      const priorColor = priorEval.isAbnormal ? priorEval.color : '#475569';
      const priorArrow = priorEval.isAbnormal
        ? ` <strong style="color: ${priorEval.color}; font-weight: 900; margin-left: 2px; font-family: Arial, sans-serif;">${priorEval.arrow}</strong>`
        : '';
      priorHtml = `<span style="color: ${priorColor}; font-weight: ${priorEval.isAbnormal ? 800 : 600};">${escapeHtml(priorVal!)}${priorArrow}</span>`;
    }

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; font-size: ${specialFormFontSize}px;">
        <td style="padding: ${customCellPadding}; font-weight: 700; color: #1e293b; text-align: left;">${name}</td>
        <td style="padding: ${customCellPadding}; font-weight: ${isAbnormal ? 900 : 800}; color: ${rowColor}; text-align: left;">
          ${hasVal ? `${escapeHtml(val)}${arrowHtml}` : '<span style="color:#94a3b8;">Pending</span>'}
        </td>
        ${priorCbcParsed ? `
          <td style="padding: ${customCellPadding}; font-weight: 700; color: #475569; text-align: left;">
            ${priorHtml}
          </td>
        ` : ''}
        <td style="padding: ${customCellPadding}; color: #64748b; font-weight: 600; text-align: left;">${unit}</td>
        <td style="padding: ${customCellPadding}; color: #334155; font-weight: 600; text-align: left;"><span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate;">${ref}</span></td>
      </tr>`;
  };

  const renderDiffRow = (name: string, pctStr: string, refPct: string, _low: number, _high: number, wbcVal: number, priorPct?: string) => {
    const num = parseFloat(pctStr);
    const hasVal = pctStr && pctStr !== '-';
    const evalResult = hasVal ? classifyResultRange(pctStr, { low: _low, high: _high }) : null;
    const isAbnormal = evalResult?.isAbnormal || false;
    const diffColor = isAbnormal ? evalResult!.color : textColor;
    const arrowHtml = isAbnormal
      ? ` <strong style="color: ${evalResult!.color}; font-weight: 900; margin-left: 4px; font-family: Arial, sans-serif;">${evalResult!.arrow}</strong>`
      : '';

    const absVal = hasVal && !isNaN(num) && wbcVal > 0 ? ((wbcVal * num) / 100).toFixed(2) : '-';
    const hasPrior = priorPct && priorPct !== '-';
    let priorHtml = '-';
    if (hasPrior) {
      const priorEval = classifyResultRange(priorPct!, { low: _low, high: _high });
      const priorColor = priorEval.isAbnormal ? priorEval.color : '#475569';
      const priorArrow = priorEval.isAbnormal
        ? ` <strong style="color: ${priorEval.color}; font-weight: 900; margin-left: 2px; font-family: Arial, sans-serif;">${priorEval.arrow}</strong>`
        : '';
      priorHtml = `<span style="color: ${priorColor}; font-weight: ${priorEval.isAbnormal ? 800 : 600};">${escapeHtml(priorPct!)} %${priorArrow}</span>`;
    }

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; font-size: ${specialFormFontSize}px;">
        <td style="padding: ${customCellPadding}; font-weight: 700; color: #1e293b; text-align: left;">${name}</td>
        <td style="padding: ${customCellPadding}; font-weight: ${isAbnormal ? 900 : 800}; color: ${diffColor}; text-align: left;">
          ${hasVal ? `${escapeHtml(pctStr)} %${arrowHtml}` : '<span style="color:#94a3b8;">Pending</span>'}
        </td>
        ${priorCbcParsed ? `
          <td style="padding: ${customCellPadding}; font-weight: 700; color: #475569; text-align: left;">
            ${priorHtml}
          </td>
        ` : ''}
        <td style="padding: ${customCellPadding}; font-weight: 700; color: ${headerBgColor}; text-align: left;">
          ${absVal !== '-' ? `${absVal} <span style="font-size: ${Math.max(9, specialFormFontSize - 2.5)}px; color: #64748b; font-weight: 600;">10^3/uL</span>` : '-'}
        </td>
        <td style="padding: ${customCellPadding}; color: #334155; font-weight: 600; text-align: left;"><span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate;">${refPct}</span></td>
      </tr>`;
  };

  if (shouldRenderCbc) {
    for (const cbc of cbcTests) {
      const rawVal = cbc.resultValue ? String(cbc.resultValue) : '';
      const parsed = parseCbcData(rawVal);
      const rbcNum = parseFloat(parsed.rbc);
      const mcvNum = parseFloat(parsed.mcv);
      const wbcNum = parseFloat(parsed.wbc) || 0;

      let mentzerHtml = '';
      if (!isNaN(rbcNum) && !isNaN(mcvNum) && rbcNum > 0 && mcvNum > 0) {
        const mIdx = Math.round((mcvNum / rbcNum) * 10) / 10;
        if (mcvNum < 80) {
          const isThal = mIdx < 13;
          const desc = isThal ? 'Mentzer Index < 13: Suggests Beta-Thalassemia Trait' : 'Mentzer Index ≥ 13: Suggests Iron Deficiency Anemia';
          const badgeBg = isThal ? '#eff6ff' : '#fefce8';
          const badgeBdr = isThal ? '#bfdbfe' : '#fef08a';
          const badgeCol = isThal ? '#1d4ed8' : '#854d0e';
          mentzerHtml = `
            <div style="background: ${badgeBg}; border: 1px solid ${badgeBdr}; color: ${badgeCol}; padding: 6px 10px; border-radius: 6px; font-size: ${specialFormFontSize}px; margin-top: 6px; text-align: left;" dir="ltr">
              <strong>Mentzer Index (MCV/RBC):</strong> ${mIdx} &bull; <em>${desc}</em>
            </div>`;
        }
      }

      const nVal = parseFloat(parsed.neutrophils) || 0;
      const lVal = parseFloat(parsed.lymphocytes) || 0;
      const mVal = parseFloat(parsed.monocytes) || 0;
      const eVal = parseFloat(parsed.eosinophils) || 0;
      const bVal = parseFloat(parsed.basophils) || 0;
      const hasDiffData = parsed.neutrophils !== '-' || parsed.lymphocytes !== '-';
      const diffSum = Math.round((nVal + lVal + mVal + eVal + bVal) * 10) / 10;

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}

            <!-- CBC Header Banner -->
            <div style="background: linear-gradient(90deg, #be123c 0%, #e11d48 100%); color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>COMPLETE BLOOD COUNT (CBC) &amp; 5-PART DIFFERENTIAL</span>
              <span style="font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.95;">AUTOMATED HEMATOLOGY REPORT</span>
            </div>

            <!-- 2-Column Clinical Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;" dir="ltr">
              <!-- Column 1: Erythroid Series & Platelet Indices -->
              <div>
                <!-- Erythroid Series -->
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                  <div style="background: #f8fafc; padding: 6px 10px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #be123c; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <span>1. ERYTHROID SERIES &amp; RED CELL INDICES</span>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px; text-align: left;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; border-bottom: 1px solid #cbd5e1;">
                        <th style="padding: 5px 10px; text-align: left;">INVESTIGATION</th>
                        <th style="padding: 5px 10px; text-align: left;">RESULT</th>
                        ${priorCbcParsed ? `<th style="padding: 5px 10px; text-align: left;">PREVIOUS (${priorCbcDate})</th>` : ''}
                        <th style="padding: 5px 10px; text-align: left;">UNIT</th>
                        <th style="padding: 5px 10px; text-align: left;">REFERENCE RANGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderCbcRow('R.B.C (Red Blood Cells)', parsed.rbc, '10^6/uL', rbcRef, rbcLow, rbcHigh, priorCbcParsed?.rbc)}
                      ${renderCbcRow('HGB (Hemoglobin)', parsed.hgb, 'g/dL', hgbRef, hgbLow, hgbHigh, priorCbcParsed?.hgb)}
                      ${renderCbcRow('HCT / PCV (Hematocrit)', parsed.hct, '%', hctRef, hctLow, hctHigh, priorCbcParsed?.hct)}
                      ${renderCbcRow('MCV (Mean Corpuscular Vol)', parsed.mcv, 'fL', '80.0 - 100.0', 80.0, 100.0, priorCbcParsed?.mcv)}
                      ${renderCbcRow('MCH (Mean Corpuscular Hb)', parsed.mch, 'pg', '27.0 - 33.0', 27.0, 33.0, priorCbcParsed?.mch)}
                      ${renderCbcRow('MCHC (Mean Corpuscular Conc)', parsed.mchc, 'g/dL', '32.0 - 36.0', 32.0, 36.0, priorCbcParsed?.mchc)}
                      ${renderCbcRow('RDW-CV (Red Cell Distribution)', parsed.rdw, '%', '11.5 - 14.5', 11.5, 14.5, priorCbcParsed?.rdw)}
                    </tbody>
                  </table>
                  ${mentzerHtml ? `<div style="padding: 0 8px 8px 8px;">${mentzerHtml}</div>` : ''}
                </div>

                <!-- Platelet Indices -->
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 6px 10px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <span>2. PLATELET INDICES (THROMBOCYTES)</span>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px; text-align: left;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; border-bottom: 1px solid #cbd5e1;">
                        <th style="padding: 5px 10px; text-align: left;">INVESTIGATION</th>
                        <th style="padding: 5px 10px; text-align: left;">RESULT</th>
                        ${priorCbcParsed ? `<th style="padding: 5px 10px; text-align: left;">PREVIOUS (${priorCbcDate})</th>` : ''}
                        <th style="padding: 5px 10px; text-align: left;">UNIT</th>
                        <th style="padding: 5px 10px; text-align: left;">REFERENCE RANGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderCbcRow('PLT (Platelet Count)', parsed.plt, '10^3/uL', '150 - 450', 150, 450, priorCbcParsed?.plt)}
                      ${renderCbcRow('MPV (Mean Platelet Volume)', parsed.mpv, 'fL', '7.4 - 10.4', 7.4, 10.4, priorCbcParsed?.mpv)}
                      ${renderCbcRow('PDW (Platelet Dist. Width)', parsed.pdw, '%', '9.0 - 17.0', 9.0, 17.0, priorCbcParsed?.pdw)}
                      ${renderCbcRow('PCT (Plateletcrit)', parsed.pct, '%', '0.15 - 0.40', 0.15, 0.40, priorCbcParsed?.pct)}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Column 2: Total Leukocytes & 5-Part Differential -->
              <div>
                <!-- Total WBC & Differential -->
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                  <div style="background: #f8fafc; padding: 6px 10px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #166534; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <span>3. TOTAL LEUKOCYTES &amp; 5-PART DIFFERENTIAL</span>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px; text-align: left;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; border-bottom: 1px solid #cbd5e1;">
                        <th style="padding: 5px 10px; text-align: left;">INVESTIGATION</th>
                        <th style="padding: 5px 10px; text-align: left;">RESULT</th>
                        ${priorCbcParsed ? `<th style="padding: 5px 10px; text-align: left;">PREVIOUS (${priorCbcDate})</th>` : ''}
                        <th style="padding: 5px 10px; text-align: left;">UNIT</th>
                        <th style="padding: 5px 10px; text-align: left;">REFERENCE RANGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderCbcRow('W.B.C (Total Leukocytes)', parsed.wbc, '10^3/uL', '4.0 - 11.0', 4.0, 11.0, priorCbcParsed?.wbc)}
                    </tbody>
                  </table>

                  <!-- Differential Sub-table -->
                  <div style="background: #f8fafc; padding: 4px 10px; font-weight: 700; font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; color: #475569; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                    <span>5-PART DIFFERENTIAL COUNT</span>
                    ${hasDiffData ? `<span style="font-size: ${Math.max(9, specialFormFontSize - 2)}px; color: ${Math.abs(diffSum - 100) < 1 ? '#166534' : '#b91c1c'}; font-weight: 800;">Sum: ${diffSum}%</span>` : ''}
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px; text-align: left;">
                    <thead>
                      <tr style="background: #ffffff; color: #64748b; font-size: ${Math.max(9, specialFormFontSize - 2)}px; border-bottom: 1px solid #f1f5f9;">
                        <th style="padding: 4px 10px; text-align: left;">PARAMETER</th>
                        <th style="padding: 4px 10px; text-align: left;">RELATIVE (%)</th>
                        ${priorCbcParsed ? `<th style="padding: 4px 10px; text-align: left;">PREV (%)</th>` : ''}
                        <th style="padding: 4px 10px; text-align: left;">ABSOLUTE</th>
                        <th style="padding: 4px 10px; text-align: left;">REF. RANGE (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderDiffRow('Neutrophils', parsed.neutrophils, '40.0 - 75.0 %', 40.0, 75.0, wbcNum, priorCbcParsed?.neutrophils)}
                      ${renderDiffRow('Lymphocytes', parsed.lymphocytes, '20.0 - 45.0 %', 20.0, 45.0, wbcNum, priorCbcParsed?.lymphocytes)}
                      ${renderDiffRow('Monocytes', parsed.monocytes, '2.0 - 10.0 %', 2.0, 10.0, wbcNum, priorCbcParsed?.monocytes)}
                      ${renderDiffRow('Eosinophils', parsed.eosinophils, '1.0 - 6.0 %', 1.0, 6.0, wbcNum, priorCbcParsed?.eosinophils)}
                      ${renderDiffRow('Basophils', parsed.basophils, '0.0 - 1.0 %', 0.0, 1.0, wbcNum, priorCbcParsed?.basophils)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Graphical RBC, PLT & WBC Histograms -->
            <div style="margin-bottom: 12px; display: flex; gap: 10px;" dir="ltr">
              ${generateHistogramSvg('WBC', (cbc as any).wbcCurve)}
              ${generateHistogramSvg('RBC', (cbc as any).rbcCurve)}
              ${generateHistogramSvg('PLT', (cbc as any).pltCurve)}
            </div>

            <!-- Morphology & Clinical Comments Section -->
            ${settings.showClinicalComments !== false ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;" dir="ltr">
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px;">
                  <div style="font-size: ${specialFormFontSize}px; font-weight: 800; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be123c" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                    <span>PERIPHERAL BLOOD FILM MORPHOLOGY</span>
                  </div>
                  <div style="font-size: ${specialFormFontSize}px; color: #334155; line-height: 1.45;">
                    ${escapeHtml(parsed.morphology || 'Normocytic Normochromic red blood cells. Normal leukocyte morphology and adequate platelets on peripheral smear.')}
                  </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px;">
                  <div style="font-size: ${specialFormFontSize}px; font-weight: 800; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>CLINICAL COMMENTS &amp; INTERPRETATION</span>
                  </div>
                  <div style="font-size: ${specialFormFontSize}px; color: #334155; line-height: 1.45;">
                    ${escapeHtml(parsed.comments || 'Normal hematological profile. Clinical correlation recommended.')}
                  </div>
                </div>
              </div>
            ` : ''}

          </div>
          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    }
  }

  // 3. Dedicated General Urine Examination (G.U.E) Page
  if (shouldRenderGue) {
    for (const gue of gueTests) {
      const rawVal = gue.resultValue ? String(gue.resultValue) : '';
      const clean = rawVal.replace(/\[.*?G\.?U\.?E.*?\]/gi, '').trim();
      const lines = clean.split('\n').filter(Boolean);
      let physicalParts: string[] = [];
      let chemicalParts: string[] = [];
      let microParts: string[] = [];
      let noteText = '';

      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (cleanLine.toUpperCase().startsWith('PHYSICAL:')) {
          physicalParts = cleanLine.replace(/PHYSICAL:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('CHEMICAL:')) {
          chemicalParts = cleanLine.replace(/CHEMICAL:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('MICROSCOPIC:')) {
          microParts = cleanLine.replace(/MICROSCOPIC:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('NOTES:')) {
          noteText = cleanLine.replace(/NOTES?:/i, '').trim();
        }
      });

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}
            
            <div style="background: ${primaryCol}; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>GENERAL URINE EXAMINATION (G.U.E)</span>
              <span style="font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">CLINICAL ROUTINE URINALYSIS</span>
            </div>

            <div style="margin-bottom: 16px;">
              <!-- Physical Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>PHYSICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Chemical Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>CHEMICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${chemicalParts.length > 0 ? chemicalParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Microscopic Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>MICROSCOPIC EXAMINATION (HPF)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${(() => {
                    const printableMicro = microParts
                      .map(p => {
                        const trimmed = p.trim();
                        if (/^trichomonas:/i.test(trimmed)) {
                          const val = trimmed.replace(/^trichomonas:\s*/i, '').trim();
                          if (val && !['nil', 'none', 'not seen', '-', 'not detected'].includes(val.toLowerCase())) {
                            return `Other: Trichomonas: ${val}`;
                          }
                          return '';
                        }
                        return trimmed;
                      })
                      .filter(p => {
                        if (!p) return false;
                        const up = p.toUpperCase().trim();
                        if (up === 'CRYSTALS: NIL' || up === 'CRYSTALS: NONE' || up === 'CRYSTALS: NOT SEEN' || up === 'CRYSTALS:') return false;
                        if (up === 'CASTS: NIL' || up === 'CASTS: NONE' || up === 'CASTS: NOT SEEN' || up === 'CASTS:') return false;
                        if (up === 'YEAST: NIL' || up === 'YEAST: NONE' || up === 'YEAST: NOT SEEN' || up === 'YEAST:') return false;
                        if (up === 'OTHER: NIL' || up === 'OTHER: NONE' || up === 'OTHER: NOT SEEN' || up === 'OTHER:') return false;
                        if (up.startsWith('TRICHOMONAS:')) return false;
                        return true;
                      });
                    return printableMicro.length > 0 ? printableMicro.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>';
                  })()}
                </div>
              </div>

              ${noteText ? `
                <div style="background: #f8fafc; border-left: 4px solid ${primaryCol}; padding: 8px 12px; font-size: ${specialFormFontSize}px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
                  <strong>Clinical Note:</strong> <span style="unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(noteText)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    }
  }

  // 4. Dedicated General Stool Examination (G.S.E) Page
  if (shouldRenderGse) {
    for (const gse of gseTests) {
      const rawVal = gse.resultValue ? String(gse.resultValue) : '';
      const clean = rawVal.replace(/\[.*?G\.?S\.?E.*?\]/gi, '').trim();
      const lines = clean.split('\n').filter(Boolean);
      let physicalParts: string[] = [];
      let fobtVal = '';
      let phVal = '';
      let reducingVal = '';
      let phReducingParts: string[] = [];
      let microParts: string[] = [];
      let paraParts: string[] = [];
      let sensitivityParts: string[] = [];
      let noteText = '';

      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('PHYSICAL:')) {
          physicalParts = cleanLine.replace('PHYSICAL:', '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.startsWith('FOBT:')) {
          fobtVal = cleanLine.replace('FOBT:', '').trim();
        } else if (cleanLine.startsWith('PH:')) {
          phVal = cleanLine.replace('PH:', '').trim();
        } else if (cleanLine.startsWith('REDUCING:')) {
          reducingVal = cleanLine.replace('REDUCING:', '').trim();
        } else if (cleanLine.startsWith('PH_REDUCING:')) {
          const matchPh = cleanLine.match(/pH:\s*([^|]+)/i);
          if (matchPh) phVal = matchPh[1].trim();
          const matchRed = cleanLine.match(/Reducing Substances:\s*([^|\n]+)/i);
          if (matchRed) reducingVal = matchRed[1].trim();
          phReducingParts = cleanLine.replace('PH_REDUCING:', '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.startsWith('MICROSCOPIC:')) {
          microParts = cleanLine.replace('MICROSCOPIC:', '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.startsWith('PARASITOLOGY:')) {
          const val = cleanLine.replace('PARASITOLOGY:', '').trim();
          if (val) {
            const items = val.split('|').map(p => p.trim()).filter(Boolean);
            items.forEach(item => {
              let cleaned = item
                .replace(/\s*\(\s*\+{1,4}\s*\)/g, '')
                .replace(/\s*:\s*\+{1,4}(?=\s|$)/g, '')
                .replace(/\s+\+{1,4}(?=\s|$)/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              if (cleaned && !cleaned.toLowerCase().startsWith('nil') && !cleaned.includes('–') && !cleaned.includes(' - ')) {
                cleaned = cleaned
                  .replace(/\s*\[([^\]]+)\]/g, ' – $1')
                  .replace(/\s*\(([^)]+)\)/g, ' – $1');
              }
              if (cleaned) paraParts.push(cleaned);
            });
          }
        } else if (cleanLine.startsWith('SENSITIVITY:')) {
          sensitivityParts = cleanLine.replace('SENSITIVITY:', '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.startsWith('NOTES:')) {
          noteText = cleanLine.replace('NOTES:', '').trim();
        }
      });

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}
            
            <div style="background: #b45309; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>GENERAL STOOL EXAMINATION (G.S.E)</span>
              <span style="font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">STOOL ROUTINE &amp; PARASITOLOGY REPORT</span>
            </div>

            <div style="margin-bottom: 16px;">
              <!-- Physical Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>PHYSICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Chemical Evaluation (pH & Reducing Substances) Section -->
              ${(phVal || reducingVal || phReducingParts.length > 0) ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #0284c7; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>CHEMICAL EVALUATION ${reducingVal ? '(pH &amp; REDUCING SUBSTANCES)' : '(STOOL pH)'}</span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(${reducingVal ? '2' : '1'}, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                    ${phVal ? renderClinicalFindingBadge(`pH: ${phVal}`, false, textColor, specialFormFontSize) : ''}
                    ${reducingVal ? renderClinicalFindingBadge(`Reducing Substances: ${reducingVal}`, reducingVal !== 'Negative', textColor, specialFormFontSize) : ''}
                    ${(!phVal && !reducingVal && phReducingParts.length > 0) ? phReducingParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Occult Blood FOBT Section -->
              ${fobtVal ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #b91c1c; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>OCCULT BLOOD (F.O.B.T)</span>
                  </div>
                  <div style="padding: 12px;" dir="ltr">
                    <div style="background: ${fobtVal.includes('Positive') ? '#fef2f2' : '#f0fdf4'}; color: ${fobtVal.includes('Positive') ? '#b91c1c' : '#15803d'}; font-weight: 800; padding: 6px 12px; border-radius: 6px; border: 1px solid ${fobtVal.includes('Positive') ? '#fca5a5' : '#bbf7d0'}; font-size: ${specialFormFontSize}px; display: inline-block; text-align: left; direction: ltr;">
                      ${escapeHtml(fobtVal)}
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Microscopic Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>MICROSCOPIC EXAMINATION (HPF)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${(() => {
                    const printableGseMicro = microParts.filter(p => {
                      const colonIdx = p.indexOf(':');
                      const val = colonIdx >= 0 ? p.substring(colonIdx + 1).trim().toLowerCase() : '';
                      const key = colonIdx >= 0 ? p.substring(0, colonIdx).trim().toLowerCase() : p.toLowerCase();
                      if (key.includes('yeast') || key.includes('monilia')) {
                        return Boolean(val) && !['not seen', 'nil', 'none', '-', 'negative'].includes(val);
                      }
                      return true;
                    });
                    return printableGseMicro.length > 0 ? printableGseMicro.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>';
                  })()}
                </div>
              </div>

              <!-- Parasitology & Helminths Section -->
              ${paraParts.length > 0 ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #7e22ce; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>PARASITOLOGY &amp; HELMINTHS</span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                    ${paraParts.map(p => renderClinicalFindingBadge(p, !p.toLowerCase().startsWith('nil') && !p.toLowerCase().startsWith('none') && !p.toLowerCase().startsWith('not seen'), textColor, specialFormFontSize)).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Culture & Sensitivity Section -->
              ${sensitivityParts.length > 0 ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #0d9488; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>STOOL CULTURE &amp; SENSITIVITY PROFILE</span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                    ${sensitivityParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('')}
                  </div>
                </div>
              ` : ''}

              ${noteText ? `
                <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 8px 12px; font-size: ${specialFormFontSize}px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
                  <strong>Clinical Note:</strong> <span style="unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(noteText)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    }
  }

  // 5. Dedicated Seminal Fluid Analysis (S.F.A) Page
  if (shouldRenderSfa) {
    for (const sfa of sfaTests) {
      const rawVal = sfa.resultValue ? String(sfa.resultValue) : '';
      const clean = rawVal.replace(/\[.*?SEMINAL.*?\]/gi, '').trim();
      const lines = clean.split('\n').filter(Boolean);
      let physicalParts: string[] = [];
      let countParts: string[] = [];
      let motilityParts: string[] = [];
      let morphologyParts: string[] = [];
      let impressionText = '';
      let noteText = '';

      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (cleanLine.toUpperCase().startsWith('PHYSICAL:')) {
          physicalParts = cleanLine.replace(/PHYSICAL:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('COUNT:')) {
          countParts = cleanLine.replace(/COUNT:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('MOTILITY:')) {
          motilityParts = cleanLine.replace(/MOTILITY:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('MORPHOLOGY:')) {
          morphologyParts = cleanLine.replace(/MORPHOLOGY:/i, '').split('|').map(p => p.trim()).filter(Boolean);
        } else if (cleanLine.toUpperCase().startsWith('IMPRESSION:')) {
          impressionText = cleanLine.replace(/IMPRESSION:/i, '').trim();
        } else if (cleanLine.toUpperCase().startsWith('NOTES:')) {
          noteText = cleanLine.replace(/NOTES?:/i, '').trim();
        }
      });

      const isNormo = impressionText.toLowerCase().includes('normo') && 
                      !impressionText.toLowerCase().includes('oligo') && 
                      !impressionText.toLowerCase().includes('astheno') && 
                      !impressionText.toLowerCase().includes('terato');

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}
            
            <div style="background: #4338ca; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>SEMINAL FLUID ANALYSIS (S.F.A)</span>
              <span style="font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">WHO LABORATORY MANUAL 6TH EDITION</span>
            </div>

            <div style="margin-bottom: 14px;">
              <!-- 1. Physical / Macroscopic Examination -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #4338ca; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>1. MACROSCOPIC / PHYSICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- 2. Sperm Count & Microscopy -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #4338ca; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>2. SPERM COUNT &amp; MICROSCOPY <span style="font-size: ${Math.max(9, specialFormFontSize - 2)}px; font-weight: normal; color: #64748b; margin-left: 6px;">(Ref: Conc &ge; 15 M/mL, Total &ge; 39 M/ejac, Pus &lt; 5 /HPF)</span></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${countParts.length > 0 ? countParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- 3. Motility Assessment -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #0284c7; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>3. SPERM MOTILITY ASSESSMENT <span style="font-size: ${Math.max(9, specialFormFontSize - 2)}px; font-weight: normal; color: #64748b; margin-left: 6px;">(WHO Ref: PR &ge; 32%, PR+NP &ge; 40%, Vitality &ge; 58%)</span></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${motilityParts.length > 0 ? motilityParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- 4. Morphology -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; color: #7c3aed; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>4. SPERM MORPHOLOGY <span style="font-size: ${Math.max(9, specialFormFontSize - 2)}px; font-weight: normal; color: #64748b; margin-left: 6px;">(Kruger Strict Criteria Ref: Normal Forms &ge; 4%)</span></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; font-size: ${specialFormFontSize}px;" dir="ltr">
                  ${morphologyParts.length > 0 ? morphologyParts.map(p => renderClinicalFindingBadge(p, false, textColor, specialFormFontSize)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Diagnostic Impression -->
              ${impressionText ? `
                <div style="margin-bottom: 10px; background: ${isNormo ? '#f0fdf4' : '#fef2f2'}; border: 1.5px solid ${isNormo ? '#bbf7d0' : '#fca5a5'}; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <div>
                    <span style="font-size: ${specialFormFontSize}px; font-weight: 700; color: ${isNormo ? '#166534' : '#991b1b'}; text-transform: uppercase;">Diagnostic Impression:</span>
                    <span style="font-size: ${specialFormFontSize + 2}px; font-weight: 900; color: ${isNormo ? '#14532d' : '#7f1d1d'}; margin-left: 8px;">${escapeHtml(impressionText)}</span>
                  </div>
                  <span style="background: ${isNormo ? '#dcfce7' : '#fee2e2'}; color: ${isNormo ? '#15803d' : '#b91c1c'}; font-size: ${specialFormFontSize - 1}px; font-weight: 800; padding: 3px 10px; border-radius: 12px; border: 1px solid ${isNormo ? '#86efac' : '#fecaca'};">
                    ${isNormo ? 'NORMAL PARAMETERS' : 'CLINICAL VARIATION'}
                  </span>
                </div>
              ` : ''}

              ${noteText ? `
                <div style="background: #f8fafc; border-left: 4px solid #4338ca; padding: 6px 12px; font-size: ${specialFormFontSize}px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
                  <strong>Laboratory Notes:</strong> <span style="unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(noteText)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    }
  }

  // 6. Dedicated Anti-Mullerian Hormone (AMH) Page / Section
  if (shouldRenderAmh) {
    for (const amh of amhTests) {
      const rawVal = amh.resultValue ? String(amh.resultValue) : '';
      let method = 'VIDAS Autoanalyzer';
      let displayResult = '';
      let flag = '';
      let interpretationText = '';
      let notesText = '';

      if (rawVal.includes('[ANTI-MULLERIAN')) {
        const lines = rawVal.split('\n');
        lines.forEach((l) => {
          const tr = l.trim();
          if (tr.toUpperCase().startsWith('METHOD:')) method = tr.replace(/METHOD:/i, '').trim();
          else if (tr.toUpperCase().startsWith('RESULT:')) displayResult = tr.replace(/RESULT:/i, '').trim();
          else if (tr.toUpperCase().startsWith('INTERPRETATION:')) interpretationText = tr.replace(/INTERPRETATION:/i, '').trim();
          else if (tr.toUpperCase().startsWith('NOTES:')) notesText = tr.replace(/NOTES?:/i, '').trim();
        });
      } else {
        displayResult = rawVal.replace(/\[.*?\]/g, '').trim();
      }

      if (!displayResult) displayResult = 'Pending';

      // Parse flag and unit
      let unit = amh.test?.unit || 'ng/mL';
      let cleanVal = displayResult;
      const flagMatch = displayResult.match(/^([LH])\s+(.+)$/i);
      if (flagMatch) {
        flag = flagMatch[1].toUpperCase();
        cleanVal = flagMatch[2];
      }
      cleanVal = cleanVal.replace(/(ng\/mL|pmol\/L)/gi, '').trim();

      // Determine patient age matching
      const pAge = patient?.age || sample.patient?.age;
      let numericAge: number | null = null;
      if (pAge !== undefined && pAge !== null) {
        const m = String(pAge).match(/(\d+)/);
        if (m) numericAge = parseInt(m[1], 10);
      }

      const amhAgeRanges = [
        { label: 'From 12-17 years', min: 12, max: 17, range: '1.57-7.60' },
        { label: 'From 18-24 years', min: 18, max: 24, range: '2.15-8.40' },
        { label: 'From 25-29 years', min: 25, max: 29, range: '1.56-7.76' },
        { label: 'From 30-34 years', min: 30, max: 34, range: '1.19-7.00' },
        { label: 'From 35-39 years', min: 35, max: 39, range: '0.36-5.15' },
        { label: 'From 40-44 years', min: 40, max: 44, range: '0.17-3.84' },
      ];

      const matchedBracket = numericAge !== null
        ? amhAgeRanges.find(r => numericAge >= r.min && numericAge <= r.max)
        : null;

      const amhRowsHtml = amhAgeRanges.map((r, idx) => {
        const isMatched = matchedBracket?.label === r.label;
        const bg = isMatched ? '#f0fdf4' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
        const fontWt = isMatched ? '800' : '600';
        const txtCol = isMatched ? '#047857' : '#1e293b';
        return `
          <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 9px 18px; font-weight: ${fontWt}; color: ${txtCol}; text-align: left; font-size: ${specialFormFontSize}px;">
              ${r.label}${isMatched ? ' &nbsp;<span style="font-size: 10px; background: #059669; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Patient Age Group</span>' : ''}
            </td>
            <td style="padding: 9px 18px; font-weight: 800; color: #0f172a; text-align: right; font-family: monospace; font-size: ${specialFormFontSize + 0.5}px;">
              ${r.range}
            </td>
          </tr>
        `;
      }).join('');

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}

            <!-- AMH Title & Result Container matching user image -->
            <div style="margin-top: 14px; margin-bottom: 24px; text-align: center;" dir="ltr">
              <div style="color: #15803d; font-size: ${specialFormFontSize + 5}px; font-weight: 800; margin-bottom: 22px; font-family: sans-serif; letter-spacing: 0.2px;">
                Anti-Mullerian Hormone by ${escapeHtml(method)}
              </div>

              <div style="margin-bottom: 26px; font-size: ${specialFormFontSize + 3}px; font-weight: 700; color: #0f172a; display: inline-flex; align-items: baseline; gap: 10px;">
                <span>Result:</span>
                ${flag ? `<span style="color: ${flag === 'L' || flag === 'H' ? '#dc2626' : '#059669'}; font-weight: 900; font-size: ${specialFormFontSize + 4}px;">${flag}</span>` : ''}
                <span style="font-size: ${specialFormFontSize + 7}px; font-weight: 900; color: ${flag === 'L' || flag === 'H' ? '#dc2626' : '#0f172a'}; font-family: monospace;">${escapeHtml(cleanVal)}</span>
                <span style="font-size: ${specialFormFontSize + 1}px; font-weight: 700; color: #475569;">${escapeHtml(unit)}</span>
              </div>

              <!-- Interpretation Table Box matching user image -->
              <div style="max-width: 580px; margin: 0 auto; border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <div style="background: #cbd5e1; color: #0f172a; padding: 8px 16px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; text-align: center; border-bottom: 1px solid #94a3b8; letter-spacing: 0.5px;">
                  Interpretation
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>
                    ${amhRowsHtml}
                  </tbody>
                </table>
              </div>

              ${interpretationText ? `
                <div style="max-width: 580px; margin: 16px auto 0 auto; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 14px; text-align: left; font-size: ${specialFormFontSize}px; color: #1e293b;">
                  <strong>Clinical Assessment:</strong> <span style="font-weight: 700; color: #0f766e; margin-left: 4px;">${escapeHtml(interpretationText)}</span>
                </div>
              ` : ''}

              ${notesText ? `
                <div style="max-width: 580px; margin: 8px auto 0 auto; background: #ffffff; border-left: 3px solid #0f766e; padding: 6px 12px; font-size: ${specialFormFontSize - 1}px; color: #475569; text-align: left;">
                  <strong>Note:</strong> <span style="margin-left: 4px;">${escapeHtml(notesText)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    }
  }

  // 7. Dedicated Total β-HCG Page / Section (Full-Width Clinical Workstation Layout)
  if (shouldRenderBhcg) {
    for (const bhcg of bhcgTests) {
      const rawVal = bhcg.resultValue ? String(bhcg.resultValue) : '';
      let method = 'CLIA / ECLIA Immunoassay';
      let specimen = 'Serum';
      let displayResult = '';
      let statusText = '';
      let weeksText = '';
      let notesText = '';

      if (rawVal.includes('[TOTAL BETA-HCG') || rawVal.includes('HCG') || rawVal.includes('RESULT:')) {
        const lines = rawVal.split('\n');
        lines.forEach((l) => {
          const tr = l.trim();
          if (tr.toUpperCase().startsWith('METHOD:')) method = tr.replace(/METHOD:/i, '').trim();
          else if (tr.toUpperCase().startsWith('SPECIMEN:')) specimen = tr.replace(/SPECIMEN:/i, '').trim();
          else if (tr.toUpperCase().startsWith('RESULT:')) displayResult = tr.replace(/RESULT:/i, '').trim();
          else if (tr.toUpperCase().startsWith('STATUS:') || tr.toUpperCase().startsWith('INTERPRETATION:')) statusText = tr.replace(/^(STATUS|INTERPRETATION):/i, '').trim();
          else if (tr.toUpperCase().startsWith('GESTATIONAL_WEEKS:')) weeksText = tr.replace(/GESTATIONAL_WEEKS:/i, '').trim();
          else if (tr.toUpperCase().startsWith('NOTES:')) notesText = tr.replace(/NOTES?:/i, '').trim();
        });
      } else {
        displayResult = rawVal.replace(/\[.*?\]/g, '').trim();
      }

      if (!displayResult) displayResult = 'Pending';
      const unit = bhcg.test?.unit || 'mIU/mL';
      const cleanVal = toEnglishDigits(displayResult.replace(/(mIU\/mL|IU\/L)/gi, '').trim());

      const bhcgRanges = [
        { range: '< 5.0', week: 'Non-pregnant Females / Males', phase: 'Baseline (Non-Gestational)', min: 0, max: 5 },
        { range: '5.0 – 50', week: '3 Weeks', phase: 'Early 1st Trimester', min: 5, max: 50 },
        { range: '5.0 – 426', week: '4 Weeks', phase: '1st Trimester', min: 5, max: 426 },
        { range: '18 – 7,340', week: '5 Weeks', phase: '1st Trimester', min: 18, max: 7340 },
        { range: '1,080 – 56,500', week: '6 Weeks', phase: '1st Trimester', min: 1080, max: 56500 },
        { range: '7,650 – 229,000', week: '7 – 8 Weeks', phase: '1st Trimester (Peak Rising)', min: 7650, max: 229000 },
        { range: '25,700 – 288,000', week: '9 – 12 Weeks', phase: 'Late 1st Trimester (Peak)', min: 25700, max: 288000 },
        { range: '13,300 – 254,000', week: '13 – 16 Weeks', phase: 'Early 2nd Trimester', min: 13300, max: 254000 },
        { range: '4,060 – 165,400', week: '17 – 24 Weeks', phase: 'Mid 2nd Trimester', min: 4060, max: 165400 },
        { range: '3,640 – 117,000', week: '25 – 40 Weeks', phase: '3rd Trimester to Term', min: 3640, max: 117000 },
      ];

      // Detect matching row from explicit weeksText first, then fallback to numeric value
      const numMatch = parseFloat(cleanVal.replace(/^[<>=\s]+/, '').replace(/,/g, ''));
      let matchedIdx = -1;
      if (weeksText) {
        const wLower = weeksText.toLowerCase();
        if (wLower.includes('non-pregnant')) matchedIdx = 0;
        else {
          matchedIdx = bhcgRanges.findIndex((r, idx) => idx > 0 && wLower.includes(r.week.toLowerCase().replace('–', '-').split(' ')[0]));
        }
      }
      if (matchedIdx === -1) {
        if (cleanVal.startsWith('<') || (!isNaN(numMatch) && numMatch < 5)) {
          matchedIdx = 0;
        } else if (!isNaN(numMatch)) {
          matchedIdx = bhcgRanges.findIndex(r => r.min > 0 && numMatch >= r.min && numMatch <= r.max);
        }
      }

      const isReactive = !cleanVal.startsWith('<') && !isNaN(numMatch) && numMatch >= 25;
      const isBorderline = !cleanVal.startsWith('<') && !isNaN(numMatch) && numMatch >= 5 && numMatch < 25;
      const badgeColor = isReactive ? '#be123c' : isBorderline ? '#d97706' : '#0f766e';
      const badgeBg = isReactive ? '#fff1f2' : isBorderline ? '#fffbeb' : '#f0fdf4';
      const badgeBorder = isReactive ? '#fecdd3' : isBorderline ? '#fde68a' : '#bbf7d0';

      const effectiveStatus = statusText
        ? translateRefRangeToEnglish(statusText) || statusText
        : isReactive
          ? 'Reactive / Positive for Pregnancy'
          : isBorderline
            ? 'Borderline / Equivocal (Repeat in 48–72 hrs)'
            : 'Negative (Non-Pregnant Baseline)';

      const effectiveWeeks = weeksText
        ? translateRefRangeToEnglish(weeksText) || weeksText
        : matchedIdx >= 0
          ? bhcgRanges[matchedIdx].week
          : '-';

      const bhcgRowsHtml = bhcgRanges.map((r, idx) => {
        const isMatched = idx === matchedIdx;
        const bg = isMatched ? '#fff1f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
        const fontWt = isMatched ? '800' : '600';
        const txtCol = isMatched ? '#be123c' : '#1e293b';
        return `
          <tr style="background: ${bg}; border-bottom: 1px solid #cbd5e1;">
            <td style="padding: 6px 14px; font-weight: ${fontWt}; color: ${txtCol}; text-align: left; border-right: 1px solid #cbd5e1; font-size: ${specialFormFontSize - 0.5}px;">
              ${r.week}
              ${isMatched ? `&nbsp;<span style="font-size: 9px; background: #be123c; color: #ffffff; padding: 1.5px 6px; border-radius: 3px; font-weight: 800; letter-spacing: 0.3px;">&#10003; PATIENT BRACKET</span>` : ''}
            </td>
            <td style="padding: 6px 14px; font-weight: ${fontWt}; color: ${txtCol}; text-align: center; border-right: 1px solid #cbd5e1; font-family: monospace; font-size: ${specialFormFontSize}px;">
              ${r.range} <span style="font-size: 10px; color: #64748b; font-weight: 600;">${escapeHtml(unit)}</span>
            </td>
            <td style="padding: 6px 14px; font-weight: ${isMatched ? '700' : '500'}; color: ${isMatched ? '#be123c' : '#475569'}; text-align: left; font-size: ${specialFormFontSize - 1}px;">
              ${r.phase}
            </td>
          </tr>
        `;
      }).join('');

      renderedPages.push(`
        <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
          ${renderWatermark()}
          <div class="report-main-content">
            ${renderPrintHeader(headerParams)}
            ${renderPatientMetaBox(patientBoxParams)}

            <!-- Full-Width Model B Clinical Workstation Report for Total Beta-HCG -->
            <div style="margin-top: 8px; margin-bottom: 14px; text-align: left;" dir="ltr">
              <!-- Top Clinical Banner -->
              <div style="background: linear-gradient(135deg, #881337 0%, #be123c 100%); color: #ffffff; padding: 8px 16px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${specialFormFontSize + 1.5}px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                    QUANTITATIVE SERUM BETA-HCG ASSAY (Total &beta;-HCG)
                  </div>
                  <div style="font-size: 10px; opacity: 0.9; font-weight: 600;">
                    Reproductive Endocrinology &amp; Gestational Trophoblastic Evaluation
                  </div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span style="background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); padding: 2.5px 9px; border-radius: 4px; font-size: 9.5px; font-weight: 800;">
                    SPECIMEN: ${escapeHtml(specimen.toUpperCase())}
                  </span>
                  <span style="background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); padding: 2.5px 9px; border-radius: 4px; font-size: 9.5px; font-weight: 800;">
                    METHOD: ${escapeHtml(method)}
                  </span>
                </div>
              </div>

              <!-- Section 1: Quantitative Assay & Diagnostic Summary Cards -->
              <div style="margin-bottom: 12px;">
                <div style="background: #f1f5f9; color: #0f172a; padding: 5px 12px; font-weight: 900; font-size: ${specialFormFontSize - 1}px; border-left: 4px solid #be123c; border-radius: 0 4px 4px 0; margin-bottom: 8px; letter-spacing: 0.4px;">
                  1. QUANTITATIVE ASSAY RESULT &amp; DIAGNOSTIC SUMMARY
                </div>
                <div style="display: grid; grid-template-columns: 1.15fr 1.35fr 1.1fr; gap: 10px;">
                  <!-- Quantitative Value Box -->
                  <div style="background: ${badgeBg}; border: 1.5px solid ${badgeBorder}; border-radius: 6px; padding: 10px 14px; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px;">
                      Quantitative Total &beta;-HCG
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 6px;">
                      <span style="font-size: ${specialFormFontSize + 9}px; font-weight: 900; color: ${badgeColor}; font-family: monospace; line-height: 1.1;">
                        ${escapeHtml(cleanVal)}
                      </span>
                      <span style="font-size: ${specialFormFontSize - 0.5}px; font-weight: 800; color: #334155;">
                        ${escapeHtml(unit)}
                      </span>
                    </div>
                  </div>

                  <!-- Diagnostic Impression Box -->
                  <div style="background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid ${badgeColor}; border-radius: 6px; padding: 10px 14px; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px;">
                      Diagnostic Impression / Status
                    </div>
                    <div style="font-size: ${specialFormFontSize}px; font-weight: 800; color: ${badgeColor}; line-height: 1.3;">
                      ${escapeHtml(effectiveStatus)}
                    </div>
                  </div>

                  <!-- Gestational Age Bracket Box -->
                  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px;">
                      Gestational Age (Since LMP*)
                    </div>
                    <div style="font-size: ${specialFormFontSize + 0.5}px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                      ${escapeHtml(effectiveWeeks)}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 2: Full-Width Gestational Reference Table -->
              <div>
                <div style="background: #f1f5f9; color: #0f172a; padding: 5px 12px; font-weight: 900; font-size: ${specialFormFontSize - 1}px; border-left: 4px solid #0f172a; border-radius: 0 4px 4px 0; margin-bottom: 8px; letter-spacing: 0.4px; display: flex; justify-content: space-between; align-items: center;">
                  <span>2. GESTATIONAL AGE &amp; DEMOGRAPHIC REFERENCE INTERVALS (SINCE LMP*)</span>
                  <span style="font-size: 9.5px; font-weight: 700; color: #475569;">WHO / Standardized International Reference</span>
                </div>
                <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: #1e293b; color: #ffffff;">
                        <th style="padding: 7px 14px; font-weight: 800; font-size: ${specialFormFontSize - 1}px; text-align: left; border-right: 1px solid #475569; width: 38%;">
                          GESTATIONAL AGE (WEEKS SINCE LMP*)
                        </th>
                        <th style="padding: 7px 14px; font-weight: 800; font-size: ${specialFormFontSize - 1}px; text-align: center; border-right: 1px solid #475569; width: 34%;">
                          REFERENCE INTERVAL (${escapeHtml(unit)})
                        </th>
                        <th style="padding: 7px 14px; font-weight: 800; font-size: ${specialFormFontSize - 1}px; text-align: left; width: 28%;">
                          PHYSIOLOGICAL STAGE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${bhcgRowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Clinical Footnote -->
              <div style="margin-top: 8px; font-size: 10px; color: #475569; line-height: 1.45; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px;">
                <strong>* Clinical Note (LMP = Last Menstrual Period):</strong> In normal intrauterine pregnancy, serum &beta;-HCG levels typically double every 48–72 hours during the first 8 weeks. Values between 5–25 mIU/mL are equivocal and warrant repeat testing in 48–72 hours alongside transvaginal ultrasound correlation.
              </div>

              ${notesText ? `
                <div style="margin-top: 8px; background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #be123c; border-radius: 4px; padding: 7px 12px; font-size: ${specialFormFontSize - 0.5}px; color: #1e293b; text-align: left;">
                  <strong>Pathologist / Laboratory Comment:</strong> <span style="margin-left: 4px; font-weight: 600;">${escapeHtml(translateRefRangeToEnglish(notesText) || notesText)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="report-footer-pinned">
            ${renderFooter(safeFooter, safeLabName)}
          </div>
        </div>
      `);
    }
  }

  // 7. Specialized Clinical Forms (BLOOD_FILM, BODY_FLUID, STONE_ANALYSIS, COAG_PROFILE, OGTT_CURVE)
  if (shouldRenderSpecializedClinical) {
    for (const spTest of specializedClinicalTests) {
      const formType = detectFormType(spTest);
      if (!formType) continue;
      if (
        sec !== 'all' &&
        sec !== 'specialized' &&
        sec !== formType.toLowerCase()
      ) {
        continue;
      }

      let data: Record<string, any> = {};
      const rawVal = spTest.resultValue ? String(spTest.resultValue).trim() : '';
      if (rawVal.startsWith('{')) {
        try {
          data = JSON.parse(rawVal) || {};
        } catch {
          data = { notes: rawVal };
        }
      } else if (rawVal) {
        data = { notes: rawVal };
      }

      const pick = (...keys: string[]): string => {
        for (const k of keys) {
          if (data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== '') {
            return toEnglishDigits(String(data[k]).trim());
          }
        }
        return '';
      };

      const testTitle = escapeHtml(getReportEnglishTestName(spTest.test || spTest));

      if (formType === 'BLOOD_FILM') {
        const rbcMorph = pick('rbcMorphology', 'rbc', 'redBloodCells') || 'Normocytic normochromic red blood cells. No significant poikilocytosis or nucleated RBCs seen.';
        const wbcMorph = pick('wbcMorphology', 'wbc', 'whiteBloodCells') || 'Normal total and differential leukocyte distribution. Mature morphology without toxic granulation or blasts.';
        const pltMorph = pick('plateletMorphology', 'platelets', 'pltMorphology', 'plt') || 'Adequate platelet number with normal granularity; no platelet clumping observed.';
        const parasites = pick('parasites', 'bloodParasites', 'hemoparasites') || 'No malaria parasites or other hemoparasites seen.';
        const impression = pick('diagnosticImpression', 'impression', 'conclusion', 'diagnosis');
        const recommendation = pick('recommendation', 'recommendations', 'notes', 'comment');

        const morphSections = [
          { title: 'RED BLOOD CELLS (ERYTHROCYTES) MORPHOLOGY', code: 'RBCs', value: rbcMorph, accent: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { title: 'WHITE BLOOD CELLS (LEUKOCYTES) MORPHOLOGY', code: 'WBCs', value: wbcMorph, accent: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
          { title: 'PLATELETS (THROMBOCYTES) MORPHOLOGY', code: 'PLTs', value: pltMorph, accent: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { title: 'BLOOD PARASITES / HEMOPARASITES SCREEN', code: 'PARASITES', value: parasites, accent: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
        ];

        renderedPages.push(`
          <div class="${containerClass}">
            ${renderWatermark()}
            <div class="report-main-content">
              ${renderPrintHeader(headerParams)}
              ${renderPatientMetaBox(patientBoxParams)}

              <div dir="ltr" style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-top: 8px;">
                <div style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%); color: #ffffff; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${specialFormFontSize + 2}px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">PERIPHERAL BLOOD SMEAR &amp; MORPHOLOGY REPORT</div>
                    <div style="font-size: 11px; opacity: 0.9;">Microscopic Hematology Consultative Evaluation • ${testTitle}</div>
                  </div>
                  <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 800;">LEISHMAN / WRIGHT STAIN</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${morphSections.map(secItem => `
                    <div style="border: 1px solid ${secItem.border}; border-left: 4px solid ${secItem.accent}; border-radius: 6px; background: #ffffff; padding: 10px 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: ${specialFormFontSize - 1}px; font-weight: 900; color: ${secItem.accent}; letter-spacing: 0.4px;">${secItem.title}</span>
                        <span style="font-size: 9.5px; font-weight: 800; background: ${secItem.bg}; color: ${secItem.accent}; padding: 1px 7px; border-radius: 4px;">${secItem.code}</span>
                      </div>
                      <div style="font-size: ${specialFormFontSize}px; color: #0f172a; line-height: 1.5; font-weight: 600;">${escapeHtml(secItem.value)}</div>
                    </div>
                  `).join('')}
                </div>

                ${impression ? `
                  <div style="margin-top: 14px; background: #f8fafc; border: 1.5px solid #0f172a; border-radius: 8px; padding: 12px 16px;">
                    <div style="font-size: ${specialFormFontSize - 1}px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">DIAGNOSTIC HEMATOLOGICAL IMPRESSION / CONCLUSION:</div>
                    <div style="font-size: ${specialFormFontSize + 1}px; font-weight: 800; color: #b91c1c; line-height: 1.45;">${escapeHtml(impression)}</div>
                  </div>
                ` : ''}

                ${recommendation ? `
                  <div style="margin-top: 10px; background: #fffbeb; border-left: 4px solid #d97706; border-radius: 4px; padding: 8px 14px; font-size: ${specialFormFontSize - 1}px; color: #334155;">
                    <strong>Clinical Recommendation / Follow-up:</strong> <span style="margin-left: 4px;">${escapeHtml(recommendation)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="report-footer-pinned">
              ${renderFooter(safeFooter, safeLabName)}
            </div>
          </div>
        `);
      } else if (formType === 'BODY_FLUID') {
        const fluidType = pick('fluidType', 'specimenType', 'sampleType') || 'Serous / Body Fluid';
        const physRows = [
          { label: 'Volume', val: pick('volume'), unit: 'mL' },
          { label: 'Color', val: pick('color') || 'Pale Yellow', unit: '' },
          { label: 'Appearance', val: pick('appearance', 'turbidity') || 'Clear', unit: '' },
          { label: 'Coagulum / Clot', val: pick('coagulum', 'clot') || 'Absent', unit: '' },
          { label: 'Viscosity', val: pick('viscosity') || 'Normal', unit: '' },
          { label: 'Specific Gravity', val: pick('specificGravity', 'sg') || '-', unit: '' },
        ];
        const chemRows = [
          { label: 'Total Protein', val: pick('protein', 'totalProtein') || '-', unit: 'g/dL' },
          { label: 'Fluid Glucose', val: pick('glucose') || '-', unit: 'mg/dL' },
          { label: 'Fluid LDH', val: pick('ldh') || '-', unit: 'U/L' },
          { label: 'Fluid Albumin', val: pick('albumin') || '-', unit: 'g/dL' },
          { label: 'Rivalta / Pandy Test', val: pick('rivalta', 'pandy', 'globulinTest') || 'Negative', unit: '' },
          { label: 'ADA (Adenosine Deaminase)', val: pick('ada', 'adenosineDeaminase') || '-', unit: 'U/L' },
        ];
        const microRows = [
          { label: 'Total WBC Count', val: pick('totalWbc', 'wbcCount', 'wbc') || '-', unit: 'cells/µL' },
          { label: 'Neutrophils (Polymorphs)', val: pick('neutrophils', 'polymorphs') || '-', unit: '%' },
          { label: 'Lymphocytes (Mononuclears)', val: pick('lymphocytes', 'mononuclears') || '-', unit: '%' },
          { label: 'RBC Count', val: pick('rbcCount', 'rbc') || '-', unit: 'cells/µL' },
          { label: 'Gram Stain', val: pick('gramStain') || 'No organisms seen', unit: '' },
          { label: 'Ziehl-Neelsen (AFB) Stain', val: pick('znStain', 'afbStain') || 'Negative for AFB', unit: '' },
          { label: 'Crystals / Cytology', val: pick('crystals', 'cytology') || 'None detected', unit: '' },
        ];
        const impression = pick('impression', 'classification', 'notes', 'comment');

        renderedPages.push(`
          <div class="${containerClass}">
            ${renderWatermark()}
            <div class="report-main-content">
              ${renderPrintHeader(headerParams)}
              ${renderPatientMetaBox(patientBoxParams)}

              <div dir="ltr" style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-top: 8px;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #0369a1 100%); color: #ffffff; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${specialFormFontSize + 2}px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">BODY FLUID COMPREHENSIVE ANALYSIS REPORT</div>
                    <div style="font-size: 11px; opacity: 0.9;">Physical, Biochemical &amp; Cytological Examination • ${testTitle}</div>
                  </div>
                  <span style="background: rgba(255,255,255,0.22); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 900;">SPECIMEN: ${escapeHtml(fluidType.toUpperCase())}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                  <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                    <div style="background: #0284c7; color: #fff; font-weight: 800; font-size: ${specialFormFontSize - 1}px; padding: 6px 12px;">1. PHYSICAL EXAMINATION</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                      <tbody>
                        ${physRows.map((r, i) => `
                          <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                            <td style="padding: 5px 10px; font-weight: 700; color: #334155;">${escapeHtml(r.label)}</td>
                            <td style="padding: 5px 10px; font-weight: 800; color: #0f172a; text-align: right;">${escapeHtml(r.val || '-')} ${r.unit && r.val && r.val !== '-' ? `<span style="font-size:10px;color:#64748b;">${escapeHtml(r.unit)}</span>` : ''}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>

                  <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                    <div style="background: #0d9488; color: #fff; font-weight: 800; font-size: ${specialFormFontSize - 1}px; padding: 6px 12px;">2. BIOCHEMICAL EXAMINATION</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                      <tbody>
                        ${chemRows.map((r, i) => `
                          <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                            <td style="padding: 5px 10px; font-weight: 700; color: #334155;">${escapeHtml(r.label)}</td>
                            <td style="padding: 5px 10px; font-weight: 800; color: #0f172a; text-align: right;">${escapeHtml(r.val || '-')} ${r.unit && r.val && r.val !== '-' ? `<span style="font-size:10px;color:#64748b;">${escapeHtml(r.unit)}</span>` : ''}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                  <div style="background: #1e293b; color: #fff; font-weight: 800; font-size: ${specialFormFontSize - 1}px; padding: 6px 12px;">3. MICROSCOPIC, CELL DIFFERENTIAL &amp; MICROBIOLOGICAL STAIN</div>
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                    <tbody>
                      ${microRows.map((r, i) => `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                          <td style="padding: 6px 12px; font-weight: 700; color: #334155; width: 45%;">${escapeHtml(r.label)}</td>
                          <td style="padding: 6px 12px; font-weight: 800; color: #0f172a;">${escapeHtml(r.val || '-')} ${r.unit && r.val && r.val !== '-' ? `<span style="font-size:10.5px;color:#64748b;">${escapeHtml(r.unit)}</span>` : ''}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                ${impression ? `
                  <div style="margin-top: 12px; background: #f0f9ff; border-left: 4px solid #0284c7; padding: 8px 14px; border-radius: 4px; font-size: ${specialFormFontSize}px; color: #0f172a;">
                    <strong>Diagnostic Impression / Transudate vs. Exudate Evaluation:</strong> <span style="font-weight: 700; margin-left: 4px;">${escapeHtml(impression)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="report-footer-pinned">
              ${renderFooter(safeFooter, safeLabName)}
            </div>
          </div>
        `);
      } else if (formType === 'STONE_ANALYSIS') {
        const physRows = [
          { label: 'Number of Calculi', val: pick('stoneCount', 'number', 'count') || '1' },
          { label: 'Dry Weight', val: pick('weight', 'weightMg') ? `${pick('weight', 'weightMg')} mg` : '-' },
          { label: 'Dimensions / Size', val: pick('size', 'dimensions') ? `${pick('size', 'dimensions')}` : '-' },
          { label: 'Macroscopic Color', val: pick('color') || 'Brownish / Dark Yellow' },
          { label: 'External Shape', val: pick('shape') || 'Irregular / Jagged' },
          { label: 'Surface Texture', val: pick('surface') || 'Rough / Crystalline' },
          { label: 'Consistency / Hardness', val: pick('consistency', 'hardness') || 'Hard' },
        ];

        const compRows = [
          { name: 'Calcium Oxalate (Whewellite / Weddellite)', val: pick('calciumOxalate', 'caOxalate') },
          { name: 'Uric Acid / Urate', val: pick('uricAcid', 'urate') },
          { name: 'Calcium Phosphate (Carbonate Apatite / Brushite)', val: pick('calciumPhosphate', 'caPhosphate') },
          { name: 'Magnesium Ammonium Phosphate (Struvite)', val: pick('struvite', 'magnesiumAmmoniumPhosphate') },
          { name: 'Cystine', val: pick('cystine') },
          { name: 'Ammonium Acid Urate', val: pick('ammoniumUrate') },
        ];

        const primaryType = pick('primaryType', 'stoneType', 'dominantComponent');
        const impression = pick('impression', 'dietaryAdvice', 'notes', 'comment');

        renderedPages.push(`
          <div class="${containerClass}">
            ${renderWatermark()}
            <div class="report-main-content">
              ${renderPrintHeader(headerParams)}
              ${renderPatientMetaBox(patientBoxParams)}

              <div dir="ltr" style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-top: 8px;">
                <div style="background: linear-gradient(135deg, #78350f 0%, #d97706 100%); color: #ffffff; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${specialFormFontSize + 2}px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">URINARY / RENAL CALCULUS (STONE) ANALYSIS</div>
                    <div style="font-size: 11px; opacity: 0.92;">Morphological &amp; Quantitative Chemical Composition • ${testTitle}</div>
                  </div>
                  <span style="background: rgba(255,255,255,0.22); padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 800;">CHEMICAL / FTIR ANALYSIS</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 14px;">
                  <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                    <div style="background: #92400e; color: #fff; font-weight: 800; font-size: ${specialFormFontSize - 1}px; padding: 6px 12px;">1. MACROSCOPIC &amp; PHYSICAL PROPERTIES</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                      <tbody>
                        ${physRows.map((r, i) => `
                          <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#fffbeb' : '#ffffff'};">
                            <td style="padding: 6px 10px; font-weight: 700; color: #475569;">${escapeHtml(r.label)}</td>
                            <td style="padding: 6px 10px; font-weight: 800; color: #0f172a; text-align: right;">${escapeHtml(r.val)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>

                  <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                    <div style="background: #0f172a; color: #fff; font-weight: 800; font-size: ${specialFormFontSize - 1}px; padding: 6px 12px;">2. QUANTITATIVE CHEMICAL COMPOSITION</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                      <thead>
                        <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 10.5px; color: #475569;">
                          <th style="padding: 5px 10px; text-align: left;">Constituent Compound</th>
                          <th style="padding: 5px 10px; text-align: right;">Result / %</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${compRows.map((c, i) => {
                          const rawC = c.val || 'Absent (0%)';
                          const numPct = parseFloat(rawC.replace(/[^0-9.]/g, ''));
                          const isPos = (!isNaN(numPct) && numPct > 0) || /positive|\+|present/i.test(rawC);
                          return `
                            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                              <td style="padding: 6px 10px; font-weight: 700; color: #1e293b;">${escapeHtml(c.name)}</td>
                              <td style="padding: 6px 10px; font-weight: 900; color: ${isPos ? '#b45309' : '#64748b'}; text-align: right;">
                                ${escapeHtml(!isNaN(numPct) && !rawC.includes('%') ? `${rawC}%` : rawC)}
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                ${primaryType ? `
                  <div style="margin-top: 12px; background: #fffbeb; border: 1.5px solid #d97706; border-radius: 6px; padding: 9px 14px; font-size: ${specialFormFontSize}px; color: #78350f;">
                    <strong>Predominant Calculus Classification:</strong> <span style="font-weight: 900; margin-left: 6px;">${escapeHtml(primaryType)}</span>
                  </div>
                ` : ''}

                ${impression ? `
                  <div style="margin-top: 10px; background: #f8fafc; border-left: 4px solid #0f172a; padding: 8px 14px; border-radius: 4px; font-size: ${specialFormFontSize - 1}px; color: #334155;">
                    <strong>Metabolic Note &amp; Prophylactic Dietary Guidance:</strong> <span style="margin-left: 4px;">${escapeHtml(impression)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="report-footer-pinned">
              ${renderFooter(safeFooter, safeLabName)}
            </div>
          </div>
        `);
      } else if (formType === 'COAG_PROFILE') {
        const ptControl = pick('ptControl', 'controlPt') || '12.0';
        const coagParams = [
          { name: 'Prothrombin Time (PT)', val: pick('pt', 'prothrombinTime'), unit: 'sec', ref: `11.0 - 13.5 (Control: ${ptControl} sec)`, low: 11.0, high: 13.5 },
          { name: 'International Normalized Ratio (INR)', val: pick('inr'), unit: 'Ratio', ref: '0.8 - 1.2 (Therapeutic Warfarin: 2.0 - 3.0)', low: 0.8, high: 1.2 },
          { name: 'Activated Partial Thromboplastin Time (aPTT)', val: pick('aptt', 'ptt'), unit: 'sec', ref: '25.0 - 35.0', low: 25.0, high: 35.0 },
          { name: 'Plasma Fibrinogen (Clauss)', val: pick('fibrinogen'), unit: 'mg/dL', ref: '200 - 400', low: 200, high: 400 },
          { name: 'D-Dimer (Quantitative FEU)', val: pick('dDimer', 'ddimer'), unit: 'µg/mL FEU', ref: '< 0.50', low: null, high: 0.5 },
          { name: 'Bleeding Time (BT - Ivy)', val: pick('bleedingTime', 'bt'), unit: 'min', ref: '2.0 - 7.0', low: 2.0, high: 7.0 },
          { name: 'Clotting Time (CT - Lee & White)', val: pick('clottingTime', 'ct'), unit: 'min', ref: '4.0 - 10.0', low: 4.0, high: 10.0 },
          { name: 'Platelet Count (PLT)', val: pick('platelets', 'plt'), unit: '×10³/µL', ref: '150 - 450', low: 150, high: 450 },
        ].filter(row => row.val !== '' || ['Prothrombin Time (PT)', 'International Normalized Ratio (INR)', 'Activated Partial Thromboplastin Time (aPTT)'].includes(row.name));

        const therapy = pick('anticoagulantTherapy', 'therapy');
        const impression = pick('impression', 'notes', 'comment');

        renderedPages.push(`
          <div class="${containerClass}">
            ${renderWatermark()}
            <div class="report-main-content">
              ${renderPrintHeader(headerParams)}
              ${renderPatientMetaBox(patientBoxParams)}

              <div dir="ltr" style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-top: 8px;">
                <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); color: #ffffff; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${specialFormFontSize + 2}px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">HEMOSTASIS &amp; COAGULATION PROFILE REPORT</div>
                    <div style="font-size: 11px; opacity: 0.9;">Citrated Plasma Coagulation Cascade Evaluation • ${testTitle}</div>
                  </div>
                  <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 800;">3.2% SODIUM CITRATE</span>
                </div>

                ${therapy ? `
                  <div style="margin-bottom: 10px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 6px 12px; font-size: ${specialFormFontSize - 1}px; color: #312e81;">
                    <strong>Anticoagulant / Clinical Context:</strong> <span style="margin-left: 6px; font-weight: 700;">${escapeHtml(therapy)}</span>
                  </div>
                ` : ''}

                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                    <thead>
                      <tr style="background: #1e293b; color: #ffffff;">
                        <th style="padding: 8px 12px; text-align: left; width: 42%;">COAGULATION PARAMETER</th>
                        <th style="padding: 8px 12px; text-align: center; width: 18%;">RESULT</th>
                        <th style="padding: 8px 12px; text-align: center; width: 12%;">UNIT</th>
                        <th style="padding: 8px 12px; text-align: left; width: 28%;">REFERENCE INTERVAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${coagParams.map((r, i) => {
                        const num = parseFloat(r.val);
                        const isHigh = !isNaN(num) && r.high !== null && num > r.high;
                        const isLow = !isNaN(num) && r.low !== null && num < r.low;
                        const isAbn = isHigh || isLow;
                        const clr = isHigh ? '#dc2626' : isLow ? '#2563eb' : '#0f172a';
                        const arrow = isHigh ? ' ↑' : isLow ? ' ↓' : '';
                        return `
                          <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                            <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${escapeHtml(r.name)}</td>
                            <td style="padding: 8px 12px; text-align: center; font-weight: ${isAbn ? 900 : 700}; color: ${clr};">
                              ${escapeHtml(r.val || '-')}${arrow ? `<strong style="margin-left:3px;">${arrow}</strong>` : ''}
                            </td>
                            <td style="padding: 8px 12px; text-align: center; color: #475569; font-size: ${specialFormFontSize - 1}px;">${escapeHtml(r.unit)}</td>
                            <td style="padding: 8px 12px; color: #334155; font-size: ${specialFormFontSize - 1}px;">${escapeHtml(r.ref)}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                ${impression ? `
                  <div style="margin-top: 12px; background: #f8fafc; border-left: 4px solid #4338ca; padding: 8px 14px; border-radius: 4px; font-size: ${specialFormFontSize}px; color: #1e293b;">
                    <strong>Coagulation Interpretation:</strong> <span style="margin-left: 4px;">${escapeHtml(impression)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="report-footer-pinned">
              ${renderFooter(safeFooter, safeLabName)}
            </div>
          </div>
        `);
      } else if (formType === 'OGTT_CURVE') {
        const glucoseLoad = pick('glucoseLoad', 'load') || '75g Anhydrous Oral Glucose';
        const timePoints = [
          { min: 0, label: 'Fasting (0 min - Basal)', blood: pick('fasting', 'g0', 'glucose0', 'min0'), urine: pick('urineFasting', 'u0', 'urine0') || 'Negative', cutoff: 99, refText: '70 - 99 mg/dL (Normal Fasting)' },
          { min: 30, label: '30 Minutes Post-Glucose', blood: pick('min30', 'g30', 'glucose30'), urine: pick('urine30', 'u30') || 'Negative', cutoff: 180, refText: '< 180 mg/dL' },
          { min: 60, label: '60 Minutes (1 Hour) Post-Glucose', blood: pick('min60', 'g60', 'glucose60', '1hr'), urine: pick('urine60', 'u60') || 'Negative', cutoff: 180, refText: '< 180 mg/dL' },
          { min: 90, label: '90 Minutes (1.5 Hours) Post-Glucose', blood: pick('min90', 'g90', 'glucose90'), urine: pick('urine90', 'u90') || 'Negative', cutoff: 160, refText: '< 160 mg/dL' },
          { min: 120, label: '120 Minutes (2 Hours) Post-Glucose', blood: pick('min120', 'g120', 'glucose120', '2hr'), urine: pick('urine120', 'u120') || 'Negative', cutoff: 140, refText: '< 140 mg/dL (Normal) | 140-199 (IGT) | >= 200 (Diabetic)' },
          { min: 180, label: '180 Minutes (3 Hours) Post-Glucose', blood: pick('min180', 'g180', 'glucose180', '3hr'), urine: pick('urine180', 'u180') || 'Negative', cutoff: 140, refText: '< 140 mg/dL' },
        ].filter((tp, idx) => tp.blood !== '' || idx === 0 || idx === 2 || idx === 4);

        const plottedPoints = timePoints
          .map((tp, idx) => ({ ...tp, idx, numVal: parseFloat(tp.blood) }))
          .filter(tp => !isNaN(tp.numVal));

        // Build SVG glycemic curve chart
        const svgW = 540;
        const svgH = 170;
        const padL = 44;
        const padR = 24;
        const padT = 18;
        const padB = 28;
        const plotW = svgW - padL - padR;
        const plotH = svgH - padT - padB;
        const maxVal = Math.max(240, ...plottedPoints.map(p => p.numVal + 20));
        const minVal = 40;
        const xForIdx = (i: number, total: number) => padL + (total <= 1 ? plotW / 2 : (i / (total - 1)) * plotW);
        const yForVal = (v: number) => padT + plotH - ((Math.max(minVal, Math.min(maxVal, v)) - minVal) / (maxVal - minVal)) * plotH;

        const ptsCoords = timePoints.map((tp, i) => {
          const nv = parseFloat(tp.blood);
          return {
            x: xForIdx(i, timePoints.length),
            y: isNaN(nv) ? null : yForVal(nv),
            nv,
            label: `${tp.min}m`,
          };
        });
        const validCoords = ptsCoords.filter(p => p.y !== null) as Array<{ x: number; y: number; nv: number; label: string }>;
        const polyPoints = validCoords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const y140 = yForVal(140);
        const y200 = yForVal(200);

        const impression = pick('impression', 'classification', 'notes', 'comment');

        renderedPages.push(`
          <div class="${containerClass}">
            ${renderWatermark()}
            <div class="report-main-content">
              ${renderPrintHeader(headerParams)}
              ${renderPatientMetaBox(patientBoxParams)}

              <div dir="ltr" style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-top: 8px;">
                <div style="background: linear-gradient(135deg, #065f46 0%, #0d9488 100%); color: #ffffff; padding: 10px 16px; border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${specialFormFontSize + 2}px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">ORAL GLUCOSE TOLERANCE TEST (OGTT) &amp; GLYCEMIC CURVE</div>
                    <div style="font-size: 11px; opacity: 0.92;">Serial Venous Plasma Glucose &amp; Renal Threshold Evaluation • ${testTitle}</div>
                  </div>
                  <span style="background: rgba(255,255,255,0.22); padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 800;">LOAD: ${escapeHtml(glucoseLoad.toUpperCase())}</span>
                </div>

                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: ${specialFormFontSize}px;">
                    <thead>
                      <tr style="background: #0f172a; color: #ffffff;">
                        <th style="padding: 7px 12px; text-align: left;">SAMPLING TIMEPOINT</th>
                        <th style="padding: 7px 12px; text-align: center;">PLASMA GLUCOSE</th>
                        <th style="padding: 7px 12px; text-align: center;">URINE GLUCOSE</th>
                        <th style="padding: 7px 12px; text-align: left;">DIAGNOSTIC CUT-OFF (ADA/WHO)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${timePoints.map((tp, i) => {
                        const nv = parseFloat(tp.blood);
                        const isHigh = !isNaN(nv) && nv > tp.cutoff;
                        return `
                          <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                            <td style="padding: 7px 12px; font-weight: 700; color: #0f172a;">${escapeHtml(tp.label)}</td>
                            <td style="padding: 7px 12px; text-align: center; font-weight: 900; color: ${isHigh ? '#dc2626' : '#0f172a'};">
                              ${escapeHtml(tp.blood || '-')} ${tp.blood ? '<span style="font-size:10px;font-weight:600;color:#64748b;">mg/dL</span>' : ''}${isHigh ? ' <strong style="color:#dc2626;">↑</strong>' : ''}
                            </td>
                            <td style="padding: 7px 12px; text-align: center; font-weight: 700; color: ${/pos|\+/i.test(tp.urine) ? '#dc2626' : '#059669'};">${escapeHtml(tp.urine)}</td>
                            <td style="padding: 7px 12px; font-size: ${specialFormFontSize - 1}px; color: #475569;">${escapeHtml(tp.refText)}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                ${validCoords.length >= 2 ? `
                  <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; background: #ffffff; margin-bottom: 10px;">
                    <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-bottom: 6px; display: flex; justify-content: space-between;">
                      <span>GLYCEMIC RESPONSE CURVE (PLASMA GLUCOSE mg/dL vs. TIME)</span>
                      <span style="color: #dc2626; font-size: 10px;">--- 140 mg/dL (IGT Threshold) | --- 200 mg/dL (Diabetic Threshold)</span>
                    </div>
                    <svg width="100%" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                      <!-- Threshold lines -->
                      <line x1="${padL}" y1="${y140.toFixed(1)}" x2="${svgW - padR}" y2="${y140.toFixed(1)}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4" />
                      <text x="${padL - 6}" y="${(y140 + 3).toFixed(1)}" font-size="9" font-weight="700" fill="#d97706" text-anchor="end">140</text>
                      <line x1="${padL}" y1="${y200.toFixed(1)}" x2="${svgW - padR}" y2="${y200.toFixed(1)}" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="4,4" />
                      <text x="${padL - 6}" y="${(y200 + 3).toFixed(1)}" font-size="9" font-weight="700" fill="#dc2626" text-anchor="end">200</text>
                      <!-- Axes -->
                      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${svgH - padB}" stroke="#94a3b8" stroke-width="1.5" />
                      <line x1="${padL}" y1="${svgH - padB}" x2="${svgW - padR}" y2="${svgH - padB}" stroke="#94a3b8" stroke-width="1.5" />
                      <!-- Curve line -->
                      <polyline fill="none" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" points="${polyPoints}" />
                      <!-- Data points -->
                      ${validCoords.map(pt => `
                        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4.5" fill="${pt.nv >= 200 ? '#dc2626' : pt.nv >= 140 ? '#d97706' : '#0d9488'}" stroke="#ffffff" stroke-width="1.5" />
                        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 8).toFixed(1)}" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${pt.nv}</text>
                        <text x="${pt.x.toFixed(1)}" y="${svgH - 10}" font-size="9.5" font-weight="700" fill="#475569" text-anchor="middle">${pt.label}</text>
                      `).join('')}
                    </svg>
                  </div>
                ` : ''}

                ${impression ? `
                  <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 8px 14px; border-radius: 4px; font-size: ${specialFormFontSize}px; color: #0f172a;">
                    <strong>Glycemic Tolerance Interpretation:</strong> <span style="font-weight: 700; margin-left: 4px;">${escapeHtml(impression)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="report-footer-pinned">
              ${renderFooter(safeFooter, safeLabName)}
            </div>
          </div>
        `);
      }
    }
  }

  // Fallback if empty
  if (renderedPages.length === 0) {
    renderedPages.push(`
      <div class="${containerClass}">
        ${renderWatermark()}
        <div class="report-main-content">
          ${renderPrintHeader(headerParams)}
          ${renderPatientMetaBox(patientBoxParams)}
          <div style="padding: 30px; text-align: center; color: #64748b; font-size: 13px;">
            No tests recorded for this sample.
          </div>
        </div>
        <div class="report-footer-pinned">
          ${renderFooter(safeFooter, safeLabName)}
        </div>
      </div>
    `);
  }

  return renderedPages;
}
