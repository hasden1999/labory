import { getSharedBrowser } from './puppeteerLauncher';
import { GET as getPrintReport } from '../app/api/samples/[id]/print/route';

interface GeneratePdfOptions {
  section?: string;
  baseUrl?: string;
}

/**
 * Generates an authentic vector PDF representation of the medical report
 * using Puppeteer and the exact same HTML/CSS template engine as print/route.ts.
 * Reflects all template styles, custom colors, logos, and clinical findings.
 */
export async function generatePuppeteerPdf(
  sampleId: string,
  requestUrl?: string | URL,
  options?: GeneratePdfOptions
): Promise<Buffer> {
  const section = (options?.section || 'all').toLowerCase();
  const urlObj = requestUrl ? new URL(String(requestUrl)) : new URL(`http://127.0.0.1:8080/api/samples/${sampleId}/print`);
  
  urlObj.pathname = `/api/samples/${sampleId}/print`;
  urlObj.searchParams.set('force', 'true');
  if (section && section !== 'all') {
    urlObj.searchParams.set('section', section);
  }

  const customRequest = new Request(urlObj.toString(), {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Labryo-Internal-PDF-Renderer',
    },
  });

  const printResponse = await getPrintReport(customRequest, { params: { id: sampleId } });
  if (!printResponse.ok) {
    throw new Error(`فشل إنشاء قالب التقرير للطباعة (Status: ${printResponse.status})`);
  }

  let html = await printResponse.text();
  const baseUrl = options?.baseUrl || `${urlObj.protocol}//${urlObj.host}`;

  // Inject <base href="..."> so local fonts and assets resolve properly
  if (!html.includes('<base ')) {
    html = html.replace('<head>', `<head>\n  <base href="${baseUrl}/">`);
  }

  const browser = await getSharedBrowser();
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(25000);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Ensure all web fonts are loaded
    await page.evaluateHandle('document.fonts.ready').catch(() => {});

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await page.close().catch(() => {});
  }
}
