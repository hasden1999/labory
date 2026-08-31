import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive medical laboratory database seeding...');

  // Clean existing data
  await prisma.sampleTest.deleteMany();
  await prisma.debtRecord.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.debtor.deleteMany();
  await prisma.testPanelItem.deleteMany();
  await prisma.testPanel.deleteMany();
  await prisma.testCatalog.deleteMany();
  await prisma.referringDoctor.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.resultArchive.deleteMany();

  // 1. Lab Settings
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
      labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل ومعتمد',
      doctorName: 'د. أحمد الرضا',
      doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
      labLicense: 'MOH-IQ-2026-8842',
      whatsappNumber: '07701234567',
      currency: 'د.ع',
      address: 'بغداد - شارع الأطباء - مقابل المجمع الطبي المركزي',
      phone: '07701234567 / 07801234567',
      reportHeader: 'مختبر الرضا للتحليلات الطبية التخصصية',
      reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).',
    },
    create: {
      id: 'singleton',
      labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
      labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل ومعتمد',
      doctorName: 'د. أحمد الرضا',
      doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
      labLicense: 'MOH-IQ-2026-8842',
      whatsappNumber: '07701234567',
      currency: 'د.ع',
      address: 'بغداد - شارع الأطباء - مقابل المجمع الطبي المركزي',
      phone: '07701234567 / 07801234567',
      reportHeader: 'مختبر الرضا للتحليلات الطبية التخصصية',
      reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).',
    },
  });

  // 2. Staff Accounts
  const ownerPasswordHash = await bcrypt.hash('owner123', 10);
  const techPasswordHash = await bcrypt.hash('tech123', 10);

  await prisma.staff.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      name: 'د. أحمد الرضا (مدير المختبر)',
      username: 'owner',
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
      phone: '07701112233',
    },
  });

  await prisma.staff.upsert({
    where: { username: 'tech' },
    update: {},
    create: {
      name: 'علي عبد الحسين (تقني مختبر)',
      username: 'tech',
      passwordHash: techPasswordHash,
      role: 'TECHNICIAN',
      phone: '07702223344',
    },
  });

  // 3. Referring Doctors
  const doc1 = await prisma.referringDoctor.create({
    data: {
      name: 'د. علي حسين السعدي',
      phone: '07709876543',
      clinic: 'عيادة الباطنية والسكري - شارع الأطباء',
      specialty: 'أمراض باطنية وسكري وغدد صماء',
      commissionPercent: 10,
    },
  });

  const doc2 = await prisma.referringDoctor.create({
    data: {
      name: 'د. مريم فاضل الخفاجي',
      phone: '07801122334',
      clinic: 'مجمع العائلة للنسائية والتوليد',
      specialty: 'نسائية وتوليد وعقم',
      commissionPercent: 15,
    },
  });

  const doc3 = await prisma.referringDoctor.create({
    data: {
      name: 'د. مصطفى كمال الزبيدي',
      phone: '07703334455',
      clinic: 'مركز النور الطبي - جراحة الكلى والمسالك',
      specialty: 'جراحة الكلى والمسالك البولية والعقم',
      commissionPercent: 12,
    },
  });

  const doc4 = await prisma.referringDoctor.create({
    data: {
      name: 'د. سارة عادل الجبوري',
      phone: '07806667788',
      clinic: 'مجمع ابن سينا التخصصي',
      specialty: 'أمراض الدم والأورام',
      commissionPercent: 10,
    },
  });

  // 4. Test Catalog (85+ Comprehensive Tests)
  console.log('🧪 Seeding medical test catalog...');
  const testsData = [
    // --- 1. أمراض الدم والتخثر (Hematology & Coagulation) ---
    { code: 'CBC', name: 'Complete Blood Count (CBC)', arabicName: 'صورة الدم الكاملة', category: 'أمراض الدم والتخثر', price: 15000, costEstimate: 2500, refRangeLow: 12.0, refRangeHigh: 16.0, normalMaleLow: 13.5, normalMaleHigh: 17.5, normalFemaleLow: 12.0, normalFemaleHigh: 15.5, criticalLow: 7.0, criticalHigh: 20.0, refRangeText: '12.0 - 16.0', unit: 'g/dL', sampleType: 'دم كامل (EDTA)' },
    { code: 'HB', name: 'Hemoglobin (Hb)', arabicName: 'خضاب الدم (الهيموغلوبين)', category: 'أمراض الدم والتخثر', price: 5000, costEstimate: 800, refRangeLow: 12.0, refRangeHigh: 16.5, normalMaleLow: 13.5, normalMaleHigh: 17.5, normalFemaleLow: 12.0, normalFemaleHigh: 15.5, criticalLow: 7.0, criticalHigh: 20.0, refRangeText: '12.0 - 16.5', unit: 'g/dL', sampleType: 'دم كامل (EDTA)' },
    { code: 'ESR', name: 'Erythrocyte Sedimentation Rate (ESR)', arabicName: 'سرعة ترسب كريات الدم الحمر', category: 'أمراض الدم والتخثر', price: 5000, costEstimate: 600, refRangeLow: 0, refRangeHigh: 20, normalMaleLow: 0, normalMaleHigh: 15, normalFemaleLow: 0, normalFemaleHigh: 20, criticalHigh: 100, refRangeText: '0 - 20', unit: 'mm/1st hr', sampleType: 'دم كامل (Citrate)' },
    { code: 'BG', name: 'Blood Group & Rh Factor', arabicName: 'فصيلة الدم والعامل الريسي', category: 'أمراض الدم والتخثر', price: 5000, costEstimate: 800, refRangeText: 'A / B / AB / O (Pos/Neg)', unit: '', sampleType: 'دم كامل (EDTA)' },
    { code: 'PLT', name: 'Platelets Count', arabicName: 'تعداد الصفائح الدموية', category: 'أمراض الدم والتخثر', price: 6000, costEstimate: 1000, refRangeLow: 150000, refRangeHigh: 450000, criticalLow: 30000, criticalHigh: 1000000, refRangeText: '150,000 - 450,000', unit: '/uL', sampleType: 'دم كامل (EDTA)' },
    { code: 'PT-INR', name: 'Prothrombin Time (PT / INR)', arabicName: 'زمن البروثرومبين ومعدل التخثر الدولي', category: 'أمراض الدم والتخثر', price: 15000, costEstimate: 3000, refRangeLow: 0.9, refRangeHigh: 1.2, criticalHigh: 4.5, refRangeText: '0.9 - 1.2', unit: 'Ratio', sampleType: 'بلازما (Sodium Citrate)' },
    { code: 'PTT', name: 'Partial Thromboplastin Time (PTT/APTT)', arabicName: 'زمن الترومبوبلاستين الجزئي', category: 'أمراض الدم والتخثر', price: 15000, costEstimate: 3000, refRangeLow: 25, refRangeHigh: 38, criticalHigh: 80, refRangeText: '25 - 38', unit: 'sec', sampleType: 'بلازما (Sodium Citrate)' },
    { code: 'DDIMER', name: 'D-Dimer (Quantitative)', arabicName: 'فحص دي دايمر للتخثر والجلطات', category: 'أمراض الدم والتخثر', price: 25000, costEstimate: 6000, refRangeLow: 0, refRangeHigh: 0.5, criticalHigh: 5.0, refRangeText: '< 0.5', unit: 'ug/mL', sampleType: 'بلازما' },
    { code: 'FER', name: 'Serum Ferritin', arabicName: 'مخزون الحديد (الفيريتين)', category: 'أمراض الدم والتخثر', price: 18000, costEstimate: 3500, refRangeLow: 15, refRangeHigh: 200, normalMaleLow: 30, normalMaleHigh: 400, normalFemaleLow: 15, normalFemaleHigh: 150, criticalLow: 5, refRangeText: '15 - 200', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'IRON', name: 'Serum Iron', arabicName: 'الحديد في مصل الدم', category: 'أمراض الدم والتخثر', price: 10000, costEstimate: 1800, refRangeLow: 50, refRangeHigh: 170, normalMaleLow: 65, normalMaleHigh: 175, normalFemaleLow: 50, normalFemaleHigh: 170, refRangeText: '50 - 170', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'TIBC', name: 'Total Iron Binding Capacity (TIBC)', arabicName: 'السعة الكلية الرابطة للحديد', category: 'أمراض الدم والتخثر', price: 12000, costEstimate: 2000, refRangeLow: 250, refRangeHigh: 450, refRangeText: '250 - 450', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },

    // --- 2. الكيمياء السريرية والسكري (Clinical Chemistry & Diabetes) ---
    { code: 'FBS', name: 'Fasting Blood Sugar (FBS)', arabicName: 'سكر الدم الصائم', category: 'الكيمياء السريرية والسكري', price: 5000, costEstimate: 800, refRangeLow: 70, refRangeHigh: 100, criticalLow: 45, criticalHigh: 400, refRangeText: '70 - 100 (Normal)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'RBS', name: 'Random Blood Sugar (RBS)', arabicName: 'سكر الدم العشوائي', category: 'الكيمياء السريرية والسكري', price: 5000, costEstimate: 800, refRangeLow: 70, refRangeHigh: 140, criticalLow: 45, criticalHigh: 450, refRangeText: '70 - 140', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', arabicName: 'السكر التراكمي', category: 'الكيمياء السريرية والسكري', price: 15000, costEstimate: 3500, refRangeLow: 4.0, refRangeHigh: 5.6, criticalHigh: 12.0, refRangeText: '4.0 - 5.6 % (Non-diabetic)', unit: '%', sampleType: 'دم كامل (EDTA)' },
    { code: 'OGTT', name: 'Oral Glucose Tolerance Test (2hr)', arabicName: 'اختبار تحمل السكر الفموي', category: 'الكيمياء السريرية والسكري', price: 15000, costEstimate: 2500, refRangeLow: 70, refRangeHigh: 140, refRangeText: '< 140', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'INSULIN', name: 'Fasting Insulin', arabicName: 'هرمون الأنسولين الصائم', category: 'الكيمياء السريرية والسكري', price: 25000, costEstimate: 5000, refRangeLow: 2.6, refRangeHigh: 24.9, refRangeText: '2.6 - 24.9', unit: 'uIU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CPEPTIDE', name: 'C-Peptide Fasting', arabicName: 'فحص سي ببتيد لكفاءة البنكرياس', category: 'الكيمياء السريرية والسكري', price: 25000, costEstimate: 5000, refRangeLow: 0.8, refRangeHigh: 3.8, refRangeText: '0.8 - 3.8', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },

    // --- 3. وظائف الكلى والأملاح (Renal Function & Electrolytes) ---
    { code: 'CREAT', name: 'Serum Creatinine', arabicName: 'الكرياتينين في مصل الدم', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 0.6, refRangeHigh: 1.2, normalMaleLow: 0.7, normalMaleHigh: 1.3, normalFemaleLow: 0.5, normalFemaleHigh: 1.1, criticalHigh: 5.0, refRangeText: '0.6 - 1.2', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'UREA', name: 'Blood Urea', arabicName: 'اليوريا في الدم', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 15, refRangeHigh: 45, criticalHigh: 120, refRangeText: '15 - 45', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'BUN', name: 'Blood Urea Nitrogen (BUN)', arabicName: 'نتروجين يوريا الدم', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 7, refRangeHigh: 20, refRangeText: '7 - 20', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'URIC', name: 'Serum Uric Acid', arabicName: 'حمض اليوريك (داء النقرس)', category: 'وظائف الكلى والأملاح', price: 7000, costEstimate: 1200, refRangeLow: 3.5, refRangeHigh: 7.2, normalMaleLow: 3.5, normalMaleHigh: 7.2, normalFemaleLow: 2.6, normalFemaleHigh: 6.0, refRangeText: '3.5 - 7.2', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'EGFR', name: 'Estimated GFR (eGFR)', arabicName: 'معدل الترشيح الكبيبي المقدر', category: 'وظائف الكلى والأملاح', price: 5000, costEstimate: 0, refRangeLow: 90, refRangeHigh: 120, criticalLow: 15, refRangeText: '> 90 (Normal)', unit: 'mL/min/1.73m2', sampleType: 'محسوب' },
    { code: 'NA', name: 'Serum Sodium (Na+)', arabicName: 'الصوديوم في الدم', category: 'وظائف الكلى والأملاح', price: 8000, costEstimate: 1500, refRangeLow: 135, refRangeHigh: 145, criticalLow: 120, criticalHigh: 160, refRangeText: '135 - 145', unit: 'mmol/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'K', name: 'Serum Potassium (K+)', arabicName: 'البوتاسيوم في الدم', category: 'وظائف الكلى والأملاح', price: 8000, costEstimate: 1500, refRangeLow: 3.5, refRangeHigh: 5.1, criticalLow: 2.8, criticalHigh: 6.2, refRangeText: '3.5 - 5.1', unit: 'mmol/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'CL', name: 'Serum Chloride (Cl-)', arabicName: 'الكلوريد في الدم', category: 'وظائف الكلى والأملاح', price: 8000, costEstimate: 1500, refRangeLow: 98, refRangeHigh: 107, refRangeText: '98 - 107', unit: 'mmol/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'MALB', name: 'Microalbumin in Urine', arabicName: 'الزلال الدقيق في الإدرار', category: 'وظائف الكلى والأملاح', price: 15000, costEstimate: 3000, refRangeLow: 0, refRangeHigh: 30, refRangeText: '< 30', unit: 'mg/L', sampleType: 'إدرار عشوائي' },

    // --- 4. وظائف الكبد والمرارة (Liver Function Profile) ---
    { code: 'GOT', name: 'SGOT / AST (Aspartate Aminotransferase)', arabicName: 'إنزيم الكبد والقلب (AST/GOT)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 5, refRangeHigh: 40, normalMaleLow: 5, normalMaleHigh: 40, normalFemaleLow: 5, normalFemaleHigh: 32, criticalHigh: 250, refRangeText: '5 - 40', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'GPT', name: 'SGPT / ALT (Alanine Aminotransferase)', arabicName: 'إنزيم الكبد المتخصص (ALT/GPT)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 5, refRangeHigh: 45, normalMaleLow: 5, normalMaleHigh: 45, normalFemaleLow: 5, normalFemaleHigh: 34, criticalHigh: 250, refRangeText: '5 - 45', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'ALP', name: 'Alkaline Phosphatase (ALP)', arabicName: 'إنزيم الفوسفاتاز القلوي', category: 'وظائف الكبد والمرارة', price: 8000, costEstimate: 1400, refRangeLow: 40, refRangeHigh: 130, refRangeText: '40 - 130', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'TSB', name: 'Total Bilirubin (TSB)', arabicName: 'البيليروبين الكلي (اليرقان / أبو صفار)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 0.2, refRangeHigh: 1.2, criticalHigh: 15.0, refRangeText: '0.2 - 1.2', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'DIR-BIL', name: 'Direct Bilirubin', arabicName: 'البيليروبين المباشر (المقترن)', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 0.0, refRangeHigh: 0.3, refRangeText: '0.0 - 0.3', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'INDIR-BIL', name: 'Indirect Bilirubin', arabicName: 'البيليروبين غير المباشر', category: 'وظائف الكبد والمرارة', price: 5000, costEstimate: 0, refRangeLow: 0.2, refRangeHigh: 0.8, refRangeText: '0.2 - 0.8', unit: 'mg/dL', sampleType: 'محسوب' },
    { code: 'TP', name: 'Total Serum Protein', arabicName: 'البروتين الكلي في مصل الدم', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 6.4, refRangeHigh: 8.3, refRangeText: '6.4 - 8.3', unit: 'g/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'ALB', name: 'Serum Albumin', arabicName: 'الألبومين في مصل الدم', category: 'وظائف الكبد والمرارة', price: 7000, costEstimate: 1200, refRangeLow: 3.5, refRangeHigh: 5.0, refRangeText: '3.5 - 5.0', unit: 'g/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'GGT', name: 'Gamma GT (GGT)', arabicName: 'إنزيم جاما جي تي للكبد والمرارة', category: 'وظائف الكبد والمرارة', price: 12000, costEstimate: 2500, refRangeLow: 9, refRangeHigh: 48, refRangeText: '9 - 48', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },

    // --- 5. دهون الدم وصحة القلب (Lipid Profile & Cardiac) ---
    { code: 'CHOL', name: 'Total Cholesterol', arabicName: 'الكوليسترول الكلي', category: 'دهون الدم وصحة القلب', price: 7000, costEstimate: 1200, refRangeLow: 120, refRangeHigh: 200, criticalHigh: 300, refRangeText: '< 200 (Desirable)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'TG', name: 'Triglycerides (TG)', arabicName: 'الدهون الثلاثية', category: 'دهون الدم وصحة القلب', price: 7000, costEstimate: 1200, refRangeLow: 50, refRangeHigh: 150, criticalHigh: 500, refRangeText: '< 150 (Normal)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'HDL', name: 'HDL Cholesterol (Good)', arabicName: 'الكوليسترول عالي الكثافة (النافع)', category: 'دهون الدم وصحة القلب', price: 8000, costEstimate: 1500, refRangeLow: 40, refRangeHigh: 65, normalMaleLow: 40, normalMaleHigh: 60, normalFemaleLow: 50, normalFemaleHigh: 65, refRangeText: '> 40 (Male) / > 50 (Female)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'LDL', name: 'LDL Cholesterol (Bad)', arabicName: 'الكوليسترول منخفض الكثافة (الضار)', category: 'دهون الدم وصحة القلب', price: 8000, costEstimate: 1500, refRangeLow: 0, refRangeHigh: 100, criticalHigh: 190, refRangeText: '< 100 (Optimal)', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'VLDL', name: 'VLDL Cholesterol', arabicName: 'الكوليسترول شديد انخفاض الكثافة', category: 'دهون الدم وصحة القلب', price: 5000, costEstimate: 0, refRangeLow: 5, refRangeHigh: 30, refRangeText: '5 - 30', unit: 'mg/dL', sampleType: 'محسوب' },
    { code: 'TROP-I', name: 'Troponin I (High Sensitive)', arabicName: 'إنزيم تروبونين القلبي السريع للجلطة', category: 'دهون الدم وصحة القلب', price: 30000, costEstimate: 8000, refRangeLow: 0, refRangeHigh: 0.04, criticalHigh: 0.1, refRangeText: '< 0.04 (Negative)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CKMB', name: 'CK-MB (Creatine Kinase-MB)', arabicName: 'إنزيم عضلة القلب سي كيه إم بي', category: 'دهون الدم وصحة القلب', price: 20000, costEstimate: 4500, refRangeLow: 0, refRangeHigh: 25, criticalHigh: 50, refRangeText: '< 25', unit: 'U/L', sampleType: 'مصل الدم (Serum)' },

    // --- 6. الغدة الدرقية والهرمونات (Thyroid & Hormones) ---
    { code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', arabicName: 'هرمون الغدة الدرقية المحفز (TSH)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 0.4, refRangeHigh: 4.2, criticalLow: 0.05, criticalHigh: 15.0, refRangeText: '0.4 - 4.2', unit: 'uIU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'FT4', name: 'Free Thyroxine (Free T4)', arabicName: 'هرمون الثايروكسين الحر (FT4)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 0.8, refRangeHigh: 1.8, refRangeText: '0.8 - 1.8', unit: 'ng/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'FT3', name: 'Free Triiodothyronine (Free T3)', arabicName: 'هرمون ثلاثي اليود الثايرونين الحر (FT3)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 2.0, refRangeHigh: 4.4, refRangeText: '2.0 - 4.4', unit: 'pg/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'PRL', name: 'Prolactin (Milk Hormone)', arabicName: 'هرمون الحليب (البرولاكتين)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 3.0, refRangeHigh: 25.0, normalMaleLow: 3.0, normalMaleHigh: 15.0, normalFemaleLow: 4.0, normalFemaleHigh: 25.0, criticalHigh: 100, refRangeText: '4.0 - 25.0 (Female)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'FSH', name: 'Follicle Stimulating Hormone (FSH)', arabicName: 'الهرمون المنبه للجريب (FSH)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 1.5, refRangeHigh: 12.4, refRangeText: '1.5 - 12.4 (Follicular)', unit: 'mIU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'LH', name: 'Luteinizing Hormone (LH)', arabicName: 'الهرمون الملوتن (LH)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 1.7, refRangeHigh: 12.6, refRangeText: '1.7 - 12.6', unit: 'mIU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'TESTO', name: 'Total Testosterone', arabicName: 'هرمون الذكورة الكلي (التستوستيرون)', category: 'الغدة الدرقية والهرمونات', price: 25000, costEstimate: 5000, refRangeLow: 2.8, refRangeHigh: 8.0, normalMaleLow: 2.8, normalMaleHigh: 8.0, normalFemaleLow: 0.1, normalFemaleHigh: 0.8, refRangeText: '2.8 - 8.0 (Male)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'PROG', name: 'Progesterone (Day 21)', arabicName: 'هرمون البروجسترون (اليوم 21 للتبويض)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 5.0, refRangeHigh: 20.0, refRangeText: '5.0 - 20.0 (Luteal)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'E2', name: 'Estradiol (E2)', arabicName: 'هرمون الاستراديول (الإستروجين)', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 20, refRangeHigh: 150, refRangeText: '20 - 150', unit: 'pg/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'BHCG', name: 'Beta-hCG (Quantitative Pregnancy)', arabicName: 'هرمون الحمل الرقمي التراكمي', category: 'الغدة الدرقية والهرمونات', price: 20000, costEstimate: 4000, refRangeLow: 0, refRangeHigh: 5, refRangeText: '< 5 (Non-pregnant)', unit: 'mIU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'AMH', name: 'Anti-Mullerian Hormone (AMH)', arabicName: 'هرمون مخزون المبيض (AMH)', category: 'الغدة الدرقية والهرمونات', price: 45000, costEstimate: 12000, refRangeLow: 1.0, refRangeHigh: 3.5, refRangeText: '1.0 - 3.5 (Normal reserve)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CORTISOL', name: 'Serum Cortisol (Morning 8 AM)', arabicName: 'هرمون الكورتيزول الصباحي', category: 'الغدة الدرقية والهرمونات', price: 25000, costEstimate: 5000, refRangeLow: 6.0, refRangeHigh: 23.0, refRangeText: '6.0 - 23.0', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },

    // --- 7. المعادن والفيتامينات (Vitamins & Minerals) ---
    { code: 'VITD', name: 'Vitamin D3 (25-OH Total)', arabicName: 'فيتامين د3 الكلي (فحص المناعة والعظام)', category: 'المعادن والفيتامينات', price: 25000, costEstimate: 5500, refRangeLow: 30, refRangeHigh: 100, criticalLow: 10, refRangeText: '30 - 100 (Sufficiency)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'VITB12', name: 'Vitamin B12 (Cobalamin)', arabicName: 'فيتامين ب12 (فيتامين الأعصاب)', category: 'المعادن والفيتامينات', price: 25000, costEstimate: 5000, refRangeLow: 200, refRangeHigh: 900, criticalLow: 100, refRangeText: '200 - 900', unit: 'pg/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CALC', name: 'Total Serum Calcium', arabicName: 'الكالسيوم الكلي في الدم', category: 'المعادن والفيتامينات', price: 8000, costEstimate: 1400, refRangeLow: 8.5, refRangeHigh: 10.5, criticalLow: 6.5, criticalHigh: 13.0, refRangeText: '8.5 - 10.5', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'PHOS', name: 'Serum Phosphorus / Phosphate', arabicName: 'الفوسفور غير العضوي في الدم', category: 'المعادن والفيتامينات', price: 8000, costEstimate: 1400, refRangeLow: 2.5, refRangeHigh: 4.5, refRangeText: '2.5 - 4.5', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'MG', name: 'Serum Magnesium', arabicName: 'المغنيسيوم في الدم', category: 'المعادن والفيتامينات', price: 8000, costEstimate: 1400, refRangeLow: 1.7, refRangeHigh: 2.4, refRangeText: '1.7 - 2.4', unit: 'mg/dL', sampleType: 'مصل الدم (Serum)' },
    { code: 'ZINC', name: 'Serum Zinc', arabicName: 'الزنك في الدم', category: 'المعادن والفيتامينات', price: 20000, costEstimate: 4000, refRangeLow: 70, refRangeHigh: 120, refRangeText: '70 - 120', unit: 'ug/dL', sampleType: 'مصل الدم (Serum)' },

    // --- 8. المناعة والأمصال (Immunology & Serology) ---
    { code: 'CRP', name: 'C-Reactive Protein (CRP Quantitative)', arabicName: 'بروتين سي التفاعلي الكمي (الالتهاب)', category: 'المناعة والأمصال', price: 12000, costEstimate: 2200, refRangeLow: 0, refRangeHigh: 6.0, criticalHigh: 50.0, refRangeText: '< 6.0 (Normal)', unit: 'mg/L', sampleType: 'مصل الدم (Serum)' },
    { code: 'RF', name: 'Rheumatoid Factor (RF)', arabicName: 'عامل الروماتويد (الروماتيزم)', category: 'المناعة والأمصال', price: 10000, costEstimate: 1800, refRangeLow: 0, refRangeHigh: 20, refRangeText: '< 20 (Negative)', unit: 'IU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'ASO', name: 'Anti-Streptolysin O (ASOT)', arabicName: 'فحص بكتيريا البلعوم واللوزتين (ASOT)', category: 'المناعة والأمصال', price: 10000, costEstimate: 1800, refRangeLow: 0, refRangeHigh: 200, refRangeText: '< 200 (Negative)', unit: 'IU/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'ROSE', name: 'Rose Bengal (Brucella Screen)', arabicName: 'فحص حمى مالطا (البروسيلا)', category: 'المناعة والأمصال', price: 8000, costEstimate: 1200, refRangeText: 'Negative', unit: '', sampleType: 'مصل الدم (Serum)' },
    { code: 'WIDAL', name: 'Widal Test (Typhoid Fever)', arabicName: 'فحص حمى التيفوئيد (الفيدال)', category: 'المناعة والأمصال', price: 8000, costEstimate: 1200, refRangeText: 'Negative (< 1:80)', unit: 'Titer', sampleType: 'مصل الدم (Serum)' },
    { code: 'HP-AG', name: 'H. Pylori Antigen in Stool', arabicName: 'جرثومة المعدة (أنتيجين الخروج)', category: 'المناعة والأمصال', price: 15000, costEstimate: 3000, refRangeText: 'Negative', unit: '', sampleType: 'عينة خروج' },
    { code: 'HBSAG', name: 'Hepatitis B Surface Antigen (HBsAg)', arabicName: 'التهاب الكبد الفيروسي نوع B', category: 'المناعة والأمصال', price: 15000, costEstimate: 2800, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'مصل الدم (Serum)' },
    { code: 'HCV', name: 'Hepatitis C Virus Antibody (HCV Ab)', arabicName: 'التهاب الكبد الفيروسي نوع C', category: 'المناعة والأمصال', price: 15000, costEstimate: 2800, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'مصل الدم (Serum)' },
    { code: 'HIV', name: 'HIV 1 & 2 Ab/Ag Combo', arabicName: 'فحص الإيدز وفيروس نقص المناعة', category: 'المناعة والأمصال', price: 20000, costEstimate: 4000, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'مصل الدم (Serum)' },
    { code: 'VDRL', name: 'VDRL / RPR (Syphilis Screen)', arabicName: 'فحص مرض الزهري (VDRL)', category: 'المناعة والأمصال', price: 10000, costEstimate: 1800, refRangeText: 'Non-reactive', unit: '', sampleType: 'مصل الدم (Serum)' },
    { code: 'ANA', name: 'Antinuclear Antibodies (ANA Screen)', arabicName: 'الأجسام المضادة للنواة (المناعة الذاتية)', category: 'المناعة والأمصال', price: 25000, costEstimate: 6000, refRangeText: 'Negative', unit: '', sampleType: 'مصل الدم (Serum)' },

    // --- 9. فحص الإدرار العام (General Urine Examination) ---
    { code: 'GUE', name: 'General Urine Examination (GUE)', arabicName: 'فحص الإدرار العام الشامل', category: 'الفحص المجهري العام', price: 5000, costEstimate: 800, refRangeText: 'Normal (Pus: 0-4 / RBCs: 0-2 / Prot: Nil)', unit: '', sampleType: 'إدرار صباحي' },
    { code: 'GSE', name: 'General Stool Examination (GSE)', arabicName: 'فحص الخروج العام الشامل', category: 'الفحص المجهري العام', price: 5000, costEstimate: 800, refRangeText: 'Normal (No Parasites / FOBT: Negative)', unit: '', sampleType: 'عينة خروج' },
    { code: 'FOBT', name: 'Fecal Occult Blood Test (FOBT)', arabicName: 'فحص الدم الخفي في الخروج', category: 'الفحص المجهري العام', price: 10000, costEstimate: 2000, refRangeText: 'Negative', unit: '', sampleType: 'عينة خروج' },

    // --- 10. دلالات الأورام (Tumor Markers) ---
    { code: 'PSA-TOT', name: 'Total PSA (Prostate Specific Antigen)', arabicName: 'دلالات البروستات الكلية (PSA)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 4.0, criticalHigh: 10.0, refRangeText: '< 4.0', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'PSA-FREE', name: 'Free PSA', arabicName: 'دلالات البروستات الحرة (Free PSA)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 0.9, refRangeText: '< 0.9', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CEA', name: 'Carcinoembryonic Antigen (CEA)', arabicName: 'دلالات أورام القولون والجهاز الهضمي (CEA)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 5.0, refRangeText: '< 5.0 (Non-smoker)', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CA125', name: 'Cancer Antigen 125 (CA-125)', arabicName: 'دلالات أورام المبيض والرحم (CA-125)', category: 'دلالات الأورام', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 35.0, refRangeText: '< 35.0', unit: 'U/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CA19-9', name: 'Cancer Antigen 19-9 (CA 19-9)', arabicName: 'دلالات أورام البنكرياس والمرارة (CA 19-9)', category: 'دلالات الأورام', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 37.0, refRangeText: '< 37.0', unit: 'U/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'CA15-3', name: 'Cancer Antigen 15-3 (CA 15-3)', arabicName: 'دلالات أورام الثدي (CA 15-3)', category: 'دلالات الأورام', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 30.0, refRangeText: '< 30.0', unit: 'U/mL', sampleType: 'مصل الدم (Serum)' },
    { code: 'AFP', name: 'Alpha-Fetoprotein (AFP)', arabicName: 'دلالات أورام الكبد والجنين (AFP)', category: 'دلالات الأورام', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 7.0, refRangeText: '< 7.0', unit: 'ng/mL', sampleType: 'مصل الدم (Serum)' },
  ];

  const createdTestsMap: Record<string, any> = {};
  for (const t of testsData) {
    const created = await prisma.testCatalog.create({
      data: t,
    });
    createdTestsMap[t.code] = created;
  }

  // 5. Diagnostic Panels (Packages)
  console.log('📦 Seeding diagnostic test panels...');
  const panelsData = [
    {
      name: 'الفحص الشامل للاطمئنان والصحة العامة (Comprehensive Health Check)',
      description: 'يشمل صورة الدم، السكر التراكمي، وظائف الكلى، وظائف الكبد، دهون الدم، فيتامين د، وفحص الإدرار العام',
      price: 85000, // Regular total: ~135,000
      testCodes: ['CBC', 'HBA1C', 'CREAT', 'UREA', 'URIC', 'GOT', 'GPT', 'CHOL', 'TG', 'HDL', 'LDL', 'VITD', 'GUE'],
    },
    {
      name: 'باقة متابعة مرضى السكري المتكاملة (Diabetic Care Panel)',
      description: 'يشمل السكر الصائم، السكر التراكمي، وظائف الكلى، الزلال البولي، والدهون الثلاثية',
      price: 45000,
      testCodes: ['FBS', 'HBA1C', 'CREAT', 'UREA', 'MALB', 'CHOL', 'TG', 'GUE'],
    },
    {
      name: 'باقة وظائف الكلى والأملاح الشاملة (KFT & Electrolytes Panel)',
      description: 'الكرياتينين، اليوريا، حمض اليوريك، الصوديوم، البوتاسيوم، وفحص الإدرار العام',
      price: 30000,
      testCodes: ['CREAT', 'UREA', 'BUN', 'URIC', 'NA', 'K', 'GUE'],
    },
    {
      name: 'باقة وظائف الكبد والمرارة الكاملة (Complete LFT Panel)',
      description: 'إنزيمات الكبد AST و ALT، الفوسفاتاز القلوي، البيليروبين الكلي والمباشر، والألبومين والبروتين',
      price: 35000,
      testCodes: ['GOT', 'GPT', 'ALP', 'TSB', 'DIR-BIL', 'TP', 'ALB'],
    },
    {
      name: 'باقة دهون الدم وصحة القلب (Lipid & Cardiovascular Panel)',
      description: 'الكوليسترول الكلي، الدهون الثلاثية، الكوليسترول النافع HDL، والكوليسترول الضار LDL',
      price: 25000,
      testCodes: ['CHOL', 'TG', 'HDL', 'LDL', 'VLDL'],
    },
    {
      name: 'باقة الغدة الدرقية الكاملة (Thyroid Health Panel)',
      description: 'هرمون المحفز للدرقية TSH، الثايروكسين الحر Free T4، وثلاثي اليود الحر Free T3',
      price: 50000,
      testCodes: ['TSH', 'FT4', 'FT3'],
    },
    {
      name: 'باقة الفحص الطبي قبل الزواج (Premarital Screen Package)',
      description: 'صورة الدم والأنيميا، فصيلة الدم، التهاب الكبد B و C، فيروس الإيدز، والزهري',
      price: 60000,
      testCodes: ['CBC', 'BG', 'HBSAG', 'HCV', 'HIV', 'VDRL'],
    },
    {
      name: 'باقة تساقط الشعر والنشاط والحيوية (Hair Loss & Vitality Screen)',
      description: 'صورة الدم، الفيريتين مخزون الحديد، هرمون TSH، الزنك، وفيتامين D3',
      price: 75000,
      testCodes: ['CBC', 'FER', 'IRON', 'TSH', 'VITD', 'ZINC'],
    },
    {
      name: 'باقة صحة العظام والمفاصل (Bone & Joint Health Panel)',
      description: 'فيتامين D3، الكالسيوم الكلي، الفوسفور، حمض اليوريك، بروتين الالتهاب CRP، وعامل الروماتويد RF',
      price: 65000,
      testCodes: ['VITD', 'CALC', 'PHOS', 'URIC', 'CRP', 'RF'],
    },
    {
      name: 'باقة الخصوبة والهرمونات للرجال والنساء (Fertility & Hormone Profile)',
      description: 'هرمونات FSH و LH، هرمون الحليب البرولاكتين، هرمون التستوستيرون، وهرمون الاستراديول',
      price: 85000,
      testCodes: ['FSH', 'LH', 'PRL', 'TESTO', 'E2'],
    },
  ];

  for (const panel of panelsData) {
    const validTestIds = panel.testCodes
      .map((code) => createdTestsMap[code]?.id)
      .filter(Boolean);

    await prisma.testPanel.create({
      data: {
        name: panel.name,
        description: panel.description,
        price: panel.price,
        items: {
          create: validTestIds.map((tId) => ({ testId: tId })),
        },
      },
    });
  }

  // 6. Patients & Samples Data
  console.log('👥 Seeding patients, samples, and results...');
  const pat1 = await prisma.patient.create({
    data: { name: 'حيدر عبد الحسين الخفاجي', phone: '07701239988', age: 48, gender: 'ذكر' },
  });
  const pat2 = await prisma.patient.create({
    data: { name: 'زينب جاسم محمد الجبوري', phone: '07804445566', age: 29, gender: 'أنثى' },
  });
  const pat3 = await prisma.patient.create({
    data: { name: 'عمر طارق السامرائي', phone: '07707778899', age: 62, gender: 'ذكر' },
  });
  const pat4 = await prisma.patient.create({
    data: { name: 'نور الهدى كريم التميمي', phone: '07809990011', age: 24, gender: 'أنثى' },
  });

  // Sample 1: Ready with mixed results & abnormal flag
  await prisma.sample.create({
    data: {
      sampleNumber: 1001,
      patientId: pat1.id,
      doctorId: doc1.id,
      status: 'READY',
      isUrgent: false,
      priceTotal: 45000,
      discount: 5000,
      discountPercent: 10,
      paidAmount: 40000,
      remainingAmount: 0,
      paymentMethod: 'نقداً',
      notes: 'المريض صائم منذ 12 ساعة - يعاني من دوار وإرهاق متكرر',
      tests: {
        create: [
          {
            testId: createdTestsMap['CBC'].id,
            priceAtTime: 15000,
            costAtTime: 2500,
            resultValue: '11.2',
            isAbnormal: true,
            isCritical: false,
            interpretation: 'Mild microcytic anemia detected (فقر دم خفيف)',
            refRangeLow: createdTestsMap['CBC'].normalMaleLow,
            refRangeHigh: createdTestsMap['CBC'].normalMaleHigh,
            refRangeText: '13.5 - 17.5',
            unit: 'g/dL',
          },
          {
            testId: createdTestsMap['FBS'].id,
            priceAtTime: 5000,
            costAtTime: 800,
            resultValue: '154',
            isAbnormal: true,
            isCritical: false,
            interpretation: 'Impaired fasting glucose - Diabetic range (ارتفاع سكر الصائم)',
            refRangeLow: 70,
            refRangeHigh: 100,
            refRangeText: '70 - 100',
            unit: 'mg/dL',
          },
          {
            testId: createdTestsMap['HBA1C'].id,
            priceAtTime: 15000,
            costAtTime: 3500,
            resultValue: '7.9',
            isAbnormal: true,
            isCritical: false,
            interpretation: 'Uncontrolled diabetes mellitus (سكر تراكمي غير منتظم)',
            refRangeLow: 4.0,
            refRangeHigh: 5.6,
            refRangeText: '4.0 - 5.6',
            unit: '%',
          },
          {
            testId: createdTestsMap['CREAT'].id,
            priceAtTime: 7000,
            costAtTime: 1200,
            resultValue: '0.9',
            isAbnormal: false,
            isCritical: false,
            interpretation: 'Normal kidney function (وظائف الكلى سليمة)',
            refRangeLow: 0.7,
            refRangeHigh: 1.3,
            refRangeText: '0.7 - 1.3',
            unit: 'mg/dL',
          },
        ],
      },
    },
  });

  // Sample 2: STAT Urgent In-Progress Sample with Thyroid & Fertility
  await prisma.sample.create({
    data: {
      sampleNumber: 1002,
      patientId: pat2.id,
      doctorId: doc2.id,
      status: 'IN_PROGRESS',
      isUrgent: true, // STAT
      priceTotal: 65000,
      discount: 0,
      discountPercent: 0,
      paidAmount: 35000,
      remainingAmount: 30000,
      paymentMethod: 'آجل',
      notes: 'عينة إسعافية عاجلة (STAT) - متبقي 30,000 د.ع عند الاستلام',
      tests: {
        create: [
          {
            testId: createdTestsMap['TSH'].id,
            priceAtTime: 20000,
            costAtTime: 4000,
            resultValue: '8.4',
            isAbnormal: true,
            isCritical: false,
            interpretation: 'Primary Hypothyroidism pattern (قصور نشاط الغدة الدرقية)',
            refRangeLow: 0.4,
            refRangeHigh: 4.2,
            refRangeText: '0.4 - 4.2',
            unit: 'uIU/mL',
          },
          {
            testId: createdTestsMap['PRL'].id,
            priceAtTime: 20000,
            costAtTime: 4000,
            resultValue: null,
            isAbnormal: false,
            isCritical: false,
            refRangeLow: 4.0,
            refRangeHigh: 25.0,
            refRangeText: '4.0 - 25.0',
            unit: 'ng/mL',
          },
          {
            testId: createdTestsMap['VITD'].id,
            priceAtTime: 25000,
            costAtTime: 5500,
            resultValue: null,
            isAbnormal: false,
            isCritical: false,
            refRangeLow: 30,
            refRangeHigh: 100,
            refRangeText: '30 - 100',
            unit: 'ng/mL',
          },
        ],
      },
    },
  });

  // Sample 3: Received sample awaiting technician entry
  await prisma.sample.create({
    data: {
      sampleNumber: 1003,
      patientId: pat3.id,
      doctorId: doc3.id,
      status: 'RECEIVED',
      isUrgent: false,
      priceTotal: 40000,
      discount: 0,
      paidAmount: 40000,
      remainingAmount: 0,
      paymentMethod: 'نقداً',
      notes: 'فحوصات البروستات والمسالك البولية',
      tests: {
        create: [
          {
            testId: createdTestsMap['PSA-TOT'].id,
            priceAtTime: 25000,
            costAtTime: 5000,
            refRangeLow: 0,
            refRangeHigh: 4.0,
            refRangeText: '< 4.0',
            unit: 'ng/mL',
          },
          {
            testId: createdTestsMap['GUE'].id,
            priceAtTime: 5000,
            costAtTime: 800,
            refRangeText: 'Normal',
            unit: '',
          },
          {
            testId: createdTestsMap['CREAT'].id,
            priceAtTime: 7000,
            costAtTime: 1200,
            refRangeLow: 0.7,
            refRangeHigh: 1.3,
            refRangeText: '0.7 - 1.3',
            unit: 'mg/dL',
          },
        ],
      },
    },
  });

  // 7. Dedicated Debtors
  console.log('💳 Seeding debtors and accounts...');
  const debtor1 = await prisma.debtor.create({
    data: {
      name: 'مستشفى الشفاء التخصصي (حساب توريد فحوصات)',
      phone: '07705554433',
      notes: 'تسوية حساب شهرية كل يوم 1 من الشهر',
      transactions: {
        create: [
          { type: 'DEBT', amount: 350000, notes: 'تحاليل عينات باقة القلب والأورام' },
          { type: 'PAYMENT', amount: 150000, notes: 'دفعة تحصيل نقدية رقم وصل 402' },
        ],
      },
    },
  });

  const debtor2 = await prisma.debtor.create({
    data: {
      name: 'عيادة د. علي السعدي (حساب الفحوصات العاجلة)',
      phone: '07709876543',
      notes: 'حساب تحاليل مرضى العيادة الآجلة',
      transactions: {
        create: [
          { type: 'DEBT', amount: 120000, notes: 'فحوصات سكري وغدد صماء' },
          { type: 'PAYMENT', amount: 70000, notes: 'تسديد دفعة نقدية' },
        ],
      },
    },
  });

  // 8. Reagents & Inventory Items with Smart Expiry Radar
  console.log('🧪 Seeding inventory and reagents...');
  const today = new Date();
  const expiredDate = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000); // Expired 20 days ago
  const expiringSoonDate = new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000); // Expiring in 12 days
  const safeDate1 = new Date(today.getTime() + 150 * 24 * 60 * 60 * 1000); // 5 months
  const safeDate2 = new Date(today.getTime() + 280 * 24 * 60 * 60 * 1000); // 9 months

  await prisma.inventoryItem.createMany({
    data: [
      {
        name: 'محلول كاشف صورة الدم CBC Reagent 3-Part Pack',
        unit: 'عبوة 20 لتر',
        quantity: 4,
        reorderThreshold: 2,
        expiryDate: safeDate1,
        costPerUnit: 140000,
        lotNumber: 'LOT-CBC-2026-A',
        supplier: 'شركة الأمل للأجهزة والحلول الطبية',
      },
      {
        name: 'كاسيتات فحص السكر التراكمي HbA1c Cartridges',
        unit: 'صندوق (50 فحص)',
        quantity: 2,
        reorderThreshold: 4,
        expiryDate: expiringSoonDate, // Warning: < 30 days!
        costPerUnit: 90000,
        lotNumber: 'LOT-A1C-982',
        supplier: 'الوكيل العلمي المعتمد',
      },
      {
        name: 'محلول معايرة ومراقبة الجودة TSH Calibrator Kit',
        unit: 'كيت معايرة 10 مل',
        quantity: 1,
        reorderThreshold: 2,
        expiryDate: expiredDate, // Expired alert!
        costPerUnit: 95000,
        lotNumber: 'LOT-TSH-CAL-EX',
        supplier: 'شركة بايوتيك للتشخيص المناعي',
      },
      {
        name: 'كاشف فحص وظائف الكلى Creatinine Reagent Kit (Jaffe Method)',
        unit: 'صندوق (200 فحص)',
        quantity: 6,
        reorderThreshold: 2,
        expiryDate: safeDate2,
        costPerUnit: 65000,
        lotNumber: 'LOT-CREAT-2026-X',
        supplier: 'مذخر بغداد للمستلزمات المخبرية',
      },
      {
        name: 'أنابيب سحب الدم البنفسجية K3-EDTA Tubes 3ml',
        unit: 'باكيت 100 أنبوب',
        quantity: 18,
        reorderThreshold: 5,
        expiryDate: safeDate2,
        costPerUnit: 16000,
        lotNumber: 'LOT-TB-EDTA-88',
        supplier: 'شركة النقاء للمستهلكات الطبية',
      },
      {
        name: 'أنابيب سحب الدم الصفراء مع جل وفصل Gel & Clot Activator 5ml',
        unit: 'باكيت 100 أنبوب',
        quantity: 22,
        reorderThreshold: 8,
        expiryDate: safeDate2,
        costPerUnit: 18000,
        lotNumber: 'LOT-TB-GEL-91',
        supplier: 'شركة النقاء للمستهلكات الطبية',
      },
      {
        name: 'شرائط فحص الإدرار العام Urine Reagent 10-Parameter Strips',
        unit: 'عبوة 100 شريط',
        quantity: 3,
        reorderThreshold: 4,
        expiryDate: expiringSoonDate,
        costPerUnit: 22000,
        lotNumber: 'LOT-URN-10P',
        supplier: 'مذخر الشفاء',
      },
    ],
  });

  // 9. Operational Expenses
  console.log('💰 Seeding expenses and financial logs...');
  await prisma.expense.createMany({
    data: [
      { description: 'إيجار مقر المختبر الشهري', amount: 750000, category: 'إيجار' },
      { description: 'شراء شحنة كواشف ومستلزمات سحب دم', amount: 380000, category: 'كواشف ومواد' },
      { description: 'صيانة دورية ومعايرة جهاز CBC والتحليل الآلي', amount: 75000, category: 'صيانة' },
      { description: 'فاتورة الكهرباء والمولد الخاص بالمختبر', amount: 150000, category: 'كهرباء ووقود' },
      { description: 'شراء أوراق تقارير حرارية ورولات باركود', amount: 45000, category: 'قرطاسية ومطبوعات' },
    ],
  });

  // 10. Quarterly Archived Historical Sample (Delta Check demonstration)
  await prisma.resultArchive.create({
    data: {
      periodLabel: 'Q4 2025 (أكتوبر - ديسمبر)',
      quarter: 4,
      year: 2025,
      patientName: 'حيدر عبد الحسين الخفاجي',
      sampleNum: 880,
      testSummary: 'CBC, FBS, HbA1c, Creatinine',
      resultsJson: JSON.stringify([
        { testName: 'صورة الدم الكاملة (CBC)', result: '12.8 g/dL', isAbnormal: false, unit: 'g/dL' },
        { testName: 'سكر الدم الصائم (FBS)', result: '185 mg/dL', isAbnormal: true, unit: 'mg/dL' },
        { testName: 'السكر التراكمي (HbA1c)', result: '8.8 %', isAbnormal: true, unit: '%' },
        { testName: 'الكرياتينين (Creatinine)', result: '1.0 mg/dL', isAbnormal: false, unit: 'mg/dL' },
      ]),
      sampleDate: new Date('2025-11-20'),
    },
  });

  console.log('✨ Comprehensive medical laboratory seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
