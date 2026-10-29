const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  console.log('🚀 [Test] Starting Live Browser Automation for WhatsApp Share on /samples...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('  [Browser Console]:', msg.text()));

    console.log('🌐 [Test] Navigating to http://127.0.0.1:8080/samples ...');
    await page.goto('http://127.0.0.1:8080/samples', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log('🔍 [Test] Page title:', await page.title());

    // Find the WhatsApp button in the samples table
    const result = await page.evaluate(async () => {
      const waButtons = Array.from(document.querySelectorAll('button[title*="واتساب"], button[title*="WhatsApp"]'));
      console.log('Found WhatsApp buttons in table:', waButtons.length);
      if (waButtons.length > 0) {
        const btn = waButtons[0];
        console.log('Clicking first WhatsApp button, title:', btn.title);
        btn.click();
        return { clicked: true, title: btn.title };
      }
      return { clicked: false };
    });

    console.log('🖱️ [Test] Result:', result);

    // Wait 12 seconds for full image generation + server dispatch + auto-paste
    console.log('⏳ [Test] Waiting 12 seconds for auto-paste lifecycle to execute...');
    await new Promise(r => setTimeout(r, 12000));

    // Check paste log
    const logPath = path.join(os.tmpdir(), 'labryo-whatsapp-paste.log');
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      const lines = logContent.trim().split('\n');
      console.log('📋 [Test] Tail of labryo-whatsapp-paste.log:');
      console.log(lines.slice(-12).join('\n'));
    }
  } catch (err) {
    console.error('❌ [Test Error]:', err);
  } finally {
    await browser.close();
    console.log('🏁 [Test] Live Browser Test Completed.');
  }
})();
