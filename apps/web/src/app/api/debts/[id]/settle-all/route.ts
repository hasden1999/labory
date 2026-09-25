import { NextResponse } from 'next/server';
import { settleAllDebtor } from '../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const result = settleAllDebtor(id, {
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل تسوية وتصفية الحساب' },
      { status: 400 }
    );
  }
}
