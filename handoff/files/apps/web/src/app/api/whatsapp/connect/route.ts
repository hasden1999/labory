import { NextResponse } from 'next/server';
import { whatsappWebEngine } from '../../../../lib/whatsappWebEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let forceRestart = false;
    try {
      const body = await request.json();
      if (body?.forceRestart !== undefined) {
        forceRestart = Boolean(body.forceRestart);
      }
    } catch {}

    const status = await whatsappWebEngine.initSocket(forceRestart);
    return NextResponse.json({
      status: status.status,
      connected: status.connected,
      user: status.user,
      userName: status.userName,
      qr: status.qr,
      qrDataUrl: status.qrDataUrl || status.qr,
      hasSavedSession: status.hasSavedSession,
      message: status.connected
        ? 'جلسة واتساب ويب متصلة ونشطة بالفعل ✓'
        : 'افتح تطبيق واتساب في هاتفك (الأجهزة المرتبطة) وامسح الباركود أدناه للربط',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'DISCONNECTED',
        connected: false,
        message: err?.message || 'تعذر بدء جلسة اقتران واتساب ويب',
      },
      { status: 500 }
    );
  }
}
