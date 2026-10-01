'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Stethoscope, Plus, Edit3, Trash2, Phone, X, Award, DollarSign, Users, Search, Power, PowerOff, CheckCircle2, Ban } from 'lucide-react';

export default function DoctorsPage() {
  const toast = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [clinic, setClinic] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [isActiveDoc, setIsActiveDoc] = useState(true);

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
    setIsActiveDoc(true);
    setShowModal(true);
  };

  const openEditModal = (doc: any) => {
    setEditingId(doc.id);
    setName(doc.name);
    setPhone(doc.phone || '');
    setClinic(doc.clinic || '');
    setSpecialty(doc.specialty || '');
    setCommissionPercent(doc.commissionPercent ? doc.commissionPercent.toString() : '0');
    setIsActiveDoc(doc.isActive !== false);
    setShowModal(true);
  };

  const handleToggleActive = async (doc: any) => {
    try {
      const nextActive = doc.isActive === false;
      await apiRequest(`/doctors/${doc.id}`, 'PATCH', { isActive: nextActive });
      toast.success(nextActive ? 'تم تفعيل حساب الطبيب بنجاح' : 'تم إيقاف تفعيل الطبيب وإخفاؤه من الاختيارات الجديدة');
      loadDoctors();
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث حالة الطبيب', 'خطأ');
    }
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
        isActive: isActiveDoc,
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
      toast.error(err.message || 'لا يمكن حذف الطبيب المرتبط بعينات سابقة (يمكنك إيقاف تفعيله)', 'تعذر الحذف');
      setDeleteDoctorId(null);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      if (statusFilter === 'ACTIVE' && d.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && d.isActive !== false) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.specialty?.toLowerCase().includes(q) ||
        d.clinic?.toLowerCase().includes(q)
      );
    });
  }, [doctors, statusFilter, searchQuery]);

  const totalCommissionsSum = doctors.reduce((acc, d) => acc + (d.totalCommissions || d.totalCommission || 0), 0);
  const activeCount = doctors.filter((d) => d.isActive !== false).length;

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Stethoscope color="#06b6d4" size={24} />
            سجل الأطباء المحولين ونسب العمولات
          </h1>
          <p className="page-subtitle">إدارة بيانات الأطباء والعيادات المحولة، متابعة الإحالات، وتفعيل أو إيقاف حسابات الأطباء</p>
        </div>

        <button onClick={openNewModal} className="btn-primary">
          <Plus size={16} />
          <span>إضافة طبيب محول جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="responsive-four-strip">
        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-cyan)' }}>
          <span className="stat-title">الأطباء النشطون</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {activeCount} / {doctors.length}
          </span>
          <span className="stat-desc">أطباء متاحون للإحالات الجديدة</span>
        </div>

        <div className="stat-card" style={{ borderRight: '4px solid var(--accent-amber)' }}>
          <span className="stat-title">إجمالي العمولات المستحقة</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {totalCommissionsSum.toLocaleString()} د.ع
          </span>
          <span className="stat-desc">محسوبة آلياً من إجمالي العينات المحالة</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="بحث باسم الطبيب، التخصص، العيادة، أو الهاتف..."
            className="input-control"
            style={{ paddingRight: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setStatusFilter('ALL')}
          >
            الكل ({doctors.length})
          </button>
          <button
            type="button"
            className={statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            النشطون ({activeCount})
          </button>
          <button
            type="button"
            className={statusFilter === 'INACTIVE' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            المعطلون ({doctors.length - activeCount})
          </button>
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
                <th>الحالة</th>
                <th>النسبة</th>
                <th>الإحالات</th>
                <th>العمولات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب بيانات الأطباء...</td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا يوجد أطباء مطابقون للبحث</td>
                </tr>
              ) : (
                filteredDoctors.map((d) => {
                  const sampleCount = d.sampleCount ?? d.samplesCount ?? 0;
                  const isActive = d.isActive !== false;
                  return (
                    <tr key={d.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                      <td>
                        <strong style={{ color: 'var(--text-main)', fontSize: '13.5px' }}>
                          {d.name.startsWith('د.') ? d.name : `د. ${d.name}`}
                        </strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.specialty || '-'}</td>
                      <td>{d.clinic || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.phone || '-'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isActive ? '#059669' : '#dc2626',
                          }}
                        >
                          {isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                          {isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-received" style={{ fontWeight: 800 }}>
                          {d.commissionPercent}%
                        </span>
                      </td>
                      <td>{sampleCount} عينات</td>
                      <td style={{ fontWeight: 900, color: 'var(--accent-amber)' }}>
                        {(d.totalCommissions ?? d.totalCommission ?? 0).toLocaleString()} د.ع
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => openEditModal(d)}
                            className="btn-icon"
                            title="تعديل بيانات الطبيب"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(d)}
                            className="btn-icon"
                            style={{ color: isActive ? 'var(--text-muted)' : '#059669' }}
                            title={isActive ? 'إيقاف تفعيل الطبيب (إخفاء من القوائم الجديدة)' : 'إعادة تفعيل الطبيب'}
                          >
                            {isActive ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                          {sampleCount === 0 ? (
                            <button
                              onClick={() => setDeleteDoctorId(d.id)}
                              className="btn-icon"
                              style={{ color: 'var(--accent-rose)' }}
                              title="حذف نهائي (غير مستخدم في أي عينات)"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span
                              className="btn-icon"
                              style={{ opacity: 0.3, cursor: 'not-allowed' }}
                              title="لا يمكن حذف طبيب مرتبط بعينات سابقة (يمكن إيقاف تفعيله بدلاً من الحذف)"
                            >
                              <Trash2 size={14} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  id="isActiveDoctor"
                  checked={isActiveDoc}
                  onChange={(e) => setIsActiveDoc(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isActiveDoctor" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  طبيب نشط ومتاح في قائمة تسجيل العينات
                </label>
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
        message="هل أنت متأكد من حذف هذا الطبيب من السجلات نهائياً؟ لن يمكن التراجع."
        type="danger"
        confirmText="نعم، احذف الطبيب"
        cancelText="تراجع"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDoctorId(null)}
      />
    </AppShell>
  );
}
