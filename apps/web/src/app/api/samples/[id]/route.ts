import { NextResponse } from 'next/server';
import {
  getStore,
  updateSample,
  getNextVoucherNumber,
  saveStoreToFile,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);
  if (!sample) {
    return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
  }
  return NextResponse.json(sample);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const store = getStore();
    const sample = store.samples.find(s => s.id === id || String(s.sampleNumber) === id);
    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    // Determine payment delta if this PATCH is settling debt
    const oldPaid = Number(sample.paidAmount || 0);
    const newPaid = body.paidAmount !== undefined ? Number(body.paidAmount) : oldPaid;
    const paymentDelta = Math.round(newPaid - oldPaid);

    const updated = updateSample(sample.id, body);
    if (!updated) {
      return NextResponse.json({ message: 'تعذر تحديث العينة' }, { status: 400 });
    }

    // If an additional amount was paid, register a cash transaction in financialTransactions
    if (paymentDelta > 0) {
      try {
        const voucherNumber = getNextVoucherNumber();
        const tx = {
          id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          voucherNumber,
          type: 'INCOME',
          amount: paymentDelta,
          category: 'تسديد دين عينة',
          description: `تسديد دفعة دين للعينة #${sample.sampleNumber} - المريض: ${sample.patient?.name || ''}`,
          paymentMethod: body.paymentMethod || 'CASH',
          date: new Date().toISOString(),
          sampleId: sample.id,
          patientId: sample.patientId,
        };
        store.financialTransactions = store.financialTransactions || [];
        store.financialTransactions.push(tx);
        saveStoreToFile();
      } catch (e) {
        console.warn('Failed to auto-create voucher on PATCH /samples/[id]:', e);
      }
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل تحديث العينة' }, { status: 400 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  return PATCH(request, context);
}
