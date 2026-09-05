'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Microscope, 
  Plus, 
  Trash2, 
  Activity, 
  AlertOctagon, 
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Bug
} from 'lucide-react';
import { useToast } from '../Toast';

export interface ParasiteEntry {
  organism: string;
  stage: string;
  severity: string;
}

export interface GseAnalysisData {
  // Physical Examination
  color: string;
  consistency: string;

  // Occult Blood
  fobt: string;

  // Microscopic Examination (HPF)
  pusCells: string;
  rbcs: string;
  muscleFibers: string;
  starchGranules: string;
  fatGlobules: string;
  vegetableCells: string;

  // Parasitology Matrix
  parasites: ParasiteEntry[];

  // Notes
  notes: string;
}

export const DEFAULT_GSE_DATA: GseAnalysisData = {
  color: 'Brown',
  consistency: 'Formed',
  fobt: 'Negative',
  pusCells: '0-2',
  rbcs: '0-1',
  muscleFibers: 'Nil',
  starchGranules: 'Nil',
  fatGlobules: 'Nil',
  vegetableCells: 'Nil',
  parasites: [],
  notes: 'No parasites, cysts, or ova seen in direct saline and iodine wet mounts.'
};

const COMMON_PARASITES = [
  { organism: 'Entamoeba histolytica', defaultStage: 'Cyst' },
  { organism: 'Entamoeba histolytica', defaultStage: 'Trophozoite (Hematophagous)' },
  { organism: 'Entamoeba coli', defaultStage: 'Cyst' },
  { organism: 'Giardia lamblia', defaultStage: 'Cyst' },
  { organism: 'Giardia lamblia', defaultStage: 'Trophozoite' },
  { organism: 'Blastocystis hominis', defaultStage: 'Vacuolar' },
  { organism: 'Trichomonas hominis', defaultStage: 'Trophozoite' },
  { organism: 'Ascaris lumbricoides', defaultStage: 'Fertilized Ova' },
  { organism: 'Ancylostoma duodenale (Hookworm)', defaultStage: 'Ova' },
  { organism: 'Hymenolepis nana', defaultStage: 'Ova' },
  { organism: 'Enterobius vermicularis (Pinworm)', defaultStage: 'Ova' },
  { organism: 'Taenia saginata/solium', defaultStage: 'Ova' },
  { organism: 'Trichuris trichiura (Whipworm)', defaultStage: 'Ova' },
  { organism: 'Schistosoma mansoni', defaultStage: 'Lateral-spine Ova' },
  { organism: 'Strongyloides stercoralis', defaultStage: 'Rhabditiform Larva' },
];

export function serializeGse(data: GseAnalysisData): string {
  const parts: string[] = ['[G.S.E - GENERAL STOOL EXAMINATION]'];
  
  parts.push(`PHYSICAL: Color: ${data.color} | Consistency: ${data.consistency}`);
  parts.push(`FOBT: ${data.fobt}`);

  const microItems: string[] = [
    `Pus Cells: ${data.pusCells} /HPF`,
    `RBCs: ${data.rbcs} /HPF`
  ];

  if (data.muscleFibers && data.muscleFibers !== 'Nil') {
    microItems.push(`Muscle Fibers: ${data.muscleFibers}`);
  }
  if (data.starchGranules && data.starchGranules !== 'Nil') {
    microItems.push(`Starch: ${data.starchGranules}`);
  }
  if (data.fatGlobules && data.fatGlobules !== 'Nil') {
    microItems.push(`Fat: ${data.fatGlobules}`);
  }
  if (data.vegetableCells && data.vegetableCells !== 'Nil') {
    microItems.push(`Vegetable: ${data.vegetableCells}`);
  }

  parts.push(`MICROSCOPIC: ${microItems.join(' | ')}`);

  if (data.parasites.length > 0) {
    const pStr = data.parasites.map(p => `${p.organism} [${p.stage}] (${p.severity})`).join(' | ');
    parts.push(`PARASITOLOGY: ${pStr}`);
  } else {
    parts.push(`PARASITOLOGY: Nil (No ova, cysts, or parasites seen)`);
  }

  if (data.notes && data.notes.trim()) {
    parts.push(`NOTES: ${data.notes.trim()}`);
  }

  return parts.join('\n');
}

