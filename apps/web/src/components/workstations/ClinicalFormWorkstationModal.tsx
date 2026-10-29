'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  RotateCcw,
  Activity,
  Microscope,
  Droplets,
  Gem,
  TrendingUp,
  User,
  FileText,
} from 'lucide-react';
import type { SpecializedClinicalFormType } from '../../lib/testClassifier';

export type { SpecializedClinicalFormType };

export interface ClinicalFormWorkstationModalProps {
  isOpen: boolean;
  formType: SpecializedClinicalFormType;
  patientName?: string;
  sampleId?: string;
  testCode?: string;
  testName?: string;
  initialJsonValue?: string;
  onSave: (jsonString: string) => void;
  onClose: () => void;
}

export interface BloodFilmPayload {
  _formType: 'BLOOD_FILM';
  rbcMorphology: string;
  wbcMorphology: string;
  plateletsMorphology: string;
  parasites: string;
  impression: string;
  notes?: string;
}

export interface BodyFluidPayload {
  _formType: 'BODY_FLUID';
  fluidType: string;
  volume: string;
  color: string;
  appearance: string;
  coagulum: string;
  protein: string;
  glucose: string;
  ldh: string;
  albumin: string;
  globulin: string;
  wbcCount: string;
  neutrophils: string;
  lymphocytes: string;
  rbcCount: string;
  gramStain: string;
  znStain: string;
  notes: string;
}

export interface StoneAnalysisPayload {
  _formType: 'STONE_ANALYSIS';
  stoneCount: string;
  weight: string;
  size: string;
  color: string;
  surface: string;
  consistency: string;
  calciumOxalate: string;
  uricAcid: string;
  calciumPhosphate: string;
  struvite: string;
  cystine: string;
  ammonium: string;
  carbonate: string;
  primaryType: string;
  notes: string;
}

export interface CoagProfilePayload {
  _formType: 'COAG_PROFILE';
  ptPatient: string;
  ptControl: string;
  isi: string;
  inr: string;
  aptt: string;
  bleedingTime: string;
  clottingTime: string;
  notes: string;
}

export interface OgttCurvePayload {
  _formType: 'OGTT_CURVE';
  fastingBlood: string;
  fastingUrine: string;
  hour05Blood: string;
  hour05Urine: string;
  hour1Blood: string;
  hour1Urine: string;
  hour2Blood: string;
  hour2Urine: string;
  hour3Blood: string;
  hour3Urine: string;
  interpretation: string;
  notes?: string;
}

function detectDefaultFluidType(testCode?: string, testName?: string): string {
  const combined = `${testCode || ''} ${testName || ''}`.toUpperCase();
  if (combined.includes('PLEURAL') || combined.includes('جنب')) return 'Pleural';
  if (combined.includes('ASCIT') || combined.includes('PERITONEAL') || combined.includes('استسقاء')) return 'Ascitic';
  if (combined.includes('SYNOVIAL') || combined.includes('JOINT') || combined.includes('مفصل')) return 'Synovial';
  return 'CSF';
}

const BLOOD_FILM_CHIPS = {
  rbc: [
    'Normocytic normochromic RBCs',
    'Microcytic hypochromic RBCs',
    'Anisopoikilocytosis',
    'Target cells & Tear drop cells seen',
    'Polychromasia noted',
  ],
  wbc: [
    'Normal total count & normal differential distribution',
    'Neutrophilic leukocytosis with toxic granulation',
    'Relative lymphocytosis with reactive lymphocytes',
    'Left shift noted',
  ],
  platelets: [
    'Adequate on smear, normal morphology, no clumps',
    'Mild thrombocytopenia',
    'Marked thrombocytosis',
    'Giant platelets seen',
  ],
  parasites: [
    'No malaria or blood parasites seen',
    'Ring stages of Plasmodium vivax seen',
    'Ring stages of Plasmodium falciparum seen',
  ],
  impression: [
    'Essentially normal peripheral blood film',
    'Picture suggestive of Iron Deficiency Anemia',
    'Picture suggestive of Thalassemia Trait',
    'Picture suggestive of Acute Bacterial Infection',
  ],
};

