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
  FileText,
  Settings2,
  Eye,
  EyeOff,
  Sliders,
  Save,
  RotateCw
} from 'lucide-react';
import { useToast } from '../Toast';
import { 
  validateDifferentialSum, 
  calculateCbcIndices, 
  calculateMentzerIndex,
  evaluatePanicFlag
} from '../../lib/clinicalIntelligence';
import { toEnglishDigits } from '../../lib/formatters';
import {
  CbcDeviceId,
  CbcFieldMeta,
  CBC_DEVICE_PROFILES,
  getDeviceCbcFields,
  saveDeviceCbcCustomizations,
  resetDeviceCbcCustomizations,
  getActiveCbcFieldKeys,
  saveActiveCbcFieldKeys,
  getLastSelectedCbcDevice,
  saveLastSelectedCbcDevice,
} from '../../lib/cbcDeviceConfig';

export interface CbcAnalysisData {
  // Erythroid
  rbc: string;
  hgb: string;
  hct: string;
  mcv: string;
  mch: string;
  mchc: string;
  rdw: string;
  rdwSd?: string;

  // Platelets
  plt: string;
  mpv: string;
  pdw: string;
  pdwSd?: string;
  pct: string;
  plcr?: string;
  plcc?: string;

  // Leukocytes - Total
  wbc: string;

  // Leukocytes - 3-Part Differential
  graPct?: string;
  graAbs?: string;
  lymPct?: string;
  lymAbs?: string;
  midPct?: string;
  midAbs?: string;

  // Leukocytes - 5-Part Differential
  neutrophils: string;
  neutrophilsAbs?: string;
  lymphocytes: string;
  lymphocytesAbs?: string;
  monocytes: string;
  monocytesAbs?: string;
  eosinophils: string;
  eosinophilsAbs?: string;
  basophils: string;
  basophilsAbs?: string;

  // Morphology & Comments
  morphology: string;
  comments: string;
}

export const EMPTY_CBC_DATA: CbcAnalysisData = {
  rbc: '',
  hgb: '',
  hct: '',
  mcv: '',
  mch: '',
  mchc: '',
  rdw: '',
  rdwSd: '',
  plt: '',
  mpv: '',
  pdw: '',
  pdwSd: '',
  pct: '',
  plcr: '',
  plcc: '',
  wbc: '',
  graPct: '',
  graAbs: '',
  lymPct: '',
  lymAbs: '',
  midPct: '',
  midAbs: '',
  neutrophils: '',
  neutrophilsAbs: '',
  lymphocytes: '',
  lymphocytesAbs: '',
  monocytes: '',
  monocytesAbs: '',
  eosinophils: '',
  eosinophilsAbs: '',
  basophils: '',
  basophilsAbs: '',
  morphology: '',
  comments: '',
};

export const DEFAULT_CBC_DATA: CbcAnalysisData = {
  rbc: '4.80',
  hgb: '14.5',
  hct: '43.5',
  mcv: '90.6',
  mch: '30.2',
  mchc: '33.3',
  rdw: '12.5',
  rdwSd: '42.0',
  plt: '250',
  mpv: '9.8',
  pdw: '11.2',
  pdwSd: '12.5',
  pct: '0.245',
  plcr: '22.0',
  plcc: '55.0',
  wbc: '7.2',
  graPct: '60.0',
  graAbs: '4.32',
  lymPct: '30.0',
  lymAbs: '2.16',
  midPct: '10.0',
  midAbs: '0.72',
  neutrophils: '60.0',
  neutrophilsAbs: '4.32',
  lymphocytes: '30.0',
  lymphocytesAbs: '2.16',
  monocytes: '6.0',
  monocytesAbs: '0.43',
  eosinophils: '3.0',
  eosinophilsAbs: '0.22',
  basophils: '1.0',
  basophilsAbs: '0.07',
  morphology: 'Normocytic Normochromic red blood cells. Normal leukocyte and platelet morphology.',
  comments: 'Normal hematological profile.'
};

