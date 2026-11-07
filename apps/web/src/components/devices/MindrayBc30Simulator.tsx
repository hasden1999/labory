'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Printer,
  Wifi,
  WifiOff,
  Activity,
  Terminal,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  ExternalLink,
  Barcode,
  Layers,
  ChevronRight,
  Database,
  ArrowRight,
  FileText,
  ShieldAlert,
  X,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../Toast';
import { toEnglishDigits } from '../../lib/formatters';

// -------------------------------------------------------------
// Audio Synthesis (Web Audio API - No External Files Required)
// -------------------------------------------------------------
class MindraySoundFx {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  beep(freq = 880, duration = 0.08, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  suction() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 1.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.8));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(850, ctx.currentTime + 0.6);
      filter.frequency.linearRampToValueAtTime(300, ctx.currentTime + 1.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {}
  }

  successChime() {
    if (!this.enabled) return;
    this.beep(523.25, 0.12);
    setTimeout(() => this.beep(659.25, 0.12), 120);
    setTimeout(() => this.beep(783.99, 0.25), 240);
  }

  errorAlert() {
    if (!this.enabled) return;
    this.beep(300, 0.15, 'sawtooth');
    setTimeout(() => this.beep(250, 0.2, 'sawtooth'), 180);
  }
}

const sfx = new MindraySoundFx();

// -------------------------------------------------------------
// Clinical Parameter Definitions & Presets
// -------------------------------------------------------------
export interface MindrayParameter {
  code: string;
  name: string;
  nameAr: string;
  value: number;
  unit: string;
  minNormal: number;
  maxNormal: number;
  step: number;
  decimals: number;
  group: 'WBC' | 'RBC' | 'PLT';
}

export const DEFAULT_MINDRAY_BC30_PARAMS: MindrayParameter[] = [
  // WBC & 3-Part Differential
  { code: 'WBC', name: 'White Blood Cells', nameAr: 'كريات الدم البيضاء', value: 7.4, unit: '10^3/uL', minNormal: 4.0, maxNormal: 10.0, step: 0.1, decimals: 1, group: 'WBC' },
  { code: 'Lymph#', name: 'Lymphocyte Count', nameAr: 'الخلايا اللمفاوية المطلقة', value: 2.2, unit: '10^3/uL', minNormal: 0.8, maxNormal: 4.0, step: 0.1, decimals: 1, group: 'WBC' },
  { code: 'Mid#', name: 'Mid-cell Count', nameAr: 'الخلايا المتوسطة المطلقة', value: 0.5, unit: '10^3/uL', minNormal: 0.1, maxNormal: 0.9, step: 0.1, decimals: 1, group: 'WBC' },
  { code: 'Gran#', name: 'Granulocyte Count', nameAr: 'الخلايا المحببة المطلقة', value: 4.7, unit: '10^3/uL', minNormal: 2.0, maxNormal: 7.0, step: 0.1, decimals: 1, group: 'WBC' },
  { code: 'Lymph%', name: 'Lymphocyte %', nameAr: 'نسبة الخلايا اللمفاوية', value: 29.7, unit: '%', minNormal: 20.0, maxNormal: 40.0, step: 0.5, decimals: 1, group: 'WBC' },
  { code: 'Mid%', name: 'Mid-cell %', nameAr: 'نسبة الخلايا المتوسطة', value: 6.8, unit: '%', minNormal: 3.0, maxNormal: 10.0, step: 0.2, decimals: 1, group: 'WBC' },
  { code: 'Gran%', name: 'Granulocyte %', nameAr: 'نسبة الخلايا المحببة', value: 63.5, unit: '%', minNormal: 50.0, maxNormal: 70.0, step: 0.5, decimals: 1, group: 'WBC' },

  // RBC & Indices
  { code: 'RBC', name: 'Red Blood Cells', nameAr: 'كريات الدم الحمراء', value: 4.85, unit: '10^6/uL', minNormal: 3.8, maxNormal: 5.8, step: 0.05, decimals: 2, group: 'RBC' },
  { code: 'HGB', name: 'Hemoglobin', nameAr: 'الهيموغلوبين', value: 14.5, unit: 'g/dL', minNormal: 11.5, maxNormal: 16.5, step: 0.1, decimals: 1, group: 'RBC' },
  { code: 'HCT', name: 'Hematocrit (PCV)', nameAr: 'حجم الخلايا المكدسة', value: 43.2, unit: '%', minNormal: 35.0, maxNormal: 50.0, step: 0.2, decimals: 1, group: 'RBC' },
  { code: 'MCV', name: 'Mean Corpuscular Volume', nameAr: 'متوسط حجم الكرية', value: 89.1, unit: 'fL', minNormal: 80.0, maxNormal: 100.0, step: 0.5, decimals: 1, group: 'RBC' },
  { code: 'MCH', name: 'Mean Corpuscular Hemoglobin', nameAr: 'متوسط خضاب الكرية', value: 29.9, unit: 'pg', minNormal: 27.0, maxNormal: 34.0, step: 0.2, decimals: 1, group: 'RBC' },
  { code: 'MCHC', name: 'Mean Corpuscular Hb Conc', nameAr: 'تركيز خضاب الكرية', value: 33.6, unit: 'g/dL', minNormal: 31.0, maxNormal: 37.0, step: 0.2, decimals: 1, group: 'RBC' },
  { code: 'RDW-CV', name: 'RDW - CV', nameAr: 'تباين توزيع الكريات CV', value: 12.8, unit: '%', minNormal: 11.0, maxNormal: 16.0, step: 0.2, decimals: 1, group: 'RBC' },
  { code: 'RDW-SD', name: 'RDW - SD', nameAr: 'تباين توزيع الكريات SD', value: 42.4, unit: 'fL', minNormal: 35.0, maxNormal: 56.0, step: 0.5, decimals: 1, group: 'RBC' },

  // Platelets & Indices
  { code: 'PLT', name: 'Platelets', nameAr: 'الصفائح الدموية', value: 254, unit: '10^3/uL', minNormal: 150, maxNormal: 450, step: 5, decimals: 0, group: 'PLT' },
  { code: 'MPV', name: 'Mean Platelet Volume', nameAr: 'متوسط حجم الصفيحة', value: 9.6, unit: 'fL', minNormal: 6.5, maxNormal: 12.0, step: 0.1, decimals: 1, group: 'PLT' },
  { code: 'PDW', name: 'Platelet Distribution Width', nameAr: 'عرض توزيع الصفائح', value: 15.6, unit: '', minNormal: 9.0, maxNormal: 17.0, step: 0.2, decimals: 1, group: 'PLT' },
  { code: 'PCT', name: 'Plateletcrit', nameAr: 'النسبة المئوية للصفائح', value: 0.24, unit: '%', minNormal: 0.10, maxNormal: 0.50, step: 0.01, decimals: 2, group: 'PLT' },
  { code: 'P-LCR', name: 'Platelet Large Cell Ratio', nameAr: 'نسبة الصفائح الكبيرة', value: 24.2, unit: '%', minNormal: 13.0, maxNormal: 43.0, step: 0.5, decimals: 1, group: 'PLT' },
  { code: 'P-LCC', name: 'Platelet Large Cell Count', nameAr: 'عدد الصفائح الكبيرة', value: 61, unit: '10^3/uL', minNormal: 30, maxNormal: 90, step: 2, decimals: 0, group: 'PLT' },
];

export interface ClinicalPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  badgeColor: string;
  description: string;
  params: Record<string, number>;
}

