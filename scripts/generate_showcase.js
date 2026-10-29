// Generator script for LABRYO_25_REPORT_FORMATS_SHOWCASE.html
const fs = require('fs');
const path = require('path');

console.log('Generating Labryo 25 Report Formats Showcase...');

// Define SVG generators
function generateQrSvg(size = 44) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid #cbd5e1; padding: 2px; border-radius: 4px; background: #fff;">
      <rect width="64" height="64" fill="white"/>
      <rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="#0f172a" stroke-width="3"/>
      <rect x="9" y="9" width="8" height="8" fill="#0f172a"/>
      <rect x="42" y="4" width="18" height="18" rx="2" fill="none" stroke="#0f172a" stroke-width="3"/>
      <rect x="47" y="9" width="8" height="8" fill="#0f172a"/>
      <rect x="4" y="42" width="18" height="18" rx="2" fill="none" stroke="#0f172a" stroke-width="3"/>
      <rect x="9" y="47" width="8" height="8" fill="#0f172a"/>
      <rect x="26" y="8" width="4" height="4" fill="#0f172a"/>
      <rect x="34" y="8" width="4" height="4" fill="#0f172a"/>
      <rect x="26" y="16" width="4" height="4" fill="#0f172a"/>
      <rect x="34" y="16" width="4" height="4" fill="#0f172a"/>
      <rect x="26" y="26" width="12" height="12" fill="#0284c7"/>
      <rect x="8" y="26" width="4" height="4" fill="#0f172a"/>
      <rect x="16" y="32" width="4" height="4" fill="#0f172a"/>
      <rect x="42" y="26" width="4" height="4" fill="#0f172a"/>
      <rect x="52" y="30" width="4" height="4" fill="#0f172a"/>
      <rect x="26" y="44" width="4" height="4" fill="#0f172a"/>
      <rect x="34" y="48" width="4" height="4" fill="#0f172a"/>
      <rect x="46" y="46" width="10" height="10" fill="#0f172a"/>
    </svg>`;
}

function renderEmblemSvg(type, color = 'currentColor', size = 28) {
  if (type === 'tubes') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"></path><path d="M8.5 2h7"></path><path d="M9.5 12h5"></path><path d="M6 8v10c0 1.1.9 2 2 2"></path>
      </svg>`;
  }
  if (type === 'dna') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 15 5.5-5.5"></path><path d="M7.5 9.5 10 12l5.5-5.5"></path><path d="M10 22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2"></path><path d="M14 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2"></path><path d="m14 14.5 5.5-5.5"></path>
      </svg>`;
  }
  if (type === 'badge') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m9 12 2 2 4-4"></path>
      </svg>`;
  }
  if (type === 'blood') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
      </svg>`;
  }
  // Default: microscope
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 18h8"></path><path d="M3 22h18"></path><path d="M14 22a7 7 0 1 0-14 0"></path><path d="M9 14h2"></path><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"></path><path d="M12 6V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"></path>
    </svg>`;
}

function generateBarcodePatternSvg(code = '261028-09418') {
  return `
    <div style="background: repeating-linear-gradient(90deg, #0f172a, #0f172a 1.5px, transparent 1.5px, transparent 3px, #0f172a 3px, #0f172a 4.5px, transparent 4.5px, transparent 7px); width: 125px; height: 26px; border-radius: 2px;"></div>
    <div style="font-size: 8.5px; font-weight: 800; letter-spacing: 1px; color: #334155; margin-top: 2px; text-align: center; font-family: monospace;">SID: ${code}</div>
  `;
}

function renderDoctorStampSvg(labName = 'مختبر الرضا للتحليلات', docName = 'د. أحمد الرضا') {
  return `
    <div style="position: relative; width: 110px; height: 110px; display: inline-flex; align-items: center; justify-content: center;">
      <svg width="105" height="105" viewBox="0 0 120 120" style="transform: rotate(-12deg); opacity: 0.85;">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-dasharray="4,2"/>
        <circle cx="60" cy="60" r="48" fill="none" stroke="#1e3a8a" stroke-width="1.5"/>
        <path id="curveTop" d="M 20 60 A 40 40 0 0 1 100 60" fill="none" stroke="none" />
        <path id="curveBottom" d="M 100 60 A 40 40 0 0 1 20 60" fill="none" stroke="none" />
        <text font-size="8.5" font-weight="bold" fill="#1e3a8a" letter-spacing="1">
          <textPath href="#curveTop" startOffset="50%" text-anchor="middle">
            ★ VERIFIED & APPROVED ★
          </textPath>
        </text>
        <text font-size="8.5" font-weight="bold" fill="#1e3a8a">
          <textPath href="#curveBottom" startOffset="50%" text-anchor="middle">
            CLINICAL LABORATORY
          </textPath>
        </text>
        <circle cx="60" cy="60" r="28" fill="#1e3a8a" fill-opacity="0.08" stroke="#1e3a8a" stroke-width="1"/>
        <text x="60" y="55" font-size="8" font-weight="900" fill="#1e3a8a" text-anchor="middle">معتمد رسمي</text>
        <text x="60" y="67" font-size="7.5" font-weight="bold" fill="#1e3a8a" text-anchor="middle">LABRYO LIMS</text>
        <text x="60" y="77" font-size="6.5" fill="#475569" text-anchor="middle">ISO 15189</text>
      </svg>
      <div style="position: absolute; bottom: 12px; left: 10px; font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #1e3a8a; transform: rotate(-8deg); pointer-events: none; opacity: 0.9;">
        Dr. Ahmed
      </div>
    </div>
  `;
}

