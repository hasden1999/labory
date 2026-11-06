'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Sparkles,
  RotateCcw,
  Bug,
  ShieldAlert,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Filter
} from 'lucide-react';
import { useToast } from '../Toast';

export interface AntibioticSensitivityItem {
  antibiotic: string;
  diskContent: string;
  category?: 'gram_negative' | 'gram_positive' | 'broad_spectrum';
  zoneMm?: number;
  interpretation: 'S' | 'I' | 'R' | '-';
}

export interface MicrobiologyData {
  specimen: string;
  gramStain: string;
  colonyCount: string;
  organism: string;
  antibiogram: AntibioticSensitivityItem[];
  notes: string;
}

export const DEFAULT_ANTIBIOTICS: { name: string; disk: string; category: 'gram_negative' | 'gram_positive' | 'broad_spectrum' }[] = [
  { name: 'Amikacin', disk: '30 ug', category: 'gram_negative' },
  { name: 'Amoxicillin-Clavulanate', disk: '20/10 ug', category: 'broad_spectrum' },
  { name: 'Ampicillin', disk: '10 ug', category: 'broad_spectrum' },
  { name: 'Cefepime', disk: '30 ug', category: 'gram_negative' },
  { name: 'Ceftriaxone', disk: '30 ug', category: 'broad_spectrum' },
  { name: 'Cefotaxime', disk: '30 ug', category: 'gram_negative' },
  { name: 'Ceftazidime', disk: '30 ug', category: 'gram_negative' },
  { name: 'Ciprofloxacin', disk: '5 ug', category: 'broad_spectrum' },
  { name: 'Colistin', disk: '10 ug', category: 'gram_negative' },
  { name: 'Gentamicin', disk: '10 ug', category: 'broad_spectrum' },
  { name: 'Imipenem', disk: '10 ug', category: 'broad_spectrum' },
  { name: 'Meropenem', disk: '10 ug', category: 'broad_spectrum' },
  { name: 'Levofloxacin', disk: '5 ug', category: 'broad_spectrum' },
  { name: 'Nitrofurantoin', disk: '300 ug', category: 'gram_negative' },
  { name: 'Piperacillin-Tazobactam', disk: '100/10 ug', category: 'broad_spectrum' },
  { name: 'Trimethoprim-Sulfamethoxazole', disk: '1.25/23.75 ug', category: 'broad_spectrum' },
  { name: 'Vancomycin', disk: '30 ug', category: 'gram_positive' },
  { name: 'Linezolid', disk: '30 ug', category: 'gram_positive' },
  { name: 'Doxycycline', disk: '30 ug', category: 'broad_spectrum' },
  { name: 'Azithromycin', disk: '15 ug', category: 'broad_spectrum' },
  { name: 'Clindamycin', disk: '2 ug', category: 'gram_positive' },
  { name: 'Erythromycin', disk: '15 ug', category: 'gram_positive' },
];

export const DEFAULT_MICROBIOLOGY_DATA: MicrobiologyData = {
  specimen: 'Clean Catch Midstream Urine',
  gramStain: 'Gram-negative bacilli (GNB), moderate pus cells',
  colonyCount: '> 100,000 CFU/mL (Significant bacteriuria)',
  organism: 'Escherichia coli',
  antibiogram: DEFAULT_ANTIBIOTICS.map(a => ({
    antibiotic: a.name,
    diskContent: a.disk,
    category: a.category,
    zoneMm: undefined,
    interpretation: '-'
  })),
  notes: 'Isolate sensitive to Carbapenems, Nitrofurantoin, and Aminoglycosides.'
};

export const SPECIMEN_PILLS = [
  'Clean Catch Midstream Urine',
  'Wound Swab',
  'Sputum',
  'Blood Culture',
  'Stool Culture',
  'High Vaginal Swab (HVS)',
  'Throat Swab',
  'Ear Swab',
  'Pus / Aspirate',
  'Urethral Discharge'
];

