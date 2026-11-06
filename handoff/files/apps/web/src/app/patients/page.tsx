'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import nextDynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  Printer,
  Share2,
  FileText,
  CreditCard,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
  FlaskConical,
  FolderOpen,
  History,
  ExternalLink,
} from 'lucide-react';
import { toEnglishDigits, formatEnglishDate, formatClinicalAge } from '../../lib/formatters';
import { shareReportToWhatsApp, autoSendReportViaWhatsAppWeb } from '../../lib/shareReportToWhatsApp';

const UrineFormModal = nextDynamic(() => import('../../components/UrineFormModal'), { ssr: false });
const GseModal = nextDynamic(() => import('../../components/workstations/GseModal'), { ssr: false });
const CbcModal = nextDynamic(() => import('../../components/workstations/CbcModal'), { ssr: false });
const SemenFormModal = nextDynamic(() => import('../../components/workstations/SemenFormModal'), { ssr: false });
const MicrobiologyModal = nextDynamic(() => import('../../components/workstations/MicrobiologyModal'), { ssr: false });
const BhcgFormModal = nextDynamic(() => import('../../components/workstations/BhcgFormModal'), { ssr: false });
const AmhFormModal = nextDynamic(() => import('../../components/workstations/AmhFormModal'), { ssr: false });

interface FlattenedVisit {
  sampleId: string;
  sampleNumber: string;
  sampleStatus: string;
  collectionTime: string;
  finalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  patient: any;
  tests: any[];
  rawSample: any;
}

function isSpecialFormTest(code: string, name: string): 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'MICROBIOLOGY' | 'BHCG' | 'AMH' | null {
  const c = (code || '').toUpperCase().trim();
  const n = (name || '').toLowerCase().trim();
  if (c === 'GUE' || c === 'URINE' || n.includes('urine exam') || n.includes('general urine') || n.includes('فحص الإدرار العام')) return 'GUE';
  if (c === 'GSE' || c === 'STOOL' || n.includes('stool exam') || n.includes('general stool') || n.includes('فحص الخروج العام')) return 'GSE';
  if (c === 'CBC' || n.includes('complete blood count') || n.includes('صورة دم كاملة')) return 'CBC';
  if (c === 'SFA' || c === 'SEMEN' || n.includes('semen analysis') || n.includes('السائل المنوي')) return 'SFA';
  if (c === 'BHCG' || c === 'B-HCG' || c === 'HCG' || c === 'BETA-HCG' || n.includes('b-hcg') || n.includes('bhcg') || n.includes('beta hcg') || n.includes('beta-hcg') || n.includes('الحمل الرقمي')) return 'BHCG';
  if (c === 'AMH' || n.includes('anti-mullerian') || n.includes('anti mullerian') || n.includes('مخزون المبيض')) return 'AMH';
  if (c.includes('CULTURE') || c.includes('C&S') || n.includes('culture') || n.includes('مزرعة')) return 'MICROBIOLOGY';
  return null;
}

function parseRefRangeBounds(refStr: string): { low?: number; high?: number } {
  if (!refStr) return {};
  const match = refStr.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    return { low: parseFloat(match[1]), high: parseFloat(match[2]) };
  }
  return {};
}