// 25 Designs Metadata & Profiles
const DESIGNS = [
  {
    id: '01_baghdad_royal',
    category: 'ROYAL',
    categoryName: 'ملكية ورسمية',
    title: '01. الملكي البغدادي المزدوج (Baghdad Royal Dual)',
    labName: 'مختبر الرضا للتحليلات المرضية التخصصية',
    labSubtitle: 'فحوصات سريرية ومناعية متقدمة - فحص الهرمونات ودلالات الأورام',
    docName: 'د. أحمد الرضا',
    docTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
    address: 'بغداد - الحارثية - شارع الكندي / مقابل مجمع ابن النفيس',
    phone: '0770 123 4567 - 0780 987 6543',
    license: 'MOH-IQ-2026-8842',
    reportTemplate: 'BAGHDAD_ROYAL_DUAL',
    headerStyle: 'regal_box',
    primaryColor: '#1e3a8a',
    secondaryColor: '#b45309',
    headerBgColor: '#1e3a8a',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'zebra',
    tableZebraStriping: true,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'التصميم الأكثر فخامة ورسمية للمختبرات الاستشارية الكبرى في بغداد، يتميز بإطار ملكي مزدوج مع شارة مذهبة وتنسيق شبكي محكم للبيانات.'
  },
  {
    id: '02_metropolis_teal',
    category: 'MODERN',
    categoryName: 'عصرية وحديثة',
    title: '02. متروبوليس الفيروزي العصري (Metropolis Teal Banner)',
    labName: 'مختبر العاصمة الاستشاري للتحاليل الطبية',
    labSubtitle: 'مركز متكامل للفحوصات الوراثية والموليكيولر PCR وفسلجة الدم',
    docName: 'د. ليث كمال الحمداني',
    docTitle: 'دكتوراه كيمياء سريرية وتشخيص جزيئي',
    address: 'بغداد - الكرخ - شارع المغرب / قرب ساحة قحطان',
    phone: '0771 555 4321',
    license: 'MOH-IQ-2026-4419',
    reportTemplate: 'MODERN',
    headerStyle: 'gradient_banner',
    primaryColor: '#0d9488',
    secondaryColor: '#14b8a6',
    headerBgColor: '#0d9488',
    headerTextColor: '#ffffff',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'tubes',
    labNameStyle: 'DEFAULT',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'نمط عصري انسيابي بألوان الفيروزي الطبي المستوحى من سلسلة مختبرات متروبوليس العالمية، مع بطاقات معلومات المريض العصرية.'
  },
  {
    id: '03_dr_lal_dual_wing',
    category: 'INTERNATIONAL',
    categoryName: 'دولية وثنائية اللغة',
    title: '03. الجناحان المتناظران ثنائي اللغة (Bilingual Dual Wings)',
    labName: 'مختبر الدكتور أحمد الشمري للتشخيص السريري',
    labSubtitle: 'Clinical & Reference Diagnostic Laboratories - NABL/ISO Standards',
    docName: 'Dr. Ahmed Al-Shammari, MD',
    docTitle: 'Consultant Clinical Pathologist & Hematologist',
    address: 'النجف الأشرف - شارع الإسكان - مجمع الأطباء الاستشاري',
    phone: '+964 780 112 2334',
    license: 'IQ-LAB-NABL-0912',
    reportTemplate: 'INDIAN_DUAL_WING',
    headerStyle: 'dual_wing',
    primaryColor: '#0f172a',
    secondaryColor: '#d97706',
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMPACT',
    fontFamily: 'Cairo',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'مستوحى من معايير Dr Lal PathLabs العالمية: جناح هوية سريري مجهري في اليمين، وجناح باركود العينة ورمز QR في اليسار.'
  },
  {
    id: '04_minimal_pure_laser',
    category: 'COMPACT',
    categoryName: 'موفرة للحبر واقتصادية',
    title: '04. النقي الاقتصادي الموفر للحبر (Minimal Pure Clean)',
    labName: 'مختبر دار السلام للتحليلات الطبية',
    labSubtitle: 'فحوصات سريعة ودقيقة بأسعار تعاونية معتمدة',
    docName: 'د. يوسف حامد الموصلي',
    docTitle: 'اختصاص باثولوجي وفحوصات عامة',
    address: 'نينوى - الموصل - حي الزهور / الشارع العام',
    phone: '0770 998 8776',
    license: 'MOH-IQ-2026-1102',
    reportTemplate: 'MINIMAL_PURE_LINE',
    headerStyle: 'minimal_pure',
    primaryColor: '#000000',
    secondaryColor: '#334155',
    headerBgColor: '#000000',
    headerTextColor: '#000000',
    patientLayout: 'compact',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMPACT',
    fontFamily: 'IBM Plex Sans Arabic',
    labEmblem: 'microscope',
    labNameStyle: 'DEFAULT',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: false,
    description: 'أفضل خيار للمختبرات ذات ضغط العمل المرتفع التي تستخدم طابعات الليزر بالأبيض والأسود؛ يوفر 100% من الحبر الملون مع أقصى وضوح.'
  },
  {
    id: '05_compact_space_saver',
    category: 'COMPACT',
    categoryName: 'موفرة للحبر واقتصادية',
    title: '05. الشريط المدمج عالي الكثافة (Compact Space-Saver Strip)',
    labName: 'مختبر الفحوصات الشاملة السريعة',
    labSubtitle: 'خدمات سحب الدم والتحاليل الفورية على مدار 24 ساعة',
    docName: 'د. حيدر جاسم البصري',
    docTitle: 'ماجستير تحليلات سريرية',
    address: 'البصرة - العشار - تقاطع الطويسة / عمارة النور',
    phone: '0771 223 3445',
    license: 'MOH-IQ-2026-3391',
    reportTemplate: 'COMPACT_MICRO_STRIP',
    headerStyle: 'compact_strip',
    primaryColor: '#334155',
    secondaryColor: '#0284c7',
    headerBgColor: '#f1f5f9',
    headerTextColor: '#0f172a',
    patientLayout: 'compact',
    tableStyle: 'compact',
    tableZebraStriping: false,
    tableRowSpacing: 'COMPACT',
    fontFamily: 'Almarai',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: false,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'ترويسة فائقة الضغط تشغل فقط 28 ملم من رأس الورقة، مما يتيح طباعة أكثر من 20 تحليلاً في ورقة A4 واحدة دون الحاجة لصفحة ثانية.'
  },
  {
    id: '06_regal_gold_frame',
    category: 'ROYAL',
    categoryName: 'ملكية ورسمية',
    title: '06. الإطار الملكي الذهبي الفاخر (Royal Gold Executive)',
    labName: 'مختبر النخبة الاستشاري للتحليلات الدقيقة',
    labSubtitle: 'Diagnostic Excellence & Specialized Clinical Pathology',
    docName: 'د. سرمد عبد الخالق البرزنجي',
    docTitle: 'استشاري أمراض الدم والوراثة الجزيئية',
    address: 'أربيل - شارع 40 متري / مجمع الأطباء الملكي',
    phone: '0750 445 6789 - 0770 111 2233',
    license: 'MOH-KRG-2026-904',
    reportTemplate: 'REGAL_GOLD_FRAME',
    headerStyle: 'gold_frame',
    primaryColor: '#0f172a',
    secondaryColor: '#d97706',
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    patientLayout: 'classic_box',
    tableStyle: 'grid',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'badge',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'مظهر VIP كحلي غامق مع لمسات ذهبية وشارة اعتماد ملكية وتأطير رسمي كامل لصندوق المريض وجدول النتائج.'
  },
  {
    id: '07_smart_digital_card',
    category: 'MODERN',
    categoryName: 'عصرية وحديثة',
    title: '07. البطاقة الرقمية الذكية (Smart Digital Card with QR)',
    labName: 'مختبر المستقبل الذكي للتحليلات المرضية',
    labSubtitle: 'نظام الربط الإلكتروني الفوري ومصادقة النتائج السحابية',
    docName: 'د. علي حسين الموسوي',
    docTitle: 'دكتوراه باثولوجيا وتشخيص مناعي',
    address: 'كربلاء المقدسة - حي الحسين / مقابل مستشفى السفير',
    phone: '0781 999 8877',
    license: 'MOH-IQ-2026-5521',
    reportTemplate: 'SMART_DIGITAL',
    headerStyle: 'smart_digital',
    primaryColor: '#0f172a',
    secondaryColor: '#38bdf8',
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'IBM Plex Sans Arabic',
    labEmblem: 'dna',
    labNameStyle: 'MODERN_BADGE',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'ترويسة داكنة تكنولوجية حديثة بلمسات سماوية بارزة تسلط الضوء على فحص الكود الذكي QR للتحقق المباشر من النتيجة أونلاين.'
  },
  {
    id: '08_multi_accredited_iso',
    category: 'INTERNATIONAL',
    categoryName: 'دولية وثنائية اللغة',
    title: '08. الاعتماد الدولي والجودة المخبرية (ISO 15189 / CAP)',
    labName: 'المختبر المرجعي الوطني المعتمد للجودة المخبرية',
    labSubtitle: 'Accredited Reference Medical Diagnostic Laboratories',
    docName: 'أ. د. خليل إبراهيم الزبيدي',
    docTitle: 'رئيس قسم الباثولوجيا السريرية - مقيم جودة دولي ISO',
    address: 'بغداد - الكرادة خارج / مجمع العلوية الطبي الدولي',
    phone: '0770 333 4444 - 0780 222 1111',
    license: 'ISO-15189:2022 / CAP-IQ-774',
    reportTemplate: 'MULTI_ACCREDITED',
    headerStyle: 'accredited_badge',
    primaryColor: '#0c4a6e',
    secondaryColor: '#166534',
    headerBgColor: '#0c4a6e',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'zebra',
    tableZebraStriping: true,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'badge',
    labNameStyle: 'ELEGANT_BORDER',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'مخصص للمختبرات المعتمدة الحاصلة على شهادات الجودة؛ يحتوي على شريط أوسمة معتمد (ISO 15189, JCI, CAP, EQAS) لتعزيز موثوقية التقرير.'
  },
  {
    id: '09_bauhaus_architectural_grid',
    category: 'MODERN',
    categoryName: 'عصرية وحديثة',
    title: '09. الشبكة المعمارية المقسمة (Bauhaus Architectural Grid)',
    labName: 'مختبر التقنيات الطبية الحديثة',
    labSubtitle: 'معهد الفحوصات النوعية والتشخيص المجهري المتقدم',
    docName: 'د. نوزاد كمال الأوجي',
    docTitle: 'استشاري علوم المختبرات السريرية',
    address: 'كركوك - طريق بغداد / عمارة الماس الطبية',
    phone: '0770 887 7665',
    license: 'MOH-IQ-2026-6632',
    reportTemplate: 'BAUHAUS_GRID',
    headerStyle: 'bauhaus_grid',
    primaryColor: '#1e293b',
    secondaryColor: '#64748b',
    headerBgColor: '#f8fafc',
    headerTextColor: '#0f172a',
    patientLayout: 'grid',
    tableStyle: 'grid',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Cairo',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'توزيع هندسي شبكي ثلاثي الأقسام يقسم الترويسة بدقة بين هوية المختبر، وبيانات الاستشاري، ومربع الباركود والتحقق.'
  },
  {
    id: '10_aurora_azure_wave',
    category: 'MODERN',
    categoryName: 'عصرية وحديثة',
    title: '10. الموجة الانسيابية العصرية (Aurora Azure Wave)',
    labName: 'مختبر الأفق للتحليلات الهرمونية والمناعية',
    labSubtitle: 'Horizon Specialized Diagnostic Laboratory & Immuno-Assay Center',
    docName: 'د. ريفان سامان السليماني',
    docTitle: 'دكتوراه غدد صماء ومناعة تشخيصية',
    address: 'السليمانية - شارع سالم / مجمع شاهان الطبي',
    phone: '0770 144 2233',
    license: 'MOH-KRG-2026-402',
    reportTemplate: 'AZURE_WAVE',
    headerStyle: 'aurora_wave',
    primaryColor: '#0284c7',
    secondaryColor: '#06b6d4',
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'dna',
    labNameStyle: 'DEFAULT',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'بانر متدرج انسيابي ينتهي بمنحنى موجي فيكتور ناعم باللون الأزرق السماوي، يمنح التقرير هوية حيوية وعصرية لافتة.'
  },
  {
    id: '11_aurora_emerald_wave',
    category: 'MODERN',
    categoryName: 'عصرية وحديثة',
    title: '11. الموجة الانسيابية الزمردية (Aurora Emerald Wave)',
    labName: 'مختبر الحياة الاستشاري للتحاليل السريرية',
    labSubtitle: 'دقة عالية في الفحص المخبري وسرعة في إنجاز النتائج',
    docName: 'د. قاسم محمد الخزاعي',
    docTitle: 'اختصاص أمراض باطنية وكيمياء دم',
    address: 'القادسية - الديوانية - شارع المواكب / قرب المستشفى العام',
    phone: '0780 123 9988',
    license: 'MOH-IQ-2026-7781',
    reportTemplate: 'EMERALD_WAVE',
    headerStyle: 'aurora_wave',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    headerBgColor: '#064e3b',
    headerTextColor: '#ffffff',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'tubes',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'تصميم بألوان خضراء زمردية طبيعية مع منحنى موجي سفلي أنيق، يرمز للصحة والنقاء والموثوقية السريرية.'
  },
  {
    id: '12_executive_luxury_dark',
    category: 'ROYAL',
    categoryName: 'ملكية ورسمية',
    title: '12. البانر التنفيذي الداكن المذهب (Executive Luxury Banner)',
    labName: 'مختبر بابل التخصصي للتشخيص المتقدم',
    labSubtitle: 'مركز الاستشارات المرضية المتقدمة وتحاليل المناعة والأورام',
    docName: 'د. عمار فؤاد البابلي',
    docTitle: 'استشاري التحليلات المرضية السريرية',
    address: 'بابل - الحلة - شارع 40 / مجمع الفرات الطبي',
    phone: '0780 444 5566',
    license: 'MOH-IQ-2026-9901',
    reportTemplate: 'EXECUTIVE_LUXURY',
    headerStyle: 'executive_dark',
    primaryColor: '#0f172a',
    secondaryColor: '#b45309',
    headerBgColor: '#0f172a',
    headerTextColor: '#f8fafc',
    patientLayout: 'classic_box',
    tableStyle: 'grid',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'badge',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'بانر فحم داكن ملكي مع خط سفلي ذهبي عريض ونصوص ذهبية فاخرة، وتأطير دقيق لبيانات المريض ونتائج الفحص.'
  },
  {
    id: '13_vertical_purple_spine',
    category: 'SPECIALIZED',
    categoryName: 'تخصصية وأمراض دم',
    title: '13. الشريط الجانبي البنفسجي التخصصي (Vertical Spine Accent)',
    labName: 'مختبر الأرجوان التخصصي للهرمونات والجينات',
    labSubtitle: 'Advanced Endocrine, Genetics & Clinical Immunology',
    docName: 'د. ريزكار إدريس الدوسكي',
    docTitle: 'استشاري الغدد الصماء والتحليلات الجينية',
    address: 'دهوك - شارع مالطا / مجمع كوردستان الطبي',
    phone: '0750 998 7766',
    license: 'MOH-KRG-2026-881',
    reportTemplate: 'VERTICAL_SPINE',
    headerStyle: 'vertical_accent',
    primaryColor: '#7c3aed',
    secondaryColor: '#4f46e5',
    headerBgColor: '#7c3aed',
    headerTextColor: '#0f172a',
    patientLayout: 'grid',
    tableStyle: 'zebra',
    tableZebraStriping: true,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Almarai',
    labEmblem: 'dna',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'يتميز بعمود عمودي بنفسجي ملكي بارز على حافة الترويسة، يمنح التقرير تمييزاً بصرياً فورياً عند الفرز الورقي.'
  },
  {
    id: '14_glass_capsule_split',
    category: 'MODERN',
    categoryName: 'عصرية وحديثة',
    title: '14. الكبسولة السريرية المقسمة (Modern Clinical Split Capsule)',
    labName: 'مختبر الشفاء التخصصي للتحليلات المرضية',
    labSubtitle: 'فحوصات كيمياء الدم، الهرمونات، والأمراض المناعية',
    docName: 'د. وليد خالد الواسطي',
    docTitle: 'اختصاصي تحليلات سريرية وأنسجة',
    address: 'واسط - الكوت - حي المعلمين / مقابل مستشفى الكرامة',
    phone: '0781 112 3344',
    license: 'MOH-IQ-2026-3204',
    reportTemplate: 'GLASS_CAPSULE',
    headerStyle: 'glass_capsule',
    primaryColor: '#0284c7',
    secondaryColor: '#0d9488',
    headerBgColor: '#0284c7',
    headerTextColor: '#0f172a',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'كبسولتان منفصلتان بحواف دائرية ناعمة؛ الكبسولة الأولى تحتوي على هوية المختبر، والكبسولة الثانية تضم بيانات الاستشاري ورمز التحقق.'
  },
  {
    id: '15_classic_split_trust_blue',
    category: 'CLINICAL',
    categoryName: 'سريرية كلاسيكية',
    title: '15. الكلاسيكي الطبي المتوازن (Classic Medical Split)',
    labName: 'مختبر الحكمة للتحليلات المرضية',
    labSubtitle: 'التشخيص المخبري المتكامل - خبرة عريقة وأجهزة حديثة',
    docName: 'د. عمر طه السامرائي',
    docTitle: 'طبيب اختصاص علم الأمراض والتحاليل',
    address: 'صلاح الدين - سامراء - حي الجبيرية / شارع الأطباء',
    phone: '0770 776 5544',
    license: 'MOH-IQ-2026-2219',
    reportTemplate: 'CLASSIC',
    headerStyle: 'default',
    primaryColor: '#0284c7',
    secondaryColor: '#475569',
    headerBgColor: '#0284c7',
    headerTextColor: '#0f172a',
    patientLayout: 'grid',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'النمط التقليدي المعتمد والمحبوب لدى أغلب الأطباء؛ خطوط زرقاء هادئة، ترتيب واضح، ورصانة طبية لا تفقد بريقها.'
  },
  {
    id: '16_laser_monochrome_solid',
    category: 'COMPACT',
    categoryName: 'موفرة للحبر واقتصادية',
    title: '16. مونوكروم الليزر النقي (Laser Monochrome Black & White)',
    labName: 'مختبر الرافدين للتحاليل الطبية',
    labSubtitle: 'سرعة، دقة، ومطابقة للمواصفات الصحية الرسمية',
    docName: 'د. ماجد حميد الراوي',
    docTitle: 'اختصاص تحليلات مرضية وسريرية',
    address: 'بغداد - المنصور - شارع 14 رمضان / عمارة النور',
    phone: '0770 123 8899',
    license: 'MOH-IQ-2026-8803',
    reportTemplate: 'BLACK_WHITE',
    headerStyle: 'minimal_pure',
    primaryColor: '#000000',
    secondaryColor: '#475569',
    headerBgColor: '#000000',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: false,
    description: 'شريط أسود داكن علوي مع كتابة بيضاء صريحة وتدرجات رمادية نقية متوافقة بنسبة 100% مع الطابعات الليزرية بدون استهلاك أي أحبار ملونة.'
  },
  {
    id: '17_academic_hospital_research',
    category: 'INTERNATIONAL',
    categoryName: 'دولية وثنائية اللغة',
    title: '17. المركز الأكاديمي والاستشفائي (Academic Hospital & Research)',
    labName: 'مختبر مستشفى الجامعة التعليمي الاستشاري',
    labSubtitle: 'Department of Pathology & Laboratory Medicine - University Hospital',
    docName: 'Prof. Dr. Thamer Al-Dulaimi, MD, PhD',
    docTitle: 'Professor & Head of Clinical Pathology Department',
    address: 'الأنبار - الرمادي - شارع 17 / مجمع المشافي الجامعية',
    phone: '0780 776 1122',
    license: 'MOH-ACAD-2026-104',
    reportTemplate: 'ACADEMIC_HOSPITAL',
    headerStyle: 'default',
    primaryColor: '#0f172a',
    secondaryColor: '#1e3a8a',
    headerBgColor: '#0f172a',
    headerTextColor: '#0f172a',
    patientLayout: 'grid',
    tableStyle: 'grid',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Cairo',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'إطار أكاديمي مزدوج رسمي مع توثيق اسم المشرف والألقاب العلمية والاعتمادات الجامعية، مناسب لمختبرات كليات الطب والمستشفيات.'
  },
  {
    id: '18_hematology_crimson',
    category: 'SPECIALIZED',
    categoryName: 'تخصصية وأمراض دم',
    title: '18. استشاري الدم ودياجنوستيك (Hematology & Diagnostics Crimson)',
    labName: 'مختبر أمراض الدم والوراثة السريرية',
    labSubtitle: 'فحوصات التخثر، نخاع العظم، فقر الدم الوراثي واللوكيميا',
    docName: 'د. منى عبد الستار الكرخي',
    docTitle: 'استشارية أمراض الدم السريرية ونقل الدم',
    address: 'بغداد - الكرخ - ساحة الشهداء / المركز التخصصي للدم',
    phone: '0770 665 4433',
    license: 'MOH-IQ-2026-9112',
    reportTemplate: 'CBC_DIAGNOSTIC',
    headerStyle: 'gradient_banner',
    primaryColor: '#881337',
    secondaryColor: '#dc2626',
    headerBgColor: '#881337',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'zebra',
    tableZebraStriping: true,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'blood',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'ألوان عنابية وحمراء داكنة متخصصة بأمراض الدم وبنوك الدم وفحوصات التخثر، مع إبراز فوري للقيم الشاذة والحرجة (Panic).'
  },
  {
    id: '19_family_care_warm',
    category: 'CLINICAL',
    categoryName: 'سريرية كلاسيكية',
    title: '19. باقة العناية بالأسرة والطفل (Family Care & Pediatrics)',
    labName: 'مختبر الأم والطفل للتشخيص المبكر',
    labSubtitle: 'فحوصات حديثي الولادة، باقات النمو، وصحة المرأة الحامل',
    docName: 'د. هدى فائق السعدي',
    docTitle: 'اختصاص طب الأطفال وفحوصات حديثي الولادة',
    address: 'ميسان - العمارة - حي الحسين / مجاور مستشفى الولادة',
    phone: '0780 554 3322',
    license: 'MOH-IQ-2026-4421',
    reportTemplate: 'PEDIATRIC_CARE',
    headerStyle: 'gradient_banner',
    primaryColor: '#ea580c',
    secondaryColor: '#38bdf8',
    headerBgColor: '#ea580c',
    headerTextColor: '#ffffff',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'blood',
    labNameStyle: 'DEFAULT',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'ألوان دافئة ومريحة تجمع بين البرتقالي الدافئ والسماوي الهادئ، مصممة خصيصاً لمراكز رعاية الطفولة والأمومة ومختبرات الأسرة.'
  },
  {
    id: '20_bilingual_wings_central',
    category: 'INTERNATIONAL',
    categoryName: 'دولية وثنائية اللغة',
    title: '20. ترويسة الجناحين المركزية (Central Bilingual Dual Wing)',
    labName: 'مختبر التحليلات السريرية المركزي',
    labSubtitle: 'الريادة في دقة التحليل وسرعة إرسال النتائج عبر واتساب',
    docName: 'د. نبيل صبحي القيسي',
    docTitle: 'اختصاص كيمياء مرضية وأمصال',
    address: 'ديالى - بعقوبة - شارع المحافظة / مجمع الشفاء',
    phone: '0771 998 8112',
    license: 'MOH-IQ-2026-6119',
    reportTemplate: 'BILINGUAL_WINGS',
    headerStyle: 'dual_wing',
    primaryColor: '#0d9488',
    secondaryColor: '#1e3a8a',
    headerBgColor: '#0d9488',
    headerTextColor: '#0f172a',
    patientLayout: 'grid',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'شعار مجهري دائري في المنتصف يفصل بين الهوية العربية في الجانب الأيمن والترجمة الإنجليزية الرسمية في الجانب الأيسر.'
  },
  {
    id: '21_specialized_multi_matrix',
    category: 'SPECIALIZED',
    categoryName: 'تخصصية وأمراض دم',
    title: '21. التخصصي المتعدد الأقسام (Specialized Multi-Department Matrix)',
    labName: 'مختبر الفارابي الطبي التخصصي',
    labSubtitle: 'أقسام الكيمياء، المناعة، الهرمونات، والأحياء المجهرية',
    docName: 'د. باسم عادل الخفاجي',
    docTitle: 'استشاري علوم المختبرات السريرية',
    address: 'ذي قار - الناصرية - شارع الحبوبي / مجمع الفارابي',
    phone: '0780 334 4556',
    license: 'MOH-IQ-2026-8114',
    reportTemplate: 'SPECIALIZED',
    headerStyle: 'gradient_banner',
    primaryColor: '#881337',
    secondaryColor: '#be123c',
    headerBgColor: '#881337',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'zebra',
    tableZebraStriping: true,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'microscope',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'بانر نبيذي مميز مع تقسيم لوني للنتائج وجدول مخطط يوضح تفاصيل الفحوصات المتعددة في زيارة واحدة.'
  },
  {
    id: '22_deep_sapphire_suite',
    category: 'ROYAL',
    categoryName: 'ملكية ورسمية',
    title: '22. الياقوتي العميق الفاخر (Deep Sapphire Clinical Suite)',
    labName: 'مختبر الياقوت للتشخيص المناعي الدقيق',
    labSubtitle: 'Precision Diagnostics, Tumor Markers & Flow Cytometry',
    docName: 'د. حيدر عبد الأمير الحسني',
    docTitle: 'دكتوراه تشخيص مناعي وأورام',
    address: 'النجف الأشرف - حي العدالة / مجاور مستشفى الصدر التعليمي',
    phone: '0780 889 9001',
    license: 'MOH-IQ-2026-5509',
    reportTemplate: 'MODERN',
    headerStyle: 'gradient_banner',
    primaryColor: '#4338ca',
    secondaryColor: '#818cf8',
    headerBgColor: '#4338ca',
    headerTextColor: '#ffffff',
    patientLayout: 'cards',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'dna',
    labNameStyle: 'MODERN_BADGE',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'درجات اللون الياقوتي الأزرق العميق مع بطاقات المريض الحديثة وجدول نتائج عالي الدقة ورمز تحقق مباشر.'
  },
  {
    id: '23_clinical_charcoal_steel',
    category: 'CLINICAL',
    categoryName: 'سريرية كلاسيكية',
    title: '23. الكربوني والصلب نمط مايو كلينك (Clinical Charcoal & Steel)',
    labName: 'مختبر الاستشارات السريرية المتقدمة',
    labSubtitle: 'Mayo-Aligned Diagnostic Pathology & Clinical Reference',
    docName: 'Dr. Ziad T. Al-Rawi, FRCPath',
    docTitle: 'Consultant Clinical Pathologist',
    address: 'أربيل - عينكاوة - شارع المنتزه / مجمع هولير الدولي',
    phone: '+964 750 112 4455',
    license: 'MOH-KRG-2026-119',
    reportTemplate: 'MAYO_EXECUTIVE',
    headerStyle: 'default',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    headerBgColor: '#0f172a',
    headerTextColor: '#0f172a',
    patientLayout: 'classic_box',
    tableStyle: 'grid',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'IBM Plex Sans Arabic',
    labEmblem: 'microscope',
    labNameStyle: 'DEFAULT',
    enableQrCode: true,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'مستوحى من تقارير مستشفى مايو كلينك؛ خط سفلي كحلي كربوني رفيع مع خطوط مطبوعة فائقة الوضوح والهدوء والتركيز على الأرقام.'
  },
  {
    id: '24_security_watermark_shield',
    category: 'ROYAL',
    categoryName: 'ملكية ورسمية',
    title: '24. الأمان المائي المشفر ضد التزوير (Security Watermark & Shield)',
    labName: 'مختبر الأمانة للتحليلات الطبية والسموم',
    labSubtitle: 'معتمد رسمياً للفحوصات التوظيفية، السموم، والتقارير العدلية',
    docName: 'د. سامي عزيز الجبوري',
    docTitle: 'استشاري الطب العدلي والتحاليل السمية',
    address: 'بغداد - شارع فلسطين / ساحة بيروت - مجمع الرافدين الطبي',
    phone: '0770 551 1223',
    license: 'MOH-SEC-2026-007',
    reportTemplate: 'REGAL_GOLD_FRAME',
    headerStyle: 'gold_frame',
    primaryColor: '#1e3a8a',
    secondaryColor: '#b45309',
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    patientLayout: 'grid',
    tableStyle: 'zebra',
    tableZebraStriping: true,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'badge',
    labNameStyle: 'BOLD',
    enableQrCode: true,
    enableWatermark: true,
    watermarkText: 'ORIGINAL REPORT - مختبر معتمد رسمي',
    watermarkOpacity: 0.08,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'تصميم عالي الحماية يتضمن علامة مائية أمنية قطرياً خلف النتائج، وباركود مشفر وكود QR وختم استشاري رسمي مانع للتزوير.'
  },
  {
    id: '25_preprinted_stationery',
    category: 'STATIONERY',
    categoryName: 'ورق مروّس جاهز',
    title: '25. الورق المروّس المطبوع مسبقاً (Preprinted Stationery Mode)',
    labName: '[مطبوع مسبقاً في المطبعة - ترويسة فارغة 35mm]',
    labSubtitle: 'تفريغ كامل للترويسة لطباعة النتائج فوق فورمة المطبعة الجاهزة',
    docName: 'د. الطبيب الاستشاري',
    docTitle: 'استشاري التحليلات المرضية',
    address: 'بغداد - العراق',
    phone: '0770 000 0000',
    license: '',
    reportTemplate: 'PREPRINTED_STATIONERY',
    headerStyle: 'default',
    isPreprinted: true,
    primaryColor: '#0284c7',
    secondaryColor: '#475569',
    headerBgColor: '#ffffff',
    headerTextColor: '#0f172a',
    patientLayout: 'grid',
    tableStyle: 'clean_lines',
    tableZebraStriping: false,
    tableRowSpacing: 'COMFORTABLE',
    fontFamily: 'Tajawal',
    labEmblem: 'none',
    labNameStyle: 'DEFAULT',
    enableQrCode: false,
    showFooterSignature: true,
    showRangeBar: true,
    description: 'مخصص للمختبرات التي تملك ورقاً مروّساً فاخراً من المطابع؛ يقوم النظام بترك هامش علوي حر (35-45mm) ويطبع فقط بيانات المريض والنتائج بدقة مليمترية.'
  }
];

