# AGENT BRIEF: GROUPING (Agent B)

## الهدف (Goal)
بناء دالة التجميع النقية الموحدة `groupTests(tests, style)` واستخدامها في:
1. شاشة استقبال العينات واختيار الفحوصات (`apps/web/src/app/page.tsx`).
2. شاشة إدخال النتائج (`apps/web/src/app/results/page.tsx`).
3. جسم التقرير المطبوع (`apps/web/src/app/api/samples/[id]/print/PrintBody.ts`).
4. خيار نمط التجميع في الإعدادات.

## المواصفات الفنية (Technical Requirements)
- دالة نقية 100% في `packages/domain/src/grouping.ts` تغطي باختبارات وحدة:
  - نمط التصنيف `category`: يطابق الوضع الحالي تماماً.
  - نمط الاختصاص `specialty`: الاختصاص -> المجموعة -> الفحص (مع احترام `sortOrder`).
  - وضع الفحوصات غير المعينة تحت اختصاص "Other" في النهاية.
  - تجاهل المجموعات الفارغة.
- في الإعدادات: عندما يكون "تجميع الفحوصات حسب الفئة" مفعلاً، يظهر خيار التحكم:
  - "حسب التصنيف (الحالي)" (`category`).
  - "حسب الاختصاص السريري (الجديد)" (`specialty`).
  وعند إيقاف التجميع، يختفي الخياران.
- في جسم التقرير المطبوع (`PrintBody.ts`):
  - رسم ترويسة الاختصاص ثم المجموعات ثم الفحوصات.
  - حماية الترويسات من الانفصال في نهاية الصفحات (`avoid page-break-after`).

## الملفات المملوكة (Owned Files)
- `packages/domain/src/grouping.ts`
- `packages/domain/src/grouping.test.ts`
- `packages/domain/src/index.ts`
- `apps/web/src/app/api/samples/[id]/print/PrintBody.ts`
- `apps/web/src/app/page.tsx` (تطبيق التجميع عند اختيار نمط الاختصاص)
- `apps/web/src/app/results/page.tsx` (تطبيق التجميع عند اختيار نمط الاختصاص)

## الملفات المحظورة (Forbidden Files)
- `apps/web/src/app/api/samples/[id]/print/PrintHeader.ts`
- محرر الفحوصات في الكتالوج.
- مخطط قاعدة البيانات والترحيلات.
