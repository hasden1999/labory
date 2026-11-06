'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminGuard, { useAdmin } from '../../components/admin/AdminGuard';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FlaskConical,
  ShieldCheck,
  ClipboardList,
  Settings,
  LogOut,
  ArrowRight,
  Server,
  Activity,
  Database,
  ExternalLink,
} from 'lucide-react';

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { adminUser, logout } = useAdmin();

  // On login page, don't show the admin shell sidebar/header
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navLinks = [
    {
      href: '/admin',
      label: 'نظرة عامة والتقارير التنفيذية',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/staff',
      label: 'إدارة الكادر والصلاحيات',
      icon: Users,
    },
    {
      href: '/admin/financials',
      label: 'المالية والأرباح والديون',
      icon: Wallet,
    },
    {
      href: '/admin/catalog',
      label: 'الكتالوج الطبي والتسعير',
      icon: FlaskConical,
    },
    {
      href: '/admin/audit',
      label: 'سجل التدقيق والرقابة',
      icon: ClipboardList,
    },
    {
      href: '/admin/system',
      label: 'النظام والنسخ الاحتياطي',
      icon: Settings,
    },
  ];

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Cairo', sans-serif",
      }}
    >
      {/* 1. Admin Sidebar */}
      <aside
        style={{
          width: '240px',
          minWidth: '240px',
          maxWidth: '240px',
          height: '100vh',
          background: '#0c1220',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Brand Header */}
        <div>
          <div
            style={{
              padding: '20px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Labryo Admin
              </div>
              <div style={{ fontSize: '10.5px', color: '#0d9488', fontWeight: 700 }}>
                منصة الإدارة والتحكم
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {navLinks.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive ? 'linear-gradient(90deg, rgba(13, 148, 136, 0.25) 0%, rgba(13, 148, 136, 0.08) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(13, 148, 136, 0.4)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? '#14b8a6' : '#64748b',
                      flexShrink: 0,
                    }}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div
          style={{
            padding: '14px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Return to Clinic Intake Screen */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              fontSize: '11.5px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={14} style={{ color: '#0d9488' }} />
              <span>محطة الاستقبال (Intake)</span>
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>F1</span>
          </Link>

          {/* Admin Profile & Logout */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {adminUser?.name || 'مدير النظام'}
              </div>
              <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                صلاحية إدارية عليا ({adminUser?.role || 'OWNER'})
              </div>
            </div>

            <button
              onClick={logout}
              title="تسجيل الخروج من لوحة الإدارة"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Workspace */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Top Navbar */}
        <header
          style={{
            height: '56px',
            background: '#0c1220',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>نظام LIMS نشط وقاعدة البيانات متصلة (WAL Mode)</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                fontSize: '11.5px',
                color: '#94a3b8',
                fontWeight: 600,
              }}
            >
              جلسة إدارية آمنة ومحمية
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={14} />
              <span>خروج</span>
            </button>
          </div>
        </header>

        {/* Scrollable Work Area */}
        <main
          style={{
            flex: 1,
            height: 'calc(100vh - 56px)',
            overflowY: 'auto',
            background: '#090d16',
            padding: '24px 28px',
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminGuard>
  );
}
