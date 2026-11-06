import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page, HTTPResponse, ElementHandle } from 'puppeteer';

export interface CheckResult {
  suite: string;
  name: string;
  ok: boolean;
  skipped: boolean;
  durationMs: number;
  details?: string;
  screenshot?: string;
}

export interface HarnessOptions {
  baseUrl: string;
  artifactsDir: string;
  headless?: boolean;
  defaultTimeout?: number;
}

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

export function findChrome(): string {
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No Chrome/Edge executable found for Puppeteer');
  return found;
}

export function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export class UiHarness {
  browser!: Browser;
  page!: Page;
  checks: CheckResult[] = [];
  currentSuite = 'general';
  baseUrl: string;
  artifactsDir: string;
  defaultTimeout: number;
  pageErrors: string[] = [];
  consoleErrors: string[] = [];
  failedRequests: Array<{ url: string; status: number }> = [];
  notes: string[] = [];
  inventory: Array<{ route: string; buttons: number; links: number; inputs: number }> = [];
  private currentRoute = '/';

  constructor(options: HarnessOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.artifactsDir = options.artifactsDir;
    this.defaultTimeout = options.defaultTimeout ?? 60_000;
    fs.mkdirSync(this.artifactsDir, { recursive: true });
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: (process.env.E2E_HEADLESS ?? '1') !== '0',
      executablePath: process.env.E2E_CHROME_PATH || findChrome(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=ar'],
      defaultViewport: { width: 1440, height: 900 },
    });
    this.page = await this.browser.newPage();
    // tsx/esbuild emits a `__name` helper inside transpiled functions; page.evaluate
    // serializes those functions, so the helper must exist in the browser context.
    await this.page.evaluateOnNewDocument(() => {
      const scope = window as any;
      if (typeof scope.__name !== 'function') scope.__name = (target: unknown) => target;
    });
    this.attachListeners(this.page);
    this.page.setDefaultTimeout(this.defaultTimeout);
    this.page.setDefaultNavigationTimeout(120_000);
  }

  private attachListeners(page: Page): void {
    page.on('pageerror', (error) => {
      const message = String(error?.message || error);
      if (!this.pageErrors.includes(message)) this.pageErrors.push(message);
    });
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (!this.consoleErrors.includes(text)) this.consoleErrors.push(text);
    });
    page.on('response', (response) => {
      const status = response.status();
      if (status < 400) return;
      const url = response.url();
      if (!url.startsWith(this.baseUrl) && !url.includes('/api/')) return;
      this.failedRequests.push({ url, status });
    });
    page.on('dialog', async (dialog) => {
      await dialog.accept().catch(() => undefined);
    });
  }

  url(route: string): string {
    if (/^https?:\/\//i.test(route)) return route;
    return this.baseUrl + (route.startsWith('/') ? route : '/' + route);
  }

  async goto(route: string): Promise<HTTPResponse | null> {
    this.currentRoute = route;
    this.pageErrors = [];
    this.consoleErrors = [];
    this.failedRequests = [];
    const response = await this.page.goto(this.url(route), {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await this.waitForHydration();
    return response;
  }

  async waitForHydration(timeout = 30_000): Promise<void> {
    // ThemeProvider sets data-theme from a mount effect, so its presence means
    // React finished hydrating and event handlers are attached.
    await this.page
      .waitForFunction(() => document.documentElement.hasAttribute('data-theme'), { timeout, polling: 100 })
      .catch(() => undefined);
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
    await this.waitForHydration();
  }

  async bodyText(): Promise<string> {
    return this.page.evaluate(() => document.body?.innerText || '');
  }

  async waitForText(text: string, timeout = this.defaultTimeout): Promise<void> {
    await this.page.waitForFunction(
      (needle) => (document.body?.innerText || '').replace(/\s+/g, ' ').includes(needle),
      { timeout, polling: 250 },
      normalizeText(text),
    );
  }

  async waitForTextGone(text: string, timeout = this.defaultTimeout): Promise<void> {
    await this.page.waitForFunction(
      (needle) => !(document.body?.innerText || '').replace(/\s+/g, ' ').includes(needle),
      { timeout, polling: 250 },
      normalizeText(text),
    );
  }

  async hasText(text: string): Promise<boolean> {
    const body = normalizeText(await this.bodyText());
    return body.includes(normalizeText(text));
  }

  async expectText(text: string, message?: string): Promise<void> {
    await this.waitForText(text);
    if (!(await this.hasText(text))) {
      throw new Error(message || `Expected text not found: ${text}`);
    }
  }

  async count(selector: string): Promise<number> {
    return this.page.$$eval(selector, (elements) => elements.length);
  }

  async dismissToasts(): Promise<void> {
    await this.page
      .evaluate(() => {
        document.querySelectorAll('.toast-close').forEach((button) => (button as HTMLElement).click());
      })
      .catch(() => undefined);
  }

  async clickText(
    text: string,
    options: { exact?: boolean; timeout?: number; allowDiv?: boolean } = {},
  ): Promise<void> {
    const timeout = options.timeout ?? 30_000;
    const exact = options.exact ?? false;
    const allowDiv = options.allowDiv ?? true;
    await this.page.waitForFunction(
      (needle, exactMatch, includeDivs) => {
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const candidates: Element[] = [
          ...Array.from(document.querySelectorAll('button,a,[role="button"],label')),
        ];
        if (includeDivs) {
          candidates.push(...Array.from(document.querySelectorAll('div')).filter((el) => typeof (el as any).onclick === 'function'));
        }
        return candidates.some((element) => {
          if (!visible(element)) return false;
          const label = normalize(
            (element as HTMLElement).innerText ||
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              '',
          );
          return exactMatch ? label === needle : label.includes(needle);
        });
      },
      { timeout, polling: 250 },
      normalizeText(text),
      exact,
      allowDiv,
    );

    const handle = await this.page.evaluateHandle(
      (needle, exactMatch, includeDivs) => {
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const candidates: Element[] = [
          ...Array.from(document.querySelectorAll('button,a,[role="button"],label')),
        ];
        if (includeDivs) {
          candidates.push(...Array.from(document.querySelectorAll('div')).filter((el) => typeof (el as any).onclick === 'function'));
        }
        const matches = candidates
          .filter((element) => {
            if (!visible(element)) return false;
            const label = normalize(
              (element as HTMLElement).innerText ||
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                '',
            );
            return exactMatch ? label === needle : label.includes(needle);
          })
          .sort((left, right) => normalize((left as HTMLElement).innerText).length - normalize((right as HTMLElement).innerText).length);
        return matches[0] || null;
      },
      normalizeText(text),
      exact,
      allowDiv,
    );
    const element = handle.asElement() as ElementHandle<Element> | null;
    if (!element) {
      await handle.dispose();
      throw new Error(`Clickable element not found: ${text}`);
    }
    // Toasts are fixed overlays that can swallow clicks on toolbar buttons.
    await this.dismissToasts();
    const box = await element.boundingBox();
    if (box) {
      const coveredByToast = await this.page.evaluate(
        ({ x, y }) => {
          const hit = document.elementFromPoint(x, y);
          return !!hit && !!hit.closest('.toast-item,.toast-container');
        },
        { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      );
      if (coveredByToast) {
        await this.dismissToasts();
        await this.sleep(250);
      }
    }
    // A real mouse click (instead of element.click()) is required for Next.js
    // links, whose router handlers ignore untrusted programmatic clicks.
    await element.click({ delay: 10 });
    await handle.dispose();
    await this.page.waitForNetworkIdle({ idleTime: 300, timeout: 2_000 }).catch(() => undefined);
  }

  async clickSelector(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { visible: true, timeout: 30_000 });
    await this.page.click(selector);
  }

  async fillPlaceholder(placeholder: string, value: string): Promise<void> {
    const setter = (needle: string, nextValue: string) => {
      const element = Array.from(document.querySelectorAll('input,textarea')).find((candidate) => {
        const placeholder = candidate.getAttribute('placeholder') || '';
        return placeholder === needle || placeholder.includes(needle);
      }) as HTMLInputElement | HTMLTextAreaElement | undefined;
      if (!element) return false;
      element.focus();
      const prototype =
        element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (descriptor) descriptor.call(element, nextValue);
      else element.value = nextValue;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };

    // Dev-mode hydration can finish after the first paint, which makes React
    // wipe values typed too early. Retry until the value survives a re-render.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const filled = await this.page.evaluate(setter, placeholder, value);
      if (!filled) throw new Error(`Input not found by placeholder: ${placeholder}`);
      await this.sleep(300);
      const retained = await this.page.evaluate(
        (needle, expected) => {
          const element = Array.from(document.querySelectorAll('input,textarea')).find((candidate) => {
            const placeholder = candidate.getAttribute('placeholder') || '';
            return placeholder === needle || placeholder.includes(needle);
          }) as HTMLInputElement | HTMLTextAreaElement | undefined;
          return element ? element.value === expected : false;
        },
        placeholder,
        value,
      );
      if (retained) return;
    }
    throw new Error(`Input value did not persist (hydration race?): ${placeholder}`);
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async setInputValue(index: number, value: string): Promise<void> {
    const changed = await this.page.evaluate(
      (inputIndex, nextValue) => {
        const elements = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
        const element = elements[inputIndex];
        if (!element) return false;
        element.focus();
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(element, nextValue);
        else element.value = nextValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      },
      index,
      value,
    );
    if (!changed) throw new Error(`Input index not found: ${index}`);
  }

  async fillFieldByLabel(labelText: string, value: string): Promise<void> {    for (let attempt = 0; attempt < 10; attempt += 1) {
      const changed = await this.page.evaluate(
        (label, nextValue) => {
          const normalize = (input: string) => input.replace(/\s+/g, ' ').trim();
          const labelElement = Array.from(document.querySelectorAll('label')).find((element) =>
            normalize((element as HTMLElement).innerText).includes(normalize(label)),
          );
          const container = labelElement?.parentElement;
          const field = container?.querySelector('input,textarea,select') as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | null;
          if (!field) return false;
          field.focus();
          const prototype =
            field instanceof HTMLTextAreaElement
              ? HTMLTextAreaElement.prototype
              : field instanceof HTMLSelectElement
              ? HTMLSelectElement.prototype
              : HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (descriptor) descriptor.call(field, nextValue);
          else field.value = nextValue;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        },
        labelText,
        value,
      );
      if (!changed) throw new Error(`Field not found by label: ${labelText}`);
      await this.sleep(300);
      const retained = await this.page.evaluate(
        (label, expected) => {
          const normalize = (input: string) => input.replace(/\s+/g, ' ').trim();
          const labelElement = Array.from(document.querySelectorAll('label')).find((element) =>
            normalize((element as HTMLElement).innerText).includes(normalize(label)),
          );
          const field = labelElement?.parentElement?.querySelector('input,textarea,select') as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | null;
          return field ? field.value === expected : false;
        },
        labelText,
        value,
      );
      if (retained) return;
    }
    throw new Error(`Field value did not persist (hydration race?): ${labelText}`);
  }

  async clickAndWaitForText(
    actionText: string,
    expectedText: string,
    options: { attempts?: number; timeout?: number } = {},
  ): Promise<void> {
    const attempts = options.attempts ?? 3;
    const timeout = options.timeout ?? 15_000;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      await this.clickText(actionText, { allowDiv: false });
      try {
        await this.waitForText(expectedText, timeout);
        return;
      } catch {
        if (attempt === attempts) {
          throw new Error(`Action "${actionText}" did not produce "${expectedText}" after ${attempts} attempts`);
        }
        await this.sleep(1_200);
      }
    }
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key as any);
  }

  async setValueBySelector(selector: string, value: string): Promise<void> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const changed = await this.page.evaluate(
        (targetSelector, nextValue) => {
          const element = document.querySelector(targetSelector) as HTMLInputElement | null;
          if (!element) return false;
          element.focus();
          const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          if (descriptor) descriptor.call(element, nextValue);
          else element.value = nextValue;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        },
        selector,
        value,
      );
      if (!changed) throw new Error(`Input not found by selector: ${selector}`);
      await this.sleep(300);
      const retained = await this.page.evaluate(
        (targetSelector, expected) => {
          const element = document.querySelector(targetSelector) as HTMLInputElement | null;
          return element ? element.value === expected : false;
        },
        selector,
        value,
      );
      if (retained) return;
    }
    throw new Error(`Input value did not persist (hydration race?): ${selector}`);
  }

  async screenshot(name: string): Promise<string> {
    const safeName = name.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 90);
    const file = path.join(this.artifactsDir, `${safeName}.png`);
    await this.page.screenshot({ path: file, fullPage: false });
    return file;
  }

  async dismissModal(): Promise<void> {
    await this.page.keyboard.press('Escape').catch(() => undefined);
    const clicked = await this.page.evaluate(() => {
      const labels = ['إلغاء', 'إغلاق', 'رجوع', '×', 'تخطي', 'لاحقاً'];
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const candidates = Array.from(document.querySelectorAll('button,[role="button"]')).filter(visible);
      const target = candidates.find((element) => {
        const label = (element as HTMLElement).innerText.replace(/\s+/g, ' ').trim();
        return labels.some((candidate) => label === candidate || label.startsWith(candidate + ' '));
      });
      if (!target) return false;
      (target as HTMLElement).click();
      return true;
    });
    if (clicked) await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async waitForModal(expectedText?: string, timeout = 20_000): Promise<void> {
    await this.page.waitForFunction(
      (needle) => {
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const overlays = Array.from(document.querySelectorAll('body *')).filter((element) => {
          if (!visible(element)) return false;
          const style = getComputedStyle(element);
          if (style.position !== 'fixed') return false;
          const rect = element.getBoundingClientRect();
          return rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.5;
        });
        if (!overlays.length) return false;
        if (!needle) return true;
        return overlays.some((overlay) => (overlay as HTMLElement).innerText.includes(needle));
      },
      { timeout, polling: 250 },
      expectedText || '',
    );
  }

  async controlsInventory(): Promise<{
    buttons: Array<{ label: string; disabled: boolean; named: boolean }>;
    links: Array<{ label: string; href: string; named: boolean }>;
    inputs: Array<{ tag: string; type: string; placeholder: string; named: boolean }>;
  }> {
    const inventory = await this.page.evaluate(() => {
      const visible = (element: Element) => {
        if (element.closest('nextjs-portal')) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const buttons = Array.from(document.querySelectorAll('button')).filter(visible).map((element) => {
        const label = normalize(
          (element as HTMLElement).innerText ||
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            '',
        );
        return { label, disabled: (element as HTMLButtonElement).disabled, named: label.length > 0 };
      });
      const links = Array.from(document.querySelectorAll('a')).filter(visible).map((element) => {
        const label = normalize(
          (element as HTMLElement).innerText ||
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            '',
        );
        return { label, href: element.getAttribute('href') || '', named: label.length > 0 };
      });
      const inputs = Array.from(document.querySelectorAll('input,select,textarea')).filter(visible).map((element) => {
        const placeholder = element.getAttribute('placeholder') || '';
        const label =
          placeholder ||
          element.getAttribute('aria-label') ||
          element.getAttribute('title') ||
          element.getAttribute('name') ||
          '';
        return {
          tag: element.tagName.toLowerCase(),
          type: element.getAttribute('type') || '',
          placeholder,
          named: label.length > 0 || element.tagName === 'SELECT' || (element as HTMLInputElement).type === 'checkbox',
        };
      });
      return { buttons, links, inputs };
    });
    this.inventory.push({
      route: this.currentRoute,
      buttons: inventory.buttons.length,
      links: inventory.links.length,
      inputs: inventory.inputs.length,
    });
    return inventory;
  }

  async check(
    name: string,
    run: () => Promise<void>,
    options: { suite?: string; screenshotOnFailure?: boolean } = {},
  ): Promise<boolean> {
    const suite = options.suite || this.currentSuite;
    const started = Date.now();
    try {
      await run();
      this.checks.push({ suite, name, ok: true, skipped: false, durationMs: Date.now() - started });
      process.stdout.write(`  PASS  ${name}\n`);
      return true;
    } catch (error: any) {
      let screenshot: string | undefined;
      if (options.screenshotOnFailure !== false) {
        screenshot = await this.screenshot(`FAIL-${suite}-${name}`).catch(() => undefined);
      }
      const details = String(error?.stack || error?.message || error).slice(0, 4_000);
      this.checks.push({
        suite,
        name,
        ok: false,
        skipped: false,
        durationMs: Date.now() - started,
        details,
        screenshot,
      });
      process.stdout.write(`  FAIL  ${name}\n         ${String(error?.message || error).slice(0, 300)}\n`);
      return false;
    }
  }

  addNote(note: string): void {
    const value = note.trim();
    if (value && !this.notes.includes(value)) this.notes.push(value);
  }

  pageMessages(): { pageErrors: string[]; consoleErrors: string[]; failedRequests: Array<{ url: string; status: number }> } {
    return {
      pageErrors: [...this.pageErrors],
      consoleErrors: [...this.consoleErrors],
      failedRequests: [...this.failedRequests],
    };
  }

  skip(name: string, reason: string): void {
    this.checks.push({
      suite: this.currentSuite,
      name,
      ok: true,
      skipped: true,
      durationMs: 0,
      details: reason,
    });
    process.stdout.write(`  SKIP  ${name} (${reason})\n`);
  }

  summary() {
    const total = this.checks.length;
    const passed = this.checks.filter((check) => check.ok && !check.skipped).length;
    const failed = this.checks.filter((check) => !check.ok).length;
    const skipped = this.checks.filter((check) => check.skipped).length;
    return { total, passed, failed, skipped, checks: this.checks };
  }

  writeReport(): { jsonPath: string; markdownPath: string; summary: ReturnType<UiHarness['summary']> } {
    const summary = this.summary();
    const jsonPath = path.join(this.artifactsDir, 'report.json');
    const markdownPath = path.join(this.artifactsDir, 'report.md');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

    const lines: string[] = [];
    lines.push('# Labryo UI E2E Report');
    lines.push('');
    lines.push(`- Base URL: ${this.baseUrl}`);
    lines.push(`- Date: ${new Date().toISOString()}`);
    lines.push(`- Total: ${summary.total}`);
    lines.push(`- Passed: ${summary.passed}`);
    lines.push(`- Failed: ${summary.failed}`);
    lines.push(`- Skipped: ${summary.skipped}`);
    lines.push('');
    lines.push('| Suite | Test | Result | Duration |');
    lines.push('| --- | --- | --- | --- |');
    for (const check of this.checks) {
      const marker = check.skipped ? 'SKIP' : check.ok ? 'PASS' : 'FAIL';
      lines.push(`| ${check.suite} | ${check.name.replace(/\|/g, '/')} | ${marker} | ${check.durationMs} ms |`);
    }
    if (this.inventory.length) {
      const totals = this.inventory.reduce(
        (accumulator, entry) => ({
          buttons: accumulator.buttons + entry.buttons,
          links: accumulator.links + entry.links,
          inputs: accumulator.inputs + entry.inputs,
        }),
        { buttons: 0, links: 0, inputs: 0 },
      );
      lines.push('');
      lines.push('## Interactive control inventory');
      lines.push('');
      lines.push(`Total: ${totals.buttons} buttons, ${totals.links} links, ${totals.inputs} inputs across ${this.inventory.length} page loads.`);
      lines.push('');
      lines.push('| Route | Buttons | Links | Inputs |');
      lines.push('| --- | --- | --- | --- |');
      for (const entry of this.inventory) {
        lines.push(`| ${entry.route} | ${entry.buttons} | ${entry.links} | ${entry.inputs} |`);
      }
    }
    if (this.notes.length) {
      lines.push('');
      lines.push('## Diagnostics / Notes');
      for (const note of this.notes) lines.push(`- ${note}`);
    }
    if (summary.failed) {
      lines.push('');
      lines.push('## Failures');
      for (const check of this.checks.filter((item) => !item.ok)) {
        lines.push('');
        lines.push(`### ${check.suite} / ${check.name}`);
        lines.push('```');
        lines.push(String(check.details || '').slice(0, 2_000));
        lines.push('```');
        if (check.screenshot) lines.push(`Screenshot: ${check.screenshot}`);
      }
    }
    fs.writeFileSync(markdownPath, lines.join('\n'), 'utf8');
    return { jsonPath, markdownPath, summary };
  }

  async close(): Promise<void> {
    await this.browser?.close().catch(() => undefined);
  }
}
