# Labryo Clinical LIS - Test Infrastructure Documentation (`TEST_INFRA.md`)

## 1. Overview & Philosophy
The **Labryo Clinical LIS E2E Test Suite** provides an independent, opaque-box, requirement-driven verification harness grounded in clinical laboratory standards (IFCC, CLSI, KDIGO, ADA, WHO). The test harness validates functional correctness, mathematical calculations, clinical safety rules, template print layouts, and real-world clinical journeys across all four tiers of testing.

## 2. Directory Layout
```
d:\lab\tests\e2e\
├── harness\
│   ├── testRunner.ts           # Standalone async runner engine with describe/test, hooks, timing, and formatting
│   ├── assertions.ts           # Custom rich matcher library (toBe, toEqual, toBeCloseTo, toThrow, toContain, etc.)
│   ├── fixtures.ts             # Clinical fixtures (patients, doctors, catalog, workstations, templates, settings)
│   └── clinicalOracles.ts      # Authoritative clinical equations & diagnostic rule oracles
├── tier1_features\
│   ├── tier1_intake_reception.test.ts          # R4: Intake, hotkeys, search history, discounts, doctor commission
│   ├── tier1_gue_workstation.test.ts           # R2: G.U.E 3-part layout, multi-crystal matrix, bacteria/yeast
│   ├── tier1_gse_workstation.test.ts           # R2: G.S.E 4-part layout, FOBT, protozoa & helminths matrix
│   ├── tier1_cbc_workstation.test.ts           # R2: CBC 16+ parameters, 5-part diff balance (sum=100%), auto-indices
│   ├── tier1_chemistry_workstation.test.ts     # R2: Chemistry grid, 3-tier badging, life-threatening panic limits
│   ├── tier1_microbiology_workstation.test.ts  # R2: Microbiology, Gram stain, isolation, 20+ antibiogram S/I/R
│   ├── tier1_clinical_calculations.test.ts     # R3: 2021 CKD-EPI eGFR, Friedewald LDL, Anion Gap, De Ritis, Mentzer
│   ├── tier1_delta_checks.test.ts              # R3: Historical delta check comparator, cross-visit alert badges
│   ├── tier1_print_templates.test.ts           # R1: 5 templates (Classic, Modern, Executive, Compact, Specialized), UTF-8
│   ├── tier1_letterhead_margins.test.ts        # R1: Pre-printed letterhead mode, header hiding, millimeter margins
│   ├── tier1_qr_validation.test.ts             # R1: Dynamic QR code generation, positioning, public verify route
│   └── tier1_barcode_labels.test.ts            # R4: 50x25mm thermal print CSS, barcode SVG, sample data
├── tier2_boundary_corner\
│   └── tier2_boundaries_corners.test.ts        # TG >= 400 invalidation, DB > TB error, diff != 100%, extreme ages/GFR
├── tier3_combinations\
│   └── tier3_cross_feature.test.ts             # Cross-feature interactions: Intake -> Multi-dept -> Delta -> Print -> WhatsApp
├── tier4_clinical_scenarios\
│   └── tier4_clinical_scenarios.test.ts        # Full end-to-end clinical patient journeys (Diabetic, Oncology, ICU, Pediatric)
└── run_all.ts                                  # Master CLI runner orchestrating all test suites
```

## 3. Test Tiers Structure

### Tier 1: Feature Coverage (>= 5 test cases per feature across R1-R4)
- **Intake & Reception Modernization (`tier1_intake_reception.test.ts`)**: 6 tests
- **G.U.E Specialized Workstation (`tier1_gue_workstation.test.ts`)**: 5 tests
- **G.S.E Stool Workstation (`tier1_gse_workstation.test.ts`)**: 5 tests
- **Hematology & CBC Workstation (`tier1_cbc_workstation.test.ts`)**: 6 tests
- **Clinical Chemistry & Endocrine (`tier1_chemistry_workstation.test.ts`)**: 6 tests
- **Microbiology & Antibiogram (`tier1_microbiology_workstation.test.ts`)**: 5 tests
- **Clinical Calculation Engine (`tier1_clinical_calculations.test.ts`)**: 6 tests
- **Historical Delta Checks (`tier1_delta_checks.test.ts`)**: 6 tests
- **5 Standard Print Templates (`tier1_print_templates.test.ts`)**: 6 tests
- **Pre-Printed Letterhead Margins (`tier1_letterhead_margins.test.ts`)**: 6 tests
- **Dynamic QR Verification (`tier1_qr_validation.test.ts`)**: 5 tests
- **Barcode Thermal Labels (`tier1_barcode_labels.test.ts`)**: 5 tests

### Tier 2: Boundary & Corner Cases (`tier2_boundaries_corners.test.ts`) - 15 tests
- Exact boundary $TG = 399$ (valid LDL) vs $TG = 400$ (invalidated LDL returning `null`).
- Severe chylomicronemia ($TG = 1250$ mg/dL) invalidation rationale.
- Impossible clinical state $DB > TB$ triggering clinical error.
- Conjugated hyperbilirubinemia boundary $DB == TB \to \text{Indirect} = 0.0$.
- CBC 5-part differential under-count (94.0%) and over-count (107.0%) rejection.
- CBC 5-part differential floating point tolerance ($100.04\% \to \text{valid}$).
- CKD-EPI geriatric boundary (Age 105), severe muscle wasting (Creatinine 0.1), and anuric uremia (Creatinine 15.0).
- Financial edge cases: 100% charitable discount, change return on overpayment.
- Security & character escaping: Arabic diacritics / Tashkeel, quotes, and HTML special chars.
- Stress boundary: 4,000+ character clinical notes.

### Tier 3: Cross-Feature Combinations (`tier3_cross_feature.test.ts`) - 6 tests
- Intake reception $\to$ discount $\to$ doctor commission $\to$ barcode generation.
- Multi-department workstation entry $\to$ real-time CKD-EPI, De Ritis, A/G ratio auto-calc.
- Workstation result entry $\to$ historical delta check comparator alert triggering.
- Lipid profile entry $\to$ TG threshold detection and dynamic UI calculation branching.
- Multi-department sample $\to$ 5 print templates $\to$ dynamic QR validation.
- Results completion $\to$ formatted WhatsApp direct link generation.

### Tier 4: Real-World Clinical Scenarios (`tier4_clinical_scenarios.test.ts`) - 5 tests
- **Scenario 1**: Diabetic Nephropathy & Metabolic Syndrome Full Journey.
- **Scenario 2**: Acute Hematologic Crisis (Severe Pancytopenia & Critical Panic Alert).
- **Scenario 3**: Urosepsis with ESBL *E. coli* & Antibiogram Antibiotherapy Optimization.
- **Scenario 4**: Pediatric Acute Amoebic Colitis Journey (GSE 4-Part + FOBT + Protozoa).
- **Scenario 5**: Pre-Printed Letterhead Batch Workflow with Custom Millimeter Margins.

---

## 4. How to Execute Tests

### Full Test Suite Run:
```powershell
npx tsx tests/e2e/run_all.ts
```

### Individual Suite Run:
```powershell
npx tsx tests/e2e/tier1_features/tier1_clinical_calculations.test.ts
```

---

## 5. Execution Metric Summary
- **Total Test Suites**: 15 suites
- **Total Test Cases**: 93 test cases
- **Passed**: 93 (100%)
- **Failed**: 0 (0%)
- **Execution Time**: ~0.04s - 0.08s
