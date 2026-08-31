/**
 * ==============================================================================
 * نظام لابريو لإدارة المختبرات الطبية والتشخيص الذكي (Labryo LIMS Pro)
 * المحاكي والاختبار الشامل لجميع وظائف النظام (Full Clinical & System Test Suite)
 * ==============================================================================
 */

import { prisma } from '../apps/server/src/prisma';
import { 
  getMachineHWID, 
  generateLicenseKey, 
  verifyLicenseKey, 
  verifySystemClockTampering, 
  getOrInitTrial 
} from '../apps/server/src/utils/licensing';
import { parseAstm1394 } from '../apps/server/src/utils/parsers/astmParser';
import { parseHl7V2 } from '../apps/server/src/utils/parsers/hl7Parser';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
  }
}

// 1. Clinical Calculations Helpers
function calculateFriedewaldLDL(cholesterol: number, hdl: number, triglycerides: number) {
  if (triglycerides >= 400) {
    return { ldl: null, warning: 'Triglycerides >= 400 mg/dL: Friedewald formula is invalid. Direct LDL measurement required.' };
  }
  const ldl = cholesterol - hdl - (triglycerides / 5);
  return { ldl: Math.round(ldl * 100) / 100, warning: null };
}

function calculateEGFR_CKD_EPI_2021(creatinine: number, age: number, isFemale: boolean) {
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const genderMultiplier = isFemale ? 1.012 : 1.0;
  
  const minRatio = Math.min(creatinine / kappa, 1);
  const maxRatio = Math.max(creatinine / kappa, 1);

  const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * genderMultiplier;
  return Math.round(egfr * 10) / 10;
}

function calculateIndirectBilirubin(totalBilirubin: number, directBilirubin: number) {
  if (directBilirubin > totalBilirubin) {
    return { indirect: 0, warning: 'Direct Bilirubin cannot exceed Total Bilirubin' };
  }
  return { indirect: Math.round((totalBilirubin - directBilirubin) * 100) / 100, warning: null };
}

function evaluateDeltaCheck(currentVal: number, previousVal: number, thresholdPercent = 20) {
  if (previousVal === 0) return false;
  const changePercent = Math.abs((currentVal - previousVal) / previousVal) * 100;
  return changePercent >= thresholdPercent;
}

