#!/usr/bin/env node

/**
 * ==============================================================================
 * نظام لابريو لإدارة المختبرات الطبية والتشخيص الذكي (Labryo LIMS Pro)
 * أداة المطور المستقلة لتوليد مفاتيح التفعيل الأوفلاين (Developer License Keygen CLI)
 * ==============================================================================
 * الاستخدام:
 *   node tools/keygen.js <HWID> [TIER: MONTHLY | YEARLY | LIFETIME] [LAB_NAME]
 * 
 * أمثلة:
 *   node tools/keygen.js LAB-8F42-99A1-B330 LIFETIME "مختبر الأمل التخصصي"
 *   node tools/keygen.js LAB-1A2B-3C4D-5E6F YEARLY "مختبر النور"
 *   node tools/keygen.js LAB-9988-7766-5544 MONTHLY
 * ==============================================================================
 */

const crypto = require('crypto');
const readline = require('readline');

// Master Secret for HMAC signatures (Strictly matching server licensing system)
const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

function generateLicenseKey(hwid, tier = 'LIFETIME', daysValid = 36500, labName = 'مختبر طبي معتمد') {
  const cleanHwid = hwid.trim().toUpperCase();
  
  let expiryDate;
  if (tier === 'LIFETIME') {
    expiryDate = new Date('2099-12-31T23:59:59Z');
  } else if (tier === 'YEARLY') {
    expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else if (tier === 'MONTHLY') {
    expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    expiryDate = new Date(Date.now() + (parseInt(daysValid, 10) || 30) * 24 * 60 * 60 * 1000);
  }

  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `${cleanHwid}|${expiryStr}|${tier}|${labName}`;

  const signature = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const base64Data = Buffer.from(dataToSign).toString('base64url');
  return {
    licenseKey: `LIC-${base64Data}-${signature}`,
    hwid: cleanHwid,
    tier,
    expiryDate: expiryStr,
    labName,
  };
}

// CLI Argument Handling
const args = process.argv.slice(2);

if (args.length >= 1) {
  const hwid = args[0];
  const tier = (args[1] || 'LIFETIME').toUpperCase();
  const labName = args[2] || 'مختبر طبي معتمد';

  const result = generateLicenseKey(hwid, tier, tier === 'LIFETIME' ? 36500 : (tier === 'YEARLY' ? 365 : 30), labName);

  console.log('\n========================================================');
  console.log('  👑 نظام الرضا برو - مولد مفاتيح التفعيل المعتمدة');
  console.log('========================================================');
  console.log(`📌 كود بصمة الجهاز (HWID) : ${result.hwid}`);
  console.log(`🏥 اسم المختبر            : ${result.labName}`);
  console.log(`⭐ نوع الباقة              : ${result.tier}`);
  console.log(`📅 تاريخ انتهاء الصلاحية : ${result.expiryDate}`);
  console.log('--------------------------------------------------------');
  console.log('🔑 مفتاح التفعيل الدائم (انسخه وأرسله للعميل):');
  console.log(`\n\x1b[32m${result.licenseKey}\x1b[0m\n`);
  console.log('========================================================\n');
  process.exit(0);
}

// Interactive Mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n========================================================');
console.log('  👑 نظام الرضا برو - مولد مفاتيح التفعيل المعتمدة للمطور');
console.log('  رقم المطور المعتمد: 07764271130');
console.log('========================================================\n');

rl.question('1️⃣ أدخل كود بصمة جهاز العميل (HWID) [مثال: LAB-8F42-99A1-B330]: ', (hwid) => {
  if (!hwid.trim()) {
    console.log('❌ خطأ: كود بصمة الجهاز مطلوب!');
    rl.close();
    return;
  }

  rl.question('2️⃣ اختر نوع الباقة (1: مدى الحياة LIFETIME, 2: سنوي YEARLY, 3: شهري MONTHLY) [افتراضي 1]: ', (tierChoice) => {
    let tier = 'LIFETIME';
    if (tierChoice.trim() === '2') tier = 'YEARLY';
    if (tierChoice.trim() === '3') tier = 'MONTHLY';

    rl.question('3️⃣ أدخل اسم مختبر العميل [افتراضي: مختبر طبي معتمد]: ', (labName) => {
      const finalLab = labName.trim() || 'مختبر طبي معتمد';
      const result = generateLicenseKey(hwid, tier, tier === 'LIFETIME' ? 36500 : (tier === 'YEARLY' ? 365 : 30), finalLab);

      console.log('\n========================================================');
      console.log('  🎉 تم توليد مفتاح التفعيل بنجاح!');
      console.log('========================================================');
      console.log(`📌 كود بصمة الجهاز (HWID) : ${result.hwid}`);
      console.log(`🏥 اسم المختبر            : ${result.labName}`);
      console.log(`⭐ نوع الباقة              : ${result.tier}`);
      console.log(`📅 تاريخ انتهاء الصلاحية : ${result.expiryDate}`);
      console.log('--------------------------------------------------------');
      console.log('🔑 مفتاح التفعيل (أرسل هذا السطر كاملاً للعميل):');
      console.log(`\n\x1b[32m${result.licenseKey}\x1b[0m\n`);
      console.log('========================================================\n');

      rl.close();
    });
  });
});
