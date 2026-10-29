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

  const details = await page.evaluate(() => {
    const findSpan = (text) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const s = spans.find(x => x.textContent.trim() === text);
      if (!s) return null;
      let p = s;
      const parents = [];
      while (p && p !== document.body) {
        parents.push({ tag: p.tagName, id: p.id, className: p.className, textSnippet: p.innerText?.slice(0, 50) });
        p = p.parentElement;
      }
      return { found: true, text: s.textContent, parents };
    };

    return {
      urea: findSpan('Blood Urea'),
      hba1c: findSpan('Glycated Hemoglobin (HbA1c)'),
      creat: findSpan('Serum Creatinine'),
    };
  });

  console.log('Details:', JSON.stringify(details, null, 2));
  await browser.close();
}

main().catch(console.error);
