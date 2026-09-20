'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { getShareableUrl } from '../../lib/urlHelper';
import { LayoutDashboard, Plus, FileText, FlaskConical, Users, Search, Printer, Share2, Clock, AlertCircle, CheckCircle2, TrendingUp, DollarSign, CreditCard, Receipt, ChevronLeft, Activity, Flame, RefreshCw, Eye, Send, X, UserPlus, FileSearch, Check, AlertOctagon, AlertTriangle, Timer, Cpu, Zap, PhoneCall, BarChart3, CheckCheck } from 'lucide-react';
import { DashboardData, DashboardSummary, Sample } from '../../types';
import { toEnglishDigits, formatEnglishDate, formatEnglishTime } from '../../lib/formatters';

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { labProfile } = useLab();
  
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

  const loadData = async (showNotification = false, silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) toast.error('فشل في جلب بيانات لوحة التحكم', 'خطأ');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  // Live Auto-Polling & Focus Sync across LAN devices
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false, true);
    }, 5000);

    const handleFocus = () => {
      loadData(false, true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleOpenWhatsApp = (sample: Sample) => {
    const phone = sample.patient?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `964${cleanPhone.slice(1)}` : cleanPhone;
    setWhatsappPhone(formattedPhone);

    const reportUrl = getShareableUrl(`/api/samples/${sample.id}/print`, labProfile);
    const currentLabName = labProfile?.labName || 'المختبر للتحليلات الطبية';
    setWhatsappText(
      `مرحباً ${sample.patient?.name || ''}،\nيسر ${currentLabName} إعلامكم بصدور نتائج فحصكم رقم (#${sample.sampleNumber}).\nيمكنكم الاطلاع على التقرير المعتمد وتحميله مباشرة من الرابط:\n${reportUrl}\n\nنتمنى لكم دوام الصحة والعافية.`
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

      {/* 0. CLINICAL PANIC STRIP (شريط الإنذارات السريرية الحرجة الفوري) */}
      {(dashboardData?.operationalCockpit?.criticalAlerts?.length || 0) > 0 && (
        <div
          style={{
            marginBottom: '18px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-danger" style={{ display: 'inline-flex', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
              <strong style={{ color: 'var(--accent-rose)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertOctagon size={16} />
                تنبيه سريري حرج: توجد نتائج تقع في النطاق الخطر (Panic Values) تتطلب تدخلاً فورياً!
              </strong>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-rose)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
              {dashboardData?.operationalCockpit?.criticalAlerts?.length} إنذارات حرجة
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
            {dashboardData?.operationalCockpit?.criticalAlerts?.slice(0, 3).map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '11.5px' }}>#{toEnglishDigits(item.sampleNumber)}</span>
                    <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{item.patientName}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>{item.testName}: </span>
                    <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>{item.resultValue} {item.unit}</span>
                    {item.refRange && <span style={{ opacity: 0.7 }}> (الطبيعي: {item.refRange})</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {item.patientPhone && (
                    <a
                      href={`tel:${item.patientPhone}`}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                      title="اتصال بالطبيب أو المريض"
                    >
                      <PhoneCall size={12} />
                    </a>
                  )}
                  <button
                    onClick={() => router.push(`/results`)}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <span>معاينة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* 2. VITAL PULSE & COCKPIT KPIS (مؤشرات النبض التشغيلي والسريري اللحظي) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '16px' }}>
        
        {/* Metric 1: Today Samples */}
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
          <span className="stat-title">مراجعي وعينات اليوم</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {summary.todaySamplesCount || 0}
          </span>
          <span className="stat-desc">إجمالي طلبات الفحص المسجلة اليوم</span>
        </div>

        {/* Metric 2: Turnaround Time (TAT) */}
        <div className="stat-card" style={{ borderRight: '4px solid #818cf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Timer size={13} color="#818cf8" />
              معدل زمن الإنجاز (TAT)
            </span>
            {(summary.delayedCount || 0) > 0 && (
              <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-rose)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                {summary.delayedCount} متأخرة
              </span>
            )}
          </div>
          <span className="stat-value" style={{ color: '#818cf8' }}>
            {summary.averageTatMinutes || 35} <small style={{ fontSize: '13px', fontWeight: 600 }}>دقيقة</small>
          </span>
          <span className="stat-desc">متوسط المدة من الاستلام حتى التدقيق</span>
        </div>

        {/* Metric 3: Active In-Progress */}
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-amber)' }}>
          <span className="stat-title">فحوصات قيد التحليل</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {statusBreakdown.IN_PROGRESS || 0}
          </span>
          <span className="stat-desc">عينات داخل المختبر تجري معالجتها</span>
        </div>

        {/* Metric 4: Ready for Delivery */}
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-emerald)' }}>
          <span className="stat-title">نتائج جاهزة للتسليم</span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {statusBreakdown.READY || 0}
          </span>
          <span className="stat-desc">تم تدقيقها وجاهزة للإخراج والطباعة</span>
        </div>

        {/* Metric 5: Today Cash */}
        <div className="stat-card" style={{ borderRight: '4px solid var(--color-info)' }}>
          <span className="stat-title">مقبوضات الصندوق اليومي</span>
          <span className="stat-value" style={{ color: 'var(--color-info)' }}>
            {(summary.todayPaidCash || 0).toLocaleString()} <small style={{ fontSize: '11px' }}>د.ع</small>
          </span>
          <span className="stat-desc">النقد الفعلي المقبوض في الدرج اليوم</span>
        </div>

        {/* Metric 6: Remaining Debts */}
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-rose)' }}>
          <span className="stat-title">ديون قيد التحصيل</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {(summary.totalRemainingDebts || 0).toLocaleString()} <small style={{ fontSize: '11px' }}>د.ع</small>
          </span>
          <span className="stat-desc">مبالغ آجلة بذمة المرضى والجهات</span>
        </div>

      </div>

      {/* 3. VISUAL PIPELINE STAGE TRACKER (مسار تدفق العمليات الحية) */}
      <div
        className="glass-card"
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>مسار تدفق العينات اللحظي:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Step 1 */}
          <div
            onClick={() => router.push('/samples?filter=RECEIVED')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>1. استلام العينات:</span>
            <strong style={{ color: 'var(--accent-cyan)', fontSize: '13px' }}>{statusBreakdown.RECEIVED || 0}</strong>
          </div>

          <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>◀</span>

          {/* Step 2 */}
          <div
            onClick={() => router.push('/results')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>2. التحليل المخبري:</span>
            <strong style={{ color: 'var(--accent-amber)', fontSize: '13px' }}>{statusBreakdown.IN_PROGRESS || 0}</strong>
          </div>

          <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>◀</span>

          {/* Step 3 */}
          <div
            onClick={() => router.push('/samples?filter=READY')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>3. جاهز للتسليم:</span>
            <strong style={{ color: 'var(--accent-emerald)', fontSize: '13px' }}>{statusBreakdown.READY || 0}</strong>
          </div>

          <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>◀</span>

          {/* Step 4 */}
          <div
            onClick={() => router.push('/samples?filter=DELIVERED')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>4. تم التسليم:</span>
            <strong style={{ color: '#818cf8', fontSize: '13px' }}>{statusBreakdown.DELIVERED || 0}</strong>
          </div>

        </div>
      </div>

      {/* 4. DUAL OPERATIONAL COCKPIT (أجهزة التحليل + خريطة ساعات الذروة) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        
        {/* Card A: Analyzer Status & Auto-Matching */}
        <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--accent-cyan)" />
              <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>أجهزة التحليل والأتمتة الآلية</strong>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
              {dashboardData?.operationalCockpit?.deviceStatus?.automationRate || 100}% مطابقة آلية
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(dashboardData?.operationalCockpit?.deviceStatus?.devices || []).length === 0 ? (
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0' }}>لا توجد أجهزة مربوطة حالياً. يمكنك إضافة جهاز من شاشة الأجهزة.</p>
            ) : (
              (dashboardData?.operationalCockpit?.deviceStatus?.devices || []).slice(0, 3).map((dev: any) => (
                <div
                  key={dev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dev.status === 'ONLINE' ? '#10b981' : '#f59e0b' }}></span>
                    <div>
                      <strong style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block' }}>{dev.name}</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{dev.brand} {dev.model} • {dev.protocol}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: dev.status === 'ONLINE' ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 700 }}>
                    {dev.status === 'ONLINE' ? 'متصل 🟢' : 'جاهز 🟡'}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--text-muted)' }}>نتائج مستلمة من الأجهزة اليوم:</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {dashboardData?.operationalCockpit?.deviceStatus?.todayIncomingApplied || 0} نتائج
            </strong>
          </div>
        </div>

        {/* Card B: Hourly Arrival Heatmap */}
        <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} color="#f59e0b" />
              <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>ساعات الذروة وإقبال المراجعين اليوم</strong>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ساعات العمل (8:00 ص - 10:00 م)</span>
          </div>

          {/* Mini Bar Chart for 8am to 10pm */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '65px', gap: '4px', padding: '0 4px' }}>
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((hr) => {
              const count = (dashboardData?.operationalCockpit?.hourlyArrivals || [])[hr] || 0;
              const maxCount = Math.max(...(dashboardData?.operationalCockpit?.hourlyArrivals || []), 5);
              const heightPct = Math.max(8, Math.round((count / maxCount) * 100));
              const isPeak = count >= 3;

              return (
                <div key={hr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    title={`الساعة ${hr}:00 - عدد العينات: ${count}`}
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      borderRadius: '3px',
                      background: isPeak
                        ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                        : count > 0
                        ? 'linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      transition: 'height 0.3s ease',
                    }}
                  ></div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', transform: 'scale(0.85)' }}>{hr}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }}></span>
              أوقات الذروة المرتفعة
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#06b6d4' }}></span>
              إقبال اعتيادي
            </span>
          </div>
        </div>

      </div>

      {/* 5. PENDING TASKS & URGENCIES (مهام تتطلب إجراءً فورياً) */}
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
                        <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '12.5px' }}>#{toEnglishDigits(s.sampleNumber)}</span>
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
                      {formatEnglishTime(s.createdAt)}
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
                            const incomplete = (s.tests || []).filter((t: any) => !t.resultValue || String(t.resultValue).trim() === '');
                            if (incomplete.length > 0) {
                              toast.warning(`⚠️ لا يمكن طباعة تقرير العينة #${s.sampleNumber} لوجود (${incomplete.length}) فحص لم يُنجز بعد!`, 'فحوصات غير مكتملة');
                              return;
                            }
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
