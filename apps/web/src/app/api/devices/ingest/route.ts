import { NextResponse } from 'next/server';
import { processDeviceIngest } from '../../../../lib/serverStore';

export async function POST(request: Request) {
  try {
    const apiKeyHeader = request.headers.get('x-api-key') || '';
    const body = await request.json().catch(() => ({}));
    const payload = body.rawPayload || body.rawMessage || body.message || '';
    const apiKey = body.apiKey || apiKeyHeader;

    if (!payload || !payload.trim()) {
      return NextResponse.json({ message: 'حزمة البيانات الخام فارغة' }, { status: 400 });
    }

    const result = processDeviceIngest({
      deviceIdOrKey: apiKey,
      rawPayload: payload,
      protocol: body.protocol,
      overrideSampleNumber: body.sampleNumber ? Number(body.sampleNumber) : undefined,
      overridePatientName: body.patientName,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل معالجة واستقبال حزمة الجهاز', error: err?.message }, { status: 500 });
  }
}
