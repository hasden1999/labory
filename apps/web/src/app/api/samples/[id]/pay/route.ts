import { NextResponse } from 'next/server';
import { paySampleRemaining } from '../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

async function handlePay(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const result = paySampleRemaining(id, {
      paidAmount: body.paidAmount || body.amount || body.payAmount,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل سداد متبقي الفحص' },
      { status: 400 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  return handlePay(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  return handlePay(request, context);
}
