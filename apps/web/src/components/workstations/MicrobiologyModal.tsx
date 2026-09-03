'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, RotateCcw, Bug, ShieldAlert, Plus, Trash2, Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '../Toast';

export interface AntibioticSensitivityItem {
  antibiotic: string;
  diskContent: string;
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

const DEFAULT_ANTIBIOTICS: { name: string; disk: string }[] = [
  { name: 'Amikacin', disk: '30 ug' },
  { name: 'Amoxicillin-Clavulanate', disk: '20/10 ug' },
  { name: 'Ampicillin', disk: '10 ug' },
  { name: 'Cefepime', disk: '30 ug' },
  { name: 'Ceftriaxone', disk: '30 ug' },
  { name: 'Ciprofloxacin', disk: '5 ug' },
  { name: 'Colistin', disk: '10 ug' },
  { name: 'Gentamicin', disk: '10 ug' },
  { name: 'Imipenem', disk: '10 ug' },
  { name: 'Levofloxacin', disk: '5 ug' },
  { name: 'Meropenem', disk: '10 ug' },
  { name: 'Nitrofurantoin', disk: '300 ug' },
  { name: 'Piperacillin-Tazobactam', disk: '100/10 ug' },
  { name: 'Trimethoprim-Sulfamethoxazole', disk: '1.25/23.75 ug' },
  { name: 'Cefotaxime', disk: '30 ug' },
  { name: 'Ceftazidime', disk: '30 ug' },
  { name: 'Vancomycin', disk: '30 ug' },
  { name: 'Linezolid', disk: '30 ug' },
  { name: 'Doxycycline', disk: '30 ug' },
  { name: 'Azithromycin', disk: '15 ug' },
];

export const DEFAULT_MICROBIOLOGY_DATA: MicrobiologyData = {
  specimen: 'Clean Catch Midstream Urine',
  gramStain: 'Gram-negative bacilli (GNB), moderate pus cells',
  colonyCount: '> 100,000 CFU/mL (Significant bacteriuria)',
  organism: 'Escherichia coli (ESBL-producing)',
  antibiogram: DEFAULT_ANTIBIOTICS.map(a => ({
    antibiotic: a.name,
    diskContent: a.disk,
    zoneMm: undefined,
    interpretation: '-'
  })),
  notes: 'Multidrug-resistant ESBL strain isolated. Sensitive to Carbapenems, Nitrofurantoin, and Aminoglycosides.'
};

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
  onSave: (serialized: string, isAbnormal: boolean) => Promise<void>;
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

  const handleQuickEsbl = () => {
    const list: AntibioticSensitivityItem[] = [
      { antibiotic: 'Amikacin', diskContent: '30 ug', zoneMm: 22, interpretation: 'S' },
      { antibiotic: 'Amoxicillin-Clavulanate', diskContent: '20/10 ug', zoneMm: 12, interpretation: 'R' },
      { antibiotic: 'Ampicillin', diskContent: '10 ug', zoneMm: 8, interpretation: 'R' },
      { antibiotic: 'Cefepime', diskContent: '30 ug', zoneMm: 14, interpretation: 'R' },
      { antibiotic: 'Ceftriaxone', diskContent: '30 ug', zoneMm: 10, interpretation: 'R' },
      { antibiotic: 'Ciprofloxacin', diskContent: '5 ug', zoneMm: 13, interpretation: 'R' },
      { antibiotic: 'Colistin', diskContent: '10 ug', zoneMm: 18, interpretation: 'S' },
      { antibiotic: 'Gentamicin', diskContent: '10 ug', zoneMm: 19, interpretation: 'S' },
      { antibiotic: 'Imipenem', diskContent: '10 ug', zoneMm: 26, interpretation: 'S' },
      { antibiotic: 'Levofloxacin', diskContent: '5 ug', zoneMm: 14, interpretation: 'R' },
      { antibiotic: 'Meropenem', diskContent: '10 ug', zoneMm: 28, interpretation: 'S' },
      { antibiotic: 'Nitrofurantoin', diskContent: '300 ug', zoneMm: 20, interpretation: 'S' },
      { antibiotic: 'Piperacillin-Tazobactam', diskContent: '100/10 ug', zoneMm: 21, interpretation: 'S' },
      { antibiotic: 'Trimethoprim-Sulfamethoxazole', diskContent: '1.25/23.75 ug', zoneMm: 9, interpretation: 'R' },
    ];

    // Merge with remaining
    const merged = DEFAULT_ANTIBIOTICS.map(a => {
      const match = list.find(item => item.antibiotic === a.name);
      if (match) return match;
      return { antibiotic: a.name, diskContent: a.disk, zoneMm: undefined, interpretation: '-' as const };
    });

    setData({
      specimen: 'Clean Catch Midstream Urine',
      gramStain: 'Gram-negative bacilli (GNB), moderate pus cells',
      colonyCount: '> 100,000 CFU/mL (Significant bacteriuria)',
      organism: 'Escherichia coli (ESBL-producing)',
      antibiogram: merged,
      notes: 'Multidrug-resistant ESBL strain isolated. Sensitive to Carbapenems, Nitrofurantoin, and Aminoglycosides.'
    });
    toast.success('تم تطبيق فحص البكتيريا المقاومة (ESBL E. coli Preset)', 'تطبيق سريع');
  };

