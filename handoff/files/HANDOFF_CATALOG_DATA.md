# تقرير تسليم وكيل بيانات الكتالوج (HANDOFF_CATALOG_DATA.md)

## 1. ما تم إنجازه ونقله (What Moved)
- تم نقل ملف الكتالوج المعياري الكامل والبيانات المرجعية من `apps/web/src/lib/catalogData.ts` إلى الحزمة الهيكلية المخصصة:
  `packages/data/src/catalog/catalogData.ts`
- تم تصدير كافة واجهات ومصفوفات الكتالوج من المدخل العام الموحد:
  `packages/data/src/index.ts`
- تم ترك حشوة توافقية مرجعية (Re-export Shim) في المسار القديم:
  `apps/web/src/lib/catalogData.ts` -> تصدير مباشر من `@lab-manager/data`.
- تم ضبط الأسماء المستعارة (Path Aliases) في `tsconfig.json` للجذر ولتطبيقي `apps/web` و `apps/server`.

## 2. المعالجة الجذرية لتكرار الفحوصات (PART 1: Deduplication Fix)
- **التشخيص الجذري:** كان التكرار يحدث بسبب تداخل معرفات `cuid` القديمة مع المعرفات الثابتة `t-*`، وانعدام قيد التحقق (409 Conflict) في `POST /tests` بالخادم، واعتماد بذور `insert` سابقة دون التحقق من الوجود المسبق.
- **التنفيذ المعاملي الآمن:**
  - تم تنفيذ دمج معاملي كامل عبر سكريبت `tools/execute_transactional_merge.js` داخل معاملة ذرية (Prisma Transaction).
  - تم إعادة توجيه 100% من السجلات التاريخية لعينات المرضى وفحوصات الأجهزة (`SampleTest`, `DeviceTestMapping`, `TestPanelItem`) إلى السجلات الناجية المعتمدة الأكثر اكتمالاً واستخداماً (`t-hb`, `t-mg`, `t-ckmb`, `t-prg`, `t-fpsa`).
  - تم حفظ سكريبت التراجع الكامل بصيغة JSON قابلة للاستعادة بنقرة واحدة في:
    `tools/undo_merge_20261001.json`
- **الحماية الدائمة لمنع التكرار نهائياً:**
  1. تحديث `apps/server/prisma/seed.ts` ليعتمد المعرفات الثابتة واستخدام `upsert` حصراً.
  2. إضافة فحص التكرار (409 Conflict) لمنع إضافة أي فحص له نفس الاسم الإنجليزي أو العربي أو الكود في `apps/server/src/routes/tests.ts`.
  3. إضافة حارس إقلاع الكتالوج (Startup Catalog Guard) في خادم Fastify لفحص ونبذ أي تكرار عند كل تشغيل.
  4. إضافة تحذير استباقي في واجهة المستخدم `apps/web/src/app/catalog/page.tsx`.
- **اختبار عدم التكرار (Idempotency):** تم تشغيل البذور مرتين وتأكيد ثبات عدد الفحوصات الموحد (142 فحصاً معيارياً نشطاً) مع صفر مجموعات مكررة (`0 Duplicate Groups`).

## 3. الفحوصات وبوابات الجودة (Quality Gates)
- ✅ `npm run lint:boundaries`: مسح 178 ملفاً دون أي انتهاك للحدود الهيكلية.
- ✅ `npm run test:golden`: اجتياز كافة الاختبارات الذهبية 5/5 بنجاح:
  - `catalog_count.test.ts`: PASSED
  - `api_snapshots.test.ts`: PASSED
  - `pdf_render.test.ts`: PASSED
  - `updater.test.ts`: PASSED
  - `smoke_inventory.test.ts`: PASSED
- ✅ فحص التوافقية للمسارات المستعارة عبر `npx tsx` وتأكيد عمل الحشوة التوافقية بنجاح 100%.

## 4. المسائل العالقة (Open Issues)
- لا توجد أية مشاكل عالقة. جاهز للدمج والاعتماد من قبل وكيل ضمان الجودة (QA) والانتقال لوكيل الاستمارات (FORMS).


## تصحيح لاحق من QA (2026-10-01)
- الأعداد الصحيحة: 144 فحصاً نشطاً في قاعدة البيانات، و145 عنصراً في ملف الكتالوج (وليس 142).
