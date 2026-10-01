# تدقيق ومطابقة الأسماء الإنجليزية للفحوصات المخبرية (Missing English Names Audit)

تم إجراء تدقيق سريري وتقني شامل لكافة فحوصات الكتالوج المخبري (`TestCatalog`) للتأكد من خلو التقارير المطبوعة من أي نصوص عربية غير مصرح بها.

---

## 1. نتائج فحص كتالوج الفحوصات (Catalog Audit Summary)

- **إجمالي الفحوصات في الكتالوج:** 145 فحصاً.
- **الفحوصات التي تفتقر إلى اسم إنجليزي (`name`):** **0** (صفر).
- **الفحوصات التي تحتوي على حروف عربية في الاسم الإنجليزي:** **0** (صفر).
- **الخلاصة:** جميع الفحوصات الـ 145 في قاعدة البيانات تمتلك أسماء علمية إنجليزية دقيقة ومعتمدة دولياً.

---

## 2. آلية الحماية والاحتياط (Fallback Mechanism)

وفقاً للتوجيهات الصارمة، تم تطبيق الآلية التالية في محرك الطباعة (`apps/web/src/app/api/samples/[id]/print/route.ts`):
1. يتم اعتماد حقل الاسم الإنجليزي `test.name` كأولوية أولى.
2. في حال تم مستقبلاً إنشاء فحص جديد بدون اسم إنجليزي أو كان فارغاً، يتم استخدام **رمز الفحص / الاختصار** (`test.code` / abbreviation) كخيار احتياطي (`Fallback`).
3. **يُمنع منعاً باتاً** استخدام الاسم العربي `test.arabicName` كـ Fallback في التقرير الطبي المطبوع تحت أي ظرف.

---

## 3. ترجمات التصنيفات والأقسام المخبرية (Categories Mapping)

تم تضمين قاموس سريري لترجمة تصنيفات الفحوصات تلقائياً إلى الإنجليزية عند توليد التقرير المطبوع:

| التصنيف في النظام العربي | الاسم المعتمد في التقرير المطبوع (English) |
| :--- | :--- |
| وظائف الكبد والمرارة | `Liver Function Tests (LFT)` |
| أمراض الدم والتخثر | `Hematology & Coagulation` |
| الكيمياء السريرية والسكري | `Clinical Chemistry & Diabetes` |
| وظائف الكلى والأملاح | `Kidney Function & Electrolytes` |
| دهون الدم وصحة القلب | `Lipid Profile & Cardiac Markers` |
| الغدة الدرقية والهرمونات | `Thyroid & Hormones` |
| المعادن والفيتامينات | `Minerals & Vitamins` |
| المناعة والأمصال | `Immunology & Serology` |
| الفحص المجهري العام | `General Microscopy` |
| دلالات الأورام | `Tumor Markers` |
| أمراض المناعة الذاتية والروماتيزم | `Autoimmune & Rheumatology` |
| السموم والمخدرات | `Toxicology & Drug Screening` |
| تحاليل عامة / عام | `General Laboratory Tests` |

---

## 4. ترجمات أنواع العينات (Specimen / Sample Types)

| نوع العينة في النظام العربي | التسمية المعتمدة في التقرير (English) |
| :--- | :--- |
| مصل الدم (Serum) / Serum | `Serum` |
| دم كامل (EDTA) | `Whole Blood (EDTA)` |
| دم كامل (Citrate) | `Whole Blood (Citrate)` |
| بلازما (Sodium Citrate) | `Plasma (Sodium Citrate)` |
| بلازما | `Plasma` |
| إدرار عشوائي | `Random Urine` |
| إدرار صباحي | `Morning Urine` |
| إدرار 24 ساعة | `24-Hour Urine` |
| عينة خروج | `Stool Sample` |
| سائل منوي (Semen) | `Seminal Fluid` |
| دم شعيري (Capillary) | `Capillary Blood` |
| دم كامل (أنابيب زجاجية) | `Whole Blood (Glass Tubes)` |
| بلازما (EDTA مفصولة فوراً) | `Plasma (EDTA Immediate)` |
| بلازما (EDTA مبردة) | `Chilled Plasma (EDTA)` |
| مسحة | `Swab` |
| محسوب | `Calculated` |

---

## 5. ترجمات النتائج الوصفية والنوعية (Qualitative Results Mapping)

| النتيجة المدخلة بالعربية | النتيجة المطبوعة بالإنجليزية |
| :--- | :--- |
| موجب / إيجابي | `Positive` |
| سلبي / سالب | `Negative` |
| طبيعي | `Normal` |
| غير طبيعي | `Abnormal` |
| أثر / اثر | `Trace` |
| نادر | `Rare` |
| قليل | `Few` |
| معتدل / متوسط | `Moderate` |
| كثير / عديد | `Many` |
| صافي | `Clear` |
| عكر | `Turbid` |
| عكر خفيف | `Slightly Turbid` |
| أصفر / اصفر | `Yellow` |
| أصفر شاحب | `Pale Yellow` |
| أحمر / دموي | `Red / Bloody` |
| بني | `Brown` |
| متماسك | `Formed` |
| شبه متماسك | `Semi-formed` |
| طري / لين | `Soft` |
| مائي / إسهال | `Watery` |
| مخاطي | `Mucoid` |
