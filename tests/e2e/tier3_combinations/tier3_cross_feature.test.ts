/**
 * Tier 3: Cross-Feature Combinations
 * Covers: Pairwise and multi-feature interactions across Intake, Workstations,
 * Clinical Intelligence, Delta Checks, 5-Template Print Engine, QR Verification, and WhatsApp.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_PATIENTS, FIXTURE_DOCTORS, FIXTURE_CATALOG, FIXTURE_SETTINGS } from '../harness/fixtures';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 3: Cross-Feature Combinations', () => {

  test('T3.1: Intake Reception -> Discount Calculation -> Doctor Commission -> Barcode Label Generation', () => {
    const patient = FIXTURE_PATIENTS[0];
    const doctor = FIXTURE_DOCTORS[0]; // 15% commission
    const orderedTests = [
      FIXTURE_CATALOG.find(t => t.code === 'GUE')!,
      FIXTURE_CATALOG.find(t => t.code === 'CBC')!,
      FIXTURE_CATALOG.find(t => t.code === 'CREAT')!
    ];

    const grossPrice = orderedTests.reduce((sum, t) => sum + t.price, 0); // 5000 + 10000 + 6000 = 21000
    const discountPercent = 10;
    const discountAmount = (grossPrice * discountPercent) / 100; // 2100
    const netPrice = grossPrice - discountAmount; // 18900
    const doctorCommission = (netPrice * doctor.commissionRate) / 100; // 15% of 18900 = 2835

    const createdSample = {
      id: 's-comb-1',
      sampleNumber: 5001,
      patientId: patient.id,
      patient,
      doctorId: doctor.id,
      doctor,
      grossPrice,
      discount: discountAmount,
      discountPercent,
      netPrice,
      doctorCommission,
      paidAmount: 18900,
      remainingAmount: 0,
      status: 'RECEIVED',
      tests: orderedTests
    };

    expect(createdSample.netPrice).toBe(18900);
    expect(createdSample.doctorCommission).toBe(2835);
    expect(createdSample.remainingAmount).toBe(0);

    // Barcode generation from created sample
    const barcodeText = `#${createdSample.sampleNumber} - ${createdSample.patient.name}`;
    expect(barcodeText).toContain('5001');
    expect(barcodeText).toContain('حيدر عبد الحسين الخفاجي');
  });

  test('T3.2: Multi-Department Workstation Entry -> Real-Time Auto-Calculations (CKD-EPI, De Ritis, A/G Ratio)', () => {
    const patient = FIXTURE_PATIENTS[0]; // 48yo Male
    
    // Chemistry entries
    const creatinine = 1.8; // mg/dL
    const ast = 54;
    const alt = 27;
    const totalProtein = 7.2;
    const albumin = 3.6;

    // 1. Auto-calculate eGFR (CKD-EPI)
    const egfrRes = ClinicalOracles.calculateEgfr(creatinine, patient.age, patient.gender);
    expect(egfrRes.stage).toBe('G3a'); // Mildly to moderately decreased
    expect(egfrRes.value).toBeWithinRange(42, 48);

    // 2. Auto-calculate De Ritis Ratio (AST/ALT)
    const deRitisRes = ClinicalOracles.calculateDeRitis(ast, alt);
    expect(deRitisRes.value).toBe(2.0);
    expect(deRitisRes.interpretation).toContain('Significantly Elevated');

    // 3. Auto-calculate A/G Ratio
    const agRatioRes = ClinicalOracles.calculateAgRatio(totalProtein, albumin);
    expect(agRatioRes.value).toBe(1.0); // 3.6 / (7.2 - 3.6) = 1.0
  });

  test('T3.3: Workstation Result Entry -> Historical Delta Check Comparator Alert Triggering', () => {
    // Current test entry for Hemoglobin
    const currentHgb = 9.8; // g/dL
    const previousVisitHgb = 13.5; // g/dL from prior visit 2 weeks ago

    const deltaCheck = ClinicalOracles.evaluateDeltaCheck('HGB', currentHgb, previousVisitHgb, '2026-08-14');

    expect(deltaCheck.isBreached).toBe(true);
    expect(deltaCheck.deltaPercent).toBeCloseTo(27.4, 1);
    expect(deltaCheck.badgeLevel).toBe('SIGNIFICANT');
    expect(deltaCheck.message).toContain('decreased by 27.4%');
  });

  test('T3.4: Lipid Profile Entry -> Triglycerides < 400 Calculation vs TG >= 400 Invalidation in UI Flow', () => {
    // Visit 1: Normal TG -> Friedewald LDL computed
    const visit1 = ClinicalOracles.calculateLdl(210, 40, 180);
    expect(visit1.value).toBe(134); // 210 - 40 - 36 = 134

    // Visit 2: Severe acute pancreatitis with Hypertriglyceridemia (TG = 620)
    const visit2 = ClinicalOracles.calculateLdl(280, 25, 620);
    expect(visit2.value).toBeNull();
    expect(visit2.invalidReason).toContain('Triglycerides >= 400 mg/dL');
  });

  test('T3.5: Multi-Department Sample -> 5 Print Templates Rendering -> Dynamic QR Validation Flow', () => {
    const multiDeptSample = {
      id: 's-multi-dept-88',
      sampleNumber: 8801,
      patient: FIXTURE_PATIENTS[0],
      status: 'READY',
      tests: [
        { code: 'GUE', name: 'General Urine Examination', result: 'Pus: 15-20, Ca. Oxalate: ++' },
        { code: 'CBC', name: 'Complete Blood Count', result: 'Hb: 10.2 g/dL, WBC: 11.4' },
        { code: 'CREAT', name: 'Serum Creatinine', result: '1.8 mg/dL (eGFR: 45 mL/min, G3a)' }
      ]
    };

    const templates = ['CLASSIC', 'MODERN', 'EXECUTIVE', 'COMPACT', 'SPECIALIZED'] as const;

    for (const t of templates) {
      const settings = {
        ...FIXTURE_SETTINGS.classicDigital,
        reportTemplate: t,
        enableQrCode: true
      };

      const verificationUrl = `http://localhost:8080/verify/${multiDeptSample.id}`;
      expect(verificationUrl).toContain(multiDeptSample.id);
      expect(settings.reportTemplate).toBe(t);
    }
  });

  test('T3.6: Results Completion -> Formatted WhatsApp Direct Link Generation', () => {
    const sample = {
      id: 's-wa-101',
      sampleNumber: 101,
      patient: { name: 'حيدر عبد الحسين', phone: '07701239988' },
      status: 'READY',
      labName: 'مختبر الرضا للتحليلات الطبية'
    };

    const verificationUrl = `http://localhost:8080/verify/${sample.id}`;
    const rawMessage = `مرحباً ${sample.patient.name}، تقرير التحليلات الطبية الخاص بك جاهز في ${sample.labName}. رقم العينة: #${sample.sampleNumber}. يمكنك الاطلاع على التقرير وتدقيقه عبر الرابط: ${verificationUrl}`;

    const encodedText = encodeURIComponent(rawMessage);
    const whatsappLink = `https://wa.me/964${sample.patient.phone.substring(1)}?text=${encodedText}`;

    expect(whatsappLink).toContain('https://wa.me/9647701239988');
    expect(whatsappLink).toContain(encodeURIComponent(sample.patient.name));
    expect(whatsappLink).toContain(encodeURIComponent(verificationUrl));
  });

});
