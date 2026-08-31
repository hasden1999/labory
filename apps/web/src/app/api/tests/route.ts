import { NextResponse } from 'next/server';
import { getStore } from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    tests: store.tests,
    panels: store.panels,
  });
}