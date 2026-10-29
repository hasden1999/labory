#!/usr/bin/env node
/**
 * Labryo offline license tool (Ed25519).
 *
 * The private key never belongs in the repository or in the client bundle.
 * Default key location: %USERPROFILE%\.labryo\keys (override with LABRYO_KEY_DIR or --dir).
 *
 * Usage:
 *   node scripts/license-keygen.mjs init [--dir <dir>]
 *   node scripts/license-keygen.mjs sign --hwid <HWID> --days <N> --tier <TIER> --lab <NAME> [--dir <dir>]
 *   node scripts/license-keygen.mjs verify --key <LICENSE> --hwid <HWID> [--public-key <base64-der|pem>]
 *   node scripts/license-keygen.mjs migrate-legacy --key <LIC-...> [--dir <dir>]
 *
 * Legacy migration requires LABRYO_LEGACY_LICENSE_SECRET in the environment.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PRIVATE_KEY_FILE = 'license-ed25519-private.pem';
const PUBLIC_KEY_FILE = 'license-ed25519-public.pem';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function keyDir(args) {
  return path.resolve(args.dir || process.env.LABRYO_KEY_DIR || path.join(os.homedir(), '.labryo', 'keys'));
}

function canonicalPayload(payload) {
  const labName = String(payload.labName || '').replace(/\|/g, '/');
  return [
    'v2',
    String(payload.hwid || '').trim().toUpperCase(),
    String(payload.expiryDate || ''),
    String(payload.tier || ''),
    labName,
    String(payload.issuedAt || new Date().toISOString()),
  ].join('|');
}

function publicKeyToBase64Der(publicKey) {
  return publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
}

function loadPrivateKey(dir) {
  const file = path.join(dir, PRIVATE_KEY_FILE);
  if (!fs.existsSync(file)) {
    throw new Error(`Private key not found at ${file}. Run "init" first.`);
  }
  return crypto.createPrivateKey(fs.readFileSync(file, 'utf8'));
}

function loadPublicKey(dir) {
  const file = path.join(dir, PUBLIC_KEY_FILE);
  if (!fs.existsSync(file)) {
    throw new Error(`Public key not found at ${file}. Run "init" first.`);
  }
  return crypto.createPublicKey(fs.readFileSync(file, 'utf8'));
}

function resolvePublicKey(args) {
  if (args['public-key']) {
    const raw = String(args['public-key']).replace(/\\n/g, '\n');
    if (raw.includes('BEGIN PUBLIC KEY')) return crypto.createPublicKey(raw);
    return crypto.createPublicKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'spki' });
  }
  return loadPublicKey(keyDir(args));
}

function expiryFor(days) {
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('--days must be a positive number');
  }
  const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return expiry.toISOString().split('T')[0];
}

function signLicense(args) {
  const dir = keyDir(args);
  const privateKey = loadPrivateKey(dir);
  const hwid = String(args.hwid || '').trim().toUpperCase();
  if (!hwid) throw new Error('--hwid is required');
  const tier = String(args.tier || 'MONTHLY').toUpperCase();
  const days = tier === 'LIFETIME' ? 36525 : Number(args.days || 30);
  const payload = {
    hwid,
    expiryDate: tier === 'LIFETIME' ? '2099-12-31' : expiryFor(days),
    tier,
    labName: String(args.lab || 'مختبر معتمد'),
    issuedAt: new Date().toISOString(),
  };
  const canonical = canonicalPayload(payload);
  const signature = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKey);
  const license = `LIC2-${Buffer.from(canonical, 'utf8').toString('base64url')}.${signature.toString('base64url')}`;
  return { license, payload, publicKeyBase64Der: publicKeyToBase64Der(loadPublicKey(dir)) };
}

function parseV2(license) {
  if (!license.startsWith('LIC2-')) throw new Error('Not a LIC2 license');
  const rest = license.slice('LIC2-'.length);
  const dot = rest.lastIndexOf('.');
  if (dot <= 0) throw new Error('Malformed LIC2 license');
  const canonical = Buffer.from(rest.slice(0, dot), 'base64url').toString('utf8');
  const signature = Buffer.from(rest.slice(dot + 1), 'base64url');
  const [version, hwid, expiryDate, tier, labName, issuedAt] = canonical.split('|');
  if (version !== 'v2' || !hwid || !expiryDate || !tier) throw new Error('Malformed LIC2 payload');
  return { canonical, signature, payload: { hwid, expiryDate, tier, labName, issuedAt } };
}

function verifyLicense(args) {
  const license = String(args.key || '').trim();
  const hwid = String(args.hwid || '').trim().toUpperCase();
  if (!license) throw new Error('--key is required');
  if (!hwid) throw new Error('--hwid is required');
  const parsed = parseV2(license);
  const publicKey = resolvePublicKey(args);
  const validSignature = crypto.verify(
    null,
    Buffer.from(parsed.canonical, 'utf8'),
    publicKey,
    parsed.signature
  );
  const hwidMatches = parsed.payload.hwid === hwid;
  const expiry = new Date(`${parsed.payload.expiryDate}T23:59:59Z`);
  const notExpired = Number.isFinite(expiry.getTime()) && Date.now() <= expiry.getTime();
  return { valid: validSignature && hwidMatches && notExpired, validSignature, hwidMatches, notExpired, payload: parsed.payload };
}

function migrateLegacy(args) {
  const legacyKey = String(args.key || '').trim();
  const secret = process.env.LABRYO_LEGACY_LICENSE_SECRET;
  if (!secret) throw new Error('LABRYO_LEGACY_LICENSE_SECRET is required for migration');
  if (!legacyKey.startsWith('LIC-')) throw new Error('Not a legacy LIC- license');
  const parts = legacyKey.replace(/^LIC-/, '').split('-');
  if (parts.length < 2) throw new Error('Malformed legacy license');
  const signature = parts[parts.length - 1].toUpperCase();
  const decoded = Buffer.from(parts.slice(0, -1).join('-'), 'base64url').toString('utf8');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(decoded)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();
  if (signature !== expected) throw new Error('Legacy license signature is invalid');
  const [hwid, expiryDate, tier, labName] = decoded.split('|');
  if (!hwid || !expiryDate || !tier) throw new Error('Malformed legacy payload');
  const dir = keyDir(args);
  const privateKey = loadPrivateKey(dir);
  const payload = { hwid, expiryDate, tier, labName: labName || '', issuedAt: new Date().toISOString() };
  const canonical = canonicalPayload(payload);
  const newSignature = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKey);
  return {
    license: `LIC2-${Buffer.from(canonical, 'utf8').toString('base64url')}.${newSignature.toString('base64url')}`,
    payload,
  };
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === 'init') {
    const dir = keyDir(args);
    fs.mkdirSync(dir, { recursive: true });
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
    const privateFile = path.join(dir, PRIVATE_KEY_FILE);
    const publicFile = path.join(dir, PUBLIC_KEY_FILE);
    if (fs.existsSync(privateFile)) {
      throw new Error(`Refusing to overwrite existing private key: ${privateFile}`);
    }
    fs.writeFileSync(privateFile, privatePem, { mode: 0o600 });
    fs.writeFileSync(publicFile, publicPem, 'utf8');
    const der = publicKey.export({ type: 'spki', format: 'der' });
    console.log(
      JSON.stringify(
        {
          dir,
          privateKeyFile: privateFile,
          publicKeyFile: publicFile,
          publicKeyBase64Der: der.toString('base64'),
          fingerprintSha256: crypto.createHash('sha256').update(der).digest('hex'),
        },
        null,
        2
      )
    );
    return;
  }

  if (command === 'sign') {
    console.log(JSON.stringify(signLicense(args), null, 2));
    return;
  }

  if (command === 'verify') {
    console.log(JSON.stringify(verifyLicense(args), null, 2));
    return;
  }

  if (command === 'migrate-legacy') {
    console.log(JSON.stringify(migrateLegacy(args), null, 2));
    return;
  }

  console.error('Unknown command. Use: init | sign | verify | migrate-legacy');
  process.exitCode = 1;
}

main();
