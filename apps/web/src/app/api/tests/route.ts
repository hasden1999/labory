import { NextResponse } from 'next/server';
import { getStore, createTestInStore } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

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

    if (!data.force) {
      const store = getStore();
      const normInputName = String(data.name).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();
      const existing = (store.tests || []).find((t: any) => {
        if (t.active === false) return false;
        const normExisting = String(t.name).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();
        if (normExisting && normExisting === normInputName) return true;
        if (data.code && t.code && String(t.code).trim().toUpperCase() === String(data.code).trim().toUpperCase()) return true;
        return false;
      });

      if (existing) {
        return NextResponse.json({
          isDuplicate: true,
          message: `تنبيه: يوجد فحص مسجل مسبقاً بنفس الاسم أو الرمز: "${existing.name}" (${existing.code || 'بدون رمز'}). لتأكيد الإضافة رغم التكرار، أرسل force: true.`,
          existingTest: existing
        }, { status: 409 });
      }
    }

    const newTest = createTestInStore(data);
    return NextResponse.json(newTest, { status: 201 });
  } catch (err: any) {
    console.error('Error creating test:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء إضافة الفحص' }, { status: 500 });
  }
}