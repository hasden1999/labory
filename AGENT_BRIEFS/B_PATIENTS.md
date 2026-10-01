# AGENT BRIEF: B_PATIENTS (Agent B - Patients & Age Handling)

## 1. Goal
Implement **Item 2** (Age in days, months, and years with clinical normalization and compact display).

---

## 2. Owned Files
- `apps/web/src/app/page.tsx` (Patient quick registration section & age inputs)
- `apps/web/src/app/patients/page.tsx` (Patient management screen & age inputs)
- `apps/web/src/lib/orderHelpers.ts` (Age formatting & calculation utilities)
- `apps/web/src/lib/formatters.ts` (Display formatters)

---

## 3. Forbidden Files
- `apps/web/src/app/api/samples/[id]/print/route.ts` (Owned by Agent A)
- `apps/web/src/app/catalog/page.tsx` (Owned by Agent D)
- `apps/web/src/app/doctors/page.tsx` (Owned by Agent C)
- Licensing, WhatsApp, updater modules

---

## 4. Key Requirements & Implementation Steps

### 1. Three-field Age Control
- In `apps/web/src/app/page.tsx` and `apps/web/src/app/patients/page.tsx`:
  - Replace the single numeric age input with a compact 3-field control:
    `[ Years ] | [ Months ] | [ Days ]`
  - Any combination is accepted (e.g., 40 days, 14 months, 2 years 3 months). At least one field is required.
  - Optional date-of-birth (DOB) datepicker: selecting a date calculates and populates the 3 fields.
  - Stable components (no focus loss/caret jumping during typing), logical Tab order.

### 2. Normalization & Storage
- Calculate `birthDate`:
  - If exact DOB chosen: `birthDate = DOB`, `birthDateEstimated = false`.
  - If Years/Months/Days entered: `birthDate = registrationDate - enteredAge`, `birthDateEstimated = true`.
- Legacy patients: if `birthDate` is null, preserve and display their stored `age` without recomputation.

### 3. Precision Age Evaluation for Reference Ranges
- Calculate exact age in days/months/years at the sample/test date.
- Reference range selector matches `ReferenceRange` records with `ageUnit = 'days'` or `'months'` for neonates and infants.

### 4. Compact Display Format
- Display format everywhere:
  - `< 1 month` -> `"12 D"`
  - `< 2 years` -> `"5 M"` (or `"1 Y 4 M"`)
  - `< 18 years` -> `"3 Y 2 M"`
  - Adults -> `"45 Y"`
- For legacy patients without `birthDate`: display `"{age} Y"`.

---

## 5. Acceptance Criteria
1. Unit tests pass for normalization and compact display boundaries (28 days, 12 months, 18 years).
2. Existing patient ages remain unchanged.
3. Newborn reference ranges (days/months) resolve automatically and correctly.
4. Passes `npm run typecheck` and `npm run check:scope -- forms` (or web scope).
