import { NextResponse } from 'next/server';
import { getShiftHistory } from '../../../../../lib/serverStore';

export async function GET() {
  try {
    const history = getShiftHistory();
    return NextResponse.json(history);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل جلب سجل الورديات' }, { status: 500 });
  }
}
