const fs = require('fs');
const path = require('path');

const PACKAGES = [
  { name: '@lab-manager/core', dir: 'core', desc: 'Core server, database repositories, updater, licensing' },
  { name: '@lab-manager/domain', dir: 'domain', desc: 'Pure clinical domain logic, lipid calculations, reference ranges' },
  { name: '@lab-manager/data', dir: 'data', desc: 'Seeds, catalog canonical data, migrations' },
  { name: '@lab-manager/forms', dir: 'forms', desc: 'Data-driven form definitions and generic renderer' },
  { name: '@lab-manager/design', dir: 'design', desc: 'Design tokens, theme, UI kit, RTL rules' },
  { name: '@lab-manager/reports', dir: 'reports', desc: 'Print & PDF report templates and engine' },
  { name: '@lab-manager/messaging', dir: 'messaging', desc: 'WhatsApp Baileys messaging client' },
  { name: '@lab-manager/i18n', dir: 'i18n', desc: 'Centralized localized string resources' },
];

for (const pkg of PACKAGES) {
  const pkgDir = path.join('D:/lab/packages', pkg.dir);
  if (!fs.existsSync(pkgDir)) {
    fs.mkdirSync(pkgDir, { recursive: true });
  }

  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify({
      name: pkg.name,
      version: '1.0.0',
      description: pkg.desc,
      main: 'src/index.ts',
      types: 'src/index.ts',
      scripts: {}
    }, null, 2), 'utf8');
  }

  const srcDir = path.join(pkgDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  const indexPath = path.join(srcDir, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `/**\n * ${pkg.name}\n * ${pkg.desc}\n */\n\nexport const MODULE_NAME = '${pkg.dir}';\n`, 'utf8');
  }

  console.log(`Created skeleton package: ${pkg.name} in ${pkgDir}`);
}
