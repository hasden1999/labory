'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Barcode,
  Printer,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useToast } from '../../../components/Toast';
import { useLab } from '../../../components/LabContext';
import { apiRequest } from '../../../lib/api';
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

/**
 * UnifiedActionBar (English LTR Clinical Pro Max Design System)
 * Bottom floating action bar providing ergonomic keyboard shortcuts:
 * - F1: New Patient (Reset form & focus on patient name)
 * - F2: Print Barcode (Direct thermal sticker 50x25mm printing)
 * - F9: Save & Print PDF (Save sample & results, open /api/samples/[id]/print)
 * - F10: Send WhatsApp (Direct patient report notification via wa.me/964...)
 */
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

  // --------------------------------------------------------------------------
  // WhatsApp Validation & Guards
  // --------------------------------------------------------------------------
  const normalizedPhone = normalizeIraqiPhone(workspace.patient.phone);
  const hasPhone = Boolean(normalizedPhone);
  const hasTests = workspace.selectedTests.length > 0;

  // Format tests and results map for canonical completeness check
  const resultsMap: Record<string, { resultValue: string }> = {};
  Object.entries(workspace.results).forEach(([id, r]) => {
    resultsMap[id] = { resultValue: r.value };
  });

  const sampleTestsForCheck = workspace.selectedTests.map((t) => ({
    id: t.id,
    test: t,
    resultValue: workspace.results[t.id]?.value || '',
  }));

  const isComplete = hasTests && isOrderComplete(sampleTestsForCheck, resultsMap);
  const canSendWhatsApp = hasPhone && isComplete;

  let whatsAppTooltip = '';
  if (!hasPhone) {
    whatsAppTooltip = 'يرجى إدخال رقم هاتف المريض لتفعيل إرسال الواتساب';
  } else if (!hasTests) {
    whatsAppTooltip = 'يرجى اختيار الفحوصات وإدخال النتائج لتفعيل إرسال الواتساب';
  } else if (!isComplete) {
    whatsAppTooltip = 'الفحوصات غير مكتملة: أدخل جميع النتائج قبل الإرسال عبر الواتساب';
  } else {
    whatsAppTooltip = 'إرسال التقرير الطبي المعتمد إلى واتساب المريض (F10)';
  }

  // --------------------------------------------------------------------------
  // Action Handlers
  // --------------------------------------------------------------------------

  // F1: New Patient (Reset form & focus on patient name)
  const handleF1NewPatient = useCallback(() => {
    workspace.resetPatient();
    setSavedSample(null);

    // Auto-focus patient name input
    setTimeout(() => {
      const nameInput = document.querySelector(
        'input[name="patientName"], input[placeholder*="Patient Full Name"], input[placeholder*="Haider"]'
      ) as HTMLInputElement | null;
      if (nameInput) {
        nameInput.focus();
      }
    }, 40);

    toast.info('Workspace reset for new patient (F1)');
  }, [workspace, toast]);

  // Execute Save Sample (Zero Discount Core)
  const executeSaveSample = useCallback(async () => {
    const { patient, selectedTests, results, invoice } = workspace;

    if (!patient.name.trim()) {
      toast.warning('Patient name is required to save sample');
      return null;
    }

    if (selectedTests.length === 0) {
      toast.warning('Please select at least one test to save sample');
      return null;
    }

    setIsProcessing(true);
    workspace.setIsSaving(true);

    try {
      // 1. Post Sample creation (Zero Discount System: discount = 0)
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
        discount: 0,
        discountPercent: 0,
        priceTotal: invoice.netTotal,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingBalance,
        paymentMethod: invoice.paymentMethod,
        notes: patient.notes.trim() || undefined,
      };

      const result = await apiRequest('/samples', 'POST', payload);
      setSavedSample(result);
      if (onSavedSample) onSavedSample(result);

      // 2. Persist any entered results to sampleTest rows
      if (result?.id && result.tests && Array.isArray(result.tests)) {
        const resultsPayload = result.tests.map((st: any) => {
          const testId = st.testId || st.test?.id;
          const entered = results[testId];
          return {
            sampleTestId: st.id,
            resultValue: entered ? entered.value : '',
            isAbnormal: entered ? entered.status === 'HIGH' || entered.status === 'LOW' || entered.status === 'PANIC' : false,
            interpretation: entered ? entered.status : 'Normal',
          };
        });

        if (resultsPayload.length > 0) {
          try {
            await apiRequest(`/samples/${result.id}/results`, 'PUT', {
              results: resultsPayload,
              tests: resultsPayload,
              status: isComplete ? 'READY' : 'PENDING',
              markReady: isComplete,
            });
          } catch (resErr) {
            console.warn('Silent results update notice:', resErr);
          }
        }
      }

      return result;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save sample');
      return null;
    } finally {
      setIsProcessing(false);
      workspace.setIsSaving(false);
    }
  }, [workspace, isComplete, onSavedSample, toast]);

  // F2: Print Barcode (Direct thermal sticker 50x25mm printing)
  const handleF2PrintBarcode = useCallback(async () => {
    let targetSample = savedSample;

    if (!targetSample?.id) {
      if (!workspace.patient.name.trim() || workspace.selectedTests.length === 0) {
        toast.warning('Please enter patient name and select tests to print barcode sticker (F2)');
        return;
      }
      targetSample = await executeSaveSample();
    }

    if (!targetSample?.id) return;

    try {
      const printUrl = `/api/samples/${targetSample.id}/barcode?autoprint=true`;
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

      toast.success(`Printing thermal barcode sticker 50x25mm for Sample #${targetSample.sampleNumber || ''} (F2)`);
    } catch (printErr) {
      console.error('Barcode print error:', printErr);
      window.open(`/api/samples/${targetSample.id}/barcode?autoprint=true`, '_blank');
    }
  }, [savedSample, workspace.patient.name, workspace.selectedTests.length, executeSaveSample, toast]);

  // F9: Save & Print PDF (Save sample & results, open /api/samples/[id]/print)
  const handleF9SaveAndPrint = useCallback(async () => {
    const saved = await executeSaveSample();
    if (!saved?.id) return;

    try {
      const printUrl = `/api/samples/${saved.id}/print`;
      window.open(printUrl, '_blank');
      toast.success(`Sample #${saved.sampleNumber || ''} saved and clinical PDF preview opened (F9)`);
    } catch (err) {
      console.error('Print PDF preview error:', err);
    }
  }, [executeSaveSample, toast]);

  // F10: Send WhatsApp
  const handleF10SendWhatsApp = useCallback(async () => {
    if (!canSendWhatsApp) {
      toast.warning(whatsAppTooltip);
      return;
    }

    let targetSample = savedSample;
    if (!targetSample?.id) {
      targetSample = await executeSaveSample();
    }

    if (!targetSample?.id) return;

    try {
      const formattedLines = workspace.selectedTests.map((t) => {
        const entered = workspace.results[t.id];
        return {
          name: t.name,
          value: entered ? entered.value : '',
          unit: t.unit || '',
        };
      });

      const message = buildWhatsAppMessage({
        labName: labProfile?.labName || 'Laboratory',
        patientName: workspace.patient.name,
        date: new Date().toISOString().split('T')[0],
        sampleNumber: String(targetSample.sampleNumber || ''),
        lines: formattedLines,
      });

      const waLink = buildWaLink(workspace.patient.phone, message);
      if (waLink) {
        window.open(waLink, '_blank');
        toast.success('WhatsApp link opened for report dispatch (F10)');
      } else {
        toast.warning('Invalid patient phone number format');
      }
    } catch (err: any) {
      toast.error('Failed to construct WhatsApp message');
    }
  }, [canSendWhatsApp, savedSample, workspace, labProfile, whatsAppTooltip, executeSaveSample, toast]);

  // --------------------------------------------------------------------------
  // Keyboard Shortcut Listeners (F1, F2, F9, F10)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleF1NewPatient();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleF2PrintBarcode();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleF9SaveAndPrint();
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (canSendWhatsApp) {
          handleF10SendWhatsApp();
        } else {
          toast.warning(whatsAppTooltip);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleF1NewPatient, handleF2PrintBarcode, handleF9SaveAndPrint, handleF10SendWhatsApp, canSendWhatsApp, whatsAppTooltip, toast]);

  return (
    <div
      dir="ltr"
      className={className}
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderRadius: '9999px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #cbd5e1',
        padding: '6px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        ...style,
      }}
    >
      {/* 1. New Patient (F1) */}
      <button
        type="button"
        onClick={handleF1NewPatient}
        style={{
          padding: '7px 14px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 800,
          backgroundColor: '#f1f5f9',
          color: '#1e293b',
          border: '1px solid #cbd5e1',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
        title="F1: مسح النموذج وبدء مريض جديد"
      >
        <RotateCcw size={13} color="#64748b" />
        <span>مريض جديد (F1)</span>
      </button>

      {/* 2. Print Barcode (F2) */}
      <button
        type="button"
        onClick={handleF2PrintBarcode}
        disabled={isProcessing}
        style={{
          padding: '7px 14px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 800,
          backgroundColor: '#ffffff',
          color: '#334155',
          border: '1px solid #cbd5e1',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
        title="F2: طباعة لاصق باركود حراري للأنابيب 50x25mm"
      >
        <Barcode size={14} color="#64748b" />
        <span>طباعة باركود (F2)</span>
      </button>

      {/* 3. Send WhatsApp (F10) */}
      <button
        type="button"
        onClick={handleF10SendWhatsApp}
        disabled={!canSendWhatsApp || isProcessing}
        style={{
          padding: '7px 14px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 800,
          backgroundColor: canSendWhatsApp ? '#10b981' : '#f1f5f9',
          color: canSendWhatsApp ? '#ffffff' : '#94a3b8',
          border: canSendWhatsApp ? 'none' : '1px solid #e2e8f0',
          cursor: canSendWhatsApp && !isProcessing ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: canSendWhatsApp ? 1 : 0.6,
          transition: 'all 0.15s ease',
        }}
        title={whatsAppTooltip}
      >
        <Send size={13} />
        <span>إرسال واتساب (F10)</span>
      </button>

      {/* 4. Save & Print PDF (F9) */}
      <button
        type="button"
        data-shift-nav="save-btn"
        onClick={handleF9SaveAndPrint}
        disabled={isProcessing || workspace.isSaving}
        style={{
          padding: '7px 20px',
          borderRadius: '9999px',
          fontSize: '12.5px',
          fontWeight: 900,
          backgroundColor: '#0d9488',
          color: '#ffffff',
          border: 'none',
          cursor: isProcessing || workspace.isSaving ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isProcessing || workspace.isSaving ? 0.7 : 1,
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)',
          transition: 'all 0.15s ease',
        }}
        title="F9: حفظ بيانات العينة والنتائج وإصدار التقرير الطبي للطباعة"
      >
        {isProcessing || workspace.isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Printer size={14} />
        )}
        <span>حفظ وطباعة النتيجة (F9)</span>
      </button>

      {/* Sample Number Badge if saved */}
      {savedSample?.sampleNumber && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '9999px',
            backgroundColor: '#f0fdfa',
            color: '#0d9488',
            border: '1px solid #99f6e4',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '4px',
          }}
        >
          <CheckCircle2 size={13} />
          <span>#{savedSample.sampleNumber}</span>
        </span>
      )}
    </div>
  );
}
