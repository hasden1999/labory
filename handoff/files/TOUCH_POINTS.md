# TOUCH-POINT LIST (قائمة نقاط التماس المعتمدة)

هذه القائمة تحدد الملفات القائمة المسموح بتعديلها فقط لتنفيذ الميزتين (التجميع حسب الاختصاص + التحكم بحجم وموضع الشعار).
أي تعديل على ملف خارج هذه القائمة أو خارج الملفات الجديدة المنشأة يُعتبر مخالفة نطاق ويجب توثيقه في `SCOPE_EXCEPTIONS.md`.

## 1. مخطط قاعدة البيانات والتخزين (Schema & Storage Layer)
- `apps/server/prisma/schema.prisma`: إضافة جدولي `Specialty` و `TestGroup`، وحقول الربط في `TestCatalog`، وحقول الشعار والتجميع في `Settings`.
- `apps/web/src/lib/serverStore.ts`: دعم أنواع `SpecialtyRecord` و `TestGroupRecord` وإعدادات الشعار والنمط في الذاكرة.
- `apps/web/src/lib/sqliteSync.ts`: مزامنة الاختصاصات والمجموعات مع SQLite.

## 2. قالب الطباعة (Print Templates - Pure Split)
- `apps/web/src/app/api/samples/[id]/print/route.ts`: تفويض ترويسة التقرير وجسمه للملفين المستخرجين.
- `apps/web/src/app/api/samples/[id]/print/PrintHeader.ts`: (Agent C) عرض الترويسة والشعار وإزاحته.
- `apps/web/src/app/api/samples/[id]/print/PrintBody.ts`: (Agent B) تجميع الفحوصات في جسم التقرير حسب النمط المختار.

## 3. إعدادات المختبر والشعار (Settings & Lab Context)
- `apps/web/src/components/LabContext.tsx`: تعريف حقول `groupingStyle`, `logoWidthMm`, `logoAlign`, `logoOffsetXMm`, `logoOffsetYMm`.
- `apps/web/src/components/workspace/PaperDesignerV2.tsx`: نقطة تركيب محدد النمط ومكون التحكم بالشعار المطور.

## 4. واجهات الاستخدام (UI Workstations & Catalog)
- `apps/web/src/app/catalog/page.tsx`: محدد الاختصاص والمجموعة في نافذة إضافة وتعديل الفحص، وزر فتح إدارة الاختصاصات.
- `apps/web/src/app/page.tsx`: شاشة استقبال العينات واختيار الفحوصات (عرض الفحوصات حسب الاختصاص عند تفعيل الخيار).
- `apps/web/src/app/results/page.tsx`: شاشة إدخال النتائج (عرض وتجميع الفحوصات حسب الاختصاص عند تفعيل الخيار).

## 5. الحزمة المشتركة (Shared Domain)
- `packages/domain/src/index.ts`: إعادة تصدير دوال وأنواع التجميع النقية.

---

## الملفات الجديدة المسموح بإنشائها (Allowed New Files)
- `packages/domain/src/grouping.ts`: دالة التجميع النقية واختباراتها.
- `apps/web/src/components/specialties/*`: مكونات إدارة الاختصاصات ومحدد المجموعة.
- `apps/web/src/components/logo/*`: مكون التحكم بحجم وإزاحة الشعار مع المعاينة الحية.
- `apps/web/src/app/api/specialties/*`: نقاط نهاية الـ API للاختصاصات والمجموعات.
- `AGENT_BRIEFS/*`: تكليفات الوكلاء.
- `SPECIALTY_MATCH_REPORT.md`: تقرير مطابقة الفحوصات للاختصاصات.
- `TOUCH_POINTS.md`: هذا الملف.
