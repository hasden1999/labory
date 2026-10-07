'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { toEnglishDigits } from '../../../lib/formatters';

interface ResultsGridPanelProps {
  workspace: UnifiedWorkspaceReturn;
  className?: string;
  style?: React.CSSProperties;
  onOpenSpecialModal?: (modalType: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'CHEMISTRY' | 'MICROBIOLOGY') => void;
}

export function detectSpecialWorkstation(test: { testCode?: string; testName?: string; category?: string }): 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'CHEMISTRY' | 'MICROBIOLOGY' | null {
  const code = (test.testCode || '').toUpperCase().trim();
  const name = (test.testName || '').toLowerCase().trim();
  const cat = (test.category || '').toUpperCase().trim();

  if (code === 'GUE' || name.includes('urine') || name.includes('إدرار')) return 'GUE';
  if (code === 'GSE' || name.includes('stool') || name.includes('خروج') || name.includes('براز')) return 'GSE';
  if (code === 'CBC' || name.includes('cbc') || name.includes('blood count')) return 'CBC';
  if (code === 'SFA' || code === 'SEMEN' || name.includes('semen') || name.includes('seminal') || name.includes('منوي')) return 'SFA';
  if (cat === 'MICROBIOLOGY' || code.includes('CULTURE') || name.includes('culture') || name.includes('مزرعة')) return 'MICROBIOLOGY';
  return null;
}

