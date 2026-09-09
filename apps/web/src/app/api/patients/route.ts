import { NextResponse } from 'next/server';
import { getStore, addPatient, normalizeArabic } from '../../../lib/serverStore';

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

    const store = getStore();
    const candidateName = body.name.trim();
    const normName = normalizeArabic(candidateName);
    const cleanPhone = (body.phone || '').replace(/[^0-9]/g, '');

    // Duplicate Check: if identical patient was created in the last 3 minutes
    if (!body.forceDuplicate) {
      const now = Date.now();
      const duplicate = store.patients.find((p) => {
        const createdTime = new Date(p.createdAt || '').getTime();
        if (isNaN(createdTime) || now - createdTime > 180000) return false;

        const sameName = normalizeArabic(p.name || '') === normName;
        const pPhone = (p.phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone && pPhone) {
          return sameName && cleanPhone === pPhone;
        }
        return sameName;
      });

      if (duplicate) {
        return NextResponse.json(
          {
            duplicate: true,
            duplicatePatientId: duplicate.id,
            message: `تم تسجيل المريض (${duplicate.name}) للتو قبل أقل من 3 دقائق. تم منع التكرار لحماية السجلات.`,
          },
          { status: 409 }
        );
      }
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