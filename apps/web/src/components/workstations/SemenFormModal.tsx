'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Microscope, 
  Activity, 
  AlertOctagon, 
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Zap,
  RotateCcw,
  Clock,
  Droplet,
  Info,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../Toast';

export interface SemenAnalysisData {
  // 1. Physical / Macroscopic Examination
  abstinenceDays: string;
  volume: string;
  color: string;
  appearance: string;
  liquefactionTime: string;
  viscosity: string;
  reactionPh: string;
  odor: string;

  // 2. Sperm Count & General Microscopy
  concentration: string;
  totalCount: string;
  agglutination: string;
  aggregation: string;
  pusCells: string;
  rbcs: string;
  epithelialCells: string;
  immatureGermCells: string;
  microorganisms: string;

  // 3. Motility Assessment (WHO 5th & 6th Guidelines)
  rapidProgressivePR: string; // Grade A %
  slowProgressivePR: string;  // Grade B %
  nonProgressiveNP: string;   // Grade C %
  immotileIM: string;         // Grade D %
  totalProgressivePR: string; // Grade A + B % (Ref: >= 32%)
  totalMotility: string;      // PR + NP % (Ref: >= 40%)
  vitalityViability: string;  // Eosin Viability % (Ref: >= 58%)

  // 4. Morphology & Diagnostic Impression (Kruger Strict Criteria)
  normalForms: string;         // Normal % (Ref: >= 4%)
  abnormalForms: string;       // Abnormal % (Ref: <= 96%)
  headDefects: string;
  neckDefects: string;
  tailDefects: string;
  cytoplasmicDroplets: string;

  clinicalImpression: string;
  pathologistNotes: string;
}

export const DEFAULT_SEMEN_DATA: SemenAnalysisData = {
  // Physical
  abstinenceDays: '3-5 days',
  volume: '3.0',
  color: 'Greyish-White',
  appearance: 'Homogeneous',
  liquefactionTime: '20 min',
  viscosity: 'Normal',
  reactionPh: '7.8',
  odor: 'Characteristic',

  // Count & Micro
  concentration: '45',
  totalCount: '135',
  agglutination: 'Nil',
  aggregation: 'Nil',
  pusCells: '0-2',
  rbcs: '0-1',
  epithelialCells: 'Few',
  immatureGermCells: 'Nil',
  microorganisms: 'Nil',

  // Motility
  rapidProgressivePR: '40',
  slowProgressivePR: '15',
  nonProgressiveNP: '15',
  immotileIM: '30',
  totalProgressivePR: '55',
  totalMotility: '70',
  vitalityViability: '78',

  // Morphology & Summary
  normalForms: '65',
  abnormalForms: '35',
  headDefects: '20',
  neckDefects: '8',
  tailDefects: '7',
  cytoplasmicDroplets: 'Nil',

  clinicalImpression: 'Normozoospermia',
  pathologistNotes: 'Sample examined according to WHO laboratory guidelines for human semen examination. Normal physical, concentration, motility, and morphology parameters.',
};

export function serializeSemen(data: SemenAnalysisData): string {
  const parts: string[] = ['[SEMINAL FLUID ANALYSIS - S.F.A (WHO GUIDELINES)]'];

  parts.push(
    `PHYSICAL: Abstinence: ${data.abstinenceDays || '3-5 days'} | Volume: ${data.volume} mL | Color: ${data.color} | Appearance: ${data.appearance} | Liquefaction: ${data.liquefactionTime} | Viscosity: ${data.viscosity} | pH: ${data.reactionPh} | Odor: ${data.odor}`
  );

  parts.push(
    `COUNT: Concentration: ${data.concentration} M/mL | Total Count: ${data.totalCount} M/ejac | Pus Cells: ${data.pusCells} /HPF | RBCs: ${data.rbcs} /HPF | Agglutination: ${data.agglutination} | Aggregation: ${data.aggregation} | Epith: ${data.epithelialCells} | Germ Cells: ${data.immatureGermCells} | Bacteria: ${data.microorganisms}`
  );

  parts.push(
    `MOTILITY: Rapid PR (A): ${data.rapidProgressivePR}% | Slow PR (B): ${data.slowProgressivePR}% | Non-Prog (C): ${data.nonProgressiveNP}% | Immotile (D): ${data.immotileIM}% | Total PR: ${data.totalProgressivePR}% | Total Motility: ${data.totalMotility}% | Vitality: ${data.vitalityViability}%`
  );

  parts.push(
    `MORPHOLOGY: Normal Forms: ${data.normalForms}% | Abnormal Forms: ${data.abnormalForms}% | Head Defects: ${data.headDefects}% | Neck Defects: ${data.neckDefects}% | Tail Defects: ${data.tailDefects}% | ERC: ${data.cytoplasmicDroplets}%`
  );

  if (data.clinicalImpression) {
    parts.push(`IMPRESSION: ${data.clinicalImpression}`);
  }

  if (data.pathologistNotes && data.pathologistNotes.trim()) {
    parts.push(`NOTES: ${data.pathologistNotes.trim()}`);
  }

  return parts.join('\n');
}

