import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';
import { INITIAL_TESTS_CATALOG, TestItem } from '../../../../../lib/catalogData';

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

interface TestPartitionItem {
  code: string;
  name: string;
}

interface TubePartition {
  deptId: string;
  deptName: string;
  tubeType: string;
  tubeColorArabic: string;
  tubeColorName: string;
  badgeBg: string;
  tests: TestPartitionItem[];
}

function classifyTestToTube(
  testObj: any,
  catalogMap: Map<string, TestItem>
): { deptId: string; deptName: string; tubeType: string; tubeColorArabic: string; tubeColorName: string; badgeBg: string; code: string; name: string } {
  const testId = testObj.testId || testObj.test?.id || '';
  const rawCode = (testObj.test?.code || testObj.code || testObj.test?.name || testId).trim();
  const catalogEntry = catalogMap.get(testId) || catalogMap.get(rawCode.toUpperCase());

  const code = (catalogEntry?.code || testObj.test?.code || rawCode).toUpperCase();
  const name = catalogEntry?.name || testObj.test?.name || testObj.name || code;
  const category = (catalogEntry?.category || testObj.test?.category || '').toLowerCase();
  const sampleType = (catalogEntry?.sampleType || testObj.test?.sampleType || '').toLowerCase();

  // 1. Coagulation / Citrate (Sodium Citrate - Light Blue)
  if (
    ['PT-INR', 'PT', 'PTT', 'DDIMER', 'INR', 'FIBRINOGEN'].includes(code) ||
    sampleType.includes('citrate') ||
    sampleType.includes('سترات')
  ) {
    return {
      deptId: 'COAGULATION',
      deptName: 'تخثر وسيولة الدم',
      tubeType: 'سترات Citrate',
      tubeColorArabic: 'أزرق',
      tubeColorName: 'أزرق (Blue)',
      badgeBg: '#0284c7',
      code,
      name
    };
  }

  // 2. Hematology / EDTA (EDTA Whole Blood - Lavender/Purple)
  if (
    ['CBC', 'HB', 'PLT', 'ESR', 'BG', 'HBA1C', 'WBC', 'RBC', 'PCV'].includes(code) ||
    sampleType.includes('edta') ||
    (sampleType.includes('دم كامل') && !sampleType.includes('citrate')) ||
    category.includes('أمراض الدم')
  ) {
    if (['FER', 'IRON', 'TIBC'].includes(code)) {
      return {
        deptId: 'CHEMISTRY',
        deptName: 'الكيمياء والمصل',
        tubeType: 'سيروم جل Serum',
        tubeColorArabic: 'أصفر',
        tubeColorName: 'أصفر (Yellow)',
        badgeBg: '#d97706',
        code,
        name
      };
    }
    return {
      deptId: 'HEMATOLOGY',
      deptName: 'أمراض الدم (Hematology)',
      tubeType: 'EDTA دم كامل',
      tubeColorArabic: 'بنفسجي',
      tubeColorName: 'بنفسجي (Purple)',
      badgeBg: '#7c3aed',
      code,
      name
    };
  }

  // 3. Urinalysis / Urine Container
  if (
    ['GUE', 'MALB', 'URINE-PROT', 'BENCE-JONES'].includes(code) ||
    sampleType.includes('إدرار') ||
    sampleType.includes('بول') ||
    sampleType.includes('urine') ||
    category.includes('إدرار')
  ) {
    return {
      deptId: 'URINE',
      deptName: 'فحص الإدرار (G.U.E)',
      tubeType: 'إدرار معقم',
      tubeColorArabic: 'إدرار',
      tubeColorName: 'عبوة صفراء',
      badgeBg: '#b45309',
      code,
      name
    };
  }

  // 4. Stool Examination / Stool Container
  if (
    ['GSE', 'FOBT', 'HP-AG', 'STOOL-CULTURE'].includes(code) ||
    sampleType.includes('خروج') ||
    sampleType.includes('براز') ||
    sampleType.includes('stool') ||
    category.includes('خروج')
  ) {
    return {
      deptId: 'STOOL',
      deptName: 'فحص الخروج (G.S.E)',
      tubeType: 'خروج معقم',
      tubeColorArabic: 'خروج',
      tubeColorName: 'عبوة بنية',
      badgeBg: '#92400e',
      code,
      name
    };
  }

  // 5. Seminal Fluid / Sterile Cup
  if (
    ['SFA', 'SEMEN'].includes(code) ||
    sampleType.includes('سائل منوي') ||
    sampleType.includes('semen') ||
    category.includes('سائل منوي')
  ) {
    return {
      deptId: 'SEMEN',
      deptName: 'تحليل السائل المنوي (SFA)',
      tubeType: 'سائل معقم',
      tubeColorArabic: 'منوي',
      tubeColorName: 'عبوة معقمة',
      badgeBg: '#059669',
      code,
      name
    };
  }

  // 6. Hormones, Serology, Immunology, Vitamins, Tumor Markers
  if (
    category.includes('غدة') ||
    category.includes('هرمون') ||
    category.includes('مناعة') ||
    category.includes('أمصال') ||
    category.includes('فيتامين') ||
    category.includes('معادن') ||
    category.includes('أورام') ||
    [
      'TSH', 'FT4', 'FT3', 'PRL', 'FSH', 'LH', 'TESTO', 'BHCG', 'AMH',
      'VITD', 'VITB12', 'CALC', 'PHOS', 'MG', 'ZINC', 'CRP', 'RF', 'ASO',
      'ROSE', 'WIDAL', 'HBSAG', 'HCV', 'HIV', 'PSA-TOT', 'CEA', 'CA125',
      'CA19-9', 'CA15-3', 'AFP', 'FER', 'IRON', 'TIBC', 'INSULIN', 'CPEPTIDE'
    ].includes(code)
  ) {
    return {
      deptId: 'HORMONES_IMMUNO',
      deptName: 'الهرمونات والمناعة',
      tubeType: 'سيروم جل Serum',
      tubeColorArabic: 'أصفر',
      tubeColorName: 'أصفر (Yellow)',
      badgeBg: '#0891b2',
      code,
      name
    };
  }

  // 7. Clinical Chemistry, Liver, Renal, Lipids, Cardiac (Serum Gel - Yellow)
  return {
    deptId: 'CHEMISTRY',
    deptName: 'الكيمياء والدهون',
    tubeType: 'سيروم جل Serum',
    tubeColorArabic: 'أصفر',
    tubeColorName: 'أصفر (Yellow)',
    badgeBg: '#d97706',
    code,
    name
  };
}

