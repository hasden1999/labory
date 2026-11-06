import { NextResponse } from 'next/server';
import { getOrCreateBackupSecret, verifyBackupSessionTokenSync } from './backupAuth';

function isStrictLoopbackHost(hostname: string): boolean {
  const h = (hostname || '').trim().toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
}

function extractCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

/**
 * Backup authorization guard.
 * SECURITY:
 * 1. An administrative secret (BACKUP_ADMIN_SECRET or persistent secret key) is mandatory for every backup operation.
 * 2. Host and Origin are strictly restricted to local loopback (localhost / 127.0.0.1 / [::1]) to prevent LAN or cross-origin CSRF/export.
 * 3. Session tokens must pass cryptographic HMAC-SHA256 verification.
 */
export function isLocalLoopbackRequest(request: Request): boolean {
  const adminSecret = process.env.BACKUP_ADMIN_SECRET || getOrCreateBackupSecret();
  if (!adminSecret) return false;

  const rawAuth =
    request.headers.get('authorization') ||
    request.headers.get('x-backup-token') ||
    extractCookieValue(request.headers.get('cookie'), 'labryo_backup_token');

  if (!rawAuth) return false;

  const authHeader =
    rawAuth && verifyBackupSessionTokenSync(rawAuth, adminSecret) ? adminSecret : rawAuth;

  if (authHeader !== `Bearer ${adminSecret}` && authHeader !== adminSecret) return false;

  // Enforce strict local loopback Host (reject LAN IPs like 192.168.* / 10.*)
  const rawHost = request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  if (!isStrictLoopbackHost(host)) return false;

  // Enforce strict local loopback Origin when present (reject external / foreign origins)
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase();
      if (!isStrictLoopbackHost(originHost)) {
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
      message: 'غير مصرح: الوصول لعمليات النسخ الاحتياطي مسموح فقط من هذا الجهاز المحلي (Local Loopback Only) بتصريح إداري صالح.',
    },
    { status: 403 }
  );
}