// Helper to render Header for each design
function renderHeaderForDesign(d) {
  if (d.isPreprinted) {
    return `
      <div style="height: 38mm; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; color: #64748b;">
        <span style="font-size: 13px; font-weight: 800;">📄 مساحة مخصصة لترويسة الورق المروّس الجاهز للمطبعة (38mm Reserved Margin)</span>
        <span style="font-size: 10.5px; margin-top: 4px;">يقوم برنامج لابريو بتخطي هذه المساحة بدقة وطباعة النتائج على الفورمة الجاهزة</span>
      </div>
    `;
  }

  // 1. Baghdad Royal Dual
  if (d.headerStyle === 'regal_box') {
    return `
      <div class="baghdad-royal-dual-header" style="border: 2px solid ${d.primaryColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; background: #ffffff !important; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid ${d.secondaryColor}; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: ${d.primaryColor}; color: #fbbf24; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${renderEmblemSvg(d.labEmblem, '#fbbf24', 28)}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="margin: 0; font-size: 19px; color: ${d.primaryColor} !important; font-weight: 900; line-height: 1.25;">${d.labName}</h1>
              <div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-top: 3px;">${d.labSubtitle}</div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">العنوان: ${d.address} | هاتف: ${d.phone}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; text-align: left;" dir="ltr">
            ${d.license ? `
              <div style="text-align: right; border-right: 1.5px solid #cbd5e1; padding-right: 8px;">
                <div style="font-size: 8.5px; color: #64748b; font-family: monospace;">Lic: ${d.license}</div>
                <div style="font-size: 8px; font-weight: 800; color: #16a34a;">MOH ACCREDITED</div>
              </div>` : ""}
            ${d.enableQrCode ? generateQrSvg(40) : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 2. Dual Wing
  if (d.headerStyle === 'dual_wing') {
    return `
      <div class="indian-dual-wing-header" style="border-bottom: 2.5px solid ${d.primaryColor}; padding-bottom: 12px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 50px; height: 50px; border-radius: 10px; background: ${d.primaryColor}; color: #fbbf24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
              ${renderEmblemSvg(d.labEmblem, '#fbbf24', 30)}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="margin: 0; font-size: 18.5px; color: ${d.primaryColor} !important; font-weight: 900;">${d.labName}</h1>
              <div style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 2px;">${d.labSubtitle}</div>
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                <span>${d.address} | Tel: ${d.phone}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; text-align: left; flex-shrink: 0;" dir="ltr">
            <div>
              ${generateBarcodePatternSvg('261028-09418')}
            </div>
            ${d.enableQrCode ? generateQrSvg(42) : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 3. Modern Gradient Banner
  if (d.headerStyle === 'gradient_banner') {
    return `
      <div class="modern-header-banner" style="background: linear-gradient(135deg, ${d.primaryColor} 0%, ${d.secondaryColor} 100%) !important; color: #ffffff !important; padding: 12px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; text-align: right;">
          <div style="width: 44px; height: 44px; border-radius: 8px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${renderEmblemSvg(d.labEmblem, '#ffffff', 26)}
          </div>
          <div style="flex: 1;">
            <h1 style="margin: 0; font-size: 19px; color: #ffffff !important; font-weight: 900;">${d.labName}</h1>
            <p style="margin: 2px 0 0 0; font-size: 10.5px; color: rgba(255,255,255,0.92) !important; font-weight: 600;">${d.labSubtitle}</p>
            <p style="margin: 3px 0 0 0; font-size: 9.5px; color: rgba(255,255,255,0.85) !important;">العنوان: ${d.address} | هاتف: ${d.phone}</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
          ${d.enableQrCode ? `
            <div style="background: #ffffff; padding: 3px; border-radius: 6px; display: flex; flex-direction: column; align-items: center;">
              ${generateQrSvg(38)}
            </div>
          ` : ''}
          <div style="background: rgba(255, 255, 255, 0.18) !important; padding: 6px 10px; border-radius: 6px; text-align: left;" dir="ltr">
            <h4 style="font-size: 11px; font-weight: 800; color: #ffffff !important; margin: 0;">${d.docName}</h4>
            <p style="font-size: 9px; color: rgba(255,255,255,0.9) !important; margin: 2px 0 0 0;">${d.docTitle}</p>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Minimal Pure Line
  if (d.headerStyle === 'minimal_pure') {
    const isSolidBlack = d.reportTemplate === 'BLACK_WHITE';
    if (isSolidBlack) {
      return `
        <div class="mono-header-banner" style="background: #000000 !important; color: #ffffff !important; border: 2px solid #000000; padding: 12px 16px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; text-align: right;">
            <div style="width: 44px; height: 44px; border: 1.5px solid #ffffff; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #ffffff;">
              ${renderEmblemSvg(d.labEmblem, '#ffffff', 26)}
            </div>
            <div>
              <h1 style="margin: 0; font-size: 19px; color: #ffffff !important; font-weight: 900;">${d.labName}</h1>
              <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #e2e8f0 !important;">${d.labSubtitle}</p>
              <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #cbd5e1 !important;">${d.address} | ${d.phone}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; text-align: left;" dir="ltr">
            ${d.enableQrCode ? `
              <div style="background: #ffffff; padding: 3px; border-radius: 4px;">
                ${generateQrSvg(38)}
              </div>` : ''}
            <div style="background: #000000; border: 1px solid #ffffff; padding: 6px 10px; border-radius: 4px; text-align: left;" dir="ltr">
              <h4 style="font-size: 11px; font-weight: 900; color: #ffffff !important; margin: 0;">${d.docName}</h4>
              <p style="font-size: 9px; color: #e2e8f0 !important; margin: 2px 0 0 0;">${d.docTitle}</p>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="minimal-pure-header" style="border-bottom: 1.5px solid #000000; padding-bottom: 10px; margin-bottom: 12px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <div style="width: 44px; height: 44px; border: 1.5px solid #000000; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #000000; flex-shrink: 0;">
              ${renderEmblemSvg(d.labEmblem, '#000000', 26)}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="margin: 0; font-size: 18px; color: #000000 !important; font-weight: 900;">${d.labName}</h1>
              <div style="font-size: 10px; color: #334155; margin-top: 2px;">${d.labSubtitle}</div>
              <div style="font-size: 9px; color: #475569; margin-top: 2px;">${d.address} | ${d.phone}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; text-align: left;" dir="ltr">
            <div style="font-size: 8.5px; font-family: monospace; color: #000000; border-left: 1px solid #000000; padding-left: 8px;">
              <div>STATUS: <strong>AUTHORIZED</strong></div>
              <div>DATE: 2026-10-28 10:15</div>
            </div>
            ${d.enableQrCode ? `
              <div style="border: 1px solid #000000; padding: 2px; background: #fff;">
                ${generateQrSvg(38)}
              </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 5. Compact Strip
  if (d.headerStyle === 'compact_strip') {
    return `
      <div class="compact-micro-header" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
          <div style="width: 28px; height: 28px; background: #0f172a; color: #fbbf24; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            ${renderEmblemSvg(d.labEmblem, '#fbbf24', 18)}
          </div>
          <span style="font-size: 14.5px; font-weight: 900; color: #0f172a;">${d.labName}</span>
          <span style="font-size: 9.5px; color: #64748b; margin-right: 8px;">| ${d.address} | ${d.phone}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 9.5px; font-family: monospace;" dir="ltr">
          <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-weight: bold; color: #0f172a;">FINAL REPORT</span>
          <span style="color: #15803d; font-weight: bold;">✓ VERIFIED</span>
        </div>
      </div>
    `;
  }

  // 6. Gold Frame
  if (d.headerStyle === 'gold_frame') {
    return `
      <div class="regal-gold-header" style="border: 2px solid #0f172a; border-top: 5px solid #d97706; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important; color: #ffffff !important; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: rgba(217, 119, 6, 0.2); border: 1px solid #fbbf24; display: flex; align-items: center; justify-content: center; color: #fbbf24; flex-shrink: 0;">
              ${renderEmblemSvg(d.labEmblem, '#fbbf24', 28)}
            </div>
            <div style="flex: 1; text-align: right;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <h1 style="margin: 0; font-size: 19px; color: #fbbf24 !important; font-weight: 900;">${d.labName}</h1>
                <span style="font-size: 8px; font-weight: 900; padding: 2px 6px; background: #d97706; color: #000; border-radius: 4px;">EXECUTIVE</span>
              </div>
              <div style="font-size: 10px; color: #e2e8f0; margin-top: 2px;">${d.labSubtitle}</div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Address: ${d.address} | Tel: ${d.phone}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; text-align: left;" dir="ltr">
            <div style="color: #fbbf24; font-size: 10px; font-weight: 800;">
              <div style="font-size: 8px; color: #cbd5e1;">${d.license || 'ISO 15189 Certified'}</div>
            </div>
            ${d.enableQrCode ? `
              <div style="background: #ffffff; padding: 3px; border-radius: 4px;">
                ${generateQrSvg(40)}
              </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 7. Smart Digital
  if (d.headerStyle === 'smart_digital') {
    return `
      <div class="smart-digital-header" style="background: #0f172a !important; color: #ffffff !important; border-bottom: 3px solid ${d.secondaryColor} !important; padding: 12px 18px; border-radius: 8px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="flex: 1; text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <h1 style="margin: 0; font-size: 19px; color: #ffffff !important; font-weight: 900;">${d.labName}</h1>
              <span style="font-size: 8px; font-weight: 900; padding: 2px 6px; background: ${d.secondaryColor}; color: #041017; border-radius: 4px;">SMART DIGITAL</span>
            </div>
            <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #94a3b8 !important;">${d.labSubtitle}</p>
            <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #64748b !important;">${d.address} | Tel: ${d.phone}</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; margin-right: 12px;">
            <div style="background: #ffffff; padding: 4px; border-radius: 6px; text-align: center;">
              ${generateQrSvg(42)}
            </div>
            <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 6px 10px; border-radius: 6px; text-align: left;" dir="ltr">
              <h4 style="font-size: 11px; font-weight: 900; color: #ffffff !important; margin: 0;">${d.docName}</h4>
              <p style="font-size: 9px; color: #94a3b8 !important; margin: 1px 0 0 0;">${d.docTitle}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 8. Multi-Accredited
  if (d.headerStyle === 'accredited_badge') {
    return `
      <div class="multi-accredited-header" style="border-radius: 8px; overflow: hidden; margin-bottom: 14px; border: 1px solid #cbd5e1; position: relative; z-index: 1;">
        <div style="background: ${d.primaryColor} !important; color: #ffffff !important; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; text-align: right;">
            <h1 style="margin: 0; font-size: 19px; color: #ffffff !important; font-weight: 900;">${d.labName}</h1>
            <div style="font-size: 10.5px; opacity: 0.9; margin-top: 2px;">${d.labSubtitle}</div>
            <div style="font-size: 9.5px; opacity: 0.8; margin-top: 2px;">${d.address} | ${d.phone}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${d.enableQrCode ? generateQrSvg(40) : ''}
            <div style="background: rgba(255,255,255,0.18); padding: 6px 10px; border-radius: 6px; text-align: left;" dir="ltr">
              <div style="font-size: 11px; font-weight: 900; color: #ffffff;">${d.docName}</div>
              <div style="font-size: 9px; opacity: 0.9;">${d.docTitle}</div>
            </div>
          </div>
        </div>
        <div style="background: #f0fdf4 !important; border-top: 1px solid #bbf7d0; padding: 4px 14px; display: flex; justify-content: space-around; font-size: 9.5px; font-weight: 800; color: #166534;">
          <span>🛡️ ISO 15189 Certified</span>
          <span>🏆 JCI Accredited Lab</span>
          <span>⭐ CAP Quality Participant</span>
          <span>🔬 EQAS International Quality</span>
        </div>
      </div>
    `;
  }

  // 9. Bauhaus Grid
  if (d.headerStyle === 'bauhaus_grid') {
    return `
      <div class="bauhaus-grid-header" style="display: grid; grid-template-columns: 2fr 1fr 1fr; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="padding: 12px 14px; border-left: 1px solid #cbd5e1; text-align: right;">
          <div style="font-size: 9px; color: #64748b; font-weight: 800;">CLINICAL DIAGNOSTIC INSTITUTION</div>
          <h1 style="margin: 0; font-size: 18px; color: #0f172a !important; font-weight: 900;">${d.labName}</h1>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">${d.labSubtitle}</div>
          <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">${d.address} | ${d.phone}</div>
        </div>
        <div style="padding: 12px 12px; border-left: 1px solid #cbd5e1; background: #f1f5f9; text-align: left;" dir="ltr">
          <div style="font-size: 11px; font-weight: 900; color: #0f172a;">${d.docName}</div>
          <div style="font-size: 9px; color: #64748b;">${d.docTitle}</div>
          <div style="font-size: 8.5px; color: #94a3b8; margin-top: 2px;">${d.license}</div>
        </div>
        <div style="padding: 12px 12px; background: #e2e8f0; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          ${d.enableQrCode ? generateQrSvg(40) : ''}
        </div>
      </div>
    `;
  }

  // 10 & 11. Aurora Wave
  if (d.headerStyle === 'aurora_wave') {
    const waveBg = d.reportTemplate === 'EMERALD_WAVE'
      ? 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)'
      : 'linear-gradient(135deg, #0f172a 0%, #0369a1 50%, #0284c7 100%)';
    return `
      <div class="dynamic-wave-banner" style="position: relative; background: ${waveBg} !important; color: #ffffff !important; padding: 14px 18px 20px 18px; border-radius: 10px; margin-bottom: 14px; overflow: hidden;">
        <svg style="position: absolute; bottom: 0; left: 0; width: 100%; height: 24px; pointer-events: none; opacity: 0.3;" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,25 C150,75 350,-20 500,35 C650,90 900,10 1200,40 L1200,120 L0,120 Z" fill="#ffffff"></path>
        </svg>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
          <div style="flex: 1; text-align: right;">
            <div style="font-size: 8.5px; color: #bae6fd; letter-spacing: 0.5px; font-weight: 800; margin-bottom: 2px;">AURORA DYNAMIC WAVE DIAGNOSTICS</div>
            <h1 style="margin: 0; font-size: 19px; color: #ffffff !important; font-weight: 900;">${d.labName}</h1>
            <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #e0f2fe !important; font-weight: 600;">${d.labSubtitle}</p>
            <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #bae6fd !important;">${d.address} | ${d.phone}</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${d.enableQrCode ? `
              <div style="background: #ffffff; padding: 3px; border-radius: 6px;">
                ${generateQrSvg(38)}
              </div>` : ''}
            <div style="background: rgba(255, 255, 255, 0.18) !important; border: 1px solid rgba(255, 255, 255, 0.3); padding: 6px 10px; border-radius: 6px; text-align: left;" dir="ltr">
              <h4 style="font-size: 11px; font-weight: 900; color: #ffffff !important; margin: 0;">${d.docName}</h4>
              <p style="font-size: 9.5px; color: #e0f2fe !important; margin: 2px 0 0 0;">${d.docTitle}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 12. Executive Dark
  if (d.headerStyle === 'executive_dark') {
    return `
      <div class="executive-header-banner" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important; color: #f8fafc !important; border-bottom: 3.5px solid #b45309 !important; padding: 12px 18px; border-radius: 6px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="flex: 1; text-align: right;">
            <h1 style="margin: 0; font-size: 19px; color: #fbbf24 !important; font-weight: 900;">${d.labName}</h1>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #cbd5e1 !important; font-weight: 600;">${d.labSubtitle}</p>
            <p style="margin: 3px 0 0 0; font-size: 10px; color: #94a3b8 !important;">Address: ${d.address} | Tel: ${d.phone}</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; margin-right: 14px;">
            ${d.enableQrCode ? `
              <div style="background: #ffffff; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; align-items: center;">
                ${generateQrSvg(40)}
              </div>` : ''}
            <div style="background: rgba(180, 83, 9, 0.22) !important; border: 1px solid #b45309; padding: 6px 12px; border-radius: 6px; text-align: left;" dir="ltr">
              <h4 style="font-size: 12px; font-weight: 900; color: #fbbf24 !important; margin: 0;">${d.docName}</h4>
              <p style="font-size: 10px; color: #cbd5e1 !important; margin: 2px 0 0 0;">${d.docTitle}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 13. Vertical Accent
  if (d.headerStyle === 'vertical_accent') {
    return `
      <div class="vertical-spine-header" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 14px; display: flex; position: relative; z-index: 1;">
        <div style="width: 14px; background: linear-gradient(180deg, ${d.primaryColor} 0%, #4f46e5 100%) !important;"></div>
        <div style="flex: 1; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; text-align: right;">
            <h1 style="margin: 0; font-size: 18.5px; color: #0f172a !important; font-weight: 900;">${d.labName}</h1>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${d.labSubtitle}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">${d.address} | ${d.phone}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${d.enableQrCode ? generateQrSvg(40) : ''}
            <div style="border-right: 2px solid #ede9fe; padding-right: 12px; text-align: left;" dir="ltr">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${d.docName}</div>
              <div style="font-size: 9px; color: #64748b;">${d.docTitle}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 14. Glass Capsule
  if (d.headerStyle === 'glass_capsule') {
    return `
      <div class="glass-capsule-header" style="display: flex; justify-content: space-between; align-items: stretch; gap: 10px; margin-bottom: 14px; position: relative; z-index: 1;">
        <div style="flex: 1.5; background: linear-gradient(135deg, ${d.primaryColor}14 0%, ${d.secondaryColor}0d 100%) !important; border: 1.5px solid ${d.primaryColor}45; border-right: 5px solid ${d.primaryColor}; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 42px; height: 42px; border-radius: 10px; background: ${d.primaryColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${renderEmblemSvg(d.labEmblem, '#ffffff', 24)}
          </div>
          <div style="flex: 1; text-align: right;">
            <h1 style="margin: 0; font-size: 18px; color: ${d.primaryColor} !important; font-weight: 900;">${d.labName}</h1>
            <div style="font-size: 10px; font-weight: 700; color: #334155;">${d.labSubtitle}</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${d.address} | ${d.phone}</div>
          </div>
        </div>
        <div style="flex: 1; background: #f8fafc !important; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;" dir="ltr">
          <div style="text-align: left;">
            <div style="font-size: 11px; font-weight: 900; color: #0f172a;">${d.docName}</div>
            <div style="font-size: 9px; color: #475569;">${d.docTitle}</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 1px;">${d.license}</div>
          </div>
          ${d.enableQrCode ? `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px; flex-shrink: 0;">
              ${generateQrSvg(38)}
            </div>` : ''}
        </div>
      </div>
    `;
  }

  // Default Classic Split
  return `
    <div class="header-border" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 2px solid ${d.primaryColor}; position: relative; z-index: 1;">
      <div style="flex: 1; text-align: right;">
        <h1 style="margin: 0; font-size: 19px; color: ${d.primaryColor} !important; font-weight: 900;">
          ${d.labName}
        </h1>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">${d.labSubtitle}</p>
        <p style="margin: 4px 0 0 0; font-size: 10px; color: #475569;">العنوان: ${d.address} | هاتف: ${d.phone}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; margin-right: 16px;">
        ${d.enableQrCode ? `
          <div style="text-align: center;">
            ${generateQrSvg(40)}
            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Scan to Verify</div>
          </div>` : ''}
        <div style="text-align: left;" dir="ltr">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${d.docName}</div>
          <div style="font-size: 10px; color: #64748b;">${d.docTitle}</div>
          ${d.license ? `<div style="font-size: 9px; color: #94a3b8;">${d.license}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

// Helper to render Patient Meta Box
function renderPatientMetaBox(d) {
  const layout = d.patientLayout || 'grid';

  // Layout 1: Grid (Default 3 rows)
  if (layout === 'grid') {
    return `
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px; font-size: 11px; background: #f8fafc;" dir="ltr">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; width: 20%; background: #f1f5f9; color: #475569; font-weight: 600;">Patient Name:</td>
              <td style="padding: 4px 8px; width: 30%; font-weight: 800; color: #0f172a; font-size: 12px;">مصطفى قاسم الكرخي (Mustafa Qasim)</td>
              <td style="padding: 4px 8px; width: 20%; background: #f1f5f9; color: #475569; font-weight: 600;">Sample ID / Barcode:</td>
              <td style="padding: 4px 8px; width: 30%; font-weight: 800; color: ${d.primaryColor}; font-family: monospace;">#261028-09418</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Age / Sex:</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #1e293b;">38 Years / Male (ذكر)</td>
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Referred By:</td>
              <td style="padding: 4px 8px; font-weight: 700; color: #1e293b;">د. أحمد الشمري (Consultant)</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Collection Date:</td>
              <td style="padding: 4px 8px; color: #334155; font-family: monospace;">2026-10-28 09:30 AM</td>
              <td style="padding: 4px 8px; background: #f1f5f9; color: #475569; font-weight: 600;">Report Status:</td>
              <td style="padding: 4px 8px; font-weight: 800; color: #16a34a;">
                <span style="background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 4px; font-size: 9.5px;">✓ Final Authorized</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Layout 2: 3 Floating Modern Cards
  if (layout === 'cards') {
    return `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;" dir="ltr">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid ${d.primaryColor}; border-radius: 6px; padding: 8px 10px;">
          <div style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase;">Patient Demographics</div>
          <div style="font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 2px;">مصطفى قاسم الكرخي</div>
          <div style="font-size: 10px; color: #334155; margin-top: 1px;">38 Y / Male • 0770 123 4567</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid ${d.secondaryColor}; border-radius: 6px; padding: 8px 10px;">
          <div style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase;">Clinical Demographics</div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px;">Dr. Ahmed Al-Shammari</div>
          <div style="font-size: 10px; color: #475569; margin-top: 1px;">Internal Medicine & Endocrinology</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid #10b981; border-radius: 6px; padding: 8px 10px;">
          <div style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase;">Order & Verification</div>
          <div style="font-size: 11px; font-weight: 900; color: ${d.primaryColor}; margin-top: 2px; font-family: monospace;">SID: #261028-09418</div>
          <div style="font-size: 10px; color: #15803d; font-weight: bold; margin-top: 1px;">✓ Authorized: 2026-10-28</div>
        </div>
      </div>
    `;
  }

  // Layout 3: Compact 2 Rows
  if (layout === 'compact') {
    return `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 10px;" dir="ltr">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px;">
          <div><strong style="color: #475569;">PATIENT:</strong> <span style="font-size: 11.5px; font-weight: 800; color: #0f172a;">مصطفى قاسم الكرخي (Mustafa Qasim)</span></div>
          <div><strong style="color: #475569;">AGE/SEX:</strong> <span style="font-weight: 700;">38 Y / Male</span></div>
          <div><strong style="color: #475569;">SAMPLE ID:</strong> <span style="font-weight: 800; color: ${d.primaryColor}; font-family: monospace;">#261028-09418</span></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; color: #475569;">
          <div><strong>DOCTOR:</strong> د. أحمد الشمري</div>
          <div><strong>COLLECTED:</strong> 2026-10-28 09:30</div>
          <div><span style="background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 3px; font-weight: bold;">✓ VERIFIED</span></div>
        </div>
      </div>
    `;
  }

  // Layout 4: Classic Double Border Box
  return `
    <div style="border: 2px double #0f172a; padding: 6px 10px; border-radius: 4px; margin-bottom: 12px; background: #ffffff;" dir="ltr">
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; font-size: 10.5px;">
        <div><strong>Patient Name:</strong> <span style="font-size: 12px; font-weight: 800; color: #0f172a;">مصطفى قاسم الكرخي</span></div>
        <div><strong>Age / Sex:</strong> 38 Years / Male</div>
        <div><strong>Sample ID:</strong> <span style="font-weight: bold; color: ${d.primaryColor}; font-family: monospace;">#261028-09418</span></div>
        <div><strong>Referring Doctor:</strong> د. أحمد الشمري</div>
        <div><strong>Date:</strong> 2026-10-28 09:30</div>
        <div><strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">Verified (Final)</span></div>
      </div>
    </div>
  `;
}

// Helper to render clinical results table
function renderResultsTable(d) {
  const isZebra = d.tableZebraStriping || d.tableStyle === 'zebra';
  const isGrid = d.tableStyle === 'grid';
  const isCompact = d.tableStyle === 'compact' || d.tableRowSpacing === 'COMPACT';

  const cellPad = isCompact ? '4px 6px' : '5px 8px';
  const cellBorder = isGrid ? '1px solid #cbd5e1' : 'none';
  const rowBorder = '1px solid #e2e8f0';

  const TESTS = [
    {
      category: 'Clinical Chemistry & Diabetes Monitoring',
      name: 'Fasting Blood Glucose (FBG)',
      prev: '142',
      prevDate: '10/12',
      val: '108',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '70 - 110',
      pct: 68,
      status: 'Normal'
    },
    {
      category: 'Clinical Chemistry & Diabetes Monitoring',
      name: 'HbA1c (Glycated Hemoglobin)',
      prev: '7.8',
      prevDate: '10/12',
      val: '6.4',
      unit: '%',
      flag: 'NORMAL',
      ref: '4.5 - 6.5',
      pct: 72,
      status: 'Controlled'
    },
    {
      category: 'Renal Function & Electrolytes',
      name: 'Serum Creatinine',
      prev: '1.05',
      prevDate: '10/12',
      val: '0.94',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '0.70 - 1.20',
      pct: 48,
      status: 'Optimal'
    },
    {
      category: 'Renal Function & Electrolytes',
      name: 'Blood Urea',
      prev: '34',
      prevDate: '10/12',
      val: '28',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '15 - 45',
      pct: 43,
      status: 'Optimal'
    },
    {
      category: 'Renal Function & Electrolytes',
      name: 'Serum Uric Acid',
      prev: '6.8',
      prevDate: '10/12',
      val: '5.9',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '3.5 - 7.2',
      pct: 64,
      status: 'Optimal'
    },
    {
      category: 'Lipid Profile & Cardiovascular Risk',
      name: 'Serum Cholesterol (Total)',
      prev: '228',
      prevDate: '10/12',
      val: '192',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '< 200',
      pct: 58,
      status: 'Desirable'
    },
    {
      category: 'Lipid Profile & Cardiovascular Risk',
      name: 'Serum Triglycerides',
      prev: '280',
      prevDate: '10/12',
      val: '245',
      unit: 'mg/dL',
      flag: 'HIGH',
      ref: '< 150',
      pct: 85,
      status: 'High [H]'
    },
    {
      category: 'Lipid Profile & Cardiovascular Risk',
      name: 'HDL Cholesterol (Direct)',
      prev: '38',
      prevDate: '10/12',
      val: '44',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '> 40',
      pct: 55,
      status: 'Desirable'
    },
    {
      category: 'Lipid Profile & Cardiovascular Risk',
      name: 'LDL Cholesterol (Calculated)',
      prev: '134',
      prevDate: '10/12',
      val: '99',
      unit: 'mg/dL',
      flag: 'NORMAL',
      ref: '< 100',
      pct: 49,
      status: 'Optimal'
    },
    {
      category: 'Liver Function Tests (Hepatic)',
      name: 'ALT (SGPT)',
      prev: '32',
      prevDate: '10/12',
      val: '24',
      unit: 'U/L',
      flag: 'NORMAL',
      ref: '< 45',
      pct: 53,
      status: 'Normal'
    },
    {
      category: 'Liver Function Tests (Hepatic)',
      name: 'AST (SGOT)',
      prev: '28',
      prevDate: '10/12',
      val: '21',
      unit: 'U/L',
      flag: 'NORMAL',
      ref: '< 35',
      pct: 60,
      status: 'Normal'
    }
  ];

  let currentCategory = '';
  let rowsHtml = '';

  TESTS.forEach((t, idx) => {
    if (t.category !== currentCategory) {
      currentCategory = t.category;
      rowsHtml += `
        <tr style="background: #f1f5f9; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1;">
          <td colspan="7" style="padding: 4px 8px; font-size: 10px; font-weight: 900; color: ${d.primaryColor}; text-transform: uppercase; letter-spacing: 0.5px;">
            ✦ ${currentCategory}
          </td>
        </tr>
      `;
    }

    const isZebraRow = isZebra && idx % 2 === 1;
    const bg = isZebraRow ? `${d.primaryColor}0a` : '#ffffff';
    const isHigh = t.flag === 'HIGH';

    rowsHtml += `
      <tr style="background: ${bg}; border-bottom: ${rowBorder};">
        <td style="padding: ${cellPad}; font-weight: 800; color: #0f172a; font-size: 11px; border: ${cellBorder};">
          ${t.name}
        </td>
        <td style="padding: ${cellPad}; text-align: center; color: #64748b; font-family: monospace; font-size: 10px; border: ${cellBorder};">
          ${t.prev ? `<span style="background: #f1f5f9; padding: 1px 5px; border-radius: 3px;">${t.prev} <small style="color: #94a3b8;">(${t.prevDate})</small></span>` : '-'}
        </td>
        <td style="padding: ${cellPad}; text-align: center; font-weight: 900; font-family: monospace; font-size: 12px; color: ${isHigh ? '#dc2626' : '#0f172a'}; border: ${cellBorder};">
          ${t.val}
        </td>
        <td style="padding: ${cellPad}; text-align: center; color: #475569; font-size: 10px; border: ${cellBorder};">
          ${t.unit}
        </td>
        <td style="padding: ${cellPad}; text-align: center; font-size: 9.5px; font-weight: 800; border: ${cellBorder};">
          ${isHigh
            ? `<span style="background: #fee2e2; color: #b91c1c; padding: 1px 6px; border-radius: 3px; border: 1px solid #f87171;">HIGH [H]</span>`
            : `<span style="color: #16a34a;">NORMAL</span>`}
        </td>
        <td style="padding: ${cellPad}; text-align: center; color: #334155; font-size: 10px; font-family: monospace; border: ${cellBorder};">
          ${t.ref}
        </td>
        ${d.showRangeBar ? `
          <td style="padding: ${cellPad}; text-align: center; width: 85px; border: ${cellBorder};">
            <div style="position: relative; width: 75px; height: 6px; background: #e2e8f0; border-radius: 3px; margin: 0 auto; overflow: hidden;">
              <div style="position: absolute; left: 20%; width: 60%; height: 100%; background: #bbf7d0;"></div>
              <div style="position: absolute; left: ${t.pct}%; top: 0; width: 4px; height: 100%; background: ${isHigh ? '#dc2626' : '#0284c7'}; border-radius: 2px;"></div>
            </div>
          </td>
        ` : ''}
      </tr>
    `;
  });

  return `
    <div style="margin-bottom: 14px; position: relative; z-index: 1;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
        <thead>
          <tr style="background: ${d.primaryColor}; color: #ffffff;">
            <th style="padding: 6px 8px; font-weight: 800; text-transform: uppercase; font-size: 10px; width: 34%;">TEST DESCRIPTION</th>
            <th style="padding: 6px 6px; text-align: center; font-weight: 800; font-size: 10px; width: 14%;">PREVIOUS</th>
            <th style="padding: 6px 6px; text-align: center; font-weight: 800; font-size: 10px; width: 12%;">RESULT</th>
            <th style="padding: 6px 6px; text-align: center; font-weight: 800; font-size: 10px; width: 10%;">UNIT</th>
            <th style="padding: 6px 6px; text-align: center; font-weight: 800; font-size: 10px; width: 10%;">FLAG</th>
            <th style="padding: 6px 6px; text-align: center; font-weight: 800; font-size: 10px; width: 12%;">REF. RANGE</th>
            ${d.showRangeBar ? `<th style="padding: 6px 6px; text-align: center; font-weight: 800; font-size: 10px; width: 8%;">RANGE</th>` : ''}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

// Helper to render Footer
function renderFooter(d) {
  return `
    <div class="report-footer" style="border-top: 1.5px solid #cbd5e1; padding-top: 10px; margin-top: auto; position: relative; z-index: 1;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="flex: 1; text-align: right; padding-left: 20px;">
          <div style="font-size: 9.5px; color: #475569; font-weight: 700; line-height: 1.5;">
            ملاحظة سريرية: هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).
          </div>
          <div style="font-size: 8.5px; color: #94a3b8; margin-top: 4px;">
            تاريخ الطباعة: 2026-10-28 10:15 • المشغل: Labryo LIMS v2.0 • الباركود: 261028-09418 • صفحة 1 من 1
          </div>
        </div>
        ${d.showFooterSignature ? `
          <div style="display: flex; align-items: center; gap: 14px; text-align: center; flex-shrink: 0;" dir="ltr">
            <div>
              <div style="font-size: 9px; font-weight: 800; color: #64748b; margin-bottom: 2px;">OFFICIAL LAB STAMP</div>
              ${renderDoctorStampSvg(d.labName, d.docName)}
            </div>
            <div>
              <div style="font-size: 9px; font-weight: 800; color: #64748b; margin-bottom: 6px;">CONSULTANT SIGNATURE</div>
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding: 2px 14px 4px 14px;">
                ${d.docName}
              </div>
              <div style="font-size: 8.5px; color: #475569; margin-top: 4px; font-weight: bold;">Verified & Released</div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Generate the complete HTML page
function buildShowcaseHtml() {
  const renderedA4Sheets = DESIGNS.map((d, index) => {
    const hasWatermark = d.enableWatermark;
    return `
      <!-- A4 Sheet for Design ${index + 1}: ${d.title} -->
      <div class="a4-sheet-wrapper" id="sheet_${d.id}" data-category="${d.category}" style="display: ${index === 0 ? 'block' : 'none'};">
        <div class="a4-sheet" style="font-family: ${d.fontFamily === 'Tajawal' ? "'Tajawal', sans-serif" : d.fontFamily === 'Cairo' ? "'Cairo', sans-serif" : d.fontFamily === 'IBM Plex Sans Arabic' ? "'IBM Plex Sans Arabic', sans-serif" : d.fontFamily === 'Almarai' ? "'Almarai', sans-serif" : "Arial, sans-serif"};">
          ${hasWatermark ? `
            <div class="watermark-overlay" style="opacity: ${d.watermarkOpacity || 0.08}; transform: rotate(-30deg);">
              ${d.watermarkText || 'ORIGINAL LAB REPORT'}
            </div>
          ` : ''}

          <div class="sheet-content">
            ${renderHeaderForDesign(d)}
            ${renderPatientMetaBox(d)}
            ${renderResultsTable(d)}
            ${renderFooter(d)}
          </div>
        </div>
      </div>
    `;
  }).join('\n');

  // JSON presets mapping
  const presetsJs = JSON.stringify(DESIGNS.map(d => ({
    id: d.id,
    title: d.title,
    preset: {
      reportTemplate: d.reportTemplate,
      headerStyle: d.headerStyle,
      primaryColor: d.primaryColor,
      secondaryColor: d.secondaryColor,
      headerBgColor: d.headerBgColor,
      headerTextColor: d.headerTextColor,
      patientLayout: d.patientLayout,
      tableStyle: d.tableStyle,
      tableZebraStriping: d.tableZebraStriping,
      tableRowSpacing: d.tableRowSpacing,
      fontFamily: d.fontFamily,
      labEmblem: d.labEmblem,
      labNameStyle: d.labNameStyle,
      enableQrCode: d.enableQrCode,
      enableWatermark: Boolean(d.enableWatermark),
      watermarkText: d.watermarkText || '',
      showFooterSignature: d.showFooterSignature,
      showRangeBar: d.showRangeBar
    }
  })));

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كتالوج قوالب وفورمات التقارير المخبرية - Labryo LIMS (25 تصميماً سريرياً جاهزاً)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@400;600;700;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg-dark: #070a12;
      --bg-surface: #0d1527;
      --bg-card: #131d35;
      --border-color: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-cyan: #06b6d4;
      --accent-blue: #3b82f6;
      --accent-gold: #f59e0b;
      --accent-emerald: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 0%, #0d1a33 0%, #070a12 85%);
      color: var(--text-main);
      font-family: 'Tajawal', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Top Navigation Bar */
    header.showcase-header {
      background: rgba(7, 10, 18, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 12px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #041017;
      font-size: 22px;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(6, 182, 212, 0.3);
    }
    .btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
    .btn-gold {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.4);
      color: #fbbf24;
    }
    .btn-gold:hover { background: rgba(245, 158, 11, 0.25); }

    /* App Container Layout */
    .app-container {
      display: flex;
      min-height: calc(100vh - 70px);
    }

    /* Sidebar */
    aside.sidebar {
      width: 380px;
      background: rgba(13, 21, 39, 0.85);
      border-left: 1px solid var(--border-color);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      height: calc(100vh - 70px);
      position: sticky;
      top: 70px;
      overflow-y: auto;
    }

    .search-input {
      width: 100%;
      background: #070a12;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 12px;
      outline: none;
    }
    .search-input:focus { border-color: var(--accent-cyan); }

    .category-pills {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pill {
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .pill.active {
      background: rgba(6, 182, 212, 0.2);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }

    .designs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      overflow-y: auto;
      padding-left: 4px;
    }
    .design-card-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 12px;
      text-align: right;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-main);
    }
    .design-card-btn:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(6, 182, 212, 0.4);
    }
    .design-card-btn.active {
      background: rgba(6, 182, 212, 0.15);
      border-color: var(--accent-cyan);
      box-shadow: 0 0 14px rgba(6, 182, 212, 0.25);
    }

    /* Main Workspace */
    main.workspace {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #070a12;
      overflow-y: auto;
    }

    .specs-banner {
      width: 100%;
      max-width: 210mm;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    /* Real A4 Paper Simulation */
    .a4-sheet-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      transition: transform 0.2s;
    }

    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff !important;
      color: #0f172a;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: 14mm 12mm;
    }

    .watermark-overlay {
      position: absolute;
      top: 45%;
      left: 10%;
      width: 80%;
      text-align: center;
      font-size: 42px;
      font-weight: 950;
      color: #0f172a;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 2px;
      user-select: none;
    }

    .sheet-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }

    /* Print Styles */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
      }
      header.showcase-header, aside.sidebar, .specs-banner, .toast-container {
        display: none !important;
      }
      .app-container {
        display: block !important;
      }
      main.workspace {
        padding: 0 !important;
        background: transparent !important;
      }
      .a4-sheet-wrapper {
        display: block !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .a4-sheet {
        width: 100% !important;
        min-height: 297mm !important;
        height: 297mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 12mm 10mm !important;
        page-break-after: always !important;
        break-after: page !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* Toast Notification */
    .toast-container {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 1000;
      pointer-events: none;
    }
    .toast {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid var(--accent-cyan);
      border-radius: 8px;
      padding: 12px 18px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 700;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>

  <!-- Top Showcase Navigation Bar -->
  <header class="showcase-header">
    <div class="brand-block">
      <div class="brand-icon">🔬</div>
      <div>
        <h1 style="font-size: 16px; font-weight: 900; letter-spacing: -0.3px; margin: 0;">نظام لابريو الطبي (Labryo LIMS)</h1>
        <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700;">معرض ومصمم فورمات التقارير المخبرية (25 قالباً جاهزاً للعرض)</span>
      </div>
    </div>

    <div class="action-btn-group">
      <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.06); padding: 3px; border-radius: 8px;">
        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 11px;" onclick="setZoom(0.8)">80%</button>
        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 11px;" onclick="setZoom(0.95)">95%</button>
        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 11px;" onclick="setZoom(1)">100%</button>
        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 11px;" onclick="setZoom(1.1)">110%</button>
      </div>

      <button class="btn btn-gold" onclick="copyCurrentPreset()">
        <span>📋 نسخ كود الإعدادات (JSON)</span>
      </button>

      <button class="btn btn-primary" onclick="printCurrentDesign()">
        <span>🖨️ طباعة هذا النموذج (A4)</span>
      </button>

      <button class="btn btn-secondary" onclick="printAllCatalog()">
        <span>📑 طباعة الكتالوج الشامل (25 صفحة)</span>
      </button>
    </div>
  </header>

  <!-- Application Body -->
  <div class="app-container">
    
    <!-- Left Navigation Sidebar -->
    <aside class="sidebar">
      <div>
        <div style="font-size: 13px; font-weight: 900; margin-bottom: 8px;">اختر تصميم الفورمة للعرض (25 تصميماً):</div>
        <input type="text" class="search-input" id="searchBox" placeholder="🔍 بحث باسم المختبر، المحافظة، أو النمط..." oninput="filterDesigns()" />
      </div>

      <div class="category-pills">
        <button class="pill active" onclick="filterCategory('ALL', this)">الكل (25)</button>
        <button class="pill" onclick="filterCategory('ROYAL', this)">👑 ملكية (5)</button>
        <button class="pill" onclick="filterCategory('MODERN', this)">🏥 عصرية (6)</button>
        <button class="pill" onclick="filterCategory('INTERNATIONAL', this)">🛡️ معتمدة (4)</button>
        <button class="pill" onclick="filterCategory('SPECIALIZED', this)">🔬 تخصصية (3)</button>
        <button class="pill" onclick="filterCategory('COMPACT', this)">🖨️ موفرة للحبر (4)</button>
        <button class="pill" onclick="filterCategory('STATIONERY', this)">📄 ورق مروّس (1)</button>
      </div>

      <div class="designs-list" id="designsList">
        ${DESIGNS.map((d, index) => `
          <button class="design-card-btn ${index === 0 ? 'active' : ''}" id="btn_${d.id}" onclick="selectDesign('${d.id}')" data-category="${d.category}" data-search="${d.title} ${d.labName} ${d.address} ${d.categoryName}">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 14px; height: 14px; border-radius: 50%; background: ${d.primaryColor}; border: 1.5px solid ${d.secondaryColor}; flex-shrink: 0;"></div>
              <div>
                <div style="font-size: 12px; font-weight: 800;">${d.title}</div>
                <div style="font-size: 10px; color: var(--text-muted);">${d.labName.slice(0, 32)}...</div>
              </div>
            </div>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: var(--accent-cyan);">${d.categoryName}</span>
          </button>
        `).join('')}
      </div>
    </aside>

    <!-- Main Workspace Sheet Container -->
    <main class="workspace" id="workspace">
      
      <!-- Specs & Settings Breakdown Banner -->
      <div class="specs-banner" id="specsBanner">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px; font-weight: 900; color: var(--accent-cyan);" id="specTitle">${DESIGNS[0].title}</span>
            <span style="font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); font-weight: 800;" id="specCategory">${DESIGNS[0].categoryName}</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;" id="specDesc">${DESIGNS[0].description}</p>
        </div>

        <div style="display: flex; gap: 14px; align-items: center; font-size: 11px;" dir="ltr">
          <div><strong style="color: #64748b;">Template:</strong> <code style="color: var(--accent-cyan);" id="specTpl">${DESIGNS[0].reportTemplate}</code></div>
          <div><strong style="color: #64748b;">Header:</strong> <code style="color: var(--accent-gold);" id="specHeader">${DESIGNS[0].headerStyle}</code></div>
          <div><strong style="color: #64748b;">Table:</strong> <code style="color: #38bdf8;" id="specTable">${DESIGNS[0].tableStyle}</code></div>
          <div><strong style="color: #64748b;">Patient:</strong> <code style="color: #34d399;" id="specPatient">${DESIGNS[0].patientLayout}</code></div>
        </div>
      </div>

      <!-- Rendered A4 Sheet -->
      <div id="sheetsContainer">
        ${renderedA4Sheets}
      </div>

    </main>

  </div>

  <div class="toast-container" id="toastContainer"></div>

  <script>
    var DESIGNS_DATA = ${presetsJs};
    var currentDesignId = '01_baghdad_royal';
    var activeCategory = 'ALL';

    function selectDesign(id) {
      currentDesignId = id;

      // Update sidebar buttons
      document.querySelectorAll('.design-card-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      var activeBtn = document.getElementById('btn_' + id);
      if (activeBtn) activeBtn.classList.add('active');

      // Update sheets visibility
      document.querySelectorAll('.a4-sheet-wrapper').forEach(function(s) {
        s.style.display = 'none';
      });
      var activeSheet = document.getElementById('sheet_' + id);
      if (activeSheet) activeSheet.style.display = 'block';

      // Update Specs Banner
      var found = DESIGNS_DATA.find(function(d) { return d.id === id; });
      if (found) {
        document.getElementById('specTitle').innerText = found.title;
        document.getElementById('specTpl').innerText = found.preset.reportTemplate;
        document.getElementById('specHeader').innerText = found.preset.headerStyle;
        document.getElementById('specTable').innerText = found.preset.tableStyle;
        document.getElementById('specPatient').innerText = found.preset.patientLayout;
      }
    }

    function filterCategory(cat, el) {
      activeCategory = cat;
      document.querySelectorAll('.category-pills .pill').forEach(function(p) {
        p.classList.remove('active');
      });
      if (el) {
        el.classList.add('active');
      }
      filterDesigns();
    }

    function filterDesigns() {
      var query = (document.getElementById('searchBox').value || '').trim().toLowerCase();
      var buttons = document.querySelectorAll('.design-card-btn');
      var firstVisibleId = null;

      buttons.forEach(function(btn) {
        var cat = btn.getAttribute('data-category');
        var searchTxt = btn.getAttribute('data-search').toLowerCase();

        var matchesCat = activeCategory === 'ALL' || cat === activeCategory;
        var matchesQuery = !query || searchTxt.includes(query);

        if (matchesCat && matchesQuery) {
          btn.style.display = 'flex';
          if (!firstVisibleId) {
            firstVisibleId = btn.id.replace('btn_', '');
          }
        } else {
          btn.style.display = 'none';
        }
      });

      if (firstVisibleId && !document.getElementById('btn_' + currentDesignId).offsetHeight) {
        selectDesign(firstVisibleId);
      }
    }

    function setZoom(val) {
      var sheets = document.querySelectorAll('.a4-sheet');
      sheets.forEach(function(s) {
        s.style.transform = 'scale(' + val + ')';
        s.style.transformOrigin = 'top center';
      });
      showToast('تم ضبط نسبة العرض: ' + (val * 100) + '%');
    }

    function copyCurrentPreset() {
      var found = DESIGNS_DATA.find(function(d) { return d.id === currentDesignId; });
      if (!found) return;

      var jsonStr = JSON.stringify(found.preset, null, 2);
      navigator.clipboard.writeText(jsonStr).then(function() {
        showToast('تم نسخ كود إعدادات القالب (JSON) إلى الحافظة بنجاح!');
      }).catch(function() {
        prompt('انسخ كود الإعدادات الخاص ببرنامج لابريو:', jsonStr);
      });
    }

    function printCurrentDesign() {
      window.print();
    }

    function printAllCatalog() {
      // Temporarily reveal all sheets for print
      document.querySelectorAll('.a4-sheet-wrapper').forEach(function(s) {
        s.style.display = 'block';
      });
      window.print();
      // Re-hide non-active sheets
      setTimeout(function() {
        selectDesign(currentDesignId);
      }, 1000);
    }

    function showToast(msg) {
      var container = document.getElementById('toastContainer');
      var toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span>✓</span> <span>' + msg + '</span>';
      container.appendChild(toast);
      setTimeout(function() {
        toast.remove();
      }, 3500);
    }
  </script>
</body>
</html>
  `;
}

const finalHtml = buildShowcaseHtml();
const outputPath = path.join(__dirname, '..', 'LABRYO_25_REPORT_FORMATS_SHOWCASE.html');
fs.writeFileSync(outputPath, finalHtml, 'utf8');

const publicOutputPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'showcase-designs.html');
fs.writeFileSync(publicOutputPath, finalHtml, 'utf8');

console.log(`Success! LABRYO_25_REPORT_FORMATS_SHOWCASE.html created successfully at ${outputPath}`);
console.log(`Also published to public web assets: ${publicOutputPath}`);
console.log(`File size: ${(Buffer.byteLength(finalHtml, 'utf8') / 1024).toFixed(2)} KB`);
