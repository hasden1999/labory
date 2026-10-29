import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';
import { generateReportImages } from '../../../../../lib/puppeteerImageGenerator';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

  if (!sample) {
    return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const section = (searchParams.get('section') || 'all').toLowerCase();
  const format = (searchParams.get('format') || 'png').toLowerCase();

  try {
    const isPng = format !== 'jpeg' && format !== 'jpg';
    const images = await generateReportImages(sample.id, request.url, {
      section,
      format: isPng ? 'png' : 'jpeg',
    });

    const patient = sample.patient || { name: 'المريض' };
    const totalPages = images.length;

    const pages = images.map((img, idx) => ({
      pageIndex: img.pageIndex,
      pageNumber: idx + 1,
      totalPages,
      dataUrl: img.dataUrl,
      imageUrl: `/api/samples/${sample.id}/image?section=${section}&page=${img.pageIndex}&format=${isPng ? 'png' : 'jpeg'}`,
      caption: totalPages > 1
        ? `📄 صورة (${idx + 1}/${totalPages}): تقرير التحاليل الطبية المعتمد - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}`
        : `📄 تقرير التحاليل الطبية المعتمد - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}`,
    }));

    return NextResponse.json({
      sampleId: sample.id,
      sampleNumber: sample.sampleNumber,
      patientName: patient.name,
      totalPages,
      pages,
    });
  } catch (err: any) {
    console.error('[ImagesRoute] Failed generating report images:', err);
    return NextResponse.json(
      {
        error: 'Failed to generate medical report images',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
