'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  Printer,
  Send,
  Barcode,
  UserPlus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useToast } from '../../../components/Toast';
import { useLab } from '../../../components/LabContext';
import { apiRequest } from '../../../lib/api';
import { shareReportToWhatsApp, autoSendReportViaWhatsAppWeb } from '../../../lib/shareReportToWhatsApp';
import {
  normalizeIraqiPhone,
  buildWhatsAppMessage,
  buildWaLink,
  isOrderComplete,
} from '../../../lib/orderHelpers';

export interface UnifiedActionBarProps {
  workspace: UnifiedWorkspaceReturn;
  onSavedSample?: (sample: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function UnifiedActionBar({
  workspace,
  onSavedSample,
  className,
  style,
}: UnifiedActionBarProps) {
  const toast = useToast();
  const { labProfile } = useLab();
  const [savedSample, setSavedSample] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { patient, selectedTests, results, invoice } = workspace;

  // --------------------------------------------------------------------------
  // Validation States
  // --------------------------------------------------------------------------
  const hasName = Boolean(patient.name && patient.name.trim().length > 0);
  const hasAge = Boolean(
    patient.ageYears !== '' ||
      patient.ageMonths !== '' ||
      patient.ageDays !== '' ||
      patient.birthDate
  );
  const hasSex = patient.gender === 'MALE' || patient.gender === 'FEMALE';
  const hasTests = selectedTests.length > 0;

  // Save is enabled ONLY with name + age + sex + at least 1 test
  const canSave = hasName && hasAge && hasSex && hasTests && !isProcessing;

  // Calculate completeness for WhatsApp
  const resultsMap: Record<string, { resultValue: string }> = {};
  Object.entries(results).forEach(([id, r]) => {
    resultsMap[id] = { resultValue: r.value };
  });

  const sampleTestsForCheck = selectedTests.map((t) => ({
    id: t.id,
    test: t,
    resultValue: results[t.id]?.value || '',
  }));

  const completedCount = selectedTests.filter((t) => {
    const val = results[t.id]?.value;
    return val !== undefined && val !== null && String(val).trim() !== '';
  }).length;
  const remainingCount = selectedTests.length - completedCount;
  const isComplete = hasTests && remainingCount === 0 && isOrderComplete(sampleTestsForCheck, resultsMap);

  const normalizedPhone = normalizeIraqiPhone(patient.phone);
  const hasPhone = Boolean(normalizedPhone);

  // WhatsApp enabled only when ALL results are complete and phone exists
  const canWhatsApp = hasTests && isComplete && hasPhone && !isProcessing;

  // Print enabled once an order is saved OR ready to be saved
  const canPrint = (Boolean(savedSample?.id) || canSave) && !isProcessing;

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  // Save Order (F9)
  const handleSave = useCallback(async () => {
    if (!canSave) {
      if (!hasName) toast.warning('اسم المريض مطلوب');
      else if (!hasAge) toast.warning('عمر المريض مطلوب');
      else if (!hasSex) toast.warning('جنس المريض مطلوب لتحديد المعدلات الطبيعية');
      else if (!hasTests) toast.warning('يرجى اختيار فحص واحد على الأقل للحفظ');
      return null;
    }

    setIsProcessing(true);
    workspace.setIsSaving(true);

    try {
      const payload: any = {
        patientId: patient.id || undefined,
        patientName: patient.name.trim(),
        patientPhone: patient.phone.trim() || undefined,
        patientGender: patient.gender,
        patientAge: typeof patient.ageYears === 'number' ? String(patient.ageYears) : undefined,
        patientAgeMonths: typeof patient.ageMonths === 'number' ? String(patient.ageMonths) : undefined,
        patientAgeDays: typeof patient.ageDays === 'number' ? String(patient.ageDays) : undefined,
        patientBirthDate: patient.birthDate || undefined,
        patientBirthDateEstimated: patient.birthDateEstimated,
        doctorId: patient.doctorId || undefined,
        isUrgent: patient.isUrgent,
        tests: selectedTests.map((t) => t.id),
        testIds: selectedTests.map((t) => t.id),
        discount: 0,
        discountPercent: 0,
        priceTotal: invoice.netTotal,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingBalance,
        paymentMethod: invoice.paymentMethod,
        notes: patient.notes.trim() || undefined,
      };

      const result = await apiRequest('/samples', 'POST', payload);
      let finalSample = result;

      // Persist results if any were entered
      if (result?.id && result.tests && Array.isArray(result.tests)) {
        const resultsPayload = result.tests.map((st: any) => {
          const testId = st.testId || st.test?.id;
          const testCode = (st.test?.code || '').toUpperCase().trim();
          const entered = results[testId] || (testCode ? Object.values(results).find((r) => (r.testCode || '').toUpperCase().trim() === testCode) : undefined);
          const selTest = selectedTests.find((t) => t.id === testId || (testCode && (t.code || '').toUpperCase().trim() === testCode));
          const prevVal = (selTest as any)?.previousValue;
          const prevDate = (selTest as any)?.previousDate;
          return {
            sampleTestId: st.id,
            testId: st.testId,
            testCode: st.test?.code,
            resultValue: entered ? entered.value : '',
            isAbnormal: entered ? entered.status === 'HIGH' || entered.status === 'LOW' || entered.status === 'PANIC' : false,
            interpretation: entered ? entered.status : 'Normal',
            previousValue: prevVal,
            previousDate: prevDate,
            includePrevious: Boolean(prevVal),
          };
        });

        if (resultsPayload.length > 0) {
          try {
            const updated = await apiRequest(`/samples/${result.id}/results`, 'PUT', {
              results: resultsPayload,
              tests: resultsPayload,
              status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
              markReady: isComplete,
            });
            if (updated && updated.id) {
              finalSample = updated;
            }
          } catch (resErr) {
            console.warn('Results sync note:', resErr);
          }
        }
      }

      setSavedSample(finalSample);
      if (onSavedSample) onSavedSample(finalSample);

      toast.success(`تم حفظ الطلب #${result.sampleNumber || result.id} بنجاح (F9)`);

      // Auto-send via linked WhatsApp Web if enabled and all results are complete
      if (isComplete && labProfile?.whatsappAutoSendEnabled && hasPhone) {
        const currentLabName = labProfile?.labName || 'مختبر لابريو للتحليلات الطبية';
        const caption = `مرحباً ${patient.name}، يسر (${currentLabName}) إرفاق نتائج تحاليلكم الطبية المعتمدة للعينة رقم (#${result.sampleNumber || result.id}). نتمنى لكم دوام الصحة والعافية.`;
        toast.info('جارٍ إرسال النتيجة تلقائياً عبر واتساب ويب المربوط...');
        autoSendReportViaWhatsAppWeb({
          sampleId: result.id,
          phone: normalizedPhone,
          caption,
        }).then((waRes) => {
          if (waRes.ok) {
            toast.success(waRes.message, 'واتساب التلقائي');
          } else {
            toast.warning(waRes.message, 'واتساب التلقائي');
          }
        });
      }

      return result;
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الطلب');
      return null;
    } finally {
      setIsProcessing(false);
      workspace.setIsSaving(false);
    }
  }, [
    canSave,
    hasName,
    hasAge,
    hasSex,
    hasTests,
    patient,
    selectedTests,
    results,
    invoice,
    isComplete,
    hasPhone,
    normalizedPhone,
    labProfile,
    onSavedSample,
    toast,
    workspace,
  ]);

  // Print Report (F10) - Auto-saves silently if not yet saved, then immediately prints
  const handlePrint = useCallback(async () => {
    let target = savedSample;
    if (!target?.id) {
      if (!canSave) {
        if (!hasName) toast.warning('يرجى إدخال اسم المريض أولاً');
        else if (!hasAge) toast.warning('يرجى إدخال عمر المريض');
        else if (!hasSex) toast.warning('يرجى تحديد جنس المريض');
        else if (!hasTests) toast.warning('يرجى اختيار فحص واحد على الأقل');
        return;
      }
      target = await handleSave();
      if (!target?.id) return;
    } else {
      // If already saved, sync any latest entered results before printing
      try {
        if (target.tests && Array.isArray(target.tests)) {
          const resultsPayload = target.tests.map((st: any) => {
            const testId = st.testId || st.test?.id;
            const testCode = (st.test?.code || '').toUpperCase().trim();
            const entered = results[testId] || (testCode ? Object.values(results).find((r) => (r.testCode || '').toUpperCase().trim() === testCode) : undefined);
            return {
              sampleTestId: st.id,
              testId: st.testId,
              testCode: st.test?.code,
              resultValue: entered ? entered.value : '',
              isAbnormal: entered ? entered.status === 'HIGH' || entered.status === 'LOW' || entered.status === 'PANIC' : false,
              interpretation: entered ? entered.status : 'Normal',
            };
          }).filter((r: any) => r.resultValue !== '');
          if (resultsPayload.length > 0) {
            await apiRequest(`/samples/${target.id}/results`, 'PUT', {
              results: resultsPayload,
              tests: resultsPayload,
              status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
              markReady: isComplete,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to auto-sync latest results before print:', err);
      }
    }
    const printUrl = `/api/samples/${target.id}/print?autoprint=true&force=true`;
    window.open(printUrl, '_blank');
  }, [savedSample, canSave, hasName, hasAge, hasSex, hasTests, handleSave, results, isComplete, toast]);

  // Send WhatsApp (F8)
  const handleWhatsApp = useCallback(async () => {
    if (!canWhatsApp) {
      if (!hasPhone) {
        toast.warning('رقم هاتف المريض مطلوب للإرسال عبر واتساب');
      } else if (!isComplete) {
        toast.warning(`لا يمكن إرسال واتساب: يتبقى ${remainingCount} فحص بدون نتيجة`);
      }
      return;
    }

    let target = savedSample;
    if (!target?.id) {
      target = await handleSave();
    }
    if (!target?.id) return;

    try {
      const formattedLines = selectedTests.map((t) => {
        const entered = results[t.id];
        return {
          name: t.name,
          value: entered ? entered.value : '',
          unit: t.unit || '',
          refRange: entered?.refRangeText || t.refRangeText || '',
          flag: entered?.status || 'NORMAL',
        };
      });

      const currentLabName = labProfile?.labName || 'مختبر لابريو للتحليلات الطبية';
      const caption = `مرحباً ${patient.name}، يسر ${currentLabName} إرفاق نتائج فحصكم رقم (#${target.sampleNumber || target.id}). نتمنى لكم دوام الصحة والعافية.`;

      // Unified share: desktop app (image + caption auto-paste) or browser fallback
      toast.info('جاري تجهيز صورة التقرير وفتح واتساب لمحادثة المريض...');
      const shareResult = await shareReportToWhatsApp({ sampleId: target.id, phone: normalizedPhone, caption });
      if (shareResult.ok) {
        toast.success(shareResult.message);
      } else {
        toast.error(shareResult.message, 'واتساب');
      }
    } catch (err: any) {
      toast.error('فشل في فتح واتساب');
    }
  }, [
    canWhatsApp,
    hasPhone,
    isComplete,
    remainingCount,
    savedSample,
    handleSave,
    selectedTests,
    results,
    patient.name,
    labProfile,
    normalizedPhone,
    toast,
  ]);

  // Barcode (F2)
  const handleBarcode = useCallback(async () => {
    let target = savedSample;
    if (!target?.id) {
      if (!canSave) {
        toast.warning('يرجى إكمال بيانات المريض وحفظه لطباعة الباركود');
        return;
      }
      target = await handleSave();
    }
    if (!target?.id) return;

    try {
      const printUrl = `/api/samples/${target.id}/barcode?autoprint=true`;
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.left = '-9999px';
      printIframe.style.bottom = '-9999px';
      printIframe.style.width = '10px';
      printIframe.style.height = '10px';
      printIframe.style.border = '0';
      printIframe.style.opacity = '0';
      printIframe.src = printUrl;
      document.body.appendChild(printIframe);

      setTimeout(() => {
        try {
          document.body.removeChild(printIframe);
        } catch (e) {}
      }, 30000);

      toast.success(`جارٍ طباعة الباركود للعينة #${target.sampleNumber || ''} (F2)`);
    } catch (e) {
      window.open(`/api/samples/${target.id}/barcode?autoprint=true`, '_blank');
    }
  }, [savedSample, canSave, handleSave, toast]);

  // New Patient (F1)
  const handleNewPatient = useCallback(() => {
    const hasUnsaved = (hasName || hasTests) && !savedSample;
    if (hasUnsaved) {
      const confirmed = window.confirm('هل تريد إلغاء البيانات الحالية غير المحفوظة والبدء بمريض جديد؟');
      if (!confirmed) return;
    }

    workspace.resetPatient();
    setSavedSample(null);

    // Focus patient name input
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="patientName"]') as HTMLInputElement | null;
      if (nameInput) nameInput.focus();
    }, 50);

    toast.info('جاهز لإدخال مريض جديد (F1)');
  }, [hasName, hasTests, savedSample, workspace, toast]);

  // --------------------------------------------------------------------------
  // Keyboard Shortcuts Listener (F1, F2, F8, F9, F10)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleWhatsApp();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleBarcode();
      } else if (e.key === 'F1') {
        e.preventDefault();
        handleNewPatient();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handlePrint, handleWhatsApp, handleBarcode, handleNewPatient]);

  // Synchronize Top Header Actions (New Patient, Print, WhatsApp, Barcode)
  useEffect(() => {
    const handleLabryoAction = (e: any) => {
      const action = e.detail?.action;
      if (action === 'new-patient') {
        handleNewPatient();
      } else if (action === 'print') {
        handlePrint();
      } else if (action === 'whatsapp') {
        handleWhatsApp();
      } else if (action === 'barcode') {
        handleBarcode();
      } else if (action === 'save') {
        handleSave();
      }
    };

    window.addEventListener('labryo-action', handleLabryoAction);
    return () => window.removeEventListener('labryo-action', handleLabryoAction);
  }, [handleNewPatient, handlePrint, handleWhatsApp, handleBarcode, handleSave]);

  return (
    <div
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box',
        flexShrink: 0,
        zIndex: 20,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        ...style,
      }}
    >
      {/* 1. Right to Left Actions (In RTL layout: Save is rightmost) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Save (F9) Primary Teal */}
        <button
          type="button"
          data-shift-nav="save-btn"
          onClick={handleSave}
          disabled={!canSave}
          style={{
            height: '38px',
            padding: '0 18px',
            backgroundColor: canSave ? '#0f766e' : 'var(--border-color)',
            color: canSave ? '#ffffff' : 'var(--text-dim)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: canSave ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.15s ease',
          }}
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>حفظ</span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: canSave ? '#0b5f58' : 'var(--bg-card-subtle)',
              color: canSave ? '#ffffff' : 'var(--text-dim)',
              padding: '1px 5px',
              borderRadius: '4px',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            F9
          </span>
        </button>

