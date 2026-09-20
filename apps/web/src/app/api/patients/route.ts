import { NextResponse } from 'next/server';
import { getStore, addPatient, normalizeArabic, saveStoreToFile } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const store = getStore();

  // Self-Healing: Guarantee that every patient who has samples in the system is present in patients list
  if (!Array.isArray(store.patients)) {
    store.patients = [];
  }
  if (!Array.isArray(store.samples)) {
    store.samples = [];
  }

  const patientMap = new Map<string, any>();
  for (const p of store.patients) {
    if (p && p.id) {
      patientMap.set(p.id, p);
    }
  }

  let hasAddedFromSamples = false;
  for (const s of store.samples) {
    const pId = s.patientId || s.patient?.id;
    if (pId && !patientMap.has(pId) && s.patient) {
      const recoveredPatient = {
        id: pId,
        name: s.patient.name || 'مريض غير مسمى',
        phone: s.patient.phone || '',
        age: s.patient.age ?? null,
        gender: s.patient.gender || 'MALE',
        address: s.patient.address || '',
        notes: s.patient.notes || '',
        createdAt: s.patient.createdAt || s.createdAt || new Date().toISOString(),
        updatedAt: s.patient.updatedAt || s.createdAt || new Date().toISOString(),
      };
      patientMap.set(pId, recoveredPatient);
      store.patients.push(recoveredPatient);
      hasAddedFromSamples = true;
    }
  }

  if (hasAddedFromSamples) {
    try {
      saveStoreToFile();
    } catch {}
  }

  const allPatients = Array.from(patientMap.values());
  const enriched = allPatients.map((p) => {
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

  return NextResponse.json(enriched, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
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