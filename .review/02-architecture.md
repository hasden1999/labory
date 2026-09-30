# تقرير وكيل الهيكلة وجودة الكود (02-Architecture & Code Quality)

**تاريخ الفحص:** 2026-09-30  
**المشرف العام:** رئيس فريق هندسة البرمجيات والمراجعة الفنية  
**حالة الفحص:** مكتمل بدقة وقراءة فقط (Read-Only)

---

## 📌 ملخص النتائج المعمارية (Executive Architecture Summary)
- 🔴 **حرج (Critical):** 0 ملاحظات.
- 🟠 **عالٍ (High):** 2 ملاحظات (ازدواجية مصدر الحقيقة وغياب المعاملات الذرية ACID، والملف الإلهي الضخم Monolithic God File).
- 🟡 **متوسط (Medium):** 3 ملاحظات (تكرار معادلات التحاليل الطبية بين الواجهة والخادم، استيراد دوال مساعدة من مسارات API ديناميكية، وتضخم معمارية Electron main.js).
- 🟢 **منخفض (Low):** 1 ملاحظة (عدم توحيد هيكل استجابات الـ API بين المسارات).

---

## 🔍 الملاحظات التفصيلية بالأدلة البرمجية

### [ARC-001] ازدواجية مصدر الحقيقة وانعدام المعاملات الذرية (Dual Source of Truth & Non-ACID Sync) 🟠 عالٍ (High)
- **الموقع:** `apps/web/src/lib/serverStore.ts:760-785` و `apps/web/src/lib/serverStore.ts:990, 1332`
- **المشكلة:**
  يعتمد النظام على مخزن عام في الذاكرة (`global.__labStore`) متزامن مع ملف JSON (`lab_store.json`)، بينما يقوم في الخلفية بتمرير العمليات إلى قاعدة بيانات SQLite (`lab.db`) عبر وعود غير متزامنة وغير منتظرة (Fire-and-Forget Promises):
  ```typescript
  // إضافة مريض
  store.patients.push(newPatient);
  saveStoreToFile();
  syncPatientToSqlite(newPatient).catch((e) => console.warn('[SqliteSync] addPatient error:', e?.message));
  return newPatient;
  ```
- **الأثر:**
  1. **فقدان الذرية (No ACID Transactions):** عند تسجيل عينة تتضمن إدخال عينة + فحوصات + ديون مالية، إذا نجح الحفظ في الذاكرة وفشل في SQLite (بسبب قفل الملف أو خطأ قيود)، تصبح البيانات غير متسقة (Split-Brain).
  2. **فقدان البيانات عند إعادة التشغيل:** في دالة `getStoreAsync` يتم تحميل البيانات من SQLite أو الملف بحسب الأسبقية، مما يؤدي إلى ظهور بيانات شبحية (Ghost Records) أو فقدان تحديثات لم تُكتب في SQLite بنجاح.
- **الحل المقترح:**
  جعل قاعدة بيانات SQLite عبر Prisma هي المصدر الوحيد والنهائي للحقيقة (`Single Source of Truth`)، واستخدام معاملات Prisma الذرية (`prisma.$transaction`) لكافة العمليات المالية والطبية الحساسة، وإلغاء الاعتماد على الـ JSON store المتزامن يدوياً.
- **الجهد:** كبير (Large).

---

### [ARC-002] انتهاك مبدأ المسؤولية الواحدة وتضخم الملف المركزي (Monolithic God Store) 🟠 عالٍ (High)
- **الموقع:** `apps/web/src/lib/serverStore.ts` (أكثر من 2,750 سطراً برمجياً)
- **المشكلة:**
  يحتوي ملف `serverStore.ts` على مسؤوليات متباينة تماماً مجمعة في ملف واحد:
  - إدارة المرضى والبحث الصوتي والتعريب (`normalizeArabic`).
  - إدارة العينات وحالات التحاليل ونقاط إدخال النتائج.
  - حساب عمولات الأطباء والنسب المالية.
  - إدارة الورديات المالية (Shifts) والمصروفات اليومية.
  - استقبال حزم الأجهزة الطبية وتفسير بروتوكول ASTM و HL7.
  - محرك النسخ الاحتياطي التلقائي وضغط الملفات.
  - مزامنة SQLite الثنائية.
- **الأثر:**
  صعوبة كتابة اختبارات وحدة مستقلة (Unit Tests)، وارتفاع خطورة حدوث آثار جانبية غير مقصودة (Side Effects) عند تعديل أي جزء من النظام، وتعقيد عملية الصيانة والتطوير المستقبلي.
- **الحل المقترح:**
  تقسيم الملف إلى وحدات خدمة مستقلة ضمن مجلد `apps/web/src/services/`:
  - `patient.service.ts`
  - `sample.service.ts`
  - `billing.service.ts`
  - `device-ingest.service.ts`
  - `backup.service.ts`
- **الجهد:** متوسط (Medium).

---

