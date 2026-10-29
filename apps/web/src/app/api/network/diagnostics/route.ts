import { NextRequest, NextResponse } from 'next/server';
import {
  getDiagnostics,
  broadcastEvent,
  logNetworkEvent,
  verifyDeviceToken,
} from '@/lib/networkDeviceManager';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return (req as any).ip || '127.0.0.1';
}

export async function GET(req: NextRequest) {
  try {
    const diag = getDiagnostics();
    return NextResponse.json({ success: true, ...diag });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const { action, message } = body;

    if (action === 'ping') {
      const now = Date.now();
      return NextResponse.json({ success: true, pong: true, serverTime: now });
    }

    if (action === 'test_broadcast') {
      const authHeader = req.headers.get('x-device-token');
      const auth = verifyDeviceToken(authHeader, clientIp);

      if (!auth.isLoopback && auth.device?.role !== 'OPERATOR') {
        return NextResponse.json({ success: false, error: 'غير مصرح لبث الاختبار' }, { status: 403 });
      }

      const ev = broadcastEvent('SYSTEM', 'PING', `test_${Date.now()}`, {
        message: message || 'اختبار بث الشبكة اللحظي (Test Broadcast)',
        senderIp: clientIp,
      });

      logNetworkEvent('INFO', 'BROADCAST', `تم إرسال حدث بث تجريبي بنجاح (معرف الحدث: ${ev.eventId})`);
      return NextResponse.json({ success: true, event: ev });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
