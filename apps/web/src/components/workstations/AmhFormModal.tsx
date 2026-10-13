'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Sparkles,
  User,
  Activity,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  FileText
} from 'lucide-react';
import { useToast } from '../Toast';

export interface AmhAnalysisData {
  resultValue: string;
  unit: string;
  analyzer: string;
  flag: string;
  interpretation: string;
  notes: string;
}

export const AMH_AGE_INTERPRETATIONS = [
  { ageRange: 'From 12-17 years', minAge: 12, maxAge: 17, low: 1.57, high: 7.60, refText: '1.57-7.60' },
  { ageRange: 'From 18-24 years', minAge: 18, maxAge: 24, low: 2.15, high: 8.40, refText: '2.15-8.40' },
  { ageRange: 'From 25-29 years', minAge: 25, maxAge: 29, low: 1.56, high: 7.76, refText: '1.56-7.76' },
  { ageRange: 'From 30-34 years', minAge: 30, maxAge: 34, low: 1.19, high: 7.00, refText: '1.19-7.00' },
  { ageRange: 'From 35-39 years', minAge: 35, maxAge: 39, low: 0.36, high: 5.15, refText: '0.36-5.15' },
  { ageRange: 'From 40-44 years', minAge: 40, maxAge: 44, low: 0.17, high: 3.84, refText: '0.17-3.84' },
];

export const AMH_ANALYZER_PRESETS = [
  'VIDAS Autoanalyzer',
  'Roche Cobas (ECLIA)',
  'Beckman Coulter Access',
  'Snibe Maglumi (CLIA)',
  'Mindray CL-Series',
  'Enzyme Immunoassay (ELISA)',
];

export const AMH_INTERPRETATION_OPTIONS = [
  'Diminished Ovarian Reserve (Low)',
  'Normal Ovarian Reserve',
  'Increased Ovarian Reserve (Risk of PCOS)',
  'Very Low / Menopausal Range',
  'Under Borderline / Retest Recommended'
];

interface AmhFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  patientName?: string | null;
  patientGender?: string | null;
  patientAge?: number | string | null;
  initialData?: string;
  onApply: (formattedResult: string, rawData: AmhAnalysisData) => void;
}

