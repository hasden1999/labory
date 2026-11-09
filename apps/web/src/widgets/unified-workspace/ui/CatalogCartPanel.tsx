'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Star, Plus, Check, FolderPlus, Trash2 } from 'lucide-react';
import { UnifiedWorkspaceReturn } from '../model/types';
import { RECEPTION_CATEGORIES } from '../lib/catalogOrdering';
import { useToast } from '../../../components/Toast';
import { apiRequest } from '../../../lib/api';

interface CatalogCartPanelProps {
  workspace: UnifiedWorkspaceReturn;
  onOpenSpecialModal?: (modalType: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'CHEMISTRY' | 'MICROBIOLOGY') => void;
}

const PROFILES = [
  { key: 'thyroid', label: '+ Thyroid' },
  { key: 'diabetes', label: '+ Diabetes' },
  { key: 'liver', label: '+ Liver' },
  { key: 'kidney', label: '+ Kidney' },
  { key: 'lipid', label: '+ Lipid' },
];

export default function CatalogCartPanel({ workspace, onOpenSpecialModal }: CatalogCartPanelProps) {
  const toast = useToast();

  const {
    catalogTests = [],
    selectedTests,
    addTestToCart,
    removeTestFromCart,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredCatalog,
    categoryCounts = {},
    applyBundle,
    customPanels = [],
    applyPanel,
    refreshPanels,
  } = workspace;

  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom Panels Modal & Interaction State
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelPrice, setNewPanelPrice] = useState('');
  const [newPanelDescription, setNewPanelDescription] = useState('');
  const [selectedTestIdsForNewPanel, setSelectedTestIdsForNewPanel] = useState<string[]>([]);
  const [panelSearchQuery, setPanelSearchQuery] = useState('');
  const [isSubmittingPanel, setIsSubmittingPanel] = useState(false);
  const [hoveredCustomPanelId, setHoveredCustomPanelId] = useState<string | null>(null);

  // Inline Price Editing State (Item 11)
  const [editingPriceTestId, setEditingPriceTestId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);

  const handleSavePrice = async (testId: string) => {
    const cleanNum = tempPriceValue.replace(/[^0-9]/g, '');
    const num = parseInt(cleanNum, 10);
    if (isNaN(num) || num < 0) {
      toast.error('يرجى كتابة سعر صحيح');
      return;
    }
    try {
      setSavingPrice(true);
      if (workspace.updateCatalogTestPrice) {
        await workspace.updateCatalogTestPrice(testId, num);
        toast.success('تم تحديث وحفظ سعر الفحص بنجاح!');
      }
      setEditingPriceTestId(null);
    } catch (err: any) {
      toast.error(err?.message || 'فشل تحديث السعر');
    } finally {
      setSavingPrice(false);
    }
  };

  // Filter out the 5 standard built-in profiles to only show true custom user-added panels
  const userCustomPanels = useMemo(() => {
    return (customPanels || []).filter((panel: any) => {
      if (!panel || !panel.id) return false;
      const id = String(panel.id).toLowerCase();
      if (id.startsWith('panel_')) return true;
      const code = String(panel.code || '').toLowerCase();
      const name = String(panel.name || '').toLowerCase();
      if (['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'p-8', 'p-9', 'p-10', 'p-11', 'p-12', 'p-13', 'p-14', 'p-15', 'p-16', 'p-17', 'p-18'].includes(id)) return false;
      if (['lipid', 'kidney', 'liver', 'diabetes', 'thyroid'].includes(code)) return false;
      if (id.startsWith('panel-lipid') || id.startsWith('panel-kidney') || id.startsWith('panel-liver') || id.startsWith('panel-diabetes') || id.startsWith('panel-thyroid')) return false;
      if (name.includes('دهون الدم') || name.includes('وظائف الكلى') || name.includes('وظائف الكبد') || name.includes('مرضى السكري') || name.includes('الغدة الدرقية')) return false;
      return true;
    });
  }, [customPanels]);

  // Sum of individual test prices in the custom panel creation modal
  const sumOfSelectedPrices = useMemo(() => {
    const selectedSet = new Set(selectedTestIdsForNewPanel);
    return (catalogTests || [])
      .filter((t) => selectedSet.has(String(t.id)))
      .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  }, [selectedTestIdsForNewPanel, catalogTests]);

  // Auto-fill price suggestion when tests are picked
  useEffect(() => {
    if (sumOfSelectedPrices > 0 && (!newPanelPrice || newPanelPrice === '0')) {
      setNewPanelPrice(String(sumOfSelectedPrices));
    }
  }, [sumOfSelectedPrices]);

  // Filter tests inside the modal
  const filteredCatalogForNewPanel = useMemo(() => {
    if (!panelSearchQuery.trim()) return catalogTests;
    const q = panelSearchQuery.toLowerCase().trim();
    return (catalogTests || []).filter((t: any) => {
      const name = (t.name || '').toLowerCase();
      const code = (t.code || '').toLowerCase();
      const arabic = (t.arabicName || '').toLowerCase();
      return name.includes(q) || code.includes(q) || arabic.includes(q);
    });
  }, [catalogTests, panelSearchQuery]);

  // Create Custom Panel
  const handleCreateCustomPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPanelName.trim() || selectedTestIdsForNewPanel.length === 0) {
      toast.warning('يرجى كتابة اسم الباقة واختيار فحص واحد على الأقل', 'بيانات ناقصة');
      return;
    }

    try {
      setIsSubmittingPanel(true);
      const payload = {
        name: newPanelName.trim(),
        description: newPanelDescription.trim() || undefined,
        price: Number(newPanelPrice) || 0,
        testIds: selectedTestIdsForNewPanel,
      };

      await apiRequest('/tests/panels', 'POST', payload);
      toast.success(`تم إنشاء باقة (${newPanelName.trim()}) بنجاح!`, 'تم الحفظ');
      setShowAddPanelModal(false);
      setNewPanelName('');
      setNewPanelPrice('');
      setNewPanelDescription('');
      setSelectedTestIdsForNewPanel([]);
      setPanelSearchQuery('');
      if (refreshPanels) {
        await refreshPanels();
      }
    } catch (err: any) {
      toast.error(err?.message || 'خطأ أثناء إنشاء الباقة', 'فشل الحفظ');
    } finally {
      setIsSubmittingPanel(false);
    }
  };

  // Delete Custom Panel
  const handleDeleteCustomPanel = async (panel: any) => {
    if (!panel || !panel.id) return;
    const confirmed = window.confirm(`هل أنت متأكد من حذف باقة "${panel.name}"؟`);
    if (!confirmed) return;

    try {
      await apiRequest(`/tests/panels/${panel.id}`, 'DELETE');
      toast.success(`تم حذف باقة "${panel.name}" بنجاح`, 'تم الحذف');
      if (refreshPanels) {
        await refreshPanels();
      }
    } catch (err: any) {
      toast.error(err?.message || 'خطأ أثناء حذف الباقة', 'فشل الحذف');
    }
  };

  // Set of selected test IDs & Codes for O(1) checks
  const selectedTestIds = useMemo(() => {
    return new Set(selectedTests.map((t) => String(t.id)));
  }, [selectedTests]);

  const selectedTestCodes = useMemo(() => {
    return new Set(selectedTests.map((t) => (t.code || '').toUpperCase().trim()).filter(Boolean));
  }, [selectedTests]);

  const isTestSelected = useCallback(
    (test: any) => {
      if (!test) return false;
      if (selectedTestIds.has(String(test.id))) return true;
      const code = (test.code || '').toUpperCase().trim();
      return code ? selectedTestCodes.has(code) : false;
    },
    [selectedTestIds, selectedTestCodes]
  );

  // Helper to determine if a test has a specialized form
  const hasDedicatedForm = useCallback((test: any): boolean => {
    const code = (test.code || '').toUpperCase().trim();
    const name = (test.name || '').toLowerCase().trim();
    return (
      code === 'GUE' ||
      code === 'GSE' ||
      code === 'CBC' ||
      code === 'SFA' ||
      code === 'SEMEN' ||
      name.includes('urine') ||
      name.includes('إدرار') ||
      name.includes('stool') ||
      name.includes('خروج') ||
      name.includes('semen')
    );
  }, []);

  const handleToggleTest = useCallback(
    (test: any) => {
      const selected = isTestSelected(test);
      if (selected) {
        removeTestFromCart(test.id);
      } else {
        addTestToCart(test);
      }
    },
    [isTestSelected, removeTestFromCart, addTestToCart]
  );

  // Global key listener for '/' search focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchQuery('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCatalog.length > 0) {
        const target = filteredCatalog[highlightedIndex] || filteredCatalog[0];
        if (target) {
          handleToggleTest(target);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredCatalog.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredCatalog.length) % Math.max(1, filteredCatalog.length));
    }
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: '340px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '14px',
        border: '2.5px solid #0d9488',
        boxShadow: '0 4px 16px rgba(13, 148, 136, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* 1. Panel Header: Prominent Vivid Teal Section 2 Banner */}
      <div
        dir="rtl"
        style={{
          padding: '13px 16px',
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 900,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.24)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            القسم 2
          </span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
            قائمة اختيار الفحوصات
          </h2>
        </div>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            padding: '3px 10px',
            borderRadius: '9999px',
          }}
        >
          {selectedTests.length} فحص مختار
        </span>
      </div>

      {/* 2. Search Bar */}
      <div style={{ padding: '12px 16px 8px 16px', flexShrink: 0 }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="ابحث بالاسم أو الرمز (مثل CBC, FBS, GUE)..."
            style={{
              width: '100%',
              height: '38px',
              padding: '0 38px 0 32px',
              fontSize: '14px',
              color: 'var(--text-main)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                left: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Profiles Row */}
      <div
        style={{
          padding: '0 16px 10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            direction: 'rtl',
          }}
        >
          الباقات السريعة:
        </span>
        {PROFILES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              applyBundle(p.key);
              toast.info(`Added ${p.label.replace('+', '').trim()} profile`);
            }}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-teal)',
              backgroundColor: 'rgba(20, 184, 166, 0.12)',
              border: '1px solid rgba(20, 184, 166, 0.25)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0f766e';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.12)';
              e.currentTarget.style.color = 'var(--accent-teal)';
            }}
          >
            {p.label}
          </button>
        ))}

        {/* Custom User-Added Panels (Rendered next to the packages in the picture) */}
        {userCustomPanels.map((panel: any) => (
          <div
            key={panel.id}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onMouseEnter={() => setHoveredCustomPanelId(panel.id)}
            onMouseLeave={() => setHoveredCustomPanelId(null)}
          >
            <button
              type="button"
              onClick={() => {
                if (applyPanel) {
                  const count = applyPanel(panel);
                  toast.info(`Added ${panel.name} (${count} tests)`);
                }
              }}
              title={panel.description || panel.name}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                backgroundColor: 'var(--accent-cyan-subtle)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-cyan-subtle)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
              }}
            >
              <span>+ {panel.name} {Number(panel.price || 0) > 0 ? `(${Number(panel.price).toLocaleString()} د.ع)` : ''}</span>
            </button>
            {hoveredCustomPanelId === panel.id && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCustomPanel(panel);
                }}
                title="حذف هذه الباقة"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '-6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  zIndex: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add Package Button */}
        <button
          type="button"
          onClick={() => setShowAddPanelModal(true)}
          title="إضافة باقة تحاليل مخصصة جديدة لتظهر هنا"
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-input)',
            border: '1px dashed var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = '#0f766e';
            e.currentTarget.style.color = 'var(--accent-teal)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-input)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Plus size={13} />
          <span>إضافة باقة</span>
        </button>
      </div>

      {/* 4. Body Layout: Category Rail on Right + Tests List on Left */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Category Rail (Right edge inside panel in RTL) */}
        <div
          style={{
            width: '132px',
            borderLeft: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '6px 0',
            flexShrink: 0,
          }}
        >
          {RECEPTION_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                  border: 'none',
                  borderRight: isActive ? '3px solid var(--accent-teal)' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'right',
                  width: '100%',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cat.isStar && <Star size={13} fill="var(--accent-teal)" color="var(--accent-teal)" />}
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--accent-teal)' : 'var(--text-main)',
                    }}
                  >
                    {cat.label}
                  </span>
                  {cat.id === 'MOST_USED' && (
                    <span
                      title="قائمة ذكية يتم التعرف عليها وترتيبها تلقائياً حسب الفحوصات الأكثر طلباً واستخداماً في المختبر"
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: 'var(--accent-teal)',
                        backgroundColor: 'rgba(20, 184, 166, 0.18)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      تلقائي
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)',
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tests List & Headers Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Subheader: Sorting hint & Columns */}
          <div
            style={{
              padding: '6px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--table-header-bg)',
              flexShrink: 0,
            }}
          >
            {/* Left columns (Price & Code) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span>Price (IQD)</span>
              <span>Code</span>
            </div>

            {/* Right columns (Sorting hint & Test) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 500,
                  color: 'var(--accent-teal)',
                }}
              >
                مرتبة حسب الأهمية السريرية وتكرار الطلب في المختبر
              </span>
              <span>Test</span>
            </div>
          </div>

          {/* Tests List (Single-line rows) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2px 0',
            }}
          >
          {filteredCatalog.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No matching tests found.
            </div>
          ) : (
            filteredCatalog.map((test, index) => {
              const selected = isTestSelected(test);
              const dedicatedForm = hasDedicatedForm(test);
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={test.id || test.code}
                  onClick={() => handleToggleTest(test)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    backgroundColor: selected
                      ? 'rgba(20, 184, 166, 0.14)'
                      : isHighlighted
                      ? 'var(--bg-card-hover)'
                      : 'transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = isHighlighted ? 'var(--bg-card-hover)' : 'transparent';
                  }}
                >
                  {/* Right side: Checkbox + Code + Name + Form Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', flex: 1, overflow: 'hidden' }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}} // Handled by row click
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#0f766e',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    {test.code && (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: selected ? '#0f766e' : 'var(--accent-teal, #0d9488)',
                          backgroundColor: selected ? 'rgba(15, 118, 110, 0.18)' : 'rgba(20, 184, 166, 0.12)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          letterSpacing: '0.4px',
                          flexShrink: 0,
                          direction: 'ltr',
                          unicodeBidi: 'isolate',
                        }}
                      >
                        {test.code}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: selected ? 700 : 500,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        direction: 'ltr',
                        unicodeBidi: 'isolate',
                        textAlign: 'left',
                        minWidth: '80px',
                      }}
                    >
                      {test.name}
                    </span>
                    {dedicatedForm && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--color-warning)',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        فورمة
                      </span>
                    )}
                  </div>

                  {/* Left side: Price (with inline editing support) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >

                    {editingPriceTestId === test.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <input
                          type="text"
                          value={tempPriceValue}
                          onChange={(e) => setTempPriceValue(e.target.value.replace(/[^0-9]/g, ''))}
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await handleSavePrice(test.id);
                            } else if (e.key === 'Escape') {
                              setEditingPriceTestId(null);
                            }
                          }}
                          style={{
                            width: '70px',
                            height: '24px',
                            padding: '0 4px',
                            fontSize: '12px',
                            fontWeight: 800,
                            borderRadius: '4px',
                            border: '1.5px solid var(--accent-cyan)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                            textAlign: 'center',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          disabled={savingPrice}
                          onClick={() => handleSavePrice(test.id)}
                          style={{
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: 800,
                            borderRadius: '4px',
                            border: 'none',
                            background: '#0f766e',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPriceTestId(null)}
                          style={{
                            padding: '2px 4px',
                            fontSize: '10px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPriceTestId(test.id);
                          setTempPriceValue(String(test.price || 0));
                        }}
                        title="اضغط لتعديل السعر وحفظه في البرنامج مباشرة"
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: selected ? 'var(--accent-teal)' : 'var(--text-main)',
                          direction: 'ltr',
                          unicodeBidi: 'isolate',
                          minWidth: '55px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {Number(test.price || 0).toLocaleString()} IQD
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

    {/* Modal: Add Custom Diagnostic Package */}
    {showAddPanelModal && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(3px)',
          direction: 'rtl',
        }}
        onClick={() => setShowAddPanelModal(false)}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-card-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={20} color="var(--accent-teal)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                إضافة باقة تحاليل مخصصة
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPanelModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleCreateCustomPanel} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Panel Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  اسم الباقة <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باقة الفيتامينات، باقة الرياضيين، باقة الشامل الصغير..."
                  value={newPanelName}
                  onChange={(e) => setNewPanelName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    direction: 'rtl',
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    سعر الباقة (د.ع) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {sumOfSelectedPrices > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      مجموع الفحوصات الفردية: <strong style={{ color: 'var(--accent-teal)' }}>{sumOfSelectedPrices.toLocaleString()} د.ع</strong>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  placeholder="حدد سعر الباقة..."
                  value={newPanelPrice}
                  onChange={(e) => setNewPanelPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    direction: 'rtl',
                  }}
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  وصف الباقة <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(اختياري)</span>
                </label>
                <input
                  type="text"
                  placeholder="ملاحظات أو وصف لمحتوى الباقة..."
                  value={newPanelDescription}
                  onChange={(e) => setNewPanelDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    direction: 'rtl',
                  }}
                />
              </div>

              {/* Tests Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    الفحوصات المشمولة بالباقة <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-teal)', backgroundColor: 'rgba(20, 184, 166, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                    تم اختيار {selectedTestIdsForNewPanel.length} فحص
                  </span>
                </div>

                {/* Filter Tests Input */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="ابحث عن فحص لإضافته للباقة بالاسم أو الرمز..."
                    value={panelSearchQuery}
                    onChange={(e) => setPanelSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      outline: 'none',
                      direction: 'rtl',
                    }}
                  />
                </div>

                {/* Scrollable Tests Picker */}
                <div
                  style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  {filteredCatalogForNewPanel.slice(0, 60).map((test: any) => {
                    const isSelected = selectedTestIdsForNewPanel.includes(String(test.id));
                    return (
                      <div
                        key={test.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTestIdsForNewPanel(prev => prev.filter(id => id !== String(test.id)));
                          } else {
                            setSelectedTestIdsForNewPanel(prev => Array.from(new Set([...prev, String(test.id)])));
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? 'rgba(20, 184, 166, 0.16)' : 'var(--bg-card)',
                          border: `1px solid ${isSelected ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              border: `1.5px solid ${isSelected ? '#0f766e' : 'var(--text-dim)'}`,
                              backgroundColor: isSelected ? '#0f766e' : 'var(--bg-input)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                          </div>
                          {test.code && (
                            <span style={{ fontSize: '11px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent-teal, #0d9488)', fontWeight: 800, fontFamily: 'monospace' }}>
                              {test.code}
                            </span>
                          )}
                          <span style={{ fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)' }}>
                            {test.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {(Number(test.price) || 0).toLocaleString()} د.ع
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddPanelModal(false)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmittingPanel || !newPanelName.trim() || selectedTestIdsForNewPanel.length === 0}
                style={{
                  padding: '6px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: isSubmittingPanel || !newPanelName.trim() || selectedTestIdsForNewPanel.length === 0 ? 'var(--text-dim)' : '#0f766e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSubmittingPanel || !newPanelName.trim() || selectedTestIdsForNewPanel.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSubmittingPanel ? 'جاري الحفظ...' : 'حفظ وإضافة الباقة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  );
}
