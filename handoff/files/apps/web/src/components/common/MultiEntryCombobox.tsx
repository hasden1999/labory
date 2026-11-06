'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, Trash2 } from 'lucide-react';

export interface MultiEntryItem {
  id: string;
  name: string;
  secondValue: string; // Quantity in Urine, Stage in Stool
}

export interface MultiEntryComboboxProps {
  label: string;
  items: MultiEntryItem[];
  onChange: (items: MultiEntryItem[]) => void;
  nameSuggestions: string[];
  namePlaceholder?: string;
  secondFieldLabel?: string;
  secondSuggestions?: string[];
  secondPlaceholder?: string;
  addButtonText: string;
  emptyStateText?: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
}

export const generateUniqueId = (): string => {
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
};

export interface ComboboxInputProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  ariaLabel?: string;
  minWidth?: string;
  style?: React.CSSProperties;
}

export const SingleCombobox = ({
  value,
  onChange,
  suggestions,
  placeholder,
  ariaLabel,
  minWidth = '140px',
  style = {},
}: ComboboxInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes((value || '').toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          e.preventDefault();
          onChange(filtered[highlightedIndex]);
          setIsOpen(false);
          setHighlightedIndex(-1);
        } else {
          // Keep typed value, just close dropdown
          setIsOpen(false);
        }
      } else if (e.key === 'Tab') {
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          onChange(filtered[highlightedIndex]);
        }
        setIsOpen(false);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, minWidth }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          dir="auto"
          aria-label={ariaLabel}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '7px 28px 7px 10px',
            fontSize: '12.5px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #cbd5e1)',
            background: 'var(--bg-input, #ffffff)',
            color: 'var(--text-main, #0f172a)',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease',
            ...style,
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && inputRef.current) {
              inputRef.current.focus();
            }
          }}
          style={{
            position: 'absolute',
            right: '6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 999,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxHeight: '190px',
            overflowY: 'auto',
            padding: '4px',
            margin: 0,
            listStyle: 'none',
          }}
        >
          {filtered.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={item}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur before selection
                  onChange(item);
                  setIsOpen(false);
                  setHighlightedIndex(-1);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: isHighlighted ? '#e0f2fe' : 'transparent',
                  color: isHighlighted ? '#0369a1' : '#1e293b',
                  fontWeight: isHighlighted ? 600 : 400,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  direction: 'ltr',
                  textAlign: 'left',
                }}
              >
                <span>{item}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default function MultiEntryCombobox({
  label,
  items,
  onChange,
  nameSuggestions,
  namePlaceholder = 'اختر أو اكتب الاسم...',
  secondFieldLabel = 'الكمية (Quantity)',
  secondSuggestions = ['Few', '+', '++', '+++', 'Many'],
  secondPlaceholder = 'الكمية...',
  addButtonText,
  emptyStateText = 'لم تتم إضافة أي عناصر بعد.',
  badgeColor = '#0369a1',
  badgeBg = '#f0f9ff',
  badgeBorder = '#bae6fd',
}: MultiEntryComboboxProps) {
  const handleAddItem = () => {
    const newItem: MultiEntryItem = {
      id: generateUniqueId(),
      name: '',
      secondValue: '',
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: 'name' | 'secondValue', value: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onChange(updated);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        padding: '12px 14px',
        marginBottom: '12px',
      }}
    >
      {/* Header with Title and Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: 'var(--text-main, #0f172a)',
            }}
          >
            {label}
          </span>
          {items.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: badgeColor,
                background: badgeBg,
                border: `1px solid ${badgeBorder}`,
                padding: '1px 7px',
                borderRadius: '999px',
              }}
            >
              {items.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '6px',
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <Plus size={14} />
          <span>{addButtonText}</span>
        </button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div
          style={{
            padding: '10px 12px',
            fontSize: '12px',
            color: '#64748b',
            background: 'var(--bg-input, #f8fafc)',
            borderRadius: '6px',
            border: '1px dashed var(--border-color, #cbd5e1)',
            textAlign: 'center',
          }}
        >
          {emptyStateText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'var(--bg-input, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                #{index + 1}
              </span>

              {/* Primary Name Field (Combobox) */}
              <SingleCombobox
                value={item.name}
                onChange={(val) => handleUpdateItem(item.id, 'name', val)}
                suggestions={nameSuggestions}
                placeholder={namePlaceholder}
                ariaLabel={`${label} ${index + 1}`}
                minWidth="200px"
              />

              {/* Second Field (Quantity or Stage) */}
              <div style={{ width: '150px' }}>
                <SingleCombobox
                  value={item.secondValue}
                  onChange={(val) => handleUpdateItem(item.id, 'secondValue', val)}
                  suggestions={secondSuggestions}
                  placeholder={secondPlaceholder}
                  ariaLabel={`${secondFieldLabel} ${index + 1}`}
                  minWidth="130px"
                />
              </div>

              {/* Delete Button (×) */}
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                title="حذف العنصر"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
