import { UiHarness, normalizeText } from '../harness';

export async function runSettingsSuite(ui: UiHarness): Promise<void> {
  ui.currentSuite = 'settings';

  await ui.check('opens the catalog and searches for a test', async () => {
    await ui.goto('/catalog');
    await ui.waitForText('دليل التحاليل', 90_000);
    await ui.fillPlaceholder('ابحث باسم التحليل أو الكود', 'CBC');
    await ui.waitForText('Complete Blood Count', 45_000);
  });

  await ui.check('filters the catalog by specialty', async () => {
    await ui.clickText('كل التخصصات', { allowDiv: false });
    await ui.clickText('أمراض الدم والتخثر', { allowDiv: false });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
      throw new Error('Catalog specialty filter caused an application error');
    }
    await ui.clickText('كل التخصصات', { allowDiv: false });
  });

  await ui.check('opens and cancels the add-test dialog', async () => {
    await ui.clickText('إضافة تحليل جديد', { allowDiv: false });
    await ui.waitForModal(undefined, 90_000);
    const body = normalizeText(await ui.bodyText());
    if (!/تحليل|الكود|السعر|القسم/.test(body)) throw new Error('Add-test dialog content was not recognized');
    await ui.dismissModal();
  });

  await ui.check('switches between the four settings workspaces', async () => {
    await ui.goto('/settings');
    await ui.waitForText('مصمم فورمة', 90_000);
    const tabs = [
      { label: '1. الهوية والترويسة والهوامش', expected: 'الهوية' },
      { label: '2. الألوان والخطوط والشعار', expected: 'الألوان' },
      { label: '3. أعمدة النتائج والجدول', expected: 'أعمدة' },
    ];
    for (const tab of tabs) {
      await ui.clickText(tab.label, { allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 450));
      const body = normalizeText(await ui.bodyText());
      if (!body.includes(tab.expected)) throw new Error(`Settings tab "${tab.label}" did not render`);
    }
    await ui.clickText('دليل التحاليل والأسعار', { allowDiv: false });
    await ui.waitForText('دليل التحاليل', 30_000);
    await ui.clickText('الشبكة والنسخ الاحتياطي والنظام', { allowDiv: false });
    await ui.waitForText('حالة السيرفر', 30_000);
  });

  await ui.check('saves the report design settings', async () => {
    await ui.goto('/settings');
    await ui.waitForText('مصمم فورمة', 90_000);
    await ui.sleep(800);
    await ui.clickAndWaitForText('حفظ وتطبيق التصميم', 'تم حفظ كافة إعدادات الفورمة', {
      attempts: 3,
      timeout: 12_000,
    });
    const saved = await ui.page.evaluate(async () => {
      const response = await fetch('/api/settings');
      const data = await response.json();
      return data?.reportTemplate || data?.labName || null;
    });
    if (!saved) throw new Error('GET /api/settings returned no persisted report settings');
  });

  await ui.check('renders the network/system panel and its four sections', async () => {
    await ui.goto('/staff');
    await ui.waitForText('حالة السيرفر', 60_000);
    const sections = [
      { label: '1. حالة السيرفر المركزي', expected: 'عنوان السيرفر المحلي' },
      { label: '2. ربط جهاز جديد', expected: 'طلبات الاقتران المعلقة' },
      { label: '3. الأجهزة المتصلة', expected: 'قائمة الأجهزة المقترنة والمعتمدة' },
      { label: '4. التشخيص والسرعة', expected: 'أدوات فحص واختبار الشبكة' },
    ];
    for (const section of sections) {
      await ui.clickAndWaitForText(section.label, section.expected, { attempts: 2, timeout: 10_000 });
      if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
        throw new Error(`Network section "${section.label}" caused an application error`);
      }
    }
  });

  await ui.check('opens the WhatsApp pairing tab without connecting', async () => {
    await ui.goto('/catalog');
    await ui.waitForText('دليل التحاليل', 60_000);
    await ui.clickText('ربط واتساب ويب', { allowDiv: false });
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const body = normalizeText(await ui.bodyText());
    if (!/واتساب|QR|باركود|جلسة/.test(body)) throw new Error('WhatsApp pairing tab content was not recognized');
    ui.addNote('Settings: WhatsApp tab opened; pairing was intentionally not started to avoid external side effects.');
  });

  await ui.check('renders the system/license workspace on /license', async () => {
    await ui.goto('/license');
    await ui.waitForText('حالة السيرفر', 60_000);
    const body = normalizeText(await ui.bodyText());
    if (!/النسخ الاحتياطي|التحديثات|السيرفر/.test(body)) {
      throw new Error('License/system workspace did not render the expected system controls');
    }
  });
}
