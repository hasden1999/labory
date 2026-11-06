import { NextResponse } from 'next/server';
import { getStore, saveStoreToFile, CriticalCallLog } from '../../../../../lib/serverStore';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const store = getStore();
    const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    if (!sample.criticalCallLogs) {
      sample.criticalCallLogs = [];
    }

    const newLog: CriticalCallLog = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sampleId: sample.id,
      testName: body.testName || 'فحص مخبري حرج',
      resultValue: String(body.resultValue || ''),
      physicianName: body.physicianName || 'الطبيب المعالج',
      physicianPhone: body.physicianPhone || '',
      callerName: body.callerName || 'المخبري المناوب',
      calledAt: body.calledAt || new Date().toISOString(),
      readBackConfirmed: !!body.readBackConfirmed,
      actionTaken: body.actionTaken || 'إبلاغ فوري بالحالة الحرجة وبدء الإجراءات الإسعافية',
      notes: body.notes || '',
    };

    sample.criticalCallLogs.push(newLog);
    saveStoreToFile();

    return NextResponse.json({ success: true, callLog: newLog, sample });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'فشل حفظ سجل الاتصال' }, { status: 500 });
  }
}
