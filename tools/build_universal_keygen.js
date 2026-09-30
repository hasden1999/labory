const fs = require('fs');
const path = require('path');
const os = require('os');

const sha256MinPath = path.join(__dirname, 'sha256.min.js');
const sha256Min = fs.readFileSync(sha256MinPath, 'utf-8');

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0a0f1d">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>مولد تراخيص نظام مختبر الرضا الطبي (Labryo LIMS)</title>
  <style>
    :root {
      --bg-dark: #0a0f1d;
      --card-bg: rgba(15, 23, 42, 0.95);
      --border-color: rgba(56, 189, 248, 0.25);
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --emerald-hover: #059669;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, Tahoma, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background: radial-gradient(circle at 50% 20%, #1e293b 0%, var(--bg-dark) 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .container {
      max-width: 640px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(6, 182, 212, 0.12);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
    }

    .badge {
      display: inline-block;
      padding: 5px 14px;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.35);
      color: var(--cyan);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .title {
      font-size: 20px;
      font-weight: 900;
      color: #fff;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 12.5px;
      color: var(--text-muted);
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 6px;
    }

    input[type="text"], input[type="number"] {
      width: 100%;
      min-height: 48px;
      padding: 12px 14px;
      background: rgba(2, 6, 23, 0.8);
      border: 1px solid #334155;
      border-radius: 12px;
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: all 0.2s ease;
      direction: ltr;
      text-align: left;
    }

    input[type="text"]:focus, input[type="number"]:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }

    .tier-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }

    .tier-btn {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px 6px;
      color: var(--text-main);
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      user-select: none;
    }

    .tier-btn:hover, .tier-btn:active {
      background: rgba(51, 65, 85, 0.8);
      border-color: var(--cyan);
    }

    .tier-btn.active {
      background: linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%);
      border-color: var(--cyan);
      box-shadow: 0 0 16px rgba(6, 182, 212, 0.25);
    }

    .tier-btn .tier-name {
      font-size: 13.5px;
      font-weight: 800;
    }

    .tier-btn .tier-desc {
      font-size: 10.5px;
      color: var(--text-muted);
    }

    .tier-btn.active .tier-desc {
      color: #7dd3fc;
    }

    .generate-btn {
      width: 100%;
      min-height: 52px;
      padding: 14px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--cyan) 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(2, 132, 199, 0.4);
      transition: all 0.2s ease;
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .generate-btn:active {
      transform: scale(0.98);
    }

    .result-box {
      margin-top: 20px;
      background: rgba(2, 6, 23, 0.9);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 16px;
      display: none;
    }

    .result-box.show {
      display: block;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .key-input {
      width: 100%;
      min-height: 48px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #334155;
      border-radius: 10px;
      color: var(--cyan);
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 12px;
      margin: 10px 0;
      direction: ltr;
      text-align: left;
      cursor: pointer;
    }

    .action-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
    }

    .action-btn {
      min-height: 46px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
      color: #fff;
    }

    .action-btn:active {
      transform: scale(0.98);
    }

    .btn-copy {
      background: #1e293b;
      border: 1px solid #475569;
    }

    .btn-wa {
      background: #059669;
    }

    .btn-wa:hover {
      background: #047857;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #10b981;
      color: #fff;
      padding: 12px 24px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 999;
      pointer-events: none;
      text-align: center;
      white-space: nowrap;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 480px) {
      .container {
        padding: 18px 14px;
      }
      .tier-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .tier-btn {
        padding: 10px 4px;
      }
      .tier-btn .tier-name {
        font-size: 12.5px;
      }
      .action-row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="header">
      <div class="badge">🔒 لوحة إدارة التراخيص الرسمية</div>
      <h1 class="title">مُوَلِّد التراخيص الطبية</h1>
      <p class="subtitle">نظام مختبر الرضا الطبي (Labryo LIMS) • يعمل على الحاسوب والهاتف</p>
    </div>

    <!-- HWID Input -->
    <div class="form-group">
      <label>١. بصمة الجهاز للعميل (HWID):</label>
      <input 
        type="text" 
        id="hwidInput" 
        placeholder="مثال: LAB-A1B2C3D4..." 
        autocomplete="off" 
        autocapitalize="characters"
        spellcheck="false"
      />
    </div>

    <!-- Tier Selection -->
    <div class="form-group">
      <label>٢. فترة ونوع الترخيص:</label>
      <div class="tier-grid">
        <div class="tier-btn active" id="tierBtn0">
          <span class="tier-name">⭐ دائمي</span>
          <span class="tier-desc">مدى الحياة</span>
        </div>
        <div class="tier-btn" id="tierBtn1">
          <span class="tier-name">📅 أسبوع</span>
          <span class="tier-desc">7 أيام</span>
        </div>
        <div class="tier-btn" id="tierBtn2">
          <span class="tier-name">⚡ يومين</span>
          <span class="tier-desc">48 ساعة</span>
        </div>
      </div>

      <div class="tier-grid">
        <div class="tier-btn" id="tierBtn3">
          <span class="tier-name">🌙 شهري</span>
          <span class="tier-desc">30 يوماً</span>
        </div>
        <div class="tier-btn" id="tierBtn4">
          <span class="tier-name">📆 سنوي</span>
          <span class="tier-desc">سنة كاملة</span>
        </div>
        <div class="tier-btn" id="tierBtn5">
          <span class="tier-name">✏️ مخصص</span>
          <span class="tier-desc">أيام يدوية</span>
        </div>
      </div>

      <div id="customDaysBox" style="display: none; margin-top: 10px;">
        <label style="font-size: 12px; color: var(--cyan);">أدخل عدد الأيام المطلوب:</label>
        <input type="number" id="customDaysInput" min="1" max="3650" value="14" />
      </div>
    </div>

    <!-- Lab Name Input -->
    <div class="form-group">
      <label>٣. اسم المختبر أو العميل (اختياري):</label>
      <input type="text" id="labNameInput" placeholder="مثال: مختبر الرضا التخصصي" style="direction: rtl; text-align: right;" />
    </div>

    <!-- Generate Button -->
    <button class="generate-btn" id="generateBtn">
      <span>⚡ توليد كود التفعيل ونسخه فوراً</span>
    </button>

    <!-- Result Display Box -->
    <div class="result-box" id="resultBox">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #10b981; font-size: 14px;">✅ تم توليد كود التفعيل بنجاح:</strong>
        <span id="tierBadge" style="font-size: 11px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 700;"></span>
      </div>

      <input type="text" class="key-input" id="keyInput" readonly />

      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
        ينتهي الترخيص بتاريخ: <strong id="expiryDisplay" style="color: #fff;"></strong>
      </div>

      <div class="action-row">
        <button class="action-btn btn-copy" id="copyBtn">
          📋 نسخ الكود
        </button>
        <a class="action-btn btn-wa" id="waDirectBtn" href="#" target="_blank">
          💬 إرسال عبر واتساب
        </a>
      </div>
    </div>
  </div>

  <div class="toast" id="toast">تم النسخ إلى الحافظة بنجاح!</div>

  <!-- Embedded Standalone Pure-JS SHA256 & HMAC (Zero dependencies, works 100% on any mobile/PC offline) -->
  <script>
` + sha256Min + `
  </script>

  <script>
    const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

    let currentTier = 'LIFETIME';
    let currentDays = 36500;
    let currentLabel = 'دائمي مدى الحياة';
    let lastGeneratedKey = '';
    let lastExpiryStr = '';

    function selectTier(tier, days, label, btnId) {
      currentTier = tier;
      currentDays = days;
      currentLabel = label;

      document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById(btnId).classList.add('active');
      document.getElementById('customDaysBox').style.display = 'none';
    }

    function toggleCustomDays() {
      document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById('tierBtn5').classList.add('active');
      const box = document.getElementById('customDaysBox');
      box.style.display = 'block';
      currentTier = 'CUSTOM';
      currentDays = parseInt(document.getElementById('customDaysInput').value, 10) || 14;
      currentLabel = 'مخصص (' + currentDays + ' يوماً)';
    }

    document.getElementById('tierBtn0').onclick = function() { selectTier('LIFETIME', 36500, 'دائمي مدى الحياة', 'tierBtn0'); };
    document.getElementById('tierBtn1').onclick = function() { selectTier('WEEKLY', 7, 'أسبوع واحد (7 أيام)', 'tierBtn1'); };
    document.getElementById('tierBtn2').onclick = function() { selectTier('TWO_DAYS', 2, 'يومين فقط (48 ساعة)', 'tierBtn2'); };
    document.getElementById('tierBtn3').onclick = function() { selectTier('MONTHLY', 30, 'شهر كامل (30 يوماً)', 'tierBtn3'); };
    document.getElementById('tierBtn4').onclick = function() { selectTier('YEARLY', 365, 'سنة كاملة (365 يوماً)', 'tierBtn4'); };
    document.getElementById('tierBtn5').onclick = function() { toggleCustomDays(); };

    // Pure JS UTF-8 Base64URL encoding (Works on all mobile devices and browsers)
    function base64url(str) {
      const utf8 = unescape(encodeURIComponent(str));
      let binary = '';
      for (let i = 0; i < utf8.length; i++) {
        binary += utf8[i];
      }
      return btoa(binary)
        .replace(/\\+/g, '-')
        .replace(/\\//g, '_')
        .replace(/=+$/, '');
    }

    // Synchronous license generator using pure embedded js-sha256
    function generateLicenseKey(hwid, daysValid, tier, labName) {
      const cleanHwid = hwid.trim().toUpperCase();
      const expiryDate = tier === 'LIFETIME'
        ? new Date('2099-12-31T23:59:59Z')
        : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

      const expiryStr = expiryDate.toISOString().split('T')[0];
      const dataToSign = cleanHwid + '|' + expiryStr + '|' + tier + '|' + labName.trim();

      // Pure JS synchronous HMAC-SHA256 (no crypto.subtle required!)
      const fullHex = sha256.hmac(MASTER_SECRET, dataToSign);
      const signature = fullHex.substring(0, 10).toUpperCase();
      const base64Data = base64url(dataToSign);

      return {
        key: 'LIC-' + base64Data + '-' + signature,
        expiryStr: expiryStr,
        tier: tier
      };
    }

    function handleGenerateKey() {
      const hwid = document.getElementById('hwidInput').value.trim().toUpperCase();
      if (!hwid || !hwid.startsWith('LAB-')) {
        alert('يرجى إدخال كود بصمة جهاز صحيح يبدأ بـ LAB-XXXX...');
        document.getElementById('hwidInput').focus();
        return;
      }

      if (currentTier === 'CUSTOM') {
        currentDays = parseInt(document.getElementById('customDaysInput').value, 10) || 14;
        currentLabel = 'مخصص (' + currentDays + ' يوماً)';
      }

      const labName = document.getElementById('labNameInput').value.trim() || 'مختبر معتمد';

      try {
        const result = generateLicenseKey(hwid, currentDays, currentTier, labName);
        lastGeneratedKey = result.key;
        lastExpiryStr = result.expiryStr;

        const keyInput = document.getElementById('keyInput');
        keyInput.value = result.key;
        document.getElementById('tierBadge').textContent = currentLabel;
        document.getElementById('expiryDisplay').textContent = result.expiryStr;

        // WhatsApp direct link for mobile and web
        const msg = 'أهلاً وسهلاً بك في نظام مختبر الرضا الطبي (Labryo LIMS). 🔬✨\\n\\n' +
          'تم تفعيل نسختكم بنجاح:\\n' +
          '- الباقة: ' + currentLabel + '\\n' +
          '- تاريخ الانتهاء: ' + lastExpiryStr + '\\n' +
          '- بصمة الجهاز: ' + hwid + '\\n\\n' +
          '🔑 كود التفعيل الخاص بك:\\n' +
          lastGeneratedKey + '\\n\\n' +
          'طريقة التفعيل: انسخ الكود أعلاه والصقه داخل البرنامج واضغط (تفعيل البرنامج وبدء العمل).';

        const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(msg);
        document.getElementById('waDirectBtn').href = waUrl;

        document.getElementById('resultBox').classList.add('show');

        // Auto copy
        copyText(result.key);
        showToast('تم توليد الكود ونسخه إلى الحافظة تلقائياً!');
      } catch (err) {
        alert('حدث خطأ أثناء التوليد: ' + err.message);
      }
    }

    function copyKey() {
      if (!lastGeneratedKey) return;
      copyText(lastGeneratedKey);
      showToast('تم نسخ كود التفعيل إلى الحافظة!');
    }

    // Universal copy function that works on Android, iOS, and PC (even without HTTPS)
    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(function() { fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, 99999);
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {}
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(function() {
        toast.classList.remove('show');
      }, 3000);
    }

    document.getElementById('generateBtn').onclick = handleGenerateKey;
    document.getElementById('copyBtn').onclick = copyKey;
    document.getElementById('keyInput').onclick = function() {
      this.select();
      copyKey();
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'مولد_التراخيص.html'), htmlContent, 'utf-8');
fs.writeFileSync(path.join(__dirname, 'license-generator.html'), htmlContent, 'utf-8');

const desktopFile = path.join(os.homedir(), 'Desktop', 'مولد التراخيص - Labryo LIMS.html');
fs.writeFileSync(desktopFile, htmlContent, 'utf-8');

console.log('✅ Generated standalone offline HTML for PC and Mobile!');
console.log('✅ Local repo tool: ' + path.join(__dirname, 'مولد_التراخيص.html'));
console.log('✅ Desktop tool:    ' + desktopFile);
