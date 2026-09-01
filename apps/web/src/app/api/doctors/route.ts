import { NextResponse } from 'next/server';
import { getStore, addDoctor } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  // Enrich doctors with active sample counts and commission totals
  const doctorsWithStats = store.doctors.map(doc => {
    const docSamples = store.samples.filter(s => s.doctorId === doc.id);
    const totalCommissions = docSamples.reduce((sum, s) => sum + (s.doctorCommission || 0), 0);
    return {
      ...doc,
      sampleCount: docSamples.length,
      totalCommissions,
    };
  });
  return NextResponse.json(doctorsWithStats);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ message: 'اسم الطبيب مطلوب' }, { status: 400 });
    }

    const newDoctor = addDoctor({
      name: body.name.trim(),
      phone: body.phone || '',
      specialty: body.specialty || 'General',
      commissionPercent: body.commissionPercent !== undefined ? Number(body.commissionPercent) : 10,
      clinicAddress: body.clinicAddress || '',
      notes: body.notes || '',
    });

    return NextResponse.json(newDoctor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل إضافة الطبيب' }, { status: 500 });
  }
}