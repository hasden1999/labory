/**
 * Automated Verification for Desktop Device Bridge Daemon
 * Tests the complete loop:
 * Medical Analyzer Socket -> deviceBridgeService (0.0.0.0:5000) -> HTTP Ingest -> LIS Store -> Sample Applied
 */

import net from 'net';
import http from 'http';
import path from 'path';
import { spawn, execSync } from 'child_process';

const deviceBridgeService = require('../../apps/desktop/services/deviceBridgeService');

const ENQ = 0x05;
const ACK = 0x06;
const NAK = 0x15;
const EOT = 0x04;
const STX = 0x02;
const ETX = 0x03;
const CR = 0x0d;
const LF = 0x0a;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function checkHttp(url: string, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      try { req.destroy(); } catch (e) {}
      resolve(false);
    });
  });
}

function killPort(port: number) {
  try {
    execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
  } catch (e) {}
}

function calculateChecksum(buf: Buffer): string {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    sum = (sum + buf[i]) & 0xff;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

async function sendFrame(socket: net.Socket, frameText: string, frameNum: number, corrupt = false): Promise<boolean> {
  const payload = Buffer.concat([
    Buffer.from(`${frameNum % 8}${frameText}\r`, 'utf8'),
    Buffer.from([ETX])
  ]);

  let cs = calculateChecksum(payload);
  if (corrupt) {
    cs = cs === 'FF' ? '00' : 'FF';
  }

  const packet = Buffer.concat([
    Buffer.from([STX]),
    payload,
    Buffer.from(cs, 'ascii'),
    Buffer.from([CR, LF])
  ]);

  return new Promise((resolve, reject) => {
    socket.once('data', (resp) => {
      if (resp[0] === ACK) {
        resolve(true);
      } else if (resp[0] === NAK) {
        resolve(false);
      } else {
        reject(new Error(`Unexpected socket byte: 0x${resp[0]?.toString(16)}`));
      }
    });
    socket.write(packet);
  });
}

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 VERIFYING AUTOMATED DESKTOP DEVICE BRIDGE DAEMON (0.0.0.0:5000)');
  console.log('========================================================================\n');

  // 1. Ensure Web Server is running on 8080
  let isWebUp = await checkHttp('http://127.0.0.1:8080/ready');
  let spawnedWeb: any = null;

  if (!isWebUp) {
    console.log('⏳ Starting background Next.js web server on 8080...');
    killPort(8080);
    await sleep(300);

    const nodeBin = path.resolve('apps/desktop/engine/node.exe');
    const webScript = path.resolve('apps/desktop/engine/standalone/apps/web/server.js');
    const webCwd = path.resolve('apps/desktop/engine/standalone/apps/web');

    spawnedWeb = spawn(nodeBin, [webScript], {
      cwd: webCwd,
      env: {
        ...process.env,
        PORT: '8080',
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
        LABRYO_DATA_DIR: path.resolve('apps/web/data'),
      },
      stdio: 'ignore'
    });

    for (let i = 0; i < 40; i++) {
      await sleep(300);
      isWebUp = await checkHttp('http://127.0.0.1:8080/ready');
      if (isWebUp) break;
    }

    if (!isWebUp) {
      throw new Error('Web server failed to boot on port 8080 within budget');
    }
  }
  console.log('✅ Web server is ready on http://127.0.0.1:8080');

  // 2. Start Device Bridge Daemon on port 5000 (0.0.0.0)
  killPort(5000);
  await sleep(300);

  await deviceBridgeService.start({
    port: 5000,
    host: '0.0.0.0',
    webPort: 8080,
  });
  console.log('✅ Device Bridge Daemon listening on 0.0.0.0:5000');

  // 3. Connect as Analyzer Simulator
  const client = new net.Socket();
  await new Promise<void>((resolve, reject) => {
    client.connect(5000, '127.0.0.1', () => resolve());
    client.on('error', reject);
  });
  console.log('🔌 Connected to Bridge Daemon via TCP Socket');

  // --- Scenario 1: Valid CBC Transmission ---
  console.log('\n--- Scenario 1: Transmitting 5-Part CBC ASTM frames ---');
  // ENQ
  const enqAck = await new Promise<boolean>((resolve) => {
    client.once('data', (d) => resolve(d[0] === ACK));
    client.write(Buffer.from([ENQ]));
  });
  if (!enqAck) throw new Error('ENQ Handshake was rejected!');
  console.log('  ✓ <ENQ> -> Received <ACK>');

  // Header, Patient, Order
  const hAck = await sendFrame(client, 'H|\\^&|||Mindray^BC-5000|||||||P|1', 1);
  if (!hAck) throw new Error('Header frame rejected');
  console.log('  ✓ Frame 1 (Header) -> ACK');

  const pAck = await sendFrame(client, 'P|1||1001||Zaid Ali||19950101|M', 2);
  if (!pAck) throw new Error('Patient frame rejected');
  console.log('  ✓ Frame 2 (Patient #1001) -> ACK');

  const oAck = await sendFrame(client, 'O|1|1001||^^^CBC||||||||||||||||||||F', 3);
  if (!oAck) throw new Error('Order frame rejected');
  console.log('  ✓ Frame 3 (Order CBC) -> ACK');

  // 5 Result frames
  const cbcResults = [
    { code: 'WBC', val: '7.15', unit: '10*3/uL', range: '4.0-10.0' },
    { code: 'RBC', val: '4.85', unit: '10*6/uL', range: '3.8-5.8' },
    { code: 'HGB', val: '14.5', unit: 'g/dL', range: '11.5-17.5' },
    { code: 'PLT', val: '245', unit: '10*3/uL', range: '150-450' },
    { code: 'HCT', val: '43.0', unit: '%', range: '36.0-50.0' },
  ];

  let frameIdx = 4;
  for (const item of cbcResults) {
    const text = `R|${frameIdx - 3}|^^^${item.code}|${item.val}|${item.unit}|${item.range}|N||F`;
    const rAck = await sendFrame(client, text, frameIdx);
    if (!rAck) throw new Error(`Result frame for ${item.code} rejected`);
    console.log(`  ✓ Frame ${frameIdx} (Result: ${item.code}=${item.val}) -> ACK`);
    frameIdx++;
  }

  // Terminator & EOT
  const lAck = await sendFrame(client, 'L|1|N', frameIdx);
  if (!lAck) throw new Error('Terminator frame rejected');
  console.log(`  ✓ Frame ${frameIdx} (Terminator) -> ACK`);

  client.write(Buffer.from([EOT]));
  console.log('  ✓ <EOT> Transmitted - Session Closed');

  // Wait for background HTTP forward and LIS Store ingestion
  console.log('⏳ Waiting for Bridge Daemon to forward payload to LIS store...');
  await sleep(1500);

  // 4. Verify in LIS Ingest Feed
  const incomingRes = await new Promise<any>((resolve, reject) => {
    http.get('http://127.0.0.1:8080/api/devices/incoming-results?limit=10', (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });

  const latestItems = (incomingRes.results || []).filter((r: any) => r.sampleNumber === 1001);
  console.log(`\n📊 LIS Incoming Results verified for Sample #1001: ${latestItems.length} records found`);
  for (const r of latestItems) {
    const code = String(r.testCode || '').padEnd(6);
    const val = String(r.resultValue || '').padEnd(6);
    console.log(`   • ${code} = ${val} (Status: ${r.status})`);
  }

  if (latestItems.length < 5) {
    throw new Error(`Expected at least 5 incoming results for Sample #1001, got ${latestItems.length}`);
  }

  const allApplied = latestItems.every((r: any) => r.status === 'APPLIED');
  console.log(`✅ All items auto-matched & marked APPLIED: ${allApplied}`);
  if (!allApplied) throw new Error('Not all results were marked APPLIED!');

  // --- Scenario 2: Tampered / Corrupted Checksum Rejection ---
  console.log('\n--- Scenario 2: Transmitting Corrupted Checksum Frame ---');
  const client2 = new net.Socket();
  await new Promise<void>((resolve, reject) => {
    client2.connect(5000, '127.0.0.1', () => resolve());
    client2.on('error', reject);
  });

  const enq2Ack = await new Promise<boolean>((resolve) => {
    client2.once('data', (d) => resolve(d[0] === ACK));
    client2.write(Buffer.from([ENQ]));
  });
  if (!enq2Ack) throw new Error('Scenario 2 ENQ failed');
  console.log('  ✓ <ENQ> -> Received <ACK>');

  const corruptedAck = await sendFrame(client2, 'R|1|^^^WBC|9.99|10*3/uL||N||F', 1, true);
  console.log(`  ✓ Corrupted frame returned ACK? ${corruptedAck} (Expected: false -> NAK 0x15)`);
  if (corruptedAck) {
    throw new Error('Corrupted frame was falsely accepted by bridge!');
  }
  console.log('✅ Corrupted frame correctly REJECTED with NAK (0x15)!');

  client2.destroy();
  client.destroy();
  deviceBridgeService.stop();

  if (spawnedWeb) {
    spawnedWeb.kill();
    killPort(8080);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL DESKTOP DEVICE BRIDGE DAEMON VERIFICATIONS PASSED 100%!');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  deviceBridgeService.stop();
  killPort(8080);
  killPort(5000);
  process.exit(1);
});
