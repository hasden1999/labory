'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import GlobalQuickBar from './GlobalQuickBar';
import { useTheme } from './ThemeContext';
import { useLab } from './LabContext';
import LabryoLogo from './LabryoLogo';
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  TrendingUp,
  Package,
  Users,
  Stethoscope,
  Settings as SettingsIcon,
  Cpu,
  Sun,
  Moon,
  LogOut,
  Activity,
  Menu,
  X,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { labProfile } = useLab();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // Primary Navigation Routes (Direct 1-Click Access on Desktop)
  const primaryNavItems = [
    { href: '/', label: 'استقبال وفحص (Intake)', icon: FlaskConical },
    { href: '/results', label: 'إدخال النتائج (Results)', icon: FileText },
    { href: '/samples', label: 'سجل العينات (Samples)', icon: Activity },
    { href: '/patients', label: 'المرضى (Patients)', icon: Users },
    { href: '/dashboard', label: 'المؤشرات (Dashboard)', icon: LayoutDashboard },
  ];

  // Secondary Navigation Routes (Grouped under 'المزيد ▾')
  const secondaryNavItems = [
    { href: '/financials', label: 'المالية (Financials)', icon: TrendingUp },
    { href: '/catalog', label: 'الكتالوج (Tests)', icon: Layers },
    { href: '/devices', label: 'الأجهزة (LIS)', icon: Cpu },
    { href: '/settings', label: 'الإعدادات (Settings)', icon: SettingsIcon },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isSecondaryActive = secondaryNavItems.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', color: 'var(--text-main)', fontFamily: 'var(--font-family)' }}>
      
      {/* 1. TOP SLEEK NAVIGATION BAR (Concept Mockup Style) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(12px)',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 10px rgba(6, 182, 212, 0.35)' }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.2px', display: 'block', lineHeight: 1.1 }}>
                LABRYO <span style={{ color: 'var(--accent-cyan)' }}>LIMS</span>
              </strong>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {labProfile?.labName || 'مختبر وادي الرافدين'}
              </span>
            </div>
          </Link>

          {/* Desktop Horizontal Navigation Tabs */}
          <nav className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '16px' }}>
            {primaryNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} color={isActive ? 'var(--accent-cyan)' : 'currentColor'} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: '-10px', left: '12px', right: '12px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></div>
                  )}
                </Link>
              );
            })}

            {/* Secondary Routes 'More ▾' Dropdown */}
            <div ref={moreMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: isSecondaryActive ? 800 : 600,
                  color: isSecondaryActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  background: isSecondaryActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>المزيد (More)</span>
                <ChevronDown size={14} style={{ transform: moreMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                {isSecondaryActive && (
                  <div style={{ position: 'absolute', bottom: '-10px', left: '12px', right: '12px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></div>
                )}
              </button>

              {moreMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '210px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    zIndex: 200,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {secondaryNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={() => setMoreMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? 'var(--accent-cyan)' : 'var(--text-main)',
                          background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'background 0.12s ease',
                        }}
                      >
                        <Icon size={14} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Quick Tools (Theme Toggle, User Profile, Mobile Menu) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Theme Toggle Icon */}
          <button
            onClick={toggleTheme}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: theme === 'dark' ? '#fbbf24' : '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={theme === 'dark' ? 'التحويل للوضع النهاري (Light)' : 'التحويل للوضع الليلي (Dark)'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Role Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
            <span>مدير المختبر</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (if on mobile screen) */}
      {mobileMenuOpen && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 99 }}>
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-main)',
                  background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* 2. MAIN CONTENT AREA (Wide, Spacious, Floating Glass Aesthetic) */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1600px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>

    </div>
  );
}
