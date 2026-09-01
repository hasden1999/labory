import { NextResponse } from 'next/server';
import { searchPatients } from '../../../../lib/serverStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const results = searchPatients(q);
  return NextResponse.json(results);
}