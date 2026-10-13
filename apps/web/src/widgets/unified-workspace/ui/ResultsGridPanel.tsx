'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, ChevronDown, CheckCircle2, FileText } from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { classifyResultRange, matchPatientReferenceRange } from '@lab-manager/domain';
import { toEnglishDigits } from '../../../lib/formatters';

interface ResultsGridPanelProps {
  workspace: UnifiedWorkspaceReturn;
  onOpenSpecialModal?: (modalType: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'AMH' | 'BHCG' | 'CHEMISTRY' | 'MICROBIOLOGY', testId?: string) => void;
}

export function detectSpecialWorkstation(test: {
  id?: string;
  code?: string;
  testCode?: string;
  name?: string;
  testName?: string;
  category?: string;
  arabicName?: string | null;
}): 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'AMH' | 'BHCG' | 'CHEMISTRY' | 'MICROBIOLOGY' | null {
  const code = (test.testCode || test.code || test.id || '').toUpperCase().trim();
  const name = `${test.testName || ''} ${test.name || ''} ${test.arabicName || ''}`.toLowerCase().trim();
  const cat = (test.category || '').toUpperCase().trim();

  if (code === 'GUE' || code.includes('URINE') || name.includes('urine') || name.includes('إدرار') || name.includes('ادرار') || name.includes('بول')) return 'GUE';
  if (code === 'GSE' || code.includes('STOOL') || name.includes('stool') || name.includes('خروج') || name.includes('براز') || name.includes('غائط')) return 'GSE';
  if (code === 'CBC' || name.includes('cbc') || name.includes('blood count') || name.includes('صورة دم') || name.includes('تعداد دم')) return 'CBC';
  if (code === 'SFA' || code === 'SEMEN' || name.includes('semen') || name.includes('seminal') || name.includes('منوي') || name.includes('سائل منوي')) return 'SFA';
  if (code === 'AMH' || code.includes('AMH') || name.includes('anti-mullerian') || name.includes('mullerian') || name.includes('amh') || name.includes('مخزون')) return 'AMH';
  if (code === 'BHCG' || code === 'B-HCG' || code === 'HCG' || name.includes('beta-hcg') || name.includes('b-hcg') || name.includes('β-hcg') || name.includes('حمل رقمي') || (name.includes('hcg') && !name.includes('rapid'))) return 'BHCG';
  if (cat === 'MICROBIOLOGY' || code.includes('CULTURE') || name.includes('culture') || name.includes('مزرعة')) return 'MICROBIOLOGY';
  return null;
}

