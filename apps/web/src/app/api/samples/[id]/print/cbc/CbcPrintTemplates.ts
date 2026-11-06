import { classifyResultRange } from '@lab-manager/domain';
import { escapeHtml, toEnglishDigits } from '../PrintHeader';

export type CbcLayoutTemplateId =
  | 'SWELAB_3PART'
  | 'MINDRAY_3PART'
  | 'MINDRAY_5PART'
  | 'SYSMEX_3PART'
  | 'CLASSIC_5PART'
  | 'ANALYZER_3PART_HISTOGRAM'
  | 'WITH_HISTOGRAMS'
  | 'COMPACT_GRID'
  | 'DUAL_COLUMN'
  | 'PEDIATRIC_CARDS'
  | 'CLINICAL_MINIMAL'
  | 'REFERENCE_BANDS'
  | 'FLAG_FOCUS'
  | 'FULL_DIFFERENTIAL';

export interface CbcLayoutTemplateMeta {
  id: CbcLayoutTemplateId;
  nameAr: string;
  nameEn: string;
  badge: string;
  descriptionAr: string;
  accentColor: string;
}

export const CBC_LAYOUT_TEMPLATES: CbcLayoutTemplateMeta[] = [
  {
    id: 'SWELAB_3PART',
    nameAr: '1. تصميم جهاز سوي لاب (Swelab / Boule 3-Part)',
    nameEn: 'Swelab Alfa / Lumi Analyzer Report',
    badge: 'مطابق لجهاز سوي لاب 100%',
    descriptionAr: 'مطابق تماماً لورقة جهاز سوي لاب مع ترويسة التشغيل (Seq/Asp/Prof) والتفريق الثلاثي ومنحنيات 450/250/30 fL والأسهم ▼/▲.',
    accentColor: '#0284c7',
  },
  {
    id: 'MINDRAY_3PART',
    nameAr: '2. تصميم جهاز ميندراي ثلاثي الفئات (Mindray BC 3-Part)',
    nameEn: 'Mindray BC-Series 3-Part Analyzer Report',
    badge: 'مطابق لميندراي 3-Part',
    descriptionAr: 'تصميم أجهزة ميندراي BC-3000 Plus / BC-20s مع عمود التنبيه Flag (H/L) والمنحنيات البيانية.',
    accentColor: '#0f766e',
  },
  {
    id: 'MINDRAY_5PART',
    nameAr: '3. تصميم جهاز ميندراي خماسي الفئات (Mindray BC 5-Part & Scattergram)',
    nameEn: 'Mindray 5-Part Laser Scattergram Report',
    badge: 'خماسي الفئات + ليزر',
    descriptionAr: 'تفريق خماسي كامل مع مخطط التشتت الليزري DIFF Scattergram ومنحنيات التوزيع.',
    accentColor: '#7c3aed',
  },
  {
    id: 'SYSMEX_3PART',
    nameAr: '4. تصميم جهاز سيسمكس (Sysmex XP-300 / 3-Part)',
    nameEn: 'Sysmex Automated Hematology Report',
    badge: 'مطابق لسيسمكس',
    descriptionAr: 'مطابق لتسلسل معاملات ورسوم أجهزة Sysmex XP-300 / KX-21N.',
    accentColor: '#1e3a8a',
  },
  {
    id: 'CLASSIC_5PART',
    nameAr: '5. التصميم الكلاسيكي المعتمد (Classic 5-Part)',
    nameEn: 'Classic 5-Part Clinical Grid',
    badge: 'الافتراضي المعتمد',
    descriptionAr: 'تخطيط ثنائي الأعمدة مع التفريق الخماسي ومنحنيات التوزيع وملاحظات المسحة المحيطية.',
    accentColor: '#be123c',
  },
  {
    id: 'ANALYZER_3PART_HISTOGRAM',
    nameAr: '6. تصميم جهاز التحليل القياسي (3-Part Analyzer + Histograms)',
    nameEn: 'Automated 3-Part Analyzer Report',
    badge: 'مطابق لجهاز الدم',
    descriptionAr: 'يحاكي ورقة جهاز فحص الدم (WBC/GRA/LYM/MID + RBC/RDWa + PLT/P-LCR/P-LCC) مع أسهم ▼/▲ والمنحنيات.',
    accentColor: '#0284c7',
  },
  {
    id: 'WITH_HISTOGRAMS',
    nameAr: '3. جدول مع أشرطة مدى ومنحنيات (Range Bars & Histograms)',
    nameEn: 'Visual Range Bars & Histograms',
    badge: 'بصري متقدم',
    descriptionAr: 'جدول سريري أنيق مدمج مع أشرطة موقع النتيجة ومنحنيات توزيع الكريات والصفائح.',
    accentColor: '#0d9488',
  },
  {
    id: 'COMPACT_GRID',
    nameAr: '4. الشبكة المدمجة الاقتصادية (Compact In-Line Grid)',
    nameEn: 'Compact Space-Saver Dual Grid',
    badge: 'توفير مساحة',
    descriptionAr: 'تصميم مدمج في عمودين متجاورين يستهلك مساحة قليلة ويسمح بطباعة فحوصات أخرى بنفس الورقة.',
    accentColor: '#334155',
  },
  {
    id: 'DUAL_COLUMN',
    nameAr: '5. التقسيم الثنائي المتوازن (Balanced Dual Column)',
    nameEn: 'Symmetric Dual-Column Hematology',
    badge: 'ثنائي الأعمدة',
    descriptionAr: 'فصل متناظر بين الكريات الحمراء والصفائح في عمود، والكريات البيضاء والتفريق في العمود المقابل.',
    accentColor: '#1e3a8a',
  },
  {
    id: 'PEDIATRIC_CARDS',
    nameAr: '6. بطاقات الأطفال والعائلة (Pediatric & Family Cards)',
    nameEn: 'Soft Pediatric & Family Care Cards',
    badge: 'أطفال وعائلة',
    descriptionAr: 'بطاقات ملونة ناعمة ومريحة بصرياً مناسبة لتقارير الأطفال والعيادات الاستشارية.',
    accentColor: '#ea580c',
  },
  {
    id: 'CLINICAL_MINIMAL',
    nameAr: '7. الطبي التنفيذي لطابعات الليزر (Clinical Minimal B&W)',
    nameEn: 'Executive Monochrome Laser Minimal',
    badge: 'طابعات ليزر B&W',
    descriptionAr: 'تصميم طبي نظيف بخطوط دقيقة بدون خلفيات داكنة لتوفير الحبر ووضوح فائق بالأسود والأبيض.',
    accentColor: '#0f172a',
  },
  {
    id: 'REFERENCE_BANDS',
    nameAr: '8. أشرطة المدى المرجعي التفاعلية (Reference Bands)',
    nameEn: 'Linear Reference Spectrum Bands',
    badge: 'مؤشر بصري',
    descriptionAr: 'يعرض موقع كل نتيجة بصرياً داخل شريط المدى الطبيعي بين الحد الأدنى والأعلى.',
    accentColor: '#4338ca',
  },
  {
    id: 'FLAG_FOCUS',
    nameAr: '9. التركيز السريري على القيم الحرجة (Abnormal Flag Focus)',
    nameEn: 'Clinical Abnormal Flag Spotlight',
    badge: 'إبراز غير الطبيعي',
    descriptionAr: 'يبرز القيم المرتفعة والمنخفضة (H/L / ▲/▼) بتظليل واضح مع ملخص علوي للتنبيهات السريرية.',
    accentColor: '#dc2626',
  },
  {
    id: 'FULL_DIFFERENTIAL',
    nameAr: '10. التفصيلي الشامل 25+ معامل (Full 3-Part & 5-Part + Ratios)',
    nameEn: 'Comprehensive 25+ Parameters & Indices',
    badge: 'شامل 25+ معامل',
    descriptionAr: 'يعرض كافة معاملات 3-Part و 5-Part بالنسبي والمطلق مع مؤشرات NLR و PLR و Mentzer Index.',
    accentColor: '#7c3aed',
  },
];

export interface ParsedCbc {
  // Erythroid
  rbc: string;
  hgb: string;
  hct: string;
  mcv: string;
  mch: string;
  mchc: string;
  rdw: string;
  rdwSd: string;

  // Platelets
  plt: string;
  mpv: string;
  pdw: string;
  pdwSd: string;
  pct: string;
  plcr: string;
  plcc: string;

  // Leukocytes (Total + 3-Part + 5-Part)
  wbc: string;
  graPct: string;
  graAbs: string;
  lymPct: string;
  lymAbs: string;
  midPct: string;
  midAbs: string;

  neutrophils: string;
  neutrophilsAbs: string;
  lymphocytes: string;
  lymphocytesAbs: string;
  monocytes: string;
  monocytesAbs: string;
  eosinophils: string;
  eosinophilsAbs: string;
  basophils: string;
  basophilsAbs: string;

  morphology: string;
  comments: string;
}

