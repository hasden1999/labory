# AGENT BRIEF: SPECIALTY-DATA (Agent A)

## الهدف (Goal)
بذر الهيكلية التخصصية (`Specialties & TestGroups`)، ومطابقة الفحوصات الحالية بالكتالوج، وتوفير شاشة إدارة الاختصاصات ومحدد الاختصاص والمجموعة في محرر الفحوصات.

## الهيكلية الأولية للبذر (Seed Hierarchy)
1. **Biochemistry (الكيمياء الحيوية)**:
   - Diabetes profile: HbA1c, RBS, FBS, OGTT
   - Renal function test (RFT): Blood urea, Serum creatinine, Serum uric acid, eGFR, Albumin/creatinine ratio
   - Liver function test (LFT): ALT/GPT, AST/GOT, Alkaline phosphatase (ALP), Total bilirubin, GGT, Total protein, Albumin
   - Lipid profile: Total cholesterol, Serum triglycerides, HDL, LDL, VLDL
2. **Hematology (أمراض الدم)** (بدون مجموعة فرعية):
   - Hb, HCT (PCV), ESR, WBC
3. **Tumor markers (دلالات الأورام)** (بدون مجموعة فرعية):
   - PSA, AFP, CEA

## القواعد الصارمة (Strict Rules)
- المطابقة التلقائية فقط للمطابقات المؤكدة بالاسم والكود والبدائل (مثال: PCV = HCT, GOT = AST, GPT = ALT).
- عدم إنشاء أي فحص مفقود في الكتالوج.
- كتابة تقرير المطابقة `SPECIALTY_MATCH_REPORT.md` (المطابقة، الملتبسة، المذكورة في الورقة وغير موجودة، وفحوصات الكتالوج خارج القائمة).
- شاشة إدارة كاملة للاختصاصات والمجموعات (إضافة، تعديل، حذف، ترتيب).
- محرر الفحص في الكتالوج: حقل اختياري للاختصاص، ينسدل منه حقل المجموعة إذا وجدت مجموعات.

## الملفات المملوكة (Owned Files)
- `apps/web/src/app/api/specialties/route.ts`
- `apps/web/src/components/specialties/*`
- `apps/web/src/app/catalog/page.tsx` (تعديل محصور في محدد الاختصاص وزر الإدارة)
- `SPECIALTY_MATCH_REPORT.md`

## الملفات المحظورة (Forbidden Files)
- قوالب الطباعة (`PrintHeader.ts`, `PrintBody.ts`, `route.ts`).
- شاشات إدخال النتائج واستقبال العينات.
- إعدادات الشعار.
