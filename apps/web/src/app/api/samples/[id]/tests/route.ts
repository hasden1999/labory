import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { testIds } = body || {};

    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json({ message: 'يرجى اختيار فحص واحد على الأقل لإضافته' }, { status: 400 });
    }

    const store = getStore();
    const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    const existingTestIds = new Set(sample.tests.map(t => t.testId));
    const newTestIds = testIds.filter((tid: string) => !existingTestIds.has(tid));

    if (newTestIds.length === 0) {
      return NextResponse.json({ message: 'جميع الفحوصات المختارة مضافة بالفعل لهذه العينة' }, { status: 400 });
    }

    const catalogTests = store.tests.filter(t => newTestIds.includes(t.id));
    let addedTotal = 0;

    for (const catTest of catalogTests) {
      addedTotal += catTest.price || 0;
      sample.tests.push({
        id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sampleId: sample.id,
        testId: catTest.id,
        test: catTest,
        resultValue: null,
        isAbnormal: false,
        interpretation: null,
        status: 'PENDING',
      });
    }

    sample.priceTotal = (sample.priceTotal || 0) + addedTotal;
    sample.remainingAmount = Math.max(0, (sample.remainingAmount || 0) + addedTotal);

    return NextResponse.json(sample);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل إضافة الفحوصات' }, { status: 500 });
  }
}
