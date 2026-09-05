import { NextResponse } from 'next/server';
import { getStore, addPatient } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.patients);
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