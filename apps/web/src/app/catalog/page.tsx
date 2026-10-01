'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
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

  // Modals
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const [deletePanelId, setDeletePanelId] = useState<string | null>(null);

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
    setReferenceRanges([]);
    resetRangeForm();
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
    setReferenceRanges(test.referenceRanges && Array.isArray(test.referenceRanges) ? JSON.parse(JSON.stringify(test.referenceRanges)) : []);
    resetRangeForm();
    setShowTestModal(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.warning('يرجى ملء اسم الفحص والسعر على الأقل', 'بيانات ناقصة');
      return;
    }

    try {
      const payload = {
        code: code.trim() || undefined,
        name: name.trim(),
        arabicName: arabicName.trim() || undefined,
        category,
        price: Number(price),
        costEstimate: costEstimate !== '' ? Number(costEstimate) : null,
        refRangeLow: refRangeLow !== '' ? Number(refRangeLow) : null,
        refRangeHigh: refRangeHigh !== '' ? Number(refRangeHigh) : null,
        normalMaleLow: normalMaleLow !== '' ? Number(normalMaleLow) : null,
        normalMaleHigh: normalMaleHigh !== '' ? Number(normalMaleHigh) : null,
        normalFemaleLow: normalFemaleLow !== '' ? Number(normalFemaleLow) : null,
        normalFemaleHigh: normalFemaleHigh !== '' ? Number(normalFemaleHigh) : null,
        criticalLow: criticalLow !== '' ? Number(criticalLow) : null,
        criticalHigh: criticalHigh !== '' ? Number(criticalHigh) : null,
        refRangeText: refRangeText.trim() || null,
        unit: unit.trim() || null,
        sampleType,
        referenceRanges: referenceRanges.length > 0 ? referenceRanges : undefined,
      };

      if (editingTestId) {
        await apiRequest(`/tests/${editingTestId}`, 'PATCH', payload);
        toast.success('تم تعديل بيانات الفحص المخبري بنجاح!', 'تم التحديث');
      } else {
        await apiRequest('/tests', 'POST', payload);
        toast.success('تمت إضافة الفحص الجديد للكتالوج بنجاح!', 'تم الحفظ');
      }

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
                    filteredTests.map((t) => (
                      <tr key={t.id}>
                        <td>
                          {t.code ? (
                            <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              {t.code}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>-</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{t.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.arabicName || '-'}</td>
                        <td>
                          <span className="badge badge-received" style={{ fontSize: '10px' }}>{t.category || 'عام'}</span>
                        </td>
                        <td style={{ fontWeight: 900, color: 'var(--accent-cyan)' }}>{t.price?.toLocaleString()} {currency}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.costEstimate ? `${t.costEstimate.toLocaleString()} ${currency}` : '-'}</td>
                        <td style={{ fontSize: '11.5px' }}>
                          <span dir="ltr" style={{ display: 'inline-block', direction: 'ltr', unicodeBidi: 'isolate' }}>
                            {t.refRangeText || (t.refRangeLow != null && t.refRangeHigh != null ? `${t.refRangeLow} - ${t.refRangeHigh}` : (t.refRangeLow != null ? `>= ${t.refRangeLow}` : (t.refRangeHigh != null ? `<= ${t.refRangeHigh}` : '-')))}
                          </span>
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
                    ))
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
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingTestId ? 'تعديل بيانات الفحص المخبري' : 'إضافة فحص مخبري جديد'}
              </h3>
              <button onClick={() => setShowTestModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

              {/* Reference Range Section */}
              <div style={{ padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'block', marginBottom: '8px' }}>
                  المعدلات الطبيعية المعتمدة (Reference Intervals):
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label className="input-label">المعدل العام (الأدنى - الأعلى)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="الأدنى"
                        className="input-control"
                        value={refRangeLow}
                        onChange={(e) => setRefRangeLow(e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="الأعلى"
                        className="input-control"
                        value={refRangeHigh}
                        onChange={(e) => setRefRangeHigh(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">الحدود الحرجة الطارئة (Panic Low - High)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="أقل من (حرج)"
                        className="input-control"
                        style={{ color: 'var(--accent-rose)' }}
                        value={criticalLow}
                        onChange={(e) => setCriticalLow(e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="أعلى من (حرج)"
                        className="input-control"
                        style={{ color: 'var(--accent-rose)' }}
                        value={criticalHigh}
                        onChange={(e) => setCriticalHigh(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="input-label">ذكور (Male) (الأدنى - الأعلى)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="أدنى ذكر"
                        className="input-control"
                        value={normalMaleLow}
                        onChange={(e) => setNormalMaleLow(e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="أعلى ذكر"
                        className="input-control"
                        value={normalMaleHigh}
                        onChange={(e) => setNormalMaleHigh(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">إناث (Female) (الأدنى - الأعلى)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="أدنى أنثى"
                        className="input-control"
                        value={normalFemaleLow}
                        onChange={(e) => setNormalFemaleLow(e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="أعلى أنثى"
                        className="input-control"
                        value={normalFemaleHigh}
                        onChange={(e) => setNormalFemaleHigh(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Tier Reference Ranges Section (Item 5) */}
              <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1.5px solid var(--accent-cyan-subtle, #0284c7)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={15} />
                      <span>المديات المرجعية المتقدمة حسب الجنس والعمر (Multiple Reference Ranges)</span>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      تحديد مديات مفصلة للرجال، النساء، الأطفال، وحديثي الولادة مع توثيق المصدر السريري
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleAutoFillPcv}
                      title="ملء تلقائي معتمد من Mayo Clinic و Harriet Lane لـ PCV"
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px', color: '#0284c7', borderColor: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={12} />
                      <span>ملء معتمد لـ PCV</span>
                    </button>

                    {!showRangeForm && (
                      <button
                        type="button"
                        onClick={() => {
                          resetRangeForm();
                          setShowRangeForm(true);
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} />
                        <span>+ إضافة مدى</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Existing Ranges List */}
                {referenceRanges.length === 0 ? (
                  <div style={{ padding: '12px', background: 'var(--bg-input-deep)', borderRadius: '6px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)' }}>
                    لا توجد مديات فرعية مخصصة مسجلة لهذا الفحص — سيتم اعتماد المعدل العام أعلاه افتراضياً.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {referenceRanges.map((r, idx) => (
                      <div
                        key={r.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--bg-input-deep)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{r.label}</span>
                          <span style={{ padding: '1px 6px', borderRadius: '4px', background: r.sex === 'M' ? '#dbeafe' : r.sex === 'F' ? '#fce7f3' : '#f1f5f9', color: r.sex === 'M' ? '#1d4ed8' : r.sex === 'F' ? '#be185d' : '#475569', fontSize: '10px', fontWeight: 700 }}>
                            {r.sex === 'M' ? 'ذكور (M)' : r.sex === 'F' ? 'إناث (F)' : 'الكل (Any)'}
                          </span>
                          {(r.ageMin != null || r.ageMax != null) && (
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              العمر: {r.ageMin ?? 0} - {r.ageMax ?? '∞'} {r.ageUnit === 'days' ? 'يوم' : r.ageUnit === 'months' ? 'شهر' : 'سنة'}
                            </span>
                          )}
                          <span dir="ltr" style={{ fontWeight: 800, color: 'var(--accent-cyan)', direction: 'ltr', unicodeBidi: 'isolate' }}>
                            {r.text || (r.low != null && r.high != null ? `${r.low} - ${r.high}` : (r.low != null ? `>= ${r.low}` : r.high != null ? `<= ${r.high}` : '-'))} {r.unit || unit || ''}
                          </span>
                          {r.source && (
                            <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }} title={r.source}>
                              <ShieldCheck size={11} /> {r.source.substring(0, 30)}...
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleMoveRange(idx, 'UP')}
                            disabled={idx === 0}
                            style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', padding: '2px' }}
                            title="تحريك لأعلى"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRange(idx, 'DOWN')}
                            disabled={idx === referenceRanges.length - 1}
                            style={{ background: 'none', border: 'none', cursor: idx === referenceRanges.length - 1 ? 'default' : 'pointer', color: idx === referenceRanges.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', padding: '2px' }}
                            title="تحريك لأسفل"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditRange(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: '2px' }}
                            title="تعديل المدى"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRange(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                            title="حذف المدى"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-form to Add or Edit Range */}
                {showRangeForm && (
                  <div style={{ padding: '12px', background: 'var(--bg-input-deep)', borderRadius: '8px', border: '1px solid var(--accent-cyan)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{rangeEditIndex !== null ? 'تعديل بيانات المدى المرجعي' : 'إضافة مدى مرجعي جديد'}</span>
                      <button type="button" onClick={resetRangeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label className="input-label">التسمية (Label) *</label>
                        <input
                          type="text"
                          placeholder="مثال: البالغين / حديثي الولادة"
                          className="input-control"
                          value={rangeLabel}
                          onChange={(e) => setRangeLabel(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">الجنس (Sex)</label>
                        <select className="input-control" value={rangeSex} onChange={(e) => setRangeSex(e.target.value as any)}>
                          <option value="any">الكل (Any)</option>
                          <option value="M">ذكور (M)</option>
                          <option value="F">إناث (F)</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label">أدنى عمر</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          className="input-control"
                          value={rangeAgeMin}
                          onChange={(e) => setRangeAgeMin(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">أعلى عمر</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="120"
                          className="input-control"
                          value={rangeAgeMax}
                          onChange={(e) => setRangeAgeMax(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">وحدة العمر</label>
                        <select className="input-control" value={rangeAgeUnit} onChange={(e) => setRangeAgeUnit(e.target.value as any)}>
                          <option value="years">سنوات (Years)</option>
                          <option value="months">أشهر (Months)</option>
                          <option value="days">أيام (Days)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '8px' }}>
                      <div>
                        <label className="input-label">الحد الأدنى (Low)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="الأدنى"
                          className="input-control"
                          value={rangeLow}
                          onChange={(e) => setRangeLow(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">الحد الأعلى (High)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="الأعلى"
                          className="input-control"
                          value={rangeHigh}
                          onChange={(e) => setRangeHigh(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">نص المدى المرجعي (Text Range)</label>
                        <input
                          type="text"
                          placeholder="مثال: 40.0 - 52.0 أو مرغوب <200"
                          className="input-control"
                          value={rangeText}
                          onChange={(e) => setRangeText(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">الوحدة (Unit)</label>
                        <input
                          type="text"
                          placeholder={unit || 'الوحدة'}
                          className="input-control"
                          value={rangeUnit}
                          onChange={(e) => setRangeUnit(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr', gap: '8px' }}>
                      <div>
                        <label className="input-label">المصدر المعتمد (Source)</label>
                        <input
                          type="text"
                          placeholder="مثال: Mayo Clinic / WHO / Tietz"
                          className="input-control"
                          value={rangeSource}
                          onChange={(e) => setRangeSource(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">رابط المصدر (Source URL)</label>
                        <input
                          type="url"
                          placeholder="https://www.mayocliniclabs.com/..."
                          className="input-control"
                          value={rangeSourceUrl}
                          onChange={(e) => setRangeSourceUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">ملاحظات سريرية (Note)</label>
                        <input
                          type="text"
                          placeholder="ملاحظة حول الطريقة المخبرية..."
                          className="input-control"
                          value={rangeNote}
                          onChange={(e) => setRangeNote(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button type="button" onClick={handleSaveRange} className="btn-primary" style={{ fontSize: '11px', padding: '6px 14px' }}>
                        {rangeEditIndex !== null ? 'تحديث المدى' : 'حفظ المدى'}
                      </button>
                      <button type="button" onClick={resetRangeForm} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ الفحص
                </button>
                <button type="button" onClick={() => setShowTestModal(false)} className="btn-secondary">
                  إلغاء
                </button>
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
    </AppShell>
  );
}
