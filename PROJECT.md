# Project: Labryo Clinical LIS Overhaul

## Architecture
- **Web App**: Next.js 14 App Router (`apps/web/src/app`), React 18, Tailwind/Vanilla CSS variables, Lucide React icons.
- **Backend & Data Stores**: Next.js App Router API endpoints with singleton server store (`apps/web/src/lib/serverStore.ts`) and Prisma ORM SQLite schema (`apps/server/prisma/schema.prisma`).
- **Clinical Intelligence Engine**: Pure TypeScript domain library (`apps/web/src/lib/clinicalIntelligence.ts` & `deltaCheck.ts`) for real-time mathematical calculations, diagnostic invalidation rules, reference intervals, and historical delta checks.
- **Workstation Subsystem**: Specialized result entry modules (`apps/web/src/components/workstations/`) for G.U.E, G.S.E, CBC Hematology, Chemistry/Endocrinology, and Microbiology/Antibiogram.
- **Print & Template Engine**: Dynamic A4 report generator (`apps/web/src/app/api/samples/[id]/print/route.ts`) supporting 5 clinical templates, Letterhead mm margins, dynamic QR verification, and multi-part sub-renderers.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Missing API Routes Fix | Add `/api/samples/[id]/barcode`, `/api/patients/[id]`, `/api/doctors` mutations, and `POST /api/settings` | M1 | Survey (Explorer 1, 3) [DONE] |
| 2 | Next.js Build Trace Fix | Add `apps/web/src/app/not-found.tsx` to eliminate Windows ENOENT build trace error | M1 | Survey (Explorer 1) [DONE] |
| 3 | Keyboard-First Reception | Support `F2` (New Intake), `F8` (Search), `F9` (Discount), `Ctrl+Enter` (Submit), and arrow catalog navigation | M1 | ORIGINAL_REQUEST §R4 [DONE] |
| 4 | Patient History Autocomplete | Autocomplete search returning prior visits, past abnormal results, debt alert, and "Repeat Last Tests" | M1 | ORIGINAL_REQUEST §R4 [DONE] |
| 5 | Discount & Commission Tracking | Intake sidebar discount controls (% & fixed IQD) and referring doctor commission calculation & persistence | M1 | ORIGINAL_REQUEST §R4 [DONE] |
| 6 | Barcode Label Generation | Tube label generation with barcode SVG and thermal print CSS (50x25mm) | M1 | ORIGINAL_REQUEST §R4 [DONE] |
| 7 | Clinical Calculation Library | Unified calculations for eGFR (2021 CKD-EPI), Friedewald LDL (TG>=400 invalidation), Indirect Bilirubin, Anion Gap, De Ritis, A/G Ratio, Corrected Calcium, eAG, Mentzer Index | M2 | ORIGINAL_REQUEST §R3 [DONE] |
| 8 | Historical Delta Check Engine | Cross-visit comparator with threshold alerts (Hb >=20%, Plt >=50%, Creatinine >=50%, K >=25%) and visual alert badges | M2 | ORIGINAL_REQUEST §R3 [DONE] |
| 9 | G.U.E Specialized Workstation | 3-part layout (Physical, Chemical, Microscopic HPF) with multi-crystal matrix and structured serialization | M3 | ORIGINAL_REQUEST §R2 |
| 10 | G.S.E Stool Workstation | 4-part layout (Physical, FOBT, Microscopic HPF, Parasitology protozoa/helminths matrix) | M3 | ORIGINAL_REQUEST §R2 |
| 11 | CBC Hematology Workstation | 16+ parameter grid, 5-part differential sum balance check ($\sum=100\%$), auto-indices, and morphology selectors | M3 | ORIGINAL_REQUEST §R2 |
| 12 | Chemistry & Endocrine Workstation | 3-tier visual badging (`NORMAL`, `ABNORMAL`, `CRITICAL PANIC`), dynamic age/gender reference ranges, rapid keypad navigation | M3 | ORIGINAL_REQUEST §R2 |
| 13 | Microbiology & Antibiogram Workstation | Specimen site, Gram stain, organism isolation, and 20+ antibiotic Sensitivity (S/I/R) matrix | M3 | ORIGINAL_REQUEST §R2 |
| 14 | Results Worklist Integration | Main results page workstation quick-launch buttons, real-time auto-calc triggering, and live Delta Check alerts | M3 | ORIGINAL_REQUEST §R2, §R3 |
| 15 | Live Visual Form Designer | Interactive live A4 report designer in Settings with real-time preview synchronization | M4 | ORIGINAL_REQUEST §R1 |
| 16 | Pre-Printed Letterhead Mode | Configurable millimeter margins (`topMarginMm`, `bottomMarginMm`, etc.) and digital header suppression | M4 | ORIGINAL_REQUEST §R1 |
| 17 | 5 Clinical Report Templates | Full implementation of Classic Hospital, Modern Gradient Tech, Executive Luxury, Compact Dual-Column, and Specialized Multi-Part | M4 | ORIGINAL_REQUEST §R1 |
| 18 | Dynamic Verification QR Code | Generate dynamic QR code on reports linking to `/verify/[id]` online verification route | M4 | ORIGINAL_REQUEST §R1 |
| 19 | Direct WhatsApp & PDF Delivery | Formatted WhatsApp message link generator and print/PDF export trigger | M4 | ORIGINAL_REQUEST §R3 |
| 20 | Print Styling & Encoding | `@media print` rules, avoid page breaks inside rows, and 100% UTF-8 Arabic text encoding (0 Mojibake) | M4 | ORIGINAL_REQUEST §R1, §R5 |
| 21 | Opaque-Box E2E Test Suite | Comprehensive multi-tier test harness (Tiers 1-4: Feature, Boundary, Combinatorial, Real-World Workloads) | TEST-E2E | ORIGINAL_REQUEST §R5 [DONE] |
| 22 | Adversarial Hardening & Build Verification | Tier 5 white-box challenger testing and clean `npm run build:web` with 0 errors | M5 | ORIGINAL_REQUEST §R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| TEST-E2E | E2E Testing Track | Independent opaque-box test runner, test fixtures, and Tiers 1-4 test suite | none | DONE |
| M1 | Core Routes, Build Trace & Intake Modernization | Missing API routes, not-found.tsx build fix, keyboard-first intake, autocomplete history preview, discounts, barcode generation | none | DONE |
| M2 | Clinical Intelligence & Delta Check Engine | TypeScript clinical calculation engine (eGFR, LDL, Indir Bil, Anion Gap, etc.) and historical Delta Check comparator | M1 | DONE |
| M3 | Specialized Clinical Result Entry Workstations | Dedicated workstations for G.U.E (crystals), G.S.E, CBC (diff balance), Chemistry (panic alerts), Microbiology (antibiogram), and results page integration | M1, M2 | DONE |
| M4 | Visual Form Designer & Custom Report Print Engine | 5 clinical templates, Letterhead mm margins, dynamic QR verification route, WhatsApp delivery, print route overhaul | M1, M2, M3 | DONE |
| M5 | Final E2E Test Pass, Adversarial Hardening & Multi-Tier QA | Pass 100% of E2E tests (153/153), Tier 5 challenger hardening, clean `npm run build:web` (0 errors), independent review & audit | TEST-E2E, M1, M2, M3, M4 | DONE |

