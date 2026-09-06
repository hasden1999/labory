import { NextResponse } from 'next/server';
import { getTestProfitability } from '../../../../lib/serverStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';
    const breakdown = getTestProfitability(timeframe);
    return NextResponse.json(breakdown);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل في حساب تحليل الربحية' },
      { status: 500 }
    );
  }
}
