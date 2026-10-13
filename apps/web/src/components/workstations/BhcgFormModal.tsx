'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  User,
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useToast } from '../Toast';

export interface BhcgAnalysisData {
  resultValue: string;
  unit: string;
  analyzer: string;
  status: string;
  gestationalWeeks: string;
  notes: string;
}

export const BHCG_INTERPRETATION_TABLE = [
  { rangeText: '< 5', minVal: 0, maxVal: 5, weekText: 'Non-pregnant' },
  { rangeText: '5 – 50', minVal: 5, maxVal: 50, weekText: '3' },
  { rangeText: '5 – 426', minVal: 5, maxVal: 426, weekText: '4' },
  { rangeText: '18 – 7,340', minVal: 18, maxVal: 7340, weekText: '5' },
  { rangeText: '1,080 – 56,500', minVal: 1080, maxVal: 56500, weekText: '6' },
  { rangeText: '7,650 – 229,000', minVal: 7650, maxVal: 229000, weekText: '7 - 8' },
  { rangeText: '25,700 – 288,000', minVal: 25700, maxVal: 288000, weekText: '9 - 12' },
  { rangeText: '13,300 – 254,000', minVal: 13300, maxVal: 254000, weekText: '13 - 16' },
  { rangeText: '4,060 – 165,400', minVal: 4060, maxVal: 165400, weekText: '17 - 24' },
  { rangeText: '3,640 – 117,000', minVal: 3640, maxVal: 117000, weekText: '25 - 40' },
];

export const BHCG_ANALYZER_PRESETS = [
  'Automated Quantitative Assay',
  'VIDAS Autoanalyzer',
  'Roche Cobas (ECLIA)',
  'Abbott Architect',
  'Snibe Maglumi (CLIA)',
  'Mindray CL-Series',
];

interface BhcgFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  patientName?: string | null;
  patientGender?: string | null;
  patientAge?: number | string | null;
  initialData?: string;
  onApply: (formattedResult: string, rawData: BhcgAnalysisData) => void;
}

