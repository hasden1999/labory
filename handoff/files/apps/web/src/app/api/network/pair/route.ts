import { NextRequest, NextResponse } from 'next/server';
import {
  createPairingRequest,
  checkPairingStatus,
  verifyDeviceToken,
  getServerStatus,
  autoPairLanDevice,
} from '@/lib/networkDeviceManager';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  // SECURITY: do not trust x-forwarded-for / x-real-ip; only the socket IP is authoritative.
  return ((req as any).ip || '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, name, platform, requestId, token } = body;
    const clientIp = getClientIp(req);

    if (action === 'auto_pair') {
      if (process.env.LABRYO_ALLOW_AUTO_PAIR !== '1') {
        return NextResponse.json(
          {
            success: false,
            status: 'DISABLED',
            error: 'الاقتران التلقائي معطّل. استخدم طلب اقتران يوافق عليه مدير المختبر.',
          },
          { status: 403 }
        );
      }
      const result = autoPairLanDevice(name || 'جهاز شبكة محلي', platform || 'other', clientIp);
      if (result.blocked || !result.device) {
        return NextResponse.json(
          { success: false, status: 'BLOCKED', error: 'تم حظر هذا الجهاز من قِبل مدير المختبر' },
          { status: 403 }
        );
      }
      const server = getServerStatus();
      const res = NextResponse.json({
        success: true,
        status: 'APPROVED',
        device: {
          id: result.device.id,
          name: result.device.name,
          token: result.device.token,
          role: result.device.role,
        },
        server,
      });
      res.cookies.set('labryo_device_token', result.device.token, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
      return res;
    }

    if (action === 'request') {
      const pairReq = createPairingRequest(name || 'جهاز عميل جديد', platform || 'other', clientIp);
      const server = getServerStatus();
      return NextResponse.json({
        success: true,
        requestId: pairReq.requestId,
        deviceId: pairReq.deviceId,
        name: pairReq.name,
        code: pairReq.code,
        expiresAt: pairReq.expiresAt,
        server,
      });
    }

    if (action === 'check') {
      if (!requestId) {
        return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 });
      }
      const check = checkPairingStatus(requestId);
      return NextResponse.json({
        success: true,
        status: check.status,
        device: check.device ? {
          id: check.device.id,
          name: check.device.name,
          token: check.device.token,
          role: check.device.role,
        } : undefined,
      });
    }

    if (action === 'verify') {
      const verification = verifyDeviceToken(token, clientIp);
      return NextResponse.json({
        success: true,
        valid: verification.valid,
        isLoopback: verification.isLoopback,
        device: verification.device ? {
          id: verification.device.id,
          name: verification.device.name,
          role: verification.device.role,
        } : undefined,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Pairing error' },
      { status: 500 }
    );
  }
}
