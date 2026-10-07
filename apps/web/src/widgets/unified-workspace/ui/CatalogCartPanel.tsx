'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Check,
  Lock,
} from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useToast } from '../../../components/Toast';

interface CatalogCartPanelProps {
  workspace: UnifiedWorkspaceReturn;
}

const CLINICAL_CATEGORIES = [
  { id: 'ALL', label: 'All Tests' },
  { id: 'HEMATOLOGY', label: 'Hematology' },
  { id: 'CHEMISTRY', label: 'Chemistry' },
  { id: 'HORMONES', label: 'Hormones' },
  { id: 'IMMUNOLOGY', label: 'Immunology' },
  { id: 'URINE_STOOL', label: 'GUE & GSE' },
  { id: 'VITAMINS_MARKERS', label: 'Vitamins & Markers' },
];

export default function CatalogCartPanel({ workspace }: CatalogCartPanelProps) {
  const toast = useToast();

  const {
    selectedTests,
    addTestToCart,
    removeTestFromCart,
    clearCart,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredCatalog,
    invoice,
  } = workspace;

  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Set of already selected test IDs for fast lookup
  const selectedTestIds = useMemo(() => {
    return new Set(selectedTests.map((t) => String(t.id)));
  }, [selectedTests]);

  // Set of selected test codes
  const selectedTestCodes = useMemo(() => {
    return new Set(selectedTests.map((t) => (t.code || '').toUpperCase().trim()).filter(Boolean));
  }, [selectedTests]);

  const isTestSelected = useCallback(
    (test: any) => {
      if (!test) return false;
      if (selectedTestIds.has(String(test.id))) return true;
      const code = (test.code || '').toUpperCase().trim();
      return code ? selectedTestCodes.has(code) : false;
    },
    [selectedTestIds, selectedTestCodes]
  );

  const handleToggleTest = (test: any) => {
    const selected = isTestSelected(test);
    if (selected) {
      removeTestFromCart(test.id);
      toast.info(`Removed ${test.name || test.code}`);
    } else {
      const added = addTestToCart(test);
      if (added) {
        toast.success(`Added ${test.name || test.code}`);
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCatalog.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredCatalog.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredCatalog.length) % filteredCatalog.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCatalog[highlightedIndex];
      if (target) {
        handleToggleTest(target);
      }
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
      }}
    >
      {/* 1. Header: Title Matching Approved Design */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-start' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
            }}
          >
            Selected: {selectedTests.length}
          </span>
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
          Test Catalog & Cart
        </h2>

        <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
          {selectedTests.length > 0 && (
            <button
              type="button"
              onClick={() => clearCart()}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#ef4444',
                backgroundColor: '#fee2e2',
                border: 'none',
                padding: '3px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Clear all cart items"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Bar */}
      <div style={{ flexShrink: 0, position: 'relative', marginBottom: '8px' }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search test by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          dir="auto"
          style={{
            width: '100%',
            height: '34px',
            paddingLeft: '34px',
            paddingRight: '32px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <Search
          size={15}
          color="#94a3b8"
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3. Category Filter Pills Row */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '8px',
        }}
      >
        {CLINICAL_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: 'none',
                backgroundColor: isActive ? '#334155' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 4. Unified Table: Expanded Layout without Discount */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          marginBottom: '8px',
        }}
      >
        {/* Table Header: Test Name (70%) | Price (30%) */}
        <div
          style={{
            flexShrink: 0,
            display: 'grid',
            gridTemplateColumns: '70% 30%',
            alignItems: 'center',
            padding: '8px 14px',
            backgroundColor: '#edf2f7',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#0d9488',
                fontWeight: 900,
              }}
            >
              ✓
            </span>
            <span>Test Name</span>
          </div>
          <div style={{ textAlign: 'right' }}>Price (IQD)</div>
        </div>

        {/* Table Body: List of tests with inner scroll */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {filteredCatalog.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
              No tests matching search or category.
            </div>
          ) : (
            filteredCatalog.map((test: any, idx: number) => {
              const selected = isTestSelected(test);
              const isHighlighted = highlightedIndex === idx;

              return (
                <div
                  key={test.id}
                  onClick={() => handleToggleTest(test)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70% 30%',
                    alignItems: 'center',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    backgroundColor: selected
                      ? 'rgba(13, 148, 136, 0.08)'
                      : isHighlighted
                      ? '#f8fafc'
                      : '#ffffff',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  {/* Test Checkbox & Name */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      overflow: 'hidden',
                      paddingRight: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: selected ? '1.5px solid #0d9488' : '1.5px solid #cbd5e1',
                        backgroundColor: selected ? '#0d9488' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#ffffff',
                      }}
                    >
                      {selected && <Check size={11} strokeWidth={3} />}
                    </div>

                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#0f172a',
                          fontSize: '12.5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {test.name || test.code}
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {test.category || 'Clinical Lab'} {test.code ? `• ${test.code}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Price in IQD */}
                  <div
                    style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      color: '#0f172a',
                      fontSize: '12.5px',
                    }}
                  >
                    {invoice.canSeePrices ? (
                      <span>IQD {Number(test.price || 0).toLocaleString('en-US')}</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>•••</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Bottom Section: Total Invoice Summary (Expanded, Zero Discount) */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
        }}
      >
        {!invoice.canSeePrices ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: '11.5px',
              color: '#64748b',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 700,
            }}
          >
            <Lock size={14} color="#0d9488" />
            <span>Pricing details are hidden for technician role</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', display: 'block' }}>
                Invoice Total
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Tests Count: {selectedTests.length}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#0d9488', display: 'block' }}>
                IQD {invoice.netTotal.toLocaleString('en-US')}
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>
                Net Payable
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
