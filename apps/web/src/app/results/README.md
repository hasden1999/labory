<div dir="rtl" style="text-align: right; direction: rtl;">

# وحدة إدخال وتدقيق النتائج المخبرية (Orders & Results Module)

## الغرض الوظيفي (Purpose)
إدخال نتائج الفحوصات الطبية للعينات المسجلة، مقارنة القيم بالمديات المرجعية والحرجة (Critical Panic Alerts)، إجراء الحسابات التلقائية (Lipid Profile, eGFR, Mentzer, CBC Indices)، وتشغيل استمارات محطات العمل المجهرية المتخصصة (الإدرار العام GUE، الخروج العام GSE، صورة الدم CBC، الكيمياء، الأحياء المجهرية).

## واجهات البرمجة والمسارات (Public API)
- `GET /api/samples/:id/results`: جلب نتائج عينة محددة مع قيم الفحوصات والمديات.
- `PATCH /api/samples/:id/results`: حفظ وتحديث نتائج الفحوصات وتأكيد حالتها.
- `POST /api/samples/:id/status`: تحديث حالة العينة (`IN_PROGRESS`, `READY`, `DELIVERED`).
- `GET /api/samples/:id/pdf`: توليد تقرير PDF معتمد للنتيجة.

## الملفات الأساسية (Key Files)
- `page.tsx`: شاشة جدول إدخال النتائج ومحطات العمل.
- `../../components/UrineFormModal.tsx`: استمارة فحص الإدرار العام (GUE).
- `../../components/workstations/GseModal.tsx`: استمارة فحص الخروج العام (GSE).
- `../../components/workstations/CbcModal.tsx`: استمارة فحص صورة الدم الكاملة (CBC).
- `../../components/workstations/ChemistryModal.tsx`: استمارة فحوصات الكيمياء السريرية.
- `packages/domain/src/clinicalIntelligence.ts`: محرك الحسابات السريرية والتفسيرات التشخيصية.

</div>
