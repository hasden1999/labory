const fs = require('fs');
const path = require('path');
const https = require('https');

const envContent = fs.readFileSync('.env', 'utf-8');
const tokenMatch = envContent.match(/GH_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
  console.error('No GH_TOKEN found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();

const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const TAG = 'v1.0.1';

function apiRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
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

(async () => {
  try {
    console.log('1. Checking existing releases...');
    const releasesRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases`);
    let release = releasesRes.data?.find(r => r.tag_name === TAG);

    if (!release) {
      console.log(`2. Creating Release ${TAG}...`);
      const createRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases`, 'POST', JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: 'Labryo LIMS v1.0.1 - التحديث فائق السرعة وتحسينات الأداء الشاملة',
        body: `## تحديث نظام لابريو لإدارة المختبرات الطبية (Labryo LIMS v1.0.1)

### أبرز التحسينات والميزات:
- **تفعيل التسريع العتادي الكامل (GPU Hardware Acceleration):** سلاسة فائقة بمعدل 60 إطاراً في الثانية في كافة النوافذ وجداول العينات دون استهلاك زائد للمعالج.
- **التشغيل الفوري الصامت (Instant Background Launch):** إقلاع مسبق ذكي في خلفية ويندوز لتصفير زمن انتظار تشغيل البرنامج لأقل من 500ms.
- **طبقة بيانات غير متزامنة (Non-blocking Asynchronous I/O):** تحويل عمليات الحفظ إلى الخلفية لتسريع تسجيل واستلام العينات بنسبة تفوق 10 أضعاف مع الحفاظ التام على أمان وسلامة البيانات.
- **التخزين المؤقت لكتالوج الفحوصات (Catalog In-Memory Cache):** فتح شاشات الاستقبال والطلب فوراً بدون أي تأخير.
- **الحفاظ التام على البيانات والتراخيص السابقة:** التحديث يعمل تلقائياً وبشكل انسيابي وآمن.`,
        draft: false,
        prerelease: false
      }), { 'Content-Type': 'application/json' });

      if (createRes.status !== 201) {
        console.error('Failed to create release:', createRes.status, createRes.data);
        process.exit(1);
      }
      release = createRes.data;
      console.log(`Created release id: ${release.id}, url: ${release.html_url}`);
    } else {
      console.log(`Release ${TAG} already exists (id: ${release.id})`);
    }

    const distDir = path.resolve(__dirname, '../apps/desktop/dist');
    const filesToUpload = [
      'latest.yml',
      'Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية Setup 1.0.1.exe.blockmap',
      'Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية Setup 1.0.1.exe'
    ];

    console.log('3. Checking existing assets...');
    const existingAssets = release.assets || [];

    for (const fileName of filesToUpload) {
      const existing = existingAssets.find(a => a.name === fileName);
      if (existing) {
        console.log(`Asset ${fileName} already exists (id: ${existing.id}), deleting to replace...`);
        await apiRequest(`/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`, 'DELETE');
        console.log(`Deleted existing ${fileName}`);
      }

      const filePath = path.join(distDir, fileName);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      await uploadAsset(release.upload_url, filePath, fileName);
    }

    console.log('\n=== RELEASE DEPLOYMENT COMPLETED SUCCESSFULLY ===');
    console.log(`Release URL: ${release.html_url}`);
  } catch (err) {
    console.error('Error during release upload:', err);
    process.exit(1);
  }
})();
