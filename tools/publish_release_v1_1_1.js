const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { spawn } = require('child_process');

const envContent = fs.readFileSync('.env', 'utf-8');
const tokenMatch = envContent.match(/GH_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
  console.error('No GH_TOKEN found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();

const OWNER = 'hasden1999';
const REPO = 'lab-releases';
const TAG = 'v1.1.1';

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
          lastLoggedPct = pct;
        }
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.id) {
            console.log(`✅ Uploaded ${fileName} successfully! (Asset ID: ${parsed.id})`);
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
  console.log('🚀 Publishing Labryo LIMS v1.1.1 to GitHub Releases...');

  const releaseTitle = 'Labryo LIMS v1.1.1 - استرجاع إعدادات الفورمة وتدقيق كتالوج التحاليل وتخصيص التصميم وخلو تام من High/Low';
  const releaseBody = `## 💎 ما الجديد في الإصدار v1.1.1 (Labryo Clinical LIMS):

### 1. استرجاع إعدادات فورمة النتائج والتقارير كاملة (REG-01):
- استرجاع كافة الـ 63 إعداداً تشغيلياً لفورمة التقارير (الهوامش، حجم الورق، الترويسة، التذييل، والتوقيع).
- تنظيم الإعدادات في لوحة مصمم الطباعة مع معاينة حية متزامنة فورياً.

### 2. تدقيق كتالوج التحاليل وإزالة التكرارات بصفر فقدان للبيانات (DATA-01):
- معالجة تكرار التحاليل وإعادة الكتالوج إلى حجمه الحقيقي الدقيق (142 تحليلاً سريرياً معتمداً بدلاً من 221 تكراراً).
- ظهور فحص صورة الدم الكاملة (CBC) مرة واحدة فقط في كافة الشاشات والقوائم.
- إعادة ربط ومطابقة سجلات المرضى والفحوصات القائمة تلقائياً بنسبة سلامة 100% دون أي فقدان للبيانات.

### 3. إضافات التصميم والطباعة المتقدمة (DESIGN-01 & DESIGN-02):
- تبويب الألوان والخطوط المخصصة: إمكانية اختيار لوحات ألوان متعددة ودعم كامل للخطوط العربية الاحترافية المدمجة.
- تبويب ترتيب أعمدة النتائج وتخصيص عرض الجداول حسب احتياج المختبر.

### 4. الالتزام السريري الصارم:
- استئصال وحظر قطعي لأي عمود أو مؤشر للارتفاع/الانخفاض (High / Low) في جداول النتائج، نماذج الإدخال، وشاشات المعاينة والطباعة.

---
### 📦 التحميل والترقية:
- **ملف التثبيت المكتبي المستقل:** [Labryo.LIMS.Setup.1.1.1.exe](https://github.com/hasden1999/lab-releases/releases/download/v1.1.1/Labryo.LIMS.Setup.1.1.1.exe)
- **التحديث التلقائي:** يتم اكتشاف وتثبيت الإصدار تلقائياً عبر نظام التحديث المدمج في البرنامج.`;

  // 1. Fetch existing releases
  const { data: releases } = await apiRequest(`/repos/${OWNER}/${REPO}/releases`);
  let release = Array.isArray(releases) ? releases.find(r => r.tag_name === TAG) : null;

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
    await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}`, 'PATCH', JSON.stringify({
      name: releaseTitle,
      body: releaseBody,
      draft: false,
      prerelease: false
    }), { 'Content-Type': 'application/json' });
  }

  // 2. Prepare paths and files to upload
  const distDir = path.join(__dirname, '..', 'apps', 'desktop', 'dist');
  const filesInDist = fs.readdirSync(distDir);

  // Find the generated setup exe for 1.1.1
  const origSetupName = filesInDist.find(f => f.includes('1.1.1') && f.endsWith('.exe') && !f.includes('nsis'));
  if (!origSetupName) {
    console.error('No 1.1.1 setup EXE found in dist directory!');
    process.exit(1);
  }

  const origSetupPath = path.join(distDir, origSetupName);
  console.log(`Found built installer: ${origSetupName} (${(fs.statSync(origSetupPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Ensure clean ascii named version for direct link download
  const standardSetupExe = path.join(distDir, 'Labryo.LIMS.Setup.1.1.1.exe');
  fs.copyFileSync(origSetupPath, standardSetupExe);

  // Blockmap if exists
  const origBlockmap = origSetupPath + '.blockmap';
  const standardBlockmap = path.join(distDir, 'Labryo.LIMS.Setup.1.1.1.exe.blockmap');
  if (fs.existsSync(origBlockmap)) {
    fs.copyFileSync(origBlockmap, standardBlockmap);
  }

  const latestYml = path.join(distDir, 'latest.yml');

  // Calculate SHA256 of setup exe
  console.log('Calculating SHA-256 hash...');
  const exeBuffer = fs.readFileSync(standardSetupExe);
  const sha256Hash = crypto.createHash('sha256').update(exeBuffer).digest('hex');
  console.log('SHA-256:', sha256Hash);

  // Generate latest.json
  const latestJsonContent = JSON.stringify({
    version: '1.1.1',
    releaseDate: new Date().toISOString(),
    name: 'Labryo LIMS v1.1.1',
    notes: 'استرجاع إعدادات الفورمة وتدقيق كتالوج التحاليل وتخصيص التصميم وخلو تام من High/Low.',
    url: `https://github.com/${OWNER}/${REPO}/releases/download/v1.1.1/Labryo.LIMS.Setup.1.1.1.exe`,
    sha256: sha256Hash,
  }, null, 2);

  const latestJsonPath = path.join(distDir, 'latest.json');
  fs.writeFileSync(latestJsonPath, latestJsonContent, 'utf-8');

  // Update latest.yml to point cleanly to standard name or ensure correct properties
  if (fs.existsSync(latestYml)) {
    let ymlContent = fs.readFileSync(latestYml, 'utf-8');
    // If it has url: '@lab-manager/desktop-setup-1.1.1.exe', update it
    ymlContent = ymlContent.replace(/url:\s*.+/g, `url: Labryo.LIMS.Setup.1.1.1.exe`);
    ymlContent = ymlContent.replace(/path:\s*.+/g, `path: Labryo.LIMS.Setup.1.1.1.exe`);
    fs.writeFileSync(latestYml, ymlContent, 'utf-8');
  }

  // 3. Upload assets
  console.log('Fetching existing assets for release...');
  const { data: freshAssets } = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
  const existingAssets = freshAssets || [];

  const itemsToUpload = [
    { filePath: latestJsonPath, name: 'latest.json' },
    { filePath: latestYml, name: 'latest.yml' },
    { filePath: standardBlockmap, name: 'Labryo.LIMS.Setup.1.1.1.exe.blockmap' },
    { filePath: standardSetupExe, name: 'Labryo.LIMS.Setup.1.1.1.exe' },
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
  console.log('  🎉 RELEASE v1.1.1 PUBLISHED AND UPLOADED SUCCESSFULLY!');
  console.log(`  🌐 URL: ${release.html_url}`);
  console.log('======================================================');
}

main().catch(err => {
  console.error('Fatal error publishing v1.1.1:', err);
  process.exit(1);
});
