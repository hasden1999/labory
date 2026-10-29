const puppeteer = require('puppeteer');
const fs = require('fs');

async function test() {
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
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Biochemistry'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const names = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => {
      const sp = r.querySelector('span[style*="unicode-bidi: isolate"]');
      return sp ? sp.textContent.trim() : '';
    }).filter(Boolean);
  });

  console.log('Total tests rendered in Biochemistry:', names.length);
  console.log('First 25 tests:', names.slice(0, 25));
  console.log('Position of FBS:', names.indexOf('Fasting Blood Sugar (FBS)'));
  console.log('Position of Urea:', names.indexOf('Blood Urea'));
  console.log('Position of HbA1c:', names.indexOf('Glycated Hemoglobin (HbA1c)'));
  console.log('Position of Creatinine:', names.indexOf('Serum Creatinine'));

  await browser.close();
}

test().catch(console.error);
