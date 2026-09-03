'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Sparkles, Microscope, Plus, Trash2, Activity, AlertOctagon, AlertTriangle } from 'lucide-react';
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
  sample: any;
  initialValue?: string;
  onSave: (serialized: string, isAbnormal: boolean) => Promise<void>;
}

export default function GseModal({
  isOpen,
  onClose,
  sample,
  initialValue,
  onSave
}: GseModalProps) {
  const toast = useToast();
  const [data, setData] = useState<GseAnalysisData>(DEFAULT_GSE_DATA);
  const [saving, setSaving] = useState(false);

  // New parasite state
  const [selectedOrganism, setSelectedOrganism] = useState(COMMON_PARASITES[0].organism);
  const [selectedStage, setSelectedStage] = useState(COMMON_PARASITES[0].defaultStage);
  const [selectedSeverity, setSelectedSeverity] = useState('+');

  // Keyboard navigation across sections
  const elementRefs = useRef<(HTMLElement | null)[]>([]);
  const TOTAL_GSE_FIELDS = 16;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (e.key === 'Enter') {
      if (index === 15 && !e.ctrlKey) return; // Allow normal Enter newlines in textarea unless Ctrl+Enter
      e.preventDefault();
      const nextIdx = e.shiftKey
        ? (index > 0 ? index - 1 : TOTAL_GSE_FIELDS - 1)
        : (index < TOTAL_GSE_FIELDS - 1 ? index + 1 : 0);
      const target = elementRefs.current[nextIdx];
      target?.focus();
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.select();
      }
    } else if (e.key === 'ArrowDown' && !(e.target instanceof HTMLSelectElement)) {
      e.preventDefault();
      const nextIdx = index < TOTAL_GSE_FIELDS - 1 ? index + 1 : 0;
      const target = elementRefs.current[nextIdx];
      target?.focus();
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.select();
      }
    } else if (e.key === 'ArrowUp' && !(e.target instanceof HTMLSelectElement)) {
      e.preventDefault();
      const prevIdx = index > 0 ? index - 1 : TOTAL_GSE_FIELDS - 1;
      const target = elementRefs.current[prevIdx];
      target?.focus();
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.select();
      }
    }
  };

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

  const handleAddParasite = () => {
    const exists = data.parasites.some(
      p => p.organism === selectedOrganism && p.stage === selectedStage
    );
    if (exists) {
      toast.warning('هذا الطفيلي مضاف مسبقاً بنفس الطور', 'تنبيه');
      return;
    }
    setData(prev => ({
      ...prev,
      parasites: [
        ...prev.parasites,
        { organism: selectedOrganism, stage: selectedStage, severity: selectedSeverity }
      ]
    }));
  };

  const handleRemoveParasite = (index: number) => {
    setData(prev => ({
      ...prev,
      parasites: prev.parasites.filter((_, i) => i !== index)
    }));
  };

  const handleQuickNormal = () => {
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
      notes: 'No parasites, cysts, or ova seen in direct saline and iodine wet mounts.'
    });
    toast.success('تم تطبيق القيم الطبيعية الافتراضية (Normal Preset)', 'نجاح');
  };

  const handleQuickAmoebic = () => {
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
        { organism: 'Giardia lamblia', stage: 'Cyst', severity: '+' }
      ],
      notes: 'Active amoebic dysentery with ingested RBCs in trophozoites.'
    });
    toast.success('تم تطبيق حالة الزحار الأميبي الحاد (Amoebic Dysentery)', 'تطبيق سريع');
  };

  function parseRangeMax(val: string): number {
    if (val.includes('-')) {
      const parts = val.split('-').map(s => parseInt(s.trim()));
      return Math.max(...parts.filter(n => !isNaN(n)));
    }
    return parseInt(val) || 0;
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
    data.color === 'Black/Tar-like';

  // Helper Component for Clinical Option Pills for GSE (Nil, +, ++, +++, ++++, Full Field)
  const GsePillSelector = ({
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
    const isSevere = ['+++', '++++', 'Full Field', 'Many'].includes(value);

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '5px 0',
        borderBottom: '1px dashed #e2e8f0'
      }}>
        <div style={{ minWidth: '150px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: isPositive ? (isSevere ? '#dc2626' : '#d97706') : '#334155' }}>
            • {name} {isPositive && <span style={{ fontWeight: 800 }}>({value})</span>}
          </span>
          {arabicName && <span style={{ fontSize: '11px', color: '#64748b', marginRight: '4px' }}>- {arabicName}</span>}
        </div>
        <div style={{ display: 'flex', gap: '4px', flex: 1, maxWidth: '340px' }}>
          {levels.map((lvl) => {
            const isSelected = value === lvl || (lvl === '+' && value === 'Few') || (lvl === '++' && (value === 'Moderate' || value === 'Present')) || (lvl === '+++' && value === 'Many');
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
                    ? (isLvlHeavy ? '1.5px solid #dc2626' : '1.5px solid #d97706')
                    : '1px solid #cbd5e1',
                  background: isSelected 
                    ? (lvl === 'Nil' ? '#d97706' : isLvlHeavy ? '#fee2e2' : '#fef3c7') 
                    : '#ffffff',
                  color: isSelected 
                    ? (lvl === 'Nil' ? '#ffffff' : isLvlHeavy ? '#b91c1c' : '#b45309') 
                    : '#475569',
                  boxShadow: isSelected ? '0 1px 3px rgba(217,119,6,0.2)' : 'none',
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const serialized = serializeGse(data);
      await onSave(serialized, isAbnormal);
      toast.success('تم حفظ تقرير فحص الخروج العام (G.S.E) بنجاح', 'تم الحفظ');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ النتائج', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">محطة فحص الخروج العام (G.S.E Workstation)</h2>
                {isAbnormal ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-200">
                    <AlertTriangle size={12} /> غير طبيعي (Abnormal)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                    <Check size={12} /> طبيعي (Normal)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                المريض: <strong className="text-slate-700 dark:text-slate-200">{sample?.patient?.name || 'غير محدد'}</strong> | 
                العينة: <strong className="text-slate-700 dark:text-slate-200">#{sample?.sampleNumber || sample?.id}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickNormal}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              تعبئة طبيعية (Normal)
            </button>
            <button
              onClick={handleQuickAmoebic}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              حالة زحار (Dysentery)
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body - 2 Column Split with Live A4 Preview */}
        <div className="flex-1 overflow-hidden flex gap-4 p-4 text-sm bg-slate-50/40 dark:bg-slate-950/40">
          
          {/* Left Column: Form Controls (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            
            {/* Top Grid: Physical & FOBT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Part 1: Physical Examination */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs">1</span>
                  الفحص الفيزيائي (Physical Examination)
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">اللون (Color)</label>
                    <select
                      value={data.color}
                      onChange={e => setData({ ...data, color: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Brown">Brown (بني طبيعي)</option>
                      <option value="Light Brown">Light Brown (بني فاتح)</option>
                      <option value="Dark Brown">Dark Brown (بني غامق)</option>
                      <option value="Yellow">Yellow (أصفر)</option>
                      <option value="Reddish Brown">Reddish Brown (بني مدمى)</option>
                      <option value="Green">Green (أخضر)</option>
                      <option value="Clay / Pale">Clay / Pale (رمادي شاحب)</option>
                      <option value="Black / Tar-like">Black / Tar-like (أسود قطاراني Melena)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">القوام (Consistency)</label>
                    <select
                      value={data.consistency}
                      onChange={e => setData({ ...data, consistency: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Formed">Formed (متماسك)</option>
                      <option value="Semi-formed">Semi-formed (نصف متماسك)</option>
                      <option value="Soft">Soft (لين)</option>
                      <option value="Mucoid / Loose">Mucoid / Loose (مخاطي / رخو)</option>
                      <option value="Loose">Loose (رخو)</option>
                      <option value="Watery">Watery (مائي / إسهال)</option>
                      <option value="Hard">Hard (صلب / إمساك)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Part 2: FOBT Occult Blood */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs">2</span>
                  الدم الخفي (FOBT - Fecal Occult Blood)
                </h3>

                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Negative', 'Weakly Positive', 'Positive'].map(opt => {
                      const active = data.fobt === opt;
                      const isPos = opt.includes('Positive');
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setData({ ...data, fobt: opt })}
                          className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                            active
                              ? isPos
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt === 'Negative' && 'سلبي (Neg)'}
                          {opt === 'Weakly Positive' && 'ضعيف (+)'}
                          {opt === 'Positive' && 'إيجابي (Pos)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Part 3: Microscopic Examination (HPF) */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs">3</span>
                الفحص المجهري عالي القوة (Microscopic Examination - HPF)
              </h3>

              {/* Pus & RBCs in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Pus Cells / الصديد (/HPF)</label>
                  <input
                    type="text"
                    value={data.pusCells}
                    onChange={e => setData({ ...data, pusCells: e.target.value })}
                    placeholder="0-2"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">R.B.Cs / كريات الدم (/HPF)</label>
                  <input
                    type="text"
                    value={data.rbcs}
                    onChange={e => setData({ ...data, rbcs: e.target.value })}
                    placeholder="0-1"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Digestion Residues Multi-Selector Grid */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 space-y-1">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    بقايا الهضم والألياف المجهرية (Digestion Residues & Crystals)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    أزرار سريعة (Nil / + / ++ / +++ / ++++ / Full Field)
                  </span>
                </div>

                <GsePillSelector
                  name="Muscle Fibers"
                  arabicName="ألياف اللحم والعضلات"
                  value={data.muscleFibers}
                  onChange={v => setData(prev => ({ ...prev, muscleFibers: v }))}
                />

                <GsePillSelector
                  name="Starch Granules"
                  arabicName="حبيبات النشا"
                  value={data.starchGranules}
                  onChange={v => setData(prev => ({ ...prev, starchGranules: v }))}
                />

                <GsePillSelector
                  name="Fat Globules"
                  arabicName="قطيرات الدهون"
                  value={data.fatGlobules}
                  onChange={v => setData(prev => ({ ...prev, fatGlobules: v }))}
                />

                <GsePillSelector
                  name="Vegetable Cells"
                  arabicName="الخلايا النباتية"
                  value={data.vegetableCells}
                  onChange={v => setData(prev => ({ ...prev, vegetableCells: v }))}
                />
              </div>
            </div>

            {/* Part 4: Parasitology & Helminths Multi-Matrix */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">4</span>
                  مصفوفة الطفيليات والديدان (Parasitology & Helminths Matrix)
                </h3>
                <span className="text-[11px] text-slate-400">
                  (تظهر فقط الطفيليات المضافة بالتقرير النهائي)
                </span>
              </div>

              {/* Quick Pick Common Parasites */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">طفيليات شائعة (نقر سريع):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Entamoeba histolytica', stage: 'Cyst' },
                    { name: 'Entamoeba histolytica', stage: 'Trophozoite' },
                    { name: 'Giardia lamblia', stage: 'Cyst' },
                    { name: 'Giardia lamblia', stage: 'Trophozoite' },
                    { name: 'Entamoeba coli', stage: 'Cyst' },
                    { name: 'Blastocystis hominis', stage: 'Vacuolar' },
                    { name: 'Hymenolepis nana', stage: 'Ova' },
                    { name: 'Enterobius vermicularis', stage: 'Ova' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedOrganism(p.name);
                        setSelectedStage(p.stage);
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      + {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''} ({p.stage})
                    </button>
                  ))}
                </div>
              </div>

              {/* Matrix Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">الكائن الطفيلي (Organism)</label>
                  <select
                    value={selectedOrganism}
                    onChange={e => {
                      setSelectedOrganism(e.target.value);
                      const match = COMMON_PARASITES.find(p => p.organism === e.target.value);
                      if (match) setSelectedStage(match.defaultStage);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    {COMMON_PARASITES.map((p, idx) => (
                      <option key={idx} value={p.organism}>{p.organism}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">الطور / الحالة (Stage)</label>
                  <input
                    type="text"
                    value={selectedStage}
                    onChange={e => setSelectedStage(e.target.value)}
                    placeholder="Cyst, Trophozoite, Ova..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">الكثرة (Severity)</label>
                    <select
                      value={selectedSeverity}
                      onChange={e => setSelectedSeverity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="+">+</option>
                      <option value="++">++</option>
                      <option value="+++">+++</option>
                      <option value="++++">++++ (4+)</option>
                      <option value="Full Field">Full Field</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParasite}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة
                  </button>
                </div>
              </div>

              {/* List of Added Parasites */}
              {data.parasites.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 font-medium">
                  لم يتم رصد أي طفيليات أو بويضات ديدان (Nil - No parasites observed)
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data.parasites.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100 font-bold text-xs italic">{p.organism}</strong>
                          <span className="mx-1 text-xs text-slate-400">|</span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">الطور: {p.stage}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-200">
                          {p.severity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveParasite(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                الملاحظات السريرية والتوصيات (Clinical Notes)
              </label>
              <textarea
                rows={2}
                value={data.notes}
                onChange={e => setData({ ...data, notes: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                placeholder="اكتب أي ملاحظات إضافية هنا..."
              />
            </div>

          </div>

          {/* Right Column: Live A4 Report Preview */}
          <div className="w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col overflow-y-auto shrink-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-amber-600 pb-2.5 mb-3">
              <div>
                <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                  A4 REPORT PREVIEW
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
                  General Stool Examination (G.S.E)
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-semibold">
                  #{sample?.sampleNumber || sample?.id}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-3 text-[11px]">
              {/* Physical */}
              <div>
                <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 border-b border-slate-200 dark:border-slate-700 pb-0.5 mb-1">
                  PHYSICAL EXAMINATION
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="text-slate-500 py-0.5">Color:</td>
                      <td className="font-bold text-slate-800 dark:text-slate-200">{data.color}</td>
                      <td className="text-slate-500 py-0.5">Consistency:</td>
                      <td className="font-bold text-slate-800 dark:text-slate-200">{data.consistency}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* FOBT */}
              <div>
                <div className="text-[11px] font-extrabold text-rose-700 dark:text-rose-400 border-b border-slate-200 dark:border-slate-700 pb-0.5 mb-1">
                  OCCULT BLOOD (F.O.B.T)
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${
                  data.fobt.includes('Positive') 
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                }`}>
                  {data.fobt}
                </span>
              </div>

              {/* Microscopic */}
              <div>
                <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 border-b border-slate-200 dark:border-slate-700 pb-0.5 mb-1">
                  MICROSCOPIC EXAMINATION (HPF)
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="text-slate-500 py-0.5 w-1/4">Pus Cells:</td>
                      <td className={`font-bold w-1/4 ${parseRangeMax(data.pusCells) > 5 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                        {data.pusCells} /HPF
                      </td>
                      <td className="text-slate-500 py-0.5 w-1/4">RBCs:</td>
                      <td className={`font-bold w-1/4 ${parseRangeMax(data.rbcs) > 3 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                        {data.rbcs} /HPF
                      </td>
                    </tr>
                    {/* Active Digestion Residues Only */}
                    {(() => {
                      const activeResidues = [
                        { name: 'Muscle Fibers', val: data.muscleFibers },
                        { name: 'Starch Granules', val: data.starchGranules },
                        { name: 'Fat Globules', val: data.fatGlobules },
                        { name: 'Vegetable Cells', val: data.vegetableCells },
                      ].filter(r => r.val && r.val !== 'Nil');

                      if (activeResidues.length === 0) {
                        return (
                          <tr>
                            <td className="text-slate-500 py-0.5">Digestion:</td>
                            <td colSpan={3} className="font-medium text-slate-500">Nil (Good Digestion)</td>
                          </tr>
                        );
                      }

                      return activeResidues.map((r, i) => {
                        const isHeavy = ['+++', '++++', 'Full Field', 'Many'].includes(r.val);
                        return (
                          <tr key={i}>
                            <td className="text-slate-500 py-0.5">{r.name}:</td>
                            <td colSpan={3} className={`font-bold ${isHeavy ? 'text-rose-600' : 'text-amber-600'}`}>
                              {r.val}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Parasitology */}
              <div>
                <div className="text-[11px] font-extrabold text-purple-700 dark:text-purple-400 border-b border-slate-200 dark:border-slate-700 pb-0.5 mb-1">
                  PARASITOLOGY & HELMINTHS
                </div>
                {data.parasites.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded">
                    Nil (No ova, cysts, or parasites seen)
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {data.parasites.map((p, idx) => (
                      <div key={idx} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded px-2 py-1 flex justify-between items-center">
                        <div>
                          <strong className="text-amber-900 dark:text-amber-200 italic">{p.organism}</strong>
                          <span className="text-amber-700 dark:text-amber-400 text-[10px] ml-1">[{p.stage}]</span>
                        </div>
                        <span className="font-extrabold text-rose-600 text-xs">{p.severity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {data.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border-r-3 border-amber-500 p-1.5 text-[10px] text-slate-600 dark:text-slate-400 rounded-l">
                  <strong>Note:</strong> {data.notes}
                </div>
              )}
            </div>

            <div className="mt-auto pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center text-[9px] text-slate-400">
              <span>Labryo Diagnostic System • Verified</span>
              <span>100% Medical Standard</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            الحالة عند الحفظ: <strong className={isAbnormal ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{isAbnormal ? 'غير طبيعي (Abnormal)' : 'طبيعي (Normal)'}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ نتائج الفحص (Save G.S.E)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
