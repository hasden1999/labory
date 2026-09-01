import { NextResponse } from 'next/server';
import { getStore, updateSettings } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = updateSettings(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل حفظ الإعدادات' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function PATCH(request: Request) {
  return POST(request);
}