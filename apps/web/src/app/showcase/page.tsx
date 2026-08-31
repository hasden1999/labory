'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { 
  FlaskConical, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Printer, 
  QrCode, 
  Activity, 
  Layers, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Smartphone, 
  Monitor, 
  FileText, 
  Lock, 
  Share2, 
  HeartHandshake,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ShowcasePage() {
  const WHATSAPP_NUMBER = '9647700000000'; // Developer WhatsApp number placeholder

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #0d1a33 0%, #070a12 80%)', color: 'var(--text-main)', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Navigation Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px clamp(16px, 4vw, 48px)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', background: 'rgba(7, 10, 18, 0.8)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#041017' }}>
            <FlaskConical size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', margin: 0 }}>مختبر الرضا التخصصي</h1>
            <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 700 }}>نظام إدارة المختبرات الطبية والتحاليل المرضية (LIMS)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
            تجربة النظام المباشرة
          </Link>
          <Link href="/license" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}>
            <span>تفعيل رخصة المختبر</span>
            <ShieldCheck size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px 40px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '6px 16px', borderRadius: '30px', color: '#06b6d4', fontSize: '13px', fontWeight: 800, marginBottom: '20px' }}>
          <Sparkles size={16} />
          <span>الجيل الجديد من أنظمة المختبرات الطبية الذكية 2026</span>
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 44px)', fontWeight: 900, lineHeight: 1.3, marginBottom: '18px', letterSpacing: '-0.5px' }}>
          نظام متكامل لإدارة الفحوصات والنتائج الطبية <br />
          <span style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            يعمل 100% بدون إنترنت مع تجربة مجانية 7 أيام
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', color: '#94a3b8', maxWidth: '780px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
          صُمم خصيصاً لتلبية متطلبات أطباء وأخصائيي المختبرات الطبية في العراق والوطن العربي. سرعة فائقة في تسجيل العينات، باقات تشخيصية ذكية، كشف تلقائي للقيم الحرجة (Panic)، وطباعة فورية للباركود والتقارير الرسمية.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary" style={{ padding: '14px 32px', fontSize: '15px', fontWeight: 900, textDecoration: 'none', borderRadius: '12px' }}>
            <Zap size={18} />
            <span>ابدأ تجربتك المجانية الفورية (7 أيام)</span>
          </Link>

          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن ترخيص وباقات برنامج إدارة المختبرات الطبية LIMS')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 800, textDecoration: 'none', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
          >
            <Smartphone size={18} />
            <span>تواصل مع المطور عبر واتساب</span>
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>أبرز الإمكانيات والمميزات الحصرية في النظام</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>كل ما يحتاجه مختبرك في واجهة واحدة متكاملة وسلسة</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', marginBottom: '14px' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>أكثر من 80 فحصاً طبياً وباقات مخصصة</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              كتالوج طبي شامل يتضمن CBC، وظائف الكبد والكلى، الدهون، الهرمونات، والفيتامينات مع إمكانية إنشاء باقات مخصصة (مثل باقة السكري، فحص العرسان) بنقرة واحدة.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '14px' }}>
              <Activity size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>معادلات مخبرية آلية وإنذار القيم الحرجة</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              حساب تلقائي لمعادلات eGFR و LDL و Indirect Bilirubin بدون تدخل يدوي، مع فلاش تنبيهي أحمر نبضي فوري للقيم الحرجة (Critical Panic Values).
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '14px' }}>
              <Printer size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>طباعة الباركود والإيصالات وتقارير A4</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              توافق فوري مع طابعات ملصقات الأنابيب (50×25 ملم)، طابعات الإيصالات الحرارية (80 ملم)، وتقارير A4 الرسمية الملونة المزودة بـ QR Code للتحقق.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: '14px' }}>
              <Smartphone size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>ربط هواتف الكادر عبر الواي فاي (LAN PWA)</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              مسح رمز QR بكاميرا الهاتف لفتح تطبيق الويب الداخلي على أي جهاز محمول متصل بنفس شبكة المختبر لإدخال ومراجعة النتائج مباشرة.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', marginBottom: '14px' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>حماية أوفلاين وتراخيص ببصمة الجهاز</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              نظام ترخيص مشفر ومحكم يعمل بدون إنترنت مرتبط ببصمة قطع الكمبيوتر (HWID) مع فترة تجريبية مجانية 7 أيام وحماية من تلاعب ساعة النظام.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(20, 184, 166, 0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6', marginBottom: '14px' }}>
              <DollarSign size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>إدارة الحسابات والديون وعمولات الأطباء</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              سجل كامل للديون والذمم الآجلة، متابعة المصاريف التشغيلية، واحتساب نسب الأطباء المحولين التلقائية بدقة متناهية.
            </p>
          </div>

        </div>
      </section>

      {/* Pricing / Licensing Plans Section */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 80px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>خطط الاشتراك والتراخيص المتاحة للمختبرات</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>اختر الخطة المناسبة لحجم ونشاط مختبرك</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Plan 1: Trial */}
          <div className="glass-card" style={{ padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>تجربة فورية</span>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginTop: '12px', marginBottom: '6px' }}>الفترة التجريبية المجانية</h3>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#06b6d4', margin: '14px 0' }}>
                0 <span style={{ fontSize: '14px', color: '#94a3b8' }}>د.ع / 7 أيام</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'right', fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> تجربة كامل المميزات بلا قيود</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> تعمل أوفلاين على جهازك فورياً</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> تسجيل العينات والطباعة المباشرة</li>
              </ul>
            </div>

            <Link href="/" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', textDecoration: 'none' }}>
              ابدأ الآن
            </Link>
          </div>

          {/* Plan 2: Yearly Subscription */}
          <div className="glass-card" style={{ padding: '28px', textAlign: 'center', border: '2px solid #06b6d4', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.12) 0%, rgba(13, 19, 34, 0.95) 100%)' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '50%', transform: 'translateX(50%)', background: '#06b6d4', color: '#041017', fontSize: '11px', fontWeight: 900, padding: '3px 12px', borderRadius: '20px' }}>
              الأكثر طلباً وتوفيراً
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 800 }}>اشتراك سنوي مع التحديثات</span>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginTop: '12px', marginBottom: '6px' }}>باقة المختبر الاحترافي</h3>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', margin: '14px 0' }}>
                350,000 <span style={{ fontSize: '14px', color: '#94a3b8' }}>د.ع / سنوياً</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'right', fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#06b6d4" /> ترخيص سنة كاملة على كمبيوتر المختبر</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#06b6d4" /> ربط الطابعات وهواتف الكادر عبر الواي فاي</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#06b6d4" /> دعم فني مباشر وتحديثات مجانية مستمرة</li>
              </ul>
            </div>

            <Link href="/license" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', textDecoration: 'none' }}>
              طلب تفعيل الاشتراك
            </Link>
          </div>

          {/* Plan 3: Lifetime Buyout */}
          <div className="glass-card" style={{ padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>شراء دائم</span>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginTop: '12px', marginBottom: '6px' }}>ترخيص مدى الحياة (Lifetime)</h3>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', margin: '14px 0' }}>
                650,000 <span style={{ fontSize: '14px', color: '#94a3b8' }}>د.ع لمرة واحدة</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'right', fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> ملكية دائمة للبرنامج وقاعدة البيانات</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> ضمان ودعم فني مجاني لسنة كاملة</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> بدون أي اشتراكات أو دفعات شهرية</li>
              </ul>
            </div>

            <Link href="/license" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', textDecoration: 'none' }}>
              شراء النسخة الدائمة
            </Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
        جميع الحقوق محفوظة © {new Date().getFullYear()} - نظام مختبر الرضا للتحليلات الطبية (LIMS)
      </footer>

    </div>
  );
}