export function parseGse(raw: string): GseAnalysisData {
  if (!raw || !raw.includes('G.S.E')) return { ...DEFAULT_GSE_DATA };

  const parsed = { ...DEFAULT_GSE_DATA, parasites: [] as ParasiteEntry[] };
  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('PHYSICAL:')) {
      const matchColor = trimmed.match(/Color:\s*([^|]+)/i);
      if (matchColor) parsed.color = matchColor[1].trim();
      const matchConst = trimmed.match(/Consistency:\s*([^|]+)/i);
      if (matchConst) parsed.consistency = matchConst[1].trim();
    } else if (trimmed.startsWith('FOBT:')) {
      parsed.fobt = trimmed.replace('FOBT:', '').trim();
    } else if (trimmed.startsWith('MICROSCOPIC:')) {
      const pMatch = trimmed.match(/Pus Cells:\s*([^\/|]+)/i);
      if (pMatch) parsed.pusCells = pMatch[1].trim();
      const rMatch = trimmed.match(/RBCs:\s*([^\/|]+)/i);
      if (rMatch) parsed.rbcs = rMatch[1].trim();
      const mMatch = trimmed.match(/Muscle Fibers:\s*([^|]+)/i);
      if (mMatch) parsed.muscleFibers = mMatch[1].trim();
      const sMatch = trimmed.match(/Starch:\s*([^|]+)/i);
      if (sMatch) parsed.starchGranules = sMatch[1].trim();
      const fMatch = trimmed.match(/Fat:\s*([^|]+)/i);
      if (fMatch) parsed.fatGlobules = fMatch[1].trim();
      const vMatch = trimmed.match(/Vegetable:\s*([^|]+)/i);
      if (vMatch) parsed.vegetableCells = vMatch[1].trim();
    } else if (trimmed.startsWith('PARASITOLOGY:')) {
      const content = trimmed.replace('PARASITOLOGY:', '').trim();
      if (!content.startsWith('Nil')) {
        const items = content.split('|');
        parsed.parasites = items.map(item => {
          const m = item.trim().match(/^(.*?)\s*\[(.*?)\]\s*\((.*?)\)$/);
          if (m) {
            return { organism: m[1].trim(), stage: m[2].trim(), severity: m[3].trim() };
          }
          return { organism: item.trim(), stage: 'Observed', severity: '+' };
        });
      }
    } else if (trimmed.startsWith('NOTES:')) {
      parsed.notes = trimmed.replace('NOTES:', '').trim();
    }
  }

  return parsed;
}

interface GseModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample?: any;
  patientName?: string;
  sampleNumber?: number | string;
  initialValue?: string;
  onSave?: (serialized: string, isAbnormal: boolean) => Promise<void> | void;
  onApply?: (formattedResult: string, rawData: GseAnalysisData) => void;
}

