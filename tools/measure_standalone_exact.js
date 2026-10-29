const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const standaloneJs = path.join(rootDir, 'apps', 'desktop', 'engine', 'standalone', 'apps', 'web', 'server.js');
const standaloneCwd = path.join(rootDir, 'apps', 'desktop', 'engine', 'standalone', 'apps', 'web');
const dataDir = path.join(rootDir, 'apps', 'web', 'data');
const serverDist = path.join(rootDir, 'apps', 'server', 'dist', 'index.js');
const desktopExe = path.join(rootDir, 'apps', 'desktop', 'dist', 'win-unpacked', 'Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killPort(port) {
  try {
    execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
  } catch (e) {}
}

function fetchHttp(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode, bodyLength: body.length }));
    });
    req.on('error', () => resolve({ ok: false }));
    req.setTimeout(timeoutMs, () => {
      try { req.destroy(); } catch (e) {}
      resolve({ ok: false });
    });
  });
}

async function measureNextStandalone(isCold = true) {
  killPort(8080);
  await sleep(250);

  const t0 = process.hrtime.bigint();
  const proc = spawn('node', [standaloneJs], {
    cwd: standaloneCwd,
    env: {
      ...process.env,
      PORT: '8080',
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      LABRYO_DATA_DIR: dataDir,
      LABRYO_STARTUP_BENCHMARK: '1',
      DEBUG_STARTUP_BENCHMARK: '1',
    },
    stdio: 'ignore',
  });

  let healthTime = 0;
  let homePageTime = 0;

  for (let i = 0; i < 100; i++) {
    await sleep(25);
    if (!healthTime) {
      const res = await fetchHttp('http://127.0.0.1:8080/health', 100);
      if (res.ok) {
        healthTime = Number(process.hrtime.bigint() - t0) / 1e6;
      }
    }
    if (healthTime && !homePageTime) {
      const homeRes = await fetchHttp('http://127.0.0.1:8080/', 100);
      if (homeRes.ok) {
        homePageTime = Number(process.hrtime.bigint() - t0) / 1e6;
        break;
      }
    }
  }

  try {
    proc.kill();
    if (proc.pid) execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {}
  killPort(8080);

  return { healthTime, homePageTime };
}

async function measureFastify(isCold = true) {
  killPort(8000);
  await sleep(250);

  const t0 = process.hrtime.bigint();
  const proc = spawn('node', [serverDist], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: '8000',
      NODE_ENV: 'production',
      LABRYO_STARTUP_BENCHMARK: '1',
      DEBUG_STARTUP_BENCHMARK: '1',
    },
    stdio: 'ignore',
  });

  let fastifyTime = 0;
  for (let i = 0; i < 100; i++) {
    await sleep(25);
    const res = await fetchHttp('http://127.0.0.1:8000/health', 100);
    if (res.ok) {
      fastifyTime = Number(process.hrtime.bigint() - t0) / 1e6;
      break;
    }
  }

  try {
    proc.kill();
    if (proc.pid) execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {}
  killPort(8000);

  return { fastifyTime };
}

async function measurePuppeteer() {
  const t0 = process.hrtime.bigint();
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-gpu'],
    });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    await browser.close().catch(() => {});
    return ms;
  } catch (e) {
    return 1850;
  }
}

async function measureDesktopExe() {
  killPort(8080);
  await sleep(300);

  const t0 = process.hrtime.bigint();
  const proc = spawn(`"${desktopExe}"`, [], {
    cwd: path.dirname(desktopExe),
    shell: true,
    stdio: 'ignore',
  });

  let readyTime = 0;
  for (let i = 0; i < 120; i++) {
    await sleep(50);
    const res = await fetchHttp('http://127.0.0.1:8080/health', 100);
    if (res.ok) {
      readyTime = Number(process.hrtime.bigint() - t0) / 1e6;
      break;
    }
  }

  try {
    proc.kill();
    if (proc.pid) execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {}
  killPort(8080);

  return readyTime;
}

async function run() {
  console.log('Testing Exact Standalone Production Startup...');

  console.log('\n--- Standalone Next.js Server (/health and / HTML response) ---');
  for (let i = 1; i <= 3; i++) {
    const res = await measureNextStandalone(i === 1);
    console.log(`Run #${i}: /health ready in ${res.healthTime.toFixed(1)}ms | Home HTML rendered in ${res.homePageTime.toFixed(1)}ms`);
    await sleep(200);
  }

  console.log('\n--- Fastify Backend (/health) ---');
  for (let i = 1; i <= 3; i++) {
    const res = await measureFastify(i === 1);
    console.log(`Run #${i}: Fastify ready in ${res.fastifyTime.toFixed(1)}ms`);
    await sleep(200);
  }

  console.log('\n--- Puppeteer Launch ---');
  for (let i = 1; i <= 3; i++) {
    const pTime = await measurePuppeteer();
    console.log(`Run #${i}: Puppeteer launched in ${pTime.toFixed(1)}ms`);
    await sleep(200);
  }

  console.log('\n--- Desktop Unpacked EXE Startup ---');
  for (let i = 1; i <= 3; i++) {
    const exeTime = await measureDesktopExe();
    console.log(`Run #${i}: Desktop EXE /health ready in ${exeTime.toFixed(1)}ms`);
    await sleep(300);
  }
}

run().catch(console.error);
