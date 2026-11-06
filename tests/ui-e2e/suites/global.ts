import { UiHarness, normalizeText } from '../harness';

const NAV_ITEMS = [
  { label: 'الشاشة الرئيسية', path: '/' },
  { label: 'سجل المرضى والنتائج', path: '/patients' },
  { label: 'الصندوق والحسابات', path: '/financials' },
  { label: 'الأجهزة والمخزون', path: '/devices' },
  { label: 'الإعدادات والتحاليل', path: '/settings' },
];

export async function runGlobalSuite(ui: UiHarness): Promise<void> {
  ui.currentSuite = 'global';

  await ui.check('sidebar navigation reaches every main section', async () => {
    await ui.goto('/');
    await ui.waitForText('الاستقبال والتشخيص', 90_000);
    for (const item of NAV_ITEMS) {
      await ui.clickText(item.label, { exact: true, allowDiv: false });
      await ui.page.waitForFunction(
        (expectedPath) => window.location.pathname === expectedPath,
        { timeout: 30_000, polling: 200 },
        item.path,
      );
      const body = (await ui.bodyText()).trim();
      if (body.length < 20) throw new Error(`Empty page after navigating to ${item.path}`);
    }
    ui.addNote('Global: all five sidebar destinations are reachable.');
  });

  await ui.check('theme toggle switches and persists', async () => {
    await ui.goto('/');
    await ui.waitForText('الاستقبال والتشخيص', 60_000);
    const before = await ui.page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('lab_theme_v2'),
    }));
    await ui.clickText('الوضع الليلي', { allowDiv: false });
    await new Promise((resolve) => setTimeout(resolve, 350));
    const after = await ui.page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('lab_theme_v2'),
    }));
    if (before.theme === after.theme) throw new Error(`Theme did not change (stayed ${after.theme})`);
    await ui.reload();
    await ui.waitForText('الاستشخيص', 60_000).catch(() => undefined);
    const persisted = await ui.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (persisted !== after.theme) throw new Error(`Theme did not persist after reload (${persisted})`);
  });

  await ui.check('login page validates required fields', async () => {
    await ui.goto('/login');
    await ui.waitForText('تسجيل الدخول', 60_000);
    const formState = await ui.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      return { count: inputs.length, required: inputs.every((input) => input.required) };
    });
    if (formState.count < 2) throw new Error('Login form inputs are missing');
    if (!formState.required) throw new Error('Login inputs are not marked required');
  });

  await ui.check('login page reports an error for invalid credentials without hanging', async () => {
    await ui.goto('/login');
    await ui.waitForText('تسجيل الدخول', 60_000);
    await ui.fillPlaceholder('أدخل اسم المستخدم', 'invalid-user');
    await ui.fillPlaceholder('أدخل كلمة المرور', 'invalid-password');
    await ui.clickText('تسجيل الدخول', { allowDiv: false });
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const body = normalizeText(await ui.bodyText());
    if (!/فشل|خطأ|غير صالح|تعذر|Authentication|404/.test(body)) {
      ui.addNote('FINDING: invalid login did not show a visible error message within 2s (web mode has no /api/auth/login route).');
    } else {
      ui.addNote('Login: invalid credentials are rejected with a visible message.');
    }
  });

  await ui.check('guest entry link reaches the dashboard', async () => {
    await ui.goto('/login');
    await ui.waitForText('الدخول المباشر كزائر', 60_000);
    await ui.clickText('الدخول المباشر كزائر', { allowDiv: false });
    await ui.page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 30_000 });
  });

  await ui.check('F1 clears the intake form', async () => {
    await ui.goto('/');
    await ui.waitForText('الاستقبال والتشخيص', 60_000);
    await ui.fillPlaceholder('الاسم الثلاثي للمريض', 'اسم مؤقت للاختبار');
    await ui.press('F1');
    await ui.waitForModal('هل تريد إلغاء', 20_000);
    await ui.clickText('نعم، بدء مريض جديد', { allowDiv: false });
    await ui.waitForText('جاهز لإدخال مريض جديد', 20_000);
    const value = await ui.page.evaluate(
      () => (document.querySelector('input[name="patientName"]') as HTMLInputElement)?.value,
    );
    if (value) throw new Error(`F1 did not clear the name field (${value})`);
  });

  await ui.check('F2 barcode action never crashes the workspace', async () => {
    await ui.goto('/');
    await ui.waitForText('الاستقبال والتشخيص', 60_000);
    await ui.page.evaluate(() => {
      (window as any).__e2eOpened = [];
      const original = window.open;
      window.open = ((url: string | URL) => {
        (window as any).__e2eOpened.push(String(url));
        return null;
      }) as typeof window.open;
      return original;
    });
    await ui.press('F2');
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    if (/Unhandled Runtime Error|Application error/i.test(await ui.bodyText())) {
      throw new Error('F2 barcode action caused an application error');
    }
    const state = await ui.page.evaluate(() => ({
      opened: ((window as any).__e2eOpened || []) as string[],
      modal: document.body.innerText.includes('باركود'),
    }));
    ui.addNote(`Global: F2 barcode produced ${state.opened.length} window(s), modal=${state.modal}.`);
  });

  await ui.check('public verification page is reachable without authentication', async () => {
    await ui.goto('/verify/nonexistent');
    await new Promise((resolve) => setTimeout(resolve, 2_500));
    const body = normalizeText(await ui.bodyText());
    if (!/تحقق|تقرير|صالح|غير صالح|مفقود|خطأ/.test(body)) {
      throw new Error('Verification page did not render any recognizable state');
    }
    if (/جاري التحقق/.test(body) && !/صالح|غير صالح|مفقود|خطأ/.test(body)) {
      ui.addNote('FINDING: /verify/nonexistent stays on "جاري التحقق..." with no result or error state.');
    }
  });

  await ui.check('readiness and health probes return JSON without errors', async () => {
    for (const route of ['/ready', '/health']) {
      const response = await ui.page.goto(ui.url(route), { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!response || response.status() !== 200) throw new Error(`${route} did not return HTTP 200`);
      const text = (await ui.bodyText()).trim();
      if (!/ready|OK|status/i.test(text)) throw new Error(`${route} returned an unexpected body: ${text.slice(0, 120)}`);
    }
  });
}
