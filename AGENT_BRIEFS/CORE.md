# تكليف وكيل النواة والخادم الأساسي (AGENT_BRIEFS/CORE.md)

## الهدف (Goal)
امتلاك البنية التحتية للنظام: إقلاع الخادم (Fastify Server Bootstrap)، طبقة مستودعات البيانات (Data Repositories) لتكون المكان الوحيد في النظام الذي يحتوي على استعلامات Prisma، منظومة الترخيص والحماية من التلاعب، محرك التحديثات التلقائية المعزول، الإعدادات، المصادقة والصلاحيات، النسخ الاحتياطي، والمصدر الموحد للحقيقة لإصدار النظام وإعدادات الجذر.

## المجلدات والملفات المملوكة (Owned Dirs & Files)
- `packages/core/`
- `apps/server/`
- `apps/desktop/services/updateService.js`
- ملفات الجذر المشتركة: `package.json`, `package-lock.json`, `tsconfig*.json`

## المسارات المحظورة (Forbidden Dirs)
- واجهات المستخدم (`apps/web/src/app/`, `apps/web/src/components/`).
- استمارات الفحوصات (`packages/forms/`).
- قوالب التقارير الورقية (`packages/reports/`).

## الخطوات التنفيذية (Steps)
1. إنشاء مستودعات البيانات النظيفة داخل `packages/core/src/repositories/`:
   - `CatalogRepository.ts`
   - `SampleRepository.ts`
   - `PatientRepository.ts`
   - `SettingsRepository.ts`
2. عزل محرك التحديثات `updateService.js` داخل `packages/core/src/updater/`.
3. عزل محرك الترخيص وبصمة العتاد في `packages/core/src/licensing/`.
4. توحيد قراءة الإصدار من مكان مركزي واحد `packages/core/src/version.ts`.
5. ترك حشوات توافقية في المسارات القديمة.

## معايير القبول (Acceptance Criteria)
- [ ] خلو أي طبقة أخرى (Forms, Design, Reports, Domain) من استدعاءات `prisma.*` المباشرة.
- [ ] نجاح إقلاع الخادم في زمن قياسي مع الحفاظ على كافة المسارات.

## صيغة التسليم (Handoff Format)
توليد تقرير `HANDOFF_CORE.md` يوضح هيكل المستودعات ومحركات الترخيص والتحديثات المكتملة.
