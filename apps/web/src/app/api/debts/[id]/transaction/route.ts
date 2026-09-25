import { NextResponse } from 'next/server';
import { recordDebtTransaction } from '../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const result = recordDebtTransaction(id, {
      type: body.type,
      amount: body.amount,
      notes: body.notes,
      sampleId: body.sampleId,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل تسجيل الحركة المالية' },
      { status: 400 }
    );
  }
}
