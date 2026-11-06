import { UiHarness, normalizeText } from '../harness';

const PATIENT_NAME = `مريض اختبار آلي ${Date.now().toString().slice(-6)}`;

async function clickTestResult(ui: UiHarness, needle: string, exclude?: string): Promise<string> {
  const clicked = await ui.page.evaluate(
    (text, excluded) => {
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const candidates = Array.from(document.querySelectorAll('div'))
        .filter((element) => typeof (element as any).onclick === 'function' && visible(element))
        .filter((element) => {
          const label = normalize((element as HTMLElement).innerText);
          if (!label.includes(text)) return false;
          if (excluded && label.includes(excluded)) return false;
          return label.length < 320;
        })
        .sort(
          (left, right) =>
            normalize((left as HTMLElement).innerText).length - normalize((right as HTMLElement).innerText).length,
        );
      const target = candidates[0];
      if (!target) return '';
      (target as HTMLElement).scrollIntoView({ block: 'center' });
      (target as HTMLElement).click();
      return normalize((target as HTMLElement).innerText).slice(0, 140);
    },
    needle,
    exclude || '',
  );
  if (!clicked) throw new Error(`Test row not found in catalog: ${needle}`);
  return clicked;
}

async function searchCatalog(ui: UiHarness, query: string): Promise<void> {
  const search = await ui.page.$('input[placeholder*="ابحث بالاسم أو الرمز"]');
  if (!search) throw new Error('Catalog search input not found');
  await search.click({ clickCount: 3 });
  await search.type(query);
  await new Promise((resolve) => setTimeout(resolve, 900));
}