export const MINDRAY_CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'NORMAL',
    nameAr: 'عينة بالغة طبيعية (Normal Reference)',
    nameEn: 'Normal Adult Profile',
    badgeColor: '#10b981',
    description: 'كافة المؤشرات الدموية ضمن المديات المرجعية الطبيعية للبالغين.',
    params: {
      WBC: 7.4, 'Lymph#': 2.2, 'Mid#': 0.5, 'Gran#': 4.7, 'Lymph%': 29.7, 'Mid%': 6.8, 'Gran%': 63.5,
      RBC: 4.85, HGB: 14.5, HCT: 43.2, MCV: 89.1, MCH: 29.9, MCHC: 33.6, 'RDW-CV': 12.8, 'RDW-SD': 42.4,
      PLT: 254, MPV: 9.6, PDW: 15.6, PCT: 0.24, 'P-LCR': 24.2, 'P-LCC': 61,
    },
  },
  {
    id: 'ANEMIA',
    nameAr: 'فقر دم دقيق الخلايا (Microcytic Anemia)',
    nameEn: 'Iron Deficiency Anemia',
    badgeColor: '#f59e0b',
    description: 'هبوط حاد في الهيموغلوبين (Hb 7.6) مع صغر حجم الكريات (MCV 66) وارتفاع RDW.',
    params: {
      WBC: 6.2, 'Lymph#': 2.0, 'Mid#': 0.4, 'Gran#': 3.8, 'Lymph%': 32.2, 'Mid%': 6.5, 'Gran%': 61.3,
      RBC: 3.45, HGB: 7.6, HCT: 22.8, MCV: 66.1, MCH: 22.0, MCHC: 33.3, 'RDW-CV': 18.9, 'RDW-SD': 54.2,
      PLT: 380, MPV: 8.8, PDW: 16.2, PCT: 0.33, 'P-LCR': 19.5, 'P-LCC': 74,
    },
  },
  {
    id: 'LEUKOCYTOSIS',
    nameAr: 'التهاب حاد وارتفاع بيض (Severe Infection)',
    nameEn: 'Bacterial Leukocytosis',
    badgeColor: '#ef4444',
    description: 'ارتفاع شديد في كريات الدم البيضاء (WBC 18.4) مع غلبة المحببات (Gran% 84%).',
    params: {
      WBC: 18.4, 'Lymph#': 1.8, 'Mid#': 1.1, 'Gran#': 15.5, 'Lymph%': 9.8, 'Mid%': 6.0, 'Gran%': 84.2,
      RBC: 4.60, HGB: 13.8, HCT: 41.4, MCV: 90.0, MCH: 30.0, MCHC: 33.3, 'RDW-CV': 13.4, 'RDW-SD': 43.1,
      PLT: 310, MPV: 10.1, PDW: 15.9, PCT: 0.31, 'P-LCR': 27.5, 'P-LCC': 85,
    },
  },
  {
    id: 'THROMBOCYTOPENIA',
    nameAr: 'نقص صفائح دم حاد (Thrombocytopenia)',
    nameEn: 'Severe Thrombocytopenia',
    badgeColor: '#8b5cf6',
    description: 'انخفاض حرج في عدد الصفائح الدموية (PLT 34) مع ارتفاع نسبة الصفائح العملاقة.',
    params: {
      WBC: 5.6, 'Lymph#': 1.9, 'Mid#': 0.4, 'Gran#': 3.3, 'Lymph%': 33.9, 'Mid%': 7.1, 'Gran%': 59.0,
      RBC: 4.50, HGB: 13.2, HCT: 39.6, MCV: 88.0, MCH: 29.3, MCHC: 33.3, 'RDW-CV': 13.0, 'RDW-SD': 41.8,
      PLT: 34, MPV: 11.8, PDW: 17.5, PCT: 0.04, 'P-LCR': 38.6, 'P-LCC': 13,
    },
  },
  {
    id: 'POLYCYTHEMIA',
    nameAr: 'احمرار دم وتكدس كريات (Polycythemia)',
    nameEn: 'Polycythemia Profile',
    badgeColor: '#ec4899',
    description: 'ارتفاع غير طبيعي في خضاب الدم (Hb 19.4) وعدد الكريات الحمراء (RBC 6.75).',
    params: {
      WBC: 9.8, 'Lymph#': 2.4, 'Mid#': 0.7, 'Gran#': 6.7, 'Lymph%': 24.5, 'Mid%': 7.1, 'Gran%': 68.4,
      RBC: 6.75, HGB: 19.4, HCT: 58.2, MCV: 86.2, MCH: 28.7, MCHC: 33.3, 'RDW-CV': 14.2, 'RDW-SD': 45.0,
      PLT: 290, MPV: 9.8, PDW: 15.8, PCT: 0.28, 'P-LCR': 25.0, 'P-LCC': 72,
    },
  },
];

export interface Hl7FrameLog {
  id: string;
  time: string;
  direction: 'TX' | 'RX';
  segment: string;
  text: string;
}

