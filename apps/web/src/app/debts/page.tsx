'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { 
  CreditCard, 
  Plus, 
  Search, 
  DollarSign, 
  UserPlus, 
  Receipt, 
  FileText, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  UserCheck,
  Printer,
  Check,
  Phone,
  MessageSquare,
  Download,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building2,
  Users
} from 'lucide-react';

export default function DebtsPage() {
  const toast = useToast();
  const [debtors, setDebtors] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({
    totalReceivables: 0,
    totalPayables: 0,
    patientDebtsTotal: 0,
    supplierDebtsTotal: 0,
    totalAccounts: 0,
    activeAccounts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter tabs: 'ALL' | 'PATIENT' | 'SUPPLIER' | 'CLINIC'
  const [activeTab, setActiveTab] = useState<'ALL' | 'PATIENT' | 'SUPPLIER' | 'CLINIC'>('ALL');
  // Status filter: 'ACTIVE' | 'ALL' | 'SETTLED'
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ALL' | 'SETTLED'>('ACTIVE');

  // Modals
  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<any>(null);

  // Form states - New Debtor
  const [newDebtorName, setNewDebtorName] = useState('');
  const [newDebtorPhone, setNewDebtorPhone] = useState('');
  const [newDebtorNotes, setNewDebtorNotes] = useState('');
  const [newDebtorType, setNewDebtorType] = useState<'PATIENT' | 'SUPPLIER' | 'CLINIC' | 'OTHER'>('PATIENT');
  const [initialDebtInput, setInitialDebtInput] = useState('');

  // Selected Debtor for Transaction / Statement
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [txType, setTxType] = useState<'DEBT' | 'PAYMENT'>('PAYMENT');
  const [txAmount, setTxAmount] = useState('');
  const [txMethod, setTxMethod] = useState('نقداً');
  const [txNotes, setTxNotes] = useState('');
  const [statementData, setStatementData] = useState<any>(null);

  const loadDebtors = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/debts?type=${activeTab}&status=${statusFilter}&query=${encodeURIComponent(searchQuery)}`);
      if (res && res.debtors) {
        setDebtors(res.debtors || []);
        if (res.totals) setTotals(res.totals);
      } else if (Array.isArray(res)) {
        setDebtors(res);
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل سجل الديون والذمم', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebtors();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDebtors();
  };

  const handleCreateDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtorName.trim()) {
      toast.warning('الرجاء إدخال اسم الحساب أو الجهة', 'بيانات ناقصة');
      return;
    }

    try {
      await apiRequest('/debts', 'POST', {
        name: newDebtorName.trim(),
        phone: newDebtorPhone.trim() || undefined,
        notes: newDebtorNotes.trim() || undefined,
        type: newDebtorType,
        initialDebt: initialDebtInput ? Number(initialDebtInput) : undefined,
      });

      setShowAddDebtorModal(false);
      setNewDebtorName('');
      setNewDebtorPhone('');
      setNewDebtorNotes('');
      setInitialDebtInput('');
      toast.success('تم فتح الحساب المالي بنجاح!', 'تم الحفظ');
      loadDebtors();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء فتح الحساب', 'فشل العملية');
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor || !txAmount || Number(txAmount) <= 0) {
      toast.warning('الرجاء إدخال مبلغ صحيح للعملية', 'مبلغ غير صالح');
      return;
    }

    try {
      const res = await apiRequest(`/debts/${selectedDebtor.id}/transaction`, 'POST', {
        type: txType,
        amount: Number(txAmount),
        paymentMethod: txMethod,
        notes: txNotes,
      });

      setShowTxModal(false);
      setTxAmount('');
      setTxNotes('');

      toast.success(
        txType === 'PAYMENT' 
          ? `تم استلام الدفعة بنجاح! رقم السند: #${res?.voucherNumber || 'سداد'}` 
          : 'تم تقييد الدين الإضافي بنجاح!',
        'تسجيل حركة مالية'
      );

      if (txType === 'PAYMENT' && res?.voucherNumber) {
        setActiveVoucher({
          voucherNumber: res.voucherNumber,
          debtorName: selectedDebtor.name,
          phone: selectedDebtor.phone,
          amount: Number(txAmount),
          type: selectedDebtor.type === 'SUPPLIER' ? 'سند صرف مورد' : 'سند قبض مالي',
          paymentMethod: txMethod,
          date: new Date().toLocaleString('ar-IQ'),
          notes: txNotes || (selectedDebtor.type === 'SUPPLIER' ? 'دفعة سداد حساب مورد' : 'استلام دفعة سداد دين'),
        });
        setShowVoucherModal(true);
      }

      loadDebtors();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء تسجيل الحركة', 'فشل العملية');
    }
  };

  const handleQuickSettleAll = async (debtor: any) => {
    if (!confirm(`هل أنت متأكد من تسوية كامل رصيد (${debtor.name}) المتبقي البالغ ${debtor.remainingBalance.toLocaleString()} د.ع؟`)) {
      return;
    }

    try {
      const res = await apiRequest(`/debts/${debtor.id}/settle-all`, 'POST', {
        paymentMethod: 'نقداً',
        notes: 'تسوية حساب وتصفية الرصيد كاملاً',
      });

      toast.success('تم تسوية الحساب وتصفير المتبقي بنجاح!', 'تسوية كاملة');

      if (res?.voucherNumber) {
        setActiveVoucher({
          voucherNumber: res.voucherNumber,
          debtorName: debtor.name,
          phone: debtor.phone,
          amount: res.paidAmount,
          type: debtor.type === 'SUPPLIER' ? 'سند صرف مورد' : 'سند قبض مالي',
          paymentMethod: 'نقداً',
          date: new Date().toLocaleString('ar-IQ'),
          notes: 'تسوية وتصفية كامل الرصيد المستحق',
        });
        setShowVoucherModal(true);
      }

      loadDebtors();
    } catch (err: any) {
      toast.error(err.message || 'فشل تسوية الحساب', 'خطأ');
    }
  };

  const handleOpenStatement = async (debtor: any) => {
    setSelectedDebtor(debtor);
    try {
      const res = await apiRequest(`/debts/${debtor.id}/statement`);
      setStatementData(res);
      setShowStatementModal(true);
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب كشف الحساب', 'خطأ');
    }
  };

  const handleSendWhatsAppReminder = (debtor: any) => {
    if (!debtor.phone) {
      toast.warning('لا يوجد رقم هاتف مسجل لهذا الحساب', 'تنبيه');
      return;
    }
    const cleanPhone = debtor.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? `964${cleanPhone.slice(1)}` : cleanPhone;
    const msg = `مرحباً ${debtor.name} المحترم،\nنود تذكيركم بلطف بأن لديكم رصيداً متبقياً مستحقاً لدى مختبرنا قدره (${(debtor.remainingBalance || 0).toLocaleString()} د.ع).\nيرجى التفضل بمراجعة قسم الحسابات لتسوية المبلغ.\nشاكرين تعاونكم معنا.`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    if (debtors.length === 0) {
      toast.warning('لا توجد بيانات لتصديرها', 'تنبيه');
      return;
    }

    const headers = ['الاسم', 'الهاتف', 'النوع', 'إجمالي الدين', 'المسدد', 'المتبقي', 'أيام التأخر', 'ملاحظات'];
    const rows = debtors.map(d => [
      `"${d.name}"`,
      `"${d.phone || ''}"`,
      `"${d.type === 'SUPPLIER' ? 'مورد' : d.type === 'CLINIC' ? 'عيادة' : 'مريض'}"`,
      d.totalDebt || 0,
      d.totalPaid || 0,
      d.remainingBalance || 0,
      d.agingDays || 0,
      `"${d.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `كشف_الديون_والذمم_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف الإكسل بنجاح!', 'تصدير');
  };

  const printThermalVoucher = () => {
    window.print();
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CreditCard color="#06b6d4" size={24} />
            إدارة الديون والذمم وسندات المقبوضات
          </h1>
          <p className="page-subtitle">نظام موحد لتتبع ديون المرضى والتحاليل، ذمم الموردين، وإصدار سندات القبض والتصفية الفورية</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn-secondary" title="تصدير ملف إكسل">
            <Download size={15} />
            <span>تصدير Excel</span>
          </button>

          <button onClick={() => setShowAddDebtorModal(true)} className="btn-primary">
            <UserPlus size={16} />
            <span>فتح حساب ذمة / مدين جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '16px' }}>
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-rose)' }}>
          <span className="stat-title">ديون المرضى والجهات (Receivables)</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {(totals.patientDebtsTotal || totals.totalReceivables || 0).toLocaleString()} د.ع
          </span>
          <span className="stat-desc">مبالغ مستحقة للمختبر قيد التحصيل</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid #f59e0b' }}>
          <span className="stat-title">ديون الموردين والشركات (Payables)</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {(totals.supplierDebtsTotal || totals.totalPayables || 0).toLocaleString()} د.ع
          </span>
          <span className="stat-desc">ذمم مستحقة لمكاتب ومجهزي الكواشف</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
          <span className="stat-title">حسابات بذمتها مبالغ نشطة</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {totals.activeAccounts || debtors.filter(d => d.remainingBalance > 0).length} حساب
          </span>
          <span className="stat-desc">تتطلب المتابعة والتحصيل</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
          <span className="stat-title">إجمالي الحسابات المسجلة</span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {totals.totalAccounts || debtors.length} حساب
          </span>
          <span className="stat-desc">مرضى، موردين، وعيادات</span>
        </div>
      </div>

      {/* Category Tabs & Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`btn-secondary ${activeTab === 'ALL' ? 'active' : ''}`}
            style={{
              background: activeTab === 'ALL' ? 'rgba(6, 182, 212, 0.15)' : undefined,
              borderColor: activeTab === 'ALL' ? 'var(--accent-cyan)' : undefined,
              color: activeTab === 'ALL' ? 'var(--accent-cyan)' : undefined,
              fontSize: '12px',
            }}
          >
            الكل ({totals.totalAccounts || debtors.length})
          </button>

          <button
            onClick={() => setActiveTab('PATIENT')}
            className={`btn-secondary ${activeTab === 'PATIENT' ? 'active' : ''}`}
            style={{
              background: activeTab === 'PATIENT' ? 'rgba(6, 182, 212, 0.15)' : undefined,
              borderColor: activeTab === 'PATIENT' ? 'var(--accent-cyan)' : undefined,
              color: activeTab === 'PATIENT' ? 'var(--accent-cyan)' : undefined,
              fontSize: '12px',
            }}
          >
            <Users size={14} />
            <span>ديون المرضى والتحاليل</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPPLIER')}
            className={`btn-secondary ${activeTab === 'SUPPLIER' ? 'active' : ''}`}
            style={{
              background: activeTab === 'SUPPLIER' ? 'rgba(245, 158, 11, 0.15)' : undefined,
              borderColor: activeTab === 'SUPPLIER' ? '#f59e0b' : undefined,
              color: activeTab === 'SUPPLIER' ? '#f59e0b' : undefined,
              fontSize: '12px',
            }}
          >
            <Building2 size={14} />
            <span>ديون الموردين ومكاتب التجهيز</span>
          </button>

          <button
            onClick={() => setActiveTab('CLINIC')}
            className={`btn-secondary ${activeTab === 'CLINIC' ? 'active' : ''}`}
            style={{
              background: activeTab === 'CLINIC' ? 'rgba(16, 185, 129, 0.15)' : undefined,
              borderColor: activeTab === 'CLINIC' ? 'var(--accent-emerald)' : undefined,
              color: activeTab === 'CLINIC' ? 'var(--accent-emerald)' : undefined,
              fontSize: '12px',
            }}
          >
            العيادات والجهات الخارجية
          </button>
        </div>

        {/* Status toggles */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>الحالة:</span>
          {(['ACTIVE', 'ALL', 'SETTLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: statusFilter === st ? 'var(--bg-card-hover)' : 'transparent',
                fontWeight: statusFilter === st ? 800 : 500,
              }}
            >
              {st === 'ACTIVE' ? 'قيد التحصيل (غير مسدد)' : st === 'SETTLED' ? 'المسددة بالكامل' : 'جميع الحالات'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ marginBottom: '14px', padding: '10px 14px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="بحث سريع بالاسم، رقم الهاتف، أو الملاحظات..."
              className="input-control"
              style={{ paddingRight: '36px', height: '36px', fontSize: '12.5px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0 18px', height: '36px' }}>
            بحث
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTimeout(loadDebtors, 50);
              }}
              className="btn-secondary"
              style={{ height: '36px' }}
            >
              إلغاء البحث
            </button>
          )}
        </form>
      </div>

      {/* Debtors List Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الحساب / الاسم</th>
                <th>نوع الذمة</th>
                <th>رقم الهاتف</th>
                <th>إجمالي الدين</th>
                <th>المسدد</th>
                <th>المتبقي المستحق</th>
                <th>فترة التأخر</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات والمعاملات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    جاري تحميل سجلات الديون والذمم...
                  </td>
                </tr>
              ) : debtors.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    لا توجد حسابات مطابقة لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                debtors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{d.name}</strong>
                        {d.notes && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{d.notes}</span>}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${d.type === 'SUPPLIER' ? 'badge-urgent' : d.type === 'CLINIC' ? 'badge-ready' : 'badge-progress'}`} style={{ fontSize: '10.5px' }}>
                        {d.type === 'SUPPLIER' ? 'مورد كواشف' : d.type === 'CLINIC' ? 'عيادة خارجية' : 'مريض مختبر'}
                      </span>
                    </td>

                    <td>
                      {d.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', direction: 'ltr' }}>{d.phone}</span>
                          <button
                            onClick={() => handleSendWhatsAppReminder(d)}
                            className="btn-icon"
                            style={{ color: 'var(--accent-emerald)', padding: '2px' }}
                            title="إرسال تذكير عبر واتساب"
                          >
                            <MessageSquare size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>-</span>
                      )}
                    </td>

                    <td>{(d.totalDebt || 0).toLocaleString()} د.ع</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{(d.totalPaid || 0).toLocaleString()} د.ع</td>

                    <td>
                      <strong style={{ color: d.remainingBalance > 0 ? (d.type === 'SUPPLIER' ? '#f59e0b' : 'var(--accent-rose)') : 'var(--accent-emerald)', fontSize: '13px' }}>
                        {(d.remainingBalance || 0).toLocaleString()} د.ع
                      </strong>
                    </td>

                    <td>
                      {d.remainingBalance > 0 ? (
                        <span style={{ fontSize: '11px', color: (d.agingDays || 0) > 30 ? 'var(--accent-rose)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {d.agingDays || 0} يوم
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>مسدد</span>
                      )}
                    </td>

                    <td>
                      {d.remainingBalance <= 0 ? (
                        <span className="badge badge-ready" style={{ fontSize: '10.5px' }}>
                          <Check size={11} />
                          خالص بالكامل
                        </span>
                      ) : (
                        <span className="badge badge-progress" style={{ fontSize: '10.5px' }}>
                          مستحق
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        {d.remainingBalance > 0 && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDebtor(d);
                                setTxType('PAYMENT');
                                setTxAmount(d.remainingBalance.toString());
                                setTxMethod('نقداً');
                                setShowTxModal(true);
                              }}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '11px', minHeight: '28px' }}
                              title="تسجيل دفعة مع إصدار سند قبض"
                            >
                              <ArrowDownLeft size={13} />
                              <span>قبض دفعة</span>
                            </button>

                            <button
                              onClick={() => handleQuickSettleAll(d)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', minHeight: '28px', color: 'var(--accent-emerald)' }}
                              title="تسوية كاملة وتصفير الرصيد"
                            >
                              <ShieldCheck size={13} />
                              <span>تصفية</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedDebtor(d);
                            setTxType('DEBT');
                            setTxAmount('');
                            setShowTxModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', minHeight: '28px' }}
                          title="إضافة دين جديد على الحساب"
                        >
                          <ArrowUpRight size={13} />
                          <span>+دين</span>
                        </button>

                        <button
                          onClick={() => handleOpenStatement(d)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', minHeight: '28px', color: 'var(--accent-cyan)' }}
                          title="عرض كشف الحساب التفصيلي"
                        >
                          <FileText size={13} />
                          <span>كشف</span>
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

      {/* MODAL 1: Add New Debtor */}
      {showAddDebtorModal && (
        <div className="modal-overlay" onClick={() => setShowAddDebtorModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>فتح حساب ذمة مالي جديد</h3>
              </div>
              <button onClick={() => setShowAddDebtorModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDebtor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">نوع الحساب / الذمة *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'PATIENT', label: 'مريض / فحوصات' },
                    { id: 'SUPPLIER', label: 'مورد كواشف ومواد' },
                    { id: 'CLINIC', label: 'عيادة / طبيب' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewDebtorType(t.id as any)}
                      className="btn-secondary"
                      style={{
                        fontSize: '11.5px',
                        padding: '6px',
                        background: newDebtorType === t.id ? 'rgba(6, 182, 212, 0.15)' : undefined,
                        borderColor: newDebtorType === t.id ? 'var(--accent-cyan)' : undefined,
                        color: newDebtorType === t.id ? 'var(--accent-cyan)' : undefined,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">اسم الشخص أو الجهة *</label>
                <input
                  type="text"
                  placeholder="مثال: شركة النقاء للتجهيزات الطبية / أحمد علي"
                  className="input-control"
                  value={newDebtorName}
                  onChange={(e) => setNewDebtorName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">رقم الهاتف</label>
                <input
                  type="text"
                  placeholder="مثال: 07701234567"
                  className="input-control"
                  value={newDebtorPhone}
                  onChange={(e) => setNewDebtorPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">رصيد الدين الافتتاحي (د.ع) إن وجد</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-control"
                  value={initialDebtInput}
                  onChange={(e) => setInitialDebtInput(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="input-label">ملاحظات توضيحية</label>
                <input
                  type="text"
                  placeholder="مثال: توريد كواشف جهاز CBC"
                  className="input-control"
                  value={newDebtorNotes}
                  onChange={(e) => setNewDebtorNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ وفتح الحساب
                </button>
                <button type="button" onClick={() => setShowAddDebtorModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Transaction (Payment / Debt) */}
      {showTxModal && selectedDebtor && (
        <div className="modal-overlay" onClick={() => setShowTxModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--accent-cyan)" />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800 }}>
                    {txType === 'PAYMENT' ? (selectedDebtor.type === 'SUPPLIER' ? 'تسجيل صرف دفعة لمورد' : 'تسجيل سند قبض / دفعة') : 'تقييد دين إضافي'}
                  </h3>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    الحساب: <strong>{selectedDebtor.name}</strong> | المتبقي الحالي: {(selectedDebtor.remainingBalance || 0).toLocaleString()} د.ع
                  </span>
                </div>
              </div>
              <button onClick={() => setShowTxModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">نوع العملية *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTxType('PAYMENT')}
                    className="btn-secondary"
                    style={{
                      background: txType === 'PAYMENT' ? 'rgba(16, 185, 129, 0.15)' : undefined,
                      borderColor: txType === 'PAYMENT' ? 'var(--accent-emerald)' : undefined,
                      color: txType === 'PAYMENT' ? 'var(--accent-emerald)' : undefined,
                      fontWeight: txType === 'PAYMENT' ? 800 : 500,
                    }}
                  >
                    استلام دفعة / سداد
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('DEBT')}
                    className="btn-secondary"
                    style={{
                      background: txType === 'DEBT' ? 'rgba(244, 63, 94, 0.15)' : undefined,
                      borderColor: txType === 'DEBT' ? 'var(--accent-rose)' : undefined,
                      color: txType === 'DEBT' ? 'var(--accent-rose)' : undefined,
                      fontWeight: txType === 'DEBT' ? 800 : 500,
                    }}
                  >
                    إضافة دين جديد
                  </button>
                </div>
              </div>

              <div>
                <label className="input-label">المبلغ (د.ع) *</label>
                <input
                  type="number"
                  placeholder="أدخل المبلغ..."
                  className="input-control"
                  style={{ fontSize: '15px', fontWeight: 800 }}
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  autoFocus
                  min="1"
                />
              </div>

              {txType === 'PAYMENT' && (
                <div>
                  <label className="input-label">طريقة الدفع *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {['نقداً', 'زين كاش', 'بطاقة / POS'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTxMethod(m)}
                        className="btn-secondary"
                        style={{
                          fontSize: '11px',
                          padding: '6px',
                          background: txMethod === m ? 'rgba(6, 182, 212, 0.15)' : undefined,
                          borderColor: txMethod === m ? 'var(--accent-cyan)' : undefined,
                          color: txMethod === m ? 'var(--accent-cyan)' : undefined,
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">البيان / ملاحظات السند</label>
                <input
                  type="text"
                  placeholder="مثال: دفعة من الحساب نقداً"
                  className="input-control"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  تأكيد وحفظ السند
                </button>
                <button type="button" onClick={() => setShowTxModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Debtor Detailed Statement */}
      {showStatementModal && statementData && (
        <div className="modal-overlay" onClick={() => setShowStatementModal(false)}>
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="var(--accent-cyan)" />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
                    كشف حساب مالي تفصيلي: {statementData.debtor?.name}
                  </h3>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    هاتف: {statementData.debtor?.phone || 'غير مسجل'} | تاريخ فتح الحساب: {new Date(statementData.debtor?.createdAt).toLocaleDateString('ar-IQ')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => window.print()} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }}>
                  <Printer size={14} />
                  <span>طباعة الكشف</span>
                </button>
                <button onClick={() => setShowStatementModal(false)} className="toast-close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Mini Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-title">إجمالي الديون</span>
                <span className="stat-value" style={{ fontSize: '16px' }}>{(statementData.summary?.totalDebt || 0).toLocaleString()} د.ع</span>
              </div>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-title">إجمالي المسدد</span>
                <span className="stat-value" style={{ fontSize: '16px', color: 'var(--accent-emerald)' }}>{(statementData.summary?.totalPaid || 0).toLocaleString()} د.ع</span>
              </div>
              <div className="stat-card" style={{ padding: '10px', borderRight: '3px solid var(--accent-rose)' }}>
                <span className="stat-title">الرصيد المتبقي المستحق</span>
                <span className="stat-value" style={{ fontSize: '16px', color: 'var(--accent-rose)' }}>{(statementData.summary?.remainingBalance || 0).toLocaleString()} د.ع</span>
              </div>
            </div>

            {/* Transactions History Table */}
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-main)' }}>
              سجل الحركات وسندات القبض/القيد ({statementData.debtor?.transactions?.length || 0})
            </strong>
            <div className="data-table-container" style={{ marginBottom: '18px' }}>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>التاريخ والوقت</th>
                    <th>نوع الحركة</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>رقم السند</th>
                    <th>البيان / الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {statementData.debtor?.transactions?.map((tx: any) => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(tx.createdAt).toLocaleDateString('ar-IQ')} - {new Date(tx.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${tx.type === 'PAYMENT' ? 'badge-ready' : 'badge-urgent'}`} style={{ fontSize: '10.5px' }}>
                          {tx.type === 'PAYMENT' ? 'سداد دفعة' : 'تقييد دين'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: tx.type === 'PAYMENT' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {tx.amount?.toLocaleString()} د.ع
                        </strong>
                      </td>
                      <td>{tx.paymentMethod || 'نقداً'}</td>
                      <td>{tx.voucherNumber ? `#${tx.voucherNumber}` : '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{tx.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Associated Samples if patient */}
            {statementData.patientSamples && statementData.patientSamples.length > 0 && (
              <>
                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-main)' }}>
                  سجل عينات وفحوصات المريض ({statementData.patientSamples.length})
                </strong>
                <div className="data-table-container">
                  <table className="data-table" style={{ fontSize: '11.5px' }}>
                    <thead>
                      <tr>
                        <th>رقم العينة</th>
                        <th>تاريخ الاستلام</th>
                        <th>الفحوصات المطلوبة</th>
                        <th>المبلغ الإجمالي</th>
                        <th>المدفوع</th>
                        <th>المتبقي دين</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementData.patientSamples.map((s: any) => (
                        <tr key={s.id}>
                          <td><strong>#{s.sampleNumber}</strong></td>
                          <td>{new Date(s.createdAt).toLocaleDateString('ar-IQ')}</td>
                          <td>{s.tests?.map((t: any) => t.test?.name).join(', ') || '-'}</td>
                          <td>{(s.priceTotal || 0).toLocaleString()} د.ع</td>
                          <td style={{ color: 'var(--accent-emerald)' }}>{(s.paidAmount || 0).toLocaleString()} د.ع</td>
                          <td>
                            <strong style={{ color: s.remainingAmount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                              {(s.remainingAmount || 0).toLocaleString()} د.ع
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: Instant Voucher Print Preview Modal */}
      {showVoucherModal && activeVoucher && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            {/* Thermal Slip Styled View */}
            <div id="thermal-voucher-print" style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '2px', color: '#000' }}>مختبر الرضا للتحليلات الطبية</h2>
              <p style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>هاتف: 07701234567 | بغداد</p>
              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
                <strong style={{ fontSize: '14px', display: 'block' }}>{activeVoucher.type}</strong>
                <span style={{ fontSize: '12px' }}>رقم السند: #{activeVoucher.voucherNumber}</span>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', margin: '10px 0', fontSize: '12px' }}>
                <div><strong>التاريخ:</strong> {activeVoucher.date}</div>
                <div><strong>الاسم:</strong> {activeVoucher.debtorName}</div>
                {activeVoucher.phone && <div><strong>الهاتف:</strong> {activeVoucher.phone}</div>}
                <div><strong>طريقة الدفع:</strong> {activeVoucher.paymentMethod}</div>
                <div><strong>البيان:</strong> {activeVoucher.notes}</div>
              </div>

              <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '4px', margin: '12px 0', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '11px', color: '#334155', display: 'block' }}>المبلغ المقبوض:</span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>{activeVoucher.amount?.toLocaleString()} دينار عراقي</strong>
              </div>

              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '10px' }}>
                شكراً لتعاملكم معنا. يعتبر هذا السند إشعاراً رسمياً بالقبض.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={printThermalVoucher} className="btn-primary" style={{ flex: 1 }}>
                <Printer size={15} />
                <span>طباعة السند فوري</span>
              </button>
              <button onClick={() => setShowVoucherModal(false)} className="btn-secondary">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
