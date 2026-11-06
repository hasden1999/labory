import { NextResponse } from 'next/server';
import { whatsappWebEngine, SendMediaParams } from '../../../../lib/whatsappWebEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendMediaParams;
    if (!body?.phone) {
      return NextResponse.json({ success: false, message: 'رقم هاتف المريض مطلوب' }, { status: 400 });
    }
    if (!body?.mediaBuffer) {
      return NextResponse.json({ success: false, message: 'محتوى ملف النتيجة مطلوب' }, { status: 400 });
    }

    const result = await whatsappWebEngine.sendMedia({
      phone: body.phone,
      type: body.type || 'image',
      mediaBuffer: body.mediaBuffer,
      caption: body.caption,
      fileName: body.fileName,
      mimetype: body.mimetype,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'تعذر إرسال الوسائط عبر جلسة واتساب ويب',
      },
      { status: 500 }
    );
  }
}
