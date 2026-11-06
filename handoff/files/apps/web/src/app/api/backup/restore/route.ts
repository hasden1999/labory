import { NextResponse } from 'next/server';
import { restoreBackupFromFile } from '../../../../lib/serverStore';
import { isLocalLoopbackRequest, forbiddenLoopbackResponse } from '../../../../lib/backupSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!isLocalLoopbackRequest(request)) {
      return forbiddenLoopbackResponse();
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
