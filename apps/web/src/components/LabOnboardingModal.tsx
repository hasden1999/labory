'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLab } from './LabContext';
import { useToast } from './Toast';
import { Building2, Sparkles, CheckCircle2, Layout, Phone, MapPin, UserCheck, Printer, ShieldCheck, FileText, X, ArrowLeft, TestTube, Zap } from 'lucide-react';

export default function LabOnboardingModal() {
  const { labProfile, updateLabProfile, showSetupModal, setShowSetupModal, dismissSetupWizard } = useLab();
  const toast = useToast();

  const [labName, setLabName] = useState('');
  const [labSubtitle, setLabSubtitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorTitle, setDoctorTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('د.ع');
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED' | 'PREPRINTED' | 'BLANK_WHITE'>('CLASSIC');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labProfile) {
      setLabName(labProfile.labName || '');
      setLabSubtitle(labProfile.labSubtitle || '');
      setDoctorName(labProfile.doctorName || '');
      setDoctorTitle(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة السريرية');
      setPhone(labProfile.phone || '');
      setWhatsappNumber(labProfile.whatsappNumber || '');
      setAddress(labProfile.address || '');
      setCurrency(labProfile.currency || 'د.ع');
      setReportTemplate(labProfile.reportTemplate || 'CLASSIC');
    }
  }, [labProfile, showSetupModal]);

  const pathname = usePathname();
  if (!showSetupModal || pathname?.startsWith('/verify')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim()) {
      toast.warning('يرجى إدخال اسم المختبر الرسمي', 'حقل إلزامي');
      return;
    }
    if (!doctorName.trim()) {
      toast.warning('يرجى إدخال اسم الطبيب أو المدير المسؤول', 'حقل إلزامي');
      return;
    }
    if (!phone.trim()) {
      toast.warning('يرجى إدخال رقم هاتف المختبر', 'حقل إلزامي');
      return;
    }
    if (!address.trim()) {
      toast.warning('يرجى إدخال عنوان المختبر والمحافظة', 'حقل إلزامي');
      return;
    }

    setSaving(true);
    try {
      await updateLabProfile({
        labName: labName.trim(),
        labSubtitle: labSubtitle.trim() || 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني',
        doctorName: doctorName.trim(),
        doctorTitle: doctorTitle.trim() || 'استشاري التحليلات المرضية والمناعة السريرية',
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim() || phone.trim(),
        address: address.trim(),
        currency: currency.trim() || 'د.ع',
        reportTemplate,
        reportHeader: labName.trim(),
        isConfigured: true,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('lab_setup_completed', 'true');
      }
      setShowSetupModal(false);
      toast.success(`مرحباً بكم في (${labName.trim()})! تم حفظ هوية مختبرك بنجاح وجاهزية النظام للعمل.`, 'تمت التهيئة بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  const templates = [
    {
      id: 'CLASSIC',
      title: '🏛️ كلاسيكي أكاديمي (Classic)',
      desc: 'التصميم الطبي المعتمد دولياً مع إطار أزرق ملكي وجداول دقيقة ومفصلة للمستشفيات والمختبرات الكبرى.',
      badge: 'الأكثر استخداماً',
      color: '#0284c7',
      bgPreview: '#f0f9ff',
    },
    {
      id: 'MODERN',
      title: '⚡ عصري حديث (Modern Tech)',
      desc: 'ترويسة بتدرج فيروزي أنيق (Teal/Cyan Gradient) وبطاقات عصرية ورمز QR بارز للتحقق الرقمي.',
      badge: 'تصميم مبتكر',
      color: '#0d9488',
      bgPreview: '#f0fdfa',
    },
    {
      id: 'EXECUTIVE',
      title: '👑 مؤسسي فخم (Executive Luxury)',
      desc: 'ترويسة كحلية ملكية (Navy & Gold) مع علامة مائية أمنية وتوقيع رقمي موثق للتقارير المتقدمة.',
      badge: 'فخم وموثق',
      color: '#1e3a8a',
      bgPreview: '#f8fafc',
    },
    {
      id: 'COMPACT',
      title: '🌿 مدمج مقتصد (Compact Eco)',
      desc: 'مخصص للطباعة السريعة والموفرة للأحبار مع كثافة بيانات عالية لطباعة باقات متعددة في صفحة A4 واحدة.',
      badge: 'موفر للأحبار',
      color: '#334155',
      bgPreview: '#f8fafc',
    },
    {
      id: 'PREPRINTED',
      title: '📄 ورق مروّس مسبقاً (Pre-Printed)',
      desc: 'ورقة بيضاء تترك مسافة علوية (120px) لشعار واسم المختبر المطبوع مسبقاً في المطبعة، وتطبع فقط نتائج التحاليل بدقة.',
      badge: 'ورق جاهز',
      color: '#475569',
      bgPreview: '#ffffff',
    },
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, padding: '20px' }}>
      <div 
        className="modal-content" 
        dir="rtl"
        style={{ 
          maxWidth: '880px', 
          width: '100%', 
          maxHeight: '92vh', 
          overflowY: 'auto',
          borderRadius: '18px',
          border: '2px solid var(--accent-cyan)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          padding: '24px',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg, #06b6d4, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text-main)' }}>
                  تهيئة وتجهيز نظام المختبر الطبي للعمل
                </h2>
                <span style={{ fontSize: '11px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  إعداد إلزامي للمختبر
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                يرجى إدخال اسم وبيانات مختبرك الرسمي ليتم ضبط كافة التقارير الطبية، الفواتير، ورسائل الواتساب بهويتكم الخاصة
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => dismissSetupWizard()}
            className="toast-close"
            title="إغلاق وتخطي"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Lab Details */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} />
              1. هوية وبيانات المختبر الرئيسية:
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 800 }}>اسم المختبر الرسمي *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="مثال: مختبر بابل التخصصي للتحليلات المرضية"
                />
              </div>

              <div>
                <label className="input-label">الوصف الفرعي (شعار المختبر)</label>
                <input
                  type="text"
                  className="input-control"
                  value={labSubtitle}
                  onChange={(e) => setLabSubtitle(e.target.value)}
                  placeholder="مثال: دقة متناهية.. تشخيص موثوق ورعاية مستمرة"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 800 }}>اسم الطبيب أو المدير المسؤول *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="مثال: د. مصطفى العلي"
                />
              </div>

              <div>
                <label className="input-label">الصفة والاختصاص الطبي</label>
                <input
                  type="text"
                  className="input-control"
                  value={doctorTitle}
                  onChange={(e) => setDoctorTitle(e.target.value)}
                  placeholder="مثال: استشاري التحليلات المرضية والمناعة السريرية"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.4fr 0.6fr', gap: '10px' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 800 }}>رقم الهاتف الرسمي *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0770XXXXXXX"
                />
              </div>

              <div>
                <label className="input-label">واتساب إرسال النتائج</label>
                <input
                  type="text"
                  className="input-control"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="0770XXXXXXX"
                />
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 800 }}>العنوان والمحافظة *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المحافظة - المدينة - الشارع العام"
                />
              </div>

              <div>
                <label className="input-label">العملة</label>
                <input
                  type="text"
                  className="input-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="د.ع"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Template Selection */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layout size={16} />
                2. اختر قالب وتصميم تقارير النتائج المعتمد لمختبرك:
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                يمكنك تغييره لاحقاً من صفحة الإعدادات
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {templates.map((tpl) => {
                const isSelected = reportTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setReportTemplate(tpl.id as any)}
                    style={{
                      border: isSelected ? `2px solid ${tpl.color}` : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 0 3px ${tpl.color}25` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: isSelected ? tpl.color : 'var(--text-main)' }}>
                        {tpl.title}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 size={16} color={tpl.color} />
                      ) : (
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
                      )}
                    </div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                      {tpl.desc}
                    </p>
                    <span style={{ fontSize: '9.5px', background: `${tpl.color}15`, color: tpl.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      {tpl.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Preview Mini-Card */}
          <div style={{ background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, display: 'inline-block', marginBottom: '8px' }}>
              معاينة حية لترويسة تقرير مختبرك
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '8px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#0369a1' }}>
                  <TestTube size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                  {labName || 'اسم مختبرك الطبي'}
                </h4>
                <p style={{ fontSize: '11px', color: '#64748b' }}>{labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة'}</p>
                <p style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                  العنوان: {address || 'عنوان المختبر'} | هاتف: {phone || 'رقم الهاتف'}
                </p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{doctorName || 'اسم الطبيب المسؤول'}</h5>
                <p style={{ fontSize: '10px', color: '#64748b' }}>{doctorTitle}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => dismissSetupWizard()}
              className="btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              المتابعة لاحقاً وتخطي هذه الخطوة
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{
                padding: '12px 32px',
                fontSize: '14.5px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(6,182,212,0.35)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                borderRadius: '10px',
              }}
            >
              <Sparkles size={18} />
              <span>{saving ? 'جاري الحفظ والتهيئة...' : 'حفظ بيانات المختبر وبدء العمل بنسختك'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
