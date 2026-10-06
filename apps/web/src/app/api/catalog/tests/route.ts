import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.tests);
}