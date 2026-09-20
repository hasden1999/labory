# Original User Request

## 2026-08-31T20:00:54Z

Full-scale overhaul and production-grade implementation of the Labryo Clinical Laboratory Information System (LIS) based on international diagnostic standards (Epic Beaker, Cerner PathNet, Orchard Harvest, SCC SoftLab).

Requested team structure: Hierarchical multi-agent team: Lead Supervisor overseeing specialized feature subagents, granular sub-subagents, and an independent QA/Code Reviewer verifying all deliverables.

Working directory: d:\lab\apps\web
Integrity mode: development

## Requirements

### R1. Universal Visual A4 Form Designer & Custom Report Print Engine
- Deliver a live visual form designer allowing laboratory administrators to customize 100% of the printed A4 medical report.
- Support both **Pre-Printed Paper (Letterhead Mode)** with custom top/bottom millimeter margin adjustments, and **Digital Header Mode** (logo upload, alignment, doctor licenses, accreditation badges).
- Provide 5 standard clinical report templates: Classic Hospital, Modern Gradient Tech, Executive Luxury, Compact Dual-Column, and Specialized Multi-Part.
- Include dynamic verification QR codes on reports linking to online validation.

### R2. Specialized Clinical Result Entry Workstations
- Build dedicated, high-speed clinical workstations for major laboratory departments:
  - **G.U.E Workstation**: 3-part layout (Physical, Chemical, Microscopic HPF) with simultaneous multi-crystal selection matrix (Ca. Oxalate, Uric Acid, Triple Phosphate, Amorphous) and microorganism selectors.
  - **G.S.E Workstation**: Stool physical characteristics, occult blood (FOBT), parasites/ova, and microscopic findings.
  - **Hematology & CBC Workstation**: Complete blood count parameters with visual normal/abnormal badges.
  - **Clinical Chemistry & Endocrinology Workstation**: Grid-based numeric entry with instant abnormal/panic value flagging.
  - **Microbiology & Antibiogram Workstation**: Organism isolation and antibiotic sensitivity matrix (Sensitive / Intermediate / Resistant).

### R3. Clinical Intelligence, Auto-Calculations & Delta Check Engine
- Implement automatic clinical formula calculations in real-time during result entry (e.g. eGFR via CKD-EPI/MDRD, LDL via Friedewald equation, Indirect Bilirubin, Anion Gap).
- Provide historical **Delta Check** alerts when a patient's current result deviates significantly from their prior visit.
- Support one-click direct WhatsApp report delivery and PDF generation.

### R4. Fast Patient Intake & Reception Modernization
- Modernize the patient intake screen with keyboard-first navigation (Tab/Enter/hotkeys), patient search autocomplete with historical visit preview, barcode label generation, and comprehensive financial discount / referring doctor commission tracking.

### R5. Independent QA & Multi-Tier Verification Protocol
- An independent review agent must execute end-to-end static analysis, Next.js build verification (npm run build:web with exit code 0), and check all clinical forms and print outputs against the requirements.

## Acceptance Criteria

### Form Designer & Print Engine
- [ ] Changing report template, margins, header styles, or colors in Settings instantly reflects in the live preview and in the /api/samples/[id]/print route.
- [ ] Letterhead mode successfully hides digital headers and applies the user-defined top margin for pre-printed paper.
- [ ] Verification QR code renders cleanly on printed A4 reports.

### Clinical Workstations
- [ ] G.U.E workstation allows selecting multiple crystals simultaneously (e.g. Calcium Oxalate ++ and Uric Acid +) and persists all values cleanly.
- [ ] G.S.E, CBC, Chemistry, and Microbiology workstations allow rapid data entry and display appropriate reference ranges.
- [ ] Results saved via workstations update the sample status to READY and generate printable reports without API errors.

### Build & Code Integrity
- [ ] npm run build:web in d:\lab executes successfully with 0 errors and all dynamic/static routes generated.
- [ ] No Character Encoding / Mojibake distortion in Arabic text across all interfaces.
- [ ] All code changes reviewed and approved by the QA/Reviewer agent before final delivery.

## 2026-09-19T21:17:25Z

Comprehensive performance overhaul and production release for Labryo LIMS: eliminate cold start latency, enable hardware graphics acceleration, convert blocking disk I/O into high-speed asynchronous caching/indexing, and package the final production update.

Working directory: D:\lab
Integrity mode: development

## Requirements

### R1. Hardware Graphics Acceleration & UI Smoothness
Restore full GPU hardware acceleration in Electron by removing blocking flags (`disableHardwareAcceleration`, `disable-gpu`, `disable-software-rasterizer`). Ensure all window transitions, animations, and large patient/test tables render smoothly at 60 FPS without CPU-bound software rasterization.

