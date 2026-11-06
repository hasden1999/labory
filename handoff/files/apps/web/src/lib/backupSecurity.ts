import { NextResponse } from 'next/server';

/**
 * Backup authorization guard.
 * SECURITY: an administrative secret (BACKUP_ADMIN_SECRET) is mandatory for every backup operation.
 * Loopback / Host / Origin checks are defense-in-depth only and never a substitute for the secret.
 */
export function isLocalLoopbackRequest(request: Request): boolean {
  // SECURITY: fail closed. An administrative secret is mandatory for every backup operation.
  const adminSecret = process.env.BACKUP_ADMIN_SECRET;
  if (!adminSecret) return false;

  const authHeader = request.headers.get('authorization') || request.headers.get('x-backup-token');
  if (authHeader !== `Bearer ${adminSecret}` && authHeader !== adminSecret) return false;

  // Defense in depth: reject non-loopback Host / Origin.
  const rawHost = request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!isLoopbackHost) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase();
      if (originHost !== 'localhost' && originHost !== '127.0.0.1' && originHost !== '[::1]') {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export function forbiddenLoopbackResponse() {
  return NextResponse.json(
    {
      success: false,
      message: 'غير مصرح: الوصول لعمليات النسخ الاحتياطي مسموح فقط من هذا الجهاز المحلي (Loopback Only)',
    },
    { status: 403 }
  );
}
