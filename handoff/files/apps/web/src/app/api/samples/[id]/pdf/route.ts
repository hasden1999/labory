import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';
import { generatePuppeteerPdf } from '../../../../../lib/puppeteerPdfGenerator';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

  if (!sample) {
    return new Response('العينة غير موجودة (Sample not found)', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || 'all';

  try {
    const pdfBuffer = await generatePuppeteerPdf(sample.id, request.url, { section });
    const safeArabicPatient = (sample.patient?.name || 'مريض').replace(/[\\/:*?"<>|\s]/g, '_');
    const fileName = `تقرير_طبي_عينة_${sample.sampleNumber}_${safeArabicPatient}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[PuppeteerPDFRoute] Error:', err);
    return NextResponse.json({ message: err?.message || 'فشل توليد ملف PDF' }, { status: 500 });
  }
}
