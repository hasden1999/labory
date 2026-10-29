/**
 * E2E Test Suite 06: Lab Analyzers (ASTM/HL7) & Reagent Inventory
 * Covers: Laboratory analyzer presets, ASTM E1381 / HL7 daemon integration,
 * test code mappings, result ingestion, reagent items, low-stock alerts, and expiry warnings.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Lab Analyzers & Inventory Management', { tags: ['devices', 'inventory'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/devices');
  });

  test('devices management: registers analyzer preset, configures ASTM/HL7 protocol and TCP port 5000', async ({ agent, screen }) => {
    await agent.act('click on Add Lab Analyzer button');
    await expect(screen.getByText('إضافة جهاز تحليل طبي جديد')).toBeVisible();

    await agent.act('select analyzer preset Mindray BC-5000 (Hematology)');
    await expect(screen.getByPlaceholder('بروتوكول الاتصال')).toHaveValue('HL7');
    await expect(screen.getByPlaceholder('منفذ الاتصال')).toHaveValue('5000');

    await agent.act('save analyzer registration');
    await expect(screen.getByText('تمت إضافة الجهاز بنجاح')).toBeVisible();
    await expect(screen.getByText('Mindray BC-5000')).toBeVisible();
    await expect(screen.getByText('متصل بالشبكة (Online)')).toBeVisible();
  });

  test('test code mapping: maps analyzer internal test code to Labryo catalog test', async ({ agent, screen }) => {
    await agent.act('click configure test mappings for Mindray BC-5000');
    await expect(screen.getByText('مطابقة أكواد الفحوصات الطبية')).toBeVisible();

    await agent.act('map device code {devCode} to catalog test {catTest}', {
      params: { devCode: 'WBC_VAL', catTest: 'CBC - Total WBC' }
    });
    await agent.act('save mappings');

    await expect(screen.getByText('تم حفظ مطابقة الأكواد')).toBeVisible();
  });

  test('result ingestion simulation: simulates incoming analyzer ASTM packet and verifies automatic ingestion', async ({ agent, screen }) => {
    await agent.act('click simulate test data transmission button');
    await expect(screen.getByText('محاكاة استقبال نتائج العينة من الجهاز...')).toBeVisible();

    await expect(screen.getByText('تم استقبال نتائج العينة #104 بنجاح وترحيلها')).toBeVisible();
  });

  test('inventory registration: adds reagent kit with quantity, reorder threshold, and expiry date', async ({ agent, screen }) => {
    await agent.act('switch to Inventory tab (مستودع الكواشف والمستلزمات)');
    await expect(screen.getByText('إجمالي المواد والمستلزمات')).toBeVisible();

    await agent.act('click on Add Inventory Item button');
    await expect(screen.getByText('إضافة مادة أو كاشف جديد')).toBeVisible();

    await agent.act('fill item name {name}, category {cat}, quantity {qty}, threshold {thresh}, and cost {cost}', {
      params: {
        name: 'Mindray Diluent BC-5000 20L',
        cat: 'REAGENT',
        qty: '4',
        thresh: '2',
        cost: '65000'
      }
    });
    await agent.act('set expiry date to 2027-12-31');
    await agent.act('submit inventory item');

    await expect(screen.getByText('تمت إضافة المادة إلى المستودع')).toBeVisible();
    await expect(screen.getByText('Mindray Diluent BC-5000 20L')).toBeVisible();
  });

  test('inventory alerts: flags low-stock items and highlights expired/expiring reagents', async ({ agent, screen }) => {
    await agent.act('filter inventory by Low Stock (تنبيهات النفاذ)');
    await expect(screen.getByText(/المتبقي أقل من حد إعادة الطلب/)).toBeVisible();

    await agent.act('filter inventory by Expiring Soon (قريب الانتهاء)');
    await expect(screen.getByText(/تنتهي الصلاحية خلال 30 يوماً/)).toBeVisible();
  });
});
