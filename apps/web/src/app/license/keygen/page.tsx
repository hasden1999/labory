'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import AppShell from '../../../components/AppShell';
import { apiRequest } from '../../../lib/api';
import { useToast } from '../../../components/Toast';
import { 
  KeyRound, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Smartphone,
  Check
} from 'lucide-react';

export default function KeygenPage() {
  const toast = useToast();
  const [hwid, setHwid] = useState('');
  const [tier, setTier] = useState<'MONTHLY' | 'YEARLY' | 'LIFETIME'>('YEARLY');
  const [daysValid, setDaysValid] = useState('365');
  const [labName, setLabName] = useState('مختبر طبي معتمد');
  const [secretPasscode, setSecretPasscode] = useState('admin123');
  
  const [generatedKey, setGeneratedKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwid.trim()) {
      toast.warning('يرجى إدخال كود بصمة جهاز العميل', 'مطلوب');
      return;
    }

    setGenerating(true);
    try {
      const res = await apiRequest('/license/developer/generate', 'POST', {
        hwid: hwid.trim(),
        daysValid: parseInt(daysValid, 10) || 365,
        tier,
        labName: labName.trim(),
        secretPasscode,
      });

      setGeneratedKey(res.licenseKey);
      toast.success('تم توليد مفتاح التفعيل المشفر بنجاح!', 'تم التوليد');
    } catch (err: any) {
      toast.error(err.message || 'فشل توليد المفتاح', 'خطأ');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success('تم نسخ المفتاح لإرساله للعميل!', 'تم النسخ');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <KeyRound color="#06b6d4" size={26} />
            أداة توليد مفاتيح التراخيص (خاصة بالمطور)
          </h1>
          <p className="page-subtitle">توليد مفاتيح تفعيل أوفلاين مشفرة بختم رقمي (HMAC-SHA256) لأجهزة العملاء</p>
        </div>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          
          <form onSubmit={handleGenerate}>
            
            {/* HWID */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                كود بصمة جهاز العميل (HWID) *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: LAB-8F42-99A1-B330"
                className="input-control"
                style={{ fontSize: '13.5px', fontFamily: 'monospace' }}
                value={hwid}
                onChange={(e) => setHwid(e.target.value)}
              />
            </div>

            {/* Plan Tier */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                نوع الباقة والترخيص المطلوب:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'MONTHLY', label: 'اشتراك شهري (30 يوم)', days: '30' },
                  { id: 'YEARLY', label: 'اشتراك سنوي (365 يوم)', days: '365' },
                  { id: 'LIFETIME', label: 'ترخيص دائم مدى الحياة', days: '36500' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTier(t.id as any);
                      setDaysValid(t.days);
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: tier === t.id ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      background: tier === t.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: tier === t.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lab Name & Secret Passcode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  اسم المختبر (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مختبر الأمل التخصصي"
                  className="input-control"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  رمز أمان المطور *
                </label>
                <input
                  type="password"
                  required
                  placeholder="admin123"
                  className="input-control"
                  value={secretPasscode}
                  onChange={(e) => setSecretPasscode(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !hwid.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800, justifyContent: 'center' }}
            >
              <Sparkles size={18} />
              <span>{generating ? 'جاري تشفير وتوليد المفتاح...' : 'توليد مفتاح الترخيص المشفر الآن'}</span>
            </button>
          </form>

          {/* Generated Result Display */}
          {generatedKey && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} />
                مفتاح الترخيص المشفر جاهز للإرسال:
              </span>

              <div style={{ background: 'rgba(7, 10, 18, 0.9)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', wordBreak: 'break-all', marginBottom: '12px' }}>
                <code style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                  {generatedKey}
                </code>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCopy}
                  className="btn-success"
                  style={{ padding: '8px 18px', fontSize: '13px', gap: '6px' }}
                >
                  <Copy size={15} />
                  <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ المفتاح'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
