# تقرير مطابقة الفحوصات للاختصاصات السريرية (SPECIALTY MATCH REPORT)

تم إعداد هذا التقرير تلقائياً استناداً إلى ورقة المالك اليدوية ومطابقتها مع كتالوج الفحوصات الحالي في النظام دون إنشاء أو حذف أو تعديل أي أسعار أو مديات مرجعية.

---

## 1. الفحوصات المطابقة بثقة وتم ربطها تلقائياً (Confident Matched - 25 Tests)

### أ. الكيمياء الحيوية (Biochemistry)
#### 1. باقة السكري (Diabetes profile)
1. **HbA1c** ⬅️ `Glycated Hemoglobin (HbA1c)` (الكود: `HBA1C` - الترتيب: 1)
2. **RBS** ⬅️ `Random Blood Sugar (RBS)` (الكود: `RBS` - الترتيب: 2)
3. **FBS** ⬅️ `Fasting Blood Sugar (FBS)` (الكود: `FBS` - الترتيب: 3)
4. **OGTT** ⬅️ `Oral Glucose Tolerance Test (2hr)` (الكود: `OGTT` - الترتيب: 4)

#### 2. وظائف الكلى (Renal function test - RFT)
1. **Serum creatinine** ⬅️ `Serum Creatinine` (الكود: `CREAT` - الترتيب: 1)
2. **Serum uric acid** ⬅️ `Serum Uric Acid` (الكود: `URIC` - الترتيب: 2)
3. **eGFR** ⬅️ `Estimated GFR (eGFR)` (الكود: `EGFR` - الترتيب: 3)

#### 3. وظائف الكبد (Liver function test - LFT)
1. **ALT/GPT** ⬅️ `SGPT / ALT (Alanine Aminotransferase)` (الكود: `GPT` - الترتيب: 1)
2. **AST/GOT** ⬅️ `SGOT / AST (Aspartate Aminotransferase)` (الكود: `GOT` - الترتيب: 2)
3. **Alkaline phosphatase (ALP)** ⬅️ `Alkaline Phosphatase (ALP)` (الكود: `ALP` - الترتيب: 3)
4. **Total bilirubin** ⬅️ `Total Bilirubin (TSB)` (الكود: `TSB` - الترتيب: 4)
5. **GGT** ⬅️ `Gamma GT (GGT)` (الكود: `GGT` - الترتيب: 5)
6. **Total protein** ⬅️ `Total Serum Protein` (الكود: `TP` - الترتيب: 6)
7. **Albumin** ⬅️ `Serum Albumin` (الكود: `ALB` - الترتيب: 7)

#### 4. دهون الدم (Lipid profile)
1. **Total cholesterol** ⬅️ `Total Cholesterol` (الكود: `CHOL` - الترتيب: 1)
2. **Serum triglycerides** ⬅️ `Triglycerides (TG)` (الكود: `TG` - الترتيب: 2)
3. **HDL** ⬅️ `HDL Cholesterol (Good)` (الكود: `HDL` - الترتيب: 3)
4. **LDL** ⬅️ `LDL Cholesterol (Bad)` (الكود: `LDL` - الترتيب: 4)
5. **VLDL** ⬅️ `VLDL Cholesterol` (الكود: `VLDL` - الترتيب: 5)

---

### ب. أمراض الدم (Hematology - بدون مجموعة فرعية)
1. **Hb** ⬅️ `Hemoglobin (Hb)` (الكود: `HB` - الترتيب: 1)
2. **HCT** ⬅️ `Hematocrit (PCV)` (الكود: `HCT` - الترتيب: 2) *(تمت مطابقة بديل PC = HCT)*
3. **ESR** ⬅️ `Erythrocyte Sedimentation Rate (ESR)` (الكود: `ESR` - الترتيب: 3)
4. **WBC** ⬅️ `White Blood Cells` (الكود: `WBC` - الترتيب: 4)

---

### ج. دلالات الأورام (Tumor markers - بدون مجموعة فرعية)
1. **AFP** ⬅️ `Alpha-Fetoprotein (AFP)` (الكود: `AFP` - الترتيب: 1)
2. **CEA** ⬅️ `Carcinoembryonic Antigen (CEA)` (الكود: `CEA` - الترتيب: 2)

---

## 2. الحالات الملتبسة المتروكة لقرار المالك (Ambiguous - For Owner Decision)

1. **Blood urea (ضمن وظائف الكلى)**:
   - يتوفر في الكتالوج فحصان:
     - `t-urea`: `Blood Urea` (الكود: `UREA`)
     - `t-bun`: `Blood Urea Nitrogen (BUN)` (الكود: `BUN`)
   - *الإجراء المتخذ:* لم يتم الربط التلقائي منعاً للازدواجية، وبانتظار تحديد هل يتم تعيين `Blood Urea` أو كلاهما.

2. **PSA (ضمن دلالات الأورام)**:
   - يتوفر في الكتالوج 3 فحوصات:
     - `t-psa`: `Total PSA (Prostate Specific Antigen)` (الكود: `PSA-TOT`)
     - `t-psa-free`: `Free PSA` (الكود: `PSA-FREE`)
     - `t-fpsa`: `Free PSA (Prostate Specific Antigen Free)` (الكود: `FPSA`)
   - *الإجراء المتخذ:* لم يتم الربط التلقائي، وبانتظار اعتماد تعيين Total PSA أو البقية.

---

## 3. فحوصات مذكورة في ورقة المالك لكنها غير موجودة بالكتالوج (Listed but Missing)

1. **Albumin/creatinine ratio (ضمن وظائف الكلى RFT)**:
   - غير موجود كفحص مفرد في الكتالوج حالياً.
   - *الإجراء المتخذ وفق التعليمات:* **لم يتم إنشاء أي فحص مفقود** حفاظاً على ثبات قاعدة البيانات وتجنب أي أسعار أو وحدات غير معتمدة. يمكن للمشرف إضافته لاحقاً متى شاء عبر شاشة الكتالوج.

---

## 4. فحوصات الكتالوج خارج قائمة البذر (Catalog Tests Not in Seed Hierarchy)

يحتوي الكتالوج على **120 فحصاً مخبرياً آخر** (مثل الهرمونات، المناعة والأمصال، المعادن، الفيتامينات، الفحص المجهري العام للبول والبراز، وغيرها).
- تم إبقاؤها جميعاً بـ `specialtyId: null` و `groupId: null`.
- في نمط عرض الاختصاصات الجديد، ستظهر تلقائياً ومنظّمة في قسم **فحوصات أخرى (Other Tests)** في نهاية القائمة والتقرير، أو يمكن تصنيفها في أي اختصاص عبر شاشة الإدارة في أي وقت.
