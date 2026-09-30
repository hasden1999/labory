import { NextResponse } from 'next/server';
import { getStore, createTestInStore } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  const activeTests = (store.tests || []).filter((t: any) => t.active !== false);
  return NextResponse.json({
    tests: activeTests,
    panels: store.panels || [],
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || data.price === undefined) {
      return NextResponse.json({ message: 'اسم الفحص والسعر مطلوبان' }, { status: 400 });
    }

    const newTest = createTestInStore(data);
    return NextResponse.json(newTest, { status: 201 });
  } catch (err: any) {
    console.error('Error creating test:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء إضافة الفحص' }, { status: 500 });
  }
}