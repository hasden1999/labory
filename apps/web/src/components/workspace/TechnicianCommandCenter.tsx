'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../Toast';
import { useLab } from '../LabContext';
import { toEnglishDigits, formatEnglishDate, formatEnglishTime, formatClinicalAge } from '../../lib/formatters';
import { INITIAL_TESTS_CATALOG } from '../../lib/catalogData';
import {
  Search,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  FlaskConical,
  AlertTriangle,
  Send,
  RefreshCw,
  User,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowDown,
  ArrowUp,
  Sliders,
  Maximize2,
  Smartphone
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  phone?: string;
  age?: number | null;
  gender: 'MALE' | 'FEMALE';
}

interface SampleTest {
  id: string;
  sampleId: string;
  testId: string;
  test: {
    id: string;
    code: string;
    name: string;
    arabicName?: string;
    unit?: string;
    refRangeLow?: number | null;
    refRangeHigh?: number | null;
    refRangeText?: string | null;
    panicLow?: number | null;
    panicHigh?: number | null;
    category?: string;
  };
  resultValue?: string | null;
  isAbnormal?: boolean;
  notes?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface Sample {
  id: string;
  sampleNumber: number;
  patientId: string;
  patient: Patient;
  doctorId?: string | null;
  doctor?: { id: string; name: string } | null;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
  isUrgent: boolean;
  priceTotal: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  createdAt: string;
  tests: SampleTest[];
}

export default function TechnicianCommandCenter({
  onOpenReport,
}: {
  onOpenReport?: (sampleId: string) => void;
}) {
  const toast = useToast();
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';

  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'READY'>('ALL');

  // Active Results Form State
  const [testResults, setTestResults] = useState<{ [testId: string]: string }>({});
  const [savingResults, setSavingResults] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number>(0);

  // Quick Patient Intake Modal
  const [showNewIntakeModal, setShowNewIntakeModal] = useState(false);
  const [intakeName, setIntakeName] = useState('');
  const [intakeAge, setIntakeAge] = useState('');
  const [intakeGender, setIntakeGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeUrgent, setIntakeUrgent] = useState(false);
  const [intakeSelectedTests, setIntakeSelectedTests] = useState<string[]>([]);
  const [availableTests, setAvailableTests] = useState<any[]>(() => INITIAL_TESTS_CATALOG || []);
  const [testSearch, setTestSearch] = useState('');
  const [creatingSample, setCreatingSample] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);

