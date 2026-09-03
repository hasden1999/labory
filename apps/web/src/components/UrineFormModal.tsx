'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  Sparkles, 
  User, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  FlaskConical,
  Eye,
  Microscope,
  CheckCircle2,
  AlertCircle,
  Printer
} from 'lucide-react';
import { useToast } from './Toast';

export interface UrineAnalysisData {
  // Physical Examination
  color: string;
  appearance: string;
  spGravity: string;
  reactionPh: string;
  volume: string;
  odor: string;

  // Chemical Examination
  protein: string;
  glucose: string;
  ketones: string;
  bilirubin: string;
  urobilinogen: string;
  blood: string;
  nitrite: string;
  leukocyteEsterase: string;

  // Microscopic Examination
  pusCells: string;
  rbcs: string;
  epithelialCells: string;
  calciumOxalate: string;
  uricAcid: string;
  triplePhosphate: string;
  amorphous: string;
  casts: string;
  bacteria: string;
  yeast: string;
  trichomonas: string;
  mucus: string;
  otherNotes: string;
}

export const DEFAULT_URINE_DATA: UrineAnalysisData = {
  color: 'Yellow',
  appearance: 'Clear',
  spGravity: '1.020',
  reactionPh: '6.0',
  volume: 'Random',
  odor: 'Normal',

  protein: 'Nil',
  glucose: 'Nil',
  ketones: 'Nil',
  bilirubin: 'Negative',
  urobilinogen: 'Normal',
  blood: 'Negative',
  nitrite: 'Negative',
  leukocyteEsterase: 'Negative',

  pusCells: '0-2',
  rbcs: '0-2',
  epithelialCells: 'Few',
  calciumOxalate: 'Nil',
  uricAcid: 'Nil',
  triplePhosphate: 'Nil',
  amorphous: 'Nil',
  casts: 'None',
  bacteria: 'Nil',
  yeast: 'Not Seen',
  trichomonas: 'Not Seen',
  mucus: 'Nil',
  otherNotes: '',
};

interface UrineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (formattedResult: string, rawData: UrineAnalysisData) => void;
  initialData?: Partial<UrineAnalysisData> | string;
  patientName?: string;
  sampleNumber?: number | string;
}

