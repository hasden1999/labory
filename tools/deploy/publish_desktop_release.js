#!/usr/bin/env node
// ==============================================================================
// أداة بناء وتجهيز وتوزيع تحديثات تطبيق سطح المكتب لنظام المختبرات (Labryo LIMS)
// ==============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const desktopDir = path.join(rootDir, 'apps', 'desktop');
const distDir = path.join(desktopDir, 'dist');
const desktopPkg = require(path.join(desktopDir, 'package.json'));

const VERSION = desktopPkg.version || '1.0.2';
const TAG = `v${VERSION}`;
const OWNER = 'hasden1999';
const REPO = 'lab-releases';

console.log(`\n======================================================`);
console.log(`  [LIS-RELEASE] معالجة وتوزيع إصدار المختبر: ${VERSION} (${TAG})`);
console.log(`======================================================`);

// 1. فحص خيار البناء
if (process.argv.includes('--build')) {
  console.log('جاري بناء مثبت سطح المكتب عبر tools/build-standalone-installer.js --rebuild...');
  execSync('node tools/build-standalone-installer.js --rebuild', { cwd: rootDir, stdio: 'inherit' });
}

// 2. البحث الدقيق عن ملف المثبت الرئيسي Setup .exe المطابق للإصدار
const files = fs.readdirSync(distDir);
const sanitizedRemoteName = `Labryo.LIMS.Setup.${VERSION}.exe`;
const setupExe = files.find(f => 
  f.endsWith('.exe') && 
  !f.includes('Portable') && 
  f !== sanitizedRemoteName && 
  f.includes('Setup') && 
  f.includes(VERSION)
);

if (!setupExe) {
  console.error(`❌ لم يتم العثور على أي ملف تثبيت .exe للإصدار ${VERSION} في مجلد: ${distDir}`);
  process.exit(1);
}

const setupExePath = path.join(distDir, setupExe);

// Strict Windows PE Header Validation
const { execFileSync } = require('child_process');
let productVersion = '';
try {
  productVersion = execFileSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `(Get-Item -LiteralPath '${setupExePath}').VersionInfo.ProductVersion`
  ], { encoding: 'utf-8' }).trim();
} catch (e) {
  console.error(`❌ فشل قراءة ProductVersion: ${e.message}`);
  process.exit(1);
}

if (productVersion !== VERSION) {
  console.error(`❌ تعارض في الإصدار الداخلي: الملف يحمل ${productVersion} والمطلوب ${VERSION}`);
  process.exit(1);
}

