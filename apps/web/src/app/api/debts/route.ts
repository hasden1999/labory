import { NextResponse } from 'next/server';
import { getDebtorsSummary, createDebtor } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const query = searchParams.get('query') || undefined;

    const data = getDebtorsSummary(type, status, query);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل تحميل سجل الديون والذمم' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name?.trim()) {
      return NextResponse.json(
        { message: 'اسم الشخص أو الجهة مطلوب' },
        { status: 400 }
      );
    }

    const debtor = createDebtor({
      name: body.name,
      phone: body.phone,
      notes: body.notes,
      type: body.type,
      patientId: body.patientId,
      initialDebt: body.initialDebt,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json(debtor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل فتح حساب الذمة' },
      { status: 500 }
    );
  }
}
