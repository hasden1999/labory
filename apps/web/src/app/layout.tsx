import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import Providers from '../components/Providers';

export const metadata: Metadata = {
  title: 'Labryo (لابريو) - نظام إدارة المختبرات الطبية والتشخيص الذكي',
  description: 'نظام لابريو لإدارة وتدقيق التحليلات المرضية والمخبرية المتكامل (Labryo LIMS Pro)',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#06b6d4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
