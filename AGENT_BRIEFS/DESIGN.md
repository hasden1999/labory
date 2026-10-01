# تكليف وكيل التصميم والهوية (AGENT_BRIEFS/DESIGN.md)

## الهدف (Goal)
تجميع رموز التصميم (Design Tokens: الألوان، المسافات، الخطوط، قواعد الاتجاه العربي RTL)، والثيمات (Light / Dark)، والمكونات المشتركة لواجهة المستخدم (UI Kit: أزرار، حقول، نوافذ منبثقة، بطاقات)، والتنسيقات العامة داخل طبقة واحدة معزولة. يُحظر تماماً وجود أي منطق أعمال أو استعلامات بيانات هنا.

## المجلدات المملوكة (Owned Dirs)
- `packages/design/tokens/`
- `packages/design/src/`
- `packages/design/theme/`

## المسارات المحظورة (Forbidden Dirs)
- منطق الأعمال السريري (`packages/domain/`).
- استعلامات قاعدة البيانات (`prisma.*`).
- مسارات الخادم والواجهات الخلفية (`apps/server/`).

## الخطوات التنفيذية (Steps)
1. إنشاء ملفات الرموز الأساسية:
   - `tokens/colors.ts`: الألوان الأساسية، الحالات (Success, Warning, Danger/Critical, Info).
   - `tokens/typography.ts`: عائلة الخطوط العربية (Cairo, Tajawal, Segoe UI)، الأحجام، الأوزان.
   - `tokens/spacing.ts`: شبكة المسافات القياسية ونصف أقطار الزوايا (Border Radius).
   - `tokens/rtl.ts`: ثوابت الاتجاه والمحاذاة لليمين.
2. بناء مكونات الواجهة المشتركة في `packages/design/src/ui/`: `Button`, `Modal`, `Badge`, `Card`.
3. ترك حشوات توافقية في `apps/web/src/components/common/`.

## معايير القبول (Acceptance Criteria)
- [ ] خلو كافة مكونات الـ UI Kit من أي ألوان أو مسافات صريحة مشفرة (Hard-coded)، والاعتماد بنسبة 100% على الرموز المركزية.
- [ ] دعم تام للغة العربية والاتجاه من اليمين لليسار (RTL).

## صيغة التسليم (Handoff Format)
توليد تقرير `HANDOFF_DESIGN.md` يوضح الرموز المنشأة ومكونات الواجهة المشتركة.
