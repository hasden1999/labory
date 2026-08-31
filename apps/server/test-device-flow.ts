import { prisma } from './src/prisma';
import { parseUniversalPayload } from './src/utils/parsers/universalParser';
import { parseAstm1394 } from './src/utils/parsers/astmParser';
import { parseHl7V2 } from './src/utils/parsers/hl7Parser';
import { processDeviceIngest } from './src/services/deviceEngine';
import { DEVICE_PRESETS } from './src/utils/devicePresets';

async function runTests() {
  console.log('🧪 Starting LIS Device Interfacing End-to-End Verification...\n');

  // Test 1: Test ASTM 1394 Parser
  console.log('1️⃣ Testing ASTM 1394 Parser...');
  const sampleAstm = `
H|\\^&|||Mindray^BC-3000Plus|||||||P|1
P|1||1002||Ali Ahmed||19920510|M
O|1|1001||^^^CBC||||||||||||||||||||F
R|1|^^^WBC|7.45|10*3/uL|4.0-10.0|N||F
R|2|^^^RBC|4.82|10*6/uL|3.8-5.8|N||F
R|3|^^^HGB|14.2|g/dL|11.5-17.5|N||F
R|4|^^^PLT|240|10*3/uL|150-450|N||F
L|1|N
`;
  const parsedAstm = parseAstm1394(sampleAstm);
  console.log('✅ ASTM Parsed successfully:', {
    sampleNumber: parsedAstm.sampleNumber,
    patientName: parsedAstm.patientName,
    itemCount: parsedAstm.items.length,
    tests: parsedAstm.items.map((i) => `${i.testCode}: ${i.value} ${i.unit}`),
  });

  // Test 2: Test HL7 v2 Parser
  console.log('\n2️⃣ Testing HL7 v2 Parser...');
  const sampleHl7 = `
MSH|^~\\&|Mindray|BC-5000|||20260828200000||ORU^R01|102|P|2.3.1
PID|1||1002||Zaid Hassan||19850101|M
OBR|1|1002|1002|CBC^Complete Blood Count|||20260828200000
OBX|1|NM|WBC^White Blood Cell^LN||8.12|10*3/uL|4.0-10.0|N|||F
OBX|2|NM|HGB^Hemoglobin^LN||15.1|g/dL|11.5-17.5|N|||F
OBX|3|NM|PLT^Platelets^LN||490|10*3/uL|150-450|H|||F
`;
  const parsedHl7 = parseHl7V2(sampleHl7);
  console.log('✅ HL7 Parsed successfully:', {
    sampleNumber: parsedHl7.sampleNumber,
    patientName: parsedHl7.patientName,
    itemCount: parsedHl7.items.length,
    tests: parsedHl7.items.map((i) => `${i.testCode}: ${i.value} ${i.unit} (isAbnormal: ${i.isAbnormal})`),
  });

  // Test 3: Create or find test device in DB
  console.log('\n3️⃣ Testing Database Device Registration with Preset...');
  let device = await prisma.labDevice.findFirst({
    where: { brand: 'Mindray', model: 'BC-5000 / BC-5150 / BC-5180' },
  });

  if (!device) {
    device = await prisma.labDevice.create({
      data: {
        name: 'ميندراي CBC خماسي الفئات',
        brand: 'Mindray',
        model: 'BC-5000 / BC-5150 / BC-5180',
        category: 'CBC',
        connectionType: 'TCP_IP',
        protocol: 'HL7_V2',
        port: 5100,
        autoMatchSample: true,
        status: 'ONLINE',
      },
    });
  }

  // Seed sample patient & sample if needed
  let patient = await prisma.patient.findFirst();
  if (!patient) {
    patient = await prisma.patient.create({
      data: { name: 'أحمد محمود', age: 34, gender: 'ذكر' },
    });
  }

  let sample = await prisma.sample.findFirst({
    where: { sampleNumber: 1001 },
  });

  if (!sample) {
    sample = await prisma.sample.create({
      data: {
        sampleNumber: 1001,
        patientId: patient.id,
        status: 'RECEIVED',
        priceTotal: 25000,
      },
    });
  }

  console.log('✅ Device ready in DB:', {
    id: device.id,
    name: device.name,
    apiKey: device.apiKey,
  });

  // Test 4: Simulate Ingestion via Engine
  console.log('\n4️⃣ Testing Ingestion & Auto-matching to Sample #1001...');
  const ingestResult = await processDeviceIngest({
    apiKey: device.apiKey,
    rawFrame: sampleAstm,
    protocol: 'ASTM_1394',
  });

  console.log('✅ Ingestion processed:', {
    sampleNumber: ingestResult.sampleNumber,
    totalItems: ingestResult.totalItems,
    matchedItems: ingestResult.matchedItems,
    appliedItems: ingestResult.appliedItems,
  });

  // Verify SampleTest updated
  const updatedSample = await prisma.sample.findUnique({
    where: { id: sample.id },
    include: {
      tests: { include: { test: true } },
    },
  });

  console.log(`\n🎉 Verification Complete! Sample #${updatedSample?.sampleNumber} now has ${updatedSample?.tests.length} tests populated directly from the analyzer.`);
  updatedSample?.tests.forEach((st) => {
    console.log(`  - [${st.test.name}]: ${st.resultValue} ${st.unit || ''} (AutoImported: ${st.isAutoImported}, From: ${st.importedFrom})`);
  });
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
