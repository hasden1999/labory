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
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  findCurrency,
  calculateConversionMultiplier,
  getSamplePriceConversions,
} from '../../lib/currencies';
import { catalogCache } from '../../lib/catalogCache';
import { toEnglishDigits, formatEnglishDate } from '../../lib/formatters';

export default function PaperDesignerV2() {
  const toast = useToast();
  const { labProfile, updateLabProfile } = useLab();

  // Active Sub-Tab in Designer:
  // 1. 'IDENTITY_MARGINS' -> إعدادات الهوية والورقة والهوامش المسترجعة بالكامل (REG-01)
  // 2. 'VISUAL_DESIGN' -> التبويب الإضافي الأول: التصميم المرئي (الشكل والألوان والخطوط) (DESIGN-01)
  // 3. 'RESULTS_COLUMNS' -> التبويب الإضافي الثاني: تنسيق طريقة كتابة النتائج والأعمدة (DESIGN-02)
  const [designerTab, setDesignerTab] = useState<'IDENTITY_MARGINS' | 'VISUAL_DESIGN' | 'RESULTS_COLUMNS'>('IDENTITY_MARGINS');

  // 1. Identity & Base Profile States
  const [labName, setLabName] = useState(labProfile.labName || 'مختبر الرضا للتحليلات الطبية التخصصية');
  const [labSubtitle, setLabSubtitle] = useState(labProfile.labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل');
  const [doctorName, setDoctorName] = useState(labProfile.doctorName || 'د. أحمد الرضا');
  const [doctorTitle, setDoctorTitle] = useState(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية');
  const [labLicense, setLabLicense] = useState(labProfile.labLicense || 'MOH-IQ-2026-8842');
  const [phone, setPhone] = useState(labProfile.phone || '07701234567');
  const [whatsappNumber, setWhatsappNumber] = useState(labProfile.whatsappNumber || '07701234567');
  const [address, setAddress] = useState(labProfile.address || 'بغداد - شارع الأطباء - مقابل المجمع الطبي');
  const [currency, setCurrency] = useState(labProfile.currency || 'د.ع');
  const [reportFooter, setReportFooter] = useState(
    labProfile.reportFooter || 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).'
  );
  const [accreditationBadge, setAccreditationBadge] = useState(labProfile.accreditationBadge || 'ISO 15189 Certified Lab');

  // Master Template & Paper Mode
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED' | 'BLACK_WHITE'>(
    (['CLASSIC', 'MODERN', 'EXECUTIVE', 'COMPACT', 'SPECIALIZED', 'BLACK_WHITE'].includes(labProfile.reportTemplate as any)
      ? (labProfile.reportTemplate as any)
      : 'CLASSIC')
  );
  const [headerMode, setHeaderMode] = useState<'DIGITAL' | 'PREPRINTED'>((labProfile.headerMode as any) || 'DIGITAL');
  const [primaryColor, setPrimaryColor] = useState<string>(labProfile.primaryColor || '#0284c7');
  const [logoUrl, setLogoUrl] = useState<string>(labProfile.logoUrl || '');

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
  const [tableRowBorders, setTableRowBorders] = useState<boolean>(labProfile.tableRowBorders ?? true);
  const [tableZebraStriping, setTableZebraStriping] = useState<boolean>(labProfile.tableZebraStriping ?? false);
  const [tableRowSpacing, setTableRowSpacing] = useState<'COMPACT' | 'COMFORTABLE' | 'RELAXED'>(
    labProfile.tableRowSpacing || 'COMFORTABLE'
  );

  // Camera & File Logo States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Synchronize state when labProfile loads from remote
  useEffect(() => {
    if (labProfile) {
      setLabName(labProfile.labName || 'مختبر الرضا للتحليلات الطبية التخصصية');
      setLabSubtitle(labProfile.labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل');
      setDoctorName(labProfile.doctorName || 'د. أحمد الرضا');
      setDoctorTitle(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية');
      setLabLicense(labProfile.labLicense || 'MOH-IQ-2026-8842');
      setPhone(labProfile.phone || '07701234567');
      setWhatsappNumber(labProfile.whatsappNumber || '07701234567');
      setAddress(labProfile.address || 'بغداد - شارع الأطباء - مقابل المجمع الطبي');
      setCurrency(labProfile.currency || 'د.ع');
      setReportFooter(labProfile.reportFooter || 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).');
      setAccreditationBadge(labProfile.accreditationBadge || 'ISO 15189 Certified Lab');
      if (labProfile.reportTemplate) setReportTemplate(labProfile.reportTemplate as any);
      if (labProfile.headerMode) setHeaderMode(labProfile.headerMode as any);
      if (labProfile.primaryColor) setPrimaryColor(labProfile.primaryColor);
      if (labProfile.logoUrl) setLogoUrl(labProfile.logoUrl);

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

      if (labProfile.testNameFontWeight) setTestNameFontWeight(labProfile.testNameFontWeight);
      if (labProfile.resultValueFontWeight) setResultValueFontWeight(labProfile.resultValueFontWeight);

      if (labProfile.tableColumns && Array.isArray(labProfile.tableColumns) && labProfile.tableColumns.length > 0) {
        setTableColumns(labProfile.tableColumns);
      }
      setGroupByCategory(labProfile.groupByCategory ?? false);
      setTableRowBorders(labProfile.tableRowBorders ?? true);
      setTableZebraStriping(labProfile.tableZebraStriping ?? false);
      if (labProfile.tableRowSpacing) setTableRowSpacing(labProfile.tableRowSpacing);
    }
  }, [labProfile]);

  // Master Template Presets
  const PRESETS = [
    {
      id: 'CLASSIC',
      title: 'القالب الملكي الكلاسيكي (Royal Classic)',
      subtitle: 'إطار رسمي فاخر وهوية تقليدية معتمدة للمختبرات والمستشفيات الكبرى',
      color: '#0284c7',
    },
    {
      id: 'MODERN',
      title: 'القالب الطبي العصري (Modern Clinical)',
      subtitle: 'ترويسة بتدرج فيروزي انسيابي وشارات نتائج أنيقة تضفي طابعاً تقنياً متطوراً',
      color: '#0d9488',
    },
    {
      id: 'EXECUTIVE',
      title: 'القالب المؤسسي الفاخر (Executive Luxury)',
      subtitle: 'تصميم كحلي ملكي مع إطارات ذهبية راقية مخصصة للمختبرات الاستشارية والمركزية',
      color: '#b45309',
    },
    {
      id: 'COMPACT',
      title: 'القالب المدمج المقتصد (Compact Minimal)',
      subtitle: 'يوزع الفحوصات بكثافة بيانات مدروسة لاستيعاب الفحوصات الشاملة في صفحة واحدة',
      color: '#334155',
    },
    {
      id: 'SPECIALIZED',
      title: 'القالب التخصصي المتقدم (Specialized Multi-Part)',
      subtitle: 'تقسيم كتل سريرية محددة بلون قرمزي داكن للتحاليل الكبرى والزراعة الجرثومية',
      color: '#e11d48',
    },
    {
      id: 'BLACK_WHITE',
      title: 'القالب الاقتصادي الليزري (Monochrome Laser)',
      subtitle: 'مخصص لطابعات الليزر أبيض وأسود، تباين عالي ونصوص واضحة وحادة 100%',
      color: '#000000',
    },
  ];

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
        toast.success('تم تحميل الشعار بنجاح!', 'تم الشعار');
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
      toast.success('تم التقاط صورة الشعار بالكاميرا بنجاح!', 'تم الشعار');
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
        reportTemplate,
        headerMode,
        topMarginMm: Number(topMarginMm),
        bottomMarginMm: Number(bottomMarginMm),
        leftMarginMm: Number(leftMarginMm),
        rightMarginMm: Number(rightMarginMm),
        primaryColor,
        logoUrl: logoUrl || '',

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
        testNameFontWeight,
        resultValueFontWeight,

        // Tab 2: Results & Columns Layout
        tableColumns,
        groupByCategory,
        tableRowBorders,
        tableZebraStriping,
        tableRowSpacing,
      };

      await updateLabProfile(payload as any);
      await apiRequest('/settings', 'POST', payload);
      toast.success('تم حفظ كافة إعدادات الفورمة وتنسيق النتائج والمظهر بنجاح!', 'حفظ التكوين');
    } catch (err: any) {
      toast.error(err?.message || 'فشل حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Live Preview Sample Tests (STRICT REQUIREMENT: NO High/Low flags or alert colors!)
  const sampleGroups = [
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

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-cyan-primary"
            style={{ padding: '0 18px', height: '36px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ وتطبيق التصميم'}</span>
          </button>
        </div>

        {/* The 3 Main Sections Tabs: Restored Settings First, New Features Added as Separate Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input-deep)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setDesignerTab('IDENTITY_MARGINS')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              background: designerTab === 'IDENTITY_MARGINS' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: designerTab === 'IDENTITY_MARGINS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={15} />
            <span>1. إعدادات الهوية والورقة والهوامش (المسترجعة - REG-01)</span>
          </button>

          <button
            type="button"
            onClick={() => setDesignerTab('VISUAL_DESIGN')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              background: designerTab === 'VISUAL_DESIGN' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: designerTab === 'VISUAL_DESIGN' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Palette size={15} />
            <span>2. تصميم الشكل (الألوان والخطوط - DESIGN-01)</span>
          </button>

          <button
            type="button"
            onClick={() => setDesignerTab('RESULTS_COLUMNS')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              background: designerTab === 'RESULTS_COLUMNS' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: designerTab === 'RESULTS_COLUMNS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} />
            <span>3. تنسيق كتابة النتائج والأعمدة (DESIGN-02)</span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: VISUAL DESIGN (الشكل والألوان والخطوط)
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
                        <strong style={{ fontSize: '12px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{f.name}</strong>
                        {isSelected && <CheckCircle2 size={15} color="var(--accent-cyan)" />}
                      </div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Per-Element Font Sizes & Weights */}
              <div style={{ background: 'var(--bg-input-deep)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
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
                        onClick={() => setLabNameStyle(st.id as any)}
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
                  <input
                    type="text"
                    className="input-control"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    style={{ height: '32px', fontSize: '11px' }}
                  />
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

          <a
            href="/api/samples/1001/print"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            title="فتح قالب الطباعة التجريبي"
          >
            <Printer size={12} />
            <span>تجربة الطباعة</span>
          </a>
        </div>

        {/* Real-Time Scaled A4 Simulated Sheet */}
        <div
          className="glass-card"
          style={{
            background: formBgColor,
            color: textColor,
            fontFamily: fontFamily === 'Tajawal' ? "'Tajawal', sans-serif" : fontFamily === 'Cairo' ? "'Cairo', sans-serif" : fontFamily === 'IBM Plex Sans Arabic' ? "'IBM Plex Sans Arabic', sans-serif" : fontFamily === 'Almarai' ? "'Almarai', sans-serif" : 'system-ui, sans-serif',
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
            ) : (showLabName || showLabSubtitle || showContactInfo || showDoctorInfo || (enableQrCode && qrCodePosition === 'HEADER')) ? (
              reportTemplate === 'MODERN' ? (
                <div
                  style={{
                    background: `linear-gradient(135deg, ${headerBgColor} 0%, #06b6d4 100%)`,
                    color: headerTextColor,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                    {showLabName && (
                      <div
                        style={{
                          fontSize: `${labNameFontSize}px`,
                          fontWeight: 900,
                          color: headerTextColor,
                          display: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? 'inline-block' : 'block',
                          background: labNameStyle === 'MODERN_BADGE' ? 'rgba(255,255,255,0.2)' : 'transparent',
                          border: labNameStyle === 'ELEGANT_BORDER' ? '1.5px solid #fff' : 'none',
                          padding: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? '2px 8px' : '0',
                          borderRadius: '6px',
                          marginBottom: '2px',
                        }}
                      >
                        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: '24px', marginRight: '6px', verticalAlign: 'middle' }} />}
                        <span>{labName || 'اسم المختبر'}</span>
                      </div>
                    )}
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
                      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '6px', textAlign: 'right' }}>
                        <h4 style={{ fontSize: '10.5px', fontWeight: 800, color: headerTextColor, margin: 0 }}>{doctorName}</h4>
                        <p style={{ fontSize: '8.5px', opacity: 0.9, margin: 0 }}>{doctorTitle}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ borderBottom: `2px solid ${borderColor}`, paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                    {showLabName && (
                      <div
                        style={{
                          fontSize: `${labNameFontSize}px`,
                          fontWeight: labNameStyle === 'BOLD' ? 900 : 800,
                          color: labNameColor,
                          display: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? 'inline-block' : 'block',
                          background: labNameStyle === 'MODERN_BADGE' ? `${labNameColor}18` : 'transparent',
                          border: labNameStyle === 'ELEGANT_BORDER' ? `1.5px solid ${labNameColor}` : 'none',
                          padding: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? '2px 8px' : '0',
                          borderRadius: '6px',
                          marginBottom: '2px',
                        }}
                      >
                        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: '24px', marginRight: '6px', verticalAlign: 'middle' }} />}
                        <span>{labName || 'اسم المختبر'}</span>
                      </div>
                    )}
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
                        {labLicense && <p style={{ fontSize: '8px', color: headerBgColor, margin: 0 }}>License: {labLicense}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : null}

            {/* Patient Meta Ribbon */}
            {showPatientBox && (
              <div style={{ background: '#f8fafc', border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '6px 8px', fontSize: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Patient:</strong> Hayder Al-Khafaji (Male, 48y)</span>
                  <span><strong>Sample ID:</strong> #1001</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '9px', color: '#64748b' }}>
                  <span><strong>Ref Doctor:</strong> Direct Consultation</span>
                  <span><strong>Date:</strong> 2026-09-30</span>
                </div>
              </div>
            )}

            {/* Dynamic Results Table Simulation */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr style={{ background: headerBgColor, color: headerTextColor }}>
                  {visibleCols.map((col) => (
                    <th
                      key={col.id}
                      style={{
                        padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '8px 10px' : '5px 8px',
                        textAlign: col.align as any,
                        fontSize: `${testNameFontSize}px`,
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
                          }}
                        >
                          📂 {grp.category}
                        </td>
                      </tr>
                      {grp.tests.map((t, tIdx) => (
                        <tr
                          key={tIdx}
                          style={{
                            borderBottom: tableRowBorders ? `1px solid ${borderColor}` : 'none',
                            backgroundColor: tableZebraStriping && tIdx % 2 === 1 ? 'rgba(0,0,0,0.025)' : 'transparent',
                          }}
                        >
                          {visibleCols.map((col) => {
                            if (col.id === 'testName') {
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                    fontWeight: testNameFontWeight === 'bold' ? 800 : 500,
                                    fontSize: `${testNameFontSize}px`,
                                    color: textColor,
                                    textAlign: col.align as any,
                                  }}
                                >
                                  {t.testName}
                                </td>
                              );
                            }
                            if (col.id === 'result') {
                              // STRICT RULE: No High/Low badges, no arrows, clean text!
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                    fontWeight: resultValueFontWeight === 'bold' ? 800 : 500,
                                    fontSize: `${resultValueFontSize}px`,
                                    color: textColor,
                                    textAlign: col.align as any,
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
                                    padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                    fontSize: `${unitFontSize}px`,
                                    color: textColor,
                                    opacity: 0.85,
                                    textAlign: col.align as any,
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
                                    padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                    fontSize: `${refRangeFontSize}px`,
                                    color: textColor,
                                    opacity: 0.85,
                                    textAlign: col.align as any,
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
                                    padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                    fontSize: `${unitFontSize}px`,
                                    color: textColor,
                                    opacity: 0.85,
                                    textAlign: col.align as any,
                                  }}
                                >
                                  {t.notes}
                                </td>
                              );
                            }
                            return null;
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  sampleGroups.flatMap((g) => g.tests).map((t, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: tableRowBorders ? `1px solid ${borderColor}` : 'none',
                        backgroundColor: tableZebraStriping && idx % 2 === 1 ? 'rgba(0,0,0,0.025)' : 'transparent',
                      }}
                    >
                      {visibleCols.map((col) => {
                        if (col.id === 'testName') {
                          return (
                            <td
                              key={col.id}
                              style={{
                                padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                fontWeight: testNameFontWeight === 'bold' ? 800 : 500,
                                fontSize: `${testNameFontSize}px`,
                                color: textColor,
                                textAlign: col.align as any,
                              }}
                            >
                              {t.testName}
                            </td>
                          );
                        }
                        if (col.id === 'result') {
                          // STRICT REQUIREMENT: Clean result, zero High/Low flags or alert coloring
                          return (
                            <td
                              key={col.id}
                              style={{
                                padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                fontWeight: resultValueFontWeight === 'bold' ? 800 : 500,
                                fontSize: `${resultValueFontSize}px`,
                                color: textColor,
                                textAlign: col.align as any,
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
                                padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                fontSize: `${unitFontSize}px`,
                                color: textColor,
                                opacity: 0.85,
                                textAlign: col.align as any,
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
                                padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                fontSize: `${refRangeFontSize}px`,
                                color: textColor,
                                opacity: 0.85,
                                textAlign: col.align as any,
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
                                padding: tableRowSpacing === 'COMPACT' ? '3px 6px' : tableRowSpacing === 'RELAXED' ? '7px 10px' : '4px 8px',
                                fontSize: `${unitFontSize}px`,
                                color: textColor,
                                opacity: 0.85,
                                textAlign: col.align as any,
                              }}
                            >
                              {t.notes}
                            </td>
                          );
                        }
                        return null;
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
