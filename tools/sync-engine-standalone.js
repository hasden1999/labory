const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const nextDir = path.join(webDir, '.next');
const standaloneWebDir = path.join(nextDir, 'standalone');

if (!fs.existsSync(nextDir)) {
  console.error('❌ Next.js build not found at:', nextDir);
  process.exit(1);
}

const targets = [
  path.join(rootDir, 'apps', 'desktop', 'engine', 'standalone'),
  path.join(rootDir, 'apps', 'desktop', 'dist', 'win-unpacked', 'resources', 'engine', 'standalone'),
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'lab-manager-desktop', 'resources', 'engine', 'standalone'),
].filter(Boolean);

const serverSrc = path.join(nextDir, 'server');
const staticSrc = path.join(nextDir, 'static');
const publicSrc = path.join(webDir, 'public');

for (const targetStandalone of targets) {
  if (!fs.existsSync(targetStandalone)) {
    continue;
  }
  console.log('🔄 Syncing assets to:', targetStandalone);
  try {
    // 1. If standaloneWebDir exists, sync its apps/web
    if (fs.existsSync(standaloneWebDir)) {
      const webSrcStandalone = path.join(standaloneWebDir, 'apps', 'web');
      const webDestStandalone = path.join(targetStandalone, 'apps', 'web');
      if (fs.existsSync(webSrcStandalone)) {
        fs.cpSync(webSrcStandalone, webDestStandalone, { recursive: true, force: true });
      }
    }

    // 2. Synchronize .next/server to target/apps/web/.next/server AND target/.next/server
    if (fs.existsSync(serverSrc)) {
      const serverDests = [
        path.join(targetStandalone, 'apps', 'web', '.next', 'server'),
        path.join(targetStandalone, '.next', 'server'),
      ];
      for (const sDest of serverDests) {
        fs.mkdirSync(path.dirname(sDest), { recursive: true });
        fs.cpSync(serverSrc, sDest, { recursive: true, force: true });
      }
    }

    // 3. Synchronize .next/static to target/apps/web/.next/static AND target/.next/static
    if (fs.existsSync(staticSrc)) {
      const staticDests = [
        path.join(targetStandalone, 'apps', 'web', '.next', 'static'),
        path.join(targetStandalone, '.next', 'static'),
      ];
      for (const sDest of staticDests) {
        fs.mkdirSync(path.dirname(sDest), { recursive: true });
        fs.cpSync(staticSrc, sDest, { recursive: true, force: true });
      }
    }

    // 4. Synchronize manifest files in .next root
    const manifestFiles = [
      'app-build-manifest.json',
      'app-path-routes-manifest.json',
      'build-manifest.json',
      'BUILD_ID',
      'package.json',
      'prerender-manifest.json',
      'react-loadable-manifest.json',
      'required-server-files.json',
      'routes-manifest.json',
    ];
    for (const mFile of manifestFiles) {
      const mSrc = path.join(nextDir, mFile);
      if (fs.existsSync(mSrc)) {
        const mDests = [
          path.join(targetStandalone, 'apps', 'web', '.next', mFile),
          path.join(targetStandalone, '.next', mFile),
        ];
        for (const mDest of mDests) {
          fs.mkdirSync(path.dirname(mDest), { recursive: true });
          fs.copyFileSync(mSrc, mDest);
        }
      }
    }

    // 5. Synchronize public assets
    if (fs.existsSync(publicSrc)) {
      const publicDests = [
        path.join(targetStandalone, 'apps', 'web', 'public'),
        path.join(targetStandalone, 'public'),
      ];
      for (const pDest of publicDests) {
        fs.mkdirSync(path.dirname(pDest), { recursive: true });
        fs.cpSync(publicSrc, pDest, { recursive: true, force: true });
      }
    }

    console.log('✅ Successfully synchronized all build assets:', targetStandalone);
  } catch (err) {
    console.error('⚠️ Could not sync to', targetStandalone, err.message);
  }
}
console.log('✅ All desktop engine standalone targets processed!');

