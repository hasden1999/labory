'use client';

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Server,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Radio,
  ExternalLink,
  Power,
  Clock,
  Send,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { useToast } from '../Toast';

interface NetworkSettingsPanelProps {
  labProfile: any;
  updateLabProfile: (updates: any) => Promise<any>;
}

export default function NetworkSettingsPanel({
  labProfile,
  updateLabProfile,
}: NetworkSettingsPanelProps) {
  const toast = useToast();
  const [subTab, setSubTab] = useState<'STATUS' | 'PAIR' | 'DEVICES' | 'DIAG'>('STATUS');
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [pairedDevices, setPairedDevices] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  const [testingBroadcast, setTestingBroadcast] = useState(false);

  // Settings state preserved
  const [serverBaseUrl, setServerBaseUrl] = useState<string>(labProfile?.serverBaseUrl || '');
  const [whatsappAutoSendEnabled, setWhatsappAutoSendEnabled] = useState<boolean>(Boolean(labProfile?.whatsappAutoSendEnabled));
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(labProfile?.autoUpdateEnabled !== false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/network/status');
      const data = await res.json();
      if (data.success) {
        setServerInfo(data);
      }
    } catch (e) {}
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/network/devices');
      const data = await res.json();
      if (data.success) {
        setPairedDevices(data.paired || []);
        setPendingRequests(data.pending || []);
      }
    } catch (e) {}
  };

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/network/diagnostics');
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    fetchDevices();
    fetchDiagnostics();

    const interval = setInterval(() => {
      fetchStatus();
      fetchDevices();
      if (subTab === 'DIAG') fetchDiagnostics();
    }, 4000);

    return () => clearInterval(interval);
  }, [subTab]);

  const downloadClientDesktopShortcut = () => {
    const targetUrl = serverInfo?.lanUrl || `http://${serverInfo?.ip || '192.168.1.100'}:${serverInfo?.port || 8080}`;
    const shortcutContent = `[InternetShortcut]\r\nURL=${targetUrl}\r\nIconIndex=0\r\n`;
    const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'فتح نظام المختبر (Labryo Client).url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('تم تحميل ملف الاختصار! انقله لسطح المكتب في أي كمبيوتر فرعي بالمختبر ليفتح النظام بضغطة واحدة.', 'أيقونة الحواسيب الفرعية');
  };

  const copyLanUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('تم نسخ الرابط إلى الحافظة', 'تم النسخ');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStartup = async () => {
    try {
      const res = await fetch('/api/network/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_startup' }),
      });
      const data = await res.json();
      if (data.success) {
        setServerInfo((prev: any) => ({ ...prev, hasStartupShortcut: data.hasStartupShortcut }));
        toast.success(data.message, 'التشغيل التلقائي');
      }
    } catch {
      toast.error('تعذر تغيير إعداد التشغيل التلقائي', 'خطأ');
    }
  };

  const handleApprovePairing = async (requestId: string, role = 'OPERATOR') => {
    try {
      const res = await fetch('/api/network/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', requestId, role }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم قبول اقتران الجهاز "${data.device.name}" بنجاح`, 'تم الاقتران');
        fetchDevices();
      } else {
        toast.error(data.error || 'تعذر اعتماد الجهاز', 'خطأ');
      }
    } catch {
      toast.error('حدث خطأ أثناء اعتماد الجهاز', 'خطأ');
    }
  };

  const handleRejectPairing = async (requestId: string) => {
    try {
      const res = await fetch('/api/network/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', requestId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info('تم رفض طلب الاقتران', 'تم الرفض');
        fetchDevices();
      }
    } catch {}
  };

  const handleRevokeDevice = async (deviceId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف وإلغاء اقتران الجهاز "${name}"؟ سيفقد حق الوصول فوراً.`)) {
      return;
    }
    try {
      const res = await fetch('/api/network/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم حذف الجهاز "${name}" بنجاح`, 'تم الحذف');
        fetchDevices();
      }
    } catch {}
  };

  const handleToggleBlock = async (deviceId: string, isBlocked: boolean) => {
    try {
      const res = await fetch('/api/network/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isBlocked ? 'unblock' : 'block', deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isBlocked ? 'تم فك حظر الجهاز' : 'تم حظر الجهاز', 'إدارة الأجهزة');
        fetchDevices();
      }
    } catch {}
  };

  const handleTestPing = async () => {
    try {
      setPinging(true);
      const t0 = performance.now();
      const res = await fetch('/api/network/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const t1 = performance.now();
      await res.json();
      setPingLatency(Math.round(t1 - t0));
      toast.success(`زمن الاستجابة: ${Math.round(t1 - t0)}ms`, 'اختبار السرعة');
    } catch {
      setPingLatency(-1);
      toast.error('فشل قياس زمن الاستجابة', 'خطأ');
    } finally {
      setPinging(false);
    }
  };

  const handleTestBroadcast = async () => {
    try {
      setTestingBroadcast(true);
      const res = await fetch('/api/network/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_broadcast', message: 'بث تجريبي لفحص تزامن الأجهزة' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم بث الحدث اللحظي #${data.event.eventId} لجميع الأجهزة المتصلة`, 'بث تجريبي');
        fetchDiagnostics();
      }
    } catch {
      toast.error('تعذر إرسال البث التجريبي', 'خطأ');
    } finally {
      setTestingBroadcast(false);
    }
  };

  const handleSaveNetworkSettings = async () => {
    try {
      setSavingSettings(true);
      await updateLabProfile({
        serverBaseUrl,
        whatsappAutoSendEnabled,
        autoUpdateEnabled,
      });
      toast.success('تم حفظ إعدادات الشبكة بنجاح!', 'تم الحفظ');
    } catch (e: any) {
      toast.error(e?.message || 'فشل حفظ الإعدادات', 'خطأ');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 دقيقة';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} ساعة و ${m} دقيقة`;
    if (m > 0) return `${m} دقيقة و ${s} ثانية`;
    return `${s} ثانية`;
  };

  const lanUrl = serverInfo?.lanUrl || 'http://127.0.0.1:8080';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} dir="rtl">
      {/* 4 Tabs Navigation Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '6px',
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab('STATUS')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: subTab === 'STATUS' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: subTab === 'STATUS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          <Server size={16} />
          <span>1. حالة السيرفر المركزي</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('PAIR')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: subTab === 'PAIR' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: subTab === 'PAIR' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            position: 'relative',
            transition: 'all 0.15s',
          }}
        >
          <Smartphone size={16} />
          <span>2. ربط جهاز جديد</span>
          {pendingRequests.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 900,
                borderRadius: '10px',
                padding: '1px 6px',
              }}
            >
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('DEVICES')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: subTab === 'DEVICES' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: subTab === 'DEVICES' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          <Laptop size={16} />
          <span>3. الأجهزة المتصلة ({pairedDevices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('DIAG')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: subTab === 'DIAG' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: subTab === 'DIAG' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          <Activity size={16} />
          <span>4. التشخيص والسرعة</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SERVER STATUS */}
      {/* ============================================================ */}
      {subTab === 'STATUS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Static IP Warning Alert */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <AlertCircle size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
              <strong style={{ color: '#f59e0b', display: 'block', fontSize: '13.5px', marginBottom: '2px' }}>
                تنبيه هام: حجز وتثبيت عنوان IP السيرفر المركزي
              </strong>
              لضمان ثبات اتصال باقي الأجهزة وعدم تغير الرابط عند انقطاع الكهرباء أو إعادة تشغيل الراوتر، يُرجى حجز عنوان IP ثابت لهذا الجهاز (عبر ميزة Static IP / DHCP Reservation في صفحة الراوتر).
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>عنوان السيرفر المحلي (LAN IP)</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'monospace', direction: 'ltr', marginTop: '4px' }}>
                {serverInfo?.ip || '127.0.0.1'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>المنفذ: {serverInfo?.port || 8080}</div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>الأجهزة المتصلة حالياً</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
                {serverInfo?.connectedCount || 0} جهاز
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                المقترنة: {serverInfo?.pairedCount || 0} | قنوات البث الحية: {serverInfo?.activeSSECount || 0}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>مدة تشغيل الخادم (Uptime)</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatUptime(serverInfo?.uptimeSeconds)}
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>مصدر الحقيقة النشط</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>التشغيل التلقائي مع الويندوز</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: serverInfo?.hasStartupShortcut ? '#10b981' : 'var(--text-muted)', marginTop: '4px' }}>
                {serverInfo?.hasStartupShortcut ? 'مفعّل (يعمل مع الإقلاع)' : 'معطل'}
              </div>
              {serverInfo?.isWindows && (
                <button
                  type="button"
                  onClick={handleToggleStartup}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
                  {serverInfo?.hasStartupShortcut ? 'إلغاء التفعيل' : 'تفعيل مع بدء التشغيل'}
                </button>
              )}
            </div>
          </div>

          {/* Connect Gateway URL Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '15px' }}>
                <Radio size={20} />
                <span>رابط صفحة ربط وتثبيت التطبيق على الأجهزة الأخرى (/connect)</span>
              </div>

              <a
                href="/connect"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <span>معاينة الصفحة</span>
                <ExternalLink size={13} />
              </a>
              <button
                type="button"
                onClick={downloadClientDesktopShortcut}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Laptop size={14} />
                <span>تحميل أيقونة فتح البرنامج للحواسيب الفرعية (.url)</span>
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '14px' }}>
              افتح هذا الرابط على أي حاسبة أو جهاز لوحي أو هاتف في نفس الشبكة، وسيحصل الجهاز على كود اقتران وتظهر أزرار التثبيت المباشرة:
            </p>

            <div
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--accent-cyan)', direction: 'ltr' }}>
                {lanUrl}/connect
              </span>
              <button
                type="button"
                onClick={() => copyLanUrl(`${lanUrl}/connect`)}
                style={{
                  background: copied ? '#10b981' : 'var(--bg-card)',
                  color: copied ? '#fff' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>

          {/* Desktop & External Portal Settings */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>
              <Zap size={20} />
              <span>خيارات البوابة الخارجية والإرسال التلقائي</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={whatsappAutoSendEnabled}
                  onChange={(e) => setWhatsappAutoSendEnabled(e.target.checked)}
                />
                تفعيل الإرسال التلقائي لرسائل الواتساب للمرضى فور اكتمال النتيجة
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoUpdateEnabled}
                  onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                />
                الكشف التلقائي عن تحديثات النظام الجديدة
              </label>
            </div>

            <div>
              <label className="input-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                رابط الخادم العام / دومين المختبر الخارجي (Server Base URL):
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="مثال: https://results.mylab.com أو اتركه فارغاً للاعتماد المحلي"
                value={serverBaseUrl}
                onChange={(e) => setServerBaseUrl(e.target.value)}
                style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button
                type="button"
                onClick={handleSaveNetworkSettings}
                disabled={savingSettings}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px' }}
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PAIR DEVICE */}
      {/* ============================================================ */}
      {subTab === 'PAIR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pending Requests Section */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '15px' }}>
                <ShieldCheck size={20} />
                <span>طلبات الاقتران المعلقة بانتظار موافقة المدير ({pendingRequests.length})</span>
              </div>
              <button
                type="button"
                onClick={fetchDevices}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={12} />
                <span>تحديث</span>
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                لا توجد طلبات اقتران معلقة حالياً. عند فتح صفحة <code>/connect</code> من جهاز جديد، سيظهر طلبه ورمزه هنا مباشرة.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    style={{
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{req.name}</strong>
                        <span style={{ fontSize: '11px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>
                          {req.platform}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                          ({req.ip})
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                        الطلب مرسل منذ {Math.round((Date.now() - req.requestedAt) / 1000)} ثانية
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>كود الاقتران المطلوب</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 900, color: 'var(--accent-cyan)', letterSpacing: '2px' }}>
                          {req.code}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleApprovePairing(req.requestId, 'OPERATOR')}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '7px 14px',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <UserCheck size={14} />
                          <span>قبول واعتماد</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPairing(req.requestId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '7px 12px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <UserX size={14} />
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Code & Link Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              {serverInfo?.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={serverInfo.qrDataUrl} alt="QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
              ) : (
                <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  جاري التوليد...
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                امسح الرمز أو افتح الرابط من الجهاز الآخر
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                قم بتوجيه كاميرا الهاتف أو جهاز الاستقبال لمسح رمز الاستجابة السريعة QR للوصول مباشرة إلى صفحة ربط وتثبيت النظام.
              </p>

              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-cyan)', direction: 'ltr' }}>
                  {lanUrl}/connect
                </span>
                <button
                  type="button"
                  onClick={() => copyLanUrl(`${lanUrl}/connect`)}
                  style={{
                    background: copied ? '#10b981' : 'var(--bg-card)',
                    color: copied ? '#fff' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: CONNECTED DEVICES */}
      {/* ============================================================ */}
      {subTab === 'DEVICES' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                قائمة الأجهزة المقترنة والمعتمدة ({pairedDevices.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                الأجهزة المصرح لها بالدخول والتفاعل ونقل البيانات مع السيرفر المركزي
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDevices}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={13} />
              <span>تحديث القائمة</span>
            </button>
          </div>

          {pairedDevices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
              لا توجد أجهزة مقترنة حتى الآن. استخدم تبويب "ربط جهاز جديد" لربط أجهزة الشبكة.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pairedDevices.map((dev) => {
                const isOnline = !dev.isBlocked && Date.now() - dev.lastSeenAt < 60000;
                return (
                  <div
                    key={dev.id}
                    style={{
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isOnline ? '#10b981' : 'var(--text-muted)',
                        }}
                      >
                        {dev.platform === 'windows' ? <Laptop size={20} /> : <Smartphone size={20} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{dev.name}</strong>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                              color: isOnline ? '#10b981' : 'var(--text-muted)',
                            }}
                          >
                            {isOnline ? 'متصل الآن' : 'غير متصل'}
                          </span>
                          {dev.isBlocked && (
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                              محظور
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '12px' }}>
                          <span>الآي بي: <span style={{ fontFamily: 'monospace' }}>{dev.ip}</span></span>
                          <span>المنصة: {dev.platform}</span>
                          <span>الصلاحية: {dev.role}</span>
                          {dev.latencyMs && <span>الاستجابة: {dev.latencyMs}ms</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(dev.id, dev.isBlocked)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: dev.isBlocked ? '#10b981' : '#f59e0b',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {dev.isBlocked ? 'إلغاء الحظر' : 'حظر مؤقت'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeDevice(dev.id, dev.name)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: '#f87171',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>إلغاء وحذف</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: DIAGNOSTICS */}
      {/* ============================================================ */}
      {subTab === 'DIAG' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Action buttons */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                أدوات فحص واختبار الشبكة
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                قياس زمن الاستجابة واختبار كفاءة محرك البث اللحظي (SSE)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pinging}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={13} className={pinging ? 'animate-spin' : ''} />
                <span>قياس الـ Latency {pingLatency !== null ? `(${pingLatency}ms)` : ''}</span>
              </button>

              <button
                type="button"
                onClick={handleTestBroadcast}
                disabled={testingBroadcast}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                }}
              >
                <Send size={13} />
                <span>إرسال حدث بث تجريبي</span>
              </button>
            </div>
          </div>

          {/* Event Log Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                سجل أحداث الاتصال والاقتران المباشر (Connection Event Log)
              </h4>
              <button
                type="button"
                onClick={fetchDiagnostics}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                تحديث السجل
              </button>
            </div>

            <div
              style={{
                maxHeight: '360px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-card-subtle)',
              }}
            >
              {!diagnostics?.logs || diagnostics.logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  لا توجد أحداث مسجلة بعد.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                      <th style={{ padding: '8px 12px' }}>الوقت</th>
                      <th style={{ padding: '8px 12px' }}>المستوى</th>
                      <th style={{ padding: '8px 12px' }}>التصنيف</th>
                      <th style={{ padding: '8px 12px' }}>الحدث</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnostics.logs.map((log: any) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '7px 12px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {new Date(log.timestamp).toLocaleTimeString('ar-IQ')}
                        </td>
                        <td style={{ padding: '7px 12px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background:
                                log.level === 'ERROR'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : log.level === 'WARN'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(6, 182, 212, 0.15)',
                              color:
                                log.level === 'ERROR'
                                  ? '#f87171'
                                  : log.level === 'WARN'
                                  ? '#f59e0b'
                                  : 'var(--accent-cyan)',
                            }}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td style={{ padding: '7px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {log.category}
                        </td>
                        <td style={{ padding: '7px 12px', color: 'var(--text-main)' }}>
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