export function parseCbcData(rawVal: string): ParsedCbc {
  const res: ParsedCbc = {
    rbc: '-',
    hgb: '-',
    hct: '-',
    mcv: '-',
    mch: '-',
    mchc: '-',
    rdw: '-',
    rdwSd: '-',
    plt: '-',
    mpv: '-',
    pdw: '-',
    pdwSd: '-',
    pct: '-',
    plcr: '-',
    plcc: '-',
    wbc: '-',
    graPct: '-',
    graAbs: '-',
    lymPct: '-',
    lymAbs: '-',
    midPct: '-',
    midAbs: '-',
    neutrophils: '-',
    neutrophilsAbs: '-',
    lymphocytes: '-',
    lymphocytesAbs: '-',
    monocytes: '-',
    monocytesAbs: '-',
    eosinophils: '-',
    eosinophilsAbs: '-',
    basophils: '-',
    basophilsAbs: '-',
    morphology: '',
    comments: '',
  };
  if (!rawVal) return res;

  const cleanVal = toEnglishDigits(rawVal);
  const lines = cleanVal.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('ERYTHROID:')) {
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
      const rdwM = trimmed.match(/RDW(?:%|_CV|-CV)?:\s*([^\s|]+)/i);
      if (rdwM) res.rdw = rdwM[1];
      const rdwSdM = trimmed.match(/(?:RDWa|RDW-SD|RDW_SD):\s*([^\s|]+)/i);
      if (rdwSdM) res.rdwSd = rdwSdM[1];
    } else if (upper.startsWith('PLATELETS:')) {
      const pltM = trimmed.match(/PLT:\s*([^\s|]+)/i);
      if (pltM) res.plt = pltM[1];
      const mpvM = trimmed.match(/MPV:\s*([^\s|]+)/i);
      if (mpvM) res.mpv = mpvM[1];
      const pdwM = trimmed.match(/PDW(?:%|_CV|-CV)?:\s*([^\s|]+)/i);
      if (pdwM) res.pdw = pdwM[1];
      const pdwSdM = trimmed.match(/(?:PDWa|PDW-SD|PDW_SD):\s*([^\s|]+)/i);
      if (pdwSdM) res.pdwSd = pdwSdM[1];
      const pctM = trimmed.match(/PCT:\s*([^\s|]+)/i);
      if (pctM) res.pct = pctM[1];
      const plcrM = trimmed.match(/(?:P-LCR|PLCR):\s*([^\s|]+)/i);
      if (plcrM) res.plcr = plcrM[1];
      const plccM = trimmed.match(/(?:P-LCC|PLCC):\s*([^\s|]+)/i);
      if (plccM) res.plcc = plccM[1];
    } else if (upper.startsWith('LEUKOCYTES:')) {
      const wbcM = trimmed.match(/WBC:\s*([^\s|]+)/i);
      if (wbcM) res.wbc = wbcM[1];
    } else if (upper.startsWith('DIFFERENTIAL_3PART:') || upper.startsWith('3PART:')) {
      const graPctM = trimmed.match(/GRA%:\s*([^\s%|]+)/i);
      if (graPctM) res.graPct = graPctM[1];
      const graAbsM = trimmed.match(/GRA#?:\s*([^\s|]+)/i);
      if (graAbsM) res.graAbs = graAbsM[1];
      const lymPctM = trimmed.match(/LYM%:\s*([^\s%|]+)/i);
      if (lymPctM) res.lymPct = lymPctM[1];
      const lymAbsM = trimmed.match(/LYM#?:\s*([^\s|]+)/i);
      if (lymAbsM) res.lymAbs = lymAbsM[1];
      const midPctM = trimmed.match(/MID%:\s*([^\s%|]+)/i);
      if (midPctM) res.midPct = midPctM[1];
      const midAbsM = trimmed.match(/MID#?:\s*([^\s|]+)/i);
      if (midAbsM) res.midAbs = midAbsM[1];
    } else if (upper.startsWith('DIFFERENTIAL_ABS:')) {
      const nAbsM = trimmed.match(/Neut#?:\s*([^\s|]+)/i);
      if (nAbsM) res.neutrophilsAbs = nAbsM[1];
      const lAbsM = trimmed.match(/Lymph#?:\s*([^\s|]+)/i);
      if (lAbsM) res.lymphocytesAbs = lAbsM[1];
      const mAbsM = trimmed.match(/Mono#?:\s*([^\s|]+)/i);
      if (mAbsM) res.monocytesAbs = mAbsM[1];
      const eAbsM = trimmed.match(/Eos#?:\s*([^\s|]+)/i);
      if (eAbsM) res.eosinophilsAbs = eAbsM[1];
      const bAbsM = trimmed.match(/Baso#?:\s*([^\s|]+)/i);
      if (bAbsM) res.basophilsAbs = bAbsM[1];
    } else if (upper.startsWith('DIFFERENTIAL:')) {
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
    } else if (upper.startsWith('MORPHOLOGY:')) {
      res.morphology = trimmed.replace(/MORPHOLOGY:/i, '').trim();
    } else if (upper.startsWith('COMMENTS:') || upper.startsWith('COMMENT:')) {
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
      const rdwM = trimmed.match(/\bRDW%?\b[:\s=]+([0-9.]+)/i);
      if (rdwM && res.rdw === '-') res.rdw = rdwM[1];
      const rdwSdM = trimmed.match(/\b(RDWa|RDW-SD)\b[:\s=]+([0-9.]+)/i);
      if (rdwSdM && res.rdwSd === '-') res.rdwSd = rdwSdM[2];
      const pltM = trimmed.match(/\bPLT\b[:\s=]+([0-9.]+)/i);
      if (pltM && res.plt === '-') res.plt = pltM[1];
      const mpvM = trimmed.match(/\bMPV\b[:\s=]+([0-9.]+)/i);
      if (mpvM && res.mpv === '-') res.mpv = mpvM[1];
      const pdwM = trimmed.match(/\bPDW%?\b[:\s=]+([0-9.]+)/i);
      if (pdwM && res.pdw === '-') res.pdw = pdwM[1];
      const pdwSdM = trimmed.match(/\b(PDWa|PDW-SD)\b[:\s=]+([0-9.]+)/i);
      if (pdwSdM && res.pdwSd === '-') res.pdwSd = pdwSdM[2];
      const pctM = trimmed.match(/\bPCT\b[:\s=]+([0-9.]+)/i);
      if (pctM && res.pct === '-') res.pct = pctM[1];
      const plcrM = trimmed.match(/\b(P-LCR|PLCR)\b[:\s=]+([0-9.]+)/i);
      if (plcrM && res.plcr === '-') res.plcr = plcrM[2];
      const plccM = trimmed.match(/\b(P-LCC|PLCC)\b[:\s=]+([0-9.]+)/i);
      if (plccM && res.plcc === '-') res.plcc = plccM[2];
      const wbcM = trimmed.match(/\bWBC\b[:\s=]+([0-9.]+)/i);
      if (wbcM && res.wbc === '-') res.wbc = wbcM[1];
      const graPctM = trimmed.match(/\bGRA%\b[:\s=]+([0-9.]+)/i);
      if (graPctM && res.graPct === '-') res.graPct = graPctM[1];
      const graAbsM = trimmed.match(/\bGRA#?\b[:\s=]+([0-9.]+)/i);
      if (graAbsM && res.graAbs === '-') res.graAbs = graAbsM[1];
      const lymPctM = trimmed.match(/\bLYM%\b[:\s=]+([0-9.]+)/i);
      if (lymPctM && res.lymPct === '-') res.lymPct = lymPctM[1];
      const lymAbsM = trimmed.match(/\bLYM#?\b[:\s=]+([0-9.]+)/i);
      if (lymAbsM && res.lymAbs === '-') res.lymAbs = lymAbsM[1];
      const midPctM = trimmed.match(/\bMID%\b[:\s=]+([0-9.]+)/i);
      if (midPctM && res.midPct === '-') res.midPct = midPctM[1];
      const midAbsM = trimmed.match(/\bMID#?\b[:\s=]+([0-9.]+)/i);
      if (midAbsM && res.midAbs === '-') res.midAbs = midAbsM[1];
    }
  }

  // Auto-derive 3-part / 5-part & absolute counts when one is available so all 10 templates have complete clinical numbers
  const wbcN = parseFloat(res.wbc);
  const hasWbc = !isNaN(wbcN) && wbcN > 0;

  const neutN = parseFloat(res.neutrophils);
  const lymphN = parseFloat(res.lymphocytes);
  const monoN = parseFloat(res.monocytes);
  const eosN = parseFloat(res.eosinophils);
  const basoN = parseFloat(res.basophils);

  if (res.graPct === '-' && !isNaN(neutN)) {
    const g = neutN + (isNaN(eosN) ? 0 : eosN) + (isNaN(basoN) ? 0 : basoN);
    res.graPct = g.toFixed(1);
  }
  if (res.lymPct === '-' && !isNaN(lymphN)) {
    res.lymPct = lymphN.toFixed(1);
  }
  if (res.midPct === '-' && !isNaN(monoN)) {
    res.midPct = monoN.toFixed(1);
  }

  if (res.neutrophils === '-' && res.graPct !== '-') {
    res.neutrophils = res.graPct;
  }
  if (res.lymphocytes === '-' && res.lymPct !== '-') {
    res.lymphocytes = res.lymPct;
  }
  if (res.monocytes === '-' && res.midPct !== '-') {
    res.monocytes = res.midPct;
  }

  const computeAbs = (pctStr: string, existingAbs: string): string => {
    if (existingAbs && existingAbs !== '-') return existingAbs;
    const p = parseFloat(pctStr);
    if (hasWbc && !isNaN(p)) return ((wbcN * p) / 100).toFixed(2);
    return '-';
  };

  res.graAbs = computeAbs(res.graPct, res.graAbs);
  res.lymAbs = computeAbs(res.lymPct, res.lymAbs);
  res.midAbs = computeAbs(res.midPct, res.midAbs);

  res.neutrophilsAbs = computeAbs(res.neutrophils, res.neutrophilsAbs);
  res.lymphocytesAbs = computeAbs(res.lymphocytes, res.lymphocytesAbs);
  res.monocytesAbs = computeAbs(res.monocytes, res.monocytesAbs);
  res.eosinophilsAbs = computeAbs(res.eosinophils, res.eosinophilsAbs);
  res.basophilsAbs = computeAbs(res.basophils, res.basophilsAbs);

  return res;
}

export interface RenderCbcTemplateContext {
  layout: CbcLayoutTemplateId | string;
  cbc: any;
  parsed: ParsedCbc;
  priorCbcParsed: ParsedCbc | null;
  priorCbcDate: string;
  isFemale: boolean;
  specialFormFontSize: number;
  customCellPadding: string;
  textColor: string;
  headerBgColor: string;
  borderColor: string;
  settings: any;
  generateHistogramSvg: (type: 'WBC' | 'RBC' | 'PLT', points?: number[], width?: number, height?: number) => string;
  sample?: any;
  patient?: any;
}

function evalFlag(val: string, low: number, high: number) {
  const hasVal = Boolean(val && val !== '-');
  if (!hasVal) {
    return { hasVal: false, isAbnormal: false, isHigh: false, isLow: false, arrow: '', analyzerArrow: '', color: '#0f172a' };
  }
  const ev = classifyResultRange(val, { low, high });
  const num = parseFloat(val);
  const isHigh = !isNaN(num) && num > high;
  const isLow = !isNaN(num) && num < low;
  const analyzerArrow = isHigh ? '▲' : isLow ? '▼' : '';
  return {
    hasVal: true,
    isAbnormal: ev.isAbnormal,
    isHigh,
    isLow,
    arrow: ev.isAbnormal ? ev.arrow : '',
    analyzerArrow,
    color: ev.isAbnormal ? ev.color : '#0f172a',
  };
}

function buildRangeBarHtml(val: string, low: number, high: number, widthPx = 90): string {
  const num = parseFloat(val);
  if (isNaN(num) || high <= low) {
    return `<div style="width:${widthPx}px;height:6px;background:#e2e8f0;border-radius:3px;"></div>`;
  }
  const span = high - low;
  const minBound = low - span * 0.35;
  const maxBound = high + span * 0.35;
  const pct = Math.max(4, Math.min(96, ((num - minBound) / (maxBound - minBound)) * 100));
  const normalStartPct = ((low - minBound) / (maxBound - minBound)) * 100;
  const normalWidthPct = ((high - low) / (maxBound - minBound)) * 100;
  const isAbn = num < low || num > high;
  const dotCol = num > high ? '#dc2626' : num < low ? '#2563eb' : '#16a34a';

  return `
    <div style="position:relative;width:${widthPx}px;height:8px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;overflow:hidden;display:inline-block;vertical-align:middle;">
      <div style="position:absolute;left:${normalStartPct.toFixed(1)}%;width:${normalWidthPct.toFixed(1)}%;top:0;bottom:0;background:#dcfce7;"></div>
      <div style="position:absolute;left:calc(${pct.toFixed(1)}% - 3.5px);top:0.5px;width:6px;height:6px;border-radius:50%;background:${dotCol};box-shadow:0 0 2px rgba(0,0,0,0.4);"></div>
    </div>
  `;
}

function buildMentzerHtml(parsed: ParsedCbc, specialFormFontSize: number): string {
  const rbcNum = parseFloat(parsed.rbc);
  const mcvNum = parseFloat(parsed.mcv);
  if (!isNaN(rbcNum) && !isNaN(mcvNum) && rbcNum > 0 && mcvNum > 0) {
    const mIdx = Math.round((mcvNum / rbcNum) * 10) / 10;
    if (mcvNum < 80) {
      const isThal = mIdx < 13;
      const desc = isThal
        ? 'Mentzer Index < 13: Suggests Beta-Thalassemia Trait'
        : 'Mentzer Index ≥ 13: Suggests Iron Deficiency Anemia';
      const badgeBg = isThal ? '#eff6ff' : '#fefce8';
      const badgeBdr = isThal ? '#bfdbfe' : '#fef08a';
      const badgeCol = isThal ? '#1d4ed8' : '#854d0e';
      return `
        <div style="background: ${badgeBg}; border: 1px solid ${badgeBdr}; color: ${badgeCol}; padding: 6px 10px; border-radius: 6px; font-size: ${specialFormFontSize}px; margin-top: 6px; text-align: left;" dir="ltr">
          <strong>Mentzer Index (MCV/RBC):</strong> ${mIdx} &bull; <em>${desc}</em>
        </div>`;
    }
  }
  return '';
}

function buildMorphologyAndCommentsHtml(parsed: ParsedCbc, settings: any, specialFormFontSize: number): string {
  if (settings?.showClinicalComments === false) return '';
  return `
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
  `;
}

export function renderCbcTemplate(ctx: RenderCbcTemplateContext): string {
  const {
    layout,
    cbc,
    parsed,
    priorCbcParsed,
    priorCbcDate,
    isFemale,
    specialFormFontSize,
    customCellPadding,
    textColor,
    headerBgColor,
    settings,
    generateHistogramSvg,
    sample,
    patient,
  } = ctx;

  const rbcRef = isFemale ? '4.00 - 5.20' : '4.50 - 5.90';
  const rbcLow = isFemale ? 4.0 : 4.5;
  const rbcHigh = isFemale ? 5.2 : 5.9;
  const hgbRef = isFemale ? '12.0 - 15.5' : '13.0 - 17.5';
  const hgbLow = isFemale ? 12.0 : 13.0;
  const hgbHigh = isFemale ? 15.5 : 17.5;
  const hctRef = isFemale ? '36.0 - 48.0' : '40.0 - 52.0';
  const hctLow = isFemale ? 36.0 : 40.0;
  const hctHigh = isFemale ? 48.0 : 52.0;

  const wbcNum = parseFloat(parsed.wbc) || 0;
  const mentzerHtml = buildMentzerHtml(parsed, specialFormFontSize);

  // Determine if sections contain active entered data
  const hasWbc = Boolean(
    (parsed.wbc && parsed.wbc !== '-') ||
    (parsed.graPct && parsed.graPct !== '-') ||
    (parsed.lymPct && parsed.lymPct !== '-') ||
    (parsed.midPct && parsed.midPct !== '-') ||
    (parsed.neutrophils && parsed.neutrophils !== '-')
  );
  const hasRbc = Boolean(
    (parsed.rbc && parsed.rbc !== '-') ||
    (parsed.hgb && parsed.hgb !== '-') ||
    (parsed.hct && parsed.hct !== '-') ||
    (parsed.mcv && parsed.mcv !== '-') ||
    (parsed.mch && parsed.mch !== '-') ||
    (parsed.mchc && parsed.mchc !== '-') ||
    (parsed.rdw && parsed.rdw !== '-')
  );
  const hasPlt = Boolean(
    (parsed.plt && parsed.plt !== '-') ||
    (parsed.mpv && parsed.mpv !== '-') ||
    (parsed.pdw && parsed.pdw !== '-') ||
    (parsed.pct && parsed.pct !== '-')
  );

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

  const renderDiffRow = (name: string, pctStr: string, refPct: string, _low: number, _high: number, wbcVal: number, priorPct?: string, explicitAbs?: string) => {
    const num = parseFloat(pctStr);
    const hasVal = pctStr && pctStr !== '-';
    const evalResult = hasVal ? classifyResultRange(pctStr, { low: _low, high: _high }) : null;
    const isAbnormal = evalResult?.isAbnormal || false;
    const diffColor = isAbnormal ? evalResult!.color : textColor;
    const arrowHtml = isAbnormal
      ? ` <strong style="color: ${evalResult!.color}; font-weight: 900; margin-left: 4px; font-family: Arial, sans-serif;">${evalResult!.arrow}</strong>`
      : '';

    const absVal = explicitAbs && explicitAbs !== '-'
      ? explicitAbs
      : hasVal && !isNaN(num) && wbcVal > 0
        ? ((wbcVal * num) / 100).toFixed(2)
        : '-';
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
          ${absVal !== '-' ? `${escapeHtml(absVal)} <span style="font-size: ${Math.max(9, specialFormFontSize - 2.5)}px; color: #64748b; font-weight: 600;">10^3/uL</span>` : '-'}
        </td>
        <td style="padding: ${customCellPadding}; color: #334155; font-weight: 600; text-align: left;"><span dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:isolate;">${refPct}</span></td>
      </tr>`;
  };

  // =========================================================================
  // 1. SWELAB_3PART / ANALYZER_3PART_HISTOGRAM (Exact Match to Swelab Paper)
  // =========================================================================
  if (layout === 'SWELAB_3PART' || layout === 'ANALYZER_3PART_HISTOGRAM') {
    const renderSwelabRow = (name: string, val: string, unit: string, low: number, high: number, isResearch = false, explicitRef?: string) => {
      const f = evalFlag(val, low, high);
      const arrow = f.isHigh
        ? '<span style="color:#dc2626; font-weight:900; margin-left:3px;">&#9650;</span>'
        : f.isLow
        ? '<span style="color:#2563eb; font-weight:900; margin-left:3px;">&#9660;</span>'
        : '';
      const nameDisplay = isResearch ? `${name}*` : name;
      const rangeText = explicitRef || `${low.toFixed(low % 1 === 0 ? 0 : 1)} : ${high.toFixed(high % 1 === 0 ? 0 : 1)}`;
      return `
        <tr style="border-bottom: 1px dashed #e2e8f0; font-size: ${specialFormFontSize}px; font-family: 'Consolas', 'Courier New', monospace;">
          <td style="padding: 3px 6px; font-weight: 800; color: #0f172a; width: 25%;">${nameDisplay}</td>
          <td style="padding: 3px 6px; font-weight: 900; color: #0f172a; width: 25%;">
            ${f.hasVal ? `${escapeHtml(val)} ${arrow}` : '<span style="color:#94a3b8;">-</span>'}
          </td>
          <td style="padding: 3px 6px; color: #475569; font-weight: 600; font-size: ${Math.max(9.5, specialFormFontSize - 1.5)}px; width: 22%;">${unit}</td>
          <td style="padding: 3px 6px; color: #334155; font-weight: 700; text-align: right; width: 28%;"><span dir="ltr" style="unicode-bidi:isolate;">${rangeText}</span></td>
        </tr>
      `;
    };

    const renderSwelabCurveSvg = (type: 'WBC' | 'RBC' | 'PLT', width = 280, height = 105): string => {
      const maxLabel = type === 'WBC' ? '450' : type === 'RBC' ? '250' : '30';
      const midLabel = type === 'WBC' ? '225' : type === 'RBC' ? '125' : '15';
      let curvePath = '';
      let discriminators: number[] = [];

      if (type === 'WBC') {
        curvePath = `M 15 ${height - 22} Q 30 ${height - 22}, 42 ${height - 68} Q 52 ${height - 85}, 62 ${height - 52} Q 72 ${height - 42}, 85 ${height - 46} Q 105 ${height - 75}, 125 ${height - 88} Q 145 ${height - 70}, 165 ${height - 35} Q 185 ${height - 23}, 225 ${height - 22}`;
        discriminators = [55, 80];
      } else if (type === 'RBC') {
        curvePath = `M 15 ${height - 22} Q 35 ${height - 22}, 50 ${height - 45} Q 70 ${height - 90}, 90 ${height - 75} Q 115 ${height - 40}, 145 ${height - 24} Q 180 ${height - 22}, 225 ${height - 22}`;
        discriminators = [42, 135];
      } else {
        curvePath = `M 15 ${height - 22} Q 25 ${height - 70}, 38 ${height - 88} Q 55 ${height - 65}, 75 ${height - 38} Q 110 ${height - 24}, 160 ${height - 22} L 225 ${height - 22}`;
        discriminators = [95];
      }

      const discLines = discriminators.map(x => `
        <line x1="${x}" y1="12" x2="${x}" y2="${height - 22}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3 3"/>
      `).join('');

      return `
        <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:4px; padding:4px 6px; width:100%; max-width:${width}px;">
          <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible; display:block;">
            <line x1="15" y1="10" x2="15" y2="${height - 22}" stroke="#0f172a" stroke-width="1.5"/>
            <line x1="15" y1="${height - 22}" x2="${width - 10}" y2="${height - 22}" stroke="#0f172a" stroke-width="1.5"/>
            ${discLines}
            <path d="${curvePath} L 225 ${height - 22} Z" fill="rgba(15, 23, 42, 0.08)"/>
            <path d="${curvePath}" fill="none" stroke="#0f172a" stroke-width="1.8"/>
            <text x="15" y="${height - 6}" font-size="11" font-weight="800" fill="#0f172a" font-family="'Consolas', 'Courier New', monospace">${type}</text>
            <text x="${(width - 25) / 2}" y="${height - 6}" font-size="11" font-weight="700" fill="#334155" text-anchor="middle" font-family="'Consolas', 'Courier New', monospace">${midLabel}</text>
            <text x="${width - 15}" y="${height - 6}" font-size="11" font-weight="700" fill="#334155" text-anchor="end" font-family="'Consolas', 'Courier New', monospace">${maxLabel} fl</text>
          </svg>
        </div>
      `;
    };

    const seqVal = (cbc as any).deviceSeq || sample?.sampleNumber || '238';
    const sampleDate = sample?.createdAt ? new Date(sample.createdAt) : new Date();
    const dateFormatted = !isNaN(sampleDate.getTime()) ? sampleDate.toISOString().slice(0, 10) : '2026-11-03';
    const timeFormatted = !isNaN(sampleDate.getTime()) ? sampleDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '04:24';

    return `
      <div style="border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: #ffffff; font-family: 'Consolas', 'Courier New', monospace;" dir="ltr">
        <div style="background: ${headerBgColor || '#0f172a'}; color: #ffffff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <span style="font-weight: 900; font-size: ${specialFormFontSize + 1}px; letter-spacing: 0.4px;">SWELAB ALFA / LUMI 3-PART HEMATOLOGY ANALYZER REPORT</span>
          <span style="font-size: 10px; background: rgba(255,255,255,0.18); padding: 2px 8px; border-radius: 4px; font-family: monospace;">Boule Diagnostics Format</span>
        </div>

        <!-- Analyzer Header Metadata (Matching Swelab Slip) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 14px; padding: 8px 14px; background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; font-size: 11.5px;">
          <div><strong style="color:#64748b;">ID 1:</strong> <span style="color:#0f172a; font-weight:800;">${escapeHtml(sample?.barcode || sample?.sampleNumber || '1')}</span></div>
          <div><strong style="color:#64748b;">Seq:</strong> <span style="color:#0f172a; font-weight:800;">${escapeHtml(String(seqVal))}</span></div>
          <div><strong style="color:#64748b;">Date:</strong> <span style="color:#0f172a; font-weight:800;">${dateFormatted}</span></div>
          <div><strong style="color:#64748b;">Time:</strong> <span style="color:#0f172a; font-weight:800;">${timeFormatted}</span></div>
          <div><strong style="color:#64748b;">Prof:</strong> <span style="color:#0f172a; font-weight:800;">Blood</span></div>
          <div><strong style="color:#64748b;">Asp.:</strong> <span style="color:#0f172a; font-weight:800;">Micropipette</span></div>
          <div><strong style="color:#64748b;">Oper.:</strong> <span style="color:#0f172a; font-weight:800;">${escapeHtml(settings?.labTechnicianName || 'Tech')}</span></div>
          <div><strong style="color:#64748b;">Notes:</strong> <span style="color:#0f172a; font-weight:800;">-</span></div>
        </div>

        <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 14px;" dir="ltr">
          ${hasWbc ? `
          <!-- 1. WBC Section with Horizontal Alignment to Histogram -->
          <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; align-items: center; ${hasRbc || hasPlt ? 'border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;' : ''}">
            <div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #0f172a; font-size: 10px; color: #64748b; font-weight: 800;">
                    <th style="text-align:left; padding: 2px 6px;">Test</th>
                    <th style="text-align:left; padding: 2px 6px;">Result</th>
                    <th style="text-align:left; padding: 2px 6px;">Unit</th>
                    <th style="text-align:right; padding: 2px 6px;">Ranges</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderSwelabRow('WBC', parsed.wbc, '10^9/l', 4.0, 11.0, false, '4.0 : 11.0')}
                  ${renderSwelabRow('GRA%', parsed.graPct, '%', 35.0, 80.0, false, '35.0 : 80.0')}
                  ${renderSwelabRow('GRA', parsed.graAbs, '10^9/l', 1.2, 8.0, false, '1.2 : 8.0')}
                  ${renderSwelabRow('LYM%', parsed.lymPct, '%', 15.0, 50.0, false, '15.0 : 50.0')}
                  ${renderSwelabRow('LYM', parsed.lymAbs, '10^9/l', 0.9, 5.0, false, '0.9 : 5.0')}
                  ${renderSwelabRow('MID%', parsed.midPct, '%', 2.0, 15.0, false, '2.0 : 15.0')}
                  ${renderSwelabRow('MID', parsed.midAbs, '10^9/l', 0.1, 1.5, false, '0.1 : 1.5')}
                </tbody>
              </table>
            </div>
            <div style="display: flex; justify-content: center;">
              ${renderSwelabCurveSvg('WBC', 260, 105)}
            </div>
          </div>
          ` : ''}

          ${hasRbc ? `
          <!-- 2. RBC Section with Horizontal Alignment to Histogram -->
          <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; align-items: center; ${hasPlt ? 'border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;' : ''}">
            <div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #0f172a; font-size: 10px; color: #64748b; font-weight: 800;">
                    <th style="text-align:left; padding: 2px 6px;">Test</th>
                    <th style="text-align:left; padding: 2px 6px;">Result</th>
                    <th style="text-align:left; padding: 2px 6px;">Unit</th>
                    <th style="text-align:right; padding: 2px 6px;">Ranges</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderSwelabRow('RBC', parsed.rbc, '10^12/l', 3.50, 5.50, false, '3.50 : 5.50')}
                  ${renderSwelabRow('HGB', parsed.hgb, 'g/dl', 11.5, 16.5, false, '11.5 : 16.5')}
                  ${renderSwelabRow('HCT', parsed.hct, '%', 35.0, 55.0, false, '35.0 : 55.0')}
                  ${renderSwelabRow('MCV', parsed.mcv, 'fl', 75.0, 100.0, false, '75.0 : 100.0')}
                  ${renderSwelabRow('MCH', parsed.mch, 'pg', 25.0, 35.0, false, '25.0 : 35.0')}
                  ${renderSwelabRow('MCHC', parsed.mchc, 'g/dl', 31.0, 38.0, false, '31.0 : 38.0')}
                  ${renderSwelabRow('RDW%', parsed.rdw, '%', 11.0, 16.0, false, '11.0 : 16.0')}
                  ${parsed.rdwSd && parsed.rdwSd !== '-' ? renderSwelabRow('RDWa', parsed.rdwSd, 'fl', 0.1, 250.0, true, '0.1 : 250.0') : ''}
                </tbody>
              </table>
            </div>
            <div style="display: flex; justify-content: center;">
              ${renderSwelabCurveSvg('RBC', 260, 105)}
            </div>
          </div>
          ` : ''}

          ${hasPlt ? `
          <!-- 3. PLT Section with Horizontal Alignment to Histogram -->
          <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; align-items: center;">
            <div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #0f172a; font-size: 10px; color: #64748b; font-weight: 800;">
                    <th style="text-align:left; padding: 2px 6px;">Test</th>
                    <th style="text-align:left; padding: 2px 6px;">Result</th>
                    <th style="text-align:left; padding: 2px 6px;">Unit</th>
                    <th style="text-align:right; padding: 2px 6px;">Ranges</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderSwelabRow('PLT', parsed.plt, '10^9/l', 150, 450, false, '150 : 450')}
                  ${renderSwelabRow('MPV', parsed.mpv, 'fl', 6.5, 11.0, false, '6.5 : 11.0')}
                  ${parsed.pct && parsed.pct !== '-' ? renderSwelabRow('PCT', parsed.pct, '%', 0.01, 9.99, true, '0.01 : 9.99') : ''}
                  ${parsed.pdw && parsed.pdw !== '-' ? renderSwelabRow('PDW%', parsed.pdw, '%', 0.1, 99.9, true, '0.1 : 99.9') : ''}
                  ${parsed.pdwSd && parsed.pdwSd !== '-' ? renderSwelabRow('PDWa', parsed.pdwSd, 'fl', 0.1, 30.0, true, '0.1 : 30.0') : ''}
                  ${parsed.plcr && parsed.plcr !== '-' ? renderSwelabRow('P-LCR', parsed.plcr, '%', 0.1, 99.9, true, '0.1 : 99.9') : ''}
                  ${parsed.plcc && parsed.plcc !== '-' ? renderSwelabRow('P-LCC', parsed.plcc, '10^9/l', 1, 1999, true, '1 : 1999') : ''}
                </tbody>
              </table>
            </div>
            <div style="display: flex; justify-content: center;">
              ${renderSwelabCurveSvg('PLT', 260, 105)}
            </div>
          </div>
          ` : ''}
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px 14px; font-size: 10.5px; color: #475569; display: flex; justify-content: space-between;">
          <span><strong>Flags:</strong> <strong style="color:#dc2626;">▲ High</strong> &bull; <strong style="color:#2563eb;">▼ Low</strong> &bull; <strong>*</strong> Research parameter</span>
          <span><strong>Swelab / Boule Diagnostics Compatible</strong></span>
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 2. MINDRAY_3PART (Standard Mindray BC-3000 Plus / BC-20s / BC-30s)
  // =========================================================================
  if (layout === 'MINDRAY_3PART') {
    const renderMindrayRow = (param: string, val: string, unit: string, low: number, high: number) => {
      const f = evalFlag(val, low, high);
      const flagStr = f.isHigh ? '<span style="color:#dc2626; font-weight:900;">H</span>' : f.isLow ? '<span style="color:#2563eb; font-weight:900;">L</span>' : '';
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: ${specialFormFontSize}px; font-family: 'Consolas', 'Segoe UI', monospace;">
          <td style="padding: 2.5px 6px; font-weight: 700; color: #0f172a;">${param}</td>
          <td style="padding: 2.5px 6px; text-align: right; font-weight: 800; color: #0f172a;">${f.hasVal ? escapeHtml(val) : '-'}</td>
          <td style="padding: 2.5px 4px; text-align: center; width: 28px;">${flagStr}</td>
          <td style="padding: 2.5px 6px; color: #64748b; font-size: 11px;">${unit}</td>
          <td style="padding: 2.5px 6px; text-align: right; color: #334155; font-size: 11px;"><span dir="ltr" style="unicode-bidi:isolate;">${low} - ${high}</span></td>
        </tr>
      `;
    };

    return `
      <div style="border: 2px solid #0284c7; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: #ffffff;" dir="ltr">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 900; font-size: ${specialFormFontSize + 1}px;">MINDRAY AUTO HEMATOLOGY ANALYZER REPORT (BC-3000 PLUS / BC-20S)</span>
          <span style="font-size: 10px; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px; font-family: monospace;">Mindray 3-Part</span>
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; padding: 12px;">
          <div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; border-bottom: 1px solid #bae6fd;">
                  <th style="padding: 4px 6px; text-align: left;">Parameter</th>
                  <th style="padding: 4px 6px; text-align: right;">Result</th>
                  <th style="padding: 4px 4px; text-align: center;">Flag</th>
                  <th style="padding: 4px 6px; text-align: left;">Unit</th>
                  <th style="padding: 4px 6px; text-align: right;">Ref. Range</th>
                </tr>
              </thead>
              <tbody>
                ${hasWbc ? `
                ${renderMindrayRow('WBC', parsed.wbc, '10^9/L', 4.0, 10.0)}
                ${renderMindrayRow('Lymph#', parsed.lymAbs, '10^9/L', 0.8, 4.0)}
                ${renderMindrayRow('Mid#', parsed.midAbs, '10^9/L', 0.1, 1.5)}
                ${renderMindrayRow('Gran#', parsed.graAbs, '10^9/L', 2.0, 7.0)}
                ${renderMindrayRow('Lymph%', parsed.lymPct, '%', 20.0, 40.0)}
                ${renderMindrayRow('Mid%', parsed.midPct, '%', 3.0, 15.0)}
                ${renderMindrayRow('Gran%', parsed.graPct, '%', 50.0, 70.0)}
                ` : ''}
                ${hasRbc ? `
                <tr style="background:#f8fafc;">${renderMindrayRow('RBC', parsed.rbc, '10^12/L', 3.50, 5.50)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('HGB', parsed.hgb, 'g/dL', 11.0, 16.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('HCT', parsed.hct, '%', 36.0, 50.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('MCV', parsed.mcv, 'fL', 80.0, 100.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('MCH', parsed.mch, 'pg', 27.0, 34.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('MCHC', parsed.mchc, 'g/dL', 32.0, 36.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('RDW-CV', parsed.rdw, '%', 11.0, 16.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindrayRow('RDW-SD', parsed.rdwSd, 'fL', 35.0, 56.0)}</tr>
                ` : ''}
                ${hasPlt ? `
                ${renderMindrayRow('PLT', parsed.plt, '10^9/L', 100, 300)}
                ${renderMindrayRow('MPV', parsed.mpv, 'fL', 6.5, 12.0)}
                ${renderMindrayRow('PDW', parsed.pdwSd !== '-' ? parsed.pdwSd : parsed.pdw, 'fL', 9.0, 17.0)}
                ${renderMindrayRow('PCT', parsed.pct, '%', 0.108, 0.282)}
                ${parsed.plcr && parsed.plcr !== '-' ? renderMindrayRow('P-LCR', parsed.plcr, '%', 11.0, 45.0) : ''}
                ${parsed.plcc && parsed.plcc !== '-' ? renderMindrayRow('P-LCC', parsed.plcc, '10^9/L', 30, 90) : ''}
                ` : ''}
              </tbody>
            </table>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${hasWbc ? generateHistogramSvg('WBC', (cbc as any).wbcCurve, 260, 90) : ''}
            ${hasRbc ? generateHistogramSvg('RBC', (cbc as any).rbcCurve, 260, 90) : ''}
            ${hasPlt ? generateHistogramSvg('PLT', (cbc as any).pltCurve, 260, 90) : ''}
            ${mentzerHtml}
          </div>
        </div>
        <div style="padding: 6px 12px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b; display: flex; justify-content: space-between;">
          <span><strong>Flags:</strong> <strong style="color:#dc2626;">H</strong> = High &bull; <strong style="color:#2563eb;">L</strong> = Low</span>
          <span><strong>Mindray Biomedical Standard Protocol</strong></span>
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 3. MINDRAY_5PART (Mindray BC-5000 / BC-5150 with Laser Scattergram)
  // =========================================================================
  if (layout === 'MINDRAY_5PART') {
    const renderMindray5Row = (param: string, val: string, unit: string, low: number, high: number) => {
      const f = evalFlag(val, low, high);
      const flagStr = f.isHigh ? '<span style="color:#dc2626; font-weight:900;">H</span>' : f.isLow ? '<span style="color:#2563eb; font-weight:900;">L</span>' : '';
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: ${Math.max(10, specialFormFontSize - 0.5)}px; font-family: 'Consolas', monospace;">
          <td style="padding: 2px 6px; font-weight: 700; color: #0f172a;">${param}</td>
          <td style="padding: 2px 6px; text-align: right; font-weight: 800; color: #0f172a;">${f.hasVal ? escapeHtml(val) : '-'}</td>
          <td style="padding: 2px 2px; text-align: center; width: 22px;">${flagStr}</td>
          <td style="padding: 2px 4px; color: #64748b; font-size: 10px;">${unit}</td>
          <td style="padding: 2px 6px; text-align: right; color: #334155; font-size: 10px;"><span dir="ltr" style="unicode-bidi:isolate;">${low} - ${high}</span></td>
        </tr>
      `;
    };

    return `
      <div style="border: 2px solid #7c3aed; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: #ffffff;" dir="ltr">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 900; font-size: ${specialFormFontSize + 1}px;">MINDRAY 5-PART AUTO HEMATOLOGY ANALYZER REPORT (BC-5000 / BC-5150)</span>
          <span style="font-size: 10px; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px; font-family: monospace;">Laser Scattergram</span>
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; padding: 12px;">
          <div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f5f3ff; color: #6d28d9; font-size: 10px; font-weight: 800; border-bottom: 1px solid #ddd6fe;">
                  <th style="padding: 3px 6px; text-align: left;">Parameter</th>
                  <th style="padding: 3px 6px; text-align: right;">Result</th>
                  <th style="padding: 3px 2px; text-align: center;">Flag</th>
                  <th style="padding: 3px 4px; text-align: left;">Unit</th>
                  <th style="padding: 3px 6px; text-align: right;">Ref. Range</th>
                </tr>
              </thead>
              <tbody>
                ${hasWbc ? `
                ${renderMindray5Row('WBC', parsed.wbc, '10^9/L', 4.0, 10.0)}
                ${renderMindray5Row('Neu#', parsed.neutrophilsAbs, '10^9/L', 2.0, 7.0)}
                ${renderMindray5Row('Lym#', parsed.lymphocytesAbs, '10^9/L', 0.8, 4.0)}
                ${renderMindray5Row('Mon#', parsed.monocytesAbs, '10^9/L', 0.12, 1.2)}
                ${renderMindray5Row('Eos#', parsed.eosinophilsAbs, '10^9/L', 0.02, 0.5)}
                ${renderMindray5Row('Bas#', parsed.basophilsAbs, '10^9/L', 0.0, 0.1)}
                ${renderMindray5Row('Neu%', parsed.neutrophils, '%', 40.0, 75.0)}
                ${renderMindray5Row('Lym%', parsed.lymphocytes, '%', 20.0, 45.0)}
                ${renderMindray5Row('Mon%', parsed.monocytes, '%', 2.0, 10.0)}
                ${renderMindray5Row('Eos%', parsed.eosinophils, '%', 0.5, 6.0)}
                ${renderMindray5Row('Bas%', parsed.basophils, '%', 0.0, 1.0)}
                ` : ''}
                ${hasRbc ? `
                <tr style="background:#f8fafc;">${renderMindray5Row('RBC', parsed.rbc, '10^12/L', 3.50, 5.50)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('HGB', parsed.hgb, 'g/dL', 11.0, 16.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('HCT', parsed.hct, '%', 36.0, 50.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('MCV', parsed.mcv, 'fL', 80.0, 100.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('MCH', parsed.mch, 'pg', 27.0, 34.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('MCHC', parsed.mchc, 'g/dL', 32.0, 36.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('RDW-CV', parsed.rdw, '%', 11.0, 16.0)}</tr>
                <tr style="background:#f8fafc;">${renderMindray5Row('RDW-SD', parsed.rdwSd, 'fL', 35.0, 56.0)}</tr>
                ` : ''}
                ${hasPlt ? `
                ${renderMindray5Row('PLT', parsed.plt, '10^9/L', 100, 300)}
                ${renderMindray5Row('MPV', parsed.mpv, 'fL', 6.5, 12.0)}
                ${renderMindray5Row('PDW', parsed.pdwSd !== '-' ? parsed.pdwSd : parsed.pdw, 'fL', 9.0, 17.0)}
                ${renderMindray5Row('PCT', parsed.pct, '%', 0.108, 0.282)}
                ` : ''}
              </tbody>
            </table>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${hasWbc ? `
            <!-- Laser 2D Scattergram -->
            <div style="background:#ffffff; border:1px solid #7c3aed; border-radius:6px; padding:6px 8px;">
              <div style="display:flex; justify-content:space-between; font-size:9.5px; font-weight:800; color:#6d28d9; margin-bottom:2px;">
                <span>DIFF SCATTERGRAM</span>
                <span>SEMICONDUCTOR LASER</span>
              </div>
              <svg width="100%" height="95" viewBox="0 0 240 95" style="background:#f8fafc; border:1px solid #ddd6fe; border-radius:4px; display:block;">
                <line x1="20" y1="10" x2="20" y2="78" stroke="#94a3b8" stroke-width="1"/>
                <line x1="20" y1="78" x2="230" y2="78" stroke="#94a3b8" stroke-width="1"/>
                <ellipse cx="140" cy="40" rx="26" ry="16" fill="rgba(37, 99, 235, 0.45)"/>
                <ellipse cx="65" cy="65" rx="18" ry="14" fill="rgba(22, 163, 74, 0.5)"/>
                <ellipse cx="85" cy="45" rx="15" ry="12" fill="rgba(147, 51, 234, 0.5)"/>
                <ellipse cx="175" cy="25" rx="14" ry="10" fill="rgba(220, 38, 38, 0.55)"/>
                <ellipse cx="50" cy="72" rx="10" ry="7" fill="rgba(234, 88, 12, 0.5)"/>
              </svg>
              <div style="display:flex; gap:6px; font-size:8px; margin-top:2px; justify-content:center; color:#334155; font-weight:700;">
                <span style="color:#2563eb;">■ Neu</span>
                <span style="color:#16a34a;">■ Lym</span>
                <span style="color:#9333ea;">■ Mon</span>
                <span style="color:#dc2626;">■ Eos</span>
                <span style="color:#ea580c;">■ Bas</span>
              </div>
            </div>` : ''}
            ${hasRbc ? generateHistogramSvg('RBC', (cbc as any).rbcCurve, 260, 75) : ''}
            ${hasPlt ? generateHistogramSvg('PLT', (cbc as any).pltCurve, 260, 75) : ''}
            ${mentzerHtml}
          </div>
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 4. SYSMEX_3PART (Sysmex XP-300 / KX-21N Standard)
  // =========================================================================
  if (layout === 'SYSMEX_3PART') {
    const renderSysmexRow = (param: string, val: string, unit: string, low: number, high: number) => {
      const f = evalFlag(val, low, high);
      const flagStr = f.isHigh ? '<span style="color:#dc2626; font-weight:900;">+</span>' : f.isLow ? '<span style="color:#2563eb; font-weight:900;">-</span>' : '';
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: ${specialFormFontSize}px; font-family: 'Consolas', monospace;">
          <td style="padding: 2.5px 6px; font-weight: 700; color: #0f172a;">${param}</td>
          <td style="padding: 2.5px 6px; text-align: right; font-weight: 800; color: #0f172a;">${f.hasVal ? escapeHtml(val) : '-'}</td>
          <td style="padding: 2.5px 4px; text-align: center; width: 22px;">${flagStr}</td>
          <td style="padding: 2.5px 6px; color: #64748b; font-size: 11px;">${unit}</td>
          <td style="padding: 2.5px 6px; text-align: right; color: #334155; font-size: 11px;"><span dir="ltr" style="unicode-bidi:isolate;">[ ${low} - ${high} ]</span></td>
        </tr>
      `;
    };

    return `
      <div style="border: 2px solid #1e3a8a; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: #ffffff;" dir="ltr">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); color: #ffffff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 900; font-size: ${specialFormFontSize + 1}px;">SYSMEX AUTOMATED HEMATOLOGY ANALYZER REPORT (XP-300 / KX-21N)</span>
          <span style="font-size: 10px; background: rgba(255,255,255,0.18); padding: 2px 8px; border-radius: 4px; font-family: monospace;">Sysmex Corporation</span>
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; padding: 12px;">
          <div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #eff6ff; color: #1e3a8a; font-size: 10px; font-weight: 800; border-bottom: 1px solid #bfdbfe;">
                  <th style="padding: 4px 6px; text-align: left;">Item</th>
                  <th style="padding: 4px 6px; text-align: right;">Result</th>
                  <th style="padding: 4px 4px; text-align: center;">Flag</th>
                  <th style="padding: 4px 6px; text-align: left;">Unit</th>
                  <th style="padding: 4px 6px; text-align: right;">Normal Range</th>
                </tr>
              </thead>
              <tbody>
                ${hasWbc ? `
                ${renderSysmexRow('WBC', parsed.wbc, '10^3/uL', 4.0, 10.0)}
                ${renderSysmexRow('LYM%', parsed.lymPct, '%', 15.0, 45.0)}
                ${renderSysmexRow('MXD%', parsed.midPct, '%', 2.0, 15.0)}
                ${renderSysmexRow('NEUT%', parsed.graPct, '%', 40.0, 75.0)}
                ${renderSysmexRow('LYM#', parsed.lymAbs, '10^3/uL', 0.8, 4.0)}
                ${renderSysmexRow('MXD#', parsed.midAbs, '10^3/uL', 0.1, 1.5)}
                ${renderSysmexRow('NEUT#', parsed.graAbs, '10^3/uL', 2.0, 7.0)}
                ` : ''}
                ${hasRbc ? `
                ${renderSysmexRow('RBC', parsed.rbc, '10^6/uL', 3.8, 5.8)}
                ${renderSysmexRow('HGB', parsed.hgb, 'g/dL', 11.5, 17.5)}
                ${renderSysmexRow('HCT', parsed.hct, '%', 35.0, 50.0)}
                ${renderSysmexRow('MCV', parsed.mcv, 'fL', 80.0, 100.0)}
                ${renderSysmexRow('MCH', parsed.mch, 'pg', 27.0, 34.0)}
                ${renderSysmexRow('MCHC', parsed.mchc, 'g/dL', 32.0, 36.0)}
                ${renderSysmexRow('RDW-SD', parsed.rdwSd, 'fL', 35.0, 56.0)}
                ${renderSysmexRow('RDW-CV', parsed.rdw, '%', 11.0, 16.0)}
                ` : ''}
                ${hasPlt ? `
                ${renderSysmexRow('PLT', parsed.plt, '10^3/uL', 150, 450)}
                ${renderSysmexRow('PDW', parsed.pdwSd !== '-' ? parsed.pdwSd : parsed.pdw, 'fL', 9.0, 17.0)}
                ${renderSysmexRow('MPV', parsed.mpv, 'fL', 6.5, 12.0)}
                ${renderSysmexRow('P-LCR', parsed.plcr, '%', 11.0, 45.0)}
                ${renderSysmexRow('PCT', parsed.pct, '%', 0.108, 0.282)}
                ` : ''}
              </tbody>
            </table>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${hasWbc ? generateHistogramSvg('WBC', (cbc as any).wbcCurve, 260, 90) : ''}
            ${hasRbc ? generateHistogramSvg('RBC', (cbc as any).rbcCurve, 260, 90) : ''}
            ${hasPlt ? generateHistogramSvg('PLT', (cbc as any).pltCurve, 260, 90) : ''}
          </div>
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 3. WITH_HISTOGRAMS (Visual Range Bars + Side-by-Side Histograms)
  // =========================================================================
  if (layout === 'WITH_HISTOGRAMS') {
    const renderBarRow = (label: string, val: string, unit: string, low: number, high: number, refStr: string) => {
      const f = evalFlag(val, low, high);
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: ${specialFormFontSize}px;">
          <td style="padding: 4px 8px; font-weight: 700; color: #1e293b;">${label}</td>
          <td style="padding: 4px 8px; font-weight: 900; color: ${f.color};">${f.hasVal ? `${escapeHtml(val)} ${f.arrow}` : '-'}</td>
          <td style="padding: 4px 6px; color: #64748b; font-size: 11px;">${unit}</td>
          <td style="padding: 4px 8px; font-family: monospace; font-size: 11px; color: #334155;">${refStr}</td>
          <td style="padding: 4px 8px; text-align: center;">${buildRangeBarHtml(val, low, high, 85)}</td>
        </tr>
      `;
    };

    return `
      <div style="background: linear-gradient(90deg, ${headerBgColor || '#0d9488'} 0%, #0284c7 100%); color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
        <span>COMPLETE BLOOD COUNT (VISUAL SPECTRUM &amp; HISTOGRAMS)</span>
        <span style="font-size: 10px; opacity: 0.9;">GRAPHIC HEMATOLOGY PANEL</span>
      </div>

      <div style="display: grid; grid-template-columns: 1.55fr 0.95fr; gap: 12px; margin-bottom: 12px;" dir="ltr">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; font-size: 10.5px; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 5px 8px;">PARAMETER</th>
                <th style="padding: 5px 8px;">RESULT</th>
                <th style="padding: 5px 6px;">UNIT</th>
                <th style="padding: 5px 8px;">REF. RANGE</th>
                <th style="padding: 5px 8px; text-align: center;">SPECTRUM</th>
              </tr>
            </thead>
            <tbody>
              ${renderBarRow('WBC (Leukocytes)', parsed.wbc, '10^9/L', 4.0, 11.0, '4.0 - 11.0')}
              ${renderBarRow('RBC (Erythrocytes)', parsed.rbc, '10^12/L', rbcLow, rbcHigh, rbcRef)}
              ${renderBarRow('HGB (Hemoglobin)', parsed.hgb, 'g/dL', hgbLow, hgbHigh, hgbRef)}
              ${renderBarRow('HCT (Hematocrit)', parsed.hct, '%', hctLow, hctHigh, hctRef)}
              ${renderBarRow('MCV', parsed.mcv, 'fL', 75.0, 100.0, '75.0 - 100.0')}
              ${renderBarRow('MCH', parsed.mch, 'pg', 25.0, 35.0, '25.0 - 35.0')}
              ${renderBarRow('MCHC', parsed.mchc, 'g/dL', 31.0, 38.0, '31.0 - 38.0')}
              ${renderBarRow('RDW-CV', parsed.rdw, '%', 11.0, 16.0, '11.0 - 16.0')}
              ${renderBarRow('PLT (Platelets)', parsed.plt, '10^9/L', 150, 450, '150 - 450')}
              ${renderBarRow('MPV', parsed.mpv, 'fL', 6.5, 11.0, '6.5 - 11.0')}
              ${renderBarRow('Neutrophils / GRA%', parsed.neutrophils !== '-' ? parsed.neutrophils : parsed.graPct, '%', 40.0, 75.0, '40.0 - 75.0')}
              ${renderBarRow('Lymphocytes / LYM%', parsed.lymphocytes !== '-' ? parsed.lymphocytes : parsed.lymPct, '%', 20.0, 45.0, '20.0 - 45.0')}
              ${renderBarRow('Monocytes / MID%', parsed.monocytes !== '-' ? parsed.monocytes : parsed.midPct, '%', 2.0, 10.0, '2.0 - 10.0')}
              ${renderBarRow('Eosinophils', parsed.eosinophils, '%', 1.0, 6.0, '1.0 - 6.0')}
              ${renderBarRow('Basophils', parsed.basophils, '%', 0.0, 1.0, '0.0 - 1.0')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${generateHistogramSvg('WBC', (cbc as any).wbcCurve, 230, 82)}
          ${generateHistogramSvg('RBC', (cbc as any).rbcCurve, 230, 82)}
          ${generateHistogramSvg('PLT', (cbc as any).pltCurve, 230, 82)}
          ${mentzerHtml}
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 4. COMPACT_GRID (Ultra-Compact 2-Column Space-Saver for Shared Pages)
  // =========================================================================
  if (layout === 'COMPACT_GRID') {
    const renderCompactRow = (label: string, val: string, unit: string, low: number, high: number, refStr: string) => {
      const f = evalFlag(val, low, high);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: ${Math.max(10, specialFormFontSize - 1)}px;">
          <td style="padding: 3px 6px; font-weight: 700; color: #0f172a;">${label}</td>
          <td style="padding: 3px 6px; font-weight: 900; color: ${f.color};">${f.hasVal ? `${escapeHtml(val)} ${f.analyzerArrow}` : '-'}</td>
          <td style="padding: 3px 4px; color: #64748b; font-size: 9.5px;">${unit}</td>
          <td style="padding: 3px 6px; color: #475569; font-size: 9.5px; font-family: monospace;">${refStr}</td>
        </tr>
      `;
    };

    return `
      <div style="border: 1.5px solid #334155; border-radius: 6px; overflow: hidden; margin-bottom: 10px;" dir="ltr">
        <div style="background: ${headerBgColor || '#334155'}; color: #ffffff; padding: 5px 12px; font-weight: 800; font-size: ${specialFormFontSize}px; display: flex; justify-content: space-between; align-items: center;">
          <span>COMPLETE BLOOD COUNT (COMPACT CLINICAL SUMMARY)</span>
          <span style="font-size: 9.5px; opacity: 0.9;">CBC / FBC</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; border-right: 1px solid #cbd5e1;">
            <thead>
              <tr style="background: #f8fafc; font-size: 9.5px; color: #475569; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 3px 6px; text-align: left;">RBC &amp; PLATELETS</th>
                <th style="padding: 3px 6px; text-align: left;">RESULT</th>
                <th style="padding: 3px 4px; text-align: left;">UNIT</th>
                <th style="padding: 3px 6px; text-align: left;">REF</th>
              </tr>
            </thead>
            <tbody>
              ${renderCompactRow('RBC', parsed.rbc, '10^12/L', rbcLow, rbcHigh, rbcRef)}
              ${renderCompactRow('HGB', parsed.hgb, 'g/dL', hgbLow, hgbHigh, hgbRef)}
              ${renderCompactRow('HCT', parsed.hct, '%', hctLow, hctHigh, hctRef)}
              ${renderCompactRow('MCV', parsed.mcv, 'fL', 75.0, 100.0, '75-100')}
              ${renderCompactRow('MCH', parsed.mch, 'pg', 25.0, 35.0, '25-35')}
              ${renderCompactRow('MCHC', parsed.mchc, 'g/dL', 31.0, 38.0, '31-38')}
              ${renderCompactRow('RDW%', parsed.rdw, '%', 11.0, 16.0, '11-16')}
              ${renderCompactRow('PLT', parsed.plt, '10^9/L', 150, 450, '150-450')}
              ${renderCompactRow('MPV / PCT', `${parsed.mpv} / ${parsed.pct}`, 'fL / %', 6.5, 11.0, '6.5-11.0')}
            </tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; font-size: 9.5px; color: #475569; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 3px 6px; text-align: left;">WBC &amp; DIFFERENTIAL</th>
                <th style="padding: 3px 6px; text-align: left;">RESULT</th>
                <th style="padding: 3px 4px; text-align: left;">UNIT</th>
                <th style="padding: 3px 6px; text-align: left;">REF</th>
              </tr>
            </thead>
            <tbody>
              ${renderCompactRow('Total WBC', parsed.wbc, '10^9/L', 4.0, 11.0, '4.0-11.0')}
              ${renderCompactRow('GRA% / Neut%', parsed.graPct !== '-' ? parsed.graPct : parsed.neutrophils, '%', 35.0, 80.0, '35-80')}
              ${renderCompactRow('GRA# / Neut#', parsed.graAbs !== '-' ? parsed.graAbs : parsed.neutrophilsAbs, '10^9/L', 1.2, 8.0, '1.2-8.0')}
              ${renderCompactRow('LYM% / Lymph%', parsed.lymPct !== '-' ? parsed.lymPct : parsed.lymphocytes, '%', 15.0, 50.0, '15-50')}
              ${renderCompactRow('LYM# / Lymph#', parsed.lymAbs !== '-' ? parsed.lymAbs : parsed.lymphocytesAbs, '10^9/L', 0.9, 5.0, '0.9-5.0')}
              ${renderCompactRow('MID% / Mono%', parsed.midPct !== '-' ? parsed.midPct : parsed.monocytes, '%', 2.0, 15.0, '2-15')}
              ${renderCompactRow('MID# / Mono#', parsed.midAbs !== '-' ? parsed.midAbs : parsed.monocytesAbs, '10^9/L', 0.1, 1.5, '0.1-1.5')}
              ${renderCompactRow('Eosinophils', parsed.eosinophils, '%', 1.0, 6.0, '1-6')}
              ${renderCompactRow('Basophils', parsed.basophils, '%', 0.0, 1.0, '0-1')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. DUAL_COLUMN (Balanced Dual-Column Clinical Table with 3-Part & 5-Part)
  // =========================================================================
  if (layout === 'DUAL_COLUMN') {
    return `
      <div style="background: ${headerBgColor || '#1e3a8a'}; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
        <span>HEMATOLOGY PANEL — DUAL-COLUMN COMPLETE BLOOD COUNT</span>
        <span style="font-size: 10px; opacity: 0.9;">3-PART &amp; 5-PART DIFFERENTIAL</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;" dir="ltr">
        <div style="border: 1.5px solid #cbd5e1; border-top: 4px solid #be123c; border-radius: 6px; overflow: hidden;">
          <div style="background: #fff1f2; padding: 6px 10px; font-weight: 800; color: #9f1239; font-size: ${specialFormFontSize}px; border-bottom: 1px solid #fecdd3;">
            RED BLOOD CELLS &amp; THROMBOCYTES
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${renderCbcRow('RBC Count', parsed.rbc, '10^12/L', '3.50 - 5.50', 3.5, 5.5, priorCbcParsed?.rbc)}
              ${renderCbcRow('Hemoglobin (HGB)', parsed.hgb, 'g/dL', '11.5 - 16.5', 11.5, 16.5, priorCbcParsed?.hgb)}
              ${renderCbcRow('Hematocrit (HCT)', parsed.hct, '%', '35.0 - 55.0', 35.0, 55.0, priorCbcParsed?.hct)}
              ${renderCbcRow('MCV', parsed.mcv, 'fL', '75.0 - 100.0', 75.0, 100.0, priorCbcParsed?.mcv)}
              ${renderCbcRow('MCH', parsed.mch, 'pg', '25.0 - 35.0', 25.0, 35.0, priorCbcParsed?.mch)}
              ${renderCbcRow('MCHC', parsed.mchc, 'g/dL', '31.0 - 38.0', 31.0, 38.0, priorCbcParsed?.mchc)}
              ${renderCbcRow('RDW-CV (RDW%)', parsed.rdw, '%', '11.0 - 16.0', 11.0, 16.0, priorCbcParsed?.rdw)}
              ${parsed.rdwSd !== '-' ? renderCbcRow('RDW-SD (RDWa)', parsed.rdwSd, 'fL', '35.0 - 56.0', 35.0, 56.0) : ''}
              ${renderCbcRow('Platelets (PLT)', parsed.plt, '10^9/L', '150 - 450', 150, 450, priorCbcParsed?.plt)}
              ${renderCbcRow('MPV', parsed.mpv, 'fL', '6.5 - 11.0', 6.5, 11.0, priorCbcParsed?.mpv)}
              ${renderCbcRow('PCT', parsed.pct, '%', '0.15 - 0.40', 0.15, 0.40, priorCbcParsed?.pct)}
              ${renderCbcRow('PDW%', parsed.pdw, '%', '9.0 - 17.0', 9.0, 17.0, priorCbcParsed?.pdw)}
            </tbody>
          </table>
        </div>

        <div style="border: 1.5px solid #cbd5e1; border-top: 4px solid #1e3a8a; border-radius: 6px; overflow: hidden;">
          <div style="background: #eff6ff; padding: 6px 10px; font-weight: 800; color: #1e3a8a; font-size: ${specialFormFontSize}px; border-bottom: 1px solid #bfdbfe;">
            LEUKOCYTES (WBC) &amp; DIFFERENTIAL
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${renderCbcRow('Total WBC', parsed.wbc, '10^9/L', '4.0 - 11.0', 4.0, 11.0, priorCbcParsed?.wbc)}
              ${renderDiffRow('GRA% (Granulocytes)', parsed.graPct, '35.0 - 80.0 %', 35.0, 80.0, wbcNum, undefined, parsed.graAbs)}
              ${renderDiffRow('LYM% (Lymphocytes)', parsed.lymPct, '15.0 - 50.0 %', 15.0, 50.0, wbcNum, undefined, parsed.lymAbs)}
              ${renderDiffRow('MID% (Mid-Size Cells)', parsed.midPct, '2.0 - 15.0 %', 2.0, 15.0, wbcNum, undefined, parsed.midAbs)}
              ${renderDiffRow('Neutrophils', parsed.neutrophils, '40.0 - 75.0 %', 40.0, 75.0, wbcNum, priorCbcParsed?.neutrophils, parsed.neutrophilsAbs)}
              ${renderDiffRow('Eosinophils', parsed.eosinophils, '1.0 - 6.0 %', 1.0, 6.0, wbcNum, priorCbcParsed?.eosinophils, parsed.eosinophilsAbs)}
              ${renderDiffRow('Basophils', parsed.basophils, '0.0 - 1.0 %', 0.0, 1.0, wbcNum, priorCbcParsed?.basophils, parsed.basophilsAbs)}
            </tbody>
          </table>
          ${mentzerHtml ? `<div style="padding: 8px;">${mentzerHtml}</div>` : ''}
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 6. PEDIATRIC_CARDS (Soft Rounded Cards for Pediatric & Family Care)
  // =========================================================================
  if (layout === 'PEDIATRIC_CARDS') {
    const renderCardItem = (label: string, val: string, unit: string, low: number, high: number, refStr: string) => {
      const f = evalFlag(val, low, high);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; background: #ffffff; border-radius: 8px; border: 1px solid ${f.isAbnormal ? '#fca5a5' : '#e2e8f0'}; margin-bottom: 5px;">
          <div>
            <strong style="font-size: ${specialFormFontSize}px; color: #1e293b;">${label}</strong>
            <span style="display: block; font-size: 9.5px; color: #64748b;">Normal: ${refStr} ${unit}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: ${specialFormFontSize + 1}px; font-weight: 900; color: ${f.color};">${f.hasVal ? `${escapeHtml(val)} ${f.analyzerArrow}` : '-'}</span>
            <span style="font-size: 10px; color: #64748b; display: block;">${unit}</span>
          </div>
        </div>
      `;
    };

    return `
      <div style="background: linear-gradient(135deg, ${headerBgColor || '#ea580c'} 0%, #0284c7 100%); color: #ffffff; padding: 10px 16px; border-radius: 12px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
        <span>PEDIATRIC &amp; FAMILY COMPLETE BLOOD COUNT (CBC)</span>
        <span style="font-size: 10.5px; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 999px;">GENTLE CARE REPORT</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;" dir="ltr">
        <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 12px; padding: 10px;">
          <div style="font-weight: 900; color: #be123c; font-size: ${specialFormFontSize}px; margin-bottom: 8px;">🔴 RED CELLS &amp; HEMOGLOBIN</div>
          ${renderCardItem('RBC Count', parsed.rbc, '10^12/L', rbcLow, rbcHigh, rbcRef)}
          ${renderCardItem('Hemoglobin (HGB)', parsed.hgb, 'g/dL', hgbLow, hgbHigh, hgbRef)}
          ${renderCardItem('Hematocrit (HCT)', parsed.hct, '%', hctLow, hctHigh, hctRef)}
          ${renderCardItem('MCV', parsed.mcv, 'fL', 75, 100, '75 - 100')}
          ${renderCardItem('MCH', parsed.mch, 'pg', 25, 35, '25 - 35')}
          ${renderCardItem('MCHC', parsed.mchc, 'g/dL', 31, 38, '31 - 38')}
          ${renderCardItem('RDW%', parsed.rdw, '%', 11, 16, '11 - 16')}
        </div>

        <div style="background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 10px;">
          <div style="font-weight: 900; color: #0369a1; font-size: ${specialFormFontSize}px; margin-bottom: 8px;">🛡️ IMMUNE &amp; WHITE CELLS</div>
          ${renderCardItem('Total WBC', parsed.wbc, '10^9/L', 4.0, 11.0, '4.0 - 11.0')}
          ${renderCardItem('GRA% (Granulocytes)', parsed.graPct, '%', 35, 80, '35 - 80')}
          ${renderCardItem('LYM% (Lymphocytes)', parsed.lymPct, '%', 15, 50, '15 - 50')}
          ${renderCardItem('MID% (Monocytes)', parsed.midPct, '%', 2, 15, '2 - 15')}
          ${renderCardItem('GRA# (Absolute)', parsed.graAbs, '10^9/L', 1.2, 8.0, '1.2 - 8.0')}
          ${renderCardItem('LYM# (Absolute)', parsed.lymAbs, '10^9/L', 0.9, 5.0, '0.9 - 5.0')}
          ${renderCardItem('MID# (Absolute)', parsed.midAbs, '10^9/L', 0.1, 1.5, '0.1 - 1.5')}
        </div>

        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 10px;">
          <div style="font-weight: 900; color: #b45309; font-size: ${specialFormFontSize}px; margin-bottom: 8px;">🟡 PLATELETS &amp; CLOTTING</div>
          ${renderCardItem('Platelets (PLT)', parsed.plt, '10^9/L', 150, 450, '150 - 450')}
          ${renderCardItem('MPV', parsed.mpv, 'fL', 6.5, 11.0, '6.5 - 11.0')}
          ${renderCardItem('PCT', parsed.pct, '%', 0.15, 0.40, '0.15 - 0.40')}
          ${renderCardItem('PDW%', parsed.pdw, '%', 9.0, 17.0, '9.0 - 17.0')}
          ${parsed.plcr !== '-' ? renderCardItem('P-LCR', parsed.plcr, '%', 13, 43, '13 - 43') : ''}
          ${parsed.plcc !== '-' ? renderCardItem('P-LCC', parsed.plcc, '10^9/L', 30, 90, '30 - 90') : ''}
          ${mentzerHtml}
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 7. CLINICAL_MINIMAL (Pure Laser B&W Ink-Saver Executive Table)
  // =========================================================================
  if (layout === 'CLINICAL_MINIMAL') {
    const renderMinRow = (label: string, val: string, unit: string, low: number, high: number, refStr: string) => {
      const f = evalFlag(val, low, high);
      return `
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: ${specialFormFontSize}px;">
          <td style="padding: 4px 8px; font-weight: ${f.isAbnormal ? 900 : 600}; color: #000000;">${label}</td>
          <td style="padding: 4px 8px; font-weight: ${f.isAbnormal ? 900 : 700}; color: #000000; text-decoration: ${f.isAbnormal ? 'underline' : 'none'};">
            ${f.hasVal ? `${escapeHtml(val)} ${f.analyzerArrow}` : '-'}
          </td>
          <td style="padding: 4px 6px; color: #000000; font-size: 11px;">${unit}</td>
          <td style="padding: 4px 8px; color: #000000; font-family: monospace; font-size: 11px;">${refStr}</td>
        </tr>
      `;
    };

    return `
      <div style="border-top: 2.5px solid #000000; border-bottom: 2.5px solid #000000; padding: 6px 4px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: ${specialFormFontSize + 1}px; color: #000000;" dir="ltr">
        <span>COMPLETE BLOOD COUNT (EXECUTIVE CLINICAL REPORT)</span>
        <span style="font-size: 10.5px; font-family: monospace;">LASER MONOCHROME STANDARD</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;" dir="ltr">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000;">
          <thead>
            <tr style="border-bottom: 1.5px solid #000000; font-size: 10.5px; color: #000000;">
              <th style="padding: 5px 8px; text-align: left;">ERYTHROID &amp; PLATELETS</th>
              <th style="padding: 5px 8px; text-align: left;">RESULT</th>
              <th style="padding: 5px 6px; text-align: left;">UNIT</th>
              <th style="padding: 5px 8px; text-align: left;">REF. RANGE</th>
            </tr>
          </thead>
          <tbody>
            ${renderMinRow('RBC', parsed.rbc, '10^12/L', 3.5, 5.5, '3.50 - 5.50')}
            ${renderMinRow('HGB', parsed.hgb, 'g/dL', 11.5, 16.5, '11.5 - 16.5')}
            ${renderMinRow('HCT', parsed.hct, '%', 35.0, 55.0, '35.0 - 55.0')}
            ${renderMinRow('MCV', parsed.mcv, 'fL', 75.0, 100.0, '75.0 - 100.0')}
            ${renderMinRow('MCH', parsed.mch, 'pg', 25.0, 35.0, '25.0 - 35.0')}
            ${renderMinRow('MCHC', parsed.mchc, 'g/dL', 31.0, 38.0, '31.0 - 38.0')}
            ${renderMinRow('RDW%', parsed.rdw, '%', 11.0, 16.0, '11.0 - 16.0')}
            ${renderMinRow('RDWa', parsed.rdwSd, 'fL', 35.0, 56.0, '35.0 - 56.0')}
            ${renderMinRow('PLT', parsed.plt, '10^9/L', 150, 450, '150 - 450')}
            ${renderMinRow('MPV', parsed.mpv, 'fL', 6.5, 11.0, '6.5 - 11.0')}
            ${renderMinRow('PCT', parsed.pct, '%', 0.15, 0.40, '0.15 - 0.40')}
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000;">
          <thead>
            <tr style="border-bottom: 1.5px solid #000000; font-size: 10.5px; color: #000000;">
              <th style="padding: 5px 8px; text-align: left;">LEUKOCYTES &amp; DIFFERENTIAL</th>
              <th style="padding: 5px 8px; text-align: left;">RESULT</th>
              <th style="padding: 5px 6px; text-align: left;">UNIT</th>
              <th style="padding: 5px 8px; text-align: left;">REF. RANGE</th>
            </tr>
          </thead>
          <tbody>
            ${renderMinRow('WBC', parsed.wbc, '10^9/L', 4.0, 11.0, '4.0 - 11.0')}
            ${renderMinRow('GRA%', parsed.graPct, '%', 35.0, 80.0, '35.0 - 80.0')}
            ${renderMinRow('GRA#', parsed.graAbs, '10^9/L', 1.2, 8.0, '1.2 - 8.0')}
            ${renderMinRow('LYM%', parsed.lymPct, '%', 15.0, 50.0, '15.0 - 50.0')}
            ${renderMinRow('LYM#', parsed.lymAbs, '10^9/L', 0.9, 5.0, '0.9 - 5.0')}
            ${renderMinRow('MID%', parsed.midPct, '%', 2.0, 15.0, '2.0 - 15.0')}
            ${renderMinRow('MID#', parsed.midAbs, '10^9/L', 0.1, 1.5, '0.1 - 1.5')}
            ${renderMinRow('PDW%', parsed.pdw, '%', 9.0, 17.0, '9.0 - 17.0')}
            ${renderMinRow('PDWa', parsed.pdwSd, 'fL', 9.0, 17.0, '9.0 - 17.0')}
            ${renderMinRow('P-LCR', parsed.plcr, '%', 13.0, 43.0, '13.0 - 43.0')}
            ${renderMinRow('P-LCC', parsed.plcc, '10^9/L', 30, 90, '30 - 90')}
          </tbody>
        </table>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 8. REFERENCE_BANDS (Full-Width Linear Spectrum Track Per Parameter)
  // =========================================================================
  if (layout === 'REFERENCE_BANDS') {
    const renderBandRow = (label: string, val: string, unit: string, low: number, high: number, refStr: string) => {
      const f = evalFlag(val, low, high);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: ${specialFormFontSize}px;">
          <td style="padding: 5px 10px; font-weight: 700; color: #0f172a;">${label}</td>
          <td style="padding: 5px 10px; font-weight: 900; color: ${f.color};">${f.hasVal ? `${escapeHtml(val)} ${f.analyzerArrow}` : '-'}</td>
          <td style="padding: 5px 8px; color: #64748b;">${unit}</td>
          <td style="padding: 5px 10px; font-family: monospace; color: #334155;">${refStr}</td>
          <td style="padding: 5px 12px; width: 170px;">${buildRangeBarHtml(val, low, high, 145)}</td>
        </tr>
      `;
    };

    return `
      <div style="background: ${headerBgColor || '#4338ca'}; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
        <span>COMPLETE BLOOD COUNT — VISUAL REFERENCE BANDS</span>
        <span style="font-size: 10px; opacity: 0.9;">LINEAR SPECTRUM TRACKING</span>
      </div>
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px;" dir="ltr">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; font-size: 10.5px; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 6px 10px;">INVESTIGATION</th>
              <th style="padding: 6px 10px;">RESULT</th>
              <th style="padding: 6px 8px;">UNIT</th>
              <th style="padding: 6px 10px;">REFERENCE INTERVAL</th>
              <th style="padding: 6px 12px;">VISUAL RANGE POSITION</th>
            </tr>
          </thead>
          <tbody>
            ${renderBandRow('WBC (Leukocytes)', parsed.wbc, '10^9/L', 4.0, 11.0, '4.0 - 11.0')}
            ${renderBandRow('GRA% (Granulocytes %)', parsed.graPct, '%', 35.0, 80.0, '35.0 - 80.0')}
            ${renderBandRow('LYM% (Lymphocytes %)', parsed.lymPct, '%', 15.0, 50.0, '15.0 - 50.0')}
            ${renderBandRow('MID% (Monocytes %)', parsed.midPct, '%', 2.0, 15.0, '2.0 - 15.0')}
            ${renderBandRow('RBC (Erythrocytes)', parsed.rbc, '10^12/L', 3.5, 5.5, '3.50 - 5.50')}
            ${renderBandRow('HGB (Hemoglobin)', parsed.hgb, 'g/dL', 11.5, 16.5, '11.5 - 16.5')}
            ${renderBandRow('HCT (Hematocrit)', parsed.hct, '%', 35.0, 55.0, '35.0 - 55.0')}
            ${renderBandRow('MCV', parsed.mcv, 'fL', 75.0, 100.0, '75.0 - 100.0')}
            ${renderBandRow('MCH', parsed.mch, 'pg', 25.0, 35.0, '25.0 - 35.0')}
            ${renderBandRow('MCHC', parsed.mchc, 'g/dL', 31.0, 38.0, '31.0 - 38.0')}
            ${renderBandRow('RDW%', parsed.rdw, '%', 11.0, 16.0, '11.0 - 16.0')}
            ${renderBandRow('PLT (Platelets)', parsed.plt, '10^9/L', 150, 450, '150 - 450')}
            ${renderBandRow('MPV', parsed.mpv, 'fL', 6.5, 11.0, '6.5 - 11.0')}
            ${renderBandRow('PCT', parsed.pct, '%', 0.15, 0.40, '0.15 - 0.40')}
          </tbody>
        </table>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 9. FLAG_FOCUS (Highlights Abnormal H/L Findings + Top Flag Summary)
  // =========================================================================
  if (layout === 'FLAG_FOCUS') {
    const items = [
      { label: 'WBC', val: parsed.wbc, unit: '10^9/L', low: 4.0, high: 11.0, ref: '4.0 - 11.0' },
      { label: 'GRA%', val: parsed.graPct, unit: '%', low: 35.0, high: 80.0, ref: '35.0 - 80.0' },
      { label: 'GRA#', val: parsed.graAbs, unit: '10^9/L', low: 1.2, high: 8.0, ref: '1.2 - 8.0' },
      { label: 'LYM%', val: parsed.lymPct, unit: '%', low: 15.0, high: 50.0, ref: '15.0 - 50.0' },
      { label: 'LYM#', val: parsed.lymAbs, unit: '10^9/L', low: 0.9, high: 5.0, ref: '0.9 - 5.0' },
      { label: 'MID%', val: parsed.midPct, unit: '%', low: 2.0, high: 15.0, ref: '2.0 - 15.0' },
      { label: 'MID#', val: parsed.midAbs, unit: '10^9/L', low: 0.1, high: 1.5, ref: '0.1 - 1.5' },
      { label: 'RBC', val: parsed.rbc, unit: '10^12/L', low: 3.5, high: 5.5, ref: '3.50 - 5.50' },
      { label: 'HGB', val: parsed.hgb, unit: 'g/dL', low: 11.5, high: 16.5, ref: '11.5 - 16.5' },
      { label: 'HCT', val: parsed.hct, unit: '%', low: 35.0, high: 55.0, ref: '35.0 - 55.0' },
      { label: 'MCV', val: parsed.mcv, unit: 'fL', low: 75.0, high: 100.0, ref: '75.0 - 100.0' },
      { label: 'MCH', val: parsed.mch, unit: 'pg', low: 25.0, high: 35.0, ref: '25.0 - 35.0' },
      { label: 'MCHC', val: parsed.mchc, unit: 'g/dL', low: 31.0, high: 38.0, ref: '31.0 - 38.0' },
      { label: 'RDW%', val: parsed.rdw, unit: '%', low: 11.0, high: 16.0, ref: '11.0 - 16.0' },
      { label: 'PLT', val: parsed.plt, unit: '10^9/L', low: 150, high: 450, ref: '150 - 450' },
      { label: 'MPV', val: parsed.mpv, unit: 'fL', low: 6.5, high: 11.0, ref: '6.5 - 11.0' },
      { label: 'PCT', val: parsed.pct, unit: '%', low: 0.15, high: 0.40, ref: '0.15 - 0.40' },
      { label: 'PDW%', val: parsed.pdw, unit: '%', low: 9.0, high: 17.0, ref: '9.0 - 17.0' },
    ];

    const flagged = items.filter((it) => evalFlag(it.val, it.low, it.high).isAbnormal);

    const renderFlagRow = (it: typeof items[0]) => {
      const f = evalFlag(it.val, it.low, it.high);
      const rowBg = f.isHigh ? '#fef2f2' : f.isLow ? '#eff6ff' : '#ffffff';
      const statusBadge = f.isHigh
        ? `<span style="background:#dc2626;color:#fff;padding:1px 6px;border-radius:4px;font-size:9.5px;font-weight:900;">HIGH ▲</span>`
        : f.isLow
          ? `<span style="background:#2563eb;color:#fff;padding:1px 6px;border-radius:4px;font-size:9.5px;font-weight:900;">LOW ▼</span>`
          : `<span style="color:#16a34a;font-size:9.5px;font-weight:700;">NORMAL</span>`;
      return `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #e2e8f0; font-size: ${specialFormFontSize}px;">
          <td style="padding: 4px 8px; font-weight: 800; color: #0f172a;">${it.label}</td>
          <td style="padding: 4px 8px; font-weight: 900; color: ${f.color};">${f.hasVal ? escapeHtml(it.val) : '-'}</td>
          <td style="padding: 4px 6px;">${statusBadge}</td>
          <td style="padding: 4px 6px; color: #64748b; font-size: 10.5px;">${it.unit}</td>
          <td style="padding: 4px 8px; color: #334155; font-family: monospace; font-size: 10.5px;">${it.ref}</td>
        </tr>
      `;
    };

    return `
      <div style="background: #dc2626; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
        <span>CBC DIAGNOSTIC FLAG SPOTLIGHT REPORT</span>
        <span style="font-size: 10px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${flagged.length} ABNORMAL FLAG(S)</span>
      </div>

      ${flagged.length > 0 ? `
        <div style="background: #fff1f2; border: 1.5px solid #fda4af; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;" dir="ltr">
          <strong style="font-size: 11px; color: #be123c; margin-right: 4px;">⚠️ FLAGGED PARAMETERS:</strong>
          ${flagged.map((fl) => {
            const f = evalFlag(fl.val, fl.low, fl.high);
            return `<span style="background:#ffffff;border:1px solid ${f.color};color:${f.color};padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:800;">${fl.label}: ${escapeHtml(fl.val)} ${f.analyzerArrow}</span>`;
          }).join('')}
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;" dir="ltr">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>${items.slice(0, 9).map(renderFlagRow).join('')}</tbody>
          </table>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>${items.slice(9).map(renderFlagRow).join('')}</tbody>
          </table>
        </div>
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 10. FULL_DIFFERENTIAL (All 25+ Parameters + 3-Part & 5-Part + NLR/PLR/Mentzer)
  // =========================================================================
  if (layout === 'FULL_DIFFERENTIAL') {
    const neutAbsN = parseFloat(parsed.neutrophilsAbs !== '-' ? parsed.neutrophilsAbs : parsed.graAbs);
    const lymAbsN = parseFloat(parsed.lymphocytesAbs !== '-' ? parsed.lymphocytesAbs : parsed.lymAbs);
    const pltN = parseFloat(parsed.plt);
    const nlr = !isNaN(neutAbsN) && !isNaN(lymAbsN) && lymAbsN > 0 ? (neutAbsN / lymAbsN).toFixed(2) : '-';
    const plr = !isNaN(pltN) && !isNaN(lymAbsN) && lymAbsN > 0 ? (pltN / lymAbsN).toFixed(1) : '-';
    const rbcN = parseFloat(parsed.rbc);
    const mcvN = parseFloat(parsed.mcv);
    const mentzerVal = !isNaN(rbcN) && !isNaN(mcvN) && rbcN > 0 ? (mcvN / rbcN).toFixed(1) : '-';

    return `
      <div style="background: linear-gradient(90deg, ${headerBgColor || '#7c3aed'} 0%, #1e3a8a 100%); color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: ${specialFormFontSize + 1}px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
        <span>COMPREHENSIVE HEMATOLOGY REPORT (25+ PARAMETERS &amp; DERIVED INDICES)</span>
        <span style="font-size: 10px; opacity: 0.9;">3-PART + 5-PART + NLR/PLR</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;" dir="ltr">
        <!-- Left: Erythroid (8) + Platelets (7) -->
        <div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
            <div style="background: #f8fafc; padding: 4px 10px; font-weight: 800; font-size: 11px; color: #be123c; border-bottom: 1px solid #cbd5e1;">
              1. ERYTHROCYTE PANEL (8 PARAMETERS)
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${renderCbcRow('RBC', parsed.rbc, '10^12/L', '3.50 - 5.50', 3.5, 5.5)}
                ${renderCbcRow('HGB', parsed.hgb, 'g/dL', '11.5 - 16.5', 11.5, 16.5)}
                ${renderCbcRow('HCT', parsed.hct, '%', '35.0 - 55.0', 35.0, 55.0)}
                ${renderCbcRow('MCV', parsed.mcv, 'fL', '75.0 - 100.0', 75.0, 100.0)}
                ${renderCbcRow('MCH', parsed.mch, 'pg', '25.0 - 35.0', 25.0, 35.0)}
                ${renderCbcRow('MCHC', parsed.mchc, 'g/dL', '31.0 - 38.0', 31.0, 38.0)}
                ${renderCbcRow('RDW% (RDW-CV)', parsed.rdw, '%', '11.0 - 16.0', 11.0, 16.0)}
                ${renderCbcRow('RDWa (RDW-SD)', parsed.rdwSd, 'fL', '35.0 - 56.0', 35.0, 56.0)}
              </tbody>
            </table>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 4px 10px; font-weight: 800; font-size: 11px; color: #b45309; border-bottom: 1px solid #cbd5e1;">
              2. EXTENDED PLATELET PANEL (7 PARAMETERS)
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${renderCbcRow('PLT', parsed.plt, '10^9/L', '150 - 450', 150, 450)}
                ${renderCbcRow('MPV', parsed.mpv, 'fL', '6.5 - 11.0', 6.5, 11.0)}
                ${renderCbcRow('PCT', parsed.pct, '%', '0.15 - 0.40', 0.15, 0.40)}
                ${renderCbcRow('PDW% (PDW-CV)', parsed.pdw, '%', '9.0 - 17.0', 9.0, 17.0)}
                ${renderCbcRow('PDWa (PDW-SD)', parsed.pdwSd, 'fL', '9.0 - 17.0', 9.0, 17.0)}
                ${renderCbcRow('P-LCR', parsed.plcr, '%', '13.0 - 43.0', 13.0, 43.0)}
                ${renderCbcRow('P-LCC', parsed.plcc, '10^9/L', '30 - 90', 30, 90)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Leukocytes (WBC + 3-Part + 5-Part + Derived Ratios) -->
        <div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
            <div style="background: #f8fafc; padding: 4px 10px; font-weight: 800; font-size: 11px; color: #166534; border-bottom: 1px solid #cbd5e1;">
              3. LEUKOCYTES (3-PART &amp; 5-PART DIFFERENTIAL)
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${renderCbcRow('Total WBC', parsed.wbc, '10^9/L', '4.0 - 11.0', 4.0, 11.0)}
                ${renderDiffRow('GRA% / GRA#', parsed.graPct, '35.0 - 80.0 %', 35.0, 80.0, wbcNum, undefined, parsed.graAbs)}
                ${renderDiffRow('LYM% / LYM#', parsed.lymPct, '15.0 - 50.0 %', 15.0, 50.0, wbcNum, undefined, parsed.lymAbs)}
                ${renderDiffRow('MID% / MID#', parsed.midPct, '2.0 - 15.0 %', 2.0, 15.0, wbcNum, undefined, parsed.midAbs)}
                ${renderDiffRow('Neutrophils', parsed.neutrophils, '40.0 - 75.0 %', 40.0, 75.0, wbcNum, undefined, parsed.neutrophilsAbs)}
                ${renderDiffRow('Lymphocytes', parsed.lymphocytes, '20.0 - 45.0 %', 20.0, 45.0, wbcNum, undefined, parsed.lymphocytesAbs)}
                ${renderDiffRow('Monocytes', parsed.monocytes, '2.0 - 10.0 %', 2.0, 10.0, wbcNum, undefined, parsed.monocytesAbs)}
                ${renderDiffRow('Eosinophils', parsed.eosinophils, '1.0 - 6.0 %', 1.0, 6.0, wbcNum, undefined, parsed.eosinophilsAbs)}
                ${renderDiffRow('Basophils', parsed.basophils, '0.0 - 1.0 %', 0.0, 1.0, wbcNum, undefined, parsed.basophilsAbs)}
              </tbody>
            </table>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #faf5ff;">
            <div style="font-weight: 800; font-size: 11px; color: #6d28d9; margin-bottom: 6px;">
              4. DERIVED CLINICAL HEMATOLOGY INDICES
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 11px;">
              <div style="background: #ffffff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 6px 8px;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">NLR (Neut/Lymph)</span>
                <strong style="color: #0f172a; font-size: 13px;">${nlr}</strong>
                <span style="color: #94a3b8; font-size: 9px; display: block;">Ref: 1.0 - 3.0</span>
              </div>
              <div style="background: #ffffff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 6px 8px;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">PLR (Plt/Lymph)</span>
                <strong style="color: #0f172a; font-size: 13px;">${plr}</strong>
                <span style="color: #94a3b8; font-size: 9px; display: block;">Ref: 50 - 150</span>
              </div>
              <div style="background: #ffffff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 6px 8px;">
                <span style="color: #64748b; font-size: 9.5px; display: block;">Mentzer (MCV/RBC)</span>
                <strong style="color: #0f172a; font-size: 13px;">${mentzerVal}</strong>
                <span style="color: #94a3b8; font-size: 9px; display: block;">&lt;13 Thal / &ge;13 IDA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 10px; display: flex; gap: 10px;" dir="ltr">
        ${generateHistogramSvg('WBC', (cbc as any).wbcCurve)}
        ${generateHistogramSvg('RBC', (cbc as any).rbcCurve)}
        ${generateHistogramSvg('PLT', (cbc as any).pltCurve)}
      </div>
      ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
    `;
  }

  // =========================================================================
  // 1. DEFAULT: CLASSIC_5PART (100% Backwards-Compatible with Golden Tests)
  // =========================================================================
  const nVal = parseFloat(parsed.neutrophils) || 0;
  const lVal = parseFloat(parsed.lymphocytes) || 0;
  const mVal = parseFloat(parsed.monocytes) || 0;
  const eVal = parseFloat(parsed.eosinophils) || 0;
  const bVal = parseFloat(parsed.basophils) || 0;
  const hasDiffData = parsed.neutrophils !== '-' || parsed.lymphocytes !== '-';
  const diffSum = Math.round((nVal + lVal + mVal + eVal + bVal) * 10) / 10;

  return `
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
              ${parsed.rdwSd !== '-' ? renderCbcRow('RDWa / RDW-SD', parsed.rdwSd, 'fL', '35.0 - 56.0', 35.0, 56.0, priorCbcParsed?.rdwSd) : ''}
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
              ${parsed.pdwSd !== '-' ? renderCbcRow('PDWa (PDW-SD)', parsed.pdwSd, 'fL', '9.0 - 17.0', 9.0, 17.0, priorCbcParsed?.pdwSd) : ''}
              ${parsed.plcr !== '-' ? renderCbcRow('P-LCR (Large Platelet Ratio)', parsed.plcr, '%', '13.0 - 43.0', 13.0, 43.0, priorCbcParsed?.plcr) : ''}
              ${parsed.plcc !== '-' ? renderCbcRow('P-LCC (Large Platelet Count)', parsed.plcc, '10^9/L', '30 - 90', 30, 90, priorCbcParsed?.plcc) : ''}
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
              ${renderDiffRow('Neutrophils', parsed.neutrophils, '40.0 - 75.0 %', 40.0, 75.0, wbcNum, priorCbcParsed?.neutrophils, parsed.neutrophilsAbs)}
              ${renderDiffRow('Lymphocytes', parsed.lymphocytes, '20.0 - 45.0 %', 20.0, 45.0, wbcNum, priorCbcParsed?.lymphocytes, parsed.lymphocytesAbs)}
              ${renderDiffRow('Monocytes', parsed.monocytes, '2.0 - 10.0 %', 2.0, 10.0, wbcNum, priorCbcParsed?.monocytes, parsed.monocytesAbs)}
              ${renderDiffRow('Eosinophils', parsed.eosinophils, '1.0 - 6.0 %', 1.0, 6.0, wbcNum, priorCbcParsed?.eosinophils, parsed.eosinophilsAbs)}
              ${renderDiffRow('Basophils', parsed.basophils, '0.0 - 1.0 %', 0.0, 1.0, wbcNum, priorCbcParsed?.basophils, parsed.basophilsAbs)}
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

    ${buildMorphologyAndCommentsHtml(parsed, settings, specialFormFontSize)}
  `;
}
