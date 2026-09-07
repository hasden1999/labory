#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');
const { execSync } = require('child_process');

const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

function generateLicenseKey(hwid, daysValid, tier = 'LIFETIME', labName = 'مختبر معتمد') {
  const cleanHwid = hwid.trim().toUpperCase();
  const expiryDate = tier === 'LIFETIME'
    ? new Date('2099-12-31T23:59:59Z')
    : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const expiryStr = expiryDate.toISOString().split('T')[0];
  const dataToSign = `${cleanHwid}|${expiryStr}|${tier}|${labName.trim()}`;

  const signature = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const base64Data = Buffer.from(dataToSign, 'utf-8').toString('base64url');
  return `LIC-${base64Data}-${signature}`;
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'win32') {
      execSync('clip', { input: text });
      return true;
    }
  } catch (e) {}
  return false;
}

// Check if arguments provided via CLI
const args = process.argv.slice(2);
if (args.length >= 1) {
  const hwid = args[0];
  const tier = (args[1] || 'LIFETIME').toUpperCase();
  const days = tier === 'YEARLY' ? 365 : tier === 'MONTHLY' ? 30 : tier === 'TRIAL' ? 7 : 36500;
  const labName = args[2] || 'مختبر معتمد';

  const key = generateLicenseKey(hwid, days, tier, labName);
  copyToClipboard(key);
  console.log('\n======================================================');
  console.log('  مفتاح تفعيل الترخيص المولد بنجاح:');
  console.log('======================================================');
  console.log('\n' + key + '\n');
  console.log('تم نسخ كود التفعيل إلى الحافظة تلقائياً (Clipboard)!');
  process.exit(0);
}

// Interactive Mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n======================================================');
console.log('  أداة الأدمن لتوليد مفاتيح تفعيل برنامج المختبر الطبي');
console.log('  Labryo LIMS Pro - Offline License Key Generator');
console.log('======================================================\n');

rl.question('1. أدخل كود بصمة الجهاز المستلم من العميل (HWID):\n> ', (hwidInput) => {
  const cleanHwid = hwidInput.trim().toUpperCase();
  if (!cleanHwid || !cleanHwid.startsWith('LAB-')) {
    console.error('\n❌ خطأ: كود بصمة الجهاز غير صالح. يجب أن يبدأ بـ LAB-XXXX...');
    rl.close();
    process.exit(1);
  }

  console.log('\n2. اختر نوع باقة الترخيص:');
  console.log('   [1] دائم مدى الحياة (LIFETIME) - الخيار الافتراضي');
  console.log('   [2] اشتراك سنوي (365 يوماً)');
  console.log('   [3] اشتراك شهري (30 يوماً)');
  console.log('   [4] تجريبي مؤقت (7 أيام)');

  rl.question('> ', (tierChoice) => {
    let tier = 'LIFETIME';
    let days = 36500;

    const c = tierChoice.trim();
    if (c === '2') {
      tier = 'YEARLY';
      days = 365;
    } else if (c === '3') {
      tier = 'MONTHLY';
      days = 30;
    } else if (c === '4') {
      tier = 'TRIAL';
      days = 7;
    }

    rl.question('\n3. أدخل اسم المختبر (اختياري - اضغط Enter للتخطي):\n> ', (labNameInput) => {
      const labName = labNameInput.trim() || 'مختبر معتمد';

      const licenseKey = generateLicenseKey(cleanHwid, days, tier, labName);
      const copied = copyToClipboard(licenseKey);

      console.log('\n======================================================');
      console.log('  ✅ تم توليد كود التفعيل المشفر بنجاح:');
      console.log('======================================================');
      console.log(`\n  بصمة الجهاز: ${cleanHwid}`);
      console.log(`  نوع الباقة:  ${tier}`);
      console.log(`  اسم المختبر: ${labName}`);
      console.log('\n  كود التفعيل (License Key):');
      console.log('  ----------------------------------------------------');
      console.log(`  ${licenseKey}`);
      console.log('  ----------------------------------------------------');

      if (copied) {
        console.log('\n  📋 تم نسخ كود التفعيل تلقائياً إلى الحافظة!');
        console.log('  يمكنك الآن الضغط على (Ctrl + V) في واتساب ولصقه للعميل مباشرة.\n');
      } else {
        console.log('\n  يمكنك نسخ الكود أعلاه وإرساله للعميل عبر واتساب.\n');
      }

      rl.question('اضغط Enter للخروج...', () => {
        rl.close();
      });
    });
  });
});
