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
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

async function createCollage() {
  console.log('🎨 Generating 4-in-1 Comparison Collage Image...');
  const browserPath = getSystemBrowserPath();
  
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: browserPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=2400,1600']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1600, deviceScaleFactor: 1.5 });

  const mayoData = fs.readFileSync(path.join(ARTIFACT_DIR, 'model_mayo_sheet.png')).toString('base64');
  const metroData = fs.readFileSync(path.join(ARTIFACT_DIR, 'model_metropolis_sheet.png')).toString('base64');
  const drlalData = fs.readFileSync(path.join(ARTIFACT_DIR, 'model_drlal_sheet.png')).toString('base64');
  const swissData = fs.readFileSync(path.join(ARTIFACT_DIR, 'model_swiss_sheet.png')).toString('base64');

  const collageHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=Inter:wght@600;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #090d16;
          color: #fff;
          font-family: 'Cairo', sans-serif;
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 32px;
          font-weight: 900;
          color: #38bdf8;
          letter-spacing: -0.5px;
        }
        .header p {
          font-size: 16px;
          color: #94a3b8;
          margin-top: 6px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          width: 100%;
          max-width: 2300px;
        }
        .card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.6);
        }
        .card-header {
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #334155;
        }
        .card-header h3 {
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
        }
        .badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          font-family: 'Inter', sans-serif;
        }
        .img-wrapper {
          padding: 16px;
          background: #0f172a;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          flex: 1;
        }
        .img-wrapper img {
          width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>معاينة مقارنة النماذج الطبية السريرية الأربعة الفاخرة</h1>
        <p>Labryo LIMS — 4 Elite Hospital Diagnostic Report Formats</p>
      </div>

      <div class="grid">
        <!-- Card 1 -->
        <div class="card">
          <div class="card-header">
            <h3>1. مايو كلينك السيادي</h3>
            <span class="badge">Mayo Classic</span>
          </div>
          <div class="img-wrapper">
            <img src="data:image/png;base64,${mayoData}" />
          </div>
        </div>

        <!-- Card 2 -->
        <div class="card">
          <div class="card-header">
            <h3>2. متروبوليس الصحي</h3>
            <span class="badge">Metropolis Sapphire</span>
          </div>
          <div class="img-wrapper">
            <img src="data:image/png;base64,${metroData}" />
          </div>
        </div>

        <!-- Card 3 -->
        <div class="card">
          <div class="card-header">
            <h3>3. رويال دكتور لال</h3>
            <span class="badge">Dr Lal Royal</span>
          </div>
          <div class="img-wrapper">
            <img src="data:image/png;base64,${drlalData}" />
          </div>
        </div>

        <!-- Card 4 -->
        <div class="card">
          <div class="card-header">
            <h3>4. السويسري فائق النقاء</h3>
            <span class="badge">Swiss Ultra Minimal</span>
          </div>
          <div class="img-wrapper">
            <img src="data:image/png;base64,${swissData}" />
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(collageHtml, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));

  const collageOut = path.join(ARTIFACT_DIR, 'four_models_comparison_grid.png');
  await page.screenshot({ path: collageOut, fullPage: true });
  console.log('✅ Generated 4-in-1 Collage Image:', collageOut);

  await browser.close();
}

createCollage().catch(err => {
  console.error('Error generating collage:', err);
  process.exit(1);
});
