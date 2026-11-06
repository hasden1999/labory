import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyBackupSessionToken } from './lib/backupTokenUtils';

function isLoopback(req: NextRequest): boolean {
  // SECURITY: never trust client-controlled forwarding headers (x-forwarded-for / x-real-ip).
  // Only the socket-level IP (when the runtime exposes it) and the Host header are considered.
  const socketIp = ((req as any).ip || '').trim();
  const rawHost = req.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!isLoopbackHost) return false;
  if (!socketIp) return true;
  return socketIp === '127.0.0.1' || socketIp === '::1' || socketIp === '::ffff:127.0.0.1';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Backup endpoints are admin-only and fail closed.
  if (pathname.startsWith('/api/backup')) {
    // Session token generation is strictly restricted to loopback
    if (pathname === '/api/backup/session') {
      if (!isLoopback(request)) {
        return NextResponse.json(
          {
            success: false,
            message: 'غير مصرح: إنشاء جلسة النسخ الاحتياطي مسموح فقط من الجهاز المحلي (Local Loopback Only).',
          },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }

    const adminSecret = process.env.BACKUP_ADMIN_SECRET;
    if (!adminSecret) {
      return NextResponse.json(
        {
          success: false,
          message: 'النسخ الاحتياطي معطّل: لم يتم ضبط BACKUP_ADMIN_SECRET على الخادم.',
        },
        { status: 503 }
      );
    }

    const rawAuth =
      request.headers.get('authorization') ||
      request.headers.get('x-backup-token') ||
      request.cookies.get('labryo_backup_token')?.value;

    const cleanToken = (rawAuth || '').replace(/^Bearer\s+/i, '').trim();

    if (!cleanToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'غير مصرح: عمليات النسخ الاحتياطي تتطلب توكن أو مفتاحاً إدارياً صالحاً.',
        },
        { status: 401 }
      );
    }

    const isDirectSecret = cleanToken === adminSecret;
    const isValidSession = cleanToken.startsWith('lbs1.')
      ? await verifyBackupSessionToken(cleanToken, adminSecret)
      : false;

    if (!isDirectSecret && !isValidSession) {
      return NextResponse.json(
        {
          success: false,
          message: 'غير مصرح: توكن النسخ الاحتياطي غير صالح أو منتهي الصلاحية أو مزوّر.',
        },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 2. Allow Central Server (loopback) full access to all pages and APIs
  if (isLoopback(request)) {
    return NextResponse.next();
  }

  // 3. Public paths allowed for all network devices
  const isPublicPath =
    pathname.startsWith('/connect') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/api/verify') ||
    pathname.startsWith('/api/network/pair') ||
    pathname.startsWith('/api/network/status') ||
    pathname.startsWith('/api/network/shortcut') ||
    pathname.startsWith('/api/network/events') ||
    pathname.startsWith('/api/network/diagnostics') ||
    pathname.startsWith('/api/version') ||
    (pathname.startsWith('/api/settings') && request.method === 'GET') ||
    pathname === '/ready' ||
    pathname === '/health' ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/logo.png' ||
    pathname === '/logo.jpg';

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 4. Check device token from header or cookie for client devices
  const rawToken =
    request.headers.get('x-device-token') ||
    request.cookies.get('labryo_device_token')?.value;

  // Enforce strict token structure: lab_ followed by 48 hex characters
  const DEVICE_TOKEN_PATTERN = /^lab_[0-9a-f]{48}$/;
  const deviceToken = rawToken && DEVICE_TOKEN_PATTERN.test(rawToken) ? rawToken : null;

  if (!deviceToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED_DEVICE',
          message: 'الجهاز غير مقترن بالسيرفر المركزي. يرجى إتمام الاقتران من صفحة /connect أولاً.',
        },
        { status: 401 }
      );
    }

    // Redirect browser to connect page
    const connectUrl = new URL('/connect', request.url);
    return NextResponse.redirect(connectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
