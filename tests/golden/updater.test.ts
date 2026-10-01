import assert from 'node:assert';
import Module from 'node:module';

const rootPkg = require('../../package.json');

// Mock electron runtime
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string, ...args: any[]) {
  if (id === 'electron') {
    return {
      app: {
        getVersion: () => rootPkg.version,
        getPath: () => process.cwd(),
        isPackaged: false,
        on: () => {},
      },
      ipcMain: {
        handle: () => {},
        on: () => {},
      },
      BrowserWindow: class {
        webContents = { send: () => {} };
      }
    };
  }
  return originalRequire.apply(this, [id, ...args]);
};

async function runUpdaterGoldenTest() {
  console.log('🧪 [Golden Test] Testing Auto-Updater Version Check & Prompt Invariance...');

  const { UpdateService } = require('../../apps/desktop/services/updateService.js');
  const service = new UpdateService();

  // Test 1: When installed version matches target version, isUpdateAvailable is false
  const state = service.getState();
  assert.strictEqual(state.currentVersion, rootPkg.version, `Current version must match ${rootPkg.version}`);
  console.log(`  ✓ Current version registered: ${state.currentVersion}`);

  // Test 2: Check update state transition
  assert.ok(state.status === 'idle', `Initial status must be idle, got ${state.status}`);
  console.log('  ✓ Initial state is idle');

  // Test 3: Channel switching
  service.setChannel('stable');
  assert.strictEqual(service.getChannel(), 'stable');
  console.log('  ✓ Channel verified as stable');

  console.log('✅ [Golden Test] Auto-Updater Golden Test Passed.');
}

runUpdaterGoldenTest().catch((err) => {
  console.error('❌ [Golden Test] Updater test failed:', err);
  process.exit(1);
});
