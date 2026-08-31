'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Stethoscope, Plus, Edit3, Trash2, Phone, X, Award, DollarSign, Users } from 'lucide-react';

export default function DoctorsPage() {
  const toast = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [clinic, setClinic] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('10');

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/doctors');
      setDoctors(res || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل في جلب قائمة الأطباء', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setClinic('');
    setSpecialty('');
    setCommissionPercent('10');
    setShowModal(true);
  };

  const openEditModal = (doc: any) => {
    setEditingId(doc.id);
    setName(doc.name);
    setPhone(doc.phone || '');
    setClinic(doc.clinic || '');
    setSpecialty(doc.specialty || '');
    setCommissionPercent(doc.commissionPercent ? doc.commissionPercent.toString() : '0');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('اسم الطبيب مطلوب', 'بيانات ناقصة');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        clinic: clinic.trim() || undefined,
        specialty: specialty.trim() || undefined,
        commissionPercent: Number(commissionPercent),
      };

      if (editingId) {
        await apiRequest(`/doctors/${editingId}`, 'PATCH', payload);
        toast.success('تم تحديث بيانات الطبيب بنجاح!', 'تم التحديث');
      } else {
        await apiRequest('/doctors', 'POST', payload);
        toast.success('تمت إضافة الطبيب المحول بنجاح!', 'تم الحفظ');
      }

      setShowModal(false);
      loadDoctors();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء حفظ الطبيب', 'فشل الحفظ');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDoctorId) return;
    try {
      await apiRequest(`/doctors/${deleteDoctorId}`, 'DELETE');
      toast.success('تم مسح بيانات الطبيب بنجاح!', 'تم الحذف');
      setDeleteDoctorId(null);
      loadDoctors();
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء الحذف', 'خطأ');
    }
  };

  const totalCommissionsSum = doctors.reduce((acc, d) => acc + (d.totalCommission || 0), 0);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Stethoscope color="#06b6d4" size={24} />
            سجل الأطباء المحولين ونسب العمولات
          </h1>
          <p className="page-subtitle">إدارة بيانات الأطباء والعيادات المحولة، متابعة عدد الإحالات، واحتساب مستحقات العمولات آلياً</p>
        </div>

        <button onClick={openNewModal} className="btn-primary">
          <Plus size={16} />
          <span>إضافة طبيب محول جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="responsive-four-strip">
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
          <span className="stat-title">عدد الأطباء المسجلين</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {doctors.length} أطباء
          </span>
          <span className="stat-desc">أطباء وعيادات شريكة</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-amber)' }}>
          <span className="stat-title">إجمالي العمولات المستحقة للأطباء</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {totalCommissionsSum.toLocaleString()} د.ع
          </span>
          <span className="stat-desc">محسوبة آلياً من إجمالي الإحالات</span>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الطبيب</th>
                <th>التخصص الطبي</th>
                <th>العيادة / المركز</th>
                <th>رقم الهاتف</th>
                <th>النسبة المعتمدة</th>
                <th>عدد الإحالات</th>
                <th>إجمالي العمولات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب بيانات الأطباء...</td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا يوجد أطباء مسجلون حالياً</td>
                </tr>
              ) : (
                doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13.5px' }}>د. {d.name}</strong>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{d.specialty || '-'}</td>
                    <td>{d.clinic || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{d.phone || '-'}</td>
                    <td>
                      <span className="badge badge-received" style={{ fontWeight: 800 }}>
                        {d.commissionPercent}%
                      </span>
                    </td>
                    <td>{d.samplesCount || 0} عينات</td>
                    <td style={{ fontWeight: 900, color: 'var(--accent-amber)' }}>
                      {(d.totalCommission || 0).toLocaleString()} د.ع
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => openEditModal(d)}
                          className="btn-icon"
                          title="تعديل"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteDoctorId(d.id)}
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          title="حذف"
                        >
                          <Trash2 size={14} />
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

      {/* Modal Add / Edit Doctor */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingId ? 'تعديل بيانات الطبيب' : 'إضافة طبيب محول جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="toast-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">اسم الطبيب الكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: د. حيدر الشمري"
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">التخصص الطبي</label>
                  <input
                    type="text"
                    placeholder="مثال: باطنية وقلبية"
                    className="input-control"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">العيادة / المجمع</label>
                  <input
                    type="text"
                    placeholder="مثال: عيادات النقاء"
                    className="input-control"
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
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

                <div>
                  <label className="input-label">نسبة العمولة (%)</label>
                  <input
                    type="number"
                    placeholder="مثال: 10"
                    className="input-control"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ بيانات الطبيب
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Doctor Modal */}
      <ConfirmModal
        isOpen={!!deleteDoctorId}
        title="حذف طبيب محول"
        message="هل أنت متأكد من حذف هذا الطبيب من السجلات؟"
        type="danger"
        confirmText="نعم، احذف الطبيب"
        cancelText="تراجع"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDoctorId(null)}
      />
    </AppShell>
  );
}
