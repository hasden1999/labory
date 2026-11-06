# تقرير وكيل واجهة وتجربة المستخدم (03-UI/UX Agent)

**تاريخ الفحص:** 2026-11-05  
**المشرف العام:** رئيس فريق هندسة البرمجيات والمراجعة الفنية  
**حالة الفحص:** مكتمل بدقة وقراءة فقط (Read-Only)  
**نسخة النظام الخاضعة للفحص:** Labryo LIMS v2.1.1

---

## 📌 ملخص النتائج (Executive UI/UX Summary)
- 🔴 **حرج (Critical):** 0 ملاحظات.
- 🟠 **عالٍ (High):** 2 ملاحظات (عدم تجاوب شاشة الاستقبال الموحدة على الشاشات اللوحية، وطلب خطوط خارجية من Google Fonts في تطبيق محلي).
- 🟡 **متوسط (Medium):** 2 ملاحظات (اعتراض اختصارات F1-F10 بدون تقييد التركيز، وغياب إغلاق النوافذ بزر Escape وانعدام Focus Trap).
- 🟢 **منخفض (Low):** 1 ملاحظة (نصوص إنجليزية غير معربة وأخطاء إملائية في الواجهة السريرية).

---

## 🔍 الملاحظات التفصيلية بالأدلة البرمجية

### [UI-001] عدم تجاوب اللوحات الثلاث في شاشة الاستقبال الموحدة على الشاشات اللوحية 🟠 عالٍ (High)
- **الموقع:** `apps/web/src/widgets/unified-workspace/ui/UnifiedWorkspace.tsx:131-157`
- **المشكلة:**
  يتم ترتيب لوحات الاستقبال الثلاث (لوحة المريض، لوحة السلة والكتالوج، ولوحة إدخال النتائج) في شريط أفقي ثابت (`flexDirection: 'row'`, `minHeight: 0`, `overflow: 'hidden'`):
  ```typescript
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      gap: '12px',
      padding: '12px',
      overflow: 'hidden',
      boxSizing: 'border-box',
      minHeight: 0,
    }}
  >
    <PatientCardPanel workspace={workspace} />
    <CatalogCartPanel workspace={workspace} onOpenSpecialModal={handleOpenSpecialModal} />
    <ResultsGridPanel workspace={workspace} onOpenSpecialModal={handleOpenSpecialModal} />
  </div>
  ```
  لوحة المريض تأخذ عرضاً ثابتاً ~312px، ولوحة النتائج تأخذ ~588px، ولوحة الكتالوج تتطلب 350px على الأقل، مما يتطلب دقة عرض لا تقل عن 1280 بكسل.
- **الأثر:**
  عند تشغيل الواجهة من أجهزة تابلت (iPad / Android Tablet) عبر الشبكة المحلية في غرفة سحب العينات أو الاستقبال السريع (بدقة 768px إلى 1024px)، يحدث انضغاط واختفاء لأزرار النتائج والتحاليل دون توفير شريط تمرير أو تدرج عمودي (Responsive Stacking).
- **الحل المقترح:**
  إضافة استعلام وسائط (Media Query `@media (max-width: 1024px)`) لتحويل الحاوية إلى نظام التبويبات المتنقلة (Tabs: مريض / فحوصات / نتائج) أو التكديس العمودي مع شريط تمرير مريح.
- **الجهد:** متوسط (Medium).

---

