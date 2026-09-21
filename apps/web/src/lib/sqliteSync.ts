import { prisma, initDbWAL } from './prisma';

export async function loadStoreFromSqlite(): Promise<any | null> {
  try {
    await initDbWAL();

    // Check if tests exist in SQLite
    const testsCount = await prisma.testCatalog.count();
    if (testsCount === 0) {
      return null;
    }

    const [
      dbTests,
      dbPanels,
      dbDoctors,
      dbPatients,
      dbSamples,
      dbSettings,
      dbDevices,
      dbDebtors,
      dbExpenses
    ] = await Promise.all([
      prisma.testCatalog.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      prisma.testPanel.findMany({ include: { items: true }, orderBy: { name: 'asc' } }),
      prisma.referringDoctor.findMany({ orderBy: { name: 'asc' } }),
      prisma.patient.findMany({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' } }),
      prisma.sample.findMany({
        where: { isDeleted: false },
        include: {
          tests: {
            include: { test: true }
          },
          patient: true,
          doctor: true,
        },
        orderBy: { sampleNumber: 'desc' },
      }),
      prisma.settings.findUnique({ where: { id: 'singleton' } }),
      prisma.labDevice.findMany({ include: { mappings: true } }),
      prisma.debtor.findMany({ include: { transactions: true } }),
      prisma.expense.findMany({ orderBy: { date: 'desc' } }),
    ]);

    // Format tests
    const tests = dbTests.map((t) => ({
      id: t.id,
      code: t.code || t.id.replace(/^t-/, '').toUpperCase(),
      name: t.name,
      arabicName: t.arabicName || t.name,
      category: t.category,
      price: t.price,
      cost: t.costEstimate,
      costEstimate: t.costEstimate,
      refRangeLow: t.refRangeLow,
      refRangeHigh: t.refRangeHigh,
      normalMaleLow: t.normalMaleLow,
      normalMaleHigh: t.normalMaleHigh,
      normalFemaleLow: t.normalFemaleLow,
      normalFemaleHigh: t.normalFemaleHigh,
      criticalLow: t.criticalLow,
      criticalHigh: t.criticalHigh,
      refRangeText: t.refRangeText,
      normalRange: t.refRangeText,
      unit: t.unit,
      sampleType: t.sampleType || 'Serum',
      active: t.active,
    }));

    // Format panels
    const panels = dbPanels.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      testIds: p.items.map((i) => i.testId),
    }));

    // Format doctors
    const doctors = dbDoctors.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone || '',
      clinic: d.clinic || '',
      clinicAddress: d.clinic || '',
      specialty: d.specialty || '',
      commissionPercent: d.commissionPercent,
    }));

    // Format patients
    const patients = dbPatients.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone || '',
      age: p.age,
      gender: (p.gender === 'FEMALE' || p.gender === 'أنثى') ? 'FEMALE' : 'MALE',
      address: '',
      notes: '',
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.createdAt.toISOString(),
    }));

    // Format samples
    const samples = dbSamples.map((s) => {
      const sampleTests = s.tests.map((st) => ({
        id: st.id,
        sampleId: st.sampleId,
        testId: st.testId,
        test: st.test ? {
          id: st.test.id,
          code: st.test.code,
          name: st.test.name,
          arabicName: st.test.arabicName,
          category: st.test.category,
          price: st.test.price,
          unit: st.test.unit,
          refRangeLow: st.test.refRangeLow,
          refRangeHigh: st.test.refRangeHigh,
          refRangeText: st.test.refRangeText,
        } : null,
        resultValue: st.resultValue,
        value: st.resultValue,
        notes: st.notes,
        isAbnormal: !!st.isAbnormal,
        isCritical: !!st.isCritical,
        interpretation: st.interpretation,
        priceAtTime: st.priceAtTime,
        costAtTime: st.costAtTime,
        refRangeLow: st.refRangeLow,
        refRangeHigh: st.refRangeHigh,
        refRangeText: st.refRangeText,
        normalRange: st.refRangeText,
        unit: st.unit,
        createdAt: st.createdAt.toISOString(),
      }));

      return {
        id: s.id,
        sampleNumber: s.sampleNumber,
        patientId: s.patientId,
        patient: s.patient ? {
          id: s.patient.id,
          name: s.patient.name,
          phone: s.patient.phone || '',
          age: s.patient.age,
          gender: (s.patient.gender === 'FEMALE' || s.patient.gender === 'أنثى') ? 'FEMALE' : 'MALE',
        } : null,
        doctorId: s.doctorId,
        doctor: s.doctor ? {
          id: s.doctor.id,
          name: s.doctor.name,
          phone: s.doctor.phone || '',
          specialty: s.doctor.specialty || '',
          commissionPercent: s.doctor.commissionPercent,
        } : null,
        status: s.status,
        isUrgent: s.isUrgent,
        priceTotal: s.priceTotal,
        totalPrice: s.priceTotal,
        discount: s.discount,
        discountPercent: s.discountPercent,
        paidAmount: s.paidAmount,
        remainingAmount: s.remainingAmount,
        paymentMethod: s.paymentMethod,
        notes: s.notes,
        createdById: s.createdById,
        collectionTime: s.collectionTime.toISOString(),
        createdAt: s.createdAt.toISOString(),
        tests: sampleTests,
      };
    });

    // Format settings
    const settings = dbSettings ? {
      labName: dbSettings.labName,
      labSubtitle: dbSettings.labSubtitle || '',
      doctorName: dbSettings.doctorName || '',
      doctorTitle: dbSettings.doctorTitle || '',
      labLicense: dbSettings.labLicense || '',
      phone: dbSettings.phone || '',
      whatsappNumber: dbSettings.whatsappNumber || '',
      address: dbSettings.address || '',
      currency: dbSettings.currency || 'د.ع',
      reportHeader: dbSettings.reportHeader || dbSettings.labName,
      reportFooter: dbSettings.reportFooter || '',
      reportTemplate: (dbSettings.reportTemplate as any) || 'CLASSIC',
      cbcLayoutTemplate: (dbSettings.cbcLayoutTemplate as any) || 'WITH_HISTOGRAMS',
      showPanicFlags: dbSettings.showPanicFlags,
      showClinicalComments: dbSettings.showClinicalComments,
      showReferenceRanges: dbSettings.showReferenceRanges,
      fontFamily: dbSettings.fontFamily || 'Tajawal',
      fontSize: (dbSettings.fontSize as any) || 'MEDIUM',
      installedVersion: dbSettings.installedVersion || 'v1.0.9',
      isConfigured: !!(dbSettings.labName && dbSettings.labName.trim().length > 0),
    } : null;

    // Format devices
    const devices = dbDevices.map((d) => ({
      id: d.id,
      name: d.name,
      brand: d.brand,
      model: d.model,
      category: d.category as any,
      connectionType: d.connectionType as any,
      protocol: d.protocol as any,
      ipAddress: d.ipAddress,
      port: d.port,
      comPort: d.comPort,
      baudRate: d.baudRate,
      apiKey: d.apiKey,
      status: d.status as any,
      autoMatchSample: d.autoMatchSample,
      mappings: d.mappings.map((m) => ({
        id: m.id,
        deviceId: m.deviceId,
        deviceTestCode: m.deviceTestCode,
        deviceTestName: m.deviceTestName || '',
        testCatalogId: m.testCatalogId,
        unit: m.unit || '',
        multiplier: m.multiplier,
        createdAt: m.createdAt.toISOString(),
      })),
    }));

    console.log('⚡ [SQLite Store] Successfully loaded and cached state from lab.db');
    console.log(`   Patients: ${patients.length}, Samples: ${samples.length}, Tests: ${tests.length}, Panels: ${panels.length}`);

    return {
      tests,
      panels,
      doctors,
      patients,
      samples,
      settings,
      devices,
      debtors: dbDebtors,
      expenses: dbExpenses,
    };
  } catch (err: any) {
    console.error('[SQLite Store] Failed to load store from SQLite:', err?.message);
    return null;
  }
}

