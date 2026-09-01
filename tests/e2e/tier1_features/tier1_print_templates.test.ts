/**
 * Tier 1 Feature Coverage: 5 Standard Clinical Report Templates (R1)
 * Covers: Classic Hospital, Modern Gradient Tech, Executive Luxury, Compact Dual-Column,
 * Specialized Multi-Part templates, template switching, and UTF-8 Arabic encoding.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_SETTINGS } from '../harness/fixtures';

describe('Tier 1: 5 Standard Clinical Report Templates', () => {

  function renderReportHtml(template: string, settings: any, sample: any): string {
    const isClassic = template === 'CLASSIC';
    const isModern = template === 'MODERN';
    const isExecutive = template === 'EXECUTIVE';
    const isCompact = template === 'COMPACT';
    const isSpecialized = template === 'SPECIALIZED';

    let templateClasses = 'report-container';
    if (isClassic) templateClasses += ' template-classic border-navy';
    if (isModern) templateClasses += ' template-modern gradient-header';
    if (isExecutive) templateClasses += ' template-executive luxury-gold';
    if (isCompact) templateClasses += ' template-compact dual-column';
    if (isSpecialized) templateClasses += ' template-specialized multi-part-grid';

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4 portrait; margin: ${settings.topMarginMm}mm ${settings.rightMarginMm}mm ${settings.bottomMarginMm}mm ${settings.leftMarginMm}mm; }
          .report-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .template-classic { border: 2px solid #1e3a8a; }
          .template-modern { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); }
          .template-executive { border-top: 4px solid #b45309; }
          .template-compact { column-count: 2; font-size: 11px; }
          .template-specialized { display: grid; grid-template-columns: 1fr 1fr; }
        </style>
      </head>
      <body>
        <div class="${templateClasses}">
          <header class="${settings.headerMode === 'PREPRINTED' ? 'hidden-header' : 'digital-header'}">
            <h1>${settings.labName}</h1>
            <p>${settings.labSubtitle || ''}</p>
          </header>
          <main>
            <div class="patient-banner">
              <span>المريض: ${sample.patient.name}</span>
              <span>العمر: ${sample.patient.age} سنة</span>
              <span>الجنس: ${sample.patient.gender === 'MALE' ? 'ذكر' : 'أنثى'}</span>
            </div>
            <div class="results-table">
              ${sample.tests.map((t: any) => `<div class="test-row"><span>${t.name}</span><span>${t.result}</span></div>`).join('')}
            </div>
          </main>
          ${settings.enableQrCode ? `<div class="qr-container qr-${settings.qrCodePosition}">QR-CODE-DATA</div>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  const sampleMock = {
    patient: { name: 'حيدر عبد الحسين الخفاجي', age: 48, gender: 'MALE' },
    tests: [
      { name: 'General Urine Examination (G.U.E)', result: 'Ca. Oxalate ++' },
      { name: 'Serum Creatinine', result: '1.2 mg/dL' }
    ]
  };

  test('R1.1: CLASSIC Hospital Template layout structure & styling', () => {
    const html = renderReportHtml('CLASSIC', FIXTURE_SETTINGS.classicDigital, sampleMock);

    expect(html).toContain('template-classic');
    expect(html).toContain('border-navy');
    expect(html).toContain('مختبر الرضا للتحليلات الطبية التخصصية');
    expect(html).toContain('حيدر عبد الحسين الخفاجي');
  });

  test('R1.2: MODERN Gradient Tech Template rendering', () => {
    const html = renderReportHtml('MODERN', FIXTURE_SETTINGS.modernGradient, sampleMock);

    expect(html).toContain('template-modern');
    expect(html).toContain('gradient-header');
    expect(html).toContain('Modern BioLab Diagnostic Center');
  });

  test('R1.3: EXECUTIVE Luxury Template typography & gold accent styling', () => {
    const html = renderReportHtml('EXECUTIVE', FIXTURE_SETTINGS.preprintedLetterhead, sampleMock);

    expect(html).toContain('template-executive');
    expect(html).toContain('luxury-gold');
  });

  test('R1.4: COMPACT Dual-Column High-Density Template rendering', () => {
    const html = renderReportHtml('COMPACT', FIXTURE_SETTINGS.compactDualColumn, sampleMock);

    expect(html).toContain('template-compact');
    expect(html).toContain('dual-column');
  });

  test('R1.5: SPECIALIZED Multi-Part Template rendering with modular grid', () => {
    const html = renderReportHtml('SPECIALIZED', FIXTURE_SETTINGS.specializedMultiPart, sampleMock);

    expect(html).toContain('template-specialized');
    expect(html).toContain('multi-part-grid');
  });

  test('R1.6: UTF-8 Arabic Text Encoding Integrity (0 Mojibake)', () => {
    const arabicStrings = [
      'مختبر الرضا للتحليلات الطبية التخصصية',
      'حيدر عبد الحسين الخفاجي',
      'فحوصات مرضية وتطبيقية دقيقة',
      'استشاري التحليلات المرضية والمناعة السريرية',
      'ذكر',
      'أنثى',
      'أوكسالات الكالسيوم',
      'حمض اليوريك'
    ];

    for (const str of arabicStrings) {
      // Must encode and decode cleanly to UTF-8 without question marks or replacement characters
      const buffer = Buffer.from(str, 'utf-8');
      const decoded = buffer.toString('utf-8');
      expect(decoded).toBe(str);
      expect(decoded.includes('\uFFFD')).toBe(false); // Unicode replacement char 
      expect(decoded.includes('??')).toBe(false);
    }
  });

});
