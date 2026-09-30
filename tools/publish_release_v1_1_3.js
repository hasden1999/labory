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
const TAG = 'v1.1.3';
const VERSION = '1.1.3';

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
      '--keepalive-time', '30',
      '--connect-timeout', '120',
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
  console.log(`🚀 Publishing Labryo LIMS ${TAG} to GitHub Releases...`);

  const releaseTitle = `Labryo LIMS ${TAG} - تحديث شامل لفورمة الإدرار (Urine) وفورمة الخروج (Stool) ودقة التشخيص السريري`;
  const releaseBody = `## 💎 ما الجديد في الإصدار ${TAG} (Labryo Clinical LIMS):

### 1. تحسينات شاملة ومرونة فائقة لفورمة فحص الإدرار (Urine Analysis - GUE):
- **تخصيص متعدد ودقيق للبلورات (Crystals):** إمكانية إدخال أنواع متعددة من البلورات دفعة واحدة (مثل Calcium Oxalate، Uric Acid، Triple Phosphate، وغيرها) مع تحديد كميات ونسب مخصصة لكل نوع.
- **إضافة حقل بلورات أخرى (Other Crystals):** حقل كتابة حر يدعم إدخال أي بلورات نادرة أو غير شائعة مع كميتها السريرية.
- **إزالة طفيلي المشعرات وإضافة خيار حر (Other):** استبدال حقل Trichomonas Vaginalis بخيار Other مرن مع قائمة منسدلة وحقل إدخال يدوي حر.
- **تطوير إدخال الأسطوانات (Casts) والخمائر (Yeast):** دعم إدخال تفصيلي وكتابة يدوية حرة لكميات الأسطوانات والخمائر لتعزيز دقة التقرير السريري.

### 2. ترقية وتطوير فورمة فحص الخروج (Stool Analysis - GSE):
- **إلغاء نظام الصلبان والرموز التقليدية:** استبدال الصلايب (+++/++) بنظام إدخال مرن للكميات والقيم الرقمية أو الوصفية المعتمدة.
- **دعم وتوثيق طور الطفيليات (Parasite Stage):** إمكانية تحديد طور الطفيلي بدقة في النتائج والطباعة (Cyst، Trophozoite، أو كلاهما Both).
- **إضافة فحص الخمائر (Yeast / Monilia):** خانة متخصصة ومستقلة لفحص الخمائر والفطريات في عينات البراز مع دعم كامل للطباعة والتقارير.

### 3. التوافق العكسي وجودة الطباعة المخبرية:
- استعراض وطباعة النتائج وفق أحدث المعايير الطبية السريرية مع دعم كامل للطباعة باللغتين ومطابقة الهيدر والفوتر.
- الحفاظ الكامل على كافة السجلات والنتائج القديمة دون أي تأثر أو فقدان للبيانات السابقة.

---
### 📦 التحميل والترقية:
- **ملف التثبيت المكتبي المستقل:** [Labryo.LIMS.Setup.${VERSION}.exe](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/Labryo.LIMS.Setup.${VERSION}.exe)
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

  // Find the generated setup exe for 1.1.3
  const origSetupName = filesInDist.find(f => f.includes(VERSION) && f.endsWith('.exe') && !f.includes('nsis'));
  if (!origSetupName) {
    console.error(`No ${VERSION} setup EXE found in dist directory!`);
    process.exit(1);
  }

  const origSetupPath = path.join(distDir, origSetupName);
  console.log(`Found built installer: ${origSetupName} (${(fs.statSync(origSetupPath).size / 1024 / 1024).toFixed(2)} MB)`);

  const standardSetupExe = path.join(distDir, `Labryo.LIMS.Setup.${VERSION}.exe`);
  if (origSetupPath !== standardSetupExe) {
    fs.copyFileSync(origSetupPath, standardSetupExe);
  }

  // Blockmap if exists
  const origBlockmap = origSetupPath + '.blockmap';
  const standardBlockmap = path.join(distDir, `Labryo.LIMS.Setup.${VERSION}.exe.blockmap`);
  if (fs.existsSync(origBlockmap) && origBlockmap !== standardBlockmap) {
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
    version: VERSION,
    releaseDate: new Date().toISOString(),
    name: `Labryo LIMS ${TAG}`,
    notes: 'تحديث شامل لفورمة الإدرار (Urine) وفورمة الخروج (Stool) ودقة التشخيص السريري.',
    url: `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/Labryo.LIMS.Setup.${VERSION}.exe`,
    sha256: sha256Hash,
  }, null, 2);

  const latestJsonPath = path.join(distDir, 'latest.json');
  fs.writeFileSync(latestJsonPath, latestJsonContent, 'utf-8');

  // Update latest.yml to point cleanly to standard name
  if (fs.existsSync(latestYml)) {
    let ymlContent = fs.readFileSync(latestYml, 'utf-8');
    ymlContent = ymlContent.replace(/url:\s*.+/g, `url: Labryo.LIMS.Setup.${VERSION}.exe`);
    ymlContent = ymlContent.replace(/path:\s*.+/g, `path: Labryo.LIMS.Setup.${VERSION}.exe`);
    fs.writeFileSync(latestYml, ymlContent, 'utf-8');
  }

  // 3. Upload assets
  console.log('Fetching existing assets for release...');
  const { data: freshAssets } = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
  const existingAssets = freshAssets || [];

  const itemsToUpload = [
    { filePath: latestJsonPath, name: 'latest.json' },
    { filePath: latestYml, name: 'latest.yml' },
    { filePath: standardBlockmap, name: `Labryo.LIMS.Setup.${VERSION}.exe.blockmap` },
    { filePath: standardSetupExe, name: `Labryo.LIMS.Setup.${VERSION}.exe` },
  ];

  for (const item of itemsToUpload) {
    if (!fs.existsSync(item.filePath)) continue;
    const fileStats = fs.statSync(item.filePath);

    const existing = existingAssets.find(a => a.name === item.name);
    if (existing && existing.state === 'uploaded' && existing.size === fileStats.size) {
      console.log(`⚡ Asset ${item.name} already fully uploaded (${existing.size} bytes), skipping.`);
      continue;
    }

    if (existing) {
      console.log(`Deleting incomplete/outdated asset: ${item.name} (${existing.id})...`);
      await apiRequest(`/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`, 'DELETE');
    }

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`\nAttempt ${attempt}/3 for ${item.name}...`);
        await uploadAsset(release.upload_url, item.filePath, item.name);
        success = true;
        break;
      } catch (err) {
        console.error(`Attempt ${attempt} error for ${item.name}:`, err.message);
        if (attempt < 3) {
          console.log('Cleaning up partial asset before retry...');
          try {
            const { data: checkAssets } = await apiRequest(`/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
            const partial = (checkAssets || []).find(a => a.name === item.name);
            if (partial) {
              await apiRequest(`/repos/${OWNER}/${REPO}/releases/assets/${partial.id}`, 'DELETE');
            }
          } catch (e) {}
          console.log('Waiting 5 seconds before next attempt...');
          await new Promise(r => setTimeout(r, 5000));
        } else {
          throw err;
        }
      }
    }
  }

  console.log('\n======================================================');
  console.log(`  🎉 RELEASE ${TAG} PUBLISHED AND UPLOADED SUCCESSFULLY!`);
  console.log(`  🌐 URL: ${release.html_url}`);
  console.log('======================================================');
}

main().catch(err => {
  console.error(`Fatal error publishing ${TAG}:`, err);
  process.exit(1);
});