function UnifiedPatientsResultsView({ defaultFilter = 'ALL' }: { defaultFilter?: 'ALL' | 'TODAY' | 'PENDING' | 'DEBT' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';

  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TODAY' | 'PENDING' | 'DEBT'>(defaultFilter);

  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [editedResults, setEditedResults] = useState<Record<string, string>>({});
  const [savingResults, setSavingResults] = useState(false);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('نقداً');
  const [paying, setPaying] = useState(false);

  // Edit Patient Modal State
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('ذكر');
  const [editAgeYears, setEditAgeYears] = useState('');

  // Delete Confirm State
  const [deleteSampleId, setDeleteSampleId] = useState<string | null>(null);

  // Print Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Specialized Form Modal
  const [specialModal, setSpecialModal] = useState<{ type: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'MICROBIOLOGY' | 'BHCG' | 'AMH'; testId: string } | null>(null);

  // Patient Past Visits History Modal
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/samples');
      const list = Array.isArray(data) ? data : [];
      setSamples(list);

      const qSampleId = searchParams?.get('sampleId');
      if (qSampleId && list.some((s: any) => s.id === qSampleId)) {
        setSelectedSampleId(qSampleId);
      } else if (!selectedSampleId && list.length > 0) {
        setSelectedSampleId(list[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || 'تعذر تحميل سجل المرضى والنتائج');
    } finally {
      setLoading(false);
    }
  }, [searchParams, selectedSampleId, toast]);

  useEffect(() => {
    loadData();
  }, []);

  const visits: FlattenedVisit[] = useMemo(() => {
    return samples.map((s: any) => {
      const finalAmt = Number(s.finalAmount ?? s.totalAmount ?? 0);
      const paidAmt = Number(s.paidAmount ?? finalAmt);
      const remAmt = Math.max(0, Number(s.remainingAmount ?? finalAmt - paidAmt));
      return {
        sampleId: s.id,
        sampleNumber: s.sampleNumber || s.id.slice(-4),
        sampleStatus: s.status || 'PENDING',
        collectionTime: s.collectionTime || s.createdAt || new Date().toISOString(),
        finalAmount: finalAmt,
        paidAmount: paidAmt,
        remainingAmount: remAmt,
        paymentStatus: remAmt > 0 ? 'UNPAID' : 'PAID',
        patient: s.patient || { id: s.patientId, name: 'مريض غير مسمى', gender: 'ذكر', ageYears: 0, phone: '' },
        tests: Array.isArray(s.tests) ? s.tests : [],
        rawSample: s,
      };
    });
  }, [samples]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const isCompletedStatus = (status: string) => ['COMPLETED', 'READY', 'DELIVERED'].includes(status);

  // Group visits count by patient
  const patientVisitsMap = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v) => {
      const pId = v.patient?.id || v.rawSample?.patientId;
      const pName = (v.patient?.name || '').trim().toLowerCase();
      if (pId) map.set(pId, (map.get(pId) || 0) + 1);
      if (pName) map.set(`name:${pName}`, (map.get(`name:${pName}`) || 0) + 1);
    });
    return map;
  }, [visits]);

  const getPatientVisitCount = useCallback((pId?: string, pName?: string) => {
    if (pId && patientVisitsMap.has(pId)) return patientVisitsMap.get(pId)!;
    const cleanName = (pName || '').trim().toLowerCase();
    if (cleanName && patientVisitsMap.has(`name:${cleanName}`)) return patientVisitsMap.get(`name:${cleanName}`)!;
    return 1;
  }, [patientVisitsMap]);

  const stats = useMemo(() => {
    const todayCount = visits.filter((v) => String(v.collectionTime).slice(0, 10) === todayStr).length;
    const pendingCount = visits.filter((v) => !isCompletedStatus(v.sampleStatus)).length;
    const debtTotal = visits.reduce((acc, v) => acc + v.remainingAmount, 0);
    return { todayCount, pendingCount, debtTotal };
  }, [visits, todayStr]);

  const filteredVisits = useMemo(() => {
    const q = toEnglishDigits(searchQuery).toLowerCase().trim();
    return visits.filter((v) => {
      if (activeFilter === 'TODAY' && String(v.collectionTime).slice(0, 10) !== todayStr) return false;
      if (activeFilter === 'PENDING' && isCompletedStatus(v.sampleStatus)) return false;
      if (activeFilter === 'DEBT' && v.remainingAmount <= 0) return false;

      if (!q) return true;
      const pName = (v.patient?.name || '').toLowerCase();
      const pPhone = toEnglishDigits(v.patient?.phone || '').toLowerCase();
      const sNum = String(v.sampleNumber || '').toLowerCase();
      const testsText = v.tests.map((t: any) => `${t.test?.code || ''} ${t.test?.name || ''}`).join(' ').toLowerCase();
      return pName.includes(q) || pPhone.includes(q) || sNum.includes(q) || testsText.includes(q);
    });
  }, [visits, activeFilter, searchQuery, todayStr]);

  const activeVisit = useMemo(() => {
    return visits.find((v) => v.sampleId === selectedSampleId) || filteredVisits[0] || null;
  }, [visits, filteredVisits, selectedSampleId]);

  const currentPatientVisits = useMemo(() => {
    if (!activeVisit) return [];
    const pId = activeVisit.patient?.id || activeVisit.rawSample?.patientId;
    const pName = (activeVisit.patient?.name || '').trim().toLowerCase();
    return visits
      .filter((v) => {
        const vId = v.patient?.id || v.rawSample?.patientId;
        const vName = (v.patient?.name || '').trim().toLowerCase();
        return (pId && vId && pId === vId) || (pName && vName && pName === vName);
      })
      .sort((a, b) => new Date(b.collectionTime).getTime() - new Date(a.collectionTime).getTime());
  }, [visits, activeVisit]);

  useEffect(() => {
    if (!activeVisit) {
      setEditedResults({});
      return;
    }
    const map: Record<string, string> = {};
    activeVisit.tests.forEach((st: any) => {
      const key = st.testId || st.id;
      map[key] = st.resultValue ?? '';
    });
    setEditedResults(map);
  }, [activeVisit?.sampleId]);

  const handleResultChange = (testKey: string, val: string) => {
    setEditedResults((prev) => ({ ...prev, [testKey]: val }));
  };

  const handleSaveResults = async () => {
    if (!activeVisit) return;
    setSavingResults(true);
    try {
      const resultsPayload = activeVisit.tests.map((st: any) => {
        const key = st.testId || st.id;
        const val = editedResults[key] !== undefined ? editedResults[key] : (st.resultValue || '');
        const refRange = st.referenceRange || st.test?.referenceRange || '';
        const bounds = parseRefRangeBounds(refRange);
        const numVal = parseFloat(val);
        let isAbnormal = Boolean(st.isAbnormal);
        if (!Number.isNaN(numVal) && (bounds.low !== undefined || bounds.high !== undefined)) {
          isAbnormal = (bounds.low !== undefined && numVal < bounds.low) || (bounds.high !== undefined && numVal > bounds.high);
        }
        return {
          testId: st.testId || st.test?.id || st.id,
          resultValue: val,
          isAbnormal,
        };
      });

      const allCompleted =
        resultsPayload.length > 0 &&
        resultsPayload.every(
          (r: any) => r.resultValue !== undefined && r.resultValue !== null && String(r.resultValue).trim() !== ''
        );

      await apiRequest(`/samples/${activeVisit.sampleId}/results`, 'PUT', {
        results: resultsPayload,
        status: allCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        markReady: allCompleted,
      });

      if (allCompleted) {
        activeVisit.sampleStatus = 'COMPLETED';
        if (activeVisit.rawSample) activeVisit.rawSample.status = 'COMPLETED';
      }

      toast.success(allCompleted ? 'تم حفظ كافة النتائج واعتمادها وتحديث الحالة إلى مكتمل' : 'تم حفظ نتائج التحاليل واعتمادها بنجاح', 'تم الحفظ');
      await loadData();
      const patientPhone = (activeVisit.patient?.phone || '').trim();

      if (allCompleted && labProfile?.whatsappAutoSendEnabled && patientPhone) {
        const currentLabName = labProfile?.labName || 'مختبر التحليلات الطبية';
        const caption = `مرحباً ${activeVisit.patient?.name || 'المريض'}، يسر (${currentLabName}) إرفاق نتائج تحاليلكم الطبية المعتمدة للعينة رقم (#${activeVisit.sampleNumber}). نتمنى لكم دوام الصحة والعافية.`;
        toast.info('جارٍ إرسال النتيجة تلقائياً عبر واتساب ويب المربوط...');
        autoSendReportViaWhatsAppWeb({
          sampleId: activeVisit.sampleId,
          phone: patientPhone,
          caption,
        }).then((waRes) => {
          if (waRes.ok) {
            toast.success(waRes.message, 'واتساب التلقائي');
          } else {
            toast.warning(waRes.message, 'واتساب التلقائي');
          }
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ النتائج');
    } finally {
      setSavingResults(false);
    }
  };

  const handlePrintReport = async () => {
    if (!activeVisit) return;
    const allHaveVal = activeVisit.tests.length > 0 && activeVisit.tests.every((st: any) => {
      const val = editedResults[st.testId || st.id] !== undefined ? editedResults[st.testId || st.id] : st.resultValue;
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
    if (allHaveVal && !isCompletedStatus(activeVisit.sampleStatus)) {
      try {
        await apiRequest(`/samples/${activeVisit.sampleId}/results`, 'PUT', {
          results: activeVisit.tests.map((st: any) => ({
            testId: st.testId || st.id,
            resultValue: editedResults[st.testId || st.id] !== undefined ? editedResults[st.testId || st.id] : (st.resultValue || ''),
          })),
          status: 'COMPLETED',
          markReady: true,
        });
        activeVisit.sampleStatus = 'COMPLETED';
        if (activeVisit.rawSample) activeVisit.rawSample.status = 'COMPLETED';
        loadData();
      } catch {}
    }
    const printUrl = `/api/samples/${activeVisit.sampleId}/print?autoprint=true&force=true`;
    window.open(printUrl, '_blank');
    setPreviewUrl(printUrl);
  };

  const handleSendWhatsApp = async () => {
    if (!activeVisit) return;
    const allHaveVal = activeVisit.tests.length > 0 && activeVisit.tests.every((st: any) => {
      const val = editedResults[st.testId || st.id] !== undefined ? editedResults[st.testId || st.id] : st.resultValue;
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
    if (allHaveVal && !isCompletedStatus(activeVisit.sampleStatus)) {
      try {
        await apiRequest(`/samples/${activeVisit.sampleId}/results`, 'PUT', {
          results: activeVisit.tests.map((st: any) => ({
            testId: st.testId || st.id,
            resultValue: editedResults[st.testId || st.id] !== undefined ? editedResults[st.testId || st.id] : (st.resultValue || ''),
          })),
          status: 'COMPLETED',
          markReady: true,
        });
        activeVisit.sampleStatus = 'COMPLETED';
        if (activeVisit.rawSample) activeVisit.rawSample.status = 'COMPLETED';
        loadData();
      } catch {}
    }
    try {
      const res = await shareReportToWhatsApp({
        sampleId: activeVisit.sampleId,
        phone: activeVisit.patient?.phone || '',
        caption: `تقرير التحاليل الطبية - ${activeVisit.patient?.name || 'المريض'} (#${activeVisit.sampleNumber})`,
      });
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.warning(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'تعذر مشاركة التقرير عبر واتساب');
    }
  };

  const handleOpenPayModal = () => {
    if (!activeVisit) return;
    setPayAmount(String(activeVisit.remainingAmount || activeVisit.finalAmount || 0));
    setShowPayModal(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit) return;
    const amt = Number(toEnglishDigits(payAmount));
    if (!amt || amt <= 0) {
      toast.warning('يرجى إدخال مبلغ صحيح');
      return;
    }
    setPaying(true);
    try {
      const newPaid = Number(activeVisit.paidAmount || 0) + amt;
      const newRem = Math.max(0, Number(activeVisit.remainingAmount || 0) - amt);

      // 1. Try dedicated payment route first (/pay)
      try {
        await apiRequest(`/samples/${activeVisit.sampleId}/pay`, 'POST', {
          paidAmount: amt,
          payAmount: amt,
          paymentMethod: 'CASH',
          notes: 'تسديد حساب من شاشة المرضى',
        });
      } catch (payErr) {
        // 2. Fallback to sample PATCH if /pay is unavailable
        await apiRequest(`/samples/${activeVisit.sampleId}`, 'PATCH', {
          paidAmount: newPaid,
          remainingAmount: newRem,
          paymentStatus: newRem <= 0 ? 'PAID' : 'PARTIAL',
        });
      }

      toast.success('تم تسديد الحساب وتحديث الرصيد بنجاح');
      setShowPayModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'تعذر تسجيل الدفعة');
    } finally {
      setPaying(false);
    }
  };

  const handleOpenEditPatient = () => {
    if (!activeVisit?.patient) return;
    setEditName(activeVisit.patient.name || '');
    setEditPhone(activeVisit.patient.phone || '');
    setEditGender(activeVisit.patient.gender || 'ذكر');
    setEditAgeYears(String(activeVisit.patient.ageYears ?? ''));
    setShowEditPatientModal(true);
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit?.patient?.id) return;
    try {
      await apiRequest(`/patients/${activeVisit.patient.id}`, 'PUT', {
        name: editName.trim(),
        phone: toEnglishDigits(editPhone.trim()),
        gender: editGender,
        ageYears: Number(toEnglishDigits(editAgeYears)) || 0,
      });
      toast.success('تم تحديث بيانات المريض بنجاح');
      setShowEditPatientModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'تعذر تحديث بيانات المريض');
    }
  };

  const handleDeleteSample = async () => {
    if (!deleteSampleId) return;
    try {
      await apiRequest(`/samples/${deleteSampleId}`, 'DELETE');
      toast.success('تم حذف السجل بنجاح');
      setDeleteSampleId(null);
      setSelectedSampleId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف السجل');
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* 1. Compact Top Header Bar (48px - exact match to mockup & Main Screen) */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 4px 16px',
          backgroundColor: 'var(--bg-primary)',
          flexShrink: 0,
        }}
      >
        {/* Left Action Pill Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setShowEditPatientModal(false);
              setShowPayModal(false);
              setDeleteSampleId(null);
              router.push('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>إضافة مريض جديد</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            disabled={!activeVisit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              backgroundColor: '#0f766e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: activeVisit ? 'pointer' : 'not-allowed',
              opacity: activeVisit ? 1 : 0.5,
              boxShadow: '0 2px 5px rgba(15, 118, 110, 0.25)',
            }}
          >
            <Printer size={15} />
            <span>طباعة التقرير</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!activeVisit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: activeVisit ? 'pointer' : 'not-allowed',
              opacity: activeVisit ? 1 : 0.5,
              boxShadow: '0 2px 5px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Share2 size={15} />
            <span>إرسال واتساب</span>
          </button>
        </div>

        {/* Right Summary Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <Calendar size={15} color="#0f766e" />
            <span style={{ color: 'var(--text-muted)' }}>عينات اليوم:</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{stats.todayCount}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <FlaskConical size={15} color="#0284c7" />
            <span style={{ color: 'var(--text-muted)' }}>قيد الفحص:</span>
            <strong style={{ color: '#0284c7', fontSize: '14px' }}>{stats.pendingCount}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <CreditCard size={15} color="#dc2626" />
            <span style={{ color: 'var(--text-muted)' }}>ديون غير مسددة:</span>
            <strong style={{ color: '#dc2626', fontSize: '14px' }}>
              {stats.debtTotal.toLocaleString()} {currency}
            </strong>
          </div>

          <button
            type="button"
            onClick={loadData}
            title="تحديث السجلات"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* 2. Split Workspace Panels (Right: Master Queue | Left: Active Patient & Results Table) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          padding: '10px 16px 14px 16px',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* RIGHT PANEL: Master List of Patients & Samples (~370px) */}
        <section
          style={{
            width: '370px',
            minWidth: '370px',
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Search Input & Filter Pills */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المريض، الهاتف، أو رقم العينة..."
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px 0 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'TODAY', label: 'اليوم' },
                { id: 'PENDING', label: 'قيد الفحص' },
                { id: 'DEBT', label: 'عليه دين' },
              ].map((f) => {
                const active = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id as any)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: active ? '1.5px solid #0f766e' : '1px solid var(--border-color)',
                      backgroundColor: active ? 'rgba(15, 118, 110, 0.1)' : 'var(--bg-input)',
                      color: active ? '#0f766e' : 'var(--text-muted)',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Cards List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {loading ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                جاري تحميل السجلات...
              </div>
            ) : filteredVisits.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                لا توجد سجلات مطابقة للبحث
              </div>
            ) : (
              filteredVisits.map((visit) => {
                const isSelected = activeVisit?.sampleId === visit.sampleId;
                const isCompleted = isCompletedStatus(visit.sampleStatus);
                const hasDebt = visit.remainingAmount > 0;
                const patientVisitsCount = getPatientVisitCount(visit.patient?.id || visit.rawSample?.patientId, visit.patient?.name);
                const testSummary = visit.tests
                  .slice(0, 4)
                  .map((t: any) => t.test?.code || t.test?.name || 'فحص')
                  .join(' , ');

                return (
                  <div
                    key={visit.sampleId}
                    onClick={() => setSelectedSampleId(visit.sampleId)}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #0f766e' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(15, 118, 110, 0.06)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {/* Patient Info (Right side in RTL) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '999px',
                          backgroundColor: isSelected ? '#0f766e' : 'var(--bg-input)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: 800,
                          fontSize: '13px',
                        }}
                      >
                        <User size={17} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 800,
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {visit.patient?.name || 'مريض'}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '1px 7px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(15, 118, 110, 0.12)',
                              color: '#0f766e',
                              flexShrink: 0,
                            }}
                          >
                            #{visit.sampleNumber}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '999px',
                              backgroundColor: patientVisitsCount > 1 ? 'rgba(15, 118, 110, 0.12)' : 'var(--bg-input)',
                              color: patientVisitsCount > 1 ? '#0f766e' : 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              flexShrink: 0,
                            }}
                          >
                            {patientVisitsCount} {patientVisitsCount === 1 ? 'زيارة' : 'زيارات'}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            marginTop: '3px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {testSummary || 'بدون فحوصات'}
                        </div>
                      </div>
                    </div>

                    {/* Status Badges (Left side in RTL) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 9px',
                          borderRadius: '999px',
                          backgroundColor: isCompleted ? '#dcfce7' : '#e0f2fe',
                          color: isCompleted ? '#15803d' : '#0369a1',
                        }}
                      >
                        {isCompleted ? 'مكتمل' : 'قيد الفحص'}
                      </span>
                      {hasDebt && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                          }}
                        >
                          غير مسدد
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* LEFT PANEL: Selected Patient Info + Editable Results Table + Bottom Action Bar */}
        <section
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {!activeVisit ? (
            <div
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '10px',
              }}
            >
              <FileText size={40} strokeWidth={1.5} />
              <div style={{ fontSize: '15px', fontWeight: 800 }}>اختر مريضاً من القائمة على اليمين لعرض وتعديل نتائجه</div>
            </div>
          ) : (
            <>
              {/* Top Patient Card (Matching Mockup) */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Right: Avatar + Name + Age + Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0f766e',
                    }}
                  >
                    <User size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
                        {activeVisit.patient?.name}
                      </h2>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '2px 9px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(15, 118, 110, 0.12)',
                          color: '#0f766e',
                        }}
                      >
                        عينة #{activeVisit.sampleNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPatientHistoryModal(true)}
                        title="عرض ملف المريض وسجل الزيارات السابقة والتحاليل"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          padding: '2px 10px',
                          borderRadius: '999px',
                          backgroundColor: currentPatientVisits.length > 1 ? '#0f766e' : 'var(--bg-input)',
                          color: currentPatientVisits.length > 1 ? '#ffffff' : 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FolderOpen size={13} />
                        <span>ملف المريض ({currentPatientVisits.length} {currentPatientVisits.length === 1 ? 'زيارة' : 'زيارات'})</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenEditPatient}
                        title="تعديل بيانات المريض"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSampleId(activeVisit.sampleId)}
                        title="حذف العينة"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12.5px',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginTop: '4px',
                      }}
                    >
                      <span>
                        العمر:{' '}
                        {formatClinicalAge({
                          ageYears: activeVisit.patient?.ageYears,
                          ageMonths: activeVisit.patient?.ageMonths,
                          ageDays: activeVisit.patient?.ageDays,
                        }) || `${activeVisit.patient?.ageYears || 0} سنة`}
                      </span>
                      <span>•</span>
                      <span>الجنس: {activeVisit.patient?.gender || 'ذكر'}</span>
                      {activeVisit.patient?.phone && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} />
                            {activeVisit.patient.phone}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>التاريخ: {formatEnglishDate(activeVisit.collectionTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Left: Financial Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    onClick={activeVisit.remainingAmount > 0 ? handleOpenPayModal : undefined}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: activeVisit.remainingAmount > 0 ? '#fef2f2' : '#f0fdf4',
                      border: activeVisit.remainingAmount > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                      cursor: activeVisit.remainingAmount > 0 ? 'pointer' : 'default',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: activeVisit.remainingAmount > 0 ? '#991b1b' : '#166534',
                      }}
                    >
                      {activeVisit.remainingAmount > 0 ? 'المتبقي غير المسدد' : 'الحالة المالية'}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: activeVisit.remainingAmount > 0 ? '#dc2626' : '#15803d',
                      }}
                    >
                      {activeVisit.remainingAmount > 0
                        ? `${activeVisit.remainingAmount.toLocaleString()} ${currency}`
                        : `مسدد بالكامل (${activeVisit.finalAmount.toLocaleString()} ${currency})`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Results Table Card + Bottom Sticky Action Bar */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                  minHeight: 0,
                }}
              >
                {/* Table Header Title */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                    النتائج ({activeVisit.tests.length} فحوصات)
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    يمكنك تعديل النتائج مباشرة والضغط على حفظ النتائج
                  </span>
                </div>

                {/* Scrollable LTR Results Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }} dir="ltr">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700 }}>Test Name</th>
                        <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, width: '220px' }}>Result</th>
                        <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>Units</th>
                        <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>Reference Range</th>
                        <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, width: '110px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVisit.tests.map((st: any) => {
                        const key = st.testId || st.id;
                        const code = st.test?.code || '';
                        const name = st.test?.name || code || 'Test';
                        const unit = st.unit || st.test?.unit || '-';
                        const rRangesArr = Array.isArray(st.test?.referenceRanges) ? st.test.referenceRanges : [];
                        const refRange =
                          st.referenceRange ||
                          st.test?.referenceRange ||
                          st.test?.refRangeText ||
                          (st.test?.refRangeLow != null && st.test?.refRangeHigh != null
                            ? `${st.test.refRangeLow} - ${st.test.refRangeHigh}`
                            : rRangesArr.length > 0
                              ? rRangesArr
                                  .map((r: any) => {
                                    const txt =
                                      r.text ||
                                      (r.low != null && r.high != null ? `${r.low} - ${r.high}` : r.low != null ? `>= ${r.low}` : r.high != null ? `<= ${r.high}` : '');
                                    return r.label ? `${r.label}: ${txt}` : txt;
                                  })
                                  .join('\n')
                              : '-');
                        const val = editedResults[key] !== undefined ? editedResults[key] : (st.resultValue || '');
                        const specialType = isSpecialFormTest(code, name);

                        // Determine status badge
                        const bounds = parseRefRangeBounds(refRange);
                        const numVal = parseFloat(val);
                        let statusLabel = val ? 'Normal' : 'قيد الفحص';
                        let statusBg = val ? '#dcfce7' : '#f1f5f9';
                        let statusColor = val ? '#15803d' : '#64748b';

                        if (!Number.isNaN(numVal)) {
                          if (bounds.high !== undefined && numVal > bounds.high) {
                            statusLabel = 'High ↑';
                            statusBg = '#fee2e2';
                            statusColor = '#dc2626';
                          } else if (bounds.low !== undefined && numVal < bounds.low) {
                            statusLabel = 'Low ↓';
                            statusBg = '#e0f2fe';
                            statusColor = '#0284c7';
                          }
                        }

                        return (
                          <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--text-main)' }}>
                              <div>{name}</div>
                              {(() => {
                                let displayPriorVal = st.previousValue;
                                let displayPriorDate = st.previousDate;
                                if (!displayPriorVal && currentPatientVisits.length > 1) {
                                  const curSampleCreated = new Date(activeVisit.collectionTime).getTime();
                                  for (const pv of currentPatientVisits) {
                                    if (pv.sampleId === activeVisit.sampleId) continue;
                                    if (new Date(pv.collectionTime).getTime() >= curSampleCreated) continue;
                                    const pt = (pv.tests || []).find((x: any) =>
                                      x.testId === (st.testId || st.id) ||
                                      (code && (x.test?.code || x.code || '').toUpperCase().trim() === code.toUpperCase().trim()) ||
                                      (name && (x.test?.name || x.name || '').toLowerCase().trim() === name.toLowerCase().trim())
                                    );
                                    if (pt && pt.resultValue && String(pt.resultValue).trim() !== '') {
                                      displayPriorVal = String(pt.resultValue);
                                      displayPriorDate = pv.collectionTime;
                                      break;
                                    }
                                  }
                                }
                                if (!displayPriorVal) return null;
                                return (
                                  <span
                                    dir="rtl"
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '10.5px',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      marginTop: '3px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    📊 السابق: {displayPriorVal} {displayPriorDate ? `(${formatEnglishDate(displayPriorDate)})` : ''}
                                  </span>
                                );
                              })()}
                            </td>

                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleResultChange(key, e.target.value)}
                                  placeholder="أدخل النتيجة..."
                                  style={{
                                    width: specialType ? '120px' : '160px',
                                    height: '34px',
                                    padding: '0 10px',
                                    borderRadius: '7px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-input)',
                                    color: statusLabel === 'High ↑' ? '#dc2626' : statusLabel === 'Low ↓' ? '#0284c7' : 'var(--text-main)',
                                    fontWeight: 800,
                                    fontSize: '13.5px',
                                    textAlign: 'center',
                                    outline: 'none',
                                  }}
                                />
                                {specialType && (
                                  <button
                                    type="button"
                                    onClick={() => setSpecialModal({ type: specialType, testId: key })}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: '7px',
                                      backgroundColor: '#0f766e',
                                      color: '#ffffff',
                                      border: 'none',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    الفورمة
                                  </button>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {unit}
                            </td>

                            <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {(() => {
                                const lines = String(refRange || '-')
                                  .split(/\r?\n|\||;/)
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                if (lines.length <= 1) {
                                  return <span>{refRange}</span>;
                                }
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    {lines.map((ln, lIdx) => {
                                      const m = ln.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
                                      const mGe = ln.match(/>=?\s*(\d+(?:\.\d+)?)/);
                                      const mLe = ln.match(/<=?\s*(\d+(?:\.\d+)?)/);
                                      return (
                                        <button
                                          key={lIdx}
                                          type="button"
                                          onClick={() => {
                                            if (m) {
                                              const mid = (parseFloat(m[1]) + parseFloat(m[2])) / 2;
                                              handleResultChange(key, mid.toFixed(1));
                                            } else if (mGe) {
                                              handleResultChange(key, (parseFloat(mGe[1]) + 0.5).toFixed(1));
                                            } else if (mLe) {
                                              handleResultChange(key, (parseFloat(mLe[1]) * 0.8).toFixed(1));
                                            }
                                          }}
                                          title="اضغط لاختيار هذا المدى وإدراج القيمة المطابقة"
                                          style={{
                                            padding: '2px 8px',
                                            borderRadius: '5px',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--bg-input)',
                                            color: 'var(--text-main)',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          {ln}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </td>

                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: '999px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  backgroundColor: statusBg,
                                  color: statusColor,
                                }}
                              >
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sticky Bottom Action Bar (Exact Match to Mockup) */}
                <div
                  dir="rtl"
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={15} color="#16a34a" />
                    <span>واتساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPayModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCard size={15} color="#0284c7" />
                    <span>تسديد الحساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={15} />
                    <span>طباعة التقرير النهائي</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveResults}
                    disabled={savingResults}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0f766e',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: savingResults ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                    }}
                  >
                    <Check size={16} />
                    <span>{savingResults ? 'جاري الحفظ...' : 'حفظ النتائج'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Quick Payment Modal */}
      {showPayModal && activeVisit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleConfirmPayment}
            style={{
              width: '400px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>تسديد حساب العينة #{activeVisit.sampleNumber}</h3>
              <button type="button" onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              المريض: <strong style={{ color: 'var(--text-main)' }}>{activeVisit.patient?.name}</strong> | المتبقي:{' '}
              <strong style={{ color: '#dc2626' }}>
                {activeVisit.remainingAmount.toLocaleString()} {currency}
              </strong>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>المبلغ المدفوع الآن ({currency})</label>
              <input
                type="text"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  fontSize: '14px',
                  fontWeight: 800,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={paying}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0f766e',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {paying ? 'جاري التسديد...' : 'تأكيد التسديد'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Edit Patient Modal */}
      {showEditPatientModal && activeVisit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleSaveEditPatient}
            style={{
              width: '420px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>تعديل بيانات المريض</h3>
              <button type="button" onClick={() => setShowEditPatientModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الاسم الكامل</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>العمر (سنة)</label>
                <input
                  type="text"
                  value={editAgeYears}
                  onChange={(e) => setEditAgeYears(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الجنس</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>رقم الهاتف</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setShowEditPatientModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Print Preview Modal */}
      {previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '900px',
              maxWidth: '95vw',
              height: '90vh',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '14px' }}>معاينة وطباعة التقرير الطبي</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (previewUrl) {
                      window.open(`${previewUrl}${previewUrl.includes('?') ? '&' : '?'}autoprint=true&force=true`, '_blank');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  <Printer size={13} />
                  <span>طباعة فورية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  إغلاق ✕
                </button>
              </div>
            </div>
            <iframe src={previewUrl} style={{ flex: 1, width: '100%', border: 'none' }} title="Report Preview" />
          </div>
        </div>
      )}

      {/* Specialized Workstation Modals */}
      {specialModal?.type === 'GUE' && activeVisit && (
        <UrineFormModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          patientName={activeVisit.patient?.name || ''}
          sampleNumber={activeVisit.sampleNumber}
          initialData={editedResults[specialModal.testId] || ''}
          onApply={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}
      {specialModal?.type === 'GSE' && activeVisit && (
        <GseModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          sample={activeVisit.rawSample}
          initialValue={editedResults[specialModal.testId] || ''}
          onSave={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}
      {specialModal?.type === 'CBC' && activeVisit && (
        <CbcModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          sample={activeVisit.rawSample}
          initialValue={editedResults[specialModal.testId] || ''}
          onSave={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}
      {specialModal?.type === 'SFA' && activeVisit && (
        <SemenFormModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          patientName={activeVisit.patient?.name || ''}
          sampleNumber={activeVisit.sampleNumber}
          initialData={editedResults[specialModal.testId] || ''}
          onApply={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}
      {specialModal?.type === 'MICROBIOLOGY' && activeVisit && (
        <MicrobiologyModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          sample={activeVisit.rawSample}
          initialValue={editedResults[specialModal.testId] || ''}
          onSave={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}
      {specialModal?.type === 'BHCG' && activeVisit && (
        <BhcgFormModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          patientName={activeVisit.patient?.name || ''}
          patientAge={activeVisit.patient?.age || ''}
          initialData={editedResults[specialModal.testId] || ''}
          onApply={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}
      {specialModal?.type === 'AMH' && activeVisit && (
        <AmhFormModal
          isOpen={true}
          onClose={() => setSpecialModal(null)}
          patientName={activeVisit.patient?.name || ''}
          patientAge={activeVisit.patient?.age || ''}
          initialData={editedResults[specialModal.testId] || ''}
          onApply={(val: string) => {
            handleResultChange(specialModal.testId, val);
            setSpecialModal(null);
          }}
        />
      )}

      {/* Patient Profile & Past Visits Modal */}
      {showPatientHistoryModal && activeVisit && (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowPatientHistoryModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(15, 118, 110, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '999px',
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
                    ملف المريض: {activeVisit.patient?.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    إجمالي الزيارات المسجلة: <strong>{currentPatientVisits.length}</strong> {currentPatientVisits.length === 1 ? 'زيارة' : 'زيارات'}
                    {activeVisit.patient?.phone ? ` • هاتف: ${activeVisit.patient.phone}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPatientHistoryModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Visits List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentPatientVisits.map((visitItem) => {
                const isCurrent = visitItem.sampleId === activeVisit.sampleId;
                const isCompleted = isCompletedStatus(visitItem.sampleStatus);
                return (
                  <div
                    key={visitItem.sampleId}
                    style={{
                      border: isCurrent ? '2px solid #0f766e' : '1px solid var(--border-color)',
                      backgroundColor: isCurrent ? 'rgba(15, 118, 110, 0.04)' : 'var(--bg-input)',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Top Row: Sample #, Date, Status Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 900, fontSize: '14px', color: '#0f766e' }}>
                          عينة #{visitItem.sampleNumber}
                        </span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: '#0f766e',
                              color: '#ffffff',
                            }}
                          >
                            الزيارة الحالية
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          تاريخ: {formatEnglishDate(visitItem.collectionTime)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: isCompleted ? '#dcfce7' : '#e0f2fe',
                            color: isCompleted ? '#15803d' : '#0369a1',
                          }}
                        >
                          {isCompleted ? 'مكتمل' : 'قيد الفحص'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: visitItem.remainingAmount > 0 ? '#fee2e2' : '#f0fdf4',
                            color: visitItem.remainingAmount > 0 ? '#dc2626' : '#15803d',
                          }}
                        >
                          {visitItem.remainingAmount > 0 ? `متبقي: ${visitItem.remainingAmount.toLocaleString()} ${currency}` : 'مسدد'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Tests & Results Table / Badges */}
                    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', padding: '8px 12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>
                        الفحوصات ونتائجها:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
                        {visitItem.tests.map((t: any, tIdx: number) => {
                          const tName = t.test?.name || t.name || t.test?.code || t.code || 'تحليل';
                          const tVal = t.resultValue;
                          const tUnit = t.unit || t.test?.unit || '';
                          return (
                            <div
                              key={tIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tName}:</span>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: tVal ? (t.isAbnormal ? '#dc2626' : '#0f766e') : 'var(--text-muted)',
                                }}
                                dir="ltr"
                              >
                                {tVal ? `${tVal} ${tUnit}`.trim() : 'قيد الفحص'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom: Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSampleId(visitItem.sampleId);
                            setShowPatientHistoryModal(false);
                            toast.info(`تم الانتقال إلى العينة #${visitItem.sampleNumber}`);
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          الانتقال لهذه العينة
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const printUrl = `/api/samples/${visitItem.sampleId}/print?autoprint=true&force=true`;
                          window.open(printUrl, '_blank');
                          setShowPatientHistoryModal(false);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#1e293b',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Printer size={13} />
                        <span>طباعة تقرير هذه العينة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteSampleId)}
        title="حذف السجل والعينة"
        message="هل أنت متأكد من حذف هذه العينة نهائياً؟"
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteSample}
        onCancel={() => setDeleteSampleId(null)}
      />
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center' }}>جاري تحميل سجل المرضى والنتائج...</div>}>
      <UnifiedPatientsResultsView defaultFilter="ALL" />
    </Suspense>
  );
}
