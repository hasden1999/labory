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
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check tests in window/localStorage before clicking
  const catalogCheck = await page.evaluate(() => {
    const raw = localStorage.getItem('labryo_cached_tests');
    const tests = raw ? JSON.parse(raw) : [];
    const bioTests = tests.filter(t => {
      const c = (t.category || '').toLowerCase();
      return c.includes('كيمياء') || c.includes('chemistry') || c.includes('سكري') || c.includes('كبد') || c.includes('كلى') || c.includes('دهون');
    });
    return {
      total: tests.length,
      bioTotal: bioTests.length,
      hasFBS: !!tests.find(t => t.code === 'FBS'),
      hasUREA: !!tests.find(t => t.code === 'UREA'),
      hasHBA1C: !!tests.find(t => t.code === 'HBA1C'),
      hasCREAT: !!tests.find(t => t.code === 'CREAT'),
      ureaCategory: tests.find(t => t.code === 'UREA')?.category,
      hba1cCategory: tests.find(t => t.code === 'HBA1C')?.category,
      fbsCategory: tests.find(t => t.code === 'FBS')?.category,
      creatCategory: tests.find(t => t.code === 'CREAT')?.category,
    };
  });
  console.log('Catalog check from localStorage:', catalogCheck);

  // Click Biochemistry
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Biochemistry'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const renderedRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => {
      const sp = r.querySelector('span[style*="unicode-bidi: isolate"]');
      const priceSp = r.querySelector('span[style*="font-weight: 700"]');
      return {
        name: sp ? sp.textContent.trim() : '',
        raw: r.innerText.replace(/\n/g, ' -- ')
      };
    });
  });

  console.log(`Rendered ${renderedRows.length} tests under Biochemistry:`);
  renderedRows.forEach((r, i) => console.log(`${i + 1}. [${r.name}] -> ${r.raw}`));

  await browser.close();
}

main().catch(console.error);
