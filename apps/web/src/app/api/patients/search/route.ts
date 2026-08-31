import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const store = getStore();
  const filtered = store.patients.filter(p => 
    p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q))
  );
  return NextResponse.json(filtered);
}