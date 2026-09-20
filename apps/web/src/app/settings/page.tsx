'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { Settings as SettingsIcon, Save, Sparkles, Printer, CheckCircle2, Award, Phone, DollarSign, Building2, Layout, FileText, Maximize2, QrCode, Sliders, Palette, Eye, ShieldCheck, Check, TestTube, Zap, Database, Download, Upload, RefreshCw, HardDrive, AlertCircle, History, Share2, ExternalLink, Plus, Type, Droplet, AlignRight, AlignCenter, AlignLeft, Square, Layers, Trash2, EyeOff, CheckSquare, Sparkle, RotateCcw } from 'lucide-react';
import { 
  SUPPORTED_CURRENCIES, 
  findCurrency, 
  calculateConversionMultiplier, 
  roundPriceForCurrency, 
  getSamplePriceConversions 
} from '../../lib/currencies';
import { catalogCache } from '../../lib/catalogCache';
import { toEnglishDigits, formatEnglishDate, formatEnglishDateTime } from '../../lib/formatters';

export default function SettingsPage() {
  const toast = useToast();
  const { labProfile, updateLabProfile } = useLab();

  // Basic Info
  const [labName, setLabName] = useState(labProfile.labName);
  const [labSubtitle, setLabSubtitle] = useState(labProfile.labSubtitle);
  const [doctorName, setDoctorName] = useState(labProfile.doctorName);
  const [doctorTitle, setDoctorTitle] = useState(labProfile.doctorTitle);
  const [labLicense, setLabLicense] = useState(labProfile.labLicense);
  const [whatsappNumber, setWhatsappNumber] = useState(labProfile.whatsappNumber);
  const [currency, setCurrency] = useState(labProfile.currency);
  const [address, setAddress] = useState(labProfile.address);
  const [phone, setPhone] = useState(labProfile.phone);
  const [reportHeader, setReportHeader] = useState(labProfile.reportHeader);
  const [reportFooter, setReportFooter] = useState(labProfile.reportFooter);
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

  // Milestone M4: Universal Visual Form Designer Settings
  const [headerMode, setHeaderMode] = useState<'DIGITAL' | 'PREPRINTED'>(
    (labProfile.headerMode as any) || 'DIGITAL'
  );
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED' | 'BLACK_WHITE'>(
    (labProfile.reportTemplate as any) || 'CLASSIC'
  );
  const [topMarginMm, setTopMarginMm] = useState<number>(labProfile.topMarginMm ?? 15);
  const [bottomMarginMm, setBottomMarginMm] = useState<number>(labProfile.bottomMarginMm ?? 15);
  const [leftMarginMm, setLeftMarginMm] = useState<number>(labProfile.leftMarginMm ?? 12);
  const [rightMarginMm, setRightMarginMm] = useState<number>(labProfile.rightMarginMm ?? 12);
  const [primaryColor, setPrimaryColor] = useState<string>(labProfile.primaryColor || '#0284c7');
  const [enableQrCode, setEnableQrCode] = useState<boolean>(labProfile.enableQrCode ?? true);
  const [qrCodePosition, setQrCodePosition] = useState<'HEADER' | 'FOOTER'>(labProfile.qrCodePosition || 'HEADER');
  const [accreditationBadge, setAccreditationBadge] = useState<string>(labProfile.accreditationBadge || 'ISO 15189 Certified Lab');
  const [serverBaseUrl, setServerBaseUrl] = useState<string>(labProfile.serverBaseUrl || '');

  // Sheet Elements & Lab Name Customization
  const [showLabName, setShowLabName] = useState<boolean>(labProfile.showLabName ?? true);
  const [labNameFontSize, setLabNameFontSize] = useState<number>(labProfile.labNameFontSize ?? 22);
  const [labNameColor, setLabNameColor] = useState<string>(labProfile.labNameColor || labProfile.primaryColor || '#0284c7');
  const [labNameAlignment, setLabNameAlignment] = useState<'RIGHT' | 'CENTER' | 'LEFT'>(labProfile.labNameAlignment || 'RIGHT');
  const [labNameStyle, setLabNameStyle] = useState<'DEFAULT' | 'BOLD' | 'MODERN_BADGE' | 'ELEGANT_BORDER'>(labProfile.labNameStyle || 'DEFAULT');
  const [showLabSubtitle, setShowLabSubtitle] = useState<boolean>(labProfile.showLabSubtitle ?? true);
  const [showContactInfo, setShowContactInfo] = useState<boolean>(labProfile.showContactInfo ?? true);
  const [showDoctorInfo, setShowDoctorInfo] = useState<boolean>(labProfile.showDoctorInfo ?? true);
  const [showPatientBox, setShowPatientBox] = useState<boolean>(labProfile.showPatientBox ?? true);
  const [showReportBorder, setShowReportBorder] = useState<boolean>(labProfile.showReportBorder ?? true);
  const [showFooter, setShowFooter] = useState<boolean>(labProfile.showFooter ?? true);
  const [showFooterSignature, setShowFooterSignature] = useState<boolean>(labProfile.showFooterSignature ?? true);

  // Watermark Customization
  const [enableWatermark, setEnableWatermark] = useState<boolean>(labProfile.enableWatermark ?? false);
  const [watermarkType, setWatermarkType] = useState<'TEXT' | 'IMAGE'>(labProfile.watermarkType || 'TEXT');
  const [watermarkText, setWatermarkText] = useState<string>(labProfile.watermarkText ?? '');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(labProfile.watermarkOpacity ?? 0.08);
  const [watermarkAngle, setWatermarkAngle] = useState<number>(labProfile.watermarkAngle ?? -30);
  const [watermarkSize, setWatermarkSize] = useState<number>(labProfile.watermarkSize ?? 46);
  const [watermarkColor, setWatermarkColor] = useState<string>(labProfile.watermarkColor || '#0f172a');

  // Typography Settings
  const [fontFamily, setFontFamily] = useState<'Tajawal' | 'Cairo' | 'IBM Plex Sans Arabic' | 'Almarai' | 'System'>(
    (labProfile.fontFamily as any) || 'Tajawal'
  );
  const [fontSize, setFontSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>(
    (labProfile.fontSize as any) || 'MEDIUM'
  );

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAPER_DESIGN' | 'BACKUP' | 'NETWORK' | 'VERSION'>('PAPER_DESIGN');

  // Milestone M5 & R3: Version Management & Update Checker
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('/api/version/check').then(r => r.json());
      setUpdateInfo(res);
      if (res.hasUpdate) {
        toast.info(`يوجد إصدار أحدث متاح: ${res.latestVersion}`, 'تحديث جديد');
      } else {
        toast.success(`البرنامج محدث لآخر إصدار مستقر: ${res.currentVersion}`, 'أحدث إصدار');
      }
    } catch (err: any) {
      toast.error('تعذر الاتصال بسيرفر التحديثات', 'فحص التحديثات');
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Backup & Restore States
  const [backupSnapshots, setBackupSnapshots] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<{ patients: number; samples: number; labName: string } | null>(null);

  useEffect(() => {
    if (labProfile) {
      setLabName(labProfile.labName || '');
      setLabSubtitle(labProfile.labSubtitle || '');
      setDoctorName(labProfile.doctorName || '');
      setDoctorTitle(labProfile.doctorTitle || '');
      setLabLicense(labProfile.labLicense || '');
      setWhatsappNumber(labProfile.whatsappNumber || '');
      setCurrency(labProfile.currency || 'د.ع');
      setAddress(labProfile.address || '');
      setPhone(labProfile.phone || '');
      setReportHeader(labProfile.reportHeader || '');
      setReportFooter(labProfile.reportFooter || '');
      setHeaderMode((labProfile.headerMode as any) || 'DIGITAL');
      setReportTemplate((labProfile.reportTemplate as any) || 'CLASSIC');
      setTopMarginMm(labProfile.topMarginMm ?? 15);
      setBottomMarginMm(labProfile.bottomMarginMm ?? 15);
      setLeftMarginMm(labProfile.leftMarginMm ?? 12);
      setRightMarginMm(labProfile.rightMarginMm ?? 12);
      setPrimaryColor(labProfile.primaryColor || '#0284c7');
      setEnableQrCode(labProfile.enableQrCode ?? true);
      setQrCodePosition(labProfile.qrCodePosition || 'HEADER');
      setAccreditationBadge(labProfile.accreditationBadge || 'ISO 15189 Certified Lab');
      setServerBaseUrl(labProfile.serverBaseUrl || '');

      setShowLabName(labProfile.showLabName ?? true);
      setLabNameFontSize(labProfile.labNameFontSize ?? 22);
      setLabNameColor(labProfile.labNameColor || labProfile.primaryColor || '#0284c7');
      setLabNameAlignment(labProfile.labNameAlignment || 'RIGHT');
      setLabNameStyle(labProfile.labNameStyle || 'DEFAULT');
      setShowLabSubtitle(labProfile.showLabSubtitle ?? true);
      setShowContactInfo(labProfile.showContactInfo ?? true);
      setShowDoctorInfo(labProfile.showDoctorInfo ?? true);
      setShowPatientBox(labProfile.showPatientBox ?? true);
      setShowReportBorder(labProfile.showReportBorder ?? true);
      setShowFooter(labProfile.showFooter ?? true);
      setShowFooterSignature(labProfile.showFooterSignature ?? true);

      setEnableWatermark(labProfile.enableWatermark ?? false);
      setWatermarkType(labProfile.watermarkType || 'TEXT');
      setWatermarkText(labProfile.watermarkText ?? '');
      setWatermarkOpacity(labProfile.watermarkOpacity ?? 0.08);
      setWatermarkAngle(labProfile.watermarkAngle ?? -30);
      setWatermarkSize(labProfile.watermarkSize ?? 46);
      setWatermarkColor(labProfile.watermarkColor || '#0f172a');
      setFontFamily((labProfile.fontFamily as any) || 'Tajawal');
      setFontSize((labProfile.fontSize as any) || 'MEDIUM');
    }
  }, [labProfile]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        reportHeader: reportHeader || labName,
        reportFooter,
        headerMode,
        reportTemplate,
        topMarginMm: Number(topMarginMm),
        bottomMarginMm: Number(bottomMarginMm),
        leftMarginMm: Number(leftMarginMm),
        rightMarginMm: Number(rightMarginMm),
        primaryColor,
        enableQrCode,
        qrCodePosition,
        accreditationBadge,
        serverBaseUrl: serverBaseUrl.trim(),

        // Customization
        showLabName,
        labNameFontSize: Number(labNameFontSize),
        labNameColor,
        labNameAlignment,
        labNameStyle,
        showLabSubtitle,
        showContactInfo,
        showDoctorInfo,
        showPatientBox,
        showReportBorder,
        showFooter,
        showFooterSignature,

        // Watermark
        enableWatermark,
        watermarkType,
        watermarkText: watermarkText.trim(),
        watermarkOpacity: Number(watermarkOpacity),
        watermarkAngle: Number(watermarkAngle),
        watermarkSize: Number(watermarkSize),
        watermarkColor,

        // Typography
        fontFamily,
        fontSize,
      };

      await updateLabProfile(payload as any);
      toast.success('تم حفظ إعدادات وهوية المختبر ومصمم التقارير بنجاح!', 'حفظ التكوين');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Backup & Restore Handlers
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
        toast.success(
          `تم بنجاح تحويل وتعديل أسعار ${res.updatedTestsCount} فحصاً و ${res.updatedPanelsCount} باقة بالعملة الجديدة (${res.toCurrency})!`,
          'اكتمل التحويل'
        );
        setConversionSuccessMsg(
          `تم تحويل وتحديث أسعار كافة الفحوصات بالكتالوج بنجاح لتناسب ${res.toCurrency}`
        );
        if (res.tests && res.panels) {
          catalogCache.update(res.tests, res.panels);
        }
        if (updateLabProfile) {
          await updateLabProfile({ currency: res.toCurrency } as any);
        }
      } else {
        throw new Error(res?.message || 'فشل التحويل');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تحويل أسعار الفحوصات', 'خطأ التحويل');
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
        if (res.tests && res.panels) {
          catalogCache.update(res.tests, res.panels);
        }
        if (updateLabProfile) {
          await updateLabProfile({ currency: 'د.ع' } as any);
        }
        toast.success(
          `تمت استعادة كافة أسعار الفحوصات (${res.testsCount} فحصاً) والتكاليف بالدينار العراقي (د.ع) بنجاح!`,
          'تمت استعادة التسعير العراقي'
        );
        setConversionSuccessMsg('تمت استعادة الكتالوج بالكامل إلى التسعير العراقي الأصلي المعتمد (د.ع)');
      } else {
        throw new Error(res?.message || 'فشل استعادة الأسعار');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل استعادة الأسعار الأصلية', 'خطأ');
    } finally {
      setResettingPrices(false);
    }
  };

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await apiRequest('/backup/list');
      setBackupSnapshots(res || []);
    } catch (err) {
      console.warn('Failed to load backup snapshots', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BACKUP') {
      loadBackups();
    }
  }, [activeTab]);

  const handleExportBackup = () => {
    window.open('/api/backup/export', '_blank');
    toast.success('جاري تنزيل ملف النسخة الاحتياطية الكاملة...', 'تصدير البيانات');
  };

  const handleCreateSnapshot = async () => {
    try {
      const res = await apiRequest('/backup/snapshot', 'POST', { label: 'manual' });
      toast.success(res.message || 'تم إنشاء نقطة استرجاع احتياطية بنجاح!', 'تم الحفظ');
      loadBackups();
    } catch (err: any) {
      toast.error(err.message || 'فشل إنشاء نقطة الاسترجاع', 'خطأ');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setSelectedFileContent(content);
        const parsed = JSON.parse(content);
        setRestoreSummary({
          patients: parsed.patients?.length || 0,
          samples: parsed.samples?.length || 0,
          labName: parsed.settings?.labName || 'غير محدد',
        });
        setShowRestoreModal(true);
      } catch {
        toast.error('ملف النسخة الاحتياطية غير صالح (ليس ملف JSON سليم)', 'ملف تالف');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!selectedFileContent) return;
    setRestoring(true);
    try {
      const res = await apiRequest('/backup/restore', 'POST', selectedFileContent);
      toast.success(res.message || 'تم استعادة النسخة الاحتياطية بنجاح!', 'تمت الاستعادة');
      setShowRestoreModal(false);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      toast.error(err.message || 'فشل استرجاع النسخة الاحتياطية', 'خطأ');
    } finally {
      setRestoring(false);
    }
  };

  const templates = [
    {
      id: 'CLASSIC',
      title: 'كلاسيكي معتمد (Classic Hospital)',
      desc: 'التصميم الطبي المعتمد للمستشفيات، حدود زرقاء ملكية داكنة وجداول مريحة للقراءة.',
      color: '#0284c7',
    },
    {
      id: 'MODERN',
      title: 'عصري متدرج (Modern Tech Gradient)',
      desc: 'ترويسة بتدرج فيروزي/سيان انسيابي وشارات نتائج ملونة تضفي طابعاً تكنولوجياً فائق التطور.',
      color: '#0d9488',
    },
    {
      id: 'EXECUTIVE',
      title: 'مؤسسي رسمي (Executive Luxury)',
      desc: 'تصميم ملكي كحلي مع إطارات ذهبية وعلامة مائية أمنية، موجه للمختبرات المركزية والاستشارية.',
      color: '#b45309',
    },
    {
      id: 'COMPACT',
      title: 'مدمج مقتصد (Compact Dual-Column)',
      desc: 'مخصص لتوفير الورق والأحبار، يعرض الفحوصات بكثافة بيانات عالية لمنع انقسام النتائج لعدة صفحات.',
      color: '#334155',
    },
    {
      id: 'BLACK_WHITE',
      title: 'أبيض وأسود عالي التباين (Black & White Laser)',
      desc: 'تصميم فائق التباين مخصص للطابعات الليزرية والاقتصادية بدون استهلاك للأحبار الملونة، نصوص واضحة وحادة 100%.',
      color: '#000000',
    },
    {
      id: 'SPECIALIZED',
      title: 'تخصصي متقدم (Specialized Multi-Part)',
      desc: 'تصميم مقسم إلى كتل سريرية واضحة مخصصة للتحاليل الكبرى كالإدرار، الخروج، وزراعة الجراثيم.',
      color: '#e11d48',
    },
  ];

  const colorPresets = [
    { name: 'Royal Blue', hex: '#0284c7' },
    { name: 'Emerald Teal', hex: '#0d9488' },
    { name: 'Amber Gold', hex: '#b45309' },
    { name: 'Crimson Red', hex: '#e11d48' },
    { name: 'Slate Dark', hex: '#334155' },
    { name: 'Violet Indigo', hex: '#6366f1' },
  ];

  const fontOptions = [
    { id: 'Tajawal', name: 'تجوال (Tajawal)', desc: 'خط هندسي عصري ناعم، فائق الوضوح في التقارير الطبية', sample: 'فحص سريري معتمد 123' },
    { id: 'Cairo', name: 'كايرو (Cairo)', desc: 'خط كلاسيكي عريض وواضح، ممتاز للقراءة السريعة', sample: 'فحص سريري معتمد 123' },
    { id: 'IBM Plex Sans Arabic', name: 'آي بي إم بلكس (IBM Plex)', desc: 'خط علمي احترافي ذو معايير تقنية عالية', sample: 'فحص سريري معتمد 123' },
    { id: 'Almarai', name: 'المراعي (Almarai)', desc: 'خط عربي ناعم ومريح للعين، متوازن وأنيق', sample: 'فحص سريري معتمد 123' },
    { id: 'System', name: 'خط النظام (System / Arial)', desc: 'الخط الافتراضي للويندوز بدون تنزيل خطوط خارجية', sample: 'فحص سريري معتمد 123' },
  ];

  const fontSizeOptions = [
    { id: 'SMALL', name: 'مدمج (Compact)', desc: 'حجم خط 11px - مناسب لحشر أكبر عدد من الفحوصات في صفحة واحدة' },
    { id: 'MEDIUM', name: 'قياسي متوازن (Standard)', desc: 'حجم خط 12.5px - القياس الموصى به طبياً والمريح للعين' },
    { id: 'LARGE', name: 'كبير وواضح (Large)', desc: 'حجم خط 14px - وضوح وقراءة فائقة لكبار السن والعيادات' },
  ];

  return (
    <AppShell>
      {/* Load Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">
            <Layout color="#06b6d4" size={24} />
            مصمم التقارير البصري الشامل وإعدادات الورقة (Universal Form Designer)
          </h1>
          <p className="page-subtitle">
            مركز تحكم موحد ومتكامل لتخصيص كامل للتقارير الطبية A4: نوع وحجم الخط، القوالب السريرية، الهوامش بالمليمتر، الهوية الطبية، ومعاينة حية فورية
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-cyan-primary"
            style={{ padding: '0 18px', height: '36px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات والتصميم'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', paddingBottom: '4px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('PAPER_DESIGN')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'PAPER_DESIGN' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'PAPER_DESIGN' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={15} />
          <span>🎨 تصميم وضبط ورقة الطباعة الشاملة (Paper & Report Designer)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BACKUP')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'BACKUP' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'BACKUP' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Database size={14} />
          <span>💾 النسخ الاحتياطي واستعادة البيانات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('NETWORK')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'NETWORK' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'NETWORK' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Share2 size={14} />
          <span>🌐 الربط الشبكي وبوابة المرضى</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VERSION')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'VERSION' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'VERSION' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Award size={14} />
          <span>🚀 إصدار النظام والتحديثات</span>
        </button>
      </div>

      {/* Main Grid: Designer Form (Left) & Real-Time A4 Live Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* Designer Controls (Scrollable Form Pane) */}
        <div
          className="glass-card custom-scrollbar"
          style={{
            padding: '20px',
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >

          {/* UNIFIED TAB: PAPER_DESIGN (COMPREHENSIVE REPORT & FORM DESIGNER) */}
          {activeTab === 'PAPER_DESIGN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} dir="rtl">

              {/* Quick Presets Action Bar */}
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} />
                    <span>أوضاع الطباعة السريعة المسبقة (Quick Presets):</span>
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    انقر على أي نمط لضبط كافة العناصر وهوامش الورقة دفعة واحدة، أو قم بالتخصيص اليدوي أدناه
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMode('PREPRINTED');
                      setTopMarginMm(35);
                      setBottomMarginMm(25);
                      setLeftMarginMm(12);
                      setRightMarginMm(12);
                      setShowLabName(false);
                      setShowLabSubtitle(false);
                      setShowContactInfo(false);
                      setShowDoctorInfo(false);
                      setShowPatientBox(false);
                      setShowReportBorder(false);
                      setShowFooter(false);
                      setShowFooterSignature(false);
                      setEnableQrCode(false);
                      toast.success('تم تفعيل وضع (النتائج فقط) المخصص للورق المروّس بالمطبعة!', 'النتائج فقط');
                    }}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '11.5px', color: '#f59e0b', borderColor: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="إلغاء كافة العناصر والإطارات للطباعة على ورق مروّس يحتوي على الترويسة والبيانات مسبقاً"
                  >
                    <Square size={14} />
                    <span>📄 تفريغ للنتائج فقط (Results Only)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMode('DIGITAL');
                      setTopMarginMm(15);
                      setBottomMarginMm(15);
                      setLeftMarginMm(12);
                      setRightMarginMm(12);
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
                    style={{ padding: '7px 12px', fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckSquare size={14} />
                    <span>🖥️ التصميم الكامل الملون (Full Digital)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReportTemplate('BLACK_WHITE');
                      setPrimaryColor('#000000');
                      setShowReportBorder(true);
                      toast.success('تم تفعيل القالب الاقتصادي (أبيض وأسود ليزري)!', 'أبيض وأسود');
                    }}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '11.5px', color: '#94a3b8', borderColor: '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>🖨️ نمط أبيض وأسود ليزري</span>
                  </button>
                </div>
              </div>

              {/* 1. Typography & Fonts Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Type size={18} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    1. محرك الخطوط والطباعة العامة (Typography & Font Engine)
                  </strong>
                </div>

                {/* Font Family Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="input-label" style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '12.5px', marginBottom: '8px', display: 'block' }}>
                    نوع خط التقرير الطبي (Font Family):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
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
                            <strong style={{ fontSize: '12.5px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                              {f.name}
                            </strong>
                            {isSelected && <CheckCircle2 size={15} color="var(--accent-cyan)" />}
                          </div>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                            {f.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="input-label" style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '12.5px', marginBottom: '8px', display: 'block' }}>
                    حجم الخط الأساسي لنتائج وجداول الفحوصات (Report Font Size):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {fontSizeOptions.map((s) => {
                      const isSelected = fontSize === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setFontSize(s.id as any)}
                          style={{
                            border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-input-deep)',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '12.5px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                              {s.name}
                            </strong>
                            {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {s.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lab Name Customization (Font size, Color, Alignment, Style) */}
                <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: '10px', padding: '14px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={16} color="var(--accent-teal)" />
                      <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>
                        تخصيص خط وتنسيق اسم المختبر في الترويسة (Header Typography):
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {/* Size & Color */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: 700 }}>حجم خط اسم المختبر:</span>
                        <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{labNameFontSize}px</strong>
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
                      <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>لون خط اسم المختبر:</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={labNameColor}
                          onChange={(e) => setLabNameColor(e.target.value)}
                          style={{ width: '38px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'transparent' }}
                        />
                        <input
                          type="text"
                          value={labNameColor}
                          onChange={(e) => setLabNameColor(e.target.value)}
                          className="input-control"
                          style={{ height: '32px', fontSize: '11px', width: '90px', textAlign: 'center', fontWeight: 800 }}
                        />
                        <button
                          type="button"
                          onClick={() => setLabNameColor(primaryColor)}
                          className="btn-secondary"
                          style={{ height: '32px', padding: '0 8px', fontSize: '10px' }}
                          title="مطابقة لون السمة"
                        >
                          لون السمة
                        </button>
                      </div>
                    </div>

                    {/* Alignment */}
                    <div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>محاذاة الاسم في الترويسة:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setLabNameAlignment('RIGHT')}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: labNameAlignment === 'RIGHT' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: labNameAlignment === 'RIGHT' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                            color: labNameAlignment === 'RIGHT' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          <AlignRight size={13} />
                          <span>يمين</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLabNameAlignment('CENTER')}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: labNameAlignment === 'CENTER' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: labNameAlignment === 'CENTER' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                            color: labNameAlignment === 'CENTER' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          <AlignCenter size={13} />
                          <span>وسط</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLabNameAlignment('LEFT')}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: labNameAlignment === 'LEFT' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: labNameAlignment === 'LEFT' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                            color: labNameAlignment === 'LEFT' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          <AlignLeft size={13} />
                          <span>يسار</span>
                        </button>
                      </div>
                    </div>

                    {/* Style */}
                    <div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>شكل وتأطير اسم المختبر:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
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
                              padding: '5px 6px',
                              borderRadius: '6px',
                              border: labNameStyle === st.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                              background: labNameStyle === st.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                              color: labNameStyle === st.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700
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

              {/* 2. Templates & Paper Mode Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Layout size={18} color="var(--accent-teal)" />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    2. القالب السريري المعتمد ونمط الورقة (Template & Paper Mode)
                  </strong>
                </div>

                {/* Header Mode (Digital vs Pre-printed) */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="input-label" style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '12.5px', marginBottom: '8px', display: 'block' }}>
                    نوع الطباعة والترويسة (Header Mode):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      onClick={() => {
                        setHeaderMode('DIGITAL');
                        if (topMarginMm === 35) setTopMarginMm(15);
                      }}
                      style={{
                        border: headerMode === 'DIGITAL' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: headerMode === 'DIGITAL' ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-input-deep)',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: headerMode === 'DIGITAL' ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                          🖥️ ترويسة رقمية كاملة (Digital Header)
                        </strong>
                        {headerMode === 'DIGITAL' && <CheckCircle2 size={16} color="var(--accent-cyan)" />}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        طباعة اسم المختبر والشعار وبيانات الطبيب مباشرة على ورق A4 أبيض عادي.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setHeaderMode('PREPRINTED');
                        if (topMarginMm < 25) setTopMarginMm(35);
                      }}
                      style={{
                        border: headerMode === 'PREPRINTED' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                        background: headerMode === 'PREPRINTED' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-input-deep)',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: headerMode === 'PREPRINTED' ? '#f59e0b' : 'var(--text-main)' }}>
                          📄 ورق مروّس مسبقاً (Pre-Printed Letterhead)
                        </strong>
                        {headerMode === 'PREPRINTED' && <CheckCircle2 size={16} color="#f59e0b" />}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        إخفاء الترويسة الرقمية وترك مسافة فراغ علوية للطباعة على أوراق المختبر المطبوعة بالمطبعة.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Templates Grid */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="input-label" style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '12.5px', marginBottom: '8px', display: 'block' }}>
                    اختر القالب السريري المعتمد لتقارير A4:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {templates.map((tpl) => {
                      const isSelected = reportTemplate === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setReportTemplate(tpl.id as any)}
                          style={{
                            border: isSelected ? `2px solid ${tpl.color}` : '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(255,255,255,0.04)' : '#0d131f',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 12px ${tpl.color}40` : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '12.5px', color: isSelected ? tpl.color : 'var(--text-main)' }}>
                              {tpl.title}
                            </span>
                            {isSelected && <CheckCircle2 size={16} color={tpl.color} />}
                          </div>
                          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                            {tpl.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Color Palette */}
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Palette size={14} color="var(--accent-cyan)" />
                    <span>لون السمة الرئيسي للتقرير (Primary Accent Color):</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {colorPresets.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setPrimaryColor(c.hex)}
                        style={{
                          background: c.hex,
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: primaryColor === c.hex ? '3px solid #fff' : '2px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: primaryColor === c.hex ? '0 0 10px ' + c.hex : 'none'
                        }}
                        title={c.name}
                      >
                        {primaryColor === c.hex && <Check size={16} color="#fff" />}
                      </button>
                    ))}
                    <input
                      type="text"
                      className="input-control"
                      style={{ width: '90px', height: '32px', fontSize: '11px', textAlign: 'center', fontWeight: 800 }}
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              {/* 3. Medical Lab Identity Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Building2 size={18} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    3. الهوية الطبية والبيانات الرسمية (Medical Lab Identity)
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="input-label">اسم المختبر الرسمي *</label>
                      <input
                        type="text"
                        required
                        className="input-control"
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        placeholder="مختبر الرضا للتحليلات الطبية التخصصية"
                      />
                    </div>

                    <div>
                      <label className="input-label">الوصف الفرعي (Subtitle)</label>
                      <input
                        type="text"
                        className="input-control"
                        value={labSubtitle}
                        onChange={(e) => setLabSubtitle(e.target.value)}
                        placeholder="فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="input-label">الطبيب أو المشرف الفني *</label>
                      <input
                        type="text"
                        required
                        className="input-control"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="د. أحمد الرضا"
                      />
                    </div>

                    <div>
                      <label className="input-label">رقم إجازة الفتح / الترخيص (MOH License)</label>
                      <input
                        type="text"
                        className="input-control"
                        value={labLicense}
                        onChange={(e) => setLabLicense(e.target.value)}
                        placeholder="MOH-IQ-2026-8842"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">اللقب والاختصاص العلمي للطبيب</label>
                    <input
                      type="text"
                      className="input-control"
                      value={doctorTitle}
                      onChange={(e) => setDoctorTitle(e.target.value)}
                      placeholder="استشاري التحليلات المرضية والطبية"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="input-label">أرقام الهواتف الرسمية</label>
                      <input
                        type="text"
                        className="input-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07701234567 / 07801234567"
                      />
                    </div>

                    <div>
                      <label className="input-label">رقم الواتساب المعتمد للنتائج</label>
                      <input
                        type="text"
                        className="input-control"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="07701234567"
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '12px', padding: '16px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <DollarSign size={18} color="var(--accent-cyan)" />
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                            التحكم بالعملة والتسعير المخبري (Currency & Pricing)
                          </strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>العملة المعتمدة حالياً:</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            {currency || 'د.ع'}
                          </span>
                        </div>
                      </div>

                      {/* شبكة اختيار العملات العربية والعالمية */}
                      <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
                        اختر عملة الفحوصات (الافتراضية: الدينار العراقي):
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', marginBottom: '14px' }}>
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
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                                background: isSelected ? 'rgba(2, 132, 199, 0.18)' : 'var(--bg-main)',
                                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '11.5px',
                                fontWeight: isSelected ? 800 : 500,
                                transition: 'all 0.15s ease',
                                textAlign: 'right'
                              }}
                            >
                              <span style={{ fontSize: '16px' }}>{curr.flag}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{curr.nameAr}</span>
                                <span style={{ fontSize: '9.5px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                                  ({curr.symbol})
                                </span>
                              </div>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleSelectCurrency('CUSTOM')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: `1.5px solid ${selectedCurrencyCode === 'CUSTOM' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                            background: selectedCurrencyCode === 'CUSTOM' ? 'rgba(2, 132, 199, 0.18)' : 'var(--bg-main)',
                            color: selectedCurrencyCode === 'CUSTOM' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: selectedCurrencyCode === 'CUSTOM' ? 800 : 500
                          }}
                        >
                          ➕ عملة مخصصة
                        </button>
                      </div>

                      {/* حقول التعديل والمعامل */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isCustomCurrency ? '1fr 1fr' : '1fr',
                        gap: '10px',
                        marginBottom: '14px'
                      }}>
                        <div>
                          <label className="input-label">رمز العملة المعروض في الواجهة والتقارير</label>
                          <input
                            type="text"
                            className="input-control"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            placeholder="مثلاً: د.ع أو ر.س أو ل.س"
                            style={{ fontWeight: 800, fontSize: '14px', color: 'var(--accent-cyan)' }}
                          />
                        </div>
                        {isCustomCurrency && (
                          <div>
                            <label className="input-label">معامل التحويل اليدوي مقابل الدينار (Multiplier)</label>
                            <input
                              type="number"
                              step="any"
                              className="input-control"
                              value={customMultiplier}
                              onChange={(e) => setCustomMultiplier(e.target.value)}
                              placeholder="مثلاً: 0.00285 أو 10"
                            />
                          </div>
                        )}
                      </div>

                      {/* صندوق المعاينة والتحويل التلقائي لأسعار التحاليل */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(2, 132, 199, 0.2)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} color="#10b981" />
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                              التحويل الذكي لأسعار الكتالوج لعملة ({currency})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPreviewSamples(!showPreviewSamples)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-cyan)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontWeight: 700
                            }}
                          >
                            {showPreviewSamples ? 'إخفاء جدول المعاينة' : '👁️ عرض معاينة حية للأسعار قبل وبعد'}
                          </button>
                        </div>

                        {/* جدول المعاينة الحية */}
                        {showPreviewSamples && (
                          <div style={{
                            marginBottom: '12px',
                            overflowX: 'auto',
                            background: 'var(--bg-main)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            padding: '8px'
                          }}>
                            <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', textAlign: 'right' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '6px' }}>الفحص المخبري</th>
                                  <th style={{ padding: '6px' }}>السعر المرجعي ({labProfile.currency || 'د.ع'})</th>
                                  <th style={{ padding: '6px', color: '#10b981' }}>السعر المحسوب الجديد ({currency})</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getSamplePriceConversions(labProfile.currency || 'د.ع', currency, customMultiplier ? Number(customMultiplier) : undefined).map((sample) => (
                                  <tr key={sample.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '6px', fontWeight: 700 }}>{sample.name}</td>
                                    <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{sample.oldPrice.toLocaleString()} {labProfile.currency || 'د.ع'}</td>
                                    <td style={{ padding: '6px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                                      {sample.newPrice.toLocaleString()} {currency}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* أزرار الإجراءات */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={handleConvertPrices}
                              disabled={convertingPrices || !currency.trim()}
                              className="btn-primary"
                              style={{
                                padding: '8px 16px',
                                fontSize: '12.5px',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: convertingPrices ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {convertingPrices ? (
                                <>
                                  <RefreshCw size={14} className="spin" />
                                  <span>جارٍ تحويل أسعار الكتالوج...</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={14} />
                                  <span>تطبيق وتعديل أسعار كافة التحاليل لتناسب ({currency})</span>
                                </>
                              )}
                            </button>

                            {/* زر استعادة الأسعار والكتالوج العراقي الأصلي */}
                            <button
                              type="button"
                              onClick={handleResetPricesToDefault}
                              disabled={resettingPrices}
                              className="btn-secondary"
                              style={{
                                padding: '8px 14px',
                                fontSize: '12px',
                                fontWeight: 800,
                                color: 'var(--accent-amber)',
                                borderColor: 'rgba(245, 158, 11, 0.4)',
                                background: 'rgba(245, 158, 11, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: resettingPrices ? 'not-allowed' : 'pointer'
                              }}
                              title="استعادة كافة أسعار الفحوصات والباقات الأصلية بالدينار العراقي"
                            >
                              {resettingPrices ? (
                                <>
                                  <RefreshCw size={14} className="spin" />
                                  <span>جارٍ استعادة الكتالوج العراقي...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={14} />
                                  <span>استعادة الأسعار العراقية الأصلية (IQD - د.ع)</span>
                                </>
                              )}
                            </button>
                          </div>

                          {customMultiplier && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              معامل الصرف المطبق: <strong style={{ color: 'var(--accent-cyan)' }}>{customMultiplier}</strong>
                            </div>
                          )}
                        </div>

                        {/* رسالة نجاح التحويل */}
                        {conversionSuccessMsg && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#10b981',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <CheckCircle2 size={15} />
                            <span>{conversionSuccessMsg}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="input-label">العنوان الجغرافي للمختبر</label>
                      <input
                        type="text"
                        className="input-control"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="بغداد - شارع الأطباء - مقابل المجمع الطبي"
                      />
                    </div>

                    <div>
                      <label className="input-label">شارة الاعتماد والجودة (Accreditation Badge)</label>
                      <input
                        type="text"
                        className="input-control"
                        value={accreditationBadge}
                        onChange={(e) => setAccreditationBadge(e.target.value)}
                        placeholder="ISO 15189 Certified Lab"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">تذييل التقرير الرسمي المعتمد (Legal Report Footer)</label>
                    <textarea
                      rows={2}
                      className="input-control"
                      value={reportFooter}
                      onChange={(e) => setReportFooter(e.target.value)}
                      placeholder="هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً..."
                    />
                  </div>
                </div>
              </div>

              {/* 4. Millimeter Margins Calibration */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Sliders size={18} color="var(--accent-emerald)" />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    4. معايرة هوامش الصفحة بدقة المليمتر (Millimeter Margins Calibration)
                  </strong>
                </div>

                {/* Preset Margins Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTopMarginMm(35);
                      setBottomMarginMm(25);
                      setLeftMarginMm(12);
                      setRightMarginMm(12);
                      toast.info('تم تطبيق هوامش الورق المروّس القياسية (35mm / 25mm)');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                  >
                    📄 هوامش ورق مروّس قياسي (35/25 mm)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTopMarginMm(15);
                      setBottomMarginMm(15);
                      setLeftMarginMm(12);
                      setRightMarginMm(12);
                      toast.info('تم تطبيق هوامش الورق الأبيض القياسية (15mm / 15mm)');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                  >
                    🖥️ هوامش ورق عادي متوازن (15/15 mm)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTopMarginMm(8);
                      setBottomMarginMm(8);
                      setLeftMarginMm(8);
                      setRightMarginMm(8);
                      toast.info('تم تطبيق هوامش ضيقة جداً (8mm)');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                  >
                    📐 هوامش ضيقة جداً (8/8 mm)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-input-deep)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش العلوي (Top Margin)</label>
                      <span style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{topMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={topMarginMm}
                      onChange={(e) => setTopMarginMm(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      {headerMode === 'PREPRINTED' ? 'يترك مسافة لتفادي الطباعة فوق ترويسة المطبعة' : 'المسافة بين حافة الورقة وبداية الترويسة الرقمية'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input-deep)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش السفلي (Bottom Margin)</label>
                      <span style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{bottomMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={bottomMarginMm}
                      onChange={(e) => setBottomMarginMm(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      المسافة المحجوزة لتذييل التقرير وتفادي الطباعة فوق فوتر المطبعة
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input-deep)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش الأيمن (Right Margin)</label>
                      <span style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{rightMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={rightMarginMm}
                      onChange={(e) => setRightMarginMm(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      الهامش الجانبي الأيمن للورقة
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input-deep)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش الأيسر (Left Margin)</label>
                      <span style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{leftMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={leftMarginMm}
                      onChange={(e) => setLeftMarginMm(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      الهامش الجانبي الأيسر للورقة
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Elements Visibility Switches Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Layers size={18} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    5. مفاتيح إظهار وإخفاء عناصر التقرير (Elements Visibility Switches)
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showLabName}
                      onChange={(e) => setShowLabName(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>اسم المختبر الرسمي</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>إظهار الاسم الرئيسي في الترويسة</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showLabSubtitle}
                      onChange={(e) => setShowLabSubtitle(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>الوصف الفرعي للمختبر</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>العبارة التعريفية أسفل الاسم</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showContactInfo}
                      onChange={(e) => setShowContactInfo(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>بيانات التواصل والعنوان</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>العنوان الجغرافي ورقم الهاتف</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showDoctorInfo}
                      onChange={(e) => setShowDoctorInfo(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>بيانات الطبيب / المشرف</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>اسم الطبيب، لقبه وترخيصه</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showPatientBox}
                      onChange={(e) => setShowPatientBox(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>صندوق معلومات المريض</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>الاسم، العمر، الجنس، رقم العينة</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showReportBorder}
                      onChange={(e) => setShowReportBorder(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>إطار ورقة التقرير الخارجية</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>برواز أنيق يحيط بكامل الورقة</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showFooter}
                      onChange={(e) => setShowFooter(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>تذييل التقرير الرسمي (Footer)</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>عبارة الاعتماد القانوني أسفل الورقة</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showFooterSignature}
                      onChange={(e) => setShowFooterSignature(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>توقيع وتفويض المختبر بالفوتر</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ختم وتفويض الطبيب السريري</div>
                    </div>
                  </label>
                </div>

                {/* QR Code Settings */}
                <div style={{ marginTop: '14px', padding: '12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableQrCode}
                      onChange={(e) => setEnableQrCode(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <QrCode size={14} color="var(--accent-cyan)" />
                        <span>تفعيل باركود التحقق الإلكتروني (QR Code Verification)</span>
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>يتيح للمريض مسح الباركود بالكاميرا لفتح النتيجة وتنزيلها PDF</span>
                    </div>
                  </label>

                  {enableQrCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>موضع الباركود:</span>
                      <button
                        type="button"
                        onClick={() => setQrCodePosition('HEADER')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: qrCodePosition === 'HEADER' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: qrCodePosition === 'HEADER' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: qrCodePosition === 'HEADER' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        في الترويسة (Header)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrCodePosition('FOOTER')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: qrCodePosition === 'FOOTER' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: qrCodePosition === 'FOOTER' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: qrCodePosition === 'FOOTER' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }}
                      >
                        في التذييل (Footer)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Security Watermark Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="var(--accent-cyan)" />
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                      6. العلامة المائية للأمان والتوثيق (Security Watermark)
                    </strong>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: enableWatermark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${enableWatermark ? '#10b981' : '#ef4444'}` }}>
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: enableWatermark ? '#10b981' : '#ef4444' }}>
                      {enableWatermark ? 'العلامة المائية مفعلة' : 'العلامة المائية معطلة'}
                    </span>
                  </label>
                </div>

                {enableWatermark && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div>
                      <label className="input-label">نص العلامة المائية:</label>
                      <input
                        type="text"
                        className="input-control"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder={labName || 'ORIGINAL REPORT'}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="input-label" style={{ margin: 0 }}>درجة الشفافية (Opacity):</label>
                        <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{Math.round(watermarkOpacity * 100)}%</strong>
                      </div>
                      <input
                        type="range"
                        min={0.03}
                        max={0.30}
                        step={0.01}
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="input-label" style={{ margin: '0' }}>زاوية الميلان (Angle):</label>
                        <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{watermarkAngle}°</strong>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="input-label" style={{ margin: '0' }}>حجم الخط (Size):</label>
                        <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{watermarkSize}px</strong>
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

            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'BACKUP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} dir="rtl">
              {/* Quick Actions Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                
                {/* Export Card */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>
                      <Download size={18} />
                      <span>تصدير نسخة احتياطية فورية (Export)</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
                      تنزيل ملف كامل بنقرة واحدة يحتوي على كافة بيانات المرضى، الفحوصات، العينات، الحسابات المالية، وقوالب وهوية المختبر لحفظها بأمان على فلاش ميموري (USB) أو قرص خارجي.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="btn-primary"
                    style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Download size={16} />
                    <span>تحميل ملف النسخة الاحتياطية (.json)</span>
                  </button>
                </div>

                {/* Restore Card */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>
                      <Upload size={18} />
                      <span>استرجاع نسخة احتياطية (Restore)</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
                      استعادة قاعدة بيانات المختبر من ملف نسخة احتياطية سابق (.json). يقوم النظام تلقائياً بأخذ لقطة أمان وقائية قبل الاسترجاع لضمان عدم ضياع أي بيانات.
                    </p>
                  </div>

                  <label
                    className="btn-secondary"
                    style={{
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                    }}
                  >
                    <Upload size={16} />
                    <span>اختيار ملف واسترجاع البيانات</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Automatic Rolling Snapshots Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={18} color="var(--accent-teal)" />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                      النسخ الاحتياطية التلقائية المخزنة محلياً (Auto-Snapshots):
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCreateSnapshot}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={13} />
                      <span>أخذ نقطة استرجاع الآن</span>
                    </button>
                    <button
                      type="button"
                      onClick={loadBackups}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      title="تحديث القائمة"
                    >
                      <RefreshCw size={13} className={loadingBackups ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  يقوم محرك النظام بحفظ لقطات يومية تلقائية مع الكتابة الذرية الآمنة لمنع التلف عند انقطاع الكهرباء، ويحتفظ بآخر 30 لقطة في مجلد الأمان الداخلي.
                </p>

                {loadingBackups ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    جاري فحص النسخ الاحتياطية...
                  </div>
                ) : backupSnapshots.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                    لا توجد لقطات محفوظة حالياً. يمكنك الضغط على "أخذ نقطة استرجاع الآن" لإنشاء أول نسخة.
                  </div>
                ) : (
                  <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                          <th style={{ padding: '10px 12px' }}>اسم ملف النسخة</th>
                          <th style={{ padding: '10px 12px' }}>تاريخ الإنشاء</th>
                          <th style={{ padding: '10px 12px' }}>حجم الملف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupSnapshots.map((b, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                              {b.fileName}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                              {formatEnglishDateTime(b.createdAt)}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                              {(b.sizeBytes / 1024).toFixed(1)} KB
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NETWORK & PATIENT PORTAL */}
          {activeTab === 'NETWORK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} dir="rtl">
              
              {/* Local Network Info Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '15px', marginBottom: '8px' }}>
                  <Share2 size={20} />
                  <span>الربط عبر الشبكة المحلية (Local Wi-Fi & LAN)</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                  يمكنك فتح النظام واستعراض التقارير وإدخال النتائج من أي جهاز كمبيوتر، هاتف ذكي، أو جهاز لوحي (تابلت) متصل بنفس شبكة الراوتر أو الواي فاي الخاصة بالمختبر دون الحاجة إلى تثبيت أي برامج على ذلك الجهاز.
                </p>

                <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>عنوان الآي بي المحلي المكتشف للجهاز الحالي (LAN IP):</span>
                    <strong style={{ fontSize: '16px', fontFamily: 'monospace', color: 'var(--accent-cyan)', direction: 'ltr', display: 'inline-block' }}>
                      {labProfile.detectedLanUrl || 'http://192.168.0.122:8080'}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const url = labProfile.detectedLanUrl || 'http://192.168.0.122:8080';
                      navigator.clipboard.writeText(url);
                      toast.success('تم نسخ رابط الشبكة المحلية بنجاح!', 'تم النسخ');
                    }}
                    className="btn-cyan-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    <span>نسخ رابط الشبكة المحلية 📋</span>
                  </button>
                </div>
              </div>

              {/* Public Portal / Domain Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '15px', marginBottom: '8px' }}>
                  <ExternalLink size={20} />
                  <span>رابط البوابة العامة / النطاق المخصص للمرضى (Public Portal / Tunnel)</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '14px' }}>
                  إذا كنت ترغب بتمكين المرضى من فتح تقاريرهم من منازلهم عبر شبكة الإنترنت الخارجية (باقة الهاتف 4G/5G)، يمكنك ربط خادمك بنطاق مخصص أو نفق إنترنت (مثل Cloudflare Tunnel أو No-IP أو دومين المختبر) وكتابته هنا. سيتم اعتماده تلقائياً في كافة رسائل الواتساب وأكواد الـ QR.
                </p>

                <div>
                  <label className="input-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    رابط الخادم العام / دومين المختبر (Server Base URL):
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="مثال: https://results.mylab.com أو http://192.168.0.122:8080"
                    value={serverBaseUrl}
                    onChange={(e) => setServerBaseUrl(e.target.value)}
                    style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', width: '100%', padding: '9px 12px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    * اتركه فارغاً إذا كنت تريد اعتماد عنوان الآي بي المحلي التلقائي.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: VERSION & MANUAL UPDATE CHECK */}
          {activeTab === 'VERSION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} dir="rtl">
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)' }}>
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text-main)' }}>Labryo Clinical LIMS Pro</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>نظام إدارة المختبرات الطبية والتحاليل السريرية المؤتمت</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الإصدار المثبت حالياً</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-cyan)', marginTop: '2px' }}>v1.0.5</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>حالة البيئة والإنتاج</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={15} />
                      <span>إصدار إنتاجي مستقر 100%</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>قناة التوزيع والتحديث</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>GitHub Releases / Auto-Update</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    disabled={checkingUpdate}
                    className="btn-cyan-primary"
                    style={{ minHeight: '42px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}
                  >
                    <RefreshCw size={16} className={checkingUpdate ? 'animate-spin' : ''} />
                    <span>{checkingUpdate ? 'جاري فحص المستودع الرسمي...' : 'فحص التحديثات الآن (Check for Updates)'}</span>
                  </button>
                </div>

                {updateInfo && (
                  <div style={{ marginTop: '16px', background: updateInfo.hasUpdate ? 'rgba(2, 132, 199, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${updateInfo.hasUpdate ? '#0284c7' : '#10b981'}`, borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontWeight: 800, color: updateInfo.hasUpdate ? '#38bdf8' : '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {updateInfo.hasUpdate ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      <span>{updateInfo.hasUpdate ? `يوجد تحديث أحدث متاح: ${updateInfo.latestVersion}` : `نظام المختبر لديك يعمل بأحدث إصدار رسمي (${updateInfo.currentVersion})`}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: '6px 0 0 0', lineHeight: 1.5 }}>{updateInfo.releaseNotes}</p>
                    {updateInfo.downloadUrl && updateInfo.hasUpdate && (
                      <a
                        href={updateInfo.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                      >
                        <Download size={14} />
                        <span>تحميل التحديث الجديد (v{updateInfo.latestVersion})</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              جميع التغييرات تُطبق فوراً على محرك الطباعة وشاشات النتائج
            </span>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="btn-cyan-primary"
              style={{ padding: '0 24px', height: '36px', fontWeight: 800 }}
            >
              <Save size={15} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ وتطبيق التغييرات'}</span>
            </button>
          </div>

        </div>

        {/* Real-Time Live A4 Preview Card (Stationary / Sticky Preview) */}
        <div
          className="custom-scrollbar"
          style={{
            position: 'sticky',
            top: '76px',
            alignSelf: 'start',
            zIndex: 30,
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto',
            paddingLeft: '2px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} color="var(--accent-cyan)" />
              <span>معاينة حية ومطابقة للطباعة (Live A4 Preview)</span>
              <span style={{ fontSize: '10px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                📌 شاشة مثبتة تلقائياً
              </span>
            </span>

            <span style={{ fontSize: '10px', background: primaryColor, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              {reportTemplate} | {headerMode} | {fontFamily} | {fontSize}
            </span>
          </div>

          <div
            className="glass-card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              fontFamily: fontFamily === 'Tajawal' ? "'Tajawal', sans-serif" : fontFamily === 'Cairo' ? "'Cairo', sans-serif" : fontFamily === 'IBM Plex Sans Arabic' ? "'IBM Plex Sans Arabic', sans-serif" : fontFamily === 'Almarai' ? "'Almarai', sans-serif" : 'system-ui, sans-serif',
              border: showReportBorder ? (reportTemplate === 'BLACK_WHITE' ? '2px solid #000' : `2px solid ${primaryColor}`) : '1px solid #e2e8f0',
              padding: `${topMarginMm * 1.5}px ${leftMarginMm * 1.5}px ${bottomMarginMm * 1.5}px ${rightMarginMm * 1.5}px`,
              borderRadius: '8px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              direction: 'ltr',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
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
                <div style={{
                  height: `${Math.max(40, topMarginMm * 2)}px`,
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  📄 Pre-Printed Lab Stationery Reserved Space ({topMarginMm}mm)
                </div>
              ) : (showLabName || showLabSubtitle || showContactInfo || showDoctorInfo || (enableQrCode && qrCodePosition === 'HEADER')) ? (
                reportTemplate === 'MODERN' ? (
                  <div style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #06b6d4 100%)`,
                    color: '#fff',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                      {showLabName && (
                        <div style={{
                          fontSize: `${labNameFontSize}px`,
                          fontWeight: 900,
                          color: '#fff',
                          display: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? 'inline-block' : 'block',
                          background: labNameStyle === 'MODERN_BADGE' ? 'rgba(255,255,255,0.2)' : 'transparent',
                          border: labNameStyle === 'ELEGANT_BORDER' ? '1.5px solid #fff' : 'none',
                          padding: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? '2px 8px' : '0',
                          borderRadius: '6px',
                          marginBottom: '2px'
                        }}>
                          <TestTube size={Math.min(18, labNameFontSize - 4)} /> {labName || 'اسم المختبر'}
                        </div>
                      )}
                      {showLabSubtitle && <p style={{ fontSize: '10px', opacity: 0.9, margin: 0 }}>{labSubtitle}</p>}
                      {showContactInfo && <p style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px', margin: 0 }}>العنوان: {address} | هاتف: {phone}</p>}
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {enableQrCode && qrCodePosition === 'HEADER' && (
                        <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                          <QrCode size={30} />
                        </div>
                      )}
                      {showDoctorInfo && (
                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '6px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#fff', margin: 0 }}>{doctorName || 'Dr. Laboratory Director'}</h4>
                          <p style={{ fontSize: '9px', opacity: 0.9, margin: 0 }}>{doctorTitle}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ borderBottom: `2px solid ${primaryColor}`, paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ textAlign: labNameAlignment.toLowerCase() as any, flex: 1 }}>
                      {showLabName && (
                        <div style={{
                          fontSize: `${labNameFontSize}px`,
                          fontWeight: labNameStyle === 'BOLD' ? 900 : 800,
                          color: labNameColor,
                          display: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? 'inline-block' : 'block',
                          background: labNameStyle === 'MODERN_BADGE' ? `${labNameColor}18` : 'transparent',
                          border: labNameStyle === 'ELEGANT_BORDER' ? `1.5px solid ${labNameColor}` : 'none',
                          padding: labNameStyle === 'MODERN_BADGE' || labNameStyle === 'ELEGANT_BORDER' ? '2px 8px' : '0',
                          borderRadius: '6px',
                          marginBottom: '2px'
                        }}>
                          <TestTube size={Math.min(18, labNameFontSize - 4)} /> {labName || 'اسم المختبر'}
                        </div>
                      )}
                      {showLabSubtitle && <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, margin: 0 }}>{labSubtitle}</p>}
                      {showContactInfo && <p style={{ fontSize: '9px', color: '#475569', marginTop: '2px', margin: 0 }}>العنوان: {address} | هاتف: {phone}</p>}
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {enableQrCode && qrCodePosition === 'HEADER' && (
                        <div style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={28} color={primaryColor} />
                        </div>
                      )}
                      {showDoctorInfo && (
                        <div>
                          <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{doctorName || 'Dr. Laboratory Director'}</h4>
                          <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>{doctorTitle}</p>
                          {labLicense && <p style={{ fontSize: '8.5px', color: primaryColor, margin: 0 }}>License: {labLicense}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : null}

              {/* Patient Bar */}
              {showPatientBox && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>Patient:</strong> Hayder Al-Khafaji (Male, 48y)</span>
                    <span><strong>Sample ID:</strong> #1001</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#64748b' }}>
                    <span><strong>Ref Doctor:</strong> Direct Consultation</span>
                    <span><strong>Date:</strong> 2026-09-01</span>
                  </div>
                </div>
              )}

              {/* Sample Table */}
              <table style={{ width: '100%', fontSize: fontSize === 'SMALL' ? '9.5px' : fontSize === 'LARGE' ? '12px' : '10.5px', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <thead>
                  <tr style={{ background: primaryColor, color: '#ffffff' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>INVESTIGATION</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>RESULT</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>REF. RANGE</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>Hemoglobin (Hb)</td>
                    <td style={{ padding: '5px 8px', color: '#059669', fontWeight: 800 }}>14.5 g/dL</td>
                    <td style={{ padding: '5px 8px' }}>13.0 - 17.5</td>
                    <td style={{ padding: '5px 8px', color: '#059669', fontWeight: 700 }}>Normal</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>Serum Creatinine</td>
                    <td style={{ padding: '5px 8px', color: '#d97706', fontWeight: 800 }}>1.8 mg/dL</td>
                    <td style={{ padding: '5px 8px' }}>0.7 - 1.3</td>
                    <td style={{ padding: '5px 8px', color: '#d97706', fontWeight: 700 }}>High (eGFR: 45)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>Fasting Blood Sugar</td>
                    <td style={{ padding: '5px 8px', color: '#059669', fontWeight: 800 }}>95 mg/dL</td>
                    <td style={{ padding: '5px 8px' }}>70 - 100</td>
                    <td style={{ padding: '5px 8px', color: '#059669', fontWeight: 700 }}>Normal</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Area */}
            {showFooter && (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '9px', color: '#64748b' }}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0 }}>{reportFooter}</p>
                    {accreditationBadge && (
                      <span style={{ fontWeight: 800, color: primaryColor, display: 'inline-block', marginTop: '2px' }}>
                        🛡️ {accreditationBadge}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {enableQrCode && qrCodePosition === 'FOOTER' && (
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '8px' }}>Scan:</span>
                        <QrCode size={26} color={primaryColor} />
                      </div>
                    )}
                    {showFooterSignature && (
                      <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '8px', textAlign: 'right' }}>
                        <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>Clinical Signature</span>
                        <strong style={{ fontSize: '9px', color: '#0f172a' }}>Verified & Signed</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content" dir="rtl" style={{ maxWidth: '480px', padding: '24px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '14px' }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 900, marginBottom: '8px', color: 'var(--text-main)' }}>
              تأكيد استرجاع النسخة الاحتياطية
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              أنت على وشك استرجاع البيانات من الملف: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedFileName}</strong>
            </p>

            {restoreSummary && (
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '18px', textAlign: 'right', fontSize: '12px' }}>
                <div style={{ marginBottom: '4px' }}>اسم المختبر: <strong>{restoreSummary.labName}</strong></div>
                <div style={{ marginBottom: '4px' }}>عدد المرضى: <strong style={{ color: 'var(--accent-cyan)' }}>{restoreSummary.patients}</strong></div>
                <div>عدد العينات والفحوصات: <strong style={{ color: 'var(--accent-emerald)' }}>{restoreSummary.samples}</strong></div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px', marginBottom: '18px' }}>
              🛡️ سيقوم النظام تلقائياً بأخذ نقطة أمان وقائية للبيانات الحالية قبل الاسترجاع.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                disabled={restoring}
                className="btn-secondary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="btn-primary"
                style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 800, background: '#10b981' }}
              >
                {restoring ? 'جاري الاسترجاع...' : 'تأكيد واسترجاع البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
