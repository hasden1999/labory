import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

export interface ReportData {
  labName: string;
  labAddress?: string | null;
  labPhone?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  sampleNumber: number;
  sampleDate: string;
  tests: {
    testName: string;
    category: string;
    resultValue: string;
    unit?: string | null;
    refRangeLow?: number | null;
    refRangeHigh?: number | null;
    refRangeText?: string | null;
    isAbnormal?: boolean | null;
  }[];
}

export async function generateSampleReportPDF(data: ReportData): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      sample: data.sampleNumber,
      patient: data.patientName,
      date: data.sampleDate,
      verified: true,
    })
  );

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نتائج الفحص الطبي #${data.sampleNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #ffffff;
          color: #1e293b;
          padding: 30px;
          direction: rtl;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #0284c7;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .lab-info h1 {
          font-size: 22px;
          color: #0369a1;
          font-weight: 800;
        }
        .lab-info p {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .meta-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          font-size: 14px;
        }
        .meta-item {
          display: flex;
        }
        .meta-label {
          font-weight: 700;
          color: #475569;
          width: 120px;
        }
        .meta-value {
          color: #0f172a;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 14px;
          padding: 12px;
          text-align: right;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .badge-abnormal {
          background-color: #fef2f2;
          color: #dc2626;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid #fecaca;
        }
        .badge-normal {
          color: #059669;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-text {
          font-size: 12px;
          color: #64748b;
        }
        .qr-code img {
          width: 80px;
          height: 80px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="lab-info">
          <h1>${data.labName}</h1>
          <p>${data.labAddress || ''} ${data.labPhone ? ' | هاتف: ' + data.labPhone : ''}</p>
        </div>
        <div class="report-title" style="text-align: left;">
          <h2 style="font-size: 18px; color: #0284c7;">تقرير نتائج عينة #${data.sampleNumber}</h2>
          <p style="font-size: 12px; color: #64748b;">التاريخ: ${data.sampleDate}</p>
        </div>
      </div>

      <div class="meta-box">
        <div class="meta-item">
          <span class="meta-label">اسم المريض:</span>
          <span class="meta-value">${data.patientName}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">رقم العينة:</span>
          <span class="meta-value">#${data.sampleNumber}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">العمر / الجنس:</span>
          <span class="meta-value">${data.patientAge ? data.patientAge + ' سنة' : '-'} / ${data.patientGender || '-'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">تاريخ التقرير:</span>
          <span class="meta-value">${data.sampleDate}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>اسم الفحص</th>
            <th>النتيجة</th>
            <th>الوحدة</th>
            <th>القيم الطبيعية (Reference Range)</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${data.tests
            .map(
              (t) => `
            <tr>
              <td style="font-weight: 700;">${t.testName}</td>
              <td style="font-size: 15px; font-weight: 800; color: ${t.isAbnormal ? '#dc2626' : '#0f172a'};">
                ${t.resultValue}
              </td>
              <td>${t.unit || '-'}</td>
              <td>${t.refRangeText || (t.refRangeLow !== null && t.refRangeHigh !== null ? `${t.refRangeLow} - ${t.refRangeHigh}` : '-')}</td>
              <td>
                ${
                  t.isAbnormal
                    ? '<span class="badge-abnormal">خارج المدى الطبيعي ⚠️</span>'
                    : '<span class="badge-normal">طبيعي ✓</span>'
                }
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        <div class="footer-text">
          <p>تم تدقيق وتأكيد النتائج إلكترونيًا بواسطة نظام Lab Manager</p>
          <p style="margin-top: 4px; font-size: 10px; color: #94a3b8;">هذا التقرير موثق كودياً ولا يحتاج إلى توقيع يدوي.</p>
        </div>
        <div class="qr-code">
          <img src="${qrDataUrl}" alt="رمز التحقق" />
        </div>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  });
  await browser.close();

  return Buffer.from(pdfBuffer);
}
