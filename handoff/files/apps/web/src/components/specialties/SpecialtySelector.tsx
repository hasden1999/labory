'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ChevronDown } from 'lucide-react';

interface Specialty {
  id: string;
  nameEn: string;
  nameAr?: string | null;
  groups: { id: string; nameEn: string; nameAr?: string | null }[];
}

interface Props {
  specialtyId: string | null;
  groupId: string | null;
  sortOrder?: number | null;
  onChange: (val: { specialtyId: string | null; groupId: string | null; sortOrder?: number | null }) => void;
}

export default function SpecialtySelector({ specialtyId, groupId, sortOrder, onChange }: Props) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/specialties')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data.specialties) {
          setSpecialties(data.specialties);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSpec = specialties.find((s) => s.id === specialtyId);
  const availableGroups = selectedSpec?.groups || [];

  return (
    <div className="space-y-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl" dir="rtl">
      <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
        <Layers size={15} />
        <span>التصنيف حسب الاختصاص السريري (Specialty & Group):</span>
        <span className="text-[10px] text-slate-400 font-normal">(اختياري)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Specialty Dropdown */}
        <div>
          <label className="block text-[11px] text-slate-300 mb-1">الاختصاص (Specialty)</label>
          <div className="relative">
            <select
              value={specialtyId || ''}
              onChange={(e) => {
                const newSpecId = e.target.value || null;
                onChange({
                  specialtyId: newSpecId,
                  groupId: null, // Reset group on specialty change
                  sortOrder: sortOrder || null,
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-teal-500"
            >
              <option value="">-- بدون اختصاص (عام / Other) --</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameEn} {s.nameAr ? `(${s.nameAr})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Group Dropdown (cascades if available) */}
        <div>
          <label className="block text-[11px] text-slate-300 mb-1">المجموعة الفرعية (Group)</label>
          <div className="relative">
            <select
              disabled={!specialtyId || availableGroups.length === 0}
              value={groupId || ''}
              onChange={(e) => {
                const newGroupId = e.target.value || null;
                onChange({
                  specialtyId,
                  groupId: newGroupId,
                  sortOrder: sortOrder || null,
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- بدون مجموعة فرعية --</option>
              {availableGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameEn} {g.nameAr ? `(${g.nameAr})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[11px] text-slate-300 mb-1">الترتيب داخل المجموعة</label>
          <input
            type="number"
            min="0"
            value={sortOrder ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              onChange({
                specialtyId,
                groupId,
                sortOrder: val,
              });
            }}
            placeholder="مثال: 1"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );
}
