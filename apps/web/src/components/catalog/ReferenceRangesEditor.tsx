import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

export interface ReferenceRangeItem {
  id?: string;
  label: string;
  sex: 'any' | 'M' | 'F';
  ageMin: number | null;
  ageMax: number | null;
  ageUnit: 'years' | 'months' | 'days';
  low: number | null;
  high: number | null;
  text?: string | null;
  unit?: string | null;
  note?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  isUserEdited?: boolean;
  sortOrder?: number;
  valueType?: 'numeric' | 'text';
}

interface ReferenceRangesEditorProps {
  testName: string;
  unit: string;
  ranges: ReferenceRangeItem[];
  onChange: (ranges: ReferenceRangeItem[]) => void;
  criticalLow?: string | number | null;
  criticalHigh?: string | number | null;
  onCriticalChange?: (low: string, high: string) => void;
}

const COMMON_LABELS = [
  'للجميع',
  'رجال',
  'نساء',
  'أطفال',
  'حديثي الولادة',
  'رضع',
  'كبار السن',
];

export default function ReferenceRangesEditor({
  testName,
  unit,
  ranges,
  onChange,
  criticalLow,
  criticalHigh,
  onCriticalChange,
}: ReferenceRangesEditorProps) {
  // Live Simulator state
  const [simSex, setSimSex] = useState<'M' | 'F'>('M');
  const [simAge, setSimAge] = useState<string>('25');
  const [simAgeUnit, setSimAgeUnit] = useState<'years' | 'months' | 'days'>('years');
  const [simResult, setSimResult] = useState<string>('');
  const [simMode, setSimMode] = useState<'auto' | 'all' | 'manual'>('auto');
  const [selectedManualIndex, setSelectedManualIndex] = useState<number>(0);

  // Template Handlers
  const handleApplyTemplate = (type: 'all' | 'mf' | 'mfc' | 'qualitative') => {
    const timestamp = Date.now();
    let newRanges: ReferenceRangeItem[] = [];

    if (type === 'qualitative') {
      newRanges = [
        {
          id: `rr_qual_${timestamp}`,
          label: 'للجميع',
          sex: 'any',
          ageMin: 0,
          ageMax: null,
          ageUnit: 'years',
          low: null,
          high: null,
          text: 'Negative',
          valueType: 'text',
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 0,
        },
      ];
    } else if (type === 'all') {
      newRanges = [
        {
          id: `rr_all_${timestamp}`,
          label: 'للجميع',
          sex: 'any',
          ageMin: 0,
          ageMax: null,
          ageUnit: 'years',
          low: null,
          high: null,
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 0,
        },
      ];
    } else if (type === 'mf') {
      newRanges = [
        {
          id: `rr_m_${timestamp}`,
          label: 'رجال',
          sex: 'M',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: null,
          high: null,
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 0,
        },
        {
          id: `rr_f_${timestamp + 1}`,
          label: 'نساء',
          sex: 'F',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: null,
          high: null,
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 1,
        },
      ];
    } else if (type === 'mfc') {
      newRanges = [
        {
          id: `rr_c_${timestamp}`,
          label: 'أطفال',
          sex: 'any',
          ageMin: 0,
          ageMax: 18,
          ageUnit: 'years',
          low: null,
          high: null,
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 0,
        },
        {
          id: `rr_m_${timestamp + 1}`,
          label: 'رجال',
          sex: 'M',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: null,
          high: null,
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 1,
        },
        {
          id: `rr_f_${timestamp + 2}`,
          label: 'نساء',
          sex: 'F',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: null,
          high: null,
          unit: unit || null,
          isUserEdited: true,
          sortOrder: 2,
        },
      ];
    }

    onChange(newRanges);
    setSelectedManualIndex(0);
  };

  // Row Manipulation Handlers
  const handleAddRow = () => {
    const newRow: ReferenceRangeItem = {
      id: `rr_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: ranges.length === 0 ? 'للجميع' : `فئة ${ranges.length + 1}`,
      sex: 'any',
      ageMin: 0,
      ageMax: null,
      ageUnit: 'years',
      low: null,
      high: null,
      unit: unit || null,
      isUserEdited: true,
      sortOrder: ranges.length,
    };
    onChange([...ranges, newRow]);
  };

  const handleUpdateRow = (index: number, field: keyof ReferenceRangeItem, val: any) => {
    const updated = [...ranges];
    updated[index] = {
      ...updated[index],
      [field]: val,
      isUserEdited: true,
    };
    onChange(updated);
  };

  const handleRemoveRow = (index: number) => {
    const updated = ranges.filter((_, i) => i !== index);
    onChange(updated);
    if (selectedManualIndex >= updated.length) {
      setSelectedManualIndex(Math.max(0, updated.length - 1));
    }
  };

  // Clinical Validation Check
  const validation = useMemo(() => {
    if (ranges.length === 0) {
      return {
        valid: true,
        message: 'لا توجد فئات محددة — يمكنك البدء من قالب سريع أو إضافة فئة جديدة.',
        type: 'info' as const,
      };
    }

    // Check for overlap per sex
    for (const targetSex of ['M', 'F'] as const) {
      const relevant = ranges.filter((r) => r.sex === targetSex || r.sex === 'any');
      if (relevant.length <= 1) continue;

      for (let i = 0; i < relevant.length; i++) {
        for (let j = i + 1; j < relevant.length; j++) {
          const r1 = relevant[i];
          const r2 = relevant[j];

          const toDays = (val: number | null, u: 'years' | 'months' | 'days', def: number): number => val == null ? def : (u === 'years' ? val * 365.25 : u === 'months' ? val * 30.4375 : val);
          const r1Min = toDays(r1.ageMin, r1.ageUnit, 0);
          const r1Max = toDays(r1.ageMax, r1.ageUnit, Infinity);

          const r2Min = toDays(r2.ageMin, r2.ageUnit, 0);
          const r2Max = toDays(r2.ageMax, r2.ageUnit, Infinity);

          if (r1.sex === r2.sex) {
            if (r1Min < r2Max && r2Min < r1Max) {
              return {
                valid: false,
                message: `تنبيه: يوجد تداخل في الفئات العمرية (${r1.label} و ${r2.label}) لنفس الجنس`,
                type: 'warning' as const,
              };
            }
          }
        }
      }
    }

    return {
      valid: true,
      message: 'القيم مكتملة، لا تداخل ولا ثغرات في الأعمار',
      type: 'success' as const,
    };
  }, [ranges]);

  // Simulator Matching Logic
  const simMatchedRange = useMemo(() => {
    if (ranges.length === 0) return null;

    if (simMode === 'manual') {
      return ranges[selectedManualIndex] || ranges[0] || null;
    }

    const numAge = parseFloat(simAge) || 0;
    const ageInDays = simAgeUnit === 'years' ? numAge * 365.25 : simAgeUnit === 'months' ? numAge * 30.4375 : numAge;

    const matched = ranges.filter((r) => {
      if (r.sex !== 'any' && r.sex !== simSex) return false;

      if (r.ageMin != null) {
        const minInDays = r.ageUnit === 'years' ? r.ageMin * 365.25 : r.ageUnit === 'months' ? r.ageMin * 30.4375 : r.ageMin;
        if (ageInDays < minInDays) return false;
      }

      if (r.ageMax != null) {
        const maxInDays = r.ageUnit === 'years' ? r.ageMax * 365.25 : r.ageUnit === 'months' ? r.ageMax * 30.4375 : r.ageMax;
        if (ageInDays > maxInDays) return false;
      }

      return true;
    });

    if (matched.length === 0) return ranges[0] || null;

    // Prioritize specific sex over 'any'
    return matched.sort((a, b) => {
      const aSex = a.sex !== 'any' ? 2 : 0;
      const bSex = b.sex !== 'any' ? 2 : 0;
      if (bSex !== aSex) return bSex - aSex;
      const aAge = (a.ageMin != null ? 1 : 0) + (a.ageMax != null ? 1 : 0);
      const bAge = (b.ageMin != null ? 1 : 0) + (b.ageMax != null ? 1 : 0);
      return bAge - aAge;
    })[0];
  }, [ranges, simSex, simAge, simAgeUnit, simMode, selectedManualIndex]);

  // Simulator Result Classification
  const simEvaluation = useMemo(() => {
    if (!simResult.trim()) {
      return { flag: 'NONE', status: 'EMPTY', text: 'أدخل قيمة النتيجة للمعاينة' };
    }

    const val = parseFloat(simResult);
    if (isNaN(val)) {
      if (simMatchedRange?.text) {
        const cleanResult = simResult.trim().toLowerCase();
        const cleanRef = simMatchedRange.text.trim().toLowerCase();
        if (cleanResult === cleanRef || cleanRef.includes(cleanResult) || cleanResult.includes(cleanRef)) {
          return { flag: 'NORMAL', status: 'NORMAL', text: 'طبيعي / متطابق مع المدى (Normal)' };
        } else if ((cleanResult.includes('pos') && cleanRef.includes('neg')) || (cleanResult.includes('react') && cleanRef.includes('non'))) {
          return { flag: 'HIGH', status: 'ABNORMAL', text: 'إيجابي / غير طبيعي (Abnormal)' };
        }
      }
      return { flag: 'TEXT', status: 'TEXT', text: 'قيمة وصفية' };
    }

    if (!simMatchedRange || (simMatchedRange.low == null && simMatchedRange.high == null && !simMatchedRange.text)) {
      return { flag: 'NONE', status: 'NO_RANGE', text: 'لا يوجد مدى محدد' };
    }

    const low = simMatchedRange.low;
    const high = simMatchedRange.high;

    if (low != null && val < low) {
      return { flag: 'LOW', status: 'LOW', text: 'منخفض (Low)' };
    }
    if (high != null && val > high) {
      return { flag: 'HIGH', status: 'HIGH', text: 'مرتفع (High)' };
    }
    return { flag: 'NORMAL', status: 'NORMAL', text: 'طبيعي (Normal)' };
  }, [simResult, simMatchedRange]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px',
        borderRadius: '10px',
        border: '1.5px solid var(--accent-cyan, #06b6d4)',
        background: 'var(--bg-card, #1e293b)',
        color: 'var(--text-main, #f8fafc)',
      }}
    >
      {/* Header & Quick Templates */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          paddingBottom: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent-cyan, #06b6d4)' }}>
              {testName || 'الفحص المخبري'}
            </span>
            {unit && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700 }} dir="ltr">
                {unit}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              (المديات المرجعية الطبيعية)
            </span>
          </div>
        </div>

        {/* 1-Click Templates Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700 }}>
            ابدأ من قالب:
          </span>
          <button
            type="button"
            onClick={() => handleApplyTemplate('all')}
            className="btn-secondary"
            style={{
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            للجميع
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('mf')}
            className="btn-secondary"
            style={{
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            رجال / نساء
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('mfc')}
            className="btn-secondary"
            style={{
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            رجال / نساء / أطفال
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('qualitative')}
            className="btn-secondary"
            style={{
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            فحص وصفي (Negative للجميع)
          </button>
        </div>
      </div>

      {/* Inline Editable Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'right',
          }}
        >
          <thead>
            <tr style={{ color: 'var(--text-muted, #94a3b8)', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
              <th style={{ padding: '6px 8px', fontWeight: 700, width: '20%' }}>الفئة</th>
              <th style={{ padding: '6px 8px', fontWeight: 700, width: '15%' }}>الجنس</th>
              <th style={{ padding: '6px 8px', fontWeight: 700, width: '22%' }}>العمر (من - إلى)</th>
              <th style={{ padding: '6px 8px', fontWeight: 700, width: '14%' }}>نوع القيمة</th>
              <th style={{ padding: '6px 8px', fontWeight: 700, width: '25%' }}>المدى المرجعي / القيمة</th>
              <th style={{ padding: '6px 4px', width: '4%' }}></th>
            </tr>
          </thead>
          <tbody>
            {ranges.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted, #94a3b8)',
                    fontStyle: 'italic',
                  }}
                >
                  لا توجد فئات مسجلة — اضغط على أحد القوالب أعلاه أو انقر على "+ إضافة فئة" للبدء
                </td>
              </tr>
            ) : (
              ranges.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  style={{
                    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  {/* Category / Label */}
                  <td style={{ padding: '6px 4px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={row.label || ''}
                        onChange={(e) => handleUpdateRow(idx, 'label', e.target.value)}
                        placeholder="مثال: رجال"
                        className="input-control"
                        list={`labels-list-${idx}`}
                        style={{ fontSize: '11.5px', padding: '4px 8px', height: '32px' }}
                      />
                      <datalist id={`labels-list-${idx}`}>
                        {COMMON_LABELS.map((lbl) => (
                          <option key={lbl} value={lbl} />
                        ))}
                      </datalist>
                    </div>
                  </td>

                  {/* Sex */}
                  <td style={{ padding: '6px 4px' }}>
                    <select
                      value={row.sex}
                      onChange={(e) => handleUpdateRow(idx, 'sex', e.target.value as any)}
                      className="input-control"
                      style={{ fontSize: '11.5px', padding: '4px 6px', height: '32px' }}
                    >
                      <option value="any">كلاهما</option>
                      <option value="M">ذكر</option>
                      <option value="F">أنثى</option>
                    </select>
                  </td>

                  {/* Age Range & Unit */}
                  <td style={{ padding: '6px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.ageMin != null ? row.ageMin : ''}
                        onChange={(e) => handleUpdateRow(idx, 'ageMin', e.target.value !== '' ? Number(e.target.value) : null)}
                        placeholder="0"
                        className="input-control"
                        style={{ width: '48px', fontSize: '11px', textAlign: 'center', padding: '2px 4px', height: '32px' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.ageMax != null ? row.ageMax : ''}
                        onChange={(e) => handleUpdateRow(idx, 'ageMax', e.target.value !== '' ? Number(e.target.value) : null)}
                        placeholder="∞"
                        className="input-control"
                        style={{ width: '48px', fontSize: '11px', textAlign: 'center', padding: '2px 4px', height: '32px' }}
                      />
                      <select
                        value={row.ageUnit}
                        onChange={(e) => handleUpdateRow(idx, 'ageUnit', e.target.value as any)}
                        className="input-control"
                        style={{ width: '64px', fontSize: '11px', padding: '2px 4px', height: '32px' }}
                      >
                        <option value="years">سنة</option>
                        <option value="months">شهر</option>
                        <option value="days">يوم</option>
                      </select>
                    </div>
                  </td>

                  {/* Value Type Toggle (Numeric vs Text) */}
                  <td style={{ padding: '6px 4px' }}>
                    {(() => {
                      const isTextType = row.valueType === 'text' || (Boolean(row.text) && row.low == null && row.high == null);
                      return (
                        <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color, #cbd5e1)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...ranges];
                              updated[idx] = {
                                ...updated[idx],
                                valueType: 'numeric',
                                text: null,
                                isUserEdited: true,
                              };
                              onChange(updated);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              background: !isTextType ? 'var(--accent-cyan, #0284c7)' : 'transparent',
                              color: !isTextType ? '#ffffff' : 'var(--text-muted, #64748b)',
                            }}
                          >
                            رقمي
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...ranges];
                              updated[idx] = {
                                ...updated[idx],
                                valueType: 'text',
                                low: null,
                                high: null,
                                text: updated[idx].text || 'Negative',
                                isUserEdited: true,
                              };
                              onChange(updated);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              background: isTextType ? 'var(--accent-cyan, #0284c7)' : 'transparent',
                              color: isTextType ? '#ffffff' : 'var(--text-muted, #64748b)',
                            }}
                          >
                            نصي
                          </button>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Reference Value (Numeric Low/High OR Qualitative Text with Quick Badges) */}
                  <td style={{ padding: '6px 4px' }}>
                    {(() => {
                      const isTextType = row.valueType === 'text' || (Boolean(row.text) && row.low == null && row.high == null);
                      if (isTextType) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                              type="text"
                              value={row.text || ''}
                              onChange={(e) => handleUpdateRow(idx, 'text', e.target.value)}
                              placeholder="مثال: Negative أو Positive"
                              className="input-control"
                              style={{ fontSize: '11.5px', padding: '4px 8px', height: '32px' }}
                            />
                            {/* Quick Qualitative Value Chips */}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {['Negative', 'Positive', 'Non-Reactive', 'Normal'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleUpdateRow(idx, 'text', preset)}
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(2, 132, 199, 0.25)',
                                    background: row.text === preset ? 'rgba(2, 132, 199, 0.2)' : 'rgba(0,0,0,0.03)',
                                    color: row.text === preset ? 'var(--accent-cyan, #0284c7)' : 'var(--text-muted, #64748b)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          <input
                            type="number"
                            step="any"
                            value={row.low != null ? row.low : ''}
                            onChange={(e) => handleUpdateRow(idx, 'low', e.target.value !== '' ? Number(e.target.value) : null)}
                            placeholder="الأدنى"
                            className="input-control"
                            style={{ fontSize: '11.5px', padding: '4px 6px', height: '32px' }}
                          />
                          <input
                            type="number"
                            step="any"
                            value={row.high != null ? row.high : ''}
                            onChange={(e) => handleUpdateRow(idx, 'high', e.target.value !== '' ? Number(e.target.value) : null)}
                            placeholder="الأعلى"
                            className="input-control"
                            style={{ fontSize: '11.5px', padding: '4px 6px', height: '32px' }}
                          />
                        </div>
                      );
                    })()}
                  </td>

                  {/* Delete Button */}
                  <td style={{ padding: '6px 2px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      title="حذف الفئة"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-rose, #ef4444)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <div>
        <button
          type="button"
          onClick={handleAddRow}
          className="btn-secondary"
          style={{
            fontSize: '11.5px',
            padding: '5px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '6px',
            fontWeight: 800,
          }}
        >
          <Plus size={14} />
          <span>إضافة فئة</span>
        </button>
      </div>

      {/* Clinical Validation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 800,
          background:
            validation.type === 'success'
              ? 'rgba(16, 185, 129, 0.12)'
              : validation.type === 'warning'
              ? 'var(--alert-warning-bg, #fffbeb)'
              : 'rgba(6, 182, 212, 0.12)',
          color:
            validation.type === 'success'
              ? '#047857'
              : validation.type === 'warning'
              ? 'var(--alert-warning-title, #92400e)'
              : '#0e7490',
          border: `1.5px solid ${
            validation.type === 'success'
              ? '#10b981'
              : validation.type === 'warning'
              ? 'var(--alert-warning-border, #f59e0b)'
              : '#06b6d4'
          }`,
          boxShadow: validation.type === 'warning' ? '0 2px 6px rgba(217, 119, 6, 0.1)' : 'none',
        }}
      >
        {validation.type === 'success' && <CheckCircle2 size={17} />}
        {validation.type === 'warning' && <AlertTriangle size={17} />}
        {validation.type === 'info' && <Info size={17} />}
        <span style={{ fontWeight: 800 }}>{validation.message}</span>
      </div>

      {/* Panic / Critical Limits (Optional Collapsible/Compact Row) */}
      {onCriticalChange && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: 'var(--alert-danger-bg, #fef2f2)',
            borderRadius: '8px',
            border: '1.5px solid var(--alert-danger-border, #f87171)',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--alert-danger-title, #991b1b)', minWidth: '130px' }}>
            الحدود الحرجة (Panic):
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--alert-danger-text, #b91c1c)', fontWeight: 700 }}>أقل من:</span>
            <input
              type="number"
              step="any"
              value={criticalLow != null ? criticalLow : ''}
              onChange={(e) => onCriticalChange(e.target.value, String(criticalHigh ?? ''))}
              placeholder="حرج منخفض"
              className="input-control"
              style={{ width: '90px', fontSize: '12px', fontWeight: 800, padding: '3px 8px', height: '28px', color: '#991b1b', borderColor: '#f87171' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--alert-danger-text, #b91c1c)', fontWeight: 700 }}>أعلى من:</span>
            <input
              type="number"
              step="any"
              value={criticalHigh != null ? criticalHigh : ''}
              onChange={(e) => onCriticalChange(String(criticalLow ?? ''), e.target.value)}
              placeholder="حرج مرتفع"
              className="input-control"
              style={{ width: '90px', fontSize: '12px', fontWeight: 800, padding: '3px 8px', height: '28px', color: '#991b1b', borderColor: '#f87171' }}
            />
          </div>
        </div>
      )}

      {/* Live Patient Simulator & Result Strip */}
      <div
        style={{
          marginTop: '6px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Simulator Demographic Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
              مريض تجريبي:
            </span>
            <select
              value={simSex}
              onChange={(e) => setSimSex(e.target.value as any)}
              className="input-control"
              style={{ width: '65px', fontSize: '11px', padding: '3px 6px', height: '30px' }}
            >
              <option value="M">ذكر</option>
              <option value="F">أنثى</option>
            </select>

            <input
              type="number"
              min="0"
              value={simAge}
              onChange={(e) => setSimAge(e.target.value)}
              placeholder="العمر"
              className="input-control"
              style={{ width: '50px', fontSize: '11px', textAlign: 'center', padding: '3px 4px', height: '30px' }}
            />

            <select
              value={simAgeUnit}
              onChange={(e) => setSimAgeUnit(e.target.value as any)}
              className="input-control"
              style={{ width: '60px', fontSize: '11px', padding: '3px 4px', height: '30px' }}
            >
              <option value="years">سنة</option>
              <option value="months">شهر</option>
              <option value="days">يوم</option>
            </select>

            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', marginRight: '8px' }}>
              النتيجة:
            </span>
            <input
              type="text"
              value={simResult}
              onChange={(e) => setSimResult(e.target.value)}
              placeholder="مثال: 14.2"
              className="input-control"
              style={{ width: '80px', fontSize: '11px', padding: '3px 6px', height: '30px' }}
            />
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>عرض القيم الطبيعية:</span>
            <button
              type="button"
              onClick={() => setSimMode('auto')}
              className={`btn-secondary ${simMode === 'auto' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: simMode === 'auto' ? 'rgba(6, 182, 212, 0.2)' : undefined,
                color: simMode === 'auto' ? 'var(--accent-cyan)' : undefined,
                borderColor: simMode === 'auto' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              تلقائي
            </button>
            <button
              type="button"
              onClick={() => setSimMode('manual')}
              className={`btn-secondary ${simMode === 'manual' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: simMode === 'manual' ? 'rgba(6, 182, 212, 0.2)' : undefined,
                color: simMode === 'manual' ? 'var(--accent-cyan)' : undefined,
                borderColor: simMode === 'manual' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              اختيار يدوي
            </button>
          </div>
        </div>

        {/* Manual Range Selector Dropdown when in Manual mode */}
        {simMode === 'manual' && ranges.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الفئة المختارة للمحاكاة:</span>
            <select
              value={selectedManualIndex}
              onChange={(e) => setSelectedManualIndex(Number(e.target.value))}
              className="input-control"
              style={{ fontSize: '11.5px', padding: '3px 8px', height: '30px', maxWidth: '240px' }}
            >
              {ranges.map((r, i) => (
                <option key={r.id || i} value={i}>
                  {r.label} ({r.sex === 'M' ? 'ذكر' : r.sex === 'F' ? 'أنثى' : 'كلاهما'}) [
                  {r.low ?? '-'} - {r.high ?? '-'}]
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Result Strip Preview */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'var(--bg-input-deep, #0f172a)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Test Name & Value */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                {testName || 'Hemoglobin (Hb)'}
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color:
                    simEvaluation.status === 'HIGH'
                      ? 'var(--accent-rose, #ef4444)'
                      : simEvaluation.status === 'LOW'
                      ? 'var(--accent-cyan, #06b6d4)'
                      : 'var(--text-main)',
                }}
              >
                {simResult || '—'}
              </span>
              {unit && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }} dir="ltr">
                  {unit}
                </span>
              )}
            </div>

            {/* Reference Range Display & Flag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} dir="ltr">
                {simMatchedRange ? (
                  simMatchedRange.text ? (
                    simMatchedRange.text
                  ) : simMatchedRange.low != null && simMatchedRange.high != null ? (
                    `${simMatchedRange.low} - ${simMatchedRange.high}`
                  ) : simMatchedRange.low != null ? (
                    `>= ${simMatchedRange.low}`
                  ) : simMatchedRange.high != null ? (
                    `<= ${simMatchedRange.high}`
                  ) : (
                    'غير محدد'
                  )
                ) : (
                  'لا يوجد مدى مطابق'
                )}
              </span>

              {/* Status Flag Badge */}
              {simEvaluation.status === 'HIGH' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 9px',
                    borderRadius: '5px',
                    background: 'var(--alert-danger-bg, #fef2f2)',
                    border: '1px solid var(--alert-danger-border, #f87171)',
                    color: 'var(--alert-danger-title, #991b1b)',
                    fontSize: '11px',
                    fontWeight: 900,
                  }}
                >
                  <ArrowUp size={12} /> مرتفع (H)
                </span>
              )}
              {simEvaluation.status === 'LOW' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 9px',
                    borderRadius: '5px',
                    background: 'rgba(2, 132, 199, 0.12)',
                    border: '1px solid #38bdf8',
                    color: '#0284c7',
                    fontSize: '11px',
                    fontWeight: 900,
                  }}
                >
                  <ArrowDown size={12} /> منخفض (L)
                </span>
              )}
              {simEvaluation.status === 'NORMAL' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  <Minus size={12} /> طبيعي
                </span>
              )}
              {simEvaluation.status === 'EMPTY' && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  —
                </span>
              )}
            </div>
          </div>

          {/* Subtitle explaining the matched category */}
          <div style={{ fontSize: '10.5px', color: 'var(--text-dim, #64748b)' }}>
            {simMatchedRange ? (
              <span>
                {simMode === 'manual' ? 'فئة مختارة يدوياً: ' : 'فئة مطابقة تلقائياً: '}
                <strong style={{ color: 'var(--accent-cyan)' }}>{simMatchedRange.label}</strong>
                {' '}
                ({simMatchedRange.sex === 'M' ? 'ذكور' : simMatchedRange.sex === 'F' ? 'إناث' : 'الجميع'}
                {simMatchedRange.ageMin != null || simMatchedRange.ageMax != null
                  ? ` | ${simMatchedRange.ageMin ?? 0} - ${simMatchedRange.ageMax ?? '∞'} ${simMatchedRange.ageUnit === 'days' ? 'يوم' : simMatchedRange.ageUnit === 'months' ? 'شهر' : 'سنة'}`
                  : ''}
                )
              </span>
            ) : (
              <span>لم يتم العثور على فئة مناسبة لعمر وجنس المريض المحدد</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
