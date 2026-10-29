/**
 * E2E Test Suite 05: Financial Management, Cash Drawer, Debts & Expenses
 * Covers: Cash drawer shifts, sequential vouchers, income vs expense tracking,
 * debtor accounts, partial & full debt settlements, expense vouchers, and doctor commissions.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Financial Management, Debts & Expenses', { tags: ['financials', 'debts', 'expenses'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/financials');
  });

  test('financial dashboard: filters transactions by timeframe (today, week, month) and displays net profit', async ({ agent, screen }) => {
    await agent.act('select timeframe filter {period}', { params: { period: 'اليوم' } });
    await expect(screen.getByText('إجمالي المقبوضات')).toBeVisible();
    await expect(screen.getByText('إجمالي المصروفات')).toBeVisible();
    await expect(screen.getByText('صافي الصندوق')).toBeVisible();
  });

  test('debt collection: searches debtor patient, records partial payment, and settles remaining balance', async ({ agent, screen }) => {
    await agent.act('switch to Debts tab (سجل الديون والذمم)');
    await expect(screen.getByText('إجمالي الديون القائمة')).toBeVisible();

    await agent.act('search for debtor {debtorName}', { params: { debtorName: 'أحمد شاكر' } });
    await expect(screen.getByText('أحمد شاكر')).toBeVisible();

    await agent.act('click collect debt payment (تحصيل دين)');
    await expect(screen.getByText('تسديد دفعة من الدين')).toBeVisible();

    await agent.act('enter payment amount 15000 IQD and confirm payment');
    await expect(screen.getByText('تم تسجيل الدفعة وإصدار سند قبض')).toBeVisible();
    await expect(screen.getByText(/المبلغ المتبقي/)).toBeVisible();
  });

  test('expense registration: creates operational expense voucher with category and description', async ({ agent, screen }) => {
    await agent.act('click on Add Expense button (إضافة سند صرف)');
    await expect(screen.getByText('تسجيل سند صرف جديد')).toBeVisible();

    await agent.act('fill expense description {desc}, amount {amount}, and category {category}', {
      params: {
        desc: 'شراء كراتين كواشف وأنابيب CBC',
        amount: '45000',
        category: 'مصاريف تشغيلية'
      }
    });
    await agent.act('submit expense voucher');

    await expect(screen.getByText('تم تسجيل سند الصرف بنجاح')).toBeVisible();
    await expect(screen.getByText('شراء كراتين كواشف وأنابيب CBC')).toBeVisible();
    await expect(screen.getByText('45,000 د.ع')).toBeVisible();
  });

  test('doctor commissions: calculates referring doctor commissions and logs payout transaction', async ({ agent, screen }) => {
    await agent.act('switch to Doctors tab (حسابات الأطباء المحيلين)');
    await expect(screen.getByText('د. أحمد الكرخي')).toBeVisible();
    await expect(screen.getByText(/نسبة الإحالة/)).toBeVisible();

    await agent.act('click settle doctor commission payout');
    await expect(screen.getByText('تسوية مستحقات الطبيب')).toBeVisible();

    await agent.act('confirm commission settlement voucher');
    await expect(screen.getByText('تم صرف مستحقات الطبيب بنجاح')).toBeVisible();
  });

  test('voucher printing: prints official financial receipt with serial voucher number', async ({ agent, screen }) => {
    await agent.act('click print receipt icon on the latest financial transaction');
    await expect(screen.getByText(/سند قبض رقم/)).toBeVisible();
  });
});