export default function AmhFormModal({
  isOpen,
  onClose,
  patientName,
  patientGender,
  patientAge,
  initialData,
  onApply,
}: AmhFormModalProps) {
  const toast = useToast();

  const [resultValue, setResultValue] = useState<string>('0.122');
  const [unit, setUnit] = useState<string>('ng/mL');
  const [analyzer, setAnalyzer] = useState<string>('VIDAS Autoanalyzer');
  const [manualFlag, setManualFlag] = useState<string>('L');
  const [interpretation, setInterpretation] = useState<string>('Diminished Ovarian Reserve (Low)');
  const [notes, setNotes] = useState<string>('');

  // Extract numerical age
  const numericAge = useMemo(() => {
    if (patientAge === undefined || patientAge === null) return null;
    const match = String(patientAge).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, [patientAge]);

  // Find matching age bracket from table
  const matchedBracket = useMemo(() => {
    if (numericAge === null) return null;
    return AMH_AGE_INTERPRETATIONS.find(b => numericAge >= b.minAge && numericAge <= b.maxAge) || null;
  }, [numericAge]);

  // Compute calculated flag based on matched range
  const autoFlag = useMemo(() => {
    const val = parseFloat(resultValue);
    if (isNaN(val) || !matchedBracket) return '';
    if (val < matchedBracket.low) return 'L';
    if (val > matchedBracket.high) return 'H';
    return 'Normal';
  }, [resultValue, matchedBracket]);

  // Parse initial data if passed
  useEffect(() => {
    if (!initialData || !initialData.trim()) return;

    if (initialData.includes('[ANTI-MULLERIAN HORMONE - AMH]') || initialData.includes('AMH')) {
      const lines = initialData.split('\n');
      lines.forEach(line => {
        const tr = line.trim();
        if (tr.startsWith('METHOD:')) {
          setAnalyzer(tr.replace('METHOD:', '').trim());
        } else if (tr.startsWith('RESULT:')) {
          const raw = tr.replace('RESULT:', '').trim();
          const parts = raw.split(/\s+/);
          if (parts[0] === 'L' || parts[0] === 'H') {
            setManualFlag(parts[0]);
            setResultValue(parts.slice(1).join(' ').replace(/(ng\/mL|pmol\/L)/gi, '').trim());
          } else {
            setResultValue(raw.replace(/(ng\/mL|pmol\/L)/gi, '').trim());
          }
        } else if (tr.startsWith('INTERPRETATION:')) {
          setInterpretation(tr.replace('INTERPRETATION:', '').trim());
        } else if (tr.startsWith('NOTES:')) {
          setNotes(tr.replace('NOTES:', '').trim());
        }
      });
    } else {
      // Just plain string value (e.g. from table cell)
      const clean = initialData.replace(/\[.*?\]/g, '').trim();
      const matchFlag = clean.match(/^([LH])\s+(.+)$/i);
      if (matchFlag) {
        setManualFlag(matchFlag[1].toUpperCase());
        setResultValue(matchFlag[2].replace(/(ng\/mL|pmol\/L)/gi, '').trim());
      } else {
        setResultValue(clean.replace(/(ng\/mL|pmol\/L)/gi, '').trim());
      }
    }
  }, [initialData]);

  // Keep manual flag synced with autoFlag if autoFlag is detected
  useEffect(() => {
    if (autoFlag && autoFlag !== 'Normal') {
      setManualFlag(autoFlag);
      if (autoFlag === 'L') {
        setInterpretation('Diminished Ovarian Reserve (Low)');
      } else if (autoFlag === 'H') {
        setInterpretation('Increased Ovarian Reserve (Risk of PCOS)');
      }
    } else if (autoFlag === 'Normal') {
      setManualFlag('');
      setInterpretation('Normal Ovarian Reserve');
    }
  }, [autoFlag]);

  if (!isOpen) return null;

  const handleApply = () => {
    const flagPrefix = manualFlag ? `${manualFlag} ` : '';
    const formatted = [
      '[ANTI-MULLERIAN HORMONE - AMH]',
      `METHOD: ${analyzer}`,
      `RESULT: ${flagPrefix}${resultValue.trim()} ${unit}`,
      interpretation ? `INTERPRETATION: ${interpretation}` : '',
      notes ? `NOTES: ${notes.trim()}` : ''
    ].filter(Boolean).join('\n');

    onApply(formatted, {
      resultValue: resultValue.trim(),
      unit,
      analyzer,
      flag: manualFlag,
      interpretation,
      notes: notes.trim(),
    });

    toast.success('تم إدراج نتائج فحص مخزون المبيض (AMH) بنجاح!', 'تم الحفظ');
    onClose();
  };

  const handlePreset = (presetVal: string, presetFlag: string, presetInterp: string) => {
    setResultValue(presetVal);
    setManualFlag(presetFlag);
    setInterpretation(presetInterp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-700 via-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Activity className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  فحص هرمون مخزون المبيض (AMH)
                </h2>
                <span className="text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  VIDAS / Autoanalyzer Form
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 font-medium">
                Anti-Mullerian Hormone Assay with Age-Stratified Interpretation Table
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>المريضة: {patientName || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              <span className="text-slate-500">العمر:</span>
              <span className="font-bold text-teal-700">{patientAge || '—'} سنة</span>
            </div>
            {matchedBracket && (
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>الشريحة العمرية المطابقة: {matchedBracket.ageRange} ({matchedBracket.refText} ng/mL)</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span>Specialized Endocrinology Station</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">
              نماذج جاهزة سريعة (Quick Presets):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePreset('0.122', 'L', 'Diminished Ovarian Reserve (Low)')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              >
                <AlertCircle className="w-3 h-3 text-rose-500" />
                مخزون منخفض L (0.122 ng/mL)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('2.50', '', 'Normal Ovarian Reserve')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3 h-3 text-emerald-500" />
                مخزون طبيعي (2.50 ng/mL)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('8.45', 'H', 'Increased Ovarian Reserve (Risk of PCOS)')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
              >
                <AlertCircle className="w-3 h-3 text-amber-500" />
                مخزون مرتفع / تكيس H (8.45 ng/mL)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('< 0.01', 'L', 'Very Low / Menopausal Range')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
              >
                غير مقروء / منعدم (&lt; 0.01)
              </button>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* 1. Result Value */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>نتيجة الفحص (Result Value):</span>
                <span className="text-[10px] text-teal-600 font-mono">ng/mL</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder="0.122"
                  className="w-full h-11 px-3 text-base font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none transition-colors text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* 2. Flag Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                مؤشر النتيجة (Flag / Abnormal):
              </label>
              <div className="flex gap-2 h-11">
                <button
                  type="button"
                  onClick={() => setManualFlag('L')}
                  className={`flex-1 rounded-lg text-xs font-black transition-all border ${
                    manualFlag === 'L'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  L (Low)
                </button>
                <button
                  type="button"
                  onClick={() => setManualFlag('')}
                  className={`flex-1 rounded-lg text-xs font-black transition-all border ${
                    manualFlag === ''
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setManualFlag('H')}
                  className={`flex-1 rounded-lg text-xs font-black transition-all border ${
                    manualFlag === 'H'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  H (High)
                </button>
              </div>
            </div>

            {/* 3. Analyzer / Method */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                جهاز / تقنية التحليل (Method):
              </label>
              <select
                value={analyzer}
                onChange={(e) => setAnalyzer(e.target.value)}
                className="w-full h-11 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none transition-colors"
                dir="ltr"
              >
                {AMH_ANALYZER_PRESETS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Interpretation & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                التفسير السريري لمخزون المبيض (Clinical Interpretation):
              </label>
              <select
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none transition-colors"
                dir="ltr"
              >
                {AMH_INTERPRETATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                ملاحظة إضافية للتقرير الطبي (Notes / Correlation):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional clinician notes..."
                className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>
          </div>

          {/* Live Preview of the Official Interpretation Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>المعاينة الحية لتقرير الطباعة الرسمي (Official Print Layout Preview):</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Format: VIDAS Autoanalyzer
              </span>
            </div>

            <div className="p-6 bg-slate-50/50 flex flex-col items-center">
              {/* Report Header simulation */}
              <div className="w-full max-w-lg bg-white border border-slate-300 rounded-lg p-5 shadow-sm text-center font-sans">
                <h3 className="text-base font-extrabold text-teal-900 underline underline-offset-4 mb-3 tracking-wide" dir="ltr">
                  Anti-Mullerian Hormone by {analyzer}
                </h3>

                {/* Result Display */}
                <div className="text-base font-bold text-slate-900 mb-4 flex items-center justify-center gap-2" dir="ltr">
                  <span>Result:</span>
                  <span className={`text-xl font-black ${manualFlag === 'L' || manualFlag === 'H' ? 'text-rose-600' : 'text-slate-900'}`}>
                    {manualFlag ? `${manualFlag} ` : ''}{resultValue || '—'}
                  </span>
                  <span className="text-sm font-bold text-slate-600">{unit}</span>
                </div>

                {/* Interpretation Table Container */}
                <div className="border border-slate-300 rounded overflow-hidden text-left" dir="ltr">
                  <div className="bg-slate-200/80 font-bold text-xs py-1.5 px-4 text-center text-slate-800 border-b border-slate-300 tracking-wider uppercase">
                    Interpretation
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {AMH_AGE_INTERPRETATIONS.map((row, idx) => {
                        const isMatch = matchedBracket?.ageRange === row.ageRange;
                        return (
                          <tr
                            key={row.ageRange}
                            className={`${
                              isMatch
                                ? 'bg-teal-50 font-extrabold text-teal-900'
                                : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-slate-50/50'
                            } border-b border-slate-200/80 last:border-b-0`}
                          >
                            <td className="py-1.5 px-4 font-semibold text-slate-700 flex items-center justify-between">
                              <span>{row.ageRange}</span>
                              {isMatch && (
                                <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-mono font-normal">
                                  Patient
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-4 text-right font-bold text-slate-900 font-mono">
                              {row.refText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {notes && (
                  <div className="mt-3 text-[11px] text-slate-500 italic text-left" dir="ltr">
                    Note: {notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            إلغاء التعديل
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتثبيت نتيجة AMH في التقرير</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
