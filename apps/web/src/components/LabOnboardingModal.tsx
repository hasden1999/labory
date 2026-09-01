'use client';

import React, { useState } from 'react';
import { useLab } from './LabContext';
import { useToast } from './Toast';
import { 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Layout, 
  Phone, 
  MapPin, 
  UserCheck, 
  Printer, 
  ShieldCheck,
  FileText,
  X,
  ArrowLeft
} from 'lucide-react';

export default function LabOnboardingModal() {
  const { labProfile, updateLabProfile, showSetupModal, setShowSetupModal } = useLab();
  const toast = useToast();

  const [labName, setLabName] = useState(labProfile.labName || 'مختبر الأمل الطبي التخصصي');
  const [labSubtitle, setLabSubtitle] = useState(labProfile.labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني');
  const [doctorName, setDoctorName] = useState(labProfile.doctorName || 'د. أحمد الرضا');
  const [doctorTitle, setDoctorTitle] = useState(labProfile.doctorTitle || 'استشاري التحليلات المرضية والمناعة');
  const [phone, setPhone] = useState(labProfile.phone || '07701234567');
  const [whatsappNumber, setWhatsappNumber] = useState(labProfile.whatsappNumber || '07701234567');
  const [address, setAddress] = useState(labProfile.address || 'بغداد - شارع الأطباء');
  const [currency, setCurrency] = useState(labProfile.currency || 'د.ع');
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED' | 'PREPRINTED' | 'BLANK_WHITE'>(
    labProfile.reportTemplate || 'CLASSIC'
  );
  const [saving, setSaving] = useState(false);

  if (!showSetupModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLabProfile({
        labName,
        labSubtitle,
        doctorName,
        doctorTitle,
        phone,
        whatsappNumber,
        address,
        currency,
        reportTemplate,
        reportHeader: labName,
      });

      setShowSetupModal(false);
      toast.success('مرحباً بك! تم حفظ هوية وإعدادات مختبرك بنجاح وبدء النسخة الخاصة بك.', 'تهيئة المختبر');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleUseDefault = async () => {
    setSaving(true);
    try {
      await updateLabProfile({
        isConfigured: true,
      });
      setShowSetupModal(false);
      toast.info('تم بدء العمل بالإعدادات الافتراضية. يمكنك تخصيصها لاحقاً من صفحة الإعدادات.', 'الإعدادات الافتراضية');
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
      title: '💎 مؤسسي فخم (Executive Luxury)',
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
    <div className="modal-overlay" style={{ zIndex: 9999, padding: '20px' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '900px', 
          width: '100%', 
          maxHeight: '92vh', 
          overflowY: 'auto',
          borderRadius: '16px',
          border: '2px solid var(--accent-cyan)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
          padding: '24px',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
                  تهيئة نسختك السحابية للمختبر
                </h2>
                <span style={{ fontSize: '11px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  تخصيص فوري
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                قم بإدخال اسم وبيانات مختبرك واختيار قالب التقارير المفضل لديك ليتم تطبيقها تلقائياً وحفظها دائماً
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setShowSetupModal(false)}
            className="toast-close"
            title="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Lab Details */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} />
              1. هوية وبيانات المختبر:
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div>
                <label className="input-label">اسم المختبر الرسمي *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="مثال: مختبر النقاء التخصصي للتحليلات المرضية"
                />
              </div>

              <div>
                <label className="input-label">الوصف الفرعي (شعار المختبر)</label>
                <input
                  type="text"
                  className="input-control"
                  value={labSubtitle}
                  onChange={(e) => setLabSubtitle(e.target.value)}
                  placeholder="مثال: دقة في النتائج.. رعاية تثق بها"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div>
                <label className="input-label">اسم الطبيب أو المدير المسؤول *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="مثال: د. سارة العبيدي"
                />
              </div>

              <div>
                <label className="input-label">الصفة والاختصاص الطبي</label>
                <input
                  type="text"
                  className="input-control"
                  value={doctorTitle}
                  onChange={(e) => setDoctorTitle(e.target.value)}
                  placeholder="مثال: استشاري التحليلات المرضية والمناعة"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.8fr', gap: '10px' }}>
              <div>
                <label className="input-label">رقم الهاتف الرسمي *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07701234567"
                />
              </div>

              <div>
                <label className="input-label">واتساب إرسال التقارير</label>
                <input
                  type="text"
                  className="input-control"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="07701234567"
                />
              </div>

              <div>
                <label className="input-label">العنوان والمحافظة</label>
                <input
                  type="text"
                  className="input-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="بغداد - شارع الأطباء"
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
                2. اختر تصميم وقالب تقرير النتائج المعتمد لمختبرك (4 قوالب جاهزة):
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                يمكنك التبديل بينها في أي وقت لاحقاً
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
                      padding: '14px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 0 3px ${tpl.color}25` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? tpl.color : 'var(--text-main)' }}>
                        {tpl.title}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 size={18} color={tpl.color} />
                      ) : (
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '10px' }}>
                      {tpl.desc}
                    </p>
                    <span style={{ fontSize: '10px', background: `${tpl.color}15`, color: tpl.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
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
              معاينة حية فورية لترويسة تقرير مختبرك
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '8px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#0369a1' }}>🧪 {labName}</h4>
                <p style={{ fontSize: '11px', color: '#64748b' }}>{labSubtitle}</p>
                <p style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>📍 {address} | 📞 {phone}</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{doctorName}</h5>
                <p style={{ fontSize: '10px', color: '#64748b' }}>{doctorTitle}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleUseDefault}
              disabled={saving}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              استخدام البيانات الافتراضية
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(6,182,212,0.3)' }}
            >
              <Sparkles size={18} />
              <span>{saving ? 'جاري الحفظ والتطبيق...' : 'حفظ وبدء العمل بنسخة المختبر 🚀'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