## Interface Contracts

### Clinical Calculation Engine (`apps/web/src/lib/clinicalIntelligence.ts`)
```typescript
export interface CalculationInputs {
  age?: number;
  gender?: 'MALE' | 'FEMALE';
  creatinine?: number; // mg/dL
  totalCholesterol?: number; // mg/dL
  hdl?: number; // mg/dL
  triglycerides?: number; // mg/dL
  totalBilirubin?: number; // mg/dL
  directBilirubin?: number; // mg/dL
  sodium?: number; // mmol/L
  potassium?: number; // mmol/L
  chloride?: number; // mmol/L
  bicarbonate?: number; // mmol/L
  calcium?: number; // mg/dL
  albumin?: number; // g/dL
  totalProtein?: number; // g/dL
  ast?: number; // U/L
  alt?: number; // U/L
  hba1c?: number; // %
  fbs?: number; // mg/dL
  fastingInsulin?: number; // uIU/mL
  rbc?: number; // 10^6/uL
  mcv?: number; // fL
  hgb?: number; // g/dL
}

export interface CalculationResults {
  egfr?: { value: number; stage: string; note: string };
  ldl?: { value: number | null; invalidReason?: string };
  vldl?: { value: number | null };
  nonHdl?: { value: number };
  cardiacRiskRatio?: { value: number };
  indirectBilirubin?: { value: number | null; invalidReason?: string };
  anionGap?: { value: number; interpretation?: string };
  correctedCalcium?: { value: number };
  agRatio?: { value: number | null };
  deRitisRatio?: { value: number; interpretation?: string };
  eag?: { value: number };
  homaIr?: { value: number; interpretation?: string };
  mentzerIndex?: { value: number; interpretation: string };
}
```

### Delta Check Engine (`apps/web/src/lib/deltaCheck.ts`)
```typescript
export interface DeltaCheckResult {
  hasPrevious: boolean;
  previousValue?: number | string;
  previousSampleId?: string;
  previousDate?: string;
  currentValue?: number | string;
  deltaPercent?: number;
  isBreached: boolean;
  thresholdPercent?: number;
  badgeLevel: 'NORMAL' | 'SIGNIFICANT' | 'CRITICAL';
  message?: string;
}
```

## Code Layout
- `apps/web/src/app/page.tsx`: Reception / Intake screen
- `apps/web/src/app/not-found.tsx`: Next.js 14 static fallback page
- `apps/web/src/app/results/page.tsx`: Clinical Results Entry worklist
- `apps/web/src/app/settings/page.tsx`: Settings & Visual Form Designer
- `apps/web/src/app/verify/[id]/page.tsx`: Dynamic QR public verification route
- `apps/web/src/app/api/samples/[id]/print/route.ts`: Universal 5-template A4 print engine
- `apps/web/src/app/api/samples/[id]/barcode/route.ts`: Tube barcode thermal label route
- `apps/web/src/app/api/samples/[id]/results/route.ts`: Clinical result persistence route
- `apps/web/src/app/api/settings/route.ts`: Settings GET/POST route
- `apps/web/src/app/api/patients/[id]/route.ts`: Patient details GET/PATCH route
- `apps/web/src/app/api/patients/search/route.ts`: Patient autocomplete with history preview
- `apps/web/src/app/api/doctors/route.ts`: Referring doctor management routes
- `apps/web/src/lib/clinicalIntelligence.ts`: Clinical auto-calculations & formulas
- `apps/web/src/lib/deltaCheck.ts`: Historical Delta Check engine
- `apps/web/src/lib/serverStore.ts`: In-memory data store with full CRUD
- `apps/web/src/components/workstations/`: Specialized clinical entry modals
- `tests/e2e/`: Opaque-box E2E test suite (Tiers 1-4)
