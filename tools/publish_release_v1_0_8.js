const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const envContent = fs.readFileSync('.env', 'utf-8');
const tokenMatch = envContent.match(/GH_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
  console.error('No GH_TOKEN found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();

const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const TAG = 'v1.0.8';

function apiRequest(reqPath, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: reqPath,
      method,
      headers: {
        'User-Agent': 'NodeJS-Labryo',
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
    console.log(`Starting upload: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

    const fileStream = fs.createReadStream(filePath);

    const req = https.request({
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'POST',
      headers: {
        'User-Agent': 'NodeJS-Labryo',
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
            console.log(`Uploaded ${fileName} successfully! [${res.statusCode}]`);
            resolve(parsed);
          } else {
            console.error(`Failed to upload ${fileName}: HTTP ${res.statusCode}`, parsed);
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
      if (pct >= lastLog + 20 || pct === 100) {
        console.log(`Upload progress for ${fileName}: ${pct}% (${(uploadedBytes / 1024 / 1024).toFixed(1)} MB / ${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
        lastLog = pct;
      }
    });

    fileStream.pipe(req);
  });
}

async function main() {
  console.log('🚀 Publishing Labryo LIMS v1.0.8 to GitHub Releases...');

  // 1. Fetch existing releases
  const { data: releases } = await apiRequest(`/repos/${OWNER}/${REPO}/releases`);
  const v108Releases = releases.filter(r => r.tag_name === TAG);
  console.log(`Found ${v108Releases.length} release(s) with tag ${TAG}`);

  // Find the primary release that has the .exe (or create/pick the one with assets)
  let primaryRelease = v108Releases.find(r => r.assets && r.assets.some(a => a.name.endsWith('.exe')));
  if (!primaryRelease && v108Releases.length > 0) {
    primaryRelease = v108Releases[0];
  }

  // Delete duplicate empty or secondary draft releases
  for (const r of v108Releases) {
    if (r.id !== primaryRelease.id) {
      console.log(`Deleting redundant draft release: ${r.id}...`);
      await apiRequest(`/repos/${OWNER}/${REPO}/releases/${r.id}`, 'DELETE');
    }
  }

  console.log(`Target release ID: ${primaryRelease.id} (draft: ${primaryRelease.draft})`);

  // 2. Prepare paths
  const distDir = path.join(__dirname, '..', 'apps', 'desktop', 'dist');
  const setupExe = path.join(distDir, 'Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية Setup 1.0.8.exe');
  const setupBlockmap = path.join(distDir, 'Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية Setup 1.0.8.exe.blockmap');
  const latestYml = path.join(distDir, 'latest.yml');

  const existingAssetNames = new Set(primaryRelease.assets.map(a => a.name));

  // Also upload Labryo.LIMS.Setup.1.0.8.exe for clean direct link downloads
  if (fs.existsSync(setupExe) && !existingAssetNames.has('Labryo.LIMS.Setup.1.0.8.exe')) {
    await uploadAsset(primaryRelease.upload_url, setupExe, 'Labryo.LIMS.Setup.1.0.8.exe');
  }

  if (fs.existsSync(setupBlockmap) && !existingAssetNames.has('Labryo.LIMS.Setup.1.0.8.exe.blockmap')) {
    await uploadAsset(primaryRelease.upload_url, setupBlockmap, 'Labryo.LIMS.Setup.1.0.8.exe.blockmap');
  }

  if (fs.existsSync(setupBlockmap) && !existingAssetNames.has('@lab-manager.desktop-setup-1.0.8.exe.blockmap')) {
    await uploadAsset(primaryRelease.upload_url, setupBlockmap, '@lab-manager.desktop-setup-1.0.8.exe.blockmap');
  }

  // Calculate SHA256 of setup exe
  const exeBuffer = fs.readFileSync(setupExe);
  const sha256Hash = crypto.createHash('sha256').update(exeBuffer).digest('hex');

  // Generate latest.json
  const latestJsonContent = JSON.stringify({
    version: '1.0.8',
    releaseDate: new Date().toISOString(),
    name: 'Labryo LIMS v1.0.8',
    notes: 'الانتقال الجذري إلى قاعدة بيانات SQLite العلائقية (WAL Mode) عبر Prisma مع استقرار كامل ومقاومة انقطاع الكهرباء.',
    url: `https://github.com/${OWNER}/${REPO}/releases/download/v1.0.8/Labryo.LIMS.Setup.1.0.8.exe`,
    sha256: sha256Hash,
  }, null, 2);

  const latestJsonPath = path.join(distDir, 'latest.json');
  fs.writeFileSync(latestJsonPath, latestJsonContent, 'utf-8');

  // Upload latest.json
  const existingLatestJson = primaryRelease.assets.find(a => a.name === 'latest.json');
  if (existingLatestJson) {
    console.log('Deleting existing latest.json asset...');
    await apiRequest(`/repos/${OWNER}/${REPO}/releases/assets/${existingLatestJson.id}`, 'DELETE');
  }
  await uploadAsset(primaryRelease.upload_url, latestJsonPath, 'latest.json');

  // 3. Publish the release with professional Arabic release notes
  const releaseTitle = 'Labryo LIMS v1.0.8 - التحول لقاعدة بيانات SQLite العلائقية (WAL Mode) واستقرار كامل ضد انقطاع الطاقة';
  const releaseBody = `## 💎 ما الجديد في الإصدار v1.0.8 (Labryo LIMS):

### 1. التحول الجذري إلى قاعدة بيانات SQLite علائقية متقدمة (WAL Mode):
- استبدال التخزين النصي السابق (Flat JSON) بـ **قاعدة بيانات SQLite علائقية حقيقية ومفهرسة بالكامل** تُدار عبر **Prisma ORM**.
- تفعيل وضع الكتابة المسبقة (**Write-Ahead Logging / WAL Mode**) مع \`PRAGMA synchronous = NORMAL\` و \`busy_timeout = 5000ms\`.
- حماية تامة ضد تلف البيانات أو فقدانها عند انقطاع التيار الكهربائي المفاجئ أو إغلاق النظام غير المتوقع.
- ترحيل كافة الفحوصات الطبية (221 فحصاً و 28 باقة) والمرضى والعينات والأجهزة المخبرية دون فقدان أي سجل.

### 2. تكامل واجهات النظام ومحرك المزامنة اللحظية:
- عمليات الاستقبال، إدخال النتائج، المحاسبة، الورديات، والديون تُحفظ وتُستعلم الآن عبر معاملات ذرية عالية السرعة (Atomic ACID Transactions).
- دمج وحزم محرك Prisma وقاعدة البيانات تلقائياً في مسار بيانات المستخدم (\`userData/data/lab.db\`) مع الحفاظ على البيانات السابقة عند التحديث.

---
### 📦 التحميل والترقية:
- **ملف التثبيت المكتبي المباشر:** [Labryo.LIMS.Setup.1.0.8.exe](https://github.com/hasden1999/lab-releases/releases/download/v1.0.8/Labryo.LIMS.Setup.1.0.8.exe)
- **بصمة التحقق التشفيرية (SHA-256):** \`${sha256Hash}\`
- **التحديث التلقائي:** سيصل التحديث تلقائياً لكافة المشتركين عبر برنامج سطح المكتب بنقرة زر واحدة.`;

  console.log('Publishing release (draft = false)...');
  const updateRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${primaryRelease.id}`, 'PATCH', JSON.stringify({
    name: releaseTitle,
    body: releaseBody,
    draft: false,
    prerelease: false,
  }));

  if (updateRes.status >= 200 && updateRes.status < 300) {
    console.log('🎉 RELEASE v1.0.8 PUBLISHED SUCCESSFULLY!');
    console.log(`URL: ${updateRes.data.html_url}`);
  } else {
    console.error('Failed to publish release:', updateRes);
  }
}

main().catch(console.error);
