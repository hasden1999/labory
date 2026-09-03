import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';

// Standard Code 128B pattern widths (bar, space, bar, space, bar, space)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104=StartB, 106=Stop)
];

function generateCode128Svg(text: string, height: number = 32): string {
  const cleanText = text.replace(/[^\x20-\x7E]/g, '');
  const startCode = 104; // Start B
  let checksum = startCode;
  const codes: number[] = [startCode];

  for (let i = 0; i < cleanText.length; i++) {
    const codeVal = cleanText.charCodeAt(i) - 32;
    codes.push(codeVal);
    checksum += codeVal * (i + 1);
  }

  const checkCode = checksum % 103;
  codes.push(checkCode);
  codes.push(106); // Stop pattern

  // Convert codes to modules
  let modules = '';
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      const isBar = j % 2 === 0;
      modules += (isBar ? '1' : '0').repeat(width);
    }
  }

  const moduleWidth = 1.35;
  const totalWidth = modules.length * moduleWidth;

  let rects = '';
  let currentX = 0;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${moduleWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
    currentX += moduleWidth;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(2)} ${height}" width="${totalWidth.toFixed(2)}" height="${height}" style="display:block; margin: 0 auto;">${rects}</svg>`;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

  if (!sample) {
    return new Response('<h2>Sample Not Found (العينة غير موجودة)</h2>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const settings = store.settings;
  const patient = sample.patient || { name: 'مريض غير محدد', age: null, gender: 'MALE', phone: '' };
  const barcodeValue = `S${sample.sampleNumber}`;
  const barcodeSvg = generateCode128Svg(barcodeValue, 30);
  
  const testNames = (sample.tests || [])
    .map((t: any) => t.test?.code || t.test?.name || t.testId)
    .filter(Boolean)
    .join(', ');

  const dateStr = new Date(sample.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = new Date(sample.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>ملصق أنبوب العينة #${sample.sampleNumber} - ${patient.name}</title>
  <style>
    @page {
      size: 50mm 25mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #000000;
      width: 50mm;
      height: 25mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      padding: 1.2mm 2.2mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-row {
      display: flex;
      justifyContent: space-between;
      align-items: baseline;
      border-bottom: 0.5px solid #000;
      padding-bottom: 0.5mm;
      line-height: 1;
    }
    .lab-title {
      font-size: 6.5pt;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 32mm;
    }
    .sample-num {
      font-size: 7.5pt;
      font-weight: 900;
      direction: ltr;
      font-family: monospace;
    }
    .patient-row {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      margin-top: 0.5mm;
      line-height: 1.1;
    }
    .patient-name {
      font-size: 7pt;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 34mm;
    }
    .patient-meta {
      font-size: 6pt;
      font-weight: 700;
      direction: ltr;
    }
    .barcode-container {
      text-align: center;
      margin: 0.3mm 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .barcode-svg-wrap {
      width: 100%;
      height: 7.5mm;
      display: flex;
      justifyContent: center;
      align-items: center;
    }
    .barcode-svg-wrap svg {
      width: 100% !important;
      max-height: 7.5mm !important;
    }
    .barcode-text {
      font-size: 5.5pt;
      font-weight: 800;
      letter-spacing: 1.2px;
      font-family: monospace;
      margin-top: -0.3mm;
      direction: ltr;
    }
    .footer-row {
      display: flex;
      justifyContent: space-between;
      align-items: flex-end;
      border-top: 0.5px solid #000;
      padding-top: 0.4mm;
      line-height: 1;
      font-size: 5.5pt;
    }
    .tests-summary {
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 32mm;
    }
    .timestamp {
      direction: ltr;
      font-size: 5pt;
      color: #222;
      font-weight: 600;
    }
    .stat-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: 5pt;
      font-weight: 900;
      padding: 0 1.5mm;
      border-radius: 1mm;
      margin-right: 1mm;
    }
    .no-print-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: #fff;
      padding: 8px 16px;
      display: flex;
      justifyContent: space-between;
      align-items: center;
      font-size: 13px;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
    }
    .print-btn {
      background: #00d2d3;
      color: #090d16;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-weight: 800;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 1.2mm 2.2mm !important;
      }
    }
  </style>
</head>
<body>

  <div class="header-row">
    <div class="lab-title">${settings.labName || 'Labryo Clinical LIS'}</div>
    <div class="sample-num">
      ${sample.isUrgent ? '<span class="stat-badge">STAT</span>' : ''}#${sample.sampleNumber}
    </div>
  </div>

  <div class="patient-row">
    <div class="patient-name">${patient.name}</div>
    <div class="patient-meta">${patient.age ? patient.age + 'y' : '-'} / ${patient.gender === 'FEMALE' ? 'F' : 'M'}</div>
  </div>

  <div class="barcode-container">
    <div class="barcode-svg-wrap">
      ${barcodeSvg}
    </div>
    <div class="barcode-text">*${barcodeValue}*</div>
  </div>

  <div class="footer-row">
    <div class="tests-summary" title="${testNames}">
      ${testNames || 'Routine Lab Tests'}
    </div>
    <div class="timestamp">
      ${dateStr} ${timeStr}
    </div>
  </div>

  <div class="no-print-bar">
    <span>ملصق أنابيب حراري (50mm × 25mm Thermal Label)</span>
    <button class="print-btn" onclick="window.print()">طباعة الملصق الآن (Print Label)</button>
  </div>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