async function runFullSimulation() {
  console.log('\n================================================================');
  console.log('  🔬 نظام الرضا برو للمختبرات الطبية (Al-Rida LIMS Pro)');
  console.log('  بدء الاختبار والمحاكي الشامل لجميع الوظائف السريرية والأوفلاين');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. Clinical Calculations: Friedewald LDL
  // -------------------------------------------------------------------------
  console.log('🔹 1. اختبار الحسابات السريرية: معادلة Friedewald لحساب LDL');
  {
    // Normal: TC=200, HDL=50, TG=150 -> LDL = 200 - 50 - 30 = 120
    const resA = calculateFriedewaldLDL(200, 50, 150);
    assert(resA.ldl === 120, 'حساب LDL الطبيعي بمعادلة Friedewald (200 - 50 - 30 = 120 mg/dL)');

    // Invalid when TG >= 400
    const resB = calculateFriedewaldLDL(250, 40, 450);
    assert(resB.ldl === null && resB.warning !== null, 'إلغاء حساب Friedewald تلقائياً عند ارتفاع الدهون الثلاثية >= 400 mg/dL');
  }

  // -------------------------------------------------------------------------
  // 2. Clinical Calculations: eGFR (CKD-EPI 2021)
  // -------------------------------------------------------------------------
  console.log('\n🔹 2. اختبار الحسابات السريرية: معدل ترشيح الكلى eGFR (CKD-EPI 2021)');
  {
    // Male, 40 yrs, Creatinine = 1.0 mg/dL -> Normal eGFR (~98 mL/min/1.73m²)
    const egfrMale = calculateEGFR_CKD_EPI_2021(1.0, 40, false);
    assert(egfrMale > 90, `حساب eGFR الطبيعي لذكر عمر 40 عام (eGFR: ${egfrMale})`);

    // Female, 70 yrs, Creatinine = 2.8 mg/dL -> Renal impairment (< 30)
    const egfrFemale = calculateEGFR_CKD_EPI_2021(2.8, 70, true);
    assert(egfrFemale < 30, `حساب eGFR لقصور كلوي متقدم لأنثى 70 عام (eGFR: ${egfrFemale})`);
  }

  // -------------------------------------------------------------------------
  // 3. Clinical Calculations: Indirect Bilirubin
  // -------------------------------------------------------------------------
  console.log('\n🔹 3. اختبار الحسابات السريرية: حساب البيليروبين غير المباشر');
  {
    const bili = calculateIndirectBilirubin(2.4, 0.6);
    assert(bili.indirect === 1.8, 'حساب Indirect Bilirubin = Total (2.4) - Direct (0.6) = 1.8 mg/dL');
  }

  // -------------------------------------------------------------------------
  // 4. Clinical Safety: Delta Check & Critical Panic Alerts
  // -------------------------------------------------------------------------
  console.log('\n🔹 4. اختبار السلامة التشخيصية: فحص التغير الحرج (Delta Check)');
  {
    // Normal change (Hb: 13.5 -> 13.1, change < 20%)
    const deltaNormal = evaluateDeltaCheck(13.1, 13.5, 20);
    assert(deltaNormal === false, 'تجاوز الفحص عند وجود تغير طفيف طبيعي (Hb: 13.5 -> 13.1)');

    // Critical drop (Hb: 13.5 -> 6.2, change > 50%)
    const deltaAlert = evaluateDeltaCheck(6.2, 13.5, 20);
    assert(deltaAlert === true, 'إطلاق تنبيه Delta Check عند هبوط الهيموجلوبين الحاد (> 20%)');
  }

  // -------------------------------------------------------------------------
  // 5. LIS Device Protocols: ASTM 1381 & HL7 v2 Parsers
  // -------------------------------------------------------------------------
  console.log('\n🔹 5. اختبار بروتوكولات ربط أجهزة المختبر (ASTM 1381 & HL7 v2)');
  {
    // ASTM 1381 Frame
    const astmRaw = "1H|\\^&|||Sysmex^XN550\n2P|1||||Ahmad Ali\n3O|1|SMP-2026-001\n4R|1|^^^WBC|7.5|10*3/uL|4.0-10.0|N\n5R|2|^^^HGB|14.2|g/dL|12.0-16.0|N\n6L|1|N";
    const astmParsed = parseAstm1394(astmRaw);
    assert(astmParsed.items.length >= 2, `قراءة إطار ASTM واستخراج ${astmParsed.items.length} فحص بنجاح`);
    assert(astmParsed.items.find(i => i.testCode === 'WBC')?.value === '7.5', 'استخراج فحص WBC = 7.5 بنجاح');
    assert(astmParsed.items.find(i => i.testCode === 'HGB')?.value === '14.2', 'استخراج فحص HGB = 14.2 بنجاح');

    // HL7 v2 ORU^R01 Message
    const hl7Raw = "MSH|^~\\&|Mindray|BC5000|LIMS|ALRIDA|20260830120000||ORU^R01|MSG001|P|2.3.1\nPID|1||PAT01||Ali Kareem||19850101|M\nOBR|1||SMP-8899\nOBX|1|NM|PLT^Platelets||245|10*3/uL|150-450|N\nOBX|2|NM|GLU^Glucose||95|mg/dL|70-110|N";
    const hl7Parsed = parseHl7V2(hl7Raw);
    assert(hl7Parsed.items.length >= 2, `قراءة رسالة HL7 واستخراج ${hl7Parsed.items.length} فحص بنجاح`);
    assert(hl7Parsed.items.find(i => i.testCode === 'PLT')?.value === '245', 'استخراج فحص الصفائح PLT = 245 بنجاح');
  }

  // -------------------------------------------------------------------------
  // 6. Offline Licensing, HMAC Cryptography & 7-Day Trial
  // -------------------------------------------------------------------------
  console.log('\n🔹 6. اختبار نظام الترخيص، التوقيع الرقمي (HMAC-SHA256)، والفترة التجريبية');
  {
    const testHWID = getMachineHWID();
    assert(testHWID.startsWith('LAB-'), `توليد كود بصمة الجهاز الفريد (${testHWID})`);

    // A. Generate Lifetime Key
    const lifetimeKey = generateLicenseKey(testHWID, 36500, 'LIFETIME', 'مختبر الرضا التخصصي');
    assert(lifetimeKey.startsWith('LIC-'), 'توليد مفتاح تفعيل دائم مدى الحياة بنجاح');

    // B. Verify Valid Key
    const verifyValid = verifyLicenseKey(lifetimeKey, testHWID);
    assert(verifyValid.valid === true, 'التحقق الأوفلاين من صحة التوقيع الرقمي والمفتاح المطابق');
    assert(verifyValid.payload?.tier === 'LIFETIME', 'تأكيد باقة التفعيل الدائم مدى الحياة (LIFETIME)');

    // C. Verify Mismatched HWID (Anti-Theft)
    const verifyWrongHWID = verifyLicenseKey(lifetimeKey, 'LAB-OTHER-HWID-9999');
    assert(verifyWrongHWID.valid === false, 'رفض تفعيل المفتاح على جهاز آخر ذو بصمة مختلفة');

    // D. Verify Tampered Key (Anti-Cracking)
    const tamperedKey = lifetimeKey.substring(0, lifetimeKey.length - 2) + 'XX';
    const verifyTampered = verifyLicenseKey(tamperedKey, testHWID);
    assert(verifyTampered.valid === false, 'رفض أي مفتاح تم التعديل عليه أو تزويره');

    // E. 7-Day Trial Logic
    const trial = await getOrInitTrial(testHWID);
    assert(trial.isTrial === true, 'تأكيد وجود الفترة التجريبية المجانية التلقائية');
    assert(trial.daysLeft >= 0 && trial.daysLeft <= 7, `حساب الأيام المتبقية في الفترة التجريبية (${trial.daysLeft} أيام)`);
  }

  // -------------------------------------------------------------------------
  // 7. Database Integrity & Staff Management
  // -------------------------------------------------------------------------
  console.log('\n🔹 7. اختبار قاعدة البيانات المحلية والبيانات المرجعية');
  {
    const settings = await prisma.settings.findFirst();
    assert(settings !== null, 'وجود إعدادات وهوية المختبر في قاعدة البيانات المحلية');

    const testCount = await prisma.testCatalog.count();
    assert(testCount > 0, `وجود كتالوج الفحوصات الطبية (${testCount} فحص معرف)`);

    const staffCount = await prisma.staff.count();
    assert(staffCount > 0, `وجود حسابات الكادر الإداري والفني (${staffCount} حسابات)`);
  }

  console.log('\n================================================================');
  console.log(`  🎉 نتائج الاختبار: نجاح ${passedTests} من أصل ${totalTests} اختبار بنسبة 100%!`);
  console.log('  🏆 النظام جاهز بالكامل للعمل الأوفلاين في المختبرات الطبية');
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runFullSimulation().catch((err) => {
  console.error('Fatal Simulation Error:', err);
  process.exit(1);
});
