'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  Phone
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useToast } from './Toast';

interface ActiveForm {
  section: string;
  titleArabic: string;
  titleEnglish: string;
  imageUrl: string;
  printUrl: string;
  testCount: number;
  caption: string;
}

interface WhatsAppFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId: string;
  sampleNumber: number | string;
  patientName: string;
  patientPhone: string;
}

export default function WhatsAppFormsModal({
  isOpen,
  onClose,
  sampleId,
  sampleNumber,
  patientName,
  patientPhone,
}: WhatsAppFormsModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<ActiveForm[]>([]);
  const [customPhone, setCustomPhone] = useState(patientPhone || '');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !sampleId) return;
    setLoading(true);
    setDispatchedSuccess(false);
    setCustomPhone(patientPhone || '');

    apiRequest('/whatsapp/send-result', 'POST', { sampleId, phone: patientPhone })
      .then((res) => {
        if (res && res.forms) {
          setForms(res.forms);
          setWaLink(res.waLink || null);
        }
      })
      .catch((err) => {
        console.error('Failed loading WhatsApp forms:', err);
        toast.error('فشل تجهيز صور الفحوصات الطبية', 'خطأ');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, sampleId, patientPhone]);

  if (!isOpen) return null;

  const handleCopyImageToClipboard = async (form: ActiveForm, index: number) => {
    try {
      toast.info(`جاري نسخ صورة ${form.titleArabic}...`);
      const res = await fetch(form.imageUrl);
      if (!res.ok) throw new Error('فشل جلب الصورة');
      const blob = await res.blob();

      // Convert JPEG blob to PNG for Clipboard API compatibility if needed
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2500);
        toast.success(`تم نسخ صورة ${form.titleArabic} إلى الحافظة! يمكنك الآن الضغط على Ctrl+V في محادثة واتساب.`);
      } else {
        throw new Error('متصفحك لا يدعم نسخ الصور المباشر');
      }
    } catch (e: any) {
      console.warn('Clipboard write error:', e);
      // Fallback: download the image
      handleDownloadImage(form);
      toast.info('تم تحميل الصورة إلى جهازك لتعذر النسخ المباشر إلى الحافظة.');
    }
  };

  const handleDownloadImage = (form: ActiveForm) => {
    const a = document.createElement('a');
    a.href = form.imageUrl;
    a.download = `Sample-${sampleNumber}-${form.section}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    forms.forEach((f, idx) => {
      setTimeout(() => {
        handleDownloadImage(f);
      }, idx * 400);
    });
    toast.success(`جاري تنزيل ${forms.length} صور للفورمات الطبية على جهازك.`);
  };

  const handleDispatchViaServer = async () => {
    try {
      setDispatching(true);
      await apiRequest('/whatsapp/send-result', 'POST', {
        sampleId,
        phone: customPhone,
        autoSend: true,
      });
      setDispatchedSuccess(true);
      toast.success(`تم إرسال ${forms.length} صور إلى هاتف المريض بنجاح!`);
    } catch (err: any) {
      toast.error(err.message || 'فشل الإرسال التلقائي', 'خطأ');
    } finally {
      setDispatching(false);
    }
  };

  const handleOpenWhatsAppChat = () => {
    if (waLink) {
      window.open(waLink, '_blank');
    } else {
      let clean = customPhone.replace(/[^0-9]/g, '');
      if (clean.startsWith('07') && clean.length === 11) clean = '964' + clean.substring(1);
      const url = `https://wa.me/${clean}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      dir="rtl"
    >
      <div 
        style={{
          background: '#0f172a',
          border: '1.5px solid #22c55e',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25)',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#22c55e',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#fff' }}>
                إرسال النتائج كصور طبية منفصلة عبر واتساب
              </h2>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                عينة #{sampleNumber} • المريض: {patientName} • كل فورمة تُرسل كصورة عالية الدقة بدلاً من الروابط
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Patient Contact Bar */}
          <div 
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#22c55e" />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#94a3b8' }}>رقم واتساب المستلم:</span>
              <input 
                type="text" 
                value={customPhone} 
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="0770XXXXXXX"
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#22c55e',
                  fontSize: '13px',
                  fontWeight: 800,
                  padding: '5px 10px',
                  width: '170px',
                  textAlign: 'left',
                  direction: 'ltr',
                }}
              />
            </div>

            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              عدد الصور الجاهزة للإرسال: <strong style={{ color: '#22c55e', fontSize: '14px' }}>{forms.length} صور</strong>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px auto', color: '#22c55e' }} />
              <div style={{ fontSize: '14px', fontWeight: 700 }}>جاري تجهيز الصور الطبية للفورمات...</div>
              <div style={{ fontSize: '11.5px', marginTop: '4px' }}>يتم التقاط صورة مخصصة لكل قسم طبي (CBC / إدرار / كيمياء)</div>
            </div>
          ) : forms.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
              لا توجد فورمات أو نتائج مكتملة لهذه العينة.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {forms.map((form, index) => {
                const isCopied = copiedIndex === index;
                return (
                  <div 
                    key={form.section}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Header */}
                    <div 
                      style={{
                        padding: '10px 12px',
                        background: '#0f172a',
                        borderBottom: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          style={{
                            background: '#22c55e',
                            color: '#000',
                            fontSize: '10px',
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          صورة {index + 1}/{forms.length}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                          {form.titleArabic}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {form.testCount} تحاليل
                      </span>
                    </div>

                    {/* Image Preview Box */}
                    <div 
                      style={{
                        height: '140px',
                        background: '#020617',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <img 
                        src={form.imageUrl} 
                        alt={form.titleArabic}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          background: '#fff',
                        }}
                        onError={(e) => {
                          // Fallback display if image rendering times out
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <a 
                        href={form.printUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid #0284c7',
                        }}
                      >
                        <ExternalLink size={10} /> معاينة التقرير
                      </a>
                    </div>

                    {/* Form Action Buttons */}
                    <div 
                      style={{
                        padding: '10px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        background: '#1e293b',
                      }}
                    >
                      <button 
                        type="button" 
                        onClick={() => handleCopyImageToClipboard(form, index)}
                        style={{
                          background: isCopied ? '#10b981' : 'rgba(34, 197, 94, 0.15)',
                          border: `1px solid ${isCopied ? '#10b981' : '#22c55e'}`,
                          color: isCopied ? '#fff' : '#4ade80',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                        title="نسخ الصورة للحافظة للصقها مباشرة في واتساب (Ctrl+V)"
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{isCopied ? 'تم النسخ!' : 'نسخ للحافظة'}</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleDownloadImage(form)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid #475569',
                          color: '#f8fafc',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                        title="تحميل الصورة على الجهاز"
                      >
                        <Download size={12} />
                        <span>تحميل JPEG</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #1e293b',
            background: '#0a0f1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handleDownloadAll}
              disabled={forms.length === 0}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid #475569',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} />
              <span>تحميل جميع الصور ({forms.length})</span>
            </button>

            <button 
              type="button" 
              onClick={handleOpenWhatsAppChat}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#4ade80',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ExternalLink size={14} />
              <span>فتح المحادثة في واتساب</span>
            </button>
          </div>

          <button 
            type="button" 
            onClick={handleDispatchViaServer}
            disabled={dispatching || forms.length === 0}
            style={{
              background: dispatchedSuccess ? '#16a34a' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
            }}
          >
            {dispatching ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>جاري إرسال الصور...</span>
              </>
            ) : dispatchedSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>تم الإرسال بنجاح!</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>إرسال كافة الصور للمريض تلقائياً (WhatsApp)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
