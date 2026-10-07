'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  UnifiedPatientState,
  UnifiedCartItem,
  UnifiedResultItem,
  UnifiedInvoiceState,
  UnifiedTubeBadge,
  UnifiedViewMode,
  UnifiedWorkspaceReturn,
} from './types';
import { deriveTubeBadges } from '../lib/tubeBadges';
import { catalogCache } from '../../../lib/catalogCache';
import { INITIAL_DOCTORS } from '../../../lib/catalogData';
import { apiRequest } from '../../../lib/api';
import {
  computeAgeBreakdown,
  normalizeAgeToBirthDate,
  calculateLipidPanel,
  calculateEgfr,
  classifyResultRange,
  evaluatePanicFlag,
  matchPatientReferenceRange,
  LIPID_NOT_CALCULATED_MSG,
  LIPID_CATALOG_IDS,
} from '@lab-manager/domain';
import { toEnglishDigits } from '../../../lib/formatters';

const VIEW_MODE_STORAGE_KEY = 'labryo_intake_view_mode';

const INITIAL_PATIENT: UnifiedPatientState = {
  id: null,
  name: '',
  phone: '',
  gender: 'MALE',
  ageYears: '',
  ageMonths: '',
  ageDays: '',
  birthDate: '',
  birthDateEstimated: true,
  doctorId: null,
  isUrgent: false,
  notes: '',
  visitCount: 0,
  outstandingDebt: 0,
  lastTestIds: [],
};

const BUNDLE_MAP: Record<string, string[]> = {
  comprehensive: ['CBC', 'CHOL', 'TG', 'HDL', 'LDL', 'AST', 'ALT', 'UREA', 'CREAT', 'FBS'],
  premarital: ['CBC', 'BG', 'HBSAG', 'HCV', 'HIV', 'VDRL'],
  liver_renal: ['AST', 'ALT', 'ALP', 'TSB', 'UREA', 'CREAT', 'UA'],
  anemia: ['CBC', 'FER', 'IRON', 'VITB12'],
  thyroid: ['TSH', 'FT3', 'FT4'],
  diabetes: ['FBS', 'HBA1C', 'GUE'],
  preop: ['CBC', 'PT-INR', 'PTT', 'BG'],
};

