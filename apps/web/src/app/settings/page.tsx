'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { Settings as SettingsIcon, Save, Sparkles, Printer, CheckCircle2, Award, Phone, DollarSign, Building2, Layout, FileText, Maximize2, QrCode, Sliders, Palette, Eye, ShieldCheck, Check, TestTube, Zap, Database, Download, Upload, RefreshCw, HardDrive, AlertCircle, History, Share2, ExternalLink, Plus, Type, Droplet, AlignRight, AlignCenter, AlignLeft, Square, Layers, Trash2, EyeOff, CheckSquare, Sparkle } from 'lucide-react';
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

  // Milestone M4: Universal Visual Form Designer Settings
  const [headerMode, setHeaderMode] = useState<'DIGITAL' | 'PREPRINTED'>(
    (labProfile.headerMode as any) || 'DIGITAL'
  );
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED'>(
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

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'CUSTOMIZE' | 'DESIGNER' | 'MARGINS' | 'IDENTITY' | 'BACKUP' | 'NETWORK'>('CUSTOMIZE');

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

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">
            <Layout color="#06b6d4" size={24} />
            مصمم التقارير البصري وهوية المختبر (Visual Form Designer)
          </h1>
          <p className="page-subtitle">
            تخصيص كامل للتقارير الطبية A4، معايرة هوامش الورق المروّس بالمليمتر، واختيار القوالب السريرية الـ 5 مع معاينة حية متزامنة
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-cyan-primary"
            style={{ padding: '0 18px', height: '36px', fontSize: '12px' }}
          >
            <Save size={15} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات والتصميم <Check size={12} />'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', paddingBottom: '4px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('CUSTOMIZE')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'CUSTOMIZE' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'CUSTOMIZE' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Sliders size={14} />
          <span>🎛️ تخصيص عناصر الورقة والعلامة المائية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DESIGNER')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'DESIGNER' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'DESIGNER' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={14} />
          <span>🎨 قوالب وسمات التقرير</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MARGINS')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'MARGINS' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'MARGINS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Maximize2 size={14} />
          <span>📄 الورق المروّس والهوامش (Margins)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IDENTITY')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'IDENTITY' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'IDENTITY' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Building2 size={14} />
          <span>🏛️ هوية المختبر والتراخيص</span>
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
      </div>

      {/* Main Grid: Designer Form (Left) & Real-Time A4 Live Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* Designer Controls */}
        <div className="glass-card" style={{ padding: '20px' }}>

          {/* TAB 0: CUSTOMIZE SHEET ELEMENTS & WATERMARK */}
          {activeTab === 'CUSTOMIZE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} dir="rtl">
              
              {/* Quick Preset Action Bar */}
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'block' }}>
                    ⚡ أوضاع الإخراج والطباعة السريعة:
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    اختر نمط الإخراج التلقائي بنقرة واحدة أو قم بتخصيص كل عنصر يدويًا أدناه
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLabName(false);
                      setShowLabSubtitle(false);
                      setShowContactInfo(false);
                      setShowDoctorInfo(false);
                      setShowPatientBox(false);
                      setShowReportBorder(false);
                      setShowFooter(false);
                      setShowFooterSignature(false);
                      setEnableQrCode(false);
                      toast.success('تم تفعيل وضع (النتائج فقط) - الورقة فارغة وجاهزة للورق المروّس بالمطبعة!', 'النتائج فقط');
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11.5px', color: '#f59e0b', borderColor: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="إلغاء كافة العناصر والإطارات للطباعة على ورق مروّس يحتوي على الترويسة والبيانات مسبقاً"
                  >
                    <Square size={13} />
                    <span>تفريغ للنتائج فقط (Results Only)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLabName(true);
                      setShowLabSubtitle(true);
                      setShowContactInfo(true);
                      setShowDoctorInfo(true);
                      setShowPatientBox(true);
                      setShowReportBorder(true);
                      setShowFooter(true);
                      setShowFooterSignature(true);
                      setEnableQrCode(true);
                      toast.success('تم استعادة التصميم الكامل والافتراضي لورقة التقرير!', 'استعادة التصميم');
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckSquare size={13} />
                    <span>استعادة التصميم الكامل (Full)</span>
                  </button>
                </div>
              </div>

              {/* 1. Lab Name Customization Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Type size={18} color="var(--accent-cyan)" />
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                      اسم المختبر الرسمي (تنسيق وتصميم الاسم):
                    </strong>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: showLabName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${showLabName ? '#10b981' : '#ef4444'}` }}>
                    <input
                      type="checkbox"
                      checked={showLabName}
                      onChange={(e) => setShowLabName(e.target.checked)}
                      style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: showLabName ? '#10b981' : '#ef4444' }}>
                      {showLabName ? 'مفعّل (يظهر بالورقة)' : 'محذوف / مخفي'}
                    </span>
                  </label>
                </div>

                {showLabName && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    
                    {/* Size and Color */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', alignItems: 'center' }}>
                      <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)' }}>حجم خط اسم المختبر:</span>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{labNameFontSize} px</span>
                        </div>
                        <input
                          type="range"
                          min={14}
                          max={34}
                          value={labNameFontSize}
                          onChange={(e) => setLabNameFontSize(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                          لون خط اسم المختبر:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="color"
                            value={labNameColor}
                            onChange={(e) => setLabNameColor(e.target.value)}
                            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                          />
                          <input
                            type="text"
                            value={labNameColor}
                            onChange={(e) => setLabNameColor(e.target.value)}
                            className="input-control"
                            style={{ height: '32px', fontSize: '11.5px', textAlign: 'center', fontWeight: 800 }}
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
                    </div>

                    {/* Alignment & Design Style */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                      
                      {/* Alignment */}
                      <div>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                          محاذاة الاسم في الترويسة:
                        </span>
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
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            <AlignRight size={14} />
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
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            <AlignCenter size={14} />
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
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            <AlignLeft size={14} />
                            <span>يسار</span>
                          </button>
                        </div>
                      </div>

                      {/* Design Style */}
                      <div>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                          شكل وتصميم اسم المختبر:
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          {[
                            { id: 'DEFAULT', title: 'كلاسيكي قياسي', desc: 'نص أنيق مباشر' },
                            { id: 'BOLD', title: 'عريض بارز', desc: 'خط سميك قوي' },
                            { id: 'MODERN_BADGE', title: 'شارة حديثة', desc: 'خلفية خفيفة مستديرة' },
                            { id: 'ELEGANT_BORDER', title: 'إطار رسمي', desc: 'مؤطر بحدود ناعمة' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setLabNameStyle(st.id as any)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: labNameStyle === st.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                                background: labNameStyle === st.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input-deep)',
                                color: labNameStyle === st.id ? 'var(--accent-cyan)' : 'var(--text-main)',
                                cursor: 'pointer',
                                textAlign: 'right',
                              }}
                            >
                              <div style={{ fontSize: '11.5px', fontWeight: 800 }}>{st.title}</div>
                              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{st.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </div>

              {/* 2. Page Elements Visibility Control Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Layers size={18} color="var(--accent-teal)" />
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                    التحكم في ظهور عناصر وتفاصيل الصفحة:
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  
                  {/* Subtitle */}
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

                  {/* Contact Info */}
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

                  {/* Doctor Info */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showDoctorInfo}
                      onChange={(e) => setShowDoctorInfo(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>بيانات الطبيب / المشرف الفني</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>اسم الطبيب، لقبه وترخيصه المهني</div>
                    </div>
                  </label>

                  {/* Patient Meta Box */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showPatientBox}
                      onChange={(e) => setShowPatientBox(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>صندوق معلومات المريض</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>الاسم، العمر، الجنس، رقم العينة، التاريخ</div>
                    </div>
                  </label>

                  {/* Report Outer Border */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showReportBorder}
                      onChange={(e) => setShowReportBorder(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>إطار وحدود ورقة التقرير</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>إلغاؤه يمنح الورقة حواف بيضاء بالكامل</div>
                    </div>
                  </label>

                  {/* Footer Box */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showFooter}
                      onChange={(e) => setShowFooter(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>ذيل الصفحة (Footer) بالكامل</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>الملاحظة القانونية وشارة الاعتماد</div>
                    </div>
                  </label>

                  {/* Footer Signature */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showFooterSignature}
                      onChange={(e) => setShowFooterSignature(e.target.checked)}
                      disabled={!showFooter}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: showFooter ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        خانة توقيع الطبيب والختم
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Approved by Pathologist في الذيل</div>
                    </div>
                  </label>

                  {/* QR Code */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableQrCode}
                      onChange={(e) => setEnableQrCode(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>رمز الاستجابة السريعة (QR Code)</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>رابط التحقق الإلكتروني الذكي للتقرير</div>
                    </div>
                  </label>

                </div>
              </div>

              {/* 3. Watermark Customization Section */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Droplet size={18} color="#06b6d4" />
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                      العلامة المائية لورقة النتيجة (Watermark Security):
                    </strong>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: enableWatermark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${enableWatermark ? 'var(--accent-cyan)' : '#ef4444'}` }}>
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: enableWatermark ? 'var(--accent-cyan)' : '#ef4444' }}>
                      {enableWatermark ? 'العلامة المائية مفعلة' : 'معطلة / محذوفة'}
                    </span>
                  </label>
                </div>

                {enableWatermark && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    
                    {/* Watermark Text Input & Suggestions */}
                    <div>
                      <label className="input-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                        نص العلامة المائية:
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        placeholder="اكتب نص العلامة المائية هنا، مثل: اسم المختبر أو كلمة ORIGINAL"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: 700 }}
                      />

                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>اقتراحات سريعة:</span>
                        <button
                          type="button"
                          onClick={() => setWatermarkText(labName || 'مختبر طبي معتمد')}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '10.5px' }}
                        >
                          {labName || 'اسم المختبر'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setWatermarkText('ORIGINAL REPORT')}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '10.5px' }}
                        >
                          ORIGINAL REPORT
                        </button>
                        <button
                          type="button"
                          onClick={() => setWatermarkText('تقرير معتمد رسمياً')}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '10.5px' }}
                        >
                          تقرير معتمد رسمياً
                        </button>
                        <button
                          type="button"
                          onClick={() => setWatermarkText('')}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '10.5px', color: '#ef4444' }}
                          title="مسح النص"
                        >
                          <Trash2 size={11} /> مسح
                        </button>
                      </div>
                    </div>

                    {/* Sliders: Opacity, Angle, Size */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      
                      {/* Opacity */}
                      <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>الشفافية والتعتيم:</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                            {Math.round(watermarkOpacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.02}
                          max={0.35}
                          step={0.01}
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>نسبة منخفضة لعدم حجب القراءة</span>
                      </div>

                      {/* Size */}
                      <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>حجم خط العلامة:</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                            {watermarkSize} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={22}
                          max={72}
                          value={watermarkSize}
                          onChange={(e) => setWatermarkSize(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>عرض النص المائي في الصفحة</span>
                      </div>

                      {/* Angle */}
                      <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>زاوية الميلان:</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                            {watermarkAngle}°
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[
                            { deg: 0, label: 'أفقي 0°' },
                            { deg: -30, label: 'مائل -30°' },
                            { deg: -45, label: 'قطري -45°' },
                          ].map((a) => (
                            <button
                              key={a.deg}
                              type="button"
                              onClick={() => setWatermarkAngle(a.deg)}
                              style={{
                                flex: 1,
                                padding: '4px 2px',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: watermarkAngle === a.deg ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                                background: watermarkAngle === a.deg ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                                color: watermarkAngle === a.deg ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 1: DESIGNER & TEMPLATES */}
          {activeTab === 'DESIGNER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Template Selection */}
              <div>
                <label className="input-label" style={{ color: 'var(--accent-cyan)', fontWeight: 900, fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layout size={15} />
                  <span>اختر القالب السريري المعتمد لتقارير A4:</span>
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
                        <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {tpl.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary Color Palette */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
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

              {/* QR Code Validation Options */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <QrCode size={14} color="var(--accent-cyan)" />
                  <span>إعدادات رمز الاستجابة السريعة للتحقق (Verification QR Code):</span>
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#0d131f', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="checkbox"
                      checked={enableQrCode}
                      onChange={(e) => setEnableQrCode(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                      تفعيل رمز الـ QR للتحقق الإلكتروني
                    </span>
                  </label>

                  <div>
                    <select
                      className="input-control"
                      value={qrCodePosition}
                      onChange={(e) => setQrCodePosition(e.target.value as any)}
                      disabled={!enableQrCode}
                      style={{ height: '38px', fontSize: '12px' }}
                    >
                      <option value="HEADER">موضع الـ QR: أعلى التقرير (Header)</option>
                      <option value="FOOTER">موضع الـ QR: أسفل التقرير (Footer)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Accreditation Badge */}
              <div>
                <label className="input-label">شارة الاعتماد والجودة (Accreditation Badge)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. ISO 15189 Accredited Laboratory"
                  value={accreditationBadge}
                  onChange={(e) => setAccreditationBadge(e.target.value)}
                />
              </div>

              {/* Legal Footer Note */}
              <div>
                <label className="input-label">الملاحظة القانونية في ذيل التقرير (Footer Notice)</label>
                <textarea
                  rows={2}
                  className="textarea-control"
                  value={reportFooter}
                  onChange={(e) => setReportFooter(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: MARGINS & LETTERHEAD */}
          {activeTab === 'MARGINS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Header Mode */}
              <div>
                <label className="input-label" style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '13px', marginBottom: '8px', display: 'block' }}>
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
                      background: headerMode === 'DIGITAL' ? 'rgba(6, 182, 212, 0.1)' : '#0d131f',
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
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                      background: headerMode === 'PREPRINTED' ? 'rgba(245, 158, 11, 0.1)' : '#0d131f',
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
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      إخفاء الترويسة الرقمية وترك مسافة فراغ علوية للطباعة على أوراق المختبر المطبوعة بالمطبعة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Millimeter Margins Calibration */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <label className="input-label" style={{ color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={15} />
                  <span>معايرة هوامش الصفحة بدقة المليمتر (Millimeter Margins Calibration):</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش العلوي (Top Margin)</label>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{topMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={topMarginMm}
                      onChange={(e) => setTopMarginMm(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {headerMode === 'PREPRINTED' ? 'يُوصى بـ 30-40mm لترك فراغ الترويسة' : 'يُوصى بـ 10-15mm للترويسة الرقمية'}
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش السفلي (Bottom Margin)</label>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{bottomMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={bottomMarginMm}
                      onChange={(e) => setBottomMarginMm(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      المسافة المتروكة لذيل الصفحة والختم الرسمي
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش الأيمن (Right Margin)</label>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{rightMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={35}
                      value={rightMarginMm}
                      onChange={(e) => setRightMarginMm(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ background: 'var(--bg-input-deep)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="input-label" style={{ margin: 0 }}>الهامش الأيسر (Left Margin)</label>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{leftMarginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={35}
                      value={leftMarginMm}
                      onChange={(e) => setLeftMarginMm(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: IDENTITY & DOCTOR */}
          {activeTab === 'IDENTITY' && (
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
                  />
                </div>

                <div>
                  <label className="input-label">الوصف الفرعي (Subtitle)</label>
                  <input
                    type="text"
                    className="input-control"
                    value={labSubtitle}
                    onChange={(e) => setLabSubtitle(e.target.value)}
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
                  />
                </div>

                <div>
                  <label className="input-label">رقم إجازة الفتح / الترخيص (MOH License)</label>
                  <input
                    type="text"
                    className="input-control"
                    value={labLicense}
                    onChange={(e) => setLabLicense(e.target.value)}
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
                  />
                </div>

                <div>
                  <label className="input-label">واتساب إرسال النتائج</label>
                  <input
                    type="text"
                    className="input-control"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">رمز العملة</label>
                  <input
                    type="text"
                    className="input-control"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">العنوان الجغرافي للمختبر</label>
                <input
                  type="text"
                  className="input-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
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

        {/* Real-Time Live A4 Preview Card */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} color="var(--accent-cyan)" />
              <span>معاينة حية ومطابقة للطباعة (Live A4 Preview):</span>
            </span>

            <span style={{ fontSize: '10px', background: primaryColor, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              {reportTemplate} | {headerMode}
            </span>
          </div>

          <div
            className="glass-card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: showReportBorder ? `2px solid ${primaryColor}` : '1px solid #e2e8f0',
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
              <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'collapse', marginBottom: '12px' }}>
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