export function parseSemen(raw: string): SemenAnalysisData {
  if (!raw || (!raw.includes('SEMINAL') && !raw.includes('S.F.A') && !raw.includes('SFA'))) {
    return { ...DEFAULT_SEMEN_DATA };
  }

  const parsed = { ...DEFAULT_SEMEN_DATA };
  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('PHYSICAL:')) {
      const matchVal = (k: string) => {
        const m = trimmed.match(new RegExp(`${k}:\\s*([^|]+)`, 'i'));
        return m ? m[1].trim() : null;
      };
      parsed.abstinenceDays = matchVal('Abstinence') || parsed.abstinenceDays;
      parsed.volume = (matchVal('Volume') || parsed.volume).replace('mL', '').trim();
      parsed.color = matchVal('Color') || parsed.color;
      parsed.appearance = matchVal('Appearance') || parsed.appearance;
      parsed.liquefactionTime = matchVal('Liquefaction') || parsed.liquefactionTime;
      parsed.viscosity = matchVal('Viscosity') || parsed.viscosity;
      parsed.reactionPh = matchVal('pH') || parsed.reactionPh;
      parsed.odor = matchVal('Odor') || parsed.odor;
    } else if (trimmed.startsWith('COUNT:')) {
      const matchVal = (k: string) => {
        const m = trimmed.match(new RegExp(`${k}:\\s*([^|]+)`, 'i'));
        return m ? m[1].trim() : null;
      };
      parsed.concentration = (matchVal('Concentration') || parsed.concentration).replace('M/mL', '').trim();
      parsed.totalCount = (matchVal('Total Count') || parsed.totalCount).replace('M/ejac', '').trim();
      parsed.pusCells = (matchVal('Pus Cells') || parsed.pusCells).replace('/HPF', '').trim();
      parsed.rbcs = (matchVal('RBCs') || parsed.rbcs).replace('/HPF', '').trim();
      parsed.agglutination = matchVal('Agglutination') || parsed.agglutination;
      parsed.aggregation = matchVal('Aggregation') || parsed.aggregation;
      parsed.epithelialCells = matchVal('Epith') || parsed.epithelialCells;
      parsed.immatureGermCells = matchVal('Germ Cells') || parsed.immatureGermCells;
      parsed.microorganisms = matchVal('Bacteria') || parsed.microorganisms;
    } else if (trimmed.startsWith('MOTILITY:')) {
      const matchVal = (k: string) => {
        const m = trimmed.match(new RegExp(`${k}:\\s*([^%|]+)`, 'i'));
        return m ? m[1].trim() : null;
      };
      parsed.rapidProgressivePR = matchVal('Rapid PR \\(A\\)') || parsed.rapidProgressivePR;
      parsed.slowProgressivePR = matchVal('Slow PR \\(B\\)') || parsed.slowProgressivePR;
      parsed.nonProgressiveNP = matchVal('Non-Prog \\(C\\)') || parsed.nonProgressiveNP;
      parsed.immotileIM = matchVal('Immotile \\(D\\)') || parsed.immotileIM;
      parsed.totalProgressivePR = matchVal('Total PR') || parsed.totalProgressivePR;
      parsed.totalMotility = matchVal('Total Motility') || parsed.totalMotility;
      parsed.vitalityViability = matchVal('Vitality') || parsed.vitalityViability;
    } else if (trimmed.startsWith('MORPHOLOGY:')) {
      const matchVal = (k: string) => {
        const m = trimmed.match(new RegExp(`${k}:\\s*([^%|]+)`, 'i'));
        return m ? m[1].trim() : null;
      };
      parsed.normalForms = matchVal('Normal Forms') || parsed.normalForms;
      parsed.abnormalForms = matchVal('Abnormal Forms') || parsed.abnormalForms;
      parsed.headDefects = matchVal('Head Defects') || parsed.headDefects;
      parsed.neckDefects = matchVal('Neck Defects') || parsed.neckDefects;
      parsed.tailDefects = matchVal('Tail Defects') || parsed.tailDefects;
      parsed.cytoplasmicDroplets = matchVal('ERC') || parsed.cytoplasmicDroplets;
    } else if (trimmed.startsWith('IMPRESSION:')) {
      parsed.clinicalImpression = trimmed.replace('IMPRESSION:', '').trim();
    } else if (trimmed.startsWith('NOTES:')) {
      parsed.pathologistNotes = trimmed.replace('NOTES:', '').trim();
    }
  }

  return parsed;
}

interface SemenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (formattedResult: string, rawData: SemenAnalysisData) => void;
  initialData?: Partial<SemenAnalysisData> | string;
  patientName?: string;
  sampleNumber?: number | string;
}

