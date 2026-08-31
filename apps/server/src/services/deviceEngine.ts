import { prisma } from '../prisma';
import { parseUniversalPayload } from '../utils/parsers/universalParser';

export interface IngestPayload {
  apiKey: string;
  rawFrame?: string;
  protocol?: string;
  sampleNumber?: number;
  sampleBarcode?: string;
  patientName?: string;
  items?: Array<{
    testCode: string;
    testName?: string;
    value: string;
    unit?: string;
    flags?: string;
    isAbnormal?: boolean;
    isCritical?: boolean;
  }>;
}

export async function processDeviceIngest(payload: IngestPayload) {
  // 1. Authenticate Device by apiKey
  const device = await prisma.labDevice.findUnique({
    where: { apiKey: payload.apiKey },
    include: {
      mappings: {
        include: {
          testCatalog: true,
        },
      },
    },
  });

  if (!device) {
    throw new Error('Device authentication failed: Invalid apiKey');
  }

  if (!device.isActive) {
    throw new Error('Device is currently deactivated in the system');
  }

  // 2. Update Device Status & Last Seen
  await prisma.labDevice.update({
    where: { id: device.id },
    data: {
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
  });

  // 3. Log Raw Message
  const rawString = payload.rawFrame || JSON.stringify(payload);
  await prisma.deviceRawLog.create({
    data: {
      deviceId: device.id,
      direction: 'INCOMING',
      message: rawString.length > 3000 ? rawString.substring(0, 3000) + '...[truncated]' : rawString,
    },
  });

  // 4. Parse message if rawFrame is provided or use structured payload
  const parsed = payload.rawFrame
    ? parseUniversalPayload(payload.rawFrame, payload.protocol || device.protocol)
    : {
        protocol: (payload.protocol || device.protocol) as any,
        sampleNumber: payload.sampleNumber,
        sampleBarcode: payload.sampleBarcode,
        patientName: payload.patientName,
        items: payload.items || [],
        rawMessage: rawString,
      };

  const sampleNum = parsed.sampleNumber || payload.sampleNumber;
  const sampleBar = parsed.sampleBarcode || payload.sampleBarcode || (sampleNum ? String(sampleNum) : undefined);
  const patientName = parsed.patientName || payload.patientName;

  const resultsSummary = {
    deviceId: device.id,
    deviceName: device.name,
    sampleNumber: sampleNum,
    sampleBarcode: sampleBar,
    patientName,
    totalItems: parsed.items.length,
    matchedItems: 0,
    appliedItems: 0,
    createdResults: [] as any[],
  };

  // Pre-fetch Sample if sampleNumber exists (Prioritize active samples from the last 48h)
  let targetSample: any = null;
  if (sampleNum) {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    targetSample = await prisma.sample.findFirst({
      where: {
        sampleNumber: sampleNum,
        status: { in: ['RECEIVED', 'IN_PROGRESS', 'READY'] },
        createdAt: { gte: twoDaysAgo },
      },
      include: {
        patient: true,
        tests: {
          include: {
            test: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fallback to latest sample with this number if no active 48h match
    if (!targetSample) {
      targetSample = await prisma.sample.findFirst({
        where: { sampleNumber: sampleNum },
        include: {
          patient: true,
          tests: {
            include: {
              test: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  // 5. Process each test result item
  for (const item of parsed.items) {
    if (!item.testCode || item.value === undefined || item.value === '') continue;

    // Check device mappings first
    const mapping = device.mappings.find(
      (m) => m.deviceTestCode.toUpperCase() === item.testCode.toUpperCase()
    );

    let matchedCatalog: any = mapping ? mapping.testCatalog : null;

    // If no explicit mapping, try matching TestCatalog by exact code or name
    if (!matchedCatalog) {
      matchedCatalog = await prisma.testCatalog.findFirst({
        where: {
          OR: [
            { code: { equals: item.testCode } },
            { name: { equals: item.testCode } },
          ],
        },
      });
    }

    let calculatedValue = item.value;
    if (mapping && mapping.multiplier && mapping.multiplier !== 1) {
      const numVal = parseFloat(item.value);
      if (!isNaN(numVal)) {
        calculatedValue = String(Number((numVal * mapping.multiplier).toFixed(2)));
      }
    }

    // Determine abnormal / critical flags if catalog exists
    let isAbnormal = item.isAbnormal || false;
    let isCritical = item.isCritical || false;

    if (matchedCatalog) {
      const numVal = parseFloat(calculatedValue);
      if (!isNaN(numVal)) {
        const low = matchedCatalog.refRangeLow;
        const high = matchedCatalog.refRangeHigh;
        const critLow = matchedCatalog.criticalLow;
        const critHigh = matchedCatalog.criticalHigh;

        if (low !== null && low !== undefined && numVal < low) isAbnormal = true;
        if (high !== null && high !== undefined && numVal > high) isAbnormal = true;
        if (critLow !== null && critLow !== undefined && numVal < critLow) isCritical = true;
        if (critHigh !== null && critHigh !== undefined && numVal > critHigh) isCritical = true;
      }
    }

    // Save IncomingResult record
    let incomingStatus = 'PENDING';
    let matchedSampleId: string | null = null;
    let matchedSampleTestId: string | null = null;

    if (matchedCatalog) {
      resultsSummary.matchedItems++;
    }

    // 6. Auto-apply to Sample if sample exists & autoMatchSample is true
    if (device.autoMatchSample && targetSample && matchedCatalog) {
      matchedSampleId = targetSample.id;

      // Find existing SampleTest or create one
      let existingSampleTest = targetSample.tests.find(
        (st: any) => st.testId === matchedCatalog.id
      );

      if (!existingSampleTest) {
        existingSampleTest = await prisma.sampleTest.create({
          data: {
            sampleId: targetSample.id,
            testId: matchedCatalog.id,
            priceAtTime: matchedCatalog.price,
            costAtTime: matchedCatalog.costEstimate,
            refRangeLow: matchedCatalog.refRangeLow,
            refRangeHigh: matchedCatalog.refRangeHigh,
            refRangeText: matchedCatalog.refRangeText,
            unit: matchedCatalog.unit || item.unit,
            resultValue: calculatedValue,
            isAbnormal,
            isCritical,
            isAutoImported: true,
            importedFrom: `${device.name} (${device.model})`,
            importedAt: new Date(),
            enteredById: `device_${device.id}`,
            enteredAt: new Date(),
          },
          include: { test: true },
        });
      } else {
        await prisma.sampleTest.update({
          where: { id: existingSampleTest.id },
          data: {
            resultValue: calculatedValue,
            unit: existingSampleTest.unit || matchedCatalog.unit || item.unit,
            isAbnormal,
            isCritical,
            isAutoImported: true,
            importedFrom: `${device.name} (${device.model})`,
            importedAt: new Date(),
            enteredById: `device_${device.id}`,
            enteredAt: new Date(),
          },
        });
      }

      matchedSampleTestId = existingSampleTest.id;
      incomingStatus = 'APPLIED';
      resultsSummary.appliedItems++;
    }

    const incRecord = await prisma.incomingResult.create({
      data: {
        deviceId: device.id,
        sampleNumber: sampleNum,
        sampleBarcode: sampleBar,
        patientName: patientName || targetSample?.patient?.name,
        testCode: item.testCode,
        testName: matchedCatalog?.name || item.testName || item.testCode,
        resultValue: calculatedValue,
        unit: item.unit || matchedCatalog?.unit,
        isAbnormal,
        isCritical,
        rawFrame: rawString.length > 500 ? rawString.substring(0, 500) : rawString,
        status: incomingStatus,
        matchedSampleId,
        matchedSampleTestId,
      },
    });

    resultsSummary.createdResults.push(incRecord);
  }

  // Update sample status to IN_PROGRESS if results are arriving
  if (targetSample && resultsSummary.appliedItems > 0 && targetSample.status === 'RECEIVED') {
    await prisma.sample.update({
      where: { id: targetSample.id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  return resultsSummary;
}
