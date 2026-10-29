import { NextResponse } from 'next/server';
import { listBackupSnapshots } from '../../../../lib/serverStore';
import { isLocalLoopbackRequest, forbiddenLoopbackResponse } from '../../../../lib/backupSecurity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isLocalLoopbackRequest(request)) {
    return forbiddenLoopbackResponse();
  }

  try {
    const snapshots = listBackupSnapshots();
    return NextResponse.json(snapshots);
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل جلب قائمة النسخ الاحتياطية' }, { status: 500 });
  }
}
