import { NextResponse } from 'next/server';
import { processDeviceIngest } from '../../../../lib/serverStore';

export async function POST(request: Request) {
  try {
    const apiKeyHeader = request.headers.get('x-api-key') || '';
    const body = await request.json().catch(() => ({}));
    let payload = body.rawPayload || body.rawMessage || body.message || '';

    // If payload is empty but structured results array was sent (e.g. from UI Test Connection)
    if ((!payload || !payload.trim()) && Array.isArray(body.results) && body.results.length > 0) {
      const nowTimeStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const msgId = `TEST${Date.now().toString().slice(-6)}`;
      const barcode = body.sampleBarcode || body.sampleNumber || '2031';
      const msh = `MSH|^~\\&|MINDRAY_BC30|MINDRAY|LIS_HOST|LABRYO|${nowTimeStr}||ORU^R01|${msgId}|P|2.3.1||||||UNICODE`;
      const pid = `PID|1||${barcode}||${body.patientName || 'عينة تجريبية'}^^|||U`;
      const obr = `OBR|1|${barcode}|${barcode}|CBC^Complete Blood Count^BC30|||${nowTimeStr}||||||||||||||||F`;
      const obx = body.results.map((r: any, idx: number) => {
        const code = r.testCode || r.analyzerCode || 'WBC';
        return `OBX|${idx + 1}|NM|${code}^${code}^LN|1|${r.value || '7.4'}|${r.unit || ''}||${r.flag || 'N'}|||F`;
      });
      payload = [msh, pid, obr, ...obx].join('\r');
    }

    const apiKey =
      body.apiKey ||
      body.deviceId ||
      body.deviceIdOrKey ||
      apiKeyHeader ||
      (payload.includes('MINDRAY') ? 'dev-mindray-bc30' : '');

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

    if (!result.success && result.status === 'UNAUTHORIZED') {
      return NextResponse.json({ message: result.message }, { status: 401 });
    }

    if (!result.success && result.status === 'UNMATCHED_SAMPLE') {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل معالجة واستقبال حزمة الجهاز' }, { status: 500 });
  }
}
