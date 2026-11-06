'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useToast } from '../../../components/Toast';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  Key,
  CheckCircle,
  XCircle,
  Phone,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: string;
  phone?: string | null;
  active: boolean;
  createdAt: string;
}

export default function AdminStaffPage() {
  const toast = useToast();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('TECHNICIAN');
  const [newPhone, setNewPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset Password State
  const [resetModalStaff, setResetModalStaff] = useState<StaffMember | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/staff', 'GET');
      if (Array.isArray(res)) {
        setStaffList(res);
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب قائمة الموظفين', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword) {
      toast.warning('يرجى ملء كافة الحقول الأساسية', 'تنبيه');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/staff', 'POST', {
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
        phone: newPhone.trim() || null,
      });

      toast.success(`تم إنشاء حساب ${newName} بنجاح`, 'تم بنجاح');
      setShowAddModal(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'فشل إنشاء الحساب', 'خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: StaffMember) => {
    try {
      const updatedStatus = !staff.active;
      await apiRequest(`/staff/${staff.id}`, 'PATCH', {
        active: updatedStatus,
      });

      toast.success(
        updatedStatus ? `تم تفعيل حساب ${staff.name}` : `تم تعطيل حساب ${staff.name}`,
        'تحديث الحالة'
      );
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, active: updatedStatus } : s))
      );
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث حالة الحساب', 'خطأ');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff || !newResetPassword) return;

    try {
      setSubmitting(true);
      await apiRequest(`/staff/${resetModalStaff.id}`, 'PATCH', {
        password: newResetPassword,
      });

      toast.success(`تم تغيير كلمة المرور لـ ${resetModalStaff.name}`, 'نجاح');
      setResetModalStaff(null);
      setNewResetPassword('');
    } catch (err: any) {
      toast.error(err.message || 'فشل تغيير كلمة المرور', 'خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'مالك المختبر', bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15' };
      case 'ADMIN':
        return { label: 'مدير نظام', bg: 'rgba(13, 148, 136, 0.2)', color: '#2dd4bf' };
      case 'TECHNICIAN':
        return { label: 'فني تحليلات', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
      case 'RECEPTION':
        return { label: 'موظف استقبال', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
      case 'PATHOLOGIST':
        return { label: 'طبيب استشاري', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
      default:
        return { label: role, bg: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' };
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
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
            <Users size={22} style={{ color: '#0d9488' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              إدارة الكادر والمستخدمين
            </h1>
          </div>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '6px 0 0 0' }}>
            التحكم بحسابات موظفي الاستقبال، الفنيين، والمدراء، وتعيين الصلاحيات وإعادة ضبط كلمات المرور.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '11px 18px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
          }}
        >
          <UserPlus size={18} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو اسم المستخدم..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '10px 42px 10px 14px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={fetchStaff}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث</span>
        </button>
      </div>

      {/* Staff Table Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 800 }}>الموظف</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 800 }}>اسم المستخدم</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 800 }}>الدور / الصلاحية</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 800 }}>الهاتف</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 800 }}>الحالة</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 800 }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => {
                const badge = getRoleBadge(staff.role);
                return (
                  <tr
                    key={staff.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      opacity: staff.active ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0d9488',
                          }}
                        >
                          <User size={18} />
                        </div>
                        <div>
                          <div>{staff.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            أضيف في {new Date(staff.createdAt).toLocaleDateString('ar-IQ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
                      {staff.username}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                      {staff.phone || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: staff.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: staff.active ? '#34d399' : '#f87171',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {staff.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>{staff.active ? 'نشط' : 'معطل'}</span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => setResetModalStaff(staff)}
                          title="تغيير كلمة المرور"
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Key size={13} />
                          <span>كلمة المرور</span>
                        </button>

                        {staff.role !== 'OWNER' && (
                          <button
                            onClick={() => handleToggleActive(staff)}
                            title={staff.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            style={{
                              background: staff.active ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              border: staff.active ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              color: staff.active ? '#f87171' : '#34d399',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {staff.active ? 'تعطيل' : 'تفعيل'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: '#0d9488' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  إضافة مستخدم جديد للنظام
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: د. كرار جاسم"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    اسم المستخدم (Login)
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="مثال: tech_karrar"
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    الدور والصلاحية
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  >
                    <option value="TECHNICIAN">فني مختبر (Technician)</option>
                    <option value="RECEPTION">موظف استقبال (Reception)</option>
                    <option value="ADMIN">مدير نظام (Admin)</option>
                    <option value="PATHOLOGIST">طبيب استشاري (Pathologist)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة مرور الحساب..."
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  رقم الهاتف (اختياري)
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="07XXXXXXXXX"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'جاري الإنشاء...' : 'حفظ وإنشاء الحساب'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: '#0d9488' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  تغيير كلمة مرور {resetModalStaff.name}
                </h3>
              </div>
              <button
                onClick={() => setResetModalStaff(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
                </button>
                <button
                  type="button"
                  onClick={() => setResetModalStaff(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
