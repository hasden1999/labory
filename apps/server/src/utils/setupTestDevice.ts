import { prisma } from '../prisma';

export async function setupAstmTestEnvironment() {
  console.log('🔧 Setting up ASTM Test Environment in Database...');

  // 1. Ensure CBC Catalog Tests exist
  const cbcTests = [
    {
      code: 'WBC',
      name: 'White Blood Cells',
      arabicName: 'تعداد كريات الدم البيضاء',
      category: 'أمراض الدم والتخثر',
      price: 3000,
      refRangeLow: 4.0,
      refRangeHigh: 10.0,
      unit: '10*3/uL',
    },
    {
      code: 'RBC',
      name: 'Red Blood Cells',
      arabicName: 'تعداد كريات الدم الحمراء',
      category: 'أمراض الدم والتخثر',
      price: 3000,
      refRangeLow: 3.8,
      refRangeHigh: 5.8,
      unit: '10*6/uL',
    },
    {
      code: 'HGB',
      name: 'Hemoglobin',
      arabicName: 'خضاب الدم (الهيموغلوبين)',
      category: 'أمراض الدم والتخثر',
      price: 3000,
      refRangeLow: 11.5,
      refRangeHigh: 17.5,
      unit: 'g/dL',
    },
    {
      code: 'PLT',
      name: 'Platelets Count',
      arabicName: 'تعداد الصفائح الدموية',
      category: 'أمراض الدم والتخثر',
      price: 3000,
      refRangeLow: 150,
      refRangeHigh: 450,
      unit: '10*3/uL',
    },
    {
      code: 'HCT',
      name: 'Hematocrit (PCV)',
      arabicName: 'مكداس الدم (PCV)',
      category: 'أمراض الدم والتخثر',
      price: 3000,
      refRangeLow: 36.0,
      refRangeHigh: 50.0,
      unit: '%',
    },
  ];

  const testCatalogMap: Record<string, any> = {};
  for (const t of cbcTests) {
    let catalog = await prisma.testCatalog.findFirst({
      where: { code: t.code },
    });
    if (!catalog) {
      catalog = await prisma.testCatalog.create({
        data: t,
      });
      console.log(`  + Created TestCatalog item: ${t.code}`);
    }
    testCatalogMap[t.code] = catalog;
  }

  // 2. Ensure Test Device Exists
  let device = await prisma.labDevice.findFirst({
    where: {
      OR: [
        { brand: 'Mindray', model: 'BC-5000 (ASTM TCP)' },
        { port: 5000, protocol: 'ASTM_1394' },
      ],
    },
    include: { mappings: true },
  });

  if (!device) {
    device = await prisma.labDevice.create({
      data: {
        name: 'جهاز تحليل الدم Mindray BC-5000 (ASTM TCP)',
        brand: 'Mindray',
        model: 'BC-5000 (ASTM TCP)',
        category: 'CBC',
        connectionType: 'TCP_IP',
        protocol: 'ASTM_1394',
        port: 5000,
        autoMatchSample: true,
        status: 'ONLINE',
      },
      include: { mappings: true },
    });
    console.log(`  + Created LabDevice: ${device.name}`);
  } else {
    // Make sure device is active and configured for port 5000 & ASTM
    device = await prisma.labDevice.update({
      where: { id: device.id },
      data: {
        port: 5000,
        protocol: 'ASTM_1394',
        autoMatchSample: true,
        isActive: true,
        status: 'ONLINE',
      },
      include: { mappings: true },
    });
  }

  // 3. Ensure Device Test Mappings exist for the 5 parameters
  for (const testCode of ['WBC', 'RBC', 'HGB', 'PLT', 'HCT']) {
    const existing = device.mappings.find(
      (m) => m.deviceTestCode.toUpperCase() === testCode
    );
    if (!existing && testCatalogMap[testCode]) {
      await prisma.deviceTestMapping.create({
        data: {
          deviceId: device.id,
          deviceTestCode: testCode,
          deviceTestName: testCatalogMap[testCode].name,
          testCatalogId: testCatalogMap[testCode].id,
          unit: testCatalogMap[testCode].unit,
        },
      });
      console.log(`  + Created Device Mapping for: ${testCode}`);
    }
  }

  // 4. Ensure Test Patient exists
  let patient = await prisma.patient.findFirst({
    where: { name: 'مصطفى أحمد علي' },
  });
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        name: 'مصطفى أحمد علي',
        age: 32,
        gender: 'ذكر',
        phone: '07700000001',
      },
    });
    console.log(`  + Created Test Patient: ${patient.name}`);
  }

  // 5. Clean up & Create Sample #2001 (Scenario 1)
  await prisma.incomingResult.deleteMany({
    where: { sampleNumber: { in: [2001, 2002] } },
  });

  const existingSample2001 = await prisma.sample.findFirst({
    where: { sampleNumber: 2001 },
  });
  if (existingSample2001) {
    await prisma.sampleTest.deleteMany({
      where: { sampleId: existingSample2001.id },
    });
    await prisma.sample.update({
      where: { id: existingSample2001.id },
      data: { status: 'RECEIVED' },
    });
  } else {
    await prisma.sample.create({
      data: {
        sampleNumber: 2001,
        patientId: patient.id,
        status: 'RECEIVED',
        priceTotal: 15000,
      },
    });
    console.log('  + Created Sample #2001 (Scenario 1)');
  }

  // 6. Clean up & Create Sample #2002 (Scenario 2)
  const existingSample2002 = await prisma.sample.findFirst({
    where: { sampleNumber: 2002 },
  });
  if (existingSample2002) {
    await prisma.sampleTest.deleteMany({
      where: { sampleId: existingSample2002.id },
    });
    await prisma.sample.update({
      where: { id: existingSample2002.id },
      data: { status: 'RECEIVED' },
    });
  } else {
    await prisma.sample.create({
      data: {
        sampleNumber: 2002,
        patientId: patient.id,
        status: 'RECEIVED',
        priceTotal: 15000,
      },
    });
    console.log('  + Created Sample #2002 (Scenario 2)');
  }

  console.log('✅ ASTM Test Environment Ready in Database!');
}

if (require.main === module) {
  setupAstmTestEnvironment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Setup failed:', err);
      process.exit(1);
    });
}
