const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const tokenMatch = fs.readFileSync(envPath, 'utf-8').match(/GH_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
  console.error('GH_TOKEN not found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();
const OWNER = 'hasden1999';
const REPO = 'lab-releases';

const rootPkg = require('../package.json');
const VERSION = rootPkg.version || '1.3.0';
const TAG = `v${VERSION}`;

function requestGitHub(method, apiPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: method,
      headers: {
        'User-Agent': 'Labryo-Release-Publisher',
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
      }
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function uploadAssetFile(uploadUrlTemplate, filePath, fileName, contentType = 'application/octet-stream') {
  return new Promise((resolve, reject) => {
    const uploadUrlStr = uploadUrlTemplate.replace(/\{.*?\}$/, `?name=${encodeURIComponent(fileName)}`);
    const stat = fs.statSync(filePath);
    const size = stat.size;
    const sizeMB = (size / (1024 * 1024)).toFixed(1);

    console.log(`\nبدء رفع الملف: ${fileName} (${sizeMB} MB)...`);

    const args = [
      '--http1.1',
      '--ssl-no-revoke',
      '-#',
      '-w', '\nHTTP_CODE:%{http_code}',
      '-X', 'POST',
      '-H', 'User-Agent: Labryo-Release-Publisher',
      '-H', 'Authorization: token ' + token,
      '-H', `Content-Type: ${contentType}`,
      '-H', `Content-Length: ${size}`,
      '-H', 'Accept: application/vnd.github.v3+json',
      '--connect-timeout', '60',
      '--max-time', '1800',
      '--data-binary', `@${filePath}`,
      uploadUrlStr
    ];

    const child = spawn('curl.exe', args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.on('close', (code) => {
      const match = stdout.match(/HTTP_CODE:(\d+)/);
      const httpCode = match ? parseInt(match[1], 10) : 0;
      if (code === 0 && httpCode >= 200 && httpCode < 300) {
        console.log(`\n✅ تم اكتمال رفع: ${fileName} بنجاح! (Status ${httpCode})`);
        resolve(stdout);
      } else {
        reject(new Error(`فشل رفع ${fileName} برمز خطأ exit=${code}, HTTP=${httpCode}: ${stdout.slice(0, 300)}`));
      }
    });

    child.on('error', reject);
  });
}

async function cleanAssetByName(releaseId, fileName) {
  try {
    const res = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases/${releaseId}/assets`);
    if (Array.isArray(res.data)) {
      const match = res.data.find(a => a.name === fileName);
      if (match) {
        console.log(`🧹 تنظيف أصل سابق يحمل نفس الاسم (${fileName}, ID: ${match.id})...`);
        await requestGitHub('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${match.id}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  } catch (e) {
    // ignore
  }
}

async function uploadWithRetry(releaseId, uploadUrlTemplate, filePath, fileName, contentType, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await cleanAssetByName(releaseId, fileName);
      console.log(`\n--- محاولة الرفع [${attempt}/${maxRetries}] لملف ${fileName} ---`);
      return await uploadAssetFile(uploadUrlTemplate, filePath, fileName, contentType);
    } catch (err) {
      console.warn(`تحذير: فشلت المحاولة ${attempt}: ${err.message}`);
      if (attempt === maxRetries) throw err;
      console.log('انتظار 5 ثوانٍ قبل إعادة المحاولة...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function main() {
  console.log('======================================================');
  console.log(`🚀 نشر وتجهيز روابط التحميل المباشرة لإصدار ${TAG}`);
  console.log('======================================================\n');

  const distDir = path.resolve(__dirname, '../apps/desktop/dist');
  if (!fs.existsSync(distDir)) {
    throw new Error('مجلد dist غير موجود في apps/desktop/dist');
  }

  const standardExeName = `Labryo.LIMS.Setup.${VERSION}.exe`;
  const standardExePath = path.join(distDir, standardExeName);

  // Find generated Setup.exe matching this version precisely
  const distFiles = fs.readdirSync(distDir);
  const candidateExe = distFiles.find(f => 
    f.endsWith('.exe') && 
    !f.includes('Portable') && 
    f !== standardExeName && 
    f.includes('Setup') && 
    f.includes(VERSION)
  );

  const rawExePath = candidateExe ? path.join(distDir, candidateExe) : standardExePath;
  if (!fs.existsSync(rawExePath)) {
    throw new Error(`لم يتم العثور على ملف Setup.exe مبني يحمل الإصدار ${VERSION} في مجلد dist`);
  }

  // Strict Windows PE Header Validation
  let productVersion = '';
  try {
    productVersion = execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `(Get-Item -LiteralPath '${rawExePath}').VersionInfo.ProductVersion`
    ], { encoding: 'utf-8' }).trim();
  } catch (e) {
    throw new Error(`فشل استخراج ترويسة PE للملف ${rawExePath}: ${e.message}`);
  }

  console.log(`🔍 ترويسة ملف التثبيت: ${productVersion}`);
  if (productVersion !== VERSION) {
    throw new Error(`❌ عدم تطابق: ترويسة ملف التثبيت (${productVersion}) لا تطابق الإصدار المطلوب (${VERSION})!`);
  }

  if (rawExePath !== standardExePath) {
    console.log(`نسخ وتوحيد اسم ملف التثبيت إلى: ${standardExeName}...`);
    fs.copyFileSync(rawExePath, standardExePath);
  }

  // Handle latest.yml and stable.yml
  const latestYmlPath = path.join(distDir, 'latest.yml');
  if (!fs.existsSync(latestYmlPath)) {
    throw new Error('ملف latest.yml غير موجود في مجلد dist');
  }

  // Calculate sha512
  const exeBuffer = fs.readFileSync(standardExePath);
  const sha512 = crypto.createHash('sha512').update(exeBuffer).digest('base64');
  const exeSize = exeBuffer.length;

  console.log(`🔐 بصمة التجزئة SHA-512 للمثبت (${standardExeName}):\n${sha512}\n`);

  let ymlContent = fs.readFileSync(latestYmlPath, 'utf-8');
  ymlContent = ymlContent
    .replace(/^version:.*$/m, `version: ${VERSION}`)
    .replace(/^path:.*$/m, `path: ${standardExeName}`)
    .replace(/^sha512:.*$/m, `sha512: ${sha512}`)
    .replace(/- url:.*$/m, `- url: ${standardExeName}`)
    .replace(/  sha512:.*$/m, `  sha512: ${sha512}`)
    .replace(/  size:.*$/m, `  size: ${exeSize}`);

  fs.writeFileSync(latestYmlPath, ymlContent, 'utf-8');
  console.log('✅ تم تحديث ملف latest.yml لمطابقة اسم وحجم وبصمة المثبت بدقة.');

  const stableYmlPath = path.join(distDir, 'stable.yml');
  fs.writeFileSync(stableYmlPath, ymlContent, 'utf-8');
  console.log('✅ تم إنشاء وتحديث ملف stable.yml لضمان توافق التحديث التلقائي لكافة الأجهزة المثبتة مسبقاً.');

  let blockmapPath = null;
  const rawBlockmap = distFiles.find(f => 
    f.endsWith('.exe.blockmap') && 
    f !== `${standardExeName}.blockmap` && 
    f.includes(VERSION)
  );
  if (rawBlockmap) {
    const rawBmPath = path.join(distDir, rawBlockmap);
    const standardBmPath = path.join(distDir, `${standardExeName}.blockmap`);
    console.log(`نسخ خريطة الكتل وتوحيد الاسم إلى: ${standardBmPath}`);
    fs.copyFileSync(rawBmPath, standardBmPath);
    blockmapPath = standardBmPath;
  } else if (fs.existsSync(path.join(distDir, `${standardExeName}.blockmap`))) {
    blockmapPath = path.join(distDir, `${standardExeName}.blockmap`);
  }

  // 1. Check or create Release on GitHub
  console.log(`\nفحص الإصدار ${TAG} على مستودع ${OWNER}/${REPO}...`);
  let relRes = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
  let release = null;

  const releaseTitle = `Labryo Clinical LIMS ${TAG} - تكامل جهاز Mindray BC-30 / BC-30s (TCP Client المنفذ 5100) وتحديث شاشة الأجهزة`;
  const releaseBody = `### تحديث نظام Labryo Clinical LIMS (${TAG})

- **1. دعم الاتصال المباشر (TCP Client) لجهاز Mindray BC-30 / BC-30s:**
  - يعمل جهاز Mindray BC-30s كـ TCP Server على المنفذ الثابت 5100. يتصل Labryo الآن كـ TCP Client بالجهاز مباشرة مع خاصية Keep-Alive وإعادة الاتصال التلقائي.
  - إرسال رد التأكيد الفوري (HL7 ACK MLLP) المتوافق مع معايير Mindray فور استلام التحليل.

- **2. استخراج كافة معاملات صورة الدم الـ 21 (Full 21-Parameter HL7 Parsing):**
  - دعم كامل لصيغ LOINC و 99MRC واستخراج معاملات التفريق الثلاثي (Gran#, Mid#, Lym#, Gran%, Mid%, Lym%) ومعاملات الصفائح (P-LCR, P-LCC).
  - فلترة وتجاهل حقول الميتاداتا التقنية وتحديث شاشة المريض والطباعة فوراً.

- **3. تحسينات شاشة الأجهزة الطبية:**
  - إضافة إمكانية تعديل IP الجهاز ومنفذه ونوع الاتصال (TCP Client / TCP Server).
  - إرشادات وخطوات واضحة ودقيقة مطابقة لشاشات أجهزة Mindray.

روابط التنزيل المباشر أدناه.`;

  if (relRes.status === 200 && relRes.data) {
    release = relRes.data;
    console.log(`تم العثور على الإصدار (ID: ${release.id}, Draft: ${release.draft})`);
  } else {
    const allRels = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases`);
    if (Array.isArray(allRels.data)) {
      release = allRels.data.find(r => r.tag_name === TAG);
      if (release) {
        console.log(`تم العثور على مسودة الإصدار (ID: ${release.id}, Draft: ${release.draft})`);
      }
    }
  }

  if (!release) {
    console.log(`إنشاء إصدار جديد ${TAG} على ${OWNER}/${REPO}...`);
    const createBody = JSON.stringify({
      tag_name: TAG,
      target_commitish: 'main',
      name: releaseTitle,
      body: releaseBody,
      draft: true,
      prerelease: false,
    });
    const createRes = await requestGitHub('POST', `/repos/${OWNER}/${REPO}/releases`, createBody);
    if (createRes.status !== 201 && createRes.status !== 200) {
      throw new Error(`فشل إنشاء Release على GitHub: status ${createRes.status}`);
    }
    release = createRes.data;
    console.log(`✅ تم إنشاء الإصدار بنجاح! ID: ${release.id}`);
  }

  // 2. Prepare files to upload
  const filesToUpload = [
    { name: standardExeName, path: standardExePath, type: 'application/octet-stream' },
    { name: 'latest.yml', path: latestYmlPath, type: 'text/yaml' },
    { name: 'stable.yml', path: stableYmlPath, type: 'text/yaml' },
  ];
  if (blockmapPath && fs.existsSync(blockmapPath)) {
    filesToUpload.push({ name: `${standardExeName}.blockmap`, path: blockmapPath, type: 'application/octet-stream' });
  }

  // Also check for legacy universal installer in dist-legacy
  const distLegacyDir = path.resolve(__dirname, '../apps/desktop/dist-legacy');
  if (fs.existsSync(distLegacyDir)) {
    const legacyFiles = fs.readdirSync(distLegacyDir);
    const legacyExe = legacyFiles.find(f => f.endsWith('.exe') && !f.includes('elevate') && !f.includes('unins'));
    if (legacyExe) {
      const legacyExePath = path.join(distLegacyDir, legacyExe);
      const legacyRemoteName = `Labryo.LIMS.Universal.Setup.${VERSION}.exe`;
      filesToUpload.push({ name: legacyRemoteName, path: legacyExePath, type: 'application/octet-stream' });
      console.log(`📦 تم تضمين مثبت النسخة الشاملة للأجهزة القديمة (${legacyRemoteName}) ضمن ملفات الرفع.`);

      const legacyBlockmap = path.join(distLegacyDir, `${legacyExe}.blockmap`);
      if (fs.existsSync(legacyBlockmap)) {
        filesToUpload.push({ name: `${legacyRemoteName}.blockmap`, path: legacyBlockmap, type: 'application/octet-stream' });
      }

      const legacyYml = path.join(distLegacyDir, 'legacy.yml');
      if (fs.existsSync(legacyYml)) {
        let legContent = fs.readFileSync(legacyYml, 'utf-8');
        legContent = legContent
          .replace(/- url:.*$/m, `- url: ${legacyRemoteName}`)
          .replace(/^path:.*$/m, `path: ${legacyRemoteName}`);
        fs.writeFileSync(legacyYml, legContent, 'utf-8');
        filesToUpload.push({ name: 'legacy.yml', path: legacyYml, type: 'text/yaml' });
      }
    }
  }

  // 3. Delete existing or orphan assets before upload
  const existingAssetsRes = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
  const currentAssets = Array.isArray(existingAssetsRes.data) ? existingAssetsRes.data : (release.assets || []);
  
  for (const asset of currentAssets) {
    const isTarget = filesToUpload.some(f => f.name === asset.name);
    const isOrphan = asset.name.includes('@lab-manager') || asset.name.includes('Setup') || asset.name === 'latest.yml' || asset.name === 'stable.yml' || asset.name === 'legacy.yml';
    if (isTarget || isOrphan) {
      console.log(`تنظيف الملف ${asset.name} (ID: ${asset.id})...`);
      await requestGitHub('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${asset.id}`);
    }
  }

  // 4. Upload files
  for (const f of filesToUpload) {
    await uploadWithRetry(release.id, release.upload_url, f.path, f.name, f.type);
  }

  // 5. Finalize and publish release (set draft: false)
  console.log(`\nنشر الإصدار النهائي ${TAG} وإلغاء وضع المسودة (Publish Release)...`);
  const updateBody = JSON.stringify({
    name: releaseTitle,
    body: releaseBody,
    draft: false,
  });
  const publishRes = await requestGitHub('PATCH', `/repos/${OWNER}/${REPO}/releases/${release.id}`, updateBody);
  if (publishRes.status !== 200) {
    console.warn(`تحذير أثناء تحديث حالة الإصدار: ${publishRes.status}`);
  } else {
    console.log(`✅ تم نشر الإصدار رسمياً وإتاحته للمستخدمين والمحدّث التلقائي!`);
  }

  // 6. Output direct download URLs
  const directExeUrl = `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/${standardExeName}`;
  const directLegacyExeUrl = `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/Labryo.LIMS.Universal.Setup.${VERSION}.exe`;
  const latestDirectUrl = `https://github.com/${OWNER}/${REPO}/releases/latest/download/${standardExeName}`;
  const releasePageUrl = release.html_url || `https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}`;

  console.log('\n======================================================');
  console.log('🎉 تم رفع التحديث وربط روابط التحميل المباشرة بنجاح!');
  console.log('======================================================');
  console.log(`\n📥 1. رابط التحميل المباشر للنسخة الحديثة (Modern Setup x64):`);
  console.log(directExeUrl);
  console.log(`\n📥 2. رابط التحميل المباشر للنسخة الشاملة للأجهزة القديمة (Universal Setup 32/64-bit):`);
  console.log(directLegacyExeUrl);
  console.log(`\n⚡ 3. رابط التحميل المباشر التلقائي لأحدث إصدار (Always Latest):`);
  console.log(latestDirectUrl);
  console.log(`\n🌐 4. صفحة الإصدار الرسمية على GitHub:`);
  console.log(releasePageUrl);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('\n❌ خطأ أثناء الرفع والنشر:', err.message);
  process.exit(1);
});
