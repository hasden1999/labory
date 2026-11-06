'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { setAdminAuth } from '../../../lib/adminAuth';
import { useToast } from '../../../components/Toast';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Activity,
  KeyRound,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      toast.warning('يرجى إدخال اسم المستخدم وكلمة المرور الخاصة بالإدارة', 'بيانات ناقصة');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/auth/admin/login', 'POST', {
        username: username.trim(),
        password,
      });

      if (res && res.token && res.user) {
        setAdminAuth(res.token, res.user);
        toast.success(`مرحباً بك ${res.user.name} في منصة الإدارة والتحكم`, 'تم التحقق بنجاح');
        router.push('/admin');
      } else {
        throw new Error('لم يتم استلام مفتاح جلسة صالح من الخادم');
      }
    } catch (err: any) {
      const msg = err.message || 'بيانات الدخول غير صحيحة أو ليس لديك صلاحية إدارية';
      setErrorMessage(msg);
      toast.error(msg, 'فشل دخول الأدمن');
    } finally {
      setLoading(false);
    }
  };

  // Quick One-Click Admin Demo Login helper (for owner)
  const handleQuickAdminLogin = async () => {
    setUsername('owner');
    setPassword('owner123');
    try {
      setLoading(true);
      const res = await apiRequest('/auth/admin/login', 'POST', {
        username: 'owner',
        password: 'owner123',
      });
      if (res && res.token) {
        setAdminAuth(res.token, res.user);
        toast.success('تم تسجيل دخول مدير النظام بنجاح', 'دخول سريع');
        router.push('/admin');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول التلقائي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0f2b2b 0%, #090e17 60%, #05080f 100%)',
        color: '#f8fafc',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(13, 148, 136, 0.15)',
          borderRadius: '20px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Top Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(13, 148, 136, 0.4)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={36} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(13, 148, 136, 0.15)',
              border: '1px solid rgba(13, 148, 136, 0.3)',
              color: '#5eead4',
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: 800,
              marginBottom: '10px',
            }}
          >
            <KeyRound size={13} />
            <span>منطقة وصول مشفرة للمدير العام</span>
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
            }}
          >
            منصة إدارة وتحكم Labryo
          </h1>
          <p
            style={{
              fontSize: '12.5px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            يرجى إدخال بيانات الدخول المخصصة لمدير النظام للوصول إلى لوحة التحكم والتقارير التنفيذية
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, color: '#f87171' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 800,
                color: '#cbd5e1',
                marginBottom: '7px',
              }}
            >
              اسم مستخدم المدير
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  display: 'flex',
                }}
              >
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم الإداري (مثال: owner)"
                required
                autoFocus
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '12px 40px 12px 14px',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 800,
                color: '#cbd5e1',
                marginBottom: '7px',
              }}
            >
              كلمة المرور الإدارية
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  display: 'flex',
                }}
              >
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الخاصة بالإدارة"
                required
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '12px 40px 12px 40px',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '13px 20px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.1s ease, box-shadow 0.2s ease',
            }}
          >
            {loading ? (
              <span>جاري التحقق من الصلاحيات...</span>
            ) : (
              <>
                <span>دخول لوحة تحكم الأدمن</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} style={{ color: '#0d9488' }} />
            <span>دخول سريع لحساب المدير الافتراضي (`owner`)</span>
          </button>
        </div>

        {/* Bottom Switch back to Client Login */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
          }}
        >
          <Link
            href="/"
            style={{
              color: '#0d9488',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>محطة الاستقبال السريرية</span>
          </Link>

          <Link
            href="/login"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            تسجيل دخول موظف عادي
          </Link>
        </div>
      </div>
    </div>
  );
}
