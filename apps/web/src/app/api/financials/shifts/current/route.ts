import { NextResponse } from 'next/server';
import { getCurrentShift } from '../../../../../lib/serverStore';

export async function GET() {
  try {
    const shiftData = getCurrentShift();
    return NextResponse.json(shiftData);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل جلب الوردية الحالية' }, { status: 500 });
  }
}
