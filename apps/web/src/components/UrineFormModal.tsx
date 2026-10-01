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
import MultiEntryCombobox, { MultiEntryItem, generateUniqueId } from './common/MultiEntryCombobox';
import { DEFAULT_CLINICAL_TEMPLATES, ClinicalTemplates } from '../lib/clinicalTemplatesConfig';
import { applyReplacements } from '../lib/clinicalIntelligence';
import { urineSchema } from '@lab-manager/forms';

/**
 * Item 1: Normalize graded chemical options 1+ -> +, 2+ -> ++, 3+ -> +++
 */
export function normalizeGradedChemical(val?: string | null): string {
  if (!val) return '';
  const s = String(val).trim();
  if (s === '1+') return '+';
  if (s === '2+') return '++';
  if (s === '3+' || s === '4+') return '+++';
  return s;
}

export const DEFAULT_CRYSTALS_SUGGESTIONS = [
  'Calcium oxalate',
  'Calcium oxalate (monohydrate)',
  'Calcium oxalate (dihydrate)',
  'Uric acid',
  'Triple phosphate',
  'Amorphous urates',
  'Amorphous phosphates',
  'Calcium carbonate',
  'Calcium phosphate',
  'Ammonium biurate',
  'Cystine',
  'Cholesterol',
  'Bilirubin',
  'Leucine',
  'Tyrosine',
  'Sulfa crystals',
  'Hippuric acid',
  'Sodium urate'
];

export const DEFAULT_CASTS_SUGGESTIONS = [
  'Hyaline casts',
  'Hyaline cast',
  'Granular casts',
  'Granular cast (fine)',
  'Granular cast (coarse)',
  'Cellular casts',
  'RBC cast',
  'WBC cast',
  'Epithelial cell cast',
  'Waxy casts',
  'Waxy cast',
  'Fatty cast',
  'Broad cast',
  'Mixed cast'
];

export const DEFAULT_YEAST_SUGGESTIONS = [
  'Yeast cells',
  'Budding yeast',
  'Yeast with pseudohyphae',
  'Pseudohyphae',
  'Budding yeast with pseudohyphae',
  'Candida albicans'
];

export const QUANTITY_OPTIONS = ['Few', '+', '++', '+++', 'Many'];

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
  bacteria: string;
  mucus: string;
  otherNotes: string;

  // Multi-entry lists (Items 1 & 3)
  crystalsList: MultiEntryItem[];
  castsList: MultiEntryItem[];
  yeastsList: MultiEntryItem[];

  // Free-text Other (Item 2)
  microscopicOther: string;

  // Backward compatibility legacy fields
  crystals?: string;
  calciumOxalate?: string;
  uricAcid?: string;
  triplePhosphate?: string;
  amorphous?: string;
  casts?: string;
  castType?: string;
  castQty?: string;
  yeast?: string;
  yeastName?: string;
  yeastQty?: string;
  trichomonas?: string;
  trichomonasName?: string;
  trichomonasQty?: string;
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
  bacteria: 'Nil',
  mucus: 'Nil',
  otherNotes: '',

  crystalsList: [],
  castsList: [],
  yeastsList: [],
  microscopicOther: '',

  crystals: 'Nil',
  calciumOxalate: 'Nil',
  uricAcid: 'Nil',
  triplePhosphate: 'Nil',
  amorphous: 'Nil',
  casts: 'Nil',
  castType: '',
  castQty: 'Nil',
  yeast: 'Nil',
  yeastName: '',
  yeastQty: 'Nil',
  trichomonas: 'Nil',
  trichomonasName: '',
  trichomonasQty: 'Nil',
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

