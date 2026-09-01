import { NextResponse } from 'next/server';
import { getStore, findDoctor, updateDoctor, deleteDoctor } from '../../../../lib/serverStore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const doctor = findDoctor(params.id);

  if (!doctor) {
    return NextResponse.json({ message: 'الطبيب غير موجود' }, { status: 404 });
  }

  const docSamples = store.samples.filter(s => s.doctorId === doctor.id);
  const totalCommissions = docSamples.reduce((sum, s) => sum + (s.doctorCommission || 0), 0);

  return NextResponse.json({
    ...doctor,
    samples: docSamples,
    sampleCount: docSamples.length,
    totalCommissions,
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = updateDoctor(params.id, body);

    if (!updated) {
      return NextResponse.json({ message: 'الطبيب غير موجود للتعديل' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل تعديل بيانات الطبيب' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const success = deleteDoctor(params.id);
  if (!success) {
    return NextResponse.json({ message: 'الطبيب غير موجود للحذف' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'تم حذف الطبيب بنجاح' });
}
