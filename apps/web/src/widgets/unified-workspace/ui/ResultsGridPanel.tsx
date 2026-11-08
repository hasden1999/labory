'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Activity, ChevronDown, CheckCircle2, FileText } from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { classifyResultRange, matchPatientReferenceRange, groupTests } from '@lab-manager/domain';
import {
  getQualitativeOptionsForTest,
  getQualitativeTestKind,
  getQualitativeVisualTokens,
} from '../../../lib/qualitativeResultOptions';
import { resolveReferenceRange } from '@/lib/orderHelpers';
import * as testClassifier from '@/lib/testClassifier';
import {
  isGueTest,
  isGseTest,
  isSfaTest,
  isCbcTest,
  isAmhTest,
  isBhcgTest,
  detectSpecializedClinicalForm,
  SpecializedClinicalFormType,
} from '@/lib/testClassifier';
import ClinicalFormWorkstationModal from '@/components/workstations/ClinicalFormWorkstationModal';

export type SpecialWorkstationType =
  | 'GUE'
  | 'GSE'
  | 'CBC'
  | 'SFA'
  | 'CULTURE'
  | 'AMH'
  | 'BHCG'
  | 'CHEMISTRY'
  | 'MICROBIOLOGY'
  | SpecializedClinicalFormType;

const isCultureTest = (test: any): boolean => {
  if (typeof (testClassifier as any).isCultureTest === 'function') {
    return (testClassifier as any).isCultureTest(test);
  }
  const code = String(test?.testCode || test?.code || test?.test?.code || '').toUpperCase().trim();
  const name = `${test?.testName || ''} ${test?.name || ''} ${test?.arabicName || ''} ${test?.test?.name || ''}`.toLowerCase();
  const cat = String(test?.category || test?.test?.category || '').toUpperCase().trim();
  return cat === 'MICROBIOLOGY' || code.includes('CULTURE') || name.includes('culture') || name.includes('مزرعة');
};

const SPECIALIZED_CLINICAL_FORM_TYPES = new Set<string>([
  'BLOOD_FILM',
  'BODY_FLUID',
  'STONE_ANALYSIS',
  'COAG_PROFILE',
  'OGTT_CURVE',
]);

