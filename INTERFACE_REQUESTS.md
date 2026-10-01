<div dir="rtl" style="text-align: right; direction: rtl;">

# سجل طلبات الواجهات المشتركة (INTERFACE_REQUESTS.md)

تُخصص هذه الوثيقة لتوثيق وتنسيق أي طلبات تعديل على الملفات المشتركة وملفات الجذر (مثل: `package.json`, `package-lock.json`, `tsconfig.json`, أدوات الفحص المعماري `tools/`). 
وفقاً لقواعد النظام المعمارية، فإن هذه الملفات مملوكة حصراً لوكيل النواة (`CORE`)، ويُحظر على الوكلاء الآخرين تعديلها مباشرة؛ بل يتم تدوين الطلب هنا ليقوم وكيل النواة بمراجعته وتنفيذه والتأكد من عدم كسر أي توافقية.

---

## الطلبات المنفذة والمعتمدة (Resolved Requests)

| # | الوكيل الطالب | الملف المستهدف | طبيعة الطلب | الحالة | تاريخ التنفيذ |
|---|---|---|---|---|---|
| 1 | `CATALOG-DATA` | `apps/web/tsconfig.json` | إضافة الاسم المستعار `@lab-manager/data` و `@lab/data` | ✅ تم التنفيذ | 2026-10-01 |
| 2 | `CATALOG-DATA` | `apps/server/tsconfig.json` | إضافة مسارات الاستيراد `@lab-manager/*` | ✅ تم التنفيذ | 2026-10-01 |
| 3 | `FORMS` | `tsconfig.json` (الجذر) | تفعيل `resolveJsonModule: true` لدعم قراءة تعريفات JSON للاستمارات | ✅ تم التنفيذ | 2026-10-01 |
| 4 | `SIZE` | `apps/desktop/package.json` | تفعيل `compression: "maximum"` واستبعاد الخرائط من المثبت | ✅ تم التنفيذ | 2026-10-01 |
| 5 | `QA` | `package.json` | إضافة `npm run typecheck` ضمن فحص التحقق الموحد `npm run verify` | ✅ تم التنفيذ | 2026-10-01 |

---

## نموذج تقديم طلب جديد (New Request Template)

```markdown
### [REQ-XXX] اسم الطلب
- **الوكيل الطالب (Requesting Agent):** [FORMS / DESIGN / REPORTS / DATA / DOMAIN]
- **الملف المستهدف (Target File):** [مسار الملف المشترك]
- **التعديل المطلوب (Proposed Change):** [وصف التعديل وحزم الاعتماد إن وجدت]
- **مبرر الطلب (Rationale):** [السبب الفني وكيف يخدم متطلبات الوحدة]
- **تأثير النطاق (Blast Radius Impact):** [تأكيد عدم التأثير على الوحدات الأخرى]
```

</div>
