'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { 
  ShieldCheck, 
  Key, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Smartphone, 
  Lock, 
  Sparkles, 
  HelpCircle,
  KeyRound
} from 'lucide-react';

export default function LicensePage() {
  const toast = useToast();
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputKey, setInputKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  const DEVELOPER_PHONE = '07764271130';
  const DEVELOPER_WHATSAPP = '9647764271130'; // Developer phone number

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/license/status');
      setLicenseInfo(res);
    } catch (err) {
      toast.error('فشل في جلب حالة ترخيص البرنامج', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCopyHWID = () => {
    if (!licenseInfo?.hardwareId) return;
    navigator.clipboard.writeText(licenseInfo.hardwareId);
    setCopied(true);
    toast.success('تم نسخ كود بصمة الجهاز إلى الحافظة بنجاح!', 'تم النسخ');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      toast.warning('يرجى لصق مفتاح الترخيص المشفر', 'مطلوب');
      return;
    }

    setActivating(true);
    try {
      const res = await apiRequest('/license/activate', 'POST', { licenseKey: inputKey.trim() });
      toast.success(res.message || 'تم تفعيل ترخيص البرنامج بنجاح!', 'تم التفعيل');
      setInputKey('');
      loadStatus();
    } catch (err: any) {
      toast.error(err.message || 'فشل التحقق من مفتاح الترخيص', 'فشل التفعيل');
    } finally {
      setActivating(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً، أود تفعيل ترخيص برنامج مختبر الرضا الطبي (LIMS).\nكود بصمة جهازي هو:\n${licenseInfo?.hardwareId || ''}\nنوع الباقة المطلوبة: (شهري / سنوي / مدى الحياة)`
  );

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck color="#06b6d4" size={26} />
            إدارة تراخيص البرنامج وتفعيل النسخة
          </h1>
          <p className="page-subtitle">حالة الاشتراك، كود بصمة الجهاز الفريد (HWID)، وتفعيل مفاتيح الترخيص الأوفلاين</p>
        </div>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Status Card */}
        <div className="glass-card" style={{ border: licenseInfo?.isLicensed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: licenseInfo?.isLicensed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: licenseInfo?.isLicensed ? '#10b981' : '#f59e0b' }}>
                {licenseInfo?.isLicensed ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? 'جاري فحص حالة الترخيص...' : licenseInfo?.message}
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {licenseInfo?.isTrial ? 'فترة تجريبية مجانية تعمل بكامل المميزات أوفلاين' : `نوع الترخيص: ${licenseInfo?.tier || 'رسمي'}`}
                </div>
              </div>
            </div>

            {licenseInfo && (
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'block' }}>تاريخ انتهاء الصلاحية</span>
                <strong style={{ fontSize: '14px', color: licenseInfo.isLicensed ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {new Date(licenseInfo.expiryDate).toLocaleDateString('ar-IQ')}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Machine Hardware ID Box */}
        <div className="glass-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} color="var(--accent-cyan)" />
            كود بصمة جهازك الفريد (Hardware ID - HWID)
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            هذا الكود مشتق برمجياً من المعالج واللوحة الأم لجهازك. انسخ هذا الكود وأرسله للمطور لتوليد مفتاح تفعيل اشتراكك الخاص بهذا الجهاز.
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(7, 10, 18, 0.8)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
            <code style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-cyan)', letterSpacing: '1px', flex: 1 }}>
              {licenseInfo?.hardwareId || 'جاري القراءة...'}
            </code>

            <button
              type="button"
              onClick={handleCopyHWID}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12.5px', gap: '6px' }}
            >
              <Copy size={15} />
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/${DEVELOPER_WHATSAPP}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-success"
              style={{ textDecoration: 'none', padding: '9px 18px', fontSize: '13px', gap: '8px' }}
            >
              <Smartphone size={16} />
              <span>إرسال كود البصمة للمطور عبر واتساب فوراً</span>
            </a>
          </div>
        </div>

        {/* Enter Activation License Key */}
        <div className="glass-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <KeyRound size={16} color="var(--accent-teal)" />
            تفعيل مفتاح الترخيص (License Activation)
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            الصق مفتاح الترخيص المشفر الذي استلمته من المطور هنا واضغط على تفعيل:
          </p>

          <form onSubmit={handleActivate}>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                required
                placeholder="LIC-XXXXX-XXXXX..."
                className="input-control"
                style={{ fontSize: '13.5px', fontFamily: 'monospace', padding: '12px 14px' }}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={activating || !inputKey.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800, justifyContent: 'center' }}
            >
              <CheckCircle2 size={18} />
              <span>{activating ? 'جاري التحقق والتفعيل الأوفلاين...' : 'تفعيل رخصة البرنامج'}</span>
            </button>
          </form>
        </div>

      </div>
    </AppShell>
  );
}
