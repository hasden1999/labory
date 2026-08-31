'use client';

import React from 'react';

interface LabryoLogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export default function LabryoLogo({ 
  size = 32, 
  showText = true, 
  subtitle = 'LIMS Pro Edition',
  className = '' 
}: LabryoLogoProps) {
  return (
    <div className={`labryo-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
      
      {/* Sleek Glowing Hexagonal / Flask Icon Container */}
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.28)}px`,
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 165, 233, 0.08) 100%)',
        border: '1.5px solid rgba(6, 182, 212, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 16px rgba(6, 182, 212, 0.25), inset 0 0 10px rgba(6, 182, 212, 0.15)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Futuristic Flask + Helix SVG */}
        <svg 
          width={Math.round(size * 0.62)} 
          height={Math.round(size * 0.62)} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M9 3H15M10 3V8.5L4.5 18.5C3.8 19.8 4.7 21.5 6.2 21.5H17.8C19.3 21.5 20.2 19.8 19.5 18.5L14 8.5V3" 
            stroke="#06b6d4" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M7 16C9 14.5 11 17.5 13 16C15 14.5 16.5 15.5 17 16" 
            stroke="#38bdf8" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />
          <circle cx="12" cy="13" r="1.5" fill="#06b6d4" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{
              fontSize: `${Math.max(13, Math.round(size * 0.44))}px`,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1.1,
            }}>
              LABRYO
            </span>
            <span style={{
              fontSize: `${Math.max(11, Math.round(size * 0.36))}px`,
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 1.1,
            }}>
              لابريو
            </span>
          </div>

          {subtitle && (
            <span style={{
              fontSize: `${Math.max(9, Math.round(size * 0.28))}px`,
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              letterSpacing: '0.3px',
              lineHeight: 1.2,
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}

    </div>
  );
}
