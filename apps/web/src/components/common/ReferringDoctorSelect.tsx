'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Stethoscope, Plus, Search, Check, X, UserCheck, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../Toast';

export interface DoctorOption {
  id: string;
  name: string;
  phone?: string;
  clinic?: string;
  specialty?: string;
  commissionPercent?: number;
  isActive?: boolean;
}

interface ReferringDoctorSelectProps {
  value?: string | null;
  doctorName?: string | null;
  onChange: (doctorId: string | null, doctor?: DoctorOption | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function ReferringDoctorSelect({
  value,
  doctorName,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'اختر أو ابحث عن الطبيب المحول...',
}: ReferringDoctorSelectProps) {
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [newDocClinic, setNewDocClinic] = useState('');
  const [savingQuickDoc, setSavingQuickDoc] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/doctors');
      if (Array.isArray(res)) {
        setDoctors(res);
      }
    } catch (err: any) {
      console.warn('[ReferringDoctorSelect] Failed to load doctors:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Current selected doctor object
  const selectedDoctor = useMemo(() => {
    if (!value) return null;
    return doctors.find((d) => d.id === value) || (doctorName ? { id: value, name: doctorName, isActive: true } : null);
  }, [value, doctorName, doctors]);

  // Filtered doctors: active ones OR currently selected doctor even if deactivated
  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doctors.filter((d) => {
      // Show active doctors, or if it is currently selected allow it
      const isSelectable = d.isActive !== false || d.id === value;
      if (!isSelectable) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.clinic && d.clinic.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q))
      );
    });
  }, [doctors, value, searchQuery]);

  const handleSelect = (doc: DoctorOption | null) => {
    if (doc) {
      onChange(doc.id, doc);
    } else {
      onChange(null, null);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleOpenDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleQuickAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      toast.warning('اسم الطبيب مطلوب');
      return;
    }

    setSavingQuickDoc(true);
    try {
      const created = await apiRequest('/doctors', 'POST', {
        name: newDocName.trim(),
        phone: newDocPhone.trim() || undefined,
        specialty: newDocSpecialty.trim() || undefined,
        clinic: newDocClinic.trim() || undefined,
        isActive: true,
        commissionPercent: 10,
      });

      toast.success('تمت إضافة الطبيب بنجاح');
      await loadDoctors();
      handleSelect(created);
      setShowQuickAdd(false);
      setNewDocName('');
      setNewDocPhone('');
      setNewDocSpecialty('');
      setNewDocClinic('');
    } catch (err: any) {
      toast.error(err.message || 'فشل إضافة الطبيب', 'خطأ');
    } finally {
      setSavingQuickDoc(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} dir="rtl" style={{ position: 'relative', width: '100%' }}>
      {/* Combobox Trigger Box */}
      <div
        onClick={handleOpenDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-input, #ffffff)',
          border: '1px solid var(--border-color, #cbd5e1)',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minHeight: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Stethoscope size={16} color="var(--accent-cyan, #06b6d4)" style={{ flexShrink: 0 }} />
          {selectedDoctor ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main, #0f172a)' }}>
                {selectedDoctor.name.startsWith('د.') ? selectedDoctor.name : `د. ${selectedDoctor.name}`}
              </span>
              {selectedDoctor.specialty && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                  ({selectedDoctor.specialty})
                </span>
              )}
              {selectedDoctor.isActive === false && (
                <span style={{ fontSize: '10px', background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                  معطل
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted, #94a3b8)' }}>{placeholder}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedDoctor && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #94a3b8)',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="إلغاء التحديد"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
            zIndex: 1050,
            overflow: 'hidden',
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} color="var(--text-muted, #94a3b8)" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="بحث باسم الطبيب، العيادة، أو التخصص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                background: 'transparent',
                color: 'var(--text-main, #0f172a)',
              }}
            />
          </div>

          {/* Doctors List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {/* Clear Option */}
            <div
              onClick={() => handleSelect(null)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748b)',
                borderBottom: '1px dashed var(--border-color, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: !selectedDoctor ? 'var(--bg-input-deep, #f8fafc)' : 'transparent',
              }}
            >
              <span>بدون طبيب محول (مريض مباشر / بدون إحالة)</span>
              {!selectedDoctor && <Check size={12} color="var(--accent-cyan, #06b6d4)" style={{ marginRight: 'auto' }} />}
            </div>

            {loading ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                جاري التحميل...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                لا يوجد أطباء مطابقون للبحث
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelect(doc)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'var(--bg-input-deep, #f1f5f9)' : 'transparent',
                      borderBottom: '1px solid var(--border-color, #f8fafc)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                        {doc.name.startsWith('د.') ? doc.name : `د. ${doc.name}`}
                        {doc.isActive === false && (
                          <span style={{ fontSize: '10px', background: '#fee2e2', color: '#dc2626', padding: '1px 4px', borderRadius: '3px', marginRight: '6px', fontWeight: 700 }}>
                            معطل
                          </span>
                        )}
                      </div>
                      {(doc.specialty || doc.clinic) && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          {[doc.specialty, doc.clinic].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-cyan, #06b6d4)" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Inline Add Quick Action */}
          <div
            onClick={() => {
              setIsOpen(false);
              setShowQuickAdd(true);
            }}
            style={{
              padding: '9px 12px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--bg-input-deep, #f8fafc)',
              color: 'var(--accent-cyan, #0284c7)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            <span>+ إضافة طبيب جديد للقائمة</span>
          </div>
        </div>
      )}

      {/* Quick Add Doctor Modal */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => setShowQuickAdd(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Stethoscope size={16} color="var(--accent-cyan)" />
                إضافة طبيب محول جديد
              </h3>
              <button type="button" onClick={() => setShowQuickAdd(false)} className="toast-close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">اسم الطبيب الكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: د. أحمد كاظم"
                  className="input-control"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">التخصص الطبي</label>
                <input
                  type="text"
                  placeholder="مثال: باطنية وسكري"
                  className="input-control"
                  value={newDocSpecialty}
                  onChange={(e) => setNewDocSpecialty(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="input-label">العيادة / المركز</label>
                  <input
                    type="text"
                    placeholder="عيادة الشفاء"
                    className="input-control"
                    value={newDocClinic}
                    onChange={(e) => setNewDocClinic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="0770..."
                    className="input-control"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowQuickAdd(false)} className="btn-secondary" style={{ fontSize: '12px' }}>
                  إلغاء
                </button>
                <button type="submit" disabled={savingQuickDoc} className="btn-primary" style={{ fontSize: '12px', minWidth: '100px' }}>
                  {savingQuickDoc ? 'جاري الحفظ...' : 'حفظ واختيار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
