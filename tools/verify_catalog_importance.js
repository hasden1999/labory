const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifyCatalogImportance() {
  console.log('🚀 Launching browser to verify category prioritization and auto-learned most used list...');
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

  console.log('🌐 Navigating to http://127.0.0.1:8080...');
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2', timeout: 30000 });

  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Check Most Used list
  const mostUsedTests = await page.evaluate(() => {
    // Collect tests displayed in the catalog list
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => {
      const nameEl = r.querySelector('span[style*="unicode-bidi: isolate"]');
      return nameEl ? nameEl.textContent.trim() : '';
    }).filter(Boolean);
  });

  console.log('📋 Initial "Most used" list top 10 tests:', mostUsedTests.slice(0, 10));

  // 2. Click on "Biochemistry" category button
  console.log('🧪 Clicking "Biochemistry" category...');
  const clickedBio = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const bioBtn = buttons.find(b => b.textContent.includes('Biochemistry') || b.textContent.includes('كيمياء'));
    if (bioBtn) {
      bioBtn.click();
      return true;
    }
    return false;
  });

  console.log('Biochemistry button clicked:', clickedBio);
  await new Promise(r => setTimeout(r, 1500));

  // 3. Inspect top tests displayed under Biochemistry
  const bioTests = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"][style*="padding: 8px 16px"]'));
    return rows.map(r => {
      const nameEl = r.querySelector('span[style*="unicode-bidi: isolate"]');
      return nameEl ? nameEl.textContent.trim() : '';
    }).filter(Boolean);
  });

  console.log('🔬 Biochemistry top 12 tests:');
  bioTests.slice(0, 12).forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}`);
  });

  // Verify that FBS, Urea, HbA1c, Creatinine appear in the top 10
  const top10 = bioTests.slice(0, 10).map(s => s.toLowerCase());
  const hasSugar = top10.some(s => s.includes('sugar') || s.includes('fbs') || s.includes('glucose'));
  const hasUrea = top10.some(s => s.includes('urea'));
  const hasCreat = top10.some(s => s.includes('creatinine'));
  const hasHbA1c = top10.some(s => s.includes('hba1c') || s.includes('glycated'));

  console.log('Verification checks:');
  console.log('  - Has Blood Sugar in top 10:', hasSugar);
  console.log('  - Has Blood Urea in top 10:', hasUrea);
  console.log('  - Has Creatinine in top 10:', hasCreat);
  console.log('  - Has HbA1c in top 10:', hasHbA1c);

  const screenshotPath = path.resolve('C:/Users/azzez/.gemini/antigravity/brain/1f3c6fdd-b38a-43ab-86c2-e78a14799cc3/biochemistry_prioritization_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Screenshot saved to:', screenshotPath);

  await browser.close();

  if (!hasSugar || !hasUrea || !hasCreat || !hasHbA1c) {
    throw new Error('Biochemistry prioritization verification failed: Core tests not in top 10!');
  }

  console.log('🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

verifyCatalogImportance().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
