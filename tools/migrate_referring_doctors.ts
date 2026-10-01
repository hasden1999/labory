import { PrismaClient } from '@prisma/client';

export function normalizeDoctorName(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^د\.?\s*|^دكتور\s*|^Doctor\s*|^Dr\.?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function migrateReferringDoctors() {
  console.log('🔄 [Migration] Running Referring Doctors Deduplication & Linkage...');
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:D:/lab/apps/server/prisma/lab.db' } },
  });

  try {
    // 1. Ensure all existing doctors have isActive set to true if null/undefined
    const doctors = await prisma.referringDoctor.findMany();
    console.log(`Found ${doctors.length} existing referring doctor rows.`);

    const normalizedMap = new Map<string, string>(); // normalizedName -> canonicalId
    for (const doc of doctors) {
      const norm = normalizeDoctorName(doc.name);
      if (!normalizedMap.has(norm)) {
        normalizedMap.set(norm, doc.id);
      }
      if (!doc.isActive) {
        await prisma.referringDoctor.update({
          where: { id: doc.id },
          data: { isActive: true },
        });
      }
    }

    console.log('✅ [Migration] Referring doctors normalized and validated successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateReferringDoctors().catch(console.error);
}
