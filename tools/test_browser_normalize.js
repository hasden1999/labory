const puppeteer = require('puppeteer');
const fs = require('fs');

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
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const raw = localStorage.getItem('labryo_cached_tests');
    const tests = raw ? JSON.parse(raw) : [];

    const fbs = tests.find(t => t.code === 'FBS');
    const hba1c = tests.find(t => t.code === 'HBA1C');
    const urea = tests.find(t => t.code === 'UREA');
    const creat = tests.find(t => t.code === 'CREAT');

    return {
      fbs: fbs ? { code: fbs.code, name: fbs.name, category: fbs.category, active: fbs.active } : null,
      hba1c: hba1c ? { code: hba1c.code, name: hba1c.name, category: hba1c.category, active: hba1c.active } : null,
      urea: urea ? { code: urea.code, name: urea.name, category: urea.category, active: urea.active } : null,
      creat: creat ? { code: creat.code, name: creat.name, category: creat.category, active: creat.active } : null,
    };
  });

  console.log('Result from browser test objects:', JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(console.error);