### R2. Instant Startup & Background Launch
Configure silent background launch on Windows startup (`openAtLogin: true`, `openAsHidden: true`) so the engine is pre-warmed. Streamline the main window loading sequence so that warm-start launches occur in under 500ms and cold starts transition immediately without unnecessary polling intervals.

### R3. High-Performance Data Layer & Non-blocking I/O
Eliminate synchronous disk writes (`fs.writeFileSync`, `fs.copyFileSync`) on every patient/sample mutation that block the Node.js event loop. Implement asynchronous / debounced atomic persistence and client-side catalog caching (for tests, panels, and doctors) so navigation and data entry are instantaneous.

### R4. Verification & Production Release Build
Run end-to-end flow simulation and automated tests to guarantee zero regression on sample intake, results entry, and licensing. Build the standalone Next.js server and package the final NSIS desktop installer (`npm run dist` / `build-standalone-installer.js`) ready for user deployment.

## Acceptance Criteria

### Performance & Latency
- [ ] Electron main process starts without `--disable-gpu` or `app.disableHardwareAcceleration()` calls.
- [ ] No synchronous `fs.writeFileSync` calls execute on the main HTTP request thread during patient/sample creation.
- [ ] Client-side catalog requests (tests and doctors) do not block page rendering upon navigation.
- [ ] `openAtLogin` and `openAsHidden` settings are enabled in the desktop app configuration.

### Integrity & Stability
- [ ] All automated tests in `tools/simulate_all_flows.ts` pass with 100% success.
- [ ] Licensing verification, hardware ID computation, and trial protection remain fully functional and tamper-resistant.
- [ ] Backups and data integrity safeguards remain intact with zero data loss.

### Packaging & Release
- [ ] Standalone engine bundle builds cleanly without compilation or bundling errors.
- [ ] Desktop installer (`.exe`) is generated in `apps/desktop/dist/` ready for distribution.

## 2026-09-20T06:40:31Z

Comprehensive architectural overhaul and enterprise production upgrade of Labryo Clinical LIS (`d:\lab`) across 6 core healthcare modules: Unified Single-Page Report Form Builder & Multi-Template Engine, Smart Laboratory Reagents Inventory & Expiry Control, Zero-Simulation Real Instrument Interfacing (ASTM/HL7 & CBC with Histograms), Persistent LAN Server with Auto-Install PWA, Mobile-First Responsive Healthcare UX, and Unified Financial Hub.

Working directory: d:\lab
Integrity mode: development

---

## Requirements

### R1. Unified Report Form Settings & Multi-Template Engine
- Eliminate fragmented report settings by consolidating all form and print configuration into a single centralized, fluid Form Builder page with a real-time live preview panel.
- Implement a multi-template design engine offering at least 5 distinct printable clinical report templates:
  1. Classic Official Hospital (الرسمي المعتمد للمستشفيات)
  2. Modern Gradient Tech (التقني الحديث)
  3. Compact Dual-Column (المدمج ثنائي الأعمدة)
  4. Luxury Executive (التنفيذي الفاخر)
  5. High-Contrast Black & White (الأبيض والأسود عالي التباين للطابعات الليزرية والاقتصادية)
- Provide granular visual customization for each template: customizable headers and footers, digital laboratory logo upload/alignment, millimeter margin adjustments (top, bottom, left, right), typography and font scaling, Arabic/English bilingual labels, dynamic normal reference interval presentation, panic flag highlights, and clinical comments section.

### R2. Laboratory Reagents Inventory & Smart Expiry Control
- Build a dedicated laboratory inventory management module tracking reagents, diagnostic kits, and consumables with catalog codes, lot numbers, received dates, open-vial stability, and quantities on hand.
- Implement an intelligent, customizable expiration warning system allowing per-reagent / per-test configurable warning thresholds (e.g., 30 days ahead for standard biochemistry kits, 7 days for perishable open reagents).
- Provide visual dashboard status badges (Normal, Approaching Expiry, Expired, Low Stock) and automated alerts notifying laboratory staff of critical inventory states before running patient tests.

### R3. Real Instrument Interfacing & Zero-Simulation CBC Automation
- Completely eradicate all mock/simulation modes, dummy generators, and test stubs from production communication paths to make the interfacing 100% production-grade.
- Fully activate direct hardware interfacing via Serial (RS232 / COM ports) and TCP/IP LAN sockets compliant with ASTM E1381/E1394 and HL7 clinical protocol standards.
- Fully automate CBC hematology analyzer integration: parse raw instrument frames to extract 16+ hematology parameters and graphical RBC/PLT/WBC histograms, automatically link results to the matching patient sample by barcode/sample ID without human intervention.
- Provide multiple CBC report print layouts (vertical tabular, classic laboratory grid, with/without histogram plots).
- Integrate an instrument monitoring dashboard displaying real-time connection status, raw message logs, and last received transmissions.
- Add an application version management tab in Settings displaying the current installed version and a manual "Check for Updates" trigger button interacting with the auto-update pipeline.

