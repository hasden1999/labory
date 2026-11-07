import { NextResponse } from 'next/server';
import { getDevices, addDevice, getLocalIpAddress, markExternalBridgeActive } from '../../../lib/serverStore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('bridge') === '1') {
      markExternalBridgeActive();
    }
    const devices = getDevices();
    return NextResponse.json({
      devices,
      serverIp: getLocalIpAddress(),
      listenerPort: 5000,
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل جلب قائمة الأجهزة', error: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resolvedBrand =
      body.brand ||
      body.manufacturer ||
      (body.name ? String(body.name).trim().split(' ')[0] : 'Generic');
    if (!body.name || !resolvedBrand) {
      return NextResponse.json({ message: 'اسم الجهاز والشركة المصنعة حقول إلزامية' }, { status: 400 });
    }

    const device = addDevice({
      ...body,
      brand: resolvedBrand,
      manufacturer: resolvedBrand,
    });
    return NextResponse.json({ device, message: 'تمت إضافة الجهاز بنجاح' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل إضافة الجهاز', error: err?.message }, { status: 500 });
  }
}
