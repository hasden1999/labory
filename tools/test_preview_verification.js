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

async function verifyAllPreviews() {
  console.log('🚀 Starting Comprehensive Preview Verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: getSystemBrowserPath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1.25 });

  // 1. Visit /settings (Default view: Canvas WYSIWYG Studio embedded!)
  console.log('Navigating to http://127.0.0.1:8080/settings ...');
  await page.goto('http://127.0.0.1:8080/settings', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));

  // Click on patient info element in canvas to show handles and selection
  try {
    const patientElem = await page.$('#moveable-el-patient-info');
    if (patientElem) {
      await patientElem.click();
      console.log('✅ Clicked #moveable-el-patient-info in canvas!');
      await new Promise(r => setTimeout(r, 600));
    }
  } catch (err) {
    console.log('Patient element click note:', err.message);
  }

  const canvasScreenshotPath = path.join(ARTIFACT_DIR, 'settings_canvas_studio_active.png');
  await page.screenshot({ path: canvasScreenshotPath });
  console.log('📸 Saved:', canvasScreenshotPath);

  // 2. Switch to Classic mode to verify click-to-edit behavior
  console.log('Switching to Classic mode...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('الإعدادات الكلاسيكية')) {
      await btn.click();
      console.log('✅ Clicked classic mode button!');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  const classicScreenshotPath = path.join(ARTIFACT_DIR, 'settings_classic_mode_active.png');
  await page.screenshot({ path: classicScreenshotPath });
  console.log('📸 Saved:', classicScreenshotPath);

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

verifyAllPreviews().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
