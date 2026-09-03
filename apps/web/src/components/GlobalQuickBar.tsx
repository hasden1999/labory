'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api';
import { useTheme } from './ThemeContext';
import { 
  Search, 
  User, 
  X, 
  ChevronLeft,
  Sun,
  Moon,
  Barcode,
  Clock
} from 'lucide-react';

export default function GlobalQuickBar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [sampleResults, setSampleResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Global Keyboard Shortcuts (Ctrl+K for search, F2, F3, F4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setShowSearchDropdown(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        router.push('/');
      } else if (e.key === 'F3') {
        e.preventDefault();
        router.push('/results');
      } else if (e.key === 'F4') {
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
      setPatientResults([]);
      setSampleResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const [patients, samples] = await Promise.all([
          apiRequest(`/patients/search?q=${encodeURIComponent(searchQuery.trim())}`),
          apiRequest(`/samples?query=${encodeURIComponent(searchQuery.trim())}`)
        ]);
        setPatientResults(Array.isArray(patients) ? patients.slice(0, 5) : []);
        setSampleResults(Array.isArray(samples) ? samples.slice(0, 5) : []);
        setShowSearchDropdown(true);
      } catch (err) {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const hasResults = patientResults.length > 0 || sampleResults.length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      
      {/* 1. Global Search Box (Accessible across all screens) */}
      <div style={{ position: 'relative', width: '320px' }} ref={dropdownRef}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', right: '12px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="بحث فوري (مريض، هاتف، أو باركود)..."
            style={{
              width: '100%',
              padding: '6px 34px 6px 55px',
              fontSize: '11.5px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (hasResults) setShowSearchDropdown(true); }}
          />

          <div style={{ position: 'absolute', left: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={12} />
              </button>
            ) : (
              <kbd style={{ fontSize: '9.5px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'var(--text-dim)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                Ctrl+K
              </kbd>
            )}
          </div>
        </div>

        {/* Dropdown Results */}
        {showSearchDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              left: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              maxHeight: '340px',
              overflowY: 'auto',
              zIndex: 300,
            }}
          >
            {searching ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                جاري البحث...
              </div>
            ) : !hasResults ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                لا توجد نتائج مطابقة لـ &quot;{searchQuery}&quot;
              </div>
            ) : (
              <>
                {/* Samples Section */}
                {sampleResults.length > 0 && (
                  <div>
                    <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 800, color: 'var(--accent-cyan)', background: 'var(--accent-cyan-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Barcode size={11} />
                      <span>العينات والباركود ({sampleResults.length})</span>
                    </div>
                    {sampleResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                          router.push(`/results?sampleId=${s.id}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '11.5px', color: 'var(--accent-cyan)' }}>
                            #{s.sampleNumber}
                          </span>
                          <div>
                            <strong style={{ fontSize: '11.5px', color: 'var(--text-main)', display: 'block' }}>
                              {s.patient?.name || 'مريض'}
                            </strong>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {s.tests?.length || 0} فحوصات
                            </span>
                          </div>
                        </div>

                        <span className="badge badge-received" style={{ fontSize: '9.5px' }}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Patients Section */}
                {patientResults.length > 0 && (
                  <div>
                    <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={11} />
                      <span>سجل المرضى ({patientResults.length})</span>
                    </div>
                    {patientResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                          router.push(`/patients?id=${p.id}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-cyan-subtle)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={11} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '11.5px', color: 'var(--text-main)', display: 'block' }}>{p.name}</strong>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {p.phone || 'بدون هاتف'} • {p.age ? `${p.age} سنة` : ''}
                            </span>
                          </div>
                        </div>

                        <ChevronLeft size={13} color="var(--text-dim)" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Live System Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '3px 10px', height: '28px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
          {currentTime || '00:00:00'}
        </span>
      </div>

      {/* 3. Theme Toggle Icon Button */}
      <button
        onClick={toggleTheme}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          color: theme === 'dark' ? '#fbbf24' : '#2563eb',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title={theme === 'dark' ? 'التحويل للوضع النهاري (Light Mode)' : 'التحويل للوضع الليلي (Dark Mode)'}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

    </div>
  );
}
