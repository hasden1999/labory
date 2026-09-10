'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useSearchParams } from 'next/navigation';
import { FileText, Search, Printer, Save, AlertTriangle, Check, User, Clock, CheckCircle2, Share2, History, Calculator, FlaskConical, X, Eye, Cpu, TestTube, Plus, MoreHorizontal, ChevronDown, Microscope, Bug, Activity, Zap, Sparkles, MessageCircle, AlertOctagon, CircleAlert, Barcode, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLab } from '../../components/LabContext';
import { getShareableUrl } from '../../lib/urlHelper';
import nextDynamic from 'next/dynamic';
import type { UrineAnalysisData } from '../../components/UrineFormModal';
import { compareSampleWithHistory, DeltaCheckResult } from '../../lib/deltaCheck';
import { Sample, SampleTest, Test } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';

const UrineFormModal = nextDynamic(() => import('../../components/UrineFormModal'), { ssr: false });
const GseModal = nextDynamic(() => import('../../components/workstations/GseModal'), { ssr: false });
const CbcModal = nextDynamic(() => import('../../components/workstations/CbcModal'), { ssr: false });
const ChemistryModal = nextDynamic(() => import('../../components/workstations/ChemistryModal'), { ssr: false });
const MicrobiologyModal = nextDynamic(() => import('../../components/workstations/MicrobiologyModal'), { ssr: false });
const SemenFormModal = nextDynamic(() => import('../../components/workstations/SemenFormModal'), { ssr: false });
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
      if (categoryOrCode === 'SFA') return code === 'SFA' || code === 'SEMEN' || name.includes('SEMEN') || name.includes('SEMINAL') || name.includes('سائل منوي') || name.includes('نطف') || name.includes('مني');
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
  const handleResultChange = (sampleTestId: string, val: string, test: any) => {
    const nextResults = { ...testResults };
    
    // Check abnormal / panic
    let isAbnormal = false;
    const num = parseNumericResult(val);
    if (!isNaN(num)) {
      if (test?.refRangeLow !== null && test?.refRangeLow !== undefined && num < test.refRangeLow) isAbnormal = true;
      if (test?.refRangeHigh !== null && test?.refRangeHigh !== undefined && num > test.refRangeHigh) isAbnormal = true;
    } else {
      // Safely check qualitative/non-numeric strings (e.g. ">1000", "<0.01", "Positive", "Reactive")
      const lower = val.trim().toLowerCase();
      if (['positive', 'reactive', 'pos', 'موجب', 'إيجابي'].includes(lower) || lower.includes('positive') || lower.includes('reactive')) {
        isAbnormal = true;
      } else if (lower.startsWith('>') && test?.refRangeHigh !== null && test?.refRangeHigh !== undefined) {
        const threshold = parseFloat(lower.replace('>', '').trim());
        if (!isNaN(threshold) && threshold >= test.refRangeHigh) {
          isAbnormal = true;
        }
      } else if (lower.startsWith('<') && test?.refRangeLow !== null && test?.refRangeLow !== undefined) {
        const threshold = parseFloat(lower.replace('<', '').trim());
        if (!isNaN(threshold) && threshold <= test.refRangeLow) {
          isAbnormal = true;
        }
      }
    }

    // Always store the raw entered text safely without breaking calculations or losing user input
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

  // Completion stats for current active sample (Hero Progress Bar)
  const testCompletionStats = useMemo(() => {
    if (!selectedSample?.tests?.length) return { completed: 0, total: 0, percentage: 0 };
    const total = selectedSample.tests.length;
    const completed = selectedSample.tests.filter((st: any) => {
      const val = testResults[st.id]?.resultValue;
      return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [selectedSample, testResults]);

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
      <div className="results-guided-container">
        {/* Top Full-Width Patient Hero Card */}
        {selectedSample ? (
          <div className="results-hero-card">
            <div className="results-hero-top">
              {/* Patient Info & Metadata */}
              <div className="results-hero-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                    {selectedSample.patient?.name || 'مريض غير مسمى'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)', background: 'var(--accent-cyan-subtle)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                    #{selectedSample.sampleNumber}
                  </span>
                </div>

                {/* Gender & Age */}
                <span className="results-pill-chip">
                  <User size={13} style={{ color: selectedSample.patient?.gender === 'FEMALE' ? '#ec4899' : 'var(--accent-cyan)' }} />
                  <span>{selectedSample.patient?.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}</span>
                  <span>•</span>
                  <span>{selectedSample.patient?.age || '-'} سنة</span>
                </span>

                {/* Urgency Pill */}
                {selectedSample.isUrgent ? (
                  <span className="results-pill-chip" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                    <AlertOctagon size={13} />
                    <span>حالة إسعافية عاجلة STAT</span>
                  </span>
                ) : (
                  <span className="results-pill-chip">
                    <Clock size={13} style={{ color: 'var(--text-dim)' }} />
                    <span>عادي (Routine)</span>
                  </span>
                )}

                {/* Doctor */}
                {selectedSample.doctor?.name && (
                  <span className="results-pill-chip" style={{ color: 'var(--text-muted)' }}>
                    <span>الطبيب: {selectedSample.doctor.name}</span>
                  </span>
                )}

                {/* Sample Received Time */}
                {selectedSample.createdAt && (
                  <span className="results-pill-chip" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    <Clock size={12} />
                    <span>{new Date(selectedSample.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                    {getElapsedTime(selectedSample.createdAt) && (
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>({getElapsedTime(selectedSample.createdAt)})</span>
                    )}
                  </span>
                )}

                {/* Barcode Quick Link */}
                <button
                  type="button"
                  onClick={() => {
                    setDocPreviewUrl(`/api/samples/${selectedSample.id}/barcode`);
                    setDocPreviewTitle(`طباعة ملصق الباركود (50x25mm) - عينة #${selectedSample.sampleNumber} (${selectedSample.patient?.name})`);
                  }}
                  title="طباعة ملصق الباركود الحراري 50x25mm"
                  className="results-pill-chip"
                  style={{ cursor: 'pointer', background: 'rgba(6, 182, 212, 0.08)', borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' }}
                >
                  <Barcode size={13} />
                  <span>ملصق الباركود</span>
                </button>
              </div>

              {/* Progress Bar & Test Completion Stats */}
              <div className="results-hero-progress-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontWeight: 800 }}>
                    <span style={{ color: testCompletionStats.percentage === 100 ? 'var(--color-success)' : 'var(--accent-cyan)' }}>
                      {testCompletionStats.percentage === 100 ? '✅ اكتملت كافة الفحوصات' : `نسبة الإنجاز: ${testCompletionStats.percentage}%`}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
                      {testCompletionStats.completed} من {testCompletionStats.total} فحص مكتمل
                    </span>
                  </div>
                  <div className="results-progress-bar-track">
                    <div
                      className="results-progress-bar-fill"
                      style={{
                        width: `${testCompletionStats.percentage}%`,
                        background: testCompletionStats.percentage === 100 ? '#10b981' : 'linear-gradient(90deg, var(--accent-cyan) 0%, #10b981 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="results-hero-card" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
            <span>يرجى اختيار عينة من طابور العينات أدناه للبدء في إدخال وتدقيق النتائج</span>
          </div>
        )}

        {/* Lower Guided Split Flow */}
        <div className="results-guided-split">
          
          {/* RIGHT: PATIENT SAMPLE QUEUE */}
          <div className="results-queue-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label htmlFor="results-search-input" className="input-label" style={{ margin: 0, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                طابور العينات (PATIENT QUEUE)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {filteredSamples.length} عينة
              </span>
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                id="results-search-input"
                type="text"
                placeholder="بحث في الطابور (رقم العينة أو الاسم)..."
                className="input-control"
                style={{ paddingRight: '30px', fontSize: '12px', height: '34px', borderRadius: '8px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter Tabs (Pills) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
              {([
                { id: 'ALL', label: 'الكل', count: statusCounts.ALL, variant: 'default' },
                { id: 'URGENT', label: 'STAT', count: statusCounts.URGENT, variant: 'stat' },
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
                      padding: '4px 9px',
                      fontSize: '11px',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '12px',
                      border: `1px solid ${
                        isActive
                          ? (isStat ? 'var(--color-danger)' : isReady ? 'var(--color-success)' : 'var(--accent-cyan)')
                          : 'var(--border-color)'
                      }`,
                      background: isActive
                        ? (isStat ? 'rgba(239, 68, 68, 0.15)' : isReady ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-cyan-subtle)')
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
                    {tab.id === 'URGENT' && <AlertOctagon size={11} />}
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 900,
                        opacity: 0.9,
                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
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

            {/* Queue List with Urgency & Active Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingLeft: '2px' }}>
              {loadingSamples ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل الطابور...</div>
              ) : filteredSamples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد عينات مطابقة</div>
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
                        borderRadius: '10px',
                        background: isSelected
                          ? (s.isUrgent ? 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, var(--bg-card) 100%)' : 'var(--accent-cyan-subtle)')
                          : (s.isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-input-deep)'),
                        border: isSelected
                          ? '1.5px solid var(--accent-cyan)'
                          : (s.isUrgent ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)'),
                        borderRight: s.isUrgent
                          ? '4px solid var(--color-danger)'
                          : (isSelected ? '4px solid var(--accent-cyan)' : '4px solid transparent'),
                        boxShadow: isSelected ? '0 2px 8px rgba(0, 210, 211, 0.15)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)', display: 'block' }}>
                          {s.patient?.name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>
                            #{s.sampleNumber} • {s.tests?.length || 0} فحص
                          </span>
                          {s.createdAt && (
                            <span style={{ fontSize: '10.5px', color: s.isUrgent ? 'var(--color-danger)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} />
                              <span>{getElapsedTime(s.createdAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {s.isUrgent ? (
                          <span className="badge badge-urgent" style={{ fontSize: '9.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertOctagon size={11} /> STAT
                          </span>
                        ) : isReady ? (
                          <span className="badge badge-ready" style={{ fontSize: '9.5px' }}>مكتملة</span>
                        ) : (
                          <span className="badge badge-received" style={{ fontSize: '9.5px' }}>قيد الفحص</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        {/* LEFT / WORKSPACE: RESULTS ENTRY & VALIDATION */}
        {selectedSample ? (
          <div className="results-workspace-card">
            
            {/* Header with Tools */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="input-label" style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>
                  إدخال وتدقيق النتائج (RESULTS ENTRY & VALIDATION)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  عينة #{selectedSample.sampleNumber} • المريض: {selectedSample.patient?.name}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Fast Pathologist Approval Hotkey Button */}
                <button
                  type="button"
                  onClick={handleFastPathologistApprove}
                  disabled={savingResults}
                  className="btn-fast-approve"
                  title="اعتماد العينة كـ READY والانتقال التلقائي للعينة التالية (Ctrl+Shift+Enter)"
                >
                  <Zap size={14} />
                  <span>اعتماد سريع</span>
                  <kbd style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>Ctrl+Shift+Enter</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResults(true)}
                  disabled={savingResults}
                  className="btn-cyan-primary"
                  style={{ height: '34px', padding: '0 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
                >
                  <Printer size={14} />
                  <span>حفظ وطباعة التقرير</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddTestsModal}
                  style={{
                    height: '34px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    padding: '0 12px',
                    background: 'var(--accent-cyan-subtle)',
                    border: '1.5px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="إضافة تحليل إضافي طلبه الطبيب ودمجه مباشرة مع هذه العينة والتقرير السابق"
                >
                  <Plus size={14} />
                  <span>➕ إضافة فحص</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocPreviewUrl(`/api/samples/${selectedSample.id}/barcode`);
                    setDocPreviewTitle(`طباعة ملصق الباركود (50x25mm) - عينة #${selectedSample.sampleNumber} (${selectedSample.patient?.name})`);
                  }}
                  className="btn-secondary"
                  style={{ color: '#06b6d4', borderColor: 'rgba(6,182,212,0.4)', height: '34px', fontSize: '11.5px', padding: '0 10px', borderRadius: '8px' }}
                  title="طباعة ملصق الباركود الحراري 50x25mm لأنبوب التحليل"
                >
                  <Barcode size={14} />
                  <span>طباعة باركود</span>
                </button>

                {isDirty && (
                  <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                      height: '34px',
                      fontSize: '11.5px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)'
                    }}
                    title="إرسال تقرير المريض ورابط التحقق عبر واتساب"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="results-table-container" dir="ltr">
              <table className="results-table-modern" dir="ltr">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>PARAMETER (TEST NAME)</th>
                    <th style={{ width: '220px', textAlign: 'left' }}>RESULT</th>
                    <th style={{ textAlign: 'left' }}>RANGE</th>
                    <th style={{ textAlign: 'left' }}>UNITS</th>
                    <th style={{ textAlign: 'left' }}>STATUS</th>
                    <th style={{ textAlign: 'center', width: '50px' }}>DEL</th>
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
                              <span>{st.test?.name}</span>
                              {st.test?.code && (
                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px' }}>
                                  {st.test?.code}
                                </span>
                              )}
                              {isChemistryAnalyte(st) && (
                                <button
                                  type="button"
                                  onClick={() => setShowChemistryModal(true)}
                                  title="فتح محطة الكيمياء السريرية"
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
                                  {currentVal ? <Check size={14} /> : <TestTube size={14} />}
                                  <span>{currentVal ? 'تم إدخال فحص الإدرار (تعديل)' : 'فتح فورمة الإدرار G.U.E'}</span>
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
                                  {currentVal ? <Check size={14} /> : <Microscope size={14} />}
                                  <span>{currentVal ? 'تم إدخال فحص الخروج (تعديل)' : 'فتح فورمة الخروج G.S.E'}</span>
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
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <Microscope size={14} />}
                                  <span>{currentVal ? 'تم إدخال فحص السائل المنوي (تعديل)' : 'فتح فورمة السائل المنوي S.F.A'}</span>
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
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <Activity size={14} />}
                                  <span>{currentVal ? 'تم إدخال فحص الدم (تعديل)' : 'فتح محطة الدمويات CBC'}</span>
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
                                  {currentVal ? <Check size={14} /> : <Bug size={14} />}
                                  <span>{currentVal ? 'تم إدخال المزرعة (تعديل)' : 'فتح محطة المزرعة Culture'}</span>
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
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {currentVal ? <Check size={14} /> : <FlaskConical size={14} />}
                                  <span>{currentVal ? 'تم إدخال فحص الكيمياء (تعديل)' : 'فتح محطة الكيمياء السريرية'}</span>
                                </div>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{st.test?.code || 'CHEM'}</span>
                              </button>
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
                                <button
                                  type="button"
                                  onClick={() => setShowChemistryModal(true)}
                                  title="فتح محطة الكيمياء السريرية والحسابات التلقائية"
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
                                  <span><FlaskConical size={14} /> محطة الكيمياء</span>
                                </button>
                              </div>
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
                                  background: 'var(--bg-input)',
                                  borderColor: isPanic ? 'var(--color-danger)' : isAbnormal ? 'var(--color-warning)' : currentVal ? 'var(--accent-cyan)' : 'var(--border-color)',
                                  boxShadow: isPanic ? '0 0 10px rgba(239, 68, 68, 0.4)' : isAbnormal ? '0 0 8px rgba(245, 158, 11, 0.3)' : 'none',
                                  color: isPanic ? 'var(--color-danger)' : isAbnormal ? 'var(--color-warning)' : 'var(--text-main)',
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
                                <span style={{ color: 'var(--color-danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CircleAlert size={12} /> PANIC
                                </span>
                              ) : isAbnormal ? (
                                <span style={{ color: 'var(--color-warning)', fontWeight: 800 }}>
                                  <AlertTriangle size={12} /> Abnormal
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
                                        color: isCrit ? 'var(--color-danger)' : 'var(--color-warning)',
                                        border: `1px solid ${isCrit ? 'var(--color-danger)' : 'var(--color-warning)'}`,
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

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setTestToDelete(st)}
                              title={`حذف فحص ${st.test?.name || ''} من هذه العينة`}
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
                          <tr style={{ background: 'var(--bg-stat-row)' }}>
                            <td colSpan={6} style={{ padding: '6px 14px', color: 'var(--color-danger)', fontSize: '11.5px', fontWeight: 700 }}>
                              <AlertTriangle size={12} /> PANIC LIMIT WARNING: {st.test?.name} value ({currentVal}) exceeds critical clinical threshold!
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
          <div className="results-workspace-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', color: 'var(--text-muted)', gap: '12px' }}>
            <FlaskConical size={40} style={{ opacity: 0.35, color: 'var(--accent-cyan)' }} />
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                لم يتم تحديد أي عينة بعد
              </strong>
              <span style={{ fontSize: '12px' }}>
                يرجى اختيار عينة من طابور المرضى بالجانب الأيمن للبدء في إدخال وتدقيق النتائج.
              </span>
            </div>
          </div>
        )}

        </div>
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
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{t.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 800 }}>{t.price?.toLocaleString()} د.ع</span>
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
          message={`هل أنت متأكد من حذف فحص "${testToDelete.test?.name || ''}" من هذه العينة؟ سيتم استبعاد الفحص فوراً وتعديل ملخص الحسابات.`}
          type="danger"
          confirmText={deletingTest ? 'جاري الحذف...' : 'نعم، حذف الفحص'}
          cancelText="إلغاء"
          onConfirm={handleConfirmDeleteTest}
          onCancel={() => setTestToDelete(null)}
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
