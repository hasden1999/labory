'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Activity, Search, Plus, FileText, Printer, Share2, CheckCircle2, Clock, FlaskConical, AlertCircle, X, ChevronLeft, Send, RefreshCw, Eye, Calendar, Filter, User, History, Check, AlertOctagon, Zap } from 'lucide-react';

function SamplesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date Filtering: Defaults to 'TODAY' so every new day starts clean!
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');
  const [customDate, setCustomDate] = useState<string>('');

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'URGENT' | 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED'>('ALL');

  // Preview & Share Modals
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappText, setWhatsappText] = useState('');

  const loadSamples = async (showToast = false) => {
    setLoading(true);
    try {
      let url = `/samples?dateFilter=${dateFilter}`;
      if (customDate) {
        url = `/samples?customDate=${customDate}`;
      }
      const res = await apiRequest(url);
      setSamples(res || []);
      if (showToast) toast.success('تم تحديث قائمة عينات وسجل اليوم بنجاح!', 'تحديث حي');
    } catch (err: any) {
      toast.error('فشل في جلب قائمة العينات', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['ALL', 'URGENT', 'RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED'].includes(filterParam)) {
      setStatusFilter(filterParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    loadSamples();
  }, [dateFilter, customDate]);

  const handleUpdateStatus = async (sampleId: string, status: string) => {
    try {
      await apiRequest(`/samples/${sampleId}/status`, 'PATCH', { status });
      const label = 
        status === 'IN_PROGRESS' ? 'جاري الفحص' :
        status === 'READY' ? 'النتيجة جاهزة للطباعة' :
        status === 'DELIVERED' ? 'تم تسليم التقرير للمريض' : 'تم أخذ العينة';
      toast.success(`تم تحديث حالة العينة إلى: ${label}`, 'تحديث الحالة');
      loadSamples();
    } catch (err: any) {
      toast.error('فشل تحديث الحالة', 'خطأ');
    }
  };

  const handleOpenWhatsApp = (sample: any) => {
    const phone = sample.patient?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `964${cleanPhone.slice(1)}` : cleanPhone;
    setWhatsappPhone(formattedPhone);

    const reportUrl = `${window.location.origin}/api/samples/${sample.id}/print`;
    setWhatsappText(
      `مرحباً ${sample.patient?.name}،\nيسر مختبر الرضا للتحليلات الطبية إعلامكم بصدور نتائج فحصكم رقم (#${sample.sampleNumber}).\nيمكنكم الاطلاع على التقرير المعتمد وتحميله مباشرة من الرابط:\n${reportUrl}\n\nنتمنى لكم دوام الصحة والعافية.`
    );
    setShowWhatsAppModal(true);
  };

  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const matchStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'URGENT' ? s.isUrgent :
        s.status === statusFilter;

      const matchSearch = !searchQuery.trim() ||
        s.sampleNumber.toString().includes(searchQuery) ||
        (s.patient?.name && s.patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.patient?.phone && s.patient.phone.includes(searchQuery));

      return matchStatus && matchSearch;
    });
  }, [samples, statusFilter, searchQuery]);

  // Status Metrics
  const stats = useMemo(() => {
    const total = samples.length;
    const received = samples.filter((s) => s.status === 'RECEIVED').length;
    const inProgress = samples.filter((s) => s.status === 'IN_PROGRESS').length;
    const ready = samples.filter((s) => s.status === 'READY').length;
    const delivered = samples.filter((s) => s.status === 'DELIVERED').length;
    const urgent = samples.filter((s) => s.isUrgent).length;
    return { total, received, inProgress, ready, delivered, urgent };
  }, [samples]);

  return (
    <AppShell>
      {/* 1. Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity size={18} color="var(--accent-cyan)" />
            <span>سجل العينات والطلبات اليومية</span>
            <span className="badge badge-received" style={{ fontSize: '11px', marginRight: '6px' }}>
              {dateFilter === 'TODAY' ? 'كشف اليوم' : dateFilter === 'YESTERDAY' ? 'الأمس' : dateFilter === 'WEEK' ? 'الأسبوع الحالي' : dateFilter === 'MONTH' ? 'الشهر الحالي' : 'كافة السجلات'}
            </span>
          </h1>
          <p className="page-subtitle">
            متابعة مراحل العينات اللحظية: استلام العينة ➔ جاري الفحص ➔ جاهزة للطباعة ➔ تم تسليم التقرير
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => loadSamples(true)} className="btn-secondary" title="تحديث القائمة">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>تحديث</span>
          </button>
          <button onClick={() => router.push('/')} className="btn-primary">
            <Plus size={14} />
            <span>تسجيل عينة جديدة (F2)</span>
          </button>
        </div>
      </div>

      {/* 2. DATE FILTER BAR (Daily Clean Slate) */}
      <div className="glass-card" style={{ marginBottom: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 700, marginLeft: '6px' }}>
            <Calendar size={14} color="var(--accent-cyan)" />
            <span>الفترة الزمنية:</span>
          </div>

          <button
            onClick={() => { setCustomDate(''); setDateFilter('TODAY'); }}
            className={`category-pill ${dateFilter === 'TODAY' && !customDate ? 'active' : ''}`}
          >
            ☀️ عينات اليوم ({dateFilter === 'TODAY' ? stats.total : 'اليوم'})
          </button>

          <button
            onClick={() => { setCustomDate(''); setDateFilter('YESTERDAY'); }}
            className={`category-pill ${dateFilter === 'YESTERDAY' && !customDate ? 'active' : ''}`}
          >
            الأمس
          </button>

          <button
            onClick={() => { setCustomDate(''); setDateFilter('WEEK'); }}
            className={`category-pill ${dateFilter === 'WEEK' && !customDate ? 'active' : ''}`}
          >
            آخر 7 أيام
          </button>

          <button
            onClick={() => { setCustomDate(''); setDateFilter('MONTH'); }}
            className={`category-pill ${dateFilter === 'MONTH' && !customDate ? 'active' : ''}`}
          >
            هذا الشهر
          </button>

          <button
            onClick={() => { setCustomDate(''); setDateFilter('ALL'); }}
            className={`category-pill ${dateFilter === 'ALL' && !customDate ? 'active' : ''}`}
          >
            🗂️ الأرشيف الشامل (الكل)
          </button>
        </div>

        {/* Custom Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>تاريخ محدد:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
            }}
            className="input-control"
            style={{ height: '30px', padding: '2px 8px', fontSize: '11.5px', width: '135px' }}
          />
          {customDate && (
            <button
              onClick={() => { setCustomDate(''); setDateFilter('TODAY'); }}
              className="btn-icon"
              title="إلغاء التحديد والعودة لليوم"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Status Summary Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', marginBottom: '12px' }}>
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`stat-card cursor-pointer ${statusFilter === 'ALL' ? 'border-accent' : ''}`}
          style={{ padding: '10px 12px', cursor: 'pointer', border: statusFilter === 'ALL' ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)' }}
        >
          <span className="stat-title">إجمالي العينات المسجلة</span>
          <strong className="stat-value">{stats.total}</strong>
          <span className="stat-desc">كافة حالات اليوم</span>
        </div>

        <div
          onClick={() => setStatusFilter('RECEIVED')}
          className="stat-card cursor-pointer"
          style={{ padding: '10px 12px', cursor: 'pointer', border: statusFilter === 'RECEIVED' ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)' }}
        >
          <span className="stat-title" style={{ color: 'var(--text-muted)' }}>📥 تم أخذ العينة (بالانتظار)</span>
          <strong className="stat-value" style={{ color: 'var(--text-main)' }}>{stats.received}</strong>
          <span className="stat-desc">بانتظار بدء التحليل</span>
        </div>

        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className="stat-card cursor-pointer"
          style={{ padding: '10px 12px', cursor: 'pointer', border: statusFilter === 'IN_PROGRESS' ? '1px solid #f59e0b' : '1px solid var(--border-color)' }}
        >
          <span className="stat-title" style={{ color: '#fbbf24' }}>جاري الفحص المخبري</span>
          <strong className="stat-value" style={{ color: '#fbbf24' }}>{stats.inProgress}</strong>
          <span className="stat-desc">على الأجهزة أو الفحص اليدوي</span>
        </div>

        <div
          onClick={() => setStatusFilter('READY')}
          className="stat-card cursor-pointer"
          style={{ padding: '10px 12px', cursor: 'pointer', border: statusFilter === 'READY' ? '1px solid #10b981' : '1px solid var(--border-color)' }}
        >
          <span className="stat-title" style={{ color: '#34d399' }}>النتيجة جاهزة للطباعة</span>
          <strong className="stat-value" style={{ color: '#34d399' }}>{stats.ready}</strong>
          <span className="stat-desc">جاهزة للتسليم للمريض</span>
        </div>

        <div
          onClick={() => setStatusFilter('DELIVERED')}
          className="stat-card cursor-pointer"
          style={{ padding: '10px 12px', cursor: 'pointer', border: statusFilter === 'DELIVERED' ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)' }}
        >
          <span className="stat-title" style={{ color: 'var(--accent-blue)' }}>تم تسليم التقرير للمريض</span>
          <strong className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.delivered}</strong>
          <span className="stat-desc">تم إنهاء الزيارة بنجاح</span>
        </div>
      </div>

      {/* 4. Search and Status Filter Strip */}
      <div className="glass-card" style={{ marginBottom: '14px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={13} className="quick-search-icon" />
          <input
            type="text"
            placeholder="بحث برقم العينة، اسم المريض، أو الهاتف..."
            className="input-control"
            style={{ paddingRight: '28px', height: '32px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`btn-secondary ${statusFilter === 'ALL' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '11px', height: '30px' }}
          >
            الكل ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('RECEIVED')}
            className={`btn-secondary ${statusFilter === 'RECEIVED' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '11px', height: '30px' }}
          >
            تم أخذ العينة ({stats.received})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`btn-secondary ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '11px', height: '30px' }}
          >
            جاري الفحص ({stats.inProgress})
          </button>
          <button
            onClick={() => setStatusFilter('READY')}
            className={`btn-secondary ${statusFilter === 'READY' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '11px', height: '30px' }}
          >
            جاهزة ({stats.ready})
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`btn-secondary ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '11px', height: '30px' }}
          >
            تم التسليم ({stats.delivered})
          </button>
          {stats.urgent > 0 && (
            <button
              onClick={() => setStatusFilter('URGENT')}
              className={`btn-secondary ${statusFilter === 'URGENT' ? 'active' : ''}`}
              style={{ padding: '4px 9px', fontSize: '11px', height: '30px', color: '#ef4444', borderColor: '#ef4444' }}
            >
              <AlertOctagon size={12} /> عاجل ({stats.urgent})
            </button>
          )}
        </div>
      </div>

      {/* 5. Samples Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '85px' }}>رقم العينة</th>
              <th>المريض وسجل الزيارات</th>
              <th>الفحوصات المطلوبة</th>
              <th>الطبيب المحول</th>
              <th>وقت التسجيل</th>
              <th>المبلغ / الديون</th>
              <th>حالة العينة والمتابعة</th>
              <th style={{ textAlign: 'center', width: '220px' }}>الإجراءات ومحطة النتائج</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>جاري جلب سجل العينات...</span>
                  </div>
                </td>
              </tr>
            ) : filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '44px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <FlaskConical size={32} color="var(--text-dim)" />
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                      {dateFilter === 'TODAY' ? 'سجل اليوم فارغ وجاهز لبدء تسجيل المرضى الجدد!' : 'لا توجد عينات مطابقة للبحث أو التاريخ المحدد'}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      {dateFilter === 'TODAY' ? 'اضغط على زر "تسجيل عينة جديدة (F2)" للبدء في استقبال المرضى' : 'يمكنك التبديل إلى عينات اليوم أو الأرشيف الشامل'}
                    </span>
                    <button onClick={() => router.push('/')} className="btn-primary" style={{ marginTop: '8px' }}>
                      <Plus size={13} />
                      <span>تسجيل عينة أولى اليوم</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSamples.map((s) => {
                const isPaid = (s.remainingAmount || 0) <= 0;
                return (
                  <tr key={s.id}>
                    {/* Sample Number & Barcode */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>
                          #{s.sampleNumber}
                        </strong>
                        {s.isUrgent && (
                          <span className="badge badge-urgent" style={{ fontSize: '9px', padding: '1px 3px' }}>
                            <AlertOctagon size={12} /> عاجل
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Patient Name & Historical Profile Link */}
                    <td>
                      <div>
                        <button
                          onClick={() => router.push(`/patients?id=${s.patientId}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'right',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="عرض السجل الطبي وتاريخ الزيارات السابقة للمريض"
                        >
                          <strong style={{ color: 'var(--text-main)', fontSize: '12.5px', textDecoration: 'underline' }}>
                            {s.patient?.name}
                          </strong>
                          <History size={12} color="var(--accent-cyan)" />
                        </button>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>
                          {s.patient?.phone || 'بدون هاتف'} • {s.patient?.age ? `${s.patient.age} سنة` : ''} ({s.patient?.gender || 'ذكر'})
                        </span>
                      </div>
                    </td>

                    {/* Tests List */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '280px' }}>
                        {s.tests?.slice(0, 3).map((st: any) => (
                          <span key={st.id} className="badge badge-received" style={{ fontSize: '10px' }}>
                            {st.test?.name}
                            {st.isAutoImported && <span style={{ color: '#10b981', marginRight: '2px' }}><Zap size={14} /></span>}
                          </span>
                        ))}
                        {s.tests?.length > 3 && (
                          <span className="badge badge-received" style={{ fontSize: '10px' }}>
                            +{s.tests.length - 3} فحوصات أخرى
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {s.doctor?.name || 'مباشر (بدون تحويل)'}
                      </span>
                    </td>

                    {/* Registration Time */}
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {new Date(s.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                        <br />
                        <span style={{ fontSize: '9.5px' }}>{new Date(s.createdAt).toLocaleDateString('ar-IQ')}</span>
                      </span>
                    </td>

                    {/* Price & Debts */}
                    <td>
                      <div>
                        <strong style={{ fontSize: '11.5px', color: 'var(--text-main)', display: 'block' }}>
                          {s.priceTotal?.toLocaleString()} د.ع
                        </strong>
                        {isPaid ? (
                          <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 700 }}>✅ واصل كامل</span>
                        ) : (
                          <span style={{ fontSize: '9.5px', color: '#ef4444', fontWeight: 700 }}>
                            متبقي: {s.remainingAmount?.toLocaleString()} د.ع
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Clear Unambiguous Status Badge */}
                    <td>
                      {s.status === 'RECEIVED' && (
                        <span className="badge badge-received">
                          تم استلام العينة
                        </span>
                      )}
                      {s.status === 'IN_PROGRESS' && (
                        <span className="badge badge-in_progress">
                          جاري الفحص المخبري
                        </span>
                      )}
                      {s.status === 'READY' && (
                        <span className="badge badge-ready">
                          جاهزة للاعتماد
                        </span>
                      )}
                      {s.status === 'DELIVERED' && (
                        <span className="badge badge-delivered">
                          تم تسليم التقرير
                        </span>
                      )}
                    </td>

                    {/* Actions & Station Shortcuts */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        
                        {/* Go to Results Station */}
                        <button
                          onClick={() => router.push(`/results?sampleId=${s.id}`)}
                          className="btn-primary"
                          style={{ padding: '3px 7px', fontSize: '10.5px', height: '26px' }}
                          title="إدخال أو تدقيق النتائج"
                        >
                          <FileText size={12} />
                          <span>إدخال النتائج</span>
                        </button>

                        {/* Status Advancement Button */}
                        {s.status === 'RECEIVED' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'IN_PROGRESS')}
                            className="btn-secondary"
                            style={{ padding: '3px 6px', fontSize: '10px', height: '26px', color: '#fbbf24', borderColor: '#fbbf24' }}
                            title="بدء الفحص المخبري"
                          >
                            <span>بدء الفحص</span>
                          </button>
                        )}
                        {s.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'READY')}
                            className="btn-secondary"
                            style={{ padding: '3px 6px', fontSize: '10px', height: '26px', color: '#34d399', borderColor: '#10b981' }}
                            title="اعتماد وجاهز للتسليم"
                          >
                            <span>جاهزة للاعتماد</span>
                          </button>
                        )}
                        {s.status === 'READY' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'DELIVERED')}
                            className="btn-secondary"
                            style={{ padding: '3px 6px', fontSize: '10px', height: '26px', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                            title="تسليم التقرير للمريض"
                          >
                            <span>تسليم التقرير 📤</span>
                          </button>
                        )}

                        {/* Print Report Preview */}
                        <button
                          onClick={() => {
                            setDocPreviewUrl(`/api/samples/${s.id}/print`);
                            setDocPreviewTitle(`معاينة تقرير الفحص - عينة #${s.sampleNumber} (${s.patient?.name})`);
                          }}
                          className="btn-icon"
                          title="معاينة وطباعة التقرير"
                        >
                          <Printer size={13} />
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleOpenWhatsApp(s)}
                          className="btn-icon"
                          style={{ color: '#22c55e' }}
                          title="إرسال التقرير عبر واتساب"
                        >
                          <Share2 size={13} />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. In-App Document Preview Modal */}
      {docPreviewUrl && (
        <div className="modal-overlay" onClick={() => setDocPreviewUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '840px', height: '88vh', display: 'flex', flexDirection: 'column', padding: '14px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{docPreviewTitle}</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.print();
                    }
                  }}
                  className="btn-primary"
                  style={{ padding: '3px 10px', fontSize: '11px', height: '28px' }}
                >
                  <Printer size={12} />
                  <span>طباعة فورية</span>
                </button>
                <button onClick={() => setDocPreviewUrl(null)} className="btn-icon">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: '#fff', borderRadius: '6px', overflow: 'hidden' }}>
              <iframe
                id="preview-frame"
                src={docPreviewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. WhatsApp Share Modal */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} color="#22c55e" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>إرسال التقرير عبر واتساب</h3>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">رقم هاتف المريض (مع الرمز الدولي):</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="input-control"
                  placeholder="9647701234567"
                />
              </div>

              <div>
                <label className="input-label">نص الرسالة ورابط التقرير:</label>
                <textarea
                  rows={6}
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                  className="textarea-control"
                  style={{ fontSize: '11px', lineHeight: 1.4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button onClick={() => setShowWhatsAppModal(false)} className="btn-secondary">
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;
                    window.open(url, '_blank');
                    setShowWhatsAppModal(false);
                    toast.success('تم فتح محادثة واتساب لإرسال التقرير بنجاح!', 'تم الإرسال');
                  }}
                  className="btn-success"
                >
                  <Send size={13} />
                  <span>إرسال عبر واتساب الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

export default function SamplesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل سجل العينات...</div>}>
      <SamplesContent />
    </Suspense>
  );
}
