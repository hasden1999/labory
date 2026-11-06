import { NextResponse } from 'next/server';
import { openShift } from '../../../../../lib/serverStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newShift = openShift(body.startingCash, body.notes);
    return NextResponse.json(newShift, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل فتح الوردية' }, { status: 400 });
  }
}
