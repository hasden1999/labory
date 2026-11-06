'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UpdateNotificationBanner from './common/UpdateNotificationBanner';
import ReceptionSidebar from '../widgets/unified-workspace/ui/ReceptionSidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('labryo_intake_view_mode');
      } catch (e) {}
    }
  }, []);

  if (pathname === '/') {
    return (
      <>
        <UpdateNotificationBanner />
        {children}
      </>
    );
  }

  const HIDE_SHELL = ['/login', '/showcase', '/connect', '/ready', '/health'];
  const hideShell = HIDE_SHELL.includes(pathname) || pathname?.startsWith('/verify') || pathname?.startsWith('/admin');
  if (hideShell) return <>{children}</>;

  return (
    <div
      dir="rtl"
      style={{
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-main)',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        boxSizing: 'border-box',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      {/* 1. Unified Right Sidebar (Exact same sidebar as Main Screen '/') */}
      <ReceptionSidebar />

      {/* 2. Unified Zero-Scroll Main Workspace Area */}
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
        <UpdateNotificationBanner />
        <main
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
