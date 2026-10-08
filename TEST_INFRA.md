# Labryo Clinical LIS - Test Infrastructure Documentation (`TEST_INFRA.md`)

## 1. Overview & Testing Philosophy
The **Labryo Clinical LIS E2E Test Suite** provides an independent, opaque-box, requirement-driven verification harness grounded in clinical laboratory standards (IFCC, CLSI, KDIGO, ADA, WHO). 

For the **All-in-One Console (Unified Single-Screen Clinical Workspace)** overhaul, the test suite verifies public interface contracts, mathematical accuracy, clinical safety invariants, and user workflows across all four standard testing tiers without coupling to private internal component implementations.

## 2. Directory Layout & Test Structure
```
d:\lab\
├── tests\
│   ├── e2e\
│   │   ├── harness\
│   │   │   ├── testRunner.ts           # Standalone async runner engine (describe/test, hooks, formatting)
│   │   │   ├── assertions.ts           # Custom rich matcher library (toBe, toEqual, toBeCloseTo, toContain)
│   │   │   ├── fixtures.ts             # Clinical fixtures (patients, doctors, catalog, templates)
│   │   │   └── clinicalOracles.ts      # Authoritative clinical equations & diagnostic rule oracles
│   │   ├── unified-workspace.test.ts   # Master E2E runner for All-in-One Console (47 tests across 4 tiers)
│   │   ├── run_all.ts                  # Master CLI runner orchestrating legacy system suites
│   │   ├── tier1_features/             # Modular feature suites
│   │   ├── tier2_boundary_corner/      # Boundary & corner case suites
│   │   ├── tier3_combinations/         # Cross-feature combinations suites
│   │   └── tier4_clinical_scenarios/   # End-to-end patient journey suites
├── TEST_INFRA.md                       # This infrastructure documentation
└── TEST_READY.md                       # Formal test readiness and pass declaration
```

## 3. Four-Tier Testing Methodology (All-in-One Console)

### Tier 1: Feature Coverage (>=5 test cases per feature across R1-R3)
- **Suite 1.1: R1 Right Panel - Patient Card & Tube Badges (6 tests)**
  * `TC-T1-01`: Autocomplete Arabic normalization (`cleanArabic`) strips diacritics and unifies letters.
  * `TC-T1-02`: Clinical age Y/M/D sync accurately computes ISO birth date and estimation flag (`normalizeAgeToBirthDate`).
  * `TC-T1-03`: Birth date accurately breaks down into years, months, and days (`computeAgeBreakdown`).
  * `TC-T1-04`: Clinical age formatting generates standardized medical notation in Latin and Arabic (`formatClinicalAge`, `formatClinicalAgeArabic`).
  * `TC-T1-05`: Gender selection contract and doctor referral commission calculation (`Math.round((netTotal * doctor.commissionPercent) / 100)`).
  * `TC-T1-06`: Tube color badges correctly derive EDTA (purple), Citrate (blue), SST (yellow), and Urine container (green) badges (`deriveTubeBadges`).

- **Suite 1.2: R1 Center Panel - Catalog, Cart & Invoice Summary (6 tests)**
  * `TC-T1-07`: 0ms catalog search retrieves tests instantaneously across English and Arabic queries.
  * `TC-T1-08`: Category filter pills partition tests into 7 clinical categories.
  * `TC-T1-09`: SMART_BUNDLES (F2-F6) resolve valid diagnostic panels without errors.
  * `TC-T1-10`: Cart prevents duplicate test additions and tracks item count.
  * `TC-T1-11`: Invoice summary calculates gross total, percentage discount, and net total IQD.
  * `TC-T1-12`: Payment methods (CASH, DEBT, CARD) and technician role price privacy (`canSeePrices: false`).

- **Suite 1.3: R1 Left Panel - Results Grid, RTL Bidi Isolation & 4-Tier Badges (5 tests)**
  * `TC-T1-13`: `UnifiedResultItem` contract integrity holds all clinical fields.
  * `TC-T1-14`: Reference ranges RTL bidi isolate styling rules (`dir="ltr"`, `unicode-bidi: isolate`) prevent Arabic flipping.
  * `TC-T1-15`: 4-Tier clinical status pills map results to NORMAL, HIGH, LOW, and PANIC.
  * `TC-T1-16`: Dynamic reference interval matching resolves sex- and age-specific ranges (`matchPatientReferenceRange`).
  * `TC-T1-17`: Sparse or missing reference range fallback displays safely without errors.

- **Suite 1.4: R1 Clinical Formulas - Real-Time Lipid Engine & eGFR (5 tests)**
  * `TC-T1-18`: Real-time Friedewald lipid engine in mg/dL (LDL, VLDL, Non-HDL, Castelli I & II).
  * `TC-T1-19`: Real-time Friedewald lipid engine in mmol/L uses 2.2 divisor and 2-decimal rounding.
  * `TC-T1-20`: 2021 CKD-EPI race-free eGFR equation accurately calculates G1 through G5 stages.
  * `TC-T1-21`: Indirect Bilirubin calculation (Total - Direct) and direct > total clinical error guard.
  * `TC-T1-22`: Calculated test rows carry zero price and `isCalculated: true`, never blocking order completion.

