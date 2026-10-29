import { NextRequest } from 'next/server';
import {
  registerSSEClient,
  getEventsSince,
  recordDevicePing,
  verifyDeviceToken,
  NetworkEvent,
} from '@/lib/networkDeviceManager';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return (req as any).ip || '127.0.0.1';
}

function isLocalLanOrLoopback(ip: string): boolean {
  const clean = (ip || '').replace(/^::ffff:/i, '').trim();
  return (
    !clean ||
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('192.168.') ||
    clean.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(clean)
  );
}

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const token =
    req.nextUrl.searchParams.get('token') ||
    req.headers.get('x-device-token') ||
    req.cookies.get('labryo_device_token')?.value;
  const auth = verifyDeviceToken(token, clientIp);

  if (!auth.valid && !isLocalLanOrLoopback(clientIp)) {
    return new Response(JSON.stringify({ success: false, error: 'غير مصرح للوصول للبث المباشر' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientId = `${auth.device ? auth.device.id : 'loopback'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const lastEventIdHeader = req.headers.get('Last-Event-ID') || req.nextUrl.searchParams.get('lastEventId');
  const lastEventId = lastEventIdHeader ? parseInt(lastEventIdHeader, 10) : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Helper to push SSE message
      const pushEvent = (event: NetworkEvent) => {
        try {
          const payload = `id: ${event.eventId}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {}
      };

      // 2. Initial Connected Message
      const initPayload = `id: 0\nevent: connected\ndata: ${JSON.stringify({
        status: 'CONNECTED',
        clientId,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initPayload));

      // 3. Replay missed events if client reconnected after drop
      if (lastEventId > 0) {
        const missedEvents = getEventsSince(lastEventId);
        for (const ev of missedEvents) {
          pushEvent(ev);
        }
      }

      // 4. Register client in manager
      const unregister = registerSSEClient(clientId, (ev) => {
        pushEvent(ev);
      });

      // 5. Periodic Heartbeat (every 15 seconds) to keep router/proxy connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          if (auth.device) {
            recordDevicePing(auth.device.id);
          }
          const pingPayload = `: heartbeat ${Date.now()}\n\n`;
          controller.enqueue(encoder.encode(pingPayload));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // 6. Handle abort/close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unregister();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
