import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';

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

  const testRowsHtml = (sample.tests || []).map((t: any) => {
    let displayValue = t.resultValue || '<span style="color:#94a3b8;">Pending (قيد الفحص)</span>';
    
    // If G.U.E report
    if (displayValue && typeof displayValue === 'string' && (displayValue.includes('G.U.E') || displayValue.includes('PHYSICAL:'))) {
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
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">PHYSICAL EXAMINATION</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
              </div>
            </div>`;
        } else if (cleanLine.toUpperCase().startsWith('CHEMICAL:')) {
          const parts = cleanLine.replace(/CHEMICAL:/i, '').split('|').map(p => p.trim()).filter(Boolean);
          chemicalHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">CHEMICAL EXAMINATION</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => {
                  const isAbn = p.includes('1+') || p.includes('2+') || p.includes('3+') || p.includes('4+') || p.includes('Positive');
                  return `<div style="background: ${isAbn ? '#fef2f2' : '#ffffff'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '700' : '500'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${p}</div>`;
                }).join('')}
              </div>
            </div>`;
        } else if (cleanLine.toUpperCase().startsWith('MICROSCOPIC:')) {
          const parts = cleanLine.replace(/MICROSCOPIC:/i, '').split('|').map(p => p.trim()).filter(Boolean);
          microHtml = `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">MICROSCOPIC EXAMINATION (HPF)</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 11px;">
                ${parts.map(p => {
                  const isAbn = p.includes('15-20') || p.includes('25-35') || p.includes('40-50') || p.includes('Full') || p.includes('Bloody') || p.includes('+++') || p.includes('++');
                  return `<div style="background: ${isAbn ? '#fef2f2' : '#ffffff'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '700' : '500'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${p}</div>`;
                }).join('')}
              </div>
            </div>`;
        } else if (cleanLine.toUpperCase().startsWith('NOTES:')) {
          notesHtml = `
            <div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 4px 8px; font-size: 11px; color: #334155; margin-top: 4px; border-radius: 0 4px 4px 0;">
              <strong>Note:</strong> ${cleanLine.replace(/NOTES?:/i, '').trim()}
            </div>`;
        }
      });

      displayValue = `
        <div style="text-align: left; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; max-width: 480px; margin: 4px 0;">
          ${physicalHtml}
          ${chemicalHtml}
          ${microHtml}
          ${notesHtml}
        </div>`;
    }

    const isAbnormal = t.isAbnormal;
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
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

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Medical Report #${sample.sampleNumber} - ${patient.name}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
    }
    .report-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      position: relative;
    }
    .print-btn-bar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
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
    @media print {
      body { padding: 0; }
      .report-card { border: none; box-shadow: none; padding: 0; }
      .print-btn-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة التقرير (Print A4)</button>
  </div>

  <div class="report-card">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px;">
      <div style="text-align: right;">
        <h1 style="margin: 0; font-size: 20px; color: #0284c7; font-weight: 900;">🧪 ${settings.labName}</h1>
        <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">${settings.labSubtitle || ''}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">📍 ${settings.address || ''} | 📞 ${settings.phone || ''}</p>
      </div>
      <div style="text-align: left;" dir="ltr">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${settings.doctorName || 'Laboratory Director'}</div>
        <div style="font-size: 11px; color: #64748b;">${settings.doctorTitle || 'Consultant Clinical Pathologist'}</div>
        <div style="font-size: 10px; color: #94a3b8;">License: ${settings.labLicense || 'MOH-2026'}</div>
      </div>
    </div>

    <!-- Patient & Sample Meta Box -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px;">
      <div><span style="color: #64748b;">اسم المريض:</span> <strong>${patient.name}</strong></div>
      <div><span style="color: #64748b;">العمر / الجنس:</span> <strong>${patient.age || '-'} سنة / ${patient.gender === 'FEMALE' ? 'أنثى ♀' : 'ذكر ♂'}</strong></div>
      <div><span style="color: #64748b;">رقم العينة:</span> <strong style="color: #0284c7;">#${sample.sampleNumber}</strong></div>
      <div><span style="color: #64748b;">الطبيب المعالج:</span> <strong>${doctor.name}</strong></div>
      <div><span style="color: #64748b;">تاريخ الفحص:</span> <strong>${new Date(sample.createdAt).toLocaleDateString('ar-IQ')}</strong></div>
      <div><span style="color: #64748b;">حالة التقرير:</span> <strong style="color: #16a34a;">معتمد نهائي ✓</strong></div>
    </div>

    <!-- Test Results Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
      <thead>
        <tr style="background: #0f172a; color: #ffffff;">
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
    <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #64748b;">
      <div>${settings.reportFooter || 'تم فحص وتدقيق التقرير إلكترونياً وهو معتمد رسمياً.'}</div>
      <div style="font-weight: 700; color: #0f172a;">ختم وتوقيع المختبر المعتمد ✍️</div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}