export default function UrineFormModal({
  isOpen,
  onClose,
  onApply,
  initialData,
  patientName = 'Patient',
  sampleNumber = '---',
}: UrineFormModalProps) {
  const toast = useToast();

  // Tab State: 'PHYSICAL' | 'CHEMICAL' | 'MICROSCOPIC'
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'CHEMICAL' | 'MICROSCOPIC'>('PHYSICAL');

  const [data, setData] = useState<UrineAnalysisData>(DEFAULT_URINE_DATA);

  // Load initial data or parse if string
  useEffect(() => {
    if (isOpen) {
      if (typeof initialData === 'object' && initialData !== null) {
        setData((prev) => ({ ...prev, ...initialData }));
      } else if (typeof initialData === 'string' && initialData.includes('G.U.E')) {
        // Parse key-values from formatted string if applicable
        const parsed = { ...DEFAULT_URINE_DATA };
        const matchVal = (key: string, str: string) => {
          const regex = new RegExp(`${key}:\\s*([^|\\n,]+)`, 'i');
          const m = str.match(regex);
          return m ? m[1].trim() : null;
        };

        parsed.color = matchVal('Color', initialData) || parsed.color;
        parsed.appearance = matchVal('Clarity', initialData) || matchVal('Appearance', initialData) || parsed.appearance;
        parsed.spGravity = matchVal('Sp.Gr', initialData) || parsed.spGravity;
        parsed.reactionPh = matchVal('pH', initialData) || parsed.reactionPh;
        parsed.protein = matchVal('Protein', initialData) || parsed.protein;
        parsed.glucose = matchVal('Sugar', initialData) || matchVal('Glucose', initialData) || parsed.glucose;
        parsed.ketones = matchVal('Ketones', initialData) || parsed.ketones;
        parsed.blood = matchVal('Blood', initialData) || parsed.blood;
        parsed.nitrite = matchVal('Nitrite', initialData) || parsed.nitrite;
        parsed.pusCells = matchVal('Pus', initialData)?.replace('/HPF', '').trim() || parsed.pusCells;
        parsed.rbcs = matchVal('RBCs', initialData)?.replace('/HPF', '').trim() || parsed.rbcs;
        parsed.epithelialCells = matchVal('Epith', initialData) || parsed.epithelialCells;
        parsed.bacteria = matchVal('Bacteria', initialData) || 'Nil';
        parsed.mucus = matchVal('Mucus', initialData) || 'Nil';
        parsed.calciumOxalate = matchVal('Ca\\.?\\s*Oxalate', initialData) || 'Nil';
        parsed.uricAcid = matchVal('Uric\\s*Acid', initialData) || 'Nil';
        parsed.triplePhosphate = matchVal('Triple\\s*Phos(?:phate)?', initialData) || 'Nil';
        parsed.amorphous = matchVal('Amorphous', initialData) || 'Nil';
        parsed.casts = matchVal('Casts', initialData) || 'None';
        parsed.yeast = matchVal('Yeast', initialData) || 'Not Seen';
        parsed.trichomonas = matchVal('Trichomonas', initialData) || 'Not Seen';
        parsed.otherNotes = matchVal('Notes', initialData) || '';

        setData(parsed);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const setField = (field: keyof UrineAnalysisData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Clinical Quick Presets
  const applyPreset = (presetName: 'NORMAL' | 'UTI' | 'OXALATE' | 'HEMATURIA' | 'RESET') => {
    if (presetName === 'NORMAL' || presetName === 'RESET') {
      setData({ ...DEFAULT_URINE_DATA });
      toast.success('تم تطبيق نموذج فحص الإدرار الطبيعي (Normal G.U.E)', 'تم التحميل');
    } else if (presetName === 'UTI') {
      setData({
        ...DEFAULT_URINE_DATA,
        color: 'Dark Yellow',
        appearance: 'Turbid',
        protein: '1+',
        nitrite: 'Positive (+)',
        leukocyteEsterase: 'Positive (++)',
        pusCells: '25-35',
        rbcs: '4-6',
        epithelialCells: 'Moderate',
        bacteria: 'Many (+++)',
        mucus: 'Few',
        otherNotes: 'Acute Urinary Tract Infection (UTI) pattern with significant bacteriuria.',
      });
      toast.warning('تم تطبيق نموذج التهاب المسالك البولية (UTI / Pus)', 'تم التحميل');
    } else if (presetName === 'OXALATE') {
      setData({
        ...DEFAULT_URINE_DATA,
        appearance: 'Sl. Turbid',
        pusCells: '2-4',
        rbcs: '8-12',
        calciumOxalate: '+++',
        mucus: 'Moderate',
        otherNotes: 'Significant Calcium Oxalate Crystalluria (Renal Colic pattern).',
      });
      toast.info('تم تطبيق نموذج ترسبات أملاح الأوكزالات (Ca. Oxalate)', 'تم التحميل');
    } else if (presetName === 'HEMATURIA') {
      setData({
        ...DEFAULT_URINE_DATA,
        color: 'Red / Bloody',
        appearance: 'Turbid',
        protein: '1+',
        blood: '3+',
        rbcs: 'Packed / Bloody',
        pusCells: '4-6',
        casts: 'RBC Casts',
        otherNotes: 'Gross Hematuria with intact red blood cells and RBC casts.',
      });
      toast.error('تم تطبيق نموذج البيلة الدموية (Gross Hematuria)', 'تم التحميل');
    }
  };

  // Format result output for system database and medical report
  const handleSaveAndApply = () => {
    // 1. Collect non-Nil crystals
    const activeCrystals: string[] = [];
    if (data.calciumOxalate && data.calciumOxalate !== 'Nil') {
      activeCrystals.push(`Ca.Oxalate: ${data.calciumOxalate}`);
    }
    if (data.uricAcid && data.uricAcid !== 'Nil') {
      activeCrystals.push(`Uric Acid: ${data.uricAcid}`);
    }
    if (data.triplePhosphate && data.triplePhosphate !== 'Nil') {
      activeCrystals.push(`Triple Phos: ${data.triplePhosphate}`);
    }
    if (data.amorphous && data.amorphous !== 'Nil') {
      activeCrystals.push(`Amorphous: ${data.amorphous}`);
    }

    // 2. Base microscopic findings
    const microParts: string[] = [
      `Pus: ${data.pusCells} /HPF`,
      `RBCs: ${data.rbcs} /HPF`,
      `Epith: ${data.epithelialCells}`
    ];

    // Crystals section: only active or clean 'Crystals: Nil'
    if (activeCrystals.length > 0) {
      microParts.push(...activeCrystals);
    } else {
      microParts.push('Crystals: Nil');
    }

    // Microorganisms & casts: only include if selected / positive
    if (data.casts && data.casts !== 'None' && data.casts !== 'Nil') {
      microParts.push(`Casts: ${data.casts}`);
    }
    if (data.bacteria && data.bacteria !== 'Nil') {
      microParts.push(`Bacteria: ${data.bacteria}`);
    }
    if (data.yeast && data.yeast !== 'Not Seen' && data.yeast !== 'Nil') {
      microParts.push(`Yeast: ${data.yeast}`);
    }
    if (data.trichomonas && data.trichomonas !== 'Not Seen' && data.trichomonas !== 'Nil') {
      microParts.push(`Trichomonas: ${data.trichomonas}`);
    }
    if (data.mucus && data.mucus !== 'Nil') {
      microParts.push(`Mucus: ${data.mucus}`);
    }

    const formatted = [
      '[GENERAL URINE EXAMINATION - G.U.E]',
      `PHYSICAL: Color: ${data.color} | Clarity: ${data.appearance} | Sp.Gr: ${data.spGravity} | pH: ${data.reactionPh} | Volume: ${data.volume} | Odor: ${data.odor}`,
      `CHEMICAL: Protein: ${data.protein} | Sugar: ${data.glucose} | Ketones: ${data.ketones} | Bilirubin: ${data.bilirubin} | Urob: ${data.urobilinogen} | Blood: ${data.blood} | Nitrite: ${data.nitrite} | Leukocytes: ${data.leukocyteEsterase}`,
      `MICROSCOPIC: ${microParts.join(' | ')}`,
      data.otherNotes ? `Notes: ${data.otherNotes}` : ''
    ].filter(Boolean).join('\n');

    onApply(formatted, data);
    toast.success('تم حفظ وإدراج نتائج فحص الإدرار بنجاح!', 'تم بنجاح');
    onClose();
  };

  // Color Swatches Definition
  const COLOR_OPTIONS = [
    { name: 'Straw', hex: '#fef9c3', border: '#facc15' },
    { name: 'Yellow', hex: '#fde047', border: '#eab308' },
    { name: 'Pale Yellow', hex: '#fef08a', border: '#eab308' },
    { name: 'Dark Yellow', hex: '#eab308', border: '#ca8a04' },
    { name: 'Amber', hex: '#d97706', border: '#b45309' },
    { name: 'Red / Bloody', hex: '#f87171', border: '#dc2626' },
    { name: 'Orange', hex: '#fb923c', border: '#ea580c' },
    { name: 'Brownish', hex: '#a8a29e', border: '#78716c' },
  ];

  // Helper Component for Clinical Option Pills
  const PillSelector = ({
    label,
    refRange,
    value,
    onChange,
    options,
    abnormalValues = [],
  }: {
    label: string;
    refRange?: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    abnormalValues?: string[];
  }) => {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
            {label}
          </span>
          {refRange && (
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              Ref: <span style={{ color: '#0284c7' }}>{refRange}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {options.map((opt) => {
            const isSelected = value === opt;
            const isAbnormal = abnormalValues.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  border: isSelected 
                    ? isAbnormal ? '1.5px solid #dc2626' : '1.5px solid #0284c7'
                    : '1px solid #cbd5e1',
                  background: isSelected 
                    ? isAbnormal ? '#fee2e2' : '#e0f2fe'
                    : '#f8fafc',
                  color: isSelected 
                    ? isAbnormal ? '#b91c1c' : '#0369a1'
                    : '#475569',
                  boxShadow: isSelected ? '0 1px 4px rgba(2, 132, 199, 0.2)' : 'none',
                  transition: 'all 0.12s ease',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper Component for Flexible Crystal Row with Nil, +, ++, +++, ++++, Full Field
  const CrystalSelectorRow = ({
    name,
    arabicName,
    value,
    onChange,
  }: {
    name: string;
    arabicName?: string;
    value: string;
    onChange: (val: string) => void;
  }) => {
    const levels = ['Nil', '+', '++', '+++', '++++', 'Full Field'];
    const isPositive = value && value !== 'Nil';
    const isSevere = ['+++', '++++', 'Full Field'].includes(value);

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '5px 0',
        borderBottom: '1px dashed #f1f5f9'
      }}>
        <div style={{ minWidth: '150px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: isPositive ? (isSevere ? '#dc2626' : '#0284c7') : '#334155' }}>
            • {name} {isPositive && <span style={{ fontWeight: 800 }}>({value})</span>}
          </span>
          {arabicName && <span style={{ fontSize: '11px', color: '#64748b', marginRight: '4px' }}>- {arabicName}</span>}
        </div>
        <div style={{ display: 'flex', gap: '4px', flex: 1, maxWidth: '340px' }}>
          {levels.map((lvl) => {
            const isSelected = value === lvl;
            const isLvlHeavy = ['+++', '++++', 'Full Field'].includes(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange(lvl)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  borderRadius: '6px',
                  fontSize: lvl === 'Full Field' ? '10px' : '11px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  border: isSelected 
                    ? (isLvlHeavy ? '1.5px solid #dc2626' : '1.5px solid #0284c7')
                    : '1px solid #cbd5e1',
                  background: isSelected 
                    ? (lvl === 'Nil' ? '#0284c7' : isLvlHeavy ? '#fee2e2' : '#e0f2fe') 
                    : '#ffffff',
                  color: isSelected 
                    ? (lvl === 'Nil' ? '#ffffff' : isLvlHeavy ? '#b91c1c' : '#0369a1') 
                    : '#475569',
                  boxShadow: isSelected ? '0 1px 3px rgba(2,132,199,0.2)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease',
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Determine abnormal flags for Live Preview
  const isPusAbnormal = !['0-2', '2-4'].includes(data.pusCells);
  const isRbcAbnormal = !['0-2'].includes(data.rbcs);
  const isProteinAbnormal = data.protein !== 'Nil';
  const isGlucoseAbnormal = data.glucose !== 'Nil';
  const isBloodAbnormal = data.blood !== 'Negative';
  const isNitriteAbnormal = data.nitrite.includes('Positive');

  return (
    <div style={{
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
      padding: '16px',
    }}>
      <div style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1220px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.4)',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}>
        
        {/* ========================================================
            1. TOP CLINICAL HEADER BAR
           ======================================================== */}
        <div style={{
          padding: '12px 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* Patient Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}>
              <FlaskConical size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {patientName}
                </span>
                <span style={{ fontSize: '11px', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Sample #{sampleNumber}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                General Urine Examination (G.U.E) • Model B Clinical Form
              </div>
            </div>
          </div>

          {/* Clinical Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
              One-Click Presets:
            </span>

            <button
              type="button"
              onClick={() => applyPreset('NORMAL')}
              style={{
                fontSize: '11.5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #10b981',
                background: '#ecfdf5',
                color: '#047857',
              }}
            >
              [Normal G.U.E]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('UTI')}
              style={{
                fontSize: '11.5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #f59e0b',
                background: '#fffbeb',
                color: '#b45309',
              }}
            >
              [UTI / Pus]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('OXALATE')}
              style={{
                fontSize: '11.5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #8b5cf6',
                background: '#f5f3ff',
                color: '#6d28d9',
              }}
            >
              [Ca. Oxalate]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('HEMATURIA')}
              style={{
                fontSize: '11.5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #ef4444',
                background: '#fef2f2',
                color: '#b91c1c',
              }}
            >
              [Hematuria]
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
                marginLeft: '8px',
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
            2. MAIN BODY: 2 COLUMNS (LEFT: TABBED ENTRY | RIGHT: LIVE PRINT PREVIEW)
           ======================================================== */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '16px',
          padding: '16px 20px',
          overflowY: 'auto',
        }}>
          
          {/* ----------------------------------------------------
              LEFT PANEL: STRUCTURED TABBED FORM (MODEL B)
             ---------------------------------------------------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Tab Navigation Header */}
            <div style={{
              display: 'flex',
              background: '#e2e8f0',
              padding: '4px',
              borderRadius: '10px',
              gap: '4px',
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('PHYSICAL')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'PHYSICAL' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'PHYSICAL' ? '#ffffff' : 'transparent',
                  color: activeTab === 'PHYSICAL' ? '#0284c7' : '#64748b',
                  boxShadow: activeTab === 'PHYSICAL' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Eye size={16} />
                <span>1. PHYSICAL EXAMINATION</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CHEMICAL')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'CHEMICAL' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'CHEMICAL' ? '#ffffff' : 'transparent',
                  color: activeTab === 'CHEMICAL' ? '#0284c7' : '#64748b',
                  boxShadow: activeTab === 'CHEMICAL' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Activity size={16} />
                <span>2. CHEMICAL EXAMINATION</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('MICROSCOPIC')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'MICROSCOPIC' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'MICROSCOPIC' ? '#ffffff' : 'transparent',
                  color: activeTab === 'MICROSCOPIC' ? '#0284c7' : '#64748b',
                  boxShadow: activeTab === 'MICROSCOPIC' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Microscope size={16} />
                <span>3. MICROSCOPIC (HPF)</span>
              </button>
            </div>

            {/* Tab 1: Physical Examination */}
            {activeTab === 'PHYSICAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Color Swatch Selector */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Color (اللون)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ref: <strong style={{ color: '#0284c7' }}>Yellow / Pale Yellow</strong>
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {COLOR_OPTIONS.map((c) => {
                      const isSelected = data.color === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setField('color', c.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: isSelected ? '#e0f2fe' : '#ffffff',
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '11.5px',
                            color: '#1e293b',
                            boxShadow: isSelected ? '0 2px 6px rgba(2,132,199,0.2)' : 'none',
                          }}
                        >
                          <span style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: c.hex,
                            border: `1.5px solid ${c.border}`,
                            flexShrink: 0,
                          }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clarity / Appearance */}
                <PillSelector
                  label="Clarity / Appearance (المظهر والشفافية)"
                  refRange="Clear"
                  value={data.appearance}
                  onChange={(v) => setField('appearance', v)}
                  options={['Clear', 'Slightly Turbid', 'Turbid', 'Milky']}
                  abnormalValues={['Turbid', 'Milky']}
                />

                {/* Specific Gravity & pH */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Specific Gravity (الكثافة النوعية)"
                    refRange="1.005 - 1.030"
                    value={data.spGravity}
                    onChange={(v) => setField('spGravity', v)}
                    options={['1.005', '1.010', '1.015', '1.020', '1.025', '1.030']}
                  />

                  <PillSelector
                    label="Reaction / pH (درجة الحموضة)"
                    refRange="4.5 - 8.0 (Normal: ~6.0)"
                    value={data.reactionPh}
                    onChange={(v) => setField('reactionPh', v)}
                    options={['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0']}
                  />
                </div>

                {/* Volume & Odor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Volume (الحجم)"
                    refRange="Random"
                    value={data.volume}
                    onChange={(v) => setField('volume', v)}
                    options={['Random', 'Morning', '24 Hours']}
                  />

                  <PillSelector
                    label="Odor (الرائحة)"
                    refRange="Normal"
                    value={data.odor}
                    onChange={(v) => setField('odor', v)}
                    options={['Normal', 'Aromatic', 'Ammoniacal', 'Foul / Offensive']}
                    abnormalValues={['Ammoniacal', 'Foul / Offensive']}
                  />
                </div>

              </div>
            )}

            {/* Tab 2: Chemical Examination */}
            {activeTab === 'CHEMICAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Protein & Glucose */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Protein / Albumin (الزلال)"
                    refRange="Nil (Negative)"
                    value={data.protein}
                    onChange={(v) => setField('protein', v)}
                    options={['Nil', 'Trace', '1+', '2+', '3+', '4+']}
                    abnormalValues={['1+', '2+', '3+', '4+']}
                  />

                  <PillSelector
                    label="Glucose / Sugar (السكر)"
                    refRange="Nil (Negative)"
                    value={data.glucose}
                    onChange={(v) => setField('glucose', v)}
                    options={['Nil', 'Trace', '1+', '2+', '3+', '4+']}
                    abnormalValues={['1+', '2+', '3+', '4+']}
                  />
                </div>

                {/* Ketones & Blood */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Ketones / Acetone (الأسيتون)"
                    refRange="Nil (Negative)"
                    value={data.ketones}
                    onChange={(v) => setField('ketones', v)}
                    options={['Nil', 'Trace', '1+', '2+', '3+']}
                    abnormalValues={['1+', '2+', '3+']}
                  />

                  <PillSelector
                    label="Blood / Hemoglobin (الدم)"
                    refRange="Negative"
                    value={data.blood}
                    onChange={(v) => setField('blood', v)}
                    options={['Negative', 'Trace', '1+', '2+', '3+']}
                    abnormalValues={['Trace', '1+', '2+', '3+']}
                  />
                </div>

                {/* Nitrite & Leukocytes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Nitrite (النتريت)"
                    refRange="Negative"
                    value={data.nitrite}
                    onChange={(v) => setField('nitrite', v)}
                    options={['Negative', 'Positive (+)']}
                    abnormalValues={['Positive (+)']}
                  />

                  <PillSelector
                    label="Leukocyte Esterase (إنزيم الكريات)"
                    refRange="Negative"
                    value={data.leukocyteEsterase}
                    onChange={(v) => setField('leukocyteEsterase', v)}
                    options={['Negative', 'Trace', '1+', '2+', '3+']}
                    abnormalValues={['1+', '2+', '3+']}
                  />
                </div>

                {/* Bilirubin & Urobilinogen */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Bilirubin (الصفراء)"
                    refRange="Negative"
                    value={data.bilirubin}
                    onChange={(v) => setField('bilirubin', v)}
                    options={['Negative', '1+', '2+', '3+']}
                    abnormalValues={['1+', '2+', '3+']}
                  />

                  <PillSelector
                    label="Urobilinogen (اليوروبيلينوجين)"
                    refRange="Normal"
                    value={data.urobilinogen}
                    onChange={(v) => setField('urobilinogen', v)}
                    options={['Normal', '1+', '2+', '3+']}
                    abnormalValues={['2+', '3+']}
                  />
                </div>

              </div>
            )}

            {/* Tab 3: Microscopic Examination (HPF) */}
            {activeTab === 'MICROSCOPIC' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Pus & RBCs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Pus Cells / WBCs (خلايا الصديد)"
                    refRange="0 - 5 /HPF"
                    value={data.pusCells}
                    onChange={(v) => setField('pusCells', v)}
                    options={['0-2', '2-4', '4-6', '8-10', '15-20', '25-35', '40-50', 'Full Slide']}
                    abnormalValues={['8-10', '15-20', '25-35', '40-50', 'Full Slide']}
                  />

                  <PillSelector
                    label="RBCs / Erythrocytes (كريات الدم)"
                    refRange="0 - 2 /HPF"
                    value={data.rbcs}
                    onChange={(v) => setField('rbcs', v)}
                    options={['0-2', '2-4', '5-10', '15-25', 'Packed / Bloody']}
                    abnormalValues={['5-10', '15-25', 'Packed / Bloody']}
                  />
                </div>

                {/* Epithelial Cells */}
                <PillSelector
                  label="Epithelial Cells (الخلايا الظهارية)"
                  refRange="Few /HPF"
                  value={data.epithelialCells}
                  onChange={(v) => setField('epithelialCells', v)}
                  options={['Nil', 'Few', 'Moderate', 'Many']}
                  abnormalValues={['Moderate', 'Many']}
                />

                {/* Crystals & Amorphous Multi-Selector Grid */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Crystals & Amorphous (الأملاح والبلورات - اختيار متعدد)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      يمكن تحديد أكثر من نوع في نفس العينة
                    </span>
                  </div>

                  {/* Crystal 1: Calcium Oxalate */}
                  <CrystalSelectorRow
                    name="Ca. Oxalate"
                    arabicName="أوكزالات الكالسيوم"
                    value={data.calciumOxalate}
                    onChange={(lvl) => setField('calciumOxalate', lvl)}
                  />

                  {/* Crystal 2: Uric Acid */}
                  <CrystalSelectorRow
                    name="Uric Acid"
                    arabicName="حامض اليوريك"
                    value={data.uricAcid}
                    onChange={(lvl) => setField('uricAcid', lvl)}
                  />

                  {/* Crystal 3: Triple Phosphate */}
                  <CrystalSelectorRow
                    name="Triple Phos"
                    arabicName="فوسفات ثلاثي"
                    value={data.triplePhosphate}
                    onChange={(lvl) => setField('triplePhosphate', lvl)}
                  />

                  {/* Crystal 4: Amorphous Urates / Phosphates */}
                  <CrystalSelectorRow
                    name="Amorphous"
                    arabicName="أملاح غير متبلورة"
                    value={data.amorphous}
                    onChange={(lvl) => setField('amorphous', lvl)}
                  />
                </div>

                {/* Microorganisms & Casts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Bacteria (البكتيريا)"
                    refRange="Nil"
                    value={data.bacteria}
                    onChange={(v) => setField('bacteria', v)}
                    options={['Nil', 'Few (+)', 'Moderate (++)', 'Many (+++)', '++++', 'Full Field']}
                    abnormalValues={['Moderate (++)', 'Many (+++)', '++++', 'Full Field']}
                  />

                  <PillSelector
                    label="Mucus Threads (المخاط)"
                    refRange="Nil"
                    value={data.mucus}
                    onChange={(v) => setField('mucus', v)}
                    options={['Nil', 'Few (+)', 'Moderate (++)', 'Many (+++)', '++++', 'Full Field']}
                    abnormalValues={['Many (+++)', '++++', 'Full Field']}
                  />
                </div>

                {/* Yeast, Trichomonas, Casts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Yeast (الفطريات)</div>
                    <select
                      value={data.yeast}
                      onChange={(e) => setField('yeast', e.target.value)}
                      className="select-control"
                      style={{ height: '32px', fontSize: '11.5px', width: '100%', background: '#f8fafc', borderColor: '#cbd5e1' }}
                    >
                      <option value="Not Seen">Not Seen</option>
                      <option value="Few (+)">Few (+)</option>
                      <option value="Moderate (++)">Moderate (++)</option>
                      <option value="Many (+++)">Many (+++)</option>
                      <option value="++++">++++ (4+)</option>
                      <option value="Full Field">Full Field</option>
                    </select>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Trichomonas (المشعرات)</div>
                    <select
                      value={data.trichomonas}
                      onChange={(e) => setField('trichomonas', e.target.value)}
                      className="select-control"
                      style={{ height: '32px', fontSize: '11.5px', width: '100%', background: '#f8fafc', borderColor: '#cbd5e1' }}
                    >
                      <option value="Not Seen">Not Seen</option>
                      <option value="Seen (+)">Seen (+)</option>
                      <option value="Moderate (++)">Moderate (++)</option>
                      <option value="Many (+++)">Many (+++)</option>
                      <option value="Full Field">Full Field</option>
                    </select>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Casts (الأسطوانات)</div>
                    <select
                      value={data.casts}
                      onChange={(e) => setField('casts', e.target.value)}
                      className="select-control"
                      style={{ height: '32px', fontSize: '11.5px', width: '100%', background: '#f8fafc', borderColor: '#cbd5e1' }}
                    >
                      <option value="None">None</option>
                      <option value="Hyaline (+)">Hyaline (+)</option>
                      <option value="Hyaline (++)">Hyaline (++)</option>
                      <option value="Granular (+)">Granular (+)</option>
                      <option value="Granular (++)">Granular (++)</option>
                      <option value="WBC Casts">WBC Casts</option>
                      <option value="RBC Casts">RBC Casts</option>
                      <option value="Full Field">Full Field</option>
                    </select>
                  </div>
                </div>

                {/* Additional Clinical Notes */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                    Diagnostic Notes / Impression (ملاحظات تشخيصية)
                  </div>
                  <input
                    type="text"
                    value={data.otherNotes}
                    onChange={(e) => setField('otherNotes', e.target.value)}
                    placeholder="e.g. UTI pattern, Calcium Oxalate crystals, Normal findings..."
                    className="input-control"
                    style={{ height: '34px', fontSize: '12px', width: '100%', background: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }}
                  />
                </div>

              </div>
            )}

          </div>

          {/* ----------------------------------------------------
              RIGHT PANEL: LIVE PATIENT REPORT PRINT PREVIEW (MODEL B FEATURE)
             ---------------------------------------------------- */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            
            {/* Header of Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #0284c7',
              paddingBottom: '10px',
              marginBottom: '12px',
            }}>
              <div>
                <span style={{ fontSize: '10px', background: '#0284c7', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  A4 REPORT PREVIEW
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0 0' }}>
                  General Urine Examination (G.U.E)
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Sample #{sampleNumber}
                </span>
              </div>
            </div>

            {/* Preview Mini Tables */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px' }}>
              
              {/* Section 1: Physical */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                  PHYSICAL EXAMINATION
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Color:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.color}</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Clarity:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.appearance}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Sp. Gravity:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.spGravity}</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Reaction (pH):</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.reactionPh}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Chemical */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                  CHEMICAL EXAMINATION
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Protein:</td>
                      <td style={{ fontWeight: 700, color: isProteinAbnormal ? '#dc2626' : '#0f172a' }}>{data.protein}</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Glucose:</td>
                      <td style={{ fontWeight: 700, color: isGlucoseAbnormal ? '#dc2626' : '#0f172a' }}>{data.glucose}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Ketones:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.ketones}</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Blood:</td>
                      <td style={{ fontWeight: 700, color: isBloodAbnormal ? '#dc2626' : '#0f172a' }}>{data.blood}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Nitrite:</td>
                      <td style={{ fontWeight: 700, color: isNitriteAbnormal ? '#dc2626' : '#0f172a' }}>{data.nitrite}</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Leukocytes:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.leukocyteEsterase}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Microscopic */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                  MICROSCOPIC EXAMINATION (HPF)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0', width: '25%' }}>Pus Cells:</td>
                      <td style={{ fontWeight: 700, color: isPusAbnormal ? '#dc2626' : '#0f172a', width: '25%' }}>{data.pusCells} /HPF</td>
                      <td style={{ color: '#64748b', padding: '2px 0', width: '25%' }}>RBCs:</td>
                      <td style={{ fontWeight: 700, color: isRbcAbnormal ? '#dc2626' : '#0f172a', width: '25%' }}>{data.rbcs} /HPF</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Epithelial:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.epithelialCells}</td>
                      {data.bacteria !== 'Nil' ? (
                        <>
                          <td style={{ color: '#64748b', padding: '2px 0' }}>Bacteria:</td>
                          <td style={{ fontWeight: 700, color: '#dc2626' }}>{data.bacteria}</td>
                        </>
                      ) : (
                        <td colSpan={2}></td>
                      )}
                    </tr>

                    {/* Crystals: Only display selected / positive crystals, or clean Crystals: Nil */}
                    {(() => {
                      const activeCrystals = [
                        { name: 'Ca. Oxalate', val: data.calciumOxalate },
                        { name: 'Uric Acid', val: data.uricAcid },
                        { name: 'Triple Phos', val: data.triplePhosphate },
                        { name: 'Amorphous', val: data.amorphous },
                      ].filter(c => c.val && c.val !== 'Nil');

                      if (activeCrystals.length === 0) {
                        return (
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0' }}>Crystals:</td>
                            <td colSpan={3} style={{ fontWeight: 600, color: '#64748b' }}>Nil (Not Seen)</td>
                          </tr>
                        );
                      }

                      return activeCrystals.map((c, i) => {
                        const isSevere = ['+++', '++++', 'Full Field'].includes(c.val);
                        return (
                          <tr key={i}>
                            <td style={{ color: '#64748b', padding: '2px 0' }}>{c.name}:</td>
                            <td colSpan={3} style={{ fontWeight: 800, color: isSevere ? '#dc2626' : '#0284c7' }}>
                              {c.val}
                            </td>
                          </tr>
                        );
                      });
                    })()}

                    {/* Microorganisms, Casts, Mucus: Only if positive / selected */}
                    {data.mucus !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Mucus:</td>
                        <td colSpan={3} style={{ fontWeight: 600, color: '#0f172a' }}>{data.mucus}</td>
                      </tr>
                    )}
                    {data.casts !== 'None' && data.casts !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Casts:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#dc2626' }}>{data.casts}</td>
                      </tr>
                    )}
                    {data.yeast !== 'Not Seen' && data.yeast !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Yeast:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#dc2626' }}>{data.yeast}</td>
                      </tr>
                    )}
                    {data.trichomonas !== 'Not Seen' && data.trichomonas !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Trichomonas:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#dc2626' }}>{data.trichomonas}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes part */}
              {data.otherNotes && (
                <div style={{
                  background: '#f1f5f9',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '10.5px',
                  color: '#334155',
                }}>
                  <strong>Note:</strong> {data.otherNotes}
                </div>
              )}

            </div>

            {/* Stamp / verification text */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '9.5px',
              color: '#94a3b8',
            }}>
              <span>Labryo Diagnostic System • Verified</span>
              <span>100% Medical Standard</span>
            </div>

          </div>

        </div>

        {/* ========================================================
            3. FOOTER ACTION BAR
           ======================================================== */}
        <div style={{
          padding: '12px 20px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Previous / Next Tab buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'PHYSICAL' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'MICROSCOPIC' ? 'CHEMICAL' : 'PHYSICAL')}
                className="btn-secondary"
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', height: '38px' }}
              >
                <ChevronLeft size={16} />
                <span>Previous Tab</span>
              </button>
            )}
            {activeTab !== 'MICROSCOPIC' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'PHYSICAL' ? 'CHEMICAL' : 'MICROSCOPIC')}
                className="btn-secondary"
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', height: '38px' }}
              >
                <span>Next Tab</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Cancel & Main Save & Apply Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '12.5px', height: '38px', padding: '0 18px' }}
            >
              إلغاء (Cancel)
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                padding: '0 28px',
                height: '40px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              <span>حفظ وتطبيق نتيجة التحليل (SAVE & APPLY)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

