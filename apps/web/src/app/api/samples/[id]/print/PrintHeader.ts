/**
 * PrintHeader: Handles header banner, logo positioning, and patient demographics box
 * for the printable lab reports. Owned by Agent C.
 */

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function toEnglishDigits(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
}

export function formatEnglishDate(dateInput: any): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function generateQrSvg(url: string, size = 64): string {
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

export function renderEmblemSvg(type: string, color = 'currentColor', size = 28): string {
  if (type === 'tubes') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"></path><path d="M8.5 2h7"></path><path d="M9.5 12h5"></path><path d="M6 8v10c0 1.1.9 2 2 2"></path>
      </svg>`;
  }
  if (type === 'dna') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 15 5.5-5.5"></path><path d="M7.5 9.5 10 12l5.5-5.5"></path><path d="M10 22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2"></path><path d="M14 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2"></path><path d="m14 14.5 5.5-5.5"></path>
      </svg>`;
  }
  if (type === 'badge') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m9 12 2 2 4-4"></path>
      </svg>`;
  }
  if (type === 'blood') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
      </svg>`;
  }
  // Default: microscope
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 18h8"></path><path d="M3 22h18"></path><path d="M14 22a7 7 0 1 0-14 0"></path><path d="M9 14h2"></path><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"></path><path d="M12 6V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"></path>
    </svg>`;
}

export function generateBarcodePatternSvg(code = '261014-09418'): string {
  return `
    <div style="background: repeating-linear-gradient(90deg, #0f172a, #0f172a 1.5px, transparent 1.5px, transparent 3px, #0f172a 3px, #0f172a 4.5px, transparent 4.5px, transparent 7px); width: 120px; height: 26px; border-radius: 2px;"></div>
    <div style="font-size: 8.5px; font-weight: 800; letter-spacing: 1px; color: #334155; margin-top: 2px; text-align: center; font-family: monospace;">SID: ${escapeHtml(code)}</div>
  `;
}

export interface PrintHeaderParams {
  settings: any;
  safeLabName: string;
  safeLabSubtitle: string;
  safeAddress: string;
  safePhone: string;
  safeDocName: string;
  safeDocTitle: string;
  safeLicense: string;
  isPreprinted?: boolean;
  showLabName?: boolean;
  labNameFontSize?: number;
  labNameColor?: string;
  labNameAlignment?: string;
  labNameStyle?: string;
  showLabSubtitle?: boolean;
  showContactInfo?: boolean;
  showDoctorInfo?: boolean;
  qrEnabled?: boolean;
  qrPosition?: string;
  template?: string;
  headerStyle?: string;
  primaryCol?: string;
  verifyUrl?: string;
}

import { HEADER_STYLE_TO_TEMPLATE_MAP, TEMPLATE_TO_HEADER_STYLE_MAP } from '@lab/domain';
export { HEADER_STYLE_TO_TEMPLATE_MAP, TEMPLATE_TO_HEADER_STYLE_MAP };

export function renderPrintHeader(params: PrintHeaderParams): string {
  const {
    settings,
    safeLabName,
    safeLabSubtitle,
    safeAddress,
    safePhone,
    safeDocName,
    safeDocTitle,
    safeLicense,
    isPreprinted = false,
    showLabName = true,
    labNameFontSize = 20,
    labNameColor = '#0284c7',
    labNameAlignment = 'RIGHT',
    labNameStyle = 'DEFAULT',
    showLabSubtitle = true,
    showContactInfo = true,
    showDoctorInfo = true,
    qrEnabled = true,
    qrPosition = 'HEADER',
    template: initialTemplate = 'CLASSIC',
    headerStyle: explicitHeaderStyle,
    primaryCol = '#0284c7',
    verifyUrl = '',
  } = params;

  const style = String(explicitHeaderStyle || (initialTemplate === 'CLASSIC' ? settings?.headerStyle : '') || '').toLowerCase().trim();
  let template = initialTemplate;
  if (style && HEADER_STYLE_TO_TEMPLATE_MAP[style]) {
    template = HEADER_STYLE_TO_TEMPLATE_MAP[style];
  }

  if (isPreprinted || (settings.useLetterheadBackground && settings.customLetterheadUrl)) {
    return `<div style="height: 10px; margin-bottom: 10px;"></div>`;
  }

  const hasHeaderContent = (showLabName && safeLabName) || showLabSubtitle || showContactInfo || showDoctorInfo || (qrEnabled && qrPosition === 'HEADER');
  if (!hasHeaderContent) {
    return '';
  }

  const labNameAlignStyle = labNameAlignment === 'CENTER' ? 'text-align: center;' : labNameAlignment === 'LEFT' ? 'text-align: left;' : 'text-align: right;';

  const hasCustomLogo = Boolean(
    settings.logoUrl && (
      (settings.logoWidthMm !== null && settings.logoWidthMm !== undefined) ||
      (settings.logoAlign !== null && settings.logoAlign !== undefined) ||
      (settings.logoOffsetXMm !== null && settings.logoOffsetXMm !== undefined) ||
      (settings.logoOffsetYMm !== null && settings.logoOffsetYMm !== undefined)
    )
  );

  const customWidthMm = Math.max(10, Math.min(80, Number(settings.logoWidthMm) || 25));
  const customAlign = (settings.logoAlign === 'left' || settings.logoAlign === 'center' || settings.logoAlign === 'right')
    ? settings.logoAlign
    : 'right';
  const customOffX = Math.max(-20, Math.min(20, Number(settings.logoOffsetXMm) || 0));
  const customOffY = Math.max(-20, Math.min(20, Number(settings.logoOffsetYMm) || 0));

  const renderCustomLogoBlock = () => `
    <div class="custom-logo-wrapper" style="display: inline-flex; justify-content: ${customAlign === 'center' ? 'center' : customAlign === 'left' ? 'flex-start' : 'flex-end'}; max-width: 100%; overflow: hidden; vertical-align: middle;">
      <img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="width: ${customWidthMm}mm; max-width: 100%; height: auto; object-fit: contain; transform: translate(${customOffX}mm, ${customOffY}mm); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" />
    </div>
  `;

  const getLabNameStyleCss = (isDarkBg = false, fallbackColor?: string) => {
    const effectiveColor = isDarkBg
      ? (settings.headerTextColor || '#ffffff')
      : (labNameColor || fallbackColor || settings.headerBgColor || primaryCol || '#0284c7');

    let css = `font-size: ${labNameFontSize}px; color: ${effectiveColor} !important; line-height: 1.25;`;
    if (labNameStyle === 'BOLD') {
      css += ` font-weight: 950 !important; display: inline-block; letter-spacing: -0.3px; ${isDarkBg ? 'text-shadow: 0 2px 4px rgba(0,0,0,0.45); border-bottom: 2.5px solid rgba(255,255,255,0.85);' : `text-shadow: 0 1px 2px rgba(0,0,0,0.15); border-bottom: 2.5px solid ${settings.secondaryColor || effectiveColor};`} padding-bottom: 2px;`;
    } else if (labNameStyle === 'MODERN_BADGE') {
      css += ` font-weight: 900 !important; display: inline-block; background: ${isDarkBg ? 'rgba(255, 255, 255, 0.22)' : `${effectiveColor}18`} !important; border: ${isDarkBg ? '1.5px solid rgba(255, 255, 255, 0.45)' : `1.5px solid ${effectiveColor}45`} !important; padding: 3px 12px; border-radius: 8px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;`;
    } else if (labNameStyle === 'ELEGANT_BORDER') {
      css += ` font-weight: 900 !important; display: inline-block; border: ${isDarkBg ? '2px double #ffffff' : `2px solid ${effectiveColor}`} !important; background: ${isDarkBg ? 'rgba(0, 0, 0, 0.18)' : `${effectiveColor}08`} !important; padding: 3px 12px; border-radius: 4px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;`;
    } else {
      css += ` font-weight: 800 !important;`;
    }
    return css;
  };

  // 0. Baghdad Royal Dual / Regal Boxed Crest (regal_box)
  if (template === 'BAGHDAD_ROYAL_DUAL') {
    const emblemType = settings.labEmblem || 'microscope';
    const boxColor = settings.headerBgColor || primaryCol || '#1e3a8a';
    const accentGold = settings.secondaryColor || '#b45309';
    return `
      <div class="baghdad-royal-dual-header" style="border: 2px solid ${boxColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; background: #ffffff !important; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid ${accentGold}; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: ${boxColor}; color: #fbbf24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              ${renderEmblemSvg(emblemType, '#fbbf24', 28)}
            </div>
            <div style="flex: 1; ${labNameAlignStyle}">
              ${showLabName && safeLabName ? `<h1 style="margin: 0; ${getLabNameStyleCss(false, boxColor)}">${safeLabName}</h1>` : ''}
              ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
              ${showContactInfo ? `<div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${safeAddress} | Tel: ${safePhone}</div>` : ''}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; text-align: left;" dir="ltr">
            ${safeLicense ? `
              <div style="text-align: right; ${qrEnabled && qrPosition === 'HEADER' ? 'border-right: 1.5px solid #cbd5e1; padding-right: 8px;' : ''}">
                <div style="font-size: 8.5px; color: #64748b;">${safeLicense}</div>
              </div>` : ""}
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="border: 1px solid ${boxColor}; border-radius: 4px; padding: 2px; background: #fff;">
                ${generateQrSvg(verifyUrl, 42)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 0.1 Academic Medical Center & Hospital
  if (template === 'ACADEMIC_HOSPITAL') {
    const emblemType = settings.labEmblem || 'microscope';
    const hdrCol = settings.headerBgColor || primaryCol || '#0f172a';
    return `
      <div class="academic-hospital-header" style="border-bottom: 3px double ${hdrCol}; padding-bottom: 10px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 44px; height: 44px; border: 2px solid ${hdrCol}; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: ${hdrCol};">
              ${renderEmblemSvg(emblemType, hdrCol, 26)}
            </div>
            <div style="flex: 1; ${labNameAlignStyle}">
              
              ${showLabName && safeLabName ? `<h1 style="margin: 0; ${getLabNameStyleCss(false, hdrCol)}">${safeLabName}</h1>` : ''}
              ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #475569; margin-top: 1px;">${safeLabSubtitle}</div>` : ''}
            </div>
          </div>
          <div style="text-align: left; font-size: 9px; color: #334155;" dir="ltr">
            <div><strong>DIRECTOR:</strong> ${safeDocName || 'Clinical Consultant'}</div>
            <div><strong>SPECIFICATION:</strong> ${safeDocTitle || 'Pathology &amp; Diagnostics'}</div>
            ${safeLicense ? `<div>${safeLicense}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  // 0.2 Mayo Executive Clinical
  if (template === 'MAYO_EXECUTIVE') {
    const hdrCol = settings.headerBgColor || primaryCol || '#1e3a8a';
    return `
      <div class="mayo-executive-header" style="border-bottom: 2px solid ${hdrCol}; padding-bottom: 8px; margin-bottom: 12px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `<h1 style="margin: 0; ${getLabNameStyleCss(false, hdrCol)}">${safeLabName}</h1>` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #64748b; margin-top: 1px;">${safeLabSubtitle}</div>` : ''}
            ${showContactInfo ? `<div style="font-size: 8.5px; color: #94a3b8; margin-top: 1px;">${safeAddress} | ${safePhone}</div>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;" dir="ltr">
            ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 38) : ''}
            <div style="text-align: left; font-size: 9px; color: #475569; border-left: 1px solid #cbd5e1; padding-left: 8px;">
              ${safeLicense ? `<div><strong>${safeLicense}</strong></div>` : ""}
              <div>DATE: <strong>${formatEnglishDate(new Date())}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 1. Authentic Indian Dual-Wing Clinical Header (Dr Lal PathLabs / Metropolis / NABL Aligned)
  if (template === 'INDIAN_DUAL_WING' || template === 'DR_LAL_CLINICAL') {
    const emblemType = settings.labEmblem || 'microscope';
    const hdrCol = settings.headerBgColor || primaryCol || '#0f172a';
    return `
      <div class="indian-dual-wing-header" style="border-bottom: 2.5px solid ${hdrCol}; padding-bottom: 12px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <!-- Right Wing: Clinical Identity & Microscope Emblem -->
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 52px; height: 52px; border-radius: 10px; background: ${hdrCol}; color: #fbbf24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #334155; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              ${renderEmblemSvg(emblemType, '#fbbf24', 32)}
            </div>
            <div style="flex: 1; ${labNameAlignStyle}">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                ${showLabName && safeLabName ? `<h1 style="margin: 0; ${getLabNameStyleCss(false, hdrCol)}">${safeLabName}</h1>` : ''}
                
              </div>
              ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
              ${showContactInfo ? `
                <div style="font-size: 9.5px; color: #64748b; margin-top: 2px; font-family: sans-serif;">
                  ${safeLicense ? `<span><strong style="color: #1e293b;">${safeLicense}</strong> • </span>` : ''}
                  <span>Address: ${safeAddress} | Tel: ${safePhone}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Left Wing: Barcode, SID & Verification QR -->
          <div style="display: flex; align-items: center; gap: 10px; text-align: left; flex-shrink: 0;" dir="ltr">
            <div>
              ${generateBarcodePatternSvg(settings.sampleNumber ? String(settings.sampleNumber) : '261014-09418')}
            </div>
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; background: #ffffff;">
                ${generateQrSvg(verifyUrl, 44)}
                
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 2. Regal Gold Frame (Executive Navy & Gold)
  if (template === 'REGAL_GOLD_FRAME') {
    const emblemType = settings.labEmblem || 'microscope';
    const regalBg = settings.headerBgColor || '#0f172a';
    const regalSec = settings.secondaryColor || '#1e293b';
    return `
      <div class="regal-gold-header" style="border: 2px solid ${regalBg}; border-top: 5px solid #d97706; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; background: linear-gradient(135deg, ${regalBg} 0%, ${regalSec} 100%) !important; color: #ffffff !important; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: rgba(217, 119, 6, 0.2); border: 1px solid #fbbf24; display: flex; align-items: center; justify-content: center; color: #fbbf24; flex-shrink: 0;">
              ${renderEmblemSvg(emblemType, '#fbbf24', 28)}
            </div>
            <div style="flex: 1; ${labNameAlignStyle}">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                ${showLabName && safeLabName ? `<h1 style="margin: 0; ${getLabNameStyleCss(true, '#fbbf24')}">${safeLabName}</h1>` : ''}
                <span style="font-size: 8px; font-weight: 900; padding: 2px 6px; background: #d97706; color: #000; border-radius: 4px;">EXECUTIVE</span>
              </div>
              ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #e2e8f0; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
              ${showContactInfo ? `<div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Address: ${safeAddress} | Tel: ${safePhone}</div>` : ''}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; text-align: left;" dir="ltr">
            ${safeLicense ? `
              <div style="color: #fbbf24; font-size: 10px; font-weight: 800;">
                <div style="font-size: 8px; color: #cbd5e1;">${safeLicense}</div>
              </div>` : ''}
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 3px; border-radius: 4px;">
                ${generateQrSvg(verifyUrl, 40)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 3. Minimal Pure Line (100% Ink-Saver Clean)
  if (template === 'MINIMAL_PURE_LINE') {
    const emblemType = settings.labEmblem || 'microscope';
    const lineColor = settings.headerBgColor || primaryCol || '#000000';
    return `
      <div class="minimal-pure-header" style="border-bottom: 1.5px solid ${lineColor}; padding-bottom: 10px; margin-bottom: 12px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <div style="width: 44px; height: 44px; border: 1.5px solid ${lineColor}; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${lineColor}; flex-shrink: 0;">
              ${renderEmblemSvg(emblemType, lineColor, 26)}
            </div>
            <div style="flex: 1; ${labNameAlignStyle}">
              ${showLabName && safeLabName ? `<h1 style="margin: 0; ${getLabNameStyleCss(false, lineColor)}">${safeLabName}</h1>` : ''}
              ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #334155; margin-top: 1px;">${safeLabSubtitle}</div>` : ''}
              ${showContactInfo ? `<div style="font-size: 9px; color: #475569; margin-top: 1px;">${safeAddress} | ${safePhone}</div>` : ''}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; text-align: left;" dir="ltr">
            <div style="font-size: 8.5px; font-family: monospace; color: #000000; border-left: 1px solid #000000; padding-left: 8px;">
              <div>STATUS: <strong>AUTHORIZED</strong></div>
              <div>DATE: ${formatEnglishDate(new Date())}</div>
            </div>
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="border: 1px solid #000000; padding: 2px; background: #fff;">
                ${generateQrSvg(verifyUrl, 38)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 4. Compact Micro Strip (Ultra-Dense Space Saver)
  if (template === 'COMPACT_MICRO_STRIP') {
    const emblemType = settings.labEmblem || 'microscope';
    const hdrCol = settings.headerBgColor || primaryCol || '#0f172a';
    return `
      <div class="compact-micro-header" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
          <div style="width: 28px; height: 28px; background: ${hdrCol}; color: #fbbf24; border-radius: 4px; display: flex; align-items: center; justify-content: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
            ${renderEmblemSvg(emblemType, '#fbbf24', 18)}
          </div>
          ${showLabName && safeLabName ? `<span style="${getLabNameStyleCss(false, hdrCol)} font-size: 14px !important;">${safeLabName}</span>` : ''}
          <span style="font-size: 9.5px; color: #64748b; margin-right: 8px;">${safeAddress} | ${safePhone}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 9.5px; font-family: monospace;" dir="ltr">
          <span style="background: #e2e8f0; padding: 1px 6px; border-radius: 3px; font-weight: bold; color: #0f172a;">FINAL REPORT</span>
          <span style="color: #15803d; font-weight: bold;">✓ VERIFIED</span>
        </div>
      </div>
    `;
  }

  // Wave Templates (Azure, Emerald, Indigo)
  if (template === 'AZURE_WAVE' || template === 'EMERALD_WAVE' || template === 'INDIGO_WAVE') {
    const waveStart = settings.headerBgColor || '#0f172a';
    const waveEnd = settings.secondaryColor || '#0284c7';
    let waveBg = `linear-gradient(135deg, ${waveStart} 0%, #0369a1 50%, ${waveEnd} 100%)`;
    let wavePath = 'M0,25 C150,75 350,-20 500,35 C650,90 900,10 1200,40 L1200,120 L0,120 Z';

    if (template === 'EMERALD_WAVE') {
      const emStart = settings.headerBgColor || '#064e3b';
      const emEnd = settings.secondaryColor || '#10b981';
      waveBg = `linear-gradient(135deg, ${emStart} 0%, #047857 50%, ${emEnd} 100%)`;
      wavePath = 'M0,30 C300,95 600,-15 900,60 C1050,95 1150,15 1200,35 L1200,120 L0,120 Z';
    } else if (template === 'INDIGO_WAVE') {
      const inStart = settings.headerBgColor || '#1e1b4b';
      const inEnd = settings.secondaryColor || '#7c3aed';
      waveBg = `linear-gradient(135deg, ${inStart} 0%, #4338ca 50%, ${inEnd} 100%)`;
      wavePath = 'M0,50 C350,-15 700,90 1200,20 L1200,120 L0,120 Z';
    }

    return `
      <div class="dynamic-wave-banner" style="position: relative; background: ${waveBg} !important; color: #ffffff !important; padding: 14px 18px 22px 18px; border-radius: 10px; margin-bottom: 14px; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">
        <!-- Wave Bottom Curve SVG -->
        <svg style="position: absolute; bottom: 0; left: 0; width: 100%; height: 26px; pointer-events: none; opacity: 0.3;" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="${wavePath}" fill="#ffffff"></path>
        </svg>

        ${hasCustomLogo && customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}

          <div style="flex: 1; ${labNameAlignStyle}">
            <div style="font-size: 8.5px; color: #bae6fd; letter-spacing: 0.5px; font-weight: 800; margin-bottom: 2px;">AURORA DYNAMIC WAVE DIAGNOSTICS</div>
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true)} margin-bottom: 3px; display: inline-flex; align-items: center; gap: 8px;">
                ${!hasCustomLogo && settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain;" />` : ''}
                <span>${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #e0f2fe !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #bae6fd !important;">${safeAddress} | ${safePhone}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                ${generateQrSvg(verifyUrl, 40)}
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(255, 255, 255, 0.18) !important; border: 1px solid rgba(255, 255, 255, 0.3); padding: 6px 10px; border-radius: 6px; text-align: left; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" dir="ltr">
                <h4 style="font-size: 11px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 9.5px; color: #e0f2fe !important; margin: 2px 0 0 0; font-weight: 600;">${safeDocTitle || 'Consultant Clinical Pathologist'}</p>
                ${safeLicense ? `<p style="font-size: 8.5px; color: rgba(255, 255, 255, 0.85) !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>

          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Modern Colored Gradient Header (Identical to settings preview)
  if (template === 'MODERN' || template === 'CLINICAL_FRAME' || template === 'CLINICAL_TEAL') {
    const gradStart = settings.headerBgColor || primaryCol || '#0284c7';
    const gradEnd = settings.secondaryColor || '#06b6d4';
    const hdrTextCol = settings.headerTextColor || '#ffffff';
    if (!hasCustomLogo) {
      return `
      <div class="modern-header-banner" style="background: linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%) !important; color: ${hdrTextCol} !important; padding: 12px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">
        <div style="flex: 1; ${labNameAlignStyle}">
          ${showLabName && safeLabName ? `
            <div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">
              ${settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : ''}
              <span style="vertical-align: middle;">${safeLabName}</span>
            </div>
          ` : ''}
          ${showLabSubtitle && safeLabSubtitle ? `
            <p style="margin: 2px 0 0 0; font-size: 10.5px; color: ${hdrTextCol} !important; opacity: 0.92; font-weight: 600;">${safeLabSubtitle}</p>
          ` : ''}
          ${showContactInfo ? `
            <p style="margin: 3px 0 0 0; font-size: 9.5px; color: ${hdrTextCol} !important; opacity: 0.85;">Address: ${safeAddress} | Tel: ${safePhone}</p>
          ` : ''}
        </div>

        <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
          ${qrEnabled && qrPosition === 'HEADER' ? `
            <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              ${generateQrSvg(verifyUrl, 40)}
            </div>
          ` : ''}
          ${showDoctorInfo ? `
            <div style="background: rgba(255, 255, 255, 0.18) !important; padding: 6px 10px; border-radius: 6px; text-align: right; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <h4 style="font-size: 11px; font-weight: 800; color: ${hdrTextCol} !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
              <p style="font-size: 9.5px; color: ${hdrTextCol} !important; opacity: 0.9; margin: 2px 0 0 0;">${safeDocTitle || 'Consultant Clinical Pathologist'}</p>
            </div>
          ` : ''}
        </div>
      </div>`;
    }

    // Custom Logo in Modern Template
    return `
      <div class="modern-header-banner" style="background: linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%) !important; color: #ffffff !important; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; overflow: hidden;">
        ${customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.95) !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: rgba(255, 255, 255, 0.85) !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | ${safeLicense}` : ''}</p>
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
                ${safeLicense ? `<p style="font-size: 9px; color: rgba(255, 255, 255, 0.78) !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
          ${customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // Bilingual Dual-Wing Template
  if (template === 'BILINGUAL_WINGS') {
    return `
      <div class="bilingual-wings-header" style="border-bottom: 2.5px solid ${settings.headerBgColor || primaryCol || '#0284c7'}; padding: 12px 14px; margin-bottom: 14px; background: #ffffff !important; position: relative; z-index: 1;">
        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; width: 100%;">
          <div style="text-align: right;">
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(false, settings.headerBgColor || primaryCol || '#0284c7')} margin-bottom: 2px;">
                ${safeLabName}
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">${safeLabSubtitle}</p>` : ''}
            ${showDoctorInfo ? `<p style="margin: 2px 0 0 0; font-size: 9.5px; color: #475569;">إشراف: ${safeDocName} - ${safeDocTitle}</p>` : ''}
          </div>
          <div style="text-align: center; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 0 12px;">
            ${hasCustomLogo ? renderCustomLogoBlock() : (settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: 38px; max-width: 65px; object-fit: contain;" />` : `
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f9ff; border: 2px solid ${settings.headerBgColor || primaryCol || '#0284c7'}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">
                🔬
              </div>
            `)}
            <div style="font-size: 8px; font-weight: 800; color: ${settings.headerBgColor || primaryCol || '#0284c7'}; margin-top: 2px; letter-spacing: 0.5px;">VERIFIED LAB</div>
          </div>
          <div style="text-align: left;" dir="ltr">
            <div style="font-size: ${Math.max(13, labNameFontSize - 4)}px; font-weight: 900; color: ${settings.headerBgColor || primaryCol || '#0284c7'} !important; margin-bottom: 2px;">
              ${escapeHtml(settings.labNameEn || 'CENTRAL CLINICAL LABORATORY')}
            </div>
            <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">Diagnostic &amp; Reference Services</p>
            ${showContactInfo ? `<p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">${safeAddress} | Tel: ${safePhone}</p>` : ''}
          </div>
        </div>
      </div>`;
  }

  // Pediatric & Family Care
  if (template === 'PEDIATRIC_CARE') {
    const pedStart = settings.headerBgColor || primaryCol || '#f97316';
    const pedEnd = settings.secondaryColor || '#38bdf8';
    return `
      <div class="pediatric-header-banner" style="background: linear-gradient(135deg, ${pedStart} 0%, ${pedEnd} 100%) !important; color: #ffffff !important; padding: 12px 18px; border-radius: 12px; margin-bottom: 14px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">
                ${safeLabName}
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<p style="margin: 2px 0 0 0; font-size: 10.5px; color: #fff7ed !important; font-weight: 600;">${safeLabSubtitle}</p>` : ''}
            ${showContactInfo ? `<p style="margin: 3px 0 0 0; font-size: 9.5px; color: rgba(255,255,255,0.9) !important;">${safeAddress} | ${safePhone}</p>` : ''}
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-right: 12px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center;">
                ${generateQrSvg(verifyUrl, 40)}
                <div style="font-size: 7.5px; font-weight: 900; color: #0284c7; margin-top: 1px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(255,255,255,0.2) !important; padding: 6px 10px; border-radius: 8px; text-align: left;" dir="ltr">
                <h4 style="font-size: 11px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName}</h4>
                <p style="font-size: 9px; color: #fff7ed !important; margin: 1px 0 0 0;">${safeDocTitle}</p>
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // Smart Digital & QR Header
  if (template === 'SMART_DIGITAL') {
    const smartBg = settings.headerBgColor || '#0f172a';
    const smartBorder = settings.secondaryColor || primaryCol || '#38bdf8';
    return `
      <div class="smart-digital-header" style="background: ${smartBg} !important; color: #ffffff !important; border-bottom: 3px solid ${smartBorder} !important; padding: 12px 18px; border-radius: 8px; margin-bottom: 14px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">
                ${safeLabName}
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<p style="margin: 2px 0 0 0; font-size: 10.5px; color: #e2e8f0 !important;">${safeLabSubtitle}</p>` : ''}
            ${showContactInfo ? `<p style="margin: 3px 0 0 0; font-size: 9.5px; color: #cbd5e1 !important;">${safeAddress} | ${safePhone}</p>` : ''}
          </div>
          <div style="display: flex; gap: 10px; align-items: center; margin-right: 12px;">
            <div style="background: #ffffff; padding: 4px; border-radius: 6px; text-align: center;">
              ${generateQrSvg(verifyUrl, 42)}
              
            </div>
            ${showDoctorInfo ? `
              <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); padding: 6px 10px; border-radius: 6px; text-align: left;" dir="ltr">
                <h4 style="font-size: 11px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName}</h4>
                <p style="font-size: 9px; color: #e2e8f0 !important; margin: 1px 0 0 0;">${safeDocTitle}</p>
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // Compact Micro Bar Template
  if (template === 'COMPACT_MICRO' || template === 'COMPACT_GRID' || template === 'COMPACT') {
    return `
      <div class="compact-micro-header" style="border-bottom: 2.5px solid ${settings.headerBgColor || primaryCol || '#2563eb'}; padding: 6px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #ffffff !important; position: relative; z-index: 1;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
          ${hasCustomLogo ? renderCustomLogoBlock() : (settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: 26px; max-width: 50px; object-fit: contain;" />` : '')}
          <div>
            ${showLabName && safeLabName ? `<span style="${getLabNameStyleCss(false, settings.headerBgColor || primaryCol || '#2563eb')} margin-right: 6px;">${safeLabName}</span>` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<span style="font-size: 9.5px; color: #64748b;">| ${safeLabSubtitle}</span>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; font-size: 9.5px; color: #475569;">
          ${showContactInfo ? `<span>📞 ${safePhone}</span>` : ''}
          ${showDoctorInfo ? `<span>👨‍⚕️ ${safeDocName}</span>` : ''}
          ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 32) : ''}
        </div>
      </div>`;
  }

  // Swiss Minimalist Clean
  if (template === 'SWISS_MINIMAL' || template === 'MINIMAL_CLEAN') {
    const swissCol = settings.headerBgColor || '#0f172a';
    return `
      <div class="swiss-minimal-header" style="border-bottom: 2.5px solid ${swissCol}; padding: 12px 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; background: #ffffff !important; position: relative; z-index: 1;">
        <div style="flex: 1; ${labNameAlignStyle}">
          
          ${showLabName && safeLabName ? `
            <div style="${getLabNameStyleCss(false, swissCol)} margin: 0; letter-spacing: -0.5px;">
              ${safeLabName}
            </div>
          ` : ''}
          ${showLabSubtitle && safeLabSubtitle ? `<p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">${safeLabSubtitle}</p>` : ''}
          ${showContactInfo ? `<p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">${safeAddress} | ${safePhone}</p>` : ''}
        </div>
        <div style="display: flex; gap: 10px; align-items: center; text-align: left;" dir="ltr">
          ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 40) : ''}
          ${showDoctorInfo ? `
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${safeDocName}</div>
              <div style="font-size: 9px; color: #64748b;">${safeDocTitle}</div>
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  // Multi-Accredited Enterprise
  if (template === 'MULTI_ACCREDITED') {
    return `
      <div class="multi-accredited-header" style="border-radius: 8px; overflow: hidden; margin-bottom: 14px; border: 1px solid #cbd5e1; position: relative; z-index: 1;">
        <div style="background: ${settings.headerBgColor || primaryCol || '#0c4a6e'} !important; color: #ffffff !important; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <div style="flex: 1; ${labNameAlignStyle}">
            ${showLabName && safeLabName ? `<div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">${safeLabName}</div>` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10.5px; opacity: 0.9; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
            ${showContactInfo ? `<div style="font-size: 9.5px; opacity: 0.8; margin-top: 2px;">${safeAddress} | ${safePhone}</div>` : ''}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 40) : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(255,255,255,0.18); padding: 6px 10px; border-radius: 6px; text-align: left;" dir="ltr">
                <div style="font-size: 11px; font-weight: 900; color: #ffffff;">${safeDocName}</div>
                <div style="font-size: 9px; opacity: 0.9;">${safeDocTitle}</div>
              </div>
            ` : ''}
          </div>
        </div>
        <div style="background: #f0fdf4 !important; border-top: 1px solid #bbf7d0; padding: 4px 14px; display: flex; justify-content: space-around; font-size: 9.5px; font-weight: 800; color: #166534;">
          <span>🛡️ ISO 15189 Certified</span>
          <span>🏆 JCI Accredited Lab</span>
          <span>⭐ CAP Quality Participant</span>
          <span>🔬 EQAS International Quality</span>
        </div>
      </div>`;
  }

  // Bauhaus Modular Grid
  if (template === 'BAUHAUS_GRID') {
    const bauCol = settings.headerBgColor || '#0f172a';
    return `
      <div class="bauhaus-grid-header" style="display: grid; grid-template-columns: 2fr 1fr 1fr; background: #f8fafc; border: 1.5px solid ${bauCol}; border-radius: 8px; overflow: hidden; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="padding: 12px 14px; border-left: 1px solid #cbd5e1;">
          <div style="font-size: 9px; color: #64748b; font-weight: 800;">CLINICAL DIAGNOSTIC INSTITUTION</div>
          ${showLabName && safeLabName ? `<div style="${getLabNameStyleCss(false, bauCol)} margin-bottom: 2px;">${safeLabName}</div>` : ''}
          ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
          ${showContactInfo ? `<div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">${safeAddress} | ${safePhone}</div>` : ''}
        </div>
        <div style="padding: 12px 12px; border-left: 1px solid #cbd5e1; background: #f1f5f9; text-align: left;" dir="ltr">
          
          <div style="font-size: 11px; font-weight: 900; color: #0f172a;">${safeDocName}</div>
          <div style="font-size: 9px; color: #64748b;">${safeDocTitle}</div>
          ${safeLicense ? `<div style="font-size: 8.5px; color: #94a3b8; margin-top: 2px;">${safeLicense}</div>` : ''}
        </div>
        <div style="padding: 12px 12px; background: #e2e8f0; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 38) : `
            
          `}
        </div>
      </div>`;
  }

  // Vertical Spine Accent
  if (template === 'VERTICAL_SPINE') {
    const spineStart = settings.headerBgColor || primaryCol || '#7c3aed';
    const spineEnd = settings.secondaryColor || '#4f46e5';
    return `
      <div class="vertical-spine-header" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 14px; display: flex; position: relative; z-index: 1;">
        <div style="width: 14px; background: linear-gradient(180deg, ${spineStart} 0%, ${spineEnd} 100%) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"></div>
        <div style="flex: 1; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `<div style="${getLabNameStyleCss(false, spineStart)} margin-bottom: 2px;">${safeLabName}</div>` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
            ${showContactInfo ? `<div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">${safeAddress} | ${safePhone}</div>` : ''}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 42) : ''}
            ${showDoctorInfo ? `
              <div style="border-right: 2px solid #ede9fe; padding-right: 12px; text-align: left;" dir="ltr">
                <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${safeDocName}</div>
                <div style="font-size: 9px; color: #64748b;">${safeDocTitle}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>`;
  }

  // Aurora Fluid Flow
  if (template === 'AURORA_FLOW') {
    const aurStart = settings.headerBgColor || primaryCol || '#4338ca';
    const aurEnd = settings.secondaryColor || '#06b6d4';
    return `
      <div class="aurora-flow-header" style="background: linear-gradient(135deg, ${aurStart} 0%, #6366f1 50%, ${aurEnd} 100%) !important; color: #ffffff !important; padding: 14px 18px; border-radius: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
        <div style="flex: 1; ${labNameAlignStyle}">
          
          ${showLabName && safeLabName ? `<div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">${safeLabName}</div>` : ''}
          ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; color: #e0e7ff; margin-top: 2px;">${safeLabSubtitle}</div>` : ''}
          ${showContactInfo ? `<div style="font-size: 9px; color: #c7d2fe; margin-top: 2px;">${safeAddress} | ${safePhone}</div>` : ''}
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${qrEnabled && qrPosition === 'HEADER' ? generateQrSvg(verifyUrl, 42) : ''}
          ${showDoctorInfo ? `
            <div style="background: rgba(255,255,255,0.2); padding: 6px 10px; border-radius: 8px; text-align: left;" dir="ltr">
              <div style="font-size: 11px; font-weight: 800; color: #ffffff;">${safeDocName}</div>
              <div style="font-size: 9px; color: #e0e7ff;">${safeDocTitle}</div>
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  // Glass Capsule Split (glass_capsule)
  if (template === 'GLASS_CAPSULE') {
    const capPrimary = settings.headerBgColor || primaryCol || '#0284c7';
    const capSecondary = settings.secondaryColor || '#0d9488';
    return `
      <div class="glass-capsule-header" style="display: flex; justify-content: space-between; align-items: stretch; gap: 10px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="flex: 1.5; background: linear-gradient(135deg, ${capPrimary}14 0%, ${capSecondary}0d 100%) !important; border: 1.5px solid ${capPrimary}45; border-right: 5px solid ${capPrimary}; border-radius: 14px; padding: 10px 16px; display: flex; align-items: center; gap: 12px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          ${hasCustomLogo ? renderCustomLogoBlock() : `
            <div style="width: 42px; height: 42px; border-radius: 12px; background: ${capPrimary}; color: #ffffff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              ${renderEmblemSvg(settings.labEmblem || 'microscope', '#ffffff', 24)}
            </div>
          `}
          <div style="flex: 1; ${labNameAlignStyle}">
            ${showLabName && safeLabName ? `<div style="${getLabNameStyleCss(false, capPrimary)} margin-bottom: 2px;">${safeLabName}</div>` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `<div style="font-size: 10px; font-weight: 700; color: #334155;">${safeLabSubtitle}</div>` : ''}
            ${showContactInfo ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${safeAddress} | ${safePhone}</div>` : ''}
          </div>
        </div>
        <div style="flex: 1; background: #f8fafc !important; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" dir="ltr">
          ${showDoctorInfo ? `
            <div style="text-align: left;">
              
              <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 1px;">${safeDocName}</div>
              <div style="font-size: 9px; color: #475569;">${safeDocTitle}</div>
              ${safeLicense ? `<div style="font-size: 8px; color: #64748b; margin-top: 1px;">${safeLicense}</div>` : ''}
            </div>
          ` : '<div></div>'}
          ${qrEnabled && qrPosition === 'HEADER' ? `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 3px; flex-shrink: 0;">
              ${generateQrSvg(verifyUrl, 38)}
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  // Pre-printed stationery reserved space
  if (template === 'PREPRINTED_STATIONERY') {
    return `<div style="height: ${Math.max(25, (settings.topMarginMm || 35) * 2)}px; margin-bottom: 10px;"></div>`;
  }

  // Executive Luxury Template
  if (template === 'EXECUTIVE' || template === 'EXECUTIVE_LUXURY') {
    const execStart = settings.headerBgColor || '#0f172a';
    const execEnd = settings.secondaryColor || '#1e293b';
    return `
      <div class="executive-header-banner" style="background: linear-gradient(135deg, ${execStart} 0%, ${execEnd} 100%) !important; color: #f8fafc !important; border-bottom: 3.5px solid #b45309 !important; padding: 14px 18px; border-radius: 6px; margin-bottom: 16px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; overflow: hidden;">
        ${hasCustomLogo && customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true, '#fbbf24')} margin-bottom: 2px;">
                ${!hasCustomLogo && settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : ''}
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #cbd5e1 !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8 !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | ${safeLicense}` : ''}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 8px; font-weight: 800; color: #b45309; margin-top: 2px; letter-spacing: 0.5px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(180, 83, 9, 0.22) !important; border: 1px solid #b45309; padding: 8px 12px; border-radius: 6px; text-align: left; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" dir="ltr">
                <h4 style="font-size: 12px; font-weight: 900; color: #fbbf24 !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 10px; color: #cbd5e1 !important; margin: 2px 0 0 0; font-weight: 600;">${safeDocTitle || 'Consultant Clinical Pathologist'}</p>
                ${safeLicense ? `<p style="font-size: 9px; color: #fef3c7 !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // CBC Diagnostic Template
  if (template === 'CBC_DIAGNOSTIC' || template === 'DIAGNOSTIC_ACCENT') {
    const cbcStart = settings.headerBgColor || '#7f1d1d';
    const cbcEnd = settings.secondaryColor || '#dc2626';
    return `
      <div class="cbc-header-banner" style="background: linear-gradient(135deg, ${cbcStart} 0%, ${cbcEnd} 100%) !important; color: #ffffff !important; border-bottom: 3px solid ${cbcStart} !important; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; overflow: hidden;">
        ${hasCustomLogo && customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">
                ${!hasCustomLogo && settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : ''}
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.95) !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: rgba(255,255,255,0.85) !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | ${safeLicense}` : ''}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 8px; font-weight: 800; color: #dc2626; margin-top: 2px; letter-spacing: 0.5px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(255, 255, 255, 0.18) !important; border: 1px solid rgba(255, 255, 255, 0.3); padding: 8px 12px; border-radius: 6px; text-align: left; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" dir="ltr">
                <h4 style="font-size: 12px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 10px; color: rgba(255, 255, 255, 0.92) !important; margin: 2px 0 0 0; font-weight: 600;">${safeDocTitle || 'Consultant Hematologist'}</p>
                ${safeLicense ? `<p style="font-size: 9px; color: rgba(255, 255, 255, 0.8) !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // Multi-Section Specialized Template
  if (template === 'SPECIALIZED' || template === 'MULTI_SECTION') {
    const specStart = settings.headerBgColor || '#881337';
    const specEnd = settings.secondaryColor || '#e11d48';
    return `
      <div class="multi-section-header" style="background: linear-gradient(135deg, ${specStart} 0%, ${specEnd} 100%) !important; color: #ffffff !important; border-bottom: 3px solid ${specStart} !important; padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; overflow: hidden;">
        ${hasCustomLogo && customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true)} margin-bottom: 2px;">
                ${!hasCustomLogo && settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : ''}
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.95) !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: rgba(255,255,255,0.85) !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | ${safeLicense}` : ''}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 8px; font-weight: 800; color: #e11d48; margin-top: 2px; letter-spacing: 0.5px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: rgba(255, 255, 255, 0.18) !important; border: 1px solid rgba(255, 255, 255, 0.3); padding: 8px 12px; border-radius: 6px; text-align: left; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" dir="ltr">
                <h4 style="font-size: 12px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 10px; color: rgba(255, 255, 255, 0.92) !important; margin: 2px 0 0 0; font-weight: 600;">${safeDocTitle || 'Consultant Pathologist'}</p>
                ${safeLicense ? `<p style="font-size: 9px; color: rgba(255, 255, 255, 0.8) !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // Royal Classic Template
  if (template === 'ROYAL_CLASSIC') {
    const royalCol = settings.headerBgColor || primaryCol || '#1e3a8a';
    return `
      <div class="royal-classic-header" style="border: 2px solid ${royalCol}; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; background: #f8fafc !important; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
        ${hasCustomLogo && customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(false, royalCol)} margin-bottom: 2px;">
                ${!hasCustomLogo && settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : ''}
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569 !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | ${safeLicense}` : ''}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border: 1px solid ${royalCol}; border-radius: 6px; display: flex; flex-direction: column; align-items: center;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 8px; font-weight: 800; color: ${royalCol}; margin-top: 2px; letter-spacing: 0.5px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: #ffffff; border: 1.5px solid ${royalCol}; padding: 8px 12px; border-radius: 6px; text-align: left;" dir="ltr">
                <h4 style="font-size: 12px; font-weight: 900; color: ${royalCol} !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 10px; color: #475569 !important; margin: 2px 0 0 0; font-weight: 600;">${safeDocTitle || 'Consultant Clinical Pathologist'}</p>
                ${safeLicense ? `<p style="font-size: 9px; color: #64748b !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  // Monochrome Laser Template
  if (template === 'BLACK_WHITE' || template === 'MONOCHROME_LASER' || template === 'ECO_MONOCHROME') {
    return `
      <div class="mono-header-banner" style="background: #000000 !important; color: #ffffff !important; border: 2px solid #000000; padding: 14px 18px; margin-bottom: 16px; position: relative; z-index: 1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">
        ${hasCustomLogo && customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 8px;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${hasCustomLogo && customAlign === 'left' ? `<div style="margin-right: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
          <div style="flex: 1; ${labNameAlignStyle}">
            ${showLabName && safeLabName ? `
              <div style="${getLabNameStyleCss(true, '#ffffff')} margin-bottom: 2px;">
                ${!hasCustomLogo && settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" filter: grayscale(100%);" />` : ''}
                <span style="vertical-align: middle;">${safeLabName}</span>
              </div>
            ` : ''}
            ${showLabSubtitle && safeLabSubtitle ? `
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #e2e8f0 !important; font-weight: 600;">${safeLabSubtitle}</p>
            ` : ''}
            ${showContactInfo ? `
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #cbd5e1 !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | ${safeLicense}` : ''}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="background: #ffffff; padding: 4px; border: 1px solid #000; border-radius: 4px; display: flex; flex-direction: column; align-items: center;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 8px; font-weight: 900; color: #000000; margin-top: 2px; letter-spacing: 0.5px;">VERIFY</div>
              </div>
            ` : ''}
            ${showDoctorInfo ? `
              <div style="background: #000000; border: 1px solid #ffffff; padding: 8px 12px; border-radius: 4px; text-align: left;" dir="ltr">
                <h4 style="font-size: 12px; font-weight: 900; color: #ffffff !important; margin: 0;">${safeDocName || 'Dr. Laboratory Director'}</h4>
                <p style="font-size: 10px; color: #e2e8f0 !important; margin: 2px 0 0 0;">${safeDocTitle || 'Consultant Clinical Pathologist'}</p>
                ${safeLicense ? `<p style="font-size: 9px; color: #cbd5e1 !important; margin: 2px 0 0 0;">${safeLicense}</p>` : ''}
              </div>
            ` : ''}
          </div>
          ${hasCustomLogo && customAlign === 'right' ? `<div style="margin-left: 14px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        </div>
      </div>`;
  }

  if (!hasCustomLogo) {
    return `
    <div class="header-border" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; margin-bottom: 16px; position: relative; z-index: 1;">
      <div style="flex: 1; ${labNameAlignStyle}">
        ${showLabName && safeLabName ? `
          <h1 style="margin: 0; ${getLabNameStyleCss(false)}">
            ${settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="Logo" style="height: ${Math.min(36, labNameFontSize + 8)}px; max-width: 60px; object-fit: contain; margin-left: 8px; vertical-align: middle;" />` : ''}
            <span style="vertical-align: middle;">${safeLabName}</span>
          </h1>
        ` : ''}
        ${showLabSubtitle && safeLabSubtitle ? `
          <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">${safeLabSubtitle}</p>
        ` : ''}
        ${showContactInfo ? `
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">Address: ${safeAddress} | Tel: ${safePhone}</p>
        ` : ''}
      </div>

      ${(showDoctorInfo || (qrEnabled && qrPosition === 'HEADER')) ? `
        <div style="display: flex; align-items: center; gap: 14px; margin-right: 16px;">
          ${qrEnabled && qrPosition === 'HEADER' ? `
            <div style="text-align: center;">
              ${generateQrSvg(verifyUrl, 44)}
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Scan to Verify</div>
            </div>
          ` : ''}

          ${showDoctorInfo ? `
            <div style="text-align: left;" dir="ltr">
              <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${safeDocName || 'Laboratory Director'}</div>
              <div style="font-size: 11px; color: #64748b;">${safeDocTitle || 'Consultant Clinical Pathologist'}</div>
              ${safeLicense ? `<div style="font-size: 10px; color: #94a3b8;">${safeLicense}</div>` : ""}
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>`;
  }

  // Custom Logo in Classic / Other Templates
  return `
    <div class="header-border" style="padding-bottom: 14px; margin-bottom: 16px; position: relative; z-index: 1;">
      ${customAlign === 'center' ? `<div style="text-align: center; margin-bottom: 10px;">${renderCustomLogoBlock()}</div>` : ''}
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        ${customAlign === 'left' ? `<div style="margin-right: 16px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
        <div style="flex: 1; ${labNameAlignStyle}">
          ${showLabName && safeLabName ? `
            <h1 style="margin: 0; ${getLabNameStyleCss(false)}">
              <span style="vertical-align: middle;">${safeLabName}</span>
            </h1>
          ` : ''}
          ${showLabSubtitle && safeLabSubtitle ? `
            <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748b; font-weight: 600;">${safeLabSubtitle}</p>
          ` : ''}
          ${showContactInfo ? `
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">Address: ${safeAddress} | Tel: ${safePhone}</p>
          ` : ''}
        </div>

        ${(showDoctorInfo || (qrEnabled && qrPosition === 'HEADER')) ? `
          <div style="display: flex; align-items: center; gap: 14px; margin-right: 16px;">
            ${qrEnabled && qrPosition === 'HEADER' ? `
              <div style="text-align: center;">
                ${generateQrSvg(verifyUrl, 44)}
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Scan to Verify</div>
              </div>
            ` : ''}

            ${showDoctorInfo ? `
              <div style="text-align: left;" dir="ltr">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${safeDocName || 'Laboratory Director'}</div>
                <div style="font-size: 11px; color: #64748b;">${safeDocTitle || 'Consultant Clinical Pathologist'}</div>
                ${safeLicense ? `<div style="font-size: 10px; color: #94a3b8;">${safeLicense}</div>` : ""}
              </div>
            ` : ''}
          </div>
        ` : ''}
        ${customAlign === 'right' ? `<div style="margin-left: 16px; flex-shrink: 0;">${renderCustomLogoBlock()}</div>` : ''}
      </div>
    </div>`;
}

export interface PatientMetaBoxParams {
  showPatientBox: boolean;
  safePatientName: string;
  safeDoctorName: string;
  clinicalAge: string;
  gender: string;
  sampleNumber: any;
  primaryCol: string;
  createdAt: string;
  settings?: any;
}

export function renderPatientMetaBox(params: PatientMetaBoxParams): string {
  const {
    showPatientBox,
    safePatientName,
    safeDoctorName,
    clinicalAge,
    gender,
    sampleNumber,
    primaryCol,
    createdAt,
    settings,
  } = params;

  if (!showPatientBox) return '';

  const nameSize = settings?.patientNameFontSize ? `${settings.patientNameFontSize}px` : '12px';
  const infoSize = settings?.patientInfoFontSize ? `${settings.patientInfoFontSize}px` : '11px';

  const layout = settings?.patientLayout || (settings?.reportTemplate === 'INDIAN_DUAL_WING' || settings?.reportTemplate === 'DR_LAL_CLINICAL' ? 'grid' : 'grid');

  // Layout 1: 3-Row Comprehensive Grid (Default & Indian Standard)
  if (layout === 'grid') {
    return `
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 14px; font-size: ${infoSize}; background: #f8fafc; position: relative; z-index: 1;" dir="ltr">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: ${infoSize};">
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; width: 22%; background: #f1f5f9; color: #475569; font-weight: 600;">Patient Name:</td>
              <td style="padding: 4px 8px; width: 28%; font-weight: 800; color: #0f172a; font-size: ${nameSize};">${safePatientName}</td>
              <td style="padding: 4px 8px; width: 22%; background: #f1f5f9; color: #475569; font-weight: 600;">Sample ID:</td>
              <td style="padding: 4px 8px; width: 28%; font-weight: 800; color: ${primaryCol || '#005691'}; font-family: monospace;">#${toEnglishDigits(sampleNumber)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Age / Sex:</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #1e293b;">${clinicalAge} / ${gender === 'FEMALE' ? 'Female' : 'Male'}</td>
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Referred By:</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #1e293b;">${safeDoctorName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Collection Date:</td>
              <td style="padding: 4px 8px; color: #334155; font-family: monospace;">${formatEnglishDate(createdAt)}</td>
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Report Status:</td>
              <td style="padding: 4px 8px; font-weight: 800; color: #16a34a;"><span style="background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 4px; font-size: 10px;">Verified (Final)</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Layout 2: Modern 3 Floating Cards
  if (layout === 'cards') {
    return `
      <div style="display: grid; grid-template-columns: 1.4fr 1.2fr 1.2fr; gap: 8px; margin-bottom: 14px; font-size: ${infoSize}; position: relative; z-index: 1;" dir="ltr">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px;">
          <div style="color: #64748b; font-size: 9.5px; font-weight: 600;">Patient Name:</div>
          <div style="font-weight: 800; color: #0f172a; font-size: ${nameSize};">${safePatientName}</div>
          <div style="color: #475569; font-size: ${infoSize}; margin-top: 2px;">Age / Sex: <strong>${clinicalAge} / ${gender === 'FEMALE' ? 'Female' : 'Male'}</strong></div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px;">
          <div style="color: #64748b; font-size: 9.5px; font-weight: 600;">Referred By:</div>
          <div style="font-weight: 700; color: #0f172a; font-size: ${infoSize};">${safeDoctorName}</div>
          <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">Date: <span style="color: #334155;">${formatEnglishDate(createdAt)}</span></div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 9.5px; font-weight: 600;">Sample ID:</span>
            <strong style="color: ${primaryCol || '#0284c7'}; font-size: ${infoSize}; font-family: monospace;">#${toEnglishDigits(sampleNumber)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span style="color: #64748b; font-size: 9.5px;">Status:</span>
            <span style="color: #16a34a; font-weight: 800; font-size: 10.5px;">Verified (Final)</span>
          </div>
        </div>
      </div>
    `;
  }

  // Layout 3: Compact 2-Line Ribbon
  if (layout === 'compact') {
    return `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 10px; margin-bottom: 12px; font-size: ${infoSize}; position: relative; z-index: 1;" dir="ltr">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 3px;">
          <div><span style="color: #64748b;">Patient Name: </span><strong style="color: #0f172a; font-size: ${nameSize};">${safePatientName}</strong> (${clinicalAge} / ${gender === 'FEMALE' ? 'Female' : 'Male'})</div>
          <div><span style="color: #64748b;">Sample ID: </span><strong style="color: ${primaryCol || '#0284c7'}; font-family: monospace;">#${toEnglishDigits(sampleNumber)}</strong></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: ${infoSize};">
          <div><span style="color: #64748b;">Referred By: </span><strong style="color: #334155;">${safeDoctorName}</strong> | Age / Sex: <strong>${clinicalAge} / ${gender === 'FEMALE' ? 'Female' : 'Male'}</strong></div>
          <div><span style="color: #64748b;">Date: </span>${formatEnglishDate(createdAt)} | <strong style="color: #16a34a;">Verified (Final)</strong></div>
        </div>
      </div>
    `;
  }

  // Layout 4: Classic Boxed Grid
  return `
    <div style="background: #ffffff; border: 1.5px solid #0f172a; border-radius: 4px; padding: 8px 12px; margin-bottom: 14px; font-size: ${infoSize}; position: relative; z-index: 1;" dir="ltr">
      <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        <div><span style="color: #64748b;">Patient Name: </span><strong style="color: #0f172a; font-size: ${nameSize};">${safePatientName}</strong></div>
        <div><span style="color: #64748b;">Age / Sex: </span><strong style="color: #0f172a;">${clinicalAge} / ${gender === 'FEMALE' ? 'Female' : 'Male'}</strong></div>
        <div><span style="color: #64748b;">Sample ID: </span><strong style="color: ${primaryCol || '#0f172a'}; font-family: monospace;">#${toEnglishDigits(sampleNumber)}</strong></div>
      </div>
      <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px; margin-top: 4px; font-size: ${infoSize}; color: #475569;">
        <div><span style="color: #64748b;">Referred By: </span><strong>${safeDoctorName}</strong></div>
        <div><span style="color: #64748b;">Date: </span><span>${formatEnglishDate(createdAt)}</span></div>
        <div><span style="color: #64748b;">Status: </span><strong style="color: #16a34a;">Verified (Final)</strong></div>
      </div>
    </div>`;
}
