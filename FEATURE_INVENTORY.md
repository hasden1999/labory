# جرد ميزات النظام الشامل المحدّث (FEATURE_INVENTORY.md)
**نظام إدارة المختبرات الطبية والسريرية (Labryo LIMS) — الإصدار المعتمد v2.0.4**  
*آخر تحديث شامل: 2026-10-29*

تم تحديث هذا الجرد ليعكس بدقة 100% كافة القدرات السريرية والمعمارية والأمنية الحقيقية بعد إتمام مراحل التدقيق الأمني (Phase 0 و Phase 1) وتثبيت شجرة Git وحسم النزاهة المالية والمعمارية.

---

## 1. محطات العمل والشاشات السريرية (Workstations & Unified Console)

| # | المسار / الشاشة | الوصف والقدرات السريرية | المكونات الرئيسية | التبعيات | الحالة |
|---|---|---|---|---|:---:|
| 1 | `/` (الكونسول السريري الموحد) | All-in-One Workspace: استقبال سريع بالكيبورد، كارت مريض ذكي، سلة تحاليل، شبكة إدخال نتائج تفاعلية مدعومة بـ Panic Flags و Delta Check | `widgets/unified-workspace`, `useUnifiedWorkspace`, `tubeBadges` | `@lab/domain`, `@lab/data` | ✅ PASS |
| 2 | `/results` (استمارة الإدرار GUE) | فحص فيزيائي، كيميائي، مجهري كامل، مع الحفاظ على موضع المؤشر Caret Retention | `components/workstations/GseModal`, `forms` | `@lab/domain` | ✅ PASS |
| 3 | `/results` (استمارة الخروج GSE) | فحص عياني ومجهري للطفيليات والديدان والبكتيريا | `components/workstations/GseModal` | `@lab/domain` | ✅ PASS |
| 4 | `/results` (استمارة CBC) | صورة الدم الشاملة (18+ معيار) مع مقارنة القراءات السابقة وتنبيه المديات الحرجة | `components/workstations/CbcModal` | `@lab/domain` | ✅ PASS |
| 5 | `/results` (استمارات تخصصية) | استمارات سريرية متقدمة: السائل المنوي (Semen Analysis)، مزارع البكتيريا (Microbiology)، تتبع الحمل (Bhcg)، ومخزون المبيض (Amh) | `BhcgFormModal`, `MicrobiologyModal`, `ClinicalFormWorkstationModal` | `@lab/domain` | ✅ PASS |
| 6 | `/connect` (الربط الشبكي LAN) | بوابة اقتران الهواتف والأجهزة اللوحية عبر الشبكة المحلية (Wi-Fi) مع كود QR وبث حي SSE | `components/network/NetworkSettingsPanel`, `NetworkSyncProvider` | `lib/networkDeviceManager` | ✅ PASS |
| 7 | `/dashboard` | لوحة القيادة المركزية والإحصائيات الحية للعينات والتحاليل العاجلة والمالية | `modules/dashboard`, `core/data` | `@lab/core` | ✅ PASS |
| 8 | `/patients` | سجل المرضى الرقمي الشامل، البحث الذكي بالاسم والهاتف، التاريخ المرضي | `modules/patients` | `lib/serverStore` | ✅ PASS |
| 9 | `/samples` | استقبال العينات وإدارة الباركودات والمطابقة وحالات التحليل | `modules/samples` | `lib/serverStore` | ✅ PASS |
| 10 | `/catalog` | كتالوج الفحوصات الشامل (322 فحصاً نشطاً + 6 باقات تشخيصية كبرى) مع المديات العمرية | `modules/catalog` | `@lab/data` | ✅ PASS |
| 11 | `/devices` | تكامل أجهزة التحليل الطبية (ASTM/HL7)، مطابقة الأجهزة، وتصفية النتائج غير المعنونة | `modules/devices` | `lib/serverStore` | ✅ PASS |
| 12 | `/doctors` | شبكة الأطباء المحيلين، نسب العمولات، وتقارير الإحالة الدورية | `modules/doctors` | `lib/serverStore` | ✅ PASS |
| 13 | `/financials` | حركة الصناديق والورديات، سندات القبض والدفع، ودفتر اليومية | `modules/financials` | `lib/serverStore` | ✅ PASS |
| 14 | `/debts` | سجل الديون والذمم، تسديد الأرصدة مع فرض سقف السداد خادمياً (FIN-02) | `modules/debts` | `lib/serverStore` | ✅ PASS |
| 15 | `/expenses` | المصاريف التشغيلية وتصنيف بنود النفقات وتدقيق الصندوق | `modules/expenses` | `lib/serverStore` | ✅ PASS |
| 16 | `/inventory` | إدارة المخزون والكواشف الطبية وتتبع تواريخ الفتح واستقرار الكواشف (On-board Stability) | `apps/web/src/app/inventory` | `lib/serverStore` | ✅ PASS |
| 17 | `/settings` | إعدادات الهوية والترويسة ومصمم الورق الذكي (Paper Designer V2) والنسخ الاحتياطي | `PaperDesignerV2`, `LogoSettingsControl` | `lib/serverStore` | ✅ PASS |
| 18 | `/license` | إدارة الترخيص العتادي الموثق بنظام Ed25519 (LIC2-) مع ختم الحماية العتادي | `apps/web/src/app/license` | `lib/licensing` | ✅ PASS |
| 19 | `/verify/[id]` | بوابة التحقق الرقمي من صحة النتائج عبر رمز QR | `apps/web/src/app/verify` | `lib/serverStore` | ✅ PASS |

