import { UiHarness, normalizeText } from '../harness';

export async function runDevicesSuite(ui: UiHarness): Promise<void> {
  ui.currentSuite = 'devices';

  await ui.check('opens the devices and inventory workspace', async () => {
    await ui.goto('/devices');
    await ui.waitForText('الأجهزة الطبية', 90_000);
    await ui.waitForText('المخزون والكواشف', 45_000);
  });

  await ui.check('switches inventory filters', async () => {
    for (const filter of ['نواقص الرصيد', 'منتهية الصلاحية', 'الكل']) {
      await ui.clickText(filter, { exact: false, allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
        throw new Error(`Inventory filter "${filter}" caused an application error`);
      }
    }
  });

  await ui.check('searches inventory by reagent or test code', async () => {
    await ui.fillPlaceholder('بحث عن كاشف أو كود تحليل', 'CBC');
    await new Promise((resolve) => setTimeout(resolve, 600));
    await ui.fillPlaceholder('بحث عن كاشف أو كود تحليل', '');
  });

  await ui.check('opens and cancels the add-device dialog', async () => {
    await ui.clickText('إضافة جهاز طبي', { allowDiv: false });
    await ui.waitForModal(undefined, 90_000);
    const body = normalizeText(await ui.bodyText());
    if (!/جهاز|البروتوكول|المنفذ|ASTM|HL7/.test(body)) throw new Error('Add-device dialog content was not recognized');
    await ui.dismissModal();
  });

  await ui.check('opens and cancels the add-inventory dialog', async () => {
    await ui.clickText('إضافة كاشف للمخزون', { allowDiv: false });
    await ui.waitForModal(undefined, 90_000);
    const body = normalizeText(await ui.bodyText());
    if (!/كاشف|العبوات|الصلاحية|التكلفة|التحليل/.test(body)) {
      throw new Error('Add-inventory dialog content was not recognized');
    }
    await ui.dismissModal();
  });

  await ui.check('opens the device connection guide and closes it', async () => {
    await ui.clickText('خطوات الربط بالتفصيل', { allowDiv: false });
    await ui.waitForModal(undefined, 60_000);
    const body = normalizeText(await ui.bodyText());
    if (!/خطوات|الربط|المنفذ|البروتوكول/.test(body)) throw new Error('Device guide content was not recognized');
    await ui.dismissModal();
  });

  const hasTestButton = await ui.page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((element) => (element as HTMLElement).innerText.includes('فحص الربط')),
  );
  if (!hasTestButton) {
    ui.skip('runs a device connectivity check without crashing', 'No device connectivity button is rendered');
  } else {
    await ui.check('runs a device connectivity check without crashing', async () => {
      await ui.clickText('فحص الربط', { allowDiv: false });
      await ui.sleep(3_000);
      if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
        throw new Error('Device connectivity check caused an application error');
      }
      ui.addNote('Devices: connectivity check invoked; network result depends on the configured analyzer.');
    });
  }

  await ui.check('opens the delete-device confirmation and cancels it', async () => {
    await ui.clickText('حذف الجهاز', { allowDiv: false });
    await ui.waitForModal(undefined, 30_000);
    const body = normalizeText(await ui.bodyText());
    if (!/حذف|تأكيد|هل أنت متأكد/.test(body)) throw new Error('Delete-device confirmation was not shown');
    await ui.dismissModal();
  });

  await ui.check('opens an inventory package and cancels it', async () => {
    await ui.clickText('فتح عبوة', { allowDiv: false });
    await ui.waitForModal(undefined, 30_000);
    const body = normalizeText(await ui.bodyText());
    if (!/عبوة|صلاحية|الكمية|المخزون/.test(body)) throw new Error('Open-package dialog content was not recognized');
    await ui.dismissModal();
  });
}
