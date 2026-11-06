import assert from 'node:assert';
import { isLocalLoopbackRequest } from '../../apps/web/src/lib/backupSecurity';
import {
  getOrCreateBackupSecret,
  createBackupSessionToken,
  verifyBackupSessionTokenSync,
} from '../../apps/web/src/lib/backupAuth';
import { verifyBackupSessionToken } from '../../apps/web/src/lib/backupTokenUtils';
import { restoreBackupFromFile, getStore } from '../../apps/web/src/lib/serverStore';

async function runTests() {
  console.log('--- Running Hardened Backup Security Tests ---');

  const secret = getOrCreateBackupSecret();
  assert.ok(secret && secret.length >= 32, 'Secret must be at least 32 characters');

  const validToken = await createBackupSessionToken(secret);
  assert.ok(validToken.startsWith('lbs1.'), 'Token must start with lbs1.');

  // 1. Verify valid token in sync and async
  const syncValid = verifyBackupSessionTokenSync(validToken, secret);
  assert.strictEqual(syncValid, true, 'Valid token must verify synchronously');

  const asyncValid = await verifyBackupSessionToken(validToken, secret);
  assert.strictEqual(asyncValid, true, 'Valid token must verify asynchronously (Web Crypto)');

  // 2. Bearer prefix normalization
  const bearerValid = verifyBackupSessionTokenSync(`Bearer ${validToken}`, secret);
  assert.strictEqual(bearerValid, true, 'Bearer prefixed token must verify synchronously');

  const bearerAsyncValid = await verifyBackupSessionToken(`Bearer ${validToken}`, secret);
  assert.strictEqual(bearerAsyncValid, true, 'Bearer prefixed token must verify asynchronously');

  // 3. Reject fake token with fake signature
  const fakeToken = 'lbs1.1730680000000.abcd1234abcd1234.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  assert.strictEqual(verifyBackupSessionTokenSync(fakeToken, secret), false, 'Fake token must be rejected');
  assert.strictEqual(await verifyBackupSessionToken(fakeToken, secret), false, 'Fake token must be rejected in Web Crypto');

  // 4. Reject tampered signature
  const tamperedToken = validToken.slice(0, -4) + 'ffff';
  assert.strictEqual(verifyBackupSessionTokenSync(tamperedToken, secret), false, 'Tampered token must be rejected');
  assert.strictEqual(await verifyBackupSessionToken(tamperedToken, secret), false, 'Tampered token must be rejected in Web Crypto');

  // 5. Loopback request guard - Localhost allowed
  const localReq = new Request('http://localhost:3000/api/backup', {
    headers: {
      host: 'localhost:3000',
      authorization: `Bearer ${validToken}`,
    },
  });
  assert.strictEqual(isLocalLoopbackRequest(localReq), true, 'Localhost request with valid token must pass');

  // 6. Loopback request guard - Reject LAN IP
  const lanReq = new Request('http://192.168.1.150:3000/api/backup', {
    headers: {
      host: '192.168.1.150:3000',
      authorization: `Bearer ${validToken}`,
    },
  });
  assert.strictEqual(isLocalLoopbackRequest(lanReq), false, 'LAN host request must be rejected');

  // 7. Loopback request guard - Reject foreign Origin
  const foreignOriginReq = new Request('http://localhost:3000/api/backup', {
    headers: {
      host: 'localhost:3000',
      origin: 'http://evil.example.com',
      authorization: `Bearer ${validToken}`,
    },
  });
  assert.strictEqual(isLocalLoopbackRequest(foreignOriginReq), false, 'Foreign origin must be rejected');

  // 8. Restore integrity validation
  const invalidJson = restoreBackupFromFile('{"corrupted": true}');
  assert.strictEqual(invalidJson.success, false, 'Invalid backup structure must be rejected');

  // Seed sample in store if needed to test blank wipe prevention
  const store = getStore();
  if (!store.samples || store.samples.length < 6) {
    store.samples = Array.from({ length: 10 }, (_, i) => ({
      id: `sample-${i}`,
      sampleNumber: 1000 + i,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
      patientId: `pat-${i}`,
    } as any));
  }

  const blankWipePayload = JSON.stringify({
    patients: [],
    samples: [],
    settings: { labName: 'PWNED-BY-LAN' },
  });
  const wipeResult = restoreBackupFromFile(blankWipePayload);
  assert.strictEqual(wipeResult.success, false, 'Blank wipe attack must be rejected');

  console.log('[PASS] All Hardened Backup Security Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