export const SPECIAL_WORKSTATION_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  GUE: { label: 'فورمة الإدرار (G.U.E)', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', border: 'rgba(2, 132, 199, 0.28)' },
  GSE: { label: 'فورمة الخروج (G.S.E)', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.28)' },
  SFA: { label: 'فورمة السائل المنوي (S.F.A)', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.1)', border: 'rgba(8, 145, 178, 0.28)' },
  CBC: { label: 'فورمة صورة الدم (CBC)', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.1)', border: 'rgba(225, 29, 72, 0.28)' },
  CULTURE: { label: 'فورمة المزرعة (Culture)', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.28)' },
  MICROBIOLOGY: { label: 'فورمة المزرعة (Culture)', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.28)' },
  AMH: { label: 'فورمة مخزون المبيض (AMH)', color: '#0d9488', bg: 'rgba(13, 148, 136, 0.1)', border: 'rgba(13, 148, 136, 0.28)' },
  BHCG: { label: 'فورمة الحمل الرقمي (β-HCG)', color: '#db2777', bg: 'rgba(219, 39, 119, 0.1)', border: 'rgba(219, 39, 119, 0.28)' },
  BLOOD_FILM: { label: 'فومرة مسحة الدم (Blood Film)', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.28)' },
  BODY_FLUID: { label: 'فورمة سوائل الجسم (Body Fluid)', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', border: 'rgba(2, 132, 199, 0.28)' },
  STONE_ANALYSIS: { label: 'فورمة تحليل الحصى (Stone Analysis)', color: '#b45309', bg: 'rgba(180, 83, 9, 0.1)', border: 'rgba(180, 83, 9, 0.28)' },
  COAG_PROFILE: { label: 'فورمة تخثر الدم (Coagulation)', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.28)' },
  OGTT_CURVE: { label: 'منحنى تحمل السكر (OGTT Curve)', color: '#0d9488', bg: 'rgba(13, 148, 136, 0.1)', border: 'rgba(13, 148, 136, 0.28)' },
};

interface ResultsGridPanelProps {
  workspace: UnifiedWorkspaceReturn;
  onOpenSpecialModal?: (modalType: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'AMH' | 'BHCG' | 'CHEMISTRY' | 'MICROBIOLOGY', testId?: string) => void;
}

export function detectSpecialWorkstation(test: {
  id?: string;
  code?: string;
  testCode?: string;
  name?: string;
  testName?: string;
  category?: string;
  arabicName?: string | null;
}): SpecialWorkstationType | null {
  if (isGueTest(test)) return 'GUE';
  if (isGseTest(test)) return 'GSE';
  if (isSfaTest(test)) return 'SFA';
  if (isCbcTest(test)) return 'CBC';
  if (isCultureTest(test)) return 'CULTURE';
  if (isAmhTest(test)) return 'AMH';
  if (isBhcgTest(test)) return 'BHCG';
  const clinicalForm = detectSpecializedClinicalForm(test);
  if (clinicalForm) return clinicalForm;
  return null;
}

export default function ResultsGridPanel({
  workspace,
  onOpenSpecialModal,
}: ResultsGridPanelProps) {
  const { selectedTests, results, updateResultValue, patient } = workspace;
  const toggleDirectOverride = (workspace as any).toggleDirectOverride as ((testId: string) => void) | undefined;

  const [activeSpecialTest, setActiveSpecialTest] = useState<{
    type: SpecializedClinicalFormType;
    testId: string;
    testCode?: string;
    testName: string;
  } | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Hierarchical clinical grouping (Department -> Subgroup -> Tests)
  const hierarchicalSections = useMemo(() => {
    const res = groupTests(selectedTests, 'specialty');
    return res.sections;
  }, [selectedTests]);

  // 1. Collapsed Strip State (When no test is selected)
  if (selectedTests.length === 0) {
    return (
      <div
        style={{
          width: '68px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '24px 8px',
          height: '100%',
          flexShrink: 0,
          boxSizing: 'border-box',
          userSelect: 'none',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 184, 166, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-teal)',
          }}
        >
          <Activity size={20} />
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          تظهر خانات النتائج هنا بعد اختيار الفحوصات
        </div>
      </div>
    );
  }

  // 2. Expanded State Calculations
  const totalCount = selectedTests.length;
  const completedCount = selectedTests.filter((t) => {
    const val = results[t.id]?.value;
    return val !== undefined && val !== null && String(val).trim() !== '';
  }).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Feature 2: Clinical Panic Value Detection
  const evaluatePanicValue = (testObj: any, rawVal?: string | null): boolean => {
    if (!rawVal) return false;
    const num = parseFloat(String(rawVal).trim());
    if (isNaN(num)) return false;
    if (testObj?.criticalHigh != null && num >= Number(testObj.criticalHigh)) return true;
    if (testObj?.criticalLow != null && num <= Number(testObj.criticalLow)) return true;
    const c = String(testObj?.code || '').toUpperCase().trim();
    if ((c === 'K' || c === 'K+') && (num >= 6.2 || num <= 2.8)) return true;
    if ((c === 'NA' || c === 'NA+') && (num >= 160 || num <= 120)) return true;
    if ((c === 'HB' || c === 'HGB') && (num <= 6.5 || num >= 20)) return true;
    if ((c === 'PLT') && (num <= 30 || num >= 1000)) return true;
    if ((c === 'FBS' || c === 'RBS' || c === 'GLU') && (num >= 450 || num <= 45)) return true;
    if ((c === 'CREAT' || c === 'CREA') && num >= 7.0) return true;
    if ((c === 'TSB' || c === 'TBIL') && num >= 18.0) return true;
    return false;
  };

  const panicTests = selectedTests.filter((t) => evaluatePanicValue(t, results[t.id]?.value));

  // Keyboard navigation helper (Tab / Enter moves to next input)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentTestId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const allIds = selectedTests.map((t) => t.id);
      const currentIndex = allIds.indexOf(currentTestId);
      if (e.shiftKey) {
        if (currentIndex > 0) {
          const prevId = allIds[currentIndex - 1];
          inputRefs.current[prevId]?.focus();
          inputRefs.current[prevId]?.select();
        }
      } else {
        if (currentIndex < allIds.length - 1) {
          const nextId = allIds[currentIndex + 1];
          inputRefs.current[nextId]?.focus();
          inputRefs.current[nextId]?.select();
        } else {
          // If at the last test result, advance focus to Save button
          const saveBtn = document.querySelector<HTMLElement>('button[data-shift-nav="save-btn"]');
          if (saveBtn) {
            saveBtn.focus();
          }
        }
      }
    }
  };

  return (
    <div
      dir="ltr"
      style={{
        width: 'clamp(360px, 30vw, 480px)',
        maxWidth: '520px',
        minWidth: '340px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        flexShrink: 0,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            نتائج الفحوصات
          </h2>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: completedCount === totalCount ? 'var(--accent-teal)' : 'var(--text-muted)',
            }}
          >
            تم إدخال {completedCount} من أصل {totalCount} فحص
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#0f766e',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* 2. Grid Table Header (Exactly 4 columns: Test | Result | Unit | Reference range) */}
      {panicTests.length > 0 && (
        <div
          dir="rtl"
          style={{
            background: 'rgba(220, 38, 38, 0.14)',
            borderBottom: '1.5px solid #ef4444',
            padding: '7px 14px',
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🚨 تنبيه قيمة حرجة خطرة (PANIC):</span>
          <span>
            {panicTests.map((pt) => `${pt.code || pt.name} (${results[pt.id]?.value})`).join(' ، ')} — يرجى إبلاغ الطبيب فوراً
          </span>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(120px, 1.3fr) 115px 60px minmax(110px, 1.3fr)',
          padding: '8px 16px',
          backgroundColor: 'var(--table-header-bg)',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>Test (الفحص)</div>
        <div style={{ minWidth: 0 }}>Result (النتيجة)</div>
        <div style={{ minWidth: 0 }}>Unit (الوحدة)</div>
        <div style={{ minWidth: 0 }}>Ref. Range (المعدل)</div>
      </div>

      {/* 3. Grid Table Body (Grouped by Category) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 0',
        }}
      >
        {hierarchicalSections.map((sec) => (
          <div key={sec.id || sec.nameEn} style={{ marginBottom: '10px' }}>
            {/* Department Master Header */}
            <div
              style={{
                padding: '7px 16px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderTop: '2px solid var(--accent-teal)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                color: 'var(--text-main)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏥</span>
                <span>{sec.nameEn}</span>
              </div>
            </div>

            {/* Subgroups and tests in Department */}
            {sec.groups.map((grp) => (
              <div key={grp.id} style={{ marginBottom: '4px' }}>
                <div
                  style={{
                    padding: '6px 18px',
                    backgroundColor: 'rgba(20, 184, 166, 0.09)',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid var(--accent-teal)',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: 'var(--accent-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📁</span>
                    <span>{grp.nameEn}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(20, 184, 166, 0.16)',
                        color: 'var(--accent-teal)',
                        fontWeight: 800,
                      }}
                    >
                      {grp.tests.length}
                    </span>
                  </div>
                </div>
                {grp.tests.map((test) => {
              const res = results[test.id] || {
                testId: test.id,
                testName: test.name,
                value: '',
                unit: test.unit || '',
                refRangeText: test.refRangeText || '',
                status: 'NONE',
                isCalculated: Boolean(test.isCalculated),
                isDirectOverride: false,
              };

              const specialModalType = detectSpecialWorkstation(test);
              const specialMeta = specialModalType ? SPECIAL_WORKSTATION_META[specialModalType] : null;

              const effectiveAgeYears = typeof patient.ageYears === 'number' ? patient.ageYears : undefined;

              // Resolve patient reference range (dynamically reacting to res.value)
              const resolvedRange = resolveReferenceRange(
                test,
                patient.gender,
                effectiveAgeYears,
                patient.birthDate,
                undefined,
                res.value
              );

              const patientCtx = {
                gender: patient.gender,
                age: effectiveAgeYears,
                birthDate: patient.birthDate || undefined,
              };

              // Clinical range & flag classification via single shared domain function
              const classification = classifyResultRange(res.value, test, patientCtx);

              const isHigh = classification.flag === 'HIGH' || (classification.flag as string) === 'PANIC_HIGH';
              const isLow = classification.flag === 'LOW' || (classification.flag as string) === 'PANIC_LOW';
              const isPanic = evaluatePanicValue(test, res.value);
              const prevVal = (test as any).previousValue ?? (res as any).previousValue ?? null;
              const prevDate = (test as any).previousDate ?? (res as any).previousDate ?? null;
              const isNormal = classification.flag === 'NORMAL' && String(res.value || '').trim() !== '';

              // Gender / Age badge chip
              const matchedRange = test.referenceRanges
                ? matchPatientReferenceRange(test.referenceRanges, patientCtx)
                : null;
              const rangeChipText =
                resolvedRange.matchedLabel ||
                matchedRange?.label ||
                (patient.gender === 'FEMALE' ? 'F' : patient.gender === 'MALE' ? 'M' : 'Any');

              return (
                <div key={test.id}>
                  {/* Standard Test Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(120px, 1.3fr) 115px 60px minmax(110px, 1.3fr)',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                    }}
                  >
                    {/* Column 1: Test Name & Code */}
                    <div style={{ minWidth: 0, paddingRight: '8px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: '1.3',
                          fontSize: '12.5px',
                          direction: 'ltr',
                          unicodeBidi: 'isolate',
                          textAlign: 'left',
                        }}
                        title={test.name}
                      >
                        {test.name}
                      </div>
                      {test.code && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            direction: 'ltr',
                            unicodeBidi: 'isolate',
                          }}
                        >
                          {test.code}
                        </div>
                      )}
                      {prevVal && (
                        <div
                          dir="rtl"
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#0284c7',
                            background: 'rgba(2, 132, 199, 0.1)',
                            border: '1px solid rgba(2, 132, 199, 0.25)',
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            marginTop: '3px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={prevDate ? `تاريخ الفحص السابق: ${new Date(prevDate).toLocaleDateString('en-GB')}` : 'نتيجة الفحص السابق للمريض'}
                        >
                          <span>📊 النتيجة السابقة:</span>
                          <span dir="ltr" style={{ fontWeight: 800 }}>{prevVal}</span>
                          {prevDate && (
                            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 500 }} dir="ltr">
                              ({new Date(prevDate).toLocaleDateString('en-GB')})
                            </span>
                          )}
                        </div>
                      )}
                      {isPanic && (
                        <div
                          dir="rtl"
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#dc2626',
                            background: 'rgba(220, 38, 38, 0.14)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            marginTop: '2px',
                            display: 'inline-block',
                          }}
                        >
                          🚨 قيمة حرجة (Panic)
                        </div>
                      )}
                    </div>

                    {/* Column 2: Result Input or Specialized Form Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px' }}>
                      {specialModalType ? (
                        <button
                          type="button"
                          data-shift-nav="result"
                          onClick={() => {
                            if (SPECIALIZED_CLINICAL_FORM_TYPES.has(specialModalType)) {
                              setActiveSpecialTest({
                                type: specialModalType as SpecializedClinicalFormType,
                                testId: test.id,
                                testCode: test.code,
                                testName: test.name,
                              });
                            } else {
                              onOpenSpecialModal?.(
                                (specialModalType === 'CULTURE' ? 'MICROBIOLOGY' : specialModalType) as any,
                                test.id
                              );
                            }
                          }}
                          title={res.value ? 'تعديل بيانات الفحص التخصصي' : (specialMeta?.label || 'فتح فورمة الفحص التخصصي الجاهزة')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            height: '32px',
                            padding: '0 10px',
                            backgroundColor: res.value
                              ? 'rgba(16, 185, 129, 0.14)'
                              : specialMeta?.bg || '#0f766e',
                            color: res.value
                              ? 'var(--color-success)'
                              : specialMeta?.color || '#ffffff',
                            border: res.value
                              ? '1px solid rgba(16, 185, 129, 0.4)'
                              : specialMeta?.border
                              ? `1px solid ${specialMeta.border}`
                              : 'none',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: res.value ? '0 1px 2px rgba(0,0,0,0.04)' : '0 1px 3px rgba(15, 118, 110, 0.15)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {res.value ? (
                            <>
                              <CheckCircle2 size={13} color="var(--color-success)" />
                              <span>مكتمل ({specialModalType === 'AMH' ? 'AMH' : specialModalType === 'BHCG' ? 'β-HCG' : 'تعديل'})</span>
                            </>
                          ) : (
                            <>
                              <FileText size={13} />
                              <span>{specialMeta?.label || (specialModalType === 'AMH' ? 'فورمة AMH' : specialModalType === 'BHCG' ? 'فورمة β-HCG' : 'ملء الفورمة')}</span>
                            </>
                          )}
                        </button>
                      ) : (() => {
                        const qualOptions = getQualitativeOptionsForTest(test);
                        const qualKind = getQualitativeTestKind(test);
                        const visualTokens = getQualitativeVisualTokens(res.value, qualKind);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {qualOptions ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <select
                                  ref={(el) => {
                                    inputRefs.current[test.id] = el as any;
                                  }}
                                  data-shift-nav="result"
                                  value={qualOptions.includes(res.value) ? res.value : (res.value ? '__custom__' : '')}
                                  onChange={(e) => {
                                    if (e.target.value === '__custom__') return;
                                    updateResultValue(test.id, e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const allIds = selectedTests.map((t) => t.id);
                                      const currentIndex = allIds.indexOf(test.id);
                                      if (currentIndex < allIds.length - 1) {
                                        const nextId = allIds[currentIndex + 1];
                                        inputRefs.current[nextId]?.focus();
                                      } else {
                                        const saveBtn = document.querySelector<HTMLElement>('button[data-shift-nav="save-btn"]');
                                        if (saveBtn) saveBtn.focus();
                                      }
                                    }
                                  }}
                                  style={{
                                    height: '32px',
                                    padding: '0 8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: visualTokens.color,
                                    backgroundColor: visualTokens.backgroundColor,
                                    border: `1.5px solid ${visualTokens.borderColor}`,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="">— اختر النتيجة —</option>
                                  {qualOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                  <option value="__custom__">كتابة يدوية...</option>
                                </select>
                                {visualTokens.statusLabel && res.value && (
                                  <span
                                    style={{
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      color: visualTokens.color,
                                      backgroundColor: visualTokens.backgroundColor,
                                      border: `1px solid ${visualTokens.borderColor}`,
                                      padding: '1.5px 5px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {visualTokens.statusLabel}
                                  </span>
                                )}
                                {(!qualOptions.includes(res.value) || res.value === '') && (
                                  <input
                                    type="text"
                                    data-shift-nav="result"
                                    value={res.value}
                                    onChange={(e) => updateResultValue(test.id, e.target.value)}
                                    onKeyDown={(e) => handleInputKeyDown(e, test.id)}
                                    placeholder="أو اكتب..."
                                    style={{
                                      width: '75px',
                                      height: '32px',
                                      padding: '0 6px',
                                      fontSize: '11.5px',
                                      fontWeight: 600,
                                      color: visualTokens.color,
                                      backgroundColor: visualTokens.backgroundColor,
                                      border: `1px solid ${visualTokens.borderColor}`,
                                      borderRadius: '6px',
                                      outline: 'none',
                                      boxSizing: 'border-box',
                                    }}
                                  />
                                )}
                              </div>
                            ) : (
                              <>
                                <input
                                  ref={(el) => {
                                    inputRefs.current[test.id] = el;
                                  }}
                                  data-shift-nav="result"
                                  type="text"
                                  value={res.value}
                                  onChange={(e) => updateResultValue(test.id, e.target.value)}
                                  onKeyDown={(e) => handleInputKeyDown(e, test.id)}
                                  placeholder={test.isCalculated ? 'Auto' : '—'}
                                  style={{
                                    width: '80px',
                                    height: '32px',
                                    padding: '0 8px',
                                    fontSize: '13.5px',
                                    fontWeight: 600,
                                    color: isHigh ? '#dc2626' : isLow ? '#2563eb' : 'var(--text-main)',
                                    backgroundColor: test.isCalculated && !res.isDirectOverride ? 'var(--bg-card-subtle)' : 'var(--bg-input)',
                                    border: isHigh
                                      ? '1px solid #ef4444'
                                      : isLow
                                      ? '1px solid #3b82f6'
                                      : '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    direction: 'ltr',
                                    unicodeBidi: 'isolate',
                                    boxSizing: 'border-box',
                                  }}
                                  onFocus={(e) => {
                                    if (!isHigh && !isLow) e.target.style.borderColor = '#0f766e';
                                  }}
                                  onBlur={(e) => {
                                    if (!isHigh && !isLow) e.target.style.borderColor = 'var(--border-color)';
                                  }}
                                />
                                {test.isCalculated && !res.isDirectOverride && res.value && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: '#0d9488',
                                      backgroundColor: 'rgba(13, 148, 136, 0.12)',
                                      border: '1px solid rgba(13, 148, 136, 0.3)',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      userSelect: 'none',
                                    }}
                                    title="محسوب تلقائياً (اكتب قيمة مباشرة للتعديل اليدوي)"
                                  >
                                    تلقائي
                                  </span>
                                )}
                                {test.isCalculated && res.isDirectOverride && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (toggleDirectOverride) {
                                        toggleDirectOverride(test.id);
                                      } else {
                                        updateResultValue(test.id, '', false);
                                      }
                                    }}
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: '#d97706',
                                      backgroundColor: 'rgba(217, 119, 6, 0.12)',
                                      border: '1px solid rgba(217, 119, 6, 0.35)',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                    }}
                                    title="إدخال يدوي — اضغط للعودة إلى الحساب التلقائي"
                                  >
                                    يدوي
                                  </button>
                                )}
                              </>
                            )}

                            {/* Clean directional status arrows ONLY (no textual commentary) */}
                            {isHigh && (
                              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: 15 }}>↑</span>
                            )}
                            {isLow && (
                              <span style={{ color: '#2563eb', fontWeight: 900, fontSize: 15 }}>↓</span>
                            )}
                            {visualTokens?.isAbnormal && (
                              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: 13 }} title="نتيجة إيجابية غير طبيعية">⚠</span>
                            )}
                            {isNormal && !visualTokens?.isAbnormal && (
                              <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 13 }}>✓</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Column 3: Unit (LTR isolate) */}
                    <div
                      style={{
                        minWidth: 0,
                        fontSize: '11.5px',
                        color: specialModalType ? 'var(--accent-teal)' : 'var(--text-muted)',
                        fontWeight: specialModalType ? 600 : 400,
                        direction: 'ltr',
                        unicodeBidi: 'isolate',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        lineHeight: '1.2',
                      }}
                    >
                      {test.unit || (specialModalType ? 'Form' : '—')}
                    </div>

                    {/* Column 4: All Reference Ranges + Interactive Click-to-Select Bracket */}
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                      {(() => {
                        if (specialModalType && !test.refRangeText && (!test.referenceRanges || test.referenceRanges.length === 0)) {
                          return (
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }} dir="ltr">
                              Structured Report
                            </span>
                          );
                        }

                        const rList: Array<{ label: string; valueText: string; low: number | null; high: number | null; rawObj?: any }> = [];
                        if (Array.isArray(test.referenceRanges) && test.referenceRanges.length > 0) {
                          test.referenceRanges.forEach((r: any) => {
                            const rLow = r.low ?? r.min ?? null;
                            const rHigh = r.high ?? r.max ?? null;
                            const rawTxt =
                              r.text ||
                              (rLow !== null && rHigh !== null
                                ? `${rLow} - ${rHigh}`
                                : rLow !== null
                                  ? `>= ${rLow}`
                                  : rHigh !== null
                                    ? `<= ${rHigh}`
                                    : '');
                            let lbl = r.label ? String(r.label).trim() : '';
                            if (!lbl && test.referenceRanges && test.referenceRanges.length > 1) {
                              if (r.sex === 'M') lbl = 'Male';
                              else if (r.sex === 'F') lbl = 'Female';
                            }
                            let cleanVal = String(rawTxt || '').trim();
                            if (lbl && cleanVal.toLowerCase().startsWith(lbl.toLowerCase())) {
                              const stripped = cleanVal.slice(lbl.length).replace(/^[\s:：\-–—]+/, '').trim();
                              if (stripped) cleanVal = stripped;
                            }
                            if (!lbl && cleanVal.includes(':')) {
                              const cIdx = cleanVal.indexOf(':');
                              lbl = cleanVal.slice(0, cIdx).trim();
                              cleanVal = cleanVal.slice(cIdx + 1).trim();
                            }
                            rList.push({
                              label: lbl,
                              valueText: cleanVal || '—',
                              low: rLow !== null ? Number(rLow) : null,
                              high: rHigh !== null ? Number(rHigh) : null,
                              rawObj: r,
                            });
                          });
                        } else if (test.refRangeText && /\r?\n|\||;/.test(test.refRangeText)) {
                          const segs = test.refRangeText
                            .split(/\r?\n|\||;/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          segs.forEach((seg) => {
                            let lbl = '';
                            let valPart = seg;
                            if (seg.includes(':')) {
                              const cIdx = seg.indexOf(':');
                              lbl = seg.slice(0, cIdx).trim();
                              valPart = seg.slice(cIdx + 1).trim();
                            }
                            const mRange = valPart.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
                            rList.push({
                              label: lbl,
                              valueText: valPart,
                              low: mRange ? parseFloat(mRange[1]) : null,
                              high: mRange ? parseFloat(mRange[2]) : null,
                            });
                          });
                        }

                        const computeBracketSampleValue = (item: { label: string; valueText: string; low: number | null; high: number | null }): string => {
                          if (item.low !== null && item.high !== null && !isNaN(item.low) && !isNaN(item.high)) {
                            const mid = (item.low + item.high) / 2;
                            const hasDecimals = String(item.low).includes('.') || String(item.high).includes('.') || (item.high - item.low) < 4;
                            return hasDecimals ? mid.toFixed(1).replace(/\.0$/, '.0') : String(Math.round(mid));
                          }
                          if (item.low !== null && !isNaN(item.low)) {
                            return (item.low + 0.5).toFixed(1).replace(/\.0$/, '');
                          }
                          if (item.high !== null && !isNaN(item.high)) {
                            return (item.high * 0.8).toFixed(1).replace(/\.0$/, '');
                          }
                          const txt = item.valueText;
                          const m1 = txt.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
                          if (m1) {
                            const a = parseFloat(m1[1]);
                            const b = parseFloat(m1[2]);
                            const mid = (a + b) / 2;
                            return (m1[1].includes('.') || m1[2].includes('.') || (b - a) < 4) ? mid.toFixed(1) : String(Math.round(mid));
                          }
                          const mGe = txt.match(/>=?\s*(\d+(?:\.\d+)?)/);
                          if (mGe) return (parseFloat(mGe[1]) + 0.5).toFixed(1).replace(/\.0$/, '');
                          const mLe = txt.match(/<=?\s*(\d+(?:\.\d+)?)/);
                          if (mLe) return (parseFloat(mLe[1]) * 0.8).toFixed(1).replace(/\.0$/, '');
                          return txt !== '—' ? txt : '';
                        };

                        if (rList.length > 1) {
                          const hasVal = String(res.value || '').trim() !== '';
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                              {rList.map((item, idx) => {
                                const isMatched =
                                  hasVal &&
                                  ((item.rawObj && resolvedRange.matchedRange === item.rawObj) ||
                                    (resolvedRange.matchedLabel && item.label && resolvedRange.matchedLabel === item.label) ||
                                    (resolvedRange.text && resolvedRange.text.includes(item.valueText)));
                                const isGenericLbl =
                                  !item.label ||
                                  item.label === 'للجميع' ||
                                  item.label === 'عام' ||
                                  item.label === 'المعدل العام' ||
                                  item.label.toLowerCase() === 'all' ||
                                  item.label.toLowerCase() === 'general';
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      const sampleVal = computeBracketSampleValue(item);
                                      if (sampleVal) {
                                        updateResultValue(test.id, sampleVal);
                                      }
                                      setTimeout(() => {
                                        const el = inputRefs.current[test.id];
                                        if (el) {
                                          el.focus();
                                          if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
                                            (el as HTMLInputElement).select();
                                          }
                                        }
                                      }, 20);
                                    }}
                                    title="اضغط لاختيار هذا المدى وإظهار نتيجة الفحص المطابقة"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '6px',
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      border: isMatched
                                        ? '1.5px solid var(--accent-teal)'
                                        : '1px solid var(--border-subtle)',
                                      backgroundColor: isMatched
                                        ? 'rgba(13, 148, 136, 0.12)'
                                        : 'var(--bg-card-subtle)',
                                      color: isMatched ? 'var(--accent-teal)' : 'var(--text-main)',
                                      fontSize: '11px',
                                      lineHeight: '1.25',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      transition: 'all 0.12s ease',
                                      width: 'fit-content',
                                      maxWidth: '100%',
                                    }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }} dir="rtl">
                                      {!isGenericLbl && (
                                        <span dir="auto" style={{ fontWeight: 700 }}>
                                          {item.label}:
                                        </span>
                                      )}
                                      <span dir="ltr" style={{ unicodeBidi: 'isolate', fontWeight: isMatched ? 800 : 600, fontFamily: 'monospace' }}>
                                        {item.valueText}
                                      </span>
                                    </span>
                                    {isMatched && (
                                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent-teal)', flexShrink: 0 }}>
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        }

                        const raw =
                          resolvedRange.text ||
                          (resolvedRange.low !== null && resolvedRange.high !== null
                            ? `${resolvedRange.low} - ${resolvedRange.high}`
                            : specialModalType
                            ? 'Structured Report'
                            : '—');

                        const singleItem = rList[0] || {
                          label: resolvedRange.matchedLabel || '',
                          valueText: raw,
                          low: resolvedRange.low,
                          high: resolvedRange.high,
                        };

                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (specialModalType) return;
                                const sampleVal = computeBracketSampleValue(singleItem);
                                if (sampleVal && !res.value) {
                                  updateResultValue(test.id, sampleVal);
                                }
                                setTimeout(() => {
                                  const el = inputRefs.current[test.id];
                                  if (el) {
                                    el.focus();
                                    if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
                                      (el as HTMLInputElement).select();
                                    }
                                  }
                                }, 20);
                              }}
                              title="اضغط لاختيار المدى وإدخال النتيجة"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '1px 3px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                lineHeight: '1.3',
                                color: specialModalType ? 'var(--text-muted)' : 'var(--text-main)',
                                cursor: specialModalType ? 'default' : 'pointer',
                                direction: 'rtl',
                                unicodeBidi: 'isolate',
                              }}
                            >
                              {(() => {
                                if (raw && raw.includes(':')) {
                                  const [lbl, ...rest] = raw.split(':');
                                  const rangePart = rest.join(':').trim();
                                  return (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} dir="rtl">
                                      <span dir="auto" style={{ fontWeight: 700, color: 'var(--text-main)' }}>{lbl}:</span>
                                      <span dir="ltr" style={{ unicodeBidi: 'isolate', display: 'inline-block', fontWeight: 600 }}>{rangePart}</span>
                                    </span>
                                  );
                                }
                                if (raw && raw.includes('(') && raw.includes(')')) {
                                  const openIdx = raw.indexOf('(');
                                  const lbl = raw.slice(0, openIdx).trim();
                                  const rangePart = raw.slice(openIdx).trim();
                                  if (lbl) {
                                    return (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} dir="ltr">
                                        <span dir="auto" style={{ fontWeight: 700, color: 'var(--text-main)', unicodeBidi: 'isolate' }}>{lbl}</span>
                                        <span dir="ltr" style={{ unicodeBidi: 'isolate', display: 'inline-block', fontWeight: 600 }}>{rangePart}</span>
                                      </span>
                                    );
                                  }
                                }
                                return <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{raw}</span>;
                              })()}
                            </button>
                            {!specialModalType && test.referenceRanges && test.referenceRanges.length > 0 && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  backgroundColor: 'var(--bg-card-hover)',
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  flexShrink: 0,
                                }}
                              >
                                {rangeChipText}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 4. Panel Footer: Clinical Flags Legend (Matching approved mockups) */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <span>Flags also print on the report</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>below range</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#2563eb',
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              ↓
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>above range</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#dc2626',
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              ↑
            </span>
          </div>
        </div>
      </div>

      {/* 5. Specialized Clinical Form Workstation Modal (Blood Film, Body Fluid, Stone Analysis, Coag Profile, OGTT Curve) */}
      {activeSpecialTest && (
        <ClinicalFormWorkstationModal
          isOpen={Boolean(activeSpecialTest)}
          formType={activeSpecialTest.type}
          patientName={patient.name || 'Walk-in Patient'}
          sampleId={patient.id || 'INTAKE'}
          testCode={activeSpecialTest.testCode}
          testName={activeSpecialTest.testName}
          initialJsonValue={results[activeSpecialTest.testId]?.value || ''}
          onSave={(jsonString: string) => {
            updateResultValue(activeSpecialTest.testId, jsonString);
            setActiveSpecialTest(null);
          }}
          onClose={() => setActiveSpecialTest(null)}
        />
      )}
    </div>
  );
}
