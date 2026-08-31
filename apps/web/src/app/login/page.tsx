'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import LabryoLogo from '../../components/LabryoLogo';
import { FlaskConical, Lock, User, ShieldCheck, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.warning('يرجى إدخال اسم المستخدم وكلمة المرور', 'بيانات ناقصة');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/auth/login', 'POST', {
        username: username.trim(),
        password,
      });

      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user_role', res.user.role);
        localStorage.setItem('user_profile', JSON.stringify(res.user));
        toast.success(`مرحباً بك ${res.user.name}`, 'تم تسجيل الدخول بنجاح');
        
        // Redirect based on role
        if (res.user.role === 'TECHNICIAN') {
          router.push('/results');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'اسم المستخدم أو كلمة المرور غير صحيحة', 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // Quick One-Click Demo Login
  const handleQuickLogin = async (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    try {
      setLoading(true);
      const res = await apiRequest('/auth/login', 'POST', {
        username: demoUser,
        password: demoPass,
      });

      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user_role', res.user.role);
        localStorage.setItem('user_profile', JSON.stringify(res.user));
        toast.success(`تم تسجيل الدخول كـ ${res.user.name}`, 'دخول سريع');
        
        if (res.user.role === 'TECHNICIAN') {
          router.push('/results');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الدخول التجريبي', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '16px' }}>
      
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '14px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ marginBottom: '10px' }}>
            <LabryoLogo size={42} showText={true} subtitle="نظام إدارة المختبرات الطبية والتشخيص الذكي" />
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            تسجيل الدخول للنظام
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="input-label">اسم المستخدم (Username)</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="أدخل اسم المستخدم (مثال: owner أو tech)"
                className="input-control"
                style={{ paddingRight: '32px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">كلمة المرور (Password)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                placeholder="أدخل كلمة المرور"
                className="input-control"
                style={{ paddingRight: '32px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '6px', minHeight: '38px', fontSize: '13px' }}
          >
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول ✓'}
          </button>
        </form>

        {/* Quick Demo Credentials Box */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-main)' }}>حسابات الدخول الافتراضية السريعة:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('owner', 'owner123')}
              className="btn-secondary"
              style={{ padding: '8px 10px', fontSize: '11.5px', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'right' }}
            >
              <strong style={{ color: 'var(--accent-cyan)', fontSize: '12px' }}>👑 مدير المختبر</strong>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>owner / owner123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('tech', 'tech123')}
              className="btn-secondary"
              style={{ padding: '8px 10px', fontSize: '11.5px', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'right' }}
            >
              <strong style={{ color: 'var(--accent-emerald)', fontSize: '12px' }}>🔬 فني المختبر</strong>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>tech / tech123</span>
            </button>
          </div>
        </div>

        {/* Back to App Link */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link
            href="/dashboard"
            style={{ fontSize: '11.5px', color: 'var(--text-dim)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>الدخول المباشر كزائر / تجريبي</span>
            <ArrowLeft size={12} />
          </Link>
        </div>

      </div>

    </div>
  );
}
