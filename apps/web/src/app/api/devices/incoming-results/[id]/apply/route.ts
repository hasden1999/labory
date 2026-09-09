import { NextResponse } from 'next/server';
import { applyIncomingResult } from '../../../../../../lib/serverStore';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.sampleId || !body.testCatalogId) {
      return NextResponse.json({ message: 'يرجى تحديد العينة والفحص المطلوب إسناد النتيجة إليه' }, { status: 400 });
    }

    const res = applyIncomingResult(params.id, body.sampleId, body.testCatalogId);
    if (!res.success) {
      return NextResponse.json({ message: res.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل إسناد النتيجة', error: err?.message }, { status: 500 });
  }
}
