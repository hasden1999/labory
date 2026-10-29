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

(async () => {
  console.log('Launching browser to test Smart Mode Designer...');
  const browserPath = getSystemBrowserPath();
  console.log('Using browser executable:', browserPath);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: browserPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1540, height: 960 });

    console.log('Navigating to http://127.0.0.1:8080/settings ...');
    await page.goto('http://127.0.0.1:8080/settings', { waitUntil: 'networkidle2', timeout: 30000 });

    // Click Paper & Report Design tab if needed
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Paper & Report Design')) {
        console.log('Found Paper & Report Design tab, clicking...');
        await tab.click();
        await new Promise(r => setTimeout(r, 1500));
        break;
      }
    }

    // Capture screenshot of smart designer in settings
    const screenshotPath = path.join(ARTIFACT_DIR, 'smart_designer_studio_active.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);

    // Click on Results Table tab in the inspector
    const inspectorButtons = await page.$$('.designer-inspector button');
    for (const btn of inspectorButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Table')) {
        console.log('Clicking Table tab in Smart Inspector...');
        await btn.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }

    const tableTabScreenshot = path.join(ARTIFACT_DIR, 'smart_designer_table_tab.png');
    await page.screenshot({ path: tableTabScreenshot });
    console.log(`Saved Table tab screenshot to ${tableTabScreenshot}`);

  } catch (err) {
    console.error('Puppeteer verification error:', err);
  } finally {
    await browser.close();
  }
})();
