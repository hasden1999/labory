'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { Settings as SettingsIcon, Save, Sparkles, Printer, CheckCircle2, Award, Phone, DollarSign, Building2, Layout, FileText, Maximize2, QrCode, Sliders, Palette, Eye, ShieldCheck, Check, TestTube, Zap } from 'lucide-react';

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

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'DESIGNER' | 'MARGINS'>('DESIGNER');

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
      };

      await updateLabProfile(payload as any);
      toast.success('تم حفظ إعدادات وهوية المختبر ومصمم التقارير بنجاح!', 'حفظ التكوين');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
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
                  <div style={{ background: '#090d15', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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

                  <div style={{ background: '#090d15', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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

                  <div style={{ background: '#090d15', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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

                  <div style={{ background: '#090d15', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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
    </AppShell>
  );
}
