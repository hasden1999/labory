import { NextResponse } from 'next/server';
import { getStore } from '../../../../../lib/serverStore';

export async function handleSaveResults(request: Request, params: { id: string }) {
  let body: any;
  try {
    const text = await request.text();
    if (!text || !text.trim()) {
      body = {};
    } else {
      body = JSON.parse(text);
    }
  } catch (err: any) {
    return NextResponse.json({ message: 'Malformed serialized string or invalid JSON payload' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    if (Array.isArray(body)) {
      body = { results: body };
    } else {
      return NextResponse.json({ message: 'Invalid payload: body must be an object' }, { status: 400 });
    }
  }

  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  
  if (!sample) {
    return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
  }

  // Update tests results safely
  const rawItems = (body.results && Array.isArray(body.results)) 
    ? body.results 
    : (body.tests && Array.isArray(body.tests)) 
      ? body.tests 
      : [];

  for (const r of rawItems) {
    if (!r || typeof r !== 'object') continue;
    const targetId = r.sampleTestId || r.testId;
    const targetCode = r.testCode;

    // Resilience: skip orphan results with missing test identifiers
    if (!targetId && !targetCode) continue;

    const st = sample.tests.find((t: any) =>
      (targetId && (t.id === targetId || t.testId === targetId)) ||
      (targetCode && (t.code === targetCode || t.test?.code === targetCode))
    );

    if (st) {
      if (r.resultValue !== undefined) {
        st.resultValue = r.resultValue;
      }
      st.isAbnormal = !!r.isAbnormal;
      st.interpretation = r.interpretation || st.interpretation || null;
      st.status = 'COMPLETED';
    }
  }

  if (body.markReady !== false) {
    sample.status = 'READY';
  }

  return NextResponse.json(sample);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handleSaveResults(request, params);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handleSaveResults(request, params);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handleSaveResults(request, params);
}