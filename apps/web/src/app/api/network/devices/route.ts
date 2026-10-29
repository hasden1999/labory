import { NextRequest, NextResponse } from 'next/server';
import {
  getPairedDevices,
  getPendingRequests,
  approvePairingRequest,
  rejectPairingRequest,
  revokeDevice,
  setDeviceBlocked,
  recordDevicePing,
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
    const clientIp = getClientIp(req);
    const authHeader = req.headers.get('x-device-token');
    const auth = verifyDeviceToken(authHeader, clientIp);

    if (!auth.valid) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول' }, { status: 401 });
    }

    const paired = getPairedDevices();
    const pending = getPendingRequests();

    return NextResponse.json({
      success: true,
      paired,
      pending,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const authHeader = req.headers.get('x-device-token');
    const auth = verifyDeviceToken(authHeader, clientIp);

    const body = await req.json().catch(() => ({}));
    const { action, requestId, deviceId, role, latencyMs } = body;

    // Ping can be called by any valid client device
    if (action === 'ping') {
      if (auth.device) {
        recordDevicePing(auth.device.id, latencyMs);
      }
      return NextResponse.json({ success: true, timestamp: Date.now() });
    }

    // Administrative actions require loopback (the Central Server) or OWNER/OPERATOR role
    if (!auth.isLoopback && auth.device?.role !== 'OPERATOR') {
      return NextResponse.json({ success: false, error: 'يتطلب صلاحية إدارة السيرفر' }, { status: 403 });
    }

    if (action === 'approve') {
      if (!requestId) return NextResponse.json({ success: false, error: 'requestId مطلوب' }, { status: 400 });
      const device = approvePairingRequest(requestId, role || 'OPERATOR');
      if (!device) return NextResponse.json({ success: false, error: 'تعذر العثور على الطلب أو انتهت صلاحيته' }, { status: 404 });
      return NextResponse.json({ success: true, device });
    }

    if (action === 'reject') {
      if (!requestId) return NextResponse.json({ success: false, error: 'requestId مطلوب' }, { status: 400 });
      const ok = rejectPairingRequest(requestId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'revoke') {
      if (!deviceId) return NextResponse.json({ success: false, error: 'deviceId مطلوب' }, { status: 400 });
      const ok = revokeDevice(deviceId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'block') {
      if (!deviceId) return NextResponse.json({ success: false, error: 'deviceId مطلوب' }, { status: 400 });
      const ok = setDeviceBlocked(deviceId, true);
      return NextResponse.json({ success: ok });
    }

    if (action === 'unblock') {
      if (!deviceId) return NextResponse.json({ success: false, error: 'deviceId مطلوب' }, { status: 400 });
      const ok = setDeviceBlocked(deviceId, false);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
