'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { WifiOff, RefreshCw } from 'lucide-react';

interface NetworkSyncContextType {
  status: 'CONNECTED' | 'CONNECTING' | 'OFFLINE';
  isOnline: boolean;
  lastEventId: number;
  reconnect: () => void;
}

const NetworkSyncContext = createContext<NetworkSyncContextType>({
  status: 'CONNECTED',
  isOnline: true,
  lastEventId: 0,
  reconnect: () => {},
});

export const useNetworkSync = () => useContext(NetworkSyncContext);

export default function NetworkSyncProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'CONNECTED' | 'CONNECTING' | 'OFFLINE'>('CONNECTED');
  const [lastEventId, setLastEventId] = useState<number>(0);
  const backoffRef = useRef<number>(1000);
  const reconnectTimeoutRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const ensureClientPairedIfNeeded = async (): Promise<string> => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('labryo_device_token') || '';
    const isClientDevice =
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      window.location.hostname !== '[::1]';

    if (token && !document.cookie.includes('labryo_device_token=')) {
      document.cookie = `labryo_device_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
    }

    if (!isClientDevice) return token;

    // Verify existing token or auto-pair on local LAN seamlessly
    try {
      if (token) {
        const verifyRes = await fetch('/api/network/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', token }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData?.valid) {
          return token;
        }
      }

      const ua = navigator.userAgent.toLowerCase();
      const platform = ua.includes('windows')
        ? 'windows'
        : ua.includes('android')
        ? 'android'
        : ua.includes('iphone') || ua.includes('ipad')
        ? 'ios'
        : 'other';
      const defaultName = ua.includes('windows')
        ? 'كمبيوتر فرعي (Windows)'
        : ua.includes('android')
        ? 'هاتف أندرويد (Android)'
        : ua.includes('iphone')
        ? 'هاتف آيفون (iPhone)'
        : ua.includes('ipad')
        ? 'جهاز آيباد (iPad)'
        : 'جهاز فرعي بالشبكة';

      const pairRes = await fetch('/api/network/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_pair',
          name: defaultName,
          platform,
        }),
      });
      const pairData = await pairRes.json();
      if (pairData?.success && pairData?.device?.token) {
        token = pairData.device.token;
        localStorage.setItem('labryo_device_token', token);
        document.cookie = `labryo_device_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent('labryo:device-paired', { detail: pairData.device }));
      }
    } catch {}

    return token;
  };

  const verifyServerHttpReachability = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/network/status', {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  };

  const connectSSE = async () => {
    if (typeof window === 'undefined') return;

    // Clean existing
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {}
      eventSourceRef.current = null;
    }

    const token = await ensureClientPairedIfNeeded();
    const lastId = lastEventId || 0;
    const url = `/api/network/events?token=${encodeURIComponent(token)}&lastEventId=${lastId}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('CONNECTED');
        backoffRef.current = 1000; // Reset backoff on success
      };

      es.addEventListener('connected', () => {
        setStatus('CONNECTED');
      });

      es.addEventListener('message', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.eventId && parsed.eventId > lastId) {
            setLastEventId(parsed.eventId);
          }
          // Dispatch global window event so any screen/hook can react to specific updates
          window.dispatchEvent(new CustomEvent('labryo:event', { detail: parsed }));
          if (parsed.type) {
            window.dispatchEvent(new CustomEvent(`labryo:${String(parsed.type).toLowerCase()}`, { detail: parsed }));
          }
        } catch {}
      });

      es.onerror = async () => {
        try {
          es.close();
        } catch {}
        eventSourceRef.current = null;

        // Check if Central Server HTTP is still reachable before showing red OFFLINE banner
        const reachable = await verifyServerHttpReachability();
        if (reachable) {
          setStatus('CONNECTED');
        } else {
          setStatus('OFFLINE');
        }

        // Exponential backoff reconnect
        const nextDelay = Math.min(backoffRef.current * 1.5, 10000);
        backoffRef.current = nextDelay;

        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, nextDelay);
      };
    } catch {
      const reachable = await verifyServerHttpReachability();
      setStatus(reachable ? 'CONNECTED' : 'OFFLINE');
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
    }
  };

  useEffect(() => {
    connectSSE();

    const handleOnline = () => {
      backoffRef.current = 1000;
      connectSSE();
    };

    const handleOffline = () => {
      setStatus('OFFLINE');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    const handleDevicePaired = () => {
      backoffRef.current = 1000;
      connectSSE();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('labryo:device-paired', handleDevicePaired);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('labryo:device-paired', handleDevicePaired);
      clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {}
      }
    };
  }, []);

  const isOnline = status === 'CONNECTED';
  const hideOfflineBanner =
    pathname?.startsWith('/connect') ||
    pathname?.startsWith('/verify') ||
    pathname === '/ready' ||
    pathname === '/health';

  return (
    <NetworkSyncContext.Provider value={{ status, isOnline, lastEventId, reconnect: connectSSE }}>
      {/* Offline Alert Banner */}
      {status === 'OFFLINE' && !hideOfflineBanner && (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999999,
            background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
            color: '#fff',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            fontSize: '13px',
            fontWeight: 800,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={18} />
            <span>غير متصل بالسيرفر المركزي — جاري محاولة إعادة الاتصال تلقائياً... (تم إيقاف الكتابة مؤقتاً للأمان)</span>
          </div>

          <button
            type="button"
            onClick={connectSSE}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={13} />
            <span>إعادة المحاولة الآن</span>
          </button>
        </div>
      )}

      {/* Global CSS to disable mutations while offline */}
      {status === 'OFFLINE' && !hideOfflineBanner && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
            button[type="submit"], .btn-primary, .btn-save, .action-mutation {
              pointer-events: none !important;
              opacity: 0.5 !important;
              filter: grayscale(1) !important;
            }
          `,
          }}
        />
      )}

      {children}
    </NetworkSyncContext.Provider>
  );
}
