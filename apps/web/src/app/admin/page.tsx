'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { useAdmin } from '../../components/admin/AdminGuard';
import {
  Users,
  Wallet,
  FlaskConical,
  Activity,
  AlertTriangle,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Database,
  RefreshCw,
  FileText,
  DollarSign,
  ChevronLeft,
} from 'lucide-react';

interface AdminStats {
  totalPatients: number;
  totalSamples: number;
  todaySamples: number;
  monthSamples: number;
  todayRevenue: number;
  monthRevenue: number;
  totalDebts: number;
  activeStaffCount: number;
  activeDevicesCount: number;
  urgentPendingCount: number;
  recentAudits: Array<{
    id: string;
    action: string;
    entity: string;
    details: string;
    userName?: string;
    createdAt: string;
    ipAddress?: string;
  }>;
}

export default function AdminOverviewPage() {
  const { adminUser } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await apiRequest('/admin/overview-stats', 'GET');
      if (res) {
        setStats(res);
      }
    } catch (err) {
      console.error('Failed to load admin overview stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('en-US') + ' د.ع';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(13, 148, 136, 0.15) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                background: 'rgba(13, 148, 136, 0.2)',
                color: '#2dd4bf',
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(13, 148, 136, 0.4)',
              }}
            >
              اللوحة التنفيذية العليا
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Labryo LIMS Control Hub</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
            مرحباً بك، {adminUser?.name || 'مدير النظام'}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            ملخص الأداء السريري والمالي للمختبر، إدارة الكادر والصلاحيات، ومراقبة أجهزة التحليل الطبية لحظياً.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Today Revenue */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #10b981, #059669)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>إيرادات الصندوق اليوم</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            {formatCurrency(stats?.todayRevenue || 0)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
            إجمالي الشهر: {formatCurrency(stats?.monthRevenue || 0)}
          </div>
        </div>

        {/* Card 2: Today Samples */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #0d9488, #0ea5e9)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>عينات وزيارات اليوم</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(13, 148, 136, 0.15)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            {Number(stats?.todaySamples || 0).toLocaleString('en-US')} عينة
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
            إجمالي العينات التراكمي: {Number(stats?.totalSamples || 0).toLocaleString('en-US')}
          </div>
        </div>

        {/* Card 3: Outstanding Debts */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>إجمالي الديون والذمم المتبقية</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            {formatCurrency(stats?.totalDebts || 0)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
            مستحقات غير محصلة من الزيارات
          </div>
        </div>

        {/* Card 4: Urgent & Panic Samples */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #ef4444, #dc2626)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>عينات عاجلة قيد الانتظار</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            {stats?.urgentPendingCount || 0} عينة عاجلة
          </div>
          <div style={{ fontSize: '11.5px', color: '#f87171', marginTop: '6px', fontWeight: 600 }}>
            تتطلب متابعة الفنيين فوراً
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Module 1: Staff & Permissions */}
        <Link
          href="/admin/staff"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            textDecoration: 'none',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color 0.2s ease, transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>إدارة الكادر والصلاحيات</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                {stats?.activeStaffCount || 3} موظفين نشطين • تعيين كلمات المرور والأدوار
              </div>
            </div>
          </div>
          <ChevronLeft size={20} style={{ color: '#64748b' }} />
        </Link>

        {/* Module 2: Financial Reports */}
        <Link
          href="/admin/financials"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            textDecoration: 'none',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color 0.2s ease, transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>التقارير المالية والأرباح</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                سندات الصندوق، شفتات الإغلاق، ونسب الأطباء
              </div>
            </div>
          </div>
          <ChevronLeft size={20} style={{ color: '#64748b' }} />
        </Link>

        {/* Module 3: System & Backup */}
        <Link
          href="/admin/system"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            textDecoration: 'none',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color 0.2s ease, transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(13, 148, 136, 0.15)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>النسخ الاحتياطي والنظام</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                النسخ الآمن، سلامة المخطط، وترخيص البرنامج
              </div>
            </div>
          </div>
          <ChevronLeft size={20} style={{ color: '#64748b' }} />
        </Link>
      </div>

      {/* Recent Activity & Audit Logs Table */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '22px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: '#0d9488' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              سجل التدقيق والحركات الأخيرة في النظام (Audit Trail)
            </h2>
          </div>
          <Link
            href="/admin/audit"
            style={{
              fontSize: '12.5px',
              color: '#0d9488',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>عرض السجل الكامل</span>
            <ChevronLeft size={16} />
          </Link>
        </div>

        {stats?.recentAudits && stats.recentAudits.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>نوع الإجراء</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>الكيان</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>التفاصيل</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>المستخدم</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAudits.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      <span
                        style={{
                          background: item.action.includes('LOGIN')
                            ? 'rgba(16, 185, 129, 0.15)'
                            : item.action.includes('DELETE')
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(13, 148, 136, 0.15)',
                          color: item.action.includes('LOGIN')
                            ? '#34d399'
                            : item.action.includes('DELETE')
                            ? '#f87171'
                            : '#2dd4bf',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{item.entity}</td>
                    <td style={{ padding: '12px', color: '#f1f5f9' }}>{item.details}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                      {item.userName || 'غير معروف'}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '11.5px', direction: 'ltr', textAlign: 'right' }}>
                      {new Date(item.createdAt).toLocaleTimeString('ar-IQ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
            لا توجد حركات مسجلة حديثاً في سجل التدقيق.
          </div>
        )}
      </div>
    </div>
  );
}
