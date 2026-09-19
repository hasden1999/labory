'use client';

import React, { useState } from 'react';
import { AlertTriangle, Ban, X, FileText, CheckCircle2, Droplets } from 'lucide-react';

interface SampleRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleNumber: number | string;
  patientName: string;
  onConfirmReject: (rejection: {
    reason: string;
    notes?: string;
    rejectedBy?: string;
  }) => Promise<void> | void;
}

const ISO_REJECTION_REASONS = [
  { id: 'HEMOLYZED', label: 'انحلال الدم (Hemolysis)', desc: 'تكسر كريات الدم الحمراء يؤثر سلباً على دقة أملاح الكيمياء (كالوتاسيوم) والإنزيمات.' },
  { id: 'CLOTTED', label: 'تخثر العينة (Clotted Sample)', desc: 'وجود خثرات وجلطات ميكروية في أنبوب مانع التخثر (EDTA / Citrate) يعطل فحص الدم والتخثر.' },
  { id: 'INSUFFICIENT_VOLUME', label: 'حجم العينة غير كافٍ (QNS)', desc: 'كمية الدم المسحوبة غير كافية لإجراء التحاليل المطلوبة أو لنسبة مانع التخثر.' },
  { id: 'WRONG_CONTAINER', label: 'استخدام أنبوب سحب خاطئ (Wrong Tube)', desc: 'استخدام أنبوب بكاشف غير مطابق لمواصفات الفحوصات المحددة.' },
  { id: 'DELAYED_TRANSPORT', label: 'تأخر النقل أو سوء التخزين', desc: 'تجاوزت العينة المدة الزمنية المسموحة أو تعرضت لدرجات حرارة غير ملائمة.' },
  { id: 'LIPEMIC', label: 'عينة دهنية عكرة (Lipemic)', desc: 'ارتفاع حاد في دهون الدم يسبب تعكراً شديداً يمنع قياس الفحوصات الضوئية بدقة.' },
  { id: 'OTHER', label: 'سبب إداري أو فني آخر', desc: 'توضيح السبب يدوياً في الملاحظات السريرية.' },
];

export default function SampleRejectionModal({
  isOpen,
  onClose,
  sampleNumber,
  patientName,
  onConfirmReject,
}: SampleRejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState('HEMOLYZED');
  const [notes, setNotes] = useState('');
  const [rejectedBy, setRejectedBy] = useState('مسؤول الجودة والمختبر');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const reasonObj = ISO_REJECTION_REASONS.find(r => r.id === selectedReason);
      const fullReason = reasonObj ? `${reasonObj.label}` : selectedReason;
      await onConfirmReject({
        reason: fullReason,
        notes: notes.trim(),
        rejectedBy: rejectedBy.trim(),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل رفض العينة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        style={{ maxWidth: '580px', direction: 'rtl', textAlign: 'right', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Ban size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                بروتوكول رفض العينة وإعادة السحب (ISO 15189 Sample Rejection)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                معيار ضبط الجودة وسلامة النتائج الطبية لرفض العينات غير المطابقة
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

        {/* Target Sample Summary */}
        <div style={{ padding: '10px 14px', background: 'var(--bg-input-deep)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '16px' }}>
          <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
            المريض: {patientName}
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 800, marginRight: '8px' }}>
            #{sampleNumber}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Reason Radio Cards */}
          <div>
            <label className="input-label" style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', display: 'block' }}>
              سبب عدم المطابقة ورفض العينة (ISO Criteria) *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '230px', overflowY: 'auto', paddingRight: '2px' }}>
              {ISO_REJECTION_REASONS.map((r) => {
                const isChecked = selectedReason === r.id;
                return (
                  <label
                    key={r.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isChecked ? '#ef4444' : 'var(--border-color)'}`,
                      background: isChecked ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-input-deep)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={r.id}
                      checked={isChecked}
                      onChange={() => setSelectedReason(r.id)}
                      style={{ marginTop: '3px', accentColor: '#ef4444' }}
                    />
                    <div>
                      <strong style={{ fontSize: '12.5px', color: isChecked ? '#ef4444' : 'var(--text-main)', display: 'block' }}>
                        {r.label}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {r.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
                المسؤول عن توثيق الرفض *
              </label>
              <input
                type="text"
                className="input-control"
                value={rejectedBy}
                onChange={(e) => setRejectedBy(e.target.value)}
                required
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
                تعليمات إعادة السحب لساحب الدم
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="مثال: يرجى سحب عينة وريدية هادئة وتجنب الضغط"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
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
              className="btn-danger"
              style={{
                height: '36px',
                padding: '0 18px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Ban size={14} />
              <span>{isSubmitting ? 'جاري التوثيق...' : 'تأكيد رفض العينة وإصدار طلب إعادة سحب'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
