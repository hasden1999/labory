# AGENT BRIEF: LOGO (Agent C)

## الهدف (Goal)
التحكم بحجم وموضع شعار المختبر (`Logo Width, Alignment, and Offsets`) مع معاينة حية ومباشرة في صفحة الإعدادات.

## المواصفات الفنية (Technical Requirements)
1. **قالب الترويسة (`PrintHeader.ts`)**:
   - `logoWidthMm`: يحدد عرض الشعار بالمليمتر مع الحفاظ على نسبة العرض للارتفاع (`aspect-ratio: preserve`). القيمة `null` تعني الحجم الحالي تلقائياً.
   - `logoAlign`: محاذاة الشعار (`left` | `center` | `right`).
   - `logoOffsetXMm`, `logoOffsetYMm`: ضبط إزاحة دقيقة، مقيدة بحسابات تمنع خروج الشعار عن هوامش الصفحة.
2. **واجهة الإعدادات (`PaperDesignerV2.tsx`)**:
   - قسم مخصص ومستقل للتحكم بالشعار:
     - شريط تمرير وحقل رقمي لعرض الشعار بالمليمتر.
     - محدد المحاذاة (يمين، وسط، يسار).
     - حقول الإزاحة الأفقية والعمودية (X/Y).
     - زر "إعادة الضبط للافتراضي" (`Reset to default`) يعيد جميع القيم إلى `null`.
     - معاينة حية باستخدام نفس دالة `renderPrintHeader` الحقيقية لضمان تطابق ما يراه المستخدم مع المطبوع.

## الملفات المملوكة (Owned Files)
- `apps/web/src/app/api/samples/[id]/print/PrintHeader.ts`
- `apps/web/src/components/logo/*`
- مكون إعدادات الشعار داخل `PaperDesignerV2.tsx`

## الملفات المحظورة (Forbidden Files)
- `apps/web/src/app/api/samples/[id]/print/PrintBody.ts`
- دوال التجميع ومحرر الكتالوج.
- مخطط قاعدة البيانات والترحيلات.