  // References for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Load Samples
  const loadSamples = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiRequest('/samples?dateFilter=TODAY');
      if (Array.isArray(res)) {
        setSamples(res);
        // If no sample selected or previous selection updated, keep selected
        setSelectedSample((prev) => {
          if (!prev) return res[0] || null;
          const found = res.find((s) => s.id === prev.id);
          return found || res[0] || null;
        });
      }
    } catch (err: any) {
      console.warn('Failed to load samples', err?.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // 2. Load Tests Catalog for Quick Intake
  useEffect(() => {
    loadSamples();
    apiRequest('/tests')
      .then((res) => {
        if (Array.isArray(res)) setAvailableTests(res);
      })
      .catch(() => {});
  }, [loadSamples]);

  // 3. Sync Results when Selected Sample changes
  useEffect(() => {
    if (selectedSample && Array.isArray(selectedSample.tests)) {
      const mapping: { [testId: string]: string } = {};
      selectedSample.tests.forEach((st) => {
        mapping[st.id] = st.resultValue || '';
      });
      setTestResults(mapping);
      // Auto-focus first input after brief render
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0]?.focus();
          inputRefs.current[0]?.select();
        }
      }, 50);
    }
  }, [selectedSample]);

  // 4. Global Keyboard Navigation Hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + N: Open new intake
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowNewIntakeModal(true);
      }
      // Ctrl + S: Save results
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveResults();
      }
      // Ctrl + P: Print current report
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (selectedSample) {
          handlePrintReport(selectedSample.id);
        }
      }
      // F2 or Slash (/): Search
      if (e.key === 'F2' || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowNewIntakeModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSample, testResults]);

  // 5. Handle Numpad Qualitative Value Mapping
  const handleResultChange = (testSampleId: string, rawVal: string) => {
    let val = rawVal;
    // Map single numeric keystrokes for qualitative tests
    if (val === '0') val = 'Negative (سلبي)';
    else if (val === '1') val = 'Positive (إيجابي)';
    else if (val === '2') val = 'Trace (أثر)';
    else if (val === '3') val = '++ (متوسط)';
    else if (val === '4') val = '+++ (مرتفع جداً)';

    setTestResults((prev) => ({
      ...prev,
      [testSampleId]: val,
    }));
  };

  // 6. Handle Numpad Enter / Arrow Navigation
  const handleInputKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = e.shiftKey ? index - 1 : index + 1;
      if (nextIndex >= 0 && nextIndex < inputRefs.current.length) {
        inputRefs.current[nextIndex]?.focus();
        inputRefs.current[nextIndex]?.select();
        setActiveInputIndex(nextIndex);
      } else if (nextIndex >= inputRefs.current.length) {
        // Last input reached: prompt save
        handleSaveResults();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index + 1 < inputRefs.current.length) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index - 1 >= 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // 7. Clinical Evaluation: Normal, High, Low, Panic
  const evaluateValue = (valStr: string, test: any) => {
    if (!valStr || !test) return { status: 'NORMAL', label: '', flag: '' };
    const num = parseFloat(valStr);
    if (isNaN(num)) return { status: 'NORMAL', label: '', flag: '' };

    // Check Panic Limits
    if (test.panicHigh !== null && test.panicHigh !== undefined && num >= test.panicHigh) {
      return { status: 'PANIC_HIGH', label: 'قيمة حرجة جداً (Panic High)', flag: '▲▲' };
    }
    if (test.panicLow !== null && test.panicLow !== undefined && num <= test.panicLow) {
      return { status: 'PANIC_LOW', label: 'قيمة حرجة جداً (Panic Low)', flag: '▼▼' };
    }

    // Check Reference Ranges
    if (test.refRangeHigh !== null && test.refRangeHigh !== undefined && num > test.refRangeHigh) {
      return { status: 'HIGH', label: 'مرتفع عن الطبيعي', flag: '▲' };
    }
    if (test.refRangeLow !== null && test.refRangeLow !== undefined && num < test.refRangeLow) {
      return { status: 'LOW', label: 'منخفض عن الطبيعي', flag: '▼' };
    }

    return { status: 'NORMAL', label: 'طبيعي', flag: '✓' };
  };

  // 8. Save Active Results
  const handleSaveResults = async () => {
    if (!selectedSample) return;
    setSavingResults(true);

    try {
      const updates = (selectedSample.tests || []).map((st) => ({
        sampleTestId: st.id,
        resultValue: testResults[st.id] ?? '',
        notes: st.notes || '',
      }));

      await apiRequest(`/samples/${selectedSample.id}/results`, 'PUT', { results: updates });

      // Automatically update status to READY if all results filled
      const allFilled = updates.every((u) => u.resultValue.trim().length > 0);
      if (allFilled && selectedSample.status !== 'READY') {
        await apiRequest(`/samples/${selectedSample.id}`, 'PATCH', { status: 'READY' });
      }

      toast.success('تم حفظ واعتماد نتائج التحاليل بنجاح!', 'تم الحفظ');
      loadSamples(true);
    } catch (err: any) {
      toast.error(err?.message || 'فشل حفظ النتائج', 'خطأ');
    } finally {
      setSavingResults(false);
    }
  };

  // 9. Quick Print Report
  const handlePrintReport = (sampleId: string) => {
    if (onOpenReport) {
      onOpenReport(sampleId);
    } else {
      window.open(`/samples/${sampleId}/print`, '_blank');
    }
  };

  // 10. Quick Patient Intake Submit
  const handleCreateIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntakeError(null);

    const name = intakeName.trim();
    if (!name) {
      const msg = 'يرجى كتابة اسم المريض الكامل قبل الحفظ';
      setIntakeError(msg);
      toast.warning(msg, 'اسم المريض مطلوب');
      return;
    }

    let finalTestIds = [...intakeSelectedTests];
    if (finalTestIds.length === 0) {
      // Auto-assign default test (CBC or first available) so technician is never blocked from saving!
      const defaultTest = availableTests.find(t => t.code === 'CBC') || availableTests[0];
      if (defaultTest) {
        finalTestIds = [defaultTest.id];
        toast.info(`تم إدراج فحص (${defaultTest.name}) تلقائياً لبدء العمل`);
      }
    }

    setCreatingSample(true);
    try {
      const payload = {
        patientName: name,
        age: intakeAge ? parseInt(intakeAge, 10) : null,
        gender: intakeGender,
        phone: intakePhone.trim() || undefined,
        isUrgent: intakeUrgent,
        testIds: finalTestIds,
      };

      const res = await apiRequest('/samples', 'POST', payload);
      toast.success(`تم تسجيل العينة #${toEnglishDigits(res.sampleNumber)} بنجاح!`, 'تمت الإضافة');
      setShowNewIntakeModal(false);
      // Reset form
      setIntakeName('');
      setIntakeAge('');
      setIntakePhone('');
      setIntakeSelectedTests([]);
      setIntakeUrgent(false);
      setIntakeError(null);

      await loadSamples(true);
      if (res && res.id) {
        setSelectedSample(res);
      }
    } catch (err: any) {
      console.error('Error creating sample:', err);
      const errMsg = err?.message || 'فشل تسجيل العينة، يرجى المحاولة مرة أخرى';
      setIntakeError(errMsg);
      toast.error(errMsg, 'خطأ في الحفظ');
    } finally {
      setCreatingSample(false);
    }
  };

  // Stats Counters
  const stats = useMemo(() => {
    const total = samples.length;
    const pending = samples.filter((s) => s.status === 'RECEIVED' || s.status === 'IN_PROGRESS').length;
    const ready = samples.filter((s) => s.status === 'READY' || s.status === 'DELIVERED').length;
    const urgent = samples.filter((s) => s.isUrgent).length;
    return { total, pending, ready, urgent };
  }, [samples]);

  // Filtered Queue
  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const matchQuery =
        !searchQuery ||
        s.sampleNumber.toString().includes(searchQuery) ||
        (s.patient?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.patient?.phone || '').includes(searchQuery);

      if (!matchQuery) return false;
      if (filterStatus === 'PENDING') return s.status === 'RECEIVED' || s.status === 'IN_PROGRESS';
      if (filterStatus === 'READY') return s.status === 'READY' || s.status === 'DELIVERED';
      return true;
    });
  }, [samples, searchQuery, filterStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      {/* =========================================================================
          1. Speed Header Bar (Counters & Instant Actions)
          ========================================================================= */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <FlaskConical size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              مركز قيادة فني المختبر
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              إدخال النتائج السريع بالـ Numpad • كشف القيم الحرجة • طباعة فورية
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>إجمالي اليوم: </span>
            <strong style={{ color: 'var(--text-main)', fontFamily: 'JetBrains Mono' }}>{stats.total}</strong>
          </div>
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
            }}
          >
            <span style={{ color: '#0284c7' }}>بانتظار الفحص: </span>
            <strong style={{ color: '#0284c7', fontFamily: 'JetBrains Mono' }}>{stats.pending}</strong>
          </div>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
            }}
          >
            <span style={{ color: '#10b981' }}>جاهزة للتسليم: </span>
            <strong style={{ color: '#10b981', fontFamily: 'JetBrains Mono' }}>{stats.ready}</strong>
          </div>
          {stats.urgent > 0 && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid #dc2626',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                color: '#ef4444',
                fontWeight: 800,
              }}
            >
              <span>🚨 عينات عاجلة: </span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{stats.urgent}</span>
            </div>
          )}
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowNewIntakeModal(true)}
            className="btn-cyan-primary"
            style={{ padding: '7px 14px', fontSize: '12px', gap: '6px', height: '34px' }}
          >
            <Plus size={15} />
            <span>مريض وعينة جديدة (Ctrl+N)</span>
          </button>
          <button
            type="button"
            onClick={() => loadSamples(false)}
            className="btn-secondary"
            style={{ padding: '7px 10px', height: '34px' }}
            title="تحديث القائمة"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. Bento Clinical Workspace (Split View)
          ========================================================================= */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* -----------------------------------------------------------------------
            Left/Right: Sample Queue Sidebar (32% width)
            ----------------------------------------------------------------------- */}
        <div
          style={{
            width: '320px',
            minWidth: '280px',
            maxWidth: '380px',
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', right: '10px', top: '10px' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="بحث بالاسم أو رقم العينة (F2 أو /)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 32px 7px 10px',
                  fontSize: '12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'PENDING', label: 'بانتظار الفحص' },
                { id: 'READY', label: 'المكتملة' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: filterStatus === tab.id ? '1px solid #0891b2' : '1px solid transparent',
                    background: filterStatus === tab.id ? 'rgba(8, 145, 178, 0.12)' : 'transparent',
                    color: filterStatus === tab.id ? '#0891b2' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {loading && samples.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                جاري تحميل عينات اليوم...
              </div>
            ) : filteredSamples.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                <p style={{ marginBottom: '10px' }}>لا توجد عينات مطابقة للبحث</p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setIntakeName(searchQuery.trim());
                      setShowNewIntakeModal(true);
                    }}
                    className="btn-cyan-primary"
                    style={{ fontSize: '11px', padding: '6px 12px', gap: '6px' }}
                  >
                    <Plus size={13} />
                    <span>تسجيل "{searchQuery.trim()}" كعينة جديدة</span>
                  </button>
                )}
              </div>
            ) : (
              filteredSamples.map((s) => {
                const isSelected = selectedSample?.id === s.id;
                const isReady = s.status === 'READY' || s.status === 'DELIVERED';
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSample(s)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #0891b2' : '1px solid var(--border-color)',
                      background: isSelected
                        ? 'rgba(8, 145, 178, 0.08)'
                        : s.isUrgent
                        ? 'rgba(220, 38, 38, 0.04)'
                        : 'var(--bg-card)',
                      transition: 'all 0.12s ease',
                      position: 'relative',
                    }}
                  >
                    {s.isUrgent && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          fontSize: '9.5px',
                          fontWeight: 900,
                          background: '#dc2626',
                          color: '#fff',
                          padding: '1px 5px',
                          borderRadius: '3px',
                        }}
                      >
                        عاجل STAT
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: '13px',
                          fontWeight: 900,
                          color: isSelected ? '#0891b2' : 'var(--text-main)',
                        }}
                      >
                        #{toEnglishDigits(s.sampleNumber)}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                          color: isReady ? '#10b981' : '#0284c7',
                        }}
                      >
                        {isReady ? 'جاهزة' : 'قيد الفحص'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {s.patient?.name || 'مريض غير مسمى'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      <span>
                        {s.patient?.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                        {formatClinicalAge(s.patient, s.createdAt) !== '-' ? ` (${formatClinicalAge(s.patient, s.createdAt)})` : ''}
                      </span>
                      <span>{s.tests?.length || 0} فحوصات</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            Main/Center: Active Results & Clinical Safety Grid (68% width)
            ----------------------------------------------------------------------- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
          {selectedSample ? (
            <>
              {/* Selected Sample Information Banner */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      background: 'rgba(8, 145, 178, 0.1)',
                      border: '1px solid rgba(8, 145, 178, 0.3)',
                      padding: '4px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: '#0891b2', display: 'block', fontWeight: 700 }}>
                      رقم العينة
                    </span>
                    <strong style={{ fontSize: '17px', color: '#0891b2', fontFamily: 'JetBrains Mono' }}>
                      #{toEnglishDigits(selectedSample.sampleNumber)}
                    </strong>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                        {selectedSample.patient?.name}
                      </h2>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {selectedSample.patient?.gender === 'MALE' ? 'ذكر' : 'أنثى'} •{' '}
                        {formatClinicalAge(selectedSample.patient, selectedSample.createdAt) !== '-' ? formatClinicalAge(selectedSample.patient, selectedSample.createdAt) : 'العمر غير مسجل'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      الطبيب المحيل: <strong>{selectedSample.doctor?.name || 'مريض مباشر'}</strong> • وقت السحب:{' '}
                      {formatEnglishTime(selectedSample.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handlePrintReport(selectedSample.id)}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '12px', gap: '6px' }}
                  >
                    <Printer size={15} />
                    <span>طباعة التقرير (Ctrl+P)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveResults}
                    disabled={savingResults}
                    className="btn-cyan-primary"
                    style={{ padding: '7px 16px', fontSize: '12.5px', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{savingResults ? 'جاري الحفظ...' : 'حفظ واعتماد (Ctrl+S)'}</span>
                  </button>
                </div>
              </div>

              {/* Numpad Results Table */}
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr
                        style={{
                          background: 'var(--bg-card-subtle)',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}
                      >
                        <th style={{ padding: '10px 14px', width: '30%' }}>فحص التحليل الطبي</th>
                        <th style={{ padding: '10px 14px', width: '25%', textAlign: 'center' }}>
                          النتيجة (لوحة الأرقام Numpad)
                        </th>
                        <th style={{ padding: '10px 14px', width: '12%', textAlign: 'center' }}>الوحدة</th>
                        <th style={{ padding: '10px 14px', width: '20%' }}>المعدل الطبيعي الآمن</th>
                        <th style={{ padding: '10px 14px', width: '13%', textAlign: 'center' }}>مؤشر الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSample.tests || []).map((st, idx) => {
                        const val = testResults[st.id] || '';
                        const evaluation = evaluateValue(val, st.test);
                        const isPanic = evaluation.status.startsWith('PANIC');
                        const isHigh = evaluation.status === 'HIGH';
                        const isLow = evaluation.status === 'LOW';

                        return (
                          <tr
                            key={st.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              background: isPanic
                                ? 'rgba(220, 38, 38, 0.05)'
                                : idx % 2 === 0
                                ? 'transparent'
                                : 'rgba(255, 255, 255, 0.015)',
                              transition: 'background 0.1s ease',
                            }}
                          >
                            {/* Test Name & Code */}
                            <td style={{ padding: '8px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-input)',
                                    padding: '2px 5px',
                                    borderRadius: '3px',
                                    border: '1px solid var(--border-subtle)',
                                  }}
                                >
                                  {st.test?.code || idx + 1}
                                </span>
                                <div>
                                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                                    {st.test?.name}
                                  </strong>
                                  {st.test?.arabicName && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {st.test.arabicName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Result Numpad Input */}
                            <td style={{ padding: '6px 14px', textAlign: 'center' }}>
                              <input
                                ref={(el) => {
                                  inputRefs.current[idx] = el;
                                }}
                                type="text"
                                className={`numpad-input ${
                                  isPanic
                                    ? 'panic-active'
                                    : isHigh
                                    ? 'abnormal-high'
                                    : isLow
                                    ? 'abnormal-low'
                                    : ''
                                }`}
                                value={val}
                                onChange={(e) => handleResultChange(st.id, e.target.value)}
                                onKeyDown={(e) => handleInputKeyDown(idx, e)}
                                placeholder="0 = سالب | 1 = موجب"
                                style={{ width: '180px' }}
                              />
                            </td>

                            {/* Unit */}
                            <td
                              style={{
                                padding: '8px 14px',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                fontFamily: 'JetBrains Mono',
                              }}
                            >
                              {st.test?.unit || '—'}
                            </td>

                            {/* Reference Range */}
                            <td style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {st.test?.refRangeText ? (
                                <span>{st.test.refRangeText}</span>
                              ) : st.test?.refRangeLow !== null && st.test?.refRangeHigh !== null ? (
                                <span style={{ direction: 'ltr', display: 'inline-block', fontFamily: 'JetBrains Mono' }}>
                                  {st.test.refRangeLow} - {st.test.refRangeHigh}
                                </span>
                              ) : (
                                <span>طبيعي</span>
                              )}
                            </td>

                            {/* Evaluation Status & Flag */}
                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                              {val ? (
                                isPanic ? (
                                  <span className="panic-flag-badge">
                                    <AlertTriangle size={11} />
                                    <span>{evaluation.flag} حرج</span>
                                  </span>
                                ) : isHigh ? (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      color: '#f59e0b',
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ▲ مرتفع
                                  </span>
                                ) : isLow ? (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      color: '#0284c7',
                                      background: 'rgba(2, 132, 199, 0.12)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ▼ منخفض
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: '#10b981',
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ✓ طبيعي
                                  </span>
                                )
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>بانتظار الفحص</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Keyboard Shortcuts Helper Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span>
                    <kbd style={{ background: 'var(--bg-input)', border: '1px solid #475569', borderRadius: '3px', padding: '1px 5px' }}>Enter</kbd> الانتقال للفحص التالي
                  </span>
                  <span>
                    <kbd style={{ background: 'var(--bg-input)', border: '1px solid #475569', borderRadius: '3px', padding: '1px 5px' }}>Ctrl + S</kbd> حفظ النتائج
                  </span>
                  <span>
                    <kbd style={{ background: 'var(--bg-input)', border: '1px solid #475569', borderRadius: '3px', padding: '1px 5px' }}>Ctrl + P</kbd> طباعة التقرير
                  </span>
                  <span>
                    <kbd style={{ background: 'var(--bg-input)', border: '1px solid #475569', borderRadius: '3px', padding: '1px 5px' }}>0</kbd> = سالب • <kbd style={{ background: 'var(--bg-input)', border: '1px solid #475569', borderRadius: '3px', padding: '1px 5px' }}>1</kbd> = موجب
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '12px',
              }}
            >
              <FlaskConical size={48} color="var(--border-color)" />
              <p style={{ fontSize: '14px', fontWeight: 700 }}>اختر عينة من القائمة الجانبية لبدء إدخال النتائج</p>
              <button
                type="button"
                onClick={() => setShowNewIntakeModal(true)}
                className="btn-cyan-primary"
                style={{ fontSize: '13px' }}
              >
                <Plus size={15} />
                <span>تسجيل مريض وعينة جديدة (Ctrl+N)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. Fast Patient Intake Modal (Single-Screen Registration)
          ========================================================================= */}
      {showNewIntakeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }} dir="rtl">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#0891b2" />
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  تسجيل مريض وعينة سريعة (Fast Intake)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewIntakeModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIntake}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">اسم المريض الكامل *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="مثال: أحمد عبد الله رشيد"
                    className="input-control"
                    value={intakeName}
                    onChange={(e) => setIntakeName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">العمر (سنوات)</label>
                  <input
                    type="number"
                    placeholder="مثال: 35"
                    className="input-control"
                    value={intakeAge}
                    onChange={(e) => setIntakeAge(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">الجنس</label>
                  <select
                    className="select-control"
                    value={intakeGender}
                    onChange={(e) => setIntakeGender(e.target.value as any)}
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">رقم الهاتف (اختياري - للواتساب)</label>
                  <input
                    type="text"
                    placeholder="مثال: 07701234567"
                    className="input-control"
                    value={intakePhone}
                    onChange={(e) => setIntakePhone(e.target.value)}
                  />
                </div>
              </div>

              {/* STAT Emergency Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: intakeUrgent ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-input)',
                  border: intakeUrgent ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={intakeUrgent}
                  onChange={(e) => setIntakeUrgent(e.target.checked)}
                />
                <span style={{ fontSize: '12px', fontWeight: 800, color: intakeUrgent ? '#ef4444' : 'var(--text-main)' }}>
                  🚨 عينة عاجلة وفورية (STAT Emergency)
                </span>
              </label>

              {/* Fast Test Selection */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label" style={{ margin: 0 }}>
                    اختر الفحوصات المطلوبة ({intakeSelectedTests.length} فحص محدد)
                  </label>
                  {intakeSelectedTests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIntakeSelectedTests([])}
                      style={{ fontSize: '10.5px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      إلغاء التحديد
                    </button>
                  )}
                </div>

                {/* 1-Click Fast Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {[
                    { label: '+ صورة دم (CBC)', code: 'CBC' },
                    { label: '+ سكر (Glucose)', code: 'GLU' },
                    { label: '+ إدرار (GUE)', code: 'GUE' },
                    { label: '+ وظائف كلى (RFT)', code: 'UREA' },
                  ].map((p) => {
                    const testItem = availableTests.find(
                      (t) => t.code === p.code || (t.name && t.name.toLowerCase().includes(p.code.toLowerCase()))
                    );
                    if (!testItem) return null;
                    const isSel = intakeSelectedTests.includes(testItem.id);
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setIntakeSelectedTests((prev) =>
                            isSel ? prev.filter((id) => id !== testItem.id) : [...prev, testItem.id]
                          );
                        }}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isSel ? '1px solid #0891b2' : '1px solid var(--border-color)',
                          background: isSel ? 'rgba(8, 145, 178, 0.2)' : 'var(--bg-input)',
                          color: isSel ? '#0891b2' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="بحث سريع في كتالوج الفحوصات..."
                    className="input-control"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                  />
                </div>

                <div
                  className="custom-scrollbar"
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '6px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '4px',
                  }}
                >
                  {availableTests
                    .filter(
                      (t) =>
                        !testSearch ||
                        t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                        (t.arabicName || '').includes(testSearch) ||
                        t.code.toLowerCase().includes(testSearch.toLowerCase())
                    )
                    .map((t) => {
                      const isSel = intakeSelectedTests.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setIntakeSelectedTests((prev) =>
                              isSel ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textAlign: 'right',
                            border: isSel ? '1px solid #0891b2' : '1px solid var(--border-color)',
                            background: isSel ? 'rgba(8, 145, 178, 0.15)' : 'var(--bg-card)',
                            color: isSel ? '#0891b2' : 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.name}
                          </span>
                          {isSel && <Check size={12} />}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Inline Validation Alert */}
              {intakeError && (
                <div
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{intakeError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewIntakeModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingSample}
                  className="btn-cyan-primary"
                  style={{ padding: '8px 22px' }}
                >
                  {creatingSample ? 'جاري التسجيل...' : 'تسجيل وبدء الفحص فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
