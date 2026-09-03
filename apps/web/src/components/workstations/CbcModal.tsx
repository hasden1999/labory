'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, CheckCircle2, Sparkles, AlertTriangle, RotateCcw, Activity, Calculator, AlertCircle, AlertOctagon } from 'lucide-react';
import { useToast } from '../Toast';
import { 
  validateDifferentialSum, 
  calculateCbcIndices, 
  calculateMentzerIndex,
  evaluatePanicFlag
} from '../../lib/clinicalIntelligence';

export interface CbcAnalysisData {
  // Erythroid
  rbc: string;
  hgb: string;
  hct: string;
  mcv: string;
  mch: string;
  mchc: string;
  rdw: string;

  // Platelets
  plt: string;
  mpv: string;
  pdw: string;
  pct: string;

  // Leukocytes
  wbc: string;
  neutrophils: string;
  lymphocytes: string;
  monocytes: string;
  eosinophils: string;
  basophils: string;

  // Morphology & Comments
  morphology: string;
  comments: string;
}

export const DEFAULT_CBC_DATA: CbcAnalysisData = {
  rbc: '4.80',
  hgb: '14.5',
  hct: '43.5',
  mcv: '90.6',
  mch: '30.2',
  mchc: '33.3',
  rdw: '12.5',
  plt: '250',
  mpv: '9.8',
  pdw: '11.2',
  pct: '0.245',
  wbc: '7.2',
  neutrophils: '60.0',
  lymphocytes: '30.0',
  monocytes: '6.0',
  eosinophils: '3.0',
  basophils: '1.0',
  morphology: 'Normocytic Normochromic red blood cells. Normal leukocyte and platelet morphology.',
  comments: 'Normal hematological profile.'
};

export function serializeCbc(data: CbcAnalysisData): string {
  const parts: string[] = ['[CBC - COMPLETE BLOOD COUNT & 5-PART DIFFERENTIAL]'];

  parts.push(`ERYTHROID: RBC: ${data.rbc} 10^6/uL | HGB: ${data.hgb} g/dL | HCT: ${data.hct} % | MCV: ${data.mcv} fL | MCH: ${data.mch} pg | MCHC: ${data.mchc} g/dL | RDW: ${data.rdw} %`);
  parts.push(`PLATELETS: PLT: ${data.plt} 10^3/uL | MPV: ${data.mpv} fL | PDW: ${data.pdw} % | PCT: ${data.pct} %`);
  parts.push(`LEUKOCYTES: Total WBC: ${data.wbc} 10^3/uL`);

  const n = parseFloat(data.neutrophils) || 0;
  const l = parseFloat(data.lymphocytes) || 0;
  const m = parseFloat(data.monocytes) || 0;
  const e = parseFloat(data.eosinophils) || 0;
  const b = parseFloat(data.basophils) || 0;
  const diffSum = Math.round((n + l + m + e + b) * 10) / 10;

  parts.push(`DIFFERENTIAL: Neut: ${data.neutrophils}% | Lymph: ${data.lymphocytes}% | Mono: ${data.monocytes}% | Eos: ${data.eosinophils}% | Baso: ${data.basophils}% (Sum: ${diffSum}%)`);

  const rbcVal = parseFloat(data.rbc);
  const mcvVal = parseFloat(data.mcv);
  if (rbcVal > 0 && mcvVal > 0) {
    const mentzer = calculateMentzerIndex(mcvVal, rbcVal);
    if (mentzer) {
      if (mentzer.isApplicable === false) {
        parts.push(`INDICES: Mentzer Index: ${mentzer.interpretation}`);
      } else {
        parts.push(`INDICES: Mentzer Index: ${mentzer.value} (${mentzer.interpretation})`);
      }
    }
  }

  if (data.morphology && data.morphology.trim()) {
    parts.push(`MORPHOLOGY: ${data.morphology.trim()}`);
  }
  if (data.comments && data.comments.trim()) {
    parts.push(`COMMENTS: ${data.comments.trim()}`);
  }

  return parts.join('\n');
}

