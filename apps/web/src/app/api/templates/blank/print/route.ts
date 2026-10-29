import { NextRequest, NextResponse } from 'next/server';
import { getStore, clampMargin } from '../../../../../lib/serverStore';
import { renderPrintHeader, renderPatientMetaBox, renderEmblemSvg, generateQrSvg, escapeHtml, toEnglishDigits, formatEnglishDate, HEADER_STYLE_TO_TEMPLATE_MAP, TEMPLATE_TO_HEADER_STYLE_MAP } from '../../../samples/[id]/print/PrintHeader';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateParam = searchParams.get('template');
    const headerStyleParam = searchParams.get('headerStyle');
    const modeParam = searchParams.get('mode') || searchParams.get('type') || 'blank';
    const isSampleMode = modeParam === 'sample';
    const showRuledLines = searchParams.get('lines') !== '0' && searchParams.get('unlined') !== '1';

    const store = getStore();
    const settings = store.settings || ({} as any);
    const activeHeaderStyle = headerStyleParam || settings.headerStyle;
    const effectiveTemplate = templateParam || (activeHeaderStyle ? HEADER_STYLE_TO_TEMPLATE_MAP[activeHeaderStyle] : null) || settings.reportTemplate || 'ROYAL_CLASSIC';

    const safeLabName = escapeHtml(settings.labName || 'مختبر الرضا للتحليلات الطبية التخصصية');
    const safeLabSubtitle = escapeHtml(settings.labSubtitle || 'فحوصات مرضية وسريرية متطورة - جودة تشخيصية معتمدة');
    const safeAddress = escapeHtml(settings.address || 'شارع الأطباء - مقابل المجمع الطبي');
    const safePhone = escapeHtml(settings.phone || '07701234567');
    const safeDocName = escapeHtml(settings.doctorName || 'د. أحمد الرضا');
    const safeDocTitle = escapeHtml(settings.doctorTitle || 'استشاري التحليلات المرضية والمناعة');
    const safeLicense = escapeHtml(settings.doctorLicense || settings.labLicense || 'MOH-IQ-2026-8842');
    const safeFooter = escapeHtml(settings.reportFooter || 'This report has been electronically verified and clinically validated.');

    const topMm = clampMargin(settings.topMarginMm, 0, 50, 15);
    const bottomMm = clampMargin(settings.bottomMarginMm, 0, 50, 15);
    const leftMm = clampMargin(settings.leftMarginMm, 0, 50, 12);
    const rightMm = clampMargin(settings.rightMarginMm, 0, 50, 12);

    const formBgColor = settings.formBgColor || '#ffffff';
    const headerBgColor = settings.headerBgColor || settings.primaryColor || '#0284c7';
    const headerTextColor = settings.headerTextColor || '#ffffff';
    const textColor = settings.textColor || '#0f172a';
    const borderColor = settings.borderColor || '#cbd5e1';
    const primaryCol = settings.headerBgColor || settings.primaryColor || '#0284c7';
    const showReportBorder = settings.showReportBorder !== false;
    const showPatientBox = settings.showPatientBox !== false;
    const showFooter = settings.showFooter !== false;
    const showFooterSignature = settings.showFooterSignature !== false;
    const showLabName = settings.showLabName ?? true;
    const showLabSubtitle = settings.showLabSubtitle ?? true;
    const showContactInfo = settings.showContactInfo ?? true;
    const showDoctorInfo = settings.showDoctorInfo ?? true;
    const labNameFontSize = Number(settings.labNameFontSize) || 22;
    const labNameColor = settings.labNameColor || primaryCol;
    const labNameAlignment = settings.labNameAlignment || 'RIGHT';
    const labNameStyle = settings.labNameStyle || 'DEFAULT';

    const hasLetterheadBg = Boolean(
      settings.useLetterheadBackground &&
      settings.customLetterheadUrl &&
      settings.letterheadMode === 'DIGITAL_BACKGROUND'
    );

    const isPreprinted = Boolean(
      settings.headerMode === 'PREPRINTED' ||
      settings.letterheadMode === 'PREPRINTED' ||
      effectiveTemplate === 'PREPRINTED_STATIONERY'
    );

    const fontFamily = settings.fontFamily || 'Tajawal';
    let fontFamilyCss = "'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    if (fontFamily === 'Cairo') {
      fontFamilyCss = "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    } else if (fontFamily === 'IBM Plex Sans Arabic') {
      fontFamilyCss = "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    } else if (fontFamily === 'Almarai') {
      fontFamilyCss = "'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    }

    const rawBase = settings.serverBaseUrl?.trim();
    const baseDomain = rawBase || `http://127.0.0.1:8080`;
    const cleanBase = baseDomain.replace(/\/+$/, '');
    const verifyUrl = `${cleanBase}/verify/blank-sample`;
    const qrSvg = generateQrSvg(verifyUrl, 56);
    const qrEnabled = settings.enableQrCode ?? true;
    const qrPosition = settings.qrCodePosition || 'HEADER';

    // Watermark configuration
    const enableWatermark = settings.watermarkEnabled === true;
    const watermarkText = settings.watermarkText || settings.labName || 'CONFIDENTIAL';
    const watermarkAngle = settings.watermarkAngle ?? -30;
    const watermarkSize = settings.watermarkSize ?? 55;
    const watermarkColor = settings.watermarkColor || '#94a3b8';
    const watermarkOpacity = settings.watermarkOpacity ?? 0.06;

    const renderWatermark = () => {
      if (settings.labEmblem && settings.labEmblem !== 'none' && !watermarkText && (settings.emblemPlacement === 'watermark' || settings.emblemPlacement === 'both' || !settings.emblemPlacement)) {
        return `
          <div class="watermark-layer" aria-hidden="true" style="opacity: 0.035; transform: translate(-50%, -50%) rotate(-25deg); position: absolute; top: 50%; left: 50%; pointer-events: none; z-index: 1;">
            ${renderEmblemSvg(settings.labEmblem, '#0f172a', 360)}
          </div>
        `;
      }
      if (!enableWatermark) return '';
      return `
        <div class="watermark-layer" aria-hidden="true">
          <div class="watermark-inner">${escapeHtml(watermarkText)}</div>
        </div>
      `;
    };

    // Header HTML rendered using the lab's adopted template
    const headerHtml = renderPrintHeader({
      settings: { ...settings, headerStyle: activeHeaderStyle || settings.headerStyle },
      safeLabName,
      safeLabSubtitle,
      safeAddress,
      safePhone,
      safeDocName,
      safeDocTitle,
      safeLicense,
      isPreprinted: isPreprinted || hasLetterheadBg,
      showLabName,
      labNameFontSize,
      labNameColor,
      labNameAlignment,
      labNameStyle,
      showLabSubtitle,
      showContactInfo,
      showDoctorInfo,
      qrEnabled: qrEnabled && !isPreprinted,
      qrPosition,
      template: effectiveTemplate,
      headerStyle: activeHeaderStyle,
      primaryCol,
      verifyUrl,
    });

    // Patient Demographics Box rendered with the adopted template and patientLayout
    const patientBoxHtml = renderPatientMetaBox({
      showPatientBox,
      safePatientName: isSampleMode
        ? 'أحمد علي حسن (Ahmed Ali)'
        : '<span style="display:inline-block; min-width:180px; border-bottom:1px dotted #94a3b8;">&nbsp;</span>',
      safeDoctorName: isSampleMode
        ? 'د. فراس النعيمي (استشاري باطنية)'
        : '<span style="display:inline-block; min-width:160px; border-bottom:1px dotted #94a3b8;">&nbsp;</span>',
      clinicalAge: isSampleMode ? '34 Years' : '<span style="display:inline-block; min-width:60px; border-bottom:1px dotted #94a3b8;">&nbsp;</span>',
      gender: isSampleMode ? 'MALE' : '[ &nbsp; ] M &nbsp; [ &nbsp; ] F',
      sampleNumber: isSampleMode ? '10024' : '_______',
      primaryCol,
      createdAt: isSampleMode ? new Date().toISOString() : '____-__-__',
      settings,
    });

    // Template-specific CSS
    let templateCss = '';
    if (effectiveTemplate === 'INDIAN_DUAL_WING' || effectiveTemplate === 'DR_LAL_CLINICAL') {
      templateCss = `
        .report-card { border: 1px solid #cbd5e1; border-top: 5px solid #005691; border-radius: 4px; }
        .header-border { border-bottom: 2.5px solid #0f172a !important; }
        .table-header { background: #005691 !important; color: #ffffff !important; font-weight: 700; }
      `;
    } else if (effectiveTemplate === 'BAGHDAD_ROYAL_DUAL') {
      templateCss = `
        .report-card { border: 2px solid #1e3a8a; border-top: 6px solid #b45309; border-radius: 8px; box-shadow: 0 4px 15px rgba(30,58,138,0.08); }
        .header-border { border-bottom: 2px solid #b45309 !important; }
        .table-header { background: #1e3a8a !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'ACADEMIC_HOSPITAL') {
      templateCss = `
        .report-card { border: 2px solid #0f172a; border-radius: 4px; box-shadow: none !important; }
        .header-border { border-bottom: 3px double #0f172a !important; }
        .table-header { background: #0f172a !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'MAYO_EXECUTIVE') {
      templateCss = `
        .report-card { border: 1px solid #cbd5e1; border-top: 4px solid #0284c7; border-radius: 6px; }
        .header-border { border-bottom: 2px solid #1e3a8a !important; }
        .table-header { background: #0284c7 !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'METROPOLIS_TEAL') {
      templateCss = `
        .report-card { border: 1px solid #14b8a6; border-radius: 12px; }
        .header-border { border-bottom: 3px solid #0f766e !important; }
        .table-header { background: linear-gradient(90deg, #0f766e, #14b8a6) !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'REGAL_GOLD_FRAME') {
      templateCss = `
        .report-card { border: 2px solid #0f172a; border-top: 6px solid #d97706; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
        .header-border { border-bottom: 2px solid #d97706 !important; }
        .table-header { background: #0f172a !important; color: #fbbf24 !important; }
      `;
    } else if (effectiveTemplate === 'MINIMAL_PURE_LINE') {
      templateCss = `
        .report-card { border: 1.5px solid #000000; border-radius: 0px; box-shadow: none !important; }
        .header-border { border-bottom: 1.5px solid #000000 !important; }
        .table-header { background: #000000 !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'CLASSIC' || effectiveTemplate === 'ROYAL_CLASSIC') {
      templateCss = `
        .report-card { border: 2px solid #1e3a8a; border-radius: 8px; }
        .header-border { border-bottom: 3px solid #1e3a8a !important; }
        .table-header { background: #1e3a8a !important; }
      `;
    } else if (effectiveTemplate === 'MODERN' || effectiveTemplate === 'CLINICAL_FRAME') {
      templateCss = `
        .report-card { border: 1px solid #38bdf8; border-radius: 16px; background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 15%); }
        .header-border { border-bottom: 3px solid #0284c7 !important; }
        .table-header { background: linear-gradient(90deg, #0284c7, #0ea5e9) !important; }
      `;
    } else if (effectiveTemplate === 'EXECUTIVE' || effectiveTemplate === 'EXECUTIVE_LUXURY') {
      templateCss = `
        .report-card { border: 1px solid #d97706; border-top: 5px solid #b45309; border-radius: 4px; box-shadow: 0 4px 15px rgba(180,83,9,0.06); }
        .header-border { border-bottom: 2px solid #b45309 !important; }
        .table-header { background: #78350f !important; }
      `;
    } else if (effectiveTemplate === 'BLACK_WHITE' || effectiveTemplate === 'MONOCHROME_LASER') {
      templateCss = `
        .report-card { border: 2px solid #000000; border-radius: 0px; background: #ffffff !important; box-shadow: none !important; }
        .header-border { border-bottom: 2px solid #000000 !important; }
        .table-header { background: #000000 !important; color: #ffffff !important; }
        .modern-header-banner { background: #000000 !important; color: #ffffff !important; border-radius: 0px !important; }
        table th { background: #000000 !important; color: #ffffff !important; border: 1px solid #000000 !important; }
        table td { border-bottom: 1px solid #000000 !important; color: #000000 !important; }
      `;
    } else if (effectiveTemplate === 'AZURE_WAVE') {
      templateCss = `
        .report-card { border: 1.5px solid #0284c7; border-radius: 12px; }
        .header-border { border-bottom: 2.5px solid #0284c7 !important; }
        .table-header { background: linear-gradient(90deg, #0f172a, #0284c7) !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'EMERALD_WAVE') {
      templateCss = `
        .report-card { border: 1.5px solid #10b981; border-radius: 12px; }
        .header-border { border-bottom: 2.5px solid #10b981 !important; }
        .table-header { background: linear-gradient(90deg, #064e3b, #059669) !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'INDIGO_WAVE') {
      templateCss = `
        .report-card { border: 1.5px solid #7c3aed; border-radius: 12px; }
        .header-border { border-bottom: 2.5px solid #7c3aed !important; }
        .table-header { background: linear-gradient(90deg, #1e1b4b, #7c3aed) !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'GLASS_CAPSULE') {
      templateCss = `
        .report-card { border: 2px solid #0284c7; border-radius: 14px; box-shadow: 0 4px 20px rgba(2,132,199,0.08); background: #ffffff !important; }
        .header-border { border-bottom: 2px solid #0284c7 !important; }
        .table-header { background: linear-gradient(90deg, #0284c7, #06b6d4) !important; color: #ffffff !important; border-radius: 6px; }
      `;
    } else if (effectiveTemplate === 'SMART_DIGITAL') {
      templateCss = `
        .report-card { border: 2px solid #0284c7; border-top: 6px solid #06b6d4; border-radius: 10px; }
        .header-border { border-bottom: 2px solid #06b6d4 !important; }
        .table-header { background: #0f172a !important; color: #06b6d4 !important; }
      `;
    } else if (effectiveTemplate === 'MULTI_ACCREDITED') {
      templateCss = `
        .report-card { border: 2px solid #1e3a8a; border-top: 6px solid #0284c7; border-radius: 8px; }
        .header-border { border-bottom: 2px solid #0284c7 !important; }
        .table-header { background: #1e3a8a !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'BAUHAUS_GRID') {
      templateCss = `
        .report-card { border: 2.5px solid #0f172a; border-radius: 0px; box-shadow: none !important; }
        .header-border { border-bottom: 2.5px solid #0f172a !important; }
        .table-header { background: #0f172a !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'VERTICAL_SPINE') {
      templateCss = `
        .report-card { border: 1.5px solid #cbd5e1; border-left: 8px solid #0284c7 !important; border-radius: 4px; }
        .header-border { border-bottom: 2px solid #0284c7 !important; }
        .table-header { background: #0f172a !important; color: #ffffff !important; }
      `;
    } else if (effectiveTemplate === 'COMPACT_MICRO_STRIP') {
      templateCss = `
        .report-card { border: 1px solid #94a3b8; padding: 12px !important; font-size: 11px !important; }
        .header-border { border-bottom: 2px solid #475569 !important; }
        .table-header { background: #334155 !important; color: #ffffff !important; }
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
      ${(settings as any).tableStyle === 'grid' ? `
      table td, table th {
        border: 1px solid ${borderColor} !important;
      }
      ` : ''}
    `;

    // Table Investigation Area
    let tableContentHtml = '';
    if (isSampleMode) {
      const sampleTests = [
        { name: 'Fasting Blood Glucose (FBG)', result: '94.0', unit: 'mg / dL', ref: '70.0 - 110.0', status: 'Normal' },
        { name: 'Blood Urea', result: '28.5', unit: 'mg / dL', ref: '15.0 - 45.0', status: 'Normal' },
        { name: 'Serum Creatinine', result: '0.85', unit: 'mg / dL', ref: '0.60 - 1.20', status: 'Normal' },
        { name: 'Uric Acid', result: '5.2', unit: 'mg / dL', ref: '3.5 - 7.2', status: 'Normal' },
        { name: 'Serum Cholesterol (Total)', result: '178.0', unit: 'mg / dL', ref: '130.0 - 200.0', status: 'Normal' },
        { name: 'Triglycerides (TG)', result: '132.0', unit: 'mg / dL', ref: '40.0 - 160.0', status: 'Normal' },
        { name: 'HDL Cholesterol', result: '48.0', unit: 'mg / dL', ref: '35.0 - 65.0', status: 'Normal' },
        { name: 'LDL Cholesterol (Calculated)', result: '103.6', unit: 'mg / dL', ref: '70.0 - 130.0', status: 'Normal' },
        { name: 'SGOT / AST', result: '22.0', unit: 'U / L', ref: '5.0 - 40.0', status: 'Normal' },
        { name: 'SGPT / ALT', result: '24.0', unit: 'U / L', ref: '5.0 - 41.0', status: 'Normal' },
        { name: 'Alkaline Phosphatase (ALP)', result: '78.0', unit: 'U / L', ref: '40.0 - 130.0', status: 'Normal' },
        { name: 'Hemoglobin (Hb)', result: '14.6', unit: 'g / dL', ref: '13.0 - 17.5', status: 'Normal' },
      ];

      tableContentHtml = `
        <table class="blank-table" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr class="table-header" style="height: 32px;">
              <th style="width: 42%; text-align: left; padding: 6px 12px; font-weight: 800; font-size: 11px;">INVESTIGATION / TEST NAME</th>
              <th style="width: 18%; text-align: center; padding: 6px 8px; font-weight: 800; font-size: 11px;">RESULT</th>
              <th style="width: 16%; text-align: center; padding: 6px 8px; font-weight: 800; font-size: 11px;">UNIT</th>
              <th style="width: 24%; text-align: center; padding: 6px 10px; font-weight: 800; font-size: 11px;">REFERENCE INTERVAL</th>
            </tr>
          </thead>
          <tbody>
            ${sampleTests.map((test, idx) => `
              <tr style="height: 28px; border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                <td style="font-weight: 700; color: #0f172a; padding: 5px 12px;">${test.name}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${test.result}</td>
                <td style="text-align: center; color: #475569; font-size: 11px;">${test.unit}</td>
                <td style="text-align: center; color: #475569; font-size: 11px;">${test.ref}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (showRuledLines) {
      // Official Laboratory Blank Diagnostic Form with Standard Investigation Table Header and Elegant Ruled Lines
      const blankRowLines = Array.from({ length: 15 }, (_, i) => i);
      tableContentHtml = `
        <table class="blank-table" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr class="table-header" style="height: 32px;">
              <th style="width: 44%; text-align: left; padding: 6px 12px; font-weight: 800; font-size: 11px;">INVESTIGATION / TEST NAME</th>
              <th style="width: 18%; text-align: center; padding: 6px 8px; font-weight: 800; font-size: 11px;">RESULT</th>
              <th style="width: 14%; text-align: center; padding: 6px 8px; font-weight: 800; font-size: 11px;">UNIT</th>
              <th style="width: 24%; text-align: center; padding: 6px 10px; font-weight: 800; font-size: 11px;">REFERENCE INTERVAL</th>
            </tr>
          </thead>
          <tbody>
            ${blankRowLines.map((idx) => `
              <tr style="height: 31px; border-bottom: 1px dashed #cbd5e1; background: ${idx % 2 === 1 ? 'rgba(248, 250, 252, 0.4)' : '#ffffff'};">
                <td style="padding: 4px 12px;">&nbsp;</td>
                <td style="padding: 4px 8px; border-left: 1px dotted #e2e8f0; border-right: 1px dotted #e2e8f0;">&nbsp;</td>
                <td style="padding: 4px 8px; border-right: 1px dotted #e2e8f0;">&nbsp;</td>
                <td style="padding: 4px 10px;">&nbsp;</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      // 100% Pure Unlined Blank Canvas with Table Header
      tableContentHtml = `
        <table class="blank-table" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <thead>
            <tr class="table-header" style="height: 32px;">
              <th style="width: 44%; text-align: left; padding: 6px 12px; font-weight: 800; font-size: 11px;">INVESTIGATION / TEST NAME</th>
              <th style="width: 18%; text-align: center; padding: 6px 8px; font-weight: 800; font-size: 11px;">RESULT</th>
              <th style="width: 14%; text-align: center; padding: 6px 8px; font-weight: 800; font-size: 11px;">UNIT</th>
              <th style="width: 24%; text-align: center; padding: 6px 10px; font-weight: 800; font-size: 11px;">REFERENCE INTERVAL</th>
            </tr>
          </thead>
        </table>
        <div class="blank-unlined-canvas" style="flex: 1; min-height: 165mm; width: 100%; background: transparent; border: none; padding: 0; margin: 0;"></div>
      `;
    }

    // Official Footer HTML
    const footerHtml = showFooter ? `
      <div class="report-footer-pinned" style="margin-top: auto; border-top: 1.5px solid ${borderColor}; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; position: relative; z-index: 1;" dir="ltr">
        <div>
          <div style="font-weight: 700; color: #334155;">${safeFooter}</div>
          <div style="margin-top: 2px; color: #94a3b8;">${safeLabName} • ${safeAddress} | Tel: ${safePhone}</div>
          <div style="font-size: 8.5px; opacity: 0.8; margin-top: 2px;">Official Laboratory Report Form • Quality Management System</div>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          ${qrEnabled && qrPosition === 'FOOTER' ? `
            <div style="text-align: center;">
              ${qrSvg}
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Scan to Verify</div>
            </div>
          ` : ''}

          ${showFooterSignature ? `
            <div style="text-align: right;">
              <div style="font-weight: 800; color: #0f172a; font-size: 10.5px;">${safeDocName || 'Approved by Laboratory Director'}</div>
              <div style="font-size: 9.5px; color: #64748b;">${safeDocTitle || 'Consultant Clinical Pathologist'}</div>
              <div style="height: 30px; border-bottom: 1.5px dotted #94a3b8; width: 140px; margin-left: auto; margin-top: 4px;"></div>
              <div style="font-size: 8.5px; color: #94a3b8; margin-top: 2px;">Signature / Official Stamp</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>Blank Laboratory Report Form - ${safeLabName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Offline Local Fonts (Tajawal & Cairo) */
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
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: ${fontFamilyCss};
      color: #0f172a;
      font-size: 12px;
      line-height: 1.4;
      direction: ltr;
      text-align: left;
    }
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .btn {
      padding: 7px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .btn-print {
      background: #06b6d4;
      color: #000;
    }
    .btn-secondary {
      background: rgba(255,255,255,0.15);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.25);
    }
    .report-card {
      max-width: 820px;
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      padding: ${hasLetterheadBg || isPreprinted ? `${topMm}mm ${rightMm}mm ${bottomMm}mm ${leftMm}mm` : '20px 24px'} !important;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      border-radius: 8px;
      overflow: hidden;
      ${hasLetterheadBg ? `background-image: url('${escapeHtml(settings.customLetterheadUrl || '')}'); background-size: 100% 100%; background-repeat: no-repeat;` : ''}
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
      z-index: 10;
      overflow: hidden;
      mix-blend-mode: multiply;
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
    ${templateCss}
    @media print {
      body {
        background: transparent !important;
      }
      .action-bar {
        display: none !important;
      }
      .report-card {
        margin: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 100vh !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print Control Bar (Screen only) -->
  <div class="action-bar no-print">
    <div style="display: flex; align-items: center; gap: 12px;">
      <strong style="font-size: 14px; color: #38bdf8;">🖨️ طباعة فورمة المختبر الفارغة (Print Blank Form)</strong>
      <span style="font-size: 11px; opacity: 0.85;">نموذج المختبر المعتمد: <strong>${escapeHtml(effectiveTemplate)}</strong></span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <a href="?mode=blank&template=${effectiveTemplate}&lines=1" class="btn btn-secondary" style="${!isSampleMode && showRuledLines ? 'background: #0284c7; border-color: #0284c7; font-weight: 800;' : ''}">
        📄 فورمة مسطرة للكتابة
      </a>
      <a href="?mode=blank&template=${effectiveTemplate}&unlined=1" class="btn btn-secondary" style="${!isSampleMode && !showRuledLines ? 'background: #0284c7; border-color: #0284c7; font-weight: 800;' : ''}">
        📑 فورمة بيضاء نقية
      </a>
      <a href="?mode=sample&template=${effectiveTemplate}" class="btn btn-secondary" style="${isSampleMode ? 'background: #0284c7; border-color: #0284c7; font-weight: 800;' : ''}">
        👤 نموذج مع فحص تجريبي
      </a>
      <button onclick="window.print()" class="btn btn-print">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>طباعة فورية (Print A4)</span>
      </button>
      <button onclick="window.close()" class="btn btn-secondary">إغلاق</button>
    </div>
  </div>

  <div class="report-card template-${effectiveTemplate.toLowerCase()}">
    ${renderWatermark()}
    <div class="report-main-content">
      <!-- Full Adopted Lab Header -->
      ${headerHtml}

      <!-- Patient Demographics Box in Lab's chosen Layout -->
      ${patientBoxHtml}

      <!-- Investigation Content Area -->
      ${tableContentHtml}
    </div>

    <!-- Official Lab Footer -->
    ${footerHtml}
  </div>

  <script>
    if (new URLSearchParams(window.location.search).get('autoprint') === '1') {
      window.onload = function() {
        setTimeout(function() { window.print(); }, 300);
      };
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error rendering blank template: ${error?.message || error}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
