import fs from 'fs';
import path from 'path';

declare const __non_webpack_require__: any;

let sharedBrowserInstance: any = null;
let launchMutexPromise: Promise<any> | null = null;

export function getSystemBrowserPath(): string | undefined {
  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths: string[] = [
    // 1. Chrome in LocalAppData (user-level install without admin rights)
    localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
    // 2. Edge in LocalAppData (user-level)
    localAppData ? path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
    // 3. System-wide Chrome
    path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    // 4. System-wide Edge (Edge is present on all Windows 10/11 installations)
    path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    // Hardcoded drive fallbacks on C: and D:
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'D:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'D:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'D:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'D:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

/**
 * Returns a shared, high-performance in-memory Puppeteer Browser singleton.
 * Uses a launch mutex to serialize concurrent initial requests and listens
 * to 'disconnected' event to auto-heal if the browser process terminates.
 */
export async function getSharedBrowser(): Promise<any> {
  // Return active singleton if still connected
  if (sharedBrowserInstance && typeof sharedBrowserInstance.isConnected === 'function') {
    if (sharedBrowserInstance.isConnected()) {
      return sharedBrowserInstance;
    } else {
      sharedBrowserInstance = null;
    }
  }

  // If a launch is in progress, wait for it (mutex lock)
  if (launchMutexPromise) {
    return launchMutexPromise;
  }

  // Initiate singleton launch with mutex
  launchMutexPromise = (async () => {
    try {
      let puppeteer: any;
      try {
        const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
        const mod = req('puppeteer');
        puppeteer = mod.default || mod;
      } catch (err: any) {
        throw new Error('محرك Puppeteer غير متوفر في هذه البيئة السحابية. ميزة توليد الصور الطبية تعمل على تطبيق سطح المكتب المحلي.');
      }

      const execPath = getSystemBrowserPath();

      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-component-update',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-sync',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-first-run',
          '--no-default-browser-check',
          '--font-render-hinting=none',
        ],
      };

      if (execPath) {
        launchOptions.executablePath = execPath;
      } else {
        launchOptions.channel = 'chrome';
      }

      const browser = await puppeteer.launch(launchOptions);

      // Auto-healing: Reset state if browser crashes or is closed externally
      browser.on('disconnected', () => {
        console.warn('[PuppeteerLauncher] Shared browser disconnected. Resetting singleton state.');
        if (sharedBrowserInstance === browser) {
          sharedBrowserInstance = null;
        }
        launchMutexPromise = null;
      });

      sharedBrowserInstance = browser;
      return browser;
    } finally {
      launchMutexPromise = null;
    }
  })();

  return launchMutexPromise;
}

/**
 * Backward compatibility alias for getSharedBrowser
 */
export async function launchBrowser(): Promise<any> {
  return getSharedBrowser();
}

/**
 * Closes the shared browser singleton instance (useful during shutdown or test cleanup).
 */
export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowserInstance) {
    try {
      await sharedBrowserInstance.close();
    } catch {
      // ignore
    } finally {
      sharedBrowserInstance = null;
      launchMutexPromise = null;
    }
  }
}

export interface RenderReportImageOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  quality?: number;
  type?: 'jpeg' | 'png';
  baseUrl?: string;
  timeout?: number;
}

/**
 * Renders an HTML string to a screenshot Buffer using the shared browser singleton.
 * Guaranteed to clean up individual tabs in a finally block to prevent memory leaks.
 */
export async function renderReportImage(
  htmlContent: string,
  options: RenderReportImageOptions = {}
): Promise<Buffer> {
  const browser = await getSharedBrowser();
  const page = await browser.newPage();
  try {
    const width = options.width || 840;
    const height = options.height || 1100;
    const deviceScaleFactor = options.deviceScaleFactor || 2;
    const type = options.type || 'jpeg';
    const quality = options.quality ?? 92;
    const timeout = options.timeout ?? 15000;

    await page.setViewport({
      width,
      height,
      deviceScaleFactor,
    });

    let html = htmlContent;
    if (options.baseUrl && !html.includes('<base ')) {
      html = html.replace('<head>', `<head>\n  <base href="${options.baseUrl}/">`);
    }

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // Wait for document fonts to finish loading
    await page.evaluateHandle('document.fonts.ready').catch(() => {});

    const screenshotBuffer = await page.screenshot({
      type,
      ...(type === 'jpeg' ? { quality } : {}),
      fullPage: true,
    });

    return Buffer.from(screenshotBuffer);
  } finally {
    await page.close().catch(() => {});
  }
}
