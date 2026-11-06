import { NextResponse } from 'next/server';
import { updateInventoryItem, deleteInventoryItem } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = updateInventoryItem(params.id, body || {});
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في تحديث بيانات الصنف' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return PATCH(request, { params });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ok = deleteInventoryItem(params.id);
    if (!ok) {
      return NextResponse.json({ message: 'الصنف غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'تم حذف الصنف من المخزون بنجاح' });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في حذف الصنف' },
      { status: 500 }
    );
  }
}
