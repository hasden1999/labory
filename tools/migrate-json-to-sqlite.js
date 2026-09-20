const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('========================================================');
  console.log('  🚀 بدء عملية الترحيل من lab_store.json إلى SQLite (lab.db)');
  console.log('========================================================\n');

  const jsonPath = path.join(__dirname, '..', 'apps', 'web', 'data', 'lab_store.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error('لم يتم العثور على ملف lab_store.json في: ' + jsonPath);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const store = JSON.parse(rawData);

  // 1. Settings
  console.log('[1/8] ترحيل إعدادات المختبر والترويسة...');
  if (store.settings) {
    const s = store.settings;
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        labName: s.labName || 'مختبر لابريو للتحليلات الطبية التخصصية',
        labSubtitle: s.labSubtitle || 'تشخيص إلكتروني متكامل ومعتمد',
        doctorName: s.doctorName || '',
        doctorTitle: s.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية',
        labLicense: s.labLicense || '',
        phone: s.phone || '',
        whatsappNumber: s.whatsappNumber || '',
        address: s.address || '',
        currency: s.currency || 'د.ع',
        reportHeader: s.reportHeader || s.labName || '',
        reportFooter: s.reportFooter || '',
        reportTemplate: s.reportTemplate || 'CLASSIC',
        cbcLayoutTemplate: s.cbcLayoutTemplate || 'WITH_HISTOGRAMS',
        showPanicFlags: s.showPanicFlags !== false,
        showClinicalComments: s.showClinicalComments !== false,
        showReferenceRanges: s.showReferenceRanges !== false,
        installedVersion: 'v1.0.7',
      },
      create: {
        id: 'singleton',
        labName: s.labName || 'مختبر لابريو للتحليلات الطبية التخصصية',
        labSubtitle: s.labSubtitle || 'تشخيص إلكتروني متكامل ومعتمد',
        doctorName: s.doctorName || '',
        doctorTitle: s.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية',
        labLicense: s.labLicense || '',
        phone: s.phone || '',
        whatsappNumber: s.whatsappNumber || '',
        address: s.address || '',
        currency: s.currency || 'د.ع',
        reportHeader: s.reportHeader || s.labName || '',
        reportFooter: s.reportFooter || '',
        reportTemplate: s.reportTemplate || 'CLASSIC',
        cbcLayoutTemplate: s.cbcLayoutTemplate || 'WITH_HISTOGRAMS',
        showPanicFlags: s.showPanicFlags !== false,
        showClinicalComments: s.showClinicalComments !== false,
        showReferenceRanges: s.showReferenceRanges !== false,
        installedVersion: 'v1.0.7',
      }
    });
    console.log('✅ تم ترحيل إعدادات المختبر بنجاح.');
  }

  // 2. Staff Default
  console.log('[2/8] التحقق من الكادر الافتراضي (Admin/Operator)...');
  const staffExists = await prisma.staff.findFirst();
  if (!staffExists) {
    await prisma.staff.create({
      data: {
        id: 'staff-admin-default',
        name: 'مدير المختبر',
        username: 'admin',
        passwordHash: 'admin123',
        role: 'OWNER',
        active: true,
      }
    });
    console.log('✅ تم إنشاء حساب مدير المختبر الافتراضي.');
  } else {
    console.log('✅ حسابات الكادر موجودة مسبقاً.');
  }

  // 3. Tests Catalog
  console.log('[3/8] ترحيل كتالوج الفحوصات الطبية (135 فحصاً)...');
  const existingTests = store.tests || [];
  let testCount = 0;
  for (const t of existingTests) {
    if (!t.id) continue;
    await prisma.testCatalog.upsert({
      where: { id: t.id },
      update: {
        code: t.code || t.id.replace(/^t-/, '').toUpperCase(),
        name: t.name || t.id,
        arabicName: t.arabicName || t.name,
        category: t.category || 'عام',
        price: Number(t.price) || 0,
        costEstimate: Number(t.cost || t.costEstimate) || 0,
        refRangeLow: t.refRangeLow != null ? Number(t.refRangeLow) : null,
        refRangeHigh: t.refRangeHigh != null ? Number(t.refRangeHigh) : null,
        normalMaleLow: t.normalMaleLow != null ? Number(t.normalMaleLow) : null,
        normalMaleHigh: t.normalMaleHigh != null ? Number(t.normalMaleHigh) : null,
        normalFemaleLow: t.normalFemaleLow != null ? Number(t.normalFemaleLow) : null,
        normalFemaleHigh: t.normalFemaleHigh != null ? Number(t.normalFemaleHigh) : null,
        criticalLow: t.criticalLow != null ? Number(t.criticalLow) : null,
        criticalHigh: t.criticalHigh != null ? Number(t.criticalHigh) : null,
        refRangeText: t.refRangeText || t.normalRange || null,
        unit: t.unit || null,
        sampleType: t.sampleType || 'Serum',
        active: t.active !== false,
      },
      create: {
        id: t.id,
        code: t.code || t.id.replace(/^t-/, '').toUpperCase(),
        name: t.name || t.id,
        arabicName: t.arabicName || t.name,
        category: t.category || 'عام',
        price: Number(t.price) || 0,
        costEstimate: Number(t.cost || t.costEstimate) || 0,
        refRangeLow: t.refRangeLow != null ? Number(t.refRangeLow) : null,
        refRangeHigh: t.refRangeHigh != null ? Number(t.refRangeHigh) : null,
        normalMaleLow: t.normalMaleLow != null ? Number(t.normalMaleLow) : null,
        normalMaleHigh: t.normalMaleHigh != null ? Number(t.normalMaleHigh) : null,
        normalFemaleLow: t.normalFemaleLow != null ? Number(t.normalFemaleLow) : null,
        normalFemaleHigh: t.normalFemaleHigh != null ? Number(t.normalFemaleHigh) : null,
        criticalLow: t.criticalLow != null ? Number(t.criticalLow) : null,
        criticalHigh: t.criticalHigh != null ? Number(t.criticalHigh) : null,
        refRangeText: t.refRangeText || t.normalRange || null,
        unit: t.unit || null,
        sampleType: t.sampleType || 'Serum',
        active: t.active !== false,
      }
    });
    testCount++;
  }
  console.log(`✅ تم ترحيل ومزامنة ${testCount} فحص طبي في قاعدة البيانات.`);

  // 4. Panels
  console.log('[4/8] ترحيل باقات الفحوصات (18 باقة)...');
  const panels = store.panels || [];
  let panelCount = 0;
  for (const p of panels) {
    if (!p.id) continue;
    await prisma.testPanel.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description || null,
        price: Number(p.price) || 0,
      },
      create: {
        id: p.id,
        name: p.name,
        description: p.description || null,
        price: Number(p.price) || 0,
      }
    });

    // Panel items
    const testIds = p.testIds || [];
    for (const tid of testIds) {
      const testExists = await prisma.testCatalog.findUnique({ where: { id: tid } });
      if (testExists) {
        const itemId = `${p.id}_${tid}`;
        await prisma.testPanelItem.upsert({
          where: { id: itemId },
          update: {},
          create: {
            id: itemId,
            panelId: p.id,
            testId: tid,
          }
        });
      }
    }
    panelCount++;
  }
  console.log(`✅ تم ترحيل ومزامنة ${panelCount} باقة فحوصات طبية.`);

  // 5. Doctors
  console.log('[5/8] ترحيل الأطباء والعيادات...');
  const doctors = store.doctors || [];
  let docCount = 0;
  for (const d of doctors) {
    if (!d.id) continue;
    await prisma.referringDoctor.upsert({
      where: { id: d.id },
      update: {
        name: d.name,
        phone: d.phone || null,
        clinic: d.clinic || d.clinicAddress || null,
        specialty: d.specialty || null,
        commissionPercent: Number(d.commissionPercent) || 0,
      },
      create: {
        id: d.id,
        name: d.name,
        phone: d.phone || null,
        clinic: d.clinic || d.clinicAddress || null,
        specialty: d.specialty || null,
        commissionPercent: Number(d.commissionPercent) || 0,
      }
    });
    docCount++;
  }
  console.log(`✅ تم ترحيل ${docCount} طبيب.`);

  // 6. Patients
  console.log('[6/8] ترحيل سجلات المرضى...');
  const patients = store.patients || [];
  let patCount = 0;
  for (const pat of patients) {
    if (!pat.id) continue;
    const gender = (pat.gender === 'FEMALE' || pat.gender === 'أنثى') ? 'أنثى' : 'ذكر';
    await prisma.patient.upsert({
      where: { id: pat.id },
      update: {
        name: pat.name,
        phone: pat.phone || null,
        age: pat.age != null ? Number(pat.age) : null,
        gender,
      },
      create: {
        id: pat.id,
        name: pat.name,
        phone: pat.phone || null,
        age: pat.age != null ? Number(pat.age) : null,
        gender,
        createdAt: pat.createdAt ? new Date(pat.createdAt) : new Date(),
      }
    });
    patCount++;
  }
  console.log(`✅ تم ترحيل ${patCount} مريض.`);

  // 7. Samples & SampleTests
  console.log('[7/8] ترحيل العينات والفحوصات والنتائج المسجلة...');
  const samples = store.samples || [];
  let sampleCount = 0;
  let sampleTestCount = 0;

  for (const smp of samples) {
    if (!smp.id) continue;

    let patientId = smp.patientId || smp.patient?.id;
    let patRecord = null;
    if (patientId) {
      patRecord = await prisma.patient.findUnique({ where: { id: patientId } });
    }
    if (!patRecord) {
      // Create fallback patient if missing
      const pName = smp.patient?.name || smp.patientName || `مريض عينة ${smp.sampleNumber || smp.id}`;
      patRecord = await prisma.patient.create({
        data: {
          id: patientId || `pat-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: pName,
          phone: smp.patient?.phone || null,
          age: smp.patient?.age != null ? Number(smp.patient.age) : null,
          gender: 'ذكر',
        }
      });
      patientId = patRecord.id;
    }

    const sampleNum = Number(smp.sampleNumber || smp.sampleNum || (1000 + sampleCount));
    const existingByNum = await prisma.sample.findUnique({ where: { sampleNumber: sampleNum } });
    let sampleRecord;

    if (existingByNum) {
      sampleRecord = await prisma.sample.update({
        where: { sampleNumber: sampleNum },
        data: {
          patientId,
          doctorId: smp.doctorId || null,
          status: smp.status || 'RECEIVED',
          isUrgent: Boolean(smp.isUrgent),
          priceTotal: Number(smp.totalPrice || smp.priceTotal || 0),
          discount: Number(smp.discount || 0),
          discountPercent: Number(smp.discountPercent || 0),
          paidAmount: Number(smp.paidAmount || 0),
          remainingAmount: Number(smp.remainingAmount || 0),
          paymentMethod: smp.paymentMethod || 'نقداً',
          notes: smp.notes || null,
        }
      });
    } else {
      sampleRecord = await prisma.sample.create({
        data: {
          id: smp.id,
          sampleNumber: sampleNum,
          patientId,
          doctorId: smp.doctorId || null,
          status: smp.status || 'RECEIVED',
          isUrgent: Boolean(smp.isUrgent),
          priceTotal: Number(smp.totalPrice || smp.priceTotal || 0),
          discount: Number(smp.discount || 0),
          discountPercent: Number(smp.discountPercent || 0),
          paidAmount: Number(smp.paidAmount || 0),
          remainingAmount: Number(smp.remainingAmount || 0),
          paymentMethod: smp.paymentMethod || 'نقداً',
          notes: smp.notes || null,
          collectionTime: smp.collectionTime ? new Date(smp.collectionTime) : new Date(),
          createdAt: smp.createdAt ? new Date(smp.createdAt) : new Date(),
        }
      });
    }
    sampleCount++;

    // Tests within sample
    const testsArr = smp.tests || [];
    for (const t of testsArr) {
      const testId = t.testId || t.id;
      if (!testId) continue;

      // Ensure test catalog entry exists
      let catTest = await prisma.testCatalog.findUnique({ where: { id: testId } });
      if (!catTest) {
        catTest = await prisma.testCatalog.create({
          data: {
            id: testId,
            name: t.name || testId,
            code: t.code || testId.toUpperCase(),
            category: t.category || 'عام',
            price: Number(t.price) || 0,
          }
        });
      }

      const stId = t.sampleTestId || `${sampleRecord.id}_${testId}`;
      await prisma.sampleTest.upsert({
        where: { id: stId },
        update: {
          resultValue: t.resultValue != null ? String(t.resultValue) : (t.value != null ? String(t.value) : null),
          notes: t.notes || null,
          isAbnormal: Boolean(t.isAbnormal),
          isCritical: Boolean(t.isCritical),
          interpretation: t.interpretation || null,
          priceAtTime: Number(t.priceAtTime || t.price || 0),
          costAtTime: Number(t.costAtTime || t.cost || 0),
          refRangeLow: t.refRangeLow != null ? Number(t.refRangeLow) : null,
          refRangeHigh: t.refRangeHigh != null ? Number(t.refRangeHigh) : null,
          refRangeText: t.refRangeText || t.normalRange || null,
          unit: t.unit || catTest.unit || null,
        },
        create: {
          id: stId,
          sampleId: sampleRecord.id,
          testId,
          resultValue: t.resultValue != null ? String(t.resultValue) : (t.value != null ? String(t.value) : null),
          notes: t.notes || null,
          isAbnormal: Boolean(t.isAbnormal),
          isCritical: Boolean(t.isCritical),
          interpretation: t.interpretation || null,
          priceAtTime: Number(t.priceAtTime || t.price || 0),
          costAtTime: Number(t.costAtTime || t.cost || 0),
          refRangeLow: t.refRangeLow != null ? Number(t.refRangeLow) : null,
          refRangeHigh: t.refRangeHigh != null ? Number(t.refRangeHigh) : null,
          refRangeText: t.refRangeText || t.normalRange || null,
          unit: t.unit || catTest.unit || null,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        }
      });
      sampleTestCount++;
    }
  }
  console.log(`✅ تم ترحيل ${sampleCount} عينة طبية و ${sampleTestCount} فحص تفصيلي.`);

  // 8. Devices
  console.log('[8/8] ترحيل الأجهزة الطبية وخرائط الربط (Mappings)...');
  const devices = store.devices || [];
  let devCount = 0;
  for (const dev of devices) {
    if (!dev.id) continue;
    await prisma.labDevice.upsert({
      where: { id: dev.id },
      update: {
        name: dev.name,
        brand: dev.brand || 'Mindray',
        model: dev.model || dev.name,
        category: dev.category || 'CBC',
        connectionType: dev.connectionType || 'TCP_IP',
        protocol: dev.protocol || 'HL7_V2',
        ipAddress: dev.ipAddress || '192.168.1.100',
        port: dev.port != null ? Number(dev.port) : 5100,
        comPort: dev.comPort || null,
        baudRate: dev.baudRate != null ? Number(dev.baudRate) : null,
        apiKey: dev.apiKey || `dev_key_${dev.id}`,
        status: dev.status || 'ONLINE',
        autoMatchSample: dev.autoMatchSample !== false,
      },
      create: {
        id: dev.id,
        name: dev.name,
        brand: dev.brand || 'Mindray',
        model: dev.model || dev.name,
        category: dev.category || 'CBC',
        connectionType: dev.connectionType || 'TCP_IP',
        protocol: dev.protocol || 'HL7_V2',
        ipAddress: dev.ipAddress || '192.168.1.100',
        port: dev.port != null ? Number(dev.port) : 5100,
        comPort: dev.comPort || null,
        baudRate: dev.baudRate != null ? Number(dev.baudRate) : null,
        apiKey: dev.apiKey || `dev_key_${dev.id}`,
        status: dev.status || 'ONLINE',
        autoMatchSample: dev.autoMatchSample !== false,
      }
    });

    const maps = dev.mappings || [];
    for (const m of maps) {
      if (!m.id || !m.testCatalogId) continue;
      const testEx = await prisma.testCatalog.findUnique({ where: { id: m.testCatalogId } });
      if (testEx) {
        await prisma.deviceTestMapping.upsert({
          where: { id: m.id },
          update: {
            deviceTestCode: m.deviceTestCode,
            deviceTestName: m.deviceTestName || null,
            testCatalogId: m.testCatalogId,
            unit: m.unit || null,
            multiplier: Number(m.multiplier) || 1.0,
          },
          create: {
            id: m.id,
            deviceId: dev.id,
            deviceTestCode: m.deviceTestCode,
            deviceTestName: m.deviceTestName || null,
            testCatalogId: m.testCatalogId,
            unit: m.unit || null,
            multiplier: Number(m.multiplier) || 1.0,
          }
        });
      }
    }
    devCount++;
  }
  console.log(`✅ تم ترحيل ${devCount} أجهزة طبية مع كافة خرائط التحاليل.`);

  console.log('\n========================================================');
  console.log('  🎉 اكتمل ترحيل كافة البيانات إلى SQLite (lab.db) بنجاح فائق!');
  console.log('========================================================\n');

  // Print final SQLite counts
  const finalTests = await prisma.testCatalog.count();
  const finalPanels = await prisma.testPanel.count();
  const finalPatients = await prisma.patient.count();
  const finalSamples = await prisma.sample.count();
  const finalSampleTests = await prisma.sampleTest.count();
  const finalDevices = await prisma.labDevice.count();

  console.log('📊 الإحصائيات النهائية في قاعدة بيانات lab.db:');
  console.log(`  - الفحوصات الطبية: ${finalTests}`);
  console.log(`  - الباقات المجمعة: ${finalPanels}`);
  console.log(`  - سجلات المرضى: ${finalPatients}`);
  console.log(`  - العينات الطبية: ${finalSamples}`);
  console.log(`  - الفحوصات المنفذة للعينات: ${finalSampleTests}`);
  console.log(`  - الأجهزة المربوطة: ${finalDevices}`);

  await prisma.$disconnect();
}

migrate().catch(err => {
  console.error('\n❌ فشل الترحيل:', err);
  process.exit(1);
});
