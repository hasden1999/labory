'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Plus, Users, Shield, UserCheck, UserX, X, Check } from 'lucide-react';

export default function StaffPage() {
  const toast = useToast();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TECHNICIAN');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/staff');
      setStaffList(res || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب قائمة الموظفين', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      toast.warning('يرجى ملء الاسم واسم المستخدم وكلمة المرور', 'بيانات ناقصة');
      return;
    }

    try {
      await apiRequest('/staff', 'POST', {
        name: name.trim(),
        username: username.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
      });

      setShowModal(false);
      setName('');
      setUsername('');
      setPassword('');
      setRole('TECHNICIAN');
      setPhone('');
      toast.success('تم إنشاء حساب الموظف بنجاح!', 'تم الحفظ');
      loadStaff();
    } catch (err: any) {
      toast.error(err.message || 'فشل إنشاء حساب الموظف', 'فشل الحفظ');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await apiRequest(`/staff/${id}`, 'PATCH', { active: !currentActive });
      toast.success(
        !currentActive ? 'تم تفعيل حساب الموظف بنجاح!' : 'تم تعطيل حساب الموظف!',
        'تعديل الحالة'
      );
      loadStaff();
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل حالة الحساب', 'خطأ');
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users color="#06b6d4" size={24} />
            إدارة الكادر الطبي وصلاحيات النظام
          </h1>
          <p className="page-subtitle">إنشاء وإدارة حسابات الفنيين والمشغلين، تحديد الأدوار (Owner / Technician)، والتحكم بالحسابات</p>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>إضافة حساب موظف جديد</span>
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>اسم المستخدم</th>
                <th>الدور / الصلاحية</th>
                <th>الهاتف</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب قائمة الكادر...</td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا يوجد موظفون مسجلون</td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{s.name}</strong>
                    </td>
                    <td style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{s.username}</td>
                    <td>
                      <span className={`badge ${s.role === 'OWNER' ? 'badge-urgent' : 'badge-received'}`}>
                        <Shield size={12} />
                        <span>{s.role === 'OWNER' ? 'مدير المختبر (Owner)' : 'فني مخبري (Technician)'}</span>
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.phone || '-'}</td>
                    <td>
                      {s.active ? (
                        <span className="badge badge-ready"><Check size={12} /> مفعّل ونشط</span>
                      ) : (
                        <span className="badge badge-progress" style={{ color: 'var(--text-dim)' }}>معطّل</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(s.id, s.active)}
                        className="btn-secondary"
                        style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          minHeight: '28px',
                          color: s.active ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                        }}
                      >
                        {s.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Staff */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>إضافة حساب كادر جديد</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">الاسم الكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: زينب علي حسن"
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">اسم المستخدم (Login) *</label>
                  <input
                    type="text"
                    placeholder="مثال: zainab.lab"
                    className="input-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="input-label">كلمة المرور *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">الصلاحية / الدور</label>
                  <select
                    className="select-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="TECHNICIAN">فني مخبري (Technician)</option>
                    <option value="OWNER">مدير المختبر (Owner)</option>
                    <option value="RECEPTION">استقبال (Reception)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="مثال: 07701234567"
                    className="input-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  إنشاء الحساب
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
