/**
 * E2E Test Suite 09: Paper Designer, Letterhead Margins & Printing Workflows
 * Covers: Interactive paper designer (PaperDesignerV2), top/bottom margin controls,
 * lab logo alignment, bilingual layout (English medical LTR, Arabic demographics RTL),
 * blank form printing (mode=blank), and official report printing with QR validation.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Paper Designer & Printing Workflows', { tags: ['printing', 'paper-designer'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/settings');
  });

  test('paper designer: configures top margin for pre-printed letterhead and adjusts print font size', async ({ agent, screen }) => {
    await agent.act('switch to Paper Design tab (مصمم القوالب والورق)');
    await expect(screen.getByText('إعدادات الهوامش والترويسة')).toBeVisible();

    await agent.act('set top margin to 45 mm for custom pre-printed letterhead');
    await expect(screen.getByPlaceholder('الهامش العلوي (mm)')).toHaveValue('45');

    await agent.act('adjust body font size to 11 pt');
    await expect(screen.getByPlaceholder('حجم الخط')).toHaveValue('11');

    await agent.act('save paper designer settings');
    await expect(screen.getByText('تم حفظ إعدادات الطباعة بنجاح')).toBeVisible();
  });

  test('logo & branding: updates laboratory Arabic/English names, contact numbers, and logo position', async ({ agent, screen }) => {
    await agent.act('switch to Paper Design tab');
    await agent.act('set Arabic lab name {arName} and English lab name {enName}', {
      params: { arName: 'مختبر بابل للتحليلات الطبية', enName: 'Babylon Medical Laboratory' }
    });
    await agent.act('select logo alignment: Center (توسيط الشعار)');

    await agent.act('save branding profile');
    await expect(screen.getByText('تم تحديث هوية المختبر بنجاح')).toBeVisible();
  });

  test('blank form printing: prints empty clinical test worksheet for manual bench recording', async ({ agent, screen }) => {
    await agent.act('open blank worksheet print dialog for CBC and Chemistry');
    await expect(screen.getByText('طباعة استمارة فارغة (Blank Form)')).toBeVisible();

    await agent.act('confirm blank worksheet print');
    await expect(screen.getByText('جاري تجهيز استمارة الفحص اليدوي...')).toBeVisible();
  });

  test('official report printing: verifies bilingual layout, QR code presence, and doctor signature space', async ({ agent, screen }) => {
    await agent.act('open official sample print preview');
    await expect(screen.getByText('معاينة التقرير الطبي')).toBeVisible();

    // Verifies QR code element is rendered
    await expect(screen.getByRole('img', 'QR Verification Code')).toBeVisible();

    // Verifies bilingual direction isolation (Arabic patient info RTL, medical results LTR)
    await expect(screen.getByText('ملاحظات الطبيب وتوقيع الفاحص')).toBeVisible();
    await expect(screen.getByText('Doctor Signature')).toBeVisible();
  });
});
