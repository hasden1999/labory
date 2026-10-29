'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import {
  Plus,
  Wallet,
  CreditCard,
  Receipt,
  Stethoscope,
  Search,
  Trash2,
  X,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Printer,
} from 'lucide-react';
import { toEnglishDigits, formatEnglishDate } from '../../lib/formatters';

function UnifiedFinancialsView({
  initialRightTab = 'DEBTS',
  initialLeftFilter = 'ALL',
}: {
  initialRightTab?: 'DEBTS' | 'DOCTORS';
  initialLeftFilter?: 'ALL' | 'INCOME' | 'EXPENSE';
}) {
  const toast = useToast();
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [rightTab, setRightTab] = useState<'DEBTS' | 'DOCTORS'>(initialRightTab);
  const [leftFilter, setLeftFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>(initialLeftFilter);

  const [samples, setSamples] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rightSearch, setRightSearch] = useState('');
  const [leftSearch, setLeftSearch] = useState('');

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('مصاريف تشغيلية');
  const [savingExpense, setSavingExpense] = useState(false);

  // Doctor Modal
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('طب عام');
  const [docPhone, setDocPhone] = useState('');
  const [docCommission, setDocCommission] = useState('15');
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Quick Debt Pay Modal
  const [payingSample, setPayingSample] = useState<any | null>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [samplesRes, expensesRes, doctorsRes] = await Promise.all([
        apiRequest('/samples').catch(() => []),
        apiRequest('/expenses').catch(() => []),
        apiRequest('/doctors').catch(() => []),
      ]);
      setSamples(Array.isArray(samplesRes) ? samplesRes : []);
      setExpenses(Array.isArray(expensesRes) ? expensesRes : []);
      setDoctors(Array.isArray(doctorsRes) ? doctorsRes : []);
    } catch (err: any) {
      toast.error(err.message || 'تعذر تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const isWithinTimeframe = useCallback(
    (dateStr: string) => {
      if (timeframe === 'all' || !dateStr) return true;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return true;
      const now = new Date();
      if (timeframe === 'today') {
        return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      }
      if (timeframe === 'week') {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeframe === 'month') {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 31;
      }
      return true;
    },
    [timeframe]
  );

  // Combined Ledger (Income from Samples + Expenses)
  const ledgerItems = useMemo(() => {
    const items: any[] = [];

    samples.forEach((s) => {
      const dateStr = s.collectionTime || s.createdAt || new Date().toISOString();
      if (!isWithinTimeframe(dateStr)) return;
      const paid = Number(s.paidAmount ?? s.finalAmount ?? 0);
      if (paid > 0) {
        items.push({
          id: `sample-${s.id}`,
          rawId: s.id,
          type: 'INCOME',
          title: s.patient?.name || 'مراجع مختبر',
          subtitle: `عينة #${s.sampleNumber || s.id.slice(-4)}`,
          category: 'فحوصات طبية',
          amount: paid,
          date: dateStr,
        });
      }
    });

    expenses.forEach((ex) => {
      const dateStr = ex.date || ex.createdAt || new Date().toISOString();
      if (!isWithinTimeframe(dateStr)) return;
      const amt = Number(ex.amount || 0);
      if (amt > 0) {
        items.push({
          id: `exp-${ex.id}`,
          rawId: ex.id,
          type: 'EXPENSE',
          title: ex.description || ex.title || 'مصروف تشغيلي',
          subtitle: ex.category || 'مصاريف عامة',
          category: ex.category || 'مصاريف تشغيلية',
          amount: amt,
          date: dateStr,
        });
      }
    });

    return items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [samples, expenses, isWithinTimeframe]);

  // Summary Totals
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    ledgerItems.forEach((item) => {
      if (item.type === 'INCOME') income += item.amount;
      else expense += item.amount;
    });
    const totalDebt = samples.reduce((acc, s) => {
      const finalAmt = Number(s.finalAmount ?? s.totalAmount ?? 0);
      const paidAmt = Number(s.paidAmount ?? finalAmt);
      const rem = Math.max(0, Number(s.remainingAmount ?? finalAmt - paidAmt));
      return acc + rem;
    }, 0);
    return {
      income,
      expense,
      net: income - expense,
      totalDebt,
    };
  }, [ledgerItems, samples]);

  // Unpaid Samples (Debts List)
  const unpaidSamples = useMemo(() => {
    const q = toEnglishDigits(rightSearch).toLowerCase().trim();
    return samples
      .map((s) => {
        const finalAmt = Number(s.finalAmount ?? s.totalAmount ?? 0);
        const paidAmt = Number(s.paidAmount ?? finalAmt);
        const rem = Math.max(0, Number(s.remainingAmount ?? finalAmt - paidAmt));
        return { ...s, remainingCalc: rem, finalCalc: finalAmt, paidCalc: paidAmt };
      })
      .filter((s) => s.remainingCalc > 0)
      .filter((s) => {
        if (!q) return true;
        const pName = (s.patient?.name || '').toLowerCase();
        const sNum = String(s.sampleNumber || '').toLowerCase();
        return pName.includes(q) || sNum.includes(q);
      });
  }, [samples, rightSearch]);

  // Filtered Doctors List
  const filteredDoctors = useMemo(() => {
    const q = rightSearch.toLowerCase().trim();
    return doctors.filter((d) => {
      if (!q) return true;
      return (d.name || '').toLowerCase().includes(q) || (d.specialty || '').toLowerCase().includes(q);
    });
  }, [doctors, rightSearch]);

  // Filtered Ledger Items
  const filteredLedger = useMemo(() => {
    const q = toEnglishDigits(leftSearch).toLowerCase().trim();
    return ledgerItems.filter((item) => {
      if (leftFilter !== 'ALL' && item.type !== leftFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [ledgerItems, leftFilter, leftSearch]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(toEnglishDigits(expAmount));
    if (!expDesc.trim() || !amt || amt <= 0) {
      toast.warning('يرجى إدخال وصف المصروف والمبلغ');
      return;
    }
    setSavingExpense(true);
    try {
      await apiRequest('/expenses', 'POST', {
        description: expDesc.trim(),
        amount: amt,
        category: expCategory,
        date: new Date().toISOString().slice(0, 10),
      });
      toast.success('تم تسجيل المصروف بنجاح');
      setShowExpenseModal(false);
      setExpDesc('');
      setExpAmount('');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حفظ المصروف');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await apiRequest(`/expenses/${id}`, 'DELETE');
      toast.success('تم حذف المصروف');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف المصروف');
    }
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.warning('يرجى إدخال اسم الطبيب');
      return;
    }
    setSavingDoctor(true);
    try {
      await apiRequest('/doctors', 'POST', {
        name: docName.trim(),
        specialty: docSpecialty.trim(),
        phone: toEnglishDigits(docPhone.trim()),
        commissionRate: Number(toEnglishDigits(docCommission)) || 0,
      });
      toast.success('تمت إضافة الطبيب المحيل بنجاح');
      setShowDoctorModal(false);
      setDocName('');
      setDocPhone('');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حفظ الطبيب');
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      await apiRequest(`/doctors/${id}`, 'DELETE');
      toast.success('تم حذف الطبيب');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف الطبيب');
    }
  };

  const handleConfirmDebtPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSample) return;
    const amt = Number(toEnglishDigits(payAmountInput));
    if (!amt || amt <= 0) {
      toast.warning('يرجى إدخال مبلغ صحيح');
      return;
    }
    setSavingPay(true);
    try {
      const newPaid = Number(payingSample.paidCalc || 0) + amt;
      const newRem = Math.max(0, Number(payingSample.remainingCalc || 0) - amt);

      // 1. Try dedicated payment route first (/pay)
      try {
        await apiRequest(`/samples/${payingSample.id}/pay`, 'POST', {
          paidAmount: amt,
          payAmount: amt,
          paymentMethod: 'CASH',
          notes: 'تسديد دين من شاشة المالية',
        });
      } catch (payErr) {
        // 2. Fallback to sample PATCH if /pay is unavailable
        await apiRequest(`/samples/${payingSample.id}`, 'PATCH', {
          paidAmount: newPaid,
          remainingAmount: newRem,
          paymentStatus: newRem <= 0 ? 'PAID' : 'PARTIAL',
        });
      }

      toast.success('تم تسديد الدين وتحديث الصندوق بنجاح');
      setPayingSample(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر تسديد الدين');
    } finally {
      setSavingPay(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* 1. Compact Top Header Bar (48px) */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 4px 16px',
          backgroundColor: 'var(--bg-primary)',
          flexShrink: 0,
        }}
      >
        {/* Left Action Pill Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              backgroundColor: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(234, 88, 12, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>تسجيل مصروف</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRightTab('DOCTORS');
              setShowDoctorModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Stethoscope size={15} />
            <span>إضافة طبيب محيل</span>
          </button>

          {/* Quick Timeframe Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'الأسبوع' },
              { id: 'month', label: 'الشهر' },
              { id: 'all', label: 'الكل' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id as any)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: timeframe === tf.id ? '#0f766e' : 'transparent',
                  color: timeframe === tf.id ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Financial Summary Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <ArrowUpRight size={15} color="#16a34a" />
            <span style={{ color: 'var(--text-muted)' }}>المقبوضات:</span>
            <strong style={{ color: '#16a34a', fontSize: '14px' }}>
              {summary.income.toLocaleString()} {currency}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <ArrowDownRight size={15} color="#dc2626" />
            <span style={{ color: 'var(--text-muted)' }}>المصاريف:</span>
            <strong style={{ color: '#dc2626', fontSize: '14px' }}>
              {summary.expense.toLocaleString()} {currency}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid #0f766e',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <Wallet size={15} color="#0f766e" />
            <span style={{ color: 'var(--text-muted)' }}>صافي الصندوق:</span>
            <strong style={{ color: '#0f766e', fontSize: '14px' }}>
              {summary.net.toLocaleString()} {currency}
            </strong>
          </div>

          <button
            type="button"
            onClick={loadAll}
            title="تحديث الحسابات"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* 2. Split Workspace (Right: Debts & Referring Doctors | Left: Cash Box & Expenses Ledger) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          padding: '10px 16px 14px 16px',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* RIGHT PANEL: Debts & Referring Doctors (~390px) */}
        <section
          style={{
            width: '390px',
            minWidth: '390px',
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Top Switcher: Debts vs Doctors */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setRightTab('DEBTS')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: rightTab === 'DEBTS' ? '1.5px solid #dc2626' : '1px solid var(--border-color)',
                  backgroundColor: rightTab === 'DEBTS' ? 'rgba(220, 38, 38, 0.08)' : 'var(--bg-input)',
                  color: rightTab === 'DEBTS' ? '#dc2626' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard size={15} />
                <span>ديون المرضى ({unpaidSamples.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('DOCTORS')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: rightTab === 'DOCTORS' ? '1.5px solid #0284c7' : '1px solid var(--border-color)',
                  backgroundColor: rightTab === 'DOCTORS' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-input)',
                  color: rightTab === 'DOCTORS' ? '#0284c7' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Stethoscope size={15} />
                <span>الأطباء المحيلون ({doctors.length})</span>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={rightSearch}
                onChange={(e) => setRightSearch(e.target.value)}
                placeholder={rightTab === 'DEBTS' ? 'بحث عن مريض مديون...' : 'بحث عن طبيب محيل...'}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px 0 32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Scrollable List inside Right Panel */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {rightTab === 'DEBTS' ? (
              unpaidSamples.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  🎉 لا توجد ديون متبقية على المرضى
                </div>
              ) : (
                unpaidSamples.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {s.patient?.name || 'مريض'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          #{s.sampleNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 800, marginTop: '3px' }}>
                        المتبقي: {s.remainingCalc.toLocaleString()} {currency}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPayingSample(s);
                        setPayAmountInput(String(s.remainingCalc));
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0f766e',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      تسديد 💳
                    </button>
                  </div>
                ))
              )
            ) : filteredDoctors.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                لا يوجد أطباء مسجلون حالياً
              </div>
            ) : (
              filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)' }}>د. {doc.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                      {doc.specialty || 'طب عام'} • العمولة: {doc.commissionRate ?? 0}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoctor(doc.id)}
                    title="حذف الطبيب"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* LEFT PANEL: Daily Cash Box & Expenses Ledger (Flexible) */}
        <section
          style={{
            flex: 1,
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            minWidth: 0,
          }}
        >
          {/* Top Filter Bar inside Left Panel */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 900, color: 'var(--text-main)', marginLeft: '8px' }}>
                سجل حركات الصندوق والمصاريف
              </span>
              {[
                { id: 'ALL', label: 'كل الحركات' },
                { id: 'INCOME', label: 'المقبوضات فقط' },
                { id: 'EXPENSE', label: 'المصاريف فقط' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLeftFilter(f.id as any)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: leftFilter === f.id ? '1.5px solid #0f766e' : '1px solid var(--border-color)',
                    backgroundColor: leftFilter === f.id ? 'rgba(15, 118, 110, 0.1)' : 'var(--bg-input)',
                    color: leftFilter === f.id ? '#0f766e' : 'var(--text-muted)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '240px' }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
                placeholder="بحث في الحركات والمصاريف..."
                style={{
                  width: '100%',
                  height: '34px',
                  padding: '0 10px 0 30px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Scrollable Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700 }}>البيان / المراجع</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700 }}>التصنيف</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>النوع</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>التاريخ</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700 }}>المبلغ</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      جاري تحميل حركات الصندوق...
                    </td>
                  </tr>
                ) : filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      لا توجد حركات مالية مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((item) => {
                    const isIncome = item.type === 'INCOME';
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.subtitle}</div>
                        </td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.category}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: isIncome ? '#dcfce7' : '#fee2e2',
                              color: isIncome ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {isIncome ? 'مقبوضات +' : 'مصروف -'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {formatEnglishDate(item.date)}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'left',
                            fontWeight: 900,
                            fontSize: '14px',
                            color: isIncome ? '#15803d' : '#dc2626',
                          }}
                        >
                          {isIncome ? '+' : '-'} {item.amount.toLocaleString()} {currency}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {!isIncome && (
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(item.rawId)}
                              title="حذف المصروف"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleSaveExpense}
            style={{
              width: '400px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>تسجيل مصروف جديد</h3>
              <button type="button" onClick={() => setShowExpenseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>بيان المصروف</label>
              <input
                type="text"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="مثال: شراء مستلزمات، فاتورة كهرباء..."
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>المبلغ ({currency})</label>
              <input
                type="text"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="25000"
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>التصنيف</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              >
                <option value="مصاريف تشغيلية">مصاريف تشغيلية</option>
                <option value="شراء كواشف ومستلزمات">شراء كواشف ومستلزمات</option>
                <option value="رواتب وأجور">رواتب وأجور</option>
                <option value="صيانة وخدمات">صيانة وخدمات</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setShowExpenseModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button type="submit" disabled={savingExpense} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ea580c', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {savingExpense ? 'جاري الحفظ...' : 'حفظ المصروف'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Referring Doctor Modal */}
      {showDoctorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleSaveDoctor}
            style={{
              width: '400px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>إضافة طبيب محيل</h3>
              <button type="button" onClick={() => setShowDoctorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>اسم الطبيب</label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="مثال: أحمد العبيدي"
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>التخصص</label>
                <input
                  type="text"
                  value={docSpecialty}
                  onChange={(e) => setDocSpecialty(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ width: '110px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>نسبة العمولة %</label>
                <input
                  type="text"
                  value={docCommission}
                  onChange={(e) => setDocCommission(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>رقم الهاتف</label>
              <input
                type="text"
                value={docPhone}
                onChange={(e) => setDocPhone(e.target.value)}
                placeholder="0770..."
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setShowDoctorModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button type="submit" disabled={savingDoctor} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {savingDoctor ? 'جاري الحفظ...' : 'حفظ الطبيب'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Debt Pay Modal */}
      {payingSample && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleConfirmDebtPayment}
            style={{
              width: '380px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>تسديد دين المريض</h3>
              <button type="button" onClick={() => setPayingSample(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              المريض: <strong style={{ color: 'var(--text-main)' }}>{payingSample.patient?.name}</strong> | المتبقي:{' '}
              <strong style={{ color: '#dc2626' }}>
                {payingSample.remainingCalc.toLocaleString()} {currency}
              </strong>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>المبلغ المستلم ({currency})</label>
              <input
                type="text"
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: 800, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setPayingSample(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button type="submit" disabled={savingPay} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {savingPay ? 'جاري التسديد...' : 'تأكيد القبض'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function FinancialsPage() {
  const pathname = usePathname();
  const initialRightTab = pathname?.startsWith('/doctors') ? 'DOCTORS' : 'DEBTS';
  const initialLeftFilter = pathname?.startsWith('/expenses') ? 'EXPENSE' : 'ALL';
  return <UnifiedFinancialsView initialRightTab={initialRightTab} initialLeftFilter={initialLeftFilter} />;
}
