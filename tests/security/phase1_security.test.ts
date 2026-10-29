/**
 * Phase 1 security regression tests (static + git index checks).
 *
 * These tests fail if session revocation, audit logging, Ed25519 licensing,
 * HWID-bound trials, or PHI tracking hygiene are reverted.
 *
 * They never boot the app and never read patient data.
 *
 * Run with: npx tsx tests/security/phase1_security.test.ts
 */
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function trackedFiles(): string[] {
  const out = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

let passed = 0;

function check(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

check('Session model exists in both Prisma schemas', () => {
  for (const schema of ['apps/server/prisma/schema.prisma', 'apps/web/prisma/schema.prisma']) {
    const src = read(schema);
    assert.ok(src.includes('model Session {'), `${schema} must declare Session`);
    assert.ok(src.includes('revokedAt'), `${schema} Session must support revocation`);
    assert.ok(src.includes('expiresAt'), `${schema} Session must support expiry`);
  }
});

check('Session table is created additively on existing databases', () => {
  for (const file of ['apps/server/src/prisma.ts', 'apps/web/src/lib/prisma.ts']) {
    const src = read(file);
    assert.ok(src.includes('CREATE TABLE IF NOT EXISTS "Session"'), `${file} must ensure Session`);
    assert.ok(src.includes('ensureSessionTable'), `${file} must call ensureSessionTable`);
  }
});

check('Login issues a server-side session and signs its id', () => {
  const src = read('apps/server/src/routes/auth.ts');
  assert.ok(src.includes('prisma.session.create'), 'login must persist a session');
  assert.ok(src.includes('sid: sessionId'), 'JWT must carry the session id');
  assert.ok(src.includes("expiresIn: `${SESSION_TTL_HOURS}h`"), 'JWT must expire');
  assert.ok(src.includes("action: 'LOGIN'"), 'login must be audited');
});

check('Every authenticated request checks the session in the database', () => {
  const src = read('apps/server/src/index.ts');
  assert.ok(src.includes('prisma.session.findUnique'), 'authenticate must load the session');
  assert.ok(src.includes('session.revokedAt'), 'authenticate must reject revoked sessions');
  assert.ok(src.includes('session.expiresAt <= now'), 'authenticate must reject expired sessions');
  assert.ok(src.includes("reply.status(401).send({ message: 'Session expired or revoked' })"), 'revoked/expired sessions must return 401');
});

check('Logout and account changes revoke sessions', () => {
  const src = read('apps/server/src/routes/auth.ts');
  assert.ok(src.includes("fastify.post('/auth/logout'"), 'logout route must exist');
  assert.ok(src.includes("fastify.post(\n    '/auth/logout-all'"), 'logout-all route must exist');
  assert.ok(src.includes('data: { revokedAt: new Date() }'), 'logout must revoke');
  assert.ok(
    src.includes('if (active === false || password)'),
    'deactivation/password change must revoke sessions'
  );
});

check('Audit writer never breaks the business operation', () => {
  const src = read('apps/server/src/utils/audit.ts');
  assert.ok(src.includes('export async function writeAudit'), 'writeAudit must exist');
  assert.ok(src.includes('catch (err: any)'), 'audit failures must be caught');
  assert.ok(!src.includes('throw'), 'audit failures must never throw');
});

check('Licensing uses Ed25519 public-key verification', () => {
  const web = read('apps/web/src/lib/licensing.ts');
  const server = read('apps/server/src/utils/licensing.ts');

  for (const [name, src] of [['web', web], ['server', server]] as const) {
    assert.ok(!src.includes('MASTER_SECRET'), `${name} licensing must not keep a symmetric master secret`);
    assert.ok(src.includes("startsWith('LIC2-')"), `${name} licensing must accept LIC2-`);
    assert.ok(src.includes('crypto.verify('), `${name} licensing must verify Ed25519 signatures`);
    assert.ok(src.includes('LABRYO_LICENSE_PUBLIC_KEY'), `${name} licensing must allow public key override`);
  }
});

check('Legacy LIC- licenses are gated behind an explicit flag', () => {
  for (const file of ['apps/web/src/lib/licensing.ts', 'apps/server/src/utils/licensing.ts']) {
    const src = read(file);
    assert.ok(src.includes("LABRYO_ALLOW_LEGACY_LICENSES === '1'"), `${file} must gate legacy licenses`);
    assert.ok(src.includes('LABRYO_LEGACY_LICENSE_SECRET'), `${file} must require a legacy secret`);
  }
});

check('Client-side license signing is disabled', () => {
  const src = read('apps/web/src/lib/licensing.ts');
  assert.ok(
    src.includes('Client-side license generation is disabled'),
    'client-side keygen must throw unless the migration flag is enabled'
  );
  assert.ok(
    src.includes('Use scripts/license-keygen.mjs with the Ed25519 private key'),
    'the error must point operators to the offline Ed25519 keygen'
  );
});

check('Offline key generator exists and never embeds a private key', () => {
  const src = read('scripts/license-keygen.mjs');
  assert.ok(src.includes("crypto.generateKeyPairSync('ed25519')"), 'keygen must generate Ed25519 keys');
  assert.ok(src.includes('crypto.sign('), 'keygen must sign licenses');
  assert.ok(!src.includes('BEGIN PRIVATE KEY'), 'keygen must not embed a private key');
  assert.ok(src.includes('migrate-legacy'), 'keygen must provide a legacy migration command');
});

check('Trials are bound to the machine HWID', () => {
  const src = read('apps/server/src/utils/licensing.ts');
  assert.ok(
    src.includes('where: { tier: \'TRIAL\', hardwareId: cleanHwid }'),
    'trial lookup must be scoped to the current HWID'
  );
  assert.ok(src.includes('hardwareId: cleanHwid'), 'new trials must store the current HWID');
});

check('Login stores the token under the key the API reads', () => {
  const login = read('apps/web/src/app/login/page.tsx');
  const api = read('apps/web/src/lib/api.ts');
  assert.ok(login.includes('setAuthToken(res.token)'), 'login must use setAuthToken');
  assert.ok(!login.includes("localStorage.setItem('auth_token'"), 'login must not write auth_token');
  assert.ok(api.includes("localStorage.getItem('lab_token')"), 'API must read lab_token');
  assert.ok(login.includes("localStorage.setItem('lab_user'"), 'login must store the current user');
});

check('Server loads local secrets without a new dependency', () => {
  const index = read('apps/server/src/index.ts');
  assert.ok(index.startsWith("import './env';"), 'the env loader must run before Prisma/JWT imports');

  const loader = read('apps/server/src/env.ts');
  assert.ok(loader.includes('process.env[key] === undefined'), 'real environment variables must win');
  assert.ok(!loader.includes('console.log'), 'secret values must never be logged');
});

check('Build tracing excludes PHI, databases and secrets', () => {
  const config = read('apps/web/next.config.js');
  assert.ok(
    config.includes('outputFileTracingIgnores: SENSITIVE_TRACE_PATTERNS'),
    'nft-level ignores are required on Windows'
  );
  assert.ok(
    config.includes('outputFileTracingExcludes'),
    'post-trace excludes must stay for Linux/macOS'
  );
  for (const pattern of [
    '**/apps/web/data/**/*',
    '**/apps/server/prisma/**/*.db',
    '**/.env',
  ]) {
    assert.ok(config.includes(pattern), `trace patterns must include ${pattern}`);
  }

  const installer = read('tools/build-standalone-installer.js');
  assert.ok(installer.includes('sensitiveStandaloneDataDirs'), 'installer must clean standalone data');
  assert.ok(installer.includes('standaloneServerPrismaDir'), 'installer must clean bundled databases');
});

check('PHI stores are ignored and no longer tracked', () => {
  const ignore = read('.gitignore');
  assert.ok(ignore.includes('apps/web/data/lab_store*.json'), 'web lab_store must be ignored');
  assert.ok(ignore.includes('apps/desktop/engine/data/lab_store*.json'), 'engine lab_store must be ignored');
  assert.ok(
    ignore.includes('apps/desktop/engine/standalone/data/lab_store*.json'),
    'standalone lab_store must be ignored'
  );

  const phi = trackedFiles().filter((file) =>
    /(^|\/)lab_store[^/]*\.json$/i.test(file) ||
    /(^|\/)clinical_templates\.json$/i.test(file) ||
    /(^|\/)auto_snapshot_[^/]*\.json$/i.test(file)
  );
  assert.deepStrictEqual(phi, [], `PHI files must not be tracked: ${phi.join(', ')}`);
});

console.log(`\nPhase 1 security regression: ${passed}/15 checks passed.`);