### R4. Persistent LAN Server & Progressive Web App (PWA)
- Configure and harden the internal LAN server to broadcast and bind reliably to local network interfaces (e.g., `http://192.168.x.x:8080`), ensuring persistent uninterrupted connectivity across multiple workstation PCs and mobile devices as long as the host server is active.
- Transform the web application into a complete Progressive Web App (PWA):
  - Configure a robust `manifest.json` with laboratory branding, icons, theme colors, and standalone display mode.
  - Implement a production-grade Service Worker handling asset caching and offline resilience for core intake workflows.
  - Implement an automated in-app install prompt banner prompting users on secondary network devices to install the app with one click to desktop or mobile home screens as a standalone window.

### R5. Mobile-First Responsive Healthcare UX
- Overhaul layout and styling to provide a fully responsive, touch-friendly mobile interface that adapts seamlessly when accessed from smartphones and tablets.
- Build dedicated touch-optimized workflows for:
  - Rapid patient intake and search.
  - Worklist results verification and report readiness review.
  - Quick payment recording and balance settlement.
  - High-level laboratory analytics and daily throughput statistics.
- Ensure all interactive elements (buttons, inputs, modal drawers) meet touch target guidelines (minimum 44x44px) with zero horizontal overflow on mobile viewports.

### R6. Unified Financial Hub & Aggregated Reporting
- Merge fragmented financial workflows (expenses, daily collections/intake cash, and patient/clinic receivables/debts) into a single unified Financial Hub.
- Implement structured voucher management: Cash In (سندات قبض) and Cash Out (سندات صرف) with categorized cost centers and payment method tracking (Cash, Card, Transfer, Debt).
- Deliver comprehensive aggregated analytical reports (Gross Revenue, Operational Expenses, Net Operating Profit, Outstanding Accounts Receivable/Debt) with granular date range filters (Daily, Weekly, Monthly, Custom) and export/print capability.

---

## Acceptance Criteria

### Build & Architectural Integrity
- [ ] `npm run build:web` passes cleanly with 0 TypeScript and 0 Next.js compilation errors.
- [ ] `apps/server` builds cleanly via `tsc` or `npm run build` with 0 errors.
- [ ] Prisma database schema migrations apply cleanly and preserve existing patient, sample, and license records.

### Unified Form Builder (R1)
- [ ] Centralized Form Builder route exists and displays a live visual editor with side-by-side or split real-time preview.
- [ ] All 5 clinical report templates (Official Hospital, Modern Gradient Tech, Compact Dual-Column, Luxury Executive, B&W High-Contrast) render patient data, normal ranges, and barcodes correctly.
- [ ] Margin adjustments (mm) and header/footer customizations persist to settings and reflect immediately in generated A4 print/PDF outputs.

### Inventory & Expiry Control (R2)
- [ ] Users can register, edit, and adjust reagents and kits with lot numbers, expiry dates, and alert threshold days.
- [ ] The dashboard and inventory view accurately compute and visually flag items as "Critical" or "Expired" based on the custom threshold.
- [ ] Tests linked to expired reagents trigger a visual warning indicator during result entry.

### Instrument Interfacing & CBC (R3)
- [ ] Zero mock data generators exist in production TCP/serial ingest routes.
- [ ] Universal parser correctly parses standard ASTM E1381/E1394 and HL7 messages into structured results and histogram data.
- [ ] CBC report supports toggling histogram display and choosing between at least 2 distinct CBC layout templates.
- [ ] Settings page displays current application version (v1.0.3) with a working manual update check button.

### LAN Server & PWA (R4)
- [ ] Host machine network IP auto-detection displays the active LAN URL for other devices.
- [ ] PWA `manifest.json` and Service Worker are registered and functional.
- [ ] Visiting the LAN URL from a mobile browser or secondary PC displays the install prompt banner, allowing installation as a standalone PWA.

### Mobile-First UX (R5)
- [ ] Patient intake, sample status, and payment entry screens render without horizontal scroll or truncated text on a 375px mobile viewport.
- [ ] Touch gestures, bottom navigation/drawers, and responsive inputs operate smoothly on mobile devices.

### Unified Financial Hub (R6)
- [ ] Single route `/financials` aggregates cashflow, expenses, daily receipts, and debts.
- [ ] Users can record receipts (سند قبض) and payment vouchers (سند صرف) linked to doctors or patients.
- [ ] Financial report generates accurate net profit, total revenue, and outstanding debt summaries with custom date filters and printable format.