  const handleQuickNegative = () => {
    setData({
      specimen: 'Clean Catch Midstream Urine',
      gramStain: 'No microorganisms seen. Few epithelial cells.',
      colonyCount: 'No growth after 48 hours incubation at 37°C.',
      organism: 'No Bacterial Growth (Sterile Culture)',
      antibiogram: DEFAULT_ANTIBIOTICS.map(a => ({
        antibiotic: a.name,
        diskContent: a.disk,
        zoneMm: undefined,
        interpretation: '-'
      })),
      notes: 'Negative aerobic culture. No significant bacteriuria detected.'
    });
    toast.success('تم تطبيق نتيجة زراعة سالبة (No Growth / Sterile)', 'تطبيق سريع');
  };

  const isAbnormal = 
    !data.organism.includes('No Bacterial Growth') && 
    !data.colonyCount.includes('No growth');

  const handleSave = async () => {
    try {
      setSaving(true);
      const serialized = serializeMicrobiology(data);
      await onSave(serialized, isAbnormal);
      toast.success('تم حفظ تقرير المزرعة والحساسية بنجاح', 'تم الحفظ');
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
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">محطة الميكروبيولوجي ومزرعة الحساسية (Microbiology & Antibiogram)</h2>
                {isAbnormal ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-200">
                    <AlertTriangle size={12} /> عزل بكتيري موجب (Positive Culture)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                    <Check size={12} /> عينة عقيمة (Sterile / No Growth)
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
              onClick={handleQuickNegative}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              عقيمة (No Growth)
            </button>
            <button
              onClick={handleQuickEsbl}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              عزل ESBL E. coli
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
          
          {/* Top Panel: Specimen, Gram Stain, Colony Count, Organism */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center text-xs">1</span>
              بيانات العينة والعزل البكتيري (Specimen & Bacterial Isolation)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">نوع ومصدر العينة (Specimen)</label>
                <input
                  type="text"
                  value={data.specimen}
                  onChange={e => setData({ ...data, specimen: e.target.value })}
                  placeholder="Clean Catch Midstream Urine, Wound Swab..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">صبغة غرام (Gram Stain)</label>
                <input
                  type="text"
                  value={data.gramStain}
                  onChange={e => setData({ ...data, gramStain: e.target.value })}
                  placeholder="Gram-negative bacilli (GNB)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">عدد المستعمرات (Colony Count)</label>
                <input
                  type="text"
                  value={data.colonyCount}
                  onChange={e => setData({ ...data, colonyCount: e.target.value })}
                  placeholder="> 100,000 CFU/mL..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الميكروب المعزول (Isolated Organism)</label>
                <input
                  type="text"
                  value={data.organism}
                  onChange={e => setData({ ...data, organism: e.target.value })}
                  placeholder="Escherichia coli, Klebsiella..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-xs text-rose-600 dark:text-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Antibiogram Sensitivity Matrix (S / I / R) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs">2</span>
                مصفوفة حساسية المضادات الحيوية (Antibiogram Sensitivity Matrix)
              </h3>
              <span className="text-xs text-slate-500">
                S = حساس (Sensitive) | I = متوسط (Intermediate) | R = مقاوم (Resistant)
              </span>
            </div>

            {/* Responsive Antibiogram Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.antibiogram.map((item, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.antibiotic}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        التركيز: {item.diskContent}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <input
                          type="number"
                          value={item.zoneMm !== undefined ? item.zoneMm : ''}
                          onChange={e => setZone(idx, e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Zone mm"
                          className="w-full px-2 py-1 text-[11px] text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>

                      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setInterpretation(idx, item.interpretation === 'S' ? '-' : 'S')}
                          className={`px-2.5 py-1 text-xs font-black transition-all ${
                            item.interpretation === 'S'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50'
                          }`}
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterpretation(idx, item.interpretation === 'I' ? '-' : 'I')}
                          className={`px-2.5 py-1 text-xs font-black transition-all border-x border-slate-200 dark:border-slate-700 ${
                            item.interpretation === 'I'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50'
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterpretation(idx, item.interpretation === 'R' ? '-' : 'R')}
                          className={`px-2.5 py-1 text-xs font-black transition-all ${
                            item.interpretation === 'R'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50'
                          }`}
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

          {/* Notes & Recommendations */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              ملاحظات وتوصيات أخصائي الميكروبيولوجي (Microbiologist Notes & Comments)
            </label>
            <textarea
              rows={2}
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              placeholder="اكتب التوصيات العلاجية أو الملاحظات السريرية هنا..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            الحالة عند الحفظ: <strong className={isAbnormal ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{isAbnormal ? 'عزل إيجابي (Positive Culture)' : 'عقيم (Sterile / No Growth)'}</strong>
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
              className="px-5 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ تقرير المزرعة (Save Microbiology)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
