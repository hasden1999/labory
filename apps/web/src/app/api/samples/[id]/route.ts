import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  if (!sample) {
    return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
  }
  return NextResponse.json(sample);
}