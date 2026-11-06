import { NextResponse } from 'next/server';
import { getStore, createPanelInStore } from '../../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.panels || []);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || data.price === undefined || !data.testIds || !Array.isArray(data.testIds)) {
      return NextResponse.json({ message: 'اسم الباقة والسعر وقائمة الفحوصات مطلوبة' }, { status: 400 });
    }

    const panel = createPanelInStore(data);
    return NextResponse.json(panel, { status: 201 });
  } catch (err: any) {
    console.error('Error creating panel:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء إضافة الباقة' }, { status: 500 });
  }
}
