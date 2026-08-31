'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import AppShell from '../components/AppShell';
import { apiRequest } from '../lib/api';
import { useToast } from '../components/Toast';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Layers
} from 'lucide-react';

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

function IntakeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Preview Modal
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('');

  // Reference Data
  const [tests, setTests] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States - Patient
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // Patient Autocomplete
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form States - Sample & Tests
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DEBT' | 'CARD'>('CASH');

  // Filter States
  const [testSearch, setTestSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSample, setCreatedSample] = useState<any | null>(null);

  // Refs for Shift / Enter Keyboard Navigation
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  const handleInputKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Shift' || e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = (index + 1) % inputRefs.current.length;
      inputRefs.current[nextIndex]?.focus();
    }
  };

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

  // 2. Autocomplete
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

  const selectExistingPatient = (p: any) => {
    setPatientId(p.id);
    setPatientName(p.name);
    setPatientPhone(p.phone || '');
    setPatientAge(p.age ? String(p.age) : '');
    setPatientGender(p.gender || 'MALE');
    setPatientSearchQuery('');
    setShowSuggestions(false);
    toast.success(`تم استرجاع بيانات المريض: ${p.name}`);
  };

  const handleClearPatient = () => {
    setPatientId(null);
    setPatientName('');
    setPatientPhone('');
    setPatientAge('');
    setPatientGender('MALE');
    setSelectedDoctorId('');
  };

  const handleToggleTest = (test: any) => {
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
    if (discountPercent > 0) return (grossTotal * discountPercent) / 100;
    return 0;
  }, [grossTotal, discountPercent, customDiscountAmount]);

  const netTotal = useMemo(() => {
    const total = grossTotal - calculatedDiscount;
    return total > 0 ? total : 0;
  }, [grossTotal, calculatedDiscount]);

  useEffect(() => {
    if (paymentMethod === 'CASH' || paymentMethod === 'CARD') {
      setPaidAmount(String(netTotal));
    } else if (paymentMethod === 'DEBT') {
      setPaidAmount('0');
    }
  }, [netTotal, paymentMethod]);

  // Filter Tests with English Category and Search
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Category Match
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

      // Search Match
      const matchSearch =
        !testSearch.trim() ||
        t.name?.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code?.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category?.toLowerCase().includes(testSearch.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [tests, activeCategory, testSearch]);

  const handleRegisterSample = async () => {
    if (!patientName.trim()) {
      toast.error('يرجى إدخال اسم المريض', 'بيانات ناقصة');
      return;
    }
    if (selectedTests.length === 0) {
      toast.error('يرجى اختيار فحص مخبري واحد على الأقل', 'تنبيه');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId: patientId || undefined,
        name: patientName.trim(),
        patientName: patientName.trim(),
        phone: patientPhone.trim() || undefined,
        patientPhone: patientPhone.trim() || undefined,
        age: patientAge ? parseInt(patientAge) : undefined,
        patientAge: patientAge ? parseInt(patientAge) : undefined,
        gender: patientGender,
        patientGender,
        doctorId: selectedDoctorId || undefined,
        testIds: selectedTests.map((t) => t.id),
        isUrgent,
        discount: calculatedDiscount,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMethod,
      };

      const result = await apiRequest('/samples', 'POST', payload);
      toast.success(`تم تسجيل العينة #${result.sampleNumber} بنجاح!`, 'تم الحفظ');
      setCreatedSample(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل العينة', 'خطأ');
    } finally {
      setSubmitting(false);
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

  // Get English Category Tag for each card
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
      {/* 1. Header (Mockup Style) */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            PATIENT RECEPTION
          </h1>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
            LABRYO LIMS | TEST INTAKE | {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          ⌨️ اضغط <kbd style={{ background: '#1c2436', padding: '2px 5px', borderRadius: '4px', color: 'var(--accent-cyan)' }}>Shift</kbd> للتنقل الفوري بين الحقول
        </div>
      </div>

      {/* 2. Main 2-Column Grid (dir=ltr ensures left-to-right alignment matching Image 1) */}
      <div className="reception-mockup-grid" style={{ direction: 'ltr' }}>
        
        {/* LEFT / MAIN WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* A. ADD NEW PATIENT CARD */}
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="input-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: 800 }}>
                ADD NEW PATIENT (بيانات المريض)
              </span>

              {patientId && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                >
                  ✕ Clear / New Patient
                </button>
              )}
            </div>

            {/* Quick Autocomplete Search */}
            {!patientId && (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Quick search existing patient by name or phone..."
                  className="input-control"
                  style={{ paddingLeft: '30px', fontSize: '12px', height: '34px', background: '#0e1420' }}
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                />
                {showSuggestions && patientSuggestions.length > 0 && (
                  <div className="quick-search-dropdown">
                    <div className="dropdown-header">MATCHING PATIENT RECORDS:</div>
                    {patientSuggestions.map((p) => (
                      <div key={p.id} className="dropdown-item" onClick={() => selectExistingPatient(p)}>
                        <strong style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>{p.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          {p.phone || 'No phone'} • {p.age ? `${p.age} yrs` : ''} ({p.gender})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Horizontal Patient Row with Doctor Field & Shift Navigation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1.6fr 0.7fr 0.7fr 1.1fr 1.2fr auto', gap: '8px', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-dim)', cursor: 'grab' }}>
                <GripVertical size={16} />
              </div>

              <div>
                <span className="input-label" style={{ fontSize: '10px' }}>Full Name *</span>
                <input
                  ref={(el) => { inputRefs.current[0] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 0)}
                  type="text"
                  placeholder="Patient Name"
                  className="input-control"
                  style={{ height: '36px', fontSize: '12.5px' }}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <span className="input-label" style={{ fontSize: '10px' }}>Age (Yrs)</span>
                <input
                  ref={(el) => { inputRefs.current[1] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 1)}
                  type="number"
                  placeholder="Age"
                  className="input-control"
                  style={{ height: '36px', fontSize: '12.5px' }}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                />
              </div>

              <div>
                <span className="input-label" style={{ fontSize: '10px' }}>Gender</span>
                <select
                  ref={(el) => { inputRefs.current[2] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 2)}
                  className="select-control"
                  style={{ height: '36px', fontSize: '12px' }}
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                >
                  <option value="MALE">M ♂</option>
                  <option value="FEMALE">F ♀</option>
                </select>
              </div>

              <div>
                <span className="input-label" style={{ fontSize: '10px' }}>Phone</span>
                <input
                  ref={(el) => { inputRefs.current[3] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 3)}
                  type="text"
                  placeholder="+964 770..."
                  className="input-control"
                  style={{ height: '36px', fontSize: '12px' }}
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <div>
                <span className="input-label" style={{ fontSize: '10px' }}>Doctor (الطبيب)</span>
                <select
                  ref={(el) => { inputRefs.current[4] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 4)}
                  className="select-control"
                  style={{ height: '36px', fontSize: '11.5px' }}
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">Direct (بدون تحويل)</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => toast.success('تم تثبيت بيانات المريض')}
                  className="btn-cyan-primary"
                  style={{ height: '36px', padding: '0 12px', fontSize: '11.5px', textTransform: 'uppercase' }}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>CONFIRM</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. TEST SELECTION CARD WITH ENGLISH CATEGORIES & IRAQI CODES */}
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span className="input-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: 800 }}>
                TEST SELECTION ({filteredTests.length} AVAILABLE)
              </span>

              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  ref={(el) => { inputRefs.current[5] = el; }}
                  onKeyDown={(e) => handleInputKeyDown(e, 5)}
                  type="text"
                  placeholder="Search code or test (CBC, TSH, Lipid)..."
                  className="input-control"
                  style={{ paddingLeft: '28px', fontSize: '12px', height: '32px', background: '#0e1420' }}
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                />
              </div>
            </div>

            {/* English Clinical Category Filter Strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {CLINICAL_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '6px',
                      border: `1px solid ${isActive ? 'var(--accent-cyan)' : '#1e2638'}`,
                      background: isActive ? 'rgba(0, 210, 211, 0.15)' : '#0e1420',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Test Cards Grid - Wide Cards, Zero Truncation, Iraqi Common Codes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading tests catalogue...
                </div>
              ) : filteredTests.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching tests found in this category
                </div>
              ) : (
                filteredTests.map((t) => {
                  const isSelected = selectedTests.some((st) => st.id === t.id);
                  const englishCat = getEnglishCategoryTag(t.category);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTest(t)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(0, 210, 211, 0.16)' : '#0e1420',
                        border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : '#1e2638'}`,
                        boxShadow: isSelected ? '0 0 14px rgba(0, 210, 211, 0.25)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                        minHeight: '76px',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {/* Top Row: Iraqi Common Code Badge & English Category */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
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

                          {/* Prominent Iraqi Lab Code Badge */}
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 900,
                              color: isSelected ? 'var(--accent-cyan)' : '#fff',
                              background: isSelected ? 'rgba(0, 210, 211, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {t.code || t.name.split(' ')[0]}
                          </span>
                        </div>

                        {/* English Category Tag */}
                        <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {englishCat}
                        </span>
                      </div>

                      {/* Middle & Bottom: Full Clinical Name (No Truncation) & Price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                              display: 'block',
                              lineHeight: 1.3,
                              wordBreak: 'break-word',
                            }}
                          >
                            {t.name}
                          </span>
                        </div>

                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <strong style={{ fontSize: '13px', color: isSelected ? 'var(--accent-cyan)' : 'var(--accent-emerald)', fontWeight: 900 }}>
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

        {/* RIGHT COLUMN: TEST INTAKE SUMMARY (Mockup Style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <span className="input-label" style={{ marginBottom: '12px', fontSize: '11.5px', fontWeight: 800 }}>
              TEST INTAKE SUMMARY (ملخص الفحص)
            </span>

            {/* Selected Tests List */}
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700 }}>
              Selected Tests ({selectedTests.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: '140px', maxHeight: '220px', overflowY: 'auto', marginBottom: '16px' }}>
              {selectedTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '12px' }}>
                  No tests selected yet. Click cards on the left to add.
                </div>
              ) : (
                selectedTests.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: '#0e1420',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{t.code || ''}</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{t.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            {/* Financial Details */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                <span>Total ({selectedTests.length} Tests)</span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '16px' }}>{netTotal.toLocaleString()} د.ع</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Patient</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{patientName || 'None selected'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Priority</span>
                <select
                  className="select-control"
                  style={{ width: '110px', height: '28px', padding: '2px 6px', fontSize: '11.5px', background: isUrgent ? 'rgba(239, 68, 68, 0.2)' : '#0e1420', color: isUrgent ? '#ef4444' : 'inherit' }}
                  value={isUrgent ? 'URGENT' : 'ROUTINE'}
                  onChange={(e) => setIsUrgent(e.target.value === 'URGENT')}
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">🚨 STAT</option>
                </select>
              </div>
            </div>

            {/* Big Prominent Action Button (PROCEED TO INTAKE) */}
            <button
              type="button"
              onClick={handleRegisterSample}
              disabled={submitting || selectedTests.length === 0}
              className="btn-cyan-primary"
              style={{ width: '100%', height: '44px', fontSize: '13.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              <span>{submitting ? 'PROCESSING...' : 'PROCEED TO INTAKE →'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && createdSample && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 210, 211, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                <CheckCircle2 size={26} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
                Sample #{createdSample.sampleNumber} Registered!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Patient: {createdSample.patient?.name}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setDocPreviewUrl(`/api/samples/${createdSample.id}/barcode`);
                  setDocPreviewTitle(`Barcode - #${createdSample.sampleNumber}`);
                }}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
              >
                <Printer size={15} />
                <span>Print Barcode Label (ملصق الباركود)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDocPreviewUrl(`/api/samples/${createdSample.id}/print`);
                  setDocPreviewTitle(`Report - #${createdSample.sampleNumber}`);
                }}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
              >
                <FileText size={15} />
                <span>Preview Medical Report A4 (تقرير التحليل)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/results?sampleId=${createdSample.id}`);
                }}
                className="btn-cyan-primary"
                style={{ width: '100%', justifyContent: 'center', height: '42px', marginTop: '6px' }}
              >
                <Activity size={15} />
                <span>Go to Results Workstation →</span>
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

export default function IntakePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
      <IntakeContent />
    </Suspense>
  );
}
