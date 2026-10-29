const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killPort(port) {
  try {
    execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
  } catch (e) {}
}

function checkHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(50, () => {
      try { req.destroy(); } catch (e) {}
      resolve(false);
    });
  });
}

function checkPage(port, path = '/') {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let len = 0;
      res.on('data', d => len += d.length);
      res.on('end', () => resolve({ ok: res.statusCode === 200, len }));
    });
    req.on('error', () => resolve({ ok: false, len: 0 }));
    req.setTimeout(2000, () => {
      try { req.destroy(); } catch (e) {}
      resolve({ ok: false, len: 0 });
    });
  });
}

async function testOnce(runNum) {
  killPort(8080);
  await sleep(200);

  const t0 = process.hrtime.bigint();
  const scriptPath = path.resolve('apps/desktop/engine/standalone/apps/web/server.js');
  const workingDir = path.resolve('apps/desktop/engine/standalone/apps/web');

  const proc = spawn('node', [scriptPath], {
    cwd: workingDir,
    env: {
      ...process.env,
      PORT: '8080',
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      LABRYO_DATA_DIR: path.resolve('apps/web/data'),
    },
    stdio: 'ignore',
  });

  let healthReadyMs = 0;
  for (let i = 0; i < 400; i++) {
    await sleep(20);
    const ready = await checkHealth(8080);
    if (ready) {
      healthReadyMs = Number(process.hrtime.bigint() - t0) / 1e6;
      break;
    }
  }

  const tRenderStart = process.hrtime.bigint();
  const pageRes = await checkPage(8080, '/');
  const renderMs = Number(process.hrtime.bigint() - tRenderStart) / 1e6;
  const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;

  try {
    proc.kill();
    if (proc.pid) execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {}
  killPort(8080);

  console.log(`Run #${runNum}: Server Ready (/health) = ${healthReadyMs.toFixed(1)}ms | Page SSR Render = ${renderMs.toFixed(1)}ms (len: ${pageRes.len} bytes) | Total = ${totalMs.toFixed(1)}ms`);
  return { healthReadyMs, renderMs, totalMs };
}

async function run() {
  console.log('--- Testing Standalone Server Boot Speed ---');
  for (let i = 1; i <= 3; i++) {
    await testOnce(i);
    await sleep(300);
  }
}

run().catch(console.error);
