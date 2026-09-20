'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { 
  TrendingUp, 
  Receipt, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  X, 
  Printer,
  Wallet,
  Clock,
  ShieldCheck,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { toEnglishDigits, formatEnglishDate, formatEnglishTime, formatEnglishDateTime } from '../../lib/formatters';
import { useLab } from '../../components/LabContext';

export default function FinancialsPage() {
  const toast = useToast();
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';
  const [activeTab, setActiveTab] = useState<'summary' | 'shifts' | 'transactions' | 'debts' | 'expenses' | 'profitability'>('summary');
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timeframe and Custom Date states
  const [timeframe, setTimeframe] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<any>(null);

  // Form Expense (سند صرف)
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('مصاريف تشغيلية');
  const [expenseMethod, setExpenseMethod] = useState('نقداً');

  // Form Income (سند قبض)
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('سند قبض');
  const [incomeMethod, setIncomeMethod] = useState('نقداً');
  const [debtorsList, setDebtorsList] = useState<any[]>([]);
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [debtSearchQuery, setDebtSearchQuery] = useState('');

  // Form Shifts
  const [startingCashInput, setStartingCashInput] = useState('');
  const [shiftNotesInput, setShiftNotesInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [currentShiftData, setCurrentShiftData] = useState<any>(null);
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);

  // Transactions Ledger States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txMethodFilter, setTxMethodFilter] = useState('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Profitability Analytics States
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitSearchQuery, setProfitSearchQuery] = useState('');

  const loadFinancials = async () => {
    setLoading(true);
    try {
      let url = `/financials/summary?timeframe=${timeframe}`;
      if (timeframe === 'custom' && customStartDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate || customStartDate}`;
      }
      const res = await apiRequest(url);
      setFinancialData(res);
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب البيانات المالية', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentShift = async () => {
    try {
      const res = await apiRequest('/financials/shifts/current');
      setCurrentShiftData(res?.activeShift || null);
    } catch (err) {
      // ignore
    }
  };

  const loadShiftHistory = async () => {
    try {
      const res = await apiRequest('/financials/shifts/history');
      setShiftHistory(res || []);
    } catch (err) {
      // ignore
    }
  };

  const loadTransactions = async () => {
    setTxLoading(true);
    try {
      let url = `/financials/transactions?type=${txTypeFilter}&paymentMethod=${txMethodFilter}&query=${encodeURIComponent(txSearchQuery)}`;
      const res = await apiRequest(url);
      setTransactions(res?.transactions || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب سجل الحركات المالية', 'خطأ');
    } finally {
      setTxLoading(false);
    }
  };

  const loadProfitability = async () => {
    setProfitLoading(true);
    try {
      const res = await apiRequest('/financials/test-profitability?timeframe=' + (timeframe === 'custom' ? 'month' : timeframe));
      setProfitabilityData(Array.isArray(res) ? res : (res?.breakdown || []));
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب تحليل الربحية', 'خطأ');
    } finally {
      setProfitLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
    loadCurrentShift();
  }, [timeframe, customStartDate, customEndDate]);

  useEffect(() => {
    if (activeTab === 'shifts') {
      loadCurrentShift();
      loadShiftHistory();
    } else if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'debts') {
      loadDebts();
    } else if (activeTab === 'profitability') {
      loadProfitability();
    }
  }, [activeTab, txTypeFilter, txMethodFilter]);

  const loadDebts = async () => {
    setDebtsLoading(true);
    try {
      const res = await apiRequest('/financials/debts');
      setDebtorsList(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب قائمة الديون والذمم', 'خطأ');
    } finally {
      setDebtsLoading(false);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeDesc.trim() || !incomeAmount || Number(incomeAmount) <= 0) {
      toast.warning('الرجاء إدخال وصف ومبلغ سند القبض بشكل صحيح', 'بيانات ناقصة');
      return;
    }

    try {
      const res = await apiRequest('/financials/income', 'POST', {
        description: incomeDesc.trim(),
        amount: Number(incomeAmount),
        category: incomeCategory,
        paymentMethod: incomeMethod,
        debtorId: selectedDebtorId || undefined,
      });

      setShowIncomeModal(false);
      setIncomeDesc('');
      setIncomeAmount('');
      const chosenDebtor = debtorsList.find((d) => d.id === selectedDebtorId);
      setSelectedDebtorId('');
      toast.success('تم تسجيل سند القبض بنجاح وتحديث الصندوق!', 'سند قبض');
      loadFinancials();
      if (activeTab === 'debts') loadDebts();
      if (activeTab === 'transactions') loadTransactions();
      if (res?.voucherNumber) {
        setActiveVoucher({
          voucherNumber: toEnglishDigits(res.voucherNumber),
          debtorName: chosenDebtor ? `العميل / المدين: ${chosenDebtor.name}` : incomeDesc.trim(),
          amount: Number(incomeAmount),
          type: 'سند قبض رسمي (Cash In)',
          paymentMethod: incomeMethod,
          date: formatEnglishDateTime(new Date()),
          notes: incomeCategory,
        });
        setShowVoucherModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء تسجيل سند القبض', 'فشل الحفظ');
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || Number(expenseAmount) <= 0) {
      toast.warning('الرجاء إدخال وصف ومبلغ المصروف بشكل صحيح', 'بيانات ناقصة');
      return;
    }

    try {
      const res = await apiRequest('/financials/expenses', 'POST', {
        description: expenseDesc.trim(),
        amount: Number(expenseAmount),
        category: expenseCat,
        paymentMethod: expenseMethod,
      });

      setShowExpenseModal(false);
      setExpenseDesc('');
      setExpenseAmount('');
      toast.success('تم تسجيل سند الصرف بنجاح!', 'سند صرف');
      loadFinancials();
      if (res?.voucherNumber) {
        setActiveVoucher({
          voucherNumber: toEnglishDigits(res.voucherNumber),
          debtorName: 'مصروف تشغيلي: ' + expenseDesc.trim(),
          amount: Number(expenseAmount),
          type: 'سند صرف رسمي',
          paymentMethod: expenseMethod,
          date: formatEnglishDateTime(new Date()),
          notes: expenseCat,
        });
        setShowVoucherModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء تسجيل المصروف', 'فشل الحفظ');
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/financials/shifts/open', 'POST', {
        startingCash: Number(startingCashInput) || 0,
        notes: shiftNotesInput.trim() || undefined,
      });
      setShowOpenShiftModal(false);
      setStartingCashInput('');
      setShiftNotesInput('');
      toast.success('تم فتح الوردية وتفعيل الصندوق اليومي بنجاح!', 'فتح وردية');
      loadCurrentShift();
      loadShiftHistory();
    } catch (err: any) {
      toast.error(err.message || 'فشل فتح الوردية', 'خطأ');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCashInput) {
      toast.warning('يرجى إدخال المبلغ الفعلي المعدود بالقاصة', 'بيانات ناقصة');
      return;
    }

    try {
      const res = await apiRequest('/financials/shifts/close', 'POST', {
        actualCash: Number(actualCashInput),
        notes: shiftNotesInput.trim() || undefined,
      });

      setShowCloseShiftModal(false);
      setActualCashInput('');
      setShiftNotesInput('');
      
      const disc = res?.stats?.discrepancy || 0;
      if (disc === 0) {
        toast.success('تم إغلاق الوردية بنجاح! الصندوق مطابق 100%', 'تقفيل الصندوق');
      } else if (disc > 0) {
        toast.warning(`تم إغلاق الوردية مع وجود زيادة في الصندوق قدرها ${disc.toLocaleString()} ${currency}`, 'فائض نقد');
      } else {
        toast.error(`تم إغلاق الوردية مع وجود عجز في الصندوق قدره ${Math.abs(disc).toLocaleString()} ${currency}`, 'عجز نقد');
      }

      loadCurrentShift();
      loadShiftHistory();
    } catch (err: any) {
      toast.error(err.message || 'فشل إغلاق الوردية', 'خطأ');
    }
  };

  const handleExportTransactionsCSV = () => {
    if (transactions.length === 0) {
      toast.warning('لا توجد حركات لتصديرها', 'تنبيه');
      return;
    }

    const headers = ['رقم السند', 'النوع', 'المبلغ', 'طريقة الدفع', 'الجهة / المريض', 'البيان', 'التاريخ والوقت'];
    const rows = transactions.map(t => [
      t.voucherNumber ? `#${toEnglishDigits(t.voucherNumber)}` : '',
      `"${t.type}"`,
      t.amount,
      `"${t.paymentMethod || 'نقداً'}"`,
      `"${t.patient?.name || t.debtor?.name || ''}"`,
      `"${t.notes || ''}"`,
      `"${formatEnglishDateTime(t.createdAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `سجل_الحركات_المالية_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف الإكسل بنجاح!', 'تصدير');
  };

  const summary = financialData || {};

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TrendingUp color="#06b6d4" size={24} />
            النظام المالي وإدارة الصندوق والورديات
          </h1>
          <p className="page-subtitle">تتبع الصندوق اليومي لحظياً، جلسات الورديات Z-Report، سجل العمليات وسندات القبض والصرف، وقائمة الأرباح</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn-secondary" title="طباعة تقرير">
            <Printer size={15} />
            <span>طباعة التقرير</span>
          </button>

          <button onClick={() => { loadDebts(); setShowIncomeModal(true); }} className="btn-primary" style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}>
            <Plus size={16} />
            <span>تسجيل سند قبض جديد</span>
          </button>

          <button onClick={() => setShowExpenseModal(true)} className="btn-primary">
            <Plus size={16} />
            <span>تسجيل سند صرف جديد</span>
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '16px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>الفترة الزمنية:</span>
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'yesterday', label: 'أمس' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'all', label: 'كل الفترات' },
            { id: 'custom', label: 'نطاق مخصص...' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className="btn-secondary"
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                background: timeframe === tf.id ? 'rgba(6, 182, 212, 0.15)' : undefined,
                borderColor: timeframe === tf.id ? 'var(--accent-cyan)' : undefined,
                color: timeframe === tf.id ? 'var(--accent-cyan)' : undefined,
                fontWeight: timeframe === tf.id ? 800 : 500,
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {timeframe === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>من:</span>
            <input
              type="date"
              className="input-control"
              style={{ padding: '4px 8px', fontSize: '11.5px', height: '32px' }}
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>إلى:</span>
            <input
              type="date"
              className="input-control"
              style={{ padding: '4px 8px', fontSize: '11.5px', height: '32px' }}
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
            <button onClick={loadFinancials} className="btn-primary" style={{ padding: '4px 12px', height: '32px', fontSize: '11.5px' }}>
              تطبيق
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '18px', overflowX: 'auto' }}>
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
          <span>الموجز المالي وقائمة الأرباح</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`btn-secondary ${activeTab === 'shifts' ? 'active' : ''}`}
          style={{
            background: activeTab === 'shifts' ? 'rgba(245, 158, 11, 0.15)' : undefined,
            borderColor: activeTab === 'shifts' ? '#f59e0b' : undefined,
            color: activeTab === 'shifts' ? '#f59e0b' : undefined,
          }}
        >
          <Clock size={16} />
          <span>الصندوق والورديات اليومية</span>
          {currentShiftData && (
            <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
              نشط
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`btn-secondary ${activeTab === 'transactions' ? 'active' : ''}`}
          style={{
            background: activeTab === 'transactions' ? 'rgba(139, 92, 246, 0.15)' : undefined,
            borderColor: activeTab === 'transactions' ? '#8b5cf6' : undefined,
            color: activeTab === 'transactions' ? '#8b5cf6' : undefined,
          }}
        >
          <Receipt size={16} />
          <span>سجل الحركات والسندات</span>
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`btn-secondary ${activeTab === 'debts' ? 'active' : ''}`}
          style={{
            background: activeTab === 'debts' ? 'rgba(239, 68, 68, 0.15)' : undefined,
            borderColor: activeTab === 'debts' ? '#ef4444' : undefined,
            color: activeTab === 'debts' ? '#ef4444' : undefined,
          }}
        >
          <Receipt size={16} />
          <span>إدارة الديون والذمم</span>
          {debtorsList.some((d) => (d.balance || 0) > 0) && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
              مستحق
            </span>
          )}
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
          <ArrowUpRight size={16} />
          <span>سجل المصاريف التشغيلية</span>
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
          <Receipt size={16} />
          <span>تحليل ربحية الفحوصات</span>
        </button>
      </div>

      {/* TAB 1: SUMMARY & P&L */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Main KPI Strip */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
              <span className="stat-title">إجمالي المبيعات (Gross Sales)</span>
              <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {(summary.pnl?.grossRevenue ?? summary.totalRevenue ?? 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">القيمة الإجمالية لكل الفحوصات المنفذة</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
              <span className="stat-title">النقد المستلم الفعلي (Cash In)</span>
              <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {(summary.totalPaid || 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">المبالغ المقبوضة فعلياً بالصندوق</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid #14b8a6' }}>
              <span className="stat-title">مجمل الربح الطبي (GOP)</span>
              <span className="stat-value" style={{ color: '#14b8a6' }}>
                {(summary.pnl?.grossOperatingProfit ?? 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">الإيراد بعد خصم الكواشف والعمولات</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid #38bdf8' }}>
              <span className="stat-title">صافي الربح التشغيلي (Net Profit)</span>
              <span className="stat-value" style={{ color: '#38bdf8' }}>
                {(summary.pnl?.netProfit ?? summary.netProfit ?? 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">
                هامش الربح التشغيلي: <strong>{summary.pnl?.operatingMarginPct ?? 0}%</strong>
              </span>
            </div>
          </div>

          {/* Clinical P&L Waterfall Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} color="var(--accent-cyan)" />
                <div>
                  <strong style={{ fontSize: '14px', display: 'block' }}>قائمة الأرباح والخسائر الطبية التشغيلية (Clinical P&L Waterfall Statement)</strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>تحليل مسار السيولة: من إجمالي مبيعات التحاليل وحتى صافي الأرباح بعد استقطاع تكلفة الكواشف والمصاريف</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-ready" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  هامش الربح: {summary.pnl?.operatingMarginPct ?? 0}%
                </span>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                    <th>بند القائمة المالية</th>
                    <th>التصنيف المحاسبي</th>
                    <th style={{ textAlign: 'left' }}>القيمة ({currency})</th>
                    <th style={{ textAlign: 'center' }}>التأثير</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-cyan)' }}>1</td>
                    <td><strong>إجمالي مبيعات الفحوصات (Gross Test Revenue)</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>إيرادات مخبرية إجمالية</td>
                    <td style={{ textAlign: 'left', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {(summary.pnl?.grossRevenue ?? summary.totalRevenue ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-ready">+ إيراد</span></td>
                  </tr>

                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-rose)' }}>2</td>
                    <td>خصومات وتخفيضات المرضى (Discounts Given)</td>
                    <td style={{ color: 'var(--text-muted)' }}>تخفيضات مبيعات</td>
                    <td style={{ textAlign: 'left', fontWeight: 700, color: 'var(--accent-rose)' }}>
                      -{(summary.pnl?.discounts ?? summary.totalDiscounts ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-urgent">- خصم</span></td>
                  </tr>

                  <tr style={{ background: 'rgba(6, 182, 212, 0.04)', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--accent-cyan)' }}>=</td>
                    <td><strong>صافي إيرادات الفحوصات المنفذة (Net Sales Revenue)</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>صافي المبيعات المحققة</td>
                    <td style={{ textAlign: 'left', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '13px' }}>
                      {(summary.pnl?.netSalesRevenue ?? ((summary.pnl?.grossRevenue ?? summary.totalRevenue ?? 0) - (summary.pnl?.discounts ?? summary.totalDiscounts ?? 0))).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-progress">= صافي مبيعات</span></td>
                  </tr>

                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>3</td>
                    <td>تكلفة الكواشف والمحاليل المستهلكة (Direct Reagent Cost / COGS)</td>
                    <td style={{ color: 'var(--text-muted)' }}>تكلفة بضاعة مباعة مباشرة</td>
                    <td style={{ textAlign: 'left', fontWeight: 700, color: '#f59e0b' }}>
                      -{(summary.pnl?.directReagentCost ?? summary.outgoings?.totalTestCosts ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-urgent">- كلفة مباشرة</span></td>
                  </tr>

                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#8b5cf6' }}>4</td>
                    <td>عمولات وحوافز الأطباء المحيلين (Referring Doctor Commissions)</td>
                    <td style={{ color: 'var(--text-muted)' }}>أتعاب إحالة طبية</td>
                    <td style={{ textAlign: 'left', fontWeight: 700, color: '#8b5cf6' }}>
                      -{(summary.pnl?.doctorCommissions ?? summary.totalDoctorCommissions ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-urgent">- عمولة</span></td>
                  </tr>

                  <tr style={{ background: 'rgba(20, 184, 166, 0.06)', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#14b8a6' }}>=</td>
                    <td><strong>مجمل الربح التشغيلي الطبي (Gross Operating Profit - GOP)</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>الربح الطبي المباشر</td>
                    <td style={{ textAlign: 'left', fontWeight: 800, color: '#14b8a6', fontSize: '13px' }}>
                      {(summary.pnl?.grossOperatingProfit ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-ready">= مجمل ربح</span></td>
                  </tr>

                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-rose)' }}>5</td>
                    <td>المصاريف التشغيلية والإدارية العامة (OPEX)</td>
                    <td style={{ color: 'var(--text-muted)' }}>إيجارات، رواتب، كهرباء ونثريات</td>
                    <td style={{ textAlign: 'left', fontWeight: 700, color: 'var(--accent-rose)' }}>
                      -{(summary.pnl?.operatingExpenses ?? summary.totalExpenses ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-urgent">- مصاريف تشغيل</span></td>
                  </tr>

                  <tr style={{ background: 'rgba(56, 189, 248, 0.1)', borderTop: '2px solid var(--accent-cyan)' }}>
                    <td style={{ textAlign: 'center', fontWeight: 900, color: '#38bdf8', fontSize: '15px' }}>★</td>
                    <td><strong>صافي الربح التشغيلي النهائي (Net Operating Profit)</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>صافي عائد المختبر للفترة</td>
                    <td style={{ textAlign: 'left', fontWeight: 900, color: '#38bdf8', fontSize: '15px' }}>
                      {(summary.pnl?.netProfit ?? summary.netProfit ?? 0).toLocaleString()} {currency}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-ready" style={{ fontWeight: 800 }}>
                        صافي نهائي ({summary.pnl?.operatingMarginPct ?? 0}%)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Accounts Receivable Aging Overview (أعمار الديون والذمم) */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#f59e0b" />
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>أعمار الديون والذمم المستحقة (Accounts Receivable Aging)</h3>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>توزيع مستحقات المختبر بذمة المرضى والشركات والعيادات حسب فترات الاستحقاق</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('debts')}
                className="btn-secondary"
                style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>إدارة ومتابعة الذمم</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: '8px', borderRight: '3px solid var(--accent-emerald)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>ديون جارية (0 - 15 يوماً)</span>
                  <span className="badge badge-ready" style={{ fontSize: '10px' }}>اعتيادي</span>
                </div>
                <strong style={{ fontSize: '17px', color: 'var(--accent-emerald)', display: 'block', marginBottom: '4px' }}>
                  {(summary.debtAging?.current ?? 0).toLocaleString()} {currency}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ضمن الدورة الائتمانية المقبولة</span>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: '8px', borderRight: '3px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>ديون متوسطة (16 - 30 يوماً)</span>
                  <span className="badge badge-urgent" style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: '#f59e0b' }}>متابعة</span>
                </div>
                <strong style={{ fontSize: '17px', color: '#f59e0b', display: 'block', marginBottom: '4px' }}>
                  {(summary.debtAging?.medium ?? 0).toLocaleString()} {currency}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>تتطلب إشعار تذكير ومتابعة ودية</span>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: '8px', borderRight: '3px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>ديون حرجة / متأخرة (&gt; 30 يوماً)</span>
                  <span className="badge badge-urgent" style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: '#ef4444' }}>حرجة</span>
                </div>
                <strong style={{ fontSize: '17px', color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                  {(summary.debtAging?.critical ?? 0).toLocaleString()} {currency}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>متأخرة وتتطلب اتخاذ إجراء فوري</span>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution & Outgoings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={16} color="var(--accent-cyan)" />
                <span>قنوات الدخل والنقد المستلم في هذه الفترة</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>نقد ورقي (كاش الصندوق):</span>
                  <strong style={{ color: 'var(--accent-emerald)', fontSize: '14px' }}>
                    {(summary.paymentMethodBreakdown?.cash || 0).toLocaleString()} {currency}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>محافظ إلكترونية (زين كاش):</span>
                  <strong style={{ color: 'var(--accent-cyan)', fontSize: '14px' }}>
                    {(summary.paymentMethodBreakdown?.zainCash || 0).toLocaleString()} {currency}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>بطاقات مصرفية / POS:</span>
                  <strong style={{ color: '#a855f7', fontSize: '14px' }}>
                    {(summary.paymentMethodBreakdown?.card || 0).toLocaleString()} {currency}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <span style={{ color: 'var(--accent-rose)' }}>إجمالي الذمم غير المحصلة (أرصدة المدينين):</span>
                  <strong style={{ color: 'var(--accent-rose)', fontSize: '14px' }}>
                    {(summary.debtAging?.total ?? summary.totalRemainingDebts ?? 0).toLocaleString()} {currency}
                  </strong>
                </div>
              </div>
            </div>

            {/* Expense Categories Breakdown */}
            <div className="glass-card">
              <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} color="var(--accent-rose)" />
                <span>تصنيفات المصاريف التشغيلية</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {!summary.expenseCategories || summary.expenseCategories.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '12px' }}>
                    لا توجد مصاريف مسجلة خلال هذه الفترة
                  </div>
                ) : (
                  summary.expenseCategories.map((ec: any) => (
                    <div key={ec.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: '6px', fontSize: '12px' }}>
                      <span>{ec.category}</span>
                      <strong style={{ color: 'var(--accent-rose)' }}>{ec.amount?.toLocaleString()} {currency}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASH DRAWER & SHIFTS */}
      {activeTab === 'shifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Active Shift Card */}
          <div className="glass-card" style={{ border: currentShiftData ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: currentShiftData ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} color={currentShiftData ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                </div>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>
                    {currentShiftData ? `الوردية الحالية رقم #${toEnglishDigits(currentShiftData.shiftNumber)} (مفتوحة ومفعلة)` : 'الصندوق اليومي مغلق حالياً'}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {currentShiftData ? `تم الفتح: ${formatEnglishDate(currentShiftData.openedAt)} ${formatEnglishTime(currentShiftData.openedAt)} ${currentShiftData.openedById ? `| المشغل: ${currentShiftData.openedById}` : ''}` : 'اضغط على زر فتح الوردية لبدء تسجيل حركات الصندوق واستلام دفعات المرضى'}
                  </span>
                </div>
              </div>

              <div>
                {currentShiftData ? (
                  <button onClick={() => setShowCloseShiftModal(true)} className="btn-primary" style={{ background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}>
                    <ShieldCheck size={16} />
                    <span>تقفيل الصندوق والوردية (Z-Report)</span>
                  </button>
                ) : (
                  <button onClick={() => setShowOpenShiftModal(true)} className="btn-primary">
                    <Plus size={16} />
                    <span>فتح وردية صندوق جديدة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Current Shift Numbers */}
            {currentShiftData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '14px' }}>
                <div className="stat-card" style={{ padding: '12px' }}>
                  <span className="stat-title">العهدة الافتتاحية (Float)</span>
                  <span className="stat-value" style={{ fontSize: '16px' }}>{(currentShiftData.startingCash || 0).toLocaleString()} {currency}</span>
                  <span className="stat-desc">رصيد القاصة عند البدء</span>
                </div>

                <div className="stat-card" style={{ padding: '12px', borderRight: '3px solid var(--accent-emerald)' }}>
                  <span className="stat-title">المقبوض كاش بالوردية</span>
                  <span className="stat-value" style={{ fontSize: '16px', color: 'var(--accent-emerald)' }}>
                    {(currentShiftData.cashIn ?? currentShiftData.cashCollected ?? 0).toLocaleString()} {currency}
                  </span>
                  <span className="stat-desc">وارد نقدي ورقي</span>
                </div>

                <div className="stat-card" style={{ padding: '12px', borderRight: '3px solid var(--accent-cyan)' }}>
                  <span className="stat-title">مقبوض إلكتروني</span>
                  <span className="stat-value" style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>
                    {((currentShiftData.cardIn || 0) + (currentShiftData.zainCashIn || 0)).toLocaleString()} {currency}
                  </span>
                  <span className="stat-desc">زين كاش وبطاقات POS</span>
                </div>

                <div className="stat-card" style={{ padding: '12px', borderRight: '3px solid var(--accent-rose)' }}>
                  <span className="stat-title">المصروف نقداً بالوردية</span>
                  <span className="stat-value" style={{ fontSize: '16px', color: 'var(--accent-rose)' }}>
                    {(currentShiftData.cashOut ?? currentShiftData.cashExpenses ?? 0).toLocaleString()} {currency}
                  </span>
                  <span className="stat-desc">سندات صرف نقدي</span>
                </div>

                <div className="stat-card" style={{ padding: '12px', borderRight: '3px solid #38bdf8', background: 'rgba(56, 189, 248, 0.06)' }}>
                  <span className="stat-title">النقد المتوقع بالقاصة</span>
                  <span className="stat-value" style={{ fontSize: '17px', color: '#38bdf8' }}>
                    {(currentShiftData.expectedCash ?? currentShiftData.expectedCashInDrawer ?? 0).toLocaleString()} {currency}
                  </span>
                  <span className="stat-desc">المبلغ المطلوب حسابه الآن</span>
                </div>
              </div>
            )}
          </div>

          {/* Past Shifts History Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13.5px' }}>سجل الورديات السابقة وإقفالات الصندوق</strong>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>آخر 30 وردية</span>
            </div>

            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>رقم الوردية</th>
                    <th>تاريخ الفتح</th>
                    <th>تاريخ الإغلاق</th>
                    <th>المشغل</th>
                    <th>الافتتاحي</th>
                    <th>المتوقع</th>
                    <th>المستلم فعلياً</th>
                    <th>الفارق (عجز/زيادة)</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                        لا توجد إقفالات ورديات سابقة مسجلة
                      </td>
                    </tr>
                  ) : (
                    shiftHistory.map((sh) => {
                      const disc = sh.discrepancy ?? 0;
                      return (
                        <tr key={sh.id}>
                          <td><strong>#{toEnglishDigits(sh.shiftNumber)}</strong></td>
                          <td>{formatEnglishDate(sh.openedAt)} {formatEnglishTime(sh.openedAt)}</td>
                          <td>{sh.closedAt ? `${formatEnglishDate(sh.closedAt)} ${formatEnglishTime(sh.closedAt)}` : '-'}</td>
                          <td>{sh.closedById || sh.openedById}</td>
                          <td>{(sh.startingCash || 0).toLocaleString()} {currency}</td>
                          <td>{(sh.expectedCash || 0).toLocaleString()} {currency}</td>
                          <td><strong>{(sh.actualCash || 0).toLocaleString()} {currency}</strong></td>
                          <td>
                            {sh.status === 'OPEN' ? (
                              <span style={{ color: 'var(--text-dim)' }}>قيد التشغيل</span>
                            ) : disc === 0 ? (
                              <span className="badge badge-ready">مطابق تماماً</span>
                            ) : disc > 0 ? (
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>+{disc.toLocaleString()} (زيادة)</span>
                            ) : (
                              <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>{disc.toLocaleString()} (عجز)</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${sh.status === 'OPEN' ? 'badge-progress' : 'badge-ready'}`}>
                              {sh.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
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

      {/* TAB 3: TRANSACTIONS & VOUCHERS LEDGER */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Strip */}
          <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="بحث برقم السند، الاسم، البيان..."
                  className="input-control"
                  style={{ paddingRight: '30px', height: '34px', fontSize: '12px' }}
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
                />
              </div>

              {/* Type filter */}
              <select
                className="input-control"
                style={{ height: '34px', fontSize: '12px' }}
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
              >
                <option value="ALL">جميع أنواع الحركات</option>
                <option value="INCOME_SAMPLE">رسوم فحوصات عينات</option>
                <option value="DEBT_PAYMENT">سداد ديون مرضى</option>
                <option value="EXPENSE">مصاريف تشغيلية</option>
                <option value="SUPPLIER_PAYMENT">دفعات موردين</option>
                <option value="DOCTOR_COMMISSION">عمولات أطباء</option>
              </select>

              {/* Method filter */}
              <select
                className="input-control"
                style={{ height: '34px', fontSize: '12px' }}
                value={txMethodFilter}
                onChange={(e) => setTxMethodFilter(e.target.value)}
              >
                <option value="ALL">جميع طرق الدفع</option>
                <option value="نقداً">نقداً (كاش)</option>
                <option value="زين كاش">زين كاش</option>
                <option value="بطاقة">بطاقة / POS</option>
              </select>

              <button onClick={loadTransactions} className="btn-primary" style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}>
                فلترة
              </button>
            </div>

            <button onClick={handleExportTransactionsCSV} className="btn-secondary" style={{ height: '34px', fontSize: '12px' }}>
              <FileSpreadsheet size={15} />
              <span>تصدير Excel (CSV)</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>رقم السند</th>
                    <th>التاريخ والوقت</th>
                    <th>نوع الحركة</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>الجهة / المريض</th>
                    <th>البيان والتفاصيل</th>
                    <th style={{ textAlign: 'center' }}>معاينة وطباعة</th>
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        جاري تحميل سجل الحركات...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                        لا توجد حركات مالية مطابقة للشروط
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isIncome = tx.type === 'INCOME_SAMPLE' || tx.type === 'DEBT_PAYMENT';
                      return (
                        <tr key={tx.id}>
                          <td><strong>#{toEnglishDigits(tx.voucherNumber) || '-'}</strong></td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {formatEnglishDate(tx.createdAt)} {formatEnglishTime(tx.createdAt)}
                          </td>
                          <td>
                            <span className={`badge ${isIncome ? 'badge-ready' : 'badge-urgent'}`} style={{ fontSize: '10.5px' }}>
                              {tx.type === 'INCOME_SAMPLE' ? 'قبض فحص' : tx.type === 'DEBT_PAYMENT' ? 'سداد دين' : tx.type === 'SUPPLIER_PAYMENT' ? 'صرف مورد' : 'سند صرف'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: isIncome ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '13px' }}>
                              {isIncome ? '+' : '-'}{tx.amount?.toLocaleString()} {currency}
                            </strong>
                          </td>
                          <td>{tx.paymentMethod || 'نقداً'}</td>
                          <td>{tx.patient?.name || tx.debtor?.name || tx.doctor?.name || '-'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{tx.notes || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setActiveVoucher({
                                  voucherNumber: toEnglishDigits(tx.voucherNumber),
                                  debtorName: tx.patient?.name || tx.debtor?.name || tx.doctor?.name || 'حساب نقدي',
                                  phone: tx.patient?.phone ? toEnglishDigits(tx.patient.phone) : (tx.debtor?.phone ? toEnglishDigits(tx.debtor.phone) : ''),
                                  amount: tx.amount,
                                  type: isIncome ? 'سند قبض مالي' : 'سند صرف رسمي',
                                  paymentMethod: tx.paymentMethod || 'نقداً',
                                  date: formatEnglishDateTime(tx.createdAt),
                                  notes: tx.notes || tx.category || '',
                                });
                                setShowVoucherModal(true);
                              }}
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="طباعة السند حراري"
                            >
                              <Printer size={12} />
                              <span>طباعة</span>
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
        </div>
      )}

      {/* TAB: DEBTS & RECEIVABLES */}
      {activeTab === 'debts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Debts Summary KPI Strip */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card" style={{ borderRight: '4px solid #ef4444' }}>
              <span className="stat-title">إجمالي الذمم المطلوبة (Total Debts)</span>
              <span className="stat-value" style={{ color: '#ef4444' }}>
                {debtorsList.reduce((acc, d) => acc + (d.totalDebt || 0), 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">إجمالي مبالغ الذمم والديون المسجلة على الزبائن والجهات</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
              <span className="stat-title">المبالغ المسددة (Total Paid)</span>
              <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {debtorsList.reduce((acc, d) => acc + (d.totalPaid || 0), 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">إجمالي دفعات السداد المقبوضة فعلياً</span>
            </div>

            <div className="stat-card" style={{ borderRight: '4px solid #f59e0b' }}>
              <span className="stat-title">الرصيد المتبقي بذمة المدينين (Outstanding Balance)</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>
                {debtorsList.reduce((acc, d) => acc + (d.balance || 0), 0).toLocaleString()} {currency}
              </span>
              <span className="stat-desc">صافي الديون المستحقة واجبة التحصيل</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', display: 'block' }}>سجل حسابات المدينين والعملاء والشركات</strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>متابعة أرصدة الذمم، فترات الاستحقاق، وتوليد سندات القبض الفورية</span>
                </div>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="بحث باسم المدين أو الهاتف..."
                    className="input-control"
                    style={{ paddingRight: '30px', height: '32px', fontSize: '11.5px' }}
                    value={debtSearchQuery}
                    onChange={(e) => setDebtSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedDebtorId('');
                  setIncomeDesc('');
                  setIncomeCategory('سند قبض');
                  setShowIncomeModal(true);
                }} 
                className="btn-primary" 
                style={{ padding: '4px 12px', fontSize: '12px', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
              >
                <Plus size={14} />
                <span>تسجيل دفعة / قبض جديد</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>اسم المدين / الجهة</th>
                    <th>نوع الحساب</th>
                    <th>حالة الاستحقاق</th>
                    <th>رقم الهاتف</th>
                    <th>إجمالي الدين</th>
                    <th>المسدد</th>
                    <th>الرصيد المتبقي</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {debtsLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        جاري تحميل سجلات الديون والذمم...
                      </td>
                    </tr>
                  ) : (() => {
                    const filtered = debtorsList.filter((d: any) => {
                      if (!debtSearchQuery.trim()) return true;
                      const q = debtSearchQuery.toLowerCase().trim();
                      return (
                        (d.name && d.name.toLowerCase().includes(q)) ||
                        (d.phone && d.phone.includes(q))
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                            لا توجد حسابات ديون أو ذمم مطابقة للبحث
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((d: any) => {
                      let ageDays = 0;
                      if (d.transactions && d.transactions.length > 0) {
                        const debtTxs = d.transactions.filter((tx: any) => tx.type === 'DEBT');
                        if (debtTxs.length > 0) {
                          const earliest = new Date(debtTxs[debtTxs.length - 1].createdAt || debtTxs[debtTxs.length - 1].date || Date.now()).getTime();
                          ageDays = Math.max(0, Math.floor((Date.now() - earliest) / (1000 * 60 * 60 * 24)));
                        }
                      }

                      return (
                        <tr key={d.id}>
                          <td><strong>{d.name}</strong></td>
                          <td>
                            <span className="badge badge-progress">
                              {d.type === 'COMPANY' ? 'شركة / تأمين' : d.type === 'CLINIC' ? 'عيادة / طبيب' : 'مريض / فرد'}
                            </span>
                          </td>
                          <td>
                            {(d.balance || 0) <= 0 ? (
                              <span className="badge badge-ready" style={{ fontSize: '10.5px' }}>✓ مسدد بالكامل</span>
                            ) : ageDays <= 15 ? (
                              <span className="badge badge-ready" style={{ fontSize: '10.5px' }}>جاري ({toEnglishDigits(ageDays)} يوم)</span>
                            ) : ageDays <= 30 ? (
                              <span className="badge badge-urgent" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: '#f59e0b', fontSize: '10.5px' }}>
                                متابعة ({toEnglishDigits(ageDays)} يوم)
                              </span>
                            ) : (
                              <span className="badge badge-urgent" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: '#ef4444', fontSize: '10.5px' }}>
                                حرج (+{toEnglishDigits(ageDays)} يوم)
                              </span>
                            )}
                          </td>
                          <td>{d.phone ? toEnglishDigits(d.phone) : '-'}</td>
                          <td><strong>{(d.totalDebt || 0).toLocaleString()} {currency}</strong></td>
                          <td style={{ color: 'var(--accent-emerald)' }}>{(d.totalPaid || 0).toLocaleString()} {currency}</td>
                          <td>
                            <strong style={{ color: (d.balance || 0) > 0 ? '#ef4444' : 'var(--text-dim)', fontSize: '13px' }}>
                              {(d.balance || 0).toLocaleString()} {currency}
                            </strong>
                          </td>
                          <td>
                            {(d.balance || 0) > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedDebtorId(d.id);
                                  setIncomeDesc(`سداد دفعة من رصيد: ${d.name}`);
                                  setIncomeAmount(d.balance.toString());
                                  setIncomeCategory('سداد دين');
                                  setShowIncomeModal(true);
                                }}
                                className="btn-primary"
                                style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
                              >
                                <Plus size={12} />
                                <span>سداد دفعة</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                                لا توجد مستحقات
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13.5px' }}>سجل المصاريف التشغيلية للمختبر</strong>
              <button onClick={() => setShowExpenseModal(true)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                <Plus size={14} />
                <span>تسجيل مصروف جديد</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>رقم السند</th>
                    <th>التاريخ</th>
                    <th>البيان والتفاصيل</th>
                    <th>التصنيف</th>
                    <th>طريقة الدفع</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {!summary.expensesList || summary.expensesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                        لا توجد قيود مصاريف مسجلة
                      </td>
                    </tr>
                  ) : (
                    summary.expensesList.map((ex: any) => (
                      <tr key={ex.id}>
                        <td><strong>#{toEnglishDigits(ex.voucherNumber) || '-'}</strong></td>
                        <td>{formatEnglishDate(ex.date)}</td>
                        <td><strong>{ex.description}</strong></td>
                        <td><span className="badge badge-progress">{ex.category}</span></td>
                        <td>{ex.paymentMethod || 'نقداً'}</td>
                        <td><strong style={{ color: 'var(--accent-rose)' }}>{ex.amount?.toLocaleString()} {currency}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TEST PROFITABILITY */}
      {activeTab === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            const list: any[] = Array.isArray(profitabilityData) ? profitabilityData : [];
            const totalTestsCount = list.reduce((acc, t) => acc + (t.count || 0), 0);
            const totalRevenueSum = list.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);
            const totalCostSum = list.reduce((acc, t) => acc + (t.totalCost || 0), 0);
            const totalProfitSum = list.reduce((acc, t) => acc + (t.totalProfit ?? t.netProfit ?? 0), 0);
            const avgMargin = totalRevenueSum > 0 ? Math.round((totalProfitSum / totalRevenueSum) * 100) : 0;

            const filteredList = list.filter((t: any) => {
              if (!profitSearchQuery.trim()) return true;
              const q = profitSearchQuery.toLowerCase().trim();
              return (
                (t.name && t.name.toLowerCase().includes(q)) ||
                (t.testName && t.testName.toLowerCase().includes(q)) ||
                (t.category && t.category.toLowerCase().includes(q)) ||
                (t.testCode && t.testCode.toLowerCase().includes(q))
              );
            });

            return (
              <>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
                    <span className="stat-title">إجمالي الفحوصات المنفذة</span>
                    <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{totalTestsCount.toLocaleString()} فحص</span>
                    <span className="stat-desc">عدد التحاليل المنجزة في هذه الفترة</span>
                  </div>

                  <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
                    <span className="stat-title">إجمالي عوائد الفحوصات</span>
                    <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{totalRevenueSum.toLocaleString()} {currency}</span>
                    <span className="stat-desc">القيمة البيعية الإجمالية</span>
                  </div>

                  <div className="stat-card" style={{ borderRight: '4px solid #f59e0b' }}>
                    <span className="stat-title">تكلفة الكواشف المباشرة</span>
                    <span className="stat-value" style={{ color: '#f59e0b' }}>{totalCostSum.toLocaleString()} {currency}</span>
                    <span className="stat-desc">كلفة المستهلكات والمحاليل الفعلية</span>
                  </div>

                  <div className="stat-card" style={{ borderRight: '4px solid #38bdf8' }}>
                    <span className="stat-title">صافي المساهمة الربحية</span>
                    <span className="stat-value" style={{ color: '#38bdf8' }}>{totalProfitSum.toLocaleString()} {currency}</span>
                    <span className="stat-desc">متوسط هامش الربح الإجمالي: <strong>{avgMargin}%</strong></span>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px', display: 'block' }}>تحليل ربحية الفحوصات والكلفة المباشرة للعينات</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>مقارنة سعر البيع مع كلفة الكواشف والمحاليل لتقييم الجدوى الاقتصادية لكل فحص</span>
                    </div>

                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="بحث باسم الفحص أو القسم..."
                        className="input-control"
                        style={{ paddingRight: '30px', height: '32px', fontSize: '11.5px' }}
                        value={profitSearchQuery}
                        onChange={(e) => setProfitSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>اسم الفحص والكود</th>
                          <th>القسم المخبري</th>
                          <th>سعر الفحص (بيع)</th>
                          <th>الكلفة المباشرة (كواشف)</th>
                          <th>هامش الربح %</th>
                          <th>العدد المنفذ</th>
                          <th>إجمالي الإيراد</th>
                          <th>صافي الربح المتحقق</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitLoading ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              جاري تحليل ربحية الفحوصات...
                            </td>
                          </tr>
                        ) : filteredList.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                              لا توجد بيانات فحوصات مطابقة للبحث
                            </td>
                          </tr>
                        ) : (
                          filteredList.map((t: any) => {
                            const margin = t.profitMargin ?? t.marginPercent ?? 0;
                            return (
                              <tr key={t.testId || t.name}>
                                <td>
                                  <strong>{t.name || t.testName}</strong>
                                  {t.testCode && (
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginRight: '6px' }}>({t.testCode})</span>
                                  )}
                                </td>
                                <td><span className="badge badge-progress">{t.category || 'عام'}</span></td>
                                <td>{(t.price ?? t.unitPrice ?? 0).toLocaleString()} {currency}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{(t.costEstimate ?? t.unitCost ?? 0).toLocaleString()} {currency}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: margin >= 60 ? 'var(--accent-emerald)' : margin >= 40 ? '#f59e0b' : 'var(--accent-rose)', fontWeight: 800 }}>
                                      {margin}%
                                    </span>
                                    <div style={{ width: '45px', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          width: `${Math.min(100, Math.max(0, margin))}%`,
                                          height: '100%',
                                          background: margin >= 60 ? 'var(--accent-emerald)' : margin >= 40 ? '#f59e0b' : 'var(--accent-rose)',
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td><strong>{t.count || 0}</strong></td>
                                <td>{(t.totalRevenue || 0).toLocaleString()} {currency}</td>
                                <td>
                                  <strong style={{ color: (t.totalProfit ?? t.netProfit ?? 0) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                    {(t.totalProfit ?? t.netProfit ?? 0).toLocaleString()} {currency}
                                  </strong>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* MODAL 1: Expense Registration */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>تسجيل سند صرف / مصروف جديد</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">بيان وتفاصيل المصروف *</label>
                <input
                  type="text"
                  placeholder="مثال: شراء محاليل غسيل جهاز CBC"
                  className="input-control"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">المبلغ المطلوب صرفه ({currency}) *</label>
                <input
                  type="number"
                  placeholder="مثال: 35000"
                  className="input-control"
                  style={{ fontSize: '15px', fontWeight: 800 }}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="input-label">فئة المصروف</label>
                <select
                  className="input-control"
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                >
                  <option value="مصاريف تشغيلية">مصاريف تشغيلية عامة</option>
                  <option value="كواشف ومواد">كواشف ومواد ومستهلكات</option>
                  <option value="صيانة أجهزة">صيانة ودعم أجهزة</option>
                  <option value="إيجار">إيجار المختبر</option>
                  <option value="رواتب">رواتب وأجور كوادر</option>
                  <option value="كهرباء ووقود">كهرباء ومولد ووقود</option>
                  <option value="قرطاسية ومطبوعات">قرطاسية ومطبوعات وسندات</option>
                  <option value="أخرى">نثريات ومصاريف أخرى</option>
                </select>
              </div>

              <div>
                <label className="input-label">طريقة الصرف</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['نقداً', 'زين كاش', 'بطاقة / POS'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExpenseMethod(m)}
                      className="btn-secondary"
                      style={{
                        fontSize: '11px',
                        padding: '6px',
                        background: expenseMethod === m ? 'rgba(6, 182, 212, 0.15)' : undefined,
                        borderColor: expenseMethod === m ? 'var(--accent-cyan)' : undefined,
                        color: expenseMethod === m ? 'var(--accent-cyan)' : undefined,
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ وتأكيد السند
                </button>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Income Registration (سند قبض) */}
      {showIncomeModal && (
        <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>تسجيل سند قبض / وارد نقد (Cash In)</h3>
              </div>
              <button onClick={() => setShowIncomeModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">بيان وتفاصيل المقبوض *</label>
                <input
                  type="text"
                  placeholder="مثال: سداد دفعة حساب، مقبوضات خارجية..."
                  className="input-control"
                  value={incomeDesc}
                  onChange={(e) => setIncomeDesc(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">المبلغ المقبوض ({currency}) *</label>
                <input
                  type="number"
                  placeholder="مثال: 50000"
                  className="input-control"
                  style={{ fontSize: '15px', fontWeight: 800 }}
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="input-label">ربط بحساب مدين / جهة (اختياري)</label>
                <select
                  className="input-control"
                  value={selectedDebtorId}
                  onChange={(e) => {
                    setSelectedDebtorId(e.target.value);
                    const chosen = debtorsList.find((d) => d.id === e.target.value);
                    if (chosen && !incomeDesc) {
                      setIncomeDesc(`سداد دفعة من رصيد: ${chosen.name}`);
                    }
                  }}
                >
                  <option value="">-- بدون ربط بحساب مدين (مقبوضات عامة) --</option>
                  {debtorsList.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.type === 'COMPANY' ? 'شركة' : d.type === 'CLINIC' ? 'عيادة' : 'فرد'}) - الرصيد المتبقي: {(d.balance || 0).toLocaleString()} {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">فئة السند</label>
                <select
                  className="input-control"
                  value={incomeCategory}
                  onChange={(e) => setIncomeCategory(e.target.value)}
                >
                  <option value="سند قبض">سند قبض عام</option>
                  <option value="سداد دين">سداد دين / ذمم</option>
                  <option value="فحوصات خارجية">إيراد فحوصات خارجية</option>
                  <option value="أمانات">أمانات ودفعة تحت الحساب</option>
                  <option value="إيرادات أخرى">إيرادات ونثريات أخرى</option>
                </select>
              </div>

              <div>
                <label className="input-label">طريقة القبض</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['نقداً', 'زين كاش', 'بطاقة / POS'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setIncomeMethod(m)}
                      className="btn-secondary"
                      style={{
                        fontSize: '11px',
                        padding: '6px',
                        background: incomeMethod === m ? 'rgba(16, 185, 129, 0.15)' : undefined,
                        borderColor: incomeMethod === m ? 'var(--accent-emerald)' : undefined,
                        color: incomeMethod === m ? 'var(--accent-emerald)' : undefined,
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}>
                  حفظ وتأكيد السند
                </button>
                <button type="button" onClick={() => setShowIncomeModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showOpenShiftModal && (
        <div className="modal-overlay" onClick={() => setShowOpenShiftModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>فتح وردية صندوق جديدة</h3>
              </div>
              <button onClick={() => setShowOpenShiftModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">العهدة النقدية الافتتاحية في القاصة ({currency})</label>
                <input
                  type="number"
                  placeholder="مثال: 50000"
                  className="input-control"
                  style={{ fontSize: '15px', fontWeight: 800 }}
                  value={startingCashInput}
                  onChange={(e) => setStartingCashInput(e.target.value)}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>المبلغ النقدي المتروك كصرافة قبل بدء استلام المرضى</span>
              </div>

              <div>
                <label className="input-label">ملاحظات الوردية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: الوردية الصباحية - موظف الاستقبال أحمد"
                  className="input-control"
                  value={shiftNotesInput}
                  onChange={(e) => setShiftNotesInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  بدء وفتح الوردية
                </button>
                <button type="button" onClick={() => setShowOpenShiftModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Close Shift Modal */}
      {showCloseShiftModal && currentShiftData && (
        <div className="modal-overlay" onClick={() => setShowCloseShiftModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>تقفيل الصندوق وتصفية الوردية</h3>
              </div>
              <button onClick={() => setShowCloseShiftModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            {(() => {
              const expectedVal = currentShiftData.expectedCash ?? currentShiftData.expectedCashInDrawer ?? 0;
              const cashInVal = currentShiftData.cashIn ?? currentShiftData.cashCollected ?? 0;
              const cashOutVal = currentShiftData.cashOut ?? currentShiftData.cashExpenses ?? 0;
              const diffVal = Number(actualCashInput || 0) - expectedVal;

              return (
                <>
                  <div style={{ background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                      <span>النقد المتوقع حسابه بالقاصة:</span>
                      <strong style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>
                        {expectedVal.toLocaleString()} {currency}
                      </strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      (الافتتاحي: {(currentShiftData.startingCash || 0).toLocaleString()} + المقبوض كاش: {cashInVal.toLocaleString()} - المصروف نقداً: {cashOutVal.toLocaleString()})
                    </span>
                  </div>

                  <form onSubmit={handleCloseShift} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="input-label">المبلغ النقدي الفعلي المعدود في القاصة ({currency}) *</label>
                      <input
                        type="number"
                        placeholder="أدخل المبلغ بعد العد الفعلي..."
                        className="input-control"
                        style={{ fontSize: '16px', fontWeight: 800 }}
                        value={actualCashInput}
                        onChange={(e) => setActualCashInput(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    {actualCashInput && (
                      <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', background: diffVal === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }}>
                        {diffVal === 0 ? (
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓ المبلغ مطابق تماماً للمتوقع (لا يوجد عجز أو زيادة)</span>
                        ) : diffVal > 0 ? (
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>
                            + زيادة في الصندوق: {diffVal.toLocaleString()} {currency}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>
                            - عجز في الصندوق: {Math.abs(diffVal).toLocaleString()} {currency}
                          </span>
                        )}
                      </div>
                    )}

              <div>
                <label className="input-label">ملاحظات التقفيل والتسليم</label>
                <input
                  type="text"
                  placeholder="مثال: تم تسليم القاصة للإدارة مع الصرافة"
                  className="input-control"
                  value={shiftNotesInput}
                  onChange={(e) => setShiftNotesInput(e.target.value)}
                />
              </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}>
                        تأكيد تقفيل الوردية وإصدار التقرير
                      </button>
                      <button type="button" onClick={() => setShowCloseShiftModal(false)} className="btn-secondary">
                        إلغاء
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 4: Instant Voucher Print Preview Modal */}
      {showVoucherModal && activeVoucher && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div id="thermal-voucher-print" style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '2px', color: '#000' }}>مختبر الرضا للتحليلات الطبية</h2>
              <p style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>هاتف: 07701234567 | بغداد</p>
              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
                <strong style={{ fontSize: '14px', display: 'block' }}>{activeVoucher.type}</strong>
                <span style={{ fontSize: '12px' }}>رقم السند: #{activeVoucher.voucherNumber}</span>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', margin: '10px 0', fontSize: '12px' }}>
                <div><strong>التاريخ:</strong> {activeVoucher.date}</div>
                <div><strong>البيان / الجهة:</strong> {activeVoucher.debtorName}</div>
                <div><strong>طريقة الدفع:</strong> {activeVoucher.paymentMethod}</div>
                {activeVoucher.notes && <div><strong>التفاصيل:</strong> {activeVoucher.notes}</div>}
              </div>

              <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '4px', margin: '12px 0', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '11px', color: '#334155', display: 'block' }}>المبلغ:</span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>{activeVoucher.amount?.toLocaleString()} دينار عراقي</strong>
              </div>

              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '10px' }}>
                سند رسمي معتمد صادِر عن منظومة المختبر الإلكترونية.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1 }}>
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
