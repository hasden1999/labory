'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  RotateCcw, 
  Activity, 
  Calculator, 
  AlertCircle, 
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Microscope,
  FileText
} from 'lucide-react';
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
  sample?: any;
  patientName?: string;
  sampleNumber?: number | string;
  initialValue?: string;
  onSave?: (serialized: string, isAbnormal: boolean) => Promise<void> | void;
  onApply?: (formattedResult: string, rawData: CbcAnalysisData) => void;
}

export default function CbcModal({
  isOpen,
  onClose,
  sample,
  patientName,
  sampleNumber,
  initialValue,
  onSave,
  onApply,
}: CbcModalProps) {
  const toast = useToast();

  // Tab State: 'ERYTHROID' | 'LEUKOCYTES' | 'PLATELETS'
  const [activeTab, setActiveTab] = useState<'ERYTHROID' | 'LEUKOCYTES' | 'PLATELETS'>('ERYTHROID');
  const [data, setData] = useState<CbcAnalysisData>(DEFAULT_CBC_DATA);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resolvedPatientName = patientName || sample?.patient?.name || 'مريض غير محدد';
  const resolvedSampleNumber = sampleNumber || sample?.sampleNumber || sample?.id || '---';

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

  const setField = (field: keyof CbcAnalysisData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate Differential Sum
  const neutVal = parseFloat(data.neutrophils) || 0;
  const lymphVal = parseFloat(data.lymphocytes) || 0;
  const monoVal = parseFloat(data.monocytes) || 0;
  const eosVal = parseFloat(data.eosinophils) || 0;
  const basoVal = parseFloat(data.basophils) || 0;
  const totalWbcNum = parseFloat(data.wbc) || 0;

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

  const isAbnormal =
    hasCriticalPanic ||
    !isDiffValid ||
    (rbcNum > 0 && (rbcNum < 4.0 || rbcNum > 6.2)) ||
    (parseFloat(data.hgb) < 11.5 || parseFloat(data.hgb) > 17.5) ||
    (parseFloat(data.plt) < 140 || parseFloat(data.plt) > 460) ||
    (totalWbcNum < 4.0 || totalWbcNum > 11.0);

  const applyPreset = (presetName: 'NORMAL' | 'ANEMIA' | 'INFECTION' | 'PANCYTOPENIA') => {
    if (presetName === 'NORMAL') {
      setData({ ...DEFAULT_CBC_DATA });
      toast.success('تم تطبيق صورة الدم الطبيعية (Normal CBC)', 'تم التحميل');
    } else if (presetName === 'ANEMIA') {
      setData({
        rbc: '3.30',
        hgb: '8.6',
        hct: '26.2',
        mcv: '65.2',
        mch: '20.1',
        mchc: '30.9',
        rdw: '18.4',
        plt: '380',
        mpv: '9.4',
        pdw: '11.0',
        pct: '0.280',
        wbc: '7.4',
        neutrophils: '62.0',
        lymphocytes: '28.0',
        monocytes: '6.0',
        eosinophils: '3.0',
        basophils: '1.0',
        morphology: 'Microcytic hypochromic red blood cells with anisocytosis. Pencil cells and occasional target cells noted.',
        comments: 'Microcytic hypochromic anemia picture highly suggestive of Iron Deficiency Anemia (IDA). Mentzer Index > 13.',
      });
      toast.warning('تم تطبيق نموذج فقر الدم بعوز الحديد (Microcytic Hypochromic / IDA)', 'تم التحميل');
    } else if (presetName === 'INFECTION') {
      setData({
        rbc: '4.60',
        hgb: '13.8',
        hct: '41.5',
        mcv: '89.5',
        mch: '29.8',
        mchc: '33.2',
        rdw: '13.1',
        plt: '340',
        mpv: '10.2',
        pdw: '12.0',
        pct: '0.310',
        wbc: '17.8',
        neutrophils: '85.0',
        lymphocytes: '9.0',
        monocytes: '4.0',
        eosinophils: '1.5',
        basophils: '0.5',
        morphology: 'Marked neutrophilic leukocytosis with left shift. Toxic granulations and occasional band forms observed.',
        comments: 'Leukocytosis with absolute neutrophilia and toxic changes, suggestive of acute bacterial infection or inflammatory response.',
      });
      toast.warning('تم تطبيق نموذج الالتهاب البكتيري الحاد (Leukocytosis / Left Shift)', 'تم التحميل');
    } else if (presetName === 'PANCYTOPENIA') {
      setData({
        rbc: '2.10',
        hgb: '6.5',
        hct: '19.8',
        mcv: '94.2',
        mch: '31.0',
        mchc: '32.8',
        rdw: '15.6',
        plt: '18',
        mpv: '8.2',
        pdw: '15.0',
        pct: '0.015',
        wbc: '1.8',
        neutrophils: '38.0',
        lymphocytes: '54.0',
        monocytes: '6.0',
        eosinophils: '1.5',
        basophils: '0.5',
        morphology: 'Normocytic normochromic red cells with severe thrombocytopenia and marked leukopenia.',
        comments: 'CRITICAL PANIC FINDING: Severe pancytopenia. Immediate clinical notification required. Further bone marrow evaluation recommended.',
      });
      toast.error('تم تطبيق نموذج النقص الشامل الحاد (Pancytopenia)', 'قيم حرجة');
    }
  };

  const handleAutoComputeIndices = () => {
    const rbcN = parseFloat(data.rbc);
    const hgbN = parseFloat(data.hgb);
    const hctN = parseFloat(data.hct);
    if (rbcN > 0 && hctN > 0 && hgbN > 0) {
      const indices = calculateCbcIndices(rbcN, hgbN, hctN);
      if (indices.mcv !== undefined && indices.mch !== undefined && indices.mchc !== undefined) {
        setData((prev) => ({
          ...prev,
          mcv: indices.mcv!.toFixed(1),
          mch: indices.mch!.toFixed(1),
          mchc: indices.mchc!.toFixed(1),
        }));
        toast.success(`تم حساب المؤشرات: MCV=${indices.mcv.toFixed(1)}, MCH=${indices.mch.toFixed(1)}, MCHC=${indices.mchc.toFixed(1)}`);
      }
    } else {
      toast.warning('يرجى إدخال قيم صالحة لـ RBC و HGB و HCT أولاً');
    }
  };

  const handleSaveAndApply = async () => {
    try {
      setSaving(true);
      const serialized = serializeCbc(data);
      if (onSave) {
        await onSave(serialized, isAbnormal);
      }
      if (onApply) {
        onApply(serialized, data);
      }
      toast.success('تم حفظ وإدراج تقرير فحص الدم الكامل (CBC) بنجاح!', 'تم الحفظ');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ النتائج', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

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
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              <Droplets size={22} />
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
                {hasCriticalPanic ? (
                  <span style={{ fontSize: '11px', background: '#dc2626', color: '#ffffff', padding: '1px 8px', borderRadius: '4px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> PANIC CRITICAL
                  </span>
                ) : isAbnormal ? (
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
                Complete Blood Count (CBC) with 5-Part Differential • Model B Clinical Form
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
              onClick={handleAutoComputeIndices}
              style={{
                fontSize: '11.5px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid #0284c7',
                background: '#e0f2fe',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Calculator size={13} />
              <span>Auto MCV/MCH</span>
            </button>

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
              [Normal]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('ANEMIA')}
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
              [IDA Anemia]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('INFECTION')}
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
              [Leukocytosis]
            </button>

            <button
              type="button"
              onClick={() => applyPreset('PANCYTOPENIA')}
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
              [Pancytopenia]
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

        {/* Panic Alert Banner */}
        {hasCriticalPanic && (
          <div
            style={{
              background: '#dc2626',
              color: '#ffffff',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>
                تنبيه سريري فوري (Critical Panic Value): تم رصد قيم حرجة تستوجب إبلاغ الطبيب المعالج فوراً!
                {hgbPanic.isPanic && ` [Hb: ${data.hgb} g/dL < 6.0]`}
                {pltPanic.isPanic && ` [Plt: ${data.plt} x10^3 < 20]`}
                {wbcPanic.isPanic && ` [Wbc: ${data.wbc} x10^3 < 2.0]`}
              </span>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
              HIGH PRIORITY
            </span>
          </div>
        )}

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
                onClick={() => setActiveTab('ERYTHROID')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'ERYTHROID' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'ERYTHROID' ? '#ffffff' : 'transparent',
                  color: activeTab === 'ERYTHROID' ? '#dc2626' : '#64748b',
                  boxShadow: activeTab === 'ERYTHROID' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Droplets size={16} />
                <span>1. ERYTHROID & RBCs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('LEUKOCYTES')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'LEUKOCYTES' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'LEUKOCYTES' ? '#ffffff' : 'transparent',
                  color: activeTab === 'LEUKOCYTES' ? '#0284c7' : '#64748b',
                  boxShadow: activeTab === 'LEUKOCYTES' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Activity size={16} />
                <span>2. LEUKOCYTES & 5-PART DIFF</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PLATELETS')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'PLATELETS' ? 800 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'PLATELETS' ? '#ffffff' : 'transparent',
                  color: activeTab === 'PLATELETS' ? '#d97706' : '#64748b',
                  boxShadow: activeTab === 'PLATELETS' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Microscope size={16} />
                <span>3. PLATELETS & MORPHOLOGY</span>
              </button>
            </div>

            {/* TAB 1: ERYTHROID & RBC INDICES */}
            {activeTab === 'ERYTHROID' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Mentzer Index Diagnostic Banner */}
                {mentzer && (
                  <div
                    style={{
                      background: mentzer.interpretation.includes('Thalassemia') ? '#eff6ff' : '#fefce8',
                      border: `1px solid ${mentzer.interpretation.includes('Thalassemia') ? '#bfdbfe' : '#fef08a'}`,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Mentzer Index (MCV / RBC): </span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{mentzer.value}</strong>
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: mentzer.interpretation.includes('Thalassemia') ? '#1d4ed8' : '#854d0e' }}>
                      {mentzer.interpretation}
                    </span>
                  </div>
                )}

                {/* Primary RBC, HGB, HCT Trio */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                    Primary Erythroid Parameters (البارامترات الأساسية مع الحساب التلقائي):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        R.B.C (10^6/uL):
                      </label>
                      <input
                        type="text"
                        value={data.rbc}
                        onChange={(e) => handleErythroidChange('rbc', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0f172a',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 4.50 - 5.90</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        HGB (Hemoglobin g/dL):
                      </label>
                      <input
                        type="text"
                        value={data.hgb}
                        onChange={(e) => handleErythroidChange('hgb', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: hgbPanic.isPanic ? '2px solid #dc2626' : '1px solid #cbd5e1',
                          background: hgbPanic.isPanic ? '#fee2e2' : '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: hgbPanic.isPanic ? '#b91c1c' : '#0f172a',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 13.0 - 17.5</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        HCT / PCV (%):
                      </label>
                      <input
                        type="text"
                        value={data.hct}
                        onChange={(e) => handleErythroidChange('hct', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0f172a',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 40.0 - 52.0</span>
                    </div>
                  </div>
                </div>

                {/* Red Cell Calculated Indices (MCV, MCH, MCHC, RDW) */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Calculated Red Cell Indices (مؤشرات الكريات الحمر):
                    </span>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                      ✓ تحسب آلياً بناء على RBC/Hb/Hct
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        MCV (fL):
                      </label>
                      <input
                        type="text"
                        value={data.mcv}
                        onChange={(e) => setField('mcv', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          background: '#f8fafc',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 80 - 100</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        MCH (pg):
                      </label>
                      <input
                        type="text"
                        value={data.mch}
                        onChange={(e) => setField('mch', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          background: '#f8fafc',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 27 - 33</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        MCHC (g/dL):
                      </label>
                      <input
                        type="text"
                        value={data.mchc}
                        onChange={(e) => setField('mchc', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          background: '#f8fafc',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 32 - 36</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        RDW-CV (%):
                      </label>
                      <input
                        type="text"
                        value={data.rdw}
                        onChange={(e) => setField('rdw', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 11.5 - 14.5</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LEUKOCYTES & 5-PART DIFFERENTIAL */}
            {activeTab === 'LEUKOCYTES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Total WBC Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', display: 'block' }}>
                      Total Leukocyte Count (W.B.C):
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Reference Range: <strong style={{ color: '#0284c7' }}>4.0 - 11.0 x10^3/uL</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={data.wbc}
                      onChange={(e) => setField('wbc', e.target.value)}
                      style={{
                        width: '120px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: wbcPanic.isPanic ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        background: wbcPanic.isPanic ? '#fee2e2' : '#ffffff',
                        fontSize: '15px',
                        fontWeight: 900,
                        color: wbcPanic.isPanic ? '#b91c1c' : '#0f172a',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>10^3/uL</span>
                  </div>
                </div>

                {/* 5-Part Differential Form with Live Sum & Absolute Counts */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                        5-Part Differential Count (التفريق الخماسي):
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                        يتم حساب العدد المطلق (Abs. Count) تلقائياً لكل نوع
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>المجموع الكلي:</span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 900,
                          background: isDiffValid ? '#ecfdf5' : '#fef2f2',
                          color: isDiffValid ? '#047857' : '#b91c1c',
                          border: `1px solid ${isDiffValid ? '#a7f3d0' : '#fca5a5'}`,
                        }}
                      >
                        {diffSum}% {isDiffValid ? '✓ (متوازن)' : '⚠️ (يجب أن يساوي 100%)'}
                      </span>
                    </div>
                  </div>

                  {/* Differential 5 Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'neutrophils', label: 'Neutrophils (العدلات)', ref: '40 - 75%', val: data.neutrophils, abs: totalWbcNum > 0 ? ((totalWbcNum * neutVal) / 100).toFixed(2) : '0.00' },
                      { key: 'lymphocytes', label: 'Lymphocytes (اللمفاويات)', ref: '20 - 45%', val: data.lymphocytes, abs: totalWbcNum > 0 ? ((totalWbcNum * lymphVal) / 100).toFixed(2) : '0.00' },
                      { key: 'monocytes', label: 'Monocytes (وحيدات النواة)', ref: '2 - 10%', val: data.monocytes, abs: totalWbcNum > 0 ? ((totalWbcNum * monoVal) / 100).toFixed(2) : '0.00' },
                      { key: 'eosinophils', label: 'Eosinophils (الحمضيات)', ref: '1 - 6%', val: data.eosinophils, abs: totalWbcNum > 0 ? ((totalWbcNum * eosVal) / 100).toFixed(2) : '0.00' },
                      { key: 'basophils', label: 'Basophils (القعدات)', ref: '0 - 1%', val: data.basophils, abs: totalWbcNum > 0 ? ((totalWbcNum * basoVal) / 100).toFixed(2) : '0.00' },
                    ].map((row) => (
                      <div
                        key={row.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9',
                        }}
                      >
                        <div style={{ width: '220px' }}>
                          <strong style={{ fontSize: '12px', color: '#1e293b' }}>{row.label}</strong>
                          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Ref: {row.ref}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Abs: <strong style={{ color: '#0284c7' }}>{row.abs}</strong> x10^3
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={row.val}
                              onChange={(e) => setField(row.key as keyof CbcAnalysisData, e.target.value)}
                              style={{
                                width: '70px',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                fontWeight: 800,
                                textAlign: 'center',
                                background: '#ffffff',
                              }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PLATELETS & MORPHOLOGY */}
            {activeTab === 'PLATELETS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Platelets Indices */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                    Platelet Indices (مؤشرات الصفائح الدموية):
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        PLT (Platelets 10^3/uL):
                      </label>
                      <input
                        type="text"
                        value={data.plt}
                        onChange={(e) => setField('plt', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: pltPanic.isPanic ? '2px solid #dc2626' : '1px solid #cbd5e1',
                          background: pltPanic.isPanic ? '#fee2e2' : '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: pltPanic.isPanic ? '#b91c1c' : '#0f172a',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 150 - 450</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        MPV (Mean Vol fL):
                      </label>
                      <input
                        type="text"
                        value={data.mpv}
                        onChange={(e) => setField('mpv', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 7.4 - 10.4</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        PDW (Dist Width %):
                      </label>
                      <input
                        type="text"
                        value={data.pdw}
                        onChange={(e) => setField('pdw', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 9.0 - 17.0</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        PCT (Plateletcrit %):
                      </label>
                      <input
                        type="text"
                        value={data.pct}
                        onChange={(e) => setField('pct', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 700,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: 0.15 - 0.40</span>
                    </div>
                  </div>
                </div>

                {/* Morphology Pills & Textarea */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                    Blood Film Morphology (فحص اللطاخة والمجهري):
                  </div>

                  {/* Quick Pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {[
                      'Normocytic Normochromic',
                      'Microcytic Hypochromic',
                      'Macrocytic',
                      'Anisopoikilocytosis',
                      'Target Cells',
                      'Pencil Cells',
                      'Toxic Granulations',
                      'Hypochromia +',
                      'Thrombocytopenia',
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => {
                          if (!data.morphology || data.morphology.includes('Normocytic')) {
                            setField('morphology', pill);
                          } else if (!data.morphology.includes(pill)) {
                            setField('morphology', `${data.morphology}, ${pill}`);
                          }
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                        }}
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={data.morphology}
                    onChange={(e) => setField('morphology', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                    placeholder="وصف لطاخة الدم المحيطية..."
                  />
                </div>

                {/* Physician Remarks & Comments */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Clinical Remarks & Interpretation (ملاحظات الطبيب):
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setField('comments', 'Normal hematological profile.')}
                        style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        [Normal]
                      </button>
                      <button
                        type="button"
                        onClick={() => setField('comments', 'Picture suggestive of Iron Deficiency Anemia (IDA).')}
                        style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        [IDA]
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={data.comments}
                    onChange={(e) => setField('comments', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                    placeholder="اكتب التوصيات الطبية أو الملاحظات الاستشارية..."
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
                borderBottom: '2px solid #dc2626',
                paddingBottom: '10px',
                marginBottom: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    background: '#dc2626',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  A4 REPORT PREVIEW
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0 0' }}>
                  Complete Blood Count (CBC)
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Sample #{resolvedSampleNumber}
                </span>
              </div>
            </div>

            {/* Preview Tables */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
              {/* Section 1: Erythroid */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
                  ERYTHROID SERIES (RBCs)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>RBC:</td>
                      <td style={{ fontWeight: 700, color: rbcNum < 4.0 || rbcNum > 6.2 ? '#dc2626' : '#0f172a' }}>{data.rbc} 10^6</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>HGB:</td>
                      <td style={{ fontWeight: 800, color: parseFloat(data.hgb) < 12.0 ? '#dc2626' : '#0f172a' }}>{data.hgb} g/dL</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>HCT:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.hct} %</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>MCV:</td>
                      <td style={{ fontWeight: 700, color: parseFloat(data.mcv) < 80 ? '#dc2626' : '#0f172a' }}>{data.mcv} fL</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>MCH:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.mch} pg</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>MCHC:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.mchc} g/dL</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>RDW-CV:</td>
                      <td colSpan={3} style={{ fontWeight: 700, color: parseFloat(data.rdw) > 15 ? '#dc2626' : '#0f172a' }}>{data.rdw} %</td>
                    </tr>
                  </tbody>
                </table>
                {mentzer && (
                  <div style={{ fontSize: '10px', color: '#0369a1', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                    Mentzer: {mentzer.value} ({mentzer.interpretation})
                  </div>
                )}
              </div>

              {/* Section 2: Leukocytes & Differential */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>LEUKOCYTES & 5-PART DIFF</span>
                  <span style={{ color: isDiffValid ? '#047857' : '#dc2626' }}>Sum: {diffSum}%</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>Total WBC:</td>
                      <td colSpan={3} style={{ fontWeight: 800, color: totalWbcNum < 4.0 || totalWbcNum > 11.0 ? '#dc2626' : '#0f172a' }}>
                        {data.wbc} x10^3/uL
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '1px 0' }}>Neut:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.neutrophils}%</td>
                      <td style={{ color: '#64748b', padding: '1px 0' }}>Lymph:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.lymphocytes}%</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '1px 0' }}>Mono:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.monocytes}%</td>
                      <td style={{ color: '#64748b', padding: '1px 0' }}>Eos:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.eosinophils}%</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '1px 0' }}>Baso:</td>
                      <td colSpan={3} style={{ fontWeight: 700, color: '#0f172a' }}>{data.basophils}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Platelets */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
                  PLATELETS & INDICES
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>PLT:</td>
                      <td style={{ fontWeight: 800, color: parseFloat(data.plt) < 150 ? '#dc2626' : '#0f172a' }}>{data.plt} x10^3</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>MPV:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.mpv} fL</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>PDW:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.pdw} %</td>
                      <td style={{ color: '#64748b', padding: '2px 0' }}>PCT:</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{data.pct} %</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 4: Morphology & Comments */}
              {data.morphology && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px', fontSize: '10.5px' }}>
                  <strong>Morphology:</strong> {data.morphology}
                </div>
              )}
              {data.comments && (
                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px', fontSize: '10.5px', color: '#334155' }}>
                  <strong>Comments:</strong> {data.comments}
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
            {activeTab !== 'ERYTHROID' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'PLATELETS' ? 'LEUKOCYTES' : 'ERYTHROID')}
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
            {activeTab !== 'PLATELETS' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'ERYTHROID' ? 'LEUKOCYTES' : 'PLATELETS')}
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
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                padding: '0 28px',
                height: '40px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
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
