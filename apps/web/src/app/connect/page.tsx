'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLab } from '../../components/LabContext';
import {
  Wifi,
  Smartphone,
  Monitor,
  Apple,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Laptop,
  Building2,
  MoreVertical,
  Share,
  PlusSquare,
  X,
} from 'lucide-react';

export default function ConnectPage() {
  const { labProfile } = useLab();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [pairingStatus, setPairingStatus] = useState<'IDLE' | 'REQUESTING' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'>('IDLE');
  const [pairCode, setPairCode] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'WINDOWS' | 'ANDROID' | 'IOS'>('WINDOWS');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  // 1. Initial Device & Token Check + Auto-Pairing on LAN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    let detectedPlatform: 'windows' | 'android' | 'ios' | 'other' = 'other';
    if (ua.includes('android')) {
      setActiveTab('ANDROID');
      detectedPlatform = 'android';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      setActiveTab('IOS');
      detectedPlatform = 'ios';
    } else {
      setActiveTab('WINDOWS');
      detectedPlatform = 'windows';
    }

    const defaultName = ua.includes('windows')
      ? 'كمبيوتر ويندوز فرعي'
      : ua.includes('android')
      ? 'هاتف أندرويد'
      : ua.includes('iphone')
      ? 'هاتف آيفون'
      : ua.includes('ipad')
      ? 'جهاز آيباد'
      : 'جهاز فرعي بالشبكة';
    setDeviceName(defaultName);

    // Check if URL has ?install=1
    if (window.location.search.includes('install=1')) {
      setShowInstallGuideModal(true);
    }

    // Verify stored token or auto-pair seamlessly
    const initPairing = async () => {
      const stored = localStorage.getItem('labryo_device_token');
      if (stored) {
        try {
          const vRes = await fetch('/api/network/pair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', token: stored }),
          });
          const vData = await vRes.json();
          if (vData?.valid) {
            setDeviceToken(stored);
            setPairingStatus('APPROVED');
            document.cookie = `labryo_device_token=${stored}; path=/; max-age=31536000; SameSite=Lax`;
            return;
          }
        } catch {}
      }

      // Perform automatic LAN pairing so the secondary device connects immediately
      try {
        setPairingStatus('REQUESTING');
        const res = await fetch('/api/network/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auto_pair',
            name: defaultName,
            platform: detectedPlatform,
          }),
        });
        const data = await res.json();
        if (data?.success && data?.device?.token) {
          const token = data.device.token;
          setDeviceToken(token);
          setPairingStatus('APPROVED');
          localStorage.setItem('labryo_device_token', token);
          document.cookie = `labryo_device_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
          window.dispatchEvent(new CustomEvent('labryo:device-paired', { detail: data.device }));
        } else {
          setPairingStatus('IDLE');
        }
      } catch {
        setPairingStatus('IDLE');
      }
    };

    initPairing();

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // 2. Load Server Info
  const fetchServerStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/network/status', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setServerInfo(data);
      }
    } catch (e) {
      console.error('Failed to load server info:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
  }, []);

  // 3. Pairing Request Flow (Manual Fallback)
  const handleStartPairing = async () => {
    try {
      setPairingStatus('REQUESTING');
      const ua = navigator.userAgent.toLowerCase();
      const platform = ua.includes('windows')
        ? 'windows'
        : ua.includes('android')
        ? 'android'
        : ua.includes('iphone') || ua.includes('ipad')
        ? 'ios'
        : 'other';

      // Try auto_pair first
      const autoRes = await fetch('/api/network/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_pair',
          name: deviceName || 'جهاز عميل جديد',
          platform,
        }),
      });
      const autoData = await autoRes.json();
      if (autoData?.success && autoData?.device?.token) {
        setPairingStatus('APPROVED');
        setDeviceToken(autoData.device.token);
        localStorage.setItem('labryo_device_token', autoData.device.token);
        document.cookie = `labryo_device_token=${autoData.device.token}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent('labryo:device-paired', { detail: autoData.device }));
        return;
      }

      const res = await fetch('/api/network/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          name: deviceName || 'جهاز عميل جديد',
          platform,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPairCode(data.code);
        setRequestId(data.requestId);
        setPairingStatus('PENDING');
      } else {
        setPairingStatus('IDLE');
      }
    } catch {
      setPairingStatus('IDLE');
    }
  };

  // 4. Poll Pairing Request Status
  useEffect(() => {
    if (pairingStatus !== 'PENDING' || !requestId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/network/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check',
            requestId,
          }),
        });
        const data = await res.json();
        if (data.status === 'APPROVED' && data.device) {
          setPairingStatus('APPROVED');
          setDeviceToken(data.device.token);
          localStorage.setItem('labryo_device_token', data.device.token);
          document.cookie = `labryo_device_token=${data.device.token}; path=/; max-age=31536000; SameSite=Lax`;
          window.dispatchEvent(new CustomEvent('labryo:device-paired', { detail: data.device }));
          clearInterval(interval);
        } else if (data.status === 'REJECTED') {
          setPairingStatus('REJECTED');
          clearInterval(interval);
        } else if (data.status === 'EXPIRED') {
          setPairingStatus('EXPIRED');
          clearInterval(interval);
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [pairingStatus, requestId]);

  // 5. Trigger PWA Install or Open Interactive Visual Guide / Windows Shortcut
  const handleInstallAction = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPromptEvent(null);
      }
      return;
    }

    if (activeTab === 'WINDOWS') {
      // Download desktop shortcut directly AND open guide
      const a = document.createElement('a');
      a.href = '/api/network/shortcut';
      a.download = 'Labryo_LIMS.url';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setShowInstallGuideModal(true);
  };

  // 6. Test Ping Latency
  const handlePingTest = async () => {
    try {
      setPinging(true);
      const t0 = performance.now();
      const res = await fetch('/api/network/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(deviceToken ? { 'x-device-token': deviceToken } : {}),
        },
        body: JSON.stringify({ action: 'ping' }),
      });
      const t1 = performance.now();
      await res.json();
      setPingLatency(Math.round(t1 - t0));
    } catch {
      setPingLatency(-1);
    } finally {
      setPinging(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lanUrl = serverInfo?.lanUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://192.168.1.100:8080');
  const serverLabName =
    serverInfo?.labIdentity?.labName ||
    labProfile?.labName ||
    'المختبر المركزي (الحاسبة الرئيسية)';
  const serverDoctorName =
    serverInfo?.labIdentity?.doctorName ||
    labProfile?.doctorName ||
    '';
  const serverPhone =
    serverInfo?.labIdentity?.phone ||
    labProfile?.phone ||
    '';

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
        color: '#f8fafc',
        padding: '20px 14px',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
                flexShrink: 0,
              }}
            >
              <Wifi size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#fff' }}>
                بوابة ربط الأجهزة بالشبكة المحلية (Labryo LAN Connect)
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                هذا الجهاز يعمل كواجهة متصلة مباشرة بقاعدة بيانات السيرفر المركزي (الحاسبة الرئيسية)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallAction}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)',
                }}
              >
                <Download size={15} />
                <span>تثبيت أيقونة البرنامج على الجهاز</span>
              </button>
            )}

            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '12.5px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <span>دخول النظام الآن</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Central Server Lab Identity Card (Fetched Automatically from PC Server) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                  {serverLabName}
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  تمت مزامنة هوية المختبر من الحاسبة الرئيسية تلقائياً ✓
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                {serverDoctorName ? `إشراف: ${serverDoctorName} — ` : ''}
                {serverPhone ? `هاتف: ${serverPhone} — ` : ''}
                جميع البيانات والفحوصات والتقارير تُقرأ وتُحفظ مباشرة في السيرفر المركزي
              </div>
            </div>
          </div>

          <Link
            href="/"
            style={{
              background: '#10b981',
              color: '#fff',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 900,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <span>فتح شاشة المختبر</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Prominent Install App Icon Card (Always Visible for Phone & PC) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '2px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '16px',
            padding: '20px 22px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Download size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                  📲 تثبيت أيقونة البرنامج على هذا الجهاز ({activeTab === 'ANDROID' ? 'هاتف أندرويد' : activeTab === 'IOS' ? 'آيفون / آيباد' : 'كمبيوتر ويندوز'})
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#cbd5e1' }}>
                  {isInstalled
                    ? 'البرنامج مثبّت بالفعل على هذا الجهاز ويعمل بملء الشاشة'
                    : 'اضغط الزر المقابل لإضافة أيقونة برنامج المختبر الرسمية على شاشة جهازك لفتحه بضغطة واحدة'}
                </p>
              </div>
            </div>

            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallAction}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 22px',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Zap size={17} />
                <span>
                  {activeTab === 'WINDOWS'
                    ? 'تحميل وتثبيت أيقونة سطح المكتب الآن'
                    : 'تثبيت أيقونة البرنامج على الهاتف الآن'}
                </span>
              </button>
            )}
          </div>

          {/* OS Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '14px', marginTop: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ANDROID')}
              style={{
                background: activeTab === 'ANDROID' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'ANDROID' ? '#38bdf8' : '#94a3b8',
                border: activeTab === 'ANDROID' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Smartphone size={15} />
              <span>أندرويد (Android)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('IOS')}
              style={{
                background: activeTab === 'IOS' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'IOS' ? '#38bdf8' : '#94a3b8',
                border: activeTab === 'IOS' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Apple size={15} />
              <span>آيفون وآيباد (iPhone / iPad)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WINDOWS')}
              style={{
                background: activeTab === 'WINDOWS' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'WINDOWS' ? '#38bdf8' : '#94a3b8',
                border: activeTab === 'WINDOWS' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Laptop size={15} />
              <span>أجهزة ويندوز (Windows PC)</span>
            </button>
          </div>

          {activeTab === 'ANDROID' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '14px 16px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.8', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                طريقة إظهار أيقونة البرنامج على شاشة هاتف الأندرويد (في 5 ثوانٍ):
              </div>
              <ol style={{ margin: 0, paddingRight: '20px' }}>
                <li>
                  اضغط على <strong>النقاط الثلاث الرأسية (⋮)</strong> في أعلى زاوية متصفح Chrome (بجانب شريط العنوان <code>{lanUrl}</code>).
                </li>
                <li>
                  اختر من القائمة <strong>&quot;الإضافة إلى الشاشة الرئيسية&quot; (Add to Home screen)</strong> أو <strong>&quot;تثبيت التطبيق&quot; (Install app)</strong>.
                </li>
                <li>
                  اضغط <strong>&quot;إضافة&quot; (Add)</strong> لتنزل أيقونة <strong>Labryo LIMS</strong> الرسمية مباشرة بين تطبيقات هاتفك وتفتح النظام بملء الشاشة!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'IOS' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '14px 16px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.8', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                طريقة إظهار أيقونة البرنامج على شاشة الآيفون أو الآيباد:
              </div>
              <ol style={{ margin: 0, paddingRight: '20px' }}>
                <li>افتح هذا الرابط في متصفح <strong>Safari</strong>.</li>
                <li>اضغط على أيقونة <strong>المشاركة (Share)</strong> في الشريط السفلي للمتصفح (المربع الذي يخرج منه سهم للأعلى).</li>
                <li>اختر <strong>&quot;إضافة إلى الصفحة الرئيسية&quot; (Add to Home Screen)</strong> ثم اضغط <strong>إضافة (Add)</strong>.</li>
              </ol>
            </div>
          )}

          {activeTab === 'WINDOWS' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '14px 16px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong style={{ color: '#38bdf8', display: 'block' }}>أيقونة سطح المكتب الجاهزة للكمبيوتر الفرعي:</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  قم بتحميل ملف الاختصار ووضعه على سطح المكتب لفتح نظام المختبر فوراً بنقرة مزدوجة:
                </span>
              </div>
              <a
                href="/api/network/shortcut"
                download="Labryo_LIMS.url"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284c7',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <Download size={14} />
                <span>تحميل أيقونة سطح المكتب (Labryo_LIMS.url)</span>
              </a>
            </div>
          )}
        </div>

        {/* Pairing Authorization Status Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  حالة الربط والاقتران مع الحاسبة الرئيسية
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  يتم ربط الأجهزة المتصلة بنفس شبكة المختبر المحلية تلقائياً مع تزامن حي ومباشر
                </p>
              </div>
            </div>

            {pairingStatus === 'APPROVED' && (
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} />
                <span>متصل ومقترن بالسيرفر</span>
              </span>
            )}
          </div>

          {(pairingStatus === 'IDLE' || pairingStatus === 'REQUESTING') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', maxWidth: '460px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="اسم الجهاز (مثال: هاتف المدير / الاستقبال)"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    flex: 1,
                    minWidth: '180px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleStartPairing}
                  disabled={pairingStatus === 'REQUESTING'}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {pairingStatus === 'REQUESTING' ? 'جاري الربط التلقائي...' : 'ربط الجهاز بالسيرفر الآن'}
                </button>
              </div>
            </div>
          )}

          {pairingStatus === 'PENDING' && (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                رمز الاقتران على شاشة السيرفر:
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '32px',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  color: '#38bdf8',
                  background: 'rgba(6, 182, 212, 0.1)',
                  display: 'inline-block',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  border: '1px dashed #0284c7',
                  marginBottom: '12px',
                }}
              >
                {pairCode}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: '#f59e0b' }}>
                <Clock size={16} className="animate-spin" />
                <span>قيد انتظار اعتماد المدير من شاشة السيرفر...</span>
              </div>
            </div>
          )}

          {pairingStatus === 'APPROVED' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#34d399', fontSize: '14px' }}>
                  تم ربط هذا الجهاز بالسيرفر المركزي ({serverLabName}) بنجاح!
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  لديك الآن صلاحية كاملة لاستقبال المرضى وتسجيل العينات وحفظ النتائج ومزامنتها حياً مع الحاسبة.
                </div>
              </div>
              <Link
                href="/"
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                الانتقال لشاشة المختبر
              </Link>
            </div>
          )}
        </div>

        {/* Grid: Server Direct Link & QR Code */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* Card 1: Server Direct Link */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '15px', marginBottom: '10px' }}>
                <Monitor size={18} />
                <span>رابط السيرفر المباشر على الشبكة</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '14px' }}>
                هذا هو عنوان الحاسبة الرئيسية على شبكة الواي فاي المحلية:
              </p>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#38bdf8', direction: 'ltr' }}>
                  {lanUrl}
                </span>
                <button
                  type="button"
                  onClick={() => copyUrl(lanUrl)}
                  style={{
                    background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Latency check */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handlePingTest}
                disabled={pinging}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={13} className={pinging ? 'animate-spin' : ''} />
                <span>قياس سرعة الاتصال بالسيرفر</span>
              </button>

              {pingLatency !== null && (
                <div style={{ fontSize: '13px', fontWeight: 800, color: pingLatency >= 0 && pingLatency < 100 ? '#10b981' : '#f59e0b' }}>
                  {pingLatency >= 0 ? `${pingLatency} ms (متصل ممتاز)` : 'تعذر القياس'}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: QR Code Scan */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '15px', marginBottom: '6px' }}>
              <Smartphone size={18} />
              <span>باركود الربط السريع للأجهزة الأخرى</span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
              امسح الباركود بكاميرا أي هاتف آخر لربطه بالمختبر فوراً
            </p>

            <div
              style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                marginBottom: '8px',
              }}
            >
              {serverInfo?.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={serverInfo.qrDataUrl} alt="Server QR Code" style={{ width: '150px', height: '150px', display: 'block' }} />
              ) : (
                <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: '12px' }}>
                  {loading ? 'جاري التوليد...' : 'متصل'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Guide Modal for Installing App Icon on Mobile/PC */}
      {showInstallGuideModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowInstallGuideModal(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b',
              border: '2px solid #06b6d4',
              borderRadius: '18px',
              maxWidth: '480px',
              width: '100%',
              padding: '22px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={20} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                  تثبيت أيقونة البرنامج على الشاشة الرئيسية
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {activeTab === 'ANDROID' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', padding: '14px', fontSize: '13.5px', lineHeight: '1.7' }}>
                  لأن الاتصال يتم عبر شبكة الواي فاي المحلية (<code>{lanUrl}</code>)، يتم وضع الأيقونة على شاشة الهاتف عبر قائمة المتصفح العلوية في خطوتين فقط:
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 14px', borderRadius: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MoreVertical size={20} color="#fff" />
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>1. اضغط على النقاط الثلاث (⋮)</strong> الموجودة في أعلى يسار شاشة متصفح Chrome (بجانب شريط العنوان).
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 14px', borderRadius: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlusSquare size={20} color="#fff" />
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>2. اختر &quot;الإضافة إلى الشاشة الرئيسية&quot;</strong> (Add to Home screen) أو <strong>&quot;تثبيت التطبيق&quot;</strong> ثم اضغط <strong>إضافة</strong>.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'IOS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 14px', borderRadius: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Share size={20} color="#fff" />
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>1. اضغط على زر المشاركة (Share)</strong> في أسفل متصفح Safari.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 14px', borderRadius: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlusSquare size={20} color="#fff" />
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>2. اختر &quot;إضافة إلى الصفحة الرئيسية&quot;</strong> (Add to Home Screen) ثم اضغط <strong>إضافة (Add)</strong>.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'WINDOWS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.7' }}>
                <p style={{ margin: 0 }}>
                  تم بدء تنزيل ملف اختصار سطح المكتب <code>Labryo_LIMS.url</code>! انقله إلى سطح المكتب لفتح النظام بضغطة مزدوجة في أي وقت.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Link
                href="/"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                دخول شاشة المختبر الآن
              </Link>
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
