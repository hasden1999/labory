'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, FileText, Printer, Building2, Clock, Calendar, AlertTriangle, User, Share2, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage({ params }: { params: { id: string } }) {
  const [sample, setSample] = useState<any | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sampleRes, settingsRes] = await Promise.all([
          fetch(`/api/verify/${params.id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/settings`).then(r => r.ok ? r.json() : null)
        ]);

        if (!sampleRes) {
          setNotFound(true);
        } else {
          setSample(sampleRes);
        }
        if (settingsRes) setSettings(settingsRes);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-400">جاري التحقق من التقرير الطبي إلكترونياً...</p>
        </div>
      </div>
    );
  }

  if (notFound || !sample) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-rose-400">لم يتم العثور على التقرير</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            الرمز الممسوح غير مسجل في قاعدة بيانات المختبر أو قد تم إلغاء العينة. يرجى التأكد من مسح الرمز المطبوع على التقرير الرسمي.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const patientName = sample.patient?.name || 'مريض';
  const nameParts = patientName.split(' ');
  const maskedName = nameParts.map((p: string) => p.charAt(0) + '.').join(' ');

  const isReady = sample.status === 'READY' || sample.status === 'DELIVERED';
  const labName = settings?.labName || 'مختبر التحليلات الطبية التخصصي';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white" dir="rtl">
      
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
        
        {/* Verification Badge Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-9 h-9 animate-pulse" />
          </div>
          
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Check size={12} /> وثيقة طبية معتمدة ومحققة رسمياً
          </div>

          <h1 className="text-lg font-black text-white pt-1">{labName}</h1>
          <p className="text-xs text-slate-400">منظومة التحقق الإلكتروني الذكية (Labryo Verification Gateway)</p>
        </div>

        {/* Metadata Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">رقم العينة (Sample #):</span>
            <span className="font-black text-cyan-400 text-sm">#{sample.sampleNumber}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">اسم المريض (حماية الخصوصية):</span>
            <span className="font-bold text-slate-200">{maskedName} ({sample.patient?.gender === 'FEMALE' ? 'أنثى' : 'ذكر'})</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">حالة التقرير المخبري:</span>
            <span className={`font-black px-2 py-0.5 rounded ${isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isReady ? 'معتمد وموثق نهائياً <Check size={12} />' : 'قيد الفحص المخبري'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">تاريخ ووقت الإصدار:</span>
            <span className="font-medium text-slate-300">
              {new Date(sample.createdAt).toLocaleDateString('ar-IQ')} - {new Date(sample.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">الطبيب المعالج:</span>
            <span className="font-medium text-slate-300">{sample.doctor?.name || 'Direct Consultation'}</span>
          </div>
        </div>

        {/* Tests Summary List */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            الفحوصات الطبية المشمولة بالتقرير ({sample.tests?.length || 0}):
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {(sample.tests || []).map((t: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                <span className="font-bold text-slate-200 truncate">{t.test?.name || t.testCode || 'Test'}</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                  {t.status || 'COMPLETED'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <a
            href={`/api/samples/${sample.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            معاينة وطباعة التقرير الطبي الكامل (Full A4 PDF)
          </a>

          <div className="text-center pt-2">
            <span className="text-[10px] text-slate-500">
              تم إصدار هذا التحقق عبر نظام Labryo Clinical LIS المتوافق مع معايير ISO 15189
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
