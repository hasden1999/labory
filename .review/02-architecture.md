# تقرير وكيل المعمارية وجودة الكود (02-Architecture & Code Quality Agent)

**تاريخ الفحص:** 2026-11-05  
**المشرف العام:** رئيس فريق هندسة البرمجيات والمراجعة الفنية  
**حالة الفحص:** مكتمل بدقة وقراءة فقط (Read-Only)  
**نسخة النظام الخاضعة للفحص:** Labryo LIMS v2.1.1

---

## 📌 ملخص النتائج المعمارية (Executive Architecture Summary)
- 🔴 **حرج (Critical):** 1 ملاحظة (ازدواجية مخزن البيانات والانفصال بين ذاكرة Next.js وقاعدة SQLite).
- 🟠 **عالٍ (High):** 2 ملاحظات (تكرار المعادلات السريرية خارج حزمة Domain، وغياب المعاملات الذرية والتحديثات المجمعة في حفظ النتائج).
- 🟡 **متوسط (Medium):** 4 ملاحظات (ازدواجية ملف schema.prisma، غياب الفهرسة عن sampleId في المعاملات المالية، غياب توحيد وإصدارات API، وغياب مسار CI لاختبارات الـ PRs).
- 🟢 **منخفض (Low):** 1 ملاحظة (الكائن المتضخم God Object serverStore.ts وبقاء 35 مكوناً بانتظار ترحيل FSD).

---

## 🔍 الملاحظات التفصيلية بالأدلة البرمجية

### [ARC-001] ازدواجية مخزن البيانات والانفصال المعماري بين العمليات 🔴 حرج (Critical)
- **الموقع:** `apps/web/src/lib/serverStore.ts:1041-1045` و `apps/server/src/routes/samples.ts:13`
- **المشكلة:**
  يحتفظ تطبيق الواجهة `apps/web` بنسخة كائن كاملة للبيانات في ذاكرة العملية العشوائية `global.__labStore` مع حفظها في ملف JSON محلي، بينما يقوم خادم الباكند المستقل Fastify `apps/server` بالقراءة والكتابة المباشرة في قاعدة بيانات SQLite `lab.db`:
  ```typescript
  // apps/web/src/lib/serverStore.ts:1041
  global.__labStore = fromSqlite;
  console.log(`💎 [ServerStore] Authoritative state active from SQLite lab.db (${fromSqlite.tests.length} tests)`);
  ```
- **الأثر:**
  1. خطر الانفصال والتضارب اللحظي (Split-Brain Desynchronization)؛ فإذا قام خادم Fastify بتحديث عينة أو نتيجة فحص قادمة من جهاز مخبري، فإن كاش Next.js في الذاكرة لا يعلم بالتحديث إلا بعد إعادة تحميل كاملة.
  2. استهلاك الذاكرة المفرط: في المختبرات النشطة التي تحوي عشرات الآلاف من العينات والمرضى، الاحتفاظ بكامل السجلات كمصفوفات JavaScript في الـ RAM يهدد بانهيار المتصفح أو المحرك بنفاذ الذاكرة (Out Of Memory - OOM)، ولا سيما على بيئات 32-bit المحددة بـ 768MB.
- **الحل المقترح:**
  إلغاء طبقة `global.__labStore` وملف `lab_store.json` نهائياً، وجعل Prisma SQLite هو المصدر الأوحد والنهائي للحقيقة (Single Source of Truth) لكافة التطبيقات عبر استعلامات علائقية مباشرة مفهرسة ومجزأة (Paginated).
- **الجهد:** كبير (Large).

---

### [ARC-002] تكرار المعادلات السريرية خارج حزمة النطاق الطبية 🟠 عالٍ (High)
- **الموقع:** `apps/server/src/routes/results.ts:95-225` مقابل `packages/domain/src/clinicalIntelligence.ts:1-200`
- **المشكلة:**
  تمت إعادة كتابة وتضمين معادلات سريرية معقدة مثل معادلة وظائف الكلى 2021 CKD-EPI Race-Free ومعادلة فريدوالد للدهون وحساب البيليروبين غير المباشر يدوياً داخل مسارات Fastify بدلاً من استيراد الدوال النقية الموثقة من حزمة `@lab/domain`:
  ```typescript
  // apps/server/src/routes/results.ts:199
  const egfrVal = Math.round(
    142 *
    Math.pow(Math.min(cr / k, 1), a) *
    Math.pow(Math.max(cr / k, 1), -1.200) *
    Math.pow(0.9938, age) *
    fMultiplier
  );
  ```
