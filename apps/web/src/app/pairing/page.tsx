'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { QrCode, Smartphone, Wifi, CheckCircle2 } from 'lucide-react';

export default function PairingPage() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/network/qr');
      setNetworkInfo(res);
    } catch (err) {
      console.error('Failed to load pairing info:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>ربط الهواتف عبر الشبكة المحلية (LAN)</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          امسح الرمز بواسطة كاميرا الهاتف لفتح واجهة التطبيق PWA وتثبيتها على الشاشة الرئيسية بدون إنترنت
        </p>
      </div>

      <div className="responsive-results-grid">
        {/* QR Code Card */}
        <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
          {loading ? (
            <div>جاري توليد كود الشبكة...</div>
          ) : (
            <>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
                {networkInfo?.qrDataUrl && (
                  <img src={networkInfo.qrDataUrl} alt="QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                )}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {networkInfo?.lanUrl}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                أو افتح المتصفح واكتب: <strong style={{ color: 'var(--text-main)' }}>{networkInfo?.mdnsUrl}</strong>
              </p>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-card">
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={24} color="var(--accent-cyan)" />
            <span>خطوات اقتران وتثبيت الهاتف (PWA)</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(2, 132, 199, 0.2)', color: 'var(--accent-cyan)', padding: '8px 14px', borderRadius: '50%', fontWeight: 800 }}>1</div>
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>الاتصال بنفس شبكة الواي فاي (Wi-Fi)</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  تأكد أن هاتف الفني أو الكادر متصل بنفس الراوتر الخاص بمبيوتر المختبر.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(2, 132, 199, 0.2)', color: 'var(--accent-cyan)', padding: '8px 14px', borderRadius: '50%', fontWeight: 800 }}>2</div>
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>مسح الرمز كود الـ QR</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  افتح كاميرا الهاتف أو متصفح الكروم/سفاري واقترن بالرمز المجاور للوصول التلقائي.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(2, 132, 199, 0.2)', color: 'var(--accent-cyan)', padding: '8px 14px', borderRadius: '50%', fontWeight: 800 }}>3</div>
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>الإضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  من خيارات المتصفح اختر "إضافة إلى الشاشة الرئيسية" ليعمل كـ PWA مستقل كلياً بدون شريط عنوان.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
