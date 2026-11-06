import { UiHarness } from '../harness';

interface RouteSpec {
  path: string;
  name: string;
  expected?: string;
  json?: boolean;
}

export const ROUTES: RouteSpec[] = [
  { path: '/', name: 'Intake / Unified Workspace', expected: 'الاستقبال والتشخيص' },
  { path: '/patients', name: 'Patients registry', expected: 'سجل المرضى' },
  { path: '/samples', name: 'Samples alias', expected: 'سجل المرضى' },
  { path: '/results', name: 'Results alias', expected: 'سجل المرضى' },
  { path: '/financials', name: 'Cashier / Financials', expected: 'الصندوق' },
  { path: '/debts', name: 'Debts alias', expected: 'الصندوق' },
  { path: '/expenses', name: 'Expenses alias', expected: 'الصندوق' },
  { path: '/doctors', name: 'Referring doctors', expected: 'الأطباء المحيلون' },
  { path: '/dashboard', name: 'Dashboard alias', expected: 'الصندوق' },
  { path: '/devices', name: 'Devices & inventory', expected: 'الأجهزة الطبية' },
  { path: '/inventory', name: 'Inventory alias', expected: 'المخزون' },
  { path: '/catalog', name: 'Test catalog', expected: 'دليل التحاليل' },
  { path: '/settings', name: 'Report designer', expected: 'مصمم فورمة' },
  { path: '/staff', name: 'System / network settings', expected: 'حالة السيرفر' },
  { path: '/license', name: 'License / system alias', expected: 'حالة السيرفر' },
  { path: '/connect', name: 'LAN device pairing', expected: 'بوابة ربط' },
  { path: '/login', name: 'Login', expected: 'تسجيل الدخول' },
  { path: '/showcase', name: 'Public showcase', expected: 'نظام لابريو' },
  { path: '/ready', name: 'Readiness probe', expected: 'ready', json: true },
  { path: '/health', name: 'Health probe', expected: 'OK', json: true },
  { path: '/verify/nonexistent', name: 'Public report verification', expected: 'التحقق' },
];

function isHydrationNoise(message: string): boolean {
  return /hydrat|Text content did not match|server-rendered HTML|Suspense boundary/i.test(message);
}

export async function runRouteSuite(ui: UiHarness): Promise<void> {
  ui.currentSuite = 'routes';
  for (const route of ROUTES) {
    await ui.check(
      `${route.path} loads`,
      async () => {
        const response = await ui.goto(route.path);
        if (response && response.status() !== 200) {
          throw new Error(`HTTP ${response.status()} for ${route.path}`);
        }
        if (route.expected) {
          await ui.waitForText(route.expected, 90_000);
        }
        const body = (await ui.bodyText()).trim();
        if (body.length < 20) throw new Error(`Page body is empty (${body.length} chars)`);
        if (/Unhandled Runtime Error|Application error/i.test(body)) {
          throw new Error('Next.js error overlay is visible');
        }
        if (route.json) {
          JSON.parse(body);
          return;
        }
        const title = await ui.page.title();
        if (!title || title === 'about:blank') throw new Error('Document title is missing');
      },
    );

    await ui.check(
      `${route.path} has no uncaught page errors`,
      async () => {
        const messages = ui.pageMessages();
        const fatal = messages.pageErrors.filter((message) => !isHydrationNoise(message));
        for (const message of messages.pageErrors.filter(isHydrationNoise)) {
          ui.addNote(`${route.path}: hydration warning -> ${message.slice(0, 220)}`);
        }
        if (fatal.length) throw new Error(fatal.join('\n').slice(0, 2_000));
      },
    );

    if (!route.json) {
      await ui.check(
        `${route.path} controls are named`,
        async () => {
          const inventory = await ui.controlsInventory();
          const unnamedButtons = inventory.buttons.filter((button) => !button.named);
          const unnamedInputs = inventory.inputs.filter((input) => !input.named);
          if (unnamedButtons.length) {
            throw new Error(
              `Unnamed buttons (${unnamedButtons.length}): ${unnamedButtons.map((button) => button.label || '(empty)').join(', ')}`,
            );
          }
          if (unnamedInputs.length) {
            ui.addNote(
              `${route.path}: ${unnamedInputs.length} input(s) without placeholder/label/name (${unnamedInputs
                .map((input) => `${input.tag}[${input.type}]`)
                .join(', ')})`,
            );
          }
          if (!inventory.buttons.length && !inventory.links.length && !inventory.inputs.length) {
            ui.addNote(`${route.path}: page exposes no interactive controls (status-only screen).`);
          }
        },
      );
    }

    await ui.check(
      `${route.path} has no failed internal API calls`,
      async () => {
        const messages = ui.pageMessages();
        const internal = messages.failedRequests.filter((request) => {
          const url = request.url;
          if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return false;
          if (url.endsWith('/favicon.ico')) return false;
          return url.startsWith(ui.baseUrl) || url.includes('/api/');
        });
        const serverErrors = internal.filter((request) => request.status >= 500);
        const clientErrors = internal.filter((request) => request.status >= 400 && request.status < 500);
        for (const request of clientErrors) {
          ui.addNote(`${route.path}: HTTP ${request.status} ${request.url.replace(ui.baseUrl, '')}`);
        }
        if (serverErrors.length) {
          throw new Error(
            `HTTP 5xx responses:\n${serverErrors.map((request) => `${request.status} ${request.url.replace(ui.baseUrl, '')}`).join('\n')}`,
          );
        }
      },
    );
  }
}
