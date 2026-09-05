import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    isActivated: true,
    isTrial: false,
    daysRemaining: 365,
    hardwareId: 'LAB-OFFLINE-LOCAL-2026',
    edition: 'PRO_ENTERPRISE',
    message: 'الترخيص نشط ومعتمد',
  });
}
