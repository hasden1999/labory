import { NextResponse } from 'next/server';
import { getInventoryAlerts } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alerts = getInventoryAlerts();
    return NextResponse.json(alerts);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في جلب تنبيهات المخزون' },
      { status: 500 }
    );
  }
}