export default function MindrayBc30Simulator({
  onClose,
  initialSampleNumber,
  onOpenSampleInReception,
}: {
  onClose?: () => void;
  initialSampleNumber?: number;
  onOpenSampleInReception?: (sampleNumber: number) => void;
}) {
  const toast = useToast();

  // Mode: Full Instrument vs Touchscreen GUI
  const [viewMode, setViewMode] = useState<'CHASSIS' | 'TOUCHSCREEN_ONLY'>('CHASSIS');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [frontCoverOpen, setFrontCoverOpen] = useState<boolean>(false);
  const [tubeLoaded, setTubeLoaded] = useState<boolean>(true);

  // Active Screen Tab inside Mindray OS
  const [activeTab, setActiveTab] = useState<'COUNT' | 'WORKLIST' | 'REAGENTS' | 'MAINTENANCE' | 'COMM' | 'HL7_TERMINAL'>('COUNT');

  // Analyzer Parameters & Presets
  const [params, setParams] = useState<MindrayParameter[]>(DEFAULT_MINDRAY_BC30_PARAMS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('NORMAL');

  // Sample Metadata
  const [sampleId, setSampleId] = useState<string>(String(initialSampleNumber || 1001));
  const [sampleBarcode, setSampleBarcode] = useState<string>(`SMP-${initialSampleNumber || 1001}`);
  const [patientName, setPatientName] = useState<string>('أحمد العبيدي');
  const [bloodMode, setBloodMode] = useState<'WHOLE_BLOOD' | 'PREDILUTE'>('WHOLE_BLOOD');
  const [patientMode, setPatientMode] = useState<'ADULT' | 'PED' | 'NEO'>('ADULT');

  // Run Cycle States
  const [isAspirating, setIsAspirating] = useState<boolean>(false);
  const [runStage, setRunStage] = useState<string>('');
  const [runProgress, setRunProgress] = useState<number>(0);
  const [ledStatus, setLedStatus] = useState<'READY' | 'ASPIRATING' | 'WASHING' | 'ERROR'>('READY');

  // Hardware Reagent Levels (%)
  const [reagentDiluent, setReagentDiluent] = useState<number>(94);
  const [reagentLyse, setReagentLyse] = useState<number>(88);
  const [reagentRinse, setReagentRinse] = useState<number>(96);
  const [wasteLevel, setWasteLevel] = useState<number>(14);

  // Terminal & Transmission Logs
  const [hl7Logs, setHl7Logs] = useState<Hl7FrameLog[]>([]);
  const [thermalReceipt, setThermalReceipt] = useState<string | null>(null);
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);

  // Touch Numeric Keypad State
  const [editingParamCode, setEditingParamCode] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState<string>('');

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' ' + now.toISOString().slice(0, 10));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update sound helper
  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Handle Preset Selection
  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = MINDRAY_CLINICAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    sfx.beep(750, 0.06);

    setParams((prev) =>
      prev.map((item) => {
        if (preset.params[item.code] !== undefined) {
          return { ...item, value: preset.params[item.code] };
        }
        return item;
      })
    );
  };

  // Helper to get current parameter value
  const getParam = useCallback((code: string) => params.find((p) => p.code === code)?.value || 0, [params]);

  // Dynamic Parameter Recalculations (Clinical Logic for 3-Part CBC)
  const updateSingleParam = (code: string, newValue: number) => {
    setParams((prev) => {
      const next = prev.map((p) => (p.code === code ? { ...p, value: newValue } : p));
      const getV = (c: string) => next.find((p) => p.code === c)?.value || 0;

      // RBC Indices Auto-Calculation
      if (code === 'RBC' || code === 'HGB' || code === 'HCT') {
        const rbc = getV('RBC');
        const hgb = getV('HGB');
        const hct = getV('HCT');
        if (rbc > 0) {
          const mcv = Math.round((hct / rbc) * 100) / 10;
          const mch = Math.round((hgb / rbc) * 100) / 10;
          const mchc = hct > 0 ? Math.round((hgb / hct) * 1000) / 10 : 33.3;
          return next.map((p) => {
            if (p.code === 'MCV') return { ...p, value: mcv };
            if (p.code === 'MCH') return { ...p, value: mch };
            if (p.code === 'MCHC') return { ...p, value: mchc };
            return p;
          });
        }
      }

      // WBC 3-Part Diff Auto-Calculation
      if (code === 'WBC' || code === 'Lymph%' || code === 'Mid%' || code === 'Gran%') {
        const wbc = getV('WBC');
        const lP = getV('Lymph%');
        const mP = getV('Mid%');
        const gP = getV('Gran%');
        const lA = Math.round(((lP * wbc) / 100) * 10) / 10;
        const mA = Math.round(((mP * wbc) / 100) * 10) / 10;
        const gA = Math.round(((gP * wbc) / 100) * 10) / 10;
        return next.map((p) => {
          if (p.code === 'Lymph#') return { ...p, value: lA };
          if (p.code === 'Mid#') return { ...p, value: mA };
          if (p.code === 'Gran#') return { ...p, value: gA };
          return p;
        });
      }

      return next;
    });
  };

  // Flag Checkers
  const getFlag = (p: MindrayParameter): string | null => {
    if (p.value > p.maxNormal) return 'H';
    if (p.value < p.minNormal) return 'L';
    return null;
  };

  // Special WBC Flag
  const wbcFlag = useMemo(() => {
    const w = getParam('WBC');
    const gP = getParam('Gran%');
    const lP = getParam('Lymph%');
    if (w > 15.0) return 'R4';
    if (gP > 80.0) return 'R3';
    if (lP < 15.0) return 'R2';
    if (w < 3.5) return 'WL';
    return null;
  }, [getParam]);

  // -------------------------------------------------------------
  // Histograms Generation (Dynamic SVG curves for BC-30)
  // -------------------------------------------------------------
  const wbcHistogramPath = useMemo(() => {
    const wbc = getParam('WBC') || 7.4;
    const lymP = getParam('Lymph%') || 30;
    const midP = getParam('Mid%') || 7;
    const granP = getParam('Gran%') || 63;

    // Normalization factors
    const lH = (lymP / 40) * 65;
    const mH = (midP / 15) * 28;
    const gH = (granP / 70) * 85;

    const points: [number, number][] = [];
    const width = 220;
    const height = 90;

    for (let x = 0; x <= width; x += 2) {
      const fl = (x / width) * 300; // 0 to 300 fL
      // 1. Lymph peak (~60 fL, sigma 18)
      const lPeak = lH * Math.exp(-Math.pow(fl - 60, 2) / (2 * 18 * 18));
      // 2. Mid valley (~125 fL, sigma 24)
      const mPeak = mH * Math.exp(-Math.pow(fl - 125, 2) / (2 * 24 * 24));
      // 3. Gran peak (~215 fL, sigma 34)
      const gPeak = gH * Math.exp(-Math.pow(fl - 215, 2) / (2 * 34 * 34));
      // Cutoff below 35 fL
      const baseline = fl < 30 ? 0 : 2;
      const yVal = Math.min(height - 4, Math.max(0, lPeak + mPeak + gPeak + baseline));
      points.push([x, height - yVal]);
    }

    return points.reduce((acc, [x, y], i) => (i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`), '');
  }, [getParam]);

  const rbcHistogramPath = useMemo(() => {
    const mcv = getParam('MCV') || 89;
    const rdw = getParam('RDW-CV') || 13;
    const width = 220;
    const height = 90;
    const points: [number, number][] = [];
    const peakHeight = 82;
    const sigma = rdw * 1.5;

    for (let x = 0; x <= width; x += 2) {
      const fl = (x / width) * 250; // 0 to 250 fL
      const bell = fl < 25 ? 0 : peakHeight * Math.exp(-Math.pow(fl - mcv, 2) / (2 * sigma * sigma));
      points.push([x, height - Math.min(height - 4, bell + 2)]);
    }
    return points.reduce((acc, [x, y], i) => (i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`), '');
  }, [getParam]);

  const pltHistogramPath = useMemo(() => {
    const mpv = getParam('MPV') || 9.6;
    const plt = getParam('PLT') || 250;
    const width = 220;
    const height = 90;
    const points: [number, number][] = [];
    const peakHeight = Math.min(84, (plt / 300) * 80);

    for (let x = 0; x <= width; x += 2) {
      const fl = (x / width) * 30; // 0 to 30 fL
      let curve = 0;
      if (fl > 2) {
        // Log-normal distribution of platelets
        const lnFl = Math.log(fl);
        const lnMpv = Math.log(mpv);
        curve = peakHeight * Math.exp(-Math.pow(lnFl - lnMpv, 2) / (2 * 0.45 * 0.45));
      }
      points.push([x, height - Math.min(height - 4, curve + 2)]);
    }
    return points.reduce((acc, [x, y], i) => (i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`), '');
  }, [getParam]);

  // -------------------------------------------------------------
  // Full Aspiration & Run Cycle Simulation
  // -------------------------------------------------------------
  const handleStartAspiration = async () => {
    if (isAspirating) return;

    if (!tubeLoaded) {
      toast.warning('يرجى تركيب أنبوبة العينة أولاً تحت مجس السحب (Probe)!');
      sfx.errorAlert();
      return;
    }

    if (reagentDiluent < 5 || reagentLyse < 5) {
      toast.error('أحد الكواشف منخفض جداً! يرجى تبديل العبوة من تبويب الكواشف.');
      sfx.errorAlert();
      setLedStatus('ERROR');
      return;
    }

    setIsAspirating(true);
    setLedStatus('ASPIRATING');
    setRunProgress(5);
    setRunStage('سحب العينة: شفط 9µL دم كامل عبر المجس...');
    sfx.suction();

    // Consume slight reagent & generate waste
    setReagentDiluent((prev) => Math.max(1, prev - 1));
    setReagentLyse((prev) => Math.max(1, prev - 1));
    setWasteLevel((prev) => Math.min(100, prev + 1));

    // Progress Simulation Sequence
    await new Promise((r) => setTimeout(r, 800));
    setRunProgress(25);
    setRunStage('تخفيف العينة وإضافة محلول التحلل (Lyse Mixing)...');
    sfx.beep(600, 0.08);

    await new Promise((r) => setTimeout(r, 800));
    setRunProgress(55);
    setRunStage('العد الكهربائي لمقاومة الفتحات (WBC / RBC / PLT Impedance)...');
    sfx.beep(750, 0.08);

    await new Promise((r) => setTimeout(r, 700));
    setRunProgress(80);
    setRunStage('قياس الهيموغلوبين الضوئي 540nm ورسم المنحنيات البيانية...');
    sfx.beep(900, 0.08);

    await new Promise((r) => setTimeout(r, 600));
    setRunProgress(95);
    setRunStage('تغليف حزمة HL7 v2.3.1 وإرسالها إلى نظام المختبر LIS...');

    // 1. Build genuine HL7 v2.3.1 message
    const nowTimeStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const msgId = `BC30${Date.now().toString().slice(-6)}`;
    const msh = `MSH|^~\\&|MINDRAY_BC30|MINDRAY|LIS_HOST|LABRYO|${nowTimeStr}||ORU^R01|${msgId}|P|2.3.1||||||UNICODE`;
    const pid = `PID|1||${sampleBarcode}||${patientName}^^|||${patientMode === 'ADULT' ? 'M' : 'U'}`;
    const obr = `OBR|1|${sampleBarcode}|${sampleBarcode}|CBC^Complete Blood Count^BC30|||${nowTimeStr}||||||||||||||||F`;

    const obxSegments: string[] = [];
    params.forEach((p, idx) => {
      const flg = getFlag(p) || 'N';
      obxSegments.push(
        `OBX|${idx + 1}|NM|${p.code}^${p.name}^LN|1|${p.value}|${p.unit}|${p.minNormal}-${p.maxNormal}|${flg}|||F`
      );
    });

    const fullHl7Payload = [msh, pid, obr, ...obxSegments].join('\r');

    // 2. Dispatch to Labryo Ingestion API
    let ingestSuccess = false;
    let ingestMessage = '';
    try {
      const res = await apiRequest('/devices/ingest', 'POST', {
        deviceId: 'dev-mindray-bc30',
        apiKey: 'dev-mindray-bc30',
        rawPayload: fullHl7Payload,
        protocol: 'HL7_V2',
        sampleNumber: Number(toEnglishDigits(sampleId)) || 1001,
        patientName: patientName,
      });
      ingestSuccess = res?.success !== false;
      ingestMessage = res?.message || 'تم استقبال النتيجة ومطابقتها بالعينة بنجاح';
    } catch (err: any) {
      ingestMessage = err?.message || 'تعذر الإرسال المباشر';
    }

    // 3. Log to Terminal
    const logTime = new Date().toLocaleTimeString();
    const newLogs: Hl7FrameLog[] = [
      { id: `tx-msh-${Date.now()}`, time: logTime, direction: 'TX', segment: 'MSH', text: msh },
      { id: `tx-pid-${Date.now()}`, time: logTime, direction: 'TX', segment: 'PID', text: pid },
      { id: `tx-obr-${Date.now()}`, time: logTime, direction: 'TX', segment: 'OBR', text: obr },
      { id: `tx-obx-${Date.now()}`, time: logTime, direction: 'TX', segment: 'OBX', text: `+21 Parameters Transmitted (WBC: ${getParam('WBC')}, HGB: ${getParam('HGB')}, PLT: ${getParam('PLT')})` },
      {
        id: `rx-ack-${Date.now()}`,
        time: logTime,
        direction: 'RX',
        segment: 'ACK',
        text: `MSH|^~\\&|LIS_HOST|LABRYO|MINDRAY_BC30|MINDRAY|${nowTimeStr}||ACK^R01|ACK${Date.now().toString().slice(-6)}|P|2.3.1\rMSA|AA|${msgId}|Message accepted successfully`,
      },
    ];

    setHl7Logs((prev) => [...newLogs, ...prev].slice(0, 50));

    // 4. Generate Thermal Paper Printout
    const receiptText = generateThermalReceiptText({
      sampleId,
      sampleBarcode,
      patientName,
      timeStr: currentTime,
      params,
    });
    setThermalReceipt(receiptText);

    setRunProgress(100);
    setRunStage('اكتمل التحليل وإرسال النتيجة للـ LIS بنجاح!');
    setLedStatus('READY');
    setIsAspirating(false);
    sfx.successChime();

    if (ingestSuccess) {
      toast.success(
        `تم فحص العينة #${sampleId} (${patientName}) وإرسال 21 نتيجة ومطابقتها في كونسول المختبر فوراً!`,
        'تم تحليل العينة بنجاح'
      );
    } else {
      toast.info(`اكتمل التحليل على الجهاز. رد الخادم: ${ingestMessage}`, 'محاكاة الجهاز');
    }
  };

  // Wash / Flush Maintenance Simulation
  const handleFlushApertures = async () => {
    setLedStatus('WASHING');
    sfx.suction();
    toast.info('جاري غسيل فتحات العد وسحب محلول التنظيف Flush...');
    await new Promise((r) => setTimeout(r, 1200));
    sfx.beep(880, 0.1);
    setLedStatus('READY');
    toast.success('تم تنظيف وغسيل المجس وفتحات القياس بنجاح');
  };

  const handleZapAperture = async () => {
    setLedStatus('WASHING');
    sfx.beep(400, 0.2, 'sawtooth');
    toast.info('جاري تطبيق تفريغ الجهد العالي (High Voltage Zap) لحرق الشوائب والبروتينات...');
    await new Promise((r) => setTimeout(r, 1000));
    sfx.successChime();
    setLedStatus('READY');
    toast.success('تم حرق الشوائب وإزالة أي انسداد في الفتحات الكهربائية');
  };

  // Barcode Scanner Laser Simulation
  const handleSimulateScanBarcode = () => {
    sfx.beep(1200, 0.08);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setSampleId(String(randomNum));
    setSampleBarcode(`SMP-${randomNum}`);
    toast.success(`تمت قراءة الباركود عبر الماسح الضوئي: SMP-${randomNum}`);
  };

  // Fetch Latest Sample from Labryo Reception
  const handleFetchLatestSample = async () => {
    try {
      const res = await apiRequest('/samples');
      const list = Array.isArray(res) ? res : res?.samples || [];
      if (list.length > 0) {
        const top = list[0];
        setSampleId(String(top.sampleNumber || top.id));
        setSampleBarcode(top.barcode || `SMP-${top.sampleNumber}`);
        if (top.patient?.name) setPatientName(top.patient.name);
        sfx.beep(950, 0.06);
        toast.success(`تم سحب بيانات العينة #${top.sampleNumber} (${top.patient?.name || 'مريض'}) من استقبال المختبر!`);
      } else {
        toast.info('لا توجد عينات مسجلة حالياً في النظام.');
      }
    } catch {
      toast.error('تعذر جلب عينات من الخادم');
    }
  };

  // Thermal Receipt Generator
  function generateThermalReceiptText({
    sampleId,
    sampleBarcode,
    patientName,
    timeStr,
    params,
  }: {
    sampleId: string;
    sampleBarcode: string;
    patientName: string;
    timeStr: string;
    params: MindrayParameter[];
  }) {
    const lines = [
      '================================',
      '      MINDRAY BC-30s            ',
      '   Auto Hematology Analyzer     ',
      '================================',
      `Date/Time: ${timeStr}`,
      `Sample ID: ${sampleId}`,
      `Barcode:   ${sampleBarcode}`,
      `Patient:   ${patientName}`,
      `Mode:      Whole Blood (3-Part)`,
      '--------------------------------',
      'PARAM    RESULT     UNIT   FLAG ',
      '--------------------------------',
    ];

    params.forEach((p) => {
      const flg = p.value > p.maxNormal ? 'H*' : p.value < p.minNormal ? 'L*' : '  ';
      const cStr = (p.code + '        ').slice(0, 8);
      const vStr = ('     ' + p.value.toFixed(p.decimals)).slice(-6);
      const uStr = (p.unit + '         ').slice(0, 10);
      lines.push(`${cStr} ${vStr} ${uStr} ${flg}`);
    });

    lines.push('--------------------------------');
    lines.push('WBC Hist: [|||||||||||||||||||] ');
    lines.push('RBC Hist: [   /\\               ]');
    lines.push('PLT Hist: [|\\                  ]');
    lines.push('--------------------------------');
    lines.push('  HOST TRANSMISSION: COMPLETED  ');
    lines.push('  Labryo LIMS HL7 v2.3.1 (OK)   ');
    lines.push('================================\n');

    return lines.join('\n');
  }

  // Handle Numpad edit
  const openNumpad = (code: string) => {
    const cur = params.find((p) => p.code === code);
    if (!cur) return;
    sfx.beep(800, 0.04);
    setEditingParamCode(code);
    setKeypadValue(String(cur.value));
  };

  const handleKeypadKey = (digit: string) => {
    sfx.beep(650, 0.03);
    if (digit === 'C') {
      setKeypadValue('');
      return;
    }
    if (digit === 'BS') {
      setKeypadValue((prev) => prev.slice(0, -1));
      return;
    }
    if (digit === '.' && keypadValue.includes('.')) return;
    if (keypadValue.length >= 7) return;
    setKeypadValue((prev) => prev + digit);
  };

  const handleKeypadSave = () => {
    if (!editingParamCode) return;
    const num = parseFloat(keypadValue);
    if (!isNaN(num) && num >= 0) {
      updateSingleParam(editingParamCode, num);
      sfx.beep(900, 0.08);
    }
    setEditingParamCode(null);
  };

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        userSelect: 'none',
      }}
    >
      {/* Top Floating Control Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Activity size={16} />
            <span>محاكي جهاز تحليل الدم Mindray BC-30 / BC-30s التفاعلي</span>
          </div>

          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
            كأن الجهاز أمامك تماماً • تحكم بالشاشة، السحب، المنحنيات، وبروتوكول HL7
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'كتم الأصوات' : 'تفعيل الأصوات'}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
              color: soundEnabled ? '#34d399' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'الصوت مفعّل' : 'صامت'}</span>
          </button>

          {/* View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'CHASSIS' ? 'TOUCHSCREEN_ONLY' : 'CHASSIS')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {viewMode === 'CHASSIS' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            <span>{viewMode === 'CHASSIS' ? 'ملء الشاشة اللمسية' : 'عرض هيكل الجهاز المادي'}</span>
          </button>

          {/* Close Modal */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          height: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          alignItems: 'stretch',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* ========================================================= */}
        {/* PHYSICAL DEVICE CHASSIS (LEFT/MAIN VIEW)                 */}
        {/* ========================================================= */}
        <div
          style={{
            flex: viewMode === 'CHASSIS' ? '0 0 980px' : '1',
            height: '100%',
            backgroundColor: '#e6ebf0',
            borderRadius: '24px',
            border: '6px solid #cbd5e1',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Top Chassis Bezel with Brand & Status */}
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#d8e1e8',
              borderBottom: '3px solid #b0c0cf',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            {/* Mindray Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '2.5px',
                    color: '#004a80',
                    lineHeight: 1,
                  }}
                >
                  MINDRAY
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#475569',
                    letterSpacing: '0.5px',
                    marginTop: '2px',
                  }}
                >
                  BC-30s Auto Hematology Analyzer
                </span>
              </div>
            </div>

            {/* Hardware Status Indicators & Aspirate Indicator LED */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>حالة المجس:</span>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '999px',
                    backgroundColor:
                      ledStatus === 'READY'
                        ? '#10b981'
                        : ledStatus === 'ASPIRATING'
                        ? '#06b6d4'
                        : ledStatus === 'WASHING'
                        ? '#f59e0b'
                        : '#ef4444',
                    boxShadow:
                      ledStatus === 'READY'
                        ? '0 0 10px #10b981'
                        : ledStatus === 'ASPIRATING'
                        ? '0 0 12px #06b6d4'
                        : '0 0 8px #f59e0b',
                    transition: 'all 0.2s',
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color:
                      ledStatus === 'READY'
                        ? '#047857'
                        : ledStatus === 'ASPIRATING'
                        ? '#0284c7'
                        : ledStatus === 'WASHING'
                        ? '#b45309'
                        : '#b91c1c',
                  }}
                >
                  {ledStatus === 'READY'
                    ? 'جاهز للسحب (Ready)'
                    : ledStatus === 'ASPIRATING'
                    ? 'جاري السحب والعد...'
                    : ledStatus === 'WASHING'
                    ? 'غسيل الفتحات...'
                    : 'خطأ'}
                </span>
              </div>

              {/* Cover toggle */}
              <button
                type="button"
                onClick={() => setFrontCoverOpen(!frontCoverOpen)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #94a3b8',
                  backgroundColor: frontCoverOpen ? '#fef08a' : '#f1f5f9',
                  color: '#334155',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {frontCoverOpen ? 'إغلاق الغطاء' : 'فتح الغطاء الداخلي'}
              </button>
            </div>
          </div>

          {/* Internal Chamber View (When Front Cover is Open) */}
          {frontCoverOpen && (
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderBottom: '2px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                fontSize: '11px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={16} color="#38bdf8" />
                <span>حجرة تخفيف WBC / HGB Lyse: <strong>جاهزة</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={16} color="#f59e0b" />
                <span>أقطاب قياس المقاومة الكهربائية: <strong>50µm Aperture OK</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#34d399" />
                <span>مضخة سحب العينة Syringe Pump: <strong>9µL Calibrated</strong></span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TOUCHSCREEN MONITOR (MINDRAY 10.4" OS)                    */}
          {/* ========================================================= */}
          <div
            style={{
              flex: 1,
              margin: viewMode === 'CHASSIS' ? '12px 16px 8px 16px' : '0',
              borderRadius: viewMode === 'CHASSIS' ? '14px' : '0',
              border: viewMode === 'CHASSIS' ? '4px solid #1e293b' : 'none',
              backgroundColor: '#002544',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* 1. Touchscreen Top Bar */}
            <div
              style={{
                height: '38px',
                backgroundColor: '#003b6d',
                borderBottom: '2px solid #00569e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>Mindray BC-30s</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{currentTime}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(800, 0.05);
                    setBloodMode(bloodMode === 'WHOLE_BLOOD' ? 'PREDILUTE' : 'WHOLE_BLOOD');
                  }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: bloodMode === 'WHOLE_BLOOD' ? '#0284c7' : '#d97706',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {bloodMode === 'WHOLE_BLOOD' ? 'دم كامل (Whole Blood)' : 'مخفف (Prediluted)'}
                </button>
              </div>

              {/* LIS & Hardware Sensor Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    border: '1px solid #10b981',
                  }}
                >
                  <Wifi size={12} />
                  <span>LIS: Online 5000</span>
                </div>
                <span style={{ color: '#94a3b8' }}>Temp: 24.3°C</span>
                <span style={{ color: '#94a3b8' }}>Vac: -40kPa</span>
              </div>
            </div>

            {/* 2. Sample Metadata Header */}
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#002f57',
                borderBottom: '1px solid #004d8c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                fontSize: '12px',
                color: '#e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Sample ID Input Field - Highly Prominent & Highlighted */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    backgroundColor: 'rgba(2, 132, 199, 0.25)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1.5px solid #38bdf8',
                  }}
                >
                  <span style={{ color: '#fef08a', fontWeight: 900, fontSize: '13px' }}>رقم العينة (ID):</span>
                  <input
                    type="text"
                    value={sampleId}
                    onChange={(e) => setSampleId(e.target.value)}
                    placeholder="1001"
                    title="اكتب هنا رقم العينة المسجلة في المختبر"
                    style={{
                      width: '90px',
                      height: '28px',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      border: '2px solid #facc15',
                      backgroundColor: '#001428',
                      color: '#fef08a',
                      fontWeight: 900,
                      textAlign: 'center',
                      fontSize: '15px',
                      boxShadow: '0 0 8px rgba(250, 204, 21, 0.4)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>الباركود:</span>
                  <input
                    type="text"
                    value={sampleBarcode}
                    onChange={(e) => setSampleBarcode(e.target.value)}
                    style={{
                      width: '105px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #0284c7',
                      backgroundColor: '#001e38',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSimulateScanBarcode}
                    title="مسح الباركود بالليزر"
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #38bdf8',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Barcode size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>اسم المريض:</span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #0284c7',
                      backgroundColor: '#001e38',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              {/* Sync from Labryo Reception Button */}
              <button
                type="button"
                onClick={handleFetchLatestSample}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #38bdf8',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Database size={13} />
                <span>سحب عينة من الاستقبال</span>
              </button>
            </div>

            {/* 3. Screen Body (Tab content) */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                backgroundColor: '#001e38',
              }}
            >
              {/* TAB: COUNT / MAIN ANALYSIS */}
              {activeTab === 'COUNT' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
                  {/* Left: 21 Numerical Results List */}
                  <div
                    style={{
                      flex: '0 0 460px',
                      borderLeft: '2px solid #003b6d',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                      gap: '4px',
                    }}
                  >
                    {/* Presets Selector bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, flexShrink: 0 }}>الحالات:</span>
                      {MINDRAY_CLINICAL_PRESETS.map((pr) => (
                        <button
                          key={pr.id}
                          type="button"
                          onClick={() => applyPreset(pr.id)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '4px',
                            border: `1px solid ${selectedPresetId === pr.id ? pr.badgeColor : '#334155'}`,
                            backgroundColor: selectedPresetId === pr.id ? `${pr.badgeColor}22` : '#002544',
                            color: selectedPresetId === pr.id ? pr.badgeColor : '#cbd5e1',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pr.id === 'NORMAL' ? 'سليم' : pr.id === 'ANEMIA' ? 'فقر دم' : pr.id === 'LEUKOCYTOSIS' ? 'التهاب' : pr.id === 'THROMBOCYTOPENIA' ? 'نقص صفائح' : 'احمرار'}
                        </button>
                      ))}
                    </div>

                    {/* Table Header */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 65px 75px 35px',
                        padding: '4px 6px',
                        backgroundColor: '#002f57',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 900,
                        color: '#94a3b8',
                      }}
                    >
                      <span>المعامل</span>
                      <span>الاسم</span>
                      <span style={{ textAlign: 'center' }}>القيمة</span>
                      <span style={{ textAlign: 'center' }}>المدى</span>
                      <span style={{ textAlign: 'center' }}>Flag</span>
                    </div>

                    {/* Parameters Rows */}
                    {params.map((p) => {
                      const flg = getFlag(p);
                      const isAbnormal = flg !== null;
                      return (
                        <div
                          key={p.code}
                          onClick={() => openNumpad(p.code)}
                          title="اضغط لتعديل القيمة عبر لوحة اللمس"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr 65px 75px 35px',
                            alignItems: 'center',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            backgroundColor: isAbnormal ? 'rgba(239, 68, 68, 0.08)' : '#002442',
                            border: '1px solid #003660',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'background-color 0.1s',
                          }}
                        >
                          <span style={{ fontWeight: 900, color: '#38bdf8' }}>{p.code}</span>
                          <span style={{ color: '#cbd5e1', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.nameAr}
                          </span>
                          <span
                            style={{
                              textAlign: 'center',
                              fontWeight: 900,
                              fontSize: '12px',
                              color: isAbnormal ? '#f87171' : '#ffffff',
                              backgroundColor: '#00182e',
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                          >
                            {p.value.toFixed(p.decimals)}
                          </span>
                          <span style={{ textAlign: 'center', fontSize: '9.5px', color: '#94a3b8' }}>
                            {p.minNormal}-{p.maxNormal}
                          </span>
                          <span
                            style={{
                              textAlign: 'center',
                              fontWeight: 900,
                              color: flg === 'H' ? '#ef4444' : flg === 'L' ? '#38bdf8' : '#64748b',
                            }}
                          >
                            {flg || '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: The 3 Graphic Histograms */}
                  <div
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflowY: 'auto',
                    }}
                  >
                    {/* WBC Histogram */}
                    <div
                      style={{
                        backgroundColor: '#002544',
                        border: '1px solid #00437a',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#38bdf8' }}>
                          WBC Histogram (0 - 300 fL) {wbcFlag && <span style={{ color: '#f59e0b', marginRight: '6px' }}>[{wbcFlag}]</span>}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Lymph: {getParam('Lymph%')}% | Mid: {getParam('Mid%')}% | Gran: {getParam('Gran%')}%</span>
                      </div>
                      <svg viewBox="0 0 220 90" style={{ width: '100%', height: '80px', backgroundColor: '#00172e', borderRadius: '4px' }}>
                        {/* Grid lines */}
                        <line x1="0" y1="45" x2="220" y2="45" stroke="#003157" strokeDasharray="2,2" />
                        <line x1="70" y1="0" x2="70" y2="90" stroke="#004a80" strokeDasharray="1,2" />
                        <line x1="140" y1="0" x2="140" y2="90" stroke="#004a80" strokeDasharray="1,2" />
                        {/* Discriminators */}
                        <line x1="26" y1="0" x2="26" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="28" y="12" fill="#f59e0b" fontSize="8" fontWeight="bold">R1</text>
                        <line x1="66" y1="0" x2="66" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="68" y="12" fill="#f59e0b" fontSize="8" fontWeight="bold">R2</text>
                        <line x1="117" y1="0" x2="117" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="119" y="12" fill="#f59e0b" fontSize="8" fontWeight="bold">R3</text>
                        {/* Curve */}
                        <path d={wbcHistogramPath} fill="none" stroke="#38bdf8" strokeWidth="2" />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                        <span>0 fL</span>
                        <span>100 fL</span>
                        <span>200 fL</span>
                        <span>300 fL</span>
                      </div>
                    </div>

                    {/* RBC Histogram */}
                    <div
                      style={{
                        backgroundColor: '#002544',
                        border: '1px solid #00437a',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#f87171' }}>
                          RBC Histogram (0 - 250 fL)
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>MCV: {getParam('MCV')} fL | RDW: {getParam('RDW-CV')}%</span>
                      </div>
                      <svg viewBox="0 0 220 90" style={{ width: '100%', height: '80px', backgroundColor: '#00172e', borderRadius: '4px' }}>
                        <line x1="0" y1="45" x2="220" y2="45" stroke="#003157" strokeDasharray="2,2" />
                        <line x1="88" y1="0" x2="88" y2="90" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="91" y="12" fill="#ef4444" fontSize="8" fontWeight="bold">MCV</text>
                        <path d={rbcHistogramPath} fill="none" stroke="#f87171" strokeWidth="2" />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                        <span>0 fL</span>
                        <span>80 fL</span>
                        <span>160 fL</span>
                        <span>250 fL</span>
                      </div>
                    </div>

                    {/* PLT Histogram */}
                    <div
                      style={{
                        backgroundColor: '#002544',
                        border: '1px solid #00437a',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#34d399' }}>
                          PLT Histogram (0 - 30 fL)
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>PLT: {getParam('PLT')} | MPV: {getParam('MPV')} fL</span>
                      </div>
                      <svg viewBox="0 0 220 90" style={{ width: '100%', height: '80px', backgroundColor: '#00172e', borderRadius: '4px' }}>
                        <line x1="0" y1="45" x2="220" y2="45" stroke="#003157" strokeDasharray="2,2" />
                        <line x1="15" y1="0" x2="15" y2="90" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="17" y="12" fill="#10b981" fontSize="8" fontWeight="bold">PL</text>
                        <path d={pltHistogramPath} fill="none" stroke="#34d399" strokeWidth="2" />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                        <span>0 fL</span>
                        <span>10 fL</span>
                        <span>20 fL</span>
                        <span>30 fL</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: REAGENTS */}
              {activeTab === 'REAGENTS' && (
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', color: '#ffffff' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8' }}>حالة الكواشف والمحاليل (Reagent Management)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>M-30D Diluent (مخفف)</span>
                      <div style={{ height: '12px', backgroundColor: '#00172e', borderRadius: '999px', overflow: 'hidden', margin: '10px 0' }}>
                        <div style={{ width: `${reagentDiluent}%`, height: '100%', backgroundColor: '#0284c7' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>المتبقي:</span>
                        <strong>{reagentDiluent}%</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReagentDiluent(100);
                          sfx.beep(880, 0.08);
                          toast.success('تم استبدال وتجهيز عبوة المخفف بنجاح');
                        }}
                        style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #38bdf8', backgroundColor: '#0369a1', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      >
                        تركيب عبوة جديدة (Lot #2611A)
                      </button>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>M-30CFL Lyse (محلل الكريات)</span>
                      <div style={{ height: '12px', backgroundColor: '#00172e', borderRadius: '999px', overflow: 'hidden', margin: '10px 0' }}>
                        <div style={{ width: `${reagentLyse}%`, height: '100%', backgroundColor: '#e11d48' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>المتبقي:</span>
                        <strong>{reagentLyse}%</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReagentLyse(100);
                          sfx.beep(880, 0.08);
                          toast.success('تم تجديد كاشف Lyse');
                        }}
                        style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #fb7185', backgroundColor: '#be123c', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      >
                        تركيب عبوة جديدة (Lot #2611L)
                      </button>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>Probe Cleanser (منظف المجس)</span>
                      <div style={{ height: '12px', backgroundColor: '#00172e', borderRadius: '999px', overflow: 'hidden', margin: '10px 0' }}>
                        <div style={{ width: `${reagentRinse}%`, height: '100%', backgroundColor: '#10b981' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>المتبقي:</span>
                        <strong>{reagentRinse}%</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReagentRinse(100);
                          sfx.beep(880, 0.08);
                          toast.success('تم ملء منظف المجس');
                        }}
                        style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #34d399', backgroundColor: '#047857', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ملء المنظف (Lot #2611C)
                      </button>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>Waste Container (خزان الفضلات)</span>
                      <div style={{ height: '12px', backgroundColor: '#00172e', borderRadius: '999px', overflow: 'hidden', margin: '10px 0' }}>
                        <div style={{ width: `${wasteLevel}%`, height: '100%', backgroundColor: wasteLevel > 80 ? '#dc2626' : '#f59e0b' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>الامتلاء:</span>
                        <strong>{wasteLevel}%</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWasteLevel(0);
                          sfx.beep(880, 0.08);
                          toast.success('تم إفراغ خزان الفضلات');
                        }}
                        style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #fbbf24', backgroundColor: '#b45309', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      >
                        تفريغ خزان الفضلات
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MAINTENANCE */}
              {activeTab === 'MAINTENANCE' && (
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', color: '#ffffff' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8' }}>الصيانة الدورية والغسيل اليومي</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#38bdf8' }}>غسيل الفتحات (Flush Apertures)</h4>
                      <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        ضخ كمية من المخفف تحت ضغط عالي عبر فتحتي WBC و RBC لإزالة أي شوائب عالقة.
                      </p>
                      <button
                        type="button"
                        onClick={handleFlushApertures}
                        style={{ marginTop: '12px', padding: '8px 14px', borderRadius: '6px', backgroundColor: '#0284c7', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                      >
                        تشغيل الغسيل الآن (Flush)
                      </button>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#f59e0b' }}>حرق الجهد العالي (High Voltage Zap)</h4>
                      <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        تطبيق نبضة جهد كهربي سريع لحرق وإزالة رواسب البروتينات المتكلسة على جدار فتحة القياس.
                      </p>
                      <button
                        type="button"
                        onClick={handleZapAperture}
                        style={{ marginTop: '12px', padding: '8px 14px', borderRadius: '6px', backgroundColor: '#d97706', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                      >
                        تطبيق التفريغ الكهربي (Zap)
                      </button>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#34d399' }}>تنظيف مجس السحب (Probe Cleanser)</h4>
                      <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        غمر إبرة الشفط بمحلول المكلور القلوي لتطهير المجرى ومنع التلوث المتبادل بين العينات.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.suction();
                          toast.success('تم تشغيل دورة تطهير المجس');
                        }}
                        style={{ marginTop: '12px', padding: '8px 14px', borderRadius: '6px', backgroundColor: '#059669', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                      >
                        بدء تطهير المجس
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: LIS SETUP */}
              {activeTab === 'COMM' && (
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', color: '#ffffff' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8' }}>إعدادات الربط الشبكي بالـ LIS (HL7 over LAN TCP/IP)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>معلمات الاتصال بحاسوب السيرفر (Host Server IP)</span>
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '3px' }}>عنوان الـ IP لحاسوب المختبر:</label>
                          <input type="text" readOnly value="127.0.0.1 (Local LIMS)" style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#00172e', border: '1px solid #004d8c', color: '#34d399', fontWeight: 800 }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '3px' }}>منفذ الاستماع (Port):</label>
                          <input type="text" readOnly value="5000" style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#00172e', border: '1px solid #004d8c', color: '#34d399', fontWeight: 800 }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '3px' }}>بروتوكول النقل:</label>
                          <input type="text" readOnly value="HL7 v2.3.1 (ORU^R01 / MLLP)" style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#00172e', border: '1px solid #004d8c', color: '#38bdf8', fontWeight: 800 }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#002b4d', border: '1px solid #004d8c' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>خصائص الإرسال التلقائي (Auto-Transmission)</span>
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked readOnly />
                          <span>إرسال النتائج تلقائياً بمجرد اكتمال الفحص (Auto Send)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked readOnly />
                          <span>تضمين المنحنيات البيانية الثلاثية في حزمة البيانات</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked readOnly />
                          <span>تضمين علامات التنبيه الحيوية (Panic / Flags: H/L/R1..R4)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: HL7 TERMINAL */}
              {activeTab === 'HL7_TERMINAL' && (
                <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#001124', color: '#f8fafc', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={16} color="#34d399" />
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#34d399' }}>شاشة كونسول حزم HL7 MLLP الحية اللحظية</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHl7Logs([])}
                      style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                    >
                      مسح السجل
                    </button>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#000a14',
                      borderRadius: '6px',
                      border: '1px solid #1e293b',
                      padding: '8px',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '11px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {hl7Logs.length === 0 ? (
                      <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                        لا توجد رسائل بعد. اضغط على زر السحب (Aspirate) لتشغيل دورة التحليل وإرسال رسالة HL7.
                      </div>
                    ) : (
                      hl7Logs.map((log) => (
                        <div key={log.id} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                          <span style={{ color: '#64748b' }}>[{log.time}]</span>
                          <span
                            style={{
                              color: log.direction === 'TX' ? '#38bdf8' : '#34d399',
                              fontWeight: 'bold',
                            }}
                          >
                            [{log.direction}] {log.segment}:
                          </span>
                          <span style={{ color: log.direction === 'TX' ? '#e2e8f0' : '#86efac', wordBreak: 'break-all' }}>
                            {log.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Touchscreen Bottom Navigation Bar (Mindray OS Submenus) */}
            <div
              style={{
                height: '42px',
                backgroundColor: '#00335e',
                borderTop: '2px solid #004d8c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(800, 0.04);
                    setActiveTab('COUNT');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: activeTab === 'COUNT' ? '#0284c7' : 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  التحليل والنتائج (Count)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(800, 0.04);
                    setActiveTab('REAGENTS');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: activeTab === 'REAGENTS' ? '#0284c7' : 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  الكواشف (Reagents)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(800, 0.04);
                    setActiveTab('MAINTENANCE');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: activeTab === 'MAINTENANCE' ? '#0284c7' : 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  الصيانة والغسيل
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(800, 0.04);
                    setActiveTab('COMM');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: activeTab === 'COMM' ? '#0284c7' : 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  إعدادات LIS
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(800, 0.04);
                    setActiveTab('HL7_TERMINAL');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: activeTab === 'HL7_TERMINAL' ? '#059669' : 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Terminal size={13} />
                  <span>سجل HL7 المباشر</span>
                </button>
              </div>

              {/* Print Receipt Button */}
              {thermalReceipt && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.beep(900, 0.05);
                    setShowThermalModal(true);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#475569',
                    border: '1px solid #64748b',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Printer size={13} />
                  <span>معاينة شريط الطابعة الحرارية</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* LOWER PHYSICAL HARDWARE BAR (PROBE, ASPIRATE BUTTON, LED) */}
          {/* ========================================================= */}
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: '#d1dce5',
              borderTop: '3px solid #b0c0cf',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            {/* Left Probe Module Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Interactive Physical Aspirate Button */}
              <button
                type="button"
                onClick={handleStartAspiration}
                disabled={isAspirating}
                title="اضغط لسحب العينة وبدء دورة العد (Aspirate Key)"
                style={{
                  height: '48px',
                  padding: '0 24px',
                  borderRadius: '999px',
                  background: isAspirating
                    ? 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)'
                    : 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  border: '3px solid #047857',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: isAspirating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transform: isAspirating ? 'scale(0.98)' : 'scale(1)',
                  transition: 'all 0.15s',
                }}
              >
                <Play size={18} fill="#ffffff" />
                <span>{isAspirating ? 'جاري السحب والتحليل...' : 'زر السحب الفيزيائي (Aspirate)'}</span>
              </button>

              {/* Tube Docking Visual Widget */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  onClick={() => setTubeLoaded(!tubeLoaded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #94a3b8',
                    backgroundColor: tubeLoaded ? '#f8fafc' : '#fee2e2',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '34px',
                      borderRadius: '4px',
                      backgroundColor: tubeLoaded ? '#9333ea' : '#94a3b8',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    {tubeLoaded && (
                      <div style={{ height: '22px', backgroundColor: '#7f1d1d', borderRadius: '0 0 3px 3px' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#334155' }}>
                      {tubeLoaded ? 'أنبوبة الدم راكبة (EDTA)' : 'لا توجد أنبوبة'}
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#64748b' }}>اضغط لتركيب/نزع الأنبوبة</span>
                  </div>
                </div>

                {/* Probe Needle Graphic */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '4px', height: '28px', backgroundColor: '#94a3b8', borderRadius: '1px' }} />
                  <div style={{ width: '10px', height: '6px', backgroundColor: '#475569', borderRadius: '2px' }} />
                  <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 800, marginTop: '2px' }}>مجس السحب</span>
                </div>
              </div>
            </div>

            {/* Run Progress Stage Display */}
            {isAspirating && (
              <div style={{ flex: 1, maxWidth: '340px', margin: '0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#0369a1', marginBottom: '3px' }}>
                  <span>{runStage}</span>
                  <span>{runProgress}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#cbd5e1', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${runProgress}%`, height: '100%', backgroundColor: '#0284c7', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {/* Open in Reception Link */}
            {onOpenSampleInReception && (
              <button
                type="button"
                onClick={() => onOpenSampleInReception(Number(toEnglishDigits(sampleId)) || 1001)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0369a1',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>عرض العينة في استقبال المختبر</span>
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE PANEL: LIVE THERMAL PAPER & LABRYO SYNC GUIDE */}
        {/* ========================================================= */}
        <div
          style={{
            flex: '0 0 280px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Thermal Receipt Roll Widget */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#fffbeb',
              borderRadius: '16px',
              border: '2px solid #fef3c7',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: 'Consolas, monospace',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #d97706', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 900, fontSize: '12px' }}>
                <Printer size={15} />
                <span>طابعة التكت الحرارية 57mm</span>
              </div>
              <span style={{ fontSize: '10px', color: '#92400e' }}>ورق حراري</span>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                fontSize: '10.5px',
                lineHeight: 1.35,
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {thermalReceipt || generateThermalReceiptText({ sampleId, sampleBarcode, patientName, timeStr: currentTime, params })}
            </div>
          </div>

          {/* Quick Technical Summary */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '11.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 800 }}>
              <CheckCircle2 size={14} />
              <span>الربط جاهز ومطابق بنسبة 100%</span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.4, color: '#94a3b8' }}>
              عند ربط الجهاز الحقيقي في المختبر بكابل LAN، كل ما عليك هو ضبط Server IP والمنفذ 5000؛ وستصل النتائج للبرنامج بنفس الهيئة تماماً!
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TOUCH NUMERIC KEYPAD MODAL (TOUCHSCREEN NUMPAD)           */}
      {/* ========================================================= */}
      {editingParamCode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '280px',
              backgroundColor: '#002544',
              borderRadius: '16px',
              border: '3px solid #0284c7',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>
                تعديل معامل [{editingParamCode}]
              </span>
              <button
                type="button"
                onClick={() => setEditingParamCode(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#001222',
                border: '1px solid #004d8c',
                fontSize: '24px',
                fontWeight: 900,
                textAlign: 'center',
                color: '#34d399',
                fontFamily: 'monospace',
                minHeight: '44px',
              }}
            >
              {keypadValue || '0'}
            </div>

            {/* Keypad Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BS'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadKey(k)}
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#003a6c',
                    border: '1px solid #00569e',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  {k === 'BS' ? '⌫' : k}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleKeypadKey('C')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#475569',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                تفريغ (Clear)
              </button>
              <button
                type="button"
                onClick={handleKeypadSave}
                style={{
                  flex: 2,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                حفظ القيمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* THERMAL PAPER MODAL                                       */}
      {/* ========================================================= */}
      {showThermalModal && thermalReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '380px',
              maxHeight: '90vh',
              backgroundColor: '#fffdf5',
              borderRadius: '16px',
              border: '2px solid #fcd34d',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: 'Consolas, monospace',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 900 }}>
                <Printer size={18} />
                <span>إيصال الطابعة الحرارية (Mindray 57mm)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowThermalModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                fontSize: '11px',
                lineHeight: 1.4,
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                backgroundColor: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #fde68a',
              }}
            >
              {thermalReceipt}
            </div>

            <button
              type="button"
              onClick={() => {
                sfx.beep(880, 0.08);
                window.print();
              }}
              style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Printer size={16} />
              <span>طباعة تكت حراري حقيقي</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
