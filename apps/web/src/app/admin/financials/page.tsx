'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import FinancialsPage from '../../financials/page';
import { Wallet, ShieldCheck } from 'lucide-react';

export default function AdminFinancialsPage() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              الرقابة المالية وسجل الصندوق التنفيذي
            </h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              تقارير الأرباح، سندات الصندوق، الذمم والديون، ونسب الأطباء المحيلين المعتمدة في المختبر.
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            padding: '4px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          عرض تدقيق مالي إداري
        </span>
      </div>

      <FinancialsPage />
    </div>
  );
}
