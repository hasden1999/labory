const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\azzez\\.gemini\\antigravity\\brain\\2321e239-41a2-4f98-9c40-3c3d2a577027';

function getSystemBrowserPath() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths = [
    localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
    localAppData ? path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
    path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

async function verifyTemplates() {
  console.log('🚀 Verifying Template Switcher in Canvas Studio...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: getSystemBrowserPath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1.25 });

  await page.goto('http://127.0.0.1:8080/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Select element to show inspector
  try {
    const el = await page.$('#moveable-el-patient-info');
    if (el) await el.click();
  } catch (e) {}

  await new Promise(r => setTimeout(r, 600));

  const screenshotPath = path.join(ARTIFACT_DIR, 'settings_canvas_studio_active.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Updated settings_canvas_studio_active.png');

  await browser.close();
  console.log('🎉 Done verification!');
}

verifyTemplates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
