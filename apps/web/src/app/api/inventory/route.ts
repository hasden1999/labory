import { NextResponse } from 'next/server';
import { getInventoryItems, addInventoryItem } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = getInventoryItems();
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في جلب بيانات المخزون والكواشف' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || String(body.name).trim().length === 0) {
      return NextResponse.json(
        { message: 'اسم الصنف أو الكاشف مطلوب' },
        { status: 400 }
      );
    }
    const item = addInventoryItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في إضافة الصنف إلى المخزون' },
      { status: 500 }
    );
  }
}
