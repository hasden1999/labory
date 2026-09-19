'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { getShareableUrl } from '../../lib/urlHelper';
import ConfirmModal from '../../components/ConfirmModal';
import { Patient, Sample, SampleTest } from '../../types';
import {
  Users,
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  Clock,
  Activity,
  Printer,
  Share2,
  FileText,
  CreditCard,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  UserPlus,
  ArrowUpRight,
  Sparkles,
  FlaskConical,
  DollarSign,
  AlertOctagon,
  AlertTriangle,
  Check,
  RefreshCw,
  TestTube2,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { toEnglishDigits, formatEnglishDate, formatEnglishTime, formatEnglishDateTime } from '../../lib/formatters';

// Helper to determine collection tubes used in a sample
function getSampleTubes(tests: SampleTest[] = []) {
  const list: { id: string; name: string; color: string; bg: string; border: string }[] = [];
  let hasEdta = false;
  let hasSerum = false;
  let hasCitrate = false;
  let hasUrine = false;

  tests.forEach((st) => {
    const t = st.test;
    if (!t) return;
    const text = `${t.name || ''} ${t.code || ''} ${t.category || ''}`.toLowerCase();
    if (text.includes('pt') || text.includes('inr') || text.includes('ptt') || text.includes('ddimer') || text.includes('d-dimer')) {
      hasCitrate = true;
    } else if (text.includes('cbc') || text.includes('esr') || text.includes('hb') || text.includes('hba1c') || text.includes('plt') || text.includes('blood group') || text.includes('bg')) {
      hasEdta = true;
    } else if (text.includes('gue') || text.includes('gse') || text.includes('urine') || text.includes('stool') || text.includes('ادرار') || text.includes('خروج')) {
      hasUrine = true;
    } else {
      hasSerum = true;
    }
  });

  if (hasEdta) list.push({ id: 'edta', name: 'EDTA', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' });
  if (hasSerum) list.push({ id: 'serum', name: 'SST / Gel', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' });
  if (hasCitrate) list.push({ id: 'citrate', name: 'Citrate', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' });
  if (hasUrine) list.push({ id: 'urine', name: 'عبوة فحص', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' });

  return list;
}

function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { labProfile } = useLab();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WITH_DEBT' | 'TODAY' | 'MALE' | 'FEMALE'>('ALL');

  // In-Place Expanded Patient State
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [patientDetailsMap, setPatientDetailsMap] = useState<Record<string, Patient>>({});
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  // Modals
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);

  // Document & WhatsApp Modals
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappText, setWhatsappText] = useState('');

  // Quick Pay Modal & Thermal Voucher States
  const [payModalSample, setPayModalSample] = useState<any | null>(null);
  const [payModalPatient, setPayModalPatient] = useState<Patient | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('نقداً');
  const [payNotes, setPayNotes] = useState<string>('');
  const [paying, setPaying] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<any | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE'>('MALE');

  const loadPatients = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiRequest('/patients');
      setPatients(res || []);

      // If URL has patient id, auto expand it
      const paramId = searchParams.get('id');
      if (paramId) {
        setExpandedPatientId(paramId);
      }
    } catch (err: any) {
      if (!silent) toast.error('فشل في جلب سجل المرضى', 'خطأ');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Live Auto-Polling & Focus Sync across LAN devices
  useEffect(() => {
    const interval = setInterval(() => {
      loadPatients(true);
    }, 6000);

    const handleFocus = () => {
      loadPatients(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Fetch full fresh details when expanding a patient
  const toggleExpandPatient = useCallback(async (patient: Patient) => {
    if (expandedPatientId === patient.id) {
      setExpandedPatientId(null);
      return;
    }

    setExpandedPatientId(patient.id);

    // If we don't have fresh details or want to ensure latest
    setLoadingDetailsId(patient.id);
    try {
      const fresh = await apiRequest(`/patients/${patient.id}`);
      if (fresh) {
        setPatientDetailsMap((prev) => ({ ...prev, [patient.id]: fresh }));
      }
    } catch (err) {
      // Fallback to existing list item
    } finally {
      setLoadingDetailsId(null);
    }
  }, [expandedPatientId]);

  // Keyboard shortcut F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (expandedPatientId) {
          const currentP = patientDetailsMap[expandedPatientId] || patients.find((p) => p.id === expandedPatientId);
          if (currentP) {
            handleStartNewTest(currentP);
            return;
          }
        }
        setShowAddPatientModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPatientId, patientDetailsMap, patients]);

  const handleStartNewTest = (patient: Patient) => {
    router.push(
      `/?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}&patientPhone=${patient.phone || ''}&patientAge=${patient.age || ''}&patientGender=${patient.gender === 'FEMALE' || (patient.gender as string) === 'أنثى' ? 'FEMALE' : 'MALE'}`
    );
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.warning('يرجى إدخال اسم المريض', 'بيانات ناقصة');
      return;
    }

    try {
      const cleanPhone = patientPhone.trim() ? toEnglishDigits(patientPhone.trim()) : undefined;
      const cleanAge = patientAge ? Number(toEnglishDigits(patientAge)) : undefined;
      const newP = await apiRequest('/patients', 'POST', {
        name: patientName.trim(),
        phone: cleanPhone,
        age: cleanAge,
        gender: patientGender,
      });

      setShowAddPatientModal(false);
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setPatientGender('MALE');
      toast.success('تمت إضافة المريض الجديد بنجاح!', 'تم الحفظ');
      await loadPatients();
      setExpandedPatientId(newP.id);
    } catch (err: any) {
      if (err?.duplicate) {
        toast.warning(err.message, 'حماية من التكرار');
      } else {
        toast.error(err.message || 'خطأ أثناء إضافة المريض', 'فشل العملية');
      }
    }
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setPatientName(p.name);
    setPatientPhone(p.phone || '');
    setPatientAge(p.age ? String(p.age) : '');
    setPatientGender(p.gender === 'FEMALE' || (p.gender as string) === 'أنثى' ? 'FEMALE' : 'MALE');
    setShowEditPatientModal(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient || !patientName.trim()) return;

    try {
      const cleanPhone = patientPhone.trim() ? toEnglishDigits(patientPhone.trim()) : undefined;
      const cleanAge = patientAge ? Number(toEnglishDigits(patientAge)) : undefined;
      await apiRequest(`/patients/${editingPatient.id}`, 'PATCH', {
        name: patientName.trim(),
        phone: cleanPhone,
        age: cleanAge,
        gender: patientGender,
      });

      setShowEditPatientModal(false);
      toast.success('تم تحديث بيانات المريض بنجاح!', 'تم التحديث');
      loadPatients(true);

      // Refresh details in map
      const p = await apiRequest(`/patients/${editingPatient.id}`);
      setPatientDetailsMap((prev) => ({ ...prev, [editingPatient.id]: p }));
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل بيانات المريض', 'خطأ');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePatientId) return;
    try {
      await apiRequest(`/patients/${deletePatientId}`, 'DELETE');
      toast.success('تم حذف ملف المريض بنجاح', 'تم الحذف');
      if (expandedPatientId === deletePatientId) {
        setExpandedPatientId(null);
      }
      setDeletePatientId(null);
      loadPatients();
    } catch (err: any) {
      toast.error(err.message || 'لا يمكن حذف المريض لوجود فحوصات مرتبطة به', 'تعذر الحذف');
    }
  };

  const handlePaySample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalSample) return;
    const amt = Number(toEnglishDigits(payAmount));
    if (!amt || amt <= 0) {
      toast.warning('يرجى إدخال مبلغ صحيح', 'تنبيه');
      return;
    }
    setPaying(true);
    try {
      const res = await apiRequest(`/samples/${payModalSample.id}/pay`, 'PATCH', {
        paidAmount: amt,
        paymentMethod: payMethod,
        notes: payNotes,
      });
      toast.success(`تم تسجيل سداد الدفعة بنجاح! رقم السند: #${res.voucherNumber || ''}`, 'سداد دفعة');
      const targetPId = payModalPatient?.id || payModalSample.patientId;
      setPayModalSample(null);

      // Reload fresh details
      if (targetPId) {
        const p = await apiRequest(`/patients/${targetPId}`);
        setPatientDetailsMap((prev) => ({ ...prev, [targetPId]: p }));
      }
      loadPatients(true);

      if (res?.voucherNumber) {
        setActiveVoucher({
          voucherNumber: toEnglishDigits(res.voucherNumber),
          debtorName: payModalPatient?.name || payModalSample.patient?.name || 'مريض',
          phone: payModalPatient?.phone || payModalSample.patient?.phone,
          amount: amt,
          type: 'سند قبض مالي (سداد متبقي فحص)',
          paymentMethod: payMethod,
          date: formatEnglishDateTime(new Date()),
          notes: payNotes || `سداد متبقي فحص عينة #${toEnglishDigits(payModalSample.sampleNumber)}`,
        });
        setShowVoucherModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل سداد الدفعة', 'خطأ');
    } finally {
      setPaying(false);
    }
  };

  const handleOpenWhatsApp = (sample: Sample, patient: Patient) => {
    const phone = patient?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `964${cleanPhone.slice(1)}` : cleanPhone;
    setWhatsappPhone(formattedPhone);

    const reportUrl = getShareableUrl(`/api/samples/${sample.id}/print`, labProfile);
    const currentLabName = labProfile?.labName || 'المختبر للتحليلات الطبية';
    setWhatsappText(
      `مرحباً ${patient?.name || ''}،\nيسر ${currentLabName} إعلامكم بصدور نتائج فحصكم رقم (#${sample.sampleNumber}).\nيمكنكم الاطلاع على التقرير المعتمد وتحميله مباشرة من الرابط:\n${reportUrl}\n\nنتمنى لكم دوام الصحة والعافية.`
    );
    setShowWhatsAppModal(true);
  };

  // Helper to calculate total patient debt
  const getPatientDebt = (patient: Patient): number => {
    const details = patientDetailsMap[patient.id] || patient;
    if (!details.samples) return 0;
    return details.samples.reduce((sum: number, s: any) => sum + (s.remainingAmount || 0), 0);
  };

  // Filtered and searched list
  const filteredPatients = useMemo(() => {
    let list = patients;

    // Apply active filter
    if (activeFilter === 'WITH_DEBT') {
      list = list.filter((p) => getPatientDebt(p) > 0);
    } else if (activeFilter === 'TODAY') {
      const todayStr = new Date().toISOString().split('T')[0];
      list = list.filter((p) => {
        const createdStr = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '';
        const hasTodaySample = p.samples?.some((s) => s.createdAt && s.createdAt.startsWith(todayStr));
        return createdStr === todayStr || hasTodaySample;
      });
    } else if (activeFilter === 'MALE') {
      list = list.filter((p) => p.gender === 'MALE' || (p.gender as string) === 'ذكر');
    } else if (activeFilter === 'FEMALE') {
      list = list.filter((p) => p.gender === 'FEMALE' || (p.gender as string) === 'أنثى');
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.includes(q)) ||
          (p.age && p.age.toString().includes(q)) ||
          p.id.includes(q)
        );
      });
    }

    return list;
  }, [patients, searchQuery, activeFilter, patientDetailsMap]);

  // Statistics
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    let debtCount = 0;
    let totalSamples = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let todayCount = 0;

    patients.forEach((p) => {
      const debt = getPatientDebt(p);
      if (debt > 0) debtCount++;
      const samplesCount = p.samples?.length || p.visitsCount || 0;
      totalSamples += samplesCount;

      const createdStr = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '';
      const hasTodaySample = p.samples?.some((s) => s.createdAt && s.createdAt.startsWith(todayStr));
      if (createdStr === todayStr || hasTodaySample) todayCount++;
    });

    return { totalPatients, debtCount, totalSamples, todayCount };
  }, [patients, patientDetailsMap]);

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px', direction: 'rtl' }}>
        
        {/* TOP HEADER SECTION */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '16px',
                background: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <Users size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.3px' }}>
                سجل وملفات المرضى
              </h1>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                استعراض سريع، فتح الزيارات والتحاليل السابقة في نفس المكان، والطباعة بضغطة زر
              </p>
            </div>
          </div>

          {/* New Patient CTA */}
          <button
            onClick={() => {
              setPatientName('');
              setPatientPhone('');
              setPatientAge('');
              setPatientGender('MALE');
              setShowAddPatientModal(true);
            }}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.15s ease',
            }}
            title="إضافة ملف مريض جديد (F2)"
          >
            <UserPlus size={16} />
            <span>إضافة مريض جديد</span>
          </button>
        </div>

        {/* QUICK METRICS BAR */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* Total Patients */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>إجمالي المرضى</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                {stats.totalPatients}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>

          {/* Today's Visits */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>مرضى اليوم</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                {stats.todayCount}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
          </div>

          {/* Outstanding Debts */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>مرضى بذمم معلقة</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: stats.debtCount > 0 ? '#ef4444' : 'var(--text-main)', marginTop: '2px' }}>
                {stats.debtCount}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff1f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
          </div>

          {/* Total Tests Done */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>إجمالي الزيارات والطلبات</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#8b5cf6', marginTop: '2px' }}>
                {stats.totalSamples}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTERS CARD */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 3px 12px rgba(0,0,0,0.02)',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="ابحث بالاسم، رقم الهاتف، العمر، أو المعرف الطبي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input-deep)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '12px 48px 12px 40px',
                fontSize: '13.5px',
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', marginLeft: '4px' }}>
              تصفية سريعة:
            </span>

            {[
              { key: 'ALL', label: `الكل (${patients.length})` },
              { key: 'WITH_DEBT', label: `عليهم ديون متبقية (${stats.debtCount})` },
              { key: 'TODAY', label: `زيارات اليوم (${stats.todayCount})` },
              { key: 'MALE', label: 'ذكور فقط' },
              { key: 'FEMALE', label: 'إناث فقط' },
            ].map((f) => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as any)}
                  style={{
                    background: active ? '#0f172a' : 'var(--bg-input-deep)',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    border: `1px solid ${active ? '#0f172a' : 'var(--border-color)'}`,
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PATIENT CARDS STREAM (IN-PLACE EXPANDABLE) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 10px', color: '#2563eb' }} />
              <div>جاري تحميل سجل المرضى والملفات الطبية...</div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: '20px',
                padding: '48px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Users size={36} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                لا توجد نتائج مطابقة للبحث
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح، أو قم بإضافة مريض جديد الآن
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    مسح البحث
                  </button>
                )}
                <button
                  onClick={() => setShowAddPatientModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={14} />
                  <span>إضافة مريض جديد</span>
                </button>
              </div>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isExpanded = expandedPatientId === patient.id;
              const details = patientDetailsMap[patient.id] || patient;
              const debt = getPatientDebt(patient);
              const samples = details.samples || [];
              const isFemale = patient.gender === 'FEMALE' || (patient.gender as string) === 'أنثى';

              return (
                <div
                  key={patient.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: `1.5px solid ${isExpanded ? '#3b82f6' : 'var(--border-color)'}`,
                    boxShadow: isExpanded
                      ? '0 10px 30px rgba(59, 130, 246, 0.08)'
                      : '0 2px 8px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                  }}
                >
                  {/* PATIENT CARD HEADER ROW (Click to expand in-place) */}
                  <div
                    onClick={() => toggleExpandPatient(patient)}
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      background: isExpanded ? 'rgba(37, 99, 235, 0.03)' : 'transparent',
                    }}
                  >
                    {/* Patient Main Info (Right side RTL) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          background: isFemale ? '#fff1f2' : '#eff6ff',
                          border: `1.5px solid ${isFemale ? '#fecdd3' : '#bfdbfe'}`,
                          color: isFemale ? '#e11d48' : '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <User size={22} />
                      </div>

                      {/* Name & Basic Chips */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h2
                            style={{
                              fontSize: '15.5px',
                              fontWeight: 900,
                              color: isExpanded ? '#2563eb' : 'var(--text-main)',
                              margin: 0,
                            }}
                          >
                            {patient.name}
                          </h2>

                          {/* Gender Pill */}
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: isFemale ? '#fff1f2' : '#f1f5f9',
                              color: isFemale ? '#be123c' : '#334155',
                              border: `1px solid ${isFemale ? '#fecdd3' : '#e2e8f0'}`,
                            }}
                          >
                            {isFemale ? 'أنثى' : 'ذكر'}
                            {patient.age ? ` • ${patient.age} سنة` : ''}
                          </span>

                          {/* Total Visits Badge */}
                          <span
                            style={{
                              padding: '2px 9px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Activity size={12} />
                            <span>{patient.visitsCount ?? samples.length ?? 0} زيارات سابقة</span>
                          </span>

                          {/* Debt Badge if any */}
                          {debt > 0 && (
                            <span
                              style={{
                                padding: '2px 9px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <AlertCircle size={12} />
                              <span>متبقي دين: {debt.toLocaleString()} د.ع</span>
                            </span>
                          )}
                        </div>

                        {/* Sub-info: Phone & Registration */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} style={{ color: '#94a3b8' }} />
                            <strong style={{ color: 'var(--text-main)', direction: 'ltr' }}>
                              {patient.phone || 'بدون هاتف'}
                            </strong>
                          </span>

                          {patient.createdAt && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} style={{ color: '#94a3b8' }} />
                              <span>مسجل: {formatEnglishDate(patient.createdAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Patient Card Fast Action Buttons (Left side RTL) */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Fast Intake Button */}
                      <button
                        onClick={() => handleStartNewTest(patient)}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '7px 14px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                        title="بدء طلب فحص جديد لهذا المريض مباشرة (F2)"
                      >
                        <Plus size={13} />
                        <span>طلب فحص جديد</span>
                      </button>

                      {/* Expand / Collapse In-Place Indicator */}
                      <button
                        onClick={() => toggleExpandPatient(patient)}
                        style={{
                          background: isExpanded ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-input-deep)',
                          border: `1px solid ${isExpanded ? '#bfdbfe' : 'var(--border-color)'}`,
                          color: isExpanded ? '#2563eb' : 'var(--text-main)',
                          borderRadius: '10px',
                          padding: '7px 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{isExpanded ? 'إخفاء التحاليل' : 'عرض التحاليل السابقة'}</span>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* IN-PLACE EXPANDED CONTENT (تنفتح في نفس المكان مباشرة) */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--bg-card-subtle)',
                        padding: '18px 22px',
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      {/* Top Patient Details & Actions Toolbar */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                          background: 'var(--bg-card)',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: '1px solid var(--border-color)',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            الملف الطبي للمريض: <strong style={{ color: 'var(--text-main)' }}>{details.name}</strong>
                          </span>

                          {debt > 0 && (
                            <span
                              style={{
                                fontSize: '11.5px',
                                color: '#dc2626',
                                fontWeight: 800,
                                background: '#fef2f2',
                                padding: '3px 10px',
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                              }}
                            >
                              إجمالي الدين المعلق: {debt.toLocaleString()} د.ع
                            </span>
                          )}
                        </div>

                        {/* Action buttons for Patient Record */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {debt > 0 && (
                            <button
                              onClick={() => router.push(`/debts?search=${encodeURIComponent(patient.name)}`)}
                              className="btn-secondary"
                              style={{ fontSize: '11px', padding: '5px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                              <CreditCard size={12} />
                              <span>كشف الحساب والديون</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(details)}
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '5px 10px' }}
                          >
                            <Edit3 size={12} />
                            <span>تعديل الملف</span>
                          </button>

                          <button
                            onClick={() => setDeletePatientId(details.id)}
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '5px 8px', color: '#ef4444' }}
                            title="حذف ملف المريض"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Header for Previous Tests */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Activity size={16} color="#2563eb" />
                          <span>سجل الزيارات والتحاليل السابقة ({samples.length})</span>
                        </strong>

                        {loadingDetailsId === patient.id && (
                          <span style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RefreshCw size={11} className="animate-spin" />
                            <span>جاري تحديث النتائج...</span>
                          </span>
                        )}
                      </div>

                      {/* SAMPLES / VISITS STREAM */}
                      {samples.length === 0 ? (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px dashed var(--border-color)',
                            borderRadius: '14px',
                            padding: '30px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '12.5px',
                          }}
                        >
                          <FlaskConical size={30} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                          <div>لا توجد طلبات فحص سابقة مسجلة لهذا المريض حتى الآن.</div>
                          <button
                            onClick={() => handleStartNewTest(patient)}
                            className="btn-primary"
                            style={{ marginTop: '12px', fontSize: '11.5px', padding: '6px 14px' }}
                          >
                            <Plus size={13} />
                            <span>إنشاء أول طلب فحص لهذا المريض</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {samples.map((sample: Sample) => {
                            const sampleTubes = getSampleTubes(sample.tests);
                            const sampleDebt = sample.remainingAmount || 0;

                            return (
                              <div
                                key={sample.id}
                                style={{
                                  background: 'var(--bg-card)',
                                  border: '1.5px solid var(--border-color)',
                                  borderRadius: '16px',
                                  padding: '14px 18px',
                                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                                }}
                              >
                                {/* Sample Top Header */}
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '10px',
                                  }}
                                >
                                  {/* Right Info: Sample number, status, date, tubes */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <strong
                                      style={{
                                        color: '#2563eb',
                                        fontSize: '14px',
                                        fontWeight: 900,
                                      }}
                                    >
                                      عينة #{sample.sampleNumber}
                                    </strong>

                                    {/* Status Badge */}
                                    <span
                                      style={{
                                        padding: '2px 9px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        background:
                                          sample.status === 'READY'
                                            ? 'rgba(16, 185, 129, 0.12)'
                                            : sample.status === 'IN_PROGRESS'
                                            ? 'rgba(37, 99, 235, 0.12)'
                                            : 'rgba(100, 116, 139, 0.12)',
                                        color:
                                          sample.status === 'READY'
                                            ? '#059669'
                                            : sample.status === 'IN_PROGRESS'
                                            ? '#2563eb'
                                            : '#475569',
                                        border: `1px solid ${
                                          sample.status === 'READY'
                                            ? 'rgba(16, 185, 129, 0.3)'
                                            : sample.status === 'IN_PROGRESS'
                                            ? 'rgba(37, 99, 235, 0.3)'
                                            : 'rgba(100, 116, 139, 0.3)'
                                        }`,
                                      }}
                                    >
                                      {sample.status === 'RECEIVED'
                                        ? 'تم استلام العينة'
                                        : sample.status === 'IN_PROGRESS'
                                        ? 'جاري الفحص المخبري'
                                        : sample.status === 'READY'
                                        ? 'جاهزة للطباعة والاعتماد'
                                        : 'تم تسليم التقرير'}
                                    </span>

                                    {sample.isUrgent && (
                                      <span
                                        style={{
                                          padding: '2px 8px',
                                          borderRadius: '20px',
                                          fontSize: '10.5px',
                                          fontWeight: 800,
                                          background: 'rgba(239, 68, 68, 0.12)',
                                          color: '#dc2626',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                        }}
                                      >
                                        STAT عاجل
                                      </span>
                                    )}

                                    {/* Date and Time */}
                                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                      {formatEnglishDate(sample.createdAt)} • {formatEnglishTime(sample.createdAt)}
                                    </span>

                                    {/* Tubes Chips */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      {sampleTubes.map((tube) => (
                                        <span
                                          key={tube.id}
                                          style={{
                                            padding: '2px 7px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            background: tube.bg,
                                            color: tube.color,
                                            border: `1px solid ${tube.border}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: '6px',
                                              height: '6px',
                                              borderRadius: '50%',
                                              background: tube.color,
                                            }}
                                          />
                                          <span>{tube.name}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Left Actions: Print, Barcode, WhatsApp, Results */}
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {/* Link to Results */}
                                    <button
                                      onClick={() => router.push(`/results?sampleId=${sample.id}`)}
                                      className="btn-secondary"
                                      style={{ padding: '4px 9px', fontSize: '11px', color: '#2563eb' }}
                                      title="فتح شاشة تدقيق وإدخال النتائج"
                                    >
                                      <FileText size={12} />
                                      <span>النتائج</span>
                                    </button>

                                    {/* Print Barcode */}
                                    <button
                                      onClick={() => {
                                        setDocPreviewUrl(`/api/samples/${sample.id}/barcode`);
                                        setDocPreviewTitle(`طباعة ملصق الباركود - عينة #${sample.sampleNumber} (${details.name})`);
                                      }}
                                      className="btn-secondary"
                                      style={{ padding: '4px 9px', fontSize: '11px' }}
                                      title="طباعة باركود أنبوب الفحص"
                                    >
                                      <Printer size={12} />
                                      <span>باركود</span>
                                    </button>

                                    {/* Print A4 Report */}
                                    <button
                                      onClick={() => {
                                        setDocPreviewUrl(`/api/samples/${sample.id}/print`);
                                        setDocPreviewTitle(`معاينة تقرير الفحص A4 - عينة #${sample.sampleNumber} (${details.name})`);
                                      }}
                                      className="btn-secondary"
                                      style={{ padding: '4px 9px', fontSize: '11px' }}
                                      title="طباعة ومعاينة التقرير الطبي A4"
                                    >
                                      <FileText size={12} />
                                      <span>تقرير A4</span>
                                    </button>

                                    {/* WhatsApp */}
                                    <button
                                      onClick={() => handleOpenWhatsApp(sample, details)}
                                      className="btn-secondary"
                                      style={{ padding: '4px 9px', fontSize: '11px', color: '#10b981' }}
                                      title="إرسال التقرير للمريض عبر واتساب"
                                    >
                                      <Share2 size={12} />
                                      <span>واتساب</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Tests and Results Table */}
                                <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
                                  <table
                                    style={{
                                      width: '100%',
                                      borderCollapse: 'collapse',
                                      fontSize: '12px',
                                      textAlign: 'right',
                                    }}
                                  >
                                    <thead>
                                      <tr style={{ background: 'var(--bg-input-deep)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>الفحص الطبي</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>النتيجة</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>المعدل الطبيعي (Ref)</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>الوحدة</th>
                                        <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>الحالة التشخيصية</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sample.tests?.map((st: SampleTest) => {
                                        return (
                                          <tr
                                            key={st.id}
                                            style={{
                                              borderBottom: '1px solid var(--border-color)',
                                              transition: 'background 0.1s',
                                            }}
                                          >
                                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-main)' }}>
                                              {st.test?.name}
                                            </td>

                                            <td style={{ padding: '8px 12px' }}>
                                              {st.resultValue ? (
                                                <strong
                                                  style={{
                                                    fontSize: '13px',
                                                    color: st.isCritical
                                                      ? '#ef4444'
                                                      : st.isAbnormal
                                                      ? '#f59e0b'
                                                      : '#10b981',
                                                  }}
                                                >
                                                  {st.resultValue}
                                                </strong>
                                              ) : (
                                                <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>بانتظار الإدخال</span>
                                              )}
                                            </td>

                                            <td
                                              style={{
                                                padding: '8px 12px',
                                                fontSize: '11.5px',
                                                color: 'var(--text-muted)',
                                                direction: 'ltr',
                                                unicodeBidi: 'isolate',
                                                textAlign: 'right',
                                              }}
                                            >
                                              {st.test?.refRangeText ||
                                                (st.test?.refRangeLow !== null && st.test?.refRangeHigh !== null
                                                  ? `${st.test?.refRangeLow} - ${st.test?.refRangeHigh}`
                                                  : '-')}
                                            </td>

                                            <td style={{ padding: '8px 12px', color: 'var(--text-dim)', fontSize: '11.5px' }}>
                                              {st.test?.unit || '-'}
                                            </td>

                                            <td style={{ padding: '8px 12px' }}>
                                              {st.isCritical ? (
                                                <span
                                                  style={{
                                                    padding: '2px 7px',
                                                    borderRadius: '6px',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                  }}
                                                >
                                                  <AlertOctagon size={11} />
                                                  <span>حرج (Panic)</span>
                                                </span>
                                              ) : st.isAbnormal ? (
                                                <span
                                                  style={{
                                                    padding: '2px 7px',
                                                    borderRadius: '6px',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    background: '#fef3c7',
                                                    color: '#d97706',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                  }}
                                                >
                                                  <AlertTriangle size={11} />
                                                  <span>غير طبيعي</span>
                                                </span>
                                              ) : st.resultValue ? (
                                                <span
                                                  style={{
                                                    padding: '2px 7px',
                                                    borderRadius: '6px',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    background: '#dcfce7',
                                                    color: '#15803d',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                  }}
                                                >
                                                  <Check size={11} />
                                                  <span>طبيعي</span>
                                                </span>
                                              ) : (
                                                <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>-</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Financial Note & Quick Pay for Sample */}
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    background: 'var(--bg-input-deep)',
                                    borderRadius: '10px',
                                    padding: '8px 14px',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
                                    <span>
                                      المبلغ الإجمالي: <strong style={{ color: 'var(--text-main)' }}>{sample.priceTotal?.toLocaleString()} د.ع</strong>
                                    </span>
                                    <span>
                                      المسدد: <strong style={{ color: '#10b981' }}>{(sample.paidAmount || 0).toLocaleString()} د.ع</strong>
                                    </span>
                                  </div>

                                  <div>
                                    {sampleDebt > 0 ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#ef4444', fontWeight: 800 }}>
                                          متبقي دين: {sampleDebt.toLocaleString()} د.ع
                                        </span>
                                        <button
                                          onClick={() => {
                                            setPayModalSample(sample);
                                            setPayModalPatient(details);
                                            setPayAmount(String(sampleDebt));
                                            setPayMethod('نقداً');
                                            setPayNotes(`سداد متبقي فحص عينة #${sample.sampleNumber} (${details.name})`);
                                          }}
                                          style={{
                                            background: '#10b981',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                          title="سداد المبلغ المتبقي وطباعة السند الحراري"
                                        >
                                          <CreditCard size={12} />
                                          <span>سداد وطباعة السند</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span style={{ color: '#10b981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={13} />
                                        <span>واصل بالكامل</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* ADD PATIENT MODAL */}
      {showAddPatientModal && (
        <div className="modal-overlay" onClick={() => setShowAddPatientModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#2563eb" />
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>إضافة مريض جديد</h3>
              </div>
              <button onClick={() => setShowAddPatientModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">اسم المريض الكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد عبد الله رشيد"
                  className="input-control"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="مثال: 07701234567"
                    className="input-control"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(toEnglishDigits(e.target.value).replace(/[^0-9+\-\s]/g, ''))}
                  />
                </div>

                <div>
                  <label className="input-label">العمر (سنوات)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="مثال: 35"
                    className="input-control"
                    value={patientAge}
                    onChange={(e) => setPatientAge(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">الجنس</label>
                <select
                  className="select-control"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as 'MALE' | 'FEMALE')}
                >
                  <option value="MALE">ذكر (Male)</option>
                  <option value="FEMALE">أنثى (Female)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '12px' }}>
                  حفظ المريض
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="btn-secondary"
                  style={{ borderRadius: '12px' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL */}
      {showEditPatientModal && (
        <div className="modal-overlay" onClick={() => setShowEditPatientModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#2563eb" />
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>تعديل بيانات المريض</h3>
              </div>
              <button onClick={() => setShowEditPatientModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">اسم المريض *</label>
                <input
                  type="text"
                  className="input-control"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    className="input-control"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(toEnglishDigits(e.target.value).replace(/[^0-9+\-\s]/g, ''))}
                  />
                </div>

                <div>
                  <label className="input-label">العمر</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-control"
                    value={patientAge}
                    onChange={(e) => setPatientAge(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">الجنس</label>
                <select
                  className="select-control"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as 'MALE' | 'FEMALE')}
                >
                  <option value="MALE">ذكر (Male)</option>
                  <option value="FEMALE">أنثى (Female)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '12px' }}>
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPatientModal(false)}
                  className="btn-secondary"
                  style={{ borderRadius: '12px' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={!!deletePatientId}
        title="حذف ملف المريض"
        message="هل أنت متأكد من حذف هذا المريض من السجلات؟ لا يمكن التراجع إذا تم الحذف."
        type="danger"
        confirmText="نعم، احذف الملف"
        cancelText="تراجع"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePatientId(null)}
      />

      {/* WHATSAPP MODAL */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#10b981" />
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>إرسال التقرير عبر واتساب</h3>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">رقم الهاتف الدولي:</label>
                <input
                  type="text"
                  className="input-control"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  style={{ direction: 'ltr' }}
                />
              </div>

              <div>
                <label className="input-label">نص الرسالة:</label>
                <textarea
                  className="textarea-control"
                  rows={4}
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;
                  window.open(url, '_blank');
                  setShowWhatsAppModal(false);
                  toast.success('تم فتح واتساب لإرسال الرسالة!', 'إرسال التقرير');
                }}
                className="btn-success"
                style={{ width: '100%', padding: '10px', borderRadius: '12px' }}
              >
                <span>فتح واتساب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {docPreviewUrl && (
        <div className="modal-overlay" onClick={() => setDocPreviewUrl(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '840px', height: '88vh', display: 'flex', flexDirection: 'column', borderRadius: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{docPreviewTitle}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => window.open(docPreviewUrl, '_blank')}
                  className="btn-primary"
                  style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px' }}
                >
                  <Printer size={14} />
                  <span>طباعة في نافذة جديدة</span>
                </button>
                <button type="button" onClick={() => setDocPreviewUrl(null)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>
            </div>

            <iframe
              src={docPreviewUrl}
              style={{ flex: 1, width: '100%', border: 'none', borderRadius: '10px', background: '#fff' }}
              title="معاينة المستند"
            />
          </div>
        </div>
      )}

      {/* QUICK PAY MODAL */}
      {payModalSample && (
        <div className="modal-overlay" onClick={() => setPayModalSample(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#10b981" />
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  سداد متبقي حساب عينة #{payModalSample.sampleNumber}
                </h3>
              </div>
              <button onClick={() => setPayModalSample(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePaySample} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  background: 'var(--bg-input-deep)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div>
                  <strong>اسم المريض:</strong> {payModalPatient?.name || payModalSample.patient?.name}
                </div>
                <div>
                  <strong>إجمالي كلفة الفحوصات:</strong> {payModalSample.priceTotal?.toLocaleString()} د.ع
                </div>
                <div>
                  <strong>المسدد سابقاً:</strong> {(payModalSample.paidAmount || 0).toLocaleString()} د.ع
                </div>
                <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '13px', marginTop: '2px' }}>
                  <strong>المتبقي بذمة المريض:</strong> {(payModalSample.remainingAmount || 0).toLocaleString()} د.ع
                </div>
              </div>

              <div>
                <label className="input-label">المبلغ المطلوب تسديده الآن (د.ع) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}
                  min="1"
                  max={payModalSample.remainingAmount}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">طريقة الدفع</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="select-control"
                >
                  <option value="نقداً">نقداً (كاش - قاصة الصندوق)</option>
                  <option value="زين كاش">زين كاش (ZainCash)</option>
                  <option value="بطاقة دفع">بطاقة ماستركارد / كي كارد (POS)</option>
                </select>
              </div>

              <div>
                <label className="input-label">ملاحظات / بيان السند</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="input-control"
                  placeholder="ملاحظات اختيارية..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setPayModalSample(null)} className="btn-secondary" style={{ borderRadius: '10px' }}>
                  إلغاء
                </button>
                <button type="submit" disabled={paying} className="btn-success" style={{ borderRadius: '10px' }}>
                  {paying ? <RefreshCw size={13} className="animate-spin" /> : <DollarSign size={13} />}
                  <span>{paying ? 'جاري التسجيل...' : 'تأكيد السداد وطباعة السند'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THERMAL VOUCHER PREVIEW & PRINT */}
      {showVoucherModal && activeVoucher && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: '16px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div
              id="thermal-voucher-print"
              style={{
                background: '#fff',
                color: '#000',
                padding: '16px',
                borderRadius: '10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                textAlign: 'center',
                border: '1px dashed #cbd5e1',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '2px', color: '#000' }}>
                {labProfile?.labName || 'المختبر للتحليلات الطبية'}
              </h2>
              <p style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                هاتف: {labProfile?.phone || '07701234567'} | {labProfile?.address || 'العراق'}
              </p>
              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
                <strong style={{ fontSize: '14px', display: 'block' }}>{activeVoucher.type}</strong>
                <span style={{ fontSize: '12px' }}>رقم السند: #{activeVoucher.voucherNumber}</span>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', margin: '10px 0', fontSize: '12px' }}>
                <div><strong>التاريخ:</strong> {activeVoucher.date}</div>
                <div><strong>المريض:</strong> {activeVoucher.debtorName}</div>
                {activeVoucher.phone && <div><strong>الهاتف:</strong> {activeVoucher.phone}</div>}
                <div><strong>طريقة الدفع:</strong> {activeVoucher.paymentMethod}</div>
                <div><strong>البيان:</strong> {activeVoucher.notes}</div>
              </div>

              <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', margin: '12px 0', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '11px', color: '#334155', display: 'block' }}>المبلغ المقبوض:</span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>{activeVoucher.amount?.toLocaleString()} دينار عراقي</strong>
              </div>

              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '10px' }}>
                شكراً لتعاملكم معنا. يعتبر هذا السند إشعاراً رسمياً بالقبض.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1, borderRadius: '10px' }}>
                <Printer size={15} />
                <span>طباعة السند فوري</span>
              </button>
              <button onClick={() => setShowVoucherModal(false)} className="btn-secondary" style={{ borderRadius: '10px' }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري التحميل...</div>}>
      <PatientsContent />
    </Suspense>
  );
}
