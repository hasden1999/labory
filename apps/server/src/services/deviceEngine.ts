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

  // 2. Parse message if rawFrame is provided or use structured payload
  const rawString = payload.rawFrame || JSON.stringify(payload);
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

  // 3. Pre-fetch matched TestCatalog items for all codes in a single batch query
  const incomingTestCodes = (parsed.items || [])
    .map((i) => i.testCode?.trim())
    .filter(Boolean);

  const matchedCatalogsList = incomingTestCodes.length > 0
    ? await prisma.testCatalog.findMany({
        where: {
          OR: [
            { code: { in: incomingTestCodes } },
            { name: { in: incomingTestCodes } },
          ],
        },
      })
    : [];

  const catalogLookupMap = new Map<string, any>();
  for (const cat of matchedCatalogsList) {
    if (cat.code) catalogLookupMap.set(cat.code.toUpperCase(), cat);
    if (cat.name) catalogLookupMap.set(cat.name.toUpperCase(), cat);
  }

  // 6. Execute all updates and inserts within a single atomic SQLite transaction
  await prisma.$transaction(async (tx) => {
    // A. Update Device Status & Last Seen
    await tx.labDevice.update({
      where: { id: device.id },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
      },
    });

    // B. Log Raw Message
    await tx.deviceRawLog.create({
      data: {
        deviceId: device.id,
        direction: 'INCOMING',
        message: rawString.length > 3000 ? rawString.substring(0, 3000) + '...[truncated]' : rawString,
      },
    });

    // C. Process each test result item
    for (const item of parsed.items) {
      if (!item.testCode || item.value === undefined || item.value === '') continue;

      const upperCode = item.testCode.toUpperCase();
      // Check device mappings first
      const mapping = device.mappings.find(
        (m) => m.deviceTestCode.toUpperCase() === upperCode
      );

      let matchedCatalog: any = mapping ? mapping.testCatalog : null;
      if (!matchedCatalog) {
        matchedCatalog = catalogLookupMap.get(upperCode) || null;
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

      // Auto-apply to Sample if sample exists & autoMatchSample is true
      let incomingStatus = 'PENDING';
      let matchedSampleId: string | null = null;
      let matchedSampleTestId: string | null = null;

      if (matchedCatalog) {
        resultsSummary.matchedItems++;
      }

      if (device.autoMatchSample && targetSample && matchedCatalog) {
        matchedSampleId = targetSample.id;

        // Find existing SampleTest or create one
        let existingSampleTest = targetSample.tests.find(
          (st: any) => st.testId === matchedCatalog.id
        );

        if (!existingSampleTest) {
          existingSampleTest = await tx.sampleTest.create({
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
          await tx.sampleTest.update({
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

      const incRecord = await tx.incomingResult.create({
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

    // D. Update sample status to IN_PROGRESS if results are arriving
    if (targetSample && resultsSummary.appliedItems > 0 && targetSample.status === 'RECEIVED') {
      await tx.sample.update({
        where: { id: targetSample.id },
        data: { status: 'IN_PROGRESS' },
      });
    }
  });

  return resultsSummary;
}
