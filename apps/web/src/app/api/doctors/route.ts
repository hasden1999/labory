import { NextResponse } from 'next/server';
import { INITIAL_DOCTORS } from '../../../lib/catalogData';

export async function GET() {
  return NextResponse.json(INITIAL_DOCTORS);
}
