'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef, Suspense, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { apiRequest } from '../lib/api';
import { useToast } from '../components/Toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Test, Patient, Doctor, Sample } from '../types';
import { FlaskConical, User, Phone, Calendar, Search, CheckCircle2, DollarSign, Printer, Sparkles, FileText, X, Check, Zap, Activity, Droplets, Heart, Shield, TestTube, GripVertical, Mail, ArrowRight, Stethoscope, Microscope, Dna, Layers, AlertTriangle, RotateCcw, Percent, Keyboard, CreditCard, Banknote, Plus, AlertOctagon, CircleAlert, Barcode, ClipboardList } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { toEnglishDigits, formatEnglishDate } from '../lib/formatters';
import { catalogCache } from '../lib/catalogCache';

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

  // Reference Data (Pre-hydrated from instant cache: 0ms load)
  const [tests, setTests] = useState<Test[]>(() => (catalogCache.getTests() as unknown as Test[]) || []);
  const [panels, setPanels] = useState<any[]>(() => catalogCache.getPanels() || []);
  const [doctors, setDoctors] = useState<Doctor[]>(() => (catalogCache.getDoctors() as unknown as Doctor[]) || []);
  const [loading, setLoading] = useState(false);

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
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState<number>(-1);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Patient | null>(null);

  // Typeahead Autocomplete directly on patientName Input
  const [nameSuggestions, setNameSuggestions] = useState<Patient[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [highlightedNameIndex, setHighlightedNameIndex] = useState<number>(-1);
  const nameSuggestionsRef = useRef<HTMLDivElement | null>(null);

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

  // Submission State & Duplicate Protection
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const lastSubmissionRef = useRef<{
    patientName: string;
    testIds: string;
    timestamp: number;
    sampleNumber: number | string;
  } | null>(null);

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

  // Arabic normalizer for similarity matching
  const cleanArabic = (text: string) => {
    if (!text) return '';
    return text
      .replace(/[أإآء]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .toLowerCase()
      .trim();
  };

  // Initial Autofocus on Patient Name field
  useEffect(() => {
    const timer = setTimeout(() => {
      patientNameInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  // 1. Instant Cache-First with Background Refresh (0ms UI latency)
  useEffect(() => {
    let unmounted = false;
    const loadInitialData = async () => {
      try {
        const refreshed = await catalogCache.refresh();
        if (!unmounted && refreshed) {
          if (refreshed.tests.length > 0) setTests(refreshed.tests as unknown as Test[]);
          if (refreshed.panels.length > 0) setPanels(refreshed.panels);
          if (refreshed.doctors.length > 0) setDoctors(refreshed.doctors as unknown as Doctor[]);
        }

        const pid = searchParams.get('patientId');
        if (pid && !unmounted) {
          const p = await apiRequest(`/patients/${pid}`);
          if (p && !unmounted) {
            setPatientId(p.id);
            setPatientName(p.name);
            setPatientPhone(p.phone || '');
            setPatientAge(p.age ? String(p.age) : '');
            setPatientGender(p.gender || 'MALE');
            setSelectedPatientHistory(p);
          }
        }
      } catch (err: any) {
        console.warn('[Intake] Background catalog sync error:', err?.message);
      }
    };
    loadInitialData();
    return () => { unmounted = true; };
  }, [searchParams]);

  // 2. Autocomplete Search
  useEffect(() => {
    if (!patientSearchQuery.trim() || patientSearchQuery.length < 2) {
      setPatientSuggestions([]);
      setShowSuggestions(false);
      setHighlightedSuggestionIndex(-1);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiRequest(`/patients/search?q=${encodeURIComponent(patientSearchQuery)}`);
        setPatientSuggestions(res || []);
        setShowSuggestions(true);
        setHighlightedSuggestionIndex(-1);
      } catch (err) {}
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [patientSearchQuery]);

  // Typeahead Autocomplete directly on patientName input
  useEffect(() => {
    const trimmed = patientName.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      setHighlightedNameIndex(-1);
      return;
    }
    // If the patientName matches the already-selected patient, do not show suggestions
    if (selectedPatientHistory && cleanArabic(selectedPatientHistory.name) === cleanArabic(trimmed)) {
      setShowNameSuggestions(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiRequest(`/patients/search?q=${encodeURIComponent(trimmed)}`);
        if (res && res.length > 0) {
          const normQ = cleanArabic(trimmed);
          // Strict similar-name filtering only
          const strictlySimilar = res.filter((p: Patient) => {
            const pNorm = cleanArabic(p.name || '');
            const rawLower = (p.name || '').toLowerCase();
            return pNorm.includes(normQ) || rawLower.includes(trimmed.toLowerCase());
          });

          if (strictlySimilar.length > 0) {
            setNameSuggestions(strictlySimilar);
            setShowNameSuggestions(true);
            setHighlightedNameIndex(-1);
          } else {
            setNameSuggestions([]);
            setShowNameSuggestions(false);
          }
        } else {
          setNameSuggestions([]);
          setShowNameSuggestions(false);
        }
      } catch (err) {}
    }, 180);
    return () => clearTimeout(delayDebounce);
  }, [patientName, selectedPatientHistory]);

  // Dismiss suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        nameSuggestionsRef.current &&
        !nameSuggestionsRef.current.contains(e.target as Node) &&
        patientNameInputRef.current &&
        !patientNameInputRef.current.contains(e.target as Node)
      ) {
        setShowNameSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectExistingPatient = (p: Patient) => {
    setPatientId(p.id);
    setPatientName(p.name);
    setPatientPhone(p.phone || '');
    setPatientAge(p.age ? String(p.age) : '');
    setPatientGender((p.gender as 'MALE' | 'FEMALE') || 'MALE');
    setSelectedPatientHistory(p);
    setPatientSearchQuery('');
    setShowSuggestions(false);
    setHighlightedSuggestionIndex(-1);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
    setHighlightedNameIndex(-1);
    toast.success(`تم استرجاع بيانات المريض: ${p.name}`);
  };

  const handleSelectPatient = (p: Patient) => {
    selectExistingPatient(p);
    setShowSuggestions(false);
    setHighlightedSuggestionIndex(-1);
    setTimeout(() => {
      testSearchInputRef.current?.focus();
      testSearchInputRef.current?.select();
    }, 50);
  };

  const handlePatientSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || patientSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputRefs.current[0]?.focus();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestionIndex((prev) => (prev + 1) % patientSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestionIndex((prev) => (prev - 1 + patientSuggestions.length) % patientSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedSuggestionIndex >= 0 && patientSuggestions[highlightedSuggestionIndex]) {
        handleSelectPatient(patientSuggestions[highlightedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedSuggestionIndex(-1);
    }
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

  const handlePatientNameChange = (val: string) => {
    setPatientName(val);
    if (selectedPatientHistory && selectedPatientHistory.name !== val.trim()) {
      setPatientId(null);
      setSelectedPatientHistory(null);
    }
  };

  const handlePatientNameKeyDown = (e: React.KeyboardEvent) => {
    if (showNameSuggestions && nameSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedNameIndex((prev) => (prev + 1) % nameSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedNameIndex((prev) => (prev - 1 + nameSuggestions.length) % nameSuggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        if (highlightedNameIndex >= 0 && nameSuggestions[highlightedNameIndex]) {
          e.preventDefault();
          const chosen = nameSuggestions[highlightedNameIndex];
          selectExistingPatient(chosen);
          setTimeout(() => {
            patientAgeInputRef.current?.focus();
            patientAgeInputRef.current?.select();
          }, 50);
          return;
        }
        setShowNameSuggestions(false);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowNameSuggestions(false);
        setHighlightedNameIndex(-1);
        return;
      }
    }
    // Default seamless enter chain behavior to field 1 (Age)
    handleInputKeyDown(e, 0);
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
    const clean = toEnglishDigits(valStr);
    const val = parseFloat(clean) || 0;
    setCustomDiscountAmount(val);
    if (grossTotal > 0) {
      setDiscountPercent(Math.round((val / grossTotal) * 100));
    } else {
      setDiscountPercent(0);
    }
  };

  // Submit Sample
  const handleRegisterSample = useCallback(async () => {
    // Immediate lock against rapid multi-clicking
    if (isSubmittingRef.current || submitting) {
      return;
    }

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

    // Duplicate Check: Protection against registering the same patient with same tests within 3 minutes
    const currentTestsKey = selectedTests.map((t) => t.id).sort().join(',');
    const normCurrentName = cleanArabic(patientName.trim());
    if (lastSubmissionRef.current) {
      const timeDiff = Date.now() - lastSubmissionRef.current.timestamp;
      const isSameName = cleanArabic(lastSubmissionRef.current.patientName) === normCurrentName;
      const isSameTests = lastSubmissionRef.current.testIds === currentTestsKey;

      if (timeDiff < 180000 && isSameName && isSameTests) {
        const remainingSec = Math.ceil((180000 - timeDiff) / 1000);
        toast.warning(
          `تم تسجيل هذا المريض قبل قليل (عينة رقم #${lastSubmissionRef.current.sampleNumber}) بنفس الفحوصات. تم تفعيل نظام الحماية لمنع التكرار (انتظر ${remainingSec} ثانية أو اضغط F2 لاستلام مريض جديد).`,
          'حماية من التكرار'
        );
        return;
      }
    }

    try {
      isSubmittingRef.current = true;
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
      
      // Update last submission ref for duplicate protection
      lastSubmissionRef.current = {
        patientName: patientName.trim(),
        testIds: currentTestsKey,
        timestamp: Date.now(),
        sampleNumber: result.sampleNumber,
      };

      // Clear draft on successful sample registration
      try {
        localStorage.removeItem(INTAKE_DRAFT_KEY);
      } catch (e) {}
      setSavedDraft(null);

      setCreatedSample(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      if (err?.duplicate || err?.message?.includes('الحماية') || err?.message?.includes('تكرار')) {
        toast.warning(err.message || 'تم منع تسجيل العينة لتطابقها مع عينة مسجلة للتو', 'حماية من التكرار');
      } else {
        toast.error(err.message || 'فشل تسجيل العينة', 'خطأ');
      }
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
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
    toast,
    submitting
  ]);

  // Global & Form Keyboard Navigation (F2, F8, F9, Ctrl+Enter, Arrow Catalog Nav, Modal Shortcuts)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Zero-Click Barcode & Quick Reset within Success Modal
      if (showSuccessModal && createdSample) {
        if (e.key === 'Enter' || e.key === 'F9') {
          e.preventDefault();
          setDocPreviewUrl(`/api/samples/${createdSample.id}/barcode`);
          setDocPreviewTitle(`طباعة ملصقات الباركود للأنابيب والتحاليل (50x25mm) - عينة #${createdSample.sampleNumber}`);
          return;
        }
        if (e.key === 'Escape' || e.key === 'F2') {
          e.preventDefault();
          setShowSuccessModal(false);
          handleExecuteClearPatient();
          toast.info('تم بدء استلام مريض جديد (F2)');
          return;
        }
      }

      // 2. Escape closes document preview modal
      if (docPreviewUrl && e.key === 'Escape') {
        e.preventDefault();
        setDocPreviewUrl(null);
        return;
      }

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
  }, [handleClearPatient, handleRegisterSample, showSuccessModal, createdSample, docPreviewUrl, handleExecuteClearPatient, toast]);

  // Arrow Key Navigation inside Test Catalog & Seamless Enter Chain
  const handleCatalogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      if (filteredTests.length > 0) {
        e.preventDefault();
        setHighlightedTestIndex((prev) => (prev + 1) % filteredTests.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (filteredTests.length > 0) {
        e.preventDefault();
        setHighlightedTestIndex((prev) => (prev - 1 + filteredTests.length) % filteredTests.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (testSearch.trim() && filteredTests.length > 0) {
        const currentTest = filteredTests[highlightedTestIndex] || filteredTests[0];
        if (currentTest) {
          handleToggleTest(currentTest);
          toast.info(`${selectedTests.some(t => t.id === currentTest.id) ? 'إزالة' : 'إضافة'}: ${currentTest.name}`);
        }
      } else {
        // Seamless Enter chain to custom discount input (index 7)
        inputRefs.current[7]?.focus();
        if (inputRefs.current[7] && 'select' in (inputRefs.current[7] as any)) {
          (inputRefs.current[7] as any)?.select?.();
        }
      }
    }
  };

  // Seamless Enter Chain across all form fields (0 -> 8 -> Register)
  const handleInputKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === 8) {
        // Final field (Paid Amount) submits and registers sample
        handleRegisterSample();
      } else {
        const nextIndex = index + 1;
        if (inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex]?.focus();
          if ('select' in (inputRefs.current[nextIndex] as any)) {
            (inputRefs.current[nextIndex] as any)?.select?.();
          }
        }
      }
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

  // Smart Diagnostic Bundles for rapid 1-click intake
  const SMART_BUNDLES = [
    {
      id: 'comprehensive',
      name: 'الفحص الشامل',
      desc: 'صورة الدم، وظائف الكبد والكلى، الدهون، السكر',
      keywords: ['cbc', 'lipid', 'chol', 'ast', 'alt', 'urea', 'creat', 'fbs']
    },
    {
      id: 'diabetes',
      name: 'فحص السكري',
      desc: 'السكر الصائم والتراكمي والإدرار',
      keywords: ['fbs', 'sugar', 'glucose', 'hba1c', 'gue', 'urine']
    },
    {
      id: 'anemia',
      name: 'فقر الدم والحديد',
      desc: 'صورة الدم ومخزون الحديد',
      keywords: ['cbc', 'ferritin', 'iron', 'fer', 'hb']
    },
    {
      id: 'pre_op',
      name: 'ما قبل العمليات',
      desc: 'CBC، التخثر PT/INR، فصيلة الدم',
      keywords: ['cbc', 'pt', 'inr', 'ptt', 'bg', 'blood group']
    },
    {
      id: 'thyroid',
      name: 'الغدة الدرقية',
      desc: 'TSH، FT3، FT4',
      keywords: ['tsh', 'ft3', 'ft4', 'thyroid']
    }
  ];

  const handleApplyBundle = (bundle: typeof SMART_BUNDLES[0]) => {
    const matchingTests = tests.filter(t => {
      const text = ((t.name || '') + ' ' + (t.code || '')).toLowerCase();
      return bundle.keywords.some(kw => text.includes(kw));
    });
    if (matchingTests.length > 0) {
      setSelectedTests(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const toAdd = matchingTests.filter(m => !existingIds.has(m.id));
        if (toAdd.length === 0) {
          toast.info(`فحوصات ${bundle.name} مضافة بالفعل`);
          return prev;
        }
        toast.success(`تمت إضافة فحوصات ${bundle.name} (${toAdd.length} فحص)`);
        return [...prev, ...toAdd];
      });
    } else {
      toast.info('لم يتم العثور على فحوصات مطابقة لهذه الباقة في الكتالوج');
    }
  };

  // Sample Collection Tubes breakdown calculated live from selected tests
  const sampleContainers = useMemo(() => {
    const list: { id: string; name: string; color: string; bg: string; dotColor: string }[] = [];
    let hasEdta = false;
    let hasSerum = false;
    let hasCitrate = false;
    let hasUrine = false;

    selectedTests.forEach(t => {
      const text = ((t.name || '') + ' ' + (t.code || '') + ' ' + (t.category || '')).toLowerCase();
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

    if (hasEdta) list.push({ id: 'edta', name: 'EDTA (بنفسجي)', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', dotColor: '#9333ea' });
    if (hasSerum) list.push({ id: 'serum', name: 'Serum/Gel (أصفر)', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', dotColor: '#ca8a04' });
    if (hasCitrate) list.push({ id: 'citrate', name: 'Citrate (أزرق)', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', dotColor: '#0284c7' });
    if (hasUrine) list.push({ id: 'urine', name: 'عبوة فحص (إدرار/خروج)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', dotColor: '#059669' });

    return list;
  }, [selectedTests]);

  return (
    <AppShell>
      {/* 1. Header & Quick Actions Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '21px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.5px', margin: 0 }}>
              استقبال وتسجيل المرضى
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--accent-cyan-subtle)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              PATIENT INTAKE
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '3px' }}>
            منظومة الاستقبال السريع الذكية • {new Date().toLocaleDateString('ar-IQ-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Live Keyboard Shortcuts Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '6px 12px', fontSize: '11.5px', color: 'var(--text-muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <Keyboard size={14} color="var(--accent-cyan)" />
            <span><kbd style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 800 }}>F2</kbd> جديد</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span><kbd style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 800 }}>F8</kbd> بحث الكتالوج</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span><kbd style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 800 }}>F9</kbd> الخصم</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span><kbd style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 800 }}>Ctrl+↵</kbd> حفظ وطباعة</span>
          </div>

          <button
            type="button"
            onClick={handleClearPatient}
            className="btn-secondary"
            style={{ height: '36px', padding: '0 14px', fontSize: '12px', fontWeight: 800, gap: '6px', borderRadius: '10px' }}
            title="ابدأ استلام مريض جديد (F2)"
          >
            <RotateCcw size={14} />
            <span>استلام جديد (F2)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN GUIDED SPLIT FLOW CONTAINER (OPTION 3) */}
      <div className="intake-guided-container">

        {/* ========================================================================= */}
        {/* ZONE 1: TOP HORIZONTAL PATIENT INTAKE BAR (شريط بيانات واستقبال المريض الأفقي) */}
        {/* ========================================================================= */}
        <div className="patient-bar-card">

          {/* Draft Persistence Banner (if available) */}
          {savedDraft && (
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.08), var(--bg-card-subtle))',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '10px',
                padding: '8px 14px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-main)' }}>
                <ClipboardList size={16} color="var(--accent-cyan)" />
                <span>
                  تم العثور على مسودة سابقة غير محفوظة: <strong style={{ color: 'var(--accent-cyan)' }}>{savedDraft.patientName || 'مريض بدون اسم'}</strong> ({savedDraft.selectedTests?.length || 0} فحوصات محددة)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="btn-cyan-primary"
                  style={{ height: '28px', padding: '0 12px', fontSize: '11.5px', fontWeight: 800, borderRadius: '6px' }}
                >
                  استعادة المسودة
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--accent-rose)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  تجاهل
                </button>
              </div>
            </div>
          )}

          {/* Top Bar Header Row: Title & Quick Patient Autocomplete Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-cyan-subtle)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>1. بيانات واستقبال المريض</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '8px' }}>
                  {patientId ? `(مريض مسجل سابقاً ✓ ID: ${patientId})` : '(أدخل الاسم للبحث الفوري أو التسجيل الجديد)'}
                </span>
              </div>
            </div>

            {/* Quick Autocomplete Search Input for Existing Patients */}
            {!patientId ? (
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="بحث سريع عن مريض سابق بالاسم أو الهاتف..."
                  className="input-control"
                  style={{ paddingRight: '34px', paddingLeft: '38px', fontSize: '12px', height: '34px', borderRadius: '8px', background: 'var(--bg-input-deep)' }}
                  value={patientSearchQuery}
                  onChange={(e) => {
                    setPatientSearchQuery(e.target.value);
                    setHighlightedSuggestionIndex(-1);
                  }}
                  onKeyDown={handlePatientSearchKeyDown}
                />
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px' }}>
                  F3
                </span>

                {/* Suggestions Dropdown */}
                {showSuggestions && patientSuggestions.length > 0 && (
                  <div className="quick-search-dropdown" style={{ zIndex: 120, width: '100%', top: '100%', marginTop: '4px' }}>
                    <div className="dropdown-header">سجلات المرضى المطابقة ({patientSuggestions.length}):</div>
                    {patientSuggestions.map((p, idx) => {
                      const isHighlighted = highlightedSuggestionIndex === idx;
                      return (
                        <div
                          key={p.id}
                          className="dropdown-item"
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            background: isHighlighted ? 'var(--accent-cyan-subtle)' : 'transparent',
                            borderRight: isHighlighted ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                          }}
                          onMouseEnter={() => setHighlightedSuggestionIndex(idx)}
                          onClick={() => handleSelectPatient(p)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: isHighlighted ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{p.name}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>
                                {p.phone || 'بلا هاتف'} • {p.age ? `${p.age} سنة` : ''} ({p.gender === 'FEMALE' ? 'أنثى' : 'ذكر'})
                              </span>
                            </div>
                            <span className="badge badge-received" style={{ fontSize: '10px' }}>
                              {p.visitCount || 0} زيارة
                            </span>
                          </div>
                          {((p.outstandingDebt || 0) > 0) && (
                            <div style={{ fontSize: '10.5px', color: 'var(--color-danger)', fontWeight: 800, marginTop: '2px' }}>
                              ديون سابقة: {p.outstandingDebt?.toLocaleString()} د.ع
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClearPatient}
                style={{ background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <X size={13} /> تبديل المريض / جديد
              </button>
            )}
          </div>

          {/* Historical Patient Alert Strip (if patient selected) */}
          {selectedPatientHistory && (
            <div style={{ marginBottom: '10px', padding: '6px 12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: 700 }}>
                  سجل الزيارات: <span style={{ color: 'var(--accent-cyan)' }}>{selectedPatientHistory.visitCount || 1} زيارة سابقة</span>
                </span>
                {((selectedPatientHistory.outstandingDebt || 0) > 0) && (
                  <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    <AlertTriangle size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                    متبقي ديون سابقة: {selectedPatientHistory.outstandingDebt?.toLocaleString()} د.ع
                  </span>
                )}
              </div>

              {selectedPatientHistory.lastTestIds && selectedPatientHistory.lastTestIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRepeatLastTests(selectedPatientHistory)}
                  className="btn-secondary"
                  style={{ height: '26px', fontSize: '11px', padding: '0 8px', gap: '4px', borderRadius: '6px' }}
                >
                  <RotateCcw size={12} />
                  <span>إعادة نفس فحوصات الزيارة السابقة</span>
                </button>
              )}
            </div>
          )}

          {/* Patient Form Grid Fields */}
          <div className="patient-horizontal-grid">

            {/* 1. Full Name Input with Typeahead Dropdown */}
            <div style={{ position: 'relative' }}>
              <label htmlFor="patient-name-input" className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                اسم المريض الثلاثي *
              </label>
              <input
                id="patient-name-input"
                ref={(el) => {
                  patientNameInputRef.current = el;
                  inputRefs.current[0] = el;
                }}
                onKeyDown={handlePatientNameKeyDown}
                type="text"
                maxLength={80}
                placeholder="أدخل اسم المريض..."
                className="input-control"
                style={{
                  height: '38px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderColor: patientId ? 'var(--accent-cyan)' : undefined,
                  borderRadius: '8px',
                }}
                value={patientName}
                onChange={(e) => handlePatientNameChange(e.target.value)}
                autoComplete="off"
                required
              />

              {/* Typeahead Suggestions */}
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div
                  ref={nameSuggestionsRef}
                  className="quick-search-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 130,
                    marginTop: '4px',
                    background: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}
                >
                  <div className="dropdown-header" style={{ padding: '6px 10px', fontSize: '10.5px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    مرضى مطابقون ({nameSuggestions.length}) - اضغط Enter للاختيار:
                  </div>
                  {nameSuggestions.map((p, idx) => {
                    const isHighlighted = highlightedNameIndex === idx;
                    return (
                      <div
                        key={p.id}
                        className="dropdown-item"
                        style={{
                          padding: '7px 10px',
                          cursor: 'pointer',
                          background: isHighlighted ? 'var(--accent-cyan-subtle)' : 'transparent',
                          borderRight: isHighlighted ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                        }}
                        onMouseEnter={() => setHighlightedNameIndex(idx)}
                        onClick={() => {
                          selectExistingPatient(p);
                          setTimeout(() => {
                            patientAgeInputRef.current?.focus();
                            patientAgeInputRef.current?.select();
                          }, 50);
                        }}
                      >
                        <strong style={{ fontSize: '12.5px', color: isHighlighted ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                          {p.name}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>
                          {p.phone || 'بلا هاتف'} • {p.age ? `${p.age} سنة` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Age Input */}
            <div>
              <label htmlFor="patient-age-input" className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                العمر (سنة)
              </label>
              <input
                id="patient-age-input"
                ref={(el) => {
                  patientAgeInputRef.current = el;
                  inputRefs.current[1] = el;
                }}
                onKeyDown={(e) => handleInputKeyDown(e, 1)}
                type="text"
                inputMode="numeric"
                maxLength={3}
                placeholder="العمر"
                className="input-control"
                style={{ height: '38px', fontSize: '13px', borderRadius: '8px' }}
                value={patientAge}
                onChange={(e) => {
                  const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                  if (val.length <= 3) {
                    setPatientAge(val);
                  }
                }}
              />
            </div>

            {/* 3. Gender Segmented Toggle */}
            <div>
              <label className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                الجنس
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '38px' }}>
                <button
                  type="button"
                  onClick={() => setPatientGender('MALE')}
                  style={{
                    borderRadius: '8px',
                    border: `1.5px solid ${patientGender === 'MALE' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    background: patientGender === 'MALE' ? 'var(--accent-cyan)' : 'var(--bg-input-deep)',
                    color: patientGender === 'MALE' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setPatientGender('FEMALE')}
                  style={{
                    borderRadius: '8px',
                    border: `1.5px solid ${patientGender === 'FEMALE' ? 'var(--accent-rose)' : 'var(--border-color)'}`,
                    background: patientGender === 'FEMALE' ? 'var(--accent-rose)' : 'var(--bg-input-deep)',
                    color: patientGender === 'FEMALE' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  أنثى
                </button>
              </div>
              {/* Keep hidden select for tab/ref continuity */}
              <select
                id="patient-gender-select"
                ref={(el) => { inputRefs.current[2] = el; }}
                onKeyDown={(e) => handleInputKeyDown(e, 2)}
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                style={{ display: 'none' }}
              >
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </div>

            {/* 4. Phone Input */}
            <div>
              <label htmlFor="patient-phone-input" className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                رقم الهاتف
              </label>
              <input
                id="patient-phone-input"
                ref={(el) => { inputRefs.current[3] = el; }}
                onKeyDown={(e) => handleInputKeyDown(e, 3)}
                type="text"
                placeholder="0770..."
                className="input-control"
                style={{ height: '38px', fontSize: '12.5px', borderRadius: '8px' }}
                value={patientPhone}
                onChange={(e) => {
                  const sanitized = toEnglishDigits(e.target.value).replace(/[^0-9+\-\s]/g, '');
                  setPatientPhone(sanitized);
                }}
              />
            </div>

            {/* 5. Referring Doctor Select */}
            <div>
              <label htmlFor="patient-doctor-select" className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                الطبيب المحيل
              </label>
              <select
                id="patient-doctor-select"
                ref={(el) => { inputRefs.current[4] = el; }}
                onKeyDown={(e) => handleInputKeyDown(e, 4)}
                className="select-control"
                style={{ height: '38px', fontSize: '12px', borderRadius: '8px' }}
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

            {/* 6. Urgency Setting */}
            <div>
              <label className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                أولوية التحليل
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '38px' }}>
                <button
                  type="button"
                  onClick={() => setIsUrgent(false)}
                  style={{
                    borderRadius: '8px',
                    border: `1.5px solid ${!isUrgent ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                    background: !isUrgent ? 'var(--accent-teal)' : 'var(--bg-input-deep)',
                    color: !isUrgent ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  عادي
                </button>
                <button
                  type="button"
                  onClick={() => setIsUrgent(true)}
                  style={{
                    borderRadius: '8px',
                    border: `1.5px solid ${isUrgent ? 'var(--color-danger)' : 'var(--border-color)'}`,
                    background: isUrgent ? 'var(--color-danger)' : 'var(--bg-input-deep)',
                    color: isUrgent ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  مستعجل STAT
                </button>
              </div>
            </div>

            {/* 7. Clinical Notes / Instructions */}
            <div>
              <label htmlFor="sample-notes-input" className="input-label" style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                ملاحظات سريرية
              </label>
              <input
                id="sample-notes-input"
                ref={(el) => { inputRefs.current[5] = el; }}
                onKeyDown={(e) => handleInputKeyDown(e, 5)}
                type="text"
                placeholder="صائم 12 ساعة، أدوية، حامل..."
                className="input-control"
                style={{ height: '38px', fontSize: '12px', borderRadius: '8px', background: 'var(--bg-input-deep)' }}
                value={sampleNotes}
                onChange={(e) => setSampleNotes(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* ZONE 2: LOWER SPLIT WORKSPACE (الكتالوج وباقات الفحص يميناً + التذكرة يساراً) */}
        {/* ========================================================================= */}
        <div className="intake-guided-split">

          {/* ----------------------------------------------------------------------- */}
          {/* WING A: DIAGNOSTIC TESTS & QUICK PACKAGES (كتالوج الفحوصات الطبية)       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="glass-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Catalog Header: Title + F8 Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={18} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                  2. كتالوج الفحوصات وباقات التحاليل
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'var(--accent-cyan-subtle)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  {filteredTests.length} فحص متاح
                </span>
              </div>

              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="test-search-input"
                  ref={(el) => {
                    testSearchInputRef.current = el;
                    inputRefs.current[6] = el;
                  }}
                  onKeyDown={handleCatalogKeyDown}
                  type="text"
                  placeholder="بحث سريع (F8) بالكود أو الاسم (CBC, TSH, Lipid)..."
                  className="input-control"
                  style={{ paddingRight: '34px', paddingLeft: '38px', fontSize: '12.5px', height: '36px', borderRadius: '8px', background: 'var(--bg-input-deep)' }}
                  value={testSearch}
                  onChange={(e) => {
                    setTestSearch(e.target.value);
                    setHighlightedTestIndex(0);
                  }}
                />
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '4px' }}>
                  F8
                </span>
              </div>
            </div>

            {/* Quick Diagnostic Bundles Strip (الباقات السريعة) */}
            <div style={{ background: 'var(--bg-input-deep)', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: 'var(--text-main)' }}>
                <Zap size={14} color="var(--accent-amber)" />
                <span>باقات سريعة:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {SMART_BUNDLES.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleApplyBundle(b)}
                    className="bundle-pill-btn"
                    title={b.desc}
                  >
                    <span>+ {b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Category Tabs Strip with Active Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '8px',
                      border: `1.5px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      background: isActive ? 'var(--accent-cyan-subtle)' : 'var(--bg-card)',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span
                        style={{
                          background: isActive ? 'var(--accent-cyan)' : 'rgba(37, 99, 235, 0.15)',
                          color: isActive ? '#ffffff' : 'var(--accent-cyan)',
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modern Test Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
                gap: '10px',
                minHeight: '380px',
                maxHeight: 'calc(100vh - 380px)',
                overflowY: 'auto',
                paddingRight: '2px',
                alignContent: 'start',
              }}
            >
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  جاري تحميل كتالوج الفحوصات...
                </div>
              ) : filteredTests.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  لا توجد فحوصات مطابقة للبحث
                </div>
              ) : (
                filteredTests.map((t, idx) => {
                  const isSelected = selectedTests.some((st) => st.id === t.id);
                  const isHighlighted = highlightedTestIndex === idx;
                  const englishCat = getEnglishCategoryTag(t.category);
                  const code = t.code || t.name.split(' ')[0] || 'TEST';

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTest(t)}
                      className={`test-card-modern ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-cyan)' : (isHighlighted ? 'var(--border-focus)' : undefined),
                      }}
                    >
                      {/* Top Row: Category Icon & Test Code & Category Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: isSelected ? 'var(--accent-cyan)' : 'var(--accent-cyan-subtle)',
                              color: isSelected ? '#ffffff' : 'var(--accent-cyan)',
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
                              fontSize: '11px',
                              fontWeight: 900,
                              color: isSelected ? '#ffffff' : 'var(--accent-cyan)',
                              background: isSelected ? 'var(--accent-cyan)' : 'var(--accent-cyan-subtle)',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {code}
                          </span>
                        </div>

                        <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {englishCat}
                        </span>
                      </div>

                      {/* Middle: Test Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            display: 'block',
                            lineHeight: 1.35,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={t.name}
                        >
                          {t.name}
                        </strong>
                      </div>

                      {/* Bottom Row: Price & Action Add Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                          {t.price?.toLocaleString()} د.ع
                        </strong>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: isSelected ? '#ffffff' : 'var(--accent-cyan)',
                            background: isSelected ? 'var(--accent-cyan)' : 'var(--accent-cyan-subtle)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check size={12} />
                              <span>محدد</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>إضافة</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* WING B: LIVE DIGITAL ORDER TICKET & BARCODE HUB (تذكرة الزيارة والباركود) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="digital-receipt-card">

            {/* Ticket Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                  3. تذكرة الفاتورة والباركود
                </strong>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 800, background: 'var(--accent-cyan-subtle)', padding: '2px 8px', borderRadius: '6px' }}>
                {selectedTests.length} فحص
              </span>
            </div>

            {/* Active Patient Summary Chip */}
            {patientName.trim() && (
              <div style={{ background: 'var(--bg-input-deep)', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px', fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {patientName} {patientAge ? `(${patientAge} سنة)` : ''}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {patientGender === 'FEMALE' ? 'أنثى' : 'ذكر'} {isUrgent ? '• مستعجل' : ''}
                </span>
              </div>
            )}

            {/* Selected Tests Scrollable List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '110px', maxHeight: '170px', overflowY: 'auto', marginBottom: '12px' }}>
              {selectedTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: '12px' }}>
                  لم يتم اختيار أي فحص بعد. انقر على الفحوصات أو الباقات لإضافتها.
                </div>
              ) : (
                selectedTests.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: 'var(--bg-input-deep)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{t.code || ''}</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <strong style={{ color: 'var(--text-main)', fontWeight: 800 }}>{t.price?.toLocaleString()} د.ع</strong>
                      <button
                        type="button"
                        onClick={() => handleToggleTest(t)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '2px' }}
                        title="إزالة الفحص"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Live Sample Tubes Requirement Badges */}
            {sampleContainers.length > 0 && (
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  الأنابيب المطلوبة لسحب العينة:
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {sampleContainers.map(c => (
                    <span
                      key={c.id}
                      className="tube-indicator-chip"
                      style={{ color: c.color, background: c.bg, borderColor: c.color }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dotColor }} />
                      <span>{c.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Discount Section (F9) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="custom-discount-input" className="input-label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                  <Percent size={12} color="var(--accent-cyan)" />
                  <span>الخصم المالي (F9)</span>
                </label>
                {calculatedDiscount > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 800 }}>
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
                        padding: '4px 0',
                        fontSize: '11px',
                        fontWeight: isSelected ? 900 : 700,
                        borderRadius: '6px',
                        border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        background: isSelected ? 'var(--accent-cyan)' : 'var(--bg-input-deep)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
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
                  ref={(el) => {
                    discountInputRef.current = el;
                    inputRefs.current[7] = el;
                  }}
                  onKeyDown={(e) => handleInputKeyDown(e, 7)}
                  type="number"
                  min={0}
                  placeholder="أدخل خصم مخصص (بالدينار)..."
                  className="input-control"
                  style={{ height: '32px', fontSize: '12px', borderRadius: '6px', background: 'var(--bg-input-deep)' }}
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
                    style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '11.5px', fontWeight: 800 }}
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>

            {/* Referring Doctor Commission Live Breakdown */}
            {selectedDoctor && (
              <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  عمولة د. {selectedDoctor.name} ({selectedDoctor.commissionPercent || 0}%):
                </span>
                <strong style={{ color: 'var(--text-main)', fontWeight: 900 }}>
                  {doctorCommission.toLocaleString()} د.ع
                </strong>
              </div>
            )}

            {/* Financial Totals & Payment Method */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>المجموع الإجمالي:</span>
                <span>{grossTotal.toLocaleString()} د.ع</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>
                <span>الصافي المطلوب:</span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '18px' }}>{netTotal.toLocaleString()} د.ع</span>
              </div>

              {/* Payment Method Segmented Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '2px' }}>
                {(['CASH', 'DEBT', 'CARD'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '6px 0',
                      fontSize: '11.5px',
                      fontWeight: paymentMethod === method ? 900 : 700,
                      borderRadius: '6px',
                      border: `1.5px solid ${paymentMethod === method ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      background: paymentMethod === method ? 'var(--accent-cyan-subtle)' : 'var(--bg-input-deep)',
                      color: paymentMethod === method ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {method === 'CASH' ? 'نقداً Cash' : method === 'DEBT' ? 'دين Debt' : 'بطاقة Card'}
                  </button>
                ))}
              </div>

              {/* Paid & Remaining Balance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                <div>
                  <label htmlFor="paid-amount-input" className="input-label" style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                    المدفوع
                  </label>
                  <input
                    id="paid-amount-input"
                    ref={(el) => { inputRefs.current[8] = el; }}
                    onKeyDown={(e) => handleInputKeyDown(e, 8)}
                    type="number"
                    min={0}
                    className="input-control"
                    style={{ height: '32px', fontSize: '12px', borderRadius: '6px', background: 'var(--bg-input-deep)' }}
                    value={paidAmount}
                    onChange={(e) => {
                      const clean = toEnglishDigits(e.target.value);
                      if (clean === '' || (!clean.includes('-') && parseFloat(clean) >= 0)) {
                        setPaidAmount(clean);
                      }
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>المتبقي</span>
                  <div style={{ height: '32px', background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '12px', fontWeight: 800, color: remainingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {remainingBalance.toLocaleString()} د.ع
                  </div>
                </div>
              </div>
            </div>

            {/* Big Action Submit Button (Ctrl+Enter) */}
            <button
              type="button"
              onClick={handleRegisterSample}
              disabled={submitting || selectedTests.length === 0 || !patientName.trim()}
              className="btn-cyan-primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '13.5px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Barcode size={18} />
              <span>{submitting ? 'جاري تسجيل العينة...' : 'تسجيل العينة وطباعة الباركود (Ctrl+Enter) →'}</span>
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
                المريض: <strong style={{ color: 'var(--text-main)' }}>{createdSample.patient?.name}</strong> • الصافي المطلوب: {createdSample.priceTotal} د.ع {createdSample.discount > 0 ? `(الخصم المطبّق: ${createdSample.discount} د.ع)` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. Print Tube Barcode Label 50x25mm (Primary Cyan Button - Enter or F9) */}
              <button
                type="button"
                onClick={() => {
                  setDocPreviewUrl(`/api/samples/${createdSample.id}/barcode`);
                  setDocPreviewTitle(`طباعة ملصقات الباركود للأنابيب والتحاليل (50x25mm) - عينة #${createdSample.sampleNumber}`);
                }}
                className="btn-cyan-primary"
                style={{ width: '100%', justifyContent: 'center', height: '42px', fontSize: '13px', fontWeight: 800 }}
              >
                <Printer size={16} />
                <span><Barcode size={14} /> طباعة ملصقات أنابيب التحليل (Print Tube Labels 50x25mm) <kbd style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginRight: '6px' }}>Enter / F9</kbd></span>
              </button>

              {/* 2. + New Patient Intake / استلام عينة جديدة (Escape or F2) (Secondary prominent button) */}
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
                <span>+ استلام عينة جديدة لمريض آخر (New Patient Intake) <kbd style={{ background: 'rgba(0, 210, 211, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginRight: '6px' }}>Esc / F2</kbd></span>
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
