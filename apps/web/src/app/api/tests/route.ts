import { NextResponse } from 'next/server';
import { INITIAL_TESTS_CATALOG, INITIAL_PANELS } from '../../../lib/catalogData';

export async function GET() {
  return NextResponse.json({
    tests: INITIAL_TESTS_CATALOG,
    panels: INITIAL_PANELS,
  });
}
