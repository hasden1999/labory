import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('\n========================================================');
    console.log('📱 [WHATSAPP DIAGNOSTIC EVENT RECEIVED FROM CLIENT]');
    console.log(JSON.stringify(data, null, 2));
    console.log('========================================================\n');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
