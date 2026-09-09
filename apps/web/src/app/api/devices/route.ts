import { NextResponse } from 'next/server';
import { getDevices, addDevice } from '../../../lib/serverStore';

export async function GET() {
  try {
    const devices = getDevices();
    return NextResponse.json({ devices });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل جلب قائمة الأجهزة', error: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.brand) {
      return NextResponse.json({ message: 'اسم الجهاز والشركة المصنعة حقول إلزامية' }, { status: 400 });
    }

    const device = addDevice(body);
    return NextResponse.json({ device, message: 'تمت إضافة الجهاز بنجاح' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل إضافة الجهاز', error: err?.message }, { status: 500 });
  }
}
