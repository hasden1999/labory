import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { UiHarness } from './harness';
import { runRouteSuite } from './suites/routes';
import { intakeSuite } from './suites/intake';
import { runPatientsSuite } from './suites/patients';
import { runFinancialsSuite } from './suites/financials';
import { runSettingsSuite } from './suites/settings';
import { runDevicesSuite } from './suites/devices';
import { runGlobalSuite } from './suites/global';

const ROOT = path.resolve(__dirname, '..', '..');
const WEB_DIR = path.join(ROOT, 'apps', 'web');
const DATA_SOURCE = path.join(WEB_DIR, 'data');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts', STAMP);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function copyIfExists(source: string, destination: string): void {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function prepareIsolatedData(): string {
  const directory =
    process.env.LABRYO_E2E_DATA_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'labryo-e2e-'));
  fs.mkdirSync(directory, { recursive: true });
  copyIfExists(path.join(DATA_SOURCE, 'lab_store.json'), path.join(directory, 'lab_store.json'));
  copyIfExists(path.join(DATA_SOURCE, 'clinical_templates.json'), path.join(directory, 'clinical_templates.json'));
  copyIfExists(path.join(DATA_SOURCE, 'lab.db'), path.join(directory, 'lab.db'));
  fs.mkdirSync(path.join(directory, 'backups'), { recursive: true });
  return directory;
}

async function waitForServer(baseUrl: string, timeoutMs = 180_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(baseUrl + '/ready');
      if (response.ok) return;
    } catch {
      // Server not accepting connections yet.
    }
    await sleep(1_000);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/ready`);
}

async function startDevServer(): Promise<{ baseUrl: string; child: ChildProcess; dataDir: string }> {
  const port = Number(process.env.E2E_PORT || 3210);
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = prepareIsolatedData();
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!fs.existsSync(nextBin)) throw new Error(`Next.js binary not found: ${nextBin}`);
  const databaseUrl = `file:${path.join(dataDir, 'lab.db').replace(/\\/g, '/')}?connection_limit=1`;
  const child = spawn(process.execPath, [nextBin, 'dev', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: WEB_DIR,
    env: {
      ...process.env,
      LABRYO_DATA_DIR: dataDir,
      DATABASE_URL: databaseUrl,
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const logPath = path.join(ARTIFACTS_DIR, 'next-dev.log');
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const log = fs.createWriteStream(logPath, { flags: 'a' });
  child.stdout?.pipe(log);
  child.stderr?.pipe(log);
  await waitForServer(baseUrl);
  return { baseUrl, child, dataDir };
}

function stopProcess(child: ChildProcess): void {
  if (!child || child.killed || child.exitCode !== null) return;
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  let server: { baseUrl: string; child: ChildProcess; dataDir: string } | null = null;
  let baseUrl = process.env.E2E_BASE_URL?.replace(/\/+$/, '') || '';

  if (!baseUrl) {
    console.log('Starting isolated Next.js dev server...');
    server = await startDevServer();
    baseUrl = server.baseUrl;
    console.log(`Isolated data directory: ${server.dataDir}`);
  } else {
    console.log(`Using existing server: ${baseUrl}`);
  }

  const ui = new UiHarness({ baseUrl, artifactsDir: ARTIFACTS_DIR, defaultTimeout: 60_000 });
  await ui.init();
  console.log(`Artifacts: ${ARTIFACTS_DIR}\n`);

  const started = Date.now();
  const selected = (process.env.E2E_SUITES || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const enabled = (name: string): boolean => !selected.length || selected.includes(name);
  try {
    if (enabled('routes')) {
      console.log('== Route smoke + control inventory ==');
      await runRouteSuite(ui);
    }

    let savedOrder = false;
    if (enabled('intake')) {
      console.log('\n== Intake / order creation ==');
      await intakeSuite.run(ui);
      savedOrder = ui.checks.some(
        (check) => check.name === 'saves the order (F9) and shows the success toast' && check.ok,
      );
    }

    if (enabled('patients')) {
      if (savedOrder || process.env.E2E_PATIENT_NAME) {
        console.log('\n== Patients / results ==');
        const patientName = process.env.E2E_PATIENT_NAME || intakeSuite.patientName;
        await runPatientsSuite(ui, patientName);
      } else {
        ui.skip('patients suite', 'Intake order was not saved');
      }
    }

    if (enabled('financials')) {
      console.log('\n== Financials ==');
      await runFinancialsSuite(ui);
    }

    if (enabled('settings')) {
      console.log('\n== Settings / catalog / system ==');
      await runSettingsSuite(ui);
    }

    if (enabled('devices')) {
      console.log('\n== Devices / inventory ==');
      await runDevicesSuite(ui);
    }

    if (enabled('global')) {
      console.log('\n== Global navigation / auth / probes ==');
      await runGlobalSuite(ui);
    }
  } catch (error) {
    ui.addNote(`Runner exception: ${String((error as any)?.stack || error).slice(0, 2_000)}`);
  } finally {
    await ui.close();
    if (server) stopProcess(server.child);
  }

  const report = ui.writeReport();
  const durationSeconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log('\n======================================================================');
  console.log(` UI E2E: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed, ${report.summary.skipped} skipped`);
  console.log(` Duration: ${durationSeconds}s`);
  console.log(` Report: ${report.markdownPath}`);
  console.log(` JSON:   ${report.jsonPath}`);
  for (const note of ui.notes) console.log(` NOTE: ${note}`);
  console.log('======================================================================\n');
  if (report.summary.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Fatal UI E2E runner error:', error);
  process.exit(1);
});
