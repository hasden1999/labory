import { NextResponse } from 'next/server';
import { getStore, clampMargin, getLocalIpAddress } from '../../../../../lib/serverStore';
import { toEnglishDigits, formatEnglishDate, formatEnglishDateTime, isBloodGroupTest, evaluateClinicalResult } from '../../../../../lib/formatters';
import { calculateLipidPanel, LIPID_REFERENCE_SOURCES, LIPID_CATALOG_IDS, normalizeLipidUnit, classifyResultRange, formatClinicalAge } from '@lab-manager/domain';
import { resolveReferenceRange } from '../../../../../lib/orderHelpers';
import { renderPrintBodyPages } from './PrintBody';
import { renderPrintHeader, renderPatientMetaBox } from './PrintHeader';

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getReportEnglishTestName(test: any): string {
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

function getReportEnglishCategory(cat: string): string {
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

function getReportEnglishSampleType(sampleType: string): string {
  if (!sampleType) return 'Serum';
  const trimmed = String(sampleType).trim();

  const map: Record<string, string> = {
    'محسوب': 'Calculated',
    'دم كامل (EDTA)': 'Whole Blood (EDTA)',
    'دم كامل (Citrate)': 'Whole Blood (Citrate)',
    'بلازما (Sodium Citrate)': 'Plasma (Sodium Citrate)',
    'بلازما': 'Plasma',
    'مصل الدم (Serum)': 'Serum',
    'إدرار عشوائي': 'Random Urine',
    'عينة خروج': 'Stool Sample',
    'إدرار صباحي': 'Morning Urine',
    'سائل منوي (Semen)': 'Seminal Fluid',
    'دم شعيري (Capillary)': 'Capillary Blood',
    'دم كامل (أنابيب زجاجية)': 'Whole Blood (Glass Tubes)',
    'بلازما (EDTA مفصولة فوراً)': 'Plasma (EDTA Immediate)',
    'إدرار 24 ساعة': '24-Hour Urine',
    'بلازما (EDTA مبردة)': 'Chilled Plasma (EDTA)',
    'إدرار طازج': 'Fresh Urine',
    'دم كامل': 'Whole Blood',
    'مصل': 'Serum',
    'إدرار': 'Urine',
    'خروج': 'Stool',
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

function translateQualitativeResult(val: string): string {
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
    'رائق': 'Clear',
    'عكر': 'Turbid',
    'أصفر': 'Yellow',
    'اصفر': 'Yellow',
    'أصفر شاحب': 'Pale Yellow',
    'اصفر شاحب': 'Pale Yellow',
    'أحمر': 'Red',
    'احمر': 'Red',
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
    'دموي': 'Bloody',
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

function generateQrSvg(url: string, size = 64): string {
  // Clean minimal SVG QR representation placeholder linking to URL
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid #cbd5e1; padding: 2px; border-radius: 4px; background: #fff;">
      <rect width="64" height="64" fill="white"/>
      <!-- QR Position markers -->
      <rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="#0f172a" stroke-width="3"/>
      <rect x="9" y="9" width="8" height="8" fill="#0f172a"/>
      <rect x="42" y="4" width="18" height="18" rx="2" fill="none" stroke="#0f172a" stroke-width="3"/>
      <rect x="47" y="9" width="8" height="8" fill="#0f172a"/>
      <rect x="4" y="42" width="18" height="18" rx="2" fill="none" stroke="#0f172a" stroke-width="3"/>
      <rect x="9" y="47" width="8" height="8" fill="#0f172a"/>
      <!-- Data bits -->
      <rect x="26" y="8" width="4" height="4" fill="#0f172a"/>
      <rect x="34" y="8" width="4" height="4" fill="#0f172a"/>
      <rect x="26" y="16" width="4" height="4" fill="#0f172a"/>
      <rect x="34" y="16" width="4" height="4" fill="#0f172a"/>
      <rect x="26" y="26" width="12" height="12" fill="#0284c7"/>
      <rect x="8" y="26" width="4" height="4" fill="#0f172a"/>
      <rect x="16" y="32" width="4" height="4" fill="#0f172a"/>
      <rect x="42" y="26" width="4" height="4" fill="#0f172a"/>
      <rect x="52" y="30" width="4" height="4" fill="#0f172a"/>
      <rect x="26" y="44" width="4" height="4" fill="#0f172a"/>
      <rect x="34" y="48" width="4" height="4" fill="#0f172a"/>
      <rect x="46" y="46" width="10" height="10" fill="#0f172a"/>
    </svg>`;
}

function generateHistogramSvg(type: 'WBC' | 'RBC' | 'PLT', points?: number[], width = 200, height = 65): string {
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

import { isCbcTest, isSfaTest, isGueTest, isGseTest, isGeneralTest } from '../../../../../lib/testClassifier';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  
  if (!sample) {
    return new Response('<h2>Sample Not Found</h2>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const { searchParams } = new URL(request.url);
  const allowForce = searchParams.get('force') === 'true';
  const sectionParam = (searchParams.get('section') || 'all').toLowerCase();
  const isSingleMode = searchParams.get('mode') === 'single' || searchParams.get('mode') === 'image';

  // Filter tests by requested section for completeness checking
  let targetTestsToCheck = sample.tests || [];
  if (sectionParam === 'cbc' || sectionParam === 'fbc') {
    targetTestsToCheck = targetTestsToCheck.filter(isCbcTest);
  } else if (sectionParam === 'gue' || sectionParam === 'urine') {
    targetTestsToCheck = targetTestsToCheck.filter(isGueTest);
  } else if (sectionParam === 'gse' || sectionParam === 'stool') {
    targetTestsToCheck = targetTestsToCheck.filter(isGseTest);
  } else if (sectionParam === 'sfa' || sectionParam === 'semen') {
    targetTestsToCheck = targetTestsToCheck.filter(isSfaTest);
  } else if (sectionParam === 'general' || sectionParam === 'chemistry') {
    targetTestsToCheck = targetTestsToCheck.filter(isGeneralTest);
  }

  // Clinical Safety Rule: Prevent printing when there are unperformed / incomplete tests in the targeted section
  const incompleteTests = targetTestsToCheck.filter(t => {
    return !t.resultValue || String(t.resultValue).trim() === '';
  });

  if (incompleteTests.length > 0 && !allowForce) {
    const patientName = escapeHtml(sample.patient?.name || 'مريض غير محدد');
    const incompleteListHtml = incompleteTests.map((t: any) => `
      <li style="padding: 10px 14px; background: #ffffff; border: 1px solid #fed7aa; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; color: #9a3412; font-size: 13px;">${escapeHtml(t.test?.name || t.test?.code || 'تحليل معلق')}</span>
        <span style="background: #ffedd5; color: #c2410c; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;">قيد الانتظار (لم يُنجز)</span>
      </li>
    `).join('');

    const warningHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تنبيه سريري: لا يمكن طباعة التقرير الطبي</title>
        <style>
          @font-face {
            font-family: 'Cairo';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Cairo Regular'), local('Cairo'), url('/fonts/Cairo-Regular.ttf') format('truetype');
          }
          @font-face {
            font-family: 'Cairo';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: local('Cairo Bold'), local('Cairo-Bold'), url('/fonts/Cairo-Bold.ttf') format('truetype');
          }
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          body {
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff7ed;
            color: #7c2d12;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
          }
          .warning-card {
            background: #ffffff;
            border: 2px solid #ea580c;
            border-radius: 18px;
            padding: 36px 28px;
            max-width: 580px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(234, 88, 12, 0.15), 0 8px 10px -6px rgba(234, 88, 12, 0.1);
            text-align: center;
          }
          .icon-badge {
            width: 72px;
            height: 72px;
            background: #ffedd5;
            border: 2px solid #ea580c;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 38px;
            margin-bottom: 18px;
          }
          h1 {
            font-size: 20px;
            font-weight: 900;
            color: #9a3412;
            margin: 0 0 8px 0;
          }
          .sub-badge {
            background: #f1f5f9;
            color: #334155;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 18px;
          }
          p {
            font-size: 13.5px;
            color: #431407;
            line-height: 1.7;
            margin: 0 0 18px 0;
          }
          .tests-box {
            background: #fffaf5;
            border: 1px dashed #fdba74;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 22px;
            text-align: right;
          }
          .tests-box-title {
            font-size: 13px;
            font-weight: 800;
            color: #9a3412;
            margin-bottom: 10px;
            display: block;
          }
          ul {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 200px;
            overflow-y: auto;
          }
          .btn-return {
            display: inline-block;
            background: #ea580c;
            color: #ffffff;
            padding: 12px 28px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 800;
            font-size: 13.5px;
            box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
            transition: transform 0.15s, background 0.15s;
          }
          .btn-return:hover {
            background: #c2410c;
            transform: translateY(-1px);
          }
          @media print {
            body { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="warning-card">
          <div class="icon-badge">⚠️</div>
          <h1>تنبيه: لا يمكن طباعة التقرير الطبي</h1>
          <div class="sub-badge">
            عينة رقم #${sample.sampleNumber} • المريض: ${patientName}
          </div>
          <p>
            توجد فحوصات مطلوبة ضمن هذه العينة <strong>لم يتم إدخال نتائجها بعد</strong>.
            وفقاً لمعايير الجودة الطبية وسلامة المرضى، يُحظر طباعة أو تسليم تقرير جزئي قد يؤدي إلى تشخيص طبي غير دقيق.
          </p>
          <div class="tests-box">
            <span class="tests-box-title">
              📋 الفحوصات المعلقة التي لم تُنجز (${incompleteTests.length}):
            </span>
            <ul>
              ${incompleteListHtml}
            </ul>
          </div>
          <a href="/results?sampleId=${sample.id}" class="btn-return">
            الانتقال لشاشة إدخال النتائج لإكمال الفحوصات 🔬
          </a>
        </div>
      </body>
      </html>
    `;

    return new Response(warningHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Report-Blocked': 'incomplete_tests',
      },
    });
  }

  const settings = store.settings;
  const patient = sample.patient || { name: 'Patient', age: '-', gender: 'MALE' };
  let referringDocName = '';
  const pRefDocId = sample.patient?.referringDoctorId;
  if (pRefDocId) {
    const rd = (store.doctors || []).find((d: any) => d.id === pRefDocId);
    if (rd) referringDocName = rd.name;
  }
  if (!referringDocName && (sample as any).referringDoctor?.name) {
    referringDocName = (sample as any).referringDoctor.name;
  } else if (!referringDocName && sample.doctor?.name && !sample.doctor.name.includes('بدون تحويل')) {
    referringDocName = sample.doctor.name;
  } else if (!referringDocName && sample.doctorId) {
    const d = (store.doctors || []).find((doc: any) => doc.id === sample.doctorId);
    if (d && !d.name.includes('بدون تحويل')) referringDocName = d.name;
  }
  const doctor = { name: referringDocName || 'Self / Direct' };
  const clinicalAge = formatClinicalAge(
    patient.birthDate ? { birthDate: patient.birthDate } : { age: patient.age },
    sample.createdAt
  );

  const isPreprinted = settings.headerMode === 'PREPRINTED';
  const rawTop = settings.topMarginMm ?? (isPreprinted ? 45 : 12);
  const rawBottom = settings.bottomMarginMm ?? (isPreprinted ? 30 : 12);
  const rawLeft = settings.leftMarginMm ?? 10;
  const rawRight = settings.rightMarginMm ?? 10;

  const topMm = clampMargin(rawTop, 0, 100, isPreprinted ? 45 : 12);
  const bottomMm = clampMargin(rawBottom, 0, 100, isPreprinted ? 30 : 12);
  const leftMm = clampMargin(rawLeft, 0, 50, 10);
  const rightMm = clampMargin(rawRight, 0, 50, 10);
  const template = settings.reportTemplate || 'CLASSIC';
  const primaryCol = settings.primaryColor || '#0284c7';
  const qrEnabled = settings.enableQrCode !== false;
  const qrPosition = settings.qrCodePosition || 'HEADER';

  // Advanced Sheet & Element Visibility Settings
  const showLabName = settings.showLabName !== false;
  const labNameFontSize = settings.labNameFontSize || 20;
  const labNameColor = settings.labNameColor || primaryCol;
  const labNameAlignment = settings.labNameAlignment || 'RIGHT';
  const labNameStyle = settings.labNameStyle || 'DEFAULT';
  const showLabSubtitle = settings.showLabSubtitle !== false;
  const showContactInfo = settings.showContactInfo !== false;
  const showDoctorInfo = settings.showDoctorInfo !== false;
  const showPatientBox = settings.showPatientBox !== false;
  const showReportBorder = settings.showReportBorder !== false;
  const showFooter = settings.showFooter !== false;
  const showFooterSignature = settings.showFooterSignature !== false;

  // Watermark Settings
  const enableWatermark = settings.enableWatermark === true;
  const watermarkText = escapeHtml(settings.watermarkText || settings.labName || 'ORIGINAL REPORT');
  const watermarkOpacity = settings.watermarkOpacity ?? 0.08;
  const watermarkAngle = settings.watermarkAngle ?? -30;
  const watermarkSize = settings.watermarkSize ?? 46;
  const watermarkColor = settings.watermarkColor || '#0f172a';

  // Typography Settings
  const fontFamily = settings.fontFamily || 'Tajawal';
  const fontSize = settings.fontSize || 'MEDIUM';

  let fontFamilyCss = `'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  if (fontFamily === 'Cairo') {
    fontFamilyCss = `'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  } else if (fontFamily === 'IBM Plex Sans Arabic') {
    fontFamilyCss = `'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  } else if (fontFamily === 'Almarai') {
    fontFamilyCss = `'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  } else if (fontFamily === 'System') {
    fontFamilyCss = `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  }

  let bodyFontSize = '12.5px';
  let tableFontSize = '12px';
  let tableCellPadding = '7px 10px';
  if (fontSize === 'SMALL') {
    bodyFontSize = '11px';
    tableFontSize = '10.5px';
    tableCellPadding = '5px 8px';
  } else if (fontSize === 'LARGE') {
    bodyFontSize = '14px';
    tableFontSize = '13.5px';
    tableCellPadding = '9px 12px';
  }

  // Two-Tab Form Design System Settings
  const formBgColor = settings.formBgColor || '#ffffff';
  const headerBgColor = settings.headerBgColor || primaryCol;
  const headerTextColor = settings.headerTextColor || '#ffffff';
  const textColor = settings.textColor || '#0f172a';
  const borderColor = settings.borderColor || (template === 'BLACK_WHITE' ? '#000000' : '#e2e8f0');

  const reportTitleFontSize = settings.reportTitleFontSize || settings.labNameFontSize || 20;
  const testNameFontSize = settings.testNameFontSize || (fontSize === 'SMALL' ? 10.5 : fontSize === 'LARGE' ? 13.5 : 12);
  const resultValueFontSize = settings.resultValueFontSize || (fontSize === 'SMALL' ? 10.5 : fontSize === 'LARGE' ? 13.5 : 12);
  const unitFontSize = settings.unitFontSize || (fontSize === 'SMALL' ? 9.5 : fontSize === 'LARGE' ? 12 : 11);
  const refRangeFontSize = settings.refRangeFontSize || (fontSize === 'SMALL' ? 9.5 : fontSize === 'LARGE' ? 12 : 11);

  const testNameFontWeight = settings.testNameFontWeight || 'bold';
  const resultValueFontWeight = settings.resultValueFontWeight || 'normal';

  const rawTableColumns = (settings.tableColumns && Array.isArray(settings.tableColumns) && settings.tableColumns.length > 0)
    ? settings.tableColumns
    : [
        { id: 'testName', label: 'INVESTIGATION', visible: true, align: 'left' },
        { id: 'result', label: 'RESULT', visible: true, align: 'left' },
        { id: 'unit', label: 'UNIT', visible: true, align: 'left' },
        { id: 'refRange', label: 'REFERENCE RANGE', visible: true, align: 'left' },
        { id: 'notes', label: 'NOTES', visible: false, align: 'left' },
      ];

  const visibleColumns = rawTableColumns.filter((c: any) => c.visible !== false);
  const groupByCategory = settings.groupByCategory === true;
  const tableRowBorders = settings.tableRowBorders !== false;
  const tableZebraStriping = settings.tableZebraStriping === true;
  const tableRowSpacing = settings.tableRowSpacing || 'COMFORTABLE';

  let customCellPadding = tableCellPadding;
  if (tableRowSpacing === 'COMPACT') {
    customCellPadding = '4px 8px';
  } else if (tableRowSpacing === 'RELAXED') {
    customCellPadding = '11px 14px';
  }

  const rawBase = settings.serverBaseUrl?.trim();
  const baseDomain = rawBase || `http://127.0.0.1:8080`;
  const cleanBase = baseDomain.replace(/\/+$/, '');
  const verifyUrl = `${cleanBase}/verify/${sample.id}`;
  const qrSvg = generateQrSvg(verifyUrl, 64);

  // Watermark Layer Helper
  const renderWatermark = () => {
    if (!enableWatermark) return '';
    return `
      <div class="watermark-layer" aria-hidden="true">
        <div class="watermark-inner">${watermarkText}</div>
      </div>
    `;
  };

  // Shared Helper: Legal Accreditation Footer
  const renderFooter = (safeFooter: string, safeLabName: string) => {
    if (!showFooter) return '';
    return `
      <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b; position: relative; z-index: 1;" dir="ltr">
        <div>
          <div>${safeFooter || 'This report has been electronically verified and clinically validated.'}</div>
          ${isPreprinted || !showLabName ? '' : `<div style="margin-top: 2px; color: #94a3b8;">${safeLabName} • Accredited Clinical Diagnostics</div>`}
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          ${qrEnabled && qrPosition === 'FOOTER' ? `
            <div style="text-align: center;">
              ${qrSvg}
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Scan to Verify</div>
            </div>
          ` : ''}
          ${showFooterSignature ? `
            <div style="font-weight: 700; color: #0f172a; text-align: left;" dir="ltr">
              <div>Approved by Clinical Pathologist</div>
              <div style="font-size: 9px; color: #64748b;">Clinically Validated &amp; Approved</div>
            </div>
          ` : ''}
        </div>
      </div>`;
  };

  // ---------------------------------------------------------------
  // Template CSS Styling Variations
  // ---------------------------------------------------------------
  let templateCss = '';
  let containerClass = 'report-card';

  if (template === 'CLASSIC') {
    templateCss = `
      .report-card { border: 2px solid #1e3a8a; border-radius: 8px; }
      .header-border { border-bottom: 3px solid #1e3a8a !important; }
      .table-header { background: #1e3a8a !important; }
    `;
  } else if (template === 'MODERN') {
    templateCss = `
      .report-card { border: 1px solid #38bdf8; border-radius: 16px; background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 15%); }
      .header-border { border-bottom: 3px solid #0284c7 !important; }
      .table-header { background: linear-gradient(90deg, #0284c7, #0ea5e9) !important; }
    `;
  } else if (template === 'EXECUTIVE') {
    templateCss = `
      .report-card { border: 1px solid #d97706; border-top: 5px solid #b45309; border-radius: 4px; box-shadow: 0 4px 15px rgba(180,83,9,0.06); }
      .header-border { border-bottom: 2px solid #b45309 !important; }
      .table-header { background: #78350f !important; }
    `;
  } else if (template === 'COMPACT') {
    templateCss = `
      .report-card { border: 1px solid #94a3b8; padding: 14px !important; font-size: 11px !important; }
      .header-border { border-bottom: 2px solid #475569 !important; padding-bottom: 8px !important; margin-bottom: 10px !important; }
      .table-header { background: #334155 !important; }
      table td, table th { padding: 6px 8px !important; }
    `;
  } else if (template === 'SPECIALIZED') {
    templateCss = `
      .report-card { border: 1.5px solid #0d9488; border-radius: 12px; }
      .header-border { border-bottom: 3px solid #0d9488 !important; }
      .table-header { background: #0f766e !important; }
    `;
  } else if (template === 'BLACK_WHITE') {
    templateCss = `
      .report-card { border: 2px solid #000000; border-radius: 0px; background: #ffffff !important; box-shadow: none !important; }
      .header-border { border-bottom: 2px solid #000000 !important; }
      .table-header { background: #000000 !important; color: #ffffff !important; }
      .modern-header-banner { background: #000000 !important; color: #ffffff !important; border-radius: 0px !important; }
      table th { background: #000000 !important; color: #ffffff !important; border: 1px solid #000000 !important; }
      table td { border-bottom: 1px solid #000000 !important; color: #000000 !important; }
    `;
  }

  // Apply User Form Design System Overrides
  templateCss += `
    .report-card {
      background-color: ${formBgColor} !important;
      color: ${textColor} !important;
      ${showReportBorder ? `border: 1.5px solid ${borderColor} !important;` : 'border: none !important;'}
    }
    .table-header {
      background: ${headerBgColor} !important;
      color: ${headerTextColor} !important;
    }
    .header-border {
      border-bottom: 2.5px solid ${borderColor} !important;
    }
  `;

  const safePatientName = escapeHtml(patient.name);
  const safeDoctorName = escapeHtml(doctor.name);
  const safeLabName = escapeHtml(settings.labName);
  const safeLabSubtitle = escapeHtml(settings.labSubtitle);
  const safeAddress = escapeHtml(settings.address);
  const safePhone = escapeHtml(settings.phone);
  const safeDocTitle = escapeHtml(settings.doctorTitle);
  const safeDocName = escapeHtml(settings.doctorName);
  const safeLicense = escapeHtml(settings.labLicense);
  const safeFooter = escapeHtml(settings.reportFooter);

  const renderedPages = renderPrintBodyPages({
    sample,
    store,
    settings,
    sectionParam,
    template,
    primaryCol,
    textColor,
    borderColor,
    headerBgColor,
    headerTextColor,
    testNameFontSize,
    resultValueFontSize,
    unitFontSize,
    refRangeFontSize,
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
    doctor,
    headerParams: {
      settings,
      safeLabName,
      safeLabSubtitle,
      safeAddress,
      safePhone,
      safeDocName,
      safeDocTitle,
      safeLicense,
      isPreprinted,
      showLabName,
      labNameFontSize,
      labNameColor,
      labNameAlignment,
      labNameStyle,
      showLabSubtitle,
      showContactInfo,
      showDoctorInfo,
      qrEnabled,
      qrPosition,
      template,
      primaryCol,
      verifyUrl,
    },
    patientBoxParams: {
      showPatientBox,
      safePatientName,
      safeDoctorName,
      clinicalAge,
      gender: patient.gender,
      sampleNumber: sample.sampleNumber,
      primaryCol,
      createdAt: sample.createdAt,
    },
  });


  const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Medical Report #${sample.sampleNumber} - ${safePatientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Offline Local Fonts (Tajawal & Cairo) with local() and /fonts/ fallback */
    @font-face {
      font-family: 'Tajawal';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Tajawal Regular'), local('Tajawal'), url('/fonts/Tajawal-Regular.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Tajawal';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: local('Tajawal Bold'), local('Tajawal-Bold'), url('/fonts/Tajawal-Bold.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Cairo';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Cairo Regular'), local('Cairo'), url('/fonts/Cairo-Regular.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Cairo';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: local('Cairo Bold'), local('Cairo-Bold'), url('/fonts/Cairo-Bold.ttf') format('truetype');
    }

    @page { 
      size: A4 portrait; 
      margin: ${topMm}mm ${rightMm}mm ${bottomMm}mm ${leftMm}mm; 
    }
    * { 
      box-sizing: border-box; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
      color-adjust: exact !important; 
    }
    body {
      font-family: ${fontFamilyCss};
      font-size: ${bodyFontSize};
      direction: ltr;
      text-align: left;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #f1f5f9;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
      color-adjust: exact !important; 
    }
    table td, table th {
      font-size: ${tableFontSize} !important;
      padding: ${tableCellPadding} !important;
    }
    .report-card {
      max-width: 820px;
      min-height: 297mm;
      margin: 0 auto 24px auto;
      padding: 24px;
      position: relative;
      background: #ffffff;
      box-shadow: ${showReportBorder ? '0 4px 15px rgba(0,0,0,0.05)' : 'none'};
      border-radius: ${showReportBorder ? '8px' : '0'};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      ${!showReportBorder ? 'border: none !important;' : ''}
    }
    .report-main-content {
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }
    .report-footer-pinned {
      margin-top: auto;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .watermark-layer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .watermark-inner {
      transform: rotate(${watermarkAngle}deg);
      font-size: ${watermarkSize}px;
      font-weight: 900;
      color: ${watermarkColor};
      opacity: ${watermarkOpacity};
      white-space: nowrap;
      user-select: none;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table, .header-border {
      position: relative;
      z-index: 1;
    }
    .print-btn-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 10px 0;
    }
    .btn-print {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(2,132,199,0.3);
    }
    ${templateCss}
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body { 
        padding: 0; 
        margin: 0; 
        background: transparent !important; 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
        color-adjust: exact !important; 
      }
      .report-card { 
        border: none !important; 
        box-shadow: none !important; 
        padding: 16mm 14mm 14mm 14mm !important; 
        width: 100% !important; 
        max-width: none !important; 
        min-height: 297mm !important;
        height: 297mm !important;
        margin: 0 !important; 
        border-radius: 0 !important; 
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        page-break-after: always;
        break-after: page;
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
        color-adjust: exact !important; 
      }
      .report-main-content {
        flex: 1 0 auto !important;
      }
      .report-footer-pinned {
        margin-top: auto !important;
        flex-shrink: 0 !important;
      }
      .page-break { page-break-before: always !important; break-before: page !important; }
      .print-btn-bar { display: none !important; }
      .watermark-inner {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .modern-header-banner {
        background: linear-gradient(135deg, ${primaryCol} 0%, #06b6d4 100%) !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .table-header {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      tr { page-break-inside: avoid; }
    }
    ${isSingleMode ? `
      body { background: #ffffff !important; padding: 0 !important; }
      .report-card { border: none !important; box-shadow: none !important; margin: 0 auto !important; padding: 16px 20px !important; }
      .print-btn-bar { display: none !important; }
    ` : ''}
  </style>
</head>
<body>
  ${!isSingleMode ? `
    <div class="print-btn-bar">
      <button class="btn-print" onclick="window.print()">Print Report (A4)</button>
    </div>
  ` : ''}

  ${renderedPages.join('\n')}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: http:;"
    },
  });
}
