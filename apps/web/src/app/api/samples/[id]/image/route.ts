import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';
import { getSharedBrowser } from '../../../../../lib/puppeteerLauncher';
import { GET as getPrintReport } from '../print/route';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

  if (!sample) {
    return new Response('Sample not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const section = (searchParams.get('section') || 'all').toLowerCase();

  try {
    // Generate the exact HTML representation for the requested section in single/image mode
    const printUrl = new URL(request.url);
    printUrl.searchParams.set('mode', 'single');
    printUrl.searchParams.set('force', 'true');
    if (section && section !== 'all') {
      printUrl.searchParams.set('section', section);
    }

    const customRequest = new Request(printUrl.toString(), {
      headers: request.headers,
    });

    const printResponse = await getPrintReport(customRequest, { params });
    let html = await printResponse.text();

    // Determine baseUrl from the incoming request (e.g. http://localhost:8080)
    const reqUrl = new URL(request.url);
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

    // Inject <base href="${baseUrl}/"> into HTML <head> so relative assets and local fonts load correctly
    if (!html.includes('<base ')) {
      html = html.replace('<head>', `<head>\n  <base href="${baseUrl}/">`);
    }

    const browser = await getSharedBrowser();
    const page = await browser.newPage();
    try {
      // Use 2x Retina scale factor so medical report image is ultra sharp on high-DPI smartphone displays
      await page.setViewport({
        width: 840,
        height: 1100,
        deviceScaleFactor: 2,
      });

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Wait for document fonts to finish loading (replaces arbitrary setTimeout delay)
      await page.evaluateHandle('document.fonts.ready').catch(() => {});

      const screenshotBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 92,
        fullPage: true,
      });

      return new Response(new Uint8Array(screenshotBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `inline; filename="sample-${sample.sampleNumber}-${section}.jpg"`,
          'Cache-Control': 'public, max-age=300',
        },
      });
    } finally {
      // Guarantee page/tab is closed in all cases without closing shared browser instance
      await page.close().catch(() => {});
    }
  } catch (err: any) {
    console.error('[ImageRoute] Failed generating image snapshot:', err);
    return NextResponse.json(
      {
        error: 'Failed to generate medical report image',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
