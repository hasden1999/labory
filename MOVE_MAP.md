# خريطة نقل الملفات وإعادة الهيكلة (MOVE_MAP.md)
نظام إدارة المختبرات الطبية (Labryo LIMS Monorepo)

توضح هذه الوثيقة المسارات الحالية ومساراتها المستهدفة الجديدة في هيكل الطبقات المستقلة، مع الحفاظ على حشوات إعادة التصدير المؤقتة (Temporary Re-export Shims) في المسارات القديمة لضمان عدم انقطاع التجميع والبناء أثناء العمل.

---

## جدول نقل الملفات (Old Path → New Target Path)

| # | المسار الحالي (Old Path) | المسار المستهدف الجديد (New Target Path) | الطبقة المالكة (Owner) | نوع الحشوة التوافقية (Shim) |
|---|---|---|---|---|
| 1 | `apps/web/src/lib/catalogData.ts` | `packages/data/src/catalog/catalogData.ts` | `CATALOG-DATA` | Re-export shim في `apps/web/src/lib/catalogData.ts` |
| 2 | `apps/web/data/clinical_templates.json` | `packages/forms/definitions/clinical_templates.json` | `FORMS` | Link / Data export |
| 3 | `apps/web/src/lib/clinicalTemplates.ts` | `packages/forms/src/definitions.ts` | `FORMS` | Re-export shim |
| 4 | `apps/web/src/lib/clinicalTemplatesConfig.ts` | `packages/forms/src/config.ts` | `FORMS` | Re-export shim |
| 5 | `apps/web/src/components/UrineFormModal.tsx` | `packages/forms/src/renderer/UrineFormRenderer.tsx` | `FORMS` | Re-export shim |
| 6 | `apps/server/src/utils/pdf.ts` | `packages/reports/src/pdfEngine.ts` | `REPORTS` | Re-export shim |
| 7 | `apps/web/src/lib/puppeteerPdfGenerator.ts` | `packages/reports/src/clientPdfGenerator.ts` | `REPORTS` | Re-export shim |
| 8 | `apps/server/src/services/whatsappService.ts` | `packages/messaging/src/whatsappService.ts` | `MESSAGING` | Re-export shim |
| 9 | `apps/web/src/lib/clinicalIntelligence.ts` | `packages/domain/src/clinicalIntelligence.ts` | `DOMAIN` | Re-export shim |
| 10 | `apps/web/src/lib/deltaCheck.ts` | `packages/domain/src/deltaCheck.ts` | `DOMAIN` | Re-export shim |
| 11 | `apps/desktop/services/updateService.js` | `packages/core/src/updater/updateService.js` | `CORE` | Re-export shim |
| 12 | `apps/server/src/utils/licensing.ts` | `packages/core/src/licensing/licensing.ts` | `CORE` | Re-export shim |
| 13 | `apps/web/src/lib/licensing.ts` | `packages/core/src/licensing/clientLicensing.ts` | `CORE` | Re-export shim |
| 14 | `apps/server/src/prisma.ts` | `packages/core/src/db/prisma.ts` | `CORE` | Re-export shim |

---

## استراتيجية الحشوات التوافقية (Re-export Shims)

لضمان عدم كسر استيرادات أي ملف موجود في المستودع أثناء إعادة الهيكلة، يظل الملف القديم محتوياً على سطر إعادة تصدير مباشر، مثال:
```typescript
// apps/web/src/lib/catalogData.ts (Shim)
export * from '@lab/data/catalog';
```
ويتم حذف هذه الحشوات فقط في مرحلة التكامل النهائي والتحقق الشامل من قبل وكيل ضمان الجودة (QA).