// -------------------------------------------------------------
// Asynchronous Write Synchronization to SQLite lab.db
// -------------------------------------------------------------

export async function syncPatientToSqlite(pat: any): Promise<void> {
  if (!pat || !pat.id) return;
  try {
    await initDbWAL();
    const gender = (pat.gender === 'FEMALE' || pat.gender === 'أنثى') ? 'أنثى' : 'ذكر';
    await prisma.patient.upsert({
      where: { id: pat.id },
      update: {
        name: pat.name,
        phone: pat.phone || null,
        age: pat.age != null ? Number(pat.age) : null,
        gender,
        isDeleted: false,
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
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to sync patient:', e?.message);
  }
}

export async function syncDoctorToSqlite(doc: any): Promise<void> {
  if (!doc || !doc.id) return;
  try {
    await initDbWAL();
    await prisma.referringDoctor.upsert({
      where: { id: doc.id },
      update: {
        name: doc.name,
        phone: doc.phone || null,
        clinic: doc.clinic || doc.clinicAddress || null,
        specialty: doc.specialty || null,
        commissionPercent: Number(doc.commissionPercent) || 0,
      },
      create: {
        id: doc.id,
        name: doc.name,
        phone: doc.phone || null,
        clinic: doc.clinic || doc.clinicAddress || null,
        specialty: doc.specialty || null,
        commissionPercent: Number(doc.commissionPercent) || 0,
      }
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to sync doctor:', e?.message);
  }
}

export async function syncSampleToSqlite(smp: any): Promise<void> {
  if (!smp || !smp.id) return;
  try {
    await initDbWAL();
    const sampleNum = Number(smp.sampleNumber || smp.sampleNum || 0);

    // Guarantee patient exists in SQLite first
    let patientId = smp.patientId || smp.patient?.id;
    if (patientId) {
      const pRecord = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!pRecord && smp.patient) {
        await syncPatientToSqlite(smp.patient);
      }
    }

    // Upsert sample by sampleNumber
    const existing = await prisma.sample.findUnique({ where: { sampleNumber: sampleNum } });
    let sampleRecord;

    if (existing) {
      sampleRecord = await prisma.sample.update({
        where: { sampleNumber: sampleNum },
        data: {
          patientId: patientId || existing.patientId,
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
          patientId: patientId || 'pat-unknown',
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

    // Sync tests
    if (Array.isArray(smp.tests)) {
      for (const t of smp.tests) {
        const testId = t.testId || t.id;
        if (!testId) continue;

        // Ensure testCatalog exists
        const testCat = await prisma.testCatalog.findUnique({ where: { id: testId } });
        if (!testCat) {
          await prisma.testCatalog.create({
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
            unit: t.unit || null,
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
            unit: t.unit || null,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          }
        });
      }
    }
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to sync sample:', e?.message);
  }
}

export async function syncSettingsToSqlite(s: any): Promise<void> {
  if (!s) return;
  try {
    await initDbWAL();
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        labName: s.labName || '',
        labSubtitle: s.labSubtitle || '',
        doctorName: s.doctorName || '',
        doctorTitle: s.doctorTitle || '',
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
        fontFamily: s.fontFamily || 'Tajawal',
        fontSize: s.fontSize || 'MEDIUM',
        installedVersion: s.installedVersion || 'v1.0.9',
      },
      create: {
        id: 'singleton',
        labName: s.labName || '',
        labSubtitle: s.labSubtitle || '',
        doctorName: s.doctorName || '',
        doctorTitle: s.doctorTitle || '',
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
        fontFamily: s.fontFamily || 'Tajawal',
        fontSize: s.fontSize || 'MEDIUM',
        installedVersion: s.installedVersion || 'v1.0.9',
      }
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to sync settings:', e?.message);
  }
}

export async function deletePatientFromSqlite(id: string): Promise<void> {
  if (!id) return;
  try {
    await initDbWAL();
    await prisma.patient.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to soft-delete patient:', e?.message);
  }
}

export async function deleteDoctorFromSqlite(id: string): Promise<void> {
  if (!id) return;
  try {
    await initDbWAL();
    await prisma.referringDoctor.delete({
      where: { id },
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to delete doctor:', e?.message);
  }
}

export async function deleteSampleFromSqlite(id: string): Promise<void> {
  if (!id) return;
  try {
    await initDbWAL();
    await prisma.sample.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to soft-delete sample:', e?.message);
  }
}

export async function syncExpenseToSqlite(exp: any): Promise<void> {
  if (!exp || !exp.id) return;
  try {
    await initDbWAL();
    await prisma.expense.upsert({
      where: { id: exp.id },
      update: {
        description: exp.description || '',
        amount: Number(exp.amount) || 0,
        category: exp.category || 'مصاريف تشغيلية',
        paymentMethod: exp.paymentMethod || 'نقداً',
        date: exp.date ? new Date(exp.date) : new Date(),
      },
      create: {
        id: exp.id,
        description: exp.description || '',
        amount: Number(exp.amount) || 0,
        category: exp.category || 'مصاريف تشغيلية',
        paymentMethod: exp.paymentMethod || 'نقداً',
        date: exp.date ? new Date(exp.date) : new Date(),
      },
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to sync expense:', e?.message);
  }
}

export async function deleteExpenseFromSqlite(id: string): Promise<void> {
  if (!id) return;
  try {
    await initDbWAL();
    await prisma.expense.delete({
      where: { id },
    });
  } catch (e: any) {
    console.error('[SQLite Sync] Failed to delete expense:', e?.message);
  }
}