function partitionSampleTests(sampleTests: any[], catalogTests: TestItem[]): TubePartition[] {
  const catalogMap = new Map<string, TestItem>();
  for (const item of catalogTests) {
    catalogMap.set(item.id, item);
    catalogMap.set(item.code.toUpperCase(), item);
  }

  if (!sampleTests || sampleTests.length === 0) {
    return [
      {
        deptId: 'ROUTINE',
        deptName: 'الفحوصات العامة',
        tubeType: 'سيروم جل Serum',
        tubeColorArabic: 'أصفر',
        tubeColorName: 'أصفر (Yellow)',
        badgeBg: '#0f766e',
        tests: [{ code: 'ROUTINE', name: 'Routine Tests' }]
      }
    ];
  }

  const partitionsMap = new Map<string, TubePartition>();

  for (const testObj of sampleTests) {
    const classified = classifyTestToTube(testObj, catalogMap);
    if (!partitionsMap.has(classified.deptId)) {
      partitionsMap.set(classified.deptId, {
        deptId: classified.deptId,
        deptName: classified.deptName,
        tubeType: classified.tubeType,
        tubeColorArabic: classified.tubeColorArabic,
        tubeColorName: classified.tubeColorName,
        badgeBg: classified.badgeBg,
        tests: []
      });
    }

    const partition = partitionsMap.get(classified.deptId)!;
    if (!partition.tests.some(t => t.code === classified.code)) {
      partition.tests.push({ code: classified.code, name: classified.name });
    }
  }

  const order = ['HEMATOLOGY', 'COAGULATION', 'CHEMISTRY', 'HORMONES_IMMUNO', 'URINE', 'STOOL', 'SEMEN', 'ROUTINE'];
  const sortedPartitions = Array.from(partitionsMap.values()).sort((a, b) => {
    const idxA = order.indexOf(a.deptId);
    const idxB = order.indexOf(b.deptId);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  const finalPartitions: TubePartition[] = [];
  for (const part of sortedPartitions) {
    if (part.tests.length <= 10) {
      finalPartitions.push(part);
    } else {
      const chunkSize = 8;
      for (let i = 0; i < part.tests.length; i += chunkSize) {
        const chunkTests = part.tests.slice(i, i + chunkSize);
        const subIndex = Math.floor(i / chunkSize) + 1;
        const totalSub = Math.ceil(part.tests.length / chunkSize);
        finalPartitions.push({
          ...part,
          deptName: `${part.deptName} (${subIndex}/${totalSub})`,
          tests: chunkTests
        });
      }
    }
  }

  return finalPartitions;
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
  const patient = sample.patient || store.patients?.find(p => p.id === sample.patientId) || { id: sample.patientId || '', name: 'مريض غير محدد', age: null, gender: 'MALE', phone: '' };
  const patientRawId = patient.id || sample.patientId || '';
  const patientIdShort = patientRawId ? String(patientRawId).replace(/^pat-/, '') : String(sample.sampleNumber);
  const barcodeValue = `S${sample.sampleNumber}`;
  const barcodeSvg = generateCode128Svg(barcodeValue, 26);

  const catalogTests: TestItem[] = (store.tests && store.tests.length > 0) ? store.tests : INITIAL_TESTS_CATALOG;
  const partitions = partitionSampleTests(sample.tests || [], catalogTests);
  const totalTubes = partitions.length;

  const dateStr = new Date(sample.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = new Date(sample.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const labelPagesHtml = partitions.map((part, index) => {
    const tubeSeqText = `أنبوب ${index + 1}/${totalTubes}`;
    const testCodesText = part.tests.map(t => t.code).join(', ');
    const isContainer = ['إدرار', 'خروج', 'منوي'].includes(part.tubeColorArabic);
    const tubePrefix = isContainer ? 'عبوة' : 'أنبوب';
    const tubeColorBadgeText = `${tubePrefix} ${part.tubeColorArabic}`;

    return `
    <div class="label-wrapper" id="tube-wrapper-${index + 1}" data-tube-index="${index + 1}">
      <div class="screen-tube-header no-print">
        <div class="tube-title-badge" style="background: ${part.badgeBg};">
          <span>${tubeSeqText}: ${part.deptName}</span>
          <small>(${part.tubeType} - ${tubeColorBadgeText})</small>
        </div>
        <button type="button" class="btn-single-print" onclick="printSingleTube(${index + 1})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:3px;"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          طباعة هذا الملصق فقط (Print #${index + 1})
        </button>
      </div>

      <div class="label-page" id="label-page-${index + 1}">
        <div class="header-row">
          <div class="lab-title">${settings.labName || 'Labryo Clinical LIS'}</div>
          <div class="sample-meta-group">
            ${sample.isUrgent ? '<span class="stat-badge">STAT</span>' : ''}
            <span class="sample-num">#${sample.sampleNumber}</span>
            <span class="tube-seq">[${index + 1}/${totalTubes}]</span>
          </div>
        </div>

        <div class="tube-color-row">
          <div class="tube-badge-wrap">
            <span class="tube-color-tag">${tubeColorBadgeText}</span>
            <span class="dept-badge">${part.deptName}</span>
          </div>
          <span class="patient-id-tag">PID: #${patientIdShort}</span>
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
          <div class="tests-summary" title="${testCodesText}">
            ${testCodesText || 'Routine Lab Tests'}
          </div>
          <div class="timestamp">
            ${dateStr} ${timeStr}
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('\n');

  const filterTabsHtml = partitions.map((part, index) => {
    const isContainer = ['إدرار', 'خروج', 'منوي'].includes(part.tubeColorArabic);
    const labelPrefix = isContainer ? 'عبوة' : 'أنبوب';
    return `
    <button type="button" class="filter-tab" id="tab-btn-${index + 1}" onclick="showTube(${index + 1})">
      <span class="tab-dot" style="background: ${part.badgeBg};"></span>
      <span>${labelPrefix} ${index + 1}: ${part.tubeColorArabic} (${part.deptName.split(' ')[0]})</span>
      <small>(${part.tests.length})</small>
    </button>
  `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>ملصقات باركود الأنابيب #${sample.sampleNumber} (${totalTubes} ملصق حراري 50x25mm) - ${patient.name}</title>
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
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 70px 16px 32px 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .top-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      justifyContent: space-between;
      align-items: center;
      padding: 0 20px;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sample-title-tag {
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tubes-count-badge {
      background: rgba(0, 210, 211, 0.18);
      color: #00d2d3;
      border: 1px solid rgba(0, 210, 211, 0.4);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .tabs-group {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      max-width: 50vw;
    }
    .filter-tab {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .filter-tab:hover, .filter-tab.active {
      background: rgba(0, 210, 211, 0.15);
      border-color: #00d2d3;
      color: #ffffff;
    }
    .tab-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-print-all {
      background: #00d2d3;
      color: #090d16;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0, 210, 211, 0.35);
      transition: transform 0.1s ease;
    }
    .btn-print-all:hover {
      transform: translateY(-1px);
      filter: brightness(1.08);
    }

    /* Thermal Printer Guidance Card (Screen Only) */
    .printer-guidance-bar {
      width: 100%;
      max-width: 620px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(0, 210, 211, 0.25);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }
    .guidance-header {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .guidance-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .guidance-badge {
      background: #00d2d3;
      color: #090d16;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .guidance-dim {
      font-size: 11px;
      color: #cbd5e1;
    }
    .guidance-dim strong {
      color: #38bdf8;
    }
    .guidance-models {
      font-size: 10px;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.04);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .guidance-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }
    .guidance-step {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      background: rgba(255, 255, 255, 0.03);
      padding: 6px 8px;
      border-radius: 6px;
    }
    .step-num {
      width: 16px;
      height: 16px;
      background: rgba(0, 210, 211, 0.2);
      color: #00d2d3;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-info {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .step-info strong {
      font-size: 10px;
      color: #f1f5f9;
    }
    .step-info span {
      font-size: 9px;
      color: #94a3b8;
    }
    .step-info code {
      color: #38bdf8;
      font-family: monospace;
      font-weight: 700;
    }

    /* Screen Preview Stage */
    .preview-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      width: 100%;
      max-width: 620px;
    }
    .label-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .screen-tube-header {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      width: 50mm;
      transform: scale(1.4);
      transform-origin: bottom center;
      margin-bottom: 8px;
      padding: 0 2px;
    }
    .tube-title-badge {
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .tube-title-badge small {
      font-size: 8px;
      opacity: 0.9;
    }
    .btn-single-print {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f1f5f9;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .btn-single-print:hover {
      background: #00d2d3;
      color: #090d16;
      border-color: #00d2d3;
    }

    /* The Physical Label Layout (50mm x 25mm) */
    .label-page {
      width: 50mm;
      height: 24.4mm;
      max-width: 50mm;
      max-height: 24.4mm;
      background: #ffffff;
      color: #000000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      padding: 0.8mm 1.5mm;
      box-sizing: border-box;
      transform: scale(1.4);
      transform-origin: top center;
      margin-bottom: 24px;
      border-radius: 3px;
      box-shadow: 0 10px 25px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
      page-break-inside: avoid;
    }

    .header-row {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      line-height: 1;
      padding-bottom: 0.2mm;
      border-bottom: 0.5px solid #000000;
      height: 3.2mm;
    }
    .lab-title {
      font-size: 5.8pt;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 25mm;
    }
    .sample-meta-group {
      display: flex;
      align-items: center;
      gap: 0.8mm;
      direction: ltr;
    }
    .sample-num {
      font-size: 7.6pt;
      font-weight: 900;
      font-family: monospace;
      letter-spacing: 0.2px;
      color: #000000;
    }
    .tube-seq {
      font-size: 5.8pt;
      font-weight: 900;
      background: #000000;
      color: #ffffff;
      padding: 0.2mm 0.8mm;
      border-radius: 0.5mm;
    }
    .stat-badge {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      font-size: 5.0pt;
      font-weight: 900;
      padding: 0 1.0mm;
      border-radius: 0.5mm;
    }

    .tube-color-row {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      line-height: 1.1;
      margin-top: 0.2mm;
      height: 3.4mm;
    }
    .tube-badge-wrap {
      display: flex;
      align-items: center;
      gap: 0.8mm;
      overflow: hidden;
    }
    .tube-color-tag {
      font-size: 5.6pt;
      font-weight: 900;
      background: #000000;
      color: #ffffff;
      padding: 0.2mm 0.9mm;
      border-radius: 0.5mm;
      white-space: nowrap;
      display: inline-block;
      letter-spacing: 0.1px;
    }
    .dept-badge {
      font-size: 5.5pt;
      font-weight: 900;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 23mm;
    }
    .patient-id-tag {
      font-size: 5.4pt;
      font-weight: 900;
      color: #000000;
      font-family: monospace;
      direction: ltr;
      white-space: nowrap;
      letter-spacing: 0.2px;
    }

    .patient-row {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      line-height: 1;
      margin-top: 0.2mm;
      height: 2.8mm;
    }
    .patient-name {
      font-size: 6.6pt;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 32mm;
      color: #000000;
    }
    .patient-meta {
      font-size: 5.4pt;
      font-weight: 800;
      direction: ltr;
      font-family: monospace;
      color: #000000;
      white-space: nowrap;
    }

    .barcode-container {
      text-align: center;
      margin: 0.1mm 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .barcode-svg-wrap {
      width: 100%;
      height: 6.6mm;
      display: flex;
      justifyContent: center;
      align-items: center;
    }
    .barcode-svg-wrap svg {
      width: 100% !important;
      max-height: 6.6mm !important;
      shape-rendering: crispEdges !important;
    }
    .barcode-text {
      font-size: 5.0pt;
      font-weight: 900;
      letter-spacing: 1.1px;
      font-family: monospace;
      margin-top: -0.2mm;
      direction: ltr;
      color: #000000;
    }

    .footer-row {
      display: flex;
      justifyContent: space-between;
      align-items: flex-end;
      border-top: 0.5px solid #000000;
      padding-top: 0.2mm;
      line-height: 1.1;
      height: 3.4mm;
    }
    .tests-summary {
      font-weight: 900;
      direction: ltr;
      text-align: right;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 32mm;
      max-height: 3.2mm;
      font-size: 5.0pt;
      color: #000000;
    }
    .timestamp {
      direction: ltr;
      font-size: 4.6pt;
      color: #000000;
      font-weight: 800;
      white-space: nowrap;
    }

    @media print {
      @page {
        size: 50mm 25mm;
        margin: 0;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 50mm !important;
        height: auto !important;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print, .top-toolbar, .screen-tube-header, .printer-guidance-bar {
        display: none !important;
      }
      .preview-stage {
        display: block !important;
        max-width: 50mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .label-wrapper {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        break-after: page !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .label-wrapper:last-of-type {
        break-after: auto !important;
        page-break-after: auto !important;
      }
      .label-page {
        width: 50mm !important;
        height: 24.4mm !important;
        max-width: 50mm !important;
        max-height: 24.4mm !important;
        transform: none !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0.8mm 1.5mm !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      body.print-single-mode .label-wrapper:not(.print-active) {
        display: none !important;
      }
      body.print-single-mode .label-wrapper.print-active {
        break-after: auto !important;
        page-break-after: auto !important;
      }
    }
  </style>
</head>
<body>

  <div class="top-toolbar no-print">
    <div class="toolbar-left">
      <div class="sample-title-tag">
        <span>ملصقات أنابيب العينة #${sample.sampleNumber}</span>
        <span class="tubes-count-badge">${totalTubes} ملصقات حرارية</span>
      </div>
      <div class="tabs-group">
        <button type="button" class="filter-tab active" id="tab-all" onclick="showAllTubes()">
          <span>كافة الأنابيب (${totalTubes})</span>
        </button>
        ${filterTabsHtml}
      </div>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn-print-all" onclick="printAllTubes()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>طباعة كافة الملصقات (${totalTubes})</span>
      </button>
    </div>
  </div>

  <div class="printer-guidance-bar no-print">
    <div class="guidance-header">
      <div class="guidance-title-wrap">
        <span class="guidance-badge">طابعة ملصقات حرارية Thermal Label</span>
        <span class="guidance-dim">المقاس القياسي للأنابيب: <strong>50mm × 25mm</strong></span>
      </div>
      <div class="guidance-models">
        <span>متوافق مع: Zebra | Xprinter | TSC | Rongta | Gprinter</span>
      </div>
    </div>
    <div class="guidance-steps">
      <div class="guidance-step">
        <span class="step-num">1</span>
        <div class="step-info">
          <strong>حجم الورق (Paper size)</strong>
          <span>اختر <code>50mm × 25mm</code> أو تخصيص 2"×1"</span>
        </div>
      </div>
      <div class="guidance-step">
        <span class="step-num">2</span>
        <div class="step-info">
          <strong>الهوامش (Margins)</strong>
          <span>اضبطها على <code>بلا (None / 0mm)</code></span>
        </div>
      </div>
      <div class="guidance-step">
        <span class="step-num">3</span>
        <div class="step-info">
          <strong>الرؤوس والتذييلات (Headers/Footers)</strong>
          <span>إلغاء التحديد (غير مفعّل)</span>
        </div>
      </div>
      <div class="guidance-step">
        <span class="step-num">4</span>
        <div class="step-info">
          <strong>المقياس (Scale)</strong>
          <span>100% (الافتراضي بدون تصغير أو تكبير)</span>
        </div>
      </div>
    </div>
  </div>

  <div class="preview-stage" id="preview-stage">
    ${labelPagesHtml}
  </div>

  <script>
    function showAllTubes() {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      const allBtn = document.getElementById('tab-all');
      if (allBtn) allBtn.classList.add('active');

      document.querySelectorAll('.label-wrapper').forEach(w => {
        w.style.display = 'flex';
      });
    }

    function showTube(index) {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('tab-btn-' + index);
      if (activeBtn) activeBtn.classList.add('active');

      document.querySelectorAll('.label-wrapper').forEach(w => {
        const tubeIdx = parseInt(w.getAttribute('data-tube-index'), 10);
        if (tubeIdx === index) {
          w.style.display = 'flex';
        } else {
          w.style.display = 'none';
        }
      });
    }

    function printAllTubes() {
      document.body.classList.remove('print-single-mode');
      document.querySelectorAll('.label-wrapper').forEach(w => w.classList.remove('print-active'));
      showAllTubes();
      setTimeout(() => {
        window.print();
      }, 50);
    }

    function printSingleTube(index) {
      document.body.classList.add('print-single-mode');
      document.querySelectorAll('.label-wrapper').forEach(w => {
        const tubeIdx = parseInt(w.getAttribute('data-tube-index'), 10);
        if (tubeIdx === index) {
          w.classList.add('print-active');
        } else {
          w.classList.remove('print-active');
        }
      });
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove('print-single-mode');
          document.querySelectorAll('.label-wrapper').forEach(w => w.classList.remove('print-active'));
        }, 500);
      }, 50);
    }
  </script>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
