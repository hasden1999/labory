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
  Sparkles
} from 'lucide-react';

export default function CatalogPage() {
  const toast = useToast();
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
        costEstimate: costEstimate ? Number(costEstimate) : undefined,
        refRangeLow: refRangeLow ? Number(refRangeLow) : undefined,
        refRangeHigh: refRangeHigh ? Number(refRangeHigh) : undefined,
        normalMaleLow: normalMaleLow ? Number(normalMaleLow) : undefined,
        normalMaleHigh: normalMaleHigh ? Number(normalMaleHigh) : undefined,
        normalFemaleLow: normalFemaleLow ? Number(normalFemaleLow) : undefined,
        normalFemaleHigh: normalFemaleHigh ? Number(normalFemaleHigh) : undefined,
        criticalLow: criticalLow ? Number(criticalLow) : undefined,
        criticalHigh: criticalHigh ? Number(criticalHigh) : undefined,
        refRangeText: refRangeText.trim() || undefined,
        unit: unit.trim() || undefined,
        sampleType,
      };

      if (editingTestId) {
        await apiRequest(`/tests/${editingTestId}`, 'PATCH', payload);
        toast.success('تم تعديل بيانات الفحص المخبري بنجاح!', 'تم التحديث');
      } else {
        await apiRequest('/tests', 'POST', payload);
        toast.success('تمت إضافة الفحص الجديد للكتالوج بنجاح!', 'تم الحفظ');
      }

      setShowTestModal(false);
      loadCatalog();
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
      loadCatalog();
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
      loadCatalog();
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
      loadCatalog();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حذف الباقة', 'فشل الحذف');
    }
  };

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(tests.map((t) => t.category).filter(Boolean)))];
  }, [tests]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchSearch = !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.arabicName && t.arabicName.includes(searchQuery)) ||
        (t.code && t.code.toLowerCase().includes(searchQuery.toLowerCase()));
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

        <div style={{ display: 'flex', gap: '8px' }}>
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
                        <td style={{ fontWeight: 900, color: 'var(--accent-cyan)' }}>{t.price?.toLocaleString()} د.ع</td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.costEstimate ? `${t.costEstimate.toLocaleString()} د.ع` : '-'}</td>
                        <td style={{ fontSize: '11.5px' }}>
                          {t.refRangeText || (t.refRangeLow !== null ? `${t.refRangeLow} - ${t.refRangeHigh}` : '-')}
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
                    {p.price?.toLocaleString()} د.ع
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
                  <label className="input-label">سعر الفحص (د.ع) *</label>
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
                  <label className="input-label">التكلفة التقديرية (د.ع)</label>
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
                    <label className="input-label">ذكور ♂ (الأدنى - الأعلى)</label>
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
                    <label className="input-label">إناث ♀ (الأدنى - الأعلى)</label>
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
                  <label className="input-label">سعر الباقة (د.ع) *</label>
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
