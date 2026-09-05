import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    success: true,
    message: 'تم تفعيل ترخيص البرنامج بنجاح مدى الحياة!',
    tier: 'LIFETIME',
  });
}
