'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Repeat,
  Flame,
  RotateCcw,
  History,
  TestTube2,
} from 'lucide-react';
import { UnifiedWorkspaceReturn, UnifiedTubeBadge } from '../model/types';
import ReferringDoctorSelect from '../../../components/common/ReferringDoctorSelect';
import { apiRequest } from '../../../lib/api';
import { toEnglishDigits } from '../../../lib/formatters';
import { useToast } from '../../../components/Toast';
import { useLab } from '../../../components/LabContext';
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
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'IQD';

  const {
    patient,
    updatePatientField,
    setAgeYears,
    setAgeMonths,
    setAgeDays,
    setBirthDate,
    selectExistingPatient,
    resetPatient,
    tubeBadges,
    addTestToCart,
    catalogTests,
  } = workspace;

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSearch(true);
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
        console.warn('[PatientCardPanel] Patient autocomplete search error:', err);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPatient = useCallback(
    (p: any) => {
      selectExistingPatient(p);
      setSearchQuery('');
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      toast.success(`Loaded patient: ${p.name}`);
    },
    [selectExistingPatient, toast]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelectPatient(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleRepeatLastTests = async () => {
    if (!patient.id) return;
    try {
      const pastSamples = await apiRequest(`/samples?patientId=${patient.id}&limit=1`);
      if (Array.isArray(pastSamples) && pastSamples.length > 0) {
        const lastSample = pastSamples[0];
        const sampleTests = lastSample.tests || [];
        if (sampleTests.length > 0) {
          let addedCount = 0;
          sampleTests.forEach((st: any) => {
            const catalogItem = catalogTests.find(
              (ct) => ct.id === st.testId || ct.id === st.test?.id || ct.code === st.test?.code
            );
            if (catalogItem) {
              addTestToCart(catalogItem);
              addedCount++;
            }
          });
          toast.success(`Added ${addedCount} tests from patient's previous visit`);
        }
      }
    } catch (err) {
      console.warn('[PatientCardPanel] Error fetching past tests:', err);
    }
  };

  const handleYearsChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr).replace(/[^0-9]/g, '');
    const num = clean === '' ? '' : parseInt(clean, 10);
    setAgeYears(num);
    const res = normalizeAgeToBirthDate({
      years: num === '' ? undefined : num,
      months: patient.ageMonths === '' ? undefined : patient.ageMonths,
      days: patient.ageDays === '' ? undefined : patient.ageDays,
    });
    if (res?.birthDate && !isNaN(res.birthDate.getTime())) {
      setBirthDate(res.birthDate.toISOString().split('T')[0]);
    }
  };

  const handleMonthsChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr).replace(/[^0-9]/g, '');
    const num = clean === '' ? '' : Math.min(11, parseInt(clean, 10));
    setAgeMonths(num);
    const res = normalizeAgeToBirthDate({
      years: patient.ageYears === '' ? undefined : patient.ageYears,
      months: num === '' ? undefined : num,
      days: patient.ageDays === '' ? undefined : patient.ageDays,
    });
    if (res?.birthDate && !isNaN(res.birthDate.getTime())) {
      setBirthDate(res.birthDate.toISOString().split('T')[0]);
    }
  };

  const handleDaysChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr).replace(/[^0-9]/g, '');
    const num = clean === '' ? '' : Math.min(30, parseInt(clean, 10));
    setAgeDays(num);
    const res = normalizeAgeToBirthDate({
      years: patient.ageYears === '' ? undefined : patient.ageYears,
      months: patient.ageMonths === '' ? undefined : patient.ageMonths,
      days: num === '' ? undefined : num,
    });
    if (res?.birthDate && !isNaN(res.birthDate.getTime())) {
      setBirthDate(res.birthDate.toISOString().split('T')[0]);
    }
  };

  return (
    <div
      dir="ltr"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1. Header: Patient Demographics */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
          marginBottom: '6px',
        }}
      >
        <div style={{ width: '65px', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={() => updatePatientField('isUrgent', !patient.isUrgent)}
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: patient.isUrgent ? '#ef4444' : '#f1f5f9',
              color: patient.isUrgent ? '#ffffff' : '#64748b',
              border: patient.isUrgent ? '1px solid #dc2626' : '1px solid #e2e8f0',
            }}
            title="Toggle STAT Urgent Emergency Status"
          >
            <Flame size={11} />
            <span>{patient.isUrgent ? 'STAT' : 'Routine'}</span>
          </button>
        </div>

        <h2
          style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#0f172a',
            margin: 0,
            textAlign: 'center',
            flex: 1,
          }}
        >
          Patient Registration
        </h2>

        <div style={{ width: '65px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              resetPatient();
              toast.info('Patient form reset (F1)');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Reset Form for New Patient (F1)"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Patient History Badge if previous patient */}
      {patient.id && (
        <div
          style={{
            flexShrink: 0,
            marginBottom: '6px',
            padding: '5px 10px',
            borderRadius: '8px',
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <History size={13} color="#0d9488" />
            <span style={{ fontWeight: 800, color: '#0f172a' }}>
              Returning Patient: <strong style={{ color: '#0d9488' }}>{patient.visitCount || 1} Visits</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleRepeatLastTests}
            style={{
              fontSize: '10px',
              fontWeight: 800,
              backgroundColor: '#0d9488',
              color: '#ffffff',
              padding: '2px 7px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Repeat size={10} />
            <span>Repeat Tests</span>
          </button>
        </div>
      )}

      {/* 2. Main Form Fields Container (Fits cleanly in 100vh) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          gap: '8px',
        }}
      >
        {/* Field 1: Patient Full Name (dir="auto") */}
        <div style={{ position: 'relative' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#475569',
              display: 'block',
              marginBottom: '3px',
              textAlign: 'left',
            }}
          >
            Patient Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="patientName"
              placeholder="e.g. Haider Abdul-Hussein"
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
                height: '34px',
                padding: '0 10px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
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
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Popover */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsBoxRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                maxHeight: '190px',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 1050,
              }}
            >
              {suggestions.map((sug, idx) => (
                <div
                  key={sug.id || idx}
                  onClick={() => handleSelectPatient(sug)}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: highlightedIndex === idx ? 'rgba(13, 148, 136, 0.1)' : '#ffffff',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }} dir="auto">{sug.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {sug.phone ? `📱 ${sug.phone}` : ''} {sug.age ? `• Age: ${sug.age}` : ''}
                    </div>
                  </div>
                  {sug.outstandingDebt > 0 && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                      }}
                    >
                      Debt: {Number(sug.outstandingDebt).toLocaleString('en-US')} {currency}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Field 2: Clinical Age (Years / Months / Days) */}
        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#475569',
              display: 'block',
              marginBottom: '3px',
              textAlign: 'left',
            }}
          >
            Clinical Age (Y / M / D)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {/* Years */}
            <input
              type="text"
              placeholder="Years"
              value={patient.ageYears === '' ? '' : patient.ageYears}
              data-shift-nav="patient"
              onChange={(e) => handleYearsChange(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                textAlign: 'center',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Months */}
            <input
              type="text"
              placeholder="Months"
              value={patient.ageMonths === '' ? '' : patient.ageMonths}
              onChange={(e) => handleMonthsChange(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                textAlign: 'center',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Days */}
            <input
              type="text"
              placeholder="Days"
              value={patient.ageDays === '' ? '' : patient.ageDays}
              onChange={(e) => handleDaysChange(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                textAlign: 'center',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Field 3: Biological Gender */}
        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#475569',
              display: 'block',
              marginBottom: '3px',
              textAlign: 'left',
            }}
          >
            Biological Gender
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              maxWidth: '220px',
            }}
          >
            <button
              type="button"
              onClick={() => updatePatientField('gender', 'MALE')}
              style={{
                flex: 1,
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: patient.gender === 'MALE' ? '#334155' : 'transparent',
                color: patient.gender === 'MALE' ? '#ffffff' : '#64748b',
                boxShadow: patient.gender === 'MALE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => updatePatientField('gender', 'FEMALE')}
              style={{
                flex: 1,
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: patient.gender === 'FEMALE' ? '#334155' : 'transparent',
                color: patient.gender === 'FEMALE' ? '#ffffff' : '#64748b',
                boxShadow: patient.gender === 'FEMALE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Female
            </button>
          </div>
        </div>

        {/* Field 4: Phone Number */}
        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#475569',
              display: 'block',
              marginBottom: '3px',
              textAlign: 'left',
            }}
          >
            Phone Number
          </label>
          <input
            type="text"
            placeholder="e.g. 07701234567"
            value={patient.phone}
            data-shift-nav="patient"
            onChange={(e) => updatePatientField('phone', toEnglishDigits(e.target.value))}
            style={{
              width: '100%',
              height: '34px',
              padding: '0 10px',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              direction: 'ltr',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Field 5: Referring Doctor */}
        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#475569',
              display: 'block',
              marginBottom: '3px',
              textAlign: 'left',
            }}
          >
            Referring Doctor
          </label>
          <ReferringDoctorSelect
            value={patient.doctorId}
            onChange={(docId) => updatePatientField('doctorId', docId)}
            placeholder="Select or enter doctor name"
            className="text-left text-xs font-bold"
          />
        </div>

        {/* Field 6: Clinical Notes (dir="auto") */}
        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#475569',
              display: 'block',
              marginBottom: '3px',
              textAlign: 'left',
            }}
          >
            Clinical Notes / Address
          </label>
          <input
            type="text"
            placeholder="Patient notes or address..."
            value={patient.notes}
            dir="auto"
            data-shift-nav="patient"
            onChange={(e) => updatePatientField('notes', e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              padding: '0 10px',
              textAlign: 'left',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 3. Field 7 (Bottom): Sample Tube Badges */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
          marginTop: '6px',
        }}
      >
        <label
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#475569',
            display: 'block',
            marginBottom: '6px',
            textAlign: 'left',
          }}
        >
          Sample Specimen Tubes
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '8px',
            flexWrap: 'wrap',
            minHeight: '28px',
          }}
        >
          {tubeBadges.length === 0 ? (
            <>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                }}
              >
                <TestTube2 size={12} />
                <span>EDTA</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                }}
              >
                <TestTube2 size={12} />
                <span>SST</span>
              </span>
            </>
          ) : (
            tubeBadges.map((badge: UnifiedTubeBadge) => {
              const isPurple = badge.name.toUpperCase().includes('EDTA') || badge.id === 'edta';
              const isAmber = badge.name.toUpperCase().includes('SST') || badge.name.toUpperCase().includes('SERUM') || badge.id === 'sst';
              const isBlue = badge.name.toUpperCase().includes('CITRATE') || badge.id === 'citrate';

              const bgColor = isPurple
                ? '#7c3aed'
                : isAmber
                ? '#d97706'
                : isBlue
                ? '#0284c7'
                : '#0d9488';

              const shortName = isPurple
                ? 'EDTA'
                : isAmber
                ? 'SST'
                : isBlue
                ? 'Citrate'
                : 'Container';

              return (
                <span
                  key={badge.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: bgColor,
                    color: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  title={`${badge.name}: ${badge.testNames.join(', ')} (${badge.count})`}
                >
                  <TestTube2 size={12} />
                  <span>{shortName}</span>
                  {badge.count > 1 && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        padding: '1px 5px',
                        borderRadius: '9999px',
                      }}
                    >
                      {badge.count}
                    </span>
                  )}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
