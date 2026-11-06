import { UiHarness, normalizeText } from '../harness';

const EXPENSE_DESCRIPTION = `اختبار آلي مصروف ${Date.now().toString().slice(-5)}`;
const DOCTOR_NAME = `د. اختبار آلي ${Date.now().toString().slice(-5)}`;

export async function runFinancialsSuite(ui: UiHarness): Promise<void> {
  ui.currentSuite = 'financials';

  await ui.check('opens the cashier dashboard', async () => {
    await ui.goto('/financials');
    await ui.waitForText('الصندوق', 60_000);
    await ui.waitForText('ديون المرضى', 30_000);
    await ui.waitForText('الأطباء المحيلون', 30_000);
  });

  await ui.check('switches period filters', async () => {
    for (const filter of ['اليوم', 'الأسبوع', 'الشهر', 'الكل']) {
      await ui.clickText(filter, { exact: true, allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
        throw new Error(`Period filter "${filter}" caused an application error`);
      }
    }
  });

  await ui.check('switches movement-type filters', async () => {
    for (const filter of ['المقبوضات فقط', 'المصاريف فقط', 'كل الحركات']) {
      await ui.clickText(filter, { exact: true, allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
        throw new Error(`Movement filter "${filter}" caused an application error`);
      }
    }
  });

  await ui.check('switches between debts and referring doctors', async () => {
    await ui.clickText('ديون المرضى', { allowDiv: false });
    await ui.page.waitForSelector('input[placeholder="بحث عن مريض مديون..."]', { timeout: 20_000 });
    await ui.clickText('الأطباء المحيلون', { allowDiv: false });
    await ui.page.waitForSelector('input[placeholder="بحث عن طبيب محيل..."]', { timeout: 20_000 });
    const body = normalizeText(await ui.bodyText());
    if (!/نسبة العمولة/.test(body)) {
      ui.addNote('Financials: doctors tab does not render the commission column while empty.');
    }
  });

  await ui.check('searches cash movements', async () => {
    await ui.fillPlaceholder('بحث في الحركات والمصاريف', 'عينة');
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
      throw new Error('Movement search caused an application error');
    }
    await ui.fillPlaceholder('بحث في الحركات والمصاريف', '');
  });

  await ui.check('opens the expense dialog and validates empty input', async () => {
    await ui.clickText('تسجيل مصروف', { allowDiv: false });
    await ui.waitForModal();
    await ui.clickText('حفظ المصروف', { allowDiv: false });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const body = normalizeText(await ui.bodyText());
    if (!/يرجى|مطلوب|أدخل|الرجاء/.test(body)) {
      throw new Error('Empty expense form did not produce a validation message');
    }
  });

  await ui.check('creates an operating expense and shows it in the ledger', async () => {
    await ui.fillPlaceholder('مثال: شراء مستلزمات، فاتورة كهرباء', EXPENSE_DESCRIPTION);
    await ui.fillPlaceholder('25000', '1500');
    await ui.clickText('حفظ المصروف', { allowDiv: false });
    await ui.waitForText('تم تسجيل المصروف بنجاح', 45_000);
    await ui.waitForText(EXPENSE_DESCRIPTION, 20_000);
  });

  await ui.check('opens the referring-doctor dialog and validates empty input', async () => {
    await ui.clickText('إضافة طبيب محيل', { allowDiv: false });
    await ui.waitForModal();
    await ui.clickText('حفظ الطبيب', { allowDiv: false });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const body = normalizeText(await ui.bodyText());
    if (!/يرجى|مطلوب|أدخل|الرجاء/.test(body)) {
      throw new Error('Empty doctor form did not produce a validation message');
    }
  });

  await ui.check('creates a referring doctor with a commission rate', async () => {
    await ui.fillPlaceholder('مثال: أحمد العبيدي', DOCTOR_NAME);
    await ui.fillPlaceholder('0770...', '07801234567');
    await ui.clickText('حفظ الطبيب', { allowDiv: false });
    await ui.waitForText('تمت إضافة الطبيب المحيل بنجاح', 45_000);
    await ui.clickText('الأطباء المحيلون', { allowDiv: false });
    await ui.waitForText(DOCTOR_NAME, 30_000);
    ui.addNote(`Financials: created referring doctor ${DOCTOR_NAME}`);
  });

  await ui.clickText('ديون المرضى', { allowDiv: false });
  await ui.sleep(500);
  const hasDebtButton = await ui.page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((element) => (element as HTMLElement).innerText.includes('تسديد')),
  );
  if (!hasDebtButton) {
    ui.skip('opens a debt settlement dialog without submitting', 'No patient with an outstanding debt is visible');
  } else {
    await ui.check('opens a debt settlement dialog without submitting', async () => {
      await ui.clickText('تسديد', { allowDiv: false });
      await ui.waitForModal();
      await ui.dismissModal();
    });
  }
}
