import { NextResponse } from 'next/server';
import { getStore, findPatient, updatePatient, deletePatient } from '../../../../lib/serverStore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const patient = findPatient(params.id);

  if (!patient) {
    return NextResponse.json({ message: 'المريض غير موجود' }, { status: 404 });
  }

  // Aggregate all patient visits, tests, debt
  const samples = store.samples
    .filter(s => s.patientId === patient.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalBilled = samples.reduce((sum, s) => sum + (s.priceTotal - (s.discount || 0)), 0);
  const totalPaid = samples.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const outstandingDebt = samples.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

  const abnormalFlags: string[] = [];
  samples.forEach(s => {
    (s.tests || []).forEach(t => {
      if (t.isAbnormal) {
        const testName = t.test?.name || t.test?.code || 'Test';
        abnormalFlags.push(`${testName} (${t.resultValue || 'Abnormal'})`);
      }
    });
  });

  return NextResponse.json({
    ...patient,
    samples,
    visitsCount: samples.length,
    totalBilled,
    totalPaid,
    outstandingDebt: Math.max(0, outstandingDebt),
    abnormalFlags: Array.from(new Set(abnormalFlags)),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const updated = updatePatient(params.id, body);

  if (!updated) {
    return NextResponse.json({ message: 'المريض غير موجود للتعديل' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const success = deletePatient(params.id);
  if (!success) {
    return NextResponse.json({ message: 'المريض غير موجود للحذف' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'تم حذف المريض بنجاح' });
}
