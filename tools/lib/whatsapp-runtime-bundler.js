const fs = require('fs');
const path = require('path');

const WHATSAPP_ROOT_PACKAGES = ['@whiskeysockets/baileys', 'qrcode', 'pino'];

/**
 * Resolves a package directory exactly like Node's CommonJS resolver does:
 * starting from `fromDir`, walk up through every `node_modules` folder.
 */
function resolvePackageDir(fromDir, pkgName) {
  let current = path.resolve(fromDir);
  for (;;) {
    const candidate = path.join(current, 'node_modules', pkgName);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function readPackageJson(pkgDir) {
  return JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
}

/**
 * Copies the full runtime dependency closure of the WhatsApp engine.
 *
 * The previous implementation flattened everything into a single
 * `node_modules/<name>` folder and de-duplicated by package *name*. That
 * silently skipped nested versions (for example `keyv@5` nested under
 * `@cacheable/utils`, whose own dependency `@keyv/serialize` was therefore
 * never bundled). This implementation resolves every dependency from its
 * parent package and preserves the original relative layout, so Node resolves
 * exactly the same tree in the packaged engine.
 */
function copyWhatsAppRuntime({ rootDir, targetStandalone, roots = WHATSAPP_ROOT_PACKAGES, log = console.log }) {
  const sourceRoot = path.join(rootDir, 'node_modules');
  const targetRoot = path.join(targetStandalone, 'node_modules');
  const visited = new Set();
  const missing = [];

  function copyPackage(parentDir, pkgName) {
    const srcDir = resolvePackageDir(parentDir, pkgName);
    if (!srcDir) {
      missing.push(pkgName);
      return;
    }
    if (visited.has(srcDir)) return;
    visited.add(srcDir);

    const relative = path.relative(sourceRoot, srcDir);
    const destDir =
      relative.startsWith('..') || path.isAbsolute(relative)
        ? path.join(targetRoot, pkgName)
        : path.join(targetRoot, relative);

    const destPkgJson = path.join(destDir, 'package.json');
    let needsCopy = !fs.existsSync(destPkgJson);
    if (!needsCopy) {
      try {
        needsCopy = readPackageJson(srcDir).version !== readPackageJson(destDir).version;
      } catch {
        needsCopy = true;
      }
    }

    if (needsCopy) {
      fs.mkdirSync(path.dirname(destDir), { recursive: true });
      fs.rmSync(destDir, { recursive: true, force: true });
      fs.cpSync(srcDir, destDir, { recursive: true, dereference: true });
      log(`  -> نسخ حزمة ${pkgName} لدعم محرك واتساب ويب المدمج...`);
    }

    const pkgJson = readPackageJson(srcDir);
    const deps = new Set([
      ...Object.keys(pkgJson.dependencies || {}),
      ...Object.keys(pkgJson.optionalDependencies || {}),
    ]);
    for (const dep of deps) copyPackage(srcDir, dep);
  }

  for (const name of roots) copyPackage(rootDir, name);
  return { copied: visited.size, missing };
}

/**
 * Verifies that every *required* dependency of the copied WhatsApp closure is
 * physically present inside the packaged standalone engine.
 *
 * A plain `import('@whiskeysockets/baileys')` is not enough: on a developer
 * machine Node can resolve missing packages from the monorepo root
 * `node_modules`, hiding packaging defects. This check only follows paths
 * inside `targetStandalone`.
 */
function verifyWhatsAppRuntimeClosure({ targetStandalone, roots = WHATSAPP_ROOT_PACKAGES }) {
  const visited = new Set();
  const missing = [];

  function resolveInside(fromDir, pkgName) {
    let current = path.resolve(fromDir);
    for (;;) {
      const candidate = path.join(current, 'node_modules', pkgName);
      if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
      const parent = path.dirname(current);
      if (parent === current) return null;
      current = parent;
    }
  }

  function walk(parentDir, pkgName) {
    const pkgDir = resolveInside(parentDir, pkgName);
    if (!pkgDir) {
      missing.push(pkgName);
      return;
    }
    if (visited.has(pkgDir)) return;
    visited.add(pkgDir);
    const pkgJson = readPackageJson(pkgDir);
    for (const dep of Object.keys(pkgJson.dependencies || {})) walk(pkgDir, dep);
  }

  for (const name of roots) walk(targetStandalone, name);

  if (missing.length > 0) {
    const unique = Array.from(new Set(missing)).sort();
    throw new Error(
      `فشل فحص اعتماديات محرك واتساب: حزم مطلوبة غير موجودة داخل الحزمة -> ${unique.join(', ')}`
    );
  }

  return { packages: visited.size };
}

module.exports = {
  WHATSAPP_ROOT_PACKAGES,
  copyWhatsAppRuntime,
  verifyWhatsAppRuntimeClosure,
};
