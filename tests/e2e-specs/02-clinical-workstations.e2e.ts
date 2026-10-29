/**
 * E2E Test Suite 02: Clinical Workstations & Specialized Diagnostic Modals
 * Covers: CBC workstation & red cell indices, Chemistry workstation & Friedewald lipid/eGFR formulas,
 * General Urine Examination (GUE), General Stool Examination (GSE), Microbiology (Culture & Sensitivity),
 * Semen Analysis (SFA), Digital Beta-hCG (BhcgFormModal), and Anti-Mullerian Hormone (AmhFormModal).
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Clinical Workstations & Diagnostic Modals', { tags: ['clinical', 'workstations'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/patients');
  });

  test('CBC Workstation: calculates red cell indices (MCV, MCH, MCHC) and validates differential sum', async ({ agent, screen }) => {
    await agent.act('open CBC workstation for sample #1');
    await expect(screen.getByText('Complete Blood Count Workstation')).toBeVisible();

    await agent.act('enter RBC count 5.0 and Hematocrit 45%');
    // MCV = (Hct * 10) / RBC = (45 * 10) / 5 = 90.0 fL
    await expect(screen.getByPlaceholder('MCV')).toHaveValue('90.0');

    await agent.act('enter Hemoglobin 15.0 g/dL');
    // MCH = (Hb * 10) / RBC = (15 * 10) / 5 = 30.0 pg
    await expect(screen.getByPlaceholder('MCH')).toHaveValue('30.0');
    // MCHC = (Hb / Hct) * 100 = (15 / 45) * 100 = 33.3 g/dL
    await expect(screen.getByPlaceholder('MCHC')).toHaveValue('33.3');

    await agent.act('enter differential: Neutrophils 60, Lymphocytes 30, Monocytes 5, Eosinophils 4, Basophils 1');
    await expect(screen.getByText('مجموع التفريق: 100%')).toBeVisible();

    await agent.act('save CBC workstation results');
    await expect(screen.getByText('تم حفظ نتائج فحص الدم بنجاح')).toBeVisible();
  });

  test('Chemistry Workstation: executes Friedewald equation for Lipid Profile and calculates eGFR', async ({ agent, screen }) => {
    await agent.act('open Chemistry workstation for sample #1');
    await expect(screen.getByText('Clinical Chemistry Workstation')).toBeVisible();

    // Lipid profile: TC = 220, TG = 150, HDL = 40
    await agent.act('enter Total Cholesterol 220, Triglycerides 150, and HDL 40');
    // VLDL = TG / 5 = 150 / 5 = 30
    await expect(screen.getByPlaceholder('VLDL')).toHaveValue('30');
    // LDL = TC - HDL - (TG / 5) = 220 - 40 - 30 = 150
    await expect(screen.getByPlaceholder('LDL')).toHaveValue('150');
    // Non-HDL = TC - HDL = 220 - 40 = 180
    await expect(screen.getByPlaceholder('Non-HDL')).toHaveValue('180');

    // Renal profile: Serum Creatinine 1.2 mg/dL for 50yo male -> eGFR calculation
    await agent.act('enter Serum Creatinine 1.2 mg/dL');
    await expect(screen.getByText(/eGFR/)).toBeVisible();

    await agent.act('save chemistry workstation results');
    await expect(screen.getByText('تم حفظ نتائج الكيمياء بنجاح')).toBeVisible();
  });

  test('GUE Workstation: fills physical, chemical, and microscopic examination fields', async ({ agent, screen }) => {
    await agent.act('open General Urine Examination (GUE) modal for sample #1');
    await expect(screen.getByText('فحص الإدرار العام (G.U.E)')).toBeVisible();

    await agent.act('select Color: Yellow, Appearance: Clear, pH: 6.0, Albumin: Nil, Sugar: Nil');
    await agent.act('enter Pus Cells: 2-4 /HPF, RBCs: 0-1 /HPF, Epithelial Cells: Few');
    await agent.act('select Crystals: Calcium Oxalate (+)');

    await agent.act('save GUE results');
    await expect(screen.getByText('تم حفظ فحص الإدرار بنجاح')).toBeVisible();
  });

  test('GSE Workstation: records stool consistency, color, microscopic pus/RBC, and parasites', async ({ agent, screen }) => {
    await agent.act('open General Stool Examination (G.S.E) modal for sample #1');
    await expect(screen.getByText('فحص البراز العام (G.S.E)')).toBeVisible();

    await agent.act('select Consistency: Semisolid, Color: Brown, Mucus: Nil');
    await agent.act('enter Pus Cells: 4-6 /HPF, RBCs: 1-2 /HPF');
    await agent.act('select Parasites: Entamoeba histolytica Cyst (+)');

    await agent.act('save GSE results');
    await expect(screen.getByText('تم حفظ فحص البراز بنجاح')).toBeVisible();
  });

  test('Microbiology Workstation: selects isolated organism, colony count, and antibiotic disc susceptibility', async ({ agent, screen }) => {
    await agent.act('open Microbiology Culture & Sensitivity modal for sample #1');
    await expect(screen.getByText('زرع وحساسية البكتيريا (Culture & Sensitivity)')).toBeVisible();

    await agent.act('select Specimen: Urine, Organism: Escherichia coli, Colony Count: > 100,000 CFU/mL');
    await agent.act('add antibiotic Ciprofloxacin with zone 25mm and mark Sensitive');
    await agent.act('add antibiotic Amoxicillin with zone 10mm and mark Resistant');

    await expect(screen.getByText('Ciprofloxacin')).toBeVisible();
    await expect(screen.getByText('Sensitive')).toBeVisible();
    await expect(screen.getByText('Resistant')).toBeVisible();

    await agent.act('save microbiology culture report');
    await expect(screen.getByText('تم حفظ تقرير الزرع والحساسية')).toBeVisible();
  });

  test('Semen Analysis Workstation: records physical properties, motility grading, and morphology', async ({ agent, screen }) => {
    await agent.act('open Semen Analysis modal for sample #1');
    await expect(screen.getByText('تحليل السائل المنوي (Semen Analysis)')).toBeVisible();

    await agent.act('enter Volume 3.5 mL, Liquefaction time 25 mins, Sperm count 65 M/mL');
    await agent.act('enter Motility: Grade A (Rapid) 40%, Grade B (Slow) 25%, Grade C (Non-prog) 15%, Grade D (Immotile) 20%');
    await expect(screen.getByText('Total Motility: 80%')).toBeVisible();

    await agent.act('enter Normal Forms 70%, Abnormal Forms 30%');
    await agent.act('save semen analysis report');
    await expect(screen.getByText('تم حفظ تحليل السائل المنوي')).toBeVisible();
  });

  test('Digital Beta-hCG Workstation: inputs quantitative beta-hCG and matches with gestational weeks', async ({ agent, screen }) => {
    await agent.act('open Digital Beta-hCG workstation modal for sample #1');
    await expect(screen.getByText(/فحص الحمل الرقمي/)).toBeVisible();

    await agent.act('enter quantitative Beta-hCG value 15200 mIU/mL');
    // Matched gestational age table: 6th week (4,000 - 100,200)
    await expect(screen.getByText(/الأسبوع السادس/)).toBeVisible();

    await agent.act('save Beta-hCG report');
    await expect(screen.getByText('تم حفظ فحص الحمل الرقمي بنجاح')).toBeVisible();
  });

  test('AMH Workstation: enters Anti-Mullerian Hormone value and displays age-stratified fertility reserve', async ({ agent, screen }) => {
    await agent.act('open AMH workstation modal for sample #1');
    await expect(screen.getByText(/Anti-Müllerian Hormone/)).toBeVisible();

    await agent.act('enter AMH value 2.8 ng/mL');
    await expect(screen.getByText('Normal Ovarian Reserve (المخزون الطبيعي)')).toBeVisible();

    await agent.act('save AMH report');
    await expect(screen.getByText('تم حفظ فحص مخزون المبيض')).toBeVisible();
  });
});
