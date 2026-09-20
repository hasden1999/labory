import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERVER_URL = process.env.FASTIFY_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${SERVER_URL}/whatsapp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'DISCONNECTED',
        connected: false,
        message: 'تعذر الاتصال بمحرك واتساب المحلي لبدء الاقتران',
      },
      { status: 503 }
    );
  }
}
