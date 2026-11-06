import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { status: 'OK', app: 'web' },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
