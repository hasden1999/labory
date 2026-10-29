import { NextResponse } from 'next/server';
import { whatsappWebEngine } from '../../../../lib/whatsappWebEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = whatsappWebEngine.getStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        status: 'DISCONNECTED',
        message: err?.message || 'خطأ في جلب حالة واتساب ويب',
      },
      { status: 500 }
    );
  }
}
