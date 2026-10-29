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

  // 1. Check Most Used tab (default tab)
  const mostUsedRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => r.innerText.replace(/\n/g, ' -- '));
  });
  console.log('--- MOST USED TAB (Default) ---');
  console.log('Count:', mostUsedRows.length);
  mostUsedRows.slice(0, 15).forEach((r, i) => console.log(`${i + 1}. ${r}`));

  // 2. Click Biochemistry
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Biochemistry'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const bioRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => r.innerText.replace(/\n/g, ' -- '));
  });
  console.log('\n--- BIOCHEMISTRY TAB ---');
  console.log('Count:', bioRows.length);
  bioRows.slice(0, 20).forEach((r, i) => console.log(`${i + 1}. ${r}`));

  // Positions of key tests
  console.log('\n--- KEY TESTS POSITIONS IN BIOCHEMISTRY ---');
  ['Fasting Blood Sugar', 'HbA1c', 'Glycated Hemoglobin', 'Blood Urea', 'Serum Creatinine', 'Serum Uric Acid', 'Total Cholesterol'].forEach(term => {
    const idx = bioRows.findIndex(r => r.toLowerCase().includes(term.toLowerCase()));
    console.log(`Position of "${term}":`, idx !== -1 ? idx + 1 : 'NOT FOUND');
  });

  // Capture screenshot to artifact directory
  const artifactDir = path.resolve('C:\\Users\\azzez\\.gemini\\antigravity\\brain\\1f3c6fdd-b38a-43ab-86c2-e78a14799cc3');
  const screenshotPath = path.join(artifactDir, 'biochemistry_prioritization_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('\nSaved verification screenshot to:', screenshotPath);

  await browser.close();
}

main().catch(console.error);
