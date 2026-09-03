'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Package, Plus, AlertTriangle, Clock, Trash2, X, Check, Calendar, AlertCircle, Search, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function InventoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ expiredCount: 0, expiringSoonCount: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'EXPIRED' | 'EXPIRING' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Item Form
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('عبوة');
  const [quantity, setQuantity] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const invRes = await apiRequest('/inventory');
      const alertsRes = await apiRequest('/inventory/alerts');

      setItems(invRes || []);
      setAlerts(alertsRes || { expiredCount: 0, expiringSoonCount: 0, lowStockCount: 0 });
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب بيانات المخزون', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !quantity || !costPerUnit) {
      toast.warning('الرجاء إدخال الحقول الأساسية للمادة (الاسم، الكمية، وسعر التكلفة)', 'بيانات ناقصة');
      return;
    }

    try {
      await apiRequest('/inventory', 'POST', {
        name: itemName.trim(),
        unit,
        quantity: Number(quantity),
        reorderThreshold: Number(reorderThreshold),
        costPerUnit: Number(costPerUnit),
        expiryDate: expiryDate ? expiryDate : undefined,
        supplier,
      });

      setShowItemModal(false);
      setItemName('');
      setUnit('عبوة');
      setQuantity('');
      setReorderThreshold('5');
      setCostPerUnit('');
      setExpiryDate('');
      setSupplier('');
      toast.success('تمت إضافة مادة المخزون بنجاح!', 'حفظ المادة');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حفظ مادة المخزون', 'فشل الحفظ');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiRequest('/inventory/' + deleteConfirmId, 'DELETE');
      toast.success('تم حذف مادة المخزون بنجاح!', 'تم الحذف');
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء الحذف', 'خطأ');
    }
  };

  // Quick Stock Adjustment
  const handleAdjustStock = async (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    try {
      await apiRequest(`/inventory/${id}`, 'PATCH', { quantity: newQty });
      toast.success(`تم تعديل الكمية إلى: ${newQty}`, 'تحديث الكمية');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل الكمية', 'خطأ');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterMode === 'EXPIRED') return item.expiryStatus === 'EXPIRED';
      if (filterMode === 'EXPIRING') return item.expiryStatus === 'EXPIRING_SOON';
      if (filterMode === 'LOW') return item.quantity <= item.reorderThreshold;
      return true;
    }).filter((item) => {
      if (!searchQuery) return true;
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.supplier && item.supplier.includes(searchQuery));
    });
  }, [items, filterMode, searchQuery]);

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package color="#06b6d4" size={24} />
            رادار المخزون وصلاحية الكواشف المخبرية
          </h1>
          <p className="page-subtitle">تتبع رصيد الكواشف، رادار تاريخ الصلاحية المبكر، وتنبيهات حد الطلب الحرج</p>
        </div>

        <button onClick={() => setShowItemModal(true)} className="btn-primary">
          <Plus size={16} />
          <span>إضافة مادة / كاشف جديد</span>
        </button>
      </div>

      {/* Alert KPI Summary Cards */}
      <div className="responsive-four-strip">
        <div
          onClick={() => setFilterMode('ALL')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            borderColor: filterMode === 'ALL' ? 'var(--accent-cyan)' : 'var(--border-color)',
            background: filterMode === 'ALL' ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>إجمالي المواد والكواشف</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{items.length}</div>
        </div>

        <div
          onClick={() => setFilterMode('EXPIRED')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            borderColor: filterMode === 'EXPIRED' ? 'var(--accent-rose)' : 'var(--border-color)',
            background: filterMode === 'EXPIRED' ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 700 }}>منتهية الصلاحية (تالفة)</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-rose)', marginTop: '2px' }}>
            {alerts.expiredCount || 0}
          </div>
        </div>

        <div
          onClick={() => setFilterMode('EXPIRING')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            borderColor: filterMode === 'EXPIRING' ? 'var(--accent-amber)' : 'var(--border-color)',
            background: filterMode === 'EXPIRING' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--accent-amber)', fontWeight: 700 }}>تنتهي قريباً (30 يوم)</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '2px' }}>
            {alerts.expiringSoonCount || 0}
          </div>
        </div>

        <div
          onClick={() => setFilterMode('LOW')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            borderColor: filterMode === 'LOW' ? '#38bdf8' : 'var(--border-color)',
            background: filterMode === 'LOW' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>أوشكت على النفاد (حد الطلب)</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
            {alerts.lowStockCount || 0}
          </div>
        </div>
      </div>

      {/* Inventory Search & Filters */}
      <div className="glass-card" style={{ marginBottom: '14px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="بحث في اسم الكاشف، المورد، أو الوحدة..."
              className="input-control"
              style={{ paddingRight: '32px', fontSize: '12.5px', minHeight: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-scroll-strip">
            <button onClick={() => setFilterMode('ALL')} className={`category-pill ${filterMode === 'ALL' ? 'active' : ''}`}>كل المواد</button>
            <button onClick={() => setFilterMode('EXPIRED')} className={`category-pill ${filterMode === 'EXPIRED' ? 'active' : ''}`}>المنتهية</button>
            <button onClick={() => setFilterMode('EXPIRING')} className={`category-pill ${filterMode === 'EXPIRING' ? 'active' : ''}`}>تنتهي قريباً</button>
            <button onClick={() => setFilterMode('LOW')} className={`category-pill ${filterMode === 'LOW' ? 'active' : ''}`}>تحت حد الطلب</button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم المادة والكاشف</th>
                <th>الكمية الحالية</th>
                <th>تعديل سريع</th>
                <th>حد إعادة الطلب</th>
                <th>تكلفة الوحدة</th>
                <th>تاريخ الصلاحية</th>
                <th>حالة الصلاحية</th>
                <th>المورد</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب بيانات المخزون...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد مواد مطابقة للبحث</td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.reorderThreshold;
                  const isExpired = item.expiryStatus === 'EXPIRED';
                  const isExpiring = item.expiryStatus === 'EXPIRING_SOON';

                  return (
                    <tr key={item.id} style={{ background: isExpired ? 'rgba(244, 63, 94, 0.04)' : undefined }}>
                      <td>
                        <strong style={{ color: 'var(--text-main)', fontSize: '13px', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.unit}</span>
                      </td>

                      <td>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: isLow ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleAdjustStock(item.id, item.quantity, -1)}
                            className="btn-icon"
                            style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 800 }}
                            title="خصم 1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, item.quantity, 1)}
                            className="btn-icon"
                            style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-emerald)' }}
                            title="إضافة 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, item.quantity, 5)}
                            className="btn-icon"
                            style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)' }}
                            title="إضافة 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>{item.reorderThreshold} {item.unit}</td>
                      <td style={{ fontWeight: 700 }}>{item.costPerUnit?.toLocaleString()} د.ع</td>
                      
                      <td>
                        {item.expiryDate ? (
                          <span>{new Date(item.expiryDate).toLocaleDateString('ar-IQ')}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>غير محدد</span>
                        )}
                      </td>

                      <td>
                        {isExpired ? (
                          <span className="badge badge-urgent"><AlertOctagon size={12} /> منتهي الصلاحية</span>
                        ) : isExpiring ? (
                          <span className="badge badge-progress"><AlertTriangle size={12} /> ينتهي قريباً</span>
                        ) : (
                          <span className="badge badge-ready"><Check size={12} /> سليم وصالح</span>
                        )}
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>{item.supplier || '-'}</td>

                      <td>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          title="حذف المادة"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>إضافة مادة / كاشف للمخزون</h3>
              </div>
              <button onClick={() => setShowItemModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">اسم الكاشف / المادة *</label>
                <input
                  type="text"
                  placeholder="مثال: CBC Diluent Reagent 20L"
                  className="input-control"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">الوحدة (عبوة / شريط / كيت)</label>
                  <input
                    type="text"
                    placeholder="مثال: عبوة"
                    className="input-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">الكمية الأولية *</label>
                  <input
                    type="number"
                    placeholder="مثال: 10"
                    className="input-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">سعر التكلفة للوحدة (د.ع) *</label>
                  <input
                    type="number"
                    placeholder="مثال: 25000"
                    className="input-control"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="input-label">حد الطلب الأدنى للتنبيه</label>
                  <input
                    type="number"
                    placeholder="مثال: 3"
                    className="input-control"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">تاريخ انتهاء الصلاحية</label>
                  <input
                    type="date"
                    className="input-control"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">اسم الشركة أو المورد</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة النقاء للمستلزمات الطبية"
                    className="input-control"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <Check size={16} />
                  <span>حفظ المادة في المخزون</span>
                </button>
                <button type="button" onClick={() => setShowItemModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="حذف مادة من المخزون"
        message="هل أنت متأكد من حذف هذه المادة من سجلات المخزون نهائياً؟"
        type="danger"
        confirmText="نعم، احذف المادة"
        cancelText="تراجع"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </AppShell>
  );
}
