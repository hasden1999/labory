import QRCode from 'qrcode';
import { ReportData } from '../templates/types';
import { renderClassicTemplate } from '../templates/ClassicTemplate';
import { renderHtmlToPdf } from '../engine/pdfEngine';

export async function generateQrCodeDataUrl(payload: any): Promise<string> {
  return await QRCode.toDataURL(
    typeof payload === 'string' ? payload : JSON.stringify(payload)
  );
}

export async function generateSampleReportPDF(data: ReportData): Promise<Buffer> {
  const qrDataUrl = await generateQrCodeDataUrl({
    sample: data.sampleNumber,
    patient: data.patientName,
    date: data.sampleDate,
    verified: true,
  });

  const html = renderClassicTemplate(data, qrDataUrl);
  return await renderHtmlToPdf(html, { format: 'A4' });
}
