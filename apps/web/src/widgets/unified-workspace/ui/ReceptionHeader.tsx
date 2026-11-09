'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  UserPlus,
  Printer,
  Users,
  Download,
} from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useToast } from '../../../components/Toast';

interface ReceptionHeaderProps {
  workspace: UnifiedWorkspaceReturn;
}

export default function ReceptionHeader({ workspace }: ReceptionHeaderProps) {
  const router = useRouter();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isClientBrowser, setIsClientBrowser] = useState(false);

  useEffect(() => {
    // Format date like '8 Oct 2026'
    const now = new Date();
    const formatted = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    setCurrentDate(formatted);

    if (typeof window !== 'undefined') {
      const isElectron = Boolean((window as any).electronDesktop);
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((window.navigator as any).standalone);
      const isRemoteHost =
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';
      if (!isElectron && (!isStandalone || isRemoteHost)) {
        setIsClientBrowser(true);
      }
    }
  }, []);

  const handleSendReports = () => {
    window.dispatchEvent(
      new CustomEvent('labryo-action', { detail: { action: 'whatsapp' } })
    );
  };

  const handleNewPatient = () => {
    window.dispatchEvent(
      new CustomEvent('labryo-action', { detail: { action: 'new-patient' } })
    );
  };

  const handlePrintReport = () => {
    window.dispatchEvent(
      new CustomEvent('labryo-action', { detail: { action: 'print' } })
    );
  };

  const handlePatientLog = () => {
    router.push('/patients');
  };

  return (
    <header
      dir="rtl"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px 4px 16px',
        backgroundColor: 'var(--bg-primary)',
        flexShrink: 0,
        userSelect: 'none',
        boxSizing: 'border-box',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* 1. Left Actions Group (4 Distinct Colored Pill Buttons matching user screenshot) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Button 1: ارسال تقارير (Emerald / Teal) */}
        <button
          type="button"
          onClick={handleSendReports}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            backgroundColor: '#0f766e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(15, 118, 110, 0.25)',
            transition: 'opacity 0.15s ease, transform 0.1s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FileText size={16} />
          <span>ارسال تقارير</span>
        </button>

        {/* Button 2: اضافة مريض (Sky Blue) */}
        <button
          type="button"
          onClick={handleNewPatient}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
            transition: 'opacity 0.15s ease, transform 0.1s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <UserPlus size={16} />
          <span>اضافة مريض</span>
        </button>

        {/* Button 3: طباعه تقرير (Purple) */}
        <button
          type="button"
          onClick={handlePrintReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(124, 58, 237, 0.25)',
            transition: 'opacity 0.15s ease, transform 0.1s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Printer size={16} />
          <span>طباعه تقرير</span>
        </button>

        {/* Button 4: سجل المرضى (Slate Navy) */}
        <button
          type="button"
          onClick={handlePatientLog}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(30, 41, 59, 0.25)',
            transition: 'opacity 0.15s ease, transform 0.1s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Users size={16} />
          <span>سجل المرضى</span>
        </button>
      </div>

      {/* 2. Right Title & Status Info (Matching user screenshot) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {isClientBrowser && (
          <button
            type="button"
            onClick={() => router.push('/connect?install=1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
            }}
            title="تثبيت أيقونة البرنامج على هذا الجهاز"
          >
            <Download size={13} />
            <span>تثبيت البرنامج</span>
          </button>
        )}

        {/* Saved status pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '4px 12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-main)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <span>{isClientBrowser ? 'متصل بالسيرفر المركزي' : 'محفوظ محلياً على هذا الجهاز'}</span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              display: 'inline-block',
            }}
          />
        </div>

        {/* Date display */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          {currentDate || '8 Oct 2026'}
        </div>

        {/* Sequence Guide Pills (Prominent 3 Sections Indicator) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '3px 10px',
            borderRadius: '20px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
            }}
          >
            1. بيانات المريض
          </span>
          <span style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 900 }}>◀</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: '#f0fdfa',
              color: '#0f766e',
            }}
          >
            2. اختيار الفحوصات
          </span>
          <span style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 900 }}>◀</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
            }}
          >
            3. إدخال النتائج
          </span>
        </div>

        {/* Reception title and subtitle */}
        <div style={{ textAlign: 'right' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 1.2,
            }}
          >
            الاستقبال والتشخيص
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '1px',
            }}
          >
            تسجيل المريض، اختيار الفحوصات، وتوثيق النتائج
          </span>
        </div>
      </div>
    </header>
  );
}
