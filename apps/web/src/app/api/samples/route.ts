import { NextResponse } from 'next/server';
import { getStore, addSample } from '../../../lib/serverStore';

export async function GET(request: Request) {
  const store = getStore();
  return NextResponse.json(store.samples);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSample = addSample(body);
    return NextResponse.json(newSample, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل إضافة العينة' }, { status: 500 });
  }
}