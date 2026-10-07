# Research & Best Practices — Reception Redesign
تاريخ التوثيق: 2026-10-07

## 1. الفحوصات ذات النماذج الخاصة (Specialized Clinical Modals)
تم فحص الكود الفعلي في شاشة النتائج (`apps/web/src/app/results/page.tsx`) والمكونات في `apps/web/src/components/`:

1. **G.U.E (General Urine Examination) / تحليل الإدرار العام**:
   - المسار: `apps/web/src/components/UrineFormModal.tsx`
   - المطابقة: `code === 'GUE'` أو يحتوي الاسم على `urine` أو `إدرار`.
   - التخصيصات:
     - خيارات كيميائية مقيدة (1+ -> +, 2+ -> ++, 3+ -> +++).
     - حقول Pus Cells و RBCs نصوص حرة تقبل كتابة يدوية وقيم مجمعة (مثل `10-12` أو `plenty`) مع استقرار مؤشر الكتابة (عدم فقدان التركيز).

2. **G.S.E (General Stool Examination) / تحليل الخروج العام**:
   - المسار: `apps/web/src/components/workstations/GseModal.tsx`
   - المطابقة: `code === 'GSE'` أو يحتوي الاسم على `stool` أو `خروج` أو `براز`.
   - التخصيصات:
     - حقول Pus و RBCs نصوص حرة مستقرة.
     - التأكد الصارم من عدم ظهور كلمة `dispar` في خيارات الطفيليات أو مقترحاتها أو نصوصها.

3. **SFA (Seminal Fluid Analysis) / تحليل السائل المنوي**:
   - المسار: `apps/web/src/components/workstations/SemenFormModal.tsx`
   - المطابقة: `code === 'SFA'` أو `code === 'SEMEN'` أو الاسم يحتوي على `semen` / `seminal` / `منوي`.

4. **CBC (Complete Blood Count) / صورة الدم الكاملة**:
   - المسار: `apps/web/src/components/workstations/CbcModal.tsx`
   - المطابقة: `code === 'CBC'` أو الاسم يحتوي على `cbc` / `blood count` / `صورة الدم`.

5. **Clinical Chemistry Workstation / محطة الكيمياء السريرية**:
   - المسار: `apps/web/src/components/workstations/ChemistryModal.tsx`
   - المطابقة: لوحات الكيمياء (`isChemistryPanel` أو `isChemistryAnalyte`).

6. **Microbiology & Culture / محطة الزرع والميكروبيولوجيا**:
   - المسار: `apps/web/src/components/workstations/MicrobiologyModal.tsx`
   - المطابقة: `category === 'MICROBIOLOGY'` أو الكود/الاسم يحتوي على `culture` / `مزرعة`.

---

## 2. ترتيب أهم الفحوصات في كل قسم (Most Important Tests First)
### آلية الترتيب المحلية (Offline Database Frequency)
- في البيئة التشغيلية: الاستعلام عن الفحوصات الأكثر طلباً في جدول `SampleTest` خلال آخر 90 يوماً محلياً عبر SQLite:
  `SELECT testId, COUNT(*) as freq FROM SampleTest JOIN Sample ON SampleTest.sampleId = Sample.id WHERE Sample.createdAt >= ? GROUP BY testId ORDER BY freq DESC`
- يتم استخدام النتائج كأوزان لفرز الكتالوج ضمن كل قسم/تخصص.

### القائمة الاحتياطية الثابتة لكل قسم (Fallback Top Tests)
مبنية على المعايير السريرية العالمية لمنظمة الصحة العالمية (WHO Model List of Essential In Vitro Diagnostics - EDL) والممارسة المخبرية الروتينية لطب المختبرات:
1. **Hematology (أمراض الدم)**:
   - CBC, ESR, PT/INR, PTT, Blood Group (ABO/Rh), Bleeding Time (BT), Clotting Time (CT), Reticulocytes.
2. **Clinical Chemistry (الكيمياء السريرية)**:
   - Fasting Blood Sugar (FBS / Glucose), HbA1c, Urea (BUN), Creatinine, Uric Acid, Lipid Profile (Cholesterol, Triglycerides, HDL, LDL), Liver Enzymes (ALT/SGPT, AST/SGOT, ALP, Total Bilirubin), Electrolytes (Na, K).
3. **Endocrinology & Hormones (الهرمونات)**:
   - TSH, Free T4 (FT4), Free T3 (FT3), Total PSA, Prolactin, Total Testosterone, LH, FSH, Beta-hCG.
4. **Immunology & Serology (المناعة والأمصال)**:
   - CRP (C-Reactive Protein), RF (Rheumatoid Factor), ASO, Widal Test, Rose Bengal (Brucella), HBsAg, HCV Ab, HIV 1/2, VDRL/RPR.
5. **Urinalysis & Stool (الإدرار والخروج)**:
   - GUE (General Urine Examination), GSE (General Stool Examination), Stool Occult Blood (FOBT), H. Pylori Stool Antigen.
6. **Vitamins, Minerals & Tumor Markers (الفيتامينات والمعادن ودلالات الأورام)**:
   - Vitamin D (25-OH), Vitamin B12, Serum Ferritin, Serum Iron, Total Calcium (Ca), CEA, CA-125, AFP.
