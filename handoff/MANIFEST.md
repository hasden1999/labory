# Labryo LIMS â€” Handoff Package Manifest
> **Generated:** 2026-11-01 10:34 UTC
> **Total Files Copied:** 337
> **Total Size:** 4.16 MB (4366369 bytes)

---

## 1. Security & Redaction Log
- **Redacted Files:** `0` (Zero files required redaction).
- **Verification:** All copied files were scanned using rigorous regex patterns for API keys, private keys, JWT tokens, hardcoded passwords, and GitHub tokens (`ghp_`, `github_pat_`). Zero secrets or patient records exist in `handoff/`.
- **Protected Environment:** `.env` and `.env.local` files were strictly excluded from the copy.

---

## 2. Intentionally Excluded Files (Sensitive or Ephemeral)
| File / Directory Pattern | Reason for Exclusion | Alternative / Mitigation |
| :--- | :--- | :--- |
| `.env`, `.env.*` | Contains sensitive production secrets (`JWT_SECRET`, `BACKUP_ADMIN_SECRET`, private keys) | Documented in `PROJECT_CONTEXT.md` (Security section) |
| `apps/server/prisma/lab.db*` | Contains real operational laboratory data and patient medical records (PHI) | Seed script `seed.ts` and schema `schema.prisma` are provided |
| `apps/web/data/lab_store*.json` | Local runtime JSON database containing operational patient records | Structure defined in `apps/web/src/lib/serverStore.ts` |
| `apps/desktop/engine/`, `engine-legacy/` | Compiled binary distribution (~150 MB, Node.js binaries, pre-built Next standalone) | Generated dynamically via `npm run build` |
| `node_modules/` | Third-party dependency trees (>1 GB) | Re-installable via `npm install` |
| `.next/`, `dist/`, `build/` | Temporary build artifacts and compiled webpack bundles | Generated via `npm run build` / `npm run desktop:dist` |
| `package-lock.json` | Lockfile is 325 KB; name (`package-lock.json`) and `lockfileVersion: 3` recorded | Re-generated deterministically by npm |
| `.hwid_seal.json` | Local machine hardware fingerprint signature cache | Auto-generated on first boot by `apps/server/src/utils/licensing.ts` |

---

## 3. Complete Copied Files Inventory

