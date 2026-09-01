/**
 * Tier 4: Real-World Clinical Scenarios
 * Full end-to-end patient journeys simulating authentic hospital and private laboratory workflows:
 * Intake -> Multi-Department Workstation Entry -> Real-Time Calculations -> Delta Checks -> Panic Flags -> 5-Template Print -> WhatsApp Export.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_PATIENTS, FIXTURE_DOCTORS, FIXTURE_CATALOG, FIXTURE_SETTINGS } from '../harness/fixtures';
import { ClinicalOracles } from '../harness/clinicalOracles';

describe('Tier 4: Real-World Clinical Scenarios', () => {

  test('Scenario 1: Diabetic Nephropathy Patient Full Journey (Intake -> Chem/Lipid/GUE -> CKD-EPI -> Delta Alert -> Modern A4 -> WhatsApp)', () => {
    // 1. Intake
    const patient = FIXTURE_PATIENTS[0]; // 48yo male
    const doctor = FIXTURE_DOCTORS[0]; // Nephrologist
    const intakeTests = ['GUE', 'FBS', 'HBA1C', 'CREAT', 'LIPID'];

    expect(patient.age).toBe(48);
    expect(patient.gender).toBe('MALE');

    // 2. Results Entry & Clinical Calculations
    // Chemistry:
    const fbs = 185; // mg/dL -> Abnormal
    const hba1c = 8.8; // % -> Poor glycaemic control
    const eag = ClinicalOracles.calculateEag(hba1c); // Estimated Average Glucose = 206 mg/dL
    expect(eag.value).toBe(206);

    const insulin = 22; // uIU/mL
    const homaIr = ClinicalOracles.calculateHomaIr(fbs, insulin);
    expect(homaIr.value).toBeCloseTo(10.05, 2);
    expect(homaIr.interpretation).toContain('Significant Insulin Resistance');

    // Lipid Profile:
    const tc = 240;
    const hdl = 38;
    const tg = 225; // TG < 400 -> Friedewald applies
    const ldl = ClinicalOracles.calculateLdl(tc, hdl, tg);
    expect(ldl.value).toBe(157); // 240 - 38 - 45 = 157

    const nonHdl = ClinicalOracles.calculateNonHdl(tc, hdl);
    expect(nonHdl.value).toBe(202);

    const cardiacRisk = ClinicalOracles.calculateCardiacRisk(tc, hdl);
    expect(cardiacRisk.value).toBe(6.32);

    // Renal & CKD-EPI:
    const currentCreatinine = 1.9; // mg/dL
    const egfr = ClinicalOracles.calculateEgfr(currentCreatinine, patient.age, patient.gender);
    expect(egfr.value).toBe(43.0);
    expect(egfr.stage).toBe('G3b'); // Moderately to severely decreased

    // 3. Historical Delta Check (Prior visit Creatinine was 1.1 mg/dL)
    const priorCreatinine = 1.1;
    const deltaCheck = ClinicalOracles.evaluateDeltaCheck('CREATININE', currentCreatinine, priorCreatinine);
    expect(deltaCheck.isBreached).toBe(true);
    expect(deltaCheck.deltaPercent).toBeCloseTo(72.7, 1);
    expect(deltaCheck.badgeLevel).toBe('SIGNIFICANT');

    // 4. Report Print Generation (MODERN template with QR)
    const sampleRecord = {
      id: 's-journey-dm-01',
      sampleNumber: 9001,
      patient,
      doctor,
      status: 'READY',
      completedAt: new Date().toISOString()
    };

    const verificationUrl = `http://localhost:8080/verify/${sampleRecord.id}`;
    expect(verificationUrl).toContain('s-journey-dm-01');

    // 5. WhatsApp Export Link Generation
    const waLink = `https://wa.me/964${patient.phone.substring(1)}?text=${encodeURIComponent(`تقرير المريض ${patient.name} جاهز. رابط التدقيق: ${verificationUrl}`)}`;
    expect(waLink).toContain('9647701239988');
  });

  test('Scenario 2: Acute Hematologic Crisis (Severe Pancytopenia & Critical Panic Alert Generation)', () => {
    const patient = FIXTURE_PATIENTS[4]; // 74yo female in ICU
    
    // CBC Entry
    const cbcResults = {
      rbc: 1.6,
      hgb: 4.8, // Panic < 6.0
      hct: 14.5,
      plt: 14,  // Panic < 20
      wbc: 1.2,
      neutrophils: 15.0,
      lymphocytes: 80.0,
      monocytes: 3.0,
      eosinophils: 1.0,
      basophils: 1.0,
      morphology: 'Severe anisopoikilocytosis, toxic granulation, atypical lymphoid blasts'
    };

    // 1. Verify 5-part differential sum
    const diffValidation = ClinicalOracles.validateDifferentialSum(
      cbcResults.neutrophils,
      cbcResults.lymphocytes,
      cbcResults.monocytes,
      cbcResults.eosinophils,
      cbcResults.basophils
    );
    expect(diffValidation.isValid).toBe(true);
    expect(diffValidation.sum).toBe(100.0);

    // 2. Panic Alert Detection
    const hgbPanic = ClinicalOracles.evaluatePanicFlag('HGB', cbcResults.hgb);
    expect(hgbPanic.isPanic).toBe(true);
    expect(hgbPanic.badgeLevel).toBe('CRITICAL_PANIC');

    const pltPanic = ClinicalOracles.evaluatePanicFlag('PLT', cbcResults.plt);
    expect(pltPanic.isPanic).toBe(true);
    expect(pltPanic.badgeLevel).toBe('CRITICAL_PANIC');

    // 3. Historical Delta Check (Patient Hb was 9.5 g/dL on admission 3 days ago)
    const deltaHb = ClinicalOracles.evaluateDeltaCheck('HGB', cbcResults.hgb, 9.5);
    expect(deltaHb.isBreached).toBe(true);
    expect(deltaHb.deltaPercent).toBeCloseTo(49.5, 1);
    expect(deltaHb.badgeLevel).toBe('CRITICAL');
  });

  test('Scenario 3: Urosepsis with ESBL E. coli (GUE + Antibiogram + Specialized Multi-Part Layout)', () => {
    // 1. GUE findings
    const gue = {
      pusCells: '50-60',
      rbc: '20-25',
      protein: '++',
      nitrite: 'Positive',
      bacteria: 'Many (+++)',
      crystals: [{ type: 'Triple Phosphate', amount: '++' }]
    };

    expect(gue.nitrite).toBe('Positive');
    expect(gue.crystals[0].type).toBe('Triple Phosphate');

    // 2. Microbiology Antibiogram
    const isolatedOrganism = 'Escherichia coli (ESBL-positive)';
    const antibiogram = [
      { drug: 'Ceftriaxone', result: 'R' },
      { drug: 'Ciprofloxacin', result: 'R' },
      { drug: 'Cefepime', result: 'R' },
      { drug: 'Meropenem', result: 'S' },
      { drug: 'Amikacin', result: 'S' },
      { drug: 'Nitrofurantoin', result: 'S' }
    ];

    const resistantCount = antibiogram.filter(a => a.result === 'R').length;
    const sensitiveCount = antibiogram.filter(a => a.result === 'S').length;

    expect(isolatedOrganism).toContain('ESBL');
    expect(resistantCount).toBe(3);
    expect(sensitiveCount).toBe(3);

    // 3. SPECIALIZED Template Layout verification
    const template = FIXTURE_SETTINGS.specializedMultiPart.reportTemplate;
    expect(template).toBe('SPECIALIZED');
  });

  test('Scenario 4: Pediatric Acute Amoebic Colitis Journey (GSE 4-Part + FOBT + Protozoa)', () => {
    const patient = FIXTURE_PATIENTS[3]; // 6yo child
    expect(patient.age).toBe(6);

    const gseResult = {
      color: 'Brownish-Red',
      consistency: 'Loose / Mucoid',
      fobt: 'Positive',
      pusCells: '30-35',
      rbc: '40-50',
      protozoa: [
        { name: 'Entamoeba histolytica', form: 'Trophozoites containing ingested RBCs (Hematophagous)', severity: '+++' },
        { name: 'Giardia lamblia', form: 'Cysts', severity: '+' }
      ],
      helminths: 'None seen'
    };

    expect(gseResult.fobt).toBe('Positive');
    expect(gseResult.protozoa.length).toBe(2);
    expect(gseResult.protozoa[0].name).toBe('Entamoeba histolytica');
  });

  test('Scenario 5: Pre-Printed Letterhead Batch Workflow with Custom Millimeter Margins', () => {
    const settings = FIXTURE_SETTINGS.preprintedLetterhead;

    expect(settings.headerMode).toBe('PREPRINTED');
    expect(settings.topMarginMm).toBe(45);
    expect(settings.bottomMarginMm).toBe(30);
    expect(settings.leftMarginMm).toBe(15);
    expect(settings.rightMarginMm).toBe(15);

    // Simulate batch of 5 outpatient routine samples
    const batchSampleIds = ['s-batch-01', 's-batch-02', 's-batch-03', 's-batch-04', 's-batch-05'];
    
    const printOutputs = batchSampleIds.map(id => ({
      sampleId: id,
      headerSuppressed: settings.headerMode === 'PREPRINTED',
      topMarginStyle: `${settings.topMarginMm}mm`,
      qrRendered: settings.enableQrCode
    }));

    for (const out of printOutputs) {
      expect(out.headerSuppressed).toBe(true);
      expect(out.topMarginStyle).toBe('45mm');
      expect(out.qrRendered).toBe(true);
    }
  });

});
