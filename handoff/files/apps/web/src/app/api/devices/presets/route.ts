import { NextResponse } from 'next/server';
import { DEVICE_PRESETS } from '../../../../lib/devicePresets';

export async function GET() {
  try {
    return NextResponse.json({ presets: DEVICE_PRESETS });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل جلب إعدادات الأجهزة الجاهزة', error: err?.message }, { status: 500 });
  }
}
