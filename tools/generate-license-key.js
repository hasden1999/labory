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

function parseTierAndDays(arg) {
  const raw = (arg || 'LIFETIME').toString().trim().toUpperCase();
  if (raw === '1' || raw === 'LIFETIME' || raw === 'PERMANENT' || raw === 'دائمي' || raw === 'دائم') {
    return { tier: 'LIFETIME', days: 36500, label: 'دائم مدى الحياة (LIFETIME)' };
  }
  if (raw === '2' || raw === 'WEEK' || raw === 'WEEKLY' || raw === '7' || raw === '7DAYS' || raw === 'أسبوع') {
    return { tier: 'WEEKLY', days: 7, label: 'أسبوع واحد (7 أيام)' };
  }
  if (raw === '3' || raw === '2DAYS' || raw === 'TWO_DAYS' || raw === 'يومين') {
    return { tier: 'TWO_DAYS', days: 2, label: 'يومين فقط (48 ساعة)' };
  }
  if (raw === '4' || raw === 'MONTH' || raw === 'MONTHLY' || raw === '30' || raw === 'شهري') {
    return { tier: 'MONTHLY', days: 30, label: 'اشتراك شهري (30 يوماً)' };
  }
  if (raw === '5' || raw === 'YEAR' || raw === 'YEARLY' || raw === '365' || raw === 'سنوي') {
    return { tier: 'YEARLY', days: 365, label: 'اشتراك سنوي (365 يوماً)' };
  }
  const parsedNum = parseInt(raw, 10);
  if (!isNaN(parsedNum) && parsedNum > 0) {
    if (parsedNum === 2) {
      return { tier: 'TWO_DAYS', days: 2, label: 'يومين فقط (48 ساعة)' };
    }
    if (parsedNum === 7) {
      return { tier: 'WEEKLY', days: 7, label: 'أسبوع واحد (7 أيام)' };
    }
    return { tier: 'CUSTOM', days: parsedNum, label: `مخصص (${parsedNum} يوماً)` };
  }
  return { tier: 'LIFETIME', days: 36500, label: 'دائم مدى الحياة (LIFETIME)' };
}

// Check if arguments provided via CLI: node generate-license-key.js <HWID> [TIER_OR_DAYS] [LAB_NAME]
const args = process.argv.slice(2);
if (args.length >= 1) {
  const hwid = args[0].trim();
  const { tier, days, label } = parseTierAndDays(args[1]);
  const labName = args[2] || 'مختبر معتمد';

  const key = generateLicenseKey(hwid, days, tier, labName);
  const copied = copyToClipboard(key);

  console.log('\n======================================================');
  console.log('  مفتاح تفعيل الترخيص المولد بنجاح (Labryo LIMS):');
  console.log('======================================================');
  console.log(`  بصمة الجهاز: ${hwid}`);
  console.log(`  نوع الباقة:  ${label}`);
  console.log(`  اسم المختبر: ${labName}`);
  console.log('------------------------------------------------------');
  console.log('\n' + key + '\n');
  console.log('------------------------------------------------------');
  if (copied) {
    console.log('✅ تم نسخ كود التفعيل إلى الحافظة تلقائياً (Clipboard)!');
  }
  process.exit(0);
}

// Interactive CLI Mode
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

  console.log('\n2. اختر مدة ونوع باقة الترخيص:');
  console.log('   [1] دائم مدى الحياة (LIFETIME) - الخيار الافتراضي');
  console.log('   [2] أسبوع واحد (7 أيام - WEEKLY)');
  console.log('   [3] يومين فقط (48 ساعة - TWO_DAYS)');
  console.log('   [4] اشتراك شهري (30 يوماً)');
  console.log('   [5] اشتراك سنوي (365 يوماً)');
  console.log('   [6] تخصيص عدد أيام معين (Custom Days)');

  rl.question('> ', (tierChoice) => {
    const c = tierChoice.trim();
    if (c === '6') {
      rl.question('\nأدخل عدد الأيام المطلوبة للتفعيل (مثلاً 14 أو 60):\n> ', (daysInput) => {
        const customDays = parseInt(daysInput.trim(), 10) || 30;
        proceedWithGeneration(cleanHwid, customDays, 'CUSTOM', `مخصص (${customDays} يوماً)`);
      });
    } else {
      const parsed = parseTierAndDays(c);
      proceedWithGeneration(cleanHwid, parsed.days, parsed.tier, parsed.label);
    }
  });
});

function proceedWithGeneration(cleanHwid, days, tier, label) {
  rl.question('\n3. أدخل اسم المختبر (اختياري - اضغط Enter للتخطي):\n> ', (labNameInput) => {
    const labName = labNameInput.trim() || 'مختبر معتمد';

    const licenseKey = generateLicenseKey(cleanHwid, days, tier, labName);
    const copied = copyToClipboard(licenseKey);

    console.log('\n======================================================');
    console.log('  ✅ تم توليد كود التفعيل المشفر بنجاح:');
    console.log('======================================================');
    console.log(`\n  بصمة الجهاز: ${cleanHwid}`);
    console.log(`  نوع الباقة:  ${label}`);
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
}
