'use client';

import React, { useEffect, useState } from 'react';
import { Download, Monitor, Smartphone, Wifi, X, CheckCircle2 } from 'lucide-react';
import { useLab } from './LabContext';

export default function PwaInstallPrompt() {
  const { labProfile } = useLab();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [lanUrl, setLanUrl] = useState<string>('');

  useEffect(() => {
    // Check if running as installed standalone PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check dismissed state in session
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
    setDismissed(isDismissed);

    // Set LAN URL
    const detectedHost = window.location.hostname;
    const detectedPort = window.location.port ? `:${window.location.port}` : '';
    setLanUrl(`http://${detectedHost}${detectedPort}`);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // If already standalone or user dismissed, do not show banner
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="تثبيت التطبيق على الشبكة المحلية"
      className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white border-b border-sky-700/40 px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm print:hidden transition-all duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-300">
          <Wifi className="w-4 h-4" />
        </div>
        <div className="truncate">
          <div className="font-bold flex items-center gap-1.5 text-sky-200">
            <span>سيرفر الشبكة المحلية نشط:</span>
            <code className="bg-black/40 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[11px] select-all border border-emerald-500/20" dir="ltr">
              {lanUrl}
            </code>
          </div>
          <p className="text-[11px] text-slate-300 truncate hidden sm:block">
            يمكنك فتح هذا الرابط من هواتف ومحطات المختبر الأخرى المتصلة بنفس الشبكة.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mr-auto sm:mr-0">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 text-xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت كتطبيق (PWA)</span>
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
