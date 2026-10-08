'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  Activity, 
  Plus, 
  Layers, 
  Edit3, 
  Trash2, 
  X, 
  TrendingUp, 
  DollarSign, 
  Search, 
  CheckCircle2, 
  Tag, 
  Check,
  Sparkles,
  ChevronUp,
  ChevronDown,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { useLab } from '../../components/LabContext';
import { catalogCache } from '../../lib/catalogCache';
import SpecialtySelector from '../../components/specialties/SpecialtySelector';
import SpecialtiesManagerModal from '../../components/specialties/SpecialtiesManagerModal';
import ReferenceRangesEditor from '../../components/catalog/ReferenceRangesEditor';

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

export default function CatalogPage() {
  const toast = useToast();
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';
  const [tests, setTests] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tests' | 'panels'>('tests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [highlightedTestId, setHighlightedTestId] = useState<string | null>(null);

  // Modals
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const [deletePanelId, setDeletePanelId] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const testFormRef = useRef<HTMLFormElement | null>(null);

  // Test Form States
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [category, setCategory] = useState('أمراض الدم والتخثر');
  const [price, setPrice] = useState('');
  const [costEstimate, setCostEstimate] = useState('');
  const [refRangeLow, setRefRangeLow] = useState('');
  const [refRangeHigh, setRefRangeHigh] = useState('');
  const [normalMaleLow, setNormalMaleLow] = useState('');
  const [normalMaleHigh, setNormalMaleHigh] = useState('');
  const [normalFemaleLow, setNormalFemaleLow] = useState('');
  const [normalFemaleHigh, setNormalFemaleHigh] = useState('');
  const [criticalLow, setCriticalLow] = useState('');
  const [criticalHigh, setCriticalHigh] = useState('');
  const [refRangeText, setRefRangeText] = useState('');
  const [unit, setUnit] = useState('');
  const [sampleType, setSampleType] = useState('مصل الدم (Serum)');
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<number | null>(null);
  const [showSpecialtiesModal, setShowSpecialtiesModal] = useState(false);

  // Panel Form States
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelName, setPanelName] = useState('');
  const [panelDescription, setPanelDescription] = useState('');
  const [panelPrice, setPanelPrice] = useState('');
  const [selectedTestIdsForPanel, setSelectedTestIdsForPanel] = useState<string[]>([]);
  const [panelTestSearch, setPanelTestSearch] = useState('');

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/tests');
      setTests(res.tests || []);
      setPanels(res.panels || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل كتالوج الفحوصات', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Multi Reference Ranges State (Item 5)
  const [referenceRanges, setReferenceRanges] = useState<any[]>([]);
  const [rangeEditIndex, setRangeEditIndex] = useState<number | null>(null);
  const [rangeLabel, setRangeLabel] = useState('');
  const [rangeSex, setRangeSex] = useState<'M' | 'F' | 'any'>('any');
  const [rangeAgeMin, setRangeAgeMin] = useState('');
  const [rangeAgeMax, setRangeAgeMax] = useState('');
  const [rangeAgeUnit, setRangeAgeUnit] = useState<'days' | 'months' | 'years'>('years');
  const [rangeLow, setRangeLow] = useState('');
  const [rangeHigh, setRangeHigh] = useState('');
  const [rangeText, setRangeText] = useState('');
  const [rangeUnit, setRangeUnit] = useState('');
  const [rangeNote, setRangeNote] = useState('');
  const [rangeSource, setRangeSource] = useState('');
  const [rangeSourceUrl, setRangeSourceUrl] = useState('');
  const [showRangeForm, setShowRangeForm] = useState(false);

  const resetRangeForm = () => {
    setRangeEditIndex(null);
    setRangeLabel('');
    setRangeSex('any');
    setRangeAgeMin('');
    setRangeAgeMax('');
    setRangeAgeUnit('years');
    setRangeLow('');
    setRangeHigh('');
    setRangeText('');
    setRangeUnit(unit || '');
    setRangeNote('');
    setRangeSource('');
    setRangeSourceUrl('');
    setShowRangeForm(false);
  };

  const handleOpenEditRange = (index: number) => {
    const r = referenceRanges[index];
    if (!r) return;
    setRangeEditIndex(index);
    setRangeLabel(r.label || '');
    setRangeSex(r.sex || 'any');
    setRangeAgeMin(r.ageMin != null ? String(r.ageMin) : '');
    setRangeAgeMax(r.ageMax != null ? String(r.ageMax) : '');
    setRangeAgeUnit(r.ageUnit || 'years');
    setRangeLow(r.low != null ? String(r.low) : '');
    setRangeHigh(r.high != null ? String(r.high) : '');
    setRangeText(r.text || '');
    setRangeUnit(r.unit || unit || '');
    setRangeNote(r.note || '');
    setRangeSource(r.source || '');
    setRangeSourceUrl(r.sourceUrl || '');
    setShowRangeForm(true);
  };

  const handleSaveRange = () => {
    if (!rangeLabel.trim()) {
      toast.warning('يرجى كتابة تسمية المدى المرجعي (مثال: ذكور، إناث، أطفال)');
      return;
    }
    const newRange = {
      id: rangeEditIndex !== null && referenceRanges[rangeEditIndex]?.id ? referenceRanges[rangeEditIndex].id : `rr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: rangeLabel.trim(),
      sex: rangeSex,
      ageMin: rangeAgeMin !== '' ? Number(rangeAgeMin) : null,
      ageMax: rangeAgeMax !== '' ? Number(rangeAgeMax) : null,
      ageUnit: rangeAgeUnit,
      low: rangeLow !== '' ? Number(rangeLow) : null,
      high: rangeHigh !== '' ? Number(rangeHigh) : null,
      text: rangeText.trim() || (rangeLow !== '' && rangeHigh !== '' ? `${rangeLow} - ${rangeHigh}` : null),
      unit: rangeUnit.trim() || unit || null,
      note: rangeNote.trim() || null,
      source: rangeSource.trim() || null,
      sourceUrl: rangeSourceUrl.trim() || null,
      isUserEdited: true,
      sortOrder: rangeEditIndex !== null ? rangeEditIndex : referenceRanges.length,
    };

    if (rangeEditIndex !== null) {
      const updated = [...referenceRanges];
      updated[rangeEditIndex] = newRange;
      setReferenceRanges(updated);
      toast.success('تم تحديث المدى المرجعي');
    } else {
      setReferenceRanges([...referenceRanges, newRange]);
      toast.success('تمت إضافة المدى المرجعي بنجاح');
    }
    resetRangeForm();
  };

  const handleDeleteRange = (index: number) => {
    setReferenceRanges(referenceRanges.filter((_, i) => i !== index));
    toast.info('تم حذف المدى المرجعي');
  };

  const handleMoveRange = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= referenceRanges.length) return;
    const reordered = [...referenceRanges];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((r, idx) => (r.sortOrder = idx));
    setReferenceRanges(reordered);
  };

  const handleAutoFillPcv = () => {
    const pcvRanges = [
      {
        id: `rr_pcv_m_${Date.now()}`,
        label: 'الرجال البالغين (Adult Men)',
        sex: 'M',
        ageMin: 18,
        ageMax: 120,
        ageUnit: 'years',
        low: 40.0,
        high: 52.0,
        text: '40.0 - 52.0',
        unit: '%',
        note: 'auto-filled from Tietz / Mayo Clinic Laboratories — confirm against your analyzer/kit',
        source: 'Mayo Clinic Laboratories / Tietz Clinical Guide to Laboratory Tests',
        sourceUrl: 'https://www.mayocliniclabs.com/test-catalog/overview/8404',
        isUserEdited: false,
        sortOrder: 0
      },
      {
        id: `rr_pcv_f_${Date.now()}`,
        label: 'النساء البالغات (Adult Women)',
        sex: 'F',
        ageMin: 18,
        ageMax: 120,
        ageUnit: 'years',
        low: 36.0,
        high: 48.0,
        text: '36.0 - 48.0',
        unit: '%',
        note: 'auto-filled from Tietz / Mayo Clinic Laboratories — confirm against your analyzer/kit',
        source: 'Mayo Clinic Laboratories / Tietz Clinical Guide to Laboratory Tests',
        sourceUrl: 'https://www.mayocliniclabs.com/test-catalog/overview/8404',
        isUserEdited: false,
        sortOrder: 1
      },
      {
        id: `rr_pcv_nb_${Date.now()}`,
        label: 'حديثي الولادة (Newborns 0-14 days)',
        sex: 'any',
        ageMin: 0,
        ageMax: 14,
        ageUnit: 'days',
        low: 45.0,
        high: 65.0,
        text: '45.0 - 65.0',
        unit: '%',
        note: 'auto-filled from Harriet Lane Handbook / Nelson Pediatrics — confirm against your analyzer/kit',
        source: 'Harriet Lane Handbook of Pediatrics / Nelson Textbook of Pediatrics',
        sourceUrl: 'https://medlineplus.gov/ency/article/003646.htm',
        isUserEdited: false,
        sortOrder: 2
      },
      {
        id: `rr_pcv_inf_${Date.now()}`,
        label: 'الرضع (Infants 1-12 months)',
        sex: 'any',
        ageMin: 1,
        ageMax: 12,
        ageUnit: 'months',
        low: 30.0,
        high: 40.0,
        text: '30.0 - 40.0',
        unit: '%',
        note: 'auto-filled from Harriet Lane / CALIPER — confirm against your analyzer/kit',
        source: 'Harriet Lane Handbook 22nd ed. / CALIPER Pediatric Reference Database',
        sourceUrl: 'https://medlineplus.gov/ency/article/003646.htm',
        isUserEdited: false,
        sortOrder: 3
      },
      {
        id: `rr_pcv_ch_${Date.now()}`,
        label: 'الأطفال (Children 1-10 years)',
        sex: 'any',
        ageMin: 1,
        ageMax: 10,
        ageUnit: 'years',
        low: 34.0,
        high: 44.0,
        text: '34.0 - 44.0',
        unit: '%',
        note: 'auto-filled from Harriet Lane / CALIPER — confirm against your analyzer/kit',
        source: 'Harriet Lane Handbook 22nd ed. / CALIPER Pediatric Reference Database',
        sourceUrl: 'https://medlineplus.gov/ency/article/003646.htm',
        isUserEdited: false,
        sortOrder: 4
      }
    ];
    setReferenceRanges(pcvRanges);
    setUnit('%');
    toast.success('تم ملء مديات PCV المعتمدة تلقائياً من Mayo Clinic و Harriet Lane — يرجى التأكيد وفقاً لجهازك');
  };

  const handleOpenAddTest = () => {
    setEditingTestId(null);
    setCode('');
    setName('');
    setArabicName('');
    setCategory('أمراض الدم والتخثر');
    setPrice('');
    setCostEstimate('');
    setRefRangeLow('');
    setRefRangeHigh('');
    setNormalMaleLow('');
    setNormalMaleHigh('');
    setNormalFemaleLow('');
    setNormalFemaleHigh('');
    setCriticalLow('');
    setCriticalHigh('');
    setRefRangeText('');
    setUnit('');
    setSampleType('مصل الدم (Serum)');
    setSpecialtyId(null);
    setGroupId(null);
    setSortOrder(null);
    // 1-Click ready default template: "للجميع"
    setReferenceRanges([
      {
        id: `rr_${Date.now()}`,
        label: 'للجميع',
        sex: 'any',
        ageMin: 0,
        ageMax: null,
        ageUnit: 'years',
        low: null,
        high: null,
        isUserEdited: true,
        sortOrder: 0,
      },
    ]);
    resetRangeForm();
    setIsFormDirty(false);
    setShowTestModal(true);
  };

  const handleOpenEditTest = (test: any) => {
    setEditingTestId(test.id);
    setCode(test.code || '');
    setName(test.name);
    setArabicName(test.arabicName || '');
    setCategory(test.category || 'عام');
    setPrice(String(test.price));
    setCostEstimate(String(test.costEstimate || ''));
    setRefRangeLow(test.refRangeLow !== null && test.refRangeLow !== undefined ? String(test.refRangeLow) : '');
    setRefRangeHigh(test.refRangeHigh !== null && test.refRangeHigh !== undefined ? String(test.refRangeHigh) : '');
    setNormalMaleLow(test.normalMaleLow !== null && test.normalMaleLow !== undefined ? String(test.normalMaleLow) : '');
    setNormalMaleHigh(test.normalMaleHigh !== null && test.normalMaleHigh !== undefined ? String(test.normalMaleHigh) : '');
    setNormalFemaleLow(test.normalFemaleLow !== null && test.normalFemaleLow !== undefined ? String(test.normalFemaleLow) : '');
    setNormalFemaleHigh(test.normalFemaleHigh !== null && test.normalFemaleHigh !== undefined ? String(test.normalFemaleHigh) : '');
    setCriticalLow(test.criticalLow !== null && test.criticalLow !== undefined ? String(test.criticalLow) : '');
    setCriticalHigh(test.criticalHigh !== null && test.criticalHigh !== undefined ? String(test.criticalHigh) : '');
    setRefRangeText(test.refRangeText || '');
    setUnit(test.unit || '');
    setSampleType(test.sampleType || 'مصل الدم (Serum)');
    setSpecialtyId(test.specialtyId || null);
    setGroupId(test.groupId || null);
    setSortOrder(test.sortOrder !== undefined && test.sortOrder !== null ? Number(test.sortOrder) : null);

    // Smart backward-compatible mapping of existing ranges:
    if (test.referenceRanges && Array.isArray(test.referenceRanges) && test.referenceRanges.length > 0) {
      setReferenceRanges(JSON.parse(JSON.stringify(test.referenceRanges)));
    } else {
      const mapped: any[] = [];
      if (test.normalMaleLow != null || test.normalFemaleLow != null) {
        mapped.push({
          id: `rr_m_${Date.now()}`,
          label: 'رجال',
          sex: 'M',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: test.normalMaleLow != null ? Number(test.normalMaleLow) : null,
          high: test.normalMaleHigh != null ? Number(test.normalMaleHigh) : null,
          unit: test.unit || null,
          sortOrder: 0,
        });
        mapped.push({
          id: `rr_f_${Date.now() + 1}`,
          label: 'نساء',
          sex: 'F',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: test.normalFemaleLow != null ? Number(test.normalFemaleLow) : null,
          high: test.normalFemaleHigh != null ? Number(test.normalFemaleHigh) : null,
          unit: test.unit || null,
          sortOrder: 1,
        });
      } else if (test.refRangeLow != null || test.refRangeHigh != null) {
        mapped.push({
          id: `rr_all_${Date.now()}`,
          label: 'للجميع',
          sex: 'any',
          ageMin: 0,
          ageMax: null,
          ageUnit: 'years',
          low: test.refRangeLow != null ? Number(test.refRangeLow) : null,
          high: test.refRangeHigh != null ? Number(test.refRangeHigh) : null,
          unit: test.unit || null,
          sortOrder: 0,
        });
      }
      setReferenceRanges(mapped);
    }

    resetRangeForm();
    setIsFormDirty(false);
    setShowTestModal(true);
  };

  useEffect(() => {
    if (!showTestModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        testFormRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTestModal]);

  const handleCloseTestModal = () => {
    if (isFormDirty) {
      setShowDirtyConfirm(true);
    } else {
      setShowTestModal(false);
      setIsFormDirty(false);
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.warning('يرجى ملء اسم الفحص والسعر على الأقل', 'بيانات ناقصة');
      return;
    }

    try {
      // Auto-derive fallback fields and textual summary from referenceRanges
      let derivedLow: number | null = null;
      let derivedHigh: number | null = null;
      let derivedMaleLow: number | null = null;
      let derivedMaleHigh: number | null = null;
      let derivedFemaleLow: number | null = null;
      let derivedFemaleHigh: number | null = null;
      let derivedRefText: string | null = null;

      if (referenceRanges.length > 0) {
        for (const r of referenceRanges) {
          const isAll = r.sex === 'any' || r.label?.includes('جميع') || r.label?.includes('عام') || (!r.sex && !r.label);
          const isMale = r.sex === 'M' || r.label?.includes('رجال') || r.label?.includes('ذكر');
          const isFemale = r.sex === 'F' || r.label?.includes('نساء') || r.label?.includes('أنثى');

          if (isAll) {
            if (r.low != null) derivedLow = r.low;
            if (r.high != null) derivedHigh = r.high;
          }
          if (isMale) {
            if (r.low != null) derivedMaleLow = r.low;
            if (r.high != null) derivedMaleHigh = r.high;
          }
          if (isFemale) {
            if (r.low != null) derivedFemaleLow = r.low;
            if (r.high != null) derivedFemaleHigh = r.high;
          }
        }

        // If no explicit general range, fallback to male, female, or the first range bounds
        if (derivedLow === null && derivedHigh === null) {
          derivedLow = derivedMaleLow ?? derivedFemaleLow ?? (referenceRanges[0].low != null ? referenceRanges[0].low : null);
          derivedHigh = derivedMaleHigh ?? derivedFemaleHigh ?? (referenceRanges[0].high != null ? referenceRanges[0].high : null);
        }

        // Generate authoritative reference range text string
        if (referenceRanges.length === 1) {
          const r = referenceRanges[0];
          const valStr = r.text?.trim() || (r.low != null && r.high != null ? `${r.low} - ${r.high}` : (r.low != null ? `>= ${r.low}` : (r.high != null ? `<= ${r.high}` : '')));
          const hasCustomLabel = r.label && !r.label.includes('جميع') && !r.label.includes('عام') && r.label !== 'المعدل العام';
          derivedRefText = hasCustomLabel && valStr ? `${r.label}: ${valStr}` : valStr;
        } else {
          derivedRefText = referenceRanges
            .map((r: any) => {
              const valStr = r.text?.trim() || (r.low != null && r.high != null ? `${r.low} - ${r.high}` : (r.low != null ? `>= ${r.low}` : (r.high != null ? `<= ${r.high}` : '')));
              return r.label ? `${r.label}: ${valStr}` : valStr;
            })
            .filter(Boolean)
            .join(' | ');
        }
      } else {
        derivedLow = refRangeLow !== '' ? Number(refRangeLow) : null;
        derivedHigh = refRangeHigh !== '' ? Number(refRangeHigh) : null;
        derivedMaleLow = normalMaleLow !== '' ? Number(normalMaleLow) : null;
        derivedMaleHigh = normalMaleHigh !== '' ? Number(normalMaleHigh) : null;
        derivedFemaleLow = normalFemaleLow !== '' ? Number(normalFemaleLow) : null;
        derivedFemaleHigh = normalFemaleHigh !== '' ? Number(normalFemaleHigh) : null;
        derivedRefText = refRangeText.trim() || null;
      }

      const payload = {
        code: code.trim() || undefined,
        name: name.trim(),
        arabicName: arabicName.trim() || undefined,
        category,
        specialtyId: specialtyId || null,
        groupId: groupId || null,
        sortOrder: sortOrder !== undefined && sortOrder !== null ? Number(sortOrder) : null,
        price: Number(price),
        costEstimate: costEstimate !== '' ? Number(costEstimate) : null,
        refRangeLow: derivedLow,
        refRangeHigh: derivedHigh,
        normalMaleLow: derivedMaleLow,
        normalMaleHigh: derivedMaleHigh,
        normalFemaleLow: derivedFemaleLow,
        normalFemaleHigh: derivedFemaleHigh,
        criticalLow: criticalLow !== '' && criticalLow !== null ? Number(criticalLow) : null,
        criticalHigh: criticalHigh !== '' && criticalHigh !== null ? Number(criticalHigh) : null,
        refRangeText: derivedRefText,
        unit: unit.trim() || null,
        sampleType,
        referenceRanges: referenceRanges.length > 0 ? referenceRanges : [],
      };

      let savedTestId = editingTestId;

      if (editingTestId) {
        const updated = await apiRequest(`/tests/${editingTestId}`, 'PATCH', payload);
        savedTestId = updated?.id || editingTestId;
        // Optimistically update test in local tests array with updated referenceRanges
        setTests((prev) => prev.map((t) => (t.id === editingTestId ? { ...t, ...payload, id: editingTestId, referenceRanges: [...referenceRanges] } : t)));
        toast.success('تم تعديل بيانات الفحص المخبري بنجاح!', 'تم التحديث');
      } else {
        const normName = name.trim().toLowerCase();
        const normCode = code.trim().toUpperCase();
        const duplicate = tests.find(
          (t: any) => t.name?.trim().toLowerCase() === normName ||
               (normCode && t.code && t.code.trim().toUpperCase() === normCode)
        );
        if (duplicate) {
          toast.warning(`فحص بهذا الاسم أو الرمز موجود مسبقاً (${duplicate.name})`, 'تنبيه التكرار');
          return;
        }
        const created = await apiRequest('/tests', 'POST', payload);
        savedTestId = created?.id || `test_${Date.now()}`;
        // Optimistically insert into local tests array
        setTests((prev) => [created || { ...payload, id: savedTestId }, ...prev]);
        toast.success('تمت إضافة الفحص الجديد للكتالوج بنجاح!', 'تم الحفظ');
      }

      // Visual highlight glow & smooth scroll
      if (savedTestId) {
        setHighlightedTestId(savedTestId);
        setTimeout(() => setHighlightedTestId(null), 3500);
        setTimeout(() => {
          const el = document.getElementById(`test-row-${savedTestId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }

      // If category filter hides it, switch to ALL or test's category
      if (selectedCategory !== 'ALL' && selectedCategory !== category) {
        setSelectedCategory('ALL');
      }

      // Clear search query if it would hide this test
      if (searchQuery.trim() && !name.toLowerCase().includes(searchQuery.toLowerCase()) && !code.toLowerCase().includes(searchQuery.toLowerCase())) {
        setSearchQuery('');
      }

      setIsFormDirty(false);
      setShowTestModal(false);
      await loadCatalog();
      await catalogCache.refresh(true);
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حفظ الفحص', 'فشل العملية');
    }
  };

  const handleConfirmDeleteTest = async () => {
    if (!deleteTestId) return;
    try {
      await apiRequest(`/tests/${deleteTestId}`, 'DELETE');
      toast.success('تم حذف الفحص بنجاح!', 'تم الحذف');
      setDeleteTestId(null);
      await loadCatalog();
      await catalogCache.refresh(true);
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حذف الفحص', 'فشل الحذف');
    }
  };

  // Open Add / Edit Panel
  const handleOpenAddPanel = () => {
    setEditingPanelId(null);
    setPanelName('');
    setPanelDescription('');
    setPanelPrice('');
    setSelectedTestIdsForPanel([]);
    setShowPanelModal(true);
  };

  const handleOpenEditPanel = (panel: any) => {
    setEditingPanelId(panel.id);
    setPanelName(panel.name);
    setPanelDescription(panel.description || '');
    setPanelPrice(String(panel.price));
    setSelectedTestIdsForPanel(panel.items?.map((it: any) => it.testId || it.test?.id) || []);
    setShowPanelModal(true);
  };

  const handleSavePanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelName.trim() || !panelPrice || selectedTestIdsForPanel.length === 0) {
      toast.warning('يرجى كتابة اسم الباقة وسعرها واختيار فحص واحد على الأقل', 'بيانات ناقصة');
      return;
    }

    try {
      const payload = {
        name: panelName.trim(),
        description: panelDescription.trim() || undefined,
        price: Number(panelPrice),
        testIds: selectedTestIdsForPanel,
      };

      if (editingPanelId) {
        await apiRequest(`/tests/panels/${editingPanelId}`, 'PATCH', payload);
        toast.success('تم تعديل الباقة التشخيصية بنجاح!', 'تم التحديث');
      } else {
        await apiRequest('/tests/panels', 'POST', payload);
        toast.success('تم إنشاء الباقة التشخيصية الجديدة بنجاح!', 'تم الحفظ');
      }

      setShowPanelModal(false);
      await loadCatalog();
      await catalogCache.refresh(true);
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حفظ الباقة', 'فشل العملية');
    }
  };

  const handleConfirmDeletePanel = async () => {
    if (!deletePanelId) return;
    try {
      await apiRequest(`/tests/panels/${deletePanelId}`, 'DELETE');
      toast.success('تم حذف الباقة بنجاح!', 'تم الحذف');
      setDeletePanelId(null);
      await loadCatalog();
      await catalogCache.refresh(true);
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حذف الباقة', 'فشل الحذف');
    }
  };

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(tests.map((t) => t.category).filter(Boolean)))];
  }, [tests]);

  const filteredTests = useMemo(() => {
    const rawSearch = searchQuery.trim();
    const normSearch = cleanArabic(rawSearch);
    return tests.filter((t) => {
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchSearch = !rawSearch ||
        cleanArabic(t.name || '').includes(normSearch) ||
        cleanArabic(t.arabicName || '').includes(normSearch) ||
        cleanArabic(t.code || '').includes(normSearch) ||
        cleanArabic(t.category || '').includes(normSearch) ||
        t.name.toLowerCase().includes(rawSearch.toLowerCase()) ||
        (t.code && t.code.toLowerCase().includes(rawSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [tests, selectedCategory, searchQuery]);

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity color="#06b6d4" size={24} />
            كتالوج الفحوصات الطبية والباقات التشخيصية
          </h1>
          <p className="page-subtitle">إدارة أسعار التحاليل، المعدلات الطبيعية، الحدود الحرجة، وتجميع الباقات الشاملة</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href="/settings"
            title="تعديل العملة وتحويل الأسعار تلقائياً"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              background: 'rgba(2, 132, 199, 0.08)',
              color: 'var(--accent-cyan)',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none'
            }}
          >
            <DollarSign size={14} />
            <span>العملة المعتمدة: <strong>{currency}</strong></span>
          </a>

          <button
            onClick={() => setShowSpecialtiesModal(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="إدارة الهيكل السريري وتصنيفات الاختصاصات"
          >
            <Layers size={16} />
            <span>إدارة الاختصاصات</span>
          </button>

          {activeTab === 'tests' ? (
            <button onClick={handleOpenAddTest} className="btn-primary">
              <Plus size={16} />
              <span>إضافة فحص جديد</span>
            </button>
          ) : (
            <button onClick={handleOpenAddPanel} className="btn-primary">
              <Plus size={16} />
              <span>إنشاء باقة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('tests')}
          className={`btn-secondary ${activeTab === 'tests' ? 'active' : ''}`}
          style={{
            background: activeTab === 'tests' ? 'rgba(6, 182, 212, 0.15)' : undefined,
            borderColor: activeTab === 'tests' ? 'var(--accent-cyan)' : undefined,
            color: activeTab === 'tests' ? 'var(--accent-cyan)' : undefined,
          }}
        >
          <Activity size={16} />
          <span>قائمة الفحوصات المفردة ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('panels')}
          className={`btn-secondary ${activeTab === 'panels' ? 'active' : ''}`}
          style={{
            background: activeTab === 'panels' ? 'rgba(16, 185, 129, 0.15)' : undefined,
            borderColor: activeTab === 'panels' ? 'var(--accent-emerald)' : undefined,
            color: activeTab === 'panels' ? 'var(--accent-emerald)' : undefined,
          }}
        >
          <Sparkles size={16} />
          <span>الباقات والعروض المجمعة ({panels.length})</span>
        </button>
      </div>

      {/* TAB 1: TESTS */}
      {activeTab === 'tests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search & Category Pills */}
          <div className="glass-card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرمز (CBC, TSH, Glucose)..."
                  className="input-control"
                  style={{ paddingRight: '32px', fontSize: '12.5px', minHeight: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="category-scroll-strip">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat === 'ALL' ? 'كل الأقسام' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tests Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الرمز</th>
                    <th>اسم الفحص</th>
                    <th>الاسم العربي</th>
                    <th>القسم</th>
                    <th>السعر للمريض</th>
                    <th>التكلفة التقديرية</th>
                    <th>المعدل الطبيعي</th>
                    <th>الحد الحرج (Panic)</th>
                    <th>الوحدة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب قائمة الفحوصات...</td>
                    </tr>
                  ) : filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد فحوصات مطابقة للبحث</td>
                    </tr>
                  ) : (
                    filteredTests.map((t) => {
                      const isHighlighted = highlightedTestId === t.id;
                      return (
                      <tr
                        key={t.id}
                        id={`test-row-${t.id}`}
                        style={{
                          background: isHighlighted ? 'rgba(6, 182, 212, 0.22)' : undefined,
                          boxShadow: isHighlighted ? 'inset 0 0 0 1.5px var(--accent-cyan, #06b6d4), 0 0 16px rgba(6, 182, 212, 0.35)' : undefined,
                          transition: 'background 0.5s ease, box-shadow 0.5s ease',
                        }}
                      >
                        <td>
                          {t.code ? (
                            <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              {t.code}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>-</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{t.name}</span>
                            {isHighlighted && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                                محدث الآن
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.arabicName || '-'}</td>
                        <td>
                          <span className="badge badge-received" style={{ fontSize: '10px' }}>{t.category || 'عام'}</span>
                        </td>
                        <td style={{ fontWeight: 900, color: 'var(--accent-cyan)' }}>{t.price?.toLocaleString()} {currency}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.costEstimate ? `${t.costEstimate.toLocaleString()} ${currency}` : '-'}</td>
                        <td style={{ fontSize: '11.5px' }}>
                          {(() => {
                            const rRanges = t.referenceRanges && Array.isArray(t.referenceRanges) ? t.referenceRanges : [];
                            if (rRanges.length === 1) {
                              const r = rRanges[0];
                              const val = r.text || (r.low != null && r.high != null ? `${r.low} - ${r.high}` : (r.low != null ? `>= ${r.low}` : (r.high != null ? `<= ${r.high}` : '-')));
                              const isCustom = r.label && !r.label.includes('جميع') && !r.label.includes('عام') && r.label !== 'المعدل العام';
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span dir="ltr" style={{ display: 'inline-block', direction: 'ltr', unicodeBidi: 'isolate', fontWeight: 700, color: 'var(--text-main)' }}>
                                    {val}
                                  </span>
                                  {isCustom && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{r.label}</span>
                                  )}
                                </div>
                              );
                            }
                            if (rRanges.length > 1) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                                    {rRanges.map((rr: any, idx: number) => {
                                      const val = rr.text || (rr.low != null && rr.high != null ? `${rr.low} - ${rr.high}` : (rr.low != null ? `>= ${rr.low}` : (rr.high != null ? `<= ${rr.high}` : '')));
                                      const isMale = rr.sex === 'M' || rr.label?.includes('رجال') || rr.label?.includes('ذكر');
                                      const isFemale = rr.sex === 'F' || rr.label?.includes('نساء') || rr.label?.includes('أنثى');
                                      const bg = isMale ? 'rgba(59, 130, 246, 0.12)' : isFemale ? 'rgba(236, 72, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)';
                                      const border = isMale ? 'rgba(59, 130, 246, 0.3)' : isFemale ? 'rgba(236, 72, 153, 0.3)' : 'var(--border-color)';
                                      const color = isMale ? '#60a5fa' : isFemale ? '#f472b6' : 'var(--text-main)';
                                      return (
                                        <span
                                          key={idx}
                                          dir="ltr"
                                          style={{
                                            fontSize: '10.5px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: bg,
                                            border: `1px solid ${border}`,
                                            color,
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                        >
                                          <span style={{ opacity: 0.85 }}>{rr.label || (isMale ? 'M' : isFemale ? 'F' : '')}:</span>
                                          <strong>{val}</strong>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            // Fallback for legacy tests
                            const legacyVal = t.refRangeText || (t.refRangeLow != null && t.refRangeHigh != null ? `${t.refRangeLow} - ${t.refRangeHigh}` : (t.refRangeLow != null ? `>= ${t.refRangeLow}` : (t.refRangeHigh != null ? `<= ${t.refRangeHigh}` : '-')));
                            return (
                              <span dir="ltr" style={{ display: 'inline-block', direction: 'ltr', unicodeBidi: 'isolate' }}>
                                {legacyVal}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {(t.criticalLow !== null || t.criticalHigh !== null) ? (
                            <span style={{ color: 'var(--accent-rose)', fontSize: '11px', fontWeight: 800 }}>
                              {t.criticalLow !== null ? `<${t.criticalLow} ` : ''}{t.criticalHigh !== null ? `>${t.criticalHigh}` : ''}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ color: 'var(--text-dim)' }}>{t.unit || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleOpenEditTest(t)}
                              className="btn-icon"
                              title="تعديل الفحص"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTestId(t.id)}
                              className="btn-icon"
                              style={{ color: 'var(--accent-rose)' }}
                              title="حذف الفحص"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANELS */}
      {activeTab === 'panels' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {panels.map((p) => (
            <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{p.name}</strong>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent-emerald)' }}>
                    {p.price?.toLocaleString()} {currency}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {p.description || 'باقة تشخيصية مجمعة'}
                </p>

                <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '6px' }}>
                  الفحوصات المشمولة ({p.items?.length || 0}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {p.items?.map((it: any) => (
                    <span key={it.id} className="badge badge-received" style={{ fontSize: '10.5px' }}>
                      {it.test?.name || it.testId}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <button
                  onClick={() => handleOpenEditPanel(p)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  <Edit3 size={13} />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => setDeletePanelId(p.id)}
                  className="btn-icon"
                  style={{ color: 'var(--accent-rose)' }}
                  title="حذف الباقة"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Test Modal */}
      {showTestModal && (
        <div className="modal-overlay" onClick={handleCloseTestModal}>
          <div
            className="modal-content"
            style={{
              maxWidth: '840px',
              width: '95vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingTestId ? 'تعديل بيانات الفحص المخبري' : 'إضافة فحص مخبري جديد'}
                </h3>
                {isFormDirty && (
                  <span style={{ fontSize: '11px', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    تعديلات غير محفوظة
                  </span>
                )}
              </div>
              <button type="button" onClick={handleCloseTestModal} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form
              ref={testFormRef}
              onSubmit={handleSaveTest}
              onChange={() => setIsFormDirty(true)}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label className="input-label">رمز الفحص (Code)</label>
                  <input
                    type="text"
                    placeholder="مثال: CBC"
                    className="input-control"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">اسم الفحص بالإنجليزية *</label>
                  <input
                    type="text"
                    placeholder="مثال: Complete Blood Count"
                    className="input-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">الاسم العربي للتوضيح</label>
                  <input
                    type="text"
                    placeholder="مثال: تحليل صورة الدم الشاملة"
                    className="input-control"
                    value={arabicName}
                    onChange={(e) => setArabicName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">القسم / التصنيف</label>
                  <select
                    className="select-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="أمراض الدم والتخثر">أمراض الدم والتخثر (Hematology)</option>
                    <option value="الكيمياء السريرية">الكيمياء السريرية (Biochemistry)</option>
                    <option value="الهرمونات والماركرات">الهرمونات والماركرات (Hormones)</option>
                    <option value="المناعة والمصول">المناعة والمصول (Immunology & Serology)</option>
                    <option value="الأحياء المجهرية">الأحياء المجهرية والزرع (Microbiology)</option>
                    <option value="الفحص العام والإدرار">الفحص العام والإدرار (Urinalysis & Stool)</option>
                    <option value="فحوصات أخرى">فحوصات أخرى</option>
                  </select>
                </div>
              </div>

              <SpecialtySelector
                specialtyId={specialtyId}
                groupId={groupId}
                sortOrder={sortOrder}
                onChange={(val) => {
                  setSpecialtyId(val.specialtyId);
                  setGroupId(val.groupId);
                  setSortOrder(val.sortOrder !== undefined ? val.sortOrder : null);
                  setIsFormDirty(true);
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">سعر الفحص ({currency}) *</label>
                  <input
                    type="number"
                    placeholder="مثال: 10000"
                    className="input-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="input-label">التكلفة التقديرية ({currency})</label>
                  <input
                    type="number"
                    placeholder="مثال: 3000"
                    className="input-control"
                    value={costEstimate}
                    onChange={(e) => setCostEstimate(e.target.value)}
                    min="0"
                  />
                </div>

                <div>
                  <label className="input-label">الوحدة القياسية (Unit)</label>
                  <input
                    type="text"
                    placeholder="مثال: mg/dL أو g/dL"
                    className="input-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>

              {/* Unified Clinical Reference Ranges Editor */}
              <ReferenceRangesEditor
                testName={name || 'فحص جديد'}
                unit={unit}
                ranges={referenceRanges}
                onChange={(newRanges) => {
                  setReferenceRanges(newRanges);
                  setIsFormDirty(true);
                }}
                criticalLow={criticalLow}
                criticalHigh={criticalHigh}
                onCriticalChange={(low, high) => {
                  setCriticalLow(low);
                  setCriticalHigh(high);
                  setIsFormDirty(true);
                }}
              />
              </div>

              {/* Sticky Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-card, #ffffff)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                  boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  اختصار للحفظ: <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-input-deep, #f1f5f9)', fontSize: '10px', border: '1px solid var(--border-color)' }}>Ctrl+S</kbd>
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={handleCloseTestModal} className="btn-secondary">
                    إلغاء
                  </button>
                  <button type="submit" className="btn-primary" style={{ minWidth: '120px' }}>
                    حفظ الفحص
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Panel Modal */}
      {showPanelModal && (
        <div className="modal-overlay" onClick={() => setShowPanelModal(false)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingPanelId ? 'تعديل الباقة التشخيصية' : 'إنشاء باقة تشخيصية جديدة'}
              </h3>
              <button onClick={() => setShowPanelModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePanel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">اسم الباقة *</label>
                  <input
                    type="text"
                    placeholder="مثال: باقة وظائف الكبد الكاملة (Liver Function)"
                    className="input-control"
                    value={panelName}
                    onChange={(e) => setPanelName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="input-label">سعر الباقة ({currency}) *</label>
                  <input
                    type="number"
                    placeholder="مثال: 25000"
                    className="input-control"
                    value={panelPrice}
                    onChange={(e) => setPanelPrice(e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">وصف الباقة</label>
                <input
                  type="text"
                  placeholder="مثال: تشمل فحوصات ALT, AST, Total Protein, Albumin, Bilirubin"
                  className="input-control"
                  value={panelDescription}
                  onChange={(e) => setPanelDescription(e.target.value)}
                />
              </div>

              {/* Panel Tests Picker */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>الفحوصات المشمولة في هذه الباقة:</label>
                  <span className="badge badge-ready">{selectedTestIdsForPanel.length} فحص مختار</span>
                </div>

                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="ابحث في الفحوصات لإضافتها..."
                    className="input-control"
                    style={{ paddingRight: '30px', fontSize: '12px', minHeight: '34px' }}
                    value={panelTestSearch}
                    onChange={(e) => setPanelTestSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px', maxHeight: '180px', overflowY: 'auto', padding: '4px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {tests
                    .filter((t) => !panelTestSearch || t.name.toLowerCase().includes(panelTestSearch.toLowerCase()) || (t.arabicName && t.arabicName.includes(panelTestSearch)))
                    .map((t) => {
                      const isSelected = selectedTestIdsForPanel.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTestIdsForPanel(selectedTestIdsForPanel.filter((id) => id !== t.id));
                            } else {
                              setSelectedTestIdsForPanel([...selectedTestIdsForPanel, t.id]);
                            }
                          }}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ color: isSelected ? '#fff' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                          {isSelected && <Check size={12} color="var(--accent-cyan)" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ الباقة
                </button>
                <button type="button" onClick={() => setShowPanelModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Test Modal */}
      <ConfirmModal
        isOpen={!!deleteTestId}
        title="حذف فحص مخبري"
        message="هل أنت متأكد من حذف هذا الفحص من الكتالوج نهائياً؟"
        type="danger"
        confirmText="نعم، احذف الفحص"
        cancelText="تراجع"
        onConfirm={handleConfirmDeleteTest}
        onCancel={() => setDeleteTestId(null)}
      />

      {/* Delete Panel Modal */}
      <ConfirmModal
        isOpen={!!deletePanelId}
        title="حذف باقة تشخيصية"
        message="هل أنت متأكد من حذف هذه الباقة المجمعة من الكتالوج؟"
        type="danger"
        confirmText="نعم، احذف الباقة"
        cancelText="تراجع"
        onConfirm={handleConfirmDeletePanel}
        onCancel={() => setDeletePanelId(null)}
      />

      {/* Unsaved Changes Confirm Modal */}
      <ConfirmModal
        isOpen={showDirtyConfirm}
        title="تجاهل التعديلات غير المحفوظة؟"
        message="هناك تعديلات غير محفوظة على بيانات هذا الفحص أو مدياته المرجعية. هل أنت متأكد من الإلغاء؟"
        type="danger"
        confirmText="نعم، تجاهل التعديلات"
        cancelText="الرجوع للنموذج"
        onConfirm={() => {
          setShowDirtyConfirm(false);
          setShowTestModal(false);
          setIsFormDirty(false);
        }}
        onCancel={() => setShowDirtyConfirm(false)}
      />

      {/* Specialties & Groups Management Modal */}
      <SpecialtiesManagerModal
        isOpen={showSpecialtiesModal}
        onClose={() => setShowSpecialtiesModal(false)}
        onChanged={loadCatalog}
      />
    </AppShell>
  );
}