- **الأثر:**
  انتهاك صريح لمبدأ DRY وفصل المسؤوليات؛ وأي تعديل أو تصحيح لمعايير سريرية (مثل تحديثات KDIGO أو IFCC) في حزمة `domain` لن ينعكس على السيرفر، مما يسبب صدور نتائج وتقارير متباينة لنفس المريض.
- **الحل المقترح:**
  استيراد واستدعاء دوال الحساب السريري مباشرة من `@lab/domain` وحذف الكود المكرر في `results.ts`.
- **الجهد:** صغير (Small).

---

### [DB-001] غياب المعاملات الذرية والتحديثات المجمعة لحفظ النتائج 🟠 عالٍ (High)
- **الموقع:** `apps/server/src/routes/results.ts:44-86`
- **المشكلة:**
  عند حفظ نتائج استمارة مريض تحوي عدة تحاليل (مثل صورة الدم الكاملة CBC التي تحوي 20-30 معاملاً)، يتم تنفيذ استعلامات `prisma.sampleTest.update` فردية متتالية داخل حلقة `for` دون تجميعها داخل معاملة قاعدة بيانات ذرية:
  ```typescript
  for (const item of results) {
    ...
    await prisma.sampleTest.update({
      where: { id: item.sampleTestId },
      data: { ... },
    });
  }
  ```
- **الأثر:**
  1. بطء شديد في الأداء وزيادة زمن قفل قاعدة البيانات (SQLite File Lock) بتكرار فتح وغلق المعاملات الفردية 30 مرة متتالية.
  2. خطر تلف حالة السجل: إذا فشل الاتصال أو حدث استثناء عند العنصر رقم 15، تظل العينة محفوظة جزئياً بنصف النتائج فقط دون إمكانية التراجع (No Rollback).
- **الحل المقترح:**
  استخدام `prisma.$transaction` لتنفيذ كافة التحديثات في ضربة واحدة ذرية إما أن تنجح معاً أو تتراجع بالكامل:
  ```typescript
  const updates = results.map(item => prisma.sampleTest.update({ ... }));
  await prisma.$transaction(updates);
  ```
- **الجهد:** صغير (Small).

---

### [DB-002] ازدواجية ملف المخطط schema.prisma وانعدام المصدر الموحد للمعلومة 🟡 متوسط (Medium)
- **الموقع:** `apps/server/prisma/schema.prisma` و `apps/web/prisma/schema.prisma`
- **المشكلة:**
  وجود نسختين متطابقتين تقريباً من ملف `schema.prisma` داخل مجلدين مختلفين بدلاً من الاعتماد على ملف مخطط موحد ومشترك.
- **الأثر:**
  خطر حدوث انحراف في المخطط (Schema Drift)؛ حيث يؤدي تعديل أحد الملفين دون الآخر إلى تباين النماذج المولدة لعملاء Prisma في السيرفر والويب وظهور أخطاء وقت التشغيل.
- **الحل المقترح:**
  نقل `schema.prisma` إلى حزمة مركزية (مثل `packages/db` أو إبقائه في `apps/server/prisma` فقط) مع توجيه `prisma generate` في كلا التطبيقين لنفس المسار.
- **الجهد:** صغير (Small).

---

### [DB-003] نقص الفهرسة على المفتاح الأجنبي sampleId في المعاملات المالية 🟡 متوسط (Medium)
- **الموقع:** `apps/server/prisma/schema.prisma:281-306`
- **المشكلة:**
  يحتوي جدول `FinancialTransaction` على فهارس لـ `patientId` و `debtorId` و `doctorId`، ولكنه يفتقر إلى فهرس مخصص لـ `sampleId`:
  ```prisma
  @@index([type, createdAt(sort: Desc)])
  @@index([patientId, createdAt(sort: Desc)])
  @@index([debtorId, createdAt(sort: Desc)])
  @@index([doctorId, createdAt(sort: Desc)])
  // مفقود: @@index([sampleId])
  ```
- **الأثر:**
  عند جلب سندات القبض والدفع الخاصة بعينة معينة (`where: { sampleId }`)، يضطر محرك SQLite لإجراء مسح تسلسلي لكامل الجدول (Full Table Scan)، مما يسبب تباطؤاً ملحوظاً مع نمو عدد المعاملات.
