'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useSearchParams } from 'next/navigation';
import { FileText, Search, Printer, Save, AlertTriangle, Check, User, Clock, CheckCircle2, Share2, History, Calculator, FlaskConical, X, Eye, Cpu, TestTube, Plus, MoreHorizontal, ChevronDown, Microscope, Bug, Activity, Zap, Sparkles, MessageCircle, AlertOctagon, CircleAlert, Barcode, Trash2, PhoneCall, Ban } from 'lucide-react';
import Link from 'next/link';
import { useLab } from '../../components/LabContext';
import { getShareableUrl } from '../../lib/urlHelper';
import nextDynamic from 'next/dynamic';
import type { UrineAnalysisData } from '../../components/UrineFormModal';
import { compareSampleWithHistory, DeltaCheckResult } from '../../lib/deltaCheck';
import { Sample, SampleTest, Test } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';
import { INITIAL_TESTS_CATALOG } from '../../lib/catalogData';
import { 
  toEnglishDigits, 
  formatEnglishDate, 
  formatEnglishDateTime, 
  formatEnglishCurrency, 
  isBloodGroupTest, 
  BLOOD_GROUP_OPTIONS, 
  evaluateQualitativeAbnormality 
} from '../../lib/formatters';

const UrineFormModal = nextDynamic(() => import('../../components/UrineFormModal'), { ssr: false });
const GseModal = nextDynamic(() => import('../../components/workstations/GseModal'), { ssr: false });
const CbcModal = nextDynamic(() => import('../../components/workstations/CbcModal'), { ssr: false });
const ChemistryModal = nextDynamic(() => import('../../components/workstations/ChemistryModal'), { ssr: false });
const MicrobiologyModal = nextDynamic(() => import('../../components/workstations/MicrobiologyModal'), { ssr: false });
const SemenFormModal = nextDynamic(() => import('../../components/workstations/SemenFormModal'), { ssr: false });
const CriticalCallModal = nextDynamic(() => import('../../components/CriticalCallModal'), { ssr: false });
const SampleRejectionModal = nextDynamic(() => import('../../components/SampleRejectionModal'), { ssr: false });
import type { SemenAnalysisData } from '../../components/workstations/SemenFormModal';

function ResultsContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const { labProfile } = useLab();

  // Preview Modal
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('');

  // Worklist / Samples
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'URGENT'>('ALL');
  const [loadingSamples, setLoadingSamples] = useState(true);

  // Results State & Dirty-State Guard
  const [testResults, setTestResults] = useState<Record<string, { resultValue: string; isAbnormal: boolean; interpretation?: string }>>({});
  const [savingResults, setSavingResults] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingSampleToSelect, setPendingSampleToSelect] = useState<Sample | null>(null);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [deltaChecks, setDeltaChecks] = useState<Record<string, DeltaCheckResult>>({});

  // Refs for fast Shift / Enter navigation across table rows
  const resultInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const selectedSampleRef = useRef<Sample | null>(null);

  useEffect(() => {
    selectedSampleRef.current = selectedSample;
  }, [selectedSample]);

  const handleResultKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const total = selectedSample?.tests?.length || 1;
      if (e.shiftKey) {
        // Shift+Enter: moves to previous row
        const prevIndex = (index - 1 + total) % total;
        resultInputRefs.current[prevIndex]?.focus();
        resultInputRefs.current[prevIndex]?.select();
      } else {
        // Enter: moves to next row
        const nextIndex = (index + 1) % total;
        resultInputRefs.current[nextIndex]?.focus();
        resultInputRefs.current[nextIndex]?.select();
      }
    }
  };

  // Workstation Modals
  const [showUrineModal, setShowUrineModal] = useState(false);
  const [showGseModal, setShowGseModal] = useState(false);
  const [showCbcModal, setShowCbcModal] = useState(false);
  const [showChemistryModal, setShowChemistryModal] = useState(false);
  const [showMicrobiologyModal, setShowMicrobiologyModal] = useState(false);
  const [showSemenModal, setShowSemenModal] = useState(false);
  const [showAddTestsModal, setShowAddTestsModal] = useState(false);
  const [allAvailableTests, setAllAvailableTests] = useState<Test[]>([]);
  const [addTestSearch, setAddTestSearch] = useState('');
  const [selectedNewTests, setSelectedNewTests] = useState<Test[]>([]);
  const [addingTests, setAddingTests] = useState(false);
  const [testToDelete, setTestToDelete] = useState<any | null>(null);
  const [deletingTest, setDeletingTest] = useState(false);

  // ISO 15189 & CLSI GP47 Modals State
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showCriticalCallModal, setShowCriticalCallModal] = useState(false);
  const [criticalCallTargetTest, setCriticalCallTargetTest] = useState<{ id: string; name: string; resultValue: string } | null>(null);

  const getLoincCode = (codeOrName?: string) => {
    if (!codeOrName) return '';
    const match = INITIAL_TESTS_CATALOG.find(t => t.code === codeOrName || t.name === codeOrName);
    return match?.loincCode || '';
  };

  const formatTestDisplayName = (name?: string): string => {
    if (!name) return '';
    const cleaned = name
      .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')
      .trim();
    const trimmed = cleaned.replace(/^[\s\-–—/:]+|[\s\-–—/:]+$/g, '').trim();
    return trimmed || name;
  };

  const handleConfirmRejectSample = async (rejection: {
    reason: string;
    notes?: string;
    rejectedBy?: string;
  }) => {
    if (!selectedSample) return;
    try {
      const res = await apiRequest(`/samples/${selectedSample.id}/reject`, 'POST', rejection);
      const updatedSample = res?.sample || {
        ...selectedSample,
        status: 'REJECTED',
        rejectionReason: rejection.reason,
        rejectionNotes: rejection.notes,
        rejectedBy: rejection.rejectedBy,
        rejectedAt: new Date().toISOString()
      };
      setSelectedSample(updatedSample);
      setSamples(prev => prev.map(s => s.id === updatedSample.id ? updatedSample : s));
      setShowRejectionModal(false);
      toast.success('تم توثيق رفض العينة وإصدار إشعار إعادة السحب وفق معايير ISO 15189', 'رفض العينة');
    } catch (err: any) {
      toast.error(err.message || 'فشل توثيق رفض العينة', 'خطأ');
    }
  };

  const handleSaveCriticalCallLog = async (logData: any) => {
    if (!selectedSample) return;
    try {
      const res = await apiRequest(`/samples/${selectedSample.id}/critical-call`, 'POST', logData);
      const newCallLog = res?.callLog || { id: `call-${Date.now()}`, sampleId: selectedSample.id, ...logData };
      setSelectedSample((prev: any) => {
        if (!prev) return prev;
        const updatedLogs = [...(prev.criticalCallLogs || []), newCallLog];
        return { ...prev, criticalCallLogs: updatedLogs };
      });
      setSamples(prev => prev.map(s => {
        if (s.id === selectedSample.id) {
          return { ...s, criticalCallLogs: [...(s.criticalCallLogs || []), newCallLog] };
        }
        return s;
      }));
      setShowCriticalCallModal(false);
      setCriticalCallTargetTest(null);
      toast.success('تم توثيق مكالمة القيمة الحرجة وتأكيد القراءة العكسية بنجاح (CLSI GP47)', 'توثيق سريري معتمد');
    } catch (err: any) {
      toast.error(err.message || 'فشل توثيق مكالمة القيمة الحرجة', 'خطأ');
    }
  };

  // Load Samples
  const loadSamples = async (silent = false) => {
    try {
      if (!silent) setLoadingSamples(true);
      const res = await apiRequest('/samples');
      const samplesList: Sample[] = res || [];
      setSamples(samplesList);
      
      const currentSelectedId = selectedSampleRef.current?.id;
      const targetId = searchParams.get('sampleId') || currentSelectedId;
      
      if (!silent) {
        if (targetId && samplesList.length > 0) {
          const found = samplesList.find((s: Sample) => s.id === targetId);
          if (found) {
            selectSample(found);
            return;
          }
        }
        
        if (samplesList.length > 0 && !selectedSampleRef.current) {
          selectSample(samplesList[0]);
        }
      } else {
        // Silent background sync from LAN devices (mobile/tablet/other stations)
        if (selectedSampleRef.current && samplesList.length > 0) {
          const updatedCurrent = samplesList.find((s: Sample) => s.id === selectedSampleRef.current?.id);
          if (updatedCurrent) {
            const currentTestIds = new Set((selectedSampleRef.current.tests || []).map(t => t.id));
            const newTests = (updatedCurrent.tests || []).filter(t => !currentTestIds.has(t.id));
            
            const testsChanged = newTests.length > 0 || (updatedCurrent.tests || []).length !== (selectedSampleRef.current.tests || []).length;
            const statusChanged = updatedCurrent.status !== selectedSampleRef.current.status;
            const priceChanged = updatedCurrent.priceTotal !== selectedSampleRef.current.priceTotal;
            
            // Check if server test results were updated!
            let serverResultsChanged = false;
            (updatedCurrent.tests || []).forEach((st: any) => {
              const currentVal = selectedSampleRef.current?.tests?.find((t: any) => t.id === st.id)?.resultValue;
              if (st.resultValue && st.resultValue !== currentVal) {
                serverResultsChanged = true;
              }
            });

            if (testsChanged || statusChanged || priceChanged || serverResultsChanged) {
              setSelectedSample(updatedCurrent);
              selectedSampleRef.current = updatedCurrent;
              
              setTestResults(prev => {
                const copy = { ...prev };
                (updatedCurrent.tests || []).forEach((st: any) => {
                  const localVal = copy[st.id]?.resultValue || '';
                  if (st.resultValue && (!localVal || localVal.trim() === '' || !isDirty)) {
                    copy[st.id] = {
                      resultValue: st.resultValue,
                      isAbnormal: st.isAbnormal || false,
                      interpretation: st.interpretation || ''
                    };
                  } else if (!copy[st.id]) {
                    copy[st.id] = {
                      resultValue: st.resultValue || '',
                      isAbnormal: st.isAbnormal || false,
                      interpretation: st.interpretation || ''
                    };
                  }
                });
                return copy;
              });

              if (newTests.length > 0) {
                toast.info(`تم تحديث العينة (#${updatedCurrent.sampleNumber}) بإضافة فحوصات جديدة من جهاز آخر!`, 'مزامنة حية');
              } else if (serverResultsChanged) {
                toast.success(`تم استلام وتحديث نتائج الفحص للعينة (#${updatedCurrent.sampleNumber}) آلياً من الجهاز!`, 'استيراد آلي');
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (!silent) toast.error(err.message || 'فشل تحميل العينات', 'خطأ');
    } finally {
      if (!silent) setLoadingSamples(false);
    }
  };

  useEffect(() => {
    loadSamples();
  }, [searchParams]);

  // Live Auto-Polling & Focus Sync across LAN devices (Phones / Tablets / Other PCs)
  useEffect(() => {
    const interval = setInterval(() => {
      loadSamples(true);
    }, 4000);

    const handleFocus = () => {
      loadSamples(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Select Sample with SessionStorage Draft Recovery
  const selectSample = (sample: Sample) => {
    setSelectedSample(sample);
    const initial: Record<string, { resultValue: string; isAbnormal: boolean; interpretation?: string }> = {};
    sample.tests?.forEach((st: any) => {
      initial[st.id] = {
        resultValue: st.resultValue || '',
        isAbnormal: st.isAbnormal || false,
        interpretation: st.interpretation || '',
      };
    });

    // Check for sessionStorage draft for this sample
    let draftLoaded = false;
    try {
      const draftKey = `labryo_results_draft_${sample.id}`;
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const merged = { ...initial };
          let hasRealDraftEdits = false;
          Object.keys(parsed).forEach(k => {
            const draftItem = parsed[k];
            const serverItem = initial[k];
            // Only restore if draft has actual non-empty content and server is empty
            if (draftItem?.resultValue && draftItem.resultValue.trim() !== '') {
              if (!serverItem?.resultValue || serverItem.resultValue.trim() === '') {
                merged[k] = draftItem;
                hasRealDraftEdits = true;
              }
            }
          });
          if (hasRealDraftEdits) {
            setTestResults(merged);
            setIsDirty(true);
            draftLoaded = true;
            toast.info(`تم استرجاع مسودة غير محفوظة للعينة #${sample.sampleNumber}`);
          } else {
            sessionStorage.removeItem(draftKey);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load results draft from sessionStorage', err);
    }

    if (!draftLoaded) {
      setTestResults(initial);
      setIsDirty(false);
    }

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

  // Guard sample switching when dirty
  const handleSelectSampleWithGuard = (targetSample: Sample) => {
    if (selectedSample && targetSample.id === selectedSample.id) return;
    if (isDirty) {
      setPendingSampleToSelect(targetSample);
      setShowDirtyConfirm(true);
      return;
    }
    selectSample(targetSample);
  };

  const handleConfirmDiscardAndSwitch = () => {
    if (selectedSample) {
      try {
        sessionStorage.removeItem(`labryo_results_draft_${selectedSample.id}`);
      } catch (e) {}
    }
    setIsDirty(false);
    setShowDirtyConfirm(false);
    if (pendingSampleToSelect) {
      selectSample(pendingSampleToSelect);
      setPendingSampleToSelect(null);
    }
  };

  // Dirty state browser unload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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
      if (categoryOrCode === 'CHEMISTRY') return st.test?.category === 'CHEMISTRY' || ['LFT', 'KFT', 'LIPID', 'GLUCOSE', 'FBS', 'UREA', 'CREAT', 'CHEMISTRY'].some(c => code.includes(c)) || ['كيمياء', 'سكري', 'كبد', 'كلى', 'وظائف', 'دهون', 'يوريا', 'كرياتنين'].some(k => name.includes(k));
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

        // Clear draft & dirty
        if (selectedSample) {
          try {
            sessionStorage.removeItem(`labryo_results_draft_${selectedSample.id}`);
          } catch (e) {}
        }
        setIsDirty(false);
      } catch (err: any) {
        console.error('Error saving workstation results:', err);
      }
    }
  };

  // Helper to safely parse numeric values while rejecting non-numeric strings (">1000", "<0.01", "Positive", "N/A")
  const parseNumericResult = (val: any): number => {
    if (val === null || val === undefined) return NaN;
    const str = String(val).trim();
    if (str === '') return NaN;
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      return NaN;
    }
    const n = parseFloat(str);
    return isNaN(n) || !isFinite(n) ? NaN : n;
  };

  // Real-time Lipid & Bilirubin calculations with safe non-numeric handling
  const handleResultChange = (sampleTestId: string, rawVal: string, test: any) => {
    const val = toEnglishDigits(rawVal);
    const nextResults = { ...testResults };
    
    // Check abnormal / panic
    let isAbnormal = false;
    if (isBloodGroupTest(test)) {
      // Blood Group is normal physiological finding, NEVER abnormal (A+, B+, O+, AB+, etc.)
      isAbnormal = false;
    } else {
      const num = parseNumericResult(val);
      if (!isNaN(num)) {
        if (test?.refRangeLow !== null && test?.refRangeLow !== undefined && num < test.refRangeLow) isAbnormal = true;
        if (test?.refRangeHigh !== null && test?.refRangeHigh !== undefined && num > test.refRangeHigh) isAbnormal = true;
      } else {
        isAbnormal = evaluateQualitativeAbnormality(val, test);
        const lower = val.trim().toLowerCase();
        if (lower.startsWith('>') && test?.refRangeHigh !== null && test?.refRangeHigh !== undefined) {
          const threshold = parseFloat(toEnglishDigits(lower.replace('>', '').trim()));
          if (!isNaN(threshold) && threshold >= test.refRangeHigh) {
            isAbnormal = true;
          }
        } else if (lower.startsWith('<') && test?.refRangeLow !== null && test?.refRangeLow !== undefined) {
          const threshold = parseFloat(toEnglishDigits(lower.replace('<', '').trim()));
          if (!isNaN(threshold) && threshold <= test.refRangeLow) {
            isAbnormal = true;
          }
        }
      }
    }

    // Always store the entered text safely without breaking calculations or losing user input
    nextResults[sampleTestId] = {
      ...nextResults[sampleTestId],
      resultValue: val,
      isAbnormal,
    };

    // Auto-calculate VLDL & LDL safely without producing NaN
    const tgTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'TG' || st.test?.name?.toLowerCase().includes('triglycerides'));
    const cholTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'CHOL' || st.test?.name?.toLowerCase().includes('cholesterol'));
    const hdlTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'HDL' || st.test?.name?.toLowerCase().includes('hdl'));
    const ldlTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'LDL' || st.test?.name?.toLowerCase().includes('ldl'));
    const vldlTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'VLDL' || st.test?.name?.toLowerCase().includes('vldl'));

    const currentTG = tgTest ? parseNumericResult(nextResults[tgTest.id]?.resultValue) : NaN;
    const currentCHOL = cholTest ? parseNumericResult(nextResults[cholTest.id]?.resultValue) : NaN;
    const currentHDL = hdlTest ? parseNumericResult(nextResults[hdlTest.id]?.resultValue) : NaN;

    if (vldlTest && sampleTestId !== vldlTest.id) {
      if (!isNaN(currentTG) && currentTG >= 0) {
        const vldlCalc = currentTG / 5;
        if (!isNaN(vldlCalc) && isFinite(vldlCalc)) {
          const vldlVal = vldlCalc.toFixed(1);
          nextResults[vldlTest.id] = {
            ...nextResults[vldlTest.id],
            resultValue: vldlVal,
            isAbnormal: parseFloat(vldlVal) > 30,
          };
        }
      }
    }

    if (ldlTest && sampleTestId !== ldlTest.id) {
      if (!isNaN(currentCHOL) && !isNaN(currentHDL) && !isNaN(currentTG) && currentTG >= 0 && currentTG < 400) {
        const ldlCalc = currentCHOL - currentHDL - (currentTG / 5);
        if (!isNaN(ldlCalc) && isFinite(ldlCalc)) {
          if (ldlCalc < 10) {
            nextResults[ldlTest.id] = {
              ...nextResults[ldlTest.id],
              resultValue: 'Direct LDL required (Calculated <10)',
              isAbnormal: true,
            };
          } else {
            const ldlVal = ldlCalc.toFixed(1);
            nextResults[ldlTest.id] = {
              ...nextResults[ldlTest.id],
              resultValue: ldlVal,
              isAbnormal: parseFloat(ldlVal) > 130,
            };
          }
        }
      }
    }

    // Auto-calculate Indirect Bilirubin (IBIL = TBIL - DBIL) safely
    const tbilTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'TBIL' || st.test?.name?.toLowerCase().includes('total bilirubin'));
    const dbilTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'DBIL' || st.test?.name?.toLowerCase().includes('direct bilirubin'));
    const ibilTest = selectedSample?.tests?.find((st: any) => st.test?.code === 'IBIL' || st.test?.name?.toLowerCase().includes('indirect bilirubin'));

    const currentTBIL = tbilTest ? parseNumericResult(nextResults[tbilTest.id]?.resultValue) : NaN;
    const currentDBIL = dbilTest ? parseNumericResult(nextResults[dbilTest.id]?.resultValue) : NaN;

    if (ibilTest && sampleTestId !== ibilTest.id) {
      if (!isNaN(currentTBIL) && !isNaN(currentDBIL) && currentTBIL >= currentDBIL) {
        const ibilCalc = currentTBIL - currentDBIL;
        if (!isNaN(ibilCalc) && isFinite(ibilCalc)) {
          const ibilVal = ibilCalc.toFixed(2);
          nextResults[ibilTest.id] = {
            ...nextResults[ibilTest.id],
            resultValue: ibilVal,
            isAbnormal: parseFloat(ibilVal) > 0.8,
          };
        }
      }
    }

    setTestResults(nextResults);
    setIsDirty(true);
    if (selectedSample) {
      try {
        sessionStorage.setItem(`labryo_results_draft_${selectedSample.id}`, JSON.stringify(nextResults));
      } catch (e) {}
    }
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

      // Clear draft & dirty state upon successful save
      if (selectedSample) {
        try {
          sessionStorage.removeItem(`labryo_results_draft_${selectedSample.id}`);
        } catch (e) {}
      }
      setIsDirty(false);

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

  // Fast Pathologist Hotkey (Ctrl+Shift+Enter): Save as READY and jump to next pending sample
  const handleFastPathologistApprove = async () => {
    if (!selectedSample || savingResults) return;
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
        markReady: true,
      });

      // Clear draft & dirty state upon successful save
      if (selectedSample) {
        try {
          sessionStorage.removeItem(`labryo_results_draft_${selectedSample.id}`);
        } catch (e) {}
      }
      setIsDirty(false);

      toast.success(`تم اعتماد العينة #${selectedSample.sampleNumber} كـ READY بنجاح والانتقال للعينة التالية!`, 'اعتماد سريع');

      // Refresh samples and automatically advance to next pending sample
      const refreshed = await apiRequest('/samples');
      const sampleList: Sample[] = refreshed || [];
      setSamples(sampleList);

      const currentIdx = sampleList.findIndex((s) => s.id === selectedSample.id);
      let nextSample: Sample | null = null;

      // Find next sample that is IN_PROGRESS or RECEIVED
      for (let i = currentIdx + 1; i < sampleList.length; i++) {
        if (sampleList[i].status === 'IN_PROGRESS' || sampleList[i].status === 'RECEIVED') {
          nextSample = sampleList[i];
          break;
        }
      }
      if (!nextSample) {
        for (let i = 0; i < currentIdx; i++) {
          if (sampleList[i].status === 'IN_PROGRESS' || sampleList[i].status === 'RECEIVED') {
            nextSample = sampleList[i];
            break;
          }
        }
      }
      // If none in progress/received, take immediate next if exists
      if (!nextSample && sampleList.length > 1) {
        const nextIndex = (currentIdx + 1) % sampleList.length;
        if (sampleList[nextIndex].id !== selectedSample.id) {
          nextSample = sampleList[nextIndex];
        }
      }

      if (nextSample && nextSample.id !== selectedSample.id) {
        selectSample(nextSample);
        setTimeout(() => {
          resultInputRefs.current[0]?.focus();
          resultInputRefs.current[0]?.select();
        }, 100);
      } else {
        toast.info('تم إنهاء فحص كافة العينات في قائمة العمل!');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل اعتماد النتائج', 'خطأ');
    } finally {
      setSavingResults(false);
    }
  };

  // Keyboard shortcut listener for Fast Pathologist Approve (Ctrl+Shift+Enter / Cmd+Shift+Enter)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleFastPathologistApprove();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedSample, testResults, savingResults, samples]);

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
    const verifyUrl = getShareableUrl(`/verify/${selectedSample.id}`, labProfile);
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

  // Status Counts for Quick Filter Pills
  const statusCounts = useMemo(() => {
    return {
      ALL: samples.length,
      URGENT: samples.filter((s) => s.isUrgent).length,
      RECEIVED: samples.filter((s) => s.status === 'RECEIVED').length,
      IN_PROGRESS: samples.filter((s) => s.status === 'IN_PROGRESS').length,
      READY: samples.filter((s) => s.status === 'READY').length,
    };
  }, [samples]);

  // Helper for elapsed time indicator
  const getElapsedTime = (createdAt: string | Date) => {
    if (!createdAt) return '';
    const now = new Date();
    const past = new Date(createdAt);
    const diffMs = now.getTime() - past.getTime();
    if (isNaN(diffMs) || diffMs < 0) return '';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} س`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  // Helpers for Chemistry workstation triggers
  const isChemistryPanel = (st: any) => {
    const code = (st.test?.code || '').toUpperCase();
    const name = (st.test?.name || '').toLowerCase();
    return (
      ['LFT', 'KFT', 'LIPID', 'LIPIDS', 'CHEMISTRY', 'CMP', 'BMP'].includes(code) ||
      name.includes('lipid profile') ||
      name.includes('liver function') ||
      name.includes('kidney function') ||
      name.includes('renal function') ||
      name.includes('وظائف كبد') ||
      name.includes('وظائف كلى')
    );
  };

  const isChemistryAnalyte = (st: any) => {
    const cat = (st.test?.category || '').toUpperCase();
    const code = (st.test?.code || '').toUpperCase();
    const name = (st.test?.name || '').toLowerCase();
    return (
      cat === 'CHEMISTRY' ||
      ['LFT', 'KFT', 'LIPID', 'GLUCOSE', 'FBS', 'RBS', 'HBA1C', 'UREA', 'CREAT', 'CREATININE', 'URIC', 'AST', 'ALT', 'ALP', 'BILI', 'CHOL', 'TG', 'HDL', 'LDL', 'VLDL', 'NA', 'K', 'CL', 'CA', 'ELECTROLYTES', 'AMYLASE', 'LIPASE', 'ALBUMIN', 'PROTEIN'].some(c => code === c || code.startsWith(c) || code.includes(c)) ||
      ['كيمياء', 'سكري', 'كبد', 'كلى', 'وظائف', 'دهون', 'يوريا', 'كرياتنين', 'أملاح', 'شحوم', 'glucose', 'urea', 'creatinine', 'bilirubin', 'cholesterol', 'triglyceride', 'electrolyte'].some(k => name.includes(k))
    );
  };

  // Open Add Tests Modal
  const handleOpenAddTestsModal = async () => {
    try {
      if (allAvailableTests.length === 0) {
        const res: any = await apiRequest('/catalog/tests');
        const list: Test[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.tests)
            ? res.tests
            : [];
        setAllAvailableTests(list);
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

  const handleConfirmDeleteTest = async () => {
    if (!selectedSample || !testToDelete) return;
    try {
      setDeletingTest(true);
      await apiRequest(`/samples/${selectedSample.id}/tests?sampleTestId=${testToDelete.id}`, 'DELETE');
      toast.success(`تم حذف فحص ${testToDelete.test?.name || ''} من العينة بنجاح`);

      setTestResults(prev => {
        const next = { ...prev };
        delete next[testToDelete.id];
        return next;
      });

      setSelectedSample(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tests: prev.tests.filter((t: any) => t.id !== testToDelete.id),
        };
      });

      setTestToDelete(null);
      loadSamples();
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف الفحص');
    } finally {
      setDeletingTest(false);
    }
  };

  return (
    <AppShell>
      {/* Main Mockup Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '18px', minHeight: 'calc(100vh - 120px)' }}>
        
        {/* LEFT: PATIENT SAMPLE QUEUE (Image 2 Style) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: 'calc(100vh - 120px)' }}>
          <label htmlFor="results-search-input" className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '10px', display: 'block', cursor: 'pointer' }}>
            PATIENT SAMPLE QUEUE (طابور العينات)
          </label>

          {/* Quick Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              id="results-search-input"
              type="text"
              placeholder="Search Queue (Sample # / Name)..."
              className="input-control"
              style={{ paddingLeft: '28px', fontSize: '12px', height: '32px', background: 'var(--bg-input-deep)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Tabs (Pills) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
            {([
              { id: 'ALL', label: 'الكل', count: statusCounts.ALL, variant: 'default' },
              { id: 'URGENT', label: '<AlertOctagon size={12} /> STAT', count: statusCounts.URGENT, variant: 'stat' },
              { id: 'RECEIVED', label: 'مستلمة', count: statusCounts.RECEIVED, variant: 'default' },
              { id: 'IN_PROGRESS', label: 'قيد الفحص', count: statusCounts.IN_PROGRESS, variant: 'default' },
              { id: 'READY', label: 'جاهزة', count: statusCounts.READY, variant: 'ready' },
            ] as const).map((tab) => {
              const isActive = statusFilter === tab.id;
              const isStat = tab.variant === 'stat';
              const isReady = tab.variant === 'ready';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: isActive ? 800 : 600,
                    borderRadius: '12px',
                    border: `1px solid ${
                      isActive
                        ? (isStat ? 'var(--color-danger)' : isReady ? 'var(--color-success)' : 'var(--accent-cyan)')
                        : '#1e2638'
                    }`,
                    background: isActive
                      ? (isStat ? 'var(--bg-stat-row)' : isReady ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 210, 211, 0.15)')
                      : 'var(--bg-input-deep)',
                    color: isActive
                      ? (isStat ? 'var(--color-danger)' : isReady ? 'var(--color-success)' : 'var(--accent-cyan)')
                      : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      opacity: 0.9,
                      background: isActive ? 'rgba(255,255,255,0.15)' : '#1a2233',
                      padding: '0 4px',
                      borderRadius: '6px',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Highlight Banner if selected */}
          {selectedSample && (
            <div style={{ padding: '10px 12px', background: 'rgba(0, 210, 211, 0.15)', border: '1px solid var(--accent-cyan)', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  {selectedSample.patient?.name}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                  #{selectedSample.sampleNumber}
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedSample.patient?.gender === 'FEMALE' ? 'Female' : 'Male'}, {selectedSample.patient?.age || '-'} yrs • {new Date(selectedSample.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {/* Queue List with Distinct STAT & Elapsed Time */}
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
                    onClick={() => handleSelectSampleWithGuard(s)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSelected
                        ? (s.isUrgent ? 'linear-gradient(90deg, rgba(239,68,68,0.22) 0%, #1b2436 100%)' : '#1b2436')
                        : (s.isUrgent ? 'var(--bg-stat-card)' : 'var(--bg-input-deep)'),
                      border: isSelected
                        ? '1px solid var(--accent-cyan)'
                        : (s.isUrgent ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid #1a2233'),
                      borderLeft: s.isUrgent
                        ? '3.5px solid var(--color-danger)'
                        : (isSelected ? '3.5px solid var(--accent-cyan)' : '3.5px solid transparent'),
                      boxShadow: s.isUrgent ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                          #{s.sampleNumber} • {s.tests?.length || 0} tests
                        </span>
                        {s.createdAt && (
                          <span style={{ fontSize: '10px', color: s.isUrgent ? '#f87171' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Clock size={10} />
                            <span>{getElapsedTime(s.createdAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {s.status === 'REJECTED' ? (
                        <span className="badge" style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.25)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', fontWeight: 800 }}>
                          REJECTED
                        </span>
                      ) : s.isUrgent ? (
                        <span className="badge badge-urgent" style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.25)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>
                          <AlertOctagon size={12} /> STAT
                        </span>
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
                  style={{
                    height: '34px',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '0 14px',
                    background: 'var(--accent-cyan-subtle)',
                    border: '1.5px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)',
                  }}
                  title="إضافة تحليل إضافي طلبه الطبيب ودمجه مباشرة مع هذه العينة والتقرير السابق"
                >
                  <Plus size={15} />
                  <span>➕ إضافة فحص ودمجه مع العينة (Add & Merge Test)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocPreviewUrl(`/api/samples/${selectedSample.id}/barcode`);
                    setDocPreviewTitle(`طباعة ملصق الباركود (50x25mm) - عينة #${selectedSample.sampleNumber} (${selectedSample.patient?.name})`);
                  }}
                  className="btn-secondary"
                  style={{ color: '#06b6d4', borderColor: 'rgba(6,182,212,0.4)', height: '32px', fontSize: '11px', padding: '0 10px' }}
                  title="طباعة ملصق الباركود الحراري 50x25mm لأنبوب التحليل"
                >
                  <Barcode size={13} />
                  <span>طباعة ملصق الباركود</span>
                </button>

                {/* ISO 15189 Sample Rejection Action */}
                {selectedSample.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => setShowRejectionModal(true)}
                    className="btn-secondary"
                    style={{
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.45)',
                      height: '32px',
                      fontSize: '11px',
                      padding: '0 10px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="توثيق رفض العينة غير المطابقة وإصدار إشعار إعادة السحب (ISO 15189)"
                  >
                    <Ban size={13} />
                    <span>رفض العينة (ISO 15189)</span>
                  </button>
                )}

                {/* Fast Pathologist Approval Hotkey Button */}
                <button
                  type="button"
                  onClick={handleFastPathologistApprove}
                  disabled={savingResults}
                  className="btn-cyan-primary"
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                    borderColor: '#14b8a6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="اعتماد العينة كـ READY والانتقال التلقائي للعينة التالية (Ctrl+Shift+Enter)"
                >
                  <Zap size={13} />
                  <span>اعتماد سريع</span>
                  <kbd style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>Ctrl+Shift+Enter</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResults(true)}
                  disabled={savingResults}
                  className="btn-cyan-primary"
                  style={{ height: '32px', padding: '0 14px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={13} />
                  <span>حفظ وطباعة التقرير</span>
                </button>

                {isDirty && (
                  <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} />
                    <span>مسودة غير محفوظة</span>
                  </span>
                )}

                {selectedSample?.patient?.phone && (
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="btn-secondary"
                    style={{
                      color: 'var(--color-success)',
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

            {/* ISO 15189 Non-conformance Rejection Banner */}
            {selectedSample.status === 'REJECTED' && (
              <div
                style={{
                  background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.08) 100%)',
                  border: '1.5px solid #ef4444',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ background: '#ef4444', color: '#fff', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                    <Ban size={18} />
                  </div>
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      عينة مرفوضة وغير مطابقة للمواصفات الطبية (ISO 15189 Non-Conforming Sample)
                    </div>
                    <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px', lineHeight: '1.5' }}>
                      السبب الإكلينيكي: <strong style={{ color: '#fff' }}>{selectedSample.rejectionReason}</strong>
                      {selectedSample.rejectionNotes && <span style={{ marginRight: '8px' }}> • ملاحظات: {selectedSample.rejectionNotes}</span>}
                      {selectedSample.rejectedBy && <span style={{ marginRight: '8px' }}> • بواسطة: {selectedSample.rejectedBy}</span>}
                      {selectedSample.rejectedAt && (
                        <span style={{ marginRight: '8px' }}>
                          • الوقت: {formatEnglishDateTime(selectedSample.rejectedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    background: 'rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    border: '1px solid #ef4444',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    display: 'inline-block'
                  }}>
                    إعادة السحب مطلوبة (Re-collection Required)
                  </span>
                </div>
              </div>
            )}

            {/* Results Table (Image 2 Exact Layout) */}
            <div style={{ overflowX: 'auto', flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input-deep)' }} dir="ltr">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }} dir="ltr">
                <thead>
                  <tr style={{ background: '#1c2436', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>PARAMETER (TEST NAME)</th>
                    <th style={{ padding: '10px 14px', width: '260px', textAlign: 'left' }}>RESULT</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>RANGE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>UNITS</th>
                    <th style={{ padding: '10px 10px', textAlign: 'center', width: '50px' }}>DEL</th>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{formatTestDisplayName(st.test?.name)}</span>
                              {st.test?.code && (
                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px' }}>
                                  {st.test?.code}
                                </span>
                              )}
                              {(st.test?.loincCode || getLoincCode(st.test?.code || st.test?.name)) && (
                                <span
                                  title="LOINC International Medical Code"
                                  style={{
                                    fontSize: '9.5px',
                                    fontFamily: 'monospace',
                                    color: '#38bdf8',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                    fontWeight: 700
                                  }}
                                >
                                  LOINC: {st.test?.loincCode || getLoincCode(st.test?.code || st.test?.name)}
                                </span>
                              )}
                              {isChemistryAnalyte(st) && (
                                <button
                                  type="button"
                                  onClick={() => setShowChemistryModal(true)}
                                  title="Open Clinical Chemistry Workstation"
                                  style={{
                                    fontSize: '9.5px',
                                    color: '#c084fc',
                                    background: 'rgba(139, 92, 246, 0.15)',
                                    border: '1px solid rgba(139, 92, 246, 0.35)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Zap size={9} />
                                  <span>CHEM</span>
                                </button>
                              )}

                              {/* Smart Delta Check Alert Badge directly beside Test Name */}
                              {(() => {
                                const code = st.test?.code || st.test?.name;
                                const delta = deltaChecks[code] || (st.test?.code && deltaChecks[st.test.code]);
                                if (delta && delta.isBreached) {
                                  const isCrit = delta.badgeLevel === 'CRITICAL';
                                  return (
                                    <span
                                      title={delta.message || `Delta Check Alert: significant deviation from previous result (${delta.previousValue})`}
                                      style={{
                                        fontSize: '9.5px',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: isCrit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                        color: isCrit ? 'var(--color-danger)' : 'var(--color-warning)',
                                        border: `1px solid ${isCrit ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                                        cursor: 'help',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                      }}
                                    >
                                      Δ {delta.deltaPercent}% {delta.direction === 'increased' ? '↑' : '↓'}
                                    </span>
                                  );
                                }
                                return null;
                              })()}

                              {/* Smart Critical PANIC Badge directly beside Test Name */}
                              {isPanic && (
                                <span
                                  title="Critical Panic Value"
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    border: '1px solid #f87171',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)'
                                  }}
                                >
                                  <AlertOctagon size={10} /> PANIC
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
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <TestTube size={14} />}
                                  <span>{currentVal ? 'Edit G.U.E Report' : 'Open G.U.E Form'}</span>
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
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <Microscope size={14} />}
                                  <span>{currentVal ? 'Edit G.S.E Report' : 'Open G.S.E Form'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>G.S.E</span>
                              </button>
                            ) : /* S.F.A Semen Analysis Button */ (st.test?.code === 'SFA' || st.test?.code === 'SEMEN' || st.test?.name?.toLowerCase().includes('semen') || st.test?.name?.toLowerCase().includes('seminal') || st.test?.name?.toLowerCase().includes('سائل منوي') || st.test?.name?.toLowerCase().includes('نطف') || st.test?.name?.toLowerCase().includes('مني')) ? (
                              <button
                                type="button"
                                onClick={() => setShowSemenModal(true)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(6, 182, 212, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : 'var(--accent-cyan)'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <Microscope size={14} />}
                                  <span>{currentVal ? 'Edit S.F.A Report' : 'Open S.F.A Form'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>S.F.A</span>
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
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <Activity size={14} />}
                                  <span>{currentVal ? 'Edit CBC Report' : 'Open CBC Workstation'}</span>
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
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(139, 92, 246, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : '#0d9488'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : '#2dd4bf',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <Bug size={14} />}
                                  <span>{currentVal ? 'Edit Culture Report' : 'Open Culture Workstation'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Culture</span>
                              </button>
                            ) : /* Chemistry Panel Button (Full Profile) */ isChemistryPanel(st) ? (
                              <button
                                type="button"
                                onClick={() => setShowChemistryModal(true)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: currentVal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(139, 92, 246, 0.16)',
                                  border: `1.5px solid ${currentVal ? 'var(--accent-emerald)' : '#8b5cf6'}`,
                                  color: currentVal ? 'var(--accent-emerald)' : '#c084fc',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <FlaskConical size={14} />}
                                  <span>{currentVal ? 'Edit Chemistry Panel' : 'Open Chemistry Workstation'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{st.test?.code || 'CHEM'}</span>
                              </button>
                            ) : /* Blood Group & Rh Factor Complete Selector */ isBloodGroupTest(st.test) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
                                <select
                                  ref={(el) => { resultInputRefs.current[index] = el as any; }}
                                  value={currentVal}
                                  onChange={(e) => handleResultChange(st.id, e.target.value, st.test)}
                                  className="input-control"
                                  style={{
                                    height: '34px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    background: 'var(--bg-input)',
                                    borderColor: currentVal ? 'var(--accent-cyan)' : 'var(--border-color)',
                                    color: currentVal ? 'var(--accent-cyan)' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    width: '100%',
                                  }}
                                >
                                  <option value="">-- Select Blood Group (اختر فصيلة الدم) --</option>
                                  {BLOOD_GROUP_OPTIONS.map((bg) => (
                                    <option key={bg.value} value={bg.value}>
                                      {bg.label}
                                    </option>
                                  ))}
                                </select>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {BLOOD_GROUP_OPTIONS.map((bg) => {
                                    const isSelected = currentVal === bg.value || currentVal.startsWith(bg.short);
                                    return (
                                      <button
                                        key={bg.short}
                                        type="button"
                                        onClick={() => handleResultChange(st.id, bg.value, st.test)}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: '10px',
                                          fontWeight: 800,
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                                          color: isSelected ? '#000' : 'var(--text-muted)',
                                          border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                                          transition: 'all 0.1s ease',
                                        }}
                                        title={`Select ${bg.label}`}
                                      >
                                        {bg.short}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : /* Chemistry Analyte (Input + Smart Quick Workstation Trigger) */ isChemistryAnalyte(st) ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  ref={(el) => { resultInputRefs.current[index] = el; }}
                                  onKeyDown={(e) => handleResultKeyDown(e, index)}
                                  type="text"
                                  className="input-control"
                                  style={{
                                    height: '34px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    background: 'var(--bg-input)',
                                    borderColor: isPanic ? 'var(--color-danger)' : isAbnormal ? 'var(--color-warning)' : currentVal ? 'var(--accent-cyan)' : 'var(--border-color)',
                                    boxShadow: isPanic ? '0 0 10px rgba(239, 68, 68, 0.4)' : isAbnormal ? '0 0 8px rgba(245, 158, 11, 0.3)' : 'none',
                                    color: isPanic ? 'var(--color-danger)' : isAbnormal ? 'var(--color-warning)' : 'var(--text-main)',
                                    flex: 1,
                                  }}
                                  placeholder="Enter value"
                                  value={currentVal}
                                  onChange={(e) => handleResultChange(st.id, e.target.value, st.test)}
                                />
                                {isPanic ? (
                                  <span
                                    title="Critical Panic Value!"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      color: 'var(--color-danger)',
                                      animation: 'pulse 1.5s infinite',
                                      flexShrink: 0
                                    }}
                                  >
                                    <CircleAlert size={16} />
                                  </span>
                                ) : isAbnormal ? (
                                  <span
                                    title="Abnormal Value"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      color: 'var(--color-warning)',
                                      flexShrink: 0
                                    }}
                                  >
                                    <AlertTriangle size={15} />
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => setShowChemistryModal(true)}
                                  title="Open Clinical Chemistry Workstation"
                                  style={{
                                    height: '34px',
                                    padding: '0 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(139, 92, 246, 0.15)',
                                    border: '1px solid rgba(139, 92, 246, 0.4)',
                                    color: '#c084fc',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <Zap size={12} />
                                  <span><FlaskConical size={14} /> CHEM</span>
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  ref={(el) => { resultInputRefs.current[index] = el; }}
                                  onKeyDown={(e) => handleResultKeyDown(e, index)}
                                  type="text"
                                  className="input-control"
                                  style={{
                                    height: '34px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    background: 'var(--bg-input)',
                                    borderColor: isPanic ? 'var(--color-danger)' : isAbnormal ? 'var(--color-warning)' : currentVal ? 'var(--accent-cyan)' : 'var(--border-color)',
                                    boxShadow: isPanic ? '0 0 10px rgba(239, 68, 68, 0.4)' : isAbnormal ? '0 0 8px rgba(245, 158, 11, 0.3)' : 'none',
                                    color: isPanic ? 'var(--color-danger)' : isAbnormal ? 'var(--color-warning)' : 'var(--text-main)',
                                    flex: 1,
                                  }}
                                  placeholder="Enter value"
                                  value={currentVal}
                                  onChange={(e) => handleResultChange(st.id, e.target.value, st.test)}
                                />
                                {isPanic ? (
                                  <span
                                    title="Critical Panic Value!"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      color: 'var(--color-danger)',
                                      animation: 'pulse 1.5s infinite',
                                      flexShrink: 0
                                    }}
                                  >
                                    <CircleAlert size={16} />
                                  </span>
                                ) : isAbnormal ? (
                                  <span
                                    title="Abnormal Value"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      color: 'var(--color-warning)',
                                      flexShrink: 0
                                    }}
                                  >
                                    <AlertTriangle size={15} />
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                            {st.test?.refRangeText || (st.test?.refRangeLow !== null && st.test?.refRangeHigh !== null ? `${st.test?.refRangeLow} - ${st.test?.refRangeHigh}` : 'N/A')}
                          </td>

                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                            {st.test?.unit || '-'}
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setTestToDelete(st)}
                              title={`Delete ${formatTestDisplayName(st.test?.name) || 'test'}`}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>

                        {isPanic && (
                          <tr style={{ background: 'rgba(239, 68, 68, 0.08)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <td colSpan={5} style={{ padding: '8px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ color: 'var(--color-danger)', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <AlertTriangle size={13} />
                                  <span>تنبيه قيمة حرجة (PANIC): {formatTestDisplayName(st.test?.name)} ({currentVal} {st.test?.unit}) تتجاوز العتبة السريرية المهددة للحياة!</span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {(() => {
                                    const callLog = (selectedSample.criticalCallLogs || []).find(
                                      (log: any) => log.testName === st.test?.name || log.testName === st.test?.code
                                    );
                                    if (callLog) {
                                      return (
                                        <span style={{
                                          fontSize: '11px',
                                          color: '#10b981',
                                          background: 'rgba(16, 185, 129, 0.15)',
                                          border: '1px solid rgba(16, 185, 129, 0.35)',
                                          padding: '3px 8px',
                                          borderRadius: '5px',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}>
                                          <CheckCircle2 size={12} />
                                          <span>تم تبليغ د. {callLog.physicianName} هاتفياً (قراءة عكسية ✓)</span>
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCriticalCallTargetTest({
                                        id: st.id,
                                        name: st.test?.name || st.test?.code,
                                        resultValue: `${currentVal} ${st.test?.unit || ''}`.trim()
                                      });
                                      setShowCriticalCallModal(true);
                                    }}
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                      color: '#fff',
                                      border: '1px solid #f87171',
                                      padding: '4px 10px',
                                      borderRadius: '5px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
                                    }}
                                    title="توثيق التبليغ الهاتفي الفوري للطبيب مع القراءة العكسية وفق معيار CLSI GP47"
                                  >
                                    <PhoneCall size={12} />
                                    <span>توثيق تبليغ الطبيب (CLSI GP47)</span>
                                  </button>
                                </div>
                              </div>
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
              return (gueTest?.id ? testResults[gueTest.id]?.resultValue : '') || gueTest?.resultValue || '';
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
            return (t?.id ? testResults[t.id]?.resultValue : '') || t?.resultValue || '';
          })()}
          onSave={async (serialized, isAbnormal) => {
            await handleSaveWorkstationResult('GSE', serialized, isAbnormal);
          }}
        />
      )}

      {/* SEMEN ANALYSIS (SFA) MODAL */}
      {showSemenModal && selectedSample && (
        <SemenFormModal
          isOpen={showSemenModal}
          onClose={() => setShowSemenModal(false)}
          patientName={selectedSample.patient?.name || ''}
          sampleNumber={selectedSample.sampleNumber}
          initialData={
            (() => {
              const sfaTest = selectedSample.tests?.find((st: any) => 
                st.test?.code === 'SFA' || st.test?.code === 'SEMEN' || st.test?.name?.toLowerCase().includes('semen') || st.test?.name?.toLowerCase().includes('seminal') || st.test?.name?.toLowerCase().includes('سائل منوي') || st.test?.name?.toLowerCase().includes('نطف') || st.test?.name?.toLowerCase().includes('مني')
              );
              return (sfaTest?.id ? testResults[sfaTest.id]?.resultValue : '') || sfaTest?.resultValue || '';
            })()
          }
          onApply={(formattedResult: string, rawData: SemenAnalysisData) => {
            setShowSemenModal(false);
            const sfaTest = selectedSample.tests?.find((st: any) => 
              st.test?.code === 'SFA' || st.test?.code === 'SEMEN' || st.test?.name?.toLowerCase().includes('semen') || st.test?.name?.toLowerCase().includes('seminal') || st.test?.name?.toLowerCase().includes('سائل منوي') || st.test?.name?.toLowerCase().includes('نطف') || st.test?.name?.toLowerCase().includes('مني')
            );
            if (sfaTest) {
              const countNum = parseFloat(rawData.concentration) || 0;
              const prNum = parseFloat(rawData.totalProgressivePR) || 0;
              const normNum = parseFloat(rawData.normalForms) || 0;
              const isAbnormal = countNum < 15 || prNum < 32 || normNum < 4 || rawData.clinicalImpression !== 'Normozoospermia';

              setTestResults(prev => ({
                ...prev,
                [sfaTest.id]: {
                  resultValue: formattedResult,
                  isAbnormal,
                }
              }));
              setIsDirty(true);
              toast.success('تم إدراج تقرير فحص السائل المنوي بنجاح!');
            }
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
            return (t?.id ? testResults[t.id]?.resultValue : '') || t?.resultValue || '';
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
              isChemistryPanel(st) || isChemistryAnalyte(st)
            );
            return (t?.id ? testResults[t.id]?.resultValue : '') || t?.resultValue || '';
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
            return (t?.id ? testResults[t.id]?.resultValue : '') || t?.resultValue || '';
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
              <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>إضافة فحوصات إضافية للعينة #{selectedSample?.sampleNumber}</strong>
              <button type="button" onClick={() => setShowAddTestsModal(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="بحث في كتالوج الفحوصات الطبية..."
                className="input-control"
                style={{ paddingRight: '28px' }}
                value={addTestSearch}
                onChange={(e) => setAddTestSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '260px', overflowY: 'auto', marginBottom: '16px' }}>
              {(Array.isArray(allAvailableTests) ? allAvailableTests : ((allAvailableTests as any)?.tests || []))
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
                        background: isChecked ? 'rgba(0,210,211,0.2)' : 'var(--bg-input-deep)',
                        border: `1px solid ${isChecked ? 'var(--accent-cyan)' : '#1e2638'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{formatTestDisplayName(t.name)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 800 }}>{formatEnglishCurrency(t.price)}</span>
                    </div>
                  );
                })}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddTestsModal(false)} className="btn-secondary">
                إلغاء
              </button>
              <button type="button" onClick={handleConfirmAddTests} disabled={addingTests || selectedNewTests.length === 0} className="btn-cyan-primary">
                {addingTests ? 'جاري الإضافة...' : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} />
                    <span>إضافة {selectedNewTests.length} فحص للعينة</span>
                  </span>
                )}
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

      {/* DIRTY STATE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showDirtyConfirm}
        title="تنبيه: نتائج غير محفوظة"
        message="تنبيه: توجد نتائج غير محفوظة للعينة الحالية. هل ترغب بالتجاهل والانتقال؟"
        type="warning"
        confirmText="متابعة وإلغاء التعديل"
        cancelText="البقاء للحفظ"
        onConfirm={handleConfirmDiscardAndSwitch}
        onCancel={() => {
          setShowDirtyConfirm(false);
          setPendingSampleToSelect(null);
        }}
      />

      {/* DELETE TEST CONFIRMATION MODAL */}
      {testToDelete && (
        <ConfirmModal
          isOpen={!!testToDelete}
          title="تأكيد حذف / استبعاد الفحص"
          message={`هل أنت متأكد من حذف فحص "${formatTestDisplayName(testToDelete.test?.name) || ''}" من هذه العينة؟ سيتم استبعاد الفحص فوراً وتعديل ملخص الحسابات.`}
          type="danger"
          confirmText={deletingTest ? 'جاري الحذف...' : 'نعم، حذف الفحص'}
          cancelText="إلغاء"
          onConfirm={handleConfirmDeleteTest}
          onCancel={() => setTestToDelete(null)}
        />
      )}

      {/* ISO 15189 SAMPLE REJECTION MODAL */}
      <SampleRejectionModal
        isOpen={showRejectionModal && !!selectedSample}
        sampleNumber={selectedSample?.sampleNumber || ''}
        patientName={selectedSample?.patient?.name || ''}
        onClose={() => setShowRejectionModal(false)}
        onConfirmReject={handleConfirmRejectSample}
      />

      {/* CLSI GP47 CRITICAL CALL DOCUMENTATION MODAL */}
      {selectedSample && criticalCallTargetTest && (
        <CriticalCallModal
          isOpen={showCriticalCallModal}
          sampleId={selectedSample.id}
          sampleNumber={selectedSample.sampleNumber}
          patientName={selectedSample.patient?.name || ''}
          testName={criticalCallTargetTest.name}
          resultValue={criticalCallTargetTest.resultValue}
          defaultDoctorName={selectedSample.doctor?.name || ''}
          onClose={() => {
            setShowCriticalCallModal(false);
            setCriticalCallTargetTest(null);
          }}
          onSave={handleSaveCriticalCallLog}
        />
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
