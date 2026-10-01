# AGENT BRIEF: E_QA (Agent E - Quality Assurance & Golden Regression Suite)

## 1. Goal
Provide independent, rigorous regression testing, golden PDF tests, and fresh-eyes audit across all 5 items.
**CRITICAL RULE:** Agent E writes NO product code. Only tests and test fixtures.

---

## 2. Owned Files
- `tests/golden/*`
- `tests/e2e/*`
- `tests/unit/*`

---

## 3. Forbidden Files
- `apps/*` (All application product code)
- `packages/*` (All packages product code)

---

## 4. Key Requirements & Implementation Steps

### 1. Item 1 & Item 5 Golden PDF Verification
- Create `tests/golden/pdf_arabic_and_flags.test.ts`:
  - Renders a sample PDF report with multiple test types (Chemistry, CBC, Lipid with calculated LDL/VLDL, Urine).
  - Asserts that High/Low indicators (`↑` / `↓` and colored styling) are rendered for abnormal values.
  - Text Extraction & Character Check:
    - Extracts all text from the PDF.
    - Asserts that NO Arabic unicode characters (`\u0600-\u06FF`) exist outside the recognized lab data fields (patient name, notes, doctor name, lab header).
    - Checks that all column headers (`INVESTIGATION`, `RESULT`, `UNIT`, `REFERENCE RANGE`), status tags (`Normal`, `Positive`, `Negative`), and numbers are strictly Western Latin (`latn` / 0-9).

### 2. Item 2 Age Boundary Tests
- Create unit/golden tests for age normalization:
  - 28 days -> `"28 D"`
  - 12 months -> `"12 M"` (or `"1 Y"`)
  - 18 years -> `"18 Y"`
  - Check that newborn reference ranges trigger for patient aged under 30 days.

### 3. Non-Regression Verification
- Ensure all existing golden tests continue to pass without deviation:
  - `catalog_count.test.ts`
  - `api_snapshots.test.ts`
  - `updater.test.ts`
  - `smoke_inventory.test.ts`
- Ensure boundaries pass: `npm run lint:boundaries`.

---

## 5. Acceptance Criteria
1. Golden PDF test extracts text and asserts zero unexpected Arabic characters.
2. High/low indicators presence verified in PDF output.
3. Full verification suite passes: `npm run verify`.