- **الحل المقترح:**
  إضافة `@@index([sampleId])` إلى نموذج `FinancialTransaction`.
- **الجهد:** صغير (Small).

---

### [API-001] غياب ترقيم الإصدارات وتوحيد مغلف الاستجابات للـ API 🟡 متوسط (Medium)
- **الموقع:** `apps/server/src/routes/*.ts`
- **المشكلة:**
  تفتقر نقاط النهاية إلى التوحيد في بنية الاستجابة ومعالجة الأخطاء؛ فبعض المسارات تعيد مصفوفات مباشرة (`reply.send(patients)` في `patients.ts`)، وبعضها يعيد كائنات `{ success, data }`، وبعضها يرمي استثناءات نصية مباشرة، دون وجود إصدار رسمي للـ API (مثل `/api/v1/`).
- **الأثر:**
  صعوبة بناء مستهلكين خارجيين أو معالجة الأخطاء بطريقة قياسية وموحدة في الواجهة، وصعوبة إجراء ترقيات غير كاسرة (Non-breaking changes) مستقبلاً.
- **الحل المقترح:**
  اعتماد مغلف موحد لكافة الاستجابات `{ success: boolean, data?: T, error?: { code, message }, meta?: any }` مع بادئة إصدار واضحة `/api/v1/`.
- **الجهد:** متوسط (Medium).

---

### [OPS-001] غياب خط أنابيب CI للاختبارات وفحوصات التكامل الآلية 🟡 متوسط (Medium)
- **الموقع:** `.github/workflows/release.yml`
- **المشكلة:**
  المستودع يحتوي فقط على workflow للتوزيع عند إطلاق Tag (`release.yml`)، ولا يوجد أي workflow مخصص للفحص الآلي (CI Pipeline) يعمل عند كل Commit أو Pull Request لتشغيل `npm run typecheck` و `npm run lint:boundaries` و `npm test`.
- **الأثر:**
  إمكانية دمج أكواد تكسر قواعد FSD أو تعطل الاختبارات الذهبية واختبارات الـ E2E دون أن يكتشفها نظام فحص مؤتمت قبل مرحلة الإصدار.
- **الحل المقترح:**
  إنشاء ملف `.github/workflows/ci.yml` يعمل عند كل Push و PR لتشغيل حزمة `npm run verify`.
- **الجهد:** صغير (Small).

---

### [CODE-001] الكائن المتضخم serverStore.ts وبقاء 35 مكوناً بانتظار ترحيل FSD 🟢 منخفض (Low)
- **الموقع:** `apps/web/src/lib/serverStore.ts` (4,243 سطراً) و `apps/web/src/components/` (35 ملفاً)
- **المشكلة:**
  ملف `serverStore.ts` يمثل "God Object" يجمع أكثر من 15 مسؤولية مختلفة، وبقاء 35 مكوّناً في مجلد `components/` القديم لم تكتمل إعادة هيكلتها إلى شرائح FSD المعزولة.
- **الأثر:**
  زيادة التعقيد الإدراكي وصعوبة الصيانة والاختبار المستقل لوحدات النظام.
- **الحل المقترح:**
  استكمال خطة ترحيل المكونات تدريجياً وتفتيت المهام المتبقية في `serverStore.ts` إلى خدمات متخصصة صغيرة.
- **الجهد:** كبير (Large).

---

## 📊 نطاق التغطية المثبتة (Inspection Scope)

- **الملفات والمجلدات التي تم فحصها فعلياً:**
  - معمارية FSD والحدود: `tools/lint_boundaries.js`، `apps/web/src/widgets/`، `apps/web/src/features/`، `apps/web/src/components/`.
  - المخططات ونماذج البيانات: `apps/server/prisma/schema.prisma`، `apps/web/prisma/schema.prisma`، `apps/web/src/lib/prisma.ts`.
  - إدارة الحالة ومخزن البيانات: `apps/web/src/lib/serverStore.ts`، `apps/web/src/lib/sqliteSync.ts`.
  - مسارات الخادم ومنطق الأعمال: `apps/server/src/routes/*.ts` (خاصة `results.ts`, `samples.ts`, `financials.ts`)، و `packages/domain/src/*`.
  - البنية التحتية وDevOps: `.github/workflows/*`، `package.json`، `apps/desktop/package.json`.
- **ما لم يتم فحصه والسبب:**
  - النسخ المولدة في مجلدات البناء `apps/desktop/dist/` لكونها مخرجات مجمعة وليست كوداً مصدرياً.