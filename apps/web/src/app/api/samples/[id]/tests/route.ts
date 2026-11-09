import { NextResponse } from 'next/server';
import { getStore, saveStoreToFile, getNextVoucherNumber } from '../../../../../lib/serverStore';
import { syncSampleToSqlite, deleteSampleTestFromSqlite } from '../../../../../lib/sqliteSync';
import { isBlockingOrderTest } from '../../../../../lib/orderHelpers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { testIds, paymentMode = 'DEBT' } = body || {};

    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json({ message: 'يرجى اختيار فحص واحد على الأقل لإضافته' }, { status: 400 });
    }

    const store = getStore();
    const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    const existingTestIds = new Set(sample.tests.map(t => t.testId));
    const newTestIds = testIds.filter((tid: string) => !existingTestIds.has(tid));

    if (newTestIds.length === 0) {
      const duplicateTestNames = sample.tests
        .filter(st => testIds.includes(st.testId) || (st.test?.id && testIds.includes(st.test.id)))
        .map(st => st.test?.name || 'فحص')
        .join('، ');
      return NextResponse.json({
        message: `⚠️ تنبيه: الفحص (${duplicateTestNames}) تم اختياره مسبقاً لهذا المريض في نفس الزيارة!`
      }, { status: 409 });
    }

    const catalogTests = store.tests.filter(t => newTestIds.includes(t.id));
    let addedTotal = 0;

    for (const catTest of catalogTests) {
      addedTotal += catTest.price || 0;
      sample.tests.push({
        id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sampleId: sample.id,
        testId: catTest.id,
        test: catTest,
        resultValue: null,
        isAbnormal: false,
        interpretation: null,
        status: 'PENDING',
        priceAtTime: catTest.price || 0,
        costAtTime: catTest.costEstimate || 0,
        refRangeLow: catTest.refRangeLow ?? null,
        refRangeHigh: catTest.refRangeHigh ?? null,
        refRangeText: catTest.refRangeText || (catTest.refRangeLow != null && catTest.refRangeHigh != null ? `${catTest.refRangeLow} - ${catTest.refRangeHigh}` : null),
        unit: catTest.unit || null,
      });
    }

    sample.priceTotal = (sample.priceTotal || 0) + addedTotal;
    const now = new Date().toISOString();

    if (paymentMode === 'CASH') {
      sample.paidAmount = (sample.paidAmount || 0) + addedTotal;
      sample.remainingAmount = Math.max(0, sample.remainingAmount || 0);
      (sample as any).isPaid = (sample.remainingAmount || 0) <= 0;
      sample.paymentStatus = (sample.remainingAmount || 0) <= 0 ? 'PAID' : 'PARTIAL';

      if (addedTotal > 0) {
        if (!Array.isArray(store.financialTransactions)) {
          store.financialTransactions = [];
        }
        const voucherNumber = getNextVoucherNumber();
        const addedNames = catalogTests.map(t => t.code || t.name).join('، ');
        store.financialTransactions.unshift({
          id: 'ft-addtest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          voucherNumber,
          type: 'INCOME',
          amount: addedTotal,
          category: 'إضافة فحص لعينة',
          description: `قبض فوري لإضافة فحوصات (${addedNames}) للعينة #${sample.sampleNumber} - المريض: ${sample.patient?.name || ''}`,
          paymentMethod: 'CASH',
          date: now,
          sampleId: sample.id,
          patientId: sample.patientId,
        });
      }
    } else {
      sample.remainingAmount = Math.max(0, (sample.remainingAmount || 0) + addedTotal);
      (sample as any).isPaid = false;
      sample.paymentStatus = (sample.paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING';
    }

    // If sample was previously ready or delivered, revert to IN_PROGRESS since new pending tests were added
    if (sample.status === 'READY' || sample.status === 'DELIVERED' || sample.status === 'COMPLETED') {
      sample.status = 'IN_PROGRESS';
    }
    (sample as any).updatedAt = now;

    // Sync patient recent test metadata
    if (sample.patientId) {
      const patient = store.patients.find(p => p.id === sample.patientId);
      if (patient) {
        const allTestIds = sample.tests.map(t => t.testId);
        const allTestNames = sample.tests.map(t => t.test?.name || '').filter(Boolean);
        (patient as any).lastTestIds = Array.from(new Set([...((patient as any).lastTestIds || []), ...allTestIds]));
        (patient as any).lastTestNames = Array.from(new Set([...((patient as any).lastTestNames || []), ...allTestNames]));
      }
    }

    saveStoreToFile();
    syncSampleToSqlite(sample).catch(err => console.warn('[SqliteSync] Add sample test sync error:', err?.message));

    return NextResponse.json(sample);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل إضافة الفحوصات' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    let sampleTestId = searchParams.get('sampleTestId') || searchParams.get('testId');

    if (!sampleTestId) {
      try {
        const body = await request.json();
        sampleTestId = body?.sampleTestId || body?.testId;
      } catch {}
    }

    if (!sampleTestId) {
      return NextResponse.json({ message: 'يرجى تحديد الفحص المراد حذفه' }, { status: 400 });
    }

    const store = getStore();
    const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    if ((sample.tests || []).length <= 1) {
      return NextResponse.json(
        {
          error: 'لا يمكن حذف الفحص الوحيد المتبقي في الزيارة. يمكنك حذف الزيارة بالكامل من سجل المرضى.',
          message: 'لا يمكن حذف الفحص الوحيد المتبقي في الزيارة. يمكنك حذف الزيارة بالكامل من سجل المرضى.',
        },
        { status: 400 }
      );
    }

    const testIndex = sample.tests.findIndex(
      t => t.id === sampleTestId || t.testId === sampleTestId || t.test?.id === sampleTestId
    );

    if (testIndex === -1) {
      return NextResponse.json({ message: 'الفحص غير موجود ضمن هذه العينة' }, { status: 404 });
    }

    const [removedTest] = sample.tests.splice(testIndex, 1);
    const testPrice = Number((removedTest as any).priceAtTime ?? removedTest.test?.price ?? (removedTest as any).price ?? 0);

    // Recalculate priceTotal, paidAmount, and remainingAmount safely
    sample.priceTotal = Math.max(0, (sample.priceTotal || 0) - testPrice);
    const netTotal = Math.max(0, sample.priceTotal - (sample.discount || 0));
    if ((sample.paidAmount || 0) > netTotal) {
      sample.paidAmount = netTotal;
    }
    sample.remainingAmount = Math.max(0, netTotal - (sample.paidAmount || 0));

    // Recalculate sample status if all remaining blocking tests have results
    const blockingTests = sample.tests.filter((t: any) => isBlockingOrderTest(t));
    if (
      sample.tests.length > 0 &&
      blockingTests.every((t: any) => t.resultValue !== null && t.resultValue !== undefined && String(t.resultValue).trim() !== '')
    ) {
      sample.status = 'COMPLETED';
    }

    saveStoreToFile();
    await deleteSampleTestFromSqlite(
      sample.id,
      sampleTestId,
      sample.priceTotal,
      sample.remainingAmount,
      sample.paidAmount,
      sample.status
    ).catch(err => console.warn('[SqliteSync] Delete sample test sqlite error:', err?.message));
    syncSampleToSqlite(sample).catch(err => console.warn('[SqliteSync] Delete sample test sync error:', err?.message));

    return NextResponse.json({
      success: true,
      message: 'تم حذف التحليل بنجاح',
      sample,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل حذف الفحص' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { sampleTestId, testId, includePrevious } = body || {};

    const store = getStore();
    const sample = store.samples.find(s => s.id === params.id || String(s.sampleNumber) === params.id);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    if (sampleTestId === 'ALL' || testId === 'ALL') {
      (sample.tests || []).forEach(t => {
        (t as any).includePrevious = Boolean(includePrevious);
      });
    } else {
      const targetTest = (sample.tests || []).find(
        t =>
          (sampleTestId && (t.id === sampleTestId || t.testId === sampleTestId || t.test?.id === sampleTestId)) ||
          (testId && (t.id === testId || t.testId === testId || t.test?.id === testId))
      );

      if (!targetTest) {
        return NextResponse.json({ message: 'الفحص غير موجود ضمن هذه العينة' }, { status: 404 });
      }

      (targetTest as any).includePrevious = Boolean(includePrevious);
    }

    saveStoreToFile();
    return NextResponse.json(sample);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل تحديث إعدادات النتائج السابقة' }, { status: 500 });
  }
}
