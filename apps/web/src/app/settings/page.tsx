'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import PaperDesignerV2 from '../../components/workspace/PaperDesignerV2';
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

  // Milestone M5 & R3: Version Management & In-App Resumable Updater
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadState, setDownloadState] = useState<{
    status: 'idle' | 'downloading' | 'paused' | 'reconnecting' | 'completed' | 'error';
    progressPercent: number;
    transferredBytes: number;
    totalBytes: number;
    speedBps: number;
    retryCount: number;
    errorMessage: string | null;
    filePath: string | null;
  }>({
    status: 'idle',
    progressPercent: 0,
    transferredBytes: 0,
    totalBytes: 0,
    speedBps: 0,
    retryCount: 0,
    errorMessage: null,
    filePath: null,
  });
  const [startingDownload, setStartingDownload] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Poll download state when active or reconnecting
  useEffect(() => {
    let timer: any = null;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/version/download').then(r => r.json());
        if (res && res.status) {
          setDownloadState(res);
        }
      } catch (e) {}
    };

    if (activeTab === 'VERSION') {
      fetchStatus();
    }

    if (downloadState.status === 'downloading' || downloadState.status === 'reconnecting') {
      timer = setInterval(fetchStatus, 600);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTab, downloadState.status]);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('/api/version/check').then(r => r.json());
      setUpdateInfo(res);
      // Also check current download state
      try {
        const dState = await fetch('/api/version/download').then(r => r.json());
        if (dState && dState.status) setDownloadState(dState);
      } catch (e) {}

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

  const handleStartInAppDownload = async () => {
    if (!updateInfo?.downloadUrl) return;
    setStartingDownload(true);
    try {
      const res = await fetch('/api/version/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadUrl: updateInfo.downloadUrl,
          version: updateInfo.latestVersion,
        }),
      }).then(r => r.json());
      if (res && res.status) {
        setDownloadState(res);
        toast.info('بدأ تنزيل ملف التحديث مع ميزة الاستئناف التلقائي', 'تحميل التحديث');
      }
    } catch (err: any) {
      toast.error('فشل بدء تحميل التحديث', 'خطأ في التحديث');
    } finally {
      setStartingDownload(false);
    }
  };

  const handleExecuteInstall = async () => {
    setInstalling(true);
    try {
      const res = await fetch('/api/version/install', {
        method: 'POST',
      }).then(r => r.json());
      if (res.success) {
        toast.success(res.message, 'تثبيت التحديث');
      } else {
        toast.error(res.error || 'تعذر تشغيل مثبت التحديث', 'فشل التثبيت');
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء محاولة التثبيت', 'فشل التثبيت');
    } finally {
      setInstalling(false);
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

      {/* Settings Tab Content */}
      {activeTab === 'PAPER_DESIGN' ? (
        <PaperDesignerV2 />
      ) : (
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <div
            className="glass-card custom-scrollbar"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
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
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                      {updateInfo?.currentVersion || labProfile?.installedVersion || 'v1.0.9'}
                    </div>
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
                  <div style={{ marginTop: '16px', background: updateInfo.hasUpdate ? 'rgba(2, 132, 199, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${updateInfo.hasUpdate ? '#0284c7' : '#10b981'}`, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: 800, color: updateInfo.hasUpdate ? '#38bdf8' : '#34d399', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {updateInfo.hasUpdate ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        <span>{updateInfo.hasUpdate ? `يوجد تحديث أحدث متاح: ${updateInfo.latestVersion}` : `نظام المختبر لديك يعمل بأحدث إصدار رسمي (${updateInfo.currentVersion})`}</span>
                      </div>
                      {updateInfo.hasUpdate && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          تحديث محلي آمن مع الاحتفاظ التام بكافة البيانات وقاعدة البيانات
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: '8px 0 14px 0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{updateInfo.releaseNotes}</p>

                    {/* Auto-reconnecting status banner if internet drops */}
                    {downloadState.status === 'reconnecting' && (
                      <div style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15', fontSize: '12px' }}>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>انقطع اتصال الإنترنت، جاري محاولة الاستئناف التلقائي فور عودة الاتصال [المحاولة {downloadState.retryCount}/25]...</span>
                      </div>
                    )}

                    {/* Progress Bar & Real-Time Stats (During Download or Reconnecting or Completed) */}
                    {(downloadState.status === 'downloading' || downloadState.status === 'reconnecting' || downloadState.status === 'completed') && (
                      <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {downloadState.status === 'completed'
                              ? 'اكتمل التحميل بنجاح (100%)'
                              : downloadState.status === 'reconnecting'
                              ? 'في انتظار عودة الإنترنت للاستئناف...'
                              : 'جاري تنزيل التحديث في الخلفية...'}
                          </span>
                          <span style={{ fontWeight: 800, color: downloadState.status === 'completed' ? '#10b981' : 'var(--accent-cyan)' }}>
                            {downloadState.progressPercent.toFixed(1)}%
                          </span>
                        </div>

                        {/* Progress bar container */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${downloadState.progressPercent}%`,
                              height: '100%',
                              background: downloadState.status === 'completed'
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : 'linear-gradient(90deg, #0284c7, #06b6d4)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>
                            تم تنزيل: {(downloadState.transferredBytes / (1024 * 1024)).toFixed(1)} ميغابايت
                            {downloadState.totalBytes > 0 && ` من أصل ${(downloadState.totalBytes / (1024 * 1024)).toFixed(1)} ميغابايت`}
                          </span>
                          {downloadState.status === 'downloading' && (
                            <span>
                              السرعة: {(downloadState.speedBps / (1024 * 1024)).toFixed(2)} MB/s
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Transition from 'تحميل التحديث' to 'تثبيت التحديث' */}
                    {updateInfo.hasUpdate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {downloadState.status === 'completed' ? (
                          // Transition to Install Button
                          <button
                            type="button"
                            onClick={handleExecuteInstall}
                            disabled={installing}
                            className="btn-cyan-primary"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              borderColor: '#10b981',
                              minHeight: '40px',
                              padding: '0 20px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: 800,
                              fontSize: '13px',
                              color: '#fff',
                            }}
                          >
                            <Zap size={16} />
                            <span>{installing ? 'جاري بدء التثبيت...' : 'تثبيت التحديث الآن (Install Update)'}</span>
                          </button>
                        ) : (
                          // Download Button
                          <button
                            type="button"
                            onClick={handleStartInAppDownload}
                            disabled={startingDownload || downloadState.status === 'downloading' || downloadState.status === 'reconnecting'}
                            className="btn-cyan-primary"
                            style={{ minHeight: '40px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px' }}
                          >
                            {startingDownload || downloadState.status === 'downloading' || downloadState.status === 'reconnecting' ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : (
                              <Download size={15} />
                            )}
                            <span>
                              {downloadState.status === 'downloading'
                                ? `جاري التحميل (${downloadState.progressPercent.toFixed(0)}%)...`
                                : downloadState.status === 'reconnecting'
                                ? 'جاري الاستئناف التلقائي...'
                                : `تحميل التحديث الجديد (${updateInfo.latestVersion})`}
                            </span>
                          </button>
                        )}

                        {/* Dual-track parallel fallback: direct browser download link */}
                        {updateInfo.downloadUrl && (
                          <a
                            href={updateInfo.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'transparent',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-muted)',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                            }}
                            title="رابط تحميل خارجي مباشر عبر المتصفح"
                          >
                            <ExternalLink size={13} />
                            <span>تحميل يدوي خارجي عبر المتصفح (Dual-Track Fallback)</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

            {activeTab === 'NETWORK' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="btn-cyan-primary"
                  style={{ padding: '0 24px', height: '36px', fontWeight: 800 }}
                >
                  <Save size={15} />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
