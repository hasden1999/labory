<div dir="rtl" style="text-align: right; direction: rtl;">

# دليل التعديل (CHANGE_GUIDE)

| أريد أن أغيّر… | المس هذا فقط | ثم شغّل |
|---|---|---|
| إضافة فحص / سعر / مدى مرجعي | `packages/data/src/catalog/catalogData.ts` | `npm run check:scope -- data` |
| معادلة حسابية (LDL، eGFR…) | `packages/domain/src/clinicalIntelligence.ts` | `npm run check:scope -- domain` |
| حقل أو خيار في استمارة الإدرار/الخروج | حالياً: `apps/web/src/components/UrineFormModal.tsx` و `workstations/GseModal.tsx` (التحويل إلى `packages/forms/definitions` لم يكتمل) | `npm run check:scope -- forms` |
| تصميم تقرير PDF من الخادم | حالياً: `apps/server/src/utils/pdf.ts` | `npm run check:scope -- reports` |
| رسالة واتساب | `apps/server/src/services/whatsappService.ts` أو `apps/web/src/app/api/whatsapp/` | `npm run check:scope -- messaging` |
| الألوان والخطوط العامة | `apps/web/src/app/globals.css` (الرموز الجديدة في `packages/design/src/tokens`) | `npm run check:scope -- design` |

قبل أي إصدار: `npm run verify` (حدود الطبقات + الاختبارات الذهبية + البناء).

</div>
