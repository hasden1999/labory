'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiRequest } from '../lib/api';
import { useToast } from './Toast';
import { 
  Lock, 
  ShieldCheck, 
  Copy, 
  CheckCircle2, 
  Smartphone, 
  KeyRound, 
  PhoneCall, 
  AlertTriangle, 
  Sparkles,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function TrialLockGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toast = useToast();

  const [isDesktop, setIsDesktop] = useState(false);
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
      if (res) {
        setLicenseStatus(res);
      }
    } catch (err) {
      console.error('Failed to check license status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Detect if running inside Electron Desktop App
    const desktopDetected = typeof window !== 'undefined' && (
      !!(window as any).electronDesktop?.isDesktop ||
      /electron/i.test(navigator.userAgent || '')
    );
    setIsDesktop(desktopDetected);

    // 2. If NOT desktop app (running via web browser link, mobile, patient portal, etc.), skip license check completely!
    if (!desktopDetected) {
      setLoading(false);
      return;
    }

    // 3. For desktop app only, check license status
    checkLicense();
  }, [pathname]);

  const handleCopyHWID = () => {
    if (!licenseStatus?.hardwareId) return;
    navigator.clipboard.writeText(licenseStatus.hardwareId);
    setCopied(true);
    toast.success('تم نسخ كود بصمة الجهاز إلى الحافظة بنجاح!', 'تم النسخ');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey.trim()) {
      toast.warning('يرجى إدخال كود التفعيل المستلم من الأدمن', 'مطلوب');
      return;
    }

    setActivating(true);
    try {
      const res = await apiRequest('/license/activate', 'POST', {
        licenseKey: activationKey.trim(),
      });
      toast.success(res.message || 'تم تفعيل ترخيص البرنامج بنجاح!', 'تم التفعيل');
      setActivationKey('');
      
      // Update state to unlock
      setLicenseStatus({
        status: 'ACTIVE',
        hardwareId: res.hardwareId || licenseStatus?.hardwareId,
        isLicensed: true,
        isTrial: false,
        isExpired: false,
        isClockTampered: false,
        tier: res.tier || 'LIFETIME',
      });

      // Reload smoothly so LabContext immediately pops the Onboarding Wizard
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'كود التفعيل غير صالح أو غير مطابق لهذا الجهاز', 'فشل التفعيل');
    } finally {
      setActivating(false);
    }
  };

  // If NOT running in Electron desktop app, or if it's a public verification route -> NEVER lock!
  const isPublicRoute = pathname?.startsWith('/verify') || pathname?.startsWith('/showcase');
  if (!isDesktop || isPublicRoute) {
    return <>{children}</>;
  }

  const isLocked = !loading && licenseStatus && (!licenseStatus.isLicensed || licenseStatus.isExpired || licenseStatus.isClockTampered);

  if (isLocked) {
    const whatsappMsg = encodeURIComponent(
      `مرحباً، أود تفعيل ترخيص برنامج إدارة المختبرات الطبية (Labryo LIMS).\nكود بصمة جهازي (HWID):\n${licenseStatus?.hardwareId || ''}\nيرجى تزويدي بكود التفعيل.`
    );

    return (
      <div 
        dir="rtl"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #030712 100%)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: '#f8fafc',
          fontFamily: 'inherit',
          overflowY: 'auto',
        }}
      >
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(6, 182, 212, 0.15)',
          textAlign: 'center',
        }}>
          
          {/* Header Icon */}
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(2, 132, 199, 0.2))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25)',
          }}>
            {licenseStatus.isClockTampered ? <AlertTriangle size={36} color="#f43f5e" /> : <Lock size={36} />}
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
            {licenseStatus.isClockTampered 
              ? 'تم اكتشاف تلاعب في ساعة النظام!' 
              : 'تفعيل نسخة البرنامج لسطح المكتب'}
          </h2>

          <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            {licenseStatus.isClockTampered 
              ? 'يرجى ضبط تاريخ ووقت الكمبيوتر بشكل دقيق لإعادة تنشيط النظام.'
              : 'تم تثبيت البرنامج بنجاح. لتشغيل النظام وإعداد بيانات مختبرك، يرجى إرسال كود بصمة الجهاز إلى الأدمن للحصول على كود التفعيل.'}
          </p>

          {/* Steps Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '20px',
            textAlign: 'right',
          }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, marginBottom: '2px' }}>١. انسخ البصمة</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>انسخ كود جهازك الفريد</div>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, marginBottom: '2px' }}>٢. راسل الأدمن</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>أرسل الكود عبر واتساب</div>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, marginBottom: '2px' }}>٣. التفعيل والتهيئة</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>الصق الكود وابدأ فورا</div>
            </div>
          </div>

          {/* HWID Card */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.9)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px',
            textAlign: 'right',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                كود بصمة جهازك الفريد (Hardware ID):
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(6,182,212,0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                فريد وخاص بهذا الجهاز
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'rgba(15, 23, 42, 0.8)', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <code style={{ fontSize: '17px', fontWeight: 900, color: '#38bdf8', letterSpacing: '1.5px', direction: 'ltr' }}>
                {licenseStatus?.hardwareId || 'جاري قراءة البصمة...'}
              </code>
              <button
                type="button"
                onClick={handleCopyHWID}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', minHeight: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <CheckCircle2 size={15} color="#10b981" /> : <Copy size={15} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>
          </div>

          {/* Admin Contact Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} color="#10b981" />
              <span style={{ fontSize: '12.5px', color: '#e2e8f0' }}>للتواصل مع الأدمن والدعم الفني:</span>
              <strong style={{ fontSize: '14px', color: '#10b981', letterSpacing: '0.5px', direction: 'ltr' }}>
                {DEVELOPER_PHONE}
              </strong>
            </div>

            <a
              href={`https://wa.me/${DEVELOPER_WHATSAPP}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Smartphone size={15} />
              <span>إرسال البصمة عبر واتساب</span>
            </a>
          </div>

          {/* Key Activation Form */}
          <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                أدخل كود التفعيل المعتمد (Activation Key):
              </label>
              <input
                type="text"
                placeholder="LIC-..."
                className="input-control"
                style={{
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  minHeight: '44px',
                  textAlign: 'left',
                  direction: 'ltr',
                  background: 'rgba(2, 6, 23, 0.85)',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  padding: '10px 14px',
                  width: '100%',
                }}
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
                minHeight: '46px',
                fontSize: '14px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                borderRadius: '10px',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              {activating ? (
                <span>جاري فحص كود التفعيل...</span>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>تفعيل البرنامج وبدء العمل</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}
