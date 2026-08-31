export interface TestItem {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  category: string;
  price: number;
  costEstimate?: number;
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  normalMaleLow?: number | null;
  normalMaleHigh?: number | null;
  normalFemaleLow?: number | null;
  normalFemaleHigh?: number | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  refRangeText?: string;
  unit?: string;
  sampleType?: string;
}

export interface PanelItem {
  id: string;
  name: string;
  description: string;
  price: number;
  testCodes: string[];
  items?: { test: TestItem }[];
}

export const INITIAL_TESTS_CATALOG: TestItem[] = [
  // 1. Hematology
  { id: 't-cbc', code: 'CBC', name: 'Complete Blood Count (CBC)', arabicName: 'صورة الدم الكاملة', category: 'أمراض الدم والتخثر', price: 15000, costEstimate: 2500, refRangeLow: 12.0, refRangeHigh: 16.0, normalMaleLow: 13.5, normalMaleHigh: 17.5, normalFemaleLow: 12.0, normalFemaleHigh: 15.5, criticalLow: 7.0, criticalHigh: 20.0, refRangeText: '12.0 - 16.0', unit: 'g/dL', sampleType: 'دم كامل (EDTA)' },
  { id: 't-hb', code: 'HB', name: 'Hemoglobin (Hb)', arabicName: 'خضاب الدم (الهيموغلوبين)', category: 'أمراض الدم والتخثر', price: 5000, costEstimate: 800, refRangeLow: 12.0, refRangeHigh: 16.5, normalMaleLow: 13.5, normalMaleHigh: 17.5, normalFemaleLow: 12.0, normalFemaleHigh: 15.5, criticalLow: 7.0, criticalHigh: 20.0, refRangeText: '12.0 - 16.5', unit: 'g/dL', sampleType: 'دم كامل (EDTA)' },
  { id: 't-esr', code: 'ESR', name: 'Erythrocyte Sedimentation Rate (ESR)', arabicName: 'سرعة ترسب كريات الدم الحمر', category: 'أمراض الدم والتخثر', price: 5000, costEstimate: 600, refRangeLow: 0, refRangeHigh: 20, normalMaleLow: 0, normalMaleHigh: 15, normalFemaleLow: 0, normalFemaleHigh: 20, criticalHigh: 100, refRangeText: '0 - 20', unit: 'mm/1st hr', sampleType: 'دم كامل (Citrate)' },
  { id: 't-bg', code: 'BG', name: 'Blood Group & Rh Factor', arabicName: 'فصيلة الدم والعامل الريسي', category: 'أمراض الدم والتخثر', price: 5000, costEstimate: 800, refRangeText: 'A / B / AB / O (Pos/Neg)', unit: '', sampleType: 'دم كامل (EDTA)' },
  { id: 't-plt', code: 'PLT', name: 'Platelets Count', arabicName: 'تعداد الصفائح الدموية', category: 'أمراض الدم والتخثر', price: 6000, costEstimate: 1000, refRangeLow: 150000, refRangeHigh: 450000, criticalLow: 30000, criticalHigh: 1000000, refRangeText: '150,000 - 450,000', unit: '/uL', sampleType: 'دم كامل (EDTA)' },
  { id: 't-pt', code: 'PT-INR', name: 'Prothrombin Time (PT / INR)', arabicName: 'زمن البروثرومبين ومعدل التخثر الدولي', category: 'أمراض الدم والتخثر', price: 15000, costEstimate: 3000, refRangeLow: 0.9, refRangeHigh: 1.2, criticalHigh: 4.5, refRangeText: '0.9 - 1.2', unit: 'Ratio', sampleType: 'بلازما (Sodium Citrate)' },
  { id: 't-ptt', code: 'PTT', name: 'Partial Thromboplastin Time (PTT/APTT)', arabicName: 'زمن الترومبوبلاستين الجزئي', category: 'أمراض الدم والتخثر', price: 15000, costEstimate: 3000, refRangeLow: 25, refRangeHigh: 38, criticalHigh: 80, refRangeText: '25 - 38', unit: 'sec', sampleType: 'بلازما (Sodium Citrate)' },
  { id: 't-ddimer', code: 'DDIMER', name: 'D-Dimer (Quantitative)', arabicName: 'فحص دي دايمر للتخثر والجلطات', category: 'أمراض الدم والتخثر', price: 25000, costEstimate: 6000, refRangeLow: 0, refRangeHigh: 0.5, criticalHigh: 5.0, refRangeText: '< 0.5', unit: 'ug/mL', sampleType: 'بلازما' },
  { id: 't-fer', code: 'FER', name: 'Serum Ferritin', arabicName: 'مخزون الحديد (الفيريتين)', category: 'أمراض الدم والتخثر', price: 18000, costEstimate: 3500, refRangeLow: 15, refRangeHigh: 200, normalMaleLow: 30, normalMaleHigh: 400, normalFemaleLow: 15, normalFemaleHigh: 150, criticalLow: 5, refRangeText: '15 - 200', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-iron', code: 'IRON', name: 'Serum Iron', arabicName: 'الحديد في مصل الدم', category: 'أمراض الدم والتخثر', price: 10000, costEstimate: 1800, refRangeLow: 50, refRangeHigh: 170, normalMaleLow: 65, normalMaleHigh: 175, normalFemaleLow: 50, normalFemaleHigh: 170, refRangeText: '50 - 170', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-tibc', code: 'TIBC', name: 'Total Iron Binding Capacity (TIBC)', arabicName: 'السعة الكلية الرابطة للحديد', category: 'أمراض الدم والتخثر', price: 12000, costEstimate: 2000, refRangeLow: 250, refRangeHigh: 450, refRangeText: '250 - 450', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },

  // 2. Clinical Chemistry & Diabetes
  { id: 't-fbs', code: 'FBS', name: 'Fasting Blood Sugar (FBS)', arabicName: 'سكر الدم الصائم', category: 'الكيمياء السريرية والسكري', price: 5000, costEstimate: 800, refRangeLow: 70, refRangeHigh: 100, criticalLow: 45, criticalHigh: 400, refRangeText: '70 - 100 (Normal)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-rbs', code: 'RBS', name: 'Random Blood Sugar (RBS)', arabicName: 'سكر الدم العشوائي', category: 'الكيمياء السريرية والسكري', price: 5000, costEstimate: 800, refRangeLow: 70, refRangeHigh: 140, criticalLow: 45, criticalHigh: 450, refRangeText: '70 - 140', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-hba1c', code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', arabicName: 'السكر التراكمي', category: 'الكيمياء السريرية والسكري', price: 15000, costEstimate: 3500, refRangeLow: 4.0, refRangeHigh: 5.6, criticalHigh: 12.0, refRangeText: '4.0 - 5.6 % (Non-diabetic)', unit: '%', sampleType: 'دم كامل (EDTA)' },
  { id: 't-ogtt', code: 'OGTT', name: 'Oral Glucose Tolerance Test (2hr)', arabicName: 'اختبار تحمل السكر الفموي', category: 'الكيمياء السريرية والسكري', price: 15000, costEstimate: 2500, refRangeLow: 70, refRangeHigh: 140, refRangeText: '< 140', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-insulin', code: 'INSULIN', name: 'Fasting Insulin', arabicName: 'هرمون الأنسولين الصائم', category: 'الكيمياء السريرية والسكري', price: 25000, costEstimate: 5000, refRangeLow: 2.6, refRangeHigh: 24.9, refRangeText: '2.6 - 24.9', unit: 'uIU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-cpep', code: 'CPEPTIDE', name: 'C-Peptide Fasting', arabicName: 'فحص سي ببتيد لكفاءة البنكرياس', category: 'الكيمياء السريرية والسكري', price: 25000, costEstimate: 5000, refRangeLow: 0.8, refRangeHigh: 3.8, refRangeText: '0.8 - 3.8', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },

  // 3. Renal & Electrolytes
  { id: 't-creat', code: 'CREAT', name: 'Serum Creatinine', arabicName: 'الكرياتينين في مصل الدم', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 0.6, refRangeHigh: 1.2, normalMaleLow: 0.7, normalMaleHigh: 1.3, normalFemaleLow: 0.5, normalFemaleHigh: 1.1, criticalHigh: 5.0, refRangeText: '0.6 - 1.2', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-urea', code: 'UREA', name: 'Blood Urea', arabicName: 'اليوريا في الدم', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 15, refRangeHigh: 45, criticalHigh: 120, refRangeText: '15 - 45', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-bun', code: 'BUN', name: 'Blood Urea Nitrogen (BUN)', arabicName: 'نتروجين يوريا الدم', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 7, refRangeHigh: 20, refRangeText: '7 - 20', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-uric', code: 'URIC', name: 'Serum Uric Acid', arabicName: 'حمض اليوريك (داء النقرس)', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 3.5, refRangeHigh: 7.2, normalMaleLow: 3.5, normalMaleHigh: 7.2, normalFemaleLow: 2.6, normalFemaleHigh: 6.0, refRangeText: '3.5 - 7.2', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-na', code: 'NA', name: 'Serum Sodium (Na+)', arabicName: 'الصوديوم في الدم', category: 'وظائف الكلى والأملاح', price: 8000, costEstimate: 1500, refRangeLow: 135, refRangeHigh: 145, criticalLow: 120, criticalHigh: 160, refRangeText: '135 - 145', unit: 'mmol/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-k', code: 'K', name: 'Serum Potassium (K+)', arabicName: 'البوتاسيوم في الدم', category: 'وظائف الكلى والأملاح', price: 8000, costEstimate: 1500, refRangeLow: 3.5, refRangeHigh: 5.1, criticalLow: 2.8, criticalHigh: 6.2, refRangeText: '3.5 - 5.1', unit: 'mmol/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-cl', code: 'CL', name: 'Serum Chloride (Cl-)', arabicName: 'الكلوريد في الدم', category: 'وظائف الكلى والأملاح', price: 8000, costEstimate: 1500, refRangeLow: 98, refRangeHigh: 107, refRangeText: '98 - 107', unit: 'mmol/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-malb', code: 'MALB', name: 'Microalbumin in Urine', arabicName: 'الزلال الدقيق في الإدرار', category: 'وظائف الكلى والأملاح', price: 15000, costEstimate: 3000, refRangeLow: 0, refRangeHigh: 30, refRangeText: '< 30', unit: 'mg/L', sampleType: 'إدرار عشوائي' },

  // 4. Liver Function
  { id: 't-got', code: 'GOT', name: 'SGOT / AST (Aspartate Aminotransferase)', arabicName: 'إنزيم الكبد والقلب (AST/GOT)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 5, refRangeHigh: 40, normalMaleLow: 5, normalMaleHigh: 40, normalFemaleLow: 5, normalFemaleHigh: 32, criticalHigh: 250, refRangeText: '5 - 40', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-gpt', code: 'GPT', name: 'SGPT / ALT (Alanine Aminotransferase)', arabicName: 'إنزيم الكبد المتخصص (ALT/GPT)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 5, refRangeHigh: 45, normalMaleLow: 5, normalMaleHigh: 45, normalFemaleLow: 5, normalFemaleHigh: 34, criticalHigh: 250, refRangeText: '5 - 45', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-alp', code: 'ALP', name: 'Alkaline Phosphatase (ALP)', arabicName: 'إنزيم الفوسفاتاز القلوي', category: 'وظائف الكبد والمرارة', price: 8000, costEstimate: 1400, refRangeLow: 40, refRangeHigh: 130, refRangeText: '40 - 130', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-tsb', code: 'TSB', name: 'Total Bilirubin (TSB)', arabicName: 'البيليروبين الكلي (اليرقان / أبو صفار)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 0.2, refRangeHigh: 1.2, criticalHigh: 15.0, refRangeText: '0.2 - 1.2', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-dirbil', code: 'DIR-BIL', name: 'Direct Bilirubin', arabicName: 'البيليروبين المباشر (المقترن)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 0.0, refRangeHigh: 0.3, refRangeText: '0.0 - 0.3', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-tp', code: 'TP', name: 'Total Serum Protein', arabicName: 'البروتين الكلي في مصل الدم', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 6.4, refRangeHigh: 8.3, refRangeText: '6.4 - 8.3', unit: 'g/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-alb', code: 'ALB', name: 'Serum Albumin', arabicName: 'الألبومين في مصل الدم', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 3.5, refRangeHigh: 5.0, refRangeText: '3.5 - 5.0', unit: 'g/dL', sampleType: 'مصل الدم (Serum)' },

  // 5. Lipid & Cardiac
  { id: 't-chol', code: 'CHOL', name: 'Total Cholesterol', arabicName: 'الكوليسترول الكلي', category: 'دهون الدم وصحة القلب', price: 7000, costEstimate: 1200, refRangeLow: 120, refRangeHigh: 200, criticalHigh: 300, refRangeText: '< 200 (Desirable)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-tg', code: 'TG', name: 'Triglycerides (TG)', arabicName: 'الدهون الثلاثية', category: 'دهون الدم وصحة القلب', price: 7000, costEstimate: 1200, refRangeLow: 50, refRangeHigh: 150, criticalHigh: 500, refRangeText: '< 150 (Normal)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-hdl', code: 'HDL', name: 'HDL Cholesterol (Good)', arabicName: 'الكوليسترول عالي الكثافة (النافع)', category: 'دهون الدم وصحة القلب', price: 8000, costEstimate: 1500, refRangeLow: 40, refRangeHigh: 65, normalMaleLow: 40, normalMaleHigh: 60, normalFemaleLow: 50, normalFemaleHigh: 65, refRangeText: '> 40 (Male) / > 50 (Female)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-ldl', code: 'LDL', name: 'LDL Cholesterol (Bad)', arabicName: 'الكوليسترول منخفض الكثافة (الضار)', category: 'دهون الدم وصحة القلب', price: 8000, costEstimate: 1500, refRangeLow: 0, refRangeHigh: 100, criticalHigh: 190, refRangeText: '< 100 (Optimal)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-vldl', code: 'VLDL', name: 'VLDL Cholesterol', arabicName: 'الكوليسترول شديد انخفاض الكثافة', category: 'دهون الدم وصحة القلب', price: 5000, costEstimate: 0, refRangeLow: 5, refRangeHigh: 30, refRangeText: '5 - 30', unit: 'mg/dL', sampleType: 'محسوب' },
  { id: 't-trop', code: 'TROP-I', name: 'Troponin I (High Sensitive)', arabicName: 'إنزيم تروبونين القلبي السريع للجلطة', category: 'دهون الدم وصحة القلب', price: 30000, costEstimate: 8000, refRangeLow: 0, refRangeHigh: 0.04, criticalHigh: 0.1, refRangeText: '< 0.04 (Negative)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },

  // 6. Thyroid & Hormones
  { id: 't-tsh', code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', arabicName: 'هرمون الغدة الدرقية المحفز (TSH)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 0.4, refRangeHigh: 4.2, criticalLow: 0.05, criticalHigh: 15.0, refRangeText: '0.4 - 4.2', unit: 'uIU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-ft4', code: 'FT4', name: 'Free Thyroxine (Free T4)', arabicName: 'هرمون الثايروكسين الحر (FT4)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 0.8, refRangeHigh: 1.8, refRangeText: '0.8 - 1.8', unit: 'ng/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-ft3', code: 'FT3', name: 'Free Triiodothyronine (Free T3)', arabicName: 'هرمون ثلاثي اليود الثايرونين الحر (FT3)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 2.0, refRangeHigh: 4.4, refRangeText: '2.0 - 4.4', unit: 'pg/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-prl', code: 'PRL', name: 'Prolactin (Milk Hormone)', arabicName: 'هرمون الحليب (البرولاكتين)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 3.0, refRangeHigh: 25.0, normalMaleLow: 3.0, normalMaleHigh: 15.0, normalFemaleLow: 4.0, normalFemaleHigh: 25.0, criticalHigh: 100, refRangeText: '4.0 - 25.0 (Female)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-fsh', code: 'FSH', name: 'Follicle Stimulating Hormone (FSH)', arabicName: 'الهرمون المنبه للجريب (FSH)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 1.5, refRangeHigh: 12.4, refRangeText: '1.5 - 12.4', unit: 'mIU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-lh', code: 'LH', name: 'Luteinizing Hormone (LH)', arabicName: 'الهرمون الملوتن (LH)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 1.7, refRangeHigh: 12.6, refRangeText: '1.7 - 12.6', unit: 'mIU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-testo', code: 'TESTO', name: 'Total Testosterone', arabicName: 'هرمون الذكورة الكلي (التستوستيرون)', category: 'الغدة الدرقية والهرمونات', price: 25000, costEstimate: 5000, refRangeLow: 2.8, refRangeHigh: 8.0, normalMaleLow: 2.8, normalMaleHigh: 8.0, normalFemaleLow: 0.1, normalFemaleHigh: 0.8, refRangeText: '2.8 - 8.0 (Male)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-bhcg', code: 'BHCG', name: 'Beta-hCG (Quantitative Pregnancy)', arabicName: 'هرمون الحمل الرقمي التراكمي', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 0, refRangeHigh: 5, refRangeText: '< 5 (Non-pregnant)', unit: 'mIU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-amh', code: 'AMH', name: 'Anti-Mullerian Hormone (AMH)', arabicName: 'هرمون مخزون المبيض (AMH)', category: 'الغدة الدرقية والهرمونات', price: 45000, costEstimate: 12000, refRangeLow: 1.0, refRangeHigh: 3.5, refRangeText: '1.0 - 3.5', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },

  // 7. Vitamins & Minerals
  { id: 't-vitd', code: 'VITD', name: 'Vitamin D3 (25-OH Total)', arabicName: 'فيتامين د3 الكلي (فحص المناعة والعظام)', category: 'المعادن والفيتامينات', price: 25000, costEstimate: 5500, refRangeLow: 30, refRangeHigh: 100, criticalLow: 10, refRangeText: '30 - 100 (Sufficiency)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-vitb12', code: 'VITB12', name: 'Vitamin B12 (Cobalamin)', arabicName: 'فيتامين ب12 (فيتامين الأعصاب)', category: 'المعادن والفيتامينات', price: 25000, costEstimate: 5000, refRangeLow: 200, refRangeHigh: 900, criticalLow: 100, refRangeText: '200 - 900', unit: 'pg/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-calc', code: 'CALC', name: 'Total Serum Calcium', arabicName: 'الكالسيوم الكلي في الدم', category: 'المعادن والفيتامينات', price: 8000, costEstimate: 1400, refRangeLow: 8.5, refRangeHigh: 10.5, criticalLow: 6.5, criticalHigh: 13.0, refRangeText: '8.5 - 10.5', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-phos', code: 'PHOS', name: 'Serum Phosphorus / Phosphate', arabicName: 'الفوسفور غير العضوي في الدم', category: 'المعادن والفيتامينات', price: 8000, costEstimate: 1400, refRangeLow: 2.5, refRangeHigh: 4.5, refRangeText: '2.5 - 4.5', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-mg', code: 'MG', name: 'Serum Magnesium', arabicName: 'المغنيسيوم في الدم', category: 'المعادن والفيتامينات', price: 8000, costEstimate: 1400, refRangeLow: 1.7, refRangeHigh: 2.4, refRangeText: '1.7 - 2.4', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-zinc', code: 'ZINC', name: 'Serum Zinc', arabicName: 'الزنك في الدم', category: 'المعادن والفيتامينات', price: 20000, costEstimate: 4000, refRangeLow: 70, refRangeHigh: 120, refRangeText: '70 - 120', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },

  // 8. Immunology & Serology
  { id: 't-crp', code: 'CRP', name: 'C-Reactive Protein (CRP Quantitative)', arabicName: 'بروتين سي التفاعلي الكمي (الالتهاب)', category: 'المناعة والأمصال', price: 12000, costEstimate: 2200, refRangeLow: 0, refRangeHigh: 6.0, criticalHigh: 50.0, refRangeText: '< 6.0 (Normal)', unit: 'mg/L', sampleType: 'مصل الدم (Serum)' },
  { id: 't-rf', code: 'RF', name: 'Rheumatoid Factor (RF)', arabicName: 'عامل الروماتويد (الروماتيزم)', category: 'المناعة والأمصال', price: 10000, costEstimate: 1800, refRangeLow: 0, refRangeHigh: 20, refRangeText: '< 20 (Negative)', unit: 'IU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-aso', code: 'ASO', name: 'Anti-Streptolysin O (ASOT)', arabicName: 'فحص بكتيريا البلعوم واللوزتين (ASOT)', category: 'المناعة والأمصال', price: 10000, costEstimate: 1800, refRangeLow: 0, refRangeHigh: 200, refRangeText: '< 200 (Negative)', unit: 'IU/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-rose', code: 'ROSE', name: 'Rose Bengal (Brucella Screen)', arabicName: 'فحص حمى مالطا (البروسيلا)', category: 'المناعة والأمصال', price: 8000, costEstimate: 1200, refRangeText: 'Negative', unit: '', sampleType: 'مصل الدم (Serum)' },
  { id: 't-widal', code: 'WIDAL', name: 'Widal Test (Typhoid Fever)', arabicName: 'فحص حمى التيفوئيد (الفيدال)', category: 'المناعة والأمصال', price: 8000, costEstimate: 1200, refRangeText: 'Negative (< 1:80)', unit: 'Titer', sampleType: 'مصل الدم (Serum)' },
  { id: 't-hp', code: 'HP-AG', name: 'H. Pylori Antigen in Stool', arabicName: 'جرثومة المعدة (أنتيجين الخروج)', category: 'المناعة والأمصال', price: 15000, costEstimate: 3000, refRangeText: 'Negative', unit: '', sampleType: 'عينة خروج' },
  { id: 't-hbsag', code: 'HBSAG', name: 'Hepatitis B Surface Antigen (HBsAg)', arabicName: 'التهاب الكبد الفيروسي نوع B', category: 'المناعة والأمصال', price: 15000, costEstimate: 2800, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'مصل الدم (Serum)' },
  { id: 't-hcv', code: 'HCV', name: 'Hepatitis C Virus Antibody (HCV Ab)', arabicName: 'التهاب الكبد الفيروسي نوع C', category: 'المناعة والأمصال', price: 15000, costEstimate: 2800, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'مصل الدم (Serum)' },
  { id: 't-hiv', code: 'HIV', name: 'HIV 1 & 2 Ab/Ag Combo', arabicName: 'فحص الإيدز وفيروس نقص المناعة', category: 'المناعة والأمصال', price: 20000, costEstimate: 4000, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'مصل الدم (Serum)' },

  // 9. Urine & Stool
  { id: 't-gue', code: 'GUE', name: 'General Urine Examination (GUE)', arabicName: 'فحص الإدرار العام الشامل', category: 'الفحص المجهري العام', price: 5000, costEstimate: 800, refRangeText: 'Normal (Pus: 0-4 / RBCs: 0-2 / Prot: Nil)', unit: '', sampleType: 'إدرار صباحي' },
  { id: 't-gse', code: 'GSE', name: 'General Stool Examination (GSE)', arabicName: 'فحص الخروج العام الشامل', category: 'الفحص المجهري العام', price: 5000, costEstimate: 800, refRangeText: 'Normal (No Parasites / FOBT: Negative)', unit: '', sampleType: 'عينة خروج' },
  { id: 't-fobt', code: 'FOBT', name: 'Fecal Occult Blood Test (FOBT)', arabicName: 'فحص الدم الخفي في الخروج', category: 'الفحص المجهري العام', price: 10000, costEstimate: 2000, refRangeText: 'Negative', unit: '', sampleType: 'عينة خروج' },

  // 10. Tumor Markers
  { id: 't-psa', code: 'PSA-TOT', name: 'Total PSA (Prostate Specific Antigen)', arabicName: 'دلالات البروستات الكلية (PSA)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 4.0, criticalHigh: 10.0, refRangeText: '< 4.0', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-cea', code: 'CEA', name: 'Carcinoembryonic Antigen (CEA)', arabicName: 'دلالات أورام القولون والجهاز الهضمي (CEA)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 5.0, refRangeText: '< 5.0', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-ca125', code: 'CA125', name: 'Cancer Antigen 125 (CA-125)', arabicName: 'دلالات أورام المبيض والرحم (CA-125)', category: 'دلالات الأورام', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 35.0, refRangeText: '< 35.0', unit: 'U/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-ca199', code: 'CA19-9', name: 'Cancer Antigen 19-9 (CA 19-9)', arabicName: 'دلالات أورام البنكرياس والمرارة (CA 19-9)', category: 'دلالات الأورام', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 37.0, refRangeText: '< 37.0', unit: 'U/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-ca153', code: 'CA15-3', name: 'Cancer Antigen 15-3 (CA 15-3)', arabicName: 'دلالات أورام الثدي (CA 15-3)', category: 'دلالات الأورام', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 30.0, refRangeText: '< 30.0', unit: 'U/mL', sampleType: 'مصل الدم (Serum)' },
  { id: 't-afp', code: 'AFP', name: 'Alpha-Fetoprotein (AFP)', arabicName: 'دلالات أورام الكبد والجنين (AFP)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 7.0, refRangeText: '< 7.0', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
];

export const INITIAL_PANELS: PanelItem[] = [
  {
    id: 'p-1',
    name: 'الفحص الشامل للاطمئنان والصحة العامة (Comprehensive Health Check)',
    description: 'يشمل صورة الدم، السكر التراكمي، وظائف الكلى، وظائف الكبد، دهون الدم، فيتامين د، وفحص الإدرار العام',
    price: 85000,
    testCodes: ['CBC', 'HBA1C', 'CREAT', 'UREA', 'URIC', 'GOT', 'GPT', 'CHOL', 'TG', 'HDL', 'LDL', 'VITD', 'GUE'],
  },
  {
    id: 'p-2',
    name: 'باقة متابعة مرضى السكري المتكاملة (Diabetic Care Panel)',
    description: 'يشمل السكر الصائم، السكر التراكمي، وظائف الكلى، الزلال البولي، والدهون الثلاثية',
    price: 45000,
    testCodes: ['FBS', 'HBA1C', 'CREAT', 'UREA', 'MALB', 'CHOL', 'TG', 'GUE'],
  },
  {
    id: 'p-3',
    name: 'باقة وظائف الكلى والأملاح الشاملة (KFT & Electrolytes Panel)',
    description: 'الكرياتينين، اليوريا، حمض اليوريك، الصوديوم، البوتاسيوم، وفحص الإدرار العام',
    price: 30000,
    testCodes: ['CREAT', 'UREA', 'BUN', 'URIC', 'NA', 'K', 'GUE'],
  },
  {
    id: 'p-4',
    name: 'باقة وظائف الكبد والمرارة الكاملة (Complete LFT Panel)',
    description: 'إنزيمات الكبد AST و ALT، الفوسفاتاز القلوي، البيليروبين الكلي والمباشر، والألبومين والبروتين',
    price: 35000,
    testCodes: ['GOT', 'GPT', 'ALP', 'TSB', 'DIR-BIL', 'TP', 'ALB'],
  },
  {
    id: 'p-5',
    name: 'باقة دهون الدم وصحة القلب (Lipid & Cardiovascular Panel)',
    description: 'الكوليسترول الكلي، الدهون الثلاثية، الكوليسترول النافع HDL، والكوليسترول الضار LDL',
    price: 25000,
    testCodes: ['CHOL', 'TG', 'HDL', 'LDL', 'VLDL'],
  },
  {
    id: 'p-6',
    name: 'باقة الغدة الدرقية الكاملة (Thyroid Health Panel)',
    description: 'هرمون المحفز للدرقية TSH، الثايروكسين الحر Free T4، وثلاثي اليود الحر Free T3',
    price: 50000,
    testCodes: ['TSH', 'FT4', 'FT3'],
  },
  {
    id: 'p-7',
    name: 'باقة الفحص الطبي قبل الزواج (Premarital Screen Package)',
    description: 'صورة الدم والأنيميا، فصيلة الدم، التهاب الكبد B و C، فيروس الإيدز، والزهري',
    price: 60000,
    testCodes: ['CBC', 'BG', 'HBSAG', 'HCV', 'HIV', 'VDRL'],
  },
  {
    id: 'p-8',
    name: 'باقة تساقط الشعر والنشاط والحيوية (Hair Loss & Vitality Screen)',
    description: 'صورة الدم، الفيريتين مخزون الحديد، هرمون TSH، الزنك، وفيتامين D3',
    price: 75000,
    testCodes: ['CBC', 'FER', 'IRON', 'TSH', 'VITD', 'ZINC'],
  },
];

export const INITIAL_DOCTORS = [
  { id: 'doc-1', name: 'د. علي حسين السعدي', phone: '07709876543', clinic: 'عيادة الباطنية والسكري - شارع الأطباء', specialty: 'أمراض باطنية وسكري وغدد صماء', commissionPercent: 10 },
  { id: 'doc-2', name: 'د. مريم فاضل الخفاجي', phone: '07801122334', clinic: 'مجمع العائلة للنسائية والتوليد', specialty: 'نسائية وتوليد وعقم', commissionPercent: 15 },
  { id: 'doc-3', name: 'د. مصطفى كمال الزبيدي', phone: '07703334455', clinic: 'مركز النور الطبي - جراحة الكلى والمسالك', specialty: 'جراحة الكلى والمسالك البولية والعقم', commissionPercent: 12 },
  { id: 'doc-4', name: 'د. سارة عادل الجبوري', phone: '07806667788', clinic: 'مجمع ابن سينا التخصصي', specialty: 'أمراض الدم والأورام', commissionPercent: 10 },
];
