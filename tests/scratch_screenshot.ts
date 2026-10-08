import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

function getSystemBrowserPath(): string | undefined {
  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths: string[] = [
    localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
    localAppData ? path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
    path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

async function run() {
  const execPath = getSystemBrowserPath();
  const launchOptions: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  
  // 1. Initial 1080p Screenshot (clean slate)
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('main', { timeout: 10000 });

  const artifactDir = path.join('C:', 'Users', 'azzez', '.gemini', 'antigravity', 'brain', '74bc7945-9320-4a80-a60a-56d0ee39dcc3');

  // Dismiss any existing toast if present by clicking close buttons
  await page.evaluate(() => {
    document.querySelectorAll('.toast-close').forEach((btn) => (btn as HTMLElement).click());
  });
  await new Promise((r) => setTimeout(r, 400));

  const path1080 = path.join(artifactDir, 'preview_screen_1080p.png');
  await page.screenshot({ path: path1080, fullPage: false });
  console.log('Saved 1080p clean screenshot to:', path1080);

  // 2. Select tests and enter results to show active state matching mockup
  await page.evaluate(() => {
    // Select first 3 tests from the catalog
    const rows = document.querySelectorAll('.catalog-row');
    if (rows[0]) (rows[0] as HTMLElement).click();
    if (rows[1]) (rows[1] as HTMLElement).click();
    if (rows[2]) (rows[2] as HTMLElement).click();

    // Fill patient name & age
    const nameInput = document.querySelector('input[name="patientName"]') as HTMLInputElement;
    if (nameInput) {
      nameInput.value = 'حيدر عبد الحسين الخفاجي';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  await new Promise((r) => setTimeout(r, 600));

  // Enter result values to trigger NORMAL, HIGH, LOW
  await page.evaluate(() => {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    const inputs = document.querySelectorAll('main > div:nth-child(3) input[type="text"]');
    
    if (inputs[0] && nativeSetter) {
      nativeSetter.call(inputs[0], '90');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (inputs[1] && nativeSetter) {
      nativeSetter.call(inputs[1], '15');
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (inputs[2] && nativeSetter) {
      nativeSetter.call(inputs[2], '100');
      inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Close toast if any
    document.querySelectorAll('.toast-close').forEach((btn) => (btn as HTMLElement).click());
  });

  await new Promise((r) => setTimeout(r, 600));

  const pathActive1080 = path.join(artifactDir, 'preview_screen_active_1080p.png');
  await page.screenshot({ path: pathActive1080, fullPage: false });
  console.log('Saved 1080p active screenshot to:', pathActive1080);

  const scroll1080 = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
  console.log('Scroll at 1080p:', scroll1080);

  // 3. Test 1366x768 (standard laptop)
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 400));
  const path768 = path.join(artifactDir, 'preview_screen_768p.png');
  await page.screenshot({ path: path768, fullPage: false });
  console.log('Saved 768p screenshot to:', path768);

  const scroll768 = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
  console.log('Scroll at 768p:', scroll768);

  await browser.close();
}

run().catch(console.error);
