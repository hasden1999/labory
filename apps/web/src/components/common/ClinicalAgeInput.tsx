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

  const [selectedUnit, setSelectedUnit] = useState<'years' | 'months' | 'days'>('years');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate logical bounds (years: 0-120, months: 1-11, days: 1-30)
  const validateAgeRange = (unit: 'years' | 'months' | 'days', val: string): string | null => {
    if (!val) return null;
    const num = parseInt(val, 10);
    if (isNaN(num)) return null;
    if (unit === 'years') {
      if (num < 0 || num > 120) return 'يجب أن يكون العمر بين 0 و 120 سنة';
    } else if (unit === 'months') {
      if (num < 1 || num > 11) return 'يجب أن يكون عدد الأشهر بين 1 و 11 شهراً';
    } else if (unit === 'days') {
      if (num < 1 || num > 30) return 'يجب أن يكون عدد الأيام بين 1 و 30 يوماً';
    }
    return null;
  };

  // Keep selectedUnit and localValue in sync with props when loaded from existing record
  useEffect(() => {
    if (birthDate && !years && !months && !days) {
      const parsed = new Date(birthDate);
      if (!isNaN(parsed.getTime())) {
        const breakdown = computeAgeBreakdown(parsed);
        if (breakdown.years > 0) {
          setSelectedUnit('years');
          setLocalValue(String(breakdown.years));
        } else if (breakdown.months > 0) {
          setSelectedUnit('months');
          setLocalValue(String(breakdown.months));
        } else {
          setSelectedUnit('days');
          setLocalValue(String(breakdown.days || 1));
        }
        return;
      }
    }
    if (days && !years && !months) {
      setSelectedUnit('days');
    } else if (months && !years && !days) {
      setSelectedUnit('months');
    } else if (years) {
      setSelectedUnit('years');
    }
  }, [years, months, days, birthDate]);

  // Derive current numeric value based on active unit
  const currentValue = selectedUnit === 'years' ? years : selectedUnit === 'months' ? months : days;

  // Local immediate state for ultra-fast, zero-delay typing responsiveness
  const [localValue, setLocalValue] = useState<string>(currentValue || '');

  // Keep localValue in sync whenever parent props change
  useEffect(() => {
    const val = currentValue || '';
    setLocalValue(val);
    setValidationError(validateAgeRange(selectedUnit, val));
  }, [currentValue, selectedUnit]);

  const emitAgeChange = (unit: 'years' | 'months' | 'days', cleanVal: string) => {
    const error = validateAgeRange(unit, cleanVal);
    setValidationError(error);

    const newYears = unit === 'years' ? cleanVal : '';
    const newMonths = unit === 'months' ? cleanVal : '';
    const newDays = unit === 'days' ? cleanVal : '';

    if (!cleanVal) {
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

    const yNum = unit === 'years' ? (parseInt(cleanVal, 10) || 0) : 0;
    const mNum = unit === 'months' ? (parseInt(cleanVal, 10) || 0) : 0;
    const dNum = unit === 'days' ? (parseInt(cleanVal, 10) || 0) : 0;

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

  const handleValueChange = (rawVal: string) => {
    const clean = toEnglishDigits(rawVal).replace(/[^0-9]/g, '');
    setLocalValue(clean);
    emitAgeChange(selectedUnit, clean);
  };

  const handleUnitChange = (newUnit: 'years' | 'months' | 'days') => {
    setSelectedUnit(newUnit);
    const activeVal = localValue || currentValue || '';
    if (activeVal) {
      emitAgeChange(newUnit, activeVal);
    }
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
      if (breakdown.years > 0) {
        setSelectedUnit('years');
        onChange({
          years: String(breakdown.years),
          months: breakdown.months > 0 ? String(breakdown.months) : '',
          days: breakdown.days > 0 ? String(breakdown.days) : '',
          birthDate: d.toISOString(),
          birthDateEstimated: false,
          legacyAgeYears: breakdown.years,
        });
      } else if (breakdown.months > 0) {
        setSelectedUnit('months');
        onChange({
          years: '',
          months: String(breakdown.months),
          days: breakdown.days > 0 ? String(breakdown.days) : '',
          birthDate: d.toISOString(),
          birthDateEstimated: false,
          legacyAgeYears: 0,
        });
      } else {
        setSelectedUnit('days');
        onChange({
          years: '',
          months: '',
          days: String(breakdown.days || 1),
          birthDate: d.toISOString(),
          birthDateEstimated: false,
          legacyAgeYears: 0,
        });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          htmlFor={`${idPrefix}-value`}
          className="input-label"
          style={{ fontSize: '11px', fontWeight: 800, margin: 0 }}
        >
          العمر
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 95px', gap: '6px' }}>
        {/* Age numeric input */}
        <input
          id={`${idPrefix}-value`}
          ref={firstInputRef}
          onKeyDown={onKeyDownFirst}
          type="text"
          inputMode="numeric"
          maxLength={3}
          placeholder="العمر..."
          className="input-control"
          style={{
            height: '38px',
            fontSize: '13.5px',
            fontWeight: 700,
            borderRadius: '8px',
            textAlign: 'center',
          }}
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
        />

        {/* Age unit select (default: years) */}
        <select
          id={`${idPrefix}-unit`}
          className="input-control"
          style={{
            height: '38px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '8px',
            padding: '0 8px',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-card, #ffffff)',
          }}
          value={selectedUnit}
          onChange={(e) => handleUnitChange(e.target.value as 'years' | 'months' | 'days')}
        >
          <option value="years">سنة</option>
          <option value="months">شهر</option>
          <option value="days">يوم</option>
        </select>
      </div>

      {validationError && (
        <span
          id={`${idPrefix}-error`}
          style={{
            fontSize: '11px',
            color: '#ef4444',
            fontWeight: 700,
            marginTop: '2px',
            display: 'block',
          }}
        >
          ⚠️ {validationError}
        </span>
      )}

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
