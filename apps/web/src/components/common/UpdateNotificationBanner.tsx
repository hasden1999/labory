'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Download, CheckCircle2, AlertTriangle, RefreshCw, X, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface UpdaterState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  latestVersion: string | null;
  releaseNotes: string | null;
  releaseDate: string | null;
  isCritical: boolean;
  channel: 'stable' | 'beta';
  progress: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  };
  error: string | null;
}

export default function UpdateNotificationBanner() {
  const [updaterState, setUpdaterState] = useState<UpdaterState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desktop = (window as any).electronDesktop;
    if (!desktop?.updater) {
      // Not running in Electron desktop app
      return;
    }

    // Initial state fetch
    desktop.updater.getState().then((state: UpdaterState) => {
      if (state) setUpdaterState(state);
    }).catch(() => {});

    // Subscribe to state updates
    const unsubscribe = desktop.updater.onStateChange((state: UpdaterState) => {
      setUpdaterState(state);
      // Reset dismissed if new downloaded state arrives
      if (state.status === 'downloaded') {
        setDismissed(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!updaterState || dismissed) return null;

  const { status, latestVersion, releaseNotes, progress, isCritical } = updaterState;

  if (status === 'idle' || status === 'checking' || status === 'error') {
    return null;
  }

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
  const formatSpeed = (bps: number) => (bps / (1024 * 1024)).toFixed(2);

  const handleRestartNow = async () => {
    // Check for unsaved intake draft in localStorage
    try {
      const draft = localStorage.getItem('labryo_intake_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.patientName && parsed.patientName.trim()) {
          const confirm = window.confirm('يوجد بيانات مريض غير محفوظة في شاشة الاستقبال. هل تود حفظها واستكمال إعادة التشغيل للتحديث؟');
          if (!confirm) return;
        }
      }
    } catch (e) {}

    setIsRestarting(true);
    const desktop = (window as any).electronDesktop;
    if (desktop?.updater) {
      await desktop.updater.quitAndInstall();
    }
  };

  return (
    <>
      {/* 1. TOP GLOBAL BANNER */}
      <aside
        aria-label="إشعار التحديثات"
        dir="rtl"
        style={{
          background: status === 'downloaded'
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
            : 'linear-gradient(90deg, rgba(2, 132, 199, 0.95), rgba(6, 182, 212, 0.95))',
          color: '#ffffff',
          padding: '10px 20px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          zIndex: 9999,
          position: 'relative',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            {status === 'downloaded' ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800 }}>
                {status === 'downloaded'
                  ? `التحديث جاهز (الإصدار ${latestVersion}) - أعد تشغيل البرنامج لتفعيل التغييرات`
                  : `يتوفر تحديث جديد (الإصدار ${latestVersion})`}
              </span>
              {isCritical && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  تحديث أمني إلزامي
                </span>
              )}
            </div>

            {status === 'downloading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '11.5px', opacity: 0.95 }}>
                <span>جاري التحميل في الخلفية: {progress.percent}%</span>
                <span>({formatMB(progress.transferred)} ميجابايت من {formatMB(progress.total)} ميجابايت)</span>
                {progress.bytesPerSecond > 0 && <span>• {formatSpeed(progress.bytesPerSecond)} MB/s</span>}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {releaseNotes && (
            <button
              type="button"
              onClick={() => setShowNotesModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              ما الجديد؟
            </button>
          )}

          {status === 'downloaded' ? (
            <>
              <button
                type="button"
                onClick={handleRestartNow}
                disabled={isRestarting}
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Zap size={14} />
                <span>{isRestarting ? 'جاري إعادة التشغيل...' : 'إعادة التشغيل الآن'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                style={{
                  background: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                لاحقاً (عند الإغلاق)
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: 0.8,
                padding: '4px',
              }}
              title="إغلاق التنبيه المؤقت"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* 2. WHAT'S NEW MODAL */}
      {showNotesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-notes-title"
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 id="release-notes-title" style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main, #fff)' }}>
                    ما الجديد في الإصدار {latestVersion}؟
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                    تحديث رسمي معتمد من مختبرات Labryo
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, color: 'var(--text-main, #e2e8f0)', fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {releaseNotes}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #334155)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'rgba(0, 0, 0, 0.1)' }}>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                style={{
                  background: 'var(--bg-secondary, #334155)',
                  border: 'none',
                  color: 'var(--text-main, #fff)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                إغلاق
              </button>
              {status === 'downloaded' && (
                <button
                  type="button"
                  onClick={handleRestartNow}
                  disabled={isRestarting}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Zap size={14} />
                  <span>{isRestarting ? 'جاري إعادة التشغيل...' : 'إعادة التشغيل الآن'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
