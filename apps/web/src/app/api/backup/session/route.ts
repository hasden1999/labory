import { NextResponse } from 'next/server';
import { getOrCreateBackupSecret, createBackupSessionToken } from '../../../../lib/backupAuth';

export const dynamic = 'force-dynamic';

function isStrictLoopbackHost(hostname: string): boolean {
  const h = (hostname || '').trim().toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
}

export async function GET(request: Request) {
  try {
    const rawHost = request.headers.get('host') || '';
    const host = rawHost.split(':')[0].toLowerCase();
    if (!isStrictLoopbackHost(host)) {
      return NextResponse.json(
        {
          success: false,
          message: 'غير مصرح: الوصول لجلسة النسخ الاحتياطي مسموح فقط من هذا الجهاز المحلي (Local Loopback Only).',
        },
        { status: 403 }
      );
    }

    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const originHost = new URL(origin).hostname.toLowerCase();
        if (!isStrictLoopbackHost(originHost)) {
          return NextResponse.json(
            {
              success: false,
              message: 'غير مصرح: تم رفض الطلب بسبب مصدر خارجي غير مصرح به (Origin Rejected).',
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, message: 'مصدر طلب غير صالح' },
          { status: 403 }
        );
      }
    }

    const secret = getOrCreateBackupSecret();
    const token = await createBackupSessionToken(secret);

    const response = NextResponse.json({
      success: true,
      token,
    });

    response.cookies.set('labryo_backup_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 12 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إنشاء جلسة النسخ الاحتياطي: ' + (err?.message || ''),
      },
      { status: 500 }
    );
  }
}