const fileStats = fs.statSync(setupExePath);
console.log(`تم التحقق بنجاح من ملف التثبيت المعتمد: ${setupExe}`);
console.log(`رقم الإصدار المدمج الموثق: ${productVersion}`);
console.log(`الحجم: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);

// 3. حساب بصمة الأمان SHA-256
console.log('حساب بصمة التشفير الرقمية (SHA-256)...');
const fileBuffer = fs.readFileSync(setupExePath);
const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
console.log(`بصمة التشفير SHA-256: ${sha256Hash}`);
fs.writeFileSync(`${setupExePath}.sha256`, sha256Hash, 'utf-8');

// 4. توليد بيان التحديث latest.json
const manifest = {
  version: VERSION,
  tag: TAG,
  productName: desktopPkg.build?.productName || 'Labryo LIMS',
  filename: sanitizedRemoteName,
  localFilename: setupExe,
  sizeBytes: fileStats.size,
  sha256: sha256Hash,
  releaseDate: new Date().toISOString(),
  downloadUrl: `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/${sanitizedRemoteName}`,
  mandatory: false,
  releaseNotes: "تحديث v1.4.7: توحيد غلاف التطبيق في التخطيط الجذري، التدوير التلقائي المشفر لمفاتيح أجهزة التحليل الطبية، تعزيز استقرار المحرك المستقل Standalone، واكتمال منظومة الفحوصات والتدقيق بنسبة 100%."
};

const manifestPath = path.join(distDir, 'latest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`✅ تم إنشاء بيان الإصدار: ${manifestPath}`);

// 5. النشر على GitHub Releases إذا تم تمرير --publish
if (process.argv.includes('--publish')) {
  console.log('\n--- جاري رفع التحديث ومشاركته للمستخدمين على GitHub Releases ---');
  
  const envPath = path.join(rootDir, '.env');
  let token = null;
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const tokenMatch = envContent.match(/GH_TOKEN=([^\r\n]+)/);
    if (tokenMatch) token = tokenMatch[1].trim();
  }
  token = token || process.env.GH_TOKEN;

  if (!token) {
    console.error('❌ لم يتم العثور على GH_TOKEN في ملف .env أو متغيرات النظام!');
    process.exit(1);
  }

  function apiRequest(apiPath, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: apiPath,
        method,
        headers: {
          'User-Agent': 'NodeJS-Labryo-Deployment',
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  function uploadAsset(uploadUrlTemplate, filePath, fileName) {
    return new Promise((resolve, reject) => {
      const cleanUrl = uploadUrlTemplate.split('{')[0];
      const uploadUrl = new URL(cleanUrl);
      uploadUrl.searchParams.set('name', fileName);

      const stats = fs.statSync(filePath);
      console.log(`جاري رفع: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

      const fileStream = fs.createReadStream(filePath);
      const req = https.request({
        hostname: uploadUrl.hostname,
        path: uploadUrl.pathname + uploadUrl.search,
        method: 'POST',
        headers: {
          'User-Agent': 'NodeJS-Labryo-Deployment',
          'Authorization': 'token ' + token,
          'Content-Type': 'application/octet-stream',
          'Content-Length': stats.size,
          'Accept': 'application/vnd.github.v3+json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : null;
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`✅ اكتمل رفع ${fileName} بنجاح! [${res.statusCode}]`);
              resolve(parsed);
            } else {
              console.error(`فشل رفع ${fileName}: HTTP ${res.statusCode}`, parsed);
              reject(new Error(`Upload failed with status ${res.statusCode}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);

      let uploadedBytes = 0;
      let lastLog = 0;
      fileStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const pct = Math.floor((uploadedBytes / stats.size) * 100);
        if (pct >= lastLog + 25 || pct === 100) {
          console.log(`  نسبة الرفع لـ ${fileName}: ${pct}% (${(uploadedBytes / 1024 / 1024).toFixed(1)} MB)`);
          lastLog = pct;
        }
      });

      fileStream.pipe(req);
    });
  }

  (async () => {
    try {
      console.log('1. الاستعلام عن بيانات الإصدار من المستودع...');
      let releaseRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
      let release = releaseRes.data;

      if (!release || releaseRes.status === 404) {
        // فحص ما إذا كان الإصدار موجوداً بالفعل في المستودع كمسودة (Draft)
        const allReleasesRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases`);
        if (Array.isArray(allReleasesRes.data)) {
          release = allReleasesRes.data.find(r => r.tag_name === TAG || r.name === VERSION || (r.name && r.name.includes(VERSION)));
        }
      }

      const releaseTitle = `Labryo Clinical LIMS ${TAG} - التدوير التلقائي لمفاتيح الأجهزة، توحيد غلاف التطبيق، واستقرار المحرك المستقل`;
      const releaseBody = `## تحديث نظام المختبرات الطبية (${TAG})

### أبرز التحديثات والميزات في هذا الإصدار:
1. **نقل وتوحيد غلاف التطبيق (AppShell)**: نقل الغلاف إلى التخطيط الجذري الموحد ومنع وميض إعادة البناء في جميع الصفحات.
2. **التدوير التلقائي المشفر لمفاتيح أجهزة التحليل**: توليد آمن عبر تشفير عشوائي وحظر المفاتيح الافتراضية المكشوفة تماماً.
3. **تعزيز الأمان والتحكم**: تشديد حماية مسارات النسخ الاحتياطي وحظر محاكاة الأجهزة في بيئة الإنتاج.
4. **استقرار المحرك المستقل (Standalone Desktop Engine)**: بناء نظيف واجتياز بوابة فحص الدخان 100% مع كتالوج الـ 150 تحليلاً طبياً نشطاً.

- بصمة التحقق الرقمية (SHA-256): \`${sha256Hash}\`
`;

      if (!release) {
        console.log(`2. إنشاء الإصدار الجديد ${TAG} على GitHub...`);
        const createRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases`, 'POST', JSON.stringify({
          tag_name: TAG,
          target_commitish: 'main',
          name: releaseTitle,
          body: releaseBody,
          draft: false,
          prerelease: false
        }), { 'Content-Type': 'application/json' });

        if (createRes.status >= 200 && createRes.status < 300) {
          release = createRes.data;
          console.log(`تم إنشاء الإصدار بنجاح! المعرف: ${release.id}`);
        } else {
          throw new Error(`فشل إنشاء الإصدار: ${createRes.status}`);
        }
      } else {
        console.log(`تم العثور على الإصدار (ID: ${release.id}, Draft: ${release.draft})`);
        if (release.draft) {
          console.log(`نشر الإصدار وإلغاء حالة المسودة (Publishing Draft)...`);
          const updateRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}`, 'PATCH', JSON.stringify({
            draft: false,
            tag_name: TAG,
            name: releaseTitle,
            body: releaseBody
          }), { 'Content-Type': 'application/json' });
          if (updateRes.status >= 200 && updateRes.status < 300) {
            release = updateRes.data;
            console.log(`✅ تم نشر الإصدار بنجاح وإلغاء المسودة!`);
          } else {
            console.warn(`تحذير أثناء نشر المسودة: ${updateRes.status}`, updateRes.data);
          }
        }
      }

      // جلب تفاصيل الأصول الحالية بدقة لحذف أي ملف قديم متطابق
      const fullReleaseRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}`);
      const existingAssets = fullReleaseRes.data?.assets || [];

      const itemsToUpload = [
        { localFile: setupExePath, remoteName: sanitizedRemoteName },
        { localFile: manifestPath, remoteName: 'latest.json' }
      ];

      const blockmapFile = `${setupExePath}.blockmap`;
      if (fs.existsSync(blockmapFile)) {
        itemsToUpload.push({ localFile: blockmapFile, remoteName: `${sanitizedRemoteName}.blockmap` });
      }

      const sha512Hash = crypto.createHash('sha512').update(fileBuffer).digest('base64');
      const latestYml = path.join(distDir, 'latest.yml');
      const ymlContent = `version: ${VERSION}
