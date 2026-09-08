const asar = require('@electron/asar');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function repack() {
  const asarPath = path.resolve('apps/desktop/dist/win-unpacked/resources/app.asar');
  const backupPath = path.resolve('apps/desktop/dist/win-unpacked/resources/app.asar.bak');
  const tempDir = path.join(os.tmpdir(), 'asar_temp_' + Date.now());

  console.log('1. Checking paths...');
  if (!fs.existsSync(asarPath)) {
    throw new Error('Target app.asar not found at: ' + asarPath);
  }

  console.log('2. Extracting existing app.asar to temp directory:', tempDir);
  asar.extractAll(asarPath, tempDir);

  console.log('3. Copying updated apps/desktop/main.js to extracted package...');
  fs.copyFileSync(path.resolve('apps/desktop/main.js'), path.join(tempDir, 'main.js'));

  console.log('4. Creating backup of current app.asar...');
  fs.copyFileSync(asarPath, backupPath);

  console.log('5. Packing new app.asar package...');
  await asar.createPackage(tempDir, asarPath);

  console.log('6. Verifying repacked app.asar...');
  const newContent = asar.extractFile(asarPath, 'main.js').toString('utf8');
  if (!newContent.includes('maxAttempts = 90') || !newContent.includes('getStartCommand')) {
    throw new Error('Verification failed: new main.js content missing from repacked app.asar');
  }
  console.log('Verification passed: new main.js is active inside app.asar!');

  console.log('7. Cleaning up temp directory and backup...');
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }

  console.log('SUCCESS: Desktop application bundle (app.asar) repacked and updated successfully!');
}

repack().catch(err => {
  console.error('FAILED to repack:', err);
  process.exit(1);
});
