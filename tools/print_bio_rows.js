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

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Biochemistry'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const rendered = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => {
      const text = r.innerText.replace(/\n/g, ' -- ');
      return text;
    });
  });

  console.log('Total rendered in Biochemistry:', rendered.length);
  rendered.forEach((r, i) => console.log(`${i + 1}. ${r}`));
  await browser.close();
}

main().catch(console.error);
