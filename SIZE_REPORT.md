<div dir="rtl" style="text-align: right; direction: rtl;">

# تقرير الحجم (SIZE_REPORT)

## خط الأساس (مقاس)
| البند | الحجم |
|---|---|
| المستودع كاملاً | 7.38 GB |
| منها مثبتات قديمة في `apps/desktop/dist` (غير متتبعة في git) | ~4.28 GB |
| `node_modules` | 1.73 GB |
| حجم آخر مثبت `Setup 1.2.3.exe` | 164 MB |

## ما طُبِّق (آمن)
- `productionBrowserSourceMaps: false` في `apps/web/next.config.js`.
- `compression: "maximum"` واستبعاد `*.map`, `*.md`, `*.tsbuildinfo`, `tests/` من المثبت.
- PDF يستخدم Edge/Chrome المثبت على الجهاز مع رجوع تلقائي لـ Chromium المضمّن.
- إيقاف تتبع `tsconfig.tsbuildinfo`.

## لم يُقَس بعد
حجم المثبت الجديد بعد هذه التغييرات — يتطلب `npm run build:installer` (لم يُشغَّل في هذه الجلسة).

## تحتاج قرارك (انظر الرد النهائي)
حذف المثبتات القديمة، تقليص محركات Prisma، إزالة Chromium المضمّن.

</div>
