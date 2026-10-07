# Architecture Plan & Track Mapping — Reception Redesign
تاريخ التوثيق: 2026-10-07

## 1. خريطة المسارات وملكيات الملفات (Tracks & File Ownership)

### المسار 1: التخطيط والتكبير وحذف الخصم (Layout, Resizing & Discount Removal)
- **الهدف**: تحويل واجهة الاستقبال الموحدة إلى LTR إنجليزية بالكامل، إزالة كافة عناصر الخصم (UI, State, Invoice, Totals)، تكبير الخطوط والبطاقات لاستغلال المساحة المحررة دون أي تمرير أفقي (1366x768 و 1920x1080).
- **الملفات المملوكة**:
  - `apps/web/src/widgets/unified-workspace/ui/UnifiedWorkspace.tsx` (ضبط اتجاه LTR، العناوين الإنجليزية، إزالة زر Classic)
  - `apps/web/src/widgets/unified-workspace/ui/PatientCardPanel.tsx` (تكبير الحقول، محاذاة LTR، dir="auto" لحقول الإدخال)
  - `apps/web/src/widgets/unified-workspace/ui/CatalogCartPanel.tsx` (حذف أزرار وحقول الخصم، تكبير شبكة الفحوصات والسلة)
  - `apps/web/src/widgets/unified-workspace/ui/ResultsGridPanel.tsx` (محاذاة LTR، تكبير جدول النتائج، دمج زر النماذج الخاصة)
  - `apps/web/src/widgets/unified-workspace/ui/UnifiedActionBar.tsx` (عرض الإجمالي الصافي فقط بدون خصم، اختصارات لوحة المفاتيح)
  - `apps/web/src/widgets/unified-workspace/model/useUnifiedWorkspace.ts` (حذف منطق الخصم من الـ invoice وحسابات السلة، إزالة viewMode/classic)
  - `apps/web/src/widgets/unified-workspace/model/types.ts` (تنظيف أنواع الخصم وأنواع viewMode)
  - `apps/web/src/lib/orderHelpers.ts` (إزالة منطق حسابات الخصم)

### المسار 2: قائمة الفحوصات وترتيبها (Test Catalog & Frequency Ordering)
- **الهدف**: تطبيق خوارزمية فرز ذكية تعرض الفحوصات الأكثر طلباً أولاً في كل قسم استناداً لبيانات المختبر المحلية (آخر 90 يوماً) مع قائمة احتياطية سريرية ثابتة عند غياب البيانات، بدون تكرار الفحص وبالمطابقة عبر `id` أو `code`.
- **الملفات المملوكة**:
  - `apps/web/src/widgets/unified-workspace/model/useUnifiedWorkspace.ts` (تضمين منطق فرز الكتالوج)
  - `apps/web/src/widgets/unified-workspace/lib/catalogOrdering.ts` (ملف جديد نقِي يحتوي على خوارزمية الترتيب والقائمة الاحتياطية)
  - `apps/web/src/widgets/unified-workspace/ui/CatalogCartPanel.tsx` (عرض الفحوصات الأهم أولاً بشارة خفيفة أو ترتيب طبيعي مميز)

### المسار 3: دمج النماذج الخاصة (Specialized Forms Integration)
- **الهدف**: تمكين فتح النماذج الخاصة (`UrineFormModal`, `GseModal`, `SemenFormModal`, `CbcModal`, `ChemistryModal`, `MicrobiologyModal`) مباشرة من شاشة الاستقبال عند إضافة الفحص أو الضغط عليه في جدول النتائج، وحفظ وتخزين النتائج بنفس بنية البيانات السريرية، وضمان عدم فقدان مؤشر الكتابة وعدم ظهور dispar.
- **الملفات المملوكة**:
  - `apps/web/src/widgets/unified-workspace/ui/ResultsGridPanel.tsx` (إضافة زر / مؤشر فتح النموذج الخاص للفحص المؤهل)
  - `apps/web/src/widgets/unified-workspace/ui/UnifiedWorkspace.tsx` (استدعاء وعرض الـ Modals المختصة بأمان خارج الشجرة الداخلية لمنع re-mount)
  - `apps/web/src/widgets/unified-workspace/model/useUnifiedWorkspace.ts` (إدارة حالة النماذج المفتوحة وربط حفظ النتائج بها)

### المسار 4: التنقل بـ Shift (Shift Navigation Hook)
- **الهدف**: بناء hook نقي ومختبر لوحدة لوحة المفاتيح: ضغطة منفردة على مفتاح Shift (< 400ms) تنقل التركيز إلى الحقل التالي في بيانات المريض، ثم الفحص التالي في النتائج، مع استثناء IME، Alt/Ctrl، وSticky Keys info.
- **الملفات المملوكة**:
  - `apps/web/src/widgets/unified-workspace/lib/useShiftNavigation.ts` (ملف جديد: hook ومساعدات نقية قابلة للاختبار)
  - `apps/web/src/widgets/unified-workspace/ui/PatientCardPanel.tsx` (ربط تركيز Shift)
  - `apps/web/src/widgets/unified-workspace/ui/ResultsGridPanel.tsx` (ربط تركيز Shift بين الفحوصات)

### المسار 5: إزالة الواجهة القديمة (Classic Intake Removal)
- **الهدف**: حذف كود الواجهة الكلاسيكية القديم من `apps/web/src/app/page.tsx` وأي مفاتيح تبديل في `AppShell.tsx`، وتوجيه الصفحة الرئيسية حصرياً إلى الكونسول الموحد.
- **الملفات المملوكة**:
  - `apps/web/src/app/page.tsx` (تنظيف كامل لـ 3200 سطر قديم وجعل الصفحة رفيعة تستدعي `UnifiedWorkspace`)
  - `apps/web/src/components/AppShell.tsx` (حذف زر ومفاتيح التبديل `classic` / `unified`)

---

## 2. المسار 6 (المرحلة C): تحويل كافة نصوص البرنامج إلى الإنجليزية
- يتم تنفيذه بعد اكتمال واعتماد المسارات 1 إلى 5 واجتياز كافة الاختبارات.
