<div dir="rtl" style="text-align: right; direction: rtl;">

# وحدة الإدارة المالية والورديات (Financials & Cash Drawer Module)

## الغرض الوظيفي (Purpose)
إدارة الصندوق النقدي وحركة الورديات اليومية (Cash Drawer Shifts)، متابعة المقبوضات النقدية والمدفوعات الإلكترونية، حساب أرباح الفحوصات الطبية، تسجيل مصاريف التشغيل والمشتريات، وحساب نسب وعمولات الأطباء المحيلين آلياً.

## واجهات البرمجة والمسارات (Public API)
- `GET /api/financials/shifts/current`: جلب بيانات وردية الصندوق الحالية ومبيعاتها.
- `POST /api/financials/shifts/open`: فتح وردية صندوق جديدة برصيد افتتاحي.
- `POST /api/financials/shifts/close`: إغلاق وتصفية الوردية ومطابقة العجز أو الفائض.
- `GET /api/financials/summary`: ملخص الإيرادات والمصروفات وصافي الأرباح لفترة محددة.
- `GET /api/financials/test-profitability`: تقرير ربحية الفحوصات الطبية مقارنة بتكاليف الكواشف.

## الملفات الأساسية (Key Files)
- `page.tsx`: شاشة لوحة التحكم المالية والورديات وتقارير الأرباح.
- `../../app/expenses/page.tsx`: شاشة تسجيل المصروفات التشغيلية.
- `../../app/debts/page.tsx`: شاشة متابعة الديون والذمم الآجلة.

</div>
