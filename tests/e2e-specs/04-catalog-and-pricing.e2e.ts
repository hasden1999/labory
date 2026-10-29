/**
 * E2E Test Suite 04: Test Catalog, Dynamic Pricing & Reference Ranges
 * Covers: Catalog search, category filters, adding new tests, modifying test prices,
 * updating catalog cache, complex age/sex reference ranges, and test deletion.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Test Catalog & Reference Ranges', { tags: ['catalog', 'pricing'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/catalog');
  });

  test('catalog navigation: filters tests by department category and searches by code/name', async ({ agent, screen }) => {
    await agent.act('select category filter {category}', { params: { category: 'Hematology' } });
    await expect(screen.getByText('Complete Blood Count')).toBeVisible();

    await agent.act('type {searchTerm} in the catalog search bar', { params: { searchTerm: 'Lipid' } });
    await expect(screen.getByText(/Lipid Profile/)).toBeVisible();
  });

  test('add test: adds a new diagnostic test to catalog with code, tube type, price, and units', async ({ agent, screen }) => {
    await agent.act('click on Add New Test button');
    await expect(screen.getByText('إضافة فحص جديد للكتالوج')).toBeVisible();

    await agent.act('fill test code {code}, name {name}, category {category}, price {price}, and unit {unit}', {
      params: {
        code: 'PRO-CALC',
        name: 'Procalcitonin (PCT)',
        category: 'Immunology',
        price: '25000',
        unit: 'ng/mL'
      }
    });
    await agent.act('select specimen tube type: Serum (Plain/Gel)');
    await agent.act('submit the new test form');

    await expect(screen.getByText('تمت إضافة الفحص بنجاح')).toBeVisible();
    await expect(screen.getByText('Procalcitonin (PCT)')).toBeVisible();
    await expect(screen.getByText('25,000 د.ع')).toBeVisible();
  });

  test('quick price edit: modifies test price inline and verifies immediate cache update', async ({ agent, screen }) => {
    await agent.act('click edit price on test {testCode}', { params: { testCode: 'CBC' } });
    await agent.act('update price to 12000 IQD and click Save');

    await expect(screen.getByText('12,000 د.ع')).toBeVisible();
    await expect(screen.getByText('تم تحديث السعر بنجاح')).toBeVisible();
  });

  test('reference ranges editor: configures multi-segment age and gender normal ranges', async ({ agent, screen }) => {
    await agent.act('click configure reference ranges on test {testCode}', { params: { testCode: 'CREAT' } });
    await expect(screen.getByText('محرر المعدلات الطبيعية والشرائح')).toBeVisible();

    await agent.act('add reference range: Male adult (18-120y) 0.7 - 1.3 mg/dL');
    await agent.act('add reference range: Female adult (18-120y) 0.5 - 1.1 mg/dL');
    await agent.act('add reference range: Child (1-17y) 0.3 - 0.7 mg/dL');

    await agent.act('save reference ranges configuration');
    await expect(screen.getByText('تم حفظ المعدلات الطبيعية بنجاح')).toBeVisible();
  });

  test('delete test: triggers confirmation dialog before removing a test from the catalog', async ({ agent, screen }) => {
    await agent.act('click delete icon on test {testCode}', { params: { testCode: 'PRO-CALC' } });
    await expect(screen.getByText('تأكيد الحذف')).toBeVisible();
    await expect(screen.getByText('هل أنت متأكد من حذف هذا الفحص من الكتالوج؟')).toBeVisible();

    await agent.act('confirm deletion in dialog');
    await expect(screen.getByText('تم حذف الفحص من الكتالوج')).toBeVisible();
    await expect(screen.getByText('PRO-CALC')).not.toBeVisible();
  });
});
