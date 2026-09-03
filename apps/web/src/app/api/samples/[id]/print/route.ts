import { NextResponse } from 'next/server';
import { getStore, clampMargin } from '../../../../../lib/serverStore';

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

  const verifyUrl = `http://localhost:3000/verify/${sample.id}`;
  const qrSvg = generateQrSvg(verifyUrl, 64);

  // Tests Categorization
  const allTests = sample.tests || [];

  const isGueTest = (t: any) => {
    const code = (t.test?.code || t.testCode || '').toUpperCase();
    const name = (t.test?.name || '').toLowerCase();
    const val = typeof t.resultValue === 'string' ? t.resultValue : '';
    return code === 'GUE' || val.includes('G.U.E') || name.includes('urine') || name.includes('إدرار') || (val.includes('PHYSICAL:') && !val.includes('G.S.E') && !val.includes('PARASITOLOGY:'));
  };

  const isGseTest = (t: any) => {
    const code = (t.test?.code || t.testCode || '').toUpperCase();
    const name = (t.test?.name || '').toLowerCase();
    const val = typeof t.resultValue === 'string' ? t.resultValue : '';
    return code === 'GSE' || val.includes('G.S.E') || name.includes('stool') || name.includes('خروج') || val.includes('PARASITOLOGY:');
  };

  const gueTests = allTests.filter(isGueTest);
  const gseTests = allTests.filter(isGseTest);
  const generalTests = allTests.filter((t: any) => !isGueTest(t) && !isGseTest(t));

  // Shared Helper: Digital or Pre-printed Header
  const renderHeader = (safeLabName: string, safeLabSubtitle: string, safeAddress: string, safePhone: string, safeDocName: string, safeDocTitle: string, safeLicense: string) => {
    if (isPreprinted) {
      return `<div style="height: 10px; margin-bottom: 10px;"></div>`;
    }
    return `
      <div class="header-border" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; margin-bottom: 16px;">
        <div style="text-align: right;">
          <h1 style="margin: 0; font-size: 20px; color: ${primaryCol}; font-weight: 900;">${safeLabName}</h1>
          <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">${safeLabSubtitle}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">العنوان: ${safeAddress} | هاتف: ${safePhone}</p>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          ${qrEnabled && qrPosition === 'HEADER' ? `
            <div style="text-align: center;">
              ${qrSvg}
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">تحقق إلكتروني</div>
            </div>
          ` : ''}

          <div style="text-align: left;" dir="ltr">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${safeDocName || 'Laboratory Director'}</div>
            <div style="font-size: 11px; color: #64748b;">${safeDocTitle || 'Consultant Clinical Pathologist'}</div>
            <div style="font-size: 10px; color: #94a3b8;">License: ${safeLicense || 'MOH-2026'}</div>
          </div>
        </div>
      </div>`;
  };

  // Shared Helper: Patient Demographics Box
  const renderPatientMetaBox = (safePatientName: string, safeDoctorName: string) => `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px;">
      <div><span style="color: #64748b;">اسم المريض:</span> <strong>${safePatientName}</strong></div>
      <div><span style="color: #64748b;">العمر / الجنس:</span> <strong>${patient.age || '-'} سنة / ${patient.gender === 'FEMALE' ? 'أنثى (Female)' : 'ذكر (Male)'}</strong></div>
      <div><span style="color: #64748b;">رقم العينة:</span> <strong style="color: ${primaryCol};">#${sample.sampleNumber}</strong></div>
      <div><span style="color: #64748b;">الطبيب المعالج:</span> <strong>${safeDoctorName}</strong></div>
      <div><span style="color: #64748b;">تاريخ الفحص:</span> <strong>${new Date(sample.createdAt).toLocaleDateString('ar-IQ')}</strong></div>
      <div><span style="color: #64748b;">حالة التقرير:</span> <strong style="color: #16a34a;">معتمد نهائي (Verified)</strong></div>
    </div>`;

  // Shared Helper: Legal Accreditation Footer
  const renderFooter = (safeFooter: string, safeLabName: string) => `
    <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b;">
      <div>
        <div>${safeFooter || 'تم فحص وتدقيق التقرير إلكترونياً وهو معتمد رسمياً.'}</div>
        ${isPreprinted ? '' : `<div style="margin-top: 2px; color: #94a3b8;">${safeLabName} • تشخيص مخبري معتمد</div>`}
      </div>

      <div style="display: flex; align-items: center; gap: 14px;">
        ${qrEnabled && qrPosition === 'FOOTER' ? `
          <div style="text-align: center;">
            ${qrSvg}
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">تحقق إلكتروني</div>
          </div>
        ` : ''}
        <div style="font-weight: 700; color: #0f172a; text-align: left;" dir="ltr">
          <div>Approved by Clinical Pathologist</div>
          <div style="font-size: 9px; color: #64748b;">Labryo Clinical LIS Validated</div>
        </div>
      </div>
    </div>`;

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

  // 1. General Laboratory Tests (Blood, Chemistry, Hormones, etc.)
  if (generalTests.length > 0) {
    const generalRows = generalTests.map((t: any) => {
      let displayValue = t.resultValue ? escapeHtml(t.resultValue) : '<span style="color:#94a3b8;">Pending (قيد الفحص)</span>';
      const testName = escapeHtml(t.test?.name || t.testCode || 'Test');
      const testArabic = escapeHtml(t.test?.arabicName || '');
      const testUnit = escapeHtml(t.test?.unit || '-');
      const testRef = escapeHtml(t.test?.refRangeText || '-');
      const isAbnormal = t.isAbnormal;

      if (typeof t.resultValue === 'string' && (t.resultValue.includes('CBC') || t.resultValue.includes('ERYTHROID:') || t.resultValue.includes('DIFFERENTIAL:'))) {
        const clean = t.resultValue.replace(/\[.*?CBC.*?\]/gi, '').trim();
        const lines = clean.split('\n').filter(Boolean);
        let contentHtml = '';
        lines.forEach((line: string) => {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('ERYTHROID:') || cleanLine.startsWith('PLATELETS:') || cleanLine.startsWith('DIFFERENTIAL:')) {
            const colonIdx = cleanLine.indexOf(':');
            const title = cleanLine.substring(0, colonIdx);
            const body = cleanLine.substring(colonIdx + 1).trim();
            const items = body.split('|').map(p => p.trim());
            contentHtml += `
              <div style="margin-bottom: 6px;">
                <div style="font-size: 11px; font-weight: 800; color: #e11d48; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">${escapeHtml(title)}</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 11px;">
                  ${items.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${escapeHtml(p)}</div>`).join('')}
                </div>
              </div>`;
          } else {
            contentHtml += `<div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 4px;">${escapeHtml(cleanLine)}</div>`;
          }
        });
        displayValue = `<div style="text-align: left; background: #fff1f2; padding: 8px 12px; border-radius: 8px; border: 1px solid #fecdd3; max-width: 520px; margin: 4px 0;">${contentHtml}</div>`;
      } else if (typeof t.resultValue === 'string' && (t.resultValue.includes('MICROBIOLOGY') || t.resultValue.includes('ANTIBIOGRAM:'))) {
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
            <div style="font-size: 11px; color: #64748b; font-weight: normal;">${testArabic}</div>
          </td>
          <td style="padding: 10px 12px; font-weight: 700; color: ${isAbnormal ? '#dc2626' : '#0f172a'}; text-align: left;">
            ${displayValue}
          </td>
          <td style="padding: 10px 12px; color: #475569; font-weight: 600; text-align: left;">${testUnit}</td>
          <td style="padding: 10px 12px; color: #334155; font-weight: 600; text-align: left;">${testRef}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: ${isAbnormal ? '#dc2626' : '#16a34a'}; font-weight: 700; text-align: left;">
            ${isAbnormal ? 'ABNORMAL' : 'NORMAL'}
          </td>
        </tr>`;
    }).join('');

    renderedPages.push(`
      <div class="${containerClass} ${renderedPages.length > 0 ? 'page-break' : ''}">
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        <table dir="ltr" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: left;">
          <thead>
            <tr class="table-header" style="background: #0f172a; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: left; border-radius: 6px 0 0 0;">Test Name / Investigation (اسم التحليل)</th>
              <th style="padding: 8px 12px; text-align: left;">Result (النتيجة)</th>
              <th style="padding: 8px 12px; text-align: left;">Unit (الوحدة)</th>
              <th style="padding: 8px 12px; text-align: left;">Reference Range (المجال الطبيعي)</th>
              <th style="padding: 8px 12px; text-align: left; border-radius: 0 6px 0 0;">Status (الحالة)</th>
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

  // 2. Dedicated General Urine Examination (G.U.E) Page
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
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        
        <div style="background: ${primaryCol}; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
          <span>GENERAL URINE EXAMINATION (G.U.E)</span>
          <span style="font-size: 12px; font-weight: normal;" dir="rtl">تقرير فحص الإدرار العام الميكروسكوبي</span>
        </div>

        <div style="margin-bottom: 16px;">
          <!-- Physical Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
              <span>PHYSICAL EXAMINATION</span>
              <span style="color: #64748b; font-weight: normal;">الفحص الفيزيائي / العيني</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;">
              ${physicalParts.length > 0 ? physicalParts.map(p => `<div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(p)}</div>`).join('') : '<div style="color: #94a3b8;">Pending (قيد الفحص)</div>'}
            </div>
          </div>

          <!-- Chemical Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
              <span>CHEMICAL EXAMINATION</span>
              <span style="color: #64748b; font-weight: normal;">الفحص الكيميائي</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;">
              ${chemicalParts.length > 0 ? chemicalParts.map(p => {
                const isAbn = p.includes('1+') || p.includes('2+') || p.includes('3+') || p.includes('4+') || p.includes('Positive') || p.includes('++');
                return `<div style="background: ${isAbn ? '#fef2f2' : '#f8fafc'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '800' : '600'}; padding: 6px 10px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${escapeHtml(p)}</div>`;
              }).join('') : '<div style="color: #94a3b8;">Pending (قيد الفحص)</div>'}
            </div>
          </div>

          <!-- Microscopic Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: ${primaryCol}; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
              <span>MICROSCOPIC EXAMINATION (HPF)</span>
              <span style="color: #64748b; font-weight: normal;">الفحص المجهري المخبري</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;">
              ${microParts.length > 0 ? microParts.map(p => {
                const isAbn = p.includes('15-20') || p.includes('25-35') || p.includes('30-40') || p.includes('40-50') || p.includes('Full') || p.includes('Bloody') || p.includes('+++') || p.includes('++');
                return `<div style="background: ${isAbn ? '#fef2f2' : '#f8fafc'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '800' : '600'}; padding: 6px 10px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${escapeHtml(p)}</div>`;
              }).join('') : '<div style="color: #94a3b8;">Pending (قيد الفحص)</div>'}
            </div>
          </div>

          ${noteText ? `
            <div style="background: #f8fafc; border-left: 4px solid ${primaryCol}; padding: 8px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0;">
              <strong>Clinical Note / ملاحظات الفحص:</strong> ${escapeHtml(noteText)}
            </div>
          ` : ''}
        </div>

        ${renderFooter(safeFooter, safeLabName)}
      </div>
    `);
  }

  // 3. Dedicated General Stool Examination (G.S.E) Page
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
        ${renderHeader(safeLabName, safeLabSubtitle, safeAddress, safePhone, safeDocName, safeDocTitle, safeLicense)}
        ${renderPatientMetaBox(safePatientName, safeDoctorName)}
        
        <div style="background: #b45309; color: #ffffff; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" dir="ltr">
          <span>GENERAL STOOL EXAMINATION (G.S.E)</span>
          <span style="font-size: 12px; font-weight: normal;" dir="rtl">تقرير فحص الخروج العام والطفيليات</span>
        </div>

        <div style="margin-bottom: 16px;">
          <!-- Physical Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
              <span>PHYSICAL EXAMINATION</span>
              <span style="color: #64748b; font-weight: normal;">الفحص الفيزيائي / القوام واللون</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;">
              ${physicalParts.length > 0 ? physicalParts.map(p => `<div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(p)}</div>`).join('') : '<div style="color: #94a3b8;">Pending (قيد الفحص)</div>'}
            </div>
          </div>

          <!-- Occult Blood FOBT Section -->
          ${fobtVal ? `
            <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #b91c1c; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
                <span>OCCULT BLOOD (F.O.B.T)</span>
                <span style="color: #64748b; font-weight: normal;">فحص الدم الخفي</span>
              </div>
              <div style="padding: 12px;">
                <div style="background: ${fobtVal.includes('Positive') ? '#fef2f2' : '#f0fdf4'}; color: ${fobtVal.includes('Positive') ? '#b91c1c' : '#15803d'}; font-weight: 800; padding: 6px 12px; border-radius: 6px; border: 1px solid ${fobtVal.includes('Positive') ? '#fca5a5' : '#bbf7d0'}; font-size: 12px; display: inline-block;">
                  ${escapeHtml(fobtVal)}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Microscopic Examination Section -->
          <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #b45309; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
              <span>MICROSCOPIC EXAMINATION (HPF)</span>
              <span style="color: #64748b; font-weight: normal;">الفحص المجهري للخروج</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; font-size: 11.5px;">
              ${microParts.length > 0 ? microParts.map(p => `<div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(p)}</div>`).join('') : '<div style="color: #94a3b8;">Pending (قيد الفحص)</div>'}
            </div>
          </div>

          <!-- Parasitology & Helminths Section -->
          ${paraParts.length > 0 ? `
            <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <div style="background: #f8fafc; padding: 7px 12px; font-weight: 800; font-size: 11.5px; color: #7e22ce; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
                <span>PARASITOLOGY & HELMINTHS</span>
                <span style="color: #64748b; font-weight: normal;">الطفيليات والديدان وبيوضها</span>
              </div>
              <div style="padding: 12px; font-size: 11.5px;">
                ${paraParts.map(p => `<div style="background: #fffbeb; color: #b45309; font-weight: 700; padding: 6px 10px; border-radius: 4px; border: 1px solid #fde68a; margin-bottom: 4px;">${escapeHtml(p)}</div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${noteText ? `
            <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 8px 12px; font-size: 11px; color: #334155; border-radius: 0 6px 6px 0;">
              <strong>Clinical Note / ملاحظات الفحص:</strong> ${escapeHtml(noteText)}
            </div>
          ` : ''}
        </div>

        ${renderFooter(safeFooter, safeLabName)}
      </div>
    `);
  }

  // Fallback if empty
  if (renderedPages.length === 0) {
    renderedPages.push(`
      <div class="${containerClass}">
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
  <style>
    @page { 
      size: A4 portrait; 
      margin: ${topMm}mm ${rightMm}mm ${bottomMm}mm ${leftMm}mm; 
    }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #f1f5f9;
      line-height: 1.4;
    }
    .report-card {
      max-width: 820px;
      margin: 0 auto 24px auto;
      padding: 24px;
      position: relative;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border-radius: 8px;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
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
      body { padding: 0; margin: 0; background: transparent; }
      .report-card { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; border-radius: 0 !important; }
      .page-break { page-break-before: always !important; break-before: page !important; }
      .print-btn-bar { display: none !important; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="btn-print" onclick="window.print()">طباعة التقرير (Print A4)</button>
  </div>

  ${renderedPages.join('\n')}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    },
  });
}