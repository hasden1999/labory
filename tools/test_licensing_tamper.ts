import { 
  getMachineHWID, 
  generateLicenseKey, 
  verifyLicenseKey,
  createLicenseTamperSeal,
  verifyLicenseTamperSeal
} from '../apps/web/src/lib/licensing';

function runTests() {
  console.log('🧪 بدء فحص منظومة التراخيص والحماية من التلاعب...');
  const hwid = getMachineHWID();
  console.log('  بصمة الجهاز (HWID):', hwid);

  // 1. Test 2-Day Key
  const key2Days = generateLicenseKey(hwid, 2, 'TWO_DAYS', 'مختبر فحص 48 ساعة');
  const v2 = verifyLicenseKey(key2Days, hwid);
  if (!v2.valid || v2.payload?.tier !== 'TWO_DAYS') {
    throw new Error('❌ فشل فحص مفتاح اليومين: ' + v2.message);
  }
  console.log('  ✅ مفتاح يومين (TWO_DAYS): ناجح');

  // 2. Test 1-Week Key
  const keyWeek = generateLicenseKey(hwid, 7, 'WEEKLY', 'مختبر فحص أسبوع');
  const vWeek = verifyLicenseKey(keyWeek, hwid);
  if (!vWeek.valid || vWeek.payload?.tier !== 'WEEKLY') {
    throw new Error('❌ فشل فحص مفتاح الأسبوع: ' + vWeek.message);
  }
  console.log('  ✅ مفتاح أسبوع (WEEKLY): ناجح');

  // 3. Test Lifetime Key
  const keyLife = generateLicenseKey(hwid, 36500, 'LIFETIME', 'مختبر دائم');
  const vLife = verifyLicenseKey(keyLife, hwid);
  if (!vLife.valid || vLife.payload?.tier !== 'LIFETIME') {
    throw new Error('❌ فشل فحص مفتاح دائمي: ' + vLife.message);
  }
  console.log('  ✅ مفتاح دائمي (LIFETIME): ناجح');

  // 4. Test HWID Mismatch Protection
  const vForeign = verifyLicenseKey(key2Days, 'LAB-9999-8888-7777');
  if (vForeign.valid) {
    throw new Error('❌ ثغرة أمنية: تم قبول مفتاح صادر لبصمة جهاز أخرى!');
  }
  console.log('  ✅ الحماية من نقل المفتاح لجهاز آخر: ناجحة ومفعلة');

  // 5. Test Key Cracking Protection
  const tamperedKey = key2Days.slice(0, -3) + 'XYZ';
  const vTampered = verifyLicenseKey(tamperedKey, hwid);
  if (vTampered.valid) {
    throw new Error('❌ ثغرة أمنية: تم قبول مفتاح تم تزوير توقيعه!');
  }
  console.log('  ✅ الحماية من التلاعب بتوقيع المفتاح (HMAC): ناجحة ومفعلة');

  // 6. Test Cryptographic Tamper Seal (Anti-file-editing)
  const baseTrial = {
    hardwareId: hwid,
    firstRunDate: '2026-09-29T21:00:00.000Z',
    trialExpiresAt: '2026-10-01T21:00:00.000Z',
    maxMonotonicTime: '2026-09-29T21:30:00.000Z',
    isActivated: false,
    licenseKey: '',
    tier: 'TRIAL',
  };

  const seal = createLicenseTamperSeal(baseTrial);
  const isSealOk = verifyLicenseTamperSeal(baseTrial, seal);
  if (!isSealOk) {
    throw new Error('❌ فشل التحقق من الختم المشفر الأصلي!');
  }
  console.log('  ✅ توليد والتحقق من الختم الأمني المشفر (Tamper Seal): ناجح');

  // Tamper 1: User tries to extend trial by editing trialExpiresAt in JSON
  const tamperedTrial1 = { ...baseTrial, trialExpiresAt: '2030-01-01T00:00:00.000Z' };
  if (verifyLicenseTamperSeal(tamperedTrial1, seal)) {
    throw new Error('❌ ثغرة أمنية: لم يتم كشف التعديل اليدوي على تاريخ انتهاء التجربة!');
  }
  console.log('  ✅ كشف ومنع التعديل اليدوي على تاريخ انتهاء التجربة في JSON: ناجح');

  // Tamper 2: User tries to reset firstRunDate
  const tamperedTrial2 = { ...baseTrial, firstRunDate: '2026-10-01T00:00:00.000Z' };
  if (verifyLicenseTamperSeal(tamperedTrial2, seal)) {
    throw new Error('❌ ثغرة أمنية: لم يتم كشف التعديل اليدوي على تاريخ بدء التجربة!');
  }
  console.log('  ✅ كشف ومنع التعديل اليدوي على تاريخ أول تشغيل: ناجح');

  // Tamper 3: User tries to change hardwareId
  const tamperedTrial3 = { ...baseTrial, hardwareId: 'LAB-OTHER-MACHINE' };
  if (verifyLicenseTamperSeal(tamperedTrial3, seal)) {
    throw new Error('❌ ثغرة أمنية: لم يتم كشف تزييف بصمة الجهاز داخل ملف البيانات!');
  }
  console.log('  ✅ كشف ومنع تزييف بصمة الجهاز داخل ملف البيانات: ناجح');

  console.log('\n🏆 كافة اختبارات الأمان والتراخيص والحماية من التلاعب اجتازت بنجاح 100%!');
}

runTests();