export const GRAM_STAIN_PILLS = [
  'Gram-negative bacilli (GNB)',
  'Gram-positive cocci (GPC) in clusters',
  'Gram-positive cocci (GPC) in pairs/chains',
  'Gram-positive bacilli (GPB)',
  'No microorganisms seen. Few pus cells.',
  'Moderate pus cells, no bacteria seen'
];

export const COLONY_COUNT_PILLS = [
  'No growth after 48 hours at 37°C',
  '> 100,000 CFU/mL (Significant bacteriuria)',
  '10,000 - 100,000 CFU/mL (Borderline)',
  '< 10,000 CFU/mL (Non-significant)',
  'Heavy growth (+++)',
  'Moderate growth (++)',
  'Scanty growth (+)'
];

export const ORGANISM_PILLS = [
  'No Bacterial Growth (Sterile Culture)',
  'Escherichia coli',
  'Escherichia coli (ESBL-producing)',
  'Klebsiella pneumoniae',
  'Pseudomonas aeruginosa',
  'Staphylococcus aureus',
  'Staphylococcus aureus (MRSA)',
  'Staphylococcus epidermidis',
  'Proteus mirabilis',
  'Enterococcus faecalis',
  'Candida albicans'
];

export const NOTE_PILLS = [
  'Sterile culture after 48 hours of incubation at 37°C.',
  'Multidrug-resistant (MDR) strain. Recommend clinical correlation.',
  'Sensitive to Carbapenems, Nitrofurantoin, and Aminoglycosides.',
  'Repeat culture advised after 72 hours of antimicrobial therapy.'
];

export function serializeMicrobiology(data: MicrobiologyData): string {
  const parts: string[] = ['[MICROBIOLOGY & ANTIBIOGRAM REPORT]'];

  parts.push(`SPECIMEN: ${data.specimen}`);
  parts.push(`GRAM_STAIN: ${data.gramStain}`);
  parts.push(`COLONY_COUNT: ${data.colonyCount}`);
  parts.push(`ORGANISM: ${data.organism}`);

  const activeAnti = data.antibiogram.filter(a => a.interpretation !== '-');
  if (activeAnti.length > 0) {
    const listStr = activeAnti
      .map(a => `${a.antibiotic} (${a.diskContent}): ${a.interpretation}${a.zoneMm ? ` [${a.zoneMm}mm]` : ''}`)
      .join(' | ');
    parts.push(`ANTIBIOGRAM: ${listStr}`);
  } else {
    parts.push(`ANTIBIOGRAM: No active antibiogram performed (Negative / No growth).`);
  }

  if (data.notes && data.notes.trim()) {
    parts.push(`NOTES: ${data.notes.trim()}`);
  }

  return parts.join('\n');
}

export function parseMicrobiology(raw: string): MicrobiologyData {
  if (!raw || !raw.includes('MICROBIOLOGY')) return { ...DEFAULT_MICROBIOLOGY_DATA };

  const parsed: MicrobiologyData = {
    ...DEFAULT_MICROBIOLOGY_DATA,
    antibiogram: DEFAULT_ANTIBIOTICS.map(a => ({
      antibiotic: a.name,
      diskContent: a.disk,
      category: a.category,
      zoneMm: undefined,
      interpretation: '-'
    }))
  };

  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('SPECIMEN:')) {
      parsed.specimen = trimmed.replace('SPECIMEN:', '').trim();
    } else if (trimmed.startsWith('GRAM_STAIN:')) {
      parsed.gramStain = trimmed.replace('GRAM_STAIN:', '').trim();
    } else if (trimmed.startsWith('COLONY_COUNT:')) {
      parsed.colonyCount = trimmed.replace('COLONY_COUNT:', '').trim();
    } else if (trimmed.startsWith('ORGANISM:')) {
      parsed.organism = trimmed.replace('ORGANISM:', '').trim();
    } else if (trimmed.startsWith('ANTIBIOGRAM:')) {
      const antiStr = trimmed.replace('ANTIBIOGRAM:', '').trim();
      if (!antiStr.includes('No active')) {
        const items = antiStr.split('|');
        items.forEach(item => {
          const match = item.trim().match(/^(.*?)\s*\((.*?)\):\s*([SIR])(?:\s*\[(\d+)mm\])?/i);
          if (match) {
            const name = match[1].trim();
            const interp = match[3].toUpperCase() as 'S' | 'I' | 'R';
            const zone = match[4] ? parseInt(match[4]) : undefined;
            const target = parsed.antibiogram.find(a => a.antibiotic.toLowerCase() === name.toLowerCase());
            if (target) {
              target.interpretation = interp;
              target.zoneMm = zone;
            }
          }
        });
      }
    } else if (trimmed.startsWith('NOTES:')) {
      parsed.notes = trimmed.replace('NOTES:', '').trim();
    }
  }

  return parsed;
}

