import { NextRequest, NextResponse } from 'next/server';
import { getServerStatus, logNetworkEvent } from '@/lib/networkDeviceManager';
import { getStore } from '@/lib/serverStore';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

function getStartupShortcutPath(): string | null {
  if (process.platform !== 'win32') return null;
  const getEnv = (k: string) => process.env[k];
  const appData = getEnv(['APP', 'DATA'].join(''));
  if (!appData) return null;
  const parts = ['Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'Labryo_LIMS.url'];
  return [appData, ...parts].join(path.sep);
}

export async function GET(req: NextRequest) {
  try {
    const status = getServerStatus();
    const store = getStore();

    // Check Windows startup shortcut existence
    let hasStartupShortcut = false;
    const shortcutPath = getStartupShortcutPath();
    if (shortcutPath) {
      try {
        hasStartupShortcut = fs.existsSync(shortcutPath);
      } catch {}
    }

    let qrDataUrl = '';
    try {
      // @ts-ignore
      const QRCode = await import('qrcode');
      qrDataUrl = await QRCode.toDataURL(`${status.lanUrl}/connect`, { margin: 1, width: 260, color: { dark: '#0284c7', light: '#ffffff' } });
    } catch {}

    return NextResponse.json({
      success: true,
      ...status,
      qrDataUrl,
      hasStartupShortcut,
      labIdentity: {
        labName: store.settings?.labName || '',
        labSubtitle: store.settings?.labSubtitle || '',
        doctorName: store.settings?.doctorName || '',
        doctorTitle: store.settings?.doctorTitle || '',
        phone: store.settings?.phone || '',
        address: store.settings?.address || '',
        logoUrl: (store.settings as any)?.logoUrl || (store.settings as any)?.logoPath || '',
        isConfigured: Boolean(store.settings?.isConfigured || store.settings?.labName?.trim()),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to get server status' },
      { status: 500 }
    );
  }
}

function isLoopback(req: NextRequest): boolean {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (req.ip || (forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || ''))).trim();

  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === '::ffff:127.0.0.1' ||
    clientIp === 'localhost'
  ) {
    return true;
  }

  const rawHost = req.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'toggle_startup') {
      if (!isLoopback(req)) {
        logNetworkEvent('WARN', 'SECURITY', 'محاولة غير مصرح بها لتعديل إقلاع الويندوز من جهاز خارجي', { ip: req.ip });
        return NextResponse.json(
          { success: false, error: 'غير مصرح: تعديل إقلاع النظام مسموح فقط من السيرفر المحلي (Forbidden: Loopback only)' },
          { status: 403 }
        );
      }

      if (process.platform === 'win32') {
        const shortcutPath = getStartupShortcutPath();
        if (!shortcutPath) {
          return NextResponse.json({ success: false, error: 'Could not resolve startup path' }, { status: 500 });
        }

        if (fs.existsSync(shortcutPath)) {
          fs.unlinkSync(shortcutPath);
          logNetworkEvent('INFO', 'SYSTEM', 'تم إزالة اختصار التشغيل التلقائي مع الويندوز');
          return NextResponse.json({ success: true, hasStartupShortcut: false, message: 'تم إيقاف التشغيل التلقائي' });
        } else {
          const status = getServerStatus();
          const content = `[InternetShortcut]\r\nURL=${status.lanUrl}\r\nIconIndex=0\r\n`;
          fs.writeFileSync(shortcutPath, content, 'utf-8');
          logNetworkEvent('INFO', 'SYSTEM', 'تم تفعيل اختصار التشغيل التلقائي مع بدء الويندوز');
          return NextResponse.json({ success: true, hasStartupShortcut: true, message: 'تم تفعيل التشغيل التلقائي مع تشغيل الجهاز' });
        }
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
