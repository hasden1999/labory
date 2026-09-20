'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Package, Plus, AlertTriangle, Clock, Trash2, X, Check, Calendar, AlertCircle, Search, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertOctagon } from 'lucide-react';
import { toEnglishDigits, formatEnglishDate } from '../../lib/formatters';

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
  const [catalogCode, setCatalogCode] = useState('');
  const [category, setCategory] = useState<'REAGENT' | 'KIT' | 'CONSUMABLE' | 'CONTROL'>('REAGENT');
  const [lotNumber, setLotNumber] = useState('');
  const [unit, setUnit] = useState('عبوة');
  const [quantity, setQuantity] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [alertThresholdDays, setAlertThresholdDays] = useState('30');
  const [openVialDays, setOpenVialDays] = useState('');
  const [storageCondition, setStorageCondition] = useState('2-8°C');
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

  const handleOpenVial = async (id: string) => {
    try {
      await apiRequest(`/inventory/${id}/open`, 'POST');
      toast.success('تم تسجيل فتح العبوة وتفعيل احتساب مدة الاستقرار بنجاح!', 'فتح العبوة');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'فشل في تحديث حالة العبوة', 'خطأ');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !quantity || !costPerUnit) {
      toast.warning('الرجاء إدخال الحقول الأساسية للمادة (الاسم، الكمية، وسعر التكلفة)', 'بيانات ناقصة');
      return;
    }

    try {
      await apiRequest('/inventory', 'POST', {
        name: itemName.trim(),
        catalogCode: catalogCode.trim() || undefined,
        category,
        lotNumber: lotNumber.trim() || undefined,
        unit,
        quantity: Number(toEnglishDigits(quantity)),
        reorderThreshold: Number(toEnglishDigits(reorderThreshold)),
        costPerUnit: Number(toEnglishDigits(costPerUnit)),
        expiryDate: expiryDate ? expiryDate : undefined,
        alertThresholdDays: alertThresholdDays ? Number(toEnglishDigits(alertThresholdDays)) : 30,
        openVialDays: openVialDays ? Number(toEnglishDigits(openVialDays)) : undefined,
        storageCondition,
        supplier,
      });

      setShowItemModal(false);
      setItemName('');
      setCatalogCode('');
      setCategory('REAGENT');
      setLotNumber('');
      setUnit('عبوة');
      setQuantity('');
      setReorderThreshold('5');
      setCostPerUnit('');
      setExpiryDate('');
      setAlertThresholdDays('30');
      setOpenVialDays('');
      setStorageCondition('2-8°C');
      setSupplier('');
      toast.success('تمت إضافة مادة المخزون وتفعيل الرقابة الذكية بنجاح!', 'حفظ المادة');
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
        <div className="data-table-container table-responsive-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>المادة والتشغيلة (Lot/Catalog)</th>
                <th>التصنيف والحفظ</th>
                <th>الكمية الحالية</th>
                <th>تعديل سريع</th>
                <th>استقرار العبوة (Open-Vial)</th>
                <th>الصلاحية الفعلية</th>
                <th>حالة الرقابة</th>
                <th>المورد والتكلفة</th>
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
                  const isExpiring = item.expiryStatus === 'APPROACHING_EXPIRY';
                  const isOpened = !!item.openedAt;

                  return (
                    <tr key={item.id} style={{ background: isExpired ? 'rgba(244, 63, 94, 0.05)' : isExpiring ? 'rgba(245, 158, 11, 0.05)' : undefined }}>
                      <td>
                        <strong style={{ color: 'var(--text-main)', fontSize: '13px', display: 'block' }}>{item.name}</strong>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                          {item.catalogCode && (
                            <span style={{ fontSize: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                              #{item.catalogCode}
                            </span>
                          )}
                          {item.lotNumber && (
                            <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                              Lot: {item.lotNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.category === 'KIT' ? 'طقم فحص (Kit)' : item.category === 'CONSUMABLE' ? 'مستهلكات' : item.category === 'CONTROL' ? 'محلول ضبط' : 'كاشف (Reagent)'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>
                          ❄️ {item.storageCondition || '2-8°C'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: isLow ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          {item.quantity} {item.unit}
                        </span>
                        {isLow && <span style={{ fontSize: '10px', color: 'var(--accent-rose)', display: 'block' }}>تحت حد الطلب ({item.reorderThreshold})</span>}
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
                        </div>
                      </td>

                      <td>
                        {item.openVialDays ? (
                          isOpened ? (
                            <div>
                              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'block' }}>
                                🟢 مفتوحة ({item.openVialDays} يوم استقرار)
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                فتحت في: {formatEnglishDate(item.openedAt)}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenVial(item.id)}
                              className="btn-secondary"
                              style={{ fontSize: '10.5px', padding: '3px 8px', borderRadius: '4px' }}
                            >
                              🔓 تسجيل فتح العبوة
                            </button>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>غير محدد</span>
                        )}
                      </td>

                      <td>
                        {item.effectiveExpiry ? (
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '12px', color: isExpired ? '#ef4444' : isExpiring ? '#f59e0b' : 'var(--text-main)' }}>
                              {formatEnglishDate(item.effectiveExpiry)}
                            </span>
                            {item.daysUntilExpiry !== null && (
                              <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>
                                {item.daysUntilExpiry <= 0 ? 'انتهت منذ أيام' : `متبقي ${item.daysUntilExpiry} يوم`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>غير محدد</span>
                        )}
                      </td>

                      <td>
                        {isExpired ? (
                          <span className="badge badge-urgent"><AlertOctagon size={12} /> منتهي الصلاحية</span>
                        ) : isExpiring ? (
                          <span className="badge badge-progress"><AlertTriangle size={12} /> تنبيه قرب الانتهاء</span>
                        ) : isLow ? (
                          <span className="badge badge-progress" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', borderColor: '#38bdf8' }}>نقص بالمخزون</span>
                        ) : (
                          <span className="badge badge-ready"><Check size={12} /> سليم ومطابق</span>
                        )}
                      </td>

                      <td style={{ fontSize: '11.5px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.costPerUnit?.toLocaleString()} د.ع</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '10.5px' }}>{item.supplier || '-'}</div>
                      </td>

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
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>إضافة كاشف / مادة للمخزون الذكي</h3>
              </div>
              <button onClick={() => setShowItemModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">اسم الكاشف / المادة *</label>
                  <input
                    type="text"
                    placeholder="مثال: Mindray Diluent M-53D"
                    className="input-control"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">رمز الكتالوج / الباركود</label>
                  <input
                    type="text"
                    placeholder="مثال: CAT-9021"
                    className="input-control"
                    value={catalogCode}
                    onChange={(e) => setCatalogCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">التصنيف المخبري</label>
                  <select
                    className="input-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="REAGENT">كواشف تشخيصية (Reagent)</option>
                    <option value="KIT">طقم فحص سريع (Rapid Kit)</option>
                    <option value="CONSUMABLE">مستهلكات وأنابيب (Consumables)</option>
                    <option value="CONTROL">محاليل ضبط الجودة (Control/Calibrator)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">رقم التشغيلة (Lot Number)</label>
                  <input
                    type="text"
                    placeholder="مثال: LOT2026-08A"
                    className="input-control"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">الوحدة</label>
                  <input
                    type="text"
                    placeholder="عبوة / لتر / فحص"
                    className="input-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">الكمية *</label>
                  <input
                    type="number"
                    placeholder="10"
                    className="input-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="input-label">حد الطلب للتنبيه</label>
                  <input
                    type="number"
                    placeholder="3"
                    className="input-control"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">تاريخ الصلاحية الرسمي</label>
                  <input
                    type="date"
                    className="input-control"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">مهلة الإنذار المسبق (بالأيام)</label>
                  <input
                    type="number"
                    placeholder="مثال: 30 يوم"
                    className="input-control"
                    value={alertThresholdDays}
                    onChange={(e) => setAlertThresholdDays(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">استقرار العبوة بعد الفتح (بالأيام)</label>
                  <input
                    type="number"
                    placeholder="مثال: 30 أو 60 يوم"
                    className="input-control"
                    value={openVialDays}
                    onChange={(e) => setOpenVialDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">شروط الحفظ والتخزين</label>
                  <select
                    className="input-control"
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value)}
                  >
                    <option value="2-8°C">تبريد ثلاجة (2°C - 8°C)</option>
                    <option value="15-25°C">درجة حرارة الغرفة (15°C - 25°C)</option>
                    <option value="-20°C">تجميد عميق (-20°C)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">سعر التكلفة للوحدة (د.ع) *</label>
                  <input
                    type="number"
                    placeholder="25000"
                    className="input-control"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="input-label">اسم الشركة أو المورد</label>
                  <input
                    type="text"
                    placeholder="شركة التجهيزات الطبية"
                    className="input-control"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, minHeight: '40px' }}>
                  <Check size={16} />
                  <span>حفظ المادة وتفعيل الرقابة</span>
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
