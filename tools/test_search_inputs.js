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

  // Check before clicking Biochemistry
  const searchForTests = await page.evaluate(() => {
    const raw = localStorage.getItem('labryo_cached_tests');
    const tests = raw ? JSON.parse(raw) : [];

    // Let's find tests matching code
    const fbs = tests.find(t => t.code === 'FBS');
    const urea = tests.find(t => t.code === 'UREA');
    const creat = tests.find(t => t.code === 'CREAT');

    return {
      fbs,
      urea,
      creat,
      allCodes: tests.map(t => t.code).filter(c => ['FBS', 'UREA', 'CREAT', 'BUN', 'RBS', 'HBA1C'].includes(c)),
    };
  });

  console.log('Search in localStorage:', JSON.stringify(searchForTests, null, 2));

  // Now let's type 'FBS' in the search bar!
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('FBS');
    await new Promise(r => setTimeout(r, 800));

    const searchedRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
      return rows.map(r => r.innerText.replace(/\n/g, ' -- '));
    });

    console.log('Search for FBS rendered rows:', searchedRows);
  } else {
    console.log('Search input NOT found!');
  }

  // Now let's type 'Urea' in the search bar!
  await page.evaluate(() => {
    const inp = document.querySelector('input[placeholder*="Search"]');
    if (inp) {
      inp.value = '';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  if (searchInput) {
    await searchInput.type('Urea');
    await new Promise(r => setTimeout(r, 800));

    const ureaRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
      return rows.map(r => r.innerText.replace(/\n/g, ' -- '));
    });

    console.log('Search for Urea rendered rows:', ureaRows);
  }

  await browser.close();
}

main().catch(console.error);
