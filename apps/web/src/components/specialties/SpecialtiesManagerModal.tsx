'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, FolderPlus, Layers, Activity } from 'lucide-react';
import { useToast } from '../Toast';
import ConfirmModal from '../ConfirmModal';

interface TestItem {
  id: string;
  name: string;
  code: string;
  sortOrder?: number;
}

interface TestGroupItem {
  id: string;
  specialtyId: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
  tests: TestItem[];
  testCount: number;
}

interface SpecialtyItem {
  id: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
  groups: TestGroupItem[];
  directTests: TestItem[];
  totalTestCount: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export default function SpecialtiesManagerModal({ isOpen, onClose, onChanged }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    specialties: SpecialtyItem[];
    unassignedTests: TestItem[];
  }>({ specialties: [], unassignedTests: [] });

  // Add / Edit state for Specialty
  const [showAddSpecialty, setShowAddSpecialty] = useState(false);
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | null>(null);
  const [specForm, setSpecForm] = useState({ nameEn: '', nameAr: '', sortOrder: 0 });

  // Add / Edit state for Group
  const [addingGroupIdForSpec, setAddingGroupIdForSpec] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ nameEn: '', nameAr: '', sortOrder: 0 });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'specialty' | 'group';
    id: string;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/specialties');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      toast.error('تعذر تحميل بيانات الاختصاصات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specForm.nameEn.trim()) {
      toast.warning('يرجى إدخال اسم الاختصاص بالإنجليزية');
      return;
    }
    try {
      if (editingSpecialtyId) {
        const res = await fetch('/api/specialties', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'specialty',
            id: editingSpecialtyId,
            nameEn: specForm.nameEn,
            nameAr: specForm.nameAr,
            sortOrder: specForm.sortOrder,
          }),
        });
        if (res.ok) {
          toast.success('تم تحديث الاختصاص بنجاح');
          setEditingSpecialtyId(null);
          fetchData();
          onChanged?.();
        }
      } else {
        const res = await fetch('/api/specialties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'specialty',
            nameEn: specForm.nameEn,
            nameAr: specForm.nameAr,
            sortOrder: specForm.sortOrder,
          }),
        });
        if (res.ok) {
          toast.success('تمت إضافة الاختصاص بنجاح');
          setShowAddSpecialty(false);
          setSpecForm({ nameEn: '', nameAr: '', sortOrder: 0 });
          fetchData();
          onChanged?.();
        }
      }
    } catch {
      toast.error('فشلت العملية');
    }
  };

  const handleSaveGroup = async (specialtyId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.nameEn.trim()) {
      toast.warning('يرجى إدخال اسم المجموعة بالإنجليزية');
      return;
    }
    try {
      if (editingGroupId) {
        const res = await fetch('/api/specialties', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'group',
            id: editingGroupId,
            nameEn: groupForm.nameEn,
            nameAr: groupForm.nameAr,
            sortOrder: groupForm.sortOrder,
          }),
        });
        if (res.ok) {
          toast.success('تم تحديث المجموعة بنجاح');
          setEditingGroupId(null);
          fetchData();
          onChanged?.();
        }
      } else {
        const res = await fetch('/api/specialties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'group',
            specialtyId,
            nameEn: groupForm.nameEn,
            nameAr: groupForm.nameAr,
            sortOrder: groupForm.sortOrder,
          }),
        });
        if (res.ok) {
          toast.success('تمت إضافة المجموعة بنجاح');
          setAddingGroupIdForSpec(null);
          setGroupForm({ nameEn: '', nameAr: '', sortOrder: 0 });
          fetchData();
          onChanged?.();
        }
      }
    } catch {
      toast.error('فشلت العملية');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/specialties?id=${deleteConfirm.id}&type=${deleteConfirm.type}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('تم الحذف بنجاح');
        setDeleteConfirm(null);
        fetchData();
        onChanged?.();
      }
    } catch {
      toast.error('فشل الحذف');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إدارة الاختصاصات والمجموعات السريرية</h2>
              <p className="text-xs text-slate-400">تخصيص الهيكل الهرمي (اختصاص ➔ مجموعة ➔ فحص) وترتيب الفحوصات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            عدد الاختصاصات: <span className="font-bold text-teal-400">{data.specialties.length}</span> | 
            فحوصات معينة: <span className="font-bold text-teal-400">{data.specialties.reduce((acc, s) => acc + s.totalTestCount, 0)}</span> | 
            فحوصات غير معينة: <span className="font-bold text-amber-400">{data.unassignedTests.length}</span>
          </div>
          <button
            onClick={() => {
              setSpecForm({ nameEn: '', nameAr: '', sortOrder: data.specialties.length + 1 });
              setShowAddSpecialty(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus size={16} />
            إضافة اختصاص جديد
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Add Specialty Form */}
          {showAddSpecialty && (
            <form onSubmit={handleSaveSpecialty} className="p-4 bg-slate-800/80 border border-teal-500/30 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-teal-400">إضافة اختصاص جديد</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الاسم بالإنجليزية (إجباري)</label>
                  <input
                    type="text"
                    required
                    value={specForm.nameEn}
                    onChange={(e) => setSpecForm({ ...specForm, nameEn: e.target.value })}
                    placeholder="e.g. Biochemistry"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الاسم بالعربية (اختياري)</label>
                  <input
                    type="text"
                    value={specForm.nameAr}
                    onChange={(e) => setSpecForm({ ...specForm, nameAr: e.target.value })}
                    placeholder="مثال: الكيمياء الحيوية"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الترتيب</label>
                  <input
                    type="number"
                    value={specForm.sortOrder}
                    onChange={(e) => setSpecForm({ ...specForm, sortOrder: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSpecialty(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                >
                  حفظ الاختصاص
                </button>
              </div>
            </form>
          )}

          {data.specialties.map((spec) => (
            <div key={spec.id} className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
              {/* Specialty Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center">
                    {spec.sortOrder}
                  </span>
                  <div>
                    <span className="font-bold text-white text-sm" dir="ltr">{spec.nameEn}</span>
                    {spec.nameAr && <span className="text-xs text-slate-400 mr-2">({spec.nameAr})</span>}
                  </div>
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {spec.totalTestCount} فحص
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAddingGroupIdForSpec(spec.id);
                      setGroupForm({ nameEn: '', nameAr: '', sortOrder: spec.groups.length + 1 });
                    }}
                    className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-lg transition"
                    title="إضافة مجموعة فرعية"
                  >
                    <FolderPlus size={14} />
                    مجموعة فرعية
                  </button>
                  <button
                    onClick={() => {
                      setEditingSpecialtyId(spec.id);
                      setSpecForm({ nameEn: spec.nameEn, nameAr: spec.nameAr || '', sortOrder: spec.sortOrder });
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="تعديل الاختصاص"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'specialty', id: spec.id, name: spec.nameEn })}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="حذف الاختصاص"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Edit Specialty Inline Form */}
              {editingSpecialtyId === spec.id && (
                <form onSubmit={handleSaveSpecialty} className="p-3 bg-slate-900 border border-teal-500/30 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={specForm.nameEn}
                      onChange={(e) => setSpecForm({ ...specForm, nameEn: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      value={specForm.nameAr}
                      onChange={(e) => setSpecForm({ ...specForm, nameAr: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={specForm.sortOrder}
                      onChange={(e) => setSpecForm({ ...specForm, sortOrder: Number(e.target.value) })}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingSpecialtyId(null)} className="text-xs text-slate-400">إلغاء</button>
                    <button type="submit" className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs">تحديث</button>
                  </div>
                </form>
              )}

              {/* Add Group Form */}
              {addingGroupIdForSpec === spec.id && (
                <form onSubmit={(e) => handleSaveGroup(spec.id, e)} className="p-3 bg-slate-900 border border-cyan-500/30 rounded-lg space-y-2">
                  <h5 className="text-[11px] font-bold text-cyan-400">إضافة مجموعة جديدة إلى {spec.nameEn}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={groupForm.nameEn}
                      onChange={(e) => setGroupForm({ ...groupForm, nameEn: e.target.value })}
                      placeholder="e.g. Lipid profile"
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      value={groupForm.nameAr}
                      onChange={(e) => setGroupForm({ ...groupForm, nameAr: e.target.value })}
                      placeholder="مثال: دهون الدم"
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={groupForm.sortOrder}
                      onChange={(e) => setGroupForm({ ...groupForm, sortOrder: Number(e.target.value) })}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setAddingGroupIdForSpec(null)} className="text-xs text-slate-400">إلغاء</button>
                    <button type="submit" className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs">حفظ المجموعة</button>
                  </div>
                </form>
              )}

              {/* Groups List */}
              {spec.groups.length > 0 && (
                <div className="space-y-2 mr-4">
                  {spec.groups.map((grp) => (
                    <div key={grp.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
                            #{grp.sortOrder}
                          </span>
                          <span className="text-xs font-semibold text-slate-200" dir="ltr">{grp.nameEn}</span>
                          {grp.nameAr && <span className="text-[11px] text-slate-400">({grp.nameAr})</span>}
                          <span className="text-[10px] text-slate-500">({grp.testCount} فحص)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingGroupId(grp.id);
                              setGroupForm({ nameEn: grp.nameEn, nameAr: grp.nameAr || '', sortOrder: grp.sortOrder });
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="تعديل المجموعة"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'group', id: grp.id, name: grp.nameEn })}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="حذف المجموعة"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Tests badges inside group */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {grp.tests.length > 0 ? (
                          grp.tests.map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono" dir="ltr">
                              <span className="text-teal-400 font-bold">{t.sortOrder || '-'}.</span> {t.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">لا توجد فحوصات معينة بعد</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Direct tests (when no group) */}
              {spec.directTests.length > 0 && (
                <div className="mr-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">فحوصات مباشرة (بدون مجموعة):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {spec.directTests.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono" dir="ltr">
                        <span className="text-teal-400 font-bold">{t.sortOrder || '-'}.</span> {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {spec.groups.length === 0 && spec.directTests.length === 0 && (
                <div className="text-xs text-slate-500 mr-4 italic">لم يتم تعيين أي مجموعات أو فحوصات لهذا الاختصاص.</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title={deleteConfirm.type === 'specialty' ? 'تأكيد حذف الاختصاص' : 'تأكيد حذف المجموعة'}
          message={`هل أنت متأكد من حذف "${deleteConfirm.name}"؟ سيتم إلغاء تعيين الفحوصات التابعة لها دون حذفها.`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
