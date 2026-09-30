import { NextResponse } from 'next/server';
import { restoreBackupFromFile } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Security Guard: Prevent arbitrary remote overwrites from LAN (SEC-003)
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    const adminToken = request.headers.get('x-admin-key') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || origin.includes('localhost') || origin.includes('127.0.0.1');

    if (!isLocalhost && !adminToken) {
      return NextResponse.json(
        { message: 'غير مصرح: استرجاع النسخ الاحتياطية مسموح فقط من جهاز الخادم المحلي أو بمفتاح إداري' },
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

    const result = restoreBackupFromFile(jsonContent);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ message: 'خطأ أثناء استرجاع النسخة: ' + (err?.message || '') }, { status: 500 });
  }
}
