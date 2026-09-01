'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef, Suspense, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { apiRequest } from '../lib/api';
import { useToast } from '../components/Toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Test, Patient, Doctor, Sample } from '../types';
import {
  FlaskConical,
  User,
  Phone,
  Calendar,
  Search,
  CheckCircle2,
  DollarSign,
  Printer,
  Sparkles,
  FileText,
  X,
  Check,
  Zap,
  Activity,
  Droplets,
  Heart,
  Shield,
  TestTube,
  GripVertical,
  Mail,
  ArrowRight,
  Stethoscope,
  Microscope,
  Dna,
  Layers,
  AlertTriangle,
  RotateCcw,
  Percent,
  Keyboard,
  CreditCard,
  Banknote,
  Plus
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

// English Clinical Category Mapping
const CLINICAL_CATEGORIES = [
  { id: 'ALL', label: 'ALL TESTS (كل الفحوصات)' },
  { id: 'HEMATOLOGY', label: 'HEMATOLOGY (أمراض الدم)', dbKeywords: ['دم', 'تخثر', 'hematology'] },
  { id: 'CHEMISTRY', label: 'CHEMISTRY (الكيمياء السريرية)', dbKeywords: ['كيمياء', 'سكري', 'كبد', 'كلى', 'دهون', 'قلب', 'chemistry'] },
  { id: 'HORMONES', label: 'HORMONES (الهرمونات والغدد)', dbKeywords: ['هرمون', 'غدة', 'درقية', 'hormone'] },
  { id: 'IMMUNOLOGY', label: 'IMMUNOLOGY (المناعة والأمصال)', dbKeywords: ['مناعة', 'أمصال', 'مصول', 'immunology', 'serology'] },
  { id: 'URINE_STOOL', label: 'G.U.E & G.S.E (إدرار وخروج)', dbKeywords: ['مجهري', 'إدرار', 'خروج', 'urine', 'stool'] },
  { id: 'VITAMINS_MARKERS', label: 'VITAMINS & MARKERS (فيتامينات وأورام)', dbKeywords: ['معادن', 'فيتامين', 'أورام', 'vitamin', 'tumor'] },
];

const QUICK_DISCOUNT_PERCENTAGES = [5, 10, 15, 20, 50, 100];

const INTAKE_DRAFT_KEY = 'labryo_intake_draft';

interface IntakeDraft {
  patientId?: string | null;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  patientGender: 'MALE' | 'FEMALE';
  selectedDoctorId: string;
  selectedTests: Test[];
  discountPercent: number;
  customDiscountAmount: number;
  paidAmount?: string;
  paymentMethod?: 'CASH' | 'DEBT' | 'CARD';
  sampleNotes: string;
  isUrgent?: boolean;
  savedAt: number;
}

function IntakeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Preview Modal
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('');

  // Reference Data
  const [tests, setTests] = useState<Test[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States - Patient
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [patientNotes, setPatientNotes] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // Patient Autocomplete & Rich History
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Patient | null>(null);

  // Form States - Sample & Tests
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [sampleNotes, setSampleNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DEBT' | 'CARD'>('CASH');

  // Filter States & Catalog Keyboard Navigation
  const [testSearch, setTestSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [highlightedTestIndex, setHighlightedTestIndex] = useState<number>(0);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [createdSample, setCreatedSample] = useState<any | null>(null);

  // Draft Persistence States
  const [savedDraft, setSavedDraft] = useState<IntakeDraft | null>(null);
  const isRestoringDraftRef = useRef(false);

  // DOM Refs for Keyboard Navigation & Validation Focus
  const patientNameInputRef = useRef<HTMLInputElement | null>(null);
  const patientAgeInputRef = useRef<HTMLInputElement | null>(null);
  const testSearchInputRef = useRef<HTMLInputElement | null>(null);
  const discountInputRef = useRef<HTMLInputElement | null>(null);
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  // Check for existing intake draft in localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(INTAKE_DRAFT_KEY);
      if (stored) {
        const parsed: IntakeDraft = JSON.parse(stored);
        if (parsed && (parsed.patientName?.trim() || (parsed.selectedTests && parsed.selectedTests.length > 0) || parsed.patientPhone?.trim() || parsed.sampleNotes?.trim())) {
          setSavedDraft(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to read intake draft from localStorage', err);
    }
  }, []);

  // 1. Load Tests, Panels, Doctors
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [testsRes, doctorsRes] = await Promise.all([
          apiRequest('/tests'),
          apiRequest('/doctors'),
        ]);
        setTests(testsRes?.tests || []);
        setPanels(testsRes?.panels || []);
        setDoctors(doctorsRes || []);

        const pid = searchParams.get('patientId');
        if (pid) {
          const p = await apiRequest(`/patients/${pid}`);
          if (p) {
            setPatientId(p.id);
            setPatientName(p.name);
            setPatientPhone(p.phone || '');
            setPatientAge(p.age ? String(p.age) : '');
            setPatientGender(p.gender || 'MALE');
            setSelectedPatientHistory(p);
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'فشل تحميل الكتالوج', 'خطأ');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [searchParams]);

  // 2. Autocomplete Search
  useEffect(() => {
    if (!patientSearchQuery.trim() || patientSearchQuery.length < 2) {
      setPatientSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiRequest(`/patients/search?q=${encodeURIComponent(patientSearchQuery)}`);
        setPatientSuggestions(res || []);
        setShowSuggestions(true);
      } catch (err) {}
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [patientSearchQuery]);

  const selectExistingPatient = (p: Patient) => {
    setPatientId(p.id);
    setPatientName(p.name);
    setPatientPhone(p.phone || '');
    setPatientAge(p.age ? String(p.age) : '');
    setPatientGender((p.gender as 'MALE' | 'FEMALE') || 'MALE');
    setSelectedPatientHistory(p);
    setPatientSearchQuery('');
    setShowSuggestions(false);
    toast.success(`تم استرجاع بيانات المريض: ${p.name}`);
  };

  const handleRepeatLastTests = (p: Patient) => {
    selectExistingPatient(p);
    if (p.lastTestIds && p.lastTestIds.length > 0) {
      const repeated = tests.filter(t => p.lastTestIds!.includes(t.id) || p.lastTestIds!.includes(t.code));
      if (repeated.length > 0) {
        setSelectedTests(repeated);
        toast.success(`تم تحديد ${repeated.length} فحوصات من آخر زيارة سابقة للمريض`);
      } else {
        toast.info('لم يتم العثور على فحوصات مطابقة في الكتالوج الحالي');
      }
    } else {
      toast.info('لا توجد فحوصات سابقة مسجلة لهذا المريض');
    }
  };

  const handleExecuteClearPatient = useCallback(() => {
    try {
      localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch (e) {}
    setSavedDraft(null);
    setPatientId(null);
    setPatientName('');
    setPatientPhone('');
    setPatientAge('');
    setPatientGender('MALE');
    setPatientNotes('');
    setSelectedDoctorId('');
    setSelectedPatientHistory(null);
    setSelectedTests([]);
    setDiscountPercent(0);
    setCustomDiscountAmount(0);
    setPaidAmount('');
    setIsUrgent(false);
    setSampleNotes('');
    setTimeout(() => {
      patientNameInputRef.current?.focus();
    }, 50);
  }, []);

  const handleClearPatient = useCallback(() => {
    if (patientName.trim() || selectedTests.length > 0) {
      setShowClearConfirm(true);
      return;
    }
    handleExecuteClearPatient();
  }, [patientName, selectedTests.length, handleExecuteClearPatient]);

  // Restore saved intake draft from localStorage
  const handleRestoreDraft = () => {
    if (!savedDraft) return;
    isRestoringDraftRef.current = true;
    if (savedDraft.patientId !== undefined) setPatientId(savedDraft.patientId);
    if (savedDraft.patientName) setPatientName(savedDraft.patientName);
    if (savedDraft.patientPhone) setPatientPhone(savedDraft.patientPhone);
    if (savedDraft.patientAge) setPatientAge(savedDraft.patientAge);
    if (savedDraft.patientGender) setPatientGender(savedDraft.patientGender);
    if (savedDraft.selectedDoctorId) setSelectedDoctorId(savedDraft.selectedDoctorId);
    if (savedDraft.selectedTests && Array.isArray(savedDraft.selectedTests)) setSelectedTests(savedDraft.selectedTests);
    if (typeof savedDraft.discountPercent === 'number') setDiscountPercent(savedDraft.discountPercent);
    if (typeof savedDraft.customDiscountAmount === 'number') setCustomDiscountAmount(savedDraft.customDiscountAmount);
    if (savedDraft.paidAmount !== undefined) setPaidAmount(savedDraft.paidAmount);
    if (savedDraft.paymentMethod) setPaymentMethod(savedDraft.paymentMethod);
    if (savedDraft.sampleNotes) setSampleNotes(savedDraft.sampleNotes);
    if (typeof savedDraft.isUrgent === 'boolean') setIsUrgent(savedDraft.isUrgent);

    setSavedDraft(null);
    toast.success('تمت استعادة بيانات المسودة بنجاح', 'استعادة المسودة');
  };

  // Discard saved intake draft from localStorage
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch (e) {}
    setSavedDraft(null);
    toast.info('تم تجاهل المسودة وحذفها');
  };

  // Auto-save intake draft debounced when form fields change (only if there is actual content)
  useEffect(() => {
    if (isRestoringDraftRef.current) {
      isRestoringDraftRef.current = false;
      return;
    }

    // Do not overwrite an existing pending draft banner before user decides
    if (savedDraft) {
      return;
    }

    const hasContent = Boolean(
      patientName.trim() ||
      patientPhone.trim() ||
      patientAge.trim() ||
      (selectedTests && selectedTests.length > 0) ||
      customDiscountAmount > 0 ||
      discountPercent > 0 ||
      (selectedDoctorId && selectedDoctorId.trim()) ||
      sampleNotes.trim()
    );

    if (!hasContent) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        const draft: IntakeDraft = {
          patientId,
          patientName,
          patientPhone,
          patientAge,
          patientGender,
          selectedDoctorId,
          selectedTests,
          discountPercent,
          customDiscountAmount,
          paidAmount,
          paymentMethod,
          sampleNotes,
          isUrgent,
          savedAt: Date.now(),
        };
        localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify(draft));
      } catch (err) {
        console.warn('Failed to auto-save intake draft:', err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    patientId,
    patientName,
    patientPhone,
    patientAge,
    patientGender,
    selectedDoctorId,
    selectedTests,
    discountPercent,
    customDiscountAmount,
    paidAmount,
    paymentMethod,
    sampleNotes,
    isUrgent,
    savedDraft,
  ]);

  const handleToggleTest = (test: Test) => {
    if (selectedTests.some((t) => t.id === test.id)) {
      setSelectedTests(selectedTests.filter((t) => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  // Financial Calculations
  const grossTotal = useMemo(() => {
    return selectedTests.reduce((acc, t) => acc + (t.price || 0), 0);
  }, [selectedTests]);

  const calculatedDiscount = useMemo(() => {
    if (customDiscountAmount > 0) return customDiscountAmount;
    if (discountPercent > 0) return Math.round((grossTotal * discountPercent) / 100);
    return 0;
  }, [grossTotal, discountPercent, customDiscountAmount]);

  const netTotal = useMemo(() => {
    const total = grossTotal - calculatedDiscount;
    return total > 0 ? total : 0;
  }, [grossTotal, calculatedDiscount]);

  // Selected Doctor & Live Commission Calculation
  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId) || null;
  }, [doctors, selectedDoctorId]);

  const doctorCommission = useMemo(() => {
    if (!selectedDoctor) return 0;
    const rate = selectedDoctor.commissionPercent || 0;
    return Math.round((netTotal * rate) / 100);
  }, [selectedDoctor, netTotal]);

  useEffect(() => {
    if (paymentMethod === 'CASH' || paymentMethod === 'CARD') {
      setPaidAmount(String(netTotal));
    } else if (paymentMethod === 'DEBT') {
      setPaidAmount('0');
    }
  }, [netTotal, paymentMethod]);

  const remainingBalance = useMemo(() => {
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, netTotal - paid);
  }, [netTotal, paidAmount]);

  // Filter Tests with English Category and Search
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      let matchCat = true;
      if (activeCategory !== 'ALL') {
        const catConfig = CLINICAL_CATEGORIES.find(c => c.id === activeCategory);
        if (catConfig && catConfig.dbKeywords) {
          const catLower = (t.category || '').toLowerCase();
          const nameLower = (t.name || '').toLowerCase();
          const codeLower = (t.code || '').toLowerCase();
          matchCat = catConfig.dbKeywords.some(kw => catLower.includes(kw) || nameLower.includes(kw) || codeLower.includes(kw));
        }
      }

      const matchSearch =
        !testSearch.trim() ||
        t.name?.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code?.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category?.toLowerCase().includes(testSearch.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [tests, activeCategory, testSearch]);

  // Count selected tests per clinical category
  const categorySelectedCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: selectedTests.length };
    CLINICAL_CATEGORIES.forEach((cat) => {
      if (cat.id === 'ALL') return;
      if (!cat.dbKeywords) {
        counts[cat.id] = 0;
        return;
      }
      const count = selectedTests.filter((t) => {
        const catLower = (t.category || '').toLowerCase();
        const nameLower = (t.name || '').toLowerCase();
        const codeLower = (t.code || '').toLowerCase();
        return cat.dbKeywords.some((kw) => catLower.includes(kw) || nameLower.includes(kw) || codeLower.includes(kw));
      }).length;
      counts[cat.id] = count;
    });
    return counts;
  }, [selectedTests]);

  // Discount Handlers
  const handleSelectDiscountPercent = (pct: number) => {
    if (pct === discountPercent) {
      setDiscountPercent(0);
      setCustomDiscountAmount(0);
    } else {
      setDiscountPercent(pct);
      setCustomDiscountAmount(Math.round((grossTotal * pct) / 100));
    }
  };

  const handleCustomDiscountChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setCustomDiscountAmount(val);
    if (grossTotal > 0) {
      setDiscountPercent(Math.round((val / grossTotal) * 100));
    } else {
      setDiscountPercent(0);
    }
  };

  // Submit Sample
  const handleRegisterSample = useCallback(async () => {
    if (!patientName.trim()) {
      toast.error('يرجى إدخال اسم المريض', 'بيانات ناقصة');
      patientNameInputRef.current?.focus();
      return;
    }
    if (patientName.trim().length > 80) {
      toast.error('اسم المريض طويل جداً (الحد الأقصى 80 حرف)', 'تنبيه');
      patientNameInputRef.current?.focus();
      return;
    }

    if (patientAge !== '' && patientAge !== null && patientAge !== undefined) {
      const ageNum = parseInt(patientAge, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        toast.error('يرجى إدخال عمر صحيح بين 0 و 150 سنة', 'بيانات غير صحيحة');
        patientAgeInputRef.current?.focus();
        return;
      }
    }

    if (selectedTests.length === 0) {
      toast.error('يرجى اختيار فحص مخبري واحد على الأقل', 'تنبيه');
      testSearchInputRef.current?.focus();
      return;
    }

    const numPaid = parseFloat(paidAmount) || 0;
    if (numPaid < 0) {
      toast.error('المبلغ المدفوع لا يمكن أن يكون سالباً', 'خطأ في المبلغ');
      return;
    }

    try {
      setSubmitting(true);
      const sanitizedPhone = patientPhone.trim().replace(/[^0-9+\-\s]/g, '') || undefined;
      const parsedAge = patientAge.trim() ? parseInt(patientAge, 10) : undefined;
      const payload = {
        patientId: patientId || undefined,
        name: patientName.trim(),
        patientName: patientName.trim(),
        phone: sanitizedPhone,
        patientPhone: sanitizedPhone,
        age: parsedAge,
        patientAge: parsedAge,
        gender: patientGender,
        patientGender,
        doctorId: selectedDoctorId || undefined,
        doctorCommission,
        testIds: selectedTests.map((t) => t.id),
        isUrgent,
        priceTotal: grossTotal,
        discount: calculatedDiscount,
        discountPercent,
        paidAmount: Math.max(0, numPaid),
        remainingAmount: remainingBalance,
        paymentMethod,
        notes: sampleNotes.trim() || undefined,
      };

      const result = await apiRequest('/samples', 'POST', payload);
      toast.success(`تم تسجيل العينة #${result.sampleNumber} بنجاح!`, 'تم الحفظ');
      
      // Clear draft on successful sample registration
      try {
        localStorage.removeItem(INTAKE_DRAFT_KEY);
      } catch (e) {}
      setSavedDraft(null);

      setCreatedSample(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل العينة', 'خطأ');
    } finally {
      setSubmitting(false);
    }
  }, [
    patientName,
    patientAge,
    selectedTests,
    patientId,
    patientPhone,
    patientGender,
    selectedDoctorId,
    doctorCommission,
    isUrgent,
    grossTotal,
    calculatedDiscount,
    discountPercent,
    paidAmount,
    remainingBalance,
    paymentMethod,
    sampleNotes,
    toast
  ]);

  // Global & Form Keyboard Navigation (F2, F8, F9, Ctrl+Enter, Arrow Catalog Nav)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F2: New Intake
      if (e.key === 'F2') {
        e.preventDefault();
        handleClearPatient();
        toast.info('تم بدء استلام مريض جديد (F2)');
        return;
      }

      // F8: Search Tests Catalog
      if (e.key === 'F8') {
        e.preventDefault();
        testSearchInputRef.current?.focus();
        testSearchInputRef.current?.select();
        toast.info('البحث في كتالوج الفحوصات (F8)');
        return;
      }

      // F9: Discount Focus
      if (e.key === 'F9') {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        toast.info('تحديد الخصم المالي (F9)');
        return;
      }

      // Ctrl+Enter or Cmd+Enter: Instant Submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRegisterSample();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleClearPatient, handleRegisterSample, toast]);

  // Arrow Key Navigation inside Test Catalog
  const handleCatalogKeyDown = (e: React.KeyboardEvent) => {
    if (filteredTests.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedTestIndex((prev) => (prev + 1) % filteredTests.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedTestIndex((prev) => (prev - 1 + filteredTests.length) % filteredTests.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentTest = filteredTests[highlightedTestIndex];
      if (currentTest) {
        handleToggleTest(currentTest);
        toast.info(`${selectedTests.some(t => t.id === currentTest.id) ? 'إزالة' : 'إضافة'}: ${currentTest.name}`);
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = (index + 1) % inputRefs.current.length;
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Helper for Iraqi Clinical Icons
  const getTestIcon = (name: string, code: string) => {
    const lower = (name + ' ' + code).toLowerCase();
    if (lower.includes('cbc') || lower.includes('blood') || lower.includes('hb') || lower.includes('esr') || lower.includes('pt')) return <Activity size={18} />;
    if (lower.includes('lipid') || lower.includes('chol') || lower.includes('tg') || lower.includes('fbs') || lower.includes('sugar') || lower.includes('glucose')) return <Droplets size={18} />;
    if (lower.includes('liver') || lower.includes('ast') || lower.includes('alt') || lower.includes('bili') || lower.includes('kft') || lower.includes('urea') || lower.includes('creat')) return <Heart size={18} />;
    if (lower.includes('urine') || lower.includes('gue') || lower.includes('stool') || lower.includes('gse')) return <TestTube size={18} />;
    if (lower.includes('tsh') || lower.includes('thyroid') || lower.includes('hormon') || lower.includes('hcg') || lower.includes('fsh') || lower.includes('lh')) return <FlaskConical size={18} />;
    return <Dna size={18} />;
  };

  const getEnglishCategoryTag = (cat: string) => {
    if (!cat) return 'GENERAL';
    if (cat.includes('دم') || cat.includes('تخثر')) return 'HEMATOLOGY';
    if (cat.includes('كيمياء') || cat.includes('سكري') || cat.includes('كبد') || cat.includes('كلى') || cat.includes('دهون')) return 'BIOCHEMISTRY';
    if (cat.includes('هرمون') || cat.includes('درقية')) return 'HORMONES';
    if (cat.includes('مناعة') || cat.includes('أمصال')) return 'IMMUNOLOGY';
    if (cat.includes('مجهري') || cat.includes('إدرار') || cat.includes('خروج')) return 'G.U.E / G.S.E';
    if (cat.includes('معادن') || cat.includes('فيتامين') || cat.includes('أورام')) return 'VITAMINS & MARKERS';
    return 'CLINICAL';
  };

  return (
    <AppShell>
      {/* 1. Header & Hotkey Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
            PATIENT RECEPTION & INTAKE (استقبال وتسجيل المرضى)
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
            LABRYO LIMS • HIGH-SPEED RECEPTION • {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Live Keyboard Hotkey Guide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 210, 211, 0.08)', border: '1px solid rgba(0, 210, 211, 0.25)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: 'var(--accent-cyan)' }}>
            <Keyboard size={13} />
            <span><kbd style={{ background: '#1c2436', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: 800 }}>F2</kbd> New Intake</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span><kbd style={{ background: '#1c2436', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: 800 }}>F8</kbd> Search Tests</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span><kbd style={{ background: '#1c2436', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: 800 }}>F9</kbd> Discount</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span><kbd style={{ background: '#1c2436', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: 800 }}>Ctrl+↵</kbd> Register</span>
          </div>

          <button
            type="button"
            onClick={handleClearPatient}
            className="btn-secondary"
            style={{ height: '32px', padding: '0 12px', fontSize: '11.5px', gap: '6px' }}
            title="ابدأ استلام مريض جديد (F2)"
          >
            <RotateCcw size={13} />
            <span>استلام جديد (F2)</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Grid (dir=ltr for high efficiency split view) */}
      <div className="reception-mockup-grid" style={{ direction: 'ltr' }}>
        
        {/* LEFT / MAIN WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* A. PATIENT INTAKE & AUTOCOMPLETE CARD */}
          <div className="glass-card" style={{ padding: '16px 18px' }}>
            {/* Draft Persistence Notification Bar */}
            {savedDraft && (
              <div
                style={{
                  background: 'linear-gradient(90deg, rgba(0, 210, 211, 0.12), rgba(14, 20, 32, 0.85))',
                  border: '1px solid rgba(0, 210, 211, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  boxShadow: '0 2px 10px rgba(0, 210, 211, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-main)' }}>
                  <span style={{ fontSize: '15px' }}>📋</span>
                  <span>
                    تم العثور على مسودة سابقة غير محفوظة للمريض ({savedDraft.patientName || 'بدون اسم'} - {savedDraft.selectedTests?.length || 0} فحوصات)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleRestoreDraft}
                    className="btn-cyan-primary"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      borderRadius: '5px',
                    }}
                  >
                    استعادة المسودة (Restore)
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: 'var(--accent-rose)',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    تجاهل (Discard)
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="var(--accent-cyan)" />
                <span className="input-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: 800 }}>
                  PATIENT INFORMATION (بيانات المريض)
                </span>
                {patientId && (
                  <span style={{ background: 'rgba(0, 210, 211, 0.15)', color: 'var(--accent-cyan)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    EXISTING PATIENT ({patientId})
                  </span>
                )}
              </div>

              {patientId && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                >
                  ✕ Clear / Switch Patient
                </button>
              )}
            </div>

            {/* Quick Autocomplete Search with Past Visits & Debt Preview */}
            {!patientId && (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="بحث سريع عن مريض سابق بالاسم أو رقم الهاتف أو المعرّف (Quick Patient Autocomplete)..."
                  className="input-control"
                  style={{ paddingLeft: '30px', fontSize: '12px', height: '34px', background: 'var(--bg-input-deep)' }}
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                />
                {showSuggestions && patientSuggestions.length > 0 && (
                  <div className="quick-search-dropdown" style={{ zIndex: 100 }}>
                    <div className="dropdown-header">سجلات المرضى المطابقة ({patientSuggestions.length}):</div>
                    {patientSuggestions.map((p) => (
                      <div
                        key={p.id}
                        className="dropdown-item"
                        style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 12px' }}
                        onClick={() => selectExistingPatient(p)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{p.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                              {p.phone || 'بدون هاتف'} • {p.age ? `${p.age} سنة` : ''} ({p.gender === 'FEMALE' ? 'أنثى' : 'ذكر'})
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge badge-received" style={{ fontSize: '10px' }}>
                              {p.visitCount || 0} زيارات
                            </span>
                            {((p.outstandingDebt || 0) > 0) && (
                              <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                🔴 دين: {p.outstandingDebt?.toLocaleString()} د.ع
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Historical abnormal flags preview */}
                        {p.abnormalFlags && p.abnormalFlags.length > 0 && (
                          <div style={{ fontSize: '10.5px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={11} />
                            <span>فحوصات غير طبيعية سابقة: {p.abnormalFlags.slice(0, 2).join(' | ')}</span>
                          </div>
                        )}
                        {/* Repeat Last Tests Button */}
                        {p.lastTestIds && p.lastTestIds.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRepeatLastTests(p);
                              }}
                              style={{
                                background: 'rgba(0, 210, 211, 0.15)',
                                border: '1px solid rgba(0, 210, 211, 0.3)',
                                color: 'var(--accent-cyan)',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                padding: '2px 8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <RotateCcw size={11} />
                              <span>إعادة نفس فحوصات الزيارة السابقة ({p.lastTestNames?.slice(0, 2).join(', ')}...)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Patient Alert Banner (if historical flags or debt exist) */}
            {selectedPatientHistory && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: 700 }}>
                    سجل المريض: <span style={{ color: 'var(--accent-cyan)' }}>{selectedPatientHistory.visitCount || selectedPatientHistory.samples?.length || 0} زيارة</span>
                  </span>
                  {((selectedPatientHistory.outstandingDebt || 0) > 0) && (
                    <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      ⚠️ متبقي ديون سابقة: {selectedPatientHistory.outstandingDebt?.toLocaleString()} د.ع
                    </span>
                  )}
                </div>

                {selectedPatientHistory.lastTestIds && selectedPatientHistory.lastTestIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRepeatLastTests(selectedPatientHistory)}
                    className="btn-secondary"
                    style={{ height: '26px', fontSize: '11px', padding: '0 8px', gap: '4px' }}
                  >
                    <RotateCcw size={11} />
                    <span>إعادة نفس الفحوصات السابقة</span>
                  </button>
                )}
              </div>
            )}

            {/* Patient Form Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr 1.1fr 1.3fr', gap: '8px', alignItems: 'flex-start' }}>
              <div>
                <label htmlFor="patient-name-input" className="input-label" style={{ fontSize: '10px' }}>Full Name (اسم المريض) *</label>
                <input
                  id="patient-name-input"
                  ref={(el) => {
                    patientNameInputRef.current = el;
                    inputRefs.current[0] = el;
                  }}
                  onKeyDown={(e) => handleInputKeyDown(e, 0)}
                  type="text"
                  maxLength={80}
                  placeholder="اسم المريض الثلاثي..."
                  className="input-control"
                  style={{ height: '36px', fontSize: '12.5px' }}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="patient-age-input" className="input-label" style={{ fontSize: '10px' }}>Age (العمر)</label>
                <input
                  id="patient-age-input"
                  ref={(el) => {
                    patientAgeInputRef.current = el;
                    inputRefs.current[1] = el;
                  }}
                  onKeyDown={(e) => handleInputKeyDown(e, 1)}
                  type="number"
                  min={0}
                  max={150}
                  maxLength={3}
                  placeholder="العمر"
                  className="input-control"
                  style={{ height: '36px', fontSize: '12.5px' }}
                  value={patientAge}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 3) {
                      setPatientAge(val);
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="patient-gender-select" className="input-label" style={{ fontSize: '10px' }}>Gender (الجنس)</label>
                <select
                  id="patient-gender-select"
                  ref={(el) => { inputRefs.current[2] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 2)}
                  className="select-control"
                  style={{ height: '36px', fontSize: '12px' }}
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                >
                  <option value="MALE">ذكر ♂</option>
                  <option value="FEMALE">أنثى ♀</option>
                </select>
              </div>

              <div>
                <label htmlFor="patient-phone-input" className="input-label" style={{ fontSize: '10px' }}>Phone (الهاتف)</label>
                <input
                  id="patient-phone-input"
                  ref={(el) => { inputRefs.current[3] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 3)}
                  type="text"
                  placeholder="0770..."
                  className="input-control"
                  style={{ height: '36px', fontSize: '12px' }}
                  value={patientPhone}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9+\-\s]/g, '');
                    setPatientPhone(sanitized);
                  }}
                />
              </div>

              <div>
                <label htmlFor="patient-doctor-select" className="input-label" style={{ fontSize: '10px' }}>Referring Doctor (الطبيب المحيل)</label>
                <select
                  id="patient-doctor-select"
                  ref={(el) => { inputRefs.current[4] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 4)}
                  className="select-control"
                  style={{ height: '36px', fontSize: '11.5px' }}
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">مباشر (بدون تحويل)</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      د. {d.name} ({d.commissionPercent || 0}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sample Notes / Clinical Instructions */}
            <div style={{ marginTop: '10px' }}>
              <label htmlFor="sample-notes-input" className="input-label" style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                Sample Notes / Clinical Instructions (ملاحظات العينة / التوجيهات السريرية)
              </label>
              <input
                id="sample-notes-input"
                type="text"
                placeholder="ملاحظات العينة أو التوجيهات السريرية (مثل: مريض صائم 12 ساعة، عينة دم شرياني، تدقيق إضافي...)"
                className="input-control"
                style={{ height: '34px', fontSize: '12px', background: 'var(--bg-input-deep)' }}
                value={sampleNotes}
                onChange={(e) => setSampleNotes(e.target.value)}
              />
            </div>
          </div>

          {/* B. TEST SELECTION CARD WITH HOTKEY SEARCH & ARROW NAVIGATION */}
          <div className="glass-card" style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FlaskConical size={15} color="var(--accent-cyan)" />
                <label htmlFor="test-search-input" className="input-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>
                  TEST SELECTION ({filteredTests.length} AVAILABLE)
                </label>
              </div>

              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="test-search-input"
                  ref={testSearchInputRef}
                  onKeyDown={handleCatalogKeyDown}
                  type="text"
                  placeholder="بحث سريع (F8) بالكود أو الاسم (CBC, TSH, Lipid)..."
                  className="input-control"
                  style={{ paddingLeft: '28px', fontSize: '12px', height: '32px', background: 'var(--bg-input-deep)' }}
                  value={testSearch}
                  onChange={(e) => {
                    setTestSearch(e.target.value);
                    setHighlightedTestIndex(0);
                  }}
                />
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-dim)', background: '#1c2436', padding: '1px 5px', borderRadius: '3px' }}>
                  F8
                </span>
              </div>
            </div>

            {/* English Clinical Category Filter Strip with Badge Counters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {CLINICAL_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const count = categorySelectedCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setHighlightedTestIndex(0);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '6px',
                      border: `1px solid ${isActive ? 'var(--accent-cyan)' : '#1e2638'}`,
                      background: isActive ? 'rgba(0, 210, 211, 0.15)' : 'var(--bg-input-deep)',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span
                        style={{
                          background: isActive ? 'var(--accent-cyan)' : 'rgba(0, 210, 211, 0.22)',
                          color: isActive ? '#000' : 'var(--accent-cyan)',
                          fontSize: '9.5px',
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: '8px',
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Test Cards Grid (Flexible height, no large gaps) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', minHeight: '360px', maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', paddingRight: '2px', alignContent: 'start' }}>
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  جاري تحميل كتالوج الفحوصات...
                </div>
              ) : filteredTests.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  لا توجد فحوصات مطابقة للبحث
                </div>
              ) : (
                filteredTests.map((t, idx) => {
                  const isSelected = selectedTests.some((st) => st.id === t.id);
                  const isHighlighted = highlightedTestIndex === idx;
                  const englishCat = getEnglishCategoryTag(t.category);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTest(t)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(0, 210, 211, 0.16)' : (isHighlighted ? 'rgba(255, 255, 255, 0.04)' : 'var(--bg-input-deep)'),
                        border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : (isHighlighted ? 'rgba(0, 210, 211, 0.5)' : '#1e2638')}`,
                        boxShadow: isSelected ? '0 0 12px rgba(0, 210, 211, 0.2)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                        minHeight: '70px',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {/* Top Row: Code Badge & English Category */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '5px',
                              background: isSelected ? 'var(--accent-cyan)' : 'rgba(0, 210, 211, 0.1)',
                              color: isSelected ? '#000' : 'var(--accent-cyan)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getTestIcon(t.name, t.code || '')}
                          </div>

                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 900,
                              color: isSelected ? 'var(--accent-cyan)' : '#fff',
                              background: isSelected ? 'rgba(0, 210, 211, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {t.code || t.name.split(' ')[0]}
                          </span>
                        </div>

                        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {englishCat}
                        </span>
                      </div>

                      {/* Middle & Bottom: Test Name & Price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                              display: 'block',
                              lineHeight: 1.25,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={t.name}
                          >
                            {t.name}
                          </span>
                        </div>

                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <strong style={{ fontSize: '12px', color: isSelected ? 'var(--accent-cyan)' : 'var(--accent-emerald)', fontWeight: 900 }}>
                            {t.price?.toLocaleString()} د.ع
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INTAKE SUMMARY & FINANCIALS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="glass-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="input-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: 800 }}>
                INTAKE & FINANCIAL SUMMARY (ملخص الفحص)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {selectedTests.length} فحص محدد
              </span>
            </div>

            {/* Selected Tests List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minHeight: '120px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
              {selectedTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: '11.5px' }}>
                  لم يتم اختيار أي فحص بعد. انقر على الفحوصات لإضافتها.
                </div>
              ) : (
                selectedTests.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 8px',
                      background: 'var(--bg-input-deep)',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{t.code || ''}</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{t.price?.toLocaleString()} د.ع</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTest(t)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Discount Section (Requirement R4) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="custom-discount-input" className="input-label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                  <Percent size={12} color="var(--accent-cyan)" />
                  <span>DISCOUNT (الخصم المالي - F9)</span>
                </label>
                {calculatedDiscount > 0 && (
                  <span style={{ fontSize: '10.5px', color: 'var(--accent-rose)', fontWeight: 800 }}>
                    - {calculatedDiscount.toLocaleString()} د.ع ({discountPercent}%)
                  </span>
                )}
              </div>

              {/* Quick % Discount Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '6px' }}>
                {QUICK_DISCOUNT_PERCENTAGES.map((pct) => {
                  const isSelected = discountPercent === pct && customDiscountAmount === Math.round((grossTotal * pct) / 100);
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSelectDiscountPercent(pct)}
                      style={{
                        padding: '3px 0',
                        fontSize: '10.5px',
                        fontWeight: isSelected ? 900 : 700,
                        borderRadius: '4px',
                        border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        background: isSelected ? 'var(--accent-cyan)' : 'var(--bg-input-deep)',
                        color: isSelected ? '#000' : 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>

              {/* Custom IQD Discount Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  id="custom-discount-input"
                  ref={discountInputRef}
                  type="number"
                  min={0}
                  placeholder="خصم مخصص (IQD)..."
                  className="input-control"
                  style={{ height: '30px', fontSize: '11.5px', background: 'var(--bg-input-deep)' }}
                  value={customDiscountAmount || ''}
                  onChange={(e) => handleCustomDiscountChange(e.target.value)}
                />
                {customDiscountAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDiscountAmount(0);
                      setDiscountPercent(0);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>

            {/* Referring Doctor Commission Live Breakdown */}
            {selectedDoctor && (
              <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '6px', padding: '6px 10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                  عمولة د. {selectedDoctor.name} ({selectedDoctor.commissionPercent || 0}%):
                </span>
                <strong style={{ color: 'var(--text-main)', fontWeight: 900 }}>
                  {doctorCommission.toLocaleString()} د.ع
                </strong>
              </div>
            )}

            {/* Financial Totals */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span>المبلغ الإجمالي (Gross):</span>
                <span>{grossTotal.toLocaleString()} د.ع</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 900, color: 'var(--text-main)' }}>
                <span>الصافي المطلوب (Net Total):</span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '15px' }}>{netTotal.toLocaleString()} د.ع</span>
              </div>

              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '4px' }}>
                {(['CASH', 'DEBT', 'CARD'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '4px 0',
                      fontSize: '10.5px',
                      fontWeight: paymentMethod === method ? 900 : 600,
                      borderRadius: '4px',
                      border: `1px solid ${paymentMethod === method ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      background: paymentMethod === method ? 'rgba(0, 210, 211, 0.15)' : 'var(--bg-input-deep)',
                      color: paymentMethod === method ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {method === 'CASH' ? 'نقداً Cash' : method === 'DEBT' ? 'دين Debt' : 'بطاقة Card'}
                  </button>
                ))}
              </div>

              {/* Paid & Remaining Balance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                <div>
                  <label htmlFor="paid-amount-input" className="input-label" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                    المدفوع (Paid)
                  </label>
                  <input
                    id="paid-amount-input"
                    type="number"
                    min={0}
                    className="input-control"
                    style={{ height: '30px', fontSize: '11.5px', background: 'var(--bg-input-deep)' }}
                    value={paidAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!val.includes('-') && parseFloat(val) >= 0)) {
                        setPaidAmount(val);
                      }
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>المتبقي (Remaining)</span>
                  <div style={{ height: '30px', background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11.5px', fontWeight: 800, color: remainingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {remainingBalance.toLocaleString()} د.ع
                  </div>
                </div>
              </div>

              {/* Urgency Setting */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>أولوية التحليل (Urgency):</span>
                <select
                  className="select-control"
                  style={{ width: '110px', height: '28px', padding: '2px 6px', fontSize: '11px', background: isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-input-deep)', color: isUrgent ? 'var(--color-danger)' : 'inherit' }}
                  value={isUrgent ? 'URGENT' : 'ROUTINE'}
                  onChange={(e) => setIsUrgent(e.target.value === 'URGENT')}
                >
                  <option value="ROUTINE">عادي Routine</option>
                  <option value="URGENT">🚨 مستعجل STAT</option>
                </select>
              </div>
            </div>

            {/* Big Action Submit Button (Ctrl+Enter) */}
            <button
              type="button"
              onClick={handleRegisterSample}
              disabled={submitting || selectedTests.length === 0 || !patientName.trim()}
              className="btn-cyan-primary"
              style={{ width: '100%', height: '42px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 'auto' }}
            >
              <span>{submitting ? 'جاري التسجيل...' : 'تسجيل العينة وطباعة الباركود (Ctrl+Enter) →'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* SUCCESS MODAL WITH DIRECT PRINT & WORKSTATION ACTIONS */}
      {showSuccessModal && createdSample && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(0, 210, 211, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                تم تسجيل العينة #{createdSample.sampleNumber} بنجاح!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                المريض: <strong style={{ color: 'var(--text-main)' }}>{createdSample.patient?.name}</strong> • الصافي: {createdSample.priceTotal - (createdSample.discount || 0)} د.ع
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. Print Tube Barcode Label 50x25mm (Primary Cyan Button) */}
              <button
                type="button"
                onClick={() => {
                  setDocPreviewUrl(`/api/samples/${createdSample.id}/barcode`);
                  setDocPreviewTitle(`طباعة ملصق الباركود (50x25mm) - عينة #${createdSample.sampleNumber}`);
                }}
                className="btn-cyan-primary"
                style={{ width: '100%', justifyContent: 'center', height: '42px', fontSize: '13px', fontWeight: 800 }}
              >
                <Printer size={16} />
                <span>🏷️ طباعة ملصق أنبوب التحليل (Print Barcode Label 50x25mm)</span>
              </button>

              {/* 2. + New Patient Intake / استلام عينة جديدة (F2) (Secondary prominent button) */}
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleExecuteClearPatient();
                  toast.info('تم بدء استلام مريض جديد (F2)');
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: '40px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  borderColor: 'rgba(0, 210, 211, 0.4)',
                  background: 'rgba(0, 210, 211, 0.08)',
                }}
              >
                <Plus size={16} />
                <span>+ استلام عينة جديدة لمريض آخر (New Patient Intake - F2)</span>
              </button>

              {/* 3. Go to Results Workstation / إدخال النتائج */}
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/results?sampleId=${createdSample.id}`);
                }}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', height: '40px', fontSize: '12.5px' }}
              >
                <Activity size={15} color="var(--accent-cyan)" />
                <span>الانتقال لمحطة إدخال النتائج (Go to Results Workstation) →</span>
              </button>

              {/* 4. Preview A4 Report (secondary outline) */}
              <button
                type="button"
                onClick={() => {
                  setDocPreviewUrl(`/api/samples/${createdSample.id}/print`);
                  setDocPreviewTitle(`معاينة التقرير الطبي A4 - #${createdSample.sampleNumber}`);
                }}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: '36px',
                  fontSize: '12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={14} />
                <span>معاينة استمارة التقرير الطبي (Preview A4 Report)</span>
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
                  <span>طباعة (Print)</span>
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

      {/* CLEAR PATIENT CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="بدء مريض جديد وتفريغ البيانات (F2)"
        message="هناك بيانات مريض أو فحوصات محددة مسجلة على الشاشة. هل أنت متأكد من تفريغ الشاشة والبدء من جديد؟"
        type="warning"
        confirmText="نعم، تفريغ الشاشة"
        cancelText="متابعة العمل الحالي"
        onConfirm={() => {
          setShowClearConfirm(false);
          handleExecuteClearPatient();
          toast.info('تم تفريغ الحقول واستلام مريض جديد (F2)');
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

    </AppShell>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل شاشة الاستقبال...</div>}>
      <IntakeContent />
    </Suspense>
  );
}
