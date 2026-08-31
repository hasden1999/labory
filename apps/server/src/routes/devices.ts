import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../prisma';
import { DEVICE_PRESETS } from '../utils/devicePresets';
import { processDeviceIngest, IngestPayload } from '../services/deviceEngine';

export const deviceRoutes: FastifyPluginAsync = async (server) => {
  // Helper to register routes on both paths
  const registerDual = (method: 'get' | 'post' | 'put' | 'delete' | 'patch', path: string, handler: any) => {
    server[method](path, handler);
    server[method](`/api${path}`, handler);
  };

  // 1. Get List of Presets
  const getPresetsHandler = async () => {
    return { success: true, presets: DEVICE_PRESETS };
  };
  registerDual('get', '/devices/presets', getPresetsHandler);

  // 2. Get All Devices
  const getDevicesHandler = async () => {
    const devices = await prisma.labDevice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            mappings: true,
            incomingResults: true,
            logs: true,
          },
        },
      },
    });

    return {
      success: true,
      devices: devices.map((d) => ({
        ...d,
        mappingCount: d._count.mappings,
        resultsCount: d._count.incomingResults,
        logsCount: d._count.logs,
      })),
    };
  };
  registerDual('get', '/devices', getDevicesHandler);

  // 3. Get Single Device Details
  const getDeviceHandler = async (request: any, reply: any) => {
    const { id } = request.params;
    const device = await prisma.labDevice.findUnique({
      where: { id },
      include: {
        mappings: {
          include: {
            testCatalog: true,
          },
          orderBy: { deviceTestCode: 'asc' },
        },
        logs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        incomingResults: {
          take: 30,
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!device) {
      return reply.status(404).send({ success: false, error: 'Device not found' });
    }

    return { success: true, device };
  };
  registerDual('get', '/devices/:id', getDeviceHandler);

  // 4. Create New Device
  const createDeviceHandler = async (request: any, reply: any) => {
    const {
      name,
      brand,
      model,
      category,
      connectionType,
      protocol,
      ipAddress,
      port,
      comPort,
      baudRate,
      dataBits,
      stopBits,
      parity,
      filePath,
      autoMatchSample,
      notes,
      presetId,
    } = request.body || {};

    if (!name || !brand || !model) {
      return reply.status(400).send({
        success: false,
        error: 'Device name, brand, and model are required.',
      });
    }

    const device = await prisma.labDevice.create({
      data: {
        name,
        brand,
        model,
        category: category || 'CBC',
        connectionType: connectionType || 'TCP_IP',
        protocol: protocol || 'ASTM_1394',
        ipAddress: ipAddress || '192.168.1.100',
        port: port ? Number(port) : 5100,
        comPort: comPort || null,
        baudRate: baudRate ? Number(baudRate) : 9600,
        dataBits: dataBits ? Number(dataBits) : 8,
        stopBits: stopBits ? Number(stopBits) : 1,
        parity: parity || 'none',
        filePath: filePath || null,
        autoMatchSample: autoMatchSample !== undefined ? Boolean(autoMatchSample) : true,
        notes: notes || null,
        status: 'OFFLINE',
      },
    });

    // Auto-seed mappings if presetId was provided
    if (presetId) {
      const preset = DEVICE_PRESETS.find((p) => p.id === presetId);
      if (preset && preset.defaultMappings.length > 0) {
        // Fetch test catalogs to match by code or name
        const catalogs = await prisma.testCatalog.findMany();
        for (const mapItem of preset.defaultMappings) {
          const matchedCat = catalogs.find(
            (c) =>
              c.code?.toLowerCase() === mapItem.testCatalogCode.toLowerCase() ||
              c.name.toLowerCase().includes(mapItem.deviceTestCode.toLowerCase()) ||
              c.code?.toLowerCase().includes(mapItem.deviceTestCode.toLowerCase())
          );

          if (matchedCat) {
            await prisma.deviceTestMapping.create({
              data: {
                deviceId: device.id,
                deviceTestCode: mapItem.deviceTestCode,
                deviceTestName: mapItem.deviceTestName,
                testCatalogId: matchedCat.id,
                unit: mapItem.unit || matchedCat.unit,
                multiplier: mapItem.multiplier || 1.0,
              },
            });
          }
        }
      }
    }

    return { success: true, device };
  };
  registerDual('post', '/devices', createDeviceHandler);

  // 5. Update Device
  const updateDeviceHandler = async (request: any) => {
    const { id } = request.params;
    const data = request.body || {};

    const updated = await prisma.labDevice.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand,
        model: data.model,
        category: data.category,
        connectionType: data.connectionType,
        protocol: data.protocol,
        ipAddress: data.ipAddress,
        port: data.port ? Number(data.port) : undefined,
        comPort: data.comPort,
        baudRate: data.baudRate ? Number(data.baudRate) : undefined,
        dataBits: data.dataBits ? Number(data.dataBits) : undefined,
        stopBits: data.stopBits ? Number(data.stopBits) : undefined,
        parity: data.parity,
        filePath: data.filePath,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        autoMatchSample: data.autoMatchSample !== undefined ? Boolean(data.autoMatchSample) : undefined,
        notes: data.notes,
      },
    });

    return { success: true, device: updated };
  };
  registerDual('put', '/devices/:id', updateDeviceHandler);
  registerDual('patch', '/devices/:id', updateDeviceHandler);

  // 6. Delete Device
  const deleteDeviceHandler = async (request: any) => {
    const { id } = request.params;
    await prisma.labDevice.delete({
      where: { id },
    });
    return { success: true, message: 'Device deleted successfully' };
  };
  registerDual('delete', '/devices/:id', deleteDeviceHandler);

  // 7. Add or Update Test Mapping
  const addMappingHandler = async (request: any, reply: any) => {
    const { id } = request.params;
    const { deviceTestCode, deviceTestName, testCatalogId, unit, multiplier } = request.body || {};

    if (!deviceTestCode || !testCatalogId) {
      return reply.status(400).send({
        success: false,
        error: 'deviceTestCode and testCatalogId are required',
      });
    }

    const existing = await prisma.deviceTestMapping.findFirst({
      where: {
        deviceId: id,
        deviceTestCode: { equals: deviceTestCode.trim().toUpperCase() },
      },
    });

    let mapping;
    if (existing) {
      mapping = await prisma.deviceTestMapping.update({
        where: { id: existing.id },
        data: {
          deviceTestName: deviceTestName || existing.deviceTestName,
          testCatalogId,
          unit: unit || existing.unit,
          multiplier: multiplier ? Number(multiplier) : existing.multiplier,
        },
        include: { testCatalog: true },
      });
    } else {
      mapping = await prisma.deviceTestMapping.create({
        data: {
          deviceId: id,
          deviceTestCode: deviceTestCode.trim().toUpperCase(),
          deviceTestName: deviceTestName || deviceTestCode,
          testCatalogId,
          unit: unit || null,
          multiplier: multiplier ? Number(multiplier) : 1.0,
        },
        include: { testCatalog: true },
      });
    }

    return { success: true, mapping };
  };
  registerDual('post', '/devices/:id/mappings', addMappingHandler);

  // 8. Delete Test Mapping
  const deleteMappingHandler = async (request: any) => {
    const { mappingId } = request.params;
    await prisma.deviceTestMapping.delete({
      where: { id: mappingId },
    });
    return { success: true, message: 'Mapping removed' };
  };
  registerDual('delete', '/devices/:id/mappings/:mappingId', deleteMappingHandler);

  // 9. Ingest Webhook
  const ingestHandler = async (request: any, reply: any) => {
    const body = request.body as IngestPayload;

    if (!body || !body.apiKey) {
      return reply.status(401).send({
        success: false,
        error: 'Missing device apiKey in request payload',
      });
    }

    try {
      const summary = await processDeviceIngest(body);
      return { success: true, summary };
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: err.message || 'Failed to process device data',
      });
    }
  };
  registerDual('post', '/devices/ingest', ingestHandler);

  // 10. Simulate Device Transmission
  const simulateHandler = async (request: any, reply: any) => {
    const { id } = request.params;
    const { sampleNumber, patientName, customResults } = request.body || {};

    const device = await prisma.labDevice.findUnique({
      where: { id },
      include: {
        mappings: {
          include: { testCatalog: true },
        },
      },
    });

    if (!device) {
      return reply.status(404).send({ success: false, error: 'Device not found' });
    }

    let items = customResults || [];
    if (items.length === 0) {
      if (device.category === 'CBC') {
        items = [
          { testCode: 'WBC', testName: 'White Blood Cells', value: '7.8', unit: '10^3/uL' },
          { testCode: 'RBC', testName: 'Red Blood Cells', value: '4.85', unit: '10^6/uL' },
          { testCode: 'HGB', testName: 'Hemoglobin', value: '14.2', unit: 'g/dL' },
          { testCode: 'HCT', testName: 'Hematocrit (PCV)', value: '42.5', unit: '%' },
          { testCode: 'MCV', testName: 'MCV', value: '87.6', unit: 'fL' },
          { testCode: 'MCH', testName: 'MCH', value: '29.3', unit: 'pg' },
          { testCode: 'MCHC', testName: 'MCHC', value: '33.4', unit: 'g/dL' },
          { testCode: 'PLT', testName: 'Platelets', value: '265', unit: '10^3/uL' },
          { testCode: 'LYM%', testName: 'Lymphocytes %', value: '32.1', unit: '%' },
          { testCode: 'NEU%', testName: 'Neutrophils %', value: '60.4', unit: '%' },
        ];
      } else if (device.category === 'CHEMISTRY') {
        items = [
          { testCode: 'GLU', testName: 'Glucose', value: '102', unit: 'mg/dL' },
          { testCode: 'UREA', testName: 'Urea', value: '28', unit: 'mg/dL' },
          { testCode: 'CREA', testName: 'Creatinine', value: '0.9', unit: 'mg/dL' },
          { testCode: 'ALT', testName: 'ALT (SGPT)', value: '24', unit: 'U/L' },
          { testCode: 'AST', testName: 'AST (SGOT)', value: '21', unit: 'U/L' },
        ];
      } else if (device.category === 'IMMUNOLOGY') {
        items = [
          { testCode: 'TSH', testName: 'TSH', value: '2.45', unit: 'uIU/mL' },
          { testCode: 'FT4', testName: 'Free T4', value: '1.25', unit: 'ng/dL' },
          { testCode: 'VITD', testName: 'Vitamin D', value: '34.5', unit: 'ng/mL' },
        ];
      } else {
        items = [
          { testCode: 'TEST1', testName: 'Param 1', value: '15.4', unit: 'mg/dL' },
          { testCode: 'TEST2', testName: 'Param 2', value: '3.2', unit: 'mmol/L' },
        ];
      }
    }

    const payload: IngestPayload = {
      apiKey: device.apiKey,
      sampleNumber: sampleNumber ? Number(sampleNumber) : 101,
      sampleBarcode: String(sampleNumber || '101'),
      patientName: patientName || 'عينة تجريبية',
      items,
    };

    const summary = await processDeviceIngest(payload);
    return { success: true, message: 'Simulation processed successfully', summary };
  };
  registerDual('post', '/devices/:id/test-simulate', simulateHandler);

  // 11. Get Incoming Results Feed
  const incomingResultsHandler = async (request: any) => {
    const { status, deviceId, sampleNumber, limit } = request.query || {};

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (deviceId) where.deviceId = deviceId;
    if (sampleNumber) where.sampleNumber = Number(sampleNumber);

    const results = await prisma.incomingResult.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: limit ? Number(limit) : 50,
      include: {
        device: {
          select: { id: true, name: true, model: true, brand: true },
        },
      },
    });

    return { success: true, results };
  };
  registerDual('get', '/devices/incoming-results', incomingResultsHandler);

  // 12. Apply Pending Result Manually
  const applyManualHandler = async (request: any, reply: any) => {
    const { id } = request.params;
    const { sampleId, testCatalogId } = request.body || {};

    const incoming = await prisma.incomingResult.findUnique({
      where: { id },
      include: { device: true },
    });

    if (!incoming) {
      return reply.status(404).send({ success: false, error: 'Incoming result not found' });
    }

    if (!sampleId || !testCatalogId) {
      return reply.status(400).send({
        success: false,
        error: 'sampleId and testCatalogId are required to manually apply result',
      });
    }

    const catalog = await prisma.testCatalog.findUnique({
      where: { id: testCatalogId },
    });

    if (!catalog) {
      return reply.status(404).send({ success: false, error: 'TestCatalog item not found' });
    }

    let sampleTest = await prisma.sampleTest.findFirst({
      where: { sampleId, testId: testCatalogId },
    });

    if (!sampleTest) {
      sampleTest = await prisma.sampleTest.create({
        data: {
          sampleId,
          testId: testCatalogId,
          priceAtTime: catalog.price,
          costAtTime: catalog.costEstimate,
          refRangeLow: catalog.refRangeLow,
          refRangeHigh: catalog.refRangeHigh,
          refRangeText: catalog.refRangeText,
          unit: catalog.unit || incoming.unit,
          resultValue: incoming.resultValue,
          isAbnormal: incoming.isAbnormal,
          isCritical: incoming.isCritical,
          isAutoImported: true,
          importedFrom: `${incoming.device.name} (${incoming.device.model})`,
          importedAt: new Date(),
          enteredAt: new Date(),
        },
      });
    } else {
      await prisma.sampleTest.update({
        where: { id: sampleTest.id },
        data: {
          resultValue: incoming.resultValue,
          unit: sampleTest.unit || catalog.unit || incoming.unit,
          isAbnormal: incoming.isAbnormal,
          isCritical: incoming.isCritical,
          isAutoImported: true,
          importedFrom: `${incoming.device.name} (${incoming.device.model})`,
          importedAt: new Date(),
          enteredAt: new Date(),
        },
      });
    }

    await prisma.incomingResult.update({
      where: { id: incoming.id },
      data: {
        status: 'APPLIED',
        matchedSampleId: sampleId,
        matchedSampleTestId: sampleTest.id,
      },
    });

    return { success: true, message: 'Result applied successfully' };
  };
  registerDual('post', '/devices/incoming-results/:id/apply', applyManualHandler);
};
