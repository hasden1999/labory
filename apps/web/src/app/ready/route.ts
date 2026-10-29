import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ready: true, status: 'READY', timestamp: Date.now() },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
