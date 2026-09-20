import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';
import { launchBrowser } from '../../../../../lib/puppeteerLauncher';
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
    const html = await printResponse.text();

    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      // Use 2x Retina scale factor so medical report image is ultra sharp on high-DPI smartphone displays
      await page.setViewport({
        width: 840,
        height: 1100,
        deviceScaleFactor: 2,
      });

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Allow Google Fonts or icons a short moment to render
      await new Promise(r => setTimeout(r, 200));

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
      await browser.close().catch(() => {});
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
