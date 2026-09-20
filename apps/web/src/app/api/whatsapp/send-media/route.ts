import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERVER_URL = process.env.FASTIFY_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for media dispatch

    const res = await fetch(`${SERVER_URL}/whatsapp/send-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timeoutId));

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'تعذر إرسال الوسائط عبر محرك واتساب المحلي',
      },
      { status: 500 }
    );
  }
}
