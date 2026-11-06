import { getStore } from './serverStore';
import { getSharedBrowser } from './puppeteerLauncher';
import { GET as getPrintReport } from '../app/api/samples/[id]/print/route';

export interface ReportImageResult {
  buffer: Buffer;
  dataUrl: string;
  pageIndex: number;
  totalPages: number;
}

export interface GenerateReportImagesOptions {
  section?: string;
  format?: 'png' | 'jpeg';
  pageIndex?: number;
}

/**
 * Generates independent, high-resolution (2x Retina) medical report images for each page/card.
 * If a sample contains multiple cards (e.g. Chemistry/Sugar + Urine/GUE), each card is
 * captured as a distinct, un-cropped, properly formatted A4 image instead of a single long image.
 */
export async function generateReportImages(
  sampleId: string,
  reqUrl?: string,
  options?: GenerateReportImagesOptions
): Promise<ReportImageResult[]> {
  const store = getStore();
  const sample = store.samples.find(s => s.id === sampleId || String(s.sampleNumber) === sampleId);
  if (!sample) {
    throw new Error(`العينة غير موجودة: ${sampleId}`);
  }

  const effectiveReqUrl = reqUrl || 'http://127.0.0.1:8080/api/samples/image';
  const urlObj = new URL(effectiveReqUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const printUrl = new URL(`/api/samples/${sample.id}/print`, baseUrl);
  printUrl.searchParams.set('mode', 'single');
  printUrl.searchParams.set('force', 'true');
  if (options?.section && options.section !== 'all') {
    printUrl.searchParams.set('section', options.section);
  }

  const customRequest = new Request(printUrl.toString(), {
    headers: { 'host': urlObj.host },
  });

  const printResponse = await getPrintReport(customRequest, { params: { id: sample.id } });
  let html = await printResponse.text();

  if (!html.includes('<base ')) {
    html = html.replace('<head>', `<head>\n  <base href="${baseUrl}/">`);
  }

  const browser = await getSharedBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: 840,
      height: 1100,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluateHandle('document.fonts.ready').catch(() => {});

    const cards = await page.$$('.report-card');
    const isPng = (options?.format || 'png').toLowerCase() === 'png';
    const mime = isPng ? 'image/png' : 'image/jpeg';

    if (cards.length === 0) {
      const buf = await page.screenshot({
        type: isPng ? 'png' : 'jpeg',
        ...(isPng ? {} : { quality: 92 }),
        fullPage: true,
      });
      const nodeBuffer = Buffer.from(buf);
      return [
        {
          buffer: nodeBuffer,
          dataUrl: `data:${mime};base64,${nodeBuffer.toString('base64')}`,
          pageIndex: 0,
          totalPages: 1,
        },
      ];
    }

    if (options?.pageIndex !== undefined && options.pageIndex >= 0 && options.pageIndex < cards.length) {
      const targetCard = cards[options.pageIndex];
      const buf = await targetCard.screenshot({
        type: isPng ? 'png' : 'jpeg',
        ...(isPng ? {} : { quality: 92 }),
      });
      const nodeBuffer = Buffer.from(buf);
      return [
        {
          buffer: nodeBuffer,
          dataUrl: `data:${mime};base64,${nodeBuffer.toString('base64')}`,
          pageIndex: options.pageIndex,
          totalPages: cards.length,
        },
      ];
    }

    const results: ReportImageResult[] = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const buf = await card.screenshot({
        type: isPng ? 'png' : 'jpeg',
        ...(isPng ? {} : { quality: 92 }),
      });
      const nodeBuffer = Buffer.from(buf);
      results.push({
        buffer: nodeBuffer,
        dataUrl: `data:${mime};base64,${nodeBuffer.toString('base64')}`,
        pageIndex: i,
        totalPages: cards.length,
      });
    }

    return results;
  } finally {
    await page.close().catch(() => {});
  }
}
