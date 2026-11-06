// ==============================================================================
// وحدة تعريف العملات ومحرك التسعير والتحويل الذكي للفحوصات الطبية
// Multi-Currency & Clinical Auto-Pricing Engine
// ==============================================================================

export interface CurrencyDefinition {
  code: string;           // كود العملة القياسي (ISO 4217)
  symbol: string;         // رمز العملة المستخدم في التقارير والواجهة (مثلاً د.ع، ر.س، ل.س)
  nameAr: string;         // الاسم الكامل بالعربية
  countryAr: string;      // الدولة
  flag: string;           // رمز العلم
  rateToIQD: number;      // قيمة وحدة العملة مقابل الدينار العراقي (1 Unit = X IQD)
  roundingDecimals: number; // عدد الخانات العشرية (0 للأعداد الصحيحة)
  roundingStep: number;   // أقرب مضاعف للتقريب المريح (مثلاً 250 للدينار، 1000 لليرة، 1 للريال)
  exampleTestPrice: number; // سعر تقريبي لفحص صورة الدم الكاملة CBC بهذه العملة
}

export const SUPPORTED_CURRENCIES: CurrencyDefinition[] = [
  {
    code: 'IQD',
    symbol: 'د.ع',
    nameAr: 'دينار عراقي',
    countryAr: 'العراق',
    flag: '🇮🇶',
    rateToIQD: 1,
    roundingDecimals: 0,
    roundingStep: 500,
    exampleTestPrice: 15000,
  },
  {
    code: 'SAR',
    symbol: 'ر.س',
    nameAr: 'ريال سعودي',
    countryAr: 'السعودية',
    flag: '🇸🇦',
    rateToIQD: 350,
    roundingDecimals: 0,
    roundingStep: 5,
    exampleTestPrice: 45,
  },
  {
    code: 'SYP',
    symbol: 'ل.س',
    nameAr: 'ليرة سورية',
    countryAr: 'سوريا',
    flag: '🇸🇾',
    rateToIQD: 0.1, // 1 IQD = 10 SYP -> 1 SYP = 0.1 IQD
    roundingDecimals: 0,
    roundingStep: 1000,
    exampleTestPrice: 150000,
  },
  {
    code: 'JOD',
    symbol: 'د.أ',
    nameAr: 'دينار أردني',
    countryAr: 'الأردن',
    flag: '🇯🇴',
    rateToIQD: 1850,
    roundingDecimals: 1,
    roundingStep: 0.5,
    exampleTestPrice: 8,
  },
  {
    code: 'KWD',
    symbol: 'د.ك',
    nameAr: 'دينار كويتي',
    countryAr: 'الكويت',
    flag: '🇰🇼',
    rateToIQD: 4300,
    roundingDecimals: 2,
    roundingStep: 0.25,
    exampleTestPrice: 3.5,
  },
  {
    code: 'AED',
    symbol: 'د.إ',
    nameAr: 'درهم إماراتي',
    countryAr: 'الإمارات',
    flag: '🇦🇪',
    rateToIQD: 355,
    roundingDecimals: 0,
    roundingStep: 5,
    exampleTestPrice: 45,
  },
  {
    code: 'QAR',
    symbol: 'ر.ق',
    nameAr: 'ريال قطري',
    countryAr: 'قطر',
    flag: '🇶🇦',
    rateToIQD: 360,
    roundingDecimals: 0,
    roundingStep: 5,
    exampleTestPrice: 45,
  },
  {
    code: 'OMR',
    symbol: 'ر.ع',
    nameAr: 'ريال عماني',
    countryAr: 'عمان',
    flag: '🇴🇲',
    rateToIQD: 3400,
    roundingDecimals: 2,
    roundingStep: 0.5,
    exampleTestPrice: 4.5,
  },
  {
    code: 'BHD',
    symbol: 'د.ب',
    nameAr: 'دينار بحريني',
    countryAr: 'البحرين',
    flag: '🇧🇭',
    rateToIQD: 3450,
    roundingDecimals: 2,
    roundingStep: 0.5,
    exampleTestPrice: 4.5,
  },
  {
    code: 'EGP',
    symbol: 'ج.م',
    nameAr: 'جنيه مصري',
    countryAr: 'مصر',
    flag: '🇪🇬',
    rateToIQD: 27,
    roundingDecimals: 0,
    roundingStep: 10,
    exampleTestPrice: 550,
  },
  {
    code: 'LBP',
    symbol: 'ل.ل',
    nameAr: 'ليرة لبنانية',
    countryAr: 'لبنان',
    flag: '🇱🇧',
    rateToIQD: 0.0147, // 1 IQD = 68 LBP
    roundingDecimals: 0,
    roundingStep: 10000,
    exampleTestPrice: 1000000,
  },
  {
    code: 'LYD',
    symbol: 'د.ل',
    nameAr: 'دينار ليبي',
    countryAr: 'ليبيا',
    flag: '🇱🇾',
    rateToIQD: 270,
    roundingDecimals: 0,
    roundingStep: 5,
    exampleTestPrice: 55,
  },
  {
    code: 'DZD',
    symbol: 'د.ج',
    nameAr: 'دينار جزائري',
    countryAr: 'الجزائر',
    flag: '🇩🇿',
    rateToIQD: 9.8,
    roundingDecimals: 0,
    roundingStep: 50,
    exampleTestPrice: 1500,
  },
  {
    code: 'MAD',
    symbol: 'د.م',
    nameAr: 'درهم مغربي',
    countryAr: 'المغرب',
    flag: '🇲🇦',
    rateToIQD: 130,
    roundingDecimals: 0,
    roundingStep: 5,
    exampleTestPrice: 115,
  },
  {
    code: 'TND',
    symbol: 'د.ت',
    nameAr: 'دينار تونسي',
    countryAr: 'تونس',
    flag: '🇹🇳',
    rateToIQD: 420,
    roundingDecimals: 1,
    roundingStep: 1,
    exampleTestPrice: 35,
  },
  {
    code: 'YER',
    symbol: 'ر.ي',
    nameAr: 'ريال يمني',
    countryAr: 'اليمن',
    flag: '🇾🇪',
    rateToIQD: 5.2,
    roundingDecimals: 0,
    roundingStep: 100,
    exampleTestPrice: 2900,
  },
  {
    code: 'SDG',
    symbol: 'ج.س',
    nameAr: 'جنيه سوداني',
    countryAr: 'السودان',
    flag: '🇸🇩',
    rateToIQD: 2.2,
    roundingDecimals: 0,
    roundingStep: 100,
    exampleTestPrice: 6800,
  },
  {
    code: 'USD',
    symbol: '$',
    nameAr: 'دولار أمريكي',
    countryAr: 'عالمي',
    flag: '🇺🇸',
    rateToIQD: 1320,
    roundingDecimals: 0,
    roundingStep: 1,
    exampleTestPrice: 12,
  },
  {
    code: 'EUR',
    symbol: '€',
    nameAr: 'يورو أوروبي',
    countryAr: 'أوروبا',
    flag: '🇪🇺',
    rateToIQD: 1450,
    roundingDecimals: 0,
    roundingStep: 1,
    exampleTestPrice: 10,
  },
];

