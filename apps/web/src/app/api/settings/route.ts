import { NextResponse } from 'next/server';
import { getStore, updateSettings, getLocalIpAddress } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  const localIp = getLocalIpAddress();
  const port = 8080;
  const detectedLanUrl = `http://${localIp}:${port}`;

  return NextResponse.json({
    ...store.settings,
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