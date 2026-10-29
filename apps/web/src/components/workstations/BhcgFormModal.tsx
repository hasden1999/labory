'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  User,
  Activity,
  CheckCircle2,
  Eye,
  Calendar,
  Sparkles,
  FlaskConical,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../Toast';

export interface BhcgAnalysisData {
  resultValue: string;
  unit: string;
  analyzer: string;
  specimen?: string;
  status: string;
  gestationalWeeks: string;
  notes: string;
}

export interface BhcgBracketRow {
  id: string;
  categoryLabel: string;
  categoryAr: string;
  rangeText: string;
  minVal: number;
  maxVal: number;
  weekText: string;
  defaultStatus: string;
  representativeValue: string;
  isPregnant: boolean;
  isBorderline?: boolean;
}

export const BHCG_INTERPRETATION_TABLE: BhcgBracketRow[] = [
  {
    id: 'non_preg_f',
    categoryLabel: 'Non-pregnant Females',
    categoryAr: 'غير حامل (النساء)',
    rangeText: '< 5.0',
    minVal: 0,
    maxVal: 4.99,
    weekText: 'Non-pregnant',
    defaultStatus: 'Non-pregnant (Negative)',
    representativeValue: '< 2.0',
    isPregnant: false,
  },
  {
    id: 'borderline',
    categoryLabel: 'Borderline / Grey Zone',
    categoryAr: 'منطقة حدية (يُعاد بعد 48 ساعة)',
    rangeText: '5.0 – 25.0',
    minVal: 5,
    maxVal: 25,
    weekText: 'Borderline (3 Wks)',
    defaultStatus: 'Borderline / Equivocal (Repeat in 48-72 hrs)',
    representativeValue: '15.0',
    isPregnant: false,
    isBorderline: true,
  },
  {
    id: 'wk_3',
    categoryLabel: '3 Weeks since LMP',
    categoryAr: 'الأسبوع 3 من الحمل',
    rangeText: '5 – 50',
    minVal: 5,
    maxVal: 50,
    weekText: '3 Weeks',
    defaultStatus: 'Pregnant (Estimated: 3 Weeks since LMP)',
    representativeValue: '35.0',
    isPregnant: true,
  },
  {
    id: 'wk_4',
    categoryLabel: '4 Weeks since LMP',
    categoryAr: 'الأسبوع 4 من الحمل',
    rangeText: '5 – 426',
    minVal: 5,
    maxVal: 426,
    weekText: '4 Weeks',
    defaultStatus: 'Pregnant (Estimated: 4 Weeks since LMP)',
    representativeValue: '185.0',
    isPregnant: true,
  },
  {
    id: 'wk_5',
    categoryLabel: '5 Weeks since LMP',
    categoryAr: 'الأسبوع 5 من الحمل',
    rangeText: '18 – 7,340',
    minVal: 18,
    maxVal: 7340,
    weekText: '5 Weeks',
    defaultStatus: 'Pregnant (Estimated: 5 Weeks since LMP)',
    representativeValue: '2,450',
    isPregnant: true,
  },
  {
    id: 'wk_6',
    categoryLabel: '6 Weeks since LMP',
    categoryAr: 'الأسبوع 6 من الحمل',
    rangeText: '1,080 – 56,500',
    minVal: 1080,
    maxVal: 56500,
    weekText: '6 Weeks',
    defaultStatus: 'Pregnant (Estimated: 6 Weeks since LMP)',
    representativeValue: '14,200',
    isPregnant: true,
  },
  {
    id: 'wk_7_8',
    categoryLabel: '7 – 8 Weeks since LMP',
    categoryAr: 'الأسبوع 7 - 8 من الحمل',
    rangeText: '7,650 – 229,000',
    minVal: 7650,
    maxVal: 229000,
    weekText: '7 - 8 Weeks',
    defaultStatus: 'Pregnant (Estimated: 7 - 8 Weeks since LMP)',
    representativeValue: '48,500',
    isPregnant: true,
  },
  {
    id: 'wk_9_12',
    categoryLabel: '9 – 12 Weeks since LMP',
    categoryAr: 'الأسبوع 9 - 12 من الحمل',
    rangeText: '25,700 – 288,000',
    minVal: 25700,
    maxVal: 288000,
    weekText: '9 - 12 Weeks',
    defaultStatus: 'Pregnant (Estimated: 9 - 12 Weeks since LMP)',
    representativeValue: '92,000',
    isPregnant: true,
  },
  {
    id: 'wk_13_16',
    categoryLabel: '13 – 16 Weeks since LMP',
    categoryAr: 'الأسبوع 13 - 16 من الحمل',
    rangeText: '13,300 – 254,000',
    minVal: 13300,
    maxVal: 254000,
    weekText: '13 - 16 Weeks',
    defaultStatus: 'Pregnant (Estimated: 13 - 16 Weeks since LMP)',
    representativeValue: '64,000',
    isPregnant: true,
  },
  {
    id: 'wk_17_24',
    categoryLabel: '17 – 24 Weeks since LMP',
    categoryAr: 'الأسبوع 17 - 24 من الحمل',
    rangeText: '4,060 – 165,400',
    minVal: 4060,
    maxVal: 165400,
    weekText: '17 - 24 Weeks',
    defaultStatus: 'Pregnant (Estimated: 17 - 24 Weeks since LMP)',
    representativeValue: '28,000',
    isPregnant: true,
  },
  {
    id: 'wk_25_40',
    categoryLabel: '25 – 40 Weeks since LMP',
    categoryAr: 'الأسبوع 25 - 40 من الحمل',
    rangeText: '3,640 – 117,000',
    minVal: 3640,
    maxVal: 117000,
    weekText: '25 - 40 Weeks',
    defaultStatus: 'Pregnant (Estimated: 25 - 40 Weeks since LMP)',
    representativeValue: '19,500',
    isPregnant: true,
  },
];