        {/* Print report (F10) */}
        <button
          type="button"
          onClick={handlePrint}
          disabled={!canPrint}
          style={{
            height: '38px',
            padding: '0 14px',
            backgroundColor: canPrint ? 'var(--bg-input)' : 'var(--bg-card-subtle)',
            color: canPrint ? 'var(--text-main)' : 'var(--text-dim)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: canPrint ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Printer size={15} />
          <span>طباعة التقرير</span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card-hover)',
              padding: '1px 5px',
              borderRadius: '4px',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            F10
          </span>
        </button>

        {/* WhatsApp (F8) */}
        <button
          type="button"
          onClick={handleWhatsApp}
          disabled={!canWhatsApp}
          title={
            !hasPhone
              ? 'أدخل رقم هاتف المريض للإرسال عبر واتساب'
              : !isComplete
              ? `يتبقى ${remainingCount} فحص بدون نتيجة`
              : 'إرسال عبر واتساب'
          }
          style={{
            height: '38px',
            padding: '0 14px',
            backgroundColor: canWhatsApp ? 'var(--bg-input)' : 'var(--bg-card-subtle)',
            color: canWhatsApp ? 'var(--text-main)' : 'var(--text-dim)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: canWhatsApp ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Send size={15} />
          <span>واتساب</span>
          {!isComplete && hasTests && (
            <span style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 500 }}>
              (متبقي {remainingCount})
            </span>
          )}
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card-hover)',
              padding: '1px 5px',
              borderRadius: '4px',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            F8
          </span>
        </button>

