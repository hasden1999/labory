import { NextResponse } from 'next/server';
import { getFinancialSummary } from '../../../../lib/serverStore';

export async function GET() {
  try {
    const summary = getFinancialSummary();
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل في حساب الملخص المالي' },
      { status: 500 }
    );
  }
}
