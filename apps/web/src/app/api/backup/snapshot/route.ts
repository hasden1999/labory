import { NextResponse } from 'next/server';
import { createBackupSnapshot } from '../../../../lib/serverStore';
import { isLocalLoopbackRequest, forbiddenLoopbackResponse } from '../../../../lib/backupSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!isLocalLoopbackRequest(request)) {
      return forbiddenLoopbackResponse();
    }

    let label = '';
    try {
      const body = await request.json();
      label = body?.label || '';
    } catch {}

    const fileName = createBackupSnapshot(label || 'user_manual');
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء نقطة استرجاع احتياطية بنجاح!',
      fileName,
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل إنشاء نقطة الاسترجاع: ' + (err?.message || '') }, { status: 500 });
  }
}
