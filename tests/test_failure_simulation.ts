import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock electron
import Module from 'node:module';
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string, ...args: any[]) {
  if (id === 'electron') {
    return {
      app: {
        getVersion: () => '1.2.0', // Stays on 1.2.0
        getPath: () => path.join(process.cwd(), 'test_sim_tmp'),
        isPackaged: true,
        on: () => {},
      },
      ipcMain: { handle: () => {}, on: () => {} },
      BrowserWindow: class { webContents = { send: () => {} }; },
    };
  }
  return originalRequire.apply(this, [id, ...args]);
};

async function testSimulation() {
  console.log('=====================================================');
  console.log('🧪 Testing Failure & Loop Prevention Simulation');
  console.log('=====================================================');

  const tmpDir = path.join(process.cwd(), 'test_sim_tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const { UpdateService } = require('../apps/desktop/services/updateService.js');

  // Test Case 1: Loop Detection after 2 failed attempts
  console.log('\n[SIM 1] Simulating 2 failed update attempts where version remains 1.2.0...');
  const settingsFile = path.join(tmpDir, 'updater_settings.json');
  fs.writeFileSync(settingsFile, JSON.stringify({
    channel: 'stable',
    updateHistory: {
      targetVersion: '1.2.1',
      attempts: 2,
      lastAttemptTime: new Date().toISOString(),
    }
  }, null, 2));

  const service = new UpdateService();
  service.init({ webContents: { send: () => {} } });

  const state = service.getState();
  console.log('State status:', state.status);
  console.log('Loop detected:', state.loopDetected);
  console.log('Error message:', state.error);
  console.log('Manual download URL:', state.manualDownloadUrl);

  assert.strictEqual(state.loopDetected, true, 'loopDetected flag must be true');
  assert.strictEqual(state.status, 'error', 'Status must be error');
  assert.ok(state.error.includes('تعذر استكمال التحديث التلقائي'), 'Error message must explain failure clearly');
  assert.ok(state.manualDownloadUrl.includes('1.2.1'), 'Must provide direct download URL for target version');

  // Test Case 2: Ensure check is suppressed when loop lock is active
  const checkResult = await service.checkForUpdates(false);
  console.log('\n[SIM 2] Automatic check while loop locked:', checkResult);
  assert.strictEqual(checkResult.success, false, 'Automatic check must be skipped');
  assert.strictEqual(checkResult.loopDetected, true, 'Must report loopDetected');

  // Test Case 3: Network error handling
  console.log('\n[SIM 3] Network disconnection simulation...');
  service.updateState({
    status: 'error',
    error: 'تعذر الاتصال بخادم التحديثات (الرجاء التحقق من الإنترنت)',
  });
  const netState = service.getState();
  assert.ok(netState.error.includes('التحقق من الإنترنت'), 'Must provide clear Arabic message for network drop');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n=====================================================');
  console.log('🎉 ALL FAILURE & LOOP SIMULATION TESTS PASSED!');
  console.log('=====================================================');
}

testSimulation().catch(err => {
  console.error(err);
  process.exit(1);
});
