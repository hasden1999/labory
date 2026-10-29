const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWorkspace() {
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
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:8080/ ...');
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('input[placeholder*="Search by name"]', { timeout: 15000 });
  console.log('Reception workspace mounted successfully!');

  // Find all buttons in the profiles row
  const buttonsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
  });
  console.log('Available buttons in UI:', buttonsInfo.filter(b => b.includes('+') || b.includes('باقة') || b.includes('Kidney')));

  // Click the custom package button 'باقة يوريا تجريبية'
  const clickedCustom = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('باقة يوريا تجريبية'));
    if (target) {
      target.click();
      return true;
    }
    return false;
  });
  console.log('Clicked custom package button:', clickedCustom);
  await new Promise(r => setTimeout(r, 1200));

  // Check state after clicking custom package
  const stateAfterCustom = await page.evaluate(() => {
    const text = document.body.innerText;
    const badge = document.querySelector('span[style*="9999px"]')?.textContent || '';
    const ureaMatches = (text.match(/Blood Urea/g) || []).length;
    const bunMatches = (text.match(/Blood Urea Nitrogen/g) || []).length;
    return { badge, ureaMatches, bunMatches };
  });
  console.log('State after clicking custom package:', stateAfterCustom);

  // Click it a second time (idempotency test)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('باقة يوريا تجريبية'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const stateAfterSecond = await page.evaluate(() => {
    const text = document.body.innerText;
    const badge = document.querySelector('span[style*="9999px"]')?.textContent || '';
    const ureaMatches = (text.match(/Blood Urea/g) || []).length;
    return { badge, ureaMatches };
  });
  console.log('State after second click (should remain 1 test):', stateAfterSecond);

  // Click '+ Kidney'
  const clickedKidney = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('+ Kidney'));
    if (target) {
      target.click();
      return true;
    }
    return false;
  });
  console.log('Clicked "+ Kidney" profile:', clickedKidney);
  await new Promise(r => setTimeout(r, 1200));

  const stateAfterKidney = await page.evaluate(() => {
    const text = document.body.innerText;
    const badge = document.querySelector('span[style*="9999px"]')?.textContent || '';
    const ureaMatches = (text.match(/Blood Urea/g) || []).length;
    const bunMatches = (text.match(/Blood Urea Nitrogen/g) || []).length;
    const creatMatches = (text.match(/Serum Creatinine/g) || []).length;
    const uricMatches = (text.match(/Serum Uric Acid/g) || []).length;
    return { badge, ureaMatches, bunMatches, creatMatches, uricMatches };
  });
  console.log('State after clicking Kidney profile:', stateAfterKidney);

  await page.screenshot({ path: 'tools/test_workspace_urea_verified.png' });
  console.log('Verified screenshot saved to tools/test_workspace_urea_verified.png');

  await browser.close();
}

testWorkspace().catch(console.error);
