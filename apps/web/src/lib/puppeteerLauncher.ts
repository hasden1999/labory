import fs from 'fs';

declare const __non_webpack_require__: any;

export function getSystemBrowserPath(): string | undefined {
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

export async function launchBrowser() {
  let puppeteer: any;
  try {
    const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
    const mod = req('puppeteer');
    puppeteer = mod.default || mod;
  } catch (err: any) {
    throw new Error('محرك Puppeteer غير متوفر في هذه البيئة السحابية. ميزة توليد الصور الطبية تعمل على تطبيق سطح المكتب المحلي.');
  }

  const execPath = getSystemBrowserPath();

  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
    ],
  };

  if (execPath) {
    launchOptions.executablePath = execPath;
  } else {
    launchOptions.channel = 'chrome';
  }

  return await puppeteer.launch(launchOptions);
}
