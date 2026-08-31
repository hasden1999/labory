'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  Award, 
  Phone, 
  DollarSign, 
  Building2,
  Layout,
  FileText
} from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();
  const { labProfile, updateLabProfile } = useLab();

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
  const [reportTemplate, setReportTemplate] = useState<'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'PREPRINTED' | 'BLANK_WHITE'>(
    labProfile.reportTemplate || 'CLASSIC'
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labProfile) {
      setLabName(labProfile.labName);
      setLabSubtitle(labProfile.labSubtitle);
      setDoctorName(labProfile.doctorName);
      setDoctorTitle(labProfile.doctorTitle);
      setLabLicense(labProfile.labLicense);
      setWhatsappNumber(labProfile.whatsappNumber);
      setCurrency(labProfile.currency);
      setAddress(labProfile.address);
      setPhone(labProfile.phone);
      setReportHeader(labProfile.reportHeader);
      setReportFooter(labProfile.reportFooter);
      setReportTemplate(labProfile.reportTemplate || 'CLASSIC');
    }
  }, [labProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLabProfile({
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
        reportTemplate,
      });
      toast.success('تم حفظ إعدادات وهوية المختبر وقالب التقارير بنجاح وتطبيقها فوراً!', 'حفظ الإعدادات');
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ الإعدادات', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  const templates = [
    {
      id: 'BLANK_WHITE',
      title: '📄 ورقة بيضاء (Blank White Letterhead)',
      desc: 'ورقة بيضاء نقية تماماً بدون أي ترويسة رقمية، تترك مسافة علوية (135px) للورق المطبوع مسبقاً في المطبعة وتطبع جدول النتائج بدقة متناهية.',
      color: '#0f172a',
      bgPreview: '#ffffff',
    },
    {
      id: 'CLASSIC',
      title: '🏛️ كلاسيكي أكاديمي (Classic)',
      desc: 'التصميم الطبي المعتمد دولياً مع ترويسة زرقاء ملكية وجدول فحوصات تقليدي معتمد للمستشفيات.',
      color: '#0284c7',
      bgPreview: '#f0f9ff',
    },
    {
      id: 'MODERN',
      title: '⚡ عصري حديث (Modern Tech)',
      desc: 'ترويسة بتدرج فيروزي أنيق (Teal/Cyan Gradient) وبطاقات عصرية ورمز QR بارز للتحقق الرقمي.',
      color: '#0d9488',
      bgPreview: '#f0fdfa',
    },
    {
      id: 'EXECUTIVE',
      title: '💎 مؤسسي فخم (Executive Luxury)',
      desc: 'ترويسة كحلية ملكية (Navy & Gold) مع علامة مائية أمنية وتوقيع رقمي موثق للتقارير المتقدمة.',
      color: '#1e3a8a',
      bgPreview: '#f8fafc',
    },
    {
      id: 'COMPACT',
      title: '🌿 مدمج مقتصد (Compact Eco)',
      desc: 'مخصص للطباعة السريعة والموفرة للأحبار مع كثافة بيانات عالية لطباعة باقات متعددة في صفحة واحدة.',
      color: '#334155',
      bgPreview: '#f8fafc',
    },
    {
      id: 'PREPRINTED',
      title: '📄 ورق مروّس مسبقاً (Pre-Printed)',
      desc: 'ورقة بيضاء تترك مسافة علوية (120px) لشعار واسم المختبر المطبوع مسبقاً في المطبعة، وتطبع فقط نتائج التحاليل بدقة.',
      color: '#475569',
      bgPreview: '#ffffff',
    },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon color="#06b6d4" size={24} />
            إعدادات وتخصيص هوية المختبر وقوالب النتائج
          </h1>
          <p className="page-subtitle">تعديل اسم المختبر، الطبيب المسؤول، التراخيص الصحية، الترويسة، واختيار تصميم تقرير النتائج المفضل</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 1fr)', gap: '18px', alignItems: 'start' }}>
        {/* Form Settings */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                <label className="input-label">الطبيب أو المسؤول *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">رقم الترخيص الصحي (MOH License)</label>
                <input
                  type="text"
                  className="input-control"
                  value={labLicense}
                  onChange={(e) => setLabLicense(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="input-label">لقب واختصاص الطبيب</label>
              <input
                type="text"
                className="input-control"
                value={doctorTitle}
                onChange={(e) => setDoctorTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label className="input-label">أرقام الهواتف الرسمية *</label>
                <input
                  type="text"
                  className="input-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">رقم واتساب التقارير</label>
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
              <label className="input-label">العنوان والموقع الجغرافي</label>
              <input
                type="text"
                className="input-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Template Selector */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
              <label className="input-label" style={{ color: 'var(--accent-teal)', fontWeight: 800, fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                🎨 اختر تصميم وقالب تقرير النتائج المعتمد لمختبرك (5 قوالب):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                {templates.map((tpl) => {
                  const isSelected = reportTemplate === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setReportTemplate(tpl.id as any)}
                      style={{
                        border: isSelected ? `2px solid ${tpl.color}` : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 0 10px ${tpl.color}30` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: isSelected ? tpl.color : 'var(--text-main)' }}>
                          {tpl.title}
                        </span>
                        {isSelected && <CheckCircle2 size={15} color={tpl.color} />}
                      </div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {tpl.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="input-label">الملاحظة القانونية في ذيل التقرير (Footer Note)</label>
              <textarea
                rows={2}
                className="textarea-control"
                value={reportFooter}
                onChange={(e) => setReportFooter(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '8px 24px', fontWeight: 800 }}>
                <Save size={16} />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ وتطبيق إعدادات المختبر'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div>
          <div className="glass-card" style={{ background: '#fff', color: '#0f172a', border: `2px solid ${templates.find(t => t.id === reportTemplate)?.color || '#0284c7'}`, padding: '16px', borderRadius: '10px', direction: 'ltr' }}>
            <span style={{ fontSize: '10px', background: templates.find(t => t.id === reportTemplate)?.color || '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, display: 'inline-block', marginBottom: '12px' }}>
              Live Report Template Preview: ({reportTemplate})
            </span>

            {reportTemplate === 'BLANK_WHITE' || reportTemplate === 'PREPRINTED' ? (
              <div style={{ height: '75px', border: '1.5px dashed #94a3b8', borderRadius: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
                📄 Blank space for Pre-Printed Lab Stationery (الورق المروّس بالمطبعة)
              </div>
            ) : reportTemplate === 'MODERN' ? (
              <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', color: '#fff', padding: '12px 14px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>🧪 {labName}</h3>
                  <p style={{ fontSize: '10px', opacity: 0.9 }}>{labSubtitle}</p>
                  <p style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>📍 {address} | 📞 {phone}</p>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '6px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{doctorName}</h4>
                  <p style={{ fontSize: '9px', opacity: 0.9 }}>{doctorTitle}</p>
                </div>
              </div>
            ) : reportTemplate === 'EXECUTIVE' ? (
              <div style={{ borderBottom: '3px double #b45309', paddingBottom: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '9px', background: '#b45309', color: '#fff', padding: '1px 6px', borderRadius: '2px', fontWeight: 800 }}>OFFICIAL REPORT</span>
                  <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#1e3a8a', marginTop: '2px' }}>🏛️ {labName}</h3>
                  <p style={{ fontSize: '10px', color: '#64748b' }}>{labSubtitle}</p>
                  <p style={{ fontSize: '9px', color: '#475569' }}>📍 {address} | 📞 {phone}</p>
                </div>
                <div style={{ textAlign: 'right', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', background: '#f8fafc' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>{doctorName}</h4>
                  <p style={{ fontSize: '9px', color: '#64748b' }}>{doctorTitle}</p>
                </div>
              </div>
            ) : (
              <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#0369a1' }}>🧪 {labName}</h3>
                  <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{labSubtitle}</p>
                  <p style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>📍 {address} | 📞 {phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>{doctorName}</h4>
                  <p style={{ fontSize: '9px', color: '#64748b' }}>{doctorTitle}</p>
                  <p style={{ fontSize: '8.5px', color: '#0284c7' }}>License: {labLicense}</p>
                </div>
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '11px', marginBottom: '10px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Patient:</strong> John Doe</span>
                <span><strong>Sample ID:</strong> #1001</span>
              </div>
            </div>

            <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr style={{ background: templates.find(t => t.id === reportTemplate)?.color || '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left' }}>Investigation</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left' }}>Result</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left' }}>Ref. Range</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left' }}>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 6px', fontWeight: 700 }}>Complete Blood Count (CBC)</td>
                  <td style={{ padding: '4px 6px', color: '#059669', fontWeight: 800 }}>14.2 g/dL</td>
                  <td style={{ padding: '4px 6px' }}>12.0 - 16.0</td>
                  <td style={{ padding: '4px 6px', color: '#64748b' }}>Normal physiological finding</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 6px', fontWeight: 700 }}>Fasting Blood Sugar (FBS)</td>
                  <td style={{ padding: '4px 6px', color: '#d97706', fontWeight: 800 }}>160 mg/dL</td>
                  <td style={{ padding: '4px 6px' }}>70 - 100</td>
                  <td style={{ padding: '4px 6px', color: '#d97706' }}>Impaired fasting glycaemia</td>
                </tr>
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '9px', color: '#64748b', textAlign: 'center' }}>
              {reportFooter}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
