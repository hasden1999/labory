import { NextResponse } from 'next/server';
import { whatsappWebEngine } from '../../../../lib/whatsappWebEngine';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await whatsappWebEngine.logout();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'تعذر تسجيل الخروج من جلسة واتساب ويب',
      },
      { status: 500 }
    );
  }
}