| # | Relative Path | Purpose |
| :--- | :--- | :--- |
| 1 | $rel | Packaging configuration for Windows 7 SP1 32-bit legacy universal installer |
| 2 | $rel | NSIS custom installer script: firewall permissions, shortcuts, and auto-run config |
| 3 | $rel | NSIS installer script tailored for 32-bit legacy environments |
| 4 | $rel | Main Electron process entry: window creation, port discovery, process lifecycle, splash screen |
| 5 | $rel | Desktop package manifest, dependencies (electron-updater), and electron-builder modern config |
| 6 | $rel | Electron preload bridge exposing secure window.electronDesktop APIs to renderer |
| 7 | $rel | Child process supervisor for background LIS medical device bridge |
| 8 | $rel | Diagnostic script for validating PowerShell clipboard paste automation |
| 9 | $rel | Multi-channel auto-update manager (stable/legacy/beta) with update-loop guard |
| 10 | $rel | PowerShell native bridge for automated clipboard report paste into WhatsApp |
| 11 | $rel | Fastify backend manifest: dependencies (Prisma, Baileys, Puppeteer, Fastify) |
| 12 | $rel | Authoritative Prisma ORM schema: models, relations, indices, and constraints |
| 13 | $rel | Initial database seed: medical test catalog, default specialties, admin credentials |
| 14 | $rel | Project source module: apps/server/src/agent/lis-agent.js |
| 15 | $rel | Strict environment variable validation and runtime defaults |
| 16 | $rel | Fastify application entry point: plugin registration, routes, and server listen |
| 17 | $rel | Singleton Prisma client instance with connection pooling |
| 18 | $rel | Fastify route handlers for domain: archive |
| 19 | $rel | Fastify route handlers for domain: audit |
| 20 | $rel | Fastify route handlers for domain: auth |
| 21 | $rel | Fastify route handlers for domain: backup |
| 22 | $rel | Fastify route handlers for domain: debts |
| 23 | $rel | Fastify route handlers for domain: devices |
| 24 | $rel | Fastify route handlers for domain: doctors |
| 25 | $rel | Fastify route handlers for domain: expenses |
| 26 | $rel | Fastify route handlers for domain: financials |
| 27 | $rel | Fastify route handlers for domain: inventory |
| 28 | $rel | Fastify route handlers for domain: license |
| 29 | $rel | Fastify route handlers for domain: network |
| 30 | $rel | Fastify route handlers for domain: patients |
| 31 | $rel | Fastify route handlers for domain: reports |
| 32 | $rel | Fastify route handlers for domain: results |
| 33 | $rel | Fastify route handlers for domain: samples |
| 34 | $rel | Fastify route handlers for domain: settings |
| 35 | $rel | Fastify route handlers for domain: tests |
| 36 | $rel | Fastify route handlers for domain: whatsapp |
| 37 | $rel | Backend domain service: deviceEngine |
| 38 | $rel | Backend domain service: runTcpServer |
| 39 | $rel | Backend domain service: tcpDeviceServer |
| 40 | $rel | Backend domain service: whatsappService |
| 41 | $rel | Global backend ambient TypeScript declarations |
| 42 | $rel | Backend utility helper: audit |
| 43 | $rel | Backend utility helper: devicePresets |
| 44 | $rel | Backend utility helper: licensing |
| 45 | $rel | Backend utility helper: mdns |
| 46 | $rel | Clinical analyzer communication protocol parser: astmParser |
| 47 | $rel | Clinical analyzer communication protocol parser: csvParser |
| 48 | $rel | Clinical analyzer communication protocol parser: hl7Parser |
| 49 | $rel | Clinical analyzer communication protocol parser: universalParser |
| 50 | $rel | Backend utility helper: pdf |
| 51 | $rel | Backend utility helper: setupTestDevice |
| 52 | $rel | End-to-end integration test runner for medical analyzer communication flow |
| 53 | $rel | TypeScript compiler configuration for backend service |
| 54 | $rel | Next.js build configuration: standalone output, outputFileTracingRoot, asset redirects |
| 55 | $rel | Next.js generated TypeScript type definitions |
| 56 | $rel | Next.js 14 frontend dependencies, scripts (dev, build, start), and UI packages |
| 57 | $rel | Prisma schema duplicate optimized for Next.js standalone tracing |
| 58 | $rel | Progressive Web App (PWA) manifest for standalone tablet/browser install |
| 59 | $rel | PWA Service Worker for offline asset caching |
| 60 | $rel | Next.js API route handler for endpoint: /api/backup/export |
| 61 | $rel | Next.js API route handler for endpoint: /api/backup/list |
| 62 | $rel | Next.js API route handler for endpoint: /api/backup/restore |
| 63 | $rel | Next.js API route handler for endpoint: /api/backup/snapshot |
| 64 | $rel | Next.js API route handler for endpoint: /api/catalog/tests |
| 65 | $rel | Next.js API route handler for endpoint: /api/debts/[id]/settle-all |
| 66 | $rel | Next.js API route handler for endpoint: /api/debts/[id]/statement |
| 67 | $rel | Next.js API route handler for endpoint: /api/debts/[id]/transaction |
| 68 | $rel | Next.js API route handler for endpoint: /api/debts |
| 69 | $rel | Next.js API route handler for endpoint: /api/devices/[id]/mappings/[mapId] |
| 70 | $rel | Next.js API route handler for endpoint: /api/devices/[id]/mappings |
| 71 | $rel | Next.js API route handler for endpoint: /api/devices/[id] |
| 72 | $rel | Next.js API route handler for endpoint: /api/devices/[id]/test-simulate |
| 73 | $rel | Next.js API route handler for endpoint: /api/devices/agent-code |
| 74 | $rel | Next.js API route handler for endpoint: /api/devices/incoming-results/[id]/apply |
| 75 | $rel | Next.js API route handler for endpoint: /api/devices/incoming-results |
| 76 | $rel | Next.js API route handler for endpoint: /api/devices/ingest |
| 77 | $rel | Next.js API route handler for endpoint: /api/devices/presets |
| 78 | $rel | Next.js API route handler for endpoint: /api/devices |
| 79 | $rel | Next.js API route handler for endpoint: /api/doctors/[id] |
| 80 | $rel | Next.js API route handler for endpoint: /api/doctors |
| 81 | $rel | Next.js API route handler for endpoint: /api/expenses/[id] |
| 82 | $rel | Next.js API route handler for endpoint: /api/expenses |
| 83 | $rel | Next.js API route handler for endpoint: /api/financials/debts |
| 84 | $rel | Next.js API route handler for endpoint: /api/financials/expenses/[id] |
| 85 | $rel | Next.js API route handler for endpoint: /api/financials/expenses |
| 86 | $rel | Next.js API route handler for endpoint: /api/financials/shifts/close |
| 87 | $rel | Next.js API route handler for endpoint: /api/financials/shifts/current |
| 88 | $rel | Next.js API route handler for endpoint: /api/financials/shifts/history |
| 89 | $rel | Next.js API route handler for endpoint: /api/financials/shifts/open |
| 90 | $rel | Next.js API route handler for endpoint: /api/financials/summary |
| 91 | $rel | Next.js API route handler for endpoint: /api/financials/test-profitability |
| 92 | $rel | Next.js API route handler for endpoint: /api/inventory/[id]/open |
| 93 | $rel | Next.js API route handler for endpoint: /api/inventory/[id] |
| 94 | $rel | Next.js API route handler for endpoint: /api/inventory/alerts |
| 95 | $rel | Next.js API route handler for endpoint: /api/inventory |
| 96 | $rel | Next.js API route handler for endpoint: /api/license/activate |
| 97 | $rel | Next.js API route handler for endpoint: /api/license/status |
| 98 | $rel | Next.js API route handler for endpoint: /api/network/devices |
| 99 | $rel | Next.js API route handler for endpoint: /api/network/diagnostics |
| 100 | $rel | Real-time Server-Sent Events (SSE) broadcaster for multi-device LAN sync |
| 101 | $rel | LAN device pairing and cryptographic token issuance endpoint |
| 102 | $rel | Next.js API route handler for endpoint: /api/network/shortcut |
| 103 | $rel | Next.js API route handler for endpoint: /api/network/status |
| 104 | $rel | Next.js API route handler for endpoint: /api/patients/[id] |
| 105 | $rel | Next.js API route handler for endpoint: /api/patients |
| 106 | $rel | Next.js API route handler for endpoint: /api/patients/search |
| 107 | $rel | Next.js API route handler for endpoint: /api/reports/dashboard |
| 108 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/barcode |
| 109 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/critical-call |
| 110 | $rel | High-resolution PNG image generation endpoint for single-card reports |
| 111 | $rel | Multi-page report image generation endpoint for WhatsApp sharing |
| 112 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/pay |
| 113 | $rel | Server-side PDF generation endpoint using headless Puppeteer |
| 114 | $rel | Report body rendering: test tables, reference ranges, panic flags, special forms |
| 115 | $rel | Report header rendering: laboratory emblem, clinic metadata, patient banner |
| 116 | $rel | Core print report rendering route: generates full HTML report layout |
| 117 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/reject |
| 118 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/results |
| 119 | $rel | Next.js API route handler for endpoint: /api/samples/[id] |
| 120 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/status |
| 121 | $rel | Next.js API route handler for endpoint: /api/samples/[id]/tests |
| 122 | $rel | Next.js API route handler for endpoint: /api/samples |
| 123 | $rel | Next.js API route handler for endpoint: /api/settings |
| 124 | $rel | Next.js API route handler for endpoint: /api/specialties |
| 125 | $rel | Next.js API route handler for endpoint: /api/staff/[id] |
| 126 | $rel | Next.js API route handler for endpoint: /api/staff |
| 127 | $rel | Blank clinical exam worksheet generator for manual laboratory benches |
| 128 | $rel | Next.js API route handler for endpoint: /api/templates/clinical |
| 129 | $rel | Next.js API route handler for endpoint: /api/tests/[id] |
| 130 | $rel | Next.js API route handler for endpoint: /api/tests/convert-currency |
| 131 | $rel | Next.js API route handler for endpoint: /api/tests/duplicates |
| 132 | $rel | Next.js API route handler for endpoint: /api/tests/panels/[id] |
| 133 | $rel | Next.js API route handler for endpoint: /api/tests/panels |
| 134 | $rel | Next.js API route handler for endpoint: /api/tests/reset-prices |
| 135 | $rel | Next.js API route handler for endpoint: /api/tests |
| 136 | $rel | Next.js API route handler for endpoint: /api/verify/[id] |
| 137 | $rel | Next.js API route handler for endpoint: /api/version/check |
| 138 | $rel | WhatsApp bridge integration endpoint: connect |
| 139 | $rel | WhatsApp bridge integration endpoint: diagnostic-log |
| 140 | $rel | WhatsApp bridge integration endpoint: logout |
| 141 | $rel | WhatsApp bridge integration endpoint: send-media |
| 142 | $rel | WhatsApp bridge integration endpoint: send-result |
| 143 | $rel | WhatsApp bridge integration endpoint: share-desktop |
| 144 | $rel | WhatsApp bridge integration endpoint: status |
| 145 | $rel | Medical test catalog: test creation, reference ranges editor, price tiers |
| 146 | $rel | Project source module: apps/web/src/app/catalog/README.md |
| 147 | $rel | LAN device pairing screen for connecting reception PCs and technician tablets |
| 148 | $rel | Overview analytics dashboard: daily patient volume, revenue, pending samples |
| 149 | $rel | Patient debt management, payment settlement, and debtor ledgers |
| 150 | $rel | Medical analyzer devices: port config, ASTM/HL7 presets, incoming results queue |
| 151 | $rel | Project source module: apps/web/src/app/devices/README.md |
| 152 | $rel | Referring doctors management, commissions, and contact directories |
| 153 | $rel | Laboratory expense recording, categorization, and date filtering |
| 154 | $rel | Financial reporting: cash drawer shifts, revenue summaries, doctor commissions |
| 155 | $rel | Project source module: apps/web/src/app/financials/README.md |
| 156 | $rel | Global CSS styles, Tailwind directives, and clinical design tokens |
| 157 | $rel | Fast liveness health check probe endpoint |
| 158 | $rel | Reagent and inventory management, expiration tracking, stock alerts |
| 159 | $rel | Root HTML layout: RTL styling, font definitions, and top-level Providers wrapper |
| 160 | $rel | License management, MachineGuid HWID display, and activation code entry |
| 161 | $rel | Staff authentication and session creation login interface |
| 162 | $rel | Custom 404 Not Found error page |
| 163 | $rel | Intake console: patient registration, test cart, and immediate sample creation |
| 164 | $rel | Patient registry, visit history, sample search, inline editing, and printing |
| 165 | $rel | Project source module: apps/web/src/app/patients/README.md |
| 166 | $rel | Readiness healthcheck probe endpoint for Electron splash screen synchronization |
| 167 | $rel | Results workstation view (re-exports patients page) |
| 168 | $rel | Project source module: apps/web/src/app/results/README.md |
| 169 | $rel | Samples workstation view (re-exports patients page) |
| 170 | $rel | Project source module: apps/web/src/app/samples/README.md |
| 171 | $rel | Laboratory settings: profile, header styles, units, currencies, watermark |
| 172 | $rel | Project source module: apps/web/src/app/settings/README.md |
| 173 | $rel | Interactive showcase displaying all 25 laboratory report design templates |
| 174 | $rel | Staff management: user accounts, roles (OWNER, TECHNICIAN, RECEPTION), passwords |
| 175 | $rel | Public patient report verification page accessed via QR code on printed reports |
| 176 | $rel | Core application UI component: AppShell |
| 177 | $rel | Catalog management UI component: ReferenceRangesEditor |
| 178 | $rel | Shared UI form control component: ClinicalAgeInput |
| 179 | $rel | Shared UI form control component: MultiEntryCombobox |
| 180 | $rel | Shared UI form control component: ReferringDoctorSelect |
| 181 | $rel | Shared UI form control component: UpdateNotificationBanner |
| 182 | $rel | Core application UI component: ConfirmModal |
| 183 | $rel | Core application UI component: CriticalCallModal |
| 184 | $rel | Core application UI component: GlobalQuickBar |
| 185 | $rel | Core application UI component: LabContext |
| 186 | $rel | Core application UI component: LabOnboardingModal |
| 187 | $rel | Core application UI component: LabryoLogo |
| 188 | $rel | Core application UI component: logo/LogoSettingsControl |
| 189 | $rel | Core application UI component: network/NetworkSettingsPanel |
| 190 | $rel | Core application UI component: NetworkSyncProvider |
| 191 | $rel | Core application UI component: Providers |
| 192 | $rel | Core application UI component: PwaInstallPrompt |
| 193 | $rel | Core application UI component: SampleRejectionModal |
| 194 | $rel | Specialty and grouping UI selector: SpecialtiesManagerModal |
| 195 | $rel | Specialty and grouping UI selector: SpecialtySelector |
| 196 | $rel | Core application UI component: ThemeContext |
| 197 | $rel | Core application UI component: Toast |
| 198 | $rel | Core application UI component: TrialLockGuard |
| 199 | $rel | Core application UI component: UrineFormModal |
| 200 | $rel | Core application UI component: WhatsAppFormsModal |
| 201 | $rel | Interactive workspace tool: PaperDesignerV2 |
| 202 | $rel | Interactive workspace tool: TechnicianCommandCenter |
| 203 | $rel | Specialized clinical workstation modal: AmhFormModal |
| 204 | $rel | Specialized clinical workstation modal: BhcgFormModal |
| 205 | $rel | Specialized clinical workstation modal: CbcModal |
| 206 | $rel | Specialized clinical workstation modal: ChemistryModal |
| 207 | $rel | Specialized clinical workstation modal: ClinicalFormWorkstationModal |
| 208 | $rel | Specialized clinical workstation modal: GseModal |
| 209 | $rel | Specialized clinical workstation modal: MicrobiologyModal |
| 210 | $rel | Specialized clinical workstation modal: SemenFormModal |
| 211 | $rel | Isolated FSD feature component: manage-logo/index.ts |
| 212 | $rel | Isolated FSD feature component: manage-logo/ui/LogoSettingsControl.tsx |
| 213 | $rel | Client HTTP client with error handling, base URL detection, and token attach |
| 214 | $rel | Shared web utility module: backupSecurity |
| 215 | $rel | In-memory test catalog cache with atomic invalidation on updates |
| 216 | $rel | Shared web utility module: catalogData |
| 217 | $rel | Shared web utility module: clinicalIntelligence |
| 218 | $rel | Shared web utility module: clinicalTemplates |
| 219 | $rel | Shared web utility module: clinicalTemplatesConfig |
| 220 | $rel | Shared web utility module: currencies |
| 221 | $rel | Delta check calculator: evaluates significant percentage deviations from past visits |
| 222 | $rel | Shared web utility module: deviceEngine |
| 223 | $rel | Shared web utility module: devicePresets |
| 224 | $rel | Formatting utilities: Iraqi date/time, clinical age string, English digits |
| 225 | $rel | Shared web utility module: licensing |
| 226 | $rel | Shared web utility module: networkDeviceManager |
| 227 | $rel | Test ordering helpers, reference range matching, and age bracket conversion |
| 228 | $rel | Web Prisma client, SQLite WAL initialization, and safe runtime migrations (v145) |
| 229 | $rel | Shared web utility module: puppeteerImageGenerator |
| 230 | $rel | Cross-platform Chrome/Chromium launcher with pre-warming pool |
| 231 | $rel | Puppeteer report PDF generator with custom page size and margin support |
| 232 | $rel | Clinical options repository for qualitative tests (Positive/Negative, etc.) |
| 233 | $rel | High-performance in-memory state repository and atomic JSON file backup |
| 234 | $rel | Three-tier automated report dispatcher to patient WhatsApp |
| 235 | $rel | Bidirectional synchronizer between SQLite database and in-memory cache |
| 236 | $rel | Central test classifier: classifies tests to route to GUE, GSE, CBC, SFA, AMH, etc. |
| 237 | $rel | Shared web utility module: urlHelper |
| 238 | $rel | Shared web utility module: whatsappWebEngine |
| 239 | $rel | Next.js routing middleware: loopback full-access, backup auth, LAN device token enforcement |
| 240 | $rel | Project source module: apps/web/src/types/index.ts |
| 241 | $rel | Unified Clinical Console widget component: index.ts |
| 242 | $rel | Unified Clinical Console widget component: lib/catalogOrdering.ts |
| 243 | $rel | Unified Clinical Console widget component: lib/tubeBadges.ts |
| 244 | $rel | Unified Clinical Console widget component: lib/useShiftNavigation.ts |
| 245 | $rel | Unified Clinical Console widget component: model/types.ts |
| 246 | $rel | Unified Clinical Console widget component: model/useUnifiedWorkspace.ts |
| 247 | $rel | Unified Clinical Console widget component: ui/CatalogCartPanel.tsx |
| 248 | $rel | Unified Clinical Console widget component: ui/PatientCardPanel.tsx |
| 249 | $rel | Unified Clinical Console widget component: ui/ReceptionHeader.tsx |
| 250 | $rel | Unified Clinical Console widget component: ui/ReceptionSidebar.tsx |
| 251 | $rel | Unified Clinical Console widget component: ui/ResultsGridPanel.tsx |
| 252 | $rel | Unified Clinical Console widget component: ui/UnifiedActionBar.tsx |
| 253 | $rel | Unified Clinical Console widget component: ui/UnifiedWorkspace.tsx |
| 254 | $rel | TypeScript compiler configuration for Next.js App Router application |
| 255 | $rel | Vercel serverless deployment routing and header configuration |
| 256 | $rel | Project architecture documentation: ARCHITECTURE.md |
| 257 | $rel | Project architecture documentation: CHANGE_GUIDE.md |
| 258 | $rel | Project architecture documentation: DECISIONS.md |
| 259 | $rel | End-to-end regression testing framework configuration |
| 260 | $rel | PM2 process manager cluster configuration for server production deployments |
| 261 | $rel | Project architecture documentation: FEATURE_INVENTORY.md |
| 262 | $rel | Project architecture documentation: HANDOFF_CATALOG_DATA.md |
| 263 | $rel | Project architecture documentation: HANDOFF_DESIGN.md |
| 264 | $rel | Project architecture documentation: HANDOFF_FORMS.md |
| 265 | $rel | Project architecture documentation: HANDOFF_REPORTS.md |
| 266 | $rel | Root Next.js configuration redirect to apps/web |
| 267 | $rel | Monorepo root package manifest defining workspaces and root automation scripts |
| 268 | $rel | Core platform constants, version definitions, and runtime interfaces |
| 269 | $rel | Core platform constants, version definitions, and runtime interfaces |
| 270 | $rel | Core platform constants, version definitions, and runtime interfaces |
| 271 | $rel | Core platform constants, version definitions, and runtime interfaces |
| 272 | $rel | Standard clinical tests repository (650+ tests dictionary and reference ranges) |
| 273 | $rel | Standard clinical tests repository (650+ tests dictionary and reference ranges) |
| 274 | $rel | Standard clinical tests repository (650+ tests dictionary and reference ranges) |
| 275 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 276 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 277 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 278 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 279 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 280 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 281 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 282 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 283 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 284 | $rel | Clinical design tokens, RTL typography rules, colors, and primitive UI components |
| 285 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 286 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 287 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 288 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 289 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 290 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 291 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 292 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 293 | $rel | Clinical domain logic: range matching, eGFR, Friedewald LDL, age calculations |
| 294 | $rel | Declarative JSON schema definition for clinical form: cbc |
| 295 | $rel | Declarative JSON schema definition for clinical form: stool |
| 296 | $rel | Declarative JSON schema definition for clinical form: urine |
| 297 | $rel | Dynamic form rendering engine and input controls for clinical workstations |
| 298 | $rel | Dynamic form rendering engine and input controls for clinical workstations |
| 299 | $rel | Dynamic form rendering engine and input controls for clinical workstations |
| 300 | $rel | Dynamic form rendering engine and input controls for clinical workstations |
| 301 | $rel | Dynamic form rendering engine and input controls for clinical workstations |
| 302 | $rel | Internationalization dictionaries and Arabic/English locale helpers |
| 303 | $rel | Internationalization dictionaries and Arabic/English locale helpers |
| 304 | $rel | WhatsApp patient report message templates and bilingual formatting |
| 305 | $rel | WhatsApp patient report message templates and bilingual formatting |
| 306 | $rel | WhatsApp patient report message templates and bilingual formatting |
| 307 | $rel | Report data builders, grouping algorithms, and print structure templates |
| 308 | $rel | Report data builders, grouping algorithms, and print structure templates |
| 309 | $rel | Report data builders, grouping algorithms, and print structure templates |
| 310 | $rel | Report data builders, grouping algorithms, and print structure templates |
| 311 | $rel | Report data builders, grouping algorithms, and print structure templates |
| 312 | $rel | Cross-workspace shared helper primitives |
| 313 | $rel | Cross-workspace shared helper primitives |
| 314 | $rel | Project architecture documentation: RELEASE_CHECKLIST.md |
| 315 | $rel | Project architecture documentation: RELEASING.md |
| 316 | $rel | Database maintenance or migration script: apply_clinical_templates_patch.js |
| 317 | $rel | Database maintenance or migration script: merge_duplicates.js |
| 318 | $rel | Database maintenance or migration script: migrate_reference_ranges.js |
| 319 | $rel | Database maintenance or migration script: migrate_urine_chemical_results.js |
| 320 | $rel | Database maintenance or migration script: migrate-tube-type.ts |
| 321 | $rel | Deployment and release orchestration script: backup.js |
| 322 | $rel | Deployment and release orchestration script: deploy_lab.ps1 |
| 323 | $rel | Deployment and release orchestration script: deploy_lab.sh |
| 324 | $rel | Deployment and release orchestration script: emergency_rollback.ps1 |
| 325 | $rel | Deployment and release orchestration script: emergency_rollback.sh |
| 326 | $rel | Deployment and release orchestration script: index.js |
| 327 | $rel | Deployment and release orchestration script: pre_deploy_backup.ps1 |
| 328 | $rel | Deployment and release orchestration script: pre_deploy_backup.sh |
| 329 | $rel | Deployment and release orchestration script: publish_desktop_release.js |
| 330 | $rel | Deployment and release orchestration script: rollback.js |
| 331 | $rel | Deployment and release orchestration script: run_migrations.ps1 |
| 332 | $rel | Deployment and release orchestration script: run_migrations.sh |
| 333 | $rel | Deployment and release orchestration script: verify_health.ps1 |
| 334 | $rel | Deployment and release orchestration script: verify_health.sh |
| 335 | $rel | Developer tool or boundary checker: lint_boundaries.js |
| 336 | $rel | Project architecture documentation: TOUCH_POINTS.md |
| 337 | $rel | Monorepo root TypeScript compiler options |

---

## 4. Open Questions & Engineering Notes for External Engineer
1. **Dual Schema Synchronization:** Whenever altering database tables, ensure BOTH `apps/server/prisma/schema.prisma` and `apps/web/prisma/schema.prisma` are updated identically.
2. **Additive SQLite Migrations:** In production desktop mode, Prisma migration commands are not run. Always append additive SQL migrations to `apps/web/src/lib/prisma.ts` under an incremented `CURRENT_SCHEMA_VERSION`.
3. **Test Name Heuristics:** When modifying specialized tests in `apps/web/src/lib/testClassifier.ts`, ensure both English and Arabic common naming variations are maintained to preserve automatic workstation routing.
4. **Legacy 32-bit Compatibility:** If modifying native dependencies or Electron APIs, verify compatibility with Electron 22 / Node 18 on 32-bit architecture (`ia32`).
