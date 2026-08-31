import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { 
  getMachineHWID, 
  generateLicenseKey, 
  verifyLicenseKey, 
  verifySystemClockTampering, 
  getOrInitTrial 
} from '../utils/licensing';

export async function licenseRoutes(fastify: FastifyInstance) {
  // 1. Get License & Trial Status
  fastify.get('/license/status', async (request, reply) => {
    const hwid = getMachineHWID();
    const isClockTampered = await verifySystemClockTampering();

    if (isClockTampered) {
      return reply.send({
        hardwareId: hwid,
        isLicensed: false,
        isTrial: false,
        isClockTampered: true,
        message: 'تم اكتشاف تلاعب في ساعة النظام! يرجى ضبط تاريخ ووقت الكمبيوتر الصحيح.',
      });
    }

    // Check for active paid license
    const activePaidLicense = await prisma.license.findFirst({
      where: {
        tier: { not: 'TRIAL' },
        expiryDate: { gt: new Date() },
      },
      orderBy: { expiryDate: 'desc' },
    });

    if (activePaidLicense) {
      const now = new Date();
      const diffMs = new Date(activePaidLicense.expiryDate).getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return reply.send({
        hardwareId: hwid,
        isLicensed: true,
        isTrial: false,
        daysLeft,
        tier: activePaidLicense.tier,
        expiryDate: activePaidLicense.expiryDate,
        isClockTampered: false,
        message: activePaidLicense.tier === 'LIFETIME' ? 'نسخة مرخصة مدى الحياة' : `الاشتراك نشط (متبقي ${daysLeft} يوماً)`,
      });
    }

    // Fallback to 7-Day Free Trial
    const trial = await getOrInitTrial(hwid);

    return reply.send({
      hardwareId: hwid,
      isLicensed: !trial.isExpired,
      isTrial: true,
      daysLeft: trial.daysLeft,
      tier: 'TRIAL',
      expiryDate: trial.expiryDate,
      isExpired: trial.isExpired,
      isClockTampered: false,
      developerPhone: '07764271130',
      message: trial.isExpired 
        ? 'انتهت الفترة التجريبية للنظام. يرجى الاتصال بالمطور للتفعيل الدائم على الرقم 07764271130' 
        : `فترة تجريبية مجانية (متبقي ${trial.daysLeft} أيام)`,
    });
  });

  // 2. Activate Offline License Key
  fastify.post('/license/activate', async (request, reply) => {
    const { licenseKey } = request.body as { licenseKey: string };
    const hwid = getMachineHWID();

    if (!licenseKey || !licenseKey.trim()) {
      return reply.status(400).send({ message: 'يرجى إدخال مفتاح الترخيص' });
    }

    const verification = verifyLicenseKey(licenseKey.trim(), hwid);

    if (!verification.valid || !verification.payload) {
      return reply.status(400).send({ message: verification.message });
    }

    // Save activated license into DB
    const saved = await prisma.license.create({
      data: {
        hardwareId: hwid,
        signature: licenseKey.trim(),
        expiryDate: new Date(verification.payload.expiryDate),
        tier: verification.payload.tier,
      },
    });

    return reply.send({
      success: true,
      message: 'تم تفعيل ترخيص البرنامج بنجاح!',
      tier: saved.tier,
      expiryDate: saved.expiryDate,
    });
  });

  // 3. Developer Keygen Generator API
  fastify.post('/license/developer/generate', async (request, reply) => {
    const { hwid, daysValid, tier, labName, secretPasscode } = request.body as {
      hwid: string;
      daysValid?: number;
      tier?: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
      labName?: string;
      secretPasscode: string;
    };

    // Secret passcode check for developer
    if (secretPasscode !== 'admin123' && secretPasscode !== 'lab@2026') {
      return reply.status(401).send({ message: 'كلمة المرور الخاصة بالمطور غير صحيحة' });
    }

    if (!hwid || !hwid.trim()) {
      return reply.status(400).send({ message: 'كود بصمة جهاز العميل (HWID) مطلوب' });
    }

    const selectedTier = tier || (daysValid && daysValid >= 365 ? 'YEARLY' : 'MONTHLY');
    const validDays = selectedTier === 'LIFETIME' ? 36500 : (daysValid || 30);
    const key = generateLicenseKey(hwid.trim(), validDays, selectedTier, labName || 'مختبر طبي');

    return reply.send({
      success: true,
      hwid: hwid.trim(),
      tier: selectedTier,
      daysValid: validDays,
      licenseKey: key,
    });
  });
}
