import { NextResponse } from 'next/server';
import { getDebtorStatement } from '../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = getDebtorStatement(id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل جلب كشف الحساب' },
      { status: 404 }
    );
  }
}
