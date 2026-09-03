'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
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
  Check
} from 'lucide-react';

export default function DebtsPage() {
  const toast = useToast();
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);

  // Form states
  const [newDebtorName, setNewDebtorName] = useState('');
  const [newDebtorPhone, setNewDebtorPhone] = useState('');
  const [newDebtorNotes, setNewDebtorNotes] = useState('');
  const [initialDebtInput, setInitialDebtInput] = useState('');

  // Selected Debtor for Transaction / Statement
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [txType, setTxType] = useState<'DEBT' | 'PAYMENT'>('PAYMENT');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [statementData, setStatementData] = useState<any>(null);

  const loadDebtors = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/debts');
      setDebtors(res || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل سجل الديون', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebtors();
  }, []);

  const handleCreateDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtorName.trim()) {
      toast.warning('الرجاء إدخال اسم الشخص أو الجهة المدينة', 'بيانات ناقصة');
      return;
    }

    try {
      await apiRequest('/debts', 'POST', {
        name: newDebtorName.trim(),
        phone: newDebtorPhone,
        notes: newDebtorNotes,
        initialDebt: initialDebtInput ? Number(initialDebtInput) : undefined,
      });

      setShowAddDebtorModal(false);
      setNewDebtorName('');
      setNewDebtorPhone('');
      setNewDebtorNotes('');
      setInitialDebtInput('');
      toast.success('تم فتح حساب مدين جديد بنجاح!', 'تم الحفظ');
      loadDebtors();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء إضافة المدين', 'فشل الحفظ');
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor || !txAmount || Number(txAmount) <= 0) {
      toast.warning('الرجاء إدخال مبلغ صحيح للعملية', 'مبلغ غير صالح');
      return;
    }

    try {
      await apiRequest('/debts/' + selectedDebtor.id + '/transaction', 'POST', {
        type: txType,
        amount: Number(txAmount),
        notes: txNotes,
      });

      setShowTxModal(false);
      setTxAmount('');
      setTxNotes('');
      toast.success(
        txType === 'PAYMENT' ? 'تم تسجيل سداد الدفعة بنجاح وتخفيض الدين!' : 'تم تقييد الدين الإضافي بنجاح!',
        'تسجيل حركة مالية'
      );
      loadDebtors();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء تسجيل الحركة', 'فشل العملية');
    }
  };

  const handleOpenStatement = async (debtor: any) => {
    setSelectedDebtor(debtor);
    try {
      const res = await apiRequest('/debts/' + debtor.id + '/statement');
      setStatementData(res);
      setShowStatementModal(true);
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب كشف الحساب', 'خطأ');
    }
  };

  const totalOutstanding = debtors.reduce((acc, d) => acc + (d.remainingBalance || 0), 0);

  const filteredDebtors = useMemo(() => {
    return debtors.filter((d) => {
      if (!searchQuery) return true;
      return d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.phone && d.phone.includes(searchQuery));
    });
  }, [debtors, searchQuery]);

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CreditCard color="#06b6d4" size={24} />
            سجل الديون والآجل وإدارة المقبوضات
          </h1>
          <p className="page-subtitle">تتبع الديون المتبقية بذمة المرضى والجهات، تسجيل الدفعات المسددة، وطباعة كشوفات الحسابات</p>
        </div>

        <button onClick={() => setShowAddDebtorModal(true)} className="btn-primary">
          <UserPlus size={16} />
          <span>فتح حساب مدين جديد</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="responsive-four-strip">
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-rose)' }}>
          <span className="stat-title">إجمالي الديون المتبقية في ذمة المدينين</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {totalOutstanding.toLocaleString()} د.ع
          </span>
          <span className="stat-desc">مبالغ مستحقة قيد التحصيل</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
          <span className="stat-title">عدد الحسابات والمدينين المسجلين</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {debtors.length} حساب
          </span>
          <span className="stat-desc">مرضى وجهات</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ marginBottom: '14px', padding: '12px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            className="input-control"
            style={{ paddingRight: '32px', fontSize: '12.5px', minHeight: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Debtors Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم المدين / المريض</th>
                <th>رقم الهاتف</th>
                <th>الرصيد المتبقي (الدين الحالي)</th>
                <th>ملاحظات</th>
                <th>تاريخ الفتح</th>
                <th>إجراءات مالية</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب سجل الديون...</td>
                </tr>
              ) : filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد حسابات ديون مطابقة للبحث</td>
                </tr>
              ) : (
                filteredDebtors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{d.name}</strong>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{d.phone || '-'}</td>
                    <td>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: d.remainingBalance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                        {d.remainingBalance?.toLocaleString()} د.ع
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>{d.notes || '-'}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString('ar-IQ')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedDebtor(d);
                            setTxType('PAYMENT');
                            setTxAmount(String(d.remainingBalance > 0 ? d.remainingBalance : ''));
                            setShowTxModal(true);
                          }}
                          className="btn-success"
                          style={{ padding: '4px 10px', fontSize: '11.5px', minHeight: '30px' }}
                        >
                          <ArrowDownLeft size={13} />
                          <span>سداد دفعة</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDebtor(d);
                            setTxType('DEBT');
                            setTxAmount('');
                            setShowTxModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', minHeight: '30px' }}
                        >
                          <ArrowUpRight size={13} />
                          <span>تقييد دين</span>
                        </button>

                        <button
                          onClick={() => handleOpenStatement(d)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', minHeight: '30px', color: 'var(--accent-cyan)' }}
                        >
                          <FileText size={13} />
                          <span>كشف حساب</span>
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

      {/* Add Debtor Modal */}
      {showAddDebtorModal && (
        <div className="modal-overlay" onClick={() => setShowAddDebtorModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>فتح حساب مدين جديد</h3>
              </div>
              <button onClick={() => setShowAddDebtorModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDebtor} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">اسم المدين / المريض / الجهة *</label>
                <input
                  type="text"
                  placeholder="مثال: حسام عادل جاسم"
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
                <label className="input-label">رصيد الدين الافتتاحي إن وجد (د.ع)</label>
                <input
                  type="number"
                  placeholder="مثال: 15000"
                  className="input-control"
                  value={initialDebtInput}
                  onChange={(e) => setInitialDebtInput(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="input-label">ملاحظات إضافية</label>
                <input
                  type="text"
                  placeholder="مثال: مريض طرف د. حيدر"
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

      {/* Transaction Modal (Payment or Debt) */}
      {showTxModal && selectedDebtor && (
        <div className="modal-overlay" onClick={() => setShowTxModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                {txType === 'PAYMENT' ? 'تسجيل سداد دفعة نقدية' : 'تقييد دين إضافي'} للمدين: {selectedDebtor.name}
              </h3>
              <button onClick={() => setShowTxModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>الدين الحالي القائم:</span>
                <strong style={{ fontSize: '14px', color: 'var(--accent-rose)' }}>{selectedDebtor.remainingBalance?.toLocaleString()} د.ع</strong>
              </div>

              <div>
                <label className="input-label">مبلغ الحركة (د.ع) *</label>
                <input
                  type="number"
                  placeholder="أدخل المبلغ..."
                  className="input-control"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  min="1"
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">ملاحظات / رقم وصل السداد</label>
                <input
                  type="text"
                  placeholder="مثال: دفعة نقدية واصلة"
                  className="input-control"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className={txType === 'PAYMENT' ? 'btn-success' : 'btn-primary'} style={{ flex: 1 }}>
                  تأكيد وحفظ الحركة
                </button>
                <button type="button" onClick={() => setShowTxModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementModal && selectedDebtor && statementData && (
        <div className="modal-overlay" onClick={() => setShowStatementModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  كشف حساب المدين: {selectedDebtor.name}
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedDebtor.phone || 'بدون هاتف'}</span>
              </div>
              <button onClick={() => setShowStatementModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>الرصيد المتبقي الإجمالي:</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>{selectedDebtor.remainingBalance?.toLocaleString()} د.ع</strong>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>نوع العملية</th>
                    <th>المبلغ</th>
                    <th>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  {statementData.transactions?.map((tx: any) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.createdAt).toLocaleDateString('ar-IQ')}</td>
                      <td>
                        {tx.type === 'DEBT' ? (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>دين (+)</span>
                        ) : (
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>سداد دفعة (-)</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800 }}>{tx.amount?.toLocaleString()} د.ع</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{tx.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'left' }}>
              <button onClick={() => setShowStatementModal(false)} className="btn-secondary">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
