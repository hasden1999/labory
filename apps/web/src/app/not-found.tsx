import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, Activity, LayoutDashboard, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '36px 30px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 210, 211, 0.15)',
            border: '1px solid rgba(0, 210, 211, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00d2d3',
            marginBottom: '18px',
          }}
        >
          <FileQuestion size={32} />
        </div>

        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: '#00d2d3',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          404 — PAGE NOT FOUND
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 10px 0',
          }}
        >
          الصفحة المطلوبة غير موجودة
        </h1>

        <p
          style={{
            fontSize: '13.5px',
            color: '#94a3b8',
            lineHeight: '1.6',
            margin: '0 0 28px 0',
          }}
        >
          عذراً، لم يتم العثور على الرابط المطلوب في نظام المختبر. يرجى التحقق من صحة الرابط أو العودة إلى إحدى الشاشات الرئيسية.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '42px',
              background: 'linear-gradient(135deg, #00d2d3 0%, #0abde3 100%)',
              color: '#090d16',
              fontWeight: 800,
              fontSize: '13.5px',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Home size={16} />
            <span>شاشة الاستقبال والاستلام (Intake F2)</span>
          </Link>

          <Link
            href="/results"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Activity size={16} color="#00d2d3" />
            <span>محطات النتائج المخبرية (Results F3)</span>
          </Link>

          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <LayoutDashboard size={16} />
            <span>لوحة المؤشرات والتقارير (Dashboard F4)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
