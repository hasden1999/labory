'use client';

import React, { useState, useEffect, useRef } from 'react';
import { normalizeAgeToBirthDate, computeAgeBreakdown } from '@lab-manager/domain';
import { toEnglishDigits } from '../../lib/formatters';

export interface ClinicalAgeValue {
  years: string;
  months: string;
  days: string;
  birthDate: string | null;
  birthDateEstimated: boolean;
  legacyAgeYears: number | null;
}

interface ClinicalAgeInputProps {
  years: string;
  months: string;
  days: string;
  birthDate?: string | null;
  birthDateEstimated?: boolean | null;
  onChange: (val: ClinicalAgeValue) => void;
  firstInputRef?: React.Ref<HTMLInputElement>;
  onKeyDownFirst?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  idPrefix?: string;
  className?: string;
}

export const ClinicalAgeInput: React.FC<ClinicalAgeInputProps> = ({
  years,
  months,
  days,
  birthDate,
  birthDateEstimated = true,
  onChange,
  firstInputRef,
  onKeyDownFirst,
  idPrefix = 'age',
}) => {
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobValue, setDobValue] = useState<string>('');

  const monthsRef = useRef<HTMLInputElement | null>(null);
  const daysRef = useRef<HTMLInputElement | null>(null);

  // Sync internal dob string from birthDate prop
  useEffect(() => {
    if (birthDate) {
      try {
        const d = new Date(birthDate);
        if (!isNaN(d.getTime())) {
          setDobValue(d.toISOString().split('T')[0]);
        }
      } catch {}
    } else {
      setDobValue('');
    }
  }, [birthDate]);

  const handleNumericChange = (
    field: 'years' | 'months' | 'days',
    rawVal: string
  ) => {
    const clean = toEnglishDigits(rawVal).replace(/[^0-9]/g, '');
    const newYears = field === 'years' ? clean : years;
    const newMonths = field === 'months' ? clean : months;
    const newDays = field === 'days' ? clean : days;

    const yNum = parseInt(newYears || '0', 10) || 0;
    const mNum = parseInt(newMonths || '0', 10) || 0;
    const dNum = parseInt(newDays || '0', 10) || 0;

    if (!newYears && !newMonths && !newDays) {
      onChange({
        years: '',
        months: '',
        days: '',
        birthDate: null,
        birthDateEstimated: true,
        legacyAgeYears: null,
      });
      setDobValue('');
      return;
    }

    const norm = normalizeAgeToBirthDate({ years: yNum, months: mNum, days: dNum });
    const iso = norm.birthDate.toISOString();
    setDobValue(iso.split('T')[0]);

    onChange({
      years: newYears,
      months: newMonths,
      days: newDays,
      birthDate: iso,
      birthDateEstimated: true,
      legacyAgeYears: norm.legacyAgeYears,
    });
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDobValue(val);
    if (!val) {
      onChange({
        years: '',
        months: '',
        days: '',
        birthDate: null,
        birthDateEstimated: false,
        legacyAgeYears: null,
      });
      return;
    }

    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const breakdown = computeAgeBreakdown(d);
      const yStr = breakdown.years > 0 ? String(breakdown.years) : '';
      const mStr = breakdown.months > 0 ? String(breakdown.months) : '';
      const dStr = breakdown.days > 0 ? String(breakdown.days) : '';

      onChange({
        years: yStr,
        months: mStr,
        days: dStr,
        birthDate: d.toISOString(),
        birthDateEstimated: false,
        legacyAgeYears: breakdown.years,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          htmlFor={`${idPrefix}-years`}
          className="input-label"
          style={{ fontSize: '11px', fontWeight: 800, margin: 0 }}
        >
          العمر (س | ش | ي)
        </label>
        <button
          type="button"
          onClick={() => setShowDobPicker(!showDobPicker)}
          style={{
            background: 'none',
            border: 'none',
            color: showDobPicker ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '10.5px',
            cursor: 'pointer',
            padding: '0 4px',
            fontWeight: 700,
            textDecoration: 'underline',
          }}
        >
          {showDobPicker ? 'إخفاء تاريخ الميلاد' : '📅 تاريخ الميلاد'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
        {/* Years input */}
        <div style={{ position: 'relative' }}>
          <input
            id={`${idPrefix}-years`}
            ref={firstInputRef}
            onKeyDown={onKeyDownFirst}
            type="text"
            inputMode="numeric"
            maxLength={3}
            placeholder="سنة"
            className="input-control"
            style={{
              height: '38px',
              fontSize: '12.5px',
              borderRadius: '8px',
              paddingLeft: '22px',
              textAlign: 'center',
            }}
            value={years}
            onChange={(e) => handleNumericChange('years', e.target.value)}
          />
          <span
            style={{
              position: 'absolute',
              left: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            سنة
          </span>
        </div>

        {/* Months input */}
        <div style={{ position: 'relative' }}>
          <input
            id={`${idPrefix}-months`}
            ref={monthsRef}
            type="text"
            inputMode="numeric"
            maxLength={3}
            placeholder="شهر"
            className="input-control"
            style={{
              height: '38px',
              fontSize: '12.5px',
              borderRadius: '8px',
              paddingLeft: '22px',
              textAlign: 'center',
            }}
            value={months}
            onChange={(e) => handleNumericChange('months', e.target.value)}
          />
          <span
            style={{
              position: 'absolute',
              left: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            شهر
          </span>
        </div>

        {/* Days input */}
        <div style={{ position: 'relative' }}>
          <input
            id={`${idPrefix}-days`}
            ref={daysRef}
            type="text"
            inputMode="numeric"
            maxLength={3}
            placeholder="يوم"
            className="input-control"
            style={{
              height: '38px',
              fontSize: '12.5px',
              borderRadius: '8px',
              paddingLeft: '22px',
              textAlign: 'center',
            }}
            value={days}
            onChange={(e) => handleNumericChange('days', e.target.value)}
          />
          <span
            style={{
              position: 'absolute',
              left: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            يوم
          </span>
        </div>
      </div>

      {/* Optional DOB Datepicker */}
      {showDobPicker && (
        <div style={{ marginTop: '2px' }}>
          <input
            id={`${idPrefix}-dob`}
            type="date"
            max={new Date().toISOString().split('T')[0]}
            className="input-control"
            style={{
              height: '32px',
              fontSize: '11.5px',
              borderRadius: '6px',
              padding: '2px 8px',
              direction: 'ltr',
            }}
            value={dobValue}
            onChange={handleDobChange}
          />
        </div>
      )}
    </div>
  );
};
