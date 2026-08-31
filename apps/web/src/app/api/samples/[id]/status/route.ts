import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  if (!sample) {
    return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
  }
  if (body.status) {
    sample.status = body.status;
  }
  return NextResponse.json(sample);
}