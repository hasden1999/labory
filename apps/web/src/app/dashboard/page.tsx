'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { LayoutDashboard, Plus, FileText, FlaskConical, Users, Search, Printer, Share2, Clock, AlertCircle, CheckCircle2, TrendingUp, DollarSign, CreditCard, Receipt, ChevronLeft, Activity, Flame, RefreshCw, Eye, Send, X, UserPlus, FileSearch, Check, AlertOctagon, AlertTriangle } from 'lucide-react';
import { DashboardData, DashboardSummary, Sample } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentSamples, setRecentSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  // In-app Document Preview Modal
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('');

  // WhatsApp Share Modal
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappText, setWhatsappText] = useState('');

  const loadData = async (showNotification = false) => {
    setLoading(true);
    try {
      const [dashRes, samplesRes] = await Promise.all([
        apiRequest('/reports/dashboard'),
        apiRequest('/samples'),
      ]);
      setDashboardData(dashRes);
      setRecentSamples(samplesRes ? samplesRes.slice(0, 10) : []);
      if (showNotification) {
        toast.success('تم تحديث المؤشرات والعمليات بنجاح!', 'تحديث حي');
      }
    } catch (err: any) {
      toast.error('فشل في جلب بيانات لوحة التحكم', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const handleOpenWhatsApp = (sample: Sample) => {
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

  const handleUpdateStatus = async (sampleId: string, status: string) => {
    try {
      await apiRequest(`/samples/${sampleId}/status`, 'PATCH', { status });
      toast.success(`تم تحديث حالة العينة إلى: ${status}`, 'تحديث الحالة');
      loadData(false);
    } catch (err: any) {
      toast.error('فشل تحديث حالة العينة', 'خطأ');
    }
  };

  const summary = (dashboardData?.summary || {}) as Partial<DashboardSummary>;
  const statusBreakdown = dashboardData?.statusBreakdown || {};

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <LayoutDashboard color="#06b6d4" size={22} />
            مركز التحكم والعمليات اليومية
          </h1>
          <p className="page-subtitle">الوصول المباشر للعمليات الأساسية، ملخص أداء المختبر، والمهام التي تتطلب إجراءً فورياً</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => loadData(true)} className="btn-secondary" style={{ fontSize: '12px' }}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>تحديث المؤشرات</span>
          </button>
        </div>
      </div>
      {/* 1. HERO COMMAND CARDS (أهم 3 عمليات يومية بضغطة زر واحدة) */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          
          {/* Card 1: New Intake */}
          <div
            onClick={() => router.push('/')}
            className="glass-card"
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1.5px solid rgba(6, 182, 212, 0.4)',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0.02) 100%)',
              borderRadius: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                flexShrink: 0,
              }}>
                <FlaskConical size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>1. تسجيل مريض وفحص</strong>
                  <span style={{ fontSize: '10px', background: 'var(--accent-cyan)', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>F1</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>استقبال فوري واختيار التحاليل</p>
              </div>
            </div>
            <ChevronLeft size={18} color="var(--accent-cyan)" />
          </div>

          {/* Card 2: Results Entry */}
          <div
            onClick={() => router.push('/results')}
            className="glass-card"
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.02) 100%)',
              borderRadius: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
                flexShrink: 0,
              }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>2. إدخال وتدقيق النتائج</strong>
                  <span style={{ fontSize: '10px', background: 'var(--accent-emerald)', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>F2</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>كتابة القيم والمعادلات التلقائية</p>
              </div>
            </div>
            <ChevronLeft size={18} color="var(--accent-emerald)" />
          </div>

          {/* Card 3: Samples & Print */}
          <div
            onClick={() => router.push('/samples')}
            className="glass-card"
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.02) 100%)',
              borderRadius: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-warning)',
                flexShrink: 0,
              }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>3. سجل العينات والطباعة</strong>
                  <span style={{ fontSize: '10px', background: 'var(--color-warning)', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>F3</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>طباعة التقارير وإرسال واتساب</p>
              </div>
            </div>
            <ChevronLeft size={18} color="var(--color-warning)" />
          </div>

        </div>
      </div>

      {/* 2. TODAY OVERVIEW (معلومات سريعة مفهومة في ثوانٍ) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
          <span className="stat-title">مراجعي وعينات اليوم</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {summary.todaySamplesCount || 0}
          </span>
          <span className="stat-desc">إجمالي طلبات الفحص المسجلة اليوم</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-amber)' }}>
          <span className="stat-title">فحوصات قيد التنفيذ</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {statusBreakdown.IN_PROGRESS || 0}
          </span>
          <span className="stat-desc">عينات داخل المختبر قيد التحليل</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
          <span className="stat-title">نتائج جاهزة للطباعة والتسليم</span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {statusBreakdown.READY || 0}
          </span>
          <span className="stat-desc">تم تدقيقها وجاهزة للإخراج</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--color-info)' }}>
          <span className="stat-title">مقبوضات الصندوق اليومي</span>
          <span className="stat-value" style={{ color: 'var(--color-info)' }}>
            {(summary.todayPaidCash || 0).toLocaleString()} د.ع
          </span>
          <span className="stat-desc">النقد الفعلي المقبوض في الصندوق اليوم</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-rose)' }}>
          <span className="stat-title">مصاريف وديون قيد التحصيل</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {(summary.totalRemainingDebts || 0).toLocaleString()} د.ع
          </span>
          <span className="stat-desc">مبالغ آجلة بذمة المرضى والجهات</span>
        </div>

      </div>

      {/* 3. PENDING TASKS & URGENCIES (مهام تتطلب إجراءً فورياً) */}
      <div className="responsive-four-strip" style={{ marginBottom: '16px' }}>
        
        <div
          onClick={() => router.push('/samples?filter=URGENT')}
          style={{
            background: 'var(--bg-stat-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 800 }}><AlertOctagon size={12} /> عينات إسعافية عاجلة (STAT)</div>
            <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{summary.urgentPendingCount || 0}</strong>
          </div>
          <span className="btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>معالجة فورية</span>
        </div>

        <div
          onClick={() => router.push('/results')}
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-amber)', fontWeight: 800 }}><AlertTriangle size={12} /> إنذارات وقيم حرجة (Panic)</div>
            <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{summary.criticalCount || 0}</strong>
          </div>
          <span className="btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>تدقيق</span>
        </div>

        <div
          onClick={() => router.push('/samples?filter=RECEIVED')}
          style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }}>📥 تم أخذ العينة (بانتظار الفحص)</div>
            <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{statusBreakdown.RECEIVED || 0}</strong>
          </div>
          <span className="btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>بدء الفحص</span>
        </div>

        <div
          onClick={() => router.push('/debts')}
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 800 }}>💳 حسابات ديون بحاجة لتحصيل</div>
            <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{((summary.totalRemainingDebts || 0) > 0 ? 1 : 0) ? 'نشطة' : 'لا يوجد'}</strong>
          </div>
          <span className="btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>عرض السجل</span>
        </div>

      </div>

      {/* 4. RECENT ACTIVITY (آخر العمليات والطلبات مع إجراءات بنقرة واحدة) */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={17} color="var(--accent-cyan)" />
            <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>آخر العمليات والعينات المسجلة</strong>
          </div>

          <button onClick={() => router.push('/samples')} className="btn-secondary" style={{ fontSize: '11.5px', padding: '4px 10px' }}>
            <span>عرض كل العينات ({summary.totalSamplesCount || 0})</span>
            <ChevronLeft size={13} />
          </button>
        </div>

        <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم العينة</th>
                <th>اسم المريض</th>
                <th>الفحوصات</th>
                <th>المبلغ / الديون</th>
                <th>حالة العينة والمتابعة</th>
                <th>وقت التسجيل</th>
                <th style={{ textAlign: 'center' }}>إجراء سريع</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل البيانات...</td>
                </tr>
              ) : recentSamples.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد عينات مسجلة اليوم حتى الآن. ابدأ بتسجيل أول عينة!</td>
                </tr>
              ) : (
                recentSamples.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '12.5px' }}>#{s.sampleNumber}</span>
                        {s.isUrgent && <span className="stat-badge" style={{ fontSize: '9px' }}>STAT</span>}
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px', display: 'block' }}>{s.patient?.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.patient?.phone || 'بدون هاتف'}</span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                        {s.tests?.slice(0, 2).map((st: any) => (
                          <span key={st.id} className="badge badge-received" style={{ fontSize: '10.5px' }}>
                            {st.test?.name}
                          </span>
                        ))}
                        {s.tests?.length > 2 && (
                          <span className="badge badge-received" style={{ fontSize: '10px' }}>+{s.tests.length - 2} المزيد</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '12.5px', display: 'block' }}>{s.priceTotal?.toLocaleString()} د.ع</strong>
                      {(s.remainingAmount || 0) > 0 ? (
                        <span style={{ color: 'var(--accent-rose)', fontSize: '10.5px', fontWeight: 700 }}>متبقي: {(s.remainingAmount || 0).toLocaleString()} د.ع</span>
                      ) : (
                        <span style={{ color: 'var(--accent-emerald)', fontSize: '10.5px', fontWeight: 700 }}>واصل بالكامل</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge badge-${s.status.toLowerCase()}`}>
                        {s.status === 'RECEIVED' ? 'مستلمة' : s.status === 'IN_PROGRESS' ? 'قيد الفحص' : s.status === 'READY' ? 'جاهزة للطباعة' : 'تم التسليم'}
                      </span>
                    </td>

                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Quick 1-Click Inline Action Tools */}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button
                          onClick={() => router.push(`/results?sampleId=${s.id}`)}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-cyan)' }}
                          title="إدخال وتدقيق النتائج"
                        >
                          <FileText size={13} />
                          <span>النتائج</span>
                        </button>

                        <button
                          onClick={() => {
                            setDocPreviewUrl(`/api/samples/${s.id}/print`);
                            setDocPreviewTitle(`معاينة تقرير الفحص A4 - عينة #${s.sampleNumber} (${s.patient?.name})`);
                          }}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          title="معاينة وطباعة التقرير الطبي"
                        >
                          <Printer size={13} />
                          <span>طباعة</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(s)}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-emerald)' }}
                          title="إرسال عبر واتساب"
                        >
                          <Share2 size={13} />
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

      {/* WHATSAPP MODAL */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>إرسال التقرير الطبي عبر واتساب</h3>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">رقم هاتف المريض مع الرمز الدولي:</label>
                <input
                  type="text"
                  className="input-control"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="مثال: 9647701234567"
                />
              </div>

              <div>
                <label className="input-label">نص الرسالة ورابط التقرير المعتمد:</label>
                <textarea
                  className="textarea-control"
                  rows={4}
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;
                  window.open(url, '_blank');
                  setShowWhatsAppModal(false);
                  toast.success('تم فتح واتساب لإرسال التقرير إلى المريض!', 'إرسال التقرير');
                }}
                className="btn-success"
                style={{ width: '100%', padding: '9px', marginTop: '4px' }}
              >
                <Send size={15} />
                <span>فتح واتساب وإرسال التقرير</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {docPreviewUrl && (
        <div className="modal-overlay" onClick={() => setDocPreviewUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '820px', height: '88vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>{docPreviewTitle}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => window.open(docPreviewUrl, '_blank')}
                  className="btn-primary"
                  style={{ fontSize: '11.5px', padding: '5px 10px' }}
                >
                  <Printer size={14} />
                  <span>طباعة في نافذة جديدة</span>
                </button>
                <button type="button" onClick={() => setDocPreviewUrl(null)} className="btn-icon">
                  <X size={15} />
                </button>
              </div>
            </div>

            <iframe
              src={docPreviewUrl}
              style={{ flex: 1, width: '100%', border: 'none', borderRadius: '6px', background: '#fff' }}
              title="معاينة المستند"
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
