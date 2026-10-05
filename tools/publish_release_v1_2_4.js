const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

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
const VERSION = rootPkg.version || '1.2.4';
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
    const cleanUrl = uploadUrlTemplate.split('{')[0];
    const uploadUrl = new URL(cleanUrl);
    uploadUrl.searchParams.set('name', fileName);

    const stats = fs.statSync(filePath);
    const size = stats.size;
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    console.log(`\nجاري رفع الملف عبر تدفق آمن ومستقر: ${fileName} (${sizeMB} MB)...`);

    const options = {
      method: 'POST',
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      headers: {
        'User-Agent': 'Labryo-Release-Publisher',
        'Authorization': 'token ' + token,
        'Content-Type': contentType,
        'Content-Length': size,
        'Accept': 'application/vnd.github.v3+json',
      },
      timeout: 600000, // 10 minutes
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`\n✅ تم اكتمال رفع: ${fileName} بنجاح! (Status ${res.statusCode})`);
          resolve(data);
        } else {
          reject(new Error(`فشل الرفع برمز استجابة ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`\n❌ خطأ شبكة أثناء رفع ${fileName}:`, err.message);
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy(new Error('Upload request timed out after 10 minutes'));
    });

    let uploaded = 0;
    let lastLogTime = Date.now();
    const fileStream = fs.createReadStream(filePath, { highWaterMark: 128 * 1024 });

    fileStream.on('data', (chunk) => {
      uploaded += chunk.length;
      const now = Date.now();
      if (now - lastLogTime > 1000 || uploaded === size) {
        lastLogTime = now;
        const pct = ((uploaded / size) * 100).toFixed(1);
        process.stdout.write(`\r  التقدم: ${pct}% (${(uploaded / (1024 * 1024)).toFixed(1)} / ${sizeMB} MB)`);
      }
    });

    fileStream.on('end', () => {
      console.log('\n  اكتمل نقل البيانات محلياً، بانتظار استجابة السحابة...');
    });

    fileStream.pipe(req);
  });
}

async function uploadWithRetry(uploadUrlTemplate, filePath, fileName, contentType, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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
  if (!candidateExe) {
    throw new Error(`لم يتم العثور على ملف Setup.exe مبني يحمل الإصدار ${VERSION} في مجلد dist`);
  }

  const rawExePath = path.join(distDir, candidateExe);

  // Strict Windows PE Header Validation
  const { execFileSync } = require('child_process');
  let productVersion = '';
  try {
    productVersion = execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `(Get-Item -LiteralPath '${rawExePath}').VersionInfo.ProductVersion`
    ], { encoding: 'utf-8' }).trim();
  } catch (e) {
    throw new Error(`فشل قراءة ProductVersion من ملف المثبت: ${e.message}`);
  }

  console.log(`  فحص ترويسة ملف المثبت الداخلي: ProductVersion = "${productVersion}" (المطلوب: "${VERSION}")`);
  if (productVersion !== VERSION) {
    throw new Error(`❌ خطأ جسيم: إصدار ملف المثبت الداخلي (${productVersion}) لا يطابق رقم الإصدار المطلوب نشره (${VERSION})!`);
  }

  console.log(`نسخ الملف وتوحيد الاسم القياسي إلى: ${standardExeName}`);
  fs.copyFileSync(rawExePath, standardExePath);

  // Calculate SHA-512
  console.log('حساب تجزئة SHA-512 للملف للتأكد من أمان التحميل...');
  const fileBuffer = fs.readFileSync(standardExePath);
  const sha512 = crypto.createHash('sha512').update(fileBuffer).digest('base64');
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const size = fileBuffer.length;

  console.log(`  حجم الملف: ${(size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  SHA-256: ${sha256}`);
  console.log(`  SHA-512: ${sha512.substring(0, 30)}...`);

  // Ensure latest.yml exists and has the correct entry
  const latestYmlPath = path.join(distDir, 'latest.yml');
  const ymlContent = [
    `version: ${VERSION}`,
    `files:`,
    `  - url: ${standardExeName}`,
    `    sha512: ${sha512}`,
    `    size: ${size}`,
    `path: ${standardExeName}`,
    `sha512: ${sha512}`,
    `releaseDate: '${new Date().toISOString()}'`,
  ].join('\n') + '\n';
  fs.writeFileSync(latestYmlPath, ymlContent, 'utf-8');
  console.log('تم تحديث ملف latest.yml بنجاح.');

  // Find blockmap if exists
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
  }

  // 1. Check or create Release on GitHub
  console.log(`\nفحص الإصدار ${TAG} على مستودع ${OWNER}/${REPO}...`);
  let relRes = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
  let release = null;

  const releaseTitle = `Labryo Clinical LIMS ${TAG} - تجميع الفحوصات حسب الاختصاص والتحكم بحجم وموضع الشعار`;
  const releaseBody = `### تحديث جديد لنظام Labryo Clinical LIMS (${TAG})\n\n- **تجميع الفحوصات حسب التخصص المخبري (Specialty Grouping):**\n  - دعم كامل للتسلسل الهرمي (التخصص Specialty → المجموعة Group → الفحص Test).\n  - ربط اختياري مع إعدادات النظام عبر خيار "Group tests by category / specialty".\n  - انعكاس سلس في شاشات تسجيل العينات، إدخال النتائج، وطباعة التقارير مع الحفاظ التام على السلوك الافتراضي عند التعطيل.\n- **التحكم بموضع وحجم شعار المختبر (Lab Logo Size & Position Control):**\n  - ضبط عرض الشعار بالمليمتر (Logo Width in mm).\n  - تحديد المحاذاة (يسار / وسط / يمين).\n  - ضبط إزاحة الشعار أفقياً وعمودياً (Offset X/Y) مع معاينة فورية وانعكاس دقيق في ترويسة التقرير المطبوع.\n- **التكامل والأمان:** اجتياز 100% من الاختبارات الذهبية، وحماية كاملة للبيانات السابقة وقواعد SQLite دون أي تعديل غير مطلوب.\n\nرابط التنزيل المباشر أدناه.`;

  if (relRes.status === 200 && relRes.data) {
    release = relRes.data;
    console.log(`تم العثور على الإصدار (ID: ${release.id}, Draft: ${release.draft})`);
  } else {
    // Check if it exists in list of releases as a draft
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
  ];
  if (blockmapPath && fs.existsSync(blockmapPath)) {
    filesToUpload.push({ name: `${standardExeName}.blockmap`, path: blockmapPath, type: 'application/octet-stream' });
  }

  // 3. Delete existing or orphan assets before upload
  const existingAssetsRes = await requestGitHub('GET', `/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
  const currentAssets = Array.isArray(existingAssetsRes.data) ? existingAssetsRes.data : (release.assets || []);
  
  for (const asset of currentAssets) {
    const isTarget = filesToUpload.some(f => f.name === asset.name);
    const isOrphan = asset.name.includes('@lab-manager') || asset.name.includes('Setup') || asset.name === 'latest.yml';
    if (isTarget || isOrphan) {
      console.log(`تنظيف الملف ${asset.name} (ID: ${asset.id})...`);
      await requestGitHub('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${asset.id}`);
    }
  }

  // 4. Upload files
  for (const f of filesToUpload) {
    await uploadWithRetry(release.upload_url, f.path, f.name, f.type);
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
  const latestDirectUrl = `https://github.com/${OWNER}/${REPO}/releases/latest/download/${standardExeName}`;
  const releasePageUrl = release.html_url || `https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}`;

  console.log('\n======================================================');
  console.log('🎉 تم رفع التحديث وربط روابط التحميل المباشرة بنجاح!');
  console.log('======================================================');
  console.log(`\n📥 1. رابط التحميل المباشر الدائم لملف التثبيت (.exe):`);
  console.log(directExeUrl);
  console.log(`\n⚡ 2. رابط التحميل المباشر التلقائي لأحدث إصدار (Always Latest):`);
  console.log(latestDirectUrl);
  console.log(`\n🌐 3. صفحة الإصدار الرسمية على GitHub:`);
  console.log(releasePageUrl);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('\n❌ خطأ أثناء الرفع والنشر:', err.message);
  process.exit(1);
});
