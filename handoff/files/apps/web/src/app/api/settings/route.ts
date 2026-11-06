import { NextResponse } from 'next/server';
import { getStore, updateSettings, getLocalIpAddress } from '../../../lib/serverStore';
import { broadcastEvent } from '../../../lib/networkDeviceManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = getStore();
  const localIp = getLocalIpAddress();
  const port = 8080;
  const detectedLanUrl = `http://${localIp}:${port}`;
  const hasServerIdentity = Boolean(
    store.settings?.isConfigured ||
    (store.settings?.labName && store.settings.labName.trim().length > 0) ||
    (store.settings?.doctorName && store.settings.doctorName.trim().length > 0) ||
    (store.settings?.phone && store.settings.phone.trim().length > 0)
  );

  return NextResponse.json({
    ...store.settings,
    isConfigured: hasServerIdentity,
    detectedLanIp: localIp,
    detectedPort: port,
    detectedLanUrl,
    activeBaseUrl: store.settings.serverBaseUrl?.trim() || detectedLanUrl,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = updateSettings(body);
    try {
      broadcastEvent('SETTING', 'UPDATE', 'lab_settings', updated);
    } catch {}
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل حفظ الإعدادات' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function PATCH(request: Request) {
  return POST(request);
}