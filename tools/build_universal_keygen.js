const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const naclMinPath = path.join(__dirname, 'tweetnacl-fast.min.js');
const sha256MinPath = path.join(__dirname, 'sha256.min.js');

if (!fs.existsSync(naclMinPath)) {
  throw new Error('tweetnacl-fast.min.js missing in tools/');
}
if (!fs.existsSync(sha256MinPath)) {
  throw new Error('sha256.min.js missing in tools/');
}

const naclMin = fs.readFileSync(naclMinPath, 'utf-8');
const sha256Min = fs.readFileSync(sha256MinPath, 'utf-8');

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0a0f1d">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>مولد تراخيص نظام مختبر الرضا الطبي (Labryo LIMS v2.0+)</title>
  <style>
    :root {
      --bg-dark: #0a0f1d;
      --card-bg: rgba(15, 23, 42, 0.96);
      --border-color: rgba(56, 189, 248, 0.28);
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --emerald-hover: #059669;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --purple: #8b5cf6;
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
      background: radial-gradient(circle at 50% 15%, #1e293b 0%, var(--bg-dark) 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .container {
      max-width: 680px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 22px;
      padding: 24px 22px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(6, 182, 212, 0.15);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      margin: auto;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
    }

    .badge {
      display: inline-block;
      padding: 5px 14px;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.4);
      color: var(--cyan);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .badge-v2 {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: var(--emerald);
    }

    .title {
      font-size: 21px;
      font-weight: 900;
      color: #fff;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 18px;
      gap: 6px;
    }

    .tab-btn {
      flex: 1;
      padding: 10px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 800;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .tab-btn.active {
      background: rgba(2, 132, 199, 0.35);
      color: #fff;
      border: 1px solid rgba(56, 189, 248, 0.5);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 6px;
    }

    .label-hint {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: normal;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    input[type="text"], input[type="number"], select {
      width: 100%;
      min-height: 48px;
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 12px;
      color: #fff;
      padding: 12px 14px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="text"]:focus, input[type="number"]:focus, select:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }

    .btn-paste {
      position: absolute;
      left: 8px;
      padding: 6px 12px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--cyan);
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-paste:hover {
      background: rgba(56, 189, 248, 0.3);
    }

    /* Format selector */
    .format-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .format-btn {
      padding: 12px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 12px;
      color: var(--text-muted);
      cursor: pointer;
      text-align: right;
      transition: all 0.2s;
    }

    .format-btn.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: var(--emerald);
      color: #fff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
    }

    .format-btn.active.legacy {
      background: rgba(245, 158, 11, 0.15);
      border-color: var(--amber);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.2);
    }

    .format-title {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .format-desc {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Tier Grid */
    .tier-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    @media (max-width: 480px) {
      .tier-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .format-selector {
        grid-template-columns: 1fr;
      }
    }

    .tier-btn {
      padding: 12px 10px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      color: var(--text-muted);
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .tier-btn:hover {
      border-color: rgba(56, 189, 248, 0.4);
      background: rgba(30, 41, 59, 0.9);
      color: #fff;
    }

    .tier-btn.active {
      background: rgba(2, 132, 199, 0.25);
      border-color: var(--cyan);
      color: #fff;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
    }

    .tier-btn.tier-lifetime.active {
      background: rgba(16, 185, 129, 0.25);
      border-color: var(--emerald);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }

    .tier-btn .icon {
      font-size: 16px;
    }

    .btn-main {
      width: 100%;
      min-height: 52px;
      background: linear-gradient(135deg, var(--emerald) 0%, var(--emerald-hover) 100%);
      color: #fff;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
      transition: transform 0.15s, box-shadow 0.15s;
      margin-top: 14px;
    }

    .btn-main:active {
      transform: scale(0.98);
    }

    /* Result Box */
    .result-card {
      margin-top: 20px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--emerald);
      border-radius: 16px;
      padding: 18px;
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .result-card.show {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .result-title {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--emerald);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .result-tags {
      display: flex;
      gap: 6px;
    }

    .tag {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .tag-blue {
      background: rgba(56, 189, 248, 0.15);
      color: var(--cyan);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .key-textarea {
      width: 100%;
      min-height: 85px;
      background: #020617;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 10px;
      padding: 10px 12px;
      color: #38bdf8;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
      word-break: break-all;
      margin-bottom: 14px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .btn-action {
      min-height: 44px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      transition: background 0.2s;
    }

    .btn-copy {
      background: var(--primary);
      color: #fff;
    }

    .btn-copy:hover {
      background: var(--primary-hover);
    }

    .btn-wa {
      background: #25d366;
      color: #fff;
    }

    .btn-wa:hover {
      background: #1eb956;
    }

    /* Verification card */
    .verify-result {
      margin-top: 16px;
      padding: 14px;
      border-radius: 12px;
      display: none;
      font-size: 13px;
      line-height: 1.6;
    }

    .verify-result.valid {
      display: block;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid var(--emerald);
      color: #34d399;
    }

    .verify-result.invalid {
      display: block;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid var(--rose);
      color: #fb7185;
    }

    .verify-info-table {
      width: 100%;
      margin-top: 10px;
      font-size: 12.5px;
      border-collapse: collapse;
    }

    .verify-info-table td {
      padding: 4px 6px;
    }

    .verify-info-table td:first-child {
      color: var(--text-muted);
      width: 32%;
    }

    .verify-info-table td:last-child {
      color: #fff;
      font-weight: 700;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0f172a;
      border: 1px solid var(--emerald);
      color: #fff;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      z-index: 9999;
      pointer-events: none;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge badge-v2">الإصدار الشامل v2.0+ (Ed25519)</span>
      <h1 class="title">مولد تراخيص نظام مختبر الرضا الطبي</h1>
      <p class="subtitle">Labryo LIMS Universal Offline License Generator</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-nav">
      <button class="tab-btn active" id="tabBtnGenerate" onclick="switchTab('generate')">
        <span>🔑</span>
        <span>توليد ترخيص جديد</span>
      </button>
      <button class="tab-btn" id="tabBtnVerify" onclick="switchTab('verify')">
        <span>🔍</span>
        <span>فحص والتحقق من كود</span>
      </button>
    </div>

    <!-- TAB 1: GENERATE -->
    <div class="tab-content active" id="tabContentGenerate">
      <!-- Format Choice -->
      <div class="form-group">
        <label>
          <span>صيغة ونوع الترخيص</span>
          <span class="label-hint">اختر LIC2- للنسخ الحديثة</span>
        </label>
        <div class="format-selector">
          <div class="format-btn active" id="formatLic2" onclick="selectFormat('LIC2')">
            <div class="format-title">
              <span>🛡️ صيغة LIC2- (الحديثة)</span>
            </div>
            <div class="format-desc">توقيع رقمي Ed25519 مشفر (الإصدار 2.0+ المعتمد)</div>
          </div>
          <div class="format-btn legacy" id="formatLicLegacy" onclick="selectFormat('LEGACY')">
            <div class="format-title">
              <span>📜 صيغة LIC- (القديمة)</span>
            </div>
            <div class="format-desc">توقيع HMAC للنسخ السابقة v1.x التوافقية</div>
          </div>
        </div>
      </div>

      <!-- HWID Input -->
      <div class="form-group">
        <label for="hwidInput">
          <span>بصمة جهاز العميل (Hardware ID - HWID)</span>
          <span class="label-hint">مثال: LAB-8D4C-B999-8218</span>
        </label>
        <div class="input-wrapper">
          <input type="text" id="hwidInput" placeholder="الصق بصمة الجهاز هنا (LAB-XXXX-XXXX-XXXX)..." style="padding-left: 90px;" />
          <button type="button" class="btn-paste" onclick="pasteHwid()">📋 لصق</button>
        </div>
      </div>

      <!-- Tier Selection -->
      <div class="form-group">
        <label>
          <span>نوع الباقة والصلاحية</span>
          <span id="tierNotice" class="label-hint" style="color: var(--emerald);">دائمي مدى الحياة (2099-12-31)</span>
        </label>
        <div class="tier-grid">
          <div class="tier-btn tier-lifetime active" id="tierBtnLifetime" onclick="selectTier('LIFETIME', 36525, 'دائمي مدى الحياة', this)">
            <span class="icon">💎</span>
            <span>دائمي مدى الحياة</span>
          </div>
          <div class="tier-btn" id="tierBtnYearly" onclick="selectTier('YEARLY', 365, 'سنة كاملة (365 يوماً)', this)">
            <span class="icon">📅</span>
            <span>سنة كاملة</span>
          </div>
          <div class="tier-btn" id="tierBtnMonthly" onclick="selectTier('MONTHLY', 30, 'شهر كامل (30 يوماً)', this)">
            <span class="icon">🗓️</span>
            <span>شهر كامل</span>
          </div>
          <div class="tier-btn" id="tierBtnWeekly" onclick="selectTier('WEEKLY', 7, 'أسبوع واحد (7 أيام)', this)">
            <span class="icon">⚡</span>
            <span>أسبوع واحد</span>
          </div>
          <div class="tier-btn" id="tierBtnTwoDays" onclick="selectTier('TWO_DAYS', 2, 'يومين تجريبي (48 ساعة)', this)">
            <span class="icon">⏱️</span>
            <span>يومين فقط</span>
          </div>
          <div class="tier-btn" id="tierBtnCustom" onclick="toggleCustomDays(this)">
            <span class="icon">⚙️</span>
            <span>مخصص (أيام)</span>
          </div>
        </div>
      </div>

      <!-- Custom Days Box -->
      <div class="form-group" id="customDaysBox" style="display: none;">
        <label for="customDaysInput">عدد الأيام المخصصة:</label>
        <input type="number" id="customDaysInput" value="14" min="1" max="3650" oninput="updateCustomDays()" />
      </div>

      <!-- Lab Name -->
      <div class="form-group">
        <label for="labNameInput">
          <span>اسم المختبر أو العميل</span>
          <span class="label-hint">اختياري</span>
        </label>
        <input type="text" id="labNameInput" value="مختبر معتمد" placeholder="أدخل اسم المختبر..." />
      </div>

      <!-- Generate Button -->
      <button type="button" class="btn-main" onclick="handleGenerateKey()">
        <span>🚀</span>
        <span>توليد كود التفعيل المعتمد</span>
      </button>

      <!-- Result Card -->
      <div class="result-card" id="resultBox">
        <div class="result-header">
          <div class="result-title">
            <span>✅ تم توليد كود التفعيل بنجاح</span>
          </div>
          <div class="result-tags">
            <span class="tag" id="resFormatTag">LIC2- Ed25519</span>
            <span class="tag tag-blue" id="resTierTag">دائمي</span>
          </div>
        </div>

        <textarea class="key-textarea" id="keyOutput" readonly onclick="this.select(); copyGeneratedKey();"></textarea>

        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; display: flex; justify-content: space-between;">
          <span>تاريخ الانتهاء: <strong id="resExpiryDisplay" style="color: #fff;">-</strong></span>
          <span>بصمة الجهاز: <strong id="resHwidDisplay" style="color: #fff;">-</strong></span>
        </div>

        <div class="actions-grid">
          <button type="button" class="btn-action btn-copy" onclick="copyGeneratedKey()">
            <span>📋</span>
            <span>نسخ كود التفعيل</span>
          </button>
          <a class="btn-action btn-wa" id="waDirectBtn" href="#" target="_blank">
            <span>💬</span>
            <span>إرسال عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>

    <!-- TAB 2: VERIFY & INSPECT -->
    <div class="tab-content" id="tabContentVerify">
      <div class="form-group">
        <label for="verifyInput">
          <span>الصق مفتاح الترخيص لفحصه (LIC2- أو LIC-)</span>
        </label>
        <div class="input-wrapper">
          <input type="text" id="verifyInput" placeholder="LIC2-... أو LIC-..." style="padding-left: 90px;" />
          <button type="button" class="btn-paste" onclick="pasteVerifyKey()">📋 لصق</button>
        </div>
      </div>

      <button type="button" class="btn-main" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);" onclick="handleVerifyKey()">
        <span>🔍</span>
        <span>فحص والتحقق من صحة المفتاح</span>
      </button>

      <div class="verify-result" id="verifyResultBox">
        <div id="verifyMessage"></div>
        <table class="verify-info-table" id="verifyTable" style="display: none;">
          <tr><td>نوع الصيغة:</td><td id="vFormat">-</td></tr>
          <tr><td>بصمة الجهاز (HWID):</td><td id="vHwid">-</td></tr>
          <tr><td>نوع الباقة:</td><td id="vTier">-</td></tr>
          <tr><td>اسم المختبر:</td><td id="vLab">-</td></tr>
          <tr><td>تاريخ الصلاحية:</td><td id="vExpiry">-</td></tr>
          <tr><td>حالة التوقيع:</td><td id="vSignature">-</td></tr>
        </table>
      </div>
    </div>
  </div>

  <div class="toast" id="toast">تم النسخ إلى الحافظة بنجاح!</div>

  <!-- Embedded Standalone Pure-JS tweetnacl (Ed25519) and sha256 (HMAC) -->
  <script>
    /* =========================================================================
     * TweetNaCl.js (Fast Ed25519) - Inlined
     * ========================================================================= */
${naclMin}
  </script>

  <script>
    /* =========================================================================
     * JS-SHA256 (HMAC-SHA256) - Inlined
     * ========================================================================= */
${sha256Min}
  </script>

  <script>
    /* =========================================================================
     * Licensing Engine (Ed25519 + HMAC Legacy)
     * ========================================================================= */
    // Ed25519 Private Key Seed (32 bytes HEX)
    const ED25519_PRIVATE_SEED_HEX = 'eecb33cbe34831e9100900499e43f7e2ebd93dc0c0cdb100b6eac4c538d07db7';
    // Ed25519 Public Key (32 bytes HEX)
    const ED25519_PUBLIC_KEY_HEX = '1f0cf02ee786c49f74133f1a6094ae696bc305472edfed84849dceb3e9185aaf';
    // Legacy HMAC Secret
    const LEGACY_MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

    // State
    let selectedFormat = 'LIC2'; // 'LIC2' or 'LEGACY'
    let currentTier = 'LIFETIME';
    let currentDays = 36525;
    let currentLabel = 'دائمي مدى الحياة';
    let lastGeneratedKey = '';
    let lastExpiryStr = '';
    let lastHwid = '';

    // Convert hex string to Uint8Array
    function hexToUint8Array(hex) {
      const arr = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return arr;
    }

    // Convert UTF-8 string to Uint8Array
    function stringToUtf8ByteArray(str) {
      const utf8 = unescape(encodeURIComponent(str));
      const arr = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        arr[i] = utf8.charCodeAt(i);
      }
      return arr;
    }

    // Convert Uint8Array to UTF-8 string
    function utf8ByteArrayToString(bytes) {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      try {
        return decodeURIComponent(escape(binary));
      } catch (e) {
        return binary;
      }
    }

    // Base64URL encode
    function base64urlEncode(input) {
      let binary = '';
      if (typeof input === 'string') {
        const utf8 = unescape(encodeURIComponent(input));
        for (let i = 0; i < utf8.length; i++) binary += utf8[i];
      } else {
        const bytes = new Uint8Array(input);
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary)
        .replace(/\\+/g, '-')
        .replace(/\\//g, '_')
        .replace(/=+$/, '');
    }

    // Base64URL decode to Uint8Array
    function base64urlDecodeToBytes(base64url) {
      let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    // Base64URL decode to UTF-8 string
    function base64urlDecodeToStr(base64url) {
      return utf8ByteArrayToString(base64urlDecodeToBytes(base64url));
    }

    // UI Tab switching
    function switchTab(tab) {
      document.getElementById('tabBtnGenerate').classList.toggle('active', tab === 'generate');
      document.getElementById('tabBtnVerify').classList.toggle('active', tab === 'verify');
      document.getElementById('tabContentGenerate').classList.toggle('active', tab === 'generate');
      document.getElementById('tabContentVerify').classList.toggle('active', tab === 'verify');
    }

    // UI Format selection
    function selectFormat(fmt) {
      selectedFormat = fmt;
      document.getElementById('formatLic2').classList.toggle('active', fmt === 'LIC2');
      document.getElementById('formatLicLegacy').classList.toggle('active', fmt === 'LEGACY');
    }

    // UI Tier selection
    function selectTier(tier, days, label, btnEl) {
      currentTier = tier;
      currentDays = days;
      currentLabel = label;

      document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('active'));
      btnEl.classList.add('active');
      document.getElementById('customDaysBox').style.display = 'none';
      document.getElementById('tierNotice').textContent = label;
    }

    function toggleCustomDays(btnEl) {
      document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('active'));
      btnEl.classList.add('active');
      document.getElementById('customDaysBox').style.display = 'block';
      currentTier = 'CUSTOM';
      currentDays = parseInt(document.getElementById('customDaysInput').value, 10) || 14;
      currentLabel = 'مخصص (' + currentDays + ' يوماً)';
      document.getElementById('tierNotice').textContent = currentLabel;
    }

    function updateCustomDays() {
      currentDays = parseInt(document.getElementById('customDaysInput').value, 10) || 14;
      currentLabel = 'مخصص (' + currentDays + ' يوماً)';
      document.getElementById('tierNotice').textContent = currentLabel;
    }

    // Clean and extract HWID
    function cleanHwidString(raw) {
      if (!raw) return '';
      const match = raw.match(/LAB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
      if (match) return match[0].toUpperCase();
      return raw.replace(/[^A-Za-z0-9-]/g, '').trim().toUpperCase();
    }

    // Paste HWID from clipboard
    async function pasteHwid() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          document.getElementById('hwidInput').value = cleanHwidString(text) || text.trim();
          showToast('تم اللصق من الحافظة!');
        } else {
          document.getElementById('hwidInput').focus();
        }
      } catch (e) {
        document.getElementById('hwidInput').focus();
      }
    }

    // Paste for verify
    async function pasteVerifyKey() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          document.getElementById('verifyInput').value = text.trim();
          showToast('تم اللصق من الحافظة!');
        } else {
          document.getElementById('verifyInput').focus();
        }
      } catch (e) {
        document.getElementById('verifyInput').focus();
      }
    }

    // -------------------------------------------------------------------------
    // License Generation Engines
    // -------------------------------------------------------------------------
    // 1. New Format LIC2- (Ed25519 Asymmetric)
    function generateLic2Key(hwid, days, tier, labName) {
      const cleanHwid = hwid.trim().toUpperCase();
      const expiryDate = (tier === 'LIFETIME')
        ? '2099-12-31'
        : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const safeLabName = (labName || '').trim().replace(/\\|/g, '/');
      const issuedAt = new Date().toISOString();

      const canonical = [
        'v2',
        cleanHwid,
        expiryDate,
        tier,
        safeLabName,
        issuedAt
      ].join('|');

      const seed = hexToUint8Array(ED25519_PRIVATE_SEED_HEX);
      const keyPair = nacl.sign.keyPair.fromSeed(seed);
      const msgBytes = stringToUtf8ByteArray(canonical);
      const signature = nacl.sign.detached(msgBytes, keyPair.secretKey);

      const licenseKey = 'LIC2-' + base64urlEncode(canonical) + '.' + base64urlEncode(signature);

      return {
        key: licenseKey,
        expiryStr: expiryDate,
        tier: tier,
        hwid: cleanHwid
      };
    }

    // 2. Legacy Format LIC- (HMAC-SHA256 Symmetric)
    function generateLegacyLicKey(hwid, days, tier, labName) {
      const cleanHwid = hwid.trim().toUpperCase();
      const expiryDate = (tier === 'LIFETIME')
        ? new Date('2099-12-31T23:59:59Z')
        : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const expiryStr = expiryDate.toISOString().split('T')[0];
      const dataToSign = cleanHwid + '|' + expiryStr + '|' + tier + '|' + (labName || '').trim();

      const fullHex = sha256.hmac(LEGACY_MASTER_SECRET, dataToSign);
      const signature = fullHex.substring(0, 10).toUpperCase();
      const base64Data = base64urlEncode(dataToSign);

      return {
        key: 'LIC-' + base64Data + '-' + signature,
        expiryStr: expiryStr,
        tier: tier,
        hwid: cleanHwid
      };
    }

    // Handle Generation Click
    function handleGenerateKey() {
      const rawHwid = document.getElementById('hwidInput').value.trim();
      const cleanHwid = cleanHwidString(rawHwid);

      if (!cleanHwid || !cleanHwid.startsWith('LAB-')) {
        alert('يرجى إدخال كود بصمة جهاز صحيح يبدأ بـ LAB-XXXX-XXXX-XXXX');
        document.getElementById('hwidInput').focus();
        return;
      }

      document.getElementById('hwidInput').value = cleanHwid;

      if (currentTier === 'CUSTOM') {
        currentDays = parseInt(document.getElementById('customDaysInput').value, 10) || 14;
        currentLabel = 'مخصص (' + currentDays + ' يوماً)';
      }

      const labName = document.getElementById('labNameInput').value.trim() || 'مختبر معتمد';

      try {
        let result;
        if (selectedFormat === 'LIC2') {
          result = generateLic2Key(cleanHwid, currentDays, currentTier, labName);
          document.getElementById('resFormatTag').textContent = 'LIC2- Ed25519 (حديث)';
          document.getElementById('resFormatTag').style.borderColor = 'rgba(16, 185, 129, 0.4)';
          document.getElementById('resFormatTag').style.color = '#34d399';
        } else {
          result = generateLegacyLicKey(cleanHwid, currentDays, currentTier, labName);
          document.getElementById('resFormatTag').textContent = 'LIC- HMAC (قديم)';
          document.getElementById('resFormatTag').style.borderColor = 'rgba(245, 158, 11, 0.4)';
          document.getElementById('resFormatTag').style.color = '#fbbf24';
        }

        lastGeneratedKey = result.key;
        lastExpiryStr = result.expiryStr;
        lastHwid = result.hwid;

        document.getElementById('keyOutput').value = result.key;
        document.getElementById('resTierTag').textContent = currentLabel;
        document.getElementById('resExpiryDisplay').textContent = result.expiryStr;
        document.getElementById('resHwidDisplay').textContent = result.hwid;

        // WhatsApp direct message
        const waMsg = 'أهلاً وسهلاً بك في نظام مختبر الرضا الطبي (Labryo LIMS). 🔬✨\\n\\n' +
          'تم إصدار وتفعيل ترخيص نسختكم بنجاح:\\n' +
          '• الباقة: ' + currentLabel + '\\n' +
          '• تاريخ الصلاحية: ' + lastExpiryStr + '\\n' +
          '• بصمة الجهاز (HWID): ' + lastHwid + '\\n\\n' +
          '🔑 كود التفعيل الخاص بك:\\n' +
          lastGeneratedKey + '\\n\\n' +
          '📌 طريقة التفعيل: انسخ الكود أعلاه، ثم افتح البرنامج واضغط لصق في خانة كود التفعيل ثم اضغط (تفعيل البرنامج).';

        const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(waMsg);
        document.getElementById('waDirectBtn').href = waUrl;

        document.getElementById('resultBox').classList.add('show');
        copyText(result.key);
        showToast('تم توليد الكود ونسخه إلى الحافظة تلقائياً! ✅');
      } catch (err) {
        alert('حدث خطأ أثناء التوليد: ' + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // Key Verifier & Inspector
    // -------------------------------------------------------------------------
    function handleVerifyKey() {
      const key = (document.getElementById('verifyInput').value || '').trim();
      const resBox = document.getElementById('verifyResultBox');
      const msgBox = document.getElementById('verifyMessage');
      const table = document.getElementById('verifyTable');

      if (!key) {
        alert('يرجى لصق أو كتابة مفتاح الترخيص المراد فحصه');
        return;
      }

      resBox.className = 'verify-result';
      table.style.display = 'none';

      // 1. Verify LIC2-
      if (key.startsWith('LIC2-')) {
        try {
          const rest = key.slice('LIC2-'.length);
          const dot = rest.lastIndexOf('.');
          if (dot <= 0) throw new Error('تنسيق المفتاح غير مكتمل');

          const canonical = base64urlDecodeToStr(rest.slice(0, dot));
          const sigBytes = base64urlDecodeToBytes(rest.slice(dot + 1));
          const [version, hwid, expiryDate, tier, labName, issuedAt] = canonical.split('|');

          if (version !== 'v2' || !hwid || !expiryDate || !tier) {
            throw new Error('بيانات الترخيص الداخلية تالفة أو غير صالحة');
          }

          const pubKey = hexToUint8Array(ED25519_PUBLIC_KEY_HEX);
          const msgBytes = stringToUtf8ByteArray(canonical);
          const isValidSig = nacl.sign.detached.verify(msgBytes, sigBytes, pubKey);

          if (!isValidSig) {
            resBox.className = 'verify-result invalid';
            msgBox.innerHTML = '<strong>❌ مفتاح ترخيص مزور أو تم التعديل عليه!</strong> التوقيع الرقمي غير متطابق مع المفتاح العام للنظام.';
            return;
          }

          resBox.className = 'verify-result valid';
          msgBox.innerHTML = '<strong>✅ مفتاح ترخيص أصلي ومعتمد 100% بنظام Ed25519!</strong>';
          table.style.display = 'table';
          document.getElementById('vFormat').textContent = 'LIC2- (تشفير Ed25519 الحديث)';
          document.getElementById('vHwid').textContent = hwid;
          document.getElementById('vTier').textContent = tier;
          document.getElementById('vLab').textContent = labName || 'مختبر معتمد';
          document.getElementById('vExpiry').textContent = expiryDate;
          document.getElementById('vSignature').textContent = 'سليم وموقع رسمياً ✅';
          return;
        } catch (e) {
          resBox.className = 'verify-result invalid';
          msgBox.innerHTML = '<strong>❌ خطأ في قراءة المفتاح:</strong> ' + e.message;
          return;
        }
      }

      // 2. Verify Legacy LIC-
      if (key.startsWith('LIC-')) {
        try {
          const parts = key.replace(/^LIC-/, '').split('-');
          if (parts.length < 2) throw new Error('مفتاح الترخيص غير مكتمل');

          const signature = parts[parts.length - 1].toUpperCase();
          const base64Data = parts.slice(0, -1).join('-');
          const decoded = base64urlDecodeToStr(base64Data);
          const [hwid, expiryDate, tier, labName] = decoded.split('|');

          if (!hwid || !expiryDate || !tier) {
            throw new Error('بيانات الترخيص القديم تالفة');
          }

          const expectedSig = sha256.hmac(LEGACY_MASTER_SECRET, decoded).substring(0, 10).toUpperCase();
          const isValid = (signature === expectedSig);

          if (!isValid) {
            resBox.className = 'verify-result invalid';
            msgBox.innerHTML = '<strong>❌ مفتاح ترخيص قديم مزور أو تم التعديل عليه!</strong>';
            return;
          }

          resBox.className = 'verify-result valid';
          msgBox.innerHTML = '<strong>⚠️ مفتاح ترخيص قديم صالح (صيغة HMAC v1.x)</strong><br><small>ملاحظة: النسخ الحديثة تتطلب مفتاح بصيغة LIC2-.</small>';
          table.style.display = 'table';
          document.getElementById('vFormat').textContent = 'LIC- (توقيع متماثل قديم)';
          document.getElementById('vHwid').textContent = hwid;
          document.getElementById('vTier').textContent = tier;
          document.getElementById('vLab').textContent = labName || 'مختبر معتمد';
          document.getElementById('vExpiry').textContent = expiryDate;
          document.getElementById('vSignature').textContent = 'سليم ولكن بصيغة قديمة';
          return;
        } catch (e) {
          resBox.className = 'verify-result invalid';
          msgBox.innerHTML = '<strong>❌ خطأ في قراءة المفتاح:</strong> ' + e.message;
          return;
        }
      }

      resBox.className = 'verify-result invalid';
      msgBox.innerHTML = '<strong>❌ صيغة غير مدعومة:</strong> يجب أن يبدأ المفتاح بـ LIC2- أو LIC-';
    }

    // -------------------------------------------------------------------------
    // Utilities (Copy, Toast)
    // -------------------------------------------------------------------------
    function copyGeneratedKey() {
      if (!lastGeneratedKey) return;
      copyText(lastGeneratedKey);
      showToast('تم نسخ كود التفعيل إلى الحافظة! 📋');
    }

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
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
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  </script>
</body>
</html>
`;

// 1. Write to tools/license-generator.html and tools/مولد_التراخيص.html
const toolsHtml1 = path.join(__dirname, 'license-generator.html');
const toolsHtml2 = path.join(__dirname, 'مولد_التراخيص.html');
fs.writeFileSync(toolsHtml1, htmlContent, 'utf-8');
fs.writeFileSync(toolsHtml2, htmlContent, 'utf-8');
console.log('✅ Updated tools/license-generator.html & tools/مولد_التراخيص.html');

// 2. Write to Desktop
const desktopDir = path.join(os.homedir(), 'Desktop');
const destDesktopHtml = path.join(desktopDir, 'مولد التراخيص - Labryo LIMS.html');
fs.writeFileSync(destDesktopHtml, htmlContent, 'utf-8');
console.log('✅ Updated Desktop Keygen File:', destDesktopHtml);

// 3. Update CMD launcher
const batchLauncher = path.join(desktopDir, 'تشغيل مولد التراخيص.cmd');
const batchContent = `@echo off\r\nchcp 65001 >nul\r\nstart "" "%~dp0مولد التراخيص - Labryo LIMS.html"\r\nexit\r\n`;
fs.writeFileSync(batchLauncher, batchContent, 'utf-8');
console.log('✅ Updated CMD Launcher:', batchLauncher);

// 4. Update shortcut (.lnk)
const psScript = `
$wsh = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$target = Join-Path $desktop 'مولد التراخيص - Labryo LIMS.html'
$shortcut = $wsh.CreateShortcut((Join-Path $desktop 'مولد التراخيص (Labryo).lnk'))
$shortcut.TargetPath = $target
$shortcut.IconLocation = 'shell32.dll,47'
$shortcut.Save()
`;
const tmpPs = path.join(os.tmpdir(), 'create_shortcut.ps1');
fs.writeFileSync(tmpPs, psScript, 'utf-8');
try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`);
  console.log('✅ Shortcut (.lnk) updated successfully on Desktop!');
} catch (e) {
  console.warn('Notice on shortcut creation:', e.message);
}

console.log('🎉 ALL DONE! Keygen successfully upgraded to Ed25519 (LIC2-) with full legacy (LIC-) support.');