### [ARC-003] تكرار المنطق الطبي والمعادلات الحسابية بين الواجهات والخادم (DRY Violation in Clinical Math) 🟡 متوسط (Medium)
- **الموقع:** `apps/web/src/app/results/page.tsx:640-738` ومكونات `apps/web/src/components/workstations/`
- **المشكلة:**
  معادلات الكيمياء السريرية، مثل حساب البيليروبين غير المباشر (`IBIL = TBIL - DBIL`) ومعادلة فريدفالد للدهون (`LDL = Total Cholesterol - HDL - TG/5`) وتدقيق المجالات الطبيعية لكرات الدم في الإدرار، مكتوبة ومكررة داخل مكونات الـ React الأمامية:
  ```typescript
  // تكرار داخل results/page.tsx
  const tbilCalc = currentDBIL + currentIBIL;
  if (!isNaN(tbilCalc) && isFinite(tbilCalc)) {
    const tbilVal = tbilCalc.toFixed(2);
    nextResults[tbilTest.id] = { resultValue: tbilVal, isAbnormal: parseFloat(tbilVal) > 1.2 };
  }
  ```
- **الأثر:**
  إذا تم إدخال نتائج من تطبيق الموبايل، أو عبر ربط جهاز تحليل تلقائي عبر الـ API، فإن هذه الحسابات والتدقيقات السريرية لا تُطبق تلقائياً لأنها محبوسة داخل واجهة المستخدم في صفحة `results/page.tsx`.
- **الحل المقترح:**
  نقل كافة محركات الحسابات الطبية والسريرية إلى حزمة مشتركة `packages/shared/src/clinicalCalculations.ts` لتكون دالة نقية (Pure Functions) يتم استدعاؤها في الواجهة والخادم ومعالج الأجهزة الطبية على حد سواء.
- **الجهد:** صغير (Small).

---

### [ARC-004] تسريب التجريد: استيراد منطق الأعمال من مسار صفحة API ديناميكية (Leaky Abstraction) 🟡 متوسط (Medium)
- **الموقع:** `apps/web/src/app/api/whatsapp/send-result/route.ts:3`
- **المشكلة:**
  يقوم مسار إرسال الواتساب باستيراد دوال التحقق من تصنيفات الفحوصات الطبية من مسار طباعة التقارير الديناميكي:
  ```typescript
  import { isCbcTest, isGueTest, isGseTest, isSfaTest, isGeneralTest } from '../../samples/[id]/print/route';
  ```
- **الأثر:**
  كسر مبادئ تنظيم Next.js App Router؛ حيث يُفترض ألا تعتمد مسارات الـ API على ملفات مسارات أخرى داخل شجرة التوجيه (`Route Tree`)، مما يعقد عملية الـ Tree Shaking وقد يسبب دورات تجميعية غير متوقعة.
- **الحل المقترح:**
  نقل دوال تصنيف الفحوصات (`isCbcTest`, `isGueTest`, etc.) إلى `apps/web/src/lib/testClassifier.ts` واستيرادها من هناك.
- **الجهد:** صغير (Small).

---

### [ARC-005] تضخم ملف العملية الرئيسية لتطبيق سطح المكتب (`main.js`) 🟡 متوسط (Medium)
- **الموقع:** `apps/desktop/main.js` (أكثر من 1,420 سطراً)
- **المشكلة:**
  ملف `main.js` يدير دورة حياة النافذة، والإشراف على خادم Node.js المدمج (Process Supervision)، وقنوات الـ IPC للطباعة والتحكم بالنوافذ، ونظام التحديث التلقائي `autoUpdater`، وأيقونة شريط المهام (Tray)، وأعلام تحسين الرسومات GPU في مكان واحد.
- **الأثر:**
  صعوبة تتبع أخطاء الإقلاع البارد ومشاكل الذاكرة وإغلاق التطبيق.
- **الحل المقترح:**
  تفكيك `main.js` إلى وحدات معيارية:
  - `src/server-supervisor.js`
  - `src/ipc-handlers.js`
  - `src/tray-manager.js`
  - `src/updater.js`
- **الجهد:** صغير (Small).

---

### [ARC-006] عدم توحيد غلاف الاستجابات في مسارات الـ API (Inconsistent Response Envelope) 🟢 منخفض (Low)
- **الموقع:** مسارات `apps/web/src/app/api/`
- **المشكلة:**
  بعض المسارات ترجع مصفوفات مجردة `NextResponse.json(patients)`، وبعضها يرجع كائن `{ message: '...' }`، وأخرى ترجع `{ success: true, data: ... }`.
- **الأثر:**
  اضطرار دوال الواجهة الأمامية (`lib/api.ts`) لكتابة شروط استثنائية متعددة لفحص شكل الاستجابة.
- **الحل المقترح:**
  اعتماد معيار موحد مثل `ApiResponse<T> = { success: boolean; data?: T; error?: string; timestamp: string }`.
- **الجهد:** صغير (Small).

---

## 🏛️ التغطية المُثبتة (Architecture Coverage)
- **الملفات والمكونات المفحوصة:**
  - `apps/web/src/lib/serverStore.ts` (فحص شامل للمصدر المزدوج ومنطق العمل).
  - `apps/web/src/lib/prisma.ts` و `apps/server/src/prisma.ts` (إعدادات اتصال وعزل SQLite).
  - مسارات `apps/web/src/app/api/` (44 مساراً وتدقيق ترابطها واستيراداتها).
  - `apps/desktop/main.js` (فحص معمارية بيئة سطح المكتب).
  - `packages/shared/` (فحص حجم المنطق المشترك بين المشاريع).
- **ما لم يتم فحصه ولماذا:**
  - لم يتم فحص توزيع الـ Microservices لكون النظام مبنياً كـ Monolith محلي (On-Premise Desktop LIMS).
