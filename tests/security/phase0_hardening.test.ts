/**
 * Phase 0 security hardening regression tests (static).
 *
 * These tests fail if any of the fail-closed guards are reverted.
 * They are intentionally static: they never boot the app or touch lab data.
 *
 * Run with: npx tsx tests/security/phase0_hardening.test.ts
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

let passed = 0;

function check(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

check('Fastify authentication is fail-closed', () => {
  const src = read('apps/server/src/index.ts');
  assert.ok(
    !src.includes('LAB_MANAGER_SECRET_KEY_LOCAL_OFFLINE_2026'),
    'hard-coded JWT secret must be removed'
  );
  assert.ok(
    !src.includes("'single_operator'"),
    'single-operator OWNER fallback must be removed'
  );
  assert.ok(
    src.includes("reply.status(401).send({ message: 'Authentication required' })"),
    'missing Authorization header must return 401'
  );
  assert.ok(
    src.includes("reply.status(403).send({ message: 'Owner privileges required' })"),
    'non-owner must receive 403'
  );
});

check('Fastify CORS is allowlisted', () => {
  const src = read('apps/server/src/index.ts');
  assert.ok(!src.includes('origin: true'), 'wildcard CORS must be removed');
  assert.ok(
    src.includes('CORS origin is not allowed'),
    'disallowed origins must be rejected'
  );
});

check('Web middleware does not trust forwarding headers', () => {
  const src = read('apps/web/src/middleware.ts');
  assert.ok(
    !src.includes("headers.get('x-forwarded-for')"),
    'x-forwarded-for must never be trusted'
  );
  assert.ok(
    !src.includes("headers.get('x-real-ip')"),
    'x-real-ip must never be trusted'
  );
  assert.ok(
    src.includes("pathname.startsWith('/api/backup')"),
    'backup routes must be guarded'
  );
  assert.ok(
    src.includes('BACKUP_ADMIN_SECRET'),
    'backup guard must require an administrative secret'
  );
});

check('Backup authorization guard is fail-closed', () => {
  const src = read('apps/web/src/lib/backupSecurity.ts');
  assert.ok(
    !src.includes("headers.get('x-forwarded-for')"),
    'x-forwarded-for must never be trusted'
  );
  assert.ok(
    !src.includes("headers.get('x-real-ip')"),
    'x-real-ip must never be trusted'
  );
  assert.ok(
    src.includes('if (!adminSecret) return false;'),
    'missing admin secret must deny access'
  );
  assert.ok(
    src.includes('authHeader !== `Bearer ${adminSecret}`'),
    'invalid admin secret must deny access'
  );
});

check('LAN auto-pairing is disabled by default', () => {
  const src = read('apps/web/src/app/api/network/pair/route.ts');
  assert.ok(
    !src.includes("headers.get('x-forwarded-for')"),
    'pairing must not trust x-forwarded-for'
  );
  assert.ok(
    !src.includes("headers.get('x-real-ip')"),
    'pairing must not trust x-real-ip'
  );
  assert.ok(
    src.includes("process.env.LABRYO_ALLOW_AUTO_PAIR !== '1'"),
    'auto_pair must be opt-in only'
  );
});

check('Unmatched analyzer results are rejected, never guessed', () => {
  const store = read('apps/web/src/lib/serverStore.ts');
  assert.ok(
    !store.includes('targetSample = store.samples[0]'),
    'must never fall back to the newest sample'
  );
  assert.ok(
    store.includes("status: 'UNMATCHED_SAMPLE'"),
    'unmatched results must return UNMATCHED_SAMPLE'
  );

  const route = read('apps/web/src/app/api/devices/ingest/route.ts');
  assert.ok(
    route.includes("result.status === 'UNMATCHED_SAMPLE'"),
    'ingest route must detect UNMATCHED_SAMPLE'
  );
  assert.ok(
    route.includes('{ status: 422 }'),
    'unmatched results must return HTTP 422'
  );
});

check('Simulation route rejects unmatched samples', () => {
  const src = read('apps/web/src/app/api/devices/[id]/test-simulate/route.ts');
  assert.ok(
    src.includes('if (!ingestSummary.success)'),
    'simulation must stop when ingest rejects the sample'
  );
  assert.ok(
    src.includes('{ status: 422 }'),
    'simulation must return HTTP 422 for unmatched samples'
  );
});

check('Desktop updates require explicit operator approval', () => {
  const src = read('apps/desktop/services/updateService.js');
  assert.ok(
    src.includes('autoUpdater.autoDownload = false;'),
    'automatic download must be disabled'
  );
  assert.ok(
    !src.includes('autoUpdater.autoDownload = true;'),
    'automatic download must not be re-enabled'
  );
});

console.log(`\nPhase 0 security regression: ${passed}/8 checks passed.`);
