'use client';

import React, { useState } from 'react';
import { AlertOctagon, PhoneCall, Check, X, Clock, User, ShieldCheck } from 'lucide-react';

interface CriticalCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId: string;
  sampleNumber: number | string;
  patientName: string;
  testName: string;
  resultValue: string;
  unit?: string;
  defaultDoctorName?: string;
  onSave: (log: {
    testName: string;
    resultValue: string;
    physicianName: string;
    physicianPhone?: string;
    callerName: string;
    calledAt: string;
    readBackConfirmed: boolean;
    actionTaken?: string;
    notes?: string;
  }) => Promise<void> | void;
}

export default function CriticalCallModal({
  isOpen,
  onClose,
  sampleNumber,
  patientName,
  testName,
  resultValue,
  unit = '',
  defaultDoctorName = '',
  onSave,
}: CriticalCallModalProps) {
  const [physicianName, setPhysicianName] = useState(defaultDoctorName || '');
  const [physicianPhone, setPhysicianPhone] = useState('');
  const [callerName, setCallerName] = useState('المخبري المناوب');
  const [calledAt, setCalledAt] = useState(() => new Date().toISOString().substring(0, 16));
  const [readBackConfirmed, setReadBackConfirmed] = useState(true);
  const [actionTaken, setActionTaken] = useState('إبلاغ فوري بالحالة الحرجة وبدء الإجراءات الإسعافية السريرية');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicianName.trim()) {
      alert('يرجى كتابة اسم الطبيب أو الجهة الطبية المعالجة التي تم تبليغها');
      return;
    }
    if (!readBackConfirmed) {
      alert('معيار CLSI GP47 يتطلب إلزامياً تأكيد القراءة العكسية (Read-Back) من قبل الطبيب المعالج لضمان دقة المعلومة');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        testName,
        resultValue: `${resultValue} ${unit}`.trim(),
        physicianName: physicianName.trim(),
        physicianPhone: physicianPhone.trim(),
        callerName: callerName.trim(),
        calledAt: new Date(calledAt).toISOString(),
        readBackConfirmed,
        actionTaken: actionTaken.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ سجل التبليغ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        style={{ maxWidth: '560px', direction: 'rtl', textAlign: 'right', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertOctagon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                توثيق تبليغ نتيجة حرجة (CLSI GP47 Panic Call Log)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                بروتوكول السلامة الطبية المعتمد دولياً للإبلاغ عن القيم المهددة للحياة
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Panic Value Alert Banner */}
        <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong style={{ fontSize: '13px', color: '#ef4444', display: 'block' }}>
                {testName} = {resultValue} {unit}
              </strong>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                المريض: {patientName} • عينة #{sampleNumber}
              </span>
            </div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#ef4444', color: '#fff' }}>
              PANIC VALUE
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
                اسم الطبيب / الجهة المستلمة *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="د. الطبيب المعالج / طوارئ المشفى"
                value={physicianName}
                onChange={(e) => setPhysicianName(e.target.value)}
                required
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
                رقم هاتف الطبيب
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="07XXXXXXXXX"
                value={physicianPhone}
                onChange={(e) => setPhysicianPhone(e.target.value)}
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
                اسم المخبري المبلّغ *
              </label>
              <input
                type="text"
                className="input-control"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                required
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
                توقيت الاتصال الهاتفي *
              </label>
              <input
                type="datetime-local"
                className="input-control"
                value={calledAt}
                onChange={(e) => setCalledAt(e.target.value)}
                required
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
              الإجراء السريري المتخذ
            </label>
            <input
              type="text"
              className="input-control"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              style={{ height: '34px', fontSize: '12px' }}
            />
          </div>

          {/* CLSI Read-Back Requirement Checkbox */}
          <div style={{ padding: '10px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: 'var(--color-success)' }}>
              <input
                type="checkbox"
                checked={readBackConfirmed}
                onChange={(e) => setReadBackConfirmed(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-success)' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={15} />
                تأكيد القراءة العكسية (Read-Back Verification Confirmed)
              </span>
            </label>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', paddingRight: '24px' }}>
              شرط معيار CLSI GP47: قام الطبيب بإعادة قراءة القيمة والتأكيد عليها هاتفياً لمنع أي خطأ سمعي.
            </span>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
              ملاحظات المكالمة (اختياري)
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="مثال: طلب الطبيب فحص تخثر إضافي أو إعادة سحب تأكيدية"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ height: '34px', fontSize: '12px' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ height: '36px', padding: '0 16px', fontSize: '12px', borderRadius: '8px' }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                height: '36px',
                padding: '0 18px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #e11d48 0%, #ef4444 100%)',
                borderColor: '#f43f5e',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <PhoneCall size={14} />
              <span>{isSubmitting ? 'جاري التوثيق...' : 'حفظ وتوثيق التبليغ السريري'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
