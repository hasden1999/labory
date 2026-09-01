'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  AlertTriangle,
  Calculator,
  Activity,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../Toast';
import { 
  calculateAll,
  evaluatePanicFlag,
  getAgeGenderReferenceRange,
  CalculationInputs,
  CalculationResults
} from '../../lib/clinicalIntelligence';

export interface ChemistryData {
  // Renal
  creatinine: string;
  urea: string;
  uricAcid: string;

  // Lipids
  totalCholesterol: string;
  triglycerides: string;
  hdl: string;
  ldl: string;

  // Liver
  totalBilirubin: string;
  directBilirubin: string;
  ast: string;
  alt: string;
  alp: string;
  totalProtein: string;
  albumin: string;

  // Electrolytes
  sodium: string;
  potassium: string;
  chloride: string;
  bicarbonate: string;
  calcium: string;

  // Diabetes & Endocrine
  fbs: string;
  hba1c: string;
  fastingInsulin: string;
  tsh: string;

  // Notes
  notes: string;
}

export const DEFAULT_CHEMISTRY_DATA: ChemistryData = {
  creatinine: '0.9',
  urea: '28',
  uricAcid: '5.2',
  totalCholesterol: '180',
  triglycerides: '130',
  hdl: '48',
  ldl: '',
  totalBilirubin: '0.8',
  directBilirubin: '0.2',
  ast: '24',
  alt: '22',
  alp: '75',
  totalProtein: '7.2',
  albumin: '4.4',
  sodium: '140',
  potassium: '4.2',
  chloride: '102',
  bicarbonate: '24',
  calcium: '9.4',
  fbs: '95',
  hba1c: '5.4',
  fastingInsulin: '',
  tsh: '2.1',
  notes: ''
};

export function serializeChemistry(data: ChemistryData, calcs: CalculationResults): string {
  const parts: string[] = ['[CHEMISTRY - CLINICAL BIOCHEMISTRY & ENDOCRINOLOGY]'];

  // Renal
  if (data.creatinine || data.urea || data.uricAcid) {
    let s = `RENAL: Creat: ${data.creatinine || '-'} mg/dL | Urea: ${data.urea || '-'} mg/dL | Uric Acid: ${data.uricAcid || '-'} mg/dL`;
    if (calcs.egfr) {
      s += ` | eGFR (CKD-EPI): ${calcs.egfr.value} mL/min/1.73m² (${calcs.egfr.stage})`;
    }
    parts.push(s);
  }

  // Lipids
  if (data.totalCholesterol || data.triglycerides || data.hdl) {
    let s = `LIPIDS: TC: ${data.totalCholesterol || '-'} | TG: ${data.triglycerides || '-'} | HDL: ${data.hdl || '-'}`;
    if (calcs.ldl?.value !== undefined && calcs.ldl?.value !== null) {
      s += ` | Calc LDL: ${calcs.ldl.value} mg/dL`;
    } else if (calcs.ldl?.invalidReason) {
      s += ` | LDL: Incalculable (${calcs.ldl.invalidReason})`;
    } else if (data.ldl) {
      s += ` | Measured LDL: ${data.ldl} mg/dL`;
    }
    if (calcs.vldl?.value) s += ` | VLDL: ${calcs.vldl.value}`;
    if (calcs.cardiacRiskRatio?.value) s += ` | Cardiac Risk: ${calcs.cardiacRiskRatio.value}`;
    parts.push(s);
  }

  // Liver
  if (data.totalBilirubin || data.directBilirubin || data.ast || data.alt || data.albumin) {
    let s = `LIVER: TB: ${data.totalBilirubin || '-'} | DB: ${data.directBilirubin || '-'}`;
    if (calcs.indirectBilirubin?.value !== undefined && calcs.indirectBilirubin?.value !== null) {
      s += ` | Indir Bil: ${calcs.indirectBilirubin.value} mg/dL`;
    }
    s += ` | AST: ${data.ast || '-'} | ALT: ${data.alt || '-'} | ALP: ${data.alp || '-'} | Alb: ${data.albumin || '-'}`;
    if (calcs.deRitisRatio?.value) {
      s += ` | De Ritis (AST/ALT): ${calcs.deRitisRatio.value}`;
    }
    if (calcs.agRatio?.value) {
      s += ` | A/G Ratio: ${calcs.agRatio.value}`;
    }
    parts.push(s);
  }

  // Electrolytes
  if (data.sodium || data.potassium || data.chloride || data.bicarbonate || data.calcium) {
    let s = `ELECTROLYTES: Na: ${data.sodium || '-'} | K: ${data.potassium || '-'} | Cl: ${data.chloride || '-'} | HCO3: ${data.bicarbonate || '-'} | Ca: ${data.calcium || '-'}`;
    if (calcs.anionGap?.value !== undefined) {
      s += ` | Anion Gap: ${calcs.anionGap.value} (${calcs.anionGap.interpretation || ''})`;
    }
    if (calcs.correctedCalcium?.value !== undefined) {
      s += ` | Corr Ca: ${calcs.correctedCalcium.value} mg/dL`;
    }
    parts.push(s);
  }

  // Diabetes & Endocrine
  if (data.fbs || data.hba1c || data.tsh) {
    let s = `METABOLIC: FBS: ${data.fbs || '-'} mg/dL | HbA1c: ${data.hba1c || '-'} %`;
    if (calcs.eag?.value) {
      s += ` | eAG: ${calcs.eag.value} mg/dL`;
    }
    if (calcs.homaIr?.value) {
      s += ` | HOMA-IR: ${calcs.homaIr.value} (${calcs.homaIr.interpretation || ''})`;
    }
    if (data.tsh) s += ` | TSH: ${data.tsh} uIU/mL`;
    parts.push(s);
  }

  if (data.notes && data.notes.trim()) {
    parts.push(`NOTES: ${data.notes.trim()}`);
  }

  return parts.join('\n');
}