// Module-level Helper Component for Clinical Option Pills (Hoisted for stable DOM identity)
export const PillSelector = ({
  label,
  refRange,
  value,
  onChange,
  options,
  abnormalValues = [],
  allowCustomInput = false,
  customInputPlaceholder = 'أو اكتب يدوياً (مثال: 6-8)...',
  isNumericOnly = false,
}: {
  label: string;
  refRange?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  abnormalValues?: string[];
  allowCustomInput?: boolean;
  customInputPlaceholder?: string;
  isNumericOnly?: boolean;
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
            Ref: <span style={{ color: 'var(--accent-cyan)' }}>{refRange}</span>
          </span>
        )}
      </div>

      {/* Prominent Direct Free Text Manual Input (Item 2) */}
      {allowCustomInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', width: '100%' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>إدخال حر:</span>
          <input
            type="text"
            data-testid={`freetext-${label}`}
            placeholder={customInputPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              const replaced = applyReplacements(e.target.value);
              if (replaced !== e.target.value) {
                onChange(replaced);
              }
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1.5px solid var(--accent-cyan)',
              background: 'var(--bg-input)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-cyan)')}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {((value && !options.includes(value) && !allowCustomInput) ? [...options, value] : options).map((opt) => {
          const isSelected = value === opt;
          const isAbnormal = abnormalValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(applyReplacements(opt))}
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
                boxShadow: isSelected ? '0 1px 4px rgba(37, 99, 235, 0.2)' : 'none',
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

// Module-level Helper Component for Flexible Crystal Row with Nil, +, ++, +++, ++++, Full Field
export const CrystalSelectorRow = ({
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
      borderBottom: '1px dashed var(--border-color)'
    }}>
      <div style={{ minWidth: '150px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: isPositive ? (isSevere ? '#dc2626' : 'var(--accent-cyan)') : 'var(--text-main)' }}>
          • {name} {isPositive && <span style={{ fontWeight: 800 }}>({value})</span>}
        </span>
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
                  ? (isLvlHeavy ? '1.5px solid #dc2626' : '1.5px solid var(--accent-cyan)')
                  : '1px solid var(--border-color)',
                background: isSelected 
                  ? (lvl === 'Nil' ? 'var(--accent-cyan)' : isLvlHeavy ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-cyan-subtle)') 
                  : 'var(--bg-input)',
                color: isSelected 
                  ? (lvl === 'Nil' ? 'var(--text-inverse)' : isLvlHeavy ? '#ef4444' : 'var(--accent-cyan)') 
                  : 'var(--text-main)',
                boxShadow: isSelected ? '0 1px 3px rgba(37,99,235,0.2)' : 'none',
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
  const [clinicalTemplates, setClinicalTemplates] = useState<ClinicalTemplates>(DEFAULT_CLINICAL_TEMPLATES);

  // Load data-driven clinical templates
  useEffect(() => {
    fetch('/api/templates/clinical')
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData?.templates) {
          setClinicalTemplates(resData.templates);
        }
      })
      .catch(() => {});
  }, []);

  // Load initial data or parse if string
  useEffect(() => {
    if (isOpen) {
      if (typeof initialData === 'object' && initialData !== null) {
        const obj = { ...initialData };
        if (!obj.crystalsList || obj.crystalsList.length === 0) {
          const cl: MultiEntryItem[] = [];
          if (obj.calciumOxalate && obj.calciumOxalate !== 'Nil') {
            cl.push({ id: generateUniqueId(), name: 'Calcium oxalate (monohydrate)', secondValue: obj.calciumOxalate });
          }
          if (obj.uricAcid && obj.uricAcid !== 'Nil') {
            cl.push({ id: generateUniqueId(), name: 'Uric acid', secondValue: obj.uricAcid });
          }
          if (obj.crystals && obj.crystals !== 'Nil') {
            cl.push({ id: generateUniqueId(), name: obj.crystals, secondValue: '' });
          }
          obj.crystalsList = cl;
        }
        if (!obj.castsList || obj.castsList.length === 0) {
          if (obj.castType || obj.casts) {
            obj.castsList = [{ id: generateUniqueId(), name: obj.castType || obj.casts || 'Casts', secondValue: obj.castQty || 'Seen' }];
          } else {
            obj.castsList = [];
          }
        }
        if (!obj.yeastsList || obj.yeastsList.length === 0) {
          if (obj.yeastName || obj.yeast) {
            obj.yeastsList = [{ id: generateUniqueId(), name: obj.yeastName || obj.yeast || 'Yeast', secondValue: obj.yeastQty || '+' }];
          } else {
            obj.yeastsList = [];
          }
        }
        if (!obj.microscopicOther && (obj.trichomonas || obj.trichomonasName || obj.trichomonasQty)) {
          const tVal = obj.trichomonasQty && obj.trichomonasQty !== 'Nil' ? obj.trichomonasQty : (obj.trichomonas || 'Seen');
          obj.microscopicOther = `Trichomonas: ${tVal}`;
        }
        if (obj.protein) obj.protein = normalizeGradedChemical(obj.protein);
        if (obj.glucose) obj.glucose = normalizeGradedChemical(obj.glucose);
        if (obj.ketones) obj.ketones = normalizeGradedChemical(obj.ketones);
        if (obj.blood) obj.blood = normalizeGradedChemical(obj.blood);
        if (obj.leukocyteEsterase) obj.leukocyteEsterase = normalizeGradedChemical(obj.leukocyteEsterase);
        if (obj.pusCells) obj.pusCells = applyReplacements(obj.pusCells);
        if (obj.rbcs) obj.rbcs = applyReplacements(obj.rbcs);
        setData((prev) => ({ ...prev, ...obj }));
      } else if (typeof initialData === 'string' && initialData.includes('G.U.E')) {
        // Parse key-values from formatted string if applicable
        const parsed = { ...DEFAULT_URINE_DATA };
        const matchVal = (key: string, str: string) => {
          const regex = new RegExp(`${key}:\\s*([^|\\n]+)`, 'i');
          const m = str.match(regex);
          return m ? m[1].trim() : null;
        };

        parsed.color = matchVal('Color', initialData) || parsed.color;
        parsed.appearance = matchVal('Clarity', initialData) || matchVal('Appearance', initialData) || parsed.appearance;
        parsed.spGravity = matchVal('Sp.Gr', initialData) || parsed.spGravity;
        parsed.reactionPh = matchVal('pH', initialData) || parsed.reactionPh;
        parsed.protein = normalizeGradedChemical(matchVal('Protein', initialData) || parsed.protein);
        parsed.glucose = normalizeGradedChemical(matchVal('Sugar', initialData) || matchVal('Glucose', initialData) || parsed.glucose);
        parsed.ketones = normalizeGradedChemical(matchVal('Ketones', initialData) || parsed.ketones);
        parsed.blood = normalizeGradedChemical(matchVal('Blood', initialData) || parsed.blood);
        parsed.nitrite = matchVal('Nitrite', initialData) || parsed.nitrite;
        parsed.bilirubin = matchVal('Bilirubin', initialData) || parsed.bilirubin;
        parsed.urobilinogen = matchVal('Urob', initialData) || matchVal('Urobilinogen', initialData) || parsed.urobilinogen;
        parsed.leukocyteEsterase = normalizeGradedChemical(matchVal('Leukocytes', initialData) || parsed.leukocyteEsterase);
        parsed.pusCells = applyReplacements(matchVal('Pus', initialData)?.replace('/HPF', '').trim() || parsed.pusCells);
        parsed.rbcs = applyReplacements(matchVal('RBCs', initialData)?.replace('/HPF', '').trim() || parsed.rbcs);
        parsed.epithelialCells = matchVal('Epith', initialData) || parsed.epithelialCells;
        
        parsed.bacteria = matchVal('Bacteria', initialData) || 'Nil';
        if (parsed.bacteria.includes('Few')) parsed.bacteria = 'Few';
        parsed.mucus = matchVal('Mucus', initialData) || 'Nil';
        if (parsed.mucus.includes('Few')) parsed.mucus = 'Few';

        // Crystals parsing: support multi-crystals comma-separated list
        const rawCrystals = matchVal('Crystals', initialData);
        const parsedCrystals: MultiEntryItem[] = [];
        if (rawCrystals && !['NIL', 'NONE', 'NOT SEEN'].includes(rawCrystals.toUpperCase())) {
          const items = rawCrystals.split(',').map(s => s.trim()).filter(Boolean);
          items.forEach(item => {
            const m = item.match(/^(.*?)\s*\((.*?)\)$/);
            if (m) {
              parsedCrystals.push({ id: generateUniqueId(), name: m[1].trim(), secondValue: m[2].trim() });
            } else if (item.includes(':')) {
              const [name, qty] = item.split(':');
              parsedCrystals.push({ id: generateUniqueId(), name: name.trim(), secondValue: qty.trim() });
            } else {
              parsedCrystals.push({ id: generateUniqueId(), name: item, secondValue: '' });
            }
          });
        }
        // Legacy single fields fallback
        const caOx = matchVal('Ca\\.?\\s*Oxalate', initialData);
        if (caOx && caOx !== 'Nil' && !parsedCrystals.some(c => c.name.toLowerCase().includes('oxalate'))) {
          parsedCrystals.push({ id: generateUniqueId(), name: 'Calcium oxalate (monohydrate)', secondValue: caOx });
        }
        const ua = matchVal('Uric\\s*Acid', initialData);
        if (ua && ua !== 'Nil' && !parsedCrystals.some(c => c.name.toLowerCase().includes('uric'))) {
          parsedCrystals.push({ id: generateUniqueId(), name: 'Uric acid', secondValue: ua });
        }
        const tp = matchVal('Triple\\s*Phos(?:phate)?', initialData);
        if (tp && tp !== 'Nil' && !parsedCrystals.some(c => c.name.toLowerCase().includes('triple'))) {
          parsedCrystals.push({ id: generateUniqueId(), name: 'Triple phosphate', secondValue: tp });
        }
        const amorph = matchVal('Amorphous', initialData);
        if (amorph && amorph !== 'Nil' && !parsedCrystals.some(c => c.name.toLowerCase().includes('amorphous'))) {
          parsedCrystals.push({ id: generateUniqueId(), name: 'Amorphous urates', secondValue: amorph });
        }
        parsed.crystalsList = parsedCrystals;

        // Casts parsing: support multiple comma-separated items
        const rawCasts = matchVal('Casts', initialData);
        const parsedCasts: MultiEntryItem[] = [];
        if (rawCasts && !['NIL', 'NONE', 'NOT SEEN'].includes(rawCasts.toUpperCase())) {
          const items = rawCasts.split(',').map(s => s.trim()).filter(Boolean);
          items.forEach(item => {
            const m = item.match(/^(.*?)\s*\((.*?)\)$/);
            if (m) {
              parsedCasts.push({ id: generateUniqueId(), name: m[1].trim(), secondValue: m[2].trim() });
            } else if (item.includes(':')) {
              const [name, qty] = item.split(':');
              parsedCasts.push({ id: generateUniqueId(), name: name.trim(), secondValue: qty.trim() });
            } else {
              parsedCasts.push({ id: generateUniqueId(), name: item, secondValue: 'Seen' });
            }
          });
        }
        parsed.castsList = parsedCasts;

        // Yeast parsing: support multiple comma-separated items
        const rawYeast = matchVal('Yeast', initialData) || matchVal('Candida', initialData);
        const parsedYeasts: MultiEntryItem[] = [];
        if (rawYeast && !['NIL', 'NONE', 'NOT SEEN'].includes(rawYeast.toUpperCase())) {
          const items = rawYeast.split(',').map(s => s.trim()).filter(Boolean);
          items.forEach(item => {
            const m = item.match(/^(.*?)\s*\((.*?)\)$/);
            if (m) {
              parsedYeasts.push({ id: generateUniqueId(), name: m[1].trim(), secondValue: m[2].trim() });
            } else if (item.includes(':')) {
              const [name, qty] = item.split(':');
              parsedYeasts.push({ id: generateUniqueId(), name: name.trim(), secondValue: qty.trim() });
            } else {
              parsedYeasts.push({ id: generateUniqueId(), name: item, secondValue: '+' });
            }
          });
        }
        parsed.yeastsList = parsedYeasts;

        // Other & Trichomonas migration (Item 2)
        const rawOther = matchVal('Other', initialData);
        const rawTrich = matchVal('Trichomonas', initialData);
        let otherVal = rawOther || '';
        if (rawTrich && !['NIL', 'NONE', 'NOT SEEN'].includes(rawTrich.toUpperCase())) {
          const trichStr = `Trichomonas: ${rawTrich}`;
          otherVal = otherVal ? `${otherVal}\n${trichStr}` : trichStr;
        }
        parsed.microscopicOther = otherVal;

        parsed.otherNotes = matchVal('Notes', initialData) || '';

        setData(parsed);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const setField = (field: keyof UrineAnalysisData, value: any) => {
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
        protein: '+',
        nitrite: 'Positive (+)',
        leukocyteEsterase: '++',
        pusCells: '25-35',
        rbcs: '4-6',
        epithelialCells: 'Moderate',
        bacteria: '+++',
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
        crystalsList: [
          { id: generateUniqueId(), name: 'Calcium oxalate (monohydrate)', secondValue: '+++' },
          { id: generateUniqueId(), name: 'Uric acid', secondValue: '+' }
        ],
        mucus: 'Few',
        otherNotes: 'Significant Calcium Oxalate Crystalluria (Renal Colic pattern).',
      });
      toast.info('تم تطبيق نموذج ترسبات أملاح الأوكزالات (Ca. Oxalate)', 'تم التحميل');
    } else if (presetName === 'HEMATURIA') {
      setData({
        ...DEFAULT_URINE_DATA,
        color: 'Red / Bloody',
        appearance: 'Turbid',
        protein: '+',
        blood: '+++',
        rbcs: 'Packed / Bloody',
        pusCells: '4-6',
        castsList: [
          { id: generateUniqueId(), name: 'RBC cast', secondValue: 'Seen' }
        ],
        otherNotes: 'Gross Hematuria with intact red blood cells and RBC casts.',
      });
      toast.error('تم تطبيق نموذج البيلة الدموية (Gross Hematuria)', 'تم التحميل');
    }
  };

  // Format result output for system database and medical report
  const handleSaveAndApply = () => {
    // 1. Format Crystals (Item 1)
    const crystalsStr = (data.crystalsList || [])
      .filter(c => c.name && c.name.trim())
      .map(c => c.secondValue?.trim() ? `${c.name.trim()} (${c.secondValue.trim()})` : c.name.trim())
      .join(', ');

    // 2. Format Casts (Item 3)
    const castsStr = (data.castsList || [])
      .filter(c => c.name && c.name.trim())
      .map(c => c.secondValue?.trim() ? `${c.name.trim()} (${c.secondValue.trim()})` : c.name.trim())
      .join(', ');

    // 3. Format Yeasts (Item 3)
    const yeastsStr = (data.yeastsList || [])
      .filter(y => y.name && y.name.trim())
      .map(y => y.secondValue?.trim() ? `${y.name.trim()} (${y.secondValue.trim()})` : y.name.trim())
      .join(', ');

    const normalizedData = {
      ...data,
      pusCells: applyReplacements(data.pusCells),
      rbcs: applyReplacements(data.rbcs),
      protein: normalizeGradedChemical(data.protein),
      glucose: normalizeGradedChemical(data.glucose),
      ketones: normalizeGradedChemical(data.ketones),
      blood: normalizeGradedChemical(data.blood),
      leukocyteEsterase: normalizeGradedChemical(data.leukocyteEsterase),
    };

    // 4. Base microscopic findings
    const microParts: string[] = [
      `Pus: ${normalizedData.pusCells} /HPF`,
      `RBCs: ${normalizedData.rbcs} /HPF`,
      `Epith: ${normalizedData.epithelialCells}`
    ];

    if (crystalsStr) {
      microParts.push(`Crystals: ${crystalsStr}`);
    }

    if (castsStr) {
      microParts.push(`Casts: ${castsStr}`);
    }

    if (normalizedData.bacteria && normalizedData.bacteria !== 'Nil') {
      microParts.push(`Bacteria: ${normalizedData.bacteria}`);
    }

    if (yeastsStr) {
      microParts.push(`Yeast: ${yeastsStr}`);
    }

    if (normalizedData.mucus && normalizedData.mucus !== 'Nil') {
      microParts.push(`Mucus: ${normalizedData.mucus}`);
    }

    // Other free text (Item 2: Trichomonas replaced by Other)
    if (normalizedData.microscopicOther && normalizedData.microscopicOther.trim()) {
      microParts.push(`Other: ${normalizedData.microscopicOther.trim()}`);
    }

    const formatted = [
      '[GENERAL URINE EXAMINATION - G.U.E]',
      `PHYSICAL: Color: ${normalizedData.color} | Clarity: ${normalizedData.appearance} | Sp.Gr: ${normalizedData.spGravity} | pH: ${normalizedData.reactionPh} | Volume: ${normalizedData.volume} | Odor: ${normalizedData.odor}`,
      `CHEMICAL: Protein: ${normalizedData.protein} | Sugar: ${normalizedData.glucose} | Ketones: ${normalizedData.ketones} | Bilirubin: ${normalizedData.bilirubin} | Urob: ${normalizedData.urobilinogen} | Blood: ${normalizedData.blood} | Nitrite: ${normalizedData.nitrite} | Leukocytes: ${normalizedData.leukocyteEsterase}`,
      `MICROSCOPIC: ${microParts.join(' | ')}`,
      normalizedData.otherNotes ? `Notes: ${normalizedData.otherNotes}` : ''
    ].filter(Boolean).join('\n');

    onApply(formatted, normalizedData);
    toast.success('تم حفظ وإدراج نتائج فحص الإدرار بنجاح!', 'تم بنجاح');
    onClose();
  };



  // Determine abnormal flags for Live Preview
  const isPusAbnormal = useMemo(() => {
    if (!data.pusCells) return false;
    const trimmed = data.pusCells.trim();
    if (['0-2', '2-4', '0-1', '1-2', '0-5', 'Nil', 'None'].includes(trimmed)) return false;
    const match = trimmed.match(/(\d+)/g);
    if (match) {
      const maxVal = Math.max(...match.map(Number));
      return maxVal > 5;
    }
    return true;
  }, [data.pusCells]);

  const isRbcAbnormal = useMemo(() => {
    if (!data.rbcs) return false;
    const trimmed = data.rbcs.trim();
    if (['0-2', '0-1', '1-2', 'Nil', 'None'].includes(trimmed)) return false;
    const match = trimmed.match(/(\d+)/g);
    if (match) {
      const maxVal = Math.max(...match.map(Number));
      return maxVal > 2;
    }
    return true;
  }, [data.rbcs]);
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
      }}>
        
        {/* ========================================================
            1. TOP CLINICAL HEADER BAR
           ======================================================== */}
        <div
          dir="ltr"
          style={{
            direction: 'ltr',
            padding: '12px 20px',
            background: 'var(--bg-card-subtle)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Patient Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--accent-cyan-subtle)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}>
              <FlaskConical size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {patientName}
                </span>
                <span style={{ fontSize: '11px', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Sample #{sampleNumber}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                General Urine Examination (G.U.E) • Clinical Workstation
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
          <div dir="ltr" style={{ display: 'flex', flexDirection: 'column', gap: '12px', direction: 'ltr', textAlign: 'left' }}>
            
            {/* Tab Navigation Header */}
            <div
              dir="ltr"
              style={{
                display: 'flex',
                background: '#e2e8f0',
                padding: '4px',
                borderRadius: '10px',
                gap: '4px',
                direction: 'ltr',
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
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                      Color
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Ref: <strong style={{ color: 'var(--accent-cyan)' }}>Yellow / Pale Yellow</strong>
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
                            border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: isSelected ? 'var(--accent-cyan-subtle)' : 'var(--bg-input)',
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '11.5px',
                            color: 'var(--text-main)',
                            boxShadow: isSelected ? '0 2px 6px rgba(37,99,235,0.2)' : 'none',
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
                  label="Clarity / Appearance"
                  refRange="Clear"
                  value={data.appearance}
                  onChange={(v) => setField('appearance', v)}
                  options={['Clear', 'Slightly Turbid', 'Turbid', 'Milky']}
                  abnormalValues={['Turbid', 'Milky']}
                />

                {/* Specific Gravity & pH */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Specific Gravity"
                    refRange="1.005 - 1.030"
                    value={data.spGravity}
                    onChange={(v) => setField('spGravity', v)}
                    options={['1.005', '1.010', '1.015', '1.020', '1.025', '1.030']}
                  />

                  <PillSelector
                    label="Reaction / pH"
                    refRange="4.5 - 8.0 (Normal: ~6.0)"
                    value={data.reactionPh}
                    onChange={(v) => setField('reactionPh', v)}
                    options={['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0']}
                  />
                </div>

                {/* Volume & Odor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Volume"
                    refRange="Random"
                    value={data.volume}
                    onChange={(v) => setField('volume', v)}
                    options={['Random', 'Morning', '24 Hours']}
                  />

                  <PillSelector
                    label="Odor"
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
                    label="Protein / Albumin"
                    refRange="Nil (Negative)"
                    value={data.protein}
                    onChange={(v) => setField('protein', normalizeGradedChemical(v))}
                    options={['Nil', 'Trace', '+', '++', '+++']}
                    abnormalValues={['+', '++', '+++']}
                  />

                  <PillSelector
                    label="Glucose / Sugar"
                    refRange="Nil (Negative)"
                    value={data.glucose}
                    onChange={(v) => setField('glucose', normalizeGradedChemical(v))}
                    options={['Nil', 'Trace', '+', '++', '+++']}
                    abnormalValues={['+', '++', '+++']}
                  />
                </div>

                {/* Ketones & Blood */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Ketones / Acetone"
                    refRange="Nil (Negative)"
                    value={data.ketones}
                    onChange={(v) => setField('ketones', normalizeGradedChemical(v))}
                    options={['Nil', 'Trace', '+', '++', '+++']}
                    abnormalValues={['+', '++', '+++']}
                  />

                  <PillSelector
                    label="Blood / Hemoglobin"
                    refRange="Negative"
                    value={data.blood}
                    onChange={(v) => setField('blood', normalizeGradedChemical(v))}
                    options={['Negative', 'Trace', '+', '++', '+++']}
                    abnormalValues={['Trace', '+', '++', '+++']}
                  />
                </div>

                {/* Nitrite & Leukocytes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Nitrite"
                    refRange="Negative"
                    value={data.nitrite}
                    onChange={(v) => setField('nitrite', v)}
                    options={['Negative', 'Positive (+)']}
                    abnormalValues={['Positive (+)']}
                  />

                  <PillSelector
                    label="Leukocyte Esterase"
                    refRange="Negative"
                    value={data.leukocyteEsterase}
                    onChange={(v) => setField('leukocyteEsterase', normalizeGradedChemical(v))}
                    options={['Negative', 'Trace', '+', '++', '+++']}
                    abnormalValues={['+', '++', '+++']}
                  />
                </div>

                {/* Bilirubin & Urobilinogen */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Bilirubin"
                    refRange={clinicalTemplates.urine.bilirubin.refRange || "Negative"}
                    value={data.bilirubin}
                    onChange={(v) => setField('bilirubin', v)}
                    options={clinicalTemplates.urine.bilirubin.options}
                    abnormalValues={clinicalTemplates.urine.bilirubin.abnormalValues}
                  />

                  <PillSelector
                    label="Urobilinogen"
                    refRange={clinicalTemplates.urine.urobilinogen.refRange || "Normal"}
                    value={data.urobilinogen}
                    onChange={(v) => setField('urobilinogen', v)}
                    options={clinicalTemplates.urine.urobilinogen.options}
                    abnormalValues={clinicalTemplates.urine.urobilinogen.abnormalValues}
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
                    label="Pus Cells / WBCs"
                    refRange={clinicalTemplates.urine.pusCells.refRange || "0 - 5 /HPF"}
                    value={data.pusCells}
                    onChange={(v) => setField('pusCells', v)}
                    options={clinicalTemplates.urine.pusCells.options}
                    abnormalValues={clinicalTemplates.urine.pusCells.abnormalValues}
                    allowCustomInput={true}
                    customInputPlaceholder={clinicalTemplates.urine.pusCells.customInputPlaceholder || "اكتب أي قيمة (مثال: 2-4 أو 10-15 أو many)..."}
                    isNumericOnly={clinicalTemplates.urine.pusCells.isNumericOnly ?? false}
                  />

                  <PillSelector
                    label="RBCs / Erythrocytes"
                    refRange={clinicalTemplates.urine.rbcs.refRange || "0 - 2 /HPF"}
                    value={data.rbcs}
                    onChange={(v) => setField('rbcs', v)}
                    options={clinicalTemplates.urine.rbcs.options}
                    abnormalValues={clinicalTemplates.urine.rbcs.abnormalValues}
                    allowCustomInput={true}
                    customInputPlaceholder={clinicalTemplates.urine.rbcs.customInputPlaceholder || "اكتب أي قيمة (مثال: 0-2 أو 10-15 أو packed)..."}
                    isNumericOnly={clinicalTemplates.urine.rbcs.isNumericOnly ?? false}
                  />
                </div>

                {/* Epithelial Cells */}
                <div>
                  <PillSelector
                    label="Epithelial Cells"
                    refRange="Few /HPF"
                    value={data.epithelialCells}
                    onChange={(v) => setField('epithelialCells', v)}
                    options={['Nil', 'Few', 'Moderate', 'Many']}
                    abnormalValues={['Moderate', 'Many']}
                  />
                </div>

                {/* Item 1: MultiEntryCombobox for Crystals */}
                <MultiEntryCombobox
                  label="Crystals (البلورات)"
                  items={data.crystalsList || []}
                  onChange={(items) => setData(prev => ({ ...prev, crystalsList: items }))}
                  nameSuggestions={DEFAULT_CRYSTALS_SUGGESTIONS}
                  namePlaceholder="اختر أو اكتب نوع البلورة..."
                  secondFieldLabel="الكمية"
                  secondSuggestions={QUANTITY_OPTIONS}
                  secondPlaceholder="الكمية (Few, +, ++...)"
                  addButtonText="+ إضافة بلورة"
                  emptyStateText="لا توجد بلورات مضافة (Nil / Not Seen)"
                  badgeColor="#0284c7"
                  badgeBg="#f0f9ff"
                  badgeBorder="#bae6fd"
                />

                {/* Microorganisms Grid: Bacteria & Mucus Threads */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <PillSelector
                    label="Bacteria (البكتيريا)"
                    refRange="Nil"
                    value={data.bacteria}
                    onChange={(v) => setField('bacteria', v)}
                    options={['Nil', 'Few', '+', '++', '+++']}
                    abnormalValues={['+', '++', '+++']}
                    allowCustomInput={true}
                    customInputPlaceholder="كتابة يدوية (مثال: Few rods / Occasional)..."
                  />

                  <PillSelector
                    label="Mucus Threads (المخاط)"
                    refRange="Nil"
                    value={data.mucus}
                    onChange={(v) => setField('mucus', v)}
                    options={['Nil', 'Few', '+', '++', '+++']}
                    abnormalValues={['++', '+++']}
                    allowCustomInput={true}
                    customInputPlaceholder="كتابة يدوية (مثال: Strands / Strips)..."
                  />
                </div>

                {/* Item 3: MultiEntryCombobox for Casts & Yeast */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <MultiEntryCombobox
                    label="Casts (الأسطوانات)"
                    items={data.castsList || []}
                    onChange={(items) => setData(prev => ({ ...prev, castsList: items }))}
                    nameSuggestions={DEFAULT_CASTS_SUGGESTIONS}
                    namePlaceholder="اختر أو اكتب نوع الأسطوانة..."
                    secondFieldLabel="الكمية"
                    secondSuggestions={QUANTITY_OPTIONS}
                    secondPlaceholder="الكمية..."
                    addButtonText="+ إضافة أسطوانة"
                    emptyStateText="لا توجد أسطوانات مسجلة (Nil / Not Seen)"
                    badgeColor="#7c3aed"
                    badgeBg="#f5f3ff"
                    badgeBorder="#ddd6fe"
                  />

                  <MultiEntryCombobox
                    label="Yeast (الخمائر)"
                    items={data.yeastsList || []}
                    onChange={(items) => setData(prev => ({ ...prev, yeastsList: items }))}
                    nameSuggestions={DEFAULT_YEAST_SUGGESTIONS}
                    namePlaceholder="اختر أو اكتب نوع الخمائر..."
                    secondFieldLabel="الكمية"
                    secondSuggestions={QUANTITY_OPTIONS}
                    secondPlaceholder="الكمية..."
                    addButtonText="+ إضافة خمائر"
                    emptyStateText="لا توجد خمائر مسجلة (Nil / Not Seen)"
                    badgeColor="#d97706"
                    badgeBg="#fffbeb"
                    badgeBorder="#fde68a"
                  />
                </div>

                {/* Item 2: Free unrestricted expandable Other textarea (Trichomonas removed) */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-main)' }}>Other (عناصر وملاحظات مجهرية أخرى)</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>حقل نص حر قابل للتمدد بدون قيود</span>
                  </div>
                  <textarea
                    dir="auto"
                    rows={2}
                    value={data.microscopicOther || ''}
                    onChange={(e) => setField('microscopicOther', e.target.value)}
                    placeholder="اكتب أي عناصر أو ملاحظات مجهرية أخرى بحرية كاملة..."
                    style={{
                      width: '100%',
                      minHeight: '65px',
                      resize: 'vertical',
                      fontSize: '12px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Additional Clinical Notes (FEAT-03: Multiline Unrestricted Free Text) */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Diagnostic Notes / Impression (ملاحظات سريرية وتشخيص حر)</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>نص حر متعدد الأسطر بدون قيود</span>
                  </div>
                  <textarea
                    rows={3}
                    value={data.otherNotes}
                    onChange={(e) => setField('otherNotes', e.target.value)}
                    placeholder="اكتب الملاحظات السريرية أو التشخيص المجهري المباشر بحرية كاملة..."
                    className="input-control"
                    style={{
                      fontSize: '12.5px',
                      width: '100%',
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      resize: 'vertical',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

              </div>
            )}

          </div>

          {/* ----------------------------------------------------
              RIGHT PANEL: LIVE PATIENT REPORT PRINT PREVIEW (MODEL B FEATURE)
             ---------------------------------------------------- */}
          <div
            dir="ltr"
            style={{
              direction: 'ltr',
              textAlign: 'left',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            
            {/* Header of Preview */}
            <div
              dir="ltr"
              style={{
                direction: 'ltr',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #0284c7',
                paddingBottom: '10px',
                marginBottom: '12px',
                textAlign: 'left',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '10px', background: '#0284c7', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  A4 REPORT PREVIEW
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0 0', textAlign: 'left' }}>
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
            <div dir="ltr" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px', direction: 'ltr', textAlign: 'left' }}>
              
              {/* Section 1: Physical */}
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px', textAlign: 'left' }}>
                  PHYSICAL EXAMINATION
                </div>
                <table dir="ltr" style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', textAlign: 'left' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Color:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.color}</td>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Clarity:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.appearance}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Sp. Gravity:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.spGravity}</td>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Reaction (pH):</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.reactionPh}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Chemical */}
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px', textAlign: 'left' }}>
                  CHEMICAL EXAMINATION
                </div>
                <table dir="ltr" style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', textAlign: 'left' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Protein:</td>
                      <td style={{ fontWeight: 700, color: isProteinAbnormal ? '#dc2626' : '#0f172a', width: '25%', textAlign: 'left' }}>{data.protein}</td>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Glucose:</td>
                      <td style={{ fontWeight: 700, color: isGlucoseAbnormal ? '#dc2626' : '#0f172a', width: '25%', textAlign: 'left' }}>{data.glucose}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Ketones:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.ketones}</td>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Blood:</td>
                      <td style={{ fontWeight: 700, color: isBloodAbnormal ? '#dc2626' : '#0f172a', width: '25%', textAlign: 'left' }}>{data.blood}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Nitrite:</td>
                      <td style={{ fontWeight: 700, color: isNitriteAbnormal ? '#dc2626' : '#0f172a', width: '25%', textAlign: 'left' }}>{data.nitrite}</td>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Leukocytes:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.leukocyteEsterase}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Microscopic */}
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px', textAlign: 'left' }}>
                  MICROSCOPIC EXAMINATION (HPF)
                </div>
                <table dir="ltr" style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', textAlign: 'left' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Pus Cells:</td>
                      <td style={{ fontWeight: 700, color: isPusAbnormal ? '#dc2626' : '#0f172a', width: '25%', textAlign: 'left' }}>{data.pusCells} /HPF</td>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>RBCs:</td>
                      <td style={{ fontWeight: 700, color: isRbcAbnormal ? '#dc2626' : '#0f172a', width: '25%', textAlign: 'left' }}>{data.rbcs} /HPF</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Epithelial:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a', width: '25%', textAlign: 'left' }}>{data.epithelialCells}</td>
                      {data.bacteria !== 'Nil' ? (
                        <>
                          <td style={{ color: '#64748b', padding: '3px 0', width: '25%', textAlign: 'left' }}>Bacteria:</td>
                          <td style={{ fontWeight: 700, color: '#dc2626', width: '25%', textAlign: 'left' }}>{data.bacteria}</td>
                        </>
                      ) : (
                        <td colSpan={2}></td>
                      )}
                    </tr>

                    {/* Crystals: Only display selected / positive crystals, or clean Crystals: Nil */}
                    {(() => {
                      const activeCrystals = (data.crystalsList || []).filter(c => c.name && c.name.trim());
                      if (activeCrystals.length === 0) {
                        return (
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0' }}>Crystals:</td>
                            <td colSpan={3} style={{ fontWeight: 600, color: '#64748b' }}>Nil (Not Seen)</td>
                          </tr>
                        );
                      }

                      return (
                        <tr>
                          <td style={{ color: '#64748b', padding: '2px 0' }}>Crystals:</td>
                          <td colSpan={3} style={{ fontWeight: 800, color: '#0284c7' }}>
                            {activeCrystals.map(c => c.secondValue?.trim() ? `${c.name.trim()} (${c.secondValue.trim()})` : c.name.trim()).join(', ')}
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Microorganisms, Casts, Mucus, Other */}
                    {data.mucus !== 'Nil' && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Mucus:</td>
                        <td colSpan={3} style={{ fontWeight: 600, color: '#0f172a' }}>{data.mucus}</td>
                      </tr>
                    )}
                    {(data.castsList || []).length > 0 && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Casts:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#dc2626' }}>
                          {data.castsList.map(c => c.secondValue?.trim() ? `${c.name.trim()} (${c.secondValue.trim()})` : c.name.trim()).join(', ')}
                        </td>
                      </tr>
                    )}
                    {(data.yeastsList || []).length > 0 && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Yeast:</td>
                        <td colSpan={3} style={{ fontWeight: 700, color: '#dc2626' }}>
                          {data.yeastsList.map(y => y.secondValue?.trim() ? `${y.name.trim()} (${y.secondValue.trim()})` : y.name.trim()).join(', ')}
                        </td>
                      </tr>
                    )}
                    {data.microscopicOther && data.microscopicOther.trim() && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '2px 0' }}>Other:</td>
                        <td colSpan={3} style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                          {data.microscopicOther.trim()}
                        </td>
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
              <span>Diagnostic Laboratory Examination • Verified</span>
              <span>100% Medical Standard</span>
            </div>

          </div>

        </div>

        {/* ========================================================
            3. FOOTER ACTION BAR
           ======================================================== */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
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

