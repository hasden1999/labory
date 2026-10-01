<div dir="rtl" style="text-align: right; direction: rtl;">

# وحدة ربط الأجهزة المخبرية (Laboratory Devices Module)

## الغرض الوظيفي (Purpose)
ربط وتكامل أجهزة التحليل الآلية (Automated Analyzers مثل أجهزة CBC، الكيمياء، الهرمونات، وأجهزة الإدرار)، إدارة قنوات الاتصال والبروتوكولات (ASTM 1394, HL7 v2 via RS232 / TCP/IP)، تعيين ومطابقة رموز التحاليل (Device Test Mappings)، واستقبال النتائج اللحظية وتعيينها تلقائياً لأرقام العينات.

## واجهات البرمجة والمسارات (Public API)
- `GET /api/devices`: جلب قائمة الأجهزة المتصلة وحالة منافذها.
- `POST /api/devices`: تسجيل جهاز تحليل جديد وضبط إعدادات المنفذ والسرعة (Baud Rate).
- `GET/POST /api/devices/:id/mappings`: استعراض وتحديث خريطة مطابقة رموز الجهاز مع فحوصات الكتالوج.
- `GET /api/devices/incoming-results`: مراقبة طابور النتائج القادمة لحظياً من الأجهزة.
- `POST /api/devices/incoming-results/:id/apply`: اعتماد النتيجة وتثبيتها في ملف العينة.

## الملفات الأساسية (Key Files)
- `page.tsx`: شاشة إدارة ومراقبة الأجهزة المخبرية وخريطة المطابقة.
- `../../lib/deviceProtocol.ts`: معالجة ومطابقة شفرات وقراءات الأجهزة المخبرية.

</div>
