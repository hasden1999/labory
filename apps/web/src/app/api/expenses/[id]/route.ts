import { NextResponse } from 'next/server';
import { deleteExpense } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ok = deleteExpense(params.id);
    if (!ok) {
      return NextResponse.json({ message: 'المصروف غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في حذف المصروف' },
      { status: 500 }
    );
  }
}
