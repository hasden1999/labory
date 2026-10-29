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

  const domLocations = await page.evaluate(() => {
    const findElementLocations = (text) => {
      const all = Array.from(document.querySelectorAll('*'));
      const matching = all.filter(el => {
        return el.children.length === 0 && (el.textContent || '').includes(text);
      });
      return matching.map(el => {
        let path = [];
        let curr = el;
        while (curr && curr !== document.body) {
          path.unshift(curr.tagName + (curr.className ? '.' + curr.className.split(' ').join('.') : ''));
          curr = curr.parentElement;
        }
        return {
          text: el.textContent.trim(),
          path: path.join(' > ')
        };
      });
    };

    return {
      urea: findElementLocations('Blood Urea'),
      hba1c: findElementLocations('HbA1c'),
      creat: findElementLocations('Serum Creatinine'),
    };
  });

  console.log('DOM Locations:', JSON.stringify(domLocations, null, 2));
  await browser.close();
}

main().catch(console.error);