export default function ResultsGridPanel({
  workspace,
  className,
  style,
  onOpenSpecialModal,
}: ResultsGridPanelProps) {
  const resultEntries = Object.values(workspace.results);
  const resultCount = resultEntries.length;

  const ldlRow = resultEntries.find(
    (r) => r.invalidReason || ((r.testCode || '').toUpperCase().includes('LDL') && r.invalidReason)
  );
  const lipidWarning = ldlRow?.invalidReason;

  const handleLdlOverrideChange = (valStr: string) => {
    const clean = toEnglishDigits(valStr);
    if (!clean) {
      workspace.setDirectLdlOverride(null);
    } else {
      const parsed = parseFloat(clean);
      workspace.setDirectLdlOverride(isNaN(parsed) ? null : parsed);
    }
  };

  return (
    <div
      dir="ltr"
      className={className}
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
        ...style,
      }}
    >
      {/* 1. Header: Title Matching LTR Clinical Design */}
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
            Results: {resultCount}
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
          Clinical Results Grid
        </h2>

        <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
          {resultCount > 0 && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#0d9488',
                backgroundColor: '#f0fdfa',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #99f6e4',
              }}
            >
              Direct Entry
            </span>
          )}
        </div>
      </div>

      {/* Direct LDL Manual Input Warning (When TG >= 400 mg/dL) */}
      {lipidWarning && (
        <div
          style={{
            flexShrink: 0,
            marginBottom: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 800, marginBottom: '4px' }}>
            <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0 }} />
            <span>Clinical Notice: {lipidWarning}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400e' }}>
              Direct LDL Override:
            </span>
            <input
              type="text"
              placeholder="Value..."
              value={workspace.directLdlOverride != null ? String(workspace.directLdlOverride) : ''}
              onChange={(e) => handleLdlOverrideChange(e.target.value)}
              style={{
                width: '74px',
                height: '24px',
                padding: '0 6px',
                fontSize: '11.5px',
                fontWeight: 800,
                textAlign: 'center',
                border: '1px solid #d97706',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#92400e',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '10.5px', color: '#b45309' }}>mg/dL</span>
          </div>
        </div>
      )}

      {/* 2. Results Table with Fixed Header & Scrollable Body */}
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
        }}
      >
        {/* Table Header: Test Name (38%) | Ref Range (26%) | Value (20%) | Status (16%) */}
        <div
          style={{
            flexShrink: 0,
            display: 'grid',
            gridTemplateColumns: '38% 26% 20% 16%',
            alignItems: 'center',
            padding: '8px 14px',
            backgroundColor: '#edf2f7',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#334155',
          }}
        >
          <div>Test Analyte</div>
          <div style={{ textAlign: 'center' }}>Reference Interval</div>
          <div style={{ textAlign: 'center' }}>Result Value</div>
          <div style={{ textAlign: 'right' }}>Status</div>
        </div>

        {/* Table Body: Scrollable Results Rows */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {resultCount === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '36px 16px',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              <Activity size={36} color="#0d9488" style={{ marginBottom: '10px', opacity: 0.6 }} />
              <p style={{ fontWeight: 800, fontSize: '13px', color: '#334155', margin: '0 0 4px 0' }}>
                No Tests Selected
              </p>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', maxWidth: '250px', lineHeight: 1.4 }}>
                Select laboratory tests from the center panel to enter clinical values and auto-calculated formulas here.
              </span>
            </div>
          ) : (
            resultEntries.map((item) => {
              const specialType = detectSpecialWorkstation(item);

              return (
                <React.Fragment key={item.testId}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '38% 26% 20% 16%',
                      alignItems: 'center',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    {/* Col 1: Test Name & Special Workstation button */}
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#0f172a',
                          fontSize: '12.5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{item.testName}</span>
                        {specialType && onOpenSpecialModal && (
                          <button
                            type="button"
                            onClick={() => onOpenSpecialModal(specialType)}
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 900,
                              color: '#0284c7',
                              backgroundColor: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title={`Open ${specialType} Workstation Form`}
                          >
                            Form ↗
                          </button>
                        )}
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
                        {item.testCode || (item.isCalculated ? 'Calculated' : 'Clinical Test')}
                        {item.unit ? ` (${item.unit})` : ''}
                      </div>
                    </div>

                    {/* Col 2: Reference Interval (LTR isolate) */}
                    <div style={{ textAlign: 'center' }}>
                      <span
                        dir="ltr"
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#475569',
                          display: 'inline-block',
                          unicodeBidi: 'isolate',
                        }}
                      >
                        {item.refRangeText || '-'}
                      </span>
                    </div>

                    {/* Col 3: Result Value */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      {specialType ? (
                        <button
                          type="button"
                          onClick={() => onOpenSpecialModal && onOpenSpecialModal(specialType)}
                          style={{
                            width: '100%',
                            maxWidth: '110px',
                            height: '30px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: item.value ? '#f0fdf4' : '#f0f9ff',
                            color: item.value ? '#15803d' : '#0284c7',
                            border: item.value ? '1.5px solid #86efac' : '1.5px solid #7dd3fc',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            padding: '0 6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'all 0.15s ease',
                          }}
                          title={`Click to open ${specialType} Specialized Form`}
                        >
                          <span>{item.value ? '✓ Filled' : `Open ${specialType}`}</span>
                          <span style={{ fontSize: '9px' }}>↗</span>
                        </button>
                      ) : (
                        <input
                          type="text"
                          placeholder="-"
                          value={item.value}
                          dir="auto"
                          data-shift-nav={item.isCalculated ? undefined : 'result'}
                          onChange={(e) => workspace.updateResultValue(item.testId, e.target.value, false)}
                          readOnly={item.isCalculated}
                          style={{
                            width: '64px',
                            height: '30px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border:
                              item.status === 'PANIC'
                                ? '2px solid #dc2626'
                                : item.status === 'HIGH'
                                ? '1.5px solid #ef4444'
                                : item.status === 'LOW'
                                ? '1.5px solid #f59e0b'
                                : '1px solid #cbd5e1',
                            backgroundColor: item.isCalculated ? '#f8fafc' : '#ffffff',
                            color:
                              item.status === 'HIGH' || item.status === 'PANIC'
                                ? '#dc2626'
                                : item.status === 'LOW'
                                ? '#d97706'
                                : '#0f172a',
                            outline: 'none',
                            cursor: item.isCalculated ? 'not-allowed' : 'text',
                          }}
                        />
                      )}
                    </div>

                    {/* Col 4: Status Badges */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {item.status === 'NORMAL' && (
                        <div
                          style={{
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textAlign: 'center',
                            minWidth: '56px',
                          }}
                        >
                          NORMAL
                        </div>
                      )}

                      {item.status === 'HIGH' && (
                        <div
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textAlign: 'center',
                            minWidth: '56px',
                          }}
                        >
                          HIGH ↑
                        </div>
                      )}

                      {item.status === 'LOW' && (
                        <div
                          style={{
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textAlign: 'center',
                            minWidth: '56px',
                          }}
                        >
                          LOW ↓
                        </div>
                      )}

                      {item.status === 'PANIC' && (
                        <div
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 900,
                            textAlign: 'center',
                            minWidth: '56px',
                            boxShadow: '0 0 8px rgba(220, 38, 38, 0.4)',
                          }}
                        >
                          PANIC !!
                        </div>
                      )}

                      {item.status === 'NONE' && (
                        <span style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'center', minWidth: '56px' }}>
                          -
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Auto-calculation banner under calculated rows */}
                  {item.isCalculated && (
                    <div
                      style={{
                        padding: '3px 14px',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        fontWeight: 800,
                        borderTop: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#e2e8f0',
                          color: '#334155',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontFamily: 'monospace',
                        }}
                      >
                        Auto Calculation
                      </span>
                      <span style={{ color: '#0d9488' }}>
                        Clinical Formulation Engine
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
