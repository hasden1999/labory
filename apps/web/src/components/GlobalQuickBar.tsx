'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../lib/api';
import { useTheme } from './ThemeContext';
import { useLab } from './LabContext';
import { 
  Search, 
  Plus, 
  FlaskConical, 
  FileText, 
  LayoutDashboard, 
  Clock, 
  User, 
  X, 
  ShieldCheck, 
  Activity, 
  ChevronLeft,
  Command,
  Sparkles,
  Sun,
  Moon,
  Cpu,
  Building2
} from 'lucide-react';

export default function GlobalQuickBar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { labProfile, openSetupWizard } = useLab();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [licenseBadge, setLicenseBadge] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch License / Trial info
  useEffect(() => {
    const checkLicense = async () => {
      try {
        const res = await apiRequest('/license/status');
        setLicenseBadge(res);
      } catch (e) {
        // silent
      }
    };
    checkLicense();
  }, []);

  // Global Keyboard Shortcuts (F2: Intake, F3: Results, F4: Dashboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'F2') {
        e.preventDefault();
        router.push('/');
      }
      if (e.key === 'F3') {
        e.preventDefault();
        router.push('/results');
      }
      if (e.key === 'F4') {
        e.preventDefault();
        router.push('/dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Click Outside Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Patient & Sample Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const patients = await apiRequest(`/patients/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(patients || []);
        setShowSearchDropdown(true);
      } catch (err) {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="global-quick-bar">
      
      {/* 1. RIGHT: Global Search Box */}
      <div className="quick-search-wrapper" ref={dropdownRef}>
        <Search size={14} className="quick-search-icon" />
        <input
          type="text"
          placeholder="بحث سريع برقم العينة، اسم المريض، أو الهاتف..."
          className="quick-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
            className="quick-search-clear"
          >
            <X size={13} />
          </button>
        )}

        {/* Dropdown Results */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="quick-search-dropdown">
            <div className="dropdown-header">نتائج البحث المباشرة ({searchResults.length}):</div>
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="dropdown-item"
                onClick={() => {
                  setShowSearchDropdown(false);
                  setSearchQuery('');
                  router.push(`/patients?id=${p.id}`);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-blue-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                    <User size={13} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block' }}>{p.name}</strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {p.phone || 'بدون هاتف'} • {p.age ? `${p.age} سنة` : ''} ({p.gender || 'ذكر'})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-received" style={{ fontSize: '10px' }}>
                    {p._count?.samples || p.samples?.length || 0} زيارات
                  </span>
                  <ChevronLeft size={13} color="var(--text-dim)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. LEFT: Clean Minimalist Controls (Clock & Theme Switcher) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        
        {/* Live System Clock & Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', height: '30px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
            {currentTime || '00:00:00'}
          </span>
        </div>

        {/* 🌓 THEME TOGGLE ICON BUTTON */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: theme === 'dark' ? '#fbbf24' : '#0284c7',
            cursor: 'pointer',
          }}
          title={theme === 'dark' ? 'التحويل للوضع النهاري (Light Mode)' : 'التحويل للوضع الليلي (Dark Mode)'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

      </div>

    </div>
  );
}
