#!/usr/bin/env node
// ==============================================================================
// Build & Release Verification Guard (حارس فحص تكامل وتطابق أرقام الإصدار)
// يمنع بناء أو نشر أي حزمة إصدارها <= الإصدار المنشور، أو بها تعارض في الترويسة
// ==============================================================================
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

function compareSemver(v1, v2) {
  if (!v1 || !v2) return 0;
  const parse = (v) => String(v).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function fetchLatestGitHubVersion(owner, repo, token) {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'Labryo-Build-Guard',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token) headers['Authorization'] = 'token ' + token;

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/releases/latest`,
      headers,
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const rel = JSON.parse(data);
            resolve(rel.tag_name ? rel.tag_name.replace(/^v/i, '') : null);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function verifyAll() {
  console.log('\n======================================================');
  console.log('🛡️ [BUILD-GUARD] التحقق من توافق وحيدة مصدر الإصدار...');
  console.log('======================================================');

  const rootDir = path.resolve(__dirname, '..');
  const rootPkgPath = path.join(rootDir, 'package.json');
  const desktopPkgPath = path.join(rootDir, 'apps', 'desktop', 'package.json');
  const webPkgPath = path.join(rootDir, 'apps', 'web', 'package.json');

  if (!fs.existsSync(rootPkgPath)) {
    throw new Error('لم يتم العثور على package.json الرئيسي في جذر المشروع!');
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const targetVersion = rootPkg.version;
  console.log(`📌 رقم الإصدار المعتمد من المصدر الوحيد (root package.json): ${targetVersion}`);

  // 1. مزامنة وفحص تطابق apps/desktop/package.json
  if (fs.existsSync(desktopPkgPath)) {
    const desktopPkg = JSON.parse(fs.readFileSync(desktopPkgPath, 'utf-8'));
    if (desktopPkg.version !== targetVersion) {
      console.log(`تحديث وتوحيد apps/desktop/package.json من ${desktopPkg.version} إلى ${targetVersion}...`);
      desktopPkg.version = targetVersion;
      fs.writeFileSync(desktopPkgPath, JSON.stringify(desktopPkg, null, 2) + '\n', 'utf-8');
    }
  }

  // 2. مزامنة وفحص تطابق apps/web/package.json
  if (fs.existsSync(webPkgPath)) {
    const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf-8'));
    if (webPkg.version !== targetVersion) {
      console.log(`تحديث وتوحيد apps/web/package.json من ${webPkg.version} إلى ${targetVersion}...`);
      webPkg.version = targetVersion;
      fs.writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2) + '\n', 'utf-8');
    }
  }

  // 3. فحص الإصدار المنشور مسبقاً على السيرفر (GitHub Releases)
  let token = process.env.GH_TOKEN;
  if (!token) {
    try {
      const envPath = path.join(rootDir, '.env');
      if (fs.existsSync(envPath)) {
        const m = fs.readFileSync(envPath, 'utf-8').match(/GH_TOKEN=([^\r\n]+)/);
        if (m) token = m[1].trim();
      }
    } catch {}
  }

  console.log('جاري الاستعلام عن أحدث إصدار منشور على GitHub...');
  const latestPublished = await fetchLatestGitHubVersion('hasden1999', 'lab-releases', token);
  if (latestPublished) {
    console.log(`🌐 أحدث إصدار موجود على السيرفر: ${latestPublished}`);
    const comparison = compareSemver(targetVersion, latestPublished);
    if (comparison < 0) {
      throw new Error(`❌ مرفوض: رقم الإصدار الجديد (${targetVersion}) أصغر من الإصدار المنشور (${latestPublished})!`);
    } else if (comparison === 0 && !process.argv.includes('--allow-same-version')) {
      throw new Error(`❌ مرفوض: رقم الإصدار الجديد (${targetVersion}) يساوي الإصدار المنشور (${latestPublished})! يرجى رفع الإصدار أولاً أو تمرير --allow-same-version للإصلاح الاستثنائي.`);
    }
    console.log(`✅ فحص تقدم الإصدار ناجح: (${targetVersion} ${comparison > 0 ? '>' : '='} ${latestPublished})`);
  } else {
    console.log('⚠️ تعذر جلب الإصدار من GitHub (وضع عدم الاتصال). تم تجاوز الفحص الشبكي.');
  }

  // 4. إذا كان هناك ملف مثبّت تم بناؤه، فحص ترويسة الـ PE Header
  const distDir = path.join(rootDir, 'apps', 'desktop', 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    const setupExe = files.find(f => 
      f.endsWith('.exe') && 
      !f.includes('Portable') && 
      !f.startsWith('Labryo.LIMS.Setup.') &&
      f.includes('Setup') && 
      f.includes(targetVersion)
    );

    if (setupExe) {
      const fullPath = path.join(distDir, setupExe);
      try {
        const peVersion = execFileSync('powershell.exe', [
          '-NoProfile',
          '-Command',
          `(Get-Item -LiteralPath '${fullPath}').VersionInfo.ProductVersion`
        ], { encoding: 'utf-8' }).trim();

        console.log(`🔍 ترويسة ملف التثبيت المترجم (${setupExe}): ProductVersion = "${peVersion}"`);
        if (peVersion !== targetVersion) {
          throw new Error(`❌ تعارض داخلي: ملف التثبيت ${setupExe} يحمل إصدار "${peVersion}" ولا يطابق الإصدار المستهدف "${targetVersion}"!`);
        }
        console.log(`✅ تم تأكيد مطابقة ترويسة ملف التثبيت المترجم مع كود التطبيق.`);
      } catch (err) {
        if (err.message.includes('تعارض داخلي')) throw err;
        console.warn(`تحذير أثناء فحص ترويسة PE: ${err.message}`);
      }
    }
  }

  console.log('======================================================');
  console.log('✅ تم اجتياز كافة فحوصات الأمان وتكامل الإصدار بنجاح!');
  console.log('======================================================\n');
}

verifyAll().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
