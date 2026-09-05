import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    hardwareId: 'LAB-OFFLINE-LOCAL-2026',
    isLicensed: true,
    isTrial: false,
    isExpired: false,
    isClockTampered: false,
    tier: 'LIFETIME',
    daysLeft: 36500,
    expiryDate: '2099-12-31T23:59:59Z',
    message: 'نسخة مرخصة دائمية مدى الحياة (LIFETIME)',
  });
}
