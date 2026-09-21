import { NextResponse } from 'next/server';
import { getStore, saveStoreToFile } from '../../../../../lib/serverStore';
import { syncSampleToSqlite } from '../../../../../lib/sqliteSync';

async function handleSaveResults(request: Request, params: { id: string }) {
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

  // Server-side Derivative Calculations (Lipid & Bilirubin)
  const isChol = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return c === 'CHOL' || c === 'TC' || n.includes('total cholesterol') || a.includes('الكوليسترول الكلي') || (n === 'cholesterol');
  };
  const isHdl = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return c === 'HDL' || c === 'HDL-C' || n.includes('hdl') || a.includes('النافع');
  };
  const isLdl = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return (c === 'LDL' || c === 'LDL-C' || (n.includes('ldl') && !n.includes('vldl')) || a.includes('الضار')) && c !== 'VLDL';
  };
  const isVldl = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return c === 'VLDL' || c === 'VLDL-C' || n.includes('vldl') || a.includes('شديد انخفاض');
  };
  const isTg = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return (c === 'TG' || c === 'TRIG' || n.includes('triglyceride') || a.includes('الدهون الثلاثية')) && !c.includes('ANTI');
  };

  const isTbil = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return c === 'TSB' || c === 'TBIL' || c === 'TB' || n.includes('total bilirubin') || a.includes('الكلي');
  };
  const isDbil = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return c === 'DIR-BIL' || c === 'DBIL' || c === 'DB' || n.includes('direct bilirubin') || a.includes('المباشر');
  };
  const isIbil = (t: any) => {
    const c = (t.code || t.test?.code || '').toUpperCase();
    const n = (t.name || t.test?.name || '').toLowerCase();
    const a = t.arabicName || t.test?.arabicName || '';
    return c === 'INDIR-BIL' || c === 'IBIL' || c === 'IB' || n.includes('indirect bilirubin') || a.includes('غير المباشر');
  };

  const cholT = sample.tests.find(isChol);
  const hdlT = sample.tests.find(isHdl);
  const tgT = sample.tests.find(isTg);
  const ldlT = sample.tests.find(isLdl);
  const vldlT = sample.tests.find(isVldl);

  const tbilT = sample.tests.find(isTbil);
  const dbilT = sample.tests.find(isDbil);
  const ibilT = sample.tests.find(isIbil);

  // Lipid calculations
  if (tgT && tgT.resultValue) {
    const tgVal = parseFloat(tgT.resultValue);
    if (!isNaN(tgVal) && tgVal >= 0) {
      if (vldlT && (!vldlT.resultValue || vldlT.resultValue.trim() === '')) {
        vldlT.resultValue = tgVal >= 400 ? 'غير صالح (TG ≥ 400)' : (tgVal / 5).toFixed(1);
        vldlT.isAbnormal = tgVal >= 400 || parseFloat(vldlT.resultValue) > 30;
        vldlT.status = 'COMPLETED';
      }
      if (cholT && cholT.resultValue && hdlT && hdlT.resultValue && ldlT && (!ldlT.resultValue || ldlT.resultValue.trim() === '')) {
        const cVal = parseFloat(cholT.resultValue);
        const hVal = parseFloat(hdlT.resultValue);
        if (!isNaN(cVal) && !isNaN(hVal)) {
          if (tgVal >= 400) {
            ldlT.resultValue = 'Direct LDL required (TG ≥ 400)';
            ldlT.isAbnormal = true;
          } else {
            const ldlCalc = cVal - hVal - (tgVal / 5);
            if (ldlCalc < 10) {
              ldlT.resultValue = 'Direct LDL required (Calculated <10)';
              ldlT.isAbnormal = true;
            } else {
              ldlT.resultValue = ldlCalc.toFixed(1);
              ldlT.isAbnormal = ldlCalc > 130;
            }
          }
          ldlT.status = 'COMPLETED';
        }
      }
    }
  }

  // Bilirubin calculations
  if (tbilT && tbilT.resultValue && dbilT && dbilT.resultValue && ibilT && (!ibilT.resultValue || ibilT.resultValue.trim() === '')) {
    const tb = parseFloat(tbilT.resultValue);
    const db = parseFloat(dbilT.resultValue);
    if (!isNaN(tb) && !isNaN(db)) {
      if (db > tb) {
        ibilT.resultValue = '0.00';
        ibilT.interpretation = 'تنبيه: Direct Bilirubin أعلى من Total Bilirubin (يلزم إعادة التحقق)';
        ibilT.isAbnormal = true;
      } else {
        const ibVal = (tb - db).toFixed(2);
        ibilT.resultValue = ibVal;
        ibilT.isAbnormal = parseFloat(ibVal) > 0.8;
      }
      ibilT.status = 'COMPLETED';
    }
  }

  if (body.markReady !== false) {
    sample.status = 'READY';
  }

  saveStoreToFile();
  syncSampleToSqlite(sample).catch(err => console.warn('[SqliteSync] Results sync error:', err?.message));

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