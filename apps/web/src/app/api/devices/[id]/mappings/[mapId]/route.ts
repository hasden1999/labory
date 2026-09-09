import { NextResponse } from 'next/server';
import { deleteDeviceMapping } from '../../../../../../lib/serverStore';

export async function DELETE(request: Request, { params }: { params: { id: string; mapId: string } }) {
  try {
    const ok = deleteDeviceMapping(params.id, params.mapId);
    if (!ok) {
      return NextResponse.json({ message: 'الربط غير موجود أو تم حذفه مسبقاً' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف ربط الفحص بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل حذف الربط', error: err?.message }, { status: 500 });
  }
}
