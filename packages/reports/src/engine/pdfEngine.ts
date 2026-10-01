import { getSystemBrowserPath } from './browserDetector';

export interface PdfEngineOptions {
  format?: 'A4' | 'A5';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * High-performance PDF renderer using Puppeteer and system-installed Chrome/Edge.
 */
export async function renderHtmlToPdf(html: string, options: PdfEngineOptions = {}): Promise<Buffer> {
  const puppeteer = (await import('puppeteer')).default;
  const execPath = getSystemBrowserPath();

  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };
  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: options.printBackground ?? true,
      margin: options.margin || { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch(() => {});
  }
}