export default function SemenFormModal({
  isOpen,
  onClose,
  onApply,
  initialData,
  patientName = 'Patient',
  sampleNumber = '---',
}: SemenFormModalProps) {
  const toast = useToast();

  // Tab State: 'PHYSICAL' | 'COUNT' | 'MOTILITY' | 'MORPHOLOGY'
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'COUNT' | 'MOTILITY' | 'MORPHOLOGY'>('PHYSICAL');
  const [data, setData] = useState<SemenAnalysisData>(DEFAULT_SEMEN_DATA);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      if (typeof initialData === 'object' && initialData !== null) {
        setData((prev) => ({ ...prev, ...initialData }));
      } else if (typeof initialData === 'string' && (initialData.includes('SEMINAL') || initialData.includes('S.F.A') || initialData.includes('SFA') || initialData.includes('PHYSICAL:'))) {
        setData(parseSemen(initialData));
      } else {
        setData({ ...DEFAULT_SEMEN_DATA });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const setField = (field: keyof SemenAnalysisData, value: string) => {
    setData((prev) => {
      const updated = { ...prev, [field]: value };

      // 1. Auto calculate Total Count = Concentration * Volume
      if (field === 'concentration' || field === 'volume') {
        const conc = parseFloat(field === 'concentration' ? value : prev.concentration) || 0;
        const vol = parseFloat(field === 'volume' ? value : prev.volume) || 0;
        updated.totalCount = (conc * vol).toFixed(1).replace(/\.0$/, '');
      }

      // 2. Auto calculate Motility Sums
      if (field === 'rapidProgressivePR' || field === 'slowProgressivePR' || field === 'nonProgressiveNP') {
        const rapid = parseFloat(field === 'rapidProgressivePR' ? value : prev.rapidProgressivePR) || 0;
        const slow = parseFloat(field === 'slowProgressivePR' ? value : prev.slowProgressivePR) || 0;
        const nonProg = parseFloat(field === 'nonProgressiveNP' ? value : prev.nonProgressiveNP) || 0;
        
        const pr = rapid + slow;
        updated.totalProgressivePR = String(pr);
        updated.totalMotility = String(pr + nonProg);
      }

      // 3. Auto calculate Morphology Abnormal = 100 - Normal
      if (field === 'normalForms') {
        const norm = parseFloat(value) || 0;
        updated.abnormalForms = String(Math.max(0, 100 - norm));
      }

      return updated;
    });
  };

  // Check sum of Motility percentages
  const motilitySum = useMemo(() => {
    const a = parseFloat(data.rapidProgressivePR) || 0;
    const b = parseFloat(data.slowProgressivePR) || 0;
    const c = parseFloat(data.nonProgressiveNP) || 0;
    const d = parseFloat(data.immotileIM) || 0;
    return a + b + c + d;
  }, [data.rapidProgressivePR, data.slowProgressivePR, data.nonProgressiveNP, data.immotileIM]);

  // Clinical Quick Presets
  const applyPreset = (preset: 'NORMAL' | 'ASTHENO' | 'OLIGO' | 'OAT' | 'AZOO' | 'LEUKO' | 'TERATO' | 'RESET') => {
    if (preset === 'NORMAL' || preset === 'RESET') {
      setData({ ...DEFAULT_SEMEN_DATA });
      toast.success('تم تطبيق فحص السائل المنوي السليم (Normozoospermia)', 'تم التحميل');
    } else if (preset === 'ASTHENO') {
      setData((prev) => ({
        ...prev,
        concentration: '38',
        totalCount: '114',
        rapidProgressivePR: '10',
        slowProgressivePR: '12',
        totalProgressivePR: '22',
        nonProgressiveNP: '18',
        totalMotility: '40',
        immotileIM: '60',
        vitalityViability: '55',
        clinicalImpression: 'Asthenozoospermia',
        pathologistNotes: 'Asthenozoospermia: Reduced progressive sperm motility (PR < 32%). Semen culture and clinical evaluation for varicocele or subclinical infection advised.',
      }));
      toast.warning('تم تطبيق نموذج ضعف الحركة (Asthenozoospermia)', 'تم التحميل');
    } else if (preset === 'OLIGO') {
      setData((prev) => ({
        ...prev,
        volume: '2.2',
        concentration: '7.5',
        totalCount: '16.5',
        rapidProgressivePR: '35',
        slowProgressivePR: '15',
        totalProgressivePR: '50',
        nonProgressiveNP: '15',
        totalMotility: '65',
        immotileIM: '35',
        clinicalImpression: 'Oligozoospermia',
        pathologistNotes: 'Oligozoospermia: Low sperm concentration (< 15 M/mL). Hormonal profile (FSH, LH, Testosterone, Prolactin) recommended.',
      }));
      toast.info('تم تطبيق نموذج قلة العدد (Oligozoospermia)', 'تم التحميل');
    } else if (preset === 'OAT') {
      setData((prev) => ({
        ...prev,
        volume: '1.8',
        concentration: '4.0',
        totalCount: '7.2',
        rapidProgressivePR: '5',
        slowProgressivePR: '10',
        totalProgressivePR: '15',
        nonProgressiveNP: '15',
        totalMotility: '30',
        immotileIM: '70',
        normalForms: '2',
        abnormalForms: '98',
        headDefects: '65',
        neckDefects: '18',
        tailDefects: '15',
        clinicalImpression: 'Oligoasthenoteratozoospermia (OAT Syndrome)',
        pathologistNotes: 'Oligoasthenoteratozoospermia (OAT): Combined severe impairment of sperm concentration, progressive motility, and normal morphology. Andrological consultation required.',
      }));
      toast.error('تم تطبيق نموذج الضعف الثلاثي المركب (OAT Syndrome)', 'تم التحميل');
    } else if (preset === 'AZOO') {
      setData((prev) => ({
        ...prev,
        concentration: '0',
        totalCount: '0',
        rapidProgressivePR: '0',
        slowProgressivePR: '0',
        totalProgressivePR: '0',
        nonProgressiveNP: '0',
        totalMotility: '0',
        immotileIM: '0',
        vitalityViability: '0',
        normalForms: '0',
        abnormalForms: '0',
        headDefects: '0',
        neckDefects: '0',
        tailDefects: '0',
        pusCells: '0-2',
        clinicalImpression: 'Azoospermia (Confirmed)',
        pathologistNotes: 'Azoospermia: No spermatozoa seen in fresh wet preparations or in the centrifuged pellet (3000g for 15 min). Confirmatory repeat test after 2-4 weeks recommended.',
      }));
      toast.error('تم تطبيق نموذج انعدام النطف (Azoospermia)', 'تم التحميل');
    } else if (preset === 'LEUKO') {
      setData((prev) => ({
        ...prev,
        color: 'Yellowish / Turbid',
        viscosity: 'High (+)',
        liquefactionTime: '45 min',
        pusCells: '15-20',
        rbcs: '2-4',
        agglutination: 'Mixed (++)',
        microorganisms: 'Bacteria seen (+)',
        rapidProgressivePR: '20',
        slowProgressivePR: '15',
        totalProgressivePR: '35',
        nonProgressiveNP: '15',
        immotileIM: '50',
        clinicalImpression: 'Leukocytospermia / Pyospermia (Genital Tract Infection)',
        pathologistNotes: 'Significant Leukocytospermia (> 1x10^6 WBC/mL) with sperm agglutination. Suggests accessory gland infection (Prostatitis/Epididymitis). Semen culture and antibiotic sensitivity advised.',
      }));
      toast.warning('تم تطبيق نموذج التهاب المسالك والصديد (Leukocytospermia)', 'تم التحميل');
    } else if (preset === 'TERATO') {
      setData((prev) => ({
        ...prev,
        normalForms: '2',
        abnormalForms: '98',
        headDefects: '60',
        neckDefects: '22',
        tailDefects: '16',
        clinicalImpression: 'Teratozoospermia',
        pathologistNotes: 'Teratozoospermia: Normal sperm morphology below 4% according to Kruger Strict Criteria. High index of head and midpiece abnormalities.',
      }));
      toast.info('تم تطبيق نموذج زيادة التشوهات (Teratozoospermia)', 'تم التحميل');
    }
  };

  const handleSaveAndApply = () => {
    const formatted = serializeSemen(data);
    onApply(formatted, data);
    toast.success('تم حفظ واعتماد تقرير فحص السائل المنوي بنجاح!', 'تم الحفظ');
    onClose();
  };

  // Color Swatches
  const COLOR_OPTIONS = [
    { name: 'Greyish-White', hex: '#f1f5f9', border: '#cbd5e1' },
    { name: 'Opalescent Pearl', hex: '#e2e8f0', border: '#94a3b8' },
    { name: 'Yellowish', hex: '#fef08a', border: '#facc15' },
    { name: 'Amber / Dark', hex: '#fde047', border: '#eab308' },
    { name: 'Brownish-Red', hex: '#fca5a5', border: '#ef4444' },
  ];

  // Helper Pill Selector Component
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
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            {label}
          </span>
          {refRange && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              WHO Ref: <span style={{ color: 'var(--accent-cyan)' }}>{refRange}</span>
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
                    ? isAbnormal ? '1.5px solid #dc2626' : '1.5px solid var(--accent-cyan)'
                    : '1px solid var(--border-color)',
                  background: isSelected 
                    ? isAbnormal ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-cyan-subtle)'
                    : 'var(--bg-input)',
                  color: isSelected 
                    ? isAbnormal ? '#ef4444' : 'var(--accent-cyan)'
                    : 'var(--text-main)',
                  boxShadow: isSelected ? '0 1px 4px rgba(6, 182, 212, 0.2)' : 'none',
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '1080px', width: '96vw', height: '90vh', maxHeight: '900px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(6, 182, 212, 0.08) 100%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <Microscope size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  فحص السائل المنوي الشامل (S.F.A)
                </h2>
                <span className="badge badge-received" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  WHO 5th & 6th Criteria
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                عينة #{sampleNumber} • المريض: <strong style={{ color: 'var(--text-main)' }}>{patientName}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="btn-cyan-primary"
              style={{ padding: '6px 16px', fontSize: '12.5px', fontWeight: 800, height: '34px', borderRadius: '8px' }}
            >
              <Check size={15} />
              <span>اعتماد وتثبيت النتيجة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* CLINICAL PRESET BAR */}
        <div style={{
          padding: '8px 18px',
          background: 'var(--bg-input-deep)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <Sparkles size={13} />
            <span>قوالب سريرية سريعة:</span>
          </span>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
            <button
              type="button"
              onClick={() => applyPreset('NORMAL')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)', whiteSpace: 'nowrap' }}
              title="فحص طبيعي وسليم بالكامل وفق مواصفات WHO"
            >
              طبيعي (Normo)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('ASTHENO')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)', background: 'rgba(251, 191, 36, 0.08)', whiteSpace: 'nowrap' }}
              title="ضعف في حركة النطف التقدمية"
            >
              ضعف حركة (Astheno)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('OLIGO')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.08)', whiteSpace: 'nowrap' }}
              title="قلة عدد النطف أقل من 15 مليون/مل"
            >
              قلة عدد (Oligo)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('OAT')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.08)', whiteSpace: 'nowrap' }}
              title="ضعف ثلاثي في العدد والحركة والأشكال"
            >
              ضعف مركب (OAT)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('AZOO')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)', whiteSpace: 'nowrap' }}
              title="انعدام وجود أي نطف بعد التثفيل"
            >
              انعدام نطف (Azoo)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('LEUKO')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.4)', background: 'rgba(168, 85, 247, 0.08)', whiteSpace: 'nowrap' }}
              title="ارتفاع خلايا الصديد والالتهاب الميكروبي"
            >
              التهاب وصديد (Pus/Leuko)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('TERATO')}
              className="btn-secondary"
              style={{ fontSize: '10.5px', padding: '3px 9px', color: '#eab308', borderColor: 'rgba(234, 179, 8, 0.4)', background: 'rgba(234, 179, 8, 0.08)', whiteSpace: 'nowrap' }}
              title="زيادة تشوهات النطف"
            >
              تشوهات (Terato)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('RESET')}
              className="btn-icon"
              style={{ width: '26px', height: '26px' }}
              title="إعادة ضبط الحقول"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          padding: '0 16px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('PHYSICAL')}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'PHYSICAL' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'PHYSICAL' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: activeTab === 'PHYSICAL' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={14} />
            <span>1. الفحص العياني (Physical)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COUNT')}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'COUNT' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'COUNT' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: activeTab === 'COUNT' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Microscope size={14} />
            <span>2. التعداد والمجهري (Count)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MOTILITY')}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'MOTILITY' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'MOTILITY' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: activeTab === 'MOTILITY' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={14} />
            <span>3. الحركية والحيوية (Motility)</span>
            <span style={{ fontSize: '10px', background: motilitySum === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: motilitySum === 100 ? '#10b981' : '#ef4444', padding: '1px 5px', borderRadius: '4px' }}>
              {motilitySum}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MORPHOLOGY')}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'MORPHOLOGY' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'MORPHOLOGY' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: activeTab === 'MORPHOLOGY' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={14} />
            <span>4. الأشكال والخلاصة (Morphology)</span>
          </button>
        </div>

        {/* WORKSPACE CONTENT + LIVE PREVIEW */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* LEFT: FORM INPUTS */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* TAB 1: PHYSICAL & MACROSCOPIC */}
            {activeTab === 'PHYSICAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Abstinence & Volume Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <PillSelector
                    label="فترة الامتناع (Abstinence Period)"
                    refRange="2 - 7 Days"
                    value={data.abstinenceDays}
                    onChange={(val) => setField('abstinenceDays', val)}
                    options={['2 days', '3 days', '4 days', '5 days', '6-7 days', '> 7 days']}
                  />

                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                        حجم القذف (Ejaculate Volume)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        WHO Ref: <span style={{ color: 'var(--accent-cyan)' }}>≥ 1.5 mL</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '5.0'].map((vol) => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setField('volume', vol)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: data.volume === vol ? 800 : 600,
                            cursor: 'pointer',
                            border: data.volume === vol ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: data.volume === vol ? 'var(--accent-cyan-subtle)' : 'var(--bg-input)',
                            color: data.volume === vol ? 'var(--accent-cyan)' : 'var(--text-main)',
                          }}
                        >
                          {vol} mL
                        </button>
                      ))}
                      <input
                        type="number"
                        step="0.1"
                        value={data.volume}
                        onChange={(e) => setField('volume', e.target.value)}
                        placeholder="حجم مخصص"
                        className="input-control"
                        style={{ width: '80px', height: '28px', fontSize: '12px', padding: '2px 6px', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Swatches */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                      لون العينة (Color)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      اللون الطبيعي: <strong style={{ color: 'var(--accent-cyan)' }}>Greyish-White</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: isSelected ? 'var(--accent-cyan-subtle)' : 'var(--bg-input)',
                            border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            fontSize: '12px',
                            fontWeight: isSelected ? 800 : 600,
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                          }}
                        >
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: `1.5px solid ${c.border}` }} />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Appearance & Liquefaction */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <PillSelector
                    label="المظهر والتجانس (Appearance)"
                    refRange="Homogeneous"
                    value={data.appearance}
                    onChange={(val) => setField('appearance', val)}
                    options={['Homogeneous', 'Translucent', 'Turbid', 'Blood-tinged']}
                  />

                  <PillSelector
                    label="زمن التميع (Liquefaction Time)"
                    refRange="< 60 minutes"
                    value={data.liquefactionTime}
                    onChange={(val) => setField('liquefactionTime', val)}
                    options={['15 min', '20 min', '30 min', '45 min', '60 min', 'Delayed (> 60 min)']}
                    abnormalValues={['Delayed (> 60 min)']}
                  />
                </div>

                {/* Viscosity & pH & Odor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <PillSelector
                    label="اللزوجة (Viscosity)"
                    refRange="Normal / Small drops"
                    value={data.viscosity}
                    onChange={(val) => setField('viscosity', val)}
                    options={['Normal', 'Slightly Viscous', 'High (+)', 'Very High (++)']}
                    abnormalValues={['High (+)', 'Very High (++)']}
                  />

                  <PillSelector
                    label="درجة الحموضة (pH)"
                    refRange="≥ 7.2"
                    value={data.reactionPh}
                    onChange={(val) => setField('reactionPh', val)}
                    options={['7.2', '7.4', '7.6', '7.8', '8.0', '8.5', '< 7.0']}
                    abnormalValues={['< 7.0']}
                  />

                  <PillSelector
                    label="الرائحة (Odor)"
                    refRange="Characteristic"
                    value={data.odor}
                    onChange={(val) => setField('odor', val)}
                    options={['Characteristic', 'Normal', 'Foul / Fishy']}
                    abnormalValues={['Foul / Fishy']}
                  />
                </div>

              </div>
            )}

            {/* TAB 2: SPERM COUNT & MICROSCOPY */}
            {activeTab === 'COUNT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Concentration & Total Count Hero Card */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(6, 182, 212, 0.06) 100%)',
                  border: '1.5px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                        تركيز النطف والعدد الإجمالي (Sperm Concentration & Total Count)
                      </strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      WHO 2010/2021 Reference: <strong style={{ color: 'var(--accent-cyan)' }}>≥ 15 M/mL | ≥ 39 M/ejaculate</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="input-label" style={{ fontSize: '12px' }}>
                        تركيز النطف (Sperm Concentration - Millions/mL):
                      </label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {['0 (Azoo)', '5', '10', '15', '25', '45', '60', '80', '100'].map((c) => {
                          const val = c.includes('0') ? '0' : c;
                          const isSelected = data.concentration === val;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setField('concentration', val)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: isSelected ? 800 : 600,
                                cursor: 'pointer',
                                border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                                background: isSelected ? 'var(--accent-cyan-subtle)' : 'var(--bg-input)',
                                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                              }}
                            >
                              {c}
                            </button>
                          );
                        })}
                        <input
                          type="number"
                          value={data.concentration}
                          onChange={(e) => setField('concentration', e.target.value)}
                          className="input-control"
                          style={{ width: '85px', height: '28px', fontSize: '13px', fontWeight: 800, textAlign: 'center' }}
                          placeholder="M/mL"
                        />
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                        العدد الكلي المحسوب في كامل القذف (Total Sperm Count):
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                        <strong style={{ fontSize: '20px', color: parseFloat(data.totalCount) >= 39 ? '#10b981' : '#ef4444' }}>
                          {data.totalCount || '0'}
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>مليون نطفة (Million/ejac)</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        = ({data.concentration} M/mL × {data.volume} mL)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pus & RBCs Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <PillSelector
                    label="الخلايا القيحية / الصديدية (Pus Cells / Leukocytes)"
                    refRange="< 5 /HPF (< 1 M/mL)"
                    value={data.pusCells}
                    onChange={(val) => setField('pusCells', val)}
                    options={['0-2', '2-4', '4-6', '6-8', '8-10', '10-15', '15-20', '> 20 (Packed)']}
                    abnormalValues={['6-8', '8-10', '10-15', '15-20', '> 20 (Packed)']}
                  />

                  <PillSelector
                    label="كريات الدم الحمراء (R.B.Cs)"
                    refRange="0 - 1 /HPF"
                    value={data.rbcs}
                    onChange={(val) => setField('rbcs', val)}
                    options={['Nil', '0-1', '1-2', '2-4', '4-6', 'Packed']}
                    abnormalValues={['2-4', '4-6', 'Packed']}
                  />
                </div>

                {/* Agglutination & Aggregation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <PillSelector
                    label="التلازن المناعي (Sperm Agglutination)"
                    refRange="Nil / None"
                    value={data.agglutination}
                    onChange={(val) => setField('agglutination', val)}
                    options={['Nil', 'Isolated (+)', 'Head-to-Head (+)', 'Tail-to-Tail (+)', 'Mixed (++)', 'Severe (+++)']}
                    abnormalValues={['Head-to-Head (+)', 'Tail-to-Tail (+)', 'Mixed (++)', 'Severe (+++)']}
                  />

                  <PillSelector
                    label="التجمع غير النوعي (Sperm Aggregation)"
                    refRange="Nil"
                    value={data.aggregation}
                    onChange={(val) => setField('aggregation', val)}
                    options={['Nil', 'Few (+)', 'Moderate (++)', 'Many (+++)']}
                  />
                </div>

                {/* Epithelial, Germ Cells, Microorganisms */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <PillSelector
                    label="خلايا طلائية (Epithelial Cells)"
                    refRange="Few"
                    value={data.epithelialCells}
                    onChange={(val) => setField('epithelialCells', val)}
                    options={['Nil', 'Few', 'Moderate', 'Many']}
                  />

                  <PillSelector
                    label="خلايا نطف غير ناضجة (Germ Cells)"
                    refRange="Nil / Few"
                    value={data.immatureGermCells}
                    onChange={(val) => setField('immatureGermCells', val)}
                    options={['Nil', 'Few', 'Moderate', 'Many']}
                  />

                  <PillSelector
                    label="بكتيريا / أحياء مجهرية (Bacteria)"
                    refRange="Nil"
                    value={data.microorganisms}
                    onChange={(val) => setField('microorganisms', val)}
                    options={['Nil', 'Few', 'Present (+)', 'Many (++)', 'Trichomonas seen']}
                    abnormalValues={['Present (+)', 'Many (++)', 'Trichomonas seen']}
                  />
                </div>

              </div>
            )}

            {/* TAB 3: MOTILITY & VITALITY */}
            {activeTab === 'MOTILITY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Motility Summary Bar with WHO Standards */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        مجموع نسب الحركية (Motility Balance):
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px' }}>
                      <span>
                        Progressive (PR): <strong style={{ color: parseFloat(data.totalProgressivePR) >= 32 ? '#10b981' : '#ef4444' }}>{data.totalProgressivePR}%</strong> (Ref: ≥ 32%)
                      </span>
                      <span>
                        Total Motility: <strong style={{ color: parseFloat(data.totalMotility) >= 40 ? '#10b981' : '#ef4444' }}>{data.totalMotility}%</strong> (Ref: ≥ 40%)
                      </span>
                    </div>
                  </div>

                  {/* Colored Visual Bar */}
                  <div style={{ width: '100%', height: '14px', borderRadius: '7px', background: 'var(--bg-input)', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${data.rapidProgressivePR}%`, background: '#10b981' }} title={`Rapid PR: ${data.rapidProgressivePR}%`} />
                    <div style={{ width: `${data.slowProgressivePR}%`, background: '#3b82f6' }} title={`Slow PR: ${data.slowProgressivePR}%`} />
                    <div style={{ width: `${data.nonProgressiveNP}%`, background: '#f59e0b' }} title={`Non-Progressive: ${data.nonProgressiveNP}%`} />
                    <div style={{ width: `${data.immotileIM}%`, background: '#64748b' }} title={`Immotile: ${data.immotileIM}%`} />
                  </div>

                  {motilitySum !== 100 && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} />
                      <span>تنبيه: مجموع نسب الحركية الحالية ({motilitySum}%) لا يساوي 100%. يرجى مراجعة الأرقام.</span>
                    </div>
                  )}
                </div>

                {/* 4 Motility Grades Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  
                  {/* Grade A: Rapid Progressive */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid #10b981',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#10b981', display: 'block' }}>
                      Grade A (Rapid PR)
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      سريعة مستقيمة للأمام
                    </span>
                    <input
                      type="number"
                      value={data.rapidProgressivePR}
                      onChange={(e) => setField('rapidProgressivePR', e.target.value)}
                      className="input-control"
                      style={{ fontSize: '16px', fontWeight: 900, textAlign: 'center', color: '#10b981' }}
                      min="0"
                      max="100"
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px' }}>
                      {['25', '35', '45', '55'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setField('rapidProgressivePR', v)}
                          style={{ padding: '2px 5px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade B: Slow Progressive */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#3b82f6', display: 'block' }}>
                      Grade B (Slow PR)
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      بطيئة للأمام
                    </span>
                    <input
                      type="number"
                      value={data.slowProgressivePR}
                      onChange={(e) => setField('slowProgressivePR', e.target.value)}
                      className="input-control"
                      style={{ fontSize: '16px', fontWeight: 900, textAlign: 'center', color: '#3b82f6' }}
                      min="0"
                      max="100"
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px' }}>
                      {['10', '15', '20', '25'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setField('slowProgressivePR', v)}
                          style={{ padding: '2px 5px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade C: Non-Progressive */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f59e0b', display: 'block' }}>
                      Grade C (Non-Prog NP)
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      حركة موضعية غير تقدمية
                    </span>
                    <input
                      type="number"
                      value={data.nonProgressiveNP}
                      onChange={(e) => setField('nonProgressiveNP', e.target.value)}
                      className="input-control"
                      style={{ fontSize: '16px', fontWeight: 900, textAlign: 'center', color: '#f59e0b' }}
                      min="0"
                      max="100"
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px' }}>
                      {['10', '15', '20', '25'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setField('nonProgressiveNP', v)}
                          style={{ padding: '2px 5px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade D: Immotile */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid #64748b',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', display: 'block' }}>
                      Grade D (Immotile IM)
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      ساكنة عديمة الحركة
                    </span>
                    <input
                      type="number"
                      value={data.immotileIM}
                      onChange={(e) => setField('immotileIM', e.target.value)}
                      className="input-control"
                      style={{ fontSize: '16px', fontWeight: 900, textAlign: 'center', color: '#64748b' }}
                      min="0"
                      max="100"
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px' }}>
                      {['20', '30', '40', '50'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setField('immotileIM', v)}
                          style={{ padding: '2px 5px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Vitality / Viability (Eosin Test) */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                      حيوية النطف بصبغة الإيوسين (Sperm Vitality / Viability % Live):
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      WHO Reference Standard: <strong style={{ color: 'var(--accent-cyan)' }}>≥ 58% Live Sperm</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {['60', '70', '78', '85'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setField('vitalityViability', v)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: data.vitalityViability === v ? 800 : 600,
                          cursor: 'pointer',
                          border: data.vitalityViability === v ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: data.vitalityViability === v ? 'var(--accent-cyan-subtle)' : 'var(--bg-input)',
                          color: data.vitalityViability === v ? 'var(--accent-cyan)' : 'var(--text-main)',
                        }}
                      >
                        {v}%
                      </button>
                    ))}
                    <input
                      type="number"
                      value={data.vitalityViability}
                      onChange={(e) => setField('vitalityViability', e.target.value)}
                      className="input-control"
                      style={{ width: '70px', height: '28px', fontSize: '13px', fontWeight: 800, textAlign: 'center' }}
                      min="0"
                      max="100"
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>% Live</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MORPHOLOGY & IMPRESSION */}
            {activeTab === 'MORPHOLOGY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Normal vs Abnormal Morphology Box */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        شكل النطف وفق معايير كروجر الصارمة (Kruger Strict Criteria / WHO)
                      </strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      WHO Ref: <strong style={{ color: 'var(--accent-cyan)' }}>≥ 4% Normal Forms</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800, display: 'block' }}>
                        الأشكال الطبيعية السليمة (Normal Forms %):
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
                        {['4', '30', '50', '65', '75'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setField('normalForms', v)}
                            style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}
                          >
                            {v}%
                          </button>
                        ))}
                        <input
                          type="number"
                          value={data.normalForms}
                          onChange={(e) => setField('normalForms', e.target.value)}
                          className="input-control"
                          style={{ width: '70px', height: '28px', fontSize: '14px', fontWeight: 900, textAlign: 'center', color: '#10b981' }}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1.5px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                      <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 800, display: 'block' }}>
                        الأشكال المشوهة المحسوبة (Abnormal Forms %):
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                        <strong style={{ fontSize: '22px', color: '#ef4444' }}>
                          {data.abnormalForms}%
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>= 100% - {data.normalForms}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Defects Breakdown */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}>
                  <strong style={{ fontSize: '12.5px', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                    تفصيل التشوهات المورفولوجية (Defects Breakdown %):
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>تشوهات الرأس (Head):</label>
                      <input
                        type="text"
                        value={data.headDefects}
                        onChange={(e) => setField('headDefects', e.target.value)}
                        className="input-control"
                        style={{ textAlign: 'center', fontWeight: 700 }}
                        placeholder="e.g. 20"
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>تشوهات العنق (Neck):</label>
                      <input
                        type="text"
                        value={data.neckDefects}
                        onChange={(e) => setField('neckDefects', e.target.value)}
                        className="input-control"
                        style={{ textAlign: 'center', fontWeight: 700 }}
                        placeholder="e.g. 8"
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>تشوهات الذيل (Tail):</label>
                      <input
                        type="text"
                        value={data.tailDefects}
                        onChange={(e) => setField('tailDefects', e.target.value)}
                        className="input-control"
                        style={{ textAlign: 'center', fontWeight: 700 }}
                        placeholder="e.g. 7"
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>بقايا السيتوبلازم (ERC):</label>
                      <input
                        type="text"
                        value={data.cytoplasmicDroplets}
                        onChange={(e) => setField('cytoplasmicDroplets', e.target.value)}
                        className="input-control"
                        style={{ textAlign: 'center', fontWeight: 700 }}
                        placeholder="Nil أو %"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Impression (Diagnosis) */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}>
                  <label className="input-label" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    الخلاصة والتشخيص السريري (Clinical Diagnostic Impression):
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {[
                      'Normozoospermia',
                      'Asthenozoospermia',
                      'Oligozoospermia',
                      'Teratozoospermia',
                      'Oligoasthenoteratozoospermia (OAT)',
                      'Azoospermia',
                      'Leukocytospermia / Pyospermia',
                      'Hematospermia',
                      'Necrozoospermia',
                    ].map((diag) => {
                      const isSelected = data.clinicalImpression === diag;
                      return (
                        <button
                          key={diag}
                          type="button"
                          onClick={() => setField('clinicalImpression', diag)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: isSelected ? 'var(--accent-cyan-subtle)' : 'var(--bg-input)',
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                          }}
                        >
                          {diag}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={data.clinicalImpression}
                    onChange={(e) => setField('clinicalImpression', e.target.value)}
                    className="input-control"
                    placeholder="التشخيص النهائي..."
                    style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)' }}
                  />
                </div>

                {/* Pathologist Notes & Recommendations */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}>
                  <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-main)' }}>
                    ملاحظات وتوصيات استشاري المختبر (Pathologist Comments):
                  </label>
                  <textarea
                    rows={3}
                    value={data.pathologistNotes}
                    onChange={(e) => setField('pathologistNotes', e.target.value)}
                    className="textarea-control"
                    placeholder="ملاحظات سريرية أو توصيات بإعادة الفحص بعد 2-3 أسابيع..."
                    style={{ fontSize: '12px', lineHeight: 1.5 }}
                  />
                </div>

              </div>
            )}

          </div>

          {/* RIGHT: LIVE PREVIEW PANE */}
          <div style={{
            width: '380px',
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-input-deep)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--accent-cyan)" />
                <span>معاينة حية للتقرير المعتمد</span>
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Auto-Generated</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
              
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '6px' }}>
                  1. PHYSICAL EXAMINATION
                </strong>
                <div>Abstinence: {data.abstinenceDays}</div>
                <div>Volume: <strong>{data.volume} mL</strong></div>
                <div>Color: {data.color}</div>
                <div>Appearance: {data.appearance}</div>
                <div>Liquefaction: {data.liquefactionTime}</div>
                <div>Viscosity: {data.viscosity}</div>
                <div>pH: {data.reactionPh}</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '6px' }}>
                  2. COUNT & MICROSCOPIC
                </strong>
                <div>Concentration: <strong>{data.concentration} M/mL</strong></div>
                <div>Total Count: <strong>{data.totalCount} M/ejaculate</strong></div>
                <div>Pus Cells: {data.pusCells} /HPF</div>
                <div>R.B.Cs: {data.rbcs} /HPF</div>
                <div>Agglutination: {data.agglutination}</div>
                <div>Bacteria: {data.microorganisms}</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '6px' }}>
                  3. SPERM MOTILITY (WHO)
                </strong>
                <div>Grade A (Rapid PR): <strong>{data.rapidProgressivePR}%</strong></div>
                <div>Grade B (Slow PR): <strong>{data.slowProgressivePR}%</strong></div>
                <div>Grade C (Non-Prog): <strong>{data.nonProgressiveNP}%</strong></div>
                <div>Grade D (Immotile): <strong>{data.immotileIM}%</strong></div>
                <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '4px', paddingTop: '4px', color: '#10b981' }}>
                  Total Progressive (PR): <strong>{data.totalProgressivePR}%</strong>
                </div>
                <div style={{ color: 'var(--accent-cyan)' }}>
                  Total Motility (PR+NP): <strong>{data.totalMotility}%</strong>
                </div>
                <div>Vitality (Viability): <strong>{data.vitalityViability}% Live</strong></div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '6px' }}>
                  4. MORPHOLOGY (KRUGER)
                </strong>
                <div>Normal Forms: <strong style={{ color: '#10b981' }}>{data.normalForms}%</strong></div>
                <div>Abnormal Forms: <strong style={{ color: '#ef4444' }}>{data.abnormalForms}%</strong></div>
                <div>Head Defects: {data.headDefects}%</div>
                <div>Neck Defects: {data.neckDefects}%</div>
                <div>Tail Defects: {data.tailDefects}%</div>
              </div>

              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>IMPRESSION:</span>
                <strong style={{ color: 'var(--accent-cyan)', fontSize: '12px' }}>
                  {data.clinicalImpression}
                </strong>
              </div>

            </div>

            {/* Bottom Actions inside preview */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <button
                type="button"
                onClick={handleSaveAndApply}
                className="btn-cyan-primary"
                style={{ width: '100%', height: '36px', fontSize: '12.5px', fontWeight: 800, borderRadius: '8px' }}
              >
                <Check size={15} />
                <span>اعتماد وتثبيت النتيجة الآن</span>
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM STATUS BAR */}
        <div style={{
          padding: '8px 18px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>معايير منظمة الصحة العالمية (WHO 5th/6th Guidelines): فحص عياني، تعداد، حركية، وأشكال طبيعية.</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'PHYSICAL' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'MORPHOLOGY') setActiveTab('MOTILITY');
                  else if (activeTab === 'MOTILITY') setActiveTab('COUNT');
                  else if (activeTab === 'COUNT') setActiveTab('PHYSICAL');
                }}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                <ChevronRight size={13} />
                <span>القسم السابق</span>
              </button>
            )}

            {activeTab !== 'MORPHOLOGY' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'PHYSICAL') setActiveTab('COUNT');
                  else if (activeTab === 'COUNT') setActiveTab('MOTILITY');
                  else if (activeTab === 'MOTILITY') setActiveTab('MORPHOLOGY');
                }}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--accent-cyan)' }}
              >
                <span>القسم التالي</span>
                <ChevronLeft size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