export const BHCG_ANALYZER_PRESETS = [
  'Roche Cobas (ECLIA)',
  'VIDAS Autoanalyzer (ELFA)',
  'Snibe Maglumi (CLIA)',
  'Mindray CL-Series (CLIA)',
  'Abbott Architect (CMIA)',
  'Ichroma II (FIA)',
  'Automated Quantitative Assay',
];

export const BHCG_QUICK_VALUES = [
  '< 1.0',
  '< 2.0',
  '< 5.0',
  '15.0',
  '45.0',
  '185.0',
  '1,450',
  '12,500',
  '48,000',
  '95,000',
];

export const BHCG_NOTE_PRESETS = [
  'Serial quantitative β-HCG testing after 48-72 hours is recommended to evaluate doubling time.',
  'Clinical correlation with transvaginal ultrasound (TVUS) and LMP date is recommended.',
  'Result is within normal non-pregnant reference range.',
  'Early pregnancy / borderline level; repeat assay in 48 hours is advised.',
];

interface BhcgFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  patientName?: string | null;
  patientGender?: string | null;
  patientAge?: number | string | null;
  initialData?: string;
  onApply: (formattedResult: string, rawData: BhcgAnalysisData) => void;
}

export default function BhcgFormModal({
  isOpen,
  onClose,
  sampleId,
  patientName,
  patientAge,
  initialData,
  onApply,
}: BhcgFormModalProps) {
  const toast = useToast();

  const [resultValue, setResultValue] = useState<string>('< 2.0');
  const [unit, setUnit] = useState<string>('mIU/mL');
  const [analyzer, setAnalyzer] = useState<string>('Roche Cobas (ECLIA)');
  const [specimen, setSpecimen] = useState<string>('Serum');
  const [status, setStatus] = useState<string>('Non-pregnant (Negative)');
  const [gestationalWeeks, setGestationalWeeks] = useState<string>('Non-pregnant');
  const [selectedBracketId, setSelectedBracketId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Auto-detect gestational range from result value
  const autoMatchedRow = useMemo(() => {
    const raw = resultValue.trim();
    if (!raw) return null;
    if (raw.startsWith('<') || raw === '0' || raw.toLowerCase().includes('neg') || raw.toLowerCase().includes('non')) {
      return BHCG_INTERPRETATION_TABLE[0];
    }
    const cleanNum = parseFloat(raw.replace(/[,<>=\s]/g, ''));
    if (isNaN(cleanNum)) return null;

    if (cleanNum < 5) return BHCG_INTERPRETATION_TABLE[0];
    if (cleanNum >= 5 && cleanNum <= 25) return BHCG_INTERPRETATION_TABLE[1];
    if (cleanNum > 25 && cleanNum <= 50) return BHCG_INTERPRETATION_TABLE[2];
    if (cleanNum > 50 && cleanNum <= 426) return BHCG_INTERPRETATION_TABLE[3];
    if (cleanNum > 426 && cleanNum <= 7340) return BHCG_INTERPRETATION_TABLE[4];
    if (cleanNum > 7340 && cleanNum <= 56500) return BHCG_INTERPRETATION_TABLE[5];
    if (cleanNum > 56500 && cleanNum <= 229000) return BHCG_INTERPRETATION_TABLE[6];
    if (cleanNum > 229000) return BHCG_INTERPRETATION_TABLE[7];

    return BHCG_INTERPRETATION_TABLE.find(r => r.minVal > 0 && cleanNum >= r.minVal && cleanNum <= r.maxVal) || null;
  }, [resultValue]);

  const activeMatchedRow = useMemo(() => {
    if (selectedBracketId) {
      const manual = BHCG_INTERPRETATION_TABLE.find(r => r.id === selectedBracketId);
      if (manual) return manual;
    }
    return autoMatchedRow;
  }, [selectedBracketId, autoMatchedRow]);

  // Parse initial data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (!initialData || !initialData.trim()) {
      setResultValue('< 2.0');
      setStatus('Non-pregnant (Negative)');
      setGestationalWeeks('Non-pregnant');
      setSelectedBracketId('non_preg_f');
      setNotes('');
      return;
    }

    if (initialData.includes('[TOTAL BETA-HCG') || initialData.includes('METHOD:') || initialData.includes('RESULT:')) {
      const lines = initialData.split('\n');
      lines.forEach(line => {
        const tr = line.trim();
        if (tr.startsWith('METHOD:')) {
          setAnalyzer(tr.replace('METHOD:', '').trim());
        } else if (tr.startsWith('SPECIMEN:')) {
          setSpecimen(tr.replace('SPECIMEN:', '').trim());
        } else if (tr.startsWith('RESULT:')) {
          const raw = tr.replace('RESULT:', '').trim();
          setResultValue(raw.replace(/(mIU\/mL|IU\/L)/gi, '').trim());
        } else if (tr.startsWith('INTERPRETATION:') || tr.startsWith('STATUS:')) {
          setStatus(tr.replace(/^(INTERPRETATION|STATUS):/, '').trim());
        } else if (tr.startsWith('GESTATIONAL_WEEKS:')) {
          const wk = tr.replace('GESTATIONAL_WEEKS:', '').trim();
          setGestationalWeeks(wk);
          const found = BHCG_INTERPRETATION_TABLE.find(
            r => r.weekText.toLowerCase() === wk.toLowerCase() || `week ${r.weekText}`.toLowerCase() === wk.toLowerCase()
          );
          if (found) setSelectedBracketId(found.id);
        } else if (tr.startsWith('NOTES:')) {
          setNotes(tr.replace('NOTES:', '').trim());
        }
      });
    } else {
      const clean = initialData.replace(/\[.*?\]/g, '').trim();
      setResultValue(clean.replace(/(mIU\/mL|IU\/L)/gi, '').trim());
      setSelectedBracketId(null);
    }
  }, [isOpen, initialData]);

  // Handler when typing result value
  const handleResultValueChange = (val: string) => {
    setResultValue(val);
    setSelectedBracketId(null); // Let auto-detection pick the matching bracket
  };

  // Sync status and gestationalWeeks when autoMatchedRow changes (if not manually overridden)
  useEffect(() => {
    if (!selectedBracketId && autoMatchedRow) {
      setStatus(autoMatchedRow.defaultStatus);
      setGestationalWeeks(autoMatchedRow.weekText);
    }
  }, [autoMatchedRow, selectedBracketId]);

  // Clicking directly on a row in the Gestational Reference Table
  const handleSelectBracketRow = (row: BhcgBracketRow) => {
    setSelectedBracketId(row.id);
    setStatus(row.defaultStatus);
    setGestationalWeeks(row.weekText);
    // If resultValue is empty or default '< 2.0' / '< 5.0', or outside the clicked bracket, fill representative value
    const cleanNum = parseFloat(resultValue.replace(/[,<>=\s]/g, ''));
    const isCurrentlyInBracket =
      !resultValue.startsWith('<') && !isNaN(cleanNum) && cleanNum >= row.minVal && cleanNum <= row.maxVal;
    if (!isCurrentlyInBracket || row.id === 'non_preg_f') {
      setResultValue(row.representativeValue);
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    const formatted = [
      '[TOTAL BETA-HCG LEVEL ASSAY]',
      `METHOD: ${analyzer}`,
      `SPECIMEN: ${specimen}`,
      `RESULT: ${resultValue.trim()} ${unit}`,
      `STATUS: ${status}`,
      gestationalWeeks ? `GESTATIONAL_WEEKS: ${gestationalWeeks}` : '',
      notes.trim() ? `NOTES: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    onApply(formatted, {
      resultValue: resultValue.trim(),
      unit,
      analyzer,
      specimen,
      status,
      gestationalWeeks,
      notes: notes.trim(),
    });

    toast.success('تم حفظ وإدراج تقرير فحص الحمل الرقمي (Total β-HCG) بنجاح!', 'تم الحفظ');
    onClose();
  };

  const applyPreset = (val: string, bracketId: string, noteText = '') => {
    const row = BHCG_INTERPRETATION_TABLE.find(r => r.id === bracketId) || BHCG_INTERPRETATION_TABLE[0];
    setResultValue(val);
    setSelectedBracketId(row.id);
    setStatus(row.defaultStatus);
    setGestationalWeeks(row.weekText);
    if (noteText !== undefined) setNotes(noteText);
  };

  const isPositivePregnant = Boolean(
    activeMatchedRow?.isPregnant ||
      status.toLowerCase().includes('pregnant (') ||
      status.toLowerCase().startsWith('pregnant')
  );
  const isBorderlineState = Boolean(activeMatchedRow?.isBorderline || status.toLowerCase().includes('borderline'));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #cbd5e1)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.45)',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* ========================================================
            1. TOP CLINICAL WORKSTATION HEADER BAR (Matches GUE/GSE)
           ======================================================== */}
        <div
          dir="ltr"
          style={{
            direction: 'ltr',
            padding: '12px 20px',
            background: 'var(--bg-card, #ffffff)',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Patient & Workstation Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #be123c 0%, #db2777 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(190, 18, 60, 0.25)',
              }}
            >
              <FlaskConical size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {patientName || 'Walk-in Patient'}
                </span>
                {patientAge && (
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'var(--bg-input, #f1f5f9)',
                      color: 'var(--text-muted, #475569)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    Age: {patientAge} Y
                  </span>
                )}
                {sampleId && (
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'var(--bg-input, #f1f5f9)',
                      color: 'var(--text-muted, #475569)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    #{sampleId}
                  </span>
                )}
                {isPositivePregnant ? (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#ffe4e6',
                      color: '#be123c',
                      border: '1px solid #fda4af',
                      padding: '2px 9px',
                      borderRadius: '6px',
                      fontWeight: 800,
                    }}
                  >
                    Pregnant • {gestationalWeeks}
                  </span>
                ) : isBorderlineState ? (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fcd34d',
                      padding: '2px 9px',
                      borderRadius: '6px',
                      fontWeight: 800,
                    }}
                  >
                    Borderline (5 - 25 mIU/mL)
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '2px 9px',
                      borderRadius: '6px',
                      fontWeight: 800,
                    }}
                  >
                    Non-pregnant (&lt; 5.0 mIU/mL)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Quantitative Serum Beta-HCG Assay (Total β-HCG) • Model B Clinical Workstation
              </div>
            </div>
          </div>

          {/* One-Click Clinical Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              One-Click Presets:
            </span>

            <button
              type="button"
              onClick={() => applyPreset('< 2.0', 'non_preg_f', '')}
              style={{
                fontSize: '11.5px',
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #10b981',
                background: '#ecfdf5',
                color: '#047857',
              }}
            >
              [Non-Pregnant &lt; 2.0]
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset(
                  '15.0',
                  'borderline',
                  'Borderline level; repeat quantitative β-HCG assay in 48-72 hours is recommended.'
                )
              }
              style={{
                fontSize: '11.5px',
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #f59e0b',
                background: '#fffbeb',
                color: '#b45309',
              }}
            >
              [Borderline 15.0]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('185.0', 'wk_4', '')}
              style={{
                fontSize: '11.5px',
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #f43f5e',
                background: '#fff1f2',
                color: '#be123c',
              }}
            >
              [Week 4 (185)]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('14,200', 'wk_6', '')}
              style={{
                fontSize: '11.5px',
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #db2777',
                background: '#fdf2f8',
                color: '#9d174d',
              }}
            >
              [Week 6 (14,200)]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('92,000', 'wk_9_12', '')}
              style={{
                fontSize: '11.5px',
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #9333ea',
                background: '#faf5ff',
                color: '#6b21a8',
              }}
            >
              [Weeks 9-12 (92,000)]
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '6px',
                marginLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. MAIN BODY: 2 COLUMNS (LEFT: INTERACTIVE CONTROLS | RIGHT: LIVE PRINT PREVIEW)
           ======================================================== */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: '16px',
            padding: '16px 20px',
            overflowY: 'auto',
            background: 'var(--bg-primary, #f8fafc)',
          }}
        >
          {/* ----------------------------------------------------
              LEFT PANEL: CLINICAL ENTRY & INTERACTIVE WEEKS TABLE
             ---------------------------------------------------- */}
          <div dir="ltr" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            {/* Card 1: Result Value Entry + Rapid Value Pills */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '10px',
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  1. Quantitative β-HCG Concentration (نتيجة التحليل الرقمي)
                </span>
                <span style={{ fontSize: '11px', color: '#be123c', fontWeight: 700 }}>
                  Non-pregnant Ref: &lt; 5.0 mIU/mL
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 110px 1.2fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Measured Value (القيمة الرقمية)
                  </label>
                  <input
                    type="text"
                    value={resultValue}
                    onChange={(e) => handleResultValueChange(e.target.value)}
                    placeholder="e.g. < 2.0 or 450"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      fontSize: '17px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: isPositivePregnant ? '#be123c' : isBorderlineState ? '#b45309' : '#047857',
                      background: isPositivePregnant ? '#fff1f2' : isBorderlineState ? '#fffbeb' : '#f0fdf4',
                      border: `2px solid ${isPositivePregnant ? '#f43f5e' : isBorderlineState ? '#f59e0b' : '#10b981'}`,
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Unit (الوحدة)
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 8px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: 'var(--text-main, #0f172a)',
                      background: 'var(--bg-input, #f8fafc)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  >
                    <option value="mIU/mL">mIU/mL</option>
                    <option value="IU/L">IU/L</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Gestational Age (الأسبوع المطابق)
                  </label>
                  <input
                    type="text"
                    value={gestationalWeeks}
                    onChange={(e) => setGestationalWeeks(e.target.value)}
                    placeholder="Non-pregnant / X Weeks"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--text-main, #0f172a)',
                      background: 'var(--bg-input, #f8fafc)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Rapid Value Click Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '2px' }}>
                  Quick Values:
                </span>
                {BHCG_QUICK_VALUES.map((qv) => {
                  const isSel = resultValue.trim() === qv;
                  return (
                    <button
                      key={qv}
                      type="button"
                      onClick={() => handleResultValueChange(qv)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        fontWeight: isSel ? 900 : 700,
                        cursor: 'pointer',
                        border: isSel ? '1.5px solid #be123c' : '1px solid var(--border-color, #cbd5e1)',
                        background: isSel ? '#ffe4e6' : 'var(--bg-input, #f8fafc)',
                        color: isSel ? '#be123c' : 'var(--text-main, #334155)',
                      }}
                    >
                      {qv}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Interactive Gestational Weeks Selector Table (Click any bracket to select!) */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '10px',
                padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  2. Interactive Gestational Reference Brackets (اضغط على أي أسبوع لاختياره فوراً)
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Auto-matches typed value or click row to select
                </span>
              </div>

              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Gestational Stage (since LMP)</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Reference Range ({unit})</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>الفئة السريرية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BHCG_INTERPRETATION_TABLE.map((row, idx) => {
                      const isMatched = activeMatchedRow?.id === row.id;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => handleSelectBracketRow(row)}
                          style={{
                            cursor: 'pointer',
                            background: isMatched
                              ? row.isPregnant
                                ? '#ffe4e6'
                                : row.isBorderline
                                ? '#fef3c7'
                                : '#dcfce7'
                              : idx % 2 === 0
                              ? '#ffffff'
                              : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background 0.12s ease',
                          }}
                        >
                          <td
                            style={{
                              padding: '6px 10px',
                              fontWeight: isMatched ? 900 : 700,
                              color: isMatched
                                ? row.isPregnant
                                  ? '#be123c'
                                  : row.isBorderline
                                  ? '#b45309'
                                  : '#047857'
                                : '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <input
                              type="radio"
                              checked={isMatched}
                              onChange={() => handleSelectBracketRow(row)}
                              style={{ accentColor: '#be123c', cursor: 'pointer', margin: 0 }}
                            />
                            <span>{row.categoryLabel}</span>
                            {isMatched && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  background: row.isPregnant ? '#be123c' : row.isBorderline ? '#d97706' : '#059669',
                                  color: '#ffffff',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 800,
                                }}
                              >
                                Selected
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '6px 10px',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              fontWeight: isMatched ? 900 : 700,
                              color: isMatched ? '#0f172a' : '#334155',
                            }}
                          >
                            {row.rangeText}
                          </td>
                          <td
                            dir="rtl"
                            style={{
                              padding: '6px 10px',
                              textAlign: 'right',
                              fontWeight: isMatched ? 800 : 600,
                              color: isMatched ? '#0f172a' : '#64748b',
                              fontSize: '11.5px',
                            }}
                          >
                            {row.categoryAr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 3: Diagnostic Status, Analyzer Methodology & Clinical Notes */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Diagnostic Interpretation (التفسير التشخيصي)
                  </label>
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-main, #0f172a)',
                      background: 'var(--bg-input, #f8fafc)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Assay Methodology (الجهاز / التقنية)
                  </label>
                  <select
                    value={analyzer}
                    onChange={(e) => setAnalyzer(e.target.value)}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-main, #0f172a)',
                      background: 'var(--bg-input, #f8fafc)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '6px',
                    }}
                  >
                    {BHCG_ANALYZER_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Specimen (نوع العينة)
                  </label>
                  <select
                    value={specimen}
                    onChange={(e) => setSpecimen(e.target.value)}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-main, #0f172a)',
                      background: 'var(--bg-input, #f8fafc)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="Serum">Serum</option>
                    <option value="Plasma (EDTA)">Plasma (EDTA)</option>
                    <option value="Plasma (Heparin)">Plasma (Heparin)</option>
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                    Clinical Footnote / Comment (ملاحظة سريرية للتقرير)
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {BHCG_NOTE_PRESETS.map((np, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNotes(np)}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: notes === np ? '#ffe4e6' : '#f8fafc',
                          color: notes === np ? '#be123c' : '#475569',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Note #{i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional clinical note (e.g. Serial testing after 48-72h recommended)..."
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    color: 'var(--text-main, #0f172a)',
                    background: 'var(--bg-input, #f8fafc)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------
              RIGHT PANEL: LIVE OFFICIAL PRINT REPORT PREVIEW
             ---------------------------------------------------- */}
          <div
            dir="ltr"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
              color: '#0f172a',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                marginBottom: '12px',
                borderBottom: '1px dashed #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                <Eye size={15} color="#be123c" />
                <span>LIVE OFFICIAL REPORT PREVIEW (معاينة فورمة الطباعة)</span>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>A4 Clinical Workstation Format</span>
            </div>

            {/* Official Header Banner */}
            <div
              style={{
                background: 'linear-gradient(90deg, #9f1239 0%, #be123c 100%)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '13px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>QUANTITATIVE SERUM BETA-HCG ASSAY (Total β-HCG)</span>
              <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.9 }}>ENDOCRINOLOGY &amp; SEROLOGY</span>
            </div>

            {/* Section 1: Quantitative Assay & Diagnostic Summary */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  padding: '6px 12px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  color: '#9f1239',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>1. QUANTITATIVE ASSAY &amp; DIAGNOSTIC SUMMARY</span>
                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '10.5px' }}>
                  Specimen: {specimen} • {analyzer}
                </span>
              </div>

              <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#ffffff' }}>
                <div
                  style={{
                    background: isPositivePregnant ? '#fff1f2' : isBorderlineState ? '#fffbeb' : '#f0fdf4',
                    border: `1.5px solid ${isPositivePregnant ? '#fda4af' : isBorderlineState ? '#fcd34d' : '#86efac'}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569' }}>Total β-HCG Level:</span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: isPositivePregnant ? '#be123c' : isBorderlineState ? '#b45309' : '#15803d',
                    }}
                  >
                    {resultValue || '—'} <span style={{ fontSize: '11px', fontWeight: 700 }}>{unit}</span>
                  </span>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Gestational Age:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#0f172a' }}>
                    {gestationalWeeks || 'Non-pregnant'}
                  </span>
                </div>

                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Diagnostic Impression:</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: isPositivePregnant ? '#be123c' : isBorderlineState ? '#b45309' : '#15803d',
                    }}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Gestational Age Reference Intervals Table */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  padding: '6px 12px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  color: '#9f1239',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>2. GESTATIONAL AGE REFERENCE INTERVALS (SINCE LMP*)</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Males: &lt; 2.0 {unit}</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>
                    <th style={{ padding: '5px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>
                      Gestational Stage (Week since LMP*)
                    </th>
                    <th style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                      Reference Range ({unit})
                    </th>
                    <th style={{ padding: '5px 10px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {BHCG_INTERPRETATION_TABLE.map((row, idx) => {
                    const isMatch = activeMatchedRow?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        style={{
                          background: isMatch ? '#fff1f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          fontWeight: isMatch ? 800 : 600,
                          color: isMatch ? '#9f1239' : '#1e293b',
                        }}
                      >
                        <td style={{ padding: '4.5px 10px', borderRight: '1px solid #e2e8f0' }}>{row.categoryLabel}</td>
                        <td
                          style={{
                            padding: '4.5px 10px',
                            textAlign: 'center',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            borderRight: '1px solid #e2e8f0',
                          }}
                        >
                          {row.rangeText}
                        </td>
                        <td style={{ padding: '4.5px 10px', textAlign: 'center' }}>
                          {isMatch ? (
                            <span
                              style={{
                                fontSize: '9.5px',
                                background: '#be123c',
                                color: '#ffffff',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Matched Bracket
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
              * LMP = Last Menstrual Period. Serial quantitative determinations 48-72 hours apart are recommended.
              {notes ? ` Note: ${notes}` : ''}
            </div>
          </div>
        </div>

        {/* ========================================================
            3. FOOTER ACTION BAR
           ======================================================== */}
        <div
          dir="rtl"
          style={{
            padding: '12px 20px',
            background: 'var(--bg-card, #ffffff)',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-input, #f1f5f9)',
              color: 'var(--text-main, #475569)',
              cursor: 'pointer',
            }}
          >
            إلغاء وإغلاق
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              background: 'linear-gradient(135deg, #be123c 0%, #db2777 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(190, 18, 60, 0.3)',
            }}
          >
            <Check size={16} />
            <span>حفظ واعتماد تقرير فحص الحمل الرقمي (β-HCG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