const FORM_META: Record<
  SpecializedClinicalFormType,
  {
    titleAr: string;
    titleEn: string;
    badge: string;
    gradient: string;
    quickFillLabel: string;
  }
> = {
  BLOOD_FILM: {
    titleAr: 'فحص مسحة الدم المحيطية (Blood Film Morphology)',
    titleEn: 'Peripheral Blood Smear & Differential Morphology Workstation',
    badge: 'Hematology Morphology',
    gradient: 'from-rose-700 via-red-800 to-slate-900',
    quickFillLabel: 'تعبئة طبيعية سريعة (Quick Normal Fill)',
  },
  BODY_FLUID: {
    titleAr: 'تحليل سوائل الجسم الشامل (Body Fluid Analysis)',
    titleEn: 'CSF / Pleural / Ascitic / Synovial Fluid Workstation',
    badge: 'Clinical Pathology & Cytology',
    gradient: 'from-cyan-700 via-teal-800 to-slate-900',
    quickFillLabel: 'تعبئة طبيعية سريعة (Quick Normal Fill)',
  },
  STONE_ANALYSIS: {
    titleAr: 'تحليل حصى الكلى والمسالك البولية (Stone Analysis)',
    titleEn: 'Renal & Urinary Calculi Physical & Chemical Composition',
    badge: 'Urolithiasis Biochemistry',
    gradient: 'from-amber-700 via-orange-800 to-slate-900',
    quickFillLabel: 'تعبئة نموذجية (Quick Fill)',
  },
  COAG_PROFILE: {
    titleAr: 'ملف تخثر الدم الشامل (Coagulation Profile)',
    titleEn: 'PT, Auto-INR, aPTT, Bleeding Time & Clotting Time Workstation',
    badge: 'Hemostasis & Coagulation',
    gradient: 'from-indigo-700 via-blue-800 to-slate-900',
    quickFillLabel: 'تعبئة طبيعية سريعة (Quick Normal Fill)',
  },
  OGTT_CURVE: {
    titleAr: 'منحنى تحمل السكر الفموي (OGTT Curve)',
    titleEn: 'Multi-Point Oral Glucose Tolerance Blood & Urine Curve',
    badge: 'Endocrinology & Diabetes',
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
    quickFillLabel: 'تعبئة منحنى طبيعي (Quick Normal Curve)',
  },
};

