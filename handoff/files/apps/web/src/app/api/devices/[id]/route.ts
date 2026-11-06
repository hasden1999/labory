import { NextResponse } from 'next/server';
import { findDevice, updateDevice, deleteDevice, getStore } from '../../../../lib/serverStore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const device = findDevice(params.id);
    if (!device) {
      return NextResponse.json({ message: 'الجهاز غير موجود' }, { status: 404 });
    }

    const store = getStore();
    const deviceLogs = (store.deviceRawLogs || [])
      .filter(l => l.deviceId === device.id)
      .slice(0, 30);

    return NextResponse.json({
      device: {
        ...device,
        logs: deviceLogs,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل تحميل بيانات الجهاز', error: err?.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = updateDevice(params.id, body);
    if (!updated) {
      return NextResponse.json({ message: 'الجهاز غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ device: updated, message: 'تم تحديث الجهاز بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل تحديث الجهاز', error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const ok = deleteDevice(params.id);
    if (!ok) {
      return NextResponse.json({ message: 'الجهاز غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'تم حذف الجهاز بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل حذف الجهاز', error: err?.message }, { status: 500 });
  }
}
