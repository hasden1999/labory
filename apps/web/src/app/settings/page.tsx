'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { Settings as SettingsIcon, Save, Sparkles, Printer, CheckCircle2, Award, Phone, DollarSign, Building2, Layout, FileText, Maximize2, QrCode, Sliders, Palette, Eye, ShieldCheck, Check, TestTube, Zap, Database, Download, Upload, RefreshCw, HardDrive, AlertCircle, History, Share2, ExternalLink, Plus } from 'lucide-react';

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

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'DESIGNER' | 'MARGINS' | 'BACKUP' | 'NETWORK'>('DESIGNER');

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
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', paddingBottom: '4px' }}>
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
            gap: '6px'
          }}
        >
          <Sparkles size={14} />
          <span>🎨 تصميم وقالب التقرير (5 القوالب)</span>
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
            gap: '6px'
          }}
        >
          <Sliders size={14} />
          <span>📄 الورق المروّس والهوامش (Letterhead & Margins)</span>
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
            gap: '6px'
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
            gap: '6px'
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
            gap: '6px'
          }}
        >
          <Share2 size={14} />
          <span>🌐 الربط الشبكي وبوابة المرضى (Network & Web)</span>
        </button>
      </div>

      {/* Main Grid: Designer Form (Left) & Real-Time A4 Live Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* Designer Controls */}
        <div className="glass-card" style={{ padding: '20px' }}>
          
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
                              {new Date(b.createdAt).toLocaleString('ar-IQ')}
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
              border: `2px solid ${primaryColor}`,
              padding: `${topMarginMm * 1.5}px ${leftMarginMm * 1.5}px ${bottomMarginMm * 1.5}px ${rightMarginMm * 1.5}px`,
              borderRadius: '8px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              direction: 'ltr',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {/* Top Space or Digital Header */}
            <div>
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
              ) : reportTemplate === 'MODERN' ? (
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
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}><TestTube size={14} /> {labName}</h3>
                    <p style={{ fontSize: '10px', opacity: 0.9 }}>{labSubtitle}</p>
                    <p style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>العنوان: {address} | هاتف: {phone}</p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {enableQrCode && qrCodePosition === 'HEADER' && (
                      <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                        <QrCode size={30} />
                      </div>
                    )}
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '6px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{doctorName}</h4>
                      <p style={{ fontSize: '9px', opacity: 0.9 }}>{doctorTitle}</p>
                    </div>
                  </div>
                </div>
              ) : reportTemplate === 'EXECUTIVE' ? (
                <div style={{ borderBottom: `3px double ${primaryColor}`, paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '9px', background: primaryColor, color: '#fff', padding: '1px 6px', borderRadius: '2px', fontWeight: 800 }}>OFFICIAL MEDICAL REPORT</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>🏛️ {labName}</h3>
                    <p style={{ fontSize: '10px', color: '#64748b' }}>{labSubtitle}</p>
                    <p style={{ fontSize: '9px', color: '#475569' }}>العنوان: {address} | هاتف: {phone}</p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {enableQrCode && qrCodePosition === 'HEADER' && (
                      <div style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QrCode size={28} color={primaryColor} />
                      </div>
                    )}
                    <div style={{ border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', background: '#f8fafc' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>{doctorName}</h4>
                      <p style={{ fontSize: '9px', color: '#64748b' }}>{doctorTitle}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ borderBottom: `2px solid ${primaryColor}`, paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: primaryColor }}><TestTube size={14} /> {labName}</h3>
                    <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{labSubtitle}</p>
                    <p style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>العنوان: {address} | هاتف: {phone}</p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {enableQrCode && qrCodePosition === 'HEADER' && (
                      <div style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QrCode size={28} color={primaryColor} />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>{doctorName}</h4>
                      <p style={{ fontSize: '9px', color: '#64748b' }}>{doctorTitle}</p>
                      <p style={{ fontSize: '8.5px', color: primaryColor }}>License: {labLicense}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Bar */}
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '9px', color: '#64748b' }}>
                <div style={{ textAlign: 'left' }}>
                  <p>{reportFooter}</p>
                  {accreditationBadge && (
                    <span style={{ fontWeight: 800, color: primaryColor, display: 'inline-block', marginTop: '2px' }}>
                      🛡️ {accreditationBadge}
                    </span>
                  )}
                </div>

                {enableQrCode && qrCodePosition === 'FOOTER' && (
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '8px' }}>Scan to verify:</span>
                    <QrCode size={30} color={primaryColor} />
                  </div>
                )}
              </div>
            </div>

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
