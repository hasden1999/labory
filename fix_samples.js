const fs = require('fs');

const code = `'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  DollarSign, 
  Printer, 
  Trash2, 
  X
} from 'lucide-react';

export default function SamplesPage() {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unpaidOnly, setUnpaidOnly] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [payAmountInput, setPayAmountInput] = useState('');

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('ذكر');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [discountInput, setDiscountInput] = useState('0');
  const [paidInput, setPaidInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقداً');
  const [sampleNotes, setSampleNotes] = useState('');

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [availablePanels, setAvailablePanels] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [testSearch, setTestSearch] = useState('');

  const loadSamples = async () => {
    setLoading(true);
    try {
      let url = '/samples?status=' + statusFilter + '&unpaidOnly=' + unpaidOnly;
      if (searchQuery) url += '&query=' + encodeURIComponent(searchQuery);
      const res = await apiRequest(url);
      setSamples(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const testsRes = await apiRequest('/tests');
      setAvailableTests(testsRes.tests || []);
      setAvailablePanels(testsRes.panels || []);

      const docsRes = await apiRequest('/doctors');
      setAvailableDoctors(docsRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSamples();
  }, [statusFilter, unpaidOnly]);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const rawSubtotal = selectedTestIds.reduce((sum, id) => {
    const found = availableTests.find((t) => t.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const discountVal = Number(discountInput) || 0;
  const grandTotal = Math.max(0, rawSubtotal - discountVal);
  const paidVal = paidInput !== '' ? Number(paidInput) : grandTotal;
  const remainingVal = Math.max(0, grandTotal - paidVal);

  const handleToggleTest = (id: string) => {
    if (selectedTestIds.includes(id)) {
      setSelectedTestIds(selectedTestIds.filter((tId) => tId !== id));
    } else {
      setSelectedTestIds([...selectedTestIds, id]);
    }
  };

  const handleApplyPanel = (panel: any) => {
    const pTestIds = panel.items.map((i: any) => i.testId);
    const combined = Array.from(new Set([...selectedTestIds, ...pTestIds]));
    setSelectedTestIds(combined);
  };

  const handleCreateSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('الرجاء إدخال اسم المريض');
      return;
    }
    if (selectedTestIds.length === 0) {
      alert('الرجاء اختيار فحص واحد على الأقل');
      return;
    }

    try {
      await apiRequest('/samples', 'POST', {
        newPatient: {
          name: patientName,
          phone: patientPhone,
          age: patientAge ? Number(patientAge) : undefined,
          gender: patientGender,
        },
        doctorId: selectedDoctorId || undefined,
        testIds: selectedTestIds,
        discount: discountVal,
        paidAmount: paidVal,
        paymentMethod,
        notes: sampleNotes,
      });

      setShowNewModal(false);
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setSelectedDoctorId('');
      setSelectedTestIds([]);
      setDiscountInput('0');
      setPaidInput('');
      setSampleNotes('');
      loadSamples();
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء إنشاء العينة');
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample || !payAmountInput) return;

    try {
      await apiRequest('/samples/' + selectedSample.id + '/payment', 'PATCH', {
        additionalPaid: Number(payAmountInput),
      });

      setShowPayModal(false);
      setSelectedSample(null);
      setPayAmountInput('');
      loadSamples();
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء تسجيل الدفع');
    }
  };

  const handleDeleteSample = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك بمسح هذه العينة بالكامل؟')) return;
    try {
      await apiRequest('/samples/' + id, 'DELETE');
      loadSamples();
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء حذف العينة');
    }
  };

  const filteredTests = availableTests.filter((t) => {
    const nameMatch = t.name ? t.name.toLowerCase().includes(testSearch.toLowerCase()) : false;
    const catMatch = t.category ? t.category.toLowerCase().includes(testSearch.toLowerCase()) : false;
    return nameMatch || catMatch;
  });

  const renderSampleRow = (s: any) => {
    const isReady = s.status === 'READY';
    const isInProgress = s.status === 'IN_PROGRESS';
    const statusBadgeClass = isReady ? 'badge badge-ready' : isInProgress ? 'badge badge-progress' : 'badge badge-received';
    const statusText = isReady ? 'جاهز (READY)' : isInProgress ? 'قيد الفحص' : 'مستلمة';
    const ageText = s.patient?.age ? s.patient.age + ' سنة' : '';
    const genderText = s.patient?.gender ? ' • ' + s.patient.gender : '';
    const phoneText = s.patient?.phone ? ' • ' + s.patient.phone : '';
    const subDetails = ageText + genderText + phoneText;

    return (
      <tr key={s.id}>
        <td style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>#{s.sampleNumber}</td>
        <td>
          <div style={{ fontWeight: 800 }}>{s.patient?.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{subDetails}</div>
        </td>
        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {new Date(s.createdAt).toLocaleDateString('ar-IQ')}
        </td>
        <td>{s.doctor ? s.doctor.name : <span style={{ color: 'var(--text-dim)' }}>مباشر</span>}</td>
        <td>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {s.tests?.map((t: any) => (
              <span key={t.id} style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {t.test?.name}
              </span>
            ))}
          </div>
        </td>
        <td style={{ fontWeight: 800 }}>{s.priceTotal ? s.priceTotal.toLocaleString() + ' د.ع' : '0 د.ع'}</td>
        <td>
          <div>{s.paidAmount ? s.paidAmount.toLocaleString() + ' د.ع' : '0 د.ع'}</div>
          {s.remainingAmount > 0 ? (
            <span style={{ color: 'var(--accent-rose)', fontSize: '12px', fontWeight: 800 }}>
              {'متبقي: ' + s.remainingAmount.toLocaleString() + ' د.ع'}
            </span>
          ) : (
            <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 700 }}>
              خالص المسدد
            </span>
          )}
        </td>
        <td>
          <span className={statusBadgeClass}>
            {statusText}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '6px' }}>
            {s.remainingAmount > 0 && (
              <button
                className="btn btn-emerald btn-sm"
                onClick={() => {
                  setSelectedSample(s);
                  setPayAmountInput(s.remainingAmount.toString());
                  setShowPayModal(true);
                }}
                title="تسديد دَيْن"
              >
                <DollarSign size={14} />
                تسديد
              </button>
            )}

            <a
              href={'/api/samples/' + s.id + '/print'}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="طباعة التقرير"
            >
              <Printer size={14} />
            </a>

            <button
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--accent-rose)' }}
              onClick={() => handleDeleteSample(s.id)}
              title="حذف"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCatalogTestItem = (t: any) => {
    const isChecked = selectedTestIds.includes(t.id);
    const itemBg = isChecked ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)';
    const itemBorder = isChecked ? '1px solid var(--accent-cyan)' : '1px solid transparent';
    return (
      <div
        key={t.id}
        onClick={() => handleToggleTest(t.id)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: itemBg,
          border: itemBorder,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{t.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.category}</div>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
          {t.price.toLocaleString() + ' د.ع'}
        </span>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FlaskConical color="#06b6d4" size={28} />
            قبول العينات والديون الطبية
          </h1>
          <p className="page-subtitle">تسجيل المريض وإدارة الفحوصات المقبولة ومتابعة المستحقات المالية</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus size={18} />
          تسجيل عينة جديدة
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
            <div className="input-group" style={{ margin: 0, flex: 1, position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="ابحث برقم العينة، اسم المريض، أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadSamples()}
              />
            </div>
            <button className="btn btn-secondary" onClick={loadSamples}>
              <Search size={16} />
              بحث
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">جميع الحالات</option>
              <option value="RECEIVED">تم الاستلام (RECEIVED)</option>
              <option value="IN_PROGRESS">قيد الفحص (IN_PROGRESS)</option>
              <option value="READY">جاهز للطباعة (READY)</option>
            </select>

            <button
              className={unpaidOnly ? 'btn btn-rose' : 'btn btn-secondary'}
              onClick={() => setUnpaidOnly(!unpaidOnly)}
            >
              <DollarSign size={16} />
              {unpaidOnly ? 'إظهار الجميع' : 'الديون المتبقية فقط'}
            </button>
          </div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم العينة</th>
              <th>اسم المريض</th>
              <th>التاريخ</th>
              <th>الطبيب المحول</th>
              <th>الفحوصات المطلوبة</th>
              <th>المبلغ الكلي</th>
              <th>المسدد / المتبقي</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                  جاري تحميل العينات...
                </td>
              </tr>
            ) : samples.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  لا توجد عينات مطابقة للبحث
                </td>
              </tr>
            ) : (
              samples.map(renderSampleRow)
            )}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical color="#06b6d4" />
                تسجيل عينة مريض جديدة
              </h2>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSample}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="input-group">
                  <label className="label">اسم المريض الثلاثي *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="مثال: أحمد عبد الله حسين"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="label">رقم الهاتف</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="0770XXXXXXX"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="label">العمر والجنس</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input"
                      placeholder="العمر"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      style={{ width: '80px' }}
                    />
                    <select
                      className="select"
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="label">الطبيب المحول</label>
                <select
                  className="select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">فحص مباشر (بدون طبيب محول)</option>
                  {availableDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name + ' (' + (d.specialty || 'طبيب محول') + ') - نسبة: ' + d.commissionPercent + '%'}
                    </option>
                  ))}
                </select>
              </div>

              {availablePanels.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label" style={{ marginBottom: '8px', display: 'block' }}>إضافة مجموعات فحوصات (Panels) سريعة:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availablePanels.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleApplyPanel(p)}
                        style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                      >
                        {'+ ' + p.name + ' (' + p.price.toLocaleString() + ' د.ع)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="label">{'اختر الفحوصات من الكتالوج (' + selectedTestIds.length + ' محددة)'}</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="تصفية الفحوصات..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '12px', width: '200px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredTests.map(renderCatalogTestItem)}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="label">المجموع الكلي</label>
                    <input type="text" className="input" value={rawSubtotal.toLocaleString() + ' د.ع'} readOnly style={{ fontWeight: 800 }} />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="label">الخصم (د.ع)</label>
                    <input
                      type="number"
                      className="input"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="label">المسدد الآن</label>
                    <input
                      type="number"
                      className="input"
                      placeholder={grandTotal.toString()}
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="label">طريقة الدفع</label>
                    <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="نقداً">نقداً (Cash)</option>
                      <option value="بطاقة">بطاقة (Card)</option>
                      <option value="آجل">آجل (Debt)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>الصافي المستحق: </span>
                    <strong style={{ fontSize: '16px', color: '#fff' }}>{grandTotal.toLocaleString() + ' د.ع'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>المتبقي (دَيْن): </span>
                    <strong style={{ fontSize: '16px', color: (remainingVal > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)') }}>
                      {remainingVal.toLocaleString() + ' د.ع'}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ وتسجيل العينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && selectedSample && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign color="#10b981" />
                {'تسديد دَيْن العينة #' + selectedSample.sampleNumber}
              </h2>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePayDebt}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                <div>اسم المريض: <strong>{selectedSample.patient?.name}</strong></div>
                <div>الدين المتبقي الحالي: <strong style={{ color: 'var(--accent-rose)' }}>{(selectedSample.remainingAmount ? selectedSample.remainingAmount.toLocaleString() : '0') + ' د.ع'}</strong></div>
              </div>

              <div className="input-group">
                <label className="label">المبلغ المسدد الآن (د.ع)</label>
                <input
                  type="number"
                  className="input"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  max={selectedSample.remainingAmount}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-emerald">
                  تأكيد تسديد المبلغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
`;

fs.writeFileSync('apps/web/src/app/samples/page.tsx', code, { encoding: 'utf8', flag: 'w' });
console.log('Successfully wrote refactored page.tsx!');