---

## 2. المنظومة الأمنية والمعمارية المعتمدة (Security & Architectural Matrix)

1. **المصادقة والجلسات:**
   * خادم Fastify محكم بنمط `fail-closed` يعيد `401` صراحة، وجلسات مسجلة في قاعدة البيانات `Session` مع ميزة الإبطال التلقائي.
   * مسارات Next.js محمية عبر `middleware.ts` وتدقيق توكن الأجهزة الصارم.
2. **الترخيص غير المتماثل (Ed25519):**
   * استخدام تراخيص `LIC2-` الموقعة رقمياً بمفتاح خاص خارج المستودع (`scripts/license-keygen.mjs`)، والتحقق عبر المفتاح العام المدمج فقط.
   * ربط التراخيص والتجارب بختم عتادي موثق (`.hwid_seal.json`).
3. **النزاهة السريرية والمالية (Zero-Trust):**
   * استئصال فولباك العينات (`SEC-06`)؛ النتائج غير المعنونة ترفض بـ `UNMATCHED_SAMPLE`.
   * احتساب الأسعار والخصومات والمتبقي خادمياً من كتالوج الفحوصات حصراً (`FIN-01`).
   * ضبط سقف سداد الديون بـ `min(paid, remaining)` وتوحيد عداد الوصولات (`FIN-02`).
4. **حماية بيانات المرضى (PHI Hygiene):**
   * خلو شجرة المستودع ونقطة الـ HEAD تماماً من ملفات المرضى الحقيقية واستبعادها عبر `.gitignore`.
5. **المعمارية ونظافة الاعتماديات:**
   * الالتزام الصارم بـ FSD: 259 ملفاً باختبار حدود بنسبة 0 انتهاك (`lint:boundaries`).
   * إزالة كافة المسارات الثابتة (`D:\lab`) وجعل النظام قابلاً للنقل بنسبة 100%.

---

## 3. حزم الفحص والتحقق المؤتمتة (Automated Verification Gates)

* `npm run typecheck` — فحص TypeScript لجميع الحزم والواجهات (0 أخطاء).
* `npm run lint:boundaries` — فحص معمارية FSD (259 ملفاً بنجاح تام).
* `npm run test:golden` — حزمة الاختبارات الذهبية الشاملة (6/6 نجاح تام).
* `npx tsx tests/security/*` — حزم الاختبارات الأمنية للطورين 0 و 1 (23/23 نجاح تام).
* `npx tsx tests/integration/*` — اختبارات التدفق المالي والأجهزة والواتساب (نجاح 100%).
