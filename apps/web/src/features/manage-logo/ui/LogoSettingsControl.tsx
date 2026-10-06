'use client';

import React from 'react';
import { Sliders, RotateCcw, AlignLeft, AlignCenter, AlignRight, MoveHorizontal, MoveVertical, Maximize2 } from 'lucide-react';

export interface LogoSettingsControlProps {
  logoUrl?: string;
  logoWidthMm: number | null;
  logoAlign: 'left' | 'center' | 'right' | null;
  logoOffsetXMm: number | null;
  logoOffsetYMm: number | null;
  onChange: (updates: {
    logoWidthMm?: number | null;
    logoAlign?: 'left' | 'center' | 'right' | null;
    logoOffsetXMm?: number | null;
    logoOffsetYMm?: number | null;
  }) => void;
  onReset: () => void;
}

export function LogoSettingsControl({
  logoUrl,
  logoWidthMm,
  logoAlign,
  logoOffsetXMm,
  logoOffsetYMm,
  onChange,
  onReset,
}: LogoSettingsControlProps) {
  if (!logoUrl) {
    return null;
  }

  const isCustomized =
    logoWidthMm !== null ||
    logoAlign !== null ||
    logoOffsetXMm !== null ||
    logoOffsetYMm !== null;

  const currentWidth = logoWidthMm ?? 25;
  const currentAlign = logoAlign ?? 'right';
  const currentOffsetX = logoOffsetXMm ?? 0;
  const currentOffsetY = logoOffsetYMm ?? 0;

  return (
    <div
      style={{
        background: 'var(--bg-input-deep, #131b2e)',
        border: '1px solid var(--border-color, #1e293b)',
        borderRadius: '10px',
        padding: '14px',
        marginTop: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          borderBottom: '1px solid var(--border-color, #1e293b)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} color="var(--accent-cyan, #06b6d4)" />
          <strong style={{ fontSize: '12.5px', color: 'var(--text-main, #f8fafc)' }}>
            التحكم المتقدم بموضع وحجم الشعار في التقرير (Logo Layout & Size)
          </strong>
        </div>

        {isCustomized && (
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--accent-amber, #f59e0b)',
              borderColor: 'var(--border-color, #1e293b)',
            }}
            title="إعادة ضبط الشعار للوضع التلقائي الافتراضي"
          >
            <RotateCcw size={12} />
            <span>إعادة للوضع التلقائي</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* 1. Logo Width Control (10mm - 80mm) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Maximize2 size={13} />
              <span>عرض الشعار (Width):</span>
            </label>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan, #06b6d4)' }}>
              {currentWidth} mm
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={10}
              max={80}
              step={1}
              value={currentWidth}
              onChange={(e) => onChange({ logoWidthMm: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent-cyan, #06b6d4)' }}
            />
            <input
              type="number"
              min={10}
              max={80}
              value={currentWidth}
              onChange={(e) => {
                const val = Math.max(10, Math.min(80, Number(e.target.value) || 10));
                onChange({ logoWidthMm: val });
              }}
              className="input-control"
              style={{ width: '55px', height: '28px', fontSize: '11px', textAlign: 'center', padding: '2px 4px' }}
            />
          </div>
        </div>

        {/* 2. Logo Alignment (Left, Center, Right) */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '6px' }}>
            محاذاة الشعار بالترويسة (Alignment):
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(
              [
                { id: 'right', label: 'يمين', icon: <AlignRight size={14} /> },
                { id: 'center', label: 'وسط', icon: <AlignCenter size={14} /> },
                { id: 'left', label: 'يسار', icon: <AlignLeft size={14} /> },
              ] as const
            ).map((opt) => {
              const active = currentAlign === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ logoAlign: opt.id })}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: active ? 800 : 600,
                    borderRadius: '6px',
                    border: `1.5px solid ${active ? 'var(--accent-cyan, #06b6d4)' : 'var(--border-color, #1e293b)'}`,
                    background: active ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card, #0f172a)',
                    color: active ? 'var(--accent-cyan, #06b6d4)' : 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Horizontal Offset X (-20mm to +20mm) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MoveHorizontal size={13} />
              <span>إزاحة أفقية X:</span>
            </label>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan, #06b6d4)' }}>
              {currentOffsetX > 0 ? `+${currentOffsetX}` : currentOffsetX} mm
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={currentOffsetX}
              onChange={(e) => onChange({ logoOffsetXMm: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent-cyan, #06b6d4)' }}
            />
            <input
              type="number"
              min={-20}
              max={20}
              value={currentOffsetX}
              onChange={(e) => {
                const val = Math.max(-20, Math.min(20, Number(e.target.value) || 0));
                onChange({ logoOffsetXMm: val });
              }}
              className="input-control"
              style={{ width: '55px', height: '28px', fontSize: '11px', textAlign: 'center', padding: '2px 4px' }}
            />
          </div>
        </div>

        {/* 4. Vertical Offset Y (-20mm to +20mm) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MoveVertical size={13} />
              <span>إزاحة عمودية Y:</span>
            </label>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan, #06b6d4)' }}>
              {currentOffsetY > 0 ? `+${currentOffsetY}` : currentOffsetY} mm
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={currentOffsetY}
              onChange={(e) => onChange({ logoOffsetYMm: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent-cyan, #06b6d4)' }}
            />
            <input
              type="number"
              min={-20}
              max={20}
              value={currentOffsetY}
              onChange={(e) => {
                const val = Math.max(-20, Math.min(20, Number(e.target.value) || 0));
                onChange({ logoOffsetYMm: val });
              }}
              className="input-control"
              style={{ width: '55px', height: '28px', fontSize: '11px', textAlign: 'center', padding: '2px 4px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-dim, #64748b)' }}>
        * الحجم والإزاحة تطبق بالمليمترات الدقيقة داخل الترويسة المطبوعة مع الحفاظ التلقائي على نسبة العرض للارتفاع، ومحصورة بأمان داخل حدود الصفحة.
      </div>
    </div>
  );
}

export default LogoSettingsControl;
