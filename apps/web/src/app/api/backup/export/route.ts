import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = getStore();
    const labNameClean = (store.settings?.labName || 'Labryo')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')
      .substring(0, 30);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Labryo_Backup_${labNameClean}_${dateStr}.json`;

    const jsonString = JSON.stringify(store, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل تصدير النسخة الاحتياطية: ' + (err?.message || '') }, { status: 500 });
  }
}
