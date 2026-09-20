#!/usr/bin/env node
// ==============================================================================
// المنسق الشامل لخط النشر والترقية لنظام المختبرات السريرية (Master Deployment Pipeline)
// ==============================================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const scriptsDir = path.join(rootDir, 'tools', 'deploy');
const backupsDir = path.join(rootDir, 'backups');

function step(num, title) {
  console.log(`\n========================================================`);
  console.log(`  [${num}] ${title}`);
  console.log(`========================================================`);
}

function run(cmd, desc) {
  console.log(`> ${cmd} (${desc})`);
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

(async () => {
  try {
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    step('0/5', 'توثيق نقطة العودة السابقة (Commit Tracking)...');
    try {
      const commit = execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf8' }).trim();
      fs.writeFileSync(path.join(backupsDir, 'PREVIOUS_COMMIT'), commit, 'utf8');
      console.log(`نقطة العودة المسجلة: ${commit}`);
    } catch {
      console.log('ملاحظة: تعذر قراءة معرف git commit، جاري الاستمرار...');
    }

    step('1/5', 'تنفيذ الحماية والنسخ الاحتياطي السريري لقاعدة البيانات والإعدادات...');
    run('node tools/deploy/backup.js', 'النسخ الاحتياطي السريري');

    step('2/5', 'مزامنة وترقية مخطط قاعدة البيانات السريرية (Prisma Migration)...');
    run('npx prisma validate --schema=apps/server/prisma/schema.prisma', 'فحص المخطط');
    run('npx prisma db push --schema=apps/server/prisma/schema.prisma --accept-data-loss=false', 'ترحيل الجداول');
    run('npx prisma generate --schema=apps/server/prisma/schema.prisma', 'توليد Prisma Client');

    if (!process.argv.includes('--skip-build')) {
      step('3/5', 'بناء وتجميع واجهة الويب ومحرك التحاليل السريرية (npm run build:web)...');
      run('npm run build:web', 'بناء واجهة الويب');
    } else {
      step('3/5', 'تخطي مرحلة بناء الويب (--skip-build)...');
    }

    step('4/5', 'فحص ومعالجة حزم تطبيق سطح المكتب وتوليد بصمة SHA-256...');
    const publishArgs = ['tools/deploy/publish_desktop_release.js'];
    if (process.argv.includes('--publish')) publishArgs.push('--publish');
    if (process.argv.includes('--build-desktop')) publishArgs.push('--build');
    run(`node ${publishArgs.join(' ')}`, 'معالجة مثبت سطح المكتب');

    step('5/5', 'اكتملت ترقية نظام المختبرات الطبية بنجاح تام! 🎉');
    console.log('النظام جاهز ومستقر في بيئة الإنتاج السريري.');
  } catch (error) {
    console.error(`\n❌ فشلت عملية الترقية: ${error.message}`);
    console.log('🚨 جاري تفعيل خطة الطوارئ والتراجع التلقائي لحماية بيانات المرضى...');
    try {
      execSync('node tools/deploy/rollback.js', { cwd: rootDir, stdio: 'inherit' });
    } catch (e) {
      console.error('فشل التراجع التلقائي: ' + e.message);
    }
    process.exit(1);
  }
})();
