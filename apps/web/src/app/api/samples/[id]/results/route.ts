import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  if (!sample) {
    return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
  }

  if (body.results && Array.isArray(body.results)) {
    for (const r of body.results) {
      const st = sample.tests.find((t: any) => t.id === r.sampleTestId || t.testId === r.testId || t.test?.code === r.testCode);
      if (st) {
        st.resultValue = r.resultValue;
        st.isAbnormal = !!r.isAbnormal;
        st.status = 'COMPLETED';
      }
    }
  }

  sample.status = 'READY';
  return NextResponse.json(sample);
}