export function parseChemistry(raw: string): ChemistryData {
  if (!raw || !raw.includes('CHEMISTRY')) return { ...DEFAULT_CHEMISTRY_DATA };

  const parsed = { ...DEFAULT_CHEMISTRY_DATA };
  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('RENAL:')) {
      const cMatch = trimmed.match(/Creat:\s*([^\s|]+)/i);
      if (cMatch && cMatch[1] !== '-') parsed.creatinine = cMatch[1];
      const uMatch = trimmed.match(/Urea:\s*([^\s|]+)/i);
      if (uMatch && uMatch[1] !== '-') parsed.urea = uMatch[1];
      const uaMatch = trimmed.match(/Uric Acid:\s*([^\s|]+)/i);
      if (uaMatch && uaMatch[1] !== '-') parsed.uricAcid = uaMatch[1];
    } else if (trimmed.startsWith('LIPIDS:')) {
      const tcMatch = trimmed.match(/TC:\s*([^\s|]+)/i);
      if (tcMatch && tcMatch[1] !== '-') parsed.totalCholesterol = tcMatch[1];
      const tgMatch = trimmed.match(/TG:\s*([^\s|]+)/i);
      if (tgMatch && tgMatch[1] !== '-') parsed.triglycerides = tgMatch[1];
      const hdlMatch = trimmed.match(/HDL:\s*([^\s|]+)/i);
      if (hdlMatch && hdlMatch[1] !== '-') parsed.hdl = hdlMatch[1];
    } else if (trimmed.startsWith('LIVER:')) {
      const tbMatch = trimmed.match(/TB:\s*([^\s|]+)/i);
      if (tbMatch && tbMatch[1] !== '-') parsed.totalBilirubin = tbMatch[1];
      const dbMatch = trimmed.match(/DB:\s*([^\s|]+)/i);
      if (dbMatch && dbMatch[1] !== '-') parsed.directBilirubin = dbMatch[1];
      const astMatch = trimmed.match(/AST:\s*([^\s|]+)/i);
      if (astMatch && astMatch[1] !== '-') parsed.ast = astMatch[1];
      const altMatch = trimmed.match(/ALT:\s*([^\s|]+)/i);
      if (altMatch && altMatch[1] !== '-') parsed.alt = altMatch[1];
      const albMatch = trimmed.match(/Alb:\s*([^\s|]+)/i);
      if (albMatch && albMatch[1] !== '-') parsed.albumin = albMatch[1];
    } else if (trimmed.startsWith('ELECTROLYTES:')) {
      const naMatch = trimmed.match(/Na:\s*([^\s|]+)/i);
      if (naMatch && naMatch[1] !== '-') parsed.sodium = naMatch[1];
      const kMatch = trimmed.match(/K:\s*([^\s|]+)/i);
      if (kMatch && kMatch[1] !== '-') parsed.potassium = kMatch[1];
      const clMatch = trimmed.match(/Cl:\s*([^\s|]+)/i);
      if (clMatch && clMatch[1] !== '-') parsed.chloride = clMatch[1];
      const hco3Match = trimmed.match(/HCO3:\s*([^\s|]+)/i);
      if (hco3Match && hco3Match[1] !== '-') parsed.bicarbonate = hco3Match[1];
      const caMatch = trimmed.match(/Ca:\s*([^\s|]+)/i);
      if (caMatch && caMatch[1] !== '-') parsed.calcium = caMatch[1];
    } else if (trimmed.startsWith('METABOLIC:')) {
      const fbsMatch = trimmed.match(/FBS:\s*([^\s|]+)/i);
      if (fbsMatch && fbsMatch[1] !== '-') parsed.fbs = fbsMatch[1];
      const a1cMatch = trimmed.match(/HbA1c:\s*([^\s|]+)/i);
      if (a1cMatch && a1cMatch[1] !== '-') parsed.hba1c = a1cMatch[1];
      const tshMatch = trimmed.match(/TSH:\s*([^\s|]+)/i);
      if (tshMatch && tshMatch[1] !== '-') parsed.tsh = tshMatch[1];
    } else if (trimmed.startsWith('NOTES:')) {
      parsed.notes = trimmed.replace('NOTES:', '').trim();
    }
  }

  return parsed;
}