/**
 * البحث عن تعريف العملة بالرمز أو الكود
 */
export function findCurrency(symbolOrCode: string): CurrencyDefinition | null {
  if (!symbolOrCode) return null;
  const clean = symbolOrCode.trim().toLowerCase();
  return (
    SUPPORTED_CURRENCIES.find(
      (c) =>
        c.code.toLowerCase() === clean ||
        c.symbol.toLowerCase() === clean ||
        c.nameAr.toLowerCase().includes(clean)
    ) || null
  );
}

/**
 * حساب معامل التحويل الرياضي بين عملتين
 * multiplier = (قيمة عملة البداية بالدينار) / (قيمة عملة النهاية بالدينار)
 * السعر الجديد = السعر القديم * معامل التحويل
 */
export function calculateConversionMultiplier(fromSymbolOrCode: string, toSymbolOrCode: string): number {
  const from = findCurrency(fromSymbolOrCode) || { rateToIQD: 1 };
  const to = findCurrency(toSymbolOrCode) || { rateToIQD: 1 };

  if (to.rateToIQD <= 0) return 1;
  return from.rateToIQD / to.rateToIQD;
}

/**
 * تقريب السعر بما يناسب طبيعة وسوق العملة (بدون كسور مشوهة)
 */
export function roundPriceForCurrency(amount: number, targetSymbolOrCode: string): number {
  if (isNaN(amount) || amount <= 0) return 0;
  const curr = findCurrency(targetSymbolOrCode);

  if (!curr) {
    return Math.round(amount);
  }

  const step = curr.roundingStep || 1;
  const rawRounded = Math.round(amount / step) * step;

  if (curr.roundingDecimals > 0) {
    const factor = Math.pow(10, curr.roundingDecimals);
    return Math.round(rawRounded * factor) / factor;
  }

  return Math.max(step, Math.round(rawRounded));
}

/**
 * توليد عينات مقارنة حية وسريعة قبل تطبيق التحويل
 */
export function getSamplePriceConversions(fromSymbol: string, toSymbol: string, customMultiplier?: number) {
  const multiplier = customMultiplier !== undefined && customMultiplier > 0
    ? customMultiplier
    : calculateConversionMultiplier(fromSymbol, toSymbol);

  const sampleTests = [
    { code: 'CBC', name: 'صورة الدم الكاملة (CBC)', baseIqdPrice: 15000 },
    { code: 'FBS', name: 'السكر الصائم (FBS)', baseIqdPrice: 5000 },
    { code: 'LIPID', name: 'دهون الدم الشاملة (Lipid Profile)', baseIqdPrice: 25000 },
    { code: 'KFT', name: 'وظائف الكلى (Renal Function)', baseIqdPrice: 20000 },
    { code: 'TSH', name: 'هرمون الغدة الدرقية (TSH)', baseIqdPrice: 20000 },
  ];

  const fromCurr = findCurrency(fromSymbol) || { rateToIQD: 1 };

  return sampleTests.map((t) => {
    // احسب السعر التقريبي بالعملة الحالية
    const currentPrice = roundPriceForCurrency(t.baseIqdPrice / fromCurr.rateToIQD, fromSymbol);
    const convertedPrice = roundPriceForCurrency(currentPrice * multiplier, toSymbol);

    return {
      code: t.code,
      name: t.name,
      oldPrice: currentPrice,
      newPrice: convertedPrice,
    };
  });
}
