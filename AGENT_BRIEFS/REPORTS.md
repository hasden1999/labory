# تكليف وكيل تقارير الطباعة و PDF (AGENT_BRIEFS/REPORTS.md)

## الهدف (Goal)
عزل قوالب الطباعة وتقارير الـ PDF ومحرك بناء بيانات التقارير في طبقة مستقلة مخصصة. فصل أنماط الطباعة الورقية تماماً عن مكونات شاشات العرض التفاعلية لضمان ثبات إخراج التقارير وتطابقها التام على مقاسات A4/A5، مع دعم الخطوط والاتجاه العربي الرسمي (RTL).

## المجلدات المملوكة (Owned Dirs)
- `packages/reports/templates/`
- `packages/reports/src/`

## المسارات المحظورة (Forbidden Dirs)
- استمارات إدخال النتائج (`packages/forms/`).
- إعدادات الخادم المركزية (`packages/core/`).
- مسارات واجهة المستخدم التفاعلية (`apps/web/src/app/`).

## الخطوات التنفيذية (Steps)
1. تنظيم قوالب الطباعة الخمسة داخل مجلد `templates/`:
   - `ClassicTemplate.ts`
   - `ModernTemplate.ts`
   - `ExecutiveTemplate.ts`
   - `CompactTemplate.ts`
   - `BlackWhiteTemplate.ts`
2. توحيد محرك توليد الـ PDF عبر Puppeteer باستخدام مسار متصفح النظام المكتشف تلقائياً دون تنزيل متصفحات خارجية.
3. بناء محول بيانات التقارير `ReportDataBuilder.ts` لتحضير البيانات والباركود ورمز QR الموثق.
4. ترك حشوة توافقية `apps/server/src/utils/pdf.ts` تستورد من `packages/reports`.

## معايير القبول (Acceptance Criteria)
- [ ] تطابق تام بنسبة 100% لمخرجات الـ PDF مع العينة المرجعية في `tests/golden/artifacts/golden_sample_report.pdf`.
- [ ] دعم مقاسات A4 و A5 بدقة ودون أي تجاوز لهوامش الصفحة.

## صيغة التسليم (Handoff Format)
توليد تقرير `HANDOFF_REPORTS.md` يتضمن ملفات القوالب المعتمدة وتأكيد اجتياز الاختبار الذهبي للـ PDF.
