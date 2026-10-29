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
import { orderCatalogByImportance, getMostUsedTests, normalizeCategory, RECEPTION_CATEGORIES } from '../lib/catalogOrdering';
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
  gender: null,
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
  thyroid: ['TSH', 'FT3', 'FT4'],
  diabetes: ['FBS', 'HBA1C'],
  liver: ['ALT', 'AST', 'TSB', 'ALP'],
  kidney: ['UREA', 'CREAT', 'URIC'],
  lipid: ['CHOL', 'TG', 'HDL', 'LDL'],
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
    setPatient((prev) => {
      const y = typeof years === 'number' && !isNaN(years) ? years : 0;
      const m = typeof prev.ageMonths === 'number' && !isNaN(prev.ageMonths) ? prev.ageMonths : 0;
      const d = typeof prev.ageDays === 'number' && !isNaN(prev.ageDays) ? prev.ageDays : 0;
      if (y === 0 && m === 0 && d === 0) {
        return { ...prev, ageYears: years, birthDate: '', birthDateEstimated: false };
      }
      const norm = normalizeAgeToBirthDate({ years: y, months: m, days: d });
      return {
        ...prev,
        ageYears: years,
        birthDate: norm.birthDate ? norm.birthDate.toISOString().split('T')[0] : prev.birthDate,
        birthDateEstimated: true,
      };
    });
  }, []);

  const setAgeMonths = useCallback((months: number | '') => {
    setPatient((prev) => {
      const y = typeof prev.ageYears === 'number' && !isNaN(prev.ageYears) ? prev.ageYears : 0;
      const m = typeof months === 'number' && !isNaN(months) ? months : 0;
      const d = typeof prev.ageDays === 'number' && !isNaN(prev.ageDays) ? prev.ageDays : 0;
      if (y === 0 && m === 0 && d === 0) {
        return { ...prev, ageMonths: months, birthDate: '', birthDateEstimated: false };
      }
      const norm = normalizeAgeToBirthDate({ years: y, months: m, days: d });
      return {
        ...prev,
        ageMonths: months,
        birthDate: norm.birthDate ? norm.birthDate.toISOString().split('T')[0] : prev.birthDate,
        birthDateEstimated: true,
      };
    });
  }, []);

  const setAgeDays = useCallback((days: number | '') => {
    setPatient((prev) => {
      const y = typeof prev.ageYears === 'number' && !isNaN(prev.ageYears) ? prev.ageYears : 0;
      const m = typeof prev.ageMonths === 'number' && !isNaN(prev.ageMonths) ? prev.ageMonths : 0;
      const d = typeof days === 'number' && !isNaN(days) ? days : 0;
      if (y === 0 && m === 0 && d === 0) {
        return { ...prev, ageDays: days, birthDate: '', birthDateEstimated: false };
      }
      const norm = normalizeAgeToBirthDate({ years: y, months: m, days: d });
      return {
        ...prev,
        ageDays: days,
        birthDate: norm.birthDate ? norm.birthDate.toISOString().split('T')[0] : prev.birthDate,
        birthDateEstimated: true,
      };
    });
  }, []);

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
      priorVisits: p.priorVisits || [],
    });

    if (p.priorVisits && Array.isArray(p.priorVisits) && p.priorVisits.length > 0) {
      setSelectedTests((prev) =>
        prev.map((t) => {
          const tCode = (t.code || '').toUpperCase().trim();
          for (const pv of p.priorVisits) {
            const match = (pv.tests || []).find(
              (x: any) =>
                x.testId === t.id ||
                (tCode && (x.code || '').toUpperCase().trim() === tCode) ||
                (x.name && t.name && x.name.toLowerCase().trim() === t.name.toLowerCase().trim()) ||
                (tCode && tCode.length > 2 && (x.name || '').toUpperCase().includes(tCode))
            );
            if (match && match.resultValue && String(match.resultValue).trim() !== '') {
              return { ...t, previousValue: String(match.resultValue), previousDate: pv.createdAt } as any;
            }
          }
          return t;
        })
      );
    }
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
  const [customPanels, setCustomPanels] = useState<any[]>(() => {
    return (catalogCache.getPanels() as any[]) || [];
  });
  const [doctors, setDoctors] = useState<any[]>(() => {
    return (INITIAL_DOCTORS as any[]) || [];
  });
  const [userRole, setUserRole] = useState<string>('OWNER');

  // Intelligent dynamic test frequency learning map (from samples + local clicks)
  const [frequencyMap, setFrequencyMap] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('labryo_test_frequencies') || localStorage.getItem('labryo_cached_frequencies');
        if (local) return JSON.parse(local);
      } catch {}
    }
    return catalogCache.getFrequencies() || {};
  });

  const recordTestUsage = useCallback((testId: string, testCode?: string) => {
    if (!testId && !testCode) return;
    setFrequencyMap((prev) => {
      const next = { ...prev };
      if (testId) next[testId] = (next[testId] || 0) + 1;
      if (testCode) {
        const cUpper = testCode.toUpperCase().trim();
        next[cUpper] = (next[cUpper] || 0) + 1;
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('labryo_test_frequencies', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const refreshPanels = useCallback(async () => {
    try {
      const res = await catalogCache.refresh(true);
      if (res?.panels && Array.isArray(res.panels)) {
        setCustomPanels(res.panels);
      }
      const freqs = catalogCache.getFrequencies();
      if (freqs && Object.keys(freqs).length > 0) {
        setFrequencyMap((prev) => ({ ...freqs, ...prev }));
      }
    } catch {}
  }, []);

  const updateCatalogTestPrice = useCallback(async (testId: string, newPrice: number) => {
    try {
      const res = await apiRequest(`/tests/${encodeURIComponent(testId)}`, 'PATCH', { price: newPrice });
      if (res) {
        setCatalogTests((prev) => {
          const next = prev.map((t) => (t.id === testId ? { ...t, price: newPrice } : t));
          catalogCache.update(next);
          return next;
        });
        setSelectedTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, price: newPrice } : t))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to update test price:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    // 0ms cached tests + subscribe to catalog updates
    const unsubscribe = catalogCache.subscribe(() => {
      const tests = catalogCache.getTests();
      if (Array.isArray(tests) && tests.length > 0) {
        setCatalogTests(tests);
      }
      const panels = catalogCache.getPanels();
      if (Array.isArray(panels)) {
        setCustomPanels(panels);
      }
      const freqs = catalogCache.getFrequencies();
      if (freqs && Object.keys(freqs).length > 0) {
        setFrequencyMap((prev) => ({ ...freqs, ...prev }));
      }
    });

    // Background fetch to ensure latest catalog tests, panels, frequencies and doctors
    catalogCache.refresh(true).then((res) => {
      if (res?.tests && Array.isArray(res.tests) && res.tests.length > 0) {
        setCatalogTests(res.tests);
      }
      if (res?.panels && Array.isArray(res.panels)) {
        setCustomPanels(res.panels);
      }
      const freqs = catalogCache.getFrequencies();
      if (freqs && Object.keys(freqs).length > 0) {
        setFrequencyMap((prev) => ({ ...freqs, ...prev }));
      }
    }).catch(() => {});

    // Load doctors and user role
    apiRequest('/doctors')
      .then((res) => {
        if (Array.isArray(res)) {
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

  const addDoctorDirectly = useCallback((doctor: any) => {
    if (!doctor || !doctor.id) return;
    setDoctors((prev) => {
      const existing = prev.find((d) => d.id === doctor.id);
      if (existing) return prev;
      return [doctor, ...prev];
    });
  }, []);

  const [selectedTests, setSelectedTests] = useState<UnifiedCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('MOST_USED');

  // Duplicate prevention & Cart modification
  const addTestToCart = useCallback((test: any): boolean => {
    if (!test || !test.id) return false;

    const testId = String(test.id);
    const testCode = (test.code || '').toUpperCase().trim();

    // Check if already selected in current snapshot
    const alreadySelected = selectedTests.some(
      (t) => t.id === testId || (testCode && (t.code || '').toUpperCase().trim() === testCode)
    );

    if (alreadySelected) {
      return false;
    }

    let prevVal: string | null = null;
    let prevDate: string | null = null;
    if (patient.priorVisits && Array.isArray(patient.priorVisits)) {
      for (const pv of patient.priorVisits) {
        const match = (pv.tests || []).find(
          (x: any) =>
            x.testId === testId ||
            (testCode && (x.code || '').toUpperCase().trim() === testCode) ||
            (x.name && test.name && x.name.toLowerCase().trim() === test.name.toLowerCase().trim()) ||
            (testCode && testCode.length > 2 && (x.name || '').toUpperCase().includes(testCode))
        );
        if (match && match.resultValue && String(match.resultValue).trim() !== '') {
          prevVal = String(match.resultValue);
          prevDate = pv.createdAt;
          break;
        }
      }
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
      ...(prevVal ? { previousValue: prevVal, previousDate: prevDate } : {}),
    } as any;

    // Deduplicate atomically inside functional state update as well
    setSelectedTests((prev) => {
      const exists = prev.some(
        (t) => t.id === testId || (testCode && (t.code || '').toUpperCase().trim() === testCode)
      );
      if (exists) return prev;
      return [...prev, cartItem];
    });

    // Learn and track usage frequency
    recordTestUsage(testId, test.code);

    return true;
  }, [selectedTests, recordTestUsage]);

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

  // Category counts across catalog tests
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      MOST_USED: getMostUsedTests(catalogTests, frequencyMap).length,
      BIOCHEMISTRY: 0,
      HEMATOLOGY: 0,
      HORMONES: 0,
      VIROLOGY: 0,
      IMMUNOLOGY: 0,
      MOLECULAR_PCR: 0,
      URINE_STOOL: 0,
      TUMOR_MARKERS: 0,
      MICROBIOLOGY: 0,
      TOXICOLOGY: 0,
      BLOOD_BANK: 0,
      PATHOLOGY: 0,
      WELLNESS_PANELS: 0,
    };

    catalogTests.forEach((t) => {
      const canonicalKey = normalizeCategory(t.category);
      if (counts[canonicalKey] !== undefined) {
        counts[canonicalKey] += 1;
      } else {
        counts.BIOCHEMISTRY += 1;
      }
    });

    return counts;
  }, [catalogTests, frequencyMap]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    let list = catalogTests;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const searched = list.filter((t) => {
        const name = (t.name || '').toLowerCase();
        const code = (t.code || '').toLowerCase();
        const arabic = (t.arabicName || '').toLowerCase();
        return name.includes(q) || code.includes(q) || arabic.includes(q);
      });
      return orderCatalogByImportance(searched, frequencyMap, 50, selectedCategory);
    }

    if (selectedCategory === 'MOST_USED') {
      return getMostUsedTests(catalogTests, frequencyMap);
    }

    if (selectedCategory && selectedCategory !== 'ALL') {
      const catKey = selectedCategory.toUpperCase();
      list = list.filter((t) => {
        return normalizeCategory(t.category) === catKey;
      });
    }

    // Prioritize top clinical and frequent tests at the head of the list
    return orderCatalogByImportance(list, frequencyMap, 50, selectedCategory);
  }, [catalogTests, selectedCategory, searchQuery, frequencyMap]);

  // Apply Quick Bundles
  const applyBundle = useCallback((bundleKey: string) => {
    const codes = BUNDLE_MAP[bundleKey];
    if (!codes || !Array.isArray(codes)) return;

    const matchedTests: any[] = [];
    const seenIds = new Set<string>();

    codes.forEach((code) => {
      const cleanCode = code.toUpperCase().trim();
      const target = catalogTests.find((t) => {
        const tCode = (t.code || '').toUpperCase().trim();
        if (tCode === cleanCode) return true;
        if (cleanCode === 'ALT' && tCode === 'GPT') return true;
        if (cleanCode === 'AST' && tCode === 'GOT') return true;
        if (cleanCode === 'UA' && tCode === 'URIC') return true;
        return false;
      });
      if (target && !seenIds.has(String(target.id))) {
        seenIds.add(String(target.id));
        matchedTests.push(target);
      }
    });

    if (matchedTests.length === 0) return;

    setSelectedTests((prev) => {
      const existingIds = new Set(prev.map((t) => String(t.id)));
      const existingCodes = new Set(
        prev.map((t) => (t.code || '').toUpperCase().trim()).filter(Boolean)
      );

      const toAdd: UnifiedCartItem[] = [];
      matchedTests.forEach((test) => {
        const testId = String(test.id);
        const testCode = (test.code || '').toUpperCase().trim();
        if (existingIds.has(testId) || (testCode && existingCodes.has(testCode))) {
          return;
        }
        existingIds.add(testId);
        if (testCode) existingCodes.add(testCode);

        toAdd.push({
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
        });

        recordTestUsage(testId, test.code);
      });

      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, [catalogTests, recordTestUsage]);

  // Apply Diagnostic Panel / Custom Package with exact custom panel price
  const applyPanel = useCallback((panel: any): number => {
    if (!panel) return 0;
    const testIds = new Set<string>(Array.isArray(panel.testIds) ? panel.testIds.map(String) : []);
    const testCodes = new Set<string>(
      Array.isArray(panel.testCodes) ? panel.testCodes.map((c: string) => c.toUpperCase().trim()) : []
    );

    if (Array.isArray(panel.items)) {
      panel.items.forEach((item: any) => {
        const tId = item.testId || item.test?.id;
        const tCode = (item.test?.code || '').toUpperCase().trim();
        if (tId) testIds.add(String(tId));
        if (tCode) testCodes.add(tCode);
      });
    }

    const matchedTests: any[] = [];
    const seenIds = new Set<string>();

    catalogTests.forEach((t) => {
      const tId = String(t.id);
      const tCode = (t.code || '').toUpperCase().trim();
      const idMatch = testIds.has(tId);
      const codeMatch = Boolean(tCode && testCodes.has(tCode));
      if ((idMatch || codeMatch) && !seenIds.has(tId)) {
        seenIds.add(tId);
        matchedTests.push(t);
      }
    });

    if (matchedTests.length === 0) return 0;

    const hasCustomPrice = panel.price !== undefined && panel.price !== null && Number(panel.price) > 0;
    const targetPanelPrice = hasCustomPrice ? Math.round(Number(panel.price)) : 0;
    const totalCatalogPrice = matchedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

    // Compute distributed price for each matched test so the sum exactly equals targetPanelPrice
    const distributedPrices: number[] = [];
    if (hasCustomPrice && matchedTests.length > 0) {
      let allocatedSum = 0;
      matchedTests.forEach((test, idx) => {
        if (idx === matchedTests.length - 1) {
          distributedPrices.push(Math.max(0, targetPanelPrice - allocatedSum));
        } else {
          const share = totalCatalogPrice > 0
            ? Math.round((Number(test.price || 0) / totalCatalogPrice) * targetPanelPrice)
            : Math.floor(targetPanelPrice / matchedTests.length);
          distributedPrices.push(share);
          allocatedSum += share;
        }
      });
    }

    let addedCount = 0;
    setSelectedTests((prev) => {
      const existingIds = new Set(prev.map((t) => String(t.id)));
      const existingCodes = new Set(
        prev.map((t) => (t.code || '').toUpperCase().trim()).filter(Boolean)
      );

      // If tests already existed, update their price/panel info if this panel carries a custom price
      let nextCart = prev.map((item) => {
        const matchIdx = matchedTests.findIndex((mt) => String(mt.id) === String(item.id) || (mt.code && item.code && mt.code.toUpperCase() === item.code.toUpperCase()));
        if (matchIdx !== -1 && hasCustomPrice) {
          return {
            ...item,
            price: distributedPrices[matchIdx],
            panelId: String(panel.id),
            panelName: String(panel.name || 'باقة'),
            panelPrice: targetPanelPrice,
            originalPrice: item.originalPrice || item.price,
          };
        }
        return item;
      });

      const toAdd: UnifiedCartItem[] = [];
      matchedTests.forEach((test, idx) => {
        const testId = String(test.id);
        const testCode = (test.code || '').toUpperCase().trim();
        if (existingIds.has(testId) || (testCode && existingCodes.has(testCode))) {
          return;
        }
        existingIds.add(testId);
        if (testCode) existingCodes.add(testCode);

        const assignedPrice = hasCustomPrice ? distributedPrices[idx] : (Number(test.price) || 0);

        toAdd.push({
          id: testId,
          name: test.name || testCode || 'Test',
          code: test.code,
          arabicName: test.arabicName,
          category: test.category || 'General',
          price: assignedPrice,
          panelId: hasCustomPrice ? String(panel.id) : undefined,
          panelName: hasCustomPrice ? String(panel.name || 'باقة') : undefined,
          panelPrice: hasCustomPrice ? targetPanelPrice : undefined,
          originalPrice: Number(test.price) || 0,
          sampleType: test.sampleType,
          unit: test.unit,
          refRangeLow: test.refRangeLow,
          refRangeHigh: test.refRangeHigh,
          refRangeText: test.refRangeText,
          referenceRanges: test.referenceRanges,
          isCalculated: Boolean(test.isCalculated),
        });

        recordTestUsage(testId, test.code);
      });

      addedCount = toAdd.length;
      return toAdd.length > 0 ? [...nextCart, ...toAdd] : nextCart;
    });

    return addedCount;
  }, [catalogTests, recordTestUsage]);

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
            previousValue: (test as any).previousValue || null,
            previousDate: (test as any).previousDate || null,
          };
        } else if ((test as any).previousValue !== undefined && next[test.id].previousValue !== (test as any).previousValue) {
          next[test.id] = {
            ...next[test.id],
            previousValue: (test as any).previousValue || null,
            previousDate: (test as any).previousDate || null,
          };
        }
      });

      return next;
    });
  }, [selectedTests, patient.gender, patient.ageYears, patient.birthDate]);

  // Update specific result row and trigger clinical evaluations
  const updateResultValue = useCallback((testId: string, rawVal: string, isOverride?: boolean) => {
    const cleanStr = toEnglishDigits(rawVal);

    setResults((prev) => {
      const current = prev[testId];
      if (!current) return prev;

      const catalogTest = catalogTests.find((t) => t.id === testId) || selectedTests.find((t) => t.id === testId);
      const isCalc = Boolean(catalogTest?.isCalculated || current.isCalculated);
      const resolvedOverride =
        typeof isOverride === 'boolean'
          ? isOverride
          : isCalc
          ? cleanStr.trim() !== ''
          : false;

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
        const classified = classifyResultRange(numVal, catalogTest || { refRangeText: current.refRangeText }, patientCtx);
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
          patient.gender || undefined
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
        isDirectOverride: resolvedOverride,
        isCalculated: isCalc,
      };

      return {
        ...prev,
        [testId]: nextItem,
      };
    });
  }, [catalogTests, selectedTests, patient.gender, patient.ageYears, patient.birthDate]);

  const toggleDirectOverride = useCallback((testId: string) => {
    setResults((prev) => {
      const current = prev[testId];
      if (!current) return prev;
      const nextOverride = !current.isDirectOverride;
      return {
        ...prev,
        [testId]: {
          ...current,
          isDirectOverride: nextOverride,
          value: nextOverride ? current.value : '',
        },
      };
    });
  }, []);

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
      } else if (code === 'HDL' || code === 'HDL-C' || code === 'HDLC' || r.testId === LIPID_CATALOG_IDS.HDL || (name.includes('hdl') && !name.includes('ratio') && !name.includes('/') && !name.includes('ldl') && !name.includes('non-hdl'))) {
        if (!isNaN(num)) hdlVal = num;
      } else if (code === 'TG' || code === 'TRIG' || code === 'TRIGLYCERIDES' || r.testId === LIPID_CATALOG_IDS.TG || name.includes('triglyceride')) {
        if (!isNaN(num)) tgVal = num;
      } else if (code === 'CREAT' || code === 'CREATININE' || name.includes('creatinine')) {
        if (!isNaN(num)) creatVal = num;
      }

      // Track target auto-calculated rows if present
      if (code === 'LDL' || code === 'LDL-C' || code === 'LDLC' || r.testId === LIPID_CATALOG_IDS.LDL || (name.includes('ldl') && !name.includes('ratio') && !name.includes('/') && !name.includes('hdl') && !name.includes('vldl'))) ldlTestId = r.testId;
      if (code === 'VLDL' || code === 'VLDL-C' || r.testId === LIPID_CATALOG_IDS.VLDL || name.includes('vldl')) vldlTestId = r.testId;
      if (code === 'NON_HDL' || code === 'NON-HDL' || r.testId === LIPID_CATALOG_IDS.NON_HDL || name.includes('non-hdl')) nonHdlTestId = r.testId;
      if (code === 'TC_HDL_RATIO' || code === 'TC/HDL' || r.testId === LIPID_CATALOG_IDS.TC_HDL_RATIO || name.includes('tc/hdl') || name.includes('tc / hdl') || name.includes('chol/hdl')) tcHdlTestId = r.testId;
      if (code === 'LDL_HDL_RATIO' || code === 'LDL/HDL' || r.testId === LIPID_CATALOG_IDS.LDL_HDL_RATIO || name.includes('ldl/hdl') || name.includes('ldl / hdl')) ldlHdlTestId = r.testId;
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
        if (vldlTestId && next[vldlTestId] && !next[vldlTestId].isDirectOverride) {
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
        if (nonHdlTestId && next[nonHdlTestId] && !next[nonHdlTestId].isDirectOverride) {
          const newVal = lipidPanel.nonHdl.value !== null ? String(lipidPanel.nonHdl.value) : '';
          if (next[nonHdlTestId].value !== newVal) {
            next[nonHdlTestId] = {
              ...next[nonHdlTestId],
              value: newVal,
              isCalculated: true,
            };
            changed = true;
          }
        }

        // TC/HDL Ratio
        if (tcHdlTestId && next[tcHdlTestId] && !next[tcHdlTestId].isDirectOverride) {
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
        if (ldlHdlTestId && next[ldlHdlTestId] && !next[ldlHdlTestId].isDirectOverride) {
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
      const egfrRes = calculateEgfr(creatVal, ageNum, patient.gender || 'MALE');

      setResults((prev) => {
        if (!prev[egfrTestId!] || prev[egfrTestId!].isDirectOverride) return prev;
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
    categoryCounts,
    frequencyMap,
    recordTestUsage,
    applyBundle,
    customPanels,
    applyPanel,
    refreshPanels,
    updateCatalogTestPrice,

    // Results & Formulas
    results,
    updateResultValue,
    toggleDirectOverride,
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
    addDoctorDirectly,
    userRole,
    isSaving,
    setIsSaving,
  };
}
