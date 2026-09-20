import { NextResponse } from 'next/server';
import { getStore, addSample } from '../../../lib/serverStore';

export async function GET(request: Request) {
  const store = getStore();
  let samples = [...(store.samples || [])];

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const dateFilter = searchParams.get('dateFilter');
  const customDate = searchParams.get('customDate');
  const status = searchParams.get('status');
  const unpaidOnly = searchParams.get('unpaidOnly');
  const urgentOnly = searchParams.get('urgentOnly');
  const query = searchParams.get('query');

  if (patientId) {
    samples = samples.filter((s) => s.patientId === patientId || s.patient?.id === patientId);
  }

  if (status && status !== 'ALL') {
    samples = samples.filter((s) => s.status === status);
  }

  if (unpaidOnly === 'true') {
    samples = samples.filter((s) => (s.remainingAmount || 0) > 0);
  }

  if (urgentOnly === 'true') {
    samples = samples.filter((s) => !!s.isUrgent);
  }

  if (query) {
    const q = query.trim().toLowerCase();
    samples = samples.filter((s) =>
      String(s.sampleNumber).includes(q) ||
      (s.patient?.name && s.patient.name.toLowerCase().includes(q)) ||
      (s.patient?.phone && s.patient.phone.includes(q))
    );
  }

  // Date Range Filtering
  if (customDate) {
    const c = new Date(customDate);
    const start = new Date(c.getFullYear(), c.getMonth(), c.getDate(), 0, 0, 0, 0).getTime();
    const end = new Date(c.getFullYear(), c.getMonth(), c.getDate(), 23, 59, 59, 999).getTime();
    samples = samples.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= start && t <= end;
    });
  } else if (dateFilter && dateFilter !== 'ALL') {
    const now = new Date();
    if (dateFilter === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      samples = samples.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= start && t <= end;
      });
    } else if (dateFilter === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999).getTime();
      samples = samples.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= start && t <= end;
      });
    } else if (dateFilter === 'WEEK') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      samples = samples.filter((s) => new Date(s.createdAt).getTime() >= start.getTime());
    } else if (dateFilter === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      samples = samples.filter((s) => new Date(s.createdAt).getTime() >= start);
    }
  }

  return NextResponse.json(samples);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSample = addSample(body);
    return NextResponse.json(newSample, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'DUPLICATE_ENTRY') {
      return NextResponse.json(
        {
          duplicate: true,
          duplicateSampleNumber: err.duplicateSampleNumber,
          message: err.message,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: err.message || 'فشل إضافة العينة' }, { status: 500 });
  }
}