interface MicrobiologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: any;
  initialValue?: string;
  onSave: (serialized: string, isAbnormal: boolean) => Promise<void> | void;
}

export default function MicrobiologyModal({
  isOpen,
  onClose,
  sample,
  initialValue,
  onSave
}: MicrobiologyModalProps) {
  const toast = useToast();
  const [data, setData] = useState<MicrobiologyData>(DEFAULT_MICROBIOLOGY_DATA);
  const [saving, setSaving] = useState(false);
  const [antibioticFilter, setAntibioticFilter] = useState<'ALL' | 'GRAM_NEG' | 'GRAM_POS' | 'ACTIVE_ONLY'>('ALL');
  const [antibioticSearch, setAntibioticSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue.includes('MICROBIOLOGY')) {
        setData(parseMicrobiology(initialValue));
      } else {
        setData({
          ...DEFAULT_MICROBIOLOGY_DATA,
          antibiogram: DEFAULT_ANTIBIOTICS.map(a => ({
            antibiotic: a.name,
            diskContent: a.disk,
            category: a.category,
            zoneMm: undefined,
            interpretation: '-'
          }))
        });
      }
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const setInterpretation = (index: number, val: 'S' | 'I' | 'R' | '-') => {
    setData(prev => {
      const updated = [...prev.antibiogram];
      updated[index] = { ...updated[index], interpretation: val };
      return { ...prev, antibiogram: updated };
    });
  };

  const setZone = (index: number, zone: number | undefined) => {
    setData(prev => {
      const updated = [...prev.antibiogram];
      updated[index] = { ...updated[index], zoneMm: zone };
      return { ...prev, antibiogram: updated };
    });
  };

  // Clinical Quick Presets matching Urine/Stool style
  const applyPreset = (presetName: 'STERILE' | 'ECOLI' | 'MRSA' | 'PSEUDOMONAS' | 'RESET') => {
    if (presetName === 'STERILE' || presetName === 'RESET') {
      setData({
        specimen: 'Clean Catch Midstream Urine',
        gramStain: 'No microorganisms seen. Few epithelial cells.',
        colonyCount: 'No growth after 48 hours at 37°C',
        organism: 'No Bacterial Growth (Sterile Culture)',
        antibiogram: DEFAULT_ANTIBIOTICS.map(a => ({
          antibiotic: a.name,
          diskContent: a.disk,
          category: a.category,
          zoneMm: undefined,
          interpretation: '-'
        })),
        notes: 'Negative aerobic culture. No significant bacteriuria detected.'
      });
      toast.success('تم تطبيق نتيجة زراعة سالبة / عقيمة (Sterile / No Growth)');
    } else if (presetName === 'ECOLI') {
      const list: Record<string, { interp: 'S' | 'I' | 'R'; zone: number }> = {
        'Amikacin': { interp: 'S', zone: 22 },
        'Amoxicillin-Clavulanate': { interp: 'R', zone: 12 },
        'Ampicillin': { interp: 'R', zone: 8 },
        'Cefepime': { interp: 'R', zone: 14 },
        'Ceftriaxone': { interp: 'R', zone: 11 },
        'Ciprofloxacin': { interp: 'R', zone: 13 },
        'Colistin': { interp: 'S', zone: 18 },
        'Gentamicin': { interp: 'S', zone: 19 },
        'Imipenem': { interp: 'S', zone: 26 },
        'Meropenem': { interp: 'S', zone: 28 },
        'Nitrofurantoin': { interp: 'S', zone: 20 },
        'Piperacillin-Tazobactam': { interp: 'S', zone: 21 },
        'Trimethoprim-Sulfamethoxazole': { interp: 'R', zone: 10 },
      };
      setData(prev => ({
        ...prev,
        specimen: 'Clean Catch Midstream Urine',
        gramStain: 'Gram-negative bacilli (GNB), moderate pus cells',
        colonyCount: '> 100,000 CFU/mL (Significant bacteriuria)',
        organism: 'Escherichia coli (ESBL-producing)',
        antibiogram: prev.antibiogram.map(a => ({
          ...a,
          interpretation: list[a.antibiotic]?.interp || '-',
          zoneMm: list[a.antibiotic]?.zone,
        })),
        notes: 'Multidrug-resistant ESBL strain isolated. Sensitive to Carbapenems, Nitrofurantoin, and Aminoglycosides.'
      }));
      toast.success('تم تطبيق نموذج عزل بكتيريا القولون (ESBL E. coli)');
    } else if (presetName === 'MRSA') {
      const list: Record<string, { interp: 'S' | 'I' | 'R'; zone: number }> = {
        'Vancomycin': { interp: 'S', zone: 20 },
        'Linezolid': { interp: 'S', zone: 24 },
        'Doxycycline': { interp: 'S', zone: 22 },
        'Trimethoprim-Sulfamethoxazole': { interp: 'S', zone: 20 },
        'Ciprofloxacin': { interp: 'R', zone: 12 },
        'Gentamicin': { interp: 'R', zone: 11 },
        'Clindamycin': { interp: 'R', zone: 10 },
        'Erythromycin': { interp: 'R', zone: 9 },
        'Ampicillin': { interp: 'R', zone: 6 },
        'Amoxicillin-Clavulanate': { interp: 'R', zone: 12 },
      };
      setData(prev => ({
        ...prev,
        specimen: 'Wound Swab / Pus',
        gramStain: 'Gram-positive cocci (GPC) in clusters',
        colonyCount: 'Heavy growth (+++)',
        organism: 'Staphylococcus aureus (MRSA)',
        antibiogram: prev.antibiogram.map(a => ({
          ...a,
          interpretation: list[a.antibiotic]?.interp || '-',
          zoneMm: list[a.antibiotic]?.zone,
        })),
        notes: 'Methicillin-Resistant Staphylococcus aureus (MRSA) confirmed. Sensitive to Glycopeptides (Vancomycin) and Linezolid.'
      }));
      toast.success('تم تطبيق نموذج عزل المكورات العنقودية (MRSA)');
    } else if (presetName === 'PSEUDOMONAS') {
      const list: Record<string, { interp: 'S' | 'I' | 'R'; zone: number }> = {
        'Amikacin': { interp: 'S', zone: 22 },
        'Ceftazidime': { interp: 'S', zone: 20 },
        'Cefepime': { interp: 'S', zone: 19 },
        'Ciprofloxacin': { interp: 'S', zone: 24 },
        'Colistin': { interp: 'S', zone: 18 },
        'Gentamicin': { interp: 'I', zone: 15 },
        'Imipenem': { interp: 'S', zone: 24 },
        'Meropenem': { interp: 'S', zone: 25 },
        'Piperacillin-Tazobactam': { interp: 'S', zone: 23 },
        'Trimethoprim-Sulfamethoxazole': { interp: 'R', zone: 8 },
        'Ampicillin': { interp: 'R', zone: 6 },
      };
      setData(prev => ({
        ...prev,
        specimen: 'Wound Swab / Sputum',
        gramStain: 'Gram-negative bacilli (GNB), abundant pus cells',
        colonyCount: 'Heavy growth (+++)',
        organism: 'Pseudomonas aeruginosa',
        antibiogram: prev.antibiogram.map(a => ({
          ...a,
          interpretation: list[a.antibiotic]?.interp || '-',
          zoneMm: list[a.antibiotic]?.zone,
        })),
        notes: 'Pseudomonas aeruginosa isolated with typical pigment and odor. Antipseudomonal sensitivity tested.'
      }));
      toast.success('تم تطبيق نموذج عزل الزائفة الزنجارية (Pseudomonas)');
    }
  };

  const handleSetAllSensitive = () => {
    setData(prev => ({
      ...prev,
      antibiogram: prev.antibiogram.map(a => ({ ...a, interpretation: 'S' }))
    }));
    toast.info('تم تعيين كافة المضادات كـ حساس (Sensitive)');
  };

  const handleClearAllAntibiogram = () => {
    setData(prev => ({
      ...prev,
      antibiogram: prev.antibiogram.map(a => ({ ...a, interpretation: '-', zoneMm: undefined }))
    }));
    toast.info('تم تفريغ مصفوفة المضادات');
  };

  const isAbnormal =
    !data.organism.toLowerCase().includes('no bacterial growth') &&
    !data.colonyCount.toLowerCase().includes('no growth') &&
    !data.organism.toLowerCase().includes('sterile');

  const filteredAntibiotics = useMemo(() => {
    return data.antibiogram.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
      if (antibioticSearch.trim()) {
        const q = antibioticSearch.toLowerCase();
        if (!item.antibiotic.toLowerCase().includes(q)) return false;
      }
      if (antibioticFilter === 'GRAM_NEG') return item.category === 'gram_negative' || item.category === 'broad_spectrum';
      if (antibioticFilter === 'GRAM_POS') return item.category === 'gram_positive' || item.category === 'broad_spectrum';
      if (antibioticFilter === 'ACTIVE_ONLY') return item.interpretation !== '-';
      return true;
    });
  }, [data.antibiogram, antibioticFilter, antibioticSearch]);

  const activeAntibioticsCount = data.antibiogram.filter(a => a.interpretation !== '-').length;

  const handleSave = async () => {
    try {
      setSaving(true);
      const serialized = serializeMicrobiology(data);
      await onSave(serialized, isAbnormal);
      toast.success('تم حفظ تقرير المزرعة والحساسية بنجاح!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ النتائج');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      dir="rtl"
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1220px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.4)',
          overflow: 'hidden',
          fontFamily: 'inherit',
          color: 'var(--text-main)',
        }}
      >
        {/* ========================================================
            1. TOP CLINICAL HEADER BAR (Identical to Urine & Stool)
           ======================================================== */}
        <div
          dir="ltr"
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card-subtle)',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Patient Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(15, 118, 110, 0.15)',
                color: 'var(--accent-teal)',
                border: '1px solid var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bug size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {sample?.patient?.name || sample?.patientName || 'Patient'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  Sample #{sample?.sampleNumber || sample?.id || ''}
                </span>
                {isAbnormal ? (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #f87171',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle size={12} /> عزل بكتيري موجب
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Check size={12} /> عينة عقيمة (No Growth)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Microbiology & Antibiogram Workstation • فحص المزرعة والحساسية
              </div>
            </div>
          </div>

          {/* Quick Presets (1-Click) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              نماذج جاهزة:
            </span>

            <button
              type="button"
              onClick={() => applyPreset('STERILE')}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #10b981',
                background: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={13} />
              عقيمة (Sterile)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('ECOLI')}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #f59e0b',
                background: '#fffbeb',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldAlert size={13} />
              عزل E. coli
            </button>

            <button
              type="button"
              onClick={() => applyPreset('MRSA')}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #ef4444',
                background: '#fef2f2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              عزل MRSA
            </button>

            <button
              type="button"
              onClick={() => applyPreset('PSEUDOMONAS')}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #8b5cf6',
                background: '#f5f3ff',
                color: '#6d28d9',
              }}
            >
              Pseudomonas
            </button>

            <button
              type="button"
              onClick={() => applyPreset('RESET')}
              title="إعادة ضبط الفورمة"
              style={{
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
              }}
            >
              <RotateCcw size={13} />
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. MODAL BODY (Interactive Workspace & Pill Selectors)
           ======================================================== */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Section 1: Isolation & Specimen Card */}
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <FlaskConical size={16} color="var(--accent-teal)" />
              <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                1. بيانات العينة والعزل البكتيري (Specimen & Bacterial Isolation):
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {/* Specimen */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  نوع ومصدر العينة (Specimen):
                </label>
                <input
                  type="text"
                  value={data.specimen}
                  onChange={e => setData({ ...data, specimen: e.target.value })}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Clean Catch Urine, Wound..."
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {SPECIMEN_PILLS.slice(0, 5).map(pill => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setData({ ...data, specimen: pill })}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: data.specimen === pill ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                        background: data.specimen === pill ? 'rgba(15, 118, 110, 0.15)' : 'var(--bg-input)',
                        color: data.specimen === pill ? 'var(--accent-teal)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gram Stain */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  صبغة غرام والمجهر (Gram Stain):
                </label>
                <input
                  type="text"
                  value={data.gramStain}
                  onChange={e => setData({ ...data, gramStain: e.target.value })}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {GRAM_STAIN_PILLS.slice(0, 4).map(pill => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setData({ ...data, gramStain: pill })}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: data.gramStain === pill ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                        background: data.gramStain === pill ? 'rgba(15, 118, 110, 0.15)' : 'var(--bg-input)',
                        color: data.gramStain === pill ? 'var(--accent-teal)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colony Count */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  عدد المستعمرات (Colony Count):
                </label>
                <input
                  type="text"
                  value={data.colonyCount}
                  onChange={e => setData({ ...data, colonyCount: e.target.value })}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {COLONY_COUNT_PILLS.slice(0, 4).map(pill => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setData({ ...data, colonyCount: pill })}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: data.colonyCount === pill ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                        background: data.colonyCount === pill ? 'rgba(15, 118, 110, 0.15)' : 'var(--bg-input)',
                        color: data.colonyCount === pill ? 'var(--accent-teal)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Isolated Organism */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  الميكروب المعزول (Isolated Organism):
                </label>
                <input
                  type="text"
                  value={data.organism}
                  onChange={e => setData({ ...data, organism: e.target.value })}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: isAbnormal ? '#ef4444' : '#10b981',
                    fontSize: '12.5px',
                    fontWeight: 900,
                    marginBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {ORGANISM_PILLS.slice(0, 6).map(pill => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setData({ ...data, organism: pill })}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: data.organism === pill ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                        background: data.organism === pill ? 'rgba(15, 118, 110, 0.15)' : 'var(--bg-input)',
                        color: data.organism === pill ? 'var(--accent-teal)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Antibiogram Sensitivity Matrix */}
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
                marginBottom: '12px',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bug size={16} color="var(--accent-teal)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  2. مصفوفة حساسية المضادات الحيوية (Antibiogram Matrix):
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({activeAntibioticsCount} مضاد محدد)
                </span>
              </div>

              {/* Antibiogram Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '150px' }}>
                  <input
                    type="text"
                    value={antibioticSearch}
                    onChange={e => setAntibioticSearch(e.target.value)}
                    placeholder="بحث مضاد..."
                    style={{
                      width: '100%',
                      height: '28px',
                      padding: '0 8px 0 24px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '11px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <Search size={12} style={{ position: 'absolute', right: '8px', top: '8px', color: 'var(--text-muted)' }} />
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['ALL', 'GRAM_NEG', 'GRAM_POS', 'ACTIVE_ONLY'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setAntibioticFilter(f)}
                      style={{
                        fontSize: '10.5px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: antibioticFilter === f ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                        background: antibioticFilter === f ? 'var(--accent-teal)' : 'var(--bg-input)',
                        color: antibioticFilter === f ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {f === 'ALL' ? 'الكل' : f === 'GRAM_NEG' ? 'Gram -ve' : f === 'GRAM_POS' ? 'Gram +ve' : 'المحددة فقط'}
                    </button>
                  ))}
                </div>

                {/* Quick actions */}
                <button
                  type="button"
                  onClick={handleSetAllSensitive}
                  style={{
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  الكل حساس (All S)
                </button>
                <button
                  type="button"
                  onClick={handleClearAllAntibiogram}
                  style={{
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  تفريغ الكل
                </button>
              </div>
            </div>

            {/* Antibiotics Matrix Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '8px',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '2px',
              }}
            >
              {filteredAntibiotics.map(({ item, originalIndex }) => {
                return (
                  <div
                    key={item.antibiotic}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: item.interpretation !== '-' ? 'var(--bg-card)' : 'var(--bg-input)',
                      border: item.interpretation !== '-' ? '1.5px solid var(--accent-teal)' : '1px solid var(--border-color)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.antibiotic}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {item.diskContent}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Zone mm */}
                      <input
                        type="number"
                        value={item.zoneMm ?? ''}
                        onChange={e => setZone(originalIndex, e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="mm"
                        style={{
                          width: '44px',
                          height: '24px',
                          padding: '0 2px',
                          textAlign: 'center',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-main)',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      />

                      {/* S / I / R / - pill group */}
                      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <button
                          type="button"
                          onClick={() => setInterpretation(originalIndex, item.interpretation === 'S' ? '-' : 'S')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            border: 'none',
                            background: item.interpretation === 'S' ? '#10b981' : 'var(--bg-input)',
                            color: item.interpretation === 'S' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.1s',
                          }}
                          title="حساس (Sensitive)"
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterpretation(originalIndex, item.interpretation === 'I' ? '-' : 'I')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            borderLeft: '1px solid var(--border-color)',
                            borderRight: '1px solid var(--border-color)',
                            borderTop: 'none',
                            borderBottom: 'none',
                            background: item.interpretation === 'I' ? '#f59e0b' : 'var(--bg-input)',
                            color: item.interpretation === 'I' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.1s',
                          }}
                          title="متوسط (Intermediate)"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterpretation(originalIndex, item.interpretation === 'R' ? '-' : 'R')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            border: 'none',
                            background: item.interpretation === 'R' ? '#ef4444' : 'var(--bg-input)',
                            color: item.interpretation === 'R' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.1s',
                          }}
                          title="مقاوم (Resistant)"
                        >
                          R
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Notes & Clinical Comments */}
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              3. ملاحظات وتوصيات المختبر (Microbiologist Notes & Comments):
            </label>
            <textarea
              rows={2}
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '12px',
                marginBottom: '6px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              placeholder="اكتب التوصيات الطبية والملاحظات السريرية هنا..."
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {NOTE_PILLS.map(pill => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes} ${pill}` : pill }))}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  + {pill}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ========================================================
            3. FOOTER (Actions & Status)
           ======================================================== */}
        <div
          dir="ltr"
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card-subtle)',
            gap: '12px',
          }}
        >
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Diagnostic Status:</span>
            <strong style={{ color: isAbnormal ? '#ef4444' : '#10b981' }}>
              {isAbnormal ? 'Positive Isolation (إيجابي)' : 'Sterile / No Growth (عقيم)'}
            </strong>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0 16px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0 20px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: '#0f766e',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)',
              }}
            >
              <Check size={16} />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ وإدراج النتيجة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