export default function ResultsGridPanel({
  workspace,
  onOpenSpecialModal,
}: ResultsGridPanelProps) {
  const { selectedTests, results, updateResultValue, patient, directLdlOverride, setDirectLdlOverride } = workspace;

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Group tests by category (Unconditional hook call to strictly adhere to React Rules of Hooks)
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof selectedTests> = {};
    selectedTests.forEach((test) => {
      const cat = test.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(test);
    });
    return groups;
  }, [selectedTests]);

  // 1. Collapsed Strip State (When no test is selected)
  if (selectedTests.length === 0) {
    return (
      <div
        style={{
          width: '68px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #d9e1e8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '24px 8px',
          height: '100%',
          flexShrink: 0,
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#e3f4f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f766e',
          }}
        >
          <Activity size={20} />
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#566574',
            letterSpacing: '0.5px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Results appear here after you select tests
        </div>
      </div>
    );
  }

  // 2. Expanded State Calculations
  const resultEntries = Object.values(results);
  const totalCount = selectedTests.length;
  const completedCount = selectedTests.filter((t) => {
    const val = results[t.id]?.value;
    return val !== undefined && val !== null && String(val).trim() !== '';
  }).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Keyboard navigation helper (Tab / Enter moves to next input)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentTestId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const allIds = selectedTests.map((t) => t.id);
      const currentIndex = allIds.indexOf(currentTestId);
      if (e.shiftKey) {
        if (currentIndex > 0) {
          const prevId = allIds[currentIndex - 1];
          inputRefs.current[prevId]?.focus();
        }
      } else {
        if (currentIndex < allIds.length - 1) {
          const nextId = allIds[currentIndex + 1];
          inputRefs.current[nextId]?.focus();
        }
      }
    }
  };

  return (
    <div
      style={{
        width: '520px',
        maxWidth: '540px',
        minWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #d9e1e8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #d9e1e8',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#14202b' }}>
            Clinical results
          </h2>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: completedCount === totalCount ? '#0f766e' : '#566574',
            }}
          >
            {completedCount} of {totalCount} tests complete
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#eef2f5',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#0f766e',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* 2. Grid Table Header (Exactly 4 columns: Test | Result | Unit | Reference range) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(120px, 1.3fr) 115px 60px minmax(110px, 1.3fr)',
          padding: '8px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #d9e1e8',
          fontSize: '12px',
          fontWeight: 700,
          color: '#566574',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>Test</div>
        <div style={{ minWidth: 0 }}>Result</div>
        <div style={{ minWidth: 0 }}>Unit</div>
        <div style={{ minWidth: 0 }}>Reference range</div>
      </div>

      {/* 3. Grid Table Body (Grouped by Category) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 0',
        }}
      >
        {Object.entries(groupedByCategory).map(([categoryName, tests]) => (
          <div key={categoryName} style={{ marginBottom: '8px' }}>
            {/* Category Subheader */}
            <div
              style={{
                padding: '6px 16px',
                backgroundColor: '#f1f5f9',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {categoryName}
            </div>

            {/* Rows in Category */}
            {tests.map((test) => {
              const res = results[test.id] || {
                testId: test.id,
                testName: test.name,
                value: '',
                unit: test.unit || '',
                refRangeText: test.refRangeText || '',
                status: 'NONE',
              };

              const specialModalType = detectSpecialWorkstation(test);

              // Resolve patient reference range
              const patientCtx = {
                gender: patient.gender,
                age: typeof patient.ageYears === 'number' ? patient.ageYears : undefined,
                birthDate: patient.birthDate || undefined,
              };

              // Clinical range & flag classification via single shared domain function
              const classification = classifyResultRange(res.value, test, patientCtx);

              const isHigh = classification.flag === 'HIGH';
              const isLow = classification.flag === 'LOW';

              // Gender / Age badge chip
              const matchedRange = test.referenceRanges
                ? matchPatientReferenceRange(test.referenceRanges, patientCtx)
                : null;
              const rangeChipText = matchedRange?.label || (patient.gender === 'FEMALE' ? 'F' : patient.gender === 'MALE' ? 'M' : 'Any');

              return (
                <div key={test.id}>
                  {/* Standard Test Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(120px, 1.3fr) 115px 60px minmax(110px, 1.3fr)',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '13px',
                    }}
                  >
                    {/* Column 1: Test Name & Code */}
                    <div style={{ minWidth: 0, paddingRight: '8px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#14202b',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: '1.3',
                          fontSize: '12.5px',
                          direction: 'ltr',
                          unicodeBidi: 'isolate',
                          textAlign: 'left',
                        }}
                        title={test.name}
                      >
                        {test.name}
                      </div>
                      {test.code && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#566574',
                            direction: 'ltr',
                            unicodeBidi: 'isolate',
                          }}
                        >
                          {test.code}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Result Input or Specialized Form Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px' }}>
                      {specialModalType ? (
                        <button
                          type="button"
                          onClick={() => onOpenSpecialModal?.(specialModalType, test.id)}
                          title={res.value ? 'تعديل بيانات الفحص التخصصي' : 'فتح فورمة الفحص التخصصي الجاهزة'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            height: '32px',
                            padding: '0 12px',
                            backgroundColor: res.value ? '#f0fdf4' : '#0f766e',
                            color: res.value ? '#15803d' : '#ffffff',
                            border: res.value ? '1px solid #86efac' : 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: res.value ? '0 1px 2px rgba(0,0,0,0.04)' : '0 1px 3px rgba(15, 118, 110, 0.25)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {res.value ? (
                            <>
                              <CheckCircle2 size={13} color="#15803d" />
                              <span>مكتمل ({specialModalType === 'AMH' ? 'AMH' : specialModalType === 'BHCG' ? 'β-HCG' : 'تعديل'})</span>
                            </>
                          ) : (
                            <>
                              <FileText size={13} />
                              <span>{specialModalType === 'AMH' ? 'فورمة AMH' : specialModalType === 'BHCG' ? 'فورمة β-HCG' : 'ملء الفورمة'}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <input
                            ref={(el) => {
                              inputRefs.current[test.id] = el;
                            }}
                            type="text"
                            value={res.value}
                            onChange={(e) => updateResultValue(test.id, e.target.value)}
                            onKeyDown={(e) => handleInputKeyDown(e, test.id)}
                            disabled={test.isCalculated && !res.isDirectOverride}
                            placeholder={test.isCalculated ? 'Auto' : '—'}
                            style={{
                              width: '80px',
                              height: '32px',
                              padding: '0 8px',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: '#14202b',
                              backgroundColor: test.isCalculated ? '#f8fafc' : '#ffffff',
                              border: isHigh
                                ? '1px solid #c62828'
                                : isLow
                                ? '1px solid #1d4ed8'
                                : '1px solid #d9e1e8',
                              borderRadius: '6px',
                              outline: 'none',
                              direction: 'ltr',
                              unicodeBidi: 'isolate',
                              boxSizing: 'border-box',
                            }}
                            onFocus={(e) => {
                              if (!isHigh && !isLow) e.target.style.borderColor = '#0f766e';
                            }}
                            onBlur={(e) => {
                              if (!isHigh && !isLow) e.target.style.borderColor = '#d9e1e8';
                            }}
                          />

                          {/* Flag Badge: H ↑ (red) or L ↓ (blue) */}
                          {isHigh && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#c62828',
                                backgroundColor: '#fdecec',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                direction: 'ltr',
                                unicodeBidi: 'isolate',
                              }}
                            >
                              H ↑
                            </span>
                          )}
                          {isLow && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#1d4ed8',
                                backgroundColor: '#e8effe',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                direction: 'ltr',
                                unicodeBidi: 'isolate',
                              }}
                            >
                              L ↓
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Column 3: Unit (LTR isolate) */}
                    <div
                      style={{
                        minWidth: 0,
                        fontSize: '11.5px',
                        color: specialModalType ? '#0f766e' : '#566574',
                        fontWeight: specialModalType ? 600 : 400,
                        direction: 'ltr',
                        unicodeBidi: 'isolate',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        lineHeight: '1.2',
                      }}
                    >
                      {test.unit || (specialModalType ? 'Form' : '—')}
                    </div>

                    {/* Column 4: Reference Range (LTR isolate) + Matching Chip */}
                    <div style={{ minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          lineHeight: '1.3',
                          color: specialModalType ? '#566574' : '#14202b',
                          fontStyle: specialModalType && !test.refRangeText ? 'italic' : 'normal',
                          direction: 'ltr',
                          unicodeBidi: 'isolate',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {classification.matchedRangeText || res.refRangeText || test.refRangeText || (specialModalType ? 'Structured Report' : '—')}
                      </span>
                      {!specialModalType && test.referenceRanges && test.referenceRanges.length > 0 && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#566574',
                            backgroundColor: '#eef2f5',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            cursor: 'default',
                            flexShrink: 0,
                          }}
                          title="Reference range resolved by patient age and sex"
                        >
                          {rangeChipText} <ChevronDown size={9} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 4. Panel Footer: Clinical Flags Legend (Matching approved mockups) */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #d9e1e8',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#566574',
          flexShrink: 0,
        }}
      >
        <span>Flags also print on the report</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>below range</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#1d4ed8',
                backgroundColor: '#e8effe',
                padding: '2px 6px',
                borderRadius: '4px',
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              L ↓
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>above range</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#c62828',
                backgroundColor: '#fdecec',
                padding: '2px 6px',
                borderRadius: '4px',
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              H ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