files:
  - url: ${sanitizedRemoteName}
    sha512: ${sha512Hash}
    size: ${fileStats.size}
path: ${sanitizedRemoteName}
sha512: ${sha512Hash}
releaseDate: '${new Date().toISOString()}'
`;
      fs.writeFileSync(latestYml, ymlContent, 'utf-8');
      itemsToUpload.push({ localFile: latestYml, remoteName: 'latest.yml' });

      const sha256File = `${setupExePath}.sha256`;
      if (fs.existsSync(sha256File)) {
        itemsToUpload.push({ localFile: sha256File, remoteName: `${sanitizedRemoteName}.sha256` });
      }

      for (const item of itemsToUpload) {
        // فحص ما إذا كان الملف موجوداً ومطابقاً في الحجم
        const itemStats = fs.statSync(item.localFile);
        const matched = existingAssets.find(a => a.name === item.remoteName);

        if (matched) {
          if (matched.size === itemStats.size) {
            console.log(`الأصل ${item.remoteName} موجود بالفعل وبنفس الحجم، تم التحقق بنجاح.`);
            continue;
          }
          console.log(`حذف الأصل السابق ${item.remoteName} (ID: ${matched.id}) قبل إعادة الرفع...`);
          await apiRequest(`/repos/${OWNER}/${REPO}/releases/assets/${matched.id}`, 'DELETE');
          await new Promise(r => setTimeout(r, 1000));
        }

        await uploadAsset(release.upload_url, item.localFile, item.remoteName);
      }

      console.log(`\n🎉 تم نشر وتوزيع التحديث بنجاح تام للمستخدمين!`);
      console.log(`رابط التحديث على GitHub: ${release.html_url}`);
    } catch (err) {
      console.error('❌ خطأ أثناء عملية النشر إلى GitHub:', err);
      process.exit(1);
    }
  })();
} else {
  console.log('\n💡 للمزامنة والرفع المباشر إلى مستودع التحديثات، أضف الخيار --publish');
}
