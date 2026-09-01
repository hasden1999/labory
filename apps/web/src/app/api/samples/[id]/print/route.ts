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

  const testRowsHtml = (sample.tests || []).map((t: any) => {
    let displayValue = t.resultValue || '<span style="color:#94a3b8;">Pending (قيد الفحص)</span>';
    
    // -------------------------------------------------------------
    // 1. G.U.E Report Parser
    // -------------------------------------------------------------
    if (typeof displayValue === 'string' && (displayValue.includes('G.U.E') || displayValue.includes('PHYSICAL:') && !displayValue.includes('G.S.E'))) {
      const clean = displayValue.replace(/\[.*?G\.?U\.?E.*?\]/gi, '').trim();
      const lines = clean.split('\n').filter(Boolean);
      let physicalHtml = '';
      let chemicalHtml = '';
      let microHtml = '';
      let notesHtml = '';

      lines.forEach((line: string) => {
        const cleanLine = line.trim();
        if (cleanLine.toUpperCase().startsWith('PHYSICAL:')) {
          const parts = cleanLine.replace(/PHYSICAL:/i, '').split('|').map(p => p.trim()).filter(Boolean);
          physicalHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: ${primaryCol}; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">PHYSICAL EXAMINATION</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
              </div>
            </div>`;
        } else if (cleanLine.toUpperCase().startsWith('CHEMICAL:')) {
          const parts = cleanLine.replace(/CHEMICAL:/i, '').split('|').map(p => p.trim()).filter(Boolean);
          chemicalHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: ${primaryCol}; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">CHEMICAL EXAMINATION</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => {
                  const isAbn = p.includes('1+') || p.includes('2+') || p.includes('3+') || p.includes('4+') || p.includes('Positive') || p.includes('++');
                  return `<div style="background: ${isAbn ? '#fef2f2' : '#ffffff'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '700' : '500'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${p}</div>`;
                }).join('')}
              </div>
            </div>`;
        } else if (cleanLine.toUpperCase().startsWith('MICROSCOPIC:')) {
          const parts = cleanLine.replace(/MICROSCOPIC:/i, '').split('|').map(p => p.trim()).filter(Boolean);
          microHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: ${primaryCol}; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">MICROSCOPIC EXAMINATION (HPF)</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => {
                  const isAbn = p.includes('15-20') || p.includes('25-35') || p.includes('30-40') || p.includes('40-50') || p.includes('Full') || p.includes('Bloody') || p.includes('+++') || p.includes('++');
                  return `<div style="background: ${isAbn ? '#fef2f2' : '#ffffff'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '700' : '500'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${p}</div>`;
                }).join('')}
              </div>
            </div>`;
        } else if (cleanLine.toUpperCase().startsWith('NOTES:')) {
          notesHtml = `
            <div style="background: #f8fafc; border-left: 3px solid ${primaryCol}; padding: 4px 8px; font-size: 11px; color: #334155; margin-top: 4px; border-radius: 0 4px 4px 0;">
              <strong>Note:</strong> ${cleanLine.replace(/NOTES?:/i, '').trim()}
            </div>`;
        }
      });

      displayValue = `
        <div style="text-align: left; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; max-width: 520px; margin: 4px 0;">
          ${physicalHtml}
          ${chemicalHtml}
          ${microHtml}
          ${notesHtml}
        </div>`;
    }

    // -------------------------------------------------------------
    // 2. G.S.E Report Parser
    // -------------------------------------------------------------
    else if (typeof displayValue === 'string' && (displayValue.includes('G.S.E') || displayValue.includes('PARASITOLOGY:'))) {
      const clean = displayValue.replace(/\[.*?G\.?S\.?E.*?\]/gi, '').trim();
      const lines = clean.split('\n').filter(Boolean);
      let physicalHtml = '';
      let fobtHtml = '';
      let microHtml = '';
      let paraHtml = '';
      let notesHtml = '';

      lines.forEach((line: string) => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('PHYSICAL:')) {
          const parts = cleanLine.replace('PHYSICAL:', '').split('|').map(p => p.trim());
          physicalHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #b45309; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">PHYSICAL EXAMINATION</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
              </div>
            </div>`;
        } else if (cleanLine.startsWith('FOBT:')) {
          const val = cleanLine.replace('FOBT:', '').trim();
          const isPos = val.includes('Positive');
          fobtHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #b91c1c; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">OCCULT BLOOD (F.O.B.T)</div>
              <div style="background: ${isPos ? '#fef2f2' : '#f0fdf4'}; color: ${isPos ? '#b91c1c' : '#15803d'}; font-weight: 700; padding: 3px 8px; border-radius: 4px; border: 1px solid ${isPos ? '#fca5a5' : '#bbf7d0'}; font-size: 11px;">
                ${val}
              </div>
            </div>`;
        } else if (cleanLine.startsWith('MICROSCOPIC:')) {
          const parts = cleanLine.replace('MICROSCOPIC:', '').split('|').map(p => p.trim());
          microHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #b45309; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">MICROSCOPIC (HPF)</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
              </div>
            </div>`;
        } else if (cleanLine.startsWith('PARASITOLOGY:')) {
          const val = cleanLine.replace('PARASITOLOGY:', '').trim();
          const isNil = val.startsWith('Nil');
          paraHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #7e22ce; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">PARASITOLOGY & HELMINTHS</div>
              <div style="background: ${isNil ? '#f8fafc' : '#fffbeb'}; color: ${isNil ? '#475569' : '#b45309'}; font-weight: ${isNil ? '500' : '700'}; padding: 3px 8px; border-radius: 4px; border: 1px solid ${isNil ? '#e2e8f0' : '#fde68a'}; font-size: 11px;">
                ${val}
              </div>
            </div>`;
        } else if (cleanLine.startsWith('NOTES:')) {
          notesHtml = `
            <div style="background: #f8fafc; border-left: 3px solid #b45309; padding: 4px 8px; font-size: 11px; color: #334155; margin-top: 4px; border-radius: 0 4px 4px 0;">
              <strong>Note:</strong> ${cleanLine.replace('NOTES:', '').trim()}
            </div>`;
        }
      });

      displayValue = `
        <div style="text-align: left; background: #fffdfa; padding: 8px 12px; border-radius: 8px; border: 1px solid #fed7aa; max-width: 520px; margin: 4px 0;">
          ${physicalHtml}
          ${fobtHtml}
          ${microHtml}
          ${paraHtml}
          ${notesHtml}
        </div>`;
    }

    // -------------------------------------------------------------
    // 3. CBC Report Parser
    // -------------------------------------------------------------
    else if (typeof displayValue === 'string' && (displayValue.includes('CBC') || displayValue.includes('ERYTHROID:') || displayValue.includes('DIFFERENTIAL:'))) {
      const clean = displayValue.replace(/\[.*?CBC.*?\]/gi, '').trim();
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
              <div style="font-size: 11px; font-weight: 800; color: #e11d48; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">${title}</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 11px;">
                ${items.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
              </div>
            </div>`;
        } else {
          contentHtml += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 4px;">
              ${cleanLine}
            </div>`;
        }
      });

      displayValue = `
        <div style="text-align: left; background: #fff1f2; padding: 8px 12px; border-radius: 8px; border: 1px solid #fecdd3; max-width: 520px; margin: 4px 0;">
          ${contentHtml}
        </div>`;
    }

    // -------------------------------------------------------------
    // 4. Microbiology & Antibiogram Parser
    // -------------------------------------------------------------
    else if (typeof displayValue === 'string' && (displayValue.includes('MICROBIOLOGY') || displayValue.includes('ANTIBIOGRAM:'))) {
      const clean = displayValue.replace(/\[.*?MICROBIOLOGY.*?\]/gi, '').trim();
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
                    return `<div style="background: ${bg}; color: ${col}; font-weight: 700; padding: 3px 6px; border-radius: 4px; border: 1px solid ${bdr};">${item}</div>`;
                  }).join('')}
                </div>
              </div>`;
          } else {
            antiHtml = `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">${itemsStr}</div>`;
          }
        } else if (cleanLine.startsWith('NOTES:')) {
          notesHtml = `
            <div style="background: #f8fafc; border-left: 3px solid #0d9488; padding: 4px 8px; font-size: 11px; color: #334155; margin-top: 6px; border-radius: 0 4px 4px 0;">
              <strong>Note:</strong> ${cleanLine.replace('NOTES:', '').trim()}
            </div>`;
        } else {
          metaHtml += `
            <div style="background: #ffffff; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 3px;">
              ${cleanLine}
            </div>`;
        }
      });

      displayValue = `
        <div style="text-align: left; background: #f0fdfa; padding: 8px 12px; border-radius: 8px; border: 1px solid #99f6e4; max-width: 520px; margin: 4px 0;">
          ${metaHtml}
          ${antiHtml}
          ${notesHtml}
        </div>`;
    }

    // -------------------------------------------------------------
    // 5. Chemistry Panels Parser
    // -------------------------------------------------------------
    else if (typeof displayValue === 'string' && (displayValue.includes('CHEMISTRY') || displayValue.includes('RENAL:') || displayValue.includes('LIPIDS:'))) {
      const clean = displayValue.replace(/\[.*?CHEMISTRY.*?\]/gi, '').trim();
      const lines = clean.split('\n').filter(Boolean);
      let contentHtml = '';

      lines.forEach((line: string) => {
        const cleanLine = line.trim();
        const colonIdx = cleanLine.indexOf(':');
        if (colonIdx > 0) {
          const title = cleanLine.substring(0, colonIdx);
          const body = cleanLine.substring(colonIdx + 1).trim();
          const items = body.split('|').map(p => p.trim());
          contentHtml += `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">${title}</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${items.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
              </div>
            </div>`;
        } else {
          contentHtml += `<div style="background: #ffffff; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 3px;">${cleanLine}</div>`;
        }
      });

      displayValue = `
        <div style="text-align: left; background: #f0f9ff; padding: 8px 12px; border-radius: 8px; border: 1px solid #bae6fd; max-width: 520px; margin: 4px 0;">
          ${contentHtml}
        </div>`;
    }

    const isAbnormal = t.isAbnormal;
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
        <td style="padding: 10px 12px; font-weight: 800; color: #0f172a;">
          ${t.test?.name || t.testCode || 'Test'}
          <div style="font-size: 11px; color: #64748b; font-weight: normal;">${t.test?.arabicName || ''}</div>
        </td>
        <td style="padding: 10px 12px; font-weight: 700; color: ${isAbnormal ? '#dc2626' : '#0f172a'};">
          ${displayValue}
        </td>
        <td style="padding: 10px 12px; color: #475569; font-weight: 600;">${t.test?.unit || '-'}</td>
        <td style="padding: 10px 12px; color: #334155; font-weight: 600;">${t.test?.refRangeText || '-'}</td>
        <td style="padding: 10px 12px; font-size: 11px; color: ${isAbnormal ? '#dc2626' : '#16a34a'}; font-weight: 700;">
          ${isAbnormal ? '⚠️ Abnormal' : '✓ Normal'}
        </td>
      </tr>`;
  }).join('');

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
      background: #ffffff;
      line-height: 1.4;
    }
    .report-card {
      max-width: 820px;
      margin: 0 auto;
      padding: 24px;
      position: relative;
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
      .report-card { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
      .print-btn-bar { display: none !important; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة التقرير (Print A4)</button>
  </div>

  <div class="${containerClass}">
    <!-- Header: Suppressed if PREPRINTED mode -->
    ${isPreprinted ? `
      <!-- Pre-Printed Letterhead spacer -->
      <div style="height: 10px; margin-bottom: 10px;"></div>
    ` : `
      <!-- Digital Header -->
      <div class="header-border" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; margin-bottom: 18px;">
        <div style="text-align: right;">
          <h1 style="margin: 0; font-size: 20px; color: ${primaryCol}; font-weight: 900;">🧪 ${settings.labName}</h1>
          <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">${settings.labSubtitle || ''}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">📍 ${settings.address || ''} | 📞 ${settings.phone || ''}</p>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          ${qrEnabled && qrPosition === 'HEADER' ? `
            <div style="text-align: center;">
              ${qrSvg}
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">تحقق إلكتروني</div>
            </div>
          ` : ''}

          <div style="text-align: left;" dir="ltr">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${settings.doctorName || 'Laboratory Director'}</div>
            <div style="font-size: 11px; color: #64748b;">${settings.doctorTitle || 'Consultant Clinical Pathologist'}</div>
            <div style="font-size: 10px; color: #94a3b8;">License: ${settings.labLicense || 'MOH-2026'}</div>
          </div>
        </div>
      </div>
    `}

    <!-- Patient & Sample Meta Box -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px;">
      <div><span style="color: #64748b;">اسم المريض:</span> <strong>${safePatientName}</strong></div>
      <div><span style="color: #64748b;">العمر / الجنس:</span> <strong>${patient.age || '-'} سنة / ${patient.gender === 'FEMALE' ? 'أنثى ♀' : 'ذكر ♂'}</strong></div>
      <div><span style="color: #64748b;">رقم العينة:</span> <strong style="color: ${primaryCol};">#${sample.sampleNumber}</strong></div>
      <div><span style="color: #64748b;">الطبيب المعالج:</span> <strong>${safeDoctorName}</strong></div>
      <div><span style="color: #64748b;">تاريخ الفحص:</span> <strong>${new Date(sample.createdAt).toLocaleDateString('ar-IQ')}</strong></div>
      <div><span style="color: #64748b;">حالة التقرير:</span> <strong style="color: #16a34a;">معتمد نهائي ✓</strong></div>
    </div>

    <!-- Test Results Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
      <thead>
        <tr class="table-header" style="background: #0f172a; color: #ffffff;">
          <th style="padding: 8px 12px; text-align: right; border-radius: 6px 0 0 0;">الفحص المخبري (Test Name)</th>
          <th style="padding: 8px 12px; text-align: right;">النتيجة (Result)</th>
          <th style="padding: 8px 12px; text-align: right;">الوحدة (Unit)</th>
          <th style="padding: 8px 12px; text-align: right;">المجال الطبيعي (Ref. Range)</th>
          <th style="padding: 8px 12px; text-align: right; border-radius: 0 6px 0 0;">الحالة (Status)</th>
        </tr>
      </thead>
      <tbody>
        ${testRowsHtml}
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b;">
      <div>
        <div>${settings.reportFooter || 'تم فحص وتدقيق التقرير إلكترونياً وهو معتمد رسمياً.'}</div>
        ${isPreprinted ? '' : `<div style="margin-top: 2px; color: #94a3b8;">${settings.labName} • تشخيص مخبري معتمد</div>`}
      </div>

      <div style="display: flex; align-items: center; gap: 14px;">
        ${qrEnabled && qrPosition === 'FOOTER' ? `
          <div style="text-align: center;">
            ${qrSvg}
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">تحقق إلكتروني</div>
          </div>
        ` : ''}
        <div style="font-weight: 700; color: #0f172a; text-align: left;" dir="ltr">
          <div>Approved by Pathologist ✍️</div>
          <div style="font-size: 9px; color: #64748b;">Labryo Clinical LIS Validated</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}