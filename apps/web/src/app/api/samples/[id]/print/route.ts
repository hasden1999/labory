import { NextResponse } from 'next/server';
import { getStore, clampMargin, getLocalIpAddress } from '../../../../../lib/serverStore';
import { toEnglishDigits, formatEnglishDate, formatEnglishDateTime, isBloodGroupTest } from '../../../../../lib/formatters';

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

export const isCbcTest = (t: any) => {
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return code === 'CBC' || 
         code === 'FBC' ||
         name.includes('complete blood count') || 
         name.includes('صورة الدم') || 
         val.includes('CBC') || 
         val.includes('ERYTHROID:') || 
         val.includes('DIFFERENTIAL:');
};

export const isSfaTest = (t: any) => {
  if (isCbcTest(t)) return false;
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return code === 'SFA' || 
         val.includes('S.F.A') || 
         val.includes('SEMINAL') || 
         name.includes('semen') || 
         name.includes('سائل منوي') || 
         name.includes('نطف') || 
         (val.includes('PHYSICAL:') && (val.includes('MOTILITY:') || val.includes('MORPHOLOGY:')));
};

export const isGueTest = (t: any) => {
  if (isCbcTest(t) || isSfaTest(t)) return false;
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return code === 'GUE' || val.includes('G.U.E') || name.includes('urine') || name.includes('إدرار') || (val.includes('PHYSICAL:') && !val.includes('G.S.E') && !val.includes('PARASITOLOGY:'));
};

export const isGseTest = (t: any) => {
  if (isCbcTest(t) || isSfaTest(t)) return false;
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return code === 'GSE' || val.includes('G.S.E') || name.includes('stool') || name.includes('خروج') || val.includes('PARASITOLOGY:');
};

