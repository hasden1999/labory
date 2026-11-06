import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';
import { generateReportImages } from '../../../../../lib/puppeteerImageGenerator';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

  if (!sample) {
    return new Response('Sample not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const section = (searchParams.get('section') || 'all').toLowerCase();
  const format = (searchParams.get('format') || 'png').toLowerCase();
  const pageParam = searchParams.get('page');
  const returnAllJson = searchParams.get('all') === 'true' || format === 'json';

  const requestedPageIndex = pageParam !== null && pageParam !== undefined && pageParam !== ''
    ? parseInt(pageParam, 10)
    : undefined;

  try {
    const isPng = format === 'png';
    const images = await generateReportImages(sample.id, request.url, {
      section,
      format: isPng ? 'png' : 'jpeg',
      pageIndex: requestedPageIndex,
    });

    if (returnAllJson) {
      return NextResponse.json({
        sampleId: sample.id,
        sampleNumber: sample.sampleNumber,
        totalPages: images.length > 0 ? images[0].totalPages : 0,
        images: images.map(img => ({
          pageIndex: img.pageIndex,
          dataUrl: img.dataUrl,
        })),
      });
    }

    const targetImg = images[0];
    if (!targetImg) {
      return new Response('No report image generated', { status: 500 });
    }

    const pageSuffix = requestedPageIndex !== undefined ? `-p${requestedPageIndex + 1}` : '';
    const ext = isPng ? 'png' : 'jpg';

    return new Response(new Uint8Array(targetImg.buffer), {
      status: 200,
      headers: {
        'Content-Type': isPng ? 'image/png' : 'image/jpeg',
        'Content-Disposition': `inline; filename="sample-${sample.sampleNumber}-${section}${pageSuffix}.${ext}"`,
        'X-Total-Pages': String(targetImg.totalPages),
        'X-Page-Index': String(targetImg.pageIndex),
        'Cache-Control': 'public, max-age=300',
      },
    });
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
