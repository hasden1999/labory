import { NextResponse } from 'next/server';
import { convertAllTestPrices, getStore } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetCurrency, rate } = body;

    if (!targetCurrency) {
      return NextResponse.json({ message: 'العملة المستهدفة مطلوبة' }, { status: 400 });
    }

    const result = convertAllTestPrices(targetCurrency, rate ? Number(rate) : undefined);
    const store = getStore();

    return NextResponse.json({
      ...result,
      tests: store.tests,
      panels: store.panels,
      settings: store.settings,
    });
  } catch (err: any) {
    console.error('[API] Error converting currency:', err);
    return NextResponse.json({ message: err.message || 'فشل تحويل أسعار الفحوصات' }, { status: 500 });
  }
}