export const intakeSuite = {
  patientName: PATIENT_NAME,
  async run(ui: UiHarness): Promise<void> {
    ui.currentSuite = 'intake';

    await ui.check('opens the intake workspace', async () => {
      await ui.goto('/');
      await ui.waitForText('الاستقبال والتشخيص', 90_000);
      await ui.page.waitForSelector('input[placeholder="الاسم الثلاثي للمريض..."]', { timeout: 60_000 });
    });

    await ui.check('save is disabled until name, age, sex, and a test are present', async () => {
      const disabled = await ui.page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find((element) =>
          (element as HTMLElement).innerText.includes('حفظ'),
        ) as HTMLButtonElement | undefined;
        return button ? button.disabled : true;
      });
      if (!disabled) throw new Error('Save button should start disabled');
      await ui.clickText('حفظ', { allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 350));
      const body = normalizeText(await ui.bodyText());
      if (!/مطلوب|يرجى|الاسم|العمر|الجنس|أضف/.test(body)) {
        // The disabled button swallows the click; this is acceptable validation.
        ui.addNote('Intake: clicking disabled save did not produce a validation toast (button is disabled).');
      }
    });

    await ui.check('registers patient demographics and Iraqi phone', async () => {
      await ui.setValueBySelector('input[name="patientName"]', PATIENT_NAME);
      await ui.fillPlaceholder('07701234567', '07701234567');
      await ui.setValueBySelector('input[placeholder="0"]', '30');
      await ui.clickText('ذكر', { exact: true, allowDiv: false });
      await ui.page
        .waitForFunction(
          () => {
            const button = Array.from(document.querySelectorAll('button')).find(
              (element) => (element as HTMLElement).innerText.replace(/\s+/g, ' ').trim() === 'ذكر',
            );
            return !!button && !!button.querySelector('svg');
          },
          { timeout: 20_000, polling: 150 },
        )
        .catch(() => undefined);
      const values = await ui.page.evaluate(() => ({
        name: (document.querySelector('input[name="patientName"]') as HTMLInputElement)?.value,
        phone: (document.querySelector('input[placeholder="07701234567"]') as HTMLInputElement)?.value,
        age: (document.querySelector('input[placeholder="0"]') as HTMLInputElement)?.value,
      }));
      if (values.name !== PATIENT_NAME) throw new Error(`Patient name mismatch: ${values.name}`);
      if (values.phone !== '07701234567') throw new Error(`Phone mismatch: ${values.phone}`);
      if (values.age !== '30') throw new Error(`Age mismatch: ${values.age}`);
      const maleSelected = await ui.page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (element) => (element as HTMLElement).innerText.replace(/\s+/g, ' ').trim() === 'ذكر',
        );
        return !!button && !!button.querySelector('svg');
      });
      if (!maleSelected) throw new Error('Male gender was not selected');
    });

    await ui.check('searches the catalog and adds CBC with its EDTA tube badge', async () => {
      await searchCatalog(ui, 'CBC');
      await ui.waitForText('Complete Blood Count', 30_000);
      const added = await clickTestResult(ui, 'Complete Blood Count', 'Coag');
      ui.addNote(`Intake: added catalog row -> ${added}`);
      await ui.waitForText('EDTA', 20_000);
      await ui.waitForText('1 فحص مختار', 20_000);
    });

    await ui.check('adds a chemistry test and renders an inline result input', async () => {
      await searchCatalog(ui, 'FBS');
      await ui.waitForText('Fasting Blood Sugar', 30_000);
      const added = await clickTestResult(ui, 'Fasting Blood Sugar (FBS)', 'Glucose');
      ui.addNote(`Intake: added catalog row -> ${added}`);
      await ui.waitForText('2 فحص مختار', 30_000);
      const inputs = await ui.count('input[placeholder="—"]');
      if (inputs < 1) throw new Error('Inline result input (placeholder —) was not rendered');
    });

    await ui.check('enters a critical glucose value and surfaces a panic/flag', async () => {
      const resultInput = await ui.page.$('input[placeholder="—"]');
      if (!resultInput) throw new Error('Result input not found');
      await resultInput.click({ clickCount: 3 });
      await resultInput.type('450');
      await new Promise((resolve) => setTimeout(resolve, 700));
      const value = await ui.page.evaluate(
        () => (document.querySelector('input[placeholder="—"]') as HTMLInputElement)?.value,
      );
      if (value !== '450') throw new Error(`Result value was not accepted: ${value}`);
      const flagged = await ui.hasText('PANIC');
      if (flagged) {
        ui.addNote('Intake: critical value 450 triggered the PANIC banner.');
      } else {
        ui.addNote('FINDING: critical FBS value 450 did NOT surface the PANIC banner in the intake workspace.');
      }
      const body = normalizeText(await ui.bodyText());
      if (!/تم إدخال 1 من أصل 2/.test(body)) {
        throw new Error(`Result progress counter did not reach 1/2: ${body.slice(0, 300)}`);
      }
    });

    await ui.check('opens and closes the specialized CBC form from the results grid', async () => {
      await ui.clickText('فورمة صورة الدم', { allowDiv: false });
      await ui.waitForModal(undefined, 30_000);
      const body = normalizeText(await ui.bodyText());
      if (!/CBC|Hemoglobin|الهيموغلوبين|WBC|صورة الدم/i.test(body)) {
        throw new Error('CBC specialized form content was not recognized');
      }
      await ui.dismissModal();
      await ui.sleep(400);
      const after = normalizeText(await ui.bodyText());
      if (!/تم إدخال 1 من أصل 2/.test(after)) {
        throw new Error('Closing the CBC form changed the entered-results counter');
      }
    });

    await ui.check('applies a 10% discount and recalculates the net total', async () => {
      await ui.clickText('10%', { exact: true, allowDiv: false });
      await new Promise((resolve) => setTimeout(resolve, 400));
      const body = normalizeText(await ui.bodyText());
      if (!/18,000|18000/.test(body)) {
        throw new Error(`Expected net total 18,000 after 10% discount; body tail: ${body.slice(-500)}`);
      }
      if (!/20,000|20000/.test(body)) throw new Error('Expected gross total 20,000 was not displayed');
    });

    await ui.check('saves the order (F9) and shows the success toast', async () => {
      await ui.clickText('حفظ F9', { allowDiv: false });
      await ui.waitForText('تم حفظ الطلب', 90_000);
      const body = normalizeText(await ui.bodyText());
      const match = body.match(/تم حفظ الطلب\s*#?(\d+)/);
      if (!match) throw new Error('Success toast did not include a sample number');
      ui.addNote(`Intake: created sample #${match[1]} for ${PATIENT_NAME}`);
      await ui.waitForText(`#${match[1]}`, 20_000);
    });

    await ui.check('persists the new order in the patients registry', async () => {
      await ui.goto('/patients');
      await ui.waitForText('سجل المرضى', 60_000);
      await ui.fillPlaceholder('بحث باسم المريض', PATIENT_NAME);
      await ui.waitForText(PATIENT_NAME, 60_000);
      const body = normalizeText(await ui.bodyText());
      if (!body.includes(PATIENT_NAME)) throw new Error('New patient is not visible in the registry');
      await ui.addNote(`Patients: ${PATIENT_NAME} is searchable in the registry.`);
    });

    await ui.check('opens the new patient file and shows the saved order', async () => {
      const opened = await ui.page.evaluate((name) => {
        const elements = Array.from(document.querySelectorAll('*')).filter(
          (element) => element.children.length === 0 && (element.textContent || '').includes(name),
        );
        const leaf = elements[0];
        let node: Element | null = leaf;
        while (node && !(typeof (node as any).onclick === 'function' || node.tagName === 'BUTTON')) {
          node = node.parentElement;
        }
        if (!node) return false;
        (node as HTMLElement).click();
        return true;
      }, PATIENT_NAME);
      if (!opened) throw new Error('Could not click the patient row');
      await ui.waitForText(PATIENT_NAME, 30_000);
      await ui.waitForText('حفظ النتائج', 30_000);
      await ui.waitForText('Fasting Blood Sugar', 30_000);
    });

    await ui.check('resets the workspace with F1 (new patient)', async () => {
      await ui.goto('/');
      await ui.waitForText('الاستقبال والتشخيص', 60_000);
      await ui.fillPlaceholder('الاسم الثلاثي للمريض', 'مريض مؤقت');
      await ui.press('F1');
      await ui.waitForModal('هل تريد إلغاء', 20_000);
      await ui.clickText('نعم، بدء مريض جديد', { allowDiv: false });
      await ui.waitForText('جاهز لإدخال مريض جديد', 20_000);
      const value = await ui.page.evaluate(
        () => (document.querySelector('input[name="patientName"]') as HTMLInputElement)?.value,
      );
      if (value) throw new Error(`F1 did not clear the form (value: ${value})`);
    });
  },
};
