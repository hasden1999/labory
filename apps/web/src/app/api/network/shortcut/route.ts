import { NextRequest, NextResponse } from 'next/server';
import { getServerStatus } from '@/lib/networkDeviceManager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const status = getServerStatus();
    const url = status.lanUrl;
    const content = `[InternetShortcut]\r\nURL=${url}\r\nIconIndex=0\r\n`;

    return new Response(content, {
      headers: {
        'Content-Type': 'application/internet-shortcut',
        'Content-Disposition': 'attachment; filename="Labryo_LIMS.url"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