export function parseCbc(raw: string): CbcAnalysisData {
  if (!raw || !raw.includes('CBC')) return { ...DEFAULT_CBC_DATA };

  const parsed = { ...DEFAULT_CBC_DATA };
  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('ERYTHROID:')) {
      const rbcM = trimmed.match(/RBC:\s*([^\s|]+)/i);
      if (rbcM) parsed.rbc = rbcM[1];
      const hgbM = trimmed.match(/HGB:\s*([^\s|]+)/i);
      if (hgbM) parsed.hgb = hgbM[1];
      const hctM = trimmed.match(/HCT:\s*([^\s|]+)/i);
      if (hctM) parsed.hct = hctM[1];
      const mcvM = trimmed.match(/MCV:\s*([^\s|]+)/i);
      if (mcvM) parsed.mcv = mcvM[1];
      const mchM = trimmed.match(/MCH:\s*([^\s|]+)/i);
      if (mchM) parsed.mch = mchM[1];
      const mchcM = trimmed.match(/MCHC:\s*([^\s|]+)/i);
      if (mchcM) parsed.mchc = mchcM[1];
      const rdwM = trimmed.match(/RDW:\s*([^\s|]+)/i);
      if (rdwM) parsed.rdw = rdwM[1];
    } else if (trimmed.startsWith('PLATELETS:')) {
      const pltM = trimmed.match(/PLT:\s*([^\s|]+)/i);
      if (pltM) parsed.plt = pltM[1];
      const mpvM = trimmed.match(/MPV:\s*([^\s|]+)/i);
      if (mpvM) parsed.mpv = mpvM[1];
      const pdwM = trimmed.match(/PDW:\s*([^\s|]+)/i);
      if (pdwM) parsed.pdw = pdwM[1];
      const pctM = trimmed.match(/PCT:\s*([^\s|]+)/i);
      if (pctM) parsed.pct = pctM[1];
    } else if (trimmed.startsWith('LEUKOCYTES:')) {
      const wbcM = trimmed.match(/WBC:\s*([^\s|]+)/i);
      if (wbcM) parsed.wbc = wbcM[1];
    } else if (trimmed.startsWith('DIFFERENTIAL:')) {
      const neutM = trimmed.match(/Neut:\s*([^\s%|]+)/i);
      if (neutM) parsed.neutrophils = neutM[1];
      const lymphM = trimmed.match(/Lymph:\s*([^\s%|]+)/i);
      if (lymphM) parsed.lymphocytes = lymphM[1];
      const monoM = trimmed.match(/Mono:\s*([^\s%|]+)/i);
      if (monoM) parsed.monocytes = monoM[1];
      const eosM = trimmed.match(/Eos:\s*([^\s%|]+)/i);
      if (eosM) parsed.eosinophils = eosM[1];
      const basoM = trimmed.match(/Baso:\s*([^\s%|]+)/i);
      if (basoM) parsed.basophils = basoM[1];
    } else if (trimmed.startsWith('MORPHOLOGY:')) {
      parsed.morphology = trimmed.replace('MORPHOLOGY:', '').trim();
    } else if (trimmed.startsWith('COMMENTS:')) {
      parsed.comments = trimmed.replace('COMMENTS:', '').trim();
    }
  }

  return parsed;
}

interface CbcModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: any;
  initialValue?: string;
  onSave: (serialized: string, isAbnormal: boolean) => Promise<void>;
}

