import { NextResponse } from 'next/server';
import { getStore } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.patients);
}

export async function POST(request: Request) {
  const body = await request.json();
  const store = getStore();
  const newPatient = {
    id: `pat-${Date.now()}`,
    name: body.name,
    phone: body.phone,
    age: body.age ? Number(body.age) : null,
    gender: body.gender || 'MALE',
    createdAt: new Date().toISOString(),
  };
  store.patients.unshift(newPatient);
  return NextResponse.json(newPatient);
}