        {/* Barcode (F2) */}
        <button
          type="button"
          onClick={handleBarcode}
          style={{
            height: '38px',
            padding: '0 12px',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Barcode size={15} />
          <span>باركود</span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card-hover)',
              padding: '1px 5px',
              borderRadius: '4px',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            F2
          </span>
        </button>

        {/* New patient (F1) */}
        <button
          type="button"
          onClick={handleNewPatient}
          style={{
            height: '38px',
            padding: '0 12px',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <UserPlus size={15} />
          <span>مريض جديد</span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card-hover)',
              padding: '1px 5px',
              borderRadius: '4px',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            F1
          </span>
        </button>
      </div>

      {/* 2. Middle & Left Side: Status + Test Count + Total */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Real Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
          {savedSample ? (
            <span style={{ color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} color="var(--accent-teal)" />
              تم الحفظ على هذا الجهاز (#{savedSample.sampleNumber || savedSample.id})
            </span>
          ) : isProcessing ? (
            <span style={{ color: 'var(--text-muted)' }}>جارٍ حفظ الطلب...</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>جاهز</span>
          )}
        </div>

        {/* Test Count */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          {selectedTests.length} فحص
        </div>

        {/* Total (Leftmost, LTR isolate, zero discount) */}
        <div
          dir="ltr"
          style={{
            fontSize: '16px',
            fontWeight: 800,
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            direction: 'ltr',
            unicodeBidi: 'isolate',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>الإجمالي:</span>
          <span
            style={{
              color: 'var(--accent-teal)',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            {invoice.netTotal.toLocaleString()} د.ع
          </span>
        </div>
      </div>
    </div>
  );
}
