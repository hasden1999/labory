'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Plus,
  Stethoscope,
  Check,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { apiRequest } from '../../../lib/api';
import { toEnglishDigits } from '../../../lib/formatters';
import { useToast } from '../../../components/Toast';
import { normalizeAgeToBirthDate } from '@lab-manager/domain';

interface PatientCardPanelProps {
  workspace: UnifiedWorkspaceReturn;
}

function cleanSearch(text: string): string {
  if (!text) return '';
  return text
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .toLowerCase()
    .trim();
}

export default function PatientCardPanel({ workspace }: PatientCardPanelProps) {
  const toast = useToast();

  const {
    patient,
    updatePatientField,
    setAgeYears,
    setAgeMonths,
    setAgeDays,
    setBirthDate,
    selectExistingPatient,
    tubeBadges,
    doctors,
  } = workspace;

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);
  const yearsInputRef = useRef<HTMLInputElement>(null);
  const monthsInputRef = useRef<HTMLInputElement>(null);
  const daysInputRef = useRef<HTMLInputElement>(null);
  const femaleBtnRef = useRef<HTMLButtonElement>(null);
  const maleBtnRef = useRef<HTMLButtonElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);

  // Doctor selector & Quick-Add modal state
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showQuickAddDoctor, setShowQuickAddDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [showPastVisitsModal, setShowPastVisitsModal] = useState(false);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);

  // Autocomplete patient search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest(`/patients/search?q=${encodeURIComponent(q)}`);
        if (Array.isArray(res) && res.length > 0) {
          const normQ = cleanSearch(q);
          const filtered = res.filter((p: any) => {
            const pNameNorm = cleanSearch(p.name || '');
            const pPhone = (p.phone || '').trim();
            return (
              pNameNorm.includes(normQ) ||
              (p.name || '').toLowerCase().includes(q.toLowerCase()) ||
              pPhone.includes(q)
            );
          });
          setSuggestions(filtered.length > 0 ? filtered : res);
          setShowSuggestions(true);
          setHighlightedIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.warn('[PatientCardPanel] Patient search error:', err);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for suggestions & doctor dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        doctorDropdownRef.current &&
        !doctorDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDoctorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchronize local search query and suggestions when patient state is reset externally
  useEffect(() => {
    if (!patient.name && !patient.id) {
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      setIsDoctorOpen(false);
      setDoctorSearch('');
    }
  }, [patient.name, patient.id]);

  // Initial auto-focus on patient name input upon mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectPatient = useCallback(
    (p: any) => {
      selectExistingPatient(p);
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      toast.success(`تم اختيار المريض: ${p.name}`);
    },
    [selectExistingPatient, toast]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectPatient(suggestions[highlightedIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      yearsInputRef.current?.focus();
      yearsInputRef.current?.select();
    }
  };

  const handleYearsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (patient.gender === 'MALE') {
        maleBtnRef.current?.focus();
      } else {
        femaleBtnRef.current?.focus();
      }
    }
  };

  const handleMonthsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      daysInputRef.current?.focus();
      daysInputRef.current?.select();
    }
  };

  const handleDaysKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (patient.gender === 'MALE') {
        maleBtnRef.current?.focus();
      } else {
        femaleBtnRef.current?.focus();
      }
    }
  };

  const handleGenderKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === '2' || e.key.toLowerCase() === 'm' || e.key === 'ذ') {
      e.preventDefault();
      updatePatientField('gender', 'MALE');
      maleBtnRef.current?.focus();
    } else if (e.key === 'ArrowRight' || e.key === '1' || e.key.toLowerCase() === 'f' || e.key === 'أ') {
      e.preventDefault();
      updatePatientField('gender', 'FEMALE');
      femaleBtnRef.current?.focus();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (patient.gender === 'FEMALE') {
        updatePatientField('gender', 'MALE');
        maleBtnRef.current?.focus();
      } else {
        updatePatientField('gender', 'FEMALE');
        femaleBtnRef.current?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!patient.gender) {
        if (document.activeElement === maleBtnRef.current) {
          updatePatientField('gender', 'MALE');
        } else {
          updatePatientField('gender', 'FEMALE');
        }
      }
      phoneInputRef.current?.focus();
      phoneInputRef.current?.select();
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      notesInputRef.current?.focus();
      notesInputRef.current?.select();
    }
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstResult = document.querySelector<HTMLElement>(
        'input[data-shift-nav="result"], select[data-shift-nav="result"], button[data-shift-nav="result"]'
      );
      if (firstResult) {
        firstResult.focus();
        if (firstResult instanceof HTMLInputElement) {
          firstResult.select();
        }
        if (typeof firstResult.scrollIntoView === 'function') {
          firstResult.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  };

  // Age input handlers with boundary validation
  const handleYearsChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr).replace(/[^0-9]/g, '');
    const num = clean === '' ? '' : Math.min(130, parseInt(clean, 10));
    setAgeYears(num);
  };

  const handleMonthsChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr).replace(/[^0-9]/g, '');
    // When years is filled, months must be 0-11
    const maxMonths = patient.ageYears !== '' ? 11 : 120;
    const num = clean === '' ? '' : Math.min(maxMonths, parseInt(clean, 10));
    setAgeMonths(num);
  };

  const handleDaysChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr).replace(/[^0-9]/g, '');
    // When months is filled, days must be 0-30
    const maxDays = patient.ageMonths !== '' ? 30 : 365;
    const num = clean === '' ? '' : Math.min(maxDays, parseInt(clean, 10));
    setAgeDays(num);
  };

  // Quick Add Doctor
  const handleSaveQuickDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) {
      toast.warning('Doctor name is required');
      return;
    }

    setIsSavingDoctor(true);
    try {
      const created = await apiRequest('/doctors', 'POST', {
        name: newDoctorName.trim(),
        phone: newDoctorPhone.trim() || undefined,
        isActive: true,
      });

      if (workspace.addDoctorDirectly) {
        workspace.addDoctorDirectly(created);
      }
      updatePatientField('doctorId', created.id);
      setShowQuickAddDoctor(false);
      setNewDoctorName('');
      setNewDoctorPhone('');
      toast.success(`تمت إضافة واختيار الطبيب: ${created.name}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add doctor');
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const selectedDoctorObj = doctors.find((d) => d.id === patient.doctorId);

  const filteredDoctors = doctors.filter((d) => {
    if (!doctorSearch.trim()) return true;
    const q = doctorSearch.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.specialty && d.specialty.toLowerCase().includes(q))
    );
  });

  return (
    <div
      dir="rtl"
      style={{
        width: 'clamp(280px, 22vw, 312px)',
        minWidth: '280px',
        maxWidth: '312px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-card)',
        borderRadius: '14px',
        border: '2.5px solid #2563eb',
        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* 1. Header: Prominent Royal Blue Section 1 Banner */}
      <div
        style={{
          flexShrink: 0,
          margin: '-16px -16px 14px -16px',
          padding: '13px 16px',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 900,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.24)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            القسم 1
          </span>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.2px',
            }}
          >
            بيانات المريض
          </h2>
        </div>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.35)',
          }}
        >
          {patient.visitCount
            ? `🏥 ${patient.visitCount} ${patient.visitCount === 1 ? 'زيارة' : 'زيارات'}`
            : 'معلومات الزيارة'}
        </span>
      </div>

      {/* 2. Main Patient Input Fields */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingLeft: '2px',
          paddingRight: '2px',
        }}
      >
        {/* Field 1: Full name */}
        <div style={{ position: 'relative' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '5px',
              textAlign: 'right',
            }}
          >
            <span style={{ color: 'var(--color-danger)', marginLeft: '3px' }}>*</span>
            الاسم الكامل
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              name="patientName"
              placeholder="الاسم الثلاثي للمريض..."
              value={patient.name}
              dir="auto"
              data-shift-nav="patient"
              onChange={(e) => {
                updatePatientField('name', e.target.value);
                setSearchQuery(e.target.value);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={handleSearchKeyDown}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                textAlign: 'right',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {patient.name && (
              <button
                type="button"
                onClick={() => {
                  updatePatientField('name', '');
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsBoxRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                zIndex: 1050,
              }}
            >
              {suggestions.map((sug, idx) => (
                <div
                  key={sug.id || idx}
                  onClick={() => handleSelectPatient(sug)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: highlightedIndex === idx ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }} dir="auto">
                      {sug.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {sug.phone ? `هاتف: ${sug.phone} ` : ''}
                      {sug.age ? `• عمر: ${sug.age}` : ''}
                      {sug.visitCount ? ` • الزيارات: ${sug.visitCount}` : ''}
                    </div>
                  </div>
                  {sug.visitCount && sug.visitCount > 1 ? (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(15, 118, 110, 0.1)',
                        color: '#0f766e',
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      {sug.visitCount} زيارات
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Returning patient banner if visits > 0 */}
        {patient.id && (patient.visitCount || 0) > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(15, 118, 110, 0.08)',
              border: '1px solid rgba(15, 118, 110, 0.25)',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
            }}
          >
            <span style={{ fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FolderOpen size={13} />
              <span>مريض سابق ({patient.visitCount} {patient.visitCount === 1 ? 'زيارة' : 'زيارات'})</span>
            </span>
            {patient.priorVisits && patient.priorVisits.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPastVisitsModal(true)}
                style={{
                  background: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                التحاليل السابقة
              </button>
            )}
          </div>
        )}

        {/* Field 2: Age (3 fields side by side: years, months, days) */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '5px',
              textAlign: 'right',
            }}
          >
            <span style={{ color: 'var(--color-danger)', marginLeft: '3px' }}>*</span>
            العمر
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {/* Years (Rightmost in RTL) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                padding: '0 8px',
                boxSizing: 'border-box',
              }}
            >
              <input
                ref={yearsInputRef}
                type="text"
                data-shift-nav="patient"
                value={patient.ageYears === '' ? '' : patient.ageYears}
                placeholder="0"
                onChange={(e) => handleYearsChange(e.target.value)}
                onKeyDown={handleYearsKeyDown}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>
                سنة
              </span>
            </div>

            {/* Months (Middle in RTL) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                padding: '0 8px',
                boxSizing: 'border-box',
              }}
            >
              <input
                ref={monthsInputRef}
                type="text"
                data-shift-nav="patient"
                value={patient.ageMonths === '' ? '' : patient.ageMonths}
                placeholder="0"
                onChange={(e) => handleMonthsChange(e.target.value)}
                onKeyDown={handleMonthsKeyDown}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>
                شهر
              </span>
            </div>

            {/* Days (Leftmost in RTL) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                padding: '0 8px',
                boxSizing: 'border-box',
              }}
            >
              <input
                ref={daysInputRef}
                type="text"
                data-shift-nav="patient"
                value={patient.ageDays === '' ? '' : patient.ageDays}
                placeholder="0"
                onChange={(e) => handleDaysChange(e.target.value)}
                onKeyDown={handleDaysKeyDown}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>
                يوم
              </span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            للبالغين: السنوات فقط. للرضع: الأشهر أو الأيام
          </div>
        </div>

        {/* Field 3: Sex (Female / Male, NO default, required) */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '5px',
              textAlign: 'right',
            }}
          >
            <span style={{ color: 'var(--color-danger)', marginLeft: '3px' }}>*</span>
            الجنس
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              ref={femaleBtnRef}
              type="button"
              data-shift-nav="patient"
              onClick={() => updatePatientField('gender', 'FEMALE')}
              onKeyDown={handleGenderKeyDown}
              style={{
                height: '38px',
                borderRadius: '8px',
                border: patient.gender === 'FEMALE' ? '1.5px solid #0f766e' : '1px solid var(--border-color)',
                backgroundColor: patient.gender === 'FEMALE' ? '#0f766e' : 'var(--bg-input)',
                color: patient.gender === 'FEMALE' ? '#ffffff' : 'var(--text-main)',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.12s ease',
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2.5px rgba(15, 118, 110, 0.4)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>أنثى</span>
              {patient.gender === 'FEMALE' && <Check size={16} strokeWidth={2.5} />}
            </button>

            <button
              ref={maleBtnRef}
              type="button"
              data-shift-nav="patient"
              onClick={() => updatePatientField('gender', 'MALE')}
              onKeyDown={handleGenderKeyDown}
              style={{
                height: '38px',
                borderRadius: '8px',
                border: patient.gender === 'MALE' ? '1.5px solid #0f766e' : '1px solid var(--border-color)',
                backgroundColor: patient.gender === 'MALE' ? '#0f766e' : 'var(--bg-input)',
                color: patient.gender === 'MALE' ? '#ffffff' : 'var(--text-main)',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.12s ease',
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2.5px rgba(15, 118, 110, 0.4)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>ذكر</span>
              {patient.gender === 'MALE' && <Check size={16} strokeWidth={2.5} />}
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            حدد الجنس (تعتمد عليه المعدلات الطبيعية في التقرير)
          </div>
        </div>

        {/* Field 4: Phone */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '5px',
              textAlign: 'right',
            }}
          >
            رقم الهاتف
          </label>
          <input
            ref={phoneInputRef}
            type="text"
            data-shift-nav="patient"
            placeholder="07701234567"
            value={patient.phone}
            onChange={(e) => updatePatientField('phone', toEnglishDigits(e.target.value))}
            onKeyDown={handlePhoneKeyDown}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              fontSize: '14.5px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
              outline: 'none',
              direction: 'ltr',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Field 5: Referring doctor */}
        <div ref={doctorDropdownRef} style={{ position: 'relative' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '5px',
              textAlign: 'right',
            }}
          >
            الطبيب المعالج
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Add Doctor '+' button */}
            <button
              type="button"
              onClick={() => setShowQuickAddDoctor(true)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.12s ease',
              }}
              title="إضافة طبيب جديد"
            >
              <Plus size={18} />
            </button>

            {/* Doctor Combobox Trigger */}
            <div
              onClick={() => setIsDoctorOpen(!isDoctorOpen)}
              style={{
                flex: 1,
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: selectedDoctorObj ? 800 : 500,
                  color: selectedDoctorObj ? 'var(--text-main)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedDoctorObj ? selectedDoctorObj.name : 'ابحث أو اختر طبيباً...'}
              </span>
              <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
          </div>

          {/* Doctor Dropdown Menu */}
          {isDoctorOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                zIndex: 1050,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <input
                  type="text"
                  placeholder="ابحث باسم الطبيب..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              {/* Clear option */}
              <div
                onClick={() => {
                  updatePatientField('doctorId', null);
                  setIsDoctorOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  borderBottom: '1px dashed var(--border-subtle)',
                }}
              >
                بدون طبيب (مراجعة مباشرة)
              </div>

              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    updatePatientField('doctorId', doc.id);
                    setIsDoctorOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: patient.doctorId === doc.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{doc.name}</span>
                  {patient.doctorId === doc.id && <Check size={14} color="var(--accent-teal)" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Field 6: Notes or address */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'block',
              marginBottom: '5px',
              textAlign: 'right',
            }}
          >
            العنوان أو الملاحظات
          </label>
          <input
            ref={notesInputRef}
            type="text"
            data-shift-nav="patient"
            placeholder="اختياري..."
            value={patient.notes}
            dir="auto"
            onChange={(e) => updatePatientField('notes', e.target.value)}
            onKeyDown={handleNotesKeyDown}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 3. Bottom Section: Tubes to draw */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          marginTop: '10px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '8px',
            textAlign: 'right',
          }}
        >
          أنابيب السحب المطلوبة
        </div>

        {tubeBadges.length === 0 ? (
          <div
            style={{
              border: '1.5px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: 500,
            }}
          >
            تظهر أنابيب السحب المطلوبة هنا فور اختيار الفحوصات
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {tubeBadges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                }}
              >
                {/* Tube Type and Color Dot (Right side in RTL) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '9999px',
                      backgroundColor: badge.dotColor || badge.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {badge.name}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: 'var(--accent-teal)',
                      backgroundColor: 'rgba(20, 184, 166, 0.14)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {badge.count}
                  </span>
                </div>

                {/* Member Test Codes (Left side in RTL) */}
                <span
                  dir="ltr"
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                  }}
                >
                  {badge.testCodes && badge.testCodes.length > 0
                    ? badge.testCodes.join(', ')
                    : badge.testNames.join(', ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Add Doctor Modal */}
      {showQuickAddDoctor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowQuickAddDoctor(false)}
        >
          <div
            style={{
              width: '380px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
              padding: '20px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '10px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                Add Referring Doctor
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddDoctor(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Doctor full name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ahmed Al-Taie"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Phone number (optional)
                </label>
                <input
                  type="text"
                  placeholder="0770..."
                  value={newDoctorPhone}
                  onChange={(e) => setNewDoctorPhone(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickAddDoctor(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoctor}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: isSavingDoctor ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSavingDoctor ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Past Visits Modal */}
      {showPastVisitsModal && (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowPastVisitsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(15, 118, 110, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={18} color="#0f766e" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                  ملف المريض: {patient.name} ({patient.visitCount} زيارات سابقة)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPastVisitsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(patient.priorVisits || []).map((v: any, idx: number) => (
                <div
                  key={v.id || idx}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f766e' }}>
                      عينة #{v.sampleNumber}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB') : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(v.tests || []).map((t: any, tidx: number) => (
                      <span
                        key={tidx}
                        style={{
                          fontSize: '11.5px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: t.isAbnormal ? '#dc2626' : 'var(--text-main)',
                          fontWeight: 700,
                        }}
                      >
                        {t.name || t.code}: <span dir="ltr">{t.resultValue || '-'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