export default function CbcModal({
  isOpen,
  onClose,
  sample,
  initialValue,
  onSave
}: CbcModalProps) {
  const toast = useToast();
  const [data, setData] = useState<CbcAnalysisData>(DEFAULT_CBC_DATA);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keyboard navigation across the 17 parameters
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const prevIdx = index > 0 ? index - 1 : 16;
        inputRefs.current[prevIdx]?.focus();
        inputRefs.current[prevIdx]?.select();
        return;
      }
      e.preventDefault();
      const nextIdx = index < 16 ? index + 1 : 0;
      inputRefs.current[nextIdx]?.focus();
      inputRefs.current[nextIdx]?.select();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = index > 0 ? index - 1 : 16;
      inputRefs.current[prevIdx]?.focus();
      inputRefs.current[prevIdx]?.select();
    }
  };

  // Live Auto-Calculation on Keystroke for Erythroid Indices (MCV, MCH, MCHC)
  const handleErythroidChange = (field: 'rbc' | 'hgb' | 'hct', val: string) => {
    const nextData = { ...data, [field]: val };
    const rbcNum = parseFloat(field === 'rbc' ? val : data.rbc);
    const hgbNum = parseFloat(field === 'hgb' ? val : data.hgb);
    const hctNum = parseFloat(field === 'hct' ? val : data.hct);

    if (rbcNum > 0 && hctNum > 0 && hgbNum > 0) {
      nextData.mcv = ((hctNum * 10) / rbcNum).toFixed(1);
      nextData.mch = ((hgbNum * 10) / rbcNum).toFixed(1);
      nextData.mchc = ((hgbNum * 100) / hctNum).toFixed(1);
    }
    setData(nextData);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue.includes('CBC')) {
        setData(parseCbc(initialValue));
      } else {
        setData({ ...DEFAULT_CBC_DATA });
      }
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  // Calculate Differential Sum
  const neutVal = parseFloat(data.neutrophils) || 0;
  const lymphVal = parseFloat(data.lymphocytes) || 0;
  const monoVal = parseFloat(data.monocytes) || 0;
  const eosVal = parseFloat(data.eosinophils) || 0;
  const basoVal = parseFloat(data.basophils) || 0;

  const diffValidation = validateDifferentialSum(neutVal, lymphVal, monoVal, eosVal, basoVal);
  const diffSum = diffValidation.sum;
  const isDiffValid = diffValidation.isValid;

  // Calculate Mentzer Index
  const rbcNum = parseFloat(data.rbc) || 0;
  const mcvNum = parseFloat(data.mcv) || 0;
  const mentzer = rbcNum > 0 && mcvNum > 0 ? calculateMentzerIndex(mcvNum, rbcNum) : null;

  // Panic Flag Evaluations
  const hgbPanic = evaluatePanicFlag('HGB', parseFloat(data.hgb) || 0);
  const pltPanic = evaluatePanicFlag('PLT', parseFloat(data.plt) || 0);
  const wbcPanic = evaluatePanicFlag('WBC', parseFloat(data.wbc) || 0);
  const hasCriticalPanic = hgbPanic.isPanic || pltPanic.isPanic || wbcPanic.isPanic;

  // Auto calculate MCV, MCH, MCHC
  const handleAutoComputeIndices = () => {
    const rbc = parseFloat(data.rbc);
    const hgb = parseFloat(data.hgb);
    const hct = parseFloat(data.hct);

    if (rbc > 0 && hct > 0 && hgb > 0) {
      const indices = calculateCbcIndices(rbc, hgb, hct);
      setData(prev => ({
        ...prev,
        mcv: indices.mcv !== undefined ? indices.mcv.toFixed(1) : prev.mcv,
        mch: indices.mch !== undefined ? indices.mch.toFixed(1) : prev.mch,
        mchc: indices.mchc !== undefined ? indices.mchc.toFixed(1) : prev.mchc
      }));
      toast.success('تم احتساب المؤشرات (MCV, MCH, MCHC) تلقائياً', 'حساب رياضي');
    } else {
      toast.error('يرجى إدخال قيم صالحة لـ RBC و HGB و HCT لحساب المؤشرات', 'نقص بيانات');
    }
  };

  const handleQuickNormal = () => {
    setData({ ...DEFAULT_CBC_DATA });
    toast.success('تم تطبيق فحص الدم الطبيعي (Normal CBC Preset)', 'نجاح');
  };

  const handleQuickPancytopenia = () => {
    setData({
      rbc: '1.80',
      hgb: '5.2',
      hct: '16.0',
      mcv: '88.9',
      mch: '28.9',
      mchc: '32.5',
      rdw: '18.2',
      plt: '12',
      mpv: '11.5',
      pdw: '16.0',
      pct: '0.014',
      wbc: '1.4',
      neutrophils: '20.0',
      lymphocytes: '72.0',
      monocytes: '6.0',
      eosinophils: '1.5',
      basophils: '0.5',
      morphology: 'Severe anisopoikilocytosis, marked leukopenia and thrombocytopenia.',
      comments: 'CRITICAL VALUE ALERT: Severe acute pancytopenia with critical anemia and thrombocytopenia.'
    });
    toast.warning('تم تطبيق حالة نقص خلايا الدم الشامل (Severe Pancytopenia)', 'تطبيق سريع');
  };

  const isAbnormal = 
    hasCriticalPanic ||
    parseFloat(data.hgb) < 12.0 || parseFloat(data.hgb) > 17.5 ||
    parseFloat(data.plt) < 150 || parseFloat(data.plt) > 450 ||
    parseFloat(data.wbc) < 4.0 || parseFloat(data.wbc) > 11.0 ||
    !isDiffValid;

  const handleSave = async () => {
    if (!isDiffValid) {
      toast.warning(`تنبيه: مجموع تفريق كريات الدم البيضاء يساوي ${diffSum}% وليس 100%`, 'تنبيه سريري');
    }

    try {
      setSaving(true);
      const serialized = serializeCbc(data);
      await onSave(serialized, isAbnormal);
      toast.success('تم حفظ تقرير تعداد الدم الكامل (CBC) بنجاح', 'تم الحفظ');
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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">محطة أمراض الدم وتعداد الدم الكامل (CBC Workstation)</h2>
                {hasCriticalPanic ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                    <AlertOctagon size={12} /> قيمة حرجة مهددة للحياة (CRITICAL PANIC)
                  </span>
                ) : isAbnormal ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 border border-amber-200">
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
              onClick={handleAutoComputeIndices}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition-all"
            >
              <Calculator className="w-3.5 h-3.5" />
              حساب المؤشرات (Auto MCV/MCH)
            </button>
            <button
              onClick={handleQuickNormal}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              طبيعي (Normal)
            </button>
            <button
              onClick={handleQuickPancytopenia}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              نقص شامل (Pancytopenia)
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
                تنبيه سريري فوري (Critical Panic Value): تم رصد قيم حرجة تستوجب إبلاغ الطبيب المعالج فوراً!
                {hgbPanic.isPanic && ` [Hb: ${data.hgb} g/dL < 6.0]`}
                {pltPanic.isPanic && ` [Plt: ${data.plt} x10^3 < 20]`}
                {wbcPanic.isPanic && ` [Wbc: ${data.wbc} x10^3 < 2.0]`}
              </span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">High Priority</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Top Section: Red Cells & Erythroid Parameters */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs">1</span>
                سلسلة كريات الدم الحمراء والهيموجلوبين (Erythroid Parameters)
              </h3>
              {mentzer && (
                <div className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
                  مؤشر منتزر (Mentzer Index): <strong>{mentzer.value}</strong> - {mentzer.interpretation}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">R.B.C (10^6/uL)</label>
                <input
                  ref={el => { inputRefs.current[0] = el; }}
                  type="text"
                  value={data.rbc}
                  onChange={e => handleErythroidChange('rbc', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 0)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 4.5 - 5.9</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">HGB (g/dL)</label>
                <input
                  ref={el => { inputRefs.current[1] = el; }}
                  type="text"
                  value={data.hgb}
                  onChange={e => handleErythroidChange('hgb', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 1)}
                  onFocus={e => e.target.select()}
                  className={`w-full px-3 py-2 rounded-lg border font-black text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none ${
                    hgbPanic.isPanic 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Ref: 13.0 - 17.5</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">HCT / PCV (%)</label>
                <input
                  ref={el => { inputRefs.current[2] = el; }}
                  type="text"
                  value={data.hct}
                  onChange={e => handleErythroidChange('hct', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 2)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 40 - 52</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">MCV (fL)</label>
                <input
                  ref={el => { inputRefs.current[3] = el; }}
                  type="text"
                  value={data.mcv}
                  onChange={e => setData({ ...data, mcv: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 3)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 80 - 100</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">MCH (pg)</label>
                <input
                  ref={el => { inputRefs.current[4] = el; }}
                  type="text"
                  value={data.mch}
                  onChange={e => setData({ ...data, mch: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 4)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 27 - 33</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">MCHC (g/dL)</label>
                <input
                  ref={el => { inputRefs.current[5] = el; }}
                  type="text"
                  value={data.mchc}
                  onChange={e => setData({ ...data, mchc: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 5)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 32 - 36</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">RDW-CV (%)</label>
                <input
                  ref={el => { inputRefs.current[6] = el; }}
                  type="text"
                  value={data.rdw}
                  onChange={e => setData({ ...data, rdw: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 6)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 11.5 - 14.5</span>
              </div>
            </div>
          </div>

          {/* Middle Section: Platelets */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs">2</span>
              سلسلة الصفائح الدموية (Platelet Indices)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">PLT (10^3/uL)</label>
                <input
                  ref={el => { inputRefs.current[7] = el; }}
                  type="text"
                  value={data.plt}
                  onChange={e => setData({ ...data, plt: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 7)}
                  onFocus={e => e.target.select()}
                  className={`w-full px-3 py-2 rounded-lg border font-black text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                    pltPanic.isPanic 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Ref: 150 - 450</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">MPV (fL)</label>
                <input
                  ref={el => { inputRefs.current[8] = el; }}
                  type="text"
                  value={data.mpv}
                  onChange={e => setData({ ...data, mpv: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 8)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 7.4 - 10.4</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">PDW (%)</label>
                <input
                  ref={el => { inputRefs.current[9] = el; }}
                  type="text"
                  value={data.pdw}
                  onChange={e => setData({ ...data, pdw: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 9)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 9.0 - 17.0</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">PCT (%)</label>
                <input
                  ref={el => { inputRefs.current[10] = el; }}
                  type="text"
                  value={data.pct}
                  onChange={e => setData({ ...data, pct: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 10)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 0.10 - 0.28</span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Leukocytes & 5-Part Differential with Balance Validator */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs">3</span>
                كريات الدم البيضاء والتفريق الخماسي (WBC & 5-Part Differential)
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">مجموع التفريق:</span>
                {isDiffValid ? (
                  <span className="px-3 py-1 rounded-lg text-xs font-black border transition-all bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                    <span>100.0% متطابق</span>
                  </span>
                ) : diffSum < 100 ? (
                  <span className="px-3 py-1 rounded-lg text-xs font-black border transition-all bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                    <span>{diffSum.toFixed(1)}% (المتبقي: {(100 - diffSum).toFixed(1)}%)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-lg text-xs font-black border transition-all bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-300 animate-pulse flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-rose-600" />
                    <span>{diffSum.toFixed(1)}% (زيادة: {(diffSum - 100).toFixed(1)}%)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Total W.B.C (10^3)</label>
                <input
                  ref={el => { inputRefs.current[11] = el; }}
                  type="text"
                  value={data.wbc}
                  onChange={e => setData({ ...data, wbc: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 11)}
                  onFocus={e => e.target.select()}
                  className={`w-full px-3 py-2 rounded-lg border font-black text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                    wbcPanic.isPanic 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400">Ref: 4.0 - 11.0</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Neutrophils (%)</label>
                <input
                  ref={el => { inputRefs.current[12] = el; }}
                  type="text"
                  value={data.neutrophils}
                  onChange={e => setData({ ...data, neutrophils: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 12)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 40 - 75 %</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Lymphocytes (%)</label>
                <input
                  ref={el => { inputRefs.current[13] = el; }}
                  type="text"
                  value={data.lymphocytes}
                  onChange={e => setData({ ...data, lymphocytes: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 13)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 20 - 45 %</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Monocytes (%)</label>
                <input
                  ref={el => { inputRefs.current[14] = el; }}
                  type="text"
                  value={data.monocytes}
                  onChange={e => setData({ ...data, monocytes: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 14)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 2 - 10 %</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Eosinophils (%)</label>
                <input
                  ref={el => { inputRefs.current[15] = el; }}
                  type="text"
                  value={data.eosinophils}
                  onChange={e => setData({ ...data, eosinophils: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 15)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 1 - 6 %</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Basophils (%)</label>
                <input
                  ref={el => { inputRefs.current[16] = el; }}
                  type="text"
                  value={data.basophils}
                  onChange={e => setData({ ...data, basophils: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 16)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Ref: 0 - 1 %</span>
              </div>
            </div>
          </div>

          {/* Morphology & Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                الفحص المورفولوجي لشريحة الدم (Blood Film Morphology)
              </label>
              <textarea
                rows={2}
                value={data.morphology}
                onChange={e => setData({ ...data, morphology: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                placeholder="Normocytic normochromic red cells, no abnormal blasts seen..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                التعليق السريري للمختبر (Clinical Comments)
              </label>
              <textarea
                rows={2}
                value={data.comments}
                onChange={e => setData({ ...data, comments: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                placeholder="Write any doctor recommendations or remarks..."
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            توازن الـ Differential: <strong className={isDiffValid ? 'text-emerald-600' : 'text-rose-600'}>{diffSum}%</strong> | 
            الحالة: <strong className={isAbnormal ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{isAbnormal ? 'غير طبيعي (Abnormal)' : 'طبيعي (Normal)'}</strong>
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
              className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ نتائج فحص الدم (Save CBC)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
