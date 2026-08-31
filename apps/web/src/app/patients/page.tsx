'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  Users, 
  Search, 
  Plus, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Activity, 
  Printer, 
  Share2, 
  FileText, 
  CreditCard, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronLeft,
  X,
  UserPlus,
  ArrowUpRight,
  Sparkles,
  FlaskConical,
  DollarSign
} from 'lucide-react';

function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected active patient
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);

  // Document & WhatsApp Modals
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappText, setWhatsappText] = useState('');

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('ذكر');

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/patients');
      setPatients(res || []);
      
      // If URL has patient id, select it
      const paramId = searchParams.get('id');
      if (paramId) {
        setSelectedPatientId(paramId);
      } else if (res && res.length > 0 && !selectedPatientId) {
        setSelectedPatientId(res[0].id);
      }
    } catch (err: any) {
      toast.error('فشل في جلب سجل المرضى', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Fetch full details when selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const p = await apiRequest(`/patients/${selectedPatientId}`);
        setPatientDetails(p);
      } catch (err) {
        // ignore
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedPatientId]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.warning('يرجى إدخال اسم المريض', 'بيانات ناقصة');
      return;
    }

    try {
      const newP = await apiRequest('/patients', 'POST', {
        name: patientName.trim(),
        phone: patientPhone.trim() || undefined,
        age: patientAge ? Number(patientAge) : undefined,
        gender: patientGender,
      });

      setShowAddPatientModal(false);
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      toast.success('تمت إضافة المريض الجديد بنجاح!', 'تم الحفظ');
      await loadPatients();
      setSelectedPatientId(newP.id);
    } catch (err: any) {
      toast.error(err.message || 'خطأ أثناء إضافة المريض', 'فشل العملية');
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !patientName.trim()) return;

    try {
      await apiRequest(`/patients/${selectedPatientId}`, 'PATCH', {
        name: patientName.trim(),
        phone: patientPhone.trim() || undefined,
        age: patientAge ? Number(patientAge) : undefined,
        gender: patientGender,
      });

      setShowEditPatientModal(false);
      toast.success('تم تحديث بيانات المريض بنجاح!', 'تم التحديث');
      loadPatients();
      // Reload details
      const p = await apiRequest(`/patients/${selectedPatientId}`);
      setPatientDetails(p);
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل بيانات المريض', 'خطأ');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePatientId) return;
    try {
      await apiRequest(`/patients/${deletePatientId}`, 'DELETE');
      toast.success('تم حذف ملف المريض بنجاح', 'تم الحذف');
      setDeletePatientId(null);
      setSelectedPatientId(null);
      loadPatients();
    } catch (err: any) {
      toast.error(err.message || 'لا يمكن حذف المريض لوجود فحوصات مرتبطة به', 'تعذر الحذف');
    }
  };

  const handleOpenWhatsApp = (sample: any) => {
    const phone = patientDetails?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `964${cleanPhone.slice(1)}` : cleanPhone;
    setWhatsappPhone(formattedPhone);

    const reportUrl = `${window.location.origin}/api/samples/${sample.id}/print`;
    setWhatsappText(
      `مرحباً ${patientDetails?.name}،\nيسر مختبر الرضا للتحليلات الطبية إعلامكم بصدور نتائج فحصكم رقم (#${sample.sampleNumber}).\nيمكنكم الاطلاع على التقرير المعتمد وتحميله مباشرة من الرابط:\n${reportUrl}\n\nنتمنى لكم دوام الصحة والعافية.`
    );
    setShowWhatsAppModal(true);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        (p.age && p.age.toString().includes(q)) ||
        p.id.includes(q)
      );
    });
  }, [patients, searchQuery]);

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users color="#06b6d4" size={22} />
            سجل المرضى والملف الطبي الشامل
          </h1>
          <p className="page-subtitle">بحث سريع، عرض التاريخ الطبي الموحد، الزيارات السابقة، والتقارير المعتمدة في صفحة واحدة</p>
        </div>

        <button
          onClick={() => {
            setPatientName('');
            setPatientPhone('');
            setPatientAge('');
            setPatientGender('ذكر');
            setShowAddPatientModal(true);
          }}
          className="btn-primary"
        >
          <UserPlus size={16} />
          <span>إضافة مريض جديد</span>
        </button>
      </div>

      {/* Main Grid: Left List + Right Comprehensive File */}
      <div className="responsive-results-grid">
        
        {/* RIGHT SIDE: Patients List & Search */}
        <div className="glass-card" style={{ padding: '12px', maxHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Live Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهاتف، أو العمر..."
              className="input-control"
              style={{ paddingRight: '30px', fontSize: '12px', minHeight: '34px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span>المرضى المسجلون ({filteredPatients.length})</span>
          </div>

          {/* Scrollable Patient List */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>جاري تحميل سجل المرضى...</div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>لا يوجد مريض مطابق للبحث</div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = selectedPatientId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    style={{
                      padding: '9px 11px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '12.5px', color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>
                        {p.name}
                      </strong>
                      <span className="badge badge-received" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                        {p.samples?.length || 0} زيارات
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      <span>{p.phone || 'بدون هاتف'}</span>
                      <span>{p.age ? `${p.age} سنة` : ''} ({p.gender === 'أنثى' || p.gender === 'FEMALE' ? '♀' : '♂'})</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* LEFT SIDE: UNIFIED PATIENT FILE (ملف المريض الشامل في صفحة واحدة) */}
        {patientDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* 1. Patient Profile Summary Card */}
            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
                      {patientDetails.name}
                    </h2>
                    <span className="badge badge-received" style={{ fontSize: '11px' }}>
                      {patientDetails.gender === 'أنثى' || patientDetails.gender === 'FEMALE' ? 'أنثى ♀' : 'ذكر ♂'}
                    </span>
                    {patientDetails.age && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {patientDetails.age} سنة</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>الهاتف: <strong style={{ color: 'var(--text-main)' }}>{patientDetails.phone || 'غير مسجل'}</strong></span>
                    <span>تاريخ أول تسجيل: <strong>{new Date(patientDetails.createdAt).toLocaleDateString('ar-IQ')}</strong></span>
                    <span>إجمالي الزيارات: <strong style={{ color: 'var(--accent-cyan)' }}>{patientDetails.samples?.length || 0}</strong></span>
                  </div>
                </div>

                {/* Patient Direct Fast Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => router.push(`/?patientId=${patientDetails.id}&patientName=${encodeURIComponent(patientDetails.name)}&patientPhone=${patientDetails.phone || ''}&patientAge=${patientDetails.age || ''}&patientGender=${patientDetails.gender || ''}`)}
                    className="btn-primary"
                    style={{ fontSize: '11.5px', padding: '5px 12px' }}
                    title="فتح طلب فحص جديد لهذا المريض مباشرة"
                  >
                    <Plus size={14} />
                    <span>طلب فحص جديد (F2)</span>
                  </button>

                  <button
                    onClick={() => {
                      setPatientName(patientDetails.name);
                      setPatientPhone(patientDetails.phone || '');
                      setPatientAge(patientDetails.age ? String(patientDetails.age) : '');
                      setPatientGender(patientDetails.gender || 'ذكر');
                      setShowEditPatientModal(true);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  >
                    <Edit3 size={13} />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => setDeletePatientId(patientDetails.id)}
                    className="btn-icon"
                    style={{ color: 'var(--accent-rose)' }}
                    title="حذف المريض"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            </div>

            {/* 2. Medical Visit History & Test Results Stream */}
            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={16} color="var(--accent-cyan)" />
                  سجل الزيارات والطلبات والفحوصات السابقة ({patientDetails.samples?.length || 0})
                </strong>
              </div>

              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري جلب تفاصيل الفحوصات...</div>
              ) : !patientDetails.samples || patientDetails.samples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  لا توجد طلبات فحص سابقة مسجلة لهذا المريض
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patientDetails.samples.map((sample: any) => (
                    <div
                      key={sample.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                      }}
                    >
                      {/* Sample Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: 'var(--accent-cyan)', fontSize: '13px' }}>
                            عينة #{sample.sampleNumber}
                          </strong>
                          {sample.isUrgent && <span className="stat-badge">STAT عاجل</span>}
                          <span className={`badge badge-${sample.status.toLowerCase()}`}>
                            {sample.status === 'RECEIVED' ? '📥 تم أخذ العينة' : sample.status === 'IN_PROGRESS' ? '🔬 جاري الفحص' : sample.status === 'READY' ? '✅ جاهزة للطباعة' : '📤 تم تسليم التقرير'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(sample.createdAt).toLocaleDateString('ar-IQ')} - {new Date(sample.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Sample Fast Actions */}
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => router.push(`/results?sampleId=${sample.id}`)}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-cyan)' }}
                          >
                            <FileText size={12} />
                            <span>النتائج</span>
                          </button>

                          <button
                            onClick={() => {
                              setDocPreviewUrl(`/api/samples/${sample.id}/barcode`);
                              setDocPreviewTitle(`معاينة ملصق الباركود - عينة #${sample.sampleNumber} (${patientDetails.name})`);
                            }}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            title="طباعة ملصق الباركود للأنبوب"
                          >
                            <Printer size={12} />
                            <span>باركود</span>
                          </button>

                          <button
                            onClick={() => {
                              setDocPreviewUrl(`/api/samples/${sample.id}/print`);
                              setDocPreviewTitle(`معاينة تقرير الفحص A4 - عينة #${sample.sampleNumber} (${patientDetails.name})`);
                            }}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <FileText size={12} />
                            <span>طباعة A4</span>
                          </button>

                          <button
                            onClick={() => handleOpenWhatsApp(sample)}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-emerald)' }}
                          >
                            <Share2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Tests & Results Table */}
                      <div className="data-table-container" style={{ border: 'none', background: 'transparent' }}>
                        <table className="data-table" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#0a0e1a' }}>
                              <th>الفحص</th>
                              <th>النتيجة</th>
                              <th>المعدل الطبيعي</th>
                              <th>الوحدة</th>
                              <th>الحالة التشخيصية</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sample.tests?.map((st: any) => (
                              <tr key={st.id}>
                                <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{st.test?.name}</td>
                                <td>
                                  {st.resultValue ? (
                                    <strong style={{ color: st.isCritical ? '#ef4444' : st.isAbnormal ? '#f59e0b' : '#10b981', fontSize: '13px' }}>
                                      {st.resultValue}
                                    </strong>
                                  ) : (
                                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>بانتظار الإدخال</span>
                                  )}
                                </td>
                                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {st.test?.refRangeText || `${st.test?.refRangeLow ?? ''} - ${st.test?.refRangeHigh ?? ''}`}
                                </td>
                                <td style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{st.test?.unit || '-'}</td>
                                <td>
                                  {st.isCritical ? (
                                    <span className="badge badge-urgent">🚨 حرج (Panic)</span>
                                  ) : st.isAbnormal ? (
                                    <span className="badge badge-progress">⚠️ غير طبيعي</span>
                                  ) : st.resultValue ? (
                                    <span className="badge badge-ready">✓ طبيعي</span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Payment Note on Sample */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>المبلغ الإجمالي: <strong>{sample.priceTotal?.toLocaleString()} د.ع</strong></span>
                        {sample.remainingAmount > 0 ? (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>متبقي دين: {sample.remainingAmount.toLocaleString()} د.ع</span>
                        ) : (
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓ واصل بالكامل</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            يرجى اختيار مريض من القائمة لعرض ملفه وسجله الطبي المتكامل
          </div>
        )}

      </div>

      {/* ADD PATIENT MODAL */}
      {showAddPatientModal && (
        <div className="modal-overlay" onClick={() => setShowAddPatientModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>إضافة مريض جديد</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">اسم المريض الكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد عبد الله رشيد"
                  className="input-control"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="مثال: 07701234567"
                    className="input-control"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">العمر (سنوات)</label>
                  <input
                    type="number"
                    placeholder="مثال: 35"
                    className="input-control"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">الجنس</label>
                <select
                  className="select-control"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                >
                  <option value="ذكر">ذكر ♂</option>
                  <option value="أنثى">أنثى ♀</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ المريض
                </button>
                <button type="button" onClick={() => setShowAddPatientModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL */}
      {showEditPatientModal && (
        <div className="modal-overlay" onClick={() => setShowEditPatientModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>تعديل بيانات المريض</h3>
              <button onClick={() => setShowEditPatientModal(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleUpdatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">اسم المريض *</label>
                <input
                  type="text"
                  className="input-control"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    className="input-control"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">العمر</label>
                  <input
                    type="number"
                    className="input-control"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">الجنس</label>
                <select
                  className="select-control"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                >
                  <option value="ذكر">ذكر ♂</option>
                  <option value="أنثى">أنثى ♀</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  حفظ التعديلات
                </button>
                <button type="button" onClick={() => setShowEditPatientModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={!!deletePatientId}
        title="حذف ملف المريض"
        message="هل أنت متأكد من حذف هذا المريض من السجلات؟ لا يمكن التراجع إذا تم الحذف."
        type="danger"
        confirmText="نعم، احذف الملف"
        cancelText="تراجع"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePatientId(null)}
      />

      {/* WHATSAPP MODAL */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>إرسال التقرير عبر واتساب</h3>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">رقم الهاتف:</label>
                <input
                  type="text"
                  className="input-control"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">الرسالة:</label>
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
                  toast.success('تم فتح واتساب لإرسال الرسالة!', 'إرسال التقرير');
                }}
                className="btn-success"
                style={{ width: '100%', padding: '9px', marginTop: '4px' }}
              >
                <span>فتح واتساب الآن</span>
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

export default function PatientsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري التحميل...</div>}>
      <PatientsContent />
    </Suspense>
  );
}
