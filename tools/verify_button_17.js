const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function main() {
  const edgePath = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: edgePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Click specifically on the rail button that has 'Biochemistry'
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bioBtn = btns.find(b => b.textContent.includes('Biochemistry'));
    if (bioBtn) bioBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const rows = await page.evaluate(() => {
    const container = document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]');
    return Array.from(container).map(r => r.innerText.replace(/\n/g, ' -- '));
  });

  console.log(`Rendered ${rows.length} rows in Biochemistry:`);
  rows.slice(0, 20).forEach((r, i) => console.log(`${i + 1}. ${r}`));

  const targetChecks = [
    'Fasting Blood Sugar',
    'Blood Urea',
    'Glycated Hemoglobin',
    'Serum Creatinine',
    'Random Blood Sugar',
    'Serum Uric Acid',
    'Total Cholesterol',
    'Triglycerides'
  ];

  console.log('\n--- TARGET POSITIONS ---');
  targetChecks.forEach(name => {
    const idx = rows.findIndex(r => r.toLowerCase().includes(name.toLowerCase()));
    console.log(`${name}: ${idx !== -1 ? 'Position ' + (idx + 1) : 'NOT FOUND'}`);
  });

  const artifactDir = path.resolve('C:\\Users\\azzez\\.gemini\\antigravity\\brain\\1f3c6fdd-b38a-43ab-86c2-e78a14799cc3');
  const screenshotPath = path.join(artifactDir, 'biochemistry_prioritization_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('\nSaved verification screenshot to:', screenshotPath);

  await browser.close();
}

main().catch(console.error);
