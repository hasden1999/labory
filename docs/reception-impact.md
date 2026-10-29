# Reception Redesign System Impact Document (Coordination & Consistency)

## 1. Overview
This document specifies all components, files, schemas, APIs, stores, templates, and services touched or affected by the 1:1 redesign of the Labryo Reception screen matching reference images `labryo-reception-rtl-1-working.png` and `labryo-reception-rtl-2-empty.png`.

---

## 2. Shared Types & Contracts
All layers (Domain, Web UI, API, Reports, WhatsApp) share consistent types:

```typescript
export type BiologicalSex = 'MALE' | 'FEMALE';

export interface ClinicalAgeInput {
  years?: number | '';
  months?: number | '';
  days?: number | '';
}

export type ClinicalFlag = 'H' | 'L' | 'NORMAL' | 'NONE';

export interface RangeClassificationResult {
  flag: ClinicalFlag;
  status: 'HIGH' | 'LOW' | 'NORMAL';
  displayFlag: 'H ↑' | 'L ↓' | '';
  arrow: '↑' | '↓' | '';
  color: string;      // #c62828 for HIGH, #1d4ed8 for LOW
  bgColor: string;    // #fdecec for HIGH, #e8effe for LOW
  isHigh: boolean;
  isLow: boolean;
  isAbnormal: boolean;
  lowBound: number | null;
  highBound: number | null;
  matchedRangeText?: string;
}

export interface SpecimenTubeGroup {
  tubeType: string;
  name: string;
  color: string;
  dotColor: string;
  count: number;
  testCodes: string[];
}
```

---

## 3. Touched Subsystems & Files

### A. Database & Schema
- `apps/server/prisma/schema.prisma`:
  - Add `tubeType String?` to `TestCatalog`.
  - Migration strategy: Additive SQLite migration (`ALTER TABLE TestCatalog ADD COLUMN tubeType TEXT;`), backward-compatible with null values, seeded with standard tube types.

### B. Domain Engine (`packages/domain`)
- `packages/domain/src/rangeClassification.ts`:
  - Authoritative classification logic. Values equal to bounds are strictly NORMAL. Values > high are `H ↑`. Values < low are `L ↓`. Non-numeric or missing bounds return `NONE`.
  - Shared by Screen (`ResultsGridPanel`), Print (`PrintBody`), and WhatsApp (`orderHelpers`).
- `packages/domain/src/index.ts`:
  - Public export of range classification, age calculations, and tube helpers.

### C. Web UI (`apps/web/src/widgets/unified-workspace`)
- `ui/ReceptionSidebar.tsx` [NEW]:
  - Dedicated right-edge vertical navigation with labeled icons (`Reception`, `Results`, `Test catalog`, `Patients`, `Doctors`, `Reports`, `Settings`).
  - Active item indicator (tinted background `#e3f4f1` + 3px teal bar on right edge).
  - Theme toggle button (Dark / Light mode).
- `ui/PatientCardPanel.tsx` [MODIFY]:
  - Rightmost panel (~312px).
  - Full name (required), age in 3 separate fields (years, months, days with months 0-11 and days 0-30 validation).
  - Biological sex: Female / Male with no default, required.
  - Referring doctor combobox + inline `+` button opening quick-add modal.
  - Tubes to draw grouping with tube type, count, and member test codes. Empty state with dashed hint box.
- `ui/CatalogCartPanel.tsx` [MODIFY]:
  - Center flexible panel.
  - Quick search with `/` to focus, `Enter` to add top match, `Esc` to clear.
  - Profiles row (`Thyroid +`, `Diabetes +`, `Liver +`, `Kidney +`, `Lipid +`).
  - Category rail on the right side with counts (`Most used ☆`, `Biochemistry`, `Hematology`, etc.).
  - Single-line rows with "Form" badge for dedicated workstation tests, code, price in IQD. No discount.
- `ui/ResultsGridPanel.tsx` [MODIFY]:
  - Left panel (~588px; collapses to 68px strip with heartbeat icon and vertical text when 0 tests selected).
  - 4 columns: `Test` | `Result` | `Unit` | `Reference range`. No "Previous" column.
  - Grouped by category headers.
  - Age/sex dynamic reference range matching with interactive chip (`[ F ⌵ ]`).
  - Caret & focus persistence on input fields across keystrokes.
  - Form action button banner for dedicated workstation forms (GUE, GSE, SFA, CBC).
- `ui/UnifiedActionBar.tsx` [MODIFY]:
  - Bottom action bar: `F9 Save` (primary teal), `F10 Print report`, `F8 WhatsApp`, `F2 Barcode`, `F1 New patient`.
  - Status messages and gross invoice total (zero discount anywhere).
- `ui/UnifiedWorkspace.tsx` [MODIFY]:
  - Top header with "Reception", subtitle, "Saved on this PC" pill, and dark mode toggle.
  - RTL container with 100vh overflow hidden.

### D. Reports & Print Subsystem
- `apps/web/src/app/api/samples/[id]/print/PrintBody.ts`:
  - Renders report with English headings, patient name as entered, and flags `H ↑` / `L ↓` synchronized with shared domain engine.

### E. WhatsApp Integration
- `apps/web/src/lib/orderHelpers.ts`:
  - WhatsApp message formatting uses shared range flags (`H ↑`, `L ↓`).
  - Dispatch link guarded until all results are complete.

---

## 4. Protected Areas Invariants
- `lab.db` and Prisma schema: No drops, no renames. Only additive migration.
- Licensing, Windows service, mDNS, updates: Untouched.
- API endpoints: Preserved request/response shapes.
