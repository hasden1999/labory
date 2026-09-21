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
const TAG = 'v1.0.9';

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

const { spawn } = require('child_process');

function uploadAsset(uploadUrlTemplate, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const cleanUrl = uploadUrlTemplate.split('{')[0];
    const uploadUrl = new URL(cleanUrl);
    uploadUrl.searchParams.set('name', fileName);

    const stats = fs.statSync(filePath);
    console.log(`Starting upload: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

    const args = [
      '--http1.1',
      '--keepalive-time', '15',
      '--connect-timeout', '60',
      '--progress-bar',
      '-X', 'POST',
      '-H', 'User-Agent: NodeJS-Labryo',
      '-H', `Authorization: token ${token}`,
      '-H', 'Content-Type: application/octet-stream',
      '-H', 'Accept: application/vnd.github.v3+json',
      '--data-binary', `@${filePath}`,
      uploadUrl.toString()
    ];

    const child = spawn('curl.exe', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let lastLoggedPct = 0;

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
      const str = d.toString();
      const match = str.match(/([0-9]{1,3}\.[0-9])%/);
      if (match) {
        const pct = parseFloat(match[1]);
        if (pct >= lastLoggedPct + 5 || pct === 100) {
          const logLine = `[${new Date().toLocaleTimeString()}] Upload progress for ${fileName}: ${pct}%`;
          console.log(logLine);
          try {
            fs.writeFileSync(path.join(__dirname, 'upload_status.txt'), `${pct}% - ${fileName} at ${new Date().toLocaleTimeString()}`, 'utf-8');
          } catch (e) {}
          lastLoggedPct = pct;
        }
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.id) {
            console.log(`Uploaded ${fileName} successfully! (Asset ID: ${parsed.id})`);
            resolve(parsed);
          } else {
            reject(new Error(`Failed parsing response: ${stdout}`));
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`curl exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  console.log('🚀 Publishing Labryo LIMS v1.0.9 to GitHub Releases...');

  // 1. Fetch existing releases
  const { data: releases } = await apiRequest(`/repos/${OWNER}/${REPO}/releases`);
  let release = releases.find(r => r.tag_name === TAG);

  const releaseTitle = 'Labryo LIMS v1.0.9 - تسريع الإقلاع الفوري، إرسال تقارير واتساب كصور وPDF مباشرة، وإغلاق سلس بدون تأخير';
  const releaseBody = `## 💎 ما الجديد في الإصدار v1.0.9 (Labryo Clinical LIMS):

### 1. القضاء التام على تأخر الإقلاع ورسالة المحرك المحلي:
- تحديث منطق الفحص الصحي (\`checkHttpHealth\`) وزيادة مهلة التحقق إلى 25 ثانية مع مراحل تدريجية ناطقة بالعربية، مما يمنع ظهور شاشات الخطأ الخاطئة أثناء الإقلاع البارد لأول مرة.
- الإقلاع الفوري والانتقال التلقائي للواجهة بمجرد جهوزية المحرك المحلي.

### 2. الإرسال الحقيقي لتقارير المرضى عبر واتساب (صور + PDF):
- تفعيل محرك **Baileys Multi-Device** المستقل مع تخزين جلسة التوثيق محلياً ومشفرة.
- إرسال نتائج التحاليل مباشرة كـ **صور عالية الدقة (HD Images)** لكل قسم ومستندات **PDF رسمية** مباشرة لرقم هاتف المريض، دون الاعتماد على روابط الشبكة المحلية غير القابلة للفتح.
- التحقق التلقائي من تنسيق الأرقام العراقية وتأكيد وصول الإشعار لحظياً.

### 3. إغلاق فوري فائق السرعة (<50ms):
- إخفاء نافذة البرنامج فوراً عند الضغط على [X] لمنع تجمد الواجهة أو ظهور رسائل "Not Responding".
- إنهاء العمليات التابعة بالخلفية بدقة عبر الأوامر الأصلية السريعة وتحرير المنفذ 8080 دون أي عمليات معلقة.

### 4. تسريع توليد التقارير الطبية (Puppeteer Singleton Pool):
- الإبقاء على نواة المتصفح جاهزة في الذاكرة لتوليد التقارير وطباعتها في أقل من 300ms.
- دعم الخطوط العربية الطبية المدمجة أوفلاين (Tajawal و Cairo) لضمان اتجاه RTL متناسق وجمالي.

---
### 📦 التحميل والترقية:
- **ملف التثبيت المكتبي المستقل:** [Labryo.LIMS.Setup.1.0.9.exe](https://github.com/hasden1999/lab-releases/releases/download/v1.0.9/Labryo.LIMS.Setup.1.0.9.exe)
- **التحديث التلقائي:** يتم اكتشاف الإصدار تلقائياً وتثبيته عبر إعدادات البرنامج أو تشغيل المثبت الجديد مباشرة.`;

  if (!release) {
    console.log(`Creating release ${TAG}...`);
    const createRes = await apiRequest(`/repos/${OWNER}/${REPO}/releases`, 'POST', JSON.stringify({
      tag_name: TAG,
      target_commitish: 'main',
      name: releaseTitle,
      body: releaseBody,
      draft: false,
      prerelease: false
    }), { 'Content-Type': 'application/json' });

    if (createRes.status !== 201) {
      console.error('Failed to create release:', createRes.status, createRes.data);
      process.exit(1);
    }
    release = createRes.data;
    console.log(`Created release ID: ${release.id}, url: ${release.html_url}`);
  } else {
    console.log(`Release ${TAG} already exists (ID: ${release.id})`);
    // Update name and body
    await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}`, 'PATCH', JSON.stringify({
      name: releaseTitle,
      body: releaseBody,
      draft: false,
      prerelease: false
    }), { 'Content-Type': 'application/json' });
  }

  // 2. Prepare paths and files to upload
  const distDir = path.join(__dirname, '..', 'apps', 'desktop', 'dist');
  const setupExe = path.join(distDir, 'Labryo.LIMS.Setup.1.0.9.exe');
  const setupBlockmap = path.join(distDir, 'Labryo.LIMS.Setup.1.0.9.exe.blockmap');
  const latestYml = path.join(distDir, 'latest.yml');

  if (!fs.existsSync(setupExe)) {
    console.error('Setup EXE does not exist:', setupExe);
    process.exit(1);
  }

  // Calculate SHA256 of setup exe
  console.log('Calculating SHA-256 hash...');
  const exeBuffer = fs.readFileSync(setupExe);
  const sha256Hash = crypto.createHash('sha256').update(exeBuffer).digest('hex');
  console.log('SHA-256:', sha256Hash);

  // Generate latest.json
  const latestJsonContent = JSON.stringify({
    version: '1.0.9',
    releaseDate: new Date().toISOString(),
    name: 'Labryo LIMS v1.0.9',
    notes: 'تسريع الإقلاع الفوري، إرسال تقارير واتساب كصور وPDF، وإغلاق سلس بدون تأخير.',
    url: `https://github.com/${OWNER}/${REPO}/releases/download/v1.0.9/Labryo.LIMS.Setup.1.0.9.exe`,
    sha256: sha256Hash,
  }, null, 2);

  const latestJsonPath = path.join(distDir, 'latest.json');
  fs.writeFileSync(latestJsonPath, latestJsonContent, 'utf-8');

  // 3. Upload assets
  console.log('Fetching existing assets for release...');
  const { data: freshAssets } = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
  const existingAssets = freshAssets || [];

  const itemsToUpload = [
    { filePath: latestJsonPath, name: 'latest.json' },
    { filePath: latestYml, name: 'latest.yml' },
    { filePath: setupBlockmap, name: 'Labryo.LIMS.Setup.1.0.9.exe.blockmap' },
    { filePath: setupExe, name: 'Labryo.LIMS.Setup.1.0.9.exe' },
  ];

  for (const item of itemsToUpload) {
    if (!fs.existsSync(item.filePath)) continue;

    const existing = existingAssets.find(a => a.name === item.name);
    if (existing) {
      console.log(`Deleting existing asset: ${item.name} (${existing.id})...`);
      await apiRequest(`/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`, 'DELETE');
    }

    await uploadAsset(release.upload_url, item.filePath, item.name);
  }

  console.log('\n======================================================');
  console.log('  🎉 RELEASE v1.0.9 PUBLISHED AND UPLOADED SUCCESSFULLY!');
  console.log(`  🌐 URL: ${release.html_url}`);
  console.log('======================================================');
}

main().catch(err => {
  console.error('Fatal error publishing v1.0.9:', err);
  process.exit(1);
});
