# AGENT BRIEF: A_REPORTS (Agent A - Reports & Print)

## 1. Goal
Implement **Item 1** (High/Low indicators on screen AND in print) and **Item 5** (No Arabic on the printed patient report) without breaking any existing layout, formulas, or WhatsApp notifications.

---

## 2. Owned Files
- `packages/domain/src/clinicalIntelligence.ts` (Domain classification function)
- `packages/domain/src/index.ts`
- `apps/web/src/app/api/samples/[id]/print/route.ts` (Main print template)
- `packages/reports/src/templates/ClassicTemplate.ts`
- `packages/reports/src/templates/types.ts`
- `packages/reports/src/builder/ReportDataBuilder.ts`
- `apps/server/src/utils/pdf.ts`
- `MISSING_ENGLISH_NAMES.md` (Proposal documentation)

---

## 3. Forbidden Files
- `apps/web/src/app/page.tsx` (Patient registration)
- `apps/web/src/app/patients/page.tsx`
- `apps/web/src/app/doctors/page.tsx`
- `apps/web/src/app/catalog/page.tsx`
- WhatsApp services / routes (`whatsappService.ts`, etc.)
- Licensing, Updater, Backup modules

---

## 4. Key Requirements & Implementation Steps

### ITEM 1: High/Low indicators
1. Provide ONE pure domain function `evaluateResultRange(value, test, patientContext)` in `packages/domain/src/clinicalIntelligence.ts`.
   - Resolves applicable reference range by sex and age (using day/month/year precision).
   - Classifies numeric results into `HIGH` (red / bold / `↑`), `LOW` (blue / bold / `↓`), or `NORMAL` (no flag/color).
   - Evaluates calculated lipid values (`LDL`, `VLDL`, `Non-HDL`, ratios) and values in `PREVIOUS` column.
   - Ignores qualitative results with no numeric ranges (e.g., blood group).
2. Wire this classification into `apps/web/src/app/api/samples/[id]/print/route.ts` and `apps/web/src/app/results/page.tsx`.
3. In print CSS:
   - Ensure `-webkit-print-color-adjust: exact !important;` and `print-color-adjust: exact !important;`.
   - Render arrows as inline text `↑` / `↓` or inline SVG so they never depend on external icon fonts.
   - Use bold styling so flags remain legible on monochrome (black & white) thermal/laser printers.
   - Remove any old suppression rules or comments saying "no H/L".

### ITEM 5: Pure English LTR Patient Report
1. In `apps/web/src/app/api/samples/[id]/print/route.ts` (and server PDF templates):
   - Set `<html lang="en" dir="ltr">` and table `dir="ltr"`.
   - Replace all hardcoded Arabic labels with clinical standard English:
     - `اسم المريض` -> `Patient Name`
     - `العمر / الجنس` -> `Age / Sex`
     - `رقم العينة` -> `Sample ID`
     - `الطبيب المعالج` -> `Referred By`
     - `تاريخ الفحص` -> `Date`
     - `اسم الفحص` -> `Test / Investigation`
     - `النتيجة` -> `Result`
     - `الوحدة` -> `Unit`
     - `القيم الطبيعية` -> `Reference Range`
     - `الحالة` -> `Status`
     - Qualitative words: `موجب` / `إيجابي` -> `Positive`, `سالب` -> `Negative`, `طبيعي` -> `Normal`.
   - Digits: Force Latin digits (`latn` / `en-US` formatting).
   - Preserve laboratory free-text data entered by user (patient name, notes, doctor name, lab header/address from settings) exactly as entered.
   - If a test has no English name, use `test.code` as fallback and log it in `MISSING_ENGLISH_NAMES.md`.

---

## 5. Acceptance Criteria
1. Results-entry screen and print report both show matching High/Low indicators and colors.
2. Printed report has 0 Arabic script characters outside user free-text fields.
3. WhatsApp text format is unmodified.
4. Passes `npm run check:scope -- reports` and `npm run check:scope -- domain`.
