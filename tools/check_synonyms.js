const { PrismaClient } = require('@prisma/client');

const SYNONYMS = [
  // Blood sugar
  ['glucose', 'fbs', 'fasting blood sugar', 'blood sugar', 'سكر الدم الصائم', 'سكر الدم'],
  ['hba1c', 'glycated hemoglobin', 'hemoglobin a1c', 'السكر التراكمي', 'الهيموغلوبين السكري'],
  // Liver
  ['alt', 'gpt', 'sgpt', 'alanine aminotransferase', 'الانين امينوترانسفيراز', 'انزيم الكبد alt'],
  ['ast', 'got', 'sgot', 'aspartate aminotransferase', 'اسبارتات امينوترانسفيراز', 'انزيم الكبد ast'],
  ['alp', 'alkaline phosphatase', 'الفوسفاتاز القلوي'],
  ['tsb', 'total bilirubin', 'bilirubin total', 'البيليروبين الكلي', 'الصفار الكلي'],
  ['direct bilirubin', 'conjugated bilirubin', 'البيليروبين المباشر'],
  // Kidney
  ['creatinine', 'serum creatinine', 'الكرياتينين'],
  ['urea', 'blood urea', 'اليوريا'],
  ['uric acid', 'حمض اليوريك', 'حامض اليوريك'],
  // Lipids
  ['cholesterol', 'total cholesterol', 'الكوليسترول الكلي', 'الكوليسترول'],
  ['triglycerides', 'tg', 'الدهون الثلاثية'],
  ['hdl', 'hdl cholesterol', 'high density lipoprotein', 'الكوليسترول عالي الكثافة', 'الكوليسترول الجيد'],
  ['ldl', 'ldl cholesterol', 'low density lipoprotein', 'الكوليسترول منخفض الكثافة', 'الكوليسترول الضار'],
  ['vldl', 'vldl cholesterol', 'الكوليسترول شديد انخفاض الكثافة'],
  // Thyroid
  ['tsh', 'thyroid stimulating hormone', 'الهرمون المحفز للغدة الدرقية'],
  ['ft3', 'free t3', 'triiodothyronine free', 'هرمون t3 الحر'],
  ['ft4', 'free t4', 'thyroxine free', 'هرمون t4 الحر'],
  ['total t3', 't3 total', 'هرمون t3 الكلي'],
  ['total t4', 't4 total', 'هرمون t4 الكلي'],
  // Hematology
  ['cbc', 'complete blood count', 'صورة الدم الكاملة', 'تعداد الدم الكامل'],
  ['esr', 'erythrocyte sedimentation rate', 'سرعة ترسب كريات الدم الحمر', 'سرعة التثفل'],
  ['plt', 'platelets', 'platelet count', 'تعداد الصفائح الدموية'],
  ['ferritin', 'serum ferritin', 'مخزون الحديد', 'الفيريتين'],
  ['iron', 'serum iron', 'الحديد في المصل'],
  // Urine / Stool
  ['gue', 'general urine examination', 'فحص الادرار العام', 'تحليل الادرار العام'],
  ['gse', 'general stool examination', 'فحص الخروج العام', 'تحليل الخروج العام']
];

async function checkSynonyms() {
  const p = new PrismaClient({ datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } } });
  const allTests = await p.testCatalog.findMany({
    include: {
      _count: {
        select: {
          sampleTests: true,
          panelItems: true,
          deviceMappings: true,
          referenceRanges: true
        }
      }
    }
  });

  console.log('Checking medical synonyms across 154 tests...');

  for (const synList of SYNONYMS) {
    const matched = [];
    for (const t of allTests) {
      const name = (t.name || '').toLowerCase();
      const ar = (t.arabicName || '').toLowerCase();
      const code = (t.code || '').toLowerCase();

      const hits = synList.some(s => {
        const sNorm = s.toLowerCase();
        return name === sNorm || 
               name.includes(`(${sNorm})`) || 
               name.startsWith(`${sNorm} `) || 
               name.endsWith(` ${sNorm}`) ||
               code === sNorm ||
               ar.includes(sNorm);
      });

      if (hits) {
        matched.push(t);
      }
    }

    if (matched.length > 1) {
      // Check if they are truly duplicates
      console.log(`\n--- SYNONYM GROUP [${synList[0]} / ${synList[1]}]: Count = ${matched.length}`);
      for (const m of matched) {
        console.log(`  ID: ${m.id} | Code: ${m.code} | Name: "${m.name}" | Ar: "${m.arabicName}" | Cat: ${m.category} | Price: ${m.price} | Usage:`, m._count);
      }
    }
  }

  await p.$disconnect();
}

checkSynonyms().catch(console.error);
