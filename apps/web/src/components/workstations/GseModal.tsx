'use client';

import React, { useState, useEffect } from 'react';
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
  vegetableCells: 'Few',
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
  parts.push(
    `MICROSCOPIC: Pus Cells: ${data.pusCells} /HPF | RBCs: ${data.rbcs} /HPF | ` +
    `Muscle Fibers: ${data.muscleFibers} | Starch: ${data.starchGranules} | ` +
    `Fat: ${data.fatGlobules} | Vegetable: ${data.vegetableCells}`
  );

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Top Grid: Physical & FOBT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Part 1: Physical Examination */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs">1</span>
                الفحص الفيزيائي (Physical Examination)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">اللون (Color)</label>
                  <select
                    value={data.color}
                    onChange={e => setData({ ...data, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">القوام (Consistency)</label>
                  <select
                    value={data.consistency}
                    onChange={e => setData({ ...data, consistency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs focus:ring-2 focus:ring-blue-500"
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
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs">2</span>
                الدم الخفي (FOBT - Fecal Occult Blood)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">نتيجة الفحص (Result)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Negative', 'Weakly Positive', 'Positive'].map(opt => {
                    const active = data.fobt === opt;
                    const isPos = opt.includes('Positive');
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setData({ ...data, fobt: opt })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? isPos
                              ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                              : 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt === 'Negative' && '<Check size={12} /> سلبي (Negative)'}
                        {opt === 'Weakly Positive' && '<AlertTriangle size={12} /> إيجابي خفيف (+)'}
                        {opt === 'Positive' && '<AlertOctagon size={12} /> إيجابي (Positive)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Part 3: Microscopic Examination (HPF) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs">3</span>
              الفحص المجهري عالي القوة (Microscopic Examination - HPF)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Pus Cells (/HPF)</label>
                <input
                  type="text"
                  value={data.pusCells}
                  onChange={e => setData({ ...data, pusCells: e.target.value })}
                  placeholder="0-2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">R.B.Cs (/HPF)</label>
                <input
                  type="text"
                  value={data.rbcs}
                  onChange={e => setData({ ...data, rbcs: e.target.value })}
                  placeholder="0-1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Muscle Fibers</label>
                <select
                  value={data.muscleFibers}
                  onChange={e => setData({ ...data, muscleFibers: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="Nil">Nil</option>
                  <option value="Few">Few</option>
                  <option value="Present">Present</option>
                  <option value="Many">Many</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Starch Granules</label>
                <select
                  value={data.starchGranules}
                  onChange={e => setData({ ...data, starchGranules: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="Nil">Nil</option>
                  <option value="Few">Few</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Many">Many</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Fat Globules</label>
                <select
                  value={data.fatGlobules}
                  onChange={e => setData({ ...data, fatGlobules: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="Nil">Nil</option>
                  <option value="Few">Few</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Many">Many</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Vegetable Cells</label>
                <select
                  value={data.vegetableCells}
                  onChange={e => setData({ ...data, vegetableCells: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="Nil">Nil</option>
                  <option value="Few">Few</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Many">Many</option>
                </select>
              </div>
            </div>
          </div>

          {/* Part 4: Parasitology & Helminths Multi-Matrix */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">4</span>
                مصفوفة الطفيليات والديدان (Parasitology & Helminths Multi-Matrix)
              </h3>
              <span className="text-xs text-slate-500">
                (يمكن إضافة عدة طفيليات وأطوار في آن واحد)
              </span>
            </div>

            {/* Matrix Form Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الكائن الطفيلي (Organism)</label>
                <select
                  value={selectedOrganism}
                  onChange={e => {
                    setSelectedOrganism(e.target.value);
                    const match = COMMON_PARASITES.find(p => p.organism === e.target.value);
                    if (match) setSelectedStage(match.defaultStage);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  {COMMON_PARASITES.map((p, idx) => (
                    <option key={idx} value={p.organism}>{p.organism}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الطور / الحالة (Stage)</label>
                <input
                  type="text"
                  value={selectedStage}
                  onChange={e => setSelectedStage(e.target.value)}
                  placeholder="Cyst, Trophozoite, Ova..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الكثرة (Severity)</label>
                  <select
                    value={selectedSeverity}
                    onChange={e => setSelectedSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="+">+</option>
                    <option value="++">++</option>
                    <option value="+++">+++</option>
                    <option value="Many">Many</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddParasite}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </button>
              </div>
            </div>

            {/* List of Added Parasites */}
            {data.parasites.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 font-medium">
                لم يتم رصد أي طفيليات أو بويضات ديدان (Nil - No parasites observed)
              </div>
            ) : (
              <div className="space-y-2">
                {data.parasites.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <strong className="text-slate-900 dark:text-slate-100 font-black italic">{p.organism}</strong>
                        <span className="mx-2 text-xs text-slate-400">|</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">الطور: {p.stage}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-200">
                        {p.severity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParasite(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              الملاحظات السريرية والتوصيات (Clinical Notes & Recommendations)
            </label>
            <textarea
              rows={2}
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              placeholder="اكتب أي ملاحظات إضافية هنا..."
            />
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
