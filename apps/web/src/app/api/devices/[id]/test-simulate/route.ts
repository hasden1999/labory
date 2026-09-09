import { NextResponse } from 'next/server';
import { findDevice, processDeviceIngest, getStore } from '../../../../../lib/serverStore';
import { generateAnalyzerSimulation, ClinicalProfileKey } from '../../../../../lib/deviceEngine';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const device = findDevice(params.id);
    if (!device) {
      return NextResponse.json({ message: 'الجهاز غير موجود في النظام' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const store = getStore();

    // Default sample number to first sample or 1001
    const targetSampleNumber = body.sampleNumber 
      ? Number(body.sampleNumber) 
      : (store.samples[0]?.sampleNumber || 1001);

    const targetPatientName = body.patientName?.trim() || store.samples.find(s => s.sampleNumber === targetSampleNumber)?.patient?.name || 'عينة فحص تجريبية';
    const profileKey = (body.profileKey || 'NORMAL_ADULT') as ClinicalProfileKey;

    // 1. Generate quasi-realistic protocol transmission frames & payload
    const simulation = generateAnalyzerSimulation({
      device: {
        name: device.name,
        brand: device.brand,
        model: device.model,
        category: device.category,
        protocol: device.protocol,
        mappings: device.mappings?.map(m => ({
          deviceTestCode: m.deviceTestCode,
          deviceTestName: m.deviceTestName,
          unit: m.unit,
        })),
      },
      sampleNumber: targetSampleNumber,
      sampleBarcode: `SMP-${targetSampleNumber}`,
      patientName: targetPatientName,
      profileKey,
    });

    // 2. Ingest payload into LIS store & match sample
    const ingestSummary = processDeviceIngest({
      deviceIdOrKey: device.id,
      rawPayload: simulation.rawMessage,
      protocol: simulation.protocol,
      overrideSampleNumber: targetSampleNumber,
      overridePatientName: targetPatientName,
    });

    return NextResponse.json({
      success: true,
      simulation: {
        protocol: simulation.protocol,
        profileKey: simulation.profileKey,
        profileName: simulation.profileName,
        sampleNumber: simulation.sampleNumber,
        sampleBarcode: simulation.sampleBarcode,
        patientName: simulation.patientName,
        frames: simulation.frames,
        rawMessage: simulation.rawMessage,
        parsedItemsCount: simulation.parsed.items.length,
        parsedItems: simulation.parsed.items,
      },
      summary: ingestSummary,
      message: `تم تشغيل المحاكاة بنجاح: تم إرسال (${simulation.parsed.items.length}) فحص ومطابقة (${ingestSummary.appliedItems}) نتيجة بالعينة #${targetSampleNumber}`,
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل تشغيل محاكاة الجهاز', error: err?.message }, { status: 500 });
  }
}
