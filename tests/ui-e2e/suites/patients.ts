import { UiHarness, normalizeText } from '../harness';

export async function runPatientsSuite(ui: UiHarness, patientName: string): Promise<void> {
  ui.currentSuite = 'patients';

  await ui.check('opens the registry and finds the newly created patient', async () => {
    await ui.goto('/patients');
    await ui.waitForText('سجل المرضى', 60_000);
    await ui.fillPlaceholder('بحث باسم المريض', patientName);
    await ui.waitForText(patientName, 60_000);
  });

  await ui.check('opens the patient file and displays demographics and results', async () => {
    await ui.clickText(patientName, { allowDiv: true });
    await ui.waitForText('حفظ النتائج', 30_000);
    const body = normalizeText(await ui.bodyText());
    if (!body.includes(patientName)) throw new Error('Patient name missing from the file header');
    if (!/Fasting Blood Sugar|FBS/.test(body)) throw new Error('Saved test is missing from the patient file');
  });

  await ui.check('switches between registry quick filters', async () => {
    for (const filter of ['الكل', 'اليوم', 'قيد الفحص', 'عليه دين']) {
      await ui.clickText(filter, { exact: true, allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
        throw new Error(`Filter "${filter}" caused an application error`);
      }
    }
    await ui.clickText('الكل', { exact: true, allowDiv: false });
  });

  await ui.check('opens and cancels the edit-patient dialog', async () => {
    await ui.clickText('تعديل بيانات المريض', { allowDiv: false });
    await ui.waitForModal();
    const modalText = normalizeText(await ui.bodyText());
    if (!/تعديل|بيانات المريض|رقم الهاتف|الهاتف/.test(modalText)) {
      throw new Error('Edit patient dialog content was not recognized');
    }
    await ui.dismissModal();
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
      throw new Error('Cancelling the edit dialog caused an application error');
    }
  });

  await ui.check('updates the patient phone number and persists it', async () => {
    await ui.clickText('تعديل بيانات المريض', { allowDiv: false });
    await ui.waitForModal();
    await ui.fillFieldByLabel('رقم الهاتف', '07801112233');
    await ui.clickText('حفظ التعديلات', { allowDiv: false });
    await ui.waitForText('تم تحديث بيانات المريض بنجاح', 45_000);
    const body = normalizeText(await ui.bodyText());
    if (!body.includes('07801112233')) throw new Error('Updated phone number is not visible after save');
  });

  await ui.check('opens the sample-delete confirmation and cancels it safely', async () => {
    await ui.clickText('حذف العينة', { allowDiv: false });
    await ui.waitForModal();
    const body = normalizeText(await ui.bodyText());
    if (!/حذف|تأكيد|هل أنت متأكد/.test(body)) throw new Error('Delete confirmation was not shown');
    await ui.dismissModal();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const after = normalizeText(await ui.bodyText());
    if (!after.includes(patientName)) throw new Error('Patient disappeared after cancelling delete');
  });

  const visitsButton = await ui.page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((element) => (element as HTMLElement).innerText.includes('ملف المريض')),
  );
  if (!visitsButton) {
    ui.skip('opens the patient-visits dialog', 'No "ملف المريض" button is rendered for this patient');
  } else {
    await ui.check('opens the patient-visits dialog', async () => {
      await ui.clickText('ملف المريض', { allowDiv: false });
      await ui.waitForModal();
      await ui.dismissModal();
    });
  }

  const settleButton = await ui.page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((element) => (element as HTMLElement).innerText.includes('تسديد')),
  );
  if (!settleButton) {
    ui.skip('opens the settle-account dialog and cancels it', 'No settle-account button is rendered');
  } else {
    await ui.check('opens the settle-account dialog and cancels it', async () => {
      await ui.clickText('تسديد', { allowDiv: false });
      await ui.waitForModal();
      const body = normalizeText(await ui.bodyText());
      if (!/تسديد|المبلغ|المدفوع/.test(body)) throw new Error('Settle-account dialog content was not recognized');
      await ui.dismissModal();
    });
  }

  const resultInputs = await ui.count('input[placeholder="أدخل النتيجة..."]');
  if (!resultInputs) {
    ui.skip('writes and saves a result from the patient file', 'No inline result input in this patient file');
  } else {
    await ui.check('writes and saves a result from the patient file', async () => {
      const result = await ui.page.$('input[placeholder="أدخل النتيجة..."]');
      if (!result) throw new Error('Result input disappeared before editing');
      await result.click({ clickCount: 3 });
      await result.type('5.2');
      await ui.clickText('حفظ النتائج', { allowDiv: false });
      await ui.waitForText('تم حفظ', 60_000);
      const body = normalizeText(await ui.bodyText());
      if (!/تم حفظ|تم الحفظ/.test(body)) throw new Error('No save confirmation was shown for results');
    });
  }

  const reportButton = await ui.page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((element) =>
      (element as HTMLElement).innerText.includes('طباعة التقرير النهائي'),
    ),
  );
  if (!reportButton) {
    ui.skip('does not crash when opening the final report action', 'Final report button is not rendered');
  } else {
    await ui.check('does not crash when opening the final report action', async () => {
      await ui.page.evaluate(() => {
        (window as any).__e2eOpened = [];
        const original = window.open;
        (window as any).__e2eOriginalOpen = original;
        window.open = ((url: string | URL) => {
          (window as any).__e2eOpened.push(String(url));
          return null;
        }) as typeof window.open;
      });
      await ui.clickText('طباعة التقرير النهائي', { allowDiv: false });
      await ui.sleep(1_500);
      const state = await ui.page.evaluate(() => ({
        opened: ((window as any).__e2eOpened || []) as string[],
        error: /Unhandled Runtime Error|Application error/i.test(document.body.innerText || ''),
      }));
      if (state.error) throw new Error('Opening the final report caused an application error');
      ui.addNote(`Patients: final report action opened ${state.opened.length} window(s).`);
    });
  }
}
