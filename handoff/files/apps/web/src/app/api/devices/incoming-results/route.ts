import { NextResponse } from 'next/server';
import { getIncomingResults } from '../../../../lib/serverStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const status = searchParams.get('status') || 'ALL';
    const deviceId = searchParams.get('deviceId') || undefined;

    const results = getIncomingResults({ limit, status, deviceId });
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل جلب سجل النتائج الواردة', error: err?.message }, { status: 500 });
  }
}
