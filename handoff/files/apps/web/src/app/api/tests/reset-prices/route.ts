import { NextResponse } from 'next/server';
import { resetAllTestPricesToDefault } from '../../../../lib/serverStore';

export async function POST() {
  try {
    const result = resetAllTestPricesToDefault();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API] Error resetting test prices:', err);
    return NextResponse.json(
      { message: err.message || 'فشل استعادة أسعار الفحوصات الافتراضية' },
      { status: 500 }
    );
  }
}
