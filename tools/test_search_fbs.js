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
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Type FBS in the search input
  await page.type('input[placeholder*="Search by name"]', 'FBS');
  await new Promise(r => setTimeout(r, 1000));

  const searchFBS = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => r.querySelector('span[style*="unicode-bidi: isolate"]')?.textContent.trim()).filter(Boolean);
  });
  console.log('Search for FBS rendered:', searchFBS);

  // Clear search and type Urea
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search by name"]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.type('input[placeholder*="Search by name"]', 'Urea');
  await new Promise(r => setTimeout(r, 1000));

  const searchUrea = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => r.querySelector('span[style*="unicode-bidi: isolate"]')?.textContent.trim()).filter(Boolean);
  });
  console.log('Search for Urea rendered:', searchUrea);

  await browser.close();
}

test().catch(console.error);
