import { NextResponse } from 'next/server';
import { deleteExpense } from '../../../../../lib/serverStore';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'معرف المصروف غير صالح' }, { status: 400 });
    }
    const success = deleteExpense(id);
    if (!success) {
      return NextResponse.json({ message: 'لم يتم العثور على المصروف المطلوب' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'تم مسح قيد المصروف بنجاح' });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'خطأ أثناء حذف المصروف' },
      { status: 500 }
    );
  }
}
