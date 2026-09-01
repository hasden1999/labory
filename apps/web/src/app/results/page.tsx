'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useSearchParams } from 'next/navigation';
import { 
  FileText, 
  Search, 
  Printer, 
  Save, 
  AlertTriangle, 
  Check, 
  User, 
  Clock, 
  CheckCircle2, 
  Share2, 
  History, 
  Calculator, 
  FlaskConical, 
  X, 
  Eye, 
  Cpu,
  TestTube,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Microscope,
  Bug,
  Activity,
  Zap,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { useLab } from '../../components/LabContext';
import UrineFormModal, { UrineAnalysisData } from '../../components/UrineFormModal';
import GseModal from '../../components/workstations/GseModal';
import CbcModal from '../../components/workstations/CbcModal';
import ChemistryModal from '../../components/workstations/ChemistryModal';
import MicrobiologyModal from '../../components/workstations/MicrobiologyModal';
import { compareSampleWithHistory, DeltaCheckResult } from '../../lib/deltaCheck';

function ResultsContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const { labProfile } = useLab();

  // Preview Modal
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('');

  // Worklist / Samples
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'URGENT'>('ALL');
  const [loadingSamples, setLoadingSamples] = useState(true);

  // Results State
  const [testResults, setTestResults] = useState<Record<string, { resultValue: string; isAbnormal: boolean; interpretation?: string }>>({});
  const [savingResults, setSavingResults] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [deltaChecks, setDeltaChecks] = useState<Record<string, DeltaCheckResult>>({});

  // Refs for fast Shift / Enter navigation across table rows
  const resultInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleResultKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Shift' || e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = (index + 1) % (selectedSample?.tests?.length || 1);
      resultInputRefs.current[nextIndex]?.focus();
      resultInputRefs.current[nextIndex]?.select();
    }
  };

  // Workstation Modals
  const [showUrineModal, setShowUrineModal] = useState(false);
  const [showGseModal, setShowGseModal] = useState(false);
  const [showCbcModal, setShowCbcModal] = useState(false);
  const [showChemistryModal, setShowChemistryModal] = useState(false);
  const [showMicrobiologyModal, setShowMicrobiologyModal] = useState(false);
  const [showAddTestsModal, setShowAddTestsModal] = useState(false);
  const [allAvailableTests, setAllAvailableTests] = useState<any[]>([]);
  const [addTestSearch, setAddTestSearch] = useState('');
  const [selectedNewTests, setSelectedNewTests] = useState<any[]>([]);
  const [addingTests, setAddingTests] = useState(false);

  // Load Samples
  const loadSamples = async () => {
    try {
      setLoadingSamples(true);
      const res = await apiRequest('/samples');
      setSamples(res || []);
      
      const targetId = searchParams.get('sampleId');
      if (targetId && res) {
        const found = res.find((s: any) => s.id === targetId);
        if (found) selectSample(found);
      } else if (res && res.length > 0 && !selectedSample) {
        selectSample(res[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل العينات', 'خطأ');
    } finally {
      setLoadingSamples(false);
    }
  };

  useEffect(() => {
    loadSamples();
  }, [searchParams]);

  // Select Sample
  const selectSample = (sample: any) => {
    setSelectedSample(sample);
    const initial: Record<string, { resultValue: string; isAbnormal: boolean; interpretation?: string }> = {};
    sample.tests?.forEach((st: any) => {
      initial[st.id] = {
        resultValue: st.resultValue || '',
        isAbnormal: st.isAbnormal || false,
        interpretation: st.interpretation || '',
      };
    });
    setTestResults(initial);

    // Compute Delta Checks against patient's previous visits
    try {
      const patId = sample.patientId || sample.patient?.id;
      const patName = sample.patient?.name;
      const priorVisits = samples.filter((s: any) => 
        s.id !== sample.id && 
        ((patId && s.patientId === patId) || (patName && s.patient?.name === patName))
      );
      if (priorVisits.length > 0) {
        const deltas = compareSampleWithHistory(sample, priorVisits);
        setDeltaChecks(deltas);
      } else {
        setDeltaChecks({});
      }
    } catch (e) {
      console.error('Failed computing delta checks', e);
      setDeltaChecks({});
    }
  };

  // Helper to persist workstation results immediately
  const handleSaveWorkstationResult = async (categoryOrCode: string, serialized: string, isAbnormal: boolean) => {
    if (!selectedSample) return;

    let targetTest = selectedSample.tests?.find((st: any) => {
      const code = (st.test?.code || '').toUpperCase();
      const name = (st.test?.name || '').toUpperCase();
      if (categoryOrCode === 'GUE') return code === 'GUE' || name.includes('URINE') || name.includes('إدرار');
      if (categoryOrCode === 'GSE') return code === 'GSE' || name.includes('STOOL') || name.includes('خروج');
      if (categoryOrCode === 'CBC') return code === 'CBC' || name.includes('BLOOD') || name.includes('CBC') || name.includes('دم');
      if (categoryOrCode === 'MICROBIOLOGY') return code.includes('CULTURE') || name.includes('CULTURE') || name.includes('زرع');
      if (categoryOrCode === 'CHEMISTRY') return st.test?.category === 'CHEMISTRY' || code.includes('LFT') || code.includes('KFT') || code.includes('LIPID');
      return false;
    });

    if (!targetTest && selectedSample.tests?.length > 0) {
      targetTest = selectedSample.tests[0];
    }

    if (targetTest) {
      const nextResults = {
        ...testResults,
        [targetTest.id]: {
          resultValue: serialized,
          isAbnormal,
          interpretation: isAbnormal ? 'Abnormal Findings' : 'Normal',
        }
      };
      setTestResults(nextResults);

      try {
        const resultsPayload = Object.entries(nextResults).map(([sampleTestId, data]: [string, any]) => ({
          sampleTestId,
          resultValue: data.resultValue,
          isAbnormal: data.isAbnormal,
          interpretation: data.interpretation,
        }));

        await apiRequest(`/samples/${selectedSample.id}/results`, 'PUT', {
          results: resultsPayload,
          tests: resultsPayload,
          status: 'READY',
          markReady: true,
        });

        // Update local sample object
        setSelectedSample((prev: any) => ({
          ...prev,
          status: 'READY',
          tests: prev.tests.map((t: any) => 
            t.id === targetTest.id ? { ...t, resultValue: serialized, isAbnormal } : t
          )
        }));

        // Refresh sample queue
        const refreshed = await apiRequest('/samples');
        setSamples(refreshed || []);
      } catch (err: any) {
        console.error('Error saving workstation results:', err);
      }
    }
  };

  // Real-time Lipid & Bilirubin calculations
  const handleResultChange = (sampleTestId: string, val: string, test: any) => {
    const nextResults = { ...testResults };
    
    // Check abnormal / panic
    let isAbnormal = false;
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (test?.refRangeLow !== null && test?.refRangeLow !== undefined && num < test.refRangeLow) isAbnormal = true;
      if (test?.refRangeHigh !== null && test?.refRangeHigh !== undefined && num > test.refRangeHigh) isAbnormal = true;
    }

    nextResults[sampleTestId] = {
      ...nextResults[sampleTestId],
      resultValue: val,
      isAbnormal,
    };

    // Auto-calculate VLDL & LDL
    const tgTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'TG' || st.test?.name?.toLowerCase().includes('triglycerides'));
    const cholTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'CHOL' || st.test?.name?.toLowerCase().includes('cholesterol'));
    const hdlTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'HDL' || st.test?.name?.toLowerCase().includes('hdl'));
    const ldlTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'LDL' || st.test?.name?.toLowerCase().includes('ldl'));
    const vldlTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'VLDL' || st.test?.name?.toLowerCase().includes('vldl'));

    const currentTG = tgTest ? parseFloat(nextResults[tgTest.id]?.resultValue) : NaN;
    const currentCHOL = cholTest ? parseFloat(nextResults[cholTest.id]?.resultValue) : NaN;
    const currentHDL = hdlTest ? parseFloat(nextResults[hdlTest.id]?.resultValue) : NaN;

    if (!isNaN(currentTG) && vldlTest) {
      const vldlVal = (currentTG / 5).toFixed(1);
      nextResults[vldlTest.id] = {
        ...nextResults[vldlTest.id],
        resultValue: vldlVal,
        isAbnormal: parseFloat(vldlVal) > 30,
      };
    }

    if (!isNaN(currentCHOL) && !isNaN(currentHDL) && !isNaN(currentTG) && ldlTest) {
      if (currentTG < 400) {
        const ldlVal = (currentCHOL - currentHDL - (currentTG / 5)).toFixed(1);
        nextResults[ldlTest.id] = {
          ...nextResults[ldlTest.id],
          resultValue: ldlVal,
          isAbnormal: parseFloat(ldlVal) > 130,
        };
      }
    }

    setTestResults(nextResults);
  };

  // Save Results
  const handleSaveResults = async (markReady: boolean = true) => {
    if (!selectedSample) return;
    try {
      setSavingResults(true);
      const resultsPayload = Object.entries(testResults).map(([sampleTestId, data]: [string, any]) => ({
        sampleTestId,
        resultValue: data.resultValue,
        isAbnormal: data.isAbnormal,
        interpretation: data.interpretation,
      }));

      await apiRequest(`/samples/${selectedSample.id}/results`, 'PUT', {
        results: resultsPayload,
        markReady,
      });

      toast.success(markReady ? 'تم اعتماد وتجهيز التقرير للطباعة!' : 'تم حفظ النتائج كمسودة', 'تم الحفظ');
      
      if (markReady) {
        setDocPreviewUrl(`/api/samples/${selectedSample.id}/print`);
        setDocPreviewTitle(`Medical Report A4 - #${selectedSample.sampleNumber} (${selectedSample.patient?.name})`);
      }
      loadSamples();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ النتائج', 'خطأ');
    } finally {
      setSavingResults(false);
    }
  };

  // Milestone M4: WhatsApp Direct Share
  const handleSendWhatsApp = () => {
    if (!selectedSample) return;
    const patientPhone = selectedSample.patient?.phone;
    if (!patientPhone) {
      toast.error('المريض لا يمتلك رقم هاتف مسجل في المنظومة', 'تعذر الإرسال');
      return;
    }
    const cleanPhone = patientPhone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('0') ? '964' + cleanPhone.substring(1) : cleanPhone.startsWith('964') ? cleanPhone : '964' + cleanPhone;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
    const verifyUrl = `${origin}/verify/${selectedSample.id}`;
    const rawMessage = `مرحباً ${selectedSample.patient?.name}، تقرير التحليلات الطبية الخاص بك جاهز في ${labProfile?.labName || 'المختبر'}. رقم العينة: #${selectedSample.sampleNumber}. يمكنك الاطلاع على التقرير وتدقيقه عبر الرابط: ${verifyUrl}`;
    const whatsappLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent(rawMessage)}`;
    window.open(whatsappLink, '_blank');
  };

  // Filter Samples
  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.sampleNumber?.toString().includes(searchQuery) ||
        s.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStatus = true;
      if (statusFilter === 'URGENT') matchStatus = s.isUrgent;
      else if (statusFilter !== 'ALL') matchStatus = s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [samples, searchQuery, statusFilter]);

  // Open Add Tests Modal
  const handleOpenAddTestsModal = async () => {
    try {
      if (allAvailableTests.length === 0) {
        const res = await apiRequest('/catalog/tests');
        setAllAvailableTests(res || []);
      }
      setSelectedNewTests([]);
      setShowAddTestsModal(true);
    } catch (err: any) {
      toast.error('فشل تحميل قائمة الفحوصات');
    }
  };

  const handleConfirmAddTests = async () => {
    if (!selectedSample || selectedNewTests.length === 0) return;
    try {
      setAddingTests(true);
      const res = await apiRequest(`/samples/${selectedSample.id}/tests`, 'POST', {
        testIds: selectedNewTests.map(t => t.id),
      });
      toast.success(`تمت إضافة ${selectedNewTests.length} فحص جديد للعينة بنجاح!`);
      setShowAddTestsModal(false);
      selectSample(res);
      loadSamples();
    } catch (err: any) {
      toast.error(err.message || 'فشل إضافة الفحوصات');
    } finally {
      setAddingTests(false);
    }
  };

  return (
    <AppShell>
      {/* Main Mockup Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '18px', minHeight: 'calc(100vh - 120px)' }}>
        
        {/* LEFT: PATIENT SAMPLE QUEUE (Image 2 Style) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: 'calc(100vh - 120px)' }}>
          <span className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '12px' }}>
            PATIENT SAMPLE QUEUE
          </span>

          {/* Quick Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search Queue (Sample # / Name)..."
              className="input-control"
              style={{ paddingLeft: '28px', fontSize: '12px', height: '32px', background: '#0e1420' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Active Highlight Banner if selected */}
          {selectedSample && (
            <div style={{ padding: '12px', background: 'rgba(0, 210, 211, 0.15)', border: '1px solid var(--accent-cyan)', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  {selectedSample.patient?.name}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                  #{selectedSample.sampleNumber}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedSample.patient?.gender === 'FEMALE' ? 'Female' : 'Male'}, {selectedSample.patient?.age || '-'} yrs • {new Date(selectedSample.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {/* Queue List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
            {loadingSamples ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading queue...</div>
            ) : filteredSamples.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No samples found</div>
            ) : (
              filteredSamples.map((s) => {
                const isSelected = selectedSample?.id === s.id;
                const isReady = s.status === 'READY';
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSample(s)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSelected ? '#1b2436' : '#0e1420',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : '#1a2233'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '12.5px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)', display: 'block' }}>
                        {s.patient?.name}
                      </strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                        #{s.sampleNumber} • {s.tests?.length || 0} tests
                      </span>
                    </div>

                    <div>
                      {s.isUrgent ? (
                        <span className="badge badge-urgent" style={{ fontSize: '9.5px' }}>🔴 STAT</span>
                      ) : isReady ? (
                        <span className="badge badge-ready" style={{ fontSize: '9.5px' }}>VALIDATED</span>
                      ) : (
                        <span className="badge badge-received" style={{ fontSize: '9.5px' }}>IN PROGRESS</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: RESULTS ENTRY & VALIDATION (Image 2 Style) */}
        {selectedSample ? (
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header with Tools */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="input-label" style={{ margin: 0, fontSize: '12px', fontWeight: 800 }}>
                  RESULTS ENTRY & VALIDATION (إدخال وتدقيق النتائج)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Sample #{selectedSample.sampleNumber} • Patient: {selectedSample.patient?.name}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenAddTestsModal}
                  className="btn-secondary"
                  style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0,210,211,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                >
                  <Plus size={13} />
                  <span>➕ Add Tests</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrineModal(true)}
                  className="btn-secondary"
                  style={{ color: '#0284c7', borderColor: 'rgba(2,132,199,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                  title="محطة فحص الإدرار العام G.U.E"
                >
                  <TestTube size={13} />
                  <span>🧪 G.U.E</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGseModal(true)}
                  className="btn-secondary"
                  style={{ color: '#d97706', borderColor: 'rgba(217,119,6,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                  title="محطة فحص الخروج العام G.S.E"
                >
                  <Microscope size={13} />
                  <span>🧫 G.S.E</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCbcModal(true)}
                  className="btn-secondary"
                  style={{ color: '#e11d48', borderColor: 'rgba(225,29,72,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                  title="محطة تعداد الدم الكامل CBC"
                >
                  <Activity size={13} />
                  <span>🩸 CBC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowChemistryModal(true)}
                  className="btn-secondary"
                  style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                  title="محطة الكيمياء السريرية والحسابات التلقائية"
                >
                  <Zap size={13} />
                  <span>⚗️ Chemistry</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMicrobiologyModal(true)}
                  className="btn-secondary"
                  style={{ color: '#0d9488', borderColor: 'rgba(13,148,136,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                  title="محطة المزرعة وحساسية المضادات الحيوية"
                >
                  <Bug size={13} />
                  <span>🦠 Culture</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResults(true)}
                  disabled={savingResults}
                  className="btn-cyan-primary"
                  style={{ height: '32px', padding: '0 14px', fontSize: '11.5px' }}
                >
                  <Printer size={13} />
                  <span>SAVE & PRINT ✓</span>
                </button>

                {selectedSample?.patient?.phone && (
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="btn-secondary"
                    style={{
                      color: '#10b981',
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      height: '32px',
                      fontSize: '11px',
                      padding: '0 10px',
                      background: 'rgba(16, 185, 129, 0.1)'
                    }}
                    title="إرسال تقرير المريض ورابط التحقق عبر واتساب"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Table (Image 2 Exact Layout) */}
            <div style={{ overflowX: 'auto', flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', background: '#0e1420' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1c2436', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '10px 14px' }}>PARAMETER</th>
                    <th style={{ padding: '10px 14px', width: '180px' }}>RESULT</th>
                    <th style={{ padding: '10px 14px' }}>RANGE</th>
                    <th style={{ padding: '10px 14px' }}>UNITS</th>
                    <th style={{ padding: '10px 14px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSample.tests?.map((st: any, index: number) => {
                    const currentVal = testResults[st.id]?.resultValue || '';
                    const isAbnormal = testResults[st.id]?.isAbnormal || false;
                    const numVal = parseFloat(currentVal);
                    const isPanic = !isNaN(numVal) && ((st.test?.panicLow && numVal < st.test.panicLow) || (st.test?.panicHigh && numVal > st.test.panicHigh));

                    return (
                      <React.Fragment key={st.id}>
                        <tr style={{ borderBottom: '1px solid #182233', background: isPanic ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{st.test?.name}</span>
                              {st.test?.code && (
                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px' }}>
                                  {st.test?.code}
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '8px 14px' }}>
                            {/* G.U.E Button */}
                            {(st.test?.code === 'GUE' || st.test?.name?.toLowerCase().includes('urine') || st.test?.name?.toLowerCase().includes('إدرار')) ? (
                              <button
                                type="button"
                                onClick={() => setShowUrineModal(true)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(2, 132, 199, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : '#0284c7'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : '#38bdf8',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <TestTube size={15} />
                                  <span>{currentVal ? '✓ تم إدخال فحص الإدرار (تعديل)' : '🧪 فتح فورمة الإدرار G.U.E'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>G.U.E</span>
                              </button>
                            ) : /* G.S.E Button */ (st.test?.code === 'GSE' || st.test?.name?.toLowerCase().includes('stool') || st.test?.name?.toLowerCase().includes('خروج')) ? (
                              <button
                                type="button"
                                onClick={() => setShowGseModal(true)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(217, 119, 6, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : '#d97706'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : '#fbbf24',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Microscope size={15} />
                                  <span>{currentVal ? '✓ تم إدخال فحص الخروج (تعديل)' : '🧫 فتح فورمة الخروج G.S.E'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>G.S.E</span>
                              </button>
                            ) : /* CBC Button */ (st.test?.code === 'CBC' || st.test?.name?.toLowerCase().includes('blood count') || st.test?.name?.toLowerCase().includes('cbc') || st.test?.name?.toLowerCase().includes('تعداد الدم')) ? (
                              <button
                                type="button"
                                onClick={() => setShowCbcModal(true)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(225, 29, 72, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : '#e11d48'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : '#fb7185',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Activity size={15} />
                                  <span>{currentVal ? '✓ تم إدخال فحص الدم (تعديل)' : '🩸 فتح محطة الدمويات CBC'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>CBC</span>
                              </button>
                            ) : /* Microbiology Button */ (st.test?.category === 'MICROBIOLOGY' || st.test?.code?.includes('CULTURE') || st.test?.name?.toLowerCase().includes('culture') || st.test?.name?.toLowerCase().includes('مزرعة')) ? (
                              <button
                                type="button"
                                onClick={() => setShowMicrobiologyModal(true)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(13, 148, 136, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : '#0d9488'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : '#2dd4bf',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Bug size={15} />
                                  <span>{currentVal ? '✓ تم إدخال المزرعة (تعديل)' : '🦠 فتح محطة المزرعة Culture'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Culture</span>
                              </button>
                            ) : (
                              <input
                                ref={(el) => { resultInputRefs.current[index] = el; }}
                                onKeyDown={(e) => handleResultKeyDown(e, index)}
                                type="text"
                                className="input-control"
                                style={{
                                  height: '34px',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  background: '#090d15',
                                  borderColor: isPanic ? '#ef4444' : isAbnormal ? '#f59e0b' : currentVal ? 'var(--accent-cyan)' : 'var(--border-color)',
                                  boxShadow: isPanic ? '0 0 10px rgba(239, 68, 68, 0.4)' : isAbnormal ? '0 0 8px rgba(245, 158, 11, 0.3)' : 'none',
                                  color: isPanic ? '#ef4444' : isAbnormal ? '#f59e0b' : 'var(--text-main)',
                                }}
                                placeholder="Enter value"
                                value={currentVal}
                                onChange={(e) => handleResultChange(st.id, e.target.value, st.test)}
                              />
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                            {st.test?.refRangeText || (st.test?.refRangeLow !== null && st.test?.refRangeHigh !== null ? `${st.test?.refRangeLow} - ${st.test?.refRangeHigh}` : 'N/A')}
                          </td>

                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                            {st.test?.unit || '-'}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {isPanic ? (
                                <span style={{ color: '#ef4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  🔴 PANIC
                                </span>
                              ) : isAbnormal ? (
                                <span style={{ color: '#f59e0b', fontWeight: 800 }}>
                                  ⚠️ Abnormal
                                </span>
                              ) : currentVal ? (
                                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                  Normal
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-dim)' }}>Pending</span>
                              )}

                              {/* Delta Check Alert Badge */}
                              {(() => {
                                const code = st.test?.code || st.test?.name;
                                const delta = deltaChecks[code] || (st.test?.code && deltaChecks[st.test.code]);
                                if (delta && delta.isBreached) {
                                  const isCrit = delta.badgeLevel === 'CRITICAL';
                                  return (
                                    <span
                                      title={delta.message || `تغير حاد مقارنة بالزيارة السابقة: ${delta.previousValue}`}
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: isCrit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                        color: isCrit ? '#ef4444' : '#f59e0b',
                                        border: `1px solid ${isCrit ? '#ef4444' : '#f59e0b'}`,
                                        cursor: 'help'
                                      }}
                                    >
                                      Δ {delta.deltaPercent}% {delta.direction === 'increased' ? '↑' : '↓'}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                        </tr>

                        {isPanic && (
                          <tr style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                            <td colSpan={5} style={{ padding: '6px 14px', color: '#ef4444', fontSize: '11.5px', fontWeight: 700 }}>
                              ⚠️ PANIC LIMIT WARNING: {st.test?.name} value ({currentVal}) exceeds critical clinical threshold!
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a patient sample from the queue on the left to enter results.
          </div>
        )}

      </div>

      {/* URINE ANALYSIS MODAL */}
      {showUrineModal && selectedSample && (
        <UrineFormModal
          isOpen={showUrineModal}
          onClose={() => setShowUrineModal(false)}
          patientName={selectedSample.patient?.name || ''}
          sampleNumber={selectedSample.sampleNumber}
          initialData={
            (() => {
              const gueTest = selectedSample.tests?.find((st: any) => 
                st.test?.code === 'GUE' || st.test?.name?.toLowerCase().includes('urine') || st.test?.name?.toLowerCase().includes('إدرار')
              );
              return testResults[gueTest?.id]?.resultValue || gueTest?.resultValue || '';
            })()
          }
          onApply={(formattedResult: string, rawData: UrineAnalysisData) => {
            setShowUrineModal(false);
            // Find GUE test and update result value
            const gueTest = selectedSample.tests?.find((st: any) => 
              st.test?.code === 'GUE' || st.test?.name?.toLowerCase().includes('urine') || st.test?.name?.toLowerCase().includes('إدرار')
            );
            if (gueTest) {
              const isAbnormal = 
                !['0-2', '2-4'].includes(rawData.pusCells) ||
                !['0-2'].includes(rawData.rbcs) ||
                rawData.protein !== 'Nil' ||
                rawData.glucose !== 'Nil' ||
                rawData.blood !== 'Negative' ||
                rawData.nitrite.includes('Positive') ||
                rawData.calciumOxalate === '+++';

              setTestResults(prev => ({
                ...prev,
                [gueTest.id]: {
                  resultValue: formattedResult,
                  isAbnormal,
                }
              }));
              toast.success('تم إدراج تقرير فحص الإدرار بنجاح!');
            }
          }}
        />
      )}

      {/* GSE MODAL */}
      {showGseModal && selectedSample && (
        <GseModal
          isOpen={showGseModal}
          onClose={() => setShowGseModal(false)}
          sample={selectedSample}
          initialValue={(() => {
            const t = selectedSample.tests?.find((st: any) => 
              st.test?.code === 'GSE' || st.test?.name?.toLowerCase().includes('stool') || st.test?.name?.toLowerCase().includes('خروج')
            );
            return testResults[t?.id]?.resultValue || t?.resultValue || '';
          })()}
          onSave={async (serialized, isAbnormal) => {
            await handleSaveWorkstationResult('GSE', serialized, isAbnormal);
          }}
        />
      )}

      {/* CBC MODAL */}
      {showCbcModal && selectedSample && (
        <CbcModal
          isOpen={showCbcModal}
          onClose={() => setShowCbcModal(false)}
          sample={selectedSample}
          initialValue={(() => {
            const t = selectedSample.tests?.find((st: any) => 
              st.test?.code === 'CBC' || st.test?.name?.toLowerCase().includes('cbc') || st.test?.name?.toLowerCase().includes('blood count')
            );
            return testResults[t?.id]?.resultValue || t?.resultValue || '';
          })()}
          onSave={async (serialized, isAbnormal) => {
            await handleSaveWorkstationResult('CBC', serialized, isAbnormal);
          }}
        />
      )}

      {/* CHEMISTRY MODAL */}
      {showChemistryModal && selectedSample && (
        <ChemistryModal
          isOpen={showChemistryModal}
          onClose={() => setShowChemistryModal(false)}
          sample={selectedSample}
          initialValue={(() => {
            const t = selectedSample.tests?.find((st: any) => 
              st.test?.category === 'CHEMISTRY' || (st.test?.code && ['LFT', 'KFT', 'LIPID', 'FBS', 'CREAT'].includes(st.test.code))
            );
            return testResults[t?.id]?.resultValue || t?.resultValue || '';
          })()}
          onSave={async (serialized, isAbnormal) => {
            await handleSaveWorkstationResult('CHEMISTRY', serialized, isAbnormal);
          }}
        />
      )}

      {/* MICROBIOLOGY MODAL */}
      {showMicrobiologyModal && selectedSample && (
        <MicrobiologyModal
          isOpen={showMicrobiologyModal}
          onClose={() => setShowMicrobiologyModal(false)}
          sample={selectedSample}
          initialValue={(() => {
            const t = selectedSample.tests?.find((st: any) => 
              st.test?.category === 'MICROBIOLOGY' || st.test?.code?.includes('CULTURE') || st.test?.name?.toLowerCase().includes('culture')
            );
            return testResults[t?.id]?.resultValue || t?.resultValue || '';
          })()}
          onSave={async (serialized, isAbnormal) => {
            await handleSaveWorkstationResult('MICROBIOLOGY', serialized, isAbnormal);
          }}
        />
      )}

      {/* ADD TESTS MODAL */}
      {showAddTestsModal && (
        <div className="modal-overlay" onClick={() => setShowAddTestsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Add Extra Tests to Sample #{selectedSample?.sampleNumber}</strong>
              <button type="button" onClick={() => setShowAddTestsModal(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search catalog tests..."
                className="input-control"
                style={{ paddingLeft: '28px' }}
                value={addTestSearch}
                onChange={(e) => setAddTestSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '260px', overflowY: 'auto', marginBottom: '16px' }}>
              {allAvailableTests
                .filter(t => !addTestSearch || t.name?.toLowerCase().includes(addTestSearch.toLowerCase()) || t.code?.toLowerCase().includes(addTestSearch.toLowerCase()))
                .map((t) => {
                  const isChecked = selectedNewTests.some(nt => nt.id === t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (isChecked) setSelectedNewTests(selectedNewTests.filter(nt => nt.id !== t.id));
                        else setSelectedNewTests([...selectedNewTests, t]);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isChecked ? 'rgba(0,210,211,0.2)' : '#0e1420',
                        border: `1px solid ${isChecked ? 'var(--accent-cyan)' : '#1e2638'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{t.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 800 }}>{t.price?.toLocaleString()} د.ع</span>
                    </div>
                  );
                })}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddTestsModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmAddTests} disabled={addingTests || selectedNewTests.length === 0} className="btn-cyan-primary">
                {addingTests ? 'Adding...' : `Add ${selectedNewTests.length} Tests ✓`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {docPreviewUrl && (
        <div className="modal-overlay" onClick={() => setDocPreviewUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '850px', height: '88vh', display: 'flex', flexDirection: 'column', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{docPreviewTitle}</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.getElementById('previewIframe') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    }
                  }}
                  className="btn-cyan-primary"
                  style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button type="button" onClick={() => setDocPreviewUrl(null)} className="btn-secondary" style={{ height: '30px', padding: '0 8px' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe id="previewIframe" src={docPreviewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Preview" />
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading workstation...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
