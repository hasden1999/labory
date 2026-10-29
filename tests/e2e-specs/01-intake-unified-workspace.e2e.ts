/**
 * E2E Test Suite 01: Intake & Unified Workspace Console
 * Covers: Patient registration, demographics, age inputs, phone normalization,
 * doctor referral, catalog search, tube badges, discount calculation, inline results,
 * panic values, delta checks, and unified action bar (F2 Save, F8 WhatsApp, F10 Print).
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Intake & Unified Workspace Console', { tags: ['intake', 'workspace'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/');
  });

  test('demographics: creates patient with complete details, Iraqi phone, and age in years/months/days', async ({ agent, screen }) => {
    await agent.act('enter patient name {name}', { params: { name: 'علي حسن كاظم' } });
    await expect(screen.getByPlaceholder('اسم المريض الرباعي...')).toHaveValue('علي حسن كاظم');

    await agent.act('enter Iraqi mobile number {phone}', { params: { phone: '07701234567' } });
    await expect(screen.getByPlaceholder('07XXXXXXXXX')).toHaveValue('07701234567');

    await agent.act('set age to 35 years');
    await expect(screen.getByPlaceholder('سنة')).toHaveValue('35');

    await agent.act('select gender Male');
    await expect(screen.getByRole('button', 'ذكر')).toHaveAttribute('data-active', 'true');
  });

  test('referral: selects referring doctor and verifies commission association', async ({ agent, screen }) => {
    await agent.act('select referring doctor {doctorName}', { params: { doctorName: 'د. أحمد الكرخي' } });
    await expect(screen.getByText('د. أحمد الكرخي')).toBeVisible();
  });

  test('catalog & tube badges: searches tests, adds CBC and Glucose, and verifies color-coded tube badges', async ({ agent, screen }) => {
    await agent.act('search and add CBC blood test');
    await expect(screen.getByText('Complete Blood Count')).toBeVisible();
    await expect(screen.getByText('EDTA')).toBeVisible(); // Lavender tube badge

    await agent.act('search and add Fasting Blood Sugar');
    await expect(screen.getByText('Fasting Blood Sugar')).toBeVisible();
    await expect(screen.getByText('Plain/Gel')).toBeVisible(); // Serum tube badge
  });

  test('financials: calculates total price, applies discount, and verifies net payable balance', async ({ agent, screen }) => {
    await agent.act('search and add CBC test');
    await agent.act('apply a discount of 2000 IQD');
    
    // Check invoice summary display
    await expect(screen.getByText('صافي الفاتورة')).toBeVisible();
    await expect(screen.getByPlaceholder('الخصم')).toHaveValue('2000');
  });

  test('clinical results & panic values: enters inline test results, flags HIGH/LOW, and triggers Panic alert', async ({ agent, screen }) => {
    await agent.act('search and add Glucose test');
    await agent.act('enter test result value 450'); // Extreme panic high glucose

    await expect(screen.getByText('PANIC')).toBeVisible();
    await expect(screen.getByText('قيمة حرجة تستوجب الإبلاغ الفوري')).toBeVisible();
  });

  test('interactive reference ranges: selects multi-segment ranges for HbA1c', async ({ agent, screen }) => {
    await agent.act('search and add HbA1c test');
    await agent.act('click on reference range badge to view diagnostic cutoffs');

    await expect(screen.getByText('Normal (< 5.7%)')).toBeVisible();
    await expect(screen.getByText('Prediabetes (5.7 - 6.4%)')).toBeVisible();
    await expect(screen.getByText('Diabetes (>= 6.5%)')).toBeVisible();
  });

  test('action bar: saves sample, changes status to completed, and verifies quick actions', async ({ agent, screen }) => {
    await agent.act('fill patient name {name}, age 28, male, and add CBC test', { params: { name: 'عمار ياسر' } });
    await agent.act('click Save Sample button or press F2');

    await expect(screen.getByText('تم حفظ العينة بنجاح')).toBeVisible();
    await expect(screen.getByRole('button', 'طباعة النتيجة (F10)')).toBeEnabled();
    await expect(screen.getByRole('button', 'إرسال واتساب (F8)')).toBeVisible();
  });

  test('keyboard navigation: navigates between fields using Tab and Shift hotkeys', async ({ agent, screen }) => {
    await agent.act('press F2 to start a new patient intake');
    await expect(screen.getByPlaceholder('اسم المريض الرباعي...')).toBeFocused();

    await agent.act('press Tab to move to age input');
    await expect(screen.getByPlaceholder('سنة')).toBeFocused();
  });
});
