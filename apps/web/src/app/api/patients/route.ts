import { NextResponse } from 'next/server';
import { getStore, addPatient } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  const enriched = store.patients.map((p) => {
    const patientSamples = store.samples.filter(
      (s) => s.patientId === p.id || s.patient?.id === p.id
    );
    return {
      ...p,
      samples: patientSamples,
      visitsCount: patientSamples.length,
      visitCount: patientSamples.length,
    };
  });
  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name?.trim()) {
      return NextResponse.json({ message: 'يرجى إدخال اسم المريض' }, { status: 400 });
    }
    const newPatient = addPatient({
      name: body.name,
      phone: body.phone,
      age: body.age,
      gender: body.gender,
      address: body.address,
      notes: body.notes,
    });
    return NextResponse.json(newPatient, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل حفظ بيانات المريض' }, { status: 500 });
  }
}