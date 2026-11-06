'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  Check,
  FlaskConical,
  CreditCard,
  Banknote,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchCatalogTests,
  addSampleTests,
  CatalogTestItem,
  AddSampleTestsPaymentMode,
} from '../api/addSampleTests';

export interface AddSampleTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId: string;
  sampleNumber: string | number;
  patientName: string;
  existingTestIds: string[];
  currency?: string;
  onSuccess: (updatedSample: any, addedTestsCount: number, paymentMode: AddSampleTestsPaymentMode) => void;
}

export function AddSampleTestsModal({
  isOpen,
  onClose,
  sampleId,
  sampleNumber,
  patientName,
  existingTestIds,
  currency = 'د.ع',
  onSuccess,
}: AddSampleTestsModalProps) {
  const [catalogTests, setCatalogTests] = useState<CatalogTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<AddSampleTestsPaymentMode>('CASH');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTestIds([]);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setPaymentMode('CASH');
    setError(null);

    let cancelled = false;
    setLoading(true);
    fetchCatalogTests()
      .then((list) => {
        if (!cancelled) {
          setCatalogTests(list);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'تعذر تحميل الفحوصات');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const existingSet = useMemo(() => new Set(existingTestIds.filter(Boolean)), [existingTestIds]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogTests.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [catalogTests]);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogTests.filter((t) => {
      if (t.active === false) return false;
      if (selectedCategory !== 'ALL' && (t.category || '').trim() !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const nameMatch = (t.name || '').toLowerCase().includes(q);
      const arMatch = (t.arabicName || '').toLowerCase().includes(q);
      const codeMatch = (t.code || '').toLowerCase().includes(q);
      return nameMatch || arMatch || codeMatch;
    });
  }, [catalogTests, searchQuery, selectedCategory]);

  const selectedTestsList = useMemo(() => {
    const map = new Map(catalogTests.map((t) => [t.id, t]));
    return selectedTestIds.map((id) => map.get(id)).filter(Boolean) as CatalogTestItem[];
  }, [catalogTests, selectedTestIds]);

  const addedTotalAmount = useMemo(() => {
    return selectedTestsList.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  }, [selectedTestsList]);

  const toggleTestSelection = (testId: string) => {
    if (existingSet.has(testId)) return;
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) {
      setError('يرجى اختيار فحص واحد على الأقل لإضافته للزيارة');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updatedSample = await addSampleTests({
        sampleId,
        testIds: selectedTestIds,
        paymentMode,
      });
      onSuccess(updatedSample, selectedTestIds.length, paymentMode);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إضافة الفحوصات');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 130,
        padding: '20px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '760px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'rgba(15, 118, 110, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'var(--text-main, #0f172a)' }}>
                إضافة فحص جديد للزيارة
              </h3>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px', fontWeight: 600 }}>
                المريض: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{patientName}</strong> • عينة رقم:{' '}
                <strong style={{ color: '#0f766e' }}>#{sampleNumber}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color="var(--text-muted, #64748b)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الفحص بالإنجليزي، العربي، أو الكود المختصر (مثل CBC, FBS, TSH)..."
              autoFocus
              style={{
                width: '100%',
                height: '40px',
                padding: '0 14px 0 38px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--bg-input, #f8fafc)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '13.5px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Categories Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: active ? '1.5px solid #0f766e' : '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: active ? 'rgba(15, 118, 110, 0.12)' : 'var(--bg-input, #f8fafc)',
                    color: active ? '#0f766e' : 'var(--text-muted, #64748b)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {cat === 'ALL' ? 'جميع التصنيفات' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: '10px 20px 0 20px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Tests Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px',
            alignContent: 'start',
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted, #64748b)',
                fontSize: '13.5px',
                fontWeight: 700,
              }}
            >
              جاري تحميل قائمة الفحوصات...
            </div>
          ) : filteredTests.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted, #64748b)',
                fontSize: '13.5px',
                fontWeight: 700,
              }}
            >
              لا توجد فحوصات مطابقة للبحث
            </div>
          ) : (
            filteredTests.map((test) => {
              const isAlreadyInSample = existingSet.has(test.id);
              const isSelected = selectedTestIds.includes(test.id);

              return (
                <div
                  key={test.id}
                  onClick={() => !isAlreadyInSample && toggleTestSelection(test.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isAlreadyInSample
                      ? '1px dashed var(--border-color, #cbd5e1)'
                      : isSelected
                        ? '2px solid #0f766e'
                        : '1px solid var(--border-color, #e2e8f0)',
                    backgroundColor: isAlreadyInSample
                      ? 'var(--bg-input, #f1f5f9)'
                      : isSelected
                        ? 'rgba(15, 118, 110, 0.08)'
                        : 'var(--bg-card, #ffffff)',
                    opacity: isAlreadyInSample ? 0.65 : 1,
                    cursor: isAlreadyInSample ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '6px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: 'var(--text-main, #0f172a)',
                          wordBreak: 'break-word',
                        }}
                        dir="ltr"
                      >
                        {test.code ? `${test.code} - ${test.name}` : test.name}
                      </div>
                      {test.arabicName && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)', fontWeight: 600, marginTop: '2px' }}>
                          {test.arabicName}
                        </div>
                      )}
                    </div>

                    {isAlreadyInSample ? (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        مضاف مسبقاً ✓
                      </span>
                    ) : (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: isSelected ? 'none' : '1.5px solid var(--border-color, #94a3b8)',
                          backgroundColor: isSelected ? '#0f766e' : 'transparent',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                      {test.category || 'عام'}
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#0f766e' }}>
                      {(Number(test.price) || 0).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Summary + Payment Mode Selection + Submit */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--bg-input, #f8fafc)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Payment Mode Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              طريقة المعالجة المالية للفحوصات المضافة:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: paymentMode === 'CASH' ? '2px solid #16a34a' : '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: paymentMode === 'CASH' ? '#f0fdf4' : 'var(--bg-card, #ffffff)',
                  color: paymentMode === 'CASH' ? '#15803d' : 'var(--text-main, #0f172a)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'right',
                }}
              >
                <Banknote size={18} color={paymentMode === 'CASH' ? '#16a34a' : '#64748b'} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 900 }}>قبض المبلغ نقداً الآن (مدفوع)</div>
                  <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: 600 }}>
                    يُضاف للصندوق ولا يزيد الدين المتبقي على المريض
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('DEBT')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: paymentMode === 'DEBT' ? '2px solid #dc2626' : '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: paymentMode === 'DEBT' ? '#fef2f2' : 'var(--bg-card, #ffffff)',
                  color: paymentMode === 'DEBT' ? '#b91c1c' : 'var(--text-main, #0f172a)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'right',
                }}
              >
                <CreditCard size={18} color={paymentMode === 'DEBT' ? '#dc2626' : '#64748b'} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 900 }}>إضافة للمتبقي على المريض (ذمة/دين)</div>
                  <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: 600 }}>
                    يُضاف المبلغ كرصيد غير مسدد على حساب العينة
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                الفحوصات المختارة:{' '}
                <strong style={{ color: 'var(--text-main, #0f172a)', fontSize: '14px' }}>{selectedTestIds.length}</strong>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                مبلغ الإضافة:{' '}
                <strong style={{ color: '#0f766e', fontSize: '15px' }}>
                  {addedTotalAmount.toLocaleString()} {currency}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={submitting || selectedTestIds.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedTestIds.length === 0 ? '#94a3b8' : '#0f766e',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: submitting || selectedTestIds.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: selectedTestIds.length > 0 ? '0 2px 6px rgba(15, 118, 110, 0.25)' : 'none',
                }}
              >
                <Plus size={16} />
                <span>{submitting ? 'جاري الإضافة...' : 'إضافة الفحوصات للزيارة'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSampleTestsModal;