export const isGeneralTest = (t: any) => !isCbcTest(t) && !isSfaTest(t) && !isGueTest(t) && !isGseTest(t);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  
  if (!sample) {
    return new Response('<h2>Sample Not Found (العينة غير موجودة)</h2>', {
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
  const doctor = sample.doctor || { name: 'Direct / بدون تحويل' };

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

  const rawBase = settings.serverBaseUrl?.trim();
  const baseDomain = rawBase || `http://${getLocalIpAddress()}:8080`;
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
    .filter(s => s.id !== sample.id && 
      ((patId && (s.patientId === patId || s.patient?.id === patId)) || (patName && s.patient?.name === patName)) && 
      new Date(s.createdAt).getTime() < new Date(sample.createdAt).getTime()
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Shared Helper: Digital or Pre-printed Header
  const renderHeader = (safeLabName: string, safeLabSubtitle: string, safeAddress: string, safePhone: string, safeDocName: string, safeDocTitle: string, safeLicense: string) => {
    if (isPreprinted) {
      return `<div style="height: 10px; margin-bottom: 10px;"></div>`;
    }

    const hasHeaderContent = (showLabName && safeLabName) || showLabSubtitle || showContactInfo || showDoctorInfo || (qrEnabled && qrPosition === 'HEADER');
    if (!hasHeaderContent) {
      return '';
    }

    const labNameAlignStyle = labNameAlignment === 'CENTER' ? 'text-align: center;' : labNameAlignment === 'LEFT' ? 'text-align: left;' : 'text-align: right;';

    // Modern Colored Gradient Header (Identical to settings preview)
    if (template === 'MODERN') {
      let modernBadgeStyle = '';
      if (labNameStyle === 'MODERN_BADGE') {
        modernBadgeStyle = 'background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 6px; display: inline-block;';
      } else if (labNameStyle === 'ELEGANT_BORDER') {
        modernBadgeStyle = 'border: 1.5px solid rgba(255,255,255,0.85); padding: 2px 10px; border-radius: 6px; display: inline-block;';
      }

      return `
        <div class="modern-header-banner" style="background: linear-gradient(135deg, ${primaryCol} 0%, #06b6d4 100%) !important; color: #ffffff !important; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">
          <div style="flex: 1; ${labNameAlignStyle}">
            ${showLabName && safeLabName ? `
              <div style="font-size: ${labNameFontSize}px; font-weight: 900; color: #ffffff !important; margin-bottom: 2px; ${modernBadgeStyle}">
                ${settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : `
                  <svg width="${Math.min(22, Math.max(16, labNameFontSize - 2))}" height="${Math.min(22, Math.max(16, labNameFontSize - 2))}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-left: 6px;"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/></svg>
                `}
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.95) !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: rgba(255, 255, 255, 0.85) !important;">العنوان: ${safeAddress} | هاتف: ${safePhone} ${safeLicense ? ` | ترخيص: ${safeLicense}` : ''}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 8px; font-weight: 800; color: #0f172a; margin-top: 2px; letter-spacing: 0.5px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(255, 255, 255, 0.18) !important; border: 1px solid rgba(255, 255, 255, 0.3); padding: 8px 12px; border-radius: 6px; text-align: left; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" dir="ltr">
                <h4 style="font-size: 12px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 10px; color: rgba(255, 255, 255, 0.92) !important; margin: 2px 0 0 0; font-weight: 600;">${safeDocTitle || 'Consultant Clinical Pathologist'}</p>
                ${safeLicense ? `<p style="font-size: 9px; color: rgba(255, 255, 255, 0.78) !important; margin: 2px 0 0 0;">Lic: ${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
        </div>`;
    }

    let labNameStyleCss = '';
    if (labNameStyle === 'BOLD') {
      labNameStyleCss = 'font-weight: 900;';
    } else if (labNameStyle === 'MODERN_BADGE') {
      labNameStyleCss = `background: ${labNameColor}18; padding: 2px 10px; border-radius: 6px; display: inline-block;`;
    } else if (labNameStyle === 'ELEGANT_BORDER') {
      labNameStyleCss = `border: 1.5px solid ${labNameColor}; padding: 2px 10px; border-radius: 4px; display: inline-block;`;
    }

    return `
      <div class="header-border" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; margin-bottom: 16px; position: relative; z-index: 1;">
        <div style="flex: 1; ${labNameAlignStyle}">
          ${showLabName && safeLabName ? `
            <h1 style="margin: 0; font-size: ${labNameFontSize}px; color: ${labNameColor}; font-weight: 800; ${labNameStyleCss}">
              ${safeLabName}
            </h1>
          ` : ''}
          ${showLabSubtitle && safeLabSubtitle ? `
            <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">${safeLabSubtitle}</p>
          ` : ''}
          ${showContactInfo ? `
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">العنوان: ${safeAddress} | هاتف: ${safePhone}</p>
          ` : ''}
        </div>

        ${(showDoctorInfo || (qrEnabled && qrPosition === 'HEADER')) ? `
          <div style="display: flex; align-items: center; gap: 14px; margin-right: 16px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="text-align: center;">
                ${qrSvg}
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">تحقق إلكتروني</div>
              </div>
            ` : ''}

            ${showDoctorInfo ? `
              <div style="text-align: left;" dir="ltr">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${safeDocName || 'Laboratory Director'}</div>
                <div style="font-size: 11px; color: #64748b;">${safeDocTitle || 'Consultant Clinical Pathologist'}</div>
                <div style="font-size: 10px; color: #94a3b8;">License: ${safeLicense || 'MOH-2026'}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>`;
  };

  // Shared Helper: Patient Demographics Box
  const renderPatientMetaBox = (safePatientName: string, safeDoctorName: string) => {
    if (!showPatientBox) return '';
    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; position: relative; z-index: 1;">
        <div><span style="color: #64748b;">اسم المريض:</span> <strong>${safePatientName}</strong></div>
        <div><span style="color: #64748b;">العمر / الجنس:</span> <strong>${toEnglishDigits(patient.age) || '-'} سنة / ${patient.gender === 'FEMALE' ? 'Female' : 'Male'}</strong></div>
        <div><span style="color: #64748b;">رقم العينة:</span> <strong style="color: ${primaryCol};">#${toEnglishDigits(sample.sampleNumber)}</strong></div>
        <div><span style="color: #64748b;">الطبيب المعالج:</span> <strong>${safeDoctorName}</strong></div>
        <div><span style="color: #64748b;">تاريخ الفحص:</span> <strong>${formatEnglishDate(sample.createdAt)}</strong></div>
        <div><span style="color: #64748b;">حالة التقرير:</span> <strong style="color: #16a34a;">معتمد نهائي (Verified)</strong></div>
      </div>`;
  };

  // Shared Helper: Legal Accreditation Footer
  const renderFooter = (safeFooter: string, safeLabName: string) => {
    if (!showFooter) return '';
    return `
      <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b; position: relative; z-index: 1;">
        <div>
          <div>${safeFooter || 'تم فحص وتدقيق التقرير إلكترونياً وهو معتمد رسمياً.'}</div>
          ${isPreprinted || !showLabName ? '' : `<div style="margin-top: 2px; color: #94a3b8;">${safeLabName} • تشخيص مخبري معتمد</div>`}
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          ${qrEnabled && qrPosition === 'FOOTER' ? `
            <div style="text-align: center;">
              ${qrSvg}
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">تحقق إلكتروني</div>
            </div>
          ` : ''}
          ${showFooterSignature ? `
            <div style="font-weight: 700; color: #0f172a; text-align: left;" dir="ltr">
              <div>Approved by Clinical Pathologist</div>
              <div style="font-size: 9px; color: #64748b;">Labryo Clinical LIS Validated</div>
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
      .abnormal-badge { border: 1.5px solid #000000 !important; color: #000000 !important; background: transparent !important; }
    `;
  }

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

  const renderedPages: string[] = [];

  // Helper: Clinical Finding Badge with strict Left-to-Right layout and Bidi isolation
  const renderClinicalFindingBadge = (p: string, forceAbnormal = false) => {
    const upper = p.toUpperCase();
    const isBloodGroupFinding = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'A POSITIVE', 'B POSITIVE', 'O POSITIVE', 'AB POSITIVE'].some(bg => upper.includes(bg));
    const isAbn = !isBloodGroupFinding && (forceAbnormal || 
      p.includes('1+') || p.includes('2+') || p.includes('3+') || p.includes('4+') || 
      p.includes('Positive') || p.includes('+++') || p.includes('++') || 
      p.includes('Full') || p.includes('Bloody') || 
      p.includes('15-20') || p.includes('25-35') || p.includes('30-40') || p.includes('40-50'));

    const colonIdx = p.indexOf(':');
    let innerHtml = '';
    if (colonIdx > 0) {
      const key = p.substring(0, colonIdx).trim();
      const val = p.substring(colonIdx + 1).trim();
      innerHtml = `<span style="color: ${isAbn ? '#991b1b' : '#64748b'}; font-weight: 700; white-space: nowrap;">${escapeHtml(key)}:</span> <span style="color: ${isAbn ? '#b91c1c' : '#0f172a'}; font-weight: 800; unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(toEnglishDigits(val))}</span>`;
    } else {
      innerHtml = `<span style="color: ${isAbn ? '#b91c1c' : '#0f172a'}; font-weight: 800; unicode-bidi: isolate;">${escapeHtml(toEnglishDigits(p))}</span>`;
    }

    const bg = isAbn ? '#fef2f2' : '#f8fafc';
    const bdr = isAbn ? '#fca5a5' : '#e2e8f0';

    return `<div style="background: ${bg}; border: 1px solid ${bdr}; padding: 6px 10px; border-radius: 4px; font-size: 11.5px; text-align: left; direction: ltr; unicode-bidi: isolate; display: flex; align-items: center; justify-content: flex-start;">${innerHtml}</div>`;
  };

  // 1. General Laboratory Tests (Blood, Chemistry, Hormones, etc.)
  if (shouldRenderGeneral) {
    const hasAnyGeneralPrior = generalTests.some((t: any) => {
      const code = (t.test?.code || t.testCode || t.test?.name || '').toUpperCase();
      return priorSamples.some(ps => (ps.tests || []).some((x: any) => {
        const c = (x.test?.code || x.testCode || x.test?.name || '').toUpperCase();
        return (c && c === code) || (t.testId && x.testId === t.testId);
      }));
    });

    const generalRows = generalTests.map((t: any) => {
      const isBloodGroup = isBloodGroupTest(t.test || t);
      const isAbnormal = isBloodGroup ? false : t.isAbnormal;
      let displayValue = t.resultValue ? escapeHtml(toEnglishDigits(t.resultValue)) : '<span style="color:#94a3b8;">Pending</span>';
      const testName = escapeHtml(t.test?.name || t.testCode || 'Test');
      const testUnit = escapeHtml(t.test?.unit || '-');
      const testRef = escapeHtml(t.test?.refRangeText || '-');

      let priorValDisplay = '-';
      if (hasAnyGeneralPrior) {
        const testCode = (t.test?.code || t.testCode || t.test?.name || '').toUpperCase();
        for (const ps of priorSamples) {
          const pt = (ps.tests || []).find((x: any) => {
            const c = (x.test?.code || x.testCode || x.test?.name || '').toUpperCase();
            return (c && c === testCode) || (t.testId && x.testId === t.testId);
          });
          if (pt && pt.resultValue && String(pt.resultValue).trim() !== '') {
            priorValDisplay = `${escapeHtml(toEnglishDigits(pt.resultValue))} <span style="font-size: 9px; color: #64748b; font-weight: 600;">(${formatEnglishDate(ps.createdAt)})</span>`;
            break;
          }
        }
      }

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
                      const isS = item.includes(': S');
                      const isR = item.includes(': R');
                      const bg = isS ? '#f0fdf4' : isR ? '#fef2f2' : '#fffbeb';
                      const col = isS ? '#15803d' : isR ? '#b91c1c' : '#b45309';
                      const bdr = isS ? '#bbf7d0' : isR ? '#fca5a5' : '#fde68a';
                      return `<div style="background: ${bg}; color: ${col}; font-weight: 700; padding: 3px 6px; border-radius: 4px; border: 1px solid ${bdr};">${escapeHtml(item)}</div>`;
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

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <td style="padding: 10px 12px; font-weight: 800; color: #0f172a; text-align: left;">
            ${testName}
          </td>
          <td style="padding: 10px 12px; font-weight: 700; color: ${isAbnormal ? '#dc2626' : '#0f172a'}; text-align: left;">
            ${displayValue}
          </td>
          ${hasAnyGeneralPrior ? `
            <td style="padding: 10px 12px; color: #475569; font-weight: 700; text-align: left;">
              ${priorValDisplay}
            </td>
          ` : ''}
          <td style="padding: 10px 12px; color: #475569; font-weight: 600; text-align: left;">${testUnit}</td>
          <td style="padding: 10px 12px; color: #334155; font-weight: 600; text-align: left;">${testRef}</td>
        </tr>`;
    }).join('');

    renderedPages.push(`
      <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
        ${renderWatermark()}
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        <table dir="ltr" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: left;">
          <thead>
            <tr class="table-header" style="background: #0f172a; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: left; border-radius: 6px 0 0 0;">INVESTIGATION</th>
              <th style="padding: 8px 12px; text-align: left;">RESULT</th>
              ${hasAnyGeneralPrior ? `<th style="padding: 8px 12px; text-align: left;">PREVIOUS (النتيجة السابقة)</th>` : ''}
              <th style="padding: 8px 12px; text-align: left;">UNIT</th>
              <th style="padding: 8px 12px; text-align: left; border-radius: 0 6px 0 0;">REFERENCE RANGE</th>
            </tr>
          </thead>
          <tbody>
            ${generalRows}
          </tbody>
        </table>
        ${renderFooter(safeFooter, safeLabName)}
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
  for (const ps of priorSamples) {
    const pCbc = (ps.tests || []).find((t: any) => isCbcTest(t.test || t));
    if (pCbc && pCbc.resultValue && String(pCbc.resultValue).trim() !== '') {
      priorCbcParsed = parseCbcData(String(pCbc.resultValue));
      priorCbcDate = formatEnglishDate(ps.createdAt);
      break;
    }
  }

  const renderCbcRow = (name: string, val: string, unit: string, ref: string, low: number, high: number, priorVal?: string) => {
    const num = parseFloat(val);
    const hasVal = val && val !== '-';
    const isAbn = hasVal && !isNaN(num) && (num < low || num > high);
    const flag = isAbn ? (num < low ? ' (L)' : ' (H)') : '';
    const col = isAbn ? '#dc2626' : '#0f172a';
    const hasPrior = priorVal && priorVal !== '-';
    return `
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
        <td style="padding: 7px 10px; font-weight: 700; color: #1e293b; text-align: left;">${name}</td>
        <td style="padding: 7px 10px; font-weight: 800; color: ${col}; text-align: left;">
          ${hasVal ? escapeHtml(val) : '<span style="color:#94a3b8;">Pending</span>'}${flag ? `<span style="font-size: 10px; font-weight: 900; color: #dc2626; margin-left: 3px;">${flag}</span>` : ''}
        </td>
        ${priorCbcParsed ? `
          <td style="padding: 7px 10px; font-weight: 700; color: #475569; text-align: left;">
            ${hasPrior ? escapeHtml(priorVal!) : '-'}
          </td>
        ` : ''}
        <td style="padding: 7px 10px; color: #64748b; font-weight: 600; text-align: left;">${unit}</td>
        <td style="padding: 7px 10px; color: #334155; font-weight: 600; text-align: left;">${ref}</td>
      </tr>`;
  };

  const renderDiffRow = (name: string, pctStr: string, refPct: string, low: number, high: number, wbcVal: number, priorPct?: string) => {
    const num = parseFloat(pctStr);
    const hasVal = pctStr && pctStr !== '-';
    const isAbn = hasVal && !isNaN(num) && (num < low || num > high);
    const flag = isAbn ? (num < low ? ' (L)' : ' (H)') : '';
    const col = isAbn ? '#dc2626' : '#0f172a';
    const absVal = hasVal && !isNaN(num) && wbcVal > 0 ? ((wbcVal * num) / 100).toFixed(2) : '-';
    const hasPrior = priorPct && priorPct !== '-';
    return `
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
        <td style="padding: 7px 10px; font-weight: 700; color: #1e293b; text-align: left;">${name}</td>
        <td style="padding: 7px 10px; font-weight: 800; color: ${col}; text-align: left;">
          ${hasVal ? `${escapeHtml(pctStr)} %` : '<span style="color:#94a3b8;">Pending</span>'}${flag ? `<span style="font-size: 10px; font-weight: 900; color: #dc2626; margin-left: 3px;">${flag}</span>` : ''}
        </td>
        ${priorCbcParsed ? `
          <td style="padding: 7px 10px; font-weight: 700; color: #475569; text-align: left;">
            ${hasPrior ? `${escapeHtml(priorPct!)} %` : '-'}
          </td>
        ` : ''}
        <td style="padding: 7px 10px; font-weight: 700; color: #0284c7; text-align: left;">
          ${absVal !== '-' ? `${absVal} <span style="font-size: 9.5px; color: #64748b; font-weight: 600;">10^3/uL</span>` : '-'}
        </td>
        <td style="padding: 7px 10px; color: #334155; font-weight: 600; text-align: left;">${refPct}</td>
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
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}

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

        ${renderFooter(safeFooter, safeLabName)}
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
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        
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
              ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          <!-- Chemical Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>CHEMICAL EXAMINATION</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
              ${chemicalParts.length > 0 ? chemicalParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          <!-- Microscopic Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>MICROSCOPIC EXAMINATION (HPF)</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;" dir="ltr">
              ${microParts.length > 0 ? microParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          ${noteText ? `
            <div style="background: #f8fafc; border-left: 4px solid ${primaryCol}; padding: 8px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
              <strong>Clinical Note:</strong> <span style="unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(noteText)}</span>
            </div>
          ` : ''}
        </div>

        ${renderFooter(safeFooter, safeLabName)}
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
    let microParts: string[] = [];
    let paraParts: string[] = [];
    let noteText = '';

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('PHYSICAL:')) {
        physicalParts = cleanLine.replace('PHYSICAL:', '').split('|').map(p => p.trim()).filter(Boolean);
      } else if (cleanLine.startsWith('FOBT:')) {
        fobtVal = cleanLine.replace('FOBT:', '').trim();
      } else if (cleanLine.startsWith('MICROSCOPIC:')) {
        microParts = cleanLine.replace('MICROSCOPIC:', '').split('|').map(p => p.trim()).filter(Boolean);
      } else if (cleanLine.startsWith('PARASITOLOGY:')) {
        const val = cleanLine.replace('PARASITOLOGY:', '').trim();
        if (val) paraParts.push(val);
      } else if (cleanLine.startsWith('NOTES:')) {
        noteText = cleanLine.replace('NOTES:', '').trim();
      }
    });

    renderedPages.push(`
      <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
        ${renderWatermark()}
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        
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
              ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

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
              ${microParts.length > 0 ? microParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          <!-- Parasitology & Helminths Section -->
          ${paraParts.length > 0 ? `
            <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #7e22ce; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
                <span>PARASITOLOGY &amp; HELMINTHS</span>
              </div>
              <div style="padding: 12px; font-size: 11.5px;" dir="ltr">
                ${paraParts.map(p => renderClinicalFindingBadge(p, !p.startsWith('Nil'))).join('')}
              </div>
            </div>
          ` : ''}

          ${noteText ? `
            <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 8px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
              <strong>Clinical Note:</strong> <span style="unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(noteText)}</span>
            </div>
          ` : ''}
        </div>

        ${renderFooter(safeFooter, safeLabName)}
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
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        
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
              ${physicalParts.length > 0 ? physicalParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          <!-- 2. Sperm Count & Microscopy -->
          <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #4338ca; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>2. SPERM COUNT &amp; MICROSCOPY <span style="font-size: 10px; font-weight: normal; color: #64748b; margin-left: 6px;">(Ref: Conc &ge; 15 M/mL, Total &ge; 39 M/ejac, Pus &lt; 5 /HPF)</span></span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
              ${countParts.length > 0 ? countParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          <!-- 3. Motility Assessment -->
          <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #0284c7; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>3. SPERM MOTILITY ASSESSMENT <span style="font-size: 10px; font-weight: normal; color: #64748b; margin-left: 6px;">(WHO Ref: PR &ge; 32%, PR+NP &ge; 40%, Vitality &ge; 58%)</span></span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
              ${motilityParts.length > 0 ? motilityParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
            </div>
          </div>

          <!-- 4. Morphology -->
          <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 6px 12px; font-weight: 800; font-size: 11.5px; color: #7c3aed; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
              <span>4. SPERM MORPHOLOGY <span style="font-size: 10px; font-weight: normal; color: #64748b; margin-left: 6px;">(Kruger Strict Criteria Ref: Normal Forms &ge; 4%)</span></span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; font-size: 11px;" dir="ltr">
              ${morphologyParts.length > 0 ? morphologyParts.map(p => renderClinicalFindingBadge(p)).join('') : '<div style="color: #94a3b8; text-align: left;">Pending</div>'}
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

          <!-- Laboratory Notes -->
          ${noteText ? `
            <div style="background: #f8fafc; border-left: 4px solid #4338ca; padding: 6px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0; text-align: left; direction: ltr;">
              <strong>Laboratory Notes:</strong> <span style="unicode-bidi: isolate; margin-left: 4px;">${escapeHtml(noteText)}</span>
            </div>
          ` : ''}
        </div>

        ${renderFooter(safeFooter, safeLabName)}
      </div>
    `);
    }
  }

  // Fallback if empty
  if (renderedPages.length === 0) {
    renderedPages.push(`
      <div class="${containerClass}">
        ${renderWatermark()}
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        <div style="padding: 30px; text-align: center; color: #64748b; font-size: 13px;">
          لا توجد فحوصات مسجلة لهذه العينة.
        </div>
        ${renderFooter(safeFooter, safeLabName)}
      </div>
    `);
  }

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Medical Report #${sample.sampleNumber} - ${safePatientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
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
      margin: 0 auto 24px auto;
      padding: 24px;
      position: relative;
      background: #ffffff;
      box-shadow: ${showReportBorder ? '0 4px 15px rgba(0,0,0,0.05)' : 'none'};
      border-radius: ${showReportBorder ? '8px' : '0'};
      overflow: hidden;
      ${!showReportBorder ? 'border: none !important;' : ''}
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
        padding: 0 !important; 
        width: 100% !important; 
        max-width: none !important; 
        margin: 0 !important; 
        border-radius: 0 !important; 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
        color-adjust: exact !important; 
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
      <button class="btn-print" onclick="window.print()">طباعة التقرير (Print A4)</button>
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