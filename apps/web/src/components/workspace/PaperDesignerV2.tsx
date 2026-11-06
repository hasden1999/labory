'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLab, FormTableColumn, DEFAULT_TABLE_COLUMNS } from '../LabContext';
import { useToast } from '../Toast';
import { apiRequest } from '../../lib/api';
import {
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  Check,
  Eye,
  Layout,
  Layers,
  Award,
  Smartphone,
  QrCode,
  ShieldCheck,
  Sliders,
  DollarSign,
  Maximize2,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  X,
  Palette,
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  MoveUp,
  MoveDown,
  Square,
  CheckSquare,
  RotateCcw,
  Zap,
  Building2,
  Phone,
  HelpCircle,
  Microscope,
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  findCurrency,
  calculateConversionMultiplier,
  getSamplePriceConversions,
} from '../../lib/currencies';
import { catalogCache } from '../../lib/catalogCache';
import { toEnglishDigits, formatEnglishDate } from '../../lib/formatters';
import LogoSettingsControl from '../logo/LogoSettingsControl';

export const HEADER_STYLE_TO_TEMPLATE_MAP: Record<string, string> = {
  'default': 'CLASSIC',
  'regal_box': 'BAGHDAD_ROYAL_DUAL',
  'dual_wing': 'INDIAN_DUAL_WING',
  'gradient_banner': 'MODERN',
  'minimal_pure': 'MINIMAL_PURE_LINE',
  'compact_strip': 'COMPACT_MICRO_STRIP',
  'gold_frame': 'REGAL_GOLD_FRAME',
  'smart_digital': 'SMART_DIGITAL',
  'accredited_badge': 'MULTI_ACCREDITED',
  'bauhaus_grid': 'BAUHAUS_GRID',
  'aurora_wave': 'AZURE_WAVE',
  'executive_dark': 'EXECUTIVE_LUXURY',
  'vertical_accent': 'VERTICAL_SPINE',
  'glass_capsule': 'GLASS_CAPSULE',
};

export const TEMPLATE_TO_HEADER_STYLE_MAP: Record<string, string> = {
  'CLASSIC': 'default',
  'ROYAL_CLASSIC': 'default',
  'BAGHDAD_ROYAL_DUAL': 'regal_box',
  'INDIAN_DUAL_WING': 'dual_wing',
  'DR_LAL_CLINICAL': 'dual_wing',
  'MODERN': 'gradient_banner',
  'CLINICAL_FRAME': 'gradient_banner',
  'MINIMAL_PURE_LINE': 'minimal_pure',
  'COMPACT_MICRO_STRIP': 'compact_strip',
  'COMPACT': 'compact_strip',
  'COMPACT_GRID': 'compact_strip',
  'REGAL_GOLD_FRAME': 'gold_frame',
  'SMART_DIGITAL': 'smart_digital',
  'MULTI_ACCREDITED': 'accredited_badge',
  'BAUHAUS_GRID': 'bauhaus_grid',
  'AZURE_WAVE': 'aurora_wave',
  'EXECUTIVE_LUXURY': 'executive_dark',
  'EXECUTIVE': 'executive_dark',
  'VERTICAL_SPINE': 'vertical_accent',
  'GLASS_CAPSULE': 'glass_capsule',
  'BLACK_WHITE': 'minimal_pure',
  'MONOCHROME_LASER': 'minimal_pure',
};

export const CBC_LAYOUT_TEMPLATES_LIST = [
  {
    id: 'SWELAB_3PART',
    nameAr: '1. تصميم جهاز سوي لاب (Swelab / Boule 3-Part)',
    nameEn: 'Swelab Alfa / Lumi Analyzer Report',
    badge: 'مطابق لجهاز سوي لاب 100%',
    descriptionAr: 'مطابق تماماً لورقة جهاز سوي لاب مع ترويسة التشغيل (Seq/Asp/Prof) والتفريق الثلاثي ومنحنيات 450/250/30 fL والأسهم ▼/▲.',
    accentColor: '#0284c7',
  },
  {
    id: 'MINDRAY_3PART',
    nameAr: '2. تصميم جهاز ميندراي ثلاثي الفئات (Mindray BC 3-Part)',
    nameEn: 'Mindray BC-Series 3-Part Analyzer Report',
    badge: 'مطابق لميندراي 3-Part',
    descriptionAr: 'تصميم أجهزة ميندراي BC-3000 Plus / BC-20s مع عمود التنبيه Flag (H/L) والمنحنيات البيانية.',
    accentColor: '#0f766e',
  },
  {
    id: 'MINDRAY_5PART',
    nameAr: '3. تصميم جهاز ميندراي خماسي الفئات (Mindray BC 5-Part & Scattergram)',
    nameEn: 'Mindray 5-Part Laser Scattergram Report',
    badge: 'خماسي الفئات + ليزر',
    descriptionAr: 'تفريق خماسي كامل مع مخطط التشتت الليزري DIFF Scattergram ومنحنيات التوزيع.',
    accentColor: '#7c3aed',
  },
  {
    id: 'SYSMEX_3PART',
    nameAr: '4. تصميم جهاز سيسمكس (Sysmex XP-300 / 3-Part)',
    nameEn: 'Sysmex Automated Hematology Report',
    badge: 'مطابق لسيسمكس',
    descriptionAr: 'مطابق لتسلسل معاملات ورسوم أجهزة Sysmex XP-300 / KX-21N.',
    accentColor: '#1e3a8a',
  },
  {
    id: 'CLASSIC_5PART',
    nameAr: '5. التصميم الكلاسيكي المعتمد (Classic 5-Part)',
    nameEn: 'Classic 5-Part Clinical Grid',
    badge: 'الافتراضي المعتمد',
    descriptionAr: 'تخطيط ثنائي الأعمدة مع التفريق الخماسي ومنحنيات التوزيع وملاحظات المسحة المحيطية.',
    accentColor: '#be123c',
  },
  {
    id: 'ANALYZER_3PART_HISTOGRAM',
    nameAr: '6. تصميم جهاز التحليل القياسي (3-Part Analyzer + Histograms)',
    nameEn: 'Automated 3-Part Analyzer Report',
    badge: 'مطابق لجهاز الدم',
    descriptionAr: 'يحاكي ورقة جهاز فحص الدم (WBC/GRA/LYM/MID + RBC/RDWa + PLT/P-LCR/P-LCC) مع أسهم ▼/▲ والمنحنيات.',
    accentColor: '#0284c7',
  },
  {
    id: 'WITH_HISTOGRAMS',
    nameAr: '3. جدول مع أشرطة مدى ومنحنيات (Range Bars & Histograms)',
    nameEn: 'Visual Range Bars & Histograms',
    badge: 'بصري متقدم',
    descriptionAr: 'جدول سريري أنيق مدمج مع أشرطة موقع النتيجة ومنحنيات توزيع الكريات والصفائح.',
    accentColor: '#0d9488',
  },
  {
    id: 'COMPACT_GRID',
    nameAr: '4. الشبكة المدمجة الاقتصادية (Compact In-Line Grid)',
    nameEn: 'Compact Space-Saver Dual Grid',
    badge: 'توفير مساحة',
    descriptionAr: 'تصميم مدمج في عمودين متجاورين يستهلك مساحة قليلة ويسمح بطباعة فحوصات أخرى بنفس الورقة.',
    accentColor: '#334155',
  },
  {
    id: 'DUAL_COLUMN',
    nameAr: '5. التقسيم الثنائي المتوازن (Balanced Dual Column)',
    nameEn: 'Symmetric Dual-Column Hematology',
    badge: 'ثنائي الأعمدة',
    descriptionAr: 'فصل متناظر بين الكريات الحمراء والصفائح في عمود، والكريات البيضاء والتفريق في العمود المقابل.',
    accentColor: '#1e3a8a',
  },
  {
    id: 'PEDIATRIC_CARDS',
    nameAr: '6. بطاقات الأطفال والعائلة (Pediatric & Family Cards)',
    nameEn: 'Soft Pediatric & Family Care Cards',
    badge: 'أطفال وعائلة',
    descriptionAr: 'بطاقات ملونة ناعمة ومريحة بصرياً مناسبة لتقارير الأطفال والعيادات الاستشارية.',
    accentColor: '#ea580c',
  },
  {
    id: 'CLINICAL_MINIMAL',
    nameAr: '7. الطبي التنفيذي لطابعات الليزر (Clinical Minimal B&W)',
    nameEn: 'Executive Monochrome Laser Minimal',
    badge: 'طابعات ليزر B&W',
    descriptionAr: 'تصميم طبي نظيف بخطوط دقيقة بدون خلفيات داكنة لتوفير الحبر ووضوح فائق بالأسود والأبيض.',
    accentColor: '#0f172a',
  },
  {
    id: 'REFERENCE_BANDS',
    nameAr: '8. أشرطة المدى المرجعي التفاعلية (Reference Bands)',
    nameEn: 'Linear Reference Spectrum Bands',
    badge: 'مؤشر بصري',
    descriptionAr: 'يعرض موقع كل نتيجة بصرياً داخل شريط المدى الطبيعي بين الحد الأدنى والأعلى.',
    accentColor: '#4338ca',
  },
  {
    id: 'FLAG_FOCUS',
    nameAr: '9. التركيز السريري على القيم الحرجة (Abnormal Flag Focus)',
    nameEn: 'Clinical Abnormal Flag Spotlight',
    badge: 'إبراز غير الطبيعي',
    descriptionAr: 'يبرز القيم المرتفعة والمنخفضة (H/L / ▲/▼) بتظليل واضح مع ملخص علوي للتنبيهات السريرية.',
    accentColor: '#dc2626',
  },
  {
    id: 'FULL_DIFFERENTIAL',
    nameAr: '10. التفصيلي الشامل 25+ معامل (Full 3-Part & 5-Part + Ratios)',
    nameEn: 'Comprehensive 25+ Parameters & Indices',
    badge: 'شامل 25+ معامل',
    descriptionAr: 'يعرض كافة معاملات 3-Part و 5-Part بالنسبي والمطلق مع مؤشرات NLR و PLR و Mentzer Index.',
    accentColor: '#7c3aed',
  },
];

