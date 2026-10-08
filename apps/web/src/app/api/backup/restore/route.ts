import { NextResponse } from 'next/server';
import { restoreBackupFromFile } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Security Guard (Desktop-only): restore allowed only from local loopback.
    // Binding is 127.0.0.1 so LAN cannot reach here; this is defense-in-depth.
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === '';

    if (!isLocalhost) {
      return NextResponse.json(
        { message: 'غير مصرح: استرجاع النسخ الاحتياطية مسموح فقط من هذا الجهاز المحلي' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let jsonContent = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      jsonContent = typeof body === 'string' ? body : JSON.stringify(body);
    } else {
      jsonContent = await request.text();
    }

    if (!jsonContent || jsonContent.trim().length === 0) {
      return NextResponse.json({ message: 'ملف النسخة الاحتياطية فارغ' }, { status: 400 });
    }

    // Desktop-only hardening: size cap 50MB to prevent memory exhaustion
    if (jsonContent.length > 50 * 1024 * 1024) {
      return NextResponse.json({ message: 'ملف النسخة كبير جداً (الحد 50MB)' }, { status: 413 });
    }

    const result = restoreBackupFromFile(jsonContent);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ message: 'خطأ أثناء استرجاع النسخة: ' + (err?.message || '') }, { status: 500 });
  }
}
