import { NextResponse } from 'next/server';
import { openInventoryVial } from '../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const updated = openInventoryVial(params.id);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في تسجيل فتح العبوة' },
      { status: 400 }
    );
  }
}