interface ChemistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: any;
  initialValue?: string;
  onSave: (serialized: string, isAbnormal: boolean) => Promise<void>;
}

export default function ChemistryModal({
  isOpen,
  onClose,
  sample,
  initialValue,
  onSave
}: ChemistryModalProps) {
  const toast = useToast();
  const [data, setData] = useState<ChemistryData>(DEFAULT_CHEMISTRY_DATA);
  const [saving, setSaving] = useState(false);

  const patientAge = sample?.patient?.age ? parseInt(String(sample.patient.age)) : 45;
  const patientGender = (sample?.patient?.gender || 'MALE') as 'MALE' | 'FEMALE';

  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue.includes('CHEMISTRY')) {
        setData(parseChemistry(initialValue));
      } else {
        setData({ ...DEFAULT_CHEMISTRY_DATA });
      }
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  // Real-time calculation inputs
  const inputs: CalculationInputs = {
    age: patientAge,
    gender: patientGender,
    creatinine: data.creatinine ? parseFloat(data.creatinine) : undefined,
    totalCholesterol: data.totalCholesterol ? parseFloat(data.totalCholesterol) : undefined,
    hdl: data.hdl ? parseFloat(data.hdl) : undefined,
    triglycerides: data.triglycerides ? parseFloat(data.triglycerides) : undefined,
    totalBilirubin: data.totalBilirubin ? parseFloat(data.totalBilirubin) : undefined,
    directBilirubin: data.directBilirubin ? parseFloat(data.directBilirubin) : undefined,
    sodium: data.sodium ? parseFloat(data.sodium) : undefined,
    potassium: data.potassium ? parseFloat(data.potassium) : undefined,
    chloride: data.chloride ? parseFloat(data.chloride) : undefined,
    bicarbonate: data.bicarbonate ? parseFloat(data.bicarbonate) : undefined,
    calcium: data.calcium ? parseFloat(data.calcium) : undefined,
    albumin: data.albumin ? parseFloat(data.albumin) : undefined,
    totalProtein: data.totalProtein ? parseFloat(data.totalProtein) : undefined,
    ast: data.ast ? parseFloat(data.ast) : undefined,
    alt: data.alt ? parseFloat(data.alt) : undefined,
    fbs: data.fbs ? parseFloat(data.fbs) : undefined,
    hba1c: data.hba1c ? parseFloat(data.hba1c) : undefined,
    fastingInsulin: data.fastingInsulin ? parseFloat(data.fastingInsulin) : undefined,
  };

  const calcs = calculateAll(inputs);

  // Panic flags
  const fbsPanic = evaluatePanicFlag('FBS', parseFloat(data.fbs) || 0);
  const kPanic = evaluatePanicFlag('POTASSIUM', parseFloat(data.potassium) || 0);
  const naPanic = evaluatePanicFlag('SODIUM', parseFloat(data.sodium) || 0);
  const caPanic = evaluatePanicFlag('CALCIUM', parseFloat(data.calcium) || 0);
  const hasCriticalPanic = fbsPanic.isPanic || kPanic.isPanic || naPanic.isPanic || caPanic.isPanic;

  const isAbnormal = 
    hasCriticalPanic ||
    (parseFloat(data.creatinine) > 1.2) ||
    (parseFloat(data.fbs) > 110) ||
    (parseFloat(data.totalCholesterol) > 200) ||
    (parseFloat(data.ast) > 40) ||
    (parseFloat(data.alt) > 40);

  const handleSave = async () => {
    try {
      setSaving(true);
      const serialized = serializeChemistry(data, calcs);
      await onSave(serialized, isAbnormal);
      toast.success('تم حفظ نتائج الفحوصات الكيميائية بنجاح', 'تم الحفظ');
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">محطة الكيمياء السريرية والغدد الصماء (Chemistry Workstation)</h2>
                {hasCriticalPanic ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                    🚨 قيمة خطيرة مهددة للحياة (PANIC VALUE)
                  </span>
                ) : isAbnormal ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 border border-amber-200">
                    ⚠️ غير طبيعي (Abnormal)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                    ✓ طبيعي (Normal)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                المريض: <strong className="text-slate-700 dark:text-slate-200">{sample?.patient?.name || 'غير محدد'}</strong> | 
                العمر: <strong className="text-slate-700 dark:text-slate-200">{patientAge} سنة ({patientGender === 'FEMALE' ? 'أنثى' : 'ذكر'})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setData({ ...DEFAULT_CHEMISTRY_DATA });
                toast.success('تمت إعادة الضبط للقيم الافتراضية', 'تطبيق سريع');
              }}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              افتراضي
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

        {/* Panic Alert Banner */}
        {hasCriticalPanic && (
          <div className="bg-rose-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-inner">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>
                تنبيه سريري فوري (Critical Panic Value):
                {fbsPanic.isPanic && ` [FBS: ${data.fbs} mg/dL (حد الخطر: < 45 أو > 450)]`}
                {kPanic.isPanic && ` [Potassium: ${data.potassium} mmol/L (حد الخطر: < 2.8 أو > 6.2)]`}
                {naPanic.isPanic && ` [Sodium: ${data.sodium} mmol/L (حد الخطر: < 120 أو > 160)]`}
                {caPanic.isPanic && ` [Calcium: ${data.calcium} mg/dL (حد الخطر: < 6.5 أو > 13.0)]`}
              </span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase">Urgent</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Section 1: Renal Function & eGFR */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs">1</span>
                وظائف الكلى والمعادلة التقديرية (Renal Panel & eGFR 2021 CKD-EPI)
              </h3>
              {calcs.egfr && (
                <div className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white font-bold shadow-sm">
                  معدل الفلترة الكلوية (eGFR): <strong>{calcs.egfr.value} mL/min</strong> ({calcs.egfr.stage})
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Serum Creatinine (mg/dL)</label>
                <input
                  type="text"
                  value={data.creatinine}
                  onChange={e => setData({ ...data, creatinine: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 0.6 - 1.2 mg/dL</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Blood Urea (mg/dL)</label>
                <input
                  type="text"
                  value={data.urea}
                  onChange={e => setData({ ...data, urea: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 15 - 45 mg/dL</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Uric Acid (mg/dL)</label>
                <input
                  type="text"
                  value={data.uricAcid}
                  onChange={e => setData({ ...data, uricAcid: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 3.5 - 7.2 mg/dL</span>
              </div>
            </div>
          </div>

          {/* Section 2: Lipid Profile & Friedewald Equation */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs">2</span>
                فحص الدهون ومعادلة فرايدفالد (Lipid Profile & Friedewald Equation)
              </h3>
              {calcs.ldl?.value !== undefined && calcs.ldl?.value !== null ? (
                <div className="text-xs px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold shadow-sm">
                  الكوليسترول الضار المحسوب (Calc LDL): <strong>{calcs.ldl.value} mg/dL</strong>
                </div>
              ) : calcs.ldl?.invalidReason ? (
                <div className="text-xs px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold border border-rose-200">
                  ⚠️ يتعذر حساب LDL: {calcs.ldl.invalidReason}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Total Cholesterol (mg/dL)</label>
                <input
                  type="text"
                  value={data.totalCholesterol}
                  onChange={e => setData({ ...data, totalCholesterol: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Desirable: &lt; 200</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Triglycerides (mg/dL)</label>
                <input
                  type="text"
                  value={data.triglycerides}
                  onChange={e => setData({ ...data, triglycerides: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Normal: &lt; 150</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">HDL Cholesterol (mg/dL)</label>
                <input
                  type="text"
                  value={data.hdl}
                  onChange={e => setData({ ...data, hdl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: &gt; 40 mg/dL</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Direct Measured LDL (اختياري)</label>
                <input
                  type="text"
                  value={data.ldl}
                  onChange={e => setData({ ...data, ldl: e.target.value })}
                  placeholder="مباشر"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Optimal: &lt; 100</span>
              </div>
            </div>
          </div>

          {/* Section 3: Electrolytes & Anion Gap */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">3</span>
                الأملاح والفجوة الأيونية (Electrolytes & Anion Gap)
              </h3>
              {calcs.anionGap?.value !== undefined && (
                <div className="text-xs px-3 py-1 rounded-lg bg-purple-600 text-white font-bold shadow-sm">
                  الفجوة الأيونية (Anion Gap): <strong>{calcs.anionGap.value} mmol/L</strong> ({calcs.anionGap.interpretation || 'Normal'})
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Sodium Na+ (mmol/L)</label>
                <input
                  type="text"
                  value={data.sodium}
                  onChange={e => setData({ ...data, sodium: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-bold text-xs ${
                    naPanic.isPanic ? 'border-rose-500 bg-rose-50 text-rose-700 font-black' : 'border-slate-200 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Ref: 135 - 145</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Potassium K+ (mmol/L)</label>
                <input
                  type="text"
                  value={data.potassium}
                  onChange={e => setData({ ...data, potassium: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-bold text-xs ${
                    kPanic.isPanic ? 'border-rose-500 bg-rose-50 text-rose-700 font-black' : 'border-slate-200 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Ref: 3.5 - 5.1</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Chloride Cl- (mmol/L)</label>
                <input
                  type="text"
                  value={data.chloride}
                  onChange={e => setData({ ...data, chloride: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 98 - 107</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Bicarbonate HCO3-</label>
                <input
                  type="text"
                  value={data.bicarbonate}
                  onChange={e => setData({ ...data, bicarbonate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 22 - 29</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Calcium Total (mg/dL)</label>
                <input
                  type="text"
                  value={data.calcium}
                  onChange={e => setData({ ...data, calcium: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-bold text-xs ${
                    caPanic.isPanic ? 'border-rose-500 bg-rose-50 text-rose-700 font-black' : 'border-slate-200 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Ref: 8.5 - 10.5</span>
              </div>
            </div>
          </div>

          {/* Section 4: Liver Functions (LFT) & De Ritis */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs">4</span>
                وظائف الكبد ونسبة ديريتيس (Liver Function Panel & De Ritis AST/ALT)
              </h3>
              {calcs.indirectBilirubin?.value !== undefined && (
                <div className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200">
                  البيليروبين غير المباشر: <strong>{calcs.indirectBilirubin.value} mg/dL</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Total Bilirubin</label>
                <input
                  type="text"
                  value={data.totalBilirubin}
                  onChange={e => setData({ ...data, totalBilirubin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 0.2 - 1.2</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Direct Bilirubin</label>
                <input
                  type="text"
                  value={data.directBilirubin}
                  onChange={e => setData({ ...data, directBilirubin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 0.0 - 0.3</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">AST / GOT (U/L)</label>
                <input
                  type="text"
                  value={data.ast}
                  onChange={e => setData({ ...data, ast: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: &lt; 38</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ALT / GPT (U/L)</label>
                <input
                  type="text"
                  value={data.alt}
                  onChange={e => setData({ ...data, alt: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: &lt; 41</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ALP (U/L)</label>
                <input
                  type="text"
                  value={data.alp}
                  onChange={e => setData({ ...data, alp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 40 - 130</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Albumin (g/dL)</label>
                <input
                  type="text"
                  value={data.albumin}
                  onChange={e => setData({ ...data, albumin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 3.5 - 5.0</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Total Protein</label>
                <input
                  type="text"
                  value={data.totalProtein}
                  onChange={e => setData({ ...data, totalProtein: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 6.4 - 8.3</span>
              </div>
            </div>
          </div>

          {/* Section 5: Glucose & Diabetes Monitoring */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center text-xs">5</span>
                فحوصات السكري والغدد الصماء (Metabolic, Diabetes & Thyroid)
              </h3>
              {calcs.eag?.value && (
                <div className="text-xs px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold shadow-sm">
                  السكر التقديري (eAG): <strong>{calcs.eag.value} mg/dL</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Fasting Blood Sugar (mg/dL)</label>
                <input
                  type="text"
                  value={data.fbs}
                  onChange={e => setData({ ...data, fbs: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-black text-xs ${
                    fbsPanic.isPanic ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Normal: 70 - 110</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">HbA1c (%)</label>
                <input
                  type="text"
                  value={data.hba1c}
                  onChange={e => setData({ ...data, hba1c: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Normal: &lt; 5.7 %</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Fasting Insulin (uIU/mL)</label>
                <input
                  type="text"
                  value={data.fastingInsulin}
                  onChange={e => setData({ ...data, fastingInsulin: e.target.value })}
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 2.6 - 24.9</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TSH (uIU/mL)</label>
                <input
                  type="text"
                  value={data.tsh}
                  onChange={e => setData({ ...data, tsh: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Ref: 0.4 - 4.2</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              ملاحظات وتوصيات أخصائي الكيمياء السريرية (Biochemist Notes)
            </label>
            <textarea
              rows={2}
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              placeholder="اكتب أي ملاحظات أو تعليقات هنا..."
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
              {saving ? 'جارٍ الحفظ...' : 'حفظ نتائج الكيمياء (Save Chemistry)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
