import fs from 'fs';

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
  const puppeteer = (await import('puppeteer')).default;
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
