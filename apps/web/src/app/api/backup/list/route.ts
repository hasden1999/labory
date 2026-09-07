import { NextResponse } from 'next/server';
import { listBackupSnapshots } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshots = listBackupSnapshots();
    return NextResponse.json(snapshots);
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل جلب قائمة النسخ الاحتياطية' }, { status: 500 });
  }
}
