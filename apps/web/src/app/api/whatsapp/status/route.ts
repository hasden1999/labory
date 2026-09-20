import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERVER_URL = process.env.FASTIFY_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${SERVER_URL}/whatsapp/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { connected: false, status: 'DISCONNECTED', message: errText || 'خطأ في جلب حالة واتساب' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      status: 'DISCONNECTED',
      message: 'خادم واتساب المحلي غير متاح حالياً',
    });
  }
}
