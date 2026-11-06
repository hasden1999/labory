import { NextResponse } from 'next/server';
import { updateStaffMember, deleteStaffMember } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = updateStaffMember(params.id, body || {});
    if (!updated) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في تحديث بيانات الموظف' },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ok = deleteStaffMember(params.id);
    if (!ok) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في حذف الموظف' },
      { status: 500 }
    );
  }
}
