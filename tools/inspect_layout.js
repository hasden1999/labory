const puppeteer = require('puppeteer-core');

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://127.0.0.1:8080/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const elements = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div, button, section')).map(d => {
      const rect = d.getBoundingClientRect();
      const style = window.getComputedStyle(d);
      return {
        tag: d.tagName,
        className: d.className,
        text: (d.innerText || '').substring(0, 40).replace(/\n/g, ' '),
        rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) },
        bg: style.backgroundColor,
        border: style.borderColor,
        color: style.color,
        display: style.display,
        childrenCount: d.children.length,
      };
    }).filter(d => d.rect.top > 250 && d.rect.top < 700 && d.rect.width > 200);
    return allDivs;
  });
  console.log('ELEMENTS:', JSON.stringify(elements, null, 2));
  await browser.close();
}
inspect().catch(console.error);
