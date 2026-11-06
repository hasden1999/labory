import { NextResponse } from 'next/server';
import { closeShift } from '../../../../../lib/serverStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const closed = closeShift(body.actualCash, body.notes);
    return NextResponse.json(closed);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل إغلاق الوردية' }, { status: 400 });
  }
}