export function useUnifiedWorkspace(): UnifiedWorkspaceReturn {
  // Silently remove old classic viewMode key from localStorage on launch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(VIEW_MODE_STORAGE_KEY);
      } catch (e) {}
    }
  }, []);

  // -------------------------------------------------------------
  // 2. Patient State & Bidirectional Y/M/D <-> DOB Sync
  // -------------------------------------------------------------
  const [patient, setPatient] = useState<UnifiedPatientState>(INITIAL_PATIENT);

  const updatePatientField = useCallback(<K extends keyof UnifiedPatientState>(field: K, value: UnifiedPatientState[K]) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  }, []);

  const syncAgeToDob = useCallback((years: number | '', months: number | '', days: number | '') => {
    const y = typeof years === 'number' ? years : 0;
    const m = typeof months === 'number' ? months : 0;
    const d = typeof days === 'number' ? days : 0;

    if (y === 0 && m === 0 && d === 0) {
      setPatient((prev) => ({
        ...prev,
        ageYears: years,
        ageMonths: months,
        ageDays: days,
      }));
      return;
    }

    const normalized = normalizeAgeToBirthDate({ years: y, months: m, days: d });
    const isoDate = normalized.birthDate.toISOString().split('T')[0];

    setPatient((prev) => ({
      ...prev,
      ageYears: years,
      ageMonths: months,
      ageDays: days,
      birthDate: isoDate,
      birthDateEstimated: true,
    }));
  }, []);

  const setAgeYears = useCallback((years: number | '') => {
    syncAgeToDob(years, patient.ageMonths, patient.ageDays);
  }, [patient.ageMonths, patient.ageDays, syncAgeToDob]);

  const setAgeMonths = useCallback((months: number | '') => {
    syncAgeToDob(patient.ageYears, months, patient.ageDays);
  }, [patient.ageYears, patient.ageDays, syncAgeToDob]);

  const setAgeDays = useCallback((days: number | '') => {
    syncAgeToDob(patient.ageYears, patient.ageMonths, days);
  }, [patient.ageYears, patient.ageMonths, syncAgeToDob]);

  const setBirthDate = useCallback((birthDate: string) => {
    if (!birthDate) {
      setPatient((prev) => ({
        ...prev,
        birthDate: '',
        birthDateEstimated: false,
      }));
      return;
    }

    const breakdown = computeAgeBreakdown(birthDate);
    setPatient((prev) => ({
      ...prev,
      birthDate,
      birthDateEstimated: false,
      ageYears: breakdown.years,
      ageMonths: breakdown.months,
      ageDays: breakdown.days,
    }));
  }, []);

  const selectExistingPatient = useCallback((p: any) => {
    if (!p) return;

    let y: number | '' = '';
    let m: number | '' = '';
    let d: number | '' = '';
    let dob = p.birthDate || '';

    if (dob) {
      const breakdown = computeAgeBreakdown(dob);
      y = breakdown.years;
      m = breakdown.months;
      d = breakdown.days;
    } else if (p.age != null && p.age !== '') {
      const parsedAge = parseInt(String(p.age), 10);
      if (!isNaN(parsedAge)) {
        y = parsedAge;
        const normalized = normalizeAgeToBirthDate({ years: parsedAge });
        dob = normalized.birthDate.toISOString().split('T')[0];
      }
    }

    setPatient({
      id: p.id || null,
      name: p.name || '',
      phone: p.phone || '',
      gender: p.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
      ageYears: y,
      ageMonths: m,
      ageDays: d,
      birthDate: dob,
      birthDateEstimated: p.birthDateEstimated !== false,
      doctorId: p.referringDoctorId || p.doctorId || null,
      isUrgent: false,
      notes: p.notes || '',
      visitCount: p.visitCount || p.visitsCount || 0,
      outstandingDebt: p.outstandingDebt || 0,
      lastTestIds: p.lastTestIds || [],
      lastTestNames: p.lastTestNames || [],
    });
  }, []);

  const resetPatient = useCallback(() => {
    setPatient(INITIAL_PATIENT);
    setSelectedTests([]);
    setResults({});
    setDirectLdlOverride(null);
    setPaidAmount(0);
    setSearchQuery('');
  }, []);

  // -------------------------------------------------------------
  // 3. Catalog & Cart State
  // -------------------------------------------------------------
  const [catalogTests, setCatalogTests] = useState<any[]>(() => {
    return (catalogCache.getTests() as any[]) || [];
  });
  const [doctors, setDoctors] = useState<any[]>(() => {
    return (INITIAL_DOCTORS as any[]) || [];
  });
  const [userRole, setUserRole] = useState<string>('OWNER');

  useEffect(() => {
    // 0ms cached tests + subscribe to catalog updates
    const unsubscribe = catalogCache.subscribe(() => {
      const tests = catalogCache.getTests();
      if (Array.isArray(tests) && tests.length > 0) {
        setCatalogTests(tests);
      }
    });

    // Load doctors and user role
    apiRequest('/doctors')
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setDoctors(res);
        }
      })
      .catch(() => {});

    try {
      const r = localStorage.getItem('user_role') || localStorage.getItem('role') || 'OWNER';
      if (r) setUserRole(String(r).toUpperCase());
    } catch {}

    return () => {
      unsubscribe();
    };
  }, []);

  const [selectedTests, setSelectedTests] = useState<UnifiedCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Duplicate prevention & Cart modification
  const addTestToCart = useCallback((test: any): boolean => {
    if (!test || !test.id) return false;

    const testId = String(test.id);
    const testCode = (test.code || '').toUpperCase().trim();

    // Check if already selected
    const alreadySelected = selectedTests.some(
      (t) => t.id === testId || (testCode && (t.code || '').toUpperCase().trim() === testCode)
    );

    if (alreadySelected) {
      return false;
    }

    const cartItem: UnifiedCartItem = {
      id: testId,
      name: test.name || testCode || 'Test',
      code: test.code,
      arabicName: test.arabicName,
      category: test.category || 'General',
      price: Number(test.price) || 0,
      sampleType: test.sampleType,
      unit: test.unit,
      refRangeLow: test.refRangeLow,
      refRangeHigh: test.refRangeHigh,
      refRangeText: test.refRangeText,
      referenceRanges: test.referenceRanges,
      isCalculated: Boolean(test.isCalculated),
    };

    setSelectedTests((prev) => [...prev, cartItem]);
    return true;
  }, [selectedTests]);

  const removeTestFromCart = useCallback((testId: string) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== testId));
    setResults((prev) => {
      const next = { ...prev };
      delete next[testId];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setSelectedTests([]);
    setResults({});
    setDirectLdlOverride(null);
  }, []);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    let list = catalogTests;

    if (selectedCategory !== 'ALL') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((t) => {
        const itemCat = (t.category || '').toLowerCase();
        if (catLower === 'hematology') return itemCat.includes('دم') || itemCat.includes('hematology') || itemCat.includes('تخثر');
        if (catLower === 'chemistry') return itemCat.includes('كيمياء') || itemCat.includes('chemistry') || itemCat.includes('سكري') || itemCat.includes('كبد') || itemCat.includes('كلى') || itemCat.includes('دهون');
        if (catLower === 'hormones') return itemCat.includes('هرمون') || itemCat.includes('hormone') || itemCat.includes('غدة');
        if (catLower === 'immunology') return itemCat.includes('مناعة') || itemCat.includes('immunology') || itemCat.includes('أمصال');
        if (catLower === 'urine_stool') return itemCat.includes('إدرار') || itemCat.includes('خروج') || itemCat.includes('urine') || itemCat.includes('stool') || itemCat.includes('مجهري');
        if (catLower === 'vitamins_markers') return itemCat.includes('فيتامين') || itemCat.includes('vitamin') || itemCat.includes('أورام') || itemCat.includes('معادن');
        return itemCat.includes(catLower);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const name = (t.name || '').toLowerCase();
        const code = (t.code || '').toLowerCase();
        const arabic = (t.arabicName || '').toLowerCase();
        return name.includes(q) || code.includes(q) || arabic.includes(q);
      });
    }

    return list;
  }, [catalogTests, selectedCategory, searchQuery]);

  // Apply Quick Bundles
  const applyBundle = useCallback((bundleKey: string) => {
    const codes = BUNDLE_MAP[bundleKey];
    if (!codes || !Array.isArray(codes)) return;

    codes.forEach((code) => {
      const target = catalogTests.find(
        (t) => (t.code || '').toUpperCase().trim() === code.toUpperCase().trim()
      );
      if (target) {
        addTestToCart(target);
      }
    });
  }, [catalogTests, addTestToCart]);

  // -------------------------------------------------------------
  // 4. Results State, Lipid Engine & eGFR Auto-Calculations
  // -------------------------------------------------------------
  const [results, setResults] = useState<Record<string, UnifiedResultItem>>({});
  const [directLdlOverride, setDirectLdlOverride] = useState<number | null>(null);

  // Sync results grid rows when cart changes
  useEffect(() => {
    setResults((prev) => {
      const next: Record<string, UnifiedResultItem> = { ...prev };

      // Ensure every test in cart has a corresponding row
      selectedTests.forEach((test) => {
        if (!next[test.id]) {
          // Resolve applicable reference range for patient
          const patientCtx = {
            gender: patient.gender,
            age: typeof patient.ageYears === 'number' ? patient.ageYears : undefined,
            birthDate: patient.birthDate || undefined,
          };

          let resolvedRangeText = test.refRangeText || '';
          if (test.referenceRanges && test.referenceRanges.length > 0) {
            const matched = matchPatientReferenceRange(test.referenceRanges, patientCtx);
            if (matched) {
              resolvedRangeText = matched.text || (matched.low != null && matched.high != null ? `${matched.low} - ${matched.high}` : resolvedRangeText);
            }
          }

          next[test.id] = {
            testId: test.id,
            testName: test.name,
            testCode: test.code,
            category: test.category,
            value: '',
            unit: test.unit || '',
            refRangeText: resolvedRangeText,
            status: 'NONE',
            arrow: '',
            isCalculated: Boolean(test.isCalculated),
            isDirectOverride: false,
          };
        }
      });

      return next;
    });
  }, [selectedTests, patient.gender, patient.ageYears, patient.birthDate]);

  // Update specific result row and trigger clinical evaluations
  const updateResultValue = useCallback((testId: string, rawVal: string, isOverride = false) => {
    const cleanStr = toEnglishDigits(rawVal);

    setResults((prev) => {
      const current = prev[testId];
      if (!current) return prev;

      const numVal = parseFloat(cleanStr);
      let status: UnifiedResultItem['status'] = 'NONE';
      let arrow: UnifiedResultItem['arrow'] = '';

      if (!isNaN(numVal)) {
        // Patient range context
        const patientCtx = {
          gender: patient.gender,
          age: typeof patient.ageYears === 'number' ? patient.ageYears : undefined,
          birthDate: patient.birthDate || undefined,
        };

        // Classify against range
        const classified = classifyResultRange(numVal, { refRangeText: current.refRangeText }, patientCtx);
        if (classified.status === 'HIGH') {
          status = 'HIGH';
          arrow = '↑';
        } else if (classified.status === 'LOW') {
          status = 'LOW';
          arrow = '↓';
        } else if (classified.status === 'NORMAL') {
          status = 'NORMAL';
          arrow = '';
        }

        // Check Panic Limits
        const panic = evaluatePanicFlag(
          current.testCode || current.testName,
          numVal,
          typeof patient.ageYears === 'number' ? patient.ageYears : undefined,
          patient.gender
        );

        if (panic.isPanic) {
          status = 'PANIC';
          arrow = arrow || '↑';
        }
      }

      const nextItem: UnifiedResultItem = {
        ...current,
        value: cleanStr,
        status,
        arrow,
        isDirectOverride: isOverride,
        isCalculated: isOverride ? false : current.isCalculated,
      };

      return {
        ...prev,
        [testId]: nextItem,
      };
    });
  }, [patient.gender, patient.ageYears, patient.birthDate]);

  // Live Friedewald Lipid Engine & eGFR Auto-Calculations
  useEffect(() => {
    let tcVal: number | null = null;
    let hdlVal: number | null = null;
    let tgVal: number | null = null;
    let creatVal: number | null = null;

    let ldlTestId: string | null = null;
    let vldlTestId: string | null = null;
    let nonHdlTestId: string | null = null;
    let tcHdlTestId: string | null = null;
    let ldlHdlTestId: string | null = null;
    let egfrTestId: string | null = null;

    Object.values(results).forEach((r) => {
      const code = (r.testCode || '').toUpperCase().trim();
      const name = (r.testName || '').toLowerCase();
      const num = parseFloat(toEnglishDigits(r.value));

      if (code === 'CHOL' || code === 'TC' || code === 'CHOLESTEROL' || r.testId === LIPID_CATALOG_IDS.TC || name.includes('total cholesterol')) {
        if (!isNaN(num)) tcVal = num;
      } else if (code === 'HDL' || code === 'HDL-C' || r.testId === LIPID_CATALOG_IDS.HDL || name.includes('hdl')) {
        if (!isNaN(num)) hdlVal = num;
      } else if (code === 'TG' || code === 'TRIG' || code === 'TRIGLYCERIDES' || r.testId === LIPID_CATALOG_IDS.TG || name.includes('triglyceride')) {
        if (!isNaN(num)) tgVal = num;
      } else if (code === 'CREAT' || code === 'CREATININE' || name.includes('creatinine')) {
        if (!isNaN(num)) creatVal = num;
      }

      // Track target auto-calculated rows if present
      if (code === 'LDL' || code === 'LDL-C' || r.testId === LIPID_CATALOG_IDS.LDL || name.includes('ldl')) ldlTestId = r.testId;
      if (code === 'VLDL' || r.testId === LIPID_CATALOG_IDS.VLDL || name.includes('vldl')) vldlTestId = r.testId;
      if (code === 'NON_HDL' || code === 'NON-HDL' || r.testId === LIPID_CATALOG_IDS.NON_HDL || name.includes('non-hdl')) nonHdlTestId = r.testId;
      if (code === 'TC_HDL_RATIO' || code === 'TC/HDL' || r.testId === LIPID_CATALOG_IDS.TC_HDL_RATIO || name.includes('tc/hdl')) tcHdlTestId = r.testId;
      if (code === 'LDL_HDL_RATIO' || code === 'LDL/HDL' || r.testId === LIPID_CATALOG_IDS.LDL_HDL_RATIO || name.includes('ldl/hdl')) ldlHdlTestId = r.testId;
      if (code === 'EGFR' || name.includes('egfr')) egfrTestId = r.testId;
    });

    // 1. Calculate Lipid Panel
    if (tcVal !== null || tgVal !== null || hdlVal !== null) {
      const lipidPanel = calculateLipidPanel(tcVal, hdlVal, tgVal, 'mg/dL', directLdlOverride);

      setResults((prev) => {
        let changed = false;
        const next = { ...prev };

        // LDL Row
        if (ldlTestId && next[ldlTestId] && !next[ldlTestId].isDirectOverride) {
          const ldlRes = lipidPanel.ldl;
          const newVal = ldlRes.value !== null ? String(ldlRes.value) : (ldlRes.invalidReason ? LIPID_NOT_CALCULATED_MSG : '');
          if (next[ldlTestId].value !== newVal) {
            next[ldlTestId] = {
              ...next[ldlTestId],
              value: newVal,
              invalidReason: ldlRes.invalidReason,
              isCalculated: true,
            };
            changed = true;
          }
        }

        // VLDL Row
        if (vldlTestId && next[vldlTestId]) {
          const vldlRes = lipidPanel.vldl;
          const newVal = vldlRes.value !== null ? String(vldlRes.value) : (vldlRes.invalidReason ? LIPID_NOT_CALCULATED_MSG : '');
          if (next[vldlTestId].value !== newVal) {
            next[vldlTestId] = {
              ...next[vldlTestId],
              value: newVal,
              invalidReason: vldlRes.invalidReason,
              isCalculated: true,
            };
            changed = true;
          }
        }

        // Non-HDL Row
        if (nonHdlTestId && next[nonHdlTestId]) {
          const newVal = lipidPanel.nonHdl.value !== null ? String(lipidPanel.nonHdl.value) : '';
          if (next[nonHdlTestId].value !== newVal) {
            next[next[nonHdlTestId].testId] = {
              ...next[nonHdlTestId],
              value: newVal,
              isCalculated: true,
            };
            changed = true;
          }
        }

        // TC/HDL Ratio
        if (tcHdlTestId && next[tcHdlTestId]) {
          const newVal = lipidPanel.tcHdlRatio.value !== null ? String(lipidPanel.tcHdlRatio.value) : '';
          if (next[tcHdlTestId].value !== newVal) {
            next[tcHdlTestId] = {
              ...next[tcHdlTestId],
              value: newVal,
              isCalculated: true,
            };
            changed = true;
          }
        }

        // LDL/HDL Ratio
        if (ldlHdlTestId && next[ldlHdlTestId]) {
          const newVal = lipidPanel.ldlHdlRatio.value !== null ? String(lipidPanel.ldlHdlRatio.value) : '';
          if (next[ldlHdlTestId].value !== newVal) {
            next[ldlHdlTestId] = {
              ...next[ldlHdlTestId],
              value: newVal,
              isCalculated: true,
            };
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    }

    // 2. Calculate eGFR
    if (creatVal !== null && egfrTestId) {
      const ageNum = typeof patient.ageYears === 'number' ? patient.ageYears : 0;
      const egfrRes = calculateEgfr(creatVal, ageNum, patient.gender);

      setResults((prev) => {
        if (!prev[egfrTestId!]) return prev;
        const current = prev[egfrTestId!];
        const newVal = egfrRes.value !== null ? String(egfrRes.value) : '';
        if (current.value !== newVal) {
          return {
            ...prev,
            [egfrTestId!]: {
              ...current,
              value: newVal,
              invalidReason: egfrRes.note,
              isCalculated: true,
            },
          };
        }
        return prev;
      });
    }
  }, [results, directLdlOverride, patient.ageYears, patient.gender]);

  // -------------------------------------------------------------
  // 5. Invoice & Pricing State (Discount Removed)
  // -------------------------------------------------------------
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DEBT' | 'CARD'>('CASH');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const canSeePrices = useMemo(() => {
    return userRole !== 'TECHNICIAN';
  }, [userRole]);

  // Gross total: sum of prices of billable tests in cart (calculated rows have price = 0)
  const grossTotal = useMemo(() => {
    return selectedTests.reduce((acc, t) => {
      if (t.isCalculated) return acc;
      return acc + (t.price || 0);
    }, 0);
  }, [selectedTests]);

  // Net total is identical to grossTotal (Zero Discount System)
  const netTotal = grossTotal;

  // Doctor Commission
  const doctorCommission = useMemo(() => {
    if (!patient.doctorId) return 0;
    const doc = doctors.find((d) => String(d.id) === String(patient.doctorId));
    if (!doc || !doc.commissionPercent) return 0;
    return Math.round((netTotal * Number(doc.commissionPercent)) / 100);
  }, [patient.doctorId, doctors, netTotal]);

  // Synchronize paid amount when net total or payment method changes
  useEffect(() => {
    if (paymentMethod === 'CASH' || paymentMethod === 'CARD') {
      setPaidAmount(netTotal);
    } else if (paymentMethod === 'DEBT') {
      setPaidAmount(0);
    }
  }, [netTotal, paymentMethod]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, netTotal - paidAmount);
  }, [netTotal, paidAmount]);

  const invoice: UnifiedInvoiceState = useMemo(() => {
    return {
      grossTotal,
      netTotal,
      doctorCommission,
      paidAmount,
      remainingBalance,
      paymentMethod,
      canSeePrices,
    };
  }, [
    grossTotal,
    netTotal,
    doctorCommission,
    paidAmount,
    remainingBalance,
    paymentMethod,
    canSeePrices,
  ]);

  // -------------------------------------------------------------
  // 6. Tube Badges State
  // -------------------------------------------------------------
  const tubeBadges = useMemo(() => {
    return deriveTubeBadges(selectedTests);
  }, [selectedTests]);

  return {
    // Patient
    patient,
    setPatient,
    updatePatientField,
    setAgeYears,
    setAgeMonths,
    setAgeDays,
    setBirthDate,
    selectExistingPatient,
    resetPatient,

    // Catalog & Cart
    catalogTests,
    selectedTests,
    addTestToCart,
    removeTestFromCart,
    clearCart,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredCatalog,
    applyBundle,

    // Results & Formulas
    results,
    updateResultValue,
    directLdlOverride,
    setDirectLdlOverride,

    // Invoice & Pricing (Discount Removed)
    invoice,
    setPaidAmount,
    setPaymentMethod,

    // Tube Badges
    tubeBadges,

    // Helpers
    doctors,
    userRole,
    isSaving,
    setIsSaving,
  };
}