- **Suite 1.5: R2 Action Bar & Ergonomic Shortcuts (5 tests)**
  * `TC-T1-23`: F1 Shortcut resets dirty state across all panels and focuses patient name input.
  * `TC-T1-24`: F2 Thermal Barcode payload generates 50x25mm CSS, Code 128 SVG, and tube metadata.
  * `TC-T1-25`: F9 Save & Print PDF payload conforms to English LTR, no Arabic outside free inputs, and directional arrows.
  * `TC-T1-26`: F10 WhatsApp URL generates `wa.me` link with normalized +964 phone and clean format.
  * `TC-T1-27`: Header View Toggle switches between Unified and Classic modes with localStorage key.

- **Suite 1.6: R3 System Preservation - Zero Breaking Changes (5 tests)**
  * `TC-T1-28`: Zero DB schema change: verified against Prisma SQLite core models (`Patient`, `Sample`, `SampleTest`, `Doctor`, `TestCatalog`).
  * `TC-T1-29`: Zero API contract change: verified against public HTTP routes (`/api/samples`, `/api/patients`, `/api/tests`, `/api/samples/[id]/barcode`, `/api/samples/[id]/print`).
  * `TC-T1-30`: Pure domain calculation library parity guarantees calculation identity (`@lab-manager/domain`).
  * `TC-T1-31`: Clinical formatting invariant: zero high/low (H/L) flag badges across outputs.
  * `TC-T1-32`: 16:9 widescreen layout and FSD architecture co-location verified.

### Tier 2: Boundary & Corner Cases (8 tests)
- `TC-T2-01`: TG=399 mg/dL calculates LDL vs TG=400 mg/dL suppresses calculation with `"Not calculated (TG ≥ 400)"`.
- `TC-T2-02`: Extreme hypertriglyceridemia (TG=1200 mg/dL): Non-HDL remains valid while LDL/VLDL invalid.
- `TC-T2-03`: Manual direct LDL override takes absolute priority and enables Castelli II even when TG >= 400.
- `TC-T2-04`: Age boundaries: Newborn (5 days) vs Pediatric (12 years, eGFR invalidation) vs Geriatric (85 years).
- `TC-T2-05`: Invoice boundaries: 0% discount, 100% charitable discount, and discount > gross total (net clamped to 0).
- `TC-T2-06`: Payment methods & debt protection: CASH, DEBT, and overpayment clamping (remaining clamped to 0).
- `TC-T2-07`: WhatsApp readiness guards: incomplete tests disable link, missing phone disables link, phone normalized.
- `TC-T2-08`: Bilirubin boundary: Direct Bilirubin > Total Bilirubin returns null with error message.

### Tier 3: Cross-Feature Combinations (5 tests)
- `TC-T3-01`: Test selection simultaneously updates tube badges, results rows, and invoice summary.
- `TC-T3-02`: Live result entry triggers lipid calculations and cascades to Print & WhatsApp payloads.
- `TC-T3-03`: Demographics update re-evaluates reference ranges in results grid without losing entered values.
- `TC-T3-04`: Quick bundle application merges cleanly with pre-selected tests without duplicating.
- `TC-T3-05`: Technician role enforcement hides invoice prices across all views while preserving workflow operations.

### Tier 4: Real-World Clinical Application Scenarios (2 tests)
- `TC-T4-01`: **Comprehensive Health Checkup Workflow**:
  Intake (52yo Male) -> F2 Comprehensive Bundle (CBC, Lipid, Creatinine, FBS) -> EDTA & SST Badges -> Results Entry -> Auto-calc LDL & eGFR -> 10% Discount CASH -> Save -> Verify Barcode & WhatsApp Payload.
- `TC-T4-02`: **Urgent STAT Cardiac Patient Workflow**:
  Emergency Intake (68yo Female) -> STAT priority toggle -> Troponin I + Lipid Profile -> Troponin PANIC status pill (`CRITICAL_PANIC`) -> TG=480 mg/dL invalidation -> Direct LDL override entered -> STAT Barcode & Emergency Print Payload generated.

---

## 4. How to Execute the Test Suite

### All-in-One Console E2E Runner (Mandatory Milestone Runner):
```powershell
npx tsx tests/e2e/unified-workspace.test.ts
```

### Full Master Regression Suite (Legacy Overhaul Track):
```powershell
npx tsx tests/e2e/run_all.ts
```

---

## 5. Execution Metrics & Status
- **Test Suites**: 9 suites
- **Total Test Cases**: 47 test cases
- **Passed**: 47 (100%)
- **Failed**: 0 (0%)
- **Execution Time**: ~0.03 seconds
