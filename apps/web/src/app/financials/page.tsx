'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  TrendingUp, 
  Receipt, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  X, 
  Printer,
  Wallet,
  Activity,
  Calendar,
  Layers,
  DollarSign,
  PieChart
} from 'lucide-react';

export default function FinancialsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'summary' | 'profitability' | 'expenses'>('summary');
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  // Profitability Analytics States
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [profitLoading, setProfitLoading] = useState(false);

  // Form Expense
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('مصاريف تشغيلية');

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/financials/summary');
      setFinancialData(res);
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب البيانات المالية', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const loadProfitability = async () => {
    setProfitLoading(true);
    try {
      const res = await apiRequest('/financials/test-profitability?timeframe=' + timeframe);
      setProfitabilityData(res);
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب تحليل الربحية', 'خطأ');
    } finally {
      setProfitLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, []);

  useEffect(() => {
    if (activeTab === 'profitability') {
      loadProfitability();
    }
  }, [activeTab, timeframe]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || Number(expenseAmount) <= 0) {
      toast.warning('الرجاء إدخال وصف ومبلغ المصروف بشكل صحيح', 'بيانات ناقصة');
      return;
    }

    try {
      await apiRequest('/financials/expenses', 'POST', {
        description: expenseDesc.trim(),
        amount: Number(expenseAmount),
        category: expenseCat,
      });

      setShowExpenseModal(false);
      setExpenseDesc('');
      setExpenseAmount('');
      toast.success('تم تسجيل المصروف بنجاح!', 'سند صرف');
      loadFinancials();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء تسجيل المصروف', 'فشل الحفظ');
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      await apiRequest('/financials/expenses/' + deleteExpenseId, 'DELETE');
      toast.success('تم مسح قيد المصروف بنجاح!', 'تم الحذف');
      setDeleteExpenseId(null);
      loadFinancials();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء الحذف', 'خطأ');
    }
  };

  const summary = financialData || {};

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TrendingUp color="#06b6d4" size={24} />
            التقرير المالي وصافي الأرباح
          </h1>
          <p className="page-subtitle">الصندوق اليومي، تحليل الإيرادات والمصاريف، وهامش الربحية التشغيلي لكل فحص</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary">
            <Plus size={16} />
            <span>تسجيل سند صرف / مصروف جديد</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '18px' }}>
        <button
          onClick={() => setActiveTab('summary')}
          className={`btn-secondary ${activeTab === 'summary' ? 'active' : ''}`}
          style={{
            background: activeTab === 'summary' ? 'rgba(6, 182, 212, 0.15)' : undefined,
            borderColor: activeTab === 'summary' ? 'var(--accent-cyan)' : undefined,
            color: activeTab === 'summary' ? 'var(--accent-cyan)' : undefined,
          }}
        >
          <Wallet size={16} />
          <span>الموجز المالي والصندوق</span>
        </button>

        <button
          onClick={() => setActiveTab('profitability')}
          className={`btn-secondary ${activeTab === 'profitability' ? 'active' : ''}`}
          style={{
            background: activeTab === 'profitability' ? 'rgba(16, 185, 129, 0.15)' : undefined,
            borderColor: activeTab === 'profitability' ? 'var(--accent-emerald)' : undefined,
            color: activeTab === 'profitability' ? 'var(--accent-emerald)' : undefined,
          }}
        >
          <PieChart size={16} />
          <span>تحليل ربحية الفحوصات</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`btn-secondary ${activeTab === 'expenses' ? 'active' : ''}`}
          style={{
            background: activeTab === 'expenses' ? 'rgba(244, 63, 94, 0.15)' : undefined,
            borderColor: activeTab === 'expenses' ? 'var(--accent-rose)' : undefined,
            color: activeTab === 'expenses' ? 'var(--accent-rose)' : undefined,
          }}
        >
          <Receipt size={16} />
          <span>سجل المصاريف التشغيلية</span>
        </button>
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Main Financial KPI Grid */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
              <span className="stat-title">إجمالي المبيعات (Gross Sales)</span>
              <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {(summary.totalRevenue || 0).toLocaleString()} د.ع
              </span>
              <span className="stat-desc">القيمة الإجمالية لكل الفحوصات</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
              <span className="stat-title">النقد المستلم (Cash In)</span>
              <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {(summary.totalPaid || 0).toLocaleString()} د.ع
              </span>
              <span className="stat-desc">المبالغ المقبوضة فعلياً</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid var(--accent-rose)' }}>
              <span className="stat-title">المصاريف وعمولات الأطباء</span>
              <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
                {((summary.totalExpenses || 0) + (summary.totalDoctorCommissions || 0)).toLocaleString()} د.ع
              </span>
              <span className="stat-desc">مصاريف: {(summary.totalExpenses || 0).toLocaleString()} | عمولات: {(summary.totalDoctorCommissions || 0).toLocaleString()}</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid #38bdf8' }}>
              <span className="stat-title">صافي الربح الفعلي (Net Profit)</span>
              <span className="stat-value" style={{ color: '#38bdf8' }}>
                {(summary.netProfit || 0).toLocaleString()} د.ع
              </span>
              <span className="stat-desc">هامش ربح إيجابي بعد كل الخصوم</span>
            </div>
          </div>

          {/* Quick Cashflow Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>
                حركة الصندوق اليومية والديون
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>إيرادات اليوم النقدية:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{(summary.todayRevenue || 0).toLocaleString()} د.ع</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>إجمالي الخصومات الممنوحة:</span>
                  <strong style={{ color: 'var(--accent-amber)' }}>{(summary.totalDiscounts || 0).toLocaleString()} د.ع</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>الديون المتبقية بذمة المرضى:</span>
                  <strong style={{ color: 'var(--accent-rose)' }}>{(summary.totalRemainingDebts || 0).toLocaleString()} د.ع</strong>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>
                سندات الصرف الأخيرة
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {summary.recentExpenses?.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>لا توجد مصاريف مسجلة مؤخراً</div>
                ) : (
                  summary.recentExpenses?.map((ex: any) => (
                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: '6px', fontSize: '12px' }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)', display: 'block' }}>{ex.description}</strong>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{ex.category} • {new Date(ex.createdAt).toLocaleDateString('ar-IQ')}</span>
                      </div>
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>-{ex.amount.toLocaleString()} د.ع</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFITABILITY */}
      {activeTab === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>الفترة الزمنية للتحليل:</span>
            <div className="category-scroll-strip">
              {[
                { id: 'today', label: 'اليوم' },
                { id: 'week', label: 'هذا الأسبوع' },
                { id: 'month', label: 'هذا الشهر' },
                { id: 'all', label: 'كامل المدة' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as any)}
                  className={`category-pill ${timeframe === tf.id ? 'active' : ''}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم الفحص</th>
                    <th>مرات الإجراء</th>
                    <th>سعر البيع</th>
                    <th>التكلفة المقدرة</th>
                    <th>إجمالي الإيراد</th>
                    <th>إجمالي التكلفة</th>
                    <th>صافي الربح</th>
                    <th>نسبة الهامش الربحي</th>
                  </tr>
                </thead>
                <tbody>
                  {profitLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري احتساب ربحية الفحوصات...</td>
                    </tr>
                  ) : !profitabilityData || profitabilityData.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد بيانات فحوصات مسجلة لهذه الفترة</td>
                    </tr>
                  ) : (
                    profitabilityData.map((p: any) => {
                      const marginPct = p.totalRevenue > 0 ? Math.round((p.netProfit / p.totalRevenue) * 100) : 0;
                      return (
                        <tr key={p.testId}>
                          <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{p.testName}</td>
                          <td>{p.count} مرة</td>
                          <td>{p.price?.toLocaleString()} د.ع</td>
                          <td style={{ color: 'var(--text-muted)' }}>{p.costEstimate?.toLocaleString()} د.ع</td>
                          <td style={{ fontWeight: 700 }}>{p.totalRevenue?.toLocaleString()} د.ع</td>
                          <td style={{ color: 'var(--accent-rose)' }}>{p.totalCost?.toLocaleString()} د.ع</td>
                          <td style={{ fontWeight: 900, color: 'var(--accent-emerald)' }}>{p.netProfit?.toLocaleString()} د.ع</td>
                          <td>
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px' }}>
                              %{marginPct}
                            </span>
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

      {/* TAB 3: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="data-table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>تاريخ السند</th>
                  <th>بيان ووصف المصروف</th>
                  <th>التصنيف</th>
                  <th>المبلغ</th>
                  <th>الموظف المدخل</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {summary.expensesList?.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد مصاريف مسجلة</td>
                  </tr>
                ) : (
                  summary.expensesList?.map((ex: any) => (
                    <tr key={ex.id}>
                      <td>{new Date(ex.createdAt).toLocaleDateString('ar-IQ')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ex.description}</td>
                      <td>
                        <span className="badge badge-received" style={{ fontSize: '10.5px' }}>{ex.category}</span>
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--accent-rose)', fontSize: '13px' }}>
                        {ex.amount.toLocaleString()} د.ع
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{ex.staff?.name || 'مدير المختبر'}</td>
                      <td>
                        <button
                          onClick={() => setDeleteExpenseId(ex.id)}
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          title="مسح المصروف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>تسجيل سند صرف / مصروف جديد</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">بيان ووصف المصروف *</label>
                <input
                  type="text"
                  placeholder="مثال: شراء كحول وقطن وسرنجات"
                  className="input-control"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">المبلغ المصروف (د.ع) *</label>
                <input
                  type="number"
                  placeholder="مثال: 50000"
                  className="input-control"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="input-label">تصنيف المصروف</label>
                <select
                  className="select-control"
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                >
                  <option value="مصاريف تشغيلية">مصاريف تشغيلية ومستلزمات</option>
                  <option value="إيجار وفواتير">إيجار وكهرباء وماء وإنترنت</option>
                  <option value="رواتب وأجور">رواتب وأجور كادر</option>
                  <option value="صيانة أجهزة">صيانة ومعايرة أجهزة مخبرية</option>
                  <option value="ضيافة ونظافة">ضيافة ونظافة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ سند الصرف
                </button>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Expense */}
      <ConfirmModal
        isOpen={!!deleteExpenseId}
        title="مسح قيد المصروف"
        message="هل أنت متأكد من مسح هذا المصروف نهائياً من السجلات المالية؟"
        type="danger"
        confirmText="نعم، امسح المصروف"
        cancelText="تراجع"
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setDeleteExpenseId(null)}
      />
    </AppShell>
  );
}