export default function BhcgFormModal({
  isOpen,
  onClose,
  patientName,
  patientAge,
  initialData,
  onApply,
}: BhcgFormModalProps) {
  const toast = useToast();

  const [resultValue, setResultValue] = useState<string>('< 5.0');
  const [unit, setUnit] = useState<string>('mIU/mL');
  const [analyzer, setAnalyzer] = useState<string>('Automated Quantitative Assay');
  const [status, setStatus] = useState<string>('Non-pregnant');
  const [gestationalWeeks, setGestationalWeeks] = useState<string>('Non-pregnant');
  const [notes, setNotes] = useState<string>('');

  // Auto-detect gestational range from result value
  const matchedRow = useMemo(() => {
    const raw = resultValue.trim();
    if (raw.startsWith('<') || raw === '0' || raw.toLowerCase().includes('neg')) {
      return BHCG_INTERPRETATION_TABLE[0];
    }
    const cleanNum = parseFloat(raw.replace(/,/g, ''));
    if (isNaN(cleanNum)) return null;

    if (cleanNum < 5) return BHCG_INTERPRETATION_TABLE[0];
    // Find the closest or matching bracket
    return BHCG_INTERPRETATION_TABLE.find(r => r.minVal > 0 && cleanNum >= r.minVal && cleanNum <= r.maxVal) || null;
  }, [resultValue]);

  // Parse initial data
  useEffect(() => {
    if (!initialData || !initialData.trim()) return;

    if (initialData.includes('[TOTAL BETA-HCG') || initialData.includes('HCG')) {
      const lines = initialData.split('\n');
      lines.forEach(line => {
        const tr = line.trim();
        if (tr.startsWith('METHOD:')) {
          setAnalyzer(tr.replace('METHOD:', '').trim());
        } else if (tr.startsWith('RESULT:')) {
          const raw = tr.replace('RESULT:', '').trim();
          setResultValue(raw.replace(/(mIU\/mL|IU\/L)/gi, '').trim());
        } else if (tr.startsWith('INTERPRETATION:') || tr.startsWith('STATUS:')) {
          setStatus(tr.replace(/^(INTERPRETATION|STATUS):/, '').trim());
        } else if (tr.startsWith('GESTATIONAL_WEEKS:')) {
          setGestationalWeeks(tr.replace('GESTATIONAL_WEEKS:', '').trim());
        } else if (tr.startsWith('NOTES:')) {
          setNotes(tr.replace('NOTES:', '').trim());
        }
      });
    } else {
      const clean = initialData.replace(/\[.*?\]/g, '').trim();
      setResultValue(clean.replace(/(mIU\/mL|IU\/L)/gi, '').trim());
    }
  }, [initialData]);

  // Sync gestational weeks and status when result changes
  useEffect(() => {
    if (matchedRow) {
      if (matchedRow.weekText === 'Non-pregnant') {
        setStatus('Non-pregnant');
        setGestationalWeeks('Non-pregnant');
      } else {
        setStatus(`Pregnant (Estimated Week ${matchedRow.weekText})`);
        setGestationalWeeks(`Week ${matchedRow.weekText}`);
      }
    }
  }, [matchedRow]);

  if (!isOpen) return null;

  const handleApply = () => {
    const formatted = [
      '[TOTAL BETA-HCG LEVEL ASSAY]',
      `METHOD: ${analyzer}`,
      `RESULT: ${resultValue.trim()} ${unit}`,
      `STATUS: ${status}`,
      gestationalWeeks ? `GESTATIONAL_WEEKS: ${gestationalWeeks}` : '',
      notes ? `NOTES: ${notes.trim()}` : ''
    ].filter(Boolean).join('\n');

    onApply(formatted, {
      resultValue: resultValue.trim(),
      unit,
      analyzer,
      status,
      gestationalWeeks,
      notes: notes.trim(),
    });

    toast.success('تم حفظ وإدراج نتيجة فحص الحمل الرقمي (β-HCG) بنجاح!', 'تم الحفظ');
    onClose();
  };

  const handlePreset = (val: string, st: string, wk: string) => {
    setResultValue(val);
    setStatus(st);
    setGestationalWeeks(wk);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-700 via-pink-800 to-rose-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Calendar className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  فحص الحمل الرقمي التراكمي (Total β-HCG Assay)
                </h2>
                <span className="text-[11px] font-semibold bg-rose-400/20 text-rose-200 px-2 py-0.5 rounded-full border border-rose-400/30">
                  Quantitative LMP Weeks
                </span>
              </div>
              <p className="text-xs text-rose-100/80 font-medium">
                Total β–HCG level Assay with Gestational Weeks Reference Table
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
              <User className="w-3.5 h-3.5 text-rose-600" />
              <span>المريضة: {patientName || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              <span className="text-slate-500">العمر:</span>
              <span className="font-bold text-rose-700">{patientAge || '—'} سنة</span>
            </div>
            {matchedRow && (
              <div className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {matchedRow.weekText === 'Non-pregnant' ? 'غير حامل (Non-pregnant)' : `تقدير الحمل: أسبوع ${matchedRow.weekText} (منذ آخر دورة)`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span>Quantitative Serology Station</span>
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
                onClick={() => handlePreset('< 5.0', 'Non-pregnant', 'Non-pregnant')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
              >
                غير حامل (&lt; 5.0 mIU/mL)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('150', 'Pregnant (Week 4)', 'Week 4')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-rose-500" />
                حمل مبكر: أسبوع 4 (150 mIU/mL)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('12,500', 'Pregnant (Weeks 6-8)', 'Week 6')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-pink-500" />
                حمل مؤكد: أسبوع 6 (12,500 mIU/mL)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('85,000', 'Pregnant (Weeks 9-12)', 'Weeks 9 - 12')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-purple-500" />
                نهاية الثلث الأول: أسبوع 9-12 (85,000 mIU/mL)
              </button>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* 1. Result Value */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>نتيجة الفحص (Result Value):</span>
                <span className="text-[10px] text-rose-600 font-mono">mIU/mL</span>
              </label>
              <input
                type="text"
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                placeholder="< 5.0"
                className="w-full h-11 px-3 text-base font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-lg focus:border-rose-600 focus:outline-none transition-colors text-left font-mono"
                dir="ltr"
              />
            </div>

            {/* 2. Status / Interpretation */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                حالة الفحص (Diagnostic Status):
              </label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Non-pregnant"
                className="w-full h-11 px-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-rose-600 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>

            {/* 3. Analyzer / Method */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                تقنية / جهاز القياس (Method):
              </label>
              <select
                value={analyzer}
                onChange={(e) => setAnalyzer(e.target.value)}
                className="w-full h-11 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-rose-600 focus:outline-none transition-colors"
                dir="ltr"
              >
                {BHCG_ANALYZER_PRESETS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              ملاحظة سريرية للتقرير (Clinical Footnote / Notes):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Serial quantitative testing recommended after 48-72 hours to assess doubling time."
              className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-rose-600 focus:outline-none transition-colors"
              dir="ltr"
            />
          </div>

          {/* Live Preview of the Official Table (Matching Image 2) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Eye className="w-3.5 h-3.5 text-rose-600" />
                <span>المعاينة الحية لتقرير الطباعة الرسمي (Official Print Layout Preview):</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Exact Reference Table
              </span>
            </div>

            <div className="p-6 bg-slate-50/50 flex flex-col items-center">
              <div className="w-full max-w-xl bg-white border border-slate-300 rounded-lg p-5 shadow-sm text-center font-sans">
                <h3 className="text-base font-extrabold text-slate-900 mb-3 tracking-wide" dir="ltr">
                  Total &beta;&ndash;HCG level Assay
                </h3>

                {/* Result Display Box */}
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 border border-slate-300 rounded text-slate-900 font-bold" dir="ltr">
                  <span>Result:</span>
                  <span className="text-lg font-black text-slate-900">
                    {resultValue || '—'}
                  </span>
                  <span className="text-xs font-bold text-slate-600">{unit}</span>
                </div>

                {/* Grid Table Matching User's Image 2 */}
                <div className="border border-slate-400 rounded overflow-hidden text-left" dir="ltr">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                        <th className="py-2 px-3 border-r border-slate-400 text-center w-1/2">
                          Total &beta;&ndash;HCG level ({unit})
                        </th>
                        <th className="py-2 px-3 text-center w-1/2">
                          Pregnant women (Week since LMP*)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {BHCG_INTERPRETATION_TABLE.map((row, idx) => {
                        const isMatch = matchedRow?.rangeText === row.rangeText;
                        return (
                          <tr
                            key={row.rangeText}
                            className={`${
                              isMatch
                                ? 'bg-rose-50 font-black text-rose-950'
                                : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-slate-50/40'
                            } border-b border-slate-300 last:border-b-0`}
                          >
                            <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono font-bold">
                              {row.rangeText}
                            </td>
                            <td className="py-1.5 px-3 text-center font-semibold text-slate-800">
                              {row.weekText}
                              {isMatch && (
                                <span className="mr-1.5 text-[9px] bg-rose-600 text-white px-1 py-0.2 rounded font-sans font-normal inline-block ml-1">
                                  Current
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 italic text-left" dir="ltr">
                  * LMP = Last Menstrual Period.
                  {notes ? ` Note: ${notes}` : ''}
                </div>
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

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتثبيت نتيجة &beta;-HCG في التقرير</span>
          </button>
        </div>
      </div>
    </div>
  );
}
