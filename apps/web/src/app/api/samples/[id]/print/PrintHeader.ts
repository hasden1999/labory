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
  primaryCol?: string;
  verifyUrl?: string;
}

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
    template = 'CLASSIC',
    primaryCol = '#0284c7',
    verifyUrl = '',
  } = params;

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
            <p style="margin: 4px 0 0 0; font-size: 10px; color: rgba(255, 255, 255, 0.85) !important;">Address: ${safeAddress} | Tel: ${safePhone} ${safeLicense ? ` | License: ${safeLicense}` : ''}</p>
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
              <div style="font-size: 10px; color: #94a3b8;">License: ${safeLicense || 'MOH-2026'}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
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
  } = params;

  if (!showPatientBox) return '';
  return `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; position: relative; z-index: 1;" dir="ltr">
      <div><span style="color: #64748b;">Patient Name:</span> <strong>${safePatientName}</strong></div>
      <div><span style="color: #64748b;">Age / Sex:</span> <strong>${clinicalAge} / ${gender === 'FEMALE' ? 'Female' : 'Male'}</strong></div>
      <div><span style="color: #64748b;">Sample ID:</span> <strong style="color: ${primaryCol};">#${toEnglishDigits(sampleNumber)}</strong></div>
      <div><span style="color: #64748b;">Referred By:</span> <strong>${safeDoctorName}</strong></div>
      <div><span style="color: #64748b;">Date:</span> <strong>${formatEnglishDate(createdAt)}</strong></div>
      <div><span style="color: #64748b;">Status:</span> <strong style="color: #16a34a;">Verified (Final)</strong></div>
    </div>`;
}