export default function PaperDesignerV2() {
  const toast = useToast();
  const { labProfile, updateLabProfile } = useLab();

  // Active Sub-Tab in Designer:
  // 1. 'IDENTITY_MARGINS' -> إعدادات الهوية والترويسة والورقة والهوامش (REG-01)
  // 2. 'VISUAL_DESIGN' -> التصميم المرئي (الشكل والألوان والخطوط) (DESIGN-01)
  // 3. 'RESULTS_COLUMNS' -> تنسيق طريقة كتابة النتائج والأعمدة (DESIGN-02)
  const [designerTab, setDesignerTab] = useState<'IDENTITY_MARGINS' | 'VISUAL_DESIGN' | 'RESULTS_COLUMNS'>('IDENTITY_MARGINS');

  // 1. Identity & Base Profile States
  const [labName, setLabName] = useState(labProfile.labName || 'مختبر الرضا للتحليلات الطبية التخصصية');
  const [labSubtitle, setLabSubtitle] = useState(labProfile.labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل');
  const [doctorName, setDoctorName] = useState(labProfile.doctorName || 'د. أحمد الرضا');
  const [doctorTitle, setDoctorTitle] = useState(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية');
  const [labLicense, setLabLicense] = useState(labProfile.labLicense && labProfile.labLicense !== 'MOH-IQ-2026-8842' ? labProfile.labLicense : '');
  const [phone, setPhone] = useState(labProfile.phone || '07701234567');
  const [whatsappNumber, setWhatsappNumber] = useState(labProfile.whatsappNumber || '07701234567');
  const [address, setAddress] = useState(labProfile.address || 'بغداد - شارع الأطباء - مقابل المجمع الطبي');
  const [currency, setCurrency] = useState(labProfile.currency || 'د.ع');
  const [reportFooter, setReportFooter] = useState(
    labProfile.reportFooter || 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).'
  );
  const [accreditationBadge, setAccreditationBadge] = useState(labProfile.accreditationBadge || 'ISO 15189 Certified Lab');

  // Master Template & Header Style (Unified Bi-Directional Mapping)
  const initialHeaderStyle = labProfile.headerStyle || (labProfile.reportTemplate ? TEMPLATE_TO_HEADER_STYLE_MAP[labProfile.reportTemplate] : undefined) || 'default';
  const initialReportTemplate = labProfile.reportTemplate || HEADER_STYLE_TO_TEMPLATE_MAP[initialHeaderStyle] || 'BAGHDAD_ROYAL_DUAL';

  const [headerStyle, setHeaderStyle] = useState<string>(initialHeaderStyle);
  const [reportTemplate, setReportTemplate] = useState<string>(initialReportTemplate);
  const [headerMode, setHeaderMode] = useState<'DIGITAL' | 'PREPRINTED'>((labProfile.headerMode as any) || 'DIGITAL');
  const [primaryColor, setPrimaryColor] = useState<string>(labProfile.primaryColor || '#0284c7');
  const [logoUrl, setLogoUrl] = useState<string>(labProfile.logoUrl || '');
  const [logoWidthMm, setLogoWidthMm] = useState<number | null>(labProfile.logoWidthMm ?? null);
  const [logoAlign, setLogoAlign] = useState<'left' | 'center' | 'right' | null>(labProfile.logoAlign ?? null);
  const [logoOffsetXMm, setLogoOffsetXMm] = useState<number | null>(labProfile.logoOffsetXMm ?? null);
  const [logoOffsetYMm, setLogoOffsetYMm] = useState<number | null>(labProfile.logoOffsetYMm ?? null);

  // Millimeter Margins Calibration
  const [topMarginMm, setTopMarginMm] = useState<number>(labProfile.topMarginMm ?? 15);
  const [bottomMarginMm, setBottomMarginMm] = useState<number>(labProfile.bottomMarginMm ?? 15);
  const [leftMarginMm, setLeftMarginMm] = useState<number>(labProfile.leftMarginMm ?? 12);
  const [rightMarginMm, setRightMarginMm] = useState<number>(labProfile.rightMarginMm ?? 12);

  // 8 Elements Visibility Switches
  const [showLabName, setShowLabName] = useState<boolean>(labProfile.showLabName ?? true);
  const [showLabSubtitle, setShowLabSubtitle] = useState<boolean>(labProfile.showLabSubtitle ?? true);
  const [showContactInfo, setShowContactInfo] = useState<boolean>(labProfile.showContactInfo ?? true);
  const [showDoctorInfo, setShowDoctorInfo] = useState<boolean>(labProfile.showDoctorInfo ?? true);
  const [showPatientBox, setShowPatientBox] = useState<boolean>(labProfile.showPatientBox ?? true);
  const [showReportBorder, setShowReportBorder] = useState<boolean>(labProfile.showReportBorder ?? true);
  const [showFooter, setShowFooter] = useState<boolean>(labProfile.showFooter ?? true);
  const [showFooterSignature, setShowFooterSignature] = useState<boolean>(labProfile.showFooterSignature ?? true);

  // QR Code Settings
  const [enableQrCode, setEnableQrCode] = useState<boolean>(labProfile.enableQrCode ?? true);
  const [qrCodePosition, setQrCodePosition] = useState<'HEADER' | 'FOOTER'>(labProfile.qrCodePosition || 'HEADER');

  // Security Watermark Customization
  const [enableWatermark, setEnableWatermark] = useState<boolean>(labProfile.enableWatermark ?? false);
  const [watermarkText, setWatermarkText] = useState<string>(labProfile.watermarkText || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(labProfile.watermarkOpacity ?? 0.08);
  const [watermarkAngle, setWatermarkAngle] = useState<number>(labProfile.watermarkAngle ?? -30);
  const [watermarkSize, setWatermarkSize] = useState<number>(labProfile.watermarkSize ?? 46);
  const [watermarkColor, setWatermarkColor] = useState<string>(labProfile.watermarkColor || '#0f172a');

  // Header Lab Name Typography
  const [labNameFontSize, setLabNameFontSize] = useState<number>(labProfile.labNameFontSize ?? 22);
  const [labNameColor, setLabNameColor] = useState<string>(labProfile.labNameColor || labProfile.primaryColor || '#0284c7');
  const [labNameAlignment, setLabNameAlignment] = useState<'RIGHT' | 'CENTER' | 'LEFT'>(labProfile.labNameAlignment || 'RIGHT');
  const [labNameStyle, setLabNameStyle] = useState<'DEFAULT' | 'BOLD' | 'MODERN_BADGE' | 'ELEGANT_BORDER'>(labProfile.labNameStyle || 'DEFAULT');

  // Flexible Clinical Design Architecture
  const [labEmblem, setLabEmblem] = useState<'microscope' | 'tubes' | 'dna' | 'badge' | 'blood' | 'none'>(
    labProfile.labEmblem || 'microscope'
  );
  const [emblemPlacement, setEmblemPlacement] = useState<'header_corner' | 'with_logo' | 'watermark' | 'both'>(
    labProfile.emblemPlacement || 'header_corner'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(labProfile.secondaryColor || '#0ea5e9');
  const [showRangeBar, setShowRangeBar] = useState<boolean>(labProfile.showRangeBar ?? true);
  const [patientLayout, setPatientLayout] = useState<'grid' | 'cards' | 'compact' | 'classic_box'>(
    (labProfile.patientLayout as any) || 'grid'
  );
  const [tableStyle, setTableStyle] = useState<'zebra' | 'grid' | 'clean_lines' | 'compact'>(
    (labProfile as any).tableStyle || 'clean_lines'
  );
  const [cbcLayoutTemplate, setCbcLayoutTemplate] = useState<string>(
    (labProfile as any).cbcLayoutTemplate || 'CLASSIC_5PART'
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'ROYAL' | 'INTERNATIONAL' | 'MODERN' | 'COMPACT' | 'SPECIALIZED' | 'STATIONERY'>('ALL');
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [previewSimulationMode, setPreviewSimulationMode] = useState<'normal' | 'dense' | 'blank'>('normal');
  const [customLetterheadUrl, setCustomLetterheadUrl] = useState<string>(labProfile.customLetterheadUrl || '');
  const [useLetterheadBackground, setUseLetterheadBackground] = useState<boolean>(Boolean(labProfile.useLetterheadBackground));
  const [letterheadMode, setLetterheadMode] = useState<'PREPRINTED' | 'DIGITAL_BACKGROUND'>((labProfile.letterheadMode as any) || 'PREPRINTED');
  const [headerPaddingY, setHeaderPaddingY] = useState<number>(labProfile.headerPaddingY ?? 12);
  const letterheadFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // TAB 1: VISUAL DESIGN (الشكل والألوان والخطوط لكل عنصر)
  // -------------------------------------------------------------
  const [formBgColor, setFormBgColor] = useState<string>(labProfile.formBgColor || '#ffffff');
  const [headerBgColor, setHeaderBgColor] = useState<string>(labProfile.headerBgColor || labProfile.primaryColor || '#0284c7');
  const [headerTextColor, setHeaderTextColor] = useState<string>(labProfile.headerTextColor || '#ffffff');
  const [textColor, setTextColor] = useState<string>(labProfile.textColor || '#0f172a');
  const [borderColor, setBorderColor] = useState<string>(labProfile.borderColor || '#e2e8f0');

  const [fontFamily, setFontFamily] = useState<'Tajawal' | 'Cairo' | 'IBM Plex Sans Arabic' | 'Almarai' | 'System'>(
    (labProfile.fontFamily as any) || 'Tajawal'
  );
  const [fontSize, setFontSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>((labProfile.fontSize as any) || 'MEDIUM');

  // Per-element Font Sizes
  const [reportTitleFontSize, setReportTitleFontSize] = useState<number>(labProfile.reportTitleFontSize ?? 20);
  const [testNameFontSize, setTestNameFontSize] = useState<number>(labProfile.testNameFontSize ?? 12);
  const [resultValueFontSize, setResultValueFontSize] = useState<number>(labProfile.resultValueFontSize ?? 12);
  const [unitFontSize, setUnitFontSize] = useState<number>(labProfile.unitFontSize ?? 11);
  const [refRangeFontSize, setRefRangeFontSize] = useState<number>(labProfile.refRangeFontSize ?? 11);
  const [specialFormFontSize, setSpecialFormFontSize] = useState<number>(labProfile.specialFormFontSize ?? labProfile.print_special_form_font_size ?? 13);
  const [patientNameFontSize, setPatientNameFontSize] = useState<number>(labProfile.patientNameFontSize ?? 13);
  const [patientInfoFontSize, setPatientInfoFontSize] = useState<number>(labProfile.patientInfoFontSize ?? 11);

  // Per-element Font Weights
  const [testNameFontWeight, setTestNameFontWeight] = useState<'normal' | 'bold'>(labProfile.testNameFontWeight || 'bold');
  const [resultValueFontWeight, setResultValueFontWeight] = useState<'normal' | 'bold'>(labProfile.resultValueFontWeight || 'normal');

  // -------------------------------------------------------------
  // TAB 2: RESULTS & COLUMNS LAYOUT (تنسيق كتابة النتائج والأعمدة)
  // -------------------------------------------------------------
  const [tableColumns, setTableColumns] = useState<FormTableColumn[]>(() => {
    if (labProfile.tableColumns && Array.isArray(labProfile.tableColumns) && labProfile.tableColumns.length > 0) {
      return labProfile.tableColumns;
    }
    return DEFAULT_TABLE_COLUMNS;
  });

  const [groupByCategory, setGroupByCategory] = useState<boolean>(labProfile.groupByCategory ?? false);
  const [groupingStyle, setGroupingStyle] = useState<'category' | 'specialty'>(labProfile.groupingStyle || 'category');
  const [tableRowBorders, setTableRowBorders] = useState<boolean>(labProfile.tableRowBorders ?? true);
  const [tableZebraStriping, setTableZebraStriping] = useState<boolean>(labProfile.tableZebraStriping ?? false);
  const [tableRowSpacing, setTableRowSpacing] = useState<'COMPACT' | 'COMFORTABLE' | 'RELAXED'>(
    labProfile.tableRowSpacing || 'COMFORTABLE'
  );
  const [printRangeScope, setPrintRangeScope] = useState<'ALL' | 'APPLICABLE_ONLY'>(
    labProfile.printRangeScope || 'ALL'
  );

  // Camera & File Logo States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Font Family CSS Stack
  const activeFontFamilyCss =
    fontFamily === 'Tajawal' ? "'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" :
    fontFamily === 'Cairo' ? "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" :
    fontFamily === 'IBM Plex Sans Arabic' ? "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" :
    fontFamily === 'Almarai' ? "'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" :
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  // Quick Font Size Preset
  const applyFontSizePreset = (size: 'SMALL' | 'MEDIUM' | 'LARGE') => {
    setFontSize(size);
    if (size === 'SMALL') {
      setTestNameFontSize(10.5);
      setResultValueFontSize(10.5);
      setUnitFontSize(9.5);
      setRefRangeFontSize(9.5);
      setPatientNameFontSize(11.5);
      setPatientInfoFontSize(9.5);
    } else if (size === 'LARGE') {
      setTestNameFontSize(13.5);
      setResultValueFontSize(13.5);
      setUnitFontSize(12);
      setRefRangeFontSize(12);
      setPatientNameFontSize(14.5);
      setPatientInfoFontSize(12);
    } else {
      setTestNameFontSize(12);
      setResultValueFontSize(12);
      setUnitFontSize(11);
      setRefRangeFontSize(11);
      setPatientNameFontSize(13);
      setPatientInfoFontSize(11);
    }
  };

  // Debounced Auto-Save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isInitialMount = useRef(true);
  const hasHydratedRef = useRef(false);

  // Currency Converter states
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(() => {
    const found = findCurrency(labProfile.currency || 'د.ع');
    return found ? found.code : 'IQD';
  });
  const [isCustomCurrency, setIsCustomCurrency] = useState<boolean>(false);
  const [customMultiplier, setCustomMultiplier] = useState<string>('');
  const [convertingPrices, setConvertingPrices] = useState<boolean>(false);
  const [resettingPrices, setResettingPrices] = useState<boolean>(false);
  const [conversionSuccessMsg, setConversionSuccessMsg] = useState<string | null>(null);
  const [showPreviewSamples, setShowPreviewSamples] = useState<boolean>(false);

  const [saving, setSaving] = useState(false);

  // Synchronize state when labProfile loads from remote (Initial Hydration Guard - runs once to prevent wiping user edits)
  useEffect(() => {
    if (hasHydratedRef.current) return;
    if (!labProfile) return;

    if (labProfile.isConfigured || labProfile.labName || labProfile.headerStyle || labProfile.reportTemplate) {
      hasHydratedRef.current = true;
      setLabName(labProfile.labName || 'مختبر الرضا للتحليلات الطبية التخصصية');
      setLabSubtitle(labProfile.labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل');
      setDoctorName(labProfile.doctorName || 'د. أحمد الرضا');
      setDoctorTitle(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية');
      setLabLicense(labProfile.labLicense && labProfile.labLicense !== 'MOH-IQ-2026-8842' ? labProfile.labLicense : '');
      setPhone(labProfile.phone || '07701234567');
      setWhatsappNumber(labProfile.whatsappNumber || '07701234567');
      setAddress(labProfile.address || 'بغداد - شارع الأطباء - مقابل المجمع الطبي');
      setCurrency(labProfile.currency || 'د.ع');
      setReportFooter(labProfile.reportFooter || 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).');
      setAccreditationBadge(labProfile.accreditationBadge || 'ISO 15189 Certified Lab');
      const resolvedHeaderStyle = labProfile.headerStyle || (labProfile.reportTemplate ? TEMPLATE_TO_HEADER_STYLE_MAP[labProfile.reportTemplate] : undefined) || 'default';
      setHeaderStyle(resolvedHeaderStyle);
      const syncedTemplate = (resolvedHeaderStyle && HEADER_STYLE_TO_TEMPLATE_MAP[resolvedHeaderStyle])
        || labProfile.reportTemplate
        || 'BAGHDAD_ROYAL_DUAL';
      setReportTemplate(syncedTemplate as any);
      if (labProfile.headerMode) setHeaderMode(labProfile.headerMode as any);
      if (labProfile.primaryColor) setPrimaryColor(labProfile.primaryColor);
      if (labProfile.logoUrl) setLogoUrl(labProfile.logoUrl);
      setLogoWidthMm(labProfile.logoWidthMm ?? null);
      setLogoAlign(labProfile.logoAlign ?? null);
      setLogoOffsetXMm(labProfile.logoOffsetXMm ?? null);
      setLogoOffsetYMm(labProfile.logoOffsetYMm ?? null);

      setTopMarginMm(labProfile.topMarginMm ?? 15);
      setBottomMarginMm(labProfile.bottomMarginMm ?? 15);
      setLeftMarginMm(labProfile.leftMarginMm ?? 12);
      setRightMarginMm(labProfile.rightMarginMm ?? 12);

      setShowLabName(labProfile.showLabName ?? true);
      setShowLabSubtitle(labProfile.showLabSubtitle ?? true);
      setShowContactInfo(labProfile.showContactInfo ?? true);
      setShowDoctorInfo(labProfile.showDoctorInfo ?? true);
      setShowPatientBox(labProfile.showPatientBox ?? true);
      setShowReportBorder(labProfile.showReportBorder ?? true);
      setShowFooter(labProfile.showFooter ?? true);
      setShowFooterSignature(labProfile.showFooterSignature ?? true);

      setEnableQrCode(labProfile.enableQrCode ?? true);
      if (labProfile.qrCodePosition) setQrCodePosition(labProfile.qrCodePosition);

      setEnableWatermark(labProfile.enableWatermark ?? false);
      setWatermarkText(labProfile.watermarkText || '');
      setWatermarkOpacity(labProfile.watermarkOpacity ?? 0.08);
      setWatermarkAngle(labProfile.watermarkAngle ?? -30);
      setWatermarkSize(labProfile.watermarkSize ?? 46);
      setWatermarkColor(labProfile.watermarkColor || '#0f172a');

      setLabNameFontSize(labProfile.labNameFontSize ?? 22);
      setLabNameColor(labProfile.labNameColor || labProfile.primaryColor || '#0284c7');
      setLabNameAlignment(labProfile.labNameAlignment || 'RIGHT');
      setLabNameStyle(labProfile.labNameStyle || 'DEFAULT');

      setFormBgColor(labProfile.formBgColor || '#ffffff');
      setHeaderBgColor(labProfile.headerBgColor || labProfile.primaryColor || '#0284c7');
      setHeaderTextColor(labProfile.headerTextColor || '#ffffff');
      setTextColor(labProfile.textColor || '#0f172a');
      setBorderColor(labProfile.borderColor || '#e2e8f0');

      if (labProfile.fontFamily) setFontFamily(labProfile.fontFamily as any);
      if (labProfile.fontSize) setFontSize(labProfile.fontSize as any);

      setReportTitleFontSize(labProfile.reportTitleFontSize ?? 20);
      setTestNameFontSize(labProfile.testNameFontSize ?? 12);
      setResultValueFontSize(labProfile.resultValueFontSize ?? 12);
      setUnitFontSize(labProfile.unitFontSize ?? 11);
      setRefRangeFontSize(labProfile.refRangeFontSize ?? 11);
      setSpecialFormFontSize(labProfile.specialFormFontSize ?? labProfile.print_special_form_font_size ?? 13);
      setPatientNameFontSize(labProfile.patientNameFontSize ?? 13);
      setPatientInfoFontSize(labProfile.patientInfoFontSize ?? 11);

      if (labProfile.testNameFontWeight) setTestNameFontWeight(labProfile.testNameFontWeight);
      if (labProfile.resultValueFontWeight) setResultValueFontWeight(labProfile.resultValueFontWeight);

      if (labProfile.tableColumns && Array.isArray(labProfile.tableColumns) && labProfile.tableColumns.length > 0) {
        setTableColumns(labProfile.tableColumns);
      }
      setGroupByCategory(labProfile.groupByCategory ?? false);
      setGroupingStyle(labProfile.groupingStyle || 'category');
      setTableRowBorders(labProfile.tableRowBorders ?? true);
      setTableZebraStriping(labProfile.tableZebraStriping ?? false);
      if (labProfile.tableRowSpacing) setTableRowSpacing(labProfile.tableRowSpacing);
      if (labProfile.printRangeScope) setPrintRangeScope(labProfile.printRangeScope);

      if (labProfile.labEmblem) setLabEmblem(labProfile.labEmblem);
      if (labProfile.emblemPlacement) setEmblemPlacement(labProfile.emblemPlacement);
      if (labProfile.secondaryColor) setSecondaryColor(labProfile.secondaryColor);
      if (labProfile.showRangeBar !== undefined) setShowRangeBar(labProfile.showRangeBar);
      if (labProfile.patientLayout) setPatientLayout(labProfile.patientLayout as any);
      if (labProfile.headerStyle || labProfile.reportTemplate) {
        const hs = labProfile.headerStyle || (labProfile.reportTemplate ? TEMPLATE_TO_HEADER_STYLE_MAP[labProfile.reportTemplate] : undefined) || 'default';
        setHeaderStyle(hs as any);
        if (HEADER_STYLE_TO_TEMPLATE_MAP[hs]) {
          setReportTemplate(HEADER_STYLE_TO_TEMPLATE_MAP[hs]);
        }
      }
      if ((labProfile as any).tableStyle) setTableStyle((labProfile as any).tableStyle);
      if ((labProfile as any).cbcLayoutTemplate) setCbcLayoutTemplate((labProfile as any).cbcLayoutTemplate);
      if (labProfile.customLetterheadUrl !== undefined) setCustomLetterheadUrl(labProfile.customLetterheadUrl || '');
      if (labProfile.useLetterheadBackground !== undefined) setUseLetterheadBackground(Boolean(labProfile.useLetterheadBackground));
      if (labProfile.letterheadMode) setLetterheadMode(labProfile.letterheadMode as any);
      if (labProfile.headerPaddingY !== undefined) setHeaderPaddingY(labProfile.headerPaddingY);
    }
  }, [labProfile]);

  // Curated Medical Color Palettes (Harmonious Dual-Tone Branding)
  const CURATED_PALETTES = [
    { name: 'كحلي ملوكي (Royal Navy)', primary: '#1e3a8a', secondary: '#3b82f6', bg: '#f8fafc' },
    { name: 'فيروزي متروبوليس (Metropolis Teal)', primary: '#0d9488', secondary: '#14b8a6', bg: '#f0fdfa' },
    { name: 'سماوي أزور سريري (Azure Cyan)', primary: '#0284c7', secondary: '#38bdf8', bg: '#f0f9ff' },
    { name: 'زمردي استشاري (Consultant Emerald)', primary: '#059669', secondary: '#10b981', bg: '#f0fdf4' },
    { name: 'عنابي دياجنوستيك (Hematology Crimson)', primary: '#be123c', secondary: '#f43f5e', bg: '#fff1f2' },
    { name: 'ذهبي بغدادي رسمي (Baghdad Gold)', primary: '#1e3a8a', secondary: '#b45309', bg: '#fffbeb' },
    { name: 'بنفسجي تخصصي (Imperial Purple)', primary: '#7c3aed', secondary: '#a855f7', bg: '#faf5ff' },
    { name: 'برتقالي أسرة وأطفال (Family Orange)', primary: '#ea580c', secondary: '#fb923c', bg: '#fff7ed' },
    { name: 'كربوني داكن أنيق (Clinical Charcoal)', primary: '#0f172a', secondary: '#475569', bg: '#f8fafc' },
    { name: 'ياقوتي عميق (Deep Sapphire)', primary: '#4338ca', secondary: '#818cf8', bg: '#eef2ff' },
    { name: 'رصاصي طبي معتدل (Slate Steel)', primary: '#334155', secondary: '#64748b', bg: '#f1f5f9' },
    { name: '🖨️ وضع طابعة الليزر أبيض وأسود 100%', primary: '#000000', secondary: '#475569', bg: '#ffffff' },
  ];

  // Smart Canvas Logo Color Extractor
  const extractColorsFromImage = (imageSrc: string) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);
        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          if (a < 128) continue;
          if (r > 240 && g > 240 && b > 240) continue;
          if (r < 25 && g < 25 && b < 25) continue;
          const qr = Math.round(r / 20) * 20;
          const qg = Math.round(g / 20) * 20;
          const qb = Math.round(b / 20) * 20;
          const hex = '#' + ((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
        const sorted = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
        if (sorted.length > 0) {
          setExtractedColors(sorted.slice(0, 3));
        }
      };
      img.src = imageSrc;
    } catch (e) {
      console.warn('Could not extract colors from logo:', e);
    }
  };

  const fontOptions = [
    { id: 'Tajawal', name: 'تجوال (Tajawal)', desc: 'خط هندسي عصري ناعم وفائق الوضوح في التقارير الطبية' },
    { id: 'Cairo', name: 'كايرو (Cairo)', desc: 'خط كلاسيكي عريض وممتاز للقراءة السريعة' },
    { id: 'IBM Plex Sans Arabic', name: 'آي بي إم بلكس (IBM Plex)', desc: 'خط علمي احترافي ذو معايير تقنية عالية' },
    { id: 'Almarai', name: 'المراعي (Almarai)', desc: 'خط عربي ناعم ومريح للعين ومتوازن جداً' },
    { id: 'System', name: 'خط النظام (System / Arial)', desc: 'الخط الافتراضي السريع بدون تحميل خطوط خارجية' },
  ];

  // Column Reordering & Toggles
  const moveColumn = (index: number, direction: 'UP' | 'DOWN') => {
    const newCols = [...tableColumns];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;
    setTableColumns(newCols);
  };

  const toggleColumnVisibility = (index: number) => {
    const newCols = [...tableColumns];
    newCols[index] = { ...newCols[index], visible: !newCols[index].visible };
    setTableColumns(newCols);
  };

  const updateColumnAlign = (index: number, align: 'left' | 'center' | 'right') => {
    const newCols = [...tableColumns];
    newCols[index] = { ...newCols[index], align };
    setTableColumns(newCols);
  };

  const updateColumnLabel = (index: number, label: string) => {
    const newCols = [...tableColumns];
    newCols[index] = { ...newCols[index], label };
    setTableColumns(newCols);
  };

  // Camera & File Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الشعار يجب ألا يتجاوز 2 ميجابايت', 'تنبيه');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        extractColorsFromImage(reader.result);
        toast.success('تم تحميل الشعار واستخراج ألوان الهوية بنجاح!', 'تم الشعار');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('حجم ملف الفورمة يجب ألا يتجاوز 8 ميجابايت', 'تنبيه الحجم');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomLetterheadUrl(reader.result);
        setUseLetterheadBackground(true);
        setLetterheadMode('DIGITAL_BACKGROUND');
        toast.success('تم رفع الفورمة المخصصة بنجاح وتفعيلها كخلفية رقمية!', 'تم الاعتماد');
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 200);
    } catch (err: any) {
      toast.error('تعذر فتح الكاميرا. يرجى التأكد من توصيل الكاميرا ومنح الصلاحيات.', 'خطأ الكاميرا');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setLogoUrl(dataUrl);
      extractColorsFromImage(dataUrl);
      toast.success('تم التقاط صورة الشعار واستخراج ألوان الهوية بنجاح!', 'تم الشعار');
    }
    stopCamera();
  };

  // Currency Handlers
  const handleSelectCurrency = (code: string) => {
    setSelectedCurrencyCode(code);
    setConversionSuccessMsg(null);
    if (code === 'CUSTOM') {
      setIsCustomCurrency(true);
    } else {
      setIsCustomCurrency(false);
      const currDef = SUPPORTED_CURRENCIES.find((c) => c.code === code);
      if (currDef) {
        setCurrency(currDef.symbol);
        const fromCurr = labProfile.currency || 'د.ع';
        const mult = calculateConversionMultiplier(fromCurr, currDef.code);
        setCustomMultiplier(String(mult < 0.001 ? mult.toFixed(7) : mult < 0.01 ? mult.toFixed(5) : mult < 1 ? mult.toFixed(4) : mult.toFixed(2)));
      }
    }
  };

  const handleConvertPrices = async () => {
    if (!currency.trim()) {
      toast.warning('يرجى تحديد رمز العملة أولاً', 'تنبيه');
      return;
    }
    setConvertingPrices(true);
    try {
      const multVal = customMultiplier ? Number(customMultiplier) : undefined;
      const res = await apiRequest('/tests/convert-currency', 'POST', {
        targetCurrency: currency.trim(),
        rate: multVal && multVal > 0 ? multVal : undefined,
      });

      if (res && res.success) {
        toast.success(`تم بنجاح تحويل وتعديل أسعار ${res.updatedTestsCount} فحصاً و ${res.updatedPanelsCount} باقة بالعملة الجديدة (${res.toCurrency})!`, 'اكتمل التحويل');
        setConversionSuccessMsg(`تم تحويل وتحديث أسعار كافة الفحوصات بالكتالوج لتناسب (${res.toCurrency})`);
        if (res.tests && res.panels) catalogCache.update(res.tests, res.panels);
        await updateLabProfile({ currency: res.toCurrency } as any);
      } else {
        throw new Error(res?.message || 'فشل التحويل');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تحويل أسعار الفحوصات', 'خطأ');
    } finally {
      setConvertingPrices(false);
    }
  };

  const handleResetPricesToDefault = async () => {
    setResettingPrices(true);
    try {
      const res = await apiRequest('/tests/reset-prices', 'POST');
      if (res && res.success) {
        setCurrency('د.ع');
        setSelectedCurrencyCode('IQD');
        setIsCustomCurrency(false);
        setCustomMultiplier('1');
        if (res.tests && res.panels) catalogCache.update(res.tests, res.panels);
        await updateLabProfile({ currency: 'د.ع' } as any);
        toast.success('تمت استعادة كافة أسعار الفحوصات بالدينار العراقي (د.ع) بنجاح!', 'تمت الاستعادة');
        setConversionSuccessMsg('تمت استعادة الكتالوج بالكامل إلى التسعير العراقي الأصلي المعتمد (د.ع)');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل استعادة الأسعار الأصلية', 'خطأ');
    } finally {
      setResettingPrices(false);
    }
  };

  // Master Save Handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        labName,
        labSubtitle,
        doctorName,
        doctorTitle,
        labLicense,
        whatsappNumber,
        currency,
        address,
        phone,
        reportFooter,
        accreditationBadge,
        reportTemplate: HEADER_STYLE_TO_TEMPLATE_MAP[headerStyle] || reportTemplate,
        headerMode,
        topMarginMm: Number(topMarginMm),
        bottomMarginMm: Number(bottomMarginMm),
        leftMarginMm: Number(leftMarginMm),
        rightMarginMm: Number(rightMarginMm),
        primaryColor,
        logoUrl: logoUrl || '',
        logoWidthMm,
        logoAlign,
        logoOffsetXMm,
        logoOffsetYMm,

        // 8 Element Switches
        showLabName,
        showLabSubtitle,
        showContactInfo,
        showDoctorInfo,
        showPatientBox,
        showReportBorder,
        showFooter,
        showFooterSignature,

        // QR Code
        enableQrCode,
        qrCodePosition,

        // Watermark
        enableWatermark,
        watermarkText: watermarkText.trim(),
        watermarkOpacity: Number(watermarkOpacity),
        watermarkAngle: Number(watermarkAngle),
        watermarkSize: Number(watermarkSize),
        watermarkColor,

        // Header Typography
        labNameFontSize: Number(labNameFontSize),
        labNameColor,
        labNameAlignment,
        labNameStyle,

        // Tab 1: Visual Design
        formBgColor,
        headerBgColor,
        headerTextColor,
        textColor,
        borderColor,
        fontFamily,
        fontSize,
        reportTitleFontSize: Number(reportTitleFontSize),
        testNameFontSize: Number(testNameFontSize),
        resultValueFontSize: Number(resultValueFontSize),
        unitFontSize: Number(unitFontSize),
        refRangeFontSize: Number(refRangeFontSize),
        specialFormFontSize: Number(specialFormFontSize),
        print_special_form_font_size: Number(specialFormFontSize),
        patientNameFontSize: Number(patientNameFontSize),
        patientInfoFontSize: Number(patientInfoFontSize),
        testNameFontWeight,
        resultValueFontWeight,

        // Tab 2: Results & Columns Layout
        tableColumns,
        groupByCategory,
        groupingStyle,
        tableRowBorders,
        tableZebraStriping,
        tableRowSpacing,
        printRangeScope,

        // Flexible Clinical Architecture & Lego Block Extensions
        labEmblem,
        emblemPlacement,
        secondaryColor,
        showRangeBar,
        patientLayout,
        headerStyle,
        tableStyle,
        cbcLayoutTemplate,
        customLetterheadUrl,
        useLetterheadBackground,
        letterheadMode,
        headerPaddingY: Number(headerPaddingY),
      };

      await updateLabProfile(payload as any, false);
      await apiRequest('/settings', 'POST', payload);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
      toast.success('تم حفظ كافة إعدادات الفورمة وتنسيق النتائج والمظهر بنجاح!', 'حفظ التكوين');
    } catch (err: any) {
      toast.error(err?.message || 'فشل حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save to ensure Live Preview and Server settings never drift apart
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const payload = {
          labName,
          labSubtitle,
          doctorName,
          doctorTitle,
          labLicense,
          whatsappNumber,
          currency,
          address,
          phone,
          reportFooter,
          accreditationBadge,
          reportTemplate: HEADER_STYLE_TO_TEMPLATE_MAP[headerStyle] || reportTemplate,
          headerMode,
          topMarginMm: Number(topMarginMm),
          bottomMarginMm: Number(bottomMarginMm),
          leftMarginMm: Number(leftMarginMm),
          rightMarginMm: Number(rightMarginMm),
          primaryColor,
          logoUrl: logoUrl || '',
          logoWidthMm,
          logoAlign,
          logoOffsetXMm,
          logoOffsetYMm,

          showLabName,
          showLabSubtitle,
          showContactInfo,
          showDoctorInfo,
          showPatientBox,
          showReportBorder,
          showFooter,
          showFooterSignature,

          enableQrCode,
          qrCodePosition,

          enableWatermark,
          watermarkText: watermarkText.trim(),
          watermarkOpacity: Number(watermarkOpacity),
          watermarkAngle: Number(watermarkAngle),
          watermarkSize: Number(watermarkSize),
          watermarkColor,

          labNameFontSize: Number(labNameFontSize),
          labNameColor,
          labNameAlignment,
          labNameStyle,

          formBgColor,
          headerBgColor,
          headerTextColor,
          textColor,
          borderColor,
          fontFamily,
          fontSize,
          reportTitleFontSize: Number(reportTitleFontSize),
          testNameFontSize: Number(testNameFontSize),
          resultValueFontSize: Number(resultValueFontSize),
          unitFontSize: Number(unitFontSize),
          refRangeFontSize: Number(refRangeFontSize),
          specialFormFontSize: Number(specialFormFontSize),
          print_special_form_font_size: Number(specialFormFontSize),
          patientNameFontSize: Number(patientNameFontSize),
          patientInfoFontSize: Number(patientInfoFontSize),
          testNameFontWeight,
          resultValueFontWeight,

          tableColumns,
          groupByCategory,
          groupingStyle,
          tableRowBorders,
          tableZebraStriping,
          tableRowSpacing,
          printRangeScope,

          labEmblem,
          emblemPlacement,
          secondaryColor,
          showRangeBar,
          patientLayout,
          headerStyle,
          tableStyle,
          cbcLayoutTemplate,
          customLetterheadUrl,
          useLetterheadBackground,
          letterheadMode,
          headerPaddingY: Number(headerPaddingY),
        };

        await updateLabProfile(payload as any, false);
        await apiRequest('/settings', 'POST', payload);
        setAutoSaveStatus('saved');
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2500);
      } catch (e) {
        console.warn('Auto-save error:', e);
        setAutoSaveStatus('idle');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    labName, labSubtitle, doctorName, doctorTitle, labLicense, whatsappNumber,
    currency, address, phone, reportFooter, accreditationBadge,
    headerStyle, reportTemplate, headerMode,
    topMarginMm, bottomMarginMm, leftMarginMm, rightMarginMm,
    primaryColor, logoUrl, logoWidthMm, logoAlign, logoOffsetXMm, logoOffsetYMm,
    showLabName, showLabSubtitle, showContactInfo, showDoctorInfo,
    showPatientBox, showReportBorder, showFooter, showFooterSignature,
    enableQrCode, qrCodePosition,
    enableWatermark, watermarkText, watermarkOpacity, watermarkAngle, watermarkSize, watermarkColor,
    labNameFontSize, labNameColor, labNameAlignment, labNameStyle,
    formBgColor, headerBgColor, headerTextColor, textColor, borderColor,
    fontFamily, fontSize, reportTitleFontSize, testNameFontSize, resultValueFontSize,
    unitFontSize, refRangeFontSize, specialFormFontSize, patientNameFontSize, patientInfoFontSize,
    testNameFontWeight, resultValueFontWeight,
    tableColumns, groupByCategory, groupingStyle, tableRowBorders, tableZebraStriping,
    tableRowSpacing, printRangeScope,
    labEmblem, emblemPlacement, secondaryColor, showRangeBar, patientLayout,
    tableStyle, cbcLayoutTemplate, customLetterheadUrl, useLetterheadBackground, letterheadMode, headerPaddingY
  ]);

  // Live Preview Sample Tests (STRICT REQUIREMENT: NO High/Low flags or alert colors!)
  const sampleGroupsNormal = [
    {
      category: 'كيمياء سريرية (Clinical Chemistry)',
      tests: [
        { testName: 'Fasting Blood Sugar (FBS)', result: '142', unit: 'mg/dL', refRange: '70 - 110', notes: 'صائم 10 ساعات' },
        { testName: 'HbA1c (Glycated Hemoglobin)', result: '7.8', unit: '%', refRange: '4.5 - 6.0', notes: 'متابعة دورية' },
        { testName: 'Serum Creatinine', result: '0.9', unit: 'mg/dL', refRange: '0.6 - 1.2', notes: 'وظائف كلى' },
      ],
    },
    {
      category: 'دهون الدم (Lipid Profile)',
      tests: [
        { testName: 'Total Cholesterol', result: '215', unit: 'mg/dL', refRange: '130 - 200', notes: '-' },
        { testName: 'Triglycerides', result: '140', unit: 'mg/dL', refRange: '50 - 150', notes: '-' },
      ],
    },
  ];

  const sampleGroupsDense = [
    {
      category: 'فحص صورة الدم الشاملة (Complete Blood Count - CBC)',
      tests: [
        { testName: 'White Blood Cells (WBC)', result: '7.4', unit: 'x10^3/uL', refRange: '4.0 - 11.0', notes: 'طبيعي' },
        { testName: 'Red Blood Cells (RBC)', result: '4.85', unit: 'x10^6/uL', refRange: '4.5 - 5.9', notes: 'طبيعي' },
        { testName: 'Hemoglobin (HGB)', result: '14.6', unit: 'g/dL', refRange: '13.0 - 17.5', notes: 'طبيعي' },
        { testName: 'Hematocrit (HCT)', result: '43.2', unit: '%', refRange: '40.0 - 52.0', notes: 'طبيعي' },
        { testName: 'Platelets Count (PLT)', result: '265', unit: 'x10^3/uL', refRange: '150 - 450', notes: 'طبيعي' },
      ],
    },
    {
      category: 'وظائف الكلى والأملاح (Renal Function & Electrolytes)',
      tests: [
        { testName: 'Blood Urea Nitrogen (BUN)', result: '16', unit: 'mg/dL', refRange: '7 - 20', notes: '-' },
        { testName: 'Serum Creatinine', result: '0.95', unit: 'mg/dL', refRange: '0.6 - 1.2', notes: '-' },
        { testName: 'Serum Uric Acid', result: '5.4', unit: 'mg/dL', refRange: '3.5 - 7.2', notes: '-' },
        { testName: 'Serum Sodium (Na+)', result: '141', unit: 'mmol/L', refRange: '136 - 145', notes: '-' },
        { testName: 'Serum Potassium (K+)', result: '4.2', unit: 'mmol/L', refRange: '3.5 - 5.1', notes: '-' },
      ],
    },
    {
      category: 'وظائف الكبد والإنزيمات (Liver Function Tests)',
      tests: [
        { testName: 'ALT / SGPT', result: '28', unit: 'U/L', refRange: '7 - 45', notes: '-' },
        { testName: 'AST / SGOT', result: '24', unit: 'U/L', refRange: '8 - 40', notes: '-' },
        { testName: 'Alkaline Phosphatase (ALP)', result: '78', unit: 'U/L', refRange: '40 - 130', notes: '-' },
        { testName: 'Total Bilirubin', result: '0.7', unit: 'mg/dL', refRange: '0.2 - 1.2', notes: '-' },
      ],
    },
    {
      category: 'دهون الدم وصحة القلب (Lipid Profile)',
      tests: [
        { testName: 'Total Cholesterol', result: '185', unit: 'mg/dL', refRange: '120 - 200', notes: '-' },
        { testName: 'Triglycerides', result: '135', unit: 'mg/dL', refRange: '50 - 150', notes: '-' },
        { testName: 'HDL Cholesterol', result: '48', unit: 'mg/dL', refRange: '> 40', notes: '-' },
        { testName: 'LDL Cholesterol (Calculated)', result: '110', unit: 'mg/dL', refRange: '< 130', notes: '-' },
      ],
    },
  ];

  const sampleGroups = previewSimulationMode === 'dense' ? sampleGroupsDense : sampleGroupsNormal;

  const visibleCols = tableColumns.filter((c) => c.visible);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(400px, 1fr)', gap: '20px', alignItems: 'start' }} dir="rtl">
      {/* -------------------------------------------------------------
          LEFT PANE: CONTROLS & SUB-TABS
          ------------------------------------------------------------- */}
      <div
        className="glass-card custom-scrollbar"
        style={{
          padding: '20px',
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header & Sub-Tabs Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={20} color="var(--accent-cyan)" />
              <span>مصمم فورمة النتائج والتقارير الطبية (Form & Report Designer)</span>
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              التحكم الشامل بهوية المختبر، الهوامش بالمليمتر، الألوان والخطوط، وتنسيق أعمدة النتائج بدقة
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Fixed-width Status Badge with Zero Cumulative Layout Shift (CLS) */}
            <div
              style={{
                minWidth: '165px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                background: autoSaveStatus === 'saving'
                  ? 'rgba(6, 182, 212, 0.1)'
                  : autoSaveStatus === 'saved'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'transparent',
                border: autoSaveStatus === 'saving'
                  ? '1px solid rgba(6, 182, 212, 0.25)'
                  : autoSaveStatus === 'saved'
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : '1px solid transparent',
                opacity: autoSaveStatus === 'idle' ? 0 : 1,
                transition: 'opacity 0.25s ease, background 0.25s ease, border-color 0.25s ease',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {autoSaveStatus === 'saving' && (
                <>
                  <RefreshCw size={13} className="animate-spin" color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--accent-cyan)' }}>جاري الحفظ التلقائي...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span style={{ color: '#10b981' }}>تم الحفظ والمزامنة تلقائياً</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-cyan-primary"
              style={{
                padding: '0 18px',
                height: '36px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <Check size={16} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ وتطبيق التصميم'}</span>
            </button>
          </div>
        </div>

        {/* The 3 Main Sections Tabs: Identity & Header Styles, Visual Design, and Results Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'var(--bg-input-deep)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setDesignerTab('IDENTITY_MARGINS')}
            style={{
              padding: '8px 6px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 800,
              background: designerTab === 'IDENTITY_MARGINS' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: designerTab === 'IDENTITY_MARGINS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: designerTab === 'IDENTITY_MARGINS' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Building2 size={15} />
            <span>1. الهوية والترويسة والهوامش</span>
          </button>

          <button
            type="button"
            onClick={() => setDesignerTab('VISUAL_DESIGN')}
            style={{
              padding: '8px 6px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 800,
              background: designerTab === 'VISUAL_DESIGN' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: designerTab === 'VISUAL_DESIGN' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: designerTab === 'VISUAL_DESIGN' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Palette size={15} />
            <span>2. الألوان والخطوط والشعار</span>
          </button>

          <button
            type="button"
            onClick={() => setDesignerTab('RESULTS_COLUMNS')}
            style={{
              padding: '8px 6px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 800,
              background: designerTab === 'RESULTS_COLUMNS' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: designerTab === 'RESULTS_COLUMNS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: designerTab === 'RESULTS_COLUMNS' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <FileText size={15} />
            <span>3. أعمدة النتائج والجدول</span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            HEADER STYLE & LEGO SECTION SWAPPER (Inside IDENTITY_MARGINS)
            ------------------------------------------------------------- */}
        {designerTab === 'IDENTITY_MARGINS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1.1. Auto-Extracted Logo Palette Notification Banner */}
            {extractedColors.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
                  border: '1.5px solid var(--accent-cyan)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                    <Palette size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                      🎨 تم استخراج لوحة ألوان هويتك البصرية من الشعار تلقائياً!
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      الألوان المتناسقة المكتشفة في شعار مختبرك:
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginRight: '8px' }}>
                    {extractedColors.map((clr, idx) => (
                      <div
                        key={idx}
                        title={`لون الشعار المستخرج: ${clr}`}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: clr,
                          border: '2px solid #fff',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (extractedColors[0]) {
                      setHeaderBgColor(extractedColors[0]);
                      setPrimaryColor(extractedColors[0]);
                    }
                    if (extractedColors[1]) {
                      setSecondaryColor(extractedColors[1]);
                    }
                    toast.success('تم تطبيق ألوان الشعار على التقرير بالكامل بنجاح!', 'تناسق الهوية البصرية');
                  }}
                  className="btn-cyan-primary"
                  style={{ padding: '6px 14px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={14} />
                  <span>تطبيق ألوان الشعار على الفورمة بالكامل</span>
                </button>
              </div>
            )}

            {/* 1.2. Modular Section Swapper (Lego-Style Report Builder) */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                    <Layers size={17} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                      🧩 أنماط الترويسة ومُبدّل أجزاء الفورمة المستقل (Header &amp; Section Swapper)
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      اختر نمط الترويسة بالاسم مباشرة (14 ترويسة احترافية مميزة) مع معاينة حية ومطابقة 100% للطباعة
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                  14 ترويسة مميزة
                </span>
              </div>

              {/* Block A: Full-Width 14 Distinct Header Styles by Name */}
              <div style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                    1. نمط الترويسة (Header Style — 14 نمطاً مميزاً بالاسم):
                  </span>
                  <select
                    value={headerStyle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeaderStyle(val);
                      if (HEADER_STYLE_TO_TEMPLATE_MAP[val]) {
                        setReportTemplate(HEADER_STYLE_TO_TEMPLATE_MAP[val]);
                      }
                      if (headerMode === 'PREPRINTED') {
                        setHeaderMode('DIGITAL');
                      }
                      toast.success('تم تحديث نمط الترويسة في المعاينة والطباعة', 'نمط الترويسة');
                    }}
                    className="input-control"
                    style={{ maxWidth: '340px', height: '34px', fontSize: '11.5px', fontWeight: 800 }}
                  >
                    <option value="default">1. الكلاسيكي الطبي المتوازن (Classic Medical Split)</option>
                    <option value="regal_box">2. الإطار الملكي المزدوج (Regal Boxed Crest)</option>
                    <option value="dual_wing">3. الجناحان المتناظران ثنائي اللغة (Bilingual Dual Wings)</option>
                    <option value="gradient_banner">4. البانر المتدرج الحديث (Modern Gradient Banner)</option>
                    <option value="minimal_pure">5. البسيط النقي (Minimal Pure Clean)</option>
                    <option value="compact_strip">6. الشريط المدمج الاقتصادي (Compact Space-Saver Strip)</option>
                    <option value="gold_frame">7. الترويسة الذهبية الفاخرة (Royal Gold Frame)</option>
                    <option value="smart_digital">8. الترويسة الرقمية الذكية (Smart Digital Card)</option>
                    <option value="accredited_badge">9. ترويسة الاعتماد الدولي (ISO/CAP Accredited)</option>
                    <option value="bauhaus_grid">10. الشبكة الهندسية المؤطرة (Bauhaus Architectural Grid)</option>
                    <option value="aurora_wave">11. الموجة الانسيابية العصرية (Aurora Dynamic Wave)</option>
                    <option value="executive_dark">12. الترويسة التنفيذية الداكنة (Executive Luxury Banner)</option>
                    <option value="vertical_accent">13. الشريط الجانبي البارز (Vertical Spine Accent)</option>
                    <option value="glass_capsule">14. الكبسولة الطبية المقسمة (Modern Clinical Split Capsule)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '6px' }}>
                  {[
                    { id: 'default', title: 'الكلاسيكي الطبي المتوازن (Classic Medical Split)' },
                    { id: 'regal_box', title: 'الإطار الملكي المزدوج (Regal Boxed Crest)' },
                    { id: 'dual_wing', title: 'الجناحان المتناظران ثنائي اللغة (Bilingual Dual Wings)' },
                    { id: 'gradient_banner', title: 'البانر المتدرج الحديث (Modern Gradient Banner)' },
                    { id: 'minimal_pure', title: 'البسيط النقي (Minimal Pure Clean)' },
                    { id: 'compact_strip', title: 'الشريط المدمج الاقتصادي (Compact Space-Saver Strip)' },
                    { id: 'gold_frame', title: 'الترويسة الذهبية الفاخرة (Royal Gold Frame)' },
                    { id: 'smart_digital', title: 'الترويسة الرقمية الذكية (Smart Digital Card)' },
                    { id: 'accredited_badge', title: 'ترويسة الاعتماد الدولي (ISO/CAP Accredited)' },
                    { id: 'bauhaus_grid', title: 'الشبكة الهندسية المؤطرة (Bauhaus Architectural Grid)' },
                    { id: 'aurora_wave', title: 'الموجة الانسيابية العصرية (Aurora Dynamic Wave)' },
                    { id: 'executive_dark', title: 'الترويسة التنفيذية الداكنة (Executive Luxury Banner)' },
                    { id: 'vertical_accent', title: 'الشريط الجانبي البارز (Vertical Spine Accent)' },
                    { id: 'glass_capsule', title: 'الكبسولة الطبية المقسمة (Modern Clinical Split Capsule)' },
                  ].map((hs) => (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => {
                        setHeaderStyle(hs.id);
                        if (HEADER_STYLE_TO_TEMPLATE_MAP[hs.id]) {
                          setReportTemplate(HEADER_STYLE_TO_TEMPLATE_MAP[hs.id]);
                        }
                        if (headerMode === 'PREPRINTED') {
                          setHeaderMode('DIGITAL');
                        }
                        toast.success(`تم اختيار نمط الترويسة: ${hs.title}`, 'تحديث الترويسة');
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '7px',
                        border: headerStyle === hs.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: headerStyle === hs.id ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: headerStyle === hs.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {hs.title}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    نمط وتأطير اسم المختبر:
                  </span>
                  {[
                    { id: 'DEFAULT', title: 'كلاسيكي' },
                    { id: 'BOLD', title: 'عريض بارز' },
                    { id: 'MODERN_BADGE', title: 'شارة حديثة' },
                    { id: 'ELEGANT_BORDER', title: 'إطار رسمي' },
                  ].map((ns) => (
                    <button
                      key={ns.id}
                      type="button"
                      onClick={() => {
                        setLabNameStyle(ns.id as any);
                        setShowLabName(true);
                        if (headerMode === 'PREPRINTED') {
                          setHeaderMode('DIGITAL');
                        }
                        toast.success(`تم تطبيق نمط وتأطير الاسم: ${ns.title}`, 'معاينة فورية');
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: labNameStyle === ns.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: labNameStyle === ns.id ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: labNameStyle === ns.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {ns.title}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Block B: Patient Box Layout */}
                <div style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                    2. بطاقة بيانات المريض (Patient Box):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {[
                      { id: 'grid', title: 'شبكي ثلاثي' },
                      { id: 'cards', title: 'بطاقات عصرية' },
                      { id: 'compact', title: 'مضغوط سطرين' },
                      { id: 'classic_box', title: 'صندوق رسمي' },
                    ].map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => {
                          setPatientLayout(pl.id as any);
                          toast.success(`تم اختيار تخطيط المريض: ${pl.title}`, 'تحديث الجزء');
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: patientLayout === pl.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: patientLayout === pl.id ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                          color: patientLayout === pl.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {pl.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Block C: Table Style */}
                <div style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                    3. نمط جدول النتائج (Results Table):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {[
                      { id: 'clean_lines', title: 'خطوط هادئة' },
                      { id: 'zebra', title: 'تقليم لوني' },
                      { id: 'grid', title: 'شبكة خلايا' },
                      { id: 'compact', title: 'كثيف مدمج' },
                    ].map((ts) => (
                      <button
                        key={ts.id}
                        type="button"
                        onClick={() => {
                          setTableStyle(ts.id as any);
                          if (ts.id === 'zebra') setTableZebraStriping(true);
                          if (ts.id === 'clean_lines') setTableZebraStriping(false);
                          toast.success(`تم اختيار نمط الجدول: ${ts.title}`, 'تحديث الجزء');
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: tableStyle === ts.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: tableStyle === ts.id ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                          color: tableStyle === ts.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {ts.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Block D: Quick Security & Badges */}
                <div style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                    4. الأمان والاعتماد (Security &amp; Badges):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <button
                      type="button"
                      onClick={() => setShowFooterSignature(!showFooterSignature)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: showFooterSignature ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: showFooterSignature ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: showFooterSignature ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {showFooterSignature ? '✓ ختم وتوقيع' : 'ختم وتوقيع'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnableQrCode(!enableQrCode)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: enableQrCode ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: enableQrCode ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: enableQrCode ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {enableQrCode ? '✓ كود QR الذكي' : 'كود QR الذكي'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnableWatermark(!enableWatermark)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: enableWatermark ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: enableWatermark ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: enableWatermark ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {enableWatermark ? '✓ علامة مائية' : 'علامة مائية'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRangeBar(!showRangeBar)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: showRangeBar ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: showRangeBar ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: showRangeBar ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {showRangeBar ? '✓ مؤشر المعدل' : 'مؤشر المعدل'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.3. 12 Curated Medical Color Palettes */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={15} color="var(--accent-cyan)" />
                  <span>لوحات ألوان الهوية الطبية المتناسقة (12 لوحة طبية احترافية):</span>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>نقرة واحدة لتوحيد ألوان الورقة بالكامل</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                {CURATED_PALETTES.map((pal, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setHeaderBgColor(pal.primary);
                      setPrimaryColor(pal.primary);
                      setSecondaryColor(pal.secondary);
                      setLabNameColor(pal.primary);
                      toast.success(`تم تطبيق لوحة: ${pal.name}`, 'تناغم الألوان');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-input-deep)',
                      border: headerBgColor === pal.primary ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      <div style={{ width: '12px', height: '22px', borderRadius: '4px 0 0 4px', background: pal.primary }} />
                      <div style={{ width: '12px', height: '22px', borderRadius: '0 4px 4px 0', background: pal.secondary }} />
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pal.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: VISUAL DESIGN (الشكل والألوان والخطوط)
            ------------------------------------------------------------- */}
        {designerTab === 'VISUAL_DESIGN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Color Palette Controls */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Palette size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>ألوان عناصر الفورمة والورقة (Form Color Palette):</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                {/* Form Background Color */}
                <div style={{ background: 'var(--bg-input-deep)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    لون خلفية الورقة (Form Background):
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formBgColor}
                      onChange={(e) => setFormBgColor(e.target.value)}
                      style={{ width: '38px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={formBgColor}
                      onChange={(e) => setFormBgColor(e.target.value)}
                      className="input-control"
                      style={{ height: '32px', fontSize: '11px', textAlign: 'center', fontWeight: 800 }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormBgColor('#ffffff')}
                      className="btn-secondary"
                      style={{ height: '32px', padding: '0 8px', fontSize: '10px' }}
                      title="استعادة أبيض ناصع"
                    >
                      أبيض
                    </button>
                  </div>
                </div>

                {/* Header Background Color */}
                <div style={{ background: 'var(--bg-input-deep)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    لون ترويسة الجدول/التقرير (Header Color):
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={headerBgColor}
                      onChange={(e) => {
                        setHeaderBgColor(e.target.value);
                        setPrimaryColor(e.target.value);
                      }}
                      style={{ width: '38px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={headerBgColor}
                      onChange={(e) => {
                        setHeaderBgColor(e.target.value);
                        setPrimaryColor(e.target.value);
                      }}
                      className="input-control"
                      style={{ height: '32px', fontSize: '11px', textAlign: 'center', fontWeight: 800 }}
                    />
                    <button
                      type="button"
                      onClick={() => setHeaderBgColor('#0284c7')}
                      className="btn-secondary"
                      style={{ height: '32px', padding: '0 8px', fontSize: '10px' }}
                      title="اللون الملكي"
                    >
                      أزرق
                    </button>
                  </div>
                </div>

                {/* Primary Text Color */}
                <div style={{ background: 'var(--bg-input-deep)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    لون النصوص الأساسية (Body Text Color):
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      style={{ width: '38px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="input-control"
                      style={{ height: '32px', fontSize: '11px', textAlign: 'center', fontWeight: 800 }}
                    />
                    <button
                      type="button"
                      onClick={() => setTextColor('#0f172a')}
                      className="btn-secondary"
                      style={{ height: '32px', padding: '0 8px', fontSize: '10px' }}
                      title="رمادي غامق احترافي"
                    >
                      داكن
                    </button>
                  </div>
                </div>

                {/* Borders / Dividers Color */}
                <div style={{ background: 'var(--bg-input-deep)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    لون الفواصل والحدود (Dividers & Borders):
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      style={{ width: '38px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="input-control"
                      style={{ height: '32px', fontSize: '11px', textAlign: 'center', fontWeight: 800 }}
                    />
                    <button
                      type="button"
                      onClick={() => setBorderColor('#cbd5e1')}
                      className="btn-secondary"
                      style={{ height: '32px', padding: '0 8px', fontSize: '10px' }}
                    >
                      فضي
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Engine & Font Family */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Type size={16} color="var(--accent-teal)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>نوع خط التقرير الطبي (Arabic RTL Font Family):</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {fontOptions.map((f) => {
                  const isSelected = fontFamily === f.id;
                  const itemFontCss =
                    f.id === 'Tajawal' ? "'Tajawal', sans-serif" :
                    f.id === 'Cairo' ? "'Cairo', sans-serif" :
                    f.id === 'IBM Plex Sans Arabic' ? "'IBM Plex Sans Arabic', sans-serif" :
                    f.id === 'Almarai' ? "'Almarai', sans-serif" :
                    "system-ui, sans-serif";

                  return (
                    <div
                      key={f.id}
                      onClick={() => setFontFamily(f.id as any)}
                      style={{
                        border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-input-deep)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)', fontFamily: itemFontCss }}>
                          {f.name}
                        </strong>
                        {isSelected && <CheckCircle2 size={15} color="var(--accent-cyan)" />}
                      </div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>{f.desc}</p>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)', marginTop: '5px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px', fontFamily: itemFontCss }} dir="rtl">
                        نموذج خط طبي: 124.5 mg/dL
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Per-Element Font Sizes & Weights */}
              <div style={{ background: 'var(--bg-input-deep)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                {/* Quick Overall Font Scale Presets */}
                <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                      ⚡ المقياس العام الموحد لخطوط التقرير (Quick Overall Scale):
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                      {fontSize === 'SMALL' ? 'صغير واقتصادي' : fontSize === 'LARGE' ? 'كبير وواضح' : 'متوسط متوازن'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'SMALL', label: '🔤 صغير (Small - 10.5px)', desc: 'لتوفير المساحة في الفحوصات الطويلة' },
                      { id: 'MEDIUM', label: '🔤 متوسط (Medium - 12px)', desc: 'القياس القياسي المتوازن' },
                      { id: 'LARGE', label: '🔤 كبير (Large - 13.5px)', desc: 'كبير وواضح جداً لسهولة القراءة' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => applyFontSizePreset(sz.id as any)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: fontSize === sz.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: fontSize === sz.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)',
                          color: fontSize === sz.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'right',
                          fontSize: '11px',
                          fontWeight: fontSize === sz.id ? 800 : 600,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>{sz.label}</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{sz.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'block', marginBottom: '12px' }}>
                  📏 تحديد حجم الخط لكل عنصر في الجدول على حدة (Per-Element Font Sizes):
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {/* Test Name Size & Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>اسم الفحص (Investigation):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{testNameFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={9}
                      max={18}
                      value={testNameFontSize}
                      onChange={(e) => setTestNameFontSize(Number(e.target.value))}
                      style={{ width: '100%', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setTestNameFontWeight('normal')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '10.5px',
                          borderRadius: '4px',
                          border: testNameFontWeight === 'normal' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: testNameFontWeight === 'normal' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: testNameFontWeight === 'normal' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        عادي (Regular)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestNameFontWeight('bold')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          borderRadius: '4px',
                          border: testNameFontWeight === 'bold' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: testNameFontWeight === 'bold' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: testNameFontWeight === 'bold' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        عريض (Bold)
                      </button>
                    </div>
                  </div>

                  {/* Result Value Size & Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>قيمة النتيجة (Result Value):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{resultValueFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={9}
                      max={18}
                      value={resultValueFontSize}
                      onChange={(e) => setResultValueFontSize(Number(e.target.value))}
                      style={{ width: '100%', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setResultValueFontWeight('normal')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '10.5px',
                          borderRadius: '4px',
                          border: resultValueFontWeight === 'normal' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: resultValueFontWeight === 'normal' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: resultValueFontWeight === 'normal' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        عادي (Regular)
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultValueFontWeight('bold')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          borderRadius: '4px',
                          border: resultValueFontWeight === 'bold' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: resultValueFontWeight === 'bold' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: resultValueFontWeight === 'bold' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        عريض (Bold)
                      </button>
                    </div>
                  </div>

                  {/* Unit Size */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>الوحدة (Unit):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{unitFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={16}
                      value={unitFontSize}
                      onChange={(e) => setUnitFontSize(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Reference Range Size */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>المعدل الطبيعي (Ref. Range):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{refRangeFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={16}
                      value={refRangeFontSize}
                      onChange={(e) => setRefRangeFontSize(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Specialized Ready-Made Forms Font Size */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>حجم خط الفورمات الجاهزة (إدرار / خروج / منوي / CBC):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{specialFormFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={18}
                      value={specialFormFontSize}
                      onChange={(e) => setSpecialFormFontSize(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Patient Name Font Size */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>حجم خط اسم المريض (Patient Name):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{patientNameFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={22}
                      value={patientNameFontSize}
                      onChange={(e) => setPatientNameFontSize(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Patient Info Font Size */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>حجم خط بيانات وتفاصيل المريض (Patient Info):</span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{patientInfoFontSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={18}
                      value={patientInfoFontSize}
                      onChange={(e) => setPatientInfoFontSize(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Header Lab Name Typography */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Sliders size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>تنسيق اسم المختبر في الترويسة (Header Lab Name):</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>حجم خط اسم المختبر:</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{labNameFontSize}px</strong>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={32}
                    value={labNameFontSize}
                    onChange={(e) => setLabNameFontSize(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    محاذاة الاسم في الترويسة:
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['RIGHT', 'CENTER', 'LEFT'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setLabNameAlignment(pos)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: labNameAlignment === pos ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: labNameAlignment === pos ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                          color: labNameAlignment === pos ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {pos === 'RIGHT' ? 'يمين' : pos === 'CENTER' ? 'وسط' : 'يسار'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    نمط وتأطير الاسم:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {[
                      { id: 'DEFAULT', title: 'كلاسيكي' },
                      { id: 'BOLD', title: 'عريض بارز' },
                      { id: 'MODERN_BADGE', title: 'شارة حديثة' },
                      { id: 'ELEGANT_BORDER', title: 'إطار رسمي' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setLabNameStyle(st.id as any);
                          if (!showLabName) setShowLabName(true);
                          if (headerMode === 'PREPRINTED') setHeaderMode('DIGITAL');
                          toast.success(`تم تطبيق نمط وتأطير الاسم: ${st.title}`, 'تحديث اسم المختبر');
                        }}
                        style={{
                          padding: '5px',
                          borderRadius: '6px',
                          border: labNameStyle === st.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: labNameStyle === st.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                          color: labNameStyle === st.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                          cursor: 'pointer',
                          fontSize: '10.5px',
                          fontWeight: 700,
                        }}
                      >
                        {st.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: RESULTS & COLUMNS LAYOUT (تنسيق كتابة النتائج والأعمدة)
            ------------------------------------------------------------- */}
        {designerTab === 'RESULTS_COLUMNS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Strict Positive Guarantee Banner */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={22} color="#10b981" />
              <div>
                <strong style={{ fontSize: '12.5px', color: '#10b981', display: 'block' }}>
                  معيار سريري معتمد: نتائج صافية 100% دون أي مؤشرات أو وسوم تقييم
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  تبقى خانة النتيجة صافية وخالية تماماً من أي أسهم أو علامات High/Low أو ألوان تحذيرية لحفظ دقة وموثوقية التقرير السريري.
                </span>
              </div>
            </div>

            {/* Table Columns Management */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>أعمدة جدول الفحوصات والترتيب والمحاذاة:</strong>
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>استخدم الأسهم لتغيير الترتيب</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tableColumns.map((col, idx) => (
                  <div
                    key={col.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: col.visible ? 'var(--bg-input-deep)' : 'rgba(0,0,0,0.15)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${col.visible ? 'var(--border-color)' : 'rgba(255,255,255,0.05)'}`,
                      opacity: col.visible ? 1 : 0.6,
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Reorder Buttons & Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => moveColumn(idx, 'UP')}
                          disabled={idx === 0}
                          style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--accent-cyan)', cursor: idx === 0 ? 'default' : 'pointer', padding: 0 }}
                          title="تحريك لأعلى"
                        >
                          <MoveUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveColumn(idx, 'DOWN')}
                          disabled={idx === tableColumns.length - 1}
                          style={{ background: 'none', border: 'none', color: idx === tableColumns.length - 1 ? 'var(--text-dim)' : 'var(--accent-cyan)', cursor: idx === tableColumns.length - 1 ? 'default' : 'pointer', padding: 0 }}
                          title="تحريك لأسفل"
                        >
                          <MoveDown size={13} />
                        </button>
                      </div>

                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumnVisibility(idx)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        id={`col-vis-${col.id}`}
                      />
                      <label htmlFor={`col-vis-${col.id}`} style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', cursor: 'pointer' }}>
                        {col.id === 'testName' && '📌 اسم الفحص'}
                        {col.id === 'result' && '🎯 النتيجة'}
                        {col.id === 'unit' && '📐 الوحدة'}
                        {col.id === 'refRange' && '📊 المعدل الطبيعي'}
                        {col.id === 'notes' && '📝 الملاحظات'}
                      </label>
                    </div>

                    {/* Column Label Input */}
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => updateColumnLabel(idx, e.target.value)}
                        className="input-control"
                        style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
                        placeholder="تسمية العمود بالتقرير"
                      />
                    </div>

                    {/* Alignment Buttons */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>المحاذاة:</span>
                      {(['right', 'center', 'left'] as const).map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() => updateColumnAlign(idx, al)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: col.align === al ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: col.align === al ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                            color: col.align === al ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          {al === 'right' ? 'يمين' : al === 'center' ? 'وسط' : 'يسار'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Grouping & Table Display Options */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Layers size={16} color="var(--accent-teal)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>طريقة عرض الفئات وتنسيق الجدول (Table Display Options):</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                {/* Group By Category */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>تجميع الفحوصات حسب الفئة (Grouping by Category)</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>فصل الفحوصات بترويسة أنيقة لكل قسم مخبري</div>
                  </div>
                </label>

                {/* Table Row Borders */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tableRowBorders}
                    onChange={(e) => setTableRowBorders(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>خطوط الفواصل بين الصفوف (Row Borders)</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>إظهار خط فاصل أنيق أسفل كل فحص</div>
                  </div>
                </label>

                {/* Zebra Striping */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tableZebraStriping}
                    onChange={(e) => setTableZebraStriping(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>تظليل الصفوف المتناوبة (Zebra Striping)</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>تظليل خفيف للصفوف لسهولة تتبع الأرقام بالعين</div>
                  </div>
                </label>
              </div>

              {/* Sub-option: Grouping Style when groupByCategory is checked */}
              {groupByCategory && (
                <div style={{ marginBottom: '14px', padding: '12px 14px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--accent-cyan)" />
                    <span>نمط التجميع المعتمد في التقارير وشاشات العمل (Grouping Style):</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: `1.5px solid ${groupingStyle === 'category' ? 'var(--accent-teal)' : 'var(--border-color)'}`, background: groupingStyle === 'category' ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-card)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="groupingStyle"
                        value="category"
                        checked={groupingStyle === 'category'}
                        onChange={() => setGroupingStyle('category')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-main)' }}>حسب التصنيف المخبري التقليدي (Category)</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>التجميع الافتراضي الحالي حسب الأقسام المخبرية القياسية</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: `1.5px solid ${groupingStyle === 'specialty' ? 'var(--accent-cyan)' : 'var(--border-color)'}`, background: groupingStyle === 'specialty' ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="groupingStyle"
                        value="specialty"
                        checked={groupingStyle === 'specialty'}
                        onChange={() => setGroupingStyle('specialty')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent-cyan)' }}>هرمي حسب الاختصاص والمجموعات (Specialty)</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>تجميع سريري احترافي (الاختصاص ➔ المجموعة ➔ الفحوصات)</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Row Spacing Density */}
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  كثافة وارتفاع الصفوف وتباعد الأسطر (Row Spacing / Density):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'COMPACT', title: 'مضغوط (Compact)', desc: 'تباعد ضيق لاستيعاب أكبر عدد من الفحوصات' },
                    { id: 'COMFORTABLE', title: 'مريح متوازن (Comfortable)', desc: 'القياس المعياري الموصى به طبياً' },
                    { id: 'RELAXED', title: 'واسع ومريح (Relaxed)', desc: 'تباعد أسطر رحب للقراءة السهلة والواضحة' },
                  ].map((sp) => (
                    <div
                      key={sp.id}
                      onClick={() => setTableRowSpacing(sp.id as any)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: tableRowSpacing === sp.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: tableRowSpacing === sp.id ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-input-deep)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '11.5px', color: tableRowSpacing === sp.id ? 'var(--accent-cyan)' : 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                        {sp.title}
                      </strong>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{sp.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference Range Scope Selection (Item 5) */}
              <div style={{ marginTop: '16px', background: 'var(--bg-input-deep)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  نطاق طباعة المديات المرجعية في التقرير الطبي (Reference Range Scope):
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                  تحديد ما إذا كان التقرير المطبوع يعرض جميع المديات للفحص أو المدى المطابق للمريض فقط
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'ALL', title: 'كافة المديات المرجعية (All Ranges)', desc: 'عرض جميع المديات المسجلة (الوضع الافتراضي)' },
                    { id: 'APPLICABLE_ONLY', title: 'المدى المطابق للمريض فقط (Applicable Range Only)', desc: 'عرض المدى المطابق لجنس وعمر المريض وقت الفحص' },
                  ].map((sc) => (
                    <div
                      key={sc.id}
                      onClick={() => setPrintRangeScope(sc.id as any)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: printRangeScope === sc.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: printRangeScope === sc.id ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ fontSize: '12px', color: printRangeScope === sc.id ? 'var(--accent-cyan)' : 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                        {sc.title}
                      </strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sc.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CBC Layout Template Selection (10 Templates) */}
            <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(225, 29, 72, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                    <Microscope size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                      🩸 تصميم فورمة فحص الدم الشامل (CBC Layout — 10 تصاميم احترافية)
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      اختر التخطيط البصري المعتمد لطباعة تقارير فحص الدم (3-Part / 5-Part / Histograms)
                    </span>
                  </div>
                </div>

                <a
                  href={`/api/samples/1001/print?section=cbc&cbcLayout=${encodeURIComponent(cbcLayoutTemplate)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cyan-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    borderRadius: '8px',
                  }}
                >
                  <Printer size={14} />
                  <span>معاينة تصميم CBC المختار</span>
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {CBC_LAYOUT_TEMPLATES_LIST.map((tpl) => {
                  const isSelected = cbcLayoutTemplate === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setCbcLayoutTemplate(tpl.id);
                        toast.success(`تم اختيار تصميم CBC: ${tpl.nameAr}`, 'قالب فحص الدم');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${tpl.accentColor}` : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-input-deep)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: tpl.accentColor,
                            color: '#ffffff',
                          }}
                        >
                          {tpl.badge}
                        </span>
                        {isSelected && <CheckCircle2 size={15} color="var(--accent-cyan)" />}
                      </div>
                      <strong style={{ fontSize: '11.5px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                        {tpl.nameAr}
                      </strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {tpl.descriptionAr}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
                        <span style={{ fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--text-muted)' }} dir="ltr">
                          {tpl.id}
                        </span>
                        <a
                          href={`/api/samples/1001/print?section=cbc&cbcLayout=${encodeURIComponent(tpl.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} />
                          <span>معاينة</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: IDENTITY & MARGINS (الإعدادات المسترجعة وهوامش الورقة)
            ------------------------------------------------------------- */}
        {designerTab === 'IDENTITY_MARGINS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Presets Bar */}
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} />
                  <span>أوضاع الطباعة السريعة المسبقة (Quick Presets):</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ضبط فوري لكافة الهوامش والعناصر بنقرة واحدة
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMode('PREPRINTED');
                    setTopMarginMm(35);
                    setBottomMarginMm(25);
                    setShowLabName(false);
                    setShowLabSubtitle(false);
                    setShowContactInfo(false);
                    setShowDoctorInfo(false);
                    setShowPatientBox(false);
                    setShowReportBorder(false);
                    setShowFooter(false);
                    setShowFooterSignature(false);
                    setEnableQrCode(false);
                    toast.success('تم تفعيل وضع النتائج فقط للورق المروّس بالمطبعة!', 'النتائج فقط');
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', color: '#f59e0b', borderColor: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Square size={13} />
                  <span>📄 تفريغ للنتائج فقط (Results Only)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHeaderMode('DIGITAL');
                    setTopMarginMm(15);
                    setBottomMarginMm(15);
                    setShowLabName(true);
                    setShowLabSubtitle(true);
                    setShowContactInfo(true);
                    setShowDoctorInfo(true);
                    setShowPatientBox(true);
                    setShowReportBorder(true);
                    setShowFooter(true);
                    setShowFooterSignature(true);
                    setEnableQrCode(true);
                    setReportTemplate('CLASSIC');
                    setHeaderStyle('default');
                    setPrimaryColor('#0284c7');
                    toast.success('تم استعادة التصميم الكامل والافتراضي لورقة التقرير!', 'التصميم الكامل');
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckSquare size={13} />
                  <span>🖥️ التصميم الكامل الملون (Full Digital)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportTemplate('BLACK_WHITE');
                    setHeaderStyle('minimal_pure');
                    setPrimaryColor('#000000');
                    setHeaderBgColor('#000000');
                    setShowReportBorder(true);
                    toast.success('تم تفعيل نمط أبيض وأسود ليزري!', 'أبيض وأسود');
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px', color: '#94a3b8', borderColor: '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🖨️ نمط أبيض وأسود ليزري</span>
                </button>
              </div>
            </div>

            {/* Millimeter Margins Calibration */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Sliders size={16} color="var(--accent-emerald)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>معايرة هوامش الصفحة بدقة المليمتر (Millimeter Margins Calibration):</strong>
              </div>

              {/* Preset buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTopMarginMm(35);
                    setBottomMarginMm(25);
                    setLeftMarginMm(12);
                    setRightMarginMm(12);
                    toast.info('تم تطبيق هوامش الورق المروّس (35/25 mm)');
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                >
                  📄 ورق مروّس قياسي (35/25 mm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTopMarginMm(15);
                    setBottomMarginMm(15);
                    setLeftMarginMm(12);
                    setRightMarginMm(12);
                    toast.info('تم تطبيق هوامش الورق العادي (15/15 mm)');
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                >
                  🖥️ ورق عادي متوازن (15/15 mm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTopMarginMm(8);
                    setBottomMarginMm(8);
                    setLeftMarginMm(8);
                    setRightMarginMm(8);
                    toast.info('تم تطبيق هوامش ضيقة (8/8 mm)');
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                >
                  📐 هوامش ضيقة جداً (8/8 mm)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>الهامش العلوي (Top Margin):</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{topMarginMm} mm</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={topMarginMm}
                    onChange={(e) => setTopMarginMm(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>الهامش السفلي (Bottom Margin):</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{bottomMarginMm} mm</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bottomMarginMm}
                    onChange={(e) => setBottomMarginMm(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>الهامش الأيمن (Right Margin):</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{rightMarginMm} mm</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={rightMarginMm}
                    onChange={(e) => setRightMarginMm(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>الهامش الأيسر (Left Margin):</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--accent-cyan)' }}>{leftMarginMm} mm</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={leftMarginMm}
                    onChange={(e) => setLeftMarginMm(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* 8 Elements Visibility Switches */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Layers size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>مفاتيح إظهار وإخفاء عناصر التقرير (8 Switches):</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'showLabName', label: 'اسم المختبر الرسمي', checked: showLabName, set: setShowLabName, desc: 'الاسم الرئيسي في الترويسة' },
                  { id: 'showLabSubtitle', label: 'الوصف الفرعي للمختبر', checked: showLabSubtitle, set: setShowLabSubtitle, desc: 'العبارة التعريفية أسفل الاسم' },
                  { id: 'showContactInfo', label: 'بيانات التواصل والعنوان', checked: showContactInfo, set: setShowContactInfo, desc: 'العنوان الجغرافي والهاتف' },
                  { id: 'showDoctorInfo', label: 'بيانات الطبيب / المشرف', checked: showDoctorInfo, set: setShowDoctorInfo, desc: 'اسم الطبيب واختصاصه وترخيصه' },
                  { id: 'showPatientBox', label: 'صندوق معلومات المريض', checked: showPatientBox, set: setShowPatientBox, desc: 'الاسم، العمر، الجنس، رقم العينة' },
                  { id: 'showReportBorder', label: 'إطار ورقة التقرير الخارجية', checked: showReportBorder, set: setShowReportBorder, desc: 'برواز أنيق يحيط بالورقة' },
                  { id: 'showFooter', label: 'تذييل التقرير الرسمي (Footer)', checked: showFooter, set: setShowFooter, desc: 'عبارة الاعتماد القانوني' },
                  { id: 'showFooterSignature', label: 'توقيع وتفويض المختبر بالفوتر', checked: showFooterSignature, set: setShowFooterSignature, desc: 'ختم وتفويض الطبيب السريري' },
                ].map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: 'var(--bg-input-deep)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.set(e.target.checked)}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)' }}>{item.label}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* QR Code */}
              <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableQrCode}
                    onChange={(e) => setEnableQrCode(e.target.checked)}
                    style={{ width: '15px', height: '15px' }}
                  />
                  <div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <QrCode size={13} color="var(--accent-cyan)" />
                      <span>باركود التحقق الإلكتروني (QR Code)</span>
                    </span>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>يتيح للمريض مسح الكود لعرض التقرير PDF</span>
                  </div>
                </label>

                {enableQrCode && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['HEADER', 'FOOTER'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setQrCodePosition(pos)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: qrCodePosition === pos ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: qrCodePosition === pos ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: qrCodePosition === pos ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        }}
                      >
                        {pos === 'HEADER' ? 'في الترويسة' : 'في التذييل'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Security Watermark */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>العلامة المائية للأمان والتوثيق (Security Watermark):</strong>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                    style={{ width: '15px', height: '15px' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: enableWatermark ? '#10b981' : '#ef4444' }}>
                    {enableWatermark ? 'مفعلة' : 'معطلة'}
                  </span>
                </label>
              </div>

              {enableWatermark && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label className="input-label" style={{ fontSize: '11px' }}>نص العلامة المائية:</label>
                    <input
                      type="text"
                      className="input-control"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder={labName || 'ORIGINAL REPORT'}
                      style={{ height: '30px', fontSize: '11px' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>درجة الشفافية:</span>
                      <strong style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{Math.round(watermarkOpacity * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min={0.03}
                      max={0.3}
                      step={0.01}
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>زاوية الميلان:</span>
                      <strong style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{watermarkAngle}°</strong>
                    </div>
                    <input
                      type="range"
                      min={-90}
                      max={90}
                      step={5}
                      value={watermarkAngle}
                      onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>حجم الخط:</span>
                      <strong style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{watermarkSize}px</strong>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={80}
                      value={watermarkSize}
                      onChange={(e) => setWatermarkSize(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Core Lab Identity & MOH License */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Building2 size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>بيانات وهوية المختبر والترخيص الرسمي:</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>اسم المختبر الرسمي *</label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>الوصف الفرعي (Subtitle)</label>
                  <input
                    type="text"
                    className="input-control"
                    value={labSubtitle}
                    onChange={(e) => setLabSubtitle(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>الطبيب أو المشرف الفني *</label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>اللقب والاختصاص العلمي</label>
                  <input
                    type="text"
                    className="input-control"
                    value={doctorTitle}
                    onChange={(e) => setDoctorTitle(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>رقم الترخيص الوزاري (MOH License)</label>
                  <input
                    type="text"
                    className="input-control"
                    value={labLicense}
                    onChange={(e) => setLabLicense(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>رقم الهاتف الرسمي</label>
                  <input
                    type="text"
                    className="input-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>رقم الواتساب للنتائج</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="input-control"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      style={{ height: '32px', fontSize: '11px', flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('labryo:open-whatsapp-qr'));
                        }
                      }}
                      title="فتح شاشة باركود ربط واتساب ويب وتفعيل الإرسال التلقائي"
                      style={{
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      <QrCode size={13} />
                      <span>ربط الباركود (QR)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '11px' }}>العنوان الجغرافي</label>
                  <input
                    type="text"
                    className="input-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>تذييل التقرير الرسمي (Report Footer)</label>
                  <textarea
                    rows={2}
                    className="input-control"
                    value={reportFooter}
                    onChange={(e) => setReportFooter(e.target.value)}
                    style={{ fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>

            {/* Logo Manager */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <ImageIcon size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>شعار المختبر الرسمي (Lab Logo):</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {logoUrl ? (
                  <div style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="حذف الشعار"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <ImageIcon size={28} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} />
                    <span>رفع ملف الشعار</span>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Camera size={14} />
                    <span>التقاط بالكاميرا</span>
                  </button>
                </div>
              </div>

              {/* Webcam Modal */}
              {isCameraOpen && (
                <div style={{ marginTop: '12px', background: '#000', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <video ref={videoRef} style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <button type="button" onClick={capturePhoto} className="btn-cyan-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                      التقاط الصورة
                    </button>
                    <button type="button" onClick={stopCamera} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced Logo Size & Position Controls */}
              <LogoSettingsControl
                logoUrl={logoUrl}
                logoWidthMm={logoWidthMm}
                logoAlign={logoAlign}
                logoOffsetXMm={logoOffsetXMm}
                logoOffsetYMm={logoOffsetYMm}
                onChange={(updates) => {
                  if (updates.logoWidthMm !== undefined) setLogoWidthMm(updates.logoWidthMm);
                  if (updates.logoAlign !== undefined) setLogoAlign(updates.logoAlign);
                  if (updates.logoOffsetXMm !== undefined) setLogoOffsetXMm(updates.logoOffsetXMm);
                  if (updates.logoOffsetYMm !== undefined) setLogoOffsetYMm(updates.logoOffsetYMm);
                }}
                onReset={() => {
                  setLogoWidthMm(null);
                  setLogoAlign(null);
                  setLogoOffsetXMm(null);
                  setLogoOffsetYMm(null);
                }}
              />
            </div>

            {/* Currency and Pricing Engine */}
            <div style={{ background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>التحكم بالعملة والتسعير المخبري:</strong>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                  العملة الحالية: {currency || 'د.ع'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px', marginBottom: '10px' }}>
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = selectedCurrencyCode === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleSelectCurrency(curr.code)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        background: isSelected ? 'rgba(2, 132, 199, 0.18)' : 'var(--bg-main)',
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        textAlign: 'right',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{curr.flag}</span>
                      <span style={{ fontWeight: isSelected ? 800 : 500 }}>{curr.nameAr}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleConvertPrices}
                  disabled={convertingPrices || !currency.trim()}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Zap size={14} />
                  <span>تطبيق وتحويل أسعار الكتالوج لعملة ({currency})</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetPricesToDefault}
                  disabled={resettingPrices}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  <RotateCcw size={13} />
                  <span>استعادة الدينار العراقي (د.ع)</span>
                </button>
              </div>

              {conversionSuccessMsg && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '6px', fontSize: '11px', color: '#10b981' }}>
                  ✓ {conversionSuccessMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          RIGHT PANE: REAL-TIME LIVE A4 PREVIEW (STATIONARY / STICKY)
          ------------------------------------------------------------- */}
      <div
        className="custom-scrollbar"
        style={{
          position: 'sticky',
          top: '76px',
          alignSelf: 'start',
          zIndex: 30,
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
        }}
      >
        {/* Preview Control Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={14} color="var(--accent-cyan)" />
            <span>معاينة حية ومطابقة للطباعة (A4 Live Preview)</span>
          </span>

          {/* Simulation Switcher Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input-deep)', padding: '2px 4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {[
              { id: 'normal', label: '🧪 عادي (5)' },
              { id: 'dense', label: '📋 كثيف (25+)' },
              { id: 'blank', label: '📄 فورمة فارغة' },
            ].map((sim) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => setPreviewSimulationMode(sim.id as any)}
                style={{
                  padding: '3px 7px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: previewSimulationMode === sim.id ? 800 : 500,
                  background: previewSimulationMode === sim.id ? 'var(--accent-cyan)' : 'transparent',
                  color: previewSimulationMode === sim.id ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {sim.label}
              </button>
            ))}
          </div>

          <a
            href={previewSimulationMode === 'blank' ? `/api/templates/blank/print?mode=blank&template=${HEADER_STYLE_TO_TEMPLATE_MAP[headerStyle] || reportTemplate}&headerStyle=${headerStyle}` : `/api/samples/1001/print?template=${HEADER_STYLE_TO_TEMPLATE_MAP[headerStyle] || reportTemplate}&headerStyle=${headerStyle}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            title={previewSimulationMode === 'blank' ? 'طباعة الفورمة الفارغة بدون خطوط' : 'فتح قالب الطباعة التجريبي'}
          >
            <Printer size={12} />
            <span>{previewSimulationMode === 'blank' ? 'طباعة الفورمة الفارغة' : 'تجربة الطباعة'}</span>
          </a>
        </div>

        {/* Real-Time Live Font Injection & Scaled A4 Simulated Sheet */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800;900&display=swap');
          .live-paper-sheet,
          .live-paper-sheet h1,
          .live-paper-sheet h2,
          .live-paper-sheet h3,
          .live-paper-sheet h4,
          .live-paper-sheet p,
          .live-paper-sheet span:not(.font-mono),
          .live-paper-sheet td:not(.font-mono),
          .live-paper-sheet th,
          .live-paper-sheet strong:not(.font-mono),
          .live-paper-sheet div:not(.font-mono) {
            font-family: ${activeFontFamilyCss} !important;
          }
        `}</style>
        <div
          className="glass-card live-paper-sheet"
          style={{
            background: formBgColor,
            backgroundImage: useLetterheadBackground && customLetterheadUrl ? `url(${customLetterheadUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: textColor,
            fontFamily: activeFontFamilyCss,
            border: showReportBorder ? `2px solid ${borderColor}` : '1px solid #e2e8f0',
            padding: `${topMarginMm * 1.5}px ${leftMarginMm * 1.5}px ${bottomMarginMm * 1.5}px ${rightMarginMm * 1.5}px`,
            borderRadius: '6px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            direction: 'ltr',
            minHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Watermark Overlay Layer */}
          {enableWatermark && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${watermarkAngle}deg)`,
                fontSize: `${watermarkSize}px`,
                fontWeight: 900,
                color: watermarkColor,
                opacity: watermarkOpacity,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
                textAlign: 'center',
                maxWidth: '90%',
                lineHeight: 1.2,
              }}
            >
              {watermarkText || labName || 'ORIGINAL REPORT'}
            </div>
          )}

          {/* Top Space or Digital Header */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {headerMode === 'PREPRINTED' ? (
              <div
                style={{
                  height: `${Math.max(35, topMarginMm * 1.8)}px`,
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.02)',
                  color: '#64748b',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                📄 Pre-Printed Lab Stationery Reserved Space ({topMarginMm}mm)
              </div>
            ) : (showLabName || showLabSubtitle || showContactInfo || showDoctorInfo || (enableQrCode && qrCodePosition === 'HEADER')) ? (() => {
              const hasCustomPreviewLogo = Boolean(
                logoUrl && (
                  logoWidthMm !== null ||
                  logoAlign !== null ||
                  logoOffsetXMm !== null ||
                  logoOffsetYMm !== null
                )
              );
              const previewWidthPx = Math.round((logoWidthMm ?? 25) * 2.2);
              const previewAlign = logoAlign ?? 'right';
              const previewOffsetXPx = Math.round((logoOffsetXMm ?? 0) * 2.2);
              const previewOffsetYPx = Math.round((logoOffsetYMm ?? 0) * 2.2);

              const renderCustomPreviewLogo = () => (
                <div style={{ display: 'inline-flex', justifyContent: previewAlign === 'center' ? 'center' : previewAlign === 'left' ? 'flex-start' : 'flex-end', overflow: 'hidden', verticalAlign: 'middle' }}>
                  <img
                    src={logoUrl}
                    alt="Logo"
                    style={{
                      width: `${previewWidthPx}px`,
                      maxWidth: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                      transform: `translate(${previewOffsetXPx}px, ${previewOffsetYPx}px)`,
                    }}
                  />
                </div>
              );

              const activeHeader = headerStyle || 'default';

              const renderStyledLabName = (isDarkBg = false, fallbackColor = primaryColor || '#1e3a8a', fontSizeOverride?: number) => {
                if (!showLabName) return null;
                const effectiveColor = isDarkBg ? (headerTextColor || '#ffffff') : (labNameColor || primaryColor || fallbackColor);
                const fSize = fontSizeOverride || labNameFontSize || 18;

                const styleObj: React.CSSProperties = {
                  margin: 0,
                  fontSize: `${fSize}px`,
                  color: effectiveColor,
                  lineHeight: 1.25,
                  transition: 'all 0.15s ease',
                  fontWeight: labNameStyle === 'BOLD' ? 950 : 800,
                  display: (labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' || labNameStyle === 'BOLD') ? 'inline-block' : 'block',
                };

                if (labNameStyle === 'BOLD') {
                  styleObj.letterSpacing = '-0.3px';
                  styleObj.textShadow = isDarkBg ? '0 2px 4px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.15)';
                  styleObj.borderBottom = isDarkBg ? '2.5px solid rgba(255,255,255,0.85)' : `2.5px solid ${secondaryColor || effectiveColor}`;
                  styleObj.paddingBottom = '2px';
                } else if (labNameStyle === 'MODERN_BADGE') {
                  styleObj.background = isDarkBg ? 'rgba(255,255,255,0.22)' : `${effectiveColor}18`;
                  styleObj.border = isDarkBg ? '1.5px solid rgba(255,255,255,0.45)' : `1.5px solid ${effectiveColor}45`;
                  styleObj.padding = '3px 12px';
                  styleObj.borderRadius = '8px';
                } else if (labNameStyle === 'ELEGANT_BORDER') {
                  styleObj.border = isDarkBg ? '2px double #ffffff' : `2px solid ${effectiveColor}`;
                  styleObj.outline = isDarkBg ? '1px solid rgba(255,255,255,0.5)' : `1px solid ${secondaryColor || effectiveColor}`;
                  styleObj.outlineOffset = '2px';
                  styleObj.background = isDarkBg ? 'rgba(0,0,0,0.18)' : `${effectiveColor}08`;
                  styleObj.padding = '3px 12px';
                  styleObj.borderRadius = '4px';
                }

                return (
                  <div style={{ textAlign: labNameAlignment.toLowerCase() as any, marginBottom: '2px' }}>
                    <h1 style={styleObj}>
                      {!hasCustomPreviewLogo && logoUrl && (
                        <img src={logoUrl} alt="Logo" style={{ height: `${Math.max(20, fSize + 2)}px`, marginRight: '6px', marginLeft: '6px', verticalAlign: 'middle', objectFit: 'contain' }} />
                      )}
                      <span>{labName || 'مختبر الرضا التخصصي'}</span>
                    </h1>
                  </div>
                );
              };

              if (activeHeader === 'regal_box') {
                return (
                  <div style={{ border: `2px solid ${primaryColor || '#1e3a8a'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', background: '#ffffff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${secondaryColor || '#b45309'}`, paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: primaryColor || '#1e3a8a', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Award size={22} color="#fbbf24" />
                        </div>
                        <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                          {renderStyledLabName(false, primaryColor || '#1e3a8a')}
                          {showLabSubtitle && <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569' }}>{labSubtitle}</div>}
                          {showContactInfo && <div style={{ fontSize: '8.5px', color: '#64748b' }}>{address} | Tel: {phone}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', flexShrink: 0 }} dir="ltr">
                        {labLicense && labLicense !== 'MOH-IQ-2026-8842' ? (
                          <div style={{ textAlign: 'right', borderRight: enableQrCode && qrCodePosition === 'HEADER' ? '1.5px solid #cbd5e1' : 'none', paddingRight: enableQrCode && qrCodePosition === 'HEADER' ? '6px' : '0' }}>
                            <div style={{ fontSize: "7.5px", color: "#64748b" }}>{labLicense}</div>
                          </div>
                        ) : null}
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ border: `1px solid ${primaryColor || '#1e3a8a'}`, borderRadius: '4px', padding: '2px', background: '#fff' }}>
                            <QrCode size={26} color={primaryColor || '#1e3a8a'} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'dual_wing') {
                return (
                  <div style={{ borderBottom: `2.5px solid ${textColor || '#0f172a'}`, paddingBottom: '8px', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: primaryColor || '#0f172a', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Microscope size={22} color="#fbbf24" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: labNameAlignment === 'CENTER' ? 'center' : labNameAlignment === 'LEFT' ? 'flex-start' : 'flex-end' }}>
                            {renderStyledLabName(false, '#0f172a')}
                            
                          </div>
                          {showLabSubtitle && <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569' }}>{labSubtitle}</div>}
                          {showContactInfo && <div style={{ fontSize: '8px', color: '#64748b' }}>{labLicense && labLicense !== 'MOH-IQ-2026-8842' ? `${labLicense} • ` : ""}{address} | {phone}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', flexShrink: 0 }} dir="ltr">
                        
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', background: '#ffffff' }}>
                            <QrCode size={24} color="#0f172a" />
                            
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'gradient_banner') {
                return (
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${headerBgColor} 0%, ${secondaryColor || '#06b6d4'} 100%)`,
                      color: headerTextColor,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {hasCustomPreviewLogo && previewAlign === 'center' && (
                      <div style={{ textAlign: 'center', marginBottom: '6px' }}>{renderCustomPreviewLogo()}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {hasCustomPreviewLogo && previewAlign === 'left' && (
                        <div style={{ marginRight: '10px', flexShrink: 0 }}>{renderCustomPreviewLogo()}</div>
                      )}
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        {renderStyledLabName(true, headerTextColor)}
                        {showLabSubtitle && <p style={{ fontSize: '9.5px', opacity: 0.9, margin: 0 }}>{labSubtitle}</p>}
                        {showContactInfo && <p style={{ fontSize: '8.5px', opacity: 0.8, margin: '2px 0 0 0' }}>العنوان: {address} | هاتف: {phone}</p>}
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                            <QrCode size={26} color={headerBgColor} />
                          </div>
                        )}
                        {showDoctorInfo && (
                          <div style={{ background: 'rgba(255,255,255,0.18)', padding: '4px 8px', borderRadius: '6px', textAlign: 'right' }}>
                            <h4 style={{ fontSize: '10.5px', fontWeight: 800, color: headerTextColor, margin: 0 }}>{doctorName}</h4>
                            <p style={{ fontSize: '8.5px', opacity: 0.9, margin: 0 }}>{doctorTitle}</p>
                          </div>
                        )}
                      </div>
                      {hasCustomPreviewLogo && previewAlign === 'right' && (
                        <div style={{ marginLeft: '10px', flexShrink: 0 }}>{renderCustomPreviewLogo()}</div>
                      )}
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'minimal_pure') {
                return (
                  <div style={{ borderBottom: '1.5px solid #0f172a', paddingBottom: '8px', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', border: '1.5px solid #0f172a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', flexShrink: 0 }}>
                          <FileText size={20} color="#0f172a" />
                        </div>
                        <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                          
                          {renderStyledLabName(false, '#0f172a')}
                          {showLabSubtitle && <div style={{ fontSize: '9px', color: '#475569' }}>{labSubtitle}</div>}
                          {showContactInfo && <div style={{ fontSize: '8px', color: '#64748b' }}>{address} | {phone}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', flexShrink: 0 }} dir="ltr">
                        {labLicense && labLicense !== 'MOH-IQ-2026-8842' ? (
                          <div style={{ fontSize: '7.5px', color: '#334155', borderLeft: enableQrCode && qrCodePosition === 'HEADER' ? '1.5px solid #0f172a' : 'none', paddingLeft: enableQrCode && qrCodePosition === 'HEADER' ? '6px' : '0', fontFamily: 'monospace' }}>
                            <div>{labLicense}</div>
                          </div>
                        ) : null}
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ border: '1px solid #0f172a', padding: '2px', background: '#fff', borderRadius: '3px' }}>
                            <QrCode size={22} color="#0f172a" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'compact_strip') {
                return (
                  <div style={{ background: '#f1f5f9', border: `1px solid ${borderColor || '#cbd5e1'}`, borderRadius: '6px', padding: '6px 12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                      <div style={{ width: '26px', height: '26px', background: '#0f172a', color: '#fbbf24', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Award size={16} color="#fbbf24" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                        {renderStyledLabName(false, '#0f172a', Math.max(13, Math.min(18, labNameFontSize - 2)))}
                        {showContactInfo && (
                          <span style={{ fontSize: '8.5px', color: '#64748b' }}>{address} | {phone}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '8px', fontFamily: 'monospace', flexShrink: 0 }} dir="ltr">
                      
                      {enableQrCode && qrCodePosition === 'HEADER' && (
                        <QrCode size={18} color="#0f172a" />
                      )}
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'gold_frame') {
                return (
                  <div style={{ border: '2px solid #0f172a', borderTop: '5px solid #d97706', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                          <Award size={22} color="#fbbf24" />
                        </div>
                        <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {renderStyledLabName(true, '#fbbf24')}
                            
                          </div>
                          {showLabSubtitle && <div style={{ fontSize: '9px', color: '#e2e8f0' }}>{labSubtitle}</div>}
                          {showContactInfo && <div style={{ fontSize: '8px', color: '#94a3b8' }}>Address: {address} | Tel: {phone}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', flexShrink: 0 }} dir="ltr">
                        {labLicense && labLicense !== 'MOH-IQ-2026-8842' ? (
                          <div style={{ color: '#fbbf24', fontSize: '8.5px', fontWeight: 800 }}>
                            <div style={{ fontSize: "7.5px", color: "#cbd5e1" }}>{labLicense}</div>
                          </div>
                        ) : null}
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ background: '#ffffff', padding: '2px', borderRadius: '4px' }}>
                            <QrCode size={24} color="#0f172a" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'smart_digital') {
                return (
                  <div style={{ background: '#0f172a', color: '#ffffff', borderBottom: `3px solid ${headerBgColor || primaryColor || '#38bdf8'}`, padding: '10px 14px', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        
                        {renderStyledLabName(true, '#ffffff')}
                        {showLabSubtitle && <p style={{ margin: '1px 0 0 0', fontSize: '9px', color: '#94a3b8' }}>{labSubtitle}</p>}
                        {showContactInfo && <p style={{ margin: '1px 0 0 0', fontSize: '8px', color: '#64748b' }}>{address} | {phone}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} dir="ltr">
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ background: '#ffffff', padding: '3px', borderRadius: '5px', textAlign: 'center' }}>
                            <QrCode size={24} color="#0f172a" />
                          </div>
                        )}
                        {showDoctorInfo && (
                          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#ffffff' }}>{doctorName}</div>
                            <div style={{ fontSize: '8px', color: '#94a3b8' }}>{doctorTitle}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'accredited_badge') {
                return (
                  <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', border: '1px solid #cbd5e1', position: 'relative' }}>
                    <div style={{ background: headerBgColor || primaryColor || '#0c4a6e', color: '#ffffff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        {renderStyledLabName(true, '#ffffff')}
                        {showLabSubtitle && <div style={{ fontSize: '9px', opacity: 0.9 }}>{labSubtitle}</div>}
                        {showContactInfo && <div style={{ fontSize: '8px', opacity: 0.8 }}>{address} | {phone}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} dir="ltr">
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ background: '#fff', padding: '2px', borderRadius: '4px' }}>
                            <QrCode size={24} color="#0f172a" />
                          </div>
                        )}
                        {showDoctorInfo && (
                          <div style={{ background: 'rgba(255,255,255,0.18)', padding: '4px 8px', borderRadius: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#ffffff' }}>{doctorName}</div>
                            <div style={{ fontSize: '8px', opacity: 0.9 }}>{doctorTitle}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                );
              }

              if (activeHeader === 'bauhaus_grid') {
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ padding: '8px 12px', borderLeft: '1px solid #cbd5e1', textAlign: labNameAlignment.toLowerCase() as any }}>
                      
                      {renderStyledLabName(false, '#0f172a')}
                      {showLabSubtitle && <div style={{ fontSize: '8.5px', color: '#475569' }}>{labSubtitle}</div>}
                      {showContactInfo && <div style={{ fontSize: '8px', color: '#94a3b8' }}>{address} | {phone}</div>}
                    </div>
                    <div style={{ padding: '8px 10px', borderLeft: '1px solid #cbd5e1', background: '#f1f5f9', textAlign: 'left' }} dir="ltr">
                      
                      <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#0f172a' }}>{doctorName}</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>{doctorTitle}</div>
                      {labLicense && labLicense !== 'MOH-IQ-2026-8842' ? <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>{labLicense}</div> : null}
                    </div>
                    <div style={{ padding: '8px', background: '#e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      {enableQrCode && qrCodePosition === 'HEADER' ? (
                        <QrCode size={26} color="#0f172a" />
                      ) : (
                        <>
                          
                        </>
                      )}
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'aurora_wave') {
                return (
                  <div style={{ position: 'relative', background: `linear-gradient(135deg, ${headerBgColor || '#0f172a'} 0%, #0369a1 50%, ${secondaryColor || '#0284c7'} 100%)`, color: '#ffffff', padding: '12px 14px 18px 14px', borderRadius: '10px', marginBottom: '10px', overflow: 'hidden' }}>
                    <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '22px', pointerEvents: 'none', opacity: 0.3 }} viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M0,25 C150,75 350,-20 500,35 C650,90 900,10 1200,40 L1200,120 L0,120 Z" fill="#ffffff" />
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        
                        {renderStyledLabName(true, '#ffffff')}
                        {showLabSubtitle && <div style={{ fontSize: '9px', color: '#e0f2fe' }}>{labSubtitle}</div>}
                        {showContactInfo && <div style={{ fontSize: '8px', color: '#bae6fd' }}>{address} | {phone}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} dir="ltr">
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ background: '#ffffff', padding: '3px', borderRadius: '5px' }}>
                            <QrCode size={24} color="#0f172a" />
                          </div>
                        )}
                        {showDoctorInfo && (
                          <div style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', padding: '5px 9px', borderRadius: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#ffffff' }}>{doctorName}</div>
                            <div style={{ fontSize: '8px', color: '#e0f2fe' }}>{doctorTitle}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'executive_dark') {
                return (
                  <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#f8fafc', borderBottom: '3.5px solid #b45309', padding: '10px 14px', borderRadius: '6px', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        {renderStyledLabName(true, '#fbbf24')}
                        {showLabSubtitle && <div style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 600 }}>{labSubtitle}</div>}
                        {showContactInfo && <div style={{ fontSize: '8px', color: '#94a3b8' }}>Address: {address} | Tel: {phone}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} dir="ltr">
                        {enableQrCode && qrCodePosition === 'HEADER' && (
                          <div style={{ background: '#ffffff', padding: '3px', borderRadius: '5px' }}>
                            <QrCode size={24} color="#b45309" />
                          </div>
                        )}
                        {showDoctorInfo && (
                          <div style={{ background: 'rgba(180, 83, 9, 0.22)', border: '1px solid #b45309', padding: '5px 9px', borderRadius: '6px', textAlign: 'left' }}>
                            <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#fbbf24' }}>{doctorName}</div>
                            <div style={{ fontSize: '8px', color: '#cbd5e1' }}>{doctorTitle}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'vertical_accent') {
                return (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', display: 'flex', background: '#ffffff', position: 'relative' }}>
                    <div style={{ width: '12px', background: `linear-gradient(180deg, ${headerBgColor || primaryColor || '#7c3aed'} 0%, ${secondaryColor || '#4f46e5'} 100%)` }} />
                    <div style={{ flex: 1, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        
                        {renderStyledLabName(false, '#0f172a')}
                        {showLabSubtitle && <div style={{ fontSize: '8.5px', color: '#64748b' }}>{labSubtitle}</div>}
                        {showContactInfo && <div style={{ fontSize: '8px', color: '#94a3b8' }}>{address} | {phone}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} dir="ltr">
                        {enableQrCode && qrCodePosition === 'HEADER' && <QrCode size={24} color="#0f172a" />}
                        {showDoctorInfo && (
                          <div style={{ borderRight: '2px solid #ede9fe', paddingRight: '8px', textAlign: 'left' }}>
                            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a' }}>{doctorName}</div>
                            <div style={{ fontSize: '8px', color: '#64748b' }}>{doctorTitle}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeHeader === 'glass_capsule') {
                const capPrimary = headerBgColor || primaryColor || '#0284c7';
                const capSecondary = secondaryColor || '#0d9488';
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '8px', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ flex: 1.5, background: `linear-gradient(135deg, ${capPrimary}14 0%, ${capSecondary}0d 100%)`, border: `1.5px solid ${capPrimary}45`, borderRight: `5px solid ${capPrimary}`, borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: capPrimary, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Microscope size={18} color="#ffffff" />
                      </div>
                      <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                        {renderStyledLabName(false, capPrimary)}
                        {showLabSubtitle && <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#334155' }}>{labSubtitle}</div>}
                        {showContactInfo && <div style={{ fontSize: '8px', color: '#64748b' }}>{address} | {phone}</div>}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }} dir="ltr">
                      {showDoctorInfo ? (
                        <div style={{ textAlign: 'left' }}>
                          
                          <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#0f172a' }}>{doctorName}</div>
                          <div style={{ fontSize: '8px', color: '#475569' }}>{doctorTitle}</div>
                        </div>
                      ) : <div />}
                      {enableQrCode && qrCodePosition === 'HEADER' && (
                        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px', flexShrink: 0 }}>
                          <QrCode size={22} color="#0f172a" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Default Classic Header ('default')
              return (
                <div style={{ borderBottom: `2px solid ${borderColor}`, paddingBottom: '6px', marginBottom: '10px', position: 'relative' }}>
                  {hasCustomPreviewLogo && previewAlign === 'center' && (
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>{renderCustomPreviewLogo()}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {hasCustomPreviewLogo && previewAlign === 'left' && (
                      <div style={{ marginRight: '12px', flexShrink: 0 }}>{renderCustomPreviewLogo()}</div>
                    )}
                    <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                      {renderStyledLabName(false, labNameColor || headerBgColor)}
                      {showLabSubtitle && <p style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600, margin: 0 }}>{labSubtitle}</p>}
                      {showContactInfo && <p style={{ fontSize: '8.5px', color: '#475569', margin: '2px 0 0 0' }}>العنوان: {address} | هاتف: {phone}</p>}
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {enableQrCode && qrCodePosition === 'HEADER' && (
                        <div style={{ width: '34px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={24} color={headerBgColor} />
                        </div>
                      )}
                      {showDoctorInfo && (
                        <div style={{ textAlign: 'right' }}>
                          <h4 style={{ fontSize: '10.5px', fontWeight: 800, color: textColor, margin: 0 }}>{doctorName}</h4>
                          <p style={{ fontSize: '8.5px', color: '#64748b', margin: 0 }}>{doctorTitle}</p>
                          {labLicense && labLicense !== 'MOH-IQ-2026-8842' && <p style={{ fontSize: '8px', color: headerBgColor, margin: 0 }}>{labLicense}</p>}
                        </div>
                      )}
                    </div>
                    {hasCustomPreviewLogo && previewAlign === 'right' && (
                      <div style={{ marginLeft: '12px', flexShrink: 0 }}>{renderCustomPreviewLogo()}</div>
                    )}
                  </div>
                </div>
              );
            })() : null}

            {/* Patient Meta Demographics Box (Rendered across all 4 layouts) */}
            {showPatientBox && (() => {
              if (patientLayout === 'cards') {
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.2fr', gap: '6px', marginBottom: '10px', fontSize: `${patientInfoFontSize}px` }} dir="ltr">
                    <div style={{ background: '#f8fafc', border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '5px 8px' }}>
                      <div style={{ color: '#64748b', fontSize: `${Math.max(8, patientInfoFontSize - 1)}px`, fontWeight: 600 }}>Patient Name:</div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: `${patientNameFontSize}px` }}>Hayder Al-Khafaji</div>
                      <div style={{ color: '#475569', fontSize: `${patientInfoFontSize}px`, marginTop: '1px' }}>Age / Sex: <strong>48y / Male</strong></div>
                    </div>
                    <div style={{ background: '#f8fafc', border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '5px 8px' }}>
                      <div style={{ color: '#64748b', fontSize: `${Math.max(8, patientInfoFontSize - 1)}px`, fontWeight: 600 }}>Referred By:</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: `${patientInfoFontSize}px` }}>Direct Consultation</div>
                      <div style={{ color: '#64748b', fontSize: `${patientInfoFontSize}px`, marginTop: '1px' }}>Date: <span style={{ color: '#334155' }}>2026-09-30</span></div>
                    </div>
                    <div style={{ background: '#f8fafc', border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '5px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: `${Math.max(8, patientInfoFontSize - 1)}px`, fontWeight: 600 }}>Sample ID:</span>
                        <strong style={{ color: headerBgColor, fontSize: `${patientInfoFontSize}px`, fontFamily: 'monospace' }}>#1001</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '8.5px' }}>Status:</span>
                        <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '9px' }}>Verified (Final)</span>
                      </div>
                    </div>
                  </div>
                );
              }
              if (patientLayout === 'compact') {
                return (
                  <div style={{ background: '#f8fafc', border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '4px 8px', marginBottom: '10px', fontSize: `${patientInfoFontSize}px` }} dir="ltr">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px dashed ${borderColor}`, paddingBottom: '2px' }}>
                      <div><span style={{ color: '#64748b' }}>Patient Name: </span><strong style={{ color: '#0f172a', fontSize: `${patientNameFontSize}px` }}>Hayder Al-Khafaji</strong> (48y / Male)</div>
                      <div><span style={{ color: '#64748b' }}>Sample ID: </span><strong style={{ color: headerBgColor, fontFamily: 'monospace' }}>#1001</strong></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: `${patientInfoFontSize}px` }}>
                      <div><span style={{ color: '#64748b' }}>Referred By: </span><strong style={{ color: '#334155' }}>Direct Consultation</strong></div>
                      <div><span style={{ color: '#64748b' }}>Date: </span>2026-09-30 | <strong style={{ color: '#16a34a' }}>Verified (Final)</strong></div>
                    </div>
                  </div>
                );
              }
              if (patientLayout === 'classic_box') {
                return (
                  <div style={{ background: '#ffffff', border: `1.5px solid ${borderColor || '#0f172a'}`, borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: `${patientInfoFontSize}px` }} dir="ltr">
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '6px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '3px' }}>
                      <div><span style={{ color: '#64748b' }}>Patient Name: </span><strong style={{ color: '#0f172a', fontSize: `${patientNameFontSize}px` }}>Hayder Al-Khafaji</strong></div>
                      <div><span style={{ color: '#64748b' }}>Age / Sex: </span><strong style={{ color: '#0f172a' }}>48y / Male</strong></div>
                      <div><span style={{ color: '#64748b' }}>Sample ID: </span><strong style={{ color: headerBgColor, fontFamily: 'monospace' }}>#1001</strong></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '6px', marginTop: '3px', fontSize: `${patientInfoFontSize}px`, color: '#475569' }}>
                      <div><span style={{ color: '#64748b' }}>Referred By: </span><strong>Direct Consultation</strong></div>
                      <div><span style={{ color: '#64748b' }}>Date: </span><span>2026-09-30</span></div>
                      <div><span style={{ color: '#64748b' }}>Status: </span><strong style={{ color: '#16a34a' }}>Verified (Final)</strong></div>
                    </div>
                  </div>
                );
              }
              // Default: 'grid' (3-Row Comprehensive Grid)
              return (
                <div style={{ border: `1px solid ${borderColor}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '10px', fontSize: `${patientInfoFontSize}px`, background: '#f8fafc' }} dir="ltr">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <tbody>
                      <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '3px 6px', width: '22%', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Patient Name:</td>
                        <td style={{ padding: '3px 6px', width: '28%', fontWeight: 800, color: '#0f172a', fontSize: `${patientNameFontSize}px` }}>Hayder Al-Khafaji</td>
                        <td style={{ padding: '3px 6px', width: '22%', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Sample ID:</td>
                        <td style={{ padding: '3px 6px', width: '28%', fontWeight: 800, color: headerBgColor, fontFamily: 'monospace' }}>#1001</td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '3px 6px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Age / Sex:</td>
                        <td style={{ padding: '3px 6px', fontWeight: 700, color: '#1e293b' }}>48y / Male</td>
                        <td style={{ padding: '3px 6px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Referred By:</td>
                        <td style={{ padding: '3px 6px', fontWeight: 700, color: '#1e293b' }}>Direct Consultation</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 6px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Collection Date:</td>
                        <td style={{ padding: '3px 6px', color: '#334155', fontFamily: 'monospace' }}>2026-09-30</td>
                        <td style={{ padding: '3px 6px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Report Status:</td>
                        <td style={{ padding: '3px 6px', fontWeight: 800, color: '#16a34a' }}>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '3px', fontSize: '8.5px' }}>Verified (Final)</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Dynamic Results Table Simulation */}
            {previewSimulationMode === 'blank' ? (
              <div
                style={{
                  marginBottom: '10px',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  minHeight: '260px',
                  padding: '36px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} color="#64748b" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                    📄 فورمة طباعة فارغة رسمية (بدون خطوط - Unlined Blank Canvas)
                  </h4>
                  <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b', maxWidth: '380px', lineHeight: 1.5 }}>
                    مساحة مفرغة بالكامل ونقية 100% خالية من أي جداول أو تسطير أفقي، مخصصة لكتابة التقارير الحرة أو إرفاق فحوصات خارجية معتمدة بترويسة المختبر.
                  </p>
                </div>
                <a
                  href={`/api/templates/blank/print?mode=blank&template=${HEADER_STYLE_TO_TEMPLATE_MAP[headerStyle] || reportTemplate}&headerStyle=${headerStyle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    borderRadius: '6px',
                    marginTop: '4px',
                  }}
                >
                  <Printer size={13} />
                  <span>معاينة وطباعة الفورمة الفارغة الآن (A4 بدون خطوط)</span>
                </a>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <thead>
                  <tr style={{ background: headerBgColor, color: headerTextColor }}>
                    {visibleCols.map((col) => (
                      <th
                        key={col.id}
                        style={{
                          padding: tableStyle === 'compact' || tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '8px 10px' : '5px 8px',
                          textAlign: col.align as any,
                          fontSize: `${testNameFontSize}px`,
                          border: tableStyle === 'grid' ? `1px solid ${borderColor}` : undefined,
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupByCategory ? (
                    sampleGroups.map((grp, gIdx) => (
                      <React.Fragment key={gIdx}>
                        <tr style={{ background: 'rgba(0,0,0,0.035)' }}>
                          <td
                            colSpan={visibleCols.length}
                            style={{
                              padding: '4px 8px',
                              fontWeight: 800,
                              fontSize: `${testNameFontSize}px`,
                              color: headerBgColor,
                              borderBottom: `1.5px solid ${borderColor}`,
                              border: tableStyle === 'grid' ? `1px solid ${borderColor}` : undefined,
                            }}
                          >
                            📂 {grp.category}
                          </td>
                        </tr>
                        {grp.tests.map((t, tIdx) => {
                          const isZebraRow = (tableStyle === 'zebra' || tableZebraStriping) && tIdx % 2 === 1;
                          const cellPad = tableStyle === 'compact' || tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px';
                          const cellBorder = tableStyle === 'grid' ? `1px solid ${borderColor}` : undefined;
                          return (
                            <tr
                              key={tIdx}
                              style={{
                                borderBottom: tableRowBorders ? `1px solid ${borderColor}` : 'none',
                                backgroundColor: isZebraRow ? 'rgba(0,0,0,0.025)' : 'transparent',
                              }}
                            >
                              {visibleCols.map((col) => {
                                if (col.id === 'testName') {
                                  return (
                                    <td
                                      key={col.id}
                                      style={{
                                        padding: cellPad,
                                        fontWeight: testNameFontWeight === 'bold' ? 800 : 500,
                                        fontSize: `${testNameFontSize}px`,
                                        color: textColor,
                                        textAlign: col.align as any,
                                        border: cellBorder,
                                      }}
                                    >
                                      {t.testName}
                                    </td>
                                  );
                                }
                                if (col.id === 'result') {
                                  return (
                                    <td
                                      key={col.id}
                                      style={{
                                        padding: cellPad,
                                        fontWeight: resultValueFontWeight === 'bold' ? 800 : 500,
                                        fontSize: `${resultValueFontSize}px`,
                                        color: textColor,
                                        textAlign: col.align as any,
                                        border: cellBorder,
                                      }}
                                    >
                                      {t.result}
                                    </td>
                                  );
                                }
                                if (col.id === 'unit') {
                                  return (
                                    <td
                                      key={col.id}
                                      style={{
                                        padding: cellPad,
                                        fontSize: `${unitFontSize}px`,
                                        color: textColor,
                                        opacity: 0.85,
                                        textAlign: col.align as any,
                                        border: cellBorder,
                                      }}
                                    >
                                      {t.unit}
                                    </td>
                                  );
                                }
                                if (col.id === 'refRange') {
                                  return (
                                    <td
                                      key={col.id}
                                      style={{
                                        padding: cellPad,
                                        fontSize: `${refRangeFontSize}px`,
                                        color: textColor,
                                        opacity: 0.85,
                                        textAlign: col.align as any,
                                        border: cellBorder,
                                      }}
                                    >
                                      {t.refRange}
                                    </td>
                                  );
                                }
                                if (col.id === 'notes') {
                                  return (
                                    <td
                                      key={col.id}
                                      style={{
                                        padding: cellPad,
                                        fontSize: `${unitFontSize}px`,
                                        color: textColor,
                                        opacity: 0.85,
                                        textAlign: col.align as any,
                                        border: cellBorder,
                                      }}
                                    >
                                      {t.notes}
                                    </td>
                                  );
                                }
                                return null;
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  ) : (
                    sampleGroups.flatMap((g) => g.tests).map((t, idx) => {
                      const isZebraRow = (tableStyle === 'zebra' || tableZebraStriping) && idx % 2 === 1;
                      const cellPad = tableStyle === 'compact' || tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px';
                      const cellBorder = tableStyle === 'grid' ? `1px solid ${borderColor}` : undefined;
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: tableRowBorders ? `1px solid ${borderColor}` : 'none',
                            backgroundColor: isZebraRow ? 'rgba(0,0,0,0.025)' : 'transparent',
                          }}
                        >
                          {visibleCols.map((col) => {
                            if (col.id === 'testName') {
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: cellPad,
                                    fontWeight: testNameFontWeight === 'bold' ? 800 : 500,
                                    fontSize: `${testNameFontSize}px`,
                                    color: textColor,
                                    textAlign: col.align as any,
                                    border: cellBorder,
                                  }}
                                >
                                  {t.testName}
                                </td>
                              );
                            }
                            if (col.id === 'result') {
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: cellPad,
                                    fontWeight: resultValueFontWeight === 'bold' ? 800 : 500,
                                    fontSize: `${resultValueFontSize}px`,
                                    color: textColor,
                                    textAlign: col.align as any,
                                    border: cellBorder,
                                  }}
                                >
                                  {t.result}
                                </td>
                              );
                            }
                            if (col.id === 'unit') {
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: cellPad,
                                    fontSize: `${unitFontSize}px`,
                                    color: textColor,
                                    opacity: 0.85,
                                    textAlign: col.align as any,
                                    border: cellBorder,
                                  }}
                                >
                                  {t.unit}
                                </td>
                              );
                            }
                            if (col.id === 'refRange') {
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: cellPad,
                                    fontSize: `${refRangeFontSize}px`,
                                    color: textColor,
                                    opacity: 0.85,
                                    textAlign: col.align as any,
                                    border: cellBorder,
                                  }}
                                >
                                  {t.refRange}
                                </td>
                              );
                            }
                            if (col.id === 'notes') {
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: cellPad,
                                    fontSize: `${unitFontSize}px`,
                                    color: textColor,
                                    opacity: 0.85,
                                    textAlign: col.align as any,
                                    border: cellBorder,
                                  }}
                                >
                                  {t.notes}
                                </td>
                              );
                            }
                            return null;
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Area */}
          {showFooter && (
            <div style={{ position: 'relative', zIndex: 1, borderTop: `1px dashed ${borderColor}`, paddingTop: '6px', fontSize: '8.5px', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0 }}>{reportFooter}</p>
                  {accreditationBadge && (
                    <span style={{ fontWeight: 800, color: headerBgColor, display: 'inline-block', marginTop: '2px' }}>
                      🛡️ {accreditationBadge}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {enableQrCode && qrCodePosition === 'FOOTER' && (
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '8px' }}>Verify:</span>
                      <QrCode size={22} color={headerBgColor} />
                    </div>
                  )}
                  {showFooterSignature && (
                    <div style={{ textAlign: 'right', fontWeight: 800, color: textColor, fontSize: '8.5px' }}>
                      <div>Approved by Lab Director</div>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Verified Electronically</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