### [UI-002] طلب الخطوط الخارجية من خوادم Google Fonts في تطبيق محلي مغلق 🟠 عالٍ (High)
- **الموقع:** `apps/web/src/app/layout.tsx:31-36`
- **المشكلة:**
  يحتوي ملف `layout.tsx` على روابط خارجية لتحميل خطوط Google Fonts عبر الإنترنت:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cairo:wght@400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  ```
- **الأثر:**
  بما أن النظام يعمل بنمط Offline-First داخل المختبرات (وقد لا يتوفر اتصال بالإنترنت على جهاز الاستقبال)، فإن المتصفح يقوم بتعليق عملية العرض بانتظار مهلة الاتصال بالخادم الخارجي، مسبباً وميض اختفاء النص (FOIT - Flash of Invisible Text) وبطء ملحوظ في زمن الإقلاع الأولي للبرنامج.
- **الحل المقترح:**
  حذف استدعاءات الـ CDN الخارجية واستبدالها بحزمة خطوط محلية مثبتة مسبقاً (Local Font Face) أو الاعتماد الكامل على خطوط النظام المحلية الصفرية المعرفة في `globals.css`.
- **الجهد:** صغير (Small).

---

### [UI-003] اعتراض الاختصارات العامة F1-F10 بدون عزل حقول الإدخال والنوافذ 🟡 متوسط (Medium)
- **الموقع:** `apps/web/src/widgets/unified-workspace/ui/UnifiedActionBar.tsx:401-418`
- **المشكلة:**
  يتم تسجيل مستمع لوحة المفاتيح للأزرار الوظيفية (F1, F2, F8, F9, F10) على نافذة `window` العامة دون التحقق مما إذا كان المستخدم يكتب حالياً في حقل نصي أو فتح نافذة منبثقة تفاعلية:
  ```typescript
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F9') { e.preventDefault(); handleSave(); }
    else if (e.key === 'F10') { e.preventDefault(); handlePrint(); }
    else if (e.key === 'F1') { e.preventDefault(); handleNewPatient(); }
  };
  ```
- **الأثر:**
  زر `F1` هو الزر الافتراضي لنظام المساعدة في ويندوز، والضغط عليه أثناء فتح أي نافذة منبثقة أو أثناء كتابة بيانات المريض يؤدي إلى تفعيل دالة `handleNewPatient` وفتح نافذة تأكيد مسح البيانات، مما يربك فني المختبر ويعطل تدفق العمل.
- **الحل المقترح:**
  تجاهل هذه الاختصارات عندما يكون العنصر النشط `input` أو `textarea` أو عند وجود نافذة مودال مفتوحة:
  ```typescript
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
    // السماح فقط بـ F9 للحفظ السريع إذا لزم الأمر وتجاهل البقية
  }
  ```
- **الجهد:** صغير (Small).

---

### [A11Y-001] غياب إغلاق النوافذ المنبثقة بزر Escape واحتجاز تركيز المؤشر 🟡 متوسط (Medium)
- **الموقع:** `apps/web/src/components/ConfirmModal.tsx:54-105`
- **المشكلة:**
  لا تحتوي نافذة التأكيد `ConfirmModal` (وكذلك عدد من النوافذ السريرية) على مستمع لمفتاح `Escape` لإلغاء وإغلاق النافذة، كما أنها لا تمنع مؤشر التركيز (Focus Trap) من الخروج إلى عناصر الصفحة الخلفية عند التنقل بمفتاح `Tab`:
  ```typescript
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal-content" ... onClick={(e) => e.stopPropagation()}>
  ```
- **الأثر:**
  مخالفة معايير الوصولية العالمية WCAG 2.2 (Success Criterion 2.1.2 No Keyboard Trap)؛ مما يسبب صعوبة للمستخدمين الذين يفضلون لوحة المفاتيح ويفقد التركيز المنطقي للمؤشر.
- **الحل المقترح:**
  إضافة هوك لإغلاق النافذة عند ضغط `Escape` واحتجاز التركيز (Focus Trapping) داخل أزرار التأكيد والإلغاء حتى إغلاق المودال.
- **الجهد:** صغير (Small).

---

### [UI-004] نصوص إنجليزية غير معربة وأخطاء إملائية في الواجهة السريرية 🟢 منخفض (Low)
- **الموقع:** `apps/web/src/widgets/unified-workspace/ui/PatientCardPanel.tsx:1203-1270` و `apps/web/src/widgets/unified-workspace/ui/ResultsGridPanel.tsx:68`
- **المشكلة:**
  1. استمارة إضافة طبيب سريع من بطاقة المريض تحوي نصوصاً إنجليزية بالكامل دون تعريب:
     ```html
     <label>Doctor full name *</label>
     <label>Phone number (optional)</label>
     <label>Clinic / Hospital (optional)</label>
     <label>Commission percentage (%)</label>
     ```
  2. خطأ إملائي في تسمية فورمة مسحة الدم في `ResultsGridPanel.tsx:68`:
     `BLOOD_FILM: { label: 'فومرة مسحة الدم (Blood Film)' ... }` (كُتبت "فومرة" بدلاً من "فورمة").
- **الأثر:**
  خلل بصري وتقليل من اتساق وهوية البرنامج كمنتج طبي عربي موحد.
- **الحل المقترح:**
  ترجمة استمارة الطبيب إلى اللغة العربية الفصحى وتصحيح الخطأ الإملائي في جدول الفحوصات المتخصصة.
- **الجهد:** صغير (Small).

---

## 📊 نطاق التغطية المثبتة (Inspection Scope)

- **الملفات والمجلدات التي تم فحصها فعلياً:**
  - القوالب والتصميم العام: `apps/web/src/app/globals.css`، `apps/web/src/app/layout.tsx`، `apps/web/src/components/AppShell.tsx`.
  - لوحة العمل السريرية الموحدة: `apps/web/src/widgets/unified-workspace/ui/*` (كافة اللوحات: UnifiedWorkspace, PatientCardPanel, CatalogCartPanel, ResultsGridPanel, UnifiedActionBar, ReceptionHeader, ReceptionSidebar).
  - النوافذ المنبثقة واستمارات العمل: `apps/web/src/components/ConfirmModal.tsx`، ونوافذ الفحوصات التخصصية في `apps/web/src/components/workstations/`.
- **ما لم يتم فحصه والسبب:**
  - الصفحات الإدارية الفرعية الثانوية مثل صفحة التراخيص `/license` نظراً للتركيز على الشاشة السريرية الأساسية اليومية.