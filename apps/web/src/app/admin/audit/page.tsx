'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Shield,
  FileText,
  AlertCircle,
  Database,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details: string;
  userId?: string | null;
  userName?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAction !== 'ALL') params.append('action', selectedAction);
      if (search.trim()) params.append('query', search.trim());
      params.append('limit', '100');

      const res = await apiRequest(`/audit-logs?${params.toString()}`, 'GET');
      if (res && Array.isArray(res.logs)) {
        setLogs(res.logs);
        setTotal(res.total || res.logs.length);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', label: action };
    }
    if (action.includes('DELETE') || action.includes('REVOKE')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', label: action };
    }
    if (action.includes('UPDATE') || action.includes('PATCH')) {
      return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', label: action };
    }
    if (action.includes('CREATE')) {
      return { bg: 'rgba(13, 148, 136, 0.2)', color: '#2dd4bf', label: action };
    }
    return { bg: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', label: action };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px 24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={22} style={{ color: '#0d9488' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              سجل التدقيق والرقابة الشامل (Audit Trail)
            </h1>
          </div>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            مراقبة غير قابلة للتعديل لكافة حركات النظام: تسجيل الدخول، إنشاء أو حذف العينات، تعديل النتائج والأسعار.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
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
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 16px',
          flexWrap: 'wrap',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في تفاصيل الإجراء أو اسم المستخدم أو الكيان..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9px',
              padding: '9px 38px 9px 12px',
              color: '#ffffff',
              fontSize: '12.5px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>نوع الإجراء:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '12.5px',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="ALL">كافة الإجراءات (الكل)</option>
            <option value="LOGIN">تسجيل دخول موظف (LOGIN)</option>
            <option value="ADMIN_LOGIN">تسجيل دخول مدير (ADMIN_LOGIN)</option>
            <option value="LOGOUT">تسجيل خروج (LOGOUT)</option>
            <option value="CREATE">إنشاء بيانات (CREATE)</option>
            <option value="UPDATE">تعديل بيانات (UPDATE)</option>
            <option value="DELETE">حذف بيانات (DELETE)</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', marginRight: 'auto' }}>
          إجمالي السجلات: <b style={{ color: '#0d9488' }}>{total}</b>
        </div>
      </div>

      {/* Logs Table */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800 }}>التوقيت</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800 }}>الإجراء</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800 }}>الكيان</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800 }}>التفاصيل</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800 }}>المستخدم المسؤول</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800 }}>عنوان IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#64748b', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                        {new Date(log.createdAt).toLocaleString('ar-IQ')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 700 }}>
                        {log.entity}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#f1f5f9', maxWidth: '420px', lineHeight: 1.5 }}>
                        {log.details}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600 }}>
                        {log.userName || 'النظام'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '11.5px' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'جاري تحميل السجلات...' : 'لا توجد سجلات مطابقة للبحث'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