export function ClinicalFormWorkstationModal({
  isOpen,
  formType,
  patientName,
  sampleId,
  testCode,
  testName,
  initialJsonValue,
  onSave,
  onClose,
}: ClinicalFormWorkstationModalProps) {
  // 1. BLOOD_FILM state
  const [bloodFilm, setBloodFilm] = useState<BloodFilmPayload>({
    _formType: 'BLOOD_FILM',
    rbcMorphology: 'Normocytic normochromic RBCs',
    wbcMorphology: 'Normal total count & normal differential distribution',
    plateletsMorphology: 'Adequate on smear, normal morphology, no clumps',
    parasites: 'No malaria or blood parasites seen',
    impression: 'Essentially normal peripheral blood film',
    notes: '',
  });

  // 2. BODY_FLUID state
  const [bodyFluid, setBodyFluid] = useState<BodyFluidPayload>(() => ({
    _formType: 'BODY_FLUID',
    fluidType: detectDefaultFluidType(testCode, testName),
    volume: '3 mL',
    color: 'Colorless',
    appearance: 'Clear',
    coagulum: 'Absent',
    protein: '28',
    glucose: '55',
    ldh: '18',
    albumin: '1.8',
    globulin: 'Negative',
    wbcCount: '2',
    neutrophils: '0',
    lymphocytes: '100',
    rbcCount: '0',
    gramStain: 'No organisms seen',
    znStain: 'No AFB seen',
    notes: '',
  }));

  // 3. STONE_ANALYSIS state
  const [stone, setStone] = useState<StoneAnalysisPayload>({
    _formType: 'STONE_ANALYSIS',
    stoneCount: '1',
    weight: '120 mg',
    size: '5 x 4 mm',
    color: 'Brown',
    surface: 'Rough',
    consistency: 'Hard',
    calciumOxalate: '80%',
    uricAcid: '0%',
    calciumPhosphate: '20%',
    struvite: '0%',
    cystine: 'Negative',
    ammonium: 'Negative',
    carbonate: 'Negative',
    primaryType: 'Calcium Oxalate Stone',
    notes: '',
  });

  // 4. COAG_PROFILE state
  const [coag, setCoag] = useState<CoagProfilePayload>({
    _formType: 'COAG_PROFILE',
    ptPatient: '12.5',
    ptControl: '12.0',
    isi: '1.1',
    inr: '1.05',
    aptt: '30.0',
    bleedingTime: '3.5',
    clottingTime: '7.0',
    notes: '',
  });

  // 5. OGTT_CURVE state
  const [ogtt, setOgtt] = useState<OgttCurvePayload>({
    _formType: 'OGTT_CURVE',
    fastingBlood: '88',
    fastingUrine: 'Nil',
    hour05Blood: '132',
    hour05Urine: 'Nil',
    hour1Blood: '148',
    hour1Urine: 'Nil',
    hour2Blood: '112',
    hour2Urine: 'Nil',
    hour3Blood: '86',
    hour3Urine: 'Nil',
    interpretation: 'Normal Glucose Tolerance Curve',
    notes: '',
  });

  // Load initial JSON value when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const detectedFluid = detectDefaultFluidType(testCode, testName);
    setBodyFluid((prev) => ({ ...prev, fluidType: prev.fluidType || detectedFluid }));

    if (!initialJsonValue || !initialJsonValue.trim()) return;
    try {
      const parsed = JSON.parse(initialJsonValue);
      if (!parsed || typeof parsed !== 'object') return;

      if (formType === 'BLOOD_FILM') {
        setBloodFilm((prev) => ({ ...prev, ...parsed, _formType: 'BLOOD_FILM' }));
      } else if (formType === 'BODY_FLUID') {
        setBodyFluid((prev) => ({
          ...prev,
          fluidType: detectedFluid,
          ...parsed,
          _formType: 'BODY_FLUID',
        }));
      } else if (formType === 'STONE_ANALYSIS') {
        setStone((prev) => ({ ...prev, ...parsed, _formType: 'STONE_ANALYSIS' }));
      } else if (formType === 'COAG_PROFILE') {
        setCoag((prev) => ({ ...prev, ...parsed, _formType: 'COAG_PROFILE' }));
      } else if (formType === 'OGTT_CURVE') {
        setOgtt((prev) => ({ ...prev, ...parsed, _formType: 'OGTT_CURVE' }));
      }
    } catch {
      // Ignore malformed or plain-text legacy value
    }
  }, [isOpen, formType, initialJsonValue, testCode, testName]);

  // Dynamic INR calculation whenever ptPatient, ptControl, or isi changes
  useEffect(() => {
    const ptP = parseFloat(coag.ptPatient);
    const ptC = parseFloat(coag.ptControl);
    const isiVal = parseFloat(coag.isi);
    if (!isNaN(ptP) && ptP > 0 && !isNaN(ptC) && ptC > 0 && !isNaN(isiVal) && isiVal > 0) {
      const computedInr = Math.pow(ptP / ptC, isiVal).toFixed(2);
      setCoag((prev) => (prev.inr === computedInr ? prev : { ...prev, inr: computedInr }));
    }
  }, [coag.ptPatient, coag.ptControl, coag.isi]);

  if (!isOpen) return null;

  const meta = FORM_META[formType];

  const handleQuickNormalFill = () => {
    if (formType === 'BLOOD_FILM') {
      setBloodFilm({
        _formType: 'BLOOD_FILM',
        rbcMorphology: 'Normocytic normochromic RBCs',
        wbcMorphology: 'Normal total count & normal differential distribution',
        plateletsMorphology: 'Adequate on smear, normal morphology, no clumps',
        parasites: 'No malaria or blood parasites seen',
        impression: 'Essentially normal peripheral blood film',
        notes: '',
      });
    } else if (formType === 'BODY_FLUID') {
      const ft = detectDefaultFluidType(testCode, testName);
      setBodyFluid({
        _formType: 'BODY_FLUID',
        fluidType: ft,
        volume: ft === 'CSF' ? '3 mL' : '15 mL',
        color: ft === 'CSF' ? 'Colorless' : 'Straw',
        appearance: 'Clear',
        coagulum: 'Absent',
        protein: ft === 'CSF' ? '28' : '2.1',
        glucose: '58',
        ldh: ft === 'CSF' ? '18' : '95',
        albumin: ft === 'CSF' ? '15' : '1.4',
        globulin: 'Negative',
        wbcCount: '2',
        neutrophils: '0',
        lymphocytes: '100',
        rbcCount: '0',
        gramStain: 'No organisms seen',
        znStain: 'No AFB seen',
        notes: '',
      });
    } else if (formType === 'STONE_ANALYSIS') {
      setStone({
        _formType: 'STONE_ANALYSIS',
        stoneCount: '1',
        weight: '120 mg',
        size: '5 x 4 mm',
        color: 'Brown',
        surface: 'Rough',
        consistency: 'Hard',
        calciumOxalate: '80%',
        uricAcid: '0%',
        calciumPhosphate: '20%',
        struvite: '0%',
        cystine: 'Negative',
        ammonium: 'Negative',
        carbonate: 'Negative',
        primaryType: 'Calcium Oxalate Stone',
        notes: '',
      });
    } else if (formType === 'COAG_PROFILE') {
      const ptP = '12.4';
      const ptC = '12.0';
      const isiVal = '1.1';
      const inrVal = Math.pow(Number(ptP) / Number(ptC), Number(isiVal)).toFixed(2);
      setCoag({
        _formType: 'COAG_PROFILE',
        ptPatient: ptP,
        ptControl: ptC,
        isi: isiVal,
        inr: inrVal,
        aptt: '29.5',
        bleedingTime: '3.0',
        clottingTime: '6.5',
        notes: '',
      });
    } else if (formType === 'OGTT_CURVE') {
      setOgtt({
        _formType: 'OGTT_CURVE',
        fastingBlood: '86',
        fastingUrine: 'Nil',
        hour05Blood: '130',
        hour05Urine: 'Nil',
        hour1Blood: '145',
        hour1Urine: 'Nil',
        hour2Blood: '108',
        hour2Urine: 'Nil',
        hour3Blood: '84',
        hour3Urine: 'Nil',
        interpretation: 'Normal Glucose Tolerance Curve',
        notes: '',
      });
    }
  };

  const handleSave = () => {
    if (formType === 'BLOOD_FILM') {
      onSave(JSON.stringify({ ...bloodFilm, _formType: 'BLOOD_FILM' }));
    } else if (formType === 'BODY_FLUID') {
      onSave(JSON.stringify({ ...bodyFluid, _formType: 'BODY_FLUID' }));
    } else if (formType === 'STONE_ANALYSIS') {
      onSave(JSON.stringify({ ...stone, _formType: 'STONE_ANALYSIS' }));
    } else if (formType === 'COAG_PROFILE') {
      onSave(JSON.stringify({ ...coag, _formType: 'COAG_PROFILE' }));
    } else if (formType === 'OGTT_CURVE') {
      onSave(JSON.stringify({ ...ogtt, _formType: 'OGTT_CURVE' }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${meta.gradient} text-white`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              {formType === 'BLOOD_FILM' && <Microscope className="w-5 h-5 text-rose-200" />}
              {formType === 'BODY_FLUID' && <Droplets className="w-5 h-5 text-cyan-200" />}
              {formType === 'STONE_ANALYSIS' && <Gem className="w-5 h-5 text-amber-200" />}
              {formType === 'COAG_PROFILE' && <Activity className="w-5 h-5 text-indigo-200" />}
              {formType === 'OGTT_CURVE' && <TrendingUp className="w-5 h-5 text-emerald-200" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{meta.titleAr}</h2>
                <span className="text-[11px] font-semibold bg-white/15 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                  {meta.badge}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">{meta.titleEn}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickNormalFill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{meta.quickFillLabel}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Patient & Sample Info Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>المريض: {patientName || 'غير محدد'}</span>
            </div>
            {sampleId && (
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="text-slate-500">رقم العينة:</span>
                <span className="font-bold text-slate-800" dir="ltr">
                  {sampleId}
                </span>
              </div>
            )}
            {(testCode || testName) && (
              <div className="flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-md font-semibold">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span dir="ltr">{testCode ? `${testCode} — ${testName || ''}` : testName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* 1. BLOOD_FILM */}
          {formType === 'BLOOD_FILM' && (
            <div className="space-y-5">
              {/* RBC Morphology */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  شكل كريات الدم الحمراء (RBC Morphology)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_FILM_CHIPS.rbc.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBloodFilm((p) => ({ ...p, rbcMorphology: chip }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        bloodFilm.rbcMorphology === chip
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                      }`}
                      dir="ltr"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={bloodFilm.rbcMorphology}
                  onChange={(e) => setBloodFilm((p) => ({ ...p, rbcMorphology: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="RBC Morphology description..."
                />
              </div>

              {/* WBC Morphology */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  شكل وتوزيع كريات الدم البيضاء (WBC Morphology & Differential)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_FILM_CHIPS.wbc.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBloodFilm((p) => ({ ...p, wbcMorphology: chip }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        bloodFilm.wbcMorphology === chip
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                      }`}
                      dir="ltr"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={bloodFilm.wbcMorphology}
                  onChange={(e) => setBloodFilm((p) => ({ ...p, wbcMorphology: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="WBC Morphology description..."
                />
              </div>

              {/* Platelets Morphology */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  الصفائح الدموية (Platelets Morphology)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_FILM_CHIPS.platelets.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBloodFilm((p) => ({ ...p, plateletsMorphology: chip }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        bloodFilm.plateletsMorphology === chip
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                      }`}
                      dir="ltr"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={bloodFilm.plateletsMorphology}
                  onChange={(e) => setBloodFilm((p) => ({ ...p, plateletsMorphology: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Platelets Morphology description..."
                />
              </div>

              {/* Blood Parasites */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  طفيليات الدم (Blood Parasites / Malaria)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_FILM_CHIPS.parasites.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBloodFilm((p) => ({ ...p, parasites: chip }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        bloodFilm.parasites === chip
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                      }`}
                      dir="ltr"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={bloodFilm.parasites}
                  onChange={(e) => setBloodFilm((p) => ({ ...p, parasites: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Blood parasites..."
                />
              </div>

              {/* Impression / Diagnosis */}
              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-2.5">
                <label className="block text-xs font-bold text-rose-900">
                  الانطباع التشخيصي والتوصيات (Diagnostic Impression)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_FILM_CHIPS.impression.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBloodFilm((p) => ({ ...p, impression: chip }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        bloodFilm.impression === chip
                          ? 'bg-rose-700 text-white border-rose-700 font-bold'
                          : 'bg-white text-slate-700 border-rose-200 hover:border-rose-400'
                      }`}
                      dir="ltr"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  dir="ltr"
                  value={bloodFilm.impression}
                  onChange={(e) => setBloodFilm((p) => ({ ...p, impression: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Diagnostic impression..."
                />
              </div>
            </div>
          )}

          {/* 2. BODY_FLUID */}
          {formType === 'BODY_FLUID' && (
            <div className="space-y-6">
              {/* Physical Examination */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-cyan-800 border-b border-slate-200 pb-2">
                  1. الفحص الفيزيائي (Physical Examination)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      نوع السائل (Fluid Type)
                    </label>
                    <select
                      dir="ltr"
                      value={bodyFluid.fluidType}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, fluidType: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="CSF">CSF</option>
                      <option value="Pleural">Pleural</option>
                      <option value="Ascitic">Ascitic</option>
                      <option value="Synovial">Synovial</option>
                      <option value="Pericardial">Pericardial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      الحجم (Volume)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.volume}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, volume: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      placeholder="e.g. 3 mL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      اللون (Color)
                    </label>
                    <select
                      dir="ltr"
                      value={bodyFluid.color}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, color: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Colorless">Colorless</option>
                      <option value="Straw">Straw</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Turbid">Turbid</option>
                      <option value="Bloody">Bloody</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      المظهر (Appearance)
                    </label>
                    <select
                      dir="ltr"
                      value={bodyFluid.appearance}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, appearance: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Clear">Clear</option>
                      <option value="Slightly Turbid">Slightly Turbid</option>
                      <option value="Turbid">Turbid</option>
                      <option value="Xanthochromic">Xanthochromic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      الخثرة (Coagulum)
                    </label>
                    <select
                      dir="ltr"
                      value={bodyFluid.coagulum}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, coagulum: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Absent">Absent</option>
                      <option value="Present">Present</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chemical Analysis */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-cyan-800 border-b border-slate-200 pb-2">
                  2. الفحص الكيميائي (Chemical Analysis)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Protein (mg/dL or g/dL)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.protein}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, protein: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Glucose (mg/dL)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.glucose}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, glucose: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      LDH (U/L)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.ldh}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, ldh: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Albumin (g/dL)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.albumin}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, albumin: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Globulin (Pandy)
                    </label>
                    <select
                      dir="ltr"
                      value={bodyFluid.globulin}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, globulin: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Microscopic Analysis */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-cyan-800 border-b border-slate-200 pb-2">
                  3. الفحص المجهري والخلوي (Microscopic & Cytology Analysis)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      WBC Count (cells/µL)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.wbcCount}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, wbcCount: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Neutrophils (%)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.neutrophils}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, neutrophils: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Lymphocytes (%)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.lymphocytes}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, lymphocytes: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      RBC Count (cells/µL)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.rbcCount}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, rbcCount: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Gram Stain
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.gramStain}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, gramStain: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ziehl-Neelsen (ZN) Stain
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.znStain}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, znStain: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ملاحظات إضافية (Notes)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={bodyFluid.notes}
                      onChange={(e) => setBodyFluid((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      placeholder="Optional clinical notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. STONE_ANALYSIS */}
          {formType === 'STONE_ANALYSIS' && (
            <div className="space-y-6">
              {/* Physical Properties */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-amber-800 border-b border-slate-200 pb-2">
                  1. الخواص الفيزيائية للحصى (Physical Properties)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      العدد (Count)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.stoneCount}
                      onChange={(e) => setStone((p) => ({ ...p, stoneCount: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      الوزن (Weight)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.weight}
                      onChange={(e) => setStone((p) => ({ ...p, weight: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      placeholder="e.g. 120 mg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      الحجم (Size mm)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.size}
                      onChange={(e) => setStone((p) => ({ ...p, size: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      placeholder="e.g. 5 mm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      اللون (Color)
                    </label>
                    <select
                      dir="ltr"
                      value={stone.color}
                      onChange={(e) => setStone((p) => ({ ...p, color: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Brown">Brown</option>
                      <option value="Dark Brown">Dark Brown</option>
                      <option value="Yellow-Brown">Yellow-Brown</option>
                      <option value="White-Chalky">White-Chalky</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      السطح (Surface)
                    </label>
                    <select
                      dir="ltr"
                      value={stone.surface}
                      onChange={(e) => setStone((p) => ({ ...p, surface: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Rough">Rough</option>
                      <option value="Mulberry">Mulberry</option>
                      <option value="Smooth">Smooth</option>
                      <option value="Spiculated">Spiculated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      الصلابة (Consistency)
                    </label>
                    <select
                      dir="ltr"
                      value={stone.consistency}
                      onChange={(e) => setStone((p) => ({ ...p, consistency: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Hard">Hard</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Friable">Friable</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chemical Composition */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-amber-800 border-b border-slate-200 pb-2">
                  2. التركيب الكيميائي (Chemical Composition)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-600">
                        Calcium Oxalate (%)
                      </label>
                      <div className="flex gap-1" dir="ltr">
                        {['80%', '60%', '0%'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setStone((p) => ({ ...p, calciumOxalate: opt }))}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.calciumOxalate}
                      onChange={(e) => setStone((p) => ({ ...p, calciumOxalate: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Uric Acid (%)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.uricAcid}
                      onChange={(e) => setStone((p) => ({ ...p, uricAcid: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Calcium Phosphate (%)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.calciumPhosphate}
                      onChange={(e) => setStone((p) => ({ ...p, calciumPhosphate: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Struvite (Mg Ammonium Phos %)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.struvite}
                      onChange={(e) => setStone((p) => ({ ...p, struvite: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Cystine
                    </label>
                    <select
                      dir="ltr"
                      value={stone.cystine}
                      onChange={(e) => setStone((p) => ({ ...p, cystine: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ammonium
                    </label>
                    <select
                      dir="ltr"
                      value={stone.ammonium}
                      onChange={(e) => setStone((p) => ({ ...p, ammonium: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Carbonate
                    </label>
                    <select
                      dir="ltr"
                      value={stone.carbonate}
                      onChange={(e) => setStone((p) => ({ ...p, carbonate: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      النوع الأساسي للحصوة (Primary Stone Type)
                    </label>
                    <select
                      dir="ltr"
                      value={stone.primaryType}
                      onChange={(e) => setStone((p) => ({ ...p, primaryType: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-amber-300 bg-amber-50/50 font-semibold"
                    >
                      <option value="Calcium Oxalate Stone">Calcium Oxalate Stone</option>
                      <option value="Uric Acid Stone">Uric Acid Stone</option>
                      <option value="Mixed Calcium Oxalate & Phosphate Stone">
                        Mixed Calcium Oxalate & Phosphate Stone
                      </option>
                      <option value="Struvite (Infection) Stone">Struvite (Infection) Stone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ملاحظات (Notes)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={stone.notes}
                      onChange={(e) => setStone((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      placeholder="Dietary / clinical notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. COAG_PROFILE */}
          {formType === 'COAG_PROFILE' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-indigo-800 border-b border-slate-200 pb-2">
                  فحوصات زمن البروثرومبين والتخثر (Prothrombin Time, Auto-INR & Coagulation Parameters)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PT Patient (sec) <span className="text-slate-400 font-normal">[11.0 - 13.5]</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      dir="ltr"
                      value={coag.ptPatient}
                      onChange={(e) => setCoag((p) => ({ ...p, ptPatient: e.target.value }))}
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PT Control (sec) <span className="text-slate-400 font-normal">[Default 12.0]</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      dir="ltr"
                      value={coag.ptControl}
                      onChange={(e) => setCoag((p) => ({ ...p, ptControl: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ISI <span className="text-slate-400 font-normal">[Default 1.1]</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      dir="ltr"
                      value={coag.isi}
                      onChange={(e) => setCoag((p) => ({ ...p, isi: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-800 mb-1">
                      INR (محسوب تلقائياً) <span className="text-indigo-500 font-normal">[0.8 - 1.2]</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={coag.inr}
                      onChange={(e) => setCoag((p) => ({ ...p, inr: e.target.value }))}
                      className="w-full px-3 py-2 text-sm font-extrabold text-indigo-900 rounded-lg border border-indigo-300 bg-indigo-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      aPTT (sec) <span className="text-slate-400 font-normal">[25.0 - 35.0]</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      dir="ltr"
                      value={coag.aptt}
                      onChange={(e) => setCoag((p) => ({ ...p, aptt: e.target.value }))}
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bleeding Time - BT (min) <span className="text-slate-400 font-normal">[2 - 7]</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={coag.bleedingTime}
                      onChange={(e) => setCoag((p) => ({ ...p, bleedingTime: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Clotting Time - CT (min) <span className="text-slate-400 font-normal">[5 - 10]</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={coag.clottingTime}
                      onChange={(e) => setCoag((p) => ({ ...p, clottingTime: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات (Notes / Anticoagulant Therapy)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={coag.notes}
                    onChange={(e) => setCoag((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    placeholder="Optional clinical notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. OGTT_CURVE */}
          {formType === 'OGTT_CURVE' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse" dir="ltr">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 uppercase bg-slate-100">
                      <th className="py-2.5 px-3">Time Point (الوقت)</th>
                      <th className="py-2.5 px-3">Blood Glucose (mg/dL)</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                      <th className="py-2.5 px-3">Urine Sugar (سكر الإدرار)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-800">Fasting (0 min)</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={ogtt.fastingBlood}
                          onChange={(e) => setOgtt((p) => ({ ...p, fastingBlood: e.target.value }))}
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">70 - 99 mg/dL</td>
                      <td className="py-2 px-3">
                        <select
                          value={ogtt.fastingUrine}
                          onChange={(e) => setOgtt((p) => ({ ...p, fastingUrine: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Nil">Nil</option>
                          <option value="+">+</option>
                          <option value="++">++</option>
                          <option value="+++">+++</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-800">0.5 Hour (30 min)</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={ogtt.hour05Blood}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour05Blood: e.target.value }))}
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">&lt; 160 mg/dL</td>
                      <td className="py-2 px-3">
                        <select
                          value={ogtt.hour05Urine}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour05Urine: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Nil">Nil</option>
                          <option value="+">+</option>
                          <option value="++">++</option>
                          <option value="+++">+++</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-800">1 Hour (60 min)</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={ogtt.hour1Blood}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour1Blood: e.target.value }))}
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">&lt; 180 mg/dL</td>
                      <td className="py-2 px-3">
                        <select
                          value={ogtt.hour1Urine}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour1Urine: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Nil">Nil</option>
                          <option value="+">+</option>
                          <option value="++">++</option>
                          <option value="+++">+++</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-800">2 Hours (120 min)</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={ogtt.hour2Blood}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour2Blood: e.target.value }))}
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">&lt; 140 mg/dL</td>
                      <td className="py-2 px-3">
                        <select
                          value={ogtt.hour2Urine}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour2Urine: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Nil">Nil</option>
                          <option value="+">+</option>
                          <option value="++">++</option>
                          <option value="+++">+++</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-800">3 Hours (180 min)</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={ogtt.hour3Blood}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour3Blood: e.target.value }))}
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">&lt; 120 mg/dL</td>
                      <td className="py-2 px-3">
                        <select
                          value={ogtt.hour3Urine}
                          onChange={(e) => setOgtt((p) => ({ ...p, hour3Urine: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Nil">Nil</option>
                          <option value="+">+</option>
                          <option value="++">++</option>
                          <option value="+++">+++</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-900">
                  تفسير منحنى تحمل السكر (Curve Interpretation)
                </label>
                <select
                  dir="ltr"
                  value={ogtt.interpretation}
                  onChange={(e) => setOgtt((p) => ({ ...p, interpretation: e.target.value }))}
                  className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-emerald-300 bg-white"
                >
                  <option value="Normal Glucose Tolerance Curve">
                    Normal Glucose Tolerance Curve
                  </option>
                  <option value="Impaired Glucose Tolerance (IGT)">
                    Impaired Glucose Tolerance (IGT)
                  </option>
                  <option value="Diabetic Glucose Tolerance Curve">
                    Diabetic Glucose Tolerance Curve
                  </option>
                  <option value="Gestational Diabetes Mellitus (GDM)">
                    Gestational Diabetes Mellitus (GDM)
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleQuickNormalFill}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{meta.quickFillLabel}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              إلغاء (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وإدراج التقرير (Save Report)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClinicalFormWorkstationModal;
