import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const targetId = (params.id || '').trim();
  // Security Guard (SEC-007): Prevent trivial sequential enumeration by matching unique UUID or 6+ digit numbers
  const sample = store.samples.find((s: any) => s.id === targetId || (targetId.length >= 6 && String(s.sampleNumber) === targetId));
  
  if (!sample) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Mask patient name explicitly here to ensure it doesn't leak
  const patientName = sample.patient?.name || 'مريض';
  const nameParts = patientName.split(' ');
  const maskedName = nameParts.map((p: string) => p.charAt(0) + '.').join(' ');

  return NextResponse.json({
    id: sample.id,
    sampleNumber: sample.sampleNumber,
    patient: {
      name: maskedName,
      gender: sample.patient?.gender || 'MALE'
    },
    status: sample.status,
    createdAt: sample.createdAt,
    doctor: {
      name: sample.doctor?.name || ''
    },
    tests: sample.tests ? sample.tests.map((t: any) => ({
      test: { name: t.test?.name || t.testCode || 'Test' },
      status: t.status || 'COMPLETED'
    })) : []
  });
}
