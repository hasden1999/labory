import { NextResponse } from 'next/server';
import { getStore } from '../../../lib/serverStore';

export async function GET(request: Request) {
  const store = getStore();
  return NextResponse.json(store.samples);
}

export async function POST(request: Request) {
  const body = await request.json();
  const store = getStore();

  let patient = store.patients.find(p => p.id === body.patientId);
  if (!patient) {
    patient = {
      id: `pat-${Date.now()}`,
      name: body.patientName || body.name || 'مريض جديد',
      phone: body.patientPhone || body.phone || '',
      age: body.patientAge ? Number(body.patientAge) : (body.age ? Number(body.age) : null),
      gender: body.patientGender || body.gender || 'MALE',
      createdAt: new Date().toISOString(),
    };
    store.patients.unshift(patient);
  }

  const sampleNum = store.samples.length > 0 
    ? Math.max(...store.samples.map(s => s.sampleNumber || 1000)) + 1 
    : 1001;

  const testIds: string[] = body.testIds || (body.tests ? body.tests.map((t: any) => t.id || t.testId) : []);
  const sampleTests = testIds.map((tId, idx) => {
    const catalogTest = store.tests.find(t => t.id === tId || t.code === tId) || store.tests[0];
    return {
      id: `st-${Date.now()}-${idx}`,
      sampleId: `s-${sampleNum}`,
      testId: catalogTest.id,
      test: catalogTest,
      resultValue: null,
      isAbnormal: false,
      status: 'PENDING',
    };
  });

  const newSample = {
    id: `s-${sampleNum}`,
    sampleNumber: sampleNum,
    patientId: patient.id,
    patient,
    doctorId: body.doctorId || null,
    doctor: store.doctors.find(d => d.id === body.doctorId) || null,
    status: 'RECEIVED',
    isUrgent: !!body.isUrgent,
    priceTotal: body.priceTotal || body.totalPrice || 0,
    discount: body.discount || 0,
    discountPercent: body.discountPercent || 0,
    paidAmount: body.paidAmount || 0,
    remainingAmount: body.remainingAmount || 0,
    paymentMethod: body.paymentMethod || 'CASH',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    tests: sampleTests,
  };

  store.samples.unshift(newSample);
  return NextResponse.json(newSample);
}