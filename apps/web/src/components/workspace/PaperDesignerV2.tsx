'use client';

import React, { useState, useRef } from 'react';
import { useLab } from '../LabContext';
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
  X
} from 'lucide-react';
import { toEnglishDigits, formatEnglishDate } from '../../lib/formatters';

export default function PaperDesignerV2() {
  const toast = useToast();
  const { labProfile, updateLabProfile } = useLab();

  // 1. Core Profile States
  const [labName, setLabName] = useState(labProfile.labName || 'مختبر الرضا التخصصي للتحليلات المرضية');
  const [doctorName, setDoctorName] = useState(labProfile.doctorName || 'د. علي حسين الخفاجي');
  const [doctorTitle, setDoctorTitle] = useState(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية');
  const [phone, setPhone] = useState(labProfile.phone || '07701234567');
  const [currency, setCurrency] = useState(labProfile.currency || 'د.ع');
  const [reportFooter, setReportFooter] = useState(
    labProfile.reportFooter || 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).'
  );

  // 2. All 6 Master Clinical Presets
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED' | 'BLACK_WHITE'>(
    ['CLASSIC', 'MODERN', 'EXECUTIVE', 'COMPACT', 'SPECIALIZED', 'BLACK_WHITE'].includes(labProfile.reportTemplate as any)
      ? (labProfile.reportTemplate as any)
      : 'CLASSIC'
  );

  // 3. Paper Mode: Pre-printed vs Digital
  const [headerMode, setHeaderMode] = useState<'DIGITAL' | 'PREPRINTED'>(
    (labProfile.headerMode as any) || 'DIGITAL'
  );

  // 4. Accent Color & Logo
  const [primaryColor, setPrimaryColor] = useState<string>(labProfile.primaryColor || '#0891b2');
  const [logoUrl, setLogoUrl] = useState<string>(labProfile.logoUrl || '');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  // Presets Definition (All 6 Templates)
  const PRESETS = [
    {
      id: 'CLASSIC',
      title: 'القالب الملكي الكلاسيكي (Royal Classic)',
      subtitle: 'إطار رسمي فاخر وهوية تقليدية معتمدة للمختبرات والمستشفيات الكبرى',
      badge: 'الأكثر طلباً',
      color: '#0891b2',
      font: 'Cairo',
    },
    {
      id: 'MODERN',
      title: 'القالب الطبي العصري (Modern Clinical)',
      subtitle: 'ترويسة بتدرج فيروزي انسيابي وشارات نتائج ملونة تضفي طابعاً تقنياً متطوراً',
      badge: 'عصري فائق النقاء',
      color: '#059669',
      font: 'Tajawal',
    },
    {
      id: 'EXECUTIVE',
      title: 'القالب المؤسسي الفاخر (Executive Luxury)',
      subtitle: 'تصميم ملكي كحلي مع إطارات ذهبية راقية مخصصة للمختبرات الاستشارية والمركزية',
      badge: 'ملكي فاخر',
      color: '#b45309',
      font: 'Tajawal',
    },
    {
      id: 'COMPACT',
      title: 'القالب ثنائي الأعمدة المقتصد (Compact Dual-Column)',
      subtitle: 'يوزع الفحوصات بكثافة بيانات مدروسة لاستيعاب الفحوصات الشاملة في صفحة واحدة',
      badge: 'يوفر الورق والحبر',
      color: '#2563eb',
      font: 'Tajawal',
    },
    {
      id: 'SPECIALIZED',
      title: 'القالب التخصصي المتقدم (Specialized Multi-Part)',
      subtitle: 'تقسيم كتل سريرية محددة بلون فيروزي داكن للتحاليل الكبرى والزراعة الجرثومية',
      badge: 'مراكز تخصصية',
      color: '#0d9488',
      font: 'Tajawal',
    },
    {
      id: 'BLACK_WHITE',
      title: 'القالب الاقتصادي الليزري (Monochrome Laser)',
      subtitle: 'مخصص لطابعات الليزر أبيض وأسود، يعتمد تباين عالي ومؤشرات واضحة للقيم الشاذة',
      badge: 'طابعات الليزر العادية',
      color: '#0f172a',
      font: 'Inter',
    },
  ];

  // Camera & File Logo Handlers
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

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('تمت إزالة الشعار.', 'إزالة');
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      // Auto-set margins based on headerMode
      const topMargin = headerMode === 'PREPRINTED' ? 35 : 15;
      const bottomMargin = headerMode === 'PREPRINTED' ? 25 : 15;

      const payload = {
        labName,
        doctorName,
        doctorTitle,
        phone,
        currency,
        reportFooter,
        reportTemplate,
        headerMode,
        topMarginMm: topMargin,
        bottomMarginMm: bottomMargin,
        primaryColor,
        logoUrl: logoUrl || '',
        showLabName: headerMode === 'DIGITAL',
        showContactInfo: headerMode === 'DIGITAL',
        showDoctorInfo: true,
        showPatientBox: true,
        showReportBorder: reportTemplate !== 'MODERN',
        showFooter: headerMode === 'DIGITAL',
        enableQrCode: true,
      };

      await updateLabProfile(payload as any);
      await apiRequest('/settings', 'PUT', payload);
      toast.success('تم حفظ إعدادات وقالب التقرير الطبي بنجاح!', 'تم الحفظ');
    } catch (err: any) {
      toast.error(err?.message || 'فشل حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Dummy Sample Data for Live Preview
  const previewTests = [
    { name: 'Fasting Blood Sugar (FBS)', result: '142', unit: 'mg/dL', range: '70 - 110', status: 'HIGH', flag: '▲' },
    { name: 'HbA1c (Glycated Hemoglobin)', result: '7.8', unit: '%', range: '4.5 - 6.0', status: 'HIGH', flag: '▲' },
    { name: 'Urea (Blood)', result: '32', unit: 'mg/dL', range: '15 - 45', status: 'NORMAL', flag: '✓' },
    { name: 'Serum Creatinine', result: '0.9', unit: 'mg/dL', range: '0.6 - 1.2', status: 'NORMAL', flag: '✓' },
    { name: 'Total Cholesterol', result: '215', unit: 'mg/dL', range: '130 - 200', status: 'HIGH', flag: '▲' },
    { name: 'Triglycerides', result: '140', unit: 'mg/dL', range: '50 - 150', status: 'NORMAL', flag: '✓' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '24px', alignItems: 'start' }} dir="rtl">
      {/* =========================================================================
          1. Left/Right: Curated Controls & Simplified Form Engine
          ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={22} color="#0891b2" />
              <span>محرر ورقة التحاليل الطبية المبسط</span>
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              اختر القالب الفاخر المعتمد لمختبرك، وتحكم بوضعية الورق المروّس بنقرة واحدة
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-cyan-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            <CheckCircle2 size={16} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التصميم والقالب'}</span>
          </button>
        </div>

        {/* -----------------------------------------------------------------------
            Section 1: The 4 Master Presets (Card Selector)
            ----------------------------------------------------------------------- */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#0891b2" />
            <span>١. اختر شكل وتصميم التقرير الطبي المعتمد:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {PRESETS.map((p) => {
              const isSelected = reportTemplate === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setReportTemplate(p.id as any)}
                  className={`paper-template-card ${isSelected ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: isSelected ? 'rgba(8, 145, 178, 0.2)' : 'var(--bg-input)',
                        color: isSelected ? '#0891b2' : 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {p.badge}
                    </span>
                    {isSelected && <CheckCircle2 size={18} color="#0891b2" />}
                  </div>

                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {p.title}
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                    {p.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            Section 2: Paper Mode Toggle (Pre-Printed vs Digital)
            ----------------------------------------------------------------------- */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="#0891b2" />
            <span>٢. نوعية الورق المستخدم للطباعة في مختبرك:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Digital Header */}
            <div
              onClick={() => setHeaderMode('DIGITAL')}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: headerMode === 'DIGITAL' ? '2px solid #0891b2' : '1px solid var(--border-color)',
                background: headerMode === 'DIGITAL' ? 'rgba(8, 145, 178, 0.08)' : 'var(--bg-input)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>ورق أبيض عادي (طباعة الهوية بالكامل)</strong>
                {headerMode === 'DIGITAL' && <CheckCircle2 size={16} color="#0891b2" />}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                يقوم البرنامج بطباعة الترويسة والشعار واسم المختبر والفوتر رقمياً بالكامل على الورق الأبيض الفارغ.
              </p>
            </div>

            {/* Pre-printed Letterhead */}
            <div
              onClick={() => setHeaderMode('PREPRINTED')}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: headerMode === 'PREPRINTED' ? '2px solid #0891b2' : '1px solid var(--border-color)',
                background: headerMode === 'PREPRINTED' ? 'rgba(8, 145, 178, 0.08)' : 'var(--bg-input)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>ورق مروّس مسبقاً (جاهز من المطبعة)</strong>
                {headerMode === 'PREPRINTED' && <CheckCircle2 size={16} color="#0891b2" />}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                يترك هامشاً 35mm في الأعلى و 25mm في الأسفل تلقائياً، ويخفي الترويسة الرقمية لمنع التداخل مع ورق المطبعة.
              </p>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            Section 3: Core Lab Information (Essential metadata)
            ----------------------------------------------------------------------- */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#0891b2" />
            <span>٣. البيانات الرسمية والمهنية الظاهرة على التقرير:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">اسم المختبر الرسمي</label>
              <input
                type="text"
                className="input-control"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">هاتف واستفسارات المختبر</label>
              <input
                type="text"
                className="input-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">اسم الطبيب الاستشاري أو المدير</label>
              <input
                type="text"
                className="input-control"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">اللقب والشهادة الطبية</label>
              <input
                type="text"
                className="input-control"
                value={doctorTitle}
                onChange={(e) => setDoctorTitle(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="input-label">ملاحظة أسفل التقرير (التذييل الرسمي المعتمد)</label>
              <input
                type="text"
                className="input-control"
                value={reportFooter}
                onChange={(e) => setReportFooter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            Section 4: Official Lab Logo (File Picker & Live Camera Capture)
            ----------------------------------------------------------------------- */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon size={16} color="#0891b2" />
            <span>٤. شعار وهوية المختبر الرسمية (Lab Logo):</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            ارفع شعار المختبر (PNG، JPG، SVG) أو التقط صورة مباشرة بهوية المختبر عبر كاميرا التابلت أو الهاتف ليظهر في ترويسة التقارير المطبوعة وعلى كافة القوالب.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {/* Camera Capture Modal / Viewfinder */}
          {isCameraOpen && (
            <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1.5px solid #0891b2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} color="#0891b2" />
                  <span>معاينة الكاميرا المباشرة:</span>
                </span>
                <button type="button" onClick={stopCamera} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain', background: '#000' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn-cyan-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Camera size={15} />
                  <span>التقاط الشعار وتثبيته</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Current Logo Display or Upload Buttons */}
          {logoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', background: 'var(--bg-input)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '56px', height: '56px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px' }}>
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>تم حفظ الشعار بنجاح</strong>
                  <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <CheckCircle2 size={13} />
                    <span>جاهز للظهور التلقائي في كافة التقارير الطبية</span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={13} />
                  <span>استبدال</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ padding: '12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(8, 145, 178, 0.06)', border: '1px dashed #0891b2', color: '#0891b2' }}
              >
                <Upload size={16} />
                <span>رفع ملف صورة (PNG/JPG)</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="btn-secondary"
                style={{ padding: '12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(8, 145, 178, 0.06)', border: '1px dashed #0891b2', color: '#0891b2' }}
              >
                <Camera size={16} />
                <span>التقاط عبر الكاميرا</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. Right/Sticky: Real-Time A4 WYSIWYG Sheet Preview
          ========================================================================= */}
      <div
        className="custom-scrollbar"
        style={{
          position: 'sticky',
          top: '80px',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={15} color="#0891b2" />
            <span>معاينة حية ومطابقة للطباعة A4</span>
          </span>
          <span style={{ fontSize: '10px', background: 'rgba(8, 145, 178, 0.15)', color: '#0891b2', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            {reportTemplate} • {headerMode === 'PREPRINTED' ? 'ورق مروّس' : 'ورق أبيض'}
          </span>
        </div>

        {/* Simulated A4 Paper */}
        <div
          style={{
            width: '100%',
            minHeight: '740px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: reportTemplate === 'MODERN' ? '14px' : reportTemplate === 'SPECIALIZED' ? '10px' : reportTemplate === 'CLASSIC' ? '8px' : reportTemplate === 'EXECUTIVE' ? '4px' : '0px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            padding: headerMode === 'PREPRINTED' ? '40px 18px 25px 18px' : '18px',
            fontFamily: reportTemplate === 'MODERN' || reportTemplate === 'COMPACT' || reportTemplate === 'EXECUTIVE' || reportTemplate === 'SPECIALIZED' ? 'Tajawal, sans-serif' : reportTemplate === 'BLACK_WHITE' ? 'Inter, sans-serif' : 'Cairo, sans-serif',
            boxSizing: 'border-box',
            border: reportTemplate === 'EXECUTIVE'
              ? '1px solid #d97706'
              : reportTemplate === 'SPECIALIZED'
              ? '1.5px solid #0d9488'
              : reportTemplate === 'CLASSIC'
              ? '2px solid #0891b2'
              : reportTemplate === 'BLACK_WHITE'
              ? '2px solid #000'
              : '1px solid #38bdf8',
            borderTop: reportTemplate === 'EXECUTIVE' ? '5px solid #b45309' : undefined,
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header Area (Hidden if Pre-printed) */}
          {headerMode === 'DIGITAL' ? (
            reportTemplate === 'MODERN' ? (
              /* MODERN GRADIENT BANNER HEADER */
              <div
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #06b6d4 100%)`,
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {(logoUrl || labProfile.logoUrl) ? (
                    <img
                      src={logoUrl || labProfile.logoUrl}
                      alt="Logo"
                      style={{
                        height: '36px',
                        maxWidth: '55px',
                        objectFit: 'contain',
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '2px 4px',
                        borderRadius: '6px',
                      }}
                    />
                  ) : null}
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                      {labName}
                    </h3>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.95)' }}>
                      {doctorName} — {doctorTitle}
                    </span>
                    <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                      هاتف: {phone} • معتمد رسمياً
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px',
                    }}
                  >
                    <QrCode size={22} color="#0f172a" />
                  </div>
                  <span style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.9)', display: 'block', marginTop: '2px', fontWeight: 800 }}>VERIFY</span>
                </div>
              </div>
            ) : (
              /* NON-MODERN CLEAN HEADER WITH LOGO */
              <div
                style={{
                  borderBottom: reportTemplate === 'EXECUTIVE'
                    ? '2px solid #b45309'
                    : reportTemplate === 'SPECIALIZED'
                    ? '3px solid #0d9488'
                    : reportTemplate === 'COMPACT'
                    ? '2px solid #475569'
                    : reportTemplate === 'BLACK_WHITE'
                    ? '2px solid #000'
                    : '2px solid #0891b2',
                  paddingBottom: '12px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(logoUrl || labProfile.logoUrl) && (
                      <img
                        src={logoUrl || labProfile.logoUrl}
                        alt="Logo"
                        style={{ height: '34px', maxWidth: '52px', objectFit: 'contain' }}
                      />
                    )}
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 900,
                        color: reportTemplate === 'EXECUTIVE'
                          ? '#b45309'
                          : reportTemplate === 'SPECIALIZED'
                          ? '#0d9488'
                          : reportTemplate === 'BLACK_WHITE'
                          ? '#000'
                          : '#0891b2',
                        margin: 0,
                      }}
                    >
                      {labName}
                    </h3>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                    {doctorName} — {doctorTitle}
                  </span>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    هاتف: {phone} • معتمد رسمياً
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                    }}
                  >
                    <QrCode size={24} color="#0f172a" />
                  </div>
                  <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>التحقق الطبي</span>
                </div>
              </div>
            )
          ) : (
            <div
              style={{
                height: '35px',
                border: '1px dashed #cbd5e1',
                borderRadius: '4px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#94a3b8',
                background: '#f8fafc',
              }}
            >
              [مساحة ترويسة الورق المروّس مسبقاً من المطبعة]
            </div>
          )}

          {/* Patient Details Ribbon */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '10.5px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              marginBottom: '14px',
            }}
          >
            <div><strong>المريض:</strong> حيدر كاظم محمد</div>
            <div><strong>العمر/الجنس:</strong> 42 سنة (ذكر)</div>
            <div><strong>رقم العينة:</strong> #1042</div>
            <div><strong>الطبيب:</strong> د. أحمد عبد الرضا</div>
            <div><strong>التاريخ:</strong> {formatEnglishDate(new Date())}</div>
            <div><strong>الحالة:</strong> معتمد نهائياً</div>
          </div>

          {/* Test Results Table (Preview) */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: reportTemplate === 'EXECUTIVE'
                  ? '#b45309'
                  : reportTemplate === 'SPECIALIZED'
                  ? '#0d9488'
                  : reportTemplate === 'BLACK_WHITE'
                  ? '#000'
                  : '#0891b2',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '4px',
                marginBottom: '6px',
              }}
            >
              فحوصات كيمياء الدم والسكري (Clinical Chemistry)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'right' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #94a3b8',
                    color: reportTemplate === 'BLACK_WHITE' ? '#ffffff' : '#ffffff',
                    fontWeight: 800,
                    background: reportTemplate === 'MODERN'
                      ? 'linear-gradient(90deg, #0284c7, #0ea5e9)'
                      : reportTemplate === 'EXECUTIVE'
                      ? '#78350f'
                      : reportTemplate === 'SPECIALIZED'
                      ? '#0f766e'
                      : reportTemplate === 'COMPACT'
                      ? '#334155'
                      : reportTemplate === 'BLACK_WHITE'
                      ? '#000000'
                      : '#0891b2',
                  }}
                >
                  <th style={{ padding: '5px 4px' }}>فحص التحليل</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center' }}>النتيجة</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center' }}>الوحدة</th>
                  <th style={{ padding: '5px 4px' }}>المعدل الطبيعي</th>
                  <th style={{ padding: '5px 4px', textAlign: 'center' }}>المؤشر</th>
                </tr>
              </thead>
              <tbody>
                {previewTests.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '4px 2px', fontWeight: 700 }}>{t.name}</td>
                    <td
                      style={{
                        padding: '4px 2px',
                        textAlign: 'center',
                        fontWeight: 900,
                        fontFamily: 'JetBrains Mono',
                        color: t.status === 'HIGH' && reportTemplate !== 'BLACK_WHITE' ? '#dc2626' : '#0f172a',
                      }}
                    >
                      {t.result}
                    </td>
                    <td style={{ padding: '4px 2px', textAlign: 'center', color: '#64748b' }}>{t.unit}</td>
                    <td style={{ padding: '4px 2px', color: '#64748b', direction: 'ltr', textAlign: 'right' }}>{t.range}</td>
                    <td style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 900 }}>
                      {t.status === 'HIGH' ? (
                        <span style={{ color: reportTemplate === 'BLACK_WHITE' ? '#000' : '#dc2626' }}>
                          {reportTemplate === 'BLACK_WHITE' ? '[▲ HIGH]' : '▲ مرتفع'}
                        </span>
                      ) : (
                        <span style={{ color: '#10b981' }}>✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          {/* Footer Ribbon (Pinned to bottom of A4) */}
          <div
            style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '10px',
              marginTop: 'auto',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '9px',
              color: '#64748b',
            }}
          >
            <span>{reportFooter || 'تم فحص وتدقيق التقرير إلكترونياً وهو معتمد رسمياً.'}</span>
            <div style={{ textAlign: 'left', direction: 'ltr', fontWeight: 700, color: '#0f172a' }}>
              <div>Approved by Clinical Pathologist</div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>Clinically Validated &amp; Approved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
