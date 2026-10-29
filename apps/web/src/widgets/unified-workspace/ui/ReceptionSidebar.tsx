'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FlaskConical,
  Users,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Cpu,
  Wallet,
} from 'lucide-react';
import { useTheme } from '../../../components/ThemeContext';

export default function ReceptionSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { href: '/', label: 'الشاشة الرئيسية', icon: FlaskConical, matchPaths: ['/'] },
    { href: '/patients', label: 'سجل المرضى والنتائج', icon: Users, matchPaths: ['/patients', '/samples', '/results'] },
    { href: '/financials', label: 'الصندوق والحسابات', icon: Wallet, matchPaths: ['/financials', '/debts', '/expenses', '/doctors', '/dashboard'] },
    { href: '/devices', label: 'الأجهزة والمخزون', icon: Cpu, matchPaths: ['/devices', '/inventory'] },
    { href: '/settings', label: 'الإعدادات والتحاليل', icon: SettingsIcon, matchPaths: ['/settings', '/catalog', '/staff', '/license'] },
  ];

  const isDark = theme === 'dark';

  return (
    <aside
      dir="rtl"
      style={{
        width: '190px',
        minWidth: '190px',
        maxWidth: '190px',
        height: '100vh',
        backgroundColor: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 20,
        boxSizing: 'border-box',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* 1. Top Brand Logo & Subtitle */}
      <div>
        <div
          style={{
            padding: '16px 14px 12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
              flexShrink: 0,
            }}
          >
            <FlaskConical size={20} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 900,
                color: 'var(--text-main)',
                lineHeight: 1.1,
                letterSpacing: '-0.2px',
              }}
            >
              Labryo
            </h1>
            <span
              style={{
                fontSize: '9.5px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'block',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              نظام إدارة المختبرات الطبية
            </span>
          </div>
        </div>

        {/* 2. Navigation Items List */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '12px 8px',
          }}
        >
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.matchPaths.some((p) => pathname === p || pathname?.startsWith(p + '/'));
            const Icon = item.icon;
            const activeColor = isDark ? '#2dd4bf' : '#0f766e';
            const activeBg = isDark ? 'rgba(20, 184, 166, 0.16)' : '#e3f4f1';

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? activeColor : 'var(--text-muted)',
                  backgroundColor: isActive ? activeBg : 'transparent',
                  borderRight: isActive ? `3px solid ${activeColor}` : '3px solid transparent',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  position: 'relative',
                }}
              >
                <Icon
                  size={17}
                  color={isActive ? activeColor : 'var(--text-muted)'}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Controls: Dark Mode Toggle & Signed-in User */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '11.5px',
            fontWeight: 700,
            transition: 'all 0.15s ease',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {theme === 'dark' ? (
              <Sun size={14} color="#f59e0b" />
            ) : (
              <Moon size={14} color="#0f766e" />
            )}
            <span>{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-card-hover)',
              color: 'var(--text-muted)',
            }}
          >
            {theme === 'dark' ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '4px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.1,
              }}
            >
              المدير العام
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              متصل محلياً
            </div>
          </div>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
            }}
            title="Connected locally"
          />
        </div>
      </div>
    </aside>
  );
}
