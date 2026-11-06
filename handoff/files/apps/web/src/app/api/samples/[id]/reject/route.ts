import { NextResponse } from 'next/server';
import { getStore, saveStoreToFile } from '../../../../../lib/serverStore';
import { syncSampleToSqlite } from '../../../../../lib/sqliteSync';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const store = getStore();
    const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    sample.status = 'REJECTED';
    sample.rejectionReason = body.reason || 'OTHER';
    sample.rejectionNotes = body.notes || null;
    sample.rejectedAt = new Date().toISOString();
    sample.rejectedBy = body.rejectedBy || 'مختبر التحليلات';

    saveStoreToFile();
    syncSampleToSqlite(sample).catch(err => console.warn('[SqliteSync] Reject sync error:', err?.message));

    return NextResponse.json({ success: true, sample });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'فشل تسجيل رفض العينة' }, { status: 500 });
  }
}