export function serializeCbc(data: CbcAnalysisData, deviceId: CbcDeviceId = 'MINDRAY_5PART'): string {
  const parts: string[] = [
    '[CBC - COMPLETE BLOOD COUNT & 5-PART DIFFERENTIAL]',
    `DEVICE: ${deviceId}`,
  ];

  const hasRbc = !!(data.rbc || data.hgb || data.hct || data.mcv || data.mch || data.mchc || data.rdw || data.rdwSd);
  if (hasRbc) {
    const rdwSdPart = data.rdwSd ? ` | RDW-SD: ${data.rdwSd} fL` : '';
    parts.push(`ERYTHROID: RBC: ${data.rbc || '-'} 10^6/uL | HGB: ${data.hgb || '-'} g/dL | HCT: ${data.hct || '-'} % | MCV: ${data.mcv || '-'} fL | MCH: ${data.mch || '-'} pg | MCHC: ${data.mchc || '-'} g/dL | RDW: ${data.rdw || '-'} %${rdwSdPart}`);
  }

  const hasPlt = !!(data.plt || data.mpv || data.pdw || data.pdwSd || data.pct || data.plcr || data.plcc);
  if (hasPlt) {
    const pdwSdPart = data.pdwSd ? ` | PDW-SD: ${data.pdwSd} fL` : '';
    const plcrPart = data.plcr ? ` | P-LCR: ${data.plcr} %` : '';
    const plccPart = data.plcc ? ` | P-LCC: ${data.plcc} 10^3/uL` : '';
    parts.push(`PLATELETS: PLT: ${data.plt || '-'} 10^3/uL | MPV: ${data.mpv || '-'} fL | PDW: ${data.pdw || '-'} % | PCT: ${data.pct || '-'} %${pdwSdPart}${plcrPart}${plccPart}`);
  }

  const hasWbc = !!data.wbc;
  if (hasWbc) {
    parts.push(`LEUKOCYTES: Total WBC: ${data.wbc} 10^3/uL`);
  }

  // 3-Part Differential if present
  const has3Part = !!(data.graPct || data.lymPct || data.midPct || data.graAbs || data.lymAbs || data.midAbs);
  if (has3Part) {
    const graP = data.graPct || '-';
    const graA = data.graAbs || '-';
    const lymP = data.lymPct || '-';
    const lymA = data.lymAbs || '-';
    const midP = data.midPct || '-';
    const midA = data.midAbs || '-';
    parts.push(`DIFFERENTIAL_3PART: GRA%: ${graP} % | GRA#: ${graA} 10^3/uL | LYM%: ${lymP} % | LYM#: ${lymA} 10^3/uL | MID%: ${midP} % | MID#: ${midA} 10^3/uL`);
  }

  // 5-Part Relative Percentages
  const has5Part = !!(data.neutrophils || data.lymphocytes || data.monocytes || data.eosinophils || data.basophils);
  if (has5Part) {
    const n = parseFloat(data.neutrophils) || 0;
    const l = parseFloat(data.lymphocytes) || 0;
    const m = parseFloat(data.monocytes) || 0;
    const e = parseFloat(data.eosinophils) || 0;
    const b = parseFloat(data.basophils) || 0;
    const diffSum = Math.round((n + l + m + e + b) * 10) / 10;
    parts.push(`DIFFERENTIAL: Neut: ${data.neutrophils || '-'}% | Lymph: ${data.lymphocytes || '-'}% | Mono: ${data.monocytes || '-'}% | Eos: ${data.eosinophils || '-'}% | Baso: ${data.basophils || '-'}% (Sum: ${diffSum}%)`);

    // 5-Part Absolute Counts
    const wbcVal = parseFloat(data.wbc) || 0;
    const nAbs = data.neutrophilsAbs || (wbcVal > 0 && n > 0 ? ((wbcVal * n) / 100).toFixed(2) : '-');
    const lAbs = data.lymphocytesAbs || (wbcVal > 0 && l > 0 ? ((wbcVal * l) / 100).toFixed(2) : '-');
    const mAbs = data.monocytesAbs || (wbcVal > 0 && m > 0 ? ((wbcVal * m) / 100).toFixed(2) : '-');
    const eAbs = data.eosinophilsAbs || (wbcVal > 0 && e > 0 ? ((wbcVal * e) / 100).toFixed(2) : '-');
    const bAbs = data.basophilsAbs || (wbcVal > 0 && b > 0 ? ((wbcVal * b) / 100).toFixed(2) : '-');
    parts.push(`DIFFERENTIAL_ABS: Neut#: ${nAbs} | Lymph#: ${lAbs} | Mono#: ${mAbs} | Eos#: ${eAbs} | Baso#: ${bAbs}`);
  }

  // Diagnostic Indices
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

  // NLR and PLR Ratios
  const wbcVal = parseFloat(data.wbc) || 0;
  const nVal = parseFloat(data.neutrophils) || parseFloat(data.graPct || '0') || 0;
  const lVal = parseFloat(data.lymphocytes) || parseFloat(data.lymPct || '0') || 0;
  const pltNum = parseFloat(data.plt);
  if (wbcVal > 0 && nVal > 0 && lVal > 0) {
    const nAbsNum = (wbcVal * nVal) / 100;
    const lAbsNum = (wbcVal * lVal) / 100;
    if (lAbsNum > 0) {
      parts.push(`INDICES: NLR: ${(nAbsNum / lAbsNum).toFixed(2)}`);
    }
    if (pltNum > 0 && lAbsNum > 0) {
      parts.push(`INDICES: PLR: ${(pltNum / lAbsNum).toFixed(1)}`);
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

export function parseCbcDevice(raw: string): CbcDeviceId | null {
  if (!raw) return null;
  const m = raw.match(/DEVICE:\s*([A-Za-z0-9_]+)/i);
  if (m && CBC_DEVICE_PROFILES[m[1] as CbcDeviceId]) {
    return m[1] as CbcDeviceId;
  }
  return null;
}

export function parseCbc(raw: string): CbcAnalysisData {
  if (!raw || !raw.includes('CBC')) return { ...EMPTY_CBC_DATA };

  const parsed = { ...EMPTY_CBC_DATA };
  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('ERYTHROID:')) {
      const rbcM = trimmed.match(/RBC:\s*([^\s|]+)/i);
      if (rbcM && rbcM[1] !== '-') parsed.rbc = rbcM[1];
      const hgbM = trimmed.match(/HGB:\s*([^\s|]+)/i);
      if (hgbM && hgbM[1] !== '-') parsed.hgb = hgbM[1];
      const hctM = trimmed.match(/HCT:\s*([^\s|]+)/i);
      if (hctM && hctM[1] !== '-') parsed.hct = hctM[1];
      const mcvM = trimmed.match(/MCV:\s*([^\s|]+)/i);
      if (mcvM && mcvM[1] !== '-') parsed.mcv = mcvM[1];
      const mchM = trimmed.match(/MCH:\s*([^\s|]+)/i);
      if (mchM && mchM[1] !== '-') parsed.mch = mchM[1];
      const mchcM = trimmed.match(/MCHC:\s*([^\s|]+)/i);
      if (mchcM && mchcM[1] !== '-') parsed.mchc = mchcM[1];
      const rdwM = trimmed.match(/RDW(?:%|_CV|-CV)?:\s*([^\s|]+)/i);
      if (rdwM && rdwM[1] !== '-') parsed.rdw = rdwM[1];
      const rdwSdM = trimmed.match(/(?:RDWa|RDW-SD|RDW_SD):\s*([^\s|]+)/i);
      if (rdwSdM && rdwSdM[1] !== '-') parsed.rdwSd = rdwSdM[1];
    } else if (upper.startsWith('PLATELETS:')) {
      const pltM = trimmed.match(/PLT:\s*([^\s|]+)/i);
      if (pltM && pltM[1] !== '-') parsed.plt = pltM[1];
      const mpvM = trimmed.match(/MPV:\s*([^\s|]+)/i);
      if (mpvM && mpvM[1] !== '-') parsed.mpv = mpvM[1];
      const pdwM = trimmed.match(/PDW(?:%|_CV|-CV)?:\s*([^\s|]+)/i);
      if (pdwM && pdwM[1] !== '-') parsed.pdw = pdwM[1];
      const pdwSdM = trimmed.match(/(?:PDWa|PDW-SD|PDW_SD):\s*([^\s|]+)/i);
      if (pdwSdM && pdwSdM[1] !== '-') parsed.pdwSd = pdwSdM[1];
      const pctM = trimmed.match(/PCT:\s*([^\s|]+)/i);
      if (pctM && pctM[1] !== '-') parsed.pct = pctM[1];
      const plcrM = trimmed.match(/(?:P-LCR|PLCR):\s*([^\s|]+)/i);
      if (plcrM && plcrM[1] !== '-') parsed.plcr = plcrM[1];
      const plccM = trimmed.match(/(?:P-LCC|PLCC):\s*([^\s|]+)/i);
      if (plccM && plccM[1] !== '-') parsed.plcc = plccM[1];
    } else if (upper.startsWith('LEUKOCYTES:')) {
      const wbcM = trimmed.match(/WBC:\s*([^\s|]+)/i);
      if (wbcM && wbcM[1] !== '-') parsed.wbc = wbcM[1];
    } else if (upper.startsWith('DIFFERENTIAL_3PART:') || upper.startsWith('3PART:')) {
      const graPctM = trimmed.match(/GRA%:\s*([^\s%|]+)/i);
      if (graPctM && graPctM[1] !== '-') parsed.graPct = graPctM[1];
      const graAbsM = trimmed.match(/GRA#?:\s*([^\s|]+)/i);
      if (graAbsM && graAbsM[1] !== '-') parsed.graAbs = graAbsM[1];
      const lymPctM = trimmed.match(/LYM%:\s*([^\s%|]+)/i);
      if (lymPctM && lymPctM[1] !== '-') parsed.lymPct = lymPctM[1];
      const lymAbsM = trimmed.match(/LYM#?:\s*([^\s|]+)/i);
      if (lymAbsM && lymAbsM[1] !== '-') parsed.lymAbs = lymAbsM[1];
      const midPctM = trimmed.match(/MID%:\s*([^\s%|]+)/i);
      if (midPctM && midPctM[1] !== '-') parsed.midPct = midPctM[1];
      const midAbsM = trimmed.match(/MID#?:\s*([^\s|]+)/i);
      if (midAbsM && midAbsM[1] !== '-') parsed.midAbs = midAbsM[1];
    } else if (upper.startsWith('DIFFERENTIAL:')) {
      const neutM = trimmed.match(/Neut:\s*([^\s%|]+)/i);
      if (neutM && neutM[1] !== '-') parsed.neutrophils = neutM[1];
      const lymphM = trimmed.match(/Lymph:\s*([^\s%|]+)/i);
      if (lymphM && lymphM[1] !== '-') parsed.lymphocytes = lymphM[1];
      const monoM = trimmed.match(/Mono:\s*([^\s%|]+)/i);
      if (monoM && monoM[1] !== '-') parsed.monocytes = monoM[1];
      const eosM = trimmed.match(/Eos:\s*([^\s%|]+)/i);
      if (eosM && eosM[1] !== '-') parsed.eosinophils = eosM[1];
      const basoM = trimmed.match(/Baso:\s*([^\s%|]+)/i);
      if (basoM && basoM[1] !== '-') parsed.basophils = basoM[1];
    } else if (upper.startsWith('DIFFERENTIAL_ABS:')) {
      const nAbsM = trimmed.match(/Neut#?:\s*([^\s|]+)/i);
      if (nAbsM && nAbsM[1] !== '-') parsed.neutrophilsAbs = nAbsM[1];
      const lAbsM = trimmed.match(/Lymph#?:\s*([^\s|]+)/i);
      if (lAbsM && lAbsM[1] !== '-') parsed.lymphocytesAbs = lAbsM[1];
      const mAbsM = trimmed.match(/Mono#?:\s*([^\s|]+)/i);
      if (mAbsM && mAbsM[1] !== '-') parsed.monocytesAbs = mAbsM[1];
      const eAbsM = trimmed.match(/Eos#?:\s*([^\s|]+)/i);
      if (eAbsM && eAbsM[1] !== '-') parsed.eosinophilsAbs = eAbsM[1];
      const bAbsM = trimmed.match(/Baso#?:\s*([^\s|]+)/i);
      if (bAbsM && bAbsM[1] !== '-') parsed.basophilsAbs = bAbsM[1];
    } else if (upper.startsWith('MORPHOLOGY:')) {
      parsed.morphology = trimmed.replace(/MORPHOLOGY:/i, '').trim();
    } else if (upper.startsWith('COMMENTS:') || upper.startsWith('COMMENT:')) {
      parsed.comments = trimmed.replace(/COMMENTS?:/i, '').trim();
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
  const [data, setData] = useState<CbcAnalysisData>(EMPTY_CBC_DATA);
  const [saving, setSaving] = useState(false);
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');
  const [diffMode, setDiffMode] = useState<'5PART' | '3PART'>('5PART');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Device & Dynamic Field Customization States
  const [selectedDevice, setSelectedDevice] = useState<CbcDeviceId>('SWELAB_3PART');
  const [deviceFields, setDeviceFields] = useState<CbcFieldMeta[]>(() => getDeviceCbcFields('SWELAB_3PART'));
  const [activeFieldKeys, setActiveFieldKeys] = useState<string[]>(() => getActiveCbcFieldKeys('SWELAB_3PART'));
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerFields, setCustomizerFields] = useState<CbcFieldMeta[]>([]);

  const resolvedPatientName = patientName || sample?.patient?.name || 'مريض غير محدد';
  const resolvedSampleNumber = sampleNumber || sample?.sampleNumber || sample?.id || '---';

  useEffect(() => {
    if (isOpen) {
      const storedDev = getLastSelectedCbcDevice();
      let devToUse: CbcDeviceId = storedDev;
      if (initialValue && initialValue.includes('CBC')) {
        const detected = parseCbcDevice(initialValue);
        if (detected) devToUse = detected;
        setData(parseCbc(initialValue));
      } else {
        // Clean empty form for new sample!
        setData({ ...EMPTY_CBC_DATA });
      }
      setSelectedDevice(devToUse);
      const fields = getDeviceCbcFields(devToUse);
      setDeviceFields(fields);
      setActiveFieldKeys(getActiveCbcFieldKeys(devToUse));
      const profile = CBC_DEVICE_PROFILES[devToUse];
      setDiffMode(profile?.is3Part ? '3PART' : '5PART');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSelectDevice = (newDev: CbcDeviceId) => {
    setSelectedDevice(newDev);
    saveLastSelectedCbcDevice(newDev);
    const fields = getDeviceCbcFields(newDev);
    setDeviceFields(fields);
    setActiveFieldKeys(getActiveCbcFieldKeys(newDev));
    const profile = CBC_DEVICE_PROFILES[newDev];
    setDiffMode(profile?.is3Part ? '3PART' : '5PART');
    toast.success(`تم تبديل ملف الجهاز إلى: ${profile?.name || newDev}`, 'تم تغيير الجهاز');
  };

  const toggleFieldActive = (fieldKey: string) => {
    const nextKeys = activeFieldKeys.includes(fieldKey)
      ? activeFieldKeys.filter((k) => k !== fieldKey)
      : [...activeFieldKeys, fieldKey];
    setActiveFieldKeys(nextKeys);
    saveActiveCbcFieldKeys(selectedDevice, nextKeys);
  };

  const handleSelectAllFields = () => {
    const allKeys = deviceFields.map((f) => f.key);
    setActiveFieldKeys(allKeys);
    saveActiveCbcFieldKeys(selectedDevice, allKeys);
    toast.success('تم تفعيل جميع الحقول لهذا الجهاز', 'إظهار الكل');
  };

  const handleSelectEssentialOnly = () => {
    const essentials = ['rbc', 'hgb', 'hct', 'plt', 'wbc'];
    setActiveFieldKeys(essentials);
    saveActiveCbcFieldKeys(selectedDevice, essentials);
    toast.info('تم حصر الفورمة بالمعاملات الأساسية فقط', 'فحص أساسي');
  };

  const handleHideWbcAndDiff = () => {
    const nextKeys = activeFieldKeys.filter(
      (k) =>
        ![
          'wbc', 'graPct', 'graAbs', 'lymPct', 'lymAbs', 'midPct', 'midAbs',
          'neutrophils', 'neutrophilsAbs', 'lymphocytes', 'lymphocytesAbs',
          'monocytes', 'monocytesAbs', 'eosinophils', 'eosinophilsAbs', 'basophils', 'basophilsAbs'
        ].includes(k)
    );
    setActiveFieldKeys(nextKeys);
    saveActiveCbcFieldKeys(selectedDevice, nextKeys);
    toast.warning('تم استبعاد كريات الدم البيض والتفريق من الفورمة والطباعة بنجاح', 'استبعاد WBC');
  };

  const handleResetActiveFields = () => {
    const defKeys = CBC_DEVICE_PROFILES[selectedDevice]?.defaultActiveFieldKeys || deviceFields.map((f) => f.key);
    setActiveFieldKeys(defKeys);
    saveActiveCbcFieldKeys(selectedDevice, defKeys);
    toast.info('تمت استعادة حقول الجهاز الافتراضية', 'استعادة');
  };

  const openCustomizer = () => {
    setCustomizerFields(JSON.parse(JSON.stringify(deviceFields)));
    setShowCustomizer(true);
  };

  const handleSaveCustomizer = () => {
    const customMap: Record<string, Partial<CbcFieldMeta>> = {};
    for (const f of customizerFields) {
      customMap[f.key] = {
        name: f.label || f.name,
        label: f.label || f.name,
        arabicName: f.labelAr || f.arabicName,
        labelAr: f.labelAr || f.arabicName,
        unit: f.unit,
        refMin: f.refMin,
        refMax: f.refMax,
      };
    }
    saveDeviceCbcCustomizations(selectedDevice, customMap);
    setDeviceFields(customizerFields);
    setShowCustomizer(false);
    toast.success('تم حفظ التعديلات والمديات الخاصة بالجهاز بنجاح ومزامنتها دائمياً!', 'تم الحفظ');
  };

  const handleResetCustomizer = () => {
    resetDeviceCbcCustomizations(selectedDevice);
    const fresh = getDeviceCbcFields(selectedDevice);
    setDeviceFields(fresh);
    setCustomizerFields(JSON.parse(JSON.stringify(fresh)));
    toast.info('تمت استعادة المديات والتسميات الافتراضية للجهاز', 'استعادة الافتراضي');
  };

  const isFieldActive = (fieldKey: string): boolean => {
    return activeFieldKeys.includes(fieldKey);
  };

  const getFieldMeta = (fieldKey: string): CbcFieldMeta | undefined => {
    return deviceFields.find((f) => f.key === fieldKey);
  };

  // Safe Keystroke for Erythroid Indices (Auto-fill only if indices are empty)
  const handleErythroidChange = (field: 'rbc' | 'hgb' | 'hct', val: string) => {
    const nextData = { ...data, [field]: val };
    const rbcNum = parseFloat(field === 'rbc' ? val : data.rbc);
    const hgbNum = parseFloat(field === 'hgb' ? val : data.hgb);
    const hctNum = parseFloat(field === 'hct' ? val : data.hct);

    if (rbcNum > 0 && hctNum > 0 && hgbNum > 0) {
      if (!nextData.mcv) nextData.mcv = ((hctNum * 10) / rbcNum).toFixed(1);
      if (!nextData.mch) nextData.mch = ((hgbNum * 10) / rbcNum).toFixed(1);
      if (!nextData.mchc) nextData.mchc = ((hgbNum * 100) / hctNum).toFixed(1);
    }
    setData(nextData);
  };

  const setField = (field: keyof CbcAnalysisData, value: string) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      const wbcNum = parseFloat(field === 'wbc' ? value : prev.wbc) || 0;

      // Sync 3-Part and 5-Part values
      if (field === 'graPct') {
        next.neutrophils = value;
        if (wbcNum > 0 && parseFloat(value) >= 0) {
          const abs = ((wbcNum * parseFloat(value)) / 100).toFixed(2);
          next.graAbs = abs;
          next.neutrophilsAbs = abs;
        }
      } else if (field === 'lymPct') {
        next.lymphocytes = value;
        if (wbcNum > 0 && parseFloat(value) >= 0) {
          const abs = ((wbcNum * parseFloat(value)) / 100).toFixed(2);
          next.lymAbs = abs;
          next.lymphocytesAbs = abs;
        }
      } else if (field === 'midPct') {
        next.monocytes = value;
        if (wbcNum > 0 && parseFloat(value) >= 0) {
          const abs = ((wbcNum * parseFloat(value)) / 100).toFixed(2);
          next.midAbs = abs;
          next.monocytesAbs = abs;
        }
      } else if (field === 'neutrophils') {
        next.graPct = value;
        if (wbcNum > 0 && parseFloat(value) >= 0) {
          const abs = ((wbcNum * parseFloat(value)) / 100).toFixed(2);
          next.neutrophilsAbs = abs;
          next.graAbs = abs;
        }
      } else if (field === 'lymphocytes') {
        next.lymPct = value;
        if (wbcNum > 0 && parseFloat(value) >= 0) {
          const abs = ((wbcNum * parseFloat(value)) / 100).toFixed(2);
          next.lymphocytesAbs = abs;
          next.lymAbs = abs;
        }
      } else if (field === 'wbc') {
        if (wbcNum > 0) {
          if (next.graPct) next.graAbs = ((wbcNum * (parseFloat(next.graPct) || 0)) / 100).toFixed(2);
          if (next.lymPct) next.lymAbs = ((wbcNum * (parseFloat(next.lymPct) || 0)) / 100).toFixed(2);
          if (next.midPct) next.midAbs = ((wbcNum * (parseFloat(next.midPct) || 0)) / 100).toFixed(2);
          if (next.neutrophils) next.neutrophilsAbs = ((wbcNum * (parseFloat(next.neutrophils) || 0)) / 100).toFixed(2);
          if (next.lymphocytes) next.lymphocytesAbs = ((wbcNum * (parseFloat(next.lymphocytes) || 0)) / 100).toFixed(2);
          if (next.monocytes) next.monocytesAbs = ((wbcNum * (parseFloat(next.monocytes) || 0)) / 100).toFixed(2);
          if (next.eosinophils) next.eosinophilsAbs = ((wbcNum * (parseFloat(next.eosinophils) || 0)) / 100).toFixed(2);
          if (next.basophils) next.basophilsAbs = ((wbcNum * (parseFloat(next.basophils) || 0)) / 100).toFixed(2);
        }
      }
      return next;
    });
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

  const applyPreset = (presetName: 'NORMAL' | 'ANEMIA' | 'INFECTION' | 'PANCYTOPENIA' | 'SWELAB_SAMPLE') => {
    if (presetName === 'SWELAB_SAMPLE') {
      setData({
        rbc: '4.22',
        hgb: '10.6',
        hct: '27.1',
        mcv: '64.1',
        mch: '25.1',
        mchc: '39.1',
        rdw: '13.0',
        rdwSd: '42.1',
        plt: '241',
        mpv: '7.6',
        pdw: '40.0',
        pdwSd: '10.2',
        pct: '0.18',
        plcr: '12.9',
        plcc: '31',
        wbc: '7.5',
        graPct: '66.9',
        graAbs: '5.1',
        lymPct: '28.3',
        lymAbs: '2.1',
        midPct: '4.8',
        midAbs: '0.3',
        neutrophils: '66.9',
        neutrophilsAbs: '5.1',
        lymphocytes: '28.3',
        lymphocytesAbs: '2.1',
        monocytes: '4.8',
        monocytesAbs: '0.3',
        eosinophils: '0.0',
        basophils: '0.0',
        morphology: 'Microcytic hypochromic red blood cells. Normal leukocyte and platelet distribution on smear.',
        comments: 'Swelab Alfa 3-Part automated analyzer run matching printed slip.',
      });
      setDiffMode('3PART');
      toast.success('تم تطبيق نتيجة جهاز سوي لاب (Swelab Alfa Slip) بنجاح!', 'نموذج مطابق');
    } else if (presetName === 'NORMAL') {
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

  const handleApplyQuickPaste = (text: string) => {
    if (!text.trim()) return;
    const clean = toEnglishDigits(text);
    const next = { ...data };

    const matchVal = (regex: RegExp) => {
      const m = clean.match(regex);
      return m ? m[1].trim() : null;
    };

    const wbc = matchVal(/\b(?:WBC|WHITE\s*BLOOD\s*CELLS?)\b[:\s=]+([0-9.]+)/i);
    if (wbc) next.wbc = wbc;

    const rbc = matchVal(/\b(?:RBC|RED\s*BLOOD\s*CELLS?)\b[:\s=]+([0-9.]+)/i);
    if (rbc) next.rbc = rbc;

    const hgb = matchVal(/\b(?:HGB|HB|HEMOGLOBIN)\b[:\s=]+([0-9.]+)/i);
    if (hgb) next.hgb = hgb;

    const hct = matchVal(/\b(?:HCT|PCV|HEMATOCRIT)\b[:\s=]+([0-9.]+)/i);
    if (hct) next.hct = hct;

    const mcv = matchVal(/\b(?:MCV)\b[:\s=]+([0-9.]+)/i);
    if (mcv) next.mcv = mcv;

    const mch = matchVal(/\b(?:MCH)\b[:\s=]+([0-9.]+)/i);
    if (mch) next.mch = mch;

    const mchc = matchVal(/\b(?:MCHC)\b[:\s=]+([0-9.]+)/i);
    if (mchc) next.mchc = mchc;

    const rdw = matchVal(/\b(?:RDW(?:%|_CV|-CV)?)\b[:\s=]+([0-9.]+)/i);
    if (rdw) next.rdw = rdw;

    // Support Swelab, Mindray & Sysmex syntax with flags & asterisks
    const rdwSd = matchVal(/\b(?:RDW-SD|RDWa|RDW_SD)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bRDWa[*"]*\s+([0-9.]+)/i);
    if (rdwSd) next.rdwSd = rdwSd;

    const plt = matchVal(/\b(?:PLT|PLATELETS?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (plt) next.plt = plt;

    const mpv = matchVal(/\b(?:MPV)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (mpv) next.mpv = mpv;

    const pdw = matchVal(/\b(?:PDW(?:%|_CV|-CV)?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (pdw) next.pdw = pdw;

    const pdwSd = matchVal(/\b(?:PDW-SD|PDWa|PDW_SD)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bPDWa[*"]*\s+([0-9.]+)/i);
    if (pdwSd) next.pdwSd = pdwSd;

    const pct = matchVal(/\b(?:PCT)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (pct) next.pct = pct;

    const plcr = matchVal(/\b(?:P-LCR|PLCR)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (plcr) next.plcr = plcr;

    const plcc = matchVal(/\b(?:P-LCC|PLCC)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (plcc) next.plcc = plcc;

    // 3-Part Differential (Swelab / Mindray / Sysmex)
    const graPct = matchVal(/\b(?:GRA%|GRAN%)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bGRA%\s+([0-9.]+)/i);
    if (graPct) { next.graPct = graPct; next.neutrophils = graPct; }

    const graAbs = matchVal(/\b(?:GRA#?|GRAN#?)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bGRA\s+([0-9.]+)/i);
    if (graAbs) { next.graAbs = graAbs; next.neutrophilsAbs = graAbs; }

    const lymPct = matchVal(/\b(?:LYM%|LYMPH%)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bLYM%\s+([0-9.]+)/i);
    if (lymPct) { next.lymPct = lymPct; next.lymphocytes = lymPct; }

    const lymAbs = matchVal(/\b(?:LYM#?|LYMPH#?)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bLYM\s+([0-9.]+)/i);
    if (lymAbs) { next.lymAbs = lymAbs; next.lymphocytesAbs = lymAbs; }

    const midPct = matchVal(/\b(?:MID%|MXD%|MONO%)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bMID%\s+([0-9.]+)/i);
    if (midPct) { next.midPct = midPct; next.monocytes = midPct; }

    const midAbs = matchVal(/\b(?:MID#?|MXD#?|MONO#?)[*"]*\b[:\s=]+([0-9.]+)/i) || matchVal(/\bMID\s+([0-9.]+)/i);
    if (midAbs) { next.midAbs = midAbs; next.monocytesAbs = midAbs; }

    // 5-Part Differential
    const neut = matchVal(/\b(?:NEUT%?|NEUTROPHILS?%?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (neut) next.neutrophils = neut;

    const lymph = matchVal(/\b(?:LYMPHOCYTES?%?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (lymph) next.lymphocytes = lymph;

    const mono = matchVal(/\b(?:MONOCYTES?%?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (mono) next.monocytes = mono;

    const eos = matchVal(/\b(?:EOS%?|EOSINOPHILS?%?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (eos) next.eosinophils = eos;

    const baso = matchVal(/\b(?:BASO%?|BASOPHILS?%?)[*"]*\b[:\s=]+([0-9.]+)/i);
    if (baso) next.basophils = baso;

    setData(next);
    setShowQuickPaste(false);
    setQuickPasteText('');
    toast.success('تم استخراج وتوزيع نتائج جهاز الدم بنجاح!', 'استيراد سريع');
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

  const handleClearForm = () => {
    setData({ ...EMPTY_CBC_DATA });
    toast.info('تم تفريغ حقول الفورمة بالكامل وجاهزة لإدخال فحص جديد', 'تفريغ الحقول');
  };

  const handleSaveAndApply = async () => {
    try {
      setSaving(true);
      const serialized = serializeCbc(data, selectedDevice);
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

  const activeDeviceProfile = CBC_DEVICE_PROFILES[selectedDevice] || CBC_DEVICE_PROFILES.CUSTOM_CBC;

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
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1280px',
          maxHeight: '96vh',
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
          dir="ltr"
          style={{
            direction: 'ltr',
            padding: '12px 20px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Row 1: Patient details & Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
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
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {resolvedPatientName}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'var(--bg-input)',
                      color: 'var(--text-muted)',
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
                  Complete Blood Count (CBC) • {activeDeviceProfile.name} • مخصص وقابل للتهيئة الفورية
                </div>
              </div>
            </div>

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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Row 2: Device Selection & Toolbar Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '6px',
              borderTop: '1px dashed var(--border-color)',
            }}
          >
            {/* Left Controls: Device selector, Field Picker toggle, Customizer button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
                  🎛️ نوع الجهاز:
                </span>
                <select
                  value={selectedDevice}
                  onChange={(e) => handleSelectDevice(e.target.value as CbcDeviceId)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    border: '1px solid #0284c7',
                    background: '#f0f9ff',
                    color: '#0369a1',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="SWELAB_3PART">🔬 Swelab Alfa (3-Part)</option>
                  <option value="MINDRAY_3PART">🔬 Mindray BC-3000 Plus (3-Part)</option>
                  <option value="MINDRAY_5PART">🔬 Mindray BC-5000 (5-Part)</option>
                  <option value="SYSMEX_3PART">🔬 Sysmex KX-21N (3-Part)</option>
                  <option value="CUSTOM_CBC">⚙️ ملف فحص مخصص (Custom)</option>
                </select>
              </div>

              {/* Field Visibility Picker Toggle */}
              <button
                type="button"
                onClick={() => setShowFieldPicker(!showFieldPicker)}
                style={{
                  fontSize: '11.5px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: showFieldPicker ? '1px solid #2563eb' : '1px solid var(--border-color)',
                  background: showFieldPicker ? '#eff6ff' : 'var(--bg-input)',
                  color: showFieldPicker ? '#1d4ed8' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Sliders size={13} />
                <span>اختيار الحقول الظاهرة ({activeFieldKeys.length}/{deviceFields.length})</span>
              </button>

              {/* Inline Customizer Modal Trigger */}
              <button
                type="button"
                onClick={openCustomizer}
                title="تعديل الأسماء والمديات الطبيعية لهذا الجهاز وحفظها دائماً"
                style={{
                  fontSize: '11.5px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: '1px solid #d97706',
                  background: '#fef3c7',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Settings2 size={13} />
                <span>تخصيص الأسماء والمديات</span>
              </button>

              {/* Clear / Empty Form Button */}
              <button
                type="button"
                onClick={handleClearForm}
                title="تفريغ كافة الحقول لإدخال عينة جديدة فارغة ونظيفة"
                style={{
                  fontSize: '11px',
                  padding: '5px 8px',
                  borderRadius: '7px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={12} />
                <span>تفريغ الفورمة</span>
              </button>
            </div>

            {/* Right Controls: Presets & Tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowQuickPaste(true)}
                style={{
                  fontSize: '11px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: '1px solid #7c3aed',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>📋 لصق محلل</span>
              </button>
              <button
                type="button"
                onClick={handleAutoComputeIndices}
                style={{
                  fontSize: '11px',
                  padding: '5px 8px',
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
                <Calculator size={12} />
                <span>Auto MCV</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('SWELAB_SAMPLE')}
                style={{
                  fontSize: '11px',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: '1px solid #0284c7',
                  background: '#f0f9ff',
                  color: '#0369a1',
                }}
              >
                [سوي لاب]
              </button>

              <button
                type="button"
                onClick={() => applyPreset('NORMAL')}
                style={{
                  fontSize: '11px',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: '1px solid #10b981',
                  background: '#ecfdf5',
                  color: '#047857',
                }}
              >
                [طبيعي]
              </button>

              <button
                type="button"
                onClick={() => applyPreset('ANEMIA')}
                style={{
                  fontSize: '11px',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: '1px solid #f59e0b',
                  background: '#fffbeb',
                  color: '#b45309',
                }}
              >
                [فقر دم IDA]
              </button>

              <button
                type="button"
                onClick={() => applyPreset('INFECTION')}
                style={{
                  fontSize: '11px',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: '1px solid #8b5cf6',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                }}
              >
                [التهاب]
              </button>
            </div>
          </div>

          {/* Row 3: Collapsible Field Picker Strip (Dynamic Show/Hide) */}
          {showFieldPicker && (
            <div
              dir="rtl"
              style={{
                direction: 'rtl',
                textAlign: 'right',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-main)' }}>
                  🎯 الحقول المعتمدة للفورمة والطباعة لهذا الجهاز (يتم الحفظ تلقائياً للمرات القادمة):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllFields}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #10b981', background: '#ecfdf5', color: '#047857', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✓ تفعيل الكل
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectEssentialOnly}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #0284c7', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⭐ الأساسية فقط
                  </button>
                  <button
                    type="button"
                    onClick={handleHideWbcAndDiff}
                    title="استبعاد حقول كريات الدم البيض والتفريق من الفورمة والطباعة"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #f87171', background: '#fef2f2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🚫 إخفاء كريات الدم البيض (WBC)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetActiveFields}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🔄 استعادة الافتراضي
                  </button>
                </div>
              </div>

              {/* Grouped Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px 0' }}>
                {deviceFields.map((f) => {
                  const active = isFieldActive(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggleFieldActive(f.key)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: active ? 800 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: active ? '1px solid #0284c7' : '1px dashed var(--border-color)',
                        background: active ? '#e0f2fe' : 'var(--bg-card)',
                        color: active ? '#0369a1' : 'var(--text-muted)',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {active ? <Eye size={12} color="#0284c7" /> : <EyeOff size={12} color="#94a3b8" />}
                      <span>{f.label}</span>
                      {f.labelAr && <span style={{ fontSize: '10px', opacity: 0.8 }}>({f.labelAr})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* Quick Paste Modal */}
        {showQuickPaste && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '620px',
                padding: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                  📋 استيراد سريع من نص جهاز التحليل (Automated Analyzer Paste)
                </strong>
                <button
                  type="button"
                  onClick={() => setShowQuickPaste(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                الصق النص المنسوخ من شاشة أو تقرير المحلل الآلي (Sysmex / Mindray / Horiba / Beckman) وسيقوم النظام بتوزيع كافة القيم تلقائياً:
              </p>
              <textarea
                rows={8}
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
                placeholder="RBC: 4.85 HGB: 14.2 HCT: 43.1 MCV: 89.0 MCH: 29.5 MCHC: 33.1 RDW: 12.8 PLT: 245 WBC: 6.8 NEUT%: 62.5 LYMPH%: 28.5..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickPaste(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickPaste(quickPasteText)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#7c3aed',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 800,
                  }}
                >
                  تطبيق واستخراج القيم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Device Customization Modal (Inline Editor for Labels & Reference Ranges) */}
        {showCustomizer && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              dir="rtl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '860px',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                direction: 'rtl',
                textAlign: 'right',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings2 size={18} color="#d97706" />
                    <span>تخصيص الأسماء والمديات لجهاز: {activeDeviceProfile.name}</span>
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    عدّل التسميات والوحدات والمديات الطبيعية (Normal Ranges) كما تظهر في ورقة جهازك، وستبقى محفوظة دائمياً.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomizer(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Table / Form Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                      <th style={{ padding: '8px 10px', width: '12%' }}>المعامل</th>
                      <th style={{ padding: '8px 10px', width: '22%' }}>الاسم بالإنجليزية</th>
                      <th style={{ padding: '8px 10px', width: '22%' }}>الاسم بالعربية</th>
                      <th style={{ padding: '8px 10px', width: '14%' }}>الوحدة</th>
                      <th style={{ padding: '8px 10px', width: '16%' }}>أدنى قيمة</th>
                      <th style={{ padding: '8px 10px', width: '16%' }}>أعلى قيمة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customizerFields.map((field, idx) => (
                      <tr key={field.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0284c7' }}>
                          {field.key}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={field.label || field.name || ''}
                            onChange={(e) => {
                              const updated = [...customizerFields];
                              updated[idx] = { ...updated[idx], label: e.target.value, name: e.target.value };
                              setCustomizerFields(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={field.labelAr || field.arabicName || ''}
                            onChange={(e) => {
                              const updated = [...customizerFields];
                              updated[idx] = { ...updated[idx], labelAr: e.target.value, arabicName: e.target.value };
                              setCustomizerFields(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              fontSize: '12px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={field.unit}
                            onChange={(e) => {
                              const updated = [...customizerFields];
                              updated[idx] = { ...updated[idx], unit: e.target.value };
                              setCustomizerFields(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              fontSize: '11.5px',
                              direction: 'ltr',
                              textAlign: 'center',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="number"
                            step="any"
                            value={field.refMin ?? ''}
                            onChange={(e) => {
                              const updated = [...customizerFields];
                              updated[idx] = { ...updated[idx], refMin: e.target.value === '' ? undefined : parseFloat(e.target.value) };
                              setCustomizerFields(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              fontSize: '12px',
                              direction: 'ltr',
                              textAlign: 'center',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="number"
                            step="any"
                            value={field.refMax ?? ''}
                            onChange={(e) => {
                              const updated = [...customizerFields];
                              updated[idx] = { ...updated[idx], refMax: e.target.value === '' ? undefined : parseFloat(e.target.value) };
                              setCustomizerFields(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              fontSize: '12px',
                              direction: 'ltr',
                              textAlign: 'center',
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={handleResetCustomizer}
                  style={{
                    fontSize: '11.5px',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCw size={13} />
                  <span>استعادة المديات الأصلية للجهاز</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCustomizer(false)}
                    style={{
                      fontSize: '12px',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomizer}
                    style={{
                      fontSize: '12px',
                      padding: '7px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Save size={14} />
                    <span>حفظ التعديلات دائمياً</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div dir="ltr" style={{ display: 'flex', flexDirection: 'column', gap: '12px', direction: 'ltr', textAlign: 'left' }}>
            {/* Tab Navigation Header */}
            <div
              dir="ltr"
              style={{
                display: 'flex',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: '10px',
                gap: '4px',
                direction: 'ltr',
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
                  background: activeTab === 'ERYTHROID' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'ERYTHROID' ? '#dc2626' : 'var(--text-muted)',
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
                  background: activeTab === 'LEUKOCYTES' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'LEUKOCYTES' ? '#0284c7' : 'var(--text-muted)',
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
                  background: activeTab === 'PLATELETS' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'PLATELETS' ? '#d97706' : 'var(--text-muted)',
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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Primary Erythroid Parameters:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {isFieldActive('rbc') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('rbc')?.label || 'R.B.C'} ({getFieldMeta('rbc')?.unit || '10^6/uL'}):
                        </label>
                        <input
                          type="text"
                          value={data.rbc}
                          onChange={(e) => handleErythroidChange('rbc', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('rbc')?.refMin ?? '4.50'} - {getFieldMeta('rbc')?.refMax ?? '5.90'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('hgb') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('hgb')?.label || 'HGB'} ({getFieldMeta('hgb')?.unit || 'g/dL'}):
                        </label>
                        <input
                          type="text"
                          value={data.hgb}
                          onChange={(e) => handleErythroidChange('hgb', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: hgbPanic.isPanic ? '2px solid #dc2626' : '1px solid var(--border-color)',
                            background: hgbPanic.isPanic ? '#fee2e2' : 'var(--bg-input)',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: hgbPanic.isPanic ? '#b91c1c' : 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('hgb')?.refMin ?? '13.0'} - {getFieldMeta('hgb')?.refMax ?? '17.5'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('hct') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('hct')?.label || 'HCT / PCV'} ({getFieldMeta('hct')?.unit || '%'}):
                        </label>
                        <input
                          type="text"
                          value={data.hct}
                          onChange={(e) => handleErythroidChange('hct', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('hct')?.refMin ?? '40.0'} - {getFieldMeta('hct')?.refMax ?? '52.0'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Red Cell Calculated Indices (MCV, MCH, MCHC, RDW) */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                      Red Cell Diagnostic Indices:
                    </span>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                      ✓ مديات خاصة بجهاز {activeDeviceProfile.name}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {isFieldActive('mcv') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('mcv')?.label || 'MCV'} ({getFieldMeta('mcv')?.unit || 'fL'}):
                        </label>
                        <input
                          type="text"
                          value={data.mcv}
                          onChange={(e) => setField('mcv', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('mcv')?.refMin ?? '80.0'} - {getFieldMeta('mcv')?.refMax ?? '100.0'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('mch') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('mch')?.label || 'MCH'} ({getFieldMeta('mch')?.unit || 'pg'}):
                        </label>
                        <input
                          type="text"
                          value={data.mch}
                          onChange={(e) => setField('mch', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('mch')?.refMin ?? '27.0'} - {getFieldMeta('mch')?.refMax ?? '34.0'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('mchc') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('mchc')?.label || 'MCHC'} ({getFieldMeta('mchc')?.unit || 'g/dL'}):
                        </label>
                        <input
                          type="text"
                          value={data.mchc}
                          onChange={(e) => setField('mchc', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('mchc')?.refMin ?? '32.0'} - {getFieldMeta('mchc')?.refMax ?? '36.0'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('rdw') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('rdw')?.label || 'RDW-CV'} ({getFieldMeta('rdw')?.unit || '%'}):
                        </label>
                        <input
                          type="text"
                          value={data.rdw}
                          onChange={(e) => setField('rdw', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('rdw')?.refMin ?? '11.5'} - {getFieldMeta('rdw')?.refMax ?? '14.5'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('rdwSd') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('rdwSd')?.label || 'RDW-SD'} ({getFieldMeta('rdwSd')?.unit || 'fL'}):
                        </label>
                        <input
                          type="text"
                          value={data.rdwSd || ''}
                          onChange={(e) => setField('rdwSd', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('rdwSd')?.refMin ?? '39.0'} - {getFieldMeta('rdwSd')?.refMax ?? '46.0'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LEUKOCYTES & DIFFERENTIAL */}
            {activeTab === 'LEUKOCYTES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Total WBC Card */}
                {isFieldActive('wbc') ? (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', display: 'block' }}>
                        {getFieldMeta('wbc')?.label || 'Total Leukocyte Count (W.B.C)'}:
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Reference Range:{' '}
                        <strong style={{ color: '#0284c7' }}>
                          {getFieldMeta('wbc')?.refMin ?? '4.0'} - {getFieldMeta('wbc')?.refMax ?? '11.0'} {getFieldMeta('wbc')?.unit || '10^3/uL'}
                        </strong>
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
                          border: wbcPanic.isPanic ? '2px solid #dc2626' : '1px solid var(--border-color)',
                          background: wbcPanic.isPanic ? '#fee2e2' : 'var(--bg-input)',
                          fontSize: '15px',
                          fontWeight: 900,
                          color: wbcPanic.isPanic ? '#b91c1c' : 'var(--text-main)',
                          textAlign: 'center',
                        }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {getFieldMeta('wbc')?.unit || '10^3/uL'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px dashed #fca5a5',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#b91c1c',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>🚫 تم إخفاء معامل كريات الدم البيض (WBC) وفق تخصيصك الحالي لهذا الجهاز.</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldActive('wbc')}
                      style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #b91c1c', background: '#ffffff', color: '#b91c1c', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                    >
                      إعادة إظهار WBC
                    </button>
                  </div>
                )}

                {/* Differential Form (Supports both 3-Part & 5-Part) */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                        Differential Leukocyte Count:
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                        الأعداد المطلقة تحسب تلقائياً بالتزامن مع Total WBC
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* 3-Part / 5-Part Toggle */}
                      <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '2px', borderRadius: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setDiffMode('3PART')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: diffMode === '3PART' ? 800 : 600,
                            border: 'none',
                            background: diffMode === '3PART' ? 'var(--bg-card)' : 'transparent',
                            color: diffMode === '3PART' ? '#0284c7' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          3-Part (سوي لاب)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiffMode('5PART')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: diffMode === '5PART' ? 800 : 600,
                            border: 'none',
                            background: diffMode === '5PART' ? 'var(--bg-card)' : 'transparent',
                            color: diffMode === '5PART' ? '#0284c7' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          5-Part (خماسي)
                        </button>
                      </div>

                      {/* Differential Sum badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>المجموع:</span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 900,
                            background: isDiffValid ? '#ecfdf5' : '#fef2f2',
                            color: isDiffValid ? '#047857' : '#b91c1c',
                            border: `1px solid ${isDiffValid ? '#a7f3d0' : '#fca5a5'}`,
                          }}
                        >
                          {diffSum}% {isDiffValid ? '✓' : '⚠️'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-Part Differential Inputs */}
                  {diffMode === '3PART' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'graPct', absKey: 'graAbs', label: getFieldMeta('graPct')?.label || 'Granulocytes (GRA%)', ref: `${getFieldMeta('graPct')?.refMin ?? 50.0} - ${getFieldMeta('graPct')?.refMax ?? 75.0}%`, val: data.graPct || data.neutrophils, absVal: data.graAbs || data.neutrophilsAbs },
                        { key: 'lymPct', absKey: 'lymAbs', label: getFieldMeta('lymPct')?.label || 'Lymphocytes (LYM%)', ref: `${getFieldMeta('lymPct')?.refMin ?? 20.0} - ${getFieldMeta('lymPct')?.refMax ?? 45.0}%`, val: data.lymPct || data.lymphocytes, absVal: data.lymAbs || data.lymphocytesAbs },
                        { key: 'midPct', absKey: 'midAbs', label: getFieldMeta('midPct')?.label || 'Mid Cells (MID%)', ref: `${getFieldMeta('midPct')?.refMin ?? 2.0} - ${getFieldMeta('midPct')?.refMax ?? 10.0}%`, val: data.midPct || data.monocytes, absVal: data.midAbs || data.monocytesAbs },
                      ].map((row) => {
                        if (!isFieldActive(row.key)) return null;
                        return (
                          <div
                            key={row.key}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 10px',
                              background: 'var(--bg-input)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ width: '220px' }}>
                              <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{row.label}</strong>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Ref: {row.ref}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Abs (#):</span>
                                <input
                                  type="text"
                                  value={row.absVal || ''}
                                  onChange={(e) => setField(row.absKey as keyof CbcAnalysisData, e.target.value)}
                                  placeholder="0.00"
                                  style={{
                                    width: '65px',
                                    padding: '5px 7px',
                                    borderRadius: '5px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    background: 'var(--bg-card)',
                                    color: '#0284c7',
                                  }}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>x10^3</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rel (%):</span>
                                <input
                                  type="text"
                                  value={row.val || ''}
                                  onChange={(e) => setField(row.key as keyof CbcAnalysisData, e.target.value)}
                                  style={{
                                    width: '65px',
                                    padding: '5px 7px',
                                    borderRadius: '5px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '12.5px',
                                    fontWeight: 800,
                                    textAlign: 'center',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                  }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 5-Part Differential Rows */}
                  {diffMode === '5PART' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'neutrophils', label: getFieldMeta('neutrophils')?.label || 'Neutrophils', ref: `${getFieldMeta('neutrophils')?.refMin ?? 40} - ${getFieldMeta('neutrophils')?.refMax ?? 75}%`, val: data.neutrophils, abs: totalWbcNum > 0 ? ((totalWbcNum * neutVal) / 100).toFixed(2) : '0.00' },
                        { key: 'lymphocytes', label: getFieldMeta('lymphocytes')?.label || 'Lymphocytes', ref: `${getFieldMeta('lymphocytes')?.refMin ?? 20} - ${getFieldMeta('lymphocytes')?.refMax ?? 45}%`, val: data.lymphocytes, abs: totalWbcNum > 0 ? ((totalWbcNum * lymphVal) / 100).toFixed(2) : '0.00' },
                        { key: 'monocytes', label: getFieldMeta('monocytes')?.label || 'Monocytes', ref: `${getFieldMeta('monocytes')?.refMin ?? 2} - ${getFieldMeta('monocytes')?.refMax ?? 10}%`, val: data.monocytes, abs: totalWbcNum > 0 ? ((totalWbcNum * monoVal) / 100).toFixed(2) : '0.00' },
                        { key: 'eosinophils', label: getFieldMeta('eosinophils')?.label || 'Eosinophils', ref: `${getFieldMeta('eosinophils')?.refMin ?? 1} - ${getFieldMeta('eosinophils')?.refMax ?? 6}%`, val: data.eosinophils, abs: totalWbcNum > 0 ? ((totalWbcNum * eosVal) / 100).toFixed(2) : '0.00' },
                        { key: 'basophils', label: getFieldMeta('basophils')?.label || 'Basophils', ref: `${getFieldMeta('basophils')?.refMin ?? 0} - ${getFieldMeta('basophils')?.refMax ?? 1}%`, val: data.basophils, abs: totalWbcNum > 0 ? ((totalWbcNum * basoVal) / 100).toFixed(2) : '0.00' },
                      ].map((row) => {
                        if (!isFieldActive(row.key)) return null;
                        return (
                          <div
                            key={row.key}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 10px',
                              background: 'var(--bg-input)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ width: '220px' }}>
                              <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{row.label}</strong>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Ref: {row.ref}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                                    border: '1px solid var(--border-color)',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    textAlign: 'center',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                  }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PLATELETS & MORPHOLOGY */}
            {activeTab === 'PLATELETS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Platelets Indices */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Platelet Series Parameters:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {isFieldActive('plt') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('plt')?.label || 'PLT'} ({getFieldMeta('plt')?.unit || '10^3/uL'}):
                        </label>
                        <input
                          type="text"
                          value={data.plt}
                          onChange={(e) => setField('plt', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: pltPanic.isPanic ? '2px solid #dc2626' : '1px solid var(--border-color)',
                            background: pltPanic.isPanic ? '#fee2e2' : 'var(--bg-input)',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: pltPanic.isPanic ? '#b91c1c' : 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('plt')?.refMin ?? '150'} - {getFieldMeta('plt')?.refMax ?? '450'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('mpv') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('mpv')?.label || 'MPV'} ({getFieldMeta('mpv')?.unit || 'fL'}):
                        </label>
                        <input
                          type="text"
                          value={data.mpv}
                          onChange={(e) => setField('mpv', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('mpv')?.refMin ?? '7.4'} - {getFieldMeta('mpv')?.refMax ?? '11.0'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('pdw') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('pdw')?.label || 'PDW'} ({getFieldMeta('pdw')?.unit || '%'}):
                        </label>
                        <input
                          type="text"
                          value={data.pdw}
                          onChange={(e) => setField('pdw', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('pdw')?.refMin ?? '9.0'} - {getFieldMeta('pdw')?.refMax ?? '17.0'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('pct') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('pct')?.label || 'PCT'} ({getFieldMeta('pct')?.unit || '%'}):
                        </label>
                        <input
                          type="text"
                          value={data.pct}
                          onChange={(e) => setField('pct', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('pct')?.refMin ?? '0.15'} - {getFieldMeta('pct')?.refMax ?? '0.40'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('plcr') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('plcr')?.label || 'P-LCR'} ({getFieldMeta('plcr')?.unit || '%'}):
                        </label>
                        <input
                          type="text"
                          value={data.plcr || ''}
                          onChange={(e) => setField('plcr', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('plcr')?.refMin ?? '13.0'} - {getFieldMeta('plcr')?.refMax ?? '43.0'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('plcc') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('plcc')?.label || 'P-LCC'} ({getFieldMeta('plcc')?.unit || '10^3/uL'}):
                        </label>
                        <input
                          type="text"
                          value={data.plcc || ''}
                          onChange={(e) => setField('plcc', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('plcc')?.refMin ?? '30'} - {getFieldMeta('plcc')?.refMax ?? '90'}
                        </span>
                      </div>
                    )}

                    {isFieldActive('pdwSd') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {getFieldMeta('pdwSd')?.label || 'PDW-SD'} ({getFieldMeta('pdwSd')?.unit || 'fL'}):
                        </label>
                        <input
                          type="text"
                          value={data.pdwSd || ''}
                          onChange={(e) => setField('pdwSd', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ref: {getFieldMeta('pdwSd')?.refMin ?? '9.0'} - {getFieldMeta('pdwSd')?.refMax ?? '17.0'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Morphology Pills & Textarea */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Blood Film Morphology:
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
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-main)',
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
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                    placeholder="Blood film morphology description..."
                  />
                </div>

                {/* Physician Remarks & Comments */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                      Clinical Remarks & Interpretation:
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setField('comments', 'Normal hematological profile.')}
                        style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        [Normal]
                      </button>
                      <button
                        type="button"
                        onClick={() => setField('comments', 'Picture suggestive of Iron Deficiency Anemia (IDA).')}
                        style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer' }}
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
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                    placeholder="Recommendations or remarks..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------
              RIGHT PANEL: DEDICATED A4 CLINICAL REPORT PREVIEW
             ---------------------------------------------------- */}
          <div
            dir="ltr"
            style={{
              direction: 'ltr',
              textAlign: 'left',
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
              dir="ltr"
              style={{
                direction: 'ltr',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #dc2626',
                paddingBottom: '10px',
                marginBottom: '12px',
                textAlign: 'left',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  <span
                    style={{
                      fontSize: '10px',
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 800,
                    }}
                  >
                    {activeDeviceProfile.is3Part ? '3-PART ANALYZER' : '5-PART ANALYZER'}
                  </span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0 0', textAlign: 'left' }}>
                  CBC • {activeDeviceProfile.name}
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Sample #{resolvedSampleNumber}
                </span>
              </div>
            </div>

            {/* Preview Tables */}
            <div dir="ltr" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', direction: 'ltr', textAlign: 'left' }}>
              {/* Section 1: Erythroid */}
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px', textAlign: 'left' }}>
                  ERYTHROID SERIES (RBCs)
                </div>
                {data.rbc || data.hgb || data.hct || data.mcv ? (
                  <table dir="ltr" style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', textAlign: 'left' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>RBC:</td>
                        <td style={{ fontWeight: 700, color: rbcNum < 4.0 || rbcNum > 6.2 ? '#dc2626' : '#0f172a', textAlign: 'left', width: '28%' }}>{data.rbc || '-'} 10^6</td>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>HGB:</td>
                        <td style={{ fontWeight: 800, color: parseFloat(data.hgb) < 12.0 ? '#dc2626' : '#0f172a', textAlign: 'left', width: '28%' }}>{data.hgb || '-'} g/dL</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>HCT:</td>
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.hct || '-'} %</td>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>MCV:</td>
                        <td style={{ fontWeight: 700, color: parseFloat(data.mcv) < 80 ? '#dc2626' : '#0f172a', textAlign: 'left', width: '28%' }}>{data.mcv || '-'} fL</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>MCH:</td>
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.mch || '-'} pg</td>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>MCHC:</td>
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.mchc || '-'} g/dL</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>RDW:</td>
                        <td style={{ fontWeight: 700, color: parseFloat(data.rdw) > 15 ? '#dc2626' : '#0f172a', textAlign: 'left', width: '28%' }}>{data.rdw || '-'} %</td>
                        {data.rdwSd ? (
                          <>
                            <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>RDW-SD:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.rdwSd} fL</td>
                          </>
                        ) : (
                          <td colSpan={2}></td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>
                    (لم يتم إدخال معاملات السلسلة الحمراء)
                  </div>
                )}
                {mentzer && (
                  <div dir="ltr" style={{ fontSize: '10px', color: '#0369a1', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', marginTop: '3px', direction: 'ltr', textAlign: 'left' }}>
                    Mentzer: {mentzer.value} ({mentzer.interpretation})
                  </div>
                )}
              </div>

              {/* Section 2: Leukocytes & Differential */}
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', direction: 'ltr', textAlign: 'left' }}>
                  <span>LEUKOCYTES & {diffMode === '3PART' ? '3-PART DIFF' : '5-PART DIFF'}</span>
                  {data.wbc && <span style={{ color: isDiffValid ? '#047857' : '#dc2626' }}>Sum: {diffSum}%</span>}
                </div>
                {data.wbc || data.graPct || data.neutrophils ? (
                  <table dir="ltr" style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', textAlign: 'left' }}>
                    <tbody>
                      {data.wbc && (
                        <tr>
                          <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '25%' }}>Total WBC:</td>
                          <td colSpan={3} style={{ fontWeight: 800, color: totalWbcNum < 4.0 || totalWbcNum > 11.0 ? '#dc2626' : '#0f172a', textAlign: 'left' }}>
                            {data.wbc} x10^3/uL
                          </td>
                        </tr>
                      )}
                      {diffMode === '3PART' ? (
                        <>
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>GRA:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.graPct || data.neutrophils || '-'}% ({data.graAbs || data.neutrophilsAbs || '-'} #)</td>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>LYM:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.lymPct || data.lymphocytes || '-'}% ({data.lymAbs || data.lymphocytesAbs || '-'} #)</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>MID:</td>
                            <td colSpan={3} style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left' }}>{data.midPct || data.monocytes || '-'}% ({data.midAbs || data.monocytesAbs || '-'} #)</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>Neut:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.neutrophils || '-'}%</td>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>Lymph:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.lymphocytes || '-'}%</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>Mono:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.monocytes || '-'}%</td>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>Eos:</td>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.eosinophils || '-'}%</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#64748b', padding: '2px 0', textAlign: 'left', width: '22%' }}>Baso:</td>
                            <td colSpan={3} style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left' }}>{data.basophils || '-'}%</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>
                    (تم استبعاد كريات الدم البيض من الفحص)
                  </div>
                )}
              </div>

              {/* Section 3: Platelets */}
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px', textAlign: 'left' }}>
                  PLATELETS & INDICES
                </div>
                {data.plt || data.mpv || data.pdw ? (
                  <table dir="ltr" style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', textAlign: 'left' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>PLT:</td>
                        <td style={{ fontWeight: 800, color: parseFloat(data.plt) < 150 ? '#dc2626' : '#0f172a', textAlign: 'left', width: '28%' }}>{data.plt || '-'} x10^3</td>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>MPV:</td>
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.mpv || '-'} fL</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>PDW:</td>
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.pdw || '-'} %</td>
                        <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>PCT:</td>
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.pct || '-'} %</td>
                      </tr>
                      {(data.plcr || data.plcc || data.pdwSd) && (
                        <tr>
                          {data.plcr && (
                            <>
                              <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>P-LCR:</td>
                              <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.plcr} %</td>
                            </>
                          )}
                          {data.plcc && (
                            <>
                              <td style={{ color: '#64748b', padding: '3px 0', textAlign: 'left', width: '22%' }}>P-LCC:</td>
                              <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left', width: '28%' }}>{data.plcc}</td>
                            </>
                          )}
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>
                    (لم يتم إدخال معاملات الصفائح)
                  </div>
                )}
              </div>

              {/* Section 4: Morphology & Comments */}
              {data.morphology && (
                <div dir="ltr" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px', fontSize: '10.5px', direction: 'ltr', textAlign: 'left' }}>
                  <strong>Morphology:</strong> {data.morphology}
                </div>
              )}
              {data.comments && (
                <div dir="ltr" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px', fontSize: '10.5px', color: '#334155', direction: 'ltr', textAlign: 'left' }}>
                  <strong>Comments:</strong> {data.comments}
                </div>
              )}
            </div>

            {/* Stamp / verification text */}
            <div
              dir="ltr"
              style={{
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9.5px',
                color: '#94a3b8',
                direction: 'ltr',
              }}
            >
              <span>{activeDeviceProfile.name} • Verified</span>
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
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
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
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'var(--text-main)',
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
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'var(--text-main)',
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
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--text-main)',
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
