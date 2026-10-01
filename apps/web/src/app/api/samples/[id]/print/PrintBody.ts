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
} from '@lab-manager/domain';
import { resolveReferenceRange } from '../../../../../lib/orderHelpers';
import {
  isCbcTest,
  isSfaTest,
  isGueTest,
  isGseTest,
  isGeneralTest,
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

export function renderClinicalFindingBadge(p: string, isPositive?: boolean, textColor = '#0f172a'): string {
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
  return `<div style="background: ${bgCol}; border: 1px solid ${borderCol}; padding: 6px 10px; border-radius: 4px; font-size: 11.5px; text-align: left; direction: ltr; unicode-bidi: isolate; display: flex; align-items: center; justify-content: flex-start;">${innerHtml}</div>`;
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
  resultValueFontWeight: string;
  customCellPadding: string;
  tableRowBorders: boolean;
  tableZebraStriping: boolean;
  visibleColumns: any[];
  groupByCategory: boolean;
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
    refRangeFontSize,
    unitFontSize,
    resultValueFontWeight,
    customCellPadding,
    tableRowBorders,
    tableZebraStriping,
    visibleColumns,
    groupByCategory,
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
  } = params;

  const renderedPages: string[] = [];

  // Tests Categorization
  const allTests = sample.tests || [];
  const cbcTests = allTests.filter(isCbcTest);
  const sfaTests = allTests.filter(isSfaTest);
  const gueTests = allTests.filter(isGueTest);
  const gseTests = allTests.filter(isGseTest);
  const generalTests = allTests.filter(isGeneralTest);

  // Section visibility flags based on ?section= query param
  const shouldRenderGeneral = generalTests.length > 0 && (sectionParam === 'all' || sectionParam === 'general' || sectionParam === 'chemistry');
  const shouldRenderCbc = cbcTests.length > 0 && (sectionParam === 'all' || sectionParam === 'cbc' || sectionParam === 'fbc');
  const shouldRenderGue = gueTests.length > 0 && (sectionParam === 'all' || sectionParam === 'gue' || sectionParam === 'urine');
  const shouldRenderGse = gseTests.length > 0 && (sectionParam === 'all' || sectionParam === 'gse' || sectionParam === 'stool');
  const shouldRenderSfa = sfaTests.length > 0 && (sectionParam === 'all' || sectionParam === 'sfa' || sectionParam === 'semen');

  // Patient prior visits for Historical Delta display on report
  const patId = sample.patientId || sample.patient?.id;
  const patName = sample.patient?.name;
  const priorSamples = (store.samples || [])
    .filter((s: any) => s.id !== sample.id &&
      ((patId && (s.patientId === patId || s.patient?.id === patId)) || (patName && s.patient?.name === patName)) &&
      new Date(s.createdAt).getTime() < new Date(sample.createdAt).getTime()
    )
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Prior lookup helper
  const findPriorForTest = (st: any): { value: string; date: string; sampleId: string } | null => {
    if (st.previousValue && String(st.previousValue).trim() !== '' && st.includePrevious) {
      return { value: String(st.previousValue), date: st.previousDate ? formatEnglishDate(st.previousDate) : '', sampleId: st.previousSampleId || '' };
    }
    if (!st.includePrevious) return null;
    const tid = st.testId || st.test?.id;
    const code = (st.test?.code || st.code || '').toUpperCase();
    for (const ps of priorSamples) {
      const pt = (ps.tests || []).find((x: any) =>
        (tid && (x.testId === tid || x.test?.id === tid)) ||
        (code && (String(x.test?.code || x.code || '').toUpperCase() === code))
      );
      if (pt && pt.resultValue && String(pt.resultValue).trim() !== '') {
        return { value: String(pt.resultValue), date: formatEnglishDate(ps.createdAt), sampleId: ps.id };
      }
    }
    return null;
  };

  // Lipid calculations
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
    const generalWithLipid: any[] = [...generalTests];
    const hasLipidCode = (codes: readonly string[], id: string) =>
      generalWithLipid.some((st: any) => (st.testId === id || st.test?.id === id) || codes.includes(String((st as any).test?.code || (st as any).code || '').toUpperCase().trim()));
    const pushVirtual = (id: string, code: string, name: string, value: number | null, refDisplay: string, unit: string, invalidReason?: string) => {
      if (value === null || value === undefined) {
        if (!invalidReason) return;
        if (generalWithLipid.some((st: any) => (st.testId === id || st.test?.id === id))) return;
        generalWithLipid.push({
          id: `calc-${id}`, testId: id, resultValue: invalidReason, isCalculated: true, isVirtualCalculated: true,
          test: { id, code, name, unit, refRangeText: refDisplay, price: 0, isCalculated: true, sampleType: 'Calculated' },
        });
        return;
      }
      if (hasLipidCode([code] as unknown as readonly string[], id)) return;
      generalWithLipid.push({
        id: `calc-${id}`, testId: id, resultValue: String(value), isCalculated: true, isVirtualCalculated: true,
        test: { id, code, name, unit, refRangeText: refDisplay, price: 0, isCalculated: true, sampleType: 'Calculated' },
      });
    };
    if (lipidPanel) {
      const lipUnitStr = lipidUnit;
      pushVirtual(LIPID_CATALOG_IDS.NON_HDL, 'NON-HDL', 'Non-HDL Cholesterol (calculated)', lipidPanel.nonHdl.value, LIPID_REFERENCE_SOURCES.NON_HDL.display, lipUnitStr);
      pushVirtual(LIPID_CATALOG_IDS.TC_HDL_RATIO, 'TC/HDL', 'TC/HDL Ratio (calculated)', lipidPanel.tcHdlRatio.value, LIPID_REFERENCE_SOURCES.TC_HDL_RATIO.display, 'Ratio');
      const ldlHdlV = lipidPanel.ldlHdlRatio.value ?? (lipidEffectiveLdl && lipidEffectiveLdl.value !== null && lipidHdlSt ? Math.round((Number(lipidEffectiveLdl.value) / numOf(lipidHdlSt)) * 10) / 10 : null);
      pushVirtual(LIPID_CATALOG_IDS.LDL_HDL_RATIO, 'LDL/HDL', 'LDL/HDL Ratio (calculated)', ldlHdlV, LIPID_REFERENCE_SOURCES.LDL_HDL_RATIO.display, 'Ratio');
      if (!lipidLdlSt && lipidEffectiveLdl) {
        if (lipidEffectiveLdl.value !== null) pushVirtual(LIPID_CATALOG_IDS.LDL, 'LDL', 'LDL Cholesterol (Bad)', lipidEffectiveLdl.value, LIPID_REFERENCE_SOURCES.LDL.display, lipUnitStr, lipidEffectiveLdl.invalidReason);
        else if (lipidEffectiveLdl.invalidReason) pushVirtual(LIPID_CATALOG_IDS.LDL, 'LDL', 'LDL Cholesterol (Bad)', null, LIPID_REFERENCE_SOURCES.LDL.display, lipUnitStr, lipidEffectiveLdl.invalidReason);
      }
      if (!lipidVldlSt && lipidPanel.vldl.value !== null) pushVirtual(LIPID_CATALOG_IDS.VLDL, 'VLDL', 'VLDL Cholesterol', lipidPanel.vldl.value, LIPID_REFERENCE_SOURCES.VLDL.display, lipUnitStr, lipidPanel.vldl.invalidReason);
      else if (!lipidVldlSt && lipidPanel.vldl.invalidReason && lipidTgSt) pushVirtual(LIPID_CATALOG_IDS.VLDL, 'VLDL', 'VLDL Cholesterol', null, LIPID_REFERENCE_SOURCES.VLDL.display, lipUnitStr, lipidPanel.vldl.invalidReason);
    }

    const showPrevCol = generalWithLipid.some((st: any) => !!findPriorForTest(st));
    const effectiveColumns: any[] = showPrevCol && !visibleColumns.some((c: any) => c.id === 'previous')
      ? [...visibleColumns.slice(0, 2), { id: 'previous', label: 'PREVIOUS', visible: true, align: 'left' }, ...visibleColumns.slice(2)]
      : visibleColumns;

    const renderGeneralTestRow = (t: any, rowIdx: number) => {
      let effectiveValue: any = t.resultValue;
      let calcLabel = '';
      const tid = String(t.testId || t.test?.id || '');
      const tcode = String(t.test?.code || t.code || '').toUpperCase();
      const isLdlRow = tid === LIPID_CATALOG_IDS.LDL || tcode === 'LDL' || tcode === 'LDL-C';
      const isVldlRow = tid === LIPID_CATALOG_IDS.VLDL || tcode === 'VLDL' || tcode === 'VLDL-C';
      if ((!effectiveValue || String(effectiveValue).trim() === '')) {
        if (isLdlRow && lipidEffectiveLdl) {
          if (lipidEffectiveLdl.value !== null) { effectiveValue = String(lipidEffectiveLdl.value); calcLabel = ' <span style="font-size:9px;color:#0d9488;border:1px solid #99f6e4;background:#f0fdfa;padding:0 4px;border-radius:4px;">calculated</span>'; }
          else if (lipidEffectiveLdl.invalidReason) { effectiveValue = lipidEffectiveLdl.invalidReason; calcLabel = ' <span style="font-size:9px;color:#b45309;border:1px solid #fde68a;background:#fffbeb;padding:0 4px;border-radius:4px;">calculated</span>'; }
        } else if (isVldlRow && lipidPanel) {
          if (lipidPanel.vldl.value !== null) { effectiveValue = String(lipidPanel.vldl.value); calcLabel = ' <span style="font-size:9px;color:#0d9488;border:1px solid #99f6e4;background:#f0fdfa;padding:0 4px;border-radius:4px;">calculated</span>'; }
          else if (lipidPanel.vldl.invalidReason && lipidTgSt) { effectiveValue = lipidPanel.vldl.invalidReason; }
        }
      } else if (t.isVirtualCalculated || t.isCalculated) {
        calcLabel = ' <span style="font-size:9px;color:#0d9488;border:1px solid #99f6e4;background:#f0fdfa;padding:0 4px;border-radius:4px;">calculated</span>';
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
      const testName = escapeHtml(baseName) + (t.isVirtualCalculated ? ' <span style="font-size:9px;color:#0d9488;">(calculated)</span>' : '');
      const testUnit = escapeHtml(t.test?.unit || t.unit || '-');
      let rawRef: string;
      const printScope = (settings as any).printRangeScope || 'ALL';
      if (printScope === 'APPLICABLE_ONLY') {
        const resolved = resolveReferenceRange(t.test || t, sample.patient?.gender, sample.patient?.age, {
          birthDate: sample.patient?.birthDate,
          targetDate: sample.createdAt,
        });
        rawRef = resolved.rangeText;
      } else {
        const rRanges = t.test?.referenceRanges || [];
        if (rRanges.length > 1) {
          rawRef = rRanges.map((r: any) => {
            const txt = r.text || (r.low != null && r.high != null ? `${r.low} - ${r.high}` : (r.low != null ? `>= ${r.low}` : r.high != null ? `<= ${r.high}` : ''));
            return r.label ? `${r.label}: ${txt}` : txt;
          }).filter(Boolean).join(' | ');
        } else {
          rawRef = t.test?.refRangeText || (t.test?.refRangeLow != null && t.test?.refRangeHigh != null ? `${t.test.refRangeLow} - ${t.test.refRangeHigh}` : (t.refRangeText || (t.refRangeLow != null && t.refRangeHigh != null ? `${t.refRangeLow} - ${t.refRangeHigh}` : '-')));
        }
      }
      const testRef = `<span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate;">${escapeHtml(rawRef)}</span>`;

      let displayValue = effectiveValue
        ? `<span style="font-weight:${isAbnormal ? 900 : (resultValueFontWeight === 'bold' ? 800 : 500)};color:${resColor};">${escapeHtml(toEnglishDigits(effectiveValue))}${calcLabel}${arrowHtml}</span>`
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
      }

      return `
        <tr style="background: ${rowBg}; ${borderStyle} page-break-inside: avoid;">
          ${effectiveColumns.map((col: any) => {
            const alignStyle = `text-align: ${col.align};`;
            if (col.id === 'testName') {
              return `<td style="padding: ${customCellPadding}; font-weight: 700; color: ${textColor}; ${alignStyle}">${testName}</td>`;
            }
            if (col.id === 'result') {
              return `<td style="padding: ${customCellPadding}; ${alignStyle}">${displayValue}</td>`;
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

    let generalRowsHtml = '';
    if (groupByCategory) {
      const categories: { [key: string]: any[] } = {};
      generalWithLipid.forEach((t: any) => {
        const cat = getReportEnglishCategory(t.test?.category || 'General Laboratory Tests');
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(t);
      });

      let globalRowIdx = 0;
      Object.keys(categories).forEach((catName) => {
        generalRowsHtml += `
          <tr style="background: rgba(0,0,0,0.04); page-break-inside: avoid;">
            <td colspan="${effectiveColumns.length}" style="padding: 6px 12px; font-weight: 800; font-size: ${testNameFontSize}px; color: ${headerBgColor}; border-bottom: 2px solid ${borderColor};">
              📂 ${escapeHtml(catName)}
            </td>
          </tr>
        `;
        categories[catName].forEach((t) => {
          generalRowsHtml += renderGeneralTestRow(t, globalRowIdx++);
        });
      });
    } else {
      generalRowsHtml = generalWithLipid.map((t: any, idx: number) => renderGeneralTestRow(t, idx)).join('');
    }

    renderedPages.push(`
      <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
        ${renderWatermark()}
        <div class="report-main-content">
          ${renderPrintHeader(headerParams)}
          ${renderPatientMetaBox(patientBoxParams)}
          <table dir="ltr" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: left;">
            <thead>
              <tr class="table-header" style="background: ${headerBgColor}; color: ${headerTextColor};">
                ${effectiveColumns.map((col: any, idx: number) => `
                  <th style="padding: 8px 12px; text-align: ${col.align}; font-size: ${testNameFontSize}px; ${idx === 0 ? 'border-radius: 6px 0 0 0;' : ''} ${idx === effectiveColumns.length - 1 ? 'border-radius: 0 6px 0 0;' : ''}">
                    ${escapeHtml(col.label)}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${generalRowsHtml}
            </tbody>
          </table>
        </div>
        <div class="report-footer-pinned">
          ${renderFooter(safeFooter, safeLabName)}
        </div>
      </div>
    `);
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
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
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
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
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
          ${absVal !== '-' ? `${absVal} <span style="font-size: 9.5px; color: #64748b; font-weight: 600;">10^3/uL</span>` : '-'}
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
            <div style="background: ${badgeBg}; border: 1px solid ${badgeBdr}; color: ${badgeCol}; padding: 6px 10px; border-radius: 6px; font-size: 11px; margin-top: 6px; text-align: left;" dir="ltr">
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
            <div style="background: linear-gradient(90deg, #be123c 0%, #e11d48 100%); color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>COMPLETE BLOOD COUNT (CBC) &amp; 5-PART DIFFERENTIAL</span>
              <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.95;">AUTOMATED HEMATOLOGY REPORT</span>
            </div>

            <!-- 2-Column Clinical Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;" dir="ltr">
              <!-- Column 1: Erythroid Series & Platelet Indices -->
              <div>
                <!-- Erythroid Series -->
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                  <div style="background: #f8fafc; padding: 6px 10px; font-weight: 800; font-size: 11.5px; color: #be123c; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <span>1. ERYTHROID SERIES &amp; RED CELL INDICES</span>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; font-size: 10.5px; border-bottom: 1px solid #cbd5e1;">
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
                  <div style="background: #f8fafc; padding: 6px 10px; font-weight: 800; font-size: 11.5px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <span>2. PLATELET INDICES (THROMBOCYTES)</span>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; font-size: 10.5px; border-bottom: 1px solid #cbd5e1;">
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
                  <div style="background: #f8fafc; padding: 6px 10px; font-weight: 800; font-size: 11.5px; color: #166534; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <span>3. TOTAL LEUKOCYTES &amp; 5-PART DIFFERENTIAL</span>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; font-size: 10.5px; border-bottom: 1px solid #cbd5e1;">
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
                  <div style="background: #f8fafc; padding: 4px 10px; font-weight: 700; font-size: 11px; color: #475569; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                    <span>5-PART DIFFERENTIAL COUNT</span>
                    ${hasDiffData ? `<span style="font-size: 10px; color: ${Math.abs(diffSum - 100) < 1 ? '#166534' : '#b91c1c'}; font-weight: 800;">Sum: ${diffSum}%</span>` : ''}
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left;">
                    <thead>
                      <tr style="background: #ffffff; color: #64748b; font-size: 10px; border-bottom: 1px solid #f1f5f9;">
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
                  <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be123c" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                    <span>PERIPHERAL BLOOD FILM MORPHOLOGY</span>
                  </div>
                  <div style="font-size: 11px; color: #334155; line-height: 1.45;">
                    ${escapeHtml(parsed.morphology || 'Normocytic Normochromic red blood cells. Normal leukocyte morphology and adequate platelets on peripheral smear.')}
                  </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px;">
                  <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>CLINICAL COMMENTS &amp; INTERPRETATION</span>
                  </div>
                  <div style="font-size: 11px; color: #334155; line-height: 1.45;">
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
            
            <div style="background: ${primaryCol}; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>GENERAL URINE EXAMINATION (G.U.E)</span>
              <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">CLINICAL ROUTINE URINALYSIS</span>
            </div>

            <div style="margin-bottom: 16px;">
              <!-- Physical Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>PHYSICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
                  ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Chemical Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>CHEMICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
                  ${chemicalParts.length > 0 ? chemicalParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Microscopic Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>MICROSCOPIC EXAMINATION (HPF)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
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
                    return printableMicro.length > 0 ? printableMicro.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>';
                  })()}
                </div>
              </div>

              ${noteText ? `
                <div style="background: #f8fafc; border-left: 4px solid ${primaryCol}; padding: 8px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
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
        } else if (cleanLine.startsWith('PH_REDUCING:')) {
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
            
            <div style="background: #b45309; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>GENERAL STOOL EXAMINATION (G.S.E)</span>
              <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">STOOL ROUTINE &amp; PARASITOLOGY REPORT</span>
            </div>

            <div style="margin-bottom: 16px;">
              <!-- Physical Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>PHYSICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
                  ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Chemical Evaluation (pH & Reducing Substances) Section -->
              ${phReducingParts.length > 0 ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #0284c7; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>CHEMICAL EVALUATION (pH &amp; REDUCING SUBSTANCES)</span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
                    ${phReducingParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Occult Blood FOBT Section -->
              ${fobtVal ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #b91c1c; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>OCCULT BLOOD (F.O.B.T)</span>
                  </div>
                  <div style="padding: 12px;" dir="ltr">
                    <div style="background: ${fobtVal.includes('Positive') ? '#fef2f2' : '#f0fdf4'}; color: ${fobtVal.includes('Positive') ? '#b91c1c' : '#15803d'}; font-weight: 800; padding: 6px 12px; border-radius: 6px; border: 1px solid ${fobtVal.includes('Positive') ? '#fca5a5' : '#bbf7d0'}; font-size: 12px; display: inline-block; text-align: left; direction: ltr;">
                      ${escapeHtml(fobtVal)}
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Microscopic Examination Section -->
              <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>MICROSCOPIC EXAMINATION (HPF)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
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
                    return printableGseMicro.length > 0 ? printableGseMicro.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>';
                  })()}
                </div>
              </div>

              <!-- Parasitology & Helminths Section -->
              ${paraParts.length > 0 ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #7e22ce; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>PARASITOLOGY &amp; HELMINTHS</span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
                    ${paraParts.map(p => renderClinicalFindingBadge(p, !p.toLowerCase().startsWith('nil') && !p.toLowerCase().startsWith('none') && !p.toLowerCase().startsWith('not seen'), textColor)).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Culture & Sensitivity Section -->
              ${sensitivityParts.length > 0 ? `
                <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                  <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #0d9488; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                    <span>STOOL CULTURE &amp; SENSITIVITY PROFILE</span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
                    ${sensitivityParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('')}
                  </div>
                </div>
              ` : ''}

              ${noteText ? `
                <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 8px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
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
            
            <div style="background: #4338ca; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>SEMINAL FLUID ANALYSIS (S.F.A)</span>
              <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">WHO LABORATORY MANUAL 6TH EDITION</span>
            </div>

            <div style="margin-bottom: 14px;">
              <!-- 1. Physical / Macroscopic Examination -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #4338ca; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>1. MACROSCOPIC / PHYSICAL EXAMINATION</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
                  ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- 2. Sperm Count & Microscopy -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #4338ca; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>2. SPERM COUNT &amp; MICROSCOPY <span style="font-size: 10px; font-weight: normal; color: #64748b; margin-left: 6px;">(Ref: Conc &ge; 15 M/mL, Total &ge; 39 M/ejac, Pus &lt; 5 /HPF)</span></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
                  ${countParts.length > 0 ? countParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- 3. Motility Assessment -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #0284c7; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>3. SPERM MOTILITY ASSESSMENT <span style="font-size: 10px; font-weight: normal; color: #64748b; margin-left: 6px;">(WHO Ref: PR &ge; 32%, PR+NP &ge; 40%, Vitality &ge; 58%)</span></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
                  ${motilityParts.length > 0 ? motilityParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- 4. Morphology -->
              <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #7c3aed; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <span>4. SPERM MORPHOLOGY <span style="font-size: 10px; font-weight: normal; color: #64748b; margin-left: 6px;">(Kruger Strict Criteria Ref: Normal Forms &ge; 4%)</span></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
                  ${morphologyParts.length > 0 ? morphologyParts.map(p => renderClinicalFindingBadge(p, false, textColor)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
                </div>
              </div>

              <!-- Diagnostic Impression -->
              ${impressionText ? `
                <div style="margin-bottom: 10px; background: ${isNormo ? '#f0fdf4' : '#fef2f2'}; border: 1.5px solid ${isNormo ? '#bbf7d0' : '#fca5a5'}; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                  <div>
                    <span style="font-size: 11px; font-weight: 700; color: ${isNormo ? '#166534' : '#991b1b'}; text-transform: uppercase;">Diagnostic Impression:</span>
                    <span style="font-size: 13.5px; font-weight: 900; color: ${isNormo ? '#14532d' : '#7f1d1d'}; margin-left: 8px;">${escapeHtml(impressionText)}</span>
                  </div>
                  <span style="background: ${isNormo ? '#dcfce7' : '#fee2e2'}; color: ${isNormo ? '#15803d' : '#b91c1c'}; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; border: 1px solid ${isNormo ? '#86efac' : '#fecaca'};">
                    ${isNormo ? 'NORMAL PARAMETERS' : 'CLINICAL VARIATION'}
                  </span>
                </div>
              ` : ''}

              ${noteText ? `
                <div style="background: #f8fafc; border-left: 4px solid #4338ca; padding: 6px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
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