export default function GseModal({
  isOpen,
  onClose,
  sample,
  patientName,
  sampleNumber,
  initialValue,
  onSave,
  onApply,
}: GseModalProps) {
  const toast = useToast();

  // Tab State: 'PHYSICAL' | 'MICROSCOPIC' | 'PARASITOLOGY'
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'MICROSCOPIC' | 'PARASITOLOGY'>('PHYSICAL');
  const [data, setData] = useState<GseAnalysisData>(DEFAULT_GSE_DATA);
  const [saving, setSaving] = useState(false);

  // New parasite state
  const [selectedOrganism, setSelectedOrganism] = useState(COMMON_PARASITES[0].organism);
  const [selectedStage, setSelectedStage] = useState(COMMON_PARASITES[0].defaultStage);
  const [selectedSeverity, setSelectedSeverity] = useState('+');

  const resolvedPatientName = patientName || sample?.patient?.name || 'مريض غير محدد';
  const resolvedSampleNumber = sampleNumber || sample?.sampleNumber || sample?.id || '---';

  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue.includes('G.S.E')) {
        setData(parseGse(initialValue));
      } else {
        setData({ ...DEFAULT_GSE_DATA, parasites: [] });
      }
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const setField = (field: keyof GseAnalysisData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddParasite = () => {
    const exists = data.parasites.some(
      (p) => p.organism === selectedOrganism && p.stage === selectedStage
    );
    if (exists) {
      toast.warning('هذا الطفيلي مضاف مسبقاً بنفس الطور', 'تنبيه');
      return;
    }
    setData((prev) => ({
      ...prev,
      parasites: [
        ...prev.parasites,
        { organism: selectedOrganism, stage: selectedStage, severity: selectedSeverity },
      ],
    }));
    toast.success(`تمت إضافة ${selectedOrganism} بنجاح`);
  };

  const handleRemoveParasite = (index: number) => {
    setData((prev) => ({
      ...prev,
      parasites: prev.parasites.filter((_, i) => i !== index),
    }));
  };

  const applyPreset = (presetName: 'NORMAL' | 'AMOEBIC' | 'GIARDIA' | 'RESET') => {
    if (presetName === 'NORMAL' || presetName === 'RESET') {
      setData({
        color: 'Brown',
        consistency: 'Formed',
        fobt: 'Negative',
        pusCells: '0-2',
        rbcs: '0-1',
        muscleFibers: 'Nil',
        starchGranules: 'Nil',
        fatGlobules: 'Nil',
        vegetableCells: 'Few',
        parasites: [],
        notes: 'No parasites, cysts, or ova seen in direct saline and iodine wet mounts.',
      });
      toast.success('تم تطبيق القيم الطبيعية لفحص الخروج (Normal G.S.E)', 'تم التحميل');
    } else if (presetName === 'AMOEBIC') {
      setData({
        color: 'Reddish Brown',
        consistency: 'Mucoid / Loose',
        fobt: 'Positive',
        pusCells: '25-30',
        rbcs: '35-40',
        muscleFibers: 'Present',
        starchGranules: 'Few',
        fatGlobules: 'Nil',
        vegetableCells: 'Few',
        parasites: [
          { organism: 'Entamoeba histolytica', stage: 'Trophozoite (Hematophagous)', severity: '+++' },
          { organism: 'Entamoeba histolytica', stage: 'Cyst', severity: '+' },
        ],
        notes: 'Active amoebic dysentery picture. Ingested RBCs observed inside active trophozoites.',
      });
      toast.warning('تم تطبيق نموذج الزحار الأميبي الحاد (Amoebic Dysentery)', 'تم التحميل');
    } else if (presetName === 'GIARDIA') {
      setData({
        color: 'Yellow',
        consistency: 'Loose',
        fobt: 'Negative',
        pusCells: '2-4',
        rbcs: '0-1',
        muscleFibers: 'Few',
        starchGranules: 'Moderate',
        fatGlobules: '++',
        vegetableCells: 'Few',
        parasites: [
          { organism: 'Giardia lamblia', stage: 'Cyst', severity: '++' },
          { organism: 'Giardia lamblia', stage: 'Trophozoite', severity: '+' },
        ],
        notes: 'Giardiasis pattern with fatty globules and presence of cysts and trophozoites.',
      });
      toast.info('تم تطبيق نموذج داء الجيارديات (Giardiasis)', 'تم التحميل');
    }
  };

  function parseRangeMax(val: string): number {
    if (!val) return 0;
    if (val.includes('-')) {
      const parts = val.split('-').map((s) => parseInt(s.trim(), 10));
      return Math.max(...parts.filter((n) => !isNaN(n)));
    }
    return parseInt(val, 10) || 0;
  }

  const isAbnormal =
    data.fobt === 'Positive' ||
    data.fobt === 'Weakly Positive' ||
    data.parasites.length > 0 ||
    parseRangeMax(data.pusCells) > 5 ||
    parseRangeMax(data.rbcs) > 3 ||
    data.consistency.includes('Loose') ||
    data.consistency.includes('Watery') ||
    data.consistency.includes('Mucoid') ||
    data.color === 'Reddish Brown' ||
    data.color === 'Black / Tar-like';

  const handleSaveAndApply = async () => {
    try {
      setSaving(true);
      const serialized = serializeGse(data);
      if (onSave) {
        await onSave(serialized, isAbnormal);
      }
      if (onApply) {
        onApply(serialized, data);
      }
      toast.success('تم حفظ وإدراج تقرير فحص الخروج العام (G.S.E) بنجاح!', 'تم الحفظ');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ النتائج', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Color Swatches Definition
  const COLOR_OPTIONS = [
    { name: 'Brown', hex: '#78350f', border: '#b45309' },
    { name: 'Light Brown', hex: '#d97706', border: '#f59e0b' },
    { name: 'Dark Brown', hex: '#451a03', border: '#78350f' },
    { name: 'Yellow', hex: '#eab308', border: '#ca8a04' },
    { name: 'Reddish Brown', hex: '#dc2626', border: '#b91c1c' },
    { name: 'Green', hex: '#16a34a', border: '#15803d' },
    { name: 'Clay / Pale', hex: '#94a3b8', border: '#64748b' },
    { name: 'Black / Tar-like', hex: '#0f172a', border: '#334155' },
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
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{label}</span>
          {refRange && (
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              Ref: <span style={{ color: '#0284c7' }}>{refRange}</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {options.map((opt) => {
            const isSelected = value === opt;
            const isAbn = abnormalValues.includes(opt);
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
                    ? isAbn
                      ? '1.5px solid #dc2626'
                      : '1.5px solid #0284c7'
                    : '1px solid #cbd5e1',
                  background: isSelected
                    ? isAbn
                      ? '#fee2e2'
                      : '#e0f2fe'
                    : '#f8fafc',
                  color: isSelected
                    ? isAbn
                      ? '#b91c1c'
                      : '#0369a1'
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

  // Helper Component for Stool Element Row Selector with Nil, +, ++, +++, ++++, Full Field
  const StoolElementRow = ({
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 0',
          borderBottom: '1px dashed #f1f5f9',
        }}
      >
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
                    ? isLvlHeavy
                      ? '1.5px solid #dc2626'
                      : '1.5px solid #0284c7'
                    : '1px solid #cbd5e1',
                  background: isSelected
                    ? lvl === 'Nil'
                      ? '#0284c7'
                      : isLvlHeavy
                      ? '#fee2e2'
                      : '#e0f2fe'
                    : '#ffffff',
                  color: isSelected
                    ? lvl === 'Nil'
                      ? '#ffffff'
                      : isLvlHeavy
                      ? '#b91c1c'
                      : '#0369a1'
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

  const isPusAbnormal = parseRangeMax(data.pusCells) > 5;
  const isRbcAbnormal = parseRangeMax(data.rbcs) > 2;
  const isFobtAbnormal = data.fobt !== 'Negative';

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
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.4)',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* ========================================================
            1. TOP CLINICAL HEADER BAR
           ======================================================== */}
        <div
          style={{
            padding: '12px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Patient Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              <Microscope size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {resolvedPatientName}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    background: '#e2e8f0',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  Sample #{resolvedSampleNumber}
                </span>
                {isAbnormal ? (
                  <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1px 7px', borderRadius: '4px', fontWeight: 800 }}>
                    غير طبيعي (Abnormal)
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 7px', borderRadius: '4px', fontWeight: 800 }}>
                    طبيعي (Normal)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                General Stool Examination (G.S.E) • Model B Clinical Form
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
              [Normal G.S.E]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('AMOEBIC')}
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
              [Amoebic Dysentery]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('GIARDIA')}
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
              [Giardiasis]
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
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '16px',
            padding: '16px 20px',
            overflowY: 'auto',
          }}
        >
          {/* ----------------------------------------------------
              LEFT PANEL: STRUCTURED TABBED FORM (MODEL B)
             ---------------------------------------------------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Tab Navigation Header */}
            <div
              style={{
                display: 'flex',
                background: '#e2e8f0',
                padding: '4px',
                borderRadius: '10px',
                gap: '4px',
              }}
            >
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
                <span>1. PHYSICAL & FOBT</span>
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
                <span>2. MICROSCOPIC (HPF)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PARASITOLOGY')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'PARASITOLOGY' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'PARASITOLOGY' ? '#ffffff' : 'transparent',
                  color: activeTab === 'PARASITOLOGY' ? '#0284c7' : '#64748b',
                  boxShadow: activeTab === 'PARASITOLOGY' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Bug size={16} />
                <span>3. PARASITOLOGY & NOTES</span>
              </button>
            </div>

            {/* TAB 1: PHYSICAL & FOBT */}
            {activeTab === 'PHYSICAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Color Swatch Selector */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Color (اللون)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ref: <strong style={{ color: '#0284c7' }}>Brown / Light Brown</strong>
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
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: c.hex,
                              border: `1.5px solid ${c.border}`,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Consistency Pills */}
                <PillSelector
                  label="Consistency (القوام)"
                  refRange="Formed"
                  value={data.consistency}
                  onChange={(val) => setField('consistency', val)}
                  options={[
                    'Formed',
                    'Semi-formed',
                    'Soft',
                    'Mucoid / Loose',
                    'Loose',
                    'Watery',
                    'Hard',
                  ]}
                  abnormalValues={['Mucoid / Loose', 'Loose', 'Watery', 'Hard']}
                />

                {/* Occult Blood (FOBT) Pills */}
                <PillSelector
                  label="Occult Blood / FOBT (فحص الدم الخفي في البراز)"
                  refRange="Negative"
                  value={data.fobt}
                  onChange={(val) => setField('fobt', val)}
                  options={['Negative', 'Weakly Positive', 'Positive']}
                  abnormalValues={['Weakly Positive', 'Positive']}
                />
              </div>
            )}

            {/* TAB 2: MICROSCOPIC EXAMINATION */}
            {activeTab === 'MICROSCOPIC' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Pus Cells */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Pus Cells (خلايا الصديد /HPF)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ref: <strong style={{ color: '#0284c7' }}>0 - 5 /HPF</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['0-2', '2-4', '4-6', '8-10', '15-20', '25-30', 'Packed / HPF'].map((opt) => {
                      const isSelected = data.pusCells === opt;
                      const isAbn = !['0-2', '2-4'].includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setField('pusCells', opt)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            border: isSelected
                              ? isAbn
                                ? '1.5px solid #dc2626'
                                : '1.5px solid #0284c7'
                              : '1px solid #cbd5e1',
                            background: isSelected
                              ? isAbn
                                ? '#fee2e2'
                                : '#e0f2fe'
                              : '#f8fafc',
                            color: isSelected
                              ? isAbn
                                ? '#b91c1c'
                                : '#0369a1'
                              : '#475569',
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    <input
                      type="text"
                      placeholder="أو اكتب قيمة..."
                      value={data.pusCells}
                      onChange={(e) => setField('pusCells', e.target.value)}
                      style={{
                        width: '100px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                {/* RBCs */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      R.B.Cs (كريات الدم الحمراء /HPF)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ref: <strong style={{ color: '#0284c7' }}>0 - 2 /HPF</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['0-1', '1-2', '2-4', '6-8', '15-20', '30-40', 'Packed / HPF'].map((opt) => {
                      const isSelected = data.rbcs === opt;
                      const isAbn = !['0-1', '1-2'].includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setField('rbcs', opt)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            border: isSelected
                              ? isAbn
                                ? '1.5px solid #dc2626'
                                : '1.5px solid #0284c7'
                              : '1px solid #cbd5e1',
                            background: isSelected
                              ? isAbn
                                ? '#fee2e2'
                                : '#e0f2fe'
                              : '#f8fafc',
                            color: isSelected
                              ? isAbn
                                ? '#b91c1c'
                                : '#0369a1'
                              : '#475569',
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    <input
                      type="text"
                      placeholder="أو اكتب قيمة..."
                      value={data.rbcs}
                      onChange={(e) => setField('rbcs', e.target.value)}
                      style={{
                        width: '100px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                {/* Stool Microscopic Elements Box */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                    Microscopic Findings (موجودات الهضم والمجهري)
                  </div>
                  <StoolElementRow
                    name="Muscle Fibers"
                    arabicName="ألياف العضلات غير المهضومة"
                    value={data.muscleFibers}
                    onChange={(val) => setField('muscleFibers', val)}
                  />
                  <StoolElementRow
                    name="Starch Granules"
                    arabicName="حبيبات النشا"
                    value={data.starchGranules}
                    onChange={(val) => setField('starchGranules', val)}
                  />
                  <StoolElementRow
                    name="Fat Globules"
                    arabicName="قطيرات الدهون (سوء الامتصاص)"
                    value={data.fatGlobules}
                    onChange={(val) => setField('fatGlobules', val)}
                  />
                  <StoolElementRow
                    name="Vegetable Cells"
                    arabicName="خلايا وبقايا نباتية"
                    value={data.vegetableCells}
                    onChange={(val) => setField('vegetableCells', val)}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PARASITOLOGY & NOTES */}
            {activeTab === 'PARASITOLOGY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Add Parasite Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={15} color="#0284c7" />
                    <span>إضافة طفيلي مكتشف (Add Parasite Entry)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        الكائن الطفيلي (Organism):
                      </label>
                      <select
                        value={selectedOrganism}
                        onChange={(e) => {
                          setSelectedOrganism(e.target.value);
                          const found = COMMON_PARASITES.find((p) => p.organism === e.target.value);
                          if (found) setSelectedStage(found.defaultStage);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: '#fff',
                        }}
                      >
                        {COMMON_PARASITES.map((p, i) => (
                          <option key={i} value={p.organism}>
                            {p.organism} ({p.defaultStage})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        الطور المكتشف (Stage):
                      </label>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: '#fff',
                        }}
                      >
                        <option value="Cyst">Cyst (أكياس متكيسة)</option>
                        <option value="Trophozoite">Trophozoite (طور نشط متحرك)</option>
                        <option value="Trophozoite (Hematophagous)">Trophozoite (Hematophagous بلع دموي)</option>
                        <option value="Ova">Ova (بيوض)</option>
                        <option value="Fertilized Ova">Fertilized Ova (بيوض مخصبة)</option>
                        <option value="Larva">Larva (يرقة)</option>
                        <option value="Vacuolar">Vacuolar (فجوي)</option>
                        <option value="Observed">Observed (مشاهد)</option>
                      </select>
                    </div>
                  </div>

                  {/* Severity Pills & Add Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>الكثافة (Severity):</span>
                      {['+', '++', '+++', '++++'].map((s) => {
                        const isSel = selectedSeverity === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSeverity(s)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: isSel ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                              background: isSel ? '#fee2e2' : '#ffffff',
                              color: isSel ? '#b91c1c' : '#475569',
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddParasite}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={14} />
                      <span>إضافة للقائمة (Add)</span>
                    </button>
                  </div>
                </div>

                {/* Added Parasites List */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                    الطفيليات المسجلة في العينة:
                  </div>
                  {data.parasites.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#10b981', padding: '6px 0', fontWeight: 700 }}>
                      ✓ لا توجد طفيليات مسجلة (Nil / No ova or parasites seen)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {data.parasites.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '6px 10px',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#b91c1c' }}>
                            • {p.organism} <span style={{ color: '#64748b', fontWeight: 600 }}>[{p.stage}]</span> <span style={{ color: '#dc2626' }}>({p.severity})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParasite(idx)}
                            style={{
                              background: '#fee2e2',
                              border: 'none',
                              color: '#b91c1c',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Notes */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>
                      الملاحظات السريرية (Clinical Notes)
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setField('notes', 'No parasites, cysts, or ova seen in direct saline and iodine wet mounts.')}
                        style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        [No Parasites]
                      </button>
                      <button
                        type="button"
                        onClick={() => setField('notes', 'Active amoebic dysentery picture with presence of RBCs.')}
                        style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        [Dysentery]
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={data.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                    placeholder="اكتب أي توضيحات سريرية أو توصيات إضافية للطبيب المعالج..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------
              RIGHT PANEL: DEDICATED A4 CLINICAL REPORT PREVIEW
             ---------------------------------------------------- */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              position: 'sticky',
              top: 0,
            }}
          >
            {/* Header of Preview */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #d97706',
                paddingBottom: '10px',
                marginBottom: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    background: '#d97706',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  A4 REPORT PREVIEW
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0 0' }}>
                  General Stool Examination (G.S.E)
                </h4>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Sample #{resolvedSampleNumber}
                </span>
              </div>
            </div>

            {/* Preview Tables */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px' }}>
              {/* Section 1: Physical */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                  PHYSICAL & OCCULT BLOOD
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0', width: '25%' }}>Color:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%' }}>{data.color}</td>
                      <td style={{ color: '#64748b', padding: '2px 0', width: '25%' }}>Consistency:</td>
                      <td style={{ fontWeight: 700, color: data.consistency.includes('Loose') || data.consistency.includes('Watery') ? '#dc2626' : '#0f172a', width: '25%' }}>{data.consistency}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>FOBT:</td>
                      <td colSpan={3} style={{ fontWeight: 800, color: isFobtAbnormal ? '#dc2626' : '#047857' }}>
                        {data.fobt}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Microscopic */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                  MICROSCOPIC EXAMINATION (HPF)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0', width: '25%' }}>Pus Cells:</td>
                      <td style={{ fontWeight: 700, color: isPusAbnormal ? '#dc2626' : '#0f172a', width: '25%' }}>
                        {data.pusCells} /HPF
                      </td>
                      <td style={{ color: '#64748b', padding: '2px 0', width: '25%' }}>RBCs:</td>
                      <td style={{ fontWeight: 700, color: isRbcAbnormal ? '#dc2626' : '#0f172a', width: '25%' }}>
                        {data.rbcs} /HPF
                      </td>
                    </tr>
                    {data.muscleFibers && data.muscleFibers !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Muscle Fibers:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#0284c7' }}>{data.muscleFibers}</td>
                      </tr>
                    )}
                    {data.starchGranules && data.starchGranules !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Starch Granules:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#0284c7' }}>{data.starchGranules}</td>
                      </tr>
                    )}
                    {data.fatGlobules && data.fatGlobules !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Fat Globules:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#dc2626' }}>{data.fatGlobules}</td>
                      </tr>
                    )}
                    {data.vegetableCells && data.vegetableCells !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Vegetable:</td>
                        <td colSpan={3} style={{ fontWeight: 600, color: '#0f172a' }}>{data.vegetableCells}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Parasitology */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                  PARASITOLOGY
                </div>
                {data.parasites.length === 0 ? (
                  <div style={{ color: '#047857', fontWeight: 700, padding: '2px 0' }}>
                    Nil (No ova, cysts, or parasites seen)
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {data.parasites.map((p, idx) => (
                      <div key={idx} style={{ fontWeight: 800, color: '#b91c1c' }}>
                        • {p.organism} [{p.stage}] ({p.severity})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Notes */}
              {data.notes && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    color: '#334155',
                  }}
                >
                  <strong>Note:</strong> {data.notes}
                </div>
              )}
            </div>

            {/* Stamp / verification text */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9.5px',
                color: '#94a3b8',
              }}
            >
              <span>Labryo Diagnostic System • Verified</span>
              <span>100% Medical Standard</span>
            </div>
          </div>
        </div>
      </div>

        {/* ========================================================
            3. FOOTER ACTION BAR
           ======================================================== */}
        <div
          style={{
            padding: '12px 20px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Previous / Next Tab buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'PHYSICAL' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'PARASITOLOGY' ? 'MICROSCOPIC' : 'PHYSICAL')}
                style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#475569',
                }}
              >
                <ChevronLeft size={16} />
                <span>التبويب السابق (Previous)</span>
              </button>
            )}
            {activeTab !== 'PARASITOLOGY' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'PHYSICAL' ? 'MICROSCOPIC' : 'PARASITOLOGY')}
                style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#475569',
                }}
              >
                <span>التبويب التالي (Next)</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Cancel & Main Save & Apply Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: '12.5px',
                height: '38px',
                padding: '0 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#475569',
              }}
            >
              إلغاء (Cancel)
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                padding: '0 28px',
                height: '40px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ وتطبيق نتيجة التحليل (SAVE & APPLY)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
