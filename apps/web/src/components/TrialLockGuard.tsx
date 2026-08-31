'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiRequest } from '../lib/api';
import { useToast } from './Toast';
import { 
  Lock, 
  ShieldAlert, 
  Copy, 
  CheckCircle2, 
  Smartphone, 
  KeyRound, 
  Sparkles, 
  PhoneCall,
  AlertTriangle
} from 'lucide-react';

export default function TrialLockGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toast = useToast();

  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activationKey, setActivationKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  const DEVELOPER_PHONE = '07764271130';
  const DEVELOPER_WHATSAPP = '9647764271130';

  const checkLicense = async () => {
    try {
      const res = await apiRequest('/license/status');
      setLicenseStatus(res);
    } catch (err) {
      console.error('Failed to check license status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLicense();
  }, [pathname]);

  const handleCopyHWID = () => {
    if (!licenseStatus?.hardwareId) return;
    navigator.clipboard.writeText(licenseStatus.hardwareId);
    setCopied(true);
    toast.success('تم نسخ كود بصمة الجهاز بنجاح!', 'تم النسخ');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey.trim()) {
      toast.warning('يرجى إدخال مفتاح الترخيص المشفر', 'مطلوب');
      return;
    }

    setActivating(true);
    try {
      const res = await apiRequest('/license/activate', 'POST', {
        licenseKey: activationKey.trim(),
      });
      toast.success(res.message || 'تم تفعيل ترخيص البرنامج بنجاح!', 'تم التفعيل');
      setActivationKey('');
      await checkLicense();
    } catch (err: any) {
      toast.error(err.message || 'مفتاح الترخيص غير صالح أو غير مطابق لهذا الجهاز', 'فشل التفعيل');
    } finally {
      setActivating(false);
    }
  };

  // If on keygen page, do not lock so developer can access the generator
  if (pathname?.startsWith('/license/keygen')) {
    return <>{children}</>;
  }

  const isLocked = !loading && licenseStatus && (!licenseStatus.isLicensed || licenseStatus.isExpired || licenseStatus.isClockTampered);

  if (isLocked) {
    const whatsappMsg = encodeURIComponent(
      `مرحباً، أود تفعيل ترخيص نظام الرضا برو للمختبرات الطبية (LIMS Pro).\nكود بصمة جهازي (HWID):\n${licenseStatus?.hardwareId || ''}`
    );

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #090d16 0%, #030712 100%)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
          textAlign: 'center',
        }}>
          
          {/* Lock Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '16px',
          }}>
            {licenseStatus.isClockTampered ? <AlertTriangle size={32} /> : <Lock size={32} />}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
            {licenseStatus.isClockTampered 
              ? 'تم اكتشاف تلاعب في ساعة النظام!' 
              : 'انتهت الفترة التجريبية للنظام (7 أيام)'}
          </h2>

          <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px 0' }}>
            {licenseStatus.isClockTampered 
              ? 'يرجى ضبط تاريخ ووقت الكمبيوتر الصحيح لإعادة تنشيط النظام.'
              : `يرجى الاتصال بالمطور للتفعيل الدائم على الرقم: ${DEVELOPER_PHONE}`}
          </p>

          {/* Contact Direct Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            marginBottom: '18px',
          }}>
            <PhoneCall size={18} color="#06b6d4" />
            <strong style={{ fontSize: '15px', color: '#06b6d4', letterSpacing: '1px', direction: 'ltr' }}>
              {DEVELOPER_PHONE}
            </strong>
            <a
              href={`https://wa.me/${DEVELOPER_WHATSAPP}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Smartphone size={13} />
              <span>واتساب المطور</span>
            </a>
          </div>

          {/* HWID Card */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.8)',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 700 }}>
              كود بصمة جهازك (أرسل هذا الكود للمطور للحصول على مفتاح التفعيل):
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8', letterSpacing: '1px', direction: 'ltr' }}>
                {licenseStatus?.hardwareId || 'جاري القراءة...'}
              </code>
              <button
                type="button"
                onClick={handleCopyHWID}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px', minHeight: '28px' }}
              >
                {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>
          </div>

          {/* Key Activation Form */}
          <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                أدخل مفتاح التفعيل الدائم الممنوح من المطور:
              </label>
              <input
                type="text"
                placeholder="LIC-..."
                className="input-control"
                style={{ fontSize: '13px', fontFamily: 'monospace', minHeight: '38px', textAlign: 'left', direction: 'ltr' }}
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={activating}
              className="btn-primary"
              style={{
                width: '100%',
                minHeight: '40px',
                fontSize: '13px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              }}
            >
              {activating ? 'جاري التحقق من المفتاح...' : 'تفعيل النسخة الدائمة ✓'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}
